/* eslint-disable id-length */
import { getLogger, LOGGER_LEVEL_E } from 'brisk-log';
import mysql, { QueryOptions } from 'mysql2/promise';
import * as runtime from 'brisk-ts-extends/runtime';
import { Class, isLike, PropertiesDes } from 'brisk-ts-extends';
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
  BriskOrmInnerClass,
  BRISK_ORM_FOREIGN_ACTION_E,
} from '../types';

export interface BriskOrmHooks {
  priority: number;
  handler: () => Promise<void> | void;
}

// 保存运行时参数
const globalVal: {
  _briskOrmPool?: mysql.Pool,
  _briskOrmRegion?: symbol,
  _briskOrmBefores?: BriskOrmHooks[],
  _briskOrmAfters?: BriskOrmHooks[],
  // 全局排除同步的表
  _briskOrmAutoSyncExc?: string[],
  // 默认false，是否开启同步
  _briskOrmEnableAutoSync?: boolean;
  // 默认false。设置true开启删除多余表格
  _briskOrmEnableDeleteTable?: boolean;
  // 默认false。设置true开启更新存在的表格
  _briskOrmEenableUpdateTable?: boolean;
  // 有id的select方法
  _briskOrmSelectFunctions?: Map<string, BriskOrmSelectFunction>;
  // 有id的delete方法
  _briskOrmDeleteFunctions?: Map<string, BriskOrmDeleteFunction>;
  [key: string | symbol | number]: any,
} = globalThis;

if (!globalVal._briskOrmRegion) {
  globalVal._briskOrmRegion = Symbol('briskOrm');
}

if (!globalVal._briskOrmBefores) {
  globalVal._briskOrmBefores = [];
}

if (!globalVal._briskOrmAfters) {
  globalVal._briskOrmAfters = [];
}

if (!globalVal._briskOrmSelectFunctions) {
  globalVal._briskOrmSelectFunctions = new Map<string, BriskOrmSelectFunction>();
}
if (!globalVal._briskOrmDeleteFunctions) {
  globalVal._briskOrmDeleteFunctions = new Map<string, BriskOrmDeleteFunction>();
}


const logger = getLogger(globalVal._briskOrmRegion);
logger.configure({
  // 默认是info级别，可通过配置全局来改变此等级
  level: LOGGER_LEVEL_E.info,
});

const sortBy = (hookA: BriskOrmHooks, hookB: BriskOrmHooks) => hookA.priority - hookB.priority;

// 添加钩子
export function addHook(pos: 'before_conn' | 'after_conn', hook: BriskOrmHooks) {
  switch (pos) {
    case 'before_conn':
      globalVal._briskOrmBefores?.push(hook);
      break;
    case 'after_conn':
      globalVal._briskOrmAfters?.push(hook);
      break;
    default:
      break;
  }
}


export async function connect(option: BriskOrmConnectOption) {
  globalVal._briskOrmEnableAutoSync = option.autoSync.enable;
  globalVal._briskOrmEnableDeleteTable = option.autoSync.enableDeleteTable;
  globalVal._briskOrmEenableUpdateTable = option.autoSync.enableUpdateTable;
  globalVal._briskOrmAutoSyncExc!.concat(option.autoSync.expectTables || []);

  globalVal._briskOrmBefores?.sort(sortBy);
  for (let beforeHook of globalVal._briskOrmBefores!) {
    await Promise.resolve(beforeHook.handler());
  }
  globalVal._briskOrmPool = mysql.createPool(option);
  logger.debug('create globalVal._briskOrmPool', option);
  globalVal._briskOrmAfters?.sort(sortBy);
  for (let afterHook of globalVal._briskOrmAfters!) {
    await Promise.resolve(afterHook.handler());
  }
}

export function distory() {
  return globalVal._briskOrmPool?.end().catch((error) => {
    logger.error('stop error', error);
    throw error;
  });
}

/**
 * 开启手动事务
 * @returns ctx BriskOrmContext
 */
