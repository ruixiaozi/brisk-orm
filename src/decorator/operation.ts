import { setBean } from 'brisk-ioc';
import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { getDelete, getInsert, getSelect, getUpdate } from '../core';
import * as runtime from 'brisk-ts-extends/runtime';
import { BriskOrmEntityMapping, BriskOrmOperationResult } from '../types';

export class BriskOrmDao<K> {

  findList(): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  findByPrimaryKey(_value: any): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  findListBy(_key: string, _value: any): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  findBy(_key: string, _value: any): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  save(_value: K): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  saveAll(_value: K[]): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updateByPrimaryKey(_value: K): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  deleteByPrimaryKey(_value: any): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

}

/**
 * 数据表装饰器
 * @param dbTableName 表名
 * @returns
 */
export function Table(dbTableName: string): Function {
  return new DecoratorFactory()
    .setClassCallback((Target, targetTypeDes) => {
      if (targetTypeDes) {
        targetTypeDes.meta = {
          dbTableName,
        };
      }
    })
    .getDecorator();
}

/**
 * 数据表的主键装饰器
 * @param dbName 数据库列名，默认使用属性名
 * @returns
 */
export function PrimaryKey(dbName?: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          dbName: dbName || propertiesDes.key,
          isPrimaryKey: true,
        };
      }
    })
    .getDecorator();
}

/**
 * 数据表的列装饰器
 * @param dbName 数据表的列名，默认使用属性名
 * @returns
 */
export function Column(dbName?: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          dbName: dbName || propertiesDes.key,
        };
      }
    })
    .getDecorator();
}

/**
 * 一对多关系
 * @param Entity 一对多对应的实体（必须有对应的Dao装饰器类）
 * @param foreignKey 当前表的外键的列名
 * @param targetDbName 目标表存储当前表外键的列名
 * @returns
 */
export function Many(Entity: Class, foreignKey: string, targetDbName: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          foreignKey,
          targetDbName,
          Entity,
          isMany: true,
        };
      }
    })
    .getDecorator();
}

/**
 * 一对一，多对一关系
 * @param Entity 一对一，多对一对应的实体（必须有对应的Dao装饰器类）
 * @param foreignKey 当前表的外键的列名
 * @param targetDbName 目标表存储当前表外键的列名
 * @returns
 */
export function One(Entity: Class, foreignKey: string, targetDbName: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          foreignKey,
          targetDbName,
          Entity,
          isMany: false,
        };
      }
    })
    .getDecorator();
}

/**
 * Dao类装饰器
 * @param Entity 实体类，需要使用Table装饰器修饰
 * @returns
 */
// eslint-disable-next-line max-lines-per-function
export function Dao<K>(Entity: Class<K>): <T extends BriskOrmDao<K>>(Target: Class<T>, ...args: any[]) => any {
  return new DecoratorFactory()
    // eslint-disable-next-line max-lines-per-function
    .setClassCallback((Target, targetTypeDes) => {
      const entityDes = runtime.get(Entity.name);
      // 如果绑定的实例类没有使用Table装饰器，则不注入默认的dao操作
      if (!entityDes?.meta?.dbTableName) {
        setBean(Target);
        return Target;
      }

      const mapping: BriskOrmEntityMapping = {};

      const properties = entityDes.properties.filter((item) => item.meta?.dbName);

      properties.forEach((item) => {
        mapping[item.key] = item.meta.dbName;
      });

      // Many对应的mapping
      entityDes.properties
        .filter((item) => item.meta?.foreignKey
          && item.meta?.targetDbName
          && item.meta?.Entity)
        .forEach((item) => {
          mapping[item.key] = {
            dbProp: item.meta.foreignKey,
            targetDbProp: item.meta.targetDbName,
            selectId: item.meta.isMany
              ? `__INNER__FIND__LIST__BY__${item.meta.Entity.name}`
              : `__INNER__FIND__BY__${item.meta.Entity.name}`,
          };
        });

      const primaryKey = entityDes.properties.find((item) => item.meta?.isPrimaryKey)?.meta?.dbName;
      const primaryKeyProp = entityDes.properties.find((item) => item.meta?.isPrimaryKey)?.key || '';
      // 注入默认操作
      const newTarget = class {

        constructor() {
          const instance = new Target();
          instance.findList = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName}`,
            Entity,
            { isList: true, mapping },
          );
          instance.findByPrimaryKey = primaryKey ? getSelect<K | undefined>(
            `select * from ${entityDes.meta.dbTableName} where ${primaryKey} = ?`,
            Entity,
            { mapping },
          ) : () => Promise.resolve(undefined);
          instance.findListBy = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName} where ? = ?`,
            Entity,
            { isList: true, mapping },
            `__INNER__FIND__LIST__BY__${Entity.name}`,
            [0],
          );
          instance.findBy = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName} where ? = ?`,
            Entity,
            { mapping },
            `__INNER__FIND__BY__${Entity.name}`,
            [0],
          );
          instance.save = getInsert<K>(
            `insert into ${entityDes.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
          );
          instance.saveAll = getInsert<K[]>(
            `insert into ${entityDes.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
          );
          instance.updateByPrimaryKey = getUpdate<K>(
            `update ${entityDes.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey)
              .map((item) => `${item.meta.dbName} = ?`)} where ${primaryKey} = ?`,
            [...properties.filter((item) => !item.meta.isPrimaryKey).map((item) => item.key), primaryKeyProp],
          );
          instance.deleteByPrimaryKey = getDelete(`delete from ${entityDes.meta.dbTableName} where ${primaryKey} = ?`);
          return instance;
        }

      };

      setBean(newTarget, undefined, undefined, Target.name);
      return newTarget;
    })
    .getDecorator();
}
