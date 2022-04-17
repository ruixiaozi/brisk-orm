import { BriskOption } from 'brisk-ioc';
import { Class } from 'brisk-ts-extends/types';

/**
 * DaoOperatorOption
 * @description Dao实体操作装饰器选项接口
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月06日 19:48:25
 * @version 2.0.0
 */
export interface DaoOperatorOption extends BriskOption{
  entity: Class;
}
