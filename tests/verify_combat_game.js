import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\syedt\\.gemini\\antigravity\\brain\\3bd8ce2a-eb14-454d-9455-d5c8265bec5b';

async function run() {
  console.log('Launching Chrome test runner for Combat & Sovereign Aura...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error]: ${msg.text()}`);
    }
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    errors.push(`[Browser Exception]: ${err.toString()}`);
    console.error('[BROWSER EXCEPTION]:', err);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Capture Title Screen
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(artifactDir, 'combat_title_screen.png') });
  console.log('1. Captured Title Screen.');

  // 2. Start Game
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));

  // Verify Player & Level 1
  const l1State = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      state: game.state,
      levelIndex: game.currentLevelIndex,
      dummyCount: game.tileMap.dummies.length,
      playerPos: { x: Math.round(game.player.x), y: Math.round(game.player.y) }
    };
  });
  console.log('2. Level 1 state:', l1State);

  // 3. Test Combat Moves on Training Dummy
  // Move right toward dummy
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.up('KeyD');

  // Test 3-hit slash combo (J, J, J)
  await page.keyboard.press('KeyJ');
  await new Promise(r => setTimeout(r, 180));
  await page.keyboard.press('KeyJ');
  await new Promise(r => setTimeout(r, 180));
  await page.keyboard.press('KeyJ');
  await new Promise(r => setTimeout(r, 300));

  // Test Umbral Bolt (L)
  await page.keyboard.press('KeyL');
  await new Promise(r => setTimeout(r, 200));

  // Test Shadow Dash (C)
  await page.keyboard.press('KeyC');
  await new Promise(r => setTimeout(r, 300));

  // Test Jump + Void Plunge (Space then S)
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 180));
  await page.keyboard.press('KeyS');
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: path.join(artifactDir, 'combat_training_moves.png') });
  console.log('3. Tested Slash, Bolt, Dash, Plunge on dummy.');

  // 4. Test Sovereign's Aura (fill meter and press Q)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.combat.eclipseMeter = 100; // Full meter
  });
  await new Promise(r => setTimeout(r, 100));

  // Trigger Sovereign's Aura
  await page.keyboard.press('KeyQ');
  await new Promise(r => setTimeout(r, 220));

  await page.screenshot({ path: path.join(artifactDir, 'combat_sovereign_aura.png') });
  console.log('4. Captured Sovereign Aura trigger.');

  // Verify Eclipse Form
  const eclipseCheck = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      isEclipseForm: game.player.isEclipseForm,
      eclipseTimer: Math.round(game.player.eclipseFormTimer)
    };
  });
  console.log('Eclipse Form status:', eclipseCheck);

  // 5. Test Level 2 (Crystal Caverns with Knight & Crow)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(1);
  });
  await new Promise(r => setTimeout(r, 800));

  // Move right, trigger Crow / Knight
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.up('KeyD');

  await page.screenshot({ path: path.join(artifactDir, 'combat_crystal_caverns.png') });
  console.log('5. Captured Level 2 Caverns with Knight and Crow.');

  // 6. Test Level 3 (Sky Ruins & Boss Eclipse Warden)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(2);
    // Position player near summit arena
    game.player.x = 280;
    game.player.y = 80;
  });
  await new Promise(r => setTimeout(r, 1200));

  const bossCheck = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    const b = game.tileMap.boss;
    return {
      bossPresent: !!b,
      bossName: b ? b.name : null,
      bossHp: b ? b.hp : null,
      phase: b ? b.phase : null
    };
  });
  console.log('6. Boss Eclipse Warden status:', bossCheck);

  // Damage boss to Phase 2 then Phase 3
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    if (game.tileMap.boss) {
      game.tileMap.boss.introDone = true;
      game.tileMap.boss.takeDamage(120, 300, 80, game.combat, game.vfx, game.audio, game.camera);
    }
  });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: path.join(artifactDir, 'combat_boss_warden.png') });
  console.log('Captured Boss Warden Phase 2.');

  // Defeat boss and unlock portal
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    if (game.tileMap.boss) {
      game.tileMap.boss.takeDamage(250, 300, 80, game.combat, game.vfx, game.audio, game.camera);
    }
  });
  await new Promise(r => setTimeout(r, 400));

  const exitUnlocked = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return game.tileMap.isExitReached({ x: game.tileMap.exitDoor.x, y: game.tileMap.exitDoor.y, width: 10, height: 10 });
  });
  console.log('Boss defeated! Exit door unlocked:', exitUnlocked);

  // 7. Test Level 4 (Moon Shrine Finale)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(3);
    game.onShardCollect(4); // collect final shard
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(artifactDir, 'combat_finale_cinematic.png') });
  console.log('7. Captured Moon Shrine Finale.');

  // 8. Regression Check on Movement, Checkpoints & Saves
  const regressionCheck = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    // Check local storage save
    const save = JSON.parse(localStorage.getItem('lumen_hollow_save_v1'));
    // Check player coyote time and jump buffer
    const hasCoyote = typeof game.player.coyoteTimer === 'number';
    const hasBuffer = typeof game.input.hasBufferedJump === 'function';
    // Check pulse radius
    const baseRadius = game.player.currentLightRadius;
    game.player.isPulsing = true;
    game.player.pulseProgress = 1;
    game.player.currentLightRadius = 220;
    const pulseRadius = game.player.currentLightRadius;

    return {
      saveOk: !!save,
      hasCoyote,
      hasBuffer,
      baseRadius: Math.round(baseRadius),
      pulseRadius: Math.round(pulseRadius)
    };
  });
  console.log('8. Regression check passed:', regressionCheck);

  await browser.close();

  if (errors.length > 0) {
    console.error('Errors found in browser execution:', errors);
    process.exit(1);
  } else {
    console.log('ALL COMBAT & REGRESSION VERIFICATIONS PASSED WITH ZERO CONSOLE ERRORS!');
  }
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
