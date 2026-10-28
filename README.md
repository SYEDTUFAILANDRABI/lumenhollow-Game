# Lumen Hollow: Eclipse & Sovereign's Aura Edition

> *The moon has shattered into five shards that fell into the Hollow Wood. A hooded wanderer named Lumi carries the last lantern and must journey through whispering groves, crystal caverns, and starlit sky ruins to battle the void, defeat the Eclipse Warden, and return the shards to the Moon Shrine.*

---

## ⚔️ Combat System & Moves

| Move | Key | Mobile Touch | Description |
| :--- | :--- | :--- | :--- |
| **Move** | `A` / `D` or `Arrow Keys` | `◀` / `▶` | Run with procedural cloak sway & footstep dust puffs. |
| **Jump** | `Space` / `W` / `Up` | `▲` | Variable jump height, 100ms Coyote Time, 120ms jump buffer. |
| **Lantern Pulse** | `Shift` (Left/Right) / `K` | `☼` | Expands light radius to 220px, reveals moon-glass platforms, stuns wisps. |
| **Lantern Slash** | `J` | `⚔️` | 3-hit combo sequence with crescent slash trails. Hit 3 unleashes a shockwave. |
| **Umbral Bolt** | `L` | `⚡` | Fires a piercing dark violet projectile leaving a ribbon trail. |
| **Shadow Dash** | `C` or `Left Ctrl` | `💨` | Invulnerable dash leaving afterimages; marks enemies with delayed cuts. |
| **Void Plunge** | `S` or `Down` (in Air) | `▼` | Downward slam creating crater fissures, dark spikes, and a shockwave. |
| **Parry** | `J` (on attack impact) | `⚔️` | Timing slash as an enemy attacks triggers a gold flash, slow-motion, and stagger. |
| **Sovereign's Aura** | `Q` (at 100% Eclipse) | `👑` | Ultimate anime-inspired willpower burst. Disintegrates weak foes into ash. |
| **Pause & Options**| `Escape` or `P` | — | Pause menu with accessibility toggles (`1`-`5`). |
| **Respawn** | `R` | — | Safe checkpoint respawn. |
| **Mute Audio** | `M` | — | Procedural Web Audio mute toggle. |

---

## 👑 Sovereign's Aura & Eclipse Form

- **Eclipse Meter**: Fills by landing hits (+5), scoring kills (+15), executing parries (+25), and building combos.
- **Sovereign's Aura Activation (`Q`)**:
  - Time slows for 150ms.
  - Camera zoom-in punch followed by screen shake.
  - Brief black-and-white high-contrast flash.
  - Black-and-crimson branching lightning arcs along ground, walls, and Lumi.
  - Expanding chromatic shockwave and spreading ground fissures.
  - **Willpower Check**:
    - **Low Will (Shadow Wisps)**: Freeze, turn grey, and dissolve into ash.
    - **Medium Will (Knights, Crow Wraiths)**: Staggered for 1.6s and knocked back.
    - **High Will (Eclipse Warden Boss)**: Stunned for 0.9s.
- **Eclipse Form (8–12 seconds)**:
  - Lantern turns vibrant violet and crimson.
  - Cloak sheds trailing embers, eyes glow scarlet.
  - Attacks deal +35% damage, have 1.45x wider reach, and move faster.
  - Lumi leaves a dark trailing afterimage.

---

## 👹 Enemy Types & Mini-Boss

1. **Combat Dummy**: Stationed in the Level 1 Training Glade to practice slash combos, bolts, dashes, plunges, and parries.
2. **Shadow Wisp**: Ethereal floaters with low will (20); flee in light and dissolve into ash upon receiving Sovereign's Aura.
3. **Hollow Knight**: Heavy armored guardians with high damage. Telegraphed overhead slash can be parried right before it lands.
4. **Crow Wraith**: Avian shadows that hover, emit a warning screech, and swoop down in an arc.
5. **Mini-Boss "Eclipse Warden"** (Summit of Sky Ruins):
   - **Phase 1**: Fires slow homing Umbral Orbs.
   - **Phase 2**: Triple-bolt void dart barrages and faster movement.
   - **Phase 3**: Screen-wide jump & ground slam creating rolling shockwaves and dark spikes that must be jumped or dashed through.
   - Defeating the Warden unlocks the gate to the Level 4 Moon Shrine!

---

## 💎 Shard Upgrades

Each collected Moon Shard permanently enhances Lumi's arsenal:
- **Shard 1 (Grove)**: Wider Lantern Slash reach (+30% range).
- **Shard 2 (Caverns)**: Umbral Bolt gains infinite pierce through all enemies.
- **Shard 3 (Sky Ruins #1)**: Extended Shadow Dash distance and invulnerability.
- **Shard 4 (Sky Ruins #2)**: Extended Eclipse Form duration (8s ➔ 12s).
- **Shard 5 (Moon Shrine)**: Sovereign's Aura radius & damage increased by 50%.

---

## ♿ Accessibility & Performance Toggles

Accessible in the Pause Menu (`Esc`):
- `[1]` **Screen Shake**: On / Off
- `[2]` **Flash Intensity**: 100% / 50% / Off
- `[3]` **Hit-Stop Juice**: On / Off
- `[4]` **Damage Numbers**: On / Off
- `[5]` **Graphics Quality**: High (60 FPS) / Low (Battery Saver)

---

## 🚀 Running the Game

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to play.

### Automated Test Suite
```bash
node tests/verify_combat_game.js
```
Runs a complete headless Chrome test verifying movement, combat combos, boss phases, and zero console errors.
