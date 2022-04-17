import { Colum, DBTypeEnum, PrimaryKey } from 'brisk-orm';

export class User {

  @PrimaryKey()
  public id?: string;

  @Colum({ type: DBTypeEnum.String })
  public username?: string;

}
