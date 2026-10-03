'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {makeBundleFixture}=require('./helpers/reading-bundle-fixture');
const {projectReadingBundle}=require('../app/shared/reading-projection');
const {projectL3}=require('../app/shared/l3-inspector-projection');
async function main(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'reading-projection-'));try{
 const {models}=await makeBundleFixture(root);let vm=projectReadingBundle(models);const blocks=vm.l2ViewModel.sections.flatMap(s=>s.blocks);assert.equal(blocks.length,21);
 const input={...models,generated:undefined};vm=projectReadingBundle(input);assert.equal(vm.l2ViewModel.sections[0].blocks[0].generatedExpression.state,'unknown');
 const partial=structuredClone(models);partial.generated.blocks=partial.generated.blocks.filter(b=>b.id!=='O-01');vm=projectReadingBundle(partial);assert.equal(vm.l2ViewModel.sections[0].blocks[0].generatedExpression.state,'missing');assert.equal(vm.l2ViewModel.sections[0].blocks[0].realizedCoverage.state,'unavailable');
 const shuffled=structuredClone(models);shuffled.plan.blocks.reverse();assert.deepEqual(projectReadingBundle(shuffled).l2ViewModel.sections.map(s=>s.id),['what','how','prove','boundary']);
 const failed=structuredClone(models);failed.generated.blocks[0].generation.verdict='FAIL';assert.equal(projectReadingBundle(failed).l2ViewModel.sections[0].blocks[0].generationIntegrity.verdict,'FAIL');
 const l3=projectL3({blockId:'O-01'},models);assert.equal(l3.blockId,'O-01');assert.ok(l3.traceability.units.length);assert.equal(l3.traceability.units[0].coordinate.state,'known');assert.equal(l3.traceability.units[0].coordinate.exactLine,undefined);assert.deepEqual(l3.claimVerification,{space:'CapabilityAvailability',state:'absent'});assert.equal(l3.provenanceAssurance.state,'indeterminate');
 const fragment=blocks.find(b=>b.fragmentEntries.length);const inspected=projectL3({blockId:fragment.id,fragmentPath:fragment.fragmentEntries[0].path},models);assert.equal(inspected.blockId,fragment.id);assert.equal(inspected.fragment.id,undefined);assert.equal(inspected.claimVerification.state,'absent');
 const firstTopic=models.frameworkMap.topics[0];const noLinks=structuredClone(models);delete noLinks.frameworkMap.topics[0].blockIds;assert.equal(projectReadingBundle(noLinks).l1Topics[firstTopic.id].blockOrganization.state,'unknown');noLinks.frameworkMap.topics[0].blockIds=[];assert.equal(projectReadingBundle(noLinks).l1Topics[firstTopic.id].blockOrganization.state,'empty');
 console.log('Reading bundle L2 / L1 / L3 projection: passed');
}finally{assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));await fs.rm(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e);process.exitCode=1;});
