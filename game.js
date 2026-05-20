'use strict';

// ─── Utilities ────────────────────────────────────────────────────────────────

const d6 = () => Math.floor(Math.random() * 6) + 1;

function buildAdj(spaces, edges) {
  for (const id of Object.keys(spaces)) spaces[id].adj = [];
  for (const [a, b] of edges) { spaces[a].adj.push(b); spaces[b].adj.push(a); }
}

// Returns the 3 ways to split [d0,d1,d2,d3] into 2 pairs.
function pairSplits(w) {
  return [
    { t1: w[0]+w[1], t2: w[2]+w[3], d1:[w[0],w[1]], d2:[w[2],w[3]] },
    { t1: w[0]+w[2], t2: w[1]+w[3], d1:[w[0],w[2]], d2:[w[1],w[3]] },
    { t1: w[0]+w[3], t2: w[1]+w[2], d1:[w[0],w[3]], d2:[w[1],w[2]] },
  ];
}

// ─── Force-directed map layout ────────────────────────────────────────────────
// Runs once at load; returns updated node positions for non-monster spaces.
// Start spaces are pinned to the left/right edges; monster rooms are fixed
// attractors. All other nodes are pushed apart (repulsion) and pulled toward
// their graph neighbours (spring attraction) until the layout settles.

function forceLayout(spaces, nodes) {
  const W = 740, H = 485, PAD = 42;

  // Radius per node type
  const START_IDS = new Set(['1','2','3','4','5','6','7','8','9','10','11']);
  const rOf = id => START_IDS.has(id) ? 16 : 14;

  // Pinned positions for start spaces
  const PINS = {
    '1':{x:50,y:48},  '2':{x:50,y:116}, '3':{x:50,y:188},
    '4':{x:50,y:258}, '5':{x:50,y:330}, '6':{x:50,y:400},
    '7':{x:730,y:48}, '8':{x:730,y:130},'9':{x:730,y:215},
    '10':{x:730,y:296},'11':{x:730,y:376},
  };

  // Monster room positions as fixed attractors — derived from hand-placed nodes
  const MPOS = {};
  for (const [id, sp] of Object.entries(spaces)) {
    if (sp.type === 'monster') MPOS[id] = { x: nodes[id].x, y: nodes[id].y };
  }

  // Initialise mutable positions for non-monster spaces
  const pos = {};
  for (const [id, sp] of Object.entries(spaces)) {
    if (sp.type === 'monster') continue;
    pos[id] = { x: nodes[id].x, y: nodes[id].y };
  }
  Object.assign(pos, PINS);

  const ids = Object.keys(pos);

  // Precompute adjacency sets and edge list (non-redundant)
  const adjOf = {};
  const edgeList = [];
  const edgeSeen = new Set();
  for (const [id, sp] of Object.entries(spaces)) {
    if (!pos[id]) continue;
    adjOf[id] = new Set(sp.adj);
    for (const nbr of sp.adj) {
      const key = [id, nbr].sort().join('|');
      if (!edgeSeen.has(key)) { edgeSeen.add(key); edgeList.push([id, nbr]); }
    }
  }

  function clamp(id) {
    if (PINS[id]) return;
    // Inner bounds ensure non-start nodes stay ≥ 34px from left/right start nodes (x=50 and x=730)
    // and ≥ 36px from top start nodes (y=48), preventing corner-trap overlaps.
    pos[id].x = Math.max(84, Math.min(696, pos[id].x));
    pos[id].y = Math.max(84, Math.min(H - PAD, pos[id].y));
  }

  // ── Phase 1: spring simulation ─────────────────────────────────────────────
  for (let t = 0; t < 600; t++) {
    const fx = {}, fy = {};
    for (const id of ids) { fx[id] = 0; fy[id] = 0; }

    // Node–node repulsion (boosted when overlapping)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y;
        const d2 = dx*dx + dy*dy || 0.01, d = Math.sqrt(d2);
        const minD = rOf(a) + rOf(b);
        const f = d < minD ? 28000/d2 : 5500/d2;
        fx[a] -= f*dx/d; fy[a] -= f*dy/d;
        fx[b] += f*dx/d; fy[b] += f*dy/d;
      }
    }

    // Edge spring attraction (ideal length 78px)
    for (const [id, sp] of Object.entries(spaces)) {
      if (!pos[id]) continue;
      for (const nbr of sp.adj) {
        const np = pos[nbr] || MPOS[nbr];
        if (!np) continue;
        const dx = np.x - pos[id].x, dy = np.y - pos[id].y;
        const d = Math.sqrt(dx*dx + dy*dy) || 0.1;
        const f = 0.055 * (d - 78);
        if (!PINS[id]) { fx[id] += f*dx/d; fy[id] += f*dy/d; }
      }
    }

    const cool = Math.max(0.06, 1 - t / 560);
    for (const id of ids) {
      if (PINS[id]) { pos[id] = { ...PINS[id] }; continue; }
      pos[id].x += fx[id] * cool;
      pos[id].y += fy[id] * cool;
      clamp(id);
    }
  }

  // ── Phase 2: hard node–node separation (guaranteed no overlap) ─────────────
  for (let pass = 0; pass < 200; pass++) {
    let any = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        const minD = rOf(a) + rOf(b) + 2;
        if (d < minD) {
          any = true;
          const push = (minD - (d || 0.01)) / 2 + 0.5;
          // When nodes are at the same position, push along x axis to break the tie
          const ux = d > 0.001 ? dx/d : 1, uy = d > 0.001 ? dy/d : 0;
          if (!PINS[a]) { pos[a].x -= ux*push; pos[a].y -= uy*push; clamp(a); }
          if (!PINS[b]) { pos[b].x += ux*push; pos[b].y += uy*push; clamp(b); }
        }
      }
    }
    if (!any) break;
  }

  // ── Phase 3: push nodes off non-adjacent edges ─────────────────────────────
  for (let pass = 0; pass < 40; pass++) {
    let any = false;
    for (const id of ids) {
      if (PINS[id]) continue;
      const px = pos[id].x, py = pos[id].y;
      const aset = adjOf[id];
      for (const [ea, eb] of edgeList) {
        if (ea === id || eb === id || aset.has(ea) || aset.has(eb)) continue;
        const epA = pos[ea] || MPOS[ea], epB = pos[eb] || MPOS[eb];
        if (!epA || !epB) continue;
        // Bounding-box fast reject
        if (px < Math.min(epA.x, epB.x) - 20 || px > Math.max(epA.x, epB.x) + 20 ||
            py < Math.min(epA.y, epB.y) - 20 || py > Math.max(epA.y, epB.y) + 20) continue;
        // Point-to-segment distance
        const abx = epB.x-epA.x, aby = epB.y-epA.y, ab2 = abx*abx+aby*aby || 0.01;
        const tv = Math.max(0, Math.min(1, ((px-epA.x)*abx + (py-epA.y)*aby) / ab2));
        const ex = epA.x + tv*abx, ey = epA.y + tv*aby;
        const ddx = px - ex, ddy = py - ey;
        const dist = Math.sqrt(ddx*ddx + ddy*ddy) || 0.1;
        const clearance = rOf(id) + 4;
        if (dist < clearance) {
          any = true;
          const push = clearance - dist + 1;
          pos[id].x += push * ddx/dist;
          pos[id].y += push * ddy/dist;
          clamp(id);
        }
      }
    }
    if (!any) break;
  }

  // ── Phase 3.5: push nodes clear of non-adjacent monster rects ─────────────
  {
    const BOSS_ID = '15';
    const MARGIN = 8;
    const mRects = [];
    for (const [mid, sp] of Object.entries(spaces)) {
      if (sp.type !== 'monster') continue;
      const mp = MPOS[mid];
      if (!mp) continue;
      const hw = (mid === BOSS_ID ? 44 : 30) + MARGIN;
      const hh = (mid === BOSS_ID ? 31 : 23) + MARGIN;
      mRects.push({ id: mid, cx: mp.x, cy: mp.y, hw, hh });
    }
    for (let pass = 0; pass < 60; pass++) {
      let any = false;
      for (const id of ids) {
        if (PINS[id]) continue;
        const aset = adjOf[id];
        for (const { id: mid, cx, cy, hw, hh } of mRects) {
          if (aset.has(mid)) continue;
          const dx = pos[id].x - cx, dy = pos[id].y - cy;
          const ox = hw - Math.abs(dx), oy = hh - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            any = true;
            if (ox < oy) {
              pos[id].x += dx >= 0 ? ox + 1 : -(ox + 1);
            } else {
              pos[id].y += dy >= 0 ? oy + 1 : -(oy + 1);
            }
            clamp(id);
          }
        }
      }
      if (!any) break;
    }
  }

  // ── Phase 4: final hard separation after phase-3 moves ────────────────────
  for (let pass = 0; pass < 100; pass++) {
    let any = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        const minD = rOf(a) + rOf(b) + 2;
        if (d < minD) {
          any = true;
          const push = (minD - (d || 0.01)) / 2 + 0.5;
          // When nodes are at the same position, push along x axis to break the tie
          const ux = d > 0.001 ? dx/d : 1, uy = d > 0.001 ? dy/d : 0;
          if (!PINS[a]) { pos[a].x -= ux*push; pos[a].y -= uy*push; clamp(a); }
          if (!PINS[b]) { pos[b].x += ux*push; pos[b].y += uy*push; clamp(b); }
        }
      }
    }
    if (!any) break;
  }

  const result = {};
  for (const [id, p] of Object.entries(pos)) result[id] = { x: Math.round(p.x), y: Math.round(p.y) };
  return result;
}

