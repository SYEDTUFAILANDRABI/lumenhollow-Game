import { TILE_SIZE, COLORS } from '../core/Constants.js';
import { MoonGlassPlatform } from '../entities/MoonGlassPlatform.js';
import { MovingPlatform } from '../entities/MovingPlatform.js';
import { Shrine } from '../entities/Shrine.js';
import { MoonShard } from '../entities/MoonShard.js';
import { ShadowWisp } from '../entities/ShadowWisp.js';
import { FireflyPickup } from '../entities/FireflyPickup.js';
import { CombatDummy } from '../entities/enemies/CombatDummy.js';
import { HollowKnight } from '../entities/enemies/HollowKnight.js';
import { CrowWraith } from '../entities/enemies/CrowWraith.js';
import { EclipseWarden } from '../entities/boss/EclipseWarden.js';

export class TileMap {
  constructor(asciiLines, levelIndex = 0, levelName = '') {
    this.levelIndex = levelIndex;
    this.levelName = levelName;
    this.lines = asciiLines;
    this.heightInTiles = asciiLines.length;
    this.widthInTiles = Math.max(...asciiLines.map(line => line.length));
    this.pixelWidth = this.widthInTiles * TILE_SIZE;
    this.pixelHeight = this.heightInTiles * TILE_SIZE;

    // Extracted entities
    this.playerStart = { x: 40, y: 40 };
    this.exitDoor = null;
    this.shrines = [];
    this.shards = [];
    this.wisps = [];
    this.dummies = [];
    this.knights = [];
    this.crows = [];
    this.boss = null;
    this.fireflies = [];
    this.moonGlassPlatforms = [];
    this.movingPlatforms = [];
    this.hazards = [];

    // Parse map grid
    this.grid = [];
    this.parseMap();
  }

  parseMap() {
    for (let r = 0; r < this.heightInTiles; r++) {
      const line = this.lines[r] || '';
      const row = [];
      for (let c = 0; c < this.widthInTiles; c++) {
        const char = line[c] || ' ';
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (char === 'P') {
          this.playerStart = { x: px, y: py };
          row.push(' ');
        } else if (char === 'E') {
          this.exitDoor = { x: px, y: py, width: TILE_SIZE * 1.5, height: TILE_SIZE * 2 };
          row.push(' ');
        } else if (char === 'S') {
          this.shrines.push(new Shrine(px, py - 16, this.shrines.length));
          row.push(' ');
        } else if (char === '*') {
          this.shards.push(new MoonShard(px + 2, py + 2, this.levelIndex));
          row.push(' ');
        } else if (char === 'W') {
          this.wisps.push(new ShadowWisp(px + 10, py + 10));
          row.push(' ');
        } else if (char === 'D') {
          this.dummies.push(new CombatDummy(px + 10, py + TILE_SIZE));
          row.push(' ');
        } else if (char === 'K') {
          this.knights.push(new HollowKnight(px + 10, py + TILE_SIZE));
          row.push(' ');
        } else if (char === 'C') {
          this.crows.push(new CrowWraith(px + 10, py + 10));
          row.push(' ');
        } else if (char === 'B') {
          this.boss = new EclipseWarden(px + 16, py + TILE_SIZE);
          row.push(' ');
        } else if (char === 'F') {
          this.fireflies.push(new FireflyPickup(px + 10, py + 10));
          row.push(' ');
        } else if (char === 'M') {
          this.moonGlassPlatforms.push(new MoonGlassPlatform(px, py, TILE_SIZE, 10));
          row.push('M');
        } else if (char === '~') {
          this.movingPlatforms.push(new MovingPlatform(px, py, 48, 10, 60, 0, 1.4));
          row.push(' ');
        } else if (char === '^') {
          this.hazards.push({ x: px, y: py + 8, width: TILE_SIZE, height: 12 });
          row.push('^');
        } else if (char === '#' || char === '_') {
          row.push(char);
        } else {
          row.push(' ');
        }
      }
      this.grid.push(row);
    }
  }

  getTile(c, r) {
    if (r < 0 || r >= this.heightInTiles || c < 0 || c >= this.widthInTiles) {
      // Treat outside left/right/top as empty, bottom as lethal pit
      return ' ';
    }
    return this.grid[r][c];
  }

  getTileAtPixel(px, py) {
    const c = Math.floor(px / TILE_SIZE);
    const r = Math.floor(py / TILE_SIZE);
    const tile = this.getTile(c, r);
    return {
      char: tile,
      solid: tile === '#'
    };
  }

  getAllEnemies() {
    return [...this.wisps, ...this.dummies, ...this.knights, ...this.crows];
  }

