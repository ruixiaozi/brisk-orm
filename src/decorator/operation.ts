/* eslint-disable max-lines */
import { setBean } from 'brisk-ioc';
import { Class, DecoratorFactory } from 'brisk-ts-extends';
import { getDelete, getInsert, getSelect, getUpdate, addTableByDecorator, transaction } from '../core';
import * as runtime from 'brisk-ts-extends/runtime';
import {
  BriskOrmColumnOption,
  BriskOrmContext,
  BriskOrmDeleteFunction,
  BriskOrmEntityMapping,
  BriskOrmForeignKeyOption,
  BriskOrmPrimaryKeyOption,
  BriskOrmSelectFunction,
  BriskOrmTableOption,
  BRISK_ORM_FOREIGN_ACTION_E,
} from '../types';
import { BriskOrmQuery } from './query';
import { BriskOrmDao, BriskOrmPage } from './baseDao';
import { isNil } from 'lodash';
import mysql from 'mysql2/promise';

// 保存运行时参数
const globalVal: {
  // 有id的select方法
  _briskOrmSelectFunctions?: Map<string, BriskOrmSelectFunction>;
  // 有id的delete方法
  _briskOrmDeleteFunctions?: Map<string, BriskOrmDeleteFunction>;
  // 当前表被关联的表,仅CASCADE
  _briskOrmRelativeTables?: Map<string, {
    relateName: string;
    relatePropertyName: string;
    propertyName: string;
  }[]>;
  [key: string | symbol | number]: any,
} = globalThis;

