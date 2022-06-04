import { BaseDaoOperator, DeleteOpResult, UpdateOpResult, UpdateOpData } from './BaseDaoOperator';
import {
  ClientSession,
  Model,
  PopulateOptions,
  QueryWithHelpers,
} from 'mongoose';
import { ForeignKeyOption } from '@interface';
import { Class, Key } from 'brisk-ts-extends/types';
import {
  omit as _omit,
  camelCase as _camelCase,
  flatten as _flatten,
  escapeRegExp as _escapeRegExp,
} from 'lodash';
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
    const patter = /(?<key>[^=><!:]*)(?<oprate>[=><!:]+)(?<value>[^=><!:]*)/u;
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
            // 包含
            case '=>':
              this.query = this.query.in(value.split(','));
              break;
            // 模糊查询
            case ':=':
              this.query = this.query.regex(_escapeRegExp(value));
              break;
            // 范围不包含端点
            case '!=':
              this.query = this.query.ne(value);
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
   * 限制
   * @param count 个数
   * @param start 开始位置
   * @returns 类本身
   */
  public limit(count: number, start?: number): BaseDaoOperator {
    if (start) {
      this.query = this.query?.skip(start);
    }
    this.query = this.query?.limit(count);
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
  public async findFirstAsync<T>(resultClass: Class<T>, deepLevel: number): Promise<T | undefined> {
    try {
      // 获取指定深度的populates
      const { populates, excludes } = MongoDBDaoOperator.#getPopulatesAndExcludeBFS(resultClass, deepLevel);
      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }
      const res = await this.query?.select(MongoDBDaoOperator.#selectString).lean()
        .exec();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(res, undefined, 2));
      const result = JSON.parse(JSON.stringify(res.shift()));
      const resOmit = this.#excludeDFS(result, excludes);
      return resOmit;
    } catch (error: any) {
      this.ormCore?.isDebug && this.ormCore?.logger.debug(error.message, error);
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
  public async findAsync<T>(resultClass: Class<T>, deepLevel: number): Promise<T[]> {
    try {
      // 获取指定深度的populates
      const { populates, excludes } = MongoDBDaoOperator.#getPopulatesAndExcludeBFS(resultClass, deepLevel);
      if (populates.length > 0) {
        this.query = this.query?.populate(populates);
      }
      const res = await this.query?.select(MongoDBDaoOperator.#selectString).lean()
        .exec();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(res, undefined, 2));
      const result = JSON.parse(JSON.stringify(res));
      const resOmit = this.#excludeDFS(result, excludes);
      return resOmit;
    } catch (error: any) {
      this.ormCore?.isDebug && this.ormCore?.logger.debug(error.message, error);
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
      this.ormCore?.isDebug && this.ormCore?.logger.debug(error.message, error);
      throw error;
    }
  }

  /**
   * 异步更新
   * @param data 更新的数据
   * @returns void
   */
  public async updateAsync(data: UpdateOpData, session?: ClientSession): Promise<UpdateOpResult> {
    const delSession = await this.ormCore?.conn?.startSession();
    try {
      !session && delSession?.startTransaction();
      const relations: UpdateOpResult[] = [];
      const res = await this.query?.find() || [];
      if (!res.length || !Object.keys(data).length) {
        throw new Error('not found: update datas');
      }

      // 首先查当前修改的如果时外键，则要判断外键是否存在
      const upateKeys = Object.keys(data);
      const foregins = Object.entries(this.model?.schema?.virtuals || {})
        .map(([, value]: any) => value.options)
        .filter((foreign) => foreign.ref && upateKeys.includes(_camelCase(foreign.localField)));


      for (const foreign of foregins) {
        const values = data[_camelCase(foreign.localField)];
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

      // 检查修改的字段是否被外部引用，如果有，则需要同步修改
      const outers = (MongoDBDaoOperatorFactor.getOuter(this.model?.modelName) || [])
        .filter((item) => upateKeys.includes(_camelCase(item.localField)));

      for (let outer of outers) {
        const outerModel = MongoDBDaoOperatorFactor.getModel(outer.outerClass.name);
        const updateRes = await outerModel?.where(outer.outerField)
          .in(res.map((item) => item[outer.localField]))
          .updateMany(undefined, {
            // 更新数组中第一个匹配的
            '$set': {
              [`${outer.outerField}.$`]: data[_camelCase(outer.localField)],
            },
          }, session || delSession);
        if (updateRes?.nModified) {
          relations.push({
            name: outer.outerClass.name,
            count: updateRes?.nModified,
            relations: [],
          });
        }
      }

      const updateRes = await this.query?.updateMany(undefined, data, { session });
      !session && await delSession?.commitTransaction();
      this.ormCore?.isDebug && this.ormCore?.logger.debug(JSON.stringify(res));
      return {
        name: this.model?.modelName,
        count: updateRes?.nModified || 0,
        relations,
      };
    } catch (error: any) {
      this.ormCore?.isDebug && this.ormCore?.logger.debug(error.message, error);
      !session && await delSession?.abortTransaction();
      throw error;
    } finally {
      // 清除
      this.#clean();
      delSession?.endSession();
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
        throw new Error('not found: no datas');
      }

      // 关联删除（删除引用地方（数组中）的值）
      const outers = MongoDBDaoOperatorFactor.getOuter(this.model?.modelName) || [];
      for (let outer of outers) {
        const outerModel = MongoDBDaoOperatorFactor.getModel(outer.outerClass.name);
        const relativeRes = [...new Set(res.map((item) => item[outer.localField]))];
        if (relativeRes) {
          const updateRes = await outerModel?.where(outer.outerField)
            .in(relativeRes)
            .updateMany(undefined, {
            // 删除关联的数据
              '$pull': {
                [outer.outerField]: {
                  '$in': relativeRes,
                },
              },
            }, session || delSession);
          updateRes?.nModified && relations.push({
            name: outer.outerClass.name,
            count: updateRes?.nModified,
            success: true,
            relations: [],
          });
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
      this.ormCore?.isDebug && this.ormCore?.logger.debug(error.message, error);
      throw error;
    } finally {
      // 清除
      this.#clean();
      delSession?.endSession();
    }
  }

}
