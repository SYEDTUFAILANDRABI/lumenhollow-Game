// ArchDemon.js - Azrakul, Winged Sovereign of the Abyssal Throne (Boss)
import { COMBAT } from '../../systems/combat/CombatConstants.js';

export class ArchDemon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 40;
    this.height = 56;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.ARCH_DEMON;
    this.name = "AZRAKUL";
    this.title = "The Winged Cataclysm";
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'ARCH_DEMON';

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
    this.state = 'HOVER'; // HOVER, DIVE, COMBO, RAIN
    this.stateTimer = 1.0;
    this.animTimer = 0;
    this.diveTargetX = x;
    this.diveTargetY = y;
    this.hellfireRain = []; // { x, y, vy }
    this.afterimages = [];
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
      if (camera) camera.shake(10, 0.5);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    } else if (hpRatio <= 0.68 && this.phase < 2) {
      this.phase = 2;
      if (vfx) vfx.triggerFlash('#bb44ff', 0.2);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    }

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 32, vfx, audio, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    // Very high will: barely reacts (0.2s stagger)
    this.applyStun(0.3);
    this.takeDamage(35, this.x, this.y, combatSystem, vfx, audio, camera);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 2.5;
    if (camera) camera.shake(14, 0.9);
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
      combatSystem.triggerSlowMo(0.45, 0.12);
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

    // Update afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= dt * 3;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
    }

    // Update Hellfire rain
    for (let i = this.hellfireRain.length - 1; i >= 0; i--) {
      const drop = this.hellfireRain[i];
      drop.y += drop.vy * dt;
      if (drop.y > this.startY + 40) {
        this.hellfireRain.splice(i, 1);
        continue;
      }
      if (Math.abs(player.x - drop.x) < 14 && Math.abs(player.y - drop.y) < 16 && !player.isInvulnerable) {
        player.respawn();
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

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      // Pick next state
      if (this.state === 'HOVER') {
        this.state = 'DIVE';
        this.stateTimer = 0.9;
        this.diveTargetX = player.x;
        this.diveTargetY = player.y;
      } else if (this.state === 'DIVE') {
        this.state = this.phase >= 2 ? 'RAIN' : 'HOVER';
        this.stateTimer = 1.4;
        if (camera) camera.shake(7, 0.3);
      } else if (this.state === 'RAIN') {
        this.state = 'HOVER';
        this.stateTimer = 1.2;
        // Spawn 4-6 rain drops
        for (let i = 0; i < 6; i++) {
          this.hellfireRain.push({
            x: player.x + (i - 2.5) * 45,
            y: this.y - 140,
            vy: 240 + Math.random() * 60
          });
        }
      }
    }

    // Movement execution
    if (this.state === 'HOVER') {
      const targetHoverY = this.startY - 70 + Math.sin(this.animTimer * 3) * 16;
      this.y += (targetHoverY - this.y) * 4 * dt;
      this.x += (player.x + (this.facing * -70) - this.x) * 3 * dt;
    } else if (this.state === 'DIVE') {
      // High-speed dive-bomb
      this.x += (this.diveTargetX - this.x) * 7 * dt;
      this.y += (this.diveTargetY - this.y) * 7 * dt;
      this.afterimages.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.7 });
      if (dist < 32 && !player.isInvulnerable) {
        player.respawn();
      }
    }

    // Phase 3 Teleport Strikes
    if (this.phase === 3 && Math.random() < 0.015) {
      this.x = player.x + (Math.random() > 0.5 ? 55 : -55);
      this.y = player.y;
      if (vfx) vfx.triggerFlash('#bb44ff', 0.15);
      if (audio) audio.playSlash(1);
    }
  }

  render(ctx, camera = { x: 0, y: 0 }) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Afterimages
    for (const ai of this.afterimages) {
      const aix = Math.round(ai.x - camera.x);
      const aiy = Math.round(ai.y - camera.y);
      ctx.save();
      ctx.globalAlpha = ai.alpha * 0.45;
      ctx.fillStyle = '#bb44ff';
      ctx.fillRect(aix - 16, aiy - 48, 32, 48);
      ctx.restore();
    }

    // Hellfire Rain
    for (const drop of this.hellfireRain) {
      const dx = Math.round(drop.x - camera.x);
      const dy = Math.round(drop.y - camera.y);
      ctx.save();
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#c1121f';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

    // Giant Draconic Bat Wings
    const wingFlap = Math.sin(this.animTimer * 10) * 0.5;
    ctx.fillStyle = '#1b0816';
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(-38, -65 + wingFlap * 16);
    ctx.lineTo(-24, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(38, -65 + wingFlap * 16);
    ctx.lineTo(24, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Body
    ctx.fillStyle = '#120510';
    ctx.fillRect(-14, -46, 28, 34);
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -46, 28, 34);

    // Head
    ctx.fillStyle = '#0a0209';
    ctx.beginPath();
    ctx.arc(0, -52, 10, 0, Math.PI * 2);
    ctx.fill();

    // Swept-back demon horns
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -58);
    ctx.lineTo(-18, -74);
    ctx.moveTo(6, -58);
    ctx.lineTo(18, -74);
    ctx.stroke();

    // Burning Violet Gaze
    ctx.fillStyle = '#bb44ff';
    ctx.fillRect(2, -54, 4, 3);

    // Talon Claws
    ctx.strokeStyle = '#e8e1d5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(-10, 0);
    ctx.moveTo(8, -12);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.restore();

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
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    const grad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
    grad.addColorStop(0, '#bb44ff');
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
