import Promise from "bluebird";
/**
* BaseDaoOperator
* @description 基础Dao操作类
* @author ruixiaozi
* @email admin@ruixiaozi.com
* @date 2022年02月06日 19:26:46
* @version 2.0.0
*/
export abstract class BaseDaoOperator {


  private static _err = new Error("基础Dao注入失败");


  /**
   * 条件
   * @param qs 条件字符串
   * @returns 类本身
   */
  public where(qs: string): BaseDaoOperator {
    return this;
  }

  /**
   * 排序
   * @param sortObj 排序对象
   * @returns 类本身
   */
  public orderBy(sortObj: any): BaseDaoOperator {
    return this;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public findFirstAsync<T>(): Promise<T> {
    return Promise.reject(BaseDaoOperator._err);
  }

  /**
   * 异步多个查询
   * @returns T[]
   */
  public findAsync<T>(): Promise<T[]>{
    return Promise.reject(BaseDaoOperator._err);
  }

  /**
   * 异步插入
   * @param data 插入的数据
   * @returns void
   */
  public insertAsync<T>(data: T): Promise<void>{
    return Promise.reject(BaseDaoOperator._err);
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public updateAsync<T>(data: T): Promise<void>{
    return Promise.reject(BaseDaoOperator._err);
  }

  /**
   * 异步删除
   * @returns void
   */
  public deleteAsync(): Promise<void> {
    return Promise.reject(BaseDaoOperator._err);
  }


}
