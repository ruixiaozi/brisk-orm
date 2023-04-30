import mysql from 'mysql2/promise';
import { BriskOrmEntityMapping } from '../types';


type BriskOrmOperator = '=' | '<>' | '>' | '<' | '>=' | '<='
  | 'between' | 'notBetween' | 'like' | 'notLike' | 'likeLeft' | 'likeRight' | 'notLikeLeft' | 'notLikeRight'
  | 'isNull' | 'isNotNull' | 'in' | 'notIn'
  | 'json_contains';

type BriskOrmConnector = 'or' | 'and';

type BriskOrmCommonCondition<T> = [keyof T, BriskOrmOperator, any, any];

type BriskOrmCondition<T> = BriskOrmCommonCondition<T> | BriskOrmConnector | BriskOrmQuery<any>;

type BriskOrmSubConditionFactor<T> = (query: BriskOrmQuery<T>) => BriskOrmQuery<T>;

export enum BRISK_ORM_ORDER_BY_E {
  ASC='ASC',
  DESC='DESC',
}

export class BriskOrmQuery<T> {

  private conditions: BriskOrmCondition<T>[] = [];

  private defaultConnector: BriskOrmConnector = 'and';

  private groupByKeys: Set<keyof T> = new Set();

  private orderByKeys: Set<keyof T> = new Set();

  private orderByDirection = BRISK_ORM_ORDER_BY_E.ASC;

  private oneOperator(key: keyof T, value: any, operator: BriskOrmOperator): BriskOrmQuery<T> {
    if (value === undefined || value === null) {
      return this;
    }
    this.conditions.push([key, operator, value, undefined], this.defaultConnector);
    return this;
  }

