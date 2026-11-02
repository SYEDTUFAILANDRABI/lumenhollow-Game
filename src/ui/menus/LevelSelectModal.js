// LevelSelectModal.js - Unlocked Level Selector with Times, Shards, and Ranks
import { I18n } from '../../core/i18n/I18n.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class LevelSelectModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    const levelsInfo = [
      { index: 0, name: "Lumen Glade", sub: "The shattered twilight forest • Shard 1" },
      { index: 1, name: "Shimmering Chasm", sub: "Brambles and vertical cliff ascents • Shard 2" },
      { index: 2, name: "Crystal Caverns", sub: "Subterranean resonance & Eclipse Warden • Shard 3" },
      { index: 3, name: "Ember Descent", sub: "Molten falls & Demon Lord Maldrek • Shard 4" },
      { index: 4, name: "Catacombs of Uprising", sub: "Skeletons awakening beneath • Shard 5" },
      { index: 5, name: "Moon Shrine", sub: "Sacred altar & Final Sorcerer confrontation" }
    ];

    const activeSlot = Saves.getActiveSlot();
    const maxReached = activeSlot ? (activeSlot.levelReached || 0) : 0;
    const stageTimes = (activeSlot && activeSlot.stats && activeSlot.stats.stageTimes) || [0, 0, 0, 0, 0, 0];
    const stageRanks = (activeSlot && activeSlot.stats && activeSlot.stats.stageRanks) || ['-', '-', '-', '-', '-', '-'];

    const formatSec = (s = 0) => {
      if (!s) return '--:--';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const cardsHTML = levelsInfo.map(lvl => {
      const isUnlocked = lvl.index <= maxReached;
      const rank = stageRanks[lvl.index] || '-';
      const timeStr = formatSec(stageTimes[lvl.index]);

      return `
        <div class="setting-item" style="opacity: ${isUnlocked ? '1' : '0.45'};">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 14px; color: ${isUnlocked ? '#ffd98a' : '#777'};">
              ${lvl.index + 1}. ${lvl.name} ${isUnlocked ? '' : '🔒'}
            </div>
            <div class="setting-desc">${lvl.sub}</div>
            ${isUnlocked ? `
              <div class="setting-desc" style="color: #2a9d8f;">Best Time: ${timeStr} • Rank: <strong>${rank}</strong></div>
            ` : ''}
          </div>

          <div>
            <button class="menu-btn btn-play-level" data-level="${lvl.index}" ${isUnlocked ? '' : 'disabled'} style="min-height: 36px; padding: 6px 16px;">
              ${isUnlocked ? 'Play' : 'Locked'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="menu-window">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>🗺️</span>
            <span>${I18n.t('menu_level_select')}</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 55vh; overflow-y: auto;">
          ${cardsHTML}
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <button class="menu-btn btn-modal-close" style="min-height: 38px; padding: 8px 18px;">
            ${I18n.t('btn_close')}
          </button>
        </div>
      </div>
    `;

    this.element = backdrop;
    this.bindEvents();
    return backdrop;
  }

  bindEvents() {
    const close = () => {
      this.menuManager.playClickSound();
      this.menuManager.popModal();
    };

    this.element.querySelector('.menu-close-btn').addEventListener('click', close);
    this.element.querySelector('.btn-modal-close').addEventListener('click', close);

    this.element.querySelectorAll('.btn-play-level').forEach(b => {
      b.addEventListener('click', () => {
        const lvl = parseInt(b.dataset.level, 10);
        this.menuManager.playClickSound();
        this.menuManager.clearModals();
        this.game.loadLevel(lvl);
        this.game.state = 'PLAYING';
      });
    });
  }
}
