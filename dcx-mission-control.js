/* DCX // Central Universal de Missoes - Etapa 1.
   Extensao nao destrutiva do Story Studio. O estado legado e preservado.
   Nota: missionControl vive no estado compartilhado da sala; nao armazene segredos aqui. */
(()=>{
 'use strict';
 const host=/\/keymaster\.html$/i.test(location.pathname);
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let legacyState={},control={},requests={},teams={},operators={},tab='evaluations',selected='',boundRoom='',liveRefs=[],ownPending={};
 const catalog=()=>window.DCX?.StoryStudio?.operations||[];
 function catalogPreps(op){
  const original=op?.preparations||[];
  if(op?.id!=='operacao-h')return original;
  const approach=legacyState?.approaches?.selected||'con';
  const legacy=(window.OPH?.PREP_DEFS?.[approach]||[]).map(([key,title,description])=>({id:'legacy:'+approach+':'+key,title,description,interaction:'request',legacyApproach:approach,legacyKey:key}));
  return [...original,...legacy];
 }
 function findPrep(op,prepId){
  if(!op)return null;
  const own=op.preparations?.find(p=>p.id===prepId);if(own)return own;
  if(op.id!=='operacao-h')return null;
  for(const [approach,defs] of Object.entries(window.OPH?.PREP_DEFS||{})){
   const row=(defs||[]).find(p=>'legacy:'+approach+':'+p[0]===prepId);
   if(row)return {id:prepId,title:row[1],description:row[2],interaction:'request',legacyApproach:approach,legacyKey:row[0]};
  }
  return null;
 }
 const room=()=>window.OPH?.Realtime?.getRoom?.()||'';
 const db=()=>window.OPH?.Realtime?.getFirebaseDatabase?.();
 const firebaseMode=()=>window.OPH?.Realtime?.getMode?.()==='firebase';
 const uid=()=>window.OPH?.Realtime?.getUid?.()||'';
 const teamEntries=()=>Object.entries(teams||{}).filter(([k,v])=>k!=='_init'&&v&&typeof v==='object').sort((a,b)=>String(a[1].name||a[0]).localeCompare(String(b[1].name||b[0]),'pt-BR'));
 const playerId=()=>window.DCX?.Player?.getLocalIdentity?.()?.playerId||'';
 const teamId=()=>String(operators?.[playerId()]?.narrative?.teamId||'');
 const assignment=id=>control?.assignments?.[id];
 function canSeeMission(id){
  const a=assignment(id);
  if(!a?.configured)return true; // Sem designacao explicita: compatibilidade com catalogos legados.
  const t=teamId();return !!(t&&a.teams?.[t]);
 }
 function isAssigned(id,t){
  const a=assignment(id);
  return !!t&&(!a?.configured||!!a.teams?.[t]);
 }
 function getStatus(missionId,team,prepId){
  const op=catalog().find(o=>o.id===missionId),p=findPrep(op,prepId);
  if(!p)return {state:'unknown',confirmed:false};
  const record=control?.progress?.[missionId]?.[team]?.[prepId];
  if(record?.state==='confirmed')return {state:'confirmed',confirmed:true,legacy:false,updatedAt:record.updatedAt};
  if(record?.state==='reopened')return {state:'available',confirmed:false,legacy:false};
  if(p.done||p.legacyApproach&&legacyState?.preps?.[p.legacyApproach]?.[p.legacyKey])return {state:'confirmed',confirmed:true,legacy:true};
  const pending=host?pendingTasks().some(a=>a.type==='prep'&&a.missionId===missionId&&a.value===prepId&&requestTeam(a)===team):
   Object.values(ownPending||{}).some(a=>a.type==='prep'&&a.missionId===missionId&&a.value===prepId&&a.teamId===team);
  return {state:pending?'analysis':'available',confirmed:false,legacy:false};
 }
 function canRequest(missionId,prepId){
  const t=teamId(),op=catalog().find(o=>o.id===missionId&&o.status==='published');
  const p=catalogPreps(op).find(p=>p.id===prepId);
  return !!(t&&op&&canSeeMission(missionId)&&isAssigned(missionId,t)&&p?.interaction==='request'&&!getStatus(missionId,t,prepId).confirmed&&!getStatus(missionId,t,prepId).state.includes('analysis'));
 }
 function pendingTasks(){
  return Object.entries(requests).flatMap(([owner,node])=>Object.entries(node?.missionActions||{}).map(([id,a])=>({...(a||{}),owner,id}))).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
 }
 function requestTeam(a){
  const player=requests?.[a.owner]?.identity?.playerId;
  return String(operators?.[player]?.narrative?.teamId||'');
 }
 function requestIsAuthorized(a){
  const t=requestTeam(a),op=catalog().find(v=>v.id===a.missionId),p=findPrep(op,a.value);
  return !!(a.type==='prep'&&t&&p?.interaction==='request'&&isAssigned(a.missionId,t)&&(!a.teamId||a.teamId===t));
 }
 function statusText(s){return s.confirmed?(s.legacy?'CONFIRMADA · LEGADO':'CONFIRMADA'):s.state==='analysis'?'EM ANÁLISE':'DISPONÍVEL'}
 function message(s){const node=$('dcxMissionControlStatus');if(node)node.textContent=s}
 async function commit(mutator){
  if(!host||!room()||!window.OPH?.Realtime?.getRoom?.())throw Error('Conecte o Keymaster à sala.');
  if(firebaseMode()){
   const ref=db().ref('rooms/'+room()+'/state/missionControl');
   const result=await ref.transaction(previous=>{
    const next=previous&&typeof previous==='object'?previous:{};
    return mutator(JSON.parse(JSON.stringify(next)))||next;
   },undefined,false);
   if(!result.committed)throw Error('A alteração não foi gravada.');
  }else{
   const next=mutator(JSON.parse(JSON.stringify(control||{})));
   await window.OPH.Realtime.patchState({missionControl:next});
   control=next;
  }
 }
 async function saveAssignments(missionId,teamIds){
  const op=catalog().find(v=>v.id===missionId);if(!op)return;
  await commit(next=>{
   next.assignments=next.assignments||{};
   next.assignments[missionId]={configured:true,teams:Object.fromEntries(teamIds.map(t=>[t,true])),updatedAt:Date.now()};
   return next;
  });
  message('EQUIPES DA OPERAÇÃO ATUALIZADAS.');
  render();
 }
 async function confirm(missionId,t,prepId,requestOwner){
  const op=catalog().find(v=>v.id===missionId),team=teams?.[t],p=findPrep(op,prepId);
  if(!op||!team||!p||!isAssigned(missionId,t))throw Error('Missão, equipe ou preparação não autorizada.');
  if(!confirmDialog('Confirmar "'+p.title+'" para '+(team.name||t)+'?'))return false;
  await commit(next=>{
   next.progress=next.progress||{};
   next.progress[missionId]=next.progress[missionId]||{};
   next.progress[missionId][t]=next.progress[missionId][t]||{};
   if(next.progress[missionId][t][prepId]?.state==='confirmed')return next;
   next.progress[missionId][t][prepId]={state:'confirmed',updatedAt:Date.now(),by:uid(),via:requestOwner?'solicitacao':'direta'};
   return next;
  });
  message('PREPARAÇÃO CONFIRMADA PARA '+(team.name||t)+'.');
  return true;
 }
 function confirmDialog(text){return window.confirm(text)}
 async function confirmFromRequest(owner,a){
  const current=requests?.[owner]?.missionActions;
  if(!current||!a||!requestIsAuthorized({...a,owner}))throw Error('Não foi possível identificar uma equipe autorizada. Atualize a identidade do operador antes de aprovar.');
  const t=requestTeam({...a,owner});
  const ok=await confirm(a.missionId,t,a.value,owner);
  if(!ok)return false;
  return true;
 }
 async function removeRequestsFor(missionId,t,prepId){
  if(!firebaseMode())return;
  const changes={};
  pendingTasks().forEach(a=>{
   if(a.type==='prep'&&a.missionId===missionId&&a.value===prepId&&requestTeam(a)===t)
    changes[a.owner+'/missionActions/'+a.id]=null;
  });
  if(Object.keys(changes).length)await db().ref('rooms/'+room()+'/requests').update(changes);
 }
 function inject(){
  if(!host||$('dcxMissionControl'))return;
  const view=document.querySelector('[data-km-view="missions"]');
  if(!view)return;
  const old=document.createElement('details');old.className='dcxMissionLegacyEditor';
  const summary=document.createElement('summary');summary.textContent='CRIADOR DE MISSÕES E FERRAMENTAS EXISTENTES';
  old.append(summary);
  while(view.firstChild)old.append(view.firstChild);
  const board=document.createElement('section');board.id='dcxMissionControl';board.className='dcxMissionControl';board.setAttribute('aria-label','Central Universal de Missões');
  board.innerHTML='<header class="dcxMCHead"><div><small>DCX // KEYMASTER // CONTROLE OPERACIONAL</small><h2>CENTRAL DE MISSÕES</h2><p>Avalie solicitações, acompanhe equipes e confirme preparações sem alterar o conteúdo original das operações.</p></div></header><div class="dcxMCTabs" role="tablist"><button data-mc-tab="evaluations" type="button">AVALIAÇÕES</button><button data-mc-tab="missions" type="button">MISSÕES</button><button data-mc-tab="archive" type="button">ARQUIVO</button></div><div id="dcxMissionControlBody"></div><p id="dcxMissionControlStatus" class="dcxMCStatus" role="status" aria-live="polite"></p>';
  view.append(board,old);
  board.addEventListener('click',async e=>{
   const nav=e.target.closest('[data-mc-tab]');
   if(nav){tab=nav.dataset.mcTab;render();return}
   const open=e.target.closest('[data-mc-open]');
   if(open){selected=open.dataset.mcOpen;tab='missions';render();return}
   const back=e.target.closest('[data-mc-back]');
   if(back){selected='';render();return}
   const save=e.target.closest('[data-mc-save]');
   if(save){const checks=[...board.querySelectorAll('[data-mc-team]:checked')].map(i=>i.dataset.mcTeam);try{save.disabled=true;await saveAssignments(selected,checks)}catch(err){message('ERRO AO DESIGNAR EQUIPES: '+err.message)}finally{save.disabled=false}return}
   const approve=e.target.closest('[data-mc-confirm]');
   if(approve){
    const key=[approve.dataset.mcMission,approve.dataset.mcTeamId,approve.dataset.mcConfirm];
    try{
     approve.disabled=true;
     if(await confirm(...key)){await removeRequestsFor(...key);render()}
    }catch(err){message('ERRO NA CONFIRMAÇÃO: '+err.message)}finally{approve.disabled=false}
    return;
   }
   const resolve=e.target.closest('[data-mc-resolve]');
   if(resolve){
    const req=requests?.[resolve.dataset.mcOwner]?.missionActions?.[resolve.dataset.mcResolve];
    if(!req)return;
    const a={...req,owner:resolve.dataset.mcOwner};
    if(!requestIsAuthorized(a)){message('SOLICITAÇÃO SEM EQUIPE VÁLIDA OU SEM AUTORIZAÇÃO.');return}
    try{
     resolve.disabled=true;
     const t=requestTeam(a);
     if(await confirm(a.missionId,t,a.value,resolve.dataset.mcOwner)){
      await removeRequestsFor(a.missionId,t,a.value);render();
     }
    }catch(err){message('ERRO AO AVALIAR: '+err.message)}finally{resolve.disabled=false}
    return;
   }
  });
 }
 function renderEvaluations(){
  const list=pendingTasks().filter(a=>a.type==='prep');
  if(!list.length)return '<p class="dcxMCEmpty">Nenhuma preparação aguardando avaliação. Escolhas narrativas continuam no editor original, abaixo.</p>';
  return '<div class="dcxMCList">'+list.map(a=>{
   const op=catalog().find(o=>o.id===a.missionId),p=findPrep(op,a.value);
   const t=requestTeam(a),name=teams?.[t]?.name,valid=requestIsAuthorized(a);
   const status=valid?getStatus(a.missionId,t,a.value):null;
   return '<article class="dcxMCCard"><small>'+esc(op?.title||a.missionTitle||'MISSÃO')+' · '+esc(name||'EQUIPE NÃO IDENTIFICADA')+'</small><h3>'+esc(p?.title||'PREPARAÇÃO NÃO ENCONTRADA')+'</h3><p>Solicitação de um integrante da equipe.</p>'+
    (valid&&!status.confirmed?'<button class="btn gold" data-mc-owner="'+esc(a.owner)+'" data-mc-resolve="'+esc(a.id)+'">CONFIRMAR PARA A EQUIPE</button>':status?.confirmed?'<span class="dcxMCPill">JÁ CONFIRMADA · DISPENSAR NO EDITOR</span>':'<span class="dcxMCPill warn">CONFERIR IDENTIDADE / DESIGNAÇÃO NO EDITOR</span>')+
    '</article>';
  }).join('')+'</div>';
 }
 function renderMissionDetail(op){
  const assigned=assignment(op.id),all=teamEntries();
  return '<button class="btn" data-mc-back="1" type="button">← TODAS AS MISSÕES</button>'+
   '<div class="dcxMCHead"><div><small>'+esc(op.code||'MISSÃO')+'</small><h2>'+esc(op.title)+'</h2><p>'+esc(op.summary||'')+'</p></div></div>'+
   '<section class="dcxMCSection"><h3>EQUIPES DESIGNADAS</h3><p>Selecione quem participa. Sem designação salva, a missão mantém a visibilidade legada da sala até ser configurada.</p>'+
   '<div class="dcxMCTeamCheck">'+all.map(([id,t])=>'<label><input type="checkbox" data-mc-team="'+esc(id)+'" '+(assigned?.teams?.[id]?'checked':'')+'> '+esc(t.name||id)+'</label>').join('')+'</div>'+
   '<button class="btn gold" type="button" data-mc-save="1">SALVAR EQUIPES</button>'+
   (!assigned?.configured?'<p class="dcxMCWarning">MODO LEGADO: esta operação ainda não possui equipes designadas no controle universal.</p>':'')+
   '</section><section class="dcxMCSection"><h3>PREPARAÇÕES POR EQUIPE</h3>'+
   (all.filter(([id])=>isAssigned(op.id,id)).map(([id,t])=>
     '<div class="dcxMCTeamBlock"><h4>'+esc(t.name||id)+'</h4>'+
     (catalogPreps(op).length?catalogPreps(op).map(p=>{
       const s=getStatus(op.id,id,p.id);
       return '<div class="dcxMCPrep"><div><b>'+esc(p.title)+'</b><small>'+esc(statusText(s))+'</small></div>'+
       (!s.confirmed?'<button class="btn" type="button" data-mc-confirm="'+esc(p.id)+'" data-mc-mission="'+esc(op.id)+'" data-mc-team-id="'+esc(id)+'">CONFIRMAR</button>':'<span class="dcxMCPill">✓</span>')+'</div>';
     }).join(''):'<p class="dcxMCEmpty">Nenhuma preparação no Criador de Missões.</p>')+
     '</div>').join('')||'<p class="dcxMCEmpty">Cadastre equipes em EQUIPES // STATUS e faça a designação acima.</p>')+
   '</section>';
 }
 function renderMissions(archive){
  const list=catalog().filter(o=>(archive?o.status==='archived':o.status!=='archived'));
  if(archive)return '<p class="dcxMCEmpty">O arquivamento de missões será habilitado na Etapa 2. Nenhum registro existente foi removido.</p>';
  if(selected){const op=list.find(o=>o.id===selected);if(op)return renderMissionDetail(op);selected=''}
  return '<div class="dcxMCList">'+list.map(op=>{
   const a=assignment(op.id),count=Object.keys(a?.teams||{}).length;
   return '<article class="dcxMCCard"><small>'+esc(op.code||'DCX')+' · '+(op.status==='draft'?'RASCUNHO':'PUBLICADA')+'</small>'+
    '<h3>'+esc(op.title)+'</h3><p>'+esc(op.summary||'Sem descrição.')+'</p>'+
    '<div class="dcxMCMeta">'+(a?.configured?count+' equipe(s) designada(s)':'DESIGNAÇÃO LEGADA')+' · '+catalogPreps(op).length+' preparações</div>'+
    '<button class="btn" type="button" data-mc-open="'+esc(op.id)+'">ABRIR CONTROLE</button></article>';
  }).join('')+'</div>';
 }
 function render(){
  if(!host)return;
  inject();const root=$('dcxMissionControl'),body=$('dcxMissionControlBody');
  if(!root||!body)return;
  root.querySelectorAll('[data-mc-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.mcTab===tab);b.setAttribute('aria-selected',String(b.dataset.mcTab===tab))});
  body.innerHTML=tab==='evaluations'?renderEvaluations():tab==='archive'?renderMissions(true):renderMissions(false);
 }
 function setupListeners(){
  const r=room(),database=db();
  if(!firebaseMode()||!r||!database||r===boundRoom)return;
  liveRefs.forEach(ref=>{try{ref.off()}catch(e){}});
  liveRefs=[];boundRoom=r;teams={};operators={};ownPending={};
  const root='rooms/'+r+'/dcx/';
  [['teams',v=>{teams=v||{};render();}],['operators',v=>{operators=v||{};render();window.DCX?.StoryStudio?.refreshPlayer?.();window.OPHPlayer?.refreshPreps?.();}]].forEach(([p,cb])=>{
   const ref=database.ref(root+p);
   ref.on('value',snap=>cb(snap.val()||{}),err=>console.warn('[DCX Mission Control] '+p,err));
   liveRefs.push(ref);
  });
  if(!host&&uid()){
   const ref=database.ref('rooms/'+r+'/requests/'+uid()+'/missionActions');
   ref.on('value',snap=>{ownPending=snap.val()||{};window.DCX?.StoryStudio?.refreshPlayer?.();window.OPHPlayer?.refreshPreps?.();},err=>console.warn('[DCX Mission Control] solicitações',err));
   liveRefs.push(ref);
  }
 }
 function init(){
  if(host)inject();
  window.OPH?.Realtime?.onState?.(state=>{
   legacyState=state||{};
   control=state?.missionControl&&typeof state.missionControl==='object'?state.missionControl:{};
   setupListeners();render();
   if(!host){window.DCX?.StoryStudio?.refreshPlayer?.();window.OPHPlayer?.refreshPreps?.();window.DCX?.MissionBuilder?.refreshOpenModule?.()}
  });
  if(host)window.OPH?.Realtime?.onRequests?.(r=>{requests=r||{};render()});
  render();
 }
 window.DCX=window.DCX||{};
 window.DCX.MissionControl={canSeeMission,getStatus,canRequest,getTeamId:teamId,isAssigned,confirmFromRequest,refreshPlayer(){if(!host){window.DCX?.StoryStudio?.refreshPlayer?.();window.OPHPlayer?.refreshPreps?.()}}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();