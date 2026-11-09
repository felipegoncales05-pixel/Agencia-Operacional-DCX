(()=>{'use strict';
if(!/keymaster\.html$/i.test(location.pathname))return;
const $=id=>document.getElementById(id);
const portraits=OPH.YumiyaPortraits;
const names={normal:'NORMAL',fear:'MEDO',embarrassed:'ENVERGONHADA',anger:'RAIVA',happy:'FELIZ'};
let delivered={portrait:'normal',anger:12,tension:18,euphoria:10},connected=false;
const number=(n,f)=>Math.min(100,Math.max(0,Math.round(Number(n) || f || 0)));
function paint(prefix,data,detail){
 const portrait=portraits.normalizeMood(data.portrait);
 const name=$(prefix+'Name'),subtitle=$(prefix+'Detail');
 portraits.render(prefix+'Portrait',portrait);
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
