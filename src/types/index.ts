import { Class } from 'brisk-ts-extends';
import { QueryOptions } from 'mysql2/promise';
export interface BriskOrmConnectOption {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
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
  isCount?: boolean;
}

export type BriskOrmSelectFunction<T = any> = (...args: any[]) => Promise<T>;

export interface BriskOrmOperationResult {
  success: boolean;
  affectedRows: number;
}

export type BriskOrmInsertFunction<T = any> = (data: T, ctx?: BriskOrmContext) => Promise<BriskOrmOperationResult>;

export type BriskOrmUpdateFunction<T = any> = (data: T, ...args: any[]) => Promise<BriskOrmOperationResult>;

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
  DOUBLE='double',
  FLOAT='float',
  VARCHAR='varchar',
  TEXT='text',
  JSON='json',
  DATETIME='datetime',
  DATE='date',
  TIME='time',
  TINYINT='tinyint'
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
}

export interface BriskOrmColumnOption {
  dbName?: string;
  type?: BRISK_ORM_TYPE_E;
  length?: number;
  precision?: number;
  autoIncrement?: boolean;
  default?: any;
  // 所属key名称
  uniqueKey?: string;
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
  // 默认为CASCADE
  action?: BRISK_ORM_FOREIGN_ACTION_E;
}
