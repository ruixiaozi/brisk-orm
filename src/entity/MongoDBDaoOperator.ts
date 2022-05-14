import { BaseDaoOperator } from './BaseDaoOperator';
import {
  CallbackError,
  ClientSession,
  Model,
  PopulateOptions,
  QueryWithHelpers,
} from 'mongoose';
import { ForeignKeyOption } from '@interface';
import { Class, Key } from 'brisk-ts-extends/types';

/**
 * MongoDBDaoOperator
 * @description MongoDB数据库操作类
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export class MongoDBDaoOperator extends BaseDaoOperator {

  private query?: QueryWithHelpers<any, any>;

  private selectString: string;

  constructor(private model: Model<any, any, any>) {
    super();
    this.selectString = ['_id', '__v'].map((item) => `-${item}`).join(' ');
    this.#clean();
  }

  #clean(): void {
    this.query = this.model.find();
  }

  /**
   * 条件
   * @param qs 条件字符串
   * @returns 类本身
   */
  public where(qs: string): MongoDBDaoOperator {
    const qsList = qs.split('&');
    const patter = /(?<key>[^=><]*)(?<oprate>[=><]+)(?<value>[^=><]*)/u;
    qsList.forEach((qsItem) => {
      const re = patter.exec(qsItem);

      if (re !== null && re.length >= 4) {
        const { key, oprate, value } = re.groups as any;
        this.query = this.query?.where(key);
        if (this.query) {
          switch (oprate) {
            case '<':
              this.query = this.query.lt(parseFloat(value));
              break;
            case '>':
              this.query = this.query.gt(parseFloat(value));
              break;
            case '=':
              this.query = this.query.equals(value);
              break;
            case '<=':
              this.query = this.query.lte(parseFloat(value));
              break;
            case '>=':
              this.query = this.query.gte(parseFloat(value));
              break;
            case '=>':
              this.query = this.query.in(value.split(','));
              break;
            // no default
          }
        }
      }
    });
    return this;
  }

  /**
   * 排序
   * @param sortObj 排序对象
   * @returns 类本身
   */
  public orderBy(sortObj: any): MongoDBDaoOperator {
    this.query = this.query?.sort(sortObj);
    return this;
  }

  /**
   * 广度优先搜索，获取指定深度的嵌套查询条件
   * @param resultClass 返回类型
   * @param deepLevel 深度层次
   * @returns
   */
  #getPopulatesBFS(resultClass: Class, deepLevel: number): Array<PopulateOptions> {
    let visitedMap: Map<Class, Array<PopulateOptions>> = new Map();
    // 第一层父类入队
    let queue = [resultClass];
    visitedMap.set(resultClass, []);
    // 最多查询 deepLevel 层
    for (let i = 0; i < deepLevel; i++) {
      // 整层出队
      let size = queue.length;
      while (size--) {
        const parentClass = queue.shift()!;
        const populates = visitedMap.get(parentClass)!;
        const foreignKeyMap: Map<Key, ForeignKeyOption> | undefined = parentClass.prototype.$foreign_key;
        if (foreignKeyMap) {
          [...foreignKeyMap].forEach(([key, option]) => {
            const subPopulates: Array<PopulateOptions> = [];
            populates.push({
              path: key.toString(),
              select: this.selectString,
              populate: subPopulates,
            });
            queue.push(option.ref);
            visitedMap.set(option.ref, subPopulates);
          });
        }
      }
    }
    // 获取生成的嵌套populates
    const populates = visitedMap.get(resultClass)!;
    return populates;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public findFirstAsync<T>(resultClass: { new(): T }, deepLevel: number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      // 获取指定深度的populates
      const populates = this.#getPopulatesBFS(resultClass, deepLevel);

      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }

      this.query?.select(this.selectString).exec((err: CallbackError, res: T[]) => {
        // 清除
        this.#clean();
        if (err) {
          super.ormCore?.logger.error('findFirstAsync err');
          reject(err);
        } else {
          super.ormCore?.isDebug && super.ormCore?.logger.debug(res as any);
          resolve(res.shift());
        }
      });
    });
  }


  /**
   * 异步多个查询
   * @returns T[]
   */
  public findAsync<T>(resultClass: { new(): T }, deepLevel: number): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // 获取指定深度的populates
      const populates = this.#getPopulatesBFS(resultClass, deepLevel);

      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }

      this.query?.select(this.selectString).exec((err: CallbackError, res: T[]) => {
        // 清除
        this.#clean();
        if (err) {
          super.ormCore?.logger.error('find err');
          reject(err);
        } else {
          super.ormCore?.isDebug && super.ormCore?.logger.debug(res as any);
          resolve(res);
        }
      });
    });
  }

  /**
   * 异步插入
   * @param data 插入的数据，可以是数组
   * @returns void
   */
  public async insertAsync<T>(data: T, session?: ClientSession): Promise<void> {
    try {
      const insertDatas = Array.isArray(data) ? data : [data];
      const res = await this.model.create(insertDatas, { session });
      super.ormCore?.isDebug && super.ormCore?.logger.debug(JSON.stringify(res));
    } catch (error: any) {
      super.ormCore?.logger.error('insert err', error.message);
      throw error;
    }
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public async updateAsync<T>(data: T, session?: ClientSession): Promise<void> {
    try {
      const res = await this.query?.updateMany(undefined, data, { session });
      super.ormCore?.isDebug && super.ormCore?.logger.debug(JSON.stringify(res));
    } catch (error: any) {
      super.ormCore?.logger.error('update err', error.message);
      throw error;
    } finally {
      // 清除
      this.#clean();
    }
  }

  /**
   * 异步删除
   * @returns void
   */
  public deleteAsync(session?: ClientSession): Promise<void> {
    return new Promise((resolve, reject) => {
      this.query?.deleteMany(undefined, { session }, (err: CallbackError, res: any) => {
        // 清除
        this.#clean();
        if (err) {
          super.ormCore?.logger.error('delete err');
          reject(err);
        } else {
          super.ormCore?.isDebug && super.ormCore?.logger.debug(res);
          resolve(void 0);
        }
      });
    });
  }

}
