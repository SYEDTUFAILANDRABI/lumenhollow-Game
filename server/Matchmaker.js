// server/Matchmaker.js - Quick Play Matchmaker
import { ROOM_CONFIG } from '../shared/protocol.js';

export class Matchmaker {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.queues = {
      duo: [],   // Array of { ws, playerId, nickname, paletteId, joinedAt }
      squad: []  // Array of { ws, playerId, nickname, paletteId, joinedAt }
    };
    this.matchTimeoutMs = 12000; // 12 seconds max before auto-creating room
  }

  enqueue(mode, clientInfo) {
    const queue = this.queues[mode] || this.queues.duo;
    // Remove if already queued
    this.dequeue(clientInfo.ws);

    queue.push({
      ...clientInfo,
      joinedAt: Date.now()
    });

    return this.checkQueue(mode);
  }

  dequeue(ws) {
    for (const mode of Object.keys(this.queues)) {
      this.queues[mode] = this.queues[mode].filter(entry => entry.ws !== ws);
    }
  }

  checkQueue(mode) {
    const queue = this.queues[mode];
    const targetSize = mode === 'squad' ? ROOM_CONFIG.MAX_PLAYERS_SQUAD : ROOM_CONFIG.MAX_PLAYERS_DUO;

    // Check if we have enough players for a full match
    if (queue.length >= targetSize) {
      const matched = queue.splice(0, targetSize);
      return this.createMatchRoom(mode, matched);
    }

    // Check if the oldest player timed out (wait > 10s) and we have at least 2 players
    if (queue.length >= 2 && (Date.now() - queue[0].joinedAt) > this.matchTimeoutMs) {
      const matched = queue.splice(0, queue.length);
      return this.createMatchRoom(mode, matched);
    }

    return null;
  }

  createMatchRoom(mode, matchedClients) {
    const host = matchedClients[0];
    const room = this.roomManager.createRoom({
      hostWs: host.ws,
      hostPlayerId: host.playerId,
      nickname: host.nickname,
      paletteId: host.paletteId,
      mode,
      isPrivate: false
    });

    // Add remaining peers
    for (let i = 1; i < matchedClients.length; i++) {
      const peer = matchedClients[i];
      this.roomManager.joinRoom(room.code, {
        ws: peer.ws,
        playerId: peer.playerId,
        nickname: peer.nickname,
        paletteId: peer.paletteId
      });
    }

    return room;
  }
}
