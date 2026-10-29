/* DCX Signal Icons — functional symbols; TeamSymbols owns narrative insignias. */
(()=>{
  'use strict';
  const shapes=Object.freeze({
    core:'<path d="M8 3h8l5 9-5 9H8l-5-9 5-9Z"/><path d="m7 9 5 3 5-3M12 12v6"/><circle cx="7" cy="9" r="1"/><circle cx="17" cy="9" r="1"/>',
    mission:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M12 7l5 5-5 5-5-5 5-5Z"/>',
    character:'<path d="M5 3h11l3 3v15H5V3Z"/><circle cx="12" cy="10" r="2.5"/><path d="M8 18v-1a4 4 0 0 1 8 0v1"/>',
    faction:'<path d="m12 2 4 4-4 4-4-4 4-4ZM6 13l4 4-4 4-4-4 4-4Zm12 0 4 4-4 4-4-4 4-4ZM12 10v3m0 0-3 2m3-2 3 2"/>',
    notes:'<path d="M13 3H4v18h16v-8M8 8h3M8 12h2M8 17l1-4L18 4l3 3-9 9-4 1Z"/>',
    channel:'<path d="M3 4h15l3 3v10H9l-6 4V4ZM7 9h4m-4 4h7m3-3 2 2-2 2"/>',
    soundtrack:'<path d="M2 12h3l2-7 4 14 3-11 3 4h5"/>',
    settings:'<path d="M5 3v6m0 4v8M12 3v10m0 4v4m7-18v3m0 4v11M2 9h6m1 8h6m1-11h6"/>',
    credential:'<path d="M4 5h13l3 3v13H4V5ZM9 5V2h6v3"/><circle cx="9" cy="12" r="2"/><path d="M6 18a3 3 0 0 1 6 0m3-7h2m-2 4h2"/>',
    team:'<path d="m12 3 3 5-3 2-3-2 3-5ZM5 13l3 5-3 2-3-2 3-5Zm14 0 3 5-3 2-3-2 3-5ZM12 10v3m0 0-4 2m4-2 4 2"/>',
    handouts:'<path d="M7 7h10l3 3v11H7V7ZM4 17H2V2h12v2m-3 8h5m-5 4h5"/>',
    polls:'<path d="M8 3H3v18h18V10M8 10l4 4L21 3M7 18h10"/>',
    notifications:'<path d="M8 3h8l5 9-5 9H8l-5-9 5-9ZM12 7v6m0 3v1"/>',
    keyboard:'<path d="M3 5h15l3 3v11H3V5ZM7 9h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1M7 16h10"/>',
    yumiya:'<path d="M3 4h15l3 3v10H9l-6 4V4ZM6 10s2-3 6-3 6 3 6 3-2 3-6 3-6-3-6-3Z"/><circle cx="12" cy="10" r="1.5"/>',
    keymaster:'<path d="M9 3h6l3 3-3 6H9L6 6l3-3ZM12 12v9m0-4h4m-4 4h3"/>',
    atlas:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18ZM5 7h14M5 17h14"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15m6-12v15"/><path d="m12 8 2 3-2 3-2-3 2-3Z"/>',
    rank:'<path d="M3 21v-7h5v7m1 0V9h6v12m1 0V4h5v17M8 5l4-3 4 3"/>',
    story:'<path d="M4 3h10l3 3v6M4 3v18h7M8 8h4m-4 4h3m4 4 4-4 3 4-3 4-4-4Zm0 0h-4m8-4V8"/>',
    visual:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M6 12h12M12 6v12"/><circle cx="12" cy="12" r="3"/>',
    builder:'<path d="m5 3 3 3-3 3-3-3 3-3Zm14 0 3 3-3 3-3-3 3-3ZM12 15l4 4-4 4-4-4 4-4ZM8 6h8M5 9v10h3m11-10v10h-3"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',
    back:'<path d="M21 12H4m6-6-6 6 6 6"/>',
    expand:'<path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m6 6 6 6"/>',
    reset:'<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
    lock:'<path d="M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2"/>',
    cursor:'<path d="m4 2 2 19 5-6 8 1L4 2Zm10 17 4 3m0-3-4 3"/>',
    loading:'<path d="M12 3a9 9 0 0 1 9 9m-1 4a9 9 0 0 1-8 5m-4-1a9 9 0 0 1-5-8m1-4a9 9 0 0 1 4-4"/>',
    drag:'<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>'
  });
  const validClass=s=>String(s||'').replace(/[^a-zA-Z0-9_ -]/g,'');
  function icon(name,className=''){
    const key=Object.hasOwn(shapes,name)?name:'core';
    return '<svg class="dcxSignalIcon '+validClass(className)+'" data-dcx-symbol="'+key+'" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">'+shapes[key]+'</svg>';
  }
  const routes={missions:'mission',operation:'mission',master:'keymaster',dcx:'core',characters:'character',factions:'faction',map:'map','tactical-map':'map',players:'character',teams:'team',credentials:'credential',soundtrack:'soundtrack',typography:'keyboard',notes:'notes',handouts:'handouts',polls:'polls',yumiya:'yumiya',settings:'settings',yuyu:'yumiya'};
  const glyphs={'✎':'notes','#':'channel','♫':'soundtrack','⚙':'settings','▦':'team','▤':'handouts','✓':'polls','!':'notifications','◎':'core','⌗':'visual','ID':'credential'};
  const ids={dcxOpenNotes:'notes',dcxOpenTeamChannel:'channel',dcxOpenSoundtrack:'soundtrack',dcxOpenSettings:'settings',dcxOpenCredentials:'credential',dcxOpenTeam:'team',dcxOpenHandouts:'handouts',dcxOpenPolls:'polls',dcxOpenNotifications:'notifications',qolShortcutGuideBtn:'keyboard',playerSettingsQuickBtn:'settings'};
  function fill(node,key){
    if(node.querySelector(':scope > .dcxSignalIcon'))return;
    node.innerHTML=icon(key);
  }
  function prepend(node,key){
    if(!key||node.querySelector(':scope > .dcxSignalIcon'))return;
    // Remove only decorative prefixes in known UI controls, never in story/message content.
    const text=[...node.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
    if(text)text.textContent=text.textContent.replace(/^\s*[♫⌨⚙◉◈▤▣⌖◇↺×✓+]\s*/, '');
    node.insertAdjacentHTML('afterbegin',icon(key));
    node.classList.add('dcxHasSignalIcon');
  }
  const selector='[data-dcx-icon],.playerWorkspaceTab,.kmWorkspaceTab,.dcxModuleIcon,.dcxDashPanelIcon,.dcxMissionTileIcon,.dcxDockBtn > span,.chatFocusBtn > span,.chatIconBtn,.qolShortcutGuideBtn,#playerSettingsQuickBtn,.dcxVcMetricIcon,.dcxVcMetricGo,.dcxMapButton,.dcxMapErgoBtn,.dcxAtlasBtn';
  function hydrate(root=document){
    const nodes=[...(root.nodeType===1&&root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
    for(const node of nodes){
      if(node.closest('[data-team-symbol],.dcxTeamSymbol,.chatBubble,[contenteditable=true]'))continue;
      if(node.hasAttribute('data-dcx-icon')){fill(node,node.dataset.dcxIcon);continue;}
      if(node.matches('.dcxVcMetricIcon')){
        const label=node.closest('.dcxVcMetric')?.querySelector('small')?.textContent.trim();
        fill(node,({JOGADORES:'character',ATIVOS:'character',EQUIPES:'team',SALA:'core',OPERADOR:'credential',ALERTAS:'notifications',TRILHA:'soundtrack'})[label]||'core');continue;
      }
      if(node.matches('.dcxVcMetricGo')){fill(node,'arrow');continue;}
      if(node.matches('.dcxMapButton,.dcxMapErgoBtn,.dcxAtlasBtn')){
        const label=node.textContent.trim();
        const key=/EXCLUIR|REMOVER|FECHAR/.test(label)?'close':/SALVAR|PUBLICAR/.test(label)?'polls':/GLOBO|PLANETÁRIA/.test(label)?'atlas':/CENTRALIZAR|AJUSTAR|CENTRO/.test(label)?'reset':/TELA INTEIRA/.test(label)?'expand':/PAINÉIS|LEVE/.test(label)?'handouts':/CRIAR|PONTO/.test(label)?'builder':'map';
        prepend(node,key);continue;
      }
      if(node.matches('.playerWorkspaceTab,.kmWorkspaceTab')){
        const key=routes[node.dataset.workspaceTarget||node.dataset.tab];
        prepend(node.querySelector('b')||node,key);continue;
      }
      if(node.matches('.chatIconBtn')){
        if(node.textContent.trim()==='×'){
          if(!node.getAttribute('aria-label'))node.setAttribute('aria-label',node.title||'Fechar painel');
          fill(node,'close');
        }
        continue;
      }
      const key=ids[node.id]||ids[node.closest('[id]')?.id]||glyphs[node.textContent.trim()]||
        (node.matches('.dcxMissionTileIcon')&&node.textContent.trim()==='H'?'mission':null);
      if(!key)continue;
      if(node.matches('.qolShortcutGuideBtn,#playerSettingsQuickBtn'))prepend(node,key);else fill(node,key);
    }
  }
  function init(){
    hydrate();
    const pending=new Set();let scheduled=false;
    const observer=new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes){
        if(node.nodeType===1&&!node.matches('svg,.dcxSignalIcon')&&!node.closest('svg,.chatBubble,[contenteditable=true]'))pending.add(node);
      }
      if(!pending.size||scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;const roots=[...pending];pending.clear();
        for(const node of roots)if(node.isConnected)hydrate(node);
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  window.DCX=window.DCX||{};
  window.DCX.Icons=Object.freeze({icon,hydrate,names:Object.freeze(Object.keys(shapes))});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
