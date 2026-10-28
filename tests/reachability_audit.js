import { PHYSICS, TILE_SIZE } from '../src/core/Constants.js';
import { Level1Data } from '../src/levels/Level1.js';
import { Level2Data } from '../src/levels/Level2.js';
import { Level3Data } from '../src/levels/Level3.js';
import { Level4Data } from '../src/levels/Level4.js';

function simulateSingleJump() {
  let y = 0;
  let vy = PHYSICS.JUMP_FORCE;
  let t = 0;
  const dt = 0.005;

  let maxY = 0;
  while (vy < 0) {
    let g = PHYSICS.GRAVITY_UP;
    if (Math.abs(vy) < PHYSICS.APEX_HANG_VELOCITY) {
      g *= PHYSICS.APEX_HANG_GRAVITY_MULT;
    }
    vy += g * dt;
    y += vy * dt;
    t += dt;
    if (-y > maxY) maxY = -y;
  }

  // Fall back to 0
  while (y < 0) {
    vy += PHYSICS.GRAVITY_DOWN * dt;
    y += vy * dt;
    t += dt;
  }

  const maxDist = PHYSICS.MOVE_SPEED * t;
  return {
    heightPx: maxY,
    heightTiles: maxY / TILE_SIZE,
    hangTimeSeconds: t,
    distPx: maxDist,
    distTiles: maxDist / TILE_SIZE
  };
}

function simulateDoubleJump() {
  const single = simulateSingleJump();
  // Double jump triggered at apex
  let y = 0;
  let vy = PHYSICS.DOUBLE_JUMP_FORCE;
  let t = 0;
  const dt = 0.005;
  let maxY2 = 0;
  while (vy < 0) {
    let g = PHYSICS.GRAVITY_UP;
    if (Math.abs(vy) < PHYSICS.APEX_HANG_VELOCITY) {
      g *= PHYSICS.APEX_HANG_GRAVITY_MULT;
    }
    vy += g * dt;
    y += vy * dt;
    t += dt;
    if (-y > maxY2) maxY2 = -y;
  }
  while (y < 0) {
    vy += PHYSICS.GRAVITY_DOWN * dt;
    y += vy * dt;
    t += dt;
  }

  const totalHeight = single.heightPx + maxY2;
  const totalTime = single.hangTimeSeconds + t;
  const totalDist = PHYSICS.MOVE_SPEED * totalTime;

  return {
    heightPx: totalHeight,
    heightTiles: totalHeight / TILE_SIZE,
    distPx: totalDist,
    distTiles: totalDist / TILE_SIZE
  };
}

console.log('=== LUMEN HOLLOW JUMP REACHABILITY AUDIT ===');
const single = simulateSingleJump();
const double = simulateDoubleJump();

console.log(`Single Jump: Max Height = ${single.heightPx.toFixed(1)}px (${single.heightTiles.toFixed(2)} tiles) [Req: >= 4 tiles]`);
console.log(`Single Jump: Max Distance = ${single.distPx.toFixed(1)}px (${single.distTiles.toFixed(2)} tiles) [Req: ~7 tiles]`);
console.log(`Double Jump: Max Height = ${double.heightPx.toFixed(1)}px (${double.heightTiles.toFixed(2)} tiles)`);
console.log(`Double Jump: Max Distance = ${double.distPx.toFixed(1)}px (${double.distTiles.toFixed(2)} tiles)`);

if (single.heightTiles >= 4 && single.distTiles >= 6.5) {
  console.log('PASS: Single jump meets or exceeds 4 tiles height and ~7 tiles distance!');
} else {
  console.warn('FAIL: Single jump below requirements!');
}

const levels = [Level1Data, Level2Data, Level3Data, Level4Data];
let allOk = true;

for (const lvl of levels) {
  console.log(`\nAuditing Level: "${lvl.name}" (${lvl.ascii[0].length}x${lvl.ascii.length})`);
  const lines = lvl.ascii;
  const platforms = [];
  const shards = [];
  const shrines = [];
  let player = null;
  let exit = null;

  for (let r = 0; r < lines.length; r++) {
    for (let c = 0; c < lines[r].length; c++) {
      const ch = lines[r][c];
      if (ch === 'P') player = { c, r };
      if (ch === 'E') exit = { c, r };
      if (ch === '*') shards.push({ c, r });
      if (ch === 'S') shrines.push({ c, r });
      if (ch === '#' || ch === '_' || ch === 'M' || ch === '~') {
        // Platform top if cell above is not solid
        if (r > 0 && lines[r - 1][c] !== '#') {
          platforms.push({ c, r, ch });
        }
      }
    }
  }

  console.log(`  Platforms: ${platforms.length}, Shards: ${shards.length}, Shrines: ${shrines.length}`);

  // Check each shard to ensure at least one platform is within double jump range
  for (const s of shards) {
    const nearby = platforms.filter(p => {
      const dy = p.r - s.r; // positive means platform is below shard
      const dx = Math.abs(p.c - s.c);
      return dy >= -double.heightTiles && dy <= 6 && dx <= double.distTiles;
    });
    if (nearby.length === 0) {
      console.warn(`  [WARNING] Shard at (${s.c}, ${s.r}) may be unreachable!`);
      allOk = false;
    } else {
      console.log(`  Shard at (${s.c}, ${s.r}) reachable from ${nearby.length} nearby platforms.`);
    }
  }

  // Check shrines
  for (const sh of shrines) {
    const floorBelow = platforms.some(p => p.r === sh.r + 1 && Math.abs(p.c - sh.c) <= 2);
    if (!floorBelow) {
      console.warn(`  [WARNING] Shrine at (${sh.c}, ${sh.r}) has no solid ground below!`);
      allOk = false;
    }
  }
}

if (allOk) {
  console.log('\nALL LEVELS PASSED REACHABILITY AUDIT!');
}
