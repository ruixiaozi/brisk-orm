import { Core, Logger } from 'brisk-ioc';
import Promise from 'bluebird';
import { CallbackError, connect } from 'mongoose';

/**
 * OrmCore
 * @description ORM框架核心
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月05日 14:43:47
 * @version 2.0.0
 */
export class OrmCore {

  private static instance?: OrmCore;

  public static getInstance(): OrmCore {
    if (!OrmCore.instance) {
      OrmCore.instance = new OrmCore();
    }
    return OrmCore.instance;
  }

  public core?: Core;

  public url?: string;

  public useUnifiedTopology: boolean = false;

  public useNewUrlParser: boolean = false;

  public logger: Logger = Logger.getInstance('brisk-orm');

  /**
   * 链接数据库
   * @returns Promise
   */
  public connectAsync(): Promise<void> {
    if (!this.url || !this.core) {
      return Promise.reject(new Error('没有安装ORM'));
    }

    return new Promise((resolve, reject) => {
      connect(
        this.url!,
        {
          useUnifiedTopology: this.useUnifiedTopology,
          useNewUrlParser: this.useNewUrlParser,
          useCreateIndex: true,
        },
        (err: CallbackError) => {
          if (err) {
            this.logger.error('Error connecting db', err.message);
            reject(err);
          } else {
            this.logger.info('db Connected successfully');
            resolve();
          }
        },
      );
    });
  }

}
