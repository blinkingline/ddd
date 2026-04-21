'use strict';

// ── Game Data ─────────────────────────────────────────────────────────────────

const REALMS = {
  defiant: {
    name: 'Defiant Dinosaurs',
    color: '#d4832f',
    spaces: buildLinearSpaces(),
    monsters: {
      '3':    { name: 'Dino Scout',    health: 3,  gems: 1 },
      '5':    { name: 'Stego Guard',   health: 4,  gems: 1 },
      '7':    { name: 'Tri-Horn',      health: 5,  gems: 2 },
      '9':    { name: 'Velocirapt',    health: 4,  gems: 1 },
      '11':   { name: 'Ankylo Guard',  health: 6,  gems: 2 },
      'boss': { name: 'Rex the Tyrant',health: 12, gems: 5 },
    },
  },
  pyramid: {
    name: 'Puzzled Pyramid',
    color: '#c4a557',
    spaces: buildLinearSpaces(),
    monsters: {
      '2':    { name: 'Scarab',             health: 2,  gems: 1 },
      '4':    { name: 'Mummy',              health: 4,  gems: 1 },
      '6':    { name: 'Sand Elemental',     health: 5,  gems: 2 },
      '8':    { name: 'Curse Guardian',     health: 4,  gems: 1 },
      '10':   { name: "Pharaoh's Servant",  health: 6,  gems: 2 },
      'boss': { name: "Pharaoh's Curse",    health: 12, gems: 5 },
    },
  },
  cultists: {
    name: 'Clumsy Cultists',
    color: '#6b9bb5',
    spaces: buildLinearSpaces(),
    monsters: {
      '3':    { name: 'Cultist',        health: 3,  gems: 1 },
      '5':    { name: 'Zealot',         health: 4,  gems: 1 },
      '7':    { name: 'High Priest',    health: 5,  gems: 2 },
      '9':    { name: 'Shadow Acolyte', health: 4,  gems: 1 },
      '11':   { name: 'Cult Leader',    health: 6,  gems: 2 },
      'boss': { name: 'Derek the Observer', health: 12, gems: 5 },
    },
  },
  animals: {
    name: 'Annoyed Animals',
    color: '#7a9b5c',
    spaces: buildLinearSpaces(),
    monsters: {
      '2':    { name: 'Angry Hare',   health: 2,  gems: 1 },
      '4':    { name: 'Growling Wolf',health: 4,  gems: 1 },
      '6':    { name: 'Rampant Bear', health: 5,  gems: 2 },
      '8':    { name: 'Enraged Elk',  health: 4,  gems: 1 },
      '10':   { name: 'Savage Boar',  health: 6,  gems: 2 },
      'boss': { name: 'Barry Bearcub',health: 12, gems: 5 },
    },
  },
};

// Build the shared linear track adjacency map.
// start ↔ 1 ↔ 2 ↔ … ↔ 12 ↔ boss  (with start also adjacent to 2 per original)
function buildLinearSpaces() {
  const spaces = {};
  const ids = ['start', ...Array.from({length: 12}, (_, i) => String(i + 1)), 'boss'];
  ids.forEach((id, idx) => {
    const adjacent = [];
    if (idx > 0) adjacent.push(ids[idx - 1]);
    if (idx < ids.length - 1) adjacent.push(ids[idx + 1]);
    // original also had start adjacent to '2'
    if (id === 'start') adjacent.push('2');
    if (id === '2') adjacent.push('start');
    spaces[id] = { adjacent: [...new Set(adjacent)] };
  });
  return spaces;
}

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  screen: 'setup',       // 'setup' | 'playing'
  realm: 'defiant',
  playerLife: 10,
  maxLife: 10,
  gems: 0,
  currentSpace: 'start',
  visitedSpaces: new Set(['start']),
  defeatedMonsters: new Set(),
  diceRolls: null,       // { dice1: [a,b], dice2: [a,b] } | null
  isRolling: false,
  currentMonster: null,  // monster object | null
  monsterHealth: 0,
  availableMoves: [],
  message: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function d6() { return Math.floor(Math.random() * 6) + 1; }

