(function () {
  "use strict";

  const RPG = window.BounceRPG;

  const palette = ["#55d68d", "#62a8ff", "#ffc857", "#ff7a90", "#b891ff", "#5ee7df"];
  const FIXED_BAR_HEIGHT = 24;

  const defaultSettings = {
    ballCount: 3,
    ballSize: 15,
    startDamage: 8,
    growthValue: 4,
    growthMode: "flat",
    speed: 340,
    gravity: 360,
    bounce: 0.94,
    barCount: 14,
    barHealth: 180,
    barHealthGrowth: 5,
    barGap: 8,
    barHeight: FIXED_BAR_HEIGHT
  };

  let canvas;
  let ctx;
  let wrap;
  let leftPanel;
  let rightPanel;
  let statTime;
  let statDamage;
  let statBars;
  let statBounces;
  let matchStatus;
  let startBtn;
  let resetBtn;
  let fightName;
  let fightTypeLabel;
  let onFinish = null;
  let initialized = false;
  let loopHandle = null;
  let loopMode = null;

  const state = {
    dpr: 1,
    width: 0,
    height: 0,
    lanes: [
      { id: "left", name: "Player", side: -1, accent: "#55d68d", pipe: { x: 0, y: 0, w: 0, h: 0 }, balls: [], bars: [], particles: [], floaters: [], score: 0, destroyedBars: 0, destroyedBarIndices: new Set(), summary: {}, settings: { ...defaultSettings } },
      { id: "right", name: "Rival", side: 1, accent: "#62a8ff", pipe: { x: 0, y: 0, w: 0, h: 0 }, balls: [], bars: [], particles: [], floaters: [], score: 0, destroyedBars: 0, destroyedBarIndices: new Set(), summary: {}, settings: { ...defaultSettings } }
    ],
    currentEncounter: null,
    started: false,
    paused: true,
    gameOver: false,
    winner: null,
    elapsed: 0,
    winTime: 0,
    bounces: 0,
    shake: 0,
    lastTime: 0,
    pointer: null
  };

  function init(options) {
    if (initialized) return;
    initialized = true;
    onFinish = options && options.onFinish;

    canvas = document.querySelector("#gameCanvas");
    ctx = canvas.getContext("2d");
    wrap = document.querySelector("#canvasWrap");
    leftPanel = document.querySelector("#leftPanel");
    rightPanel = document.querySelector("#rightPanel");
    statTime = document.querySelector("#statTime");
    statDamage = document.querySelector("#statDamage");
    statBars = document.querySelector("#statBars");
    statBounces = document.querySelector("#statBounces");
    matchStatus = document.querySelector("#matchStatus");
    startBtn = document.querySelector("#startBtn");
    resetBtn = document.querySelector("#resetBtn");
    fightName = document.querySelector("#fightName");
    fightTypeLabel = document.querySelector("#fightTypeLabel");

    renderLanePanels();
    bindEvents();
    resize();
    resetGame();
    scheduleGameLoop();
  }

  function bindEvents() {
    startBtn.addEventListener("click", togglePause);
    resetBtn.addEventListener("click", resetGame);

    canvas.addEventListener("pointerdown", (event) => {
      if (state.gameOver || state.paused || !state.started || !state.currentEncounter) return;
      const pos = getPointerPosition(event);
      const lane = laneAtPoint(pos);
      if (!lane) return;
      if (pointInActiveBar(lane, pos)) return;
      event.preventDefault();
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
      state.pointer = { lane, startX: pos.x, startY: pos.y, x: pos.x, y: pos.y };
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!state.pointer) return;
      event.preventDefault();
      const pos = getPointerPosition(event);
      state.pointer.x = pos.x;
      state.pointer.y = pos.y;
    });

    canvas.addEventListener("pointerup", (event) => {
      if (!state.pointer || state.gameOver) return;
      event.preventDefault();
      const pos = getPointerPosition(event);
      const dx = state.pointer.startX - pos.x;
      const dy = state.pointer.startY - pos.y;
      if (Math.hypot(dx, dy) < 12) {
        state.pointer = null;
        return;
      }
      const power = Math.min(720, Math.hypot(dx, dy) * 5);
      const angle = Math.atan2(dy, dx);
      const vx = Math.cos(angle) * power;
      const vy = Math.sin(angle) * power;
      const lane = state.pointer.lane;
      lane.balls.push(createBall(lane, lane.balls.length, state.pointer.startX, state.pointer.startY, vx, vy));
      lane.settings.ballCount = Math.min(250, lane.balls.length);
      renderLanePanel(lane);
      state.pointer = null;
    });

    canvas.addEventListener("pointercancel", () => {
      state.pointer = null;
    });

    window.addEventListener("keydown", (event) => {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (state.gameOver) return;
        if (!state.started) {
          startCompetition();
          return;
        }
        togglePause();
      }
      if (event.key.toLowerCase() === "r") resetGame();
    });

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", scheduleGameLoop);
  }

  function loadEncounter(payload) {
    state.currentEncounter = payload.encounter;
    state.lanes[0].name = payload.playerName || "Player";
    state.lanes[1].name = payload.enemyName || "Rival";
    state.lanes[0].settings = sanitizeSettings(payload.playerStats);
    state.lanes[1].settings = sanitizeSettings(payload.enemyStats);
    state.lanes[0].score = 0;
    state.lanes[1].score = 0;
    state.lanes[0].destroyedBarIndices = new Set();
    state.lanes[1].destroyedBarIndices = new Set();

    fightName.textContent = payload.encounter ? payload.encounter.name : "Arena";
    fightTypeLabel.textContent = payload.encounter ? payload.encounter.type + " fight" : "Fight";
    renderLanePanels();
    resize();
    resetGame();
    matchStatus.textContent = "Ready. Start the race when your build is set.";
  }

  function sanitizeSettings(values) {
    const input = { ...defaultSettings, ...(values || {}) };
    return {
      ballCount: clamp(Math.round(numberOr(input.ballCount, defaultSettings.ballCount)), 1, 250),
      ballSize: clamp(numberOr(input.ballSize, defaultSettings.ballSize), 8, 180),
      startDamage: Math.max(1, Math.round(numberOr(input.startDamage, defaultSettings.startDamage))),
      growthValue: Math.max(0, Math.round(numberOr(input.growthValue, defaultSettings.growthValue))),
      growthMode: input.growthMode || "flat",
      speed: clamp(numberOr(input.speed, defaultSettings.speed), 120, 5000),
      gravity: clamp(numberOr(input.gravity, defaultSettings.gravity), 0, 20000),
      bounce: clamp(numberOr(input.bounce, defaultSettings.bounce), 0.1, 3),
      barCount: clamp(Math.round(numberOr(input.barCount, defaultSettings.barCount)), 1, 500),
      barHealth: Math.max(1, Math.round(numberOr(input.barHealth, defaultSettings.barHealth))),
      barHealthGrowth: clamp(numberOr(input.barHealthGrowth, defaultSettings.barHealthGrowth), 0, 10000),
      barGap: clamp(numberOr(input.barGap, defaultSettings.barGap), 0, 500),
      barHeight: clamp(numberOr(input.barHeight, defaultSettings.barHeight), 16, 120)
    };
  }

  function numberOr(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toBigInt(value, min) {
    const safe = Math.max(Number(min || 0), Math.round(Number(value) || 0));
    return BigInt(safe);
  }

  function settings(lane) {
    const s = lane.settings;
    return {
      ...s,
      startDamage: toBigInt(s.startDamage, 1),
      growthValue: toBigInt(s.growthValue, 0),
      barHealth: toBigInt(s.barHealth, 1)
    };
  }

  function renderLanePanels() {
    for (const lane of state.lanes) renderLanePanel(lane);
  }

  function renderLanePanel(lane) {
    const panel = lane.id === "left" ? leftPanel : rightPanel;
    if (!panel) return;
    panel.className = "panel lane-panel" + (lane.id === "right" ? " enemy" : "");
    const s = lane.settings;
    const growth = RPG.growthPatternByMode ? RPG.growthPatternByMode(s.growthMode) : { name: s.growthMode };
    panel.innerHTML = `
      <h2 class="lane-title">${RPG.escapeHtml(lane.name)}</h2>
      <p class="meta">${lane.id === "left" ? "Your equipped build" : "Preset rival ball"}</p>
      <div class="summary-grid">
        <div class="player-chip"><span>Progress</span><strong id="${lane.id}-summaryProgress">0%</strong></div>
        <div class="player-chip"><span>Top Damage</span><strong id="${lane.id}-summaryDamage">0</strong></div>
        <div class="player-chip"><span>Bars Left</span><strong id="${lane.id}-summaryBars">0</strong></div>
        <div class="player-chip"><span>Score</span><strong id="${lane.id}-summaryScore">0</strong></div>
      </div>
      <div class="stat-grid" style="margin-top: 12px">
        <div class="stat-chip"><span>Start</span><strong>${compactNumber(s.startDamage)}</strong></div>
        <div class="stat-chip"><span>Growth</span><strong>${compactNumber(s.growthValue)}</strong></div>
        <div class="stat-chip"><span>Speed</span><strong>${Math.round(s.speed)}</strong></div>
        <div class="stat-chip"><span>Gravity</span><strong>${Math.round(s.gravity)}</strong></div>
        <div class="stat-chip"><span>Bounce</span><strong>${Number(s.bounce).toFixed(2)}</strong></div>
        <div class="stat-chip"><span>Balls</span><strong>${s.ballCount}</strong></div>
      </div>
      <p class="small-note" style="margin: 12px 0 0">${RPG.escapeHtml(growth.name)}. Track: ${s.barCount} bars, ${compactNumber(s.barHealth)} HP base.</p>
    `;
    lane.summary = {
      progress: panel.querySelector(`#${lane.id}-summaryProgress`),
      damage: panel.querySelector(`#${lane.id}-summaryDamage`),
      bars: panel.querySelector(`#${lane.id}-summaryBars`),
      score: panel.querySelector(`#${lane.id}-summaryScore`)
    };
  }

  function resize() {
    if (!wrap || !canvas || !ctx) return;
    const rect = wrap.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(320, Math.floor(rect.width || 640));
    state.height = Math.max(440, Math.floor(rect.height || 680));
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const outerMargin = Math.max(8, state.width * 0.012);
    const laneGap = Math.max(10, state.width * 0.018);
    const pipeWidth = Math.max(130, (state.width - outerMargin * 2 - laneGap) / 2);
    const pipeY = 6;
    const pipeH = state.height - 12;
    state.lanes[0].pipe = { x: outerMargin, y: pipeY, w: pipeWidth, h: pipeH };
    state.lanes[1].pipe = { x: outerMargin + pipeWidth + laneGap, y: pipeY, w: pipeWidth, h: pipeH };
    buildBars(true);
    clampBalls();
  }

  function buildBars(keepDamage) {
    for (const lane of state.lanes) {
      buildBarsForLane(lane, keepDamage);
    }
  }

  function buildBarsForLane(lane, keepDamage) {
    const s = settings(lane);
    const oldBars = keepDamage ? lane.bars : [];
    const oldByIndex = new Map(oldBars.map((bar) => [bar.index, bar]));
    if (!keepDamage || !lane.destroyedBarIndices) lane.destroyedBarIndices = new Set();
    const pipe = lane.pipe;
    const rows = s.barCount;
    const gap = s.barGap;
    const barH = s.barHeight || FIXED_BAR_HEIGHT;
    const barAreaTop = pipe.y + pipe.h - rows * barH - Math.max(0, rows - 1) * gap - 18;
    const barW = pipe.w - 40;
    const bars = [];

    for (let i = 0; i < s.barCount; i++) {
      if (keepDamage && lane.destroyedBarIndices.has(i)) continue;
      const old = oldByIndex.get(i);
      const growthBasisPoints = BigInt(Math.round(s.barHealthGrowth * 100));
      const maxHealth = s.barHealth + BigInt(i) * (s.barHealth * growthBasisPoints / 10000n);
      const currentHealth = old ? minBigInt(old.health, maxHealth) : maxHealth;
      bars.push({
        index: i,
        x: pipe.x + 20,
        y: barAreaTop + i * (barH + gap),
        w: barW,
        h: barH,
        health: currentHealth,
        maxHealth,
        hit: old ? old.hit * 0.5 : 0,
        dead: currentHealth <= 0n,
        remove: false
      });
    }

    lane.bars = bars;
  }

  function createBall(lane, index, x, y, customVx, customVy) {
    const s = settings(lane);
    const pipe = lane.pipe;
    const radius = ballRadiusForDamage(s.ballSize, s.startDamage);
    const offset = (index - s.ballCount / 2) * 0.22;
    const angle = -Math.PI / 2 + offset * lane.side;
    const vx = customVx ?? Math.cos(angle) * s.speed;
    const vy = customVy ?? Math.sin(angle) * s.speed * 0.75;
    const slot = index % 5;
    const mirroredX = lane.side < 0 ? 0.72 - slot * 0.11 : 0.28 + slot * 0.11;
    const firstBarY = lane.bars.length ? Math.min(...lane.bars.map((bar) => bar.y)) : pipe.y + pipe.h;
    const defaultY = pipe.y + 76 + Math.floor(index / 5) * 14;
    const safeY = Math.max(pipe.y + radius + 28, Math.min(defaultY, firstBarY - radius - 30));
    return {
      x: x ?? pipe.x + pipe.w * mirroredX,
      y: y ?? safeY,
      vx,
      vy,
      r: radius,
      baseR: s.ballSize,
      damage: s.startDamage,
      streak: 0,
      color: palette[index % palette.length],
      trail: []
    };
  }

  function resetLaneBalls(lane) {
    const s = settings(lane);
    lane.balls = [];
    lane.particles = [];
    lane.floaters = [];
    lane.destroyedBars = 0;
    lane.destroyedBarIndices = new Set();
    for (let i = 0; i < s.ballCount; i++) {
      lane.balls.push(createBall(lane, i));
    }
  }

  function resetGame() {
    for (const lane of state.lanes) {
      lane.balls = [];
      lane.particles = [];
      lane.floaters = [];
      lane.destroyedBars = 0;
      lane.destroyedBarIndices = new Set();
    }
    state.started = false;
    state.paused = true;
    state.gameOver = false;
    state.winner = null;
    state.elapsed = 0;
    state.winTime = 0;
    state.bounces = 0;
    state.shake = 0;
    state.pointer = null;
    state.lastTime = 0;
    startBtn.textContent = "Start";
    matchStatus.textContent = state.currentEncounter ? "Ready. Start the race when your build is set." : "Choose a fight from the map.";
    buildBars(false);
    for (const lane of state.lanes) resetLaneBalls(lane);
    updateStats();
  }

  function clampBalls() {
    for (const lane of state.lanes) {
      const s = settings(lane);
      const pipe = lane.pipe;
      for (const ball of lane.balls) {
        ball.baseR = s.ballSize;
        ball.r = ballRadiusForDamage(s.ballSize, ball.damage);
        ball.x = Math.max(pipe.x + ball.r, Math.min(pipe.x + pipe.w - ball.r, ball.x));
        ball.y = Math.max(pipe.y + ball.r, Math.min(pipe.y + pipe.h - ball.r, ball.y));
      }
    }
  }

  function applyBounceDamage(lane, ball) {
    const s = settings(lane);
    if (s.growthMode === "flat") {
      ball.damage += s.growthValue;
    } else if (s.growthMode === "percent") {
      ball.damage += ball.damage * s.growthValue / 100n;
    } else if (s.growthMode === "multiplier") {
      ball.damage += ball.damage * s.growthValue / 100n;
    } else if (s.growthMode === "random") {
      ball.damage += randomBigIntUpTo(s.growthValue);
    } else if (s.growthMode === "combo") {
      ball.damage = ball.damage + ball.damage * s.growthValue / 100n + maxBigInt(1n, s.growthValue / 5n);
    } else if (s.growthMode === "comboRamp") {
      const ramp = 1n + BigInt(Math.min(25, Math.floor(state.elapsed / 10)));
      ball.damage += s.growthValue * ramp + ball.damage * s.growthValue / 250n;
    } else if (s.growthMode === "critical") {
      const chance = Math.min(60, Number(s.growthValue > 60n ? 60n : s.growthValue));
      ball.damage += maxBigInt(1n, s.growthValue);
      if (Math.random() * 100 < chance) {
        ball.damage *= 2n;
        ball.streak = 0;
        emitBounce(lane, ball.x, ball.y, "#ffc857", 18);
      }
    } else if (s.growthMode === "streak") {
      ball.streak = (ball.streak || 0) + 1;
      ball.damage += maxBigInt(1n, s.growthValue) * BigInt(Math.min(ball.streak, 50));
    } else if (s.growthMode === "milestone") {
      const multiplier = 1n + BigInt(Math.floor(lane.destroyedBars / 5));
      ball.damage += maxBigInt(1n, s.growthValue) * multiplier;
    } else if (s.growthMode === "comeback") {
      const opponent = opponentLane(lane);
      const behind = laneProgress(lane) < laneProgress(opponent);
      ball.damage += maxBigInt(1n, s.growthValue) * (behind ? 3n : 1n);
    }
    ball.r = ballRadiusForDamage(s.ballSize, ball.damage);
    state.bounces++;
  }

  function update(dt) {
    if (state.gameOver) return;
    state.elapsed += dt;
    const maxStep = 1 / 90;
    const steps = Math.max(1, Math.ceil(dt / maxStep));
    const step = dt / steps;

    for (let n = 0; n < steps; n++) {
      for (const lane of state.lanes) {
        const s = settings(lane);
        const pipe = lane.pipe;
        for (const ball of lane.balls) {
          ball.baseR = s.ballSize;
          ball.r = ballRadiusForDamage(s.ballSize, ball.damage);
          const prevX = ball.x;
          const prevY = ball.y;
          ball.vy += s.gravity * step;
          ball.x += ball.vx * step;
          ball.y += ball.vy * step;
          ball.trail.push({ x: ball.x, y: ball.y, a: 1 });
          if (ball.trail.length > 12) ball.trail.shift();

          let bounced = false;
          if (ball.x - ball.r < pipe.x) {
            ball.x = pipe.x + ball.r;
            ball.vx = reboundVelocity(1, s, 0.72);
            bounced = true;
          } else if (ball.x + ball.r > pipe.x + pipe.w) {
            ball.x = pipe.x + pipe.w - ball.r;
            ball.vx = reboundVelocity(-1, s, 0.72);
            bounced = true;
          }

          if (ball.y - ball.r < pipe.y) {
            ball.y = pipe.y + ball.r;
            ball.vy = reboundVelocity(1, s, 1);
            bounced = true;
          } else if (ball.y + ball.r > pipe.y + pipe.h) {
            finishGame(lane);
            return;
          }

          for (const bar of lane.bars) {
            if (bar.dead || bar.remove) continue;
            const hit = circleRectCollision(ball, bar);
            if (!hit) continue;

            resolveBallFromBar(ball, bar, hit, s, prevX, prevY);
            damageBar(lane, bar, ball, hit.x, hit.y);
            bounced = true;
          }

          normalizeBallSpeed(ball, s);

          if (bounced) {
            applyBounceDamage(lane, ball);
            emitBounce(lane, ball.x, ball.y, ball.color, 5);
          }
        }
      }
    }

    for (const lane of state.lanes) {
      for (const bar of lane.bars) {
        bar.hit = Math.max(0, bar.hit - dt * 5.2);
      }
      lane.bars = lane.bars.filter((bar) => !bar.remove);
      updateParticles(lane, dt);
    }

    state.shake = Math.max(0, state.shake - dt * 18);
  }

  function finishGame(lane) {
    if (state.gameOver) return;
    state.gameOver = true;
    state.paused = true;
    state.winner = lane;
    lane.score++;
    state.winTime = state.elapsed;
    state.pointer = null;
    state.shake = 0;
    startBtn.textContent = "Rematch";
    for (const ball of lane.balls) {
      emitBounce(lane, ball.x, ball.y, ball.color, 16);
    }
    updateStats();
    if (typeof onFinish === "function") {
      onFinish({
        winner: lane.id,
        winnerName: lane.name,
        time: state.winTime,
        encounter: state.currentEncounter
      });
    }
  }

  function circleRectCollision(ball, rect) {
    const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq > ball.r * ball.r) return null;
    const dist = Math.sqrt(distSq) || 0.0001;
    return {
      x: closestX,
      y: closestY,
      nx: dx / dist,
      ny: dy / dist,
      overlap: ball.r - dist
    };
  }

  function resolveBallFromBar(ball, bar, hit, s, prevX, prevY) {
    const wasAbove = prevY + ball.r <= bar.y;
    const wasBelow = prevY - ball.r >= bar.y + bar.h;
    const wasLeft = prevX + ball.r <= bar.x;
    const wasRight = prevX - ball.r >= bar.x + bar.w;
    let axis = null;

    if (wasAbove || wasBelow) {
      axis = "y";
    } else if (wasLeft || wasRight) {
      axis = "x";
    } else {
      const pushLeft = Math.abs((ball.x + ball.r) - bar.x);
      const pushRight = Math.abs((bar.x + bar.w) - (ball.x - ball.r));
      const pushTop = Math.abs((ball.y + ball.r) - bar.y);
      const pushBottom = Math.abs((bar.y + bar.h) - (ball.y - ball.r));
      axis = Math.min(pushTop, pushBottom) <= Math.min(pushLeft, pushRight) ? "y" : "x";
    }

    if (axis === "y") {
      if (wasBelow || (!wasAbove && ball.y > bar.y + bar.h / 2)) {
        ball.y = bar.y + bar.h + ball.r + 0.5;
        ball.vy = reboundVelocity(1, s, 1);
      } else {
        ball.y = bar.y - ball.r - 0.5;
        ball.vy = reboundVelocity(-1, s, 1);
      }
    } else {
      if (wasRight || (!wasLeft && ball.x > bar.x + bar.w / 2)) {
        ball.x = bar.x + bar.w + ball.r + 0.5;
        ball.vx = reboundVelocity(1, s, 0.72);
      } else {
        ball.x = bar.x - ball.r - 0.5;
        ball.vx = reboundVelocity(-1, s, 0.72);
      }
    }
  }

  function reboundVelocity(direction, s, axisScale) {
    const bounce = Math.max(0.1, s.bounce);
    return direction * s.speed * bounce * axisScale;
  }

  function normalizeBallSpeed(ball, s) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const minSpeed = s.speed * Math.max(0.35, s.bounce * 0.7);
    const maxSpeed = s.speed * Math.max(1.25, s.bounce * 1.35);
    if (speed < minSpeed && speed > 0) {
      ball.vx = ball.vx / speed * minSpeed;
      ball.vy = ball.vy / speed * minSpeed;
    } else if (speed > maxSpeed) {
      ball.vx = ball.vx / speed * maxSpeed;
      ball.vy = ball.vy / speed * maxSpeed;
    }

    const maxVertical = s.speed * Math.max(1.05, s.bounce * 1.1);
    if (Math.abs(ball.vy) > maxVertical) {
      ball.vy = Math.sign(ball.vy) * maxVertical;
    }
  }

  function damageBar(lane, bar, ball, x, y) {
    const damage = maxBigInt(1n, ball.damage);
    bar.health -= damage;
    bar.hit = 1;
    state.shake = Math.min(8, state.shake + 1.6);
    lane.floaters.push({
      x,
      y,
      text: "-" + compactNumber(damage),
      color: ball.color,
      life: 0.8,
      maxLife: 0.8,
      vy: -36 - Math.random() * 22
    });
    emitBounce(lane, x, y, ball.color, 12);

    if (bar.health <= 0n && !bar.dead) {
      bar.dead = true;
      bar.health = 0n;
      lane.destroyedBars++;
      if (!lane.destroyedBarIndices) lane.destroyedBarIndices = new Set();
      lane.destroyedBarIndices.add(bar.index);
      burstBar(lane, bar);
      setTimeout(() => {
        bar.remove = true;
      }, 160);
    }
  }

  function laneProgress(lane) {
    const total = lane.bars.length + lane.destroyedBars;
    if (!total) return 0;
    return Math.min(1, lane.destroyedBars / total);
  }

  function laneBarsLeft(lane) {
    return lane.bars.filter((bar) => !bar.dead).length;
  }

  function laneTopDamage(lane) {
    return lane.balls.reduce((max, ball) => maxBigInt(max, ball.damage), 0n);
  }

  function emitBounce(lane, x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 170;
      lane.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 3.5,
        color,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8
      });
    }
  }

  function burstBar(lane, bar) {
    for (let i = 0; i < 38; i++) {
      const x = bar.x + Math.random() * bar.w;
      const y = bar.y + Math.random() * bar.h;
      emitBounce(lane, x, y, Math.random() > 0.5 ? "#ffc857" : "#ff5f6d", 1);
    }
  }

  function updateParticles(lane, dt) {
    for (const p of lane.particles) {
      p.life -= dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    lane.particles = lane.particles.filter((p) => p.life > 0);

    for (const f of lane.floaters) {
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy += 35 * dt;
    }
    lane.floaters = lane.floaters.filter((f) => f.life > 0);
  }

  function draw() {
    if (!ctx) return;
    const shake = state.gameOver ? 0 : state.shake;
    const shakeX = shake ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackground();

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawCenterDivider();
    for (const lane of state.lanes) {
      drawPipe(lane);
      drawLaneLabel(lane);
      drawBars(lane);
      drawParticles(lane);
      drawBalls(lane);
      drawFloaters(lane);
    }
    if (state.pointer) drawLaunchGuide();
    ctx.restore();

    if (!state.gameOver && state.paused && state.started) {
      drawPauseOverlay();
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, state.height);
    g.addColorStop(0, "#111816");
    g.addColorStop(1, "#0c1215");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#5a6963";
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = (state.width % step) - step; x < state.width + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + state.height * 0.35, state.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawCenterDivider() {
    const left = state.lanes[0].pipe;
    const right = state.lanes[1].pipe;
    const x = (left.x + left.w + right.x) / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(x, left.y + 8);
    ctx.lineTo(x, left.y + left.h - 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPipe(lane) {
    const p = lane.pipe;
    const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    pipeGrad.addColorStop(0, "rgba(92, 118, 109, 0.35)");
    pipeGrad.addColorStop(0.12, "rgba(18, 26, 23, 0.95)");
    pipeGrad.addColorStop(0.5, "rgba(16, 24, 23, 0.72)");
    pipeGrad.addColorStop(0.88, "rgba(18, 26, 23, 0.95)");
    pipeGrad.addColorStop(1, "rgba(92, 118, 109, 0.35)");
    ctx.fillStyle = pipeGrad;
    roundRect(p.x, p.y, p.w, p.h, 28);
    ctx.fill();

    ctx.strokeStyle = "rgba(145, 180, 167, 0.45)";
    ctx.lineWidth = 3;
    roundRect(p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3, 27);
    ctx.stroke();

    ctx.strokeStyle = "rgba(85, 214, 141, 0.28)";
    ctx.lineWidth = 1;
    for (let y = p.y + 46; y < p.y + p.h; y += 44) {
      ctx.beginPath();
      ctx.moveTo(p.x + 12, y);
      ctx.lineTo(p.x + p.w - 12, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 200, 87, 0.75)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x + 18, p.y + p.h - 18);
    ctx.lineTo(p.x + p.w - 18, p.y + p.h - 18);
    ctx.stroke();
    ctx.setLineDash([]);

    const progress = laneProgress(lane);
    const railX = lane.side < 0 ? p.x + 8 : p.x + p.w - 14;
    const railY = p.y + 42;
    const railH = p.h - 78;
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    roundRect(railX, railY, 6, railH, 3);
    ctx.fill();
    ctx.fillStyle = lane.accent;
    roundRect(railX, railY + railH * (1 - progress), 6, railH * progress, 3);
    ctx.fill();
  }

  function drawLaneLabel(lane) {
    const p = lane.pipe;
    ctx.fillStyle = lane.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    fitText(lane.name.toUpperCase(), p.x + p.w / 2, p.y + 10, p.w - 28, 13);
    ctx.fillStyle = "#edf4ee";
    ctx.font = "800 11px Helvetica, Arial, sans-serif";
    fitText(Math.round(laneProgress(lane) * 100) + "% CLEARED", p.x + p.w / 2, p.y + 28, p.w - 28, 11);
  }

  function drawBars(lane) {
    for (const bar of lane.bars) {
      const healthRatio = bigIntRatio(bar.health, bar.maxHealth);
      const pop = bar.dead ? 1.08 : 1 + bar.hit * 0.035;
      const cx = bar.x + bar.w / 2;
      const cy = bar.y + bar.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pop, pop);
      ctx.translate(-cx, -cy);

      ctx.fillStyle = bar.dead ? "rgba(255, 95, 109, 0.28)" : "#26312e";
      roundRect(bar.x, bar.y, bar.w, bar.h, 7);
      ctx.fill();

      const fillGrad = ctx.createLinearGradient(bar.x, 0, bar.x + bar.w, 0);
      fillGrad.addColorStop(0, healthRatio > 0.35 ? "#55d68d" : "#ff5f6d");
      fillGrad.addColorStop(1, healthRatio > 0.65 ? "#62a8ff" : "#ffc857");
      ctx.fillStyle = fillGrad;
      roundRect(bar.x + 3, bar.y + 3, Math.max(0, (bar.w - 6) * healthRatio), bar.h - 6, 5);
      ctx.fill();

      if (bar.hit > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, " + (bar.hit * 0.28) + ")";
        roundRect(bar.x, bar.y, bar.w, bar.h, 7);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 1;
      roundRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1, 7);
      ctx.stroke();

      ctx.fillStyle = "#effaf2";
      ctx.font = "700 12px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(compactNumber(bar.health), bar.x + bar.w / 2, bar.y + bar.h / 2);
      ctx.restore();
    }
  }

  function drawParticles(lane) {
    for (const p of lane.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.7 + alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBalls(lane) {
    for (const ball of lane.balls) {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const a = (i + 1) / ball.trail.length;
        ctx.globalAlpha = a * 0.22;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const g = ctx.createRadialGradient(ball.x - ball.r * 0.35, ball.y - ball.r * 0.35, 2, ball.x, ball.y, ball.r * 1.3);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.22, ball.color);
      g.addColorStop(1, "#101715");
      ctx.fillStyle = g;
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(8, 16, 12, 0.76)";
      ctx.font = "800 " + Math.max(9, Math.min(13, ball.r * 0.7)) + "px Helvetica, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(compactNumber(ball.damage), ball.x, ball.y + 0.5);
    }
  }

  function drawFloaters(lane) {
    ctx.font = "800 15px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of lane.floaters) {
      const alpha = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawLaunchGuide() {
    const p = state.pointer;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.startX, p.startY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(85, 214, 141, 0.22)";
    ctx.beginPath();
    ctx.arc(p.startX, p.startY, settings(p.lane).ballSize, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPauseOverlay() {
    ctx.fillStyle = "rgba(4, 8, 7, 0.54)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#edf4ee";
    ctx.font = "900 42px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Paused", state.width / 2, state.height / 2);
  }

  function updateStats() {
    const activeBars = state.lanes.reduce((sum, lane) => sum + laneBarsLeft(lane), 0);
    const topDamage = state.lanes.reduce((laneMax, lane) => maxBigInt(laneMax, laneTopDamage(lane)), 0n);
    statTime.textContent = formatTime(state.gameOver ? state.winTime : state.elapsed);
    statDamage.textContent = compactNumber(topDamage);
    statBars.textContent = activeBars;
    statBounces.textContent = compactNumber(state.bounces);
    for (const lane of state.lanes) {
      if (!lane.summary.progress) continue;
      lane.summary.progress.textContent = Math.round(laneProgress(lane) * 100) + "%";
      lane.summary.damage.textContent = compactNumber(laneTopDamage(lane));
      lane.summary.bars.textContent = laneBarsLeft(lane);
      lane.summary.score.textContent = lane.score;
    }
    if (state.gameOver && state.winner) {
      matchStatus.textContent = state.winner.name + " wins in " + formatTime(state.winTime) + ".";
    } else if (state.started && !state.paused) {
      const leader = laneProgress(state.lanes[0]) === laneProgress(state.lanes[1])
        ? "Neck and neck"
        : (laneProgress(state.lanes[0]) > laneProgress(state.lanes[1]) ? state.lanes[0].name : state.lanes[1].name) + " is ahead";
      matchStatus.textContent = leader + ".";
    } else if (state.started && state.paused) {
      matchStatus.textContent = "Paused.";
    }
  }

  function formatTime(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    if (total < 60) return total.toFixed(1) + "s";
    const minutes = Math.floor(total / 60);
    const remaining = total - minutes * 60;
    return minutes + "m " + remaining.toFixed(1).padStart(4, "0") + "s";
  }

  function compactNumber(value) {
    if (typeof value === "bigint") {
      const n = value < 0n ? -value : value;
      const text = n.toString();
      if (text.length <= 3) return text;

      const suffixes = ["", "k", "m", "b", "t"];
      const group = Math.floor((text.length - 1) / 3);
      const leadingLength = text.length - group * 3;
      const leading = text.slice(0, leadingLength);
      const decimal = text.slice(leadingLength, leadingLength + 1);
      const compact = leading + (decimal && decimal !== "0" ? "." + decimal : "");
      if (group < suffixes.length) return compact + suffixes[group];
      return compact + "e" + (text.length - 1);
    }

    return RPG.compactNumber(value);
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function clearScheduledLoop() {
    if (!loopHandle) return;
    if (loopMode === "timeout") window.clearTimeout(loopHandle);
    else window.cancelAnimationFrame(loopHandle);
    loopHandle = null;
    loopMode = null;
  }

  function scheduleGameLoop() {
    clearScheduledLoop();
    if (document.hidden) {
      loopMode = "timeout";
      loopHandle = window.setTimeout(() => gameLoop(performance.now()), 33);
    } else {
      loopMode = "raf";
      loopHandle = requestAnimationFrame(gameLoop);
    }
  }

  function gameLoop(time) {
    loopHandle = null;
    loopMode = null;
    const now = (Number.isFinite(time) ? time : performance.now()) / 1000;
    const dt = Math.min(document.hidden ? 1.25 : 0.04, now - (state.lastTime || now));
    state.lastTime = now;
    if (!state.paused) {
      update(dt);
      updateStats();
    }
    draw();
    scheduleGameLoop();
  }

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * state.width / rect.width,
      y: (event.clientY - rect.top) * state.height / rect.height
    };
  }

  function laneAtPoint(point) {
    return state.lanes.find((lane) => {
      const p = lane.pipe;
      return point.x > p.x && point.x < p.x + p.w && point.y > p.y && point.y < p.y + p.h;
    }) || null;
  }

  function pointInActiveBar(lane, point) {
    return lane.bars.some((bar) => {
      if (bar.dead || bar.remove) return false;
      return point.x >= bar.x && point.x <= bar.x + bar.w && point.y >= bar.y && point.y <= bar.y + bar.h;
    });
  }

  function startCompetition() {
    if (!state.currentEncounter) {
      matchStatus.textContent = "Choose a fight from the map.";
      return;
    }
    if (state.gameOver) {
      resetGame();
      beginRound();
      return;
    }
    beginRound();
  }

  function beginRound() {
    if (!state.started) {
      state.elapsed = 0;
      state.bounces = 0;
    }
    state.gameOver = false;
    state.winner = null;
    state.started = true;
    state.paused = false;
    startBtn.textContent = "Pause";
    matchStatus.textContent = "Go.";
  }

  function togglePause() {
    if (!state.started || state.gameOver) {
      startCompetition();
      return;
    }
    state.paused = !state.paused;
    startBtn.textContent = state.paused ? "Resume" : "Pause";
  }

  function fitText(text, x, y, maxWidth, startSize) {
    let size = startSize;
    do {
      ctx.font = "900 " + size + "px Helvetica, Arial, sans-serif";
      if (ctx.measureText(text).width <= maxWidth || size <= 18) break;
      size -= 2;
    } while (size > 18);
    ctx.fillText(text, x, y);
  }

  function opponentLane(lane) {
    return state.lanes.find((item) => item !== lane);
  }

  function minBigInt(a, b) {
    return a < b ? a : b;
  }

  function maxBigInt(a, b) {
    return a > b ? a : b;
  }

  function randomBigIntUpTo(max) {
    if (max <= 0n) return 0n;
    if (max <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return BigInt(Math.floor(Math.random() * Number(max + 1n)));
    }

    const limit = max.toString();
    let candidate = "";
    do {
      candidate = "";
      for (let i = 0; i < limit.length; i++) {
        candidate += Math.floor(Math.random() * 10).toString();
      }
      candidate = candidate.replace(/^0+/, "") || "0";
    } while (BigInt(candidate) > max);
    return BigInt(candidate);
  }

  function bigIntRatio(part, whole) {
    if (whole <= 0n || part <= 0n) return 0;
    if (part >= whole) return 1;
    return Number(part * 10000n / whole) / 10000;
  }

  function ballRadiusForDamage(baseRadius, damage) {
    const digits = maxBigInt(1n, damage).toString().length;
    const scale = 1 + Math.min(9, Math.max(0, digits - 1) * 0.12);
    return Math.min(baseRadius * 10, baseRadius * scale);
  }

  RPG.Combat = {
    init,
    loadEncounter,
    resize,
    reset: resetGame,
    state
  };
})();
