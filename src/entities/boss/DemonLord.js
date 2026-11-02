// DemonLord.js - Maldrek, Demon Lord of the Ember Descent (Mini-Boss)
import { COMBAT } from '../../systems/combat/CombatConstants.js';
import { SkeletonWarrior } from '../enemies/Skeletons.js';

export class DemonLord {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 36;
    this.height = 52;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.DEMON_LORD;
    this.name = "MALDREK";
    this.title = "Demon Lord of Ember Descent";
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'DEMON_LORD';

    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;

    // Boss Intro
    this.introDone = false;
    this.introTimer = 2.4;

    // 3 Phases
    this.phase = 1;
    this.attackTimer = 1.2;
    this.fireWaveTimer = 0;
    this.summonTimer = 0;
    this.activeFireWaves = []; // { x, y, vx, life }
    this.summonedMinions = [];

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

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera) {
    if (this.isDead || !this.introDone) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.35 && this.phase < 3) {
      this.phase = 3;
      if (vfx) vfx.triggerFlash('#c1121f', 0.25);
      if (camera) camera.shake(8, 0.4);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    } else if (hpRatio <= 0.70 && this.phase < 2) {
      this.phase = 2;
      if (vfx) vfx.triggerFlash('#ff6b35', 0.2);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    }

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 30, vfx, audio, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    // High will: staggered only
    this.applyStun(1.0);
    this.takeDamage(45, this.x, this.y, combatSystem, vfx, audio, camera);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 2.4;
    if (camera) camera.shake(12, 0.8);
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
      combatSystem.triggerSlowMo(0.4, 0.15);
    }
    if (audio) audio.playBossDefeated ? audio.playBossDefeated() : null;
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (!this.introDone) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) this.introDone = true;
      return;
    }

    // Update fire waves
    for (let i = this.activeFireWaves.length - 1; i >= 0; i--) {
      const fw = this.activeFireWaves[i];
      fw.x += fw.vx * dt;
      fw.life -= dt;
      if (fw.life <= 0) {
        this.activeFireWaves.splice(i, 1);
        continue;
      }
      if (Math.abs(player.x - fw.x) < 20 && Math.abs(player.y - fw.y) < 24 && !player.isInvulnerable) {
        player.respawn();
      }
    }

    // Update summoned minions
    for (let i = this.summonedMinions.length - 1; i >= 0; i--) {
      const m = this.summonedMinions[i];
      m.update(player, combatSystem, vfx, particles, audio, camera, dt);
      if (m.isDead && m.y > this.y + 400) {
        this.summonedMinions.splice(i, 1);
      }
    }

    if (this.isDead) return;

    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // Movement & attack routines based on phase
    const currentSpeed = this.speed * (this.phase === 3 ? 1.3 : 1.0);

    if (dist > 45) {
      this.vx = this.facing * currentSpeed;
    } else {
      this.vx = 0;
    }
    this.x += this.vx * dt;

    // Phase 1+: Flaming Greatsword combo
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.phase === 3 ? 1.0 : 1.6;
      if (vfx) vfx.triggerHitSparks(this.x + this.facing * 30, this.y - 20, '#ff6b35');
      if (audio) audio.playSlash(2);
      if (dist < 48 && !player.isInvulnerable) {
        player.respawn();
      }
    }

    // Phase 2+: Fire waves across floor
    if (this.phase >= 2) {
      this.fireWaveTimer += dt;
      if (this.fireWaveTimer >= 3.2) {
        this.fireWaveTimer = 0;
        this.activeFireWaves.push({
          x: this.x,
          y: this.y,
          vx: this.facing * 180,
          life: 2.5
        });
        if (camera) camera.shake(5, 0.2);
      }
    }

    // Phase 3: Summon skeleton warriors
    if (this.phase >= 3) {
      this.summonTimer += dt;
      if (this.summonTimer >= 6.0 && this.summonedMinions.length < 2) {
        this.summonTimer = 0;
        const skel = new SkeletonWarrior(this.x + (Math.random() > 0.5 ? 50 : -50), this.y);
        this.summonedMinions.push(skel);
        if (vfx) vfx.triggerFlash('#c1121f', 0.2);
      }
    }
  }

  render(ctx, camera = { x: 0, y: 0 }) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Fire waves
    for (const fw of this.activeFireWaves) {
      const fwx = Math.round(fw.x - camera.x);
      const fwy = Math.round(fw.y - camera.y);
      ctx.save();
      const grad = ctx.createLinearGradient(fwx, fwy, fwx, fwy - 26);
      grad.addColorStop(0, '#ffd98a');
      grad.addColorStop(0.5, '#ff6b35');
      grad.addColorStop(1, 'rgba(193, 18, 31, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(fwx, fwy - 10, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Minions
    for (const m of this.summonedMinions) {
      m.render(ctx, camera);
    }

    ctx.save();
    ctx.translate(rx, ry);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    ctx.scale(this.facing, 1);

    // Torso with Hellfire Armor
    ctx.fillStyle = '#220b16';
    ctx.fillRect(-12, -42, 24, 30);
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -42, 24, 30);

    // Head & Crown of Horns
    ctx.fillStyle = '#16050e';
    ctx.beginPath();
    ctx.arc(0, -48, 9, 0, Math.PI * 2);
    ctx.fill();

    // 4 Flaming Horns
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -53);
    ctx.lineTo(-14, -66);
    ctx.moveTo(6, -53);
    ctx.lineTo(14, -66);
    ctx.stroke();

    // Burning Demonic Eyes
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(1, -50, 4, 3);

    // Flaming Greatsword
    const swingAngle = this.attackTimer < 0.3 ? 0.8 : -0.4;
    ctx.save();
    ctx.translate(10, -28);
    ctx.rotate(swingAngle);
    // Blade
    const bladeGrad = ctx.createLinearGradient(0, 0, 0, -42);
    bladeGrad.addColorStop(0, '#ff6b35');
    bladeGrad.addColorStop(0.7, '#ffd98a');
    bladeGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bladeGrad;
    ctx.fillRect(-3, -42, 6, 42);
    // Crossguard
    ctx.fillStyle = '#c1121f';
    ctx.fillRect(-8, 0, 16, 4);
    ctx.restore();

    // Legs
    ctx.strokeStyle = '#16050e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-7, 0);
    ctx.moveTo(6, -12);
    ctx.lineTo(7, 0);
    ctx.stroke();

    ctx.restore();

    // Boss Name & Health Bar (HUD)
    if (this.introDone && !this.isDead) {
      this.renderBossBar(ctx);
    }
  }

  renderBossBar(ctx) {
    const barW = 240;
    const barH = 10;
    const barX = (640 - barW) / 2;
    const barY = 32;

    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 18, 0.85)';
    ctx.fillRect(barX - 2, barY - 14, barW + 4, barH + 18);
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    const grad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
    grad.addColorStop(0, '#ff6b35');
    grad.addColorStop(1, '#c1121f');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 9px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.name} — ${this.title}`, 320, barY - 3);
    ctx.restore();
  }
}
