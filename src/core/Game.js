import { GAME_WIDTH, GAME_HEIGHT, SCENE_STATES, DIFFICULTY_SETTINGS } from './Constants.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Storage } from './Storage.js';
import { Settings } from './settingsManager/SettingsManager.js';
import { Saves } from './saveManager/SaveManager.js';
import { I18n } from './i18n/I18n.js';
import { Player } from '../entities/Player.js';
import { FireflyCompanion } from '../entities/FireflyCompanion.js';
import { TileMap } from '../levels/TileMap.js';
import { Level1Data } from '../levels/Level1.js';
import { Level2Data } from '../levels/Level2.js';
import { Level3Data } from '../levels/Level3.js';
import { Level4Data } from '../levels/Level4.js';
import { Level5Data } from '../levels/Level5.js';
import { Level6Data } from '../levels/Level6.js';
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
import { AstralMonarch } from '../systems/shadow/AstralMonarch.js';
import { ShadowArmyManager } from '../systems/shadow/ShadowArmy.js';
import { MoonLedger } from '../ui/MoonLedger.js';

// New Scene and Menu Imports
import { BootScene } from '../scenes/BootScene.js';
import { SplashScene } from '../scenes/SplashScene.js';
import { PressKeyScene } from '../scenes/PressKeyScene.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { IntroCinematicScene } from '../scenes/IntroCinematicScene.js';
import { LevelResultsScene } from '../scenes/LevelResultsScene.js';
import { CreditsScene } from '../scenes/CreditsScene.js';

import { MenuManager } from '../ui/menus/MenuManager.js';
import { MainMenu } from '../ui/menus/MainMenu.js';
import { SaveSlotsModal } from '../ui/menus/SaveSlotsModal.js';
import { LevelSelectModal } from '../ui/menus/LevelSelectModal.js';
import { CollectionModal } from '../ui/menus/CollectionModal.js';
import { AchievementsModal, Achievements } from '../ui/menus/AchievementsModal.js';
import { WelcomeModal } from '../ui/menus/WelcomeModal.js';
import { SettingsModal } from '../ui/settings/SettingsModal.js';
import { ControlsRebindModal } from '../ui/settings/ControlsRebindModal.js';
import { PauseMenu } from '../ui/menus/PauseMenu.js';

// Multiplayer Subsystems
import { NetworkSession } from '../net/NetworkSession.js';
import { PlayerManager } from '../net/PlayerManager.js';
import { GlobalNetEvents } from '../net/NetworkEventBus.js';
import { ClientPrediction } from '../net/Prediction.js';
import { SnapshotInterpolator } from '../net/Interpolation.js';
import { PartyLobbyModal } from '../ui/party/PartyLobbyModal.js';
import { PartyHUD } from '../ui/party/PartyHUD.js';
import { PingWheel } from '../ui/party/PingWheel.js';
import { ChatBox } from '../ui/party/ChatBox.js';
import { NET_MESSAGE_TYPES, COOP_CONFIG } from '../../shared/protocol.js';
import { InputFrame } from '../net/InputFrame.js';

