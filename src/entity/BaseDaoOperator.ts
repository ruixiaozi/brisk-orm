import { OrmCore } from '@core';
import { Class } from 'brisk-ts-extends/types';

export interface DeleteOpResult {
  success: boolean;
  name: string;
  count: number;
  relations: DeleteOpResult[];
}

export interface UpdateOpData {
  [key: string]: any;
}

export interface UpdateOpResult {
  name: string;
  count: number;
  relations: UpdateOpResult[];
}

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
   * 限制
   * @param count 个数
   * @param start 开始位置
   * @returns 类本身
   */
  public limit(count: number, start?: number): BaseDaoOperator {
    this.ormCore?.logger.warn(`limit注入失败: ${count} ${start}`);
    return this;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public findFirstAsync<T>(resultClass: Class<T>, deepLevel: number): Promise<T | undefined> {
    this.ormCore?.logger.warn(`findFirstAsync注入失败: ${resultClass}, ${deepLevel}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步多个查询
   * @returns T[]
   */
  public findAsync<T>(resultClass: Class<T>, deepLevel: number): Promise<T[]> {
    this.ormCore?.logger.warn(`findAsync注入失败: ${resultClass}, ${deepLevel}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步插入
   * @param data 插入的数据
   * @returns void
   */
  public insertAsync<T>(data: T, session?: any): Promise<void> {
    this.ormCore?.logger.warn(`insertAsync注入失败: ${data}, ${session}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public updateAsync(data: UpdateOpData, session?: any): Promise<UpdateOpResult> {
    this.ormCore?.logger.warn(`updateAsync注入失败: ${data}, ${session}`);
    return Promise.reject(this.err);
  }

  /**
   * 异步删除
   * @returns void
   */
  public deleteAsync(session?: any, force: boolean = false): Promise<DeleteOpResult> {
    this.ormCore?.logger.warn(`deleteAsync注入失败, ${session}, ${force}`);
    return Promise.reject(this.err);
  }


}
