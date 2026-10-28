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
      pauseJustPressed: false,
      muteJustPressed: false,
      interactJustPressed: false
    };

    // Buffer tracking
    this.jumpBufferTimer = 0;

    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling for game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS'].includes(e.code)) {
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
    bindTouch('btn-aura', () => { this.touchAuraJustPressed = true; }, () => {});
  }

  update(dt) {
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    const k = (code) => !!this.keys.get(code);
    const jp = (code) => this.justPressed.has(code);
    const jr = (code) => this.justReleased.has(code);

    const left = k('ArrowLeft') || k('KeyA') || !!this.touchLeft;
    const right = k('ArrowRight') || k('KeyD') || !!this.touchRight;
    const down = k('ArrowDown') || k('KeyS');

    const jump = k('Space') || k('KeyW') || k('ArrowUp') || !!this.touchJump;
    const jumpJustPressed = jp('Space') || jp('KeyW') || jp('ArrowUp') || !!this.touchJumpJustPressed;
    const jumpJustReleased = jr('Space') || jr('KeyW') || jr('ArrowUp') || !!this.touchJumpJustReleased;

    const pulse = k('ShiftLeft') || k('ShiftRight') || k('KeyK') || !!this.touchPulse;

    // Combat moves
    const slashJustPressed = jp('KeyJ') || !!this.touchSlashJustPressed;
    const boltJustPressed = jp('KeyL') || !!this.touchBoltJustPressed;
    const dashJustPressed = jp('KeyC') || jp('ControlLeft') || jp('ControlRight') || !!this.touchDashJustPressed;
    const plungeJustPressed = (down && jp('KeyS')) || (down && jp('ArrowDown')) || !!this.touchPlungeJustPressed;
    const auraJustPressed = jp('KeyQ') || !!this.touchAuraJustPressed;

    const pauseJustPressed = jp('Escape') || jp('KeyP');
    const muteJustPressed = jp('KeyM');
    const interactJustPressed = jp('KeyE') || jp('Enter');

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
      pauseJustPressed,
      muteJustPressed,
      interactJustPressed
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
  }

  hasBufferedJump() {
    return this.jumpBufferTimer > 0;
  }

  consumeBufferedJump() {
    this.jumpBufferTimer = 0;
  }
}
