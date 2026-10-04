(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  // The view is always H tall (levels are built for it), and as wide as the screen's shape
  // allows, from square (phones held upright) to ultrawide. See resize().
  let W = 960, H = 540;
  const T = 32;
  const MIN_ASPECT = 1, MAX_ASPECT = 2.4;
  const UI_W = 720; // the HUD and menus shrink to fit when the view is narrower than this
  const STEP = 1 / 60;

  const GRAVITY = 2000;
  const MAX_FALL = 820;
  const RUN_SPEED = 240;
  const JUMP_SPEED = 690;
  const COYOTE_TIME = 0.1;
  const JUMP_BUFFER = 0.13;
  const TONGUE_REACH = 128;
  const TONGUE_HOLD = 0.08; // seconds the tongue stays fully out before retracting
  const GRAPPLE_RANGE = 190; // how far a hook can be from the frog to be grabbed
  const ROPE_LENGTH = 120; // after grabbing, the tongue reels the frog in to this length
  const START_LIVES = 3;
  const MAX_HEARTS = 3;
  const ESCORT_SPEED = 50;
  const ESCORT_SCALE = 1.6;

  // M = bouncy mushroom cap, I = ice, i = thin ice (cracks and breaks)
  const SOLID = new Set(['#', 'B', 'M', 'I', 'i']);
  const isIce = (t) => t === 'I' || t === 'i';
  const isWaterTile = (t) => t === '~' || t === 'u'; // sea urchins sit in water
  // 'F' is a fake wall: drawn like dirt but you can walk straight through it.
  const looksSolid = (t) => SOLID.has(t) || t === 'F';
  const FONT = '"Trebuchet MS", "Avenir Next", system-ui, sans-serif';

  const THEMES = {
    meadow: {
      sky: ['#7ec8f2', '#d9f1ff'], sun: '#fff4b0',
      far: '#9fd3a8', near: '#6fbf73',
      dirt: '#8a5a3b', dirtDark: '#6e452c', grass: '#5cc24a', grassLight: '#8fe36f', grassDark: '#3f9a33',
      waterBack: 'rgba(40, 130, 200, 0.86)', water: 'rgba(40, 130, 200, 0.42)', waterTop: 'rgba(200, 240, 255, 0.9)',
      cloud: 'rgba(255,255,255,0.9)',
    },
    marsh: {
      sky: ['#6b8fa8', '#c9d9c0'], sun: '#fff7d6',
      far: '#7f9f86', near: '#56785e',
      dirt: '#5b4a3a', dirtDark: '#473829', grass: '#6a9b3f', grassLight: '#94c160', grassDark: '#4a7430',
      waterBack: 'rgba(45, 95, 75, 0.9)', water: 'rgba(45, 95, 75, 0.45)', waterTop: 'rgba(190, 230, 200, 0.85)',
      cloud: 'rgba(235,240,235,0.75)',
    },
    thicket: {
      sky: ['#f08a5d', '#ffd59e'], sun: '#fff1c1',
      far: '#b8736b', near: '#7d4a4f',
      dirt: '#6b3f2f', dirtDark: '#522e22', grass: '#7aa33a', grassLight: '#a7cc5a', grassDark: '#557526',
      waterBack: 'rgba(55, 100, 150, 0.86)', water: 'rgba(55, 100, 150, 0.42)', waterTop: 'rgba(255, 225, 200, 0.85)',
      cloud: 'rgba(255,235,220,0.8)',
    },
    night: {
      night: true,
      sky: ['#07122b', '#1d3557'], sun: '#f4f1de',
      far: '#172944', near: '#111f36',
      dirt: '#4a3830', dirtDark: '#382a24', grass: '#2f7a55', grassLight: '#4fa77a', grassDark: '#215a3e',
      waterBack: 'rgba(15, 45, 85, 0.92)', water: 'rgba(25, 60, 110, 0.42)', waterTop: 'rgba(170, 210, 255, 0.75)',
      cloud: 'rgba(120, 140, 190, 0.18)',
    },
    autumn: {
      weather: 'leaves',
      sky: ['#f4bf82', '#fde9cf'], sun: '#fff1c9',
      far: '#d9a066', near: '#b86b3a',
      dirt: '#6b4a32', dirtDark: '#553a26', grass: '#d69a3c', grassLight: '#f2c064', grassDark: '#a8742a',
      waterBack: 'rgba(60, 100, 110, 0.88)', water: 'rgba(60, 100, 110, 0.42)', waterTop: 'rgba(250, 230, 200, 0.85)',
      cloud: 'rgba(255, 245, 230, 0.85)',
    },
    winter: {
      weather: 'snow', cold: true, noFlowers: true,
      sky: ['#a9c6e0', '#eef4fa'], sun: '#ffffff',
      far: '#c9d8e8', near: '#a7bfd6',
      dirt: '#6f7f93', dirtDark: '#5a697c', grass: '#eef3fa', grassLight: '#ffffff', grassDark: '#c6d5e6',
      waterBack: 'rgba(40, 90, 130, 0.9)', water: 'rgba(40, 90, 130, 0.45)', waterTop: 'rgba(230, 245, 255, 0.95)',
      cloud: 'rgba(255, 255, 255, 0.9)',
    },
    dusk: {
      reeds: true,
      sky: ['#4f3566', '#f29a6a'], sun: '#ffcf8f',
      far: '#7b4f6e', near: '#52395a',
      dirt: '#4d3a2c', dirtDark: '#3c2d22', grass: '#6f8f3a', grassLight: '#93b05a', grassDark: '#52702a',
      waterBack: 'rgba(60, 60, 100, 0.88)', water: 'rgba(60, 60, 100, 0.42)', waterTop: 'rgba(255, 200, 170, 0.85)',
      cloud: 'rgba(255, 190, 170, 0.55)',
    },
    lagoon: {
      sky: ['#4fc3e8', '#d4f6ff'], sun: '#fffbe0',
      far: '#86d6c0', near: '#4fb89c',
      dirt: '#8a6a45', dirtDark: '#6d5234', grass: '#4fcf6b', grassLight: '#8cef8f', grassDark: '#35a355',
      waterBack: 'rgba(25, 125, 175, 0.9)', water: 'rgba(25, 125, 175, 0.42)', waterTop: 'rgba(220, 250, 255, 0.95)',
      cloud: 'rgba(255,255,255,0.92)',
    },
  };

  // ---------------------------------------------------------------------------
  // Canvas
  // ---------------------------------------------------------------------------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  let dpr = 1;
  let ui = 1; // scale for the HUD and menus (see uiSpace)
  let viewCap = Infinity; // a level narrower than the screen (the heron's arena) caps the view at its width

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cs = getComputedStyle(stage);
    const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const aspect = aw > 0 && ah > 0 ? aw / ah : 16 / 9;
    W = Math.round(Math.max(H * MIN_ASPECT, Math.min(H * aspect, H * MAX_ASPECT, viewCap)));
    ui = Math.min(1, W / UI_W);
    const scale = aw > 0 && ah > 0 ? Math.min(aw / W, ah / H) : 1;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  window.addEventListener('resize', resize);
  resize();

  // Draws HUD or menu art laid out for at least UI_W wide, scaled down to fit a narrower view.
  // W and H read as the scaled-up size while it runs, so layouts keep using them as usual.
  function uiSpace(draw) {
    if (ui === 1) return draw();
    const w = W, h = H;
    ctx.save();
    ctx.scale(ui, ui);
    W = w / ui;
    H = h / ui;
    try {
      draw();
    } finally {
      W = w;
      H = h;
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  // Gamepad buttons and stick directions show up as virtual keys too (Pad*, Stick*).
  const BINDS = {
    left: ['ArrowLeft', 'KeyA', 'TouchLeft', 'PadLeft', 'StickLeft'],
    right: ['ArrowRight', 'KeyD', 'TouchRight', 'PadRight', 'StickRight'],
    down: ['ArrowDown', 'KeyS', 'TouchDown', 'PadDown', 'StickDown'],
    jump: ['Space', 'KeyZ', 'ArrowUp', 'KeyW', 'KeyK', 'TouchJump', 'PadA'],
    tongue: ['KeyX', 'KeyJ', 'ShiftLeft', 'ShiftRight', 'TouchTongue', 'PadX', 'PadB', 'PadRB', 'PadRT'],
    pause: ['KeyP', 'Escape', 'TouchPause', 'PadStart'],
    back: ['PadB'], // leaves menus; B is also the tongue, so it never pauses or quits mid-level
    confirm: ['Enter', 'Space', 'TouchConfirm', 'PadA'],
    mute: ['KeyM'],
    restart: ['KeyR'],
    quit: ['KeyQ'],
    dev: ['Backquote'],
    menuUp: ['ArrowUp', 'KeyW', 'PadUp', 'StickUp'],
    menuDown: ['ArrowDown', 'KeyS', 'PadDown', 'StickDown'],
  };
  const keysDown = new Set();
  const keysHit = new Set();

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    if (!keysDown.has(e.code)) keysHit.add(e.code);
    keysDown.add(e.code);
    setPadMode(false);
    audio.unlock();
  });
  window.addEventListener('keyup', (e) => keysDown.delete(e.code));
  window.addEventListener('blur', () => {
    keysDown.clear();
    if (state === 'playing') state = 'paused';
    ambient.silence();
    ambience.hush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ambient.silence();
      ambience.hush();
    }
  });

  // Gamepads (standard mapping, so Xbox-style names: A jump, X/B/RB/RT tongue, Start pause).
  // They're polled once a frame and pressed or released like keys.
  const PAD_BUTTONS = { 0: 'PadA', 1: 'PadB', 2: 'PadX', 5: 'PadRB', 7: 'PadRT', 9: 'PadStart', 12: 'PadUp', 13: 'PadDown', 14: 'PadLeft', 15: 'PadRight' };
  const STICK_PRESS = 0.5, STICK_RELEASE = 0.35; // a gap between the two stops a resting stick flickering
  let padHeld = new Set();
  function setPadMode(on) {
    if (padMode === on) return;
    padMode = on;
    document.body.classList.toggle('pad', on);
    resize(); // upright phones make room for the on-screen controls only while they're shown
  }
  function pollGamepads() {
    if (!navigator.getGamepads) return;
    const now = new Set();
    const stick = (code, v) => { if (v > (padHeld.has(code) ? STICK_RELEASE : STICK_PRESS)) now.add(code); };
    for (const gp of navigator.getGamepads()) {
      if (!gp || !gp.connected) continue;
      gp.buttons.forEach((b, i) => { if (PAD_BUTTONS[i] && b.pressed) now.add(PAD_BUTTONS[i]); });
      const [ax = 0, ay = 0] = gp.axes;
      stick('StickLeft', -ax);
      stick('StickRight', ax);
      stick('StickUp', -ay);
      stick('StickDown', ay);
    }
    for (const code of now) {
      if (!padHeld.has(code)) {
        keysHit.add(code);
        setPadMode(true);
        audio.unlock();
      }
      keysDown.add(code); // re-added each frame, since losing focus clears every held key
    }
    for (const code of padHeld) if (!now.has(code)) keysDown.delete(code);
    padHeld = now;
  }

  // On-screen buttons press virtual keys. A finger can slide between buttons in the same
  // cluster (e.g. from ◀ to ▶) without lifting.
  const touchButtons = document.querySelectorAll('#touch button');
  const fingers = new Map(); // pointerId -> virtual key code
  function enableTouchMode() {
    if (touchMode) return;
    touchMode = true;
    document.body.classList.add('touch');
    resize();
  }
  function setFinger(id, code) {
    const prev = fingers.get(id);
    if (prev === code) return;
    if (prev && ![...fingers].some(([other, c]) => other !== id && c === prev)) keysDown.delete(prev);
    if (code) {
      if (!keysDown.has(code)) keysHit.add(code);
      keysDown.add(code);
      fingers.set(id, code);
    } else {
      fingers.delete(id);
    }
    touchButtons.forEach((b) => b.classList.toggle('on', [...fingers.values()].includes(b.dataset.key)));
  }
  touchButtons.forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      enableTouchMode();
      setPadMode(false);
      audio.unlock();
      setFinger(e.pointerId, btn.dataset.key);
    });
  });
  window.addEventListener('pointermove', (e) => {
    if (!fingers.has(e.pointerId)) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const btn = el && el.closest && el.closest('#touch button');
    const current = fingers.get(e.pointerId);
    const currentBtn = [...touchButtons].find((b) => b.dataset.key === current);
    if (btn && currentBtn && btn.parentElement === currentBtn.parentElement) setFinger(e.pointerId, btn.dataset.key);
  });
  ['pointerup', 'pointercancel'].forEach((type) => window.addEventListener(type, (e) => setFinger(e.pointerId, null)));

  // iOS Safari still zooms on a quick double-tap (or a two-thumb pinch) despite touch-action,
  // so cancel those gestures outright. Everything here runs on pointer events, so nothing
  // relies on the clicks a touchend would otherwise produce.
  document.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());

  // Taps and clicks on the game itself: choose menu items, or continue from a prompt.
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') enableTouchMode();
    setPadMode(false);
    audio.unlock();
    const rect = canvas.getBoundingClientRect();
    const gx = (e.clientX - rect.left) / rect.width * W;
    const gy = (e.clientY - rect.top) / rect.height * H;
    if (menuHitboxes.length) {
      const i = menuHitboxes.findIndex((b) => gx >= b.x && gx <= b.x + b.w && gy >= b.y && gy <= b.y + b.h);
      if (i >= 0) {
        menuIndex = i;
        keysHit.add('TouchConfirm');
      }
    } else if (state === 'complete' || state === 'gameover' || state === 'victory') {
      keysHit.add('TouchConfirm');
    }
  });

  const held = (action) => BINDS[action].some((c) => keysDown.has(c));
  const tapped = (action) => BINDS[action].some((c) => keysHit.has(c));

  // ---------------------------------------------------------------------------
  // Audio (tiny WebAudio synth, no assets)
  // ---------------------------------------------------------------------------
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    unlock() {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.22;
          // Everything passes through a low-pass filter that closes down underwater.
          this.muffler = this.ctx.createBiquadFilter();
          this.muffler.type = 'lowpass';
          this.muffler.frequency.value = 20000;
          this.muffler.Q.value = 1.2;
          this.master.connect(this.muffler);
          this.muffler.connect(this.ctx.destination);
        } catch (err) {
          this.ctx = null;
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    muffled: false,
    setMuffled(on) {
      if (!this.ctx || on === this.muffled) return;
      this.muffled = on;
      // A quick sweep that's even in pitch terms, so muffling in and out feel equally fast.
      const f = this.muffler.frequency, t = this.ctx.currentTime;
      f.cancelScheduledValues(t);
      f.setValueAtTime(f.value, t);
      f.exponentialRampToValueAtTime(on ? 650 : 20000, t + 0.05);
    },
    // Connect a node to the output, through a stereo panner when pan isn't centred.
    route(node, pan) {
      if (pan && this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;
        node.connect(panner);
        panner.connect(this.master);
        return panner;
      }
      node.connect(this.master);
      return null;
    },
    tone(type, f0, f1, dur, vol = 1, delay = 0, pan = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      this.route(gain, pan);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq, pan = 0) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      gain.gain.value = vol;
      src.connect(filter);
      filter.connect(gain);
      this.route(gain, pan);
      src.start(t);
    },
  };

  const sfx = {
    jump: () => audio.tone('square', 240, 520, 0.12, 0.3),
    swim: () => audio.tone('sine', 280, 520, 0.1, 0.35),
    tongue: () => audio.tone('sine', 1000, 320, 0.1, 0.35),
    plip: () => { audio.tone('sine', 900, 380, 0.09, 0.35); audio.noise(0.12, 0.4, 1400); },
    gulp: () => {
      audio.tone('triangle', 520, 1100, 0.07, 0.5);
      audio.tone('triangle', 820, 1600, 0.08, 0.4, 0.07);
    },
    stomp: () => audio.tone('square', 240, 60, 0.15, 0.4),
    hurt: () => audio.tone('sawtooth', 420, 90, 0.3, 0.35),
    splash: (vol = 1, pan = 0) => audio.noise(0.3, 0.9 * vol, 900, pan),
    croak: () => {
      audio.tone('sawtooth', 150, 95, 0.12, 0.35);
      audio.tone('sawtooth', 160, 100, 0.16, 0.35, 0.16);
    },
    checkpoint: () => [523, 659, 784].forEach((f, i) => audio.tone('triangle', f, f, 0.14, 0.4, i * 0.08)),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => audio.tone('triangle', f, f * 1.01, 0.16, 0.4, i * 0.1)),
    die: () => [440, 370, 311, 262].forEach((f, i) => audio.tone('square', f, f * 0.97, 0.16, 0.3, i * 0.13)),
    select: () => audio.tone('triangle', 660, 990, 0.08, 0.35),
    boing: () => {
      audio.tone('sine', 180, 540, 0.2, 0.45);
      audio.tone('triangle', 260, 780, 0.16, 0.25, 0.02);
    },
    crack: () => { audio.noise(0.08, 0.7, 2200); audio.tone('square', 900, 300, 0.05, 0.15); },
    iceBreak: () => { audio.noise(0.25, 0.9, 1800); audio.tone('triangle', 1400, 500, 0.15, 0.2); },
    shatter: (vol = 1, pan = 0) => {
      audio.noise(0.2, 0.8 * vol, 4200, pan);
      audio.tone('sine', 3000, 1500, 0.12, 0.2 * vol, 0, pan);
    },
    chitter: (vol = 1, pan = 0) => {
      for (let i = 0; i < 4; i++) audio.tone('square', 1900, 2300, 0.03, 0.08 * vol, i * 0.05, pan);
    },
    tok: (vol = 1, pan = 0) => audio.tone('triangle', 700, 300, 0.06, 0.3 * vol, 0, pan),
    squawk: () => {
      audio.tone('sawtooth', 780, 320, 0.35, 0.3);
      audio.tone('square', 620, 260, 0.3, 0.12, 0.04);
      audio.noise(0.2, 0.4, 1200);
    },
    thunk: () => { audio.noise(0.15, 0.8, 250); audio.tone('sine', 140, 60, 0.15, 0.4); },
    whoosh: (pan = 0) => audio.noise(0.6, 0.7, 700, pan),
    rattle: () => { for (let i = 0; i < 4; i++) audio.tone('square', 320, 280, 0.03, 0.08, i * 0.05); },
  };

  // Ambient enemy sounds: one buzz voice that follows the nearest wasp, and soft
  // footstep clicks from walking beetles. Both fade and pan with distance.
  const ambient = {
    buzz: null,
    tick: 0,
    ensureBuzz() {
      if (this.buzz || !audio.ctx) return this.buzz;
      const c = audio.ctx;
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 190;
      const flutter = c.createOscillator(); // wingbeat wobble
      flutter.frequency.value = 24;
      const flutterDepth = c.createGain();
      flutterDepth.gain.value = 9;
      flutter.connect(flutterDepth);
      flutterDepth.connect(osc.frequency);
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      filter.Q.value = 2;
      const gain = c.createGain();
      gain.gain.value = 0;
      const panner = c.createStereoPanner ? c.createStereoPanner() : null;
      osc.connect(filter);
      filter.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(audio.master);
      } else {
        gain.connect(audio.master);
      }
      osc.start();
      flutter.start();
      this.buzz = { osc, gain, panner };
      return this.buzz;
    },
    setBuzz(vol, pan, pitch) {
      const b = this.ensureBuzz();
      if (!b) return;
      const t = audio.ctx.currentTime;
      b.gain.gain.setTargetAtTime(vol, t, 0.06);
      if (b.panner) b.panner.pan.setTargetAtTime(pan, t, 0.06);
      b.osc.frequency.setTargetAtTime(pitch, t, 0.1);
    },
    silence() {
      if (this.buzz) this.buzz.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.03);
    },
    update(dt) {
      if (!audio.ctx) return;
      if (state !== 'playing' || audio.muted || !level) {
        this.silence();
        return;
      }
      // Buzz: follow the loudest wasp, a little higher-pitched as it gets close.
      if (++this.tick % 3 === 0) {
        let near = null;
        for (const e of level.enemies) {
          if (e.kind !== 'wasp' || e.dead || e.squashed > 0) continue;
          const h = hearing(e.x + e.w / 2, e.y + e.h / 2, 120, 520);
          if (!near || h.vol > near.vol) near = h;
        }
        const v = near ? near.vol : 0;
        this.setBuzz(0.07 * v, near ? near.pan : 0, 190 + v * 30);
      }
      // Clicks: each walking beetle ticks along on its own slightly uneven rhythm.
      for (const e of level.enemies) {
        if (e.kind !== 'beetle' || e.dead || e.caught || e.squashed > 0 || !e.grounded) continue;
        e.clickTimer = (e.clickTimer === undefined ? Math.random() * 0.2 : e.clickTimer) - dt;
        if (e.clickTimer > 0) continue;
        e.clickTimer = 0.16 + Math.random() * 0.08;
        const h = hearing(e.x + e.w / 2, e.y + e.h / 2, 100, 420);
        if (h.vol > 0.03) audio.tone('square', 2400, 1500, 0.018, 0.1 * h.vol, 0, h.pan);
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Level ambience: a quiet background bed (filtered noise that slowly swells) plus
  // occasional one-off sounds from random directions, chosen by the level's theme.
  // ---------------------------------------------------------------------------
  const AMBIENCE_VOLUME = 2.5; // overall level of the ambience relative to the sound effects

  const AMBIENCE = {
    dusk: {
      beds: [
        { type: 'lowpass', freq: 350, q: 0.5, vol: 0.04, lfoRate: 0.07, lfoDepth: 0.025 }, // evening wind
        { type: 'bandpass', freq: 1500, q: 0.8, vol: 0.02, lfoRate: 0.15, lfoDepth: 0.015 }, // reeds rustling
      ],
      events: [
        { every: [2.5, 6], play: (a, pan) => { // frogs croaking out in the reeds
          const f = rand(130, 190);
          a.voice('square', f * 1.15, f * 0.85, 0.07, 0.06, 0, pan, 650);
          a.voice('square', f * 1.25, f * 0.8, 0.1, 0.06, 0.09, pan, 650);
        } },
      ],
    },
    autumn: {
      beds: [
        { type: 'lowpass', freq: 600, q: 0.5, vol: 0.045, lfoRate: 0.1, lfoDepth: 0.03 }, // breeze
        { type: 'bandpass', freq: 2200, q: 0.8, vol: 0.02, lfoRate: 0.2, lfoDepth: 0.015 }, // leaves rustling
      ],
      events: [
        { every: [4, 9], play: (a, pan) => { // a squirrel chattering somewhere
          for (let i = 0; i < 5; i++) a.voice('square', 1800, 2200, 0.03, 0.04, i * 0.06, pan, 3000);
        } },
        { every: [10, 18], play: (a, pan) => { // cuckoo
          a.voice('sine', 660, 640, 0.2, 0.08, 0, pan * 0.6);
          a.voice('sine', 520, 505, 0.3, 0.08, 0.3, pan * 0.6);
        } },
      ],
    },
    winter: {
      beds: [
        { type: 'bandpass', freq: 700, q: 3, vol: 0.03, lfoRate: 0.09, lfoDepth: 0.025 }, // whistling wind
        { type: 'lowpass', freq: 250, q: 0.5, vol: 0.04, lfoRate: 0.06, lfoDepth: 0.02 }, // low wind
      ],
      events: [
        { every: [6, 12], play: (a, pan) => a.voice('sine', 95, 60, 0.6, 0.08, 0, pan * 0.5, 300) }, // ice creaking
        { every: [5, 10], play: (a, pan) => { // icicles tinkling
          [2600, 3100, 2800].forEach((f, i) => a.voice('sine', f, f * 0.98, 0.12, 0.03, i * 0.09, pan));
        } },
      ],
    },
    meadow: {
      beds: [{ type: 'lowpass', freq: 500, q: 0.5, vol: 0.05, lfoRate: 0.11, lfoDepth: 0.035 }], // breeze
      events: [
        { every: [2.5, 6], play: (a, pan) => { // birdsong chirps
          const base = rand(2300, 3200);
          const notes = 2 + Math.floor(Math.random() * 4);
          for (let i = 0; i < notes; i++) {
            a.voice('sine', base * rand(0.95, 1.05), base * rand(1.25, 1.5), rand(0.05, 0.09), 0.12, i * rand(0.08, 0.12), pan);
          }
        } },
        { every: [6, 12], play: (a, pan) => { // a quick trill
          const base = rand(3000, 3600);
          for (let i = 0; i < 8; i++) a.voice('sine', base, base * 1.08, 0.03, 0.07, i * 0.045, pan);
        } },
      ],
    },
    marsh: {
      beds: [{ type: 'lowpass', freq: 280, q: 0.6, vol: 0.06, lfoRate: 0.07, lfoDepth: 0.03 }], // damp wind
      events: [
        { every: [1.2, 3.5], play: (a, pan) => { // other frogs: "ri-bbit", sometimes twice
          const f = rand(140, 220);
          const ribbit = (d) => {
            a.voice('square', f * 1.15, f * 0.85, 0.07, 0.07, d, pan, 700);
            a.voice('square', f * 1.25, f * 0.8, 0.1, 0.07, d + 0.09, pan, 700);
          };
          ribbit(0);
          if (Math.random() < 0.4) ribbit(rand(0.35, 0.6));
        } },
        { every: [3, 7], play: (a, pan) => { // bubbling mud
          const f = rand(90, 140);
          a.voice('sine', f, f * 2.2, 0.09, 0.1, 0, pan * 0.5);
          if (Math.random() < 0.5) a.voice('sine', f * 1.2, f * 2.6, 0.07, 0.07, 0.12, pan * 0.5);
        } },
      ],
    },
    lagoon: {
      beds: [
        { type: 'bandpass', freq: 500, q: 0.6, vol: 0.05, lfoRate: 0.17, lfoDepth: 0.045 }, // waves lapping
        { type: 'lowpass', freq: 200, q: 0.5, vol: 0.03, lfoRate: 0.05, lfoDepth: 0.015 }, // deep swell
      ],
      events: [
        { every: [1.5, 4], play: (a, pan) => { // drips and plinks
          const f = rand(1100, 1700);
          a.voice('sine', f, f * 0.5, 0.07, 0.07, 0, pan);
          if (Math.random() < 0.3) a.voice('sine', f * 1.1, f * 0.55, 0.06, 0.05, rand(0.15, 0.3), pan);
        } },
      ],
    },
    night: {
      beds: [{ type: 'lowpass', freq: 350, q: 0.5, vol: 0.03, lfoRate: 0.06, lfoDepth: 0.02 }], // night wind
      events: [
        { every: [0.35, 1.1], play: (a, pan) => { // crickets
          const f = rand(4000, 4600);
          const pulses = 3 + Math.floor(Math.random() * 3);
          for (let i = 0; i < pulses; i++) a.voice('sine', f, f * 0.98, 0.022, 0.035, i * 0.05, pan);
        } },
        { every: [9, 18], play: (a, pan) => { // an owl: hoo... hoooo
          a.voice('sine', 400, 370, 0.3, 0.1, 0, pan * 0.6, 900);
          a.voice('sine', 360, 320, 0.55, 0.1, 0.55, pan * 0.6, 900);
        } },
      ],
    },
    thicket: {
      beds: [
        { type: 'bandpass', freq: 1600, q: 0.7, vol: 0.035, lfoRate: 0.13, lfoDepth: 0.03 }, // dry rustling
        { type: 'lowpass', freq: 300, q: 0.5, vol: 0.025, lfoRate: 0.09, lfoDepth: 0.015 }, // wind
      ],
      events: [
        { every: [7, 14], play: (a, pan) => { // woodpecker
          const taps = 8 + Math.floor(Math.random() * 6);
          for (let i = 0; i < taps; i++) a.voice('square', 1000, 500, 0.012, 0.05, i * 0.055, pan, 2500);
        } },
        { every: [12, 22], play: (a, pan) => { // crow: caw, caw
          const caw = (d) => a.voice('sawtooth', 720, 480, 0.22, 0.05, d, pan, 1400);
          caw(0);
          caw(0.32);
          if (Math.random() < 0.5) caw(0.64);
        } },
      ],
    },
  };

  const ambience = {
    out: null,
    noise: null,
    beds: [],
    timers: [],
    themeName: null,
    active: false,
    init() {
      if (this.out) return true;
      if (!audio.ctx) return false;
      const c = audio.ctx;
      this.out = c.createGain();
      this.out.gain.value = 0;
      this.out.connect(audio.master); // through the master, so the underwater muffle applies
      this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    },
    startBed(b) {
      const c = audio.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = b.type;
      filter.frequency.value = b.freq;
      filter.Q.value = b.q;
      const gain = c.createGain();
      gain.gain.value = b.vol;
      const lfo = c.createOscillator(); // slow swell
      lfo.frequency.value = b.lfoRate;
      const lfoGain = c.createGain();
      lfoGain.gain.value = b.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.out);
      src.start();
      lfo.start();
      this.beds.push({ src, lfo, gain });
    },
    stopBeds() {
      for (const b of this.beds) {
        b.src.stop();
        b.lfo.stop();
        b.gain.disconnect();
      }
      this.beds = [];
    },
    setTheme(name) {
      if (name === this.themeName) return;
      this.stopBeds();
      this.themeName = name;
      const def = AMBIENCE[name];
      this.timers = def ? def.events.map((e) => ({ e, t: rand(e.every[0], e.every[1]) * 0.5 })) : [];
      if (def) def.beds.forEach((b) => this.startBed(b));
    },
    // A short tone with a soft attack, optionally low-passed and panned.
    voice(type, f0, f1, dur, vol, delay = 0, pan = 0, lowpass = 0) {
      const c = audio.ctx;
      const t = c.currentTime + delay;
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.01, dur / 4));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc;
      if (lowpass) {
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpass;
        osc.connect(filter);
        node = filter;
      }
      node.connect(gain);
      if (pan && c.createStereoPanner) {
        const panner = c.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(this.out);
      } else {
        gain.connect(this.out);
      }
      osc.start(t);
      osc.stop(t + dur + 0.05);
    },
    hush() {
      if (this.out) this.out.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
      this.active = false;
    },
    update(dt) {
      if (!this.init()) return;
      this.setTheme(level && state !== 'title' && state !== 'dev' && state !== 'select' ? level.themeName : null);
      const active = !!level && !audio.muted && (state === 'playing' || state === 'dying' || state === 'complete');
      if (active !== this.active) {
        this.active = active;
        this.out.gain.setTargetAtTime(active ? AMBIENCE_VOLUME : 0, audio.ctx.currentTime, 0.3);
      }
      if (!active) return;
      for (const tm of this.timers) {
        tm.t -= dt;
        if (tm.t > 0) continue;
        tm.t = rand(tm.e.every[0], tm.e.every[1]);
        tm.e.play(this, rand(-0.8, 0.8));
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Music: a small step sequencer that plays the songs in music.js. Notes are scheduled
  // a little ahead on the audio clock, and everything runs through the master, so the
  // underwater muffle and mute apply.
  // ---------------------------------------------------------------------------
  const MUSIC_VOLUME = 0.3; // under the sound effects, which carry the gameplay
  const LOOKAHEAD = 0.12; // seconds of notes scheduled ahead of the audio clock

  // Instruments: one or more oscillators (ratio to the note's pitch), an envelope
  // (attack, decay, sustain level, release) and an optional low-pass filter.
  const INSTRUMENTS = {
    lead: { oscs: [{ type: 'square', gain: 0.5 }, { type: 'triangle', gain: 0.6 }], a: 0.01, d: 0.12, s: 0.6, r: 0.08, vol: 0.14, cutoff: 2400, vibrato: 0.004 },
    pluck: { oscs: [{ type: 'triangle' }, { type: 'sine', ratio: 2, gain: 0.3 }], a: 0.004, d: 0.22, s: 0, r: 0.05, vol: 0.3, cutoff: 3200 },
    reed: { oscs: [{ type: 'square' }], a: 0.03, d: 0.1, s: 0.7, r: 0.07, vol: 0.11, cutoff: 1300, vibrato: 0.005 },
    harmonica: { oscs: [{ type: 'sawtooth' }, { type: 'square', gain: 0.4 }], a: 0.05, d: 0.2, s: 0.6, r: 0.12, vol: 0.08, cutoff: 1500, vibrato: 0.008 },
    brass: { oscs: [{ type: 'sawtooth' }, { type: 'sawtooth', detune: 8 }], a: 0.025, d: 0.15, s: 0.6, r: 0.08, vol: 0.08, cutoff: 1900 },
    flute: { oscs: [{ type: 'sine' }, { type: 'triangle', gain: 0.25 }], a: 0.09, d: 0.2, s: 0.8, r: 0.25, vol: 0.16, vibrato: 0.006 },
    bell: { oscs: [{ type: 'sine' }, { type: 'sine', ratio: 3.01, gain: 0.25 }], a: 0.003, d: 1.4, s: 0, r: 0.3, vol: 0.2 },
    musicbox: { oscs: [{ type: 'sine' }, { type: 'sine', ratio: 4, gain: 0.3 }, { type: 'triangle', ratio: 2, gain: 0.15 }], a: 0.002, d: 0.9, s: 0, r: 0.2, vol: 0.2 },
    glass: { oscs: [{ type: 'sine' }, { type: 'sine', ratio: 2, gain: 0.15 }], a: 0.006, d: 0.7, s: 0, r: 0.2, vol: 0.1 },
    bass: { oscs: [{ type: 'triangle' }, { type: 'square', gain: 0.25 }], a: 0.005, d: 0.2, s: 0.6, r: 0.05, vol: 0.32, cutoff: 700 },
    softbass: { oscs: [{ type: 'sine' }, { type: 'triangle', gain: 0.3 }], a: 0.02, d: 0.3, s: 0.7, r: 0.15, vol: 0.32 },
    pad: { oscs: [{ type: 'sawtooth' }, { type: 'sawtooth', detune: -9 }, { type: 'sawtooth', detune: 9 }], a: 0.5, d: 0.5, s: 0.8, r: 0.7, vol: 0.014, cutoff: 950 },
  };

  const NOTE_STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const CHORD_SHAPES = {
    '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6], 6: [0, 4, 7, 9], add9: [0, 4, 7, 14],
  };
  const accidental = (a) => (a === '#' ? 1 : a === 'b' ? -1 : 0);
  function noteMidi(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) throw new Error(`Bad note "${name}"`);
    return 12 * (+m[3] + 1) + NOTE_STEPS[m[1]] + accidental(m[2]);
  }
  function parseChord(sym) {
    const m = /^([A-G])([#b]?)(.*)$/.exec(sym);
    if (!m || !CHORD_SHAPES[m[3]]) throw new Error(`Bad chord "${sym}"`);
    return { root: (NOTE_STEPS[m[1]] + accidental(m[2]) + 12) % 12, shape: CHORD_SHAPES[m[3]] };
  }
  const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const tokens = (str) => str.split(/\s+/).filter((t) => t && t !== '|');
  // A pattern is one bar, or a list of bars used in turn.
  const bars = (p) => [].concat(p).map(tokens);
  // How many steps a note lasts: itself plus any '-' holding it.
  function heldSteps(list, i) {
    let n = 1;
    while (list[i + n] === '-') n++;
    return n;
  }
  // Wraps a pitch class into the octave starting at `low`.
  const placeAbove = (pc, low) => low + ((pc - low) % 12 + 12) % 12;

  // Turns a song from music.js into per-step chords and token lists.
  function compileSong(def) {
    const chordAt = [];
    const chordStart = []; // true where a new chord begins
    for (const bar of def.chords) {
      const cs = bar.split(/\s+/).map(parseChord);
      for (let s = 0; s < def.steps; s++) {
        const k = Math.floor(s * cs.length / def.steps);
        chordAt.push(cs[k]);
        chordStart.push(s === 0 || Math.floor((s - 1) * cs.length / def.steps) !== k);
      }
    }
    const parts = Object.values(def.parts).map((p) => ({
      ...p,
      notes: p.notes ? tokens(p.notes) : null,
      bass: p.bass ? bars(p.bass) : null,
      arp: p.arp ? bars(p.arp) : null,
      stab: p.stab ? bars(p.stab) : null,
      drums: p.drums ? Object.entries(p.drums).map(([kind, pat]) => ({ kind, bars: bars(pat) })) : null,
    }));
    return { ...def, parts, chordAt, chordStart, length: chordAt.length };
  }
  let songs = null; // compiled on first use, so a mistake in music.js only breaks the music

  const BASS_DEGREES = { R: 0, 8: 12, L: -5 };
  function bassNote(token, chord) {
    let off = BASS_DEGREES[token];
    if (token === '3') off = chord.shape[1];
    if (token === '5') off = chord.shape[2];
    if (token === '7') off = chord.shape[3] !== undefined ? chord.shape[3] : 10;
    return off === undefined ? null : placeAbove(chord.root, 36) + off;
  }
  // Chord tones from the root upward, for arpeggios; 1 is the root, past the top it climbs an octave.
  function arpNote(n, chord, low) {
    const k = n - 1, len = chord.shape.length;
    return placeAbove(chord.root, low) + chord.shape[k % len] + 12 * Math.floor(k / len);
  }
  // A close voicing for pads and stabs, every note within one octave from `low`.
  const voicing = (chord, low = 55) => chord.shape.map((iv) => placeAbove(chord.root + iv, low));

  const music = {
    out: null,
    noise: null,
    current: null, // { name, song, bus, mix, step, next, loop }
    intensity: 0, // the heron fight builds this up
    init() {
      if (this.out) return true;
      if (!audio.ctx || !window.SONGS) return false;
      const c = audio.ctx;
      this.out = c.createGain();
      this.out.gain.value = 0;
      this.out.connect(audio.master);
      this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    },
    // Each song plays into its own bus (plus echo), mixed into a gain that fades it out
    // when the next song starts.
    makeBus(song) {
      const c = audio.ctx;
      const bus = c.createGain();
      bus.gain.value = song.volume || 1;
      const mix = c.createGain();
      bus.connect(mix);
      mix.connect(this.out);
      if (song.echo) {
        const delay = c.createDelay(2);
        delay.delayTime.value = song.echo.time;
        const feedback = c.createGain();
        feedback.gain.value = song.echo.feedback;
        const tone = c.createBiquadFilter(); // each repeat a little darker
        tone.type = 'lowpass';
        tone.frequency.value = 2500;
        const wet = c.createGain();
        wet.gain.value = song.echo.mix;
        bus.connect(delay);
        delay.connect(tone);
        tone.connect(feedback);
        feedback.connect(delay);
        tone.connect(wet);
        wet.connect(mix);
      }
      return { bus, mix };
    },
    note(inst, midi, t, dur, vol, dest) {
      const c = audio.ctx;
      const freq = midiFreq(midi);
      const env = c.createGain();
      const peak = inst.vol * vol;
      const end = t + Math.max(dur, inst.a + 0.01);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(peak, t + inst.a);
      if (inst.s > 0) {
        env.gain.setTargetAtTime(peak * inst.s, t + inst.a, inst.d / 3);
        env.gain.setTargetAtTime(0.0001, end, inst.r / 3);
      } else {
        env.gain.setTargetAtTime(0.0001, t + inst.a, inst.d / 3);
      }
      const stop = (inst.s > 0 ? end + inst.r : t + inst.a + inst.d) + 0.1;
      let input = env;
      if (inst.cutoff) {
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = inst.cutoff;
        filter.connect(env);
        input = filter;
      }
      let vib = null;
      if (inst.vibrato) {
        // Vibrato fades in on held notes, like a player leaning into them.
        vib = c.createOscillator();
        vib.frequency.value = 5.2;
        const depth = c.createGain();
        depth.gain.setValueAtTime(0, t);
        depth.gain.linearRampToValueAtTime(freq * inst.vibrato, t + Math.min(0.4, dur));
        vib.connect(depth);
        vib.depth = depth;
        vib.start(t);
        vib.stop(stop);
      }
      for (const o of inst.oscs) {
        const osc = c.createOscillator();
        osc.type = o.type;
        osc.frequency.value = freq * (o.ratio || 1);
        if (o.detune) osc.detune.value = o.detune;
        if (vib) vib.depth.connect(osc.frequency);
        const g = c.createGain();
        g.gain.value = o.gain === undefined ? 1 : o.gain;
        osc.connect(g);
        g.connect(input);
        osc.start(t);
        osc.stop(stop);
      }
      env.connect(dest);
    },
    drum(kind, t, vol, dest) {
      const c = audio.ctx;
      const hit = (osc, f0, f1, len, v) => {
        const o = c.createOscillator();
        o.type = osc;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + len);
        const g = c.createGain();
        g.gain.setValueAtTime(v * vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g);
        g.connect(dest);
        o.start(t);
        o.stop(t + len + 0.02);
      };
      const hiss = (type, freq, q, len, v) => {
        const src = c.createBufferSource();
        src.buffer = this.noise;
        const f = c.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = c.createGain();
        g.gain.setValueAtTime(v * vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(f);
        f.connect(g);
        g.connect(dest);
        src.start(t, Math.random() * 0.5);
        src.stop(t + len + 0.02);
      };
      switch (kind) {
        case 'kick': hit('sine', 140, 45, 0.16, 0.55); break;
        case 'snare': hiss('bandpass', 1900, 0.8, 0.12, 0.3); hit('triangle', 200, 140, 0.06, 0.15); break;
        case 'hat': hiss('highpass', 7500, 0.7, 0.035, 0.12); break;
        case 'shaker': hiss('bandpass', 5500, 1.2, 0.06, 0.08); break;
        case 'wood': hit('sine', 1150, 1050, 0.05, 0.22); hit('triangle', 2300, 2100, 0.025, 0.06); break;
        case 'tom': hit('sine', 210, 110, 0.22, 0.4); break;
      }
    },
    // Plays one step of the song at audio time t.
    playStep(cur, t, stepDur) {
      const song = cur.song;
      const i = cur.step % song.length;
      const s = i % song.steps;
      const barIndex = Math.floor(i / song.steps);
      const chord = song.chordAt[i];
      for (const p of song.parts) {
        if (p.from && this.intensity < p.from) continue;
        if (p.loops && !p.loops[cur.loop % p.loops.length]) continue;
        const vol = p.vol === undefined ? 1 : p.vol;
        const inst = INSTRUMENTS[p.inst];
        if (p.notes) {
          const tok = p.notes[i];
          if (tok !== '-' && tok !== '.') this.note(inst, noteMidi(tok), t, heldSteps(p.notes, i) * stepDur, vol, cur.bus);
        }
        if (p.pad && song.chordStart[i]) {
          let n = 1;
          while (i + n < song.length && !song.chordStart[i + n]) n++;
          for (const m of voicing(chord)) this.note(inst, m, t, n * stepDur, vol, cur.bus);
        }
        for (const [key, play] of [['bass', (tok) => bassNote(tok, chord)], ['arp', (tok) => (/^\d+$/.test(tok) ? arpNote(+tok, chord, 60) : null)]]) {
          if (!p[key]) continue;
          const bar = p[key][barIndex % p[key].length];
          const m = play(bar[s]);
          if (m !== null) this.note(inst, m, t, heldSteps(bar, s) * stepDur, vol, cur.bus);
        }
        if (p.stab) {
          const bar = p.stab[barIndex % p.stab.length];
          if (bar[s] === 'x') for (const m of voicing(chord, 60)) this.note(inst, m, t, stepDur, vol, cur.bus);
        }
        if (p.drums) {
          for (const d of p.drums) {
            const tok = d.bars[barIndex % d.bars.length][s];
            if (tok === 'x' || tok === 'o') this.drum(d.kind, t, (tok === 'x' ? 1 : 0.45) * vol, cur.bus);
          }
        }
      }
    },
    // Which song fits what's happening, or null for silence.
    wanted() {
      if (audio.muted || !musicOn) return null;
      switch (state) {
        case 'title': case 'select': case 'victory': return 'title';
        case 'dev': return devSong || 'title';
        case 'playing': case 'paused': case 'dying':
          if (level.boss && level.boss.defeated) return 'title'; // the heron's gone: the theme comes home
          return inTutorial ? 'meadow' : level.themeName;
        default: return null; // the level-complete fanfare and game over play on their own
      }
    },
    start(name) {
      const song = songs[name];
      if (!song) { this.current = null; return; }
      this.current = { name, song, ...this.makeBus(song), step: 0, loop: 0, next: audio.ctx.currentTime + 0.1 };
    },
    stop() {
      const cur = this.current;
      if (!cur) return;
      cur.mix.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.25);
      setTimeout(() => cur.mix.disconnect(), 3000);
      this.current = null;
    },
    compile() {
      if (songs) return true;
      try {
        songs = {};
        for (const [name, def] of Object.entries(window.SONGS)) songs[name] = compileSong(def);
        return true;
      } catch (err) {
        console.error('Music disabled:', err);
        window.SONGS = null;
        return false;
      }
    },
    // Schedules the current song's steps up to audio time `until`.
    schedule(until) {
      const cur = this.current;
      while (cur.next < until) {
        const song = cur.song;
        const bpm = song.bpm + (song.bpmPerHit || 0) * Math.max(0, this.intensity - 1);
        const stepDur = 60 / bpm / song.beat;
        // Swing pushes every other step a little late.
        const swing = song.swing || 0;
        const offset = cur.step % 2 === 1 ? swing * stepDur / 3 : 0;
        this.playStep(cur, cur.next + offset, stepDur);
        cur.next += stepDur;
        cur.step++;
        if (cur.step % song.length === 0) cur.loop++;
      }
    },
    update() {
      if (!this.init() || !this.compile()) return;
      const want = this.wanted();
      if ((this.current && this.current.name) !== want) {
        this.stop();
        if (want) this.start(want);
      }
      // Fight intensity: a low pulse during the heron's intro, then a layer per stage of the fight.
      // The dev jukebox builds it up a step each time round instead.
      const b = level && level.boss;
      if (state === 'dev') this.intensity = this.current ? Math.min(4, this.current.loop) : 0;
      else this.intensity = b && !b.defeated ? (b.state === 'intro' ? 0 : 1 + b.maxHp - b.hp) : 0;
      // Quieter while paused or dying.
      const duck = state === 'paused' ? 0.35 : state === 'dying' ? 0.6 : 1;
      this.out.gain.setTargetAtTime(MUSIC_VOLUME * duck, audio.ctx.currentTime, 0.15);

      const cur = this.current;
      if (!cur) return;
      const now = audio.ctx.currentTime;
      if (cur.next < now - 0.2) cur.next = now + 0.05; // the tab was asleep: pick up from here
      this.schedule(now + LOOKAHEAD);
    },
  };

  // ---------------------------------------------------------------------------
  // Storage (best-effort; works without it)
  // ---------------------------------------------------------------------------
  const BEST_KEY = 'lilyleap.best';
  const TUTORIAL_KEY = 'lilyleap.tutorialDone';
  const COMPLETED_KEY = 'lilyleap.completed'; // beating the game unlocks the level select
  const MUSIC_OFF_KEY = 'lilyleap.musicOff';
  function loadNumber(key) {
    try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (err) { return 0; }
  }
  function saveNumber(key, v) {
    try { localStorage.setItem(key, String(v)); } catch (err) { /* ignore */ }
  }
  const LILY_KEY = 'lilyleap.lilies';
  function loadLilies() {
    try { return new Set(JSON.parse(localStorage.getItem(LILY_KEY) || '[]')); } catch (err) { return new Set(); }
  }
  function saveLilies(set) {
    try { localStorage.setItem(LILY_KEY, JSON.stringify([...set])); } catch (err) { /* ignore */ }
  }
  // The run in progress, so Continue can pick it up: which level, the score and lives going
  // into it, and the last checkpoint touched.
  const RUN_KEY = 'lilyleap.run';
  function loadRun() {
    try {
      const run = JSON.parse(localStorage.getItem(RUN_KEY) || 'null');
      // Levels are found by name, so a save survives levels being added or reordered.
      const i = run ? window.LEVELS.findIndex((l) => l.name === run.name) : -1;
      return i < 0 ? null : { ...run, level: i };
    } catch (err) { return null; }
  }
  function writeRun(run) {
    try {
      if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run));
      else localStorage.removeItem(RUN_KEY);
    } catch (err) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) >>> 0;
  };

  function ellipse(x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  }
  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
  }

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------
  let state = 'title'; // title | playing | paused | dying | complete | gameover | victory
  let time = 0;
  let levelIndex = 0;
  let level = null;
  let player = null;
  let score = 0;
  let levelStartScore = 0;
  let lives = START_LIVES;
  let highScore = loadNumber(BEST_KEY);
  let tutorialDone = loadNumber(TUTORIAL_KEY) > 0;
  let gameCompleted = loadNumber(COMPLETED_KEY) > 0;
  let musicOn = loadNumber(MUSIC_OFF_KEY) === 0;
  let justUnlocked = false; // shows a note on the victory screen the first time
  let foundLilies = loadLilies(); // names of levels whose golden lily has been found
  let savedRun = loadRun(); // the run Continue resumes, or null
  let inTutorial = false;
  let touchMode = false; // set once the player touches the screen; swaps key hints for tap hints
  let padMode = false; // set while a gamepad is the last thing used; swaps hints for button names
  // Picks the hint that matches the controls in use.
  const hint = (keys, touch, pad) => (padMode ? pad : touchMode ? touch : keys);
  // Continue if there's a run to resume; first-time players start with the tutorial highlighted.
  const titleDefault = () => (savedRun || tutorialDone ? 0 : 1);
  let menuIndex = titleDefault();
  let stateTimer = 0;
  let banner = 0;
  let shake = 0;
  const cam = { x: 0, y: 0 };
  let particles = [];
  let popups = [];

  function titleMenu() {
    const items = [];
    if (savedRun) items.push({ label: `Continue · Level ${savedRun.level + 1}`, go: continueRun });
    items.push({ label: 'Start game', go: startGame }, { label: 'Tutorial', go: startTutorial });
    if (gameCompleted) items.push({ label: 'Level select', go: () => { state = 'select'; menuIndex = 1; sfx.select(); } });
    return items;
  }
  const titleItems = () => titleMenu().map((item) => item.label);
  // Level select: the tutorial, then every level.
  const selectItems = () => [`Tutorial: ${window.TUTORIAL.name}`, ...window.LEVELS.map((l, i) => `${i + 1}. ${l.name}`)];
  const pauseItems = () => ['Resume', 'Restart level', `Sound: ${audio.muted ? 'Off' : 'On'}`, `Music: ${musicOn ? 'On' : 'Off'}`, 'Quit to title'];

  // Dev mode: jump straight to any level. Dev runs never save a best score.
  let devRun = false;
  let devInvincible = false;
  const CAMEO_MODES = ['Random', 'Always', 'Never'];
  let devCameo = 'Random';
  let devSong = null; // the jukebox: a song to play on the dev screen
  function devSongLabel() {
    if (!devSong) return 'Off';
    if (devSong === 'title') return 'Title';
    const lvl = window.LEVELS.find((l) => l.theme === devSong);
    return lvl ? lvl.name : devSong;
  }
  const DEV_LEVEL_COUNT = () => window.LEVELS.length + 1; // tutorial + levels
  function devItems() {
    return [
      `Tutorial: ${window.TUTORIAL.name}`,
      ...window.LEVELS.map((l, i) => `Level ${i + 1}: ${l.name}`),
      `Invincible: ${devInvincible ? 'ON' : 'OFF'}`,
      `Snail cameo: ${devCameo}`,
      `Jukebox: ${devSongLabel()}`,
    ];
  }

  // ---------------------------------------------------------------------------
  // Level loading
  // ---------------------------------------------------------------------------
  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const lvl = {
      name: def.name,
      theme: THEMES[def.theme] || THEMES.meadow,
      themeName: THEMES[def.theme] ? def.theme : 'meadow',
      w, h,
      pw: w * T,
      ph: h * T,
      tiles: new Array(w * h).fill(' '),
      start: { x: 0, y: 0 },
      flies: [],
      enemies: [],
      platforms: [],
      checkpoints: [],
      signs: [],
      kelp: [],
      hooks: [],
      lilies: [],
      fireflies: [],
      icicles: [],
      boss: null,
      par: def.par || 0,
      goal: null,
      time: 0,
      fliesEaten: 0,
    };

    let escortStop = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let ch = rows[y][x] || ' ';
        const px = x * T, py = y * T;
        switch (ch) {
          case 'P': lvl.start = { x: px + (T - 24) / 2, y: py + T - 22 }; ch = ' '; break;
          case 'f': lvl.flies.push(makeFly(px + T / 2, py + T / 2)); ch = ' '; break;
          case 'o': lvl.flies.push(makeFly(px + T / 2, py + T / 2)); ch = '~'; break;
          case 'b': lvl.enemies.push(makeBeetle(px + 3, py + T - 18)); ch = ' '; break;
          case 'w': lvl.enemies.push(makeWasp(px + T / 2, py + T / 2)); ch = ' '; break;
          case 'p': lvl.enemies.push(makeFish(px + 8, py + 3)); ch = '~'; break;
          case 's': lvl.enemies.push(makeSwimmer(px + 4, py + 8)); ch = '~'; break;
          case 'l': lvl.platforms.push(makeLilyPad(px, py, x)); ch = '~'; break;
          case 'k': lvl.kelp.push({ x: px + T / 2, y: py + T, h: rand(56, 96), phase: rand(0, 6) }); ch = '~'; break;
          case 'm': lvl.platforms.push(makePlatform(px, py, 'h')); ch = ' '; break;
          case 'v': lvl.platforms.push(makePlatform(px, py, 'v')); ch = ' '; break;
          case 'c': lvl.checkpoints.push({ x: px + 8, y: py - 16, w: 16, h: 48, active: false, wave: 0 }); ch = ' '; break;
          case 'G': lvl.goal = { x: px + 4, y: py - 64, w: 24, h: 96 }; ch = ' '; break;
          case '&': {
            const escort = makeEscort(px, py);
            lvl.platforms.push(escort);
            lvl.signs.push({ kind: 'escort', ref: escort, x: px, y: py, text: '', show: 0 });
            ch = ' ';
            break;
          }
          case '>': escortStop = px + T / 2; ch = ' '; break;
          case '*': lvl.lilies.push(makeLily(px, py)); ch = ' '; break;
          case 'y': lvl.fireflies.push({ kind: 'firefly', ax: px + T / 2, ay: py + T / 2, x: px + T / 2, y: py + T / 2, w: 0, h: 0, phase: Math.random() * 10, eaten: false, caught: false }); ch = ' '; break;
          case '%': lvl.lilies.push(makeLily(px, py)); ch = 'F'; break;
          case 'q': lvl.enemies.push(makeSquirrel(px + 4, py + T - 22)); ch = ' '; break;
          case 'n': lvl.icicles.push({ x: px + T / 2, y: py, state: 'hang', t: 0, vy: 0 }); ch = ' '; break;
          case 'R': lvl.boss = makeHeron(px + T / 2, py + T); ch = ' '; break;
          case 'H': lvl.hooks.push({ x: px + T / 2, y: py + T / 2, tx: x, ty: y }); ch = ' '; break;
          case '?': lvl.signs.push({ kind: 'post', x: px, y: py, text: '', show: 0, read: false }); ch = ' '; break;
          default: break;
        }
        lvl.tiles[y * w + x] = ch;
      }
    }
    lvl.flyTotal = lvl.flies.length;
    // Signposts take their text from the level's list, left to right.
    lvl.signs.filter((sg) => sg.kind === 'post').sort((a, b) => a.x - b.x || a.y - b.y)
      .forEach((sg, i) => { sg.text = (def.signs || [])[i] || ''; });
    for (const p of lvl.platforms) {
      if (p.axis === 'snail') p.stopX = escortStop !== null ? escortStop : p.startX;
    }
    // Top row of water in the level; used to shade deeper water darker.
    lvl.waterLine = h;
    for (let i = 0; i < lvl.tiles.length; i++) {
      if (isWaterTile(lvl.tiles[i])) { lvl.waterLine = Math.floor(i / w); break; }
    }
    findFakeWalls(lvl);
    // Mushroom caps: each horizontal run of 'M' is drawn as one cap and squishes when bounced on.
    lvl.caps = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (lvl.tiles[y * w + x] !== 'M' || (x > 0 && lvl.tiles[y * w + x - 1] === 'M')) continue;
        let x1 = x;
        while (x1 + 1 < w && lvl.tiles[y * w + x1 + 1] === 'M') x1++;
        lvl.caps.push({ tx0: x, tx1: x1, ty: y, squish: 0 });
      }
    }
    // Thin ice remembers how cracked it is, and refreezes a while after breaking.
    lvl.thinIce = new Map();
    lvl.tiles.forEach((t, i) => { if (t === 'i') lvl.thinIce.set(i, { crack: 0, broken: false, respawn: 0, creaked: false }); });
    placeCameo(lvl);
    return lvl;
  }

  function makeLily(px, py) {
    return { x: px + 6, y: py + 8, w: 20, h: 20, taken: false, phase: Math.random() * 6 };
  }

  // Group touching fake-wall tiles into regions that fade away together once the frog steps in.
  function findFakeWalls(lvl) {
    lvl.fakeRegionOf = new Int16Array(lvl.w * lvl.h).fill(-1);
    lvl.fakeRegions = [];
    for (let i = 0; i < lvl.tiles.length; i++) {
      if (lvl.tiles[i] !== 'F' || lvl.fakeRegionOf[i] >= 0) continue;
      const id = lvl.fakeRegions.length;
      lvl.fakeRegions.push({ alpha: 1, found: false });
      const stack = [i];
      lvl.fakeRegionOf[i] = id;
      while (stack.length) {
        const j = stack.pop();
        const x = j % lvl.w, y = Math.floor(j / lvl.w);
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= lvl.w || ny >= lvl.h) continue;
          const k = ny * lvl.w + nx;
          if (lvl.tiles[k] === 'F' && lvl.fakeRegionOf[k] < 0) {
            lvl.fakeRegionOf[k] = id;
            stack.push(k);
          }
        }
      }
    }
  }

  function levelHasLily(def) {
    return def.map.some((row) => row.includes('%') || row.includes('*'));
  }
  function lilyTotals() {
    const defs = [window.TUTORIAL, ...window.LEVELS].filter(levelHasLily);
    return { found: defs.filter((d) => foundLilies.has(d.name)).length, total: defs.length };
  }

  // ---------------------------------------------------------------------------
  // Pip & Mossback cameo: now and then the snails turn up at a random safe spot.
  // ---------------------------------------------------------------------------
  const CAMEO_CHANCE = 0.35;
  const CAMEO_GOAL_CHANCE = 0.3; // when they do appear, how often it's past the flag

  // A spot is 4 tiles of solid ground with 2 tiles of open air above (the duo is ~3 tiles wide).
  function isCameoGround(lvl, tx, ty) {
    const at = (x, y) => (x < 0 || x >= lvl.w || y < 0 || y >= lvl.h ? 'X' : lvl.tiles[y * lvl.w + x]);
    for (let dx = -1; dx <= 2; dx++) {
      if (at(tx + dx, ty) !== '#' && at(tx + dx, ty) !== 'B') return false;
      if (at(tx + dx, ty - 1) !== ' ' || at(tx + dx, ty - 2) !== ' ') return false;
    }
    return true;
  }

  function findCameoSpots(lvl) {
    // Keep clear of everything else in the level. Beetles patrol, so give them more room.
    const keepOut = [];
    const avoid = (x, y, r) => keepOut.push({ x, y, r });
    avoid(lvl.start.x, lvl.start.y, 10 * T);
    if (lvl.goal) avoid(lvl.goal.x, lvl.goal.y + lvl.goal.h, 5 * T);
    for (const f of lvl.flies) avoid(f.ax, f.ay, 2 * T);
    for (const e of lvl.enemies) avoid(e.x, e.y, (e.kind === 'beetle' ? 8 : 4) * T);
    for (const p of lvl.platforms) avoid(p.ox !== undefined ? p.ox : p.x, p.oy !== undefined ? p.oy : p.y, 5 * T);
    for (const c of lvl.checkpoints) avoid(c.x, c.y + c.h, 3 * T);
    for (const sign of lvl.signs) avoid(sign.x, sign.y, 4 * T);
    const spots = [];
    // Skip the top rows: ledges up there (like the lagoon's big rock) are out of the frog's reach.
    for (let ty = 5; ty < lvl.h; ty++) {
      for (let tx = 1; tx < lvl.w - 1; tx++) {
        if (!isCameoGround(lvl, tx, ty)) continue;
        const x = tx * T + T / 2, y = ty * T;
        const clear = keepOut.every((k) => Math.abs(k.x - x) > k.r || Math.abs(k.y - y) > 3 * T);
        if (clear) spots.push({ tx, ty });
      }
    }
    return spots;
  }

  function goalCameoSpot(lvl) {
    if (!lvl.goal) return null;
    const gx = Math.floor(lvl.goal.x / T), gy = Math.floor((lvl.goal.y + lvl.goal.h) / T);
    for (let tx = gx + 2; tx <= gx + 4; tx++) {
      if (isCameoGround(lvl, tx, gy)) return { tx, ty: gy };
    }
    return null;
  }

  function placeCameo(lvl) {
    if (lvl.platforms.some((p) => p.axis === 'snail')) return; // the escort ride is their big moment
    if (lvl.boss) return; // they turn up after the heron is beaten instead
    const mode = devRun ? devCameo : 'Random';
    if (mode === 'Never' || (mode === 'Random' && Math.random() >= CAMEO_CHANCE)) return;
    const lines = window.SNAIL_LINES || { anywhere: [], goal: [] };
    const goalSpot = goalCameoSpot(lvl);
    let spot = null, pool = lines.anywhere;
    if (goalSpot && Math.random() < CAMEO_GOAL_CHANCE) {
      spot = goalSpot;
      pool = lines.goal;
    } else {
      const spots = findCameoSpots(lvl);
      if (spots.length) spot = spots[Math.floor(Math.random() * spots.length)];
    }
    if (!spot || !pool.length) return;
    lvl.signs.push({
      kind: 'snail', x: spot.tx * T, y: (spot.ty - 1) * T,
      text: pool[Math.floor(Math.random() * pool.length)], show: 0, crawl: 0,
    });
  }

  function tileAt(tx, ty) {
    if (tx < 0 || tx >= level.w) return '#';
    if (ty < 0 || ty >= level.h) return ' ';
    return level.tiles[ty * level.w + tx];
  }
  const solidAt = (tx, ty) => SOLID.has(tileAt(tx, ty));
  const waterAtPx = (x, y) => isWaterTile(tileAt(Math.floor(x / T), Math.floor(y / T)));

  function makePlayer(x, y) {
    return {
      x, y, w: 24, h: 22,
      vx: 0, vy: 0, prevY: y,
      facing: 1,
      grounded: false,
      riding: null,
      onOneWay: false,
      dropTimer: 0,
      coyote: 0,
      jumpBuffer: 0,
      inWater: false,
      hearts: MAX_HEARTS,
      invuln: 0,
      stun: 0,
      squash: 1,
      blink: 0,
      walkAnim: 0,
      swimCooldown: 0,
      spawn: { x, y },
      fling: 0, // after letting go of a hook, keep swing momentum until landing
      glow: 0, // seconds of extra light left from eating fireflies
      tongueBuffer: 0, // a tongue press is remembered briefly if the tongue is busy
      lastHook: null, // the hook just let go of, which can't be re-grabbed straight away
      lastHookTimer: 0,
      tongue: { state: 'idle', len: 0, dir: 1, ax: 1, ay: 0, caught: null, cooldown: 0, hook: null, rope: 0 },
    };
  }

  function makeFly(x, y) {
    return { x, y, ax: x, ay: y, w: 14, h: 14, phase: Math.random() * 10, eaten: false, caught: false };
  }
  function makeBeetle(x, y) {
    return { kind: 'beetle', x, y, w: 26, h: 18, vx: -50, vy: 0, dir: -1, grounded: false, dead: false, squashed: 0, anim: Math.random() * 10 };
  }
  function makeWasp(x, y) {
    return { kind: 'wasp', x: x - 13, y: y - 10, w: 26, h: 20, ox: x - 13, oy: y - 10, dir: 1, t: Math.random() * 10, dead: false, squashed: 0 };
  }
  function makeFish(x, y) {
    return { kind: 'fish', x, y, w: 16, h: 26, homeY: y, vy: 0, wait: rand(0.5, 2), jumping: false, dead: false, squashed: 0 };
  }
  // ---------------------------------------------------------------------------
  // The heron (final boss). It stalks, aims (a clear tell), stabs where the frog was,
  // gets its beak stuck (the chance to stomp or tongue its head), and swoops across
  // the arena at ground height after being hit or every couple of stabs.
  // ---------------------------------------------------------------------------
  const HERON_BODY_UP = 86; // body centre above the ground when standing
  function makeHeron(x, groundY) {
    return {
      x, groundY, homeX: x, dir: -1, hp: 3, maxHp: 3,
      state: 'intro', t: 5, stabs: 0, target: null, walk: 0, // a few seconds to read the signpost first
      bodyY: groundY - HERON_BODY_UP, flash: 0, defeated: false, cried: false, swoopSide: 1, stuckFresh: 0, hurtHead: 0,
    };
  }
  function resetHeron(b) {
    Object.assign(b, makeHeron(b.homeX, b.groundY));
    b.t = 1.2;
    b.cried = true;
  }

  // Where the head and beak tip are, in world coordinates.
  function heronHead(b) {
    const stand = b.groundY - HERON_BODY_UP;
    const flying = b.state === 'takeoff' || b.state === 'warn' || b.state === 'swoop' || b.state === 'land' || b.state === 'defeated';
    if (flying) {
      const hx = b.x + b.dir * 44, hy = b.bodyY - 8;
      return { hx, hy, tipX: hx + b.dir * 34, tipY: hy + 4 };
    }
    const rest = { hx: b.x + b.dir * 28, hy: stand - 66 };
    const restTip = { x: rest.hx + b.dir * 32, y: rest.hy + 11 };
    if (b.state === 'aim') {
      const hx = b.x + b.dir * 8, hy = stand - 76;
      const dx = b.target.x - hx, dy = b.target.y - hy, d = Math.hypot(dx, dy) || 1;
      return { hx, hy, tipX: hx + dx / d * 34, tipY: hy + dy / d * 34 };
    }
    if (b.state === 'stab' || b.state === 'stuck' || (b.state === 'hurt' && b.hurtHead > 0)) {
      // Beak buried at the target; the head sits back along the beak.
      const dvx = b.dir * 0.35, dvy = 1, dl = Math.hypot(dvx, dvy);
      const stuckHead = { hx: b.target.x - dvx / dl * 34, hy: b.target.y - dvy / dl * 34 };
      if (b.state === 'stab') {
        const k = 1 - Math.max(0, b.t) / 0.12; // 0 → 1 over the thrust
        const from = { hx: b.x + b.dir * 8, hy: stand - 76 };
        const hx = from.hx + (stuckHead.hx - from.hx) * k, hy = from.hy + (stuckHead.hy - from.hy) * k;
        return { hx, hy, tipX: hx + dvx / dl * 34, tipY: hy + dvy / dl * 34 };
      }
      const wiggle = b.state === 'stuck' ? Math.sin(time * 30) * 1.5 : 0;
      return { hx: stuckHead.hx + wiggle, hy: stuckHead.hy, tipX: b.target.x, tipY: b.target.y };
    }
    return { hx: rest.hx, hy: rest.hy, tipX: restTip.x, tipY: restTip.y };
  }
  const heronHeadBox = (h) => ({ x: h.hx - 16, y: h.hy - 14, w: 32, h: 28 });

  function heronTakeoff(b) {
    b.state = 'takeoff';
    b.stabs = 0;
    sfx.whoosh(0);
  }

  function updateHeron(dt) {
    const b = level.boss;
    if (!b) return;
    b.flash = Math.max(0, b.flash - dt);
    b.hurtHead = Math.max(0, b.hurtHead - dt);
    const pc = frogCenter(player);
    const phase = b.maxHp - b.hp; // 0, 1, 2: faster and fiercer as it's hurt
    const stand = b.groundY - HERON_BODY_UP;
    const faceFrog = () => { if ((pc.x - b.x) * b.dir < -12) b.dir *= -1; };
    switch (b.state) {
      case 'intro':
        faceFrog();
        b.t -= dt;
        // Walking away from the signpost means the frog is ready: start soon.
        if (pc.x > 9 * T && b.t > 1) b.t = 1;
        if (!b.cried && b.t < 4.4) { b.cried = true; sfx.squawk(); }
        if (b.t <= 0) { b.state = 'stalk'; b.t = rand(1, 1.6); }
        break;
      case 'stalk': {
        faceFrog();
        const dx = pc.x - b.x, dist = Math.abs(dx);
        // Stride quickly toward a distant frog, then stalk slowly once close.
        const speed = dist > 220 ? 170 : 70 + phase * 30;
        if (dist > 115) { b.x += Math.sign(dx) * speed * dt; b.walk += dt * 7; }
        else if (dist < 45) { b.x -= Math.sign(dx) * 60 * dt; b.walk += dt * 7; }
        b.x = clamp(b.x, 2 * T, level.pw - 2 * T);
        b.t -= dt;
        if (b.t <= 0 && dist < 145) {
          b.state = 'aim';
          b.t = [0.75, 0.65, 0.55][phase];
          b.target = {
            x: clamp(pc.x, Math.min(b.x + b.dir * 30, b.x + b.dir * 140), Math.max(b.x + b.dir * 30, b.x + b.dir * 140)),
            y: Math.min(player.y + player.h, b.groundY),
          };
          sfx.rattle();
        } else if (b.t <= -5) {
          heronTakeoff(b); // the frog is keeping its distance: come to it from the air
        }
        break;
      }
      case 'aim':
        b.t -= dt;
        if (b.t <= 0) { b.state = 'stab'; b.t = 0.12; }
        break;
      case 'stab':
        b.t -= dt;
        if (b.t <= 0) {
          b.state = 'stuck';
          b.t = [1.5, 1.3, 1.1][phase];
          b.stuckFresh = 0.15;
          b.stabs++;
          sfx.thunk();
          shake = 3;
          burst(b.target.x, b.target.y, 10, '#6b4f36', { speed: 140, vy: -120, life: 0.5 });
        }
        break;
      case 'stuck':
        b.t -= dt;
        b.stuckFresh -= dt;
        if (b.t <= 0) { b.state = 'recover'; b.t = 0.35; }
        break;
      case 'recover':
        b.t -= dt;
        if (b.t <= 0) {
          if (b.stabs >= (phase >= 2 ? 3 : 2)) heronTakeoff(b);
          else { b.state = 'stalk'; b.t = phase >= 2 ? rand(0.2, 0.5) : rand(0.8, 1.5); }
        }
        break;
      case 'hurt':
        b.t -= dt;
        if (b.t <= 0) {
          if (b.hp <= 0) {
            b.defeated = true;
            b.state = 'defeated';
            b.t = 2.2;
            sfx.squawk();
            addScore(2000, b.x, stand - 120);
            popup(b.x, stand - 150, 'The heron flees!', '#ffe066', 2);
          } else heronTakeoff(b);
        }
        break;
      case 'takeoff':
        b.bodyY -= 420 * dt;
        b.x += b.dir * 60 * dt;
        if (b.bodyY < -90) {
          // Swoop in from the side farther from the frog, with a warning first.
          b.swoopSide = pc.x < level.pw / 2 ? 1 : -1;
          b.x = b.swoopSide > 0 ? level.pw + 90 : -90;
          b.dir = -b.swoopSide;
          b.bodyY = b.groundY - 24;
          b.state = 'warn';
          b.t = 0.8;
          sfx.whoosh(b.swoopSide * 0.7);
        }
        break;
      case 'warn':
        b.t -= dt;
        if (b.t <= 0) { b.state = 'swoop'; sfx.squawk(); }
        break;
      case 'swoop':
        b.x += b.dir * [520, 580, 650][phase] * dt;
        if (b.x < -120 || b.x > level.pw + 120) {
          // Glide back down on the side away from the frog.
          b.x = pc.x < level.pw / 2 ? level.pw - 4 * T : 4 * T;
          b.bodyY = -90;
          b.dir = pc.x < b.x ? -1 : 1;
          b.state = 'land';
        }
        break;
      case 'land':
        b.bodyY += 380 * dt;
        if (b.bodyY >= stand) {
          b.bodyY = stand;
          b.state = 'stalk';
          b.t = rand(0.8, 1.4);
          dust(b.x, b.groundY, 8);
        }
        break;
      case 'defeated':
        b.bodyY -= 200 * dt;
        b.x -= 150 * dt;
        b.dir = -1;
        b.t -= dt;
        if (b.t <= 0 && !level.goal) {
          // The way home appears, and some familiar faces come to cheer.
          level.goal = { x: Math.round(level.w / 2) * T + 4, y: b.groundY - 96, w: 24, h: 96 };
          burst(level.goal.x + 12, b.groundY - 40, 24, '#ffe066', { speed: 200, life: 1 });
          level.signs.push({ kind: 'snail', x: 6 * T, y: b.groundY - T, text: "Pip: You did it! The heron's gone and the pond is safe!", show: 0, crawl: 0 });
          sfx.checkpoint();
        }
        break;
    }
  }

  function hitHeron(b) {
    if (b.state !== 'stuck') return;
    b.hp--;
    b.state = 'hurt';
    b.t = 0.8;
    b.flash = 0.8;
    b.hurtHead = 0.25;
    shake = 6;
    sfx.squawk();
    const h = heronHead(b);
    burst(h.hx, h.hy, 14, '#dfe7ee', { speed: 180, life: 0.8, grav: 300 });
    addScore(500, h.hx, h.hy - 20);
    if (b.hp > 0) popup(h.hx, h.hy - 40, 'Hit!', '#ffe066');
  }

  function makeSquirrel(x, y) {
    return { kind: 'squirrel', x, y, w: 24, h: 22, dir: -1, throwTimer: rand(1, 2), throwing: 0, dead: false, squashed: 0 };
  }
  function makeSwimmer(x, y) {
    return { kind: 'swimmer', x, y, w: 24, h: 16, ox: x, oy: y, dir: Math.random() < 0.5 ? -1 : 1, t: Math.random() * 10, dead: false, squashed: 0 };
  }
  function makeLilyPad(px, py, tx) {
    const x = px - 8, y = py + 4;
    return {
      axis: 'pad', x, y, w: T + 16, h: 8,
      ox: x, oy: y, dip: 0,
      phase: tx * 1.7,
      notch: [0.4, 2.3, 3.6, 5.3][tx % 4],
      flower: hash(tx, 7) % 3 === 0,
      dx: 0, dy: 0, prevY: y,
    };
  }
  // Mossback, carrying Pip, as a rideable platform. baseX is the centre of his shell's
  // footprint; the platform rect is the top of his shell.
  function makeEscort(px, py) {
    const e = {
      axis: 'snail',
      baseX: px + T / 2, startX: px + T / 2, groundY: py + T,
      x: 0, y: 0, w: 44, h: 10, dx: 0, dy: 0, prevY: 0,
      started: false, done: false, moving: false, anim: 0, spawnTimer: 1.2, spawnSide: 1, stopX: null,
    };
    syncEscortRect(e);
    e.prevY = e.y;
    return e;
  }
  function syncEscortRect(e) {
    const s = ESCORT_SCALE;
    const shellX = e.baseX - 4 * s, shellTop = e.groundY - 33 * s;
    e.x = shellX - 25;
    e.y = shellTop + 1;
  }
  function makePlatform(x, y, axis) {
    const p = {
      axis, x, y, w: T * 3, h: 16,
      ox: x, oy: y,
      range: axis === 'h' ? T * 2 : T * 2.5,
      speed: axis === 'h' ? 1.4 : 1.1,
      phase: (x / T) * 0.7,
      dx: 0, dy: 0, prevY: y,
    };
    return p;
  }

  function enterLevel(def) {
    level = parseLevel(def);
    player = makePlayer(level.start.x, level.start.y);
    levelStartScore = score;
    particles = [];
    popups = [];
    banner = 3;
    snapCamera();
    state = 'playing';
  }

  function loadLevel(i) {
    levelIndex = i;
    inTutorial = false;
    enterLevel(window.LEVELS[i]);
    saveRun();
  }

  // Remembers where the run is, so closing the game doesn't lose it. Dev runs and the
  // tutorial leave the saved run alone.
  function saveRun() {
    if (devRun || inTutorial) return;
    savedRun = {
      level: levelIndex,
      name: level.name,
      score: levelStartScore, // flies before the checkpoint come back, so their points do too
      lives,
      checkpoint: level.checkpoints.findIndex((c) => c.active),
      time: level.time,
    };
    writeRun(savedRun);
  }
  // Saves the run as about to start level i (after a level's tally), or ends it past the last level.
  function setRunAt(i) {
    if (i >= window.LEVELS.length) { endRun(); return; }
    if (devRun) return;
    savedRun = { level: i, name: window.LEVELS[i].name, score, lives, checkpoint: -1, time: 0 };
    writeRun(savedRun);
  }
  function endRun() {
    if (devRun) return;
    savedRun = null;
    writeRun(null);
  }

  const checkpointSpawn = (c, p) => ({ x: c.x - 4, y: c.y + c.h - p.h });

  function continueRun() {
    const run = savedRun;
    score = run.score;
    lives = run.lives;
    levelIndex = run.level;
    inTutorial = false;
    enterLevel(window.LEVELS[run.level]);
    const c = level.checkpoints[run.checkpoint];
    if (c) {
      c.active = true;
      const spawn = checkpointSpawn(c, player);
      player = makePlayer(spawn.x, spawn.y);
      snapCamera();
    }
    level.time = run.time || 0;
    saveRun();
    sfx.croak();
  }

  function startGame() {
    score = 0;
    lives = START_LIVES;
    loadLevel(0);
    sfx.croak();
  }

  function startTutorial() {
    inTutorial = true;
    score = 0;
    lives = START_LIVES;
    enterLevel(window.TUTORIAL);
    sfx.croak();
  }

  function restartLevel() {
    score = levelStartScore;
    if (inTutorial) enterLevel(window.TUTORIAL);
    else loadLevel(levelIndex);
  }

  function goToTitle() {
    justUnlocked = false;
    state = 'title';
    menuIndex = titleDefault();
  }

  function quitToTitle() {
    if (!inTutorial) recordHighScore();
    sfx.select();
    goToTitle();
  }

  function menuNav(count) {
    if (tapped('menuUp')) { menuIndex = (menuIndex + count - 1) % count; sfx.select(); }
    if (tapped('menuDown')) { menuIndex = (menuIndex + 1) % count; sfx.select(); }
  }

  function respawn() {
    const spawn = player.spawn;
    const fresh = makePlayer(spawn.x, spawn.y);
    fresh.spawn = spawn;
    fresh.invuln = 1.5;
    player = fresh;
    for (const p of level.platforms) {
      if (p.axis === 'snail' && !p.done) {
        p.baseX = p.startX;
        p.started = false;
        syncEscortRect(p);
        p.prevY = p.y;
      }
    }
    level.enemies = level.enemies.filter((e) => !e.diver);
    if (level.boss && !level.boss.defeated) resetHeron(level.boss); // the fight starts over
    snapCamera();
    state = 'playing';
  }

  // ---------------------------------------------------------------------------
  // Physics helpers (tile collision)
  // ---------------------------------------------------------------------------
  // `fakeIsWall` makes fake walls block too (used for the frog while it's in the air).
  function moveX(b, dx, fakeIsWall = false) {
    b.x += dx;
    const top = Math.floor(b.y / T);
    const bot = Math.floor((b.y + b.h - 0.01) / T);
    const blocks = (tx, ty) => solidAt(tx, ty) || (fakeIsWall && tileAt(tx, ty) === 'F');
    if (dx > 0) {
      const tx = Math.floor((b.x + b.w - 0.01) / T);
      for (let ty = top; ty <= bot; ty++) {
        if (blocks(tx, ty)) { b.x = tx * T - b.w; b.vx = 0; return true; }
      }
    } else if (dx < 0) {
      const tx = Math.floor(b.x / T);
      for (let ty = top; ty <= bot; ty++) {
        if (blocks(tx, ty)) { b.x = (tx + 1) * T; b.vx = 0; return true; }
      }
    }
    return false;
  }

  function overlapsFakeWall(b) {
    for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 0.01) / T); ty++) {
      for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.01) / T); tx++) {
        if (tileAt(tx, ty) === 'F') return true;
      }
    }
    return false;
  }

  // Returns 'down' on landing, 'up' on bonking a ceiling, else null.
  function moveY(b, dy, oneWay) {
    const prevBottom = b.y + b.h;
    b.y += dy;
    const l = Math.floor(b.x / T);
    const r = Math.floor((b.x + b.w - 0.01) / T);
    if (dy > 0) {
      const ty = Math.floor((b.y + b.h - 0.01) / T);
      for (let tx = l; tx <= r; tx++) {
        const t = tileAt(tx, ty);
        const plank = oneWay && t === '-' && prevBottom <= ty * T + 0.5;
        if (SOLID.has(t) || plank) {
          b.y = ty * T - b.h;
          b.vy = 0;
          b.onOneWay = plank;
          return 'down';
        }
      }
    } else if (dy < 0) {
      const ty = Math.floor(b.y / T);
      for (let tx = l; tx <= r; tx++) {
        if (solidAt(tx, ty)) { b.y = (ty + 1) * T; b.vy = 0; return 'up'; }
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  function burst(x, y, n, color, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(opts.minSpeed || 40, opts.speed || 180);
      particles.push({
        x, y,
        vx: Math.cos(a) * s + (opts.vx || 0),
        vy: Math.sin(a) * s + (opts.vy || 0),
        life: rand(0.35, opts.life || 0.7),
        max: opts.life || 0.7,
        size: rand(2, opts.size || 4),
        color,
        grav: opts.grav === undefined ? 600 : opts.grav,
      });
    }
  }
  function dust(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + rand(-8, 8), y,
        vx: rand(-70, 70), vy: rand(-60, -10),
        life: rand(0.25, 0.45), max: 0.45, size: rand(2, 4),
        color: 'rgba(235, 225, 200, 0.9)', grav: 120,
      });
    }
  }
  function bubble(x, y) {
    particles.push({
      x, y,
      vx: rand(-12, 12), vy: rand(-45, -20),
      life: 3, max: 3, size: rand(1.5, 3.5),
      color: 'rgba(235, 250, 255, 0.9)', grav: -50, bubble: true,
    });
  }
  // How loud, and from which side, a sound at (x, y) should be heard from the frog:
  // full volume within `near` pixels, fading to silence at `far` (about a screen away by default).
  function hearing(x, y, near = 160, far = 720) {
    if (!player) return { vol: 1, pan: 0 };
    const dx = x - (player.x + player.w / 2), dy = y - (player.y + player.h / 2);
    const fade = clamp((Math.hypot(dx, dy) - near) / (far - near), 0, 1);
    return { vol: (1 - fade) * (1 - fade), pan: clamp(dx / 500, -0.7, 0.7) };
  }

  // True once the frog's head is below the visible water surface (drawn a little
  // below the top of the surface tile). `margin` adds a few pixels of hysteresis so
  // paddling right at the surface doesn't flip the sound back and forth.
  function headUnderwater(p, margin = 0) {
    const hx = p.x + p.w / 2, hy = p.y + 6;
    if (!waterAtPx(hx, hy)) return false;
    const ty = Math.floor(hy / T);
    const surfaceTile = !isWaterTile(tileAt(Math.floor(hx / T), ty - 1)) && !solidAt(Math.floor(hx / T), ty - 1);
    return !surfaceTile || hy > ty * T + 9 + margin;
  }

  function splash(x, y) {
    const { vol, pan } = hearing(x, y);
    if (vol > 0.02) sfx.splash(vol, pan);
    burst(x, y, 14, 'rgba(210, 240, 255, 0.95)', { vy: -160, speed: 150, grav: 900, life: 0.6 });
  }
  function popup(x, y, text, color = '#fff', life = 0.9) {
    popups.push({ x, y, text, color, life });
  }
  function addScore(v, x, y) {
    score += v;
    if (x !== undefined) popup(x, y, '+' + v);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function update(dt) {
    time += dt;
    if (tapped('mute')) audio.muted = !audio.muted;

    switch (state) {
      case 'title':
        cam.x = (time * 60) % 2000;
        menuNav(titleItems().length);
        if (tapped('dev')) {
          state = 'dev';
          menuIndex = 1;
          sfx.select();
        } else if (tapped('confirm')) {
          devRun = false;
          titleMenu()[menuIndex].go();
        }
        break;

      case 'select': {
        cam.x = (time * 60) % 2000;
        menuNav(selectItems().length);
        if (tapped('pause') || tapped('back')) {
          sfx.select();
          goToTitle();
        } else if (tapped('confirm')) {
          devRun = false;
          if (menuIndex === 0) startTutorial();
          else {
            // A normal run starting from the chosen level; it carries on to the levels after it.
            score = 0;
            lives = START_LIVES;
            loadLevel(menuIndex - 1);
            sfx.croak();
          }
        }
        break;
      }

      case 'dev': {
        cam.x = (time * 60) % 2000;
        const items = devItems();
        menuNav(items.length);
        if (tapped('pause') || tapped('dev')) {
          sfx.select();
          goToTitle();
        } else if (tapped('confirm')) {
          if (menuIndex === DEV_LEVEL_COUNT()) {
            devInvincible = !devInvincible;
            sfx.select();
          } else if (menuIndex === DEV_LEVEL_COUNT() + 1) {
            devCameo = CAMEO_MODES[(CAMEO_MODES.indexOf(devCameo) + 1) % CAMEO_MODES.length];
            sfx.select();
          } else if (menuIndex === DEV_LEVEL_COUNT() + 2) {
            const names = [null, ...Object.keys(window.SONGS || {})];
            devSong = names[(names.indexOf(devSong) + 1) % names.length];
            sfx.select();
          } else {
            devRun = true; // set first so the level's cameo roll uses the dev setting
            if (menuIndex === 0) startTutorial();
            else {
              score = 0;
              lives = START_LIVES;
              loadLevel(menuIndex - 1);
              sfx.croak();
            }
          }
        }
        break;
      }

      case 'playing':
        if (tapped('pause')) { state = 'paused'; menuIndex = 0; sfx.select(); break; }
        if (tapped('restart')) { restartLevel(); break; }
        updateWorld(dt);
        break;

      case 'paused':
        menuNav(pauseItems().length);
        if (tapped('pause') || tapped('back')) {
          state = 'playing';
          sfx.select();
        } else if (tapped('quit')) {
          quitToTitle();
        } else if (tapped('restart')) {
          restartLevel();
        } else if (tapped('confirm')) {
          if (menuIndex === 0) { state = 'playing'; sfx.select(); }
          else if (menuIndex === 1) restartLevel();
          else if (menuIndex === 2) { audio.muted = !audio.muted; sfx.select(); }
          else if (menuIndex === 3) { musicOn = !musicOn; saveNumber(MUSIC_OFF_KEY, musicOn ? 0 : 1); sfx.select(); }
          else quitToTitle();
        }
        break;

      case 'dying':
        stateTimer -= dt;
        player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);
        player.y += player.vy * dt;
        updateCritters(dt);
        if (stateTimer <= 0) {
          if (lives <= 0) {
            state = 'gameover';
            stateTimer = 0.8;
            recordHighScore();
          } else {
            respawn();
          }
        }
        break;

      case 'complete':
        stateTimer -= dt;
        // Happy victory hops while the tally is shown.
        player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);
        player.grounded = moveY(player, player.vy * dt, true) === 'down';
        if (player.grounded && Math.random() < 0.04) player.vy = -380;
        updateCritters(dt);
        if (Math.random() < 0.15) {
          const g = level.goal;
          burst(g.x + rand(0, 40), g.y + rand(0, 20), 1, ['#ffd54f', '#ff8ab3', '#fff'][Math.floor(rand(0, 3))], { grav: 100, speed: 80 });
        }
        if (stateTimer <= 0 && (tapped('pause') || tapped('quit'))) {
          quitToTitle();
        } else if (stateTimer <= 0 && tapped('confirm')) {
          sfx.select();
          if (inTutorial) {
            startGame();
          } else if (levelIndex + 1 < window.LEVELS.length) {
            loadLevel(levelIndex + 1);
          } else {
            state = 'victory';
            stateTimer = 0.8;
            recordHighScore();
            if (!devRun && !gameCompleted) {
              gameCompleted = true;
              justUnlocked = true;
              saveNumber(COMPLETED_KEY, 1);
            }
          }
        }
        break;

      case 'gameover':
      case 'victory':
        stateTimer -= dt;
        if (stateTimer <= 0 && tapped('confirm')) { sfx.select(); goToTitle(); }
        break;
    }

    ambient.update(dt);
    ambience.update(dt);
    music.update();
    // Muffle all sound while the frog's head is underwater (only during play, so menus stay clear).
    const playingNow = state === 'playing' || state === 'dying';
    audio.setMuffled(playingNow && !!player && headUnderwater(player, audio.muffled ? -3 : 3));

    // The on-screen pause button only makes sense mid-level.
    const inLevel = state === 'playing';
    if (touchMode && document.body.classList.contains('in-level') !== inLevel) {
      document.body.classList.toggle('in-level', inLevel);
    }

    updateParticles(dt);
    if (level && state !== 'title') updateCamera(dt);
    shake = Math.max(0, shake - dt * 30);
    banner = Math.max(0, banner - dt);
  }

  function recordHighScore() {
    if (devRun) return;
    if (score > highScore) {
      highScore = score;
      saveNumber(BEST_KEY, highScore);
    }
  }

  function updateWorld(dt) {
    level.time += dt;
    updatePlatforms(dt);
    updatePlayer(dt);
    updateTongue(dt);
    updateCritters(dt);
    updateEscort(dt);
    checkInteractions();
    updateSigns(dt);
    updateSecrets(dt);
    updateIce(dt);
    updateHeron(dt);
  }

  // Thin ice cracks while the frog stands on it, breaks into freezing water, and refreezes later.
  function updateIce(dt) {
    const p = player;
    for (const c of level.caps) c.squish = Math.max(0, c.squish - dt * 5);
    if (!level.thinIce.size) return;
    if (p.grounded) {
      const row = Math.floor((p.y + p.h + 2) / T);
      const seen = new Set();
      for (const x of [Math.floor((p.x + 3) / T), Math.floor((p.x + p.w - 3) / T)]) {
        const idx = row * level.w + x;
        const ice = level.thinIce.get(idx);
        if (!ice || ice.broken || seen.has(idx)) continue;
        seen.add(idx);
        ice.crack += dt;
        if (ice.crack > 0.3 && !ice.creaked) { ice.creaked = true; sfx.crack(); }
        if (ice.crack >= 0.6) {
          ice.broken = true;
          ice.respawn = 5;
          level.tiles[idx] = '~';
          sfx.iceBreak();
          burst(x * T + T / 2, row * T + 4, 12, 'rgba(225, 245, 255, 0.95)', { speed: 160, vy: -120, life: 0.6 });
        }
      }
    }
    for (const [idx, ice] of level.thinIce) {
      if (!ice.broken) continue;
      ice.respawn -= dt;
      const tx = idx % level.w, ty = Math.floor(idx / level.w);
      const tileBox = { x: tx * T, y: ty * T - 8, w: T, h: T + 8 };
      if (ice.respawn <= 0 && !overlap(p, tileBox)) {
        ice.broken = false;
        ice.crack = 0;
        ice.creaked = false;
        level.tiles[idx] = 'i';
      }
    }
  }

  function throwAcorn(sq, target) {
    const sx = sq.x + sq.w / 2 + sq.dir * 8, sy = sq.y + 4;
    const dx = target.x - sx, dy = target.y - sy;
    const t = clamp(Math.abs(dx) / 300, 0.6, 1.3); // flight time
    level.enemies.push({
      kind: 'acorn', x: sx - 5, y: sy - 5, w: 10, h: 10,
      vx: dx / t, vy: (dy - 0.5 * 900 * t * t) / t, life: 4, spin: 0, dead: false, squashed: 0,
    });
    const h = hearing(sx, sy, 160, 700);
    if (h.vol > 0.02) sfx.chitter(h.vol, h.pan);
  }

  function updateSecrets(dt) {
    const p = player;
    const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 1) / T);
    const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 1) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) continue;
        const id = level.fakeRegionOf[ty * level.w + tx];
        if (id >= 0 && !level.fakeRegions[id].found) {
          level.fakeRegions[id].found = true;
          [659, 784, 988, 1319].forEach((f, i) => audio.tone('sine', f, f, 0.12, 0.3, i * 0.07));
        }
      }
    }
    for (const r of level.fakeRegions) {
      r.alpha += ((r.found ? 0.28 : 1) - r.alpha) * Math.min(1, dt * 6);
    }
    for (const l of level.lilies) {
      if (l.taken) continue;
      l.phase += dt;
      if (overlap(p, l)) collectLily(l);
      else if (lilyVisible(l) && Math.random() < dt * 3) {
        burst(l.x + rand(0, l.w), l.y + rand(0, l.h), 1, '#fff3b0', { grav: -40, speed: 20, life: 0.8 });
      }
    }
  }

  function lilyVisible(l) {
    const tx = Math.floor((l.x + l.w / 2) / T), ty = Math.floor((l.y + l.h / 2) / T);
    const id = level.fakeRegionOf[ty * level.w + tx];
    return id < 0 || level.fakeRegions[id].found;
  }

  function collectLily(l) {
    l.taken = true;
    addScore(1000);
    popup(l.x + l.w / 2, l.y - 10, 'Golden lily! +1000', '#ffe066');
    burst(l.x + l.w / 2, l.y + l.h / 2, 24, '#ffd54f', { speed: 220, life: 0.9, grav: 200 });
    [784, 988, 1175, 1568].forEach((f, i) => audio.tone('triangle', f, f, 0.18, 0.4, i * 0.09));
    shake = 3;
    if (!devRun) {
      foundLilies.add(level.name);
      saveLilies(foundLilies);
    }
  }

  // While Mossback crawls, wasps dive at the frog from alternating sides.
  function updateEscort(dt) {
    for (const p of level.platforms) {
      if (p.axis !== 'snail' || !p.moving) continue;
      p.spawnTimer -= dt;
      if (p.spawnTimer > 0) continue;
      p.spawnTimer = 2.4;
      p.spawnSide *= -1;
      const x = p.spawnSide > 0 ? cam.x + W + 20 : cam.x - 46;
      level.enemies.push({
        kind: 'wasp', diver: true,
        x, y: player.y - rand(20, 70), w: 26, h: 20,
        vx: -p.spawnSide * 120, vy: 0, dir: -p.spawnSide,
        t: 0, life: 7, dead: false, squashed: 0,
      });
    }
  }

  function updateSigns(dt) {
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    for (const sign of level.signs) {
      let near;
      if (sign.kind === 'escort') {
        const e = sign.ref;
        sign.x = e.baseX - T / 2;
        sign.y = e.groundY - T;
        const line = escortLine(e);
        if (line && line !== sign.text) {
          sign.text = line;
          sign.lines = null;
        }
        near = !!line && Math.abs(px - e.baseX) < 170 && Math.abs(py - (e.groundY - 40)) < 170;
      } else {
        near = Math.abs(px - (sign.x + T / 2)) < 80 && Math.abs(py - (sign.y + T / 2)) < 100;
        // In a boss fight, signposts only speak before the fight starts, so they never cover the action.
        if (sign.kind === 'post' && level.boss && level.boss.state !== 'intro') near = false;
      }
      sign.show = clamp(sign.show + (near ? dt : -dt) * 5, 0, 1);
      if (near) sign.read = true;
      if (sign.kind === 'snail') sign.crawl = Math.min(24, sign.crawl + dt * 2);
    }
  }

  const ESCORT_CHATTER = [
    'Pip: Full speed ahead, Mossback!',
    'Pip: Wasps! Get them with your tongue!',
    'Pip: This is the fastest we have ever gone.',
    'Pip: Are we there yet?',
    'Pip: Mossback says you are very light for a frog.',
  ];
  function escortLine(e) {
    if (!e.started) return "Pip: Brambles ahead! Hop onto Mossback's shell and we'll carry you across.";
    if (e.done) return 'Pip: This is where we get off. Good luck, little frog!';
    if (player.riding !== e) return "Pip: Hop back on! Mossback won't budge without you.";
    // Chat for a few seconds, then pause, so the bubble isn't always up.
    if (level.time % 6 > 3) return '';
    return ESCORT_CHATTER[Math.floor(level.time / 6) % ESCORT_CHATTER.length];
  }

  function updatePlatforms(dt) {
    for (const p of level.platforms) {
      if (p.axis === 'snail') {
        // Mossback only crawls while the frog is riding him.
        if (player.riding === p) p.started = true;
        p.moving = player.riding === p && !p.done;
        if (p.moving) {
          p.baseX = Math.min(p.stopX, p.baseX + ESCORT_SPEED * dt);
          p.anim += dt;
          if (p.baseX >= p.stopX) {
            p.done = true;
            p.moving = false;
            sfx.checkpoint();
          }
        }
        const oldX = p.x;
        p.prevY = p.y;
        syncEscortRect(p);
        p.dx = p.x - oldX;
        p.dy = 0;
        continue;
      }
      if (p.axis === 'pad') {
        // Lily pads bob on the surface and dip under the frog's weight.
        p.dip += ((player.riding === p ? 5 : 0) - p.dip) * Math.min(1, dt * 10);
        const ny = p.oy + Math.sin(level.time * 2 + p.phase) * 1.5 + p.dip;
        p.dx = 0;
        p.dy = ny - p.y;
        p.prevY = p.y;
        p.y = ny;
        continue;
      }
      const nx = p.axis === 'h' ? p.ox + Math.sin(level.time * p.speed + p.phase) * p.range : p.ox;
      const ny = p.axis === 'v' ? p.oy + Math.sin(level.time * p.speed + p.phase) * p.range : p.oy;
      p.dx = nx - p.x;
      p.dy = ny - p.y;
      p.prevY = p.y;
      p.x = nx;
      p.y = ny;
    }
  }

  function updatePlayer(dt) {
    const p = player;
    p.prevY = p.y;
    p.invuln = Math.max(0, p.invuln - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.dropTimer = Math.max(0, p.dropTimer - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.coyote = Math.max(0, p.coyote - dt);
    p.squash += (1 - p.squash) * Math.min(1, dt * 12);
    p.blink = p.blink > 0 ? p.blink - dt : (Math.random() < 0.004 ? 0.12 : 0);

    p.fling = p.grounded ? 0 : Math.max(0, p.fling - dt);
    p.glow = Math.max(0, p.glow - dt);
    p.lastHookTimer = Math.max(0, p.lastHookTimer - dt);
    p.tongueBuffer = tapped('tongue') ? 0.2 : Math.max(0, p.tongueBuffer - dt);
    // The hook a press would grab. While swinging, this is the next hook, lit up to show it's in reach.
    const ts = p.tongue.state;
    level.targetHook = ts === 'idle' || ts === 'back' || ts === 'swing' ? findHook(p, ts === 'swing' ? p.tongue.hook : null) : null;

    if (p.tongue.state === 'swing') {
      updateSwing(p, dt);
    } else {
      updateWalkSwim(p, dt);
    }

    // Thorns
    const l = Math.floor((p.x + 4) / T), r = Math.floor((p.x + p.w - 4) / T);
    const t0 = Math.floor(p.y / T), t1 = Math.floor((p.y + p.h - 1) / T);
    for (let ty = t0; ty <= t1; ty++) {
      for (let tx = l; tx <= r; tx++) {
        const hz = tileAt(tx, ty);
        if ((hz === '^' || hz === 'u') && p.y + p.h > ty * T + 14) {
          hurtPlayer(tx * T + T / 2, true);
        }
      }
    }

    // Freezing water: every dip costs a heart and pops the frog back up.
    if (level.theme.cold && p.inWater && state === 'playing') {
      if (p.invuln <= 0 && !(devRun && devInvincible)) popup(p.x + p.w / 2, p.y - 12, 'Brrr!', '#cfe8ff');
      hurtPlayer(p.x + p.w / 2 - p.facing * 20, true);
    }

    // Fell out of the world
    if (p.y > level.ph + 80) killPlayer(true);

    // Tongue: aim at a hook if one is in reach, otherwise flick straight ahead.
    const tg = p.tongue;
    tg.cooldown = Math.max(0, tg.cooldown - dt);
    // A retracting tongue can go straight for another hook, so swings chain smoothly.
    const ready = (tg.state === 'idle' && tg.cooldown <= 0) || (tg.state === 'back' && !tg.caught && level.targetHook);
    // Holding the tongue button grabs the next hook as soon as one comes into reach.
    const holdingForHook = held('tongue') && level.targetHook && !p.inWater;
    if ((p.tongueBuffer > 0 || holdingForHook) && ready && p.stun <= 0) {
      p.tongueBuffer = 0;
      tg.len = 0;
      tg.caught = null;
      tg.bounced = false;
      tg.hitBoss = false;
      const hook = level.targetHook;
      if (hook && !p.inWater) {
        tg.state = 'reach';
        tg.hook = hook;
        // Turn to face a hook that's clearly off to one side.
        const side = hook.x - (p.x + p.w / 2);
        if (Math.abs(side) > 16) p.facing = Math.sign(side);
        aimTongueAt(p, hook);
      } else {
        tg.state = 'out';
        tg.hook = null;
        tg.dir = p.facing;
        tg.ax = p.facing;
        tg.ay = 0;
      }
      sfx.tongue();
    }
  }

  // --- Hooks & swinging ------------------------------------------------------
  function frogCenter(p) {
    return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
  }

  // The nearest hook above the frog, in front of it (or nearly overhead), with a clear line.
  // The best hook above the frog within reach and with a clear line. Hooks ahead are
  // preferred, but one just flown past still counts (except the one just let go of).
  function findHook(p, exclude) {
    const c = frogCenter(p);
    let best = null, bestScore = Infinity;
    for (const h of level.hooks) {
      if (h === exclude || (h === p.lastHook && p.lastHookTimer > 0)) continue;
      const dx = h.x - c.x, dy = h.y - c.y;
      if (dy > -12) continue;
      const d = Math.hypot(dx, dy);
      if (d > GRAPPLE_RANGE || !clearLine(c.x, c.y, h.x, h.y)) continue;
      const score = d + (dx * p.facing < -28 ? 70 : 0);
      if (score < bestScore) {
        best = h;
        bestScore = score;
      }
    }
    return best;
  }

  function clearLine(x0, y0, x1, y1) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (solidAt(Math.floor((x0 + (x1 - x0) * t) / T), Math.floor((y0 + (y1 - y0) * t) / T))) return false;
    }
    return true;
  }

  function aimTongueAt(p, hook) {
    const tg = p.tongue;
    // The tongue always leaves from the front of the mouth, whichever way the frog faces.
    // (Following the hook's side instead made it flicker between both sides when right below.)
    tg.dir = p.facing;
    const m = mouthPos(p);
    const dx = hook.x - m.x, dy = hook.y - m.y;
    const d = Math.hypot(dx, dy) || 1;
    tg.ax = dx / d;
    tg.ay = dy / d;
    return d;
  }

  function attachGrapple(p) {
    const tg = p.tongue;
    const c = frogCenter(p);
    tg.state = 'swing';
    tg.rope = clamp(Math.hypot(c.x - tg.hook.x, c.y - tg.hook.y), 40, GRAPPLE_RANGE);
    p.grounded = false;
    p.riding = null;
    p.coyote = 0;
    p.fling = 0;
    audio.tone('triangle', 520, 880, 0.08, 0.35);
  }

  function releaseGrapple(p, jumped) {
    const tg = p.tongue;
    if (tg.state !== 'swing' && tg.state !== 'reach') return;
    const wasSwinging = tg.state === 'swing' && !p.grounded;
    p.lastHook = tg.hook;
    p.lastHookTimer = 0.35;
    tg.state = 'back';
    tg.hook = null;
    p.fling = 1.5;
    if (wasSwinging && p.vy < 0) {
      // A little extra fling when letting go on the upswing.
      p.vx *= 1.15;
      p.vy -= 120;
    }
    if (jumped) {
      p.vy = p.grounded ? -JUMP_SPEED : Math.min(p.vy - 250, -520);
      p.squash = 0.7;
      sfx.jump();
    }
  }

  // Pendulum physics: gravity plus left/right pumping, with the tongue as a rope.
  function updateSwing(p, dt) {
    const tg = p.tongue, hook = tg.hook;
    const move = p.stun > 0 ? 0 : (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
    if (p.grounded) {
      // Standing with slack rope: walk normally until running off an edge starts the swing.
      const target = move * RUN_SPEED;
      p.vx += clamp(target - p.vx, -2600 * dt, 2600 * dt);
    } else {
      // Reel in, then pump: pushing ← → accelerates along the arc (not near the top).
      tg.rope = Math.max(ROPE_LENGTH, tg.rope - 260 * dt);
      const ox = p.x + p.w / 2 - hook.x, oy = p.y + p.h / 2 - hook.y;
      const od = Math.hypot(ox, oy) || 1;
      if (move && oy > -od * 0.3) {
        let tx = -oy / od, ty = ox / od;
        if (tx * move < 0) { tx = -tx; ty = -ty; }
        p.vx += tx * 1000 * dt;
        p.vy += ty * 1000 * dt;
      }
    }
    p.vy += GRAVITY * dt;
    let cx = p.x + p.w / 2 + p.vx * dt;
    let cy = p.y + p.h / 2 + p.vy * dt;
    const dx = cx - hook.x, dy = cy - hook.y;
    const d = Math.hypot(dx, dy);
    if (d > tg.rope) {
      const nx = dx / d, ny = dy / d;
      cx = hook.x + nx * tg.rope;
      cy = hook.y + ny * tg.rope;
      const outward = p.vx * nx + p.vy * ny;
      if (outward > 0) { p.vx -= outward * nx; p.vy -= outward * ny; }
    }
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 760) { p.vx *= 760 / speed; p.vy *= 760 / speed; }
    moveX(p, cx - p.w / 2 - p.x);
    p.grounded = moveY(p, cy - p.h / 2 - p.y, true) === 'down';
    p.riding = null;
    if (move) p.facing = move;
    else if (Math.abs(p.vx) > 40) p.facing = Math.sign(p.vx);
    p.walkAnim += dt * (p.grounded ? Math.abs(p.vx) / 18 : 6);

    p.inWater = waterAtPx(p.x + p.w / 2, p.y + p.h / 2);
    if (tapped('jump')) {
      releaseGrapple(p, true);
    } else if (!held('tongue') || p.inWater) {
      releaseGrapple(p, false);
    }
  }

  function updateWalkSwim(p, dt) {
    // Carry the frog along with whatever log it is standing on.
    if (p.riding) {
      moveX(p, p.riding.dx);
      p.y = p.riding.y - p.h;
    }

    const wasInWater = p.inWater;
    p.inWater = waterAtPx(p.x + p.w / 2, p.y + p.h / 2);
    if (p.inWater !== wasInWater) splash(p.x + p.w / 2, p.y + p.h / 2);

    // Horizontal movement
    const move = p.stun > 0 ? 0 : (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
    // On ice the frog speeds up and slows down slowly (and can go a bit faster).
    const footRow = Math.floor((p.y + p.h + 2) / T);
    const onIce = p.grounded && !p.riding &&
      (isIce(tileAt(Math.floor((p.x + 3) / T), footRow)) || isIce(tileAt(Math.floor((p.x + p.w - 3) / T), footRow)));
    let maxSpeed = p.inWater ? 150 : onIce ? RUN_SPEED * 1.2 : RUN_SPEED;
    if (p.fling > 0 && !p.inWater) maxSpeed = Math.max(maxSpeed, Math.min(Math.abs(p.vx), 560));
    const accel = p.grounded ? (onIce ? 650 : 2600) : 1700;
    if (move !== 0) {
      p.vx += move * accel * dt;
      if (p.tongue.state === 'idle') p.facing = move;
    } else {
      const friction = p.grounded ? (onIce ? 160 : 2800) : p.fling > 0 ? 120 : 700;
      p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), friction * dt);
    }
    p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
    if (p.grounded && Math.abs(p.vx) > 20) p.walkAnim += dt * Math.abs(p.vx) / 18;

    // Jumping / swimming
    if (tapped('jump') && p.stun <= 0) p.jumpBuffer = JUMP_BUFFER;

    if (p.jumpBuffer > 0 && held('down') && p.grounded && p.onOneWay) {
      p.dropTimer = 0.25;
      p.jumpBuffer = 0;
      p.grounded = false;
      p.riding = null;
    }

    p.swimCooldown = Math.max(0, p.swimCooldown - dt);
    if (p.inWater) {
      // Tap to paddle, or hold jump to keep paddling.
      if (p.jumpBuffer > 0 || (held('jump') && p.swimCooldown <= 0 && p.stun <= 0)) {
        const nearSurface = !waterAtPx(p.x + p.w / 2, p.y - 10);
        p.vy = nearSurface ? -600 : -340;
        p.jumpBuffer = 0;
        p.swimCooldown = 0.32;
        p.squash = 0.8;
        sfx.swim();
        for (let i = 0; i < 3; i++) bubble(p.x + p.w / 2 + rand(-6, 6), p.y + p.h);
      }
      const diving = held('down') && p.stun <= 0;
      p.vy += GRAVITY * (diving ? 0.6 : 0.28) * dt;
      p.vy = Math.min(p.vy, diving ? 240 : 110);
      if (Math.random() < dt * 1.2 && waterAtPx(p.x + p.w / 2, p.y - 4)) {
        bubble(mouthPos(p).x, p.y + 6);
      }
    } else {
      if (p.jumpBuffer > 0 && p.coyote > 0) {
        p.vy = -JUMP_SPEED;
        p.jumpBuffer = 0;
        p.coyote = 0;
        p.grounded = false;
        p.riding = null;
        p.squash = 0.7;
        sfx.jump();
        dust(p.x + p.w / 2, p.y + p.h, 5);
      }
      let g = GRAVITY;
      if (p.vy >= 0) p.bouncing = false;
      if (p.vy < 0 && !held('jump') && p.fling <= 0 && !p.bouncing) g *= 2.6; // short hop when jump is released early
      p.vy = Math.min(p.vy + g * dt, MAX_FALL);
    }

    // Fake walls can only be walked into: in the air they act like real walls, so jumping at a
    // mound with a secret in its base slides up and over it instead of into the secret.
    moveX(p, p.vx * dt, !p.grounded && !p.inWater && !overlapsFakeWall(p));

    const wasGrounded = p.grounded;
    const fallSpeed = p.vy;
    p.grounded = false;
    p.onOneWay = false;
    const prevBottom = p.y + p.h;
    const hitY = moveY(p, p.vy * dt, p.dropTimer <= 0);
    if (hitY === 'down') p.grounded = true;
    if (hitY === 'down') {
      // Mushroom caps bounce the frog up; holding jump bounces higher.
      const row = Math.floor((p.y + p.h + 1) / T);
      const lx = Math.floor((p.x + 3) / T), rx = Math.floor((p.x + p.w - 3) / T);
      const capX = tileAt(lx, row) === 'M' ? lx : tileAt(rx, row) === 'M' ? rx : -1;
      if (capX >= 0) {
        p.vy = held('jump') ? -1020 : -840;
        p.grounded = false;
        p.bouncing = true;
        p.jumpBuffer = 0;
        p.squash = 0.6;
        sfx.boing();
        const cap = level.caps.find((c) => c.ty === row && capX >= c.tx0 && capX <= c.tx1);
        if (cap) cap.squish = 1;
      }
    }

    // Moving logs are one-way from above.
    const riding = p.riding;
    p.riding = null;
    if (p.vy >= 0 && p.dropTimer <= 0) {
      for (const plat of level.platforms) {
        if (p.x + p.w <= plat.x + 2 || p.x >= plat.x + plat.w - 2) continue;
        const bottom = p.y + p.h;
        const topNow = plat.y, topBefore = plat.prevY;
        if (bottom >= topNow && prevBottom <= Math.max(topNow, topBefore) + 2 + (riding === plat ? 8 : 0)) {
          p.y = topNow - p.h;
          p.vy = 0;
          p.grounded = true;
          p.onOneWay = true;
          p.riding = plat;
          break;
        }
      }
    }

    if (p.grounded) {
      p.coyote = COYOTE_TIME;
      p.fling = 0;
      if (!wasGrounded && fallSpeed > 300) {
        p.squash = 1.25;
        dust(p.x + p.w / 2, p.y + p.h, 6);
      }
    }
  }

  function mouthPos(p) {
    return { x: p.x + p.w / 2 + p.tongue.dir * 11, y: p.y + p.h - 10 };
  }

  function updateTongue(dt) {
    const p = player;
    const tg = p.tongue;
    if (tg.state === 'idle') return;
    const m = mouthPos(p);

    if (tg.state === 'reach') {
      const d = aimTongueAt(p, tg.hook);
      tg.len += 1600 * dt;
      if (tg.len >= d) {
        tg.len = d;
        if (held('tongue') && !p.inWater) attachGrapple(p);
        else { tg.state = 'back'; tg.hook = null; }
      }
    } else if (tg.state === 'swing') {
      tg.len = aimTongueAt(p, tg.hook);
    } else if (tg.state === 'out') {
      tg.len += 1100 * dt;
      if (tg.len >= TONGUE_REACH) { tg.len = TONGUE_REACH; tg.state = 'hold'; tg.hold = TONGUE_HOLD; }
      const tip = { x: m.x + tg.ax * tg.len, y: m.y + tg.ay * tg.len };
      if (solidAt(Math.floor(tip.x / T), Math.floor(tip.y / T))) {
        tg.state = 'back';
        burst(tip.x, tip.y, 3, 'rgba(255,255,255,0.8)', { speed: 60, grav: 0, life: 0.3 });
      }
    } else if (tg.state === 'hold') {
      tg.hold -= dt;
      if (tg.hold <= 0) tg.state = 'back';
    } else if (tg.state === 'back') {
      tg.len -= 1300 * dt;
      if (tg.len <= 0) {
        tg.len = 0;
        tg.state = 'idle';
        tg.cooldown = 0.12;
        if (tg.caught) {
          swallow(tg.caught);
          tg.caught = null;
        }
      }
    }

    // Anything touching the tongue, anywhere along its length, gets caught, whether the
    // tongue is going out or coming back. Fish can only be caught mid-leap.
    // (A tongue on its way to or holding a hook doesn't grab things.)
    if ((tg.state === 'out' || tg.state === 'hold' || tg.state === 'back') && !tg.caught && tg.ay === 0) {
      const tipX = m.x + tg.ax * tg.len;
      const tongueBox = { x: Math.min(m.x, tipX) - 7, y: m.y - 10, w: Math.abs(tipX - m.x) + 14, h: 20 };
      const grab = (thing) => {
        thing.caught = true;
        tg.caught = thing;
        tg.state = 'back';
      };
      const fly = level.flies.find((f) => !f.eaten && !f.caught && overlap(tongueBox, f));
      const firefly = !fly && level.fireflies.find((f) => !f.eaten && !f.caught && overlap(tongueBox, fireflyBox(f)));
      // The tongue can also smack the heron's head while its beak is stuck.
      const boss = level.boss;
      if (boss && boss.state === 'stuck' && !tg.hitBoss && overlap(tongueBox, heronHeadBox(heronHead(boss)))) {
        tg.hitBoss = true;
        tg.state = 'back';
        hitHeron(boss);
      }
      if (fly) {
        grab(fly);
      } else if (firefly) {
        grab(firefly);
      } else {
        // Acorns are small and fast, so the tongue gets a more generous grab around them.
        const grabBox = (e) => (e.kind === 'acorn' ? { x: e.x - 14, y: e.y - 14, w: e.w + 28, h: e.h + 28 } : e);
        const enemy = level.enemies.find((e) => !e.dead && !e.caught && !(e.squashed > 0) &&
          (e.kind !== 'fish' || e.jumping) && overlap(tongueBox, grabBox(e)));
        if (enemy) grab(enemy);
        else if (!tg.bounced) {
          // Resting fish are too slippery to catch: bounce off so it doesn't look like a miss.
          const fish = level.enemies.find((e) => e.kind === 'fish' && !e.dead && !e.jumping && overlap(tongueBox, e));
          if (fish) slipOff(fish, m.x + tg.ax * tg.len, m.y);
        }
      }
    }

    if (tg.caught) {
      const c = tg.caught;
      const tip = { x: m.x + tg.ax * tg.len, y: m.y + tg.ay * tg.len };
      c.x = tip.x - c.w / 2;
      c.y = tip.y - c.h / 2;
    }
  }

  function slipOff(fish, tipX, tipY) {
    const tg = player.tongue;
    tg.bounced = true;
    tg.state = 'back';
    fish.dodge = 0.4;
    sfx.plip();
    for (let i = 0; i < 6; i++) bubble(tipX + rand(-6, 6), tipY + rand(-6, 6));
    if (!level.slipperyHinted) {
      level.slipperyHinted = true;
      popup(fish.x + fish.w / 2, fish.y - 18, 'Too slippery! Wait for it to leap.', '#cfe8ff', 2.2);
    } else {
      popup(fish.x + fish.w / 2, fish.y - 12, 'Slippery!', '#cfe8ff');
    }
  }

  function swallow(thing) {
    const cx = player.x + player.w / 2, cy = player.y;
    sfx.gulp();
    player.squash = 1.3;
    if (thing.kind === 'firefly') {
      // Eating a firefly takes its light away, but the frog glows for a while.
      thing.eaten = true;
      player.glow = Math.min(24, player.glow + 12);
      addScore(25, cx, cy - 10);
      burst(cx, cy + 6, 10, '#f4ff9e', { speed: 110, life: 0.7, grav: -40 });
      if (!level.glowHinted) {
        level.glowHinted = true;
        popup(cx, cy - 30, 'Glowing!', '#f4ff9e');
      }
    } else if (thing.kind === 'acorn') {
      thing.dead = true;
      addScore(20, cx, cy - 10);
      burst(cx, cy + 6, 6, '#c68a4a', { speed: 100, life: 0.4 });
      if (!level.acornHinted) {
        level.acornHinted = true;
        popup(cx, cy - 30, 'Crunch!', '#f2c064');
      }
    } else if (thing.kind) {
      thing.dead = true;
      addScore(100, cx, cy - 10);
      burst(cx, cy + 6, 8, '#ffe082', { speed: 120, life: 0.5 });
    } else {
      thing.eaten = true;
      level.fliesEaten++;
      addScore(10, cx, cy - 10);
      burst(cx, cy + 6, 6, '#fff59d', { speed: 100, life: 0.5, grav: 0 });
    }
  }

  const fireflyBox = (f) => ({ x: f.x - 8, y: f.y - 8, w: 16, h: 16 });
  const icicleBox = (ic) => ({ x: ic.x - 6, y: ic.y + 4, w: 12, h: 22 });

  function shatterIcicle(ic) {
    ic.state = 'gone';
    burst(ic.x, ic.y + 20, 10, 'rgba(220, 242, 255, 0.95)', { speed: 150, vy: -80, life: 0.5 });
    const h = hearing(ic.x, ic.y, 160, 700);
    if (h.vol > 0.02) sfx.shatter(h.vol, h.pan);
  }

  function updateCritters(dt) {
    // Icicles shake when the frog passes beneath, then drop.
    for (const ic of level.icicles) {
      if (ic.state === 'hang') {
        const pc = frogCenter(player);
        if (state === 'playing' && Math.abs(pc.x - ic.x) < 44 && pc.y > ic.y && pc.y - ic.y < 9 * T) {
          ic.state = 'shake';
          ic.t = 0.45;
          const h = hearing(ic.x, ic.y, 160, 600);
          if (h.vol > 0.02) audio.tone('sine', 2900, 2600, 0.1, 0.15 * h.vol, 0, h.pan);
        }
      } else if (ic.state === 'shake') {
        ic.t -= dt;
        if (ic.t <= 0) { ic.state = 'fall'; ic.vy = 0; }
      } else if (ic.state === 'fall') {
        ic.vy = Math.min(ic.vy + 1800 * dt, 900);
        ic.y += ic.vy * dt;
        if (solidAt(Math.floor(ic.x / T), Math.floor((ic.y + 26) / T)) || waterAtPx(ic.x, ic.y + 26) || ic.y > level.ph) shatterIcicle(ic);
      }
    }
    for (const ff of level.fireflies) {
      if (ff.eaten || ff.caught) continue;
      ff.phase += dt;
      ff.x = ff.ax + Math.sin(ff.phase * 0.7) * 22 + Math.sin(ff.phase * 1.9) * 8;
      ff.y = ff.ay + Math.cos(ff.phase * 0.9) * 14 + Math.sin(ff.phase * 2.3) * 4;
    }
    for (const f of level.flies) {
      if (f.eaten || f.caught) continue;
      f.phase += dt;
      f.x = f.ax - f.w / 2 + Math.sin(f.phase * 3.1) * 5;
      f.y = f.ay - f.h / 2 + Math.cos(f.phase * 4.7) * 4;
    }

    for (const e of level.enemies) {
      if (e.dead || e.caught) continue;
      if (e.squashed > 0) {
        e.squashed -= dt;
        if (e.squashed <= 0) e.dead = true;
        continue;
      }
      if (e.kind === 'beetle') {
        e.anim += dt * 8;
        e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL);
        e.vx = e.dir * 50;
        if (moveX(e, e.vx * dt)) e.dir *= -1;
        e.grounded = moveY(e, e.vy * dt, true) === 'down';
        if (e.grounded) {
          // Turn around at ledges, water and thorns.
          const aheadX = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
          const tx = Math.floor(aheadX / T);
          const below = tileAt(tx, Math.floor((e.y + e.h + 2) / T));
          const front = tileAt(tx, Math.floor((e.y + e.h - 2) / T));
          if (!(SOLID.has(below) || below === '-') || front === '^') e.dir *= -1;
        }
        if (e.y > level.ph + 50) e.dead = true;
      } else if (e.kind === 'squirrel') {
        // Squirrels watch the frog and lob acorns when it's within range.
        const pc = frogCenter(player);
        const dx = pc.x - (e.x + e.w / 2), dy = pc.y - (e.y + e.h / 2);
        e.dir = dx < 0 ? -1 : 1;
        e.throwing = Math.max(0, e.throwing - dt);
        if (state === 'playing' && Math.abs(dx) < 9 * T && Math.abs(dy) < 7 * T) {
          e.throwTimer -= dt;
          if (e.throwTimer <= 0) {
            e.throwTimer = rand(2.2, 3.2);
            e.throwing = 0.3;
            throwAcorn(e, pc);
          }
        }
      } else if (e.kind === 'acorn') {
        e.vy += 900 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.spin += dt * 12;
        e.life -= dt;
        if (e.life <= 0 || solidAt(Math.floor((e.x + 5) / T), Math.floor((e.y + 5) / T)) || waterAtPx(e.x + 5, e.y + 5)) {
          e.dead = true;
          burst(e.x + 5, e.y + 5, 5, '#8d5a2b', { speed: 90, life: 0.4 });
          const h = hearing(e.x, e.y, 160, 600);
          if (h.vol > 0.02) sfx.tok(h.vol, h.pan);
        }
      } else if (e.kind === 'wasp' && e.diver) {
        e.t += dt;
        e.life -= dt;
        if (e.life > 2) {
          // Home in on the frog, turning gently so it can be dodged.
          const tx = player.x + player.w / 2 - (e.x + e.w / 2);
          const ty = player.y + player.h / 2 - (e.y + e.h / 2);
          const d = Math.hypot(tx, ty) || 1;
          e.vx += (tx / d * 125 - e.vx) * Math.min(1, dt * 1.3);
          e.vy += (ty / d * 125 - e.vy) * Math.min(1, dt * 1.3);
        } else {
          e.vy -= 300 * dt; // give up and fly away
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (Math.abs(e.vx) > 5) e.dir = Math.sign(e.vx);
        if (e.life <= 0) e.dead = true;
      } else if (e.kind === 'wasp') {
        e.t += dt;
        e.x += e.dir * 70 * dt;
        if (e.x > e.ox + T * 2.5) e.dir = -1;
        if (e.x < e.ox - T * 2.5) e.dir = 1;
        e.y = e.oy + Math.sin(e.t * 3) * 10;
      } else if (e.kind === 'fish') {
        if (e.dodge > 0) e.dodge -= dt;
        if (!e.jumping) {
          e.wait -= dt;
          if (e.wait <= 0) {
            e.jumping = true;
            e.vy = -rand(700, 800);
            splash(e.x + e.w / 2, e.y);
          }
        } else {
          e.vy += 1500 * dt;
          e.y += e.vy * dt;
          if (e.vy > 0 && e.y >= e.homeY) {
            e.y = e.homeY;
            e.jumping = false;
            e.wait = rand(1.2, 2.4);
            splash(e.x + e.w / 2, e.y);
          }
        }
      } else if (e.kind === 'swimmer') {
        // Patrols back and forth, turning at walls, the surface, or the end of its range.
        e.t += dt;
        const nx = e.x + e.dir * 70 * dt;
        const lead = e.dir > 0 ? nx + e.w + 2 : nx - 2;
        const blocked = !waterAtPx(lead, e.y + 2) || !waterAtPx(lead, e.y + e.h - 2);
        if (blocked || Math.abs(nx - e.ox) > T * 4) e.dir *= -1;
        else e.x = nx;
        e.y = e.oy + Math.sin(e.t * 2) * 6;
      }
    }

    for (const k of level.kelp) {
      if (k.x < cam.x - 40 || k.x > cam.x + W + 40) continue;
      if (Math.random() < dt * 0.35) bubble(k.x + rand(-6, 6), k.y - k.h * rand(0.3, 1));
    }
  }

  function checkInteractions() {
    const p = player;
    if (state !== 'playing') return;

    // Flies and fireflies
    for (const f of level.flies) {
      if (!f.eaten && !f.caught && overlap(p, f)) swallow(f);
    }
    for (const f of level.fireflies) {
      if (!f.eaten && !f.caught && overlap(p, fireflyBox(f))) swallow(f);
    }

    // Enemies
    const hitbox = { x: p.x + 3, y: p.y + 3, w: p.w - 6, h: p.h - 4 };
    for (const e of level.enemies) {
      if (e.dead || e.caught || e.squashed > 0) continue;
      if (e.kind === 'fish' && !e.jumping) continue;
      if (!overlap(hitbox, e)) continue;
      if (e.kind === 'acorn') {
        e.dead = true;
        hurtPlayer(e.x + 5, false);
        continue;
      }
      const stomp = p.vy > 0 && p.prevY + p.h <= e.y + e.h * 0.6;
      if (stomp) {
        e.squashed = 0.4;
        p.vy = held('jump') ? -620 : -420;
        p.grounded = false;
        p.riding = null;
        sfx.stomp();
        addScore(50, e.x + e.w / 2, e.y - 6);
        burst(e.x + e.w / 2, e.y + e.h / 2, 8, '#ffffff', { speed: 140, life: 0.4 });
      } else {
        hurtPlayer(e.x + e.w / 2, false);
      }
    }

    // The heron: its beak hurts while stabbing, its body while swooping; its head can be
    // stomped while the beak is stuck.
    const b = level.boss;
    if (b && !b.defeated) {
      const h = heronHead(b);
      if (b.state === 'stab' || (b.state === 'stuck' && b.stuckFresh > 0)) {
        if (overlap(hitbox, { x: h.tipX - 10, y: h.tipY - 36, w: 20, h: 36 })) hurtPlayer(h.tipX, false);
      } else if (b.state === 'swoop') {
        if (overlap(hitbox, { x: b.x - 46, y: b.bodyY - 16, w: 92, h: 30 })) hurtPlayer(b.x, false);
      } else if (b.state === 'stuck' && p.vy > 0 && p.prevY + p.h <= h.hy - 2 && overlap(p, heronHeadBox(h))) {
        hitHeron(b);
        p.vy = held('jump') ? -720 : -540;
        p.grounded = false;
        sfx.stomp();
      }
    }

    // Falling icicles
    for (const ic of level.icicles) {
      if (ic.state === 'fall' && overlap(hitbox, icicleBox(ic))) {
        hurtPlayer(ic.x, false);
        shatterIcicle(ic);
      }
    }

    // Checkpoints
    for (const c of level.checkpoints) {
      if (!c.active && overlap(p, c)) {
        level.checkpoints.forEach((o) => { o.active = false; });
        c.active = true;
        c.wave = 1;
        p.spawn = checkpointSpawn(c, p);
        saveRun();
        sfx.checkpoint();
        popup(c.x + 8, c.y - 8, 'Checkpoint!', '#b9f6ca');
        burst(c.x + 8, c.y + 4, 12, '#b9f6ca', { grav: 200, speed: 150 });
      }
    }

    // Goal
    if (level.goal && overlap(p, level.goal)) {
      completeLevel();
    }
  }

  function hurtPlayer(fromX, thorns) {
    const p = player;
    if (p.invuln > 0 || state !== 'playing') return;
    if (devRun && devInvincible) {
      // Still bounce off thorns so you don't get stuck in them.
      if (thorns) { p.vy = -560; p.grounded = false; p.riding = null; }
      return;
    }
    releaseGrapple(p, false);
    p.hearts--;
    shake = 8;
    sfx.hurt();
    burst(p.x + p.w / 2, p.y + p.h / 2, 10, '#ff8a80', { speed: 160 });
    if (p.hearts <= 0) { killPlayer(false); return; }
    p.invuln = 1.4;
    p.stun = 0.25;
    p.vy = thorns ? -560 : -380;
    p.vx = (p.x + p.w / 2 < fromX ? -1 : 1) * 260;
    p.grounded = false;
    p.riding = null;
  }

  function killPlayer(fell) {
    if (state !== 'playing') return;
    if (!inTutorial && !(devRun && devInvincible)) lives--;
    // Saved straight away so quitting mid-fall can't undo a lost life. Game over ends the run.
    if (lives > 0) saveRun();
    else if (!inTutorial) endRun();
    state = 'dying';
    stateTimer = fell ? 1.0 : 1.6;
    sfx.die();
    shake = 10;
    const p = player;
    p.tongue.state = 'idle';
    p.tongue.hook = null;
    if (p.tongue.caught) { p.tongue.caught.caught = false; p.tongue.caught = null; }
    p.vy = fell ? 0 : -620;
    p.dead = true;
  }

  function completeLevel() {
    state = 'complete';
    stateTimer = 1.0;
    sfx.win();
    player.vx = 0;
    player.riding = null;
    player.tongue.state = 'idle';
    player.tongue.hook = null;
    if (player.tongue.caught) { swallow(player.tongue.caught); player.tongue.caught = null; }
    if (inTutorial) {
      tutorialDone = true;
      saveNumber(TUTORIAL_KEY, 1);
      return;
    }
    const par = level.par || Math.round(level.w * 1.2); // seconds; longer levels get more time before the bonus runs out
    const bonusTime = Math.max(0, Math.floor(par - level.time)) * 5;
    const bonusHearts = player.hearts * 100;
    const allFlies = level.fliesEaten === level.flyTotal ? 500 : 0;
    level.bonus = { time: bonusTime, hearts: bonusHearts, allFlies };
    score += bonusTime + bonusHearts + allFlies;
    setRunAt(levelIndex + 1); // beating the last level ends the run
  }

  function updateParticles(dt) {
    for (const pt of particles) {
      pt.life -= dt;
      pt.vy += pt.grav * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.bubble) {
        pt.vx += Math.sin(pt.life * 9) * 30 * dt;
        if (level && !waterAtPx(pt.x, pt.y)) pt.life = 0; // pop at the surface
      }
    }
    particles = particles.filter((pt) => pt.life > 0);
    for (const pu of popups) {
      pu.life -= dt;
      pu.y -= 40 * dt;
    }
    popups = popups.filter((pu) => pu.life > 0);
    if (level) {
      for (const c of level.checkpoints) c.wave = Math.max(0, c.wave - dt);
    }
  }

  function snapCamera() {
    const t = cameraTarget();
    cam.x = t.x;
    cam.y = t.y;
  }
  function cameraTarget() {
    const p = player;
    const tx = p.x + p.w / 2 - W / 2 + p.facing * 60;
    const ty = p.y + p.h / 2 - H * 0.55;
    return {
      x: clamp(tx, 0, Math.max(0, level.pw - W)),
      y: level.ph <= H ? level.ph - H : clamp(ty, 0, level.ph - H),
    };
  }
  function updateCamera(dt) {
    if (state === 'dying') return;
    const t = cameraTarget();
    cam.x += (t.x - cam.x) * Math.min(1, dt * 5);
    cam.y += (t.y - cam.y) * Math.min(1, dt * 5);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function render() {
    menuHitboxes = [];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const menuScreen = state === 'title' || state === 'dev' || state === 'select';
    const cap = menuScreen ? Infinity : level.pw;
    if (cap !== viewCap) {
      viewCap = cap;
      resize();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const theme = menuScreen ? THEMES.meadow : level.theme;
    drawBackground(theme, cam.x, menuScreen ? 0 : cam.y);

    if (state === 'title') {
      uiSpace(drawTitle);
      return;
    }
    if (state === 'dev') {
      uiSpace(drawDevScreen);
      return;
    }
    if (state === 'select') {
      uiSpace(drawSelectScreen);
      return;
    }

    const sx = shake > 0 ? rand(-shake, shake) * 0.5 : 0;
    const sy = shake > 0 ? rand(-shake, shake) * 0.5 : 0;
    const ox = Math.round(-cam.x + sx);
    const oy = Math.round(-cam.y + sy);

    ctx.save();
    ctx.translate(ox, oy);
    drawTiles(theme, false);
    drawMushrooms();
    drawIcicles();
    drawKelp();
    drawSigns();
    drawCheckpoints();
    drawGoal();
    drawPlatforms();
    drawHooks();
    drawLilies();
    drawFlies();
    drawEnemies();
    drawHeron();
    drawPlayer();
    drawTiles(theme, true);
    drawLilyPads();
    drawFireflies();
    drawParticles();
    ctx.restore();

    if (theme.weather) drawWeather(theme);
    drawHeronWarning();
    if (theme.night) drawDarkness(ox, oy);

    ctx.save();
    ctx.translate(ox, oy);
    drawPopups();
    drawSignBubbles();
    ctx.restore();

    uiSpace(() => {
      drawHud();
      drawOverlay();
    });
  }

  // --- Background -----------------------------------------------------------
  function drawBackground(theme, camX, camY) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (theme.night) {
      // Twinkling stars and a moon
      for (let i = 0; i < 110; i++) {
        const h = hash(i, 99);
        const x = ((h % 2000) - camX * 0.04) % (W + 40);
        const sx = x < -20 ? x + W + 40 : x;
        const sy = (h >>> 11) % 330;
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(time * (0.5 + (h % 7) * 0.2) + i));
        ctx.fillStyle = '#fffbe8';
        ctx.fillRect(sx, sy, (h % 5 === 0) ? 2 : 1.3, (h % 5 === 0) ? 2 : 1.3);
      }
      ctx.globalAlpha = 1;
      const mx = W - 170 - camX * 0.02, my = 100 - camY * 0.05;
      ctx.fillStyle = 'rgba(244, 241, 222, 0.12)';
      circle(mx, my, 80);
      ctx.fill();
      ctx.fillStyle = theme.sun;
      circle(mx, my, 40);
      ctx.fill();
      ctx.fillStyle = 'rgba(180, 176, 160, 0.45)';
      circle(mx - 12, my - 8, 8); ctx.fill();
      circle(mx + 14, my + 10, 6); ctx.fill();
      circle(mx + 4, my - 18, 4); ctx.fill();
    } else {
      // Sun
      ctx.fillStyle = theme.sun;
      ctx.globalAlpha = 0.9;
      circle(W - 170 - camX * 0.02, 110 - camY * 0.05, 46);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      circle(W - 170 - camX * 0.02, 110 - camY * 0.05, 70);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Clouds
    ctx.fillStyle = theme.cloud;
    for (let i = 0; i < 7; i++) {
      const span = W + 300;
      const x = ((i * 347 - camX * 0.1 - time * 8) % span + span) % span - 150;
      const y = 50 + ((i * 97) % 130) - camY * 0.05;
      const s = 0.7 + (i % 3) * 0.25;
      ellipse(x, y, 42 * s, 16 * s); ctx.fill();
      ellipse(x - 26 * s, y + 6 * s, 28 * s, 12 * s); ctx.fill();
      ellipse(x + 28 * s, y + 5 * s, 30 * s, 13 * s); ctx.fill();
      ellipse(x + 4 * s, y - 10 * s, 24 * s, 14 * s); ctx.fill();
    }

    hills(theme.far, 0.15, 300, 60, 0.004, camX, camY);
    hills(theme.near, 0.35, 380, 45, 0.007, camX, camY);
    if (theme.reeds) {
      // Tall reeds and cattails silhouetted against the sunset
      for (let i = 0; i < 46; i++) {
        const h = hash(i, 17);
        const x = ((i * 23 + (h % 17) - camX * 0.5) % (W + 60) + W + 60) % (W + 60) - 30;
        const top = H - 150 - (h % 110) - camY * 0.3;
        const sway = Math.sin(time * 0.8 + i) * 4;
        ctx.strokeStyle = i % 3 ? '#3b2d45' : '#46344f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, H);
        ctx.quadraticCurveTo(x, (H + top) / 2, x + sway, top);
        ctx.stroke();
        if (h % 3 === 0) {
          ctx.fillStyle = '#2f2238';
          ellipse(x + sway, top + 10, 3.5, 11);
          ctx.fill();
        }
      }
    }
  }

  function hills(color, parallax, base, amp, freq, camX, camY) {
    const off = camX * parallax;
    const y0 = base - camY * parallax * 0.6 + 40;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const wx = x + off;
      const y = y0 - Math.sin(wx * freq) * amp - Math.sin(wx * freq * 2.3 + 1.3) * amp * 0.45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  // --- Tiles ----------------------------------------------------------------
  function drawTiles(theme, waterPass) {
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1);
    const x1 = Math.min(level.w - 1, Math.floor((cam.x + W) / T) + 1);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 1);
    const y1 = Math.min(level.h - 1, Math.floor((cam.y + H) / T) + 1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = level.tiles[ty * level.w + tx];
        const px = tx * T, py = ty * T;
        if (waterPass) {
          if (isWaterTile(t)) drawWaterFront(theme, tx, ty, px, py);
          else if (t === 'F') drawFakeWall(theme, tx, ty, px, py);
          continue;
        }
        if (t === 'F') {
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(px, py, T, T);
        } else if (isWaterTile(t)) {
          drawWaterBack(theme, tx, ty, px, py);
          if (t === 'u') drawUrchin(tx, px, py);
        } else if (t === '#') drawDirt(theme, tx, ty, px, py);
        else if (t === 'I' || t === 'i') drawIce(tx, ty, px, py, t === 'i');
        else if (t === '|') drawStem(px, py);
        else if (t === 'B') drawStone(tx, ty, px, py);
        else if (t === '-') drawPlank(px, py);
        else if (t === '^') drawThorns(theme, tx, px, py);
      }
    }
  }

  function drawDirt(theme, tx, ty, px, py) {
    ctx.fillStyle = theme.dirt;
    ctx.fillRect(px, py, T, T);
    const h = hash(tx, ty);
    ctx.fillStyle = theme.dirtDark;
    ctx.fillRect(px + (h % 22) + 3, py + ((h >>> 5) % 18) + 10, 5, 4);
    ctx.fillRect(px + ((h >>> 10) % 22) + 3, py + ((h >>> 15) % 22) + 6, 3, 3);
    const above = tileAt(tx, ty - 1);
    if (isWaterTile(above)) {
      // Sandy lake bed
      ctx.fillStyle = '#c9b27a';
      ctx.fillRect(px, py, T, 5);
      ctx.fillStyle = '#e0cc94';
      ctx.fillRect(px + (h % 20), py + 1, 6, 2);
    } else if (!looksSolid(above)) {
      ctx.fillStyle = theme.grassDark;
      ctx.fillRect(px, py, T, 11);
      ctx.fillStyle = theme.grass;
      ctx.fillRect(px, py, T, 8);
      ctx.fillStyle = theme.grassLight;
      ctx.fillRect(px, py, T, 3);
      // Little blades
      ctx.fillStyle = theme.grass;
      for (let i = 0; i < 3; i++) {
        const bx = px + ((h >>> (i * 4)) % 28) + 2;
        ctx.beginPath();
        ctx.moveTo(bx - 2, py + 1);
        ctx.lineTo(bx, py - 4 - (h >>> (i * 3)) % 3);
        ctx.lineTo(bx + 2, py + 1);
        ctx.fill();
      }
      if (h % 7 === 0 && !theme.noFlowers) {
        ctx.fillStyle = h % 2 ? '#ffe066' : '#ff9ecb';
        circle(px + 16 + (h % 9) - 4, py - 3, 2.5);
        ctx.fill();
      }
      // Rounded edge where the grass meets air on the side.
      if (!looksSolid(tileAt(tx - 1, ty))) { ctx.fillStyle = theme.grassDark; ctx.fillRect(px, py, 3, 12); }
      if (!looksSolid(tileAt(tx + 1, ty))) { ctx.fillStyle = theme.grassDark; ctx.fillRect(px + T - 3, py, 3, 12); }
    }
  }

  // Looks like dirt, with faint cracks for sharp eyes. Fades once the frog walks in.
  function drawFakeWall(theme, tx, ty, px, py) {
    const region = level.fakeRegions[level.fakeRegionOf[ty * level.w + tx]];
    ctx.globalAlpha = region.alpha;
    drawDirt(theme, tx, ty, px, py);
    const h = hash(tx, ty);
    ctx.strokeStyle = 'rgba(30, 15, 5, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cx = px + 8 + (h % 14), cy = py + 8 + ((h >>> 4) % 12);
    ctx.moveTo(cx - 6, cy - 5);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx - 2, cy + 7);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 7, cy + 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawIce(tx, ty, px, py, thin) {
    if (thin) {
      // Thin ice is a slab on the water's surface: fill beneath it with water.
      ctx.fillStyle = level.theme.waterBack;
      ctx.fillRect(px, py + 8, T, T - 8);
    }
    ctx.fillStyle = thin ? 'rgba(200, 232, 250, 0.85)' : '#bfe3f5';
    ctx.fillRect(px, py, T, thin ? 14 : T);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(px, py, T, 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const h = hash(tx, ty);
    ctx.moveTo(px + 4 + (h % 10), py + 10);
    ctx.lineTo(px + 12 + (h % 10), py + 5);
    if (!thin) {
      ctx.moveTo(px + 14 + (h % 8), py + 24);
      ctx.lineTo(px + 22 + (h % 8), py + 17);
    }
    ctx.stroke();
    ctx.fillStyle = thin ? 'rgba(140, 190, 220, 0.8)' : '#8cbfdc';
    ctx.fillRect(px, py + (thin ? 12 : T - 3), T, thin ? 2 : 3);
    if (thin) {
      // Cracks spread as the ice is stood on.
      const ice = level.thinIce.get(ty * level.w + tx);
      const c = ice ? ice.crack / 0.6 : 0;
      if (c > 0.05) {
        ctx.strokeStyle = `rgba(60, 100, 140, ${0.4 + c * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 2);
        ctx.lineTo(px + 16 - 10 * c, py + 7);
        ctx.lineTo(px + 16 - 14 * c, py + 12);
        ctx.moveTo(px + 16, py + 2);
        ctx.lineTo(px + 16 + 12 * c, py + 9);
        ctx.stroke();
      }
    }
  }

  function drawStem(px, py, height = T) {
    ctx.fillStyle = '#f3e6cf';
    ctx.fillRect(px + 9, py, 14, height);
    ctx.fillStyle = 'rgba(160, 130, 90, 0.35)';
    ctx.fillRect(px + 19, py, 4, height);
  }

  function drawMushrooms() {
    for (const c of level.caps) {
      const x0 = c.tx0 * T - 6, x1 = (c.tx1 + 1) * T + 6;
      if (x1 < cam.x - 20 || x0 > cam.x + W + 20) continue;
      const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
      const base = c.ty * T + 16;
      const height = 22 * (1 - c.squish * 0.35);
      // Bridge the stem up into the cap's tile so it meets the underside of the cap.
      const stemX = Math.floor((c.tx0 + c.tx1) / 2);
      if (tileAt(stemX, c.ty + 1) === '|') drawStem(stemX * T, base, (c.ty + 1) * T - base);
      ctx.fillStyle = '#f1d9b5'; // gills
      ctx.fillRect(x0 + 10, base, x1 - x0 - 20, 6);
      ctx.fillStyle = '#d8433a';
      ctx.strokeStyle = '#8e1f1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, height, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff4e6';
      const spots = Math.max(2, Math.round(rx / 16));
      for (let i = 0; i < spots; i++) {
        const sx = x0 + 14 + (i + 0.5) * ((x1 - x0 - 28) / spots);
        circle(sx, base - height * (0.45 + 0.25 * ((i % 2) ? 1 : 0)), 3.5 + (i % 2));
        ctx.fill();
      }
    }
  }

  function drawIcicles() {
    for (const ic of level.icicles) {
      if (ic.state === 'gone') continue;
      const x = ic.x + (ic.state === 'shake' ? Math.sin(time * 70) * 1.5 : 0), y = ic.y;
      ctx.fillStyle = 'rgba(215, 240, 255, 0.95)';
      ctx.strokeStyle = '#9cc9e6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 3);
      ctx.lineTo(x - 1, y + 15);
      ctx.stroke();
    }
  }

  function drawHeron() {
    const b = level.boss;
    if (!b) return;
    if (b.state === 'defeated' && b.bodyY < -120) return;
    const h = heronHead(b);
    const flying = ['takeoff', 'warn', 'swoop', 'land', 'defeated'].includes(b.state);
    const white = b.flash > 0 && Math.floor(time * 20) % 2 === 0;
    const body = white ? '#ffffff' : '#8ea3b5', wing = white ? '#f2f5f8' : '#6f8599';
    const neck = white ? '#ffffff' : '#a9bccb', legs = '#c8a24a';
    // Aim marker on the ground: where the beak is about to strike
    if (b.state === 'aim') {
      const a = 0.55 + 0.3 * Math.sin(time * 20);
      ctx.fillStyle = `rgba(220, 40, 40, ${a * 0.45})`;
      ellipse(b.target.x, b.target.y - 1, 20, 6);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 70, 70, ${a})`;
      ctx.lineWidth = 2.5;
      ellipse(b.target.x, b.target.y - 1, 20, 6);
      ctx.stroke();
    }
    const bx = b.x, by = b.bodyY, d = b.dir;
    ctx.lineCap = 'round';
    // Legs: long and thin, walking; trailing behind when flying
    ctx.strokeStyle = legs;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (flying) {
      ctx.moveTo(bx - d * 18, by + 8); ctx.lineTo(bx - d * 60, by + 16);
      ctx.moveTo(bx - d * 16, by + 12); ctx.lineTo(bx - d * 56, by + 22);
    } else {
      for (const side of [-1, 1]) {
        const step = Math.sin(b.walk + (side > 0 ? 0 : Math.PI)) * 8;
        const hipX = bx + side * 6, kneeX = bx + side * 4 - d * 10 + step * 0.5, footX = bx + side * 8 + step;
        ctx.moveTo(hipX, by + 14);
        ctx.lineTo(kneeX, (by + 14 + b.groundY) / 2);
        ctx.lineTo(footX, b.groundY);
        ctx.moveTo(footX - 8, b.groundY); ctx.lineTo(footX + 8, b.groundY);
      }
    }
    ctx.stroke();
    // Tail and body
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.moveTo(bx - d * 24, by - 4);
    ctx.lineTo(bx - d * 48, by + 10);
    ctx.lineTo(bx - d * 22, by + 10);
    ctx.fill();
    ctx.fillStyle = body;
    ellipse(bx, by, 32, 18, d * -0.15);
    ctx.fill();
    // Wings: folded, or spread wide and flapping in flight
    ctx.fillStyle = wing;
    if (flying) {
      const flap = Math.sin(time * 14) * 22;
      ctx.beginPath();
      ctx.moveTo(bx - d * 14, by - 6);
      ctx.lineTo(bx + d * 10, by - 50 - flap);
      ctx.lineTo(bx + d * 34, by - 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - d * 20, by - 4);
      ctx.lineTo(bx - d * 30, by - 44 + flap * 0.6);
      ctx.lineTo(bx + d * 6, by - 6);
      ctx.fill();
    } else {
      ellipse(bx - d * 6, by - 2, 24, 12, d * -0.2);
      ctx.fill();
    }
    // Neck (an S-curve from the shoulder to the head)
    const sx = bx + d * 20, sy = by - 10;
    ctx.strokeStyle = neck;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + (h.hx - sx) * 0.1 - d * 18, (sy + h.hy) / 2, h.hx, h.hy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Beak
    ctx.fillStyle = '#e0a030';
    const ax = h.tipX - h.hx, ay = h.tipY - h.hy, al = Math.hypot(ax, ay) || 1;
    const nx = -ay / al * 3.5, ny = ax / al * 3.5;
    ctx.beginPath();
    ctx.moveTo(h.hx + nx, h.hy + ny);
    ctx.lineTo(h.tipX, h.tipY);
    ctx.lineTo(h.hx - nx, h.hy - ny);
    ctx.fill();
    // Head, crest and eye
    ctx.fillStyle = white ? '#ffffff' : '#dfe7ee';
    circle(h.hx, h.hy, 8);
    ctx.fill();
    ctx.strokeStyle = '#1d2733';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(h.hx - d * 2, h.hy - 5);
    ctx.lineTo(h.hx - d * 22, h.hy - 12);
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    circle(h.hx + d * 3, h.hy - 2, 2.4);
    ctx.fill();
    ctx.fillStyle = '#111';
    circle(h.hx + d * 3.5, h.hy - 2, 1.1);
    ctx.fill();
    ctx.lineCap = 'butt';
  }

  // A flashing warning at the screen edge where the heron is about to swoop in.
  function drawHeronWarning() {
    const b = level.boss;
    if (!b || b.state !== 'warn') return;
    const x = b.swoopSide > 0 ? W - 44 : 44, y = b.bodyY - cam.y;
    const a = 0.75 + 0.25 * Math.sin(time * 18);
    const r = 22 + 3 * Math.sin(time * 18);
    ctx.fillStyle = `rgba(215, 35, 35, ${a})`;
    circle(x, y, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    circle(x, y, r);
    ctx.stroke();
    text('!', x, y + 1, 30, '#fff', 'center');
    // Arrow pointing the way it will fly
    ctx.fillStyle = `rgba(215, 35, 35, ${a})`;
    ctx.beginPath();
    const tip = b.swoopSide > 0 ? x - 52 : x + 52;
    ctx.moveTo(tip, y);
    ctx.lineTo(x - b.swoopSide * 26, y - 13);
    ctx.lineTo(x - b.swoopSide * 26, y + 13);
    ctx.fill();
  }

  function drawSquirrel(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.scale(e.dir, e.squashed > 0 ? 0.4 : 1);
    // Bushy tail curling up behind
    ctx.fillStyle = '#b8743a';
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.bezierCurveTo(-22, -4, -24, -30, -10, -30);
    ctx.bezierCurveTo(-2, -30, -6, -20, -12, -20);
    ctx.bezierCurveTo(-16, -16, -12, -10, -4, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Body and head
    ctx.fillStyle = '#c98548';
    ellipse(0, -8, 8, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3dcc0';
    ellipse(3, -6, 4, 5);
    ctx.fill();
    ctx.fillStyle = '#c98548';
    circle(6, -17, 6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -22); ctx.lineTo(4, -27); ctx.lineTo(7, -22);
    ctx.fill();
    ctx.fillStyle = '#222';
    circle(8, -18, 1.4);
    ctx.fill();
    circle(12, -15.5, 1.1);
    ctx.fill();
    // Paws held up with an acorn while winding up a throw
    if (e.throwing > 0) {
      ctx.fillStyle = '#8d5a2b';
      ellipse(10, -12 - e.throwing * 10, 3.5, 4);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAcorn(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate(e.spin);
    ctx.fillStyle = '#b07038';
    ellipse(0, 1.5, 4, 5);
    ctx.fill();
    ctx.fillStyle = '#6d4526';
    ellipse(0, -2.5, 5, 2.8);
    ctx.fill();
    ctx.fillRect(-0.8, -6.5, 1.6, 2.5);
    ctx.restore();
  }

  // Falling leaves or snow drifting across the screen, a little in front of everything.
  function drawWeather(theme) {
    const snow = theme.weather === 'snow';
    const count = snow ? 70 : 24;
    for (let i = 0; i < count; i++) {
      const h = hash(i, snow ? 71 : 37);
      const fall = snow ? 30 + (h % 40) : 22 + (h % 26);
      const spanX = W + 40, spanY = H + 40;
      let x = ((h % 997) / 997) * spanX + Math.sin(time * (snow ? 1.3 : 0.9) + i) * (snow ? 12 : 30) - cam.x * 0.4 + time * (snow ? 8 : 18);
      let y = (((h >>> 10) % 991) / 991) * spanY + time * fall - cam.y * 0.4;
      x = ((x % spanX) + spanX) % spanX - 20;
      y = ((y % spanY) + spanY) % spanY - 20;
      if (snow) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        circle(x, y, 1.2 + (h % 3) * 0.7);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * (1 + (h % 3)) + i);
        ctx.fillStyle = ['#d9622b', '#e8a33a', '#b8412a', '#c98a2e'][h % 4];
        ellipse(0, 0, 5, 2.6);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawStone(tx, ty, px, py) {
    ctx.fillStyle = '#8d949c';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#b3bac2';
    ctx.fillRect(px, py, T, 4);
    ctx.fillRect(px, py, 4, T);
    ctx.fillStyle = '#62686f';
    ctx.fillRect(px, py + T - 4, T, 4);
    ctx.fillRect(px + T - 4, py, 4, T);
    const h = hash(tx, ty);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(px + 8 + (h % 10), py + 10 + ((h >>> 4) % 8), 6, 3);
    if (h % 3 === 0) {
      ctx.fillStyle = '#6fae4a';
      ctx.fillRect(px + 4, py, 10, 3);
    }
  }

  function drawPlank(px, py) {
    ctx.fillStyle = '#a0703f';
    ctx.fillRect(px, py, T, 10);
    ctx.fillStyle = '#c98f55';
    ctx.fillRect(px, py, T, 3);
    ctx.fillStyle = '#6d4526';
    ctx.fillRect(px, py + 9, T, 2);
    ctx.fillRect(px + T - 1, py + 2, 1, 7);
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(px + 5, py + 5, 2, 2);
    ctx.fillRect(px + T - 8, py + 5, 2, 2);
  }

  function drawThorns(theme, tx, px, py) {
    // Bramble stem along the ground
    ctx.fillStyle = '#3e2418';
    ctx.fillRect(px, py + T - 7, T, 7);
    for (let i = 0; i < 4; i++) {
      const bx = px + 1 + i * 8;
      const tipY = py + 6 + ((tx + i) % 2) * 6;
      ctx.fillStyle = '#4a2a1c';
      ctx.beginPath();
      ctx.moveTo(bx - 1, py + T - 4);
      ctx.lineTo(bx + 4, tipY);
      ctx.lineTo(bx + 9, py + T - 4);
      ctx.fill();
      ctx.fillStyle = '#f1e4cf';
      ctx.beginPath();
      ctx.moveTo(bx + 2.5, tipY + 8);
      ctx.lineTo(bx + 4, tipY);
      ctx.lineTo(bx + 5.5, tipY + 8);
      ctx.fill();
    }
    if (tx % 3 === 0) {
      ctx.fillStyle = '#d32f4f';
      circle(px + 14, py + T - 9, 2.5);
      ctx.fill();
    }
  }

  // Water is drawn in two layers: an opaque body behind everything (darker with depth),
  // and a light tint in front so anything underwater looks submerged.
  function waterTop(tx, ty, py) {
    const above = tileAt(tx, ty - 1);
    const surface = !isWaterTile(above) && !SOLID.has(above);
    return { surface, top: surface ? py + 6 + Math.sin(time * 2.4 + tx * 0.9) * 2 : py };
  }

  function drawWaterBack(theme, tx, ty, px, py) {
    const { top } = waterTop(tx, ty, py);
    ctx.fillStyle = theme.waterBack;
    ctx.fillRect(px, top, T, py + T - top);
    const dark = Math.min(0.5, Math.max(0, ty - level.waterLine) * 0.04);
    if (dark > 0) {
      ctx.fillStyle = `rgba(0, 25, 55, ${dark})`;
      ctx.fillRect(px, top, T, py + T - top);
    }
  }

  // Drawn over everything, so anything below the surface takes on the water's colour
  // (and gets a little darker the deeper it is).
  function drawWaterFront(theme, tx, ty, px, py) {
    const { surface, top } = waterTop(tx, ty, py);
    ctx.fillStyle = theme.water;
    ctx.fillRect(px, top, T, py + T - top);
    const dark = Math.min(0.25, Math.max(0, ty - level.waterLine) * 0.02);
    if (dark > 0) {
      ctx.fillStyle = `rgba(0, 20, 45, ${dark})`;
      ctx.fillRect(px, top, T, py + T - top);
    }
    if (surface) {
      ctx.fillStyle = theme.waterTop;
      ctx.fillRect(px, top - 1, T, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px + ((tx * 13 + Math.floor(time * 6)) % 24), top + 5, 6, 1.5);
    }
  }

  function drawUrchin(tx, px, py) {
    const cx = px + T / 2, cy = py + T - 8;
    ctx.strokeStyle = '#3d1a5b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + tx;
      const len = 12 + (i % 2) * 3;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.8);
    }
    ctx.stroke();
    ctx.fillStyle = '#6a2c91';
    circle(cx, cy, 7.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    circle(cx - 2.5, cy - 2.5, 2.5);
    ctx.fill();
  }

  function drawKelp() {
    ctx.lineCap = 'round';
    for (const k of level.kelp) {
      if (k.x < cam.x - 60 || k.x > cam.x + W + 60) continue;
      for (let strand = 0; strand < 2; strand++) {
        const h = k.h * (strand ? 0.7 : 1);
        const base = k.x + (strand ? 7 : -3);
        const seg = 8;
        ctx.strokeStyle = strand ? '#3fa35f' : '#2e8b57';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(base, k.y);
        let lx = base, ly = k.y;
        for (let i = 1; i <= seg; i++) {
          const f = i / seg;
          lx = base + Math.sin(time * 1.6 + k.phase + strand + f * 3) * 8 * f;
          ly = k.y - h * f;
          ctx.lineTo(lx, ly);
          if (i % 2 === 0) {
            ctx.stroke();
            ctx.fillStyle = ctx.strokeStyle;
            ellipse(lx + (i % 4 ? 5 : -5), ly + 3, 5, 2.5, i % 4 ? 0.5 : -0.5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(lx, ly);
          }
        }
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
  }

  function drawLilyPads() {
    for (const p of level.platforms) {
      if (p.axis !== 'pad') continue;
      const cx = p.x + p.w / 2, cy = p.y + 4;
      if (cx < cam.x - 40 || cx > cam.x + W + 40) continue;
      ctx.fillStyle = 'rgba(0, 40, 30, 0.25)';
      ellipse(cx, cy + 3, 25, 7);
      ctx.fill();
      ctx.fillStyle = '#4caf50';
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.ellipse(cx, cy, 24, 7, 0, p.notch + 0.35, p.notch + Math.PI * 2 - 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(210, 255, 200, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const a of [1.2, 2.3, 3.4, 4.5]) {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a + p.notch) * 18, cy + Math.sin(a + p.notch) * 5);
      }
      ctx.stroke();
      if (p.flower) {
        const fx = cx - 9, fy = cy - 2;
        ctx.fillStyle = '#ff9ec8';
        for (let i = -2; i <= 2; i++) {
          ellipse(fx + i * 2.5, fy - 1 + Math.abs(i), 2.2, 5, i * 0.45);
          ctx.fill();
        }
        ctx.fillStyle = '#ffe066';
        circle(fx, fy + 2, 1.8);
        ctx.fill();
      }
    }
  }

  // --- Objects --------------------------------------------------------------
  function drawCheckpoints() {
    for (const c of level.checkpoints) {
      const bx = c.x + 6, top = c.y + 6;
      ctx.fillStyle = '#7b5a3a';
      ctx.fillRect(bx, top, 4, c.h - 6);
      const wave = Math.sin(time * 6) * 2 + c.wave * 6 * Math.sin(time * 30);
      ctx.fillStyle = c.active ? '#5ee07a' : '#c9c1b5';
      ctx.beginPath();
      ctx.moveTo(bx + 4, top);
      ctx.quadraticCurveTo(bx + 16, top + 4 + wave, bx + 26, top + 7 + wave);
      ctx.lineTo(bx + 4, top + 16);
      ctx.fill();
      ctx.fillStyle = c.active ? '#ffe066' : '#9e968b';
      circle(bx + 2, top, 4);
      ctx.fill();
    }
  }

  function drawSigns() {
    for (const sign of level.signs) {
      if (sign.kind === 'snail') {
        drawSnailDuo(sign.x + T / 2 + sign.crawl, sign.y + T, 1.2, time * 0.4, true);
        continue;
      }
      if (sign.kind !== 'post') continue;
      const x = sign.x, y = sign.y;
      ctx.fillStyle = '#7b5a3a';
      ctx.fillRect(x + 14, y + 16, 4, 16);
      ctx.fillStyle = '#c98f55';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 1, 26, 18, 4);
      ctx.fill();
      ctx.strokeStyle = '#6d4526';
      ctx.lineWidth = 2;
      ctx.stroke();
      const bob = sign.read ? 0 : Math.sin(time * 5) * 1.5;
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = sign.read ? '#6d4526' : '#fff3a0';
      ctx.fillText(sign.read ? '?' : '!', x + 16, y + 11 + bob);
    }
  }

  function wrapText(str, maxWidth) {
    const words = str.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawSignBubbles() {
    ctx.font = `15px ${FONT}`;
    for (const sign of level.signs) {
      if (sign.show <= 0) continue;
      // Text may be a { key, touch, pad } set so hints match the controls in use.
      const txt = typeof sign.text === 'string' ? sign.text : hint(sign.text.key, sign.text.touch, sign.text.pad || sign.text.key);
      if (!sign.lines || sign.linesFor !== txt) {
        sign.lines = wrapText(txt, 280);
        sign.linesFor = txt;
      }
      const lineH = 20;
      const bw = Math.max(...sign.lines.map((l) => ctx.measureText(l).width)) + 28;
      const bh = sign.lines.length * lineH + 18;
      const cx = sign.x + T / 2 + (sign.crawl || 0);
      const bx = clamp(cx - bw / 2, cam.x + 10, cam.x + W - bw - 10);
      const lift = sign.kind === 'snail' ? 40 : sign.kind === 'escort' ? 62 : 0;
      const by = sign.y - bh - 18 - lift + (1 - sign.show) * 8;
      ctx.globalAlpha = sign.show;
      ctx.fillStyle = 'rgba(255, 253, 240, 0.97)';
      ctx.strokeStyle = '#6d4526';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 12);
      ctx.fill();
      ctx.stroke();
      // Tail pointing at the sign
      ctx.beginPath();
      ctx.moveTo(cx - 8, by + bh - 1);
      ctx.lineTo(cx, by + bh + 10);
      ctx.lineTo(cx + 8, by + bh - 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 8, by + bh);
      ctx.lineTo(cx, by + bh + 10);
      ctx.lineTo(cx + 8, by + bh);
      ctx.stroke();
      ctx.fillStyle = '#3b2a1c';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      sign.lines.forEach((l, i) => ctx.fillText(l, bx + 14, by + 9 + lineH / 2 + i * lineH));
    }
    ctx.globalAlpha = 1;
  }

  function drawGoal() {
    const g = level.goal;
    if (!g) return;
    const px = g.x + 10;
    ctx.fillStyle = '#e8e2d0';
    ctx.fillRect(px, g.y, 5, g.h);
    ctx.fillStyle = '#b8b09a';
    ctx.fillRect(px + 3, g.y, 2, g.h);
    // Flag
    const w = Math.sin(time * 4);
    ctx.fillStyle = '#43b36b';
    ctx.beginPath();
    ctx.moveTo(px + 5, g.y + 6);
    ctx.quadraticCurveTo(px + 30, g.y + 2 + w * 4, px + 56, g.y + 10 + w * 3);
    ctx.lineTo(px + 56, g.y + 40 + w * 3);
    ctx.quadraticCurveTo(px + 30, g.y + 32 + w * 4, px + 5, g.y + 38);
    ctx.fill();
    // Lotus on the flag
    const fx = px + 30, fy = g.y + 22 + w * 3;
    ctx.fillStyle = '#ff9ec8';
    for (let i = -2; i <= 2; i++) {
      ellipse(fx + i * 4, fy - 1 + Math.abs(i) * 1.5, 3.2, 8, i * 0.4);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe066';
    circle(fx, fy + 4, 2.5);
    ctx.fill();
    // Finial
    ctx.fillStyle = '#ffd54f';
    circle(px + 2.5, g.y - 2, 5);
    ctx.fill();
    // Lily pad base
    ctx.fillStyle = '#3f9a4a';
    ellipse(px + 2, g.y + g.h - 2, 22, 6);
    ctx.fill();
  }

  function drawPlatforms() {
    for (const p of level.platforms) {
      if (p.axis === 'pad') continue;
      if (p.axis === 'snail') {
        drawSnailDuo(p.baseX, p.groundY, ESCORT_SCALE, p.anim, p.moving);
        continue;
      }
      const x = Math.round(p.x), y = Math.round(p.y);
      ctx.fillStyle = '#7a4f2e';
      ctx.beginPath();
      ctx.roundRect(x, y, p.w, p.h, 8);
      ctx.fill();
      ctx.fillStyle = '#9b6b40';
      ctx.fillRect(x + 6, y + 2, p.w - 12, 4);
      ctx.strokeStyle = '#5a3820';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 9); ctx.lineTo(x + 40, y + 9);
      ctx.moveTo(x + 52, y + 11); ctx.lineTo(x + 76, y + 11);
      ctx.stroke();
      ctx.fillStyle = '#d1a574';
      ellipse(x + p.w - 5, y + p.h / 2, 4, 7);
      ctx.fill();
      ctx.strokeStyle = '#9b6b40';
      ellipse(x + p.w - 5, y + p.h / 2, 2, 3.5);
      ctx.stroke();
      // Moss
      ctx.fillStyle = '#6fae4a';
      ctx.fillRect(x + 10, y, 14, 3);
      ctx.fillRect(x + 60, y, 10, 3);
    }
  }

  // One snail, facing right, with its foot on (0, 0). Units are pre-scale pixels.
  function drawSnail(c, t, moving) {
    const stretch = moving ? 1 + Math.sin(t * 6) * 0.04 : 1;
    const look = Math.sin(time * 1.3 + c.seed) * 1.5;
    ctx.save();
    ctx.scale(stretch, 1);
    ctx.lineWidth = 1.5;
    // Foot and head
    ctx.fillStyle = c.body;
    ctx.strokeStyle = c.bodyEdge;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-29, -6, -18, -7);
    ctx.lineTo(16, -7);
    ctx.quadraticCurveTo(21, -8, 23, -15);
    ctx.quadraticCurveTo(27, -23, 32, -16);
    ctx.quadraticCurveTo(35, -8, 31, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Eye stalks
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(26, -19); ctx.lineTo(24 + look, -30);
    ctx.moveTo(30, -19); ctx.lineTo(33 + look, -29);
    ctx.stroke();
    for (const [ex, ey] of [[24 + look, -30], [33 + look, -29]]) {
      ctx.fillStyle = '#fff';
      circle(ex, ey, 2.6);
      ctx.fill();
      ctx.fillStyle = '#222';
      circle(ex + 0.8, ey, 1.3);
      ctx.fill();
    }
    // Smile
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(30, -14, 2.5, 0.2, Math.PI - 0.6);
    ctx.stroke();
    // Shell with a spiral
    const cx = -4, cy = -18, r = 15;
    ctx.fillStyle = c.shell;
    ctx.strokeStyle = c.shellEdge;
    ctx.lineWidth = 1.5;
    circle(cx, cy, r);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4; a += 0.2) {
      const rr = r * 0.82 * (1 - a / (Math.PI * 4.4));
      const px = cx + Math.cos(a + 1) * rr, py = cy + Math.sin(a + 1) * rr;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ellipse(cx - 6, cy - 8, 5, 3, -0.5);
    ctx.fill();
    ctx.restore();
  }

  const MOSSBACK = { body: '#c9b48a', bodyEdge: '#8c7650', shell: '#c0743a', shellEdge: '#7a4420', seed: 0 };
  const PIP = { body: '#d9e8a2', bodyEdge: '#8aa05a', shell: '#e87aa8', shellEdge: '#a34470', seed: 2 };

  // Pip riding Mossback. (bx, gy) is Mossback's foot on the ground.
  function drawSnailDuo(bx, gy, s, t, moving) {
    ctx.save();
    ctx.translate(bx, gy);
    ctx.scale(s, s);
    // Moss on the shell, then the big snail
    drawSnail(MOSSBACK, t, moving);
    ctx.fillStyle = '#6fae4a';
    ellipse(-8, -32, 6, 2.5, -0.2);
    ctx.fill();
    // Pip perched on the front of the shell, with a little red scarf
    ctx.save();
    ctx.translate(4, -31);
    ctx.rotate(0.35);
    ctx.scale(0.45, 0.45);
    drawSnail(PIP, t + 1, moving);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(20, -14, 8, 4);
    ctx.beginPath();
    ctx.moveTo(20, -13);
    ctx.lineTo(12 - Math.abs(Math.sin(time * 5)) * 3, -16 + Math.sin(time * 7) * 2);
    ctx.lineTo(13, -9);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawGoldenLily(x, y, s, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 2.5) * 2);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(255, 230, 120, 0.3)';
    circle(0, 0, 16);
    ctx.fill();
    ctx.fillStyle = '#3f9a4a';
    ellipse(0, 8, 13, 4);
    ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.strokeStyle = '#c79a00';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ellipse(i * 3.6, 1 + Math.abs(i) * 1.6, 3.4, 8.5, i * 0.42);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#fff8d6';
    circle(0, 5, 2.4);
    ctx.fill();
    ctx.restore();
  }

  function drawLilies() {
    for (const l of level.lilies) {
      if (!l.taken) drawGoldenLily(l.x + l.w / 2, l.y + l.h / 2, 1, l.phase);
    }
  }

  // A wooden ring hanging from a vine. The one the tongue would grab pulses.
  function drawHooks() {
    for (const h of level.hooks) {
      if (h.x < cam.x - 60 || h.x > cam.x + W + 60) continue;
      // Vine up to whatever is above (or the top of the level)
      let top = h.ty - 1;
      while (top >= 0 && !solidAt(h.tx, top) && h.ty - top < 8) top--;
      const vineTop = top >= 0 && solidAt(h.tx, top) ? (top + 1) * T : h.y - 7 * T;
      const sway = Math.sin(time * 1.3 + h.tx) * 3;
      ctx.strokeStyle = '#3f7d3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(h.x, vineTop);
      ctx.quadraticCurveTo(h.x + sway, (vineTop + h.y) / 2, h.x, h.y - 8);
      ctx.stroke();
      ctx.fillStyle = '#5fae4a';
      for (let y = vineTop + 18; y < h.y - 14; y += 22) {
        ellipse(h.x + ((y / 22) % 2 ? 5 : -5), y, 5, 2.5, (y / 22) % 2 ? 0.5 : -0.5);
        ctx.fill();
      }
      const target = level.targetHook === h || player.tongue.hook === h;
      if (target) {
        ctx.strokeStyle = `rgba(255, 236, 130, ${0.55 + Math.sin(time * 10) * 0.35})`;
        ctx.lineWidth = 3;
        circle(h.x, h.y, 13);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6d4526';
      ctx.lineWidth = 5;
      circle(h.x, h.y, 8);
      ctx.stroke();
      ctx.strokeStyle = '#c98f55';
      ctx.lineWidth = 2;
      circle(h.x, h.y, 8);
      ctx.stroke();
    }
  }

  function drawFireflies() {
    for (const ff of level.fireflies) {
      if (ff.eaten) continue;
      const pulse = 0.6 + 0.4 * Math.sin(ff.phase * 4);
      ctx.fillStyle = `rgba(230, 255, 140, ${0.35 * pulse})`;
      circle(ff.x, ff.y, 6);
      ctx.fill();
      ctx.fillStyle = '#f4ff9e';
      circle(ff.x, ff.y, 2.4);
      ctx.fill();
    }
  }

  // Night levels: everything is dark except pools of light around the frog, fireflies,
  // hooks, checkpoints, the goal and a few other things you need to find.
  let lightCanvas = null, lightCtx = null;
  function sceneLights() {
    const lights = [];
    const c = frogCenter(player);
    const glow = Math.min(1, player.glow / 5);
    lights.push({ x: c.x, y: c.y, r: 95 + glow * 90, glow: glow > 0, glowR: 30 + glow * 40, glowA: glow * 0.3 });
    for (const ff of level.fireflies) {
      if (!ff.eaten) lights.push({ x: ff.x, y: ff.y, r: 100 + Math.sin(ff.phase * 4) * 10, glow: true });
    }
    for (const h of level.hooks) lights.push({ x: h.x, y: h.y, r: 48 });
    for (const cp of level.checkpoints) lights.push({ x: cp.x + 8, y: cp.y + 12, r: cp.active ? 85 : 45 });
    if (level.goal) lights.push({ x: level.goal.x + 30, y: level.goal.y + 30, r: 140 });
    for (const f of level.flies) if (!f.eaten) lights.push({ x: f.x + f.w / 2, y: f.y + f.h / 2, r: 24 });
    for (const l of level.lilies) if (!l.taken && lilyVisible(l)) lights.push({ x: l.x + l.w / 2, y: l.y + l.h / 2, r: 60 });
    for (const sign of level.signs) if (sign.kind === 'snail') lights.push({ x: sign.x + T / 2, y: sign.y, r: 70 });
    return lights;
  }

  function drawDarkness(ox, oy) {
    if (!lightCanvas) {
      lightCanvas = document.createElement('canvas');
      lightCtx = lightCanvas.getContext('2d');
    }
    if (lightCanvas.width !== canvas.width || lightCanvas.height !== canvas.height) {
      lightCanvas.width = canvas.width;
      lightCanvas.height = canvas.height;
    }
    const l = lightCtx;
    l.setTransform(dpr, 0, 0, dpr, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, W, H);
    const shade = l.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(3, 6, 20, 0.5)');
    shade.addColorStop(0.55, 'rgba(3, 6, 20, 0.9)');
    shade.addColorStop(1, 'rgba(3, 6, 20, 0.94)');
    l.fillStyle = shade;
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    const lights = sceneLights();
    for (const lt of lights) {
      const x = lt.x + ox, y = lt.y + oy;
      if (x < -lt.r || x > W + lt.r || y < -lt.r || y > H + lt.r) continue;
      const g = l.createRadialGradient(x, y, 0, x, y, lt.r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.45, 'rgba(0,0,0,0.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g;
      l.beginPath();
      l.arc(x, y, lt.r, 0, Math.PI * 2);
      l.fill();
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
    // A warm glow on top of the fireflies
    ctx.globalCompositeOperation = 'lighter';
    for (const lt of lights) {
      if (!lt.glow) continue;
      const x = lt.x + ox, y = lt.y + oy;
      const gr = lt.glowR || 40;
      if (x < -gr || x > W + gr || y < -gr || y > H + gr) continue;
      const g = ctx.createRadialGradient(x, y, 0, x, y, gr);
      g.addColorStop(0, `rgba(220, 255, 140, ${lt.glowA !== undefined ? lt.glowA : 0.35})`);
      g.addColorStop(1, 'rgba(220, 255, 140, 0)');
      ctx.fillStyle = g;
      circle(x, y, gr);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawFlies() {
    for (const f of level.flies) {
      if (f.eaten) continue;
      drawFly(f.x + f.w / 2, f.y + f.h / 2, f.phase);
    }
  }

  function drawFly(x, y, phase) {
    const flap = Math.abs(Math.sin(phase * 40));
    ctx.fillStyle = 'rgba(255, 245, 160, 0.35)';
    circle(x, y, 9);
    ctx.fill();
    ctx.fillStyle = 'rgba(235, 245, 255, 0.85)';
    ellipse(x - 2, y - 4, 4, 2.5 * flap + 0.5, -0.4);
    ctx.fill();
    ellipse(x + 2, y - 4, 4, 2.5 * flap + 0.5, 0.4);
    ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ellipse(x, y, 4, 3);
    ctx.fill();
    ctx.fillStyle = '#e53935';
    circle(x + 3, y - 1, 1.3);
    ctx.fill();
  }

  function drawEnemies() {
    for (const e of level.enemies) {
      if (e.dead) continue;
      if (e.kind === 'beetle') drawBeetle(e);
      else if (e.kind === 'wasp') drawWasp(e);
      else if (e.kind === 'fish' || e.kind === 'swimmer') drawFish(e);
      else if (e.kind === 'squirrel') drawSquirrel(e);
      else if (e.kind === 'acorn') drawAcorn(e);
    }
  }

  function drawBeetle(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.scale(e.dir, e.squashed > 0 ? 0.4 : 1);
    // Legs
    ctx.strokeStyle = '#2d1b4e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const k = Math.sin(e.anim + i * 2) * 3;
      ctx.beginPath();
      ctx.moveTo(-6 + i * 6, -4);
      ctx.lineTo(-8 + i * 6 + k, 0);
      ctx.stroke();
    }
    // Shell
    ctx.fillStyle = '#6a3fb5';
    ctx.strokeStyle = '#3b1f73';
    ellipse(-1, -9, 12, 8.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(-4, -13, 5, 2.2, -0.2);
    ctx.fill();
    ctx.strokeStyle = '#3b1f73';
    ctx.beginPath();
    ctx.moveTo(-1, -17.5);
    ctx.quadraticCurveTo(2, -9, -1, -1);
    ctx.stroke();
    // Head
    ctx.fillStyle = '#2d1b4e';
    circle(11, -7, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(13, -8, 1.6);
    ctx.fill();
    ctx.strokeStyle = '#2d1b4e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(13, -11); ctx.lineTo(18, -16);
    ctx.moveTo(11, -11); ctx.lineTo(14, -17);
    ctx.stroke();
    ctx.restore();
  }

  function drawWasp(e) {
    const t = e.t || 0;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.scale(e.dir, e.squashed > 0 ? 0.4 : 1);
    // Wings
    const flap = Math.abs(Math.sin(t * 40));
    ctx.fillStyle = 'rgba(220, 240, 255, 0.75)';
    ellipse(-2, -9, 6, 4 * flap + 1, -0.3);
    ctx.fill();
    ellipse(3, -9, 5, 3.5 * flap + 1, 0.3);
    ctx.fill();
    // Stinger
    ctx.fillStyle = '#3a2a00';
    ctx.beginPath();
    ctx.moveTo(-10, -1); ctx.lineTo(-17, 2); ctx.lineTo(-10, 3);
    ctx.fill();
    // Body with stripes
    ctx.save();
    ellipse(0, 0, 11, 7);
    ctx.fillStyle = '#ffcc33';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#2b2100';
    ctx.fillRect(-6, -8, 3.5, 16);
    ctx.fillRect(0, -8, 3.5, 16);
    ctx.restore();
    ctx.strokeStyle = '#7a5600';
    ctx.lineWidth = 1.5;
    ellipse(0, 0, 11, 7);
    ctx.stroke();
    // Head
    ctx.fillStyle = '#2b2100';
    circle(11, -1, 5);
    ctx.fill();
    ctx.fillStyle = '#ff5252';
    circle(13, -2, 1.8);
    ctx.fill();
    ctx.restore();
  }

  const FISH_COLORS = {
    fish: { fin: '#e65100', body: '#ff7043', edge: '#bf360c', belly: '#ffab91' },
    swimmer: { fin: '#3b5bdb', body: '#5c7cfa', edge: '#2b3f99', belly: '#c5d0ff' },
  };

  function drawFish(e) {
    const c = FISH_COLORS[e.kind];
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    if (e.dodge > 0) ctx.translate(Math.sin(time * 70) * 2.5, 0);
    if (e.kind === 'swimmer') {
      ctx.scale(e.dir, 1);
      ctx.rotate(Math.cos(e.t * 2) * 0.12);
    } else {
      const angle = e.jumping ? clamp(e.vy / 900, -1, 1) * 1.2 : 0;
      ctx.rotate(-Math.PI / 2 + angle * 0.8);
    }
    if (e.squashed > 0) ctx.scale(1, 0.4);
    // Tail
    ctx.fillStyle = c.fin;
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(-17, -7); ctx.lineTo(-17, 7);
    ctx.fill();
    // Body
    ctx.fillStyle = c.body;
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.5;
    ellipse(0, 0, 12, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.belly;
    ellipse(2, 3, 7, 3);
    ctx.fill();
    // Fin
    ctx.fillStyle = c.fin;
    ctx.beginPath();
    ctx.moveTo(-3, -7); ctx.lineTo(3, -12); ctx.lineTo(5, -7);
    ctx.fill();
    // Eye & teeth
    ctx.fillStyle = '#fff';
    circle(6, -2, 3);
    ctx.fill();
    ctx.fillStyle = '#000';
    circle(7, -2, 1.5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(10, 2); ctx.lineTo(11, 4.5); ctx.lineTo(12, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const p = player;
    if (p.invuln > 0 && state === 'playing' && Math.floor(time * 16) % 2 === 0) return;

    // Tongue
    const tg = p.tongue;
    if (tg.state !== 'idle') {
      const m = mouthPos(p);
      const tipX = m.x + tg.ax * tg.len, tipY = m.y + tg.ay * tg.len;
      ctx.strokeStyle = '#e0577a';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = '#ff7fa0';
      circle(tipX, tipY, 5);
      ctx.fill();
      ctx.lineCap = 'butt';
    }
    // Something caught on the tongue follows the tip
    if (tg.caught) {
      const c = tg.caught;
      if (c.kind === 'beetle') drawBeetle(c);
      else if (c.kind === 'wasp') drawWasp(c);
      else if (c.kind === 'fish' || c.kind === 'swimmer') drawFish(c);
      else if (c.kind === 'squirrel') drawSquirrel(c);
      else if (c.kind === 'acorn') drawAcorn(c);
    }

    const air = !p.grounded && !p.inWater;
    let sx = 1 / Math.sqrt(p.squash), sy = p.squash;
    if (air) {
      const stretch = clamp(-p.vy / 1400, -0.12, 0.2);
      sy *= 1 + stretch;
      sx *= 1 - stretch * 0.6;
    }
    drawFrog(p.x + p.w / 2, p.y + p.h, p.facing, {
      sx, sy,
      air,
      swim: p.inWater,
      blink: p.blink > 0,
      mouthOpen: tg.state !== 'idle',
      dead: !!p.dead,
      hop: p.grounded ? Math.abs(Math.sin(p.walkAnim)) * (Math.abs(p.vx) > 20 ? 3 : 0) : 0,
      swimKick: p.inWater ? Math.sin(time * 8) : 0,
    });
  }

  // A cute side-view frog. Origin is bottom-centre, facing right.
  function drawFrog(x, y, facing, o) {
    const G = '#5bbf4a', GD = '#2f7d32', BELLY = '#e8f5c8';
    ctx.save();
    ctx.translate(x, y - (o.hop || 0));
    if (o.dead) {
      ctx.translate(0, -12);
      ctx.rotate(Math.PI);
      ctx.translate(0, 12);
    }
    ctx.scale(facing * o.sx, o.sy);
    ctx.lineWidth = 2;
    ctx.strokeStyle = GD;
    ctx.lineJoin = 'round';

    // Back leg
    ctx.fillStyle = G;
    if (o.air || o.swim) {
      const k = o.swim ? o.swimKick * 0.4 : 0;
      ellipse(-11, -5, 8, 4, 0.6 + k);
      ctx.fill(); ctx.stroke();
      ellipse(-18, -1 + k * 6, 6, 2.5, 0.2);
      ctx.fill(); ctx.stroke();
    } else {
      ellipse(-6, -1.8, 8, 2.5);
      ctx.fill(); ctx.stroke();
      ellipse(-8, -6.5, 7.5, 6);
      ctx.fill(); ctx.stroke();
    }

    // Body
    ctx.fillStyle = G;
    ellipse(1, -10, 13, 9.5, -0.12);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = BELLY;
    ellipse(5, -6.5, 7.5, 4.2, -0.25);
    ctx.fill();
    ctx.fillStyle = 'rgba(47,125,50,0.55)';
    circle(-6, -13, 2); ctx.fill();
    circle(-1.5, -16, 1.5); ctx.fill();
    circle(-9, -9, 1.3); ctx.fill();

    // Front arm
    ctx.fillStyle = G;
    if (o.air) ellipse(10, -4, 2.8, 4.5, -0.6);
    else ellipse(8, -2.5, 2.8, 4);
    ctx.fill(); ctx.stroke();

    // Eyes
    for (const ex of [-2, 8]) {
      ctx.fillStyle = G;
      circle(ex, -18, 5.6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff';
      circle(ex + 0.5, -18.5, 4);
      ctx.fill();
      if (o.dead) {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ex - 2, -20.5); ctx.lineTo(ex + 3, -16.5);
        ctx.moveTo(ex + 3, -20.5); ctx.lineTo(ex - 2, -16.5);
        ctx.stroke();
        ctx.strokeStyle = GD;
        ctx.lineWidth = 2;
      } else if (o.blink) {
        ctx.fillStyle = G;
        ctx.fillRect(ex - 4, -22.5, 9, 6);
        ctx.strokeStyle = GD;
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, -17.5); ctx.lineTo(ex + 4.5, -17.5);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#1b1b1b';
        circle(ex + 2, -18.5, 2.1);
        ctx.fill();
        ctx.fillStyle = '#fff';
        circle(ex + 2.8, -19.5, 0.8);
        ctx.fill();
      }
    }

    // Mouth
    if (o.mouthOpen) {
      ctx.fillStyle = '#8e2440';
      ellipse(11, -9.5, 3.5, 2.5);
      ctx.fill();
    } else {
      ctx.strokeStyle = GD;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, -10.5);
      ctx.quadraticCurveTo(9, -7.5, 13.5, -10.5);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.55)';
    circle(9, -12.5, 1.8);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (const pt of particles) {
      if (pt.bubble) {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 1.2;
        circle(pt.x, pt.y, pt.size);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        circle(pt.x - pt.size * 0.35, pt.y - pt.size * 0.35, pt.size * 0.3);
        ctx.fill();
        continue;
      }
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      circle(pt.x, pt.y, pt.size);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups() {
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Trebuchet MS", system-ui, sans-serif';
    for (const pu of popups) {
      ctx.globalAlpha = clamp(pu.life / 0.5, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText(pu.text, pu.x + 1, pu.y + 1);
      ctx.fillStyle = pu.color;
      ctx.fillText(pu.text, pu.x, pu.y);
    }
    ctx.globalAlpha = 1;
  }

  // --- HUD & overlays -------------------------------------------------------
  function text(str, x, y, size, color = '#fff', align = 'left', weight = 'bold') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(str, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function heart(x, y, s, full) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-10, -3, -6, -12, 0, -6);
    ctx.bezierCurveTo(6, -12, 10, -3, 0, 4);
    ctx.fillStyle = full ? '#ff5a78' : 'rgba(0,0,0,0.25)';
    ctx.fill();
    ctx.strokeStyle = full ? '#b3203d' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function drawHud() {
    // Panel
    ctx.fillStyle = 'rgba(20, 40, 30, 0.35)';
    ctx.beginPath();
    ctx.roundRect(12, 10, level.lilies.length ? 336 : 300, 44, 12);
    ctx.fill();
    for (let i = 0; i < MAX_HEARTS; i++) heart(34 + i * 30, 34, 1.5, i < player.hearts);
    if (level.lilies.length) {
      // Gold when taken this run; a faint outline if found on an earlier visit.
      const taken = level.lilies.every((l) => l.taken);
      ctx.globalAlpha = taken ? 1 : foundLilies.has(level.name) ? 0.45 : 0.18;
      drawGoldenLily(322, 30, 0.85, taken ? time : 0);
      ctx.globalAlpha = 1;
    }

    // The heron's remaining hits
    if (level.boss && !level.boss.defeated) {
      const b = level.boss;
      ctx.fillStyle = 'rgba(40, 20, 40, 0.45)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 110, 64, 220, 30, 10);
      ctx.fill();
      text('HERON', W / 2 - 60, 79, 15, '#f3e6ff', 'center');
      for (let i = 0; i < b.maxHp; i++) {
        ctx.fillStyle = i < b.hp ? '#e0566f' : 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 18 + i * 34, 72, 28, 14, 5);
        ctx.fill();
      }
    }

    // Lives: little frog face
    drawFrog(145, 44, 1, { sx: 0.8, sy: 0.8 });
    text(inTutorial ? '×∞' : '×' + Math.max(0, lives), 163, 33, 20);

    drawFly(225, 32, time);
    text(`${level.fliesEaten}/${level.flyTotal}`, 238, 33, 20);

    ctx.fillStyle = 'rgba(20, 40, 30, 0.35)';
    ctx.beginPath();
    ctx.roundRect(W - 232, 10, 220, 44, 12);
    ctx.fill();
    text(String(score).padStart(6, '0'), W - 24, 33, 24, '#fff', 'right');
    text(formatTime(level.time), W - 218, 33, 18, '#dff5e3', 'left');

    if (audio.muted) {
      if (touchMode && !padMode) text('🔇 muted', 24, 70, 13, '#fff', 'left', 'normal');
      else if (W < 860) text(padMode ? '🔇 muted' : '🔇 muted (M)', 24, 70, 13, '#fff', 'left', 'normal');
      else text(padMode ? '🔇 muted' : '🔇 muted (M)', W / 2, 30, 14, '#fff', 'center', 'normal');
    }
    if (devRun) {
      const tag = devInvincible ? 'DEV · INVINCIBLE' : 'DEV';
      ctx.font = `bold 12px ${FONT}`;
      const tw = ctx.measureText(tag).width + 16;
      ctx.fillStyle = 'rgba(200, 60, 90, 0.85)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - tw / 2, 50, tw, 20, 10);
      ctx.fill();
      text(tag, W / 2, 60, 12, '#fff', 'center');
    }

    if (banner > 0) {
      ctx.globalAlpha = clamp(banner, 0, 1);
      text(inTutorial ? 'Tutorial' : `Level ${levelIndex + 1}`, W / 2, 110, 22, '#fff8d6', 'center');
      text(level.name, W / 2, 148, 44, '#ffffff', 'center');
      ctx.globalAlpha = 1;
    }
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function panel(w, h) {
    ctx.fillStyle = 'rgba(10, 25, 20, 0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1f4a31';
    ctx.strokeStyle = '#9be07d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect((W - w) / 2, (H - h) / 2, w, h, 20);
    ctx.fill();
    ctx.stroke();
  }

  function blinkPrompt(str, y) {
    if (Math.floor(time * 2) % 2 === 0) text(str, W / 2, y, 20, '#ffe066', 'center');
  }

  let menuHitboxes = [];
  function drawMenu(items, y, width = 260, spacing = 44) {
    // Hitboxes are kept in view coordinates, so undo any UI scaling or offset in effect.
    const m = ctx.getTransform(), k = m.a / dpr, mx = m.e / dpr, my = m.f / dpr;
    menuHitboxes = items.map((_, i) => ({
      x: mx + k * (W / 2 - width / 2), y: my + k * (y + i * spacing - spacing / 2 + 2), w: k * width, h: k * (spacing - 4),
    }));
    items.forEach((label, i) => {
      const yy = y + i * spacing;
      const selected = i === menuIndex;
      if (selected) {
        ctx.fillStyle = 'rgba(155, 224, 125, 0.28)';
        ctx.strokeStyle = '#9be07d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(W / 2 - width / 2, yy - 18, width, 36, 12);
        ctx.fill();
        ctx.stroke();
      }
      text(selected ? `▸  ${label}  ◂` : label, W / 2, yy, 22, selected ? '#ffe066' : '#dff5e3', 'center');
    });
  }

  function drawOverlay() {
    if (state === 'paused') {
      panel(420, 380);
      text('Paused', W / 2, H / 2 - 135, 44, '#fff', 'center');
      drawMenu(pauseItems(), H / 2 - 70, 260, 42);
      text(hint('↑ ↓ choose · Enter select · P resume', 'Tap an option', '↑ ↓ choose · A select · B resume'), W / 2, H / 2 + 160, 14, '#b9d8c0', 'center', 'normal');
    } else if (state === 'complete' && inTutorial) {
      panel(480, 260);
      text('Tutorial Complete!', W / 2, H / 2 - 80, 38, '#ffe066', 'center');
      text("You're ready for the big pond, little frog.", W / 2, H / 2 - 28, 19, '#fff', 'center', 'normal');
      text(`Flies eaten: ${level.fliesEaten} / ${level.flyTotal}`, W / 2, H / 2 + 4, 19, '#fff', 'center', 'normal');
      if (stateTimer <= 0) {
        blinkPrompt(hint('Press Enter to start the adventure', 'Tap to start the adventure', 'Press A to start the adventure'), H / 2 + 60);
        const back = hint('Esc: back to title', null, 'Start: back to title');
        if (back) text(back, W / 2, H / 2 + 94, 14, '#b9d8c0', 'center', 'normal');
      }
    } else if (state === 'complete') {
      panel(460, 340);
      const b = level.bonus;
      text('Level Complete!', W / 2, H / 2 - 125, 38, '#ffe066', 'center');
      text(`Flies eaten: ${level.fliesEaten} / ${level.flyTotal}`, W / 2, H / 2 - 70, 20, '#fff', 'center', 'normal');
      text(`Time: ${formatTime(level.time)}   +${b.time}`, W / 2, H / 2 - 38, 20, '#fff', 'center', 'normal');
      text(`Hearts left: ${player.hearts}   +${b.hearts}`, W / 2, H / 2 - 6, 20, '#fff', 'center', 'normal');
      if (level.lilies.length) {
        const got = level.lilies.every((l) => l.taken);
        text(got ? 'Golden lily: found!  +1000' : 'Golden lily: still hidden somewhere…', W / 2, H / 2 + 26, 20,
          got ? '#ffe066' : '#b9d8c0', 'center', got ? 'bold' : 'normal');
      }
      if (b.allFlies) text(`All flies bonus!  +${b.allFlies}`, W / 2, H / 2 + 58, 20, '#b9f6ca', 'center');
      if (stateTimer <= 0) {
        blinkPrompt(hint('Press Enter to continue', 'Tap to continue', 'Press A to continue'), H / 2 + 108);
        const quit = hint('Esc: quit to title', null, 'Start: quit to title');
        if (quit) text(quit, W / 2, H / 2 + 138, 13, '#b9d8c0', 'center', 'normal');
      }
    } else if (state === 'gameover') {
      panel(420, 240);
      text('Game Over', W / 2, H / 2 - 60, 44, '#ff8a80', 'center');
      text(`Score: ${score}`, W / 2, H / 2, 22, '#fff', 'center');
      text(`Best: ${highScore}`, W / 2, H / 2 + 32, 18, '#dff5e3', 'center', 'normal');
      if (stateTimer <= 0) blinkPrompt(hint('Press Enter', 'Tap to continue', 'Press A'), H / 2 + 80);
    } else if (state === 'victory') {
      panel(540, 340);
      text('You saved the pond!', W / 2, H / 2 - 120, 38, '#ffe066', 'center');
      drawFrog(W / 2 - 60, H / 2 - 30 - Math.abs(Math.sin(time * 5)) * 16, 1, { sx: 2.2, sy: 2.2 });
      drawSnailDuo(W / 2 + 70, H / 2 - 30, 1.3, time * 0.4, true);
      text('Pip: "We saved you a seat!"', W / 2, H / 2 + 8, 17, '#f8d6e6', 'center', 'normal');
      text(`Final score: ${score}`, W / 2, H / 2 + 46, 24, '#fff', 'center');
      text(`Best: ${highScore}`, W / 2, H / 2 + 78, 18, '#dff5e3', 'center', 'normal');
      if (justUnlocked) text('Level select unlocked on the title screen!', W / 2, H / 2 + 104, 16, '#b9f6ca', 'center');
      if (stateTimer <= 0) blinkPrompt(hint('Press Enter', 'Tap to continue', 'Press A'), H / 2 + (justUnlocked ? 138 : 128));
    }
  }

  function drawSelectScreen() {
    ctx.fillStyle = THEMES.meadow.dirt;
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = THEMES.meadow.grass;
    ctx.fillRect(0, H - 70, W, 8);
    const items = selectItems();
    const gap = 36;
    panel(520, 116 + items.length * gap);
    const top = H / 2 - (116 + items.length * gap) / 2;
    text('Level Select', W / 2, top + 36, 32, '#ffe066', 'center');
    drawMenu(items, top + 84, 400, gap);
    // A golden lily beside each level whose lily has been found
    const defs = [window.TUTORIAL, ...window.LEVELS];
    defs.forEach((d, i) => {
      if (!levelHasLily(d)) return;
      const y = top + 84 + i * gap;
      ctx.globalAlpha = foundLilies.has(d.name) ? 1 : 0.2;
      drawGoldenLily(W / 2 + 176, y, 0.62, foundLilies.has(d.name) ? time : 0);
      ctx.globalAlpha = 1;
    });
    const lilies = lilyTotals();
    text(`Golden lilies found: ${lilies.found}/${lilies.total}`, W / 2, top + 84 + items.length * gap - 4, 15, '#f2e3a0', 'center', 'normal');
    text(hint('↑ ↓ choose · Enter play · Esc back', 'Tap a level', '↑ ↓ choose · A play · B back'), W / 2, top + 84 + items.length * gap + 20, 14, '#b9d8c0', 'center', 'normal');
  }

  function drawDevScreen() {
    ctx.fillStyle = THEMES.meadow.dirt;
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = THEMES.meadow.grass;
    ctx.fillRect(0, H - 70, W, 8);
    const items = devItems();
    const gap = 33;
    panel(520, 110 + items.length * gap);
    const top = H / 2 - (110 + items.length * gap) / 2;
    text('Dev Mode', W / 2, top + 36, 32, '#ffe066', 'center');
    drawMenu(items, top + 84, 400, gap);
    text('↑ ↓ choose · Enter start / toggle · Esc back', W / 2, top + 84 + items.length * gap - 6, 14, '#b9d8c0', 'center', 'normal');
  }

  function drawTitle() {
    // Ground strip
    const gy = H - 70;
    for (let x = -((cam.x) % T) - T; x < W + T; x += T) {
      const tx = Math.floor((x + cam.x) / T);
      ctx.fillStyle = THEMES.meadow.dirt;
      ctx.fillRect(x, gy, T, 70);
      ctx.fillStyle = THEMES.meadow.dirtDark;
      const h = hash(tx, 3);
      ctx.fillRect(x + (h % 22) + 3, gy + 24 + ((h >>> 5) % 30), 5, 4);
      ctx.fillStyle = THEMES.meadow.grass;
      ctx.fillRect(x, gy, T, 8);
      ctx.fillStyle = THEMES.meadow.grassLight;
      ctx.fillRect(x, gy, T, 3);
    }

    const hop = Math.abs(Math.sin(time * 3.2));
    const sq = hop < 0.15 ? 0.85 : 1;
    drawFrog(W / 2 - 250, gy - hop * 70, 1, { sx: 3 / Math.sqrt(sq), sy: 3 * sq, air: hop > 0.15 });
    drawFly(W / 2 - 190 + Math.sin(time * 2) * 25, gy - 170 + Math.cos(time * 3) * 15, time);

    // The logo, controls and menu are laid out for a 540-tall screen; keep them centred on a taller one.
    ctx.save();
    ctx.translate(0, (H - 540) / 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2f7d32';
    ctx.lineJoin = 'round';
    ctx.font = `bold 84px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('LILY LEAP', W / 2, 110);
    text('LILY LEAP', W / 2, 110, 84, '#ffffff', 'center');
    text('a frog platformer', W / 2, 168, 22, '#2f5d3a', 'center', 'normal');

    ctx.fillStyle = 'rgba(20, 50, 35, 0.55)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 330, 200, 660, 86, 16);
    ctx.fill();
    const lines = hint([
      ['Move', '← → / A D'],
      ['Jump / Swim', 'Space · Z · ↑ · W'],
      ['Tongue / Hooks', 'X · J · Shift (hold)'],
      ['Drop through plank', '↓ + Jump'],
    ], [
      ['Move', '◀ ▶'],
      ['Jump / Swim', 'Jump'],
      ['Tongue / Hooks', 'Tongue (hold)'],
      ['Drop through plank', '▼ + Jump'],
    ], [
      ['Move', 'D-pad / left stick'],
      ['Jump / Swim', 'A'],
      ['Tongue / Hooks', 'X · B · RB (hold)'],
      ['Drop through plank', '↓ + A'],
    ]);
    lines.forEach(([k, v], i) => {
      const col = i % 2, rowI = Math.floor(i / 2);
      const x = W / 2 - 310 + col * 330;
      const y = 232 + rowI * 34;
      text(k, x, y, 17, '#b9f6ca', 'left');
      text(v, x + 175, y, 17, '#ffffff', 'left', 'normal');
    });
    const items = titleItems();
    // More menu items (Continue, Level select) pack the menu tighter so it still fits above the ground.
    const lay = [
      { tag: 312, box: 340, boxH: 100, first: 368, gap: 44, hint: 455 },
      { tag: 304, box: 322, boxH: 124, first: 346, gap: 38, hint: 460 },
      { tag: 298, box: 310, boxH: 144, first: 332, gap: 33, hint: 466 },
    ][Math.min(items.length, 4) - 2];
    text('Stomp or eat bugs · collect flies · reach the lotus flag', W / 2, lay.tag, 16, '#20452d', 'center', 'normal');
    ctx.fillStyle = 'rgba(20, 50, 35, 0.55)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 160, lay.box, 320, lay.boxH, 16);
    ctx.fill();
    drawMenu(items, lay.first, 280, lay.gap);
    text(hint('↑ ↓ choose · Enter select', 'Tap an option', '↑ ↓ choose · A select'), W / 2, lay.hint, 14, '#20452d', 'center', 'normal');
    ctx.restore();
    if (highScore > 0) text(`Best: ${highScore}`, W - 20, 24, 16, '#20452d', 'right');
    const lilies = lilyTotals();
    if (lilies.found > 0) {
      const label = `Golden lilies: ${lilies.found}/${lilies.total}`;
      ctx.font = `bold 14px ${FONT}`;
      drawGoldenLily(W - 34 - ctx.measureText(label).width, 50, 0.6, time);
      text(label, W - 20, 50, 14, '#20452d', 'right');
    }
    if (padMode) {
      text('Start: pause', 20, 24, 14, '#20452d', 'left', 'normal');
    } else if (!touchMode) {
      text('M: sound  ·  P: pause', 20, 24, 14, '#20452d', 'left', 'normal');
      text('` dev mode', W - 16, H - 18, 13, '#e8d5b5', 'right', 'normal');
    }
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------
  // Phones and tablets get the on-screen controls straight away.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) enableTouchMode();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    pollGamepads();
    while (acc >= STEP) {
      update(STEP);
      keysHit.clear();
      acc -= STEP;
    }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Handy for debugging from the console.
  window.lilyLeap = {
    get state() { return state; },
    get player() { return player; },
    get level() { return level; },
    get song() { return music.current && { name: music.current.name, loop: music.current.loop, intensity: music.intensity }; },
    loadLevel: (i) => { startGame(); loadLevel(i); },
    cameoSpots: () => findCameoSpots(level).map((sp) => [sp.tx, sp.ty]),
    goalCameoSpot: () => goalCameoSpot(level),
    press: (code) => { keysHit.add(code); keysDown.add(code); },
    release: (code) => keysDown.delete(code),
    step: (n = 1) => {
      for (let i = 0; i < n; i++) { update(STEP); keysHit.clear(); }
      render();
    },
    // Renders a song (or a sound effect) offline and measures it, e.g. to balance volumes:
    // await lilyLeap.measure('song', 'meadow', 20) or await lilyLeap.measure('sfx', 'jump').
    measure: async (kind, name, seconds = 2, intensity = 0) => {
      if (!music.compile()) return null;
      const live = { ctx: audio.ctx, master: audio.master, out: music.out, current: music.current, intensity: music.intensity };
      const off = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
      try {
        audio.ctx = off;
        audio.master = off.createGain();
        audio.master.gain.value = 0.22;
        audio.master.connect(off.destination);
        if (kind === 'song') {
          music.out = null;
          music.init();
          music.out.gain.value = MUSIC_VOLUME;
          music.intensity = intensity;
          music.start(name);
          music.current.next = 0;
          music.schedule(seconds);
        } else {
          sfx[name]();
        }
      } finally {
        Object.assign(audio, { ctx: live.ctx, master: live.master });
        Object.assign(music, { out: live.out, current: live.current, intensity: live.intensity });
      }
      const data = (await off.startRendering()).getChannelData(0);
      let peak = 0, sum = 0;
      for (const v of data) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
      return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / data.length).toFixed(4) };
    },
  };
})();
