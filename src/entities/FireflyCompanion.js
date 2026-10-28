export class FireflyCompanion {
  constructor(startX = 100, startY = 100) {
    this.x = startX - 16;
    this.y = startY - 14;
    this.vx = 0;
    this.vy = 0;
    this.targetX = startX;
    this.targetY = startY;

    this.timer = Math.random() * 10;
    this.wingAngle = 0;
    this.lightRadius = 38;
    this.sparkleTimer = 0;
  }

  update(player, particleSystem, dt) {
    this.timer += dt;

    // Follow target hovering behind/above Lumi depending on facing
    let hoverOffsetX = player.facing === 1 ? -16 : 16;
    let hoverOffsetY = -16;

    if (player.isGliding) {
      // Hover directly above Lumi like an ethereal parachute / beacon
      hoverOffsetX = 0;
      hoverOffsetY = -22;
      this.lightRadius = 64;
    } else {
      this.lightRadius = 38;
    }

    // Gentle floating figure-8 flutter
    const floatX = Math.sin(this.timer * 2.8) * 8;
    const floatY = Math.cos(this.timer * 3.6) * 6;

    this.targetX = player.x + hoverOffsetX + floatX;
    this.targetY = player.y + hoverOffsetY + floatY;

    // Smooth spring/lag follow
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    const springStrength = player.isGliding ? 12 : 6.5;
    this.vx += dx * springStrength * dt;
    this.vy += dy * springStrength * dt;

    // Damping
    this.vx *= Math.pow(0.85, dt * 60);
    this.vy *= Math.pow(0.85, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rapid wing flap
    this.wingAngle = Math.sin(this.timer * (player.isGliding ? 42 : 28));

    // Subtle spark trail
    this.sparkleTimer += dt;
    const sparkInterval = player.isGliding ? 0.08 : 0.22;
    if (this.sparkleTimer > sparkInterval && particleSystem) {
      this.sparkleTimer = 0;
      particleSystem.emitFireflyGlint(this.x, this.y);
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Outer soft aura
    const auraGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
    auraGrad.addColorStop(0, 'rgba(255, 235, 150, 0.9)');
    auraGrad.addColorStop(0.5, 'rgba(123, 224, 173, 0.4)');
    auraGrad.addColorStop(1, 'rgba(123, 224, 173, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Translucent wings fluttering
    ctx.fillStyle = 'rgba(244, 241, 255, 0.65)';
    ctx.save();
    ctx.scale(1, this.wingAngle);
    ctx.beginPath();
    ctx.ellipse(-2, -3, 3, 1.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(2, -3, 3, 1.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Firefly bright body core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
