import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

export class ParallaxBackground {
  constructor() {
    this.stars = [];
    this.mountains = [];
    this.midTrees = [];
    this.nearTrees = [];

    this.generateStarfield();
    this.generateMountainPeaks();
    this.generateTrees();
  }

  generateStarfield() {
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH * 2,
        y: Math.random() * (GAME_HEIGHT * 0.65),
        radius: Math.random() * 1.5 + 0.5,
        twinkleSpeed: Math.random() * 3 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
        isColor: Math.random() > 0.75
      });
    }
  }

  generateMountainPeaks() {
    let curX = 0;
    while (curX < GAME_WIDTH * 4) {
      const peakW = Math.random() * 140 + 80;
      const peakH = Math.random() * 110 + 70;
      this.mountains.push({ x: curX, width: peakW, height: peakH });
      curX += peakW * 0.75;
    }
  }

  generateTrees() {
    // Mid trees
    let curX = 0;
    while (curX < GAME_WIDTH * 4) {
      const w = Math.random() * 28 + 18;
      const h = Math.random() * 90 + 50;
      this.midTrees.push({ x: curX, width: w, height: h });
      curX += Math.random() * 24 + 16;
    }

    // Near trees
    curX = 0;
    while (curX < GAME_WIDTH * 4) {
      const w = Math.random() * 40 + 26;
      const h = Math.random() * 120 + 80;
      this.nearTrees.push({ x: curX, width: w, height: h });
      curX += Math.random() * 45 + 30;
    }
  }

  render(ctx, camera, time = 0, moonProgress = 0) {
    const rx = camera.getRenderX();
    const ry = camera.getRenderY();

    // 1. Celestial Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#0a0817');
    skyGrad.addColorStop(0.45, '#171233');
    skyGrad.addColorStop(0.85, '#261b45');
    skyGrad.addColorStop(1, '#342152');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Distant Moon / Moon Remnants (Layer 1: parallax 0.01)
    ctx.save();
    const moonScreenX = (GAME_WIDTH * 0.75) - (rx * 0.015);
    const moonScreenY = 70 - (ry * 0.015);

    // Subtle moon glow
    const moonGlow = ctx.createRadialGradient(moonScreenX, moonScreenY, 10, moonScreenX, moonScreenY, 70);
    moonGlow.addColorStop(0, 'rgba(244, 241, 255, 0.25)');
    moonGlow.addColorStop(0.5, 'rgba(123, 224, 173, 0.08)');
    moonGlow.addColorStop(1, 'rgba(42, 157, 143, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonScreenX, moonScreenY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Shattered moon fragments or full reformed moon
    if (moonProgress >= 1) {
      // Radiant reformed moon
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#f4f1ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(moonScreenX, moonScreenY, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Shattered fragments
      ctx.fillStyle = 'rgba(244, 241, 255, 0.8)';
      ctx.shadowColor = '#7be0ad';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(moonScreenX - 6, moonScreenY - 4, 12, 0.4, Math.PI * 1.3);
      ctx.arc(moonScreenX + 8, moonScreenY + 6, 6, 1.2, Math.PI * 1.8);
      ctx.arc(moonScreenX + 10, moonScreenY - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Layer 1: Twinkling Stars (parallax 0.03)
    ctx.save();
    for (const star of this.stars) {
      const sx = ((star.x - rx * 0.03) % (GAME_WIDTH * 1.5) + (GAME_WIDTH * 1.5)) % (GAME_WIDTH * 1.5) - 20;
      const sy = star.y - ry * 0.02;
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.4 + 0.6;

      ctx.globalAlpha = twinkle;
      ctx.fillStyle = star.isColor ? '#ffd98a' : '#f4f1ff';
      ctx.beginPath();
      ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Layer 2: Distant Mountains (parallax 0.12)
    ctx.save();
    ctx.fillStyle = '#181230';
    for (const m of this.mountains) {
      const mx = ((m.x - rx * 0.12) % (GAME_WIDTH * 3) + (GAME_WIDTH * 3)) % (GAME_WIDTH * 3) - 100;
      const my = GAME_HEIGHT - 60 - (ry * 0.06);

      ctx.beginPath();
      ctx.moveTo(mx, GAME_HEIGHT);
      ctx.lineTo(mx + m.width * 0.45, my - m.height);
      ctx.lineTo(mx + m.width, GAME_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 5. Layer 3: Mid-Ground Pine Silhouettes (parallax 0.32)
    ctx.save();
    ctx.fillStyle = '#140e29';
    for (const t of this.midTrees) {
      const tx = ((t.x - rx * 0.32) % (GAME_WIDTH * 3) + (GAME_WIDTH * 3)) % (GAME_WIDTH * 3) - 50;
      const ty = GAME_HEIGHT - 35 - (ry * 0.14);

      // Procedural pine tree silhouette
      ctx.beginPath();
      ctx.moveTo(tx + t.width / 2, ty - t.height);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx + t.width, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 6. Layer 4: Near Forest Silhouettes (parallax 0.60)
    ctx.save();
    ctx.fillStyle = '#0f0a20';
    for (const nt of this.nearTrees) {
      const ntx = ((nt.x - rx * 0.60) % (GAME_WIDTH * 3) + (GAME_WIDTH * 3)) % (GAME_WIDTH * 3) - 50;
      const nty = GAME_HEIGHT - 10 - (ry * 0.28);

      ctx.beginPath();
      ctx.moveTo(ntx + nt.width / 2, nty - nt.height);
      ctx.lineTo(ntx - 4, nty);
      ctx.lineTo(ntx + nt.width + 4, nty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
