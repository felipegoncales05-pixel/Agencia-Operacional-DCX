(()=>{
  'use strict';
  const STORE='dcx-player-settings-v1';
  const THEMES=['arc-cyan','dcx-green','ghost-mono','void-violet','royal-sapphire','sakura-rose','sandstorm-desert','night-city-gold','edgerunners2-burn','blackout-comfort'];
  const MIGRATIONS={'ember-amber':'night-city-gold','frost-blue':'arc-cyan','crimson-ruby':'edgerunners2-burn','neon-rose':'sakura-rose','solar-gold':'night-city-gold','toxic-lime':'dcx-green','ocean-teal':'arc-cyan','dusk-wine':'sakura-rose','midnight-night':'blackout-comfort','steel-blue':'royal-sapphire','forest-moss':'dcx-green','copper-bronze':'sandstorm-desert','arctic-ice':'arc-cyan','bloodmoon-dark':'edgerunners2-burn','aurora-mint':'dcx-green','edgerunner-pulse':'edgerunners2-burn','chrome-ghost':'ghost-mono','glitch-red':'edgerunners2-burn','synthwave-dusk':'void-violet','acid-signal':'dcx-green','hologram-violet':'void-violet'};
  const DENSITIES=['comfortable','compact'];
  const DEFAULTS={theme:'arc-cyan',density:'comfortable'};
  const $=id=>document.getElementById(id);
  function read(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'{}');return{theme:THEMES.includes(raw.theme)?raw.theme:(MIGRATIONS[raw.theme]||DEFAULTS.theme),density:DENSITIES.includes(raw.density)?raw.density:DEFAULTS.density}}catch{return{...DEFAULTS}}}
  let state=read();
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
  function apply(updateUI=true){document.documentElement.dataset.playerTheme=state.theme;document.documentElement.dataset.playerDensity=state.density;if(updateUI)syncUI()}
  function syncUI(){
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>{const active=btn.dataset.themeChoice===state.theme;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));const badge=btn.querySelector('.settingsSelected');if(badge)badge.textContent=active?'ATIVO':'USAR'});
    document.querySelectorAll('[data-density-choice]').forEach(btn=>{const active=btn.dataset.densityChoice===state.density;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active))});
    const label=$('playerSettingsCurrent');if(label){const names={"arc-cyan":"ARC // CIANO","dcx-green":"DCX // VERDE","ghost-mono":"GHOST // MONO","void-violet":"VOID // VIOLETA","royal-sapphire":"ROYAL // SAFIRA","sakura-rose":"SAKURA // ROSÉ","sandstorm-desert":"SANDSTORM // AREIA","night-city-gold":"NIGHT CITY // OURO","edgerunners2-burn":"EDGERUNNERS 2 // BURN","blackout-comfort":"BLACKOUT // DESCANSO"};label.textContent=`${names[state.theme]} // ${state.density==='compact'?'COMPACTO':'CONFORTÁVEL'}`}
  }
  function setTheme(theme){if(!THEMES.includes(theme))return;state.theme=theme;persist();apply()}
  function setDensity(density){if(!DENSITIES.includes(density))return;state.density=density;persist();apply()}
  function reset(){state={...DEFAULTS};persist();apply()}
  function toggle(force){const panel=$('dcxSettingsPanel');if(!panel)return;const open=typeof force==='boolean'?force:panel.classList.contains('hidden');panel.classList.toggle('hidden',!open);panel.setAttribute('aria-hidden',String(!open));if(open){syncUI();setTimeout(()=>$('settingsCloseBtn')?.focus(),0)}}
  function bind(){
    ['dcxOpenSettings','playerSettingsQuickBtn'].forEach(id=>$(id)?.addEventListener('click',e=>{e.preventDefault();toggle(true)}));
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeChoice)));
    document.querySelectorAll('[data-density-choice]').forEach(btn=>btn.addEventListener('click',()=>setDensity(btn.dataset.densityChoice)));
    $('playerSettingsReset')?.addEventListener('click',reset);
    $('playerOpenKeymaster')?.addEventListener('click',()=>window.DCX?.Navigation?.goKeymaster?.());
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('dcxSettingsPanel')?.classList.contains('hidden'))toggle(false)});
  }
  function init(){persist();apply(false);bind();syncUI();console.info('[DCX OS] PLAYER SETTINGS V5 // QUICK ACCESS + 10 THEMES + DENSITY // LOCAL ONLY')}
  window.DCX=window.DCX||{};window.DCX.PlayerSettings={toggle,setTheme,setDensity,reset,get state(){return{...state}}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
