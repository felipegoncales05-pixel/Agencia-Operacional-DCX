/* DCX SOUNDTRACK CONTROL // Keymaster scene cues + player-activated audio. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const HOST=/keymaster\.html$/i.test(location.pathname);
const ADMIN_UID='1uVVp67PW7c53fs6dstTDNE46Nz1';
const STORE='dcx-player-soundtrack-v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(value,min,max,def)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.round(Number(value)))):def;
const empty=()=>({queue:[],currentId:'',playing:false,loop:'all',volume:75,revision:0,updatedAt:0});
const clean=v=>String(v||'').trim().slice(0,140);
function parseSource(link){
 const raw=String(link||'').trim();
 if(!raw||raw.length>1800)throw new Error('Insira um link público válido.');
 const spotifyUri=raw.match(/^spotify:(track|playlist|album|episode|show):([a-zA-Z0-9]{22})$/i);
 if(spotifyUri)return {kind:'spotify',type:spotifyUri[1].toLowerCase(),id:spotifyUri[2],url:'https://open.spotify.com/'+spotifyUri[1].toLowerCase()+'/'+spotifyUri[2]};
 let parsed;
 try{parsed=new URL(raw)}catch{throw new Error('O endereço precisa começar com https://')}
 if(parsed.protocol!=='https:')throw new Error('Use somente endereços HTTPS.');
 if(parsed.hostname==='open.spotify.com'){
  const match=parsed.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|playlist|album|episode|show)\/([a-zA-Z0-9]{22})\/?$/i);
  if(!match)throw new Error('Link Spotify inválido. Utilize Compartilhar → Copiar link.');
  return {kind:'spotify',type:match[1].toLowerCase(),id:match[2],url:'https://open.spotify.com/'+match[1].toLowerCase()+'/'+match[2]};
 }
 if(!/\.(mp3|ogg|oga|m4a|aac|wav)(?:$|\?)/i.test(parsed.pathname+parsed.search))
  throw new Error('Para áudio direto, use um arquivo .mp3, .ogg, .m4a ou .wav acessível por HTTPS.');
 parsed.hash='';
 return {kind:'audio',type:'audio',id:'',url:parsed.toString().slice(0,1800)};
}
function normalize(raw){
 const v=raw&&typeof raw==='object'?raw:{};
 const items=Array.isArray(v.queue)?v.queue:[];
 const queue=[];
 for(const row of items.slice(0,40)){
  if(!row||typeof row!=='object')continue;
  try{
   const source=parseSource(row.url);
   const id=/^[a-zA-Z0-9_-]{3,55}$/.test(String(row.id||''))?String(row.id):'S-'+queue.length+'-'+source.id;
   if(queue.some(item=>item.id===id))continue;
   queue.push({id,title:clean(row.title)||'Sem título',kind:source.kind,type:source.type,url:source.url,spotifyId:source.id});
  }catch{}
 }
 const loop=['off','one','all'].includes(v.loop)?v.loop:'all';
 return {queue,currentId:queue.some(q=>q.id===v.currentId)?v.currentId:(queue[0]?.id||''),playing:!!v.playing,loop,volume:clip(v.volume,0,100,75),revision:Number(v.revision)||0,updatedAt:Number(v.updatedAt)||0};
}
const entry=()=>state.queue.find(q=>q.id===state.currentId)||null;
const embedSrc=track=>track&&track.kind==='spotify'?'https://open.spotify.com/embed/'+track.type+'/'+track.spotifyId+'?utm_source=generator&theme=0':'';
let state=empty(),ref=null,connected='',session=null,local={enabled:false,volume:75},localRoom='',playerFrameKey='',audio=null,audioKey='',localSongId='',statusMessage='';
function context(){
 const api=window.OPH?.Realtime,auth=api?.getFirebaseAuth?.(),db=api?.getFirebaseDatabase?.();
 const user=auth?.currentUser;
 if(!db||!user)return null;
 return {db,uid:user.uid,room:api?.getRoom?.()||new URLSearchParams(location.search).get('room')||window.OPH_CONFIG?.defaultRoom||'FRIA-01'};
}
function restoreLocal(room){
 if(room===localRoom)return;
 localRoom=room;
 try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');local={enabled:!!all[room]?.enabled,volume:clip(all[room]?.volume,0,100,75)}}catch{local={enabled:false,volume:75}}
}
function saveLocal(){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');all[localRoom]=local;localStorage.setItem(STORE,JSON.stringify(all))}catch{}}
function status(message,error=false){statusMessage=message;const el=$(HOST?'dcxSoundtrackKmStatus':'dcxSoundtrackPlayerStatus');if(el){el.textContent=message;el.dataset.error=error?'true':'false'}}
function listen(){
 const c=context();
 if(!c){if(!connected)status('Aguardando conexão da sala com Firebase.');return false}
 const key=c.room+'|'+c.uid;
 if(connected===key&&ref)return true;
 if(ref){ref.off();ref=null}
 connected=key;session=c;
 restoreLocal(c.room);
 ref=c.db.ref('rooms/'+c.room+'/dcx/soundtrack');
 ref.on('value',snapshot=>{
  state=normalize(snapshot.val());
  render();
 },error=>{status('Não foi possível acessar a trilha: '+(error?.message||error),true);console.warn('[DCX SOUNDTRACK]',error)});
 render();
 return true;
}
async function publish(mutator){
 const c=context();
 if(!c)throw new Error('Keymaster desconectado do Firebase.');
 if(c.uid!==ADMIN_UID)throw new Error('Esta sessão não possui permissão de Keymaster.');
 // Keep a single write for queue, current item and transport state.
 const next=normalize(mutator(typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state))));
 next.revision=Date.now();next.updatedAt=firebase.database.ServerValue.TIMESTAMP;
 await c.db.ref('rooms/'+c.room+'/dcx/soundtrack').set(next);
}
const byId=id=>state.queue.findIndex(q=>q.id===id);
function nextId(current,direction=1){
 const n=state.queue.length,idx=byId(current);
 if(!n)return '';
 const newIndex=idx+direction;
 if(newIndex>=0&&newIndex<n)return state.queue[newIndex].id;
 return state.loop==='all'?state.queue[(newIndex+n)%n].id:current;
}
function hostMarkup(){
 return '<div class="soundtrackIntro"><div class="soundtrackEyebrow">KEYMASTER // AMBIENT CONTROL</div><h1>SOUNDTRACK <span>CONTROL</span></h1><p>Escolha a atmosfera da operação. Os jogadores decidem quando ativar o áudio em seus próprios dispositivos.</p></div>'+
 '<div class="soundtrackColumns"><div class="soundtrackCard"><div class="soundtrackSectionHead"><span>01 // CENTRAL DE REPRODUÇÃO</span><b id="dcxSoundtrackConnection">SINCRONIZANDO...</b></div>'+
 '<div id="dcxSoundtrackKmNow" class="soundtrackNow"></div>'+
 '<div class="soundtrackTransport"><button class="btn" data-st-act="previous" title="Faixa anterior" type="button">⏮ ANTERIOR</button><button class="btn gold" data-st-act="toggle" id="dcxSoundtrackToggle" type="button">▶ LIBERAR TRILHA</button><button class="btn" data-st-act="next" title="Próximo item da fila" type="button">PRÓXIMA ⏭</button></div>'+
 '<div class="soundtrackFields"><label>VOLUME GERAL <output id="dcxSoundtrackKmVolValue">75%</output><input id="dcxSoundtrackKmVolume" type="range" min="0" max="100" value="75"></label>'+
 '<label>REPETIÇÃO<select id="dcxSoundtrackKmLoop"><option value="off">SEM REPETIÇÃO</option><option value="one">REPETIR FAIXA (ÁUDIO DIRETO)</option><option value="all">REPETIR FILA (ÁUDIO DIRETO)</option></select></label></div>'+
 '<p class="soundtrackNote">No Spotify, o volume, o início e a repetição interna pertencem ao player oficial. Os botões do Keymaster controlam a seleção e a disponibilização do player, não a conta Spotify dos jogadores.</p>'+
 '<div class="soundtrackEmbed" id="dcxSoundtrackKmPreview"></div>'+
 '<div class="soundtrackMessage" id="dcxSoundtrackKmStatus" role="status" aria-live="polite"></div></div>'+
 '<div class="soundtrackCard"><div class="soundtrackSectionHead"><span>02 // BIBLIOTECA DA SALA</span><b>MÁX. 40 ITENS</b></div>'+
 '<div class="soundtrackAdd"><label>NOME DA FAIXA OU PLAYLIST<input type="text" id="dcxSoundtrackAddTitle" maxlength="90" placeholder="Ex.: Neblina no distrito 07"></label>'+
 '<label>LINK DO SPOTIFY OU ÁUDIO DIRETO<input type="url" id="dcxSoundtrackAddUrl" maxlength="1800" placeholder="https://open.spotify.com/playlist/..."></label>'+
 '<button type="button" class="btn gold" id="dcxSoundtrackAdd">+ ADICIONAR À FILA</button></div>'+
 '<div id="dcxSoundtrackKmQueue" class="soundtrackQueue"></div></div></div>';
}
function mountHost(){
 const root=$('dcxSoundtrackKmRoot');if(!root||root.dataset.mounted)return;
 root.dataset.mounted='1';root.innerHTML=hostMarkup();
 root.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-st-act]');const add=e.target.closest('#dcxSoundtrackAdd');
  if(!btn&&!add)return;
  if(add){
   const url=$('dcxSoundtrackAddUrl').value,title=$('dcxSoundtrackAddTitle').value;
   try{const track=parseSource(url);if(state.queue.length>=40)throw new Error('Limite de 40 itens atingido.');
    const item={id:'S-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),title:clean(title)||'Trilha '+(state.queue.length+1),url:track.url,kind:track.kind,type:track.type};
    add.disabled=true;
    await publish(s=>{s.queue.push(item);if(!s.currentId)s.currentId=item.id;return s});
    $('dcxSoundtrackAddUrl').value='';$('dcxSoundtrackAddTitle').value='';status('Item adicionado à biblioteca da sala.');
   }catch(error){status(error.message||String(error),true)}finally{add.disabled=false}return;
  }
  btn.disabled=true;
  try{
   const op=btn.dataset.stAct,id=btn.dataset.id;
   await publish(s=>{
    const idx=s.queue.findIndex(x=>x.id===id);
    if(op==='toggle'){if(!s.currentId)throw new Error('Adicione uma música primeiro.');s.playing=!s.playing}
    if(op==='next'||op==='previous'){
     if(!s.queue.length)throw new Error('A biblioteca está vazia.');
     const index=s.queue.findIndex(x=>x.id===s.currentId);
     const next=index+(op==='next'?1:-1);
     s.currentId=s.queue[(next+s.queue.length)%s.queue.length].id;
    }
    if(op==='pick'&&idx>=0){s.currentId=id}
    if(op==='remove'&&idx>=0){s.queue.splice(idx,1);if(s.currentId===id){s.currentId=s.queue[0]?.id||'';if(!s.currentId)s.playing=false}}
    if(op==='up'&&idx>0){[s.queue[idx-1],s.queue[idx]]=[s.queue[idx],s.queue[idx-1]]}
    if(op==='down'&&idx>=0&&idx<s.queue.length-1){[s.queue[idx+1],s.queue[idx]]=[s.queue[idx],s.queue[idx+1]]}
    return s;
   });
   status('Comando sincronizado com a sala.');
  }catch(error){status(error.message||String(error),true)}finally{btn.disabled=false}
 });
 $('dcxSoundtrackKmVolume').addEventListener('change',async e=>{try{await publish(s=>{s.volume=clip(e.target.value,0,100,75);return s});status('Volume geral enviado (para áudio direto).')}catch(err){status(err.message,true)}});
 $('dcxSoundtrackKmLoop').addEventListener('change',async e=>{try{await publish(s=>{s.loop=e.target.value;return s});status('Modo de repetição atualizado.')}catch(err){status(err.message,true)}});
}
function renderHost(){
 if(!$('dcxSoundtrackKmRoot'))return;
 $('dcxSoundtrackConnection').textContent=connected?'FIREBASE // SALA '+session.room:'AGUARDANDO FIREBASE';
 const current=entry(),box=$('dcxSoundtrackKmNow');
 if(box)box.innerHTML=current?'<span class="soundtrackCover">♫</span><div><small>'+(current.kind==='spotify'?'SPOTIFY // '+esc(current.type.toUpperCase()):'ÁUDIO DIRETO // HTML5')+'</small><strong>'+esc(current.title)+'</strong><span>'+(state.playing?'● DISPONÍVEL PARA JOGADORES':'○ PAUSADO PELO KEYMASTER')+'</span></div>':'<span class="soundtrackCover">♫</span><div><small>SEM MÚSICA SELECIONADA</small><strong>AGUARDANDO PRIMEIRA TRILHA</strong><span>ADICIONE UM LINK À BIBLIOTECA</span></div>';
 $('dcxSoundtrackToggle').textContent=state.playing?'■ SUSPENDER TRILHA':'▶ LIBERAR TRILHA';
 $('dcxSoundtrackKmVolume').value=String(state.volume);$('dcxSoundtrackKmVolValue').textContent=state.volume+'%';
 $('dcxSoundtrackKmLoop').value=state.loop;
 const list=$('dcxSoundtrackKmQueue');
 list.innerHTML=state.queue.length?state.queue.map((q,i)=>'<article class="soundtrackTrack '+(q.id===state.currentId?'active':'')+'"><span>'+(i+1).toString().padStart(2,'0')+'</span><div><b>'+esc(q.title)+'</b><small>'+ (q.kind==='spotify'?'SPOTIFY // '+esc(q.type.toUpperCase()):'ÁUDIO DIRETO')+'</small></div><button class="btn" type="button" data-st-act="pick" data-id="'+esc(q.id)+'" title="Selecionar">▶</button><button class="btn" type="button" data-st-act="up" data-id="'+esc(q.id)+'" title="Subir">↑</button><button class="btn" type="button" data-st-act="down" data-id="'+esc(q.id)+'" title="Descer">↓</button><button class="btn" type="button" data-st-act="remove" data-id="'+esc(q.id)+'" title="Remover">×</button></article>').join(''):'<div class="soundtrackEmpty">Sua biblioteca está vazia. Adicione um link de faixa ou playlist do Spotify.</div>';
 const prev=$('dcxSoundtrackKmPreview'),desired=current?.kind==='spotify'?embedSrc(current):'';
 if(prev?.dataset.src!==desired){prev.dataset.src=desired;prev.replaceChildren();if(desired){const frame=document.createElement('iframe');frame.src=desired;frame.loading='lazy';frame.allow='encrypted-media; clipboard-write; fullscreen; picture-in-picture';frame.setAttribute('title','Prévia do player oficial do Spotify');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');prev.append(frame)}}
 if(statusMessage)status(statusMessage);
}
function mountPlayer(){
 if($('dcxSoundtrackPlayerPanel'))return;
 const container=document.createElement('section');
 container.id='dcxSoundtrackPlayerPanel';container.className='dcxSoundtrackPlayerPanel hidden';container.setAttribute('aria-label','Trilha sonora da operação');container.setAttribute('aria-hidden','true');
 container.innerHTML='<header><div><small>DCX // AUDIO LINK</small><b>TRILHA SONORA</b></div><button id="dcxSoundtrackClose" class="soundtrackClose" type="button" aria-label="Fechar">×</button></header>'+
 '<div class="soundtrackPlayerBody"><div class="soundtrackPlayerCover"><span>♫</span><div><small id="dcxSoundtrackPlayerType">AGUARDANDO</small><h2 id="dcxSoundtrackPlayerTitle">NENHUMA TRILHA PUBLICADA</h2></div></div>'+
 '<div class="soundtrackPlayerButtons"><button id="dcxSoundtrackEnable" type="button" class="btn gold">▶ ATIVAR MEU ÁUDIO</button></div>'+
 '<div class="soundtrackPlayerVolume"><label for="dcxSoundtrackPlayerVolume">VOLUME PESSOAL <b id="dcxSoundtrackPlayerVolumeValue">75%</b></label><input id="dcxSoundtrackPlayerVolume" type="range" min="0" max="100" value="75"></div>'+
 '<div id="dcxSoundtrackPlayerMedia" class="soundtrackPlayerMedia"></div>'+
 '<p class="soundtrackMessage" id="dcxSoundtrackPlayerStatus" role="status" aria-live="polite">Conectando à sala...</p>'+
 '<p class="soundtrackNote">O Spotify requer que você inicie a música dentro do player oficial; os controles de volume e repetição do Spotify são independentes.</p></div>';
 document.body.append(container);
 const open=()=>{container.classList.remove('hidden');container.setAttribute('aria-hidden','false');renderPlayer()};
 const close=()=>{container.classList.add('hidden');container.setAttribute('aria-hidden','true')};
 $('dcxOpenSoundtrack')?.addEventListener('click',open);
 $('dcxSoundtrackLauncher')?.addEventListener('click',open);
 $('dcxSoundtrackClose').addEventListener('click',close);
 $('dcxSoundtrackEnable').addEventListener('click',()=>{
  local.enabled=!local.enabled;saveLocal();
  if(!local.enabled){clearMedia();status('Áudio desativado apenas neste dispositivo.')}else status('Áudio ativado neste dispositivo.');renderPlayer();
 });
 $('dcxSoundtrackPlayerVolume').addEventListener('input',e=>{
  local.volume=clip(e.target.value,0,100,75);saveLocal();
  if(audio)audio.volume=clip(state.volume,0,100,75)/100*local.volume/100;
  $('dcxSoundtrackPlayerVolumeValue').textContent=local.volume+'%';
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}
function clearMedia(){
 const area=$('dcxSoundtrackPlayerMedia');
 if(audio){audio.pause();audio.src='';audio=null}
 if(area)area.replaceChildren();
 audioKey='';playerFrameKey='';localSongId='';
}
function showSpotify(track){
 const area=$('dcxSoundtrackPlayerMedia');if(!area)return;
 const key=track.id;
 if(playerFrameKey===key)return;
 clearMedia();playerFrameKey=key;
 const frame=document.createElement('iframe');
 frame.src=embedSrc(track);frame.loading='eager';
 frame.allow='encrypted-media; clipboard-write; fullscreen; picture-in-picture';
 frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.title='Spotify: '+track.title;
 area.append(frame);
 status('Player Spotify pronto. Clique em ▶ dentro do Spotify para ouvir.');
}
function playAudio(track){
 const area=$('dcxSoundtrackPlayerMedia');if(!area)return;
 if(audioKey!==track.id){
  clearMedia();
  audioKey=track.id;localSongId=track.id;
  audio=document.createElement('audio');
  audio.controls=true;audio.preload='none';audio.src=track.url;area.append(audio);
  audio.addEventListener('error',()=>status('Não foi possível carregar o áudio. Verifique se o arquivo é público e permite reprodução.',true));
  audio.addEventListener('ended',()=>{
   if(!local.enabled||!state.playing)return;
   if(state.loop==='one'){audio.currentTime=0;audio.play().catch(()=>{})}
   else if(state.loop==='all'){const next=nextId(localSongId,1),item=state.queue.find(q=>q.id===next);if(item){if(item.kind==='audio')playAudio(item);else showSpotify(item)}}
  });
 }
 if(!audio)return;
 audio.loop=state.loop==='one';
 audio.volume=(state.volume/100)*(local.volume/100);
 audio.play().catch(()=>status('Clique no ▶ do reprodutor para liberar o áudio neste navegador.'));
}
function renderPlayer(){
 if(!$('dcxSoundtrackPlayerPanel'))return;
 const current=entry();
 $('dcxSoundtrackPlayerTitle').textContent=current?.title||'NENHUMA TRILHA PUBLICADA';
 $('dcxSoundtrackPlayerType').textContent=current?(current.kind==='spotify'?'SPOTIFY // '+current.type.toUpperCase():'ÁUDIO DIRETO'):'AGUARDANDO KEYMASTER';
 $('dcxSoundtrackPlayerVolume').value=String(local.volume);
 $('dcxSoundtrackPlayerVolumeValue').textContent=local.volume+'%';
 $('dcxSoundtrackEnable').textContent=local.enabled?'■ DESATIVAR ÁUDIO':'▶ ATIVAR MEU ÁUDIO';
 const launcher=$('dcxSoundtrackLauncherLabel');if(launcher)launcher.textContent=current?(state.playing?'TRILHA DISPONÍVEL':'TRILHA PAUSADA'):'SEM TRILHA';
 if(!local.enabled){clearMedia();status('Seu áudio está desativado. Ative quando desejar.');return}
 if(!current||!state.playing){clearMedia();status(!current?'Aguardando o Keymaster selecionar uma trilha.':'O Keymaster suspendeu a trilha.');return}
 if(current.kind==='spotify')showSpotify(current);
 else playAudio(current);
}
function render(){if(HOST)renderHost();else renderPlayer()}
function init(){
 if(HOST)mountHost();else mountPlayer();
 render();
 let attempts=0;
 const attempt=()=>{if(listen()){clearInterval(timer)}else if(++attempts>=120)clearInterval(timer)};
 const timer=setInterval(attempt,1400);
 attempt();
}
window.DCX=window.DCX||{};
window.DCX.Soundtrack={parseSource,normalize,get state(){return normalize(state)},refresh:listen};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();