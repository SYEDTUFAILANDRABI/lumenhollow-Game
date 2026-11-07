// src/net/PlayerManager.js - Manages Local and Remote Co-Op Players (1 to 4)
import { PLAYER_PALETTES, PLAYER_STATES, COOP_CONFIG } from '../../shared/protocol.js';
import { Player } from '../entities/Player.js';

export class NetworkPlayerInfo {
  constructor(slot = 0, id = '', nickname = 'Lumi', paletteId = 0, isLocal = false) {
    this.slot = slot;
    this.id = id;
    this.nickname = nickname;
    this.palette = PLAYER_PALETTES[paletteId % PLAYER_PALETTES.length];
    this.isLocal = isLocal;
    this.isHost = slot === 0;
    this.state = PLAYER_STATES.ALIVE;
    this.playerEntity = null;

    // Co-op revive stats
    this.reviveProgress = 0; // 0 to 1
    this.revivingBySlot = -1;
    this.wispFloatTimer = Math.random() * Math.PI * 2;
    this.stats = {
      kills: 0,
      damageDealt: 0,
      revivesGiven: 0,
      timesDowned: 0,
      comboMax: 0
    };
  }
}

export class PlayerManager {
  constructor(game) {
    this.game = game;
    this.players = new Map(); // id -> NetworkPlayerInfo
    this.localPlayerId = 'p_local';
    this.localSlot = 0;
    this.partySize = 1;

    // Register local single-player default
    this.initLocalPlayer();
  }

  initLocalPlayer(nickname = 'Lumi', paletteId = 0) {
    this.players.clear();
    const localInfo = new NetworkPlayerInfo(0, this.localPlayerId, nickname, paletteId, true);
    this.players.set(this.localPlayerId, localInfo);
    this.localSlot = 0;
  }

  setPartyMembers(memberList, localId) {
    this.localPlayerId = localId;
    this.players.clear();

    memberList.forEach((m, idx) => {
      const isLocal = m.id === localId;
      const info = new NetworkPlayerInfo(idx, m.id, m.nickname, m.paletteId || idx, isLocal);
      info.isHost = m.isHost || idx === 0;
      this.players.set(m.id, info);
      if (isLocal) {
        this.localSlot = idx;
      }
    });

    this.partySize = this.players.size;
  }

  spawnPlayers(tileMap) {
    if (!tileMap || !tileMap.playerStart) return;
    const startX = tileMap.playerStart.x;
    const startY = tileMap.playerStart.y;

    let index = 0;
    for (const [id, info] of this.players) {
      // Offset spawn positions slightly horizontally so players don't stack directly
      const spawnX = startX + (index - (this.players.size - 1) / 2) * 22;
      const spawnY = startY;

      if (info.isLocal && this.game.player) {
        info.playerEntity = this.game.player;
        info.playerEntity.x = spawnX;
        info.playerEntity.y = spawnY;
        info.playerEntity.setSpawn(spawnX, spawnY);
      } else {
        info.playerEntity = new Player(spawnX, spawnY);
        info.playerEntity.setSpawn(spawnX, spawnY);
      }

      // Assign custom cloak and lantern color
      info.playerEntity.networkSlot = info.slot;
      info.playerEntity.palette = info.palette;
      info.playerEntity.isDowned = false;
      info.state = PLAYER_STATES.ALIVE;
      index++;
    }
  }

  getLocalPlayer() {
    const info = this.players.get(this.localPlayerId);
    return info ? info.playerEntity : this.game.player;
  }

  getLocalInfo() {
    return this.players.get(this.localPlayerId);
  }

  getAllPlayers() {
    const list = [];
    for (const info of this.players.values()) {
      if (info.playerEntity) list.push(info.playerEntity);
    }
    return list;
  }

  getAllPlayerInfos() {
    return Array.from(this.players.values());
  }

  getLivingPlayers() {
    const list = [];
    for (const info of this.players.values()) {
      if (info.playerEntity && info.state === PLAYER_STATES.ALIVE && !info.playerEntity.isDead) {
        list.push(info.playerEntity);
      }
    }
    return list;
  }

