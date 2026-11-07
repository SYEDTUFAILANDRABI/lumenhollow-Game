// src/net/NetworkEventBus.js - Decoupled Gameplay & Presentation Event Bus

export class NetworkEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType, handler) {
    const list = this.listeners.get(eventType);
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit(eventType, data) {
    const list = this.listeners.get(eventType);
    if (list) {
      for (let i = 0; i < list.length; i++) {
        try {
          list[i](data);
        } catch (e) {
          console.error(`Error in event listener for ${eventType}:`, e);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const GlobalNetEvents = new NetworkEventBus();
