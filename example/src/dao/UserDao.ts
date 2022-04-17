import { User } from './../entity/User';
import { BaseDaoOperator, Dao, DaoOperator } from 'brisk-orm';

@Dao()
export class UserDao {

  @DaoOperator({ entity: User })
  public userOp?: BaseDaoOperator;

}
