// Swappable Skill Ability Implementations
import { Projectile } from '../combat/Projectile.js';

export const SKILL_POOL = [
  {
    id: 'bolt',
    name: 'Umbral Bolt',
    desc: 'Fires dark violet piercing projectile with ribbon trail',
    cost: 14,
    cooldown: 0.8,
    icon: '🔮',
    unlocked: true
  },
  {
    id: 'plunge',
    name: 'Void Plunge',
    desc: 'Mid-air slam creating crater and dark spikes',
    cost: 18,
    cooldown: 1.5,
    icon: '☄️',
    unlocked: true
  },
  {
    id: 'crescent',
    name: 'Crescent Wave',
    desc: 'Launches wide crescent slash wave cutting through ranks',
    cost: 20,
    cooldown: 1.8,
    icon: '🌙',
    unlocked: true
  },
  {
    id: 'chain',
    name: 'Soul Chain',
    desc: 'Lashes ethereal shadow chain, pulling enemy to Lumi',
    cost: 15,
    cooldown: 2.2,
    icon: '⛓️',
    unlocked: true
  },
  {
    id: 'gravity',
    name: 'Gravity Well',
    desc: 'Spawns vortex pulling all nearby enemies together',
    cost: 24,
    cooldown: 3.5,
    icon: '🌀',
    unlocked: true
  },
  {
    id: 'clone',
    name: 'Shadow Clone',
    desc: 'Summons decoy afterimage that draws enemy aggro',
    cost: 22,
    cooldown: 4.0,
    icon: '👤',
    unlocked: true
  },
  {
    id: 'lance',
    name: 'Spirit Lance',
    desc: 'Piercing radiant violet beam cutting across the screen',
    cost: 26,
    cooldown: 3.0,
    icon: '⚡',
    unlocked: true
  }
];

export class ActiveGravityWell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lifetime = 2.4;
    this.maxLife = 2.4;
    this.radius = 95;
    this.dead = false;
  }

  update(dt, enemies, boss) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const all = [...enemies];
    if (boss && !boss.isDead) all.push(boss);

    for (const t of all) {
      if (t.isDead) continue;
      const dx = this.x - t.x;
      const dy = this.y - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.radius && dist > 8) {
        const pull = 160 * (1 - dist / this.radius);
        t.vx += (dx / dist) * pull * dt;
        t.vy += (dy / dist) * pull * dt;
      }
    }
  }

  render(ctx) {
    if (this.dead) return;
    const p = this.lifetime / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = Math.min(1, p * 1.5) * 0.75;

    // Swirling black hole vortex
    ctx.shadowColor = '#a288e3';
    ctx.shadowBlur = 12;

    const angle = Date.now() * 0.005;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#ff2255' : '#a288e3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, (1 - p * 0.4) * (this.radius * (0.3 + i * 0.2)), angle + i * 1.5, angle + i * 1.5 + Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = '#05040a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class ActiveShadowClone {
  constructor(x, y, facing) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.lifetime = 3.8;
    this.maxLife = 3.8;
    this.dead = false;
  }

  update(dt) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
    }
  }

  render(ctx) {
    if (this.dead) return;
    const p = this.lifetime / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    ctx.globalAlpha = Math.min(1, p * 1.4) * 0.65;

    // Silhouette of Lumi
    ctx.fillStyle = '#ff2255';
    ctx.shadowColor = '#a288e3';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -10, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(-6, -6, 12, 14);

    // Glowing eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, -11, 2, 2);

    ctx.restore();
  }
}

export class ActiveSpiritLance {
  constructor(x, y, facing) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.length = 360;
    this.lifetime = 0.28;
    this.maxLife = 0.28;
    this.dead = false;
  }

  update(dt) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.dead = true;
  }

  render(ctx) {
    if (this.dead) return;
    const p = this.lifetime / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 1.8);

    // Radiant cutting beam
    ctx.strokeStyle = '#ff2255';
    ctx.shadowColor = '#ffd98a';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5 * p;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.facing * this.length, this.y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * p;
    ctx.stroke();

    ctx.restore();
  }
}
