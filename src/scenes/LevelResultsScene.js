// LevelResultsScene.js - Post-Stage Results Screen with Animated Stat Count-Up & Rank
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';
import { I18n } from '../core/i18n/I18n.js';
import { Saves } from '../core/saveManager/SaveManager.js';
import { Achievements } from '../ui/menus/AchievementsModal.js';

export class LevelResultsScene {
  constructor(game, stats = {}) {
    this.game = game;
    this.timer = 0;
    this.targetTime = stats.time || 45;
    this.targetShards = stats.shards || 1;
    this.targetEnemies = stats.enemies || 6;
    this.targetCombo = stats.combo || 12;
    this.levelIndex = stats.levelIndex !== undefined ? stats.levelIndex : game.currentLevelIndex;

    // Determine Rank
    // S rank: < 90s, combo >= 20
    // A rank: < 150s, combo >= 10
    // B rank: < 240s
    // C rank: default
    if (this.targetTime < 90 && this.targetCombo >= 15) this.rank = 'S';
    else if (this.targetTime < 160 && this.targetCombo >= 8) this.rank = 'A';
    else if (this.targetTime < 240) this.rank = 'B';
    else this.rank = 'C';

    // Store in active slot
    const slot = Saves.getActiveSlot();
    if (slot && slot.stats) {
      slot.stats.stageTimes[this.levelIndex] = Math.round(this.targetTime);
      slot.stats.stageRanks[this.levelIndex] = this.rank;
      Saves.saveSlotsDirect(Saves.slots);
    }

    if (this.targetCombo >= 25) {
      Achievements.unlock('combo_master', game.menuManager);
    }
  }

  update(dt, input) {
    this.timer += dt;
    if (this.timer > 3.0 && input && (input.jumpJustPressed || input.interactJustPressed)) {
      this.proceed();
    }
  }

  proceed() {
    if (this.levelIndex >= 5) {
      this.game.startCredits();
    } else {
      this.game.loadLevel(this.levelIndex + 1);
      this.game.state = 'PLAYING';
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Radial celebration backdrop
    const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 200);
    glow.addColorStop(0, 'rgba(42, 157, 143, 0.25)');
    glow.addColorStop(0.7, 'rgba(255, 217, 138, 0.08)');
    glow.addColorStop(1, 'rgba(9, 8, 20, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 200, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 12;
    ctx.fillText(I18n.t('results_title'), cx, cy - 85);
    ctx.shadowBlur = 0;

    // Animated count-up progress (0..2.0s)
    const prog = Math.min(1, this.timer / 1.8);
    const currTime = Math.round(this.targetTime * prog);
    const currShards = Math.round(this.targetShards * prog);
    const currEnemies = Math.round(this.targetEnemies * prog);
    const currCombo = Math.round(this.targetCombo * prog);

    const formatM = (s) => `${Math.floor(s / 60)}:${(s % 60) < 10 ? '0' : ''}${s % 60}`;

    // Stat Lines
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.textAlign = 'left';

    const startX = cx - 110;
    const valX = cx + 110;

    const drawRow = (label, val, y) => {
      ctx.fillStyle = 'rgba(244, 241, 255, 0.85)';
      ctx.textAlign = 'left';
      ctx.fillText(label, startX, y);
      ctx.fillStyle = '#ffd98a';
      ctx.textAlign = 'right';
      ctx.fillText(val, valX, y);
    };

    drawRow(I18n.t('results_time'), formatM(currTime), cy - 42);
    drawRow(I18n.t('results_shards'), `${currShards} / 5`, cy - 18);
    drawRow(I18n.t('results_enemies'), `${currEnemies}`, cy + 6);
    drawRow(I18n.t('results_combo'), `${currCombo} hits`, cy + 30);

    // Rank Badge
    if (this.timer >= 2.0) {
      const pop = Math.min(1, (this.timer - 2.0) * 4);
      ctx.save();
      ctx.translate(cx + 155, cy - 20);
      ctx.scale(pop, pop);

      ctx.fillStyle = '#1b1535';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = this.rank === 'S' ? '#ffd98a' : (this.rank === 'A' ? '#7be0ad' : '#ff8fab');
      ctx.fillText(this.rank, 0, 2);
      ctx.restore();
    }

    // Call to Action
    if (this.timer > 2.5) {
      const blink = Math.sin(this.timer * 5) > 0 ? 1 : 0.4;
      ctx.globalAlpha = blink;
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffd98a';
      ctx.fillText("PRESS SPACE OR ENTER TO CONTINUE", cx, cy + 90);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }
}
