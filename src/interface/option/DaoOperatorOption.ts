import { BriskOption } from 'brisk-ioc';
import { Class } from 'brisk-ts-extends/types';

/**
 * DaoOperatorOption
 * @description Dao实体操作装饰器选项接口
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export interface DaoOperatorOption extends BriskOption{
  entity: Class;
}
