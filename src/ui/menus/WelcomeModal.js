// WelcomeModal.js - First-Launch Welcome Flow (Language, Audio Check, Controls Preview)
import { I18n } from '../../core/i18n/I18n.js';
import { Settings } from '../../core/settingsManager/SettingsManager.js';

export class WelcomeModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 480px; text-align: center;">
        <div style="font-size: 32px; color: #ffd98a;">🌙</div>
        <div style="font-size: 22px; font-weight: bold; color: #f4f1ff;">Welcome to Lumen Hollow</div>
        <div style="font-size: 12px; color: #2a9d8f; font-style: italic;">Before you step into the dusk, let's configure your experience.</div>

        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left; margin: 12px 0;">
          <div class="setting-item">
            <div>
              <div class="setting-label">Language</div>
              <div class="setting-desc">Primary display text</div>
            </div>
            <select id="welcome-lang">
              <option value="en" selected>English</option>
            </select>
          </div>

          <div class="setting-item">
            <div>
              <div class="setting-label">Sound & Music Check</div>
              <div class="setting-desc">Test audio and adjust volume</div>
            </div>
            <button id="welcome-test-audio" class="menu-btn" style="min-height: 32px; padding: 4px 12px; font-size: 12px;">Test Chime 🔔</button>
          </div>

          <div class="setting-item" style="flex-direction: column; align-items: flex-start; gap: 6px;">
            <div class="setting-label">Core Controls Overview</div>
            <div style="font-size: 11px; color: rgba(244,241,255,0.7); line-height: 1.5;">
              • <strong>Move & Jump</strong>: [A / D] and [Space]<br/>
              • <strong>Lantern Pulse</strong>: [Shift] or [K]<br/>
              • <strong>Lantern Slash & Dash</strong>: [J] and [C]<br/>
              • <strong>Sovereign's Aura</strong>: Hold [Q]<br/>
              • <strong>Settings & Controls</strong> can be changed anytime in the menu!
            </div>
          </div>
        </div>

        <button id="btn-welcome-begin" class="menu-btn" style="justify-content: center; background: #2b1f52; border-color: #ffd98a; color: #ffd98a; font-size: 16px; padding: 12px;">
          Begin Adventure ✦
        </button>
      </div>
    `;

    this.element = backdrop;
    this.bindEvents();
    return backdrop;
  }

  bindEvents() {
    const testBtn = this.element.querySelector('#welcome-test-audio');
    if (testBtn && this.game && this.game.audio) {
      testBtn.addEventListener('click', () => {
        this.game.audio.playAudioTest();
      });
    }

    const beginBtn = this.element.querySelector('#btn-welcome-begin');
    if (beginBtn) {
      beginBtn.addEventListener('click', () => {
        this.menuManager.playClickSound();
        Settings.set('hasCompletedWelcome', true);
        this.menuManager.popModal();
        this.game.startIntroCinematic();
      });
    }
  }
}
