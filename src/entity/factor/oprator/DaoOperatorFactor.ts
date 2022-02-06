import { BaseDaoOperator } from "../../operator/BaseDaoOperator";

/**
 * DaoOperatorFactor
 * @description dao操作类工厂
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月06日 21:37:00
 * @version 2.0.0
 */
export abstract class DaoOperatorFactor {
  /**
   * 工厂方法
   * @returns 操作对象
   */
  public abstract factory(): BaseDaoOperator;
}
