import { IColumOption, DBType } from './../../interface/option/IColumOption';

/**
 * ColumOption
 * @description 字段选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年03月12日 15:59:26
 * @version 2.0.1
 */
export class ColumOption implements IColumOption {

  constructor(
    public type: DBType,
    public unique: boolean = false,
    public required: boolean = false,
    public name?: string,
  ) {}

}
