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
let panel=null,canvas=null,cx=null,active=false,longitude=-48,latitude=-17,zoom=3,drag=null,features=[],coastsLoaded=false,raf=0;
const rad=Math.PI/180;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const getMap=()=>window.DCX?.Cartography;
function project(lat,lng,width,height,radius){
 const phi=lat*rad,theta=(lng-longitude)*rad,center=latitude*rad;
 const visible=Math.sin(center)*Math.sin(phi)+Math.cos(center)*Math.cos(phi)*Math.cos(theta);
 return {x:width/2+radius*Math.cos(phi)*Math.sin(theta),y:height/2-radius*(Math.cos(center)*Math.sin(phi)-Math.sin(center)*Math.cos(phi)*Math.cos(theta)),visible:visible>=0}
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
 const r=Math.min(w*.4,h*.43),glow=c.createRadialGradient(w/2-r*.35,h/2-r*.55,r*.15,w/2,h/2,r*1.3);
 glow.addColorStop(0,'#143c58');glow.addColorStop(.57,'#071a2a');glow.addColorStop(1,'#030711');
 c.save();c.shadowColor='#46d7f5';c.shadowBlur=24;c.fillStyle=glow;c.strokeStyle='#54dff7';c.lineWidth=2;
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
 for(const p of points){
  const pt=project(p.lat,p.lng,w,h,r);if(!pt.visible)continue;
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
 active=!!on;panel.hidden=!active;
 zoom=currentZoom??zoom;
 if(active){
  if(center){longitude=center.lng;latitude=clamp(center.lat,-80,80)}
  request();loadCoasts();
 }
}
function setCamera(detail){
 const currentZoom=Number(detail?.zoom??13);
 const center=detail?.center;
 show(currentZoom<=4,currentZoom,center);
}
function openMapAt(lat,lng){
 show(false,6);
 getMap()?.centerMap?.({lat,lng},6);
}
function mount(){
 const board=$('dcxMapCanvas');if(!board||$('dcxWorldGlobe'))return;
 panel=document.createElement('section');panel.id='dcxWorldGlobe';panel.className='dcxWorldGlobe';panel.hidden=true;
 panel.setAttribute('aria-label','Globo terrestre holográfico do universo Crônicas do Tempo');
 const legend=document.createElement('div');legend.className='dcxGlobeLegend';
 legend.innerHTML='<small>DCX // ÓRBITA CARTOGRÁFICA</small><b>TERRA // MUNDO ALTERNATIVO</b><span>UNIÃO SOVIÉTICA // 15 REPÚBLICAS UNIDAS</span>';
 canvas=document.createElement('canvas');canvas.id='dcxGlobeCanvas';canvas.setAttribute('aria-label','Globo arrastável. Use a roda para aproximação.');
 const bottom=document.createElement('footer');bottom.className='dcxGlobeFooter';
 const note=document.createElement('span');note.id='dcxGlobeNote';note.textContent='ARRASTE PARA GIRAR • ROLE PARA APROXIMAR • DUPLO CLIQUE PARA FOCAR';
 const coords=document.createElement('span');coords.id='dcxGlobeCoords';bottom.append(note,coords);
 const button=document.createElement('button');button.className='dcxGlobeEnter';button.textContent='⌖ VOLTAR AO MAPA';button.type='button';
 button.addEventListener('click',()=>openMapAt(latitude,longitude));
 panel.append(legend,canvas,bottom,button);board.append(panel);
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;drag={x:e.clientX,y:e.clientY,lng:longitude,lat:latitude};canvas.setPointerCapture?.(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;longitude=((drag.lng-(e.clientX-drag.x)*.35+540)%360)-180;latitude=clamp(drag.lat+(e.clientY-drag.y)*.27,-80,80);request()});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const next=clamp(zoom+(e.deltaY<0?1:-1),1,19);zoom=next;if(next>4)openMapAt(latitude,longitude);else request()},{passive:false});
 canvas.addEventListener('dblclick',()=>openMapAt(latitude,longitude));
 window.addEventListener('resize',request,{passive:true});
 document.addEventListener('dcx-map-camera',e=>setCamera(e.detail));
 show(false,13,{lat:-17,lng:-48});
 setTimeout(()=>{if(window.DCX?.Cartography?.getCamera)setCamera(window.DCX.Cartography.getCamera())},160);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.DCX=window.DCX||{};window.DCX.WorldGlobe={show,setCamera};
})();