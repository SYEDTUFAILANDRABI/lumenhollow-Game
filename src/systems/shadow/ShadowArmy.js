// ShadowArmy.js - Shadow Soldiers, Soul Extraction, Rise, Exchange, and Sovereign's Reach
import { COMBAT } from '../combat/CombatConstants.js';

export class ShadowSoldier {
  constructor(x, y, type, tier, name) {
    this.x = x;
    this.y = y;
    this.type = type || 'SKELETON_WARRIOR';
    this.tier = tier || 'SKELETON';
    this.name = name || 'Shadow Soldier';

    this.width = 18;
    this.height = 28;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.animTimer = Math.random() * 5;
    this.attackCooldown = 0;
    this.targetEnemy = null;
    this.isDead = false;
  }

  update(player, enemies, boss, dt, isAstral, isDomain, vfx, audio, camera) {
    this.animTimer += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Buff multipliers
    const buff = (isAstral ? 1.5 : 1.0) * (isDomain ? 1.4 : 1.0);
    const speed = 90 * buff;
    const damage = 18 * buff;

    // AI: Find nearest enemy or follow player
    const all = [...enemies];
    if (boss && !boss.isDead) all.push(boss);

    let nearest = null;
    let minDist = 160;

    for (const e of all) {
      if (e.isDead) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }

    this.targetEnemy = nearest;

    if (this.targetEnemy) {
      const edx = this.targetEnemy.x - this.x;
      this.facing = edx > 0 ? 1 : -1;
      if (minDist > 22) {
        this.x += this.facing * speed * dt;
      } else {
        // Attack enemy
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 0.85 / buff;
          if (this.targetEnemy.takeDamage) {
            this.targetEnemy.takeDamage(damage, this.x, this.y - 12, null, vfx, audio, camera);
          }
          if (vfx) vfx.triggerHitSparks(this.targetEnemy.x, this.targetEnemy.y - 14, '#bb44ff');
        }
      }
    } else {
      // Follow Lumi with gentle spacing
      const pdx = player.x - this.x;
      if (Math.abs(pdx) > 36) {
        this.facing = pdx > 0 ? 1 : -1;
        this.x += this.facing * speed * 0.8 * dt;
      }
      this.y += (player.y - this.y) * 4 * dt;
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(this.facing, 1);

    // Black translucent body with misty violet aura
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#12081c';
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 1.5;

    // Silhouette
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -22);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -24, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Violet Eyes
    ctx.fillStyle = '#bb44ff';
    ctx.shadowColor = '#bb44ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(1, -25, 2.5, 2);
    ctx.shadowBlur = 0;

    // Shadow Blade
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.lineTo(12, -22);
    ctx.stroke();

    ctx.restore();
  }
}

