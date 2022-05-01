import { OrmCore } from '@core';

/**
 * BaseDaoOperator
 * @description 基础Dao操作类
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export class BaseDaoOperator {

  private readonly err = new Error('BaseDaoOperator注入失败');

  protected ormCore?: OrmCore;

  constructor() {
    this.ormCore = OrmCore.getInstance();
  }


  /**
   * 条件
   * @param qs 条件字符串
   * @returns 类本身
   */
  public where(qs: string): BaseDaoOperator {
    this.ormCore?.logger.warn(`where注入失败: ${qs}`);
    return this;
  }

  /**
   * 排序
   * @param sortObj 排序对象
   * @returns 类本身
   */
  public orderBy(sortObj: any): BaseDaoOperator {
    this.ormCore?.logger.warn(`orderBy注入失败: ${sortObj}`);
    return this;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public findFirstAsync<T>(resultClass: {new():T}, deepLevel: number): Promise<T> {
    this.ormCore?.logger.warn(`findFirstAsync注入失败: ${resultClass}, ${deepLevel}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步多个查询
   * @returns T[]
   */
  public findAsync<T>(resultClass: {new():T}, deepLevel: number): Promise<T[]> {
    this.ormCore?.logger.warn(`findAsync注入失败: ${resultClass}, ${deepLevel}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步插入
   * @param data 插入的数据
   * @returns void
   */
  public insertAsync<T>(data: T): Promise<void> {
    this.ormCore?.logger.warn(`insertAsync注入失败: ${data}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public updateAsync<T>(data: T): Promise<void> {
    this.ormCore?.logger.warn(`updateAsync注入失败: ${data}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步删除
   * @returns void
   */
  public deleteAsync(): Promise<void> {
    this.ormCore?.logger.warn('deleteAsync注入失败');
    return Promise.reject(this.err);
  }


}
