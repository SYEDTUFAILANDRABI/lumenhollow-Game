export class MoonShard {
  constructor(x, y, index = 0) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.index = index;
    this.collected = false;
    this.timer = Math.random() * 10;
    this.rotation = 0;
    this.lightRadius = 85;
  }

  update(player, particleSystem, audioSystem, onCollect, dt) {
    if (this.collected) return;

    this.timer += dt;
    this.rotation += 1.8 * dt;
    this.y = this.baseY + Math.sin(this.timer * 3) * 5;

    // Check collision with player
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const dist = Math.hypot(pcx - (this.x + 8), pcy - (this.y + 8));

    if (dist < 18) {
      this.collected = true;
      if (audioSystem) audioSystem.playShardPickup();
      if (particleSystem) {
        particleSystem.emitShardPickupBurst(this.x + 8, this.y + 8);
      }
      if (onCollect) {
        onCollect(this.index);
      }
    }

    // Sparkle trail while idling
    if (particleSystem && Math.random() < 0.25) {
      particleSystem.emitShardGlint(this.x + 8, this.y + 8);
    }
  }

  render(ctx) {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x + 8, this.y + 8);

    // Outer moon aura glow
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glow.addColorStop(0.4, 'rgba(123, 224, 173, 0.5)');
    glow.addColorStop(1, 'rgba(123, 224, 173, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Rotated 3D diamond shard
    const rotScale = Math.cos(this.rotation);
    ctx.scale(rotScale, 1);

    ctx.shadowColor = '#f4f1ff';
    ctx.shadowBlur = 10;

    // Crystal facet 1
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    // Crystal facet 2 (shaded)
    ctx.fillStyle = '#7be0ad';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();

    // Inner bright center line
    ctx.strokeStyle = '#f4f1ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.stroke();

    ctx.restore();
  }
}
