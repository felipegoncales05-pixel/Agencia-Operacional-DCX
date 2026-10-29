/* Run with: NODE_PATH=/path/to/node_modules node tests/visual-system.cjs
   Optional: CHROMIUM_EXECUTABLE_PATH, CHROMIUM_ARGS (JSON array), QA_OUTPUT. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.QA_OUTPUT||path.join(root,'..','visual-qa');
fs.mkdirSync(output,{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(!fs.existsSync(file)){
    if(/\.(png|gif|jpe?g|webp)$/.test(file)){res.writeHead(200,{'content-type':'image/png'});res.end(png);return;}
    res.writeHead(404);res.end();return;
  }
  res.writeHead(200,{'content-type':{'.css':'text/css','.js':'text/javascript','.html':'text/html','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const profiles=['command-standard','d-burn-nomad','capri-signal-bloom','ghost-black-ice'];
const themes=['arc-cyan','dcx-green','ghost-mono','void-violet','royal-sapphire','sakura-rose','sandstorm-desert','night-city-gold','edgerunners2-burn','blackout-comfort'];
const mock=fs.readFileSync(path.join(root,'mock-firebase.js'),'utf8')+`
(()=>{
 const apps=new Map();
 firebase.app=name=>{if(!apps.has(name))throw Error('app not initialized');return apps.get(name)};
 firebase.initializeApp=(config,name='[DEFAULT]')=>{
  const app={name,options:config,auth:()=>firebase.auth(),database:()=>firebase.database()};
  apps.set(name,app);firebase.apps.push(app);return app;
 };
 const ref=firebase.database().ref('');const proto=Object.getPrototypeOf(ref);
 proto.onDisconnect=()=>({set:async()=>{},update:async()=>{},remove:async()=>{}});
 proto.orderByChild=function(){return this};proto.equalTo=function(){return this};
})();`;
const failures=[],summary={combinations:0,checks:[],screenshots:[]};
let browser;
async function check(name,fn){try{await fn();summary.checks.push({name,passed:true});console.log('PASS',name)}catch(e){failures.push(name+': '+e.message);summary.checks.push({name,passed:false,error:e.message});console.error('FAIL',name,e.message)}}
async function snap(page,name){const file=path.join(output,name+'.png');await page.screenshot({path:file});summary.screenshots.push(file);}
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const launch={headless:true};
  if(process.env.CHROMIUM_EXECUTABLE_PATH)launch.executablePath=process.env.CHROMIUM_EXECUTABLE_PATH;
  if(process.env.CHROMIUM_ARGS)launch.args=JSON.parse(process.env.CHROMIUM_ARGS);
  browser=await chromium.launch(launch);
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  // No test can reach a production backend or send credentials off the loopback origin.
  await context.route('**/*',r=>{
    const url=r.request().url();
    if(url.startsWith(base))return r.continue();
    if(url.includes('firebase-app-compat.js'))return r.fulfill({contentType:'text/javascript',body:mock});
    if(/\.js(?:\?|$)/.test(url))return r.fulfill({contentType:'text/javascript',body:''});
    if(r.request().resourceType()==='image')return r.fulfill({contentType:'image/png',body:png});
    return r.fulfill({body:''});
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
  for(const host of [false,true]){
    const role=host?'keymaster':'player';
    const url=base+(host?'/keymaster.html':'/index.html');
    const palette=host?'kmTheme':'playerTheme',themeAttr=host?'data-km-theme-choice':'data-theme-choice';
    const visualKey=host?'dcx-km-visual-v1':'dcx-player-visual-v1';
    console.log('OPEN',role);await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.DCX?.Appearance&&document.querySelectorAll('[data-appearance-choice]').length===4);
    if(host){
      await page.fill('#email','qa@example.invalid');await page.fill('#password','test-fixture-only');
      await page.click('.kmAccessSubmit');await page.waitForSelector('#console:not(.hidden)');
      await page.click('.kmWorkspaceTab[data-tab=settings]');
    }else await page.click('#playerSettingsQuickBtn');
    await page.waitForSelector('#dcxAppearanceSettings:visible');
    await check(role+': controls and accessible names',async()=>{
      assert.equal(await page.locator('[data-appearance-choice]').count(),4);
      assert.equal(await page.locator('['+themeAttr+']').count(),10);
      assert.equal(await page.locator('[data-dcx-cursor-choice]').count(),3);
      assert.equal(await page.locator('.dcxSignalIcon:not([aria-hidden=true])').count(),0);
      assert.equal(await page.locator('.chatIconBtn:not([aria-label])').count(),0);
    });
    await check(role+': 40 independent appearance / palette combinations',async()=>{
      for(const profile of profiles)for(const theme of themes){
        await page.locator('['+themeAttr+'="'+theme+'"]').click();
        await page.locator('[data-appearance-choice="'+profile+'"]').click();
        const got=await page.evaluate(({palette})=>({palette:document.documentElement.dataset[palette],profile:document.documentElement.dataset.dcxAppearance,accent:getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim()}),{palette});
        assert.equal(got.palette,theme);assert.equal(got.profile,profile);assert(got.accent);summary.combinations++;
      }
    });
    await check(role+': persistence and role isolation',async()=>{
      await page.locator('[data-appearance-choice="capri-signal-bloom"]').click();
      await page.locator('[data-dcx-cursor-choice="large"]').click();
      assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).cursor,visualKey),'large');
      await page.reload({waitUntil:'domcontentloaded'});
      assert.equal(await page.getAttribute('html','data-dcx-appearance'),'capri-signal-bloom');
      assert.equal(await page.getAttribute('html','data-dcx-cursor'),'large');
      if(host){await page.click('.kmAccessSubmit');await page.waitForSelector('#console:not(.hidden)');await page.click('[data-tab=settings].kmWorkspaceTab');}
      else await page.click('#playerSettingsQuickBtn');
    });
    await check(role+': six native cursor states, scaling and system fallback',async()=>{
      for(const mode of ['signal','large','system']){
        await page.click('[data-dcx-cursor-choice="'+mode+'"]');
        await page.waitForTimeout(40);
        const cursors=await page.evaluate(()=>Object.fromEntries(['default','interactive','precision','loading','unavailable','drag'].map(s=>[s,getComputedStyle(document.documentElement).getPropertyValue('--dcx-cursor-'+s)])));
        assert(Object.values(cursors).every(x=>x.includes('data:image/svg+xml')));
        if(mode==='large')assert(decodeURIComponent(cursors.default).includes('width="48"'));
        const actual=await page.locator('[data-dcx-cursor-choice=signal]').evaluate(n=>getComputedStyle(n).cursor);
        assert.equal(actual.includes('data:image/svg+xml'),mode!=='system');
      }
      await page.click('[data-dcx-cursor-choice=signal]');
      const old=await page.evaluate(()=>document.documentElement.style.getPropertyValue('--dcx-cursor-default'));
      await page.click('['+themeAttr+'="dcx-green"]');await page.waitForTimeout(40);
      assert.notEqual(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--dcx-cursor-default')),old);
    });
    await check(role+': dynamic icons preserve labels and insignias',async()=>{
      await page.evaluate(()=>{
        const test=document.createElement('div');test.id='qa-icons';
        test.innerHTML='<button class="kmWorkspaceTab" data-tab="notes">NOTAS DE CAMPO</button><span data-team-symbol="wolf">'+DCX.TeamSymbols.icon('wolf')+'</span><div class="chatBubble">⚙ texto do jogador</div>';
        document.body.append(test);
      });
      await page.waitForSelector('#qa-icons [data-dcx-symbol=notes]');
      assert((await page.locator('#qa-icons button').textContent()).includes('NOTAS DE CAMPO'));
      assert.equal(await page.locator('#qa-icons .dcxTeamSymbol').count(),1);
      assert.equal(await page.locator('#qa-icons .chatBubble .dcxSignalIcon').count(),0);
      await page.evaluate(()=>document.getElementById('qa-icons').remove());
    });
    await check(role+': reduced motion and explicit fonts',async()=>{
      await page.emulateMedia({reducedMotion:'reduce'});
      const motion=await page.locator('.dcxAppearanceChoice').first().evaluate(n=>getComputedStyle(n).transitionDuration);
      assert(motion.split(',').every(x=>parseFloat(x)<.01));
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.evaluate(()=>document.documentElement.dataset.dcxReducedMotion='true');
      assert(parseFloat(await page.locator('.dcxAppearanceChoice').first().evaluate(n=>getComputedStyle(n).transitionDuration))<.01);
      await page.evaluate(()=>document.documentElement.dataset.dcxReducedMotion='false');
      if(host){
        await page.evaluate(()=>{document.documentElement.style.setProperty('--dcx-own-font','Georgia');document.documentElement.dataset.dcxOwnFont='on'});
        await page.click('[data-appearance-choice=d-burn-nomad]');
        assert((await page.locator('.dcxAppearanceHead h2').evaluate(n=>getComputedStyle(n).fontFamily)).includes('Georgia'));
        await page.evaluate(()=>document.documentElement.dataset.dcxOwnFont='off');
      }
    });
    await check(role+': desktop and mobile layouts',async()=>{
      for(const profile of profiles){
        await page.setViewportSize({width:1440,height:1000});
        await page.click('[data-appearance-choice="'+profile+'"]');
        await page.locator('#dcxAppearanceSettings').scrollIntoViewIfNeeded();
        await snap(page,role+'-'+profile);
        await page.setViewportSize({width:390,height:844});
        await page.locator('#dcxAppearanceSettings').scrollIntoViewIfNeeded();
        const measure=await page.locator('#dcxAppearanceSettings').evaluate(n=>({scroll:n.scrollWidth,width:n.clientWidth,buttons:[...n.querySelectorAll('[data-appearance-choice]')].map(b=>b.getBoundingClientRect().width)}));
        assert(measure.scroll<=measure.width+2,'appearance section overflows horizontally');
        assert(measure.buttons.every(w=>w>=100),'appearance choices collapse');
      }
      await snap(page,role+'-mobile');
      await page.setViewportSize({width:1440,height:1000});
    });
    await check(role+': reset restores visuals independently',async()=>{
      await page.evaluate(()=>DCX.Appearance.setAppearance('d-burn-nomad'));
      await page.click('[data-dcx-visual-reset]');
      assert.equal(await page.getAttribute('html','data-dcx-appearance'),'command-standard');
      assert.equal(await page.getAttribute('html','data-dcx-cursor'),'signal');
      assert.equal(await page.getAttribute('html',host?'data-km-theme':'data-player-theme'),'dcx-green');
    });
    // Keep each role in the same origin to prove independent stores.
    if(host){assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dcx-player-visual-v1')).appearance),'command-standard');}
  }
  await check('invalid preferences recover without breaking the page',async()=>{
    await page.evaluate(()=>localStorage.setItem('dcx-km-visual-v1','null'));
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.getAttribute('html','data-dcx-appearance'),'command-standard');
    await page.evaluate(()=>localStorage.setItem('dcx-km-visual-v1','{"appearance":"wrong","cursor":"broken"}'));
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.getAttribute('html','data-dcx-cursor'),'signal');
  });
  summary.pageErrors=errors;
  await check('no JavaScript page errors',()=>assert.deepEqual(errors,[]));
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(summary,null,2));
  await context.close();
}
run().catch(e=>{failures.push(e.stack);console.error(e)}).finally(async()=>{
  if(browser)await browser.close();server.close();
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
  else console.log('ALL CHECKS PASSED — '+summary.combinations+' combinations');
});
