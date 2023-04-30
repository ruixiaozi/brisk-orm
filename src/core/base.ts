import { getLogger, LOGGER_LEVEL_E } from 'brisk-log';
import mysql, { QueryOptions } from 'mysql2/promise';
import * as runtime from 'brisk-ts-extends/runtime';
import { Class, isLike } from 'brisk-ts-extends';
import {
  BriskOrmConnectOption,
  BriskOrmContext,
  BriskOrmDeleteFunction,
  BriskOrmEntityMapping,
  BriskOrmInsertFunction,
  BriskOrmOperationResult,
  BriskOrmResultOption,
  BriskOrmSelectFunction,
  BriskOrmUpdateFunction,
} from '../types';

let pool: mysql.Pool | undefined;

const defaultRegion = Symbol('briskOrm');

const logger = getLogger(defaultRegion);
logger.configure({
  // 默认是info级别，可通过配置全局来改变此等级
  level: LOGGER_LEVEL_E.info,
});


export function connect(option: BriskOrmConnectOption) {
  pool = mysql.createPool(option);
  logger.debug('create pool', option);
}

export function distory() {
  return pool?.end().catch((error) => {
    logger.error('stop error', error);
    throw error;
  });
}

/**
 * 开启手动事务
 * @returns ctx BriskOrmContext
 */
export async function startTransaction(): Promise<BriskOrmContext> {
  const connection = await pool?.getConnection();
  await connection?.beginTransaction();
  logger.debug('transaction start');
  return {
    rollback: async(transactionName) => {
      logger.warn(`${transactionName} Transaction Rollback!`);
      await connection?.rollback();
    },
    commit: () => {
      logger.debug('transaction commit');
      return connection?.commit();
    },
    end: () => {
      logger.debug('transaction end');
      return connection?.release();
    },
    query: (options: QueryOptions) => connection?.query(options),
  };
}

/**
 * 自动事务
 * @param handler 事务实际业务处理器
 * @param transactionName 事务名称，用于表示当前事务
 */
export async function transaction(handler: (ctx: BriskOrmContext) => any, transactionName: string) {
  const ctx = await startTransaction();
  try {
    await Promise.resolve(handler(ctx));
    await ctx.commit();
  } catch (error) {
    await ctx.rollback(transactionName);
    throw error;
  } finally {
    ctx.end();
  }
}

function query(sql: string, params?: any[], ctx?: BriskOrmContext): Promise<any> | undefined {
  let operator = ctx || pool;
  logger.debug(`query  ---> '${mysql.format(sql, params)}'`);
  return operator?.query({
    sql,
    values: params,
    typeCast: (field: any, next: any) => {
      // 转换TINYINT
      if (field.type === 'TINY' && field.length === 1) {
        // 1 = true, 0 = false
        return (field.string() === '1');
      }
      if (field.type === 'BLOB') {
        // text类型(这里会返回blob类型)默认用来存json
        const textRes = field.string();
        try {
          return JSON.parse(textRes);
        } catch (err) {
          return textRes;
        }
      }
      return next();
    },
  })?.then((res) => {
    logger.debug(`result <--- \n'${JSON.stringify(res)}'`);
    return res?.[0];
  });
}

// 保存有id的select方法
const selectFunctions = new Map<string, BriskOrmSelectFunction>();

// 对结果对象的值进行处理
function getValueProperty(value: any, key: string) {
  const res = value?.[key];
  if (res === undefined || res === null) {
    return undefined;
  }
  return res;
}

async function transEntiry<T>(value: any, Target: Class<T>, mapping: BriskOrmEntityMapping) {
  const resTarget = new Target();
  const entities = Object.entries(mapping);
  for (let [clsProp, db] of entities) {
    if (typeof db === 'string') {
      const propertyValue = getValueProperty(value, db);
      // 如果数据库中为NULL的值，这里将转换为undefined，不写入对象中
      if (propertyValue !== undefined) {
        (resTarget as any)[clsProp] = propertyValue;
      }
    } else {
      const selectFunc = selectFunctions.get(db.selectId);
      if (!selectFunc) {
        continue;
      }
      if (db.targetDbProp) {
        (resTarget as any)[clsProp] = await selectFunc(db.targetDbProp, getValueProperty(value, db.dbProp));
      } else {
        // 将对应的值作为查询条件
        (resTarget as any)[clsProp] = await selectFunc(getValueProperty(value, db.dbProp));
      }
    }
  }

  return resTarget;
}

/**
 * 获取一个select方法，用于查询
 * @param sql sql语句
 * @param Target 结果对象的类
 * @param option 结果选项
 * @param id sql语句的唯一标识
 * @param sqlArgs 作为原生SQL插入的参数序号
 * @returns select方法
 */
