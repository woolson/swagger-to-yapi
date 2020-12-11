export interface ConfigObject {
  /** 是否同步文档 */
  disabled?: boolean
  /** 使用启动文档服务 */
  server?: boolean,
  /** 接口文档配置 */
  document?: APIDocument
  /** YAPI相关配置 */
  yapi: YAPIConfigObject,
  /** 返回内容结构 */
  pattern?: boolean | Pattern,
  /** 忽略某些接口 */
  exclude?: string[],
  /** 接口path重写 */
  pathRewrite?: [RegExp | string, string][],
  /** 文档同步成功触发 */
  success?: (data: YAPIResponseObject) => void,
  /** 文档同步失败触发 */
  fail?: (err: YAPIResponseObject) => void
}

export interface APIDocument {
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 版本 */
  version?: string
}

export interface YAPIConfigObject {
  /** YAPI接口地址 */
  url?: string
  /** YAPI文档合并模式 */
  merge?: MergeTypeEnum
  /** YAPI接口调用凭证 */
  token: string
  /** YAPI描述 */
  description?: string
}

/** 数据合并方式 */
export enum MergeTypeEnum {
  /** 普通模式 */
  Normal = 'normal',
  /** 智能合并 */
  Good = 'good',
  /** 完全覆盖 */
  Merge = 'merge'
}

export interface Pattern {
  [key: string]: {
    /** 属性是否是包含数据的属性 */
    isContainer?: boolean
    /** 属性数据类型 */
    type: 'string' | 'number' | 'boolean' | 'null' | 'any'
    /** 属性的描述 */
    description?: string
  }
}

export interface YAPIResponseObject {
  /** 错误码 0为成功 */
  errcode: number
  /** 错误信息 */
  errmsg: string
  /** 返回信息 */
  data: any
}

export interface ResponseStructure {
  type: string;
  properties: {
    code: any
    data?: any
    message: any,
  };
  required: string[];
}
