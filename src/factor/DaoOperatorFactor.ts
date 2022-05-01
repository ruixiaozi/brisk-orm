import { BaseDaoOperator } from '@entity';

/**
 * DaoOperatorFactor
 * @description dao操作类工厂
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 */
export abstract class DaoOperatorFactor {

  /**
   * 工厂方法
   * @returns 操作对象
   */
  public abstract factory(): BaseDaoOperator | undefined;

}
