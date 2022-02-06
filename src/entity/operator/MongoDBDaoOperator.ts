import { BaseDaoOperator } from "./BaseDaoOperator";
import Promise from "bluebird";
import {
  CallbackError,
  Model,
  QueryWithHelpers,
} from "mongoose";

/**
 * MongoDBDaoOperator
 * @description MongoDB数据库操作类
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月06日 21:36:20
 * @version 2.0.0
 */
export class MongoDBDaoOperator extends BaseDaoOperator {
  private _query?: QueryWithHelpers<any, any>;

  constructor(private _model: Model<any, any, any>) {
    super();
    this.#clean();
  }

  #clean(): void {
    this._query = this._model.find();
  }

  /**
   * 条件
   * @param qs 条件字符串
   * @returns 类本身
   */
  public where(qs: string): MongoDBDaoOperator {
    const qsList = qs.split("&");
    const patter = /([^=><]*)([=><]+)([^=><]*)/;
    qsList.forEach((s) => {
      const re = patter.exec(s);

      if (re !== null && re.length >= 4) {
        const [, /*丢弃0下标元素 */ key, oprate, value] = re;
        this._query = this._query?.where(key);
        if (this._query) {
          switch (oprate) {
            case "<":
              this._query = this._query.lt(parseFloat(value));
              break;
            case ">":
              this._query = this._query.gt(parseFloat(value));
              break;
            case "=":
              this._query = this._query.equals(value);
              break;
            case "<=":
              this._query = this._query.lte(parseFloat(value));
              break;
            case ">=":
              this._query = this._query.gte(parseFloat(value));
              break;
            case "=>":
              this._query = this._query.in(value.split(","));
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
    this._query = this._query?.sort(sortObj);
    return this;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public findFirstAsync<T>(): Promise<T> {
    return new Promise((resolve, reject) => {
      this._query?.findOne((err: CallbackError, res: T) => {
        // 清除
        this.#clean();
        if (err) {
          console.log("findFirst err");
          reject(err);
        } else {
          console.log(res);
          resolve(res);
        }
      });
    });
  }

  /**
   * 异步多个查询
   * @returns T[]
   */
  public findAsync<T>(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this._query?.exec((err: CallbackError, res: T[]) => {
        // 清除
        this.#clean();
        if (err) {
          console.log("find err");
          reject(err);
        } else {
          console.log(res);
          resolve(res);
        }
      });
    });
  }

  /**
   * 异步插入
   * @param data 插入的数据
   * @returns void
   */
  public insertAsync<T>(data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this._model.create(data, (err: CallbackError, res: any) => {
        if (err) {
          console.log("insert err");
          reject(err);
        } else {
          console.log(res);
          resolve(void 0);
        }
      });
    });
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public updateAsync<T>(data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this._query?.updateMany(data, (err: CallbackError, res: any) => {
        // 清除
        this.#clean();
        if (err) {
          console.log("update err");
          reject(err);
        } else {
          console.log(res);
          resolve(void 0);
        }
      });
    });
  }

  /**
   * 异步删除
   * @returns void
   */
  public deleteAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._query?.deleteMany((err: CallbackError, res: any) => {
        // 清除
        this.#clean();
        if (err) {
          console.log("delete err");
          reject(err);
        } else {
          console.log(res);
          resolve(void 0);
        }
      });
    });
  }
}
