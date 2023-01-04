import BriskIoC from 'brisk-ioc';
import BriskOrm from 'brisk-orm';
import path from 'path';
// 需要自己配置
import { dbConfig } from './db-config';
import { TestService } from './service/TestService';

(async function() {
  BriskOrm.connect(dbConfig);
  BriskIoC.configure({
    beanPathes: [path.join(__dirname, './dao'), path.join(__dirname, './service')]
  });
  await BriskIoC.scanBean();
  const res = await BriskIoC.getBean(TestService)?.getAll();
  console.log(res);
  await BriskOrm.distory();
})();