export function getSelect<T>(
  sql: string,
  Target?: Class,
  option?: BriskOrmResultOption,
  id?: string,
  sqlArgs?: number[],
): BriskOrmSelectFunction<T> {
  const selectFunc = async(...args: any[]) => {
    try {
      const ctx = args[args.length - 1];
      const isContext = isLike<BriskOrmContext>(ctx);

      const targetDes = runtime.get(Target?.name || '');

      // 将类型描述中字段转换成mapping
      let mapping = targetDes?.properties?.reduce?.((pre, current) => {
        pre[current.key] = current.key;
        return pre;
      }, {} as BriskOrmEntityMapping) || {};

      // 如果Result里面传入了mapping，覆盖默认的映射
      if (option?.mapping) {
        mapping = {
          ...mapping,
          ...option.mapping,
        };
      }
      const argsRes = (isContext ? args.slice(0, args.length - 1) : args).map((item, index) => {
        if (sqlArgs?.includes(index)) {
          return {
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function') ? item.toSqlString(mapping) : item),
          };
        }
        return item;
      });
      const res = await query(sql, argsRes, isContext ? ctx : undefined);
      // 如果是查询的count
      if (option?.isCount) {
        return res?.[0]?.['count(*)'] || 0;
      }

      // 如果没有指定Result，或者没有类型描述，或者返回一个空值
      if (!Target || !targetDes || res === undefined || res === null) {
        return res;
      }


      if (Array.isArray(res)) {
        // 只有当Result里面设置了isList才返回数组，否则返回第一个数据
        if (option?.isList) {
          return Promise.all(res.map((item) => transEntiry(item, Target, mapping)));
        }
        return res.length ? transEntiry(res[0], Target, mapping) : undefined;
      }
      return transEntiry(res, Target, mapping);
    } catch (error) {
      logger.error('select error ', error);
      throw error;
    }
  };

  if (id) {
    selectFunctions.set(id, selectFunc);
  }

  return selectFunc;
}

function transToValue(_value: any) {
  // 空和非对象，都直接返回
  if (!_value || typeof _value !== 'object') {
    return _value;
  }

  // 处理对象为json
  try {
    return JSON.stringify(_value);
  } catch (error) {
    logger.error(`${transToValue.name}: transjson error:`, error);
    throw new Error('');
  }
}


function transToValues(data: any, propertis: string[]): any[] {
  if (typeof data !== 'object') {
    return [];
  }

  // 数组，则转换成一个二维数组，子数组为对象的值数组
  if (Array.isArray(data)) {
    return data.map((item) => transToValues(item, propertis)[0]);
  }
  return [propertis.map((item) => transToValue(data[item]))];
}

/**
 * 获取一个insert方法，用于插入数据
 * @param sql sql语句
 * @param propertis 插入对象字段列表，需要按顺序
 * @returns insert方法
 */
export function getInsert<T>(
  sql: string,
  propertis: string[],
): BriskOrmInsertFunction<T> {
  const insertFunc = async function(data: T, ctx?: BriskOrmContext) {
    try {
      const res = await query(sql, [transToValues(data, propertis)], ctx);
      return {
        success: res ? !res.fieldCount : false,
        affectedRows: res?.affectedRows || 0,
      } as BriskOrmOperationResult;
    } catch (error) {
      logger.error('insert error ', error);
      throw error;
    }
  };
  return insertFunc;
}

/**
 * 获取一个update方法，用于更新
 * @param sql sql语句
 * @param propertis 修改对象的字段列表，需要按set顺序填写
 * @param mapping 映射对象
 * @param sqlArgs 作为原生SQL插入的参数序号
 * @returns
 */
export function getUpdate<T>(
  sql: string,
  propertis: string[],
  mapping?: BriskOrmEntityMapping,
  sqlArgs?: number[],
): BriskOrmUpdateFunction<T> {
  const updateFunc = async(data: T, ...args: any[]) => {
    try {
      const ctx = args[args.length - 1];
      const isContext = isLike<BriskOrmContext>(ctx);
      const argsRes = (isContext ? args.slice(0, args.length - 1) : args).map((item, index) => {
        // 加一是因为data作为第一个参数
        if (sqlArgs?.includes(index + 1)) {
          return {
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function') ? item.toSqlString(mapping) : item),
          };
        }
        return item;
      });
      const values = [...(transToValues(data, propertis)[0]), ...argsRes];
      const res = await query(sql, values, isLike<BriskOrmContext>(ctx) ? ctx : undefined);
      return {
        success: res ? !res.fieldCount : false,
        affectedRows: res?.affectedRows || 0,
      } as BriskOrmOperationResult;
    } catch (error) {
      logger.error('update error ', error);
      throw error;
    }
  };

  return updateFunc;
}

/**
 * 获取一个delete方法，用于更新
 * @param sql sql语句
 * @param mapping 映射对象
 * @param sqlArgs 作为原生SQL插入的参数序号
 * @returns
 */
export function getDelete(
  sql: string,
  mapping?: BriskOrmEntityMapping,
  sqlArgs?: number[],
): BriskOrmDeleteFunction {
  const deleteFunc = async(...args: any[]) => {
    try {
      const ctx = args[args.length - 1];
      const isContext = isLike<BriskOrmContext>(ctx);
      const argsRes = (isContext ? args.slice(0, args.length - 1) : args).map((item, index) => {
        if (sqlArgs?.includes(index)) {
          return {
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function') ? item.toSqlString(mapping) : item),
          };
        }
        return item;
      });
      const res = await query(sql, argsRes, isContext ? ctx : undefined);
      return {
        success: res ? !res.fieldCount : false,
        affectedRows: res?.affectedRows || 0,
      } as BriskOrmOperationResult;
    } catch (error) {
      logger.error('delete error ', error);
      throw error;
    }
  };

  return deleteFunc;
}
