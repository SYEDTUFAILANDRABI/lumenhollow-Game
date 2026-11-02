// Skeletons.js - Skeleton Warrior, Archer, and Bone Knight
import { COMBAT } from '../../systems/combat/CombatConstants.js';
import { Projectile } from '../../systems/combat/Projectile.js';
import { SkeletonSprite } from './SkeletonSprite.js';

export class SkeletonWarrior {
  constructor(x, y, isUprising = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 18;
    this.height = 28;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.SKELETON_WARRIOR;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'SKELETON';
    this.name = 'Skeleton Warrior';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.state = 'PATROL'; // PATROL, CHASE, ATTACK, COWER
    this.attackTimer = 0;
    this.animTimer = Math.random() * 5;
    this.shieldBlockFlash = 0;

    // Uprising from beneath mechanics
    this.isUprising = isUprising;
    this.uprisingTimer = isUprising ? 1.0 : 0;
    this.uprisingMax = 1.0;
    this.uprisingYOffset = isUprising ? this.height : 0;

    this.rotation = 0;
    this.spinSpeed = 0;
    this.sprite = new SkeletonSprite();
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

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera, isPlunge = false, isAura = false) {
    if (this.isDead) return;

    // Shield block check: if attack hits front of skeleton and is not plunge/aura
    const hitFromFront = (hitX - this.x) * this.facing < 0;
    if (hitFromFront && !isPlunge && !isAura) {
      this.shieldBlockFlash = 0.2;
      if (audio) audio.playParrySuccess ? audio.playParrySuccess() : audio.playSlash(0);
      if (vfx) vfx.triggerHitSparks(this.x + this.facing * 8, this.y - 14, '#ffd98a');
      return; // Blocked!
    }

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
    this.takeDamage(this.hp + 10, this.x, this.y, combatSystem, vfx, audio, camera, false, true);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.vy = -180;
    this.vx = -this.facing * 120;
    this.spinSpeed = this.facing * 12;

    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    }
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.sprite) this.sprite.update(dt, this);

    if (this.isUprising) {
      this.uprisingTimer -= dt;
      const progress = 1 - Math.max(0, this.uprisingTimer / this.uprisingMax);
      this.uprisingYOffset = this.height * (1 - progress);
      if (particles && Math.random() < 0.35) {
        particles.emitLandPuff(this.x, this.y);
      }
      if (this.uprisingTimer <= 0) {
        this.isUprising = false;
        this.uprisingYOffset = 0;
        if (camera) camera.shake(2.5, 0.15);
      }
      return;
    }
    if (this.shieldBlockFlash > 0) this.shieldBlockFlash -= dt;

    if (this.isDead) {
      this.vy += 700 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.spinSpeed * dt;
      return;
    }

    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.state = 'PATROL';
      }
      return;
    }

    // AI logic
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 180 && Math.abs(dy) < 60) {
      this.facing = dx > 0 ? 1 : -1;
      if (dist < 26) {
        // Attack range
        this.vx = 0;
        this.attackTimer += dt;
        if (this.attackTimer >= 0.75) {
          this.attackTimer = 0;
          // Slash telegraph & strike
          if (vfx) vfx.triggerHitSparks(this.x + this.facing * 16, this.y - 12, '#c1121f');
          if (audio) audio.playSlash(0);
          if (dist < 32 && !player.isInvulnerable) {
            player.respawn();
          }
        }
      } else {
        // Chase
        this.vx = this.facing * this.speed;
        this.attackTimer = 0;
      }
    } else {
      // Patrol near startX
      if (Math.abs(this.x - this.startX) > 60) {
        this.facing = this.x > this.startX ? -1 : 1;
      }
      this.vx = this.facing * (this.speed * 0.5);
    }

    this.x += this.vx * dt;
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    if (this.isUprising) {
      // Ground fissure and claws reaching from underneath
      ctx.save();
      ctx.fillStyle = '#090814';
      ctx.fillRect(rx - 14, ry - 3, 28, 6);
      ctx.strokeStyle = '#e8e1d5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - 8, ry + 2);
      ctx.lineTo(rx - 11, ry - 7);
      ctx.moveTo(rx + 8, ry + 2);
      ctx.lineTo(rx + 11, ry - 7);
      ctx.stroke();
      ctx.restore();
    }

    if (this.sprite && this.sprite.render(ctx, rx, ry + (this.uprisingYOffset || 0), this.facing, this.hitFlashTimer, 1.0)) {
      return;
    }

    ctx.save();
    ctx.translate(rx, ry + (this.uprisingYOffset || 0));
    if (this.isDead) {
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.85;
    }

    // Hit flash
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    ctx.scale(this.facing, 1);

    // Spine and ribcage
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -20);
    ctx.stroke();

    // Ribs
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ribY = -12 - i * 3;
      ctx.beginPath();
      ctx.moveTo(-4, ribY);
      ctx.lineTo(4, ribY);
      ctx.stroke();
    }

    // Skull
    ctx.fillStyle = '#e8e1d5';
    ctx.beginPath();
    ctx.arc(0, -23, 5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eye sockets
    ctx.fillStyle = this.attackTimer > 0.4 ? '#c1121f' : '#7be0ad';
    ctx.fillRect(1, -24, 2, 2);

    // Shield (Front)
    ctx.fillStyle = this.shieldBlockFlash > 0 ? '#ffd98a' : '#5a4634';
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 1.2;
    ctx.fillRect(5, -20, 4, 16);
    ctx.strokeRect(5, -20, 4, 16);

    // Bone Sword (Back hand)
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(-6 + (this.attackTimer > 0.4 ? 12 : -4), -18);
    ctx.stroke();

    // Legs
    const walk = Math.sin(this.animTimer * 6) * 4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-4, walk);
    ctx.moveTo(2, -6);
    ctx.lineTo(4, -walk);
    ctx.stroke();

    ctx.restore();
  }
}

