/* DCX MAP HUD // cyberneon navigation separate from offline map renderer. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const btn=(label,cb,cls='')=>{const b=node('button','dcxAtlasBtn '+cls,label);b.type='button';b.addEventListener('click',cb);return b};
const data=()=>window.DCX?.FictionalAtlas||{};
const engine=()=>window.DCX?.Cartography?.engine;
let current='districts',selectedCity='tokyo',shell=null;
const lex=()=>window.DCX?.AtlasLexicon;
let labelMode=(()=>{try{return localStorage.getItem('dcx-atlas-label-mode')==='simple'?'simple':'complete'}catch{return 'complete'}})();
function setLabelMode(value){labelMode=value==='simple'?'simple':'complete';try{localStorage.setItem('dcx-atlas-label-mode',labelMode)}catch{}window.DCX?.Cartography?.setLabelMode?.(labelMode);refresh();update()}
function cities(){return data().CITIES||[]}
function pointList(){return window.DCX?.Cartography?.points||[]}
function chooseCity(id){
 const c=cities().find(c=>c.id===id);if(!c)return;
 selectedCity=c.id;
 engine()?.goCity(c.id);
 update();refresh();
}
function goGlobal(){
 const cartography=window.DCX?.Cartography,current=cartography?.getCamera?.();
 if(engine()?.global)engine().global();
 else if(cartography?.centerMap)cartography.centerMap(current?.center||{lat:15,lng:0},2);
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
 nav.append(btn('◎ GLOBAL',goGlobal,'global'),btn('⌖ TOKYO',()=>chooseCity('tokyo'),'tokyo'));
 const other=btn('◇ OUTRAS CIDADES',()=>{current='cities';refresh()},'cities');
 nav.append(other);
 const modes=node('div','dcxAtlasViewModes');
 modes.setAttribute('role','group');modes.setAttribute('aria-label','Detalhamento cartográfico');
 modes.append(btn('SIMPLIFICADO',()=>setLabelMode('simple'),'dcxAtlasModeSimple'),btn('COMPLETO',()=>setLabelMode('complete'),'dcxAtlasModeComplete'));
 nav.append(modes);
 const colors=node('div','dcxAtlasColorControl');
 const colorText=node('label','dcxAtlasColorLabel','CORES DO MAPA');colorText.htmlFor='dcxAtlasColorSelect';
 const select=document.createElement('select');select.id='dcxAtlasColorSelect';
 const opt=document.createElement('option');opt.value='site';opt.textContent='SEGUIR TEMA DO SITE';select.append(opt);
 for(const [id,name] of window.DCX?.MapColors?.definitions||[]){
  const entry=document.createElement('option');entry.value=id;entry.textContent=name;select.append(entry);
 }
 select.value=window.DCX?.MapColors?.selection?.()||'site';
 select.addEventListener('change',()=>window.DCX?.MapColors?.choose?.(select.value));
 colors.append(colorText,select);nav.append(colors);
 if(/keymaster\.html$/i.test(location.pathname)){
  const make=btn('+ CRIAR PONTO',()=>window.DCX?.Cartography?.createAtCenter?.(),'dcxAtlasCreatePin');
  make.title='M1: segurar e arrastar para mover. M2: criar ping na posição do cursor. Este botão cria no centro da câmera.';
  nav.append(make);
 }
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
 scope.append(btn('◉ VISÃO GLOBAL',goGlobal),btn('⌖ CENTRALIZAR',()=>chooseCity(selectedCity)));
 left.append(scope);
 const right=node('aside','dcxAtlasDirectory');
 const tabs=node('div','dcxAtlasDirectoryTabs');
 const options=[['countries','PAÍSES'],['cities','CIDADES'],['districts','DISTRITOS'],['neighborhoods','BAIRROS'],['roads','RUAS'],['points','PONTOS']];
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
 ctrl.append(btn('⌖',()=>chooseCity(selectedCity)),btn('−',()=>window.DCX?.Cartography?.zoom(-1)),btn('+',()=>window.DCX?.Cartography?.zoom(1)));
 ctrl.append(btn('▣',async()=>{
  const root=$('dcxTacticalMap');if(!root)return;
  try{if(document.fullscreenElement===root)await document.exitFullscreen();
    else await root.requestFullscreen();
    setTimeout(()=>engine()?.resize(),110);
  }catch(e){console.warn('[DCX MAP] Tela inteira não disponível',e)}
 },'dcxAtlasFullScreen'));
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
 if(current==='countries'){
  for(const item of (data().COUNTRIES||[]).map(([name,lat,lng])=>({name,real:name,lat,lng}))){
   add(item.name,'PAÍS',()=>{
    const nearest=cities().filter(c=>lex()?.countryOf(c)===item.real).sort((a,b)=>Math.hypot(a.lat-item.lat,a.lng-item.lng)-Math.hypot(b.lat-item.lat,b.lng-item.lng))[0];
    if(nearest)chooseCity(nearest.id);
    else window.DCX?.Cartography?.centerMap({lat:item.lat,lng:item.lng},2)
   },'◇');
  }
 }else if(current==='cities'){
  cities().forEach(c=>add(c.name,(lex()?.countryOf(c)||c.local),()=>chooseCity(c.id),'◈'));
 }else if(current==='districts'||current==='neighborhoods'||current==='roads'){
  const rows=lex()?.locality(city,current)||[];
  const className={districts:'DISTRITO',neighborhoods:'BAIRRO',roads:'VIA'}[current];
  for(const p of rows)add(p.name,className+' · REFERÊNCIA: '+p.real,
   ()=>window.DCX?.Cartography?.centerMap({lat:p.lat,lng:p.lng},current==='roads'?15:current==='neighborhoods'?13:12),
   current==='roads'?'〰':'▦');
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
 $('dcxAtlasLocalName').textContent=global?'TERRA // DCX':(lex()?.countryOf(city)||'JAPÃO')+' · '+(city?.local||'TOKYO');
 if(camera){const p=camera.center;$('dcxAtlasLocationCoords').textContent=(p.lat||0).toFixed(3)+'° / '+(p.lng||0).toFixed(3)+'°'}
 document.querySelectorAll('.dcxAtlasNav>.dcxAtlasBtn').forEach(b=>b.classList.toggle('active',global?b.classList.contains('global'):b.classList.contains(city?.id==='tokyo'?'tokyo':'cities')));
 document.querySelector('.dcxAtlasModeSimple')?.classList.toggle('active',labelMode==='simple');
 document.querySelector('.dcxAtlasModeComplete')?.classList.toggle('active',labelMode==='complete');
 const status=document.querySelector('.dcxAtlasState');if(status)status.textContent='GEO REAL // '+(labelMode==='simple'?'SIMPLIFICADO':'COMPLETO');
}
function start(){
 head();document.addEventListener('dcx-map-camera',update);
 window.addEventListener('dcx-map-point-selected',event=>{const p=event.detail?.point;if(p)showPoint(p)});
 window.addEventListener('dcx-map-ready',()=>{window.DCX?.Cartography?.setLabelMode?.(labelMode);update();refresh()});
 document.addEventListener('dcx-map-provider',()=>{update();refresh()});
 if(engine())engine().setLabelMode(labelMode);
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