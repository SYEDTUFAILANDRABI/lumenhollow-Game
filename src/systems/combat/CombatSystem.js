import { COMBAT } from './CombatConstants.js';
import { Projectile } from './Projectile.js';

export class CombatSystem {
  constructor() {
    this.eclipseMeter = 0;
    this.maxEclipseMeter = COMBAT.ECLIPSE.MAX_METER;
    this.isEclipseForm = false;
    this.eclipseFormTimer = 0;

    // Soul Energy Resource for Underworld Summons
    this.soulEnergy = 40;
    this.maxSoulEnergy = 100;

    // Combo system
    this.comboCount = 0;
    this.comboTimer = 0;

    // Hit-stop & slow-mo
    this.hitStopTimer = 0;
    this.timeDilation = 1.0;
    this.timeDilationTimer = 0;

    // Active projectiles
    this.projectiles = [];

    // Soul orbs flying to lantern
    this.soulOrbs = [];

    // Delayed cuts (Shadow Dash)
    this.delayedCuts = [];

    // Finisher slow-mo flag
    this.enemiesRemainingInRoom = 0;

    // Accessibility settings
    this.damageNumbersEnabled = true;
  }

  addEclipseMeter(amount) {
    if (this.isEclipseForm) return; // Cannot recharge while in Eclipse Form
    this.eclipseMeter = Math.min(this.maxEclipseMeter, this.eclipseMeter + amount);
  }

  addSoulEnergy(amount) {
    this.soulEnergy = Math.min(this.maxSoulEnergy, this.soulEnergy + amount);
  }

  isAuraReady() {
    return this.eclipseMeter >= this.maxEclipseMeter && !this.isEclipseForm;
  }

