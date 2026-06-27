(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const QUESTS = [
    {
      id: "feather_trial",
      name: "The Feather Trial",
      minLevel: 2,
      level: 2,
      description: "Win a low-gravity descent where rebounds stay loose and speed control matters.",
      requirement: "Your gravity is reduced by 35%.",
      playerModifiers: { gravityPct: -35, bouncePct: 5 },
      mode: "flat",
      bias: { speed: 0.98, damage: 1.0, growth: 1.0, gravity: 0.78, bounce: 1.12 },
      rewards: { xp: 110, gold: 70 },
      rarity: "magic"
    },
    {
      id: "scholars_spiral",
      name: "The Scholar's Spiral",
      minLevel: 3,
      level: 4,
      description: "Use Rising Cascade to beat a fight that gets easier only after your damage has time to mature.",
      requirement: "Active growth pattern must be Rising Cascade.",
      requiredGrowthMode: "comboRamp",
      playerModifiers: { speedPct: -5 },
      mode: "percent",
      bias: { speed: 0.94, damage: 1.06, growth: 1.18, gravity: 1.0 },
      rewards: { xp: 190, gold: 115 },
      rarity: "rare"
    },
    {
      id: "still_gate",
      name: "The Still Gate",
      minLevel: 4,
      level: 5,
      description: "A thick track against a slow rival. Pure speed is less reliable than strong scaling.",
      requirement: "Track health is increased by 45%.",
      playerModifiers: { speedPct: -4, growthValuePct: 10 },
      trackMultiplier: 1.45,
      mode: "milestone",
      bias: { speed: 0.78, damage: 1.2, growth: 1.24, gravity: 0.9, bounce: 1.1 },
      rewards: { xp: 260, gold: 145 },
      rarity: "rare"
    },
    {
      id: "first_spark_contract",
      name: "First Spark Contract",
      minLevel: 5,
      level: 6,
      description: "A contract built for opening damage. Growth is dampened, so early breaks carry the run.",
      requirement: "Your growth value is reduced by 35%.",
      playerModifiers: { growthValuePct: -35, startDamagePct: 12 },
      mode: "critical",
      bias: { speed: 1.04, damage: 1.16, growth: 0.96, gravity: 1.08 },
      rewards: { xp: 320, gold: 190 },
      rarity: "epic"
    }
  ];

  function questStatus(player, quest) {
    if (player.completedQuests.includes(quest.id)) {
      return { completed: true, available: false, reason: "Completed" };
    }
    if (player.level < quest.minLevel) {
      return { completed: false, available: false, reason: "Requires level " + quest.minLevel };
    }
    if (quest.requiredGrowthMode && player.activeGrowthMode !== quest.requiredGrowthMode) {
      const pattern = RPG.growthPatternByMode(quest.requiredGrowthMode);
      return { completed: false, available: false, reason: "Use " + pattern.name };
    }
    return { completed: false, available: true, reason: "" };
  }

  function getQuests(player) {
    return QUESTS.map((quest) => ({ ...quest, status: questStatus(player, quest) }));
  }

  function createQuestEncounter(questId, player) {
    const quest = QUESTS.find((candidate) => candidate.id === questId);
    if (!quest) return null;
    const status = questStatus(player, quest);
    if (!status.available) return null;
    return RPG.makeEncounter("quest", quest, quest.level, {
      questId: quest.id,
      rewards: quest.rewards,
      lootChance: 100,
      lootGuaranteed: 1,
      guaranteedRarity: quest.rarity,
      playerModifiers: quest.playerModifiers,
      playerTrackMultiplier: quest.trackMultiplier || 1,
      enemyTrackMultiplier: quest.trackMultiplier || 1,
      requirement: quest.requirement
    });
  }

  RPG.QUESTS = QUESTS;
  RPG.questStatus = questStatus;
  RPG.getQuests = getQuests;
  RPG.createQuestEncounter = createQuestEncounter;
})();
