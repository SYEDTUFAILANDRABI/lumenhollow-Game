export class DamageNumbers {
  constructor() {
    this.numbers = [];
  }

  add(x, y, value, isCrit = false, isParry = false) {
    this.numbers.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y - 6,
      vx: (Math.random() - 0.5) * 20,
      vy: -60 - Math.random() * 20,
      text: isParry ? 'PARRY!' : Math.round(value).toString(),
      isCrit,
      isParry,
      lifetime: 0.75,
      maxLife: 0.75,
      scale: isCrit || isParry ? 1.3 : 1.0
    });
  }

  update(dt) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      num.lifetime -= dt;
      if (num.lifetime <= 0) {
        this.numbers.splice(i, 1);
        continue;
      }
      num.x += num.vx * dt;
      num.y += num.vy * dt;
      num.vy += 80 * dt; // slight downward gravity easing
    }
  }

  render(ctx, enabled = true) {
    if (!enabled || this.numbers.length === 0) return;

    ctx.save();
    for (const num of this.numbers) {
      const alpha = Math.min(1, num.lifetime / (num.maxLife * 0.4));
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.round(10 * num.scale)}px -apple-system, sans-serif`;

      if (num.isParry) {
        ctx.fillStyle = '#ffd98a';
        ctx.shadowColor = '#ffb347';
        ctx.shadowBlur = 6;
      } else if (num.isCrit) {
        ctx.fillStyle = '#ff8fab';
        ctx.shadowColor = '#ff8fab';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#f4f1ff';
        ctx.shadowColor = '#090814';
        ctx.shadowBlur = 4;
      }

      ctx.fillText(num.text, num.x, num.y);
    }
    ctx.restore();
  }

  clear() {
    this.numbers = [];
  }
}
