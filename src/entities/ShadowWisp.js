export class ShadowWisp {
  constructor(x, y, patrolDistance = 60) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.patrolDistance = patrolDistance;
    this.vx = 0;
    this.vy = 0;

    this.radius = 11;
    this.currentScale = 1;
    this.isStunned = false;
    this.stunTimer = 0;

    // Combat stats
    this.hp = 25;
    this.maxHp = 25;
    this.will = 20; // Low will - dissolves in Sovereign's Aura!
    this.isDead = false;
    this.faintingAura = false;
    this.deathTimer = 0;
    this.hitFlashTimer = 0;

    this.timer = Math.random() * 20;
    this.tailPoints = [];
  }

  getHurtbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audioSystem, camera) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;
    this.applyStun(0.35);

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y, amount >= 30, vfx, audioSystem, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audioSystem, camera);
    }
  }

  dieToAura(combatSystem, vfx, particleSystem, audioSystem, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.faintingAura = true;
    this.deathTimer = 0.4;
    this.isStunned = true;
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y, vfx, audioSystem, camera);
    }
    if (particleSystem) {
      particleSystem.emitDarkDissipate(this.x, this.y);
    }
  }

  die(combatSystem, vfx, particleSystem, audioSystem, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0.35;
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y, vfx, audioSystem, camera);
    }
  }

  update(player, particleSystem, audioSystem, dt) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (this.isDead) {
      this.deathTimer -= dt;
      this.currentScale = Math.max(0, this.currentScale - 2.5 * dt);
      return;
    }

    this.timer += dt;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }

    // Distance to player lantern
    const lPos = player.getLanternWorldPos();
    const dx = lPos.x - this.x;
    const dy = lPos.y - this.y;
    const distToLight = Math.sqrt(dx * dx + dy * dy);

    const inLight = distToLight < player.currentLightRadius;
    const inPulse = player.isPulsing && distToLight < (player.currentLightRadius + 20);

    if (inPulse) {
      this.isStunned = true;
      this.stunTimer = 1.4;
      const repelAngle = Math.atan2(this.y - lPos.y, this.x - lPos.x);
      this.vx = Math.cos(repelAngle) * 90;
      this.vy = Math.sin(repelAngle) * 90;
      this.currentScale = 0.55;

      if (particleSystem && Math.random() < 0.4) {
        particleSystem.emitDarkDissipate(this.x, this.y);
      }
    } else if (inLight) {
      const fleeAngle = Math.atan2(this.y - lPos.y, this.x - lPos.x);
      const fleeSpeed = 40;
      this.vx += (Math.cos(fleeAngle) * fleeSpeed - this.vx) * 3 * dt;
      this.vy += (Math.sin(fleeAngle) * fleeSpeed - this.vy) * 3 * dt;
      this.currentScale += (0.65 - this.currentScale) * 4 * dt;
    } else {
      this.currentScale += (1.0 - this.currentScale) * 2 * dt;
      if (!this.isStunned) {
        const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };
        const pdx = playerCenter.x - this.x;
        const pdy = playerCenter.y - this.y;
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

        const waveX = Math.sin(this.timer * 3) * 15;
        const waveY = Math.cos(this.timer * 2.2) * 15;

        if (pDist < 180) {
          const speed = 32;
          this.vx += ((pdx / pDist) * speed + waveX * 0.4 - this.vx) * 2 * dt;
          this.vy += ((pdy / pDist) * speed + waveY * 0.4 - this.vy) * 2 * dt;
        } else {
          const targetX = this.startX + Math.sin(this.timer * 0.8) * this.patrolDistance;
          const targetY = this.startY + Math.cos(this.timer * 1.1) * 12;
          this.vx += (targetX - this.x) * 1.5 * dt;
          this.vy += (targetY - this.y) * 1.5 * dt;
        }
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.tailPoints.length === 0 || Math.hypot(this.tailPoints[0].x - this.x, this.tailPoints[0].y - this.y) > 4) {
      this.tailPoints.unshift({ x: this.x, y: this.y, alpha: 1 });
      if (this.tailPoints.length > 7) {
        this.tailPoints.pop();
      }
    }

    // Collision with player
    if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
      const pcx = player.x + player.width / 2;
      const pcy = player.y + player.height / 2;
      const cDist = Math.hypot(pcx - this.x, pcy - this.y);
      if (cDist < (this.radius * this.currentScale + 6)) {
        if (player.isParrying()) {
          // Player parries wisp
          this.applyStun(1.2);
          this.vx = -this.vx * 2;
          this.vy = -this.vy * 2;
        } else {
          player.die(particleSystem, null, audioSystem);
        }
      }
    }
  }

  render(ctx) {
    if (this.isDead && this.currentScale <= 0.05) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.currentScale, this.currentScale);

    // Ghostly trailing wisps
    for (let i = 0; i < this.tailPoints.length; i++) {
      const p = this.tailPoints[i];
      const relX = p.x - this.x;
      const relY = p.y - this.y;
      const tailR = Math.max(1, this.radius * (1 - i / this.tailPoints.length) * 0.7);
      ctx.fillStyle = this.faintingAura ? `rgba(100, 100, 100, ${0.3 * (1 - i / this.tailPoints.length)})` : `rgba(32, 18, 56, ${0.4 * (1 - i / this.tailPoints.length)})`;
      ctx.beginPath();
      ctx.arc(relX, relY, tailR, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Outer dark aura
    const outerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius + 4);
    if (this.faintingAura) {
      outerGrad.addColorStop(0, 'rgba(80, 80, 80, 0.8)');
      outerGrad.addColorStop(1, 'rgba(30, 30, 30, 0)');
    } else {
      outerGrad.addColorStop(0, 'rgba(40, 20, 68, 0.9)');
      outerGrad.addColorStop(0.6, 'rgba(15, 10, 30, 0.7)');
      outerGrad.addColorStop(1, 'rgba(15, 10, 30, 0)');
    }
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.faintingAura ? '#404040' : '#100b20';
    ctx.beginPath();
    const tentacles = 6;
    for (let i = 0; i < tentacles; i++) {
      const angle = (i / tentacles) * Math.PI * 2 + this.timer * 2;
      const r = this.radius + Math.sin(this.timer * 4 + i) * 2.5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Eye
    const eyeColor = this.faintingAura ? '#888888' : (this.isStunned ? '#ff8fab' : '#a288e3');
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, -1, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
