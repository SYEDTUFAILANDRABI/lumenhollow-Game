import { Storage } from '../core/Storage.js';
import { Settings } from '../core/settingsManager/SettingsManager.js';

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterCompressor = null;
    this.masterLowpass = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.uiGain = null;
    this.ambienceGain = null;
    this.reverbNode = null;
    this.reverbGain = null;

    this.isMuted = Settings.get('muted') || false;
    this.masterVolume = Settings.get('masterVolume') !== undefined ? Settings.get('masterVolume') : 0.85;
    this.sfxVolume = Settings.get('sfxVolume') !== undefined ? Settings.get('sfxVolume') : 0.85;
    this.musicVolume = Settings.get('musicVolume') !== undefined ? Settings.get('musicVolume') : 0.70;
    this.uiVolume = Settings.get('uiVolume') !== undefined ? Settings.get('uiVolume') : 0.80;
    this.ambienceVolume = Settings.get('ambienceVolume') !== undefined ? Settings.get('ambienceVolume') : 0.75;
    this.initialized = false;

    // Listen to Settings changes
    Settings.on('masterVolume', (v) => this.setMasterVolume(v));
    Settings.on('musicVolume', (v) => this.setMusicVolume(v));
    Settings.on('sfxVolume', (v) => this.setSfxVolume(v));
    Settings.on('uiVolume', (v) => this.setUIVolume(v));
    Settings.on('ambienceVolume', (v) => this.setAmbienceVolume(v));
    Settings.on('muted', (m) => this.setMuted(m));
    Settings.on('vocalSoundtrack', () => {
      if (this.currentLevelIndex === -1) {
        this.playMenuMusic();
      }
    });

    // Mute on tab blur if enabled
    window.addEventListener('blur', () => {
      if (Settings.get('muteOnBlur') && this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
    });
    window.addEventListener('focus', () => {
      if (this.masterGain && this.ctx) {
        const target = this.isMuted ? 0 : this.masterVolume * 0.75;
        this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
      }
    });

    // Vocal soundtrack track state
    this.themeAudio = null;
    this.themeSource = null;
    this.isThemePlaying = false;
    this.soundtrackUrl = '/assets/audio/lumen_hollow_theme.mp3';

    // Ambient pad state
    this.padOscs = [];
    this.padGain = null;
    this.padFilter = null;
    this.currentLevelIndex = -1;

    // Soothing pulse state
    this.pulseActive = false;
    this.currentPulseData = null;
    this.pulseChordIndex = 0;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master Compressor / Limiter - eliminates clipping
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Soft Master Low-pass Filter (~12kHz) so high transients never sound harsh
      this.masterLowpass = this.ctx.createBiquadFilter();
      this.masterLowpass.type = 'lowpass';
      this.masterLowpass.frequency.setValueAtTime(12000, this.ctx.currentTime);
      this.masterLowpass.Q.setValueAtTime(0.707, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.70, this.ctx.currentTime);

      // Dedicated SFX, Music, UI, and Ambience buses
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

      this.uiGain = this.ctx.createGain();
      this.uiGain.gain.setValueAtTime(this.uiVolume, this.ctx.currentTime);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);

      // Procedural Convolution Reverb (soft noise decaying impulse)
      this.reverbNode = this.createReverbNode();
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      if (this.reverbNode) {
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.sfxGain);
      }

      // Audio Graph routing
      this.sfxGain.connect(this.masterLowpass);
      this.musicGain.connect(this.masterLowpass);
      this.uiGain.connect(this.masterLowpass);
      this.ambienceGain.connect(this.masterLowpass);
      this.masterLowpass.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      this.setupAmbientPad();
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  }

  createReverbNode() {
    if (!this.ctx) return null;
    try {
      const convolver = this.ctx.createConvolver();
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * 1.5);
      const decay = 2.4;
      const buffer = this.ctx.createBuffer(2, length, rate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < length; i++) {
        const factor = Math.exp((-i / length) * decay);
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor;
      }
      convolver.buffer = buffer;
      return convolver;
    } catch (e) {
      return null;
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    Storage.save({ muted: this.isMuted });

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.70, t, 0.04);
    }
    return this.isMuted;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      const target = this.isMuted ? 0 : this.masterVolume * 0.75;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(target, t, 0.05);
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      const target = this.isMuted ? 0 : this.masterVolume * 0.75;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(target, t, 0.04);
    }
  }

  setUIVolume(val) {
    this.uiVolume = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    if (this.uiGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.uiGain.gain.cancelScheduledValues(t);
      this.uiGain.gain.setTargetAtTime(this.uiVolume, t, 0.05);
    }
  }

  setAmbienceVolume(val) {
    this.ambienceVolume = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    if (this.ambienceGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.ambienceGain.gain.cancelScheduledValues(t);
      this.ambienceGain.gain.setTargetAtTime(this.ambienceVolume, t, 0.05);
    }
  }

  setSfxVolume(val) {
    this.setSFXVolume(val);
  }

  // Soft, warm UI sounds (no shrill beeps, strictly matching calming aesthetics)
  playUIHover() {
    this.ensureContext();
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t); // A5
      osc.frequency.exponentialRampToValueAtTime(1108.73, t + 0.04); // C#6

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {}
  }

  playUIClick() {
    this.ensureContext();
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.06); // E5

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start(t);
      osc.stop(t + 0.10);
    } catch (e) {}
  }

  playAudioTest() {
    this.ensureContext();
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const t = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.uiGain);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.38);
      });
    } catch (e) {}
  }

  playThemeTrack(loop = true) {
    this.ensureContext();
    if (!this.ctx || !this.musicGain) return;

    // Fade out any synth pad oscillators
    const t = this.ctx.currentTime;
    for (const osc of this.padOscs) {
      try { osc.stop(t + 0.5); } catch (e) {}
    }
    this.padOscs = [];

    if (!this.themeAudio && typeof Audio !== 'undefined') {
      try {
        this.themeAudio = new Audio(this.soundtrackUrl);
        this.themeAudio.loop = loop;
        this.themeAudio.crossOrigin = 'anonymous';
        this.themeAudio.preload = 'auto';

        this.themeSource = this.ctx.createMediaElementSource(this.themeAudio);
        this.themeSource.connect(this.musicGain);
      } catch (e) {
        console.warn('Theme audio source initialization deferred:', e);
      }
    }

    if (this.themeAudio) {
      this.themeAudio.loop = loop;
      this.isThemePlaying = true;
      const playPromise = this.themeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fall back gracefully to procedural synth pad if autoplay blocked or audio driver missing
          this.playMenuSynthMusic();
        });
      }
    } else {
      this.playMenuSynthMusic();
    }
  }

  stopThemeTrack(fadeTime = 0.8) {
    if (this.themeAudio && this.isThemePlaying) {
      this.isThemePlaying = false;
      try {
        this.themeAudio.pause();
      } catch (e) {}
    }
  }

  playMenuMusic() {
    this.ensureContext();
    if (!this.ctx) return;
    this.currentLevelIndex = -1;

    const useVocal = Settings.get('vocalSoundtrack') !== false;
    if (useVocal) {
      this.playThemeTrack(true);
    } else {
      this.stopThemeTrack(0.3);
      this.playMenuSynthMusic();
    }
  }

  playMenuSynthMusic() {
    this.ensureContext();
    if (!this.ctx) return;
    // Play warm ethereal celestial chords for title and menus (Eb maj9 / Bb maj7)
    const menuChord = [155.56, 196.00, 233.08, 293.66, 349.23]; // Eb3, G3, Bb3, D4, F4
    const t = this.ctx.currentTime;
    for (const osc of this.padOscs) {
      try { osc.stop(t + 0.8); } catch (e) {}
    }
    this.padOscs = [];

    for (let i = 0; i < menuChord.length; i++) {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(menuChord[i], t);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.24 / menuChord.length, t + 2.0);

      osc.connect(oscGain);
      oscGain.connect(this.padFilter || this.musicGain);

      osc.start(t);
      this.padOscs.push(osc);
    }
  }

  playIntroSwell() {
    this.ensureContext();
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(110, t); // A2
      osc2.frequency.setValueAtTime(220, t); // A3

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, t);
      filter.frequency.exponentialRampToValueAtTime(1600, t + 4.5);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 6.0);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 6.2);
      osc2.stop(t + 6.2);
    } catch (e) {}
  }

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    Storage.save({ sfxVolume: this.sfxVolume });
    if (this.sfxGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(t);
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, t, 0.05);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    Storage.save({ musicVolume: this.musicVolume });
    if (this.musicGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setTargetAtTime(this.musicVolume, t, 0.05);
    }
  }

  setupAmbientPad() {
    if (!this.ctx || !this.musicGain) return;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.padFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.musicGain);
  }

  setLevelMusic(levelIndex) {
    this.ensureContext();
    if (!this.ctx || this.currentLevelIndex === levelIndex) return;
    this.currentLevelIndex = levelIndex;

    // Stop vocal soundtrack theme when entering a gameplay stage
    this.stopThemeTrack(0.8);

    // Chords per level
    // 0: D minor (mystical forest)
    // 1: C minor (deep crystal cave)
    // 2: F maj7 (sky heights)
    // 3: G celestial (sacred moon shrine / ember descent)
    // 4: Bb dark (abyssal throne)
    // 5: G major sacred (moon restored)
    const chords = [
      [146.83, 174.61, 220.00, 293.66], // D3, F3, A3, D4
      [130.81, 155.56, 196.00, 261.63], // C3, Eb3, G3, C4
      [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
      [116.54, 146.83, 174.61, 233.08], // Bb2, D3, F3, Bb3 (molten depths)
      [98.00, 123.47, 146.83, 196.00],   // G2, B2, D3, G3 (abyss sovereign)
      [196.00, 246.94, 293.66, 369.99]  // G3, B3, D4, F#4 (sacred restoration)
    ];

    const chord = chords[Math.min(levelIndex, chords.length - 1)];

    // Fade out previous oscillators
    const t = this.ctx.currentTime;
    for (const osc of this.padOscs) {
      try {
        osc.stop(t + 0.8);
      } catch (e) {}
    }
    this.padOscs = [];

    // Create new warm detuned oscillators
    for (let i = 0; i < chord.length; i++) {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(chord[i], t);
      // Subtle organic detune
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.22 / chord.length, t + 1.2);

      osc.connect(oscGain);
      oscGain.connect(this.padFilter);

      osc.start(t);
      this.padOscs.push(osc);
    }
  }

  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.12);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playLand() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- Soothing Web Audio Lantern Pulse ---
  setPulseHum(active) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    if (active && !this.pulseActive) {
      this.pulseActive = true;
      this.startSoothingPulse();
    } else if (!active && this.pulseActive) {
      this.pulseActive = false;
      this.stopSoothingPulse();
    }
  }

  startSoothingPulse() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Pentatonic scale chords for peaceful ambient variety
    const pentatonicSets = [
      [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5 (luminous heart)
      [293.66, 369.99, 440.00, 587.33], // D4, F#4, A4, D5 (calm dawn)
      [329.63, 392.00, 493.88, 659.25], // E4, G4, B4, E5 (mystic breeze)
      [392.00, 493.88, 587.33, 783.99], // G4, B4, D5, G5 (starlight)
      [440.00, 523.25, 659.25, 880.00]  // A4, C5, E5, A5 (celestial chime)
    ];

    this.pulseChordIndex = ((this.pulseChordIndex || 0) + 1) % pentatonicSets.length;
    const freqs = pentatonicSets[this.pulseChordIndex];

    // Anti-harsh low-pass filter around 2.4kHz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(0.9, t);

    // Master pulse gain with slow, gentle attack (120ms)
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.setValueAtTime(0.0001, t);
    pulseGain.gain.linearRampToValueAtTime(0.06, t + 0.12);

    filter.connect(pulseGain);
    pulseGain.connect(this.sfxGain || this.masterGain);

    if (this.reverbNode) {
      pulseGain.connect(this.reverbNode);
    }

    const oscs = [];

    // 3 Layered oscillators: gentle sine base, detuned triangle body, soft octave shimmer
    const types = ['sine', 'triangle', 'sine'];
    const detunes = [-4, 3, 6];
    const amps = [0.035, 0.024, 0.015];

    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = types[i];
      osc.frequency.setValueAtTime(freqs[i % freqs.length], t);
      osc.detune.setValueAtTime(detunes[i], t);

      oscGain.gain.setValueAtTime(0.0001, t);
      oscGain.gain.linearRampToValueAtTime(amps[i], t + 0.12);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(t);
      oscs.push(osc);
    }

    // Soft airy noise breath through band-pass filter (~1000Hz)
    try {
      const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 1.5), this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1050, t);
      bandpass.Q.setValueAtTime(1.8, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.linearRampToValueAtTime(0.012, t + 0.15);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(filter);
      noiseSource.start(t);
      oscs.push(noiseSource);
    } catch (e) {}

    this.currentPulseData = {
      oscs,
      pulseGain,
      startTime: t
    };
  }

  stopSoothingPulse() {
    if (!this.ctx || !this.currentPulseData) return;
    const t = this.ctx.currentTime;
    const { oscs, pulseGain } = this.currentPulseData;
    this.currentPulseData = null;

    // Smooth 1.5s exponential release, zero clicks
    try {
      pulseGain.gain.cancelScheduledValues(t);
      pulseGain.gain.setValueAtTime(Math.max(0.0001, pulseGain.gain.value), t);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

      setTimeout(() => {
        oscs.forEach(o => {
          try {
            o.stop();
            o.disconnect();
          } catch (e) {}
        });
        try {
          pulseGain.disconnect();
        } catch (e) {}
      }, 1600);
    } catch (e) {}
  }

  playShardPickup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6 arpeggio chime

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.5);
    });
  }

  playShrineActivate() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [293.66, 440.00, 587.33, 880.00]; // D4, A4, D5, A5

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.75);
    });
  }

  playFireflyAbsorb() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.12); // G5

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playDissolve() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  playSlash(comboIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreqs = [240, 310, 180];
    const endFreqs = [420, 520, 120];

    osc.type = comboIndex === 2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreqs[comboIndex], t);
    osc.frequency.exponentialRampToValueAtTime(endFreqs[comboIndex], t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (comboIndex === 2 ? 0.22 : 0.14));

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  playBolt() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.16);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDelayedCutSnap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playPlungeStart() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.2);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  playPlungeLand() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  playParrySuccess() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [1046.5, 1567.98]; // C6, G6
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  setMuffle(muffled = true, filterFreq = 160) {
    if (!this.ctx || !this.padFilter) return;
    const t = this.ctx.currentTime;
    this.padFilter.frequency.cancelScheduledValues(t);
    this.padFilter.frequency.setTargetAtTime(muffled ? filterFreq : 450, t, 0.15);
  }

  playHeartbeat(volume = 0.4) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(58, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.12);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playAuraBuildUp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    this.setMuffle(true, 120);

    // Rising reverse swell
    const swellOsc = this.ctx.createOscillator();
    const swellGain = this.ctx.createGain();
    swellOsc.type = 'sawtooth';
    swellOsc.frequency.setValueAtTime(70, t);
    swellOsc.frequency.exponentialRampToValueAtTime(420, t + 0.55);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.55);

    swellGain.gain.setValueAtTime(0.01, t);
    swellGain.gain.linearRampToValueAtTime(0.35, t + 0.52);
    // Sudden near-silence right before the boom (180ms cut!)
    swellGain.gain.setValueAtTime(0.0001, t + 0.53);

    swellOsc.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(this.masterGain);

    swellOsc.start(t);
    swellOsc.stop(t + 0.55);
  }

  playSovereignAura() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    // Mobile vibration pattern if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([80, 50, 150, 50, 250]); } catch (e) {}
    }

    const t = this.ctx.currentTime;
    this.setMuffle(false);

    // 1. Huge 40Hz Sub-Bass Boom with long 1.8s decay
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(42, t);
    subOsc.frequency.exponentialRampToValueAtTime(20, t + 1.8);

    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.85);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 1.9);

    // 2. Procedural Noise Crackle for lightning
    try {
      const bufferSize = this.ctx.sampleRate * 0.45;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.Q.setValueAtTime(3.0, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      whiteNoise.start(t);
      whiteNoise.stop(t + 0.45);
    } catch (e) {}

    // 3. Dark Detuned Choir-like Pad
    [110, 138.59, 164.81].forEach((freq, idx) => {
      const choirOsc = this.ctx.createOscillator();
      const choirGain = this.ctx.createGain();
      choirOsc.type = 'triangle';
      choirOsc.frequency.setValueAtTime(freq, t);
      choirOsc.detune.setValueAtTime((idx - 1) * 14, t);

      choirGain.gain.setValueAtTime(0, t);
      choirGain.gain.linearRampToValueAtTime(0.22, t + 0.15);
      choirGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      choirOsc.connect(choirGain);
      choirGain.connect(this.masterGain);
      choirOsc.start(t);
      choirOsc.stop(t + 1.45);
    });

    // 4. Faint High Ringing Tone (Tinnitus aftermath)
    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(3400, t + 0.1);

    ringGain.gain.setValueAtTime(0, t + 0.1);
    ringGain.gain.linearRampToValueAtTime(0.08, t + 0.3);
    ringGain.gain.exponentialRampToValueAtTime(0.0005, t + 2.2);

    ringOsc.connect(ringGain);
    ringGain.connect(this.masterGain);
    ringOsc.start(t + 0.1);
    ringOsc.stop(t + 2.25);
  }

  playEnemyKill() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.22);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  playKnightTelegraph() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playKnightSlash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  playWraithScreech() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.22);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  playBossOrb() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  playBossSlam() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  playBossPhaseTransition() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.4);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  playBossDefeated() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const chord = [220, 277.18, 329.63, 440]; // A major triumphant chord
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 1.3);
    });
  }

  playMoonRestored() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Ascending radiant celestial chords
    const chordSeq = [
      [261.63, 329.63, 392.00], // C
      [329.63, 392.00, 523.25], // E min
      [349.23, 440.00, 523.25], // F
      [523.25, 659.25, 783.99, 1046.50] // C major triumphant
    ];

    chordSeq.forEach((chord, step) => {
      chord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + step * 0.45);

        gain.gain.setValueAtTime(0, t + step * 0.45);
        gain.gain.linearRampToValueAtTime(0.14, t + step * 0.45 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + step * 0.45 + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain || this.masterGain);

        osc.start(t + step * 0.45);
        osc.stop(t + step * 0.45 + 1.3);
      });
    });
  }

  playSummonDrum() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Deep taiko drum impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playSummonRoar() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  playCrescentWave() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  playSoulChain() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.2);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playGravityWell() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.5);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  playShadowClone() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playSpiritLance() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.35);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playSkeletonUprising() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Low earth-rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);
    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // Rattling bone clicks
    for (let i = 0; i < 3; i++) {
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(380 + i * 90, t + 0.07 * i);
      clickGain.gain.setValueAtTime(0.12, t + 0.07 * i);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07 * i + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain || this.masterGain);
      clickOsc.start(t + 0.07 * i);
      clickOsc.stop(t + 0.07 * i + 0.05);
    }
  }
}
