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
    AURA_RADIUS: 220,
    AURA_DAMAGE: 45,
    AURA_SLOWMO_DURATION: 0.20,
    AURA_SLOWMO_SCALE: 0.10,
    FORM_DAMAGE_MULT: 1.35,
    FORM_SPEED_MULT: 1.20,
    FORM_SLASH_SCALE: 1.45
  },
  WILL: {
    WISP: 20,
    DUMMY: 30,
    CROW: 45,
    KNIGHT: 65,
    BOSS: 95
  },
  COMBO: {
    TIMEOUT: 2.4,
    GLOW_THRESHOLD: 5,
    MUSIC_INTENSE_THRESHOLD: 10
  }
};
