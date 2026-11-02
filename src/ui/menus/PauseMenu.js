// PauseMenu.js - In-Game Pause Menu with Backdrop Blur & Save Confirmation
import { I18n } from '../../core/i18n/I18n.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class PauseMenu {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 380px;">
        <div class="menu-title-row" style="justify-content: center;">
          <div class="menu-title-text" style="font-size: 22px;">
            <span>🌙</span>
            <span>${I18n.t('pause_title')}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-pause-resume" class="menu-btn">
            <span>${I18n.t('pause_resume')}</span>
            <span style="font-size: 12px; color: #ffd98a;">▶</span>
          </button>

          <button id="btn-pause-checkpoint" class="menu-btn">
            <span>${I18n.t('pause_restart_checkpoint')}</span>
            <span style="font-size: 12px;">↺</span>
          </button>

          <button id="btn-pause-skills" class="menu-btn">
            <span>${I18n.t('menu_skills')}</span>
            <span style="font-size: 12px;">⚔️</span>
          </button>

          <button id="btn-pause-ledger" class="menu-btn">
            <span>${I18n.t('menu_ledger')}</span>
            <span style="font-size: 12px;">📜</span>
          </button>

          <button id="btn-pause-settings" class="menu-btn">
            <span>${I18n.t('pause_settings')}</span>
            <span style="font-size: 12px;">⚙️</span>
          </button>

          <button id="btn-pause-controls" class="menu-btn">
            <span>${I18n.t('pause_controls')}</span>
            <span style="font-size: 12px;">⌨️</span>
          </button>

          <button id="btn-pause-quit" class="menu-btn btn-danger">
            <span>${I18n.t('pause_return_menu')}</span>
            <span style="font-size: 12px;">✕</span>
          </button>
        </div>
      </div>
    `;

    this.element = backdrop;
    this.bindEvents();
    return backdrop;
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

    bind('btn-pause-resume', () => {
      this.game.resumeGame();
    });

    bind('btn-pause-checkpoint', () => {
      this.game.restartFromCheckpoint();
      this.game.resumeGame();
    });

    bind('btn-pause-skills', () => {
      if (this.game.skills) {
        this.game.skills.toggleMenu(this.game.player);
      }
    });

    bind('btn-pause-ledger', () => {
      if (this.game.moonLedger) {
        this.game.moonLedger.toggle();
      }
    });

    bind('btn-pause-settings', () => {
      this.game.openSettingsModal();
    });

    bind('btn-pause-controls', () => {
      this.game.openControlsRebindModal();
    });

    bind('btn-pause-quit', () => {
      if (confirm(I18n.t('pause_confirm_quit'))) {
        // Auto-save before quitting
        Saves.saveGame(this.game);
        this.game.returnToMainMenu();
      }
    });
  }
}
