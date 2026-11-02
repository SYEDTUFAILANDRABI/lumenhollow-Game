import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\syedt\\.gemini\\antigravity\\brain\\3bd8ce2a-eb14-454d-9455-d5c8265bec5b';

async function run() {
  console.log('--- Starting Verification: Lumi Sprite Sheet & Skeleton Uprisings ---');
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

  // 1. Title Screen & Sprite check
  await new Promise(r => setTimeout(r, 600));
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 800));

  // Wait for game to enter PLAYING
  await page.waitForFunction(() => {
    const game = window.__LUMEN_GAME__;
    return game && game.state === 'PLAYING' && game.player;
  }, { timeout: 4000 });

  // Verify Sprite Loaded
  const spriteLoaded = await page.waitForFunction(() => {
    const p = window.__LUMEN_GAME__.player;
    return p.sprite && p.sprite.loaded;
  }, { timeout: 4000 });
  console.log('✓ Player sprite sheet loaded successfully!');

  // Test player attack / slash animation
  await page.keyboard.press('KeyJ');
  await new Promise(r => setTimeout(r, 120));
  const slashAnim = await page.evaluate(() => window.__LUMEN_GAME__.player.sprite.currentAnim);
  console.log(`✓ Player attack trigger: sprite anim is "${slashAnim}"`);

  // Capture screenshot of Lumi with sprite sheet in Level 1
  await page.screenshot({ path: path.join(artifactDir, 'lumi_sprite_ingame.png') });
  console.log('✓ Captured lumi_sprite_ingame.png');

  // Load Level 5 (Catacombs of Uprising)
  console.log('Loading Level 5: Catacombs of Uprising...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(4); // index 4 is Level 5
  });
  await new Promise(r => setTimeout(r, 800));

  const levelInfo = await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    return {
      levelName: g.levels[g.currentLevelIndex].name,
      bossPresent: !!g.tileMap.boss,
      skeletonCount: g.tileMap.skeletons.length + g.tileMap.archers.length + g.tileMap.boneKnights.length,
      uprisingCount: g.tileMap.skeletons.filter(s => s.isUprising).length +
                     g.tileMap.archers.filter(s => s.isUprising).length +
                     g.tileMap.boneKnights.filter(s => s.isUprising).length
    };
  });
  console.log('Level 5 info:', JSON.stringify(levelInfo));

  if (levelInfo.bossPresent) {
    throw new Error('Level 5 still has a boss! It must NOT have any final boss.');
  } else {
    console.log('✓ Confirmed: Level 5 has NO final boss.');
  }

  // Trigger dynamic skeleton uprising directly
  console.log('Testing dynamic skeleton uprising from beneath...');
  await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    g.tileMap.triggerDynamicSkeletonUprising(g.player, g.particles, g.audio, g.camera);
  });
  await new Promise(r => setTimeout(r, 200));

  // Capture screenshot of skeletons uprising from beneath
  await page.screenshot({ path: path.join(artifactDir, 'skeletons_uprising_beneath.png') });
  console.log('✓ Captured skeletons_uprising_beneath.png');

  // Let simulation run for 2 seconds to verify physics and render loops
  await new Promise(r => setTimeout(r, 2000));

  if (errors.length > 0) {
    console.error('Errors encountered during test:');
    errors.forEach(e => console.error(e));
    throw new Error('Test failed due to console/page errors');
  }

  console.log('✓ All verification tests passed with 0 errors!');
  await browser.close();
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
