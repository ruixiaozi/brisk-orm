import { connect, Mongoose } from 'mongoose';
import { BriskLog, Logger } from 'brisk-log';

/**
 * OrmCore
 * @description ORM框架核心
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export class OrmCore {

  static #instance?: OrmCore;

  public static getInstance(): OrmCore {
    if (!OrmCore.#instance) {
      OrmCore.#instance = new OrmCore();
    }
    return OrmCore.#instance;
  }

  public isInstall = false;

  public url?: string;

  public useUnifiedTopology: boolean = false;

  public useNewUrlParser: boolean = false;

  public isDebug = false;

  public conn?: Mongoose;

  public logger: Logger = BriskLog.getLogger(Symbol('brisk-orm'));

  /**
   * 链接数据库
   * @returns Promise
   */
  public async connectAsync(): Promise<void> {
    if (!this.isInstall) {
      this.logger.error('no install brisk-controller');
      return Promise.reject(new Error('no install brisk-orm'));
    }

    try {
      this.conn = await connect(
        this.url!,
        {
          useUnifiedTopology: this.useUnifiedTopology,
          useNewUrlParser: this.useNewUrlParser,
          useCreateIndex: true,
        },
      );
      this.logger.info('db Connected successfully');
    } catch (err: any) {
      this.logger.error('Error connecting db', err.message);
      throw err;
    }
  }

}