// ─── Adventure Builder ────────────────────────────────────────────────────────

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
    // ── Monster rooms (IDs match space IDs in CSV) ────────────────────────────
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
    // ── Doubles spaces (any doubles roll, no specific value) ──────────────────
    {id:'33', value:null, type:'doubles', connects:['67','38','68']},
    {id:'34', value:null, type:'doubles', connects:['50','51']},
    {id:'35', value:null, type:'doubles', connects:['26','56']},
    {id:'36', value:null, type:'doubles', connects:['25','65','63']},
    {id:'37', value:null, type:'doubles', connects:['3','44','41']},
    // ── Chest spaces ──────────────────────────────────────────────────────────
    {id:'38', value:11, type:'chest',   connects:['67','33','22']},
    {id:'39', value:3,  type:'chest',   connects:['26','54']},
    // ── Regular spaces ────────────────────────────────────────────────────────
    // unlocks: visiting this space unlocks the white number equal to this
    // space's value for the specified monster
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

  // Build spaces dict and undirected adjacency from connects lists
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

  // Monster IDs match their monster-room space IDs.
  // white numbers are unlocked when an adjacent space with that value is visited.
  const monsters = {
    '12': {id:'12', name:'Purple Pup',     hp:4,  isBoss:false, isArmored:false, black:[11],   white:[3,4],        gemFirst:2, gemSub:1, lifeLoss:0},
    '13': {id:'13', name:'Green Growler',  hp:4,  isBoss:false, isArmored:false, black:[5],    white:[3,9],        gemFirst:2, gemSub:1, lifeLoss:0},
    '14': {id:'14', name:'Grey Hound',     hp:4,  isBoss:false, isArmored:false, black:[8],    white:[6,10],       gemFirst:2, gemSub:1, lifeLoss:0},
    '15': {id:'15', name:'Beefy Bearpion', hp:12, isBoss:true,  isArmored:false, black:[],     white:[3,4,5,8,11], gemFirst:6, gemSub:0, lifeLoss:2},
    '16': {id:'16', name:'White Wolf',     hp:5,  isBoss:false, isArmored:false, black:[4],    white:[5,8],        gemFirst:2, gemSub:1, lifeLoss:0},
    '17': {id:'17', name:'Primal Hare',    hp:5,  isBoss:false, isArmored:false, black:[2,12], white:[],           gemFirst:3, gemSub:1, lifeLoss:0},
    '18': {id:'18', name:'Punk Hare',      hp:5,  isBoss:false, isArmored:false, black:[3,11], white:[],           gemFirst:3, gemSub:1, lifeLoss:0},
  };

  // SVG node positions — all adjacent pairs verified ≥45px apart to prevent ring overlap
  const nodes = {
    // ── Left starts ───────────────────────────────────────────────────────────
    '1': {x:50,  y:55},   '2': {x:50,  y:130},  '3': {x:50,  y:205},
    '4': {x:50,  y:280},  '5': {x:50,  y:355},  '6': {x:50,  y:425},
    // ── Right starts ──────────────────────────────────────────────────────────
    '7': {x:740, y:55},   '8': {x:740, y:140},  '9': {x:740, y:225},
    '10':{x:740, y:310},  '11':{x:740, y:395},
    // ── Monster rooms ─────────────────────────────────────────────────────────
    '12':{x:210, y:80},   '13':{x:610, y:120},  '14':{x:175, y:280},
    '15':{x:390, y:285},  '16':{x:390, y:465},  '17':{x:660, y:455},  '18':{x:550, y:340},
    // ── Gem spaces ────────────────────────────────────────────────────────────
    '19':{x:350, y:75},   '20':{x:470, y:120},  '21':{x:680, y:275},
    '22':{x:305, y:135},  '23':{x:170, y:430},  '24':{x:225, y:455},
    '25':{x:335, y:445},  '26':{x:630, y:330},
    // ── Fist spaces ───────────────────────────────────────────────────────────
    '27':{x:190, y:360},  '28':{x:500, y:70},   '29':{x:495, y:215},
    '30':{x:705, y:370},  '31':{x:290, y:480},  '32':{x:155, y:48},
    // ── Doubles spaces ────────────────────────────────────────────────────────
    '33':{x:305, y:190},  '34':{x:508, y:268},  '35':{x:640, y:240},
    '36':{x:350, y:395},  '37':{x:125, y:175},
    // ── Chest spaces ──────────────────────────────────────────────────────────
    '38':{x:265, y:165},  '39':{x:505, y:310},
    // ── Regular spaces ────────────────────────────────────────────────────────
    '40':{x:130, y:88},   '41':{x:130, y:245},  '42':{x:120, y:390},
    '43':{x:130, y:330},  '44':{x:240, y:140},  '45':{x:295, y:95},
    '46':{x:350, y:130},  '47':{x:390, y:190},  '48':{x:450, y:200},
    '49':{x:330, y:230},  '50':{x:455, y:255},  '51':{x:580, y:200},
    '52':{x:675, y:75},   '53':{x:685, y:175},  '54':{x:460, y:320},
    '55':{x:510, y:370},  '56':{x:590, y:280},  '57':{x:548, y:240},
    '58':{x:595, y:395},  '59':{x:630, y:360},  '60':{x:670, y:400},
    '61':{x:615, y:440},  '62':{x:480, y:440},  '63':{x:420, y:420},
    '64':{x:465, y:490},  '65':{x:280, y:360},  '66':{x:235, y:315},
    '67':{x:250, y:220},  '68':{x:320, y:290},  '69':{x:355, y:345},
    '70':{x:530, y:155},
  };

  // Use hand-placed positions directly — force simulation was making layout worse
  const computedNodes = nodes;

  return {
    key:'animals', name:'Annoyed Animals', difficulty:'Novice', color:'#7a9b5c',
    leftStarts:  ['1','2','3','4','5','6'],
    rightStarts: ['7','8','9','10','11'],
    spaces, monsters, nodes: computedNodes,
    achievements: {
      startsLinked: {label:'Connect both start clusters via visited path', done:false, gemFirst:1, gemSub:0, type:'path'},
      fist5of6:     {label:'5 of 6 Fist spaces', count:0, threshold:5, total:6, done:false, gemFirst:3, gemSub:1, type:'count'},
    },
  };
}