export class SkeletonArcher {
  constructor(x, y, isUprising = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 16;
    this.height = 28;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.SKELETON_ARCHER;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'SKELETON';
    this.name = 'Skeleton Archer';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.state = 'IDLE';
    this.aimTimer = 0;
    this.animTimer = Math.random() * 5;
    this.projectiles = [];

    // Uprising from beneath mechanics
    this.isUprising = isUprising;
    this.uprisingTimer = isUprising ? 1.0 : 0;
    this.uprisingMax = 1.0;
    this.uprisingYOffset = isUprising ? this.height : 0;

    this.rotation = 0;
    this.spinSpeed = 0;
    this.sprite = new SkeletonSprite();
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
    this.vy = -170;
    this.vx = -this.facing * 100;
    this.spinSpeed = this.facing * 10;
    if (combatSystem) combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.sprite) this.sprite.update(dt, this);

    if (this.isUprising) {
      this.uprisingTimer -= dt;
      const progress = 1 - Math.max(0, this.uprisingTimer / this.uprisingMax);
      this.uprisingYOffset = this.height * (1 - progress);
      if (particles && Math.random() < 0.35) {
        particles.emitLandPuff(this.x, this.y);
      }
      if (this.uprisingTimer <= 0) {
        this.isUprising = false;
        this.uprisingYOffset = 0;
        if (camera) camera.shake(2.5, 0.15);
      }
      return;
    }

