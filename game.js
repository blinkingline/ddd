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

// ─── Adventure Builder ────────────────────────────────────────────────────────

function buildAnimals() {
  const spaces = {
    // Left cluster start spaces — free to visit with matching roll, no adjacency needed
    sl2:  {id:'sl2',  num:2,  type:'start', label:'2'},
    sl3:  {id:'sl3',  num:3,  type:'start', label:'3'},
    sl6:  {id:'sl6',  num:6,  type:'start', label:'6'},
    sl7:  {id:'sl7',  num:7,  type:'start', label:'7'},
    sl9:  {id:'sl9',  num:9,  type:'start', label:'9'},
    sl12: {id:'sl12', num:12, type:'start', label:'12'},
    // Right cluster start spaces
    sr4:  {id:'sr4',  num:4,  type:'start', label:'4'},
    sr5:  {id:'sr5',  num:5,  type:'start', label:'5'},
    sr8:  {id:'sr8',  num:8,  type:'start', label:'8'},
    sr10: {id:'sr10', num:10, type:'start', label:'10'},
    sr11: {id:'sr11', num:11, type:'start', label:'11'},
    // Fist spaces
    f2a:  {id:'f2a',  num:2,  type:'fist', label:'2'},
    f4a:  {id:'f4a',  num:4,  type:'fist', label:'4'},
    f6a:  {id:'f6a',  num:6,  type:'fist', label:'6'},
    f8a:  {id:'f8a',  num:8,  type:'fist', label:'8'},
    f10a: {id:'f10a', num:10, type:'fist', label:'10'},
    f12a: {id:'f12a', num:12, type:'fist', label:'12'},
    // Regular spaces
    r2a:  {id:'r2a',  num:2,  type:'regular', label:'2'},
    r3a:  {id:'r3a',  num:3,  type:'regular', label:'3'},
    r4a:  {id:'r4a',  num:4,  type:'regular', label:'4'},
    r5a:  {id:'r5a',  num:5,  type:'regular', label:'5'},
    r6a:  {id:'r6a',  num:6,  type:'regular', label:'6'},
    r7a:  {id:'r7a',  num:7,  type:'regular', label:'7'},
    r8a:  {id:'r8a',  num:8,  type:'regular', label:'8'},
    r9a:  {id:'r9a',  num:9,  type:'regular', label:'9'},
    r10a: {id:'r10a', num:10, type:'regular', label:'10'},
    r11a: {id:'r11a', num:11, type:'regular', label:'11'},
    r12a: {id:'r12a', num:12, type:'regular', label:'12'},
    // Special spaces
    gold1a:  {id:'gold1a',  num:5,  type:'gold',     label:'5'},
    gold2a:  {id:'gold2a',  num:6,  type:'gold',     label:'6'},
    gem1a:   {id:'gem1a',   num:9,  type:'gem',      label:'9'},
    gem2a:   {id:'gem2a',   num:12, type:'gem',      label:'12'},
    chest1a: {id:'chest1a', num:10, type:'treasure', label:'10'},
  };
  buildAdj(spaces, [
    // Left cluster internal
    ['sl9','sl7'],  ['sl9','sl12'],
    ['sl7','sl2'],  ['sl7','sl6'],
    ['sl12','sl2'], ['sl12','sl6'],
    ['sl2','sl3'],  ['sl6','sl3'],
    // Right cluster internal
    ['sr4','sr5'],  ['sr4','sr8'],
    ['sr5','sr10'],
    ['sr8','sr11'], ['sr8','sr10'],
    ['sr11','sr10'],
    // Left cluster → regular spaces
    ['sl2','r2a'],  ['sl2','f2a'],
    ['sl3','r3a'],
    ['sl6','r6a'],
    ['sl7','r7a'],
    ['sl9','r9a'],  ['sl9','gem1a'],
    ['sl12','r12a'],
    // Right cluster → regular spaces
    ['sr4','r4a'],   ['sr4','f4a'],
    ['sr5','r5a'],   ['sr5','gold1a'],
    ['sr8','r8a'],   ['sr8','f8a'],
    ['sr10','r10a'], ['sr10','chest1a'],
    ['sr11','r11a'],
    // Regular/fist internal adjacency
    ['f2a','r2a'],   ['f2a','r3a'],
    ['r2a','r3a'],
    ['r3a','r5a'],   ['r3a','r7a'],
    ['f4a','r4a'],   ['f4a','r5a'],
    ['r4a','r6a'],
    ['r5a','f6a'],   ['r5a','r7a'],   ['r5a','gold1a'],
    ['r6a','f6a'],   ['r6a','r10a'],  ['r6a','gold2a'],
    ['f6a','r7a'],   ['f6a','r8a'],
    ['r8a','f8a'],   ['r8a','r10a'],
    ['f8a','r9a'],   ['f8a','r10a'],  ['f8a','r12a'],
    ['r9a','r11a'],  ['r9a','gem1a'],
    ['r10a','r12a'], ['r10a','chest1a'],
    ['r11a','f10a'], ['r11a','r12a'],
    ['f10a','r9a'],  ['f10a','r12a'],
    ['r12a','f12a'],
    ['f12a','gem2a'],
  ]);
  const monsters = {
    greyWolf:   {id:'greyWolf',   name:'Grey Wolf',    hp:3,  black:[2],    white:[10],   accessFrom:['r2a'],        unlockFrom:'r10a', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    buffHound:  {id:'buffHound',  name:'Buff Hound',   hp:4,  black:[8,10], white:[],     accessFrom:['r8a','r10a'], unlockFrom:null,   gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    primalHare: {id:'primalHare', name:'Primal Hare',  hp:3,  black:[3],    white:[11],   accessFrom:['r3a'],        unlockFrom:'r11a', gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    savageBoar: {id:'savageBoar', name:'Savage Boar',  hp:5,  black:[9,11], white:[],     accessFrom:['r9a','r11a'], unlockFrom:null,   gemFirst:2,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    primalWolf: {id:'primalWolf', name:'Primal Wolf',  hp:4,  black:[4],    white:[6],    accessFrom:['r4a'],        unlockFrom:'r6a',  gemFirst:1,gemSub:1,lifeLoss:0,isBoss:false,isArmored:false},
    barryBoss:  {id:'barryBoss',  name:'Barry Bearcub',hp:12, black:[7],    white:[9,11], accessFrom:['r7a','r11a'], unlockFrom:'f10a', gemFirst:5,gemSub:3,lifeLoss:0,isBoss:true, isArmored:false},
  };
  const nodes = {
    sl9:  {x:68, y:88},   sl7:  {x:153,y:88},
    sl12: {x:68, y:173},  sl2:  {x:153,y:173},
    sl6:  {x:68, y:258},  sl3:  {x:153,y:258},
    sr4:  {x:628,y:88},   sr5:  {x:713,y:88},
    sr8:  {x:628,y:173},  sr10: {x:713,y:173},
    sr11: {x:628,y:258},
    f2a:  {x:238,y:45},   r2a:  {x:238,y:120},
    r3a:  {x:323,y:80},   r7a:  {x:323,y:163},
    gem1a:{x:238,y:265},  r9a:  {x:323,y:253},
    r4a:  {x:238,y:358},  f4a:  {x:238,y:448},
    r5a:  {x:408,y:120},  gold1a:{x:408,y:43},
    f6a:  {x:408,y:218},  r6a:  {x:323,y:338},
    gold2a:{x:238,y:428}, r8a:  {x:493,y:218},
    r11a: {x:493,y:88},   f8a:  {x:493,y:323},
    f10a: {x:493,y:133},  r10a: {x:578,y:323},
    r12a: {x:578,y:418},  f12a: {x:663,y:418},
    gem2a:{x:663,y:488},  chest1a:{x:493,y:453},
  };
  const mNodes = {
    greyWolf:   {x:238,y:18},  primalHare: {x:323,y:28},
    primalWolf: {x:68, y:338}, buffHound:  {x:578,y:460},
    savageBoar: {x:493,y:38},  barryBoss:  {x:748,y:173},
  };
  return {
    key:'animals', name:'Annoyed Animals', difficulty:'Novice', color:'#7a9b5c',
    leftStarts:  ['sl2','sl3','sl6','sl7','sl9','sl12'],
    rightStarts: ['sr4','sr5','sr8','sr10','sr11'],
    spaces, monsters, nodes, mNodes,
    achievements:{
      startsLinked:{label:'Connect both clusters via visited path',done:false,gemFirst:1,gemSub:0,type:'path'},
      fist5of6:   {label:'5 of 6 Fist spaces',count:0,threshold:5,total:6,done:false,gemFirst:3,gemSub:1,type:'count'},
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
  clusterChoice: null,
  life: 10, maxLife: 10, extraLife: 0,
  blackDieUses: 3,
  gems: 0, gold: 0, torches: 0,
  visitedSpaces: new Set(),
  rubbleProgress: {},
  monsterState: {},
  bossDamageDealt: 0,
  achievementState: {},
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
    clusterChoice: null,
    life: 10, maxLife: 10, extraLife: 0,
    blackDieUses: 3,
    gems: 0, gold: 0, torches: 0,
    visitedSpaces: new Set(),
    rubbleProgress: {},
    bossDamageDealt: 0,
    phase: 'clusterSelect',
    whiteDice: [0,0,0,0], blackDie: 0,
    selectedSplit: null, useBlackDieInPair: null,
    pairs: null, pairActions: [null, null],
    currentPair: 0,
    roundDamageDealt: false, damageExemptForfeit: false,
    pendingChest: null,
    message: 'Choose your starting cluster.',
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
  return getAdv().spaces[spaceId].num;
}

function isVisited(spaceId) { return state.visitedSpaces.has(spaceId); }

function hasAdjacentVisited(spaceId) {
  return getAdv().spaces[spaceId].adj.some(id => state.visitedSpaces.has(id));
}

function canVisitSpace(spaceId, pair) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];

  if (isVisited(spaceId)) {
    if (sp.type === 'rubble' && (state.rubbleProgress[spaceId] ?? 0) < 1) return false;
    if (sp.type !== 'rubble') return false;
    if ((state.rubbleProgress[spaceId] ?? 0) >= 2) return false;
  }

  if (sp.type === 'gateway') return false;
  const num = spaceNum(spaceId);
  if (num === null || num !== pair.total) return false;

  if (sp.type === 'start') {
    // Chosen cluster: free visit (no adjacency required)
    const inChosen = state.clusterChoice === 'left'
      ? adv.leftStarts.includes(spaceId)
      : adv.rightStarts.includes(spaceId);
    if (inChosen) return true;
    // Other cluster: needs adjacency (earned by connecting through middle)
    return hasAdjacentVisited(spaceId);
  }

  if (sp.type === 'fist' && pair.dice[0] !== pair.dice[1]) return false;
  if (!hasAdjacentVisited(spaceId)) return false;
  return true;
}

function canAttackMonster(monsterId, pair) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return false;
  if (!m.accessFrom.some(sid => isVisited(sid))) return false;
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

function chooseCluster(side) {
  state.clusterChoice = side;
  state.phase = 'roll';
  const adv = getAdv();
  const nums = (side === 'left' ? adv.leftStarts : adv.rightStarts)
    .map(id => adv.spaces[id].num).sort((a, b) => a - b).join(', ');
  state.message = `Starting in ${side === 'left' ? 'Left' : 'Right'} cluster (${nums}). Roll the dice!`;
  render();
}

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
    const effect = sp.type === 'gold' ? ' — +1 Gold!' : sp.type === 'gem' ? ' — +1 Gem!' : sp.type === 'fist' ? ' — dealt 1 damage to all monsters!' : '';
    state.message = `Visited ${spaceOptionLabel(spaceId)}${effect}`;
  }

  pair.used = true;
  advancePair();
}

function triggerSpaceEffects(spaceId) {
  const adv = getAdv();
  const sp = adv.spaces[spaceId];

  if (sp.type === 'gold')     state.gold++;
  if (sp.type === 'gem')      state.gems++;
  if (sp.type === 'treasure') state.pendingChest = spaceId;

  // Unlock white numbers for monsters whose unlockFrom = this space
  for (const [mid, m] of Object.entries(adv.monsters)) {
    if (m.unlockFrom === spaceId) {
      for (const n of m.white) state.monsterState[mid].unlockedWhite.add(n);
    }
  }

  // Fist spaces: deal 1 damage to all active monsters
  if (sp.type === 'fist') {
    for (const [mid, ms] of Object.entries(state.monsterState)) {
      if (!ms.defeated) dealDamage(mid, 1, true);
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
    dealDamage(monsterId, 2, false);
    state.pairs[0].used = true;
    state.pairs[1].used = true;
    state.currentPair = 2;
    endRound();
  } else {
    dealDamage(monsterId, 1, false);
    state.message = `Attacked ${m.name} for 1 damage (${state.monsterState[monsterId].health}/${m.hp} HP remaining).`;
    pair.used = true;
    advancePair();
  }
}

function dealDamage(monsterId, amount, fromFist) {
  const adv = getAdv();
  const m = adv.monsters[monsterId];
  const ms = state.monsterState[monsterId];
  if (ms.defeated) return;
  ms.health = Math.max(0, ms.health - amount);
  ms.totalDamage += amount;
  if (m.isBoss) state.bossDamageDealt += amount;
  if (!fromFist) state.roundDamageDealt = true;
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
  if (state.currentPair === 0) {
    state.currentPair = 1;
    const p = state.pairs[1];
    if (state.pendingChest) { openChest(); return; }
    state.message = `Assign Pair 2 (total ${p.total}). Choose a space or monster below.`;
    render();
  } else {
    if (state.pendingChest) { openChest(); return; }
    endRound();
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
  state.phase = 'roll';
  const penalties = [];

  if (!state.roundDamageDealt && !state.damageExemptForfeit) {
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

  const penMsg = penalties.length ? ' ' + penalties.join('; ') + '.' : '';
  state.message = `Round over.${penMsg} Roll for next round.`;
  render();
}

function loseLife(n) {
  for (let i = 0; i < n; i++) {
    if (state.extraLife > 0) state.extraLife--;
    else state.life--;
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
  const clusterLabel = state.clusterChoice
    ? ` <span style="font-size:0.55em;color:#aaa">[${state.clusterChoice === 'left' ? 'Left' : 'Right'} cluster]</span>` : '';
  return `<div class="game-header">
    <h2>${adv.name}${clusterLabel} <span style="font-size:0.6em;color:#aaa">${adv.difficulty}</span></h2>
    <button class="quit-btn" data-action="quit">Exit</button>
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
  </div>`;
}

function renderMonsterPanel() {
  const adv = getAdv();
  const activePair = state.phase === 'assignPair' ? state.pairs[state.currentPair] : null;
  const items = Object.values(adv.monsters).map(m => {
    const ms = state.monsterState[m.id];
    if (ms.defeated) return `<div class="monster-item defeated">&#x2713; ${m.name}</div>`;
    const hasAccess = m.accessFrom.some(sid => isVisited(sid));
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
    return `${cluster} start: ${sp.num}`;
  }
  const info = {
    fist:    { icon: '✊', name: 'Fist',  note: 'damages all monsters' },
    gem:     { icon: '💎', name: 'Gem',   note: '+1 gem' },
    gold:    { icon: '🪙', name: 'Gold',  note: '+1 gold' },
    treasure:{ icon: '📦', name: 'Chest', note: 'choose a reward' },
    regular: { icon: '',   name: '',      note: '' },
    rubble:  { icon: '🪨', name: 'Rubble',note: '2 crosses to clear' },
  };
  const t = info[sp.type] || { icon: '', name: sp.type, note: '' };
  const parts = [t.icon, t.name || '', sp.num, t.note ? `— ${t.note}` : ''].filter(x => x !== '');
  return parts.join(' ');
}

function renderPhaseUI() {
  if (state.phase === 'clusterSelect') return renderClusterSelect();
  if (state.phase === 'chest')         return renderChestModal();
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
        ${splits.map((s, i) =>
          `<button class="split-option" data-split="${i}">[${s.d1.join('+')}] = ${s.t1} &amp; [${s.d2.join('+')}] = ${s.t2}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  if (state.phase === 'confirmPairs') {
    const p = state.pairs;
    const blackBtns = state.blackDieUses > 0 ? `
      <div class="black-die-section">
        <p>Swap black die [${state.blackDie}] into a pair — ${state.blackDieUses} use(s) left:</p>
        <div class="black-swap-grid">
          ${p[0].dice.map((v, i) => `<button class="swap-btn" data-bswap="0-${i}">P1 die ${i+1}: [${v}]→[${state.blackDie}]</button>`).join('')}
          ${p[1].dice.map((v, i) => `<button class="swap-btn" data-bswap="1-${i}">P2 die ${i+1}: [${v}]→[${state.blackDie}]</button>`).join('')}
        </div>
      </div>` : '';
    return `${bar}<div class="dice-section">
      <div class="dice-row">
        ${state.whiteDice.map(v => `<div class="die white">${v}</div>`).join('')}
        <div class="die black">${state.blackDie}</div>
      </div>
      <div class="pairs-display">
        <div class="pair-box ${state.useBlackDieInPair === 0 ? 'black-used' : ''}">Pair 1: [${p[0].dice.join('+')}] = <b>${p[0].total}</b></div>
        <div class="pair-box ${state.useBlackDieInPair === 1 ? 'black-used' : ''}">Pair 2: [${p[1].dice.join('+')}] = <b>${p[1].total}</b></div>
      </div>
      ${blackBtns}
      <button class="roll-btn" data-action="confirmPairs" style="margin-top:12px;font-size:1.1em;padding:12px 28px">Confirm Pairs →</button>
    </div>`;
  }

  if (state.phase === 'assignPair') {
    const pIdx = state.currentPair;
    const pair = state.pairs[pIdx];
    const otherPair = state.pairs[pIdx === 0 ? 1 : 0];
    const otherDone = otherPair.used || otherPair.forfeited;

    const validSpaces = getValidSpaces(pair);
    const attackable = getAttackableMonsters(pair);

    const spaceButtons = validSpaces.map(id =>
      `<button class="option-btn space-btn" data-visitspace="${id}">${spaceOptionLabel(id)}</button>`
    ).join('');

    const monsterButtons = attackable.map(mid => {
      const m = getAdv().monsters[mid];
      const ms = state.monsterState[mid];
      return `<button class="option-btn monster-btn" data-attack="${mid}">&#x2694; ${m.name} (${ms.health}/${m.hp} HP)</button>`;
    }).join('');

    const hasOptions = validSpaces.length > 0 || attackable.length > 0;

    return `${bar}<div class="assign-section">
      <div class="pair-header">
        <span>Pair ${pIdx + 1}: [${pair.dice.join('+')}] = <b class="pair-total">${pair.total}</b></span>
        <span class="other-pair">Pair ${pIdx === 0 ? 2 : 1}: ${otherPair.total}${otherDone ? ' ✓' : ''}</span>
      </div>
      <div class="options-area">
        ${hasOptions
          ? `<div class="options-grid">${spaceButtons}${monsterButtons}</div>`
          : `<p class="no-options">No valid moves for ${pair.total}. You must forfeit this pair.</p>`}
      </div>
      <div class="pair-footer">
        <button class="action-btn skip" data-action="forfeit">Forfeit (−1 life)</button>
        ${state.torches > 0 ? `<button class="action-btn" data-action="useTorch">&#x1F525; Torch (${state.torches})</button>` : ''}
      </div>
    </div>`;
  }

  return bar;
}

function renderClusterSelect() {
  const adv = getAdv();
  const leftNums  = adv.leftStarts.map(id  => adv.spaces[id].num).sort((a, b) => a - b).join(', ');
  const rightNums = adv.rightStarts.map(id => adv.spaces[id].num).sort((a, b) => a - b).join(', ');
  return `<div class="cluster-select">
    <h3>Choose your starting cluster</h3>
    <p class="cluster-hint">Start spaces in your chosen cluster can be visited with a matching roll — no adjacency required. You can reach the other cluster later by connecting through the middle.</p>
    <div class="cluster-options">
      <button class="cluster-btn" data-cluster="left">
        <div class="cluster-title">Left Cluster</div>
        <div class="cluster-nums">${leftNums}</div>
      </button>
      <button class="cluster-btn" data-cluster="right">
        <div class="cluster-title">Right Cluster</div>
        <div class="cluster-nums">${rightNums}</div>
      </button>
    </div>
  </div>`;
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

  const W = 780, H = 510;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="dungeon-map">`;

  // Edges
  const drawnEdges = new Set();
  for (const [id, sp] of Object.entries(adv.spaces)) {
    if (sp.type === 'gateway') continue;
    const nA = adv.nodes[id];
    if (!nA) continue;
    for (const nbrId of sp.adj) {
      const nbrSp = adv.spaces[nbrId];
      if (!nbrSp || nbrSp.type === 'gateway') continue;
      const edgeKey = [id, nbrId].sort().join('|');
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);
      const nB = adv.nodes[nbrId];
      if (!nB) continue;
      const bothVisited = isVisited(id) && isVisited(nbrId);
      svg += `<line x1="${nA.x}" y1="${nA.y}" x2="${nB.x}" y2="${nB.y}" class="map-edge ${bothVisited ? 'visited' : ''}" />`;
    }
  }

  // Monster access lines
  for (const m of Object.values(adv.monsters)) {
    const mn = adv.mNodes[m.id];
    if (!mn) continue;
    for (const sid of m.accessFrom) {
      const sn = adv.nodes[sid];
      if (!sn) continue;
      const ms = state.monsterState[m.id];
      svg += `<line x1="${sn.x}" y1="${sn.y}" x2="${mn.x}" y2="${mn.y}" class="monster-access-line ${ms.defeated ? 'defeated' : isVisited(sid) ? 'accessible' : ''}" />`;
    }
  }

  // Monster nodes
  for (const m of Object.values(adv.monsters)) {
    const mn = adv.mNodes[m.id];
    if (!mn) continue;
    const ms = state.monsterState[m.id];
    const hasAccess = m.accessFrom.some(sid => isVisited(sid));
    const cls = ms.defeated ? 'monster-node defeated' : m.isBoss ? 'monster-node boss' : hasAccess ? 'monster-node accessible' : 'monster-node';
    const pct = ms.health / m.hp;
    svg += `<rect x="${mn.x-22}" y="${mn.y-14}" width="44" height="28" rx="4" class="${cls}" />`;
    if (!ms.defeated) {
      svg += `<rect x="${mn.x-20}" y="${mn.y+2}" width="${Math.round(40*pct)}" height="6" class="monster-hp-fill" />`;
      svg += `<rect x="${mn.x-20}" y="${mn.y+2}" width="40" height="6" fill="none" stroke="#555" stroke-width="1" />`;
    }
    svg += `<text x="${mn.x}" y="${mn.y-2}" class="monster-label">${ms.defeated ? '✓' : m.name.split(' ')[0]}</text>`;
  }

  // Space nodes (map is read-only reference — no click handlers)
  for (const [id, sp] of Object.entries(adv.spaces)) {
    if (sp.type === 'gateway') continue;
    const n = adv.nodes[id];
    if (!n) continue;
    const vis = isVisited(id);
    const highlighted = highlightSet.has(id);
    const rubbleProg = sp.type === 'rubble' ? (state.rubbleProgress[id] ?? 0) : -1;
    const isPartialRubble = rubbleProg === 1;

    let cls = 'space-node';
    if (sp.type === 'start')    cls += ' start-node';
    else if (sp.type === 'fist')    cls += ' fist-node';
    else if (sp.type === 'gold')    cls += ' gold-node';
    else if (sp.type === 'gem')     cls += ' gem-node';
    else if (sp.type === 'treasure')cls += ' chest-node';
    else if (sp.type === 'rubble')  cls += ' rubble-node';

    if (vis)            cls += ' visited';
    if (isPartialRubble) cls += ' partial';
    if (highlighted)    cls += ' available';

    const r = sp.type === 'start' ? 16 : 14;

    // Indicate chosen cluster start spaces differently
    let extraAttr = '';
    if (sp.type === 'start' && state.clusterChoice) {
      const inChosen = state.clusterChoice === 'left'
        ? adv.leftStarts.includes(id)
        : adv.rightStarts.includes(id);
      if (!inChosen && !vis) cls += ' other-cluster';
    }

    svg += `<circle cx="${n.x}" cy="${n.y}" r="${r}" class="${cls}" />`;

    let lbl = sp.label;
    if (sp.type === 'fist') lbl = lbl + '✊';
    if (isPartialRubble) lbl = '½';
    if (vis && sp.type !== 'start' && sp.type !== 'fist') lbl = '✓';

    svg += `<text x="${n.x}" y="${n.y+4}" class="space-label">${lbl}</text>`;
  }

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
        <button data-action="quit">Try Again</button>
      </div>
    </div>
  </div>`;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function attachListeners() {
  document.getElementById('app').addEventListener('click', e => {
    const t = e.target.closest('[data-action],[data-realm],[data-split],[data-visitspace],[data-attack],[data-bswap],[data-chest],[data-cluster]');
    if (!t) return;

    if (t.dataset.realm)       { initGame(t.dataset.realm); return; }
    if (t.dataset.cluster)     { chooseCluster(t.dataset.cluster); return; }
    if (t.dataset.split)       { selectSplit(+t.dataset.split); return; }
    if (t.dataset.visitspace)  {
      if (state.phase === 'torch') assignTorchToSpace(t.dataset.visitspace);
      else assignToSpace(t.dataset.visitspace);
      return;
    }
    if (t.dataset.attack)      { assignToMonster(t.dataset.attack); return; }
    if (t.dataset.bswap)       { const [p,d] = t.dataset.bswap.split('-').map(Number); swapBlackDie(p,d); return; }
    if (t.dataset.chest)       { chooseChestReward(t.dataset.chest); return; }

    const action = t.dataset.action;
    if      (action === 'roll')         rollDice();
    else if (action === 'confirmPairs') confirmPairs();
    else if (action === 'forfeit')      forfeitPair();
    else if (action === 'useTorch')     useTorch();
    else if (action === 'cancelTorch')  { state.phase = 'assignPair'; render(); }
    else if (action === 'quit')         { state.screen = 'setup'; render(); }
  }, { once: true });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

render();
