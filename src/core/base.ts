import { getLogger, LOGGER_LEVEL_E } from 'brisk-log';
import mysql from 'mysql';
import * as runtime from 'brisk-ts-extends/runtime';
import { Class } from 'brisk-ts-extends';
import {
  BriskOrmConnectOption,
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
}

export function distory() {
  return new Promise((resolve, reject) => {
    pool?.end((error) => {
      if (error) {
        logger.error('stop error', error);
        reject(error);
        return;
      }
      resolve(null);
    });
  });
}

function query(sql: string, params?: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    pool?.query({
      sql,
      values: params,
    }, (error, results) => {
      if (error) {
        logger.error('query error', error);
        reject(error);
        return;
      }
      logger.debug('query success', results);
      resolve(results);
    });
  });
}

// 保存有id的select方法
const selectFunctions = new Map<string, BriskOrmSelectFunction>();

async function transEntiry<T>(value: any, Target: Class<T>, mapping: BriskOrmEntityMapping) {
  const resTarget = new Target();
  const entities = Object.entries(mapping);
  for (let [clsProp, db] of entities) {
    if (typeof db === 'string') {
      (resTarget as any)[clsProp] = value[db];
    } else {
      const selectFunc = selectFunctions.get(db.selectId);
      if (!selectFunc) {
        continue;
      }
      if (db.targetDbProp) {
        (resTarget as any)[clsProp] = await selectFunc(db.targetDbProp, value[db.dbProp]);
      } else {
        // 将对应的值作为查询条件
        (resTarget as any)[clsProp] = await selectFunc(value[db.dbProp]);
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
 * @param propertyArgs 作为字段名称的参数序号
 * @returns select方法
 */
export function getSelect<T>(
  sql: string,
  Target?: Class,
  option?: BriskOrmResultOption,
  id?: string,
  propertyArgs?: number[],
): BriskOrmSelectFunction<T> {
  const selectFunc = async(...args: any[]) => {
    const argsRes = args.map((item, index) => {
      if (propertyArgs?.includes(index)) {
        return {
          toSqlString: () => item,
        };
      }
      return item;
    });
    const res = await query(sql, argsRes);
    const targetDes = runtime.get(Target?.name || '');
    // 如果没有指定Result，或者没有类型描述，或者返回一个空值
    if (!Target || !targetDes || res === undefined || res === null) {
      return res;
    }
    // 将类型描述中字段转换成mapping
    let mapping = targetDes.properties.reduce((pre, current) => {
      pre[current.key] = current.key;
      return pre;
    }, {} as BriskOrmEntityMapping);

    // 如果Result里面传入了mapping，覆盖默认的映射
    if (option?.mapping) {
      mapping = {
        ...mapping,
        ...option.mapping,
      };
    }

    if (Array.isArray(res)) {
      // 只有当Result里面设置了isList才返回数组，否则返回第一个数据
      if (option?.isList) {
        return Promise.all(res.map((item) => transEntiry(item, Target, mapping)));
      }
      return res.length ? transEntiry(res[0], Target, mapping) : undefined;
    }
    return transEntiry(res, Target, mapping);
  };

  if (id) {
    selectFunctions.set(id, selectFunc);
  }

  return selectFunc;
}


function transToValues(data: any, propertis: string[]) {
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => propertis.map((prop) => item[prop]));
  }
  return [propertis.map((item) => data[item])];
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
  const insertFunc = async(data: T) => {
    const res = await query(sql, [transToValues(data, propertis)]);
    return {
      success: !res.fieldCount,
      affectedRows: res.affectedRows || 0,
    } as BriskOrmOperationResult;
  };
  return insertFunc;
}

/**
 * 获取一个update方法，用于更新
 * @param sql sql语句
 * @param propertis 修改对象的字段列表，需要按set顺序填写
 * @returns update方法
 */
export function getUpdate<T>(
  sql: string,
  propertis: string[],
): BriskOrmUpdateFunction<T> {
  const updateFunc = async(data: T, ...args: any[]) => {
    const values = [...(transToValues(data, propertis)[0]), ...args];
    const res = await query(sql, values);
    return {
      success: !res.fieldCount,
      affectedRows: res.affectedRows || 0,
    } as BriskOrmOperationResult;
  };

  return updateFunc;
}

/**
 * 获取一个delete方法，用于更新
 * @param sql sql语句
 * @returns delete方法
 */
export function getDelete(sql: string): BriskOrmDeleteFunction {
  const updateFunc = async(...args: any[]) => {
    const res = await query(sql, args);
    return {
      success: !res.fieldCount,
      affectedRows: res.affectedRows || 0,
    } as BriskOrmOperationResult;
  };

  return updateFunc;
}
