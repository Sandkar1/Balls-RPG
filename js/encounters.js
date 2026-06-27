(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const SKIRMISH_TEMPLATES = [
    { id: "moss_lane_scout", name: "Moss Lane Scout", difficulty: "Easy", levelOffset: -1, rewardMult: 0.82, trait: "Fast low damage", hint: "Good for testing new gear.", mode: "flat", bias: { speed: 1.18, damage: 0.72, growth: 0.75, gravity: 0.96 }, playerTrackMultiplier: 0.92, enemyTrackMultiplier: 1.06 },
    { id: "ashen_slopeguard", name: "Ashen Slopeguard", difficulty: "Standard", levelOffset: 0, rewardMult: 1, trait: "Fast opener", hint: "Start damage or speed both work.", mode: "flat", bias: { speed: 1.08, damage: 0.95, growth: 0.9, gravity: 1.05 } },
    { id: "crystal_runekeeper", name: "Crystal Runekeeper", difficulty: "Standard", levelOffset: 0, rewardMult: 1.08, trait: "Scaling damage", hint: "Growth value wins long exchanges.", mode: "percent", bias: { speed: 0.92, damage: 1.08, growth: 1.25, bounce: 1.05 } },
    { id: "bandit_of_the_deep_track", name: "Bandit of the Deep Track", difficulty: "Standard", levelOffset: 0, rewardMult: 1.02, trait: "Heavy gravity", hint: "Control and bounce reduce bad angles.", mode: "flat", bias: { speed: 1.0, damage: 1.08, gravity: 1.18 } },
    { id: "glass_foot_cutthroat", name: "Glass Foot Cutthroat", difficulty: "Easy", levelOffset: 0, rewardMult: 0.9, trait: "Fragile speed rush", hint: "A little start damage can punish this runner.", mode: "flat", bias: { speed: 1.28, damage: 0.68, growth: 0.72, gravity: 1.02 }, enemyTrackMultiplier: 1.12 },
    { id: "iron_lane_duelist", name: "Iron Lane Duelist", difficulty: "Hard", levelOffset: 1, rewardMult: 1.35, trait: "High start damage", hint: "Bring enough speed to avoid falling behind early.", mode: "critical", bias: { speed: 0.96, damage: 1.28, growth: 0.82 }, playerTrackMultiplier: 1.05, enemyTrackMultiplier: 0.98 },
    { id: "hollow_gate_adept", name: "Hollow Gate Adept", difficulty: "Hard", levelOffset: 1, rewardMult: 1.35, trait: "Control build", hint: "High growth or cleaner gravity helps.", mode: "streak", bias: { speed: 0.96, growth: 1.12, gravity: 0.86, bounce: 1.14 }, playerTrackMultiplier: 1.04 },
    { id: "ember_tower_runner", name: "Ember Tower Runner", difficulty: "Hard", levelOffset: 1, rewardMult: 1.4, trait: "Multi-ball pressure", hint: "One-ball damage must be sharp here.", mode: "flat", bias: { speed: 1.03, damage: 0.9, growth: 1.02, ballCount: 1 }, enemyTrackMultiplier: 0.96 },
    { id: "silver_vault_warden", name: "Silver Vault Warden", difficulty: "Elite", levelOffset: 2, rewardMult: 1.75, trait: "Balanced elite", hint: "Hybrid builds are safest.", mode: "comboRamp", bias: { speed: 1.07, damage: 1.14, growth: 1.12, gravity: 1.04 }, playerTrackMultiplier: 1.1, enemyTrackMultiplier: 0.94 },
    { id: "nightfall_arcanist", name: "Nightfall Arcanist", difficulty: "Elite", levelOffset: 2, rewardMult: 1.82, trait: "Late burst", hint: "End the race quickly or outscale it.", mode: "milestone", bias: { speed: 0.94, damage: 1.04, growth: 1.42, bounce: 1.08 }, playerTrackMultiplier: 1.12, enemyTrackMultiplier: 0.94 },
    { id: "granite_maul_knight", name: "Granite Maul Knight", difficulty: "Elite", levelOffset: 2, rewardMult: 1.88, trait: "Slow heavy hits", hint: "Speed rush beats this if your damage is adequate.", mode: "flat", bias: { speed: 0.82, damage: 1.58, growth: 0.95, gravity: 1.25, bounce: 0.95 }, playerTrackMultiplier: 1.08 },
    { id: "skychain_evoker", name: "Skychain Evoker", difficulty: "Hard", levelOffset: 1, rewardMult: 1.42, trait: "Low gravity chains", hint: "Gravity gear and bounce control matter.", mode: "streak", bias: { speed: 1.0, damage: 0.94, growth: 1.28, gravity: 0.7, bounce: 1.24 }, playerTrackMultiplier: 1.03 }
  ];

  const STORY_FIGHTS = [
    {
      id: "iron_herald",
      name: "The Iron Herald",
      minLevel: 2,
      level: 2,
      trait: "Armored first gate",
      description: "A durable opener that tests whether your first upgrades are online.",
      difficulty: "Boss",
      hint: "Prepare with at least one stronger damage or growth item.",
      mode: "flat",
      bias: { speed: 1.04, damage: 1.32, growth: 1.1, gravity: 1.06 },
      playerTrackMultiplier: 1.12,
      enemyTrackMultiplier: 0.92,
      rewardMult: 1.25,
      rarity: "magic"
    },
    {
      id: "veyra_falling_star",
      name: "Veyra the Falling Star",
      minLevel: 4,
      level: 4,
      trait: "Speed and gravity",
      description: "A quick opponent that punishes slow, heavy setups.",
      difficulty: "Boss",
      hint: "Speed or lower gravity keeps this fight manageable.",
      mode: "critical",
      bias: { speed: 1.28, damage: 1.22, growth: 1.02, gravity: 1.24, bounce: 0.98 },
      playerTrackMultiplier: 1.16,
      enemyTrackMultiplier: 0.9,
      rewardMult: 1.32,
      rarity: "rare"
    },
    {
      id: "morvane_hollow_gate",
      name: "Morvane of the Hollow Gate",
      minLevel: 6,
      level: 6,
      trait: "Long scaling track",
      description: "The gate is thick enough that growth patterns start to matter.",
      difficulty: "Boss",
      hint: "Growth Value and scaling patterns are strongly recommended.",
      mode: "comboRamp",
      bias: { speed: 1.02, damage: 1.24, growth: 1.56, gravity: 0.95, bounce: 1.14 },
      playerTrackMultiplier: 1.22,
      enemyTrackMultiplier: 0.9,
      rewardMult: 1.38,
      rarity: "rare"
    },
    {
      id: "oracle_of_glass_depths",
      name: "Oracle of the Glass Depths",
      minLevel: 8,
      level: 8,
      trait: "High control",
      description: "A precise rival with strong bounce chains and clean rebounds.",
      difficulty: "Boss",
      hint: "Control builds need enough damage; damage builds need enough bounce.",
      mode: "streak",
      bias: { speed: 1.12, damage: 1.3, growth: 1.38, gravity: 0.86, bounce: 1.24 },
      playerTrackMultiplier: 1.28,
      enemyTrackMultiplier: 0.88,
      rewardMult: 1.45,
      rarity: "epic"
    },
    {
      id: "gravity_king",
      name: "The Gravity King",
      minLevel: 10,
      level: 10,
      trait: "Final descent",
      description: "The last story fight demands a complete build rather than one inflated stat.",
      difficulty: "Boss",
      hint: "Bring a complete build: start damage, growth, speed, and control.",
      mode: "milestone",
      bias: { speed: 1.2, damage: 1.5, growth: 1.5, gravity: 1.22, bounce: 1.1, ballCount: 1 },
      playerTrackMultiplier: 1.34,
      enemyTrackMultiplier: 0.86,
      rewardMult: 1.6,
      rarity: "legendary"
    }
  ];

  const ENEMY_DAMAGE_SCALE = 0.42;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeTrack(level, type, multiplier) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const typeMult = type === "story" ? 1.28 : type === "quest" ? 1.18 : 1;
    const healthMult = Number(multiplier || 1) * typeMult;
    return {
      barCount: clamp(Math.round(10 + safeLevel * 1.05 + (type === "story" ? 2 : 0)), 10, 22),
      barHealth: Math.round(120 * Math.pow(1.32, safeLevel - 1) * healthMult),
      barHealthGrowth: Number((4 + safeLevel * 0.9 + (type === "story" ? 1.4 : 0)).toFixed(1)),
      barGap: clamp(8 - Math.floor(safeLevel / 4), 5, 8)
    };
  }

  function enemyStats(level, mode, bias) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const tuned = {
      speed: 1,
      damage: 1,
      growth: 1,
      gravity: 1,
      bounce: 1,
      ballCount: 0,
      ...(bias || {})
    };
    return {
      ballCount: clamp(2 + Math.floor(safeLevel / 4) + Math.floor(tuned.ballCount || 0), 1, 9),
      ballSize: 15,
      startDamage: Math.max(1, Math.round((7 + safeLevel * 3.4) * tuned.damage * ENEMY_DAMAGE_SCALE)),
      growthValue: Math.max(0, Math.round((3 + safeLevel * 1.55) * tuned.growth * ENEMY_DAMAGE_SCALE)),
      growthMode: mode || "flat",
      speed: Math.round((318 + safeLevel * 18) * tuned.speed),
      gravity: Math.round((350 + safeLevel * 11) * tuned.gravity),
      bounce: Number(clamp(0.9 + safeLevel * 0.012, 0.82, 1.22).toFixed(2)) * tuned.bounce
    };
  }

  function rewards(level, type, multiplier) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const mult = type === "story" ? 2.8 : type === "quest" ? 2.1 : 1;
    const rewardMult = Number(multiplier || 1);
    return {
      xp: Math.round((34 + safeLevel * 24) * mult * rewardMult),
      gold: Math.round((20 + safeLevel * 13) * mult * rewardMult)
    };
  }

  function makeEncounter(type, source, level, options) {
    const opts = options || {};
    const encounterLevel = Math.max(1, Math.floor(Number(level) || 1));
    const playerTrack = makeTrack(encounterLevel, type, opts.playerTrackMultiplier || source.playerTrackMultiplier || 1);
    const enemyTrack = makeTrack(encounterLevel, type, opts.enemyTrackMultiplier || source.enemyTrackMultiplier || 1);
    const rewardMult = opts.rewardMult || source.rewardMult || 1;
    return {
      id: type + "-" + source.id,
      sourceId: source.id,
      type,
      name: source.name,
      enemyName: source.name,
      level: encounterLevel,
      minLevel: source.minLevel || Math.max(1, encounterLevel - 2),
      trait: source.trait || "Unknown",
      description: source.description || "",
      difficulty: source.difficulty || (type === "story" ? "Boss" : "Standard"),
      hint: source.hint || "",
      playerTrack,
      enemyTrack,
      enemyStats: enemyStats(encounterLevel, source.mode, source.bias),
      rewards: opts.rewards || rewards(encounterLevel, type, rewardMult),
      lootChance: opts.lootChance == null ? (type === "story" ? 100 : Math.min(82, Math.round(42 * rewardMult))) : opts.lootChance,
      lootGuaranteed: opts.lootGuaranteed == null ? (type === "story" ? 1 : 0) : opts.lootGuaranteed,
      guaranteedRarity: opts.guaranteedRarity || source.rarity || null,
      playerModifiers: opts.playerModifiers || null,
      requirement: opts.requirement || "",
      storyIndex: opts.storyIndex,
      questId: opts.questId
    };
  }

  function getSkirmishes(player) {
    const progress = Math.max(0, player.storyProgress || 0);
    return SKIRMISH_TEMPLATES.map((template, index) => {
      const level = Math.max(1, player.level + progress + Math.floor(index / 5) + (template.levelOffset || 0));
      const encounter = makeEncounter("skirmish", template, level);
      encounter.available = player.level >= encounter.minLevel;
      return encounter;
    });
  }

  function createSkirmishEncounter(templateId, player) {
    const template = SKIRMISH_TEMPLATES.find((candidate) => candidate.id === templateId) || SKIRMISH_TEMPLATES[0];
    return getSkirmishes(player).find((encounter) => encounter.sourceId === template.id) || makeEncounter("skirmish", template, player.level);
  }

  function getStoryFights(player) {
    return STORY_FIGHTS.map((fight, index) => {
      const encounter = makeEncounter("story", fight, fight.level, {
        storyIndex: index,
        guaranteedRarity: fight.rarity
      });
      encounter.completed = index < player.storyProgress;
      encounter.current = index === player.storyProgress;
      encounter.available = encounter.current && player.level >= fight.minLevel;
      encounter.locked = !encounter.completed && !encounter.available;
      return encounter;
    });
  }

  function createStoryEncounter(storyId, player) {
    return getStoryFights(player).find((encounter) => encounter.sourceId === storyId) || null;
  }

  RPG.SKIRMISH_TEMPLATES = SKIRMISH_TEMPLATES;
  RPG.STORY_FIGHTS = STORY_FIGHTS;
  RPG.makeTrack = makeTrack;
  RPG.enemyStats = enemyStats;
  RPG.makeEncounter = makeEncounter;
  RPG.getSkirmishes = getSkirmishes;
  RPG.createSkirmishEncounter = createSkirmishEncounter;
  RPG.getStoryFights = getStoryFights;
  RPG.createStoryEncounter = createStoryEncounter;
})();
