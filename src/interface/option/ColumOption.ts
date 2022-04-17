import { DBTypeEnum } from '@enum';
import { BriskOption } from 'brisk-ioc';


/**
 * ColumOption
 * @description 字段选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年03月12日 15:58:03
 * @version 2.0.1
 */
export interface ColumOption extends BriskOption {
  type: DBTypeEnum;
  name?: string;
  unique?: boolean;
  required?: boolean;
}
