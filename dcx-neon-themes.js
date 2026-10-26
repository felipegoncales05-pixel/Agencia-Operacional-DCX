(()=>{
'use strict';
const variants=[
['night-city-gold','NIGHT CITY // OURO','Amarelo e ciano no grafite','#11171c','#e6eb58','#65d8f3'],
['edgerunner-pulse','EDGERUNNER // PULSE','Rosa neon e ciano','#161523','#ff73c6','#62e0f4'],
['chrome-ghost','CHROME // GHOST','Azul cromado e magenta','#101e28','#7dd7ef','#e18be8'],
['glitch-red','GLITCH // VERMELHO','Vermelho e verde holográfico','#1c111a','#ff627c','#68e5cc'],
['synthwave-dusk','SYNTHWAVE // DUSK','Roxo e rosa noturnos','#1a1930','#b69aff','#ff93c0'],
['acid-signal','ACID // SIGNAL','Verde cyberpunk e turquesa','#132218','#b6f271','#65dfb4'],
['hologram-violet','HOLOGRAMA // VIOLETA','Violeta e azul digital','#171b2b','#a7a9ff','#69d9fa'],
['blackout-comfort','BLACKOUT // DESCANSO','Escuro suave, mínimo brilho','#171b21','#9fbcd4','#b9a5d7']
];
const originals=[
['arc-cyan','ARC // CIANO','Ciano elétrico','#091827','#63dfff','#6c96ff'],
['dcx-green','DCX // VERDE','Verde terminal','#081711','#64e6a6','#72d8e8'],
['ember-amber','EMBER // ÂMBAR','Âmbar técnico','#1a1208','#ffc45f','#ff8c69'],
['void-violet','VOID // VIOLETA','Violeta e ciano','#160d21','#c593ff','#7fdcff'],
['frost-blue','FROST // AZUL','Azul glacial','#111c2b','#83c8ff','#a6eaff'],
['crimson-ruby','CRIMSON // RUBI','Rubis e carvão','#25121b','#ed577b','#b795ff'],
['neon-rose','NEON // ROSA','Rosa vibrante','#211321','#ff79ce','#ba87ff'],
['ghost-mono','GHOST // MONO','Monocromático','#181a20','#d2e2eb','#8aa6bc'],
['solar-gold','SOLAR // DOURADO','Ouro e âmbar','#242014','#f0d27a','#e2a962'],
['toxic-lime','TOXIC // LIMA','Verde ácido','#162116','#b2ea77','#7bdcad'],
['ocean-teal','OCEAN // TURQUESA','Turquesa profundo','#0b2123','#62d7c5','#82b8ef'],
['dusk-wine','DUSK // VINHO','Bordô e rosa','#26131f','#d78ca8','#a884e2'],
['midnight-night','MIDNIGHT // NOTURNO','Escuro neutro','#121821','#d7dde5','#ffffff'],
['steel-blue','STEEL // AÇO','Azul metálico','#111b24','#6fb3d2','#b9d9ea'],
['forest-moss','FOREST // MUSGO','Verde musgo','#131b11','#9cc66f','#d6c99b'],
['sakura-rose','SAKURA // ROSÉ','Rosa sakura','#1d1118','#df8fa7','#f1c9d3'],
['copper-bronze','COPPER // COBRE','Cobre noturno','#1b140f','#d68a4c','#e9c19a'],
['arctic-ice','ARCTIC // GELO','Gelo e prata','#142026','#b8e7f3','#e5f8ff'],
['bloodmoon-dark','BLOODMOON // ESCURO','Carmim escuro','#190b10','#d84d66','#ef8b78'],
['royal-sapphire','ROYAL // SAFIRA','Azul safira','#0e1730','#4f8fe8','#b8d3ff'],
['aurora-mint','AURORA // MENTA','Menta suave','#10221f','#68d9bd','#c4b7ee'],
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