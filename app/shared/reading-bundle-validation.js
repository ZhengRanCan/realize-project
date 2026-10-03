'use strict';
const {validate}=require('./schema-validator');
const {semanticCheck}=require('./review-model');
const {buildSourceRegistry,parseDocHeadings}=require('./source-coordinates');
const {checkPlan}=require('../../scripts/check-plan');
const {checkOverview}=require('../../scripts/check-overview');
const {checkMap}=require('../../scripts/check-map');
const schemas={manifest:require('../../schema/reading-bundle.schema.json'),review:require('../../schema/design-review.schema.json'),plan:require('../../schema/overview-plan.schema.json'),map:require('../../schema/framework-map.schema.json')};

function validateBundleData(input) {
 const {manifest,designReview,plan,generated,frameworkMap,sourceText,sourceSections}=input;
 const errors=[],warnings=[],reports={};
 const check=(label,schema,value)=>{const r=validate(schema,value);errors.push(...r.errors.map(e=>`${label}: ${e}`));return r.valid;};
 if(!check('manifest',schemas.manifest,manifest)) return {errors,warnings,reports};
 if(!check('designReview',schemas.review,designReview) || !check('plan',schemas.plan,plan)) return {errors,warnings,reports};
 const semantic=semanticCheck(designReview);errors.push(...semantic.errors);warnings.push(...semantic.warnings);
 if(plan.designRef.id!==manifest.bindings.designReviewId || designReview.design.id!==manifest.bindings.designReviewId) errors.push('designReviewId 与 Review / Plan 不一致');
 for(const [field,value] of [['generated',generated],['frameworkMap',frameworkMap]]) if(Boolean(manifest.files[field])!==(value!==undefined)) errors.push(`${field}: 声明与载入资料不一致`);
 if(typeof sourceText!=='string' || sourceSections?.registryVersion!==1) {errors.push('source registry version / snapshot 无效');return {errors,warnings,reports};}
 const expected=buildSourceRegistry(sourceText,{sourcePath:sourceSections.document?.path});
 const registryDrift=JSON.stringify(sourceSections)!==JSON.stringify(expected);
 reports.sourceIntegrity=registryDrift?'drifted':'consistent';
 if(registryDrift) warnings.push('source registry 与当前原文不一致：来源坐标不可用');
 for(const [label,list,key] of [['section',sourceSections.sections,'label'],['heading',sourceSections.headings,'key']]){
   const seen=new Set();for(const x of list||[]) {if(seen.has(x[key])) {if(label==='section') errors.push(`section key 重复: ${x[key]}`);else warnings.push(`heading key 重复，无法唯一定位: ${x[key]}`);}seen.add(x[key]);}
 }
 reports.plan=checkPlan(plan,{design:designReview,sourceSections,sourceText});errors.push(...reports.plan.errors);warnings.push(...reports.plan.warnings);
 if(generated!==undefined) {
  if(generated.document?.id!==manifest.bindings.designReviewId || !Array.isArray(generated.blocks) || !Array.isArray(generated.stages)) errors.push('Generated document / blocks / stages 结构或配对无效');
  const fingerprint=generated.generation?.planSha256;
  if(typeof fingerprint!=='string' || !/^(?:[a-f0-9]{16}|[a-f0-9]{64})$/.test(fingerprint) || !input.planSha256?.startsWith(fingerprint)) errors.push('Generated Plan fingerprint 不匹配');
  if(Array.isArray(generated.blocks) && Array.isArray(generated.stages)) {
   reports.generated=checkOverview(generated,plan,{sourceSections,sourceText});
   errors.push(...reports.generated.structuralErrors);warnings.push(...reports.generated.warnings);
   if(reports.generated.errors.length) warnings.push('生成判定 FAIL；具体失败保留在 generationContext');
  }
 }
 if(frameworkMap!==undefined) {
  if(check('frameworkMap',schemas.map,frameworkMap)) {
   if(!manifest.bindings.frameworkDocumentId || frameworkMap.document.id!==manifest.bindings.frameworkDocumentId) errors.push('frameworkDocumentId 不匹配');
   // The bundle binds files, not Map SU to Plan SU. No implicit namespace bridge.
   reports.map=checkMap(frameworkMap,{docSections:parseDocHeadings(sourceText)});
   errors.push(...reports.map.hard);warnings.push(...reports.map.warn);
   const blockIds=new Set(plan.blocks.map(b=>b.id));
   for(const t of frameworkMap.topics) for(const id of t.blockIds||[]) if(!blockIds.has(id)) errors.push(`Topic ${t.id}: 悬空 Block ${id}`);
  }
 }
 return {errors,warnings:[...new Set(warnings)],reports};
}
module.exports={validateBundleData};
