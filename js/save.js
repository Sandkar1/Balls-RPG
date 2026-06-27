(function () {
  "use strict";

  const RPG = window.BounceRPG;
  const SAVE_KEY = "bouncePipeRpg.v1";

  function save(player) {
    if (!player) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(player));
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return RPG.normalizePlayer(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  function hasSave() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  RPG.Save = {
    key: SAVE_KEY,
    save,
    load,
    clear,
    hasSave
  };
})();
