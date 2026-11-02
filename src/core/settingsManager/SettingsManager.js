// SettingsManager.js - Centralized Reactive Settings Manager
// Manages Gameplay, Video, Audio, Controls, Accessibility, Language, and Data settings.
// Emits change events so any setting change applies instantly without requiring restart.

const SETTINGS_KEY = 'lumen_hollow_settings_v2';

export const DEFAULT_SETTINGS = {
  version: 2,
  introSeen: false,
  skipIntroOnLaunch: false,
  hasCompletedWelcome: false,

  // Gameplay
  difficulty: 'Normal', // Gentle, Normal, Hard, Nightmare
  aimAssist: true,
  tutorialHints: true,
  autoSave: true,
  cameraSmoothing: 0.12,
  cameraLookahead: true,
  screenShake: 1.0,
  hitStop: 1.0,
  damageNumbers: true,

  // Video
  fullscreen: false,
  renderScale: 1.0,
  fpsCap: 60, // 30, 60, 120, 0 (unlimited)
  showFps: false,
  brightness: 1.0,
  uiScale: 1.0,
  qualityPreset: 'High', // Low, Medium, High, Ultra
  bloom: true,
  dynamicLighting: true,
  filmGrain: true,
  vignette: true,
  chromaticAberration: true,
  particleDensity: 1.0,
  parallaxLayers: 4,

  // Audio
  masterVolume: 0.85,
  musicVolume: 0.70,
  sfxVolume: 0.85,
  ambienceVolume: 0.75,
  uiVolume: 0.80,
  muted: false,
  muteOnBlur: true,
  monoAudio: false,

  // Controls (Primary & Secondary keys)
  keyBindings: {
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    lookUp: ['KeyW', 'ArrowUp'],
    crouch: ['KeyS', 'ArrowDown'],
    jump: ['Space', 'KeyW'],
    pulse: ['ShiftLeft', 'KeyK'],
    slash: ['KeyJ', 'Numpad1'],
    bolt: ['KeyL', 'KeyC'],
    dash: ['KeyC', 'ControlLeft'],
    plunge: ['KeyS', 'ArrowDown'],
    aura: ['KeyQ', 'KeyE'],
    summon: ['KeyE', 'KeyR'],
    skill1: ['KeyU', 'Digit1'],
    skill2: ['KeyI', 'Digit2'],
    skill3: ['KeyO', 'Digit3'],
    astral: ['KeyR', 'Digit4'],
    extract: ['KeyF', 'Digit5'],
    rise: ['KeyG', 'KeyY'],
    exchange: ['KeyX', 'KeyZ'],
    reach: ['KeyV', 'KeyB'],
    ledger: ['KeyT', 'KeyM'],
    pause: ['Escape', 'KeyP']
  },

  // Gamepad
  gamepadDeadzone: 0.18,
  gamepadVibration: true,

  // Touch
  touchSize: 'medium', // small, medium, large
  touchOpacity: 0.65,
  touchLeftHanded: false,

  // Accessibility
  colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  reducedFlashing: false,
  reducedEffects: false,
  togglePulse: false,
  toggleAura: false,
  oneButtonCombat: false,
  threatIndicators: true,

  // Language
  language: 'en'
};

class SettingsManager {
  constructor() {
    this.listeners = new Map();
    this.settings = this.load();
    this.initPerformanceBenchmark();
  }

  load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        // Check for old storage data migration
        return this.migrateFromOldStorage();
      }
      const parsed = JSON.parse(raw);
      return this.mergeDefaults(parsed);
    } catch (e) {
      console.warn('Failed to parse settings, falling back to defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  migrateFromOldStorage() {
    const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      const oldRaw = localStorage.getItem('lumen_hollow_save_v1');
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        if (old.muted !== undefined) base.muted = !!old.muted;
        if (old.musicVolume !== undefined) base.musicVolume = old.musicVolume;
        if (old.sfxVolume !== undefined) base.sfxVolume = old.sfxVolume;
        if (old.shakeEnabled !== undefined) base.screenShake = old.shakeEnabled ? 1.0 : 0.0;
        if (old.damageNumbers !== undefined) base.damageNumbers = !!old.damageNumbers;
        if (old.highQuality !== undefined) base.qualityPreset = old.highQuality ? 'High' : 'Medium';
      }
    } catch (e) {
      console.warn('Old settings migration failed:', e);
    }
    this.saveDirect(base);
    return base;
  }

  mergeDefaults(parsed) {
    const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    for (const key of Object.keys(merged)) {
      if (parsed[key] !== undefined) {
        if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
          merged[key] = { ...merged[key], ...parsed[key] };
        } else {
          merged[key] = parsed[key];
        }
      }
    }
    return merged;
  }

  save() {
    this.saveDirect(this.settings);
  }

  saveDirect(data) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
    this.emit(key, value);
    this.emit('change', { key, value });
  }

  setMultiple(obj) {
    for (const [k, v] of Object.entries(obj)) {
      this.settings[k] = v;
      this.emit(k, v);
    }
    this.save();
    this.emit('change', obj);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in settings listener for '${event}':`, err);
        }
      }
    }
  }

  applyPreset(presetName) {
    const presets = {
      Low: {
        qualityPreset: 'Low',
        bloom: false,
        dynamicLighting: false,
        filmGrain: false,
        vignette: false,
        chromaticAberration: false,
        particleDensity: 0.5,
        parallaxLayers: 2,
        renderScale: 0.85
      },
      Medium: {
        qualityPreset: 'Medium',
        bloom: true,
        dynamicLighting: true,
        filmGrain: false,
        vignette: true,
        chromaticAberration: false,
        particleDensity: 0.8,
        parallaxLayers: 3,
        renderScale: 1.0
      },
      High: {
        qualityPreset: 'High',
        bloom: true,
        dynamicLighting: true,
        filmGrain: true,
        vignette: true,
        chromaticAberration: true,
        particleDensity: 1.0,
        parallaxLayers: 4,
        renderScale: 1.0
      },
      Ultra: {
        qualityPreset: 'Ultra',
        bloom: true,
        dynamicLighting: true,
        filmGrain: true,
        vignette: true,
        chromaticAberration: true,
        particleDensity: 1.4,
        parallaxLayers: 4,
        renderScale: 1.25
      }
    };

    if (presets[presetName]) {
      this.setMultiple(presets[presetName]);
    }
  }

  initPerformanceBenchmark() {
    if (this.settings.benchmarkCompleted) return;
    try {
      const start = performance.now();
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 300;
      testCanvas.height = 300;
      const ctx = testCanvas.getContext('2d');
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(${i % 255}, 120, 200, 0.5)`;
        ctx.beginPath();
        ctx.arc(150, 150, (i % 140) + 5, 0, Math.PI * 2);
        ctx.fill();
      }
      const duration = performance.now() - start;
      let recommended = 'High';
      if (duration > 35) recommended = 'Low';
      else if (duration > 16) recommended = 'Medium';
      else if (duration < 6) recommended = 'Ultra';

      this.settings.benchmarkCompleted = true;
      this.settings.recommendedPreset = recommended;
      this.applyPreset(recommended);
      this.save();
    } catch (e) {
      this.settings.benchmarkCompleted = true;
      this.save();
    }
  }

  resetToDefaults() {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.settings = fresh;
    this.save();
    this.emit('reset', fresh);
    this.emit('change', fresh);
  }
}

export const Settings = new SettingsManager();
