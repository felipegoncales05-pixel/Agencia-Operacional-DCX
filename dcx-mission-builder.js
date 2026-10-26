/* Mission Builder: Keymaster owns content; players interact only through their request path. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),host=/keymaster\.html$/i.test(location.pathname);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(x,n=500)=>String(x??'').trim().slice(0,n);
const uid=()=>('m-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
const symbols=['◎','◆','◇','▣','▤','⌁','⚙','⚡','✦','✧','✚','✖','✎','⚑','◈','◉','⬡','♜','♞','☰','⌖','⛨','☢','✶'];
const symbolOptions=selected=>symbols.map(s=>'<option value="'+esc(s)+'" '+(s===selected?'selected':'')+'>'+esc(s)+'</option>').join('');
let active=null,selectedModule=null,dirty=false,playerMission=null,currentModule=null,requests={},pendingLocal={};
const findModule=()=>active?.modules?.find(m=>m.id===selectedModule);
function readEditor(){
 const rows=[...document.querySelectorAll('#kmMissionModuleList [data-module-id]')];
 const collected=rows.map(x=>JSON.parse(x.dataset.moduleJson||'{}'));
 const now=findModule();
 if(!now)return collected;
 const form=$('kmMissionModuleForm');if(!form)return collected;
 const item={...now,title:clean($('kmMissionModuleTitle')?.value,120),
 subtitle:clean($('kmMissionModuleSubtitle')?.value,160),body:clean($('kmMissionModuleBody')?.value,6500),
 imageUrl:clean($('kmMissionModuleImage')?.value,1900),imageFrame:window.DCX?.ImageTools?.read('kmMissionModuleImage'),symbol:clean($('kmMissionModuleSymbol')?.value,16),
 type:$('kmMissionModuleType')?.value||'briefing',published:!!$('kmMissionModulePublished')?.checked,
 options:String($('kmMissionModuleOptions')?.value||'').split('\n').map(x=>clean(x,180)).filter(Boolean)};
 return collected.map(m=>m.id===item.id?item:m);
}
function saveEditing(){if(active)active.modules=readEditor()}
function moduleRows(){const list=$('kmMissionModuleList');if(!list||!active)return;
 list.innerHTML=active.modules.map((m,i)=>'<div class="kmMissionModuleLine '+(m.id===selectedModule?'selected':'')+'" data-module-id="'+esc(m.id)+'" data-module-json="'+esc(JSON.stringify(m))+'"><div><span>'+esc(m.symbol||'◎')+'</span><b>'+esc(m.title||'SEM TÍTULO')+'</b><small>'+esc(m.type.toUpperCase())+(m.published?' · VISÍVEL':' · OCULTO')+'</small></div><div><button type="button" data-select-module="'+esc(m.id)+'">EDITAR</button><button type="button" data-move-module="'+esc(m.id)+'" data-direction="-1" aria-label="Subir">↑</button><button type="button" data-move-module="'+esc(m.id)+'" data-direction="1" aria-label="Descer">↓</button><button type="button" data-remove-module="'+esc(m.id)+'">×</button></div></div>').join('')||'<p class="kmStudioEmpty">Adicione um módulo de briefing, dossiê, preparações ou escolhas.</p>';
}
function loadModule(){
 const m=findModule(),form=$('kmMissionModuleForm');
 if(form)form.hidden=!m;
 if(!m)return;
 $('kmMissionModuleTitle').value=m.title||'';
 $('kmMissionModuleSubtitle').value=m.subtitle||'';
 $('kmMissionModuleBody').value=m.body||'';
 $('kmMissionModuleImage').value=m.imageUrl||'';
 window.DCX?.ImageTools?.attach('kmMissionModuleImage',m.imageFrame);
 $('kmMissionModuleSymbol').innerHTML=symbolOptions(m.symbol||'◎');
 $('kmMissionModuleType').value=m.type||'briefing';
 $('kmMissionModulePublished').checked=m.published!==false;
 $('kmMissionModuleOptions').value=(m.options||[]).join('\n');
 $('kmMissionOptionWrap').hidden=m.type!=='choice';
 $('kmMissionModuleHelp').textContent=m.type==='preparations'?'Este módulo mostra as preparações configuradas acima.':m.type==='choice'?'Escolhas são enviadas ao Keymaster para avaliação.':'Conteúdo publicado como documento da missão.';
}
function renderEditor(op){
 active=structuredClone({modules:op?.modules||[]});
 selectedModule=active.modules[0]?.id||null;dirty=false;
 moduleRows();loadModule();
}
function readModules(){saveEditing();return active?.modules||[]}
function addModule(){
 saveEditing();
 const m={id:uid(),title:'Novo módulo',subtitle:'',body:'',imageUrl:'',imageFrame:{},symbol:'◎',type:'briefing',published:true,options:[]};
 active??={modules:[]};active.modules.push(m);selectedModule=m.id;moduleRows();loadModule();dirty=true;markDirty();
}
function markDirty(){const form=$('kmStudioOpForm');form?.dispatchEvent(new Event('input',{bubbles:true}))}
function bindHost(){
 $('kmMissionAddModule')?.addEventListener('click',addModule);
 $('kmMissionModuleList')?.addEventListener('click',e=>{
  const sel=e.target.closest('[data-select-module]'),remove=e.target.closest('[data-remove-module]'),move=e.target.closest('[data-move-module]');
  if(!sel&&!remove&&!move)return;
  saveEditing();
  if(sel)selectedModule=sel.dataset.selectModule;
  if(remove){if(!confirm('Remover este módulo da missão? A remoção será publicada ao salvar.'))return;
   active.modules=active.modules.filter(m=>m.id!==remove.dataset.removeModule);
   selectedModule=active.modules[0]?.id||null;markDirty()}
  if(move){const i=active.modules.findIndex(m=>m.id===move.dataset.moveModule),j=i+Number(move.dataset.direction);
   if(i>=0&&j>=0&&j<active.modules.length){[active.modules[i],active.modules[j]]=[active.modules[j],active.modules[i]];markDirty()}}
  moduleRows();loadModule();
 });
 $('kmMissionModuleForm')?.addEventListener('input',()=>{dirty=true;markDirty()});
 $('kmMissionModuleType')?.addEventListener('change',e=>{
  $('kmMissionOptionWrap').hidden=e.target.value!=='choice';dirty=true;markDirty();
 });
}
function moduleGrid(op,legacy=false){
 const entries=(op.modules||[]).filter(m=>m.published);
 if(!entries.length)return '';
 return '<div class="dcxStorySectionHeading"><div><small>DCX // ARQUIVOS CRIADOS PELO KEYMASTER</small><h2>MÓDULOS DA OPERAÇÃO</h2></div><span>'+entries.length+' SETORES</span></div>'+
 '<div class="dcxStoryModules dcxCustomModules">'+entries.map(m=>
 '<button type="button" class="dcxStoryModule" data-open-mission-module="'+esc(op.id)+'" data-module-ref="'+esc(m.id)+'"><span>'+esc(m.symbol||'◎')+'</span><div><b>'+esc(m.title)+'</b><small>'+esc(m.subtitle||m.type.toUpperCase())+'</small></div><em>ABRIR ›</em></button>').join('')+'</div>';
}
function loadLocal(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
function localKey(missionId){return 'dcx-mission-local-'+(OPH.Realtime.getRoom()||'LOCAL')+'-'+missionId}
function showModule(missionId,moduleId){
 const op=window.DCX?.StoryStudio?.operations?.find(o=>o.id===missionId&&o.status==='published');
 const m=op?.modules?.find(v=>v.id===moduleId&&v.published);if(!m)return;
 playerMission=missionId;currentModule=moduleId;
 const overlay=$('dcxMissionModuleOverlay');if(!overlay)return;
 $('dcxModuleModalTitle').textContent=m.title;
 $('dcxModuleModalSymbol').textContent=m.symbol||'◎';
 $('dcxModuleModalType').textContent=m.subtitle||m.type.toUpperCase();
 $('dcxModuleModalBody').textContent=m.body||'Sem informações adicionais.';
 const image=$('dcxModuleModalImage');image.replaceChildren();
 const framed=window.DCX?.ImageTools?.frame(m.imageUrl,m.imageFrame,m.title,'dcxMissionModalImg');
 if(framed){image.innerHTML=framed;image.hidden=false}else image.hidden=true;
 const actions=$('dcxModuleModalActions');actions.innerHTML='';
 if(m.type==='preparations'){
  const local=loadLocal(localKey(op.id));
  const items=op.preparations||[];
  actions.innerHTML=items.length?items.map(p=>{
   const status=p.done?'CONCLUÍDA PELO KEYMASTER':p.interaction==='request'?'SOLICITAR CONCLUSÃO':p.interaction==='local'?'CHECKLIST PESSOAL':'SOMENTE LEITURA';
   return '<div class="dcxMissionPrepAction"><span>'+esc(p.symbol||'◎')+'</span><div><b>'+esc(p.title)+'</b><p>'+esc(p.description)+'</p><small>'+esc(status)+'</small></div>'+
   (p.done?'<strong>✓</strong>':p.interaction==='local'?'<button data-local-prep="'+esc(p.id)+'" aria-pressed="'+!!local[p.id]+'">'+(local[p.id]?'✓ MARCADO':'MARCAR PARA MIM')+'</button>':p.interaction==='request'?'<button data-request-prep="'+esc(p.id)+'">ENVIAR PEDIDO</button>':'')+'</div>';
  }).join(''):'<p>Sem preparações publicadas.</p>';
 }else if(m.type==='choice'){
  actions.innerHTML='<p class="dcxMissionChoiceIntro">Sua escolha será enviada ao Keymaster e não muda a missão sem a aprovação dele.</p>'+
   (m.options||[]).map((v,i)=>'<button type="button" data-module-choice="'+i+'">'+esc(v)+'</button>').join('');
 }
 overlay.hidden=false;$('dcxModuleModalClose')?.focus();
}
async function sendInteraction(kind,value){
 const op=window.DCX?.StoryStudio?.operations?.find(o=>o.id===playerMission&&o.status==='published');
 const module=op?.modules?.find(x=>x.id===currentModule&&x.published);
 if(!op||!module)return;
 if(kind==='choice'&&(module.type!=='choice'||!module.options.includes(value)))return;
 if(kind==='prep'&&(module.type!=='preparations'||!op.preparations.some(p=>p.id===value&&p.interaction==='request'&&!p.done)))return;
 const btns=document.querySelectorAll('#dcxModuleModalActions button');btns.forEach(b=>b.disabled=true);
 const msg={missionId:op.id,moduleId:module.id,type:kind,value,
 missionTitle:clean(op.title,100),moduleTitle:clean(module.title,120),createdAt:Date.now()};
 try{
  const auth=OPH.Realtime.getFirebaseAuth?.(),db=OPH.Realtime.getFirebaseDatabase?.(),room=OPH.Realtime.getRoom?.(),u=auth?.currentUser?.uid;
  if(!db||!room||!u||OPH.Realtime.getMode?.()!=='firebase')throw Error('O envio requer uma sala Firebase conectada.');
  await db.ref('rooms/'+room+'/requests/'+u+'/missionActions').push().set(msg);
  $('dcxModuleModalStatus').textContent='SOLICITAÇÃO ENVIADA AO KEYMASTER';
 }catch(e){$('dcxModuleModalStatus').textContent='NÃO FOI POSSÍVEL ENVIAR: '+e.message}
 finally{btns.forEach(b=>b.disabled=false)}
}
function bindPlayer(){
 document.querySelector('#workspaceGolpe')?.addEventListener('click',e=>{
  const b=e.target.closest('[data-open-mission-module]');if(b)showModule(b.dataset.openMissionModule,b.dataset.moduleRef);
 });
 $('dcxModuleModalClose')?.addEventListener('click',()=>{$('dcxMissionModuleOverlay').hidden=true});
 $('dcxMissionModuleOverlay')?.addEventListener('click',e=>{
  if(e.target.id==='dcxMissionModuleOverlay')$('dcxMissionModuleOverlay').hidden=true;
 });
 $('dcxModuleModalActions')?.addEventListener('click',e=>{
  const local=e.target.closest('[data-local-prep]'),request=e.target.closest('[data-request-prep]'),choice=e.target.closest('[data-module-choice]');
  if(local){const key=localKey(playerMission),v=loadLocal(key);v[local.dataset.localPrep]=!v[local.dataset.localPrep];localStorage.setItem(key,JSON.stringify(v));showModule(playerMission,currentModule)}
  else if(request)sendInteraction('prep',request.dataset.requestPrep);
  else if(choice){
   const op=window.DCX?.StoryStudio?.operations?.find(o=>o.id===playerMission);
   const mod=op?.modules?.find(m=>m.id===currentModule);
   const value=mod?.options?.[Number(choice.dataset.moduleChoice)];if(value)sendInteraction('choice',value);
  }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('dcxMissionModuleOverlay')&&!$('dcxMissionModuleOverlay').hidden)$('dcxMissionModuleOverlay').hidden=true});
}
function renderInbox(){
 const box=$('kmMissionRequests');if(!box)return;
 const tasks=Object.entries(requests).flatMap(([owner,v])=>Object.entries(v?.missionActions||{}).map(([id,a])=>({...a,owner,id}))).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 box.innerHTML=tasks.length?tasks.map(a=>'<article class="kmMissionInboxItem"><div><small>'+esc(a.missionTitle||'MISSÃO')+' // '+esc(a.moduleTitle||'MÓDULO')+'</small><b>'+(a.type==='choice'?'ESCOLHA':'PEDIDO DE PREPARAÇÃO')+'</b><p>'+esc(a.type==='choice'?a.value:(window.DCX?.StoryStudio?.operations?.find(o=>o.id===a.missionId)?.preparations?.find(p=>p.id===a.value)?.title||'PREPARAÇÃO'))+'</p><small>JOGADOR: '+esc(a.owner.slice(0,10))+'</small></div><div><button data-mission-accept="'+esc(a.id)+'" data-owner="'+esc(a.owner)+'">ACEITAR</button><button data-mission-dismiss="'+esc(a.id)+'" data-owner="'+esc(a.owner)+'">DISPENSAR</button></div></article>').join(''):'<p class="kmStudioEmpty">Nenhuma solicitação pendente.</p>';
}
async function resolveTask(owner,requestId,accept){
 const a=requests?.[owner]?.missionActions?.[requestId];if(!a)return;
 const auth=OPH.Realtime.getFirebaseAuth?.(),db=OPH.Realtime.getFirebaseDatabase?.(),room=OPH.Realtime.getRoom?.();
 if(!auth?.currentUser||!db||!room)return;
 try{
  if(accept&&a.type==='prep'){
   const ok=await window.DCX.StoryStudio.completePreparation(a.missionId,a.value);
   if(!ok)throw Error('Não foi possível concluir a preparação.');
  }
  await db.ref('rooms/'+room+'/requests/'+owner+'/missionActions/'+requestId).remove();
 }catch(e){console.error(e);alert('Ação não concluída: '+e.message)}
}
function inbox(){
 if(!host)return;
 OPH.Realtime.onRequests(v=>{requests=v||{};renderInbox()});
 $('kmMissionRequests')?.addEventListener('click',e=>{
  const b=e.target.closest('[data-mission-accept],[data-mission-dismiss]');if(!b)return;
  resolveTask(b.dataset.owner,b.dataset.missionAccept||b.dataset.missionDismiss,!!b.dataset.missionAccept);
 });
}
function init(){host?(bindHost(),inbox()):bindPlayer()}
window.DCX=window.DCX||{};window.DCX.MissionBuilder={renderEditor,readModules,moduleGrid,symbolOptions};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();