import { Class } from 'brisk-ioc';
import { IDaoOption } from './../../interface/option/IDaoOption';

export class DaoOption implements IDaoOption{
  /**
   * 构造方法
   * @param entities 实体类列表
   */
  constructor(public entities: Class[]){}
}
