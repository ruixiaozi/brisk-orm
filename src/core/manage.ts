// 自动创建表

import { TypeDes, TypeKind } from 'brisk-ts-extends';
import {
  BriskOrmContext,
  BriskOrmTable,
  BRISK_ORM_TYPE_E,
  BriskOrmColumn,
  BriskOrmUniqueKey,
  BirskOrmForeignKey,
  BRISK_ORM_FOREIGN_ACTION_E,
  innerClasses,
} from '../types';
import { query, transaction } from './base';
import { getLogger, LOGGER_LEVEL_E } from 'brisk-log';
import { difference, groupBy, includes, intersection, keyBy, uniqueId } from 'lodash';
import { get } from 'brisk-ts-extends/runtime';
import { v1 as UUIDV1 } from 'uuid';

const defaultRegion = Symbol('briskOrmTable');

const logger = getLogger(defaultRegion);
logger.configure({
  // 默认是info级别，可通过配置全局来改变此等级
  level: LOGGER_LEVEL_E.info,
});


const tables: {[name: string]: BriskOrmTable} = {};

/**
 * 获取类型默认长度
 * @param type
 * @param length
 * @returns
 */
function getTypeLength(type: BRISK_ORM_TYPE_E, length?: number): number | undefined {
  if (length) {
    return length;
  }
  switch (type) {
    case BRISK_ORM_TYPE_E.VARCHAR:
      return 255;
    case BRISK_ORM_TYPE_E.TINYINT:
      return 1;
    case BRISK_ORM_TYPE_E.DATETIME:
      return 3;
    case BRISK_ORM_TYPE_E.LONG:
      return 20;
    case BRISK_ORM_TYPE_E.BIGINT:
      return 30;
    default:
      return undefined;
  }
}

/**
 * 获取类型默认精度
 * @param type
 * @param precision
 * @returns
 */
function getTypePrecision(type: BRISK_ORM_TYPE_E, precision?: number): number | undefined {
  if (precision) {
    return precision;
  }
  switch (type) {
    case BRISK_ORM_TYPE_E.DOUBLE:
      return 4;
    case BRISK_ORM_TYPE_E.FLOAT:
      return 2;
    default:
      return undefined;
  }
}


// 获取类型修饰
function getTypeDecorate(type: BRISK_ORM_TYPE_E, _length?: number, _precision?: number): string {
  const length = getTypeLength(type, _length);
  if (!length) {
    return '';
  }
  const resArr = [length];
  const precision = getTypePrecision(type, _precision);
  if (precision) {
    resArr.push(precision);
  }
  return `(${resArr.join(', ')})`;
}

function getColumnSQL(col: BriskOrmColumn) {
  const colSQL = `\`${col.name}\` ${col.type}${
    getTypeDecorate(col.type, col.length, col.precision)
  } ${
    col.notNull ? 'not null' : 'null'
  } ${
    col.default ? `default ${col.default}` : ''
  } ${
    col.autoIncrement ? 'auto_increment' : ''
  }`;
  logger.debug(`column SQL: ${colSQL}`);
  return colSQL;
}

function getPrimaryKeySQL(primaryKeys: string[]) {
  const primaryKeySql = primaryKeys.length ? `primary key (${primaryKeys.map((item) => `\`${item}\``).join(', ')})` : '';
  logger.debug(`PrimaryKey SQL: ${primaryKeySql}`);
  return primaryKeySql;
}

function getUniqueKeySQL(uniqueyKey: BriskOrmUniqueKey) {
  const uniqueKeySQL = `unique key \`${UUIDV1()}\` (${uniqueyKey.map((item) => `\`${item.name}\``).join(', ')})`;
  logger.debug(`uniqueKey SQL: ${uniqueKeySQL}`);
  return uniqueKeySQL;
}

function getForeignKeySQL(colName: string, foreignKey: BirskOrmForeignKey) {
  const foreignKeySQL = `constraint \`${
    UUIDV1()
  }\` foreign key (\`${colName}\`) references \`${foreignKey.targetTableName}\` (\`${foreignKey.targetColumnName}\`)\
  on delete ${foreignKey.action} on update ${foreignKey.action}`;
  logger.debug(`foreignKey SQL: ${foreignKeySQL}`);
  return foreignKeySQL;
}

/**
 * 创建表
 * @param name 表名
 * @param table 表对象
 * @param ctx orm上下文
 * @returns
 */
