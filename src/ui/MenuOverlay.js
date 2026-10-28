import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';

export class MenuOverlay {
  constructor() {
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
  }

  renderTitle(ctx, isMuted) {
    ctx.save();

    // Dark atmospheric veil
    ctx.fillStyle = 'rgba(9, 8, 20, 0.75)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Glowing crescent moon motif
    const pulse = Math.sin(this.timer * 2) * 0.15 + 0.85;
    ctx.save();
    ctx.translate(centerX, centerY - 65);
    ctx.scale(pulse, pulse);

    const moonGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.5, '#ffd98a');
    moonGrad.addColorStop(1, 'rgba(123, 224, 173, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0.4, Math.PI * 1.5);
    ctx.fill();
    ctx.restore();

    // Game Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 14;
    ctx.fillText('LUMEN HOLLOW', centerX, centerY - 10);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#2a9d8f';
    ctx.fillText('The Moon has shattered. Relight the sacred sky.', centerX, centerY + 14);

    // Call to Action
    const blink = Math.sin(this.timer * 4) > 0 ? 1 : 0.4;
    ctx.globalAlpha = blink;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('PRESS SPACE OR TAP TO BEGIN', centerX, centerY + 55);
    ctx.globalAlpha = 1.0;

    // Controls Legend
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(244, 241, 255, 0.7)';
    ctx.fillText('Move: [A / D] • Jump: [Space] • Slash: [J] • Bolt: [L] • Dash: [C] • Plunge: [S in Air]', centerX, centerY + 95);
    ctx.fillText('Pulse: [Shift] • Sovereign Aura: [Q] (at 100% Eclipse) • Mute: [M] • Pause: [Esc]', centerX, centerY + 115);

    ctx.restore();
  }

  renderPause(ctx, isMuted, accessibility = {}) {
    ctx.save();

    // Semi-transparent dim
    ctx.fillStyle = 'rgba(9, 8, 20, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 8;
    ctx.fillText('PAUSED', centerX, centerY - 65);
    ctx.shadowBlur = 0;

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('Press [Esc] to Resume   •   Press [M] to Toggle Sound   •   [R] Respawn', centerX, centerY - 40);

    // Accessibility Options List
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#7be0ad';
    ctx.fillText('— ACCESSIBILITY & SETTINGS —', centerX, centerY - 15);

    const optY = centerY + 8;
    const shakeText = accessibility.shakeEnabled !== false ? 'ON' : 'OFF';
    const flashText = accessibility.flashIntensity === 0 ? 'OFF' : (accessibility.flashIntensity === 0.5 ? '50%' : '100%');
    const hitStopText = accessibility.hitStopEnabled !== false ? 'ON' : 'OFF';
    const dmgText = accessibility.damageNumbers !== false ? 'ON' : 'OFF';
    const qualityText = accessibility.highQuality !== false ? 'HIGH (60 FPS)' : 'LOW (BATTERY)';

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.fillText(`[1] Screen Shake: ${shakeText}     [2] Flash Intensity: ${flashText}`, centerX, optY);
    ctx.fillText(`[3] Hit-Stop Juice: ${hitStopText}     [4] Damage Numbers: ${dmgText}`, centerX, optY + 20);
    ctx.fillText(`[5] Graphics Quality: ${qualityText}`, centerX, optY + 40);

    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(244, 241, 255, 0.5)';
    ctx.fillText('Press number keys 1-5 to toggle options', centerX, optY + 65);

    ctx.restore();
  }

  renderWin(ctx, totalShards, timer) {
    ctx.save();

    // Subtle celestial gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGrad.addColorStop(0, 'rgba(10, 8, 26, 0.90)');
    bgGrad.addColorStop(0.5, 'rgba(23, 18, 51, 0.90)');
    bgGrad.addColorStop(1, 'rgba(42, 27, 75, 0.90)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const centerX = GAME_WIDTH / 2;

    // Full restored moon
    const moonGlow = ctx.createRadialGradient(centerX, 70, 8, centerX, 70, 50);
    moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    moonGlow.addColorStop(0.3, 'rgba(255, 217, 138, 0.6)');
    moonGlow.addColorStop(0.7, 'rgba(123, 224, 173, 0.25)');
    moonGlow.addColorStop(1, 'rgba(123, 224, 173, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(centerX, 70, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#f4f1ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, 70, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Epilogue text
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.fillText('THE SKY IS RELIT', centerX, 145);

    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#7be0ad';
    ctx.fillText('All 5 Moon Shards have returned home to the sacred shrine.', centerX, 175);
    ctx.fillText('The Hollow Wood rests peacefully under eternal starlight.', centerX, 195);

    // Credits
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('Created with care • Lumen Hollow', centerX, 240);
    ctx.fillStyle = 'rgba(244, 241, 255, 0.6)';
    ctx.fillText('Procedural Canvas 2D • Web Audio Synthesizer', centerX, 260);

    const blink = Math.sin(timer * 3) > 0 ? 1 : 0.5;
    ctx.globalAlpha = blink;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('PRESS SPACE OR TAP TO PLAY AGAIN', centerX, 305);

    ctx.restore();
  }
}
