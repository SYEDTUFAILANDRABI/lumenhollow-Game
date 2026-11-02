// SoulMarker.js - 5-second interactable soul extraction target
import { COMBAT } from '../../systems/combat/CombatConstants.js';

export class SoulMarker {
  constructor(x, y, enemyType, tier, name) {
    this.x = x;
    this.y = y;
    this.enemyType = enemyType;
    this.tier = tier; // 'SKELETON', 'DEMON', 'DEMON_LORD', 'ARCH_DEMON'
    this.name = name || 'Shadow Essence';
    this.lifetime = COMBAT.SHADOW_ARMY.SOUL_MARKER_LIFETIME;
    this.maxLifetime = COMBAT.SHADOW_ARMY.SOUL_MARKER_LIFETIME;
    this.dead = false;
    this.pulse = 0;
    this.isExtracting = false;
    this.extractProgress = 0; // 0 to 1
  }

  update(dt, player, particles) {
    this.pulse += dt * 3.5;
    if (!this.isExtracting) {
      this.lifetime -= dt;
      if (this.lifetime <= 0) {
        this.dead = true;
        return;
      }
    } else {
      this.extractProgress += dt * 1.6; // ~0.65s ritual duration
      if (this.extractProgress >= 1.0) {
        this.dead = true;
      }
    }

    // Emit gentle upward soul wisps
    if (particles && Math.random() < 0.25) {
      particles.emitAuraChargeParticles(this.x, this.y, 0.4);
    }
  }

  render(ctx, camera) {
    const rx = Math.round(this.x - camera.x);
    const ry = Math.round(this.y - camera.y);

    const fade = Math.min(1, this.lifetime / 0.8);
    ctx.save();
    ctx.globalAlpha = fade;

    // Glowing ground circle
    const glowRadius = 14 + Math.sin(this.pulse) * 3;
    const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, glowRadius);
    grad.addColorStop(0, 'rgba(187, 68, 255, 0.7)');
    grad.addColorStop(0.5, 'rgba(110, 40, 180, 0.35)');
    grad.addColorStop(1, 'rgba(30, 10, 60, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Floating soul core
    const floatY = ry - 10 + Math.sin(this.pulse * 1.2) * 4;
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#bb44ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(rx, floatY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ghostly crescent rings
    ctx.strokeStyle = 'rgba(215, 140, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(rx, floatY, 8, 4, Math.sin(this.pulse) * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Ritual extraction tendrils if actively extracting
    if (this.isExtracting) {
      const p = this.extractProgress;
      ctx.strokeStyle = '#bb44ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + p * 6;
        const dist = 24 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(angle) * dist, floatY + Math.sin(angle) * dist);
        ctx.lineTo(rx, floatY);
        ctx.stroke();
      }
    } else {
      // Interaction prompt
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[F] EXTRACT', rx, floatY - 14);
      ctx.fillStyle = 'rgba(244, 241, 255, 0.65)';
      ctx.font = '8px -apple-system, sans-serif';
      ctx.fillText(this.name, rx, floatY - 6);
    }

    ctx.restore();
  }
}