    // Update fired bone arrows
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      // Check collision with player
      const pDist = Math.hypot(p.x - player.x, p.y - (player.y - 12));
      if (pDist < 12 && !player.isInvulnerable) {
        this.projectiles.splice(i, 1);
        player.respawn();
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

    this.facing = dx > 0 ? 1 : -1;

    // Kite away if player is too close (< 70px)
    if (dist < 70) {
      this.x -= this.facing * this.speed * dt;
    }

    // Aim and fire if in distance (< 240px)
    if (dist < 240 && Math.abs(dy) < 80) {
      this.aimTimer += dt;
      if (this.aimTimer >= 1.2) {
        this.aimTimer = 0;
        // Fire bone arrow
        const angle = Math.atan2(dy - 12, dx);
        this.projectiles.push({
          x: this.x + this.facing * 8,
          y: this.y - 18,
          vx: Math.cos(angle) * 260,
          vy: Math.sin(angle) * 260,
          life: 2.0
        });
        if (audio) audio.playSlash(1);
      }
    } else {
      this.aimTimer = 0;
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    if (this.isUprising) {
      // Ground fissure and claws reaching from underneath
      ctx.save();
      ctx.fillStyle = '#090814';
      ctx.fillRect(rx - 14, ry - 3, 28, 6);
      ctx.strokeStyle = '#e8e1d5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - 8, ry + 2);
      ctx.lineTo(rx - 11, ry - 7);
      ctx.moveTo(rx + 8, ry + 2);
      ctx.lineTo(rx + 11, ry - 7);
      ctx.stroke();
      ctx.restore();
    }

    if (this.sprite && this.sprite.render(ctx, rx, ry + (this.uprisingYOffset || 0), this.facing, this.hitFlashTimer, 1.0)) {
      return;
    }

    // Render bone arrows
    ctx.save();
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    for (const p of this.projectiles) {
      const px = Math.round(p.x - camera.x);
      const py = Math.round(p.y - camera.y);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - (p.vx > 0 ? 10 : -10), py - 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(rx, ry + (this.uprisingYOffset || 0));
    if (this.isDead) {
      ctx.rotate(this.rotation);
      ctx.globalAlpha = 0.8;
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Aim telegraph laser line
    if (!this.isDead && this.aimTimer > 0.4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(193, 18, 31, 0.65)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(this.facing * 200, 0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.scale(this.facing, 1);

    // Spine & ribcage
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, -20);
    ctx.stroke();

    // Skull
    ctx.fillStyle = '#e8e1d5';
    ctx.beginPath();
    ctx.arc(0, -23, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Amber aiming eyes
    ctx.fillStyle = this.aimTimer > 0.8 ? '#c1121f' : '#ffd98a';
    ctx.fillRect(1, -24, 2, 2);

    // Curved bone bow
    ctx.strokeStyle = '#a67c52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6, -18, 8, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6 + Math.cos(-Math.PI * 0.4) * 8, -18 + Math.sin(-Math.PI * 0.4) * 8);
    const drawBack = this.aimTimer > 0.5 ? -4 : 0;
    ctx.lineTo(6 + drawBack, -18);
    ctx.lineTo(6 + Math.cos(Math.PI * 0.4) * 8, -18 + Math.sin(Math.PI * 0.4) * 8);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-4, 0);
    ctx.moveTo(2, -6);
    ctx.lineTo(4, 0);
    ctx.stroke();

    ctx.restore();
  }
}

export class BoneKnight {
  constructor(x, y, isUprising = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 22;
    this.height = 34;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.BONE_KNIGHT;
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'SKELETON';
    this.name = 'Bone Knight';

    this.isDead = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;
    this.hasReassembled = false;
    this.isReassembling = false;
    this.reassembleTimer = 0;
    this.attackTimer = 0;
    this.animTimer = Math.random() * 5;

    // Uprising from beneath mechanics
    this.isUprising = isUprising;
    this.uprisingTimer = isUprising ? 1.0 : 0;
    this.uprisingMax = 1.0;
    this.uprisingYOffset = isUprising ? this.height : 0;

    this.rotation = 0;
    this.spinSpeed = 0;
    this.sprite = new SkeletonSprite();
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

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera, isPlunge = false, isAura = false) {
    if (this.isDead || this.isReassembling) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 28, vfx, audio, camera);
    }

    if (this.hp <= 0) {
      if (!this.hasReassembled && !isPlunge && !isAura) {
        // Collapse into bones and reassemble
        this.isReassembling = true;
        this.hasReassembled = true;
        this.reassembleTimer = 1.8;
        if (audio) audio.playDissolve();
      } else {
        this.die(combatSystem, vfx, null, audio, camera);
      }
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    this.takeDamage(this.hp + 20, this.x, this.y, combatSystem, vfx, audio, camera, false, true);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.isReassembling = false;
    this.vy = -190;
    this.vx = -this.facing * 130;
    this.spinSpeed = this.facing * 12;

    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
    }
    if (audio) audio.playDissolve();
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.sprite) this.sprite.update(dt, this);

    if (this.isUprising) {
      this.uprisingTimer -= dt;
      const progress = 1 - Math.max(0, this.uprisingTimer / this.uprisingMax);
      this.uprisingYOffset = this.height * (1 - progress);
      if (particles && Math.random() < 0.35) {
        particles.emitLandPuff(this.x, this.y);
      }
      if (this.uprisingTimer <= 0) {
        this.isUprising = false;
        this.uprisingYOffset = 0;
        if (camera) camera.shake(2.5, 0.15);
      }
      return;
    }

    if (this.isReassembling) {
      this.reassembleTimer -= dt;
      if (this.reassembleTimer <= 0) {
        this.isReassembling = false;
        this.hp = Math.round(this.maxHp * 0.5);
        if (vfx) vfx.triggerFlash('#bb44ff', 0.2);
        if (audio) audio.playShrineActivate();
      }
      return;
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

    if (dist < 160 && Math.abs(dy) < 50) {
      this.facing = dx > 0 ? 1 : -1;
      if (dist < 30) {
        this.vx = 0;
        this.attackTimer += dt;
        if (this.attackTimer >= 0.85) {
          this.attackTimer = 0;
          if (vfx) vfx.triggerHitSparks(this.x + this.facing * 20, this.y - 14, '#ff6b35');
          if (dist < 36 && !player.isInvulnerable) {
            player.respawn();
          }
        }
      } else {
        this.vx = this.facing * this.speed;
      }
    } else {
      if (Math.abs(this.x - this.startX) > 70) {
        this.facing = this.x > this.startX ? -1 : 1;
      }
      this.vx = this.facing * (this.speed * 0.4);
    }

    this.x += this.vx * dt;
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    if (this.isUprising) {
      // Ground fissure and claws reaching from underneath
      ctx.save();
      ctx.fillStyle = '#090814';
      ctx.fillRect(rx - 16, ry - 3, 32, 6);
      ctx.strokeStyle = '#e8e1d5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx - 10, ry + 2);
      ctx.lineTo(rx - 13, ry - 8);
      ctx.moveTo(rx + 10, ry + 2);
      ctx.lineTo(rx + 13, ry - 8);
      ctx.stroke();
      ctx.restore();
    }

    if (!this.isReassembling && this.sprite && this.sprite.render(ctx, rx, ry + (this.uprisingYOffset || 0), this.facing, this.hitFlashTimer, 1.35)) {
      return;
    }

    ctx.save();
    ctx.translate(rx, ry + (this.uprisingYOffset || 0));

    if (this.isReassembling) {
      // Pile of shaking bones on the ground
      const shake = Math.sin(this.animTimer * 25) * 2;
      ctx.fillStyle = '#e8e1d5';
      ctx.fillRect(-10 + shake, -4, 8, 4);
      ctx.fillRect(2 + shake, -4, 7, 4);
      ctx.beginPath();
      ctx.arc(shake, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bb44ff';
      ctx.fillRect(-1, -7, 2, 2);
      ctx.restore();
      return;
    }

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

    // Heavy iron chestplate & pauldrons
    ctx.fillStyle = '#3a3245';
    ctx.fillRect(-7, -24, 14, 16);
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -24, 14, 16);

    // Horned Helmet
    ctx.fillStyle = '#2b2336';
    ctx.beginPath();
    ctx.arc(0, -28, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Horns
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -31);
    ctx.lineTo(-9, -36);
    ctx.moveTo(5, -31);
    ctx.lineTo(9, -36);
    ctx.stroke();

    // Violent Crimson Eye Slit
    ctx.fillStyle = '#c1121f';
    ctx.fillRect(0, -29, 3, 2);

    // Heavy Spiked Mace
    ctx.strokeStyle = '#1b1424';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    const swingY = this.attackTimer > 0.5 ? 4 : -28;
    ctx.lineTo(8, swingY);
    ctx.stroke();

    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(8, swingY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-5, 0);
    ctx.moveTo(4, -8);
    ctx.lineTo(5, 0);
    ctx.stroke();

    ctx.restore();
  }
}
