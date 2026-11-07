'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function run(){
  const dom=new JSDOM('<!doctype html>',{runScripts:'outside-only'}),{window}=dom;
  const media={matches:false,listeners:[],addEventListener(type,fn){if(type==='change')this.listeners.push(fn)}};
  const available=new Set(['yumiya-normal.gif','yumiya-normal.png','yumiya-feliz.gif','yumiya-feliz.png','yumiya-raiva.gif','yumiya-raiva.png','yumiya-medo.gif','yumiya-medo.png','yumiya-envergonhada.gif','yumiya-envergonhada.png']);
  const base=src=>String(src).split('?')[0];
  class Probe{
    set src(value){this._src=value;const file=base(value),delay=file==='yumiya-raiva.gif'?25:0;setTimeout(()=>available.has(file)?this.onload?.():this.onerror?.(),delay)}
    get src(){return this._src}
  }
  class Target extends Probe{
    constructor(){super();this.dataset={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)}}
  }
  window.matchMedia=()=>media;window.Image=Probe;
  window.eval(source('yumiya-portraits.js'));
  const api=window.DCX.YumiyaPortraits;
  assert.deepEqual([...api.candidates('normal')],['yumiya-normal.gif','yumiya-normal.png','yumiya-portrait.png']);
  assert.deepEqual([...api.candidates('happy','kang')],['yumiya-kang-feliz.gif','yumiya-kang-feliz.png','yumiya-feliz.gif','yumiya-feliz.png']);

  const happy=new Target(),happyResult=await api.load(happy,{key:'happy'});
  assert.equal(happyResult.ok,true);assert.equal(happyResult.src,'yumiya-feliz.gif');assert.equal(happy.dataset.yumiyaMood,'happy');
  const kang=new Target(),kangResult=await api.load(kang,{key:'happy',preset:'kang'});
  assert.equal(kangResult.src,'yumiya-feliz.gif','missing custom preset falls back to the reviewed standard GIF');

  const raced=new Target();
  const old=api.load(raced,{key:'anger'}),latest=api.load(raced,{key:'fear'});
  const [oldResult,latestResult]=await Promise.all([old,latest]);
  assert.equal(oldResult.cancelled,true);assert.equal(latestResult.src,'yumiya-medo.gif');assert.equal(raced.dataset.yumiyaMood,'fear');

  media.matches=true;media.listeners.forEach(fn=>fn({matches:true}));await tick(0);
  assert.equal(api.modeKey(),'static');assert.deepEqual([...api.candidates('fear')],['yumiya-medo.png']);
  const staticTarget=new Target(),staticResult=await api.load(staticTarget,{key:'fear'});
  assert.equal(staticResult.animated,false);assert.equal(staticResult.src,'yumiya-medo.png');

  const dimensions={normal:[560,747],feliz:[560,700],raiva:[560,700],medo:[560,701],envergonhada:[560,700]};
  for(const [mood,[width,height]] of Object.entries(dimensions)){
    const bytes=fs.readFileSync(path.join(root,`yumiya-${mood}.gif`));
    assert.match(bytes.subarray(0,6).toString('ascii'),/^GIF8[79]a$/);assert.equal(bytes.readUInt16LE(6),width);assert.equal(bytes.readUInt16LE(8),height);assert.ok(bytes.length>100000);
  }
  const index=source('index.html'),keymaster=source('keymaster.html');
  assert.ok(index.includes('id="yumiyaPortraitImage"'));assert.ok(index.indexOf('yumiya-portraits.js')<index.indexOf('player.js'));
  assert.ok(keymaster.indexOf('yumiya-portraits.js')<keymaster.indexOf('dcx-yu-monitor.js'));
  assert.match(source('player.js'),/YumiyaPortraits/);assert.match(source('dcx-yu-monitor.js'),/YumiyaPortraits/);
  console.log('Yumiya portraits: assets, GIF-first fallback, reduced motion and request races passed.');
}
run().catch(error=>{console.error(error);process.exitCode=1});
