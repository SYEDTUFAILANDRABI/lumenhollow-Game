// src/net/Transports.js - Transport layer (NullTransport, LoopbackTransport, WebSocketTransport)
import { NET_MESSAGE_TYPES, ROOM_CONFIG } from '../../shared/protocol.js';

export class BaseTransport {
  constructor() {
    this.onMessage = null; // callback (msg)
    this.onConnected = null;
    this.onDisconnected = null;
    this.onError = null;
    this.isConnected = false;
  }

  send(msg) {}
  connect(options = {}) {}
  disconnect() {}
}

// 1. NullTransport - Default single-player transport with zero overhead
export class NullTransport extends BaseTransport {
  connect(options = {}) {
    this.isConnected = false;
  }

  send(msg) {
    // Single-player no-op
  }

  disconnect() {
    this.isConnected = false;
  }
}

// 2. LoopbackTransport - Virtual in-page network for fast automated tests & lag simulation
export class LoopbackTransport extends BaseTransport {
  constructor(options = {}) {
    super();
    this.latencyMs = options.latencyMs || 0;
    this.jitterMs = options.jitterMs || 0;
    this.packetLossRate = options.packetLossRate || 0; // 0.0 to 1.0
    this.peer = null; // paired LoopbackTransport
    this.packetQueue = [];
    this.timerId = null;
    this.isConnected = true;
  }

  static createPair(options = {}) {
    const a = new LoopbackTransport(options);
    const b = new LoopbackTransport(options);
    a.peer = b;
    b.peer = a;
    return [a, b];
  }

  connect(options = {}) {
    this.isConnected = true;
    if (this.onConnected) this.onConnected();
  }

  send(msg) {
    if (!this.isConnected || !this.peer) return;

    // Simulate packet loss
    if (this.packetLossRate > 0 && Math.random() < this.packetLossRate) {
      return; // dropped
    }

    // Clone to prevent shared memory reference mutations
    const payload = JSON.parse(JSON.stringify(msg));
    const delay = this.latencyMs + (Math.random() - 0.5) * 2 * this.jitterMs;
    const deliverAt = performance.now() + Math.max(0, delay);

    this.peer.queueDelivery(payload, deliverAt);
  }

  queueDelivery(payload, deliverAt) {
    this.packetQueue.push({ payload, deliverAt });
    this.packetQueue.sort((a, b) => a.deliverAt - b.deliverAt);
    this.scheduleDrain();
  }

  scheduleDrain() {
    if (this.timerId) return;
    const now = performance.now();
    const next = this.packetQueue[0];
    const wait = next ? Math.max(0, next.deliverAt - now) : 0;

    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.drain();
    }, wait);
  }

  drain() {
    const now = performance.now();
    while (this.packetQueue.length > 0 && this.packetQueue[0].deliverAt <= now) {
      const item = this.packetQueue.shift();
      if (this.isConnected && this.onMessage) {
        this.onMessage(item.payload);
      }
    }
    if (this.packetQueue.length > 0) {
      this.scheduleDrain();
    }
  }

  disconnect() {
    this.isConnected = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.packetQueue = [];
    if (this.onDisconnected) this.onDisconnected();
  }
}

// 3. WebSocketTransport - Production network client
export class WebSocketTransport extends BaseTransport {
  constructor(serverUrl = 'ws://localhost:3000') {
    super();
    this.serverUrl = serverUrl;
    this.socket = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.rtt = 0;
    this.lastPingTime = 0;
    this.shouldReconnect = true;
  }

  connect(options = {}) {
    if (options.serverUrl) this.serverUrl = options.serverUrl;
    this.shouldReconnect = true;

    try {
      this.socket = new WebSocket(this.serverUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.startHeartbeat();
        if (this.onConnected) this.onConnected();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === NET_MESSAGE_TYPES.HEARTBEAT_PONG) {
            this.rtt = Math.round(performance.now() - this.lastPingTime);
            return;
          }
          if (this.onMessage) this.onMessage(msg);
        } catch (err) {
          console.warn('Failed to parse incoming WebSocket message:', err);
        }
      };

      this.socket.onerror = (err) => {
        if (this.onError) this.onError(err);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        if (this.onDisconnected) this.onDisconnected();
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      if (this.onError) this.onError(err);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.lastPingTime = performance.now();
        this.send({ type: NET_MESSAGE_TYPES.HEARTBEAT_PING, t: this.lastPingTime });
      }
    }, ROOM_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && !this.isConnected) {
        this.connect();
      }
    }, 2500);
  }

  send(msg) {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(msg));
      return true;
    } catch (e) {
      console.warn('WebSocket send failed:', e);
      return false;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnected = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try { this.socket.close(); } catch (e) {}
      this.socket = null;
    }
    if (this.onDisconnected) this.onDisconnected();
  }
}
