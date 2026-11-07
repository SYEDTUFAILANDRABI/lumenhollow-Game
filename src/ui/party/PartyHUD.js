// src/ui/party/PartyHUD.js - In-Game Co-Op Party HUD
import { PLAYER_STATES } from '../../../shared/protocol.js';

export class PartyHUD {
  constructor(game) {
    this.game = game;
  }

  render(ctx) {
    const pm = this.game.playerManager;
    if (!pm || pm.players.size <= 1) return;

    const camera = this.game.camera;
    const infos = pm.getAllPlayerInfos().filter(info => !info.isLocal);
    if (infos.length === 0) return;

    ctx.save();

    // Render Teammates status cards in top-right corner
    const startX = 640 - 130;
    let startY = 16;

    for (const info of infos) {
      const p = info.playerEntity;
      const pal = info.palette;

      // Card Background
      ctx.fillStyle = 'rgba(15, 13, 28, 0.75)';
      ctx.strokeStyle = info.state === PLAYER_STATES.DOWNED ? '#ff4d4f' : 'rgba(255, 217, 138, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(startX, startY, 120, 32, 4);
      ctx.fill();
      ctx.stroke();

      // Cloak/Lantern dot
      ctx.fillStyle = pal.cloak;
      ctx.beginPath();
      ctx.arc(startX + 10, startY + 16, 5, 0, Math.PI * 2);
      ctx.fill();

      // Nickname
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(info.nickname.substring(0, 10), startX + 20, startY + 13);

      // Status / Health
      if (info.state === PLAYER_STATES.DOWNED) {
        ctx.fillStyle = '#ff7875';
        ctx.font = 'italic 8px -apple-system, sans-serif';
        if (info.reviveProgress > 0) {
          ctx.fillText(`Reviving ${(info.reviveProgress * 100).toFixed(0)}%`, startX + 20, startY + 25);
        } else {
          ctx.fillText('WISP (Downed)', startX + 20, startY + 25);
        }
      } else {
        // Health bar
        const energyRatio = p ? Math.max(0, p.energy / 100) : 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(startX + 20, startY + 18, 90, 6);
        ctx.fillStyle = pal.lantern;
        ctx.fillRect(startX + 20, startY + 18, 90 * energyRatio, 6);
      }

      // Off-screen pointer if teammate is off screen
      if (p && camera) {
        const screenX = p.x + p.width / 2 - camera.x;
        const screenY = p.y + p.height / 2 - camera.y;

        if (screenX < 0 || screenX > 640 || screenY < 0 || screenY > 360) {
          this.renderOffscreenArrow(ctx, screenX, screenY, info);
        }
      }

      startY += 38;
    }

    ctx.restore();
  }

  renderOffscreenArrow(ctx, screenX, screenY, info) {
    const cx = 320;
    const cy = 180;
    const dx = screenX - cx;
    const dy = screenY - cy;
    const angle = Math.atan2(dy, dx);

    // Clamp to edge margin
    const margin = 24;
    const edgeX = Math.max(margin, Math.min(640 - margin, cx + Math.cos(angle) * (320 - margin)));
    const edgeY = Math.max(margin, Math.min(360 - margin, cy + Math.sin(angle) * (180 - margin)));

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(angle);

    ctx.fillStyle = info.state === PLAYER_STATES.DOWNED ? '#ff4d4f' : info.palette.cloak;
    ctx.shadowColor = info.palette.glow;
    ctx.shadowBlur = 6;

    // Small directional triangle
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
