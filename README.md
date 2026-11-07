# Lumen Hollow: Underworld & Sovereign Edition

> *The moon has shattered into five shards that fell into the Hollow Wood. A hooded wanderer named Lumi carries the last lantern and must journey through whispering groves, crystal caverns, and starlit sky ruins to battle the void, defeat the Eclipse Warden, summon underworld creatures, and return the shards to the Moon Shrine.*

---

## 🎬 Scene Flow

```
Boot (loading + tips)
  ↓
Studio Splash ("Your Studio Name presents")
  ↓
Press Any Key (AudioContext unlock)
  ↓
Intro Cinematic (20s, skippable — moon shatters, Lumi lights lantern, title reveal)
  ↓
Title Screen (animated parallax, idling Lumi, fireflies)
  ↓
Main Menu
  ↓
Game  →  Pause Menu  →  Resume / Restart / Quit
         Level Results  →  Main Menu
         Credits
```

> **First launch only**: Intro cinematic plays automatically. Replay it anytime from **Main Menu → Replay Intro**.  
> **Subsequent launches**: Goes straight to Title Screen (configurable in Settings → Gameplay).

---

## 🎮 Complete Controls Guide

| Category | Action | Default Key | Rebindable? | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Movement** | Run | `A` / `D` or `←`/`→` | ✅ | Snappy ground acceleration & air control |
| | Jump / Double Jump | `Space` / `W` / `↑` | ✅ | 6+ tiles high single jump, double jump burst |
| | Firefly Glide | Hold `Space` in air | ✅ | Slow graceful glide descent with firefly glow |
| | Wall Slide & Jump | Push into wall + `Space` | ✅ | Cling, slide down walls, kick off diagonally |
| | Fast-Fall | Hold `S` / `↓` in air | ✅ | Rapid descent cap at 620px/s |
| **Core Combat** | Lantern Slash | `J` | ✅ | 3-hit combo; hit 3 unleashes shockwave |
| | Shadow Dash | `C` or `Left Ctrl` | ✅ | Invulnerable dash; resets on ground, wall, or kill |
| | Lantern Pulse | `Shift` or `K` | ✅ | Expands light radius, soothing pentatonic chime |
| | Void Plunge | `S` / `↓` (in air) | ✅ | Downward slam creating crater and dark spikes |
| | Parry | `J` on impact | — | Gold flash, slow-mo stagger, +Eclipse meter |
| **Sovereign's Aura** | Goosebumps Ultimate | Hold `Q` (at 100%) | ✅ | 0.7s charge, screen-wide lightning & cinematic boom |
| **Summoning** | Summon Wheel | `E` | ✅ | Slows time to 10%; radial wheel selection |
| | Quick Summons | `1`–`5` | ✅ | Instantly calls creatures using Soul Energy |
| **Swappable Skills** | Skill Slot 1, 2, 3 | `U`, `I`, `O` | ✅ | Casts abilities from current loadout preset |
| | Skills & Presets Menu | `Tab` | ✅ | Assign abilities & switch presets |
| **Astral Form** | Activate Astral Form | `R` | ✅ | Giant shadow manifestation, damage boost |
| **Shadow Army** | Extract Soul | `F` | ✅ | Harvest soul from defeated enemy |
| | Command Rise | `G` | ✅ | Order shadow soldier to attack |
| | Shadow Exchange | `H` | ✅ | Teleport-swap with a shadow soldier |
| **Moon Ledger** | Open Ledger | `T` | ✅ | View stats, objectives, and Moon Ledger |
| **System** | Pause | `Esc` or `P` | ✅ | Pause menu with settings & save |
| | Live Physics Tuning | `F2` | — | Real-time physics sliders |
| | Mute Audio | `M` | — | Toggle Web Audio procedural synthesizer |

> 🎮 **All highlighted keys are fully rebindable** in **Settings → Controls**. Primary & secondary bindings supported. Conflict detection prevents duplicate assignments.

---

## 🖥️ Main Menu Options

- **Continue** — load most recent save slot
- **New Game**
- **Play Together (Co-Op)** — open celestial expedition lobby (Duo 2P / Squad 4P) — start from level 1 (3 save slots)
- **Load Game** — select from 3 save slots (with thumbnail, playtime, date)
- **Level Select** — jump to any unlocked level (best time, shard count, rank shown)
- **Skills & Loadout** — skill swap menu
- **Moon Ledger** — stats, objectives, progression
- **Collection** — bestiary of 12 creatures + 5 Moon Shard lore entries
- **Achievements** — 16 unlockable achievements with toast notifications
- **Settings** — 7-tab settings menu (see below)
- **Credits** — scrolling credits sequence
- **Replay Intro** — replay the intro cinematic
- **Quit to Title** — return to title screen

