(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const dom = {};

  const VIEW_LABELS = {
    map: "World Map",
    shop: "Shop",
    skirmish: "Skirmishes",
    story: "Story Fights",
    talents: "Talents",
    questgiver: "Questgiver",
    fight: "Fight"
  };

  const ITEM_STAT_ORDER = [
    "startDamage",
    "startDamagePct",
    "growthValue",
    "growthValuePct",
    "speed",
    "speedPct",
    "gravity",
    "gravityPct",
    "bounce",
    "bouncePct",
    "ballSize",
    "ballSizePct",
    "ballCount"
  ];

  const ITEM_STAT_NAMES = {
    startDamage: "Start Damage",
    startDamagePct: "Start Damage",
    growthValue: "Growth Value",
    growthValuePct: "Growth Value",
    speed: "Speed",
    speedPct: "Speed",
    gravity: "Gravity",
    gravityPct: "Gravity",
    bounce: "Bounce",
    bouncePct: "Bounce",
    ballSize: "Ball Size",
    ballSizePct: "Ball Size",
    ballCount: "Balls"
  };

  const ICONS = {
    map: '<path d="M4 5l5-2 6 2 5-2v16l-5 2-6-2-5 2V5z"/><path d="M9 3v16M15 5v16"/>',
    shop: '<path d="M5 10h14l-1.5 10h-11L5 10z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M9 15h6"/>',
    skirmish: '<path d="M5 4l15 15M19 4L4 19"/><path d="M4 4l4 1 1 4M20 4l-1 4-4 1"/>',
    story: '<path d="M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/><path d="M8 9h8"/>',
    talents: '<path d="M12 3v18M7 8l5-5 5 5M5 14h14"/><path d="M7 19l5-5 5 5"/>',
    questgiver: '<path d="M7 4h10v16H7z"/><path d="M9 8h6M9 12h4"/><path d="M16 4l2 2"/>',
    head: '<path d="M6 10a6 6 0 0 1 12 0v5H6v-5z"/><path d="M5 15h14v3H5z"/>',
    chest: '<path d="M8 4h8l3 5-2 11H7L5 9l3-5z"/><path d="M10 4l2 4 2-4"/>',
    hands: '<path d="M8 4h5l1 8-3 7H6l1-7-1-4 2-4z"/><path d="M15 8l3 3-1 6-3 2"/>',
    feet: '<path d="M6 13l3-8h4l1 8 5 2v4H5v-6z"/><path d="M6 15h13"/>',
    ring: '<circle cx="12" cy="13" r="6"/><path d="M9 7l3-4 3 4"/>',
    trinket: '<path d="M12 3l6 6-6 12L6 9l6-6z"/><path d="M9 9h6M12 6v12"/>',
    strike: '<path d="M13 2L5 13h6l-1 9 9-13h-6l1-7z"/>',
    spiral: '<path d="M12 12a3 3 0 1 0-3-3"/><path d="M9 9a6 6 0 1 1 3 11 8 8 0 1 1 8-8"/>',
    cascade: '<path d="M5 5h14M7 10h10M9 15h6M11 20h2"/>',
    burst: '<path d="M12 2l2 7 7-2-5 5 5 5-7-2-2 7-2-7-7 2 5-5-5-5 7 2 2-7z"/>',
    chain: '<path d="M9 8l-3 3a4 4 0 0 0 6 6l2-2"/><path d="M15 16l3-3a4 4 0 0 0-6-6l-2 2"/>',
    gate: '<path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-7h6v7"/><path d="M5 10h14"/>',
    speed: '<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l5-5"/><path d="M6 19h12"/>',
    gravity: '<path d="M12 3v14"/><path d="M7 12l5 5 5-5"/><path d="M6 21h12"/>',
    split: '<path d="M12 4v5"/><path d="M12 9l-5 5v6M12 9l5 5v6"/><path d="M5 18l2 2 2-2M15 18l2 2 2-2"/>',
    weight: '<path d="M9 8a3 3 0 0 1 6 0"/><path d="M7 8h10l2 12H5L7 8z"/>'
  };

  function svgIcon(name) {
    const path = ICONS[name] || ICONS.trinket;
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  function itemIcon(item, emptySlot) {
    const rarity = item ? RPG.rarityClass(item.rarity) : "rarity-empty";
    const slot = item ? item.slot : emptySlot || "trinket";
    return `<span class="icon-frame rarity-frame ${rarity}">${svgIcon(slot)}</span>`;
  }

  function formatModValue(key, value) {
    const amount = Number(value || 0);
    const sign = amount > 0 ? "+" : "";
    const display = Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/\.?0+$/, "");
    return sign + display + (key.endsWith("Pct") ? "%" : "");
  }

  function itemStatEntries(item) {
    const mods = item && item.mods ? item.mods : {};
    const keys = Object.keys(mods).sort((a, b) => {
      const ia = ITEM_STAT_ORDER.indexOf(a);
      const ib = ITEM_STAT_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return keys.map((key) => ({
      key,
      name: ITEM_STAT_NAMES[key] || RPG.STAT_LABELS[key] || key,
      value: Number(mods[key] || 0),
      text: formatModValue(key, mods[key])
    }));
  }

  function formatPrimaryItemStats(item) {
    const entries = itemStatEntries(item);
    if (!entries.length) return "No stat modifiers";
    const primary = entries.slice(0, 2).map((entry) => entry.text + " " + entry.name);
    const remaining = entries.length - primary.length;
    return primary.join(", ") + (remaining > 0 ? " +" + remaining + " more" : "");
  }

  function formatItemStatRows(item) {
    const entries = itemStatEntries(item);
    if (!entries.length) return `<div class="item-stat-row neutral"><span>No stat modifiers</span><strong>0</strong></div>`;
    return entries.map((entry) => `
      <div class="item-stat-row ${statTone(entry.key, entry.value)}">
        <span>${entry.name}</span>
        <strong>${entry.text}</strong>
      </div>
    `).join("");
  }

  function formatFullStatList(item) {
    const entries = itemStatEntries(item);
    if (!entries.length) return `<div class="full-stat neutral"><span>No stats</span><strong>0</strong></div>`;
    return entries.map((entry) => `
      <div class="full-stat ${statTone(entry.key, entry.value)}">
        <span>${entry.name}</span>
        <strong>${entry.text}</strong>
      </div>
    `).join("");
  }

  function statTone(key, value) {
    const amount = Number(value || 0);
    if (amount === 0) return "neutral";
    if (key === "bounce" || key === "bouncePct") return amount < 0 ? "positive" : "negative";
    return amount > 0 ? "positive" : "negative";
  }

  function compareItemStats(candidate, equipped) {
    if (!equipped || equipped.id === candidate.id) return [];
    const keys = new Set([...Object.keys(candidate.mods || {}), ...Object.keys(equipped.mods || {})]);
    return Array.from(keys).sort((a, b) => {
      const ia = ITEM_STAT_ORDER.indexOf(a);
      const ib = ITEM_STAT_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }).map((key) => {
      const delta = Number(candidate.mods[key] || 0) - Number(equipped.mods[key] || 0);
      return {
        key,
        name: ITEM_STAT_NAMES[key] || RPG.STAT_LABELS[key] || key,
        delta,
        text: formatModValue(key, delta)
      };
    });
  }

  function renderCompareRows(candidate, equipped) {
    if (!equipped) return `<p class="tooltip-compare">No item equipped in this slot.</p>`;
    if (equipped.id === candidate.id) return `<p class="tooltip-compare">Currently equipped.</p>`;
    const rows = compareItemStats(candidate, equipped);
    if (!rows.length) return `<p class="tooltip-compare">No stat changes.</p>`;
    return `
      <div class="compare-block">
        <span>Compared to ${RPG.escapeHtml(equipped.name)}</span>
        ${rows.map((row) => `
          <div class="compare-row ${statTone(row.key, row.delta)}">
            <span>${row.name}</span>
            <strong>${row.text}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function itemPreviewContent(item, equipped) {
    if (!item) return "";
    const canAltCompare = equipped && equipped.id !== item.id;
    return `
      <strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>
      <span>${RPG.rarityName(item.rarity)} ${RPG.SLOT_LABELS[item.slot]} - Level ${item.level}</span>
      <div class="item-stat-table">${formatItemStatRows(item)}</div>
      ${renderCompareRows(item, equipped)}
      ${canAltCompare ? `<p class="alt-compare-note">Press Left Alt to show your equipped item.</p>` : ""}
    `;
  }

  function itemCompareBlock(item, title) {
    return `
      <div class="item-compare-card">
        <span class="compare-title">${title}</span>
        <strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>
        <span>${RPG.rarityName(item.rarity)} ${RPG.SLOT_LABELS[item.slot]} - Level ${item.level}</span>
        <div class="item-stat-table">${formatItemStatRows(item)}</div>
      </div>
    `;
  }

  function altCompareContent(item, equipped) {
    if (!item || !equipped || equipped.id === item.id) return itemPreviewContent(item, equipped);
    return `
      <div class="alt-compare-grid">
        ${itemCompareBlock(item, "Selected Item")}
        ${itemCompareBlock(equipped, "Currently Equipped")}
      </div>
      ${renderCompareRows(item, equipped)}
      <p class="alt-compare-note active">${dom.itemPreviewPinned ? "Tap outside to close." : "Press Left Alt again to return to compact view."}</p>
    `;
  }

  function mobileCompareContent(item, equipped) {
    if (!item) return "";
    return `
      <div class="mobile-compare-head">
        <div>
          <strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>
          <span>${RPG.rarityName(item.rarity)} ${RPG.SLOT_LABELS[item.slot]} - Level ${item.level}</span>
        </div>
        <button class="preview-close" type="button" data-action="close-preview">Hide</button>
      </div>
      <div class="mobile-compare-grid">
        <div>
          <span class="compare-title">Selected</span>
          <strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>
          <div class="item-stat-table compact">${formatItemStatRows(item)}</div>
        </div>
        <div>
          <span class="compare-title">Equipped</span>
          ${equipped ? `
            <strong class="${RPG.rarityClass(equipped.rarity)}">${RPG.escapeHtml(equipped.name)}</strong>
            <div class="item-stat-table compact">${formatItemStatRows(equipped)}</div>
          ` : `<p class="tooltip-compare">Empty ${RPG.SLOT_LABELS[item.slot]} slot.</p>`}
        </div>
      </div>
      ${renderCompareRows(item, equipped)}
    `;
  }

  function itemPreviewAttrs(item) {
    return `data-item-preview="true" data-item-id="${RPG.escapeHtml(item.id)}"`;
  }

  function renderMiniStatList(item) {
    const entries = itemStatEntries(item);
    if (!entries.length) return `<div class="mini-stat neutral"><span>No stats</span><strong>0</strong></div>`;
    return entries.map((entry) => `
      <div class="mini-stat ${statTone(entry.key, entry.value)}">
        <span>${entry.name}</span>
        <strong>${entry.text}</strong>
      </div>
    `).join("");
  }

  function renderDeltaPills(item, current, limit) {
    if (!current) return `<span class="delta-pill neutral">Empty ${RPG.SLOT_LABELS[item.slot]}</span>`;
    if (current.id === item.id) return `<span class="delta-pill neutral">Currently equipped</span>`;
    const rows = compareItemStats(item, current).filter((row) => row.delta !== 0);
    if (!rows.length) return `<span class="delta-pill neutral">No stat changes</span>`;
    return rows.slice(0, limit || 3).map((row) => `
      <span class="delta-pill ${statTone(row.key, row.delta)}">${row.text} ${row.name}</span>
    `).join("");
  }

  function findAnyItem(itemId) {
    const player = RPG.game.player;
    if (!player || !itemId) return null;
    return player.inventory.find((item) => item.id === itemId)
      || player.shopStock.find((item) => item.id === itemId)
      || null;
  }

  function equippedForItem(item) {
    const player = RPG.game.player;
    if (!player || !item) return null;
    return RPG.findInventoryItem(player, player.equipment[item.slot]);
  }

  function ensureItemPreviewPanel() {
    if (dom.itemPreviewPanel) return dom.itemPreviewPanel;
    dom.itemPreviewPanel = document.createElement("div");
    dom.itemPreviewPanel.className = "item-preview-panel";
    dom.itemPreviewPanel.setAttribute("role", "tooltip");
    dom.itemPreviewPanel.setAttribute("aria-hidden", "true");
    document.body.appendChild(dom.itemPreviewPanel);
    return dom.itemPreviewPanel;
  }

  function showItemPreview(target, event) {
    const item = findAnyItem(target.dataset.itemId);
    if (!item) return;
    const panel = ensureItemPreviewPanel();
    dom.itemPreviewTarget = target;
    renderItemPreviewPanel(item, equippedForItem(item));
    panel.classList.add("visible");
    panel.classList.toggle("mobile-pinned", Boolean(dom.itemPreviewPinned));
    panel.setAttribute("aria-hidden", "false");
    positionItemPreview(event, target);
  }

  function renderItemPreviewPanel(item, equipped) {
    const panel = ensureItemPreviewPanel();
    panel.classList.toggle("alt-compare", Boolean(dom.altCompareOpen && equipped && equipped.id !== item.id));
    panel.innerHTML = dom.itemPreviewPinned
      ? mobileCompareContent(item, equipped)
      : dom.altCompareOpen && equipped && equipped.id !== item.id
      ? altCompareContent(item, equipped)
      : itemPreviewContent(item, equipped);
  }

  function isTouchCompareMode() {
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 760;
  }

  function refreshItemPreview() {
    const target = dom.itemPreviewTarget;
    if (!target || !dom.itemPreviewPanel || !dom.itemPreviewPanel.classList.contains("visible")) return;
    const item = findAnyItem(target.dataset.itemId);
    if (!item) return;
    renderItemPreviewPanel(item, equippedForItem(item));
    positionItemPreview(dom.itemPreviewPointer, target);
  }

  function positionItemPreview(event, target) {
    const panel = ensureItemPreviewPanel();
    const margin = 8;
    const offset = 12;
    const rect = target.getBoundingClientRect();
    const sourceX = event && Number.isFinite(event.clientX) ? event.clientX : rect.right;
    const sourceY = event && Number.isFinite(event.clientY) ? event.clientY : rect.top;
    const panelRect = panel.getBoundingClientRect();
    dom.itemPreviewPointer = { clientX: sourceX, clientY: sourceY };

    const spaceRight = window.innerWidth - sourceX - offset - margin;
    const spaceLeft = sourceX - offset - margin;
    const placeRight = spaceRight >= panelRect.width || spaceRight >= spaceLeft;
    let left = placeRight ? sourceX + offset : sourceX - panelRect.width - offset;
    let top = sourceY - panelRect.height - offset;

    if (left < margin) left = margin;
    if (top < margin) top = margin;
    if (left + panelRect.width + margin > window.innerWidth) left = Math.max(margin, window.innerWidth - panelRect.width - margin);
    if (top > sourceY - offset) top = Math.max(margin, sourceY - panelRect.height - offset);

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  function hideItemPreview() {
    if (!dom.itemPreviewPanel) return;
    dom.itemPreviewTarget = null;
    dom.itemPreviewPointer = null;
    dom.itemPreviewPinned = false;
    dom.altCompareOpen = false;
    dom.itemPreviewPanel.classList.remove("visible");
    dom.itemPreviewPanel.classList.remove("alt-compare");
    dom.itemPreviewPanel.classList.remove("mobile-pinned");
    dom.itemPreviewPanel.setAttribute("aria-hidden", "true");
  }

  function init() {
    dom.startScreen = document.querySelector("#startScreen");
    dom.gameScreen = document.querySelector("#gameScreen");
    dom.worldPanel = document.querySelector("#worldPanel");
    dom.characterPanel = document.querySelector("#characterPanel");
    dom.viewHost = document.querySelector("#viewHost");
    dom.arenaSection = document.querySelector("#arenaSection");
    dom.messageBar = document.querySelector("#messageBar");
    dom.locationLabel = document.querySelector("#locationLabel");
    dom.fightOutcome = document.querySelector("#fightOutcome");
    dom.combatCompare = document.querySelector("#combatCompare");
    dom.arenaActions = document.querySelector(".arena-actions");

    RPG.Combat.init({ onFinish: handleFightFinish });

    const saved = RPG.Save.load();
    if (saved) RPG.game.player = saved;
    renderStart();
    bindEvents();
  }

  function bindEvents() {
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-action='new-character']");
      if (!form) return;
      event.preventDefault();
      const name = form.querySelector("[name='characterName']").value;
      startNewCharacter(name);
    });

    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action], [data-nav]");

      if (target) {
        if (target.dataset.nav) {
          showView(target.dataset.nav);
          return;
        }

        const action = target.dataset.action;
        if (action === "continue-game") continueGame();
        else if (action === "back-to-start") renderStart();
        else if (action === "save-game") saveWithMessage();
        else if (action === "return-map") returnToMap();
        else if (action === "restock-shop") restockShop();
        else if (action === "buy-item") buyItem(target.dataset.item);
        else if (action === "equip-item") equipItem(target.dataset.item);
        else if (action === "unequip-slot") unequipSlot(target.dataset.slot);
        else if (action === "sell-item") sellItem(target.dataset.item);
        else if (action === "learn-talent") learnTalent(target.dataset.talent);
        else if (action === "respec-talents") respecTalents();
        else if (action === "set-pattern") setPattern(target.dataset.pattern);
        else if (action === "start-skirmish") startSkirmish(target.dataset.encounter);
        else if (action === "start-story") startStory(target.dataset.encounter);
        else if (action === "start-quest") startQuest(target.dataset.quest);
        else if (action === "retry-fight") retryFight();
        else if (action === "clear-save") clearSave();
        else if (action === "close-preview") hideItemPreview();
        return;
      }

      const previewTarget = event.target.closest("[data-item-preview]");
      if (previewTarget && isTouchCompareMode()) {
        event.preventDefault();
        if (dom.itemPreviewPinned && dom.itemPreviewTarget === previewTarget) {
          hideItemPreview();
          return;
        }
        dom.itemPreviewPinned = true;
        dom.altCompareOpen = true;
        showItemPreview(previewTarget, null);
      }
    });

    document.addEventListener("pointerup", (event) => {
      if (!dom.itemPreviewPinned || !dom.itemPreviewPanel) return;
      const previewTarget = event.target.closest("[data-item-preview]");
      if (previewTarget === dom.itemPreviewTarget) return;
      if (dom.itemPreviewPanel.contains(event.target)) return;
      hideItemPreview();
    });

    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-item-preview]");
      if (target && !dom.itemPreviewPinned) showItemPreview(target, event);
    });

    document.addEventListener("pointermove", (event) => {
      const target = event.target.closest("[data-item-preview]");
      if (target && dom.itemPreviewPanel && dom.itemPreviewPanel.classList.contains("visible")) {
        if (dom.itemPreviewPinned) return;
        positionItemPreview(event, target);
      }
    });

    document.addEventListener("pointerout", (event) => {
      const target = event.target.closest("[data-item-preview]");
      if (target && !dom.itemPreviewPinned && !target.contains(event.relatedTarget)) hideItemPreview();
    });

    document.addEventListener("focusin", (event) => {
      const target = event.target.closest("[data-item-preview]");
      if (target) showItemPreview(target, null);
    });

    document.addEventListener("focusout", (event) => {
      const target = event.target.closest("[data-item-preview]");
      if (target && !dom.itemPreviewPinned && !target.contains(event.relatedTarget)) hideItemPreview();
    });

    document.addEventListener("keydown", (event) => {
      if (event.code !== "AltLeft") return;
      event.preventDefault();
      if (event.repeat) return;
      dom.altCompareOpen = !dom.altCompareOpen;
      refreshItemPreview();
    });

    window.addEventListener("blur", () => {
      if (!dom.altCompareOpen) return;
      dom.altCompareOpen = false;
      refreshItemPreview();
    });
  }

  function startNewCharacter(name) {
    const player = RPG.createDefaultPlayer(name);
    RPG.createStarterGear(player);
    RPG.restockShop(player);
    RPG.game.player = player;
    RPG.game.currentView = "map";
    RPG.game.activeEncounter = null;
    RPG.game.lastRewards = null;
    RPG.setMessage("Welcome, " + player.name + ". Choose a path on the map.");
    RPG.Save.save(player);
    renderGame();
  }

  function continueGame() {
    let player = RPG.game.player || RPG.Save.load();
    if (!player) {
      renderStart();
      return;
    }
    player = RPG.normalizePlayer(player);
    if (!player.inventory.length) RPG.createStarterGear(player);
    if (!player.shopStock.length) RPG.restockShop(player);
    RPG.game.player = player;
    RPG.game.currentView = "map";
    RPG.game.activeEncounter = null;
    RPG.setMessage("Loaded " + player.name + ".");
    renderGame();
  }

  function clearSave() {
    RPG.Save.clear();
    RPG.game.player = null;
    RPG.setMessage("");
    renderStart();
  }

  function saveWithMessage() {
    const ok = RPG.Save.save(RPG.game.player);
    RPG.setMessage(ok ? "Game saved." : "Save failed. Browser storage may be unavailable.");
    renderMessage();
  }

  function renderStart() {
    dom.gameScreen.classList.add("hidden");
    dom.startScreen.classList.remove("hidden");
    const saved = RPG.game.player || RPG.Save.load();
    const savedMarkup = saved ? `
      <div class="data-card" style="margin-top: 16px">
        <h3>Saved Character</h3>
        <p class="meta">${RPG.escapeHtml(saved.name)} - Level ${saved.level} - ${saved.gold} gold</p>
        <div class="card-actions">
          <button class="primary" type="button" data-action="continue-game">Continue</button>
          <button type="button" data-action="clear-save">Clear Save</button>
        </div>
      </div>
    ` : "";

    dom.startScreen.innerHTML = `
      <div class="start-card">
        <p class="eyebrow">Character</p>
        <h1>Balls RPG</h1>
        <p>Create a racer, earn gear, learn talents, and clear story fights by reaching the bottom before each rival.</p>
        <form class="start-form" data-action="new-character">
          <label>
            <span class="small-note">Name</span>
            <input name="characterName" type="text" maxlength="24" value="${saved ? RPG.escapeHtml(saved.name) : ""}" placeholder="Enter name" autocomplete="off">
          </label>
          <div class="start-actions">
            <button class="primary" type="submit">Start New</button>
            <button type="button" data-action="continue-game" ${saved ? "" : "disabled"}>Continue</button>
          </div>
        </form>
        ${savedMarkup}
      </div>
    `;
  }

  function renderGame() {
    if (!RPG.game.player) {
      renderStart();
      return;
    }
    dom.startScreen.classList.add("hidden");
    dom.gameScreen.classList.remove("hidden");
    renderWorldPanel();
    renderCharacterPanel();
    renderMessage();
    renderCurrentView();
  }

  function showView(view) {
    RPG.game.currentView = view || "map";
    RPG.game.activeEncounter = null;
    RPG.game.lastRewards = null;
    renderGame();
  }

  function renderCurrentView() {
    const view = RPG.game.currentView || "map";
    dom.locationLabel.textContent = VIEW_LABELS[view] || "World Map";

    if (view === "fight") {
      dom.gameScreen.classList.add("in-fight");
      dom.characterPanel.classList.add("hidden");
      dom.viewHost.classList.add("hidden");
      dom.arenaSection.classList.remove("hidden");
      return;
    }

    dom.gameScreen.classList.remove("in-fight");
    dom.characterPanel.classList.remove("hidden");
    dom.arenaSection.classList.add("hidden");
    dom.viewHost.classList.remove("hidden");

    if (view === "shop") renderShop();
    else if (view === "skirmish") renderSkirmishes();
    else if (view === "story") renderStory();
    else if (view === "talents") renderTalents();
    else if (view === "questgiver") renderQuestgiver();
    else renderMap();
  }

  function renderWorldPanel() {
    const player = RPG.game.player;
    const nav = [
      ["map", "Map", "Choose destination", "map"],
      ["shop", "Shop", "Buy and equip gear", "shop"],
      ["skirmish", "Skirmish", "Farm XP, gold, loot", "skirmish"],
      ["story", "Story Fight", "Advance the ending", "story"],
      ["talents", "Talents", "Learn or respec", "talents"],
      ["questgiver", "Questgiver", "Special challenges", "questgiver"]
    ];
    dom.worldPanel.innerHTML = `
      <div class="panel-heading">
        <span class="icon-frame nav-sigil">${svgIcon("map")}</span>
        <div>
          <h2>World</h2>
          <p class="meta">Gate ${Math.min(player.storyProgress + 1, RPG.STORY_FIGHTS.length)} / ${RPG.STORY_FIGHTS.length}</p>
        </div>
      </div>
      <div class="nav-list">
        ${nav.map(([id, label, note, icon]) => `
          <button type="button" data-nav="${id}" class="${RPG.game.currentView === id ? "active" : ""}">
            <span class="nav-icon">${svgIcon(icon)}</span>
            <span class="nav-copy"><strong>${label}</strong><small>${note}</small></span>
          </button>
        `).join("")}
      </div>
      ${player.storyProgress >= RPG.STORY_FIGHTS.length ? `<p class="success-text" style="margin: 14px 0 0">Story complete. The final gate is cleared.</p>` : ""}
    `;
  }

  function renderCharacterPanel() {
    const player = RPG.game.player;
    const stats = RPG.getEffectiveStats(player);
    const xpNeed = RPG.xpToNext(player.level);
    const xpPct = Math.max(0, Math.min(100, Math.round(player.xp / xpNeed * 100)));
    const pattern = RPG.growthPatternByMode(player.activeGrowthMode);

    dom.characterPanel.innerHTML = `
      <div class="panel-heading">
        <span class="icon-frame nav-sigil">${svgIcon("head")}</span>
        <div>
          <h2>${RPG.escapeHtml(player.name)}</h2>
          <p class="meta">Level ${player.level} ${RPG.escapeHtml(pattern.name)}</p>
        </div>
      </div>
      <div class="xpbar" aria-label="XP"><span style="width: ${xpPct}%"></span></div>
      <p class="meta">${player.xp} / ${xpNeed} XP to level ${player.level + 1}</p>

      <div class="summary-grid">
        <div class="summary-chip"><span>Gold</span><strong>${player.gold}</strong></div>
        <div class="summary-chip"><span>Talent Points</span><strong>${player.talentPoints}</strong></div>
      </div>

      <h3 class="section-title">Effective Stats</h3>
      <div class="stat-grid">
        <div class="stat-chip"><span>Start</span><strong>${stats.startDamage}</strong></div>
        <div class="stat-chip"><span>Growth</span><strong>${stats.growthValue}</strong></div>
        <div class="stat-chip"><span>Speed</span><strong>${stats.speed}</strong></div>
        <div class="stat-chip"><span>Gravity</span><strong>${stats.gravity}</strong></div>
        <div class="stat-chip"><span>Bounce</span><strong>${stats.bounce.toFixed(2)}</strong></div>
        <div class="stat-chip"><span>Balls</span><strong>${stats.ballCount}</strong></div>
      </div>

      <h3 class="section-title">Equipment</h3>
      <div class="equipment-layout">
        <div class="equipment-column">
          ${renderEquipmentSlot(player, "head")}
          ${renderEquipmentSlot(player, "hands")}
          ${renderEquipmentSlot(player, "ring")}
        </div>
        <div class="paperdoll">
          <div class="paperdoll-ball">
            ${svgIcon("trinket")}
          </div>
          <span>Racer</span>
        </div>
        <div class="equipment-column">
          ${renderEquipmentSlot(player, "chest")}
          ${renderEquipmentSlot(player, "feet")}
          ${renderEquipmentSlot(player, "trinket")}
        </div>
      </div>
      ${renderBagPanel(player)}
    `;
  }

  function renderEquipmentSlot(player, slot) {
    const item = RPG.findInventoryItem(player, player.equipment[slot]);
    const label = RPG.SLOT_LABELS[slot];
    if (!item) {
      return `
        <div class="equipment-slot empty">
          ${itemIcon(null, slot)}
          <div>
            <strong>${label}</strong>
            <span>Empty</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="equipment-slot equipped ${RPG.rarityClass(item.rarity)}" tabindex="0" ${itemPreviewAttrs(item)} aria-label="${RPG.escapeHtml(item.name + ". " + RPG.describeMods(item.mods))}">
        ${itemIcon(item)}
        <div>
          <div class="slot-topline">
            <strong>${label}</strong>
            <em class="rarity-badge ${RPG.rarityClass(item.rarity)}">${RPG.rarityName(item.rarity)}</em>
          </div>
          <span class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</span>
          <small class="slot-summary">${RPG.escapeHtml(formatPrimaryItemStats(item))}</small>
        </div>
        <div class="card-actions">
          <button type="button" data-action="unequip-slot" data-slot="${slot}" aria-label="Unequip ${label}">Unequip</button>
        </div>
      </div>
    `;
  }

  function renderBagPanel(player) {
    const equippedIds = new Set(Object.values(player.equipment).filter(Boolean));
    const bagItems = player.inventory.filter((item) => !equippedIds.has(item.id));
    return `
      <h3 class="section-title">Bag</h3>
      <div class="bag-panel">
        <div class="bag-header">
          <span class="icon-frame bag-icon">${svgIcon("shop")}</span>
          <div>
            <strong>${bagItems.length} item${bagItems.length === 1 ? "" : "s"}</strong>
            <span>Unequipped gear stays here.</span>
          </div>
        </div>
        <div class="bag-list">
          ${bagItems.length ? renderBagGroups(bagItems) : `<p class="meta">Your bag is empty.</p>`}
        </div>
      </div>
    `;
  }

  function renderBagGroups(items) {
    return RPG.EQUIPMENT_SLOTS.map((slot) => {
      const slotItems = items.filter((item) => item.slot === slot);
      if (!slotItems.length) return "";
      const current = equippedForItem({ slot });
      return `
        <section class="bag-group">
          <div class="bag-group-heading">
            <h4>${RPG.SLOT_LABELS[slot]}</h4>
            <span>${current ? "Equipped: " + RPG.escapeHtml(current.name) : "Nothing equipped"}</span>
          </div>
          ${slotItems.map(renderBagItem).join("")}
        </section>
      `;
    }).join("");
  }

  function renderBagItem(item) {
    const player = RPG.game.player;
    const current = RPG.findInventoryItem(player, player.equipment[item.slot]);
    return `
      <article class="bag-item ${RPG.rarityClass(item.rarity)}" tabindex="0" ${itemPreviewAttrs(item)} aria-label="${RPG.escapeHtml(item.name + ". " + RPG.describeMods(item.mods))}">
        ${itemIcon(item)}
        <div class="bag-item-copy">
          <span class="bag-item-slot">${RPG.SLOT_LABELS[item.slot]} - ${RPG.rarityName(item.rarity)}</span>
          <strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>
          <small>${RPG.escapeHtml(formatPrimaryItemStats(item))}</small>
        </div>
        <div class="bag-stat-list" aria-label="Item stats">
          ${renderMiniStatList(item)}
        </div>
        <div class="bag-compare-summary">
          <span class="bag-replaces">${current ? "Replaces " + RPG.escapeHtml(current.name) : "Empty " + RPG.SLOT_LABELS[item.slot] + " slot"}</span>
          <div class="delta-row">${renderDeltaPills(item, current, 4)}</div>
        </div>
        <div class="bag-actions">
          <button class="primary" type="button" data-action="equip-item" data-item="${item.id}">Equip</button>
          <button type="button" data-action="sell-item" data-item="${item.id}">Sell</button>
        </div>
      </article>
    `;
  }

  function renderMessage() {
    dom.messageBar.textContent = RPG.game.message || "";
  }

  function renderMap() {
    dom.viewHost.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>World Map</h2>
          <p class="meta">Pick a destination. Your equipped gear and active growth pattern shape each fight.</p>
        </div>
      </div>
      <div class="world-map">
        ${mapNode("Shop", "Buy gear, equip items, sell old drops.", "shop", "shop")}
        ${mapNode("Skirmish", "Repeatable fights for XP, gold, and loot.", "skirmish", "skirmish")}
        ${mapNode("Story Fight", "Hard level-gated fights that advance the game.", "story", "story")}
        ${mapNode("Talents", "Unlock passive bonuses and growth patterns.", "talents", "talents")}
        ${mapNode("Questgiver", "Special fights with unusual constraints.", "questgiver", "questgiver")}
      </div>
    `;
  }

  function mapNode(title, copy, view, icon) {
    return `
      <article class="map-node">
        <span class="map-sigil">${svgIcon(icon)}</span>
        <div>
          <strong>${title}</strong>
          <span>${copy}</span>
        </div>
        <button type="button" data-nav="${view}">Open</button>
      </article>
    `;
  }

  function renderShop() {
    const player = RPG.game.player;
    if (!player.shopStock.length) RPG.restockShop(player);
    const restockCost = Math.max(10, player.level * 8);
    dom.viewHost.innerHTML = `
      <div class="vendor-header">
        <span class="vendor-mark">${svgIcon("shop")}</span>
        <div>
          <h2>Runeforge Vendor</h2>
          <p class="meta">${player.shopStock.length} items in stock. Gear modifies damage, growth, speed, gravity, bounce, size, and ball count.</p>
        </div>
        <div class="vendor-actions">
          <div class="gold-pill">${player.gold}g</div>
          <button type="button" data-action="restock-shop">Restock ${restockCost}g</button>
        </div>
      </div>

      <section class="section-stack">
        <div>
          <h3 class="section-title">Vendor Stock</h3>
          <div class="item-list">
            ${player.shopStock.map((item) => renderItemCard(item, "shop")).join("")}
          </div>
        </div>
        <div>
          <h3 class="section-title">Inventory</h3>
          <div class="item-list">
            ${player.inventory.length ? player.inventory.map((item) => renderItemCard(item, "inventory")).join("") : `<p class="meta">No items yet.</p>`}
          </div>
        </div>
      </section>
    `;
  }

  function renderItemCard(item, context) {
    const player = RPG.game.player;
    const equipped = player.equipment[item.slot] === item.id;
    const current = RPG.findInventoryItem(player, player.equipment[item.slot]);
    const cost = item.shopCost || item.value;
    const affordable = context !== "shop" || player.gold >= cost;
    const actions = context === "shop"
      ? `<button class="primary" type="button" data-action="buy-item" data-item="${item.id}" ${affordable ? "" : "disabled"}>${affordable ? "Buy " + cost + "g" : "Need " + cost + "g"}</button>`
      : `
        <button class="primary" type="button" data-action="equip-item" data-item="${item.id}" ${equipped ? "disabled" : ""}>${equipped ? "Equipped" : "Equip"}</button>
        <button type="button" data-action="sell-item" data-item="${item.id}" ${equipped ? "disabled" : ""}>Sell ${Math.max(1, Math.floor(item.value * 0.42))}g</button>
      `;

    return `
      <article class="item-card ${RPG.rarityClass(item.rarity)} ${equipped ? "equipped" : ""} ${affordable ? "affordable" : "unaffordable"}" tabindex="0" ${itemPreviewAttrs(item)} aria-label="${RPG.escapeHtml(item.name + ". " + RPG.describeMods(item.mods))}">
        ${itemIcon(item)}
        <div class="item-body">
          <div class="item-topline">
            <span class="tag">${RPG.SLOT_LABELS[item.slot]}</span>
            <span class="tag ${RPG.rarityClass(item.rarity)}">${RPG.rarityName(item.rarity)}</span>
            <span class="tag">Lv ${item.level}</span>
          </div>
          <h3 class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</h3>
          <p class="item-mods">${RPG.escapeHtml(formatPrimaryItemStats(item))}</p>
          ${context === "shop" ? `<div class="shop-stat-list">${formatFullStatList(item)}</div>` : ""}
          ${renderInlineCompare(item, current)}
        </div>
        <div class="card-actions">${actions}</div>
      </article>
    `;
  }

  function renderInlineCompare(item, current) {
    if (!current) return `<p class="meta">No item equipped in this slot.</p>`;
    if (current.id === item.id) return `<p class="meta">Currently equipped.</p>`;
    const rows = compareItemStats(item, current).filter((row) => row.delta !== 0).slice(0, 2);
    if (!rows.length) return `<p class="meta">No stat changes.</p>`;
    return `
      <div class="inline-compare">
        ${rows.map((row) => `<span class="${statTone(row.key, row.delta)}">${row.text} ${row.name}</span>`).join("")}
      </div>
    `;
  }

  function renderTalents() {
    const player = RPG.game.player;
    dom.viewHost.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>Talents</h2>
          <p class="meta">Spend points in classic tree nodes. Growth pattern unlocks appear as special talents.</p>
        </div>
        <button type="button" data-action="respec-talents">Relearn ${RPG.respecCost(player)}g</button>
      </div>

      <section class="section-stack">
        <div class="growth-pattern-panel">
          <h3 class="section-title">Active Growth Pattern</h3>
          <div class="pattern-row">
            ${RPG.GROWTH_PATTERNS.map((pattern) => renderPatternCard(player, pattern)).join("")}
          </div>
        </div>
        <div class="talent-forest">
          ${RPG.TALENT_TREES.map((tree) => renderTalentTree(player, tree)).join("")}
        </div>
      </section>
    `;
  }

  function renderPatternCard(player, pattern) {
    const unlocked = player.unlockedGrowthModes.includes(pattern.mode);
    const active = player.activeGrowthMode === pattern.mode;
    return `
      <article class="pattern-card ${active ? "active" : ""} ${unlocked ? "" : "locked"}">
        <span class="icon-frame talent-icon">${svgIcon(pattern.icon)}</span>
        <div>
          <h3>${RPG.escapeHtml(pattern.name)}</h3>
          <p class="meta">${RPG.escapeHtml(pattern.description)}</p>
        </div>
        <button type="button" data-action="set-pattern" data-pattern="${pattern.mode}" ${!unlocked || active ? "disabled" : ""}>${active ? "Active" : unlocked ? "Use" : "Locked"}</button>
      </article>
    `;
  }

  function renderTalentTree(player, tree) {
    const talents = RPG.talentsForTree(tree.name);
    const rows = Math.max(3, ...talents.map((talent) => talent.row));
    return `
      <section class="talent-tree-panel">
        <div class="tree-heading">
          <span class="icon-frame tree-icon">${svgIcon(treeIcon(tree.id))}</span>
          <div>
            <h3>${RPG.escapeHtml(tree.name)}</h3>
            <p class="meta">${RPG.escapeHtml(tree.description)}</p>
          </div>
        </div>
        <div class="talent-grid" style="--talent-rows: ${rows}">
          ${renderTalentLinks(player, talents, rows)}
          ${talents.map((talent) => renderTalentCard(player, talent)).join("")}
        </div>
      </section>
    `;
  }

  function treeIcon(treeId) {
    if (treeId === "power") return "strike";
    if (treeId === "momentum") return "speed";
    if (treeId === "control") return "gravity";
    return "spiral";
  }

  function renderTalentLinks(player, talents, rows) {
    const width = 312;
    const rowHeight = 122;
    const paths = [];
    for (const talent of talents) {
      for (const requiredId of talent.requires || []) {
        const required = talents.find((candidate) => candidate.id === requiredId);
        if (!required) continue;
        const x1 = (required.column - 0.5) * 104;
        const y1 = (required.row - 0.5) * rowHeight + 18;
        const x2 = (talent.column - 0.5) * 104;
        const y2 = (talent.row - 0.5) * rowHeight - 18;
        const active = RPG.talentRank(player, required.id) > 0 ? "active" : "";
        paths.push(`<path class="${active}" d="M${x1} ${y1} L${x2} ${y2}"/>`);
      }
    }
    return `<svg class="talent-links" viewBox="0 0 ${width} ${rows * rowHeight}" preserveAspectRatio="none" aria-hidden="true">${paths.join("")}</svg>`;
  }

  function renderTalentCard(player, talent) {
    const rank = RPG.talentRank(player, talent.id);
    const check = RPG.canLearnTalent(player, talent);
    const unlock = talent.unlockGrowthMode ? RPG.growthPatternByMode(talent.unlockGrowthMode).name : null;
    const state = rank >= talent.maxRank ? "maxed" : check.ok ? "available" : rank > 0 ? "learned" : "locked";
    const requires = (talent.requires || []).map(RPG.talentName).join(", ");
    return `
      <article class="talent-node-wrap ${state}" style="grid-row: ${talent.row}; grid-column: ${talent.column}">
        <button class="talent-node" type="button" data-action="learn-talent" data-talent="${talent.id}" ${check.ok ? "" : "disabled"} title="${RPG.escapeHtml(talent.name + ": " + talent.description)}">
          <span class="icon-frame talent-icon">${svgIcon(talent.icon)}</span>
          <span class="talent-rank">${rank}/${talent.maxRank}</span>
        </button>
        <div class="talent-node-copy">
          <strong>${RPG.escapeHtml(talent.name)}</strong>
          <span>${RPG.describeMods(talent.modsPerRank)}</span>
          ${unlock ? `<span class="gold-text">Unlocks ${RPG.escapeHtml(unlock)}</span>` : ""}
          ${requires ? `<span class="meta">Requires ${RPG.escapeHtml(requires)}</span>` : ""}
        </div>
      </article>
    `;
  }

  function renderSkirmishes() {
    const skirmishes = RPG.getSkirmishes(RPG.game.player);
    dom.viewHost.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>Skirmishes</h2>
          <p class="meta">Repeatable encounters. Opponents scale with your level and story progress.</p>
        </div>
      </div>
      <div class="card-grid">
        ${skirmishes.map((encounter) => renderEncounterCard(encounter, "start-skirmish")).join("")}
      </div>
    `;
  }

  function renderStory() {
    const fights = RPG.getStoryFights(RPG.game.player);
    dom.viewHost.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>Story Fights</h2>
          <p class="meta">Clear the current story fight to unlock the next gate.</p>
        </div>
      </div>
      <div class="card-grid">
        ${fights.map((encounter) => renderEncounterCard(encounter, "start-story")).join("")}
      </div>
    `;
  }

  function renderQuestgiver() {
    const quests = RPG.getQuests(RPG.game.player);
    dom.viewHost.innerHTML = `
      <div class="toolbar">
        <div>
          <h2>Questgiver</h2>
          <p class="meta">Quest fights change the rules and reward targeted builds.</p>
        </div>
      </div>
      <div class="card-grid">
        ${quests.map(renderQuestCard).join("")}
      </div>
    `;
  }

  function renderEncounterCard(encounter, action) {
    const disabled = encounter.completed || !encounter.available;
    const reason = encounter.completed ? "Completed" : encounter.available ? "Start" : "Requires level " + encounter.minLevel;
    return `
      <article class="encounter-card ${disabled ? "locked" : ""}">
        <div class="tag-row">
          <span class="tag">Lv ${encounter.level}</span>
          <span class="tag difficulty-${(encounter.difficulty || "standard").toLowerCase()}">${RPG.escapeHtml(encounter.difficulty || "Standard")}</span>
          <span class="tag">${RPG.escapeHtml(encounter.trait)}</span>
          <span class="tag">${encounter.rewards.xp} XP</span>
          <span class="tag">${encounter.rewards.gold}g</span>
        </div>
        <h3>${RPG.escapeHtml(encounter.name)}</h3>
        <p class="meta">${RPG.escapeHtml(encounter.description || "A named rival waits on a scaling track.")}</p>
        ${encounter.hint ? `<p class="build-hint">${RPG.escapeHtml(encounter.hint)}</p>` : ""}
        <p class="item-mods">Enemy: ${encounter.enemyStats.startDamage} start, ${encounter.enemyStats.growthValue} growth, ${encounter.enemyStats.speed} speed, ${encounter.enemyStats.gravity} gravity.</p>
        <p class="meta">Track: ${encounter.playerTrack.barCount} bars, ${RPG.compactNumber(encounter.playerTrack.barHealth)} base HP. Min level ${encounter.minLevel}.</p>
        <div class="card-actions">
          <button class="primary" type="button" data-action="${action}" data-encounter="${encounter.sourceId}" ${disabled ? "disabled" : ""}>${reason}</button>
        </div>
      </article>
    `;
  }

  function renderQuestCard(quest) {
    const status = quest.status;
    const disabled = !status.available;
    return `
      <article class="quest-card ${disabled ? "locked" : ""}">
        <div class="tag-row">
          <span class="tag">Lv ${quest.level}</span>
          <span class="tag">${quest.rewards.xp} XP</span>
          <span class="tag">${quest.rewards.gold}g</span>
        </div>
        <h3>${RPG.escapeHtml(quest.name)}</h3>
        <p class="quest-copy">${RPG.escapeHtml(quest.description)}</p>
        <p class="requirement">${RPG.escapeHtml(quest.requirement)}</p>
        <div class="card-actions">
          <button class="primary" type="button" data-action="start-quest" data-quest="${quest.id}" ${disabled ? "disabled" : ""}>${status.available ? "Start" : status.reason}</button>
        </div>
      </article>
    `;
  }

  function restockShop() {
    const player = RPG.game.player;
    const cost = Math.max(10, player.level * 8);
    if (player.gold < cost) {
      RPG.setMessage("Restocking costs " + cost + " gold.");
    } else {
      player.gold -= cost;
      RPG.restockShop(player);
      RPG.setMessage("Shop restocked for " + cost + " gold.");
      RPG.Save.save(player);
    }
    renderGame();
  }

  function buyItem(itemId) {
    const result = RPG.buyItem(RPG.game.player, itemId);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function equipItem(itemId) {
    const result = RPG.equipItem(RPG.game.player, itemId);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function unequipSlot(slot) {
    const result = RPG.unequipSlot(RPG.game.player, slot);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function sellItem(itemId) {
    const result = RPG.sellItem(RPG.game.player, itemId);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function learnTalent(talentId) {
    const result = RPG.learnTalent(RPG.game.player, talentId);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function respecTalents() {
    const result = RPG.respecTalents(RPG.game.player);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function setPattern(pattern) {
    const result = RPG.setGrowthPattern(RPG.game.player, pattern);
    RPG.setMessage(result.message);
    if (result.ok) RPG.Save.save(RPG.game.player);
    renderGame();
  }

  function startSkirmish(sourceId) {
    const encounter = RPG.createSkirmishEncounter(sourceId, RPG.game.player);
    if (!encounter || !encounter.available) {
      RPG.setMessage("That skirmish is not available.");
      renderGame();
      return;
    }
    startEncounter(encounter);
  }

  function startStory(sourceId) {
    const encounter = RPG.createStoryEncounter(sourceId, RPG.game.player);
    if (!encounter || !encounter.available) {
      RPG.setMessage("That story fight is locked.");
      renderGame();
      return;
    }
    startEncounter(encounter);
  }

  function startQuest(questId) {
    const encounter = RPG.createQuestEncounter(questId, RPG.game.player);
    if (!encounter) {
      RPG.setMessage("Quest requirements are not met.");
      renderGame();
      return;
    }
    startEncounter(encounter);
  }

  function cloneEncounter(encounter) {
    return {
      ...encounter,
      playerTrack: { ...encounter.playerTrack },
      enemyTrack: { ...encounter.enemyTrack },
      enemyStats: { ...encounter.enemyStats },
      rewards: { ...encounter.rewards },
      playerModifiers: encounter.playerModifiers ? { ...encounter.playerModifiers } : null
    };
  }

  function startEncounter(encounter) {
    const active = cloneEncounter(encounter);
    RPG.game.activeEncounter = active;
    RPG.game.currentView = "fight";
    RPG.game.lastRewards = null;
    RPG.setMessage(active.requirement || "Defeat " + active.enemyName + " by reaching the bottom first.");
    renderGame();

    const playerStats = arenaStatsForPlayer(active);
    const enemyStats = arenaStatsForEnemy(active);
    dom.fightOutcome.classList.add("hidden");
    dom.fightOutcome.innerHTML = "";
    if (dom.arenaActions) dom.arenaActions.classList.remove("hidden");
    renderCombatCompare(active, playerStats, enemyStats);
    RPG.Combat.loadEncounter({
      encounter: active,
      playerName: RPG.game.player.name,
      enemyName: active.enemyName,
      playerStats,
      enemyStats
    });
    window.setTimeout(() => {
      RPG.Combat.resize();
      if (dom.arenaActions) dom.arenaActions.scrollIntoView({ block: "start" });
    }, 0);
  }

  function renderCombatCompare(encounter, playerStats, enemyStats) {
    if (!dom.combatCompare) return;
    const side = (id, name, stats) => `
      <div class="combat-side ${id === "right" ? "enemy" : ""}">
        <strong>${RPG.escapeHtml(name)}</strong>
        <div class="combat-side-grid">
          <div><span>Initial Damage</span><b>${RPG.escapeHtml(String(stats.startDamage))}</b></div>
          <div><span>Current Damage</span><b data-combat="${id}-current">${RPG.escapeHtml(String(stats.startDamage))}</b></div>
          <div><span>Bounces</span><b data-combat="${id}-bounces">0</b></div>
          <div><span>Bars</span><b data-combat="${id}-bars">${stats.barCount}/${stats.barCount}</b></div>
          <div><span>Progress</span><b data-combat="${id}-progress">0%</b></div>
          <div><span>Growth</span><b>${RPG.escapeHtml(String(stats.growthValue))}</b></div>
        </div>
      </div>
    `;
    dom.combatCompare.innerHTML = `
      <div class="combat-compare-head">
        <span>${RPG.escapeHtml(encounter.name)}</span>
      </div>
      <div class="combat-side-wrap">
        ${side("left", RPG.game.player.name, playerStats)}
        ${side("right", encounter.enemyName, enemyStats)}
      </div>
    `;
  }

  function arenaStatsForPlayer(encounter) {
    const stats = RPG.getEffectiveStats(RPG.game.player, encounter.playerModifiers);
    return {
      ...stats,
      ...encounter.playerTrack,
      growthMode: RPG.game.player.activeGrowthMode
    };
  }

  function arenaStatsForEnemy(encounter) {
    return {
      ...encounter.enemyStats,
      ...encounter.enemyTrack
    };
  }

  function retryFight() {
    if (!RPG.game.activeEncounter) returnToMap();
    else startEncounter(RPG.game.activeEncounter);
  }

  function returnToMap() {
    RPG.game.activeEncounter = null;
    RPG.game.lastRewards = null;
    RPG.game.currentView = "map";
    if (dom.combatCompare) dom.combatCompare.innerHTML = "";
    renderGame();
  }

  function handleFightFinish(result) {
    const encounter = RPG.game.activeEncounter;
    const player = RPG.game.player;
    if (!encounter || !player) return;

    const won = result.winner === "left";
    let rewardsText = "";
    let drops = [];
    let levels = [];

    if (won && !encounter.claimed) {
      encounter.claimed = true;
      levels = RPG.addXp(player, encounter.rewards.xp);
      RPG.addGold(player, encounter.rewards.gold);
      drops = RPG.rollEncounterLoot(encounter, true);
      player.inventory.push(...drops);
      player.recentLoot = drops.map((item) => item.id);

      if (encounter.type === "story" && player.storyProgress === encounter.storyIndex) {
        player.storyProgress += 1;
      }
      if (encounter.type === "quest" && encounter.questId && !player.completedQuests.includes(encounter.questId)) {
        player.completedQuests.push(encounter.questId);
      }

      const levelText = levels.length ? " Leveled to " + levels[levels.length - 1] + "." : "";
      const lootText = drops.length ? " Loot: " + drops.map((item) => item.name).join(", ") + "." : "";
      rewardsText = "+" + encounter.rewards.xp + " XP, +" + encounter.rewards.gold + " gold." + levelText;
      RPG.setMessage("Victory over " + encounter.enemyName + ". " + rewardsText + lootText);
      RPG.Save.save(player);
    } else if (won) {
      rewardsText = "Rewards already claimed for this run.";
      RPG.setMessage(rewardsText);
    } else {
      rewardsText = "No rewards. Adjust gear, talents, or growth pattern and try again.";
      RPG.setMessage("Defeated by " + encounter.enemyName + ".");
    }

    RPG.game.lastRewards = { won, rewardsText, drops, levels, result };
    renderWorldPanel();
    renderCharacterPanel();
    renderMessage();
    if (dom.arenaActions) dom.arenaActions.classList.add("hidden");
    renderFightOutcome(won, rewardsText, drops, result, levels);
  }

  function formatFightTime(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    if (total < 60) return total.toFixed(1) + "s";
    const minutes = Math.floor(total / 60);
    const remaining = total - minutes * 60;
    return minutes + "m " + remaining.toFixed(1).padStart(4, "0") + "s";
  }

  function renderFightOutcome(won, rewardsText, drops, result, levels) {
    const storyComplete = RPG.game.player.storyProgress >= RPG.STORY_FIGHTS.length;
    const winnerName = result && result.winnerName ? result.winnerName : won ? "Player" : "Rival";
    const outcomeText = won ? "Victory" : "Defeat";
    const levelText = levels && levels.length ? "Level " + levels[levels.length - 1] : "";
    const rewards = RPG.game.activeEncounter && RPG.game.activeEncounter.rewards;
    const showRewardChips = won && rewards && rewardsText.charAt(0) === "+";
    dom.fightOutcome.classList.remove("hidden", "loss");
    if (!won) dom.fightOutcome.classList.add("loss");
    dom.fightOutcome.innerHTML = `
      <div class="outcome-heading">
        <div>
          <span class="outcome-kicker">${outcomeText}</span>
          <h3>${RPG.escapeHtml(winnerName)} won</h3>
        </div>
        <div class="outcome-time">
          <span>Time</span>
          <strong>${formatFightTime(result && result.time)}</strong>
        </div>
      </div>
      <div class="outcome-rewards">
        ${showRewardChips ? `<span class="reward-chip">+${rewards.xp} XP</span><span class="reward-chip gold">+${rewards.gold}g</span>` : ""}
        ${levelText ? `<span class="reward-chip">${RPG.escapeHtml(levelText)}</span>` : ""}
        <span class="reward-note">${RPG.escapeHtml(rewardsText)}</span>
      </div>
      ${drops && drops.length ? `
        <div class="outcome-loot">
          <span>Loot</span>
          <div>${drops.map((item) => `<strong class="${RPG.rarityClass(item.rarity)}">${RPG.escapeHtml(item.name)}</strong>`).join("")}</div>
        </div>
      ` : ""}
      ${storyComplete ? `<p class="success-text">The story is complete. You cleared the final gate.</p>` : ""}
      <div class="card-actions">
        <button class="primary" type="button" data-action="return-map">Return to Map</button>
        ${won ? "" : `<button type="button" data-action="retry-fight">Retry</button>`}
      </div>
    `;
  }

  RPG.UI = {
    init,
    renderGame,
    renderStart
  };
})();
