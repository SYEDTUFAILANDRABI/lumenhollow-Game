export class HollowKnight {
  constructor(x, y, patrolDistance = 70) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.patrolDistance = patrolDistance;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.width = 18;
    this.height = 28;

    // Combat stats
    this.hp = 85;
    this.maxHp = 85;
    this.will = 65; // Medium will
    this.isDead = false;
    this.deathTimer = 0;
    this.isStunned = false;
    this.stunTimer = 0;
    this.hitFlashTimer = 0;

    // AI & Attack state
    this.state = 'PATROL'; // 'PATROL', 'WINDUP', 'ATTACK', 'RECOVERY'
    this.stateTimer = 0;
    this.attackRange = 40;
    this.windupDuration = 0.55;
    this.attackDuration = 0.22;
    this.recoveryDuration = 0.70;
    this.attackActive = false;
    this.rotation = 0;
    this.spinSpeed = 0;
  }

  getHurtbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  applyStun(duration) {
    this.isStunned = true;
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.state = 'RECOVERY';
    this.stateTimer = duration;
    this.attackActive = false;
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audioSystem, camera) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.12;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 30, vfx, audioSystem, camera);
    }

    if (this.hp <= 0) {
      this.die(combatSystem, vfx, null, audioSystem, camera);
    }
  }

  dieToAura(combatSystem, vfx, particleSystem, audioSystem, camera) {
    this.takeDamage(60, this.x, this.y, combatSystem, vfx, audioSystem, camera);
  }

  die(combatSystem, vfx, particleSystem, audioSystem, camera) {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0.55;
    this.attackActive = false;
    this.spinSpeed = (Math.random() - 0.5) * 12;
    this.vx = (Math.random() - 0.5) * 140;
    this.vy = -180;
    if (combatSystem) {
      combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audioSystem, camera);
    }
  }

  update(player, particleSystem, audioSystem, dt) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (this.isDead) {
      this.deathTimer -= dt;
      this.rotation += this.spinSpeed * dt;
      this.vy += 650 * dt;
      this.vx *= Math.pow(0.96, dt * 60);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      return;
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const distToPlayer = Math.hypot(px - this.x, py - (this.y - this.height / 2));

    // Turn toward player if close
    if (distToPlayer < 140) {
      this.facing = px > this.x ? 1 : -1;
    }

    // State machine
    if (!this.isStunned) {
      switch (this.state) {
        case 'PATROL': {
          if (distToPlayer < this.attackRange) {
            this.state = 'WINDUP';
            this.stateTimer = this.windupDuration;
            this.vx = 0;
            if (audioSystem) audioSystem.playKnightTelegraph();
          } else {
            // Patrol slow walk
            const targetX = this.startX + Math.sin(Date.now() * 0.0015) * this.patrolDistance;
            this.facing = targetX > this.x ? 1 : -1;
            this.vx = this.facing * 28;
          }
          break;
        }

        case 'WINDUP': {
          this.stateTimer -= dt;
          this.vx = 0;
          if (this.stateTimer <= 0) {
            this.state = 'ATTACK';
            this.stateTimer = this.attackDuration;
            this.attackActive = true;
            this.vx = this.facing * 90; // forward lunge
            if (audioSystem) audioSystem.playKnightSlash();
          }
          break;
        }

        case 'ATTACK': {
          this.stateTimer -= dt;
          // Check attack hit on player
          if (this.attackActive && !player.isDead && player.invulnerableTimer <= 0 && !player.isDashing) {
            const swordBox = {
              x: this.x + (this.facing === 1 ? 0 : -32),
              y: this.y - this.height - 4,
              width: 32,
              height: this.height + 8
            };
            const pBox = { x: player.x, y: player.y, width: player.width, height: player.height };

            if (this.boxesIntersect(swordBox, pBox)) {
              if (player.isParrying()) {
                // Parried by player!
                this.applyStun(1.5);
                this.attackActive = false;
                this.vx = -this.facing * 80;
              } else {
                this.attackActive = false;
                player.die(particleSystem, null, audioSystem);
              }
            }
          }

          if (this.stateTimer <= 0) {
            this.state = 'RECOVERY';
            this.stateTimer = this.recoveryDuration;
            this.attackActive = false;
          }
          break;
        }

        case 'RECOVERY': {
          this.stateTimer -= dt;
          this.vx *= Math.pow(0.85, dt * 60);
          if (this.stateTimer <= 0) {
            this.state = 'PATROL';
          }
          break;
        }
      }
    }

    // Apply movement
    this.vx *= Math.pow(0.88, dt * 60);
    this.x += this.vx * dt;
  }

  boxesIntersect(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  render(ctx) {
    if (this.isDead && this.deathTimer <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.facing, 1);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Armor Cape
    ctx.fillStyle = '#1c142b';
    ctx.beginPath();
    ctx.moveTo(-6, -this.height + 8);
    ctx.lineTo(4, -this.height + 8);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();

    // Armored Legs
    ctx.fillStyle = '#2d2847';
    ctx.fillRect(-6, -10, 5, 10);
    ctx.fillRect(1, -10, 5, 10);

    // Armored Torso / Breastplate
    ctx.fillStyle = '#3e385c';
    ctx.fillRect(-7, -this.height + 6, 14, 14);

    // Steel helm & visor
    ctx.fillStyle = '#4f4870';
    ctx.beginPath();
    ctx.arc(0, -this.height + 4, 7, 0, Math.PI * 2);
    ctx.fill();

    // Visor slit
    ctx.fillStyle = this.isStunned ? '#ffd98a' : (this.state === 'WINDUP' ? '#ff2255' : '#7be0ad');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.fillRect(1, -this.height + 3, 5, 1.8);
    ctx.shadowBlur = 0;

    // Greatsword
    ctx.save();
    if (this.state === 'WINDUP') {
      // Raised sword back
      ctx.translate(-4, -this.height + 6);
      ctx.rotate(-Math.PI * 0.45);
      // Warning gleam spark
      ctx.fillStyle = '#ff2255';
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -22, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === 'ATTACK') {
      // Slashed sword forward
      ctx.translate(8, -this.height + 12);
      ctx.rotate(Math.PI * 0.35);
    } else {
      // Resting sword
      ctx.translate(6, -this.height + 10);
      ctx.rotate(Math.PI * 0.1);
    }

    // Blade
    ctx.fillStyle = '#9c92b8';
    ctx.fillRect(-2, -24, 4, 24);
    ctx.fillStyle = '#d4af37'; // Crossguard
    ctx.fillRect(-5, 0, 10, 3);
    ctx.fillStyle = '#221a14'; // Hilt
    ctx.fillRect(-1.5, 3, 3, 6);
    ctx.restore();

    ctx.restore();
  }
}
