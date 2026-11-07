// src/net/NetworkSession.js - Central Multiplayer Session Coordinator
import {
  NET_PROTOCOL_VERSION,
  MULTIPLAYER_ENABLED,
  NET_MESSAGE_TYPES,
  ROOM_CONFIG,
  SeededRNG
} from '../../shared/protocol.js';
import { NullTransport, LoopbackTransport, WebSocketTransport } from './Transports.js';
import { GlobalNetEvents } from './NetworkEventBus.js';

export class NetworkSession {
  constructor(game) {
    this.game = game;
    this.transport = new NullTransport();
    this.isMultiplayer = false;
    this.isHost = true;
    this.roomCode = null;
    this.playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    this.sessionToken = localStorage.getItem('lumen_net_token') || ('tok_' + Math.random().toString(36).substring(2, 12));
    localStorage.setItem('lumen_net_token', this.sessionToken);

    this.nickname = localStorage.getItem('lumen_net_nickname') || 'Lumi';
    this.paletteId = parseInt(localStorage.getItem('lumen_net_palette') || '0', 10);

    this.tick = 0;
    this.inputSeq = 0;
    this.rng = new SeededRNG(1337);

    // Lobby & Room state
    this.roomData = null;
    this.onRoomUpdate = null; // UI callback
    this.onGameStart = null;
    this.onError = null;

    // Replication buffers
    this.pendingInputs = []; // Client-side input history for prediction/reconciliation
    this.receivedInputs = new Map(); // Host-side: playerId -> InputFrame[]
    this.latestSnapshot = null;
    this.snapshotHistory = [];
  }

  // Switch to NullTransport (Single-Player offline)
  setOffline() {
    if (this.transport) this.transport.disconnect();
    this.transport = new NullTransport();
    this.isMultiplayer = false;
    this.isHost = true;
    this.roomCode = null;
    this.roomData = null;
    if (this.game && this.game.playerManager) {
      this.game.playerManager.initLocalPlayer(this.nickname, this.paletteId);
    }
  }

  // Connect to WebSocket relay server
  connectToServer(serverUrl = 'ws://localhost:3000') {
    if (!MULTIPLAYER_ENABLED) return;
    if (this.transport) this.transport.disconnect();

    this.transport = new WebSocketTransport(serverUrl);
    this.setupTransportHandlers();
    this.transport.connect();
  }

  // Enable Loopback testing mode (runs 2-4 virtual players locally)
  enableLoopback(latencyMs = 40, jitterMs = 10, packetLoss = 0) {
    if (this.transport) this.transport.disconnect();

    const [tHost, tClient] = LoopbackTransport.createPair({
      latencyMs,
      jitterMs,
      packetLossRate: packetLoss
    });

    this.transport = tHost;
    this.isMultiplayer = true;
    this.isHost = true;
    this.setupTransportHandlers();
    tHost.connect();

    return tClient; // used to attach virtual client in test runners
  }

  setupTransportHandlers() {
    this.transport.onConnected = () => {
      // Send handshake
      this.send({
        type: NET_MESSAGE_TYPES.HANDSHAKE_REQ,
        version: NET_PROTOCOL_VERSION,
        playerId: this.playerId,
        sessionToken: this.sessionToken,
        nickname: this.nickname,
        paletteId: this.paletteId
      });
    };

    this.transport.onMessage = (msg) => {
      this.handleMessage(msg);
    };

    this.transport.onDisconnected = () => {
      GlobalNetEvents.emit('NET_DISCONNECTED');
    };

    this.transport.onError = (err) => {
      if (this.onError) this.onError(err);
    };
  }

  send(msg) {
    if (this.transport) {
      this.transport.send(msg);
    }
  }

  handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case NET_MESSAGE_TYPES.HANDSHAKE_ACK:
        this.playerId = msg.playerId || this.playerId;
        break;

