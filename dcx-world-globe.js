/* DCX WORLD HOLOGLOBE // fictional geopolitical overlay for Crônicas do Tempo. */
(()=>{
'use strict';
const HOST=/keymaster\.html$/i.test(location.pathname),$=id=>document.getElementById(id);
const USSR=new Set(['RUS','UKR','BLR','MDA','EST','LVA','LTU','GEO','ARM','AZE','KAZ','KGZ','TJK','TKM','UZB']);
const USSRNAMES=new Set(['Russia','Ukraine','Belarus','Moldova','Estonia','Latvia','Lithuania','Georgia','Armenia','Azerbaijan','Kazakhstan','Kyrgyzstan','Tajikistan','Turkmenistan','Uzbekistan']);
const labels=[
 ['BRASIL',-14.2,-51.9],['ESTADOS UNIDOS',39,-98],['CANADÁ',57,-106],['MÉXICO',24,-102],['ARGENTINA',-38,-64],['CHILE',-31,-71],
 ['REINO UNIDO',54,-2],['FRANÇA',46,2],['ALEMANHA',51,10],['ESPANHA',40,-4],['ITÁLIA',43,12],
 ['UNIÃO SOVIÉTICA',56,80],['CHINA',35,104],['ÍNDIA',21,78],['JAPÃO',36,138],['COREIA',38,127],
 ['AUSTRÁLIA',-25,133],['INDONÉSIA',-3,118],['ÁFRICA DO SUL',-29,25],['EGITO',27,30],['NIGÉRIA',9,8],
 ['ARÁBIA SAUDITA',24,45],['TURQUIA',39,35],['IRÃ',32,54],['PAQUISTÃO',30,69]
];
let panel=null,canvas=null,cx=null,active=false,longitude=-48,latitude=-17,zoom=3,drag=null,dragMoved=false,pointers=new Map(),pinchDistance=0,hitTargets=[],features=[],coastsLoaded=false,raf=0;
const rad=Math.PI/180;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const getMap=()=>window.DCX?.Cartography;
function project(lat,lng,width,height,radius){
 const phi=lat*rad,theta=(lng-longitude)*rad,center=latitude*rad;
 const visible=Math.sin(center)*Math.sin(phi)+Math.cos(center)*Math.cos(phi)*Math.cos(theta);
 return {x:width/2+radius*Math.cos(phi)*Math.sin(theta),y:height/2-radius*(Math.cos(center)*Math.sin(phi)-Math.sin(center)*Math.cos(phi)*Math.cos(theta)),visible:visible>=0}
}
function unproject(x,y,width,height,radius){
 const east=(x-width/2)/radius,north=(height/2-y)/radius;
 const distance=Math.hypot(east,north);
 if(distance>1)return null;
 if(distance<1e-6)return {lat:latitude,lng:longitude};
 const arc=Math.asin(Math.min(1,distance)),sin=Math.sin(arc),cos=Math.cos(arc),phi=latitude*rad;
 const lat=Math.asin(clamp(cos*Math.sin(phi)+north*sin*Math.cos(phi)/distance,-1,1))/rad;
 const lng=longitude+Math.atan2(east*sin,distance*Math.cos(phi)*cos-north*Math.sin(phi)*sin)/rad;
 return {lat:clamp(lat,-85,85),lng:((lng+540)%360)-180};
}
function canvasPosition(event){
 const box=canvas.getBoundingClientRect();
 return {x:event.clientX-box.left,y:event.clientY-box.top,w:box.width,h:box.height};
}
function selectMarker(event){
 const pos=canvasPosition(event);
 const found=hitTargets.findLast?hitTargets.findLast(t=>Math.hypot(t.x-pos.x,t.y-pos.y)<14):[...hitTargets].reverse().find(t=>Math.hypot(t.x-pos.x,t.y-pos.y)<14);
 if(!found)return false;
 const point=found.p,cartography=getMap();
 if(HOST&&!point.preset)cartography?.openEditor?.(point);
 else cartography?.selectPoint?.(point.id,false);
 return true;
}
function hemisphereLine(ctx,coords,width,height,r){
 if(!Array.isArray(coords)||coords.length<2)return;
 let prev=null;ctx.beginPath();
 for(let i=0;i<coords.length;i++){
  const pair=coords[i];if(!Array.isArray(pair)||pair.length<2)continue;
  const p=project(pair[1],pair[0],width,height,r);
  if(p.visible){if(!prev?.visible||Math.abs(p.x-prev.x)+Math.abs(p.y-prev.y)>r*.72)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}
  prev=p;
 }
 ctx.stroke();
}
function countryGeometry(shape,ctx,w,h,r,color){
 if(!shape)return;
 const contours=shape.type==='Polygon'?shape.coordinates.flatMap(poly=>[poly]):shape.type==='MultiPolygon'?shape.coordinates.flatMap(poly=>poly):[];
 ctx.strokeStyle=color;ctx.lineWidth=.75;
 for(const line of contours)hemisphereLine(ctx,line,w,h,r);
}
function worldId(f){
 return String(f?.properties?.ISO_A3||f?.properties?.ADM0_A3||f?.properties?.iso_a3||f?.id||'').toUpperCase();
}
function worldName(f){return String(f?.properties?.ADMIN||f?.properties?.NAME||f?.properties?.name||'')}
async function loadCoasts(){
 if(coastsLoaded)return;coastsLoaded=true;
 try{
  const response=await fetch('https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson',{mode:'cors',cache:'force-cache'});
  if(!response.ok)throw new Error('GeoJSON '+response.status);
  const doc=await response.json();
  if(Array.isArray(doc?.features)){features=doc.features;request()}
 }catch(e){const note=$('dcxGlobeNote');if(note)note.textContent='CONTORNOS GEOGRÁFICOS INDISPONÍVEIS · GRADE HOLOGRÁFICA ATIVA'}
}
function resize(){
 if(!canvas||!panel)return null;
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
 const ratio=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
 cx=canvas.getContext('2d',{alpha:true});cx.setTransform(ratio,0,0,ratio,0,0);
 return {w:rect.width,h:rect.height};
}
function render(){
 raf=0;if(!active||!panel||!canvas)return;
 const dim=resize();if(!dim)return;
 const {w,h}=dim,c=cx;
 c.clearRect(0,0,w,h);
 // A deterministic starfield keeps the atmosphere stable while navigating.
 c.save();c.fillStyle='#6adfff';
 for(let i=0;i<110;i++){
  const sx=((i*147.21+Math.sin(i*3.89)*973.17)%1000+1000)%1000/1000*w;
  const sy=((i*531.83+Math.sin(i*1.37)*1147.11)%1000+1000)%1000/1000*h;
  c.globalAlpha=.12+(i%9)/24;c.beginPath();c.arc(sx,sy,i%13===0?1.3:.65,0,Math.PI*2);c.fill();
 }
 c.restore();
 const r=Math.min(w*.4,h*.43),glow=c.createRadialGradient(w/2-r*.35,h/2-r*.55,r*.15,w/2,h/2,r*1.3);
 glow.addColorStop(0,'#143c58');glow.addColorStop(.57,'#071a2a');glow.addColorStop(1,'#030711');
 // Subtle orbit traces and outer atmospheric bloom establish orbital depth.
 c.save();c.translate(w/2,h/2);c.rotate(-.31);c.strokeStyle='#4de3fa37';c.lineWidth=1.25;
 c.beginPath();c.ellipse(0,0,r*1.28,r*.41,0,0,Math.PI*2);c.stroke();c.restore();
 c.save();c.shadowColor='#46d7f5';c.shadowBlur=28;c.fillStyle=glow;c.strokeStyle='#54dff7';c.lineWidth=2;
 c.beginPath();c.arc(w/2,h/2,r,0,Math.PI*2);c.fill();c.stroke();c.restore();
 c.save();c.beginPath();c.arc(w/2,h/2,r-1,0,Math.PI*2);c.clip();
 c.strokeStyle='#329db47d';c.lineWidth=.8;
 for(let lat=-75;lat<=75;lat+=15){let first=true;c.beginPath();for(let lng=-180;lng<=180;lng+=2){const p=project(lat,lng,w,h,r);if(!p.visible){first=true;continue}if(first)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);first=false}c.stroke()}
 for(let lng=-180;lng<180;lng+=15){let first=true;c.beginPath();for(let lat=-90;lat<=90;lat+=2){const p=project(lat,lng,w,h,r);if(!p.visible){first=true;continue}if(first)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);first=false}c.stroke()}
 for(const feature of features){
  const id=worldId(feature),soviet=USSR.has(id)||USSRNAMES.has(worldName(feature));
  countryGeometry(feature.geometry,c,w,h,r,soviet?'#ff728faa':'#77e9ffc7');
 }
 c.font='bold 9px ui-monospace, monospace';c.textAlign='center';c.textBaseline='middle';
 for(const [name,lat,lng] of labels){
  const p=project(lat,lng,w,h,r);if(!p.visible)continue;
  c.fillStyle=name==='UNIÃO SOVIÉTICA'?'#ff9bac':'#d3f6ff';
  c.shadowColor=name==='UNIÃO SOVIÉTICA'?'#ff708e':'#62ddff';c.shadowBlur=8;
  c.fillText(name,p.x,p.y);
 }
 const points=getMap()?.points||[];
 hitTargets=[];
 for(const p of points){
  const pt=project(p.lat,p.lng,w,h,r);if(!pt.visible)continue;
  hitTargets.push({x:pt.x,y:pt.y,p});
  c.beginPath();c.arc(pt.x,pt.y,p.type==='risk'?5:3,0,2*Math.PI);
  c.fillStyle=p.type==='risk'?'#fa6b80':p.type==='important'?'#eff882':'#77ecff';c.shadowColor=c.fillStyle;c.shadowBlur=14;c.fill();
 }
 c.restore();
 const summary=$('dcxGlobeCoords');
 if(summary)summary.textContent='ÂNGULO '+latitude.toFixed(0)+'° · '+longitude.toFixed(0)+'°  //  ZOOM '+zoom;
}
function request(){if(!raf)raf=requestAnimationFrame(render)}
function show(on,currentZoom,center){
 if(!panel)return;
 active=!!on;
 zoom=currentZoom??zoom;
 panel.classList.toggle('is-active',active);
 panel.setAttribute('aria-hidden',String(!active));
 panel.inert=!active;
 if(active){
  if(center){longitude=((center.lng+540)%360)-180;latitude=clamp(center.lat,-80,80)}
  request();loadCoasts();
 }
}
function setCamera(detail){
 const currentZoom=Number(detail?.zoom??13);
 const center=detail?.center;
 if(getMap()?.engine?.supportsGlobe?.()){show(false,currentZoom,center);return}
 show(currentZoom<=5,currentZoom,center);
}
function zoomGlobe(delta){
 if(!active)return false;
 const next=clamp(zoom+delta,1,19);
 zoom=next;
 if(next>5)openMapAt(latitude,longitude);
 else request();
 return true;
}
function openMapAt(lat,lng){
 show(false,6);
 getMap()?.centerMap?.({lat,lng},6);
}
function mount(){
 const board=$('dcxMapCanvas');if(!board||$('dcxWorldGlobe'))return;
 panel=document.createElement('section');panel.id='dcxWorldGlobe';panel.className='dcxWorldGlobe';panel.hidden=false;panel.setAttribute('aria-hidden','true');panel.inert=true;
 panel.setAttribute('aria-label','Globo terrestre holográfico do universo Crônicas do Tempo');
 const legend=document.createElement('div');legend.className='dcxGlobeLegend';
 legend.innerHTML='<small>DCX // ÓRBITA CARTOGRÁFICA</small><b>TERRA // MUNDO ALTERNATIVO</b><span>UNIÃO SOVIÉTICA // 15 REPÚBLICAS UNIDAS</span>';
 canvas=document.createElement('canvas');canvas.id='dcxGlobeCanvas';canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Terra holográfica. Arraste para girar, use a roda ou os sinais de mais e menos para ampliar, pressione Enter para aproximar.');
 const bottom=document.createElement('footer');bottom.className='dcxGlobeFooter';
 const note=document.createElement('span');note.id='dcxGlobeNote';note.textContent='ARRASTE PARA GIRAR • ROLE PARA APROXIMAR • DUPLO CLIQUE PARA FOCAR';
 const coords=document.createElement('span');coords.id='dcxGlobeCoords';bottom.append(note,coords);
 const button=document.createElement('button');button.className='dcxGlobeEnter';button.textContent='⌖ VOLTAR AO MAPA';button.type='button';
 button.addEventListener('click',()=>openMapAt(latitude,longitude));
 panel.append(legend,canvas,bottom,button);board.append(panel);
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType!=='touch')return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  dragMoved=false;
  if(pointers.size===1)drag={x:e.clientX,y:e.clientY,lng:longitude,lat:latitude,moved:false};
  else if(pointers.size===2){
   drag=null;const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);
  }
  canvas.setPointerCapture?.(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){
   const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
   if(Math.abs(distance-pinchDistance)>45){dragMoved=true;zoomGlobe(distance>pinchDistance?1:-1);pinchDistance=distance}
   return;
  }
  if(!drag)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>4)drag.moved=true;
  if(!drag.moved)return;
  longitude=((drag.lng-dx*.35+540)%360)-180;
  latitude=clamp(drag.lat+dy*.27,-80,80);
  request();
 });
 function releasePointer(e){
  pointers.delete(e.pointerId);dragMoved=dragMoved||!!drag?.moved;drag=null;
  if(pointers.size<2)pinchDistance=0;
 }
 canvas.addEventListener('pointerup',releasePointer);
 canvas.addEventListener('pointercancel',releasePointer);
 canvas.addEventListener('click',e=>{if(dragMoved){dragMoved=false;return}selectMarker(e)});
 canvas.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();zoomGlobe(e.deltaY<0?1:-1)},{passive:false});
 canvas.addEventListener('dblclick',e=>{
  e.preventDefault();
  const pos=canvasPosition(e),loc=unproject(pos.x,pos.y,pos.w,pos.h,Math.min(pos.w*.4,pos.h*.43));
  if(loc)openMapAt(loc.lat,loc.lng);
 });
 canvas.addEventListener('keydown',e=>{
  const key=e.key;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter'].includes(key))e.preventDefault();
  if(key==='ArrowLeft')longitude=((longitude-10+540)%360)-180;
  else if(key==='ArrowRight')longitude=((longitude+10+540)%360)-180;
  else if(key==='ArrowUp')latitude=clamp(latitude+10,-80,80);
  else if(key==='ArrowDown')latitude=clamp(latitude-10,-80,80);
  else if(key==='+'||key==='=')zoomGlobe(1);
  else if(key==='-')zoomGlobe(-1);
  else if(key==='Enter')openMapAt(latitude,longitude);
  request();
 });
 window.addEventListener('resize',request,{passive:true});
 document.addEventListener('dcx-map-camera',e=>setCamera(e.detail));
 document.addEventListener('dcx-map-provider',()=>setCamera(getMap()?.getCamera?.()));
 document.addEventListener('dcx-map-point-selected',request);
 show(false,13,{lat:-17,lng:-48});
 setTimeout(()=>{if(window.DCX?.Cartography?.getCamera)setCamera(window.DCX.Cartography.getCamera())},160);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.DCX=window.DCX||{};window.DCX.WorldGlobe={show,setCamera,zoom:zoomGlobe,refresh:request,isActive:()=>active,getCamera:()=>({zoom,center:{lat:latitude,lng:longitude}})};
})();