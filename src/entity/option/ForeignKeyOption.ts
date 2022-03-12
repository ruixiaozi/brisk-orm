import { Class } from 'brisk-ioc';
import { IForeignKeyOption } from './../../interface/option/IForeignKeyOption';

/**
 * ForeignKeyOption
 * @description 外键选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月19日 19:00:42
 * @version 2.0.1
 */
export class ForeignKeyOption implements IForeignKeyOption {

  constructor(
    public ref: Class,
    public foreignPropName: string,
    public localPropName: string,
  ) { }

}
