import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { ConfigObject, YAPIResponseObject, MergeTypeEnum } from './interfaces';
import * as querystring from 'querystring';
import { INestApplication } from '@nestjs/common';
import * as merge from 'webpack-merge';
import { formatter } from './helpers/formatter';
import { request } from './helpers/request';

export class Swagger2YAPI {
  /** 配置 */
  config: ConfigObject;
  /** 主程序 */
  app: INestApplication;
  /** 默认配置 */
  defaultConfig: ConfigObject = {
    document: {
      title: '项目接口文档',
      description: '通过SwaggerYAPI组件同步的接口文档',
      version: 'v1.0.0',
    },
    disabled: false,
    server: false,
    exclude: ['test'],
    yapi: {
      url: '<YApi_URL>',
      token: '',
      merge: MergeTypeEnum.Good,
    },
    /** 响应体模板 */
    pattern: {
      message: {
        type: 'string',
        description: '请求返回信息',
      },
      code: {
        type: 'number',
        description: '请求错误码',
      },
      data: {
        type: 'any',
        description: '数据返回内容',
        isContainer: true,
      },
    },
  }

  constructor(app, config: ConfigObject) {
    this.app = app;

    /** 生成配置 */
    this.config = merge(this.defaultConfig, config);
    if (config.pattern) {
      this.config.pattern = config.pattern;
    }
    if (config.exclude) {
      this.config.exclude = config.exclude;
    }

    /** 验证配置 */
    const validateRes = this.configValidate();

    if (validateRes.length !== 0) {
      console.error('[Swagger To YAPI]以下配置存在问题', validateRes.join(' | '));
    } else if (this.config.disabled === false) {
      this.run();
    }
  }

  async run() {
    /** 生成文档 */
    let document = this.generateDocument();

    /** 是否使用响应体模板 */
    if (this.config.pattern !== false) {
      document = formatter(document, this.config);
    };

    /** 启动文档服务 */
    if (this.config.server === true) {
      SwaggerModule.setup('api', this.app, document);
    };

    /** 同步文档到YAPI平台 */
    try {
      const res = await this.syncDocument(document);
      this.config?.success?.(res);
    } catch (err) {
      this.config?.fail?.(err);
    }
  }

  /** 生成文档 */
  generateDocument(): OpenAPIObject {
    const options = new DocumentBuilder()
      .setTitle(this.config.document.title)
      .setDescription(this.config.document.description)
      .setVersion(this.config.document.version)
      .build();
    return SwaggerModule.createDocument(this.app, options);
  }

  /** 同步文档 */
  async syncDocument(document: OpenAPIObject) {
    /** 请求数据 */
    const reqBody = Buffer.from(querystring.stringify({
      type: 'swagger',
      merge: this.config.yapi.merge,
      token: this.config.yapi.token,
      json: JSON.stringify(document),
    }), 'utf8');
    return request({
      url: this.config.yapi.url,
      data: reqBody,
    });
  }

  /** 配置验证 */
  configValidate(): string[] {
    const message: string[] = [];
    if (!this.config.yapi.token) {
      message.push('yapi.token');
    }
    return message;
  }
}

/**
 * 文档同步函数
 * @param app    NestJS主程序
 * @param config 同步文档配置
 */
export function syncApiDocument(app, config: ConfigObject) {
  return new Swagger2YAPI(app, config);
}

/**
 * 文档同步函数（同步函数）
 * @param app    NestJS主程序
 * @param config 同步文档配置
 */
export function syncApiDocumentSync(
  app,
  config: Omit<ConfigObject, 'success' | 'fail'>,
): Promise<YAPIResponseObject> {
  return new Promise((resolve, reject) => {
    new Swagger2YAPI(app, {
      ...config,
      success: resolve,
      fail: reject,
    });
  });
}