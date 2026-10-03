'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {ROOT,files,prefixes,repositoryPath}=require('./helpers/repository-layout');
const journal=path.join(ROOT,'workspace/.f22-migration.json');
const report=path.join(ROOT,'docs/log/artifacts/F22-entry-and-repository-layout/migration-integrity.json');
function safe(relative){const absolute=path.resolve(ROOT,relative),rel=path.relative(ROOT,absolute);assert.ok(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel),'Unsafe migration path');return absolute;}
function fingerprint(file){const stat=fs.lstatSync(file);return stat.isSymbolicLink()?{link:fs.readlinkSync(file)}:{sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),size:stat.size};}
function walk(relative,rows,tracked){const absolute=safe(relative),stat=fs.lstatSync(absolute);
 if(stat.isDirectory()){for(const item of fs.readdirSync(absolute)){if(item!=='.git')walk(relative+'/'+item,rows,tracked);}return;}
 const current=path.relative(ROOT,repositoryPath(relative)).replace(/\\/g,'/');
 rows.push({old:relative,current,tracked:tracked.has(relative),mutable:relative.endsWith('/README.md')||relative==='experiments/index.json',...fingerprint(absolute)});
}
function save(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.new';
 const fd=fs.openSync(temporary,'w');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 fs.renameSync(temporary,file);}
function moveTree(from,to){
 if(!fs.existsSync(to)){try{fs.renameSync(from,to);return;}catch(e){if(e.code!=='EPERM'||!fs.lstatSync(from).isDirectory())throw e;fs.mkdirSync(to);}}
 assert.ok(fs.lstatSync(from).isDirectory()&&fs.lstatSync(to).isDirectory(),'File collision during move');
 for(const entry of fs.readdirSync(from))moveTree(path.join(from,entry),path.join(to,entry));
 fs.rmdirSync(from);
}
function capture(){assert.ok(!fs.existsSync(journal),'Migration already captured');const tracked=new Set(execFileSync('git',['ls-files'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n'));
 const rows=[],roots=['fixtures','测试文档','ai','experiments','bundles','tmp','docs/ref','docs/source-sections.json',...Object.keys(files).filter(p=>p.endsWith('.map.json'))];
 for(const root of roots)if(fs.existsSync(safe(root)))walk(root,rows,tracked);
 save(journal,{version:1,rows,moved:[],capturedAt:new Date().toISOString()});
 console.log(`Migration baseline: ${rows.length} entries captured privately; ${rows.filter(r=>r.tracked&&!r.mutable).length} protected tracked files.`);
}
function move(){const data=JSON.parse(fs.readFileSync(journal));const moves=[...Object.entries(files),...Object.entries(prefixes)];
 // Preflight all destinations before touching any source.
 for(const [old,current]of moves){if(data.moved.includes(old))continue;const from=safe(old),to=safe(current);if(fs.existsSync(from))assert.ok(!fs.existsSync(to)||data.inProgress===old,'Target already exists: '+current);}
 for(const [old,current]of moves){if(data.moved.includes(old))continue;const from=safe(old),to=safe(current);if(!fs.existsSync(from))continue;
  fs.mkdirSync(path.dirname(to),{recursive:true});data.inProgress=old;save(journal,data);moveTree(from,to);data.moved.push(old);delete data.inProgress;save(journal,data);
 }
 for(const dir of ['fixtures','测试文档','ai']){const target=safe(dir);if(fs.existsSync(target)){assert.equal(fs.readdirSync(target).length,0,'Unmapped files remain: '+dir);fs.rmdirSync(target);}}
 verify(false);
}
function verify(final=true){const data=JSON.parse(fs.readFileSync(journal));let checked=0;
 for(const row of data.rows){const file=safe(row.current);assert.ok(fs.existsSync(file)||row.link!==undefined,'Missing moved file: '+row.current);
  if(final&&row.mutable)continue;const actual=fingerprint(file);if(row.link!==undefined)assert.equal(actual.link,row.link);else{assert.equal(actual.sha256,row.sha256,'Changed data: '+row.current);assert.equal(actual.size,row.size);}checked++;
 }
 const protectedFiles=data.rows.filter(r=>r.tracked&&!r.mutable).map(({old,current,sha256,size,link})=>({old,current,sha256,size,...(link!==undefined?{link}:{})}));
 save(report,{version:1,result:'passed',checkedEntries:checked,totalEntries:data.rows.length,protectedTrackedFiles:protectedFiles.length,privateEntries:data.rows.filter(r=>!r.tracked).length,gitInternalsExcluded:true,protectedFiles});
 console.log(`Migration integrity: ${checked} entries passed; ${protectedFiles.length} protected tracked files; local content remains private.`);
}
if(require.main===module){const mode=process.argv[2];if(mode==='--capture')capture();else if(mode==='--move')move();else if(mode==='--verify')verify();else throw new Error('Use --capture / --move / --verify');}
module.exports={safe,fingerprint,save,moveTree};
