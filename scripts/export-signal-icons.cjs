/* Rebuild the reusable SVG sprite from the same registry used by the website. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'dcx-icons.js'),'utf8'),context);
const icons=context.window.DCX.Icons;
const symbols=icons.names.map(name=>'<symbol id="dcx-'+name+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">'+icons.icon(name).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')+'</symbol>');
const target=path.join(root,'assets','icons');fs.mkdirSync(target,{recursive:true});
fs.writeFileSync(path.join(target,'dcx-signal-sprite.svg'),'<svg xmlns="http://www.w3.org/2000/svg">\n'+symbols.join('\n')+'\n</svg>\n');
console.log('Exported '+symbols.length+' original DCX Signal Icons.');
