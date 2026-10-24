(()=>{
'use strict';
const symbols=[
 {key:'wolf',label:'LOBO',svg:'<path d="M4 5l5 3 3-5 3 5 5-3-2 8-6 7-6-7z"/><path d="M9 13h.01M15 13h.01M10 16h4"/>'},
 {key:'wing',label:'ASA',svg:'<path d="M4 17c7-1 10-6 16-11-1 6-4 11-10 13"/><path d="M7 15l7-6M9 18l7-5"/>'},
 {key:'moon',label:'LUA',svg:'<path d="M18 16a7 7 0 1 1-7-11 6 6 0 0 0 7 11z"/>'},
 {key:'star',label:'ESTRELA',svg:'<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'},
 {key:'shield',label:'ESCUDO',svg:'<path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6z"/><path d="M9 12l2 2 4-5"/>'},
 {key:'eye',label:'OLHO',svg:'<path d="M2.5 12s3.4-5 9.5-5 9.5 5 9.5 5-3.4 5-9.5 5-9.5-5-9.5-5z"/><circle cx="12" cy="12" r="2.5"/>'},
 {key:'flame',label:'CHAMA',svg:'<path d="M12 3c1 4-3 5-3 9 0 2 1.3 3 3 3s3-1.4 3-3c0-1.4-.7-2.4-1.4-3.5 3.2 1.7 5.4 4.3 5.4 7.2A7 7 0 0 1 5 15.7C5 11 9 8 12 3z"/>'},
 {key:'crown',label:'COROA',svg:'<path d="M4 18l-1-9 5 4 4-7 4 7 5-4-1 9z"/><path d="M5 21h14"/>'},
 {key:'bolt',label:'RAIO',svg:'<path d="M13 2L5 13h6l-1 9 9-12h-6z"/>'},
 {key:'hex',label:'HEX',svg:'<path d="M8 3h8l5 9-5 9H8l-5-9z"/><path d="M9 9l6 6M15 9l-6 6"/>'},
 {key:'lotus',label:'LÓTUS',svg:'<path d="M12 20c-3-3-5-5-5-8 2 0 4 1 5 3 1-2 3-3 5-3 0 3-2 5-5 8z"/><path d="M12 15c-2-3-2-6 0-10 2 4 2 7 0 10z"/><path d="M4 15c3 0 5 2 8 5M20 15c-3 0-5 2-8 5"/>'},
 {key:'compass',label:'COMPASSO',svg:'<circle cx="12" cy="12" r="8"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'}
];
function get(key){return symbols.find(s=>s.key===key)||symbols[0]}
function icon(key,className=''){const s=get(key);return '<svg class="dcxTeamSymbol '+String(className||'')+'" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+s.svg+'</svg>'}
function picker(selected='wolf',attr='data-team-symbol'){return symbols.map(s=>'<button type="button" class="dcxSymbolChoice '+(s.key===selected?'active':'')+'" '+attr+'="'+s.key+'" title="'+s.label+'" aria-label="'+s.label+'">'+icon(s.key)+'</button>').join('')}
window.DCX=window.DCX||{};
window.DCX.TeamSymbols={symbols,get,icon,picker};
})();