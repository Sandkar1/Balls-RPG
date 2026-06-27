(function () {
  "use strict";

  const RPG = window.BounceRPG = window.BounceRPG || {};

  const EQUIPMENT_SLOTS = ["head", "chest", "hands", "feet", "ring", "trinket"];

  const LEGACY_SLOT_MAP = {
    core: "trinket",
    shell: "chest",
    trail: "feet",
    charm: "ring"
  };

  const SLOT_LABELS = {
    head: "Head",
    chest: "Chest",
    hands: "Hands",
    feet: "Feet",
    ring: "Ring",
    trinket: "Trinket"
  };

  const STAT_LABELS = {
    ballCount: "Balls",
    ballSize: "Ball size",
    startDamage: "Start damage",
    startDamagePct: "Start damage",
    growthValue: "Growth value",
    growthValuePct: "Growth value",
    speed: "Speed",
    speedPct: "Speed",
    gravity: "Gravity",
    gravityPct: "Gravity",
    bounce: "Bounciness",
    bouncePct: "Bounciness",
    ballSizePct: "Ball size",
    ballCountPct: "Balls"
  };

  const BASE_STATS = {
    ballCount: 1,
    ballSize: 15,
    startDamage: 8,
    growthValue: 4,
    speed: 340,
    gravity: 360,
    bounce: 0.94
  };

  const game = {
    player: null,
    currentView: "map",
    activeEncounter: null,
    message: "",
    won: false,
    lastRewards: null
  };

  function createId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function createDefaultPlayer(name) {
    const trimmed = String(name || "").trim();
    const playerName = trimmed || "Wayfarer";
    const equipment = {};
    for (const slot of EQUIPMENT_SLOTS) equipment[slot] = null;

    return {
      version: 3,
      name: playerName.slice(0, 24),
      level: 1,
      xp: 0,
      gold: 120,
      baseStats: { ...BASE_STATS },
      talentPoints: 1,
      spentTalentPoints: 0,
      talents: {},
      unlockedGrowthModes: ["flat"],
      activeGrowthMode: "flat",
      storyProgress: 0,
      completedQuests: [],
      inventory: [],
      equipment,
      shopStock: [],
      recentLoot: [],
      createdAt: new Date().toISOString()
    };
  }

  function normalizePlayer(player) {
    if (!player) return null;
    const incomingVersion = Math.max(1, Math.floor(Number(player.version) || 1));
    const normalized = {
      ...createDefaultPlayer(player.name || "Wayfarer"),
      ...player
    };
    normalized.baseStats = { ...BASE_STATS, ...(player.baseStats || {}) };
    if (incomingVersion < 3 && Number(normalized.baseStats.ballCount) === 3) {
      normalized.baseStats.ballCount = 1;
    }
    normalized.talents = player.talents || {};
    normalized.unlockedGrowthModes = Array.isArray(player.unlockedGrowthModes) && player.unlockedGrowthModes.length
      ? player.unlockedGrowthModes
      : ["flat"];
    if (!normalized.unlockedGrowthModes.includes(normalized.activeGrowthMode)) {
      normalized.activeGrowthMode = "flat";
    }
    normalized.completedQuests = Array.isArray(player.completedQuests) ? player.completedQuests : [];
    normalized.inventory = normalizeItems(Array.isArray(player.inventory) ? player.inventory : []);
    normalized.shopStock = normalizeItems(Array.isArray(player.shopStock) ? player.shopStock : []);
    normalized.recentLoot = Array.isArray(player.recentLoot) ? player.recentLoot : [];
    normalized.equipment = normalizeEquipment(player.equipment || {}, normalized.inventory);
    normalized.level = Math.max(1, Math.floor(Number(normalized.level) || 1));
    normalized.xp = Math.max(0, Math.floor(Number(normalized.xp) || 0));
    normalized.gold = Math.max(0, Math.floor(Number(normalized.gold) || 0));
    normalized.talentPoints = Math.max(0, Math.floor(Number(normalized.talentPoints) || 0));
    normalized.spentTalentPoints = Math.max(0, Math.floor(Number(normalized.spentTalentPoints) || 0));
    normalized.storyProgress = Math.max(0, Math.floor(Number(normalized.storyProgress) || 0));
    normalized.version = 3;
    return normalized;
  }

  function normalizeSlot(slot) {
    return LEGACY_SLOT_MAP[slot] || (EQUIPMENT_SLOTS.includes(slot) ? slot : "trinket");
  }

  function normalizeItems(items) {
    return items.map((item) => {
      const slot = normalizeSlot(item.slot);
      return { ...item, slot };
    });
  }

  function normalizeEquipment(equipment, inventory) {
    const normalized = {};
    for (const slot of EQUIPMENT_SLOTS) normalized[slot] = null;

    for (const [slot, itemId] of Object.entries(equipment || {})) {
      if (!itemId) continue;
      const nextSlot = normalizeSlot(slot);
      if (!normalized[nextSlot]) normalized[nextSlot] = itemId;
    }

    for (const slot of EQUIPMENT_SLOTS) {
      const item = inventory.find((candidate) => candidate.id === normalized[slot]);
      if (!item || item.slot !== slot) normalized[slot] = null;
    }

    for (const item of inventory) {
      if (!normalized[item.slot] && Object.values(equipment || {}).includes(item.id)) {
        normalized[item.slot] = item.id;
      }
    }

    return normalized;
  }

  function xpToNext(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return Math.floor(90 + safeLevel * 55 + Math.pow(safeLevel, 1.55) * 38);
  }

  function addXp(player, amount) {
    let gained = Math.max(0, Math.floor(Number(amount) || 0));
    const levels = [];
    player.xp += gained;
    while (player.xp >= xpToNext(player.level)) {
      player.xp -= xpToNext(player.level);
      player.level += 1;
      player.talentPoints += 1;
      levels.push(player.level);
    }
    return levels;
  }

  function addGold(player, amount) {
    player.gold = Math.max(0, Math.floor(player.gold + Number(amount || 0)));
  }

  function findInventoryItem(player, itemId) {
    return player.inventory.find((item) => item.id === itemId) || null;
  }

  function getEquippedItems(player) {
    const items = [];
    for (const slot of EQUIPMENT_SLOTS) {
      const item = findInventoryItem(player, player.equipment[slot]);
      if (item) items.push(item);
    }
    return items;
  }

  function addMods(target, mods, multiplier) {
    const scale = multiplier == null ? 1 : multiplier;
    if (!mods) return target;
    for (const [key, value] of Object.entries(mods)) {
      target[key] = (target[key] || 0) + Number(value || 0) * scale;
    }
    return target;
  }

  function collectModifiers(player, extraMods) {
    const mods = {};
    for (const item of getEquippedItems(player)) {
      addMods(mods, item.mods);
    }
    if (RPG.getTalentMods) addMods(mods, RPG.getTalentMods(player));
    addMods(mods, extraMods);
    return mods;
  }

  function resolveStat(base, mods, key, options) {
    const settings = options || {};
    const flat = Number(mods[key] || 0);
    const pct = Number(mods[key + "Pct"] || 0);
    let value = (Number(base[key]) + flat) * (1 + pct / 100);
    if (settings.min != null) value = Math.max(settings.min, value);
    if (settings.max != null) value = Math.min(settings.max, value);
    return settings.float ? Number(value.toFixed(settings.precision || 2)) : Math.round(value);
  }

  function getEffectiveStats(player, extraMods) {
    const base = player.baseStats || BASE_STATS;
    const mods = collectModifiers(player, extraMods);
    return {
      ballCount: resolveStat(base, mods, "ballCount", { min: 1, max: 18 }),
      ballSize: resolveStat(base, mods, "ballSize", { min: 8, max: 80 }),
      startDamage: resolveStat(base, mods, "startDamage", { min: 1 }),
      growthValue: resolveStat(base, mods, "growthValue", { min: 0 }),
      speed: resolveStat(base, mods, "speed", { min: 120, max: 5000 }),
      gravity: resolveStat(base, mods, "gravity", { min: 0, max: 20000 }),
      bounce: resolveStat(base, mods, "bounce", { min: 0.2, max: 2.4, float: true, precision: 2 }),
      growthMode: player.activeGrowthMode || "flat",
      mods
    };
  }

  function setMessage(text) {
    game.message = text || "";
  }

  function pushMessage(text) {
    game.message = text || "";
  }

  function compactNumber(value) {
    const n = Math.max(0, Number(value) || 0);
    if (n >= 1000000000000) return (n / 1000000000000).toFixed(1).replace(".0", "") + "t";
    if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(".0", "") + "b";
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "m";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
    return Math.round(n).toString();
  }

  function signed(value, suffix) {
    const n = Number(value || 0);
    const sign = n > 0 ? "+" : "";
    return sign + (Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, "")) + (suffix || "");
  }

  function describeMods(mods) {
    if (!mods || !Object.keys(mods).length) return "No stat modifiers";
    return Object.entries(mods).map(([key, value]) => {
      const isPct = key.endsWith("Pct");
      const labelKey = isPct ? key.slice(0, -3) + "Pct" : key;
      return signed(value, isPct ? "%" : "") + " " + (STAT_LABELS[labelKey] || key);
    }).join(", ");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  RPG.EQUIPMENT_SLOTS = EQUIPMENT_SLOTS;
  RPG.LEGACY_SLOT_MAP = LEGACY_SLOT_MAP;
  RPG.SLOT_LABELS = SLOT_LABELS;
  RPG.STAT_LABELS = STAT_LABELS;
  RPG.BASE_STATS = BASE_STATS;
  RPG.game = game;
  RPG.createId = createId;
  RPG.createDefaultPlayer = createDefaultPlayer;
  RPG.normalizePlayer = normalizePlayer;
  RPG.xpToNext = xpToNext;
  RPG.addXp = addXp;
  RPG.addGold = addGold;
  RPG.findInventoryItem = findInventoryItem;
  RPG.getEquippedItems = getEquippedItems;
  RPG.addMods = addMods;
  RPG.collectModifiers = collectModifiers;
  RPG.getEffectiveStats = getEffectiveStats;
  RPG.setMessage = setMessage;
  RPG.pushMessage = pushMessage;
  RPG.compactNumber = compactNumber;
  RPG.signed = signed;
  RPG.describeMods = describeMods;
  RPG.escapeHtml = escapeHtml;
})();
