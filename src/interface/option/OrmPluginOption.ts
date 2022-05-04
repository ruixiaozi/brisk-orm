import { BriskOption } from 'brisk-ioc';

/**
 * OrmPluginOption
 * @description ORM插件选项接口
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export interface OrmPluginOption extends BriskOption {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  authSource: string;
  priority: number;
  useUnifiedTopology?: boolean;
  useNewUrlParser?: boolean;
}
