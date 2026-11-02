// Demons.js - Fire Imp, Horned Brute, and Hell Caster
import { COMBAT } from '../../systems/combat/CombatConstants.js';

export class FireImp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 16;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.FIRE_IMP;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'DEMON';
    this.name = 'Fire Imp';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.animTimer = Math.random() * 10;
    this.chargeTimer = 0;
    this.fireballs = [];

    this.rotation = 0;
    this.spinSpeed = 0;
  }

  getHurtbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 25, vfx, audio, camera);
    }
    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    this.takeDamage(this.hp + 10, this.x, this.y, combatSystem, vfx, audio, camera);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.vy = -180;
    this.vx = -this.facing * 110;
    this.spinSpeed = this.facing * 12;

    if (combatSystem) combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Update fireballs
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      fb.life -= dt;
      if (fb.life <= 0) {
        this.fireballs.splice(i, 1);
        continue;
      }
      const pDist = Math.hypot(fb.x - player.x, fb.y - (player.y - 12));
      if (pDist < 14 && !player.isInvulnerable) {
        this.fireballs.splice(i, 1);
        player.respawn();
      }
    }

    if (this.isDead) {
      this.vy += 650 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.spinSpeed * dt;
      return;
    }

    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // Erratic flying sine wave
    this.x += Math.cos(this.animTimer * 2.5) * (this.speed * 0.7) * dt;
    this.y = this.startY + Math.sin(this.animTimer * 4) * 22;

    if (dist < 220) {
      this.chargeTimer += dt;
      if (this.chargeTimer >= 1.4) {
        this.chargeTimer = 0;
        // Fireball throw
        const angle = Math.atan2(dy, dx);
        this.fireballs.push({
          x: this.x + this.facing * 8,
          y: this.y - 8,
          vx: Math.cos(angle) * 230,
          vy: Math.sin(angle) * 230,
          life: 2.2
        });
        if (audio) audio.playSlash(2);
      }
    } else {
      this.chargeTimer = 0;
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Fireballs
    ctx.save();
    for (const fb of this.fireballs) {
      const fbx = Math.round(fb.x - camera.x);
      const fby = Math.round(fb.y - camera.y);
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#c1121f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(fbx, fby, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(rx, ry);
    if (this.isDead) {
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.85;
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    ctx.scale(this.facing, 1);

    // Bat wings flapping
    const wingAngle = Math.sin(this.animTimer * 14) * 0.45;
    ctx.fillStyle = '#7a1420';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-12, -22 + wingAngle * 8);
    ctx.lineTo(-4, -10);
    ctx.fill();

    // Imp Body
    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.ellipse(0, -10, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-3, -16);
    ctx.lineTo(-6, -22);
    ctx.moveTo(3, -16);
    ctx.lineTo(6, -22);
    ctx.stroke();

    // Glowing Yellow Demonic Eyes
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(1, -12, 2.5, 2);

    // Fireball charging in hands
    if (this.chargeTimer > 0.7) {
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#ffd98a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(6, -8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class HornedBrute {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 28;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.HORNED_BRUTE;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'DEMON';
    this.name = 'Horned Brute';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.animTimer = Math.random() * 5;
    this.chargeWindup = 0;
    this.isCharging = false;
    this.chargeDuration = 0;
    this.groundPoundTimer = 0;
    this.groundShockwave = null;

    this.rotation = 0;
    this.spinSpeed = 0;
  }

  getHurtbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.isCharging = false;
    this.chargeWindup = 0;
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 30, vfx, audio, camera);
    }
    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    // Medium will kneels, doesn't insta-faint
    this.applyStun(2.2);
    this.takeDamage(55, this.x, this.y, combatSystem, vfx, audio, camera);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.vy = -200;
    this.vx = -this.facing * 120;
    this.spinSpeed = this.facing * 8;
    if (combatSystem) combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (this.groundShockwave) {
      this.groundShockwave.radius += 180 * dt;
      this.groundShockwave.life -= dt;
      if (this.groundShockwave.life <= 0) {
        this.groundShockwave = null;
      } else {
        // Shockwave damages player if standing near ground
        const pDist = Math.abs(player.x - this.groundShockwave.x);
        if (pDist < this.groundShockwave.radius && Math.abs(player.y - this.y) < 16 && !player.isInvulnerable) {
          player.respawn();
        }
      }
    }

    if (this.isDead) {
      this.vy += 700 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.spinSpeed * dt;
      return;
    }

    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.isCharging) {
      this.vx = this.facing * 240;
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.isCharging = false;
        // End charge with ground pound shockwave
        this.groundShockwave = { x: this.x, radius: 10, life: 0.4 };
        if (camera) camera.shake(6, 0.25);
        if (vfx) vfx.triggerHitSparks(this.x, this.y, '#ff6b35');
      }
      // Collide with player while charging
      if (dist < 26 && !player.isInvulnerable) {
        player.respawn();
      }
    } else if (this.chargeWindup > 0) {
      this.chargeWindup -= dt;
      this.vx = 0;
      if (this.chargeWindup <= 0) {
        this.isCharging = true;
        this.chargeDuration = 0.6;
        if (audio) audio.playSlash(2);
      }
    } else {
      if (dist < 180 && Math.abs(dy) < 50) {
        this.facing = dx > 0 ? 1 : -1;
        this.groundPoundTimer += dt;
        if (this.groundPoundTimer >= 2.2) {
          this.groundPoundTimer = 0;
          this.chargeWindup = 0.65; // Telegraph red charge
        } else {
          this.vx = this.facing * this.speed;
        }
      } else {
        if (Math.abs(this.x - this.startX) > 80) {
          this.facing = this.x > this.startX ? -1 : 1;
        }
        this.vx = this.facing * (this.speed * 0.5);
      }
    }

    this.x += this.vx * dt;
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Ground shockwave
    if (this.groundShockwave) {
      const gsx = Math.round(this.groundShockwave.x - camera.x);
      ctx.save();
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(gsx, ry, this.groundShockwave.radius, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(rx, ry);
    if (this.isDead) {
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.85;
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Charge windup red telegraph arrow
    if (this.chargeWindup > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(193, 18, 31, 0.7)';
      ctx.beginPath();
      ctx.moveTo(this.facing * 14, -8);
      ctx.lineTo(this.facing * 44, -8);
      ctx.lineTo(this.facing * 40, -14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.scale(this.facing, 1);

    // Massive Muscular Torso with Hellfire veins
    ctx.fillStyle = '#2a1520';
    ctx.fillRect(-10, -28, 20, 20);

    // Molten fissures
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -26);
    ctx.lineTo(2, -18);
    ctx.lineTo(-2, -12);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#1e0c15';
    ctx.beginPath();
    ctx.arc(0, -31, 7, 0, Math.PI * 2);
    ctx.fill();

    // Giant curved obsidian horns
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, -34);
    ctx.quadraticCurveTo(-14, -44, -6, -46);
    ctx.moveTo(5, -34);
    ctx.quadraticCurveTo(14, -44, 6, -46);
    ctx.stroke();

    // Glowing eyes
    ctx.fillStyle = this.isCharging ? '#ffffff' : '#ff6b35';
    ctx.fillRect(1, -32, 3, 2);

    // Heavy knuckle fists
    ctx.fillStyle = '#1e0c15';
    ctx.fillRect(6, -20, 8, 8);

    // Legs
    ctx.strokeStyle = '#1e0c15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(-6, 0);
    ctx.moveTo(5, -8);
    ctx.lineTo(6, 0);
    ctx.stroke();

    ctx.restore();
  }
}

export class HellCaster {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 18;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.HELL_CASTER;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'DEMON';
    this.name = 'Hell Caster';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.animTimer = Math.random() * 5;
    this.castTimer = 0;
    this.flamePillars = []; // { x, y, telegraph, activeTimer }

    this.rotation = 0;
    this.spinSpeed = 0;
  }

  getHurtbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera) {
    if (this.isDead) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 25, vfx, audio, camera);
    }
    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    this.applyStun(2.0);
    this.takeDamage(55, this.x, this.y, combatSystem, vfx, audio, camera);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.vy = -180;
    this.vx = -this.facing * 100;
    this.spinSpeed = this.facing * 10;
    if (combatSystem) combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Update flame pillars
    for (let i = this.flamePillars.length - 1; i >= 0; i--) {
      const p = this.flamePillars[i];
      if (p.telegraph > 0) {
        p.telegraph -= dt;
      } else {
        p.activeTimer -= dt;
        if (p.activeTimer <= 0) {
          this.flamePillars.splice(i, 1);
          continue;
        }
        // Active pillar damages player
        if (Math.abs(player.x - p.x) < 18 && (player.y >= p.y - 120 && player.y <= p.y + 10) && !player.isInvulnerable) {
          player.respawn();
        }
      }
    }

    if (this.isDead) {
      this.vy += 650 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.spinSpeed * dt;
      return;
    }

    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // Teleport away if player gets within 50px
    if (dist < 50) {
      if (vfx) vfx.triggerFlash('#c1121f', 0.15);
      this.x += this.facing > 0 ? -90 : 90;
      if (audio) audio.playSlash(1);
    }

    // Cast flame pillars
    if (dist < 260) {
      this.castTimer += dt;
      if (this.castTimer >= 2.4) {
        this.castTimer = 0;
        // Spawn 2 pillars: one at player's feet, one offset
        this.flamePillars.push({
          x: player.x,
          y: player.y + 4,
          telegraph: 0.75,
          activeTimer: 0.55
        });
        this.flamePillars.push({
          x: player.x + (Math.random() > 0.5 ? 40 : -40),
          y: player.y + 4,
          telegraph: 0.75,
          activeTimer: 0.55
        });
        if (audio) audio.playAuraBuildUp ? audio.playAuraBuildUp() : null;
      }
    } else {
      this.castTimer = 0;
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Render Flame Pillars
    for (const p of this.flamePillars) {
      const px = Math.round(p.x - camera.x);
      const py = Math.round(p.y - camera.y);

      if (p.telegraph > 0) {
        // Ground warning circle with runic ring
        ctx.save();
        ctx.fillStyle = 'rgba(255, 107, 53, 0.4)';
        ctx.strokeStyle = '#c1121f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, py, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Blazing erupting flame pillar
        ctx.save();
        const grad = ctx.createLinearGradient(px, py, px, py - 110);
        grad.addColorStop(0, '#ffd98a');
        grad.addColorStop(0.3, '#ff6b35');
        grad.addColorStop(0.8, '#c1121f');
        grad.addColorStop(1, 'rgba(193, 18, 31, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(px - 14, py - 110, 28, 110);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(rx, ry);
    if (this.isDead) {
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.85;
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    ctx.scale(this.facing, 1);

    // Floating Robe
    ctx.fillStyle = '#3a1224';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    // Demonic Cowl
    ctx.fillStyle = '#1e0814';
    ctx.beginPath();
    ctx.arc(0, -26, 6, 0, Math.PI * 2);
    ctx.fill();

    // Occult glowing gaze
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(1, -27, 3, 2);

    // Floating Skull Staff
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(8, -32);
    ctx.stroke();

    ctx.fillStyle = '#c1121f';
    ctx.beginPath();
    ctx.arc(8, -34, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
