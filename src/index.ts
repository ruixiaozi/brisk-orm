import { IOrmPluginOption } from './interface/option/IOrmPluginOption';
import { Core, IPlugin } from 'brisk-ioc';
import { OrmCore } from './core/OrmCore';

// 核心
export * from './core/OrmCore';

// 装饰器
export * from './decorator/OrmDecorator';

// 实体
export * from './entity/operator/BaseDaoOperator';
export * from './entity/option/DaoOperatorOption';
export * from './entity/option/OrmPluginOption';
export * from './entity/option/ColumOption';
export * from './entity/option/PrimaryKeyOption';
export * from './entity/option/ForeignKeyOption';

// 接口
export * from './interface/option/IDaoOperatorOption';
export * from './interface/option/IOrmPluginOption';
export * from './interface/option/IColumOption';
export * from './interface/option/IPrimaryKeyOption';
export * from './interface/option/IForeignKeyOption';

/**
 * _OrmPlugin
 * @description orm插件
 * @author ruixiaozi
 * @email admin@ruixiaozi.com
 * @date 2022年02月05日 16:24:08
 * @version 2.0.0
 */
class _OrmPlugin implements IPlugin {

  private ormCore: OrmCore = OrmCore.getInstance();

  /**
   * 安装方法
   * @param core brisk核心
   * @param option 插件选项
   */
  install(core: Core, option: IOrmPluginOption): void {
    this.ormCore.core = core;
    const baseUrl = `mongodb://${option.username}:${option.password}@${option.host}:${option.port}`;
    this.ormCore.url = `${baseUrl}/${option.database}?authSource=${option.authSource}`;
    if (option.useNewUrlParser !== undefined) {
      this.ormCore.useNewUrlParser = option.useNewUrlParser;
    }
    if (option.useUnifiedTopology !== undefined) {
      this.ormCore.useUnifiedTopology = option.useUnifiedTopology;
    }

    core.initList.push({
      fn: this.ormCore.connectAsync.bind(this.ormCore),
      priority: option.priority,
    });
  }

}

export const BriskORM = new _OrmPlugin();
