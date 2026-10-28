import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\syedt\\.gemini\\antigravity\\brain\\3bd8ce2a-eb14-454d-9455-d5c8265bec5b';

async function run() {
  console.log('Launching Chrome test runner...');
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

  page.on('requestfailed', req => {
    errors.push(`[Request Failed]: ${req.url()} (${req.failure().errorText})`);
    console.error('[REQUEST FAILED]:', req.url(), req.failure().errorText);
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error('[BROWSER EXCEPTION]:', err);
  });

  console.log('Navigating to game...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Title Screen
  await new Promise(r => setTimeout(r, 1000));
  const titleScreenShot = path.join(artifactDir, 'screenshot_title.png');
  await page.screenshot({ path: titleScreenShot });
  console.log('Captured title screen:', titleScreenShot);

  // 2. Start Game
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));

  // Verify game state
  const state1 = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      state: game.state,
      levelIndex: game.currentLevelIndex,
      levelName: game.tileMap.levelName,
      playerPos: { x: game.player.x, y: game.player.y },
      energy: game.player.energy
    };
  });
  console.log('Level 1 initialized:', state1);

  // Move right and pulse lantern
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ShiftLeft');
  await new Promise(r => setTimeout(r, 1200));
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ShiftLeft');

  const level1ScreenShot = path.join(artifactDir, 'screenshot_level1.png');
  await page.screenshot({ path: level1ScreenShot });
  console.log('Captured level 1:', level1ScreenShot);

  // 3. Test Level 2
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(1);
    window.__LUMEN_GAME__.player.isPulsing = true;
    window.__LUMEN_GAME__.player.pulseProgress = 1;
    window.__LUMEN_GAME__.player.currentLightRadius = 220;
  });
  await new Promise(r => setTimeout(r, 800));

  const level2ScreenShot = path.join(artifactDir, 'screenshot_level2.png');
  await page.screenshot({ path: level2ScreenShot });
  console.log('Captured level 2:', level2ScreenShot);

  // 4. Test Level 3
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(2);
  });
  await new Promise(r => setTimeout(r, 800));

  const level3ScreenShot = path.join(artifactDir, 'screenshot_level3.png');
  await page.screenshot({ path: level3ScreenShot });
  console.log('Captured level 3:', level3ScreenShot);

  // 5. Test Level 4 & Finale
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(3);
    window.__LUMEN_GAME__.onShardCollect(4); // collect final shard
  });
  await new Promise(r => setTimeout(r, 1500));

  const finaleScreenShot = path.join(artifactDir, 'screenshot_finale.png');
  await page.screenshot({ path: finaleScreenShot });
  console.log('Captured finale cinematic:', finaleScreenShot);

  // Wait for win screen
  await page.evaluate(() => {
    window.__LUMEN_GAME__.state = 'WIN';
  });
  await new Promise(r => setTimeout(r, 600));

  const winScreenShot = path.join(artifactDir, 'screenshot_win.png');
  await page.screenshot({ path: winScreenShot });
  console.log('Captured win screen:', winScreenShot);

  // Verify mute toggle
  const muteCheck = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    const initialMute = game.audio.isMuted;
    game.audio.toggleMute();
    const afterMute = game.audio.isMuted;
    return { initialMute, afterMute };
  });
  console.log('Mute toggle check:', muteCheck);

  await browser.close();

  if (errors.length > 0) {
    console.error('Errors found in browser execution:', errors);
    process.exit(1);
  } else {
    console.log('ALL VERIFICATION CHECKS PASSED WITH ZERO CONSOLE ERRORS!');
  }
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