---

## ⚙️ Settings System (7 Tabs)

All settings apply **instantly** and are saved to `localStorage`.

| Tab | Key Settings |
| :--- | :--- |
| **Gameplay** | Difficulty (Gentle / Normal / Hard / Nightmare), aim assist, tutorial hints, auto-save, camera smoothing, screen shake, hit-stop, damage numbers |
| **Video** | Fullscreen, render scale, FPS cap, FPS counter, brightness, UI scale, quality presets (Low/Medium/High/Ultra), bloom, lighting, film grain, vignette, chromatic aberration, particles, parallax layers |
| **Audio** | Master / Music / SFX / Ambience / UI volume sliders, mute toggle, audio test |
| **Controls** | Full key rebinding (primary + secondary), gamepad support, gamepad rumble, invert axes, stick deadzone |
| **Accessibility** | High contrast, reduced motion, subtitles, colorblind mode (Deuteranopia / Protanopia / Tritanopia), font size, off-screen threat indicators |
| **Language** | 6 UI languages (English, Spanish, French, German, Japanese, Arabic) |
| **Data** | Export save data (JSON), import save data, delete save slot, reset settings |

> **Auto-preset**: On first launch, a quick performance benchmark runs and recommends Low/Medium/High/Ultra automatically.

---

## 👥 Online Co-Op Multiplayer (Solo, Duo, Squad)

Play cooperatively with up to 4 players online!
- **Topology**: Host-authoritative client relay. Zero heavy server simulation needed; host simulates physics, clients run client-side prediction and snapshot interpolation.
- **Relay Server**: Lightweight Node.js server (server/server.js) with only the ws package. Client has zero runtime dependencies.
- **Lobby & Matchmaking**:
  - 6-character room codes (e.g. JGWV6Z)
  - Shareable invite links (?room=CODE)
  - Quick Play automated matchmaking queue
  - 4 customizable character cloaks: Dusk Gold, Azure Celestial, Emerald Wood, Crimson Eclipse
- **Co-Op Gameplay Mechanics**:
  - **Celestial Wisp & Revive**: Downed players become hovering celestial wisps that drift toward teammates. Living players hold **Pulse** (Shift or K) within 45px to channel life energy and revive them.
  - **Shared Bounding Camera**: Smooth dynamic framing tracking the centroid of all living teammates.
  - **Contextual Ping Radial Wheel (Z)**: 4 pings (Group Up, Danger, Need Help, Shard) leaving animated holographic beacons in the world.
  - **In-Game Chat (Enter)**: Real-time team communication with rate limiting and auto-fading log.
  - **Dynamic Scaling**: Enemy and boss health scale with active party size ([1.0, 1.6, 2.2, 2.8]).
  - **Loopback Testing Mode**: Built-in LoopbackTransport allows simulating 2–4 players locally with artificial latency and packet loss.

---

## 💾 Save System (3 Slots)

- **3 independent save slots** with screenshot thumbnail captured at save time
- Each slot shows: **level reached**, **shards collected**, **total playtime**, **last played date**
- **Copy** and **Delete** slots with confirmation dialogs
- **Auto-save** at every lit shrine (configurable in Settings → Gameplay)
- **Legacy migration**: Old `lumen_hollow_save_v1` data is automatically imported into Slot 1

---

## 👑 Sovereign's Aura (Goosebumps Ultimate)

- **Range**: Covers the entire screen and beyond (**1.5× screen diagonal ≈ 1150px**)
- **Build-Up (0.7s hold `Q`)**: Music muffles, deep heartbeat begins, vignette tightens, crimson embers float upward
- **Release**: 100ms freeze-frame → slow-mo → 16-ray recursive lightning → concentric shockwave rings → glass-shatter overlay → 40Hz sub-bass boom
- **Willpower Check**: Low will = dissolve into souls · Medium = 2.2s cower · High = stagger · Very High = barely reacts

---

## 💀 Underworld Summoning System

Soul Energy (max 100) dropped by enemies powers 5 procedural creatures:
1. **Tri-Maw (20)** — Three-headed hellhound, rushing bite attacks
2. **Ashen Wyrm (25)** — Skeletal bone dragon, dark violet fire breath
3. **Hollow Reaper (30)** — Cloaked death knight, giant scythe sweeps
4. **Abyss Titan (35)** — Colossal shadow titan, ground-slam fists
5. **Skeleton Legion (25)** — Squad of 5 skeleton warriors swarming

