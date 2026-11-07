// shared/protocol.js - Single source of truth for Lumen Hollow Multiplayer
// Used across both client (/src) and server (/server)

export const NET_PROTOCOL_VERSION = 1;
export const MULTIPLAYER_ENABLED = true;

export const ROOM_CONFIG = {
  CODE_LENGTH: 6,
  CODE_ALPHABET: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // excludes confusing 0/O, 1/I
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 1,
  TICK_RATE: 60,
  SNAPSHOT_RATE: 20, // 20 Hz network snapshot broadcast
  HEARTBEAT_INTERVAL_MS: 3000,
  CLIENT_TIMEOUT_MS: 10000,
  RECONNECT_GRACE_MS: 45000,
  INTERPOLATION_DELAY_MS: 100
};

export const NET_MESSAGE_TYPES = {
  // Handshake & Lobby
  HANDSHAKE_REQ: 'HANDSHAKE_REQ',
  HANDSHAKE_ACK: 'HANDSHAKE_ACK',
  CREATE_ROOM_REQ: 'CREATE_ROOM_REQ',
  ROOM_CREATED: 'ROOM_CREATED',
  JOIN_ROOM_REQ: 'JOIN_ROOM_REQ',
  ROOM_JOINED: 'ROOM_JOINED',
  ROOM_UPDATE: 'ROOM_UPDATE',
  LEAVE_ROOM_REQ: 'LEAVE_ROOM_REQ',
  KICK_PLAYER_REQ: 'KICK_PLAYER_REQ',
  SET_READY_REQ: 'SET_READY_REQ',
  START_GAME_REQ: 'START_GAME_REQ',
  GAME_STARTING: 'GAME_STARTING',
  MATCHMAKE_REQ: 'MATCHMAKE_REQ',
  MATCHMAKE_CANCEL: 'MATCHMAKE_CANCEL',

  // Gameplay Replication
  INPUT_FRAME: 'INPUT_FRAME',
  SNAPSHOT: 'SNAPSHOT',
  GAME_EVENT: 'GAME_EVENT',
  CHECKPOINT_SYNC: 'CHECKPOINT_SYNC',
  REVIVE_REQUEST: 'REVIVE_REQUEST',
  REVIVE_SUCCESS: 'REVIVE_SUCCESS',

  // Communication & Tools
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  PING_EVENT: 'PING_EVENT',
  HOST_MIGRATION: 'HOST_MIGRATION',
  HEARTBEAT_PING: 'HEARTBEAT_PING',
  HEARTBEAT_PONG: 'HEARTBEAT_PONG',
  ERROR: 'ERROR'
};

// Compact 16-bit input frame bitmask
export const INPUT_BITS = {
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  UP: 1 << 2,
  DOWN: 1 << 3,
  JUMP: 1 << 4,
  JUMP_PRESSED: 1 << 5,
  JUMP_RELEASED: 1 << 6,
  SLASH_PRESSED: 1 << 7,
  DASH_PRESSED: 1 << 8,
  PULSE: 1 << 9,
  PULSE_PRESSED: 1 << 10,
  AURA_HOLD: 1 << 11,
  SKILL_1: 1 << 12,
  SKILL_2: 1 << 13,
  SKILL_3: 1 << 14,
  INTERACT_REVIVE: 1 << 15
};

export const PLAYER_STATES = {
  ALIVE: 'ALIVE',
  DOWNED: 'DOWNED', // floating celestial wisp seeking revive
  REVIVING: 'REVIVING',
  DEAD: 'DEAD',
  DISCONNECTED: 'DISCONNECTED'
};

export const ENTITY_TYPES = {
  PLAYER: 1,
  ENEMY_WISP: 2,
  ENEMY_SKELETON: 3,
  ENEMY_ARCHER: 4,
  ENEMY_BONE_KNIGHT: 5,
  ENEMY_DEMON_IMP: 6,
  ENEMY_DEMON_BRUTE: 7,
  ENEMY_DEMON_CASTER: 8,
  BOSS_WARDEN: 9,
  BOSS_MALDREK: 10,
  BOSS_AZRAKUL: 11,
  BOSS_NYTHRAX: 12,
  MOVING_PLATFORM: 13,
  PROJECTILE: 14,
  SOUL_MARKER: 15,
  SUMMON: 16
};

// Curated 4-player color palettes (Cloak & Lantern)
export const PLAYER_PALETTES = [
  {
    id: 0,
    name: 'Twilight Dusk',
    cloak: '#2a9d8f', // Radiant Teal (Lumi Classic)
    cloakShadow: '#1e5f57',
    lantern: '#ffd98a',
    glow: 'rgba(255, 217, 138, 0.45)',
    wisp: '#7be0ad'
  },
  {
    id: 1,
    name: 'Amethyst Night',
    cloak: '#9d4edd', // Royal Violet
    cloakShadow: '#5a189a',
    lantern: '#e0aaff',
    glow: 'rgba(224, 170, 255, 0.45)',
    wisp: '#c77dff'
  },
  {
    id: 2,
    name: 'Ember Hearth',
    cloak: '#e76f51', // Warm Ember Coral
    cloakShadow: '#9c3820',
    lantern: '#ffb703',
    glow: 'rgba(255, 183, 3, 0.45)',
    wisp: '#f4a261'
  },
  {
    id: 3,
    name: 'Celestial Jade',
    cloak: '#52b788', // Emerald Jade
    cloakShadow: '#2d6a4f',
    lantern: '#b7e4c7',
    glow: 'rgba(183, 228, 199, 0.45)',
    wisp: '#74c69d'
  }
];

export const COOP_CONFIG = {
  REVIVE: {
    CHANNEL_TIME_S: 1.8,
    CHANNEL_RADIUS_PX: 50,
    WISP_SPEED_PX: 75,
    WISP_FLOAT_AMPLITUDE: 6
  },
  SCALING: {
    HP_MULTIPLIERS: [1.0, 1.6, 2.2, 2.8],
    BOSS_HP_MULTIPLIERS: [1.0, 1.7, 2.4, 3.0],
    MAX_ALLIED_SUMMONS_TOTAL: 4
  },
  CAMERA: {
    MIN_ZOOM: 0.85,
    MAX_ZOOM: 1.05,
    TETHER_WARNING_DIST: 420,
    TETHER_PULL_DIST: 520,
    TETHER_SPEED: 450
  },
  SYNERGIES: {
    LINK_PULSE_MAX_DIST: 95,
    LINK_PULSE_BONUS_STUN_S: 1.5,
    COOP_AURA_DAMAGE_BOOST: 1.5
  }
};

// Seeded Pseudo-Random Number Generator for host-authoritative deterministic events
export class SeededRNG {
  constructor(seed = 1337) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  choice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(this.next() * arr.length)];
  }
}
