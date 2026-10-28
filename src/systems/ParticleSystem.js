import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.maxLife = 1;
    this.life = 0;
    this.color = '#ffffff';
    this.alpha = 1;
    this.gravity = 0;
    this.drag = 0.98;
    this.type = 'circle'; // 'circle', 'spark', 'dust'
  }

  init(x, y, vx, vy, size, life, color, gravity = 0, drag = 0.98, type = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.color = color;
    this.gravity = gravity;
    this.drag = drag;
    this.type = type;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.vy += this.gravity * dt;
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx, rx, ry) {
    if (!this.active) return;

    const screenX = this.x - rx;
    const screenY = this.y - ry;

    // Viewport check
    if (screenX < -20 || screenX > GAME_WIDTH + 20 || screenY < -20 || screenY > GAME_HEIGHT + 20) {
      return;
    }

    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, progress));
    ctx.fillStyle = this.color;

    if (this.type === 'spark') {
      ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(0.5, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ParticleSystem {
  constructor(poolSize = 350) {
    this.pool = Array.from({ length: poolSize }, () => new Particle());
    this.ambientTimer = 0;
  }

  getFreeParticle() {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) return this.pool[i];
    }
    return null;
  }

  update(dt, camera) {
    // Ambient floating forest pollen/spores around visible camera area
    this.ambientTimer += dt;
    if (this.ambientTimer > 0.08) {
      this.ambientTimer = 0;
      const rx = camera.getRenderX();
      const ry = camera.getRenderY();
      const spawnX = rx + Math.random() * GAME_WIDTH;
      const spawnY = ry + Math.random() * GAME_HEIGHT;
      const p = this.getFreeParticle();
      if (p) {
        p.init(
          spawnX, spawnY,
          (Math.random() - 0.5) * 12, (Math.random() - 0.7) * 15,
          Math.random() * 2 + 1, Math.random() * 3 + 2,
          Math.random() > 0.5 ? '#7be0ad' : '#ffd98a',
          -5, 0.99, 'circle'
        );
      }
    }

    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].update(dt);
    }
  }

  render(ctx, camera) {
    const rx = camera.getRenderX();
    const ry = camera.getRenderY();
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].render(ctx, rx, ry);
    }
  }

  emitFootstepDust(x, y) {
    for (let i = 0; i < 2; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      p.init(
        x + (Math.random() - 0.5) * 4, y,
        (Math.random() - 0.5) * 18, -Math.random() * 15 - 5,
        Math.random() * 2 + 1.2, 0.35,
        'rgba(180, 170, 210, 0.7)', 30, 0.92, 'circle'
      );
    }
  }

  emitJumpPuff(x, y) {
    for (let i = 0; i < 6; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      p.init(
        x + (Math.random() - 0.5) * 8, y,
        (Math.random() - 0.5) * 35, -Math.random() * 20 - 5,
        Math.random() * 2.5 + 1.5, 0.4,
        'rgba(244, 241, 255, 0.8)', 40, 0.90, 'circle'
      );
    }
  }

  emitLandPuff(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = Math.random() * 45 + 15;
      p.init(
        x + (Math.random() - 0.5) * 10, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed * 0.4 - 10,
        Math.random() * 3 + 1.5, 0.45,
        'rgba(200, 190, 230, 0.85)', 50, 0.88, 'circle'
      );
    }
  }

  emitLanternSpark(x, y) {
    const p = this.getFreeParticle();
    if (!p) return;
    p.init(
      x, y,
      (Math.random() - 0.5) * 16, -Math.random() * 25 - 5,
      Math.random() * 2 + 1, 0.6,
      Math.random() > 0.4 ? '#ffd98a' : '#ff8fab',
      -10, 0.95, 'spark'
    );
  }

  emitFireflyGlint(x, y) {
    const p = this.getFreeParticle();
    if (!p) return;
    p.init(
      x, y,
      (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
      1.5, 0.5,
      '#7be0ad', 0, 0.96, 'spark'
    );
  }

  emitShardGlint(x, y) {
    const p = this.getFreeParticle();
    if (!p) return;
    p.init(
      x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12,
      2, 0.7,
      Math.random() > 0.5 ? '#ffffff' : '#7be0ad',
      -10, 0.95, 'spark'
    );
  }

  emitShardPickupBurst(x, y) {
    for (let i = 0; i < 24; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
      const speed = Math.random() * 80 + 30;
      p.init(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        Math.random() * 3 + 1.5, 0.8,
        i % 2 === 0 ? '#f4f1ff' : '#ffd98a',
        20, 0.93, 'spark'
      );
    }
  }

  emitShrineBurst(x, y) {
    for (let i = 0; i < 20; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * 90 + 30;
      p.init(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        Math.random() * 3 + 1.5, 0.9,
        Math.random() > 0.4 ? '#ffd98a' : '#7be0ad',
        60, 0.92, 'spark'
      );
    }
  }

  emitShrineMote(x, y) {
    const p = this.getFreeParticle();
    if (!p) return;
    p.init(
      x + (Math.random() - 0.5) * 8, y,
      (Math.random() - 0.5) * 14, -Math.random() * 25 - 15,
      Math.random() * 2 + 1, 0.7,
      '#ffd98a', -20, 0.94, 'spark'
    );
  }

  emitFireflyAbsorb(x, y) {
    for (let i = 0; i < 12; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      p.init(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        2.5, 0.6,
        '#ff8fab', 0, 0.94, 'spark'
      );
    }
  }

  emitDeathBurst(x, y) {
    for (let i = 0; i < 22; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 70 + 20;
      p.init(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        Math.random() * 3 + 1.5, 0.65,
        '#3d2c6b', 30, 0.91, 'circle'
      );
    }
  }

  emitDarkDissipate(x, y) {
    for (let i = 0; i < 6; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      p.init(
        x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
        Math.random() * 2.5 + 1, 0.5,
        '#1b1a3a', 0, 0.92, 'circle'
      );
    }
  }
}
