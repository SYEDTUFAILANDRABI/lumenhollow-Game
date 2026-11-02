export const COMBAT = {
  SLASH: {
    COMBO_RESET_TIME: 0.55,
    STRIKES: [
      { damage: 16, range: 28, height: 26, duration: 0.22, knockback: 80, hitStop: 0.05, arcAngle: Math.PI * 0.75 },
      { damage: 22, range: 32, height: 28, duration: 0.24, knockback: 110, hitStop: 0.06, arcAngle: Math.PI * 0.85 },
      { damage: 36, range: 38, height: 34, duration: 0.32, knockback: 220, hitStop: 0.09, shockwave: true, arcAngle: Math.PI * 1.1 }
    ]
  },
  BOLT: {
    DAMAGE: 24,
    ENERGY_COST: 14,
    SPEED: 330,
    RADIUS: 6,
    RANGE: 360,
    LIFETIME: 1.2,
    HIT_STOP: 0.05
  },
  DASH: {
    DURATION: 0.22,
    SPEED: 350,
    COOLDOWN: 0.55,
    DELAYED_CUT_DAMAGE: 28,
    DELAYED_CUT_TIME: 0.24,
    INVULNERABLE_TIME: 0.26
  },
  PLUNGE: {
    FALL_SPEED: 520,
    DAMAGE: 38,
    RADIUS: 50,
    HIT_STOP: 0.08,
    MIN_AIR_TIME: 0.08
  },
  PARRY: {
    WINDOW: 0.14,           // 140ms grace period on slash start
    SLOWMO_TIME: 0.22,
    SLOWMO_SCALE: 0.15,
    COUNTER_BONUS: 1.5,
    METER_GAIN: 25
  },
  ECLIPSE: {
    MAX_METER: 100,
    DURATION: 8.0,
    HIT_GAIN: 5,
    KILL_GAIN: 15,
    COMBO_STEP_GAIN: 1.5,
    AURA_RADIUS: 1150,       // 1.5x screen diagonal covers entire screen and beyond
    AURA_CHARGE_TIME: 0.70,  // 0.7 seconds dramatic hold-to-charge build-up
    AURA_DAMAGE: 55,
    AURA_SLOWMO_DURATION: 0.40,
    AURA_SLOWMO_SCALE: 0.30,
    FORM_DAMAGE_MULT: 1.35,
    FORM_SPEED_MULT: 1.20,
    FORM_SLASH_SCALE: 1.45
  },
  WILL: {
    WISP: 20,
    DUMMY: 30,
    CROW: 45,
    KNIGHT: 65,
    BOSS: 95,
    // New Tier Will Values
    SKELETON_WARRIOR: 30,
    SKELETON_ARCHER: 25,
    BONE_KNIGHT: 38,
    FIRE_IMP: 50,
    HORNED_BRUTE: 62,
    HELL_CASTER: 58,
    DEMON_LORD: 85,
    ARCH_DEMON: 96,
    ABYSS_SOVEREIGN: 100
  },
  ENEMY_TIERS: {
    SKELETON_WARRIOR: { hp: 45, damage: 14, speed: 45, will: 30, xp: 25 },
    SKELETON_ARCHER:  { hp: 32, damage: 18, speed: 35, will: 25, xp: 25 },
    BONE_KNIGHT:      { hp: 75, damage: 22, speed: 50, will: 38, xp: 45 },
    FIRE_IMP:         { hp: 35, damage: 16, speed: 85, will: 50, xp: 35 },
    HORNED_BRUTE:     { hp: 110, damage: 28, speed: 70, will: 62, xp: 60 },
    HELL_CASTER:      { hp: 60, damage: 25, speed: 40, will: 58, xp: 55 },
    DEMON_LORD:       { hp: 420, damage: 30, speed: 65, will: 85, xp: 250 },
    ARCH_DEMON:       { hp: 550, damage: 35, speed: 95, will: 96, xp: 400 },
    ABYSS_SOVEREIGN:  { hp: 800, damage: 40, speed: 50, will: 100, xp: 800 }
  },
  ASTRAL: {
    MAX_SHADOW_ENERGY: 100,
    MIN_ACTIVATE_ENERGY: 50,
    DRAIN_RATE: 5.0, // ~20 seconds
    SPEED_MULT: 1.25,
    TRIPLE_JUMP_FORCE: -330,
    DAMAGE_MULT: 1.40,
    AURA_RADIUS_MULT: 1.50,
    SOLDIER_BUFF_MULT: 1.50
  },
  SHADOW_ARMY: {
    BASE_CAPACITY: 4,
    SOUL_MARKER_LIFETIME: 5.0,
    EXTRACTION_RATES: {
      SKELETON: 0.90,
      DEMON: 0.60,
      DEMON_LORD: 0.35,
      ARCH_DEMON: 0.20,
      ABYSS_SOVEREIGN: 0.00
    }
  },
  COMBO: {
    TIMEOUT: 2.4,
    GLOW_THRESHOLD: 5,
    MUSIC_INTENSE_THRESHOLD: 10
  }
};