  updateEntities(player, particleSystem, audioSystem, camera, onShardCollect, dt, combatSystem, vfx, shardUpgrades) {
    // 1. Moon-glass platforms
    const lPos = player.getLanternWorldPos();
    for (const mg of this.moonGlassPlatforms) {
      mg.update(player.currentLightRadius, lPos, dt);
    }

    // 1b. Moving platforms carrying player
    for (const mp of this.movingPlatforms) {
      mp.update(dt);
      if (mp.checkPlayerStanding(player)) {
        player.y = mp.y - player.height;
        player.x += mp.deltaX;
        player.y += mp.deltaY;
        player.isGrounded = true;
        player.vy = 0;
        player.canDoubleJump = true;
        player.airDashAvailable = true;
      }
    }

    // 2. Shrines
    for (const shrine of this.shrines) {
      shrine.update(player, particleSystem, audioSystem, dt);
    }

    // 3. Moon Shards
    for (const shard of this.shards) {
      shard.update(player, particleSystem, audioSystem, onShardCollect, dt);
    }

    // 4. Wild Fireflies
    for (const ff of this.fireflies) {
      ff.update(player, particleSystem, audioSystem, dt);
    }

    // 5. Enemies update
    for (const wisp of this.wisps) {
      wisp.update(player, particleSystem, audioSystem, dt);
    }

    for (const dummy of this.dummies) {
      dummy.update(player, particleSystem, audioSystem, dt);
    }

    for (const knight of this.knights) {
      knight.update(player, particleSystem, audioSystem, dt);
    }

    for (const crow of this.crows) {
      crow.update(player, particleSystem, audioSystem, dt);
    }

    // 6. Boss update
    if (this.boss) {
      this.boss.update(player, combatSystem, vfx, particleSystem, audioSystem, camera, dt);
    }

    // 7. Hazard Check (Spikes/brambles)
    if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
      const pBox = { x: player.x + 2, y: player.y + 4, width: player.width - 4, height: player.height - 4 };
      for (const h of this.hazards) {
        if (this.boxesIntersect(pBox, h)) {
          player.die(particleSystem, camera, audioSystem);
          break;
        }
      }

      // Bottom pit death
      if (player.y > this.pixelHeight + 40) {
        player.die(particleSystem, camera, audioSystem);
      }
    }
  }

  boxesIntersect(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  checkCollision(box, lightRadius, lightPos) {
    const minTileX = Math.floor(box.x / TILE_SIZE);
    const maxTileX = Math.floor((box.x + box.width - 0.01) / TILE_SIZE);
    const minTileY = Math.floor(box.y / TILE_SIZE);
    const maxTileY = Math.floor((box.y + box.height - 0.01) / TILE_SIZE);

    let collided = false;
    let wallLeft, wallRight, floor, ceiling;

    for (let r = minTileY; r <= maxTileY; r++) {
      for (let c = minTileX; c <= maxTileX; c++) {
        const tile = this.getTile(c, r);
        const tileLeft = c * TILE_SIZE;
        const tileTop = r * TILE_SIZE;
        const tileRight = tileLeft + TILE_SIZE;
        const tileBottom = tileTop + TILE_SIZE;

        if (tile === '#') {
          collided = true;
          // Determine collision direction
          const overlapLeft = (box.x + box.width) - tileLeft;
          const overlapRight = tileRight - box.x;
          const overlapTop = (box.y + box.height) - tileTop;
          const overlapBottom = tileBottom - box.y;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapTop) {
            ceiling = tileTop;
          } else if (minOverlap === overlapBottom) {
            floor = tileBottom;
          } else if (minOverlap === overlapLeft) {
            wallLeft = tileLeft;
          } else if (minOverlap === overlapRight) {
            wallRight = tileRight;
          }
        } else if (tile === '_') {
          // One-way platform: only collides when falling onto top surface
          if (box.y + box.height - 8 <= tileTop) {
            collided = true;
            ceiling = tileTop;
          }
        } else if (tile === 'M') {
          // Check if moon-glass platform at this location is currently solid
          const mg = this.moonGlassPlatforms.find(p => Math.floor(p.x / TILE_SIZE) === c && Math.floor(p.y / TILE_SIZE) === r);
          if (mg && mg.isSolid()) {
            if (box.y + box.height - 8 <= tileTop) {
              collided = true;
              ceiling = tileTop;
            }
          }
        }
      }
    }

    return { collided, wallLeft, wallRight, floor, ceiling };
  }

  isExitReached(player) {
    if (!this.exitDoor) return false;
    // If boss is present, exit is sealed until boss is defeated
    if (this.boss && !this.boss.isDead) return false;
    const pBox = { x: player.x, y: player.y, width: player.width, height: player.height };
    return this.boxesIntersect(pBox, this.exitDoor);
  }

  render(ctx, camera) {
    const bounds = camera.getVisibleBounds();
    const minC = Math.max(0, Math.floor(bounds.left / TILE_SIZE));
    const maxC = Math.min(this.widthInTiles - 1, Math.floor(bounds.right / TILE_SIZE));
    const minR = Math.max(0, Math.floor(bounds.top / TILE_SIZE));
    const maxR = Math.min(this.heightInTiles - 1, Math.floor(bounds.bottom / TILE_SIZE));

    // Render tiles
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const tile = this.grid[r][c];
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (tile === '#') {
          this.renderSolidTile(ctx, c, r, px, py);
        } else if (tile === '_') {
          this.renderOneWayTile(ctx, px, py);
        } else if (tile === '^') {
          this.renderHazardTile(ctx, px, py);
        }
      }
    }

    // Render moon-glass platforms
    for (const mg of this.moonGlassPlatforms) {
      if (mg.x + mg.width >= bounds.left && mg.x <= bounds.right &&
          mg.y + mg.height >= bounds.top && mg.y <= bounds.bottom) {
        mg.render(ctx);
      }
    }

    // Render moving platforms
    for (const mp of this.movingPlatforms) {
      if (mp.x + mp.width >= bounds.left && mp.x <= bounds.right &&
          mp.y + mp.height >= bounds.top && mp.y <= bounds.bottom) {
        mp.render(ctx);
      }
    }

    // Render Shrines
    for (const shrine of this.shrines) {
      shrine.render(ctx);
    }

    // Render Shards
    for (const shard of this.shards) {
      shard.render(ctx);
    }

    // Render Fireflies
    for (const ff of this.fireflies) {
      ff.render(ctx);
    }

    // Render Exit Archway
    if (this.exitDoor) {
      this.renderExitPortal(ctx, this.exitDoor.x, this.exitDoor.y);
    }

    // Render Dummies
    for (const dummy of this.dummies) {
      dummy.render(ctx);
    }

    // Render Knights
    for (const knight of this.knights) {
      knight.render(ctx);
    }

    // Render Crows
    for (const crow of this.crows) {
      crow.render(ctx);
    }

    // Render Wisps
    for (const wisp of this.wisps) {
      wisp.render(ctx);
    }

    // Render Boss
    if (this.boss) {
      this.boss.render(ctx);
    }
  }

  renderSolidTile(ctx, c, r, px, py) {
    const isTopEdge = this.getTile(c, r - 1) !== '#';

    // Stone base fill
    ctx.fillStyle = '#1b1733';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    // Subtle inner brick detailing
    ctx.fillStyle = '#252044';
    ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE / 2 - 1);
    ctx.fillRect(px + 2, py + TILE_SIZE / 2 + 1, TILE_SIZE - 4, TILE_SIZE / 2 - 2);

    // Dark bottom shadow edge
    ctx.fillStyle = '#0f0c20';
    ctx.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 2);

    // Luminous moss/grass on exposed top edge
    if (isTopEdge) {
      // Grass line
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(px, py, TILE_SIZE, 3);
      // Grass tufts
      ctx.fillStyle = '#7be0ad';
      ctx.fillRect(px + 2, py - 2, 3, 2);
      ctx.fillRect(px + 9, py - 3, 2, 3);
      ctx.fillRect(px + 15, py - 2, 3, 2);
    }
  }

  renderOneWayTile(ctx, px, py) {
    // Carved ancient slab
    ctx.fillStyle = '#2c274d';
    ctx.fillRect(px, py, TILE_SIZE, 6);
    ctx.fillStyle = '#7be0ad';
    ctx.fillRect(px, py, TILE_SIZE, 1.5);
    ctx.fillStyle = '#3d366b';
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 3);
  }

  renderHazardTile(ctx, px, py) {
    // Dark bramble base
    ctx.fillStyle = '#140d22';
    ctx.fillRect(px, py + 12, TILE_SIZE, 8);

    // Sharp glowing thorns
    ctx.fillStyle = '#ff8fab';
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 20);
    ctx.lineTo(px + 5, py + 9);
    ctx.lineTo(px + 8, py + 20);

    ctx.moveTo(px + 9, py + 20);
    ctx.lineTo(px + 13, py + 6);
    ctx.lineTo(px + 16, py + 20);

    ctx.moveTo(px + 15, py + 20);
    ctx.lineTo(px + 18, py + 10);
    ctx.lineTo(px + 20, py + 20);
    ctx.closePath();
    ctx.fill();
  }

  renderExitPortal(ctx, px, py) {
    ctx.save();
    const time = Date.now() * 0.003;

    // Stone Archway pillars
    ctx.fillStyle = '#252140';
    ctx.fillRect(px - 4, py, 6, 40);
    ctx.fillRect(px + 24, py, 6, 40);

    // Archway top lintel
    ctx.fillStyle = '#38325e';
    ctx.fillRect(px - 6, py - 6, 38, 8);

    // Celestial portal aura
    const portalGrad = ctx.createRadialGradient(px + 13, py + 20, 2, px + 13, py + 20, 18);
    portalGrad.addColorStop(0, '#f4f1ff');
    portalGrad.addColorStop(0.4, '#7be0ad');
    portalGrad.addColorStop(0.8, '#2a9d8f');
    portalGrad.addColorStop(1, 'rgba(42, 157, 143, 0)');

    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.ellipse(px + 13, py + 20, 12 + Math.sin(time) * 1.5, 18 + Math.cos(time) * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating rune ring
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px + 13, py + 20, 10, time, time + Math.PI * 1.4);
    ctx.stroke();

    ctx.restore();
  }
}
