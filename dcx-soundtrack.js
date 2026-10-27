/* DCX SOUNDTRACK CONTROL // Keymaster scene cues + player-activated audio. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const HOST=/keymaster\.html$/i.test(location.pathname);
const ADMIN_UID='luVVp67PW7c53fs6dstTDNE46Nz1';
const STORE='dcx-player-soundtrack-v1';
const START_VOLUME=20;
const SAFETY_VERSION=2;
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
 if(['youtu.be','www.youtu.be','youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(parsed.hostname)){
  const parts=parsed.pathname.split('/').filter(Boolean);
  const video=parsed.hostname.includes('youtu.be')?parts[0]:
    ['shorts','live','embed','v'].includes(parts[0])?parts[1]:parts[0]==='watch'?parsed.searchParams.get('v'):null;
  const list=parsed.searchParams.get('list');
  if(typeof video==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(video))
   return {kind:'youtube',type:'video',id:video,url:'https://www.youtube.com/watch?v='+video};
  if(typeof list==='string'&&/^[a-zA-Z0-9_-]{10,140}$/.test(list)&&['playlist','watch','embed','videoseries'].includes(parts[0]))
   return {kind:'youtube',type:'playlist',id:list,url:'https://www.youtube.com/playlist?list='+list};
  throw new Error('Link YouTube inválido. Use Compartilhar → Copiar link do vídeo ou playlist.');
 }
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
   queue.push({id,title:clean(row.title)||'Sem título',kind:source.kind,type:source.type,url:source.url,spotifyId:source.kind==='spotify'?source.id:'',youtubeId:source.kind==='youtube'?source.id:''});
  }catch{}
 }
 const loop=['off','one','all'].includes(v.loop)?v.loop:'all';
 return {queue,currentId:queue.some(q=>q.id===v.currentId)?v.currentId:(queue[0]?.id||''),playing:!!v.playing,loop,volume:clip(v.volume,0,100,75),revision:Number(v.revision)||0,updatedAt:Number(v.updatedAt)||0};
}
const entry=()=>state.queue.find(q=>q.id===state.currentId)||null;
function embedSrc(track,api=false,autoplay=false){
 if(!track)return '';
 if(track.kind==='spotify')return 'https://open.spotify.com/embed/'+track.type+'/'+track.spotifyId+'?utm_source=generator&theme=0';
 if(track.kind!=='youtube')return '';
 const params=new URLSearchParams({rel:'0',playsinline:'1',loop:state.loop==='one'?'1':'0'});
 if(autoplay)params.set('autoplay','1');
 if(api){params.set('enablejsapi','1');params.set('origin',location.origin)}
 if(track.type==='playlist'){params.set('list',track.youtubeId);return 'https://www.youtube.com/embed/videoseries?'+params.toString()}
 if(state.loop==='one')params.set('playlist',track.youtubeId);
 return 'https://www.youtube.com/embed/'+track.youtubeId+'?'+params.toString();
}
let state=empty(),ref=null,connected='',session=null,local={enabled:true,volume:START_VOLUME},localRoom='',playerFrameKey='',audio=null,audioKey='',localSongId='',statusMessage='',youtubePlayer=null,youtubeGeneration=0,masterCursorId='',localCursorId='',autoplayBlocked=false,attemptedMediaKey='',apiReady=false,spotifyController=null,spotifyGeneration=0;
function context(){
 const api=window.OPH?.Realtime,auth=api?.getFirebaseAuth?.(),db=api?.getFirebaseDatabase?.();
 const user=auth?.currentUser;
 if(!db||!user)return null;
 return {db,uid:user.uid,room:api?.getRoom?.()||new URLSearchParams(location.search).get('room')||window.OPH_CONFIG?.defaultRoom||'FRIA-01'};
}
function restoreLocal(room){
 if(room===localRoom)return;
 localRoom=room;
 try{
  const all=JSON.parse(localStorage.getItem(STORE)||'{}'),saved=all[room];
  const oldVolume=clip(saved?.volume,0,100,START_VOLUME);
  local={enabled:typeof saved?.enabled==='boolean'?saved.enabled:true,
   volume:saved?.safetyVersion===SAFETY_VERSION?oldVolume:Math.min(START_VOLUME,oldVolume)};
  if(saved?.safetyVersion!==SAFETY_VERSION)saveLocal();
 }catch{local={enabled:true,volume:START_VOLUME}}
}
function saveLocal(){try{const all=JSON.parse(localStorage.getItem(STORE)||'{}');all[localRoom]={...local,safetyVersion:SAFETY_VERSION};localStorage.setItem(STORE,JSON.stringify(all))}catch{}}
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
  const oldId=state.currentId,oldPlaying=state.playing;
  state=normalize(snapshot.val());
  if(state.currentId!==oldId||state.playing!==oldPlaying||!masterCursorId){
   masterCursorId=state.currentId;localCursorId='';attemptedMediaKey='';
  }
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
function youtubeVolume(){
 if(youtubePlayer&&typeof youtubePlayer.setVolume==='function'){
  try{
   const volume=Math.round(state.volume*local.volume/100);
   youtubePlayer.setVolume(volume);
   if(volume<=0)youtubePlayer.mute?.();else youtubePlayer.unMute?.();
  }catch{}
 }
}
function loadYoutubeApi(){
 if(window.YT?.Player)return Promise.resolve();
 if(window.DCX_YoutubeApiPromise)return window.DCX_YoutubeApiPromise;
 window.DCX_YoutubeApiPromise=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{if(typeof previous==='function')try{previous()}catch{};resolve()};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  script.onerror=()=>{window.DCX_YoutubeApiPromise=null;reject(new Error('API YouTube indisponível'))};
  document.head.append(script);
 });
 return window.DCX_YoutubeApiPromise;
}
function advanceLocal(finishedId){
 if(!local.enabled||!state.playing||!state.queue.length)return;
 if(state.loop==='one'){if(youtubePlayer?.playVideo)try{youtubePlayer.seekTo(0,true);youtubePlayer.playVideo()}catch{};return}
 if(state.loop==='off'){status('Fim da faixa. Aguardando próxima seleção do Keymaster.');return}
 const index=state.queue.findIndex(q=>q.id===finishedId);
 if(index<0)return;
 localCursorId=state.queue[(index+1)%state.queue.length].id;
 attemptedMediaKey='';
 Promise.resolve().then(()=>renderPlayer());
}
function attachYoutubeControls(frame){
 const generation=++youtubeGeneration;
 loadYoutubeApi().then(()=>{
  if(generation!==youtubeGeneration||!frame.isConnected||!window.YT?.Player)return;
  youtubePlayer=new YT.Player(frame,{events:{
   onReady:event=>{
     if(generation!==youtubeGeneration)return;
     apiReady=true;
     try{event.target.mute()}catch{}
     youtubeVolume();
     try{event.target.setLoop(state.loop==='one')}catch{}
     if(local.enabled&&state.playing){
      attemptedMediaKey=playerFrameKey;
      try{event.target.playVideo()}catch{status('Toque no ▶ do YouTube para liberar o áudio.',true)}
     }
    },
    onStateChange:event=>{
     if(generation!==youtubeGeneration)return;
     if(event.data===window.YT?.PlayerState?.PLAYING){autoplayBlocked=false;status('♫ Reproduzindo áudio da sessão.')}
     if(event.data===window.YT?.PlayerState?.ENDED&&state.loop!=='one'){
      const finished=playerFrameKey;
      advanceLocal(finished);
     }
    },
    onAutoplayBlocked:()=>{
     if(generation!==youtubeGeneration)return;
     autoplayBlocked=true;
     status('O navegador bloqueou o autoplay com som. Clique em TOCAR AGORA para liberar a música.',true);
     updatePlayerControls();
    },
   onError:event=>{
    if(generation!==youtubeGeneration)return;
    const code=event.data;
    status([101,150].includes(code)?'O autor bloqueou a reprodução incorporada. Escolha outro vídeo.':
      code===100?'Vídeo indisponível ou privado.':
      code===153?'YouTube não reconheceu a origem do site. Verifique a hospedagem.':
      'Erro do player YouTube: '+code,true);
   }
  }});
 }).catch(()=>{if(generation===youtubeGeneration)status('Player YouTube abriu, mas o controle de volume remoto está indisponível.',true)});
}
function loadSpotifyApi(){
 if(window.DCX_SpotifyIframeAPI)return Promise.resolve(window.DCX_SpotifyIframeAPI);
 if(window.DCX_SpotifyApiPromise)return window.DCX_SpotifyApiPromise;
 window.DCX_SpotifyApiPromise=new Promise((resolve,reject)=>{
  const previous=window.onSpotifyIframeApiReady;
  window.onSpotifyIframeApiReady=api=>{
   window.DCX_SpotifyIframeAPI=api;
   if(typeof previous==='function')try{previous(api)}catch{}
   resolve(api);
  };
  const script=document.createElement('script');
  script.src='https://open.spotify.com/embed/iframe-api/v1';script.async=true;
  script.onerror=()=>{window.DCX_SpotifyApiPromise=null;reject(new Error('API do Spotify indisponível'))};
  document.head.append(script);
 });
 return window.DCX_SpotifyApiPromise;
}
function spotifyFallback(area,track,notice){
 if(!area||!area.isConnected)return;
 area.replaceChildren();
 const iframe=document.createElement('iframe');
 iframe.src=embedSrc(track);iframe.loading='eager';
 iframe.allow='autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.title='Spotify: '+track.title;area.append(iframe);
 status(notice||'Spotify pronto. Para ouvir, pressione Play no player oficial.');
}
function hostMarkup(){
 return '<div class="soundtrackIntro"><div class="soundtrackEyebrow">KEYMASTER // AMBIENT CONTROL</div><h1>SOUNDTRACK <span>CONTROL</span></h1><p>Escolha a atmosfera da operação. Os jogadores decidem quando ativar o áudio em seus próprios dispositivos.</p></div>'+
 '<div class="soundtrackColumns"><div class="soundtrackCard"><div class="soundtrackSectionHead"><span>01 // CENTRAL DE REPRODUÇÃO</span><b id="dcxSoundtrackConnection">SINCRONIZANDO...</b></div>'+
 '<div id="dcxSoundtrackKmNow" class="soundtrackNow"></div>'+
 '<div class="soundtrackTransport"><button class="btn" data-st-act="previous" title="Faixa anterior" type="button">⏮ ANTERIOR</button><button class="btn gold" data-st-act="toggle" id="dcxSoundtrackToggle" type="button">▶ LIBERAR TRILHA</button><button class="btn" data-st-act="next" title="Próximo item da fila" type="button">PRÓXIMA ⏭</button></div>'+
 '<div class="soundtrackFields"><label>VOLUME GERAL <output id="dcxSoundtrackKmVolValue">75%</output><input id="dcxSoundtrackKmVolume" type="range" min="0" max="100" value="75"></label>'+
 '<label>REPETIÇÃO<select id="dcxSoundtrackKmLoop"><option value="off">SEM REPETIÇÃO</option><option value="one">REPETIR VÍDEO / FAIXA</option><option value="all">REPETIR PLAYLIST / ÁUDIO</option></select></label></div>'+
 '<p class="soundtrackNote">No YouTube e em arquivos de áudio, a DCX controla o volume. No Spotify incorporado, não é possível reduzir o volume por este site; por segurança, não há autoplay Spotify.</p>'+
 '<div class="soundtrackEmbed" id="dcxSoundtrackKmPreview"></div>'+
 '<div class="soundtrackMessage" id="dcxSoundtrackKmStatus" role="status" aria-live="polite"></div></div>'+
 '<div class="soundtrackCard"><div class="soundtrackSectionHead"><span>02 // BIBLIOTECA DA SALA</span><b>MÁX. 40 ITENS</b></div>'+
 '<div class="soundtrackAdd"><label>NOME DA FAIXA OU PLAYLIST<input type="text" id="dcxSoundtrackAddTitle" maxlength="90" placeholder="Ex.: Neblina no distrito 07"></label>'+
 '<label>LINK UNIVERSAL // YOUTUBE, SPOTIFY OU ÁUDIO<input type="url" id="dcxSoundtrackAddUrl" maxlength="1800" placeholder="https://www.youtube.com/watch?v=..."></label>'+
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
 $('dcxSoundtrackKmVolume').addEventListener('change',async e=>{try{await publish(s=>{s.volume=clip(e.target.value,0,100,75);return s});status('Volume geral atualizado para áudio direto e YouTube (quando disponível).')}catch(err){status(err.message,true)}});
 $('dcxSoundtrackKmLoop').addEventListener('change',async e=>{try{await publish(s=>{s.loop=e.target.value;return s});status('Modo de repetição atualizado.')}catch(err){status(err.message,true)}});
}
function renderHost(){
 if(!$('dcxSoundtrackKmRoot'))return;
 $('dcxSoundtrackConnection').textContent=connected?'FIREBASE // SALA '+session.room:'AGUARDANDO FIREBASE';
 const current=entry(),box=$('dcxSoundtrackKmNow');
 if(box)box.innerHTML=current?'<span class="soundtrackCover">♫</span><div><small>'+(current.kind==='youtube'?'YOUTUBE // '+esc(current.type.toUpperCase()):current.kind==='spotify'?'SPOTIFY // '+esc(current.type.toUpperCase()):'ÁUDIO DIRETO // HTML5')+'</small><strong>'+esc(current.title)+'</strong><span>'+(state.playing?'● DISPONÍVEL PARA JOGADORES':'○ PAUSADO PELO KEYMASTER')+'</span></div>':'<span class="soundtrackCover">♫</span><div><small>SEM MÚSICA SELECIONADA</small><strong>AGUARDANDO PRIMEIRA TRILHA</strong><span>ADICIONE UM LINK À BIBLIOTECA</span></div>';
 $('dcxSoundtrackToggle').textContent=state.playing?'■ SUSPENDER TRILHA':'▶ LIBERAR TRILHA';
 $('dcxSoundtrackKmVolume').value=String(state.volume);$('dcxSoundtrackKmVolValue').textContent=state.volume+'%';
 $('dcxSoundtrackKmLoop').value=state.loop;
 const list=$('dcxSoundtrackKmQueue');
 list.innerHTML=state.queue.length?state.queue.map((q,i)=>'<article class="soundtrackTrack '+(q.id===state.currentId?'active':'')+'"><span>'+(i+1).toString().padStart(2,'0')+'</span><div><b>'+esc(q.title)+'</b><small>'+ (q.kind==='youtube'?'YOUTUBE // '+esc(q.type.toUpperCase()):q.kind==='spotify'?'SPOTIFY // '+esc(q.type.toUpperCase()):'ÁUDIO DIRETO')+'</small></div><button class="btn" type="button" data-st-act="pick" data-id="'+esc(q.id)+'" title="Selecionar">▶</button><button class="btn" type="button" data-st-act="up" data-id="'+esc(q.id)+'" title="Subir">↑</button><button class="btn" type="button" data-st-act="down" data-id="'+esc(q.id)+'" title="Descer">↓</button><button class="btn" type="button" data-st-act="remove" data-id="'+esc(q.id)+'" title="Remover">×</button></article>').join(''):'<div class="soundtrackEmpty">Sua biblioteca está vazia. Adicione um link YouTube, Spotify ou MP3.</div>';
 const prev=$('dcxSoundtrackKmPreview'),desired=['youtube','spotify'].includes(current?.kind)?embedSrc(current):'';
 if(prev?.dataset.src!==desired){prev.dataset.src=desired;prev.replaceChildren();if(desired){const frame=document.createElement('iframe');frame.src=desired;frame.loading='lazy';frame.allow='accelerometer; autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture';frame.setAttribute('title','Prévia do player oficial da trilha sonora');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');prev.append(frame)}}
 if(statusMessage)status(statusMessage);
}
function unlockOnInteraction(){
 if(!local.enabled||!state.playing||!autoplayBlocked)return;
 const current=state.queue.find(q=>q.id===localCursorId)||entry();
 if(current?.kind==='youtube'&&youtubePlayer?.playVideo){
  try{youtubeVolume();youtubePlayer.playVideo()}catch{}
 }else if(current?.kind==='audio'&&audio?.paused){
  audio.play().then(()=>{autoplayBlocked=false;status('♫ Música liberada.');updatePlayerControls()}).catch(()=>{});
 }
}
function mountPlayer(){
 if($('dcxSoundtrackPlayerPanel'))return;
 const container=document.createElement('section');
 container.id='dcxSoundtrackPlayerPanel';container.className='dcxSoundtrackPlayerPanel hidden';container.setAttribute('aria-label','Trilha sonora da operação');container.setAttribute('aria-hidden','true');
 container.innerHTML='<header><div><small>DCX // AUDIO LINK</small><b>TRILHA SONORA</b></div><div class="soundtrackWindowActions"><button id="dcxSoundtrackMinimize" class="soundtrackClose" type="button" aria-label="Minimizar trilha sonora" title="Minimizar">−</button><button id="dcxSoundtrackClose" class="soundtrackClose soundtrackDismiss" type="button" aria-label="Fechar janela da trilha sonora" title="Fechar janela">×</button></div></header>'+
 '<div class="soundtrackPlayerBody"><div class="soundtrackPlayerCover"><span>♫</span><div><small id="dcxSoundtrackPlayerType">AGUARDANDO</small><h2 id="dcxSoundtrackPlayerTitle">NENHUMA TRILHA PUBLICADA</h2></div></div>'+
 '<div class="soundtrackPlayerButtons"><button id="dcxSoundtrackEnable" type="button" class="btn gold">▶ ATIVAR MÚSICA AUTOMÁTICA</button><button id="dcxSoundtrackResume" type="button" class="btn soundtrackResumeBtn" hidden>▶ TOCAR AGORA</button></div>'+
 '<div class="soundtrackPlayerVolume"><label for="dcxSoundtrackPlayerVolume">VOLUME PESSOAL <b id="dcxSoundtrackPlayerVolumeValue">20%</b></label><input id="dcxSoundtrackPlayerVolume" type="range" min="0" max="100" value="20"></div><p class="soundtrackVolumeHint" id="dcxSoundtrackPlayerVolumeHint">Volume de entrada: 20%.</p>'+
 '<div id="dcxSoundtrackPlayerMedia" class="soundtrackPlayerMedia"></div>'+
 '<p class="soundtrackMessage" id="dcxSoundtrackPlayerStatus" role="status" aria-live="polite">Conectando à sala...</p>'+
 '<p class="soundtrackNote">Autoplay ligado por padrão: YouTube e MP3 tentam tocar sem confirmação. Navegadores podem bloquear o som até a primeira interação no site. Por segurança, Spotify não inicia sozinho.</p></div>';
 document.body.append(container);
 const open=()=>{
  container.classList.remove('hidden','soundtrackCompact');
  container.setAttribute('aria-hidden','false');
  $('dcxSoundtrackMinimize').textContent='−';
  $('dcxSoundtrackMinimize').title='Minimizar';
  renderPlayer();
 };
 // X closes the HUD without stopping the soundtrack.
 const close=()=>{
  container.classList.add('hidden');
  container.classList.remove('soundtrackCompact');
  container.setAttribute('aria-hidden','true');
 };
 const minimize=()=>{
  if(container.classList.contains('soundtrackCompact')){open();return}
  container.classList.remove('hidden');
  container.classList.add('soundtrackCompact');
  container.setAttribute('aria-hidden','false');
  $('dcxSoundtrackMinimize').textContent='▢';
  $('dcxSoundtrackMinimize').title='Expandir trilha sonora';
 };
 $('dcxOpenSoundtrack')?.addEventListener('click',open);
 $('dcxSoundtrackLauncher')?.addEventListener('click',open);
 $('dcxSoundtrackClose').addEventListener('click',close);
 $('dcxSoundtrackMinimize').addEventListener('click',minimize);
 $('dcxSoundtrackEnable').addEventListener('click',()=>{
  local.enabled=!local.enabled;saveLocal();
  attemptedMediaKey='';autoplayBlocked=false;
  if(!local.enabled){clearMedia();status('Áudio desativado neste dispositivo.');container.classList.remove('soundtrackCompact')}
  else status('♫ Jukebox ativada: acompanhando as faixas do Keymaster.');
  renderPlayer();
 });
 $('dcxSoundtrackPlayerVolume').addEventListener('input',e=>{
  local.volume=clip(e.target.value,0,100,75);saveLocal();
  if(audio)audio.volume=clip(state.volume,0,100,75)/100*local.volume/100;youtubeVolume();
  $('dcxSoundtrackPlayerVolumeValue').textContent=local.volume+'%';
 });
 $('dcxSoundtrackResume').addEventListener('click',()=>{
  autoplayBlocked=false;attemptedMediaKey='';
  const current=state.queue.find(q=>q.id===localCursorId)||entry();
  if(current?.kind==='youtube'){
   if(youtubePlayer?.playVideo){
    try{youtubePlayer.playVideo();status('Tentando iniciar o YouTube...')}catch{}
   }else if(local.enabled&&state.playing){
    clearMedia();showYoutube(current);
   }
  }else if(current?.kind==='audio'){
   if(audio){audio.play().then(()=>status('♫ Reproduzindo áudio.')).catch(()=>status('Toque no Play do reprodutor.',true))}
   else playAudio(current)
  }else if(current?.kind==='spotify'){
   status('Spotify tem volume próprio. Ajuste o volume do aparelho antes de iniciar no player oficial.');
  }
  updatePlayerControls();
 });
 document.addEventListener('pointerdown',unlockOnInteraction,{capture:true,passive:true});
 document.addEventListener('keydown',e=>{unlockOnInteraction();if(e.key==='Escape'&&!container.classList.contains('hidden'))close()});
}
function clearMedia(){
 const area=$('dcxSoundtrackPlayerMedia');
 if(audio){audio.pause();audio.src='';audio=null}spotifyGeneration++;if(spotifyController){try{spotifyController.destroy()}catch{}spotifyController=null}youtubeGeneration++;apiReady=false;if(youtubePlayer){try{youtubePlayer.destroy()}catch{}youtubePlayer=null}
 if(area)area.replaceChildren();
 audioKey='';playerFrameKey='';localSongId='';
}
function showSpotify(track){
 const area=$('dcxSoundtrackPlayerMedia');if(!area)return;
 const key=track.id;
 if(playerFrameKey===key)return;
 clearMedia();playerFrameKey=key;
 const generation=++spotifyGeneration;
 const slot=document.createElement('div');slot.className='dcxSpotifySlot';area.append(slot);
 status('Preparando o player Spotify oficial…');
 loadSpotifyApi().then(api=>{
  if(generation!==spotifyGeneration||!slot.isConnected||!local.enabled)return;
  api.createController(slot,{uri:'spotify:'+track.type+':'+track.spotifyId,width:'100%',height:200},controller=>{
   if(generation!==spotifyGeneration){try{controller.destroy()}catch{};return}
   spotifyController=controller;
   controller.addListener('playback_started',()=>{if(generation===spotifyGeneration)status('♫ Spotify reproduzindo pelo player oficial.')});
   controller.addListener('ready',()=>{
    if(generation!==spotifyGeneration)return;
    status('Spotify preparado. Por segurança, o site não o inicia automaticamente: o volume do Spotify é independente. Ajuste o volume do dispositivo antes de dar Play.');
   });
   status('Spotify incorporado com reprodução manual. Ajuste o volume do aparelho antes de iniciar.');
  });
 }).catch(()=>{if(generation===spotifyGeneration)spotifyFallback(area,track,'Não foi possível usar a API do Spotify; use Play no player oficial.')});
}

function showYoutube(track){
 const area=$('dcxSoundtrackPlayerMedia');if(!area)return;
 if(playerFrameKey===track.id){youtubeVolume();if(youtubePlayer?.setLoop)try{youtubePlayer.setLoop(state.loop==='one')}catch{};return}
 clearMedia();playerFrameKey=track.id;
 const frame=document.createElement('iframe');frame.id='dcxYoutubePlayerFrame';
 frame.src=embedSrc(track,true,false);frame.loading='eager';
 frame.allow='accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture';
 frame.referrerPolicy='strict-origin-when-cross-origin';
 frame.title='YouTube: '+track.title;area.append(frame);
 attachYoutubeControls(frame);
 status('Preparando YouTube para iniciar automaticamente…');
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
   else advanceLocal(localSongId);
  });
 }
 if(!audio)return;
 audio.loop=state.loop==='one';
 audio.volume=(state.volume/100)*(local.volume/100);
 if(attemptedMediaKey!==track.id){
  attemptedMediaKey=track.id;
  audio.play().then(()=>{autoplayBlocked=false;status('♫ Reproduzindo áudio da sessão.')})
    .catch(()=>{autoplayBlocked=true;status('Navegador bloqueou o som. Clique em TOCAR AGORA.',true);updatePlayerControls()});
 }
}
function updatePlayerControls(){
 const b=$('dcxSoundtrackResume');if(!b)return;
 const current=state.queue.find(q=>q.id===localCursorId)||entry();
 b.hidden=!local.enabled||!state.playing||!current||!autoplayBlocked||current.kind==='spotify';
 b.textContent='▶ TOCAR AGORA';
}
function renderPlayer(){
 if(!$('dcxSoundtrackPlayerPanel'))return;
 const current=(state.queue.find(q=>q.id===localCursorId)||entry());
 $('dcxSoundtrackPlayerTitle').textContent=current?.title||'NENHUMA TRILHA PUBLICADA';
 $('dcxSoundtrackPlayerType').textContent=current?(current.kind==='youtube'?'YOUTUBE // '+current.type.toUpperCase():current.kind==='spotify'?'SPOTIFY // '+current.type.toUpperCase():'ÁUDIO DIRETO'):'AGUARDANDO KEYMASTER';
 $('dcxSoundtrackPlayerVolume').value=String(local.volume);
 $('dcxSoundtrackPlayerVolumeValue').textContent=local.volume+'%';
 $('dcxSoundtrackEnable').textContent=local.enabled?'■ DESATIVAR MÚSICA AUTOMÁTICA':'▶ REATIVAR MÚSICA AUTOMÁTICA';
 const spotifySource=current?.kind==='spotify';
 $('dcxSoundtrackPlayerVolume').disabled=spotifySource;
 const hint=$('dcxSoundtrackPlayerVolumeHint');
 if(hint){hint.textContent=spotifySource?
  'SPOTIFY: volume próprio. O controle da DCX não funciona nele; ajuste o aparelho antes de dar Play.':
  'VOLUME DCX: começa em 20%, ajustável aqui para YouTube ou áudio direto.';
  hint.dataset.spotify=spotifySource?'true':'false';}
 updatePlayerControls();
 const launcher=$('dcxSoundtrackLauncherLabel');if(launcher)launcher.textContent=current?(state.playing?'TRILHA DISPONÍVEL':'TRILHA PAUSADA'):'SEM TRILHA';
 if(!local.enabled){clearMedia();status('Seu áudio está desativado. Ative quando desejar.');return}
 // Never reopen the soundtrack window automatically when the track changes.
 if(!current||!state.playing){clearMedia();status(!current?'Aguardando o Keymaster selecionar uma trilha.':'O Keymaster suspendeu a trilha.');return}
 if(current.kind==='youtube')showYoutube(current);
 else if(current.kind==='spotify')showSpotify(current);
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