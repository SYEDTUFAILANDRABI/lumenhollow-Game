import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../core/Constants.js';

export class LightingSystem {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    // Pre-create grain canvas for subtle film grain effect without per-frame heavy loops
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 160;
    this.grainCanvas.height = 90;
    const gctx = this.grainCanvas.getContext('2d');
    const imgData = gctx.createImageData(160, 90);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.random() * 255;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 12; // Very faint grain
    }
    gctx.putImageData(imgData, 0, 0);

    this.grainPattern = null;
  }

  render(mainCtx, player, firefly, tileMap, camera, ambientDarkness = 0.90) {
    const rx = camera.getRenderX();
    const ry = camera.getRenderY();
    const lctx = this.ctx;

    // 1. Fill light canvas with atmospheric darkness
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = `rgba(9, 7, 20, ${ambientDarkness})`;
    lctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Cut out light shapes with 'destination-out'
    lctx.globalCompositeOperation = 'destination-out';

    // Collect all light sources
    const lights = [];

    // Player lantern light
    const lPos = player.getLanternWorldPos();
    lights.push({
      x: lPos.x - rx,
      y: lPos.y - ry,
      radius: player.currentLightRadius,
      intensity: 1.0
    });

    // Firefly companion light
    if (firefly) {
      lights.push({
        x: firefly.x - rx,
        y: firefly.y - ry,
        radius: firefly.lightRadius,
        intensity: 0.85
      });
    }

    // Shrines
    for (const s of tileMap.shrines) {
      if (s.isLit) {
        lights.push({
          x: s.x + s.width / 2 - rx,
          y: s.y + 12 - ry,
          radius: s.lightRadius,
          intensity: 1.0
        });
      }
    }

    // Shards
    for (const sh of tileMap.shards) {
      if (!sh.collected) {
        lights.push({
          x: sh.x + 8 - rx,
          y: sh.y + 8 - ry,
          radius: sh.lightRadius,
          intensity: 0.9
        });
      }
    }

    // Wild Fireflies
    for (const ff of tileMap.fireflies) {
      if (!ff.collected) {
        lights.push({
          x: ff.x - rx,
          y: ff.y - ry,
          radius: ff.lightRadius,
          intensity: 0.8
        });
      }
    }

    // Exit portal
    if (tileMap.exitDoor) {
      lights.push({
        x: tileMap.exitDoor.x + 13 - rx,
        y: tileMap.exitDoor.y + 20 - ry,
        radius: 75,
        intensity: 0.95
      });
    }

    // Draw cut-outs
    for (const light of lights) {
      if (light.x + light.radius < 0 || light.x - light.radius > GAME_WIDTH ||
          light.y + light.radius < 0 || light.y - light.radius > GAME_HEIGHT) {
        continue;
      }

      const grad = lctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      grad.addColorStop(0, `rgba(0, 0, 0, ${light.intensity})`);
      grad.addColorStop(0.35, `rgba(0, 0, 0, ${light.intensity * 0.85})`);
      grad.addColorStop(0.7, `rgba(0, 0, 0, ${light.intensity * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      lctx.fill();
    }

    // 3. Composite dark overlay onto main canvas
    mainCtx.save();
    mainCtx.drawImage(this.canvas, 0, 0);

    // 4. Additive Warm Glow & Bloom Pass
    mainCtx.globalCompositeOperation = 'lighter';

    // Lantern warm golden bloom
    const plScreenX = lPos.x - rx;
    const plScreenY = lPos.y - ry;
    const bloomGrad = mainCtx.createRadialGradient(
      plScreenX, plScreenY, 0,
      plScreenX, plScreenY, player.currentLightRadius * 0.65
    );
    bloomGrad.addColorStop(0, 'rgba(255, 217, 138, 0.28)');
    bloomGrad.addColorStop(0.5, 'rgba(255, 143, 171, 0.12)');
    bloomGrad.addColorStop(1, 'rgba(42, 157, 143, 0)');
    mainCtx.fillStyle = bloomGrad;
    mainCtx.beginPath();
    mainCtx.arc(plScreenX, plScreenY, player.currentLightRadius * 0.65, 0, Math.PI * 2);
    mainCtx.fill();

    // Pulse halo ring when pulsing
    if (player.isPulsing) {
      mainCtx.strokeStyle = 'rgba(244, 241, 255, 0.35)';
      mainCtx.lineWidth = 2;
      mainCtx.beginPath();
      mainCtx.arc(plScreenX, plScreenY, player.currentLightRadius - 6, 0, Math.PI * 2);
      mainCtx.stroke();
    }

    // 5. Subtle Vignette
    mainCtx.globalCompositeOperation = 'source-over';
    const vigGrad = mainCtx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.35,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(5, 4, 12, 0.45)');
    mainCtx.fillStyle = vigGrad;
    mainCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 6. Subtle film grain overlay
    mainCtx.globalAlpha = 0.04;
    mainCtx.drawImage(this.grainCanvas, 0, 0, GAME_WIDTH, GAME_HEIGHT);

    mainCtx.restore();
  }
}
