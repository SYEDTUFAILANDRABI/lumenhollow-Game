# Lumen Hollow: Underworld & Sovereign Edition

> *The moon has shattered into five shards that fell into the Hollow Wood. A hooded wanderer named Lumi carries the last lantern and must journey through whispering groves, crystal caverns, and starlit sky ruins to battle the void, defeat the Eclipse Warden, summon underworld creatures, and return the shards to the Moon Shrine.*

---

## 🎮 Complete Controls Guide

| Category | Action | Keyboard | Touch / Mobile | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Movement** | Run | `A` / `D` or `←` / `→` | `◀` / `▶` | Snappy ground acceleration & air control |
| | Jump / Double Jump | `Space` / `W` / `↑` | `▲` | 6+ tiles high single jump, double jump burst |
| | Firefly Glide | Hold `Space` in air | `▲` (hold) | Slow graceful glide descent with firefly glow |
| | Wall Slide & Jump | Push into wall + `Space` | Wall + `▲` | Cling, slide down walls, and kick off diagonally |
| | Fast-Fall | Hold `S` / `↓` in air | `▼` (in air) | Rapid descent cap at 620px/s |
| **Core Combat** | Lantern Slash | `J` | `⚔️` | 3-hit combo; hit 3 unleashes shockwave |
| | Shadow Dash | `C` or `Left Ctrl` | `💨` | Invulnerable dash; resets on ground, wall touch, or kill |
| | Lantern Pulse | `Shift` or `K` | `☼` | Expands light radius, reveals moon-glass, stuns wisps |
| | Void Plunge | `S` or `↓` (in air) | `▼` | Downward slam creating crater and dark spikes |
| | Parry | `J` on impact | `⚔️` | Gold flash, slow-mo stagger, bonus Eclipse meter |
| **Sovereign's Aura** | Goosebumps Ultimate | Hold `Q` (at 100% Eclipse) | `👑` (hold) | 0.7s charge build-up, screen-wide branching lightning & boom |
| **Summoning** | Summon Wheel | `E` (hold / press) | `💀` | Slows time to 10%; radial wheel selection |
| | Quick Summons | `1`, `2`, `3`, `4`, `5` | `💀` | Instantly calls creatures using Soul Energy |
| **Swappable Skills** | Skill Slots 1, 2, 3 | `U`, `I`, `O` | `U`, `I`, `O` | Casts equipped abilities from current loadout preset |
| | Skills & Presets Menu | `Tab` | `📋` | Open skill swap menu to assign abilities & switch presets |
| **Debug & System** | Live Physics Tuning | `F2` | — | Real-time sliders for gravity, jump force, dash, speed |
| | Pause & Settings | `Esc` or `P` | — | Pause menu with 6 accessibility/performance toggles |
| | Safe Respawn | `R` | — | Instant respawn at last lit shrine |
| | Mute Audio | `M` | — | Toggle Web Audio procedural synthesizer |

---

## 👑 Sovereign's Aura (Goosebumps Upgrade)

- **Range**: Covers the entire screen and beyond (**1.5× screen diagonal ≈ 1150px**), affecting all enemies in the section.
- **Build-Up (0.7s hold `Q`)**:
  - Music fades and muffles through a low-pass biquad filter.
  - Deep rhythmic procedural heartbeat begins (`58Hz ➔ 28Hz`).
  - Lumi's lantern flickers violently; ground trembles with pre-shake.
  - Leaves, dust pebbles, and crimson embers float upward against gravity.
  - Vignette tightens and screen borders turn dark red.
- **Release Explosion**:
  - **100ms freeze-frame** with inverted black-and-white flash and fast zoom punch.
  - Time dilates to **30% for 400ms**.
  - **16-ray recursive midpoint displacement lightning** strikes across the entire screen and crawls along walls and ground.
  - Concentric chromatic shockwave rings and a full-screen **glass-shatter crack overlay**.
  - Sky and parallax layers tint to deep dark crimson.
  - **180ms silence cut** followed by a colossal **40Hz sub-bass boom** with 1.8s decay, noise crackle, detuned dark choir pad, and high tinnitus ringing.
