// GamepadManager.js - Gamepad API wrapper with Auto-detection, Deadzones, and Vibration
import { Settings } from '../settingsManager/SettingsManager.js';

export class GamepadManager {
  constructor() {
    this.gamepadIndex = null;
    this.connected = false;
    this.prevButtons = new Map();
    this.vibrationSupported = false;

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.connected = true;
      this.vibrationSupported = !!(e.gamepad.vibrationActuator);
      console.log(`Gamepad connected: ${e.gamepad.id} at index ${e.gamepad.index}`);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.connected = false;
        console.log('Gamepad disconnected');
      }
    });
  }

  getGamepad() {
    if (this.gamepadIndex === null) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < pads.length; i++) {
        if (pads[i]) {
          this.gamepadIndex = i;
          this.connected = true;
          this.vibrationSupported = !!(pads[i].vibrationActuator);
          return pads[i];
        }
      }
      return null;
    }
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    return pads[this.gamepadIndex] || null;
  }

  update() {
    const pad = this.getGamepad();
    if (!pad) return null;

    const deadzone = Settings.get('gamepadDeadzone') || 0.18;

    // Standard Gamepad Mapping
    // Buttons: 0: A/Cross, 1: B/Circle, 2: X/Square, 3: Y/Triangle,
    // 4: LB, 5: RB, 6: LT, 7: RT, 8: Select/Back, 9: Start,
    // 12: D-Up, 13: D-Down, 14: D-Left, 15: D-Right
    const b = (idx) => pad.buttons[idx] ? pad.buttons[idx].pressed : false;

    // Analog axes (Left stick)
    const axisX = Math.abs(pad.axes[0]) > deadzone ? pad.axes[0] : 0;
    const axisY = Math.abs(pad.axes[1]) > deadzone ? pad.axes[1] : 0;

    const left = b(14) || axisX < -0.3;
    const right = b(15) || axisX > 0.3;
    const up = b(12) || axisY < -0.3;
    const down = b(13) || axisY > 0.3;

    const justPressed = (idx) => {
      const isDown = b(idx);
      const wasDown = !!this.prevButtons.get(idx);
      return isDown && !wasDown;
    };

    const state = {
      connected: true,
      left,
      right,
      up,
      down,
      navUpJustPressed: justPressed(12) || (axisY < -0.5 && !this.prevAxisUp),
      navDownJustPressed: justPressed(13) || (axisY > 0.5 && !this.prevAxisDown),
      navLeftJustPressed: justPressed(14) || (axisX < -0.5 && !this.prevAxisLeft),
      navRightJustPressed: justPressed(15) || (axisX > 0.5 && !this.prevAxisRight),
      confirmJustPressed: justPressed(0), // A
      cancelJustPressed: justPressed(1),  // B
      jump: b(0),
      jumpJustPressed: justPressed(0),
      slashJustPressed: justPressed(2),   // X
      boltJustPressed: justPressed(3),    // Y
      dashJustPressed: justPressed(7) || justPressed(1), // RT or B
      pulse: b(6) || b(4),                // LT or LB
      auraHold: b(5),                     // RB
      auraJustPressed: justPressed(5),
      summonJustPressed: justPressed(3),  // Y
      pauseJustPressed: justPressed(9)    // Start
    };

    // Store state for justPressed tracking
    for (let i = 0; i < pad.buttons.length; i++) {
      this.prevButtons.set(i, pad.buttons[i].pressed);
    }
    this.prevAxisUp = axisY < -0.5;
    this.prevAxisDown = axisY > 0.5;
    this.prevAxisLeft = axisX < -0.5;
    this.prevAxisRight = axisX > 0.5;

    return state;
  }

  vibrate(durationMs = 80, weak = 0.5, strong = 0.7) {
    if (!Settings.get('gamepadVibration')) return;
    const pad = this.getGamepad();
    if (pad && pad.vibrationActuator && pad.vibrationActuator.playEffect) {
      try {
        pad.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: weak,
          strongMagnitude: strong
        });
      } catch (e) {}
    }
  }
}

export const Gamepad = new GamepadManager();
