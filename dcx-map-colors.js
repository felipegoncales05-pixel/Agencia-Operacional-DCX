/* DCX MAP // palette sync with the same site themes; map-only overrides optional. */
(()=>{
'use strict';
const definitions=[
 ['arc-cyan','ARC // CIANO','#091827','#63dfff','#6c96ff'],
 ['dcx-green','DCX // VERDE','#081711','#64e6a6','#72d8e8'],
 ['ember-amber','EMBER // ÂMBAR','#1a1208','#ffc45f','#ff8c69'],
 ['void-violet','VOID // VIOLETA','#160d21','#c593ff','#7fdcff'],
 ['frost-blue','FROST // AZUL','#111c2b','#83c8ff','#a6eaff'],
 ['crimson-ruby','CRIMSON // RUBI','#25121b','#ed577b','#b795ff'],
 ['neon-rose','NEON // ROSA','#211321','#ff79ce','#ba87ff'],
 ['ghost-mono','GHOST // MONO','#181a20','#d2e2eb','#8aa6bc'],
 ['solar-gold','SOLAR // DOURADO','#242014','#f0d27a','#e2a962'],
 ['toxic-lime','TOXIC // LIMA','#162116','#b2ea77','#7bdcad'],
 ['ocean-teal','OCEAN // TURQUESA','#0b2123','#62d7c5','#82b8ef'],
 ['dusk-wine','DUSK // VINHO','#26131f','#d78ca8','#a884e2'],
 ['midnight-night','MIDNIGHT // NOTURNO','#121821','#d7dde5','#ffffff'],
 ['steel-blue','STEEL // AÇO','#111b24','#6fb3d2','#b9d9ea'],
 ['forest-moss','FOREST // MUSGO','#131b11','#9cc66f','#d6c99b'],
 ['sakura-rose','SAKURA // ROSÉ','#1d1118','#df8fa7','#f1c9d3'],
 ['copper-bronze','COPPER // COBRE','#1b140f','#d68a4c','#e9c19a'],
 ['arctic-ice','ARCTIC // GELO','#142026','#b8e7f3','#e5f8ff'],
 ['bloodmoon-dark','BLOODMOON // ESCURO','#190b10','#d84d66','#ef8b78'],
 ['royal-sapphire','ROYAL // SAFIRA','#0e1730','#4f8fe8','#b8d3ff'],
 ['aurora-mint','AURORA // MENTA','#10221f','#68d9bd','#c4b7ee'],
 ['sandstorm-desert','SANDSTORM // AREIA','#20180f','#d7ad63','#e7d29a'],
 ['night-city-gold','NIGHT CITY // OURO','#11171c','#e6eb58','#65d8f3'],
 ['edgerunner-pulse','EDGERUNNER // PULSE','#161523','#ff73c6','#62e0f4'],
 ['chrome-ghost','CHROME // GHOST','#101e28','#7dd7ef','#e18be8'],
 ['glitch-red','GLITCH // VERMELHO','#1c111a','#ff627c','#68e5cc'],
 ['synthwave-dusk','SYNTHWAVE // DUSK','#1a1930','#b69aff','#ff93c0'],
 ['acid-signal','ACID // SIGNAL','#132218','#b6f271','#65dfb4'],
 ['hologram-violet','HOLOGRAMA // VIOLETA','#171b2b','#a7a9ff','#69d9fa'],
 ['blackout-comfort','BLACKOUT // DESCANSO','#171b21','#9fbcd4','#b9a5d7']
];
const schemes=new Map(definitions.map(([id,name,bg,main,alt])=>[id,{id,name,bg,main,alt}]));
const HOST=/keymaster\.html$/i.test(location.pathname);
const MAP_KEY='dcx-map-theme-'+(HOST?'keymaster':'player');
const STORE=HOST?'dcx-km-settings-v1':'dcx-player-settings-v1';
const shade=(hex)=>[1,3,5].map(p=>parseInt(hex.slice(p,p+2),16));
const hex=rgb=>'#'+rgb.map(x=>Math.round(Math.min(255,Math.max(0,x))).toString(16).padStart(2,'0')).join('');
const blend=(a,b,amount)=>hex(shade(a).map((v,i)=>v+(shade(b)[i]-v)*amount));
function siteTheme(){
 const root=document.documentElement;
 const attr=HOST?root.dataset.kmTheme:root.dataset.playerTheme;
 if(schemes.has(attr))return attr;
 try{const saved=JSON.parse(localStorage.getItem(STORE)||'{}').theme;if(schemes.has(saved))return saved}catch{}
 return 'arc-cyan';
}
function selectedTheme(){
 let selected='site';try{selected=localStorage.getItem(MAP_KEY)||'site'}catch{}
 return schemes.has(selected)?selected:siteTheme();
}
function selection(){
 try{return localStorage.getItem(MAP_KEY)||'site'}catch{return 'site'}
}
function choose(id){
 const chosen=schemes.has(id)?id:'site';
 try{localStorage.setItem(MAP_KEY,chosen)}catch{}
 document.dispatchEvent(new CustomEvent('dcx-map-theme-change',{detail:{theme:chosen}}));
}
function palette(){
 const scheme=schemes.get(selectedTheme())||schemes.get('arc-cyan');
 return {...scheme,
  // Higher surface luminance than the previous black-base map.
  background:blend(scheme.bg,'#78919e',.16),
  land:blend(scheme.bg,'#8eb2ac',.21),
  park:blend(scheme.bg,'#6cc79b',.20),
  building:blend(scheme.bg,scheme.alt,.19),
  road:blend(scheme.main,'#c2e0ed',.18),
  minorRoad:blend(scheme.alt,'#a9bad0',.18),
  water:blend(scheme.bg,'#2a789d',.34),
  boundary:blend(scheme.main,'#e5efff',.14),
  halo:blend(scheme.bg,'#0b1223',.30)
 }
}
function observe(callback){
 const update=()=>callback(palette());
 document.addEventListener('dcx-map-theme-change',update);
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{
  attributes:true,attributeFilter:['data-km-theme','data-player-theme']
 });
 // Theme plugins may apply changes on click and update localStorage late.
 const clicked=event=>{if(event.target.closest?.('[data-theme-choice],[data-km-theme-choice]'))setTimeout(update,70)};
 document.addEventListener('click',clicked,true);
 return ()=>{observer.disconnect();document.removeEventListener('dcx-map-theme-change',update);document.removeEventListener('click',clicked,true)}
}
window.DCX=window.DCX||{};
window.DCX.MapColors={definitions,schemes,palette,siteTheme,selectedTheme,selection,choose,observe,blend};
})();