// SorcererBossSprite.js - Sprite animation controller for the Sorcerer Final Boss
// Uses /assets/sorcerer_boss_idle.png (200x200) and /assets/sorcerer_boss_attack.png (2000x200, 10 frames)

let idleImage = null;
let attackImage = null;
let idleLoaded = false;
let attackLoaded = false;

function getIdleImage() {
  if (!idleImage) {
    idleImage = new Image();
    idleImage.onload = () => { idleLoaded = true; };
    idleImage.onerror = (e) => console.warn('Failed to load sorcerer boss idle sprite:', e);
    idleImage.src = '/assets/sorcerer_boss_idle.png';
  }
  return idleImage;
}

function getAttackImage() {
  if (!attackImage) {
    attackImage = new Image();
    attackImage.onload = () => { attackLoaded = true; };
    attackImage.onerror = (e) => console.warn('Failed to load sorcerer boss attack sprite:', e);
    attackImage.src = '/assets/sorcerer_boss_attack.png';
  }
  return attackImage;
}

export class SorcererBossSprite {
  constructor() {
    this.idleImg = getIdleImage();
    this.attackImg = getAttackImage();

    this.currentAnim = 'idle'; // 'idle', 'cast', 'hit', 'death'
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.fps = 10;
    this.totalCastFrames = 10;

    // Breath / float oscillation
    this.floatTimer = Math.random() * Math.PI;
  }

  isLoaded() {
    return idleLoaded || (this.idleImg.complete && this.idleImg.naturalWidth > 0);
  }

  isAttackLoaded() {
    return attackLoaded || (this.attackImg.complete && this.attackImg.naturalWidth > 0);
  }

  play(animName, restart = false) {
    if (this.currentAnim !== animName || restart) {
      this.currentAnim = animName;
      this.frameIndex = 0;
      this.frameTimer = 0;
    }
  }

  update(dt, boss) {
    this.floatTimer += dt * 2.5;

    let targetAnim = 'idle';
    if (boss.isDead) {
      targetAnim = 'death';
    } else if (boss.hitFlashTimer > 0) {
      targetAnim = 'hit';
    } else if (boss.isCasting || boss.attackTimer > 0.4 || (boss.beamActive !== undefined && boss.beamActive)) {
      targetAnim = 'cast';
    } else {
      targetAnim = 'idle';
    }

    if (this.currentAnim !== targetAnim) {
      if (this.currentAnim === 'death' && boss.isDead) {
        // stay in death
      } else {
        this.play(targetAnim);
      }
    }

    if (this.currentAnim === 'cast') {
      this.frameTimer += dt;
      const interval = 1 / 10; // 10 fps
      if (this.frameTimer >= interval) {
        this.frameTimer -= interval;
        this.frameIndex = (this.frameIndex + 1) % this.totalCastFrames;
      }
    } else {
      this.frameIndex = 0;
    }
  }

  render(ctx, rx, ry, facing = -1, hitFlashTimer = 0, scale = 0.52) {
    if (!this.isLoaded()) return false;

    ctx.save();

    // Floating hover offset
    const floatY = Math.sin(this.floatTimer) * 4;
    ctx.translate(rx, ry + floatY);
    ctx.scale((facing >= 0 ? 1 : -1) * scale, scale);

    // Anchor: 200x200 sprite, center at x = 100, feet at y = 184
    const drawX = -100;
    const drawY = -184;

    const useAttack = this.currentAnim === 'cast' && this.isAttackLoaded();
    const img = useAttack ? this.attackImg : this.idleImg;
    const sx = useAttack ? (this.frameIndex * 200) : 0;
    const sy = 0;
    const sw = 200;
    const sh = 200;

    // Glowing sorcerer aura behind boss
    const auraGrad = ctx.createRadialGradient(0, -90, 20, 0, -90, 85);
    auraGrad.addColorStop(0, 'rgba(187, 68, 255, 0.45)');
    auraGrad.addColorStop(0.6, 'rgba(120, 20, 220, 0.2)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -90, 85, 0, Math.PI * 2);
    ctx.fill();

    if (hitFlashTimer > 0) {
      ctx.save();
      ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, 200, 200);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(drawX, drawY, 200, 200);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, 200, 200);
    }

    ctx.restore();
    return true;
  }
}
