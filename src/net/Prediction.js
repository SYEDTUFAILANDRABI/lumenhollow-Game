// src/net/Prediction.js - Client-Side Prediction and Reconciliation
/**
 * Manages local player movement prediction on client machines
 * and reconciles with authoritative host snapshots.
 */
export class ClientPrediction {
  constructor(player) {
    this.player = player;
    this.inputHistory = []; // { seq, tick, frame, state: { x, y, vx, vy } }
    this.maxHistory = 120; // 2 seconds at 60 FPS
    this.correctionDeltaX = 0;
    this.correctionDeltaY = 0;
    this.correctionSmoothing = 0.25; // Exp decay factor per frame
    this.errorThreshold = 14; // pixels error before hard-snapping
  }

  // Record an input and current predicted state
  recordInput(seq, tick, frame) {
    this.inputHistory.push({
      seq,
      tick,
      frame,
      state: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        isGrounded: this.player.isGrounded,
        facing: this.player.facing
      }
    });

    if (this.inputHistory.length > this.maxHistory) {
      this.inputHistory.shift();
    }
  }

  // Reconcile with authoritative host state
  reconcile(ackSeq, hostState) {
    if (!hostState) return;

    // Discard acknowledged inputs
    const idx = this.inputHistory.findIndex(entry => entry.seq === ackSeq);
    if (idx === -1) {
      // Seq older than history or not found; apply host pos with soft delta
      const errX = hostState.x - this.player.x;
      const errY = hostState.y - this.player.y;
      if (Math.hypot(errX, errY) > this.errorThreshold * 2) {
        this.player.x = hostState.x;
        this.player.y = hostState.y;
        this.correctionDeltaX = 0;
        this.correctionDeltaY = 0;
      }
      return;
    }

    const predictedAtAck = this.inputHistory[idx].state;
    // Remove past acknowledged entries
    this.inputHistory.splice(0, idx + 1);

    const errX = hostState.x - predictedAtAck.x;
    const errY = hostState.y - predictedAtAck.y;
    const errDist = Math.hypot(errX, errY);

    if (errDist > this.errorThreshold) {
      // Large deviation: snap to host state and clear smoothing
      this.player.x = hostState.x;
      this.player.y = hostState.y;
      this.player.vx = hostState.vx || 0;
      this.player.vy = hostState.vy || 0;
      this.correctionDeltaX = 0;
      this.correctionDeltaY = 0;
    } else if (errDist > 1.5) {
      // Minor divergence: apply smooth correction offset
      this.correctionDeltaX = errX;
      this.correctionDeltaY = errY;
    }
  }

  // Apply smoothing decay every render/update frame
  updateSmoothing() {
    if (Math.abs(this.correctionDeltaX) > 0.05 || Math.abs(this.correctionDeltaY) > 0.05) {
      this.player.x += this.correctionDeltaX * this.correctionSmoothing;
      this.player.y += this.correctionDeltaY * this.correctionSmoothing;
      this.correctionDeltaX *= (1 - this.correctionSmoothing);
      this.correctionDeltaY *= (1 - this.correctionSmoothing);
    } else {
      this.correctionDeltaX = 0;
      this.correctionDeltaY = 0;
    }
  }

  reset() {
    this.inputHistory = [];
    this.correctionDeltaX = 0;
    this.correctionDeltaY = 0;
  }
}
