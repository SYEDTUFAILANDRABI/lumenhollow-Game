import puppeteer from 'puppeteer-core';
import path from 'path';

async function run() {
  console.log('--- STARTING SPRITE & FINAL BOSS VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('BROWSER PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Page loaded successfully.');

  // Start game
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 800));

  // 1. Verify Level 5 (Catacombs with Skeletons)
  console.log('Switching to Level 5 (Catacombs of Uprising)...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(4); // index 4 = Level 5
  });
  await new Promise(r => setTimeout(r, 1200));

  const level5State = await page.evaluate(() => {
    const tm = window.__LUMEN_GAME__.tileMap;
    const skeletonsCount = tm.skeletons.length;
    const archersCount = tm.archers.length;
    const knightsCount = tm.boneKnights.length;
    const firstSk = tm.skeletons[0];
    return {
      levelName: tm.levelName,
      skeletonsCount,
      archersCount,
      knightsCount,
      firstSkLoaded: firstSk && firstSk.sprite ? firstSk.sprite.isLoaded() : false,
      firstSkAnim: firstSk && firstSk.sprite ? firstSk.sprite.currentAnim : null
    };
  });
  console.log('Level 5 State:', level5State);

  // Take screenshot of Level 5
  const catacombsShotPath = 'C:/Users/syedt/.gemini/antigravity/brain/3bd8ce2a-eb14-454d-9455-d5c8265bec5b/catacombs_skeleton_sprites.png';
  await page.screenshot({ path: catacombsShotPath });
  console.log('Saved screenshot:', catacombsShotPath);

  // 2. Verify Level 6 (Moon Shrine with Final Boss Sorcerer)
  console.log('Switching to Level 6 (Moon Shrine Final Boss)...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.loadLevel(5); // index 5 = Level 6
  });
  await new Promise(r => setTimeout(r, 1500));

  // Let boss intro run and move player closer
  await page.evaluate(() => {
    const b = window.__LUMEN_GAME__.tileMap.boss;
    if (b) {
      b.introDone = true;
      window.__LUMEN_GAME__.player.x = b.x - 70;
      window.__LUMEN_GAME__.player.y = b.y;
    }
  });

  // Step a few frames
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => {
      window.__LUMEN_GAME__.update(1 / 60);
    });
  }

  const level6State = await page.evaluate(() => {
    const tm = window.__LUMEN_GAME__.tileMap;
    const boss = tm.boss;
    return {
      levelName: tm.levelName,
      hasBoss: !!boss,
      bossName: boss ? boss.name : null,
      bossSpriteLoaded: boss && boss.sprite ? boss.sprite.isLoaded() : false,
      bossAttackLoaded: boss && boss.sprite ? boss.sprite.isAttackLoaded() : false,
      bossAnim: boss && boss.sprite ? boss.sprite.currentAnim : null
    };
  });
  console.log('Level 6 State:', level6State);

  // Trigger boss attack animation test
  await page.evaluate(() => {
    const boss = window.__LUMEN_GAME__.tileMap.boss;
    if (boss) {
      boss.isCasting = true;
      boss.attackTimer = 1.0;
    }
  });

  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => {
      window.__LUMEN_GAME__.update(1 / 60);
    });
  }

  const bossAttackState = await page.evaluate(() => {
    const boss = window.__LUMEN_GAME__.tileMap.boss;
    return {
      currentAnim: boss.sprite.currentAnim,
      frameIndex: boss.sprite.frameIndex
    };
  });
  console.log('Boss Attack Animation State:', bossAttackState);

  // Take screenshot of Final Boss fight
  const bossShotPath = 'C:/Users/syedt/.gemini/antigravity/brain/3bd8ce2a-eb14-454d-9455-d5c8265bec5b/final_boss_sorcerer_sprite.png';
  await page.screenshot({ path: bossShotPath });
  console.log('Saved screenshot:', bossShotPath);

  await browser.close();

  if (errors.length > 0) {
    console.error('Encountered errors during test:', errors);
    process.exit(1);
  } else {
    console.log('--- ALL TESTS PASSED WITH ZERO CONSOLE ERRORS ---');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
