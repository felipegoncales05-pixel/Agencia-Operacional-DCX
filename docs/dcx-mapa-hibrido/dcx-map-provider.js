/* DCX Hybrid Map Provider — opt-in integration adapter (MapLibre 5.x / OpenFreeMap).
 * Designed to implement the same public API as DCX.FictionalAtlas.create(...)
 * Built separately from production to prevent replacing the currently working
 * Canvas 2D renderer until testing.  License: project internal.
 */
(()=>{
'use strict';
const TOKYO={lat:35.6762,lng:139.6503};
const USA={lat:39,lng:-98};
const STYLE='https://tiles.openfreemap.org/styles/liberty';
const MAPLIBRE_JS='https://cdn.jsdelivr.net/npm/maplibre-gl@5.8.0/dist/maplibre-gl.js';
const MAPLIBRE_CSS='https://cdn.jsdelivr.net/npm/maplibre-gl@5.8.0/dist/maplibre-gl.css';
const RADIUS={small:250,medium:650,large:1400};
const noop=()=>{};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const jsonFeature=(geometry,properties)=>({type:'Feature',geometry,properties});
const fc=features=>({type:'FeatureCollection',features});
let libraryPromise;
function bootstrap(){
 if(window.maplibregl?.Map)return Promise.resolve(window.maplibregl);
 if(libraryPromise)return libraryPromise;
 libraryPromise=new Promise((resolve,reject)=>{
  if(!document.querySelector('[data-dcx-maplibre-css]')){
   const css=document.createElement('link');css.rel='stylesheet';css.href=MAPLIBRE_CSS;
   css.dataset.dcxMaplibreCss='true';document.head.append(css);
  }
  const js=document.createElement('script');js.src=MAPLIBRE_JS;js.async=true;
  let settled=false;
  const done=(error)=>{
   if(settled)return;settled=true;clearTimeout(timer);
   if(error)reject(error);else resolve(window.maplibregl);
  };
  const timer=setTimeout(()=>done(Error('Tempo esgotado para carregar MapLibre.')),15000);
  js.onload=()=>window.maplibregl?.Map?done():done(Error('MapLibre não inicializou.'));
  js.onerror=()=>done(Error('CDN de mapas indisponível.'));
  document.head.append(js);
 }).catch(error=>{libraryPromise=null;throw error});
 return libraryPromise;
}
function styleWithoutRealLabels(style){
 const result=JSON.parse(JSON.stringify(style));
 for(const layer of result.layers||[]){
  if(layer.type!=='symbol')continue;
  if(!layer.layout?.['text-field'])continue;
  // Hide labels from original map BEFORE first paint.
  // Only the separately authored DCX parody layer adds place names.
  const layerType=String(layer.id+' '+(layer['source-layer']||'')).toLowerCase();
  if(/road|street|highway|transport|poi|housenumber|address/.test(layerType))layer.layout.visibility='none';
 }
 return result;
}
async function remoteStyle(){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(STYLE,{signal:controller.signal,cache:'default'});
  if(!response.ok)throw Error('Não foi possível ler o estilo OpenFreeMap: HTTP '+response.status);
  return styleWithoutRealLabels(await response.json());
 }finally{clearTimeout(timeout)}
}
function polygonAround(lat,lng,meters){
 const R=6371008.8,ang=meters/R,phi1=lat*Math.PI/180,lambda1=lng*Math.PI/180,ring=[];
 for(let i=0;i<=48;i++){
  const bearing=2*Math.PI*i/48;
  const phi2=Math.asin(Math.sin(phi1)*Math.cos(ang)+Math.cos(phi1)*Math.sin(ang)*Math.cos(bearing));
  const lambda2=lambda1+Math.atan2(Math.sin(bearing)*Math.sin(ang)*Math.cos(phi1),Math.cos(ang)-Math.sin(phi1)*Math.sin(phi2));
  ring.push([lambda2*180/Math.PI,phi2*180/Math.PI]);
 }
 return {type:'Polygon',coordinates:[ring]};
}
function nearestCity(lat,lng,all){
 const cos=Math.cos(lat*Math.PI/180);
 return all.reduce((a,b)=>{
  const distance=x=>Math.hypot((x.lng-lng)*cos,x.lat-lat);
  return !a||distance(b)<distance(a)?b:a
 },null);
}
function labels(lex,atlas,city){
 const features=[],add=(lng,lat,name,kind)=>features.push(jsonFeature({type:'Point',coordinates:[lng,lat]},{label:name,kind}));
 for(const [name,lat,lng] of atlas?.COUNTRIES||[])add(lng,lat,name,'country');
 for(const item of atlas?.CITIES||[])add(item.lng,item.lat,item.name,'city');
 if(city&&lex?.locality){
  for(const kind of ['districts','neighborhoods','roads']){
   for(const item of lex.locality(city,kind))
    add(item.lng,item.lat,item.name,kind==='districts'?'district':kind==='roads'?'road':'neighborhood');
  }
 }
 return fc(features);
}
function addLabels(map){
 map.addSource('dcx-hybrid-labels',{type:'geojson',data:fc([])});
 const entries=[
  {name:'country',minzoom:1,maxzoom:8,size:12,color:'#82c7e7'},
  {name:'city',minzoom:3,maxzoom:16,size:11,color:'#bbecf4'},
  {name:'district',minzoom:9,maxzoom:19,size:12,color:'#f2faff'},
  {name:'neighborhood',minzoom:11,maxzoom:19,size:10,color:'#8bdeeb'},
  {name:'road',minzoom:13,maxzoom:19,size:9,color:'#67cbd9'}
 ];
 for(const e of entries)map.addLayer({
  id:'dcx-label-'+e.name,source:'dcx-hybrid-labels',type:'symbol',
  minzoom:e.minzoom,maxzoom:e.maxzoom,
  filter:['==',['get','kind'],e.name],
  layout:{
   'text-field':['get','label'],'text-size':e.size,
   'text-font':['Noto Sans Regular'],
   'text-allow-overlap':false,'text-ignore-placement':false,
   'text-padding':5,'text-max-width':14
  },
  paint:{
   'text-color':e.color,'text-halo-color':'#020914',
   'text-halo-width':1.4,'text-halo-blur':.5
  }
 });
}
function addPoints(map){
 map.addSource('dcx-hybrid-points',{type:'geojson',data:fc([])});
 map.addSource('dcx-hybrid-risks',{type:'geojson',data:fc([])});
 map.addLayer({id:'dcx-risk-fill',type:'fill',source:'dcx-hybrid-risks',
  paint:{'fill-color':'#ff315e','fill-opacity':.19}});
 map.addLayer({id:'dcx-risk-outline',type:'line',source:'dcx-hybrid-risks',
  paint:{'line-color':'#ff6f8e','line-opacity':.8,'line-width':1.5,'line-dasharray':[3,2]}});
 map.addLayer({id:'dcx-hybrid-pins',type:'circle',source:'dcx-hybrid-points',
  paint:{
   'circle-radius':['match',['get','type'],'important',11,'risk',12,10],
   'circle-color':['match',['get','type'],'important','#e4f478','risk','#fa617e','#6cddeb'],
   'circle-stroke-width':2.5,'circle-stroke-color':'#04121c'
  }});
 // Transparent-but-rendered hitboxes sit on top of place names and tiny pins.
 map.addLayer({id:'dcx-hybrid-pin-hits',type:'circle',source:'dcx-hybrid-points',
  paint:{'circle-radius':22,'circle-color':'#ffffff','circle-opacity':0.008,
   'circle-stroke-width':0}});
}
function create({container,center=TOKYO,zoom=12,host=false,onClick=noop,onSelect=noop,onMouseMove=noop,onCameraChange=noop}={}){
 return Promise.all([bootstrap(),remoteStyle()]).then(([GL,style])=>new Promise((resolve,reject)=>{
  let map;
  try{
   map=new GL.Map({container,style,center:[center.lng,center.lat],zoom,
    minZoom:1,maxZoom:19,dragRotate:false,attributionControl:true,
    pitchWithRotate:false,renderWorldCopies:true,maxPitch:0,antialias:false,
    fadeDuration:0,localIdeographFontFamily:'sans-serif'
   });
   map.touchZoomRotate.disableRotation();
   // Players and Keymaster use the same left-button drag-to-pan controls.
   map.dragPan.enable();
  }catch(e){reject(e);return}
  let ready=false,destroyed=false,lastCityId='',pointsById=new Map(),lastPoints={};
  let labelMode='complete',disposeTheme=noop,removeRightClick=noop;
  const timeout=setTimeout(()=>{if(!ready){map.remove();reject(Error('Não foi possível desenhar o mapa híbrido.'))}},18000);
  function camera(){const c=map.getCenter();return {lat:c.lat,lng:c.lng}}
  const atlas=()=>window.DCX?.FictionalAtlas||{};
  const lex=()=>window.DCX?.AtlasLexicon;
  const cities=()=>atlas().CITIES||[];
  const city=()=>nearestCity(camera().lat,camera().lng,cities());
  function updateLabels(force=false){
   if(destroyed||!ready)return;
   const nearest=city();
   const targetId=map.getZoom()>=8?nearest?.id||'':'';
   if(!force&&targetId===lastCityId)return;
   lastCityId=targetId;
   map.getSource('dcx-hybrid-labels')?.setData(labels(lex(),atlas(),targetId?nearest:null));
  }
  function applyVisibility(){
   if(!ready)return;
   const whole=labelMode==='complete';
   for(const kind of ['district','neighborhood','road']){
    if(map.getLayer('dcx-label-'+kind))map.setLayoutProperty('dcx-label-'+kind,'visibility',whole?'visible':'none');
   }
   for(const layer of map.getStyle()?.layers||[]){
    if(layer.type!=='symbol'||layer.id.startsWith('dcx-'))continue;
    const src=String(layer.id+' '+(layer['source-layer']||''));
    if(/road|street|highway|transport/i.test(src)){
     map.setLayoutProperty(layer.id,'visibility',whole?'visible':'none');
    }
   }
  }
  function applyTheme(){
   if(!ready)return;
   const colors=window.DCX?.MapColors?.palette?.();if(!colors)return;
   for(const layer of map.getStyle()?.layers||[]){
    const id=layer.id,src=String(id+' '+(layer['source-layer']||'')).toLowerCase();
    try{
     if(layer.type==='background')map.setPaintProperty(id,'background-color',colors.background);
     else if(layer.type==='fill'&&!id.startsWith('dcx-')){
      let col=colors.land;
      if(/water|lake|ocean|river/.test(src))col=colors.water;
      else if(/park|green|forest|wood|grass/.test(src))col=colors.park;
      else if(/building/.test(src))col=colors.building;
      map.setPaintProperty(id,'fill-color',col);
     }else if(layer.type==='line'&&!id.startsWith('dcx-')){
      if(/road|street|highway|transport/.test(src))map.setPaintProperty(id,'line-color',/minor|service|path/.test(src)?colors.minorRoad:colors.road);
      else if(/boundary|border|admin/.test(src))map.setPaintProperty(id,'line-color',colors.boundary);
     }
    }catch(e){}
   }
   // Strong black outlines on ALL place names, including the provider's native labels.
   // This must include Japanese and other script labels, not just DCX text layers.
   for(const layer of map.getStyle()?.layers||[]){
    if(layer.type!=='symbol')continue;
    const isText=!!layer.layout?.['text-field'];
    if(!isText)continue;
    try{
     map.setPaintProperty(layer.id,'text-halo-color','#020407');
     map.setPaintProperty(layer.id,'text-halo-width',2.35);
     map.setPaintProperty(layer.id,'text-halo-blur',0.35);
     if(layer.id.startsWith('dcx-label-'))map.setPaintProperty(layer.id,'text-color','#edf9ff');
    }catch(e){}
   }
   const surface=container.closest('.dcxTacticalMap');if(surface)surface.style.setProperty('--map-neon',colors.main);
  }
  function setPoints(rows){
   lastPoints=rows||{};
   pointsById=new Map();
   const pins=[],danger=[];
   for(const [id,p] of Object.entries(lastPoints)){
    if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))continue;
    pointsById.set(id,{...p,id});
    pins.push(jsonFeature({type:'Point',coordinates:[Number(p.lng),Number(p.lat)]},{id,type:p.type||'interest'}));
    if(p.type==='risk')danger.push(jsonFeature(
     polygonAround(Number(p.lat),Number(p.lng),RADIUS[p.radius]||RADIUS.medium),{id}));
   }
   if(ready){
    map.getSource('dcx-hybrid-points')?.setData(fc(pins));
    map.getSource('dcx-hybrid-risks')?.setData(fc(danger));
   }
  }
  function refreshPoints(){setPoints(lastPoints)}
  function pick(e){
   const layers=['dcx-hybrid-pin-hits','dcx-hybrid-pins','dcx-risk-fill'].filter(id=>map.getLayer(id));
   if(!layers.length)return false;
   const x=e.point.x,y=e.point.y;
   // A forgiving but bounded hit area makes Keymaster points usable on touchpads.
   const features=map.queryRenderedFeatures([[x-14,y-14],[x+14,y+14]],{layers});
   const pin=features.find(hit=>hit.layer?.id==='dcx-hybrid-pin-hits'||hit.layer?.id==='dcx-hybrid-pins');
   const danger=features.find(hit=>hit.layer?.id==='dcx-risk-fill');
   const hit=pin||danger;
   const id=hit?.properties?.id;
   if(!id||!pointsById.has(id))return false;
   const selected=pointsById.get(id);
   onSelect(selected);
   window.dispatchEvent(new CustomEvent('dcx-map-point-selected',{detail:{point:selected}}));
   return true;
  }
  function setCenter(p,z){map.jumpTo({center:[p.lng,p.lat],zoom:z??map.getZoom()})}
  function start(){
   ready=true;clearTimeout(timeout);
   addLabels(map);addPoints(map);
   map.on('click',e=>{
    // Left-click may inspect existing pins; empty ground never creates a pin.
    // The Keymaster's contextmenu (right click) is the only map-creation action.
    if(e.originalEvent?.button!=null&&e.originalEvent.button!==0)return;
    pick(e);
   });
   map.on('mousemove',e=>onMouseMove({lat:e.lngLat.lat,lng:e.lngLat.lng}));
   map.on('moveend',()=>{updateLabels();onCameraChange()});
   for(const id of ['dcx-hybrid-pins','dcx-hybrid-pin-hits','dcx-risk-fill']){
    map.on('mouseenter',id,()=>{map.getCanvas().style.cursor='pointer'});
    map.on('mouseleave',id,()=>{map.getCanvas().style.cursor=''});
   }
   if(host){
    // MapLibre handles its own contextmenu events. Capture the native event
    // before that handler AND listen to the MapLibre event as a fallback.
    // A single physical M2 press must open exactly one editor.
    const el=map.getContainer();
    let rightDown=null,lastOpen=0;
    const down=e=>{if(e.button===2)rightDown={x:e.clientX,y:e.clientY,dragged:false}};
    const move=e=>{
     if(!rightDown)return;
     if(Math.hypot(e.clientX-rightDown.x,e.clientY-rightDown.y)>7)rightDown.dragged=true;
    };
    const up=e=>{if(e.button===2&&rightDown?.dragged)rightDown=null};
    const openAt=(lat,lng)=>{
     if(destroyed||!ready||rightDown?.dragged)return;
     const now=Date.now();
     if(now-lastOpen<300)return;
     if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
     lastOpen=now;
     onClick({lat,lng});
    };
    const nativeContext=e=>{
     e.preventDefault();
     const box=map.getCanvas().getBoundingClientRect();
     const x=e.clientX-box.left,y=e.clientY-box.top;
     if(x<0||y<0||x>box.width||y>box.height)return;
     const point=map.unproject([x,y]);
     openAt(point.lat,point.lng);
    };
    const mapContext=e=>{
     e.preventDefault?.();
     e.originalEvent?.preventDefault?.();
     openAt(e.lngLat.lat,e.lngLat.lng);
    };
    el.addEventListener('pointerdown',down,true);
    el.addEventListener('pointermove',move,true);
    el.addEventListener('pointerup',up,true);
    el.addEventListener('contextmenu',nativeContext,true);
    map.on('contextmenu',mapContext);
    removeRightClick=()=>{
     el.removeEventListener('pointerdown',down,true);
     el.removeEventListener('pointermove',move,true);
     el.removeEventListener('pointerup',up,true);
     el.removeEventListener('contextmenu',nativeContext,true);
     map.off('contextmenu',mapContext);
    };
   }
   disposeTheme=window.DCX?.MapColors?.observe?.(applyTheme)||noop;
   applyTheme();
   updateLabels(true);applyVisibility();refreshPoints();
   resolve({
    setPoints,zoom:()=>map.getZoom(),center:camera,
    setZoom:z=>map.setZoom(clamp(z,1,19)),setCenter,
    flyTo:(p,z)=>map.flyTo({center:[p.lng,p.lat],zoom:z??map.getZoom(),duration:500}),
    resize:()=>map.resize(),goCity:id=>{
     const found=cities().find(c=>c.id===id);if(found)setCenter(found,12)
    },
    global:()=>setCenter({lat:15,lng:0},2),
    getCity:city,isGlobal:()=>map.getZoom()<=4,
    getLabelMode:()=>labelMode,
    setLabelMode:mode=>{labelMode=mode==='simple'?'simple':'complete';applyVisibility();return labelMode},
    getStatus:()=>({painted:ready,width:container.clientWidth,height:container.clientHeight,provider:'MapLibre+OpenFreeMap'}),
    destroy:()=>{
     destroyed=true;removeRightClick();disposeTheme();clearTimeout(timeout);map.remove()
    }
   });
  }
  map.once('load',start);
  map.on('error',e=>console.warn('[DCX HYBRID] erro na cartografia',e.error||e));
 }));
}
window.DCX=window.DCX||{};
window.DCX.HybridMapAdapter={TOKYO,USA,create,styleWithoutRealLabels,polygonAround};
})();