export async function createTable(name: string, table: BriskOrmTable, ctx?: BriskOrmContext) {
  try {
    const uniqueKeyEntrties = Object.entries(table.uniqueKeys);
    const foreignKeyEntrties = Object.entries(table.foreignKeys);
    const createSQL = `create table \`${name}\` (
      ${table.columns.map((item) => getColumnSQL(item)).join(',\n')}${table.columns.length
        && (table.primaryKeys.length || uniqueKeyEntrties.length || foreignKeyEntrties.length) ? ',' : ''}
      ${getPrimaryKeySQL(table.primaryKeys)}${table.primaryKeys.length && (uniqueKeyEntrties.length || foreignKeyEntrties.length) ? ',' : ''}
      ${uniqueKeyEntrties
    .map(([key, value]) => getUniqueKeySQL(value))
    .join(',\n')}${uniqueKeyEntrties.length && foreignKeyEntrties.length ? ',' : ''}
      ${foreignKeyEntrties
    .map(([key, value]) => getForeignKeySQL(key, value))
    .join(',\n')}
    ) engine=${table.engine} charset=${table.charset} collate=${table.collate};`;
    logger.info(`createTable SQL: ${createSQL}`);
    return await query(createSQL, undefined, ctx);
  } catch (error) {
    logger.error('create table error ', error);
    throw error;
  }
}

/**
 * 获取所有表名列表
 * @param ctx orm上下文
 * @returns
 */
export async function getAllTable(ctx?: BriskOrmContext) {
  try {
    const res = await query('show tables', undefined, ctx);
    return res?.map((item: any) => Object.values(item)?.[0]) || [];
  } catch (error) {
    logger.error('show tables error ', error);
    throw error;
  }
}

/**
 * 删除表
 * @param name 表名
 * @param ctx orm上下文
 * @returns
 */
export async function deleteTable(name: string, ctx?: BriskOrmContext) {
  try {
    return await query(`drop table \`${name}\``, undefined, ctx);
  } catch (error) {
    logger.error('drop table error ', error);
    throw error;
  }
}

/**
 * 获取表的原创建SQL
 * @param name 表名
 * @param ctx orm上下文
 * @returns
 */
export async function getCreateTableSQL(name: string, ctx?: BriskOrmContext) {
  try {
    return (await query(`show create table ${name}`, undefined, ctx))[0]['Create Table'];
  } catch (error) {
    logger.error('drop table error ', error);
    throw error;
  }
}

/**
 * 更新表
 * @param name 表名
 * @param table 表对象
 * @param ctx orm上下文
 * @returns
 */
export async function updateTable(name: string, table: BriskOrmTable, ctx?: BriskOrmContext) {
  try {
    let updateSQL = `alter table \`${name}\`\n`;

    // 比对列
    const descTableRes = await query(`desc \`${name}\``, undefined, ctx);
    const oldCols = keyBy(descTableRes, 'Field');
    const oldColNames = Object.keys(oldCols);
    const newCols = keyBy(table.columns, 'name');
    const newColNames = Object.keys(newCols);
    const waitDeleteColNames = difference(oldColNames, newColNames);
    const waitUpdateColNames = intersection(oldColNames, newColNames);
    const waitCreateColNames = difference(newColNames, oldColNames);

    updateSQL += waitDeleteColNames.map((item) => `drop column \`${item}\`,\n`).join('');
    updateSQL += waitUpdateColNames.map((item) => `modify column ${getColumnSQL(newCols[item])},\n`).join('');
    updateSQL += waitCreateColNames.map((item) => `add column ${getColumnSQL(newCols[item])},\n`).join('');

    const indexRes = await query(`show index from \`${name}\``, undefined, ctx);
    // 主键
    updateSQL += 'drop primary key,\n';
    updateSQL += `add ${getPrimaryKeySQL(table.primaryKeys)},\n`;


    // 移除所有唯一键，再重新添加
    const oldUniqueKey = [
      ...new Set(indexRes
        // 0代表唯一
        .filter((item: any) => item.Non_unique === 0 && item.Key_name !== 'PRIMARY')
        .map((item: any) => item.Key_name)),
    ];
    updateSQL += oldUniqueKey.map((item) => `drop index \`${item}\`,\n`).join('');
    // 添加新的唯一键
    updateSQL += Object.entries(table.uniqueKeys)
      .map(([key, value]) => `add unique index \`${UUIDV1()}\`(${value.map((item) => `\`${item.name}\``).join(', ')}),\n`)
      .join('');

    // 移除所有外键，再重新添加
    const createTableSQL = await getCreateTableSQL(name, ctx);
    const oldForeignKeys = [...createTableSQL.matchAll(/`(?<key>.*)` FOREIGN KEY/ug)].map((item) => item.groups.key);
    updateSQL += oldForeignKeys.map((item) => `drop foreign key \`${item}\`,\n`).join('');
    // 添加新的外键
    updateSQL += Object.entries(table.foreignKeys)
      .map(([key, value]) => `add ${getForeignKeySQL(key, value)},\n`)
      .join('');

    updateSQL += `engine = ${table.engine}, character set = ${table.charset}, collate = ${table.collate};`;
    logger.info(`updateTable SQL: ${updateSQL}`);
    return await query(updateSQL, undefined, ctx);
  } catch (error) {
    logger.error('update table error ', error);
    throw error;
  }
}


