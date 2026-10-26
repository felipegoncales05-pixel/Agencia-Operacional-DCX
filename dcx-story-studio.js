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
const defaultOperation=()=>({id:'operacao-h',title:'Cair em uma Fria',code:'OPERAÇÃO H',summary:'Extração de H-01 na RAIN, investigação do N-02 e planejamento de campo.',imageUrl:'',status:'published',objectives:['Recuperar H-01 preservando a cápsula criogênica.','Evitar uma crise diplomática e proteger os civis.'],preparations:[]});
function normalize(raw){
 const d=raw&&typeof raw==='object'?raw:{};
 const operations=Array.isArray(d.operations)?d.operations.filter(Boolean).map(op=>({
   id:clean(op.id,64),title:clean(op.title,100),code:clean(op.code,50),
   summary:clean(op.summary,1200),imageUrl:safeUrl(op.imageUrl),
   status:op.status==='draft'?'draft':'published',
   objectives:Array.isArray(op.objectives)?op.objectives.map(v=>clean(v,240)).filter(Boolean):[],
   preparations:Array.isArray(op.preparations)?op.preparations.filter(Boolean).map(p=>({id:clean(p.id,64),title:clean(p.title,120),description:clean(p.description,600),done:!!p.done})).filter(p=>p.id&&p.title):[]
 })).filter(op=>op.id&&op.title):[];
 if(!operations.some(op=>op.id==='operacao-h'))operations.unshift(defaultOperation());
 const chars=Array.isArray(d.characters)?d.characters.filter(Boolean).map(ch=>({
   id:clean(ch.id,64),name:clean(ch.name,100),lore:clean(ch.lore,5000),
   imageUrl:safeUrl(ch.imageUrl),status:ch.status==='draft'?'draft':'published'
 })).filter(ch=>ch.id&&ch.name):[];
 return {version:1,operations,characters:chars};
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
function imageMarkup(url,alt,cls){
 const safe=safeUrl(url);
 return safe?'<img class="'+cls+'" loading="lazy" src="'+esc(safe)+'" alt="'+esc(alt)+'">':'<span class="dcxStoryImageFallback" aria-hidden="true">DCX</span>';
}
function statusLabel(o){return o.status==='draft'?'RASCUNHO':'PUBLICADA'}
function playerOperations(){
 const list=$('dcxMissionsList');if(!list)return;
 const visible=studio.operations.filter(o=>o.status==='published');
 list.innerHTML=visible.length?visible.map(o=>'<button class="dcxMissionTile dcxStoryMissionTile" type="button" data-mission-open="'+esc(o.id)+'">'+
   '<span class="dcxStoryTileArt">'+imageMarkup(o.imageUrl,o.title,'dcxStoryTileImage')+'</span>'+
   '<span class="dcxMissionTileInfo"><small>'+esc(o.code||'MISSÃO DCX')+' // '+esc(statusLabel(o))+'</small><strong>'+esc(o.title)+'</strong><span>'+esc(o.summary||'Acesse os arquivos desta operação.')+'</span></span>'+
   '<span class="dcxMissionTileAction">ABRIR <b aria-hidden="true">›</b></span></button>').join(''):'<div class="dcxStoryEmpty">Nenhuma missão publicada.</div>';
}
function playerCharacters(){
 const list=$('dcxCharacterGrid');if(!list)return;
 const chars=studio.characters.filter(ch=>ch.status==='published');
 list.innerHTML=chars.length?chars.map(ch=>'<article class="dcxCharacterCard"><div class="dcxCharacterArt">'+imageMarkup(ch.imageUrl,ch.name,'dcxCharacterImage')+'</div>'+
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
   '<div class="dcxStoryPrep '+(p.done?'isDone':'')+'"><span>'+String(i+1).padStart(2,'0')+'</span><div><b>'+esc(p.title)+'</b><p>'+esc(p.description)+'</p></div><em>'+ (p.done?'CONCLUÍDA':'PENDENTE')+'</em></div>').join(''):'<p class="dcxStoryMuted">As preparações desta missão ainda não foram personalizadas.</p>';
}
function objectiveMarkup(op){return op.objectives.length?op.objectives.map((x,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(x)+'</li>').join(''):'<li>Objetivos ainda não definidos.</li>'}
function heroMarkup(op){
 return '<header class="dcxStoryMissionHero"'+(op.imageUrl?' style="background-image:linear-gradient(90deg,rgba(4,13,21,.98),rgba(4,13,21,.68)),url(&quot;'+esc(op.imageUrl)+'&quot;)"':'')+'>'+
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
   '<div class="dcxStoryInfoColumns"><section><h3>OBJETIVOS</h3><ol>'+objectiveMarkup(op)+'</ol></section>'+
   '<section><h3>PREPARAÇÕES ADICIONAIS</h3>'+prepMarkup(op)+'</section></div>';
   const detail=$('dcxMissionDetail');if(detail){detail.querySelector('.dcxMissionDetailHead strong').textContent=op.title}
 }else if(dynamic){
   dynamic.innerHTML='<header class="dcxMissionDetailHead"><button class="dcxMissionBack" type="button">‹ TODAS AS MISSÕES</button><div><small>MISSÕES // '+esc(op.code||'ARQUIVO DCX')+'</small><strong>'+esc(op.title)+'</strong></div></header>'+
    heroMarkup(op)+'<div class="dcxStoryInfoColumns dcxStoryDynamicColumns">'+
    '<section><h3>OBJETIVOS</h3><ol>'+objectiveMarkup(op)+'</ol></section>'+
    '<section><h3>PREPARAÇÕES <small>'+op.preparations.filter(p=>p.done).length+'/'+op.preparations.length+' CONCLUÍDAS</small></h3>'+prepMarkup(op)+'</section></div>';
 }
}
function renderPlayer(){
 playerOperations();playerCharacters();
 const openDetail=$('dcxMissionDetail');
 if(openDetail&&!openDetail.hidden)renderMission('operacao-h');
 if($('dcxMissionDynamic')&&!$('dcxMissionDynamic').hidden)renderMission(currentMission);
}
function hostOperations(){
 const list=$('kmStudioOperations');if(!list)return;
 list.innerHTML=studio.operations.map(op=>'<button class="kmStudioListItem '+(opEditing===op.id?'selected':'')+'" type="button" data-edit-op="'+esc(op.id)+'">'+
  '<span>'+esc(op.code||'MISSÃO')+'</span><b>'+esc(op.title)+'</b><small>'+esc(statusLabel(op))+' · '+op.preparations.length+' PREPARAÇÕES</small></button>').join('');
}
function hostCharacters(){
 const list=$('kmStudioCharacters');if(!list)return;
 list.innerHTML=studio.characters.length?studio.characters.map(ch=>
  '<button class="kmStudioListItem '+(charEditing===ch.id?'selected':'')+'" data-edit-character="'+esc(ch.id)+'" type="button"><span>PERSONAGEM</span><b>'+esc(ch.name)+'</b><small>'+esc(statusLabel(ch))+'</small></button>').join(''):'<div class="kmStudioEmpty">Nenhum personagem cadastrado.</div>';
}
function renderPrepInputs(items){
 const box=$('kmStudioPrepRows');if(!box)return;
 box.innerHTML=(items||[]).map((p,i)=>'<div class="kmStudioPrepRow" data-prep-id="'+esc(p.id)+'"><div class="kmStudioPrepRowHead"><strong>PREPARAÇÃO '+(i+1)+'</strong><button type="button" data-remove-prep="'+esc(p.id)+'">REMOVER</button></div>'+
 '<label>NOME<input data-prep-title maxlength="120" value="'+esc(p.title)+'" required></label>'+
 '<label>DESCRIÇÃO<textarea data-prep-description rows="2" maxlength="600">'+esc(p.description)+'</textarea></label>'+
 '<label class="kmStudioCheckbox"><input type="checkbox" data-prep-done '+(p.done?'checked':'')+'> CONCLUÍDA</label></div>').join('');
}
function readPrepInputs(){
 return [...document.querySelectorAll('#kmStudioPrepRows .kmStudioPrepRow')].map(row=>({
  id:row.dataset.prepId,title:clean(row.querySelector('[data-prep-title]')?.value,120),
  description:clean(row.querySelector('[data-prep-description]')?.value,600),done:!!row.querySelector('[data-prep-done]')?.checked
 })).filter(p=>p.title);
}
function loadOp(){
 const op=studio.operations.find(v=>v.id===opEditing)||{id:'',title:'',code:'',summary:'',imageUrl:'',status:'draft',objectives:[],preparations:[]};
 if($('kmStudioOpTitle'))$('kmStudioOpTitle').value=op.title;
 if($('kmStudioOpCode'))$('kmStudioOpCode').value=op.code;
 if($('kmStudioOpSummary'))$('kmStudioOpSummary').value=op.summary;
 if($('kmStudioOpImage'))$('kmStudioOpImage').value=op.imageUrl;
 if($('kmStudioOpPublic'))$('kmStudioOpPublic').checked=op.status==='published';
 if($('kmStudioOpObjectives'))$('kmStudioOpObjectives').value=op.objectives.join('\n');
 if($('kmStudioOpDelete'))$('kmStudioOpDelete').hidden=op.id==='operacao-h';
 renderPrepInputs(op.preparations);
 opDirty=false;
}
function loadChar(){
 const ch=studio.characters.find(v=>v.id===charEditing)||{name:'',lore:'',imageUrl:'',status:'draft'};
 if($('kmStudioCharName'))$('kmStudioCharName').value=ch.name;
 if($('kmStudioCharLore'))$('kmStudioCharLore').value=ch.lore;
 if($('kmStudioCharImage'))$('kmStudioCharImage').value=ch.imageUrl;
 if($('kmStudioCharPublic'))$('kmStudioCharPublic').checked=ch.status==='published';
 if($('kmStudioCharDelete'))$('kmStudioCharDelete').hidden=!charEditing;
 charDirty=false;renderCharPreview();
}
function renderCharPreview(){
 const p=$('kmStudioCharPreview');if(!p)return;
 p.innerHTML='<div class="dcxCharacterArt">'+imageMarkup($('kmStudioCharImage')?.value||'',$('kmStudioCharName')?.value||'Personagem','dcxCharacterImage')+'</div>'+
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
function selectOp(opid){opEditing=opid;opDirty=false;hostOperations();loadOp()}
function selectChar(chid){charEditing=chid;charDirty=false;hostCharacters();loadChar()}
async function saveOperation(){
 const title=clean($('kmStudioOpTitle')?.value,100);
 if(!title)return notify('INFORME O TÍTULO DA MISSÃO');
 const code=clean($('kmStudioOpCode')?.value,50)||'MISSÃO DCX';
 const imageRaw=clean($('kmStudioOpImage')?.value,1900),imageUrl=safeUrl(imageRaw);
 if(imageRaw&&!imageUrl)return notify('LINK DE IMAGEM INVÁLIDO — USE HTTPS OU UM ARQUIVO PNG/JPG');
 const item={id:opEditing||id('mission'),title,code,summary:clean($('kmStudioOpSummary')?.value,1200),
  imageUrl,status:$('kmStudioOpPublic')?.checked?'published':'draft',
  objectives:String($('kmStudioOpObjectives')?.value||'').split('\n').map(x=>clean(x,240)).filter(Boolean),
  preparations:readPrepInputs()};
 const operations=studio.operations.filter(v=>v.id!==item.id).concat(item);
 if(await publish({...studio,operations},'MISSÃO SALVA E SINCRONIZADA')){
  opEditing=item.id;opDirty=false;renderHost();
 }
}
async function deleteOperation(){
 if(opEditing==='operacao-h')return notify('O DOSSIÊ ORIGINAL DA OPERAÇÃO H É PRESERVADO');
 const op=studio.operations.find(v=>v.id===opEditing);if(!op)return;
 if(!confirm('Excluir a missão "'+op.title+'"? Esta ação afeta todos os jogadores.'))return;
 const operations=studio.operations.filter(v=>v.id!==opEditing);
 if(await publish({...studio,operations},'MISSÃO EXCLUÍDA')){
  opEditing='operacao-h';opDirty=false;renderHost();
 }
}
async function saveCharacter(){
 const name=clean($('kmStudioCharName')?.value,100);
 if(!name)return notify('INFORME O NOME DO PERSONAGEM');
 const imageRaw=clean($('kmStudioCharImage')?.value,1900),imageUrl=safeUrl(imageRaw);
 if(imageRaw&&!imageUrl)return notify('LINK DE IMAGEM INVÁLIDO — USE HTTPS OU UM ARQUIVO PNG/JPG');
 const item={id:charEditing||id('character'),name,lore:clean($('kmStudioCharLore')?.value,5000),
 imageUrl,status:$('kmStudioCharPublic')?.checked?'published':'draft'};
 const characters=studio.characters.filter(v=>v.id!==item.id).concat(item);
 if(await publish({...studio,characters},'PERSONAGEM PUBLICADO NA SALA')){
  charEditing=item.id;charDirty=false;renderHost();
 }
}
async function deleteCharacter(){
 const ch=studio.characters.find(v=>v.id===charEditing);if(!ch)return;
 if(!confirm('Excluir "'+ch.name+'"? Todos os jogadores perderão acesso ao card.'))return;
 const characters=studio.characters.filter(v=>v.id!==charEditing);
 if(await publish({...studio,characters},'PERSONAGEM EXCLUÍDO')){
  charEditing=null;charDirty=false;renderHost();
 }
}
function bindHost(){
 $('kmStudioNewOp')?.addEventListener('click',()=>{opEditing=null;opDirty=false;hostOperations();loadOp();$('kmStudioOpTitle')?.focus()});
 $('kmStudioNewChar')?.addEventListener('click',()=>{charEditing=null;charDirty=false;hostCharacters();loadChar();$('kmStudioCharName')?.focus()});
 $('kmStudioOpSave')?.addEventListener('click',saveOperation);
 $('kmStudioOpDelete')?.addEventListener('click',deleteOperation);
 $('kmStudioCharSave')?.addEventListener('click',saveCharacter);
 $('kmStudioCharDelete')?.addEventListener('click',deleteCharacter);
 $('kmStudioAddPrep')?.addEventListener('click',()=>{
  const current=readPrepInputs();current.push({id:id('prep'),title:'',description:'',done:false});
  renderPrepInputs(current);opDirty=true;
  document.querySelector('#kmStudioPrepRows .kmStudioPrepRow:last-child [data-prep-title]')?.focus();
 });
 $('kmStudioPrepRows')?.addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-prep]');if(!remove)return;
  const list=readPrepInputs().filter(p=>p.id!==remove.dataset.removePrep);
  renderPrepInputs(list);opDirty=true;
 });
 $('kmStudioOperations')?.addEventListener('click',e=>{const b=e.target.closest('[data-edit-op]');if(b)selectOp(b.dataset.editOp)});
 $('kmStudioCharacters')?.addEventListener('click',e=>{const b=e.target.closest('[data-edit-character]');if(b)selectChar(b.dataset.editCharacter)});
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
window.DCX.StoryStudio={renderMission,get operations(){return studio.operations.slice()},get characters(){return studio.characters.slice()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
