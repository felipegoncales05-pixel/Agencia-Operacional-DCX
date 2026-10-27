/* DCX OS // RANK DA DCX v1
   Two Keymaster-managed lists bound to existing teams/operators.
   Stores only stable IDs at rooms/{room}/dcx/meta/rankings.
   Existing Firebase rules on dcx/meta: read authenticated, write Keymaster UID.
*/
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname);
const KINDS={divisions:'RANK DE DIVISÕES',individual:'RANK INDIVIDUAL'};
const TYPES={player:'JOGADOR',npc:'NPC'};
const $=id=>document.getElementById(id);
const dom=(tag,cls,text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);return e;
};
const button=(title,handler,cls='')=>{
 const e=dom('button','dcxRankBtn '+cls,title);
 e.type='button';e.addEventListener('click',handler);return e;
};
let room='',uid='',db=null,refs=[],connected=false;
let ranks={divisions:[],individual:[]},teams={},operators={};
let currentKind='divisions',pending=false,feedback='AGUARDANDO CONEXÃO COM O FIREBASE';
let listenerError='';
let adminRoot=null,playerDialog=null,playerTrigger=null,updateTimer=null;
const roomSafe=v=>String(v||'FRIA-01').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24)||'FRIA-01';
function account(){
 const rt=window.OPH?.Realtime;
 let auth=rt?.getFirebaseAuth?.(),database=rt?.getFirebaseDatabase?.();
 if((!auth?.currentUser||!database)&&window.firebase){
  try{
   const app=window.firebase.app(HOST?'OPH_KEYMASTER':'OPH_PLAYER');
   auth=app.auth();database=app.database();
  }catch{}
 }
 if(!auth?.currentUser?.uid||!database)return null;
 const r=rt?.getRoom?.()||new URLSearchParams(location.search).get('room')||
   window.OPH_CONFIG?.defaultRoom||'FRIA-01';
 return {uid:auth.currentUser.uid,db:database,room:roomSafe(r)};
}
function unwatch(){
 refs.forEach(r=>{try{r.off('value')}catch(e){console.warn('[DCX RANK] cleanup',e)}});
 refs=[];
}
function cleanIds(value){
 const a=Array.isArray(value)?value:
  value&&typeof value==='object'?Object.keys(value).sort((x,y)=>Number(x)-Number(y)).map(k=>value[k]):[];
 return [...new Set(a.filter(v=>typeof v==='string'&&v.length>0&&v.length<=140))].slice(0,150);
}
function getRoster(kind){
 const source=kind==='divisions'?teams:operators;
 return Object.entries(source||{})
   .filter(([id,node])=>id!=='_init'&&node&&typeof node==='object')
   .map(([id,item])=>{
    if(kind==='divisions')return {id,name:String(item.name||id).slice(0,110),sub:String(item.code||'DIVISÃO DCX').slice(0,75),symbol:String(item.symbol||'◆'),type:'division'};
    const type=item.identity?.type||(id.startsWith('NPC-')?'npc':'player');
    if(type!=='player'&&type!=='npc')return null;
    const teamName=teams[item.narrative?.teamId]?.name||'SEM DIVISÃO';
    return {id,name:String(item.identity?.name||item.name||id).slice(0,110),
      sub:(type==='npc'?'NPC':'JOGADOR')+' // '+teamName,
      symbol:type==='npc'?'◇':'◈',type};
   }).filter(Boolean)
   .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
function ensureConnected(){
 const c=account();
 if(!c){
  if(connected){unwatch();connected=false;db=null;uid='';room='';ranks={divisions:[],individual:[]};teams={};operators={};}
  listenerError='';feedback='CONECTE-SE À SALA PELO FIREBASE PARA VISUALIZAR O RANK';
  render();return;
 }
 const key=c.room+'|'+c.uid+'|'+(HOST?'keymaster':'player');
 if(connected&&room+'|'+uid+'|'+(HOST?'keymaster':'player')===key)return;
 unwatch();connected=true;room=c.room;uid=c.uid;db=c.db;
 ranks={divisions:[],individual:[]};teams={};operators={};
 listenerError='';feedback='SINCRONIZANDO RANKS // SALA '+room;
 const root='rooms/'+room+'/dcx';
 function subscribe(suffix,fn){
  const ref=db.ref(root+'/'+suffix);
  ref.on('value',snap=>{fn(snap.val());listenerError='';render()},err=>{
   listenerError='ACESSO NEGADO EM '+suffix+' // '+(err?.code||err?.message||'ERRO');
   render();
  });
  refs.push(ref);
 }
 subscribe('teams',value=>{teams=value||{}});
 subscribe('operators',value=>{operators=value||{}});
 subscribe('meta/rankings',value=>{
  ranks={
   divisions:cleanIds(value?.divisions),
   individual:cleanIds(value?.individual)
  };
  feedback='RANKINGS SINCRONIZADOS // '+room;
 });
 render();
}
function selectKind(kind){
 if(!(kind in KINDS))return;
 currentKind=kind;render();
}
async function persist(kind,ids){
 if(!HOST||!connected||!db||pending){
  feedback='KEYMASTER PRECISA ESTAR AUTENTICADO NO FIREBASE';render();return;
 }
 if(!(kind in KINDS))return;
 const roster=new Set(getRoster(kind).map(e=>e.id));
 const next=[...new Set(ids)].filter(id=>roster.has(id)).slice(0,150);
 pending=true;feedback='PUBLICANDO CLASSIFICAÇÃO...';render();
 try{
  await db.ref('rooms/'+room+'/dcx/meta/rankings/'+kind).set(next);
  ranks[kind]=next;
  feedback='RANK ATUALIZADO PARA TODOS OS JOGADORES';
 }catch(error){
  feedback=/permission.?denied/i.test(String(error?.code||'')+' '+String(error?.message||''))?
   'FIREBASE NEGOU A EDIÇÃO. VERIFIQUE O UID DO KEYMASTER NAS REGRAS DE dcx/meta.':
   'ERRO AO PUBLICAR RANK: '+String(error?.message||error);
  console.error('[DCX RANK] publish failed',error);
 }finally{pending=false;render()}
}
function manage(kind,action,id){
 const listed=ranks[kind]||[],index=listed.indexOf(id);
 if(action==='add'&&index<0)persist(kind,[...listed,id]);
 else if(action==='remove'&&index>=0)persist(kind,listed.filter(k=>k!==id));
 else if(action==='up'&&index>0){
  const copy=[...listed];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];persist(kind,copy)
 }else if(action==='down'&&index>=0&&index<listed.length-1){
  const copy=[...listed];[copy[index+1],copy[index]]=[copy[index],copy[index+1]];persist(kind,copy)
 }
}
function addTabRow(container){
 const tabs=dom('div','dcxRankTabs');tabs.setAttribute('role','tablist');
 for(const [id,title] of Object.entries(KINDS)){
  const el=button(title,()=>selectKind(id),'dcxRankTab'+(currentKind===id?' active':''));
  el.setAttribute('role','tab');el.setAttribute('aria-selected',String(currentKind===id));
  tabs.append(el);
 }
 container.append(tabs);
}
function ranked(kind){
 const roster=new Map(getRoster(kind).map(x=>[x.id,x]));
 return cleanIds(ranks[kind]).map(id=>roster.get(id)).filter(Boolean);
}
function renderList(target,kind){
 const entries=ranked(kind);
 if(!entries.length){
  const empty=dom('div','dcxRankEmpty');
  empty.append(dom('strong','','NENHUMA CLASSIFICAÇÃO PUBLICADA'),
   dom('p','','O Keymaster pode escolher '+(kind==='divisions'?'equipes':'jogadores e NPCs')+' e definir a ordem. Os itens aparecem aqui em tempo real.'));
  target.append(empty);return;
 }
 const list=dom('ol','dcxRankList');
 entries.forEach((item,i)=>{
  const li=dom('li','dcxRankItem'+(i<3?' dcxRankTop':''));
  const number=dom('span','dcxRankPosition',String(i+1).padStart(2,'0'));
  const emblem=dom('span','dcxRankEmblem',kind==='divisions'?'▦':item.symbol);
  const details=dom('div','dcxRankEntry');
  details.append(dom('strong','',item.name),dom('small','',item.sub));
  li.append(number,emblem,details);
  if(i===0)li.append(dom('span','dcxRankWinner','★ LÍDER'));
  if(HOST){
   const actions=dom('div','dcxRankRowActions');
   const up=button('↑',()=>manage(kind,'up',item.id),'dcxRankMove');
   const down=button('↓',()=>manage(kind,'down',item.id),'dcxRankMove');
   const remove=button('×',()=>manage(kind,'remove',item.id),'dcxRankRemove');
   up.title='Subir no rank';down.title='Descer no rank';remove.title='Retirar do rank';
   up.disabled=pending||i===0;down.disabled=pending||i===entries.length-1;remove.disabled=pending;
   actions.append(up,down,remove);li.append(actions);
  }
  list.append(li);
 });
 target.append(list);
}
function renderAdd(target,kind){
 const rankedIds=new Set(ranks[kind]||[]);
 const candidates=getRoster(kind).filter(x=>!rankedIds.has(x.id));
 const add=dom('div','dcxRankAdd');
 const field=dom('label','dcxRankPicker');
 field.append(dom('span','','ADICIONAR '+(kind==='divisions'?'EQUIPE':'JOGADOR / NPC')));
 const select=dom('select','dcxRankSelect');
 const placeholder=dom('option','','SELECIONE UM CADASTRO');placeholder.value='';
 select.append(placeholder);
 candidates.forEach(item=>{
  const option=dom('option','',item.name+' // '+item.sub);
  option.value=item.id;select.append(option);
 });
 const publish=button('+ INSERIR NO RANK',()=>{
  const id=select.value;if(id)manage(kind,'add',id)
 },'dcxRankAddButton');
 publish.disabled=pending||!candidates.length;
 if(!candidates.length)placeholder.textContent='TODOS JÁ CLASSIFICADOS / CADASTRO VAZIO';
 field.append(select);add.append(field,publish);target.append(add);
}
function render(){
 const bodies=[$('dcxRankAdminBody'),$('dcxRankPlayerBody')].filter(Boolean);
 for(const body of bodies){
  body.replaceChildren();
  const isAdmin=body.id==='dcxRankAdminBody';
  const subtitle=dom('p','dcxRankSubtitle',
   isAdmin?'O Keymaster define quem entra e a posição de cada participante.':
    'Classificação oficial das equipes e dos operadores da DCX.');
  body.append(subtitle);addTabRow(body);
  const content=dom('div','dcxRankContent');
  if(isAdmin&&HOST)renderAdd(content,currentKind);
  renderList(content,currentKind);
  body.append(content);
  const status=dom('p','dcxRankStatus',listenerError||feedback);
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  status.dataset.error=listenerError||/ERRO|NEGOU|CONECTE/i.test(feedback)?'true':'false';
  body.append(status);
 }
}
function openPlayer(){
 if(!playerDialog)return;
 playerDialog.hidden=false;playerDialog.classList.add('is-open');
 document.body.classList.add('dcxRankOpen');
 render();
 playerDialog.querySelector('.dcxRankClose')?.focus();
}
function closePlayer(){
 if(!playerDialog)return;
 playerDialog.hidden=true;playerDialog.classList.remove('is-open');
 document.body.classList.remove('dcxRankOpen');
 playerTrigger?.focus();
}
function setupPlayer(){
 const tools=document.querySelector('.dcxFieldSidebarTools');if(!tools||$('dcxOpenRank'))return;
 playerTrigger=dom('button','dcxFieldTool dcxModuleCard live');
 playerTrigger.id='dcxOpenRank';playerTrigger.type='button';
 playerTrigger.append(dom('span','dcxModuleIcon','★'));
 const label=dom('div');label.append(dom('b','','RANK DA DCX'),dom('small','','DIVISÕES // INDIVIDUAL'));
 playerTrigger.append(label);
 const config=$('dcxOpenSettings');config?.before(playerTrigger);if(!config)tools.append(playerTrigger);
 playerTrigger.addEventListener('click',openPlayer);
 playerDialog=dom('div','dcxRankOverlay');playerDialog.id='dcxRankDialog';playerDialog.hidden=true;
 const backdrop=dom('button','dcxRankBackdrop');
 backdrop.type='button';backdrop.setAttribute('aria-label','Fechar ranking');backdrop.addEventListener('click',closePlayer);
 const panel=dom('section','dcxRankDialogPanel');
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-label','Rank da DCX');
 const head=dom('header','dcxRankHead');
 const title=dom('div');
 title.append(dom('small','','DCX // CLASSIFICAÇÃO OPERACIONAL'),dom('h2','','RANK DA DCX'));
 head.append(title,button('× FECHAR',closePlayer,'dcxRankClose'));
 const body=dom('div','dcxRankBody');body.id='dcxRankPlayerBody';
 panel.append(head,body);playerDialog.append(backdrop,panel);
 document.body.append(playerDialog);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!playerDialog.hidden)closePlayer()});
}
function setupHost(){
 const tabs=$('kmWorkspaceTabs'),consoleEl=$('console');
 if(!tabs||!consoleEl||$('dcxRankAdminTab'))return;
 const nav=dom('button','kmWorkspaceTab','RANK DA DCX');
 nav.type='button';nav.dataset.tab='rankings';nav.id='dcxRankAdminTab';
 const teamsTab=tabs.querySelector('[data-tab="teams"]');
 teamsTab?.after(nav);if(!teamsTab)tabs.append(nav);
 adminRoot=dom('section','kmWorkspaceView dcxRankAdminView');
 adminRoot.dataset.kmView='rankings';
 adminRoot.id='dcxRankAdminView';
 const panel=dom('div','dcxPanel dcxRankAdminPanel');
 const head=dom('header','dcxRankHead');
 const title=dom('div');
 title.append(dom('small','','DCX // KEYMASTER // CONTROLE DE CLASSIFICAÇÃO'),
  dom('h2','','RANK DA DCX'));
 head.append(title,dom('span','dcxRankMasterBadge','EDIÇÃO EXCLUSIVA DO KEYMASTER'));
 const body=dom('div','dcxRankBody');body.id='dcxRankAdminBody';
 panel.append(head,body);adminRoot.append(panel);
 const previous=consoleEl.querySelector('[data-km-view="teams"]');
 previous?.after(adminRoot);if(!previous)consoleEl.append(adminRoot);
 // Admin binder and Visual Command will see the new tab/view on DOMContentLoaded.
}
function boot(){
 if(HOST)setupHost();else setupPlayer();
 ensureConnected();
 updateTimer=setInterval(ensureConnected,1600);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureConnected()});
 render();
}
window.DCX=window.DCX||{};
window.DCX.Ranks={selectKind,refresh:ensureConnected,getRank:kind=>ranked(kind),getState:()=>({room,connected,ranks})};
// Scripts load at the bottom of each page, so insert navigation immediately.
// Other modules bind navigation on DOMContentLoaded after this insertion.
boot();
})();