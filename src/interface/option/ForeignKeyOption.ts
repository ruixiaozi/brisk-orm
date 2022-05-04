import { BriskOption } from 'brisk-ioc';
import { Class } from 'brisk-ts-extends/types';

/**
 * ForeignKeyOption
 * @description 外键选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export interface ForeignKeyOption extends BriskOption{
  ref: Class;
  foreignPropName: string;
  localPropName: string;
}
