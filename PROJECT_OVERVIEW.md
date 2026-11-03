# Lumen Hollow: Underworld & Sovereign Edition
## Comprehensive Technical Documentation & Architecture Guide

> **Target Audience**: Developers, AI coding assistants (including Claude, Gemini, Antigravity), and contributors joining or maintaining the project.

---

## 1. Executive Summary

**Lumen Hollow: Underworld & Sovereign Edition** is a high-polish, atmospheric 2D dark-fantasy action-platformer built from scratch in vanilla JavaScript (ES modules) running on Vite and rendered directly to an HTML5 `<canvas>`.

### Core Narrative & Premise
The celestial moon has shattered into five shards that fell into the dark, mist-veiled Hollow Wood. Players control **Lumi**, a hooded wanderer who carries the last glowing lantern. Guided by a loyal firefly companion, Lumi journeys through whispering groves, glowing crystal caverns, moving sky ruins, and underworld spires to defeat abyssal demons, master shadow necromancy, summon underworld beasts, and return the shards to the Moon Shrine.

### Technical Standouts
1. **Zero External Runtime Libraries**: No Phaser, Pixi, or Three.js. Physics, tile maps, collision detection, particle systems, dynamic lighting, and combat are implemented from first principles.
2. **Pure Web Audio Procedural Synthesis**: **Zero MP3/WAV/OGG sound files**. Every single sound effect, drone, heartbeat, footstep, slash, boss roar, and ambient background music layer is synthesized procedurally in real-time via the Web Audio API.
3. **Hybrid Canvas + Accessible HTML/CSS UI**: Fast 60 FPS gameplay on Canvas, combined with an accessible, keyboard/gamepad navigable HTML5 overlay for menus, settings, and modal dialogues.

---

## 2. Quick Start & Developer Guide

### Prerequisites
- Node.js (v18+ recommended)
- Google Chrome (for running automated Puppeteer tests)

### Installation & Execution
```bash
# Install dependencies (Vite + Puppeteer-core for tests)
npm install

# Run local development server
npm run dev
# Server runs on: http://localhost:5173/
```

### One-Click Launch Script
- `run_game.bat` or `play.bat`: Windows batch scripts that automatically start the Vite server and launch the default browser to `http://localhost:5173/`.

### Automated Test Verification Suite
All automated tests use Puppeteer to run headless Chrome against the live Vite server:
```bash
# 1. Full Menus, Settings, Save Slots & Scenes Verification (13 screenshots)
node tests/verify_menu_settings_system.js

# 2. Physics, Sovereign Aura, Summons, Swappable Skills & Boss Fight
node tests/verify_upgrade_game.js

# 3. Skeleton & Final Boss Custom Sprite Sheets (Levels 5 & 6)
node tests/verify_boss_and_skeleton_sprites.js

# 4. Core Level Flow, Shard Collection, Mute & Win State
node tests/verify_game.js

# 5. Jump Physics Reachability Simulation Audit
node tests/reachability_audit.js
```

---

## 3. Architecture & Tech Stack

```
               +-------------------------------------------------+
               |                   index.html                    |
               +-------------------------------------------------+
                                        |
               +-------------------------------------------------+
               |               src/main.js (Entry)               |
               +-------------------------------------------------+
                                        |
               +-------------------------------------------------+
               |                src/core/Game.js                 |
               |       (Central State Machine & Game Loop)       |
               +-------------------------------------------------+
                   /            |             \           \
  +------------------+  +---------------+  +-----------+  +-----------------+
  | Scene Management |  | Subsystems    |  | Entities  |  | UI & Overlays   |
  +------------------+  +---------------+  +-----------+  +-----------------+
  | BootScene        |  | Input / GP    |  | Player    |  | MenuManager     |
  | SplashScene      |  | AudioSystem   |  | Companion |  | MainMenu        |
  | PressKeyScene    |  | Camera        |  | TileMap   |  | SettingsModal   |
  | IntroCinematic   |  | LightingSystem|  | Enemies   |  | SaveSlotsModal  |
  | TitleScene       |  | ParticleSystem|  | Bosses    |  | PauseMenu       |
  | LevelResultsScene|  | VFXManager    |  | Summons   |  | HUD             |
  | CreditsScene     |  | CombatSystem  |  | Shadows   |  | MoonLedger      |
  +------------------+  +---------------+  +-----------+  +-----------------+
```

