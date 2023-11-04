import { BriskOrmContext, BriskOrmOperationResult } from '../types';
import { BriskOrmQuery } from './query';

export interface BriskOrmPage {
  // 第几页，0开始
  page: number;
  // 页大小
  pageSize: number;
}

export class BriskOrmDao<K> {

  // 计数

  count(ctx?: BriskOrmContext): Promise<number | undefined> {
    throw new Error('no inject dao');
  }

  countQuery(query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<number | undefined> {
    throw new Error('no inject dao');
  }

  countEveryEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<number | undefined> {
    throw new Error('no inject dao');
  }

  countSomeEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<number | undefined> {
    throw new Error('no inject dao');
  }

  // 列表

  list(ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  listQuery(query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  listEveryEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  listSomeEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  // 分页

  page(page: BriskOrmPage, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  pageQuery(query: BriskOrmQuery<K>, page: BriskOrmPage, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  pageEveryEq(queryEntity: Partial<K>, page: BriskOrmPage, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  pageSomeEq(queryEntity: Partial<K>, page: BriskOrmPage, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  // 查找

  findByPrimaryKey(_value: any, ctx?: BriskOrmContext): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  findQuery(query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  findEveryEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  findSomeEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

  // 保存
  save(_value: K, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  saveAll(_value: K[], ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  // 保存或者更新
  /**
   * @deprecated 更新将导致关联表数据被删除
   */
  saveOrUpdate(_value: K, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  /**
   * @deprecated 更新将导致关联表数据被删除
   */
  saveOrUpdateAll(_value: K[], ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  // 更新
  updateByPrimaryKey(_value: K, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updateQuery(_value: K, query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updateEveryEq(_value: K, queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updateSomeEq(_value: K, queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }


  // 局部更新
  updatePartByPrimaryKey(part: Array<keyof K>, _value: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updatePartQuery(part: Array<keyof K>, _value: Partial<K>, query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updatePartEveryEq(part: Array<keyof K>, _value: Partial<K>, queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  updatePartSomeEq(part: Array<keyof K>, _value: Partial<K>, queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  // 删除
  deleteByPrimaryKey(primaryKey: any, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  deleteQuery(query: BriskOrmQuery<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  deleteEveryEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  deleteSomeEq(queryEntity: Partial<K>, ctx?: BriskOrmContext): Promise<BriskOrmOperationResult> {
    throw new Error('no inject dao');
  }

  /**
   * @deprecated
   */
  findList(ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  /**
   * @deprecated
   */
  findListBy(_key: string, _value: any, ctx?: BriskOrmContext): Promise<K[] | undefined> {
    throw new Error('no inject dao');
  }

  /**
   * @deprecated
   */
  findBy(_key: string, _value: any, ctx?: BriskOrmContext): Promise<K | undefined> {
    throw new Error('no inject dao');
  }

}
