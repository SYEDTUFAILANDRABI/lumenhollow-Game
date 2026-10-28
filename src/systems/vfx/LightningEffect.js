export class LightningEffect {
  constructor(startX, startY, targetX, targetY, options = {}) {
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.lifetime = options.lifetime || 0.22;
    this.maxLife = this.lifetime;
    this.segments = [];
    this.dead = false;
    this.colorCore = options.colorCore || '#05040a'; // Black obsidian core
    this.colorGlow = options.colorGlow || '#ff2255'; // Crimson fringe
    this.lineWidth = options.lineWidth || 2.5;

    this.generateSegments();
  }

  generateSegments() {
    this.segments = [];
    this.subdivide(this.startX, this.startY, this.targetX, this.targetY, 4, 35);
  }

  subdivide(x1, y1, x2, y2, depth, maxDisplacement) {
    if (depth <= 0) {
      this.segments.push({ x1, y1, x2, y2 });
      return;
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      this.segments.push({ x1, y1, x2, y2 });
      return;
    }

    // Normal vector displacement
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const disp = (Math.random() - 0.5) * maxDisplacement;

    const nx = midX + perpX * disp;
    const ny = midY + perpY * disp;

    this.subdivide(x1, y1, nx, ny, depth - 1, maxDisplacement * 0.55);
    this.subdivide(nx, ny, x2, y2, depth - 1, maxDisplacement * 0.55);

    // Branching probability for anime-style crawler bolts
    if (depth >= 2 && Math.random() < 0.45) {
      const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
      const branchLen = dist * (0.35 + Math.random() * 0.35);
      const bx = nx + Math.cos(branchAngle) * branchLen;
      const by = ny + Math.sin(branchAngle) * branchLen;
      this.subdivide(nx, ny, bx, by, depth - 2, maxDisplacement * 0.4);
    }
  }

  update(dt) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
    }
  }

  render(ctx) {
    if (this.dead || this.segments.length === 0) return;

    const progress = this.lifetime / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, progress * 1.5));

    // Outer crimson glow pass
    ctx.strokeStyle = this.colorGlow;
    ctx.lineWidth = this.lineWidth + 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    for (const s of this.segments) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }
    ctx.stroke();

    // Inner dark/obsidian lightning core
    ctx.strokeStyle = this.colorCore;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    for (const s of this.segments) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }
    ctx.stroke();

    ctx.restore();
  }
}
