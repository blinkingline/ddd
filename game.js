'use strict';

// ─── Layout Editor ────────────────────────────────────────────────────────────
let layoutMode = false;
let layoutOverrides = {};  // { spaceId: {x, y} }

function toggleLayoutMode() {
  layoutMode = !layoutMode;
  render();
}

function copyLayoutCoords() {
  const adv = getAdv();
  const lines = [];
  for (const [id, node] of Object.entries(adv.nodes)) {
    const pos = layoutOverrides[id] || node;
    const x = Math.round(pos.x), y = Math.round(pos.y);
    const comment = adv.monsters[id] ? `  // ${adv.monsters[id].name}` : '';
    lines.push(`    '${id}':{x:${x}, y:${y}},${comment}`);
  }
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    const btn = document.getElementById('layout-copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Coords'; }, 2000); }
  });
}

function initLayoutDrag() {
  if (!layoutMode) return;
  const svg = document.querySelector('.dungeon-map');
  if (!svg) return;

  let dragging = null;
  let startSVG = null;
  let startPos = null;

  function toSVGCoords(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener('pointerdown', e => {
    const node = e.target.closest('[data-spaceid]');
    if (!node) return;
    dragging = node.dataset.spaceid;
    startSVG = toSVGCoords(e);
    const adv = getAdv();
    const cur = layoutOverrides[dragging] || adv.nodes[dragging];
    startPos = { x: cur.x, y: cur.y };
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const pt = toSVGCoords(e);
    const dx = pt.x - startSVG.x, dy = pt.y - startSVG.y;
    const newX = Math.round(startPos.x + dx);
    const newY = Math.round(startPos.y + dy);
    const el = svg.querySelector(`[data-spaceid="${dragging}"]`);
    if (!el) return;
    if (el.tagName === 'circle') {
      el.setAttribute('cx', newX);
      el.setAttribute('cy', newY);
    } else {
      const hw = +el.dataset.hw, hh = +el.dataset.hh;
      el.setAttribute('x', newX - hw);
      el.setAttribute('y', newY - hh);
    }
  });

  svg.addEventListener('pointerup', e => {
    if (!dragging) return;
    const pt = toSVGCoords(e);
    const dx = pt.x - startSVG.x, dy = pt.y - startSVG.y;
    layoutOverrides[dragging] = {
      x: Math.round(startPos.x + dx),
      y: Math.round(startPos.y + dy),
    };
    dragging = null;
    render();  // full re-render snaps lines to new position
  });
}

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
  cloudAssignments: {},
  cloudSetupSelected: null,
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
    cloudAssignments: {},
    cloudSetupSelected: null,
    bossDamageDealt: 0,
    lifeLostCount: 0,
    round: 0,
    phase: advKey === 'pyramid' ? 'cloudSetup' : 'roll',
    whiteDice: [0,0,0,0], blackDie: 0,
    selectedSplit: null, useBlackDieInPair: null,
    pairs: null, pairActions: [null, null],
    currentPair: 0,
    roundDamageDealt: false, damageExemptForfeit: false,
    pendingChest: null,
    message: advKey === 'pyramid' ? 'Puzzled Pyramid: Assign numbers to cloud spaces.' : `Welcome to ${adv.name}! Roll the dice to begin.`,
  });
  const monsterState = {};
  for (const [id, m] of Object.entries(adv.monsters)) {
    monsterState[id] = { health: m.hp, unlockedWhite: new Set(), defeated: false, totalDamage: 0 };
  }
  state.monsterState = monsterState;
  const achievementState = {};
  for (const [id, a] of Object.entries(adv.achievements)) {
    achievementState[id] = { 
      done: false, 
      count: a.count ?? 0, 
      progress: a.type === 'set' ? new Set() : (a.progress instanceof Set ? new Set() : false) 
    };
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
  let num = sp.value;
  if (sp.type === 'cloud') num = state.cloudAssignments?.[spaceId] ?? sp.value;
  
  if (num === null || num !== pair.total) return false;

  // Any start space is freely visitable with a matching roll — no adjacency required
  if (sp.type === 'start') return true;

  // Fist spaces: need matching value AND doubles
  if (sp.type === 'fist' && pair.dice[0] !== pair.dice[1]) return false;
  
  // Gateway check for Puzzled Pyramid
  if (sp.type === 'gateway' && !state.visitedSpaces.has('cloudGate')) return false;

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
  state.phase = 'roll';
  state.message = `Rolled: [${state.whiteDice.join(', ')}] + black [${state.blackDie}]. Choose how to split the white dice.`;
  
  // Transition to selection
  state.phase = 'selectSplit';
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
  if (sp.type === 'gold')  state.gold++;
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

  // Claw spaces (Defiant Dinosaurs): unlock matching white numbers for all monsters that have them
  if (sp.type === 'claw') {
    for (const [mid, m] of Object.entries(adv.monsters)) {
      if (m.white.includes(sp.value)) {
        state.monsterState[mid].unlockedWhite.add(sp.value);
      }
    }
    checkAchievement('claw6of7', spaceId);
  }

  // Cloud spaces
  if (sp.type === 'cloud') {
    const effectiveVal = state.cloudAssignments?.[spaceId] ?? sp.value;
    if (effectiveVal === 11) {
      // Auto-visit the blank gateway cloud (space 37) that connects to the far side
      state.visitedSpaces.add('37');
      state.message += ' — Cloud Gateway unlocked!';
    }
    // Count achievement only for player-assignable pool clouds
    if (adv.cloudPoolIds && adv.cloudPoolIds.includes(spaceId)) {
      checkAchievement('allClouds', spaceId);
    }
  }


  // Rubble achievement
  if (sp.type === 'rubble') checkAchievement('rubble6of7', spaceId);

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
  
  // Cultists: only track the two Mancers for the achievement
  if (state.adventure === 'cultists' && ['2','4'].includes(monsterId)) {
    checkAchievement('bothMancers', monsterId);
  }

  // Dinosaurs: track armored dinosaur defeats
  if (state.adventure === 'dinosaurs') {
    const m = adv.monsters[monsterId];
    if (m && m.isArmored) checkAchievement('armoredDinos', monsterId);
  }

  // Worm parts: on defeat, deal 3 damage to Sandy and track achievement
  if (m.isWorm) {
    const bossId = Object.keys(adv.monsters).find(mid => adv.monsters[mid].isBoss);
    if (bossId) {
      dealDamage(bossId, 3);
      state.message += ` Sandy takes 3 damage!`;
    }
    checkAchievement('allWorms', monsterId);
  }

  checkGameEnd();
}

