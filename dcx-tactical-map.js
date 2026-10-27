/* DCX CARTOGRAPHY // Google Maps + tactical grid fallback, room-synced via Firebase. */
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname);
const $=id=>document.getElementById(id);
const TYPES={interest:{label:'PONTO DE INTERESSE',badge:'INTERESSE'},important:{label:'PONTO IMPORTANTE',badge:'IMPORTANTE'},risk:{label:'ÁREA DE RISCO',badge:'PERIGO'}};
const ICONS=[['pin','◎'],['target','⌖'],['tower','▥'],['base','▣'],['star','★'],['signal','⌁'],['medical','✚'],['portal','◇'],['intel','◈'],['warning','⚠'],['sorcerer','✦'],['curses','☷']];
const THREATS={sorcerers:'Feiticeiros',humans:'Humanos',curses:'Maldições',unregistered:'Não-registrados'};
const RADIUS={small:{label:'PEQUENO',meters:250},medium:{label:'MÉDIO',meters:650},large:{label:'GRANDE',meters:1400}};
const DEFAULT_CENTER={lat:-23.5505,lng:-46.6333};
const INITIAL={center:DEFAULT_CENTER,zoom:13};
const COLOR=['#76e8f5','#e4f672','#fd7692'];
const clean=(v,n=200)=>String(v??'').trim().slice(0,n);
const safeCoord=(v,min,max,def)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):def;
const cap=(v,lo,hi,def)=>Number.isFinite(Number(v))?Math.min(hi,Math.max(lo,Math.round(Number(v)))):def;
const vec=p=>({lat:safeCoord(p?.lat,-85,85,DEFAULT_CENTER.lat),lng:safeCoord(p?.lng,-180,180,DEFAULT_CENTER.lng)});
const iconFor=id=>ICONS.find(x=>x[0]===id)?.[1]||'◎';
function safeUrl(value){
 const s=clean(value,900);if(!s)return '';
 try{const u=new URL(s);return u.protocol==='https:'?u.toString():''}catch{return ''}
}
function normalizePoint(p,id){
 if(!p||typeof p!=='object')return null;
 const loc=vec(p),type=TYPES[p.type]?p.type:'interest';
 return {id:clean(id,72),lat:loc.lat,lng:loc.lng,type,title:clean(p.title,90)||'SEM IDENTIFICAÇÃO',description:clean(p.description,1800),icon:ICONS.some(x=>x[0]===p.icon)?p.icon:(type==='risk'?'warning':'pin'),image:safeUrl(p.image),stars:cap(p.stars,1,5,1),threatCount:cap(p.threatCount,0,9999,0),threatType:THREATS[p.threatType]?p.threatType:'unregistered',radius:RADIUS[p.radius]?p.radius:'medium',updatedAt:cap(p.updatedAt,0,1e15,0)};
}
const clampZoom=v=>cap(v,3,19,13);
const roomData=()=>({points:{},center:{...DEFAULT_CENTER},zoom:13});
let data=roomData(),ref=null,sessionKey='',statusMessage='',root=null,board=null,overlay=null,sidebar=null,drawer=null,selectedId='',draftPos=null,map=null,mapLoaded=false,mapFailed=false,mapObjects=[],mapReady=false,pan=null,fallbackCenter={...DEFAULT_CENTER},fallbackZoom=13,initialized=false,watcher=null;
function context(){
 const api=window.OPH?.Realtime,db=api?.getFirebaseDatabase?.(),auth=api?.getFirebaseAuth?.();
 const uid=auth?.currentUser?.uid;
 if(!db||!uid)return null;
 const raw=api?.getRoom?.()||new URLSearchParams(location.search).get('room')||window.OPH_CONFIG?.defaultRoom||'FRIA-01';
 const room=String(raw).toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24)||'FRIA-01';
 return {db,uid,room};
}
function status(msg,error=false){
 statusMessage=msg;
 const n=$('dcxMapStatus');if(n){n.textContent=msg;n.dataset.error=error?'true':'false'}
}
function config(){
 const v=window.OPH_CONFIG?.map||{};
 return {apiKey:clean(v.apiKey,256),mapId:clean(v.mapId,128),center:vec(v.center||DEFAULT_CENTER)};
}
function getMapCenter(){const c=map?.getCenter?.();return c?{lat:c.lat(),lng:c.lng()}:{...fallbackCenter}}
function getMapZoom(){return map?Math.round(map.getZoom()||13):fallbackZoom}
function updateFromDb(value){
 const raw=value&&typeof value==='object'?value:{};
 const pts=raw.points&&typeof raw.points==='object'?raw.points:{};
 const values=Object.entries(pts).slice(0,400),points={};
 for(const [id,p] of values){const q=normalizePoint(p,id);if(q)points[id]=q}
 data={points,center:vec(raw.center||config().center),zoom:clampZoom(raw.zoom)};
 renderAll();
}
function attach(){
 const c=context();if(!c){status('AGUARDANDO FIREBASE // ENTRE NA SALA');return false}
 const key=c.room+'|'+c.uid;if(ref&&sessionKey===key)return true;
 if(ref)try{ref.off()}catch{}
 sessionKey=key;
 ref=c.db.ref('rooms/'+c.room+'/dcx/tacticalMap');
 ref.on('value',s=>{updateFromDb(s.val());status('MAPA SINCRONIZADO // SALA '+c.room)},e=>status('MAPA NÃO AUTORIZADO // '+(e?.message||e),true));
 return true;
}
function startWatch(){let attempts=0;const spin=()=>{if(attach()||++attempts>=150)clearInterval(watcher)};watcher=setInterval(spin,1200);spin()}
function writePoint(raw,id){
 const c=context();if(!c||!ref)return Promise.reject(new Error('Conecte o Keymaster ao Firebase antes de salvar.'));
 if(!HOST)return Promise.reject(new Error('Somente Keymaster pode editar.'));
 const node=normalizePoint(raw,id||'temp');
 const safe={lat:node.lat,lng:node.lng,type:node.type,title:node.title,description:node.description,icon:node.icon,image:node.image,stars:node.stars,threatCount:node.threatCount,threatType:node.threatType,radius:node.radius,updatedAt:Date.now()};
 const target=id?ref.child('points').child(id):ref.child('points').push();
 return target.set(safe);
}
function removePoint(id){if(!HOST||!ref)return Promise.reject(new Error('Sem permissão para excluir.'));return ref.child('points').child(id).remove()}
function updateMapCenter(){if(!HOST||!ref)return Promise.reject(new Error('Keymaster não conectado.'));return ref.update({center:getMapCenter(),zoom:getMapZoom()})}
function tab(label,icon,fn,cls=''){
 const b=document.createElement('button');b.type='button';b.className='dcxMapButton '+cls;b.textContent=icon+' '+label;b.addEventListener('click',fn);return b;
}
function text(tag,cls,str){const el=document.createElement(tag);if(cls)el.className=cls;if(str!==undefined)el.textContent=String(str);return el}
function createShell(){
 const pane=HOST?document.querySelector('[data-km-view="tactical-map"]'):document.querySelector('[data-workspace="map"]');
 if(!pane)return;
 root=text('div','dcxTacticalMap');root.id='dcxTacticalMap';
 const hero=text('header','dcxMapHero');
 const caption=text('div','dcxMapHeroTitle');
 caption.append(text('small','', 'DCX // CYBER CARTOGRAPHY'),text('h1','', 'MAPA TÁTICO'));
 const hint=text('p','',HOST?'M1: criar marcador · M2: arrastar câmera · roda: zoom · clique em um ping para editar':'Arraste com o mouse ou toque para mover · roda para zoom · clique nos pings para investigar');
 caption.append(hint);
 const actions=text('div','dcxMapHeroActions');
 actions.append(tab('−','',()=>zoom(-1)),tab('+','',()=>zoom(1)));
 actions.append(tab('CENTRALIZAR','⌖',()=>{centerMap(data.center,data.zoom)}));
 if(HOST)actions.append(tab('SALVAR CENTRO','◈',async()=>{try{await updateMapCenter();status('CENTRO DO MAPA ATUALIZADO PARA TODOS.')}catch(e){status(e.message,true)}},'dcxMapSaveCenter'));
 hero.append(caption,actions);
 const layout=text('div','dcxMapLayout');
 const field=text('div','dcxMapField');
 const bar=text('div','dcxMapFieldBar');
 bar.append(text('span','','◉ DCX // TACTICAL GEO-LINK'),text('span','dcxMapCoords','LAT —  LNG —'));
 board=text('div','dcxMapCanvas');board.id='dcxMapCanvas';board.setAttribute('aria-label','Mapa interativo com controles de navegação');
 board.tabIndex=0;
 overlay=text('div','dcxMapOverlay');overlay.id='dcxMapOverlay';board.append(overlay);
 const cross=text('div','dcxMapCrosshair');cross.setAttribute('aria-hidden','true');cross.textContent='+';
 board.append(cross);
 const notice=text('div','dcxMapSourceNotice','INICIALIZANDO SISTEMA CARTOGRÁFICO...');
 field.append(bar,board,notice);
 sidebar=text('aside','dcxMapSidebar');
 const top=text('div','dcxMapSideHeader');top.append(text('small','','DCX // GEOINT'),text('h2','','PONTOS IMPORTANTES'));
 const controls=text('div','dcxMapFilterBar');
 for(const [value,label] of [['all','TODOS'],['important','IMPORTANTES'],['interest','INTERESSE'],['risk','RISCOS']]){
  const b=tab(label,'',()=>{for(const c of controls.children)c.classList.toggle('active',c===b);renderSidebar(value)},value==='all'?'active':'');b.dataset.mapFilter=value;controls.append(b)
 }
 const list=text('div','dcxMapList');list.id='dcxMapList';
 const detail=text('div','dcxMapDetail');detail.id='dcxMapDetail';
 sidebar.append(top,controls,list,detail);
 layout.append(field,sidebar);
 const footer=text('div','dcxMapFooter');
 const count=text('span','');count.id='dcxMapSummary';footer.append(count);
 const msg=text('span','dcxMapStatus');msg.id='dcxMapStatus';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');footer.append(msg);
 root.append(hero,layout,footer);
 if(HOST){
  drawer=text('section','dcxMapEditor hidden');drawer.id='dcxMapEditor';
  root.append(drawer);
 }
 pane.append(root);bindBoard();renderAll();
}
function color(type){return type==='risk'?'#fc6479':type==='important'?'#e7f377':'#78e5f5'}
function makeDetail(p){
 const wrap=text('section','dcxMapDetailBody');
 const heading=text('div','dcxMapDetailHeading');
 heading.append(text('span','dcxMapDetailIcon',iconFor(p.icon)),text('div',''));
 heading.lastElementChild.append(text('small','',TYPES[p.type]?.label||'LOCAL'),text('h3','',p.title));wrap.append(heading);
 if(p.description)wrap.append(text('p','dcxMapDescription',p.description));
 if(p.type==='risk'){
  const meta=text('div','dcxMapRiskMeta');
  meta.append(text('strong','','★'.repeat(p.stars)+'☆'.repeat(5-p.stars)),text('span','',THREATS[p.threatType]),text('span','','AMEAÇAS: '+p.threatCount),text('span','','RAIO: '+RADIUS[p.radius].label));wrap.append(meta)
 }
 if(p.image){
  const img=document.createElement('img');img.src=p.image;img.alt='Imagem do local: '+p.title;img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{img.remove();wrap.append(text('small','dcxMapImageError','Imagem indisponível.'))});wrap.append(img);
 }
 if(HOST)wrap.append(tab('EDITAR MARCADOR','✎',()=>openEditor(p)));
 return wrap;
}
function selectPoint(id,fly=true){
 const p=data.points[id];if(!p)return;
 selectedId=id;
 const el=$('dcxMapDetail');if(el){el.replaceChildren(makeDetail(p));}
 if(fly)moveTo(p);
 renderSidebar();
}
function renderSidebar(filter){
 const list=$('dcxMapList');if(!list)return;
 const active=filter||document.querySelector('.dcxMapFilterBar .dcxMapButton.active')?.dataset.mapFilter||'all';
 const points=Object.values(data.points).filter(p=>active==='all'||p.type===active)
  .sort((a,b)=>({important:0,risk:1,interest:2}[a.type]||0)-({important:0,risk:1,interest:2}[b.type]||0)||a.title.localeCompare(b.title));
 list.replaceChildren();
 if(!points.length)list.append(text('div','dcxMapEmpty',HOST?'Sem marcadores nesta categoria. Clique no mapa para criar.':'Nenhum ponto publicado nesta categoria.'));
 for(const p of points){
  const b=text('button','dcxMapItem'+(p.id===selectedId?' active':''));
  b.type='button';
  b.append(text('span','dcxMapItemGlyph',iconFor(p.icon)),text('span','dcxMapItemBody'));
  b.lastElementChild.append(text('b','',p.title),text('small','',p.type==='risk'?'RISCO '+p.stars+'★ // '+THREATS[p.threatType]:TYPES[p.type]?.label));
  b.addEventListener('click',()=>selectPoint(p.id));list.append(b)
 }
 if(!selectedId||!data.points[selectedId]){$('dcxMapDetail').replaceChildren(text('p','dcxMapDetailPlaceholder','Selecione um marcador para visualizar seus detalhes.'))}
}
function renderAll(){
 if(!root)return;
 const list=Object.values(data.points);
 const sums=$('dcxMapSummary');if(sums)sums.textContent='PONTOS '+list.length+'  //  ALERTAS '+list.filter(p=>p.type==='risk').length;
 if(selectedId&&!data.points[selectedId])selectedId='';
 renderSidebar();if(selectedId&&data.points[selectedId]){$('dcxMapDetail').replaceChildren(makeDetail(data.points[selectedId]));}
 renderMapObjects();
}
function canMapGoogle(){return !!config().apiKey&&!config().apiKey.includes('COLE_AQUI')}
function loadGoogle(){
 if(!canMapGoogle())return Promise.reject(new Error('Chave do Google Maps ainda não configurada.'));
 if(window.google?.maps?.Map)return Promise.resolve();
 if(window.DCX_GoogleMapsLoading)return window.DCX_GoogleMapsLoading;
 window.DCX_GoogleMapsLoading=new Promise((resolve,reject)=>{
  const cb='dcxMapsBoot'+Date.now();
  window[cb]=()=>{delete window[cb];resolve()};
  const script=document.createElement('script');
  const params=new URLSearchParams({key:config().apiKey,v:'weekly',callback:cb,loading:'async'});
  script.src='https://maps.googleapis.com/maps/api/js?'+params.toString();script.async=true;
  script.onerror=()=>{delete window[cb];reject(new Error('Google Maps não carregou. Confira chave, cobrança e restrições HTTP.'))};
  document.head.append(script);
 });
 return window.DCX_GoogleMapsLoading;
}
const googleStyles=[
 {elementType:'geometry',stylers:[{color:'#07121c'}]},{elementType:'labels.text.fill',stylers:[{color:'#7b9eb8'}]},
 {elementType:'labels.text.stroke',stylers:[{color:'#07111b'}]},{featureType:'road',elementType:'geometry',stylers:[{color:'#183447'}]},
 {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#265767'}]},
 {featureType:'water',elementType:'geometry',stylers:[{color:'#030914'}]},{featureType:'poi',stylers:[{visibility:'off'}]},
 {featureType:'transit',stylers:[{visibility:'off'}]},{featureType:'landscape',elementType:'geometry',stylers:[{color:'#09121c'}]}
];
function initGoogle(){
 return loadGoogle().then(()=>{
  mapLoaded=true;
  const parent=$('dcxMapOverlay');
  if(!parent)return;
  parent.replaceChildren();
  const node=text('div','dcxMapGoogle');parent.append(node);
  map=new google.maps.Map(node,{center:data.center||config().center,zoom:data.zoom||13,tilt:0,heading:0,
   disableDefaultUI:true,keyboardShortcuts:true,streetViewControl:false,mapTypeControl:false,clickableIcons:false,
   gestureHandling:HOST?'none':'greedy',draggable:!HOST,scrollwheel:!HOST,mapTypeId:'roadmap',styles:googleStyles,backgroundColor:'#08121a'});
  if(HOST){
   map.addListener('click',e=>{if(pan?.moved)return;openEditor(null,{lat:e.latLng.lat(),lng:e.latLng.lng()})});
   node.addEventListener('contextmenu',e=>e.preventDefault());
   node.addEventListener('mousedown',e=>{if(e.button===2){pan={x:e.clientX,y:e.clientY,moved:false};e.preventDefault()}});
   document.addEventListener('mousemove',e=>{if(!pan)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(Math.abs(dx)+Math.abs(dy))pan.moved=true;map.panBy(-dx,-dy);pan.x=e.clientX;pan.y=e.clientY});
   document.addEventListener('mouseup',e=>{if(e.button===2)pan=null});
   node.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1:-1)},{passive:false});
  }
  map.addListener('mousemove',e=>updateCoords({lat:e.latLng.lat(),lng:e.latLng.lng()}));
  const notice=document.querySelector('.dcxMapSourceNotice');if(notice)notice.textContent='GOOGLE MAPS // VISTA SUPERIOR // MODO CYBERNEON';
  renderMapObjects();
  status('GOOGLE MAPS CARREGADO // VISUALIZAÇÃO AO VIVO');
 }).catch(e=>{
  mapFailed=true;initFallback();
  status('MODO TÁTICO ALTERNATIVO // '+e.message,true);
 });
}
function clearObjects(){
 for(const o of mapObjects){try{o.setMap(null)}catch{}}
 mapObjects=[];
}
function renderMapObjects(){
 if(!board)return;
 if(map){
  clearObjects();const overlays=Object.values(data.points);
  for(const p of overlays){
   if(p.type==='risk'){
    const circle=new google.maps.Circle({map,center:{lat:p.lat,lng:p.lng},radius:RADIUS[p.radius].meters,
      fillColor:'#ec3556',fillOpacity:.22,strokeColor:'#fc667c',strokeOpacity:.85,strokeWeight:1.8,clickable:true,zIndex:1});
    circle.addListener('click',()=>HOST?openEditor(p):selectPoint(p.id,false));
    mapObjects.push(circle);
   }
   // Legacy Marker remains supported by the API without a map ID. Avoids requiring the advanced marker Map ID.
   const marker=new google.maps.Marker({map,position:{lat:p.lat,lng:p.lng},
     title:p.title,label:{text:iconFor(p.icon),color:'#05121a',fontWeight:'bold',fontSize:'16px'},
     icon:{path:google.maps.SymbolPath.CIRCLE,scale:p.type==='risk'?19:17,
       fillColor:color(p.type),fillOpacity:.96,strokeColor:'#02131b',strokeWeight:3},zIndex:p.type==='risk'?3:4});
   marker.addListener('click',()=>HOST?openEditor(p):selectPoint(p.id,false));
   mapObjects.push(marker);
  }
 }else if(mapFailed||!canMapGoogle()){renderFallback()}
}
function startMap(){
 fallbackCenter={...(data.center||config().center)};fallbackZoom=data.zoom||13;
 if(canMapGoogle())initGoogle();else{mapFailed=true;initFallback();status('MAPA TÁTICO DEMO // CONFIGURE A API DO GOOGLE PARA VER RUAS REAIS')}
}
function latLngToWorld(p,zoom){
 const lat=Math.max(-85,Math.min(85,p.lat)),sin=Math.sin(lat*Math.PI/180);
 const scale=256*Math.pow(2,zoom);
 return{x:(p.lng+180)/360*scale,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale}
}
function worldToLatLng(x,y,zoom){
 const scale=256*Math.pow(2,zoom),lng=x/scale*360-180;
 const n=Math.PI-2*Math.PI*y/scale,lat=180/Math.PI*Math.atan(Math.sinh(n));
 return {lat:Math.min(85,Math.max(-85,lat)),lng:Math.max(-180,Math.min(180,lng))};
}
function locate(p){
 const mid=latLngToWorld(fallbackCenter,fallbackZoom),to=latLngToWorld(p,fallbackZoom);
 return {x:board.clientWidth/2+to.x-mid.x,y:board.clientHeight/2+to.y-mid.y}
}
function screenPoint(x,y){
 const mid=latLngToWorld(fallbackCenter,fallbackZoom);
 return worldToLatLng(mid.x+x-board.clientWidth/2,mid.y+y-board.clientHeight/2,fallbackZoom);
}
function updateCoords(p){
 const badge=q('.dcxMapCoords');if(badge)badge.textContent=(p.lat>=0?'+':'')+p.lat.toFixed(5)+'° / '+(p.lng>=0?'+':'')+p.lng.toFixed(5)+'°';
}
function initFallback(){
 if(map)return;
 const stage=$('dcxMapOverlay');if(!stage)return;
 stage.classList.add('dcxMapFallback');stage.setAttribute('role','application');
 const notice=q('.dcxMapSourceNotice');if(notice)notice.textContent='DCX TACTICAL GRID // SEM CHAVE GOOGLE MAPS // COORDENADAS REAIS';
 renderFallback();
}
function renderFallback(){
 const stage=$('dcxMapOverlay');if(!stage||map)return;
 stage.replaceChildren();
 const grid=text('div','dcxMapGrid');stage.append(grid);
 const center=latLngToWorld(fallbackCenter,fallbackZoom);
 const size=Math.max(22,Math.min(180,128*Math.pow(2,(fallbackZoom-13)*.5)));
 grid.style.backgroundSize=size+'px '+size+'px';
 grid.style.backgroundPosition=(-center.x%size)+'px '+(-center.y%size)+'px';
 const halo=text('div','dcxMapHalo');stage.append(halo);
 for(const p of Object.values(data.points)){
  const pos=locate(p),btn=text('button','dcxMapPin dcxMapPin-'+p.type);
  btn.type='button';btn.style.left=pos.x+'px';btn.style.top=pos.y+'px';btn.title=p.title;
  if(p.type==='risk'){
   const radiusPx=RADIUS[p.radius].meters/(156543.03392*Math.cos(p.lat*Math.PI/180)/Math.pow(2,fallbackZoom));
   const circle=text('span','dcxMapDangerCircle');circle.style.width=radiusPx*2+'px';circle.style.height=radiusPx*2+'px';btn.append(circle);
  }
  const icon=text('span','dcxMapPinSymbol',iconFor(p.icon));btn.append(icon);
  btn.addEventListener('click',e=>{e.stopPropagation();HOST?openEditor(p):selectPoint(p.id,false)});stage.append(btn);
 }
 updateCoords(fallbackCenter);
}
function zoom(d){
 if(map){map.setZoom(Math.min(19,Math.max(3,(map.getZoom()||13)+d)))}
 else{fallbackZoom=clampZoom(fallbackZoom+d);renderFallback()}
}
function moveTo(p){
 if(map){map.panTo({lat:p.lat,lng:p.lng});if(map.getZoom()<14)map.setZoom(14)}
 else{fallbackCenter={lat:p.lat,lng:p.lng};fallbackZoom=Math.max(fallbackZoom,14);renderFallback()}
}
function centerMap(p,z){
 if(map){map.panTo(p);map.setZoom(z||13)}
 else{fallbackCenter={...p};fallbackZoom=clampZoom(z);renderFallback()}
}
function bindBoard(){
 let down=null;
 board.addEventListener('contextmenu',e=>{if(HOST)e.preventDefault()});
 board.addEventListener('pointerdown',e=>{
  if(map)return;
  if(e.target.closest('.dcxMapPin'))return;
  if((HOST&&e.button!==2)||(!HOST&&e.button!==0))return;
  down={x:e.clientX,y:e.clientY,c:{...fallbackCenter},moved:false};
  board.setPointerCapture?.(e.pointerId);
 });
 board.addEventListener('pointermove',e=>{
  if(map)return;
  if(!down){const r=board.getBoundingClientRect();updateCoords(screenPoint(e.clientX-r.left,e.clientY-r.top));return}
  const a=latLngToWorld(down.c,fallbackZoom);
  const diffX=e.clientX-down.x,diffY=e.clientY-down.y;
  if(Math.abs(diffX)+Math.abs(diffY)>3)down.moved=true;
  fallbackCenter=worldToLatLng(a.x-diffX,a.y-diffY,fallbackZoom);
  renderFallback();
 });
 board.addEventListener('pointerup',e=>{if(!down)return;down=null});
 board.addEventListener('pointercancel',()=>down=null);
 board.addEventListener('click',e=>{
  if(map||!HOST||e.target.closest('.dcxMapPin'))return;
  const r=board.getBoundingClientRect();
  openEditor(null,screenPoint(e.clientX-r.left,e.clientY-r.top));
 });
 board.addEventListener('wheel',e=>{if(map)return;e.preventDefault();zoom(e.deltaY<0?1:-1)},{passive:false});
 board.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')zoom(1);if(e.key==='-')zoom(-1)});
 const observer=new ResizeObserver(()=>{if(!map&&root&&mapFailed)renderFallback()});
 observer.observe(board);
}
function closeEditor(){drawer?.classList.add('hidden');draftPos=null}
function openEditor(point,pos){
 if(!HOST||!drawer)return;
 selectedId=point?.id||'';
 draftPos=point?{lat:point.lat,lng:point.lng}:pos;
 if(!draftPos){status('Selecione uma posição com o mouse.',true);return}
 drawer.classList.remove('hidden');drawer.replaceChildren();
 const form=document.createElement('form');form.className='dcxMapForm';
 const head=text('div','dcxMapEditHead');
 const h=text('div','');h.append(text('small','',point?'DCX // EDITAR LOCAL':'DCX // NOVO PING'),text('h2','',point?.title||'PUBLICAR PONTO NO MAPA'));
 head.append(h,tab('FECHAR','×',closeEditor));form.append(head);
 function field(title,el){const label=text('label','dcxMapFormField');label.append(text('span','',title),el);form.append(label);return el}
 function input(value,max=90){const e=document.createElement('input');e.value=value||'';e.maxLength=max;return e}
 function select(opts,selected){const el=document.createElement('select');for(const [v,name] of opts){const o=document.createElement('option');o.value=v;o.textContent=name;el.append(o)}el.value=selected;return el}
 const category=field('TIPO DE MARCADOR',select(Object.entries(TYPES).map(([v,c])=>[v,c.label]),point?.type||'interest'));
 const name=field('NOME DO LOCAL',input(point?.title,90));name.required=true;name.placeholder='Ex.: Distrito industrial abandonado';
 const desc=document.createElement('textarea');desc.maxLength=1800;desc.rows=5;desc.value=point?.description||'';desc.placeholder='Descrição que será exibida aos jogadores';field('DESCRIÇÃO',desc);
 const symbols=field('SÍMBOLO DO PING',select(ICONS.map(([key,v])=>[key,v+' // '+key.toUpperCase()]),point?.icon||'pin'));
 const image=field('LINK HTTPS DE IMAGEM (OPCIONAL)',input(point?.image,900));image.type='url';image.placeholder='https://.../imagem.png';
 const risk=text('div','dcxMapRiskFields');form.append(risk);
 const star=fieldIn(risk,'NÍVEL DE RISCO (ESTRELAS)',select([1,2,3,4,5].map(n=>[String(n),'★'.repeat(n)+'☆'.repeat(5-n)]),String(point?.stars||1)));
 const count=fieldIn(risk,'NÚMERO DE AMEAÇAS',input(String(point?.threatCount??0),5));count.type='number';count.min='0';count.max='9999';
 const threat=fieldIn(risk,'TIPO DE AMEAÇA',select(Object.entries(THREATS),point?.threatType||'unregistered'));
 const radius=fieldIn(risk,'RAIO DA ÁREA',select(Object.entries(RADIUS).map(([k,v])=>[k,v.label]),point?.radius||'medium'));
 category.addEventListener('change',()=>{risk.hidden=category.value!=='risk';if(category.value==='risk'&&symbols.value==='pin')symbols.value='warning'});
 risk.hidden=category.value!=='risk';
 const posText=text('div','dcxMapEditCoordinates','COORDENADAS '+draftPos.lat.toFixed(5)+', '+draftPos.lng.toFixed(5));
 form.append(posText);
 const actions=text('div','dcxMapEditActions');
 const submit=tab(point?'SALVAR ALTERAÇÕES':'PUBLICAR NO MAPA','✓',()=>{},'dcxMapSubmit');
 submit.type='submit';submit.onclick=null;actions.append(submit);
 if(point)actions.append(tab('EXCLUIR','×',async()=>{
  if(!window.confirm('Excluir este marcador do mapa compartilhado?'))return;
  try{await removePoint(point.id);selectedId='';closeEditor();status('MARCADOR EXCLUÍDO.')}catch(e){status('ERRO AO EXCLUIR: '+e.message,true)}
 },'dcxMapDelete'));
 form.append(actions);
 form.addEventListener('submit',async e=>{
  e.preventDefault();submit.disabled=true;
  const photo=image.value.trim();if(photo&&!safeUrl(photo)){status('Imagem deve usar endereço HTTPS válido.',true);submit.disabled=false;return}
  const record={...draftPos,type:category.value,title:name.value,description:desc.value,icon:symbols.value,image:photo,stars:Number(star.value),
   threatCount:Number(count.value),threatType:threat.value,radius:radius.value};
  try{await writePoint(record,point?.id||'');closeEditor();status('PONTO PUBLICADO NO FIREBASE.');}
  catch(err){status('NÃO FOI POSSÍVEL SALVAR: '+err.message,true)}
  finally{submit.disabled=false}
 });
 drawer.append(form);name.focus();
}
function fieldIn(parent,title,control){const wrap=text('label','dcxMapFormField');wrap.append(text('span','',title),control);parent.append(wrap);return control}
function ensureTabs(){
 if(HOST){
  const nav=$('kmWorkspaceTabs');if(!nav)return;
  if(!nav.querySelector('[data-tab="tactical-map"]')){
   const b=document.createElement('button');b.type='button';b.className='kmWorkspaceTab';b.dataset.tab='tactical-map';b.textContent='⌖ MAPA';
   const after=nav.querySelector('[data-tab="missions"]')||nav.querySelector('[data-tab="master"]');
   after?.insertAdjacentElement('afterend',b)||nav.append(b);
   // Since dcx-admin.js binds tabs before this module, drive existing exposed method via its own public API.
   b.addEventListener('click',()=>{window.DCX?.Admin?.switchTab?.('tactical-map');nav.querySelectorAll('.kmWorkspaceTab').forEach(v=>v.classList.toggle('active',v===b));document.querySelectorAll('.kmWorkspaceView').forEach(v=>v.classList.toggle('active',v.dataset.kmView==='tactical-map'))});
  }
  if(!document.querySelector('[data-km-view="tactical-map"]')){
   const pane=text('section','kmWorkspaceView');pane.dataset.kmView='tactical-map';
   const after=document.querySelector('[data-km-view="missions"]');
   if(after)after.insertAdjacentElement('afterend',pane);else nav.insertAdjacentElement('afterend',pane);
  }
 }else{
  const nav=$('playerWorkspaceBar');if(!nav)return;
  if(!nav.querySelector('[data-workspace-target="map"]')){
   const b=text('button','playerWorkspaceTab');b.type='button';b.id='workspaceTabMap';b.dataset.workspaceTarget='map';
   b.append(text('small','','GEO-LINK DCX'),text('b','','MAPA'),text('span','','PONTOS // ALERTAS'));
   const after=$('workspaceTabCharacters');after?.insertAdjacentElement('afterend',b)||nav.append(b);
   b.addEventListener('click',()=>{
    document.querySelectorAll('.playerWorkspacePane').forEach(p=>p.classList.toggle('active',p.dataset.workspace==='map'));
    document.querySelectorAll('.playerWorkspaceTab').forEach(n=>n.classList.toggle('active',n===b));
    try{sessionStorage.setItem('dcx-map-tab-active','1')}catch{}
    setTimeout(()=>{window.google?.maps?.event?.trigger?.(map,'resize');if(!map)renderFallback()},100);
   });
   nav.querySelectorAll('.playerWorkspaceTab:not([data-workspace-target="map"])').forEach(tab=>tab.addEventListener('click',()=>{const p=$('dcxMapPlayerPane');if(p)p.classList.remove('active')}));
  }
  if(!$('dcxMapPlayerPane')){
   const pane=text('section','playerWorkspacePane dcxMapPane');
   pane.id='dcxMapPlayerPane';pane.dataset.workspace='map';
   const chars=$('workspaceCharacters');chars?.insertAdjacentElement('afterend',pane)||nav.insertAdjacentElement('afterend',pane);
  }
 }
}
function start(){
 ensureTabs();createShell();startMap();startWatch();
}
window.DCX=window.DCX||{};
window.DCX.Cartography={get points(){return Object.values(data.points)},selectPoint,zoom,openEditor};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();