### Game Loop & Fixed Timestep
- `Game.js` runs a fixed timestep accumulator pattern (`timeStep = 1 / 60` seconds = 16.66ms per update) with dynamic delta accumulation to guarantee rock-solid physics across variable monitor refresh rates (60Hz, 120Hz, 144Hz, 240Hz).
- Canvas dimension: internal virtual resolution is **800 × 450** pixels (16:9 aspect ratio), scaled via CSS `letterbox/pillarbox` to fit any browser window cleanly while preserving pixel-perfect alignment.

---

## 4. Scene Flow State Machine

The game enforces a clear scene state flow (`SCENE_STATES` defined in `src/core/Constants.js`):

```
+-------------------------------------------------------------------------------+
| BOOT           Short loading bar with randomized gameplay tips & warm-up.     |
+-------------------------------------------------------------------------------+
       |
       v
+-------------------------------------------------------------------------------+
| SPLASH         Procedural studio emblem animation: STUDIO_NAME + "presents".  |
+-------------------------------------------------------------------------------+
       |
       v
+-------------------------------------------------------------------------------+
| PRESS_KEY      Browser user-gesture requirement: unlocks Web AudioContext.     |
+-------------------------------------------------------------------------------+
       |
       +---> [First Launch Only] ---> INTRO_CINEMATIC (20s moon shatter lore)
       |                                     |
       v                                     v
+-------------------------------------------------------------------------------+
| TITLE / MAIN_MENU  Parallax sky, idling Lumi sprite, fireflies, HTML menu.    |
+-------------------------------------------------------------------------------+
       |
       v
+-------------------------------------------------------------------------------+
| PLAYING        Active gameplay, platforming, combat, summons, shadow army.   |
|   |--> PAUSED           In-game HTML pause menu with settings, restart, save. |
|   |--> LEVEL_RESULTS    Post-stage summary: time, shards, combo, S/A/B/C rank.|
|   |--> CREDITS          Smooth vertical scrolling credits sequence.           |
|   |--> FINALE_CINEMATIC Shards orbit Lumi, celestial moon restores, victory.  |
+-------------------------------------------------------------------------------+
```

---

## 5. Gameplay Mechanics & Systems Deep-Dive

### 5.1 Platforming & Physics (`src/entities/Player.js`)
- **Asymmetric Gravity**: Rapid, punchy fall gravity (`GRAVITY_DOWN = 1350 px/s²`) paired with controllable ascent gravity (`GRAVITY_UP = 820 px/s²`) for crisp platforming feel.
- **Variable Jump & Apex Hang**: Holding `Space` produces high jumps (6+ tiles); near peak vertical velocity, gravity drops by 50% for 120ms to allow responsive air-steering.
- **Double Jump**: Mid-air jump with custom particle shockwave and sound chirp.
- **Firefly Glide**: Holding `Space` mid-air while descending reduces vertical speed to 55 px/s, bathed in lantern fireflies.
- **Wall Cling & Wall Jump**: Pushing against solid tiles enables wall slide at 85 px/s and diagonal wall kicks.
- **Fast-Fall**: Holding `S` or `Down Arrow` forces high-speed descent (620 px/s cap).
- **Moving Platforms**: Carries Lumi smoothly without clipping (`src/entities/MovingPlatform.js`).

### 5.2 Core Combat System (`src/systems/combat/CombatSystem.js`)
- **Lantern Slash**: 3-hit combo (`J`). Hits 1 & 2 deal horizontal slashes; Hit 3 unleashes a wide crescent shockwave.
- **Umbral Bolt**: Piercing projectile with glowing particle ribbon trail.
- **Shadow Dash** (`C` / `Ctrl`): Invulnerable 0.22s dash through enemies and hazards with chromatic afterimages. Resets on ground touch, wall cling, or enemy kill.
- **Void Plunge** (`S` + `Jump` in air): Downward slam crashing into ground, forming a dark crater with piercing dark spikes.
- **Parry System**: Slashing during an incoming enemy attack triggers a 120ms freeze-frame, gold starburst VFX, slow-mo stagger, and bonus Eclipse meter.

