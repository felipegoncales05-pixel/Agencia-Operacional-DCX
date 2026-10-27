(()=>{
  const $=id=>document.getElementById(id);
  const STORE='oph-player-workspace-v2';
  // Keep the old "golpe" route working for users who saved it locally.
  let current='missions';
  function missionSections(){
    return [...document.querySelectorAll('#workspaceGolpe [data-mission-content]')];
  }
  function openMission(id){
    const chosen=id==='operacao-h'?$('dcxMissionDetail'):$('dcxMissionDynamic');
    const known=window.DCX?.StoryStudio?.operations?.some(op=>op.id===id&&op.status==='published');
    if(!chosen||!known)return false;
    const overview=$('dcxMissionsOverview');
    if(overview)overview.hidden=true;
    missionSections().forEach(section=>{section.hidden=section!==chosen});
    const dynamic=$('dcxMissionDynamic');if(dynamic)dynamic.hidden=dynamic!==chosen;
    if(id==='operacao-h'){
      $('dcxMissionLegacyArchive').hidden=true;
      $('dcxStoryLegacyModules').hidden=false;
    }
    window.DCX?.StoryStudio?.renderMission?.(id);
    switchWorkspace('missions');
    chosen.querySelector('.dcxMissionBack')?.focus();
    return true;
  }
  function showMissionList(save=true){
    const overview=$('dcxMissionsOverview');
    if(overview)overview.hidden=false;
    missionSections().forEach(section=>{section.hidden=true});
    const dynamic=$('dcxMissionDynamic');if(dynamic)dynamic.hidden=true;
    switchWorkspace('missions',save);
    return true;
  }

  function switchWorkspace(name,save=true){
    name=['dcx','characters','factions'].includes(name)?name:'missions';
    current=name;
    $('workspaceGolpe')?.classList.toggle('active',name==='missions');
    $('workspaceDCX')?.classList.toggle('active',name==='dcx');
    $('workspaceCharacters')?.classList.toggle('active',name==='characters');
    $('workspaceFactions')?.classList.toggle('active',name==='factions');
    $('workspaceTabGolpe')?.classList.toggle('active',name==='missions');
    $('workspaceTabDCX')?.classList.toggle('active',name==='dcx');
    $('workspaceTabCharacters')?.classList.toggle('active',name==='characters');
    $('workspaceTabFactions')?.classList.toggle('active',name==='factions');
    document.body.dataset.playerWorkspace=name;
    if(save){try{localStorage.setItem(STORE,name)}catch{}}
    if(name==='dcx')syncUnread();
  }

  function syncUnread(){
    const source=$('yumiyaUnread');
    const count=source&&!source.classList.contains('hidden')?Math.max(0,parseInt(source.textContent||'0',10)||0):0;
    for(const id of ['dcxWorkspaceUnread','dcxYumiyaCardUnread']){
      const el=$(id);if(!el)continue;
      el.textContent=String(Math.min(count,99));
      el.classList.toggle('hidden',!count);
    }
  }

  function call(fn,label){
    try{fn?.()}catch(e){console.error('PLAYER HUB V2 // '+label,e)}
  }

  function syncCyberDashboard(){
    const operator=$('dcxDashOperatorName'),room=$('dcxDashRoom'),link=$('dcxDashLink'),clock=$('dcxDashClock');
    const name=String($('name')?.value||$('qolIdentityName')?.textContent||'AGENTE').trim()||'AGENTE';
    const roomName=String($('room')?.value||'—').trim()||'—';
    const mode=String($('mode')?.textContent||'OFFLINE').trim().toUpperCase();
    if(operator)operator.textContent=name;
    if(room)room.textContent=roomName;
    if(link)link.textContent=mode;
    if(clock)clock.textContent=new Date().toLocaleTimeString('pt-BR',{hour12:false});
  }

  function openModule(name){
    const map={yumiya:'dcxOpenYumiya',team:'dcxOpenTeam',notes:'dcxOpenNotes',handouts:'dcxOpenHandouts',notifications:'dcxOpenNotifications',polls:'dcxOpenPolls',settings:'dcxOpenSettings',channel:'dcxOpenTeamChannel',credentials:'dcxOpenCredentials'};
    $(map[name])?.click();
  }

  function bind(){
    $('workspaceTabGolpe')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showMissionList()});
    $('dcxMissionsList')?.addEventListener('click',e=>{
      const button=e.target.closest('[data-mission-open]');
      if(button){e.preventDefault();openMission(button.dataset.missionOpen)}
    });
    $('workspaceGolpe')?.addEventListener('click',e=>{
      if(!e.target.closest('.dcxMissionBack:not(#dcxStoryLegacyToMenu)'))return;
      e.preventDefault();showMissionList();$('dcxMissionsList')?.querySelector('button')?.focus();
    });
    $('workspaceTabDCX')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchWorkspace('dcx')});
    $('workspaceTabCharacters')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchWorkspace('characters')});
    $('workspaceTabFactions')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();switchWorkspace('factions')});
    $('dcxOpenYumiya')?.addEventListener('click',e=>{e.preventDefault();call(()=>window.OPHPlayer?.toggleYumiyaChat?.(true),'YUMIYA')});
    $('dcxOpenTeam')?.addEventListener('click',e=>{e.preventDefault();call(()=>window.DCX?.Player?.toggleTeam?.(true),'EQUIPE')});
    $('dcxOpenNotes')?.addEventListener('click',e=>{e.preventDefault();call(()=>window.DCX?.Player?.toggleNotes?.(true),'ANOTACOES')});
  }

  function init(){
    document.body.classList.add('player-hub-ready');
    bind();
    let stored='missions';try{stored=localStorage.getItem(STORE)||'missions'}catch{}
    showMissionList(false);
    switchWorkspace(stored,false);
    const unread=$('yumiyaUnread');
    if(unread)new MutationObserver(syncUnread).observe(unread,{subtree:true,childList:true,attributes:true,characterData:true});
    syncUnread();
    syncCyberDashboard();
    setInterval(syncCyberDashboard,1000);
    ['name','room'].forEach(id=>$(id)?.addEventListener('input',syncCyberDashboard));
    document.querySelectorAll('[data-dcx-open]').forEach(btn=>btn.addEventListener('click',()=>openModule(btn.dataset.dcxOpen)));
    const mode=$('mode');if(mode)new MutationObserver(syncCyberDashboard).observe(mode,{subtree:true,childList:true,characterData:true});
    console.info('[DCX OS] PLAYER HUB V2 // CYBER TACTICAL DASHBOARD // INTERACTION BIND OK');
  }

  window.DCX=window.DCX||{};
  window.DCX.PlayerHub={switchWorkspace,openMission,showMissionList,openModule,syncCyberDashboard,get current(){return current}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
