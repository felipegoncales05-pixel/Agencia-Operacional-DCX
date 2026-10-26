/* DCX IMAGE FRAMING // reusable, backwards-compatible image crop and live Keymaster previews. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(x,min,max,def)=>Math.min(max,Math.max(min,Number.isFinite(Number(x))?Number(x):def));
const safeUrl=value=>{
 const raw=String(value||'').trim();
 // Uploaded credential photos can be sizable data URLs: do not truncate them.
 if(/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(raw))
  return raw.length<=750000 && /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(raw)?raw:'';
 const str=raw.slice(0,1900);
 if(raw.length>1900)return '';
 if(/^https?:\/\/[^\s"'<>]+$/i.test(str))return str;
 if(/^(?!\/|\.\/|.*\.\.)[a-z0-9_-][a-z0-9_./%-]*\.(png|jpe?g|gif|webp|avif)(\?[^<>"']*)?$/i.test(str))return str;
 return '';
};
const normalize=value=>{
 const obj=value&&typeof value==='object'?value:{};
 return {
  fit:obj.fit==='contain'?'contain':'cover',
  x:clamp(obj.x??obj.posX,0,100,50),
  y:clamp(obj.y??obj.posY,0,100,50),
  zoom:clamp(obj.zoom,100,250,100),
  dim:clamp(obj.dim??obj.overlay,0,65,0)
 };
};
const style=value=>{
 const v=normalize(value);
 return 'object-fit:'+v.fit+';object-position:'+v.x+'% '+v.y+'%;transform:scale('+(v.zoom/100)+');transform-origin:'+v.x+'% '+v.y+'%;';
};
const frame=(url,settings,alt='',imageClass='dcxImageFramed')=>{
 const src=safeUrl(url);
 return src?'<img class="'+esc(imageClass)+' dcxFramedImage" loading="lazy" src="'+esc(src)+'" alt="'+esc(alt)+'" style="'+style(settings)+'">':'';
};
const frames=new Map();
const inputId=id=>$(id);
function updateUi(entry){
 const {root,urlId}=entry;
 const entered=String(inputId(urlId)?.value||'').trim();
 const url=entered?safeUrl(entered):safeUrl(entry.fallbackUrl);
 const current=normalize({
  fit:root.querySelector('[data-image-fit]')?.value,
  x:root.querySelector('[data-image-x]')?.value,
  y:root.querySelector('[data-image-y]')?.value,
  zoom:root.querySelector('[data-image-zoom]')?.value,
  dim:root.querySelector('[data-image-dim]')?.value
 });
 const images=root.querySelectorAll('[data-image-preview] img');
 images.forEach(img=>{
  if(url){if(img.getAttribute('src')!==url)img.setAttribute('src',url)}
  else img.removeAttribute('src');
  img.style.cssText=style(current);
  img.hidden=!url;
 });
 root.querySelectorAll('[data-image-preview]').forEach(el=>{
  const overlay=el.querySelector('.dcxFramingDim');
  if(overlay)overlay.style.opacity=String(current.dim/100);
  const empty=el.querySelector('.dcxFramingEmpty');
  if(empty)empty.hidden=!!url;
 });
 for(const key of ['x','y','zoom','dim']){
  const label=root.querySelector('[data-image-val="'+key+'"]');
  if(label)label.textContent=current[key]+(key==='zoom'||key==='dim'?'%':'');
 }
 const warning=root.querySelector('.dcxFramingWarning');
 if(warning)warning.hidden=!(entered&&!safeUrl(entered));
}
function read(urlId){
 const v=frames.get(urlId);
 if(!v?.root?.isConnected)return normalize({});
 const root=v.root;
 return normalize({fit:root.querySelector('[data-image-fit]').value,
  x:root.querySelector('[data-image-x]').value,y:root.querySelector('[data-image-y]').value,
  zoom:root.querySelector('[data-image-zoom]').value,dim:root.querySelector('[data-image-dim]').value});
}
function set(urlId,settings){
 const entry=frames.get(urlId);if(!entry?.root?.isConnected)return;
 const data=normalize(settings);
 for(const [name,val] of Object.entries(data)){
  const input=entry.root.querySelector('[data-image-'+name+']');
  if(input)input.value=String(val);
 }
 updateUi(entry);
}
function attach(urlId,settings,fallbackUrl=''){
 const holder=document.querySelector('[data-image-editor-for="'+urlId+'"]');
 const input=inputId(urlId);
 if(!holder||!input)return;
 if(holder.dataset.dcxFramingAttached!=='true'){
  holder.innerHTML=
    '<div class="dcxFramingHead"><b>PRÉVIA DE ENQUADRAMENTO</b><small>Arraste para posicionar · ajuste o zoom</small></div>'+
    '<div class="dcxFramingPreviewSet">'+
      '<div class="dcxFramingPreview dcxFramingPrimary" data-image-preview><img alt="Prévia da imagem" draggable="false"><div class="dcxFramingDim"></div><span class="dcxFramingEmpty">INSIRA UMA IMAGEM PARA VISUALIZAR</span></div>'+
      '<div class="dcxFramingPreview dcxFramingCard" data-image-preview><img alt="Prévia em card" draggable="false"><div class="dcxFramingDim"></div><span class="dcxFramingEmpty">CARD</span></div>'+
      '<div class="dcxFramingPreview dcxFramingPortrait" data-image-preview><img alt="Prévia vertical" draggable="false"><div class="dcxFramingDim"></div><span class="dcxFramingEmpty">RETRATO</span></div></div>'+
    '<div class="dcxFramingControls">'+
      '<label>AJUSTE<select data-image-fit><option value="cover">PREENCHER / RECORTAR</option><option value="contain">MOSTRAR IMAGEM INTEIRA</option></select></label>'+
      [['x','POSIÇÃO HORIZONTAL',0,100],['y','POSIÇÃO VERTICAL',0,100],['zoom','ZOOM',100,250],['dim','ESCURECIMENTO',0,65]].map(([id,name,min,max])=>
       '<label>'+name+' <b data-image-val="'+id+'"></b><input type="range" data-image-'+id+' min="'+min+'" max="'+max+'" step="1"></label>').join('')+
      '<button class="dcxFramingReset" type="button">RESTAURAR ENQUADRAMENTO</button></div>'+
    '<p class="dcxFramingWarning" hidden>Verifique o link: a prévia não aceita esse endereço.</p>';
  holder.dataset.dcxFramingAttached='true';
  holder.addEventListener('input',()=>updateUi(frames.get(urlId)));
  holder.addEventListener('change',()=>updateUi(frames.get(urlId)));
  holder.querySelector('.dcxFramingReset').addEventListener('click',()=>{
   set(urlId,{});holder.dispatchEvent(new Event('input',{bubbles:true}));
  });
  holder.querySelectorAll('[data-image-preview]').forEach(el=>{
   let start=null;
   el.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    start={x:e.clientX,y:e.clientY,a:read(urlId)};
    el.setPointerCapture(e.pointerId);
   });
   el.addEventListener('pointermove',e=>{
    if(!start)return;
    const width=Math.max(1,el.clientWidth),height=Math.max(1,el.clientHeight);
    const x=clamp(start.a.x+(e.clientX-start.x)/width*100,0,100,50);
    const y=clamp(start.a.y+(e.clientY-start.y)/height*100,0,100,50);
    const xfield=holder.querySelector('[data-image-x]'),yfield=holder.querySelector('[data-image-y]');
    xfield.value=String(Math.round(x));yfield.value=String(Math.round(y));
    holder.dispatchEvent(new Event('input',{bubbles:true}));
   });
   const finish=()=>{start=null};
   el.addEventListener('pointerup',finish);el.addEventListener('pointercancel',finish);
  });
 }
 if(frames.get(urlId)?.input!==input){
  input.addEventListener('input',()=>{const entry=frames.get(urlId);if(entry?.input===input)updateUi(entry)});
 }
 const entry={root:holder,input,urlId,fallbackUrl};
 frames.set(urlId,entry);
 if(settings!==undefined)set(urlId,settings);else updateUi(entry);
}
window.DCX=window.DCX||{};
window.DCX.ImageTools={safeUrl,normalize,style,frame,attach,read,set};
})();