function getReachableSpaces(startId, distance) {
  const spaces = REALMS[state.realm].spaces;
  let frontier = [startId];
  const visited = new Set([startId]);

  for (let i = 0; i < distance; i++) {
    const next = [];
    for (const id of frontier) {
      for (const adj of (spaces[id]?.adjacent || [])) {
        if (!visited.has(adj)) {
          visited.add(adj);
          next.push(adj);
        }
      }
    }
    frontier = next;
  }
  return frontier;
}

// ── Actions ───────────────────────────────────────────────────────────────────

function startGame(realmKey) {
  const realm = REALMS[realmKey];
  Object.assign(state, {
    screen: 'playing',
    realm: realmKey,
    playerLife: 10,
    maxLife: 10,
    gems: 0,
    currentSpace: 'start',
    visitedSpaces: new Set(['start']),
    defeatedMonsters: new Set(),
    diceRolls: null,
    isRolling: false,
    currentMonster: null,
    monsterHealth: 0,
    availableMoves: [],
    message: `Welcome to ${realm.name}! Roll the dice to start.`,
  });
  render();
}

function rollDice() {
  if (state.isRolling || state.playerLife <= 0) return;
  state.isRolling = true;
  state.diceRolls = null;
  render();

  setTimeout(() => {
    state.diceRolls = {
      dice1: [d6(), d6()],
      dice2: [d6(), d6()],
    };
    state.isRolling = false;
    state.message = 'Choose how to use your dice pairs!';
    render();
  }, 800);
}

function handleDiceAction(action) {
  if (!state.diceRolls && action !== 'skip') return;

  if (action === 'move') {
    const distance = state.diceRolls.dice1[0] + state.diceRolls.dice1[1];
    state.availableMoves = getReachableSpaces(state.currentSpace, distance);
    state.message = `You rolled ${distance}! Click a highlighted space to move there.`;
    state.diceRolls = null;

  } else if (action === 'fight') {
    const damage = state.diceRolls.dice2[0] + state.diceRolls.dice2[1];
    state.diceRolls = null;
    state.availableMoves = [];

    if (state.currentMonster) {
      state.monsterHealth -= damage;
      if (state.monsterHealth <= 0) {
        state.gems += state.currentMonster.gems;
        state.defeatedMonsters.add(state.currentSpace);
        const name = state.currentMonster.name;
        const reward = state.currentMonster.gems;
        state.currentMonster = null;
        state.message = `Victory! You defeated ${name} and gained ${reward} gem${reward !== 1 ? 's' : ''}!`;
      } else {
        state.message = `You deal ${damage} damage! Monster has ${state.monsterHealth} HP left.`;
      }
    } else {
      state.message = 'No monster to fight here!';
    }

  } else if (action === 'skip') {
    state.playerLife = Math.max(0, state.playerLife - 1);
    state.diceRolls = null;
    state.availableMoves = [];
    state.message = 'You skip your turn and lose 1 life point!';
  }

  render();
}

function moveToSpace(targetId) {
  if (!state.availableMoves.includes(targetId)) return;

  state.visitedSpaces.add(targetId);
  state.currentSpace = targetId;
  state.availableMoves = [];

  const monster = REALMS[state.realm].monsters[targetId];
  if (monster && !state.defeatedMonsters.has(targetId)) {
    state.currentMonster = monster;
    state.monsterHealth = monster.health;
    state.message = `You encounter a ${monster.name}!`;
  } else if (monster) {
    state.message = `Space ${targetId} — already cleared!`;
  } else {
    state.message = `You reach space ${targetId} — safe for now.`;
  }

  render();
}

// ── Render ────────────────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  app.className = 'app';
  if (state.screen === 'playing') {
    app.style.setProperty('--theme-color', REALMS[state.realm].color);
  } else {
    app.style.setProperty('--theme-color', '#d4832f');
  }

  app.innerHTML = state.screen === 'setup' ? renderSetup() : renderGame();
  attachListeners();
}

