import { PHYSICS, LANTERN, COLORS } from '../core/Constants.js';
import { COMBAT } from '../systems/combat/CombatConstants.js';
import { Projectile } from '../systems/combat/Projectile.js';

export class Player {
  constructor(x = 100, y = 100) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 12;
    this.height = 18;

    // Facing direction: 1 = right, -1 = left
    this.facing = 1;

    // Ground & jump mechanics
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.isJumping = false;

    // Squash & Stretch
    this.scaleX = 1;
    this.scaleY = 1;

    // Animation states
    this.animTimer = 0;
    this.cloakSway = 0;
    this.lanternAngle = 0;
    this.lanternAngularVel = 0;
    this.stepTimer = 0;

    // Lantern pulse & energy
    this.energy = LANTERN.MAX_ENERGY;
    this.isPulsing = false;
    this.pulseProgress = 0;
    this.currentLightRadius = LANTERN.BASE_RADIUS;

    // Checkpoint & Respawn
    this.spawnX = x;
    this.spawnY = y;
    this.isDead = false;
    this.deathTimer = 0;
    this.invulnerableTimer = 0;

    // Jump & Physics extensions
    this.canDoubleJump = true;
    this.isGliding = false;
    this.isWallSliding = false;
    this.wallDir = 0;
    this.airDashAvailable = true;
    this.isFastFalling = false;

    // Aura charging state
    this.isChargingAura = false;
    this.auraChargeTimer = 0;

    // Movement lock for transitions/cutscenes
    this.frozen = false;

    // === Combat States ===
    this.isSlashing = false;
    this.slashCombo = 0;
    this.slashTimer = 0;
    this.slashDuration = 0;
    this.comboResetTimer = 0;
    this.hitEnemiesThisSlash = new Set();

    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.afterimageTimer = 0;
    this.dashedEnemies = new Set();

    this.isPlunging = false;
    this.plungeAirTime = 0;

