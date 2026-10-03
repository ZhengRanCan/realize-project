'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {buildSourceRegistry, resolveSourceCoordinate, parseDocHeadings} = require('../app/shared/source-coordinates');
const text = '# Goal\ntext\n````md\n## fake\n```\n# still fake\n````\n~~~\n## fake too\n~~~\n## 4.1 Actual\nbody\n## Goal\nmore\n';
const registry = buildSourceRegistry(text, {sourcePath:'source.md'});
assert.equal(registry.headings.length, 3);
assert.equal(resolveSourceCoordinate(registry,{namespace:'heading',key:'4.1'}).state,'known');
assert.equal(resolveSourceCoordinate(registry,{namespace:'heading',key:'Goal'}).state,'unknown');
assert.equal(resolveSourceCoordinate(registry,{namespace:'plan-section',key:'§1'}).state,'unknown');
assert.equal(parseDocHeadings('no headings').sectionLevel,null);
const original = JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/source-sections.json')));
const raw = fs.readFileSync(path.join(__dirname,'..',original.document.path),'utf8');
assert.deepEqual(buildSourceRegistry(raw,{sourcePath:original.document.path}).sections,original.sections);
for (const file of ['check-plan','check-overview']) {
  const out=execFileSync(process.execPath,['-e',`require('./scripts/${file}'); console.log('imported')`],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
  assert.equal(out.trim(),'imported');
}
const {checkPlan} = require('./check-plan');
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'../fixtures/context-consumption.overview-plan.json')));
const design=JSON.parse(fs.readFileSync(path.join(__dirname,'../fixtures/context-consumption.json')));
assert.equal(checkPlan(plan,{design,sourceSections:original,sourceText:raw}).structuralErrors.length,0);
const bad=structuredClone(plan);bad.blocks[0].covers.push('SU-missing');
assert.ok(checkPlan(bad,{design,sourceSections:original,sourceText:raw}).structuralErrors.length>0);
console.log('Source coordinates and explicit validators: passed');
