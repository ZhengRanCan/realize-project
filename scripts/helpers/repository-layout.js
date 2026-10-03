'use strict';
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const catalog=require('./repository-layout.json');
const files=Object.freeze({...catalog.files}),prefixes=Object.freeze({...catalog.prefixes});
function resolveRepositoryPath(...parts) {
 const absolute=path.resolve(...parts),relative=path.relative(ROOT,absolute).replace(/\\/g,'/');
 if(relative==='..'||relative.startsWith('../')||path.isAbsolute(relative))return absolute;
 if(Object.hasOwn(files,relative))return path.resolve(ROOT,files[relative]);
 for(const [old,current]of Object.entries(prefixes))
  if(relative===old||relative.startsWith(old+'/'))return path.resolve(ROOT,current+relative.slice(old.length));
 return absolute;
}
const repositoryPath=(...parts)=>resolveRepositoryPath(ROOT,...parts);
function joinRepositoryPath(...parts) {
 const joined=path.join(...parts);
 return path.isAbsolute(joined)?resolveRepositoryPath(joined):repositoryRelative(joined);
}
const repositoryRelative=(...parts)=>path.relative(ROOT,repositoryPath(...parts)).replace(/\\/g,'/');
function legacyReviewPath(root=ROOT) {
 const existing=path.join(root,'human-review.json');
 return require('node:fs').existsSync(existing)?existing:path.join(root,'workspace/legacy-review/human-review.json');
}
module.exports={legacyReviewPath,ROOT,files,prefixes,repositoryPath,repositoryRelative,resolveRepositoryPath,joinRepositoryPath};
