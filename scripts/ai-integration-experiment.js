"use strict";
const fs=require("node:fs/promises"),path=require("node:path"),{createQualityEvaluation,hashFile,summarizeTrajectory}=require("./helpers/ai-experiment-eval");
function args(values){const out={};for(let i=0;i<values.length;i+=2){if(!values[i]?.startsWith("--")||values[i+1]===undefined)throw new Error("expected --key value arguments");out[values[i].slice(2)]=values[i+1];}return out;}
async function recordExperiment(options){const trace=JSON.parse(await fs.readFile(options.trace,"utf8")),rubricSha256=hashFile(options.rubric),evaluation=createQualityEvaluation({bundleRoot:options.bundle,rubricId:options.rubricId,rubricSha256,evaluator:options.evaluator,scores:options.scores?JSON.parse(await fs.readFile(options.scores,"utf8")):{},notes:[],trajectory:summarizeTrajectory(trace)}),out=path.resolve(options.out);await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify(evaluation,null,2)+"\n",{flag:"wx"});return out;}
if(require.main===module)recordExperiment(args(process.argv.slice(2))).then(console.log).catch((error)=>{console.error(error.message);process.exitCode=1;});
module.exports={recordExperiment};
