(()=>{
'use strict';
if(!/keymaster\.html$/i.test(location.pathname))return;
const STORE='dcx-km-credentials-local-v2';
const $=id=>document.getElementById(id);
let selected='';
let lastSig='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(){try{const v=JSON.parse(localStorage.getItem(STORE)||'{}');return v&&typeof v==='object'?v:{}}catch{return{}}}
function write(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch{}}
function initials(n){return(String(n||'DCX').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('')||'DCX').toUpperCase()}
function snap(){return window.DCX?.Admin?.getSnapshot?.()||{operators:{},teams:{},presence:{}}}
function typeOf(op,id){return op?.identity?.type||(String(id).startsWith('NPC-')?'npc':'player')}
function nameOf(op,id){return op?.identity?.name||op?.name||id}
function nar(op){return Object.assign({teamId:'',role:'',status:'OPERACIONAL',location:'',commsStatus:'ONLINE'},op?.narrative||{})}
function teamName(t,id){return t?.[id]?.name||(id?'EQUIPE DESCONHECIDA':'SEM EQUIPE')}
function getCfg(id){
 const all=read(),local=Object.assign({active:true,photo:''},all[id]||{});
 const remote=window.DCX?.Media?.credentialMeta?.(id);
 const shared=window.DCX?.Media?.getAvatarUrl?.(id)||'';
 if(shared)local.photo=shared;
 // Keep the link editable without inserting huge base64 upload data into the text field.
 local.remoteUrl=remote?.avatarUrl||(/^https?:\/\//i.test(local.photo)?local.photo:'');
 local.imageFrame=remote?.imageFrame||local.imageFrame||{};
 return local;
}
function saveCfg(id,patch){const all=read();all[id]=Object.assign({},all[id]||{active:true,photo:''},patch);write(all)}
async function imageData(file){if(!file||!/^image\//.test(file.type))throw new Error('Selecione uma imagem.');if(file.size>8*1024*1024)throw new Error('Imagem muito grande (máx. 8 MB).');const url=URL.createObjectURL(file);try{const img=await new Promise((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=fail;i.src=url});const mw=360,mh=460,sc=Math.min(1,mw/img.width,mh/img.height),w=Math.max(1,Math.round(img.width*sc)),h=Math.max(1,Math.round(img.height*sc));const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#070a0e';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);return c.toDataURL('image/jpeg',.84)}finally{URL.revokeObjectURL(url)}}
function buildList(ops,teams,q=''){const rows=Object.entries(ops||{}).filter(([id])=>id!=='_init').sort((a,b)=>nameOf(a[1],a[0]).localeCompare(nameOf(b[1],b[0]),'pt-BR'));const f=q?rows.filter(([id,op])=>`${id} ${nameOf(op,id)} ${teamName(teams,nar(op).teamId)} ${nar(op).role}`.toLowerCase().includes(q.toLowerCase())):rows;return f}
function render(){const host=$('kmCredentialsApp');if(!host)return;const s=snap(),ops=s.operators||{},teams=s.teams||{};const q=$('kmCredSearch')?.value||'';const rows=buildList(ops,teams,q);if(!selected||!ops[selected])selected=rows[0]?.[0]||Object.keys(ops).find(k=>k!=='_init')||'';const op=ops[selected],n=op?nar(op):null,cfg=selected?getCfg(selected):null,t=op?typeOf(op,selected):'';host.innerHTML=`<div class="kmCredLayout"><aside class="kmCredDirectory"><div class="kmCredSearch"><input id="kmCredSearch" placeholder="Buscar nome, P-ID, NPC, equipe..." value="${esc(q)}"></div><div class="kmCredList">${rows.map(([id,o])=>{const nn=nar(o),cc=getCfg(id);return`<button class="kmCredRow ${id===selected?'active':''}" data-cred-id="${esc(id)}" type="button"><span class="kmCredMiniAvatar">${cc.photo?(window.DCX?.ImageTools?.frame(cc.photo,cc.imageFrame,"","kmCredDirectoryImage")||""):`<b>${esc(initials(nameOf(o,id)))}</b>`}</span><span><b>${esc(nameOf(o,id))}</b><small>${esc(id)} · ${esc(teamName(teams,nn.teamId))}</small></span><em>${typeOf(o,id)==='npc'?'NPC':'PLAYER'}</em></button>`}).join('')||'<div class="dcxEmpty">Nenhum operador encontrado.</div>'}</div></aside><main class="kmCredStage">${op?card(selected,op,teams,cfg,t):'<div class="dcxEmpty big">Nenhuma credencial disponível.</div>'}</main></div>`;
const inp=$('kmCredSearch');if(inp){inp.focus({preventScroll:true});try{inp.setSelectionRange(inp.value.length,inp.value.length)}catch{};inp.oninput=()=>render()}
host.querySelectorAll('[data-cred-id]').forEach(b=>b.onclick=()=>{selected=b.dataset.credId;render()});
$('kmCredActive')?.addEventListener('change',e=>{saveCfg(selected,{active:e.target.checked});render()});
$('kmCredPhoto')?.addEventListener('click',()=>$('kmCredFile')?.click());
$('kmCredRemovePhoto')?.addEventListener('click',async()=>{try{if(window.DCX?.Media?.removeAdminAvatar)await window.DCX.Media.removeAdminAvatar(selected,t);saveCfg(selected,{photo:''});render()}catch(err){alert(err.message||'Falha ao remover foto.')}});
$('kmCredFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(window.DCX?.Media?.uploadAdminAvatar){await window.DCX.Media.uploadAdminAvatar(selected,t,f);saveCfg(selected,{photo:''})}else{saveCfg(selected,{photo:await imageData(f)})}setTimeout(render,250)}catch(err){alert(err.message||'Falha ao processar a imagem.')}finally{e.target.value=''}});
if(op){
 const imgField=$('kmCredImageUrl');
 if(imgField)imgField.value=cfg.remoteUrl||'';
 window.DCX?.ImageTools?.attach('kmCredImageUrl',cfg.imageFrame,cfg.photo||'');
 $('kmCredSaveFraming')?.addEventListener('click',async()=>{
  try{
   const meta=window.DCX?.ImageTools?.read('kmCredImageUrl');
   const url=String(imgField?.value||'').trim();
   if(url){
    const valid=window.DCX?.ImageTools?.safeUrl?.(url);
    if(!valid||!/^https?:\/\//i.test(valid))
     throw new Error('Cole um link direto HTTP ou HTTPS válido para a imagem.');
    // An image-hosting page is not necessarily a direct image URL.
    await new Promise((resolve,reject)=>{
     const probe=new Image();
     const timer=setTimeout(()=>reject(new Error('A imagem demorou a carregar. Confira o link público.')),10000);
     probe.onload=()=>{clearTimeout(timer);resolve()};
     probe.onerror=()=>{clearTimeout(timer);reject(new Error('O link não carrega uma imagem. Use um endereço público direto.'))};
     probe.src=valid;
    });
    await window.DCX?.Media?.saveAdminAvatarLink?.(selected,t,valid,meta);
   }else{
    await window.DCX?.Media?.saveAdminAvatarFraming?.(selected,t,meta);
   }
   saveCfg(selected,{imageFrame:meta});render();
  }catch(e){alert(e.message||'Não foi possível salvar o enquadramento.')}
 });
}
$('kmCredEdit')?.addEventListener('click',()=>{if(!selected)return;if(t==='npc'){window.DCX?.Admin?.switchTab?.('teams');setTimeout(()=>window.DCX?.Admin?.editRosterOperator?.(selected),40)}else{window.DCX?.Admin?.switchTab?.('players');setTimeout(()=>window.DCX?.Admin?.selectOperator?.(selected),40)}})
}
function card(id,op,teams,cfg,type){const n=nar(op),name=nameOf(op,id),team=teamName(teams,n.teamId);return`<article class="kmCredentialCard ${cfg.active===false?'inactive':''}"><div class="kmCredentialTop"><div><span>DCX // CREDENCIAL DE OPERADOR</span><b>${cfg.active===false?'INATIVA':'ATIVA'}</b></div><i></i></div><div class="kmCredentialBody"><div class="kmCredentialPhoto">${cfg.photo?(window.DCX?.ImageTools?.frame(cfg.photo,cfg.imageFrame,"Foto de "+name,"kmCredentialImage")||""):`<b>${esc(initials(name))}</b><small>NO PHOTO</small>`}</div><div class="kmCredentialIdentity"><small>${type==='npc'?'OPERADOR NARRATIVO':'OPERADOR REGISTRADO'}</small><h2>${esc(name)}</h2><code>${esc(id)}</code><dl><div><dt>EQUIPE</dt><dd>${esc(team)}</dd></div><div><dt>FUNÇÃO</dt><dd>${esc(n.role||'—')}</dd></div><div><dt>STATUS</dt><dd>${esc(n.status||'—')}</dd></div><div><dt>LOCAL</dt><dd>${esc(n.location||'—')}</dd></div><div><dt>COMMS</dt><dd>${esc(n.commsStatus||'—')}</dd></div><div><dt>TIPO</dt><dd>${type==='npc'?'NPC':'PLAYER'}</dd></div></dl></div></div><div class="kmCredentialFooter"><span>DCX INTERNAL // IDENTIDADE PÚBLICA — SEM DADOS DE LOGIN</span><span class="kmCredQr" aria-hidden="true"></span></div></article><section class="kmCredControls"><label class="toggle"><span>CREDENCIAL ATIVA</span><input id="kmCredActive" type="checkbox" ${cfg.active!==false?'checked':''}></label><div class="actions"><button class="btn" id="kmCredPhoto" type="button">ESCOLHER / TROCAR FOTO</button>${cfg.photo?'<button class="btn red" id="kmCredRemovePhoto" type="button">REMOVER FOTO</button>':''}<button class="btn gold" id="kmCredEdit" type="button">ABRIR EDITOR DO OPERADOR</button></div><input id="kmCredFile" class="kmCredHiddenFile" type="file" accept="image/*"><label class="kmCredentialImageUrlLabel">LINK PÚBLICO DA FOTO<input id="kmCredImageUrl" type="url" inputmode="url" placeholder="https://site.com/retrato.png" autocomplete="off"><small>Cole uma URL direta para imagem, ou use o botão de upload acima. Os dois métodos funcionam.</small></label><div class="dcxImageEditor" data-image-editor-for="kmCredImageUrl"></div><button type="button" class="btn gold" id="kmCredSaveFraming">SALVAR LINK E ENQUADRAMENTO</button><small>Fotos enviadas são comprimidas; links públicos são salvos como URLs e exibidos aos jogadores. O estado ATIVA/INATIVA continua local nesta versão.</small></section>`}
function tick(){const v=document.querySelector('[data-km-view="credentials"]');if(!v?.classList.contains('active'))return;const s=snap();const sig=JSON.stringify({o:s.operators,t:s.teams,sel:selected});if(sig!==lastSig){lastSig=sig;render()}}
function init(){render();setInterval(tick,900);window.addEventListener('storage',()=>render());window.addEventListener('dcx-avatar-updated',()=>render());console.info('[DCX] KEYMASTER CREDENTIALS V2.1 // SHARED RTDB PHOTO')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
