import { setBean } from 'brisk-ioc';
import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { getDelete, getInsert, getSelect, getUpdate, addTableByDecorator } from '../core';
import * as runtime from 'brisk-ts-extends/runtime';
import {
  BriskOrmColumnOption,
  BriskOrmContext,
  BriskOrmEntityMapping,
  BriskOrmForeignKeyOption,
  BriskOrmPrimaryKeyOption,
  BriskOrmTableOption,
  BRISK_ORM_FOREIGN_ACTION_E,
} from '../types';
import { BriskOrmQuery } from './query';
import { BriskOrmDao, BriskOrmPage } from './baseDao';

/**
 * 数据表装饰器
 * @param dbTableName 表名
 * @param options 选项
 * @returns
 */
export function Table(dbTableName: string, options?: BriskOrmTableOption): Function {
  return new DecoratorFactory()
    .setClassCallback((Target, targetTypeDes) => {
      if (targetTypeDes) {
        targetTypeDes.meta = {
          dbTableName,
          ...options,
        };
        addTableByDecorator(targetTypeDes);
      }
    })
    .getDecorator();
}

/**
 * 数据表的主键装饰器
 * @param options 选项
 * @returns
 */
export function PrimaryKey(options?: BriskOrmPrimaryKeyOption): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          ...options,
          dbName: options?.dbName || propertiesDes.key,
          isPrimaryKey: true,
          notNull: true,
        };
      }
    })
    .getDecorator();
}

/**
 * 数据表的外键装饰器
 * @param Target 引用类（需要被Table修饰）
 * @param targetPropertyName 目标类属性名称
 * @param options 选项
 * @returns
 */
export function ForeignKey<T>(Target: Class<T>, targetPropertyName: keyof T, options?: BriskOrmForeignKeyOption): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          ...options,
          dbName: options?.dbName || propertiesDes.key,
          foreignKey: {
            // 目标类
            Target,
            // 目标类字段名称
            targetPropertyName,
            // 默认为CASCADE
            action: options?.action || BRISK_ORM_FOREIGN_ACTION_E.CASCADE,
          },
          notNull: !propertiesDes.option,
        };
      }
    })
    .getDecorator();
}


/**
 * 数据表的列装饰器
 * @package options 选项
 * @returns
 */
export function Column(options?: BriskOrmColumnOption): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          ...options,
          dbName: options?.dbName || propertiesDes.key,
          notNull: !propertiesDes.option,
        };
      }
    })
    .getDecorator();
}

/**
 * 一对多关系，仅对象类使用，不映射数据库
 * @param Entity 一对多对应的实体（必须有对应的Dao装饰器类）
 * @param sourceDbName 当前表的外键的列名
 * @param targetDbName 目标表存储当前表外键的列名
 * @returns
 */
