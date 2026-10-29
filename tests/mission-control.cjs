"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","dcx-mission-control.js"),"utf8");

function environment(host){
 const callbacks={},listeners={};
 const current={
  missionControl:{assignments:{eclipse:{configured:true,teams:{alpha:true}}},progress:{}},
  approaches:{selected:"con"},
  preps:{con:{consult:true}}
 };
 const teams={alpha:{name:"Alpha"},bravo:{name:"Bravo"}};
 const operators={p1:{narrative:{teamId:"alpha"}},p2:{narrative:{teamId:"bravo"}}};
 const requests={
  ownerA:{identity:{playerId:"p1"},missionActions:{reqA:{missionId:"eclipse",value:"recon",type:"prep",teamId:"alpha"}}},
  ownerB:{identity:{playerId:"p2"},missionActions:{reqB:{missionId:"eclipse",value:"recon",type:"prep",teamId:"alpha"}}}
 };
 const database={ref(p){return {
  on(type,cb){
   listeners[p]=cb;
   if(p.endsWith("/teams"))cb({val:()=>teams});
   if(p.endsWith("/operators"))cb({val:()=>operators});
   if(p.endsWith("/missionActions"))cb({val:()=>({})});
  },
  off(){},
  async transaction(fn){current.missionControl=fn(current.missionControl);return {committed:true}},
  async update(){}
 }}};
 const operations=[
  {id:"eclipse",status:"published",preparations:[{id:"recon",title:"Reconhecimento",interaction:"request",done:false}]},
  {id:"operacao-h",status:"published",preparations:[]}
 ];
 const realtime={
  getRoom:()=>"FRIA-01",getMode:()=>"firebase",getUid:()=>host?"KM":"p1",
  getFirebaseDatabase:()=>database,
  onState:fn=>callbacks.state=fn,onRequests:fn=>callbacks.requests=fn
 };
 const window={
  OPH:{Realtime:realtime,PREP_DEFS:{con:[["consult","Consulta","Consulta ao N-02"]],stealth:[["routes","Rota","Rotas silenciosas"]]}},
  DCX:{StoryStudio:{operations,refreshPlayer(){}},Player:{getLocalIdentity:()=>({playerId:"p1"})}},
  OPHPlayer:{refreshPreps(){}},confirm:()=>true
 };
 const document={
  readyState:"loading",addEventListener(_event,fn){callbacks.ready=fn},
  getElementById:()=>null,querySelector:()=>null
 };
 vm.runInNewContext(source,{window,document,location:{pathname:host?"/keymaster.html":"/index.html"},console});
 callbacks.ready();callbacks.state(current);
 if(host)callbacks.requests(requests);
 return {control:window.DCX.MissionControl,current,requests,teams,operators,window,callbacks};
}

async function run(){
 const player=environment(false),p=player.control;
 assert.equal(p.canSeeMission("eclipse"),true,"Equipe Alpha vê a operação designada");
 assert.equal(p.canSeeMission("operacao-h"),true,"Operação legada continua visível sem designação");
 assert.equal(p.getStatus("operacao-h","alpha","legacy:con:consult").confirmed,true,"Marcações legadas preservadas");
 assert.equal(p.canRequest("eclipse","recon"),true,"Integrante da equipe pode solicitar");
 assert.equal(p.getStatus("eclipse","bravo","recon").confirmed,false,"Sem progresso cruzado entre equipes");
 player.operators.p1.narrative.teamId="bravo";
 assert.equal(p.canSeeMission("eclipse"),false,"Equipe não designada não vê missão na interface");
 assert.equal(p.canRequest("eclipse","recon"),false,"Equipe não designada não solicita preparação");

 const host=environment(true),h=host.control;
 const unauthorized=host.requests.ownerB.missionActions.reqB;
 await assert.rejects(()=>h.confirmFromRequest("ownerB",unauthorized),/autorizada/,"Não confiar no teamId enviado pelo jogador");
 const valid=host.requests.ownerA.missionActions.reqA;
 assert.equal(await h.confirmFromRequest("ownerA",valid),true,"Keymaster confirma a solicitação");
 assert.equal(host.current.missionControl.progress.eclipse.alpha.recon.state,"confirmed");
 assert.equal(host.current.missionControl.progress.eclipse.bravo,undefined,"Não confirma equipe diferente");
 assert.equal(host.window.DCX.StoryStudio.operations[0].preparations[0].done,false,"Não apaga ou modifica status global anterior");
 host.current.approaches.selected="stealth";host.callbacks.state(host.current);
 assert.equal(h.getStatus("operacao-h","alpha","legacy:con:consult").confirmed,true,"Trocar abordagem não apaga legado");
 console.log("DCX Mission Control: 10 verificações concluídas.");
}
run().catch(e=>{console.error(e);process.exitCode=1});
