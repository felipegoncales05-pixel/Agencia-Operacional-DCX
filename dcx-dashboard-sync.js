(()=>{
'use strict';
const $=id=>document.getElementById(id);
const isHost=()=>/keymaster\.html$/i.test(location.pathname);
const defaults={eyebrow:'DCX // CRÔNICAS DO TEMPO',title:'CRÔNICAS DO TEMPO',subtitle:'Operações, comunicação e arquivos da DCX em uma única central.',imageUrl:'',imageFrame:{}};
let db=null,room='FRIA-01',dashboardRef=null,refs=[],state={...defaults};
function rt(){return window.OPH?.Realtime}
function context(){const r=rt(),auth=r?.getFirebaseAuth?.(),database=r?.getFirebaseDatabase?.();if(!auth?.currentUser||!database)return null;return{auth,db:database,room:r?.getRoom?.()||new URLSearchParams(location.search).get('room')||window.OPH_CONFIG?.defaultRoom||'FRIA-01'}}
function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function clean(v,max){return String(v||'').trim().replace(/\s+/g,' ').slice(0,max)}
function applyPlayerDashboard(v){state={...defaults,...(v||{})};const eyebrow=$('dcxDashHeroEyebrow'),title=$('dcxDashHeroTitle'),subtitle=$('dcxDashHeroSubtitle'),art=$('dcxDashHeroArt');if(eyebrow)eyebrow.textContent=state.eyebrow||defaults.eyebrow;if(title)title.textContent=state.title||defaults.title;if(subtitle)subtitle.textContent=state.subtitle||defaults.subtitle;if(art){
 const markup=window.DCX?.ImageTools?.frame(state.imageUrl,state.imageFrame,'Capa da Central de Operações','dcxDashHeroFramed');
 art.style.backgroundImage='none';art.innerHTML=markup+(markup?'<div class="dcxImageDim" style="opacity:'+((window.DCX?.ImageTools?.normalize(state.imageFrame).dim||0)/100)+'"></div>':'');
 art.classList.toggle('hasImage',!!markup);
}}
function openKm(tab){if(tab==='polls'){window.DCX?.Polls?.openAdmin?.();return}window.DCX?.Admin?.switchTab?.(tab)}
function hostHtml(){return [
'<div class="kmCommandHero"><div><span class="tag">DCX // KEYMASTER COMMAND</span><h1>CENTRO DE OPERAÇÕES</h1><p>Atalhos das funções reais do Keymaster, status da sala e controle visual do terminal dos jogadores.</p></div><div class="kmCommandSignal"><i></i><b>LINK ADMINISTRATIVO</b><small id="kmCommandRoom">SALA // —</small></div></div>',
'<div class="kmCommandGrid">',
'<button data-km-open="missions"><span>⌁</span><b>MISSÕES</b><small>Criar operações e preparações.</small></button>',
'<button data-km-open="characters"><span>◈</span><b>PERSONAGENS</b><small>Dossiês, lore e imagens.</small></button>',
'<button data-km-open="operation"><span>H</span><b>OPERAÇÃO H</b><small>Etapas e controles originais.</small></button>',
'<button data-km-open="players"><span>◎</span><b>PLAYER DATA</b><small id="kmDashPlayers">0 PARTICIPANTES</small></button>',
'<button data-km-open="teams"><span>▦</span><b>EQUIPES</b><small id="kmDashTeams">0 EQUIPES</small></button>',
'<button data-km-open="handouts"><span>▤</span><b>HANDOUTS</b><small id="kmDashHandouts">0 PUBLICADOS</small></button>',
'<button data-km-open="polls"><span>✓</span><b>VOTAÇÕES</b><small id="kmDashPolls">0 ATIVAS</small></button>',
'<button data-km-open="yumiya"><span>YK</span><b>YUMIYA</b><small>REMOTE // MANUAL</small></button>',
'<button data-km-open="credentials"><span>ID</span><b>CREDENCIAIS</b><small>Operadores e NPCs.</small></button>',
'<button data-km-open="settings"><span>⚙</span><b>CONFIGURAÇÕES</b><small>HUD, temas e preferências.</small></button>',
'</div>',
'<div class="kmPlayerHeroEditor"><header><div><span class="tag">PLAYER // HERO CONTROL</span><h2>CAPA DO CENTRO DE OPERAÇÕES</h2><p>Este conteúdo é sincronizado pelo Firebase e aparece para todos os jogadores conectados.</p></div><span class="kmSyncPill">RTDB // LIVE</span></header>',
'<div class="kmHeroEditorGrid"><label>LINHA SUPERIOR<input id="kmHeroEyebrow" placeholder="DCX // CRÔNICAS DO TEMPO"></label><label>TÍTULO<input id="kmHeroTitle" placeholder="CRÔNICAS DO TEMPO"></label><label class="wide">SUBTÍTULO<textarea id="kmHeroSubtitle" rows="3" placeholder="Texto exibido abaixo do título."></textarea></label><label class="wide">IMAGEM DO HERO<input id="kmHeroImageUrl" placeholder="URL ou caminho do repositório, ex.: arte-cronicas.jpg"><small>Sem Storage: use uma URL pública ou um arquivo já existente no GitHub.</small></label></div>',
'<div class="dcxImageEditor" data-image-editor-for="kmHeroImageUrl"></div><div class="kmHeroEditorActions"><button class="btn" id="kmHeroReset" type="button">RESTAURAR TEXTO PADRÃO</button><button class="btn gold" id="kmHeroSave" type="button">PUBLICAR NO PLAYER</button></div></div>'
].join('')}
function injectHostDashboard(){const master=document.querySelector('[data-km-view="master"] .kmSingle');if(!master||$('kmCommandCenter'))return;const wrap=document.createElement('section');wrap.id='kmCommandCenter';wrap.className='kmCommandCenter';wrap.innerHTML=hostHtml();master.prepend(wrap);wrap.querySelectorAll('[data-km-open]').forEach(b=>b.addEventListener('click',()=>openKm(b.dataset.kmOpen)));$('kmHeroSave')?.addEventListener('click',saveHostDashboard);$('kmHeroReset')?.addEventListener('click',()=>{$('kmHeroEyebrow').value=defaults.eyebrow;$('kmHeroTitle').value=defaults.title;$('kmHeroSubtitle').value=defaults.subtitle;$('kmHeroImageUrl').value='';window.DCX?.ImageTools?.set('kmHeroImageUrl',{})})}
function syncHostFields(v){state={...defaults,...(v||{})};if($('kmHeroEyebrow'))$('kmHeroEyebrow').value=state.eyebrow||'';if($('kmHeroTitle'))$('kmHeroTitle').value=state.title||'';if($('kmHeroSubtitle'))$('kmHeroSubtitle').value=state.subtitle||'';if($('kmHeroImageUrl'))$('kmHeroImageUrl').value=state.imageUrl||'';window.DCX?.ImageTools?.attach('kmHeroImageUrl',state.imageFrame);if($('kmCommandRoom'))$('kmCommandRoom').textContent='SALA // '+room}
async function saveHostDashboard(){if(!dashboardRef)return toast('DASHBOARD // FIREBASE NÃO PRONTO');const next={eyebrow:clean($('kmHeroEyebrow')?.value||defaults.eyebrow,80),title:clean($('kmHeroTitle')?.value||defaults.title,120),subtitle:String($('kmHeroSubtitle')?.value||defaults.subtitle).trim().slice(0,420),imageUrl:String($('kmHeroImageUrl')?.value||'').trim().slice(0,1900),imageFrame:window.DCX?.ImageTools?.read('kmHeroImageUrl'),updatedAt:firebase.database.ServerValue.TIMESTAMP,updatedBy:'KEYMASTER'};try{await dashboardRef.update(next);toast('HERO DO PLAYER // PUBLICADO')}catch(e){console.error(e);toast('HERO DO PLAYER // ERRO')}}
function countObj(v){return Object.keys(v||{}).filter(k=>k!=='_init').length}
function bindHostMetrics(){const base='rooms/'+room+'/dcx';const bind=(path,cb)=>{const r=db.ref(base+'/'+path);r.on('value',s=>cb(s.val()||{}));refs.push(r)};bind('operators',v=>{const n=Object.entries(v).filter(([k,o])=>k!=='_init'&&(o?.identity?.type||'player')!=='npc').length;if($('kmDashPlayers'))$('kmDashPlayers').textContent=n+' PARTICIPANTES'});bind('teams',v=>{const n=countObj(v);if($('kmDashTeams'))$('kmDashTeams').textContent=n+' EQUIPES'});bind('meta/publicPolls',v=>{const n=Object.values(v||{}).filter(p=>p&&p.status!=='archived'&&p.status!=='closed').length;if($('kmDashPolls'))$('kmDashPolls').textContent=n+' ATIVAS'});bind('handouts/public',v=>{const n=Object.values(v||{}).filter(h=>h&&!h.archived).length;if($('kmDashHandouts'))$('kmDashHandouts').textContent=n+' PUBLICADOS'})}
async function init(){if(isHost())injectHostDashboard();const ctx=context();if(!ctx){setTimeout(init,700);return}db=ctx.db;room=ctx.room;dashboardRef=db.ref('rooms/'+room+'/dcx/meta/dashboard');if(isHost()){injectHostDashboard();syncHostFields();dashboardRef.on('value',s=>syncHostFields(s.val()||{}));refs.push(dashboardRef);bindHostMetrics()}else{dashboardRef.on('value',s=>applyPlayerDashboard(s.val()||{}));refs.push(dashboardRef)}console.info('[DCX OS] DASHBOARD SYNC // FIREBASE META READY',{role:isHost()?'host':'player',room})}
window.DCX=window.DCX||{};window.DCX.DashboardSync={applyPlayerDashboard,saveHostDashboard,get state(){return{...state}}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();