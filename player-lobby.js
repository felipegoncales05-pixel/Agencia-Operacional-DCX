/* Player reception. Presentation only; room permissions remain enforced by Firebase. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  let active=true,busy=false,revision=0,issueDuringConnect=false,prepareTimer=null;
  const cleanRoom=v=>String(v||'FRIA-01').toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24)||'FRIA-01';
  const cleanName=v=>String(v||'').trim().replace(/\s+/g,' ').slice(0,40);
  const stored=key=>{try{return localStorage.getItem(key)||''}catch{return''}};
  function room(){return cleanRoom($('dcxLobbyRoom')?.value)}
  function status(message,tone='neutral'){
    const el=$('dcxAccessStatus');if(!el)return;
    el.textContent=message;el.dataset.tone=tone;
  }
  function lockConsole(){
    document.body.classList.add('dcxLobbyActive');
    const console=$('dcxPlayerConsole');if(console){console.hidden=true;console.setAttribute('inert','');}
    $('dcxAccessGate')?.classList.remove('hidden');
  }
  function network(){
    const online=navigator.onLine!==false;
    $('dcxLobbyNetwork').textContent=online?'REDE DISPONÍVEL':'SEM CONEXÃO DE REDE';
    $('dcxAccessGate').dataset.offline=String(!online);
  }
  function clock(){
    const el=$('dcxLobbyClock');if(!el)return;
    el.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' // BRASÍLIA';
  }
  function setBusy(value){
    busy=value;
    $('dcxLobbyForm').setAttribute('aria-busy',String(value));
    $('dcxLobbySubmit').disabled=value;
    for(const id of ['dcxLobbyRoom','dcxAccessName','dcxAccessKey'])$(id).readOnly=value;
    $('dcxLobbyButtonText').textContent=value?'VALIDANDO ACESSO':'ACESSAR CENTRAL';
  }
  function showResult(result){
    const needKey=!!result.requireKey;
    $('dcxLobbyKeyField').hidden=!needKey;
    $('dcxAccessKey').required=needKey&&!result.savedKeyValid;
    $('dcxLobbyKeyHint').textContent=result.savedKeyValid?'Uma Key salva foi validada. Deixe em branco para reutilizá-la.':'Informe a Key fornecida pelo Keymaster.';
    $('dcxLobbyAccessMode').textContent=result.local?'TERMINAL LOCAL':needKey?'ACESSO POR CONVITE':'IDENTIFICAÇÃO DE OPERADOR';
    $('dcxLobbyRoomPreview').textContent=room();
    $('dcxLobbyMasterLink').href='keymaster.html?room='+encodeURIComponent(room());
    status(result.message||'Sala pronta. Identifique-se para continuar.',result.allowed?'ready':'error');
    if(result.field)$(result.field)?.setAttribute('aria-invalid','true');
  }
  async function prepare(){
    if(!active||busy)return;
    const own=++revision;
    status('Consultando as condições de entrada da sala…');
    try{
      if(!window.DCX?.Player?.checkAccess)throw Error('Validação indisponível');
      const result=await window.DCX.Player.checkAccess({roomId:room()});
      if(own!==revision||!active||busy)return;
      showResult(result);$('dcxLobbySubmit').disabled=false;
    }catch{
      if(own!==revision||!active||busy)return;
      status('Não foi possível consultar a sala. Tente acessar novamente.','error');
      $('dcxLobbySubmit').disabled=false;
    }
  }
  function showError(message){
    issueDuringConnect=true;active=true;revision++;lockConsole();
    status(message||'Não foi possível concluir a entrada. Tente novamente.','error');
  }
  function finish(){
    active=false;revision++;
    $('dcxAccessGate').classList.add('hidden');
    const console=$('dcxPlayerConsole');console.hidden=false;console.removeAttribute('inert');
    document.body.classList.remove('dcxLobbyActive','dcxAccessLocked');
    const title=console.querySelector('.brand b');
    if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
    window.scrollTo({top:0,behavior:'instant'});
    document.dispatchEvent(new CustomEvent('dcx-lobby-entered',{detail:{room:room()}}));
  }
  async function enter(){
    if(!active||busy)return false;
    const name=cleanName($('dcxAccessName').value);
    if(!name){status('Informe o nome do operador ou personagem.','error');$('dcxAccessName').setAttribute('aria-invalid','true');$('dcxAccessName').focus();return false;}
    const requestRoom=room();$('dcxLobbyRoom').value=requestRoom;
    revision++;issueDuringConnect=false;setBusy(true);
    for(const id of ['dcxAccessName','dcxAccessKey'])$(id).removeAttribute('aria-invalid');
    status('Validando a sala e sua autorização…');
    try{
      const result=await window.DCX.Player.checkAccess({roomId:requestRoom,code:$('dcxAccessKey').value});
      showResult(result);
      if(!result.allowed)return false;
      $('room').value=requestRoom;$('name').value=name;
      if(result.acceptedKey){try{localStorage.setItem('dcx-access-key-'+requestRoom,result.acceptedKey)}catch{}}
      const connected=await window.OPHPlayer.connect({fromLobby:true});
      if(connected!==true||issueDuringConnect){if(!issueDuringConnect)showError('Não foi possível conectar à sala. Tente novamente.');return false;}
      finish();return true;
    }catch(e){
      console.warn('[DCX LOBBY] Entrada não concluída',e);
      showError('Não foi possível validar a entrada. Confira a conexão e tente novamente.');return false;
    }finally{setBusy(false);}
  }
  function open(){
    if(busy)return;
    window.OPHPlayer?.toggleYumiyaChat?.(false);
    active=true;issueDuringConnect=false;lockConsole();
    $('dcxLobbyRoom').value=cleanRoom($('room')?.value||room());
    $('dcxAccessName').value=cleanName($('name')?.value||$('dcxAccessName').value);
    $('dcxAccessKey').value='';
    $('dcxAccessKey').required=false;$('dcxLobbyKeyField').hidden=true;
    $('dcxLobbyGreeting').textContent=$('dcxAccessName').value?'BEM-VINDO DE VOLTA, '+$('dcxAccessName').value.toUpperCase():'SUA PRÓXIMA OPERAÇÃO COMEÇA AQUI.';
    window.scrollTo({top:0,behavior:'instant'});prepare();
    $('dcxLobbyTitle')?.focus({preventScroll:true});
  }
  function init(){
    if(!$('dcxAccessGate')||!$('dcxLobbyForm'))return;
    lockConsole();
    const initial=new URLSearchParams(location.search).get('room')||stored('oph-room')||window.OPH_CONFIG?.defaultRoom;
    $('dcxLobbyRoom').value=cleanRoom(initial);
    let identity=null;try{identity=JSON.parse(stored('oph-yumiya-identity-'+room())||'null')}catch{}
    const name=cleanName(identity?.name||stored('oph-name'));
    $('dcxAccessName').value=name;
    $('dcxLobbyGreeting').textContent=name?'BEM-VINDO DE VOLTA, '+name.toUpperCase():'SUA PRÓXIMA OPERAÇÃO COMEÇA AQUI.';
    $('dcxLobbyRoomPreview').textContent=room();
    $('dcxLobbyForm').addEventListener('submit',e=>{e.preventDefault();enter();});
    $('dcxLobbyRoom').addEventListener('input',()=>{
      revision++;clearTimeout(prepareTimer);$('dcxAccessKey').value='';
      $('dcxAccessKey').required=false;$('dcxAccessKey').removeAttribute('aria-invalid');$('dcxLobbyKeyField').hidden=true;
      $('dcxLobbyRoomPreview').textContent=room();status('Sala alterada. As condições serão verificadas antes de entrar.');
      prepareTimer=setTimeout(prepare,450);
    });
    for(const id of ['dcxAccessName','dcxAccessKey'])$(id).addEventListener('input',()=>$(id).removeAttribute('aria-invalid'));
    // Background terminal shortcuts must not navigate away from reception or steal focus.
    document.addEventListener('keydown',e=>{if(active&&((e.altKey&&!e.ctrlKey)||(e.ctrlKey&&['k','n'].includes(e.key.toLowerCase()))||(e.shiftKey&&e.key.toLowerCase()==='n'&&e.target.tagName!=='INPUT')))e.stopImmediatePropagation();},true);
    window.addEventListener('online',()=>{network();prepare()});window.addEventListener('offline',network);
    network();clock();setInterval(clock,60000);
    // player.js calls DCX.Player.bootstrap after all modules have initialized.
  }
  window.DCX=window.DCX||{};
  window.DCX.Lobby={prepare,enter,open,showError,isActive:()=>active,hasAccessError:()=>issueDuringConnect};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
