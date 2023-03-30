import { PoolConnection, QueryOptions } from 'mysql2/promise';
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
