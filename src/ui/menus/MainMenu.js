// MainMenu.js - Title Screen Main Menu Component
import { I18n } from '../../core/i18n/I18n.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class MainMenu {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  mount() {
    this.menuManager.clearModals();
    let el = document.getElementById('main-menu-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'main-menu-overlay';
      this.menuManager.container.appendChild(el);
    }
    this.element = el;
    this.render();
    this.menuManager.activeMenu = 'main';
    this.menuManager.focusedIndex = 0;
    this.menuManager.updateFocusables();
  }

  render() {
    const hasSave = Saves.hasAnySave();

    this.element.innerHTML = `
      <div class="main-menu-brand">
        <div class="main-menu-title">${I18n.t('game_title')}</div>
        <div class="main-menu-sub">${I18n.t('game_subtitle')}</div>
      </div>

      <button id="btn-menu-continue" class="menu-btn" ${hasSave ? '' : 'disabled style="opacity: 0.5;"'}>
        <span>${I18n.t('menu_continue')}</span>
        <span style="font-size: 12px; color: #ffd98a;">▶</span>
      </button>

      <button id="btn-menu-new" class="menu-btn">
        <span>${I18n.t('menu_new_game')}</span>
        <span style="font-size: 12px; color: #2a9d8f;">✦</span>
      </button>

      <button id="btn-menu-multiplayer" class="menu-btn" style="border-color: rgba(126, 184, 218, 0.6); box-shadow: 0 0 10px rgba(126, 184, 218, 0.2);">
        <span>PLAY TOGETHER (CO-OP)</span>
        <span style="font-size: 12px; color: #7eb8da;">👥</span>
      </button>

      <button id="btn-menu-load" class="menu-btn">
        <span>${I18n.t('menu_load_game')}</span>
        <span style="font-size: 12px;">📁</span>
      </button>

      <button id="btn-menu-level-select" class="menu-btn">
        <span>${I18n.t('menu_level_select')}</span>
        <span style="font-size: 12px;">🗺️</span>
      </button>

      <button id="btn-menu-skills" class="menu-btn">
        <span>${I18n.t('menu_skills')}</span>
        <span style="font-size: 12px;">⚔️</span>
      </button>

      <button id="btn-menu-ledger" class="menu-btn">
        <span>${I18n.t('menu_ledger')}</span>
        <span style="font-size: 12px;">📜</span>
      </button>

      <button id="btn-menu-collection" class="menu-btn">
        <span>${I18n.t('menu_collection')}</span>
        <span style="font-size: 12px;">📖</span>
      </button>

      <button id="btn-menu-achievements" class="menu-btn">
        <span>${I18n.t('menu_achievements')}</span>
        <span style="font-size: 12px;">🏆</span>
      </button>

      <button id="btn-menu-settings" class="menu-btn">
        <span>${I18n.t('menu_settings')}</span>
        <span style="font-size: 12px;">⚙️</span>
      </button>

      <button id="btn-menu-credits" class="menu-btn">
        <span>${I18n.t('menu_credits')}</span>
        <span style="font-size: 12px;">🌙</span>
      </button>

      <button id="btn-menu-replay" class="menu-btn">
        <span>${I18n.t('menu_replay_intro')}</span>
        <span style="font-size: 12px;">🎬</span>
      </button>

      <button id="btn-menu-quit" class="menu-btn btn-danger">
        <span>${I18n.t('menu_quit')}</span>
        <span style="font-size: 12px;">✕</span>
      </button>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const bind = (id, handler) => {
      const b = this.element.querySelector(`#${id}`);
      if (b) {
        b.addEventListener('mouseenter', () => this.menuManager.playHoverSound());
        b.addEventListener('click', () => {
          this.menuManager.playClickSound();
          handler();
        });
      }
    };

    bind('btn-menu-continue', () => {
      const activeSlot = Saves.getActiveSlot();
      this.game.startSlotGame(activeSlot);
    });

    bind('btn-menu-new', () => {
      this.game.openSaveSlotsModal('new');
    });

    bind('btn-menu-multiplayer', () => {
      if (this.game.openPartyModal) {
        this.game.openPartyModal();
      }
    });

    bind('btn-menu-load', () => {
      this.game.openSaveSlotsModal('load');
    });

    bind('btn-menu-level-select', () => {
      this.game.openLevelSelectModal();
    });

    bind('btn-menu-skills', () => {
      if (this.game.skills) {
        this.game.skills.toggleMenu(this.game.player);
      }
    });

    bind('btn-menu-ledger', () => {
      if (this.game.moonLedger) {
        this.game.moonLedger.toggle();
      }
    });

    bind('btn-menu-collection', () => {
      this.game.openCollectionModal();
    });

    bind('btn-menu-achievements', () => {
      this.game.openAchievementsModal();
    });

    bind('btn-menu-settings', () => {
      this.game.openSettingsModal();
    });

    bind('btn-menu-credits', () => {
      this.game.startCredits();
    });

    bind('btn-menu-replay', () => {
      this.game.startIntroCinematic();
    });

    bind('btn-menu-quit', () => {
      this.game.returnToTitleScreen();
    });
  }

  unmount() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    if (this.menuManager.activeMenu === 'main') {
      this.menuManager.activeMenu = null;
    }
  }
}
