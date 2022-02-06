import { Class } from 'brisk-ioc';
import { IDaoOperatorOption } from './../../interface/option/IDaoOperatorOption';

/**
* DaoOperatorOption
* @description dao操作选项
* @author ruixiaozi
* @email admin@ruixiaozi.com
* @date 2022年02月06日 19:49:40
* @version 2.0.0
*/
export class DaoOperatorOption implements IDaoOperatorOption{

  /**
   * 构造方法
   * @param entity 实体类
   */
  constructor(public entity: Class){}
}
