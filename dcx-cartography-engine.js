/* DCX // CRÔNICAS DO TEMPO — offline tactical cartography
   2D Canvas only: no Google Maps, tiles, WebGL, or network dependency.
   Keeps the original tacticalMap Firebase schema and editor callbacks. */
(()=>{
'use strict';
const TOKYO={lat:35.6762,lng:139.6503};
const CITIES=[
 {id:'tokyo',name:'TOKYO',local:'東京',lat:35.6762,lng:139.6503,seed:14},
 {id:'yokohama',name:'YOKOHAMA',local:'横浜',lat:35.4437,lng:139.638,seed:25},
 {id:'osaka',name:'OSAKA',local:'大阪',lat:34.6937,lng:135.5023,seed:31},
 {id:'kyoto',name:'KYOTO',local:'京都',lat:35.0116,lng:135.7681,seed:43},
 {id:'nagoya',name:'NAGOYA',local:'名古屋',lat:35.1815,lng:136.9066,seed:54},
 {id:'sapporo',name:'SAPPORO',local:'札幌',lat:43.0618,lng:141.3545,seed:67},
 {id:'fukuoka',name:'FUKUOKA',local:'福岡',lat:33.5902,lng:130.4017,seed:72},
 {id:'seoul',name:'SEOUL',local:'서울',lat:37.5665,lng:126.978,seed:84},
 {id:'beijing',name:'BEIJING',local:'北京',lat:39.9042,lng:116.4074,seed:91},
 {id:'moscow',name:'MOSCOW',local:'МОСКВА · URSS',lat:55.7558,lng:37.6173,seed:104},
 {id:'london',name:'LONDON',local:'LONDRES',lat:51.5074,lng:-.1278,seed:116},
 {id:'newyork',name:'NEW YORK',local:'NOVA YORK',lat:40.7128,lng:-74.006,seed:128},
 {id:'saopaulo',name:'SÃO PAULO',local:'BRASIL',lat:-23.5505,lng:-46.6333,seed:143},
 {id:'rio',name:'RIO DE JANEIRO',local:'BRASIL',lat:-22.9068,lng:-43.1729,seed:155},
 {id:'paris',name:'PARIS',local:'FRANÇA',lat:48.8566,lng:2.3522,seed:169},
 {id:'cairo',name:'CAIRO',local:'EGITO',lat:30.0444,lng:31.2357,seed:182},
 {id:'sydney',name:'SYDNEY',local:'AUSTRÁLIA',lat:-33.8688,lng:151.2093,seed:194},
 {id:"washington",name:"WASHINGTON",local:"ESTADOS UNIDOS",lat:38.9072,lng:-77.0369,seed:205},
 {id:"losangeles",name:"LOS ANGELES",local:"ESTADOS UNIDOS",lat:34.0522,lng:-118.2437,seed:213},
 {id:"chicago",name:"CHICAGO",local:"ESTADOS UNIDOS",lat:41.8781,lng:-87.6298,seed:216},
 {id:"mexico",name:"CIDADE DO MÉXICO",local:"MÉXICO",lat:19.4326,lng:-99.1332,seed:226},
 {id:"toronto",name:"TORONTO",local:"CANADÁ",lat:43.6532,lng:-79.3832,seed:231},
 {id:"vancouver",name:"VANCOUVER",local:"CANADÁ",lat:49.2827,lng:-123.1207,seed:238},
 {id:"bogota",name:"BOGOTÁ",local:"COLÔMBIA",lat:4.711,lng:-74.0721,seed:245},
 {id:"lima",name:"LIMA",local:"PERU",lat:-12.0464,lng:-77.0428,seed:252},
 {id:"santiago",name:"SANTIAGO",local:"CHILE",lat:-33.4489,lng:-70.6693,seed:259},
 {id:"buenosaires",name:"BUENOS AIRES",local:"ARGENTINA",lat:-34.6037,lng:-58.3816,seed:266},
 {id:"brasilia",name:"BRASÍLIA",local:"BRASIL",lat:-15.7939,lng:-47.8828,seed:273},
 {id:"berlin",name:"BERLIM",local:"ALEMANHA",lat:52.52,lng:13.405,seed:281},
 {id:"madrid",name:"MADRI",local:"ESPANHA",lat:40.4168,lng:-3.7038,seed:286},
 {id:"rome",name:"ROMA",local:"ITÁLIA",lat:41.9028,lng:12.4964,seed:293},
 {id:"lisbon",name:"LISBOA",local:"PORTUGAL",lat:38.7223,lng:-9.1393,seed:298},
 {id:"amsterdam",name:"AMSTERDÃ",local:"PAÍSES BAIXOS",lat:52.3676,lng:4.9041,seed:309},
 {id:"stockholm",name:"ESTOCOLMO",local:"SUÉCIA",lat:59.3293,lng:18.0686,seed:316},
 {id:"kyiv",name:"KIEV",local:"UNIÃO SOVIÉTICA",lat:50.4501,lng:30.5234,seed:321},
 {id:"minsk",name:"MINSK",local:"UNIÃO SOVIÉTICA",lat:53.9006,lng:27.559,seed:328},
 {id:"almaty",name:"ALMATY",local:"UNIÃO SOVIÉTICA",lat:43.222,lng:76.8512,seed:332},
 {id:"tashkent",name:"TASHKENT",local:"UNIÃO SOVIÉTICA",lat:41.2995,lng:69.2401,seed:337},
 {id:"vladivostok",name:"VLADIVOSTOK",local:"UNIÃO SOVIÉTICA",lat:43.1155,lng:131.8855,seed:339},
 {id:"istanbul",name:"ISTAMBUL",local:"TURQUIA",lat:41.0082,lng:28.9784,seed:343},
 {id:"dubai",name:"DUBAI",local:"EMIRADOS ÁRABES",lat:25.2048,lng:55.2708,seed:352},
 {id:"jerusalem",name:"JERUSALÉM",local:"ISRAEL",lat:31.7683,lng:35.2137,seed:356},
 {id:"tehran",name:"TEERÃ",local:"IRÃ",lat:35.6892,lng:51.389,seed:361},
 {id:"delhi",name:"NOVA DELHI",local:"ÍNDIA",lat:28.6139,lng:77.209,seed:367},
 {id:"mumbai",name:"MUMBAI",local:"ÍNDIA",lat:19.076,lng:72.8777,seed:375},
 {id:"karachi",name:"KARACHI",local:"PAQUISTÃO",lat:24.8607,lng:67.0011,seed:379},
 {id:"shanghai",name:"XANGAI",local:"CHINA",lat:31.2304,lng:121.4737,seed:383},
 {id:"hongkong",name:"HONG KONG",local:"CHINA",lat:22.3193,lng:114.1694,seed:385},
 {id:"taipei",name:"TAIPEI",local:"TAIWAN",lat:25.033,lng:121.5654,seed:388},
 {id:"bangkok",name:"BANGKOK",local:"TAILÂNDIA",lat:13.7563,lng:100.5018,seed:390},
 {id:"singapore",name:"SINGAPURA",local:"SINGAPURA",lat:1.3521,lng:103.8198,seed:392},
 {id:"jakarta",name:"JACARTA",local:"INDONÉSIA",lat:-6.2088,lng:106.8456,seed:395},
 {id:"manila",name:"MANILA",local:"FILIPINAS",lat:14.5995,lng:120.9842,seed:397},
 {id:"hanoi",name:"HANÓI",local:"VIETNÃ",lat:21.0278,lng:105.8342,seed:402},
 {id:"busan",name:"BUSAN",local:"COREIA DO SUL",lat:35.1796,lng:129.0756,seed:406},
 {id:"lagos",name:"LAGOS",local:"NIGÉRIA",lat:6.5244,lng:3.3792,seed:410},
 {id:"nairobi",name:"NAIRÓBI",local:"QUÊNIA",lat:-1.2921,lng:36.8219,seed:414},
 {id:"johannesburg",name:"JOANESBURGO",local:"ÁFRICA DO SUL",lat:-26.2041,lng:28.0473,seed:419},
 {id:"capetown",name:"CIDADE DO CABO",local:"ÁFRICA DO SUL",lat:-33.9249,lng:18.4241,seed:424},
 {id:"addisababa",name:"ADIS ABEBA",local:"ETIÓPIA",lat:9.03,lng:38.74,seed:426},
 {id:"casablanca",name:"CASABLANCA",local:"MARROCOS",lat:33.5731,lng:-7.5898,seed:431},
 {id:"melbourne",name:"MELBOURNE",local:"AUSTRÁLIA",lat:-37.8136,lng:144.9631,seed:436},
 {id:"auckland",name:"AUCKLAND",local:"NOVA ZELÂNDIA",lat:-36.8485,lng:174.7633,seed:440},
 {id:"perth",name:"PERTH",local:"AUSTRÁLIA",lat:-31.9505,lng:115.8605,seed:445}
];
const COUNTRIES=[["CANADÁ",57,-107],["ESTADOS UNIDOS",38,-102],["MÉXICO",24,-102],["BRASIL",-12,-52],["ARGENTINA",-39,-64],["CHILE",-28,-71],["PERU",-10,-76],["COLÔMBIA",4,-72],["VENEZUELA",8,-66],["BOLÍVIA",-17,-64],["EQUADOR",-1,-78],["REINO UNIDO",54,-3],["IRLANDA",53,-8],["PORTUGAL",40,-8],["ESPANHA",41,-4],["FRANÇA",47,2],["ALEMANHA",51,11],["ITÁLIA",43,12],["PAÍSES BAIXOS",52,5],["SUÉCIA",63,16],["NORUEGA",66,13],["POLÔNIA",52,19],["TURQUIA",39,35],["GRÉCIA",39,24],["UNIÃO SOVIÉTICA",62,88],["MARROCOS",31,-7],["EGITO",26,30],["NIGÉRIA",9,8],["ETIÓPIA",9,39],["QUÊNIA",0,38],["ÁFRICA DO SUL",-28,25],["ANGOLA",-12,18],["CONGO",-3,24],["SUDÃO",15,30],["ARGÉLIA",28,3],["ARÁBIA SAUDITA",24,45],["EMIRADOS ÁRABES",24,54],["IRÃ",32,54],["PAQUISTÃO",29,69],["ÍNDIA",22,79],["CHINA",36,104],["JAPÃO",37,139],["COREIA DO SUL",36,128],["NEPAL",28,84],["BANGLADESH",24,90],["TAILÂNDIA",16,101],["VIETNÃ",16,107],["MALÁSIA",4,102],["INDONÉSIA",-3,118],["FILIPINAS",12,123],["MONGÓLIA",46,104],["SINGAPURA",1.4,104],["AUSTRÁLIA",-25,135],["NOVA ZELÂNDIA",-41,173]];
const DISTRICTS=[
 ['SHINJUKU','新宿',35.6938,139.7034],
 ['SHIBUYA','渋谷',35.6595,139.7005],
 ['IKEBUKURO','池袋',35.7295,139.7109],
 ['AKIHABARA','秋葉原',35.6984,139.7731],
 ['UENO','上野',35.7138,139.7773],
 ['GINZA','銀座',35.6717,139.7645],
 ['ASAKUSA','浅草',35.7148,139.7967],
 ['ODAIBA','お台場',35.6267,139.7758],
 ['ROPPONGI','六本木',35.6631,139.73],
 ['NAKANO','中野',35.7074,139.6659]
];
const ROADS=[
 ['Rua do Wi-Fi Amaldiçoado',35.6892,139.743],
 ['Avenida Ctrl+Z',35.701,139.706],
 ['Travessa do Sukuna Reverso',35.659,139.684],
 ['Beco do NPC Perdido',35.724,139.797],
 ['Alameda Yumiya.exe',35.673,139.77],
 ['Túnel do Ping 999',35.648,139.771],
 ['Avenida do Café Infinito',35.684,139.789],
 ['Rua da Maldição 404',35.704,139.725],
 ['Ponte do Gato Cósmico',35.634,139.738],
 ['Rua do Lag Eterno',35.687,139.67],
 ['Via dos Feiticeiros Offline',35.719,139.737],
 ['Travessa do Último Save',35.743,139.686]
];
const STORIES=[
 ['lore-shibuya','Terminal do Gato.exe',35.6595,139.7005,'important','signal','Estação clandestina de comunicação. Um gato holográfico atende antes dos agentes.'],
 ['lore-akihabara','Beco do FPS Negativo',35.6984,139.7731,'interest','intel','Peças ilegais e amuletos tecnológicos são negociados aqui.'],
 ['lore-shinjuku','Distrito Ctrl+Alt+Maldição',35.6938,139.7034,'risk','warning','Interferência temporal e atividade amaldiçoada nas proximidades.'],
 ['lore-ueno','Praça do NPC Perdido',35.7138,139.7773,'interest','star','Anúncios que parecem reconhecer o nome dos visitantes.'],
 ['lore-asakusa','Santuário do Erro 404',35.7148,139.7967,'important','portal','Local de uma anomalia de comunicação da DCX.'],
 ['lore-ginza','Café da Última Sanidade',35.6717,139.7645,'important','medical','Ponto de encontro dos agentes que sobreviveram à última missão.'],
 ['lore-roppongi','Túnel do Ping 999',35.6631,139.73,'risk','target','Ecos digitais seguem os visitantes do túnel.'],
 ['lore-odaiba','Zona da Bateria Infinita',35.6267,139.7758,'risk','warning','Drones não-registrados interceptam as comunicações.']
];
const seedPoints=Object.fromEntries(STORIES.map(([id,title,lat,lng,type,icon,description],i)=>[id,{
 id,title,lat,lng,type,icon,description,image:'',stars:type==='risk'?3:1,
 threatCount:type==='risk'?6+i:0,threatType:type==='risk'?'unregistered':'humans',
 radius:'medium',preset:true,updatedAt:0
}]));
/* Deliberately stylized continent silhouettes: fictional world atlas, not cadastral data. */
const LAND=[
 [[-168,72],[-140,70],[-126,60],[-130,50],[-124,40],[-116,32],[-105,24],[-97,17],[-86,17],[-81,25],[-82,32],[-70,42],[-59,49],[-55,58],[-70,62],[-81,55],[-96,50],[-112,49],[-121,55],[-133,63],[-155,61]],
 [[-81,12],[-72,10],[-66,4],[-57,1],[-49,-1],[-46,-12],[-36,-15],[-40,-23],[-52,-34],[-69,-56],[-76,-41],[-69,-22],[-77,-4]],
 [[-10,36],[-10,44],[-6,51],[3,52],[7,58],[20,71],[29,70],[27,57],[35,47],[43,42],[52,41],[59,50],[73,55],[85,55],[96,63],[113,60],[124,56],[136,52],[143,43],[136,36],[129,34],[121,23],[115,12],[104,2],[101,13],[90,19],[78,7],[70,19],[64,27],[55,26],[49,15],[43,12],[34,29],[26,38],[15,39],[12,35],[3,37]],
 [[-17,36],[7,36],[11,30],[25,32],[33,27],[43,12],[41,-12],[30,-35],[18,-35],[11,-24],[6,-7],[-1,4],[-13,5]],
 [[112,-11],[134,-12],[147,-20],[153,-28],[144,-38],[130,-35],[113,-24]],
 [[-52,83],[-40,70],[-48,59],[-59,64],[-65,79]],[[47,-13],[50,-23],[45,-25],[43,-14]],
 [[129,30],[137,35],[140,42],[146,43],[142,35]],[[166,-35],[179,-39],[173,-47],[167,-44]]
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pc=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
const dist=(a,b)=>Math.hypot((a.lng-b.lng)*Math.cos((a.lat+b.lat)*Math.PI/360),a.lat-b.lat);
const shade=(a,b,t)=>a+(b-a)*t;
const rand=(n)=>{let x=(n|0)^0x9e3779b9;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return ((x^(x>>>15))>>>0)/4294967296};
const palette={
 background:'#030911',water:'#041423',waterEdge:'#116c95',lot:'#071727',lotBright:'#10314a',
 road:'#0d4564',arterial:'#35b6e4',magenta:'#bc4c9b',text:'#b5d8ef',risk:'#ff507a',
 cyan:'#6ae8fa',important:'#f2ec89'
};
function create({container,center=TOKYO,zoom=13,host=false,onClick,onSelect,onMouseMove,onCameraChange}={}){
 return new Promise((resolve,reject)=>{
  try{
   // Always-visible illustrated cartography beneath the interactive canvas.
   // If browser rendering is delayed, players still see an actual city instead of a black void.
   const boot=document.createElement('div');boot.className='dcxFictionBoot';
   boot.setAttribute('aria-hidden','true');
   const shapes=[];
   for(let x=0;x<1200;x+=42)for(let y=0;y<720;y+=40){
    const k=rand(x*47+y*131);
    if(k<.13)continue;
    const inset=5+k*7;
    const fill=k>.89?'#19435b':k>.68?'#0e2f43':'#0b2132';
    shapes.push('<rect x="'+(x+inset).toFixed(0)+'" y="'+(y+inset).toFixed(0)+'" width="'+(42-inset*1.5).toFixed(0)+'" height="'+(40-inset*1.5).toFixed(0)+'" rx="1" fill="'+fill+'"/>');
    if(k>.86)shapes.push('<rect x="'+(x+inset+4).toFixed(0)+'" y="'+(y+inset+4).toFixed(0)+'" width="4" height="3" fill="#43cbef" opacity=".5"/>');
   }
   const streets=[];
   for(let y=0;y<=720;y+=40)streets.push('<path d="M0 '+y+'H1200" stroke="'+(y%200===0?'#227da4':'#17435c')+'" stroke-width="'+(y%200===0?3:1.1)+'"/>');
   for(let x=0;x<=1200;x+=42)streets.push('<path d="M'+x+' 0V720" stroke="'+(x%210===0?'#227da4':'#17435c')+'" stroke-width="'+(x%210===0?3:1.1)+'"/>');
   boot.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" role="presentation">'+
     '<rect width="1200" height="720" fill="#04121d"/>'+shapes.join('')+streets.join('')+
     '<path d="M0 428Q220 370 420 465T900 415T1200 520" fill="none" stroke="#145d7d" stroke-width="39" opacity=".28"/>'+
     '<path d="M0 428Q220 370 420 465T900 415T1200 520" fill="none" stroke="#43c3dd" stroke-width="3" opacity=".7"/>'+
     '<ellipse cx="580" cy="356" rx="188" ry="123" fill="none" stroke="#54d2ea" stroke-width="4" opacity=".7"/>'+
     '<ellipse cx="580" cy="356" rx="310" ry="218" fill="none" stroke="#cd5eac" stroke-width="3" opacity=".6"/>'+
     '<path d="M0 600L1200 100M190 0L1030 720" stroke="#4dd4e6" stroke-width="5" opacity=".64"/>'+
     '<path d="M0 240L1200 490" stroke="#dd5b9e" stroke-width="2" opacity=".65"/>'+
     '</svg>';
   container.append(boot);
   const canvas=document.createElement('canvas');canvas.className='dcxFictionCanvas';
   canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Cartografia top-down interativa da DCX');
   canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;cursor:crosshair';
   container.append(canvas);
   const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
   if(!ctx)throw Error('Seu navegador não disponibilizou desenho 2D.');
   let city=CITIES.reduce((best,v)=>dist(center,v)<dist(center,best)?v:best,CITIES[0]);
   let mode='city',z=clamp(zoom,1,19);
   let geo={lat:center.lat,lng:center.lng},worldCenter={lng:0,lat:12};
   if(z<=5)mode='global';
   let width=0,height=0,dpr=1,last=0,frame=0,pointList=[],destroyed=false;
   let dragging=null,moved=false,ignoreClick=false,visible=false,pointNodes=[],painted=false,renderError='',resizeObserver=null,visibilityObserver=null,watchTimer=null;
   let labelMode='complete';
   function screenSize(){
    const r=container.getBoundingClientRect();
    if(r.width<30||r.height<30)return false;
    const rr=Math.min(window.devicePixelRatio||1,1.5),w=Math.round(r.width),h=Math.round(r.height);
    if(w!==width||h!==height||rr!==dpr){
     width=w;height=h;dpr=rr;
     canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
     ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    visible=true;return true;
   }
   function schedule(){if(!destroyed&&!frame)frame=requestAnimationFrame(draw)}
   function installRecovery(){
    if(typeof ResizeObserver==='function'){
     resizeObserver=new ResizeObserver(()=>{if(!destroyed)schedule()});
     resizeObserver.observe(container);
    }
    if(typeof IntersectionObserver==='function'){
     visibilityObserver=new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){schedule()}
     },{threshold:0});
     visibilityObserver.observe(container);
    }
    document.addEventListener('visibilitychange',onVisibilityChange);
    window.addEventListener('dcx-map-viewport-resized',onVisibilityChange);
    window.addEventListener('resize',onVisibilityChange,{passive:true});
    // A low-frequency watchdog covers tabs that become visible without a resize event.
    watchTimer=window.setInterval(()=>{
     if(destroyed||document.hidden)return;
     const box=container.getBoundingClientRect();
     if(box.width>40&&box.height>40&&!painted)schedule();
    },1350);
   }
   function onVisibilityChange(){if(!destroyed)schedule()}
   function km(){return 32*Math.pow(2,z-13)}
   function worldScale(){return (Math.min(width/390,height/202)*Math.pow(2,z-2))}
   function projectGlobal(lat,lng){
    const scale=worldScale(),dx=((lng-worldCenter.lng+540)%360)-180;
    return {x:width/2+dx*scale,y:height/2-(lat-worldCenter.lat)*scale};
   }
   function unprojectGlobal(x,y){
    const scale=worldScale();
    let lng=worldCenter.lng+(x-width/2)/scale;
    while(lng>180)lng-=360;while(lng< -180)lng+=360;
    return {lat:clamp(worldCenter.lat-(y-height/2)/scale,-85,85),lng};
   }
   const cityKm=p=>({x:(p.lng-city.lng)*111.32*Math.cos(city.lat*Math.PI/180),y:(city.lat-p.lat)*111.32});
   const pointXY=p=>{
    if(mode==='global')return projectGlobal(p.lat,p.lng);
    const t=cityKm(p),c=cityKm(geo),scale=km();
    return {x:width/2+(t.x-c.x)*scale,y:height/2+(t.y-c.y)*scale};
   };
   function toGeo(x,y){
    if(mode==='global')return unprojectGlobal(x,y);
    const scale=km(),c=cityKm(geo);
    const dx=c.x+(x-width/2)/scale,dy=c.y+(y-height/2)/scale;
    return {lat:city.lat-dy/111.32,lng:city.lng+dx/(111.32*Math.cos(city.lat*Math.PI/180))};
   }
   function cityMap(){
    ctx.fillStyle=palette.background;ctx.fillRect(0,0,width,height);
    const scale=km(),centerKm=cityKm(geo),left=centerKm.x-width/scale/2,top=centerKm.y-height/scale/2;
    const right=centerKm.x+width/scale/2,bottom=centerKm.y+height/scale/2;
    const step=z>14?.23:z>11?.55:Math.max(1.3,8/scale);
    const minI=Math.floor(left/step)-2,maxI=Math.ceil(right/step)+2;
    const minJ=Math.floor(top/step)-2,maxJ=Math.ceil(bottom/step)+2;
    ctx.lineJoin='round';ctx.lineCap='round';
    // Land parcels are rendered only around the visible camera, no hidden world repaint.
    if(z>=9){
     for(let i=minI;i<=maxI;i++)for(let j=minJ;j<=maxJ;j++){
      if((maxI-minI)*(maxJ-minJ)>8000)break;
      const noise=rand(i*997+j*31+city.seed),x=width/2+(i*step-centerKm.x)*scale,y=height/2+(j*step-centerKm.y)*scale;
      const square=step*scale;
      if(square<3)continue;
      ctx.fillStyle=noise>.81?'#11324a':noise>.52?'#0b2034':'#071623';
      const margin=Math.min(square*.18,9);
      ctx.fillRect(x+margin,y+margin,Math.max(1,square-2*margin),Math.max(1,square-2*margin));
      if(square>18){
       ctx.fillStyle=noise>.91?'#1c4660':'#10293d';
       const edge=4+noise*8;
       ctx.fillRect(x+margin+2,y+margin+2,Math.max(2,square-2*margin-edge),Math.max(2,square-2*margin-edge));
      }
      if(square>37 && rand(i*41+j*83+city.seed)<.28){
       ctx.fillStyle=rand(i*113+j*53)>.5?'#41b8c544':'#bb56804d';
       ctx.fillRect(x+square*.23,y+square*.21,3,3);
      }
     }
    }
    // Waterways and artificial bay: fictional top-down geometry anchored to each city.
    ctx.fillStyle=palette.water;ctx.strokeStyle=palette.waterEdge;ctx.lineWidth=2;
    const bay=[[11,8],[22,6],[28,10],[31,23],[15,27],[10,17]];
    if(city.id==='tokyo'||city.id==='yokohama'){
     ctx.beginPath();
     bay.forEach(([x,y],idx)=>{const p=pointXY({lat:city.lat-y/111.32,lng:city.lng+x/(111.32*Math.cos(city.lat*Math.PI/180))});idx?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});
     ctx.closePath();ctx.fill();ctx.stroke();
    }
    // Procedural rings and arterial routes; no actual geographic street names baked in.
    function path(f,color,weight,glow=0){
     ctx.beginPath();f();ctx.lineWidth=weight;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=glow;ctx.stroke();ctx.shadowBlur=0;
    }
    for(let i=minI;i<=maxI;i++){
     const x=width/2+(i*step-centerKm.x)*scale;
     const major=i%5===0;
     path(()=>{ctx.moveTo(x,-10);ctx.lineTo(x,height+10)},major?palette.road:'#14405a',major?Math.max(1.7,2.1*(z/13)):Math.max(.6,z/17),major?2:0);
    }
    for(let j=minJ;j<=maxJ;j++){
     const y=height/2+(j*step-centerKm.y)*scale,major=j%5===0;
     path(()=>{ctx.moveTo(-10,y);ctx.lineTo(width+10,y)},major?palette.road:'#14405a',major?Math.max(1.7,2.1*(z/13)):Math.max(.6,z/17),major?2:0);
    }
    // Sweep highways roughly following concentric Tokyo ring networks.
    if(z>7)for(let ring=4;ring<=17;ring+=5){
     path(()=>{
      for(let a=0;a<=Math.PI*2+.05;a+=.035){
       const r=ring+.4*Math.sin(6*a+city.seed),x=r*Math.cos(a),y=r*.76*Math.sin(a);
       const px=width/2+(x-centerKm.x)*scale,py=height/2+(y-centerKm.y)*scale;
       a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
     },ring===4?palette.magenta:palette.arterial,Math.max(1.2,2.1*z/13),3);
    }
    // Arterial boulevards, bridges and electric train routes.
    for(let k=0;k<12;k++){
     const a=k*Math.PI/6+.13,offset=city.seed*.01,dx=Math.cos(a),dy=Math.sin(a);
     path(()=>{
      for(let t=-55;t<=55;t+=.8){
       const curve=.85*Math.sin(t*.36+k+offset),x=t*dx+curve*dy,y=t*dy-curve*dx;
       const px=width/2+(x-centerKm.x)*scale,py=height/2+(y-centerKm.y)*scale;
       t===-55?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
     },k%3===0?palette.magenta:palette.arterial,k%3===0?1.8:1.1,k%3===0?4:2);
    }
    // Minimal overlay grid, intentionally static rather than shader-heavy.
    ctx.strokeStyle='#21b7d416';ctx.lineWidth=.6;
    for(let x=0;x<width;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}
    for(let y=0;y<height;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
   }
   function drawCityLabels(){
    const lex=window.DCX?.AtlasLexicon;
    if(!lex||labelMode!=='complete')return;
    const items=[];
    if(z>=10)items.push(...lex.locality(city,'districts').map(p=>({...p,tier:1})));
    if(z>=12)items.push(...lex.locality(city,'neighborhoods').map(p=>({...p,tier:2})));
    if(z>=14)items.push(...lex.locality(city,'roads').map(p=>({...p,tier:3})));
    const occupied=[];
    for(const item of items){
     const p=pointXY(item);if(p.x<30||p.y<22||p.x>width-30||p.y>height-22)continue;
     ctx.font=item.tier===1?'bold 12px ui-monospace, monospace':item.tier===2?'bold 10px ui-monospace, monospace':'9px ui-monospace, monospace';
     const w=ctx.measureText(item.name).width+15;
     const h=item.tier===1?21:17;
     if(occupied.some(b=>p.x-w/2<b.x+b.w+5&&p.x+w/2>b.x-5&&p.y-h/2<b.y+b.h+4&&p.y+h/2>b.y-4))continue;
     ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#020914';
     ctx.strokeText(item.name,p.x,p.y);
     ctx.fillStyle=item.tier===1?'#e1faff':item.tier===2?'#98daec':'#68bcca';
     ctx.fillText(item.name,p.x,p.y);
     occupied.push({x:p.x-w/2,y:p.y-h/2,w,h});
    }
   }
   function globalMap(){
    ctx.fillStyle='#030a14';ctx.fillRect(0,0,width,height);
    const s=worldScale();
    ctx.strokeStyle='#175a7649';ctx.lineWidth=.7;
    for(let lat=-60;lat<=80;lat+=20){
     const p=projectGlobal(lat,0);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(width,p.y);ctx.stroke();
    }
    for(let lon=-180;lon<180;lon+=30){
     const p=projectGlobal(0,lon);ctx.beginPath();ctx.moveTo(p.x,0);ctx.lineTo(p.x,height);ctx.stroke();
    }
    for(const poly of LAND){
     ctx.beginPath();poly.forEach(([lon,lat],i)=>{const p=projectGlobal(lat,lon);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});
     ctx.closePath();ctx.fillStyle='#082332';ctx.fill();ctx.strokeStyle='#2f93b8';ctx.lineWidth=1.1;ctx.stroke();
    }
    // Alternate-history Soviet territory, approximate outline (fictional setting).
    const soviet=[[26,57],[32,70],[52,71],[74,74],[103,73],[132,69],[151,59],[136,51],[115,49],[90,48],[68,42],[52,42],[41,48],[34,55]];
    ctx.beginPath();soviet.forEach(([lon,lat],i)=>{const p=projectGlobal(lat,lon);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});
    ctx.closePath();ctx.fillStyle='#fa447015';ctx.fill();ctx.strokeStyle='#e7608a';ctx.lineWidth=1.2;ctx.stroke();
    ctx.font='bold 11px ui-monospace, monospace';ctx.textAlign='center';ctx.fillStyle='#f7a4bc';
    const ussr=projectGlobal(61,81);if(ussr.x>-110&&ussr.x<width+110)ctx.fillText('UNIÃO SOVIÉTICA · DCX',ussr.x,ussr.y);
    // Text is a separate canvas overlay, never baked into the fictional land polygons.
    // At world zoom levels prioritize country labels and avoid overlaps for readability.
    const occupied=[];
    const placeLabel=(value,x,y,priority=false)=>{
     ctx.font=priority?'bold 12px ui-monospace, monospace':'bold 10px ui-monospace, monospace';
     const w=ctx.measureText(value).width+8,h=17;
     if(x-w/2<5||x+w/2>width-5||y-h/2<15||y+h/2>height-15)return false;
     if(occupied.some(q=>x-w/2<q.x+q.w+8&&x+w/2>q.x-8&&y-h/2<q.y+q.h+5&&y+h/2>q.y-5))return false;
     ctx.textAlign='center';ctx.textBaseline='middle';
     ctx.lineWidth=3.3;ctx.strokeStyle='#020912';ctx.strokeText(value,x,y);
     ctx.fillStyle=priority?'#ffadbe':'#addef2';ctx.fillText(value,x,y);
     occupied.push({x:x-w/2,y:y-h/2,w,h});return true;
    };
    const lex=window.DCX?.AtlasLexicon;
    const zoomed=s>=2.1;
    if(s>=1.0){
     // Soviet state is represented as one geopolitical label in the RPG timeline.
     placeLabel(lex?.aliasCountry('UNIÃO SOVIÉTICA')||'UNIÃO SOVIÉTICA',ussr.x,ussr.y,true);
     for(const [name,lat,lng] of COUNTRIES){
      if(name==='UNIÃO SOVIÉTICA')continue;
      const p=projectGlobal(lat,lng);
      placeLabel(lex?.aliasCountry(name)||name,p.x,p.y,false);
     }
    }
    // Dots are clickable city targets; labels gain detail as the global zoom increases.
    for(const c of CITIES){
     const p=projectGlobal(c.lat,c.lng);if(p.x<0||p.x>width||p.y<0||p.y>height)continue;
     ctx.fillStyle='#7be9f3';ctx.shadowColor='#4bc6e7';ctx.shadowBlur=5;
     ctx.beginPath();ctx.arc(p.x,p.y,c.id==='tokyo'?4:2.5,0,2*Math.PI);ctx.fill();ctx.shadowBlur=0;
     if(labelMode==='complete'&&(zoomed||c.id==='tokyo'))placeLabel(lex?.aliasCity(c)||c.name,p.x,p.y-14,c.id==='tokyo');
    }
    ctx.fillStyle='#6dbacf';ctx.font='9px ui-monospace, monospace';ctx.textAlign='left';ctx.fillText('MUNDO ALTERNATIVO // VISÃO GLOBAL 2D',20,height-22);
   }
   function drawPoints(){
    const onScreen=[];
    for(const p of pointList){
     if(mode==='city' && dist(p,city)>.55)continue;
     const point=pointXY(p);if(point.x< -120||point.x>width+120||point.y< -120||point.y>height+120)continue;
     const risk=p.type==='risk',important=p.type==='important',color=risk?palette.risk:important?palette.important:palette.cyan;
     if(risk){
      const size={small:250,medium:650,large:1400}[p.radius]||650;
      const radius=mode==='city'?clamp((size/1000)*km(),16,500):9;
      ctx.beginPath();ctx.arc(point.x,point.y,radius,0,2*Math.PI);
      ctx.fillStyle='#fd36512c';ctx.fill();ctx.strokeStyle='#ff5574aa';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
     }
     ctx.beginPath();ctx.arc(point.x,point.y,important?10:8,0,Math.PI*2);
     ctx.fillStyle='#061522';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
     ctx.font='bold 13px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
     ctx.fillText(risk?'!':important?'◆':'◎',point.x,point.y+.5);
     onScreen.push({p,x:point.x,y:point.y,r:16});
    }
    pointNodes=onScreen;
   }
   function draw(now=0){
    frame=0;if(destroyed||!screenSize())return;
    if(now-last<28){schedule();return}last=now;
    try{
     ctx.clearRect(0,0,width,height);
     if(mode==='global')globalMap();else {cityMap();drawCityLabels()}
     drawPoints();
     painted=true;renderError='';
     canvas.dataset.dcxPainted='true';
     boot.classList.add('is-painted');
     const host=container.closest('.dcxTacticalMap');
     if(host)host.dataset.mapRender='ready';
    }catch(error){
     renderError=error?.message||String(error);
     console.error('[DCX MAP] Falha ao desenhar mapa 2D',error);
     painted=false;boot.classList.remove('is-painted');
     const host=container.closest('.dcxTacticalMap');
     if(host){host.dataset.mapRender='fallback';}
    }
   }
   function focusCity(id){
    const found=CITIES.find(c=>c.id===id)||CITIES[0];
    city=found;mode='city';geo={lat:found.lat,lng:found.lng};z=13;
    onCameraChange?.();schedule();
   }
   function globe(){mode='global';z=2;worldCenter={lat:15,lng:0};onCameraChange?.();schedule()}
   function setZoom(newZoom){
    z=clamp(Number(newZoom)||13,1,19);
    if(z<=5&&mode!=='global'){mode='global';z=2;worldCenter={lat:12,lng:0}}
    else if(z>=6&&mode==='global'){mode='city';z=Math.max(10,z);geo={lat:city.lat,lng:city.lng}}
    onCameraChange?.();schedule();
   }
   function changeCenter(p,newZoom){
    if(newZoom!=null)z=clamp(Number(newZoom)||13,1,19);
    if(z<=5){mode='global';worldCenter={lat:clamp(p.lat,-85,85),lng:p.lng};schedule();onCameraChange?.();return}
    city=CITIES.reduce((best,c)=>dist(p,c)<dist(p,best)?c:best,CITIES[0]);
    mode='city';geo={lat:clamp(p.lat,-80,80),lng:clamp(p.lng,-180,180)};schedule();onCameraChange?.();
   }
   function drawPosition(event){
    const box=canvas.getBoundingClientRect();
    return {x:event.clientX-box.left,y:event.clientY-box.top};
   }
   function cursorDown(e){
    if(e.button!==0)return;
    dragging={x:e.clientX,y:e.clientY,start:{...geo},world:{...worldCenter},startTime:performance.now()};
    moved=false;canvas.setPointerCapture?.(e.pointerId);e.preventDefault();
   }
   function cursorMove(e){
    const xy=drawPosition(e);
    onMouseMove?.(toGeo(xy.x,xy.y));
    if(!dragging)return;
    const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
    if(Math.hypot(dx,dy)>3)moved=true;
    if(mode==='global'){
     const scale=worldScale();worldCenter={lng:dragging.world.lng-dx/scale,lat:clamp(dragging.world.lat+dy/scale,-80,80)};
    }else{
     const scale=km();geo={
      lat:clamp(dragging.start.lat+dy/(111.32*scale),-80,80),
      lng:clamp(dragging.start.lng-dx/(111.32*Math.cos(city.lat*Math.PI/180)*scale),-180,180)
     };
    }
    schedule();
   }
   function cursorUp(e){
    if(!dragging)return;
    const dragged=moved;dragging=null;moved=false;ignoreClick=dragged;
    if(dragged)onCameraChange?.();
   }
   function click(e){
    if(ignoreClick){ignoreClick=false;return}
    if(dragging||moved)return;
    if(e.button!==0)return;
    const xy=drawPosition(e);
    for(let i=pointNodes.length-1;i>=0;i--){
     const marker=pointNodes[i];
     if(Math.hypot(xy.x-marker.x,xy.y-marker.y)<=marker.r){
      onSelect?.(marker.p);return;
     }
    }
    if(mode==='global'){
     if(host)return;
     for(const cityData of CITIES){
      const p=projectGlobal(cityData.lat,cityData.lng);
      if(Math.hypot(xy.x-p.x,xy.y-p.y)<20){focusCity(cityData.id);return}
     }
     return;
    }
    // Empty M1 clicks only focus the map; M2 creates a Keymaster ping.
   }
   function wheel(e){e.preventDefault();setZoom(z+(e.deltaY<0?1:-1))}
   canvas.addEventListener('pointerdown',cursorDown);
   canvas.addEventListener('pointermove',cursorMove);
   canvas.addEventListener('pointerup',cursorUp);
   canvas.addEventListener('pointercancel',cursorUp);
   canvas.addEventListener('click',click);
   canvas.addEventListener('wheel',wheel,{passive:false});
   canvas.addEventListener('contextmenu',e=>{
    e.preventDefault();
    if(!host||dragging)return;
    const xy=drawPosition(e);
    onClick?.(toGeo(xy.x,xy.y));
   });
   const api={
    setPoints(rows){pointList=Object.values(rows||{});schedule()},
    zoom:()=>z,center:()=>mode==='global'?{...worldCenter}:{...geo},
    setZoom,setCenter:changeCenter,
    flyTo(p,nextZoom){changeCenter(p,nextZoom||14)},
    resize:()=>{painted=false;schedule()},
    getStatus:()=>({painted,renderError,width,height,labelMode}),
    setLabelMode(next){labelMode=next==='simple'?'simple':'complete';schedule();return labelMode},
    getLabelMode:()=>labelMode,
    goCity:focusCity,
    global:globe,
    getCity:()=>city,
    isGlobal:()=>mode==='global',
    destroy(){
     destroyed=true;cancelAnimationFrame(frame);
     if(watchTimer)window.clearInterval(watchTimer);
     resizeObserver?.disconnect();visibilityObserver?.disconnect();
     document.removeEventListener('visibilitychange',onVisibilityChange);
     window.removeEventListener('dcx-map-viewport-resized',onVisibilityChange);
     window.removeEventListener('resize',onVisibilityChange);
     canvas.remove();boot.remove();
     if(window.DCX?.FictionalMapEngine?.active===api)window.DCX.FictionalMapEngine.active=null
    }
   };
   window.DCX=window.DCX||{};
   window.DCX.FictionalMapEngine=window.DCX.FictionalMapEngine||{};
   window.DCX.FictionalMapEngine.active=api;
   installRecovery();schedule();resolve(api);
  }catch(error){reject(error)}
 });
}
window.DCX=window.DCX||{};
window.DCX.FictionalAtlas={TOKYO,CITIES,COUNTRIES,DISTRICTS,ROADS,seedPoints,roadNames:ROADS.map(r=>r[0]),create};
})();