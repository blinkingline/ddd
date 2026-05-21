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
    {id:'11', value:11, type:'start',   connects:['10','21','12']},
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
    {id:'30', value:8,  type:'fist',    connects:['59','60','17'], unlocks:'15'},
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
    // ── Landmarks (Monster Rooms) ────────────────────────────────────────────
    '15':{x:450, y:300}, // Boss: Beefy Bearpion (Central large room)
    '12':{x:300, y:100}, // Monster: Purple Pup
    '13':{x:600, y:150}, // Monster: Green Growler
    '14':{x:200, y:250}, // Monster: Grey Hound
    '16':{x:300, y:500}, // Monster: White Wolf
    '17':{x:450, y:450}, // Monster: Primal Hare
    '18':{x:650, y:450}, // Monster: Punk Hare

    // ── Left Start Cluster (Column 1) ────────────────────────────────────────
    '1': {x:150, y:100}, '2': {x:100, y:150}, '3': {x:50,  y:250},
    '4': {x:50,  y:350}, '5': {x:50,  y:450}, '6': {x:50,  y:500},

    // ── Right Start Cluster (Column 20ish) ───────────────────────────────────
    '7': {x:800, y:100}, '8': {x:850, y:150}, '9': {x:900, y:200},
    '10':{x:900, y:300}, '11':{x:850, y:350},

    // ── Top Left Quadrant (Purple Pup & Grey Hound Area) ─────────────────────
    '40':{x:200, y:100}, // regular, between start and monster 12
    '44':{x:250, y:50},  // regular, next to monster 12
    '37':{x:100, y:200}, // doubles, below start 2
    '41':{x:150, y:250}, // regular, between start 3 and monster 14
    '43':{x:100, y:350}, // regular, between start 4 and start 5
    '27':{x:150, y:450}, // fist, between start 5 and start 6
    '42':{x:100, y:450}, // regular, above start 6
    '66':{x:150, y:350}, // regular, below monster 14
    '19':{x:350, y:150}, // gem, next to monster 12
    '45':{x:300, y:150}, // regular, part of monster 12 cluster
    '46':{x:350, y:200}, // regular
    '47':{x:400, y:200}, // regular
    '49':{x:450, y:200}, // regular, above boss
    '22':{x:400, y:150}, // gem
    '38':{x:300, y:200}, // chest
    '33':{x:250, y:250}, // doubles, near monster 14
    '67':{x:200, y:200}, // regular, near monster 14
    '68':{x:300, y:300}, // regular, part of monster 15 transition
    '69':{x:350, y:350}, // regular, part of monster 15 transition
    '32':{x:400, y:50},  // fist, top island

    // ── Bottom Left Quadrant (White Wolf Area) ───────────────────────────────
    '65':{x:200, y:400}, // regular
    '36':{x:250, y:450}, // doubles
    '23':{x:150, y:500}, // gem
    '24':{x:200, y:500}, // gem
    '31':{x:300, y:550}, // fist, bottom left corner
    '25':{x:350, y:500}, // gem
    '64':{x:400, y:500}, // regular
    '63':{x:400, y:450}, // regular
    '62':{x:350, y:450}, // regular
    '61':{x:350, y:400}, // regular
    '16':{x:300, y:450}, // monster 16 itself has room at 300,450 now? No, monster room node is landmark.

    // ── Top Right Quadrant (Green Growler Area) ──────────────────────────────
    '52':{x:750, y:100}, // regular
    '53':{x:800, y:150}, // regular
    '70':{x:700, y:150}, // regular
    '20':{x:750, y:200}, // gem
    '28':{x:800, y:200}, // fist
    '48':{x:650, y:200}, // regular
    '50':{x:550, y:200}, // regular, above boss
    '34':{x:600, y:250}, // doubles
    '51':{x:700, y:250}, // regular
    '21':{x:750, y:300}, // gem

    // ── Bottom Right Quadrant (Punk Hare Area) ───────────────────────────────
    '39':{x:600, y:350}, // chest
    '26':{x:750, y:350}, // gem
    '54':{x:550, y:350}, // regular, below boss
    '55':{x:550, y:400}, // regular
    '56':{x:600, y:400}, // regular
    '57':{x:700, y:400}, // regular
    '35':{x:750, y:400}, // doubles
    '58':{x:600, y:450}, // regular
    '59':{x:650, y:500}, // regular
    '60':{x:700, y:500}, // regular
    '30':{x:750, y:500}, // fist
    '29':{x:750, y:550}, // fist
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