### 5.3 Soothing Lantern Audio (`src/systems/AudioSystem.js`)
- **Key Press / Release Design**: Fixed previous shrill beeps by redesigning the lantern pulse sound using a 3-oscillator pentatonic chord (C4, E4, G4, octave shimmer) with detuning, 120ms soft attack, 1.8s smooth release, 2.5kHz low-pass filter, airy band-pass noise breath, and a procedural convolution reverb impulse.
- **Master Bus**: Master dynamics compressor and limiter prevent clipping or harsh transients.
- **Individual Volume Channels**: Master, Music, SFX, Ambience, and UI volume buses.

### 5.4 Sovereign's Aura (Goosebumps Ultimate)
- **Charge Phase** (Hold `Q` at 100% Eclipse):
  - Music muffles through low-pass biquad filter.
  - Procedural sub-bass heartbeat decelerates (`58Hz -> 28Hz`).
  - Vignette tightens; ground debris floats upward against gravity.
- **Release Blast**:
  - 100ms freeze-frame, screen inverted flash, time dilates to 30%.
  - 16-ray recursive midpoint displacement lightning across walls and floor.
  - Concentric chromatic shockwave rings and full-screen glass crack overlay.
  - 180ms silence cut followed by a **40Hz sub-bass boom**, dark choir drone, and tinnitus ring.
- **Willpower Hierarchy**:
  - *Low Will* (Shadow Wisps, Skeleton Warriors): Dissolve instantly into souls.
  - *Medium Will* (Hollow Knights, Crow Wraiths, Fire Imps): Forced to knees trembling for 2.2s.
  - *High Will* (Eclipse Warden, Demon Lord Maldrek): Staggered and stunned.
  - *Very High Will* (Nythrax Sovereign): Immune to faint; triggers arena phase change.

### 5.5 Underworld Summons (`src/systems/summons/SummonSystem.js`)
Lumi collects **Soul Energy** (up to 100) from fallen enemies to call up to 2 active creatures simultaneously:
1. **Tri-Maw** (Cost: 20): 3-headed hellhound with animated jaws, sprinting bites.
2. **Ashen Wyrm** (Cost: 25): Segmented skeletal flying dragon breathing violet flame.
3. **Hollow Reaper** (Cost: 30): Cloaked reaper swinging a giant crescent scythe.
4. **Abyss Titan** (Cost: 35): Colossal horned shadow titan slamming earth with shockwaves.
5. **Skeleton Legion** (Cost: 25): 5-member skeleton warrior squad swarming targets.
- Activation: Press `E` for slow-mo radial wheel, or quick keys `1`–`5`.

### 5.6 Swappable Skills (`src/systems/skills/SkillSystem.js`)
Press `Tab` to open the loadout screen with 3 slots mapped to `U`, `I`, `O`:
- **7 Abilities**: Umbral Bolt, Void Plunge, Crescent Wave, Soul Chain, Gravity Well, Shadow Clone, Spirit Lance.
- **3 Persistent Presets** saved automatically to `localStorage`.

### 5.7 Astral Form & Shadow Army (`src/systems/shadow/`)
- **Astral Form** (`R` at 100% Eclipse): Manifests the giant **Astral Monarch** shadow avatar behind Lumi, granting boosted attack hitboxes and dark energy trails (`AstralMonarch.js`).
- **Shadow Soul Extraction** (`F`): Harvests souls from fallen enemies marked by `SoulMarker.js` to build a personal shadow army.
- **Command Rise** (`G`): Orders summoned shadow soldiers to charge and assault targets.
- **Shadow Exchange** (`H`): Instantly teleports Lumi to the location of the farthest shadow soldier.
- **Sovereign's Reach**: Pulls distant shadows back into Lumi's lantern.

### 5.8 Moon Ledger (`src/ui/MoonLedger.js`)
Press `T` in-game to toggle the ledger: displays current level stats, playtime, combat rank, active objectives (e.g. Defeat Warden, Slay Maldrek, Banish Nythrax, Recruit 4 Soldiers), and ledger progression.

---

## 6. Complete File Directory & Module Index

