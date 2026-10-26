(()=>{'use strict';
if(!/keymaster\.html$/i.test(location.pathname))return;
const $=id=>document.getElementById(id);
const images={normal:'yumiya-normal.png',fear:'yumiya-medo.png',embarrassed:'yumiya-envergonhada.png',anger:'yumiya-raiva.png',happy:'yumiya-feliz.png'};
const names={normal:'NORMAL',fear:'MEDO',embarrassed:'ENVERGONHADA',anger:'RAIVA',happy:'FELIZ'};
let delivered={portrait:'normal',anger:12,tension:18,euphoria:10},connected=false;
const number=(n,f)=>Math.min(100,Math.max(0,Math.round(Number(n) || f || 0)));
function paint(prefix,data,detail){
 const portrait=images[data.portrait]?data.portrait:'normal';
 const img=$(prefix+'Portrait'),name=$(prefix+'Name'),subtitle=$(prefix+'Detail');
 if(img&&img.dataset.portrait!==portrait){img.dataset.portrait=portrait;img.src=images[portrait];img.onerror=()=>{img.hidden=true;img.parentElement?.classList.add('imageMissing')};img.onload=()=>{img.hidden=false;img.parentElement?.classList.remove('imageMissing')}}
 if(name)name.textContent=names[portrait];
 if(subtitle)subtitle.textContent=detail;
 for(const k of ['anger','tension','euphoria']){const value=number(data[k],0),bar=$(prefix+k+'Bar'),out=$(prefix+k+'Value');if(bar)bar.style.width=value+'%';if(out)out.textContent=value+'%'}
}
function draft(){
 const chosen=document.querySelector('#yumiyaPortraitCtl [data-portrait].gold')?.dataset.portrait||'normal';
 return {portrait:chosen,anger:document.getElementById('yumiyaAngerCtl')?.value||12,tension:document.getElementById('yumiyaTensionCtl')?.value||18,euphoria:document.getElementById('yumiyaEuphoriaCtl')?.value||10};
}
function update(){
 if(!$('yuMonitorDraftPortrait'))return;
 paint('yuMonitorDraft',draft(),'PRÓXIMA TRANSMISSÃO · AINDA NÃO ENVIADA');
 paint('yuMonitorLive',delivered,connected?'ÚLTIMA REAÇÃO TRANSMITIDA':'AGUARDANDO CONEXÃO');
}
function deliveredReaction(state){
 const c=state?.comms||{},timeline=Array.isArray(c.timeline)?c.timeline:[];
 const msgs=timeline.filter(m=>m?.kind==='yumiya'&&m.reaction&&(!m.targetUid||m.targetUid==='all'));
 const latest=msgs[msgs.length-1];
 return latest?.reaction||c.deliveredAffect||delivered;
}
function init(){
 if(!$('yuMonitorDraftPortrait'))return;
 document.querySelector('[data-km-view="yumiya"]')?.addEventListener('input',e=>{if(e.target.closest('.kmAffectPanel'))update()});
 document.querySelector('#yumiyaPortraitCtl')?.addEventListener('click',()=>requestAnimationFrame(update));
 document.querySelector('[data-km-view="yumiya"]')?.addEventListener('change',e=>{if(e.target.closest('.kmAffectPanel'))requestAnimationFrame(update)});
 window.OPH?.Realtime?.onState?.(state=>{connected=true;delivered=deliveredReaction(state);update()});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();