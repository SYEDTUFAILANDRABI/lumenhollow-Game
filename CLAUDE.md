# CLAUDE.md - Project Guide & Context for Claude

> This file is automatically read by Claude to understand the architecture, conventions, and status of **Lumen Hollow: Underworld & Sovereign Edition**.
> For the complete comprehensive documentation, see [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md).

---

## 🚀 Quick Reference Commands

- **Run Dev Server**: `npm run dev` (starts Vite on `http://localhost:5173/`)
- **Quick Launch Script**: Run `run_game.bat` or `play.bat` (Windows)
- **Run Full Menu & Settings Test**: `node tests/verify_menu_settings_system.js`
- **Run Combat, Summons & Skills Test**: `node tests/verify_upgrade_game.js`
- **Run Boss & Skeleton Sprites Test**: `node tests/verify_boss_and_skeleton_sprites.js`
- **Run Core Game Regression Test**: `node tests/verify_game.js`
- **Run Platform Reachability Simulation**: `node tests/reachability_audit.js`

*Note: In Windows PowerShell, separate commands using `;` (not `&&`).*

---

## 🎮 What is Lumen Hollow?

A 2D dark-fantasy action-platformer built with vanilla JavaScript (ES modules) running on Vite and rendered to an HTML5 `<canvas>`.
- **Zero runtime dependencies**: Pure Canvas 2D + vanilla JS. No Phaser, Pixi, or external game engine.
- **Pure Web Audio synthesis**: Zero audio files (`.mp3`/`.wav`). All music, ambient soundscapes, slashes, roars, and drones are generated dynamically via `src/systems/AudioSystem.js`.
- **Hybrid UI**: 60 FPS Canvas rendering for gameplay, paired with an accessible HTML/CSS overlay for menus, modals, and settings.

---

## 🏗️ Architecture & Scene Flow

### Scene State Machine (`src/core/Constants.js: SCENE_STATES`)
`BOOT` ➔ `SPLASH` ➔ `PRESS_KEY` ➔ `INTRO_CINEMATIC` (first launch only) ➔ `TITLE` / `MAIN_MENU` ➔ `PLAYING`
From `PLAYING`:
- `PAUSED`: In-game HTML pause menu (resume, restart, settings, save)
- `LEVEL_RESULTS`: Post-stage stat count-up (time, shards, combo, S/A/B/C rank badge)
- `CREDITS`: Smooth scrolling credits
- `FINALE_CINEMATIC`: Shards orbit Lumi, restores moon, triggers victory

---

## ⚠️ Critical Parameter Contracts (Do Not Break)

When calling these functions, always preserve their exact parameter orders:

1. **`Player.update()`** (`src/entities/Player.js`):
   ```javascript
   this.player.update(
     this.input,                     // MUST be full this.input object (NOT this.input.actions)
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
   ```

2. **`CombatSystem.update()`** (`src/systems/combat/CombatSystem.js`):
   ```javascript
   this.combat.update(
     effectiveDt,                    // 1st param is dt
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
   ```

3. **`TileMap.updateEntities()`** (`src/levels/TileMap.js`):
   ```javascript
   this.tileMap.updateEntities(      // NOTE: method is updateEntities, not update
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
   ```

4. **`SummonSystem.update()`** (`src/systems/summons/SummonSystem.js`):
   ```javascript
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
     this.input                      // Receives full input
   );
   ```

5. **`Input.update(dt)` Must Be Global** (`src/core/Game.js`):
   `this.input.update(dt)` must run at the top of `Game.update(dt)` every frame so input transitions and `justPressed` events trigger across all scene states (including `LEVEL_RESULTS` and `CREDITS`).

---

## 🕹️ Controls

- **Movement**: `A` / `D` or Arrow Keys (Run), `Space` (Jump / Double Jump / Firefly Glide), `S` in air (Fast Fall)
- **Combat**: `J` (Lantern Slash 3-hit combo), `C` / `Ctrl` (Shadow Dash), `Shift` / `K` (Lantern Pulse), `S` + `Jump` (Void Plunge)
- **Ultimate**: Hold `Q` at 100% Eclipse (Sovereign's Aura screen-wide lightning & 40Hz sub-bass boom)
- **Summons**: `E` (Radial Wheel) or `1`–`5` (Quick Summons via Soul Energy)
- **Skills**: `Tab` (Skills & Presets Menu), `U` / `I` / `O` (Equipped Skill Slots)
- **Shadows**: `R` (Astral Form), `F` (Extract Soul), `G` (Command Rise), `H` (Shadow Exchange)
- **UI & System**: `Esc` / `P` (Pause), `T` (Moon Ledger), `F2` (Physics Tuning Panel), `M` (Mute)

---

## 📁 Source Code Organization

- `src/core/`: Game loop, constants, camera, inputs, save slots (`SaveManager.js`), settings (`SettingsManager.js`), localization (`I18n.js`)
- `src/entities/`: `Player.js`, `PlayerSprite.js`, `FireflyCompanion.js`, platforms, shrines, and enemies/bosses
- `src/levels/`: ASCII levels 1 to 6 and `TileMap.js` engine
- `src/scenes/`: Boot, Splash, PressKey, Title, IntroCinematic, LevelResults, Credits
- `src/systems/`: Audio synthesizer (`AudioSystem.js`), Lighting, Parallax, Particles, Combat, Summons, Skills, Shadows (`ShadowArmy.js`, `AstralMonarch.js`), VFX
- `src/ui/`: HUD, Moon Ledger, HTML/CSS MenuManager, MainMenu, Modals (SaveSlots, LevelSelect, Collection, Achievements, Settings, ControlsRebind)
- `tests/`: Automated Puppeteer end-to-end and regression test scripts

---

## 🧪 Current Verification Status

All 5 test suites pass with **0 console errors**:
- ✅ `tests/verify_game.js`
- ✅ `tests/verify_upgrade_game.js`
- ✅ `tests/verify_boss_and_skeleton_sprites.js`
- ✅ `tests/verify_menu_settings_system.js`
- ✅ `tests/reachability_audit.js`
