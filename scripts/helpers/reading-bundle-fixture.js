'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {exportReadingBundle}=require('../export-reading-bundle');
const {readReadingBundle}=require('../../app/main/reading-bundle');
const ROOT=path.resolve(__dirname,'../..');
async function makeBundleFixture(tempRoot,mutate) {
 const inputs={source:path.join(ROOT,'测试文档/18-context-consumption-semantic-model.md'),design:path.join(ROOT,'fixtures/context-consumption.json'),plan:path.join(ROOT,'fixtures/context-consumption.overview-plan.json'),generated:path.join(ROOT,'experiments/stage2-full/overview.generated.json'),map:path.join(ROOT,'docs/log/artifacts/F04-l0-framework-map/drafts/context-consumption.map.json')};
 const {manifestPath}=await exportReadingBundle({...inputs,out:path.join(tempRoot,'analysis'),analysisId:'offline-test'});
 const loaded=await readReadingBundle(manifestPath);if(!loaded.ok) throw new Error(loaded.errors.join('\n'));
 if(mutate) await mutate(loaded.bundle);
 return {inputs,models:loaded.bundle,manifestPath};
}
module.exports={makeBundleFixture};
