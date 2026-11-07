// server/server.js - Lumen Hollow Co-Op Relay & Lobby Server
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { NET_PROTOCOL_VERSION, NET_MESSAGE_TYPES } from '../shared/protocol.js';
import { RoomManager } from './RoomManager.js';
import { Matchmaker } from './Matchmaker.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const roomManager = new RoomManager();
const matchmaker = new Matchmaker(roomManager);

// Basic profanity / spam filter
const BLOCKED_WORDS = ['admin', 'root', 'system', 'nigger', 'faggot', 'retard'];
function sanitizeNickname(raw) {
  let name = (raw || 'Lumi').toString().trim().replace(/[^\w\s-]/g, '');
  if (name.length < 2) name = 'Lumi';
  if (name.length > 16) name = name.substring(0, 16);
  const lower = name.toLowerCase();
  for (const bad of BLOCKED_WORDS) {
    if (lower.includes(bad)) {
      return 'Lumi';
    }
  }
  return name;
}

// HTTP server for health checks & metadata
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      game: 'Lumen Hollow: Underworld & Sovereign Edition',
      protocolVersion: NET_PROTOCOL_VERSION,
      activeRooms: roomManager.rooms.size,
      uptimeSec: Math.floor(process.uptime())
    }));
    return;
  }

  if (req.url.startsWith('/api/lobbies')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const mode = url.searchParams.get('mode') || 'duo';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ lobbies: roomManager.getPublicLobbies(mode) }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Lumen Hollow Co-Op Relay Server is running.');
});

// WebSocket Server
const wss = new WebSocketServer({ server });

function sendJson(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function broadcastToRoom(room, obj, excludeWs = null) {
  if (!room || !room.members) return;
  const data = JSON.stringify(obj);
  for (const m of room.members) {
    if (m.ws && m.ws !== excludeWs && m.ws.readyState === WebSocket.OPEN) {
      m.ws.send(data);
    }
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.authenticated = false;
  ws.clientInfo = null;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      handleClientMessage(ws, msg);
    } catch (err) {
      // Ignore malformed packets
    }
  });

  ws.on('close', () => {
    matchmaker.dequeue(ws);
    const leaveResult = roomManager.leaveRoom(ws);
    if (leaveResult && !leaveResult.roomDeleted) {
      const { room, leavingMember, newHost } = leaveResult;
      // Notify remaining players
      broadcastToRoom(room, {
        type: NET_MESSAGE_TYPES.ROOM_UPDATE,
        roomData: roomManager.sanitizeRoomData(room)
      });

      // If host migration occurred, inform new host
      if (newHost) {
        broadcastToRoom(room, {
          type: NET_MESSAGE_TYPES.HOST_MIGRATION,
          newHostId: newHost.id,
          lastCheckpoint: room.lastCheckpoint
        });
      }
    }
  });
});