```
src/
├── main.js                               Entry point: attaches window.__LUMEN_GAME__
│
├── core/
│   ├── Constants.js                      Canvas dimensions (800x450), STUDIO_NAME,
│   │                                     SCENE_STATES, DIFFICULTY_SETTINGS, COLORS
│   ├── Game.js                           Master orchestrator, state loop, scene router
│   ├── Camera.js                         Smooth lerp camera with shake, bounds & punch
│   ├── Input.js                          Keyboard, touch, & Gamepad bindings mapper
│   ├── Storage.js                        Low-level localStorage helper
│   ├── i18n/
│   │   └── I18n.js                       6 languages (EN, ES, FR, DE, JA, AR) dictionary
│   ├── input/
│   │   └── GamepadManager.js             Gamepad API wrapper, deadzones & vibration
│   ├── saveManager/
│   │   └── SaveManager.js                3 save slots, canvas thumbnail generator,
│   │                                     migration from legacy lumen_hollow_save_v1
│   └── settingsManager/
│       └── SettingsManager.js            Reactive Settings with event emitter & presets
│
├── entities/
│   ├── Player.js                         Lumi physics, combat state machine, combos
│   ├── PlayerSprite.js                   Player sprite sheet animator (idle/run/jump/atk)
│   ├── FireflyCompanion.js               Floating firefly guiding towards objectives
│   ├── FireflyPickup.js                  Light replenishing pickup
│   ├── MoonGlassPlatform.js              Platforms that materialize under lantern light
│   ├── MoonShard.js                      Collectible celestial shards
│   ├── MovingPlatform.js                 Dynamic horizontal moving platforms
│   ├── ShadowWisp.js                     Tier 1 shadow enemies
│   ├── Shrine.js                         Checkpoints with warm glow & auto-save trigger
│   ├── enemies/
│   │   ├── CombatDummy.js                Training dummy
│   │   ├── CrowWraith.js                 Flying dive-bombing wraith
│   │   ├── Demons.js                     FireImp, HornedBrute, HellCaster
│   │   ├── HollowKnight.js               Shield-bearing patrolling knight
│   │   ├── Skeletons.js                  SkeletonWarrior, SkeletonArcher, BoneKnight
│   │   ├── SkeletonSprite.js             Custom sprite sheet animation for skeletons
│   │   └── SoulMarker.js                 Extractable soul left on enemy death
│   └── boss/
│       ├── EclipseWarden.js              Level 3 Mini-boss (shield, shockwave, aura)
│       ├── DemonLord.js                  Level 4 Mini-boss (Maldrek, flaming greatsword)
│       ├── ArchDemon.js                  Level 5 Boss (Azrakul, 3-phase hellfire rain)
│       ├── AbyssSovereign.js             Level 6 Final Boss (Nythrax, 4 phases)
│       └── SorcererBossSprite.js         Nythrax custom sprite sheet integration
│
├── levels/
│   ├── TileMap.js                        ASCII level parser, tile collision, entity spawner
│   ├── Level1.js                         Whispering Grove (Intro / Tutorial)
│   ├── Level2.js                         Crystal Caverns (Moon-glass platforms)
│   ├── Level3.js                         Nether Spire (Moving platforms, Warden boss)
│   ├── Level4.js                         Starlit Sky Ruins (Demons, Demon Lord Maldrek)
│   ├── Level5.js                         Catacombs of Uprising (Skeletons, Arch Demon Azrakul)
│   └── Level6.js                         Moon Shrine (Final showdown with Nythrax)
│
├── scenes/
│   ├── BootScene.js                      Warm-up screen, smooth loading bar & game tips
│   ├── SplashScene.js                    STUDIO_NAME logo procedural glowing animation
│   ├── PressKeyScene.js                  AudioContext unlock screen with crescent pulse
│   ├── TitleScene.js                     Parallax title canvas with idling Lumi & fireflies
│   ├── IntroCinematicScene.js            20s canvas cinematic (moon shatter lore, skippable)
│   ├── LevelResultsScene.js              Post-stage count-up: time, shards, combo, rank
│   └── CreditsScene.js                   Smooth scrolling credits with starry backdrop
│
├── systems/
│   ├── AudioSystem.js                    Pure Web Audio API procedural synthesizer
│   ├── LightingSystem.js                 Dynamic 2D radial light occlusion & shadows
│   ├── ParallaxBackground.js             Multi-layered parallax mountains, sky, moon
│   ├── ParticleSystem.js                 Object-pooled particle emitter (embers, sparks)
│   ├── combat/
│   │   ├── CombatConstants.js            Damage values, cooldowns, combo timing
│   │   ├── CombatSystem.js               Damage calculation, parry, Eclipse meter
│   │   └── Projectile.js                 Umbral bolts, arrows, fireballs, beams
│   ├── shadow/
│   │   ├── AstralMonarch.js              Giant shadow avatar controller & animations
│   │   └── ShadowArmy.js                 Shadow soldier collection, commands, exchange
│   ├── skills/
│   │   ├── SkillAbilities.js             Definitions & logic for the 7 swappable skills
│   │   └── SkillSystem.js                Slot assignment, Tab overlay, cooldowns
│   ├── summons/
│   │   ├── Creatures.js                  Canvas renderers for the 5 underworld creatures
│   │   └── SummonSystem.js               Radial wheel (E), quick-summon 1-5 keys
│   └── vfx/
│       ├── DamageNumbers.js              Floating animated combat damage indicators
│       ├── LightningEffect.js            Recursive midpoint-displacement lightning
│       ├── Shockwave.js                  Expanding chromatic shockwave rings
│       └── VFXManager.js                 Screen shake, freeze-frame, zoom punch, flashes
│
└── ui/
    ├── HUD.js                            Health, Eclipse meter, Soul Energy, cooldowns
    ├── MenuOverlay.js                    Legacy overlay drawing fallback
    ├── MoonLedger.js                     In-game ledger overlay (T)
    ├── menus/
    │   ├── MenuManager.js                HTML/CSS overlay manager with ARIA & toast popups
    │   ├── MainMenu.js                   12-item main menu screen
    │   ├── SaveSlotsModal.js             3 interactive save slots with thumbnails
    │   ├── LevelSelectModal.js           Level 1-6 selector with times & ranks
    │   ├── CollectionModal.js            12 Bestiary creatures + 5 Moon Shards lore
    │   ├── AchievementsModal.js          16 achievements tracker & unlock notifications
    │   ├── WelcomeModal.js               First-launch setup (language, volume test)
    │   └── PauseMenu.js                  In-game pause menu with backdrop blur & resume
    └── settings/
        ├── SettingsModal.js              7-tab reactive settings modal
        └── ControlsRebindModal.js        Full keyboard & gamepad rebinding interface
```

