import { BriskOption } from 'brisk-ioc';
import { Class } from 'brisk-ts-extends/types';

/**
 * ForeignKeyOption
 * @description 外键选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月19日 18:56:10
 * @version 2.0.1
 */
export interface ForeignKeyOption extends BriskOption{
  ref: Class;
  foreignPropName: string;
  localPropName: string;
}
