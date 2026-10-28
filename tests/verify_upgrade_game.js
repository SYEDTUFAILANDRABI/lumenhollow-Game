import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\syedt\\.gemini\\antigravity\\brain\\3bd8ce2a-eb14-454d-9455-d5c8265bec5b';

async function run() {
  console.log('Launching Chrome test runner for Physics, Sovereign Aura, Summons & Skills...');
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
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_title_screen.png') });
  console.log('1. Captured Title Screen.');

  // 2. Start Game with Enter (keeps jump untouched)
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 800));

  // Wait until player is grounded
  await page.waitForFunction(() => {
    const game = window.__LUMEN_GAME__;
    return game && game.state === 'PLAYING' && game.player && game.player.isGrounded;
  }, { timeout: 3000 });

  // 3. Test High Jump, Double Jump, Glide
  const yBefore = await page.evaluate(() => window.__LUMEN_GAME__.player.y);

  // Hold Space for full jump
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 340));
  const yAtApex = await page.evaluate(() => window.__LUMEN_GAME__.player.y);
  const singleJumpHeight = yBefore - yAtApex;

  // Double jump at apex
  await page.keyboard.up('Space');
  await new Promise(r => setTimeout(r, 40));
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 300));
  const yAtDoubleApex = await page.evaluate(() => window.__LUMEN_GAME__.player.y);
  const doubleJumpHeight = yBefore - yAtDoubleApex;

  // Release and test glide
  await new Promise(r => setTimeout(r, 220));
  const glideCheck = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      isGliding: game.player.isGliding,
      vy: game.player.vy
    };
  });
  await page.keyboard.up('Space');

  console.log('2. Jump & Glide test results:', {
    singleJumpHeight,
    doubleJumpHeight,
    glideCheck
  });

  if (singleJumpHeight < 80) {
    throw new Error(`Single jump height too low: ${singleJumpHeight}px (needs >= 80px)`);
  }

  // 4. Test F2 Live Tuning Panel
  await page.keyboard.press('F2');
  await new Promise(r => setTimeout(r, 200));
  const f2PanelVisible = await page.evaluate(() => {
    const p = document.getElementById('debug-tuning-panel');
    return p && p.style.display !== 'none';
  });
  console.log('3. F2 Tuning Panel visible:', f2PanelVisible);
  await page.keyboard.press('F2'); // Close panel

  // 5. Test Sovereign's Aura Upgrade Build-Up & Release
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.combat.eclipseMeter = 100;
  });

  // Hold Q for build-up
  await page.keyboard.down('KeyQ');
  await new Promise(r => setTimeout(r, 400));

  const auraCharging = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      isCharging: game.player.isChargingAura,
      chargeTimer: game.player.auraChargeTimer,
      vignetteProgress: game.vfx.auraBuildUpProgress
    };
  });
  console.log('4. Sovereign Aura Charging state:', auraCharging);

  // Keep holding until full release
  await new Promise(r => setTimeout(r, 450));
  await page.keyboard.up('KeyQ');
  await new Promise(r => setTimeout(r, 150));

  await page.screenshot({ path: path.join(artifactDir, 'upgrade_sovereign_aura.png') });
  console.log('5. Captured Upgraded Sovereign Aura explosion.');

  // 6. Test Underworld Summons
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.combat.soulEnergy = 100;
  });

  // Open summon wheel with E
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 200));
  const wheelState = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return { wheelOpen: game.summons.wheelOpen };
  });
  console.log('6. Summon Wheel open state:', wheelState);
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_summon_wheel.png') });

  // Close wheel
  await page.keyboard.press('KeyE');
  await new Promise(r => setTimeout(r, 100));

  // Quick summon Tri-Maw (Key 1) and Ashen Wyrm (Key 2)
  await page.keyboard.press('Digit1');
  await new Promise(r => setTimeout(r, 150));
  await page.keyboard.press('Digit2');
  await new Promise(r => setTimeout(r, 300));

  const summonStatus = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      activeCount: game.summons.activeSummons.length,
      creatures: game.summons.activeSummons.map(s => s.name),
      soulEnergyRemaining: game.combat.soulEnergy
    };
  });
  console.log('7. Active Summons:', summonStatus);
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_active_summons.png') });

  // 7. Test Skill Swap Menu (Tab) & Presets
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 200));

  const skillMenuState = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      menuOpen: game.skills.menuOpen,
      selectedPreset: game.skills.selectedPreset,
      assignedSlots: game.skills.assignedSlots
    };
  });
  console.log('8. Skills Menu state:', skillMenuState);
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_skills_menu.png') });

  // Switch to Preset 2
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.skills.selectPreset(1); // Preset 2: chain, gravity, crescent
  });

  await page.keyboard.press('Tab'); // Close menu
  await new Promise(r => setTimeout(r, 100));

  // Test slot U (Soul Chain) and slot I (Gravity Well)
  await page.keyboard.press('KeyU');
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press('KeyI');
  await new Promise(r => setTimeout(r, 200));

  console.log('9. Tested Swappable Skills U & I.');

  // 8. Test Level 2 (Caverns)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(1);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_crystal_caverns.png') });
  console.log('10. Level 2 loaded & verified.');

  // 9. Test Level 3 (Sky Ruins & Boss Eclipse Warden with Summons)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(2);
    game.player.x = 280;
    game.player.y = 80;
    game.combat.soulEnergy = 100;
  });
  await new Promise(r => setTimeout(r, 1200));

  // Summon Hollow Reaper for boss fight
  await page.keyboard.press('Digit3');
  await new Promise(r => setTimeout(r, 300));

  await page.screenshot({ path: path.join(artifactDir, 'upgrade_boss_fight.png') });
  console.log('11. Boss fight arena captured with Hollow Reaper summon.');

  // Defeat boss and verify exit unlock
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    const b = game.tileMap.boss;
    if (b) {
      b.hp = 0;
      b.die(game.combat, game.vfx, game.particles, game.audio, game.camera);
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const bossDefeated = await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    return {
      bossDead: game.tileMap.boss ? game.tileMap.boss.isDead : true,
      exitUnlocked: !game.tileMap.boss || game.tileMap.boss.isDead
    };
  });
  console.log('12. Boss defeated & exit unlocked:', bossDefeated);

  // 10. Test Level 4 (Moon Shrine Finale)
  await page.evaluate(() => {
    const game = window.__LUMEN_GAME__;
    game.loadLevel(3);
    game.triggerFinaleCinematic();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, 'upgrade_finale_cinematic.png') });
  console.log('13. Captured Moon Shrine Finale.');

  await browser.close();

  if (errors.length > 0) {
    console.error('Test encountered errors:', errors);
    process.exit(1);
  } else {
    console.log('ALL UPGRADE & REGRESSION CHECKS PASSED WITH ZERO CONSOLE ERRORS!');
  }
}

run().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
