import { Shockwave } from './Shockwave.js';
import { LightningEffect } from './LightningEffect.js';
import { DamageNumbers } from './DamageNumbers.js';

export class VFXManager {
  constructor() {
    this.afterimages = [];
    this.groundCracks = [];
    this.slashArcs = [];
    this.shockwaves = [];
    this.lightningArcs = [];
    this.damageNumbers = new DamageNumbers();

    // Screen flash
    this.flashColor = '#ffffff';
    this.flashAlpha = 0;
    this.isMonochrome = false;
    this.monochromeTimer = 0;

    // Zoom punch
    this.zoomScale = 1.0;
    this.targetZoom = 1.0;
  }

  triggerFlash(color = '#ffffff', duration = 0.12, monochrome = false) {
    this.flashColor = color;
    this.flashAlpha = 0.85;
    if (monochrome) {
      this.isMonochrome = true;
      this.monochromeTimer = 0.16;
    }
  }

  triggerZoomPunch(scale = 1.12, duration = 0.15) {
    this.zoomScale = scale;
    this.targetZoom = 1.0;
  }

  addAfterimage(x, y, facing, drawCallback, color = 'rgba(162, 136, 227, 0.45)', lifetime = 0.28) {
    this.afterimages.push({
      x, y, facing,
      draw: drawCallback,
      color,
      lifetime,
      maxLife: lifetime
    });
  }

  addSlashArc(x, y, facing, strikeIndex = 0, isEclipse = false) {
    this.slashArcs.push({
      x, y, facing,
      strikeIndex,
      isEclipse,
      lifetime: 0.18,
      maxLife: 0.18,
      scale: isEclipse ? 1.4 : 1.0
    });
  }

  addGroundCrack(x, y, radius = 35, duration = 2.5) {
    // Generate crack lines
    const rays = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + (Math.random() - 0.5) * 0.4;
      const len = radius * (0.6 + Math.random() * 0.5);
      rays.push({
        x2: Math.cos(angle) * len,
        y2: Math.sin(angle) * (len * 0.4) // perspective foreshortening
      });
    }

    this.groundCracks.push({
      x, y, rays,
      lifetime: duration,
      maxLife: duration
    });
  }

  addShockwave(x, y, radius = 120, duration = 0.45, color = '#ff8fab', isAura = false) {
    this.shockwaves.push(new Shockwave(x, y, radius, duration, color, isAura));
  }

  addLightningBurst(centerX, centerY, count = 7, radius = 180) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = radius * (0.5 + Math.random() * 0.5);
      const tx = centerX + Math.cos(angle) * dist;
      const ty = centerY + Math.sin(angle) * dist;

      this.lightningArcs.push(new LightningEffect(centerX, centerY, tx, ty, {
        lifetime: 0.28,
        colorCore: '#05040a',
        colorGlow: Math.random() > 0.4 ? '#ff2255' : '#8822cc',
        lineWidth: 3
      }));
    }
  }

  update(dt) {
    // Zoom recovery
    this.zoomScale += (this.targetZoom - this.zoomScale) * 12 * dt;

    // Flash fade
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - 6 * dt);
    }
    if (this.monochromeTimer > 0) {
      this.monochromeTimer -= dt;
      if (this.monochromeTimer <= 0) {
        this.isMonochrome = false;
      }
    }

    // Afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const ai = this.afterimages[i];
      ai.lifetime -= dt;
      if (ai.lifetime <= 0) this.afterimages.splice(i, 1);
    }

    // Slash arcs
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const arc = this.slashArcs[i];
      arc.lifetime -= dt;
      if (arc.lifetime <= 0) this.slashArcs.splice(i, 1);
    }

    // Ground cracks
    for (let i = this.groundCracks.length - 1; i >= 0; i--) {
      const gc = this.groundCracks[i];
      gc.lifetime -= dt;
      if (gc.lifetime <= 0) this.groundCracks.splice(i, 1);
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.update(dt);
      if (sw.dead) this.shockwaves.splice(i, 1);
    }

    // Lightning arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const la = this.lightningArcs[i];
      la.update(dt);
      if (la.dead) this.lightningArcs.splice(i, 1);
    }

    // Damage numbers
    this.damageNumbers.update(dt);
  }

  renderWorld(ctx) {
    // 1. Ground cracks
    for (const gc of this.groundCracks) {
      const progress = gc.lifetime / gc.maxLife;
      ctx.save();
      ctx.translate(gc.x, gc.y);
      ctx.globalAlpha = Math.min(1, progress * 1.5) * 0.85;
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const r of gc.rays) {
        ctx.moveTo(0, 0);
        ctx.lineTo(r.x2, r.y2);
      }
      ctx.stroke();

      ctx.strokeStyle = '#090814';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Ghost Afterimages
    for (const ai of this.afterimages) {
      const alpha = (ai.lifetime / ai.maxLife) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (ai.draw) {
        ai.draw(ctx, ai.x, ai.y, ai.facing, ai.color);
      }
      ctx.restore();
    }

    // 3. Slash Arcs
    for (const arc of this.slashArcs) {
      const p = 1 - (arc.lifetime / arc.maxLife);
      ctx.save();
      ctx.translate(arc.x, arc.y);
      ctx.scale(arc.facing * arc.scale, arc.scale);

      ctx.globalAlpha = Math.max(0, 1 - p * 0.9);
      ctx.lineWidth = arc.isEclipse ? 6 : 4;
      ctx.lineCap = 'round';

      // Colors based on strike combo index
      let glowCol = '#ffd98a';
      let coreCol = '#ffffff';
      if (arc.isEclipse) {
        glowCol = '#ff2255';
        coreCol = '#ffd98a';
      } else if (arc.strikeIndex === 1) {
        glowCol = '#7be0ad';
      } else if (arc.strikeIndex === 2) {
        glowCol = '#ff8fab';
      }

      ctx.strokeStyle = glowCol;
      ctx.beginPath();
      // Crescent arc sweep
      const startAngle = -Math.PI * 0.45;
      const endAngle = Math.PI * 0.45;
      ctx.arc(8, 0, 24 + p * 6, startAngle, endAngle);
      ctx.stroke();

      ctx.strokeStyle = coreCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 4. Shockwaves
    for (const sw of this.shockwaves) {
      sw.render(ctx);
    }

    // 5. Lightning Arcs
    for (const la of this.lightningArcs) {
      la.render(ctx);
    }

    // 6. Damage Numbers
    this.damageNumbers.render(ctx, true);
  }

  renderScreenOverlay(ctx, width, height, flashIntensity = 1.0) {
    if (this.flashAlpha > 0 && flashIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha * flashIntensity;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}