---

## 7. Controls Summary Reference

| Action | Primary Key | Secondary Key | Gamepad (Standard) |
|---|---|---|---|
| **Move Left / Right** | `A` / `D` | `Left` / `Right` Arrow | D-Pad / Left Stick |
| **Jump / Double Jump / Glide** | `Space` | `W` / `Up` Arrow | `A` (Button 0) |
| **Fast Fall** | `S` (in air) | `Down` Arrow | Left Stick Down |
| **Lantern Slash (3-Hit Combo)** | `J` | — | `X` (Button 2) |
| **Shadow Dash** | `C` | `Left Ctrl` | `B` (Button 1) |
| **Lantern Pulse** | `ShiftLeft` | `K` | `Right Trigger` |
| **Void Plunge** | `S` + `Jump` | `Down` + `Jump` | Left Stick Down + `A` |
| **Sovereign's Aura (Hold)** | `Q` | — | `Y` (Button 3) |
| **Summon Wheel / Select** | `E` | — | `Left Bumper` |
| **Quick Summons 1–5** | `1`, `2`, `3`, `4`, `5` | — | D-Pad |
| **Skill Slots 1, 2, 3** | `U`, `I`, `O` | — | `Right Bumper`, etc. |
| **Skill Swap Menu** | `Tab` | — | Back / Select |
| **Astral Form** | `R` | — | Left + Right Stick Click |
| **Extract Soul** | `F` | — | `X` (Near Soul Marker) |
| **Command Rise** | `G` | — | D-Pad Up |
| **Shadow Exchange** | `H` | — | D-Pad Down |
| **Moon Ledger** | `T` | — | Touchpad / View |
| **Pause / Resume** | `Escape` | `P` | Start (Button 9) |
| **Physics Tuning Panel** | `F2` | — | — |
| **Mute Audio** | `M` | — | — |