if (!globalVal._briskOrmRelativeTables) {
  globalVal._briskOrmRelativeTables = new Map();
}


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

      // 当前表关联的外键
      entityDes.properties
        .filter((item) => item.meta?.foreignKey?.Target?.name && item.meta?.foreignKey?.targetPropertyName
          && (!item.meta?.foreignKey?.action || item.meta?.foreignKey?.action === BRISK_ORM_FOREIGN_ACTION_E.CASCADE))
        .forEach((item) => {
          const relativeInfo = {
            relateName: Entity.name,
            relatePropertyName: item.key,
            propertyName: item.meta.foreignKey.targetPropertyName,
          };
          let relateiveTables = globalVal._briskOrmRelativeTables?.get(item.meta.foreignKey.Target.name);
          if (!relateiveTables) {
            relateiveTables = [];
            globalVal._briskOrmRelativeTables?.set(item.meta.foreignKey.Target.name, relateiveTables);
          }
          relateiveTables.push(relativeInfo);
        });

      const primaryKey = entityDes.properties.find((item) => item.meta?.isPrimaryKey)?.meta?.dbName;
      const primaryKeyProp = entityDes.properties.find((item) => item.meta?.isPrimaryKey)?.key || '';
      // 注入默认操作
      const newTarget = class {

        // eslint-disable-next-line max-lines-per-function
        constructor() {
          const instance = new Target();
          const softDelete: boolean = entityDes?.meta.softDelete || false;
          // 计数
          instance.count = getSelect<number | undefined>(
            // 软删除查询，仅查询未删除的
            `select count(*) from ${entityDes?.meta.dbTableName}${softDelete ? ' where _is_delete = 0' : ''}`,
            Entity,
            { aggregation: true },
          );
          instance.countQuery = getSelect<number | undefined>(
            `select count(*) from ${entityDes?.meta.dbTableName} ?`,
            Entity,
            { aggregation: true, mapping },
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
            `select * from ${entityDes?.meta.dbTableName}${softDelete ? ' where _is_delete = 0' : ''}`,
            Entity,
            { isList: true, mapping },
          );
          instance.listQuery = getSelect<K[] | undefined>(
            `select * from ${entityDes?.meta.dbTableName} ?`,
            Entity,
            { isList: true, mapping },
            `__INNER__LIST__QUERY__${Entity.name}`,
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
            `select * from ${entityDes?.meta.dbTableName}${softDelete ? ' where _is_delete = 0' : ''} limit ?, ?`,
            Entity,
            { isList: true, mapping },
          );
          instance.page = (page: BriskOrmPage, ctx?: BriskOrmContext) => _pageSelect(page.page * page.pageSize, page.pageSize, ctx);
          const _pageSelectQuery = getSelect<K[] | undefined>(
            `select * from ${entityDes?.meta.dbTableName} ? limit ?, ?`,
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
            `select * from ${entityDes?.meta.dbTableName} where ${primaryKey} = ?${softDelete ? ' and _is_delete = 0' : ''} limit 0, 1`,
            Entity,
            { mapping },
          ) : () => Promise.reject(new Error('no primaryKey'));
          instance.findQuery = getSelect<K | undefined>(
            `select * from ${entityDes?.meta.dbTableName} ? limit 0, 1`,
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
            `insert into ${entityDes?.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
            Entity,
          );
          instance.saveAll = getInsert<K[]>(
            `insert into ${entityDes?.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
            Entity,
          );

          // 保存或者更新
          instance.saveOrUpdate = getInsert<K>(
            `replace into ${entityDes?.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
            Entity,
          );
          instance.saveOrUpdateAll = getInsert<K[]>(
            `replace into ${entityDes?.meta.dbTableName} (${properties.map((item) => item.meta.dbName)}) values ?`,
            properties.map((item) => item.key),
            Entity,
          );

          // 更新
          instance.updateByPrimaryKey = primaryKey ? getUpdate<K>(
            `update ${entityDes?.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey)
              .map((item) => `${item.meta.dbName} = ?`)} where ${primaryKey} = ?${softDelete ? ' and _is_delete = 0' : ''}`,
            [...properties.filter((item) => !item.meta.isPrimaryKey).map((item) => item.key), primaryKeyProp],
            undefined,
            undefined,
            Entity,
          ) : () => Promise.reject(new Error('no primaryKey'));
          instance.updateQuery = getUpdate<K>(
            `update ${entityDes?.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey)
              .map((item) => `${item.meta.dbName} = ?`)} ?`,
            [...properties.filter((item) => !item.meta.isPrimaryKey).map((item) => item.key)],
            mapping,
            [1],
            Entity,
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

          // 局部更新
          instance.updatePartByPrimaryKey = primaryKey ? (part: Array<keyof K>, _value: Partial<K>, ctx?: BriskOrmContext) => getUpdate<K>(
            `update ${entityDes?.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey && part.includes(item.key as any))
              .map((item) => `${item.meta.dbName} = ?`)} where ${primaryKey} = ?${softDelete ? ' and _is_delete = 0' : ''}`,
            [...properties.filter((item) => !item.meta.isPrimaryKey && part.includes(item.key as any)).map((item) => item.key), primaryKeyProp],
            undefined,
            undefined,
            Entity,
          )(_value, ctx) : () => Promise.reject(new Error('no primaryKey'));
          instance.updatePartQuery = (part: Array<keyof K>, _value: Partial<K>, query: BriskOrmQuery<K>, ctx?: BriskOrmContext) => getUpdate<K>(
            `update ${entityDes?.meta.dbTableName} set ${properties
              .filter((item) => !item.meta.isPrimaryKey && part.includes(item.key as any))
              .map((item) => `${item.meta.dbName} = ?`)} ?`,
            [...properties.filter((item) => !item.meta.isPrimaryKey && part.includes(item.key as any)).map((item) => item.key)],
            mapping,
            [1],
            Entity,
          )(_value, query, ctx);
          instance.updatePartEveryEq = (part: Array<keyof K>, _value: Partial<K>, queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.everyEq(queryEntity);
            return instance.updatePartQuery(part, _value, query, ctx);
          };
          instance.updatePartSomeEq = (part: Array<keyof K>, _value: Partial<K>, queryEntity: Partial<K>, ctx?: BriskOrmContext) => {
            const query = new BriskOrmQuery<any>();
            query.someEq(queryEntity);
            return instance.updatePartQuery(part, _value, query, ctx);
          };


          // 删除
          if (softDelete) {
            // 软删除
            const softDelColumns = properties.filter((item) => item.meta.deleteValue !== undefined).map((item) => ({
              dbName: item.meta.dbName,
              deleteValue: item.meta.deleteValue,
            }));
            softDelColumns.push({
              dbName: '_is_delete',
              deleteValue: 1,
            });

            // 主键删除
            const deleteByPrimaryKeySingle = primaryKey
              ? getDelete(
                `update ${entityDes?.meta.dbTableName} set ${softDelColumns
                  .map((item) => `${item.dbName} = ${
                    mysql.escape(typeof item.deleteValue === 'function' ? item.deleteValue() : item.deleteValue)
                  }`)} where ${primaryKey} = ? and _is_delete = 0`,
                mapping,
                undefined,
                Entity,
              )
              : () => Promise.reject(new Error('no primaryKey'));
            instance.deleteByPrimaryKey = primaryKey
              ? (pKey: any, oldCtx?: BriskOrmContext) => transaction(async(ctx) => {
                // 查询
                const val = await instance.findByPrimaryKey(pKey, ctx);
                // 执行当前的删除
                const res = await deleteByPrimaryKeySingle(pKey, ctx);
                // 寻找关联表，做级联删除
                let relateiveTables = globalVal._briskOrmRelativeTables?.get(Entity.name);
                if (val && relateiveTables?.length) {
                  for (let relateiveTable of relateiveTables) {
                    const cascadeDelQueryFun = globalVal._briskOrmDeleteFunctions
                      ?.get(`__INNER__DELETE__QUERY__${relateiveTable.relateName}`);
                    // 没找到则跳过
                    if (!cascadeDelQueryFun) {
                      continue;
                    }
                    const cascadeQuery = new BriskOrmQuery<any>();
                    cascadeQuery.eq(relateiveTable.relatePropertyName, val[relateiveTable.propertyName]);
                    // 调用query的del方法
                    await cascadeDelQueryFun(cascadeQuery, ctx);
                  }
                }
                return res;
              }, 'deleteByPrimaryKey', oldCtx)
              : () => Promise.reject(new Error('no primaryKey'));
            // 设置id方法
            globalVal._briskOrmDeleteFunctions?.set(`__INNER__DELETE__BY__PRIMARYKEY__${Entity.name}`, instance.deleteByPrimaryKey);

            // query删除
            const deleteQuerySingle = getDelete(
              `update ${entityDes?.meta.dbTableName} set ${softDelColumns
                .map((item) => `${item.dbName} = ${
                  mysql.escape(typeof item.deleteValue === 'function' ? item.deleteValue() : item.deleteValue)
                }`)} ?`,
              mapping,
              [0],
              Entity,
            );

            instance.deleteQuery = (query: BriskOrmQuery<K>, oldCtx?: BriskOrmContext) => transaction(async(ctx) => {
              // 查询
              const listVal: any[] = (await instance.findQuery(query, ctx)) || [];
              // 删除
              const res = await deleteQuerySingle(query, ctx);
              // 寻找关联表，做级联删除
              let relateiveTables = globalVal._briskOrmRelativeTables?.get(Entity.name);
              if (listVal.length && relateiveTables?.length) {
                for (let relateiveTable of relateiveTables) {
                  const cascadeDelQueryFun = globalVal._briskOrmDeleteFunctions
                    ?.get(`__INNER__DELETE__QUERY__${relateiveTable.relateName}`);
                    // 没找到则跳过
                  if (!cascadeDelQueryFun) {
                    continue;
                  }

                  // 当前外键的值集合
                  const currentVals = listVal
                    .filter((val) => !isNil(val[relateiveTable.propertyName]))
                    .map((val) => val[relateiveTable.propertyName]);

                  // 不存在值，则直接跳过
                  if (!currentVals.length) {
                    continue;
                  }
                  const cascadeQuery = new BriskOrmQuery<any>();
                  cascadeQuery.in(relateiveTable.relateName, currentVals);
                  // 调用query的del方法
                  await cascadeDelQueryFun(cascadeQuery, ctx);
                }
              }
              return res;
            }, 'deleteQuery', oldCtx);

            // 设置id方法
            globalVal._briskOrmDeleteFunctions?.set(`__INNER__DELETE__QUERY__${Entity.name}`, instance.deleteQuery);
          } else {
            // 物理删除
            instance.deleteByPrimaryKey = primaryKey
              ? getDelete(
                `delete from ${entityDes?.meta.dbTableName} where ${primaryKey} = ?`,
                mapping,
                undefined,
                Entity,
                `__INNER__DELETE__BY__PRIMARYKEY__${Entity.name}`,
              )
              : () => Promise.reject(new Error('no primaryKey'));
            instance.deleteQuery = getDelete(
              `delete from ${entityDes?.meta.dbTableName} ?`,
              mapping,
              [0],
              Entity,
              `__INNER__DELETE__QUERY__${Entity.name}`,
            );
          }

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
            `select * from ${entityDes?.meta.dbTableName}${softDelete ? ' where _is_delete = 0' : ''}`,
            Entity,
            { isList: true, mapping },
          );

          instance.findListBy = getSelect<K[] | undefined>(
            `select * from ${entityDes?.meta.dbTableName} where ? = ?${softDelete ? ' and _is_delete = 0' : ''}`,
            Entity,
            { isList: true, mapping },
            `__INNER__FIND__LIST__BY__${Entity.name}`,
            [0],
          );
          instance.findBy = getSelect<K[] | undefined>(
            `select * from ${entityDes?.meta.dbTableName} where ? = ?${softDelete ? ' and _is_delete = 0' : ''}`,
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
