// AbyssSovereign.js - Nythrax, Sovereign of the Abyss (Final Lower Realm Boss)
import { COMBAT } from '../../systems/combat/CombatConstants.js';
import { FireImp, HornedBrute } from '../enemies/Demons.js';
import { SorcererBossSprite } from './SorcererBossSprite.js';

export class AbyssSovereign {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 54;
    this.height = 76;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;

    const stats = COMBAT.ENEMY_TIERS.ABYSS_SOVEREIGN;
    this.name = "NYTHRAX";
    this.title = "Sovereign of the Abyss";
    this.maxHp = stats.hp;
    this.hp = stats.hp;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.will = stats.will;
    this.xp = stats.xp;
    this.tier = 'ABYSS_SOVEREIGN';

    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;

    // Boss Intro
    this.introDone = false;
    this.introTimer = 2.8;

    // 4 Phases
    this.phase = 1;
    this.animTimer = 0;
    this.attackTimer = 1.4;
    this.beamActive = false;
    this.beamTimer = 0;
    this.chains = []; // { x, y, height, life }
    this.lavaCracks = [];
    this.minions = [];
    this.sprite = new SorcererBossSprite();
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
    // In phase 4, completely unyielding
    if (this.phase === 4) return;
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration * 0.4);
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audio, camera, isAstral = false) {
    if (this.isDead || !this.introDone) return;

    // Phase 4 Rule: Can ONLY be hurt by Astral Form attacks!
    if (this.phase === 4 && !isAstral) {
      if (vfx) vfx.triggerHitSparks(this.x, this.y - 30, '#bb44ff');
      if (combatSystem) combatSystem.registerHit(0, this.x, this.y - 30, false, vfx, audio, camera);
      return; // Immune to normal attacks!
    }

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    const hpRatio = this.hp / this.maxHp;
    if (hpRatio <= 0.25 && this.phase < 4) {
      this.phase = 4;
      if (vfx) vfx.triggerFlash('#c1121f', 0.35);
      if (camera) camera.shake(14, 0.8);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    } else if (hpRatio <= 0.50 && this.phase < 3) {
      this.phase = 3;
      if (vfx) vfx.triggerFlash('#bb44ff', 0.25);
      if (camera) camera.shake(10, 0.5);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    } else if (hpRatio <= 0.75 && this.phase < 2) {
      this.phase = 2;
      if (vfx) vfx.triggerFlash('#ff6b35', 0.2);
      if (camera) camera.shake(8, 0.4);
      if (audio) audio.playBossPhaseTransition ? audio.playBossPhaseTransition() : null;
    }

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 35, vfx, audio, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audio, camera);
    }
  }

  dieToAura(combatSystem, vfx, particles, audio, camera) {
    // In phase 4, completely resists Sovereign's Aura
    if (this.phase === 4) return;
    this.takeDamage(25, this.x, this.y, combatSystem, vfx, audio, camera, false);
  }

  die(combatSystem, vfx, particles, audio, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 3.0;
    if (camera) camera.shake(18, 1.2);
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audio, camera);
      combatSystem.triggerSlowMo(0.5, 0.1);
    }
    if (audio) audio.playBossDefeated ? audio.playBossDefeated() : null;
  }

  update(player, combatSystem, vfx, particles, audio, camera, dt) {
    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.sprite) this.sprite.update(dt, this);

    if (!this.introDone) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) this.introDone = true;
      return;
    }

    // Update abyssal chains
    for (let i = this.chains.length - 1; i >= 0; i--) {
      const c = this.chains[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.chains.splice(i, 1);
        continue;
      }
      if (Math.abs(player.x - c.x) < 18 && (player.y >= c.y - c.height && player.y <= c.y + 10) && !player.isInvulnerable) {
        player.respawn();
      }
    }

    // Update minions
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      m.update(player, combatSystem, vfx, particles, audio, camera, dt);
      if (m.isDead && m.y > this.y + 400) this.minions.splice(i, 1);
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

    // Movement
    if (dist > 55) {
      this.vx = this.facing * this.speed * (this.phase === 4 ? 1.4 : 1.0);
    } else {
      this.vx = 0;
    }
    this.x += this.vx * dt;

    // Attack routines
    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.phase === 4 ? 1.0 : 1.8;
      // Colossal Punch / Abyssal Claw
      if (vfx) vfx.triggerHitSparks(this.x + this.facing * 35, this.y - 30, '#c1121f');
      if (audio) audio.playSlash(2);
      if (dist < 56 && !player.isInvulnerable) {
        player.respawn();
      }
    }

    // Phase 2: Floor cracks into lava
    if (this.phase >= 2 && this.lavaCracks.length === 0) {
      for (let i = 0; i < 5; i++) {
        this.lavaCracks.push({ x: this.startX + (i - 2) * 60, y: this.y + 4 });
      }
    }

    // Phase 3: Giant chains eruption
    if (this.phase >= 3 && Math.random() < 0.02 && this.chains.length < 3) {
      this.chains.push({
        x: player.x + (Math.random() > 0.5 ? 20 : -20),
        y: this.y,
        height: 120,
        life: 1.4
      });
      if (audio) audio.playSoulChain ? audio.playSoulChain() : null;
    }

    // Phase 3: Summons minions
    if (this.phase >= 3 && Math.random() < 0.008 && this.minions.length < 2) {
      const imp = new FireImp(this.x + (Math.random() > 0.5 ? 60 : -60), this.y - 40);
      this.minions.push(imp);
    }
  }

  render(ctx, camera = { x: 0, y: 0 }) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    // Render lava floor cracks
    for (const c of this.lavaCracks) {
      const cx = Math.round(c.x - camera.x);
      const cy = Math.round(c.y - camera.y);
      ctx.save();
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#c1121f';
      ctx.shadowBlur = 8;
      ctx.fillRect(cx - 18, cy - 2, 36, 4);
      ctx.restore();
    }

    // Render abyssal chains
    for (const ch of this.chains) {
      const chx = Math.round(ch.x - camera.x);
      const chy = Math.round(ch.y - camera.y);
      ctx.save();
      ctx.strokeStyle = '#bb44ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(chx, chy);
      ctx.lineTo(chx, chy - ch.height);
      ctx.stroke();
      ctx.restore();
    }

    // Render minions
    for (const m of this.minions) {
      m.render(ctx, camera);
    }

    // Render with custom Sorcerer Boss Sprite
    const drewSprite = this.sprite && this.sprite.render(ctx, rx, ry, this.facing, this.hitFlashTimer, 0.55);
    if (drewSprite) {
      // Draw Phase 4 Astral Barrier / Shield over sprite if phase 4
      if (this.phase === 4) {
        ctx.save();
        ctx.strokeStyle = '#bb44ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#c1121f';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(rx, ry - 38, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.translate(rx, ry);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Phase 4 Astral Barrier / Shield
    if (this.phase === 4) {
      ctx.save();
      ctx.strokeStyle = '#bb44ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#c1121f';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, -38, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.scale(this.facing, 1);

    // Colossal Torso
    ctx.fillStyle = '#10030a';
    ctx.fillRect(-18, -62, 36, 46);
    ctx.strokeStyle = '#c1121f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -62, 36, 46);

    // Molten Abyss Core
    ctx.fillStyle = this.phase === 4 ? '#bb44ff' : '#ff6b35';
    ctx.beginPath();
    ctx.arc(0, -42, 10, 0, Math.PI * 2);
    ctx.fill();

    // Giant Demonic Crown
    ctx.fillStyle = '#080105';
    ctx.beginPath();
    ctx.arc(0, -70, 14, 0, Math.PI * 2);
    ctx.fill();

    // 6 Horn Spikes
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -78);
    ctx.lineTo(-24, -98);
    ctx.moveTo(10, -78);
    ctx.lineTo(24, -98);
    ctx.stroke();

    // Burning Eye Fissures
    ctx.fillStyle = this.phase === 4 ? '#ffffff' : '#c1121f';
    ctx.fillRect(2, -72, 6, 4);

    // Colossal Fists
    ctx.fillStyle = '#10030a';
    ctx.fillRect(12, -40, 16, 16);

    // Sturdy Legs
    ctx.strokeStyle = '#080105';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(-12, 0);
    ctx.moveTo(10, -16);
    ctx.lineTo(12, 0);
    ctx.stroke();

    ctx.restore();

    if (this.introDone && !this.isDead) {
      this.renderBossBar(ctx);
    }
  }

  renderBossBar(ctx) {
    const barW = 280;
    const barH = 12;
    const barX = (640 - barW) / 2;
    const barY = 30;

    const hpRatio = Math.max(0, this.hp / this.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 18, 0.9)';
    ctx.fillRect(barX - 2, barY - 16, barW + 4, barH + 20);
    ctx.strokeStyle = this.phase === 4 ? '#bb44ff' : '#c1121f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    const grad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
    grad.addColorStop(0, '#c1121f');
    grad.addColorStop(0.5, '#ff6b35');
    grad.addColorStop(1, '#bb44ff');
    ctx.fillStyle = grad;
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const phaseText = this.phase === 4 ? ' [PHASE 4: ASTRAL ATTACKS ONLY]' : '';
    ctx.fillText(`${this.name} — ${this.title}${phaseText}`, 320, barY - 4);
    ctx.restore();
  }
}
