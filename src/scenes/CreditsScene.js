// CreditsScene.js - Smooth Vertical Scrolling Credits Sequence
import { GAME_WIDTH, GAME_HEIGHT, STUDIO_NAME, COLORS } from '../core/Constants.js';
import { I18n } from '../core/i18n/I18n.js';

export class CreditsScene {
  constructor(game) {
    this.game = game;
    this.scrollSpeed = 34; // pixels per second
    this.scrollY = GAME_HEIGHT;
    this.timer = 0;
    this.isDone = false;

    this.lines = [
      { text: I18n.t('game_title'), font: 'bold 26px', color: '#ffd98a', spacing: 12 },
      { text: `A Game by ${STUDIO_NAME}`, font: 'italic 13px', color: '#2a9d8f', spacing: 45 },

      { text: I18n.t('credits_role_dev'), font: 'bold 12px', color: '#ffb347', spacing: 6 },
      { text: I18n.t('credits_name_dev'), font: '14px', color: '#f4f1ff', spacing: 35 },

      { text: I18n.t('credits_role_art'), font: 'bold 12px', color: '#ffb347', spacing: 6 },
      { text: I18n.t('credits_name_art'), font: '14px', color: '#f4f1ff', spacing: 35 },

      { text: I18n.t('credits_role_sound'), font: 'bold 12px', color: '#ffb347', spacing: 6 },
      { text: I18n.t('credits_name_sound'), font: '14px', color: '#f4f1ff', spacing: 35 },

      { text: "Accessibility & Input Systems", font: 'bold 12px', color: '#ffb347', spacing: 6 },
      { text: "Gamepad API, Rebinding & Screen Adaptation", font: '14px', color: '#f4f1ff', spacing: 35 },

      { text: I18n.t('credits_role_special'), font: 'bold 12px', color: '#ffb347', spacing: 6 },
      { text: I18n.t('credits_name_special'), font: '14px', color: '#f4f1ff', spacing: 45 },

      { text: "✦  ✦  ✦", font: 'bold 16px', color: '#ffd98a', spacing: 30 },
      { text: I18n.t('credits_footer'), font: 'italic 14px', color: '#7be0ad', spacing: 60 },
      { text: "PRESS SPACE OR ESCAPE TO RETURN", font: 'bold 11px', color: 'rgba(255, 217, 138, 0.75)', spacing: 20 }
    ];

    // Play emotional vocal soundtrack during the credits roll
    if (this.game && this.game.audio) {
      this.game.audio.playThemeTrack(false);
    }
  }

  update(dt, input) {
    this.timer += dt;
    this.scrollY -= this.scrollSpeed * dt;

    if (input && (input.pauseJustPressed || input.jumpJustPressed || input.interactJustPressed)) {
      this.finish();
    }

    if (this.scrollY < -600) {
      this.finish();
    }
  }

  finish() {
    this.isDone = true;
    if (this.game && this.game.audio) {
      this.game.audio.playMenuMusic();
    }
    this.game.returnToMainMenu();
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;

    // Subtle starfield
    ctx.fillStyle = 'rgba(255, 217, 138, 0.25)';
    for (let i = 0; i < 35; i++) {
      const sx = (i * 89 + this.timer * 4) % GAME_WIDTH;
      const sy = (i * 53) % GAME_HEIGHT;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Render credits text
    let currY = this.scrollY;
    ctx.textAlign = 'center';

    for (const item of this.lines) {
      if (currY > -40 && currY < GAME_HEIGHT + 40) {
        ctx.font = `${item.font} -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, cx, currY);
      }
      currY += item.spacing;
    }

    ctx.restore();
  }
}
