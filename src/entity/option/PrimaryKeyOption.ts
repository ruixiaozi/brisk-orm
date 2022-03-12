import { DBType } from './../../interface/option/IColumOption';
import { IPrimaryKeyOption } from './../../interface/option/IPrimaryKeyOption';

export class PrimaryKeyOption implements IPrimaryKeyOption {

  public type: DBType;

  constructor(public name?: string) {
    this.type = DBType.PrimaryKey;
  }

}
