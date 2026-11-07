// src/net/InputFrame.js - Compact Input Frame Encoding & Decoding
import { INPUT_BITS } from '../../shared/protocol.js';

export class InputFrame {
  constructor(seq = 0, tick = 0, bits = 0, facing = 1) {
    this.seq = seq;
    this.tick = tick;
    this.bits = bits;
    this.facing = facing;
  }

  static fromRawInput(seq, tick, input, facing = 1) {
    if (!input) return new InputFrame(seq, tick, 0, facing);
    const actions = input.actions || input;
    let bits = 0;

    if (actions.left) bits |= INPUT_BITS.LEFT;
    if (actions.right) bits |= INPUT_BITS.RIGHT;
    if (actions.up) bits |= INPUT_BITS.UP;
    if (actions.down) bits |= INPUT_BITS.DOWN;
    if (actions.jump) bits |= INPUT_BITS.JUMP;
    if (actions.jumpJustPressed) bits |= INPUT_BITS.JUMP_PRESSED;
    if (actions.jumpJustReleased) bits |= INPUT_BITS.JUMP_RELEASED;
    if (actions.slashJustPressed) bits |= INPUT_BITS.SLASH_PRESSED;
    if (actions.dashJustPressed) bits |= INPUT_BITS.DASH_PRESSED;
    if (actions.pulse) bits |= INPUT_BITS.PULSE;
    if (actions.pulseJustPressed) bits |= INPUT_BITS.PULSE_PRESSED;
    if (actions.auraHold || actions.auraJustPressed) bits |= INPUT_BITS.AURA_HOLD;
    if (actions.skillSlot1) bits |= INPUT_BITS.SKILL_1;
    if (actions.skillSlot2) bits |= INPUT_BITS.SKILL_2;
    if (actions.skillSlot3) bits |= INPUT_BITS.SKILL_3;
    if (actions.interactJustPressed) bits |= INPUT_BITS.INTERACT_REVIVE;

    return new InputFrame(seq, tick, bits, facing);
  }

  // Synthesizes a contract-compliant `input` object matching what Player.update() expects
  toPlayerInput() {
    const bits = this.bits;
    const actions = {
      left: Boolean(bits & INPUT_BITS.LEFT),
      right: Boolean(bits & INPUT_BITS.RIGHT),
      up: Boolean(bits & INPUT_BITS.UP),
      down: Boolean(bits & INPUT_BITS.DOWN),
      jump: Boolean(bits & INPUT_BITS.JUMP),
      jumpJustPressed: Boolean(bits & INPUT_BITS.JUMP_PRESSED),
      jumpJustReleased: Boolean(bits & INPUT_BITS.JUMP_RELEASED),
      slashJustPressed: Boolean(bits & INPUT_BITS.SLASH_PRESSED),
      dashJustPressed: Boolean(bits & INPUT_BITS.DASH_PRESSED),
      plungeJustPressed: Boolean((bits & INPUT_BITS.DOWN) && (bits & INPUT_BITS.JUMP_PRESSED)),
      pulse: Boolean(bits & INPUT_BITS.PULSE),
      pulseJustPressed: Boolean(bits & INPUT_BITS.PULSE_PRESSED),
      auraHold: Boolean(bits & INPUT_BITS.AURA_HOLD),
      auraJustPressed: false,
      skillSlot1: Boolean(bits & INPUT_BITS.SKILL_1),
      skillSlot2: Boolean(bits & INPUT_BITS.SKILL_2),
      skillSlot3: Boolean(bits & INPUT_BITS.SKILL_3),
      interactJustPressed: Boolean(bits & INPUT_BITS.INTERACT_REVIVE)
    };

    const keys = new Map();
    if (actions.down) keys.set('KeyS', true);

    return {
      actions,
      keys,
      facing: this.facing
    };
  }

  serialize() {
    return {
      s: this.seq,
      t: this.tick,
      b: this.bits,
      f: this.facing
    };
  }

  static deserialize(obj) {
    if (!obj) return new InputFrame();
    return new InputFrame(obj.s || 0, obj.t || 0, obj.b || 0, obj.f || 1);
  }
}
