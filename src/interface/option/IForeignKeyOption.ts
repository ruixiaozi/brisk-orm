import { Class, IOption } from 'brisk-ioc';

/**
 * IDaoOption
 * @description 外键选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月19日 18:56:10
 * @version 2.0.1
 */
export interface IForeignKeyOption extends IOption{
  ref: Class;
  foreignPropName: string;
  localPropName: string;
}
