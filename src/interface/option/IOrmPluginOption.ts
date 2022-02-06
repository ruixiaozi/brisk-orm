import { IOption } from "brisk-ioc";

/**
 * IOrmPluginOption
 * @description ORM插件选项接口
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月05日 14:45:50
 * @version 2.0.0
 */
export interface IOrmPluginOption extends IOption {
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
