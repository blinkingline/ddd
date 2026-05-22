'use strict';

/**
 * Adventure definitions for Dungeons, Dice & Danger.
 */
const ADVENTURES = {
  animals: buildAnimals(),
  cultists: buildCultists(),
  pyramid: buildPyramid(),
  dinosaurs: buildDinosaurs(),
};

function buildAnimals() {
  const rawSpaces = [
    // ── Start spaces ──────────────────────────────────────────────────────────
    {id:'1',  value:2,  type:'start',   connects:['2','40']},
    {id:'2',  value:9,  type:'start',   connects:['3','40']},
    {id:'3',  value:6,  type:'start',   connects:['37','41','4']},
    {id:'4',  value:7,  type:'start',   connects:['3','41','5']},
    {id:'5',  value:3,  type:'start',   connects:['4','43','6']},
    {id:'6',  value:12, type:'start',   connects:['5','42']},
    {id:'7',  value:4,  type:'start',   connects:['8','52']},
    {id:'8',  value:5,  type:'start',   connects:['7','53','9']},
    {id:'9',  value:8,  type:'start',   connects:['8','53','10']},
    {id:'10', value:10, type:'start',   connects:['21','9','11']},
    {id:'11', value:11, type:'start',   connects:['10','21','26']},
    // ── Monster rooms ────────────────────────────────────────────────────────
    {id:'12', value:null, type:'monster', connects:[]},
    {id:'13', value:null, type:'monster', connects:[]},
    {id:'14', value:null, type:'monster', connects:[]},
    {id:'15', value:null, type:'monster', connects:[]},
    {id:'16', value:null, type:'monster', connects:[]},
    {id:'17', value:null, type:'monster', connects:[]},
    {id:'18', value:null, type:'monster', connects:[]},
    // ── Gem spaces ────────────────────────────────────────────────────────────
    {id:'19', value:12, type:'gem',     connects:['46']},
    {id:'20', value:2,  type:'gem',     connects:['28','70']},
    {id:'21', value:2,  type:'gem',     connects:['51','10','11']},
    {id:'22', value:12, type:'gem',     connects:['38','49']},
    {id:'23', value:12, type:'gem',     connects:['27']},
    {id:'24', value:2,  type:'gem',     connects:['23','27']},
    {id:'25', value:2,  type:'gem',     connects:['31','64','36']},
    {id:'26', value:12, type:'gem',     connects:['11','39','35']},
    // ── Fist spaces ───────────────────────────────────────────────────────────
    {id:'27', value:4,  type:'fist',    connects:['42','43','23','24']},
    {id:'28', value:12, type:'fist',    connects:['20']},
    {id:'29', value:2,  type:'fist',    connects:['57']},
    {id:'30', value:8,  type:'fist',    connects:['59','60','17','15'], unlocks:'15'},
    {id:'31', value:6,  type:'fist',    connects:['25']},
    {id:'32', value:10, type:'fist',    connects:['12']},
    // ── Doubles spaces ────────────────────────────────────────────────────────
    {id:'33', value:null, type:'doubles', connects:['67','38','68']},
    {id:'34', value:null, type:'doubles', connects:['50','51']},
    {id:'35', value:null, type:'doubles', connects:['26','56']},
    {id:'36', value:null, type:'doubles', connects:['25','65','63']},
    {id:'37', value:null, type:'doubles', connects:['3','44','41']},
    // ── Chest spaces ──────────────────────────────────────────────────────────
    {id:'38', value:11, type:'chest',   connects:['67','33','22']},
    {id:'39', value:3,  type:'chest',   connects:['26','54']},
    // ── Regular spaces ────────────────────────────────────────────────────────
    {id:'40', value:4,  type:'regular', connects:['1','2','12'],       unlocks:'12'},
    {id:'41', value:10, type:'regular', connects:['3','4','37','14'],  unlocks:'14'},
    {id:'42', value:5,  type:'regular', connects:['6','43','27']},
    {id:'43', value:6,  type:'regular', connects:['5','42','27','14'], unlocks:'14'},
    {id:'44', value:7,  type:'regular', connects:['12','37','45']},
    {id:'45', value:3,  type:'regular', connects:['44','12','46'],     unlocks:'12'},
    {id:'46', value:10, type:'regular', connects:['45','19','47']},
    {id:'47', value:9,  type:'regular', connects:['46','49','48']},
    {id:'48', value:6,  type:'regular', connects:['47','50','70']},
    {id:'49', value:3,  type:'regular', connects:['22','47','15'],     unlocks:'15'},
    {id:'50', value:11, type:'regular', connects:['48','34','15'],     unlocks:'15'},
    {id:'51', value:7,  type:'regular', connects:['34','13','21']},
    {id:'52', value:3,  type:'regular', connects:['7','13'],           unlocks:'13'},
    {id:'53', value:9,  type:'regular', connects:['13','8','9'],       unlocks:'13'},
    {id:'54', value:4,  type:'regular', connects:['39','55','15'],     unlocks:'15'},
    {id:'55', value:7,  type:'regular', connects:['54','58','56']},
    {id:'56', value:9,  type:'regular', connects:['35','55','57']},
    {id:'57', value:8,  type:'regular', connects:['56','18','29']},
    {id:'58', value:9,  type:'regular', connects:['55','59','18']},
    {id:'59', value:10, type:'regular', connects:['58','18','60']},
    {id:'60', value:6,  type:'regular', connects:['30','59','17']},
    {id:'61', value:7,  type:'regular', connects:['62','17']},
    {id:'62', value:8,  type:'regular', connects:['63','16','61'],     unlocks:'16'},
    {id:'63', value:6,  type:'regular', connects:['62','16','36']},
    {id:'64', value:5,  type:'regular', connects:['16','25'],          unlocks:'16'},
    {id:'65', value:7,  type:'regular', connects:['66','36']},
    {id:'66', value:5,  type:'regular', connects:['14','65']},
    {id:'67', value:9,  type:'regular', connects:['14','38','33']},
    {id:'68', value:10, type:'regular', connects:['33','69']},
    {id:'69', value:5,  type:'regular', connects:['68','15'],          unlocks:'15'},
    {id:'70', value:8,  type:'regular', connects:['20','13','48']},
  ];

  const spaces = {};
  for (const s of rawSpaces) {
    spaces[s.id] = { id:s.id, value:s.value, type:s.type, unlocks:s.unlocks||null, adj:[] };
  }
  for (const s of rawSpaces) {
    for (const nbr of s.connects) {
      if (!spaces[s.id].adj.includes(nbr)) spaces[s.id].adj.push(nbr);
      if (spaces[nbr] && !spaces[nbr].adj.includes(s.id)) spaces[nbr].adj.push(s.id);
    }
  }

  const monsters = {
    '12': {id:'12', name:'Purple Pup',     hp:4,  isBoss:false, isArmored:false, black:[11],   white:[3,4],        gemFirst:2, gemSub:1, lifeLoss:0},
    '13': {id:'13', name:'Green Growler',  hp:4,  isBoss:false, isArmored:false, black:[5],    white:[3,9],        gemFirst:2, gemSub:1, lifeLoss:0},
    '14': {id:'14', name:'Grey Hound',     hp:4,  isBoss:false, isArmored:false, black:[8],    white:[6,10],       gemFirst:2, gemSub:1, lifeLoss:0},
    '15': {id:'15', name:'Beefy Bearpion', hp:12, isBoss:true,  isArmored:false, black:[],     white:[3,4,5,8,11], gemFirst:6, gemSub:0, lifeLoss:2},
    '16': {id:'16', name:'White Wolf',     hp:5,  isBoss:false, isArmored:false, black:[4],    white:[5,8],        gemFirst:2, gemSub:1, lifeLoss:0},
    '17': {id:'17', name:'Primal Hare',    hp:5,  isBoss:false, isArmored:false, black:[2,12], white:[],           gemFirst:3, gemSub:1, lifeLoss:0},
    '18': {id:'18', name:'Punk Hare',      hp:5,  isBoss:false, isArmored:false, black:[3,11], white:[],           gemFirst:3, gemSub:1, lifeLoss:0},
  };

  const nodes = {
    // ── HUB: Beefy Bearpion ────────────────────────────────────────────────
    '15':{x:572, y:322},

    // ── 5 GATEWAY NODES (adjacent to boss) ────────────────────────────────
    '49':{x:522, y:214},  // NW gateway → unlocks boss
    '50':{x:610, y:215},  // NE gateway → unlocks boss
    '54':{x:684, y:316},  // E gateway  → unlocks boss
    '69':{x:441, y:316},  // W gateway  → unlocks boss
    '30':{x:601, y:426},  // S gateway (fist) → unlocks boss, adj Primal Hare

    // ── BRIDGE PAIR: top-center, connects NW arm ↔ NE arm ─────────────────
    '47':{x:490, y:141},  // connects 46, 49, 48
    '48':{x:587, y:134},  // connects 47, 50, 70

    // ── NW ARM: Purple Pup cluster ─────────────────────────────────────────
    '46':{x:479, y:72},
    '19':{x:553, y:54},   // gem dead-end
    '45':{x:405, y:70},
    '44':{x:376, y:164},
    '12':{x:297, y:114},  // Purple Pup
    '32':{x:234, y:49},   // fist → Purple Pup
    '40':{x:140, y:74},
    '22':{x:417, y:231},  // gem, bridges NW arm to W arm via 38
    '38':{x:348, y:248},  // chest, connects 67, 33, 22

    // ── LEFT STARTS (upper cluster) ────────────────────────────────────────
    '1': {x:36,  y:40},
    '2': {x:40,  y:120},

    // ── W ARM: Grey Hound cluster ──────────────────────────────────────────
    '68':{x:366, y:323},
    '33':{x:289, y:317},  // doubles
    '67':{x:265, y:235},
    '41':{x:196, y:211},
    '37':{x:154, y:142},  // doubles — bridges left-starts ↔ Purple Pup area
    '14':{x:144, y:324},  // Grey Hound
    '66':{x:234, y:353},
    '65':{x:249, y:423},
    '43':{x:129, y:454},

    // ── LEFT STARTS (middle and lower cluster) ─────────────────────────────
    '3': {x:42,  y:194},
    '4': {x:46,  y:271},
    '5': {x:41,  y:347},
    '6': {x:30,  y:435},
    '42':{x:30,  y:529},

    // ── NE ARM: Green Growler cluster ──────────────────────────────────────
    '70':{x:696, y:129},
    '20':{x:654, y:52},   // gem
    '28':{x:742, y:60},   // fist dead-end
    '13':{x:798, y:149},  // Green Growler
    '52':{x:870, y:60},
    '53':{x:897, y:153},
    '34':{x:693, y:221},  // doubles
    '51':{x:812, y:242},
    '21':{x:884, y:266},  // gem

    // ── RIGHT STARTS ───────────────────────────────────────────────────────
    '7': {x:965, y:34},
    '8': {x:964, y:112},
    '9': {x:965, y:186},
    '10':{x:964, y:255},
    '11':{x:961, y:328},

    // ── E ARM: right-side paths ────────────────────────────────────────────
    '39':{x:775, y:337},  // chest
    '26':{x:860, y:355},  // gem
    '35':{x:927, y:422},  // doubles
    '56':{x:872, y:480},
    '55':{x:758, y:435},
    '57':{x:954, y:547},
    '29':{x:962, y:638},  // fist dead-end

    // ── SE ARC: Punk Hare chain ────────────────────────────────────────────
    '58':{x:779, y:522},
    '59':{x:752, y:617},
    '18':{x:851, y:599},  // Punk Hare
    '60':{x:633, y:631},

    // ── S ARM: Primal Hare + White Wolf ────────────────────────────────────
    '17':{x:552, y:532},  // Primal Hare
    '61':{x:465, y:578},
    '62':{x:468, y:456},
    '63':{x:355, y:425},
    '16':{x:382, y:515},  // White Wolf
    '64':{x:365, y:620},
    '36':{x:274, y:495},  // doubles

    // ── LOWER-LEFT cluster ─────────────────────────────────────────────────
    '25':{x:286, y:570},  // gem
    '31':{x:212, y:638},  // fist
    '27':{x:154, y:529},  // fist
    '23':{x:129, y:629},  // gem
    '24':{x:34,  y:636},  // gem
  };

  return {
    key:'animals', name:'Annoyed Animals', difficulty:'Novice', color:'#7a9b5c',
    leftStarts:  ['1','2','3','4','5','6'],
    rightStarts: ['7','8','9','10','11'],
    spaces, monsters, nodes,
    achievements: {
      startsLinked: {label:'Connect both start clusters via visited path', done:false, gemFirst:1, gemSub:0, type:'path'},
      fist5of6:     {label:'5 of 6 Fist spaces', count:0, threshold:5, total:6, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}

function buildCultists() {
  // Placeholder skeleton for testing mechanics
  const rawSpaces = [
    {id:'1', value:2, type:'start', connects:['2','10']},
    {id:'2', value:12, type:'start', connects:['1','11']},
    {id:'10', value:3, type:'rubble', connects:['1','11','12']},
    {id:'11', value:4, type:'rubble', connects:['2','10','12']},
    {id:'12', value:null, type:'monster', connects:[]},
  ];
  const spaces = {};
  for (const s of rawSpaces) {
    spaces[s.id] = { id:s.id, value:s.value, type:s.type, unlocks:null, adj:[] };
  }
  for (const s of rawSpaces) {
    for (const nbr of s.connects) {
      if (!spaces[s.id].adj.includes(nbr)) spaces[s.id].adj.push(nbr);
      if (spaces[nbr] && !spaces[nbr].adj.includes(s.id)) spaces[nbr].adj.push(s.id);
    }
  }
  const monsters = {
    '12': {id:'12', name:'Pastry Mancer', hp:4, isBoss:false, isArmored:false, black:[2,12], white:[], gemFirst:2, gemSub:1, lifeLoss:0},
    '13': {id:'13', name:'Necro Mancer', hp:4, isBoss:false, isArmored:false, black:[7], white:[], gemFirst:2, gemSub:1, lifeLoss:0},
    '14': {id:'14', name:'Cult Leader', hp:10, isBoss:true, isArmored:false, black:[10], white:[], gemFirst:5, gemSub:2, lifeLoss:2},
  };
  const fixedNodes = {
    '1': {x:100, y:310}, '2': {x:900, y:310}, '14': {x:500, y:310}
  };
  const layout = new DungeonLayout();
  const nodes = layout.calculate(spaces, fixedNodes);

  return {
    key:'cultists', name:'Clumsy Cultists', difficulty:'Easy', color:'#9b59b6',
    spaces, monsters, nodes,
    achievements: {
      bothMancers: {label:'Defeat both Mancers', done:false, gemFirst:3, gemSub:1, type:'set', threshold:2},
      rubble6of7:  {label:'6 of 7 Rubble spaces', count:0, threshold:6, total:7, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}

function buildPyramid() {
  return { key:'pyramid', name:'Puzzled Pyramid', difficulty:'Standard', color:'#f1c40f', spaces:{}, monsters:{}, nodes:{}, achievements:{} };
}

function buildDinosaurs() {
  return { key:'dinosaurs', name:'Defiant Dinosaurs', difficulty:'Expert', color:'#e67e22', spaces:{}, monsters:{}, nodes:{}, achievements:{} };
}
