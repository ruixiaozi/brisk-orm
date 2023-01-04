export interface BriskOrmConnectOption {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
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
}

export type BriskOrmSelectFunction<T = any> = (...args: any[]) => Promise<T>;

export interface BriskOrmOperationResult {
  success: boolean;
  affectedRows: number;
}

export type BriskOrmInsertFunction<T = any> = (data: T) => Promise<BriskOrmOperationResult>;

export type BriskOrmUpdateFunction<T = any> = (data: T, ...args: any[]) => Promise<BriskOrmOperationResult>;

export type BriskOrmDeleteFunction = (...args: any[]) => Promise<BriskOrmOperationResult>;
