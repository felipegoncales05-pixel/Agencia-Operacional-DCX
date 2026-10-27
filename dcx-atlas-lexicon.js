/* DCX // Atlas lexicon V5.
   Fictional names are deliberately PARODIES of real toponyms.
   Coordinates are illustrative; they do not claim street-level geographic accuracy.
   No third-party maps or APIs. */
(()=>{
'use strict';
const countryPairs=[
 ['CANADÁ','Kanadá'],['ESTADOS UNIDOS','Estádios Unydos'],['MÉXICO','Méxiko'],
 ['BRASIL','Brasyll'],['ARGENTINA','Argentyna'],['CHILE','Chylle'],
 ['PERU','Perux'],['COLÔMBIA','Colómbrix'],['VENEZUELA','Venezuel4'],['BOLÍVIA','Bolivyx'],
 ['EQUADOR','Equad0r'],['REINO UNIDO','Reyno Unydo'],['IRLANDA','Irlandyx'],
 ['PORTUGAL','Portug4l'],['ESPANHA','Espanh4'],['FRANÇA','Frânxia'],
 ['ALEMANHA','Alemnix'],['ITÁLIA','Itallux'],['PAÍSES BAIXOS','Países Bayxos'],
 ['SUÉCIA','Suécy4'],['NORUEGA','Norwegah'],['POLÔNIA','Polônyx'],
 ['TURQUIA','Turkya'],['GRÉCIA','Grécy4'],['UNIÃO SOVIÉTICA','União Sovyética'],
 ['MARROCOS','Marr0kos'],['EGITO','Egyt0'],['NIGÉRIA','Nygéria'],
 ['ETIÓPIA','Ethiopya'],['QUÊNIA','Kêny4'],['ÁFRICA DO SUL','Áfrika do Sul'],
 ['ANGOLA','Angol4'],['CONGO','Kong0'],['SUDÃO','Sud4n'],['ARGÉLIA','Argelya'],
 ['ARÁBIA SAUDITA','Arábya Saudyt4'],['EMIRADOS ÁRABES','Emyrados Árabes'],
 ['IRÃ','Ir4n'],['PAQUISTÃO','Pakist4n'],['ÍNDIA','Índrya'],
 ['CHINA','Xina'],['JAPÃO','Japaon'],['COREIA DO SUL','Koreya do Sul'],
 ['NEPAL','Nep4l'],['BANGLADESH','Bangl4desh'],['TAILÂNDIA','Thaylândia'],
 ['VIETNÃ','Vietn4m'],['MALÁSIA','Malaysya'],['INDONÉSIA','Ind0nésia'],
 ['FILIPINAS','Filipynas'],['MONGÓLIA','Mongolya'],['SINGAPURA','Syngapura'],
 ['AUSTRÁLIA','Australyx'],['NOVA ZELÂNDIA','Nova Zelândyx'],
 ['ISRAEL','Ysrael'],['TAIWAN','Taywan'],['COREIA DO NORTE','Koreya do Norte'],
 ['EMIRADOS ÁRABES UNIDOS','Emyrados Árabes Unydos']
];
const cityPairs={
 tokyo:'Tókyoh',yokohama:'Yokoham4',osaka:'Osakka',kyoto:'Kyotto',nagoya:'Nagoy4',
 sapporo:'Sappor0',fukuoka:'Fukuok4',seoul:'Seoll',beijing:'BeiJinx',moscow:'Moskva.exe',
 london:'Londom',newyork:'Neu York',saopaulo:'Sãu Paulu',rio:'Ryo de Janeyro',
 paris:'Parix',cairo:'Kayro',sydney:'Sydnei',washington:'Washingtron',
 losangeles:'Los Anjeles',chicago:'Chycago',mexico:'Mexykko',toronto:'Toront0',
 vancouver:'Vankuver',bogota:'Bogot4',lima:'Lym4',santiago:'Santyago',
 buenosaires:'Buenos Ayr3s',brasilia:'Brasylia',berlin:'Berlyn',madrid:'Madry',
 rome:'Rom4',lisbon:'Lyxboa',amsterdam:'Amsterd4m',stockholm:'Stockh0lm',
 kyiv:'Kyiv-X',minsk:'Mynsk',almaty:'Almatyx',tashkent:'Tashk3nt',
 vladivostok:'Vladyvostok',istanbul:'Istambull',dubai:'Dub4i',
 jerusalem:'Jerusal3m',tehran:'Teher4n',delhi:'Nova Dely',mumbai:'Mumb4i',
 karachi:'Karachy',shanghai:'Xangh4i',hongkong:'Hong-K0ng',
 taipei:'Taipeyx',bangkok:'Bangk0k',singapore:'Syngapura',
 jakarta:'Jakart4',manila:'Manilla',hanoi:'Han0i',busan:'Bus4n',
 lagos:'Lag0s',nairobi:'Nairob1',johannesburg:'JoanesburgX',
 capetown:'Cidade do Kap0',addisababa:'Adis Abeb4',casablanca:'Kasablanca',
 melbourne:'Melburne',auckland:'Aukl4nd',perth:'Perthy'
};
const countriesByCity={
 'JAPÃO':'tokyo yokohama osaka kyoto nagoya sapporo fukuoka',
 'COREIA DO SUL':'seoul busan',
 'CHINA':'beijing shanghai hongkong',
 'UNIÃO SOVIÉTICA':'moscow kyiv minsk almaty tashkent vladivostok',
 'REINO UNIDO':'london',
 'ESTADOS UNIDOS':'newyork washington losangeles chicago',
 'BRASIL':'saopaulo rio brasilia',
 'FRANÇA':'paris','EGITO':'cairo','AUSTRÁLIA':'sydney melbourne perth',
 'MÉXICO':'mexico','CANADÁ':'toronto vancouver','COLÔMBIA':'bogota',
 'PERU':'lima','CHILE':'santiago','ARGENTINA':'buenosaires',
 'ALEMANHA':'berlin','ESPANHA':'madrid','ITÁLIA':'rome','PORTUGAL':'lisbon',
 'PAÍSES BAIXOS':'amsterdam','SUÉCIA':'stockholm',
 'TURQUIA':'istanbul','EMIRADOS ÁRABES':'dubai','ISRAEL':'jerusalem',
 'IRÃ':'tehran','ÍNDIA':'delhi mumbai','PAQUISTÃO':'karachi','TAIWAN':'taipei',
 'TAILÂNDIA':'bangkok','SINGAPURA':'singapore','INDONÉSIA':'jakarta',
 'FILIPINAS':'manila','VIETNÃ':'hanoi','NIGÉRIA':'lagos',
 'QUÊNIA':'nairobi','ÁFRICA DO SUL':'johannesburg capetown',
 'ETIÓPIA':'addisababa','MARROCOS':'casablanca','NOVA ZELÂNDIA':'auckland'
};
const cityCountry={};
for(const [country,ids] of Object.entries(countriesByCity))
 for(const id of ids.split(' '))cityCountry[id]=country;
const countryMap=new Map(countryPairs);
function aliasFrom(real){
 const name=String(real||'Zona desconhecida').trim();
 if(name.length<3)return name+'-X';
 let chars=Array.from(name),at=Math.max(1,Math.floor(chars.length*.63));
 while(at<chars.length&&chars[at]===' ')at++;
 if(at>=chars.length)at=Math.floor(chars.length/2);
 const c=chars[at];
 const swaps={a:'4',A:'4',e:'3',E:'3',i:'y',I:'Y',o:'0',O:'0',u:'u',U:'U',s:'z',S:'Z',r:'rr',R:'R'};
 chars[at]=swaps[c]||String(c).toLowerCase()+'x';
 return chars.join('');
}
const aliasCountry=(name)=>countryMap.get(String(name||'').toUpperCase())||aliasFrom(name);
const aliasCity=(city)=>cityPairs[typeof city==='string'?city:city?.id]||aliasFrom(typeof city==='string'?city:city?.name);
const countryOf=(city)=>cityCountry[typeof city==='string'?city:city?.id]||'TERRA DCX';
// Specific urban district and neighborhood references. Names are parodies,
// locations approximate, matching game fiction rather than official GIS.
const localDatasets={
 tokyo:{
  districts:[
   ['Shinju-Ku','SHINJUKU',35.6938,139.7034],['Xibuya','SHIBUYA',35.6595,139.7005],
   ['Akiba-Hara','AKIHABARA',35.6984,139.7731],['Ikebukur0','IKEBUKURO',35.7295,139.7109],
   ['Uen0','UENO',35.7138,139.7773],['Gynza','GINZA',35.6717,139.7645],
   ['Asakuxa','ASAKUSA',35.7148,139.7967],['Odaivah','ODAIBA',35.6267,139.7758],
   ['Ropp0ngi','ROPPONGI',35.6631,139.73],['Nakan0','NAKANO',35.7074,139.6659],
   ['Megur0','MEGURO',35.6415,139.6982],['Shinagaw4','SHINAGAWA',35.6092,139.7302]],
  neighborhoods:[
   ['Harajuk0','HARAJUKU',35.6702,139.7027],['Ebissu','EBISU',35.6467,139.7101],
   ['Aoyam4','AOYAMA',35.6693,139.7189],['Daikanyam4','DAIKANYAMA',35.6482,139.7032],
   ['Kand4','KANDA',35.6921,139.7709],['Nihonbashi.exe','NIHONBASHI',35.6841,139.7745],
   ['Shim0kitazawa','SHIMOKITAZAWA',35.6615,139.6668],['Azab0','AZABU',35.6555,139.736]],
  roads:[
   ['Avenida Meiji D0ri','MEIJI DORI',35.6691,139.7028],
   ['Alameda Om0tesandō','OMOTESANDO',35.6667,139.7095],
   ['Rua Yasukun1 Dōri','YASUKUNI DORI',35.6912,139.7089],
   ['Avenida Chū0.exe','CHUO DORI',35.6990,139.7720],
   ['Rua Takeshit4','TAKESHITA DORI',35.6711,139.7056],
   ['Via A0yama-Link','AOYAMA DORI',35.6724,139.7217],
   ['Travessa Kabukich0','KABUKICHO',35.6952,139.7023],
   ['Ponte Rainb0w','RAINBOW BRIDGE',35.6363,139.7641],
   ['Avenida Sh0wa.exe','SHOWA DORI',35.6832,139.7787],
   ['Rua Ginza Chū0','GINZA CHUO',35.6722,139.7685],
   ['Rodovia K0shu Kaidō','KOSHU KAIDO',35.6874,139.6911],
   ['Alameda Nakamise.exe','NAKAMISE DORI',35.7128,139.7965]]
 },
 saopaulo:{
  districts:[['Distryt0 Paulysta','PAULISTA',-23.5633,-46.6542],['Centro V3lho','CENTRO VELHO',-23.5501,-46.6333],['Pinheyr0s','PINHEIROS',-23.5664,-46.6903],['Liberd4de','LIBERDADE',-23.5595,-46.6354]],
  neighborhoods:[['Moema.exe','MOEMA',-23.6005,-46.6661],['Vila Marianyx','VILA MARIANA',-23.5883,-46.6367],['Bell4 Vista','BELA VISTA',-23.5588,-46.6493],['Vila Mad4lena','VILA MADALENA',-23.5515,-46.6909]],
  roads:[['Avenida Paulysta.exe','AVENIDA PAULISTA',-23.5629,-46.6544],['Rua August4','RUA AUGUSTA',-23.5534,-46.6594],['Avenida Rebouç4s','AVENIDA REBOUÇAS',-23.575,-46.6864],['Avenida 23 de May0','AVENIDA 23 DE MAIO',-23.5667,-46.6427]]
 },
 newyork:{
  districts:[['Manhatt4n','MANHATTAN',40.7831,-73.9712],['Brooklynn','BROOKLYN',40.6782,-73.9442],['Queenz','QUEENS',40.7282,-73.7949],['Bron-X','BRONX',40.8448,-73.8648]],
  neighborhoods:[['H4rlem','HARLEM',40.8116,-73.9465],['SoH0','SOHO',40.7233,-74.0030],['Chels3a','CHELSEA',40.7465,-74.0014]],
  roads:[['Avenida Br0adway','BROADWAY',40.759,-73.984],['Wall Str33t','WALL STREET',40.7075,-74.0113],['Fifth Avenyu','FIFTH AVENUE',40.774,-73.965]]
 },
 london:{
  districts:[['Westminst3r','WESTMINSTER',51.4995,-.1248],['Camd3n','CAMDEN',51.5416,-.1433],['ShoreDystrikt','SHOREDITCH',51.5262,-.0794]],
  neighborhoods:[['S0ho','SOHO',51.5138,-.1345],['Nottyng Hill','NOTTING HILL',51.5095,-.1967]],
  roads:[['Oxf0rd Street','OXFORD STREET',51.5154,-.1410],['Baker Str33t','BAKER STREET',51.5237,-.1585],['Fleet Str33t','FLEET STREET',51.5136,-.1084]]
 },
 paris:{
  districts:[['Montmartrex','MONTMARTRE',48.8867,2.3431],['Marays','LE MARAIS',48.857,2.363]],
  neighborhoods:[['Latyn Quartier','LATIN QUARTER',48.85,2.344]],
  roads:[['Champs-Élys3es','CHAMPS ELYSEES',48.8698,2.3077],['Rue de Riv0li','RUE DE RIVOLI',48.8581,2.347]]
 },
 rio:{
  districts:[['Copacaban4','COPACABANA',-22.9711,-43.1822],['Ipan3ma','IPANEMA',-22.9847,-43.1986]],
  neighborhoods:[['Tiyuca','TIJUCA',-22.9258,-43.2339],['Botaf0go','BOTAFOGO',-22.9512,-43.1849]],
  roads:[['Avenida Atlântyk4','AVENIDA ATLANTICA',-22.9718,-43.1827],['Rua Visconde de PiraJ4','VISCONDE DE PIRAJA',-22.985,-43.196]]
 }
};
const offsets=[
 [1.2,0.5],[.2,1.6],[-1.1,.8],[-.9,-1.4],[.5,-1.2],[2.2,-1.2],[-1.9,1.8],[2,2]
];
const urbanFallback={
 districts:['Distrit0 Centr4l','Nova Zona 0este','Bairro L3ste','Set0r Nortyx','Distrit0 Sul'],
 neighborhoods:['Vila do Centr0','Nova V1la','Altos do Nort3','Bairro Baix0','Jardim Byte'],
 roads:['Avenida Centr4l','Rua da Estaç4o','Alameda da Liberd4de','Travessa Princ1pal','Via do P0rto','Avenida dos Jardyns','Rua Nova.exe','Estrada do V3lho']
};
function locality(city,kind){
 const c=city&&typeof city==='object'?city:null;
 if(!c)return [];
 const category=kind==='roads'?'roads':kind==='neighborhoods'?'neighborhoods':'districts';
 const explicit=localDatasets[c.id]?.[category];
 if(explicit)return explicit.map(([name,real,lat,lng])=>({name,real,lat,lng,kind:category,approximate:true}));
 const patterns=urbanFallback[category];
 return patterns.map((base,i)=>{
  const [north,east]=offsets[i%offsets.length];
  const lat=c.lat+north/111.32;
  const lng=c.lng+east/(111.32*Math.max(.25,Math.cos(c.lat*Math.PI/180)));
  return {name:base+' · '+aliasCity(c),real:'GERADO',lat,lng,kind:category,approximate:true};
 });
}
const lookupCountry=(city)=>aliasCountry(countryOf(city));
const countryList=(countries)=>countries.map(([real,lat,lng])=>({real,name:aliasCountry(real),lat,lng}));
window.DCX=window.DCX||{};
window.DCX.AtlasLexicon={aliasCity,aliasCountry,countryOf,countryList,lookupCountry,locality,cityPairs,source:'PARÓDIA CARTOGRÁFICA DCX'};
})();