  getNearestLivingPlayer(x, y) {
    const living = this.getLivingPlayers();
    if (living.length === 0) return this.getLocalPlayer();

    let closest = living[0];
    let minDist = Math.hypot((closest.x + closest.width / 2) - x, (closest.y + closest.height / 2) - y);

    for (let i = 1; i < living.length; i++) {
      const p = living[i];
      const dist = Math.hypot((p.x + p.width / 2) - x, (p.y + p.height / 2) - y);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    return closest;
  }

  areAllPlayersDowned() {
    for (const info of this.players.values()) {
      if (info.state === PLAYER_STATES.ALIVE) return false;
    }
    return true;
  }

  // Wisp & Revive Logic
  downPlayer(playerEntity) {
    for (const info of this.players.values()) {
      if (info.playerEntity === playerEntity) {
        info.state = PLAYER_STATES.DOWNED;
        playerEntity.isDowned = true;
        info.stats.timesDowned++;
        info.reviveProgress = 0;
        info.revivingBySlot = -1;
        break;
      }
    }
  }

  revivePlayer(playerEntity) {
    for (const info of this.players.values()) {
      if (info.playerEntity === playerEntity) {
        info.state = PLAYER_STATES.ALIVE;
        playerEntity.isDowned = false;
        playerEntity.invulnerableTimer = 2.0; // 2s revive grace period
        info.reviveProgress = 0;
        info.revivingBySlot = -1;
        break;
      }
    }
  }

  update(dt, input) {
    // Update wisp float motions and revive channels
    for (const info of this.players.values()) {
      const p = info.playerEntity;
      if (!p) continue;

      if (info.state === PLAYER_STATES.DOWNED) {
        info.wispFloatTimer += dt * 3.5;
        // Float gently toward nearest living player
        const livingNearest = this.getNearestLivingPlayer(p.x, p.y);
        if (livingNearest && livingNearest !== p) {
          const dx = (livingNearest.x + livingNearest.width / 2) - (p.x + p.width / 2);
          const dy = (livingNearest.y + livingNearest.height / 2) - (p.y + p.height / 2);
          const dist = Math.hypot(dx, dy);
          if (dist > 30) {
            p.vx = (dx / dist) * COOP_CONFIG.REVIVE.WISP_SPEED_PX;
            p.vy = (dy / dist) * COOP_CONFIG.REVIVE.WISP_SPEED_PX;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
        }

        // Revive channeling check by living teammates holding Pulse
        let beingRevived = false;
        for (const reviver of this.players.values()) {
          if (reviver !== info && reviver.state === PLAYER_STATES.ALIVE && reviver.playerEntity) {
            const rEnt = reviver.playerEntity;
            const dist = Math.hypot((rEnt.x + rEnt.width / 2) - (p.x + p.width / 2), (rEnt.y + rEnt.height / 2) - (p.y + p.height / 2));
            if (dist <= COOP_CONFIG.REVIVE.CHANNEL_RADIUS_PX && (rEnt.isPulsing || (input && input.actions && input.actions.pulse))) {
              info.reviveProgress += dt / COOP_CONFIG.REVIVE.CHANNEL_TIME_S;
              info.revivingBySlot = reviver.slot;
              beingRevived = true;

              if (info.reviveProgress >= 1.0) {
                this.revivePlayer(p);
                reviver.stats.revivesGiven++;
                if (this.game.vfx) this.game.vfx.screenFlash(0.3, [255, 217, 138]);
                if (this.game.audio) this.game.audio.playShardCollect();
              }
              break;
            }
          }
        }

        if (!beingRevived && info.reviveProgress > 0) {
          info.reviveProgress = Math.max(0, info.reviveProgress - dt * 0.5);
          info.revivingBySlot = -1;
        }
      }
    }
  }

  renderWispsAndNames(ctx, camera) {
    for (const info of this.players.values()) {
      const p = info.playerEntity;
      if (!p) continue;

      const px = Math.round(p.x - camera.x);
      const py = Math.round(p.y - camera.y);

      // Render Floating Celestial Wisp if Downed
      if (info.state === PLAYER_STATES.DOWNED) {
        ctx.save();
        const floatOffset = Math.sin(info.wispFloatTimer) * COOP_CONFIG.REVIVE.WISP_FLOAT_AMPLITUDE;
        const wx = px + p.width / 2;
        const wy = py + p.height / 2 + floatOffset;

        // Outer glow
        const grad = ctx.createRadialGradient(wx, wy, 2, wx, wy, 24);
        grad.addColorStop(0, info.palette.wisp);
        grad.addColorStop(0.5, info.palette.glow);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(wx, wy, 24, 0, Math.PI * 2);
        ctx.fill();

        // Inner wisp orb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Revive progress ring
        if (info.reviveProgress > 0) {
          ctx.strokeStyle = '#ffd98a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(wx, wy, 14, -Math.PI / 2, -Math.PI / 2 + (info.reviveProgress * Math.PI * 2));
          ctx.stroke();
        }

        ctx.restore();
      }

      // Render Teammate Nickname Tag
      if (this.players.size > 1) {
        ctx.save();
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = info.isLocal ? '#ffd98a' : info.palette.cloak;
        ctx.fillText(info.nickname, px + p.width / 2, py - 6);
        ctx.restore();
      }
    }
  }
}