const ADVENTURES = {
  animals: buildAnimals(),
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  screen: 'setup',
  adventure: null,
  life: 10, maxLife: 10, extraLife: 0,
  lifeLostCount: 0,
  blackDieUses: 3,
  gems: 0, gold: 0, torches: 0,
  visitedSpaces: new Set(),
  rubbleProgress: {},
  monsterState: {},
  bossDamageDealt: 0,
  achievementState: {},
  round: 0,
  phase: 'roll',
  whiteDice: [0,0,0,0],
  blackDie: 0,
  selectedSplit: null,
  useBlackDieInPair: null,
  pairs: null,
  pairActions: [null, null],
  currentPair: 0,
  roundDamageDealt: false,
  damageExemptForfeit: false,
  pendingChest: null,
  message: '',
};

function initGame(advKey) {
  const adv = ADVENTURES[advKey];
  Object.assign(state, {
    screen: 'playing',
    adventure: advKey,
    life: 10, maxLife: 10, extraLife: 0,
    blackDieUses: 3,
    gems: 0, gold: 0, torches: 0,
    visitedSpaces: new Set(),
    rubbleProgress: {},
    bossDamageDealt: 0,
    lifeLostCount: 0,
    round: 0,
    phase: 'roll',
    whiteDice: [0,0,0,0], blackDie: 0,
    selectedSplit: null, useBlackDieInPair: null,
    pairs: null, pairActions: [null, null],
    currentPair: 0,
    roundDamageDealt: false, damageExemptForfeit: false,
    pendingChest: null,
    message: `Welcome to ${adv.name}! Roll the dice to begin.`,
  });
  const monsterState = {};
  for (const [id, m] of Object.entries(adv.monsters)) {
    monsterState[id] = { health: m.hp, unlockedWhite: new Set(), defeated: false, totalDamage: 0 };
  }
  state.monsterState = monsterState;
  const achievementState = {};
  for (const [id, a] of Object.entries(adv.achievements)) {
    achievementState[id] = { done: false, count: a.count ?? 0, progress: a.progress instanceof Set ? new Set() : false };
  }
  state.achievementState = achievementState;
  render();
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function getAdv() { return ADVENTURES[state.adventure]; }

function spaceNum(spaceId) {
  return getAdv().spaces[spaceId].value;
}

function isVisited(spaceId) { return state.visitedSpaces.has(spaceId); }

function hasAdjacentVisited(spaceId) {
  return getAdv().spaces[spaceId].adj.some(id => state.visitedSpaces.has(id));
}

function canVisitSpace(spaceId, pair) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];

  if (isVisited(spaceId)) return false;
  if (sp.type === 'monster') return false; // monster rooms aren't directly visited

  // Doubles spaces: any doubles roll + adjacency
  if (sp.type === 'doubles') {
    if (pair.dice[0] !== pair.dice[1]) return false;
    return hasAdjacentVisited(spaceId);
  }

  // All other spaces need a value match
  const num = sp.value;
  if (num === null || num !== pair.total) return false;

  // Any start space is freely visitable with a matching roll — no adjacency required
  if (sp.type === 'start') return true;

  // Fist spaces: need matching value AND doubles
  if (sp.type === 'fist' && pair.dice[0] !== pair.dice[1]) return false;
  if (!hasAdjacentVisited(spaceId)) return false;
  return true;
}

function canAttackMonster(monsterId, pair) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return false;
  // Access: any space adjacent to the monster's room must be visited
  const monsterRoom = adv.spaces[monsterId];
  if (!monsterRoom.adj.some(sid => isVisited(sid))) return false;
  const validNums = [...m.black, ...m.white.filter(n => ms.unlockedWhite.has(n))];
  return validNums.includes(pair.total);
}

function getValidSpaces(pair) {
  return Object.keys(getAdv().spaces).filter(id => canVisitSpace(id, pair));
}

function getAttackableMonsters(pair) {
  return Object.keys(getAdv().monsters).filter(id => canAttackMonster(id, pair));
}

// ─── Actions ─────────────────────────────────────────────────────────────────


function rollDice() {
  state.whiteDice = [d6(), d6(), d6(), d6()];
  state.blackDie = d6();
  state.selectedSplit = null;
  state.useBlackDieInPair = null;
  state.pairs = null;
  state.pairActions = [null, null];
  state.currentPair = 0;
  state.roundDamageDealt = false;
  state.damageExemptForfeit = false;
  state.phase = 'selectSplit';
  state.message = `Rolled: [${state.whiteDice.join(', ')}] + black [${state.blackDie}]. Choose how to split the white dice.`;
  render();
}

function selectSplit(splitIdx) {
  const splits = pairSplits(state.whiteDice);
  state.selectedSplit = splitIdx;
  const s = splits[splitIdx];
  state.pairs = [
    { dice: s.d1.slice(), total: s.t1, used: false, forfeited: false },
    { dice: s.d2.slice(), total: s.t2, used: false, forfeited: false },
  ];
  state.useBlackDieInPair = null;
  state.phase = 'confirmPairs';
  state.message = `Pairs: [${state.pairs[0].dice}] = ${state.pairs[0].total} and [${state.pairs[1].dice}] = ${state.pairs[1].total}. Optionally swap in the black die, then confirm.`;
  render();
}

function swapBlackDie(pairIdx, dieIdx) {
  if (state.blackDieUses <= 0) return;
  const s = pairSplits(state.whiteDice)[state.selectedSplit];
  const base = pairIdx === 0 ? s.d1.slice() : s.d2.slice();
  base[dieIdx] = state.blackDie;
  state.pairs[pairIdx] = { dice: base, total: base[0] + base[1], used: false, forfeited: false };
  state.useBlackDieInPair = pairIdx;
  state.message = `Black die swapped into Pair ${pairIdx + 1}: [${state.pairs[pairIdx].dice}] = ${state.pairs[pairIdx].total}.`;
  render();
}

function confirmPairs() {
  if (state.useBlackDieInPair !== null) state.blackDieUses--;
  state.currentPair = 0;
  state.phase = 'assignPair';
  state.message = `Assign Pair 1 (total ${state.pairs[0].total}). Choose a space or monster below.`;
  render();
}

function assignToSpace(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  const pair = state.pairs[state.currentPair];
  if (!canVisitSpace(spaceId, pair)) return;

  if (sp.type === 'rubble') {
    const prog = state.rubbleProgress[spaceId] ?? 0;
    if (prog < 1) {
      state.rubbleProgress[spaceId] = 1;
      state.message = `First cross on Rubble ${spaceId}. One more to complete it.`;
    } else if (prog === 1) {
      state.rubbleProgress[spaceId] = 2;
      state.visitedSpaces.add(spaceId);
      triggerSpaceEffects(spaceId);
      state.message = `Rubble ${spaceId} cleared!`;
    }
  } else {
    state.visitedSpaces.add(spaceId);
    triggerSpaceEffects(spaceId);
    const effect = sp.type === 'gem' ? ' — +1 Gem!' : sp.type === 'fist' ? ' — dealt 1 damage to all monsters!' : sp.type === 'chest' ? ' — opening chest...' : '';
    state.message = `Visited ${spaceOptionLabel(spaceId)}${effect}`;
  }

  pair.used = true;
  advancePair();
}

function triggerSpaceEffects(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];

  if (sp.type === 'gem')   state.gems++;
  if (sp.type === 'chest') state.pendingChest = spaceId;

  // Unlock a specific white number for a monster (the unlocked number = this space's value)
  if (sp.unlocks) {
    const ms = state.monsterState[sp.unlocks];
    if (ms) ms.unlockedWhite.add(sp.value);
  }

  // Fist spaces: deal 1 damage to all active monsters
  if (sp.type === 'fist') {
    for (const [mid, ms] of Object.entries(state.monsterState)) {
      if (!ms.defeated) dealDamage(mid, 1);
    }
    checkAchievement('fist5of6', spaceId);
  }

  // Annoyed Animals: check cluster link achievement
  if (state.adventure === 'animals') checkStartsConnected();
}

