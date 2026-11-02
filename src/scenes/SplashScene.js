// SplashScene.js - Procedural Studio Splash Screen
import { GAME_WIDTH, GAME_HEIGHT, STUDIO_NAME, COLORS } from '../core/Constants.js';
import { I18n } from '../core/i18n/I18n.js';

export class SplashScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.duration = 2.6; // Total duration
    this.isDone = false;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.duration) {
      this.isDone = true;
    }
  }

  skip() {
    this.isDone = true;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Opacity envelope: Fade in 0..0.7s, hold 0.7..1.9s, fade out 1.9..2.6s
    let alpha = 1;
    if (this.timer < 0.7) {
      alpha = this.timer / 0.7;
    } else if (this.timer > 1.9) {
      alpha = Math.max(0, 1 - (this.timer - 1.9) / 0.7);
    }
    ctx.globalAlpha = alpha;

    // Glowing emblem / star crest behind studio name
    const pulse = Math.sin(this.timer * 3) * 0.1 + 0.9;
    ctx.save();
    ctx.translate(cx, cy - 30);
    ctx.scale(pulse, pulse);

    const emblemGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
    emblemGrad.addColorStop(0, '#ffd98a');
    emblemGrad.addColorStop(0.5, 'rgba(42, 157, 143, 0.4)');
    emblemGrad.addColorStop(1, 'rgba(9, 8, 20, 0)');
    ctx.fillStyle = emblemGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Geometric studio emblem icon
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Studio Name
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 12;
    ctx.fillText(STUDIO_NAME.toUpperCase(), cx, cy + 20);
    ctx.shadowBlur = 0;

    // "PRESENTS"
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 217, 138, 0.8)';
    ctx.fillText(I18n.t('studio_presents'), cx, cy + 38);

    ctx.restore();
  }
}
