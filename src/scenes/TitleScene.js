// TitleScene.js - Animated Title Screen with Parallax, Idling Lumi, Lantern, Fireflies, and Sway
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';
import { PlayerSprite } from '../entities/PlayerSprite.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.lumiSprite = new PlayerSprite();
    this.fireflies = [];

    // Initialize 25 ambient fireflies
    for (let i = 0; i < 25; i++) {
      this.fireflies.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: (Math.random() - 0.5) * 15,
        vy: -10 - Math.random() * 15,
        radius: 1.2 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? '#ffd98a' : '#7be0ad'
      });
    }
  }

  update(dt) {
    this.timer += dt;

    // Update Lumi idle animation
    if (this.lumiSprite) {
      this.lumiSprite.update(dt, {
        isDead: false,
        vx: 0,
        vy: 0,
        isGrounded: true,
        isAttacking: false,
        isDashing: false,
        isGliding: false,
        hitFlashTimer: 0
      });
    }

    // Update fireflies
    for (const f of this.fireflies) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.phase += dt * 3;

      if (f.y < -10) {
        f.y = GAME_HEIGHT + 10;
        f.x = Math.random() * GAME_WIDTH;
      }
      if (f.x < -10) f.x = GAME_WIDTH + 10;
      if (f.x > GAME_WIDTH + 10) f.x = -10;
    }
  }

  render(ctx) {
    ctx.save();

    // Subtle atmospheric camera sway
    const swayX = Math.sin(this.timer * 0.7) * 4;
    const swayY = Math.cos(this.timer * 0.9) * 3;
    ctx.translate(swayX, swayY);

    // Deep dusk sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#090814');
    skyGrad.addColorStop(0.5, '#1b1a3a');
    skyGrad.addColorStop(1, '#2d1b55');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);

    // Glowing Moon in top right
    const moonX = GAME_WIDTH * 0.75;
    const moonY = 70;
    const moonPulse = Math.sin(this.timer * 1.5) * 0.08 + 0.92;

    const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 90);
    moonGlow.addColorStop(0, 'rgba(255, 217, 138, 0.4)');
    moonGlow.addColorStop(0.5, 'rgba(123, 224, 173, 0.15)');
    moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f1ff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26 * moonPulse, 0, Math.PI * 2);
    ctx.fill();

    // Far silhouetted mountains
    ctx.fillStyle = '#16132b';
    ctx.beginPath();
    ctx.moveTo(-10, GAME_HEIGHT);
    ctx.lineTo(80, 220);
    ctx.lineTo(190, 260);
    ctx.lineTo(310, 210);
    ctx.lineTo(440, 250);
    ctx.lineTo(560, 200);
    ctx.lineTo(GAME_WIDTH + 10, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Midground ancient pine forest silhouette
    ctx.fillStyle = '#0f0c22';
    ctx.beginPath();
    ctx.moveTo(-10, GAME_HEIGHT);
    for (let x = 0; x < GAME_WIDTH + 40; x += 30) {
      const treeHeight = 120 + Math.sin(x * 0.05) * 35;
      ctx.lineTo(x, GAME_HEIGHT - treeHeight);
      ctx.lineTo(x + 15, GAME_HEIGHT - treeHeight + 20);
    }
    ctx.lineTo(GAME_WIDTH + 10, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Foreground mossy cliff ledge
    ctx.fillStyle = '#090814';
    ctx.beginPath();
    ctx.moveTo(-10, GAME_HEIGHT);
    ctx.lineTo(-10, 260);
    ctx.bezierCurveTo(80, 255, 180, 270, 270, 280);
    ctx.bezierCurveTo(340, 290, 420, 310, GAME_WIDTH + 10, 315);
    ctx.lineTo(GAME_WIDTH + 10, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Teal moss highlight on ledge top
    ctx.strokeStyle = '#2a9d8f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 260);
    ctx.bezierCurveTo(80, 255, 180, 270, 270, 280);
    ctx.bezierCurveTo(340, 290, 420, 310, GAME_WIDTH + 10, 315);
    ctx.stroke();

    // The Sacred Lantern resting on the ledge
    const lanternX = 145;
    const lanternY = 262;

    const lanternPulse = Math.sin(this.timer * 3) * 0.15 + 0.85;
    const lanternGlow = ctx.createRadialGradient(lanternX, lanternY - 14, 4, lanternX, lanternY - 14, 55 * lanternPulse);
    lanternGlow.addColorStop(0, 'rgba(255, 217, 138, 0.7)');
    lanternGlow.addColorStop(0.5, 'rgba(255, 143, 171, 0.25)');
    lanternGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lanternGlow;
    ctx.beginPath();
    ctx.arc(lanternX, lanternY - 14, 55 * lanternPulse, 0, Math.PI * 2);
    ctx.fill();

    // Lantern physical housing
    ctx.fillStyle = '#5a4634';
    ctx.fillRect(lanternX - 5, lanternY - 22, 10, 18);
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(lanternX - 3, lanternY - 19, 6, 12);
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1;
    ctx.strokeRect(lanternX - 5, lanternY - 22, 10, 18);

    // Lumi idling next to the lantern
    const lumiX = 118;
    const lumiY = 265;
    if (this.lumiSprite && this.lumiSprite.isLoaded()) {
      this.lumiSprite.render(ctx, lumiX, lumiY, 1, 0, 1.1);
    } else {
      // Procedural Lumi fallback
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.arc(lumiX, lumiY - 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lumiX - 5, lumiY - 12, 10, 12);
    }

    // Drifting fireflies
    for (const f of this.fireflies) {
      const alpha = Math.sin(f.phase) * 0.4 + 0.6;
      ctx.fillStyle = f.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }
}
