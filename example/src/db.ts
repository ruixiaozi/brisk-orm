import { OrmPluginOption } from 'brisk-orm';

/**
 * DB_CONFIG
 * @description 数据库配置
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月13日 21:50:13
 * @version 2.0.0
 */
export const DB_CONFIG: OrmPluginOption = {
  username: 'mongoadmin',
  password: 'computer52512',
  host: 'sql.01gzf.com',
  port: 2701,
  database: 'ZerOne_Auth_Test',
  authSource: 'admin',
  priority: 0,
  useUnifiedTopology: true,
  useNewUrlParser: true,
};
