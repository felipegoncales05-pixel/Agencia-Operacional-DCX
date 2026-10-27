/* DCX VISUAL COMMAND 2026 // keymaster sidebar + HUD + display modes; local only. */
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname);
const STORAGE='dcx-visual-command-v1';
const FX=['off','retro','oldpc','vhs'];
const $=id=>document.getElementById(id);
const q=s=>document.querySelector(s);
const safeText=(v,f='—')=>{const s=String(v||'').trim();return s||f};
function read(){
 try{
  const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');
  return {
   fx:FX.includes(v.fx)?v.fx:'off',
   level:[1,2,3].includes(Number(v.level))?Number(v.level):2,
   hud:v.hud!==false,
   sidebar:v.sidebar==='slim'?'slim':'wide'
  };
 }catch{return {fx:'off',level:2,hud:true,sidebar:'wide'}}
}
let preferences=read(),settings=[],hudCards=[],layout=null,nav=null;
const icons={'tactical-map':'⌖',master:'◈',operation:'⌘',missions:'➤',characters:'◇',soundtrack:'♫',players:'◉',teams:'▦',credentials:'▣',polls:'✓',handouts:'▤',notes:'✎',yumiya:'YK',typography:'Aa',settings:'⚙'};
const groups=[
 {name:'CENTRO DE COMANDO',items:['master','operation','missions','tactical-map','characters','soundtrack']},
 {name:'GESTÃO DE AGENTES',items:['players','teams','credentials','polls']},
 {name:'ARQUIVOS E SINAIS',items:['handouts','notes','yumiya']},
 {name:'TERMINAL',items:['typography','settings']}
];
const tabLabels={'tactical-map':'MAPA TÁTICO',master:'CENTRO DE OPERAÇÕES',operation:'CONTROLE DA OPERAÇÃO',missions:'MISSÕES',characters:'PERSONAGENS',soundtrack:'SOUNDTRACK',players:'PLAYER DATA',teams:'EQUIPES // STATUS',credentials:'CREDENCIAIS',polls:'VOTAÇÕES',handouts:'HANDOUTS',notes:'ANOTAÇÕES',yumiya:'YUMIYA // REMOTE',typography:'FONT STUDIO',settings:'CONFIGURAÇÕES'};
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(preferences))}catch{}}
function element(tag,cls,text){
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);return e;
}
function createAction(label,handler,cls=''){
 const btn=element('button','dcxVcButton '+cls,label);btn.type='button';btn.addEventListener('click',handler);return btn;
}
function apply(){
 const root=document.documentElement;
 root.dataset.dcxVisualFx=preferences.fx;
 root.dataset.dcxVisualLevel=String(preferences.level);
 root.dataset.dcxVisualHud=preferences.hud?'on':'off';
 if(HOST&&layout)layout.dataset.sidebar=preferences.sidebar;
 settings.forEach(node=>{
  const {modeSelect,levelInput,hudCheck,slimCheck}=node;
  if(modeSelect)modeSelect.value=preferences.fx;
  if(levelInput)levelInput.value=String(preferences.level);
  if(hudCheck)hudCheck.checked=preferences.hud;
  if(slimCheck)slimCheck.checked=preferences.sidebar==='slim';
 });
 qAll('[data-dcx-vc-action]').forEach(btn=>{
  if(btn.dataset.dcxVcAction==='fx'){btn.textContent='◉ '+(preferences.fx==='off'?'EFEITOS':'FX: '+preferences.fx.toUpperCase());btn.setAttribute('aria-pressed',String(preferences.fx!=='off'))}
  if(btn.dataset.dcxVcAction==='hud'){btn.textContent='▤ HUD '+(preferences.hud?'ON':'OFF');btn.setAttribute('aria-pressed',String(preferences.hud))}
 });
}
function qAll(s){return [...document.querySelectorAll(s)]}
function change(update){preferences={...preferences,...update};persist();apply()}
function setFx(fx){if(FX.includes(fx))change({fx})}
function toggleFx(){setFx(preferences.fx==='off'?'retro':'off')}
function toggleHud(){change({hud:!preferences.hud})}
function toggleDensity(){
 if(HOST){
  if(window.KMHUD?.toggleDensity)window.KMHUD.toggleDensity();
  else document.querySelector('[data-km-density-choice="'+(document.documentElement.dataset.kmDensity==='compact'?'comfortable':'compact')+'"]')?.click();
 }else{
  const state=window.DCX?.PlayerSettings?.state;
  const compact=document.documentElement.dataset.playerDensity==='compact';
  if(window.DCX?.PlayerSettings?.setDensity)window.DCX.PlayerSettings.setDensity(compact?'comfortable':'compact');
  else document.querySelector('[data-density-choice="'+(compact?'comfortable':'compact')+'"]')?.click();
 }
 syncDensity();
}
function syncDensity(){
 const isCompact=HOST?document.documentElement.dataset.kmDensity==='compact':document.documentElement.dataset.playerDensity==='compact';
 qAll('[data-dcx-vc-action="density"]').forEach(btn=>{btn.textContent='▥ '+(isCompact?'COMPACTO':'CONFORTÁVEL');btn.setAttribute('aria-pressed',String(isCompact))});
}
function addQuickControls(){
 const header=HOST?q('#console>.top'):q('.app>.top'),actions=header?.querySelector('.actions');
 if(!actions||$('dcxVisualQuick'))return;
 const tools=element('div','dcxVcQuick');tools.id='dcxVisualQuick';
 const density=createAction('▥ DENSIDADE',toggleDensity);density.dataset.dcxVcAction='density';
 const hud=createAction('▤ HUD',toggleHud);hud.dataset.dcxVcAction='hud';
 const fx=createAction('◉ EFEITOS',toggleFx);fx.dataset.dcxVcAction='fx';
 tools.append(density,hud,fx);actions.prepend(tools);
 syncDensity();
}
function setupSidebar(){
 const consoleEl=$('console'),tabs=$('kmWorkspaceTabs');if(!consoleEl||!tabs||$('dcxVcLayout'))return;
 const views=qAll('#console .kmWorkspaceView');
 if(!views.length)return;
 layout=element('div','dcxVcLayout');layout.id='dcxVcLayout';
 const side=element('aside','dcxVcSidebar');side.id='dcxVcSidebar';side.setAttribute('aria-label','Navegação do Keymaster');
 const main=element('main','dcxVcMain');main.id='dcxVcMain';main.setAttribute('aria-label','Área de trabalho Keymaster');
 const brand=element('div','dcxVcBrand');
 brand.append(element('span','dcxVcLogo','DCX'),element('div','dcxVcBrandText'));
 brand.lastElementChild.append(element('strong','', 'KEYMASTER'),element('small','', 'OPERATIONS // INTERFACE'));
 const mobileClose=createAction('FECHAR MENU',()=>layout.classList.remove('mobile-open'),'dcxVcMobileClose');
 mobileClose.setAttribute('aria-label','Fechar menu lateral');
 tabs.setAttribute('aria-label','Seções do Keymaster');
 const buttons=qAll('#kmWorkspaceTabs .kmWorkspaceTab[data-tab]');
 const map=new Map(buttons.map(b=>[b.dataset.tab,b]));
 const fragment=document.createDocumentFragment();
 for(const group of groups){
  const section=element('section','dcxVcNavSection');
  const name=element('h3','dcxVcNavHeading',group.name);section.append(name);
  for(const id of group.items){
   const b=map.get(id);if(!b)continue;
   const text=[...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim()||tabLabels[id];
   [...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());
   b.setAttribute('aria-label',text);
   const mark=element('span','dcxVcNavIcon',icons[id]||'•');mark.setAttribute('aria-hidden','true');
   const label=element('span','dcxVcNavText',text);
   b.prepend(mark,label);section.append(b);
  }
  fragment.append(section);
 }
 const footer=element('div','dcxVcSidebarFooter');
 footer.append(element('span','dcxVcSignalDot'),element('span','', 'DCX NETWORK // LOCAL UI'));
 tabs.replaceChildren(fragment);
 consoleEl.insertBefore(layout,tabs);
 side.append(brand,mobileClose,tabs,footer);
 const context=element('div','dcxVcContext');
 const heading=element('div','dcxVcContextHeading');heading.append(element('small','', 'DCX // WORKSPACE'),element('h1','', 'CENTRO DE OPERAÇÕES'));
 const btns=element('div','dcxVcContextTools');
 btns.append(createAction('◧ RECOLHER',()=>change({sidebar:preferences.sidebar==='slim'?'wide':'slim'}),'dcxVcSideToggle'));
 context.append(heading,btns);main.append(context);
 const metrics=element('div','dcxVcMetrics');metrics.id='dcxVcMetrics';main.append(metrics);
 for(const view of views)main.append(view);
 layout.append(side,main);
 const toggle=createAction('☰ MENU',()=>layout.classList.toggle('mobile-open'),'dcxVcMenuToggle');
 toggle.id='dcxVcMenuToggle';
 const head=consoleEl.querySelector('.top .actions');head?.prepend(toggle);
 const overlay=element('button','dcxVcBackdrop');overlay.type='button';overlay.setAttribute('aria-label','Fechar menu lateral');overlay.addEventListener('click',()=>layout.classList.remove('mobile-open'));layout.append(overlay);
 tabs.addEventListener('click',e=>{if(e.target.closest('.kmWorkspaceTab')){layout.classList.remove('mobile-open');window.requestAnimationFrame(updateHud)}});
 const observer=new MutationObserver(()=>updateHud());
 observer.observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
}
function makeHud(container,descriptors){
 if(!container)return;
 container.replaceChildren();hudCards=[];
 for(const info of descriptors){
  const box=element('div','dcxVcMetric');
  const lead=element('span','dcxVcMetricIcon',info.icon);
  const content=element('div','dcxVcMetricBody');
  const k=element('small','',info.label),v=element('strong','', '—');
  content.append(k,v);box.append(lead,content);
  if(info.action){const b=element('button','dcxVcMetricGo','↗');b.type='button';b.setAttribute('aria-label','Abrir '+info.label);b.addEventListener('click',info.action);box.append(b)}
  container.append(box);hudCards.push({info,v});
 }
}
function readStat(label){
 for(const row of qAll('#dcxMasterStats .dcxStat')){
  if(row.querySelector('span')?.textContent?.trim().toUpperCase()===label)return safeText(row.querySelector('b')?.textContent,'0');
 }
 return '—';
}
function keymasterMetrics(){
 makeHud($('dcxVcMetrics'),[
  {icon:'◉',label:'JOGADORES',get:()=>readStat('JOGADORES'),action:()=>openKm('players')},
  {icon:'◈',label:'ATIVOS',get:()=>readStat('ATIVOS'),action:()=>openKm('players')},
  {icon:'▦',label:'EQUIPES',get:()=>readStat('EQUIPES'),action:()=>openKm('teams')},
  {icon:'⌁',label:'SALA',get:()=>safeText($('roomLabel')?.textContent),action:()=>openKm('master')}
 ]);
}
function openKm(tab){q('#kmWorkspaceTabs .kmWorkspaceTab[data-tab="'+tab+'"]')?.click()}
function playerMetrics(){
 const bar=$('playerWorkspaceBar');if(!bar||$('dcxVcPlayerHud'))return;
 const hud=element('div','dcxVcPlayerHud');hud.id='dcxVcPlayerHud';
 bar.parentElement.insertBefore(hud,bar);
 makeHud(hud,[
  {icon:'◈',label:'OPERADOR',get:()=>safeText($('dcxDashOperatorName')?.textContent,$('name')?.value||'AGENTE')},
  {icon:'⌁',label:'SALA',get:()=>safeText($('dcxDashRoom')?.textContent,$('room')?.value||'—')},
  {icon:'▤',label:'ALERTAS',get:()=>{const x=$('dcxWorkspaceUnread');return x&&!x.classList.contains('hidden')?safeText(x.textContent,'0'):'0'},action:()=>q('[data-workspace-target="dcx"]')?.click()},
  {icon:'♫',label:'TRILHA',get:()=>safeText($('dcxSoundtrackLauncherLabel')?.textContent,'SEM TRILHA'),action:()=>{q('[data-workspace-target="dcx"]')?.click();$('dcxOpenSoundtrack')?.click()}}
 ]);
}
function updateHud(){
 if(HOST){
  const current=q('#kmWorkspaceTabs .kmWorkspaceTab.active')?.dataset.tab||'master';
  const heading=q('.dcxVcContextHeading h1');if(heading)heading.textContent=tabLabels[current]||'KEYMASTER';
  qAll('#kmWorkspaceTabs .kmWorkspaceTab').forEach(b=>{b.setAttribute('aria-current',b.classList.contains('active')?'page':'false')});
 }
 for(const {info,v} of hudCards){try{v.textContent=info.get?.()||'—'}catch{v.textContent='—'}}
}
function optionsPanel(){
 const wrap=element('section','dcxVcSettings');
 wrap.innerHTML='<div class="dcxVcSettingsHead"><small>DCX // VISUAL COMMAND</small><h2>EFEITOS DE TERMINAL E HUD</h2><p>Preferências locais deste navegador. Não alteram o Firebase nem a experiência de outras pessoas.</p></div>'+
 '<div class="dcxVcSettingsGrid"><label>MODO VISUAL<select data-vc-mode><option value="off">PADRÃO // LIMPO</option><option value="retro">RETRO // CRT + CHIADO</option><option value="oldpc">COMPUTADOR ANTIGO // GLOW</option><option value="vhs">VHS // ESTÁTICA</option></select></label>'+
 '<label>INTENSIDADE DOS EFEITOS<input data-vc-level type="range" min="1" max="3" step="1"><small>Suave · Média · Forte</small></label>'+
 '<label class="dcxVcCheck"><input type="checkbox" data-vc-hud> MOSTRAR HUD DE STATUS</label>'+
 (HOST?'<label class="dcxVcCheck"><input type="checkbox" data-vc-slim> REDUZIR SIDEBAR</label>':'')+'</div>'+
 '<p class="dcxVcSettingsFoot">Os efeitos são desligados automaticamente se o dispositivo pedir redução de movimento. Você pode ativar e desativar a qualquer momento.</p>';
 const modeSelect=wrap.querySelector('[data-vc-mode]');
 const levelInput=wrap.querySelector('[data-vc-level]');
 const hudCheck=wrap.querySelector('[data-vc-hud]');
 const slimCheck=wrap.querySelector('[data-vc-slim]');
 modeSelect.addEventListener('change',()=>setFx(modeSelect.value));
 levelInput.addEventListener('input',()=>change({level:Number(levelInput.value)}));
 hudCheck.addEventListener('change',()=>change({hud:hudCheck.checked}));
 slimCheck?.addEventListener('change',()=>change({sidebar:slimCheck.checked?'slim':'wide'}));
 settings.push({modeSelect,levelInput,hudCheck,slimCheck});
 return wrap;
}
function addSettings(){
 const host=HOST?q('.kmSettingsWorkspace'):q('#dcxSettingsPanel .dcxSettingsContent');
 if(!host||host.querySelector('.dcxVcSettings'))return;
 const panel=optionsPanel();
 if(HOST){const first=host.firstElementChild;first?.insertAdjacentElement('afterend',panel);if(!first)host.append(panel)}
 else {const intro=host.querySelector('.settingsIntro');if(intro)intro.insertAdjacentElement('afterend',panel);else host.prepend(panel)}
}
function init(){
 if(HOST)setupSidebar();
 else playerMetrics();
 addQuickControls();
 addSettings();
 if(HOST)keymasterMetrics();
 apply();syncDensity();updateHud();
 const densityObserver=new MutationObserver(syncDensity);
 densityObserver.observe(document.documentElement,{attributes:true,attributeFilter:[HOST?'data-km-density':'data-player-density']});
 window.setInterval(updateHud,3000);
 console.info('[DCX] VISUAL COMMAND ready // UI only // sidebar, HUD, density, retro, old PC, VHS');
}
window.DCX=window.DCX||{};
window.DCX.VisualCommand={setFx,toggleFx,toggleHud,get state(){return {...preferences}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();