---

## 8. Crucial Implementation Gotchas & Development Rules

When modifying or expanding the codebase, **always observe these strict contracts**:

### 1. `Player.update()` Parameter Contract
In `src/entities/Player.js:148`:
```javascript
update(input, tileMap, particleSystem, audioSystem, camera, combatSystem, vfx, enemies, boss, dt, shardUpgrades = {})
```
> **Warning**: Do NOT pass `input.actions` as the first argument. `Player.js` requires the full `this.input` object because it queries both `input.actions` and `input.keys`.

### 2. `CombatSystem.update()` Parameter Contract
In `src/systems/combat/CombatSystem.js:146`:
```javascript
update(dt, player, enemies, boss, tileMap, vfx, particles, audio, camera, shardUpgrades = {})
```
> **Warning**: The first argument is `dt` (or `effectiveDt`), followed by `player`, `enemies`, `boss`, etc.

### 3. `TileMap.updateEntities()` Parameter Contract
In `src/levels/TileMap.js:183`:
```javascript
updateEntities(player, particleSystem, audioSystem, camera, onShardCollect, dt, combatSystem, vfx, shardUpgrades)
```
> **Warning**: The method is named `updateEntities`, NOT `update`.

### 4. `SummonSystem.update()` Parameter Contract
In `src/systems/summons/SummonSystem.js:86`:
```javascript
update(dt, player, enemies, boss, combatSystem, vfx, audio, camera, particles, input)
```

### 5. `Input.update(dt)` Must Be Global
In `Game.js`, `this.input.update(dt)` is called at the very beginning of `Game.update(dt)` so that all input transitions and `JustPressed` flags are active across all scene states (`PLAYING`, `LEVEL_RESULTS`, `CREDITS`, `PAUSED`).

### 6. Zero External Audio Files
Do NOT add external `.mp3`, `.wav`, or `.ogg` audio files. All sound effects and music tracks must be created dynamically inside `src/systems/AudioSystem.js` using Web Audio API nodes (`OscillatorNode`, `BiquadFilterNode`, `GainNode`, `ConvolverNode`).

### 7. PowerShell Command Separators
When executing terminal commands in this environment, use `;` instead of `&&` because the active shell is PowerShell.

---

## 9. Recent Changelog & Current State

- **Milestone 1 (Audio Polish)**: Soothing pentatonic lantern pulse sound; master limiter; master low-pass filter; eliminated all harsh square-wave beeps.
- **Milestone 2 (Enemy Tiers)**: Added Skeletons (Warrior, Archer, Bone Knight), Demons (Fire Imp, Horned Brute, Hell Caster), and 3 Bosses (Maldrek, Azrakul, Nythrax).
- **Milestone 3 (Astral Form & Monarch)**: Added Astral Form transformation, purple aura, giant Astral Monarch avatar manifestation.
- **Milestone 4 (Shadow Army)**: Implemented soul harvesting (`F`), Command Rise (`G`), and Shadow Exchange (`H`).
- **Milestone 5 (Underworld Summons & Swappable Skills)**: 5 Canvas-drawn summons via `E` wheel, 7 swappable skills with `Tab` preset manager.
- **Milestone 6 (Scenes, Menus, Settings, Save Slots)**:
  - Added Boot, Studio Splash, Press Any Key, Intro Cinematic (20s canvas lore), Level Results, and Credits scenes.
  - Implemented 12-item Main Menu and 7-tab Settings modal with instant application.
  - Built 3 Save Slots with canvas screenshot thumbnails and automatic legacy migration.
  - Added 16 achievements with toast popups, Bestiary modal, and Level Select.
- **Milestone 7 (Bugfixes & Stabilization)**:
  - Resolved `Player.update`, `CombatSystem.update`, `SummonSystem.update`, and `TileMap.updateEntities` argument mismatches.
  - Fixed Level Results scene Continue button responsiveness by ensuring global input updates.
  - All 5 automated Puppeteer test suites passing with zero console errors.

---
*Generated for Lumen Hollow: Underworld & Sovereign Edition. Repository: https://github.com/SYEDTUFAILANDRABI/lumenhollow-Game.git*
