/* DCX MAP HUD // cyberneon navigation separate from offline map renderer. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const node=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
const btn=(label,cb,cls='')=>{const b=node('button','dcxAtlasBtn '+cls,label);b.type='button';b.addEventListener('click',cb);return b};
const data=()=>window.DCX?.FictionalAtlas||{};
const engine=()=>window.DCX?.Cartography?.engine;
let current='districts',selectedCity='tokyo',shell=null;
const searchTerms=Object.create(null);
const ptCollator=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
const sortByName=items=>[...items].sort((a,b)=>ptCollator.compare(String(a.name||''),String(b.name||'')));
const cleanQuery=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
const matches=(query,...values)=>!query||values.some(v=>cleanQuery(v).includes(query));
const placeholders={countries:'Buscar país...',cities:'Buscar cidade...',districts:'Buscar distrito...',neighborhoods:'Buscar bairro...',roads:'Buscar rua...',points:'Buscar ponto...'};
// ISO country flags for the existing atlas. USSR is historical and has no Unicode flag emoji.
const countryFlags={
 'CANADÁ':'🇨🇦','ESTADOS UNIDOS':'🇺🇸','MÉXICO':'🇲🇽','BRASIL':'🇧🇷','ARGENTINA':'🇦🇷',
 'CHILE':'🇨🇱','PERU':'🇵🇪','COLÔMBIA':'🇨🇴','VENEZUELA':'🇻🇪','BOLÍVIA':'🇧🇴',
 'EQUADOR':'🇪🇨','REINO UNIDO':'🇬🇧','IRLANDA':'🇮🇪','PORTUGAL':'🇵🇹','ESPANHA':'🇪🇸',
 'FRANÇA':'🇫🇷','ALEMANHA':'🇩🇪','ITÁLIA':'🇮🇹','PAÍSES BAIXOS':'🇳🇱','SUÉCIA':'🇸🇪',
 'NORUEGA':'🇳🇴','POLÔNIA':'🇵🇱','TURQUIA':'🇹🇷','GRÉCIA':'🇬🇷','UNIÃO SOVIÉTICA':'☭',
 'MARROCOS':'🇲🇦','EGITO':'🇪🇬','NIGÉRIA':'🇳🇬','ETIÓPIA':'🇪🇹','QUÊNIA':'🇰🇪',
 'ÁFRICA DO SUL':'🇿🇦','ANGOLA':'🇦🇴','CONGO':'🇨🇩','SUDÃO':'🇸🇩','ARGÉLIA':'🇩🇿',
 'ARÁBIA SAUDITA':'🇸🇦','EMIRADOS ÁRABES':'🇦🇪','IRÃ':'🇮🇷','PAQUISTÃO':'🇵🇰',
 'ÍNDIA':'🇮🇳','CHINA':'🇨🇳','JAPÃO':'🇯🇵','COREIA DO SUL':'🇰🇷',
 'NEPAL':'🇳🇵','BANGLADESH':'🇧🇩','TAILÂNDIA':'🇹🇭','VIETNÃ':'🇻🇳',
 'MALÁSIA':'🇲🇾','INDONÉSIA':'🇮🇩','FILIPINAS':'🇵🇭','MONGÓLIA':'🇲🇳',
 'SINGAPURA':'🇸🇬','AUSTRÁLIA':'🇦🇺','NOVA ZELÂNDIA':'🇳🇿'
};
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
 if(!engine()?.supportsGlobe?.())window.DCX?.WorldGlobe?.show?.(true,2,current?.center||{lat:15,lng:0});
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
 nav.append(btn('◉ GLOBO 3D',goGlobal,'global'),btn('⌖ TOKYO',()=>chooseCity('tokyo'),'tokyo'));
 const other=btn('◇ OUTRAS CIDADES',()=>{current='cities';syncSearch();refresh()},'cities');
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
 scope.append(btn('◉ VISÃO PLANETÁRIA',goGlobal),btn('⌖ CENTRALIZAR',()=>chooseCity(selectedCity)));
 left.append(scope);
 const right=node('aside','dcxAtlasDirectory');
 const tabs=node('div','dcxAtlasDirectoryTabs');
 const options=[['countries','PAÍSES'],['cities','CIDADES'],['districts','DISTRITOS'],['neighborhoods','BAIRROS'],['roads','RUAS'],['points','PONTOS']];
 for(const [id,label] of options){
  const b=btn(label,()=>{current=id;syncSearch();refresh()});b.dataset.atlasCategory=id;tabs.append(b);
 }
 const searchBox=node('div','dcxAtlasSearch');
 const searchLabel=node('label','dcxAtlasSearchLabel','LOCALIZAR POR NOME');searchLabel.htmlFor='dcxAtlasSearchInput';
 const searchLine=node('div','dcxAtlasSearchLine');
 const searchInput=document.createElement('input');
 searchInput.type='search';searchInput.id='dcxAtlasSearchInput';
 searchInput.autocomplete='off';searchInput.spellcheck=false;searchInput.maxLength=80;
 searchInput.setAttribute('aria-controls','dcxAtlasDirectoryList');
 const clear=btn('×',()=>{
  searchTerms[current]='';searchInput.value='';refresh();searchInput.focus();
 },'dcxAtlasSearchClear');clear.id='dcxAtlasSearchClear';clear.title='Limpar pesquisa';
 clear.setAttribute('aria-label','Limpar pesquisa');
 searchInput.addEventListener('input',()=>{
  searchTerms[current]=searchInput.value;refresh();
 });
 searchInput.addEventListener('keydown',event=>{
  if(event.key==='Enter'){
   const first=$('dcxAtlasDirectoryList')?.querySelector('.dcxAtlasDirectoryRow');
   if(first){event.preventDefault();first.click()}
  }else if(event.key==='Escape'&&searchInput.value){
   event.preventDefault();searchTerms[current]='';searchInput.value='';refresh();
  }
 });
 searchLine.append(searchInput,clear);
 const searchCount=node('small','dcxAtlasSearchCount');searchCount.id='dcxAtlasSearchCount';
 searchCount.setAttribute('aria-live','polite');
 searchBox.append(searchLabel,searchLine,searchCount);
 const list=node('div','dcxAtlasDirectoryList');list.id='dcxAtlasDirectoryList';
 const detail=node('section','dcxAtlasPointDetail');detail.id='dcxAtlasPointDetail';detail.hidden=true;
 const legend=node('div','dcxAtlasLegend');
 legend.append(node('strong','','LEGENDA DCX'),node('p','','◇ IMPORTANTE   ◎ INTERESSE   ! PERIGO'));
 right.append(tabs,searchBox,list,detail,legend);
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
 syncSearch();refresh();update();
}
function showPoint(p){
 const detail=$('dcxAtlasPointDetail');if(!detail)return;
 detail.replaceChildren();
 if(!p){detail.hidden=true;detail.removeAttribute('data-point-id');return}
 const live=pointList().find(entry=>entry.id===p.id);
 if(!live){detail.hidden=true;detail.removeAttribute('data-point-id');return}
 p=live;
 detail.hidden=false;
 detail.dataset.pointId=p.id||'';
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
  const actions=node('div','dcxAtlasPointActions');
  actions.append(btn('✎ EDITAR LOCAL',()=>window.DCX?.Cartography?.openEditor(p),'dcxAtlasEdit'));
  actions.append(btn(p.preset?'× REMOVER EXEMPLO':'× EXCLUIR PING',
   ()=>window.DCX?.Cartography?.deletePoint?.(p),'dcxAtlasDelete'));
  detail.append(actions);
 }
 if(current!=='points'){current='points';syncSearch();refresh()}
}
function makeRow(label,detail,click,icon='⌖'){
 const b=btn('',click,'dcxAtlasDirectoryRow');
 b.append(node('span','dcxAtlasRowIcon',icon),node('span','dcxAtlasRowLabel'));
 b.lastChild.append(node('strong','',label),node('small','',detail||'DCX // LOCALIZAÇÃO'));
 b.append(node('span','dcxAtlasRowArrow','›'));
 return b;
}
function syncSearch(){
 const input=$('dcxAtlasSearchInput'),clear=$('dcxAtlasSearchClear');
 if(!input)return;
 input.placeholder=placeholders[current]||'Buscar por nome...';
 input.setAttribute('aria-label',input.placeholder);
 input.value=searchTerms[current]||'';
 if(clear)clear.disabled=!input.value;
}
function refresh(){
 const list=$('dcxAtlasDirectoryList');if(!list)return;
 document.querySelectorAll('[data-atlas-category]').forEach(b=>b.classList.toggle('active',b.dataset.atlasCategory===current));
 list.replaceChildren();
 const q=cleanQuery(searchTerms[current]);
 const city=cities().find(c=>c.id===selectedCity)||cities()[0];
 const countNode=$('dcxAtlasSearchCount');
 const searchInput=$('dcxAtlasSearchInput');
 const clear=$('dcxAtlasSearchClear');
 if(searchInput&&document.activeElement!==searchInput)syncSearch();
 if(clear)clear.disabled=!q;
 let total=0;
 const add=(name,desc,fn,ico)=>{
  list.append(makeRow(name,desc,fn,ico));
  total++;
  return list.lastElementChild;
 };
 if(current==='countries'){
  const entries=sortByName((data().COUNTRIES||[]).map(([name,lat,lng])=>({name,lat,lng})));
  for(const item of entries){
   if(!matches(q,item.name,lex()?.aliasCountry?.(item.name)))continue;
   const flag=countryFlags[item.name]||'🏳️';
   const row=add(item.name,'PAÍS · '+(lex()?.aliasCountry?.(item.name)||'DCX'),
    ()=>{
     // Country coordinates are catalog landmarks, not nearest city targets.
     // Keep the view regional instead of jumping to city-level zoom 12.
     const target=cities().find(c=>lex()?.countryOf(c)===item.name);
     if(target)selectedCity=target.id;
     window.DCX?.Cartography?.centerMap?.({lat:item.lat,lng:item.lng},item.name==='UNIÃO SOVIÉTICA'?3:5);
     update();
    },flag);
   const badge=row?.querySelector('.dcxAtlasRowIcon');
   if(badge){
    badge.classList.add('dcxAtlasCountryFlag');
    if(item.name==='UNIÃO SOVIÉTICA'){
     badge.classList.add('dcxAtlasFlagSoviet');
     badge.title='Símbolo histórico da União Soviética (representação estilizada)';
    }else badge.title='Bandeira: '+item.name;
   }
  }
 }else if(current==='cities'){
  for(const c of sortByName(cities())){
   const country=lex()?.countryOf(c)||c.local;
   if(!matches(q,c.name,c.local,lex()?.aliasCity?.(c),country,lex()?.aliasCountry?.(country)))continue;
   add(c.name,country,()=>chooseCity(c.id),'◈');
  }
 }else if(current==='districts'||current==='neighborhoods'||current==='roads'){
  const kind=current;
  const className={districts:'DISTRITO',neighborhoods:'BAIRRO',roads:'VIA'}[kind];
  // Without a query the list stays scoped to the chosen city.
  // With a query, search localities across the full atlas.
  const sourceCities=q?cities():city?[city]:[];
  const found=[];
  for(const place of sourceCities){
   for(const p of lex()?.locality?.(place,kind)||[]){
    if(!matches(q,p.name,p.real,place.name,lex()?.aliasCity?.(place)))continue;
    found.push({...p,city:place});
   }
  }
  found.sort((a,b)=>ptCollator.compare(a.name,b.name)||ptCollator.compare(a.city.name,b.city.name));
  for(const p of found){
   const cityLabel=q?' · '+p.city.name:'';
   add(p.name,className+cityLabel+' · REF: '+p.real,
    ()=>{
     selectedCity=p.city.id;
     window.DCX?.Cartography?.centerMap?.({lat:p.lat,lng:p.lng},kind==='roads'?15:kind==='neighborhoods'?13:12);
     update();
    },kind==='roads'?'〰':'▦');
  }
 }else{
  for(const p of pointList()){
   if(!matches(q,p.title,p.description,p.type))continue;
   const row=makeRow(p.title,p.type==='risk'?'ZONA DE RISCO · '+p.stars+'★':p.type==='important'?'PONTO IMPORTANTE':'PONTO DE INTERESSE',
    ()=>window.DCX?.Cartography?.selectPoint?.(p.id),p.type==='risk'?'!':'◈');
   if(/keymaster\.html$/i.test(location.pathname)){
    const item=node('div','dcxAtlasDirectoryItem');
    const del=btn('×',()=>window.DCX?.Cartography?.deletePoint?.(p.id),'dcxAtlasRowDelete');
    del.type='button';del.title=p.preset?'Remover exemplo deste mapa':'Excluir ping do mapa';
    del.setAttribute('aria-label',(p.preset?'Remover exemplo: ':'Excluir ping: ')+p.title);
    item.append(row,del);list.append(item);
   }else list.append(row);
   total++;
  }
 }
 if(countNode){
  const label={countries:'países',cities:'cidades',districts:'distritos',
   neighborhoods:'bairros',roads:'vias',points:'pontos'}[current]||'locais';
  countNode.textContent=total+' '+label+(q?' encontrados':' disponíveis')+
   ((current==='neighborhoods'||current==='districts'||current==='roads')&&!q&&city?' · '+city.name:'');
 }
 if(!total){
  const empty=node('p','dcxAtlasNone',q?'NENHUM RESULTADO. TENTE OUTRO NOME.':'NENHUM LOCAL DISPONÍVEL.');
  empty.setAttribute('role','status');list.append(empty);
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
 window.addEventListener('dcx-map-point-selected',event=>{
  const id=event.detail?.point?.id;
  if(id){const selected=pointList().find(p=>p.id===id);if(selected)showPoint(selected)}
 });
 window.addEventListener('dcx-map-ready',()=>{window.DCX?.Cartography?.setLabelMode?.(labelMode);update();refresh()});
 document.addEventListener('dcx-map-provider',()=>{update();refresh()});
 document.addEventListener('dcx-map-points-changed',()=>{
  refresh();
  const detail=$('dcxAtlasPointDetail'),id=detail?.dataset.pointId;
  if(id&&!pointList().some(p=>p.id===id)){
   detail.hidden=true;detail.replaceChildren();detail.removeAttribute('data-point-id');
  }else if(id){
   const next=pointList().find(p=>p.id===id);
   if(next&&detail?.querySelector('.dcxAtlasPointTitle')?.textContent!==next.title)showPoint(next);
  }
 });
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