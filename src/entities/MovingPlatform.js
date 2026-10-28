import { TILE_SIZE } from '../core/Constants.js';

export class MovingPlatform {
  constructor(x, y, width = 48, height = 10, rangeX = 70, rangeY = 0, speed = 1.4) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.width = width;
    this.height = height;
    this.rangeX = rangeX;
    this.rangeY = rangeY;
    this.speed = speed;
    this.time = Math.random() * Math.PI * 2;
    this.deltaX = 0;
    this.deltaY = 0;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.time += dt * this.speed;

    const offsetX = Math.sin(this.time) * this.rangeX;
    const offsetY = Math.cos(this.time) * this.rangeY;

    this.x = this.startX + offsetX;
    this.y = this.startY + offsetY;

    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
  }

  checkPlayerStanding(player) {
    // Check if player's feet rest on platform top surface
    const pFeet = player.y + player.height;
    const pLeft = player.x + 2;
    const pRight = player.x + player.width - 2;

    const onTop = pFeet >= this.y - 2 && pFeet <= this.y + 7;
    const withinX = pRight > this.x && pLeft < this.x + this.width;

    return onTop && withinX && player.vy >= 0;
  }

  render(ctx) {
    ctx.save();
    // Glowing runic moving platform
    ctx.shadowColor = '#2a9d8f';
    ctx.shadowBlur = 8;

    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, '#7be0ad');
    grad.addColorStop(0.5, '#2a9d8f');
    grad.addColorStop(1, '#1b1a3a');
    ctx.fillStyle = grad;

    // Rounded stone slab
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 4);
    ctx.fill();

    // Runic trim
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center rune
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
