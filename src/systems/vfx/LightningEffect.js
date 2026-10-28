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
    const dx = this.targetX - this.startX;
    const dy = this.targetY - this.startY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 14));

    let prevX = this.startX;
    let prevY = this.startY;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      let nx = this.startX + dx * t;
      let ny = this.startY + dy * t;

      if (i < steps) {
        // Normal vector displacement
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const jitter = (Math.random() - 0.5) * 18;
        nx += perpX * jitter;
        ny += perpY * jitter;
      }

      this.segments.push({ x1: prevX, y1: prevY, x2: nx, y2: ny });
      prevX = nx;
      prevY = ny;
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
