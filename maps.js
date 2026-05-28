'use strict';

/**
 * Adventure definitions for Dungeons, Dice & Danger.
 */
const ADVENTURES = {
  animals:   buildAnimals(),
  cultists:  buildCultists(),
  pyramid:   buildPyramid(),
  dinosaurs: buildDinosaurs(),
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function buildSpaces(rawSpaces) {
  const spaces = {};
  for (const s of rawSpaces) {
    spaces[s.id] = { id:s.id, value:s.value, type:s.type, unlocks:s.unlocks||null, adj:[] };
  }
  for (const s of rawSpaces) {
    for (const nbr of (s.connects || [])) {
      if (nbr === s.id) continue; // skip self-references
      if (!spaces[s.id].adj.includes(nbr)) spaces[s.id].adj.push(nbr);
      if (spaces[nbr] && !spaces[nbr].adj.includes(s.id)) spaces[nbr].adj.push(s.id);
    }
  }
  return spaces;
}

function autoLayout(spaces, fixedNodes) {
  const layout = new DungeonLayout({ iterations: 400 });
  return layout.calculate(spaces, fixedNodes);
}

// ─── Annoyed Animals ──────────────────────────────────────────────────────────

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
    '15':{x:572, y:322},
    '49':{x:522, y:214},
    '50':{x:610, y:215},
    '54':{x:684, y:316},
    '69':{x:441, y:316},
    '30':{x:601, y:426},
    '47':{x:490, y:141},
    '48':{x:587, y:134},
    '46':{x:479, y:72},
    '19':{x:553, y:54},
    '45':{x:405, y:70},
    '44':{x:376, y:164},
    '12':{x:297, y:114},
    '32':{x:234, y:49},
    '40':{x:140, y:74},
    '22':{x:417, y:231},
    '38':{x:348, y:248},
    '1': {x:36,  y:40},
    '2': {x:40,  y:120},
    '68':{x:366, y:323},
    '33':{x:289, y:317},
    '67':{x:265, y:235},
    '41':{x:196, y:211},
    '37':{x:154, y:142},
    '14':{x:144, y:324},
    '66':{x:234, y:353},
    '65':{x:249, y:423},
    '43':{x:129, y:454},
    '3': {x:42,  y:194},
    '4': {x:46,  y:271},
    '5': {x:41,  y:347},
    '6': {x:30,  y:435},
    '42':{x:30,  y:529},
    '70':{x:696, y:129},
    '20':{x:654, y:52},
    '28':{x:742, y:60},
    '13':{x:798, y:149},
    '52':{x:870, y:60},
    '53':{x:897, y:153},
    '34':{x:693, y:221},
    '51':{x:812, y:242},
    '21':{x:884, y:266},
    '7': {x:965, y:34},
    '8': {x:964, y:112},
    '9': {x:965, y:186},
    '10':{x:964, y:255},
    '11':{x:961, y:328},
    '39':{x:775, y:337},
    '26':{x:860, y:355},
    '35':{x:927, y:422},
    '56':{x:872, y:480},
    '55':{x:758, y:435},
    '57':{x:954, y:547},
    '29':{x:962, y:638},
    '58':{x:779, y:522},
    '59':{x:752, y:617},
    '18':{x:851, y:599},
    '60':{x:633, y:631},
    '17':{x:552, y:532},
    '61':{x:465, y:578},
    '62':{x:468, y:456},
    '63':{x:355, y:425},
    '16':{x:382, y:515},
    '64':{x:365, y:620},
    '36':{x:274, y:495},
    '25':{x:286, y:570},
    '31':{x:212, y:638},
    '27':{x:154, y:529},
    '23':{x:129, y:629},
    '24':{x:34,  y:636},
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

// ─── Clumsy Cultists ──────────────────────────────────────────────────────────

function buildCultists() {
  const rawSpaces = [
    // Monster rooms (IDs 1–7)
    {id:'1', value:null, type:'monster', connects:[]},
    {id:'2', value:null, type:'monster', connects:[]},
    {id:'3', value:null, type:'monster', connects:[]},
    {id:'4', value:null, type:'monster', connects:[]},
    {id:'5', value:null, type:'monster', connects:[]},
    {id:'6', value:null, type:'monster', connects:[]},
    {id:'7', value:null, type:'monster', connects:[]},
    // Start spaces (right cluster: 8–12, left cluster: 13–18)
    {id:'8',  value:10, type:'start',   connects:['40','9']},
    {id:'9',  value:8,  type:'start',   connects:['40','8','10','64']},
    {id:'10', value:7,  type:'start',   connects:['9','64','11']},
    {id:'11', value:4,  type:'start',   connects:['10','12','63']},
    {id:'12', value:2,  type:'start',   connects:['11','63','62']},
    {id:'13', value:5,  type:'start',   connects:['44','30','14']},
    {id:'14', value:9,  type:'start',   connects:['13','45','15']},
    {id:'15', value:3,  type:'start',   connects:['14','16','45']},
    {id:'16', value:11, type:'start',   connects:['15','17','36']},
    {id:'17', value:6,  type:'start',   connects:['16','36','18','35']},
    {id:'18', value:12, type:'start',   connects:['17','35']},
    // Chest spaces
    {id:'19', value:3,  type:'chest',   connects:['41','42']},
    {id:'20', value:11, type:'chest',   connects:['35','46']},
    // Gem spaces
    {id:'21', value:2,  type:'gem',     connects:['33']},
    {id:'22', value:12, type:'gem',     connects:['33']},
    {id:'23', value:2,  type:'gem',     connects:['47','24']},
    {id:'24', value:12, type:'gem',     connects:['23','47']},
    {id:'25', value:12, type:'gem',     connects:['37','53']},
    {id:'26', value:2,  type:'gem',     connects:['37','57']},
    // Gold spaces
    {id:'27', value:12, type:'gold',    connects:['61','60']},
    {id:'28', value:3,  type:'gold',    connects:['61','66','39']},
    {id:'29', value:11, type:'gold',    connects:['39']},
    {id:'30', value:10, type:'gold',    connects:['44','13','14','34']},
    {id:'31', value:11, type:'gold',    connects:['36','46','48']},
    {id:'32', value:3,  type:'gold',    connects:['51','52','53']},
    // Rubble spaces (space 33's CSV value was 33 — clearly a data entry error; correct value is 3)
    {id:'33', value:3,  type:'rubble',  connects:['21','43','22']},
    {id:'34', value:8,  type:'rubble',  connects:['30','68']},
    {id:'35', value:5,  type:'rubble',  connects:['18','17','36','20']},
    {id:'36', value:12, type:'rubble',  connects:['16','17','35','46','31']},
    {id:'37', value:7,  type:'rubble',  connects:['54','53','25','26']},
    {id:'38', value:6,  type:'rubble',  connects:['59','61','66','67']},
    {id:'39', value:4,  type:'rubble',  connects:['28','29','62','63']},
    // Regular and doubles spaces
    {id:'40', value:7,   type:'regular', connects:['1','8','9']},
    {id:'41', value:10,  type:'regular', connects:['1','19','42']},
    {id:'42', value:11,  type:'regular', connects:['41','19','3']},
    {id:'43', value:5,   type:'regular', connects:['3','33']},
    {id:'44', value:null,type:'doubles', connects:['3','13','30']},
    {id:'45', value:2,   type:'regular', connects:['14','15','4'], unlocks:'4'},
    {id:'46', value:9,   type:'regular', connects:['20','36','31','47']},
    {id:'47', value:4,   type:'regular', connects:['46','23','24','48']},
    {id:'48', value:10,  type:'regular', connects:['47','31','7'],        unlocks:'7'},
    {id:'49', value:8,   type:'regular', connects:['7','54','51'],       unlocks:'7'},
    {id:'50', value:5,   type:'regular', connects:['7','49','54','51'],  unlocks:'7'},
    {id:'51', value:4,   type:'regular', connects:['50','32']},
    {id:'52', value:6,   type:'regular', connects:['32','6','53']},
    {id:'53', value:11,  type:'regular', connects:['32','52','25','37']},
    {id:'54', value:null,type:'doubles', connects:['50','49','37','55']},
    {id:'55', value:4,   type:'regular', connects:['49','54','56']},
    {id:'56', value:null,type:'doubles', connects:['58','55','57']},
    {id:'57', value:6,   type:'regular', connects:['56','26','5'],       unlocks:'5'},
    {id:'58', value:3,   type:'regular', connects:['4','56']},
    {id:'59', value:5,   type:'regular', connects:['38','5'],            unlocks:'5'},
    {id:'60', value:7,   type:'regular', connects:['5','27','61'],       unlocks:'5'},
    {id:'61', value:8,   type:'regular', connects:['60','27','28','38']},
    {id:'62', value:null,type:'doubles', connects:['12','63','39']},
    {id:'63', value:6,   type:'regular', connects:['11','12','62','39'], unlocks:'2'},
    {id:'64', value:3,   type:'regular', connects:['9','10','2'],        unlocks:'2'},
    {id:'65', value:4,   type:'regular', connects:['2','67','66']},
    {id:'66', value:11,  type:'regular', connects:['65','67','38','28']},
    {id:'67', value:null,type:'doubles', connects:['65','66','38','68']},
    {id:'68', value:7,   type:'regular', connects:['34','67','4'],       unlocks:'4'},
  ];

  const spaces = buildSpaces(rawSpaces);

  const monsters = {
    '1': {id:'1', name:'Forlorn Phantom',        hp:4,  isBoss:false, isArmored:false, black:[3,9],    white:[],      gemFirst:3, gemSub:1, lifeLoss:0},
    '2': {id:'2', name:'Necro Mancer',            hp:4,  isBoss:false, isArmored:false, black:[],       white:[3,6],   gemFirst:2, gemSub:1, lifeLoss:1},
    '3': {id:'3', name:'Sickly Spector',          hp:4,  isBoss:false, isArmored:false, black:[4,8],    white:[],      gemFirst:3, gemSub:1, lifeLoss:0},
    '4': {id:'4', name:'Pastry Mancer',           hp:5,  isBoss:false, isArmored:false, black:[],       white:[2,7],   gemFirst:2, gemSub:1, lifeLoss:1},
    '5': {id:'5', name:'Ghastly Warden',          hp:5,  isBoss:false, isArmored:false, black:[],       white:[5,6,7], gemFirst:3, gemSub:1, lifeLoss:0},
    '6': {id:'6', name:'Sir Phish the Rank',      hp:4,  isBoss:false, isArmored:false, black:[4,9],    white:[],      gemFirst:3, gemSub:1, lifeLoss:0},
    '7': {id:'7', name:'Derek the Observer',      hp:12, isBoss:true,  isArmored:false, black:[],       white:[5,8,10],gemFirst:6, gemSub:0, lifeLoss:2},
  };

  const nodes = {
    '1': {x:43,  y:123},
    '2': {x:212, y:322},
    '3': {x:193, y:65},
    '4': {x:491, y:308},
    '5': {x:399, y:622},
    '6': {x:962, y:635},
    '7': {x:866, y:359},
    '8': {x:31,  y:320},
    '9': {x:105, y:320},
    '10':{x:51,  y:391},
    '11':{x:66,  y:503},
    '12':{x:51,  y:589},
    '13':{x:386, y:64},
    '14':{x:456, y:65},
    '15':{x:519, y:46},
    '16':{x:578, y:61},
    '17':{x:567, y:123},
    '18':{x:639, y:143},
    '19':{x:40,  y:48},
    '20':{x:856, y:126},
    '21':{x:147, y:271},
    '22':{x:101, y:208},
    '23':{x:970, y:28},
    '24':{x:971, y:93},
    '25':{x:734, y:635},
    '26':{x:650, y:631},
    '27':{x:241, y:621},
    '28':{x:193, y:405},
    '29':{x:188, y:571},
    '30':{x:355, y:161},
    '31':{x:620, y:224},
    '32':{x:934, y:555},
    '33':{x:172, y:204},
    '34':{x:384, y:257},
    '35':{x:729, y:83},
    '36':{x:650, y:43},
    '37':{x:814, y:570},
    '38':{x:341, y:508},
    '39':{x:189, y:493},
    '40':{x:33,  y:214},
    '41':{x:115, y:133},
    '42':{x:113, y:61},
    '43':{x:197, y:132},
    '44':{x:314, y:60},
    '45':{x:509, y:226},
    '46':{x:797, y:42},
    '47':{x:903, y:34},
    '48':{x:963, y:228},
    '49':{x:801, y:450},
    '50':{x:964, y:395},
    '51':{x:957, y:481},
    '52':{x:883, y:644},
    '53':{x:809, y:640},
    '54':{x:725, y:393},
    '55':{x:706, y:294},
    '56':{x:646, y:478},
    '57':{x:521, y:607},
    '58':{x:606, y:379},
    '59':{x:476, y:507},
    '60':{x:308, y:600},
    '61':{x:266, y:537},
    '62':{x:111, y:636},
    '63':{x:129, y:521},
    '64':{x:127, y:396},
    '65':{x:296, y:301},
    '66':{x:253, y:386},
    '67':{x:392, y:393},
    '68':{x:475, y:401},
  };

  return {
    key:'cultists', name:'Clumsy Cultists', difficulty:'Easy', color:'#9b59b6',
    spaces, monsters, nodes,
    achievements: {
      bothMancers: {label:'Defeat Pastry Mancer & Necro Mancer', done:false, gemFirst:3, gemSub:1, type:'set', threshold:2},
      rubble6of7:  {label:'6 of 7 Rubble spaces', count:0, threshold:6, total:7, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}

// ─── Puzzled Pyramid ──────────────────────────────────────────────────────────

function buildPyramid() {
  const rawSpaces = [
    // Start spaces (four entry clusters)
    {id:'1',  value:5,  type:'start',   connects:['2','37']},
    {id:'2',  value:3,  type:'start',   connects:['3','1','37','38']},
    {id:'3',  value:11, type:'start',   connects:['2','38','4']},
    {id:'4',  value:8,  type:'start',   connects:['3','38']},
    {id:'5',  value:7,  type:'start',   connects:['41','6']},
    {id:'6',  value:10, type:'start',   connects:['5','7','41']},
    {id:'7',  value:4,  type:'start',   connects:['6','40']},
    {id:'8',  value:9,  type:'start',   connects:['42','9']},
    {id:'9',  value:6,  type:'start',   connects:['8','42','20']},
    {id:'10', value:12, type:'start',   connects:['48']},
    {id:'11', value:2,  type:'start',   connects:['48']},
    // Gem spaces
    {id:'12', value:2,  type:'gem',     connects:['68']},
    {id:'13', value:12, type:'gem',     connects:['48','30','14']},
    {id:'14', value:2,  type:'gem',     connects:['13','30','49']},
    {id:'15', value:2,  type:'gem',     connects:['23','70']},
    {id:'16', value:12, type:'gem',     connects:['72']},
    {id:'17', value:12, type:'gem',     connects:['73']},
    {id:'18', value:12, type:'gem',     connects:['44','45','19']},
    {id:'19', value:2,  type:'gem',     connects:['18','34']},
    // Gold spaces
    {id:'20', value:4,  type:'gold',    connects:['9','41','43']},
    {id:'21', value:5,  type:'gold',    connects:['46','47','29']},
    {id:'22', value:3,  type:'gold',    connects:['30','52']},
    {id:'23', value:11, type:'gold',    connects:['53','15']},
    {id:'24', value:9,  type:'gold',    connects:['58','32','71']},
    {id:'25', value:10, type:'gold',    connects:['37','64']},
    // Chest spaces
    {id:'26', value:11, type:'chest',   connects:['19','47','34']},
    {id:'27', value:3,  type:'chest',   connects:['73','63','35']},
    // Cloud spaces — player assigns numbers 3,4,5,6,8,9,10,11 to spaces 28–35
    {id:'28', value:null, type:'cloud', connects:['40','45']},
    {id:'29', value:null, type:'cloud', connects:['21','49','50']},
    {id:'30', value:null, type:'cloud', connects:['48','13','14','22']},
    {id:'31', value:null, type:'cloud', connects:['70','54']},
    {id:'32', value:null, type:'cloud', connects:['60','58','24','71']},
    {id:'33', value:null, type:'cloud', connects:['61','59','58']},
    {id:'34', value:null, type:'cloud', connects:['66','67','19','26']},
    {id:'35', value:null, type:'cloud', connects:['63','65','27','62']},
    // Space 36: fixed cloud (always 11); visiting it auto-unlocks the blank gateway (37)
    {id:'36', value:11,  type:'cloud',  connects:['37']},
    // Space 37: blank gateway cloud — no number, auto-visited when cloud-11 is reached
    {id:'37', value:null, type:'cloud', connects:['56']},
    // Regular and doubles spaces
    {id:'38', value:6,   type:'regular', connects:['2','3','4','73']},
    {id:'39', value:null,type:'doubles', connects:['1','2','25','75']},
    {id:'40', value:6,   type:'regular', connects:['28','7']},
    {id:'41', value:9,   type:'regular', connects:['5','6','9','20']},
    {id:'42', value:10,  type:'regular', connects:['8','9','68'],       unlocks:'68'},
    {id:'43', value:8,   type:'regular', connects:['20','44','68']},
    {id:'44', value:null,type:'doubles', connects:['43','45','18']},
    {id:'45', value:3,   type:'regular', connects:['28','44','18','36']},
    {id:'46', value:7,   type:'regular', connects:['68','47','21']},
    {id:'47', value:8,   type:'regular', connects:['46','21','26']},
    {id:'48', value:11,  type:'regular', connects:['10','11','30','13']},
    {id:'49', value:9,   type:'regular', connects:['14','29','51','50']},
    {id:'50', value:8,   type:'regular', connects:['49','51','74']},
    {id:'51', value:null,type:'doubles', connects:['49','50','70']},
    {id:'52', value:10,  type:'regular', connects:['22','70']},
    {id:'53', value:6,   type:'regular', connects:['69','23']},
    {id:'54', value:11,  type:'regular', connects:['31','55','56']},
    {id:'55', value:4,   type:'regular', connects:['54','56','57','74'], unlocks:'74'},
    {id:'56', value:7,   type:'regular', connects:['37','57','55','54']},
    {id:'57', value:null,type:'doubles', connects:['55','56','71']},
    {id:'58', value:5,   type:'regular', connects:['32','24','33','59']},
    {id:'59', value:null,type:'doubles', connects:['60','58','33','61']},
    {id:'60', value:10,  type:'regular', connects:['74','32','59'],     unlocks:'74'},
    {id:'61', value:6,   type:'regular', connects:['72','59','33']},
    {id:'62', value:10,  type:'regular', connects:['35','65','72']},
    {id:'63', value:7,   type:'regular', connects:['35','27','73']},
    {id:'64', value:8,   type:'regular', connects:['25','75','36']},
    {id:'65', value:4,   type:'regular', connects:['35','62','66']},
    {id:'66', value:9,   type:'regular', connects:['65','67','34']},
    {id:'67', value:7,   type:'regular', connects:['66','34','74']},
    // Monster rooms (68–74)
    {id:'68', value:null, type:'monster', connects:[]},
    {id:'69', value:null, type:'monster', connects:[]},
    {id:'70', value:6,    type:'worm',    connects:[]},  // Sandy's Gut
    {id:'71', value:8,    type:'worm',    connects:[]},  // Sandy's Spine-y
    {id:'72', value:5,    type:'worm',    connects:[]},  // Sandy's Tail
    {id:'73', value:null, type:'monster', connects:[]},
    {id:'74', value:null, type:'monster', connects:[]},
    // Space 75
    {id:'75', value:4,   type:'regular', connects:['39','64'],          unlocks:'73'},
  ];

  const spaces = buildSpaces(rawSpaces);

  const monsters = {
    '68': {id:'68', name:'Sphinx',          hp:5,  isBoss:false, isArmored:false, black:[5],    white:[10],  gemFirst:3, gemSub:1, lifeLoss:0},
    '69': {id:'69', name:'Ankh',            hp:5,  isBoss:false, isArmored:false, black:[2,5,9],white:[],    gemFirst:3, gemSub:1, lifeLoss:0},
    '73': {id:'73', name:'Horus',           hp:5,  isBoss:false, isArmored:false, black:[9],    white:[4],   gemFirst:3, gemSub:1, lifeLoss:0},
    '74': {id:'74', name:'Sandy',           hp:21, isBoss:true,  isArmored:false, black:[3,11], white:[4,10],gemFirst:9, gemSub:0, lifeLoss:2},
  };

  const nodes = autoLayout(spaces, {
    '74': {x:500, y:340},
    '1':  {x:100, y:90},
    '4':  {x:100, y:330},
    '5':  {x:100, y:560},
    '10': {x:900, y:90},
    '8':  {x:900, y:540},
  });

  return {
    key:'pyramid', name:'Puzzled Pyramid', difficulty:'Standard', color:'#f1c40f',
    spaces, monsters, nodes,
    cloudPoolIds: ['28','29','30','31','32','33','34','35'],
    achievements: {
      allClouds: {label:'All 8 Cloud spaces', count:0, threshold:8, total:8, done:false, gemFirst:3, gemSub:1, type:'count'},
      allWorms:  {label:'All 3 Worm spaces',  count:0, threshold:3, total:3, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}

// ─── Defiant Dinosaurs ────────────────────────────────────────────────────────

function buildDinosaurs() {
  const rawSpaces = [
    // Monster rooms (IDs 1–9)
    {id:'1', value:null, type:'monster', connects:[]},
    {id:'2', value:null, type:'monster', connects:[]},
    {id:'3', value:null, type:'monster', connects:[]},
    {id:'4', value:null, type:'monster', connects:[]},
    {id:'5', value:null, type:'monster', connects:[]},
    {id:'6', value:null, type:'monster', connects:[]},
    {id:'7', value:null, type:'monster', connects:[]},
    {id:'8', value:null, type:'monster', connects:[]},
    {id:'9', value:null, type:'monster', connects:[]},
    // Start spaces
    {id:'10', value:11, type:'start',   connects:['34']},
    {id:'11', value:5,  type:'start',   connects:['21','74','12']},
    {id:'12', value:9,  type:'start',   connects:['11','46','13']},
    {id:'13', value:7,  type:'start',   connects:['12','47','14']},
    {id:'14', value:6,  type:'start',   connects:['13','47','15']},
    {id:'15', value:8,  type:'start',   connects:['14','16','62']},
    {id:'16', value:3,  type:'start',   connects:['15','62']},
    {id:'17', value:4,  type:'start',   connects:['28','60','18']},
    {id:'18', value:10, type:'start',   connects:['17','60','59']},
    {id:'65', value:2,  type:'start',   connects:['66','53']},
    {id:'66', value:12, type:'start',   connects:['65','53']},
    // Chest spaces
    {id:'19', value:3,  type:'chest',   connects:['36','35']},
    {id:'20', value:3,  type:'chest',   connects:['22','58']},
    // Gem spaces
    {id:'21', value:2,  type:'gem',     connects:['69','11']},
    {id:'22', value:12, type:'gem',     connects:['73','58','20']},
    {id:'23', value:2,  type:'gem',     connects:['1','2']},
    {id:'24', value:12, type:'gem',     connects:['38','68']},
    {id:'25', value:12, type:'gem',     connects:['26']},
    {id:'26', value:2,  type:'gem',     connects:['25','5']},
    {id:'27', value:2,  type:'gem',     connects:['68','41','42']},
    // Gold spaces
    {id:'28', value:11, type:'gold',    connects:['61','6','60','17']},
    {id:'29', value:3,  type:'gold',    connects:['2','3']},
    {id:'30', value:11, type:'gold',    connects:['1','38']},
    {id:'31', value:11, type:'gold',    connects:['44']},
    {id:'32', value:10, type:'gold',    connects:['50','71']},
    {id:'33', value:4,  type:'gold',    connects:['64','71']},
    // Regular spaces
    {id:'34', value:3,   type:'regular', connects:['10','35','3']},
    {id:'35', value:5,   type:'regular', connects:['19','3','34']},
    {id:'36', value:null,type:'doubles', connects:['1','19']},
    {id:'37', value:9,   type:'regular', connects:['1','3']},
    {id:'38', value:10,  type:'regular', connects:['30','24','39']},
    {id:'39', value:7,   type:'regular', connects:['38','40','68']},
    {id:'40', value:9,   type:'regular', connects:['68','39','41','44']},
    {id:'41', value:8,   type:'regular', connects:['27','42','44','40']},
    {id:'42', value:6,   type:'regular', connects:['27','43','41']},
    {id:'43', value:7,   type:'regular', connects:['42','44','9']},
    {id:'44', value:4,   type:'regular', connects:['41','43','40','31']},
    {id:'45', value:4,   type:'regular', connects:['2','46']},
    {id:'46', value:null,type:'doubles', connects:['45','12']},
    {id:'47', value:9,   type:'regular', connects:['48','49','13','14']},
    {id:'48', value:7,   type:'regular', connects:['8','49','47']},
    {id:'49', value:10,  type:'regular', connects:['8','48','47']},
    {id:'50', value:null,type:'doubles', connects:['8','32']},
    {id:'51', value:4,   type:'regular', connects:['9','52']},
    {id:'52', value:9,   type:'regular', connects:['51','53','54']},
    {id:'53', value:3,   type:'regular', connects:['65','66','52']},
    {id:'54', value:5,   type:'regular', connects:['52','72','55']},
    {id:'55', value:7,   type:'regular', connects:['54','5','56']},
    {id:'56', value:null,type:'doubles', connects:['55','72','6']},
    {id:'57', value:5,   type:'regular', connects:['5','4']},
    {id:'58', value:null,type:'doubles', connects:['4','20','22','73']},
    {id:'59', value:12,  type:'regular', connects:['6','60','18']},
    {id:'60', value:5,   type:'regular', connects:['6','59','18','17','28']},
    {id:'61', value:8,   type:'regular', connects:['7','28','62','63']},
    {id:'62', value:10,  type:'regular', connects:['63','61','16','15']},
    {id:'63', value:5,   type:'regular', connects:['7','61','62']},
    {id:'64', value:null,type:'doubles', connects:['33','7']},
    {id:'74', value:6,   type:'regular', connects:['3','11']},
    // Claw spaces (visiting unlocks matching white numbers for all monsters)
    {id:'67', value:6,  type:'claw',    connects:['24','27']},
    {id:'68', value:5,  type:'claw',    connects:['39','40','2']},
    {id:'69', value:7,  type:'claw',    connects:['3','21']},
    {id:'70', value:4,  type:'claw',    connects:['14','15','47','49','63','62']},
    {id:'71', value:9,  type:'claw',    connects:['32','33']},
    {id:'72', value:10, type:'claw',    connects:['54','56']},
    {id:'73', value:8,  type:'claw',    connects:['18','58','22']},
  ];

  const spaces = buildSpaces(rawSpaces);

  // Monsters 6, 7, 8 are Armored: require both dice pairs to deal damage
  const monsters = {
    '1': {id:'1', name:'Velo Cam',      hp:3,  isBoss:false, isArmored:false, black:[8],     white:[],       gemFirst:2, gemSub:1, lifeLoss:0},
    '2': {id:'2', name:'Velo Sam',      hp:3,  isBoss:false, isArmored:false, black:[8],     white:[],       gemFirst:2, gemSub:1, lifeLoss:0},
    '3': {id:'3', name:'Velo Rici',     hp:3,  isBoss:false, isArmored:false, black:[8],     white:[],       gemFirst:2, gemSub:1, lifeLoss:0},
    '4': {id:'4', name:'Orville',       hp:3,  isBoss:false, isArmored:false, black:[10,11], white:[],       gemFirst:2, gemSub:1, lifeLoss:0},
    '5': {id:'5', name:'Wilbur',        hp:3,  isBoss:false, isArmored:false, black:[10,12], white:[],       gemFirst:2, gemSub:1, lifeLoss:0},
    '6': {id:'6', name:'Mighty Meg',    hp:4,  isBoss:false, isArmored:true,  black:[7,9],   white:[4],      gemFirst:2, gemSub:1, lifeLoss:0},
    '7': {id:'7', name:'Tri Tip Tony',  hp:4,  isBoss:false, isArmored:true,  black:[3,6],   white:[7],      gemFirst:2, gemSub:1, lifeLoss:0},
    '8': {id:'8', name:'Hank the Tank', hp:4,  isBoss:false, isArmored:true,  black:[4,5],   white:[8],      gemFirst:2, gemSub:1, lifeLoss:0},
    '9': {id:'9', name:'King Rex',      hp:12, isBoss:true,  isArmored:false, black:[],      white:[5,6,9,10],gemFirst:6,gemSub:0, lifeLoss:2},
  };

  const nodes = autoLayout(spaces, {
    '9':  {x:500, y:330},
    '10': {x:100, y:200},
    '11': {x:900, y:90},
    '16': {x:900, y:390},
    '17': {x:850, y:570},
    '65': {x:100, y:530},
  });

  return {
    key:'dinosaurs', name:'Defiant Dinosaurs', difficulty:'Expert', color:'#e67e22',
    spaces, monsters, nodes,
    achievements: {
      armoredDinos: {label:'Defeat 3 Armored Dinosaurs', count:0, threshold:3, done:false, gemFirst:3, gemSub:1, type:'count'},
      claw6of7:     {label:'6 of 7 Claw spaces', count:0, threshold:6, total:7, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}
