(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const RARITIES = {
    common: { id: "common", name: "Common", affixes: 1, weight: 56, cost: 1, scale: 1, colorClass: "rarity-common" },
    magic: { id: "magic", name: "Magic", affixes: 2, weight: 28, cost: 1.55, scale: 1.15, colorClass: "rarity-magic" },
    arcane: { id: "arcane", name: "Arcane", affixes: 3, weight: 9, cost: 2.35, scale: 1.32, colorClass: "rarity-arcane" },
    rare: { id: "rare", name: "Rare", affixes: [2, 3], weight: 10, cost: 2.55, scale: 1.45, colorClass: "rarity-rare" },
    epic: { id: "epic", name: "Epic", affixes: 4, weight: 2, cost: 5.8, scale: 1.82, colorClass: "rarity-epic" },
    legendary: { id: "legendary", name: "Legendary", affixes: 4, weight: 0.7, cost: 7.2, scale: 2.1, colorClass: "rarity-legendary" }
  };

  const SLOT_NOUNS = {
    head: ["Helm", "Crown", "Visor", "Circlet"],
    chest: ["Vest", "Plate", "Harness", "Mantle"],
    hands: ["Grips", "Gloves", "Gauntlets", "Wraps"],
    feet: ["Boots", "Greaves", "Treads", "Sabatons"],
    ring: ["Band", "Loop", "Signet", "Ring"],
    trinket: ["Charm", "Idol", "Rune", "Relic"]
  };

  const AFFIXES = [
    { id: "keen", name: "Keen", mods: { startDamagePct: [7, 14] }, weight: 14 },
    { id: "forceful", name: "Forceful", mods: { startDamage: [4, 14] }, weight: 13 },
    { id: "crushing", name: "Crushing", mods: { startDamagePct: [18, 30], speedPct: [-8, -4] }, weight: 7 },
    { id: "surging", name: "Surging", mods: { growthValuePct: [9, 18] }, weight: 14 },
    { id: "runed", name: "Runed", mods: { growthValue: [2, 8] }, weight: 13 },
    { id: "patient", name: "Patient", mods: { growthValuePct: [18, 30], speedPct: [-7, -3] }, weight: 7 },
    { id: "swift", name: "Swift", mods: { speedPct: [6, 14] }, weight: 14 },
    { id: "rushing", name: "Rushing", mods: { speed: [24, 95] }, weight: 12 },
    { id: "hollow", name: "Hollow", mods: { speedPct: [14, 24], startDamagePct: [-9, -4] }, weight: 7 },
    { id: "feathered", name: "Feathered", mods: { gravityPct: [-14, -5] }, weight: 11 },
    { id: "weighted", name: "Weighted", mods: { gravityPct: [9, 20] }, weight: 11 },
    { id: "anchored", name: "Anchored", mods: { gravityPct: [18, 30], bouncePct: [-8, -3] }, weight: 7 },
    { id: "springbound", name: "Springbound", mods: { bouncePct: [5, 13] }, weight: 11 },
    { id: "steady", name: "Steady", mods: { bouncePct: [-8, -3], growthValuePct: [12, 22] }, weight: 8 },
    { id: "deadfall", name: "Deadfall", mods: { bouncePct: [-16, -7], gravityPct: [5, 12], startDamagePct: [5, 12] }, weight: 7 },
    { id: "gravebound", name: "Gravebound", mods: { bouncePct: [-18, -8], speedPct: [-5, -2], growthValuePct: [10, 20] }, weight: 7 },
    { id: "measured", name: "Measured", mods: { bouncePct: [-10, -4], ballSizePct: [5, 12] }, weight: 9 },
    { id: "wide", name: "Wide", mods: { ballSizePct: [8, 18] }, weight: 8 },
    { id: "needle", name: "Needle", mods: { ballSizePct: [-14, -5], speedPct: [5, 10] }, weight: 8 },
    { id: "split", name: "Split", mods: { ballCount: [1, 1], startDamagePct: [-12, -6] }, weight: 5 },
    { id: "chorus", name: "Chorus", mods: { ballCount: [1, 2], growthValuePct: [-12, -5] }, weight: 4 },
    { id: "focused", name: "Focused", mods: { startDamagePct: [12, 22], ballCount: [-1, -1] }, weight: 6 },
    { id: "balanced", name: "Balanced", mods: { startDamagePct: [5, 10], growthValuePct: [5, 10] }, weight: 10 },
    { id: "polished", name: "Polished", mods: { speedPct: [4, 9], bouncePct: [3, 8] }, weight: 10 },
    { id: "volatile", name: "Volatile", mods: { growthValuePct: [20, 34], gravityPct: [-10, -4] }, weight: 6 },
    { id: "dense", name: "Dense", mods: { startDamage: [9, 24], speedPct: [-12, -5] }, weight: 7 },
    { id: "kindled", name: "Kindled", mods: { startDamage: [3, 10], growthValue: [1, 4] }, weight: 9 },
    { id: "oathbound", name: "Oathbound", mods: { startDamagePct: [8, 16], growthValuePct: [8, 16], speedPct: [-6, -2] }, weight: 7 },
    { id: "sapphire", name: "Sapphire", mods: { speedPct: [5, 11], growthValue: [2, 7], bouncePct: [-7, -3] }, weight: 6 },
    { id: "blackened", name: "Blackened", mods: { startDamage: [8, 20], gravityPct: [6, 14], bouncePct: [-12, -5] }, weight: 6 },
    { id: "silvered", name: "Silvered", mods: { startDamagePct: [5, 12], speedPct: [4, 9], ballSizePct: [-8, -3] }, weight: 8 }
  ];

  function randomInt(min, max) {
    const low = Math.ceil(Math.min(min, max));
    const high = Math.floor(Math.max(min, max));
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  function affixCountForRarity(rarity) {
    return Array.isArray(rarity.affixes)
      ? randomInt(rarity.affixes[0], rarity.affixes[1])
      : rarity.affixes;
  }

  function chooseWeighted(list, weightKey) {
    const total = list.reduce((sum, item) => sum + Number(item[weightKey] || 0), 0);
    let roll = Math.random() * total;
    for (const item of list) {
      roll -= Number(item[weightKey] || 0);
      if (roll <= 0) return item;
    }
    return list[list.length - 1];
  }

  function rollRarity(level, bonus) {
    const levelBonus = Math.max(0, Number(level || 1) - 1) * 0.45 + Number(bonus || 0);
    const weighted = Object.values(RARITIES).map((rarity) => {
      const boost = rarity.id === "arcane" ? levelBonus * 0.7 : rarity.id === "rare" ? levelBonus : rarity.id === "epic" ? levelBonus * 0.28 : rarity.id === "legendary" ? levelBonus * 0.08 : 0;
      const drag = rarity.id === "common" ? levelBonus * 0.9 : 0;
      return { ...rarity, weight: Math.max(1, rarity.weight + boost - drag) };
    });
    return chooseWeighted(weighted, "weight").id;
  }

  function rollAffix(level, rarityScale, usedIds) {
    const available = AFFIXES.filter((affix) => !usedIds.has(affix.id));
    const affix = chooseWeighted(available, "weight");
    usedIds.add(affix.id);

    const scale = rarityScale * (1 + Math.max(0, level - 1) * 0.085);
    const mods = {};
    for (const [key, range] of Object.entries(affix.mods)) {
      const rolled = randomInt(range[0], range[1]);
      const isTradeoff = rolled < 0;
      const value = isTradeoff ? rolled : Math.max(1, Math.round(rolled * scale));
      mods[key] = value;
    }
    return { id: affix.id, name: affix.name, mods };
  }

  function mergeMods(affixes) {
    const mods = {};
    for (const affix of affixes) {
      RPG.addMods(mods, affix.mods);
    }
    return mods;
  }

  function generateItem(level, forcedSlot, forcedRarity) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const slot = forcedSlot || RPG.EQUIPMENT_SLOTS[randomInt(0, RPG.EQUIPMENT_SLOTS.length - 1)];
    const rarityId = forcedRarity || rollRarity(safeLevel);
    const rarity = RARITIES[rarityId] || RARITIES.common;
    const usedIds = new Set();
    const affixes = [];
    const affixCount = affixCountForRarity(rarity);
    for (let i = 0; i < affixCount; i++) {
      affixes.push(rollAffix(safeLevel, rarity.scale, usedIds));
    }

    const nouns = SLOT_NOUNS[slot];
    const noun = nouns[randomInt(0, nouns.length - 1)];
    const prefix = affixes[0] ? affixes[0].name : rarity.name;
    const suffix = affixes[1] ? " of " + affixes[1].name : "";
    const epicName = rarity.id === "epic" ? "Dread " + prefix + " " + noun : null;
    const legendaryName = rarity.id === "legendary" ? "Dawn " + noun + " of " + prefix : null;
    const name = legendaryName || epicName || prefix + " " + noun + suffix;
    const value = Math.round((34 + safeLevel * 22) * rarity.cost * (1 + affixes.length * 0.18));

    return {
      id: RPG.createId("item"),
      name,
      slot,
      rarity: rarity.id,
      level: safeLevel,
      affixes: affixes.map((affix) => affix.id),
      mods: mergeMods(affixes),
      value
    };
  }

  function generateStarterItem(slot) {
    let item = generateItem(1, slot, "common");
    for (let i = 0; i < 20 && Object.prototype.hasOwnProperty.call(item.mods, "ballCount"); i++) {
      item = generateItem(1, slot, "common");
    }
    if (Object.prototype.hasOwnProperty.call(item.mods, "ballCount")) {
      delete item.mods.ballCount;
      item.affixes = item.affixes.filter((affix) => affix !== "split" && affix !== "chorus" && affix !== "focused");
      item.name = "Initiate " + (SLOT_NOUNS[slot][0] || "Gear");
    }
    return item;
  }

  function createStarterGear(player) {
    const head = generateStarterItem("head");
    const chest = generateStarterItem("chest");
    const trinket = generateStarterItem("trinket");
    player.inventory.push(head, chest, trinket);
    player.equipment.head = head.id;
    player.equipment.chest = chest.id;
    player.equipment.trinket = trinket.id;
  }

  function restockShop(player) {
    const stock = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const level = Math.max(1, player.level + randomInt(-1, 1));
      const specialEpic = i === count - 1 && player.level >= 3 && Math.random() < 0.22;
      const forcedRarity = i === 0 ? "common" : specialEpic ? "epic" : null;
      const item = generateItem(level, null, forcedRarity);
      item.shopCost = Math.max(12, Math.round(item.value * (1.05 + Math.random() * 0.35)));
      if (item.rarity === "epic") item.shopCost = Math.round(item.shopCost * 1.75 + player.level * 38);
      if (item.rarity === "arcane") item.shopCost = Math.round(item.shopCost * 1.18);
      if (i === 0) item.shopCost = Math.min(item.shopCost, Math.max(45, player.level * 24 + 35));
      stock.push(item);
    }
    player.shopStock = stock;
  }

  function buyItem(player, itemId) {
    const index = player.shopStock.findIndex((item) => item.id === itemId);
    if (index < 0) return { ok: false, message: "That item is no longer in stock." };
    const item = player.shopStock[index];
    const cost = item.shopCost || item.value;
    if (player.gold < cost) return { ok: false, message: "Not enough gold." };
    player.gold -= cost;
    player.shopStock.splice(index, 1);
    delete item.shopCost;
    player.inventory.push(item);
    return { ok: true, message: "Bought " + item.name + "." };
  }

  function equipItem(player, itemId) {
    const item = RPG.findInventoryItem(player, itemId);
    if (!item) return { ok: false, message: "Item not found." };
    player.equipment[item.slot] = item.id;
    return { ok: true, message: "Equipped " + item.name + "." };
  }

  function unequipSlot(player, slot) {
    if (!RPG.EQUIPMENT_SLOTS.includes(slot)) return { ok: false, message: "Unknown slot." };
    player.equipment[slot] = null;
    return { ok: true, message: "Unequipped " + RPG.SLOT_LABELS[slot] + "." };
  }

  function sellItem(player, itemId) {
    const item = RPG.findInventoryItem(player, itemId);
    if (!item) return { ok: false, message: "Item not found." };
    if (player.equipment[item.slot] === item.id) {
      return { ok: false, message: "Unequip that item before selling it." };
    }
    player.inventory = player.inventory.filter((candidate) => candidate.id !== itemId);
    const value = Math.max(1, Math.floor(item.value * 0.42));
    player.gold += value;
    return { ok: true, message: "Sold " + item.name + " for " + value + " gold." };
  }

  function rollEncounterLoot(encounter, playerWon) {
    if (!playerWon || !encounter) return [];
    const drops = [];
    const level = Math.max(1, encounter.level || 1);
    const guaranteed = Math.max(0, Math.floor(encounter.lootGuaranteed || 0));
    for (let i = 0; i < guaranteed; i++) {
      drops.push(generateItem(level, null, encounter.guaranteedRarity));
    }

    const chance = Math.max(0, Number(encounter.lootChance || 0));
    if (Math.random() * 100 < chance) {
      drops.push(generateItem(level, null, null));
    }
    return drops;
  }

  function rarityClass(rarityId) {
    return (RARITIES[rarityId] || RARITIES.common).colorClass;
  }

  function rarityName(rarityId) {
    return (RARITIES[rarityId] || RARITIES.common).name;
  }

  RPG.RARITIES = RARITIES;
  RPG.AFFIXES = AFFIXES;
  RPG.generateItem = generateItem;
  RPG.createStarterGear = createStarterGear;
  RPG.restockShop = restockShop;
  RPG.buyItem = buyItem;
  RPG.equipItem = equipItem;
  RPG.unequipSlot = unequipSlot;
  RPG.sellItem = sellItem;
  RPG.rollEncounterLoot = rollEncounterLoot;
  RPG.rarityClass = rarityClass;
  RPG.rarityName = rarityName;
})();
