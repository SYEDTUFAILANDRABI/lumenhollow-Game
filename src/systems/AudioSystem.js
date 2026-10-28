import { Storage } from '../core/Storage.js';

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = Storage.load().muted || false;
    this.initialized = false;

    // Ambient pad state
    this.padOscs = [];
    this.padGain = null;
    this.padFilter = null;
    this.currentLevelIndex = -1;

    // Pulse hum continuous state
    this.pulseOsc = null;
    this.pulseGain = null;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      this.setupAmbientPad();
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
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
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.65, t, 0.04);
    }
    return this.isMuted;
  }

  setupAmbientPad() {
    if (!this.ctx || !this.masterGain) return;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.padFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.masterGain);
  }

  setLevelMusic(levelIndex) {
    this.ensureContext();
    if (!this.ctx || this.currentLevelIndex === levelIndex) return;
    this.currentLevelIndex = levelIndex;

    // Chords per level
    // 0: D minor (mystical forest)
    // 1: C minor (deep crystal cave)
    // 2: F maj7 (sky heights)
    // 3: G celestial (sacred moon shrine)
    const chords = [
      [146.83, 174.61, 220.00, 293.66], // D3, F3, A3, D4
      [130.81, 155.56, 196.00, 261.63], // C3, Eb3, G3, C4
      [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
      [196.00, 246.94, 293.66, 369.99]  // G3, B3, D4, F#4
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
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.12);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

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
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  setPulseHum(active) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    if (active) {
      if (!this.pulseOsc) {
        this.pulseOsc = this.ctx.createOscillator();
        this.pulseGain = this.ctx.createGain();
        this.pulseOsc.type = 'triangle';
        this.pulseOsc.frequency.setValueAtTime(320, t);

        this.pulseGain.gain.setValueAtTime(0.001, t);
        this.pulseGain.gain.linearRampToValueAtTime(0.08, t + 0.1);

        this.pulseOsc.connect(this.pulseGain);
        this.pulseGain.connect(this.masterGain);
        this.pulseOsc.start(t);
      }
    } else {
      if (this.pulseOsc) {
        this.pulseGain.gain.linearRampToValueAtTime(0.001, t + 0.1);
        const osc = this.pulseOsc;
        setTimeout(() => {
          try { osc.stop(); } catch (e) {}
        }, 120);
        this.pulseOsc = null;
        this.pulseGain = null;
      }
    }
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
      gain.connect(this.masterGain);

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
      gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  playSovereignAura() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. Deep Sub-Bass Boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, t);
    subOsc.frequency.exponentialRampToValueAtTime(26, t + 0.8);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.95);

    // 2. Heartbeat Double Thump (0.0s and 0.18s)
    [0, 0.18].forEach(delay => {
      const hbOsc = this.ctx.createOscillator();
      const hbGain = this.ctx.createGain();
      hbOsc.type = 'triangle';
      hbOsc.frequency.setValueAtTime(70, t + delay);
      hbOsc.frequency.exponentialRampToValueAtTime(30, t + delay + 0.1);

      hbGain.gain.setValueAtTime(0.35, t + delay);
      hbGain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.14);

      hbOsc.connect(hbGain);
      hbGain.connect(this.masterGain);
      hbOsc.start(t + delay);
      hbOsc.stop(t + delay + 0.16);
    });

    // 3. Rising Celestial Tone
    const riseOsc = this.ctx.createOscillator();
    const riseGain = this.ctx.createGain();
    riseOsc.type = 'sine';
    riseOsc.frequency.setValueAtTime(110, t);
    riseOsc.frequency.exponentialRampToValueAtTime(660, t + 0.6);

    riseGain.gain.setValueAtTime(0.01, t);
    riseGain.gain.linearRampToValueAtTime(0.18, t + 0.4);
    riseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    riseOsc.connect(riseGain);
    riseGain.connect(this.masterGain);
    riseOsc.start(t);
    riseOsc.stop(t + 0.85);
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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
    gain.connect(this.masterGain);

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
      gain.connect(this.masterGain);

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
        gain.connect(this.masterGain);

        osc.start(t + step * 0.45);
        osc.stop(t + step * 0.45 + 1.3);
      });
    });
  }
}
