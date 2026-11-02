import { Settings } from './settingsManager/SettingsManager.js';
import { Gamepad } from './input/GamepadManager.js';

export class Input {
  constructor() {
    this.keys = new Map();
    this.justPressed = new Set();
    this.justReleased = new Set();

    // Action mappings
    this.actions = {
      left: false,
      right: false,
      down: false,
      jump: false,
      jumpJustPressed: false,
      jumpJustReleased: false,
      pulse: false,
      slashJustPressed: false,
      boltJustPressed: false,
      dashJustPressed: false,
      plungeJustPressed: false,
      auraJustPressed: false,
      auraHold: false,
      pauseJustPressed: false,
      muteJustPressed: false,
      interactJustPressed: false,
      f2JustPressed: false,
      skillsJustPressed: false,
      summonJustPressed: false,
      summonHold: false,
      summonQuick1: false,
      summonQuick2: false,
      summonQuick3: false,
      summonQuick4: false,
      summonQuick5: false,
      skillSlot1: false,
      skillSlot2: false,
      skillSlot3: false,
      astralJustPressed: false,
      extractJustPressed: false,
      riseHold: false,
      riseJustPressed: false,
      exchangeJustPressed: false,
      reachHold: false,
      ledgerJustPressed: false
    };

    // Buffer tracking
    this.jumpBufferTimer = 0;

    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling / defaults for game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'Tab', 'F2'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys.get(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.set(e.code, true);

      // Handle jump buffer trigger
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        this.jumpBufferTimer = 0.12; // 120ms
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
      this.justReleased.add(e.code);
    });