function forfeitPair() {
  const pair = state.pairs[state.currentPair];
  pair.forfeited = true;
  const isFree = state.currentPair === 1 && state.roundDamageDealt;
  if (isFree) state.damageExemptForfeit = true;
  state.message = isFree
    ? 'Pair 2 forfeited — free (damage already dealt this round).'
    : `Pair ${state.currentPair + 1} forfeited — −1 life.`;
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
  } else if (ach.type === 'set') {
    as.progress.add(triggerId);
    if (as.progress.size >= ach.threshold) {
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
  const btns = Object.values(ADVENTURES).map(adv => `
    <button class="realm-btn" data-realm="${adv.key}" style="border-color:${adv.color}">
      <div class="realm-title">${adv.name}</div>
      <div style="font-size:0.85em;color:#aaa;margin-top:6px">${adv.difficulty}</div>
    </button>`).join('');
  return `<div class="realm-selector">
    <h1>&#x1F3B2; Dungeons, Dice &amp; Danger &#x1F3B2;</h1>
    <p>Solo adventure</p>
    <div class="realm-grid" style="max-width:600px;margin:0 auto">
      ${btns}
    </div>
  </div>`;
}

function renderLayoutToolbar() {
  if (!layoutMode) {
    return `<div style="text-align:right;margin-bottom:4px">
      <button data-action="toggleLayout" style="font-size:11px;padding:3px 8px;opacity:0.5">Layout Mode</button>
    </div>`;
  }
  return `<div style="text-align:right;margin-bottom:4px;display:flex;gap:6px;justify-content:flex-end;align-items:center">
    <span style="font-size:11px;color:#f1c40f">Layout Mode ON — drag nodes to reposition</span>
    <button id="layout-copy-btn" data-action="copyLayout" style="font-size:11px;padding:3px 8px">Copy Coords</button>
    <button data-action="toggleLayout" style="font-size:11px;padding:3px 8px">Done</button>
  </div>`;
}

function renderGame() {
  return `<div class="game-container">
    ${renderHeader()}
    <div class="game-grid">
      <div class="phase-panel">
        ${renderPhaseUI()}
      </div>
      <div class="center-panel">
        ${renderLayoutToolbar()}
        <div class="board-container${layoutMode ? ' layout-mode' : ''}">${renderSVGMap()}</div>
        <div class="message-box">${state.message}</div>
      </div>
      <div class="status-panel">
        ${renderStatusCard()}
        ${renderMonsterPanel()}
        ${renderAchievements()}
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
    const leftSet  = new Set(adv.leftStarts  || []);
    const rightSet = new Set(adv.rightStarts || []);
    const cluster  = leftSet.has(spaceId) ? 'Left' : rightSet.has(spaceId) ? 'Right' : '';
    return `${cluster ? cluster + ' start' : 'Start'}: ${sp.value}`;
  }
  if (sp.type === 'doubles') return '✊✊ Doubles space (any matching pair)';
  const info = {
    fist:    { icon: '✊', name: 'Fist',   note: 'damages all monsters' },
    gem:     { icon: '💎', name: 'Gem',    note: '+1 gem' },
    gold:    { icon: '🪙', name: 'Gold',   note: '+1 gold' },
    chest:   { icon: '📦', name: 'Chest',  note: 'choose a reward' },
    rubble:  { icon: '🪨', name: 'Rubble', note: 'needs 2 visits' },
    claw:    { icon: '🦴', name: 'Claw',   note: 'unlocks monster numbers' },
    cloud:   { icon: '☁',  name: 'Cloud',  note: '' },
    regular: { icon: '',   name: '',       note: '' },
  };
  const t = info[sp.type] || { icon: '', name: sp.type, note: '' };
  const parts = [t.icon, t.name || '', sp.value, t.note ? `— ${t.note}` : ''].filter(x => x !== '' && x !== null && x !== undefined);
  return parts.join(' ');
}

function renderPhaseUI() {
  if (state.phase === 'cloudSetup') return renderCloudSetup();
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
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
        <button class="roll-btn" data-action="confirmPairs" style="font-size:1.1em;padding:12px">Confirm Pairs →</button>
        <button class="roll-btn" data-action="undoSplit" style="font-size:0.9em;padding:8px;background:rgba(255,255,255,0.05);border-color:#666;color:#aaa">← Back</button>
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
        <button class="action-btn skip" data-forfeit="${i}">${i === 1 && state.roundDamageDealt ? 'Forfeit Pair 2 (free — damage dealt)' : 'Forfeit (−1 life)'}</button>
      </div>`;
    }).join('');

    return `${bar}<div class="assign-section">
      ${pairPanels}
      ${state.torches > 0 ? `<div class="pair-footer" style="margin-top:10px"><button class="action-btn" data-action="useTorch">&#x1F525; Torch (${state.torches})</button></div>` : ''}
    </div>`;
  }

  return bar;
}


function renderCloudSetup() {
  const adv = getAdv();
  const pool = remainingCloudPool();
  const assigned = state.cloudAssignments || {};
  const cloudSpaces = adv.cloudPoolIds
    ? adv.cloudPoolIds.map(id => adv.spaces[id])
    : Object.values(adv.spaces).filter(s => s.type === 'cloud' && s.value === null && s.id !== '37');
  
  const cloudItems = cloudSpaces.map(sp => {
    const num = assigned[sp.id];
    const isSelected = state.cloudSetupSelected === sp.id;
    const label = num !== undefined ? `${num}` : '?';
    return `<div class="cloud-setup-item ${isSelected ? 'selected' : ''} ${num !== undefined ? 'assigned' : ''}" data-action="cloudSetupSelect" data-id="${sp.id}">
      <div class="cloud-label">${label}</div>
      ${num !== undefined ? `<button class="cloud-clear" data-action="cloudSetupClear" data-id="${sp.id}">×</button>` : ''}
    </div>`;
  }).join('');

  const poolBtns = pool.map(n => 
    `<button class="cloud-num-btn ${state.cloudSetupSelected ? '' : 'disabled'}" data-action="cloudSetupAssign" data-num="${n}">${n}</button>`
  ).join('');

  const canStart = pool.length === 0;

  return `<div class="cloud-setup-modal">
    <h3>Assign Numbers to Cloud Spaces</h3>
    <p>Puzzled Pyramid: Assign each number in the pool to a cloud space.</p>
    <div class="cloud-setup-grid">${cloudItems}</div>
    <div class="cloud-pool">
      <span>Pool: </span>${poolBtns}
    </div>
    ${canStart ? `<button class="roll-btn" data-action="startAdventure" style="margin-top:20px">Start Adventure</button>` : ''}
  </div>`;
}

function remainingCloudPool() {
  const adv = getAdv();
  const pool = [3, 4, 5, 6, 8, 9, 10, 11];
  const used = new Set(Object.values(state.cloudAssignments || {}));
  return pool.filter(n => !used.has(n));
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

  const W = 1000, H = 720;
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="dungeon-map">`;

  // Clip a line to the edge of a circle node (radius r)
  function circleExit(cx, cy, r, toX, toY) {
    const dx = toX - cx, dy = toY - cy;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) return [cx, cy];
    return [cx + (dx * r) / d, cy + (dy * r) / d];
  }

  // Clip a line to the edge of a monster rectangle (half-widths hw, hh)
  function rectExit(cx, cy, hw, hh, toX, toY) {
    const dx = toX - cx, dy = toY - cy;
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return [cx, cy];
    const tx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
    const ty = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty);
    return [cx + dx*t, cy + dy*t];
  }

  function nodePos(id) {
    const base = adv.nodes[id];
    if (!base) return null;
    return layoutOverrides[id] ? { ...base, ...layoutOverrides[id] } : base;
  }

  // ── Space-to-space connectors (thin, professional lines) ──
  {
    const drawnEdges = new Set();
    for (const [id, sp] of Object.entries(adv.spaces)) {
      if (sp.type === 'monster') continue;
      const nA = nodePos(id); if (!nA) continue;
      const hsA = 28;
      const vA = isVisited(id);
      for (const nbrId of sp.adj) {
        const nbrSp = adv.spaces[nbrId];
        if (!nbrSp || nbrSp.type === 'monster') continue;
        if (sp.type === 'cloud' && nbrSp.type === 'cloud') continue;
        const edgeKey = [id, nbrId].sort().join('|');
        if (drawnEdges.has(edgeKey)) continue;
        drawnEdges.add(edgeKey);
        const nB = nodePos(nbrId); if (!nB) continue;
        const hsB = 28;
        const vB = isVisited(nbrId);
        const cls = vA && vB ? 'visited' : (vA || vB) ? 'frontier' : '';
        const [ex1, ey1] = circleExit(nA.x, nA.y, hsA, nB.x, nB.y);
        const [ex2, ey2] = circleExit(nB.x, nB.y, hsB, nA.x, nA.y);
        svg += `<line x1="${ex1}" y1="${ey1}" x2="${ex2}" y2="${ey2}" class="map-edge-thin ${cls}" />`;
      }
    }
  }

  // Monster rooms: access lines
  for (const [mid, m] of Object.entries(adv.monsters)) {
    const mn = nodePos(mid);
    if (!mn) continue;
    const ms = state.monsterState[mid];
    const monsterRoom = adv.spaces[mid];
    const hasAccess = monsterRoom.adj.some(sid => isVisited(sid));

    const mW = m.isBoss ? 108 : 72;
    const mH = ms.defeated ? 34 : (m.isBoss ? 76 : 55);
    for (const sid of monsterRoom.adj) {
      const sn = nodePos(sid);
      if (!sn) continue;
      const hsS = 28;
      const lineState = ms.defeated ? 'defeated' : isVisited(sid) ? 'accessible' : '';
      const [ex1, ey1] = circleExit(sn.x, sn.y, hsS, mn.x, mn.y);
      const [ex2, ey2] = rectExit(mn.x, mn.y, mW/2, mH/2, sn.x, sn.y);
      svg += `<line x1="${ex1}" y1="${ey1}" x2="${ex2}" y2="${ey2}" class="monster-access-line-thin ${lineState}" />`;
    }

    const cls = ms.defeated ? 'monster-node defeated' : m.isBoss ? 'monster-node boss' : hasAccess ? 'monster-node accessible' : 'monster-node';
    const pct = ms.health / m.hp;
    svg += `<rect x="${mn.x-mW/2}" y="${mn.y-mH/2}" width="${mW}" height="${mH}" rx="4" class="${cls}" data-spaceid="${mid}" data-hw="${mW/2}" data-hh="${mH/2}"/>`;
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
    const n = nodePos(id);
    if (!n) continue;
    const vis = isVisited(id);
    const highlighted = highlightSet.has(id);
    const cloudSetupHighlight = state.phase === 'cloudSetup' && state.cloudSetupSelected === id;

    let cls = 'space-node';
    if (sp.type === 'start')         cls += ' start-node';
    else if (sp.type === 'fist')    cls += ' fist-node';
    else if (sp.type === 'gem')     cls += ' gem-node';
    else if (sp.type === 'gold')    cls += ' gold-node';
    else if (sp.type === 'chest')   cls += ' chest-node';
    else if (sp.type === 'doubles') cls += ' doubles-node';
    else if (sp.type === 'rubble')  cls += ' rubble-node';
    else if (sp.type === 'cloud')   cls += ' cloud-node';
    else if (sp.type === 'claw')    cls += ' claw-node';
    else if (sp.type === 'worm')    cls += ' worm-node';

    if (vis)                cls += ' visited';
    if (highlighted)        cls += ' available';
    if (cloudSetupHighlight) cls += ' cloud-setup-selected';

    const hs = sp.type === 'start' ? 28 : 28;
    // Opaque backing circle masks edges that pass behind this node
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${hs+2}" fill="#1a1a1a" stroke="none"/>`;
    // data-spaceid always present so hover can find it; data-visitspace makes it clickable
    const clickAttr = highlighted || state.phase === 'torch' ? ` data-visitspace="${id}"` : '';
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${hs}" class="${cls}" data-spaceid="${id}"${clickAttr}/>`;

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
    } else if (sp.type === 'worm' && !vis) {
      svg += `<text x="${n.x}" y="${n.y+4}" class="fist-icon-lbl">🐛</text>`;
    } else if (sp.type === 'claw' && !vis) {
      svg += `<text x="${n.x}" y="${n.y+4}" class="fist-icon-lbl">🦴</text>`;
    } else if (sp.type === 'rubble' && !vis) {
      const prog = state.rubbleProgress[id] ?? 0;
      if (prog === 1) {
        svg += `<text x="${n.x}" y="${n.y+4}" class="space-label">½</text>`;
      } else {
        svg += `<text x="${n.x}" y="${n.y+4}" class="space-label">${sp.value}</text>`;
      }
    } else {
      let lbl = sp.value !== null ? String(sp.value) : '';
      if (vis && sp.type !== 'start' && sp.type !== 'fist' && sp.type !== 'worm' && sp.type !== 'claw') lbl = '✓';
      svg += `<text x="${n.x}" y="${n.y+4}" class="space-label">${lbl}</text>`;
    }
  }

  // ── Cloud rule note (PP only) ─────────────────────────────────────────────
  if (adv.cloudPoolIds) {
    svg += `<text x="500" y="${H - 52}" class="cloud-rule-note" text-anchor="middle">☁ Cloud spaces are all connected to each other — move freely between any two cloud spaces</text>`;
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  const ly = H - 38;
  svg += `<line x1="0" y1="${ly-4}" x2="${W}" y2="${ly-4}" stroke="#333" stroke-width="1"/>`;
  const legend = [
    { x:14,  cls:'space-node start-node',   label:'Start' },
    { x:100, cls:'space-node gem-node',      label:'Gem' },
    { x:160, cls:'space-node chest-node',    label:'Chest' },
    { x:240, cls:'space-node fist-node',     label:'Fist ✊' },
    { x:330, cls:'space-node doubles-node',  label:'Doubles' },
    { x:430, cls:'space-node rubble-node',   label:'Rubble' },
    { x:520, cls:'space-node visited',       label:'Visited' },
  ];
  for (const {x, cls, label} of legend) {
    svg += `<circle cx="${x}" cy="${ly+6}" r="8" class="${cls}"/>`;
    svg += `<text x="${x+13}" y="${ly+10}" class="legend-text">${label}</text>`;
  }
  // doubles mini-dice in legend
  svg += `<rect x="458" y="${ly+1}" width="6" height="6" rx="1" class="dice-icon-mini"/>`;
  svg += `<rect x="466" y="${ly+1}" width="6" height="6" rx="1" class="dice-icon-mini"/>`;
  // fist icon in legend
  svg += `<text x="310" y="${ly+9}" class="fist-icon-lbl" style="font-size:8px">✊</text>`;
  // Monster legend entry
  svg += `<rect x="700" y="${ly-2}" width="48" height="18" rx="3" class="monster-node"/>`;
  svg += `<text x="724" y="${ly+10}" class="monster-label">Monster</text>`;

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
    if (action === 'cloudSetupSelect') { state.cloudSetupSelected = t.dataset.id; render(); return; }
    if (action === 'cloudSetupClear') { delete state.cloudAssignments[t.dataset.id]; render(); return; }
    if (action === 'cloudSetupAssign') {
      if (!state.cloudSetupSelected) return;
      if (!state.cloudAssignments) state.cloudAssignments = {};
      state.cloudAssignments[state.cloudSetupSelected] = +t.dataset.num;
      state.cloudSetupSelected = null;
      render();
      return;
    }
    if (action === 'startAdventure') {
      state.phase = 'roll';
      state.message = 'Adventure begins! Roll the dice.';
      render();
      return;
    }

    if      (action === 'roll')         rollDice();
    else if (action === 'confirmPairs') confirmPairs();
    else if (action === 'undoSplit')    { state.phase = 'selectSplit'; state.selectedSplit = null; state.pairs = []; state.useBlackDieInPair = null; render(); }
    else if (action === 'forfeit')      forfeitPair();
    else if (action === 'useTorch')     useTorch();
    else if (action === 'cancelTorch')  { state.phase = 'assignPair'; render(); }
    else if (action === 'quit')         { state.screen = 'setup'; render(); }
    else if (action === 'toggleLayout') toggleLayoutMode();
    else if (action === 'copyLayout')   copyLayoutCoords();
  };
  app.addEventListener('click', _appClickHandler);
  initLayoutDrag();

  // Hovering an option button highlights the corresponding space on the map
  app.addEventListener('mouseover', e => {
    const btn = e.target.closest('.option-btn[data-visitspace]');
    if (btn) {
      const el = app.querySelector(`[data-spaceid="${btn.dataset.visitspace}"]`);
      if (el) el.classList.add('btn-hovered');
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
          const el = app.querySelector(`[data-spaceid="${sid}"]`);
          if (el) el.classList.add('btn-hovered');
        });
      }
    }
  });
  app.addEventListener('mouseout', e => {
    const btn = e.target.closest('.option-btn[data-visitspace]');
    if (btn) {
      const el = app.querySelector(`[data-spaceid="${btn.dataset.visitspace}"]`);
      if (el) el.classList.remove('btn-hovered');
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
