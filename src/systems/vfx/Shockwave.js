export class Shockwave {
  constructor(x, y, maxRadius = 140, duration = 0.5, color = '#ff8fab', isAura = false) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.lifetime = duration;
    this.color = color;
    this.isAura = isAura;
    this.dead = false;
  }

  update(dt) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }
    const progress = 1 - (this.lifetime / this.duration);
    // Easing out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    this.radius = 4 + (this.maxRadius - 4) * ease;
  }

  render(ctx) {
    if (this.dead) return;

    const progress = 1 - (this.lifetime / this.duration);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.lineWidth = Math.max(1, (1 - progress) * 6);

    if (this.isAura) {
      // Chromatic aberration simulation (Crimson + Violet rings slightly offset)
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = '#ff3366'; // Crimson
      ctx.beginPath();
      ctx.arc(this.x - 2, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#a288e3'; // Violet
      ctx.beginPath();
      ctx.arc(this.x + 2, this.y, this.radius * 0.98, 0, Math.PI * 2);
      ctx.stroke();

      // Main radiant ring
      ctx.globalAlpha = alpha * 0.95;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