export async function startTransaction(): Promise<BriskOrmContext> {
  const connection = await globalVal._briskOrmPool?.getConnection();
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
 * @param parentCtx 父级ctx，可以传递ctx
 */
export async function transaction<T>(
  handler: (ctx: BriskOrmContext) => T,
  transactionName: string,
  parentCtx?: BriskOrmContext,
): Promise<T> {
  const ctx = parentCtx || await startTransaction();
  try {
    const res = await Promise.resolve(handler(ctx));
    await ctx.commit();
    return res;
  } catch (error) {
    await ctx.rollback(transactionName);
    throw error;
  } finally {
    ctx.end();
  }
}

export function query(sql: string, params?: any[], ctx?: BriskOrmContext): Promise<any> | undefined {
  let operator = ctx || globalVal._briskOrmPool;
  logger.debug(`query  ---> '${mysql.format(sql, params)}'`);
  return operator?.query({
    sql,
    values: params,
    typeCast: BriskOrmInnerClass.typeCast,
  })?.then((res) => res?.[0]);
}


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
      const selectFunc = globalVal._briskOrmSelectFunctions!.get(db.selectId);
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
        pre[current.key] = current.meta?.dbName || current.key;
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
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function')
              ? item.toSqlString(mapping, targetDes?.meta?.softDelete)
              : item),
          };
        }
        return item;
      });
      const res = await query(sql, argsRes, isContext ? ctx : undefined);
      // 如果是查询的count
      if (option?.isCount) {
        return res?.[0]?.['count(*)'] || 0;
      }

      // 聚合
      if (option?.aggregation) {
        return Object.values(res?.[0] || {})[0];
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
    globalVal._briskOrmSelectFunctions!.set(id, selectFunc);
  }

  return selectFunc;
}

function transToValue(_value: any, defaultVal?: any) {
  if (_value === undefined || _value === null) {
    return defaultVal;
  }
  // 非对象，日期，都直接返回
  if (typeof _value !== 'object' || _value instanceof Date) {
    return _value;
  }

  // 内部类型也返回值
  if (_value instanceof BriskOrmInnerClass) {
    return _value;
  }

  // 其他对象为json
  try {
    return JSON.stringify(_value);
  } catch (error) {
    logger.error(`${transToValue.name}: transjson error:`, error);
    throw new Error('');
  }
}


function transToValues(data: any, propertis: string[], propertiesDes?: PropertiesDes[]): any[] {
  if (typeof data !== 'object') {
    return [];
  }

  // 数组，则转换成一个二维数组，子数组为对象的值数组
  if (Array.isArray(data)) {
    return data.map((item) => transToValues(item, propertis, propertiesDes)[0]);
  }
  return [propertis.map((item) => transToValue(data[item], propertiesDes?.find((p) => p.key === item)?.meta?.default))];
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
  Target?: Class,
): BriskOrmInsertFunction<T> {
  const insertFunc = async function(data: T, ctx?: BriskOrmContext) {
    try {
      const targetDes = runtime.get(Target?.name || '');
      const res = await query(sql, [transToValues(data, propertis, targetDes?.properties)], ctx);
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
 * @param Target 目标对象
 * @returns
 */
export function getUpdate<T>(
  sql: string,
  propertis: string[],
  mapping?: BriskOrmEntityMapping,
  sqlArgs?: number[],
  Target?: Class,
): BriskOrmUpdateFunction<T> {
  const updateFunc = async(data: Partial<T>, ...args: any[]) => {
    try {
      const ctx = args[args.length - 1];
      const isContext = isLike<BriskOrmContext>(ctx);
      const targetDes = runtime.get(Target?.name || '');
      const argsRes = (isContext ? args.slice(0, args.length - 1) : args).map((item, index) => {
        // 加一是因为data作为第一个参数
        if (sqlArgs?.includes(index + 1)) {
          return {
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function')
              ? item.toSqlString(mapping, targetDes?.meta?.softDelete)
              : item),
          };
        }
        return item;
      });
      const values = [...(transToValues(data, propertis, targetDes?.properties)[0]), ...argsRes];
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
 * @param id 删除方法的id
 * @returns
 */
export function getDelete(
  sql: string,
  mapping?: BriskOrmEntityMapping,
  sqlArgs?: number[],
  Target?: Class,
  id?: string,
): BriskOrmDeleteFunction {
  const deleteFunc = async(...args: any[]) => {
    try {
      const ctx = args[args.length - 1];
      const isContext = isLike<BriskOrmContext>(ctx);
      const targetDes = runtime.get(Target?.name || '');
      const argsRes = (isContext ? args.slice(0, args.length - 1) : args).map((item, index) => {
        if (sqlArgs?.includes(index)) {
          return {
            toSqlString: () => ((typeof item === 'object' && typeof item.toSqlString === 'function')
              ? item.toSqlString(mapping, targetDes?.meta?.softDelete)
              : item),
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

  if (id) {
    globalVal._briskOrmDeleteFunctions?.set(id, deleteFunc);
  }

  return deleteFunc;
}
