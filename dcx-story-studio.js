/* DCX STORY STUDIO // operations and character dossiers, synchronized by the existing room state. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const host=/\/keymaster\.html$/i.test(location.pathname);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(v,max=150)=>String(v??'').trim().slice(0,max);
const id=prefix=>prefix+'-'+(crypto.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)).replace(/[^a-z0-9-]/gi,'').slice(0,48);
const safeUrl=value=>{
  const value0=clean(value,1900);
  if(!value0)return '';
  if(/^https?:\/\/[^ ]+$/i.test(value0))return value0;
  if(/^(?!\/|\.\/|.*\.\.)[a-z0-9_-][a-z0-9_./%-]*\.(png|jpe?g|gif|webp|avif)(\?[^<>"']*)?$/i.test(value0))return value0;
  return '';
};
const defaultOperation=()=>({id:'operacao-h',title:'Caindo em uma Fria',code:'OPERAÇÃO H',summary:'Extração de H-01 na RAIN, investigação do N-02 e planejamento de campo.',imageUrl:'',status:'published',objectives:['Recuperar H-01 preservando a cápsula criogênica.','Evitar uma crise diplomática e proteger os civis.'],preparations:[],modules:[]});
function normalize(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const operations=Array.isArray(d.operations)?d.operations.filter(Boolean).map(op=>({
   id:clean(op.id,64),title:clean(op.title,100),code:clean(op.code,50),
   summary:clean(op.summary,1200),imageUrl:safeUrl(op.imageUrl),imageFrame:window.DCX?.ImageTools?.normalize(op.imageFrame),
   status:op.status==='draft'?'draft':'published',
   objectives:Array.isArray(op.objectives)?op.objectives.map(v=>clean(v,240)).filter(Boolean):[],
   preparations:Array.isArray(op.preparations)?op.preparations.filter(Boolean).map(p=>({
    id:clean(p.id,64),title:clean(p.title,120),description:clean(p.description,600),done:!!p.done,
    symbol:clean(p.symbol,16),interaction:['view','local','request'].includes(p.interaction)?p.interaction:'view'
   })).filter(p=>p.id&&p.title):[],
   modules:Array.isArray(op.modules)?op.modules.filter(Boolean).map(m=>({
    id:clean(m.id,64),title:clean(m.title,120),subtitle:clean(m.subtitle,160),
    body:clean(m.body,6500),imageUrl:safeUrl(m.imageUrl),imageFrame:window.DCX?.ImageTools?.normalize(m.imageFrame),symbol:clean(m.symbol,16),
    type:['briefing','intel','preparations','choice'].includes(m.type)?m.type:'briefing',
    published:m.published!==false,
    options:Array.isArray(m.options)?m.options.map(v=>clean(v,180)).filter(Boolean):[]
   })).filter(m=>m.id&&m.title):[]
 })).filter(op=>op.id&&op.title):[];
 // Only add legacy mission to rooms without a saved catalog; explicit deletions persist.
 if(!Array.isArray(d.operations)&&d.catalogInitialized!==true)operations.unshift(defaultOperation());
 const chars=Array.isArray(d.characters)?d.characters.filter(Boolean).map(ch=>({
   id:clean(ch.id,64),name:clean(ch.name,100),lore:clean(ch.lore,5000),
   imageUrl:safeUrl(ch.imageUrl),imageFrame:window.DCX?.ImageTools?.normalize(ch.imageFrame),status:ch.status==='draft'?'draft':'published'
 })).filter(ch=>ch.id&&ch.name):[];
 return {version:2,catalogInitialized:true,operations,characters:chars};
}
let studio=normalize(null),opEditing='operacao-h',charEditing=null,opDirty=false,charDirty=false;
let currentMission='operacao-h';
function notify(msg){
 const live=$('kmStudioStatus');if(live)live.textContent=msg;
 const toast=$('toast');if(toast&&host){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500)}
}
function requireHost(){
 if(!host||!window.OPH?.Realtime?.getRoom?.()){notify('CONECTE O KEYMASTER À SALA ANTES DE PUBLICAR');return false}
 return true;
}
async function publish(next,ok){
 if(!requireHost())return false;
 try{
   await OPH.Realtime.patchState({storyStudio:normalize(next)});
   studio=normalize(next);notify(ok);return true;
 }catch(err){console.error('STORY STUDIO // PUBLICAÇÃO',err);notify('FALHA AO SINCRONIZAR — CONFIRA O FIREBASE');return false}
}
function imageMarkup(url,alt,cls,frame){
 const markup=window.DCX?.ImageTools?.frame(url,frame,alt,cls);return markup||'<span class="dcxStoryImageFallback" aria-hidden="true">DCX</span>';
}
function statusLabel(o){return o.status==='draft'?'RASCUNHO':'PUBLICADA'}
function playerOperations(){
 const list=$('dcxMissionsList');if(!list)return;
 const visible=studio.operations.filter(o=>o.status==='published');
 list.innerHTML=visible.length?visible.map(o=>'<button class="dcxMissionTile dcxStoryMissionTile" type="button" data-mission-open="'+esc(o.id)+'">'+
   '<span class="dcxStoryTileArt">'+imageMarkup(o.imageUrl,o.title,'dcxStoryTileImage',o.imageFrame)+'</span>'+
   '<span class="dcxMissionTileInfo"><small>'+esc(o.code||'MISSÃO DCX')+' // '+esc(statusLabel(o))+'</small><strong>'+esc(o.title)+'</strong><span>'+esc(o.summary||'Acesse os arquivos desta operação.')+'</span></span>'+
   '<span class="dcxMissionTileAction">ABRIR <b aria-hidden="true">›</b></span></button>').join(''):'<div class="dcxStoryEmpty">Nenhuma missão publicada.</div>';
}
function playerCharacters(){
 const list=$('dcxCharacterGrid');if(!list)return;
 const chars=studio.characters.filter(ch=>ch.status==='published');
 list.innerHTML=chars.length?chars.map(ch=>'<article class="dcxCharacterCard"><div class="dcxCharacterArt">'+imageMarkup(ch.imageUrl,ch.name,'dcxCharacterImage',ch.imageFrame)+'</div>'+
 '<div class="dcxCharacterMeta"><small>ARQUIVO // PERSONAGEM</small><h2>'+esc(ch.name)+'</h2><p>'+esc(ch.lore||'Nenhuma descrição publicada.')+'</p></div></article>').join(''):'<div class="dcxStoryEmpty">Os arquivos de personagens ainda não foram publicados pelo Keymaster.</div>';
}
const stageModules=[
 {index:0,icon:'▤',title:'ABERTURA',desc:'Contexto e apresentação da operação'},
 {index:1,icon:'◎',title:'GOVERNO',desc:'Situação política e restrições'},
 {index:2,icon:'H',title:'H-01',desc:'Objetivo principal da extração'},
 {index:3,icon:'⌁',title:'PLANEJAMENTO',desc:'Estratégias de abordagem'},
 {index:4,icon:'✓',title:'PREPARAÇÕES',desc:'Checklist controlado pelo narrador'},
 {index:5,icon:'N',title:'N-02',desc:'Arquivos de investigação'},
 {index:6,icon:'!',title:'PROTOCOLOS',desc:'Medidas para emergências'}
];
function prepMarkup(op){
 return (op.preparations||[]).length?op.preparations.map((p,i)=>
   '<div class="dcxStoryPrep '+(p.done?'isDone':'')+'"><span>'+esc(p.symbol||String(i+1).padStart(2,'0'))+'</span><div><b>'+esc(p.title)+'</b><p>'+esc(p.description)+'</p></div><em>'+ (p.done?'CONCLUÍDA':'PENDENTE')+'</em></div>').join(''):'<p class="dcxStoryMuted">As preparações desta missão ainda não foram personalizadas.</p>';
}
function objectiveMarkup(op){return op.objectives.length?op.objectives.map((x,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(x)+'</li>').join(''):'<li>Objetivos ainda não definidos.</li>'}
function heroMarkup(op){
 const img=window.DCX?.ImageTools?.frame(op.imageUrl,op.imageFrame,op.title,'dcxStoryHeroImage');
 const dim=window.DCX?.ImageTools?.normalize(op.imageFrame).dim||0;
 return '<header class="dcxStoryMissionHero">'+(img?'<div class="dcxStoryHeroArt">'+img+'<div class="dcxImageDim" style="opacity:'+(dim/100)+'"></div></div>':'')+
 '<small>DCX // '+esc(op.code||'MISSÃO')+'</small><h1>'+esc(op.title)+'</h1><p>'+esc(op.summary)+'</p></header>';
}
function renderMission(missionId){
 currentMission=missionId||'operacao-h';
 const op=studio.operations.find(o=>o.id===currentMission&&o.status==='published');
 const dynamic=$('dcxMissionDynamic');
 if(!op){
   if(currentMission!=='operacao-h')window.DCX?.PlayerHub?.showMissionList?.();
   return;
 }
 if(currentMission==='operacao-h'){
   const stage=$('dcxStoryLegacyModules');if(!stage)return;
   stage.innerHTML=heroMarkup(op)+
   '<div class="dcxStorySectionHeading"><div><small>OPERAÇÃO // MÓDULOS</small><h2>ARQUIVOS DA MISSÃO</h2></div><span>07 SETORES</span></div>'+
   '<div class="dcxStoryModules">'+stageModules.map(m=>
    '<button class="dcxStoryModule" type="button" data-story-stage="'+m.index+'"><span>'+m.icon+'</span><div><b>'+m.title+'</b><small>'+m.desc+'</small></div><em>ABRIR ›</em></button>').join('')+'</div>'+
   (window.DCX?.MissionBuilder?.moduleGrid?.(op,true)||'')+
   '<div class="dcxStoryInfoColumns"><section><h3>OBJETIVOS</h3><ol>'+objectiveMarkup(op)+'</ol></section>'+
   '<section><h3>PREPARAÇÕES ADICIONAIS</h3>'+prepMarkup(op)+'</section></div>';
   const detail=$('dcxMissionDetail');if(detail){detail.querySelector('.dcxMissionDetailHead strong').textContent=op.title}
 }else if(dynamic){
   dynamic.innerHTML='<header class="dcxMissionDetailHead"><button class="dcxMissionBack" type="button">‹ TODAS AS MISSÕES</button><div><small>MISSÕES // '+esc(op.code||'ARQUIVO DCX')+'</small><strong>'+esc(op.title)+'</strong></div></header>'+
    heroMarkup(op)+'<div class="dcxStoryInfoColumns dcxStoryDynamicColumns">'+
    '<section><h3>OBJETIVOS</h3><ol>'+objectiveMarkup(op)+'</ol></section>'+
    '<section><h3>PREPARAÇÕES <small>'+op.preparations.filter(p=>p.done).length+'/'+op.preparations.length+' CONCLUÍDAS</small></h3>'+prepMarkup(op)+'</section></div>'+ 
    (window.DCX?.MissionBuilder?.moduleGrid?.(op,false)||'');
 }
}
function renderPlayer(){
 playerOperations();playerCharacters();
 const openDetail=$('dcxMissionDetail');
 if(openDetail&&!openDetail.hidden){
  if(studio.operations.some(op=>op.id==='operacao-h'&&op.status==='published'))renderMission('operacao-h');
  else window.DCX?.PlayerHub?.showMissionList?.();
 }
 if($('dcxMissionDynamic')&&!$('dcxMissionDynamic').hidden)renderMission(currentMission);
}
function hostOperations(){
 const list=$('kmStudioOperations');if(!list)return;
 list.innerHTML=studio.operations.length?studio.operations.map(op=>
  '<div class="kmStudioEntry '+(opEditing===op.id?'selected':'')+'">'+
    '<div class="kmStudioEntryText"><span>'+esc(op.code||'MISSÃO')+'</span><b>'+esc(op.title)+'</b><small>'+esc(statusLabel(op))+' · '+op.preparations.length+' PREPARAÇÕES</small></div>'+
    '<div class="kmStudioEntryActions"><button class="kmStudioActionEdit" type="button" data-edit-op="'+esc(op.id)+'" aria-label="Editar missão '+esc(op.title)+'">EDITAR</button>'+
    '<button class="kmStudioActionDelete" type="button" data-delete-op="'+esc(op.id)+'" aria-label="Excluir missão '+esc(op.title)+'">EXCLUIR</button></div></div>'
 ).join(''):'<div class="kmStudioEmpty">Nenhuma missão cadastrada. Crie uma nova operação.</div>';
}
function hostCharacters(){
 const list=$('kmStudioCharacters');if(!list)return;
 list.innerHTML=studio.characters.length?studio.characters.map(ch=>
  '<div class="kmStudioEntry '+(charEditing===ch.id?'selected':'')+'">'+
    '<div class="kmStudioEntryText"><span>PERSONAGEM</span><b>'+esc(ch.name)+'</b><small>'+esc(statusLabel(ch))+'</small></div>'+
    '<div class="kmStudioEntryActions"><button class="kmStudioActionEdit" type="button" data-edit-character="'+esc(ch.id)+'" aria-label="Editar personagem '+esc(ch.name)+'">EDITAR</button>'+
    '<button class="kmStudioActionDelete" type="button" data-delete-character="'+esc(ch.id)+'" aria-label="Excluir personagem '+esc(ch.name)+'">EXCLUIR</button></div></div>'
 ).join(''):'<div class="kmStudioEmpty">Nenhum personagem cadastrado.</div>';
}
function renderPrepInputs(items){
 const box=$('kmStudioPrepRows');if(!box)return;
 box.innerHTML=(items||[]).map((p,i)=>'<div class="kmStudioPrepRow" data-prep-id="'+esc(p.id)+'">'+
 '<div class="kmStudioPrepRowHead"><strong>PREPARAÇÃO '+(i+1)+'</strong><button type="button" data-remove-prep="'+esc(p.id)+'">REMOVER</button></div>'+
 '<label>NOME<input data-prep-title maxlength="120" value="'+esc(p.title)+'" required></label>'+
 '<label>DESCRIÇÃO<textarea data-prep-description rows="2" maxlength="600">'+esc(p.description)+'</textarea></label>'+
 '<div class="kmStudioFieldPair"><label>SÍMBOLO<select data-prep-symbol>'+
 (window.DCX?.MissionBuilder?.symbolOptions?.(p.symbol)||'<option value="◎">◎ OBJETIVO</option>')+
 '</select></label><label>INTERAÇÃO DO JOGADOR<select data-prep-interaction>'+
 '<option value="view" '+(p.interaction==='view'||!p.interaction?'selected':'')+'>SOMENTE LEITURA</option>'+
 '<option value="local" '+(p.interaction==='local'?'selected':'')+'>CHECKLIST PESSOAL</option>'+
 '<option value="request" '+(p.interaction==='request'?'selected':'')+'>SOLICITAR AO KEYMASTER</option>'+
 '</select></label></div>'+
 '<label class="kmStudioCheckbox"><input type="checkbox" data-prep-done '+(p.done?'checked':'')+'> CONCLUÍDA (KEYMASTER)</label></div>').join('');
}
function readPrepInputs(keepEmpty=false){
 return [...document.querySelectorAll('#kmStudioPrepRows .kmStudioPrepRow')].map(row=>({
  id:row.dataset.prepId,title:clean(row.querySelector('[data-prep-title]')?.value,120),
  description:clean(row.querySelector('[data-prep-description]')?.value,600),done:!!row.querySelector('[data-prep-done]')?.checked,
  symbol:clean(row.querySelector('[data-prep-symbol]')?.value,16),
  interaction:row.querySelector('[data-prep-interaction]')?.value||'view'
 })).filter(p=>keepEmpty||p.title);
}
function loadOp(){
 const op=studio.operations.find(v=>v.id===opEditing)||{id:'',title:'',code:'',summary:'',imageUrl:'',status:'draft',objectives:[],preparations:[],modules:[]};
 if($('kmStudioOpTitle'))$('kmStudioOpTitle').value=op.title;
 if($('kmStudioOpCode'))$('kmStudioOpCode').value=op.code;
 if($('kmStudioOpSummary'))$('kmStudioOpSummary').value=op.summary;
 if($('kmStudioOpImage'))$('kmStudioOpImage').value=op.imageUrl;
 window.DCX?.ImageTools?.attach('kmStudioOpImage',op.imageFrame);
 if($('kmStudioOpPublic'))$('kmStudioOpPublic').checked=op.status==='published';
 if($('kmStudioOpObjectives'))$('kmStudioOpObjectives').value=op.objectives.join('\n');
 if($('kmStudioOpDelete'))$('kmStudioOpDelete').hidden=!opEditing;
 renderPrepInputs(op.preparations);
 window.DCX?.MissionBuilder?.renderEditor?.(op);
 opDirty=false;
}
function loadChar(){
 const ch=studio.characters.find(v=>v.id===charEditing)||{name:'',lore:'',imageUrl:'',status:'draft'};
 if($('kmStudioCharName'))$('kmStudioCharName').value=ch.name;
 if($('kmStudioCharLore'))$('kmStudioCharLore').value=ch.lore;
 if($('kmStudioCharImage'))$('kmStudioCharImage').value=ch.imageUrl;
 window.DCX?.ImageTools?.attach('kmStudioCharImage',ch.imageFrame);
 if($('kmStudioCharPublic'))$('kmStudioCharPublic').checked=ch.status==='published';
 if($('kmStudioCharDelete'))$('kmStudioCharDelete').hidden=!charEditing;
 charDirty=false;renderCharPreview();
}
function renderCharPreview(){
 const p=$('kmStudioCharPreview');if(!p)return;
 p.innerHTML='<div class="dcxCharacterArt">'+imageMarkup($('kmStudioCharImage')?.value||'',$('kmStudioCharName')?.value||'Personagem','dcxCharacterImage',window.DCX?.ImageTools?.read('kmStudioCharImage'))+'</div>'+
 '<div class="dcxCharacterMeta"><small>PRÉVIA // CARTÃO</small><h2>'+esc($('kmStudioCharName')?.value||'NOME DO PERSONAGEM')+'</h2><p>'+esc($('kmStudioCharLore')?.value||'Descrição e lore do personagem.')+'</p></div>';
}
function renderHost(){
 hostOperations();hostCharacters();
 if(!opDirty)loadOp();
 if(!charDirty)loadChar();
 const opCount=$('kmStudioCountOps'),charCount=$('kmStudioCountChars');
 if(opCount)opCount.textContent=studio.operations.length+' MISSÕES';
 if(charCount)charCount.textContent=studio.characters.length+' PERSONAGENS';
}
function selectOp(opid){
 if(opDirty&&opEditing!==opid&&!confirm('Descartar alterações não salvas da missão atual?'))return;
 opEditing=opid;opDirty=false;hostOperations();loadOp();
}
function selectChar(chid){
 if(charDirty&&charEditing!==chid&&!confirm('Descartar alterações não salvas do personagem atual?'))return;
 charEditing=chid;charDirty=false;hostCharacters();loadChar();
}
async function saveOperation(){
 const title=clean($('kmStudioOpTitle')?.value,100);
 if(!title)return notify('INFORME O TÍTULO DA MISSÃO');
 const code=clean($('kmStudioOpCode')?.value,50)||'MISSÃO DCX';
 const imageRaw=clean($('kmStudioOpImage')?.value,1900),imageUrl=safeUrl(imageRaw);
 if(imageRaw&&!imageUrl)return notify('LINK DE IMAGEM INVÁLIDO — USE HTTPS OU UM ARQUIVO PNG/JPG');
 const item={id:opEditing||id('mission'),title,code,summary:clean($('kmStudioOpSummary')?.value,1200),
  imageUrl,imageFrame:window.DCX?.ImageTools?.read('kmStudioOpImage'),status:$('kmStudioOpPublic')?.checked?'published':'draft',
  objectives:String($('kmStudioOpObjectives')?.value||'').split('\n').map(x=>clean(x,240)).filter(Boolean),
  preparations:readPrepInputs().filter(p=>p.title),
  modules:window.DCX?.MissionBuilder?.readModules?.()||[]};
 const operations=studio.operations.some(v=>v.id===item.id)
  ?studio.operations.map(v=>v.id===item.id?item:v)
  :[...studio.operations,item];
 if(await publish({...studio,operations},'MISSÃO SALVA E SINCRONIZADA')){
  opEditing=item.id;opDirty=false;renderHost();
 }
}
async function deleteOperation(targetId=opEditing){
 const op=studio.operations.find(v=>v.id===targetId);if(!op)return;
 if(!confirm('Excluir definitivamente a missão "'+op.title+'"? Ela desaparecerá para todos os jogadores.'))return;
 const operations=studio.operations.filter(v=>v.id!==targetId);
 if(await publish({...studio,operations},'MISSÃO EXCLUÍDA E REMOVIDA DO PLAYER')){
  if(opEditing===targetId){opEditing=operations[0]?.id||null;opDirty=false}
  renderHost();
 }
}
async function saveCharacter(){
 const name=clean($('kmStudioCharName')?.value,100);
 if(!name)return notify('INFORME O NOME DO PERSONAGEM');
 const imageRaw=clean($('kmStudioCharImage')?.value,1900),imageUrl=safeUrl(imageRaw);
 if(imageRaw&&!imageUrl)return notify('LINK DE IMAGEM INVÁLIDO — USE HTTPS OU UM ARQUIVO PNG/JPG');
 const item={id:charEditing||id('character'),name,lore:clean($('kmStudioCharLore')?.value,5000),
 imageUrl,imageFrame:window.DCX?.ImageTools?.read('kmStudioCharImage'),status:$('kmStudioCharPublic')?.checked?'published':'draft'};
 const characters=studio.characters.some(v=>v.id===item.id)
  ?studio.characters.map(v=>v.id===item.id?item:v)
  :[...studio.characters,item];
 if(await publish({...studio,characters},'PERSONAGEM PUBLICADO NA SALA')){
  charEditing=item.id;charDirty=false;renderHost();
 }
}
async function deleteCharacter(targetId=charEditing){
 const ch=studio.characters.find(v=>v.id===targetId);if(!ch)return;
 if(!confirm('Excluir definitivamente o personagem "'+ch.name+'"? O card será removido para todos os jogadores.'))return;
 const characters=studio.characters.filter(v=>v.id!==targetId);
 if(await publish({...studio,characters},'PERSONAGEM EXCLUÍDO E REMOVIDO DO PLAYER')){
  if(charEditing===targetId){charEditing=characters[0]?.id||null;charDirty=false}
  renderHost();
 }
}
function bindHost(){
 $('kmStudioNewOp')?.addEventListener('click',()=>{
  if(opDirty&&!confirm('Descartar alterações não salvas da missão atual?'))return;
  opEditing=null;opDirty=false;hostOperations();loadOp();$('kmStudioOpTitle')?.focus();
 });
 $('kmStudioNewChar')?.addEventListener('click',()=>{
  if(charDirty&&!confirm('Descartar alterações não salvas do personagem atual?'))return;
  charEditing=null;charDirty=false;hostCharacters();loadChar();$('kmStudioCharName')?.focus();
 });
 $('kmStudioOpSave')?.addEventListener('click',saveOperation);
 $('kmStudioOpDelete')?.addEventListener('click',()=>deleteOperation());
 $('kmStudioCharSave')?.addEventListener('click',saveCharacter);
 $('kmStudioCharDelete')?.addEventListener('click',()=>deleteCharacter());
 $('kmStudioAddPrep')?.addEventListener('click',()=>{
  const current=readPrepInputs(true);current.push({id:id('prep'),title:'',description:'',done:false,symbol:'◎',interaction:'view'});
  renderPrepInputs(current);opDirty=true;
  document.querySelector('#kmStudioPrepRows .kmStudioPrepRow:last-child [data-prep-title]')?.focus();
 });
 $('kmStudioPrepRows')?.addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-prep]');if(!remove)return;
  const list=readPrepInputs(true).filter(p=>p.id!==remove.dataset.removePrep);
  renderPrepInputs(list);opDirty=true;
 });
 $('kmStudioOperations')?.addEventListener('click',e=>{
  const del=e.target.closest('[data-delete-op]');
  if(del){deleteOperation(del.dataset.deleteOp);return}
  const edit=e.target.closest('[data-edit-op]');
  if(edit)selectOp(edit.dataset.editOp);
 });
 $('kmStudioCharacters')?.addEventListener('click',e=>{
  const del=e.target.closest('[data-delete-character]');
  if(del){deleteCharacter(del.dataset.deleteCharacter);return}
  const edit=e.target.closest('[data-edit-character]');
  if(edit)selectChar(edit.dataset.editCharacter);
 });
 $('kmStudioOpForm')?.addEventListener('input',()=>{opDirty=true});
 $('kmStudioOpForm')?.addEventListener('change',()=>{opDirty=true});
 $('kmStudioCharForm')?.addEventListener('input',()=>{charDirty=true;renderCharPreview()});
 $('kmStudioCharForm')?.addEventListener('change',()=>{charDirty=true;renderCharPreview()});
}
function polishHost(){
 const root=document.querySelector('[data-km-view="master"] .kmSingle');
 if(!root)return;
 const panels=[...root.children].filter(el=>el.id!=='kmCommandCenter'&&el.id!=='kmAdvancedControlDetails');
 if(panels.length){
  const details=document.createElement('details');
  details.id='kmAdvancedControlDetails';details.className='kmAdvancedControlDetails';
  const summary=document.createElement('summary');summary.textContent='SISTEMA E SEGURANÇA // STATUS, ACESSOS E DIAGNÓSTICOS';
  details.append(summary);
  panels.forEach(p=>details.append(p));
  root.append(details);
 }
 const editor=$('kmCommandCenter')?.querySelector('.kmPlayerHeroEditor');
 if(editor&&!editor.closest('.kmHeroEditorDetails')){
  const details=document.createElement('details');details.className='kmHeroEditorDetails';
  const summary=document.createElement('summary');summary.textContent='PERSONALIZAR A CAPA DA CENTRAL DCX';
  editor.before(details);details.append(summary,editor);
 }
}
function bindPlayer(){
 document.querySelector('#workspaceGolpe')?.addEventListener('click',e=>{
  const stage=e.target.closest('[data-story-stage]');if(!stage)return;
  const i=Number(stage.dataset.storyStage);
  const nav=$('nav')?.querySelectorAll('button')[i];
  if(nav?.classList.contains('hiddenStage'))return;
  $('dcxStoryLegacyModules').hidden=true;
  $('dcxMissionLegacyArchive').hidden=false;
  window.OPHPlayer?.go?.(i);
 });
 $('dcxStoryLegacyToMenu')?.addEventListener('click',()=>{
  $('dcxMissionLegacyArchive').hidden=true;
  $('dcxStoryLegacyModules').hidden=false;
 });
}
function init(){
 OPH.Realtime.onState(state=>{
  studio=normalize(state?.storyStudio);
  if(host)renderHost();else renderPlayer();
 });
 if(host){bindHost();renderHost();polishHost()}
 else{bindPlayer();renderPlayer()}
}
window.DCX=window.DCX||{};
window.DCX.StoryStudio={
 renderMission,
 async completePreparation(missionId,prepId){
  if(!host)return false;
  const op=studio.operations.find(v=>v.id===missionId);
  if(!op||!op.preparations.some(p=>p.id===prepId))return false;
  const operations=studio.operations.map(v=>v.id!==missionId?v:{...v,preparations:v.preparations.map(p=>p.id===prepId?{...p,done:true}:p)});
  const success=await publish({...studio,operations},'PREPARAÇÃO VALIDADA PELO KEYMASTER');
  if(success)renderHost();
  return success;
 },
 get operations(){return studio.operations.slice()},
 get characters(){return studio.characters.slice()}
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
