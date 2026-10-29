/* DOM regression tests: npm run test:visual-preferences. Never connects to Firebase. */
'use strict';
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=n=>fs.readFileSync(path.join(root,n),'utf8');
const tick=window=>new Promise(resolve=>window.setTimeout(resolve,40));
const profiles=['command-standard','d-burn-nomad','capri-signal-bloom','ghost-black-ice'];
const themes=['arc-cyan','dcx-green','ghost-mono','void-violet','royal-sapphire','sakura-rose','sandstorm-desert','night-city-gold','edgerunners2-burn','blackout-comfort'];
async function create(host,saved={},blocked=false){
  const errors=[];
  const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const html=source(host?'keymaster.html':'index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
  const dom=new JSDOM(html,{url:'https://test.invalid/'+(host?'keymaster.html':'index.html'),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window;
  if(blocked){w.Storage.prototype.getItem=()=>{throw Error('storage unavailable')};w.Storage.prototype.setItem=()=>{throw Error('storage unavailable')};}
  else for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
  w.eval(source('dcx-icons.js'));w.eval(source('dcx-appearance.js'));
  if(!blocked){
    w.eval(source(host?'keymaster-ui.js':'player-settings.js'));
    w.eval(source('dcx-neon-themes.js'));
  }
  await tick(w);
  return {dom,w,errors};
}
async function run(){
  let combinations=0;
  for(const host of [false,true]){
    const {dom,w,errors}=await create(host);
    const d=w.document,visualKey=host?'dcx-km-visual-v1':'dcx-player-visual-v1';
    const palette=host?'kmTheme':'playerTheme',themeAttr=host?'data-km-theme-choice':'data-theme-choice';
    assert.equal(d.querySelectorAll('[data-appearance-choice]').length,4);
    assert.equal(d.querySelectorAll('['+themeAttr+']').length,10);
    for(const a of profiles)for(const t of themes){
      d.querySelector('['+themeAttr+'="'+t+'"]').click();
      d.querySelector('[data-appearance-choice="'+a+'"]').click();
      assert.equal(d.documentElement.dataset.dcxAppearance,a);assert.equal(d.documentElement.dataset[palette],t);combinations++;
    }
    d.querySelector('[data-dcx-cursor-choice=large]').click();await tick(w);
    assert.equal(JSON.parse(w.localStorage.getItem(visualKey)).cursor,'large');
    for(const state of ['default','interactive','precision','loading','unavailable','drag']){
      const val=decodeURIComponent(d.documentElement.style.getPropertyValue('--dcx-cursor-'+state));
      assert(val.includes('<svg'));assert(val.includes('width="48"'));assert(val.includes('height="48"'));
    }
    const saved=w.localStorage.getItem(visualKey);
    const restored=await create(host,{[visualKey]:saved});
    assert.equal(restored.w.document.documentElement.dataset.dcxAppearance,'ghost-black-ice');
    assert.equal(restored.w.document.documentElement.dataset.dcxCursor,'large');restored.dom.window.close();
    const nav=d.createElement('button');nav.className='kmWorkspaceTab';nav.dataset.tab='notes';nav.textContent='NOTAS DE CAMPO';d.body.append(nav);
    const story=d.createElement('div');story.className='chatBubble';story.innerHTML='<span>⚙ texto</span>';d.body.append(story);
    const emblem=d.createElement('span');emblem.dataset.teamSymbol='wolf';emblem.innerHTML='<svg class="dcxTeamSymbol"><path d="M0 0h3"/></svg>';d.body.append(emblem);
    const toolbar=d.createElement('button');toolbar.className='dcxAtlasBtn';toolbar.textContent='◉ GLOBO 3D';d.body.append(toolbar);
    await tick(w);
    assert.equal(nav.querySelectorAll('[data-dcx-symbol=notes]').length,1);assert(nav.textContent.includes('NOTAS DE CAMPO'));
    w.DCX.Icons.hydrate();w.DCX.Icons.hydrate();assert.equal(nav.querySelectorAll('svg').length,1);
    assert.equal(story.querySelectorAll('.dcxSignalIcon').length,0);assert.equal(emblem.querySelectorAll('.dcxSignalIcon').length,0);
    assert.equal(toolbar.querySelectorAll('[data-dcx-symbol=atlas]').length,1);assert.equal(toolbar.textContent.trim(),'GLOBO 3D');
    assert.equal(d.querySelectorAll('.chatIconBtn:not([aria-label])').length,0);
    assert(!w.DCX.Icons.icon('unknown','"><script>alert(1)</script>').includes('<script'));
    w.DCX.Appearance.setAppearance('bad-id');assert.equal(w.DCX.Appearance.state.appearance,'ghost-black-ice');
    d.querySelector('[data-dcx-visual-reset]').click();assert.equal(d.documentElement.dataset.dcxAppearance,'command-standard');
    assert.equal(d.documentElement.dataset[palette],'blackout-comfort');
    assert.equal(d.documentElement.dataset.dcxCursor,'signal');
    d.querySelector('style')?.remove();const style=d.createElement('style');style.textContent=source('dcx-appearance.css');d.head.append(style);
    assert(style.sheet.cssRules.length>40,'appearance CSS failed to parse');
    assert.deepEqual(errors,[]);dom.window.close();
    console.log('PASS',host?'Keymaster':'Player','40 combinations, cursor generation, persistence, icons, labels, CSS and reset');
  }
  for(const value of ['null','{bad json','{"appearance":"bad","cursor":"bad"}']){
    const {dom,w}=await create(true,{'dcx-km-visual-v1':value});
    assert.equal(w.DCX.Appearance.state.appearance,'command-standard');assert.equal(w.DCX.Appearance.state.cursor,'signal');dom.window.close();
  }
  const blocked=await create(false,{},true);blocked.w.DCX.Appearance.setAppearance('d-burn-nomad');assert.equal(blocked.w.DCX.Appearance.state.appearance,'d-burn-nomad');blocked.dom.window.close();
  const separated=await create(true,{'dcx-player-visual-v1':'{"appearance":"capri-signal-bloom","cursor":"large"}'});assert.equal(separated.w.DCX.Appearance.state.appearance,'command-standard');separated.dom.window.close();
  console.log('PASS corrupt/missing/unavailable storage and separate Player/Keymaster preferences');
  console.log('ALL DOM CHECKS PASSED — '+combinations+' combinations');
}
run().catch(e=>{console.error(e);process.exitCode=1});
