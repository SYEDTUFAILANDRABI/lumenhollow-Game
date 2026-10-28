import { LANTERN } from '../core/Constants.js';

export class Shrine {
  constructor(x, y, id = 0) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.width = 24;
    this.height = 36;
    this.isLit = false;
    this.timer = Math.random() * 10;
    this.flameScale = 0;
    this.lightRadius = 110;
  }

  update(player, particleSystem, audioSystem, dt) {
    this.timer += dt;

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const sx = this.x + this.width / 2;
    const sy = this.y + this.height / 2;
    const dist = Math.hypot(px - sx, py - sy);

    // Trigger activation
    if (!this.isLit && dist < 32) {
      this.isLit = true;
      player.setSpawn(this.x + 6, this.y + this.height - player.height);
      if (audioSystem) audioSystem.playShrineActivate();
      if (particleSystem) {
        particleSystem.emitShrineBurst(sx, this.y + 8);
      }
    }

    if (this.isLit) {
      this.flameScale += (1 - this.flameScale) * 6 * dt;

      // When player is near a lit shrine, boost lantern recharge
      if (dist < 48) {
        player.rechargeEnergy(LANTERN.BOOST_RECHARGE * dt);
      }

      // Sparkles from lit shrine flame
      if (particleSystem && Math.random() < 0.2) {
        particleSystem.emitShrineMote(sx, this.y + 8);
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Stone base
    ctx.fillStyle = '#1e1c33';
    ctx.fillRect(2, 28, 20, 8);
    ctx.fillStyle = '#2d284a';
    ctx.fillRect(4, 16, 16, 12);
    ctx.fillStyle = '#39335e';
    ctx.fillRect(6, 12, 12, 4);

    // Brazier bowl
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(3, 12);
    ctx.lineTo(21, 12);
    ctx.lineTo(17, 16);
    ctx.lineTo(7, 16);
    ctx.closePath();
    ctx.fill();

    // Ancient rune glyph on pillar
    ctx.fillStyle = this.isLit ? '#7be0ad' : '#4d4675';
    ctx.fillRect(11, 20, 2, 5);
    ctx.fillRect(9, 22, 6, 1.5);

    // Active sacred flame
    if (this.flameScale > 0.05) {
      ctx.save();
      ctx.translate(12, 11);
      ctx.scale(this.flameScale, this.flameScale);

      // Flickering flame height
      const flicker = Math.sin(this.timer * 8) * 2;
      const flameGrad = ctx.createRadialGradient(0, -4, 1, 0, -6, 10);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#ffd98a');
      flameGrad.addColorStop(0.7, '#ff8fab');
      flameGrad.addColorStop(1, 'rgba(42, 157, 143, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.quadraticCurveTo(-6, -8 + flicker, 0, -14 + flicker);
      ctx.quadraticCurveTo(6, -8 + flicker, 5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}
