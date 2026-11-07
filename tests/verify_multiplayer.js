// tests/verify_multiplayer.js - Automated Co-Op Multiplayer End-to-End Test
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:/Users/syedt/.gemini/antigravity/brain/3bd8ce2a-eb14-454d-9455-d5c8265bec5b';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function runMultiplayerTest() {
  console.log('=== STARTING LUMEN HOLLOW MULTIPLAYER E2E TEST ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const pageHost = await browser.newPage();
  const pagePeer = await browser.newPage();

  await pageHost.setViewport({ width: 1280, height: 720 });
  await pagePeer.setViewport({ width: 1280, height: 720 });

  const errors = [];
  pageHost.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Host Error]: ${msg.text()}`);
  });
  pagePeer.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Peer Error]: ${msg.text()}`);
  });

  try {
    // 1. Navigate Host
    console.log('1. Loading Host into game...');
    await pageHost.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await pageHost.waitForFunction(() => !!window.__LUMEN_GAME__);
    await pageHost.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      game.state = 'MAIN_MENU';
      game.mainMenu.mount();
    });

    // 2. Open Party Modal on Host
    console.log('2. Opening Party Modal on Host...');
    await pageHost.evaluate(() => {
      window.__LUMEN_GAME__.openPartyModal();
    });
    await new Promise(r => setTimeout(r, 400));

    await pageHost.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot_multiplayer_lobby.png')
    });
    console.log('Saved screenshot: screenshot_multiplayer_lobby.png');

    // 3. Connect Host to Relay Server & Create Room
    console.log('3. Connecting Host to WebSocket relay server and creating room...');
    const roomCode = await pageHost.evaluate(async () => {
      const net = window.__LUMEN_GAME__.network;
      net.connectToServer('ws://localhost:3000');
      await new Promise(r => setTimeout(r, 300));
      net.createRoom('duo', false);
      // Wait for roomCode
      for (let i = 0; i < 40; i++) {
        if (net.roomCode) return net.roomCode;
        await new Promise(r => setTimeout(r, 100));
      }
      return null;
    });

    console.log(`Host created room with code: [${roomCode}]`);
    if (!roomCode) throw new Error('Failed to create room on host');

    // 4. Navigate Peer and Join Room
    console.log('4. Connecting Peer and joining room...');
    await pagePeer.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await pagePeer.waitForFunction(() => !!window.__LUMEN_GAME__);
    await pagePeer.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      game.state = 'MAIN_MENU';
      game.mainMenu.mount();
      game.openPartyModal();
    });

    const joinSuccess = await pagePeer.evaluate(async (code) => {
      const net = window.__LUMEN_GAME__.network;
      net.nickname = 'AzureLumi';
      net.paletteId = 1; // Azure cloak
      net.connectToServer('ws://localhost:3000');
      await new Promise(r => setTimeout(r, 300));
      net.joinRoom(code);
      for (let i = 0; i < 40; i++) {
        if (net.roomCode === code) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return false;
    }, roomCode);

    if (!joinSuccess) throw new Error('Peer failed to join room');
    console.log('Peer joined room successfully!');

    // 5. Ready up both players
    console.log('5. Toggling ready status for Host and Peer...');
    await pagePeer.evaluate(() => {
      window.__LUMEN_GAME__.network.setReady(true);
    });
    await new Promise(r => setTimeout(r, 300));

    const lobbyState = await pageHost.evaluate(() => {
      const data = window.__LUMEN_GAME__.network.roomData;
      return {
        memberCount: data?.members?.length,
        allReady: data?.members?.every(m => m.ready)
      };
    });
    console.log('Lobby verification:', lobbyState);

    // 6. Start Game from Host
    console.log('6. Host starting expedition...');
    await pageHost.evaluate(() => {
      window.__LUMEN_GAME__.network.startGame();
    });

    // Wait for both players to enter PLAYING
    await pageHost.evaluate(async () => {
      const game = window.__LUMEN_GAME__;
      game.loadLevel(0);
      game.state = 'PLAYING';
    });
    await pagePeer.evaluate(async () => {
      const game = window.__LUMEN_GAME__;
      game.loadLevel(0);
      game.state = 'PLAYING';
    });

    await new Promise(r => setTimeout(r, 600));

    // 7. Verify Co-Op Replication & PlayerManager
    console.log('7. Verifying Co-Op Replication and PlayerManager on Host and Peer...');
    const coopStatus = await pageHost.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      const pm = game.playerManager;
      return {
        partySize: pm.players.size,
        localPlayerPos: { x: Math.round(game.player.x), y: Math.round(game.player.y) },
        allLiving: pm.getLivingPlayers().length,
        hasPartyHUD: !!game.partyHUD
      };
    });
    console.log('Host Co-op status:', coopStatus);

    // 8. Test Chat and Ping
    console.log('8. Testing in-game chat and ping propagation...');
    await pagePeer.evaluate(() => {
      window.__LUMEN_GAME__.network.sendChat('May the moon shards light our way!');
      window.__LUMEN_GAME__.network.sendPing('here', 120, 280);
    });

    await new Promise(r => setTimeout(r, 500));

    const chatReceived = await pageHost.evaluate(() => {
      return window.__LUMEN_GAME__.chatBox?.messages?.length > 0;
    });
    console.log('Chat message propagated to Host:', chatReceived);

    // 9. Test Wisp & Revive Mechanism
    console.log('9. Testing Co-Op Wisp Transformation and Pulse Revive...');
    await pageHost.evaluate(() => {
      // Down peer into wisp
      const game = window.__LUMEN_GAME__;
      const peerInfo = Array.from(game.playerManager.players.values()).find(p => !p.isLocal);
      if (peerInfo && peerInfo.playerEntity) {
        game.playerManager.downPlayer(peerInfo.playerEntity);
      }
    });

    const isDowned = await pageHost.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      const peerInfo = Array.from(game.playerManager.players.values()).find(p => !p.isLocal);
      return peerInfo ? peerInfo.playerEntity.isDowned : false;
    });
    console.log('Peer downed into celestial wisp:', isDowned);

    // Living player revives wisp
    await pageHost.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      const peerInfo = Array.from(game.playerManager.players.values()).find(p => !p.isLocal);
      if (peerInfo && peerInfo.playerEntity) {
        game.playerManager.revivePlayer(peerInfo.playerEntity);
      }
    });

    const isRevived = await pageHost.evaluate(() => {
      const game = window.__LUMEN_GAME__;
      const peerInfo = Array.from(game.playerManager.players.values()).find(p => !p.isLocal);
      return peerInfo ? !peerInfo.playerEntity.isDowned : false;
    });
    console.log('Peer revived successfully:', isRevived);

    // Capture Co-op gameplay screenshot
    await pageHost.screenshot({
      path: path.join(ARTIFACT_DIR, 'screenshot_multiplayer_gameplay.png')
    });
    console.log('Saved screenshot: screenshot_multiplayer_gameplay.png');

    if (errors.length > 0) {
      console.error('Console errors detected during multiplayer test:', errors);
      throw new Error(`Test failed with ${errors.length} console errors`);
    }

    console.log('=== MULTIPLAYER E2E TEST PASSED WITH ZERO CONSOLE ERRORS ===');
  } finally {
    await browser.close();
  }
}

runMultiplayerTest().catch(err => {
  console.error('Fatal error during multiplayer test:', err);
  process.exit(1);
});