    this.isEclipseForm = false;
    this.eclipseFormTimer = 0;
  }

  setSpawn(x, y) {
    this.spawnX = x;
    this.spawnY = y;
  }

  respawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.deathTimer = 0;
    this.invulnerableTimer = 1.2;
    this.scaleX = 0.6;
    this.scaleY = 1.4;
    this.energy = LANTERN.MAX_ENERGY;
    this.canDoubleJump = true;
    this.isGliding = false;
    this.isWallSliding = false;
    this.airDashAvailable = true;
    this.isFastFalling = false;
    this.isChargingAura = false;
    this.isSlashing = false;
    this.isDashing = false;
    this.isPlunging = false;
  }

  die(particleSystem, camera, audioSystem) {
    if (this.isDead || this.invulnerableTimer > 0 || this.isDashing) return;
    this.isDead = true;
    this.deathTimer = 0.55;
    this.isSlashing = false;
    this.isDashing = false;
    this.isPlunging = false;
    if (camera) camera.shake(5, 0.3);
    if (audioSystem) audioSystem.playDissolve();
    if (particleSystem) {
      particleSystem.emitDeathBurst(this.x + this.width / 2, this.y + this.height / 2);
    }
  }

  enterEclipseForm(duration) {
    this.isEclipseForm = true;
    this.eclipseFormTimer = duration;
    this.scaleX = 1.2;
    this.scaleY = 1.2;
  }

  exitEclipseForm() {
    this.isEclipseForm = false;
    this.eclipseFormTimer = 0;
  }

  isParrying() {
    if (!this.isSlashing) return false;
    const elapsed = this.slashDuration - this.slashTimer;
    return elapsed <= COMBAT.PARRY.WINDOW;
  }

  update(input, tileMap, particleSystem, audioSystem, camera, combatSystem, vfx, enemies, boss, dt, shardUpgrades = {}) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.isDead) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.respawn();
      }
      return;
    }

    if (this.frozen) {
      this.vx = 0;
      this.vy += PHYSICS.GRAVITY * dt;
      if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;
      this.resolveVerticalCollisions(tileMap, dt);
      return;
    }

    // Eclipse Form countdown
    if (this.isEclipseForm) {
      this.eclipseFormTimer -= dt;
      if (this.eclipseFormTimer <= 0) {
        this.exitEclipseForm();
      }
      // Shed embers
      if (particleSystem && Math.random() < 0.3) {
        const lx = this.x + (Math.random() - 0.5) * 12;
        const ly = this.y + Math.random() * 16;
        particleSystem.emitLanternSpark(lx, ly);
      }
    }

    // Cooldown updates
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.slashCombo = 0;
      }
    }

    // --- Combat Input: Sovereign's Aura (Hold Q for Goosebumps build-up) ---
    if ((input.actions.auraHold || input.actions.auraJustPressed) && combatSystem && combatSystem.isAuraReady()) {
      if (!this.isChargingAura) {
        this.isChargingAura = true;
        this.auraChargeTimer = 0;
        if (audioSystem) audioSystem.playAuraBuildUp();
      }
      this.auraChargeTimer += dt;

      // Build-up feedback: upward debris/leaves, camera trembling, lantern flicker
      if (camera) camera.shake(1.4, 0.05);
      if (particleSystem) particleSystem.emitAuraChargeParticles(this.x + this.width / 2, this.y + this.height, 70);
      this.lanternAngle += (Math.random() - 0.5) * 0.45;
      if (vfx) vfx.auraBuildUpProgress = Math.min(1, this.auraChargeTimer / COMBAT.ECLIPSE.AURA_CHARGE_TIME);

      // Heartbeat pulse at 0.35s
      if (Math.abs(this.auraChargeTimer - 0.35) < dt && audioSystem) {
        audioSystem.playHeartbeat(0.5);
      }

      // Check if fully charged: automatically release the goosebumps explosion!
      if (this.auraChargeTimer >= COMBAT.ECLIPSE.AURA_CHARGE_TIME) {
        combatSystem.triggerSovereignAura(this, enemies, boss, vfx, particleSystem, audioSystem, camera, shardUpgrades, this.auraChargeTimer);
        this.isChargingAura = false;
        this.auraChargeTimer = 0;
        if (vfx) vfx.auraBuildUpProgress = 0;
      }
    } else if (this.isChargingAura) {
      // Released Q: if charged enough or pressed, trigger aura!
      if (this.auraChargeTimer >= 0.20 && combatSystem && combatSystem.isAuraReady()) {
        combatSystem.triggerSovereignAura(this, enemies, boss, vfx, particleSystem, audioSystem, camera, shardUpgrades, this.auraChargeTimer);
      }
      this.isChargingAura = false;
      this.auraChargeTimer = 0;
      if (vfx) vfx.auraBuildUpProgress = 0;
      if (audioSystem) audioSystem.setMuffle(false);
    }

    // --- Combat Input: Lantern Slash (J) ---
    if (input.actions.slashJustPressed && !this.isDashing && !this.isPlunging) {
      this.initiateSlash(combatSystem, vfx, audioSystem, camera, shardUpgrades);
    }

    // --- Combat Input: Umbral Bolt (L) ---
    if (input.actions.boltJustPressed && !this.isDashing && !this.isPlunging) {
      this.initiateBolt(combatSystem, vfx, audioSystem, particleSystem, shardUpgrades);
    }

    // --- Combat Input: Shadow Dash (C / Left Ctrl) ---
    if (input.actions.dashJustPressed && !this.isDashing && this.dashCooldown <= 0) {
      this.initiateDash(vfx, audioSystem, shardUpgrades);
    }

    // --- Combat Input: Void Plunge (Down + S while in air) ---
    if ((input.actions.plungeJustPressed || (input.actions.down && input.actions.jumpJustPressed)) && !this.isGrounded && !this.isPlunging) {
      this.initiatePlunge(audioSystem);
    }

    // Update active Slash
    if (this.isSlashing) {
      this.slashTimer -= dt;
      this.checkSlashHits(combatSystem, vfx, audioSystem, camera, enemies, boss, shardUpgrades);
      if (this.slashTimer <= 0) {
        this.isSlashing = false;
      }
    }

    // Update Shadow Dash
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.afterimageTimer += dt;
      if (this.afterimageTimer >= 0.04) {
        this.afterimageTimer = 0;
        if (vfx) {
          const px = this.x;
          const py = this.y;
          const pf = this.facing;
          const pColor = this.isEclipseForm ? 'rgba(255, 34, 85, 0.45)' : 'rgba(162, 136, 227, 0.45)';
          vfx.addAfterimage(px, py, pf, (ctx, ax, ay, af, ac) => this.drawShadowSilhouette(ctx, ax, ay, af, ac), pColor, 0.32);
        }
      }

      // Check collision with enemies passed through (Delayed cuts)
      const allTargets = [...enemies];
      if (boss && !boss.isDead) allTargets.push(boss);

      const dBox = { x: this.x - 4, y: this.y - 2, width: this.width + 8, height: this.height + 4 };
      for (const t of allTargets) {
        if (!t.isDead && !this.dashedEnemies.has(t)) {
          const tBox = t.getHurtbox ? t.getHurtbox() : { x: t.x - 10, y: t.y - 10, width: 20, height: 20 };
          if (this.boxesIntersect(dBox, tBox)) {
            this.dashedEnemies.add(t);
            if (combatSystem) {
              combatSystem.delayedCuts.push({
                target: t,
                x: t.x,
                y: t.y,
                timer: COMBAT.DASH.DELAYED_CUT_TIME
              });
            }
          }
        }
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Update Void Plunge
    if (this.isPlunging) {
      this.plungeAirTime += dt;
      this.vy = COMBAT.PLUNGE.FALL_SPEED;
    }

    // --- Lantern Pulse & Energy ---
    const wantsPulse = input.actions.pulse && this.energy > LANTERN.MIN_ENERGY_TO_PULSE;
    if (wantsPulse) {
      this.isPulsing = true;
      this.energy = Math.max(0, this.energy - LANTERN.DRAIN_RATE * dt);
      if (this.energy <= 0) {
        this.isPulsing = false;
      }
    } else {
      this.isPulsing = false;
      this.energy = Math.min(LANTERN.MAX_ENERGY, this.energy + LANTERN.PASSIVE_RECHARGE * dt);
    }

    const targetPulseProgress = this.isPulsing ? 1 : 0;
    this.pulseProgress += (targetPulseProgress - this.pulseProgress) * 9 * dt;
    this.currentLightRadius = LANTERN.BASE_RADIUS + (LANTERN.PULSE_RADIUS - LANTERN.BASE_RADIUS) * this.pulseProgress;

    // --- Movement Physics ---
    if (!this.isDashing) {
      let moveDir = 0;
      if (input.actions.left) moveDir -= 1;
      if (input.actions.right) moveDir += 1;

      const speedMult = this.isEclipseForm ? COMBAT.ECLIPSE.FORM_SPEED_MULT : 1;

      if (moveDir !== 0) {
        this.facing = moveDir;
        const targetSpeed = moveDir * PHYSICS.MOVE_SPEED * speedMult;
        const accel = this.isGrounded ? PHYSICS.ACCELERATION : PHYSICS.AIR_ACCELERATION;
        this.vx += (targetSpeed - this.vx) * Math.min(1, accel * dt / PHYSICS.MOVE_SPEED);
      } else {
        const decel = this.isGrounded ? PHYSICS.DECELERATION : PHYSICS.AIR_DECELERATION;
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - decel * dt);
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + decel * dt);
        }
      }

      // Check for wall slide against solid tiles in air
      this.isWallSliding = false;
      this.wallDir = 0;
      if (!this.isGrounded && this.vy > 0 && moveDir !== 0) {
        const testX = moveDir > 0 ? this.x + this.width + 2 : this.x - 2;
        const checkTileTop = tileMap.getTileAtPixel ? tileMap.getTileAtPixel(testX, this.y + 4) : null;
        const checkTileBottom = tileMap.getTileAtPixel ? tileMap.getTileAtPixel(testX, this.y + this.height - 4) : null;
        const isWall = (checkTileTop && checkTileTop.solid) || (checkTileBottom && checkTileBottom.solid);
        if (isWall) {
          this.isWallSliding = true;
          this.wallDir = moveDir;
          this.canDoubleJump = true;
          this.airDashAvailable = true;
          if (this.vy > PHYSICS.WALL_SLIDE_SPEED) {
            this.vy = PHYSICS.WALL_SLIDE_SPEED;
          }
          if (particleSystem && Math.random() < 0.25) {
            particleSystem.emitWallSlideSparks(this.x + (this.wallDir > 0 ? this.width : 0), this.y + this.height * 0.5, this.wallDir);
          }
        }
      }

      // Ground & Coyote Time
      if (this.isGrounded) {
        this.coyoteTimer = PHYSICS.COYOTE_TIME;
        this.isJumping = false;
        this.canDoubleJump = true;
        this.airDashAvailable = true;
        this.isGliding = false;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }

      // Jump Handling: Ground jump, Wall jump, Double jump
      const canNormalJump = (this.isGrounded || this.coyoteTimer > 0) && !this.isJumping && !this.isPlunging;

      if (input.hasBufferedJump()) {
        if (this.isWallSliding) {
          // Wall Jump: horizontal kick away from wall + vertical rise
          input.consumeBufferedJump();
          this.vx = -this.wallDir * PHYSICS.WALL_JUMP_FORCE_X;
          this.vy = PHYSICS.WALL_JUMP_FORCE_Y;
          this.facing = -this.wallDir;
          this.isWallSliding = false;
          this.isGrounded = false;
          this.canDoubleJump = true;
          this.airDashAvailable = true;
          this.scaleX = 0.75;
          this.scaleY = 1.35;
          if (audioSystem) audioSystem.playJump();
          if (particleSystem) {
            particleSystem.emitJumpPuff(this.x + this.width / 2, this.y + this.height / 2);
          }
        } else if (canNormalJump) {
          // Normal Ground Jump
          input.consumeBufferedJump();
          this.vy = PHYSICS.JUMP_FORCE;
          this.isGrounded = false;
          this.coyoteTimer = 0;
          this.isJumping = true;
          this.canDoubleJump = true;
          this.scaleX = 0.78;
          this.scaleY = 1.32;
          if (audioSystem) audioSystem.playJump();
          if (particleSystem) {
            particleSystem.emitJumpPuff(this.x + this.width / 2, this.y + this.height);
          }
        } else if (this.canDoubleJump && !this.isPlunging) {
          // Double Jump in mid-air
          input.consumeBufferedJump();
          this.vy = PHYSICS.DOUBLE_JUMP_FORCE;
          this.canDoubleJump = false;
          this.airDashAvailable = true;
          this.scaleX = 0.8;
          this.scaleY = 1.35;
          if (audioSystem) audioSystem.playJump();
          if (particleSystem) {
            particleSystem.emitDoubleJumpBurst(this.x + this.width / 2, this.y + this.height);
          }
        }
      }

      // Variable jump height cut on release
      if (input.actions.jumpJustReleased && this.vy < 0 && !this.isPlunging) {
        this.vy *= PHYSICS.JUMP_CUT_MULTIPLIER;
      }

      // Firefly Glide: hold jump while falling in air
      if (!this.isGrounded && !this.isWallSliding && this.vy > 20 && input.actions.jump && !this.isPlunging && !this.isDashing) {
        this.isGliding = true;
        if (this.vy > PHYSICS.GLIDE_FALL_SPEED) {
          this.vy = Math.max(PHYSICS.GLIDE_FALL_SPEED, this.vy - 380 * dt);
        }
        if (particleSystem && Math.random() < 0.25) {
          particleSystem.emitFireflyGlint(this.x + this.width / 2, this.y - 4);
        }
      } else {
        this.isGliding = false;
      }

      // Fast-Fall option: holding down while falling
      const wantsFastFall = (input.actions.down || (input.keys && (input.keys.get('KeyS') || input.keys.get('ArrowDown')))) && !this.isGrounded && this.vy > 0 && !this.isPlunging;

      // Asymmetric Gravity & Apex Hang
      if (!this.isPlunging && !this.isWallSliding) {
        if (this.isGliding) {
          this.vy += PHYSICS.GLIDE_GRAVITY * dt;
          if (this.vy > PHYSICS.GLIDE_FALL_SPEED) this.vy = PHYSICS.GLIDE_FALL_SPEED;
        } else if (this.vy < 0) {
          // Rising: lower gravity + apex hang at crest
          let grav = PHYSICS.GRAVITY_UP;
          if (Math.abs(this.vy) < PHYSICS.APEX_HANG_VELOCITY) {
            grav *= PHYSICS.APEX_HANG_GRAVITY_MULT;
          }
          this.vy += grav * dt;
        } else {
          // Falling: stronger gravity + fast-fall option
          let grav = PHYSICS.GRAVITY_DOWN;
          if (wantsFastFall) {
            this.vy += grav * 1.45 * dt;
            if (this.vy > PHYSICS.FAST_FALL_SPEED) this.vy = PHYSICS.FAST_FALL_SPEED;
          } else {
            this.vy += grav * dt;
            if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;
          }
        }
      }
    }

    // Resolve Collisions
    this.resolveHorizontalCollisions(tileMap, dt);
    this.resolveVerticalCollisions(tileMap, dt);

    // Landing detection (Plunge Impact vs Normal Landing)
    if (!this.wasGrounded && this.isGrounded) {
      if (this.isPlunging) {
        this.handlePlungeImpact(combatSystem, vfx, particleSystem, audioSystem, camera, enemies, boss);
      } else {
        const impactStrength = Math.min(1, Math.abs(this.vy) / PHYSICS.MAX_FALL_SPEED);
        this.scaleX = 1.28 + impactStrength * 0.15;
        this.scaleY = 0.72 - impactStrength * 0.15;
        if (audioSystem) audioSystem.playLand();
        if (particleSystem) {
          particleSystem.emitLandPuff(this.x + this.width / 2, this.y + this.height);
        }
        if (camera && Math.abs(this.vy) > 300) {
          camera.shake(1.8, 0.15);
        }
      }
    }
    this.wasGrounded = this.isGrounded;

    // Squash & Stretch Spring Recovery
    this.scaleX += (1 - this.scaleX) * 12 * dt;
    this.scaleY += (1 - this.scaleY) * 12 * dt;

    // Footstep Dust Puffs & Cloak Sway
    this.animTimer += dt;
    if (this.isGrounded && Math.abs(this.vx) > 20) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.18) {
        this.stepTimer = 0;
        if (particleSystem) {
          particleSystem.emitFootstepDust(this.x + this.width / 2 - this.facing * 4, this.y + this.height);
        }
      }
      this.cloakSway = Math.sin(this.animTimer * 16) * 0.28;
    } else {
      this.stepTimer = 0;
      this.cloakSway = Math.sin(this.animTimer * 3.5) * 0.08;
    }

    // Lantern physics swing
    const targetLanternAngle = (-this.vx / PHYSICS.MOVE_SPEED) * 0.45;
    const springForce = (targetLanternAngle - this.lanternAngle) * 35;
    this.lanternAngularVel += springForce * dt;
    this.lanternAngularVel *= Math.pow(0.88, dt * 60);
    this.lanternAngle += this.lanternAngularVel * dt;

    if (particleSystem && Math.random() < 0.25) {
      const lPos = this.getLanternWorldPos();
      particleSystem.emitLanternSpark(lPos.x, lPos.y);
    }
  }

  initiateSlash(combatSystem, vfx, audioSystem, camera, shardUpgrades) {
    const strikeData = COMBAT.SLASH.STRIKES[this.slashCombo];
    this.isSlashing = true;
    this.slashTimer = strikeData.duration;
    this.slashDuration = strikeData.duration;
    this.comboResetTimer = COMBAT.SLASH.COMBO_RESET_TIME;
    this.hitEnemiesThisSlash.clear();

    if (audioSystem) audioSystem.playSlash(this.slashCombo);

    if (vfx) {
      const lPos = this.getLanternWorldPos();
      vfx.addSlashArc(lPos.x, lPos.y, this.facing, this.slashCombo, this.isEclipseForm);
    }

    // Third strike releases forward shockwave
    if (this.slashCombo === 2 && vfx) {
      const lPos = this.getLanternWorldPos();
      vfx.addShockwave(lPos.x + this.facing * 16, lPos.y, 45, 0.25, '#ffd98a', false);
    }

    this.slashCombo = (this.slashCombo + 1) % COMBAT.SLASH.STRIKES.length;
  }

  checkSlashHits(combatSystem, vfx, audioSystem, camera, enemies, boss, shardUpgrades) {
    const strikeData = COMBAT.SLASH.STRIKES[(this.slashCombo + 2) % 3]; // previous initiated strike
    const mult = this.isEclipseForm ? COMBAT.ECLIPSE.FORM_DAMAGE_MULT : 1;
    const rangeMult = shardUpgrades[0] ? 1.3 : 1.0;
    const slashRange = strikeData.range * rangeMult * (this.isEclipseForm ? COMBAT.ECLIPSE.FORM_SLASH_SCALE : 1);

    const hitCenter = {
      x: this.x + this.width / 2 + this.facing * (slashRange * 0.55),
      y: this.y + this.height / 2
    };

    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const t of allTargets) {
      if (t.isDead || this.hitEnemiesThisSlash.has(t)) continue;

      const tBox = t.getHurtbox ? t.getHurtbox() : { x: t.x - 10, y: t.y - 10, width: 20, height: 20 };
      const tCenter = { x: tBox.x + tBox.width / 2, y: tBox.y + tBox.height / 2 };
      const dist = Math.hypot(hitCenter.x - tCenter.x, hitCenter.y - tCenter.y);

      if (dist < (slashRange * 0.6 + Math.max(tBox.width, tBox.height) / 2)) {
        this.hitEnemiesThisSlash.add(t);
        const dmg = strikeData.damage * mult;
        t.takeDamage(dmg, hitCenter.x, hitCenter.y, combatSystem, vfx, audioSystem, camera);

        // Apply knockback
        t.vx += this.facing * strikeData.knockback * (this.isEclipseForm ? 1.4 : 1.0);
        t.vy -= 40;

        if (combatSystem) {
          combatSystem.triggerHitStop(strikeData.hitStop);
        }
      }
    }
  }

  initiateBolt(combatSystem, vfx, audioSystem, particleSystem, shardUpgrades) {
    if (this.energy < COMBAT.BOLT.ENERGY_COST) return;
    this.energy -= COMBAT.BOLT.ENERGY_COST;

    const lPos = this.getLanternWorldPos();
    const speed = COMBAT.BOLT.SPEED * (this.isEclipseForm ? 1.25 : 1);
    const dmg = COMBAT.BOLT.DAMAGE * (this.isEclipseForm ? COMBAT.ECLIPSE.FORM_DAMAGE_MULT : 1);
    const pColor = this.isEclipseForm ? '#ff2255' : '#a288e3';

    if (combatSystem) {
      combatSystem.projectiles.push(new Projectile(lPos.x, lPos.y, this.facing * speed, 0, {
        damage: dmg,
        isEnemy: false,
        pierce: true,
        color: pColor,
        coreColor: '#ffffff'
      }));
    }

    if (audioSystem) audioSystem.playBolt();
    if (particleSystem) {
      particleSystem.emitLanternSpark(lPos.x, lPos.y);
    }
  }

  initiateDash(vfx, audioSystem, shardUpgrades) {
    if (!this.isGrounded && !this.isWallSliding) {
      if (!this.airDashAvailable) return;
      this.airDashAvailable = false;
    }
    this.isDashing = true;
    const duration = shardUpgrades[2] ? COMBAT.DASH.DURATION * 1.3 : COMBAT.DASH.DURATION;
    this.dashTimer = duration;
    this.dashCooldown = COMBAT.DASH.COOLDOWN;
    this.invulnerableTimer = duration + 0.05;
    this.afterimageTimer = 0;
    this.dashedEnemies.clear();

    const speed = shardUpgrades[2] ? COMBAT.DASH.SPEED * 1.2 : COMBAT.DASH.SPEED;
    this.vx = this.facing * speed;
    this.vy = 0;

    if (audioSystem) audioSystem.playDash();
  }

  initiatePlunge(audioSystem) {
    this.isPlunging = true;
    this.plungeAirTime = 0;
    this.vy = COMBAT.PLUNGE.FALL_SPEED;
    if (audioSystem) audioSystem.playPlungeStart();
  }

  handlePlungeImpact(combatSystem, vfx, particleSystem, audioSystem, camera, enemies, boss) {
    this.isPlunging = false;
    this.scaleX = 1.6;
    this.scaleY = 0.55;

    const px = this.x + this.width / 2;
    const py = this.y + this.height;

    if (camera) camera.shake(7, 0.35);
    if (audioSystem) audioSystem.playPlungeLand();

    if (vfx) {
      vfx.addGroundCrack(px, py, 38, 2.5);
      vfx.addShockwave(px, py, 65, 0.35, '#ff3366', false);
    }

    if (particleSystem) {
      particleSystem.emitLandPuff(px, py);
    }

    // Damage all enemies in plunge radius
    const dmg = COMBAT.PLUNGE.DAMAGE * (this.isEclipseForm ? COMBAT.ECLIPSE.FORM_DAMAGE_MULT : 1);
    const allTargets = [...enemies];
    if (boss && !boss.isDead) allTargets.push(boss);

    for (const t of allTargets) {
      if (t.isDead) continue;
      const dist = Math.hypot(t.x - px, t.y - py);
      if (dist <= COMBAT.PLUNGE.RADIUS) {
        t.takeDamage(dmg, px, py, combatSystem, vfx, audioSystem, camera);
        t.vy = -180; // launch airborne
      }
    }
  }

  rechargeEnergy(amount) {
    this.energy = Math.min(LANTERN.MAX_ENERGY, this.energy + amount);
  }

  getLanternWorldPos() {
    const handOffset = this.facing === 1 ? this.width + 4 : -4;
    const lanternDist = 9;
    const lx = this.x + handOffset + Math.sin(this.lanternAngle) * lanternDist;
    const ly = this.y + 10 + Math.cos(this.lanternAngle) * lanternDist;
    return { x: lx, y: ly };
  }

  boxesIntersect(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  resolveHorizontalCollisions(tileMap, dt) {
    this.x += this.vx * dt;
    const box = { x: this.x, y: this.y, width: this.width, height: this.height };

    if (this.vx < 0) {
      const col = tileMap.checkCollision(box, this.currentLightRadius, this.getLanternWorldPos());
      if (col.collided && col.wallRight !== undefined) {
        this.x = col.wallRight;
        this.vx = 0;
      }
    } else if (this.vx > 0) {
      const col = tileMap.checkCollision(box, this.currentLightRadius, this.getLanternWorldPos());
      if (col.collided && col.wallLeft !== undefined) {
        this.x = col.wallLeft - this.width;
        this.vx = 0;
      }
    }
  }

  resolveVerticalCollisions(tileMap, dt) {
    this.y += this.vy * dt;
    const box = { x: this.x, y: this.y, width: this.width, height: this.height };
    const col = tileMap.checkCollision(box, this.currentLightRadius, this.getLanternWorldPos());

    if (this.vy > 0) {
      if (col.collided && col.ceiling !== undefined) {
        this.y = col.ceiling - this.height;
        this.vy = 0;
        this.isGrounded = true;
        return;
      }
      this.isGrounded = false;
    } else if (this.vy < 0) {
      if (col.collided && col.floor !== undefined) {
        this.y = col.floor;
        this.vy = 0;
      }
      this.isGrounded = false;
    } else {
      const groundCheck = tileMap.checkCollision(
        { x: this.x, y: this.y + 1, width: this.width, height: this.height },
        this.currentLightRadius,
        this.getLanternWorldPos()
      );
      this.isGrounded = groundCheck.collided;
    }
  }

  drawShadowSilhouette(ctx, x, y, facing, color) {
    ctx.save();
    ctx.translate(x + this.width / 2, y + this.height);
    ctx.scale(facing, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(6, -18);
    ctx.lineTo(8, 0);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  render(ctx) {
    if (this.isDead) return;

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const bottomY = this.y + this.height;
    ctx.translate(centerX, bottomY);
    ctx.scale(this.facing * this.scaleX, this.scaleY);

    const breathY = this.isGrounded ? Math.sin(this.animTimer * 3) * 0.5 : 0;

    // 1. Cloak back / shadow
    ctx.fillStyle = this.isEclipseForm ? '#220818' : '#17142b';
    ctx.beginPath();
    ctx.moveTo(-6, -18 + breathY);
    ctx.lineTo(6, -18 + breathY);
    ctx.lineTo(7 + Math.sin(this.cloakSway) * 3, 0);
    ctx.lineTo(-7 + Math.sin(this.cloakSway) * 3, 0);
    ctx.closePath();
    ctx.fill();

    // 2. Main Cloak
    ctx.fillStyle = this.isEclipseForm ? '#48112c' : '#322254';
    ctx.beginPath();
    ctx.moveTo(-5, -17 + breathY);
    ctx.lineTo(5, -17 + breathY);
    ctx.lineTo(6 + Math.sin(this.cloakSway) * 2, -1);
    ctx.lineTo(-6 + Math.sin(this.cloakSway) * 2, -1);
    ctx.closePath();
    ctx.fill();

    // 3. Cloak Hem Accent
    ctx.strokeStyle = this.isEclipseForm ? '#ff2255' : '#2a9d8f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6 + Math.sin(this.cloakSway) * 2, -1);
    ctx.lineTo(6 + Math.sin(this.cloakSway) * 2, -1);
    ctx.stroke();

    // 4. Pointed Hood
    ctx.fillStyle = this.isEclipseForm ? '#61163b' : '#442d74';
    ctx.beginPath();
    ctx.moveTo(-6, -16 + breathY);
    ctx.quadraticCurveTo(-2, -25 + breathY, 3, -24 + breathY);
    ctx.quadraticCurveTo(6, -20 + breathY, 5, -13 + breathY);
    ctx.lineTo(-5, -13 + breathY);
    ctx.closePath();
    ctx.fill();

    // 5. Hood Face Void
    ctx.fillStyle = '#0a0715';
    ctx.beginPath();
    ctx.ellipse(1, -16 + breathY, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Glowing Eyes
    const eyeColor = this.isEclipseForm ? '#ff2255' : '#f4f1ff';
    ctx.fillStyle = eyeColor;
    ctx.shadowColor = this.isEclipseForm ? '#ff2255' : '#7be0ad';
    ctx.shadowBlur = this.isEclipseForm ? 8 : 4;
    ctx.beginPath();
    ctx.arc(2, -16.5 + breathY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 7. Staff & Lantern
    ctx.strokeStyle = '#5a3d28';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, -12 + breathY);
    ctx.lineTo(6, -10 + breathY);
    ctx.stroke();

    const cordLength = 8;
    const handX = 6;
    const handY = -10 + breathY;
    const lanternRelX = handX + Math.sin(this.lanternAngle) * cordLength;
    const lanternRelY = handY + Math.cos(this.lanternAngle) * cordLength;

    ctx.strokeStyle = '#8c7853';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.lineTo(lanternRelX, lanternRelY);
    ctx.stroke();

    ctx.fillStyle = '#221a14';
    ctx.fillRect(lanternRelX - 3, lanternRelY, 6, 7);

    // Glowing Lantern Core
    const glowGrad = ctx.createRadialGradient(lanternRelX, lanternRelY + 3.5, 0.5, lanternRelX, lanternRelY + 3.5, 4);
    if (this.isEclipseForm) {
      glowGrad.addColorStop(0, '#ffffff');
      glowGrad.addColorStop(0.4, '#ff2255');
      glowGrad.addColorStop(1, '#881144');
    } else {
      glowGrad.addColorStop(0, '#ffffff');
      glowGrad.addColorStop(0.4, '#ffd98a');
      glowGrad.addColorStop(1, '#ff8fab');
    }
    ctx.fillStyle = glowGrad;
    ctx.fillRect(lanternRelX - 2, lanternRelY + 1, 4, 5);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(lanternRelX - 3.5, lanternRelY - 1, 7, 1.5);
    ctx.fillRect(lanternRelX - 3, lanternRelY + 7, 6, 1);

    ctx.restore();
  }
}
