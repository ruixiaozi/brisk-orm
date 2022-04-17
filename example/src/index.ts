import { BriskORM } from 'brisk-orm';
import { BriskIoC } from "brisk-ioc";

import { DB_CONFIG } from './db';
import { UserDao } from './dao/UserDao';
import { User } from './entity/User';

(async function() {
  await BriskIoC.configurate({
      isDebug: true,
    })
    .use(BriskORM, DB_CONFIG)
    .core
    .scanPackage(__dirname,"./entity", './dao')
    .initAsync();
  let user = new User();
  user.id = '13123123';
  user.username = 'sdf';
  const bean = BriskIoC.core.getBean<UserDao>('userDao');
  console.log(bean);
  bean?.userOp?.insertAsync<User>(user)


})();