function handleClientMessage(ws, msg) {
  if (!msg || !msg.type) return;

  // Handshake
  if (msg.type === NET_MESSAGE_TYPES.HANDSHAKE_REQ) {
    if (msg.version !== NET_PROTOCOL_VERSION) {
      sendJson(ws, {
        type: NET_MESSAGE_TYPES.ERROR,
        code: 'VERSION_MISMATCH',
        message: `Protocol mismatch: server is v${NET_PROTOCOL_VERSION}, client sent v${msg.version}`
      });
      ws.close();
      return;
    }

    ws.authenticated = true;
    ws.clientInfo = {
      playerId: msg.playerId || ('p_' + Math.random().toString(36).substring(2, 8)),
      sessionToken: msg.sessionToken,
      nickname: sanitizeNickname(msg.nickname),
      paletteId: msg.paletteId || 0
    };

    sendJson(ws, {
      type: NET_MESSAGE_TYPES.HANDSHAKE_ACK,
      playerId: ws.clientInfo.playerId
    });
    return;
  }

  // All other messages require authentication
  if (!ws.authenticated) return;

  switch (msg.type) {
    case NET_MESSAGE_TYPES.CREATE_ROOM_REQ: {
      const room = roomManager.createRoom({
        hostWs: ws,
        hostPlayerId: ws.clientInfo.playerId,
        nickname: ws.clientInfo.nickname,
        paletteId: ws.clientInfo.paletteId,
        mode: msg.mode || 'duo',
        isPrivate: !!msg.isPrivate,
        difficulty: msg.difficulty || 'Normal',
        levelIndex: msg.levelIndex || 0
      });

      sendJson(ws, {
        type: NET_MESSAGE_TYPES.ROOM_CREATED,
        roomCode: room.code,
        roomData: roomManager.sanitizeRoomData(room)
      });
      break;
    }

    case NET_MESSAGE_TYPES.JOIN_ROOM_REQ: {
      const result = roomManager.joinRoom(msg.roomCode, {
        ws,
        playerId: ws.clientInfo.playerId,
        nickname: ws.clientInfo.nickname,
        paletteId: ws.clientInfo.paletteId
      });

      if (result.error) {
        sendJson(ws, {
          type: NET_MESSAGE_TYPES.ERROR,
          message: result.error
        });
      } else {
        const { room } = result;
        const sanitized = roomManager.sanitizeRoomData(room);
        sendJson(ws, {
          type: NET_MESSAGE_TYPES.ROOM_JOINED,
          roomCode: room.code,
          roomData: sanitized
        });
        // Notify others
        broadcastToRoom(room, {
          type: NET_MESSAGE_TYPES.ROOM_UPDATE,
          roomData: sanitized
        }, ws);
      }
      break;
    }

    case NET_MESSAGE_TYPES.MATCHMAKE_REQ: {
      const matchedRoom = matchmaker.enqueue(msg.mode || 'duo', {
        ws,
        playerId: ws.clientInfo.playerId,
        nickname: ws.clientInfo.nickname,
        paletteId: ws.clientInfo.paletteId
      });

      if (matchedRoom) {
        const sanitized = roomManager.sanitizeRoomData(matchedRoom);
        broadcastToRoom(matchedRoom, {
          type: NET_MESSAGE_TYPES.ROOM_JOINED,
          roomCode: matchedRoom.code,
          roomData: sanitized
        });
      } else {
        sendJson(ws, {
          type: NET_MESSAGE_TYPES.MATCHMAKE_QUEUED,
          mode: msg.mode || 'duo'
        });
      }
      break;
    }

    case NET_MESSAGE_TYPES.SET_READY_REQ: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      const member = room.members.find(m => m.ws === ws);
      if (member) {
        member.ready = !!msg.ready;
        broadcastToRoom(room, {
          type: NET_MESSAGE_TYPES.ROOM_UPDATE,
          roomData: roomManager.sanitizeRoomData(room)
        });
      }
      break;
    }

    case NET_MESSAGE_TYPES.START_GAME_REQ: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      const member = room.members.find(m => m.ws === ws);
      if (!member || !member.isHost) return;

      room.state = 'PLAYING';
      if (msg.levelIndex !== undefined) room.levelIndex = msg.levelIndex;

      broadcastToRoom(room, {
        type: NET_MESSAGE_TYPES.GAME_STARTING,
        levelIndex: room.levelIndex,
        difficulty: room.difficulty
      });
      break;
    }

    case NET_MESSAGE_TYPES.INPUT_FRAME: {
      // Peer sending input to Host
      const room = roomManager.getRoomByWs(ws);
      if (!room || room.state !== 'PLAYING') return;

      const hostMember = room.members.find(m => m.isHost);
      if (hostMember && hostMember.ws && hostMember.ws !== ws) {
        sendJson(hostMember.ws, {
          type: NET_MESSAGE_TYPES.INPUT_FRAME,
          playerId: ws.clientInfo.playerId,
          frame: msg.frame
        });
      }
      break;
    }

    case NET_MESSAGE_TYPES.SNAPSHOT: {
      // Host broadcasting snapshot to all peers
      const room = roomManager.getRoomByWs(ws);
      if (!room || room.state !== 'PLAYING') return;

      broadcastToRoom(room, {
        type: NET_MESSAGE_TYPES.SNAPSHOT,
        snapshot: msg.snapshot
      }, ws);
      break;
    }

    case NET_MESSAGE_TYPES.GAME_EVENT: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      broadcastToRoom(room, msg, ws);
      break;
    }

    case NET_MESSAGE_TYPES.CHAT_MESSAGE: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      const cleanText = (msg.text || '').toString().slice(0, 140);
      broadcastToRoom(room, {
        type: NET_MESSAGE_TYPES.CHAT_MESSAGE,
        senderId: ws.clientInfo.playerId,
        nickname: ws.clientInfo.nickname,
        text: cleanText,
        timestamp: Date.now()
      });
      break;
    }

    case NET_MESSAGE_TYPES.PING_EVENT: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      broadcastToRoom(room, {
        type: NET_MESSAGE_TYPES.PING_EVENT,
        senderId: ws.clientInfo.playerId,
        nickname: ws.clientInfo.nickname,
        pingType: msg.pingType || 'here',
        x: msg.x,
        y: msg.y
      });
      break;
    }

    case NET_MESSAGE_TYPES.CHECKPOINT_SYNC: {
      const room = roomManager.getRoomByWs(ws);
      if (!room) return;
      room.lastCheckpoint = msg.checkpoint;
      break;
    }
  }
}

// Heartbeat interval (detect dead sockets every 30 seconds)
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`[Lumen Hollow Server] Relay & Lobby Server listening on http://localhost:${PORT}`);
});
