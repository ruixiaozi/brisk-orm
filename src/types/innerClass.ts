/* eslint-disable @typescript-eslint/no-use-before-define */
import { BRISK_ORM_TYPE_E } from './index';
export class BriskOrmInnerClass {

  static typeCast = (field: any, next: any) => {
    // 转换TINYINT
    if (field.type === 'TINY' && field.length === 1) {
      // 1 = true, 0 = false
      return (field.string() === '1');
    }
    if (field.type === 'GEOMETRY') {
      const geometry = field.geometry();
      if (!Array.isArray(geometry)) {
        // 单点
        return BriskOrmGeometryPoint.toObject(geometry);
      }
      return geometry;
    }
    if (field.type === 'BLOB') {
      // text类型(这里会返回blob类型)默认用来存json
      const textRes = field.string();
      try {
        return JSON.parse(textRes);
      } catch (err) {
        return textRes;
      }
    }
    return next();
  };

  static ormType?: BRISK_ORM_TYPE_E;


  static toObject(_value: any) {
    return {} as any;
  }

  // 插入、更新、参数原生SQL转换语句会使用
  toSqlString() {
    return '';
  }


}

// 地理信息，point
export class BriskOrmGeometryPoint extends BriskOrmInnerClass {

  static ormType?: BRISK_ORM_TYPE_E = BRISK_ORM_TYPE_E.GEOMETRY;

  static toObject(_value: any) {
    const instance = new BriskOrmGeometryPoint();
    instance.latitude = String(_value.y);
    instance.longtitude = String(_value.x);
    return instance;
  }

  constructor(
    public longtitude: string = '0',
    public latitude: string = '0',
    // wgs84
    public srid: string = '4326',
  ) {
    super();
  }

  // 插入、更新、参数原生SQL转换语句会使用
  toSqlString(): string {
    return `st_geomfromtext('point(${this.longtitude} ${this.latitude})', ${this.srid})`;
  }


}

export const innerClasses = [BriskOrmGeometryPoint];
