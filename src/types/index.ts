import { Class } from 'brisk-ts-extends';
import { QueryOptions } from 'mysql2/promise';
export interface BriskOrmConnectOption {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
  // 是否开启数据库同步，默认只同步新增表
  autoSync: {
    enable: boolean;
    expectTables?: string[];
    // 默认false。设置true开启删除多余表格
    enableDeleteTable?: boolean;
    // 默认false。设置true开启更新存在的表格
    enableUpdateTable?: boolean;
  };
}

export enum BRISK_ORM_PARAM_TYPE_E {
  RAW='raw',
}

export interface BriskOrmComplexMapping {
  // 取dbProp列对应的值作为参数调用selelct
  dbProp: string;
  // select的时候目标的列名，可选
  targetDbProp?: string;
  selectId: string;
}

export interface BriskOrmEntityMapping {
  // 映射关系，key为类字段，value为数据库字段 或者 复杂映射对象
  [key: string]: string | BriskOrmComplexMapping;
}

export interface BriskOrmResultOption {
  // 默认false
  isList?: boolean;
  // 映射关系，key为类字段，value为数据库字段
  mapping?: BriskOrmEntityMapping;
  // 默认false
  /**
   * @deprecated 使用aggregation
   */
  isCount?: boolean;
  aggregation?: boolean;
}

export type BriskOrmSelectFunction<T = any> = (...args: any[]) => Promise<T>;

export interface BriskOrmOperationResult {
  success: boolean;
  affectedRows: number;
}

export type BriskOrmInsertFunction<T = any> = (data: T, ctx?: BriskOrmContext) => Promise<BriskOrmOperationResult>;

export type BriskOrmUpdateFunction<T = any> = (data: Partial<T>, ...args: any[]) => Promise<BriskOrmOperationResult>;

export type BriskOrmDeleteFunction = (...args: any[]) => Promise<BriskOrmOperationResult>;

export interface BriskOrmContext {
  // 事务回滚
  rollback: (transactionName: string) => Promise<void> | undefined;
  // 事务提交
  commit: () => Promise<void> | undefined;
  // 事务结束（必须调用）
  end: () => void | undefined;
  // 内部使用，忽略
  query: (options: QueryOptions) => Promise<any> | undefined;
}

export enum BRISK_ORM_TYPE_E {
  INT='int',
  // 都使用bigint
  LONG='bigint',
  BIGINT='bigint',
  DOUBLE='double',
  FLOAT='float',
  VARCHAR='varchar',
  TEXT='text',
  JSON='json',
  DATETIME='datetime',
  DATE='date',
  TIME='time',
  TINYINT='tinyint',
  GEOMETRY='geometry'
}

export enum BRISK_ORM_FOREIGN_ACTION_E {
  // 默认，级联动作
  CASCADE='CASCADE',
  // 设置为空
  SET_NULL='SET NULL',
  // 无动作
  NO_ACTION='NO ACTION'
}

export interface BriskOrmColumn {
  name: string;
  type: BRISK_ORM_TYPE_E;
  length?: number;
  precision?: number;
  notNull?: boolean;
  autoIncrement?: boolean;
  default?: any;
}

// key为唯一键名称，name为列名
export type BriskOrmUniqueKey = { key: string, name: string }[];


export interface BirskOrmForeignKey {
  targetTableName: string;
  targetColumnName: string;
  action: BRISK_ORM_FOREIGN_ACTION_E;
}

export interface BriskOrmTable {
  charset: string;
  collate: string;
  engine: 'InnoDB';
  columns: BriskOrmColumn[];
  primaryKeys: string[];
  // 子对象的key和父对象key一样，name为column名称
  uniqueKeys: { [key: string]: BriskOrmUniqueKey };
  // name为列名
  foreignKeys: { [name: string]: BirskOrmForeignKey };
}


export interface BriskOrmTableOption {
  charset?: string;
  collate?: string;
  engine?: 'InnoDB';
  // 是否开启软删除，软删除的删除将变成更新、更新查找只找未删除的
  softDelete?: boolean;
}

export interface BriskOrmColumnOption {
  dbName?: string;
  type?: BRISK_ORM_TYPE_E;
  length?: number;
  precision?: number;
  autoIncrement?: boolean;
  // 初始默认值和软删除恢复时的值
  default?: any;
  // 所属key名称，可以是数组，构造多唯一键
  uniqueKey?: string | string[];
  // 是否为主键
  isPrimaryKey?: boolean;
  // 为外键
  foreignKey?: {
    // 目标类
    Target: Class,
    // 目标类字段名称
    targetPropertyName: string,
    // 默认为CASCADE
    action?: BRISK_ORM_FOREIGN_ACTION_E;
  };
  // 开启软删除后，删除变成更新，更新后的值，可以是固定值，也可以是方法
  deleteValue?: any | (() => any);
}

export interface BriskOrmPrimaryKeyOption {
  dbName?: string;
  type?: BRISK_ORM_TYPE_E;
  length?: number;
  precision?: number;
  autoIncrement?: boolean;
  default?: any;
}


export interface BriskOrmForeignKeyOption {
  dbName?: string;
  type?: BRISK_ORM_TYPE_E;
  length?: number;
  precision?: number;
  autoIncrement?: boolean;
  default?: any;
  // 所属key名称
  uniqueKey?: string;
  // 默认为CASCADE
  action?: BRISK_ORM_FOREIGN_ACTION_E;
}

export * from './innerClass';
