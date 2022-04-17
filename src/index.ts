import { is, configPath as IS_CONFIG_PATH } from 'brisk-ts-extends/is';
import * as path from 'path';
// 配置is扩展的接口json文件
IS_CONFIG_PATH(path.join(__dirname, './interface.json'));

import { OrmPluginOption } from '@interface';
import { Core, BriskPlugin } from 'brisk-ioc';
import { OrmCore } from '@core';

// 核心
export * from '@core';

// 装饰器
export * from '@decorator';

// 枚举
export * from '@enum';

// 实体
export * from '@entity';

// 工厂
export * from '@factor';

// 接口
export * from '@interface';

/**
 * Brisk-ORM
 * License MIT
 * Copyright (c) 2021 Ruixiaozi
 * admin@ruixiaozi.com
 * https://github.com/ruixiaozi/brisk-orm
 */
class _OrmPlugin implements BriskPlugin {

  #ormCore: OrmCore = OrmCore.getInstance();

  name = 'BriskORM';

  /**
   * 安装方法
   * @param core brisk核心
   * @param option 插件选项
   */
  install(core: Core, option: OrmPluginOption): void {
    if (!is<OrmPluginOption>(option, 'OrmPluginOption')) {
      this.#ormCore.logger.error('orm plugin option format error');
      return;
    }

    // 继承ioc的isdebug
    this.#ormCore.isDebug = core.isDebug;

    const baseUrl = `mongodb://${option.username}:${option.password}@${option.host}:${option.port}`;
    this.#ormCore.url = `${baseUrl}/${option.database}?authSource=${option.authSource}`;
    if (option.useNewUrlParser !== undefined) {
      this.#ormCore.useNewUrlParser = option.useNewUrlParser;
    }
    if (option.useUnifiedTopology !== undefined) {
      this.#ormCore.useUnifiedTopology = option.useUnifiedTopology;
    }

    core.putInitFunc({
      fn: this.#ormCore.connectAsync.bind(this.#ormCore),
      priority: option.priority,
    });

    this.#ormCore.isInstall = true;
  }

}

export const BriskORM = new _OrmPlugin();
