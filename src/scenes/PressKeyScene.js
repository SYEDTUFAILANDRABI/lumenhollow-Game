// PressKeyScene.js - Mandatory browser user gesture unlock screen
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';
import { I18n } from '../core/i18n/I18n.js';

export class PressKeyScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.unlocked = false;
  }

  update(dt) {
    this.timer += dt;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Glowing crescent moon motif
    const pulse = Math.sin(this.timer * 2.5) * 0.12 + 0.88;
    ctx.save();
    ctx.translate(cx, cy - 40);
    ctx.scale(pulse, pulse);

    const moonGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 32);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.4, '#ffd98a');
    moonGrad.addColorStop(1, 'rgba(42, 157, 143, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0.4, Math.PI * 1.5);
    ctx.fill();
    ctx.restore();

    // Game Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 15;
    ctx.fillText(I18n.t('game_title'), cx, cy + 20);
    ctx.shadowBlur = 0;

    // Call to Action with pulsating glow
    const blink = Math.sin(this.timer * 4.5) > 0 ? 1 : 0.45;
    ctx.globalAlpha = blink;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText(I18n.t('press_any_key'), cx, cy + 55);
    ctx.globalAlpha = 1.0;

    ctx.font = 'italic 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(244, 241, 255, 0.65)';
    ctx.fillText(I18n.t('press_key_hint'), cx, cy + 74);

    ctx.restore();
  }
}
