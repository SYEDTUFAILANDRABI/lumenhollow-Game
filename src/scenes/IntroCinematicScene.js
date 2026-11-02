// IntroCinematicScene.js - 20-Second Procedural Canvas Cinematic Sequence
// The moon shatters into 5 shards, falls into the dark forest, Lumi lights her lantern, and LUMEN HOLLOW reveals with particles and letterboxing.
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';
import { Settings } from '../core/settingsManager/SettingsManager.js';
import { I18n } from '../core/i18n/I18n.js';
import { PlayerSprite } from '../entities/PlayerSprite.js';

export class IntroCinematicScene {
  constructor(game) {
    this.game = game;
    this.timer = 0;
    this.totalDuration = 20.0;
    this.isDone = false;
    this.skipHoldTimer = 0;
    this.skipHoldMax = 0.8; // 800ms hold to skip
    this.lumiSprite = new PlayerSprite();

    // 5 Moon shards physics
    this.shards = [];
    const shardColors = ['#ffd98a', '#7be0ad', '#ff8fab', '#ffb347', '#bb44ff'];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      this.shards.push({
        x: GAME_WIDTH / 2,
        y: 110,
        vx: Math.cos(angle) * (60 + Math.random() * 50),
        vy: Math.sin(angle) * (40 + Math.random() * 40),
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 8,
        color: shardColors[i],
        fallY: 110
      });
    }

