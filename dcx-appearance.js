/* Shape, motion and cursor preferences are local and independent from the color themes. */
(()=>{
  'use strict';
  const host=/keymaster\.html$/i.test(location.pathname);
  const STORE=host?'dcx-km-visual-v1':'dcx-player-visual-v1';
  const profiles=Object.freeze([
    {id:'command-standard',name:'DCX // Command Standard',icon:'core',desc:'Terminal institucional. Molduras regulares, hierarquia clara e leitura familiar.',tag:'OFICIAL'},
    {id:'d-burn-nomad',name:'D. // Burn Nomad',icon:'mission',desc:'Equipamento de campo. Diagonais, contornos reforçados e títulos de impacto.',tag:'CAMPO'},
    {id:'capri-signal-bloom',name:'Capri // Signal Bloom',icon:'channel',desc:'Comunicação em movimento. Camadas, cantos alternados e luz difusa.',tag:'SINAL'},
    {id:'ghost-black-ice',name:'Ghost // Black Ice',icon:'lock',desc:'Operação discreta. Linhas finas, menos brilho e superfícies silenciosas.',tag:'FURTIVO'}
  ]);
  const defaults={appearance:'command-standard',cursor:'signal'};
  function clean(raw){return {
    appearance:profiles.some(p=>p.id===raw?.appearance)?raw.appearance:defaults.appearance,
    cursor:['signal','large','system'].includes(raw?.cursor)?raw.cursor:defaults.cursor
  };}
  function read(){try{return clean(JSON.parse(localStorage.getItem(STORE)||'{}'))}catch{return {...defaults}}}
  let state=read(),frame=0;
  const html=document.documentElement;
  function applyAttributes(){
    html.dataset.dcxAppearance=state.appearance;
    html.dataset.dcxCursor=state.cursor;
  }
  applyAttributes(); // Loaded in the head: restored before the first layout.
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch{}}
  function sync(){
    const name=profiles.find(p=>p.id===state.appearance).name;
    document.querySelectorAll('[data-appearance-choice]').forEach(b=>{
      const active=b.dataset.appearanceChoice===state.appearance;
      b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);
      b.querySelector('em').textContent=active?'ATIVO':'USAR';
    });
    document.querySelectorAll('[data-dcx-cursor-choice]').forEach(b=>{
      const active=b.dataset.dcxCursorChoice===state.cursor;
      b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);
    });
    const label=document.getElementById('dcxAppearanceCurrent');if(label)label.textContent=name;
  }
  function apply(){
    applyAttributes();sync();scheduleCursors();
    document.dispatchEvent(new CustomEvent('dcx-appearance-changed',{detail:{...state}}));
  }
  function setAppearance(id){if(!profiles.some(p=>p.id===id))return;state.appearance=id;persist();apply();}
  function setCursor(value){if(!['signal','large','system'].includes(value))return;state.cursor=value;persist();apply();}
  function reset(){state={...defaults};persist();apply();}

  // Native SVG cursors: no moving overlay, no pointer lock, no remote resources.
  function cursorSvg(kind,accent,surface,danger,profile){
    const stroke=profile==='ghost-black-ice'?'1.1':profile==='d-burn-nomad'?'1.8':'1.4';
    const shard='<path fill="'+surface+'" stroke="'+accent+'" stroke-width="'+stroke+'" fill-rule="evenodd" d="M2 2 6 26 12 18 23 19 2 2ZM8 11l5 4-3 1-2-5Z"/><path d="m19 24 8 6m0-6-8 6" stroke="'+accent+'" stroke-width="1.6"/>';
    const fragments=kind==='interactive'||(profile==='capri-signal-bloom'&&kind==='default')?'<path d="m23 7 5 5-5 5-5-5 5-5Z" fill="'+accent+'"/>':'';
    const ring=kind==='loading'?'<path d="M18 3a9 9 0 0 1 10 9m0 4a9 9 0 0 1-6 9M13 4l-2 2" fill="none" stroke="'+accent+'" stroke-width="2"/>':'';
    let drawing=shard+fragments+ring;
    if(kind==='precision')drawing='<path d="M16 2v10m0 8v10M2 16h10m8 0h10M9 8H8v5m16 0V8h-5M8 19v5h5m6 0h5v-5" fill="none" stroke="'+surface+'" stroke-width="4"/><path d="M16 2v10m0 8v10M2 16h10m8 0h10M9 8H8v5m16 0V8h-5M8 19v5h5m6 0h5v-5" fill="none" stroke="'+accent+'" stroke-width="1.5"/><circle cx="16" cy="16" r="1.3" fill="'+accent+'"/>';
    if(kind==='unavailable')drawing=shard+'<circle cx="22" cy="23" r="7" fill="'+surface+'" stroke="'+danger+'" stroke-width="2"/><path d="m17 18 10 10" stroke="'+danger+'" stroke-width="2"/>';
    if(kind==='drag')drawing='<path d="M16 2v28M2 16h28M11 7l5-5 5 5M11 25l5 5 5-5M7 11l-5 5 5 5m18-10 5 5-5 5" fill="none" stroke="'+surface+'" stroke-width="4"/><path d="M16 2v28M2 16h28M11 7l5-5 5 5M11 25l5 5 5-5M7 11l-5 5 5 5m18-10 5 5-5 5" fill="none" stroke="'+accent+'" stroke-width="1.5"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="SIZE" height="SIZE" viewBox="0 0 32 32">'+drawing+'</svg>';
  }
  function updateCursors(){
    frame=0;
    if(!document.body)return;
    const css=getComputedStyle(html),get=(k,f)=>css.getPropertyValue(k).trim()||f;
    // Palette values are CSS colors. XML-escape before including them in an SVG attribute.
    const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    const accent=esc(get('--neo-accent',get(host?'--km-accent':'--ps-accent',get('--cyan','currentColor'))));
    const surface=esc(get('--neo-bg',get(host?'--km-bg0':'--ps-bg0',get('--bg','Canvas'))));
    const danger=esc(get(host?'--km-danger':'--ps-danger',get('--red',accent)));
    const size=state.cursor==='large'?48:32,scale=size/32;
    for(const kind of ['default','interactive','precision','loading','unavailable','drag']){
      const center=['precision','drag'].includes(kind),hotspot=Math.round((center?16:2)*scale);
      const svg=cursorSvg(kind,accent,surface,danger,state.appearance).replaceAll('SIZE',String(size));
      html.style.setProperty('--dcx-cursor-'+kind,'url("data:image/svg+xml,'+encodeURIComponent(svg)+'") '+hotspot+' '+hotspot);
    }
  }
  function scheduleCursors(){if(!frame)frame=requestAnimationFrame(updateCursors);}
  function mount(){
    const parent=document.querySelector(host?'.kmSettingsWorkspace':'.dcxSettingsContent');
    if(!parent||document.getElementById('dcxAppearanceSettings'))return;
    const section=document.createElement('section');section.id='dcxAppearanceSettings';section.className='dcxAppearanceSettings';
    section.setAttribute('aria-labelledby','dcxAppearanceHeading');
    const icon=key=>window.DCX?.Icons?.icon(key)||'';
    section.innerHTML='<header class="dcxAppearanceHead"><div><small>INTERFACE // APARÊNCIA</small><h2 id="dcxAppearanceHeading">ESTRUTURA DO TERMINAL</h2><p>Forma, tipografia e efeitos. Combine qualquer aparência com uma das dez paletas.</p></div><span id="dcxAppearanceCurrent"></span></header>'+
      '<div class="dcxAppearanceGrid" role="group" aria-label="Aparência do terminal">'+profiles.map(p=>
        '<button type="button" class="dcxAppearanceChoice" data-appearance-choice="'+p.id+'" aria-pressed="false"><span class="dcxAppearancePreview" data-preview="'+p.id+'" aria-hidden="true"><i></i><i></i><i></i>'+icon(p.icon)+'</span><small>'+p.tag+'</small><b>'+p.name+'</b><span>'+p.desc+'</span><em>USAR</em></button>').join('')+'</div>'+
      '<fieldset class="dcxCursorSettings"><legend>'+icon('cursor')+' CURSOR SIGNAL SHARD</legend><p>Em telas sensíveis ao toque, o comportamento continua nativo.</p><div class="dcxCursorChoices" role="group" aria-label="Cursor do terminal">'+
      [['signal','Signal Shard'],['large','Signal Shard ampliado'],['system','Cursor do sistema']].map(([id,label])=>'<button type="button" data-dcx-cursor-choice="'+id+'" aria-pressed="false">'+label+'</button>').join('')+
      '</div><div class="dcxCursorDemo" aria-label="Demonstração dos estados do cursor"><span>Teste aqui:</span><span data-dcx-cursor-state="default">Normal</span><button type="button">Interativo</button><span data-dcx-cursor-state="precision">Precisão</span><span data-dcx-cursor-state="loading">Carregando</span><span data-dcx-cursor-state="unavailable">Indisponível</span><span draggable="true" data-dcx-cursor-state="drag">Arrastar</span></div></fieldset>'+
      '<footer class="dcxAppearanceFoot"><span>Preferência local deste terminal. A fonte e a densidade que você escolher têm prioridade.</span><button type="button" class="btn" data-dcx-visual-reset>RESTAURAR APARÊNCIA E CURSOR</button></footer>';
    const before=parent.querySelector(host?'.dcxPanel:nth-child(2)':'.settingsSection');
    if(before)before.before(section);else parent.append(section);
    section.addEventListener('click',e=>{
      const a=e.target.closest('[data-appearance-choice]'),c=e.target.closest('[data-dcx-cursor-choice]');
      if(a)setAppearance(a.dataset.appearanceChoice);else if(c)setCursor(c.dataset.dcxCursorChoice);else if(e.target.closest('[data-dcx-visual-reset]'))reset();
    });
    sync();
  }
  function init(){
    mount();updateCursors();
    // Theme state uses root data attributes. No polling or document-wide style observer.
    new MutationObserver(scheduleCursors).observe(html,{attributes:true,attributeFilter:['data-player-theme','data-km-theme']});
    window.addEventListener('load',scheduleCursors,{once:true});
    window.addEventListener('storage',e=>{if(e.key===STORE){state=read();apply();}});
    document.getElementById(host?'kmResetSettings':'playerSettingsReset')?.addEventListener('click',reset);
    document.addEventListener('pointerdown',e=>{
      if(e.button===0&&e.target.closest('#dcxMapCanvas,.dcxFramingPreview,[draggable=true],[data-dcx-cursor-state=drag]'))html.dataset.dcxDragging='true';
    });
    const release=()=>delete html.dataset.dcxDragging;
    window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);document.addEventListener('dragend',release);
  }
  window.DCX=window.DCX||{};
  window.DCX.Appearance={profiles,setAppearance,setCursor,reset,get state(){return {...state}}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
