export class CombatDummy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 28;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.will = 30;
    this.isDead = false;
    this.hitFlashTimer = 0;
    this.wobble = 0;
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
    this.wobble = 0.4;
  }

  takeDamage(amount, hitX, hitY, combatSystem, vfx, audioSystem, camera) {
    this.hp -= amount;
    this.hitFlashTimer = 0.12;
    this.wobble = 0.35;

    if (combatSystem) {
      combatSystem.registerHit(amount, this.x, this.y - this.height / 2, amount >= 30, vfx, audioSystem, camera);
    }

    if (this.hp <= 0) {
      // Dummy resets its health so player can keep practicing infinitely
      this.hp = this.maxHp;
      if (combatSystem) {
        combatSystem.registerKill(this.x, this.y - this.height / 2, vfx, audioSystem, camera);
      }
    }
  }

  dieToAura(combatSystem, vfx, particleSystem, audioSystem, camera) {
    this.takeDamage(50, this.x, this.y, combatSystem, vfx, audioSystem, camera);
  }

  update(player, particleSystem, audioSystem, dt) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    this.wobble *= Math.pow(0.85, dt * 60);

    // Damping knockback
    this.vx *= Math.pow(0.85, dt * 60);
    this.x += this.vx * dt;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(Date.now() * 0.02) * this.wobble);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore();
      return;
    }

    // Wooden post base
    ctx.fillStyle = '#3a271d';
    ctx.fillRect(-3, -this.height, 6, this.height);

    // Straw body
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(-this.width / 2, -this.height + 6, this.width, 14);

    // Practice target cross
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -this.height + 13, 4, 0, Math.PI * 2);
    ctx.moveTo(-5, -this.height + 13);
    ctx.lineTo(5, -this.height + 13);
    ctx.moveTo(0, -this.height + 8);
    ctx.lineTo(0, -this.height + 18);
    ctx.stroke();

    // Wooden dummy head
    ctx.fillStyle = '#533927';
    ctx.beginPath();
    ctx.arc(0, -this.height - 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
