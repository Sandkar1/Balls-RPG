(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const GROWTH_PATTERNS = [
    {
      id: "flat",
      name: "Steady Strikes",
      mode: "flat",
      tree: "Power",
      row: 1,
      column: 2,
      icon: "strike",
      description: "Adds growth value after each bounce. Reliable and easy to gear around."
    },
    {
      id: "percent",
      name: "Compound Force",
      mode: "percent",
      tree: "Growth",
      row: 2,
      column: 2,
      icon: "spiral",
      description: "Adds a percent of current damage after each bounce. Best with strong starts."
    },
    {
      id: "comboRamp",
      name: "Rising Cascade",
      mode: "comboRamp",
      tree: "Growth",
      row: 3,
      column: 2,
      icon: "cascade",
      description: "Blends flat and percent growth, then improves as the fight runs longer."
    },
    {
      id: "critical",
      name: "Starbreak Bursts",
      mode: "critical",
      tree: "Power",
      row: 3,
      column: 3,
      icon: "burst",
      description: "Adds steady growth with a chance to double current damage on a bounce."
    },
    {
      id: "streak",
      name: "Rhythm Chain",
      mode: "streak",
      tree: "Momentum",
      row: 3,
      column: 2,
      icon: "chain",
      description: "Rewards long bounce chains with increasingly large flat gains."
    },
    {
      id: "milestone",
      name: "Gatebreaker",
      mode: "milestone",
      tree: "Control",
      row: 4,
      column: 2,
      icon: "gate",
      description: "Growth rises as more bars are destroyed."
    }
  ];

  const TALENT_TREES = [
    { id: "power", name: "Power", description: "Opening damage and heavy hits." },
    { id: "momentum", name: "Momentum", description: "Speed, multi-ball pressure, and bounce rhythm." },
    { id: "control", name: "Control", description: "Gravity control and stable descents." },
    { id: "growth", name: "Growth", description: "Scaling patterns for long tracks." }
  ];

  const TALENTS = [
    {
      id: "opening_force",
      name: "Opening Force",
      tree: "Power",
      row: 1,
      column: 1,
      icon: "strike",
      maxRank: 3,
      minLevel: 1,
      modsPerRank: { startDamagePct: 8 },
      description: "More starting damage for fights that need early breaks."
    },
    {
      id: "deep_scaling",
      name: "Deep Scaling",
      tree: "Growth",
      row: 1,
      column: 2,
      icon: "spiral",
      maxRank: 3,
      minLevel: 1,
      modsPerRank: { growthValuePct: 10 },
      description: "Improves growth value for longer tracks and high-HP opponents."
    },
    {
      id: "quick_descent",
      name: "Quick Descent",
      tree: "Momentum",
      row: 1,
      column: 2,
      icon: "speed",
      maxRank: 3,
      minLevel: 2,
      modsPerRank: { speedPct: 6, gravityPct: 3 },
      description: "More speed with a little extra gravity pressure."
    },
    {
      id: "gravity_weave",
      name: "Gravity Weave",
      tree: "Control",
      row: 1,
      column: 2,
      icon: "gravity",
      maxRank: 3,
      minLevel: 2,
      modsPerRank: { gravityPct: -7, bouncePct: 3 },
      description: "Softer gravity and better rebounds for controlled lanes."
    },
    {
      id: "split_focus",
      name: "Split Focus",
      tree: "Momentum",
      row: 2,
      column: 1,
      icon: "split",
      requires: ["quick_descent"],
      maxRank: 2,
      minLevel: 3,
      modsPerRank: { ballCount: 1, startDamagePct: -6 },
      description: "Adds balls at the cost of some opening force."
    },
    {
      id: "weighted_lessons",
      name: "Weighted Lessons",
      tree: "Power",
      row: 2,
      column: 1,
      icon: "weight",
      requires: ["opening_force"],
      maxRank: 2,
      minLevel: 3,
      modsPerRank: { startDamagePct: 12, speedPct: -4 },
      description: "Heavy hits that ask you to solve speed elsewhere."
    },
    {
      id: "compound_study",
      name: "Compound Study",
      tree: "Growth",
      row: 2,
      column: 1,
      icon: "spiral",
      requires: ["deep_scaling"],
      maxRank: 1,
      minLevel: 2,
      unlockGrowthMode: "percent",
      modsPerRank: { startDamagePct: 4 },
      description: "Unlocks Compound Force and adds a small starting bonus."
    },
    {
      id: "cascade_study",
      name: "Cascade Study",
      tree: "Growth",
      row: 3,
      column: 2,
      icon: "cascade",
      requires: ["compound_study"],
      maxRank: 1,
      minLevel: 3,
      unlockGrowthMode: "comboRamp",
      modsPerRank: { growthValuePct: 6 },
      description: "Unlocks Rising Cascade for fights that scale over time."
    },
    {
      id: "starbreak_study",
      name: "Starbreak Study",
      tree: "Power",
      row: 3,
      column: 2,
      icon: "burst",
      requires: ["weighted_lessons"],
      maxRank: 1,
      minLevel: 4,
      unlockGrowthMode: "critical",
      modsPerRank: { growthValue: 2 },
      description: "Unlocks Starbreak Bursts for high-variance damage spikes."
    },
    {
      id: "rhythm_study",
      name: "Rhythm Study",
      tree: "Momentum",
      row: 3,
      column: 2,
      icon: "chain",
      requires: ["split_focus"],
      maxRank: 1,
      minLevel: 4,
      unlockGrowthMode: "streak",
      modsPerRank: { bouncePct: 5 },
      description: "Unlocks Rhythm Chain and rewards repeated contact."
    },
    {
      id: "gatebreaker_study",
      name: "Gatebreaker Study",
      tree: "Control",
      row: 3,
      column: 2,
      icon: "gate",
      requires: ["gravity_weave"],
      maxRank: 1,
      minLevel: 5,
      unlockGrowthMode: "milestone",
      modsPerRank: { startDamagePct: 5, growthValuePct: 5 },
      description: "Unlocks Gatebreaker for tracks with many bars."
    }
  ];

  function talentRank(player, talentId) {
    return Math.max(0, Math.floor(Number(player.talents[talentId]) || 0));
  }

  function getTalentMods(player) {
    const mods = {};
    for (const talent of TALENTS) {
      const rank = talentRank(player, talent.id);
      if (!rank) continue;
      RPG.addMods(mods, talent.modsPerRank, rank);
    }
    return mods;
  }

  function canLearnTalent(player, talent) {
    const rank = talentRank(player, talent.id);
    if (rank >= talent.maxRank) return { ok: false, reason: "Max rank" };
    if (player.level < talent.minLevel) return { ok: false, reason: "Requires level " + talent.minLevel };
    const missing = (talent.requires || []).find((talentId) => talentRank(player, talentId) <= 0);
    if (missing) return { ok: false, reason: "Requires " + talentName(missing) };
    if (player.talentPoints <= 0) return { ok: false, reason: "No talent points" };
    return { ok: true, reason: "" };
  }

  function talentName(talentId) {
    const talent = TALENTS.find((candidate) => candidate.id === talentId);
    return talent ? talent.name : "prerequisite";
  }

  function learnTalent(player, talentId) {
    const talent = TALENTS.find((candidate) => candidate.id === talentId);
    if (!talent) return { ok: false, message: "Talent not found." };
    const check = canLearnTalent(player, talent);
    if (!check.ok) return { ok: false, message: check.reason + "." };

    player.talents[talent.id] = talentRank(player, talent.id) + 1;
    player.talentPoints -= 1;
    player.spentTalentPoints += 1;
    if (talent.unlockGrowthMode && !player.unlockedGrowthModes.includes(talent.unlockGrowthMode)) {
      player.unlockedGrowthModes.push(talent.unlockGrowthMode);
    }
    return { ok: true, message: "Learned " + talent.name + "." };
  }

  function respecCost(player) {
    if (!player.spentTalentPoints) return 0;
    return Math.max(15, Math.floor(15 + player.level * 6 + player.spentTalentPoints * 4));
  }

  function respecTalents(player) {
    const cost = respecCost(player);
    if (player.gold < cost) return { ok: false, message: "Respec costs " + cost + " gold." };
    player.gold -= cost;
    player.talentPoints += player.spentTalentPoints;
    player.spentTalentPoints = 0;
    player.talents = {};
    player.unlockedGrowthModes = ["flat"];
    player.activeGrowthMode = "flat";
    return { ok: true, message: "Talents relearned. Points refunded." };
  }

  function setGrowthPattern(player, mode) {
    if (!player.unlockedGrowthModes.includes(mode)) {
      return { ok: false, message: "That growth pattern is not unlocked." };
    }
    player.activeGrowthMode = mode;
    const pattern = GROWTH_PATTERNS.find((candidate) => candidate.mode === mode);
    return { ok: true, message: "Using " + (pattern ? pattern.name : mode) + "." };
  }

  function growthPatternByMode(mode) {
    return GROWTH_PATTERNS.find((pattern) => pattern.mode === mode) || GROWTH_PATTERNS[0];
  }

  function talentsForTree(treeName) {
    return TALENTS
      .filter((talent) => talent.tree === treeName)
      .sort((a, b) => (a.row - b.row) || (a.column - b.column));
  }

  RPG.GROWTH_PATTERNS = GROWTH_PATTERNS;
  RPG.TALENT_TREES = TALENT_TREES;
  RPG.TALENTS = TALENTS;
  RPG.talentRank = talentRank;
  RPG.getTalentMods = getTalentMods;
  RPG.canLearnTalent = canLearnTalent;
  RPG.learnTalent = learnTalent;
  RPG.respecCost = respecCost;
  RPG.respecTalents = respecTalents;
  RPG.setGrowthPattern = setGrowthPattern;
  RPG.growthPatternByMode = growthPatternByMode;
  RPG.talentName = talentName;
  RPG.talentsForTree = talentsForTree;
})();
