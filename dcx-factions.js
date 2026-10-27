/* DCX // FACTIONS: authority ordered registry, public/private roster separation.
   Public: rooms/{room}/dcx/meta/factions
   Keymaster only: rooms/{room}/dcx/factionSecrets
   Does not copy hidden member sheets to any player-readable path. */
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname);
// Type describes legal status; category describes institutional structure.
const TYPES=['Legal','Ilegal','Desconhecido'];
const CATEGORIES=['Pública','Privada','Familiar'];
const typeOf=f=>TYPES.includes(f?.type)?f.type:'Desconhecido';
const categoryOf=f=>{
 if(CATEGORIES.includes(f?.category))return f.category;
 // Read legacy factions without mutating Firebase automatically.
 return CATEGORIES.includes(f?.type)?f.type:'';
};
const typeClass=f=>typeOf(f).toLowerCase();
const categoryLabel=f=>categoryOf(f)||'NÃO DEFINIDA';
const SYMBOLS=[
 ['hex','⬡','HEXÁGONO'],['sun','☀','SOL'],['moon','☾','LUA'],['star','✦','ESTRELA'],
 ['crown','♛','COROA'],['diamond','◆','DIAMANTE'],['shield','⛨','ESCUDO'],['bolt','ϟ','RAIO'],
 ['eye','◉','OLHO'],['gear','⚙','ENGRENAGEM'],['spade','♠','ESPADA'],['flame','♨','CHAMA'],
 ['anchor','⚓','ÂNCORA'],['leaf','❧','FOLHA'],['cross','✚','CRUZ'],['trident','Ψ','TRIDENTE'],
 ['flower','✿','FLOR'],['circle','◎','CÍRCULO'],['comet','☄','COMETA'],['triangle','△','TRIÂNGULO']
];
const ICONS=Object.fromEntries(SYMBOLS.map(s=>[s[0],s]));
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(txt!==undefined)v.textContent=String(txt);return v};
const btn=(label,fn,cls='')=>{const b=el('button','dcxFactionButton '+cls,label);b.type='button';b.addEventListener('click',fn);return b};
const input=(label,value='',max=100)=>{
 const wrapper=el('label','dcxFactionField');wrapper.append(el('span','',label));
 const node=el('input');node.type='text';node.maxLength=max;node.value=String(value||'');
 wrapper.append(node);return {wrap:wrapper,node};
};
const area=(label,value='',max=2500)=>{
 const f=input(label,value,max),a=el('textarea');a.rows=3;a.maxLength=max;a.value=String(value||'');
 f.node.replaceWith(a);f.node=a;return f;
};
const select=(label,options,value)=>{
 const f=input(label);const s=el('select');
 options.forEach(([key,name])=>{const o=el('option','',name);o.value=key;s.append(o)});
 s.value=String(value||options[0]?.[0]||'');
 f.node.replaceWith(s);f.node=s;return f;
};
const safeText=(v,max=400)=>String(v||'').trim().slice(0,max);
const safeURL=v=>{const x=safeText(v,1000);try{return /^https:$/.test(new URL(x).protocol)?x:''}catch{return''}};
const int=(v,max=100)=>Math.max(0,Math.min(max,Math.round(Number(v)||0)));
const defaultFaction=()=>({title:'NOVA FACÇÃO',type:'Desconhecido',category:'',symbol:'hex',authority:0,hostility:0,
 description:'',image:'',membersPublic:false,memberCount:0,members:{}});
