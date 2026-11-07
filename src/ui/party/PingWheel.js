// src/ui/party/PingWheel.js - Radial Ping Menu & World Beacon Markers
import { GlobalNetEvents } from '../../net/NetworkEventBus.js';

export const PING_TYPES = {
  HERE: { id: 'here', label: 'Group Up', icon: '📍', color: '#7eb8da' },
  DANGER: { id: 'danger', label: 'Danger', icon: '⚠️', color: '#ff4d4f' },
  HELP: { id: 'help', label: 'Need Help', icon: '🆘', color: '#ffd98a' },
  ITEM: { id: 'item', label: 'Shard / Objective', icon: '💎', color: '#b37feb' }
};

export class PingWheel {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.selectedIndex = 0;
    this.activeWorldPings = []; // { x, y, type, author, createdAt, timer }

    // Listen to network ping events
    GlobalNetEvents.on('PING_EVENT', (data) => {
      this.addWorldPing(data.x, data.y, data.pingType, data.nickname || 'Ally');
      if (this.game.audio) {
        if (typeof this.game.audio.playShrineActivate === 'function') {
          this.game.audio.playShrineActivate();
        } else if (typeof this.game.audio.playShardPickup === 'function') {
          this.game.audio.playShardPickup();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'z' || e.key === 'Z') && this.game.state === 'PLAYING') {
        this.isOpen = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if ((e.key === 'z' || e.key === 'Z') && this.isOpen) {
        this.confirmPing();
        this.isOpen = false;
      }
    });
  }

  confirmPing() {
    const types = [PING_TYPES.HERE, PING_TYPES.DANGER, PING_TYPES.HELP, PING_TYPES.ITEM];
    const chosen = types[this.selectedIndex] || PING_TYPES.HERE;
    const player = this.game.player;
    if (!player) return;

    const wx = player.x + player.width / 2;
    const wy = player.y;

    if (this.game.network && this.game.network.isMultiplayer) {
      this.game.network.sendPing(chosen.id, wx, wy);
    } else {
      this.addWorldPing(wx, wy, chosen.id, 'You');
    }
  }

  addWorldPing(x, y, typeId, author) {
    const typeObj = Object.values(PING_TYPES).find(t => t.id === typeId) || PING_TYPES.HERE;
    this.activeWorldPings.push({
      x,
      y,
      type: typeObj,
      author,
      createdAt: performance.now(),
      timer: 5.0 // 5 seconds duration
    });
  }

  update(dt) {
    for (let i = this.activeWorldPings.length - 1; i >= 0; i--) {
      const ping = this.activeWorldPings[i];
      ping.timer -= dt;
      if (ping.timer <= 0) {
        this.activeWorldPings.splice(i, 1);
      }
    }
  }

  render(ctx) {
    const camera = this.game.camera;

    // 1. Render World Pings
    for (const ping of this.activeWorldPings) {
      const px = Math.round(ping.x - camera.x);
      const py = Math.round(ping.y - camera.y);

      ctx.save();
      const age = 5.0 - ping.timer;
      const pulse = (Math.sin(age * 6) + 1) * 0.5;
      const alpha = Math.min(1, ping.timer);

      // Expanding beacon ring
      ctx.strokeStyle = ping.type.color;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 12 + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();

      // Icon & author label
      ctx.globalAlpha = alpha;
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ping.type.icon, px, py - 18);

      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = ping.type.color;
      ctx.fillText(`${ping.author}: ${ping.type.label}`, px, py - 32);

      ctx.restore();
    }

    // 2. Render Radial Ping Wheel if active
    if (this.isOpen) {
      ctx.save();
      const cx = 320;
      const cy = 180;
      const radius = 60;

      // Dark radial backdrop
      ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
      ctx.fill();

      const options = [
        { ...PING_TYPES.HERE, angle: -Math.PI / 2 },
        { ...PING_TYPES.DANGER, angle: 0 },
        { ...PING_TYPES.HELP, angle: Math.PI / 2 },
        { ...PING_TYPES.ITEM, angle: Math.PI }
      ];

      options.forEach((opt, idx) => {
        const ox = cx + Math.cos(opt.angle) * radius;
        const oy = cy + Math.sin(opt.angle) * radius;
        const isSel = idx === this.selectedIndex;

        ctx.fillStyle = isSel ? opt.color : 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(ox, oy, isSel ? 22 : 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '16px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.icon, ox, oy);

        if (isSel) {
          ctx.font = 'bold 10px -apple-system, sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText(opt.label, ox, oy + 32);
        }
      });

      ctx.restore();
    }
  }
}