    // Title reveal light rays
    this.particles = [];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: GAME_WIDTH / 2 + (Math.random() - 0.5) * 200,
        y: GAME_HEIGHT / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        size: Math.random() * 3 + 1,
        life: Math.random() * 2
      });
    }

    // Audio swell
    if (this.game.audio) {
      this.game.audio.playIntroSwell();
    }
  }

  update(dt, input) {
    this.timer += dt;

    // Check hold-to-skip (any key down, Escape, or pointer down)
    const isHoldingKey = input && (input.keys.size > 0 || input.touchPulse || input.touchJump || input.touchLeft);
    if (isHoldingKey) {
      this.skipHoldTimer += dt;
      if (this.skipHoldTimer >= this.skipHoldMax) {
        this.finish();
        return;
      }
    } else {
      this.skipHoldTimer = Math.max(0, this.skipHoldTimer - dt * 2);
    }

    // Shard physics (Active in Phase 1 & 2: 3s to 10s)
    if (this.timer >= 3.0 && this.timer < 11.0) {
      for (const s of this.shards) {
        s.x += s.vx * dt;
        s.vy += 80 * dt; // Gravity
        s.y += s.vy * dt;
        s.rot += s.spin * dt;
      }
    }

    // Title particles in Phase 4 (15s to 20s)
    if (this.timer >= 14.5) {
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    if (this.timer >= this.totalDuration) {
      this.finish();
    }
  }

  finish() {
    this.isDone = true;
    Settings.set('introSeen', true);
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = COLORS.VOID;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Letterbox bars (cinematic 2.35:1 aspect illusion)
    const barHeight = 28;

    // Phase 1: 0 - 5s -> Moon cracking and shattering
    if (this.timer < 5.0) {
      this.renderPhase1Moon(ctx, cx, cy);
    }
    // Phase 2: 5 - 10s -> Shards scattering down into the forest
    else if (this.timer < 10.0) {
      this.renderPhase2Descent(ctx, cx, cy);
    }
    // Phase 3: 10 - 15s -> Lumi lighting the lantern in the dark hollow
    else if (this.timer < 15.0) {
      this.renderPhase3Lantern(ctx, cx, cy);
    }
    // Phase 4: 15 - 20s -> Title reveal "LUMEN HOLLOW" with particle swell
    else {
      this.renderPhase4TitleReveal(ctx, cx, cy);
    }

    // Draw Letterbox Bars
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, GAME_WIDTH, barHeight);
    ctx.fillRect(0, GAME_HEIGHT - barHeight, GAME_WIDTH, barHeight);

    // Skip Indicator (Hold to skip)
    if (this.skipHoldTimer > 0) {
      const prog = Math.min(1, this.skipHoldTimer / this.skipHoldMax);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 217, 138, 0.2)';
      ctx.fillRect(20, GAME_HEIGHT - 20, 100, 5);
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(20, GAME_HEIGHT - 20, 100 * prog, 5);
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffd98a';
      ctx.fillText(I18n.t('hold_to_skip'), 20, GAME_HEIGHT - 24);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(I18n.t('hold_to_skip'), 20, GAME_HEIGHT - 12);
      ctx.restore();
    }

    ctx.restore();
  }

  renderPhase1Moon(ctx, cx, cy) {
    const t = this.timer;
    const moonY = 110;
    const moonR = 40;

    // Sky
    ctx.fillStyle = '#090814';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Moon Glow
    const glow = ctx.createRadialGradient(cx, moonY, 10, cx, moonY, 140);
    glow.addColorStop(0, 'rgba(255, 217, 138, 0.6)');
    glow.addColorStop(0.6, 'rgba(42, 157, 143, 0.2)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, moonY, 140, 0, Math.PI * 2);
    ctx.fill();

    // The Celestial Moon
    ctx.fillStyle = '#f4f1ff';
    ctx.beginPath();
    ctx.arc(cx, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Surface details
    ctx.fillStyle = 'rgba(180, 170, 210, 0.3)';
    ctx.beginPath();
    ctx.arc(cx - 12, moonY - 10, 10, 0, Math.PI * 2);
    ctx.arc(cx + 14, moonY + 8, 14, 0, Math.PI * 2);
    ctx.fill();

    // Crack animation begins at 2.2s
    if (t > 2.2) {
      const crackProgress = Math.min(1, (t - 2.2) / 1.0);
      ctx.strokeStyle = '#2a9d8f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, moonY - moonR);
      ctx.lineTo(cx - 5 * crackProgress, moonY - 10);
      ctx.lineTo(cx + 8 * crackProgress, moonY + 12);
      ctx.lineTo(cx, moonY + moonR);
      ctx.stroke();

      // Golden energy surging from fissure
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Shatter explosion at 3.2s
    if (t >= 3.2) {
      const shatterT = t - 3.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - shatterT * 2)})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Render drifting shards
      for (const s of this.shards) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Subtitle text
    ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 217, 138, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText("Before time fractured, the Celestial Moon watched over Lumen Hollow...", cx, GAME_HEIGHT - 45);
  }

  renderPhase2Descent(ctx, cx, cy) {
    // Forest canopy view
    ctx.fillStyle = '#080612';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pine trees
    ctx.fillStyle = '#100c22';
    for (let x = -20; x < GAME_WIDTH + 40; x += 35) {
      const th = 140 + Math.sin(x) * 40;
      ctx.beginPath();
      ctx.moveTo(x, GAME_HEIGHT);
      ctx.lineTo(x + 18, GAME_HEIGHT - th);
      ctx.lineTo(x + 36, GAME_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    // Falling shards leaving glowing light trails
    for (const s of this.shards) {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 0.15, s.y - s.vy * 0.15);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 217, 138, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText("The moon shattered into five radiant shards, scattered across the deep chasm...", cx, GAME_HEIGHT - 45);
  }

  renderPhase3Lantern(ctx, cx, cy) {
    const t = this.timer - 10.0;
    const lanternLit = t > 2.0;

    ctx.fillStyle = '#06050d';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const floorY = 250;
    ctx.fillStyle = '#0c0a1a';
    ctx.fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);

    const lx = cx - 15;
    const ly = floorY - 8;

    // Lumi silhouette kneeling
    ctx.fillStyle = '#1c1635';
    ctx.beginPath();
    ctx.arc(lx - 25, floorY - 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(lx - 30, floorY - 20, 16, 18);

    // Lantern ignition burst
    if (lanternLit) {
      const pulse = Math.min(1, (t - 2.0) * 1.5);
      const glow = ctx.createRadialGradient(lx, ly - 10, 4, lx, ly - 10, 130 * pulse);
      glow.addColorStop(0, 'rgba(255, 217, 138, 0.85)');
      glow.addColorStop(0.4, 'rgba(42, 157, 143, 0.35)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly - 10, 130 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Sparks
      ctx.fillStyle = '#ffd98a';
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 4;
        const dist = 20 + (i % 3) * 15;
        ctx.fillRect(lx + Math.cos(ang) * dist, ly - 10 + Math.sin(ang) * dist, 2, 2);
      }
    }

    // Lantern physical body
    ctx.fillStyle = lanternLit ? '#ffd98a' : '#33271f';
    ctx.fillRect(lx - 6, ly - 20, 12, 18);
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx - 6, ly - 20, 12, 18);

    ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 217, 138, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText("Awakening in the darkness, Lumi kindles the Sacred Celestial Lantern.", cx, GAME_HEIGHT - 45);
  }

  renderPhase4TitleReveal(ctx, cx, cy) {
    const t = this.timer - 15.0;
    const progress = Math.min(1, t / 2.5);

    // Camera slow push
    const scale = 1.0 + t * 0.03;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    // Radiant background burst
    const burst = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
    burst.addColorStop(0, `rgba(255, 217, 138, ${0.4 * progress})`);
    burst.addColorStop(0.5, `rgba(42, 157, 143, ${0.2 * progress})`);
    burst.addColorStop(1, 'rgba(9, 8, 20, 0)');
    ctx.fillStyle = burst;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting particles
    for (const p of this.particles) {
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grand Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 24 * progress;
    ctx.fillText(I18n.t('game_title'), cx, cy);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#2a9d8f';
    ctx.letterSpacing = '1px';
    ctx.fillText(I18n.t('game_subtitle'), cx, cy + 28);

    ctx.restore();
  }
}
