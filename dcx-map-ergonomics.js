/* DCX MAP ERGONOMICS // local-only map workspace fit and player header collapse */
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname);
const STORE='dcx-navigation-qol-v1';
const $=id=>document.getElementById(id);
const state=(()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}})();
function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
function button(label,cls,onClick){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',onClick);return b}
function player(){
 const nav=$('playerWorkspaceBar'),app=nav?.closest('.app')||document.querySelector('.app'),top=app?.querySelector('.top');
 if(!app||!nav||!top||$('dcxNavCollapse'))return;
 const collapsed=()=>!!state.navCollapsed;
 const restore=button('☰ MOSTRAR PAINEL','dcxNavRestore',()=>set(false));restore.id='dcxNavRestore';restore.setAttribute('aria-label','Mostrar cabeçalho, conexão e abas de navegação');
 const collapse=button('▴ RECOLHER CABEÇALHO','dcxNavCollapse',()=>set(true));collapse.id='dcxNavCollapse';collapse.setAttribute('aria-label','Recolher cabeçalho, conexão e abas de navegação');
 const dock=document.createElement('div');dock.className='dcxNavDock';dock.id='dcxNavDock';
 const summary=document.createElement('span');summary.className='dcxNavCurrent';summary.id='dcxNavCurrent';dock.append(summary,collapse);
 nav.insertAdjacentElement('afterend',dock);
 app.prepend(restore);
 // Keep restore available even when terminal sections are rearranged by themes.
 function update(){
  const active=nav.querySelector('.playerWorkspaceTab.active');
  summary.textContent='DCX // '+(active?.querySelector('b')?.textContent||'OPERAÇÕES');
  app.classList.toggle('dcxNavCollapsed',collapsed());
  document.documentElement.classList.toggle('dcxNavCollapsedGlobal',collapsed());
  document.body.classList.toggle('dcxNavCollapsedGlobal',collapsed());
  restore.hidden=!collapsed();collapse.hidden=collapsed();
  collapse.setAttribute('aria-expanded',String(!collapsed()));
  restore.setAttribute('aria-expanded',String(!collapsed()));
 }
 function set(v){state.navCollapsed=!!v;save();update();
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('dcx-map-viewport-resized'));
  setTimeout(()=>window.DCX?.Cartography?.engine?.resize?.(),150)
 }
 nav.addEventListener('click',()=>requestAnimationFrame(update));
 const mo=new MutationObserver(()=>requestAnimationFrame(update));
 mo.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{if(e.altKey&&e.key.toLowerCase()==='m'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();set(!collapsed())}});
 update();
}
function map(){
 const root=$('dcxTacticalMap'),board=$('dcxMapCanvas');if(!root||!board||$('dcxMapErgoControls'))return;
 const buttons=root.querySelector('.dcxMapHeroActions');if(!buttons)return;
 root.classList.add('dcxMapOptimized');
 const panel=document.createElement('div');panel.id='dcxMapErgoControls';panel.className='dcxMapErgoControls';
 const label=document.createElement('label');label.htmlFor='dcxMapUiScale';label.textContent='INTERFACE ';
 const output=document.createElement('output');output.id='dcxMapUiScaleOutput';
 const slider=document.createElement('input');slider.id='dcxMapUiScale';slider.type='range';slider.min='75';slider.max='125';slider.step='5';slider.setAttribute('aria-label','Escala dos painéis do mapa');
 const compact=button('▤ PAINÉIS','dcxMapErgoBtn',()=>setPanels(root.classList.contains('dcxMapPanelsHidden')));
 compact.title='Mostrar ou esconder Pontos Importantes';
 const fit=button('▣ TELA INTEIRA','dcxMapErgoBtn',async()=>{
  try{
   if(document.fullscreenElement===root){await document.exitFullscreen();return}
   if(document.fullscreenElement)await document.exitFullscreen();
   await root.requestFullscreen();
  }catch(e){fit.textContent='TELA CHEIA BLOQUEADA';setTimeout(()=>fit.textContent='▣ TELA INTEIRA',1800)}
 });
 fit.title='Expandir o mapa para ocupar a tela toda';
 const reset=button('↺ AJUSTAR','dcxMapErgoBtn',()=>{
  setScale(100);setPanels(true);
  if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});
 });
 panel.append(label,slider,output,compact,fit,reset);
 buttons.append(panel);
 function setScale(n){
  n=Math.min(125,Math.max(75,Number(n)||100));
  root.style.setProperty('--dcx-map-ui-zoom',String(n/100));
  output.textContent=n+'%';slider.value=String(n);
  state.mapScale=n;save();
 }
 function setPanels(show){
  root.classList.toggle('dcxMapPanelsHidden',!show);
  compact.textContent=show?'▤ ESCONDER PAINEL':'▤ MOSTRAR PAINEL';
  compact.setAttribute('aria-pressed',String(!show));
  state.mapPanels=show;save();
 }
 slider.addEventListener('input',()=>setScale(slider.value));
 setScale(state.mapScale||100);setPanels(state.mapPanels!==false);
 document.addEventListener('fullscreenchange',()=>{
  fit.textContent=document.fullscreenElement===root?'▣ SAIR DA TELA CHEIA':'▣ TELA INTEIRA';
  try{window.google?.maps?.event?.trigger?.(window.DCX?.Cartography?.nativeMap,'resize')}catch{}
  window.dispatchEvent(new Event('resize'));
 });
 const resize=new ResizeObserver(()=>window.dispatchEvent(new Event('dcx-map-viewport-resized')));
 resize.observe(root);
}
function init(){player();map()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
