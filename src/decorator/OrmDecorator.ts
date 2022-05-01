import { OrmCore } from '@core';
import { BriskIoC } from 'brisk-ioc';
import { MongoDBDaoOperatorFactor, DaoOperatorFactor } from '@factor';
import { DecoratorFactory } from 'brisk-ts-extends/decorator';
import { Key } from 'brisk-ts-extends/types';
import { BaseDaoOperator } from '@entity';
import { camelCase as _camelCase } from 'lodash';
import { ColumOption, DaoOperatorOption, ForeignKeyOption, PrimaryKeyOption } from '@interface';


/**
 * 操作属性装饰器 工厂
 * @param option 选项
 * @returns
 */
export function DaoOperator(option: DaoOperatorOption) {
  return new DecoratorFactory()
    .setPropertyCallback((target, key) => {
      // 构造操作对象
      const daoOperatorFactor: DaoOperatorFactor = new MongoDBDaoOperatorFactor(option.entity);
      const daoOperator: BaseDaoOperator | undefined = daoOperatorFactor.factory();

      Reflect.defineProperty(target, key, {
        enumerable: true,
        configurable: false,
        get() {
          return daoOperator;
        },
      });
    })
    .getDecorator();
}

/**
 * 持久层类装饰器 工厂
 * @returns
 */
export function Dao() {
  return new DecoratorFactory()
    .setClassCallback((Target) => {
      const dao = new Target();
      // 放到默认容器
      BriskIoC.putBean(_camelCase(Target.name), dao);
    })
    .getDecorator();
}


function saveColums(target: any, key: Key, option: ColumOption) {
  let colums: Map<Key, ColumOption> = new Map();
  if (target.$colums) {
    colums = target.$colums;
  }
  colums.set(key, option);
  Reflect.defineProperty(target, '$colums', {
    enumerable: true,
    configurable: false,
    get() {
      return colums;
    },
  });
}

/**
 * 字段装饰器 工厂
 * @returns
 */
export function Colum(option: ColumOption) {
  return new DecoratorFactory()
    .setParamCallback((target, key) => {
      saveColums(target, key, option);
    })
    .setPropertyCallback((target, key) => {
      saveColums(target, key, option);
    })
    .getDecorator();
}


export interface _PrimaryKey {
  key: Key,
  option?: PrimaryKeyOption
}

/**
 * 主键装饰器 工厂
 * @returns
 */
export function PrimaryKey(option?: PrimaryKeyOption) {
  const savePrimaryKey = (target: any, key: Key) => {
    const primaryKey: _PrimaryKey = {
      key,
      option,
    };
    Reflect.defineProperty(target, '$primary_key', {
      enumerable: true,
      configurable: false,
      get() {
        return primaryKey;
      },
    });
  };
  return new DecoratorFactory()
    .setParamCallback((target, key) => {
      savePrimaryKey(target, key);
    })
    .setPropertyCallback((target, key) => {
      savePrimaryKey(target, key);
    })
    .getDecorator();
}

/**
 * 外键装饰器 工厂
 * @returns
 */
export function ForeignKey(option: ForeignKeyOption) {
  const saveForeignKey = (target: any, key: Key) => {
    let foreignKeys: Map<Key, ForeignKeyOption> = new Map();
    if (target.$foreign_key) {
      foreignKeys = target.$foreign_key;
    }
    foreignKeys.set(key, option);
    Reflect.defineProperty(target, '$foreign_key', {
      enumerable: true,
      configurable: false,
      get() {
        return foreignKeys;
      },
    });
  };
  return new DecoratorFactory()
    .setParamCallback((target, key) => {
      saveForeignKey(target, key);
    })
    .setPropertyCallback((target, key) => {
      saveForeignKey(target, key);
    })
    .getDecorator();
}


/**
 * 事务装饰器 工厂
 * @since 3.0.1
 * @returns
 */
export function Transaction() {
  return new DecoratorFactory()
    .setMethodCallback((target, key, descriptor) => {
      if (typeof descriptor.value === 'function') {
        const ormCore = OrmCore.getInstance();
        const oldFn: Function = descriptor.value;
        descriptor.value = async function(...params: any[]) {
          console.log('transaction start');
          const session = await ormCore.conn?.startSession();
          try {
            session?.startTransaction();
            const re = await Promise.resolve(oldFn.call(this, ...params, session));
            session?.commitTransaction();
            console.log('transaction end');
            return re;
          } catch (error) {
            session?.abortTransaction();
            throw error;
          }
        };
      }
    })
    .getDecorator();
}
