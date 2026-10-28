import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Storage } from './Storage.js';
import { Player } from '../entities/Player.js';
import { FireflyCompanion } from '../entities/FireflyCompanion.js';
import { TileMap } from '../levels/TileMap.js';
import { Level1Data } from '../levels/Level1.js';
import { Level2Data } from '../levels/Level2.js';
import { Level3Data } from '../levels/Level3.js';
import { Level4Data } from '../levels/Level4.js';
import { LightingSystem } from '../systems/LightingSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ParallaxBackground } from '../systems/ParallaxBackground.js';
import { HUD } from '../ui/HUD.js';
import { MenuOverlay } from '../ui/MenuOverlay.js';
import { CombatSystem } from '../systems/combat/CombatSystem.js';
import { VFXManager } from '../systems/vfx/VFXManager.js';
import { TuningPanel } from '../debug/TuningPanel.js';
import { SummonSystem } from '../systems/summons/SummonSystem.js';
import { SkillSystem } from '../systems/skills/SkillSystem.js';

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  TRANSITION: 'TRANSITION',
  FINALE_CINEMATIC: 'FINALE_CINEMATIC',
  WIN: 'WIN'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;

    // Fixed timestep settings
    this.timeStep = 1 / 60;
    this.accumulator = 0;
    this.lastTime = 0;

    // Subsystems
    this.input = new Input();
    this.camera = new Camera();
    this.lighting = new LightingSystem();
    this.particles = new ParticleSystem(400);
    this.audio = new AudioSystem();
    this.background = new ParallaxBackground();
    this.hud = new HUD();
    this.menuOverlay = new MenuOverlay();
    this.combat = new CombatSystem();
    this.vfx = new VFXManager();
    this.tuningPanel = new TuningPanel();
    this.summons = new SummonSystem();
    this.skills = new SkillSystem();
    this.combat.summonSystem = this.summons;

    // Game state
    this.state = GAME_STATES.MENU;
    this.levels = [Level1Data, Level2Data, Level3Data, Level4Data];
    this.currentLevelIndex = 0;
    this.tileMap = null;
    this.player = null;
    this.firefly = null;

    // Progress persistence & accessibility
    const saved = Storage.load();
    this.foundShards = saved.foundShards || [false, false, false, false, false];
    this.shardsCollected = this.foundShards.filter(Boolean).length;

    this.accessibility = {
      shakeEnabled: saved.shakeEnabled !== false,
      flashIntensity: saved.flashIntensity !== undefined ? saved.flashIntensity : 1.0,
      hitStopEnabled: saved.hitStopEnabled !== false,
      damageNumbers: saved.damageNumbers !== false,
      highQuality: saved.highQuality !== false
    };
    this.camera.shakeEnabled = this.accessibility.shakeEnabled;
    this.combat.damageNumbersEnabled = this.accessibility.damageNumbers;

    // Transition variables
    this.transitionAlpha = 0;
    this.transitionDir = 0;
    this.nextLevelIndex = 0;

    // Finale cinematic variables
    this.cinematicTimer = 0;
    this.cinematicShards = [];
    this.moonProgress = 0;

    this.initCanvasScaling();
    this.setupEventListeners();
  }

  initCanvasScaling() {
    const resize = () => {
      const container = document.getElementById('game-container');
      const w = window.innerWidth;
      const h = window.innerHeight;
      const targetAspect = GAME_WIDTH / GAME_HEIGHT;
      const screenAspect = w / h;

      let renderW, renderH;
      if (screenAspect > targetAspect) {
        renderH = h;
        renderW = h * targetAspect;
      } else {
        renderW = w;
        renderH = w / targetAspect;
      }

      this.canvas.style.width = `${Math.floor(renderW)}px`;
      this.canvas.style.height = `${Math.floor(renderH)}px`;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  setupEventListeners() {
    const handleStart = () => {
      this.audio.ensureContext();
      if (this.state === GAME_STATES.MENU) {
        this.startNewGame();
      } else if (this.state === GAME_STATES.WIN) {
        this.startNewGame();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.WIN) {
          handleStart();
        }
      }
    });

    this.canvas.addEventListener('click', () => {
      handleStart();
    });

    window.addEventListener('touchstart', () => {
      this.audio.ensureContext();
      if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.WIN) {
        handleStart();
      }
    }, { passive: true });
  }

  startNewGame() {
    this.loadLevel(0);
    this.state = GAME_STATES.PLAYING;
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    const data = this.levels[index];
    this.tileMap = new TileMap(data.ascii, index, data.name);

    this.player = new Player(this.tileMap.playerStart.x, this.tileMap.playerStart.y);
    this.player.setSpawn(this.tileMap.playerStart.x, this.tileMap.playerStart.y);

    this.firefly = new FireflyCompanion(this.player.x, this.player.y);

    this.camera.setBounds(0, 0, this.tileMap.pixelWidth, this.tileMap.pixelHeight);
    this.camera.snapTo(this.player.x, this.player.y);

    this.audio.setLevelMusic(index);
    this.hud.showTitle(data.name, data.subtitle);

    Storage.save({ currentLevel: index });
  }

  startLevelTransition(nextIndex) {
    if (this.state === GAME_STATES.TRANSITION) return;
    this.state = GAME_STATES.TRANSITION;
    this.nextLevelIndex = nextIndex;
    this.transitionDir = 1;
    this.transitionAlpha = 0;
  }

  onShardCollect(shardIndex) {
    if (shardIndex >= 0 && shardIndex < this.foundShards.length) {
      this.foundShards[shardIndex] = true;
      this.shardsCollected = this.foundShards.filter(Boolean).length;
      Storage.save({
        foundShards: this.foundShards,
        shardsCollected: this.shardsCollected
      });
      this.camera.shake(4, 0.25);

      if (this.currentLevelIndex === 3) {
        this.triggerFinaleCinematic();
      }
    }
  }

  triggerFinaleCinematic() {
    this.state = GAME_STATES.FINALE_CINEMATIC;
    this.cinematicTimer = 0;
    this.moonProgress = 0;
    this.player.frozen = true;

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    this.cinematicShards = [0, 1, 2, 3, 4].map(i => ({
      angle: (i / 5) * Math.PI * 2,
      radius: 20,
      x: px,
      y: py,
      targetY: 80,
      elevated: 0
    }));

    this.audio.playMoonRestored();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    const elapsed = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.accumulator += Math.min(elapsed, 0.1);

    while (this.accumulator >= this.timeStep) {
      this.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }

    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.input.update(dt);
    if (this.tuningPanel) this.tuningPanel.update(this.input);

    if (this.input.actions.muteJustPressed) {
      this.audio.toggleMute();
    }

    switch (this.state) {
      case GAME_STATES.MENU:
        this.menuOverlay.update(dt);
        if (this.input.actions.jumpJustPressed || this.input.actions.interactJustPressed) {
          this.audio.ensureContext();
          this.startNewGame();
        }
        break;

      case GAME_STATES.PLAYING:
        this.updatePlaying(dt);
        break;

      case GAME_STATES.PAUSED:
        this.updatePaused(dt);
        break;

      case GAME_STATES.TRANSITION:
        this.updateTransition(dt);
        break;

      case GAME_STATES.FINALE_CINEMATIC:
        this.updateFinaleCinematic(dt);
        break;

      case GAME_STATES.WIN:
        this.menuOverlay.update(dt);
        if (this.input.actions.jumpJustPressed || this.input.actions.interactJustPressed) {
          this.startNewGame();
        }
        break;
    }
  }

  updatePaused(dt) {
    if (this.input.actions.pauseJustPressed) {
      this.state = GAME_STATES.PLAYING;
    }
    if (this.input.keys.get('KeyR')) {
      this.player.respawn();
      this.state = GAME_STATES.PLAYING;
    }

    // Accessibility Toggles (1, 2, 3, 4, 5)
    if (this.input.justPressed.has('Digit1')) {
      this.accessibility.shakeEnabled = !this.accessibility.shakeEnabled;
      this.camera.shakeEnabled = this.accessibility.shakeEnabled;
      Storage.save(this.accessibility);
    }
    if (this.input.justPressed.has('Digit2')) {
      this.accessibility.flashIntensity = this.accessibility.flashIntensity === 1.0 ? 0.5 : (this.accessibility.flashIntensity === 0.5 ? 0 : 1.0);
      Storage.save(this.accessibility);
    }
    if (this.input.justPressed.has('Digit3')) {
      this.accessibility.hitStopEnabled = !this.accessibility.hitStopEnabled;
      Storage.save(this.accessibility);
    }
    if (this.input.justPressed.has('Digit4')) {
      this.accessibility.damageNumbers = !this.accessibility.damageNumbers;
      this.combat.damageNumbersEnabled = this.accessibility.damageNumbers;
      Storage.save(this.accessibility);
    }
    if (this.input.justPressed.has('Digit5')) {
      this.accessibility.highQuality = !this.accessibility.highQuality;
      Storage.save(this.accessibility);
    }
    if (this.input.justPressed.has('Digit6')) {
      this.accessibility.reducedEffects = !this.accessibility.reducedEffects;
      this.vfx.reducedEffects = this.accessibility.reducedEffects;
      Storage.save(this.accessibility);
    }
    if (this.input.actions.skillsJustPressed) {
      this.skills.menuOpen = !this.skills.menuOpen;
    }
  }

  updatePlaying(dt) {
    if (this.input.actions.pauseJustPressed) {
      this.state = GAME_STATES.PAUSED;
      return;
    }

    if (this.input.keys.get('KeyR')) {
      this.player.respawn();
    }

    // === Hit-Stop Juice (Freeze world briefly on strikes) ===
    if (this.combat.hitStopTimer > 0 && this.accessibility.hitStopEnabled !== false) {
      this.combat.hitStopTimer -= dt;
      this.vfx.update(dt);
      this.camera.update(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2,
        this.player.facing,
        dt
      );
      return;
    }

    // Apply Time Dilation (slow-mo) + Menu slow-mo
    const menuSlow = (this.summons.wheelOpen || this.skills.menuOpen) ? 0.12 : 1.0;
    const effectiveDt = dt * this.combat.timeDilation * menuSlow;

    // Update Underworld Summons
    this.summons.update(
      effectiveDt,
      this.player,
      this.tileMap.getAllEnemies(),
      this.tileMap.boss,
      this.combat,
      this.vfx,
      this.audio,
      this.camera,
      this.particles,
      this.input
    );

    // Update Swappable Skills
    this.skills.update(
      effectiveDt,
      this.input,
      this.player,
      this.combat,
      this.tileMap.getAllEnemies(),
      this.tileMap.boss,
      this.vfx,
      this.audio,
      this.camera,
      this.particles
    );

    // Update Combat System
    this.combat.update(
      effectiveDt,
      this.player,
      this.tileMap.getAllEnemies(),
      this.tileMap.boss,
      this.tileMap,
      this.vfx,
      this.particles,
      this.audio,
      this.camera,
      this.foundShards
    );

    // Update Player with combat inputs
    this.player.update(
      this.input,
      this.tileMap,
      this.particles,
      this.audio,
      this.camera,
      this.combat,
      this.vfx,
      this.tileMap.getAllEnemies(),
      this.tileMap.boss,
      effectiveDt,
      this.foundShards
    );

    // Update Pulse Sound Hum
    this.audio.setPulseHum(this.player.isPulsing);

    // Update Firefly Companion
    this.firefly.update(this.player, this.particles, effectiveDt);

    // Update TileMap & Interactive Entities
    this.tileMap.updateEntities(
      this.player,
      this.particles,
      this.audio,
      this.camera,
      (idx) => this.onShardCollect(idx),
      effectiveDt,
      this.combat,
      this.vfx,
      this.foundShards
    );

    // Update VFX Manager
    this.vfx.update(dt);

    // Update Camera
    this.camera.update(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2,
      this.player.facing,
      dt
    );

    // Update Particles
    if (this.accessibility.highQuality !== false || Math.random() < 0.6) {
      this.particles.update(dt, this.camera);
    }

    // Update HUD
    this.hud.update(dt);

    // Check Level Exit Portal
    if (this.tileMap.isExitReached(this.player)) {
      if (this.currentLevelIndex < this.levels.length - 1) {
        this.startLevelTransition(this.currentLevelIndex + 1);
      }
    }
  }

  updateTransition(dt) {
    const fadeSpeed = 3.5;
    if (this.transitionDir === 1) {
      this.transitionAlpha += fadeSpeed * dt;
      if (this.transitionAlpha >= 1) {
        this.transitionAlpha = 1;
        this.loadLevel(this.nextLevelIndex);
        this.transitionDir = -1;
      }
    } else {
      this.transitionAlpha -= fadeSpeed * dt;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this.transitionDir = 0;
        this.state = GAME_STATES.PLAYING;
      }
    }
  }

  updateFinaleCinematic(dt) {
    this.cinematicTimer += dt;
    this.camera.update(this.player.x, this.player.y - 40, 1, dt);
    this.particles.update(dt, this.camera);

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;

    const riseProgress = Math.min(1, this.cinematicTimer / 3.0);
    const speed = 2 + riseProgress * 6;

    for (let i = 0; i < this.cinematicShards.length; i++) {
      const sh = this.cinematicShards[i];
      sh.angle += speed * dt;
      sh.radius = 25 * (1 - riseProgress * 0.7);
      sh.elevated = riseProgress * 120;
      sh.x = px + Math.cos(sh.angle) * sh.radius;
      sh.y = py - sh.elevated + Math.sin(sh.angle) * (sh.radius * 0.4);

      if (Math.random() < 0.6) {
        this.particles.emitShardPickupBurst(sh.x, sh.y);
      }
    }

    if (this.cinematicTimer > 3.2) {
      this.moonProgress = Math.min(1, (this.cinematicTimer - 3.2) / 1.5);
    }

    if (this.cinematicTimer > 6.0) {
      this.state = GAME_STATES.WIN;
      Storage.save({ completed: true });
    }
  }

  render() {
    const ctx = this.ctx;
    const time = performance.now() * 0.001;

    // 1. Clear background
    ctx.fillStyle = '#090814';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Parallax Background
    this.background.render(ctx, this.camera, time, this.moonProgress);

    // If game has loaded level, render world
    if (this.tileMap && this.player) {
      ctx.save();
      const rx = this.camera.getRenderX();
      const ry = this.camera.getRenderY();

      // Camera Zoom punch
      if (this.vfx.zoomScale !== 1.0) {
        ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.scale(this.vfx.zoomScale, this.vfx.zoomScale);
        ctx.translate(-GAME_WIDTH / 2, -GAME_HEIGHT / 2);
      }

      ctx.translate(-rx, -ry);

      // 3. TileMap & Entities
      this.tileMap.render(ctx, this.camera);

      // 4. Combat VFX in World Space (Ground Cracks, Afterimages, Slashes, Shockwaves)
      this.vfx.renderWorld(ctx);

      // 5. Combat Projectiles & Soul Orbs
      this.combat.render(ctx);

      // 5b. Underworld Summons & Swappable Skills in World Space
      this.summons.renderWorld(ctx);
      this.skills.renderWorld(ctx);

      // 6. Player & Firefly Companion
      this.player.render(ctx);
      this.firefly.render(ctx);

      // 7. Cinematic Orbiting Shards
      if (this.state === GAME_STATES.FINALE_CINEMATIC) {
        for (const sh of this.cinematicShards) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffd98a';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sh.x, sh.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      // 8. Real-Time Dynamic Lighting & Bloom
      const ambientDarkness = this.levels[this.currentLevelIndex]?.ambientDarkness || 0.90;
      this.lighting.render(ctx, this.player, this.firefly, this.tileMap, this.camera, ambientDarkness);

      // 9. World Particles
      this.particles.render(ctx, this.camera);

      // 10. Combo Screen Glow (High combo juice)
      if (this.combat.comboCount >= 5) {
        ctx.save();
        const comboGrad = ctx.createRadialGradient(
          GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.4,
          GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.72
        );
        const glowColor = this.combat.comboCount >= 10 ? 'rgba(255, 34, 85, 0.22)' : 'rgba(255, 217, 138, 0.16)';
        comboGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        comboGrad.addColorStop(1, glowColor);
        ctx.fillStyle = comboGrad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.restore();
      }

      // 11. Screen Flashes (Damage / Aura / Hit impacts)
      this.vfx.renderScreenOverlay(ctx, GAME_WIDTH, GAME_HEIGHT, this.accessibility.flashIntensity);

      // 12. HUD
      this.hud.render(
        ctx,
        this.player,
        this.currentLevelIndex,
        this.foundShards,
        5,
        this.audio.isMuted,
        this.combat,
        this.tileMap.boss,
        this.skills
      );

      // 12b. Summon Wheel & Skills Screen Overlays
      this.summons.renderWheel(ctx, GAME_WIDTH, GAME_HEIGHT, this.combat.soulEnergy);
      this.skills.renderMenu(ctx, GAME_WIDTH, GAME_HEIGHT);
    }

    // 13. Overlay Screens
    if (this.state === GAME_STATES.MENU) {
      this.menuOverlay.renderTitle(ctx, this.audio.isMuted);
    } else if (this.state === GAME_STATES.PAUSED) {
      this.menuOverlay.renderPause(ctx, this.audio.isMuted, this.accessibility);
    } else if (this.state === GAME_STATES.WIN) {
      this.menuOverlay.renderWin(ctx, this.shardsCollected, time);
    }

    // 14. Screen Transition Fade
    if (this.state === GAME_STATES.TRANSITION && this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(9, 8, 20, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }
}