    // Reset keys if window loses focus
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.justPressed.clear();
      this.justReleased.clear();
      this.jumpBufferTimer = 0;
    });
  }

  setupTouchListeners() {
    // Touch controls detect touch capability
    const touchContainer = document.getElementById('touch-controls');
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice && touchContainer) {
      touchContainer.style.display = 'flex';
    }

    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;

      const downHandler = (e) => {
        e.preventDefault();
        el.classList.add('active');
        onDown();
      };

      const upHandler = (e) => {
        e.preventDefault();
        el.classList.remove('active');
        onUp();
      };

      el.addEventListener('touchstart', downHandler, { passive: false });
      el.addEventListener('touchend', upHandler, { passive: false });
      el.addEventListener('touchcancel', upHandler, { passive: false });
      el.addEventListener('mousedown', downHandler);
      el.addEventListener('mouseup', upHandler);
      el.addEventListener('mouseleave', upHandler);
    };

    bindTouch('btn-left', () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    bindTouch('btn-right', () => { this.touchRight = true; }, () => { this.touchRight = false; });
    bindTouch('btn-jump', () => {
      this.touchJump = true;
      this.touchJumpJustPressed = true;
      this.jumpBufferTimer = 0.12;
    }, () => {
      this.touchJump = false;
      this.touchJumpJustReleased = true;
    });
    bindTouch('btn-pulse', () => { this.touchPulse = true; }, () => { this.touchPulse = false; });
    bindTouch('btn-slash', () => { this.touchSlashJustPressed = true; }, () => {});
    bindTouch('btn-bolt', () => { this.touchBoltJustPressed = true; }, () => {});
    bindTouch('btn-dash', () => { this.touchDashJustPressed = true; }, () => {});
    bindTouch('btn-plunge', () => { this.touchPlungeJustPressed = true; }, () => {});
    bindTouch('btn-aura', () => { this.touchAuraJustPressed = true; this.touchAuraHold = true; }, () => { this.touchAuraHold = false; });
    bindTouch('btn-summon', () => { this.touchSummonJustPressed = true; }, () => {});
    bindTouch('btn-skills', () => { this.touchSkillsJustPressed = true; }, () => {});
    bindTouch('btn-skill-1', () => { this.touchSkill1JustPressed = true; }, () => {});
    bindTouch('btn-skill-2', () => { this.touchSkill2JustPressed = true; }, () => {});
    bindTouch('btn-skill-3', () => { this.touchSkill3JustPressed = true; }, () => {});
    bindTouch('btn-astral', () => { this.touchAstralJustPressed = true; }, () => {});
    bindTouch('btn-extract', () => { this.touchExtractJustPressed = true; }, () => {});
    bindTouch('btn-rise', () => { this.touchRiseHold = true; this.touchRiseJustPressed = true; }, () => { this.touchRiseHold = false; });
    bindTouch('btn-exchange', () => { this.touchExchangeJustPressed = true; }, () => {});
    bindTouch('btn-reach', () => { this.touchReachHold = true; }, () => { this.touchReachHold = false; });
    bindTouch('btn-ledger', () => { this.touchLedgerJustPressed = true; }, () => {});
  }

  update(dt) {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Poll Gamepad
    const gp = Gamepad.update();

    const k = (code) => !!this.keys.get(code);
    const jp = (code) => this.justPressed.has(code);
    const jr = (code) => this.justReleased.has(code);

    const bindings = Settings.get('keyBindings') || {};
    const checkKeyHold = (action, defaultKeys = []) => {
      const keys = bindings[action] || defaultKeys;
      return keys.some(code => k(code));
    };
    const checkKeyJustPressed = (action, defaultKeys = []) => {
      const keys = bindings[action] || defaultKeys;
      return keys.some(code => jp(code));
    };
    const checkKeyJustReleased = (action, defaultKeys = []) => {
      const keys = bindings[action] || defaultKeys;
      return keys.some(code => jr(code));
    };

    const left = checkKeyHold('moveLeft', ['ArrowLeft', 'KeyA']) || !!this.touchLeft || (gp && gp.left);
    const right = checkKeyHold('moveRight', ['ArrowRight', 'KeyD']) || !!this.touchRight || (gp && gp.right);
    const down = checkKeyHold('crouch', ['ArrowDown', 'KeyS']) || (gp && gp.down);

    const jump = checkKeyHold('jump', ['Space', 'KeyW', 'ArrowUp']) || !!this.touchJump || (gp && gp.jump);
    const jumpJustPressed = checkKeyJustPressed('jump', ['Space', 'KeyW', 'ArrowUp']) || !!this.touchJumpJustPressed || (gp && gp.jumpJustPressed);
    const jumpJustReleased = checkKeyJustReleased('jump', ['Space', 'KeyW', 'ArrowUp']) || !!this.touchJumpJustReleased;

    // Toggle pulse support (accessibility)
    const togglePulseSetting = Settings.get('togglePulse');
    if (togglePulseSetting) {
      if (checkKeyJustPressed('pulse', ['ShiftLeft', 'ShiftRight', 'KeyK']) || (gp && gp.pulseJustPressed)) {
        this.togglePulseState = !this.togglePulseState;
      }
    } else {
      this.togglePulseState = false;
    }
    const pulse = togglePulseSetting ? this.togglePulseState : (checkKeyHold('pulse', ['ShiftLeft', 'ShiftRight', 'KeyK']) || !!this.touchPulse || (gp && gp.pulse));

    // Combat moves & Aura
    const slashJustPressed = checkKeyJustPressed('slash', ['KeyJ']) || !!this.touchSlashJustPressed || (gp && gp.slashJustPressed);
    const boltJustPressed = checkKeyJustPressed('bolt', ['KeyL']) || !!this.touchBoltJustPressed || (gp && gp.boltJustPressed);
    const dashJustPressed = checkKeyJustPressed('dash', ['KeyC', 'ControlLeft']) || !!this.touchDashJustPressed || (gp && gp.dashJustPressed);
    const plungeJustPressed = (down && checkKeyJustPressed('plunge', ['KeyS', 'ArrowDown'])) || !!this.touchPlungeJustPressed;

    // Toggle aura support (accessibility)
    const toggleAuraSetting = Settings.get('toggleAura');
    if (toggleAuraSetting) {
      if (checkKeyJustPressed('aura', ['KeyQ'])) {
        this.toggleAuraState = !this.toggleAuraState;
      }
    } else {
      this.toggleAuraState = false;
    }
    const auraJustPressed = checkKeyJustPressed('aura', ['KeyQ']) || !!this.touchAuraJustPressed || (gp && gp.auraJustPressed);
    const auraHold = toggleAuraSetting ? this.toggleAuraState : (checkKeyHold('aura', ['KeyQ']) || !!this.touchAuraHold || (gp && gp.auraHold));

    const pauseJustPressed = checkKeyJustPressed('pause', ['Escape', 'KeyP']) || (gp && gp.pauseJustPressed);
    const muteJustPressed = jp('KeyM');
    const interactJustPressed = checkKeyJustPressed('summon', ['KeyE']) || jp('Enter');
    const f2JustPressed = jp('F2');
    const skillsJustPressed = jp('Tab') || !!this.touchSkillsJustPressed;

    // Summoning
    const summonJustPressed = checkKeyJustPressed('summon', ['KeyE']) || !!this.touchSummonJustPressed || (gp && gp.summonJustPressed);
    const summonHold = checkKeyHold('summon', ['KeyE']);
    const summonQuick1 = jp('Digit1');
    const summonQuick2 = jp('Digit2');
    const summonQuick3 = jp('Digit3');
    const summonQuick4 = jp('Digit4');
    const summonQuick5 = jp('Digit5');

    // Swappable skills (U, I, O)
    const skillSlot1 = checkKeyJustPressed('skill1', ['KeyU']) || !!this.touchSkill1JustPressed;
    const skillSlot2 = checkKeyJustPressed('skill2', ['KeyI']) || !!this.touchSkill2JustPressed;
    const skillSlot3 = checkKeyJustPressed('skill3', ['KeyO']) || !!this.touchSkill3JustPressed;

    // Astral Form & Shadow Army
    const astralJustPressed = checkKeyJustPressed('astral', ['KeyR']) || !!this.touchAstralJustPressed;
    const extractJustPressed = checkKeyJustPressed('extract', ['KeyF']) || !!this.touchExtractJustPressed;
    const riseHold = checkKeyHold('rise', ['KeyG']) || !!this.touchRiseHold;
    const riseJustPressed = checkKeyJustPressed('rise', ['KeyG']) || !!this.touchRiseJustPressed;
    const exchangeJustPressed = checkKeyJustPressed('exchange', ['KeyX']) || !!this.touchExchangeJustPressed;
    const reachHold = checkKeyHold('reach', ['KeyV']) || !!this.touchReachHold;
    const ledgerJustPressed = checkKeyJustPressed('ledger', ['KeyT']) || !!this.touchLedgerJustPressed;

    this.actions = {
      left,
      right,
      down,
      jump,
      jumpJustPressed,
      jumpJustReleased,
      pulse,
      slashJustPressed,
      boltJustPressed,
      dashJustPressed,
      plungeJustPressed,
      auraJustPressed,
      auraHold,
      pauseJustPressed,
      muteJustPressed,
      interactJustPressed,
      f2JustPressed,
      skillsJustPressed,
      summonJustPressed,
      summonHold,
      summonQuick1,
      summonQuick2,
      summonQuick3,
      summonQuick4,
      summonQuick5,
      skillSlot1,
      skillSlot2,
      skillSlot3,
      astralJustPressed,
      extractJustPressed,
      riseHold,
      riseJustPressed,
      exchangeJustPressed,
      reachHold,
      ledgerJustPressed
    };

    // Clear frame-specific sets
    this.justPressed.clear();
    this.justReleased.clear();
    this.touchJumpJustPressed = false;
    this.touchJumpJustReleased = false;
    this.touchSlashJustPressed = false;
    this.touchBoltJustPressed = false;
    this.touchDashJustPressed = false;
    this.touchPlungeJustPressed = false;
    this.touchAuraJustPressed = false;
    this.touchSummonJustPressed = false;
    this.touchSkillsJustPressed = false;
    this.touchSkill1JustPressed = false;
    this.touchSkill2JustPressed = false;
    this.touchSkill3JustPressed = false;
    this.touchAstralJustPressed = false;
    this.touchExtractJustPressed = false;
    this.touchRiseJustPressed = false;
    this.touchExchangeJustPressed = false;
    this.touchLedgerJustPressed = false;
  }

  hasBufferedJump() {
    return this.jumpBufferTimer > 0;
  }

  consumeBufferedJump() {
    this.jumpBufferTimer = 0;
  }
}