function assignToMonster(monsterId) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const pair = state.pairs[state.currentPair];
  if (!canAttackMonster(monsterId, pair)) return;

  if (m.isArmored) {
    const otherIdx = state.currentPair === 0 ? 1 : 0;
    const otherPair = state.pairs[otherIdx];
    if (otherPair.used || otherPair.forfeited) {
      state.message = `${m.name} is Armored — both pairs must be used together, but Pair ${otherIdx + 1} is already used.`;
      render(); return;
    }
    if (!canAttackMonster(monsterId, otherPair)) {
      state.message = `${m.name} is Armored — both pairs must match its numbers. Pair ${otherIdx + 1} total ${otherPair.total} doesn't match.`;
      render(); return;
    }
    dealDamage(monsterId, 2);
    state.pairs[0].used = true;
    state.pairs[1].used = true;
    state.currentPair = 2;
    endRound();
  } else {
    dealDamage(monsterId, 1);
    state.message = `Attacked ${m.name} for 1 damage (${state.monsterState[monsterId].health}/${m.hp} HP remaining).`;
    pair.used = true;
    advancePair();
  }
}

function dealDamage(monsterId, amount) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return;
  ms.health = Math.max(0, ms.health - amount);
  ms.totalDamage += amount;
  if (m.isBoss) state.bossDamageDealt += amount;
  state.roundDamageDealt = true;
  if (ms.health <= 0) defeatMonster(monsterId);
}

function defeatMonster(monsterId) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  ms.defeated = true;
  state.gems += m.gemFirst;
  if (m.lifeLoss > 0) loseLife(m.lifeLoss);
  if (m.isBoss) state.bossDamageDealt = ms.totalDamage;
  state.message += ` ${m.name} defeated! +${m.gemFirst} gem(s).`;
  checkGameEnd();
}

function forfeitPair() {
  const pair = state.pairs[state.currentPair];
  pair.forfeited = true;
  if (state.roundDamageDealt) state.damageExemptForfeit = true;
  advancePair();
}

function advancePair() {
  if (state.pendingChest) { openChest(); return; }
  const done0 = state.pairs[0].used || state.pairs[0].forfeited;
  const done1 = state.pairs[1].used || state.pairs[1].forfeited;
  if (done0 && done1) {
    endRound();
  } else if (!done0) {
    state.currentPair = 0;
    state.message = `Assign Pair 1 (total ${state.pairs[0].total}). Choose a space or monster.`;
    render();
  } else {
    state.currentPair = 1;
    state.message = `Assign Pair 2 (total ${state.pairs[1].total}). Choose a space or monster.`;
    render();
  }
}

function openChest() {
  state.phase = 'chest';
  state.message = 'Treasure chest! Choose a reward:';
  render();
}

function chooseChestReward(reward) {
  if (reward === 'life') {
    state.extraLife += 3;
    state.gems++;
    state.message = '+3 Extra Life and +1 Gem!';
  } else if (reward === 'torch') {
    state.torches += 2;
    state.message = '+2 Torches!';
  } else if (reward === 'blackdie') {
    state.blackDieUses += 3;
    state.message = '+3 Black Die uses!';
  }
  state.pendingChest = null;
  const done0 = state.pairs[0].used || state.pairs[0].forfeited;
  const done1 = state.pairs[1].used || state.pairs[1].forfeited;
  if (!done0 || !done1) {
    state.phase = 'assignPair';
    render();
  } else {
    endRound();
  }
}

function useTorch() {
  if (state.torches <= 0) return;
  state.torches--;
  state.phase = 'torch';
  state.message = 'Torch active — choose any adjacent unvisited space.';
  render();
}

function assignTorchToSpace(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  if (isVisited(spaceId)) return;
  if (!hasAdjacentVisited(spaceId)) return;
  if (sp.type === 'gateway') return;
  state.visitedSpaces.add(spaceId);
  triggerSpaceEffects(spaceId);
  state.message = `Torch: visited ${spaceOptionLabel(spaceId)}.`;
  state.phase = 'assignPair';
  render();
}

function endRound() {
  state.round++;
  state.phase = 'roll';
  const penalties = [];
  const inGrace = state.round <= 3;

  // No-damage penalty waived for first 3 rounds
  if (!state.roundDamageDealt && !state.damageExemptForfeit && !inGrace) {
    loseLife(1);
    penalties.push('−1 life (no damage dealt this round)');
  }

  for (let i = 0; i < 2; i++) {
    const p = state.pairs[i];
    if (p.forfeited && !(i === 1 && state.damageExemptForfeit)) {
      loseLife(1);
      penalties.push(`−1 life (Pair ${i + 1} forfeited)`);
    }
  }

  if (checkDeath()) return;

  const graceNote = inGrace && !state.roundDamageDealt ? ' (grace period — no damage penalty)' : '';
  const penMsg = penalties.length ? ' ' + penalties.join('; ') + '.' : '';
  state.message = `Round ${state.round} over.${penMsg}${graceNote} Roll for next round.`;
  render();
}

function loseLife(n) {
  for (let i = 0; i < n; i++) {
    if (state.extraLife > 0) {
      state.extraLife--;
    } else {
      state.life--;
      state.lifeLostCount++;
    }
  }
}

function checkDeath() {
  if (state.life <= 0) {
    state.screen = 'gameover';
    render();
    return true;
  }
  return false;
}

function checkGameEnd() {
  const allDefeated = Object.values(state.monsterState).every(ms => ms.defeated);
  if (allDefeated) {
    state.screen = 'victory';
    render();
  }
}

function checkAchievement(key, triggerId) {
  const adv = getAdv();
  const ach = adv.achievements[key];
  if (!ach) return;
  const as = state.achievementState[key];
  if (!as || as.done) return;

  if (ach.type === 'count') {
    as.count++;
    if (as.count >= ach.threshold) {
      as.done = true;
      state.gems += ach.gemFirst;
      state.message += ` Achievement: ${ach.label}! +${ach.gemFirst} gem(s).`;
    }
  }
}

