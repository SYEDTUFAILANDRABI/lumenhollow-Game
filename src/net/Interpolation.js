// src/net/Interpolation.js - Entity Snapshot Interpolation Buffer
/**
 * Smoothly interpolates remote entities (teammates, enemies, boss)
 * using an adaptive time-delayed snapshot buffer (default 100ms delay).
 */
export class SnapshotInterpolator {
  constructor(interpDelayMs = 100) {
    this.snapshots = []; // { timestamp, tick, data: { players, enemies, boss, platforms } }
    this.interpDelayMs = interpDelayMs;
    this.maxSnapshots = 30;
  }

  pushSnapshot(snapshot) {
    const entry = {
      timestamp: performance.now(),
      tick: snapshot.tick || 0,
      data: snapshot
    };

    this.snapshots.push(entry);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  // Get interpolated state for a given timestamp
  getInterpolatedState(now = performance.now()) {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) return this.snapshots[0].data;

    const renderTime = now - this.interpDelayMs;

    // Find the two surrounding snapshots
    let s0 = null;
    let s1 = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime && this.snapshots[i + 1].timestamp >= renderTime) {
        s0 = this.snapshots[i];
        s1 = this.snapshots[i + 1];
        break;
      }
    }

    // If renderTime is ahead of newest snapshot, use newest
    if (!s0) {
      if (renderTime > this.snapshots[this.snapshots.length - 1].timestamp) {
        return this.snapshots[this.snapshots.length - 1].data;
      }
      return this.snapshots[0].data;
    }

    const span = s1.timestamp - s0.timestamp;
    const alpha = span > 0 ? Math.min(1, Math.max(0, (renderTime - s0.timestamp) / span)) : 1;

    return this.interpolateSnapshots(s0.data, s1.data, alpha);
  }

  interpolateSnapshots(d0, d1, alpha) {
    const result = {
      tick: d1.tick,
      players: [],
      enemies: [],
      boss: null,
      platforms: []
    };

    // Interpolate players
    if (d1.players && d0.players) {
      const p0Map = new Map(d0.players.map(p => [p.id, p]));
      for (const p1 of d1.players) {
        const p0 = p0Map.get(p1.id);
        if (p0) {
          result.players.push({
            id: p1.id,
            slot: p1.slot,
            nickname: p1.nickname,
            paletteId: p1.paletteId,
            x: p0.x + (p1.x - p0.x) * alpha,
            y: p0.y + (p1.y - p0.y) * alpha,
            vx: p1.vx,
            vy: p1.vy,
            facing: p1.facing,
            health: p1.health,
            energy: p1.energy,
            isDowned: p1.isDowned,
            reviveProgress: p1.reviveProgress || 0,
            animState: p1.animState
          });
        } else {
          result.players.push(p1);
        }
      }
    } else if (d1.players) {
      result.players = d1.players;
    }

    // Interpolate enemies
    if (d1.enemies && d0.enemies) {
      const e0Map = new Map(d0.enemies.map(e => [e.id, e]));
      for (const e1 of d1.enemies) {
        const e0 = e0Map.get(e1.id);
        if (e0) {
          result.enemies.push({
            id: e1.id,
            type: e1.type,
            x: e0.x + (e1.x - e0.x) * alpha,
            y: e0.y + (e1.y - e0.y) * alpha,
            vx: e1.vx,
            vy: e1.vy,
            health: e1.health,
            facing: e1.facing,
            state: e1.state
          });
        } else {
          result.enemies.push(e1);
        }
      }
    } else if (d1.enemies) {
      result.enemies = d1.enemies;
    }

    // Interpolate Boss
    if (d1.boss && d0.boss) {
      result.boss = {
        x: d0.boss.x + (d1.boss.x - d0.boss.x) * alpha,
        y: d0.boss.y + (d1.boss.y - d0.boss.y) * alpha,
        health: d1.boss.health,
        maxHealth: d1.boss.maxHealth,
        phase: d1.boss.phase,
        state: d1.boss.state,
        facing: d1.boss.facing
      };
    } else {
      result.boss = d1.boss || null;
    }

    // Interpolate moving platforms
    if (d1.platforms && d0.platforms) {
      const plat0Map = new Map(d0.platforms.map(p => [p.id, p]));
      for (const plat1 of d1.platforms) {
        const plat0 = plat0Map.get(plat1.id);
        if (plat0) {
          result.platforms.push({
            id: plat1.id,
            x: plat0.x + (plat1.x - plat0.x) * alpha,
            y: plat0.y + (plat1.y - plat0.y) * alpha
          });
        } else {
          result.platforms.push(plat1);
        }
      }
    } else if (d1.platforms) {
      result.platforms = d1.platforms;
    }

    return result;
  }

  clear() {
    this.snapshots = [];
  }
}
