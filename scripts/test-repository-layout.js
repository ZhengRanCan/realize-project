'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {ROOT,files,prefixes,repositoryPath,repositoryRelative,resolveRepositoryPath,joinRepositoryPath,legacyReviewPath}=require('./helpers/repository-layout');
for(const [old,current]of Object.entries(files)) {
 assert.equal(repositoryRelative(old),current);
 assert.equal(resolveRepositoryPath(path.join(ROOT,old)),path.join(ROOT,current));
}
for(const [old,current]of Object.entries(prefixes)) {
 assert.equal(repositoryRelative(old+'/nested/file.json'),current+'/nested/file.json');
 assert.equal(repositoryRelative(old+'-unrelated/file.json'),old+'-unrelated/file.json');
}
assert.equal(repositoryRelative('unrelated/context-consumption.json'),'unrelated/context-consumption.json');
const external=path.resolve(ROOT,'../outside/experiments/file.json');assert.equal(resolveRepositoryPath(external),external);
assert.equal(repositoryPath('fixtures','context-consumption.json'),path.join(ROOT,'samples/context-consumption/design-review.json'));
assert.equal(joinRepositoryPath('experiments','stage2'),path.join('artifacts','experiments','stage2').replace(/\\/g,'/'));
const originalCwd=process.cwd();try{process.chdir(path.dirname(ROOT));assert.equal(joinRepositoryPath('experiments','stage2'),'artifacts/experiments/stage2');assert.equal(resolveRepositoryPath(ROOT,joinRepositoryPath('experiments','stage2')),path.join(ROOT,'artifacts/experiments/stage2'));}finally{process.chdir(originalCwd);}
if(process.argv.includes('--migrated')) {
 for(const current of Object.values(files))assert.ok(fs.existsSync(repositoryPath(current)),current);
 for(const old of ['fixtures','测试文档','ai','experiments','bundles','tmp'])assert.equal(fs.existsSync(path.join(ROOT,old)),false,old);
 const {execFileSync}=require('node:child_process');
 for(const [flag,old]of [['--source-sections','docs/source-sections.json'],['--design','fixtures/context-consumption.json'],['--source','测试文档/18-context-consumption-semantic-model.md']])assert.match(execFileSync(process.execPath,['scripts/check-plan.js',flag,old],{cwd:ROOT,encoding:'utf8'}),/overview-plan/);
 fs.mkdirSync(repositoryPath('workspace/tmp/tests'),{recursive:true});
 assert.match(execFileSync(process.execPath,[path.join(ROOT,'scripts/assemble-overview.js'),'--out',path.join(ROOT,'workspace/tmp/tests/f22-assembled.json')],{cwd:path.dirname(ROOT),encoding:'utf8'}),/overview.generated.json/);
 for(const local of ['workspace/analyses/test/human-review.json','workspace/tmp/test.key','workspace/references/test/file.md','workspace/.f22-migration.json'])
  assert.equal(execFileSync('git',['check-ignore',local],{cwd:ROOT,encoding:'utf8'}).trim(),local);
 assert.equal(require('node:child_process').spawnSync('git',['check-ignore','workspace/README.md'],{cwd:ROOT}).status,1);
}
const migration=require('./migrate-repository-layout');
assert.throws(()=>migration.safe('../outside'),/Unsafe migration path/);
const sandbox=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'f22-move-'));
try {
 assert.equal(legacyReviewPath(sandbox),path.join(sandbox,'workspace/legacy-review/human-review.json'));
 fs.writeFileSync(path.join(sandbox,'human-review.json'),'retained');assert.equal(legacyReviewPath(sandbox),path.join(sandbox,'human-review.json'));
 const journal=path.join(sandbox,'journal.json');migration.save(journal,{state:'before'});
 const rename=fs.renameSync;try{fs.renameSync=()=>{throw new Error('simulated interruption');};assert.throws(()=>migration.save(journal,{state:'after'}),/interruption/);}finally{fs.renameSync=rename;}
 assert.equal(JSON.parse(fs.readFileSync(journal)).state,'before');migration.save(journal,{state:'after'});assert.equal(JSON.parse(fs.readFileSync(journal)).state,'after');
 const from=path.join(sandbox,'from'),to=path.join(sandbox,'to');fs.mkdirSync(from);fs.mkdirSync(to);
 fs.writeFileSync(path.join(from,'pending'),'original');fs.writeFileSync(path.join(to,'finished'),'retained');migration.moveTree(from,to);
 assert.equal(fs.readFileSync(path.join(to,'pending'),'utf8'),'original');assert.equal(fs.readFileSync(path.join(to,'finished'),'utf8'),'retained');
 fs.mkdirSync(from);fs.writeFileSync(path.join(from,'pending'),'collision');assert.throws(()=>migration.moveTree(from,to),/collision/);assert.equal(fs.readFileSync(path.join(to,'pending'),'utf8'),'original');
} finally {assert.ok(sandbox.startsWith(path.resolve(require('node:os').tmpdir())+path.sep));fs.rmSync(sandbox,{recursive:true,force:true});}
console.log('Exact repository aliases, prefix boundaries and layout: passed');