function checkStartsConnected() {
  const adv = getAdv();
  const as = state.achievementState['startsLinked'];
  if (!as || as.done) return;
  const left  = new Set(adv.leftStarts);
  const right = new Set(adv.rightStarts);
  const sources = adv.leftStarts.filter(id => isVisited(id));
  if (sources.length === 0) return;
  const seen = new Set(sources);
  const queue = [...sources];
  while (queue.length) {
    const curr = queue.shift();
    if (right.has(curr) && isVisited(curr)) {
      as.done = true;
      state.gems += adv.achievements.startsLinked.gemFirst;
      state.message += ' Achievement: Clusters connected! +1 gem.';
      return;
    }
    for (const nbr of adv.spaces[curr].adj) {
      if (!seen.has(nbr) && state.visitedSpaces.has(nbr)) {
        seen.add(nbr);
        queue.push(nbr);
      }
    }
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  if (state.screen === 'setup') {
    app.style.setProperty('--theme-color', '#7a9b5c');
    app.innerHTML = renderSetup();
  } else if (state.screen === 'playing') {
    const adv = getAdv();
    app.style.setProperty('--theme-color', adv.color);
    app.innerHTML = renderGame();
  } else if (state.screen === 'victory') {
    app.innerHTML = renderVictory();
  } else if (state.screen === 'gameover') {
    app.innerHTML = renderGameOver();
  }
  attachListeners();
}

function renderSetup() {
  return `<div class="realm-selector">
    <h1>&#x1F3B2; Dungeons, Dice &amp; Danger &#x1F3B2;</h1>
    <p>Solo adventure</p>
    <div class="realm-grid" style="max-width:280px;margin:0 auto">
      <button class="realm-btn" data-realm="animals" style="border-color:#7a9b5c">
        <div class="realm-title">Annoyed Animals</div>
        <div style="font-size:0.85em;color:#aaa;margin-top:6px">Novice</div>
      </button>
    </div>
  </div>`;
}

function renderGame() {
  return `<div class="game-container">
    ${renderHeader()}
    <div class="game-grid">
      <div class="left-panel">
        ${renderStatusCard()}
        ${renderMonsterPanel()}
        ${renderAchievements()}
      </div>
      <div class="center-panel">
        ${renderPhaseUI()}
        <div class="board-container">${renderSVGMap()}</div>
        <div class="message-box">${state.message}</div>
      </div>
    </div>
  </div>`;
}

function renderHeader() {
  const adv = getAdv();
  return `<div class="game-header">
    <h2>${adv.name} <span style="font-size:0.6em;color:#aaa">${adv.difficulty}</span></h2>
    <div style="display:flex;align-items:center;gap:12px">
      <span class="solo-badge">SOLO</span>
      <button class="quit-btn" data-action="quit">Exit</button>
    </div>
  </div>`;
}

function renderStatusCard() {
  const hearts = Array.from({length: state.maxLife}, (_, i) =>
    `<span class="${i < state.life ? 'heart-full' : 'heart-empty'}">&#x2665;</span>`
  ).join('');
  const extras = state.extraLife > 0 ? `<span style="color:#2ecc71"> +${state.extraLife}</span>` : '';
  return `<div class="status-card">
    <div class="status-row"><span>&#x2764; Life</span><span class="hearts">${hearts}${extras}</span></div>
    <div class="status-row"><span>&#x1F48E; Gems</span><span class="gem-count">${state.gems}</span></div>
    <div class="status-row"><span>&#x1FAB6; Gold</span><span>${state.gold}</span></div>
    <div class="status-row"><span>&#x1F3B2; Black Die</span><span>${state.blackDieUses} left</span></div>
    ${state.torches > 0 ? `<div class="status-row"><span>&#x1F525; Torches</span><span>${state.torches}</span></div>` : ''}
    <div class="status-row"><span>&#x1F3C6; Score</span><span>${calcScore()} VP</span></div>
    <div class="status-row" style="font-size:0.8em;color:#888"><span>Round</span><span>${state.round}${state.round <= 3 ? ' (grace)' : ''}</span></div>
  </div>`;
}

function renderMonsterPanel() {
  const adv = getAdv();
  const activePair = state.phase === 'assignPair' ? state.pairs[state.currentPair] : null;
  const items = Object.values(adv.monsters).map(m => {
    const ms = state.monsterState[m.id];
    if (ms.defeated) return `<div class="monster-item defeated">&#x2713; ${m.name}</div>`;
    const hasAccess = adv.spaces[m.id].adj.some(sid => isVisited(sid));
    const pct = (ms.health / m.hp) * 100;
    const attackableNow = activePair && canAttackMonster(m.id, activePair);
    const whiteNums = m.white.map(n =>
      ms.unlockedWhite.has(n)
        ? `<b>${n}</b>`
        : `<span style="color:#555">${n}</span>`
    ).join(', ');
    const whiteLabel = m.white.length ? ` | White: ${whiteNums}` : '';
    return `<div class="monster-item${m.isBoss ? ' boss-monster' : ''}${attackableNow ? ' attackable-now' : ''}">
      <div class="monster-name">${m.isBoss ? '&#x1F451; ' : ''}${m.name}${!hasAccess ? ' <span class="no-access">(no access)</span>' : ''}</div>
      <div class="monster-nums">Black: ${m.black.join(', ')}${whiteLabel}</div>
      <div class="health-bar-visual"><div class="health-fill" style="width:${pct}%"></div></div>
      <div style="font-size:0.78em;color:#aaa">${ms.health}/${m.hp} HP</div>
    </div>`;
  }).join('');
  return `<div class="monster-panel"><h4>Monsters</h4>${items}</div>`;
}

function renderAchievements() {
  const adv = getAdv();
  const items = Object.entries(adv.achievements).map(([key, ach]) => {
    const as = state.achievementState[key];
    const done = as?.done;
    let progress = '';
    if (ach.type === 'count' && ach.total) progress = ` (${as?.count ?? 0}/${ach.total})`;
    else if (ach.type === 'count') progress = as?.done ? '' : ` (${as?.count ?? 0}/${ach.threshold})`;
    return `<div class="achievement-row ${done ? 'done' : ''}">${done ? '&#x2713;' : '&#x25CB;'} ${ach.label}${progress}</div>`;
  }).join('');
  return `<div class="achievement-tracker"><h4>Achievements</h4>${items}</div>`;
}

// Returns a readable label for a space option button.
function spaceOptionLabel(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];
  if (sp.type === 'start') {
    const cluster = adv.leftStarts.includes(spaceId) ? 'Left' : 'Right';
    return `${cluster} start: ${sp.value}`;
  }
  if (sp.type === 'doubles') return '✊✊ Doubles space (any matching pair)';
  const info = {
    fist:    { icon: '✊', name: 'Fist',  note: 'damages all monsters' },
    gem:     { icon: '💎', name: 'Gem',   note: '+1 gem' },
    chest:   { icon: '📦', name: 'Chest', note: 'choose a reward' },
    regular: { icon: '',   name: '',      note: '' },
  };
  const t = info[sp.type] || { icon: '', name: sp.type, note: '' };
  const parts = [t.icon, t.name || '', sp.value, t.note ? `— ${t.note}` : ''].filter(x => x !== '' && x !== null && x !== undefined);
  return parts.join(' ');
}

