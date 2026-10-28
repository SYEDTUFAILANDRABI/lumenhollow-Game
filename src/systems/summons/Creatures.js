// Procedural Canvas-drawn Underworld Summons
// No external images - all procedural shapes, layered geometries and glowing eyes

export class TriMaw {
  constructor(x, y, level = 1) {
    this.name = 'Tri-Maw';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.width = 36;
    this.height = 20;
    this.lifetime = 13.0;
    this.maxLife = 13.0;
    this.dead = false;
    this.damage = 26 * level;
    this.speed = 220;
    this.attackCooldown = 0;
    this.buffTimer = 0;
    this.animTimer = 0;
  }

  update(dt, enemies, boss, combatSystem, vfx, audio, camera) {
    this.lifetime -= dt;
    this.animTimer += dt * 14;
    if (this.buffTimer > 0) this.buffTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const mult = this.buffTimer > 0 ? 1.4 : 1.0;
    const targets = [...enemies];
    if (boss && !boss.isDead) targets.push(boss);
    const aliveTargets = targets.filter(t => !t.isDead);

    if (aliveTargets.length > 0) {
      // Find closest enemy
      let nearest = null;
      let minDist = 9999;
      for (const t of aliveTargets) {
        const d = Math.hypot(t.x - this.x, (t.y - 10) - this.y);
        if (d < minDist) {
          minDist = d;
          nearest = t;
        }
      }

      if (nearest) {
        this.facing = nearest.x > this.x ? 1 : -1;
        const dx = nearest.x - this.x;
        const dy = (nearest.y - 8) - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 18) {
          this.vx = (dx / dist) * this.speed * mult;
          this.vy = (dy / dist) * this.speed * mult * 0.7;
        } else {
          this.vx *= 0.8;
          this.vy *= 0.8;
          // Bite attack!
          if (this.attackCooldown <= 0) {
            this.attackCooldown = 0.32;
            const isBoss = nearest === boss;
            const dmg = this.damage * (isBoss ? 0.35 : 1.0) * mult;
            nearest.takeDamage(dmg, nearest.x, nearest.y, combatSystem, vfx, audio, camera);
            if (vfx) vfx.addSlashArc(this.x + this.facing * 12, this.y, this.facing, 0, true);
            if (camera) camera.shake(2.5, 0.1);
          }
        }
      }
    } else {
      // Wander / idle around
      this.vx = Math.sin(this.animTimer * 0.3) * 40;
      this.vy = Math.cos(this.animTimer * 0.3) * 15;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  roar() {
    this.buffTimer = 6.0;
  }

  render(ctx) {
    if (this.dead) return;
    const fade = Math.min(1, this.lifetime * 1.5);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    ctx.globalAlpha = fade;

    const runBob = Math.sin(this.animTimer) * 3;

    // Outer shadowy aura
    ctx.shadowColor = this.buffTimer > 0 ? '#ff2255' : '#a288e3';
    ctx.shadowBlur = 10;

    // Muscular Hound Body
    ctx.fillStyle = '#160d26';
    ctx.beginPath();
    ctx.ellipse(0, runBob, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Running Claws
    ctx.fillStyle = '#2d1847';
    const legOffset1 = Math.sin(this.animTimer) * 8;
    const legOffset2 = Math.cos(this.animTimer) * 8;
    ctx.fillRect(-12 + legOffset1, runBob + 6, 4, 8);
    ctx.fillRect(-4 - legOffset1, runBob + 6, 4, 8);
    ctx.fillRect(4 + legOffset2, runBob + 6, 4, 8);
    ctx.fillRect(12 - legOffset2, runBob + 6, 4, 8);

    // Spine Spikes
    ctx.fillStyle = '#ff2255';
    for (let i = -10; i <= 8; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, runBob - 8);
      ctx.lineTo(i + 3, runBob - 14);
      ctx.lineTo(i + 6, runBob - 8);
      ctx.fill();
    }

    // 3 Heads (Center, Top, Bottom)
    const heads = [
      { x: 14, y: runBob - 3, r: 6.5 },
      { x: 12, y: runBob - 9, r: 5.5 },
      { x: 12, y: runBob + 3, r: 5.5 }
    ];

    heads.forEach((h, idx) => {
      ctx.fillStyle = '#22123b';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fill();

      // Snapping jaw
      const jawAngle = Math.sin(this.animTimer * 1.8 + idx) * 0.3;
      ctx.fillStyle = '#0a0614';
      ctx.beginPath();
      ctx.moveTo(h.x + 2, h.y);
      ctx.lineTo(h.x + 9, h.y + 2 + jawAngle * 4);
      ctx.lineTo(h.x + 3, h.y + 4);
      ctx.fill();

      // Glowing Crimson Eyes
      ctx.fillStyle = '#ff2255';
      ctx.beginPath();
      ctx.arc(h.x + 2, h.y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

export class AshenWyrm {
  constructor(x, y, level = 1) {
    this.name = 'Ashen Wyrm';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.lifetime = 14.0;
    this.maxLife = 14.0;
    this.dead = false;
    this.damage = 22 * level;
    this.breathTimer = 0;
    this.buffTimer = 0;
    this.animTimer = 0;
    this.segments = Array.from({ length: 9 }, (_, i) => ({ x: x - i * 8, y: y }));
  }

  update(dt, enemies, boss, combatSystem, vfx, audio, camera) {
    this.lifetime -= dt;
    this.animTimer += dt * 5;
    if (this.buffTimer > 0) this.buffTimer -= dt;
    this.breathTimer += dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const mult = this.buffTimer > 0 ? 1.5 : 1.0;
    const targets = [...enemies];
    if (boss && !boss.isDead) targets.push(boss);
    const aliveTargets = targets.filter(t => !t.isDead);

    let targetX = this.x + 50;
    let targetY = this.y - 30;

    if (aliveTargets.length > 0) {
      const nearest = aliveTargets[0];
      targetX = nearest.x - this.facing * 40;
      targetY = nearest.y - 45;
      this.facing = nearest.x > this.x ? 1 : -1;

      // Dark fire cone breath attack
      if (this.breathTimer > 0.8) {
        this.breathTimer = 0;
        const isBoss = nearest === boss;
        const dmg = this.damage * (isBoss ? 0.35 : 1.0) * mult;
        nearest.takeDamage(dmg, nearest.x, nearest.y, combatSystem, vfx, audio, camera);
        if (vfx) {
          vfx.addShockwave(this.x + this.facing * 25, this.y + 6, 75, 0.32, '#a288e3', false);
        }
      }
    }

    // Sinuous flying swoop
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.vx += (dx * 1.5 - this.vx) * 3 * dt;
    this.vy += (dy * 1.5 - this.vy + Math.sin(this.animTimer * 2) * 25) * 3 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Update body segments
    this.segments[0] = { x: this.x, y: this.y };
    for (let i = 1; i < this.segments.length; i++) {
      const prev = this.segments[i - 1];
      const cur = this.segments[i];
      const segDx = prev.x - cur.x;
      const segDy = prev.y - cur.y;
      const dist = Math.hypot(segDx, segDy);
      if (dist > 9) {
        cur.x += (segDx / dist) * (dist - 9);
        cur.y += (segDy / dist) * (dist - 9);
      }
    }
  }

  roar() {
    this.buffTimer = 6.0;
  }

  render(ctx) {
    if (this.dead) return;
    const fade = Math.min(1, this.lifetime * 1.5);
    ctx.save();
    ctx.globalAlpha = fade;

    ctx.shadowColor = '#a288e3';
    ctx.shadowBlur = 8;

    // Draw spine segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const r = Math.max(3, 8 * (1 - i / this.segments.length));
      ctx.fillStyle = i % 2 === 0 ? '#1b142e' : '#3d2c6b';
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Bone rib spikes
      ctx.strokeStyle = '#e6dcff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(seg.x, seg.y - r - 4);
      ctx.lineTo(seg.x, seg.y + r + 4);
      ctx.stroke();
    }

    // Dragon Skull Head
    const head = this.segments[0];
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.scale(this.facing, 1);

    ctx.fillStyle = '#f4f1ff';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    // Glowing Violet Eye
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.arc(2, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bone Horns
    ctx.strokeStyle = '#a288e3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.lineTo(-8, -12);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}

export class HollowReaper {
  constructor(x, y, level = 1) {
    this.name = 'Hollow Reaper';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.width = 24;
    this.height = 36;
    this.lifetime = 12.0;
    this.maxLife = 12.0;
    this.dead = false;
    this.damage = 34 * level;
    this.slashTimer = 0;
    this.buffTimer = 0;
    this.animTimer = 0;
  }

  update(dt, enemies, boss, combatSystem, vfx, audio, camera) {
    this.lifetime -= dt;
    this.animTimer += dt * 3;
    if (this.buffTimer > 0) this.buffTimer -= dt;
    this.slashTimer += dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const mult = this.buffTimer > 0 ? 1.45 : 1.0;
    const targets = [...enemies];
    if (boss && !boss.isDead) targets.push(boss);
    const aliveTargets = targets.filter(t => !t.isDead);

    if (aliveTargets.length > 0) {
      const nearest = aliveTargets[0];
      this.facing = nearest.x > this.x ? 1 : -1;
      const dx = nearest.x - this.x;
      const dy = nearest.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 30) {
        this.vx += ((dx / dist) * 160 - this.vx) * 3 * dt;
        this.vy += ((dy / dist) * 100 - this.vy) * 3 * dt;
      } else {
        this.vx *= 0.8;
        this.vy *= 0.8;

        if (this.slashTimer > 0.65) {
          this.slashTimer = 0;
          const isBoss = nearest === boss;
          const dmg = this.damage * (isBoss ? 0.4 : 1.0) * mult;
          nearest.takeDamage(dmg, nearest.x, nearest.y, combatSystem, vfx, audio, camera);
          if (vfx) {
            vfx.addSlashArc(this.x + this.facing * 18, this.y, this.facing, 2, true);
          }
          if (camera) camera.shake(3.5, 0.15);
        }
      }
    } else {
      this.vx = Math.sin(this.animTimer) * 25;
      this.vy = Math.cos(this.animTimer) * 12;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  roar() {
    this.buffTimer = 6.0;
  }

  render(ctx) {
    if (this.dead) return;
    const fade = Math.min(1, this.lifetime * 1.5);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);
    ctx.globalAlpha = fade;

    const floatY = Math.sin(this.animTimer * 4) * 4;

    // Tattered dark shroud
    ctx.fillStyle = '#0f0a1c';
    ctx.shadowColor = '#ff2255';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, floatY - 24);
    ctx.lineTo(12, floatY + 14);
    ctx.lineTo(-12, floatY + 14);
    ctx.closePath();
    ctx.fill();

    // Dark Hood
    ctx.fillStyle = '#1c1233';
    ctx.beginPath();
    ctx.arc(0, floatY - 20, 9, 0, Math.PI * 2);
    ctx.fill();

    // Faceless void + Glowing Red Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(2, floatY - 20, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.arc(3, floatY - 21, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Giant Curved Scythe
    ctx.strokeStyle = '#4a3d6b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, floatY + 16);
    ctx.lineTo(8, floatY - 32);
    ctx.stroke();

    // Crescent Scythe Blade
    ctx.fillStyle = '#e6dcff';
    ctx.shadowColor = '#ff2255';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(8, floatY - 32, 16, -Math.PI * 0.35, Math.PI * 0.45);
    ctx.lineTo(8, floatY - 32);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class AbyssTitan {
  constructor(x, y, level = 1) {
    this.name = 'Abyss Titan';
    this.x = x;
    this.y = y;
    this.facing = 1;
    this.lifetime = 7.5; // Short duration powerhouse
    this.maxLife = 7.5;
    this.dead = false;
    this.damage = 50 * level;
    this.slamTimer = 0;
    this.buffTimer = 0;
    this.riseProgress = 0;
  }

  update(dt, enemies, boss, combatSystem, vfx, audio, camera) {
    this.lifetime -= dt;
    if (this.riseProgress < 1) this.riseProgress += dt * 3;
    if (this.buffTimer > 0) this.buffTimer -= dt;
    this.slamTimer += dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const mult = this.buffTimer > 0 ? 1.4 : 1.0;
    const targets = [...enemies];
    if (boss && !boss.isDead) targets.push(boss);

    // Colossal fist slam every 1.4s
    if (this.slamTimer >= 1.4) {
      this.slamTimer = 0;
      if (camera) camera.shake(8, 0.35);
      if (vfx) {
        vfx.addGroundCrack(this.x, this.y, 70, 3.0);
        vfx.addShockwave(this.x, this.y, 110, 0.45, '#ff2255', true);
      }
      for (const t of targets) {
        if (t.isDead) continue;
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d < 120) {
          const isBoss = t === boss;
          const dmg = this.damage * (isBoss ? 0.35 : 1.0) * mult;
          t.takeDamage(dmg, t.x, t.y, combatSystem, vfx, audio, camera);
          t.vy = -160;
        }
      }
    }
  }

  roar() {
    this.buffTimer = 6.0;
  }

  render(ctx) {
    if (this.dead) return;
    const fade = Math.min(1, this.lifetime * 1.5);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = fade * Math.min(1, this.riseProgress);

    const riseOffset = (1 - this.riseProgress) * 40;

    // Colossal Stone Shoulders & Torso
    ctx.fillStyle = '#140c24';
    ctx.shadowColor = '#ff2255';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-24, -40 + riseOffset, 48, 40, 8);
    ctx.fill();

    // Colossal Head & Horns
    ctx.fillStyle = '#22143b';
    ctx.beginPath();
    ctx.arc(0, -48 + riseOffset, 16, 0, Math.PI * 2);
    ctx.fill();

    // Giant Glowing Horns
    ctx.strokeStyle = '#ff2255';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -56 + riseOffset);
    ctx.lineTo(-24, -75 + riseOffset);
    ctx.moveTo(10, -56 + riseOffset);
    ctx.lineTo(24, -75 + riseOffset);
    ctx.stroke();

    // Glowing Eye Slits
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(-8, -50 + riseOffset, 5, 2.5);
    ctx.fillRect(3, -50 + riseOffset, 5, 2.5);

    // Giant Stone Fists
    const slamOffset = Math.sin(this.slamTimer * 4.5) > 0 ? 12 : 0;
    ctx.fillStyle = '#311d52';
    ctx.beginPath();
    ctx.arc(-26, -10 + riseOffset + slamOffset, 12, 0, Math.PI * 2);
    ctx.arc(26, -10 + riseOffset + slamOffset, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class SkeletonLegion {
  constructor(x, y, level = 1) {
    this.name = 'Skeleton Legion';
    this.x = x;
    this.y = y;
    this.lifetime = 12.0;
    this.maxLife = 12.0;
    this.dead = false;
    this.damage = 14 * level;
    this.buffTimer = 0;
    this.soldiers = Array.from({ length: 5 }, (_, i) => ({
      x: x + (i - 2) * 14,
      y: y,
      vx: 0,
      facing: 1,
      attackCooldown: Math.random() * 0.4,
      animTimer: Math.random() * 10
    }));
  }

  update(dt, enemies, boss, combatSystem, vfx, audio, camera) {
    this.lifetime -= dt;
    if (this.buffTimer > 0) this.buffTimer -= dt;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    const mult = this.buffTimer > 0 ? 1.4 : 1.0;
    const targets = [...enemies];
    if (boss && !boss.isDead) targets.push(boss);
    const aliveTargets = targets.filter(t => !t.isDead);

    for (const s of this.soldiers) {
      s.animTimer += dt * 10;
      if (s.attackCooldown > 0) s.attackCooldown -= dt;

      if (aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        s.facing = target.x > s.x ? 1 : -1;
        const dx = target.x - s.x;
        const dist = Math.abs(dx);

        if (dist > 14) {
          s.vx = (dx > 0 ? 1 : -1) * 120 * mult;
        } else {
          s.vx = 0;
          if (s.attackCooldown <= 0) {
            s.attackCooldown = 0.45;
            const isBoss = target === boss;
            const dmg = this.damage * (isBoss ? 0.35 : 1.0) * mult;
            target.takeDamage(dmg, target.x, target.y, combatSystem, vfx, audio, camera);
            if (vfx) vfx.addSlashArc(s.x, s.y - 8, s.facing, 0, false);
          }
        }
      } else {
        s.vx = Math.sin(s.animTimer) * 30;
      }

      s.x += s.vx * dt;
    }
  }

  roar() {
    this.buffTimer = 6.0;
  }

  render(ctx) {
    if (this.dead) return;
    const fade = Math.min(1, this.lifetime * 1.5);
    ctx.save();
    ctx.globalAlpha = fade;

    for (const s of this.soldiers) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(s.facing, 1);

      const runBob = Math.sin(s.animTimer) * 2;

      // Skull
      ctx.fillStyle = '#f4f1ff';
      ctx.beginPath();
      ctx.arc(0, -14 + runBob, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye sockets
      ctx.fillStyle = '#ff2255';
      ctx.fillRect(1, -15 + runBob, 1.5, 1.5);

      // Ribcage
      ctx.strokeStyle = '#e6dcff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -10 + runBob);
      ctx.lineTo(0, -2 + runBob);
      ctx.moveTo(-3, -7 + runBob);
      ctx.lineTo(3, -7 + runBob);
      ctx.stroke();

      // Bone Sword
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, -6 + runBob);
      ctx.lineTo(10, -12 + runBob);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}
