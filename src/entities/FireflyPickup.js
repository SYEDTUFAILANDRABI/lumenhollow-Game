export class FireflyPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.collected = false;
    this.timer = Math.random() * 20;
    this.lightRadius = 45;
  }

  update(player, particleSystem, audioSystem, dt) {
    if (this.collected) return;

    this.timer += dt;
    this.x = this.baseX + Math.sin(this.timer * 3.2) * 5;
    this.y = this.baseY + Math.cos(this.timer * 2.5) * 5;

    // Check distance to player
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const dist = Math.hypot(pcx - this.x, pcy - this.y);

    if (dist < 18) {
      this.collected = true;
      player.rechargeEnergy(35);
      if (audioSystem) audioSystem.playFireflyAbsorb();
      if (particleSystem) {
        particleSystem.emitFireflyAbsorb(this.x, this.y);
      }
    }
  }

  render(ctx) {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
    glow.addColorStop(0, 'rgba(255, 235, 150, 0.9)');
    glow.addColorStop(0.5, 'rgba(255, 143, 171, 0.4)');
    glow.addColorStop(1, 'rgba(255, 143, 171, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