function renderSetup() {
  const realmButtons = Object.entries(REALMS).map(([key, realm]) => `
    <button class="realm-btn" data-realm="${key}" style="border-color: ${realm.color}">
      <div class="realm-title">${realm.name}</div>
    </button>
  `).join('');

  return `
    <div class="realm-selector">
      <h1>&#x1F3B2; Dungeons, Dice &amp; Danger &#x1F3B2;</h1>
      <p>Choose your realm of adventure:</p>
      <div class="realm-grid">${realmButtons}</div>
    </div>
  `;
}

function renderGame() {
  const realm = REALMS[state.realm];
  const totalMonsters = Object.keys(realm.monsters).length;
  const allDefeated = state.defeatedMonsters.size === totalMonsters;
  const isDead = state.playerLife <= 0;

  return `
    <div class="game-container">
      ${renderHeader()}
      <div class="game-grid">
        <div class="left-panel">
          ${renderStatusCard()}
          ${renderSpaceInfoCard()}
          ${state.currentMonster ? renderMonsterCard() : ''}
        </div>
        <div class="center-panel">
          ${renderDiceSection()}
          ${renderBoard()}
          <div class="message-box">${state.message}</div>
          ${isDead ? renderGameOver() : ''}
          ${allDefeated && !isDead ? renderVictory() : ''}
        </div>
      </div>
    </div>
  `;
}

function renderHeader() {
  return `
    <div class="game-header">
      <h2>${REALMS[state.realm].name}</h2>
      <button class="quit-btn" data-action="quit">Exit Realm</button>
    </div>
  `;
}

function renderStatusCard() {
  const hearts = Array.from({length: state.maxLife}, (_, i) =>
    `<span class="${i < state.playerLife ? 'heart-full' : 'heart-empty'}">&#x2665;</span>`
  ).join('');

  const spaceLabel = state.currentSpace === 'start' ? 'START'
    : state.currentSpace === 'boss' ? 'BOSS'
    : state.currentSpace;

  return `
    <div class="status-card">
      <div class="status-row"><span>&#x2764;&#xFE0F; Life:</span><span class="hearts">${hearts}</span></div>
      <div class="status-row"><span>&#x1F48E; Gems:</span><span class="gem-count">${state.gems}</span></div>
      <div class="status-row"><span>&#x1F4CD; Location:</span><span>${spaceLabel}</span></div>
      <div class="status-row"><span>&#x1F3C6; Defeated:</span><span>${state.defeatedMonsters.size}</span></div>
    </div>
  `;
}

function renderSpaceInfoCard() {
  const monster = REALMS[state.realm].monsters[state.currentSpace];
  const cleared = state.defeatedMonsters.has(state.currentSpace);

  if (monster && !cleared) {
    return `
      <div class="space-info-card has-monster">
        <div class="space-title">&#x26A0;&#xFE0F; Monster Here!</div>
        <div>${monster.name}</div>
        <div class="monster-details">HP: ${monster.health} | Reward: ${monster.gems} &#x1F48E;</div>
      </div>
    `;
  }
  return `<div class="space-info-card safe"><div class="space-title">&#x2713; Safe Space</div></div>`;
}

