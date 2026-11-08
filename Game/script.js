(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const screens = { start: $('startScreen'), shop: $('shopScreen'), pause: $('pauseScreen'), upgrade: $('upgradeScreen'), over: $('gameOverScreen') };
  const keys = new Set();
  let touchMove = { x: 0, y: 0 };
  const TAU = Math.PI * 2;
  let width = 0, height = 0, dpr = 1, lastTime = 0, animationId = 0, nextId = 1;
  let state = 'menu', player, enemies = [], bullets = [], shots = [], particles = [], gems = [], stars = [];
  let elapsed = 0, score = 0, kills = 0, wave = 1, spawnTimer = 0, shotTimer = 0, manualShotTimer = 0, shake = 0;
  let combo = 1, comboTimer = 0, maxCombo = 1, bossesDown = 0, lastWave = 1, toastTimer = 0;
  let best = readBest();
  let secretInput = '';
  let secretInputTimer = 0;
  let veers = readVeers();
  let ownedLoadout = readLoadout();
  let upgradeLevels = readUpgradeLevels();
  let selectedSector = readSector();
  let unlockedSectors = readUnlockedSectors();
  let autoFireEnabled = readAutoFireEnabled();
  let selectedBot = readSelectedBot();
  let transformed = false;
  let introTimer;

  const sectors = [
    { id: 'deep-space', code: 'SECTOR 09', name: 'DEEP SPACE', subtitle: 'THE LAST LIGHT', desc: 'A silent frontier threaded with drifting wreckage.', bg: '#090d1a', grid: 'rgba(94,125,177,.075)', star: '#b9d9ff', accent: '#61e7f5', price: 0 },
    { id: 'ember-belt', code: 'SECTOR 22', name: 'EMBER BELT', subtitle: 'FURNACE RUN', desc: 'A molten asteroid belt where every shadow burns.', bg: '#170d16', grid: 'rgba(177,96,94,.10)', star: '#ffd0ae', accent: '#ff9b72', price: 250 },
    { id: 'crystal-rift', code: 'SECTOR 47', name: 'CRYSTAL RIFT', subtitle: 'PRISMATIC VEIL', desc: 'A fractured nebula humming with impossible light.', bg: '#100d1c', grid: 'rgba(145,104,197,.11)', star: '#e5c7ff', accent: '#c19aff', price: 500 },
    { id: 'frost-moon', code: 'SECTOR 71', name: 'FROST MOON', subtitle: 'COLD ORBIT', desc: 'A frozen orbit where signals disappear beneath the ice.', bg: '#09151c', grid: 'rgba(83,166,190,.10)', star: '#c5f8ff', accent: '#7de8ff', price: 750 },
    { id: 'golden-graveyard', code: 'SECTOR 88', name: 'GOLDEN GRAVEYARD', subtitle: 'RELIC HUNT', bg: '#171308', grid: 'rgba(194,158,73,.11)', star: '#ffe9a8', accent: '#ffd166', price: 750 },
    { id: 'nebula-crown', code: 'SECTOR 103', name: 'NEBULA CROWN', subtitle: 'ROYAL STORM', bg: '#160c1d', grid: 'rgba(214,105,202,.11)', star: '#ffd1f8', accent: '#ec83df', price: 1500 },
    { id: 'black-tide', code: 'SECTOR 127', name: 'BLACK TIDE', subtitle: 'NO RETURN', bg: '#070b13', grid: 'rgba(93,112,149,.12)', star: '#b8c5e0', accent: '#8fa7d9', price: 3000 },
    { id: 'sunken-arc', code: 'SECTOR 144', name: 'SUNKEN ARC', subtitle: 'DROWNED SIGNAL', bg: '#07181a', grid: 'rgba(69,183,170,.11)', star: '#b5fff1', accent: '#54e0c4', price: 6000 },
    { id: 'thunder-wake', code: 'SECTOR 180', name: 'THUNDER WAKE', subtitle: 'STORM FRONT', bg: '#0d1220', grid: 'rgba(105,134,218,.12)', star: '#c9d8ff', accent: '#8aa8ff', price: 10000 },
    { id: 'event-horizon', code: 'SECTOR 209', name: 'EVENT HORIZON', subtitle: 'THE ENDLESS EDGE', bg: '#11070e', grid: 'rgba(214,74,114,.12)', star: '#ffc0d0', accent: '#ff668f', price: 18000 },
    { id: 'iron-catacomb', code: 'SECTOR 240', name: 'IRON CATACOMB', subtitle: 'MACHINE GRAVE', bg: '#121416', grid: 'rgba(150,160,169,.11)', star: '#dce4e8', accent: '#b7c8d0', price: 26000 },
    { id: 'violet-dawn', code: 'SECTOR 277', name: 'VIOLET DAWN', subtitle: 'PURPLE HOUR', bg: '#130b1c', grid: 'rgba(151,103,207,.12)', star: '#e5cfff', accent: '#b78cff', price: 36000 },
    { id: 'glass-ocean', code: 'SECTOR 318', name: 'GLASS OCEAN', subtitle: 'LIQUID SKY', bg: '#07151c', grid: 'rgba(88,180,215,.12)', star: '#c9f5ff', accent: '#65d8ff', price: 50000 },
    { id: 'ashen-ring', code: 'SECTOR 365', name: 'ASHEN RING', subtitle: 'LAST EMBER', bg: '#180c09', grid: 'rgba(194,104,72,.12)', star: '#ffd4bc', accent: '#ff9a6e', price: 70000 },
    { id: 'mirror-maze', code: 'SECTOR 411', name: 'MIRROR MAZE', subtitle: 'REFLECTED WAR', bg: '#0e121b', grid: 'rgba(112,164,203,.13)', star: '#d7efff', accent: '#8fd2ff', price: 95000 },
    { id: 'hollow-star', code: 'SECTOR 468', name: 'HOLLOW STAR', subtitle: 'LIGHTLESS CORE', bg: '#0b090f', grid: 'rgba(180,111,178,.12)', star: '#f5cbef', accent: '#d98bd1', price: 125000 },
    { id: 'seraphim-gate', code: 'SECTOR 520', name: 'SERAPHIM GATE', subtitle: 'ANGELIC ARRAY', bg: '#10131d', grid: 'rgba(172,188,221,.12)', star: '#edf3ff', accent: '#c2d4ff', price: 165000 },
    { id: 'red-cascade', code: 'SECTOR 604', name: 'RED CASCADE', subtitle: 'BLOOD ORBIT', bg: '#1b080d', grid: 'rgba(211,65,84,.13)', star: '#ffc6cd', accent: '#ff6f80', price: 220000 },
    { id: 'omega-veil', code: 'SECTOR 777', name: 'OMEGA VEIL', subtitle: 'BEYOND TIME', bg: '#090612', grid: 'rgba(173,112,255,.14)', star: '#ead8ff', accent: '#ba7dff', price: 300000 },
    { id: 'origin-point', code: 'SECTOR 999', name: 'ORIGIN POINT', subtitle: 'THE FIRST LIGHT', bg: '#071312', grid: 'rgba(91,221,179,.14)', star: '#d0fff2', accent: '#72f0c4', price: 500000 }
  ];

  function readSector() {
    try {
      const saved = localStorage.getItem('starfall-sector') || 'deep-space';
      return sectors.some(sector => sector.id === saved && (sector.price === 0 || readUnlockedSectors().includes(saved))) ? saved : 'deep-space';
    } catch (_) { return 'deep-space'; }
  }
  function readUnlockedSectors() {
    try {
      const saved = JSON.parse(localStorage.getItem('starfall-unlocked-sectors') || '[]');
      return ['deep-space', ...(Array.isArray(saved) ? saved : [])];
    } catch (_) { return ['deep-space']; }
  }
  function saveUnlockedSectors() {
    try { localStorage.setItem('starfall-unlocked-sectors', JSON.stringify(unlockedSectors)); } catch (_) { /* Storage may be unavailable. */ }
  }
  function getSector() { return sectors.find(sector => sector.id === selectedSector) || sectors[0]; }
  function getSectorIndex() {
    return Math.max(0, sectors.findIndex(sector => sector.id === selectedSector));
  }
  function getSectorDifficulty() {
    const index = getSectorIndex();
    return {
      enemy: 1 + index * .075,
      titan: 1 + index * .11,
      speed: 1 + index * .018,
      spawn: Math.max(.62, 1 - index * .012)
    };
  }
  function saveSector() {
    try { localStorage.setItem('starfall-sector', selectedSector); } catch (_) { /* Storage may be unavailable. */ }
  }
  function updateSectorUi() {
    const sector = getSector();
    $('sectorCode').textContent = sector.code;
    $('sectorName').textContent = sector.name;
    $('missionSectorName').textContent = sector.subtitle;
    $('missionSectorCode').textContent = sector.code;
    $('hudSectorName').textContent = sector.name;
    $('hudSectorCode').textContent = sector.code;
    $('sectorPreviewName').textContent = sector.name;
    const difficulty = getSectorDifficulty();
    $('sectorPreviewDesc').textContent = `${sector.desc || 'A hostile frontier waiting beyond the mapped stars.'} Threat ${Math.round(difficulty.enemy * 100)}%.`;
    $('sectorPreviewStatus').textContent = unlockedSectors.includes(sector.id) ? 'READY' : `${sector.price.toLocaleString()} VEERS`;
    $('sectorPreviewStatus').classList.toggle('locked', !unlockedSectors.includes(sector.id));
  }
  function renderSectors() {
    $('sectorGrid').innerHTML = sectors.map(sector => {
      const unlocked = unlockedSectors.includes(sector.id);
      return `<button class="sector-choice ${sector.id === selectedSector ? 'selected' : ''} ${unlocked ? '' : 'locked'}" data-sector-id="${sector.id}" style="--sector-accent:${sector.accent}">
      <span class="sector-orb" style="--sector-accent:${sector.accent}">${unlocked ? '' : '◆'}</span><b>${sector.name}</b><small>${unlocked ? sector.code : `◈ ${sector.price.toLocaleString()} VEERS`}</small>
    </button>`;
    }).join('');
    $('sectorGrid').querySelectorAll('[data-sector-id]').forEach(button => button.addEventListener('click', () => {
      const sector = sectors.find(entry => entry.id === button.dataset.sectorId);
      if (!sector) return;
      if (!unlockedSectors.includes(sector.id)) {
        if (veers < sector.price) {
          showToast('SECTOR LOCKED', `NEED ${sector.price.toLocaleString()} VEERS`);
          return;
        }
        veers -= sector.price;
        unlockedSectors.push(sector.id);
        saveVeers();
        saveUnlockedSectors();
        updateVeersUi();
        showToast('SECTOR UNLOCKED', sector.name);
      }
      selectedSector = sector.id;
      saveSector();
      updateSectorUi();
      renderSectors();
    }));
  }

  const shopItems = [
    { id: 'ion-core', kind: 'WEAPON', icon: '✦', name: 'ION CORE', price: 120, desc: '+20% weapon damage.', apply: p => { p.damage *= 1.2; } },
    { id: 'twin-nova', kind: 'WEAPON', icon: '⇉', name: 'TWIN NOVA', price: 250, desc: 'Fire an extra projectile every volley.', apply: p => { p.extraShots += 1; } },
    { id: 'void-lance', kind: 'WEAPON', icon: '↗', name: 'VOID LANCE', price: 400, desc: 'Shots pierce one additional target.', apply: p => { p.pierce += 1; } },
    { id: 'solar-flare', kind: 'WEAPON', icon: '☼', name: 'SOLAR FLARE', price: 650, desc: '+35% weapon damage with searing impact energy.', apply: p => { p.damage *= 1.35; } },
    { id: 'shardstorm', kind: 'WEAPON', icon: '✣', name: 'SHARDSTORM', price: 1200, desc: 'Launch two additional projectiles in every volley.', apply: p => { p.extraShots += 2; } },
    { id: 'gravity-edge', kind: 'WEAPON', icon: '⟡', name: 'GRAVITY EDGE', price: 1800, desc: 'Shots pierce two additional targets.', apply: p => { p.pierce += 2; } },
    { id: 'cryo-array', kind: 'WEAPON', icon: '❄', name: 'CRYO ARRAY', price: 2400, desc: 'Hits freeze enemies briefly and repeatedly.', apply: p => { p.slowOnHit = 1; } },
    { id: 'overdrive-coil', kind: 'WEAPON', icon: '⚡', name: 'OVERDRIVE COIL', price: 4200, desc: 'Reduce weapon cooldown by 18% per level.', apply: p => { p.fireRate = Math.max(.08, p.fireRate * .82); } },
    { id: 'titan-breaker', kind: 'WEAPON', icon: '⬢', name: 'TITAN BREAKER', price: 12000, desc: '+75% damage against every target, including titans.', apply: p => { p.damage *= 1.75; } },
    { id: 'nova-prism', kind: 'WEAPON', icon: '✺', name: 'NOVA PRISM', price: 7000, desc: 'Add three converging rounds to every volley.', apply: p => { p.extraShots += 3; } },
    { id: 'singularity-cannon', kind: 'WEAPON', icon: '◉', name: 'SINGULARITY CANNON', price: 18000, desc: '+120% damage and shots pierce three more targets.', apply: p => { p.damage *= 2.2; p.pierce += 3; } },
    { id: 'arc-reactor', kind: 'WEAPON', icon: '⌁', name: 'ARC REACTOR', price: 26000, desc: 'Fire 25% faster and add 25% weapon damage.', apply: p => { p.fireRate = Math.max(.08, p.fireRate * .75); p.damage *= 1.25; } },
    { id: 'eclipse-lance', kind: 'WEAPON', icon: '☽', name: 'ECLIPSE LANCE', price: 50000, desc: 'A devastating lance: +250% damage and five pierces.', apply: p => { p.damage *= 3.5; p.pierce += 5; } },
    { id: 'autofire-control', kind: 'SYSTEM', icon: '◉', name: 'AUTOFIRE CONTROL', price: 10000, maxLevel: 1, desc: 'Unlock manual control of automatic weapon fire.', apply: () => {} },
    { id: 'transformers-pack', kind: 'PREMIUM', icon: '⚡', name: 'TRANSFORMERS PACK', price: 100000, maxLevel: 1, desc: 'Choose a battle bot and fire lethal laser beams.', apply: p => { p.transformer = true; } },
    { id: 'mote', kind: 'COMPANION', icon: '✧', name: 'MOTE', price: 180, desc: 'Pull stardust from 50% farther away.', apply: p => { p.pickup += 45; p.magnet = 1; } },
    { id: 'aegis-wisp', kind: 'COMPANION', icon: '◈', name: 'AEGIS WISP', price: 320, desc: '+6 aegis regeneration per second.', apply: p => { p.shieldRegen += 6; } },
    { id: 'driftling', kind: 'COMPANION', icon: '⌁', name: 'DRIFTLING', price: 500, desc: 'Move 12% faster through the void.', apply: p => { p.speed *= 1.12; } },
    { id: 'prism-fox', kind: 'COMPANION', icon: '◇', name: 'PRISM FOX', price: 900, desc: 'Pull pickups from 85% farther away.', apply: p => { p.pickup += 70; p.magnet = 1; } },
    { id: 'ember-hound', kind: 'COMPANION', icon: '♢', name: 'EMBER HOUND', price: 1600, desc: 'Adds 8% weapon damage and hotter impact sparks.', apply: p => { p.damage *= 1.08; } },
    { id: 'orbit-mantis', kind: 'COMPANION', icon: '✣', name: 'ORBIT MANTIS', price: 2800, desc: 'Adds one extra projectile to every volley.', apply: p => { p.extraShots += 1; } },
    { id: 'plasma-drive', kind: 'UPGRADE', icon: '⚡', name: 'PLASMA DRIVE', price: 750, desc: 'Fire 10% faster with every level.', apply: p => { p.fireRate = Math.max(.08, p.fireRate * .9); } },
    { id: 'hull-matrix', kind: 'UPGRADE', icon: '⬡', name: 'HULL MATRIX', price: 1100, desc: '+12 maximum hull integrity per level.', apply: p => { p.maxHp += 12; p.hp += 12; } },
    { id: 'phase-engine', kind: 'UPGRADE', icon: '⟫', name: 'PHASE ENGINE', price: 1400, desc: 'Dash cooldown falls by 8% per level.', apply: p => { p.dashMax = Math.max(.45, p.dashMax * .92); } },
    { id: 'aegis-array', kind: 'UPGRADE', icon: '⬢', name: 'AEGIS ARRAY', price: 1900, desc: '+10 maximum shield and +2 regeneration.', apply: p => { p.maxShield += 10; p.shield += 10; p.shieldRegen += 2; } }
  ];

  function readVeers() {
    try {
      const saved = Number(localStorage.getItem('starfall-veers'));
      return Number.isFinite(saved) ? Math.max(0, saved) : 100;
    } catch (_) { return 100; }
  }
  function saveVeers() {
    try { localStorage.setItem('starfall-veers', String(veers)); } catch (_) { /* Storage may be unavailable. */ }
  }
  function readAutoFireEnabled() {
    try { return localStorage.getItem('starfall-autofire-enabled') !== 'false'; } catch (_) { return true; }
  }
  function saveAutoFireEnabled() {
    try { localStorage.setItem('starfall-autofire-enabled', String(autoFireEnabled)); } catch (_) { /* Storage may be unavailable. */ }
  }
  const botForms = [
    { id: 'aegis', name: 'AEGIS BOT', color: '#61e7f5', desc: 'Balanced guardian chassis.' },
    { id: 'inferno', name: 'INFERNO BOT', color: '#ff9b72', desc: 'Aggressive furnace chassis.' },
    { id: 'void', name: 'VOID BOT', color: '#c19aff', desc: 'Silent stealth chassis.' },
    { id: 'titan', name: 'TITAN BOT', color: '#ff668f', desc: 'Heavy assault chassis.' },
    { id: 'scout', name: 'SCOUT BOT', color: '#86eddf', desc: 'High-speed interceptor chassis.' },
    { id: 'prism', name: 'PRISM BOT', color: '#ffd166', desc: 'Experimental energy chassis.' }
  ];
  function readSelectedBot() {
    try {
      const saved = localStorage.getItem('starfall-transformer-bot') || 'aegis';
      return botForms.some(bot => bot.id === saved) ? saved : 'aegis';
    } catch (_) { return 'aegis'; }
  }
  function saveSelectedBot() {
    try { localStorage.setItem('starfall-transformer-bot', selectedBot); } catch (_) { /* Storage may be unavailable. */ }
  }
  function readLoadout() {
    try {
      const saved = JSON.parse(localStorage.getItem('starfall-loadout') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (_) { return []; }
  }
  function saveLoadout() {
    try { localStorage.setItem('starfall-loadout', JSON.stringify(ownedLoadout)); } catch (_) { /* Storage may be unavailable. */ }
  }
  function readUpgradeLevels() {
    try {
      const saved = JSON.parse(localStorage.getItem('starfall-upgrade-levels') || '{}');
      const levels = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
      ownedLoadout.forEach(id => { if (!levels[id]) levels[id] = 1; });
      return levels;
    } catch (_) {
      return Object.fromEntries(ownedLoadout.map(id => [id, 1]));
    }
  }
  function saveUpgradeLevels() {
    try { localStorage.setItem('starfall-upgrade-levels', JSON.stringify(upgradeLevels)); } catch (_) { /* Storage may be unavailable. */ }
  }
  function resetProgress() {
    if (!window.confirm('Reset all Veers and ship upgrades? Unlocked sectors and your best score will stay saved.')) return;
    veers = 0;
    ownedLoadout = [];
    upgradeLevels = {};
    autoFireEnabled = true;
    selectedBot = 'aegis';
    saveVeers();
    saveLoadout();
    saveUpgradeLevels();
    saveAutoFireEnabled();
    saveSelectedBot();
    renderShop();
    updateAutoFireUi();
    updateTransformerUi();
    updateVeersUi();
    showToast('PROGRESSION RESET', 'VEERS AND SHIP UPGRADES CLEARED');
  }
  function resetGameData() {
    if (!window.confirm('Reset all Starfall game data? This clears Veers, upgrades, sectors, bot settings, and your best score.')) return;
    ['starfall-best', 'starfall-veers', 'starfall-loadout', 'starfall-upgrade-levels', 'starfall-sector', 'starfall-unlocked-sectors', 'starfall-autofire-enabled', 'starfall-transformer-bot'].forEach(key => {
      try { localStorage.removeItem(key); } catch (_) { /* Storage may be unavailable. */ }
    });
    best = 0;
    veers = 100;
    ownedLoadout = [];
    upgradeLevels = {};
    selectedSector = 'deep-space';
    unlockedSectors = ['deep-space'];
    saveUnlockedSectors();
    autoFireEnabled = true;
    selectedBot = 'aegis';
    transformed = false;
    $('bestScore').textContent = '0';
    $('panelBest').textContent = '0';
    renderShop();
    renderSectors();
    updateSectorUi();
    updateAutoFireUi();
    updateTransformerUi();
    updateVeersUi();
    showToast('GAME RESET', 'ALL STARFALL DATA CLEARED');
  }
  function getUpgradeLevel(id) { return Number(upgradeLevels[id]) || 0; }
  function getUpgradePrice(item) {
    if (item.maxLevel === 1) return item.price;
    return Math.floor(item.price * Math.pow(1.55, getUpgradeLevel(item.id)));
  }
  function hasAutoFireControl() { return getUpgradeLevel('autofire-control') > 0; }
  function hasTransformersPack() { return getUpgradeLevel('transformers-pack') > 0; }
  function updateAutoFireUi() {
    const toggle = $('autoFireToggle');
    if (!toggle) return;
    toggle.hidden = !hasAutoFireControl();
    toggle.setAttribute('aria-pressed', String(autoFireEnabled));
    toggle.classList.toggle('off', !autoFireEnabled);
    toggle.querySelector('b').textContent = autoFireEnabled ? 'ON' : 'OFF';
  }
  function toggleAutoFire() {
    if (!hasAutoFireControl()) return;
    autoFireEnabled = !autoFireEnabled;
    saveAutoFireEnabled();
    updateAutoFireUi();
    showToast('AUTOFIRE CONTROL', autoFireEnabled ? 'TARGETING ONLINE' : 'MANUAL FIRE ONLY');
  }
  function updateTransformerUi() {
    const toggle = $('transformToggle');
    const picker = $('transformerPicker');
    if (!toggle || !picker) return;
    const unlocked = hasTransformersPack();
    toggle.hidden = !unlocked;
    picker.hidden = !unlocked;
    const bot = botForms.find(entry => entry.id === selectedBot) || botForms[0];
    $('transformLabel').textContent = transformed ? bot.name : 'TRANSFORM';
    toggle.querySelector('b').textContent = transformed ? 'ON' : 'T';
    $('transformerOptions').innerHTML = botForms.map(entry => `<button class="transformer-option ${entry.id === selectedBot ? 'selected' : ''}" data-bot-id="${entry.id}" style="--bot-color:${entry.color}"><b>${entry.name}</b><small>${entry.desc}</small></button>`).join('');
    $('transformerOptions').querySelectorAll('[data-bot-id]').forEach(button => button.addEventListener('click', () => {
      selectedBot = button.dataset.botId;
      saveSelectedBot();
      transformed = false;
      updateTransformerUi();
      showToast('BOT SELECTED', botForms.find(entry => entry.id === selectedBot).name);
    }));
  }
  function toggleTransformer() {
    if (!hasTransformersPack() || !player) return;
    transformed = !transformed;
    player.transformer = transformed;
    updateTransformerUi();
    const bot = botForms.find(entry => entry.id === selectedBot) || botForms[0];
    showToast(transformed ? 'TRANSFORMER ONLINE' : 'SHIP FORM RESTORED', transformed ? bot.name : 'STARFALL HULL');
  }
  function updateVeersUi() {
    const formatted = veers.toLocaleString();
    $('shopVeers').textContent = formatted;
    $('menuVeers').textContent = formatted;
    $('panelVeers').textContent = formatted;
  }
  function renderShop() {
    updateVeersUi();
    $('shopItems').innerHTML = shopItems.map(item => {
      const level = getUpgradeLevel(item.id);
      const price = getUpgradePrice(item);
      const maxed = item.maxLevel === 1 && level > 0;
      return `<button class="shop-item ${level ? 'owned' : ''}" data-shop-id="${item.id}" ${maxed ? 'disabled' : ''}>
        <span class="shop-item-icon">${item.icon}</span><span class="shop-item-copy"><small>${item.kind} · LV ${level}</small><b>${item.name}</b><em>${item.desc}</em></span>
        <strong>${maxed ? '✓ ACTIVE' : `◈ ${price.toLocaleString()}<small>${level ? `LV ${level} → ${level + 1}` : 'INSTALL'}</small>`}</strong>
      </button>`;
    }).join('');
    $('shopItems').querySelectorAll('[data-shop-id]').forEach(button => button.addEventListener('click', () => buyItem(button.dataset.shopId)));
  }
  function buyItem(id) {
    const item = shopItems.find(entry => entry.id === id);
    if (!item) return;
    if (item.maxLevel === 1 && getUpgradeLevel(id) > 0) return;
    const price = getUpgradePrice(item);
    if (veers < price) {
      showToast('INSUFFICIENT VEERS', `NEED ${price.toLocaleString()}`);
      return;
    }
    veers -= price;
    upgradeLevels[id] = getUpgradeLevel(id) + 1;
    if (!ownedLoadout.includes(id)) ownedLoadout.push(id);
    saveVeers();
    saveLoadout();
    saveUpgradeLevels();
    renderShop();
    updateAutoFireUi();
    updateTransformerUi();
    showToast('UPGRADE INSTALLED', `${item.name} LV ${upgradeLevels[id]}`);
  }
  function rewardVeers(enemy) {
    const rewards = { bit: 5, chaser: 10, fast: 15, shooter: 25, splitter: 30, tank: 50, boss: 1000 };
    veers += rewards[enemy.type] || 10;
    saveVeers();
    updateVeersUi();
  }

  function readBest() {
    try { return Number(localStorage.getItem('starfall-best')) || 0; } catch (_) { return 0; }
  }
  function saveBest() {
    try { localStorage.setItem('starfall-best', String(best)); } catch (_) { /* Storage may be unavailable. */ }
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle('hidden', key !== name));
    const playing = name == null;
    $('hud').hidden = name === 'start' || name === 'shop' || name === 'over';
    $('touchControls').hidden = !playing;
    $('dashButton').hidden = !playing;
  }
  function dismissIntro() {
    clearTimeout(introTimer);
    $('introCinematic').classList.add('dismissed');
    $('startScreen').classList.remove('hidden');
  }
  function showToast(kicker, title) {
    $('toastKicker').textContent = kicker;
    $('toastTitle').textContent = title;
    $('toast').hidden = false;
    toastTimer = 2.3;
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (player) {
      player.x = clamp(player.x, 22, width - 22);
      player.y = clamp(player.y, 22, height - 22);
    }
    createStars();
  }
  function createStars() {
    const count = Math.max(45, Math.floor(width * height / 8500));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.3 + .25, phase: Math.random() * TAU, speed: Math.random() * 2 + .5
    }));
  }
  function edgePos(pad = 28) {
    const edge = Math.floor(Math.random() * 4);
    return edge === 0 ? { x: Math.random() * width, y: -pad }
      : edge === 1 ? { x: width + pad, y: Math.random() * height }
      : edge === 2 ? { x: Math.random() * width, y: height + pad }
      : { x: -pad, y: Math.random() * height };
  }
  function resetGame() {
    elapsed = 0; score = 0; kills = 0; wave = 1; lastWave = 1; spawnTimer = .45; shotTimer = .2; manualShotTimer = 0; shake = 0;
    combo = 1; comboTimer = 0; maxCombo = 1; bossesDown = 0; toastTimer = 0; nextId = 1;
    touchMove = { x: 0, y: 0 };
    enemies = []; bullets = []; shots = []; particles = []; gems = [];
    player = {
      x: width / 2, y: height / 2, radius: 12, speed: 230,
      hp: 100, maxHp: 100, shield: 40, maxShield: 40, shieldRegen: 12, shieldDelay: 0,
      damage: 22, fireRate: .4, pickup: 90, xp: 0, level: 1, xpNext: 12,
      invulnerable: 0, dashCooldown: 0, dashMax: 1.7, dashTime: 0, dashDamage: 55,
      extraShots: 0, pierce: 0, slowOnHit: 0, magnet: 0,
      lastMove: { x: 0, y: -1 }, dashDir: { x: 0, y: -1 }, dashHit: new Set(),
      aim: null
    };
    ownedLoadout.forEach(id => {
      const item = shopItems.find(entry => entry.id === id);
      const levels = getUpgradeLevel(id);
      for (let level = 0; level < levels; level++) item?.apply(player);
    });
    transformed = false;
    player.transformer = false;
    $('toast').hidden = true;
    $('bossHud').hidden = true;
    updateHud();
    updateAutoFireUi();
    updateTransformerUi();
    updateVeersUi();
    showToast('INCOMING', 'WAVE 01');
  }
  function startGame() {
    cancelAnimationFrame(animationId);
    resetGame(); state = 'playing'; showScreen(null); lastTime = performance.now(); animationId = requestAnimationFrame(loop);
  }
  function pauseGame() { if (state !== 'playing') return; state = 'paused'; showScreen('pause'); }
  function resumeGame() { if (state !== 'paused') return; state = 'playing'; showScreen(null); lastTime = performance.now(); animationId = requestAnimationFrame(loop); }

  function updateHud() {
    if (!player) return;
    $('healthFill').style.width = `${clamp(player.hp / player.maxHp * 100, 0, 100)}%`;
    $('shieldFill').style.width = `${clamp(player.shield / Math.max(1, player.maxShield) * 100, 0, 100)}%`;
    $('waveValue').textContent = wave;
    $('scoreValue').textContent = Math.floor(score).toLocaleString();
    $('comboValue').textContent = `x${combo}`;
    $('comboBlock').classList.toggle('hot', combo >= 5);
    $('levelValue').textContent = player.level;
    $('xpValue').textContent = Math.floor(player.xp);
    $('xpNeeded').textContent = player.xpNext;
    $('xpFill').style.width = `${clamp(player.xp / player.xpNext * 100, 0, 100)}%`;
    $('killsValue').textContent = kills;
    $('timeValue').textContent = formatTime(elapsed);
    $('panelCombo').textContent = `x${maxCombo}`;
    $('panelBosses').textContent = bossesDown;
    const ready = 1 - player.dashCooldown / player.dashMax;
    $('dashFill').style.width = `${clamp(ready * 100, 0, 100)}%`;
    $('dashFill').classList.toggle('ready', player.dashCooldown <= 0);
    const boss = enemies.find(e => e.type === 'boss' && !e.dead);
    $('bossHud').hidden = !boss;
    if (boss) {
      const pct = clamp(boss.hp / boss.maxHp, 0, 1);
      $('bossFill').style.width = `${pct * 100}%`;
      $('bossHpText').textContent = `${Math.ceil(pct * 100)}%`;
      $('bossName').textContent = boss.name;
    }
    const chips = [];
    if (player.extraShots) chips.push(['gold', player.extraShots > 1 ? 'TRI-GUN' : 'TWIN GUN']);
    if (player.pierce) chips.push(['', 'PIERCE']);
    if (player.magnet) chips.push(['mag', 'MAGNET']);
    if (player.slowOnHit) chips.push(['ice', 'CRYO']);
    if (player.dashMax < 1.5) chips.push(['', 'PHASE DASH']);
    if (combo >= 6) chips.push(['gold', `STREAK x${combo}`]);
    $('buffList').innerHTML = chips.map(([c, t]) => `<span class="buff-chip ${c}">${t}</span>`).join('');
  }
  function formatTime(seconds) {
    const n = Math.floor(seconds);
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  }
  function handleSecretInput(key) {
    if (key.length !== 1 || !/[a-z]/i.test(key)) return;
    secretInput = `${secretInput}${key.toLowerCase()}`.slice(-6);
    clearTimeout(secretInputTimer);
    secretInputTimer = setTimeout(() => { secretInput = ''; }, 1800);
    if (secretInput !== 'blobby') return;
    secretInput = '';
    const chromeTab = window.open('https://www.google.com', '_blank');
    if (chromeTab) {
      showToast('SECRET ROUTE', 'GOOGLE OPENED');
    } else {
      showToast('POPUP BLOCKED', 'ALLOW NEW TABS');
    }
  }

  function spawnEnemy(forced) {
    const pos = edgePos();
    const roll = Math.random();
    let type = forced || 'chaser';
    if (!forced) {
      if (wave >= 6 && roll < .1) type = 'splitter';
      else if (wave >= 4 && roll < .28) type = 'shooter';
      else if (wave >= 2 && roll < .46) type = 'fast';
      else if (wave >= 3 && roll > .78) type = 'tank';
    }
    const stats = {
      fast: { radius: 8, hp: 28 + wave * 2, speed: 118 + wave * 2.2, color: '#ff6c9e', score: 22 },
      tank: { radius: 18, hp: 110 + wave * 10, speed: 34 + wave, color: '#b38cff', score: 48 },
      shooter: { radius: 12, hp: 55 + wave * 5, speed: 48 + wave, color: '#61e7f5', score: 32 },
      splitter: { radius: 14, hp: 70 + wave * 6, speed: 50 + wave, color: '#86eddf', score: 28 },
      bit: { radius: 7, hp: 18 + wave, speed: 100 + wave, color: '#9eead8', score: 8 },
      chaser: { radius: 11, hp: 48 + wave * 4, speed: 56 + wave * 1.6, color: '#ffb66d', score: 12 }
    };
    const base = stats[type] || stats.chaser;
    const difficulty = getSectorDifficulty();
    const data = {
      ...base,
      hp: Math.round(base.hp * difficulty.enemy),
      speed: base.speed * difficulty.speed
    };
    enemies.push({
      id: nextId++, ...pos, ...data, maxHp: data.hp, type, hit: 0, slow: 0, shotTimer: rand(.4, 1.4),
      wobble: Math.random() * TAU, dead: false
    });
  }
  function spawnBoss() {
    if (wave < 5 || wave % 5 !== 0) return;
    const roster = [
      { name: 'VOID TITAN', color: '#ff5d8f', pattern: 0 },
      { name: 'EMBER COLOSSUS', color: '#ffb066', pattern: 1 },
      { name: 'NULL SERPENT', color: '#9e83ff', pattern: 2 },
      { name: 'ASTRAL WRAITH', color: '#61e7f5', pattern: 0 }
    ];
    const bossNumber = Number.isFinite(wave) ? Math.max(1, Math.floor(wave / 5)) : 1;
    const kind = roster[(bossNumber - 1) % roster.length] || roster[0];
    const difficulty = getSectorDifficulty();
    const escalation = Math.pow(1.18, bossNumber - 1);
    const hp = Math.round((600 + wave * 130) * escalation * difficulty.titan);
    const attackScale = escalation * difficulty.titan;
    enemies.push({
      id: nextId++, type: 'boss', name: kind.name, color: kind.color, pattern: kind.pattern,
      x: width / 2, y: -50, radius: 34, hp, maxHp: hp, speed: (42 + wave * .6) * difficulty.speed,
      damage: Math.round((12 + wave * .4) * attackScale), score: 500 + wave * 55,
      hit: 0, slow: 0, shotTimer: 1.1, specialTimer: 5.5, phase: 0, dead: false, entering: 1.1,
      enraged: false, finalPhase: false, difficulty, escalation
    });
    addParticles(width / 2, 40, kind.color, 28, 180);
  }

  function addParticles(x, y, color, count, force = 110) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU, speed = Math.random() * force + 18, life = Math.random() * .42 + .22;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: Math.random() * 3 + 1, color });
    }
  }
  function dropGems(x, y, count, value) {
    for (let i = 0; i < count; i++) {
      gems.push({
        x, y, vx: rand(-90, 90), vy: rand(-90, 90),
        value, r: value > 2 ? 6 : 5, phase: Math.random() * TAU
      });
    }
  }
  function fireShot(x, y, angle, speed, damage, color = '#ff6c9e') {
    shots.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 3.2, r: 4, damage, color });
  }

  function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    kills++;
    rewardVeers(enemy);
    if (comboTimer > 0) combo++; else combo = 1;
    comboTimer = 2.5;
    maxCombo = Math.max(maxCombo, combo);
    score += (enemy.score + wave * 3) * Math.min(combo, 15);
    const burst = enemy.type === 'boss' ? 36 : enemy.type === 'tank' ? 16 : 10;
    addParticles(enemy.x, enemy.y, enemy.color, burst, enemy.type === 'boss' ? 240 : 130);
    dropGems(enemy.x, enemy.y, enemy.type === 'boss' ? 8 : enemy.type === 'tank' || enemy.type === 'splitter' ? 3 : 1, enemy.type === 'boss' ? 3 : 1);
    if (enemy.type === 'splitter') {
      for (let i = 0; i < 2; i++) {
        spawnEnemy('bit');
        const bit = enemies[enemies.length - 1];
        bit.x = enemy.x + rand(-12, 12); bit.y = enemy.y + rand(-12, 12);
      }
    }
    if (enemy.type === 'boss') {
      bossesDown++;
      shake = 12;
      showToast('TITAN DOWN', enemy.name);
      score += 250 * wave;
    }
  }
  function damageEnemy(enemy, amount) {
    if (!enemy || enemy.dead) return;
    enemy.hp -= amount;
    enemy.hit = .1;
    if (player.slowOnHit) enemy.slow = Math.max(enemy.slow, .7);
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  function hurtPlayer(amount) {
    if (!player || player.invulnerable > 0 || player.dashTime > 0) return;
    player.shieldDelay = 2.8;
    let leftover = amount;
    if (player.shield > 0) {
      const absorbed = Math.min(player.shield, leftover);
      player.shield -= absorbed;
      leftover -= absorbed;
      addParticles(player.x, player.y, '#61e7f5', 7, 80);
      shake = Math.max(shake, 4);
    }
    if (leftover > 0) {
      player.hp -= leftover;
      player.invulnerable = .7;
      shake = 8;
      addParticles(player.x, player.y, '#ff6c9e', 11, 110);
    }
    if (player.hp <= 0) {
      player.hp = 0;
      updateHud();
      endGame();
    }
  }

  function tryDash() {
    if (state !== 'playing' || !player || player.dashCooldown > 0 || player.dashTime > 0) return;
    let dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0) + touchMove.x;
    let dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0) + touchMove.y;
    if (Math.hypot(dx, dy) < .15) { dx = player.lastMove.x; dy = player.lastMove.y; }
    const len = Math.hypot(dx, dy) || 1;
    player.dashDir = { x: dx / len, y: dy / len };
    player.dashTime = .15;
    player.dashCooldown = player.dashMax;
    player.dashHit = new Set();
    player.invulnerable = .22;
    addParticles(player.x, player.y, '#86eddf', 8, 90);
  }

  function fireAtTarget() {
    if (!autoFireEnabled || shotTimer > 0 || !enemies.some(e => !e.dead)) return;
    let target = null, nearest = Infinity;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const d = (enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2;
      const bias = enemy.type === 'boss' ? d * .85 : d;
      if (bias < nearest) { nearest = bias; target = enemy; }
    }
    if (!target) return;
    fireVolley(Math.atan2(target.y - player.y, target.x - player.x));
  }
  function fireVolley(angle) {
    const n = 1 + player.extraShots;
    for (let i = 0; i < n; i++) {
      const a = angle + (n === 1 ? 0 : (i - (n - 1) / 2) * .13);
      bullets.push({
        x: player.x + Math.cos(a) * 15, y: player.y + Math.sin(a) * 15,
        vx: Math.cos(a) * 560, vy: Math.sin(a) * 560,
        life: player.transformer ? .65 : .9,
        damage: player.transformer ? 999999 : player.damage,
        r: player.transformer ? 6 : 3.3,
        pierce: player.transformer ? 99 : player.pierce,
        laser: player.transformer,
        color: botForms.find(bot => bot.id === selectedBot)?.color || '#61e7f5',
        hit: new Set()
      });
    }
    addParticles(player.x + Math.cos(angle) * 16, player.y + Math.sin(angle) * 16, player.transformer ? (botForms.find(bot => bot.id === selectedBot)?.color || '#61e7f5') : '#61e7f5', player.transformer ? 8 : 2, player.transformer ? 100 : 40);
    shotTimer = Math.max(.12, player.fireRate);
  }
  function fireAtPoint(x, y) {
    if (state !== 'playing' || !player || manualShotTimer > 0) return;
    const dx = x - player.x, dy = y - player.y;
    if (Math.hypot(dx, dy) < 8) return;
    fireVolley(Math.atan2(dy, dx));
    manualShotTimer = Math.max(.12, player.fireRate * .45);
  }

  function gainXp(amount) {
    player.xp += amount;
    maybeLevelUp();
  }
  function maybeLevelUp() {
    if (state !== 'playing' || player.xp < player.xpNext) return false;
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.32 + 4);
    state = 'upgrade';
    showScreen('upgrade');
    showUpgrades();
    return true;
  }

  const upgradePool = [
    { icon: '✦', title: 'Overcharged Core', desc: 'Deal 30% more weapon damage.', apply: () => { player.damage *= 1.3; } },
    { icon: '➤', title: 'Rapid Fire', desc: 'Fire 20% faster at the swarm.', apply: () => { player.fireRate = Math.max(.12, player.fireRate * .8); } },
    { icon: '⟡', title: 'Reinforced Hull', desc: 'Restore 30 hull and raise max hull by 12.', apply: () => { player.maxHp += 12; player.hp = Math.min(player.maxHp, player.hp + 30); } },
    { icon: '◈', title: 'Aegis Lattice', desc: 'Raise max aegis and fully recharge it.', apply: () => { player.maxShield += 18; player.shield = player.maxShield; player.shieldRegen += 4; } },
    { icon: '⌁', title: 'Thruster Boost', desc: 'Move 15% faster to dodge danger.', apply: () => { player.speed *= 1.15; } },
    { icon: '◎', title: 'Magnetic Field', desc: 'Pull stardust from farther away.', apply: () => { player.pickup += 50; player.magnet = 1; } },
    { icon: '⇉', title: 'Twin Cannons', desc: 'Fire an extra projectile each volley.', apply: () => { player.extraShots = Math.min(2, player.extraShots + 1); } },
    { icon: '↗', title: 'Piercing Light', desc: 'Shots pass through one extra target.', apply: () => { player.pierce += 1; } },
    { icon: '❄', title: 'Cryo Rounds', desc: 'Hits briefly slow anything they touch.', apply: () => { player.slowOnHit = 1; } },
    { icon: '⟫', title: 'Phase Dash', desc: 'Dash recharges faster and hits harder.', apply: () => { player.dashMax = Math.max(.85, player.dashMax * .75); player.dashDamage += 25; } },
    { icon: '✧', title: 'Nova Charge', desc: 'Blast nearby enemies for heavy damage.', apply: () => {
      enemies.forEach(e => { if (Math.hypot(e.x - player.x, e.y - player.y) < 160) damageEnemy(e, 90); });
      addParticles(player.x, player.y, '#9e83ff', 34, 230);
    } }
  ];
  function showUpgrades() {
    const options = [...upgradePool].sort(() => Math.random() - .5).slice(0, 3);
    $('upgradeOptions').innerHTML = '';
    options.forEach(upgrade => {
      const button = document.createElement('button');
      button.className = 'upgrade-choice';
      button.innerHTML = `<span class="upgrade-icon">${upgrade.icon}</span><b>${upgrade.title}</b><small>${upgrade.desc}</small>`;
      button.addEventListener('click', () => {
        upgrade.apply();
        updateHud();
        if (player.xp >= player.xpNext) {
          maybeLevelUp();
          return;
        }
        state = 'playing';
        showScreen(null);
        lastTime = performance.now();
        animationId = requestAnimationFrame(loop);
      }, { once: true });
      $('upgradeOptions').appendChild(button);
    });
  }

  function endGame() {
    state = 'over';
    best = Math.max(best, Math.floor(score));
    saveBest();
    $('bestScore').textContent = best.toLocaleString();
    $('panelBest').textContent = best.toLocaleString();
    $('finalScore').textContent = Math.floor(score).toLocaleString();
    $('finalWave').textContent = wave;
    $('finalKills').textContent = kills;
    $('finalCombo').textContent = `x${maxCombo}`;
    $('runSummary').textContent = `You survived ${formatTime(elapsed)}, reached wave ${wave}, and chained a x${maxCombo} combo.`;
    showScreen('over');
  }

  function moveInput() {
    let dx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0) + touchMove.x;
    let dy = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0) + touchMove.y;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    return { dx, dy, len };
  }

  function updateBoss(boss, dt) {
    boss.phase += dt;
    boss.specialTimer -= dt;
    if (boss.entering > 0) {
      boss.entering -= dt;
      boss.y += 70 * dt;
      return;
    }
    const tx = player.x + Math.cos(boss.phase * .55) * 140;
    const ty = player.y + Math.sin(boss.phase * .4) * 90;
    const ang = Math.atan2(ty - boss.y, tx - boss.x);
    const slow = boss.slow > 0 ? .55 : 1;
    boss.x += Math.cos(ang) * boss.speed * slow * dt;
    boss.y += Math.sin(ang) * boss.speed * slow * dt;
    boss.x = clamp(boss.x, 36, width - 36);
    boss.y = clamp(boss.y, 36, height - 36);
    if (!boss.enraged && boss.hp <= boss.maxHp * .5) {
      boss.enraged = true;
      boss.speed *= 1.3;
      boss.shotTimer = .15;
      showToast('TITAN ENRAGED', `${boss.name} HAS BREACHED PHASE TWO`);
      addParticles(boss.x, boss.y, boss.color, 30, 220);
    }
    if (!boss.finalPhase && boss.hp <= boss.maxHp * .25) {
      boss.finalPhase = true;
      boss.speed *= 1.25;
      boss.specialTimer = .5;
      showToast('TITAN CRITICAL', `${boss.name} ENTERING FINAL PHASE`);
      addParticles(boss.x, boss.y, boss.color, 42, 270);
    }
    if (boss.specialTimer <= 0) {
      const reinforcements = boss.finalPhase ? 5 : boss.enraged ? 3 : 2;
      for (let i = 0; i < reinforcements; i++) spawnEnemy(i % 3 === 0 ? 'shooter' : i % 2 ? 'fast' : 'bit');
      boss.specialTimer = boss.finalPhase ? 2.8 : boss.enraged ? 4.2 : 7;
      addParticles(boss.x, boss.y, boss.color, 12, 150);
    }
    boss.shotTimer -= dt;
    if (boss.shotTimer > 0) return;
    const aim = Math.atan2(player.y - boss.y, player.x - boss.x);
    if (boss.pattern === 0) {
      const count = boss.finalPhase ? 24 : boss.enraged ? 18 : 12;
      for (let i = 0; i < count; i++) fireShot(boss.x, boss.y, i / count * TAU + boss.phase, 150 + (boss.enraged ? 25 : 0), boss.damage, boss.color);
      boss.shotTimer = boss.finalPhase ? 1.1 : boss.enraged ? 1.55 : 2.15;
    } else if (boss.pattern === 1) {
      const spread = boss.finalPhase ? 7 : boss.enraged ? 5 : 3;
      for (let i = -spread; i <= spread; i++) fireShot(boss.x, boss.y, aim + i * .14, 210 + (boss.enraged ? 30 : 0), boss.damage, boss.color);
      boss.shotTimer = boss.finalPhase ? .72 : boss.enraged ? 1 : 1.35;
    } else {
      const count = boss.finalPhase ? 12 : boss.enraged ? 8 : 4;
      for (let i = 0; i < count; i++) fireShot(boss.x, boss.y, boss.phase * 2.8 + i * TAU / count, 175 + (boss.enraged ? 25 : 0), boss.damage, boss.color);
      boss.shotTimer = boss.finalPhase ? .12 : boss.enraged ? .18 : .26;
    }
  }

  function update(dt) {
    elapsed += dt;
    manualShotTimer = Math.max(0, manualShotTimer - dt);
    wave = 1 + Math.floor(elapsed / 20);
    if (wave !== lastWave) {
      lastWave = wave;
      if (wave % 5 === 0) {
        spawnBoss();
        const boss = enemies.find(e => e.type === 'boss' && !e.dead);
        showToast('TITAN BREACH', boss ? boss.name : 'INCOMING');
      } else {
        showToast('INCOMING', `WAVE ${String(wave).padStart(2, '0')}`);
      }
    }
    shotTimer -= dt;
    spawnTimer -= dt;
    shake = Math.max(0, shake - dt * 20);
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 1;
    toastTimer -= dt;
    if (toastTimer <= 0) $('toast').hidden = true;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.shieldDelay = Math.max(0, player.shieldDelay - dt);
    if (player.shieldDelay <= 0) player.shield = Math.min(player.maxShield, player.shield + player.shieldRegen * dt);

    const bossAlive = enemies.some(e => e.type === 'boss' && !e.dead);
    const cap = bossAlive ? 18 : 38;
    if (spawnTimer <= 0 && enemies.filter(e => !e.dead).length < cap) {
      spawnEnemy();
      const rate = bossAlive ? 1.35 : Math.max(.26, (.92 - wave * .05) * getSectorDifficulty().spawn);
      spawnTimer = rate * (.75 + Math.random() * .45);
    }

    const { dx, dy, len } = moveInput();
    if (len > .12) player.lastMove = { x: dx, y: dy };
    if (keys.has(' ')) tryDash();

    if (player.dashTime > 0) {
      player.x += player.dashDir.x * 980 * dt;
      player.y += player.dashDir.y * 980 * dt;
      player.dashTime -= dt;
      addParticles(player.x - player.dashDir.x * 10, player.y - player.dashDir.y * 10, '#86eddf', 1, 20);
    } else {
      player.x += dx * player.speed * dt;
      player.y += dy * player.speed * dt;
    }
    player.x = clamp(player.x, player.radius + 3, width - player.radius - 3);
    player.y = clamp(player.y, player.radius + 3, height - player.radius - 3);

    fireAtTarget();

    bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
    bullets = bullets.filter(b => b.life > 0 && b.x > -24 && b.x < width + 24 && b.y > -24 && b.y < height + 24);
    shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; });
    shots = shots.filter(s => s.life > 0 && s.x > -30 && s.x < width + 30 && s.y > -30 && s.y < height + 30);

    for (const enemy of enemies) {
      if (enemy.dead) continue;
      enemy.hit = Math.max(0, enemy.hit - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.wobble += dt * 3;
      const slow = enemy.slow > 0 ? .5 : 1;
      if (enemy.type === 'boss') {
        updateBoss(enemy, dt);
      } else {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y) || 1;
        let ax = (player.x - enemy.x) / dist, ay = (player.y - enemy.y) / dist;
        if (enemy.type === 'shooter') {
          if (dist < 170) { ax = -ax; ay = -ay; }
          else if (dist < 250) { const strafe = ax; ax = -ay; ay = strafe; }
          enemy.shotTimer -= dt;
          if (enemy.shotTimer <= 0) {
            fireShot(enemy.x, enemy.y, Math.atan2(player.y - enemy.y, player.x - enemy.x), 170 + wave * 4, 9);
            enemy.shotTimer = Math.max(.7, 1.7 - wave * .04);
          }
        } else if (enemy.type === 'fast' || enemy.type === 'bit') {
          ax += Math.cos(enemy.wobble) * .45;
          ay += Math.sin(enemy.wobble) * .45;
        }
        const m = Math.hypot(ax, ay) || 1;
        enemy.x += ax / m * enemy.speed * slow * dt;
        enemy.y += ay / m * enemy.speed * slow * dt;
      }
      if (player.dashTime > 0 && !player.dashHit.has(enemy.id) && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius + 6) {
        damageEnemy(enemy, player.dashDamage);
        player.dashHit.add(enemy.id);
        addParticles(enemy.x, enemy.y, '#86eddf', 6, 90);
      } else if (player.dashTime <= 0 && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius - 2) {
        hurtPlayer(enemy.type === 'boss' ? 22 : enemy.type === 'tank' ? 16 : 10);
        if (state !== 'playing') return;
      }
    }

    for (const bullet of bullets) {
      for (const enemy of enemies) {
        if (enemy.dead || bullet.hit.has(enemy.id)) continue;
        if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.r + enemy.radius) {
          damageEnemy(enemy, bullet.damage);
          bullet.hit.add(enemy.id);
          if (bullet.pierce > 0) bullet.pierce--;
          else { bullet.life = 0; break; }
        }
      }
    }
    for (const s of shots) {
      if (player.dashTime <= 0 && Math.hypot(s.x - player.x, s.y - player.y) < s.r + player.radius - 1) {
        s.life = 0;
        hurtPlayer(s.damage);
        if (state !== 'playing') return;
      }
    }

    gems.forEach(gem => {
      gem.phase += dt * 3;
      gem.x += gem.vx * dt; gem.y += gem.vy * dt;
      gem.vx *= Math.pow(.08, dt); gem.vy *= Math.pow(.08, dt);
      const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
      if (dist < player.pickup) {
        const pull = (dist < 1 ? 1 : Math.min(1, (player.pickup - dist + 30) / player.pickup)) * dt * 6;
        gem.x += (player.x - gem.x) * pull;
        gem.y += (player.y - gem.y) * pull;
      }
      if (dist < player.radius + 8) {
        gainXp(gem.value);
        gem.collected = true;
        addParticles(gem.x, gem.y, '#77e8ff', 5, 65);
      }
    });
    gems = gems.filter(g => !g.collected);
    enemies = enemies.filter(e => !e.dead);
    particles.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(.04, dt); p.vy *= Math.pow(.04, dt);
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);
    updateHud();
  }

  function draw() {
    const sector = getSector();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = sector.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    if (shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    const grid = 48, offset = (elapsed * 5) % grid;
    ctx.strokeStyle = sector.grid;
    ctx.lineWidth = 1;
    for (let x = -grid + offset; x < width + grid; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = -grid + offset; y < height + grid; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    stars.forEach(s => {
      ctx.globalAlpha = .25 + (Math.sin(elapsed * s.speed + s.phase) + 1) * .22;
      ctx.fillStyle = sector.star;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
    gems.forEach(g => {
      const pulse = 1 + Math.sin(g.phase) * .18;
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(Math.PI / 4);
      ctx.shadowColor = '#61e7f5'; ctx.shadowBlur = 13;
      ctx.fillStyle = '#72eaff';
      ctx.fillRect(-g.r * pulse / 2, -g.r * pulse / 2, g.r * pulse, g.r * pulse);
      ctx.restore();
    });
    shots.forEach(s => {
      ctx.fillStyle = s.color || '#ff6c9e';
      ctx.shadowColor = s.color || '#ff6c9e';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    });
    bullets.forEach(b => {
      ctx.fillStyle = b.color || '#a8f8ff'; ctx.shadowColor = b.color || '#61e7f5'; ctx.shadowBlur = b.laser ? 22 : 12;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      if (b.laser) {
        ctx.globalAlpha = .45;
        ctx.fillRect(b.x - b.vx * .035, b.y - b.vy * .035, b.vx * .07, b.vy * .07);
        ctx.globalAlpha = 1;
      }
    });
    ctx.shadowBlur = 0;
    enemies.forEach(e => drawEnemyShip(e));
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (player) drawPlayer();
    if (player && player.aim && state === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(97,231,245,.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.aim.x, player.aim.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(player.aim.x, player.aim.y, 8 + Math.sin(elapsed * 7) * 2, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(player.aim.x - 12, player.aim.y);
      ctx.lineTo(player.aim.x + 12, player.aim.y);
      ctx.moveTo(player.aim.x, player.aim.y - 12);
      ctx.lineTo(player.aim.x, player.aim.y + 12);
      ctx.stroke();
      ctx.restore();
    }
    const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .2, width / 2, height / 2, Math.max(width, height) * .72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(4,7,16,.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawEnemyShip(e) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    const scale = e.radius / 12;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(angle); ctx.scale(scale, scale);
    ctx.shadowColor = e.color; ctx.shadowBlur = e.hit ? 22 : 12;
    const body = ctx.createLinearGradient(-18, -10, 14, 10);
    body.addColorStop(0, e.hit ? '#ffffff' : '#263753');
    body.addColorStop(.48, e.hit ? '#ffffff' : e.color);
    body.addColorStop(1, e.hit ? '#d9ffff' : '#101a2d');
    ctx.fillStyle = body;
    ctx.beginPath();
    if (e.type === 'boss') {
      ctx.moveTo(20, 0); ctx.lineTo(9, -15); ctx.lineTo(-4, -11); ctx.lineTo(-18, -20); ctx.lineTo(-13, -4);
      ctx.lineTo(-21, 0); ctx.lineTo(-13, 4); ctx.lineTo(-18, 20); ctx.lineTo(-4, 11); ctx.lineTo(9, 15); ctx.closePath();
    } else if (e.type === 'fast' || e.type === 'bit') {
      ctx.moveTo(15, 0); ctx.lineTo(-8, -8); ctx.lineTo(-13, -4); ctx.lineTo(-7, 0); ctx.lineTo(-13, 4); ctx.lineTo(-8, 8); ctx.closePath();
    } else if (e.type === 'shooter') {
      ctx.moveTo(17, 0); ctx.lineTo(4, -8); ctx.lineTo(-14, -12); ctx.lineTo(-9, 0); ctx.lineTo(-14, 12); ctx.lineTo(4, 8); ctx.closePath();
    } else if (e.type === 'splitter') {
      ctx.moveTo(17, 0); ctx.lineTo(5, -8); ctx.lineTo(-6, -15); ctx.lineTo(-10, -5); ctx.lineTo(-16, 0); ctx.lineTo(-10, 5); ctx.lineTo(-6, 15); ctx.lineTo(5, 8); ctx.closePath();
    } else {
      ctx.moveTo(17, 0); ctx.lineTo(4, -9); ctx.lineTo(-11, -7); ctx.lineTo(-16, 0); ctx.lineTo(-11, 7); ctx.lineTo(4, 9); ctx.closePath();
    }
    ctx.fill();
      ctx.shadowBlur = 0;
    if (e.type !== 'boss') {
      ctx.fillStyle = '#0a1222';
      ctx.fillRect(-8, -2, 12, 4);
      ctx.fillStyle = e.color;
      ctx.fillRect(4, -2, 7, 4);
      if (e.type === 'shooter' || e.type === 'tank') {
        ctx.strokeStyle = '#c9e6ff99'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-8, -13); ctx.moveTo(-2, 8); ctx.lineTo(-8, 13); ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#07101f'; ctx.beginPath(); ctx.arc(-1, 0, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(7, 0, 3, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = e.color;
    ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.moveTo(-14, -3); ctx.lineTo(-25 - Math.sin(elapsed * 12 + e.id) * 3, 0); ctx.lineTo(-14, 3); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    if (e.type !== 'boss' && (e.type === 'tank' || e.hp < e.maxHp)) {
      ctx.fillStyle = '#1a2030'; ctx.fillRect(-e.radius / scale, -e.radius / scale - 7, e.radius * 2 / scale, 3);
      ctx.fillStyle = e.color; ctx.fillRect(-e.radius / scale, -e.radius / scale - 7, e.radius * 2 / scale * clamp(e.hp / e.maxHp, 0, 1), 3);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const blinking = player.invulnerable > 0 && player.dashTime <= 0 && Math.floor(player.invulnerable * 14) % 2 === 0;
    if (blinking) return;
    const nearest = enemies.reduce((bestEnemy, e) => !bestEnemy || Math.hypot(e.x - player.x, e.y - player.y) < Math.hypot(bestEnemy.x - player.x, bestEnemy.y - player.y) ? e : bestEnemy, null);
    const angle = nearest ? Math.atan2(nearest.y - player.y, nearest.x - player.x) : -Math.PI / 2;
    ctx.save(); ctx.translate(player.x, player.y);
    if (player.shield > 0) {
      ctx.strokeStyle = `rgba(97,231,245,${.18 + player.shield / player.maxShield * .35})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 20 + Math.sin(elapsed * 4) * 1.2, 0, TAU); ctx.stroke();
    }
    if (player.dashTime > 0) {
      ctx.strokeStyle = 'rgba(134,237,223,.45)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.stroke();
    }
    ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = '#61e7f5'; ctx.shadowBlur = 18;
    const hull = ctx.createLinearGradient(-12, -16, 12, 14);
    hull.addColorStop(0, '#f4ffff'); hull.addColorStop(.45, '#a8d7e8'); hull.addColorStop(1, '#4d718d');
    ctx.fillStyle = hull;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(11, 12); ctx.lineTo(0, 7); ctx.lineTo(-11, 12); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#36556f';
    ctx.beginPath(); ctx.moveTo(-7, 7); ctx.lineTo(-16, 13); ctx.lineTo(-3, 10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, 7); ctx.lineTo(16, 13); ctx.lineTo(3, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d8fbff99'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 4); ctx.moveTo(-6, 6); ctx.lineTo(6, 6); ctx.stroke();
    ctx.fillStyle = '#61e7f5';
    ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.arc(0, -1, 1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8c76ff';
    ctx.globalAlpha = .75 + Math.random() * .25;
    ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(0, 18 + Math.random() * 7); ctx.lineTo(4, 10); ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    if (state !== 'playing') return;
    const dt = Math.min((now - lastTime) / 1000, .04);
    lastTime = now;
    update(dt); draw();
    if (state === 'playing') animationId = requestAnimationFrame(loop);
  }

  const touchControls = $('touchControls');
  const touchNub = $('touchNub');
  let activeTouch = null;
  function updateTouch(event) {
    const rect = touchControls.getBoundingClientRect();
    let x = (event.clientX - (rect.left + rect.width / 2)) / 45;
    let y = (event.clientY - (rect.top + rect.height / 2)) / 45;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    touchMove = { x, y };
    touchNub.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
  }
  function clearTouch() { activeTouch = null; touchMove = { x: 0, y: 0 }; touchNub.style.transform = ''; }
  function updateAim(event) {
    if (!player) return;
    const rect = canvas.getBoundingClientRect();
    player.aim = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  touchControls.addEventListener('pointerdown', event => { event.preventDefault(); activeTouch = event.pointerId; touchControls.setPointerCapture(activeTouch); updateTouch(event); });
  touchControls.addEventListener('pointermove', event => { if (event.pointerId === activeTouch) updateTouch(event); });
  touchControls.addEventListener('pointerup', event => { if (event.pointerId === activeTouch) clearTouch(); });
  touchControls.addEventListener('pointercancel', clearTouch);
  $('dashButton').addEventListener('pointerdown', event => { event.preventDefault(); tryDash(); });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') updateAim(event);
  });
  canvas.addEventListener('pointerleave', event => {
    if (player && event.pointerType === 'mouse') player.aim = null;
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || !player) return;
    event.preventDefault();
    updateAim(event);
    fireAtPoint(player.aim.x, player.aim.y);
  });

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    handleSecretInput(key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    keys.add(key);
    if (key === ' ' ) tryDash();
    if (key === 'f' && hasAutoFireControl() && state === 'playing') toggleAutoFire();
    if (key === 't' && hasTransformersPack() && state === 'playing') toggleTransformer();
    if ((key === 'escape' || key === 'p') && state === 'playing') pauseGame();
    else if ((key === 'escape' || key === 'p') && state === 'paused') resumeGame();
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { keys.clear(); clearTouch(); if (state === 'playing') pauseGame(); });
  $('startButton').addEventListener('click', startGame);
  $('gameResetButton').addEventListener('click', resetGameData);
  $('introSkip').addEventListener('click', dismissIntro);
  $('shopButton').addEventListener('click', () => { state = 'shop'; renderShop(); showScreen('shop'); });
  $('closeShopButton').addEventListener('click', () => { state = 'menu'; showScreen('start'); });
  $('shopBackButton').addEventListener('click', () => { state = 'menu'; showScreen('start'); });
  $('autoFireToggle').addEventListener('click', toggleAutoFire);
  $('transformToggle').addEventListener('click', toggleTransformer);
  $('resetProgressButton').addEventListener('click', resetProgress);
  $('resumeButton').addEventListener('click', resumeGame);
  $('restartPauseButton').addEventListener('click', startGame);
  $('playAgainButton').addEventListener('click', startGame);
  $('homeButton').addEventListener('click', () => { state = 'menu'; showScreen('start'); draw(); });
  $('bestScore').textContent = best.toLocaleString();
  $('panelBest').textContent = best.toLocaleString();
  renderShop();
  updateVeersUi();
  updateAutoFireUi();
  updateTransformerUi();
  renderSectors();
  updateSectorUi();
  $('startScreen').classList.add('hidden');
  introTimer = setTimeout(dismissIntro, 9000);
  resize(); draw();
})();