      case NET_MESSAGE_TYPES.ROOM_CREATED:
      case NET_MESSAGE_TYPES.ROOM_JOINED:
      case NET_MESSAGE_TYPES.ROOM_UPDATE:
        this.roomCode = msg.roomCode || (this.roomData ? this.roomData.code : null);
        this.roomData = msg.roomData || msg;
        this.isMultiplayer = true;
        this.isHost = this.roomData.hostId === this.playerId;

        if (this.game && this.game.playerManager && this.roomData.members) {
          this.game.playerManager.setPartyMembers(this.roomData.members, this.playerId);
        }
        if (this.onRoomUpdate) this.onRoomUpdate(this.roomData);
        break;

      case NET_MESSAGE_TYPES.GAME_STARTING:
        if (this.onGameStart) this.onGameStart(msg);
        break;

      case NET_MESSAGE_TYPES.INPUT_FRAME:
        if (this.isHost) {
          // Host receives peer inputs
          if (!this.receivedInputs.has(msg.playerId)) {
            this.receivedInputs.set(msg.playerId, []);
          }
          this.receivedInputs.get(msg.playerId).push(msg.frame);
        }
        break;

      case NET_MESSAGE_TYPES.SNAPSHOT:
        if (!this.isHost) {
          // Client receives world snapshot from host
          this.latestSnapshot = msg.snapshot;
          this.snapshotHistory.push(msg.snapshot);
          if (this.snapshotHistory.length > 30) this.snapshotHistory.shift();
        }
        break;

      case NET_MESSAGE_TYPES.GAME_EVENT:
        GlobalNetEvents.emit(msg.event, msg.data);
        break;

      case NET_MESSAGE_TYPES.CHAT_MESSAGE:
        GlobalNetEvents.emit('CHAT_MESSAGE', msg);
        break;

      case NET_MESSAGE_TYPES.PING_EVENT:
        GlobalNetEvents.emit('PING_EVENT', msg);
        break;

      case NET_MESSAGE_TYPES.ERROR:
        if (this.onError) this.onError(msg.message || 'Network error');
        break;
    }
  }

  // Room actions
  createRoom(mode = 'duo', isPrivate = false, difficulty = 'Normal') {
    this.send({
      type: NET_MESSAGE_TYPES.CREATE_ROOM_REQ,
      mode,
      isPrivate,
      difficulty,
      levelIndex: this.game ? this.game.currentLevelIndex : 0,
      nickname: this.nickname,
      paletteId: this.paletteId
    });
  }

  joinRoom(code) {
    this.send({
      type: NET_MESSAGE_TYPES.JOIN_ROOM_REQ,
      roomCode: code.toUpperCase().trim(),
      nickname: this.nickname,
      paletteId: this.paletteId
    });
  }

  matchmake(mode = 'duo') {
    this.send({
      type: NET_MESSAGE_TYPES.MATCHMAKE_REQ,
      mode,
      nickname: this.nickname,
      paletteId: this.paletteId
    });
  }

  setReady(ready = true) {
    this.send({
      type: NET_MESSAGE_TYPES.SET_READY_REQ,
      ready
    });
  }

  startGame() {
    if (!this.isHost) return;
    this.send({
      type: NET_MESSAGE_TYPES.START_GAME_REQ,
      levelIndex: this.game ? this.game.currentLevelIndex : 0
    });
  }

  sendChat(text) {
    if (!text || text.trim() === '') return;
    this.send({
      type: NET_MESSAGE_TYPES.CHAT_MESSAGE,
      senderId: this.playerId,
      nickname: this.nickname,
      text: text.trim().substring(0, 140)
    });
  }

  sendPing(type, x, y) {
    this.send({
      type: NET_MESSAGE_TYPES.PING_EVENT,
      senderId: this.playerId,
      pingType: type,
      x: Math.round(x),
      y: Math.round(y)
    });
  }

  broadcastGameEvent(event, data) {
    if (this.isMultiplayer) {
      this.send({
        type: NET_MESSAGE_TYPES.GAME_EVENT,
        event,
        data
      });
    }
    // Also trigger locally
    GlobalNetEvents.emit(event, data);
  }
}