let room='',uid='',db=null,connected=false,publicRef=null,secretRef=null;
let factions={},secrets={},secretReady=false,secretError='',pending=false,feedback='AGUARDANDO SESSÃO';
let selection='',editor='';let refreshTimer;
const validRoom=v=>String(v||'FRIA-01').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,25)||'FRIA-01';
function session(){
 const r=window.OPH?.Realtime;
 let auth=r?.getFirebaseAuth?.(),database=r?.getFirebaseDatabase?.();
 if((!auth?.currentUser?.uid||!database)&&window.firebase){
  try{const app=firebase.app(HOST?'OPH_KEYMASTER':'OPH_PLAYER');auth=app.auth();database=app.database()}catch{}
 }
 if(!auth?.currentUser?.uid||!database)return null;
 return {uid:auth.currentUser.uid,db:database,
  room:validRoom(r?.getRoom?.()||new URLSearchParams(location.search).get('room')||localStorage.getItem('oph-room')||window.OPH_CONFIG?.defaultRoom)};
}
function unsubscribe(){
 if(publicRef){publicRef.off('value');publicRef=null}
 if(secretRef){secretRef.off('value');secretRef=null}
}
function connect(){
 const s=session();
 if(!s){
  if(connected){unsubscribe();connected=false;factions={};secrets={};selection='';}
  feedback='CONECTE-SE AO FIREBASE PARA ABRIR OS ARQUIVOS DE FACÇÕES';render();return;
 }
 if(connected&&room===s.room&&uid===s.uid)return;
 unsubscribe();room=s.room;uid=s.uid;db=s.db;connected=true;
 factions={};secrets={};selection='';secretReady=false;secretError='';
 feedback='SINCRONIZANDO FACÇÕES // '+room;
 publicRef=db.ref('rooms/'+room+'/dcx/meta/factions');
 publicRef.on('value',snapshot=>{
  factions=snapshot.val()||{};
  if(selection&&!factions[selection])selection='';
  if(!selection)selection=sorted()[0]?.id||'';
  render();
 },error=>{feedback='FALHA NA LEITURA DAS FACÇÕES: '+(error?.code||error?.message);render()});
 if(HOST){
  secretRef=db.ref('rooms/'+room+'/dcx/factionSecrets');
  secretRef.on('value',snapshot=>{
   secrets=snapshot.val()||{};secretReady=true;secretError='';render()
  },error=>{
   secretReady=false;secretError='AS FICHAS PRIVADAS PRECISAM DE REGRAS EXCLUSIVAS DO KEYMASTER NO FIREBASE: '+(error?.code||error?.message);
   render();
  });
 }
 render();
}
function sorted(){
 return Object.entries(factions||{}).filter(([id,f])=>f&&typeof f==='object'&&id!=='_init')
 .map(([id,f])=>({id,...f}))
 .sort((a,b)=>int(b.authority)-int(a.authority)||String(a.title||'').localeCompare(String(b.title||''),'pt-BR'));
}
function emblem(f){return ICONS[f?.symbol]?.[1]||'⬡'}
function privateRoster(id){
 const group=secrets?.[id]?.members;
 return group&&typeof group==='object'?group:{};
}
function visibleRoster(f){
 if(HOST)return privateRoster(f.id);
 if(!f.membersPublic)return {};
 return f.members&&typeof f.members==='object'?f.members:{};
}
function memberData(o){
 return {name:safeText(o.name,100),codename:safeText(o.codename,90),
 role:safeText(o.role,95),age:safeText(o.age,30),
 description:safeText(o.description,2400),abilities:safeText(o.abilities,1500),
 image:safeURL(o.image),updatedAt:Date.now()};
}
function sanitize(f,roster){
 const result={title:safeText(f.title,100)||'FACÇÃO SEM NOME',
  type:typeOf(f),category:categoryOf(f),symbol:ICONS[f.symbol]?f.symbol:'hex',
  authority:int(f.authority),hostility:int(f.hostility,5),
  description:safeText(f.description,3500),image:safeURL(f.image),
  membersPublic:!!f.membersPublic,
  memberCount:Object.keys(roster||{}).length,updatedAt:Date.now()};
 if(result.membersPublic){
  result.members=Object.fromEntries(Object.entries(roster||{}).map(([id,m])=>[id,memberData(m)]));
 }
 return result;
}
function current(){return sorted().find(f=>f.id===selection)}
function stars(v){const n=int(v,5);return '★'.repeat(n)+'☆'.repeat(5-n)}
async function updatePublic(id,f,roster){
 if(!HOST||!connected)throw Error('Apenas o Keymaster pode publicar.');
 await db.ref('rooms/'+room+'/dcx/meta/factions/'+id).set(sanitize(f,roster));
}
async function saveFaction(values){
 if(!HOST||pending||!connected)return;
 const record=current(),id=record?.id||db.ref('rooms/'+room+'/dcx/meta/factions').push().key;
 const changingVisibility=!!record&&!!values.membersPublic!==!!record.membersPublic;
 if(changingVisibility&&!secretReady){
  feedback='PARA ALTERAR A VISIBILIDADE DAS FICHAS, O ARQUIVO PRIVADO PRECISA ESTAR AUTORIZADO NO FIREBASE.';
  renderStatus();return;
 }
 pending=true;feedback='SALVANDO FACÇÃO...';renderStatus();
 try{
  if(!record){
   await db.ref('rooms/'+room+'/dcx/meta/factions/'+id).set(sanitize(values,{}));
  }else if(changingVisibility){
   // Full overwrite only after private roster has loaded.
   await updatePublic(id,values,privateRoster(id));
  }else{
   // Preserve published member data even when private rules are unavailable.
   const patch=sanitize(values,{});
   delete patch.members;delete patch.memberCount;delete patch.membersPublic;
   await db.ref('rooms/'+room+'/dcx/meta/factions/'+id).update(patch);
  }
  selection=id;editor='';feedback='FACÇÃO SALVA COM SUCESSO.';
 }catch(e){feedback='ERRO AO SALVAR FACÇÃO: '+(e?.code||e?.message);console.error(e)}
 finally{pending=false;render()}
}
async function deleteFaction(){
 const f=current();if(!HOST||!f||pending||!connected)return;
 if(!confirm('Excluir a facção '+f.title+'? Esta ação não pode ser desfeita.'))return;
 pending=true;feedback='EXCLUINDO FACÇÃO...';renderStatus();
 try{
  // Public deletion is independent of the private roster's permissions.
  await db.ref('rooms/'+room+'/dcx/meta/factions/'+f.id).remove();
  if(secretReady){
   try{await db.ref('rooms/'+room+'/dcx/factionSecrets/'+f.id).remove()}
   catch(e){console.warn('[DCX FACTIONS] private cleanup',e);
    feedback='FACÇÃO REMOVIDA, MAS AS FICHAS PRIVADAS PRECISAM SER LIMPAS NO FIREBASE.';}
  }else{
   feedback='FACÇÃO REMOVIDA. FICHAS PRIVADAS PODEM EXIGIR LIMPEZA APÓS ATUALIZAR AS REGRAS.';
  }
  selection='';editor='';
  if(!feedback.startsWith('FACÇÃO REMOVIDA'))feedback='FACÇÃO REMOVIDA.';
 }catch(e){feedback='ERRO AO EXCLUIR FACÇÃO: '+(e?.code||e?.message);console.error(e)}
 finally{pending=false;render()}
}
async function saveMember(memberId,info){
 const f=current();if(!HOST||!f||pending)return;
 if(!secretReady){feedback=secretError||'AGUARDANDO AUTORIZAÇÃO PARA FICHAS PRIVADAS';renderStatus();return}
 const id=memberId||db.ref('rooms/'+room+'/dcx/factionSecrets/'+f.id+'/members').push().key;
 const roster={...privateRoster(f.id),[id]:memberData(info)};
 pending=true;feedback='SALVANDO FICHA...';renderStatus();
 try{
  // Publish a public roster only when enabled. The full private copy is always
  // persisted to the private path, not just hidden with CSS.
  await db.ref('rooms/'+room+'/dcx').update({
   ['factionSecrets/'+f.id+'/members/'+id]:roster[id],
   ['meta/factions/'+f.id]:sanitize(f,roster)
  });
  editor='';feedback='FICHA SALVA COM SUCESSO.';
 }catch(e){feedback='ERRO AO SALVAR FICHA: '+(e?.code||e?.message);console.error(e)}
 finally{pending=false;render()}
}
async function deleteMember(memberId){
 const f=current();if(!HOST||!f||!secretReady||pending)return;
 if(!confirm('Remover este integrante da facção?'))return;
 const roster={...privateRoster(f.id)};delete roster[memberId];
 pending=true;renderStatus();
 try{
  await db.ref('rooms/'+room+'/dcx').update({
   ['factionSecrets/'+f.id+'/members/'+memberId]:null,
   ['meta/factions/'+f.id]:sanitize(f,roster)
  });
  editor='';feedback='INTEGRANTE REMOVIDO.';
 }catch(e){feedback='ERRO AO REMOVER: '+(e?.code||e?.message)}
 finally{pending=false;render()}
}
function photo(parent,url,alt){
 if(!safeURL(url))return;
 const img=el('img','dcxFactionImage');img.src=url;img.alt=alt||'Imagem da facção';
 img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();
 parent.append(img);
}
function renderMenu(){
 const body=$('dcxFactionMenu');if(!body)return;body.replaceChildren();
 const records=sorted();
 if(!records.length){body.append(el('p','dcxFactionEmpty','NENHUMA FACÇÃO PUBLICADA'));return}
 records.forEach(f=>{
  const button=btn('',()=>{selection=f.id;editor='';render()},'dcxFactionNav'+(selection===f.id?' active':''));
  const sym=el('span','dcxFactionSymbol',emblem(f));
  const txt=el('span','dcxFactionNavText');
  txt.append(el('strong','',f.title));
  const classification=el('small','dcxFactionNavClass');
  const kind=el('span','dcxFactionTypeBadge dcxFactionType-'+typeClass(f),typeOf(f).toUpperCase());
  classification.append(kind,el('span','',' · '+categoryLabel(f).toUpperCase()+' · AUT. '+int(f.authority)));
  txt.append(classification);
  const num=el('span','dcxFactionNavRank',String(int(f.authority)).padStart(2,'0'));
  button.append(sym,txt,num);body.append(button);
 });
}
function textField(parent,obj,name,label,max=100,multiline=false){
 const field=multiline?area(label,obj?.[name],max):input(label,obj?.[name],max);
 parent.append(field.wrap);return field.node;
}
function optionField(parent,label,list,value){
 const field=select(label,list,value);parent.append(field.wrap);return field.node;
}
function editFaction(){
 const f=current()||defaultFaction(),wrap=el('form','dcxFactionForm');
 wrap.addEventListener('submit',e=>{e.preventDefault();saveFaction({
  title:title.value,type:kind.value,category:category.value,symbol:symbol.value,authority:authority.value,
  hostility:hostility.value,description:desc.value,image:image.value,membersPublic:visibility.checked
 })});
 const title=textField(wrap,f,'title','NOME / TÍTULO',100);
 const kind=optionField(wrap,'TIPO / SITUAÇÃO LEGAL',TYPES.map(v=>[v,v.toUpperCase()]),typeOf(f));
 const hint=el('p','dcxFactionFieldHint','LEGAL = VERDE NEON · ILEGAL = VERMELHO NEON · DESCONHECIDO = CINZA NEON');
 wrap.append(hint);
 const category=optionField(wrap,'CATEGORIA DA FACÇÃO',[['','SELECIONE A CATEGORIA'],...CATEGORIES.map(v=>[v,v.toUpperCase()])],categoryOf(f));
 category.required=true;
 const symbol=optionField(wrap,'SÍMBOLO DA FACÇÃO',SYMBOLS.map(([id,icon,label])=>[id,icon+'  '+label]),f.symbol);
 const authority=textField(wrap,f,'authority','AUTORIDADE (0 A 100)',3);authority.type='number';authority.min='0';authority.max='100';
 const hostility=textField(wrap,f,'hostility','HOSTILIDADE COM A DCX (0 A 5 ESTRELAS)',1);hostility.type='number';hostility.min='0';hostility.max='5';
 const desc=textField(wrap,f,'description','DESCRIÇÃO DA FACÇÃO',3500,true);
 const image=textField(wrap,f,'image','LINK HTTPS DE IMAGEM (OPCIONAL)',1000);
 const checkbox=el('label','dcxFactionToggle'),visibility=el('input');visibility.type='checkbox';visibility.checked=!!f.membersPublic;
 checkbox.append(visibility,el('span','','FICHAS DOS INTEGRANTES PÚBLICAS AOS JOGADORES'));wrap.append(checkbox);
 const bar=el('div','dcxFactionActions');
 bar.append(btn('CANCELAR',()=>{editor='';render()},'secondary'));
 const submit=el('button','dcxFactionButton primary','✓ SALVAR FACÇÃO');submit.type='submit';submit.disabled=pending;
 bar.append(submit);wrap.append(bar);return wrap;
}
function editMember(memberId=''){
 const f=current(),stored=privateRoster(f.id)[memberId]||{};
 const wrap=el('form','dcxFactionForm');
 wrap.addEventListener('submit',e=>{e.preventDefault();saveMember(memberId,{
  name:name.value,codename:alias.value,role:role.value,age:age.value,
  image:image.value,description:desc.value,abilities:abilities.value
 })});
 const name=textField(wrap,stored,'name','NOME DO INTEGRANTE',100);
 const alias=textField(wrap,stored,'codename','CODINOME',90);
 const role=textField(wrap,stored,'role','FUNÇÃO NA FACÇÃO',95);
 const age=textField(wrap,stored,'age','IDADE (OPCIONAL)',30);
 const image=textField(wrap,stored,'image','IMAGEM HTTPS DA FICHA',1000);
 const desc=textField(wrap,stored,'description','HISTÓRIA / DESCRIÇÃO',2400,true);
 const abilities=textField(wrap,stored,'abilities','HABILIDADES / INFORMAÇÕES',1500,true);
 const actions=el('div','dcxFactionActions');
 actions.append(btn('VOLTAR',()=>{editor='';render()},'secondary'));
 const submit=el('button','dcxFactionButton primary','✓ SALVAR FICHA');submit.type='submit';submit.disabled=pending;
 actions.append(submit);wrap.append(actions);return wrap;
}
function memberCard(id,m,allowEdit){
 const card=el('article','dcxFactionMember');
 const hero=el('div','dcxFactionMemberIcon',m.image?'◇':'♟');
 if(m.image){hero.textContent='';photo(hero,m.image,'Retrato de '+m.name)}
 const body=el('div','dcxFactionMemberBody');
 body.append(el('h4','',m.name||'SEM NOME'),el('small','',[(m.codename||''),(m.role||'')].filter(Boolean).join(' // ')));
 const detail=el('div','dcxFactionMemberDetail');
 if(m.age)detail.append(el('p','','IDADE: '+m.age));
 if(m.description)detail.append(el('p','',m.description));
 if(m.abilities)detail.append(el('p','', 'HABILIDADES // '+m.abilities));
 detail.hidden=true;
 const reveal=btn('VER FICHA',()=>{detail.hidden=!detail.hidden;reveal.textContent=detail.hidden?'VER FICHA':'RECOLHER FICHA'});
 body.append(reveal,detail);card.append(hero,body);
 if(allowEdit){
  const controls=el('div','dcxFactionMemberControls');
  controls.append(btn('EDITAR',()=>{editor='member:'+id;render()}),
    btn('EXCLUIR',()=>deleteMember(id),'danger'));
  card.append(controls);
 }
 return card;
}
function renderDetails(){
 const body=$('dcxFactionDetails');if(!body)return;
 body.replaceChildren();
 if(editor){
  const title=el('h2','dcxFactionEditTitle',editor==='faction'?(current()?'EDITAR FACÇÃO':'CRIAR FACÇÃO'):'FICHA DE INTEGRANTE');
  body.append(title,editor==='faction'?editFaction():editMember(editor.slice(7)));return;
 }
 const f=current();
 if(!f){body.append(el('div','dcxFactionEmpty','SELECIONE UMA FACÇÃO OU AGUARDE A PUBLICAÇÃO PELO KEYMASTER.'));return}
 const hero=el('section','dcxFactionHero dcxFactionType-'+typeClass(f));
 photo(hero,f.image,'Emblema visual da facção '+f.title);
 const copy=el('div','dcxFactionHeroCopy');
 copy.append(el('span','dcxFactionKicker','DCX // ARQUIVO DE INTELIGÊNCIA'),
  el('span','dcxFactionHeroSymbol',emblem(f)),el('h1','',f.title));
 const meta=el('div','dcxFactionMetrics');
 meta.append(el('span','dcxFactionTypeBadge dcxFactionType-'+typeClass(f),'TIPO // '+typeOf(f).toUpperCase()),
  el('span','dcxFactionCategoryBadge','CATEGORIA // '+categoryLabel(f).toUpperCase()),
  el('span','','AUTORIDADE // '+int(f.authority)+'/100'),
  el('span','dcxFactionHostility','HOSTILIDADE // '+stars(f.hostility)));
 copy.append(meta);hero.append(copy);body.append(hero);
 if(f.description)body.append(el('p','dcxFactionDescription',f.description));
 const head=el('div','dcxFactionSectionHead');
 head.append(el('h3','','INTEGRANTES'),
  el('span','',f.membersPublic?'FICHAS PÚBLICAS':'ARQUIVO CONFIDENCIAL'));
 body.append(head);
 if(HOST&&!secretReady){
  body.append(el('p','dcxFactionNotice',secretError||'SINCRONIZANDO ARQUIVO PRIVADO…'));
 }else{
  const members=visibleRoster(f),items=Object.entries(members);
  if(HOST){
   const controls=el('div','dcxFactionActions');
   controls.append(btn('+ CRIAR FICHA',()=>{editor='member:';render()},'primary'));
   body.append(controls);
  }
  if(!HOST&&!f.membersPublic){
   const secret=el('div','dcxFactionClassified');
   const count=int(f.memberCount,300);
   secret.append(el('div','dcxFactionGlitch','?'),el('strong','','IDENTIDADES RESTRITAS'),
    el('small','',count+' REGISTRO(S) SOB SIGILO // ACESSO NEGADO'));
   body.append(secret);
  }else if(!items.length)body.append(el('p','dcxFactionEmpty','NENHUM INTEGRANTE CADASTRADO.'));
  else{
   const grid=el('div','dcxFactionMemberGrid');
   items.forEach(([id,m])=>grid.append(memberCard(id,m,HOST)));
   body.append(grid);
  }
 }
 if(HOST){
  const controls=el('div','dcxFactionActions dcxFactionAdminActions');
  controls.append(btn('EDITAR FACÇÃO',()=>{editor='faction';render()}),
   btn('EXCLUIR FACÇÃO',deleteFaction,'danger'));
  body.append(controls);
 }
}
function renderStatus(){
 const status=$('dcxFactionStatus');if(!status)return;
 status.textContent=[feedback,HOST&&secretError?secretError:''].filter(Boolean).join(' // ');
 status.dataset.error=/ERRO|NEGOU|FALHA|ACESSO NEGADO|REGRAS|CONECTE/i.test(status.textContent)?'true':'false';
}
function render(){
 const active=document.activeElement,editing=active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)&&active.closest('.dcxFactionForm');
 if(editing&&!editor)return;
 renderMenu();
 if(!editing)renderDetails();
 renderStatus();
}
function boot(){
 const nav=$('dcxFactionMenu'),body=$('dcxFactionDetails');
 if(!nav||!body)return;
 if(HOST){
  const create=$('dcxFactionCreate');
  create?.addEventListener('click',()=>{selection='';editor='faction';render()});
 }
 connect();refreshTimer=setInterval(connect,1500);render();
}
window.DCX=window.DCX||{};
window.DCX.Factions={get selected(){return selection},get factions(){return sorted()},open(id){selection=id;editor='';render()},symbols:SYMBOLS,types:TYPES,categories:CATEGORIES};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();