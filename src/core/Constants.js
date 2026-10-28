export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const TILE_SIZE = 20;

export const COLORS = {
  VOID: '#090814',
  DEEP_INDIGO: '#1b1a3a',
  VIOLET: '#3d2c6b',
  TEAL: '#2a9d8f',
  TEAL_DARK: '#1e5f57',
  GOLD: '#ffd98a',
  GOLD_AMBER: '#ffb347',
  MOON_WHITE: '#f4f1ff',
  PINK: '#ff8fab',
  MOON_CYAN: '#7be0ad',
  SHADOW: 'rgba(9, 8, 20, 0.94)',
  FOG: '#191533'
};

export const PHYSICS = {
  GRAVITY: 850,
  MAX_FALL_SPEED: 420,
  MOVE_SPEED: 135,
  ACCELERATION: 950,
  DECELERATION: 1100,
  AIR_DECELERATION: 500,
  JUMP_FORCE: -310,
  JUMP_CUT_MULTIPLIER: 0.45,
  COYOTE_TIME: 0.1,        // 100 ms
  JUMP_BUFFER_TIME: 0.12   // 120 ms
};

export const LANTERN = {
  BASE_RADIUS: 90,
  PULSE_RADIUS: 220,
  MAX_ENERGY: 100,
  DRAIN_RATE: 28,          // Energy drained per second while holding pulse
  PASSIVE_RECHARGE: 12,    // Passive recharge per second
  BOOST_RECHARGE: 65,      // Near fireflies or lit shrines
  MIN_ENERGY_TO_PULSE: 8
};
