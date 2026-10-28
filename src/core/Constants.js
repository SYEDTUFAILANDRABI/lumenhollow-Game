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
  // Asymmetric Gravity & Jump Tuning
  GRAVITY_UP: 620,             // Lower gravity while rising for floaty, responsive ascent
  GRAVITY_DOWN: 1020,          // Stronger gravity while falling for snappy descent
  APEX_HANG_VELOCITY: 45,      // Velocity threshold considered "apex / top of jump"
  APEX_HANG_GRAVITY_MULT: 0.38,// Significant hang time at the apex
  MAX_FALL_SPEED: 460,         // Terminal velocity
  FAST_FALL_SPEED: 620,        // Max fall speed when holding down

  MOVE_SPEED: 145,             // Base run speed (~7 tiles horizontal distance across jump)
  ACCELERATION: 1100,          // Snappy ground acceleration
  DECELERATION: 1300,          // Responsive ground stopping
  AIR_ACCELERATION: 850,       // Good responsive air control
  AIR_DECELERATION: 400,       // Low friction in air

  JUMP_FORCE: -385,            // 1st jump clears 4+ tiles vertically (~85px)
  DOUBLE_JUMP_FORCE: -340,     // Double jump for extra verticality and recovery
  JUMP_CUT_MULTIPLIER: 0.42,   // Variable jump height cut on early release
  COYOTE_TIME: 0.12,           // 120 ms
  JUMP_BUFFER_TIME: 0.12,      // 120 ms

  // Firefly Glide & Wall Mechanics
  GLIDE_FALL_SPEED: 65,        // Slow, controlled glide descent
  GLIDE_GRAVITY: 85,           // Gentle gravity while holding jump in air
  WALL_SLIDE_SPEED: 70,        // Cling and slow slide down walls
  WALL_JUMP_FORCE_X: 230,      // Horizontal impulse away from wall
  WALL_JUMP_FORCE_Y: -360,     // Vertical pop up from wall jump

  // Dash & Knockback
  DASH_SPEED: 380,
  DASH_DURATION: 0.22
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