/**
 * 自动同步表
 */
export async function autoSync() {
  await transaction(async(ctx) => {
    const allTable = await getAllTable(ctx);
    const newAllTable = Object.keys(tables);
    // 待删除
    const waitDeleteTables = difference(allTable, newAllTable);
    logger.info(`wait delete tables: ${waitDeleteTables}`);
    // 待更新表
    const waitUpdateTables = intersection(allTable, newAllTable);
    logger.info(`wait update tables: ${waitUpdateTables}`);
    // 待创建表
    const waitCreateTables = difference(newAllTable, allTable);
    logger.info(`wait create tables: ${waitCreateTables}`);

    for (const tableName of waitDeleteTables) {
      await deleteTable(tableName, ctx);
    }

    for (const tableName of waitCreateTables) {
      await createTable(tableName, tables[tableName], ctx);
    }

    for (const tableName of waitUpdateTables) {
      await updateTable(tableName, tables[tableName], ctx);
    }
  }, 'brisk_orm_auto_sync');
}

function transformType(type: Array<TypeKind> | TypeKind) {
  if (Array.isArray(type)) {
    return BRISK_ORM_TYPE_E.JSON;
  }
  switch (type) {
    case 'string':
      return BRISK_ORM_TYPE_E.VARCHAR;
    case 'number':
      return BRISK_ORM_TYPE_E.INT;
    case 'boolean':
      return BRISK_ORM_TYPE_E.TINYINT;
    case 'Date':
      return BRISK_ORM_TYPE_E.DATETIME;
    default:
      // eslint-disable-next-line no-case-declarations
      const innerCls = innerClasses.find((item) => item.name === type);
      if (innerCls?.ormType) {
        return innerCls.ormType;
      }
      return BRISK_ORM_TYPE_E.JSON;
  }
}

/**
 * 添加表对象到列表中
 * @param name 表名
 * @param table 表对象
 */
export function addTable(name: string, table: BriskOrmTable) {
  tables[name] = table;
}

export function addTableByDecorator(targetTypeDes: TypeDes) {
  if (!targetTypeDes.meta?.dbTableName) {
    return;
  }
  logger.info(`addTableByDecorator: ${targetTypeDes.meta?.dbTableName}`);
  const { dbTableName, charset = 'utf8', collate = 'utf8_general_ci', engine = 'InnoDB' } = targetTypeDes.meta;
  tables[dbTableName] = {
    charset,
    collate,
    engine,
    columns: targetTypeDes.properties
      .filter((item) => item.meta?.dbName)
      .map((item) => ({
        ...item.meta,
        name: item.meta!.dbName,
        type: item.meta?.type || transformType(item.type),
      })),
    primaryKeys: targetTypeDes.properties
      .filter((item) => item.meta?.isPrimaryKey && item.meta?.dbName)
      .map((item) => item.meta.dbName),
    uniqueKeys: groupBy(
      targetTypeDes.properties.filter((item) => item.meta?.uniqueKey && item.meta?.dbName).map((item) => ({
        key: item.meta.uniqueKey,
        name: item.meta.dbName,
      })),
      (item) => item.key,
    ),
    foreignKeys: targetTypeDes.properties
      .filter((item) => item.meta?.foreignKey && item.meta?.dbName)
      .reduce((res, current) => {
        const foreignTargetTypeDes = get(current.meta.foreignKey.Target.name);
        if (!foreignTargetTypeDes?.meta?.dbTableName) {
          return res;
        }
        const columnName = foreignTargetTypeDes.properties.find((item) => item.key === current.meta.foreignKey.targetPropertyName)?.meta?.dbName;
        if (!columnName) {
          return res;
        }
        res[current.meta.dbName] = {
          action: current.meta.foreignKey.action || BRISK_ORM_FOREIGN_ACTION_E.CASCADE,
          targetTableName: foreignTargetTypeDes.meta.dbTableName,
          targetColumnName: columnName,
        };
        return res;
      }, {} as { [name: string]: BirskOrmForeignKey }),
  };
}