- **Willpower Check**:
  - **Low Will (Shadow Wisps)**: Freeze, turn grey, fall, and dissolve into souls.
  - **Medium Will (Hollow Knights, Crow Wraiths)**: Forced to their knees in a trembling cower state for 2.2s.
  - **High Will (Eclipse Warden Boss)**: Staggered and stunned briefly.
  - **Active Summons**: Roar and receive a +40% damage boost for 6 seconds.
- **Mobile & Safety**:
  - Mobile haptic vibration via `navigator.vibrate([80, 50, 150, 50, 250])`.
  - **Reduced Effects Toggle** (`[6]` in Pause Menu) removes strobe flashes and limits intensity.

---

## 💀 Underworld Summoning System

Lumi can harvest **Soul Energy** (up to 100) dropped from defeated enemies to summon 5 procedural Canvas-drawn creatures:
1. **Tri-Maw (Cost: 20)**: Three-headed hellhound with animated jaws, fast rushing leaps, and vicious biting attacks.
2. **Ashen Wyrm (Cost: 25)**: Skeletal bone dragon with sinuous flying body segments that swoops and breathes dark violet fire.
3. **Hollow Reaper (Cost: 30)**: Tall cloaked death knight wielding a giant curved scythe with sweeping cleaves.
4. **Abyss Titan (Cost: 35)**: Colossal horned shadow titan rising from ground fissures to slam massive fists into the earth.
5. **Skeleton Legion (Cost: 25)**: Squad of 5 small animated skeleton warriors swarming and stabbing enemies.

**Rules**:
- Up to 2 summons active at once.
- Each lasts 12–14 seconds before dissolving into souls.
- Summons automatically acquire and target enemies.
- Deals 35% damage to the boss so the mini-boss encounter remains balanced and engaging.

---

## ⚡ Swappable Skills & 3 Loadout Presets

Press `Tab` (or open from Pause Menu) to view the Skills Screen:
- **3 Swappable Slots**: Assigned to `U`, `I`, `O`.
- **7 Unique Abilities**:
  1. `Umbral Bolt`: Piercing dark violet projectile with ribbon trail.
  2. `Void Plunge`: Downward slam causing crater fissures and spikes.
  3. `Crescent Wave`: Wide crescent energy arc cutting across the room.
  4. `Soul Chain`: Pulls distant enemies toward Lumi and stuns them.
  5. `Gravity Well`: Spawns a swirling vortex pulling nearby enemies together.
  6. `Shadow Clone`: Decoy afterimage drawing enemy attacks away from Lumi.
  7. `Spirit Lance`: Instant radiant violet beam piercing straight through enemies.
- **3 Presets**: Easily switch between preset loadouts, automatically persisted in `localStorage`.

---

## 🛠️ Live Physics Tuning Panel (`F2`)

Press `F2` at any time to open the live in-game tuning panel with real-time sliders for:
- Jump Power (`JUMP_FORCE`)
- Double Jump Power (`DOUBLE_JUMP_FORCE`)
- Rising Gravity (`GRAVITY_UP`)
- Falling Gravity (`GRAVITY_DOWN`)
- Run Speed (`MOVE_SPEED`)
- Firefly Glide Speed (`GLIDE_FALL_SPEED`)
- Wall Slide Speed (`WALL_SLIDE_SPEED`)
- Shadow Dash Speed (`DASH_SPEED`)
- Ground Friction / Deceleration (`DECELERATION`)

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
# Verify jump physics, reachability, aura, summons, skills, and boss fight
node tests/verify_upgrade_game.js

# Verify platform reachability simulation across all levels
node tests/reachability_audit.js
```
