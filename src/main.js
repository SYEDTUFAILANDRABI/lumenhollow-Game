import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found!');
    return;
  }

  const game = new Game(canvas);
  game.start();

  // Expose game for debugging and browser test automation
  window.__LUMEN_GAME__ = game;
});
