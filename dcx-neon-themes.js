(()=>{
'use strict';
const variants=[
['night-city-gold','NIGHT CITY // OURO','Amarelo e ciano no grafite','#11171c','#e6eb58','#65d8f3'],
['edgerunners2-burn','EDGERUNNERS 2 // BURN','Vermelho brutal, azul elétrico e âmbar','#131725','#ff3d67','#42d5ff'],
['blackout-comfort','BLACKOUT // DESCANSO','Escuro suave, mínimo brilho','#171b21','#9fbcd4','#b9a5d7']
];
const originals=[
['arc-cyan','ARC // CIANO','Ciano elétrico','#091827','#63dfff','#6c96ff'],
['dcx-green','DCX // VERDE','Verde terminal','#081711','#64e6a6','#72d8e8'],
['ghost-mono','GHOST // MONO','Monocromático','#181a20','#d2e2eb','#8aa6bc'],
['void-violet','VOID // VIOLETA','Violeta e ciano','#160d21','#c593ff','#7fdcff'],
['royal-sapphire','ROYAL // SAFIRA','Azul safira','#0e1730','#4f8fe8','#b8d3ff'],
['sakura-rose','SAKURA // ROSÉ','Rosa sakura','#1d1118','#df8fa7','#f1c9d3'],
['sandstorm-desert','SANDSTORM // AREIA','Deserto escuro','#20180f','#d7ad63','#e7d29a']
];
const isHost=()=>/keymaster\.html$/i.test(location.pathname);
const STORE=()=>isHost()?'dcx-km-settings-v1':'dcx-player-settings-v1';
function savedTheme(){try{return JSON.parse(localStorage.getItem(STORE())||'{}').theme||'arc-cyan'}catch{return'arc-cyan'}}
function cards(){
 const grid=document.querySelector(isHost()?'.kmThemeGrid':'.settingsThemeGrid');
 if(!grid)return;
 const attr=isHost()?'data-km-theme-choice':'data-theme-choice';
 const all=[...originals,...variants];
 grid.innerHTML=all.map(([id,title,desc,bg,primary,secondary])=>{
   const style='--dcx-choice-bg:'+bg+';--dcx-choice-accent:'+primary+';--dcx-choice-alt:'+secondary+';';
   const swatch=isHost()?'<span class="kmThemeSwatch"><i></i><i></i><i></i></span>':'<span class="settingsSwatch"><i></i><i></i><i></i></span>';
   const words=isHost()?'<span><b>'+title+'</b><small>'+desc+'</small></span>':'<span class="settingsThemeText"><b>'+title+'</b><small>'+desc+'</small></span>';
   const select=isHost()?'<em>USAR</em>':'<em class="settingsSelected">USAR</em>';
   return '<button type="button" class="'+(isHost()?'kmThemeChoice':'settingsTheme')+' dcxNeonThemeChoice" style="'+style+'" '+attr+'="'+id+'">'+swatch+words+select+'</button>';
 }).join('');
 function paint(){const active=savedTheme();grid.querySelectorAll('['+attr+']').forEach(b=>{
  const selected=b.getAttribute(attr)===active;b.classList.toggle('active',selected);
  b.setAttribute('aria-pressed',String(selected));const indicator=b.querySelector(isHost()?'em':'.settingsSelected');if(indicator)indicator.textContent=selected?'ATIVO':'USAR';
 })}
 grid.addEventListener('click',e=>{
  const target=e.target.closest('['+attr+']');if(!target)return;
  const theme=target.getAttribute(attr);
  if(isHost())window.KMSETTINGS?.setTheme?.(theme);
  else window.DCX?.PlayerSettings?.setTheme?.(theme);
  paint();
 });
 paint();
}
window.DCX=window.DCX||{};
window.DCX.NeonThemes={variants:variants.map(v=>v[0]),init:cards};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cards,{once:true});else cards();
})();