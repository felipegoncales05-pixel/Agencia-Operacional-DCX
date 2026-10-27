/* DCX FICTIONAL ATLAS // Tokyo city geography and fictional road labels */
(()=>{
'use strict';
const TOKYO={lat:35.6762,lng:139.6503};
const names=['RUA DO WI-FI AMALDIÇOADO','AVENIDA CTRL+Z','TRAVESSA DO SUKUNA REVERSO','BECO DO NPC PERDIDO','VIA DA MALDIÇÃO 404','ALAMEDA DO CAFÉ INFINITO','RUA DO GATO CÓSMICO','AVENIDA DO PING 999','TRAVESSA DO PIXEL MORTO','BECO DO 1% DE BATERIA','RUA DO YAKISOBA QUÂNTICO','AVENIDA DO SHOGUN LAGADO','RUA DA MALDIÇÃO SEM SINAL','ALAMEDA YUMIYA.EXE','TRAVESSA DO CTRL+C','RUA DO MEME ANCESTRAL'];
const points=[
 ['lore-shibuya',35.6595,139.7005,'Terminal do Gato.exe','important','signal','Estação clandestina de comunicação. Um gato holográfico atende chamadas antes dos operadores.'],
 ['lore-akihabara',35.6984,139.7731,'Beco do FPS Negativo','interest','intel','Mercado de peças ilegais e amuletos tecnológicos no setor de Akihabara.'],
 ['lore-shinjuku',35.6938,139.7034,'Distrito Ctrl+Alt+Maldição','risk','warning','Distorções elétricas e anomalias amaldiçoadas sob as avenidas.'],
 ['lore-ueno',35.7138,139.7773,'Praça do NPC Perdido','interest','star','Anúncios digitais parecem conhecer o nome dos visitantes.'],
 ['lore-asakusa',35.7148,139.7967,'Santuário do Erro 404','important','portal','Portal temporal ocasional para arquivos que nunca deveriam existir.'],
 ['lore-ginza',35.6717,139.7645,'Café da Última Sanidade','important','medical','Refúgio da DCX para agentes cansados de salvar a realidade.'],
 ['lore-roppongi',35.6631,139.7300,'Túnel do Ping 999','risk','target','Ecos digitais e manifestações que saltam de uma linha temporal para outra.'],
 ['lore-odaiba',35.6267,139.7758,'Zona da Bateria Infinita','risk','warning','Drones não-registrados patrulham o bairro e interceptam comunicações.']
];
const seedPoints=Object.fromEntries(points.map(([id,lat,lng,title,type,icon,description],i)=>[id,{id,lat,lng,title,type,icon,description,image:'',stars:type==='risk'?3:1,threatCount:type==='risk'?5+i:0,threatType:type==='risk'?'unregistered':'humans',radius:'medium',preset:true,updatedAt:0}]));
function textExpr(){
 const expr=['match',['slice',['to-string',['coalesce',['get','name:en'],['get','name'],'X']],0,1]];
 for(let i=0;i<26;i++)expr.push(String.fromCharCode(65+i),names[(i*7)%names.length]);
 return [...expr,'RUA DO LOOP INFINITO'];
}
function adaptStyle(style){
 const copy=JSON.parse(JSON.stringify(style));
 for(const layer of copy.layers||[]){
  if(layer.type!=='symbol')continue;
  const id=String(layer.id||'').toLowerCase(),src=String(layer['source-layer']||'').toLowerCase();
  const road=/transportation_name/.test(src)||/(road|street|highway).*(label|name)/.test(id);
  const city=/(city|town|village)/.test(id)&&src==='place';
  if(road){
   layer.layout=layer.layout||{};
   layer.layout['text-field']=textExpr();
   layer.paint=layer.paint||{};layer.paint['text-color']='#90eef4';layer.paint['text-halo-color']='#07141f';layer.paint['text-halo-width']=1.4;
  }else if(!city){
   layer.layout=layer.layout||{};layer.layout.visibility='none';
  }
 }
 return copy;
}
function lib(){
 if(window.maplibregl?.Map)return Promise.resolve(window.maplibregl);
 if(window.DCX_AtlasLibrary)return window.DCX_AtlasLibrary;
 window.DCX_AtlasLibrary=new Promise((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href='https://cdn.jsdelivr.net/npm/maplibre-gl@5.8.0/dist/maplibre-gl.css';document.head.append(link);
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/maplibre-gl@5.8.0/dist/maplibre-gl.js';script.async=true;
  const timer=setTimeout(()=>reject(Error('MapLibre demorou para carregar')),14000);
  script.onload=()=>{clearTimeout(timer);window.maplibregl?.Map?resolve(window.maplibregl):reject(Error('MapLibre indisponível'))};
  script.onerror=()=>{clearTimeout(timer);reject(Error('Falha ao carregar atlas vetorial'))};document.head.append(script);
 }).catch(e=>{window.DCX_AtlasLibrary=null;throw e});
 return window.DCX_AtlasLibrary;
}
async function create({container,center=TOKYO,zoom=13,host=false,onClick,onSelect,onMouseMove,onCameraChange}){
 const [GL,response]=await Promise.all([lib(),fetch('https://tiles.openfreemap.org/styles/dark')]);
 if(!response.ok)throw Error('Estilo vetorial indisponível: '+response.status);
 const style=adaptStyle(await response.json());
 return new Promise((resolve,reject)=>{
  const map=new GL.Map({container,style,center:[center.lng,center.lat],zoom,dragRotate:false,pitchWithRotate:false,attributionControl:true});
  map.touchZoomRotate.disableRotation();
  if(host)map.dragPan.disable();
  let loaded=false;
  const timeout=setTimeout(()=>{if(!loaded){map.remove();reject(Error('Timeout do atlas'))}},17000);
  map.on('load',()=>{
   loaded=true;clearTimeout(timeout);
   const markerPool=[];
   function setPoints(rows){
    markerPool.forEach(p=>p.remove());markerPool.length=0;
    for(const p of Object.values(rows||{})){
     const el=document.createElement('button');el.type='button';
     el.className='dcxVectorPin dcxVectorPin-'+p.type+(p.preset?' dcxVectorPreset':'');
     el.textContent=p.type==='risk'?'⚠':p.type==='important'?'◆':'◎';el.title=p.title;el.setAttribute('aria-label',p.title);
     el.addEventListener('click',e=>{e.stopPropagation();onSelect?.(p)});
     markerPool.push(new GL.Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map));
    }
    const risk={type:'FeatureCollection',features:Object.values(rows||{}).filter(p=>p.type==='risk').map(p=>({type:'Feature',properties:{radius:p.radius},geometry:{type:'Point',coordinates:[p.lng,p.lat]}}))};
    map.getSource('dcx-risk')?.setData(risk);
   }
   map.addSource('dcx-risk',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
   map.addLayer({id:'dcx-risk-circles',source:'dcx-risk',type:'circle',paint:{'circle-radius':['match',['get','radius'],'small',30,'medium',65,'large',110,65],'circle-color':'#ff3858','circle-opacity':.19,'circle-stroke-color':'#ff7388','circle-stroke-width':2}});
   map.on('click',e=>onClick?.({lat:e.lngLat.lat,lng:e.lngLat.lng}));
   map.on('mousemove',e=>onMouseMove?.({lat:e.lngLat.lat,lng:e.lngLat.lng}));
   map.on('moveend',()=>onCameraChange?.());
   if(host){
    const c=map.getCanvasContainer();let move=null;c.addEventListener('contextmenu',e=>e.preventDefault());
    c.addEventListener('pointerdown',e=>{if(e.button!==2||e.target.closest('.dcxVectorPin'))return;move={x:e.clientX,y:e.clientY};c.setPointerCapture?.(e.pointerId)});
    c.addEventListener('pointermove',e=>{if(!move)return;map.panBy([move.x-e.clientX,move.y-e.clientY],{duration:0});move={x:e.clientX,y:e.clientY}});
    c.addEventListener('pointerup',e=>{if(e.button===2)move=null});c.addEventListener('pointercancel',()=>move=null);
   }
   resolve({setPoints,zoom:()=>map.getZoom(),center:()=>({lat:map.getCenter().lat,lng:map.getCenter().lng}),setZoom:z=>map.setZoom(z),setCenter:(p,z)=>map.jumpTo({center:[p.lng,p.lat],zoom:z}),flyTo:(p,z)=>map.flyTo({center:[p.lng,p.lat],zoom:z,duration:550}),resize:()=>map.resize(),destroy:()=>map.remove()});
  });
  map.on('error',e=>console.warn('[DCX Atlas] Tile/style',e.error));
 });
}
window.DCX=window.DCX||{};window.DCX.FictionalAtlas={TOKYO,seedPoints,roadNames:names,create};
})();