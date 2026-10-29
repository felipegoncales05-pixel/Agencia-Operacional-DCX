/* Reception and access regressions against actual DOM/modules, with an in-memory backend. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const wait=w=>new Promise(resolve=>w.setTimeout(resolve,30));
const cases=[];
async function test(name,run){await run();cases.push(name);console.log('PASS',name)}
async function fixture({data={},saved={},query='?room=FRIA-01',real=false,connect=null}={}){
  const errors=[],reads=[],writes=[],calls=[];let backendError=false;
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const html=read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
  const dom=new JSDOM(html,{url:'https://test.invalid/index.html'+query,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,d=w.document;w.scrollTo=()=>{};
  for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
  const auth={currentUser:{uid:'qa-player',isAnonymous:true},async setPersistence(){},async signInAnonymously(){return{}},async signOut(){this.currentUser=null}};
  function ref(p){return{
    async once(){reads.push(p);if(backendError)throw Error('offline');return{val:()=>data[p]??null}},
    async set(v){writes.push({path:p,value:v});data[p]=v;},
    on(event,callback){w.queueMicrotask(()=>callback({val:()=>data[p]??null}))},off(){},push(){return ref(p+'/new-note')}
  }}
  const db={ref};const app={auth:()=>auth,database:()=>db};
  const database=()=>db;database.ServerValue={TIMESTAMP:1};
  const authFactory=()=>auth;authFactory.Auth={Persistence:{SESSION:'session'}};
  w.firebase={app:()=>app,initializeApp:()=>app,database,auth:authFactory};
  w.OPH_CONFIG={firebase:{enabled:true},defaultRoom:'FRIA-01'};
  w.eval(read('dcx-icons.js'));w.eval(read('player-lobby.js'));w.eval(read('dcx-player.js'));
  if(real){
    w.eval(read('state.js'));w.eval(read('player-data.js'));
    let currentRoom='FRIA-01';
    w.OPH.Realtime={
      onState(){},
      async connect({roomId}){calls.push({room:roomId});currentRoom=roomId;if(connect)return connect();return{uid:'qa-player',mode:'firebase'}},
      async publishIdentity(i){writes.push({path:'identity',value:i})},
      getUid:()=>auth.currentUser.uid,getRoom:()=>currentRoom,getFirebaseAuth:()=>auth,getFirebaseDatabase:()=>db
    };
    w.eval(read('player-welcome.js'));w.eval(read('player.js'));
  }else{
    w.OPHPlayer={async connect(opts){calls.push({options:opts,room:d.getElementById('room').value,name:d.getElementById('name').value});return connect?connect():true;}};
  }
  await wait(w);
  if(!real)await w.DCX.Player.bootstrap();
  return{dom,w,d,data,reads,writes,calls,errors,failBackend:value=>{backendError=value},close:()=>dom.window.close()};
}
const pub=(values={})=>({'rooms/FRIA-01/dcx/access/public':{requireKey:false,allowNewPlayers:true,...values}});
const key=(enabled=true)=>({'rooms/FRIA-01/dcx/access/invitations/ABCD-EFGH':{enabled}});
const identity={'oph-name':'Felipe','oph-yumiya-player-id':'P-EXISTING','oph-yumiya-identity-FRIA-01':'{"name":"Felipe","playerId":"P-EXISTING"}'};
async function run(){
  await test('public room waits for an explicit entry and preserves theme/appearance',async()=>{
    const f=await fixture({data:pub(),saved:{'dcx-player-settings-v1':'{"theme":"edgerunners2-burn"}','dcx-player-visual-v1':'{"appearance":"d-burn-nomad"}'}});
    try{
      assert.equal(f.calls.length,0);assert(f.d.getElementById('dcxPlayerConsole').hidden);assert(f.d.getElementById('dcxPlayerConsole').hasAttribute('inert'));
      assert.equal(await f.w.DCX.Lobby.enter(),false);assert.equal(f.calls.length,0);
      f.d.getElementById('dcxAccessName').value='  Ana   Kurose  ';
      assert.equal(await f.w.DCX.Lobby.enter(),true);assert.equal(f.calls.length,1);assert.equal(f.calls[0].name,'Ana Kurose');
      assert.equal(f.w.DCX.Lobby.isActive(),false);assert.equal(f.d.getElementById('dcxPlayerConsole').hidden,false);
      assert(!f.d.getElementById('dcxPlayerConsole').hasAttribute('inert'));
      assert.equal(f.w.localStorage.getItem('dcx-player-settings-v1'),'\{"theme":"edgerunners2-burn"\}');
      assert.equal(f.w.localStorage.getItem('dcx-player-visual-v1'),'\{"appearance":"d-burn-nomad"\}');
      assert.deepEqual(f.errors,[]);
    }finally{f.close()}
  });
  await test('invitation room rejects missing/invalid/revoked keys, then permits a valid key',async()=>{
    const f=await fixture({data:{...pub({requireKey:true}),...key(false)}});
    try{
      assert.equal(f.d.getElementById('dcxLobbyKeyField').hidden,false);assert(f.d.getElementById('dcxAccessKey').required);
      f.d.getElementById('dcxAccessName').value='Reina';
      assert.equal(await f.w.DCX.Lobby.enter(),false);
      f.d.getElementById('dcxAccessKey').value='abcd-efgh';assert.equal(await f.w.DCX.Lobby.enter(),false);assert.equal(f.calls.length,0);
      f.data['rooms/FRIA-01/dcx/access/invitations/ABCD-EFGH'].enabled=true;
      assert.equal(await f.w.DCX.Lobby.enter(),true);assert.equal(f.calls.length,1);
      assert.equal(f.w.localStorage.getItem('dcx-access-key-FRIA-01'),'ABCD-EFGH');assert.deepEqual(f.errors,[]);
    }finally{f.close()}
  });
  await test('saved valid invitation pre-fills identity but never auto-enters',async()=>{
    const f=await fixture({data:{...pub({requireKey:true}),...key()},saved:{...identity,'dcx-access-key-FRIA-01':'ABCD-EFGH'}});
    try{
      assert.equal(f.calls.length,0);assert.equal(f.d.getElementById('dcxAccessName').value,'Felipe');assert.equal(f.d.getElementById('dcxAccessKey').value,'');assert.equal(f.d.getElementById('dcxAccessKey').required,false);
      assert(f.d.getElementById('dcxLobbyGreeting').textContent.includes('FELIPE'));
      assert.equal(await f.w.DCX.Lobby.enter(),true);
    }finally{f.close()}
  });
  await test('room closure, revoked saved keys and blocked operators stay in the lobby',async()=>{
    for(const option of [
      {data:{...pub({allowNewPlayers:false}),...key()},saved:identity},
      {data:{...pub({allowNewPlayers:false}),...key(false)},saved:{...identity,'dcx-access-key-FRIA-01':'ABCD-EFGH'}},
      {data:{...pub(),'rooms/FRIA-01/dcx/access/blockedPlayers/P-EXISTING':{blocked:true}},saved:identity}
    ]){
      const f=await fixture(option);try{f.d.getElementById('dcxAccessKey').value='ABCD-EFGH';assert.equal(await f.w.DCX.Lobby.enter(),false);assert.equal(f.calls.length,0);assert(f.w.DCX.Lobby.isActive());assert(f.d.getElementById('dcxPlayerConsole').hidden)}finally{f.close()}
    }
    const f=await fixture({data:{...pub({allowNewPlayers:false}),...key()},saved:{...identity,'dcx-access-key-FRIA-01':'ABCD-EFGH'}});
    try{assert.equal(await f.w.DCX.Lobby.enter(),true)}finally{f.close()}
  });
  await test('failed validation/connection is recoverable and cannot reveal the console',async()=>{
    let succeeds=false;const f=await fixture({data:pub(),saved:identity,connect:()=>succeeds});
    try{
      f.failBackend(true);assert.equal(await f.w.DCX.Lobby.enter(),false);assert.equal(f.calls.length,0);
      f.failBackend(false);assert.equal(await f.w.DCX.Lobby.enter(),false);assert(f.d.getElementById('dcxPlayerConsole').hidden);
      assert.equal(f.d.getElementById('dcxLobbySubmit').disabled,false);
      succeeds=true;assert.equal(await f.w.DCX.Lobby.enter(),true);
    }finally{f.close()}
  });
  await test('room inspection never changes active room, writes presence or persists a new room',async()=>{
    const f=await fixture({data:{...pub(),'rooms/OTHER/dcx/access/public':{requireKey:true}},saved:identity});
    try{
      const result=await f.w.DCX.Player.checkAccess({roomId:'other'});
      assert.equal(result.allowed,false);assert.equal(f.w.DCX.Player.getLocalIdentity().room,'FRIA-01');assert.equal(f.writes.length,0);assert.equal(f.w.localStorage.getItem('oph-room'),null);
      assert(f.reads.includes('rooms/OTHER/dcx/access/public'));
    }finally{f.close()}
  });
  await test('a late room lookup cannot overwrite a newer selection',async()=>{
    const f=await fixture({data:pub(),saved:identity});
    try{
      let release;
      f.w.DCX.Player.checkAccess=({roomId})=>roomId==='OLD'?new Promise(resolve=>{release=resolve}):Promise.resolve({allowed:true,requireKey:false,message:'NEW ROOM READY'});
      f.d.getElementById('dcxLobbyRoom').value='OLD';const old=f.w.DCX.Lobby.prepare();
      f.d.getElementById('dcxLobbyRoom').value='NEW';await f.w.DCX.Lobby.prepare();
      release({allowed:false,requireKey:true,message:'OLD RESULT'});await old;
      assert.equal(f.d.getElementById('dcxAccessStatus').textContent,'NEW ROOM READY');assert(f.d.getElementById('dcxLobbyKeyField').hidden);assert.equal(f.calls.length,0);
    }finally{f.close()}
  });
  await test('double submission only starts one connection and real module entry is gated',async()=>{
    let release;const pending=new Promise(resolve=>{release=resolve});
    const f=await fixture({data:pub(),saved:identity,connect:()=>pending});
    try{
      const first=f.w.DCX.Lobby.enter();assert.equal(await f.w.DCX.Lobby.enter(),false);await wait(f.w);assert.equal(f.calls.length,1);release(true);assert.equal(await first,true);
    }finally{f.close()}
    const live=await fixture({data:pub(),saved:identity,real:true});
    try{
      assert.equal(live.calls.length,0);assert.equal(await live.w.OPHPlayer.connect(),false);assert.equal(live.calls.length,0);
      assert.equal(await live.w.DCX.Lobby.enter(),true);assert.equal(live.calls.length,1);
      assert.equal(live.w.DCX.Player.getLocalIdentity().playerId,'P-EXISTING');assert(live.w.DCXWelcome.isActive());
      assert(live.writes.some(x=>x.path==='rooms/FRIA-01/dcx/presence/qa-player'));
      live.w.DCX.Lobby.open();assert(live.d.getElementById('dcxPlayerConsole').hidden);assert(live.w.DCX.Lobby.isActive());assert.deepEqual(live.errors,[]);
    }finally{live.close()}
  });
  await test('query room, local mode, safe greeting, labels and CSS parsing',async()=>{
    const f=await fixture({query:'?room=nova-02',saved:{'oph-name':'<img src=x onerror=bad()>'}});
    try{
      assert.equal(f.d.getElementById('dcxLobbyRoom').value,'NOVA-02');assert.equal(f.d.getElementById('dcxLobbyGreeting').querySelectorAll('img').length,0);
      f.w.OPH_CONFIG.firebase.enabled=false;assert.equal((await f.w.DCX.Player.checkAccess({roomId:'nova-02'})).local,true);
      const style=f.d.createElement('style');style.textContent=read('player-lobby.css');f.d.head.append(style);assert(style.sheet.cssRules.length>40);
      for(const id of ['dcxLobbyRoom','dcxAccessName','dcxAccessKey']){assert(f.d.querySelector('label[for="'+id+'"]'));assert.equal(f.d.querySelectorAll('#'+id).length,1)}
      assert.equal(f.d.getElementById('dcxAccessStatus').getAttribute('aria-live'),'polite');assert.deepEqual(f.errors,[]);
    }finally{f.close()}
  });
  console.log('ALL '+cases.length+' LOBBY REGRESSIONS PASSED');
}
run().catch(e=>{console.error(e);process.exitCode=1});
