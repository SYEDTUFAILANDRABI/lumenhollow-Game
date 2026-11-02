// BootScene.js - Loading screen with smooth progress bar, rotating tips, and system warmup
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';
import { I18n } from '../core/i18n/I18n.js';

export class BootScene {
  constructor(game) {
    this.game = game;
    this.progress = 0;
    this.timer = 0;
    this.tipIndex = Math.floor(Math.random() * 8);
    this.tipTimer = 0;
    this.isDone = false;
    this.fadeAlpha = 0;
    this.tipList = I18n.t('tips');
  }

  update(dt) {
    this.timer += dt;
    this.tipTimer += dt;

    // Rotate tips every 3.5 seconds
    if (this.tipTimer >= 3.5) {
      this.tipTimer = 0;
      this.tipIndex = (this.tipIndex + 1) % this.tipList.length;
    }

    // Smooth progress bar fill
    if (this.progress < 1) {
      this.progress += dt * 1.25; // Completes in ~0.8s
      if (this.progress >= 1) {
        this.progress = 1;
        // Warm up systems
        if (this.game.audio) this.game.audio.init();
      }
    } else {
      this.fadeAlpha += dt * 2.5;
      if (this.fadeAlpha >= 1) {
        this.isDone = true;
      }
    }
  }

  render(ctx) {
    // Dark void backdrop
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Subtle moon glow in background
    const glow = ctx.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 120);
    glow.addColorStop(0, 'rgba(42, 157, 143, 0.12)');
    glow.addColorStop(1, 'rgba(9, 8, 20, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title / Warmup text
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.GOLD;
    ctx.letterSpacing = '3px';
    ctx.fillText(I18n.t('loading'), cx, cy - 25);

    // Progress bar frame
    const barW = 240;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = cy;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = 'rgba(255, 217, 138, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Filled progress with gradient
    const fillW = Math.max(0, barW * this.progress);
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      grad.addColorStop(0, '#2a9d8f');
      grad.addColorStop(0.8, '#ffd98a');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, fillW, barH);
    }

    // Rotating Tip
    const tipText = this.tipList[this.tipIndex] || this.tipList[0];
    ctx.font = 'italic 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(244, 241, 255, 0.75)';
    ctx.fillText(`Tip: ${tipText}`, cx, cy + 35);

    // Fade to next scene
    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(9, 8, 20, ${Math.min(1, this.fadeAlpha)})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    ctx.restore();
  }
}
