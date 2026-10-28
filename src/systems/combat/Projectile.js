export class Projectile {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = options.radius || 5;
    this.damage = options.damage || 20;
    this.lifetime = options.lifetime || 1.2;
    this.isEnemy = options.isEnemy || false;
    this.pierce = options.pierce !== undefined ? options.pierce : true;
    this.color = options.color || '#a288e3';
    this.coreColor = options.coreColor || '#ffffff';
    this.trail = [];
    this.maxTrail = 8;
    this.hitEntities = new Set();
    this.dead = false;
  }

  update(dt, particleSystem) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    this.trail.unshift({ x: this.x, y: this.y, life: 1 });
    if (this.trail.length > this.maxTrail) {
      this.trail.pop();
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (particleSystem && Math.random() < 0.4) {
      particleSystem.emitDarkDissipate(this.x, this.y);
    }
  }

  render(ctx) {
    if (this.dead) return;

    ctx.save();

    // Ribbon trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.radius * 1.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.45;
      ctx.stroke();
    }

    // Outer glow aura
    const grad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 2.2);
    grad.addColorStop(0, this.coreColor);
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, 'rgba(30, 20, 50, 0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
