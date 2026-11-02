// PlayerSprite.js - Sprite sheet animation controller for Lumi
export class PlayerSprite {
  constructor() {
    this.image = new Image();
    this.loaded = false;
    this.image.onload = () => {
      this.loaded = true;
    };
    this.image.onerror = (e) => {
      console.warn('Failed to load sprite sheet, falling back to procedural render:', e);
      this.loaded = false;
    };
    this.image.src = '/assets/lumi_spritesheet.png';

    // Animation frame timing
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;

    // Sprite frames extracted from /assets/lumi_spritesheet.png (1024x337)
    this.animations = {
      idle: {
        fps: 8,
        loop: true,
        frames: [
          { x: 23, y: 23, w: 16, h: 21 },
          { x: 83, y: 22, w: 17, h: 21 },
          { x: 143, y: 22, w: 17, h: 20 },
          { x: 204, y: 22, w: 16, h: 20 },
          { x: 264, y: 21, w: 16, h: 21 },
          { x: 324, y: 21, w: 17, h: 21 },
          { x: 384, y: 23, w: 17, h: 20 },
          { x: 445, y: 24, w: 16, h: 20 }
        ]
      },
      walk: {
        fps: 10,
        loop: true,
        frames: [
          { x: 25, y: 74, w: 14, h: 18 },
          { x: 85, y: 74, w: 15, h: 18 },
          { x: 145, y: 75, w: 15, h: 18 },
          { x: 205, y: 75, w: 15, h: 19 },
          { x: 265, y: 74, w: 15, h: 19 },
          { x: 326, y: 74, w: 15, h: 19 },
          { x: 386, y: 75, w: 15, h: 17 },
          { x: 446, y: 74, w: 16, h: 17 }
        ]
      },
      run: {
        fps: 14,
        loop: true,
        frames: [
          { x: 23, y: 216, w: 16, h: 21 },
          { x: 83, y: 215, w: 17, h: 21 },
          { x: 143, y: 215, w: 17, h: 21 },
          { x: 203, y: 214, w: 17, h: 21 },
          { x: 263, y: 214, w: 17, h: 20 },
          { x: 323, y: 213, w: 18, h: 21 },
          { x: 384, y: 214, w: 17, h: 20 },
          { x: 443, y: 214, w: 18, h: 20 },
          { x: 503, y: 214, w: 18, h: 20 },
          { x: 564, y: 214, w: 18, h: 20 },
          { x: 624, y: 214, w: 18, h: 21 }
        ]
      },
      dash: {
        fps: 18,
        loop: false,
        frames: [
          { x: 686, y: 213, w: 16, h: 22 },
          { x: 747, y: 213, w: 15, h: 23 },
          { x: 808, y: 212, w: 14, h: 24 },
          { x: 867, y: 217, w: 16, h: 20 },
          { x: 927, y: 217, w: 16, h: 20 },
          { x: 987, y: 217, w: 16, h: 20 }
        ]
      },
      slash: {
        fps: 16,
        loop: false,
        frames: [
          { x: 23, y: 168, w: 16, h: 20 },
          { x: 83, y: 166, w: 16, h: 22 },
          { x: 143, y: 164, w: 16, h: 23 },
          { x: 204, y: 159, w: 15, h: 28 },
          { x: 264, y: 159, w: 16, h: 28 },
          { x: 324, y: 159, w: 17, h: 27 },
          { x: 384, y: 157, w: 17, h: 29 },
          { x: 445, y: 157, w: 16, h: 29 },
          { x: 505, y: 157, w: 16, h: 29 },
          { x: 565, y: 158, w: 17, h: 29 },
          { x: 625, y: 159, w: 16, h: 28 },
          { x: 686, y: 166, w: 15, h: 21 },
          { x: 746, y: 168, w: 16, h: 20 }
        ]
      },
      cast: {
        fps: 15,
        loop: false,
        frames: [
          { x: 23, y: 120, w: 16, h: 20 },
          { x: 83, y: 118, w: 16, h: 22 },
          { x: 143, y: 115, w: 16, h: 24 },
          { x: 204, y: 111, w: 15, h: 28 },
          { x: 264, y: 110, w: 16, h: 29 },
          { x: 324, y: 110, w: 17, h: 28 },
          { x: 384, y: 109, w: 17, h: 29 },
          { x: 445, y: 109, w: 16, h: 29 },
          { x: 505, y: 105, w: 23, h: 33 },
          { x: 565, y: 103, w: 19, h: 36 },
          { x: 625, y: 102, w: 16, h: 37 },
          { x: 685, y: 101, w: 16, h: 38 },
          { x: 746, y: 120, w: 16, h: 20 }
        ]
      },
      jump: {
        fps: 6,
        loop: false,
        frames: [
          { x: 23, y: 265, w: 16, h: 20 },
          { x: 82, y: 263, w: 17, h: 20 },
          { x: 142, y: 264, w: 17, h: 19 },
          { x: 203, y: 264, w: 17, h: 19 },
          { x: 264, y: 265, w: 16, h: 20 }
        ]
      },
      death: {
        fps: 9,
        loop: false,
        frames: [
          { x: 23, y: 314, w: 16, h: 19 },
          { x: 83, y: 314, w: 17, h: 18 },
          { x: 142, y: 314, w: 16, h: 17 },
          { x: 202, y: 313, w: 19, h: 18 },
          { x: 261, y: 312, w: 18, h: 19 },
          { x: 321, y: 311, w: 17, h: 20 },
          { x: 380, y: 309, w: 19, h: 22 },
          { x: 440, y: 309, w: 20, h: 23 },
          { x: 499, y: 308, w: 18, h: 23 }
        ]
      }
    };
  }

