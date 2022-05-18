import { BaseDaoOperator, DeleteOpResult } from './BaseDaoOperator';
import {
  ClientSession,
  Model,
  PopulateOptions,
  QueryWithHelpers,
} from 'mongoose';
import { ForeignKeyOption } from '@interface';
import { Class, Key } from 'brisk-ts-extends/types';
import { omit as _omit, camelCase as _camelCase, flatten as _flatten } from 'lodash';
import { MongoDBDaoOperatorFactor } from '@factor/MongoDBDaoOperatorFactor';

interface Excludes {
  excludes: string[];
  subs: Map<string, Excludes>;
}

interface PopulateAndExclude {
  populates: Array<PopulateOptions>;
  excludes: Excludes;
}


/**
 * MongoDBDaoOperator
 * @description MongoDB数据库操作类
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export class MongoDBDaoOperator extends BaseDaoOperator {

  private query?: QueryWithHelpers<any, any>;

  static #selectString: string = '-_id -__v';

  constructor(private model: Model<any, any, any>) {
    super();
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
  static #getPopulatesAndExcludeBFS(resultClass: Class, deepLevel: number): PopulateAndExclude {
    let visitedMap: Map<Class, Array<PopulateOptions>> = new Map();
    const excludeMap: Map<Class, Excludes> = new Map();
    // 第一层父类入队
    let queue = [resultClass];
    // 处理populates
    visitedMap.set(resultClass, []);
    // 处理exclude
    const rootExclude: Excludes = { excludes: [], subs: new Map() };
    const classModel = MongoDBDaoOperatorFactor.getModel(resultClass.name);
    const aliases: {[key: string]: string} = (classModel?.schema as any)?.aliases || {};
    rootExclude.excludes = Object.values(aliases);
    excludeMap.set(resultClass, rootExclude);
    // 最多查询 deepLevel 层
    for (let i = 0; i < deepLevel; i++) {
      // 整层出队
      let size = queue.length;
      while (size--) {
        const parentClass = queue.shift()!;
        const populates = visitedMap.get(parentClass)!;
        const exclude = excludeMap.get(parentClass)!;

        const foreignKeyMap: Map<Key, ForeignKeyOption> | undefined = parentClass.prototype.$foreign_key;
        if (foreignKeyMap) {
          [...foreignKeyMap].forEach(([key, option]) => {
            // 处理子populates
            const subPopulates: Array<PopulateOptions> = [];
            populates.push({
              path: key.toString(),
              select: MongoDBDaoOperator.#selectString,
              populate: subPopulates,
            });
            const subExclude: Excludes = {
              excludes: [],
              subs: new Map(),
            };
            visitedMap.set(option.ref, subPopulates);
            // 处理子exclude
            const subClassModel = MongoDBDaoOperatorFactor.getModel(option.ref.name);
            const subAliases: {[key: string]: string} = (subClassModel?.schema as any)?.aliases || {};
            subExclude.excludes = Object.values(subAliases);
            exclude.subs.set(key.toString(), subExclude);
            excludeMap.set(option.ref, subExclude);
            // 引用类型加入队列
            queue.push(option.ref);
          });
        }
      }
    }
    // 获取生成的嵌套populates
    const populates = visitedMap.get(resultClass)!;
    const excludes = excludeMap.get(resultClass)!;
    return {
      populates,
      excludes,
    };
  }

  #excludeDFS(value: any | any[], excludes: Excludes): any | any[] {
    if (Array.isArray(value)) {
      return value.map((item) => this.#excludeDFS(item, excludes));
    }
    if (excludes.excludes.length && value && typeof value === 'object') {
      if (excludes.subs.size) {
        excludes.subs.forEach((subV, subK) => {
          if (value[subK]) {
            value[subK] = this.#excludeDFS(value[subK], subV);
          }
        });
      }
      return _omit(value, excludes.excludes);
    }
    return value;
  }

  /**
   * 异步单个查询
   * @returns T
   */
  public async findFirstAsync<T>(resultClass: { new(): T }, deepLevel: number): Promise<T | undefined> {
    try {
      // 获取指定深度的populates
      const { populates, excludes } = MongoDBDaoOperator.#getPopulatesAndExcludeBFS(resultClass, deepLevel);
      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }
      const res = await this.query?.select(MongoDBDaoOperator.#selectString).exec();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(res as any);
      const result = JSON.parse(JSON.stringify(res.shift()));
      const resOmit = this.#excludeDFS(result, excludes);
      return resOmit;
    } catch (error: any) {
      this.ormCore?.logger.error('findFirstAsync err');
      throw error;
    } finally {
      // 清除
      this.#clean();
    }
  }


  /**
   * 异步多个查询
   * @returns T[]
   */
  public async findAsync<T>(resultClass: { new(): T }, deepLevel: number): Promise<T[]> {
    try {
      // 获取指定深度的populates
      const { populates, excludes } = MongoDBDaoOperator.#getPopulatesAndExcludeBFS(resultClass, deepLevel);
      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }
      const res = await this.query?.select(MongoDBDaoOperator.#selectString).exec();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(res as any);
      const result = JSON.parse(JSON.stringify(res));
      const resOmit = this.#excludeDFS(result, excludes);
      return resOmit;
    } catch (error: any) {
      this.ormCore?.logger.error('find err');
      throw error;
    } finally {
      // 清除
      this.#clean();
    }
  }

  /**
   * 异步插入，支持外键校验
   * @param data 插入的数据，可以是数组
   * @returns void
   */
  public async insertAsync<T>(data: T, session?: ClientSession): Promise<void> {
    try {
      const foregins = Object.entries(this.model?.schema?.virtuals || {})
        .filter(([, value]: any) => value.options.ref)
        .map(([, value]: any) => value.options);
      const insertDatas = Array.isArray(data) ? data : [data];
      for (const foreign of foregins) {
        const values = [...new Set(_flatten(insertDatas.map((item) => item[_camelCase(foreign.localField)])))];
        const foreignModel = MongoDBDaoOperatorFactor.getModel(foreign.ref);
        const count = (
          await foreignModel?.where(foreign.foreignField)
            .in(values)
            .exec()
        )?.length || 0;
        if (count < values.length) {
          // 有不存在的外键值
          throw new Error(`foreign key: ${foreign.localField} <=> ${foreign.foreignField} not match`);
        }
      }
      const res = await this.model.create(insertDatas, { session });
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(res));
    } catch (error: any) {
      this.ormCore?.logger.error('insert err', error.message);
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
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(res));
    } catch (error: any) {
      this.ormCore?.logger.error('update err', error.message);
      throw error;
    } finally {
      // 清除
      this.#clean();
    }
  }

  /**
   * 异步删除，外键引用一并删除
   * @returns void
   */
  public async deleteAsync(session?: ClientSession, force: boolean = false): Promise<DeleteOpResult> {
    const delSession = await this.ormCore?.conn?.startSession();
    try {
      !session && delSession?.startTransaction();
      const res = await this.query?.find() || [];
      const relations: DeleteOpResult[] = [];
      // 没有找到要删除的，则返回
      if (!res.length) {
        return {
          success: true,
          name: this.model?.modelName,
          count: 0,
          relations,
        };
      }
      // 关联删除
      const outers = MongoDBDaoOperatorFactor.getOuter(this.model?.modelName) || [];
      for (let outer of outers) {
        const relativeRes = [...new Set(res.map((item) => item[outer.localField]))].join(',');
        if (relativeRes) {
          const outerOp = new MongoDBDaoOperatorFactor(outer.outerClass).factory();
          const outerRes = await outerOp?.where(`${outer.outerField}=>${relativeRes}`).deleteAsync(session || delSession, force);
          outerRes?.count && relations.push(outerRes);
        }
      }
      const delRes = await this.query?.deleteMany(undefined, { session: session || delSession });
      // 非强制删除，如果有关联数据，则终止事务，返回false
      if (!force && relations.find((item) => item.count > 0)) {
        !session && await delSession?.abortTransaction();
        return {
          success: false,
          name: this.model?.modelName,
          count: delRes.deletedCount,
          relations,
        };
      }
      !session && await delSession?.commitTransaction();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(delRes));
      return {
        success: true,
        name: this.model?.modelName,
        count: delRes.deletedCount,
        relations,
      };
    } catch (error: any) {
      !session && await delSession?.abortTransaction();
      this.ormCore?.logger.error('delete err', error.message);
      throw error;
    } finally {
      // 清除
      this.#clean();
      delSession?.endSession();
    }
  }

}