Up to **2 active summons** at once, each lasting 12–14 seconds.

---

## ⚡ Swappable Skills & 3 Loadout Presets

Press `Tab` to open the Skills Screen:
- **3 Slots** mapped to `U`, `I`, `O`
- **7 Abilities**: Umbral Bolt · Void Plunge · Crescent Wave · Soul Chain · Gravity Well · Shadow Clone · Spirit Lance
- **3 Presets** auto-saved to `localStorage`

---

## 👤 Shadow Army & Astral Form

- **Extract Soul** (`F`): Harvest soul from a defeated enemy to build a shadow army
- **Command Rise** (`G`): Order shadow soldiers to charge enemies
- **Shadow Exchange** (`H`): Instant teleport-swap with a shadow soldier
- **Astral Form** (`R`): At 100% Eclipse — giant shadow avatar manifests, Astral-only attacks unlock
- **Moon Ledger** (`T`): Tracks all stats, objectives, and progression

---

## 🏆 Achievements (16 Total)

| Achievement | Trigger |
| :--- | :--- |
| First Light | Light the first shrine |
| First Shard | Collect any Moon Shard |
| Celestial Reunion | Collect all 5 shards |
| Shadow Dancer | Perform 10 shadow dashes |
| Aura Unleashed | Fire Sovereign's Aura |
| Astral Awoken | Activate Astral Form |
| Shadow Army | Recruit your first shadow soldier |
| Hollow Hunter | Defeat 50 enemies total |
| Parry Master | Execute 5 perfect parries |
| Speed Runner | Complete any level in under 60 s |
| Perfect Run | Complete a level without dying |
| Combo King | Land a 15-hit combo |
| Completionist | Complete all Moon Ledger objectives |
| Collector | Fill the Bestiary |
| Boss Slayer | Defeat every boss |
| Moon Restored | Complete the game |

---

## 🛠️ Live Physics Tuning Panel (`F2`)

Real-time sliders for: Jump Power · Double Jump · Rising Gravity · Falling Gravity · Run Speed · Glide Speed · Wall Slide Speed · Dash Speed · Ground Friction

---

## 🚀 Running the Game

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to play.

### Automated Testing Suite

```bash
# Core game: levels, physics, shards, mute
node tests/verify_game.js

# Upgrade regression: jump, aura, summons, skills, boss
node tests/verify_upgrade_game.js

# Sprite regression: skeleton sprites (Level 5) + final boss (Level 6)
node tests/verify_boss_and_skeleton_sprites.js

# Menu & settings system: boot → main menu → all modals → pause → results
node tests/verify_menu_settings_system.js

# Platform reachability simulation across all levels
node tests/reachability_audit.js
```

---

## 📁 Project Structure

```
src/
├── core/
│   ├── Constants.js          # STUDIO_NAME, SCENE_STATES, DIFFICULTY_SETTINGS
│   ├── Game.js               # Scene state machine, systems integration
│   ├── Input.js              # Rebindable input actions + gamepad
│   ├── i18n/I18n.js          # 6-language localization dictionary
│   ├── saveManager/          # 3-slot save system + legacy migration
│   ├── settingsManager/      # Reactive settings with localStorage
│   └── input/GamepadManager.js
├── entities/
│   ├── Player.js             # Physics, combat, sprite integration
│   ├── PlayerSprite.js       # Sprite sheet animation (idle/run/jump/attack)
│   ├── FireflyCompanion.js
│   └── ShadowWisp.js
├── scenes/                   # Boot, Splash, PressKey, Title, IntroCinematic,
│                             # LevelResults, Credits
├── systems/
│   ├── AudioSystem.js        # Web Audio only, pentatonic lantern sound, reverb
│   ├── combat/CombatSystem.js
│   ├── skills/SkillSystem.js
│   ├── summons/SummonSystem.js
│   ├── shadow/               # ShadowArmy + AstralMonarch
│   └── vfx/VFXManager.js
├── ui/
│   ├── menus/                # MenuManager, MainMenu, SaveSlots, LevelSelect,
│   │                         # Collection, Achievements, Welcome, Pause
│   └── settings/             # SettingsModal, ControlsRebindModal
└── levels/                   # Level1-6 ASCII tile maps + TileMap engine
```
