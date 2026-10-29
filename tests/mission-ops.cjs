"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"..","dcx-mission-ops.js"),"utf8");
const cbs={},watch={};
const operations=[{id:"eclipse",title:"Operação Eclipse",code:"ECL",summary:"Dossiê de missão",status:"published",preparations:[]}];
const privateData={missions:{eclipse:{archive:false,teams:{
 alpha:{state:"active",preps:{p1:{state:"confirmed",observation:"Segredo do Keymaster"},p2:{state:"confirmed"}}},
 bravo:{state:"observing",preps:{}}
},preps:{
 p1:{id:"p1",title:"Identificar infiltrado",description:"Verificar registros",scope:"exclusive",ownerTeam:"alpha",visibility:{bravo:"objective"},version:2,revisions:[{version:1,title:"Antigo"}]},
 p2:{id:"p2",title:"Estabelecer base",description:"Preparação geral",scope:"general",version:1}
},outcomes:{alpha:{outcome:"Sucesso",publicText:"Concluímos a investigação.",internal:"SEGREDO ADMINISTRATIVO",published:false}},
general:{outcome:"Sucesso parcial",internal:"SEGREDO GLOBAL",publicText:"Resumo público",publishedTeams:{bravo:true},overrides:{bravo:"Relatório especial Bravo"}}}},
bindings:{uidAlpha:{playerId:"pA"},uidBravo:{playerId:"pB"}},
grants:{pA:{bravo:{full:false,missions:{eclipse:true}}}}};
const teams={alpha:{name:"Alpha"},bravo:{name:"Bravo"}};
const operators={pA:{narrative:{teamId:"alpha"}},pB:{narrative:{teamId:"bravo"}}};
const database={ref(key){return{
 on(event,fn){watch[key]=fn;if(key.endsWith("/missionOps"))fn({val:()=>privateData});
 else if(key.endsWith("/operators"))fn({val:()=>operators});
 else if(key.endsWith("/teams"))fn({val:()=>teams});
 else if(key.endsWith("/requests"))fn({val:()=>({})});
 else if(key.endsWith("/missionNotices/KM")||key.endsWith("/missionNoticeReads/KM"))fn({val:()=>({})});},
 off(){},async set(){},async update(){},
 async transaction(fn){fn(privateData);return {committed:true,snapshot:{val:()=>privateData}}}
}}};
const fakeDocument={readyState:"loading",addEventListener(_type,fn){cbs.init=fn},
 getElementById(){return null},querySelector(){return null}};
const fakeWindow={
 OPH:{Realtime:{getFirebaseDatabase:()=>database,getRoom:()=>"TEST",getUid:()=>"KM",getMode:()=>"firebase",onState:fn=>cbs.state=fn}},
 DCX:{StoryStudio:{operations},MissionControl:{getSelected:()=>"",isAssigned:(mission,t)=>t==="alpha"||t==="bravo"}},
 addEventListener(type,fn){cbs[type]=fn}
};
vm.runInNewContext(src,{window:fakeWindow,document:fakeDocument,location:{pathname:"/keymaster.html"},console,Date,setTimeout,clearTimeout});
cbs.init(); cbs.state({});
const m=fakeWindow.DCX.MissionOps;
assert.equal(m.getTeamState("eclipse","bravo"),"observing");
const alpha=m.feedFor("eclipse","alpha");
const bravo=m.feedFor("eclipse","bravo");
assert.equal(alpha.preps.p1.state,"confirmed");
assert.equal(alpha.readOnly,false);
assert.equal(bravo.readOnly,true);
assert.equal(bravo.preps.p1.state,"hidden","Nível 1 nunca revela progresso");
assert.equal(bravo.preps.p1.observation,"","Comentários internos não são transmitidos");
assert.equal(bravo.preps.p2.title,"Estabelecer base");
assert.equal(bravo.report,null,"Relatório de equipe não publicado continua oculto");
assert.equal(bravo.generalReport.text,"Relatório especial Bravo");
assert.equal(JSON.stringify(bravo).includes("SEGREDO"),false,"Dado interno não pode vazar no feed");
const view=m.makeView("pA");
assert.equal(Object.keys(view.missions).length,2,"Participação adicional restrita funciona para missão autorizada");
assert.equal(m.makeView("pB").missions["eclipse__alpha"],undefined,"Equipe Bravo não herda a Alpha");
console.log("DCX Mission Ops: 11 verificações de sigilo e projeção concluídas.");
