# Swagger接口文档同步到YAPI

## 安装

```bash
npm install -S @woolson/swagger-to-yapi
```

## 使用

```ts
import { Swagger2YAPI, syncApiDocument, syncApiDocumentSync } from '@woolson/swagger-to-yapi';

const app = await NestFactory.create(AppModule);

/** 方法一 */
new Swagger2YAPI(app, {
  yapi: { token: '03f694b8ba5e03fe143f' }
})

/** 方法二 */
syncApiDocument({
  yapi: { token: '03f694b8ba5e03fe143f' },
  success() {},
  fail() {}
})

/** 方法三：推荐 */
syncApiDocumentSync({
  yapi: { token: '03f694b8ba5e03fe143f' }
}).then(res => {
  console.log('同步成功', res.errmsg)
}).catch(err => {
  console.error('同步失败', err)
})

```

## 配置

### 配置介绍

```js
{
  /** 文档描述，可选。默认值如下： */
  document: {
    title: '项目接口文档',
    description: '通过SwaggerYAPI组件同步的接口文档',
    version: 'v1.0.0',
  },
  /** 是否同步文档，可选。默认值：false */
  disabled: process.env.NODE_ENV !== 'development',
  /** 是否启动Swagger文档服务。默认值：false */
  server: false,
  /** YAPI相关配置 */
  yapi: {
    /** YAPI接口地址，默认如下： */
    url: '<YApi_URL>',
    /** YAPI项目token，必填 */
    token: '',
    /** 同步模式，三项可选：'normal' | 'good' | 'merge'，默认值：'merge' */
    merge: 'merge'
  },
  /** 排除包含关键字的接口 */
  exclude: ['test'],
  /** 接口路径重写，可使用正则 */
  pathRewrite: [
    [/-name/g, 'namer']
  ]
  /**
   * 统一数据结构
   * 可将此值设置为false，以不使用统一数据结构
   * 默认值：如下
   */
  pattern: {
    message: {
      type: 'string',
      description: '请求返回信息'
    },
    code: {
      type: 'number',
      description: '请求错误码'
    },
    data: {
      type: 'any',
      description: '数据返回内容',
      /** 标识此属性为包含数据属性 */
      isContainer: true
    }
  },
  /** 同步成功回调，可选 */
  success(data) {
    logger.info(`[YApi] 接口同步成功${data.errmsg}`);
  },
  /** 同步失败回调，可选 */
  fail(error) {
    logger.error(`[YApi] 接口同步失败${error.errmsg}`);
  },
}
```

### 数据结构

`success` & `fail` 函数参数数据结构，如下：

```js
{
  /** 错误码 0为成功 */
  errcode: number

  /** 错误信息 */
  errmsg: string

  /** 返回信息 */
  data: any
}
```
