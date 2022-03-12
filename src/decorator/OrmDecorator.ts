import { IColumOption } from './../interface/option/IColumOption';
import { IPrimaryKeyOption } from './../interface/option/IPrimaryKeyOption';
import { OrmCore } from './../core/OrmCore';
import { IForeignKeyOption } from './../interface/option/IForeignKeyOption';
import { MongoDBDaoOperatorFactor } from '../factor/oprator/MongoDBDaoOperatorFactor';
import { IDaoOperatorOption } from './../interface/option/IDaoOperatorOption';
import { DecoratorFactory, Key } from 'brisk-ioc';
import { DaoOperatorFactor } from '../factor/oprator/DaoOperatorFactor';
import { BaseDaoOperator } from '../entity/operator/BaseDaoOperator';
import { camelCase as _camelCase } from 'lodash';

/**
 * 持久层类装饰器 工厂
 * @returns
 */
export function Dao() {
  return new DecoratorFactory()
    .setClassCallback((Target) => {
      const dao = new Target();
      OrmCore.getInstance().core?.container.set(_camelCase(Target.name), dao);
    })
    .getDecorator();
}

/**
 * 操作属性装饰器 工厂
 * @param option 选项
 * @returns
 */
export function DaoOperator(option: IDaoOperatorOption) {
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


function saveColums(target: any, key: Key, option: IColumOption) {
  let colums: Map<Key, IColumOption> = new Map();
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
export function Colum(option: IColumOption) {
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
  option?: IPrimaryKeyOption
}

/**
 * 主键装饰器 工厂
 * @returns
 */
export function PrimaryKey(option?: IPrimaryKeyOption) {
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
export function ForeignKey(option: IForeignKeyOption) {
  const saveForeignKey = (target: any, key: Key) => {
    let foreignKeys: Map<Key, IForeignKeyOption> = new Map();
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