// Backward compatibility alias
export const GAME_STATES = {
  MENU: 'MAIN_MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  TRANSITION: 'TRANSITION',
  FINALE_CINEMATIC: 'FINALE_CINEMATIC',
  WIN: 'WIN',
  BOOT: 'BOOT',
  SPLASH: 'SPLASH',
  PRESS_KEY: 'PRESS_KEY',
  INTRO_CINEMATIC: 'INTRO_CINEMATIC',
  TITLE: 'TITLE',
  MAIN_MENU: 'MAIN_MENU',
  LEVEL_RESULTS: 'LEVEL_RESULTS',
  CREDITS: 'CREDITS'
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
    this.fpsCounter = 60;
    this.fpsTimer = 0;
    this.fpsFrames = 0;

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
    this.astralMonarch = new AstralMonarch();
    this.shadowArmy = new ShadowArmyManager();
    this.moonLedger = new MoonLedger();
    this.combat.summonSystem = this.summons;

    // Multiplayer Subsystems
    this.network = new NetworkSession(this);
    this.playerManager = new PlayerManager(this);
    this.partyHUD = new PartyHUD(this);
    this.pingWheel = new PingWheel(this);
    this.chatBox = new ChatBox(this);
    this.prediction = null;
    this.interpolator = new SnapshotInterpolator(100);

    // Menu and Scene Subsystems
    this.menuManager = new MenuManager(this);
    this.mainMenu = new MainMenu(this.menuManager, this);
    this.bootScene = new BootScene(this);
    this.splashScene = new SplashScene(this);
    this.pressKeyScene = new PressKeyScene(this);
    this.titleScene = new TitleScene(this);
    this.introCinematic = null;
    this.resultsScene = null;
    this.creditsScene = null;

    // Initial State: BOOT
    this.state = SCENE_STATES.BOOT;
    this.levels = [Level1Data, Level2Data, Level3Data, Level4Data, Level5Data, Level6Data];
    this.currentLevelIndex = 0;
    this.tileMap = null;
    this.player = null;
    this.firefly = null;
    this.stageElapsed = 0;

    // Save & Settings wiring
    this.saves = Saves;
    const activeSlot = Saves.getActiveSlot();
    this.foundShards = activeSlot.foundShards ? [...activeSlot.foundShards] : [false, false, false, false, false];
    this.shardsCollected = this.foundShards.filter(Boolean).length;

    this.accessibility = {
      shakeEnabled: Settings.get('screenShake') > 0,
      flashIntensity: Settings.get('reducedFlashing') ? 0.3 : 1.0,
      hitStopEnabled: Settings.get('hitStop') > 0,
      damageNumbers: Settings.get('damageNumbers'),
      highQuality: Settings.get('qualityPreset') !== 'Low'
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
    this.setupSettingsListeners();
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
    const handleGesture = () => {
      this.audio.ensureContext();
      if (this.state === SCENE_STATES.BOOT) {
        // accelerate boot
        this.bootScene.progress = 1.0;
      } else if (this.state === SCENE_STATES.SPLASH) {
        this.splashScene.skip();
      } else if (this.state === SCENE_STATES.PRESS_KEY) {
        this.advanceFromPressKey();
      } else if (this.state === SCENE_STATES.WIN) {
        this.startNewGame();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (this.state === SCENE_STATES.PRESS_KEY || this.state === SCENE_STATES.SPLASH) {
        handleGesture();
      }
    });

    this.canvas.addEventListener('click', () => {
      handleGesture();
    });

    window.addEventListener('touchstart', () => {
      handleGesture();
    }, { passive: true });

    // Auto-pause when browser tab loses focus
    window.addEventListener('blur', () => {
      if (this.state === SCENE_STATES.PLAYING) {
        this.pauseGame();
      }
    });
  }

  setupSettingsListeners() {
    // Dynamic reactive canvas filters
    const updateCanvasFilters = () => {
      const bright = Settings.get('brightness') || 1.0;
      const cb = Settings.get('colorblindMode') || 'none';
      let filter = `brightness(${bright})`;

      if (cb === 'protanopia') {
        filter += ' sepia(0.6) hue-rotate(-20deg)';
      } else if (cb === 'deuteranopia') {
        filter += ' sepia(0.5) hue-rotate(40deg)';
      } else if (cb === 'tritanopia') {
        filter += ' sepia(0.4) hue-rotate(180deg)';
      }
      this.canvas.style.filter = filter;
    };

    Settings.on('brightness', updateCanvasFilters);
    Settings.on('colorblindMode', updateCanvasFilters);
    updateCanvasFilters();

    Settings.on('screenShake', (v) => {
      this.accessibility.shakeEnabled = v > 0;
      this.camera.shakeEnabled = v > 0;
    });

    Settings.on('damageNumbers', (v) => {
      this.accessibility.damageNumbers = !!v;
      this.combat.damageNumbersEnabled = !!v;
    });

    Settings.on('reducedFlashing', (v) => {
      this.accessibility.flashIntensity = v ? 0.25 : 1.0;
    });
  }

  advanceFromPressKey() {
    this.audio.ensureContext();
    this.audio.playMenuMusic();

    if (!Settings.get('hasCompletedWelcome')) {
      this.openWelcomeModal();
    } else if (!Settings.get('introSeen') && !Settings.get('skipIntroOnLaunch')) {
      this.startIntroCinematic();
    } else {
      this.returnToMainMenu();
    }
  }

  startIntroCinematic() {
    this.menuManager.clearModals();
    this.mainMenu.unmount();
    this.introCinematic = new IntroCinematicScene(this);
    this.state = SCENE_STATES.INTRO_CINEMATIC;
  }

  startCredits() {
    this.menuManager.clearModals();
    this.mainMenu.unmount();
    this.creditsScene = new CreditsScene(this);
    this.state = SCENE_STATES.CREDITS;
  }

  startLevelResults() {
    const enemies = this.combat.enemiesKilled || 6;
    const combo = this.combat.highestCombo || 12;
    this.resultsScene = new LevelResultsScene(this, {
      time: this.stageElapsed || 50,
      shards: this.shardsCollected || 1,
      enemies,
      combo,
      levelIndex: this.currentLevelIndex
    });
    this.state = SCENE_STATES.LEVEL_RESULTS;
  }

  returnToMainMenu() {
    this.state = SCENE_STATES.MAIN_MENU;
    this.mainMenu.mount();
    this.audio.playMenuMusic();
  }

  returnToTitleScreen() {
    this.mainMenu.unmount();
    this.state = SCENE_STATES.PRESS_KEY;
  }

  pauseGame() {
    if (this.state !== SCENE_STATES.PLAYING) return;
    this.state = SCENE_STATES.PAUSED;
    this.menuManager.pushModal(new PauseMenu(this.menuManager, this).create());
  }

  resumeGame() {
    if (this.state === SCENE_STATES.PAUSED) {
      this.menuManager.clearModals();
      this.state = SCENE_STATES.PLAYING;
    }
  }

  restartFromCheckpoint() {
    if (this.player && this.tileMap) {
      this.player.respawn();
    }
  }

  openSettingsModal() {
    this.menuManager.pushModal(new SettingsModal(this.menuManager, this).create());
  }

  openControlsRebindModal() {
    this.menuManager.pushModal(new ControlsRebindModal(this.menuManager, this).create());
  }

  openSaveSlotsModal(mode = 'load') {
    this.menuManager.pushModal(new SaveSlotsModal(this.menuManager, this, mode).create());
  }

  openLevelSelectModal() {
    this.menuManager.pushModal(new LevelSelectModal(this.menuManager, this).create());
  }

  openCollectionModal() {
    this.menuManager.pushModal(new CollectionModal(this.menuManager, this).create());
  }

  openAchievementsModal() {
    this.menuManager.pushModal(new AchievementsModal(this.menuManager, this).create());
  }

  openWelcomeModal() {
    this.menuManager.pushModal(new WelcomeModal(this.menuManager, this).create());
  }

  openPartyModal() {
    this.menuManager.pushModal(new PartyLobbyModal(this.menuManager, this).create());
  }

  startSlotGame(slot) {
    this.menuManager.clearModals();
    this.mainMenu.unmount();
    const lvl = (slot && typeof slot.currentLevel === 'number') ? slot.currentLevel : 0;
    this.loadLevel(lvl);
    this.state = SCENE_STATES.PLAYING;
  }

  startNewGame() {
    this.startSlotGame(Saves.getActiveSlot());
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    this.stageElapsed = 0;
    const data = this.levels[index];
    this.tileMap = new TileMap(data.ascii, index, data.name);

    this.player = new Player(this.tileMap.playerStart.x, this.tileMap.playerStart.y);
    this.player.setSpawn(this.tileMap.playerStart.x, this.tileMap.playerStart.y);

    if (this.playerManager) {
      this.playerManager.spawnPlayers(this.tileMap);
      this.player = this.playerManager.getLocalPlayer() || this.player;
      this.tileMap.playerManager = this.playerManager;
    }
    this.prediction = new ClientPrediction(this.player);

    this.firefly = new FireflyCompanion(this.player.x, this.player.y);

    this.camera.setBounds(0, 0, this.tileMap.pixelWidth, this.tileMap.pixelHeight);
    this.camera.snapTo(this.player.x, this.player.y);

    this.audio.setLevelMusic(index);
    this.hud.showTitle(data.name, data.subtitle);

    // Persist in active slot
    const slot = Saves.getActiveSlot();
    slot.currentLevel = index;
    slot.levelReached = Math.max(slot.levelReached || 0, index);
    Saves.saveGame(this);
  }

  startLevelTransition(nextIndex) {
    if (this.state === SCENE_STATES.TRANSITION) return;
    this.state = SCENE_STATES.TRANSITION;
    this.nextLevelIndex = nextIndex;
    this.transitionDir = 1;
    this.transitionAlpha = 0;
  }

  onShardCollect(shardIndex) {
    if (shardIndex >= 0 && shardIndex < this.foundShards.length) {
      this.foundShards[shardIndex] = true;
      this.shardsCollected = this.foundShards.filter(Boolean).length;
      this.camera.shake(4, 0.25);

      const slot = Saves.getActiveSlot();
      slot.foundShards = [...this.foundShards];
      slot.shardsCollected = this.shardsCollected;
      Saves.saveGame(this);

      Achievements.unlock('first_shard', this.menuManager);

      if (this.currentLevelIndex === 5) {
        Achievements.unlock('celestial_reunion', this.menuManager);
        this.triggerFinaleCinematic();
      }
    }
  }

  triggerFinaleCinematic() {
    this.state = SCENE_STATES.FINALE_CINEMATIC;
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

    // FPS calculation
    this.fpsFrames++;
    this.fpsTimer += elapsed;
    if (this.fpsTimer >= 0.5) {
      this.fpsCounter = Math.round((this.fpsFrames / this.fpsTimer));
      this.fpsFrames = 0;
      this.fpsTimer = 0;
    }

    this.accumulator += Math.min(elapsed, 0.1);

    while (this.accumulator >= this.timeStep) {
      this.update(this.timeStep);
      this.accumulator -= this.timeStep;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Always update input so JustPressed flags are fresh in every scene state
    this.input.update(dt);

    // 1. Scene Flow States
    if (this.state === SCENE_STATES.BOOT) {
      this.bootScene.update(dt);
      if (this.bootScene.isDone) {
        this.state = SCENE_STATES.SPLASH;
      }
      return;
    }

    if (this.state === SCENE_STATES.SPLASH) {
      this.splashScene.update(dt);
      if (this.splashScene.isDone) {
        this.state = SCENE_STATES.PRESS_KEY;
      }
      return;
    }

    if (this.state === SCENE_STATES.PRESS_KEY) {
      this.pressKeyScene.update(dt);
      return;
    }

    if (this.state === SCENE_STATES.INTRO_CINEMATIC) {
      if (this.introCinematic) {
        this.introCinematic.update(dt, this.input);
        if (this.introCinematic.isDone) {
          this.returnToMainMenu();
        }
      }
      return;
    }

    if (this.state === SCENE_STATES.MAIN_MENU) {
      this.titleScene.update(dt);
      this.menuManager.update(dt);
      return;
    }

    if (this.state === SCENE_STATES.LEVEL_RESULTS) {
      if (this.resultsScene) {
        this.resultsScene.update(dt, this.input.actions);
      }
      return;
    }

    if (this.state === SCENE_STATES.CREDITS) {
      if (this.creditsScene) {
        this.creditsScene.update(dt, this.input.actions);
      }
      return;
    }

    if (this.state === SCENE_STATES.PAUSED) {
      this.menuManager.update(dt);
      return;
    }

    if (this.state === SCENE_STATES.TRANSITION) {
      this.updateTransition(dt);
      return;
    }

    if (this.state === SCENE_STATES.FINALE_CINEMATIC) {
      this.updateFinaleCinematic(dt);
      return;
    }

    // 2. In-Game State (PLAYING)
    this.stageElapsed += dt;

    // Multiplayer Session & Input Frame Sampling
    if (this.network && this.network.isMultiplayer) {
      this.network.tick++;
      const frame = InputFrame.encode(this.input, this.network.inputSeq++, this.network.tick);
      if (!this.network.isHost) {
        this.network.send({
          type: NET_MESSAGE_TYPES.INPUT_FRAME,
          frame
        });
        if (this.prediction) {
          this.prediction.recordInput(frame.seq, frame.tick, frame);
          this.prediction.updateSmoothing();
        }
      }
    }

    // Check Pause
    if (this.input.actions.pauseJustPressed) {
      this.pauseGame();
      return;
    }

    // Check Tuning Panel (F2)
    if (this.input.actions.f2JustPressed) {
      this.tuningPanel.toggle();
    }

    // Check Skills Menu (Tab) - SkillSystem handles the toggle internally in update()
    // so we don't need to call it again here. Just leave the update() to handle it.

    // Check Moon Ledger (T)
    if (this.input.actions.ledgerJustPressed && this.moonLedger) {
      this.moonLedger.toggle();
    }

    // Apply Time Dilation (slow-mo) + Menu slow-mo
    const menuSlow = (this.summons.wheelOpen || this.skills.menuOpen || (this.moonLedger && this.moonLedger.isOpen)) ? 0.12 : 1.0;
    const effectiveDt = dt * this.combat.timeDilation * menuSlow;

    // Astral Form & Shadow Army Controls
    if (this.input.actions.astralJustPressed) {
      if (this.combat.toggleAstralForm) {
        this.combat.toggleAstralForm(this.player, this.vfx, this.audio, this.camera);
      } else if (this.combat.canActivateAstral && this.combat.canActivateAstral()) {
        this.combat.activateAstralForm(this.vfx, this.particles, this.audio, this.camera);
      }
      Achievements.unlock('astral_awoken', this.menuManager);
    }

    if (this.input.actions.extractJustPressed && this.player && this.shadowArmy) {
      if (this.shadowArmy.tryExtractSoul && this.tileMap.soulMarkers) {
        this.shadowArmy.tryExtractSoul(
          this.player,
          this.tileMap.soulMarkers,
          this.moonLedger?.stats?.sense || 10,
          this.combat,
          this.vfx,
          this.audio,
          this.camera
        );
      } else if (this.shadowArmy.tryExtractNearest) {
        this.shadowArmy.tryExtractNearest(this.player, this.tileMap, this.combat, this.vfx, this.audio, this.camera);
      }
      Achievements.unlock('shadow_army', this.menuManager);
    }

    if (this.shadowArmy.updateRiseAndCommand) {
      this.shadowArmy.updateRiseAndCommand(
        this.input.actions.riseHold,
        this.input.actions.riseJustPressed,
        this.player,
        this.vfx,
        this.audio,
        this.camera
      );
    } else if (this.input.actions.riseJustPressed && this.shadowArmy.commandRise) {
      this.shadowArmy.commandRise(this.player, this.vfx, this.audio, this.camera);
    }

    if (this.input.actions.exchangeJustPressed && this.player) {
      if (this.shadowArmy.tryShadowExchange) {
        this.shadowArmy.tryShadowExchange(this.player, this.vfx, this.audio, this.camera);
      } else if (this.shadowArmy.commandExchange) {
        this.shadowArmy.commandExchange(this.player, this.vfx, this.audio, this.camera);
      }
    }

    if (this.shadowArmy.updateSovereignsReach) {
      this.shadowArmy.updateSovereignsReach(
        this.input.actions.reachHold,
        this.player,
        this.tileMap.getAllEnemies(),
        this.tileMap.boss,
        effectiveDt,
        this.vfx,
        this.audio,
        this.camera
      );
    }

    // Update Astral Monarch giant avatar
    if (this.combat.isAstralForm && this.astralMonarch) {
      this.astralMonarch.update(
        this.player,
        effectiveDt,
        this.vfx,
        this.audio,
        this.camera,
        this.tileMap.getAllEnemies(),
        this.tileMap.boss
      );
    }

    // Update Shadow Army
    if (this.shadowArmy) {
      this.shadowArmy.update(
        this.player,
        this.tileMap.getAllEnemies(),
        this.tileMap.boss,
        effectiveDt,
        this.combat.isAstralForm,
        this.skills.domains && this.skills.domains.length > 0,
        this.vfx,
        this.audio,
        this.camera
      );
    }

    // Update Moon Ledger
    if (this.moonLedger) {
      this.moonLedger.update(effectiveDt, this.input);
    }

    // Objective completions
    if (this.tileMap.boss && this.tileMap.boss.isDead && this.moonLedger) {
      if (this.currentLevelIndex === 2) this.moonLedger.completeObjective('warden', this.audio);
      if (this.currentLevelIndex === 3) this.moonLedger.completeObjective('maldrek', this.audio);
      if (this.currentLevelIndex === 4) this.moonLedger.completeObjective('nythrax', this.audio);
    }
    if (this.shadowArmy && this.shadowArmy.storedArmy && this.shadowArmy.storedArmy.length >= 4 && this.moonLedger) {
      this.moonLedger.completeObjective('soldiers', this.audio);
    }

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

    // Update Player & Companion
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
      dt
    );

    this.firefly.update(this.player, this.particles, effectiveDt);

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

    // Update TileMap (shrines, moving platforms, hazards, enemies, bosses)
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

    // Check Shrines for Auto-Save & Checkpoints
    for (const sh of this.tileMap.shrines) {
      if (sh.isLit && !sh.hasSaved) {
        sh.hasSaved = true;
        if (Settings.get('autoSave')) {
          Saves.saveGame(this, true);
          this.menuManager.showToast(I18n.t('saved_toast'), '💾');
        }
        Achievements.unlock('first_light', this.menuManager);
      }
    }

    // Update VFX & Subsystems
    this.vfx.update(dt);
    if (this.playerManager) this.playerManager.update(effectiveDt, this.input);
    if (this.pingWheel) this.pingWheel.update(dt);
    if (this.chatBox) this.chatBox.update(dt);

    // Co-op all downed check -> checkpoint respawn
    if (this.playerManager && this.playerManager.players.size > 1 && this.playerManager.areAllPlayersDowned()) {
      this.restartFromCheckpoint();
      for (const info of this.playerManager.players.values()) {
        if (info.playerEntity) {
          this.playerManager.revivePlayer(info.playerEntity);
        }
      }
    }

    // Shared Camera Tracking Centroid of Living Players
    let camTargetX = this.player.x + this.player.width / 2;
    let camTargetY = this.player.y + this.player.height / 2;
    if (this.playerManager && this.playerManager.players.size > 1) {
      const living = this.playerManager.getLivingPlayers();
      if (living.length > 0) {
        let sumX = 0, sumY = 0;
        for (const p of living) {
          sumX += p.x + p.width / 2;
          sumY += p.y + p.height / 2;
        }
        camTargetX = sumX / living.length;
        camTargetY = sumY / living.length;
      }
    }
    this.camera.update(camTargetX, camTargetY, this.player.facing, dt);

    // Host Snapshot Broadcast (20 Hz) or Client Snapshot Interpolation
    if (this.network && this.network.isMultiplayer) {
      if (this.network.isHost && (this.network.tick % 3 === 0)) {
        const snapshot = {
          tick: this.network.tick,
          players: this.playerManager.getAllPlayerInfos().map(info => ({
            id: info.id,
            slot: info.slot,
            nickname: info.nickname,
            paletteId: info.palette ? info.palette.id : 0,
            x: info.playerEntity ? info.playerEntity.x : 0,
            y: info.playerEntity ? info.playerEntity.y : 0,
            vx: info.playerEntity ? info.playerEntity.vx : 0,
            vy: info.playerEntity ? info.playerEntity.vy : 0,
            facing: info.playerEntity ? info.playerEntity.facing : 1,
            health: info.playerEntity ? info.playerEntity.energy : 100,
            energy: info.playerEntity ? info.playerEntity.energy : 100,
            isDowned: info.playerEntity ? !!info.playerEntity.isDowned : false,
            reviveProgress: info.reviveProgress || 0
          })),
          enemies: this.tileMap.getAllEnemies().map(e => ({
            id: e.id || (e.x + '_' + e.y),
            type: e.type,
            x: e.x,
            y: e.y,
            vx: e.vx || 0,
            vy: e.vy || 0,
            health: e.health,
            facing: e.facing || 1,
            state: e.state
          })),
          boss: this.tileMap.boss ? {
            x: this.tileMap.boss.x,
            y: this.tileMap.boss.y,
            health: this.tileMap.boss.health,
            maxHealth: this.tileMap.boss.maxHealth,
            phase: this.tileMap.boss.phase,
            state: this.tileMap.boss.state,
            facing: this.tileMap.boss.facing
          } : null
        };
        this.network.send({
          type: NET_MESSAGE_TYPES.SNAPSHOT,
          snapshot
        });
      } else if (!this.network.isHost && this.network.latestSnapshot) {
        this.interpolator.pushSnapshot(this.network.latestSnapshot);
        const interp = this.interpolator.getInterpolatedState();
        if (interp && interp.players) {
          for (const sp of interp.players) {
            if (sp.id !== this.network.playerId) {
              const remoteInfo = this.playerManager.players.get(sp.id);
              if (remoteInfo && remoteInfo.playerEntity) {
                const rp = remoteInfo.playerEntity;
                rp.x = sp.x;
                rp.y = sp.y;
                rp.vx = sp.vx;
                rp.vy = sp.vy;
                rp.facing = sp.facing;
                rp.energy = sp.energy;
                rp.isDowned = sp.isDowned;
                remoteInfo.reviveProgress = sp.reviveProgress;
                remoteInfo.state = sp.isDowned ? 'DOWNED' : 'ALIVE';
              }
            }
          }
        }
      }
    }

    // Update Particles
    if (this.accessibility.highQuality !== false || Math.random() < 0.6) {
      this.particles.update(dt, this.camera);
    }

    this.hud.update(dt);

    // Check Level Exit Portal
    if (this.tileMap.isExitReached(this.player)) {
      this.startLevelResults();
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
        this.state = SCENE_STATES.PLAYING;
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
      this.startCredits();
    }
  }

  render() {
    const ctx = this.ctx;
    const time = performance.now() * 0.001;

    // Render Scene-Based Displays
    if (this.state === SCENE_STATES.BOOT) {
      this.bootScene.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.SPLASH) {
      this.splashScene.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.PRESS_KEY) {
      this.pressKeyScene.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.INTRO_CINEMATIC && this.introCinematic) {
      this.introCinematic.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.MAIN_MENU) {
      this.titleScene.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.LEVEL_RESULTS && this.resultsScene) {
      this.resultsScene.render(ctx);
      return;
    }
    if (this.state === SCENE_STATES.CREDITS && this.creditsScene) {
      this.creditsScene.render(ctx);
      return;
    }

    // World Gameplay Render (PLAYING, PAUSED, TRANSITION, FINALE)
    ctx.fillStyle = '#090814';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Parallax Background
    this.background.render(ctx, this.camera, time, this.moonProgress);

    if (this.tileMap && this.player) {
      ctx.save();
      const rx = this.camera.getRenderX();
      const ry = this.camera.getRenderY();

      if (this.vfx.zoomScale !== 1.0) {
        ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.scale(this.vfx.zoomScale, this.vfx.zoomScale);
        ctx.translate(-GAME_WIDTH / 2, -GAME_HEIGHT / 2);
      }

      ctx.translate(-rx, -ry);

      // TileMap & Entities
      this.tileMap.render(ctx, this.camera);
      this.vfx.renderWorld(ctx);
      this.combat.render(ctx);
      this.summons.renderWorld(ctx);
      this.skills.renderWorld(ctx, this.camera);
      this.shadowArmy.render(ctx, this.camera, this.player);

      if (this.combat.isAstralForm) {
        this.astralMonarch.render(ctx, this.camera);
      }

      this.player.render(ctx);
      // Render Co-Op Teammates
      if (this.playerManager) {
        for (const p of this.playerManager.getAllPlayers()) {
          if (p !== this.player && !p.isDowned) {
            p.render(ctx);
          }
        }
      }
      this.firefly.render(ctx);

      // Finale Orbiting Shards
      if (this.state === SCENE_STATES.FINALE_CINEMATIC) {
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

      // Lighting & Bloom
      if (Settings.get('dynamicLighting') !== false) {
        const ambientDarkness = this.levels[this.currentLevelIndex]?.ambientDarkness || 0.90;
        this.lighting.render(ctx, this.player, this.firefly, this.tileMap, this.camera, ambientDarkness);
      }

      this.particles.render(ctx, this.camera);
      if (this.playerManager) {
        this.playerManager.renderWispsAndNames(ctx, this.camera);
      }
      if (this.pingWheel) {
        this.pingWheel.render(ctx);
      }

      // Screen Flashes
      this.vfx.renderScreenOverlay(ctx, GAME_WIDTH, GAME_HEIGHT, this.accessibility.flashIntensity);

      // Off-Screen Threat Indicators (Accessibility)
      if (Settings.get('threatIndicators')) {
        this.renderThreatIndicators(ctx);
      }

      // HUD
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

      this.summons.renderWheel(ctx, GAME_WIDTH, GAME_HEIGHT, this.combat.soulEnergy);
      this.skills.renderMenu(ctx, GAME_WIDTH, GAME_HEIGHT);
      this.moonLedger.render(ctx);
      if (this.partyHUD) {
        this.partyHUD.render(ctx);
      }
    }

    // Show FPS Counter
    if (Settings.get('showFps')) {
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#7be0ad';
      ctx.fillText(`${this.fpsCounter} FPS`, 12, 22);
      ctx.restore();
    }

    // Transition Fade
    if (this.state === SCENE_STATES.TRANSITION && this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(9, 8, 20, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Paused State Dim & Blur
    if (this.state === SCENE_STATES.PAUSED) {
      ctx.fillStyle = 'rgba(9, 8, 20, 0.72)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  renderThreatIndicators(ctx) {
    if (!this.tileMap || !this.player) return;
    const bounds = this.camera.getVisibleBounds();
    const enemies = this.tileMap.getAllEnemies();

    for (const e of enemies) {
      if (e.isDead) continue;
      // Check if off screen
      const isOffLeft = e.x < bounds.left - 20;
      const isOffRight = e.x > bounds.right + 20;

      if (isOffLeft || isOffRight) {
        const indX = isOffLeft ? 16 : GAME_WIDTH - 16;
        const indY = Math.max(30, Math.min(GAME_HEIGHT - 30, (e.y - bounds.top)));

        ctx.save();
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        if (isOffLeft) {
          ctx.moveTo(indX, indY);
          ctx.lineTo(indX + 10, indY - 6);
          ctx.lineTo(indX + 10, indY + 6);
        } else {
          ctx.moveTo(indX, indY);
          ctx.lineTo(indX - 10, indY - 6);
          ctx.lineTo(indX - 10, indY + 6);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