  setAnimation(name, restart = false) {
    if (this.currentAnim === name && !restart) return;
    this.currentAnim = name;
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt, player) {
    // Determine animation based on player state
    let targetAnim = 'idle';

    if (player.isDead) {
      targetAnim = 'death';
    } else if (player.isDashing) {
      targetAnim = 'dash';
    } else if (player.isPlunging) {
      targetAnim = 'jump';
    } else if (player.isSlashing) {
      targetAnim = player.slashCombo % 2 === 0 ? 'slash' : 'cast';
    } else if (!player.isGrounded) {
      targetAnim = 'jump';
    } else if (Math.abs(player.vx) > 30) {
      targetAnim = Math.abs(player.vx) > 100 ? 'run' : 'walk';
    } else {
      targetAnim = 'idle';
    }

    if (this.currentAnim !== targetAnim) {
      this.setAnimation(targetAnim);
    }

    const anim = this.animations[this.currentAnim] || this.animations.idle;
    this.frameTimer += dt;
    const interval = 1 / anim.fps;

    if (this.frameTimer >= interval) {
      this.frameTimer -= interval;
      if (this.frameIndex < anim.frames.length - 1) {
        this.frameIndex++;
      } else if (anim.loop) {
        this.frameIndex = 0;
      }
    }

    // Dynamic jump frame selection based on vertical velocity
    if (this.currentAnim === 'jump') {
      if (player.vy < -150) {
        this.frameIndex = 0; // Takeoff / ascending
      } else if (player.vy < 0) {
        this.frameIndex = 1; // Rising
      } else if (Math.abs(player.vy) <= 60) {
        this.frameIndex = 2; // Apex
      } else if (player.vy > 60 && !player.isGliding) {
        this.frameIndex = 3; // Falling
      } else {
        this.frameIndex = 4; // Glide / land prep
      }
    }
  }

  render(ctx, player) {
    if (!this.loaded) return false;

    const anim = this.animations[this.currentAnim] || this.animations.idle;
    const frame = anim.frames[Math.min(this.frameIndex, anim.frames.length - 1)];
    if (!frame) return false;

    ctx.save();

    // Scale pixel sprite slightly to match world scale (1.15x fits 24px height seamlessly)
    const scale = 1.15;
    const destW = frame.w * scale;
    const destH = frame.h * scale;

    // Anchor: horizontally centered, vertically grounded at (0, 0) in player coordinate space
    const destX = -destW / 2;
    const destY = -destH;

    // Glow aura behind sprite if in Eclipse Form or Astral Form
    if (player.isAstralForm || player.isEclipseForm) {
      ctx.save();
      const auraColor = player.isAstralForm ? 'rgba(187, 68, 255, 0.45)' : 'rgba(255, 34, 85, 0.4)';
      ctx.fillStyle = auraColor;
      ctx.shadowColor = player.isAstralForm ? '#bb44ff' : '#ff2255';
      ctx.shadowBlur = 12;
      ctx.fillRect(destX - 2, destY - 2, destW + 4, destH + 4);
      ctx.restore();
    }

    // Draw sprite frame cleanly with pixel rendering
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      destX,
      destY,
      destW,
      destH
    );

    // If pulsing lantern, add extra luminous glow at the staff tip
    if (player.isPulsing) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffd98a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      // Staff lantern tip is on the upper forward side
      ctx.arc(destX + destW * 0.8, destY + destH * 0.28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    return true;
  }
}
