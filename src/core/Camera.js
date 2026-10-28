import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lerpSpeed = 7.5; // Smooth camera responsiveness
    this.lookAheadX = 0;
    this.maxLookAhead = 36;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.minX = 0;
    this.minY = 0;
    this.maxX = GAME_WIDTH;
    this.maxY = GAME_HEIGHT;
    this.shakeEnabled = true;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = Math.max(minX + GAME_WIDTH, maxX);
    this.maxY = Math.max(minY + GAME_HEIGHT, maxY);
  }

  shake(intensity = 4, duration = 0.25) {
    if (!this.shakeEnabled) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  snapTo(targetX, targetY) {
    this.x = targetX - GAME_WIDTH / 2;
    this.y = targetY - GAME_HEIGHT / 2;
    this.clamp();
  }

  update(targetX, targetY, facingDir, dt) {
    // Look-ahead lerp
    const targetLookAhead = facingDir * this.maxLookAhead;
    this.lookAheadX += (targetLookAhead - this.lookAheadX) * 3.5 * dt;

    // Follow target centered
    const desiredX = targetX + this.lookAheadX - GAME_WIDTH / 2;
    const desiredY = targetY - GAME_HEIGHT / 2 - 10; // slightly bias upwards

    // Smooth lerp
    this.x += (desiredX - this.x) * this.lerpSpeed * dt;
    this.y += (desiredY - this.y) * this.lerpSpeed * dt;

    this.clamp();

    // Screen shake update
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentIntensity = this.shakeIntensity * (progress * progress);
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  clamp() {
    if (this.maxX - this.minX <= GAME_WIDTH) {
      this.x = this.minX - (GAME_WIDTH - (this.maxX - this.minX)) / 2;
    } else {
      this.x = Math.max(this.minX, Math.min(this.maxX - GAME_WIDTH, this.x));
    }

    if (this.maxY - this.minY <= GAME_HEIGHT) {
      this.y = this.minY - (GAME_HEIGHT - (this.maxY - this.minY)) / 2;
    } else {
      this.y = Math.max(this.minY, Math.min(this.maxY - GAME_HEIGHT, this.y));
    }
  }

  getRenderX() {
    return Math.round(this.x + this.shakeOffsetX);
  }

  getRenderY() {
    return Math.round(this.y + this.shakeOffsetY);
  }

  getVisibleBounds() {
    const rx = this.getRenderX();
    const ry = this.getRenderY();
    return {
      left: rx - 20,
      right: rx + GAME_WIDTH + 20,
      top: ry - 20,
      bottom: ry + GAME_HEIGHT + 20
    };
  }
}
