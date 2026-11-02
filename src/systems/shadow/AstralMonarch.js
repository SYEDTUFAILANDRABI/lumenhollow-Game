// AstralMonarch.js - Giant Translucent Shadow Monarch Avatar
import { COMBAT } from '../combat/CombatConstants.js';

export class AstralMonarch {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.animTimer = 0;
    this.strikeTimer = 0;
    this.strikeType = 'IDLE'; // 'SLASH', 'PUNCH', 'SLAM'
    this.activeShockwaves = [];
  }

  update(player, dt, vfx, audio, camera, enemies, boss) {
    this.animTimer += dt;

    // Smooth spring-lag following behind Lumi
    const targetX = player.x - player.facing * 18;
    const targetY = player.y - 20;

    const springStrength = 14;
    const damping = 0.82;

    this.vx = (this.vx + (targetX - this.x) * springStrength * dt) * damping;
    this.vy = (this.vy + (targetY - this.y) * springStrength * dt) * damping;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.facing = player.facing;

    // Trigger mirrored attacks when player slashes or plunges
    if (player.isSlashing && this.strikeTimer <= 0) {
      this.strikeTimer = 0.35;
      this.strikeType = 'SLASH';
      if (camera) camera.shake(5, 0.2);
      this.checkGiantHit(player, enemies, boss, 45, 65, vfx, audio, camera);
    } else if (player.isPlunging && this.strikeTimer <= 0) {
      this.strikeTimer = 0.45;
      this.strikeType = 'SLAM';
      this.checkGiantHit(player, enemies, boss, 65, 80, vfx, audio, camera);
    }

    if (this.strikeTimer > 0) {
      this.strikeTimer -= dt;
      if (this.strikeTimer <= 0) this.strikeType = 'IDLE';
    }
  }

  checkGiantHit(player, enemies, boss, damage, radius, vfx, audio, camera) {
    const hitX = this.x + this.facing * 35;
    const hitY = this.y - 30;

    const all = [...enemies];
    if (boss && !boss.isDead) all.push(boss);

    for (const t of all) {
      if (t.isDead) continue;
      const dist = Math.hypot(t.x - hitX, t.y - hitY);
      if (dist < radius) {
        if (t.takeDamage) {
          t.takeDamage(damage, hitX, hitY, null, vfx, audio, camera, false, false);
        }
        if (vfx) vfx.triggerHitSparks(t.x, t.y - 15, '#bb44ff');
      }
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(this.facing * 1.5, 1.5); // Giant 1.5x scale

    // Translucent shadow layering
    ctx.globalAlpha = 0.65;

    // Dark shadow aura silhouette
    const floatOffset = Math.sin(this.animTimer * 2.5) * 4;

    // Shoulders & Chest (Layered dark polygons)
    ctx.fillStyle = 'rgba(18, 8, 30, 0.9)';
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-22, -65 + floatOffset);
    ctx.lineTo(22, -65 + floatOffset);
    ctx.lineTo(16, -20 + floatOffset);
    ctx.lineTo(-16, -20 + floatOffset);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown of Shadow Fire
    ctx.fillStyle = 'rgba(30, 10, 50, 0.95)';
    ctx.beginPath();
    ctx.arc(0, -78 + floatOffset, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spire Crown Horns
    ctx.strokeStyle = '#bb44ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, -88 + floatOffset);
    ctx.lineTo(-18, -106 + floatOffset);
    ctx.moveTo(10, -88 + floatOffset);
    ctx.lineTo(18, -106 + floatOffset);
    ctx.moveTo(0, -90 + floatOffset);
    ctx.lineTo(0, -112 + floatOffset);
    ctx.stroke();

    // Burning Violet Monarch Gaze
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#bb44ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(2, -80 + floatOffset, 5, 3);
    ctx.shadowBlur = 0;

    // Giant Shadow Blade / Fist
    if (this.strikeType === 'SLASH') {
      ctx.strokeStyle = '#bb44ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(28, -50 + floatOffset, 36, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    } else if (this.strikeType === 'SLAM') {
      ctx.fillStyle = '#bb44ff';
      ctx.beginPath();
      ctx.arc(20, -10 + floatOffset, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Idle spectral hands
      ctx.strokeStyle = '#bb44ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-20, -50 + floatOffset);
      ctx.lineTo(-26, -30 + floatOffset);
      ctx.moveTo(20, -50 + floatOffset);
      ctx.lineTo(26, -30 + floatOffset);
      ctx.stroke();
    }

    ctx.restore();
  }
}