export class ShadowArmyManager {
  constructor() {
    this.storedArmy = [];
    this.activeSoldiers = [];
    this.riseHoldTimer = 0;
    this.reachHoldTimer = 0;
    this.isLiftingEnemies = false;
    this.liftedEnemies = [];

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('lumen_hollow_shadow_army');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) this.storedArmy = parsed;
      }
    } catch (e) {
      console.warn('Could not load shadow army:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('lumen_hollow_shadow_army', JSON.stringify(this.storedArmy));
    } catch (e) {
      console.warn('Could not save shadow army:', e);
    }
  }

  getMaxCapacity(willpower = 0, shardsCount = 0) {
    return COMBAT.SHADOW_ARMY.BASE_CAPACITY + Math.floor(willpower / 4) + shardsCount;
  }

  // Soul Extraction (Key F)
  tryExtractSoul(player, soulMarkers, senseStat = 0, combatSystem, vfx, audio, camera) {
    let target = null;
    let minDist = 48;

    for (const sm of soulMarkers) {
      if (sm.dead || sm.isExtracting) continue;
      const d = Math.hypot(sm.x - player.x, sm.y - player.y);
      if (d < minDist) {
        minDist = d;
        target = sm;
      }
    }

    if (!target) return false;

    // Start extraction ritual
    target.isExtracting = true;
    if (audio && audio.playAuraBuildUp) audio.playAuraBuildUp();

    // Calculate success chance
    const baseRate = COMBAT.SHADOW_ARMY.EXTRACTION_RATES[target.tier] || 0.60;
    const finalRate = Math.min(0.98, baseRate + senseStat * 0.03);
    const success = Math.random() < finalRate;

    setTimeout(() => {
      if (success) {
        this.storedArmy.push({
          type: target.enemyType,
          tier: target.tier,
          name: target.name
        });
        this.saveToStorage();

        if (combatSystem) {
          combatSystem.addShadowEnergy(25);
          combatSystem.addSoulEnergy(20);
        }
        if (vfx) vfx.triggerFlash('#bb44ff', 0.25);
        if (audio && audio.playShrineActivate) audio.playShrineActivate();
        if (camera) camera.shake(6, 0.25);
      } else {
        if (audio && audio.playDissolve) audio.playDissolve();
      }
    }, 650);

    return true;
  }

  // Rise (Hold G) / Command (Tap G)
  updateRiseAndCommand(isHoldingG, tapG, player, vfx, audio, camera) {
    if (isHoldingG) {
      this.riseHoldTimer += 1 / 60;
      if (this.riseHoldTimer >= 0.35 && this.storedArmy.length > 0 && this.activeSoldiers.length === 0) {
        this.riseHoldTimer = 0;
        // Deploy all stored soldiers around Lumi
        this.activeSoldiers = this.storedArmy.map((s, i) => {
          const offsetX = (i - this.storedArmy.length / 2) * 24;
          return new ShadowSoldier(player.x + offsetX, player.y, s.type, s.tier, s.name);
        });
        if (vfx) vfx.triggerFlash('#bb44ff', 0.3);
        if (audio && audio.playSummonRoar) audio.playSummonRoar();
        if (camera) camera.shake(8, 0.35);
      }
    } else {
      this.riseHoldTimer = 0;
      if (tapG && this.activeSoldiers.length > 0) {
        // Focus nearest enemy chime
        if (audio && audio.playSlash) audio.playSlash(1);
      }
    }
  }

  // Shadow Exchange (Key X): Teleport swap with nearest soldier
  tryShadowExchange(player, vfx, audio, camera) {
    if (this.activeSoldiers.length === 0) return false;

    // Find nearest soldier
    let nearest = this.activeSoldiers[0];
    let minDist = 9999;
    for (const s of this.activeSoldiers) {
      const d = Math.hypot(s.x - player.x, s.y - player.y);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }

    if (!nearest) return false;

    // Emit smoke burst at current player position
    if (vfx) vfx.triggerFlash('#12081c', 0.15);

    // Swap coordinates
    const px = player.x;
    const py = player.y;
    player.x = nearest.x;
    player.y = nearest.y;
    nearest.x = px;
    nearest.y = py;

    if (camera) camera.shake(4, 0.2);
    if (audio && audio.playDash) audio.playDash();

    return true;
  }

  // Sovereign's Reach (Hold V): Telekinesis lift and slam
  updateSovereignsReach(isHoldingV, player, enemies, boss, dt, vfx, audio, camera) {
    const all = [...enemies];
    if (boss && !boss.isDead) all.push(boss);

    if (isHoldingV) {
      this.reachHoldTimer += dt;
      this.isLiftingEnemies = true;

      // Lift enemies within 140px
      for (const t of all) {
        if (t.isDead) continue;
        const dist = Math.hypot(t.x - player.x, t.y - player.y);
        if (dist < 140) {
          t.vy = -90; // Float upward
          t.applyStun ? t.applyStun(0.3) : (t.isStunned = true);
        }
      }
    } else {
      if (this.isLiftingEnemies && this.reachHoldTimer >= 0.3) {
        // Slam down violently!
        for (const t of all) {
          if (t.isDead) continue;
          const dist = Math.hypot(t.x - player.x, t.y - player.y);
          if (dist < 150) {
            t.vy = 450;
            if (t.takeDamage) {
              t.takeDamage(42, t.x, t.y, null, vfx, audio, camera);
            }
            if (t.applyStun) t.applyStun(1.5);
          }
        }
        if (camera) camera.shake(10, 0.4);
        if (vfx) vfx.triggerHitSparks(player.x, player.y, '#bb44ff');
        if (audio && audio.playGravityWell) audio.playGravityWell();
      }
      this.isLiftingEnemies = false;
      this.reachHoldTimer = 0;
    }
  }

  update(player, enemies, boss, dt, isAstral, isDomain, vfx, audio, camera) {
    for (const soldier of this.activeSoldiers) {
      soldier.update(player, enemies, boss, dt, isAstral, isDomain, vfx, audio, camera);
    }
  }

  render(ctx, camera, player) {
    // Render Telekinesis ripple lines if holding V
    if (this.isLiftingEnemies) {
      const rx = Math.round(player.x - camera.x);
      const ry = Math.round(player.y - camera.y);
      ctx.save();
      ctx.strokeStyle = 'rgba(187, 68, 255, 0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(rx, ry, i * 45, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render active soldiers
    for (const soldier of this.activeSoldiers) {
      soldier.render(ctx, camera);
    }
  }
}
