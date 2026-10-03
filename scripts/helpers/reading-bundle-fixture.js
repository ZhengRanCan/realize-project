'use strict';
const {joinRepositoryPath,resolveRepositoryPath,repositoryPath,repositoryRelative}=require('./repository-layout');

const fs=require('node:fs/promises'),path=require('node:path');
const {exportReadingBundle}=require('../export-reading-bundle');
const {readReadingBundle}=require('../../app/main/reading-bundle');
const ROOT=resolveRepositoryPath(__dirname,'../..');
async function makeBundleFixture(tempRoot,mutate) {
 const inputs={source:joinRepositoryPath(ROOT,'samples/context-consumption/source.md'),design:joinRepositoryPath(ROOT,'samples/context-consumption/design-review.json'),plan:joinRepositoryPath(ROOT,'samples/context-consumption/overview-plan.json'),generated:joinRepositoryPath(ROOT,'experiments/stage2-full/overview.generated.json'),map:joinRepositoryPath(ROOT,'samples/context-consumption/framework-map.json')};
 const {manifestPath}=await exportReadingBundle({...inputs,out:joinRepositoryPath(tempRoot,'analysis'),analysisId:'offline-test'});
 const loaded=await readReadingBundle(manifestPath);if(!loaded.ok) throw new Error(loaded.errors.join('\n'));
 if(mutate) await mutate(loaded.bundle);
 return {inputs,models:loaded.bundle,manifestPath};
}
module.exports={makeBundleFixture};
