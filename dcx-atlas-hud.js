/* DCX MAP HUD // cyberneon navigation separate from offline map renderer. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const btn=(label,cb,cls='')=>{const b=node('button','dcxAtlasBtn '+cls,label);b.type='button';b.addEventListener('click',cb);return b};
const data=()=>window.DCX?.FictionalAtlas||{};
const engine=()=>window.DCX?.Cartography?.engine;
let current='districts',selectedCity='tokyo',shell=null;
function cities(){return data().CITIES||[]}
function pointList(){return window.DCX?.Cartography?.points||[]}
function chooseCity(id){
 const c=cities().find(c=>c.id===id);if(!c)return;
 selectedCity=c.id;
 engine()?.goCity(c.id);
 update();refresh();
}
function locationLabel(){
 const p=engine()?.getCity?.()||cities().find(c=>c.id===selectedCity);
 return p?.name||'TOKYO';
}
function head(){
 const root=$('dcxTacticalMap');if(!root||$('dcxAtlasHud'))return;
 shell=node('div','dcxAtlasHud');shell.id='dcxAtlasHud';
 const header=node('header','dcxAtlasTop');
 const brand=node('div','dcxAtlasBrand');
 brand.append(node('small','','DCX // CRÔNICAS DO TEMPO'),node('strong','','CENTRAL CARTOGRÁFICA'));
 const nav=node('div','dcxAtlasNav');
 nav.append(btn('◎ GLOBAL',()=>{engine()?.global();update();refresh()},'global'),btn('⌖ TOKYO',()=>chooseCity('tokyo'),'tokyo'));
 const other=btn('◇ OUTRAS CIDADES',()=>{current='cities';refresh()},'cities');
 nav.append(other);
 const state=node('span','dcxAtlasState','TOP-DOWN // MAPA 2D');
 header.append(brand,nav,state);shell.append(header);
 const sides=node('div','dcxAtlasSides');
 const left=node('aside','dcxAtlasLocation');
 left.append(node('small','','LOCALIZAÇÃO ATUAL'));
 const title=node('strong','dcxAtlasPlace','TOKYO');title.id='dcxAtlasPlace';
 const native=node('span','dcxAtlasLocalName','東京');native.id='dcxAtlasLocalName';
 const coords=node('span','dcxAtlasLocationCoords','35.6762° N / 139.6503° E');coords.id='dcxAtlasLocationCoords';
 left.append(title,native,coords);
 const scope=node('div','dcxAtlasScope');
 scope.append(btn('◉ VISÃO GLOBAL',()=>{engine()?.global();update();refresh()}),btn('⌖ CENTRALIZAR',()=>chooseCity(selectedCity)));
 left.append(scope);
 const right=node('aside','dcxAtlasDirectory');
 const tabs=node('div','dcxAtlasDirectoryTabs');
 const options=[['districts','DISTRITOS'],['roads','RUAS'],['points','PONTOS'],['cities','CIDADES']];
 for(const [id,label] of options){
  const b=btn(label,()=>{current=id;refresh()});b.dataset.atlasCategory=id;tabs.append(b);
 }
 const list=node('div','dcxAtlasDirectoryList');list.id='dcxAtlasDirectoryList';
 const detail=node('section','dcxAtlasPointDetail');detail.id='dcxAtlasPointDetail';detail.hidden=true;
 const legend=node('div','dcxAtlasLegend');
 legend.append(node('strong','','LEGENDA DCX'),node('p','','◇ IMPORTANTE   ◎ INTERESSE   ! PERIGO'));
 right.append(tabs,list,detail,legend);
 sides.append(left,right);shell.append(sides);
 const footer=node('div','dcxAtlasBottom');
 footer.append(node('span','','DCX // GEOINT · CARTOGRAFIA FICCIONAL'));
 const ctrl=node('div','dcxAtlasZoom');
 ctrl.append(btn('−',()=>window.DCX?.Cartography?.zoom(-1)),btn('+',()=>window.DCX?.Cartography?.zoom(1)));
 footer.append(ctrl);
 shell.append(footer);
 root.prepend(shell);
 root.classList.add('dcxAtlasActive');
 root.querySelector('.dcxMapHero')?.classList.add('dcxAtlasOldHero');
 root.querySelector('.dcxMapSourceNotice')?.classList.add('dcxAtlasOldNote');
 refresh();update();
}
function showPoint(p){
 const detail=$('dcxAtlasPointDetail');if(!detail)return;
 detail.replaceChildren();
 if(!p){detail.hidden=true;return}
 detail.hidden=false;
 const top=node('div','dcxAtlasPointTop');
 top.append(node('small','',p.type==='risk'?'ÁREA DE RISCO':p.type==='important'?'PONTO IMPORTANTE':'PONTO DE INTERESSE'));
 top.append(btn('×',()=>{detail.hidden=true},'dcxAtlasPointClose'));
 detail.append(top,node('strong','dcxAtlasPointTitle',p.title),node('p','dcxAtlasPointDescription',p.description||'Sem descrição.'));
 if(p.type==='risk')detail.append(node('span','dcxAtlasThreats',Array(p.stars+1).join('★')+' · '+p.threatCount+' AMEAÇAS · '+p.threatType));
 if(p.image&&/^https:\/\//i.test(p.image)){
  const img=document.createElement('img');img.src=p.image;img.alt='Imagem de '+p.title;img.loading='lazy';img.referrerPolicy='no-referrer';
  img.onerror=()=>img.remove();detail.append(img);
 }
 if(/keymaster\.html$/i.test(location.pathname)){
  detail.append(btn('✎ EDITAR LOCAL',()=>window.DCX?.Cartography?.openEditor(p),'dcxAtlasEdit'));
 }
 if(current!=='points'){current='points';refresh()}
}
function makeRow(label,detail,click,icon='⌖'){
 const b=btn('',click,'dcxAtlasDirectoryRow');
 b.append(node('span','dcxAtlasRowIcon',icon),node('span','dcxAtlasRowLabel'));
 b.lastChild.append(node('strong','',label),node('small','',detail||'DCX // LOCALIZAÇÃO'));
 b.append(node('span','dcxAtlasRowArrow','›'));
 return b;
}
function refresh(){
 const list=$('dcxAtlasDirectoryList');if(!list)return;
 document.querySelectorAll('[data-atlas-category]').forEach(b=>b.classList.toggle('active',b.dataset.atlasCategory===current));
 list.replaceChildren();
 const city=cities().find(c=>c.id===selectedCity)||cities()[0];
 const add=(name,desc,fn,ico)=>list.append(makeRow(name,desc,fn,ico));
 if(current==='cities'){
  cities().forEach(c=>add(c.name,c.local,()=>chooseCity(c.id),'◈'));
 }else if(current==='districts'){
  if(city?.id!=='tokyo'){add(city?.name||'CENTRO','DISTRITO CENTRAL',()=>chooseCity(city?.id),'⌖');return}
  for(const [name,japanese,lat,lng] of data().DISTRICTS||[]){
   add(name,japanese,()=>window.DCX?.Cartography?.centerMap({lat,lng},14),'▦');
  }
 }else if(current==='roads'){
  if(city?.id!=='tokyo'){add('ROTAS DCX','VIAS DA CIDADE FICCIONAL',()=>chooseCity(city?.id),'〰');return}
  for(const [name,lat,lng] of data().ROADS||[]){
   add(name,'RUA FICTÍCIA',()=>window.DCX?.Cartography?.centerMap({lat,lng},15),'〰');
  }
 }else{
  const pts=pointList();
  if(!pts.length)list.append(node('p','dcxAtlasNone','Nenhum ponto cadastrado.'));
  pts.forEach(p=>add(p.title,p.type==='risk'?'ZONA DE RISCO · '+p.stars+'★':p.type==='important'?'PONTO IMPORTANTE':'PONTO DE INTERESSE',
   ()=>{window.DCX?.Cartography?.selectPoint(p.id);showPoint(p)},p.type==='risk'?'!':'◈'));
 }
}
function update(){
 if(!$('dcxAtlasPlace'))return;
 const camera=window.DCX?.Cartography?.getCamera?.();
 const global=engine()?.isGlobal?.();
 const city=engine()?.getCity?.()||cities().find(c=>c.id===selectedCity);
 $('dcxAtlasPlace').textContent=global?'VISÃO GLOBAL':city?.name||'TOKYO';
 $('dcxAtlasLocalName').textContent=global?'TERRA // DCX':city?.local||'東京';
 if(camera){const p=camera.center;$('dcxAtlasLocationCoords').textContent=(p.lat||0).toFixed(3)+'° / '+(p.lng||0).toFixed(3)+'°'}
 document.querySelectorAll('.dcxAtlasNav .dcxAtlasBtn').forEach(b=>b.classList.toggle('active',global?b.classList.contains('global'):b.classList.contains(city?.id==='tokyo'?'tokyo':'cities')));
}
function start(){
 head();document.addEventListener('dcx-map-camera',update);
 window.addEventListener('dcx-map-ready',()=>{update();refresh()});
 document.querySelectorAll('[data-tab="tactical-map"],[data-workspace-target="map"]').forEach(b=>
  b.addEventListener('click',()=>setTimeout(()=>{engine()?.resize();update()},130))
 );
 const original=window.DCX?.Cartography;
 if(original){
  const sel=original.selectPoint;
  original.selectPoint=(...args)=>{
   sel?.(...args);const point=pointList().find(p=>p.id===args[0]);
   if(point)showPoint(point);update()
  };
 }
 // Preset markers use the legacy detail pane; bridge clicks into the HUD.
 const legacy=$('dcxMapDetail');
 if(legacy&&typeof MutationObserver==='function'){
  const observer=new MutationObserver(()=>{
   const title=legacy.querySelector('.dcxMapDetailHeading h3')?.textContent;
   if(!title)return;
   const point=pointList().find(p=>p.title===title);
   if(point&&!($('dcxAtlasPointDetail')?.textContent||'').includes(point.title))showPoint(point);
  });
  observer.observe(legacy,{childList:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();