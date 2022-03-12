import { IOrmPluginOption } from './../../interface/option/IOrmPluginOption';

/**
 * OrmPluginOption
 * @description orm插件选项
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月05日 15:06:46
 * @version 2.0.0
 */
export class OrmPluginOption implements IOrmPluginOption {


  /**
   * 构造方法
   * @param username 用户名
   * @param password 密码
   * @param host 主机
   * @param port 端口
   * @param database 数据库
   * @param authSource 认证源
   * @param priority 优先级,默认值 0
   * @param useUnifiedTopology
   * @param useNewUrlParser
   */
  constructor(
    public username: string,
    public password: string,
    public host: string,
    public port: number,
    public database: string,
    public authSource: string,
    public priority: number = 0,
    public useUnifiedTopology?: boolean,
    public useNewUrlParser?: boolean,
  ) {}

}
