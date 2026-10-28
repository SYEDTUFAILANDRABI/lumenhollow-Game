import { Projectile } from '../../systems/combat/Projectile.js';

export class EclipseWarden {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 32;
    this.height = 48;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    // Boss Stats
    this.name = "ECLIPSE WARDEN";
    this.title = "Void Vanguard of Sky Ruins";
    this.maxHp = 320;
    this.hp = 320;
    this.will = 95; // High will - brief stun only in Sovereign Aura
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;

    // Intro cutscene
    this.introDone = false;
    this.introTimer = 2.4;

    // 3 Phases
    this.phase = 1; // 1, 2, 3
    this.attackTimer = 1.0;
    this.teleportTimer = 0;
    this.slamActive = false;
    this.slamTimer = 0;
    this.animTimer = 0;
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

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audioSystem, camera) {
    if (this.isDead || !this.introDone) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    // Phase transitions
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.30 && this.phase < 3) {
      this.phase = 3;
      if (vfx) vfx.triggerFlash('#ff2255', 0.25);
      if (camera) camera.shake(8, 0.4);
      if (audioSystem) audioSystem.playBossPhaseTransition();
    } else if (hpRatio <= 0.65 && this.phase < 2) {
      this.phase = 2;
      if (vfx) vfx.triggerFlash('#a288e3', 0.2);
      if (audioSystem) audioSystem.playBossPhaseTransition();
    }

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 30, vfx, audioSystem, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audioSystem, camera);
    }
  }

  dieToAura(combatSystem, vfx, particleSystem, audioSystem, camera) {
    this.takeDamage(40, this.x, this.y, combatSystem, vfx, audioSystem, camera);
  }

  die(combatSystem, vfx, particleSystem, audioSystem, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 2.2;
    if (camera) camera.shake(10, 0.8);
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audioSystem, camera);
      combatSystem.triggerSlowMo(0.4, 0.15); // Finisher slow-mo
    }
    if (audioSystem) audioSystem.playBossDefeated();
  }

  update(player, combatSystem, vfx, particleSystem, audioSystem, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Intro cutscene
    if (!this.introDone) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.introDone = true;
      }
      return;
    }

    if (this.isDead) {
      this.deathTimer -= dt;
      if (particleSystem && Math.random() < 0.4) {
        particleSystem.emitDeathBurst(this.x + (Math.random() - 0.5) * 30, this.y - Math.random() * 40);
      }
      return;
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    this.facing = px > this.x ? 1 : -1;

    // Boss Attack Loop
    this.attackTimer -= dt;

    if (this.attackTimer <= 0) {
      if (this.phase === 1) {
        // Phase 1: Fire slow homing Umbral Orbs + occasional teleport
        this.fireUmbralOrb(px, py, combatSystem, audioSystem);
        this.attackTimer = 1.8;
      } else if (this.phase === 2) {
        // Phase 2: Rapid void darts
        this.fireVoidBurst(px, py, combatSystem, audioSystem);
        this.attackTimer = 1.4;
      } else {
        // Phase 3: Screen-wide Slam
        this.executeScreenSlam(player, combatSystem, vfx, particleSystem, audioSystem, camera);
        this.attackTimer = 2.8;
      }
    }

    // Floating bobbing motion
    const hoverY = this.startY + Math.sin(this.animTimer * 2.5) * 8;
    this.y += (hoverY - this.y) * 4 * dt;
  }

  fireUmbralOrb(px, py, combatSystem, audioSystem) {
    if (!combatSystem) return;
    const angle = Math.atan2(py - (this.y - 20), px - this.x);
    const speed = 120;
    combatSystem.projectiles.push(new Projectile(this.x, this.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      radius: 8,
      damage: 1,
      isEnemy: true,
      lifetime: 3.5,
      color: '#ff2255',
      coreColor: '#ffffff'
    }));
    if (audioSystem) audioSystem.playBossOrb();
  }

  fireVoidBurst(px, py, combatSystem, audioSystem) {
    if (!combatSystem) return;
    const baseAngle = Math.atan2(py - (this.y - 20), px - this.x);
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * 0.28;
      const speed = 170;
      combatSystem.projectiles.push(new Projectile(this.x, this.y - 20, Math.cos(angle) * speed, Math.sin(angle) * speed, {
        radius: 6,
        damage: 1,
        isEnemy: true,
        lifetime: 2.8,
        color: '#a288e3',
        coreColor: '#ffffff'
      }));
    }
    if (audioSystem) audioSystem.playBossOrb();
  }

  executeScreenSlam(player, combatSystem, vfx, particleSystem, audioSystem, camera) {
    // Jump up and slam down
    if (camera) camera.shake(8, 0.4);
    if (audioSystem) audioSystem.playBossSlam();

    if (vfx) {
      vfx.addGroundCrack(this.x, this.y, 65, 3.0);
      vfx.addShockwave(this.x, this.y, 140, 0.55, '#ff2255', true);
    }

    if (particleSystem) {
      particleSystem.emitLandPuff(this.x, this.y);
    }

    // Player must jump or dash; if grounded without invulnerability, player gets hit
    if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
      const pDist = Math.abs((player.x + player.width / 2) - this.x);
      if (pDist < 140 && player.isGrounded) {
        player.die(particleSystem, camera, audioSystem);
      }
    }
  }

  render(ctx) {
    if (this.isDead && this.deathTimer <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Outer Void Aura
    const auraGrad = ctx.createRadialGradient(0, -this.height / 2, 8, 0, -this.height / 2, 40);
    auraGrad.addColorStop(0, this.phase === 3 ? 'rgba(255, 34, 85, 0.5)' : 'rgba(100, 40, 160, 0.45)');
    auraGrad.addColorStop(1, 'rgba(10, 8, 20, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -this.height / 2, 40, 0, Math.PI * 2);
    ctx.fill();

    // Large Shadow Wings
    const wingFlap = Math.sin(this.animTimer * 5) * 8;
    ctx.fillStyle = '#140c24';
    ctx.beginPath();
    ctx.moveTo(0, -this.height + 14);
    ctx.quadraticCurveTo(-28, -this.height - 10 + wingFlap, -45, -this.height + 25 + wingFlap);
    ctx.lineTo(-12, -this.height + 30);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -this.height + 14);
    ctx.quadraticCurveTo(28, -this.height - 10 + wingFlap, 45, -this.height + 25 + wingFlap);
    ctx.lineTo(12, -this.height + 30);
    ctx.closePath();
    ctx.fill();

    // Body armor
    ctx.fillStyle = '#261b3d';
    ctx.fillRect(-12, -this.height + 12, 24, 26);

    // Crown / Horns
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.moveTo(-10, -this.height + 8);
    ctx.lineTo(-16, -this.height - 12);
    ctx.lineTo(-6, -this.height + 4);
    ctx.moveTo(10, -this.height + 8);
    ctx.lineTo(16, -this.height - 12);
    ctx.lineTo(6, -this.height + 4);
    ctx.fill();

    // Visor / Mask
    ctx.fillStyle = '#0a0715';
    ctx.beginPath();
    ctx.arc(0, -this.height + 8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = this.phase === 3 ? '#ff2255' : (this.isStunned ? '#ffd98a' : '#a288e3');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(3, -this.height + 7, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
