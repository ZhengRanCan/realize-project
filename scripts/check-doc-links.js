#!/usr/bin/env node
'use strict';

/**
 * 文档引用检查（docs / experiments / 根 README）
 *
 * 规范化把文件搬到了新路径，旧路径会留在两类地方，二者都不算错：
 *   1. `docs/README.md` 的 Path mapping 表（映射关系的左列）；
 *   2. 标注了「规范化前」的历史命令引用，以及 `experiments/**\/raw.md`（被审原文）。
 * 其余任何指向仓库内文件的路径都必须真实存在 —— 这个脚本就是那道闸门。
 *
 * 用法：node scripts/check-doc-links.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIR = /(^|\/)(node_modules|tmp|harness-template|\.git)(\/|$)/;
const LEGACY_ONLY = /^docs\/log\/artifacts\/[^/]+\/(brief\.md|execution-prompt\.md|validation-checklist\.md|results\/|_archive\/|drafts\/)/;
const HISTORICAL_NOTE = /规范化前|规范化之前/;
const PLACEHOLDER = /Fxx/;
const RAW_DOC = /\/raw\.md$/;

const PREFIX = 'docs|scripts|schema|app|fixtures|experiments|ai';
const BOUNDARY = '[\\s`(（：:"\']';
const TAIL = '[A-Za-z0-9_\\-./\\u4e00-\\u9fff]+';
const PATTERN = new RegExp('(?:^|' + BOUNDARY + ')((?:' + PREFIX + ')/' + TAIL + ')', 'g');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (SKIP_DIR.test(rel)) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

const files = [
  ...walk(path.join(ROOT, 'docs')),
  ...walk(path.join(ROOT, 'experiments')),
  'README.md',
  'agent.md',
];

const findings = [];
let checked = 0;

for (const file of files) {
  if (LEGACY_ONLY.test(file) || RAW_DOC.test(file)) continue;
  checked += 1;
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
  let inHistoricalSection = false;
  lines.forEach((line, index) => {
    if (/^##\s/.test(line)) inHistoricalSection = /规范化前|规范化之前|Path mapping|路径对照/.test(line);
    if (inHistoricalSection || HISTORICAL_NOTE.test(line)) return;
    for (const match of line.matchAll(PATTERN)) {
      const target = match[1].replace(/[.,;:：、）)]+$/, '');
      if (/[*{}<>$|]/.test(target) || PLACEHOLDER.test(target)) continue;
      if (target.endsWith('/') || !path.extname(target)) continue;
      if (fs.existsSync(path.join(ROOT, target))) continue;
      findings.push(file + ':' + (index + 1) + '  →  ' + target);
    }
  });
}

console.log('Doc links: ' + checked + ' markdown files checked, ' + findings.length + ' broken.');
for (const finding of findings) console.error('- ' + finding);
if (findings.length) process.exit(1);
