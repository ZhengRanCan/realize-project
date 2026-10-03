#!/usr/bin/env node
'use strict';

const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./helpers/repository-layout');

/**
 * 校验 design-review.json：
 *   1) JSON 可解析
 *   2) 符合 schema/design-review.schema.json
 *   3) 文件内部自洽（id 唯一、引用存在、summary 计数一致）
 *
 * 用法：node scripts/validate-fixture.js [path ...]
 * 默认校验 samples/context-consumption/design-review.json
 */

const path = require('node:path');
const fs = require('node:fs');

const { validate } = require('../app/shared/schema-validator');
const { semanticCheck } = require('../app/shared/review-model');

const ROOT = resolveRepositoryPath(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(joinRepositoryPath(ROOT, 'schema', 'design-review.schema.json'), 'utf8'));

const targets = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [joinRepositoryPath(ROOT, 'fixtures', 'context-consumption.json')];

let failed = false;

for (const target of targets) {
  const absolute = resolveRepositoryPath(target);
  console.log(`\n=== ${path.relative(ROOT, absolute)} ===`);

  let model;
  try {
    model = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    console.log(`✗ JSON 解析失败: ${error.message}`);
    failed = true;
    continue;
  }

  const schemaResult = validate(schema, model);
  if (schemaResult.valid) {
    console.log('✓ Schema 校验通过');
  } else {
    console.log(`✗ Schema 校验失败 (${schemaResult.errors.length})`);
    schemaResult.errors.forEach((e) => console.log(`   - ${e}`));
    failed = true;
  }

  const semantic = semanticCheck(model);
  if (semantic.errors.length === 0) {
    console.log('✓ 一致性检查通过');
  } else {
    console.log(`✗ 一致性检查失败 (${semantic.errors.length})`);
    semantic.errors.forEach((e) => console.log(`   - ${e}`));
    failed = true;
  }

  if (semantic.warnings.length > 0) {
    console.log(`! ${semantic.warnings.length} 条 warning（不阻止进入 Review UI）`);
    semantic.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  const d = model.decisions || [];
  const pending = d.filter((x) => x.status === 'pending').length;
  console.log(
    `  统计: decisions=${d.length} (pending=${pending}) gaps=${(model.gaps || []).length} ` +
    `openQuestions=${(model.openQuestions || []).length} (blocking=${(model.openQuestions || []).filter((q) => q.blocking).length}) ` +
    `facts=${(model.facts || []).length} models=${(model.models || []).length}`
  );
}

console.log('');
if (failed) {
  console.log('结果：FAILED —— 先修复 JSON，不要进入 Review UI（见 docs/harness/CONSTRAINTS.md）。');
  process.exit(1);
}
console.log('结果：PASSED');
