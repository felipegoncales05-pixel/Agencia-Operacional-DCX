/* DCX // Mission Ops: gerenciamento, desfechos e comunicacoes.
   Acesso a dados privados exige regras RTDB e vinculacao explicita UID -> operador. */
(()=>{
'use strict';
const host=/\/keymaster\.html$/i.test(location.pathname),$=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(v,n=4000)=>String(v??'').trim().slice(0,n);
const id=()=>('mc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9));
const rt=()=>window.OPH?.Realtime,db=()=>rt()?.getFirebaseDatabase?.(),room=()=>rt()?.getRoom?.(),uid=()=>rt()?.getUid?.();
const path=x=>'rooms/'+room()+'/dcx/'+x;
const catalog=()=>window.DCX?.StoryStudio?.operations||[];
const empty=()=>({missions:{},bindings:{},grants:{},audit:{}});
let data=empty(),operators={},teams={},requests={},currentRoom='',listeners=[],playerView={},notices={},reads={},started=false,toastBaseline=false,publishTimer=null,viewerTeam='',lastAuth='',error='';
const teamName=t=>teams?.[t]?.name||t;
const currentMission=()=>window.DCX?.MissionControl?.getSelected?.()||'';
const teamIds=()=>Object.keys(teams).filter(t=>t!=='_init'&&teams[t]?.name);
const op=id=>catalog().find(x=>x.id===id);
function record(mission){return data.missions?.[mission]||{teams:{},preps:{},outcomes:{},general:{}}}
function activeTeam(mission,t){
 const membership=record(mission).teams?.[t]?.state;
 const basic=window.DCX?.MissionControl?.isAssigned?.(mission,t);
 return membership==='active'||!membership&&basic;
}
function feedFor(mission,t,kind='active'){
 const o=op(mission),r=record(mission);if(!o)return null;
 const responsible=r.teams?.[t],state=r.archive?'completed':(responsible?.state||kind);
 const preps={};
 for(const [pid,p] of Object.entries(r.preps||{})){
  const mine=p.scope!=='exclusive'||p.ownerTeam===t;
  const visibility=mine?'progress':(p.visibility?.[t]||'none');
  if(visibility==='none')continue;
  const ownStatus=r.teams?.[t]?.preps?.[pid];
  preps[pid]={id:pid,title:p.title,description:p.description,version:p.version||1,
   scope:p.scope==='exclusive'?'exclusive':'general',ownerTeam:mine?t:'other',
   access:mine?'responsible':visibility,interaction:mine&&state==='active'?'request':'read',
   state:mine?(ownStatus?.state||'available'):(visibility==='progress'?(r.teams?.[p.ownerTeam]?.preps?.[pid]?.state||'available'):'hidden'),
   observation:mine?(ownStatus?.observation||''):''};
 }
 const result=r.outcomes?.[t],publicReport=result?.published===true?{
  outcome:result.outcome||'',text:result.publicText||''}:null;
 const general=r.general?.publishedTeams?.[t]?{
  outcome:r.general.outcome||'',
  text:r.general.overrides?.[t]||r.general.publicText||''
 }:null;
 return {id:mission,title:o.title,code:o.code||'',summary:o.summary||'',state,readOnly:state!=='active',
  preps,report:publicReport,generalReport:general,updatedAt:r.updatedAt||0};
}
function getAccess(playerId,mission,t){
 const primary=operators[playerId]?.narrative?.teamId;
 if(primary===t)return true;
 const grant=data.grants?.[playerId]?.[t];
 return !!(grant&&(grant.full===true||grant.missions?.[mission]===true));
}
function canActGrant(playerId,mission,t){
 if(operators?.[playerId]?.narrative?.teamId===t)return true;
 return data.grants?.[playerId]?.[t]?.mode==='active'&&getAccess(playerId,mission,t);
}
function makeView(playerId){
 const view={missions:{},teams:{},generatedAt:Date.now()};
 const olist=catalog();
 for(const o of olist){
  const r=record(o.id);
  const candidate=new Set([...Object.keys(r.teams||{}),...teamIds().filter(t=>window.DCX?.MissionControl?.isAssigned?.(o.id,t))]);
  for(const t of candidate){
   if(!getAccess(playerId,o.id,t))continue;
   const teamState=r.teams?.[t]?.state||'active';
   if(!['active','observing','completed'].includes(teamState))continue;
   let packet=feedFor(o.id,t);if(!packet)continue;
   const grant=operators?.[playerId]?.narrative?.teamId===t?null:data.grants?.[playerId]?.[t];
   if(grant?.mode==='historical'){
    packet=grant.snapshots?.[o.id];if(!packet)continue;
    packet=JSON.parse(JSON.stringify(packet));packet.readOnly=true;packet.state='historical';Object.values(packet.preps||{}).forEach(p=>p.interaction='read');
   }else if(grant?.mode==='following'){
    packet.readOnly=true;packet.state='observing';
    Object.values(packet.preps||{}).forEach(p=>p.interaction='read');
   }
   view.missions[o.id+'__'+t]=packet;
   view.teams[t]=teamName(t);
  }
 }
 return view;
}
function allowedUIDs(team,missionId){
 return Object.entries(data.bindings||{}).filter(([user,b])=>b?.playerId&&
  getAccess(b.playerId,missionId,team) && (operators[b.playerId]?.narrative?.teamId===team||data.grants?.[b.playerId]?.[team]?.mode!=='historical') && teamIds().includes(team)).map(([user])=>user);
}
function updateViewer(){
 if(host)return;
 const root=$('dcxMissionPlayerOps');if(!root)return;
 const list=Object.values(playerView?.missions||{});
 root.innerHTML='<div class="dcxMOPHeader"><h2>TRANSMISSÕES DAS EQUIPES</h2><small>PROGRESSO COLETIVO E ARQUIVOS AUTORIZADOS</small></div>'+
 (list.length?list.map(m=>{
  const teamKey=Object.keys(playerView.missions).find(k=>playerView.missions[k]===m)?.split('__').slice(-1)[0]||'';
  return '<article class="dcxMOPCard"><small>'+E(playerView.teams?.[teamKey]||teamKey)+' // '+E(m.state.toUpperCase())+'</small><h3>'+E(m.title)+'</h3>'+
   '<p>'+E(m.summary)+'</p>'+(m.readOnly?'<p class="dcxMOPWarn">SOMENTE LEITURA · ATUALIZAÇÕES AUTORIZADAS</p>':'')+
   Object.values(m.preps||{}).map(p=>'<div class="dcxMOPPrep"><b>'+E(p.title)+'</b><span>'+E(p.state==='hidden'?'OBJETIVO REVELADO':p.state.toUpperCase())+'</span><p>'+E(p.description)+'</p>'+
    (p.observation?'<small>DEVOLUÇÃO: '+E(p.observation)+'</small>':'')+
    (p.interaction==='request'&&!m.readOnly&&!['confirmed','pending','suspended'].includes(p.state)?'<button data-mop-ask="'+E(p.id)+'" data-mop-mission="'+E(m.id)+'" data-mop-team="'+E(teamKey)+'">SOLICITAR APROVAÇÃO</button>':'')+
    '</div>').join('')+
   (m.report?'<div class="dcxMOPReport"><b>DESFECHO DA EQUIPE: '+E(m.report.outcome)+'</b><p>'+E(m.report.text)+'</p></div>':'')+
   (m.generalReport?'<div class="dcxMOPReport"><b>RESULTADO GERAL: '+E(m.generalReport.outcome)+'</b><p>'+E(m.generalReport.text)+'</p></div>':'')+'</article>';
 }).join(''):'<p class="dcxMCEmpty">Nenhuma transmissão de missão vinculada ao seu acesso. O Keymaster precisa autorizar sua identidade operacional.</p>');
}
function playerPanels(){
 if(host||$('dcxMissionPlayerOps'))return;
 const target=$('dcxMissionsOverview');if(!target)return;
 const panel=document.createElement('section');panel.id='dcxMissionPlayerOps';panel.className='dcxMissionPlayerOps';
 target.append(panel);
 panel.addEventListener('click',async event=>{
  const btn=event.target.closest('[data-mop-ask]');if(!btn)return;
  const mission=btn.dataset.mopMission,t=btn.dataset.mopTeam,pid=btn.dataset.mopAsk;
  const view=playerView.missions?.[mission+'__'+t],prep=view?.preps?.[pid];
  if(!prep||prep.interaction!=='request'||view.readOnly)return;
  if(!window.confirm('Solicitar avaliação de '+prep.title+' para '+(playerView.teams[t]||t)+'?'))return;
  const request={missionId:mission,moduleId:'ops-preparation',type:'prepAdvanced',value:pid,teamId:t,
   missionTitle:view.title,moduleTitle:'Central Universal',createdAt:Date.now()};
  try{btn.disabled=true;await db().ref('rooms/'+room()+'/requests/'+uid()+'/missionActions').push().set(request)}
  catch(err){window.alert('Não foi possível enviar a solicitação: '+err.message)}
  finally{btn.disabled=false}
 });
 updateViewer();
}
function noticePanel(){
 if($('dcxMissionBell'))return;
 const target=host?document.querySelector('#console .top .actions'):document.querySelector('#workspaceGolpe .dcxMissionsHero');
 if(!target)return;
 const wrap=document.createElement('div');wrap.className='dcxMOPNotifications';wrap.innerHTML='<button type="button" id="dcxMissionBell" class="dcxMOPBell" aria-label="Notificações de missões">◉ <span id="dcxMissionUnread">0</span></button><section id="dcxMissionInbox" class="dcxMOPInbox" hidden><h3>COMUNICAÇÕES OPERACIONAIS</h3><div id="dcxMissionNotices"></div></section>';
 target.append(wrap);
 wrap.addEventListener('click',async e=>{
  if(e.target.closest('#dcxMissionBell')){$('dcxMissionInbox').hidden=!$('dcxMissionInbox').hidden;return}
  const btn=e.target.closest('[data-mop-read]');if(!btn)return;
  try{await db().ref(path('missionNoticeReads/'+uid()+'/'+btn.dataset.mopRead)).set(true)}catch(err){console.warn(err)}
 });
 updateNotices();
}
function updateNotices(){
 const count=Object.keys(notices||{}).filter(k=>!reads?.[k]).length;
 if($('dcxMissionUnread'))$('dcxMissionUnread').textContent=count;
 if($('dcxMissionNotices'))$('dcxMissionNotices').innerHTML=Object.entries(notices||{}).reverse().slice(0,100).map(([k,n])=>
  '<article class="'+(reads?.[k]?'read':'new')+'"><small>'+E(n.missionTitle||'DCX')+' // '+E(n.teamName||'')+'</small><p>'+E(n.text||'Atualização operacional')+'</p>'+
  (reads?.[k]?'<span>LIDA</span>':'<button data-mop-read="'+E(k)+'">MARCAR LIDA</button>')+'</article>').join('')||'<p>Nenhuma transmissão recebida.</p>';
}
async function pushNotice(missionId,t,text){
 const users=allowedUIDs(t,missionId);if(!users.length)return;
 const key=id(),updates={};
 for(const user of users)updates['missionNotices/'+user+'/'+key]={missionId,teamName:teamName(t),missionTitle:op(missionId)?.title||'MISSÃO',text:clean(text,240),createdAt:Date.now()};
 await db().ref(path('')).update(updates);
}
async function syncPending(){
 if(!host||!room()||!db())return;
 const all=Object.entries(requests||{}).flatMap(([owner,r])=>Object.entries(r?.missionActions||{}).map(([key,a])=>({...a,owner,key})));
 const keys=new Set();
 for(const a of all){
  if(a.type!=='prepAdvanced')continue;
  const bound=data.bindings?.[a.owner]?.playerId,m=record(a.missionId),prep=m.preps?.[a.value],team=m.teams?.[a.teamId];
  const recognized=bound&&requests?.[a.owner]?.identity?.playerId===bound&&canActGrant(bound,a.missionId,a.teamId);
  const wasActive=team?.state==='active'||!team&&window.DCX?.MissionControl?.isAssigned?.(a.missionId,a.teamId);
  const predatesWithdrawal=team?.state==='observing'&&Number(a.createdAt)<=Number(team.changedAt||0);
  if(!recognized||!prep||!wasActive&&!predatesWithdrawal||prep.scope==='exclusive'&&prep.ownerTeam!==a.teamId)continue;
  const old=team?.preps?.[a.value]?.state||'available';
  if(!['available','returned'].includes(old)||old==='returned'&&Number(a.createdAt||0)<=Number(team?.preps?.[a.value]?.at||0))continue;
  const token=a.missionId+'__'+a.teamId+'__'+a.value;if(keys.has(token))continue;keys.add(token);
  await mutate(a.missionId,'prep.request',next=>{
   next.teams=next.teams||{};const t=next.teams[a.teamId]||{state:'active',preps:{}};
   t.preps=t.preps||{};
   if(!t.preps[a.value]||t.preps[a.value].state==='available'||t.preps[a.value].state==='returned'&&Number(a.createdAt||0)>Number(t.preps[a.value].at||0))
    t.preps[a.value]={state:'pending',at:Date.now(),version:next.preps?.[a.value]?.version||1};
   next.teams[a.teamId]=t;return next;
  });
 }
}
function updatePlayerNotice(next){
 const previous=notices;notices=next||{};
 if(toastBaseline){
  const newOnes=Object.entries(notices).filter(([k])=>!previous[k]);
  if(newOnes.length){const node=document.createElement('div');node.className='dcxMOPToast';node.textContent='DCX // '+clean(newOnes[newOnes.length-1][1].text,160);
   document.body.append(node);setTimeout(()=>node.remove(),5000)}
 }
 toastBaseline=true;updateNotices();
}
function nextMissionState(missionId){return JSON.parse(JSON.stringify(data.missions?.[missionId]||{teams:{},preps:{},outcomes:{},general:{},archive:false}))}
async function mutate(missionId,event,fn){
 if(!host||!db()||!room())throw Error('Keymaster não conectado ao Firebase.');
 let changed=false;
 const result=await db().ref(path('missionOps')).transaction(old=>{
  const next=old&&typeof old==='object'?old:empty();
  const normalized=JSON.parse(JSON.stringify(next));
  normalized.missions=normalized.missions||{};
  const base=normalized.missions[missionId]||{teams:{},preps:{},outcomes:{},general:{},archive:false};
  const updated=fn(JSON.parse(JSON.stringify(base)),normalized);
  if(updated===false)return;
  if(updated)normalized.missions[missionId]=updated;
  normalized.missions[missionId].updatedAt=Date.now();
  normalized.audit=normalized.audit||{};
  const trace=id();normalized.audit[trace]={missionId,action:event,by:uid(),at:Date.now()};
  changed=true;return normalized;
 },undefined,false);
 if(!result.committed||!changed)throw Error('Alteração não concluída.');
 data=result.snapshot?.val?.()||data;renderHost();schedulePublish();
}
async function patchTeam(mission,t,change){
 await mutate(mission,'team.'+change,s=>{s.teams=s.teams||{};const old=s.teams[t]||{state:'active',preps:{}};const preps=old.preps||{};
   if(change==='reactivate')Object.values(preps).forEach(p=>{if(p.state==='suspended')p.state='returned'});
   s.teams[t]={...old,state:change==='reactivate'?'active':change==='observe'?'observing':'completed',changedAt:Date.now(),preps};return s});
 await pushNotice(mission,t,change==='observe'?'Sua equipe passou ao modo observador. Acompanhamento em somente leitura.':change==='reactivate'?'Sua equipe foi reintegrada à operação.':'Sua equipe foi concluída pelo Keymaster.');
}
async function syncAssignments(mission,previous,current){
 const removed=previous.filter(t=>!current.includes(t));
 const added=current.filter(t=>!previous.includes(t));
 for(const t of removed)await patchTeam(mission,t,'observe');
 for(const t of added)if(record(mission).teams?.[t]?.state==='observing')await patchTeam(mission,t,'reactivate');
}
async function changePrep(mission,pid,params){
 return mutate(mission,pid?'prep.edit':'prep.create',s=>{
  s.preps=s.preps||{};
  const existing=pid?s.preps[pid]:null,key=pid||id();
  const version=(existing?.version||0)+1;
  const revisions=[...(existing?.revisions||[])];
  if(existing)revisions.push({version:existing.version||1,title:existing.title,description:existing.description,scope:existing.scope,ownerTeam:existing.ownerTeam,at:Date.now()});
  s.preps[key]={...existing,id:key,title:clean(params.title,120),description:clean(params.description,1000),
   scope:params.scope==='exclusive'?'exclusive':'general',ownerTeam:params.scope==='exclusive'?params.ownerTeam||'':'',
   visibility:existing?.visibility||{},version,revisions:revisions.slice(-50)};
  return s;
 });
}
async function decidePrep(mission,t,pid,action,observation=''){
 await mutate(mission,'prep.'+action,s=>{
  const p=s.preps?.[pid];if(!p)throw Error('Preparação não encontrada.');
  s.teams=s.teams||{};const team=s.teams[t]||{state:'active',preps:{}};
  team.preps=team.preps||{};
  const old=team.preps[pid],current=team.state||'active';
  const state=action==='confirm'?'confirmed':action==='return'?(current==='observing'?'suspended':'returned'):'available';
  team.preps[pid]={state,observation:action==='return'?clean(observation,500):'',version:p.version||1,at:Date.now(),
   history:[...(old?.history||[]),...(old?[{state:old.state,at:old.at,version:old.version}]:[])].slice(-40)};
  s.teams[t]=team;return s;
 });
 await pushNotice(mission,t,action==='confirm'?'Preparação aprovada: '+record(mission).preps?.[pid]?.title:action==='return'?'Preparação devolvida para ajustes.':'Preparação reaberta pelo Keymaster.');
}
async function setOutcome(mission,t,result,internal,publicText,published){
 await mutate(mission,'outcome.team',s=>{
  s.outcomes=s.outcomes||{};
  s.outcomes[t]={outcome:result,internal:clean(internal),publicText:clean(publicText),published:!!published,updatedAt:Date.now()};
  return s;
 });
 if(published)await pushNotice(mission,t,'O Keymaster publicou um relatório de desfecho para sua equipe.');
}
async function generalOutcome(mission,result,internal,publicText,targets,overrides){
 await mutate(mission,'outcome.general',s=>{
  s.general={outcome:result,internal:clean(internal),publicText:clean(publicText),
   publishedTeams:Object.fromEntries(targets.map(t=>[t,true])),overrides,updatedAt:Date.now()};return s;
 });
 for(const t of targets)await pushNotice(mission,t,'Resultado geral da missão divulgado para sua equipe.');
}
async function bindUser(user,player){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(user)||!operators[player])throw Error('Selecione um operador válido.');
 const next={...data,bindings:{...(data.bindings||{}),[user]:{playerId:player,at:Date.now(),by:uid()}}};
 await db().ref(path('missionOps/bindings/'+user)).set(next.bindings[user]);
 const summary=makeView(player);const reports=Object.values(summary.missions||{});
 await db().ref(path('missionNotices/'+user+'/'+id())).set({missionTitle:'DCX // INTEGRAÇÃO',teamName:'CENTRAL',text:'Briefing de integração: '+reports.length+' participação(ões) autorizada(s). Consulte as missões para acompanhar a situação atual.',createdAt:Date.now()});
 schedulePublish();
}
async function grantAgent(player,t,missionId,full,revoke,mode='active'){
 if(!operators[player]||!teams[t])throw Error('Agente ou equipe não encontrados.');
 const base={...(data.grants?.[player]?.[t]||{})};
 if(revoke){await db().ref(path('missionOps/grants/'+player+'/'+t)).remove()}
 else{base.full=!!full;base.missions=full?{}:{[missionId]:true};base.mode=['active','following','historical'].includes(mode)?mode:'active';base.changedAt=Date.now();
  base.snapshots=base.mode==='historical'?Object.fromEntries(catalog().filter(o=>(full||o.id===missionId)&&window.DCX?.MissionControl?.isAssigned?.(o.id,t)).map(o=>[o.id,feedFor(o.id,t)])):{};
  await db().ref(path('missionOps/grants/'+player+'/'+t)).set(base)}
 schedulePublish();
}
async function publishViews(){
 if(!host||!db()||!room())return;
 const entries=Object.entries(data.bindings||{});if(!entries.length)return;
 const changes={};
 for(const [user,b] of entries){
  if(!b?.playerId)continue;
  changes['missionViews/'+user]=makeView(b.playerId);
 }
 await db().ref(path('')).update(changes);
}
function schedulePublish(){if(!host)return;clearTimeout(publishTimer);publishTimer=setTimeout(()=>publishViews().catch(e=>{error='FALHA AO PUBLICAR VISÕES: '+e.message;renderHost();}),500)}
function form(){
 const root=$('dcxMissionOpsHost');if(root)return root;
 const board=$('dcxMissionControl');if(!board)return null;
 const section=document.createElement('section');section.id='dcxMissionOpsHost';section.className='dcxMissionOpsHost';board.append(section);
 section.addEventListener('click',async e=>{
  const b=e.target.closest('[data-mo-action]');if(!b)return;const action=b.dataset.moAction,mission=b.dataset.moMission||currentMission(),t=b.dataset.moTeam||'';
  const text=(name)=>clean(section.querySelector('[name="'+name+'"]')?.value||'');
  const val=name=>section.querySelector('[name="'+name+'"]')?.value||'';
  const checked=name=>!!section.querySelector('[name="'+name+'"]')?.checked;
  if(action==='cancel'){section.querySelector('#dcxMOEditor')?.remove();return}
  try{
   b.disabled=true;
   if(action==='setTeam')await patchTeam(mission,t,val('teamState_'+t)==='observing'?'observe':val('teamState_'+t)==='completed'?'complete':'reactivate');
   if(action==='archive'){
    await mutate(mission,'mission.archive',s=>{s.archive=!s.archive;return s});
    for(const tid of teamIds().filter(tid=>window.DCX?.MissionControl?.isAssigned?.(mission,tid)||record(mission).teams?.[tid]))
     await pushNotice(mission,tid,record(mission).archive?'A missão foi encerrada pelo Keymaster.':'A missão foi reaberta pelo Keymaster.');
   }
   if(action==='createPrep'||action==='editPrep'){
    const title=text('prepTitle');if(!title)throw Error('Título obrigatório.');
    await changePrep(mission,action==='editPrep'?val('prepId'):null,{title,description:text('prepDescription'),scope:val('prepScope'),ownerTeam:val('prepOwner')});
   }
   if(action==='prepConfirm'||action==='prepReturn'||action==='prepReopen')
    await decidePrep(mission,t,b.dataset.moPrep,action==='prepConfirm'?'confirm':action==='prepReturn'?'return':'reopen',text('obs_'+b.dataset.moPrep+'_'+t));
   if(action==='prepVisibility'){
    await mutate(mission,'prep.visibility',s=>{s.preps[b.dataset.moPrep].visibility=s.preps[b.dataset.moPrep].visibility||{};
     s.preps[b.dataset.moPrep].visibility[t]=val('visibility_'+b.dataset.moPrep+'_'+t);return s});
    if(val('visibility_'+b.dataset.moPrep+'_'+t)!=='none')await pushNotice(mission,t,'Uma preparação exclusiva foi revelada à sua equipe.');
   }
   if(action==='saveOutcome')await setOutcome(mission,t,val('outcome_'+t),text('internal_'+t),text('public_'+t),checked('published_'+t));
   if(action==='saveGeneral'){
    const selected=[...section.querySelectorAll('[data-mo-publish]:checked')].map(x=>x.dataset.moPublish);
    const overrides={};selected.forEach(k=>{const x=text('override_'+k);if(x)overrides[k]=x});
    await generalOutcome(mission,val('overallResult'),text('overallInternal'),text('overallPublic'),selected,overrides);
   }
   if(action==='bind')await bindUser(val('bindUid'),val('bindPlayer'));
   if(action==='revokeBinding'){
    await db().ref(path('missionOps/bindings/'+b.dataset.moUid)).remove();
    await db().ref(path('missionViews/'+b.dataset.moUid)).remove();
   }
   if(action==='grant')await grantAgent(val('grantPlayer'),val('grantTeam'),mission,checked('grantFull'),false,val('grantMode'));
   if(action==='revokeGrant')await grantAgent(b.dataset.moPlayer,t,mission,false,true);
   if(action==='evaluate'){
    const owner=b.dataset.moOwner,requestId=b.dataset.moRequest,req=requests?.[owner]?.missionActions?.[requestId],binding=data.bindings?.[owner];
    const active=record(req?.missionId),p=active?.preps?.[req?.value],pteam=binding&&req?.teamId;
    const teamState=active?.teams?.[pteam];
    const pendingBeforeWithdrawal=teamState?.state==='observing'&&Number(req?.createdAt||0)>0&&Number(req.createdAt)<=Number(teamState.changedAt||0);
    if(!req||req.type!=='prepAdvanced'||!binding||!p||!getAccess(binding.playerId,req.missionId,pteam)||
       !canActGrant(binding.playerId,req.missionId,pteam)||!teamState||!(teamState.state==='active'||pendingBeforeWithdrawal)||p.scope==='exclusive'&&p.ownerTeam!==pteam)throw Error('Solicitação sem autorização válida.');
    const decision=val('decision_'+requestId)||'confirm';
    await decidePrep(req.missionId,pteam,req.value,decision,clean(val('requestNote_'+requestId),500));
    await db().ref('rooms/'+room()+'/requests/'+owner+'/missionActions/'+requestId).remove();
   }
   if(action==='editOpen'){openEditor(section,mission,b.dataset.moPrep);return}
   renderHost();
  }catch(err){error=err.message;renderHost()}
  finally{b.disabled=false}
 });
 return section;
}
function openEditor(node,mission,pid){
 const p=record(mission).preps?.[pid]||{};
 const container=document.createElement('div');container.id='dcxMOEditor';container.className='dcxMOEditor';
 const old=node.querySelector('#dcxMOEditor');if(old)old.remove();
 container.innerHTML='<h3>'+(pid?'EDITAR PREPARAÇÃO':'NOVA PREPARAÇÃO')+'</h3>'+
  '<input type="hidden" name="prepId" value="'+E(pid||'')+'"/>'+
  '<label>OBJETIVO<input name="prepTitle" maxlength="120" value="'+E(p.title||'')+'"/></label>'+
  '<label>DESCRIÇÃO<textarea name="prepDescription" maxlength="1000">'+E(p.description||'')+'</textarea></label>'+
  '<label>TIPO<select name="prepScope"><option value="general" '+(p.scope!=='exclusive'?'selected':'')+'>GERAL</option><option value="exclusive" '+(p.scope==='exclusive'?'selected':'')+'>EXCLUSIVA</option></select></label>'+
  '<label>EQUIPE RESPONSÁVEL<select name="prepOwner">'+teamIds().map(t=>'<option value="'+E(t)+'" '+(p.ownerTeam===t?'selected':'')+'>'+E(teamName(t))+'</option>').join('')+'</select></label>'+
  '<button class="btn gold" data-mo-action="'+(pid?'editPrep':'createPrep')+'" data-mo-mission="'+E(mission)+'">SALVAR</button> '+
  '<button class="btn" data-mo-action="cancel">CANCELAR</button>';
 node.append(container);container.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function hostEvaluations(){
 const list=Object.entries(requests).flatMap(([owner,r])=>Object.entries(r?.missionActions||{}).map(([key,v])=>({...v,owner,key}))).filter(a=>a.type==='prepAdvanced');
 return '<h3>AVALIAÇÕES AVANÇADAS ('+list.length+')</h3>'+(list.length?list.map(a=>{
  const binding=data.bindings?.[a.owner],r=record(a.missionId),p=r.preps?.[a.value],valid=binding&&getAccess(binding.playerId,a.missionId,a.teamId)&&r.teams?.[a.teamId]&&p;
  return '<div class="dcxMOPCard"><b>'+E(a.missionTitle||a.missionId)+'</b> · '+E(teamName(a.teamId||''))+
   '<p>'+E(p?.title||'Preparação não encontrada')+' · '+(valid?'AGUARDANDO KEYMASTER':'CONFERIR VÍNCULO / PERMISSÃO')+'</p>'+
   (valid?'<label>DECISÃO<select name="decision_'+E(a.key)+'"><option value="confirm">CONFIRMAR</option><option value="return">DEVOLVER</option></select></label>'+
   '<label>OBSERVAÇÃO<textarea name="requestNote_'+E(a.key)+'"></textarea></label>'+
   '<button class="btn" data-mo-action="evaluate" data-mo-owner="'+E(a.owner)+'" data-mo-request="'+E(a.key)+'">AVALIAR</button>':'')+'</div>';
 }).join(''):'<p>Nenhuma solicitação avançada pendente.</p>');
}
function hostDetail(mission){
 const o=op(mission),r=record(mission);if(!o)return '';
 const ts=teamIds().filter(t=>window.DCX?.MissionControl?.isAssigned?.(mission,t)||r.teams?.[t]);
 return '<div class="dcxMOPHeader"><h3>GESTÃO AVANÇADA // '+E(o.title)+'</h3><p>Atualizações de equipes, preparações classificadas, encerramentos e relatórios.</p></div>'+
 '<div class="dcxMOPSection"><h3>ESTADO DA OPERAÇÃO</h3><button class="btn" data-mo-action="archive" data-mo-mission="'+E(mission)+'">'+(r.archive?'REABRIR OPERAÇÃO':'ARQUIVAR / ENCERRAR MISSÃO')+'</button></div>'+
 '<div class="dcxMOPSection"><h3>EQUIPES OPERACIONAIS</h3>'+ts.map(t=>{
  const s=r.teams?.[t]?.state||'active';
  return '<div class="dcxMOPRow"><b>'+E(teamName(t))+'</b><select name="teamState_'+E(t)+'">'+
   ['active','observing','completed'].map(v=>'<option value="'+v+'" '+(v===s?'selected':'')+'>'+({active:'ATIVA',observing:'OBSERVADORA',completed:'CONCLUÍDA'}[v])+'</option>').join('')+
   '</select><button class="btn" data-mo-action="setTeam" data-mo-mission="'+E(mission)+'" data-mo-team="'+E(t)+'">APLICAR</button></div>'
 }).join('')+'</div>'+
 '<div class="dcxMOPSection"><h3>PREPARAÇÕES PERSONALIZADAS / CLASSIFICADAS</h3><button class="btn" data-mo-action="editOpen" data-mo-mission="'+E(mission)+'">+ PREPARAÇÃO</button>'+
 Object.values(r.preps||{}).map(p=>'<div class="dcxMOPCard"><b>'+E(p.title)+'</b> <small>VERSÃO '+(p.version||1)+' · '+(p.scope==='exclusive'?'EXCLUSIVA':'GERAL')+'</small><p>'+E(p.description)+'</p>'+
 '<button class="btn" data-mo-action="editOpen" data-mo-mission="'+E(mission)+'" data-mo-prep="'+E(p.id)+'">EDITAR</button>'+
 (p.scope==='exclusive'?'<div class="dcxMOPRow"><b>REVELAR A OUTRAS EQUIPES:</b></div>'+ts.filter(t=>t!==p.ownerTeam).map(t=>
 '<div class="dcxMOPRow"><b>'+E(teamName(t))+'</b><select name="visibility_'+E(p.id)+'_'+E(t)+'">'+
 ['none','objective','progress'].map(v=>'<option value="'+v+'" '+(p.visibility?.[t]===v||!p.visibility?.[t]&&v==='none'?'selected':'')+'>'+({none:'SEM ACESSO',objective:'OBJETIVO',progress:'OBJETIVO + PROGRESSO'}[v])+'</option>').join('')+
 '</select><button class="btn" data-mo-action="prepVisibility" data-mo-mission="'+E(mission)+'" data-mo-prep="'+E(p.id)+'" data-mo-team="'+E(t)+'">SALVAR</button></div>').join(''):'')+
 ts.filter(t=>p.scope!=='exclusive'||p.ownerTeam===t).map(t=>{
  const st=r.teams?.[t]?.preps?.[p.id]||{},state=st.state||'available';
  return '<div class="dcxMOPRow"><b>'+E(teamName(t))+'</b><small>'+E(state.toUpperCase())+'</small>'+
   '<input name="obs_'+E(p.id)+'_'+E(t)+'" placeholder="Observação na devolução" value="'+E(st.observation||'')+'" maxlength="500"/>'+
   '<button class="btn" data-mo-action="prepConfirm" data-mo-mission="'+E(mission)+'" data-mo-prep="'+E(p.id)+'" data-mo-team="'+E(t)+'">✓</button>'+
   '<button class="btn" data-mo-action="prepReturn" data-mo-mission="'+E(mission)+'" data-mo-prep="'+E(p.id)+'" data-mo-team="'+E(t)+'">DEVOLVER</button>'+
   '<button class="btn" data-mo-action="prepReopen" data-mo-mission="'+E(mission)+'" data-mo-prep="'+E(p.id)+'" data-mo-team="'+E(t)+'">REABRIR</button></div>';
 }).join('')+
 '<details class="dcxMOPHistory"><summary>HISTÓRICO DE VERSÕES E AVALIAÇÕES</summary>'+
 (p.revisions||[]).map(h=>'<p>VERSÃO '+E(h.version)+' · '+E(h.title)+' — '+E(h.description)+'</p>').join('')+
 ts.map(t=>{const st=r.teams?.[t]?.preps?.[p.id];return st?.history?.length?'<p><b>'+E(teamName(t))+'</b>: '+st.history.map(h=>E(h.state)+' (v'+E(h.version)+')').join(' → ')+'</p>':''}).join('')+'</details></div>').join('')+'</div>'+
 '<div class="dcxMOPSection"><h3>DESFECHOS POR EQUIPE</h3>'+ts.map(t=>{
  const x=r.outcomes?.[t]||{};
  return '<div class="dcxMOPCard"><b>'+E(teamName(t))+'</b>'+
  '<label>RESULTADO<select name="outcome_'+E(t)+'">'+['','Sucesso','Sucesso parcial','Fracasso'].map(v=>'<option value="'+E(v)+'" '+(x.outcome===v?'selected':'')+'>'+E(v||'SEM RESULTADO')+'</option>').join('')+'</select></label>'+
  '<label>RELATÓRIO INTERNO<textarea name="internal_'+E(t)+'">'+E(x.internal||'')+'</textarea></label>'+
  '<label>VERSÃO DE DIVULGAÇÃO<textarea name="public_'+E(t)+'">'+E(x.publicText||'')+'</textarea></label>'+
  '<label><input name="published_'+E(t)+'" type="checkbox" '+(x.published?'checked':'')+'/> PUBLICAR PARA A EQUIPE</label>'+
  '<button class="btn" data-mo-action="saveOutcome" data-mo-mission="'+E(mission)+'" data-mo-team="'+E(t)+'">SALVAR DESFECHO</button></div>';
 }).join('')+'</div>'+
 '<div class="dcxMOPSection"><h3>DESFECHO GERAL (OPCIONAL)</h3>'+
 '<label>RESULTADO<select name="overallResult">'+['','Sucesso','Sucesso parcial','Fracasso'].map(v=>'<option value="'+E(v)+'" '+(r.general?.outcome===v?'selected':'')+'>'+E(v||'SEM RESULTADO')+'</option>').join('')+'</select></label>'+
 '<label>RELATÓRIO INTERNO<textarea name="overallInternal">'+E(r.general?.internal||'')+'</textarea></label>'+
 '<label>VERSÃO PÚBLICA PADRÃO<textarea name="overallPublic">'+E(r.general?.publicText||'')+'</textarea></label>'+
 ts.map(t=>'<label class="dcxMOPReportTeam"><input type="checkbox" data-mo-publish="'+E(t)+'" '+(r.general?.publishedTeams?.[t]?'checked':'')+'/> '+E(teamName(t))+
 '<textarea name="override_'+E(t)+'" placeholder="Personalização opcional para esta equipe">'+E(r.general?.overrides?.[t]||'')+'</textarea></label>').join('')+
 '<button class="btn gold" data-mo-action="saveGeneral" data-mo-mission="'+E(mission)+'">SALVAR E PUBLICAR PARA OS SELECIONADOS</button></div>'+
 '<div class="dcxMOPSection"><h3>AGENTES MULTIEQUIPE</h3><div class="dcxMOPRow">'+
 '<select name="grantPlayer">'+Object.entries(operators).filter(([k,v])=>v?.identity?.type!=='npc').map(([k,v])=>'<option value="'+E(k)+'">'+E(v.identity?.name||k)+'</option>').join('')+'</select>'+
 '<select name="grantTeam">'+teamIds().map(t=>'<option value="'+E(t)+'">'+E(teamName(t))+'</option>').join('')+'</select>'+
 '<label><input type="checkbox" name="grantFull"/> ACESSO À EQUIPE INTEIRA</label>'+ 
 '<select name="grantMode"><option value="active">PARTICIPAÇÃO ATIVA</option><option value="following">ACOMPANHAMENTO AO VIVO</option><option value="historical">HISTÓRICO CONGELADO</option></select>'+ 
 '<button class="btn" data-mo-action="grant" data-mo-mission="'+E(mission)+'">AUTORIZAR</button></div>'+
 Object.entries(data.grants||{}).flatMap(([player,g])=>Object.entries(g||{}).map(([t,v])=>({player,t,v}))).map(g=>
 '<div class="dcxMOPRow"><b>'+E(operators[g.player]?.identity?.name||g.player)+' · '+E(teamName(g.t))+'</b><small>'+(g.v.full?'EQUIPE INTEIRA':'MISSÕES SELECIONADAS')+' · '+E(g.v.mode||'active')+'</small>'+
 '<button class="btn" data-mo-action="revokeGrant" data-mo-player="'+E(g.player)+'" data-mo-team="'+E(g.t)+'">REVOGAR</button></div>').join('')+'</div>';
}
function bindingsPanel(){
 const names=Object.entries(requests||{}).filter(([k,v])=>v?.identity?.playerId);
 return '<div class="dcxMOPSection"><h3>VERIFICAÇÃO DE IDENTIDADE DO AGENTE</h3><p>Valide manualmente a correspondência entre a sessão autenticada (UID) e o operador antes de liberar dados de missões. NÃO autorize apenas pelo nome informado pelo jogador.</p>'+
 '<div class="dcxMOPRow"><select name="bindUid">'+names.map(([u,v])=>'<option value="'+E(u)+'">'+E(v.identity?.nickname||u)+' · UID '+E(u.slice(0,12))+'</option>').join('')+'</select>'+
 '<select name="bindPlayer">'+Object.entries(operators||{}).filter(([k,v])=>v?.identity?.type!=='npc').map(([k,v])=>'<option value="'+E(k)+'">'+E(v.identity?.name||k)+'</option>').join('')+'</select>'+
 '<button class="btn" data-mo-action="bind">AUTORIZAR VÍNCULO</button></div><small>Vínculos existentes: '+Object.keys(data.bindings||{}).length+'</small>'+Object.entries(data.bindings||{}).map(([u,b])=>'<div class="dcxMOPRow"><b>'+E(operators?.[b.playerId]?.identity?.name||b.playerId)+' / UID '+E(u.slice(0,12))+'</b><button class="btn" data-mo-action="revokeBinding" data-mo-uid="'+E(u)+'">REVOGAR VÍNCULO</button></div>').join('')+'</div>';
}
function renderHost(){
 if(!host)return;const root=form();if(!root)return;
 const selected=currentMission();
 const activeTab=document.querySelector('[data-mc-tab].active')?.dataset.mcTab||'evaluations';
 const current=selected&&op(selected);
 if(activeTab==='evaluations')root.innerHTML=hostEvaluations()+bindingsPanel();
 else if(current&&activeTab==='missions')root.innerHTML=hostDetail(selected)+bindingsPanel();
 else if(activeTab==='archive')root.innerHTML='<h3>ARQUIVO DE OPERAÇÕES</h3>'+
  catalog().filter(o=>record(o.id).archive).map(o=>'<div class="dcxMOPCard"><h3>'+E(o.title)+'</h3><p>Operação encerrada; histórico preservado na área administrativa.</p></div>').join('')+bindingsPanel();
 else root.innerHTML=bindingsPanel();
 if(error){const p=document.createElement('p');p.className='dcxMOPWarn';p.textContent=error;root.prepend(p);error=''}
}
function cleanup(){listeners.forEach(r=>{try{r.off()}catch(e){}});listeners=[];currentRoom='';toastBaseline=false}
function bind(){
 const r=room(),database=db(),user=uid();
 if(!database||!r||!user||rt()?.getMode?.()!=='firebase'||currentRoom===r&&lastAuth===user)return;
 cleanup();currentRoom=r;lastAuth=user;
 const watch=(route,fn)=>{
  const ref=database.ref('rooms/'+r+'/dcx/'+route);
  ref.on('value',s=>fn(s.val()||{}),e=>{console.warn('[DCX Mission Ops] '+route,e);error='ACESSO FIREBASE INDISPONÍVEL: '+route;renderHost()});
  listeners.push(ref);
 };
 if(host){
  watch('missionNotices/'+user,v=>updatePlayerNotice(v));
  watch('missionNoticeReads/'+user,v=>{reads=v;updateNotices()});
  watch('missionOps',v=>{data={...empty(),...v};renderHost();schedulePublish();syncPending().catch(e=>console.warn('[DCX Mission Ops] pendências',e))});
  watch('operators',v=>{operators=v;renderHost();schedulePublish()});
  watch('teams',v=>{teams=v;renderHost();schedulePublish()});
  let requestBaseline=false,knownRequests=new Set();
  const req=database.ref('rooms/'+r+'/requests');req.on('value',snap=>{
   requests=snap.val()||{};
   const updated=new Set(Object.entries(requests).flatMap(([owner,v])=>Object.entries(v?.missionActions||{}).filter(([,a])=>a?.type==='prepAdvanced').map(([key])=>owner+'_'+key)));
   if(requestBaseline){for(const key of updated){if(knownRequests.has(key))continue;
    database.ref('rooms/'+r+'/dcx/missionNotices/'+user+'/req_'+key).set({missionTitle:'CENTRAL DE MISSÕES',teamName:'AVALIAÇÃO',text:'Nova solicitação de preparação aguardando decisão.',createdAt:Date.now()}).catch(e=>console.warn(e))}}
   knownRequests=updated;requestBaseline=true;renderHost();schedulePublish();
   syncPending().catch(e=>console.warn('[DCX Mission Ops] fila coletiva',e));
  });listeners.push(req);
 }else{
  watch('missionViews/'+user,v=>{playerView=v;playerPanels();updateViewer()});
  watch('missionNotices/'+user,v=>updatePlayerNotice(v));
  watch('missionNoticeReads/'+user,v=>{reads=v;updateNotices()});
 }
 noticePanel();
}
function init(){
 playerPanels();
 window.OPH?.Realtime?.onState?.(()=>{bind();if(host){renderHost();schedulePublish()}});
 window.addEventListener('dcx:mission-control-render',()=>{if(host)renderHost()});
 bind();
}
window.DCX=window.DCX||{};
window.DCX.MissionOps={getView:()=>playerView,getPrivate:()=>host?data:null,makeView,feedFor,refresh:renderHost,getTeamState:(mission,t)=>record(mission).teams?.[t]?.state||'',getTeamChangedAt:(mission,t)=>record(mission).teams?.[t]?.changedAt||0,isArchived:mission=>!!record(mission).archive,syncAssignments};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();