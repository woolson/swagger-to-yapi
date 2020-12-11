import { OpenAPIObject } from '@nestjs/swagger';
import { name2Pascal } from './index';
import { ConfigObject } from '../interfaces';

/** 需格式化Schema信息 */
interface SchemaInfo {
  /** 需格式化schema名称 */
  name: string;
  /** 标识数据类型，暂时只对Array特殊处理 */
  type?: string;
}

/** 传输基本类型 */
const simpleTypes = ['String', 'Number', 'Boolean'];

/**
 * 类型组件模板格式化
 * @param schemaInfo 类型组件信息
 * @param pattern    响应体结构模板
 */
export function schemaFormatter(schemaInfo: SchemaInfo, pattern) {
  const result = {
    type: 'object',
    properties: {},
    required: [],
  };
  for (const key in pattern) {
    result.properties[key] = {
      ...pattern[key],
      isContainer: undefined,
    };
    if (typeof pattern[key].type === 'function') {
      result.properties[key].type = pattern[key].type.name.toLowerCase();
    } else {
      result.properties[key].type = pattern[key].type;
    }
    /** 内容部分 */
    if (pattern[key].isContainer) {
      /** 基本类型Schema创建 */
      if (simpleTypes.includes(schemaInfo.name)) {
        result.properties[key].type = schemaInfo.name.toLowerCase();
      /** 数组类型Schema创建 */
      } else if (schemaInfo.type === 'array') {
        result.properties[key].type = 'array';
        result.properties[key].items = {
          $ref: `#/components/schemas/${schemaInfo.name}`,
        };
      /** 对象类型Schema创建 */
      } else {
        result.properties[key]['$ref'] = `#/components/schemas/${schemaInfo.name}`;
      }
    }
    result.required.push(key);
  }
  return result;
}

/**
 * 判断路径是否需要排除
 * @param path 需判断路径字符串
 * @param exclude 需排除的关键词
 */
export function excludePath(path: string, exclude: string[]): boolean {
  return exclude.some(keyword => path.includes(keyword));
}

/**
 * 接口文档格式化 - 统一响应体结构
 * @param document 需格式化文档
 * @param pattern  响应体结构模板
 */
export function formatter(
  document: OpenAPIObject,
  config: ConfigObject,
): OpenAPIObject {

  /** 将所有的Schema进行格式化 */
  for (const oldSchemaKey in document.components.schemas) {
    const schemaKey = `Formatted${oldSchemaKey}`;
    document.components.schemas[schemaKey] = schemaFormatter({
      name: oldSchemaKey,
    }, config.pattern);
  }

  /** 使用pathRewrite重写接口路径 */
  if (
    config.pathRewrite &&
    Array.isArray(config.pathRewrite) &&
    config.pathRewrite.length > 0
  ) {
    for (const path in document.paths) {
      for (const reg of config.pathRewrite) {
        const newPath = path.replace(...reg);
        if (newPath !== path) {
          document.paths[newPath] = document.paths[path];
          delete document.paths[path];
        }
      }
    }
  }

  /** 添加基础类型Schema */
  if (!document.components.schemas) {
    document.components.schemas = {};
  }
  simpleTypes.forEach(type => {
    const schemaKey = `Formatted${type}`;
    document.components.schemas[schemaKey] = schemaFormatter({
      name: type,
    }, config.pattern);
  });

  /** 用格式化后的Component替代原来的Component */
  for (const path in document.paths) {
    /** 过滤非需排除请求 */
    if (
      config.exclude &&
      config.exclude.length &&
      excludePath(path, config.exclude)
    ) {
      delete document.paths[path];
    }

    /** 处理每个请求方法的响应 */
    for (const method in document.paths[path]) {
      const schema: {
        $ref: string;
        type: string;
        items: { $ref: string }
      } = document.paths[path][method].responses?.['200']?.content?.['application/json']?.schema;

      /** 处理自定义非数据类型 */
      if (schema?.$ref) {
        const oldRef = schema.$ref.replace('#/components/schemas/', '');
        document.paths[path][method].responses[200].content['application/json'].schema = {
          // type: 'object',
          $ref: `#/components/schemas/Formatted${oldRef}`,
        };
      /** 处理基本类型 */
      } else if (schema?.type && schema.type !== 'array') {
        const type = name2Pascal(schema.type);
        document.paths[path][method].responses[200].content['application/json'].schema = {
          $ref: `#/components/schemas/Formatted${type}`,
        };
      /** NOTICE: 处理数组类型返回 */
      } else if (schema?.type === 'array' && schema.items.$ref) {
        const oldRef = schema.items.$ref.replace('#/components/schemas/', '');
        const schemaKey = `FormattedArray${oldRef}`;
        /** 格式化数组类型 */

        document.components.schemas[schemaKey] = schemaFormatter({
          name: oldRef,
          type: 'array',
        }, config.pattern);

        document.paths[path][method].responses[200].content['application/json'].schema = {
          $ref: `#/components/schemas/${schemaKey}`,
        };
      }
    }
  }
  return document;
}
