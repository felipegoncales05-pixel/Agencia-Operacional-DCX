/* DCX FONT STUDIO v1. Public zone styles belong to the Keymaster; player reading is local. */
(()=>{
'use strict';
const host=/keymaster\.html$/i.test(location.pathname);
const $=id=>document.getElementById(id);
const FONTS={
 default:{label:'DCX // Original',css:'ui-monospace,monospace',kind:'system'},
 orbitron:{label:'Orbitron // Night City',css:'"Orbitron",ui-sans-serif,sans-serif',kind:'web'},
 oxanium:{label:'Oxanium // Terminal',css:'"Oxanium",ui-sans-serif,sans-serif',kind:'web'},
 rajdhani:{label:'Rajdhani // Tático',css:'"Rajdhani",ui-sans-serif,sans-serif',kind:'web'},
 sharetech:{label:'Share Tech Mono // Operador',css:'"Share Tech Mono",ui-monospace,monospace',kind:'web'},
 spacegrotesk:{label:'Space Grotesk // Leitura',css:'"Space Grotesk",ui-sans-serif,sans-serif',kind:'web'},
 literata:{label:'Literata // Relatório',css:'"Literata",Georgia,serif',kind:'web'},
 serif:{label:'Serifa clássica',css:'Georgia,serif',kind:'system'},
 sans:{label:'Interface limpa',css:'system-ui,sans-serif',kind:'system'},
 franchise:{label:'Franchise // Biblioteca (local)',css:'"Franchise", "Rajdhani",sans-serif',kind:'local'},
 retrogaming:{label:'Retro Gaming // Biblioteca (local)',css:'"Retro Gaming", "Share Tech Mono",monospace',kind:'local'},
 eternal:{label:'Eternal // Biblioteca (local)',css:'"Eternal", "Orbitron",sans-serif',kind:'local'},
};
delete FONTS.goth;
FONTS.gothtitan={label:'GothTitan // Biblioteca (local)',css:'"GothTitan", "Oxanium",sans-serif',kind:'local'};
FONTS.frieren={label:'Frieren La Belle // Biblioteca (local)',css:'"Frieren La Belle",Georgia,serif',kind:'local'};
FONTS.sayyeda={label:'Sayyeda // Biblioteca (local)',css:'"Sayyeda", "Literata",serif',kind:'local'};
const ZONES=[
 ['hero','Capa // Título principal','CRÔNICAS DO TEMPO'],
 ['heroBody','Capa // Descrição','Operações, comunicação e arquivos da DCX.'],
 ['missions','Missões // Títulos e etapas','CAINDO EM UMA FRIA'],
 ['characters','Personagens // Nome e lore','DOSSIÊ DE PERSONAGEM'],
 ['handouts','Handouts // Arquivos e relatórios','RELATÓRIO CONFIDENCIAL'],
 ['yu','Yumiya // Conversas','YUMIYA // CANAL SEGURO'],
 ['interface','Interface // Menus e botões','DCX // CENTRAL DE OPERAÇÕES']
];
const defaults=()=>({font:'default',size:100,spacing:0,gradient:false,from:'#86dfff',to:'#c69cff'});
const clamp=(x,min,max,def)=>Math.min(max,Math.max(min,Number.isFinite(Number(x))?Number(x):def));
const hex=x=>/^#[0-9a-fA-F]{6}$/.test(String(x))?String(x):'#86dfff';
function clean(v){
 const o=v&&typeof v==='object'?v:{};
 return {font:Object.hasOwn(FONTS,o.font)?o.font:'default',size:clamp(o.size,80,140,100),
 spacing:clamp(o.spacing,-.03,.22,0),gradient:!!o.gradient,from:hex(o.from),to:hex(o.to||'#c69cff')};
}
function stack(v){return FONTS[clean(v).font].css}
const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeStyle(v,allowGradient=true){
 const x=clean(v);return 'font-family:'+stack(x)+'!important;font-size:'+x.size+'%!important;letter-spacing:'+x.spacing+'em!important;'+
  (allowGradient&&x.gradient?'background-image:linear-gradient(180deg,'+x.from+','+x.to+');background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;':'');
}
let remote={},local={},selected='hero',ready=false,lastConnection='',remoteRef=null,editing=false;
try{local=JSON.parse(localStorage.getItem(host?'dcx-font-studio-host-v1':'dcx-font-studio-player-v1')||'{}')||{}}catch{}
function persist(){try{localStorage.setItem(host?'dcx-font-studio-host-v1':'dcx-font-studio-player-v1',JSON.stringify(local))}catch{}}
function options(selectedId){
 return Object.entries(FONTS).map(([id,v])=>'<option value="'+id+'"'+(id===selectedId?' selected':'')+'>'+htmlEscape(v.label)+'</option>').join('');
}
function optionsFor(v){return options(clean(v).font)}
function context(){
 const rt=window.OPH?.Realtime;
 const auth=rt?.getFirebaseAuth?.(),db=rt?.getFirebaseDatabase?.();
 if(!auth?.currentUser||!db)return null;
 return {db,room:rt?.getRoom?.()||window.OPH_CONFIG?.defaultRoom||'FRIA-01'};
}
function bindRemote(){
 const ctx=context();if(!ctx)return false;
 const key=ctx.room;if(lastConnection===key&&remoteRef)return true;
 if(remoteRef)remoteRef.off();
 lastConnection=key;remoteRef=ctx.db.ref('rooms/'+key+'/dcx/meta/typography');
 remoteRef.on('value',snap=>{remote=snap.val()||{};apply();if(host&&!editing)fillFields()},e=>{console.warn('[DCX FONT STUDIO] Read failed',e)});
 return true;
}
function apply(){
 for(const [key] of ZONES){
  const item=clean(remote[key]),style=document.documentElement.style;
  style.setProperty('--dcx-type-'+key,stack(item));
  style.setProperty('--dcx-type-size-'+key,item.size+'%');
  style.setProperty('--dcx-type-spacing-'+key,item.spacing+'em');
  style.setProperty('--dcx-gradient-'+key,item.gradient?'linear-gradient(180deg,'+item.from+','+item.to+')':'none');
  document.documentElement.dataset['dcxGradient'+key.charAt(0).toUpperCase()+key.slice(1)]=item.gradient?'on':'off';
 }
 const personal=clean(local.personal||{});
 document.documentElement.style.setProperty('--dcx-personal-font',local.personalEnabled?stack(personal):'inherit');
 document.documentElement.style.setProperty('--dcx-personal-size',local.personalEnabled?personal.size+'%':'100%');
 document.documentElement.dataset.dcxPersonalFont=local.personalEnabled?'on':'off';
 const own=clean(local.interface||{});
 document.documentElement.style.setProperty('--dcx-own-font',stack(own));
 document.documentElement.dataset.dcxOwnFont=local.interfaceEnabled?'on':'off';
}
function controls(container,config,opts={}){
 const value=clean(config);
 container.innerHTML='<div class="dcxFontInputs"><label>FAMÍLIA<select data-font-field="font">'+options(value.font)+'</select></label>'+
 '<label>TAMANHO <output data-font-output="size">'+value.size+'%</output><input data-font-field="size" type="range" min="80" max="140" step="1" value="'+value.size+'"></label>'+
 '<label>ESPAÇAMENTO <output data-font-output="spacing">'+value.spacing+' em</output><input data-font-field="spacing" type="range" min="-.03" max=".22" step=".01" value="'+value.spacing+'"></label>'+
 (opts.gradient===false?'':'<label class="dcxFontSwitch"><input type="checkbox" data-font-field="gradient"'+(value.gradient?' checked':'')+'> ATIVAR GRADIENTE VERTICAL (CIMA → BAIXO)</label>'+
 '<label>COR INICIAL<input type="color" data-font-field="from" value="'+value.from+'"></label><label>COR FINAL<input type="color" data-font-field="to" value="'+value.to+'"></label>')+
 '</div><div class="dcxFontLive"><small>PRÉVIA DA TIPOGRAFIA</small><strong data-font-preview>'+htmlEscape(opts.sample||'CRÔNICAS DO TEMPO')+'</strong><p>ABCDEFGHIJKLMNOPQRSTUVWXYZ · á é í ó ú ç · 0123456789</p></div>';
 const preview=container.querySelector('[data-font-preview]');
 const draw=()=>{
  const c=readControls(container);
  preview.style.cssText=safeStyle(c);
  container.querySelectorAll('[data-font-output]').forEach(o=>{const k=o.dataset.fontOutput;o.textContent=c[k]+(k==='size'?'%':' em')});
 };
 container.addEventListener('input',draw);container.addEventListener('change',draw);draw();
}
function readControls(node){const v={};
 node.querySelectorAll('[data-font-field]').forEach(el=>{v[el.dataset.fontField]=el.type==='checkbox'?el.checked:el.value});return clean(v)}
function fillFields(){
 if(!host)return;
 const v=clean(remote[selected]);
 const sample=ZONES.find(x=>x[0]===selected)?.[2]||'CRÔNICAS DO TEMPO';
 const form=$('dcxFontSharedControls');if(form)controls(form,v,{sample});
}
function setupHost(){
 const view=$('dcxFontStudioRoot');if(!view)return;
 view.innerHTML='<div class="dcxFontStudioHero"><span>KEYMASTER // TYPOGRAPHY ENGINE</span><h1>FONT STUDIO</h1><p>Personalize áreas específicas do terminal. Essas alterações são publicadas para a sala; os jogadores podem escolher a própria fonte de escrita sem modificar o projeto.</p></div>'+
 '<div class="dcxFontStudioLayout"><aside class="dcxFontStudioMenu">'+
 ZONES.map(([id,label])=>'<button type="button" data-font-zone="'+id+'">'+htmlEscape(label)+'</button>').join('')+
 '</aside><section class="dcxFontStudioEditor"><div class="dcxFontSectionHeading"><div><small>ESTILO PUBLICADO</small><h2 id="dcxFontZoneLabel">CAPA PRINCIPAL</h2></div><span>LIVE // FIREBASE</span></div>'+
 '<div id="dcxFontSharedControls"></div>'+
 '<div class="dcxFontActions"><button type="button" class="btn gold" id="dcxFontPublish">PUBLICAR TIPOGRAFIA</button><button type="button" class="btn" id="dcxFontResetZone">RESTAURAR ÁREA</button></div>'+
 '<p id="dcxFontStatus" role="status" aria-live="polite"></p>'+
 '<div class="dcxFontLicenseNote">As fontes marcadas como Biblioteca são opções locais: só aparecem com a fonte instalada. As fontes web abertas funcionam para todos. Nenhum arquivo da sua biblioteca privada é publicado.</div></section></div>'+
 '<details class="dcxFontLocalPanel"><summary>MINHA INTERFACE DO KEYMASTER // FONTE LOCAL</summary><label class="dcxFontSwitch"><input type="checkbox" id="dcxKmOwnEnabled"> ATIVAR FONTE DO PAINEL ADMINISTRATIVO</label><label>FONTE<select id="dcxKmOwnFont">'+options(clean(local.interface).font)+'</select></label><p>Esta configuração fica apenas neste navegador e não modifica o conteúdo publicado.</p></details>';
 const nav=view.querySelector('.dcxFontStudioMenu');
 const pick=zone=>{
  selected=zone;editing=false;
  nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.fontZone===zone));
  $('dcxFontZoneLabel').textContent=ZONES.find(x=>x[0]===zone)?.[1]||zone;fillFields();
 };
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-font-zone]');if(b)pick(b.dataset.fontZone)});
 $('dcxFontSharedControls').addEventListener('input',()=>editing=true);
 $('dcxFontPublish').onclick=async()=>{
  const ctx=context();const status=$('dcxFontStatus');
  if(!ctx){status.textContent='Conecte o Keymaster à sala Firebase antes de publicar.';return}
  const next=readControls($('dcxFontSharedControls'));const button=$('dcxFontPublish');button.disabled=true;
  try{await ctx.db.ref('rooms/'+ctx.room+'/dcx/meta/typography/'+selected).set(next);editing=false;status.textContent='Estilo publicado para a sala. ✓'}
  catch(err){status.textContent='Não foi possível publicar: '+(err?.message||err)}
  finally{button.disabled=false}
 };
 $('dcxFontResetZone').onclick=()=>{controls($('dcxFontSharedControls'),defaults(),{sample:ZONES.find(x=>x[0]===selected)?.[2]});editing=true};
 $('dcxKmOwnEnabled').checked=!!local.interfaceEnabled;
 $('dcxKmOwnEnabled').onchange=e=>{local.interfaceEnabled=e.target.checked;persist();apply()};
 $('dcxKmOwnFont').onchange=e=>{local.interface={font:e.target.value};persist();apply()};
 pick('hero');
}
function setupPlayer(){
 const holder=$('dcxFontPlayerOptions');if(!holder)return;
 const v=clean(local.personal);
 holder.innerHTML='<div class="settingsSectionHead"><small>TIPOGRAFIA // LOCAL</small><b>LEITURA E ESCRITA</b></div>'+
 '<p>Escolha como você lê e escreve no seu terminal. O estilo original do Keymaster continua sendo a apresentação oficial.</p>'+
 '<label class="dcxFontSwitch"><input id="dcxPlayerFontEnabled" type="checkbox"'+(local.personalEnabled?' checked':'')+'> USAR MINHA PRÓPRIA FONTE</label>'+
 '<label>FONTE PESSOAL<select id="dcxPlayerFontChoice">'+options(v.font)+'</select></label>'+
 '<label>TAMANHO DO TEXTO <output id="dcxPlayerFontSizeValue">'+v.size+'%</output><input type="range" id="dcxPlayerFontSize" min="80" max="140" value="'+v.size+'"></label>'+
 '<div class="dcxFontLive"><small>PRÉVIA</small><strong id="dcxPlayerFontPreview">MINHA PRÓPRIA HISTÓRIA</strong></div>';
 const draw=()=>{
  const personal={font:$('dcxPlayerFontChoice').value,size:Number($('dcxPlayerFontSize').value)};
  local.personal=personal;local.personalEnabled=$('dcxPlayerFontEnabled').checked;persist();apply();
  $('dcxPlayerFontSizeValue').textContent=personal.size+'%';
  $('dcxPlayerFontPreview').style.cssText=safeStyle(personal,false);
 };
 holder.addEventListener('input',draw);holder.addEventListener('change',draw);draw();
}
function readHandout(){const form=$('dcxHandoutFontSelect');
 return clean({font:form?.value||'default',size:$('dcxHandoutFontSize')?.value||100,gradient:$('dcxHandoutGradient')?.checked||false,from:$('dcxHandoutGradientFrom')?.value,to:$('dcxHandoutGradientTo')?.value});
}
function applyHandout(handout){
 const v=clean(handout?.typography||remote.handouts);
 const title=$('dcxHandoutReaderTitle'),body=$('dcxHandoutReaderBody');
 if(title)title.style.cssText=safeStyle(v);
 if(body){body.style.fontFamily=stack(v);body.style.fontSize=v.size+'%';body.style.letterSpacing=v.spacing+'em'}
}
function init(){setupHost();setupPlayer();apply();bindRemote();
 // Retrying the initial Firebase connection does not mutate contents or permissions.
 let retries=0;const interval=setInterval(()=>{if(bindRemote()||++retries>=20)clearInterval(interval)},1500);
 ready=true;
}
window.DCX=window.DCX||{};
window.DCX.FontStudio={clean,stack,safeStyle,optionsFor,readHandout,applyHandout,get shared(){return remote}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();