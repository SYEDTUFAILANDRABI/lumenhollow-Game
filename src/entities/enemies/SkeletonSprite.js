// SkeletonSprite.js - Sprite animation controller for Skeleton enemies
// Based on /assets/skeleton_enemy.png (832x320, 13 cols x 5 rows, 64x64)

let sharedSkeletonImage = null;
let isSkeletonImageLoaded = false;

function getSharedImage() {
  if (!sharedSkeletonImage) {
    sharedSkeletonImage = new Image();
    sharedSkeletonImage.onload = () => {
      isSkeletonImageLoaded = true;
    };
    sharedSkeletonImage.onerror = (e) => {
      console.warn('Failed to load skeleton sprite sheet:', e);
    };
    sharedSkeletonImage.src = '/assets/skeleton_enemy.png';
  }
  return sharedSkeletonImage;
}

function makeFrames(startIdx, count) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const col = idx % 13;
    const row = Math.floor(idx / 13);
    frames.push({
      sx: col * 64,
      sy: row * 64,
      sw: 64,
      sh: 64
    });
  }
  return frames;
}

export class SkeletonSprite {
  constructor() {
    this.image = getSharedImage();
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;

    this.animations = {
      idle: {
        fps: 6,
        loop: true,
        frames: makeFrames(0, 4) // 0..3
      },
      attack: {
        fps: 14,
        loop: false,
        frames: makeFrames(4, 13) // 4..16
      },
      hit: {
        fps: 10,
        loop: false,
        frames: makeFrames(17, 3) // 17..19
      },
      walk: {
        fps: 10,
        loop: true,
        frames: makeFrames(20, 12) // 20..31
      },
      death: {
        fps: 12,
        loop: false,
        frames: makeFrames(32, 13) // 32..44
      }
    };
  }

  isLoaded() {
    return isSkeletonImageLoaded && this.image.complete && this.image.naturalWidth > 0;
  }

  play(animName, restart = false) {
    if (!this.animations[animName]) return;
    if (this.currentAnim !== animName || restart) {
      this.currentAnim = animName;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(dt, skeleton) {
    // Determine animation based on skeleton entity state
    let targetAnim = 'idle';

    if (skeleton.isDead) {
      targetAnim = 'death';
    } else if (skeleton.hitFlashTimer > 0) {
      targetAnim = 'hit';
    } else if (skeleton.attackTimer > 0 || (skeleton.isAttacking && skeleton.isAttacking())) {
      targetAnim = 'attack';
    } else if (Math.abs(skeleton.vx) > 5) {
      targetAnim = 'walk';
    } else {
      targetAnim = 'idle';
    }

    if (this.currentAnim !== targetAnim) {
      // Don't interrupt death once started
      if (this.currentAnim === 'death' && skeleton.isDead) {
        // keep death
      } else {
        this.play(targetAnim);
      }
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
  }

  render(ctx, rx, ry, facing, hitFlashTimer = 0, scale = 1) {
    if (!this.isLoaded()) return false;

    const anim = this.animations[this.currentAnim] || this.animations.idle;
    const frame = anim.frames[this.frameIndex] || anim.frames[0];

    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale((facing >= 0 ? 1 : -1) * scale, scale);

    // Frame anchor: frame width 64, feet at y ~ 48
    const drawX = -32;
    const drawY = -48;

    if (hitFlashTimer > 0) {
      ctx.save();
      // Draw white silhouette for hit flash
      ctx.drawImage(this.image, frame.sx, frame.sy, frame.sw, frame.sh, drawX, drawY, 64, 64);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX, drawY, 64, 64);
      ctx.restore();
    } else {
      ctx.drawImage(this.image, frame.sx, frame.sy, frame.sw, frame.sh, drawX, drawY, 64, 64);
    }

    ctx.restore();
    return true;
  }
}
