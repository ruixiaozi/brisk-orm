import { IOption } from 'brisk-ioc';

export enum DBType {
  Number,
  String,
  Array,
  Date,
  Boolean,
  PrimaryKey,
}

/**
 * IColumOption
 * @description 字段选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年03月12日 15:58:03
 * @version 2.0.1
 */
export interface IColumOption extends IOption {
  type: DBType;
  name?: string;
  unique?: boolean;
  required?: boolean;
}