function renderPhaseUI() {
  if (state.phase === 'chest') return renderChestModal();
  if (state.phase === 'torch')         return renderTorchUI();

  const steps = {roll:'Roll', selectSplit:'Split', confirmPairs:'Confirm', assignPair:'Assign'};
  const bar = `<div class="phase-bar">${Object.entries(steps).map(([k, v]) =>
    `<span class="phase-step ${state.phase === k ? 'active' : ''}">${v}</span>`
  ).join(' ›')}</div>`;

  if (state.phase === 'roll') {
    return `${bar}<div class="dice-section">
      <button class="roll-btn" data-action="roll">&#x1F3B2; Roll Dice</button>
      ${state.torches > 0 ? `<button class="action-btn" data-action="useTorch" style="margin-left:12px">&#x1F525; Torch (${state.torches})</button>` : ''}
    </div>`;
  }

  if (state.phase === 'selectSplit') {
    const splits = pairSplits(state.whiteDice);
    return `${bar}<div class="dice-section">
      <div class="dice-row">
        ${state.whiteDice.map(v => `<div class="die white">${v}</div>`).join('')}
        <div class="die black">${state.blackDie}</div>
      </div>
      <p style="margin:8px 0;color:#aaa">Choose how to pair your white dice:</p>
      <div class="split-grid">
        ${splits.map((s, i) => {
          const p1 = { dice: s.d1, total: s.t1 };
          const p2 = { dice: s.d2, total: s.t2 };
          const p1ok = getValidSpaces(p1).length > 0 || getAttackableMonsters(p1).length > 0;
          const p2ok = getValidSpaces(p2).length > 0 || getAttackableMonsters(p2).length > 0;
          const validCls = p1ok && p2ok ? 'split-valid-both' : (p1ok || p2ok ? 'split-valid-one' : 'split-valid-none');
          const d1Badge = s.d1[0] === s.d1[1] ? ' <span class="doubles-badge">✊×2</span>' : '';
          const d2Badge = s.d2[0] === s.d2[1] ? ' <span class="doubles-badge">✊×2</span>' : '';
          return `<button class="split-option ${validCls}" data-split="${i}">[${s.d1.join('+')}]=${s.t1}${d1Badge} &amp; [${s.d2.join('+')}]=${s.t2}${d2Badge}</button>`;
        }).join('')}
      </div>
      <p class="validity-legend"><span class="vl-green">█</span> both placeable &nbsp; <span class="vl-yellow">█</span> one placeable &nbsp; <span class="vl-red">█</span> neither</p>
    </div>`;
  }

  if (state.phase === 'confirmPairs') {
    const p = state.pairs;
    const origSplit = pairSplits(state.whiteDice)[state.selectedSplit];
    const p0ok = getValidSpaces(p[0]).length > 0 || getAttackableMonsters(p[0]).length > 0;
    const p1ok = getValidSpaces(p[1]).length > 0 || getAttackableMonsters(p[1]).length > 0;
    const blackBtns = state.blackDieUses > 0 ? `
      <div class="black-die-section">
        <p>Swap black die [${state.blackDie}] into a pair — ${state.blackDieUses} use(s) left:</p>
        <div class="black-swap-grid">
          ${origSplit.d1.map((v, idx) => {
            const nd = origSplit.d1.slice(); nd[idx] = state.blackDie;
            const np = { dice: nd, total: nd[0]+nd[1] };
            const ok = getValidSpaces(np).length > 0 || getAttackableMonsters(np).length > 0;
            return `<button class="swap-btn ${ok ? 'swap-valid' : 'swap-invalid'}" data-bswap="0-${idx}">P1 die ${idx+1}: [${v}]→[${state.blackDie}]</button>`;
          }).join('')}
          ${origSplit.d2.map((v, idx) => {
            const nd = origSplit.d2.slice(); nd[idx] = state.blackDie;
            const np = { dice: nd, total: nd[0]+nd[1] };
            const ok = getValidSpaces(np).length > 0 || getAttackableMonsters(np).length > 0;
            return `<button class="swap-btn ${ok ? 'swap-valid' : 'swap-invalid'}" data-bswap="1-${idx}">P2 die ${idx+1}: [${v}]→[${state.blackDie}]</button>`;
          }).join('')}
        </div>
      </div>` : '';
    return `${bar}<div class="dice-section">
      <div class="dice-row">
        ${state.whiteDice.map(v => `<div class="die white">${v}</div>`).join('')}
        <div class="die black">${state.blackDie}</div>
      </div>
      <div class="pairs-display">
        <div class="pair-box ${state.useBlackDieInPair === 0 ? 'black-used' : ''} ${p0ok ? 'pair-valid' : 'pair-invalid'}">Pair 1: [${p[0].dice.join('+')}] = <b>${p[0].total}</b></div>
        <div class="pair-box ${state.useBlackDieInPair === 1 ? 'black-used' : ''} ${p1ok ? 'pair-valid' : 'pair-invalid'}">Pair 2: [${p[1].dice.join('+')}] = <b>${p[1].total}</b></div>
      </div>
      ${blackBtns}
      <div style="display:flex;gap:10px;margin-top:12px;justify-content:center">
        <button class="roll-btn" data-action="undoSplit" style="font-size:1em;padding:10px 20px;background:rgba(255,255,255,0.05);border-color:#666;color:#aaa">← Back</button>
        <button class="roll-btn" data-action="confirmPairs" style="font-size:1.1em;padding:12px 28px">Confirm Pairs →</button>
      </div>
    </div>`;
  }

  if (state.phase === 'assignPair') {
    const adv = getAdv();

    const pairPanels = state.pairs.map((pair, i) => {
      const done = pair.used || pair.forfeited;
      if (done) {
        return `<div class="pair-panel done"><div class="pair-panel-header">Pair ${i+1}: ${pair.total} ✓</div></div>`;
      }
      const validSpaces = getValidSpaces(pair);
      const attackable = getAttackableMonsters(pair);
      const hasOptions = validSpaces.length > 0 || attackable.length > 0;
      const spaceButtons = validSpaces.map(id =>
        `<button class="option-btn space-btn" data-visitspace="${id}" data-pairidx="${i}">${spaceOptionLabel(id)}</button>`
      ).join('');
      const monsterButtons = attackable.map(mid => {
        const m = adv.monsters[mid];
        const ms = state.monsterState[mid];
        return `<button class="option-btn monster-btn" data-attack="${mid}" data-pairidx="${i}">&#x2694; ${m.name} (${ms.health}/${m.hp} HP)</button>`;
      }).join('');
      return `<div class="pair-panel">
        <div class="pair-panel-header">Pair ${i+1}: [${pair.dice.join('+')}] = <b>${pair.total}</b></div>
        <div class="options-area">
          ${hasOptions
            ? `<div class="options-grid">${spaceButtons}${monsterButtons}</div>`
            : `<p class="no-options">No valid moves — must forfeit.</p>`}
        </div>
        <button class="action-btn skip" data-forfeit="${i}">Forfeit (−1 life)</button>
      </div>`;
    }).join('');

    return `${bar}<div class="assign-section">
      ${pairPanels}
      ${state.torches > 0 ? `<div class="pair-footer" style="margin-top:10px"><button class="action-btn" data-action="useTorch">&#x1F525; Torch (${state.torches})</button></div>` : ''}
    </div>`;
  }

  return bar;
}


function renderChestModal() {
  return `<div class="chest-modal">
    <h3>&#x1F4E6; Treasure Chest!</h3>
    <p>Choose one reward:</p>
    <button class="chest-btn" data-chest="life">&#x2764; Extra Life — +3 life &amp; +1 gem</button>
    <button class="chest-btn" data-chest="torch">&#x1F525; Torch ×2 — visit any adjacent space (ignores die total)</button>
    <button class="chest-btn" data-chest="blackdie">&#x1F3B2; Extra Black Dice — +3 black die uses</button>
  </div>`;
}

function renderTorchUI() {
  const adv = getAdv();
  const torchable = Object.keys(adv.spaces).filter(id =>
    !isVisited(id) && adv.spaces[id].type !== 'gateway' && hasAdjacentVisited(id)
  );
  const buttons = torchable.map(id =>
    `<button class="option-btn space-btn" data-visitspace="${id}">${spaceOptionLabel(id)}</button>`
  ).join('');
  return `<div class="assign-section">
    <div class="pair-header">&#x1F525; Torch — visit any adjacent unvisited space</div>
    <div class="options-area">
      ${torchable.length
        ? `<div class="options-grid">${buttons}</div>`
        : `<p class="no-options">No adjacent unvisited spaces available.</p>`}
    </div>
    <div class="pair-footer">
      <button class="action-btn skip" data-action="cancelTorch">Cancel Torch</button>
    </div>
  </div>`;
}

function renderSVGMap() {
  const adv = getAdv();
  // Compute which spaces are currently available (for highlight only — not clickable)
  const activePair = state.phase === 'assignPair' ? state.pairs[state.currentPair] : null;
  const validSet = activePair ? new Set(getValidSpaces(activePair)) : new Set();
  const torchSet = state.phase === 'torch'
    ? new Set(Object.keys(adv.spaces).filter(id =>
        !isVisited(id) && adv.spaces[id].type !== 'gateway' && hasAdjacentVisited(id)))
    : new Set();
  const highlightSet = new Set([...validSet, ...torchSet]);

  const W = 780, H = 530;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="dungeon-map">`;

  // Helper: clip a straight line between two circles
  function edgePts(ax, ay, ar, bx, by, br) {
    const dx = bx - ax, dy = by - ay;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const ux = dx/len, uy = dy/len;
    return { x1: ax + ux*ar, y1: ay + uy*ar, x2: bx - ux*br, y2: by - uy*br };
  }

  // ── Connection stubs (door approach) ────────────────────────────────────────
  // Each connection is shown as two short stubs — one from each node edge pointing
  // toward the other — like doorways. No routing needed; crossings are impossible.
  const STUB = 15; // px extending from node edge toward neighbour
  {
    const drawnEdges = new Set();
    for (const [id, sp] of Object.entries(adv.spaces)) {
      if (sp.type === 'monster') continue;
      const nA = adv.nodes[id]; if (!nA) continue;
      const rA = sp.type === 'start' ? 16 : 14;
      const vA = isVisited(id);
      for (const nbrId of sp.adj) {
        const nbrSp = adv.spaces[nbrId];
        if (!nbrSp || nbrSp.type === 'monster') continue;
        const edgeKey = [id, nbrId].sort().join('|');
        if (drawnEdges.has(edgeKey)) continue;
        drawnEdges.add(edgeKey);
        const nB = adv.nodes[nbrId]; if (!nB) continue;
        const rB = nbrSp.type === 'start' ? 16 : 14;
        const vB = isVisited(nbrId);
        const dx = nB.x - nA.x, dy = nB.y - nA.y;
        const dist = Math.hypot(dx, dy); if (dist < 2) continue;
        const ux = dx/dist, uy = dy/dist;
        const sLen = Math.min(STUB, Math.max(3, (dist - rA - rB) / 2 - 2));
        const cls = vA && vB ? 'visited' : (vA || vB) ? 'frontier' : '';
        // Stub from A toward B
        svg += `<line x1="${(nA.x+ux*rA).toFixed(1)}" y1="${(nA.y+uy*rA).toFixed(1)}" x2="${(nA.x+ux*(rA+sLen)).toFixed(1)}" y2="${(nA.y+uy*(rA+sLen)).toFixed(1)}" class="map-edge ${cls}"/>`;
        // Stub from B toward A
        svg += `<line x1="${(nB.x-ux*rB).toFixed(1)}" y1="${(nB.y-uy*rB).toFixed(1)}" x2="${(nB.x-ux*(rB+sLen)).toFixed(1)}" y2="${(nB.y-uy*(rB+sLen)).toFixed(1)}" class="map-edge ${cls}"/>`;
      }
    }
  }

  // Monster rooms: access stubs from adjacent spaces + monster node rectangles
  for (const [mid, m] of Object.entries(adv.monsters)) {
    const mn = adv.nodes[mid];
    if (!mn) continue;
    const ms = state.monsterState[mid];
    const monsterRoom = adv.spaces[mid];
    const hasAccess = monsterRoom.adj.some(sid => isVisited(sid));

    for (const sid of monsterRoom.adj) {
      const sn = adv.nodes[sid];
      if (!sn) continue;
      const rS = adv.spaces[sid]?.type === 'start' ? 16 : 14;
      const lineState = ms.defeated ? 'defeated' : isVisited(sid) ? 'accessible' : '';
      const dx = mn.x - sn.x, dy = mn.y - sn.y;
      const dist = Math.hypot(dx, dy); if (dist < 2) continue;
      const ux = dx/dist, uy = dy/dist;
      // Stub from space node toward monster
      svg += `<line x1="${(sn.x+ux*rS).toFixed(1)}" y1="${(sn.y+uy*rS).toFixed(1)}" x2="${(sn.x+ux*(rS+STUB)).toFixed(1)}" y2="${(sn.y+uy*(rS+STUB)).toFixed(1)}" class="monster-access-line ${lineState}"/>`;
    }

    const cls = ms.defeated ? 'monster-node defeated' : m.isBoss ? 'monster-node boss' : hasAccess ? 'monster-node accessible' : 'monster-node';
    const pct = ms.health / m.hp;
    const mW = m.isBoss ? 90 : 60;
    const mH = ms.defeated ? 28 : (m.isBoss ? 64 : 46);
    svg += `<rect x="${mn.x-mW/2}" y="${mn.y-mH/2}" width="${mW}" height="${mH}" rx="4" class="${cls}" />`;
    if (!ms.defeated) {
      const barY = mn.y + mH/2 - 9;
      svg += `<rect x="${mn.x-mW/2+2}" y="${barY}" width="${Math.round((mW-4)*pct)}" height="5" class="monster-hp-fill" />`;
      svg += `<rect x="${mn.x-mW/2+2}" y="${barY}" width="${mW-4}" height="5" fill="none" stroke="#555" stroke-width="1" />`;
      // Name line
      svg += `<text x="${mn.x}" y="${mn.y - mH/2 + 11}" class="monster-label">${m.name.split(' ')[0]}</text>`;
      // Attack numbers: available (white) | locked (grey)
      const available = [...m.black, ...m.white.filter(n => ms.unlockedWhite.has(n))];
      const locked = m.white.filter(n => !ms.unlockedWhite.has(n));
      const numSpan = (nums, col) => nums.length ? `<tspan fill="${col}">${nums.join(' ')}</tspan>` : '';
      const sep = available.length && locked.length ? `<tspan fill="#555"> | </tspan>` : '';
      if (m.isBoss && (available.length + locked.length) > 3) {
        const allNums = [...available.map(n => ({n, avail:true})), ...locked.map(n => ({n, avail:false}))];
        const half = Math.ceil(allNums.length / 2);
        const mkSpans = ns => ns.map(({n,avail}) => `<tspan fill="${avail ? '#fff' : '#777'}">${n} </tspan>`).join('');
        svg += `<text x="${mn.x}" y="${mn.y - mH/2 + 24}" class="monster-nums-label">${mkSpans(allNums.slice(0,half))}</text>`;
        svg += `<text x="${mn.x}" y="${mn.y - mH/2 + 34}" class="monster-nums-label">${mkSpans(allNums.slice(half))}</text>`;
      } else {
        svg += `<text x="${mn.x}" y="${mn.y - mH/2 + 24}" class="monster-nums-label">${numSpan(available,'#fff')}${sep}${numSpan(locked,'#777')}</text>`;
      }
    } else {
      svg += `<text x="${mn.x}" y="${mn.y+5}" class="monster-label">✓ ${m.name.split(' ')[0]}</text>`;
    }
  }

  // Space nodes (read-only — monster rooms skipped, rendered above)
  for (const [id, sp] of Object.entries(adv.spaces)) {
    if (sp.type === 'monster') continue;
    const n = adv.nodes[id];
    if (!n) continue;
    const vis = isVisited(id);
    const highlighted = highlightSet.has(id);

    let cls = 'space-node';
    if (sp.type === 'start')    cls += ' start-node';
    else if (sp.type === 'fist')    cls += ' fist-node';
    else if (sp.type === 'gem')     cls += ' gem-node';
    else if (sp.type === 'chest')   cls += ' chest-node';
    else if (sp.type === 'doubles') cls += ' doubles-node';

    if (vis)         cls += ' visited';
    if (highlighted) cls += ' available';

    const r = sp.type === 'start' ? 16 : 14;
    // Opaque backing circle masks any edges that pass behind this node
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r+2}" fill="#1a1a1a" stroke="none"/>`;
    // Dashed red ring on nodes that adjoin an undefeated monster room
    const adjMonsters = sp.adj.filter(nid => adv.spaces[nid]?.type === 'monster' && !state.monsterState[nid]?.defeated);
    if (adjMonsters.length > 0) {
      svg += `<circle cx="${n.x}" cy="${n.y}" r="${r+6}" fill="none" stroke="#cc3333" stroke-width="2" stroke-dasharray="5 3" opacity="0.8"/>`;
    }
    // data-spaceid always present so hover can find the circle; data-visitspace makes it clickable
    const clickAttr = highlighted || state.phase === 'torch' ? ` data-visitspace="${id}"` : '';
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" class="${cls}" data-spaceid="${id}"${clickAttr}/>`;

    if (sp.type === 'doubles' && !vis) {
      // Two mini dice icons — no number (any doubles works)
      svg += `<rect x="${n.x-13}" y="${n.y-7}" width="10" height="10" rx="2" class="dice-icon-mini"/>`;
      svg += `<circle cx="${n.x-8}" cy="${n.y-2}" r="1.5" class="dice-pip-mini"/>`;
      svg += `<rect x="${n.x+3}" y="${n.y-7}" width="10" height="10" rx="2" class="dice-icon-mini"/>`;
      svg += `<circle cx="${n.x+8}" cy="${n.y-2}" r="1.5" class="dice-pip-mini"/>`;
    } else if (sp.type === 'fist' && !vis) {
      // Fist icon (top) + "n+n" required pair value (bottom)
      svg += `<text x="${n.x}" y="${n.y-1}" class="fist-icon-lbl">✊</text>`;
      svg += `<text x="${n.x}" y="${n.y+9}" class="fist-val-lbl">${sp.value/2}+${sp.value/2}</text>`;
    } else {
      let lbl = sp.value !== null ? String(sp.value) : '';
      if (vis && sp.type !== 'start' && sp.type !== 'fist') lbl = '✓';
      svg += `<text x="${n.x}" y="${n.y+4}" class="space-label">${lbl}</text>`;
    }
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  const ly = 514;
  svg += `<line x1="0" y1="${ly-4}" x2="${W}" y2="${ly-4}" stroke="#333" stroke-width="1"/>`;
  const legend = [
    { x:14,  cls:'space-node start-node',   label:'Start (any roll)' },
    { x:135, cls:'space-node gem-node',      label:'Gem' },
    { x:193, cls:'space-node chest-node',    label:'Chest (gold)' },
    { x:288, cls:'space-node fist-node',     label:'Fist ✊ (n+n pair)' },
    { x:430, cls:'space-node doubles-node',  label:'Any Doubles' },
    { x:543, cls:'space-node visited',       label:'Visited' },
  ];
  for (const {x, cls, label} of legend) {
    svg += `<circle cx="${x}" cy="${ly+6}" r="8" class="${cls}"/>`;
    svg += `<text x="${x+13}" y="${ly+10}" class="legend-text">${label}</text>`;
  }
  // doubles mini-dice in legend
  svg += `<rect x="423" y="${ly}" width="6" height="6" rx="1" class="dice-icon-mini"/>`;
  svg += `<rect x="431" y="${ly}" width="6" height="6" rx="1" class="dice-icon-mini"/>`;
  // fist icon in legend
  svg += `<text x="288" y="${ly+8}" class="fist-icon-lbl" style="font-size:8px">✊</text>`;
  // Monster legend entry
  svg += `<rect x="640" y="${ly-2}" width="48" height="18" rx="3" class="monster-node"/>`;
  svg += `<text x="664" y="${ly+10}" class="monster-label">Monster</text>`;

  svg += '</svg>';
  return svg;
}

