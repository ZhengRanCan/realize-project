"use strict";
const assert=require("node:assert/strict"); const {evaluateProofClosure,invalidatedProofIds,evaluateDomainCompletion,completionObservation}=require("../dist/agent");
const ref=(namespace,subject,revision=1,sha256=subject.repeat(64).slice(0,64))=>({namespace,subject,revision,sha256});
const A=ref("opaque","A",1,"a".repeat(64)),B=ref("opaque","B",1,"b".repeat(64)),Z=ref("opaque","Z",1,"z".repeat(64));
const proofs=[{proofId:"pA",subject:"A",directInputs:[A],supportProofIds:[],ruleFingerprint:"r1",status:"passed"},{proofId:"pB",subject:"B",directInputs:[B],supportProofIds:["pA"],ruleFingerprint:"r1",status:"passed"},{proofId:"pC",subject:"C",directInputs:[],supportProofIds:["pB"],ruleFingerprint:"r1",status:"passed"},{proofId:"pZ",subject:"Z",directInputs:[Z],supportProofIds:[],ruleFingerprint:"r1",status:"passed"}];
assert.equal(evaluateProofClosure({requiredRootProofIds:["pC","pZ"],proofs,currentInputs:[A,B,Z]}).ok,true);
assert.deepEqual(invalidatedProofIds([A],proofs),["pA","pB","pC"]); assert.deepEqual(invalidatedProofIds([Z],proofs),["pZ"]);
assert.equal(evaluateProofClosure({requiredRootProofIds:["pC"],proofs,currentInputs:[{...A,revision:2},B,Z]}).failures.some(x=>x.code==="stale_input"),true);
assert.equal(evaluateProofClosure({requiredRootProofIds:["pC"],proofs,currentInputs:[{...A,namespace:"other"},B,Z]}).failures.some(x=>x.code==="missing_input"),true);
assert.equal(evaluateProofClosure({requiredRootProofIds:["pC"],proofs,currentInputs:[{...A,revision:2,sha256:A.sha256},B,Z]}).ok,false);
assert.equal(evaluateProofClosure({requiredRootProofIds:["missing"],proofs,currentInputs:[A,B,Z]}).failures[0].code,"missing_root");
assert.equal(evaluateProofClosure({requiredRootProofIds:["pA"],proofs,currentInputs:[A,B,Z],requiredRuleFingerprints:{pA:"r2"}}).failures[0].code,"stale_rule");
for(const status of ["failed","skipped"]){const changed=proofs.map(p=>p.proofId==="pA"?{...p,status}:p);assert.equal(evaluateProofClosure({requiredRootProofIds:["pC"],proofs:changed,currentInputs:[A,B,Z]}).ok,false);}
const cyclic=[{proofId:"x",subject:"x",directInputs:[],supportProofIds:["y"],ruleFingerprint:"r",status:"passed"},{proofId:"y",subject:"y",directInputs:[],supportProofIds:["x"],ruleFingerprint:"r",status:"passed"}]; assert.equal(evaluateProofClosure({requiredRootProofIds:["x"],proofs:cyclic,currentInputs:[]}).failures.some(x=>x.code==="cycle"),true);
const incomplete=evaluateDomainCompletion({runStatus:"stopped",requiredRoots:["missing"],proofs,currentInputs:[A,B,Z]}); assert.equal(incomplete.artifact_status,"incomplete"); assert.equal(incomplete.quality_status,"unreviewed"); assert.match(completionObservation(incomplete).details[0],/missing_root/);
const complete=evaluateDomainCompletion({runStatus:"stopped",requiredRoots:["pC"],proofs,currentInputs:[A,B,Z]}); assert.equal(complete.completionGate,"PASS"); assert.equal(complete.quality_status,"unreviewed"); assert.equal(completionObservation(complete),undefined);
console.log("agent completion: passed");