  eq(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '=');
  }

  ne(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '<>');
  }

  gt(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '>');
  }

  ge(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '>=');
  }

  lt(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '<');
  }

  le(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, '<=');
  }

  between(key: keyof T, value1: any, value2: any): BriskOrmQuery<T> {
    if (value1 === undefined || value1 === null || value2 === undefined || value2 === null) {
      return this;
    }
    this.conditions.push([key, 'between', value1, value2], this.defaultConnector);
    return this;
  }

  notBetween(key: keyof T, value1: any, value2: any): BriskOrmQuery<T> {
    if (value1 === undefined || value1 === null || value2 === undefined || value2 === null) {
      return this;
    }
    this.conditions.push([key, 'notBetween', value1, value2], this.defaultConnector);
    return this;
  }

  like(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'like');
  }

  notLike(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'notLike');
  }

  likeLeft(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'likeLeft');
  }

  likeRight(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'likeRight');
  }

  notLikeLeft(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'notLikeLeft');
  }

  notLikeRight(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'notLikeRight');
  }

  isNull(key: keyof T): BriskOrmQuery<T> {
    this.conditions.push([key, 'isNull', undefined, undefined], this.defaultConnector);
    return this;
  }

  isNotNull(key: keyof T): BriskOrmQuery<T> {
    this.conditions.push([key, 'isNotNull', undefined, undefined], this.defaultConnector);
    return this;
  }

  in(key: keyof T, value: any[]): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'in');
  }

  notIn(key: keyof T, value: any[]): BriskOrmQuery<T> {
    return this.oneOperator(key, value, 'notIn');
  }

  includes(key: keyof T, value: any): BriskOrmQuery<T> {
    return this.oneOperator(key, JSON.stringify(value), 'json_contains');
  }


  nested(sub: BriskOrmSubConditionFactor<T>): BriskOrmQuery<T> {
    this.conditions.push(sub(new BriskOrmQuery<T>()), this.defaultConnector);
    return this;
  }

  or(sub?: BriskOrmSubConditionFactor<T>): BriskOrmQuery<T> {
    if (this.conditions.length) {
      const last = this.conditions.at(-1);
      if (typeof last === 'string' && ['and', 'or'].includes(last)) {
        this.conditions.pop();
      }
      this.conditions.push('or');
    }
    if (sub) {
      this.nested(sub);
    }
    return this;
  }

  and(sub?: BriskOrmSubConditionFactor<T>): BriskOrmQuery<T> {
    if (this.conditions.length) {
      const last = this.conditions.at(-1);
      if (typeof last === 'string' && ['and', 'or'].includes(last)) {
        this.conditions.pop();
      }
      this.conditions.push('and');
    }
    if (sub) {
      this.nested(sub);
    }
    return this;
  }

  everyEq(entity: Partial<T>): BriskOrmQuery<T> {
    this.nested((query) => {
      Object.entries(entity).forEach(([key, value]: any) => {
        query.eq(key, value);
      });
      return query;
    });
    return this;
  }

  someEq(entity: Partial<T>): BriskOrmQuery<T> {
    this.nested((query) => {
      Object.entries(entity).forEach(([key, value]: any) => {
        query.or().eq(key, value);
      });
      return query;
    });
    return this;
  }

  groupBy(...keys: (keyof T)[]): BriskOrmQuery<T> {
    keys.forEach((key) => {
      this.groupByKeys.add(key);
    });
    return this;
  }

  orderBy(direction: BRISK_ORM_ORDER_BY_E, ...keys: (keyof T)[]): BriskOrmQuery<T> {
    this.orderByDirection = direction;
    keys.forEach((key) => {
      this.orderByKeys.add(key);
    });
    return this;
  }

  // eslint-disable-next-line complexity
  private toConditionSql(condition: BriskOrmCommonCondition<T>, mapping: BriskOrmEntityMapping): string {
    const [key, operator, value1, value2] = condition;
    const dbName = mapping[String(key)] || String(key);
    switch (operator) {
      case '=':
      case '<>':
      case '>':
      case '<':
      case '>=':
      case '<=':
        return ` ${dbName} ${operator} ${mysql.escape(value1)}`;
      case 'between':
        return ` ${dbName} between ${mysql.escape(value1)} and ${mysql.escape(value2)}`;
      case 'notBetween':
        return ` ${dbName} not between ${mysql.escape(value1)} and ${mysql.escape(value2)}`;
      case 'like':
        return ` ${dbName} like binary ${mysql.escape(`%${value1}%`)}`;
      case 'notLike':
        return ` ${dbName} not like binary ${mysql.escape(`%${value1}%`)}`;
      case 'likeLeft':
        return ` ${dbName} like binary ${mysql.escape(`%${value1}`)}`;
      case 'likeRight':
        return ` ${dbName} like binary ${mysql.escape(`${value1}%`)}`;
      case 'notLikeLeft':
        return ` ${dbName} not like binary ${mysql.escape(`%${value1}`)}`;
      case 'notLikeRight':
        return ` ${dbName} not like binary ${mysql.escape(`${value1}%`)}`;
      case 'isNull':
        return ` ${dbName} is null`;
      case 'isNotNull':
        return ` ${dbName} is not null`;
      case 'in':
        return ` ${dbName} in (${mysql.escape(value1)})`;
      case 'notIn':
        return ` ${dbName} not in (${mysql.escape(value1)})`;
      case 'json_contains':
        return ` json_contains(${dbName}, ${mysql.escape(value1)})`;
      default:
        // eslint-disable-next-line no-case-declarations
        const _never: never = operator;
        return _never;
    }
  }


  toSqlString(mapping: BriskOrmEntityMapping): string {
    let reSQL = '';
    // where语句，最少都是2个元素，包含末尾的多余连接符
    const whereSql = this.toWhereSqlString(mapping);
    if (whereSql) {
      reSQL += ` where${whereSql}`;
    }
    // group by
    if (this.groupByKeys.size) {
      reSQL += ` group by ${[...this.groupByKeys].map((key) => mapping[String(key)] || String(key)).join(',')}`;
    }
    // order by
    if (this.orderByKeys.size) {
      reSQL += ` order by ${[...this.orderByKeys].map((key) => `${mapping[String(key)] || String(key)} ${this.orderByDirection}`).join(',')}`;
    }
    return reSQL;
  }

  toWhereSqlString(mapping: BriskOrmEntityMapping): string {
    let reSQL = '';
    // 遍历，忽略最后一个元素
    for (let i = 0; i <= this.conditions.length - 2; i++) {
      const current = this.conditions[i];
      if (typeof current === 'string' && ['and', 'or'].includes(current)) {
        reSQL += ` ${current}`;
        continue;
      }
      if (!Array.isArray(current)) {
        // 子句
        const subSql = (current as BriskOrmQuery<any>).toWhereSqlString(mapping);
        if (subSql) {
          reSQL += ` (${subSql})`;
        }
        continue;
      }
      // 普通条件
      reSQL += this.toConditionSql(current, mapping);
    }
    return reSQL;
  }


}
