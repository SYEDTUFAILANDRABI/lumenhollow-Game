export class CrowWraith {
  constructor(x, y, patrolRange = 80) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.patrolRange = patrolRange;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.radius = 12;

    this.hp = 45;
    this.maxHp = 45;
    this.will = 45;
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;

    this.state = 'HOVER'; // 'HOVER', 'TELEGRAPH', 'SWOOP', 'RETURN'
    this.stateTimer = 0;
    this.wingTimer = Math.random() * 10;
    this.swoopTargetX = 0;
    this.swoopTargetY = 0;
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
    this.state = 'RETURN';
    this.stateTimer = duration;
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audioSystem, camera) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y, amount >= 30, vfx, audioSystem, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audioSystem, camera);
    }
  }

  dieToAura(combatSystem, vfx, particleSystem, audioSystem, camera) {
    this.takeDamage(45, this.x, this.y, combatSystem, vfx, audioSystem, camera);
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
      this.vy += 400 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      return;
    }

    this.wingTimer += dt * 14;

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.isStunned = false;
    }

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dist = Math.hypot(px - this.x, py - this.y);

    if (!this.isStunned) {
      switch (this.state) {
        case 'HOVER': {
          const hoverX = this.startX + Math.sin(Date.now() * 0.002) * this.patrolRange;
          const hoverY = this.startY + Math.cos(Date.now() * 0.003) * 12;
          this.vx += (hoverX - this.x) * 2 * dt;
          this.vy += (hoverY - this.y) * 2 * dt;
          this.facing = px > this.x ? 1 : -1;

          if (dist < 150) {
            this.state = 'TELEGRAPH';
            this.stateTimer = 0.45;
            this.swoopTargetX = px;
            this.swoopTargetY = py;
            if (audioSystem) audioSystem.playWraithScreech();
          }
          break;
        }

        case 'TELEGRAPH': {
          this.stateTimer -= dt;
          this.vx *= 0.8;
          this.vy *= 0.8;
          if (this.stateTimer <= 0) {
            this.state = 'SWOOP';
            this.stateTimer = 0.55;
            const angle = Math.atan2(this.swoopTargetY - this.y, this.swoopTargetX - this.x);
            const speed = 190;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
          }
          break;
        }

        case 'SWOOP': {
          this.stateTimer -= dt;

          // Hit detection on player
          if (!player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
            const pBox = { x: player.x, y: player.y, width: player.width, height: player.height };
            if (this.x >= pBox.x - 6 && this.x <= pBox.x + pBox.width + 6 &&
                this.y >= pBox.y - 6 && this.y <= pBox.y + pBox.height + 6) {
              if (player.isParrying()) {
                this.applyStun(1.4);
                this.vx = -this.vx;
                this.vy = -120;
              } else {
                player.die(particleSystem, null, audioSystem);
              }
            }
          }

          if (this.stateTimer <= 0) {
            this.state = 'RETURN';
            this.stateTimer = 1.0;
          }
          break;
        }

        case 'RETURN': {
          this.stateTimer -= dt;
          const dx = this.startX - this.x;
          const dy = this.startY - this.y;
          this.vx += (dx * 1.5 - this.vx) * 3 * dt;
          this.vy += (dy * 1.5 - this.vy) * 3 * dt;
          if (this.stateTimer <= 0) {
            this.state = 'HOVER';
          }
          break;
        }
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.isDead && this.deathTimer <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Wing flap scale
    const wingY = Math.sin(this.wingTimer) * 8;

    // Dark feathered wings
    ctx.fillStyle = '#1c1328';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-18, -10 + wingY);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(16, -12 + wingY);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#2d1b3e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Sharp beak
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(12, 0);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

    // Glowing eye
    ctx.fillStyle = this.state === 'TELEGRAPH' ? '#ff2255' : '#7be0ad';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
