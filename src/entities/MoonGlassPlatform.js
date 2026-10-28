export class MoonGlassPlatform {
  constructor(x, y, width = 40, height = 12) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.illumination = 0; // 0 = invisible/intangible, 1 = solid crystal
    this.glowTimer = Math.random() * 10;
  }

  update(lightRadius, lightPos, dt) {
    this.glowTimer += dt;

    // Check distance from light center to platform center
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dx = lightPos.x - centerX;
    const dy = lightPos.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Target illumination based on whether platform is in light radius
    const isLit = dist < (lightRadius + 20);
    const targetIllum = isLit ? 1 : 0;
    
    // Smooth transition
    const speed = isLit ? 6.0 : 2.5;
    this.illumination += (targetIllum - this.illumination) * speed * dt;
    this.illumination = Math.max(0, Math.min(1, this.illumination));
  }

  isSolid() {
    return this.illumination > 0.45;
  }

  render(ctx) {
    if (this.illumination <= 0.05) {
      // Very faint ghostly guide dots so observant players can anticipate them
      ctx.fillStyle = 'rgba(123, 224, 173, 0.08)';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      return;
    }

    ctx.save();
    ctx.globalAlpha = this.illumination;

    // Outer glass glow
    ctx.shadowColor = '#7be0ad';
    ctx.shadowBlur = 8 * this.illumination;

    // Base translucent crystal fill
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, 'rgba(244, 241, 255, 0.85)');
    grad.addColorStop(0.3, 'rgba(123, 224, 173, 0.6)');
    grad.addColorStop(1, 'rgba(42, 157, 143, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Top luminous crystalline highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x, this.y, this.width, 2);

    // Facet diagonal etchings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let lx = this.x + 8; lx < this.x + this.width; lx += 14) {
      ctx.moveTo(lx, this.y + 2);
      ctx.lineTo(lx - 6, this.y + this.height - 2);
    }
    ctx.stroke();

    // Shimmering sparkle point
    const shimmerX = this.x + ((Math.sin(this.glowTimer * 2) + 1) * 0.5) * (this.width - 6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(shimmerX + 3, this.y + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
