// server/RoomManager.js - Room & Party Coordinator
import { ROOM_CONFIG, NET_MESSAGE_TYPES } from '../shared/protocol.js';

// Alphabet excluding ambiguous chars 0, O, 1, I, L
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRoomCode(existingRooms) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = '';
    for (let i = 0; i < ROOM_CONFIG.CODE_LENGTH; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
    if (!existingRooms.has(code)) return code;
  }
  return 'ROOM' + Math.floor(Math.random() * 90 + 10);
}

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> Room
    this.clientRoomMap = new Map(); // ws -> code
  }

  createRoom({ hostWs, hostPlayerId, nickname, paletteId, mode = 'duo', isPrivate = false, difficulty = 'Normal', levelIndex = 0 }) {
    const code = generateRoomCode(this.rooms);
    const maxPlayers = mode === 'squad' ? ROOM_CONFIG.MAX_PLAYERS_SQUAD : ROOM_CONFIG.MAX_PLAYERS_DUO;

    const hostMember = {
      id: hostPlayerId,
      slot: 0,
      nickname: (nickname || 'Host').substring(0, 16),
      paletteId: paletteId || 0,
      isHost: true,
      ready: true,
      ws: hostWs
    };

    const room = {
      code,
      mode,
      isPrivate,
      difficulty,
      levelIndex,
      hostId: hostPlayerId,
      maxPlayers,
      members: [hostMember],
      state: 'LOBBY', // 'LOBBY' | 'PLAYING'
      createdAt: Date.now(),
      lastCheckpoint: null
    };

    this.rooms.set(code, room);
    this.clientRoomMap.set(hostWs, code);

    return room;
  }

  joinRoom(code, { ws, playerId, nickname, paletteId }) {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) {
      return { error: 'Room not found' };
    }
    if (room.members.length >= room.maxPlayers) {
      return { error: 'Room is full' };
    }

    // Determine available slot (0-3)
    const takenSlots = new Set(room.members.map(m => m.slot));
    let slot = 0;
    while (takenSlots.has(slot)) slot++;

    const newMember = {
      id: playerId,
      slot,
      nickname: (nickname || 'Player ' + (slot + 1)).substring(0, 16),
      paletteId: paletteId !== undefined ? paletteId : slot,
      isHost: false,
      ready: false,
      ws
    };

    room.members.push(newMember);
    this.clientRoomMap.set(ws, room.code);

    return { room, member: newMember };
  }

  getRoomByWs(ws) {
    const code = this.clientRoomMap.get(ws);
    return code ? this.rooms.get(code) : null;
  }

  leaveRoom(ws) {
    const code = this.clientRoomMap.get(ws);
    if (!code) return null;

    this.clientRoomMap.delete(ws);
    const room = this.rooms.get(code);
    if (!room) return null;

    const leavingMember = room.members.find(m => m.ws === ws);
    room.members = room.members.filter(m => m.ws !== ws);

    // If room is empty, remove it
    if (room.members.length === 0) {
      this.rooms.delete(code);
      return { roomDeleted: true, code };
    }

    // If host left, promote the next member
    let newHost = null;
    if (leavingMember && leavingMember.isHost && room.members.length > 0) {
      room.members[0].isHost = true;
      room.members[0].ready = true;
      room.hostId = room.members[0].id;
      newHost = room.members[0];
    }

    return { room, leavingMember, newHost };
  }

  getPublicLobbies(mode = 'duo') {
    const lobbies = [];
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.state === 'LOBBY' && room.mode === mode && room.members.length < room.maxPlayers) {
        lobbies.push({
          code: room.code,
          mode: room.mode,
          playerCount: room.members.length,
          maxPlayers: room.maxPlayers,
          difficulty: room.difficulty
        });
      }
    }
    return lobbies;
  }

  getPublicRoomToJoin(mode = 'duo') {
    for (const room of this.rooms.values()) {
      if (!room.isPrivate && room.state === 'LOBBY' && room.mode === mode && room.members.length < room.maxPlayers) {
        return room;
      }
    }
    return null;
  }

  sanitizeRoomData(room) {
    if (!room) return null;
    return {
      code: room.code,
      mode: room.mode,
      isPrivate: room.isPrivate,
      difficulty: room.difficulty,
      levelIndex: room.levelIndex,
      hostId: room.hostId,
      maxPlayers: room.maxPlayers,
      state: room.state,
      members: room.members.map(m => ({
        id: m.id,
        slot: m.slot,
        nickname: m.nickname,
        paletteId: m.paletteId,
        isHost: m.isHost,
        ready: m.ready
      }))
    };
  }
}
