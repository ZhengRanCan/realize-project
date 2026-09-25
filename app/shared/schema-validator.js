'use strict';

/**
 * 极简 JSON Schema 校验器（draft-07 子集）。
 *
 * 为什么不用 ajv：MVP 只依赖 Electron 一个 devDependency，避免引入额外依赖与安装时间。
 * 支持的 keyword：type / required / properties / additionalProperties / items /
 * enum / const / minLength / minimum / pattern / $ref / definitions。
 *
 * agent.md 第十四节要求：Schema 校验失败时先修复 JSON，不要进入 Review UI。
 */

function resolveRef(ref, root) {
  if (typeof ref !== 'string' || !ref.startsWith('#')) {
    throw new Error(`不支持的 $ref: ${ref}`);
  }
  const path = ref.slice(1).split('/').filter(Boolean);
  let node = root;
  for (const key of path) {
    node = node[key];
    if (node === undefined) throw new Error(`无法解析 $ref: ${ref}`);
  }
  return node;
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value, expected) {
  switch (expected) {
    case 'object':
      return typeOf(value) === 'object';
    case 'array':
      return Array.isArray(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      throw new Error(`未知 type: ${expected}`);
  }
}

function validateNode(schema, value, root, path, errors) {
  if (schema.$ref) {
    return validateNode(resolveRef(schema.$ref, root), value, root, path, errors);
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push(`${path}: 期望 ${types.join(' | ')}，实际 ${typeOf(value)}`);
      return;
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: 值 ${JSON.stringify(value)} 不在 enum ${JSON.stringify(schema.enum)} 中`);
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: 值必须是 ${JSON.stringify(schema.const)}，实际 ${JSON.stringify(value)}`);
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path}: 字符串长度必须 >= ${schema.minLength}`);
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: 值 ${JSON.stringify(value)} 不匹配 pattern ${schema.pattern}`);
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path}: 数值必须 >= ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path}: 数值必须 <= ${schema.maximum}`);
    }
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      validateNode(schema.items, item, root, `${path}[${index}]`, errors);
    });
  }

  if (typeOf(value) === 'object') {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${path}: 缺少必填字段 "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key in props) {
        validateNode(props[key], child, root, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}: 不允许的字段 "${key}"`);
      } else if (typeOf(schema.additionalProperties) === 'object') {
        validateNode(schema.additionalProperties, child, root, `${path}.${key}`, errors);
      }
    }
  }
}

function validate(schema, value) {
  const errors = [];
  validateNode(schema, value, schema, '$', errors);
  return { valid: errors.length === 0, errors };
}

module.exports = { validate };