  triggerHitStop(duration = 0.06) {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  triggerSlowMo(duration = 0.2, scale = 0.2) {
    this.timeDilation = scale;
    this.timeDilationTimer = duration;
  }

  registerHit(damage, x, y, isCrit = false, vfx, audio, camera) {
    this.comboCount++;
    this.comboTimer = COMBAT.COMBO.TIMEOUT;
    this.addEclipseMeter(COMBAT.ECLIPSE.HIT_GAIN + this.comboCount * 0.4);

    if (vfx) {
      vfx.damageNumbers.add(x, y, damage, isCrit, false);
      vfx.triggerFlash('#ffffff', 0.05);
    }
    if (camera) {
      camera.shake(isCrit ? 4.5 : 2.5, 0.15);
    }
  }

  registerKill(x, y, vfx, audio, camera) {
    this.addEclipseMeter(COMBAT.ECLIPSE.KILL_GAIN);
    this.triggerHitStop(0.12);

    // Spawn 3-5 soul orbs flying to player lantern
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = Math.random() * 60 + 30;
      this.soulOrbs.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifetime: 1.4,
        energyValue: 6
      });
    }

    if (camera) camera.shake(5, 0.22);
    if (audio) audio.playEnemyKill();
  }

  registerParry(x, y, vfx, audio, camera) {
    this.addEclipseMeter(COMBAT.PARRY.METER_GAIN);
    this.triggerSlowMo(COMBAT.PARRY.SLOWMO_TIME, COMBAT.PARRY.SLOWMO_SCALE);
    if (vfx) {
      vfx.damageNumbers.add(x, y, 0, true, true);
      vfx.triggerFlash('#ffd98a', 0.15);
      vfx.addShockwave(x, y, 90, 0.35, '#ffd98a', false);
    }
    if (camera) camera.shake(5, 0.25);
    if (audio) audio.playParrySuccess();
  }

  update(dt, player, enemies, boss, tileMap, vfx, particles, audio, camera, shardUpgrades = {}) {
    // Time dilation update
    if (this.timeDilationTimer > 0) {
      this.timeDilationTimer -= dt;
      if (this.timeDilationTimer <= 0) {
        this.timeDilation = 1.0;
      }
    }

    // Eclipse Form duration timer
    if (this.isEclipseForm) {
      this.eclipseFormTimer -= dt;
      if (this.eclipseFormTimer <= 0) {
        this.isEclipseForm = false;
        player.exitEclipseForm();
      }
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Delayed cuts (Shadow Dash)
    for (let i = this.delayedCuts.length - 1; i >= 0; i--) {
      const dc = this.delayedCuts[i];
      dc.timer -= dt;
      if (dc.timer <= 0) {
        if (dc.target && !dc.target.isDead) {
          const dmg = COMBAT.DASH.DELAYED_CUT_DAMAGE * (this.isEclipseForm ? COMBAT.ECLIPSE.FORM_DAMAGE_MULT : 1);
          dc.target.takeDamage(dmg, dc.x, dc.y, this, vfx, audio, camera);
          if (vfx) {
            vfx.addSlashArc(dc.target.x, dc.target.y, player.facing, 2, this.isEclipseForm);
          }
          if (audio) audio.playDelayedCutSnap();
        }
        this.delayedCuts.splice(i, 1);
      }
    }

    // Soul orbs flying toward player's lantern
    const lPos = player.getLanternWorldPos();
    for (let i = this.soulOrbs.length - 1; i >= 0; i--) {
      const orb = this.soulOrbs[i];
      orb.lifetime -= dt;

      // Homing toward lantern
      const dx = lPos.x - orb.x;
      const dy = lPos.y - orb.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 14 || orb.lifetime <= 0) {
        player.rechargeEnergy(orb.energyValue);
        player.airDashAvailable = true;
        this.addSoulEnergy(14);
        if (particles) particles.emitFireflyAbsorb(orb.x, orb.y);
        this.soulOrbs.splice(i, 1);
        continue;
      }

      const speed = 240;
      orb.vx += (dx / dist * speed - orb.vx) * 8 * dt;
      orb.vy += (dy / dist * speed - orb.vy) * 8 * dt;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, particles);

      if (p.dead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies if player projectile
      if (!p.isEnemy) {
        const allTargets = [...enemies];
        if (boss && !boss.isDead) allTargets.push(boss);

        for (const target of allTargets) {
          if (target.isDead || p.hitEntities.has(target)) continue;

          const tBox = target.getHurtbox ? target.getHurtbox() : { x: target.x - 10, y: target.y - 10, width: 20, height: 20 };
          const cDist = Math.hypot(p.x - (tBox.x + tBox.width / 2), p.y - (tBox.y + tBox.height / 2));

          if (cDist < (p.radius + Math.max(tBox.width, tBox.height) / 2)) {
            p.hitEntities.add(target);
            target.takeDamage(p.damage, p.x, p.y, this, vfx, audio, camera);

            // Shard 2 unlocks infinite pierce; default pierces up to 2
            const maxHits = (shardUpgrades[1] || this.isEclipseForm) ? 99 : 2;
            if (p.hitEntities.size >= maxHits) {
              p.dead = true;
              break;
            }
          }
        }
      } else {
        // Enemy projectile hitting player
        if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
          const pBox = { x: player.x, y: player.y, width: player.width, height: player.height };
          if (p.x >= pBox.x && p.x <= pBox.x + pBox.width && p.y >= pBox.y && p.y <= pBox.y + pBox.height) {
            // Check if player is currently in parry window
            if (player.isParrying()) {
              this.registerParry(p.x, p.y, vfx, audio, camera);
              p.dead = true;
            } else {
              p.dead = true;
              player.die(particles, camera, audio);
            }
          }
        }
      }
    }
  }

  triggerSovereignAura(player, enemies, boss, vfx, particles, audio, camera, shardUpgrades = {}, chargeTime = 0.7) {
    this.eclipseMeter = 0;
    this.isEclipseForm = true;
    const baseDuration = COMBAT.ECLIPSE.DURATION;
    // Shard 4 extends eclipse form
    this.eclipseFormTimer = shardUpgrades[3] ? baseDuration * 1.5 : baseDuration;
    player.enterEclipseForm(this.eclipseFormTimer);

    // Audio effects: 150ms silence drop, huge 40Hz sub-bass boom, lightning noise crackle, detuned choir, tinnitus ringing
    if (audio) {
      audio.playSovereignAura();
    }

    // Time slows to 30% for 400ms
    this.triggerSlowMo(COMBAT.ECLIPSE.AURA_SLOWMO_DURATION, COMBAT.ECLIPSE.AURA_SLOWMO_SCALE);

    // Camera zoom punch + hard cinematic shake
    if (camera) {
      camera.shake(14, 0.65);
    }

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    // Calculate dynamic range: base 1150px (covers 1.5x screen diagonal), scaled by charge and moon shards
    const shardBonus = Object.values(shardUpgrades).filter(Boolean).length * 0.12;
    const chargeRatio = Math.max(0.6, Math.min(1.4, chargeTime / 0.7));
    const auraRadius = COMBAT.ECLIPSE.AURA_RADIUS * (1 + shardBonus) * chargeRatio;
    const auraDmg = COMBAT.ECLIPSE.AURA_DAMAGE * (1 + shardBonus * 0.5);

    if (vfx) {
      vfx.triggerZoomPunch(1.22, 0.22);
      // 100ms freeze frame inverted black & white flash
      vfx.triggerFlash('#ffffff', 0.25, true);
      vfx.redSkyAlpha = 1.0;

      // Concentric expanding shockwave rings with chromatic aberration
      vfx.addShockwave(px, py, auraRadius * 0.6, 0.50, '#ff2255', true);
      vfx.addShockwave(px, py, auraRadius * 0.9, 0.65, '#ffd98a', true);
      vfx.addShockwave(px, py, auraRadius, 0.85, '#ff2255', true);

      // Procedural branching lightning crawling across the screen
      vfx.addLightningBurst(px, py, 16, auraRadius);

      // Spreading ground cracks & sky glass fracture overlay
      vfx.addGroundCrack(px, player.y + player.height, 65, 4.5);
      vfx.addGlassShatter(px, py);
    }

    // Empower active summons if any
    if (this.summonSystem && this.summonSystem.activeSummons) {
      for (const s of this.summonSystem.activeSummons) {
        s.buffTimer = 6.0;
        if (s.roar) s.roar();
      }
    }

    // Willpower check on all enemies in range
    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const target of allTargets) {
      if (target.isDead) continue;
      const dist = Math.hypot(target.x - px, target.y - py);
      if (dist <= auraRadius) {
        const will = target.will || 50;

        if (will <= 25) {
          // Low will (Wisps): freeze, turn grey, dissolve into ash
          target.dieToAura(this, vfx, particles, audio, camera);
        } else if (will <= 70) {
          // Medium will (Knights, Crow Wraiths): forced to knees & trembling
          const pushAngle = Math.atan2(target.y - py, target.x - px);
          target.applyStun(2.2);
          target.state = 'COWER';
          target.takeDamage(auraDmg, target.x, target.y, this, vfx, audio, camera);
          target.vx = Math.cos(pushAngle) * 220;
          target.vy = Math.sin(pushAngle) * 140 - 50;
        } else {
          // Boss: briefly staggered
          target.applyStun(1.1);
          target.takeDamage(auraDmg * 0.65, target.x, target.y, this, vfx, audio, camera);
        }
      }
    }
  }

  render(ctx) {
    // Render soul orbs
    for (const orb of this.soulOrbs) {
      ctx.save();
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0.5, orb.x, orb.y, 6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#ffd98a');
      grad.addColorStop(1, 'rgba(255, 143, 171, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render projectiles
    for (const p of this.projectiles) {
      p.render(ctx);
    }
  }
}