function calcScore() {
  const adv = getAdv();
  const bossId = Object.keys(adv.monsters).find(id => adv.monsters[id].isBoss);
  const bossDefeated = bossId ? state.monsterState[bossId]?.defeated : false;
  const bossVP = bossDefeated ? 0 : Math.floor(state.bossDamageDealt / 3);
  return state.gems * 3 + state.gold * 2 + bossVP;
}

function scoreRating(score) {
  if (score < 10)  return "You didn't find the entrance. Try again!";
  if (score < 25)  return "The idea was to kill monsters, not cuddle them!";
  if (score < 40)  return "This is not paint-by-numbers.";
  if (score < 55)  return "Not bad! But hit the boss harder next time!";
  if (score < 70)  return "You are a true hero!";
  if (score < 85)  return "Did you teach Indiana Jones his moves?";
  if (score < 100) return "Wondrous tales will be told for centuries!";
  return "Behold, the DUNGEON MASTER is here!!!";
}

function renderVictory() {
  const score = calcScore();
  return `<div class="app" style="--theme-color:#f1c40f">
    <div class="game-container">
      <div class="victory">
        <h2>&#x1F3C6; Victory!</h2>
        <p style="font-size:1.3em;margin:12px 0">Final Score: <b>${score} VP</b></p>
        <p style="color:#f1c40f;font-style:italic">${scoreRating(score)}</p>
        <div style="margin:16px 0;color:#aaa">Gems: ${state.gems} (${state.gems*3} VP) | Gold: ${state.gold} (${state.gold*2} VP)</div>
        <button data-action="quit">Play Again</button>
      </div>
    </div>
  </div>`;
}