export function Many(Entity: Class, sourceDbName: string, targetDbName: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          sourceDbName,
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
 * @param sourceDbName 当前表的外键的列名
 * @param targetDbName 目标表存储当前表外键的列名
 * @returns
 */
export function One(Entity: Class, sourceDbName: string, targetDbName: string): Function {
  return new DecoratorFactory()
    .setPropertyCallback((target, key, propertiesDes) => {
      if (propertiesDes) {
        propertiesDes.meta = {
          sourceDbName,
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
        .filter((item) => item.meta?.sourceDbName
          && item.meta?.targetDbName
          && item.meta?.Entity)
        .forEach((item) => {
          mapping[item.key] = {
            dbProp: item.meta.sourceDbName,
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

        // eslint-disable-next-line max-lines-per-function
        constructor() {
          const instance = new Target();
          // 计数
          instance.count = getSelect<number | undefined>(`select count(*) from ${entityDes.meta.dbTableName}`, undefined, { isCount: true });
          instance.countQuery = getSelect<number | undefined>(
            `select count(*) from ${entityDes.meta.dbTableName} ?`,
            undefined,
            { isCount: true, mapping },
            undefined,
            [0],
          );
          instance.countEveryEq = (queryEntity: Partial<any>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.countQuery(query, ctx);
          };
          instance.countSomeEq = (queryEntity: Partial<any>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.countQuery(query, ctx);
          };

          // 列表
          instance.list = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName}`,
            Entity,
            { isList: true, mapping },
          );
          instance.listQuery = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName} ?`,
            Entity,
            { isList: true, mapping },
            undefined,
            [0],
          );
          instance.listEveryEq = (queryEntity: Partial<any>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.listQuery(query, ctx);
          };
          instance.listSomeEq = (queryEntity: Partial<any>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.listQuery(query, ctx);
          };

          // 分页
          const _pageSelect = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName} limit ?, ?`,
            Entity,
            { isList: true, mapping },
          );
          instance.page = (page: BriskOrmPage, ctx?: BriskOrmContext) => _pageSelect(page.page * page.pageSize, page.pageSize, ctx);
          const _pageSelectQuery = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName} ? limit ?, ?`,
            Entity,
            { isList: true, mapping },
            undefined,
            [0],
          );
          instance.pageQuery = (
            query: BriskOrmQuery<K>,
            page: BriskOrmPage,
            ctx?: BriskOrmContext,
          ) => _pageSelectQuery(query, page.page * page.pageSize, page.pageSize, ctx);
          instance.pageEveryEq = (queryEntity: Partial<K>, page: BriskOrmPage, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.pageQuery(query, page, ctx);
          };
          instance.pageSomeEq = (queryEntity: Partial<K>, page: BriskOrmPage, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.pageQuery(query, page, ctx);
          };

          // 查找
          instance.findByPrimaryKey = primaryKey ? getSelect<K | undefined>(
            `select * from ${entityDes.meta.dbTableName} where ${primaryKey} = ? limit 0, 1`,
            Entity,
            { mapping },
          ) : () => Promise.reject(new Error('no primaryKey'));
          instance.findQuery = getSelect<K | undefined>(
            `select * from ${entityDes.meta.dbTableName} ? limit 0, 1`,
            Entity,
            { mapping },
            undefined,
            [0],
          );
          instance.findEveryEq = (queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.findQuery(query, ctx);
          };
          instance.findSomeEq = (queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.findQuery(query, ctx);
          };

          // 保存
          instance.save = getInsert<K>(
            `insert into ${entityDes.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
          );
          instance.saveAll = getInsert<K[]>(
            `insert into ${entityDes.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
          );

          // 更新
          instance.updateByPrimaryKey = primaryKey ? getUpdate<K>(
            `update ${entityDes.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey)
              .map((item) => `${item.meta.dbName} = ?`)} where ${primaryKey} = ?`,
            [...properties.filter((item) => !item.meta.isPrimaryKey).map((item) => item.key), primaryKeyProp],
          ) : () => Promise.reject(new Error('no primaryKey'));
          instance.updateQuery = getUpdate<K>(
            `update ${entityDes.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey)
              .map((item) => `${item.meta.dbName} = ?`)} ?`,
            [...properties.filter((item) => !item.meta.isPrimaryKey).map((item) => item.key)],
            mapping,
            [1],
          );
          instance.updateEveryEq = (_value: K, queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.updateQuery(_value, query, ctx);
          };
          instance.updateSomeEq = (_value: K, queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.updateQuery(_value, query, ctx);
          };


          // 删除
          instance.deleteByPrimaryKey = primaryKey
            ? getDelete(`delete from ${entityDes.meta.dbTableName} where ${primaryKey} = ?`)
            : () => Promise.reject(new Error('no primaryKey'));
          instance.deleteQuery = getDelete(
            `delete from ${entityDes.meta.dbTableName} ?`,
            mapping,
            [0],
          );
          instance.deleteEveryEq = (queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.deleteQuery(query, ctx);
          };
          instance.deleteSomeEq = (queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.deleteQuery(query, ctx);
          };

          instance.findList = getSelect<K[] | undefined>(
            `select * from ${entityDes.meta.dbTableName}`,
            Entity,
            { isList: true, mapping },
          );

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

          return instance;
        }

      };

      setBean(newTarget, undefined, undefined, Target.name);
      return newTarget;
    })
    .getDecorator();
}
