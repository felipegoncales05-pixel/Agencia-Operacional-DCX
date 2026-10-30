"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","dcx-mission-ops.js"),"utf8");
const sample={
 requests:{
  u1:{identity:{playerId:"a"},missionActions:{r1:{missionId:"alpha",type:"prep"},r2:{missionId:"beta",type:"choice"}}},
  u2:{identity:{playerId:"b"},missionActions:{r3:{missionId:"alpha",type:"prepAdvanced"}}}
 },
 views:{
  u1:{missions:{"alpha__red":{id:"alpha"},"beta__blue":{id:"beta"}}},
  u2:{missions:{"alpha__blue":{id:"alpha"}}},
  u3:{missions:{"beta__red":{id:"beta"}}}
 },
 notices:{
  u1:{n1:{missionId:"alpha"},n2:{missionId:"beta"},n3:{text:"Aviso geral"}},
  u2:{n5:{missionId:"alpha"}}
 },
 reads:{u1:{n1:true,n2:true},u2:{n5:true}},
 ops:{
  missions:{alpha:{preps:{secret:{title:"Secreto"}}},beta:{preps:{safe:{title:"Outra missão"}}}},
  bindings:{u1:{playerId:"a"}},
  grants:{
   a:{red:{full:false,missions:{alpha:true}},blue:{full:false,missions:{alpha:true,beta:true}}},
   b:{red:{full:true,missions:{},snapshots:{alpha:{id:"alpha"},beta:{id:"beta"}}}}
  },
  audit:{old:{missionId:"alpha",action:"old.audit"}}
 }
};
const callbacks={},updates=[];
let promptValue="cancel",confirmed=true,readAllowed=true;
const db={ref(p){return{
 on(_event,callback){
  if(p.endsWith("/missionOps"))callback({val:()=>sample.ops});
  else if(p.endsWith("/operators"))callback({val:()=>({})});
  else if(p.endsWith("/teams"))callback({val:()=>({red:{name:"Red"},blue:{name:"Blue"}})});
  else callback({val:()=>({})});
 },off(){},async once(){
  if(!readAllowed)throw Error("Access denied");
  const suffix=p.split("/").slice(2).join("/");
  const nodes={
   requests:sample.requests,"dcx/missionViews":sample.views,
   "dcx/missionNotices":sample.notices,"dcx/missionNoticeReads":sample.reads,
   "dcx/missionOps":sample.ops
  };
  return {val:()=>nodes[suffix]||{}};
 },async update(value){updates.push(value)}
}}};
const w={
 prompt:()=>promptValue,confirm:()=>confirmed,addEventListener(){},
 OPH:{Realtime:{getFirebaseDatabase:()=>db,getRoom:()=>"FRIA-01",getUid:()=>"KM",getMode:()=>"firebase",onState:fn=>callbacks.state=fn}},
 DCX:{StoryStudio:{operations:[{id:"alpha",title:"Operação Alpha"},{id:"beta",title:"Operação Beta"}]},
 MissionControl:{getSelected:()=>null,isAssigned:()=>false}}
};
const document={readyState:"loading",addEventListener(_event,cb){callbacks.ready=cb},getElementById:()=>null,querySelector:()=>null};
vm.runInNewContext(source,{window:w,document,location:{pathname:"/keymaster.html"},Date,console,
 setTimeout:()=>0,clearTimeout:()=>{}});
callbacks.ready();callbacks.state({});
const ops=w.DCX.MissionOps;
async function run(){
 const patch=ops.buildResetPatch("alpha",1700000000,sample);
 const key="state/missionControl/assignments/alpha";
 assert.equal(patch[key].configured,true);
 assert.equal(Object.keys(patch[key].teams).length,0);
 assert.equal(patch[key].legacySuppressed,true);
 assert.equal(patch["state/missionControl/progress/alpha"],null);
 assert.equal(patch["dcx/missionOps/missions/alpha"].resetAt,1700000000);
 assert.equal(patch["requests/u1/missionActions/r1"],null);
 assert.equal(patch["requests/u2/missionActions/r3"],null);
 assert.equal(patch["dcx/missionViews/u1/missions/alpha__red"],null);
 assert.equal(patch["dcx/missionNotices/u1/n1"],null);
 assert.equal(patch["dcx/missionNoticeReads/u1/n1"],null);
 assert.equal(patch["dcx/missionOps/grants/a/red"],null);
 assert.equal(patch["dcx/missionOps/grants/a/blue/missions/alpha"],null);
 assert.equal(patch["dcx/missionOps/grants/b/red/snapshots/alpha"],null);
 assert.equal(Object.values(patch).some(v=>v?.action==="mission.reset"),true);
 for(const path of Object.keys(patch)){
  assert.equal(/(?:^|\/)beta(?:\/|$)/.test(path)||path.includes("n2")||path.includes("r2"),false,"Outro registro não pode ser resetado: "+path);
  assert.equal(path.startsWith("dcx/missionOps/bindings"),false);
  assert.equal(path.startsWith("state/storyStudio"),false);
  assert.equal(path.startsWith("dcx/operators")||path.startsWith("dcx/teams"),false);
 }
 assert.equal(patch["dcx/missionOps/missions/beta"],undefined);
 assert.equal(patch["requests/u1/missionActions/r2"],undefined);
 assert.equal(patch["dcx/missionViews/u1/missions/beta__blue"],undefined);
 assert.equal(patch["dcx/missionNotices/u1/n2"],undefined);
 assert.equal(patch["dcx/missionNoticeReads/u1/n2"],undefined);
 assert.equal(patch["dcx/missionOps/grants/a/blue/missions/beta"],undefined);
 assert.equal(patch["dcx/missionOps/grants/b/red/snapshots/beta"],undefined);
 assert.equal(patch["dcx/missionOps/audit/old"],undefined);
 assert.throws(()=>ops.buildResetPatch("../evil",1000,sample),/inválido/);
 promptValue=null;
 assert.equal(await ops.resetMission("alpha"),false);
 promptValue="beta";
 await assert.rejects(()=>ops.resetMission("alpha"),/incorreto/);
 promptValue="alpha";confirmed=false;
 assert.equal(await ops.resetMission("alpha"),false);
 assert.equal(updates.length,0,"Cancelamento não modifica dados");
 confirmed=true;readAllowed=false;
 await assert.rejects(()=>ops.resetMission("alpha"),/Access denied/);
 assert.equal(updates.length,0,"Falha de leitura não modifica dados");
 readAllowed=true;
 assert.equal(await ops.resetMission("alpha"),true);
 assert.equal(updates.length,1,"Uma única gravação atômica por reset");
 assert.equal(updates[0]["state/missionControl/progress/alpha"],null);
 console.log("DCX Mission Reset: testes de isolamento, cancelamento, backup lógico e atomicidade aprovados.");
}
run().catch(e=>{console.error(e);process.exitCode=1});
