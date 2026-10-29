(()=>{
'use strict';
const $=id=>document.getElementById(id);
function updateClock(){
  const el=$('kmAccessClock');if(!el)return;
  const now=new Date();
  const date=new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(now);
  const time=new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
  el.textContent=date+' // '+time+' UTC';
}
function updateNetwork(){
  const gate=$('login'),label=$('kmAccessNetwork');if(!gate||!label)return;
  const online=navigator.onLine;
  gate.classList.toggle('isOffline',!online);
  label.textContent=online?'REDE DISPONÍVEL':'REDE INDISPONÍVEL';
}
function updateMode(){
  const el=$('kmAccessMode');if(!el)return;
  const firebase=!!window.OPH_CONFIG?.firebase?.enabled;
  el.textContent=firebase?'PROTOCOLO // FIREBASE AUTH':'PROTOCOLO // CREDENCIAL LOCAL';
}
function init(){
  updateClock();updateNetwork();updateMode();
  setInterval(updateClock,1000);
  addEventListener('online',updateNetwork);
  addEventListener('offline',updateNetwork);
  $('login')?.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||e.target.closest('button'))return;
    e.preventDefault();
    window.KM?.connect?.();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();