import { Class, IOption } from 'brisk-ioc';

/**
* IDaoOption
* @description Dao选项接口
* @author ruixiaozi
* @email admin@ruixiaozi.com
* @date 2022年02月05日 16:28:49
* @version 2.0.0
*/
export interface IDaoOption extends IOption{
  entities: Class[];
}
