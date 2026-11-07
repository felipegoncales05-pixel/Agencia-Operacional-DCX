window.DCX=window.DCX||{};
(()=>{
  'use strict';
  const moodFiles={normal:'normal',fear:'medo',embarrassed:'envergonhada',anger:'raiva',happy:'feliz'};
  const moodNames={normal:'NORMAL',fear:'MEDO',embarrassed:'ENVERGONHADA',anger:'RAIVA',happy:'FELIZ'};
  const requests=new WeakMap();
  const motion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  const clean=value=>String(value||'standard').toLowerCase().replace(/[^a-z0-9_-]/g,'')||'standard';
  const keyOf=value=>moodFiles[value]?value:'normal';
  const reduced=()=>!!motion?.matches;
  function candidates(key,preset='standard',animate=true){
    key=keyOf(key);preset=clean(preset);const mood=moodFiles[key],list=[];
    if(preset!=='standard'){
      if(animate&&!reduced())list.push(`yumiya-${preset}-${mood}.gif`);
      list.push(`yumiya-${preset}-${mood}.png`);
    }
    if(animate&&!reduced())list.push(`yumiya-${mood}.gif`);
    list.push(`yumiya-${mood}.png`);
    if(key==='normal')list.push('yumiya-portrait.png');
    return [...new Set(list)];
  }
  function preload(src){
    return new Promise(resolve=>{
      const probe=new Image();
      probe.onload=()=>resolve(true);probe.onerror=()=>resolve(false);
      probe.src=`${src}?v=YUGIF1`;
    });
  }
  async function load(img,{key='normal',preset='standard',animate=true}={}){
    if(!img)return {ok:false,reason:'missing-element'};
    key=keyOf(key);preset=clean(preset);
    const request={};requests.set(img,request);img.classList?.add('isLoading');
    for(const src of candidates(key,preset,animate)){
      const ok=await preload(src);
      if(requests.get(img)!==request)return {ok:false,cancelled:true};
      if(!ok)continue;
      const loaded=await new Promise(resolve=>{
        img.onload=()=>resolve(true);img.onerror=()=>resolve(false);
        img.src=`${src}?v=YUGIF1`;
      });
      if(requests.get(img)!==request)return {ok:false,cancelled:true};
      if(!loaded)continue;
      img.dataset.yumiyaMood=key;img.dataset.yumiyaSource=src;img.classList?.remove('isLoading');
      return {ok:true,key,mood:moodFiles[key],src,animated:/\.gif$/i.test(src)};
    }
    if(requests.get(img)===request){img.classList?.remove('isLoading');delete img.dataset.yumiyaSource}
    return {ok:false,key,reason:'asset-unavailable'};
  }
  function announceMotionChange(){window.dispatchEvent(new CustomEvent('dcx-yumiya-motion-change',{detail:{reduced:reduced()}}))}
  motion?.addEventListener?.('change',announceMotionChange);
  window.DCX.YumiyaPortraits={candidates,load,keyOf,reduced,modeKey:()=>reduced()?'static':'animated',moodFiles:{...moodFiles},moodNames:{...moodNames}};
})();
