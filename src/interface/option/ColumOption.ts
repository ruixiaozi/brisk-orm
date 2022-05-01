import { DBTypeEnum } from '@enum';
import { BriskOption } from 'brisk-ioc';


/**
 * ColumOption
 * @description 字段选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export interface ColumOption extends BriskOption {
  type: DBTypeEnum;
  name?: string;
  unique?: boolean;
  required?: boolean;
}