function renderMonsterCard() {
  const m = state.currentMonster;
  const pct = Math.max(0, (state.monsterHealth / m.health) * 100);
  return `
    <div class="monster-card">
      <h3>&#x2694;&#xFE0F; ${m.name}</h3>
      <div class="monster-health-text">HP: ${Math.max(0, state.monsterHealth)}/${m.health}</div>
      <div class="health-bar-visual">
        <div class="health-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

function renderDiceSection() {
  if (state.playerLife <= 0) return '<div class="dice-section">&#x1F480; Defeated</div>';

  if (state.isRolling) {
    return `
      <div class="dice-section">
        <button class="roll-btn rolling" disabled>&#x1F3B2; Rolling...</button>
      </div>
    `;
  }

  if (!state.diceRolls) {
    const disabled = state.isRolling || state.playerLife <= 0 ? 'disabled' : '';
    return `
      <div class="dice-section">
        <button class="roll-btn" data-action="roll" ${disabled}>&#x1F3B2; Roll Dice</button>
      </div>
    `;
  }

  const [d1a, d1b] = state.diceRolls.dice1;
  const [d2a, d2b] = state.diceRolls.dice2;

  return `
    <div class="dice-section">
      <div class="dice-display">
        <div class="dice-group">
          <p class="dice-label">Pair 1 (Move)</p>
          <div class="dice-pair">
            <div class="die">${d1a}</div>
            <div class="die">${d1b}</div>
          </div>
          <button class="action-btn" data-action="move">Move (${d1a + d1b})</button>
        </div>
        <div class="dice-group">
          <p class="dice-label">Pair 2 (Fight)</p>
          <div class="dice-pair">
            <div class="die">${d2a}</div>
            <div class="die">${d2b}</div>
          </div>
          <button class="action-btn" data-action="fight">Fight (${d2a + d2b} dmg)</button>
        </div>
        <div class="dice-group">
          <button class="action-btn skip" data-action="skip">Skip Turn (-1 HP)</button>
        </div>
      </div>
    </div>
  `;
}

function renderBoard() {
  const realm = REALMS[state.realm];
  const order = ['start', ...Array.from({length: 12}, (_, i) => String(i + 1)), 'boss'];

  const spaces = order.map(id => {
    const isCurrent   = state.currentSpace === id;
    const isAvailable = state.availableMoves.includes(id);
    const isCleared   = state.defeatedMonsters.has(id);
    const hasMonster  = !!realm.monsters[id] && !isCleared;

    const classes = ['board-space'];
    if (id === 'start') classes.push('start-space');
    if (id === 'boss')  classes.push('boss-space');
    if (isCurrent)      classes.push('current');
    if (isAvailable)    classes.push('available');
    if (isCleared)      classes.push('cleared');

    const icon = isCurrent ? '&#x1F9D9;'
      : isCleared          ? '&#x2713;'
      : hasMonster         ? '&#x2694;&#xFE0F;'
      : '';

    const label = id === 'start' ? 'START' : id === 'boss' ? 'BOSS' : id;
    const clickAttr = isAvailable ? `data-move="${id}"` : '';

    return `
      <div class="${classes.join(' ')}" ${clickAttr} title="${realm.monsters[id] ? realm.monsters[id].name : 'Safe'}">
        <span class="space-icon">${icon}</span>
        <span class="space-label">${label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="board-container">
      <div class="board-spaces">${spaces}</div>
    </div>
  `;
}

function renderGameOver() {
  return `
    <div class="game-over">
      &#x1F480; Game Over! You were defeated with ${state.gems} gem${state.gems !== 1 ? 's' : ''} earned.
      <button data-action="quit">Return to Realm Selection</button>
    </div>
  `;
}

function renderVictory() {
  return `
    <div class="victory">
      &#x1F3C6; Victory! You've defeated all monsters! Final Score: ${state.gems} gems
      <button data-action="quit">Play Another Realm</button>
    </div>
  `;
}

// ── Event Delegation ──────────────────────────────────────────────────────────

function attachListeners() {
  const app = document.getElementById('app');

  app.addEventListener('click', e => {
    const btn = e.target.closest('[data-action],[data-realm],[data-move]');
    if (!btn) return;

    const action = btn.dataset.action;
    const realm  = btn.dataset.realm;
    const move   = btn.dataset.move;

    if (realm)   startGame(realm);
    else if (move) moveToSpace(move);
    else if (action === 'roll')  rollDice();
    else if (action === 'move')  handleDiceAction('move');
    else if (action === 'fight') handleDiceAction('fight');
    else if (action === 'skip')  handleDiceAction('skip');
    else if (action === 'quit')  { state.screen = 'setup'; render(); }
  }, { once: true });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

render();
