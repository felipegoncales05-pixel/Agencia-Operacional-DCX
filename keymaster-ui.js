(function(){
  "use strict";
  const STORE="dcx-km-settings-v1";
  const LEGACY_DENSITY="dcx-km-density";
  const THEMES=new Set(["arc-cyan","dcx-green","ghost-mono","void-violet","royal-sapphire","sakura-rose","sandstorm-desert","night-city-gold","edgerunners2-burn","blackout-comfort"]);
  const MIGRATIONS={"ember-amber":"night-city-gold","frost-blue":"arc-cyan","crimson-ruby":"edgerunners2-burn","neon-rose":"sakura-rose","solar-gold":"night-city-gold","toxic-lime":"dcx-green","ocean-teal":"arc-cyan","dusk-wine":"sakura-rose","midnight-night":"blackout-comfort","steel-blue":"royal-sapphire","forest-moss":"dcx-green","copper-bronze":"sandstorm-desert","arctic-ice":"arc-cyan","bloodmoon-dark":"edgerunners2-burn","aurora-mint":"dcx-green","edgerunner-pulse":"edgerunners2-burn","chrome-ghost":"ghost-mono","glitch-red":"edgerunners2-burn","synthwave-dusk":"void-violet","acid-signal":"dcx-green","hologram-violet":"void-violet"};
  const DENSITIES=new Set(["comfortable","compact"]);
  const DEFAULTS={theme:"arc-cyan",density:"comfortable"};
  function read(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORE)||"{}");
      const legacy=localStorage.getItem(LEGACY_DENSITY);
      return {
        theme:THEMES.has(raw.theme)?raw.theme:(MIGRATIONS[raw.theme]||DEFAULTS.theme),
        density:DENSITIES.has(raw.density)?raw.density:(DENSITIES.has(legacy)?legacy:DEFAULTS.density)
      };
    }catch(e){return {...DEFAULTS}}
  }
  let state=read();
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));localStorage.setItem(LEGACY_DENSITY,state.density)}catch(e){}}
  function names(){return {"arc-cyan":"ARC // CIANO","dcx-green":"DCX // VERDE","ghost-mono":"GHOST // MONO","void-violet":"VOID // VIOLETA","royal-sapphire":"ROYAL // SAFIRA","sakura-rose":"SAKURA // ROSÉ","sandstorm-desert":"SANDSTORM // AREIA","night-city-gold":"NIGHT CITY // OURO","edgerunners2-burn":"EDGERUNNERS 2 // BURN","blackout-comfort":"BLACKOUT // DESCANSO"}}
  function sync(){
    document.querySelectorAll("[data-km-density-choice]").forEach(btn=>{const a=btn.dataset.kmDensityChoice===state.density;btn.classList.toggle("active",a);btn.setAttribute("aria-pressed",a?"true":"false")});
    document.querySelectorAll("[data-km-theme-choice]").forEach(btn=>{const a=btn.dataset.kmThemeChoice===state.theme;btn.classList.toggle("active",a);btn.setAttribute("aria-pressed",a?"true":"false");const em=btn.querySelector('em');if(em)em.textContent=a?'ATIVO':'USAR'});
    const d=document.getElementById("kmDensityCurrent");if(d)d.textContent=state.density==="comfortable"?"CONFORTÁVEL":"COMPACTA";
    const c=document.getElementById("kmSettingsCurrent");if(c)c.textContent=`${names()[state.theme]} // ${state.density==="compact"?"COMPACTA":"CONFORTÁVEL"}`;
  }
  function apply(){document.documentElement.dataset.kmDensity=state.density;document.documentElement.dataset.kmTheme=state.theme;sync()}
  function setDensity(value){state.density=DENSITIES.has(value)?value:DEFAULTS.density;persist();apply()}
  function setTheme(value){if(!THEMES.has(value))return;state.theme=value;persist();apply()}
  function toggleDensity(){setDensity(state.density==="comfortable"?"compact":"comfortable")}
  function reset(){state={...DEFAULTS};persist();apply()}
  function bind(){
    document.querySelectorAll("[data-km-density-choice]").forEach(btn=>btn.addEventListener('click',()=>setDensity(btn.dataset.kmDensityChoice)));
    document.querySelectorAll("[data-km-theme-choice]").forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.kmThemeChoice)));
    document.getElementById('kmToggleDensity')?.addEventListener('click',toggleDensity);
    document.getElementById('kmResetSettings')?.addEventListener('click',reset);
    document.getElementById('kmOpenPlayer')?.addEventListener('click',()=>window.DCX?.Navigation?.goPlayer?.());
  }
  window.KMHUD={setDensity,toggleDensity,current:()=>state.density};
  window.KMSETTINGS={setTheme,setDensity,reset,get state(){return {...state}}};
  function init(){persist();apply();bind();console.info('[DCX OS] KEYMASTER SETTINGS V4 // 10 THEMES + DENSITY // LOCAL ONLY')}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