function renderGameOver() {
  const score = calcScore();
  return `<div class="app" style="--theme-color:#e74c3c">
    <div class="game-container">
      <div class="game-over">
        <h2>&#x1F480; Defeated!</h2>
        <p style="font-size:1.1em;margin:12px 0">You fell with <b>${score} VP</b> earned.</p>
        <p style="color:#e74c3c;font-style:italic">${scoreRating(score)}</p>
        <button data-action="quit">Try Again</button>
      </div>
    </div>
  </div>`;
}

// ─── Events ───────────────────────────────────────────────────────────────────

let _appClickHandler = null;

function attachListeners() {
  const app = document.getElementById('app');
  if (_appClickHandler) app.removeEventListener('click', _appClickHandler);
  _appClickHandler = e => {
    const t = e.target.closest('[data-action],[data-realm],[data-split],[data-visitspace],[data-attack],[data-bswap],[data-chest],[data-forfeit]');
    if (!t) return;

    if (t.dataset.realm)       { initGame(t.dataset.realm); return; }
    if (t.dataset.split)       { selectSplit(+t.dataset.split); return; }
    if (t.dataset.forfeit !== undefined) { state.currentPair = +t.dataset.forfeit; forfeitPair(); return; }
    if (t.dataset.visitspace)  {
      if (t.dataset.pairidx !== undefined) state.currentPair = +t.dataset.pairidx;
      if (state.phase === 'torch') assignTorchToSpace(t.dataset.visitspace);
      else assignToSpace(t.dataset.visitspace);
      return;
    }
    if (t.dataset.attack)      {
      if (t.dataset.pairidx !== undefined) state.currentPair = +t.dataset.pairidx;
      assignToMonster(t.dataset.attack);
      return;
    }
    if (t.dataset.bswap)       { const [p,d] = t.dataset.bswap.split('-').map(Number); swapBlackDie(p,d); return; }
    if (t.dataset.chest)       { chooseChestReward(t.dataset.chest); return; }

    const action = t.dataset.action;
    if      (action === 'roll')         rollDice();
    else if (action === 'confirmPairs') confirmPairs();
    else if (action === 'undoSplit')    { state.phase = 'selectSplit'; state.selectedSplit = null; state.pairs = []; state.useBlackDieInPair = null; render(); }
    else if (action === 'forfeit')      forfeitPair();
    else if (action === 'useTorch')     useTorch();
    else if (action === 'cancelTorch')  { state.phase = 'assignPair'; render(); }
    else if (action === 'quit')         { state.screen = 'setup'; render(); }
  };
  app.addEventListener('click', _appClickHandler);

  // Hovering an option button highlights the corresponding space on the map
  app.addEventListener('mouseover', e => {
    const btn = e.target.closest('.option-btn[data-visitspace]');
    if (btn) {
      const circle = app.querySelector(`circle[data-spaceid="${btn.dataset.visitspace}"]`);
      if (circle) circle.classList.add('btn-hovered');
      return;
    }
    // Hovering a split option highlights all spaces reachable with that split's pairs
    const splitBtn = e.target.closest('.split-option[data-split]');
    if (splitBtn && state.phase === 'selectSplit') {
      const splits = pairSplits(state.whiteDice);
      const split = splits[+splitBtn.dataset.split];
      if (split) {
        const ids = new Set([
          ...getValidSpaces({ dice: split.d1, total: split.t1 }),
          ...getValidSpaces({ dice: split.d2, total: split.t2 }),
        ]);
        ids.forEach(sid => {
          const circle = app.querySelector(`circle[data-spaceid="${sid}"]`);
          if (circle) circle.classList.add('btn-hovered');
        });
      }
    }
  });
  app.addEventListener('mouseout', e => {
    const btn = e.target.closest('.option-btn[data-visitspace]');
    if (btn) {
      const circle = app.querySelector(`circle[data-spaceid="${btn.dataset.visitspace}"]`);
      if (circle) circle.classList.remove('btn-hovered');
      return;
    }
    const splitBtn = e.target.closest('.split-option[data-split]');
    if (splitBtn) {
      app.querySelectorAll('.space-node.btn-hovered').forEach(el => el.classList.remove('btn-hovered'));
    }
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

render();
