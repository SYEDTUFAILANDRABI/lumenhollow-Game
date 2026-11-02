import puppeteer from 'puppeteer-core';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\syedt\\.gemini\\antigravity\\brain\\3bd8ce2a-eb14-454d-9455-d5c8265bec5b';

async function run() {
  console.log('--- STARTING MENUS & SETTINGS SYSTEM VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
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
    errors.push(err.stack || err.message);
    console.error('BROWSER PAGE ERROR:', err.stack || err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Verify BOOT & SPLASH
  const bootState = await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    return { state: g.state };
  });
  console.log('1. Initial State:', bootState);

  // Wait for boot and splash to transition to PRESS_KEY
  await new Promise(r => setTimeout(r, 3800));

  const pressKeyState = await page.evaluate(() => {
    return { state: window.__LUMEN_GAME__.state };
  });
  console.log('2. After Splash State:', pressKeyState);

  // Screenshot Press Any Key
  const pressKeyShot = path.join(artifactDir, 'menu_press_key.png');
  await page.screenshot({ path: pressKeyShot });
  console.log('Saved screenshot:', pressKeyShot);

  // 2. Press Space to unlock Audio and proceed to Main Menu
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 600));

  // If Welcome modal opened, close it or proceed to menu
  await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    if (g.state === 'INTRO_CINEMATIC') {
      g.introCinematic.finish();
      g.returnToMainMenu();
    } else if (g.menuManager && g.menuManager.isModalOpen()) {
      g.menuManager.clearModals();
      g.returnToMainMenu();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const mainMenuState = await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    const menuEl = document.getElementById('main-menu-overlay');
    return {
      state: g.state,
      hasMenuOverlay: !!menuEl,
      hasButtons: menuEl ? menuEl.querySelectorAll('button').length : 0
    };
  });
  console.log('3. Main Menu State:', mainMenuState);

  // Screenshot Main Menu & Title Scene
  const titleShot = path.join(artifactDir, 'menu_title_screen.png');
  await page.screenshot({ path: titleShot });
  console.log('Saved screenshot:', titleShot);

  // 4. Test Settings Modal & Tabs
  console.log('4. Opening Settings Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openSettingsModal();
  });
  await new Promise(r => setTimeout(r, 400));

  const settingsShot = path.join(artifactDir, 'menu_settings_modal.png');
  await page.screenshot({ path: settingsShot });
  console.log('Saved screenshot:', settingsShot);

  // Switch to Video tab
  await page.evaluate(() => {
    const btn = document.querySelector('.settings-tab-btn[data-tab="video"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Switch to Audio tab
  await page.evaluate(() => {
    const btn = document.querySelector('.settings-tab-btn[data-tab="audio"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Close Settings Modal
  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 5. Test Controls Rebind Modal
  console.log('5. Opening Controls Rebind Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openControlsRebindModal();
  });
  await new Promise(r => setTimeout(r, 400));

  const rebindShot = path.join(artifactDir, 'menu_controls_rebind.png');
  await page.screenshot({ path: rebindShot });
  console.log('Saved screenshot:', rebindShot);

  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 6. Test Save Slots Modal
  console.log('6. Opening Save Slots Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openSaveSlotsModal('load');
  });
  await new Promise(r => setTimeout(r, 400));

  const savesShot = path.join(artifactDir, 'menu_save_slots.png');
  await page.screenshot({ path: savesShot });
  console.log('Saved screenshot:', savesShot);

  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 7. Test Level Select Modal
  console.log('7. Opening Level Select Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openLevelSelectModal();
  });
  await new Promise(r => setTimeout(r, 400));

  const levelSelectShot = path.join(artifactDir, 'menu_level_select.png');
  await page.screenshot({ path: levelSelectShot });
  console.log('Saved screenshot:', levelSelectShot);

  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 8. Test Collection / Bestiary Modal
  console.log('8. Opening Collection / Bestiary Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openCollectionModal();
  });
  await new Promise(r => setTimeout(r, 400));

  const collectionShot = path.join(artifactDir, 'menu_collection_bestiary.png');
  await page.screenshot({ path: collectionShot });
  console.log('Saved screenshot:', collectionShot);

  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 9. Test Achievements Modal
  console.log('9. Opening Achievements Modal...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.openAchievementsModal();
  });
  await new Promise(r => setTimeout(r, 400));

  const achievementsShot = path.join(artifactDir, 'menu_achievements.png');
  await page.screenshot({ path: achievementsShot });
  console.log('Saved screenshot:', achievementsShot);

  await page.evaluate(() => {
    window.__LUMEN_GAME__.menuManager.popModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 10. Test Canvas Intro Cinematic
  console.log('10. Running Intro Cinematic...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.startIntroCinematic();
  });
  await new Promise(r => setTimeout(r, 2200));

  const cinematicShot = path.join(artifactDir, 'menu_intro_cinematic.png');
  await page.screenshot({ path: cinematicShot });
  console.log('Saved screenshot:', cinematicShot);

  // 11. Start Game and Test In-Game Pause Menu
  console.log('11. Starting Game and testing Pause Menu...');
  await page.evaluate(() => {
    const g = window.__LUMEN_GAME__;
    g.loadLevel(0);
    g.state = 'PLAYING';
    g.menuManager.clearModals();
    g.mainMenu.unmount();
  });
  await new Promise(r => setTimeout(r, 800));

  // Trigger Pause
  await page.evaluate(() => {
    window.__LUMEN_GAME__.pauseGame();
  });
  await new Promise(r => setTimeout(r, 400));

  const pauseShot = path.join(artifactDir, 'menu_pause_modal.png');
  await page.screenshot({ path: pauseShot });
  console.log('Saved screenshot:', pauseShot);

  // Resume game
  await page.evaluate(() => {
    window.__LUMEN_GAME__.resumeGame();
  });
  await new Promise(r => setTimeout(r, 400));

  // 12. Test Level Results Screen
  console.log('12. Testing Level Results Screen...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.startLevelResults();
  });
  await new Promise(r => setTimeout(r, 2200));

  const resultsShot = path.join(artifactDir, 'menu_level_results.png');
  await page.screenshot({ path: resultsShot });
  console.log('Saved screenshot:', resultsShot);

  // 13. Test Credits Scene
  console.log('13. Testing Credits Scene...');
  await page.evaluate(() => {
    window.__LUMEN_GAME__.startCredits();
  });
  await new Promise(r => setTimeout(r, 1200));

  const creditsShot = path.join(artifactDir, 'menu_credits.png');
  await page.screenshot({ path: creditsShot });
  console.log('Saved screenshot:', creditsShot);

  await browser.close();

  if (errors.length > 0) {
    console.error('FAILED WITH CONSOLE ERRORS:', errors);
    process.exit(1);
  } else {
    console.log('=== ALL INTRO, MENU, SETTINGS & SCENE TESTS PASSED WITH ZERO CONSOLE ERRORS ===');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
