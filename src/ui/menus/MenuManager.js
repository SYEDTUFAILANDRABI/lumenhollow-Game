// MenuManager.js - HTML/CSS Overlay Menu System with Gamepad & Keyboard Navigation
import { I18n } from '../../core/i18n/I18n.js';
import { Settings } from '../../core/settingsManager/SettingsManager.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class MenuManager {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.activeMenu = null; // 'main', 'saves', 'levelSelect', 'settings', 'collection', 'achievements', 'pause', 'welcome', 'credits'
    this.modalStack = [];
    this.focusedIndex = 0;
    this.focusables = [];
    this.toasts = [];

    this.initDOM();
    this.setupListeners();
  }

  initDOM() {
    let root = document.getElementById('menu-overlay-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'menu-overlay-root';
      const gameContainer = document.getElementById('game-container') || document.body;
      gameContainer.appendChild(root);
    }
    this.container = root;

    // Inject CSS styles
    let style = document.getElementById('menu-overlay-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'menu-overlay-styles';
      style.textContent = `
        #menu-overlay-root {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #f4f1ff;
        }

        .menu-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(9, 8, 20, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          opacity: 0;
          transition: opacity 0.22s ease-out;
        }

        .menu-modal-backdrop.active {
          opacity: 1;
        }

        .menu-window {
          background: #120e24;
          border: 1.5px solid rgba(255, 217, 138, 0.4);
          border-radius: 8px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.9), 0 0 32px rgba(42, 157, 143, 0.25);
          width: 90%;
          max-width: 580px;
          max-height: 88vh;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          transform: translateY(12px) scale(0.97);
          transition: transform 0.22s ease-out;
        }

        .menu-modal-backdrop.active .menu-window {
          transform: translateY(0) scale(1);
        }

        .menu-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 217, 138, 0.25);
          padding-bottom: 12px;
        }

        .menu-title-text {
          font-size: 20px;
          font-weight: bold;
          color: #ffd98a;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .menu-close-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f4f1ff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s;
        }
        .menu-close-btn:hover, .menu-close-btn:focus-visible {
          background: rgba(255, 217, 138, 0.2);
          border-color: #ffd98a;
        }

        /* Primary Menu Buttons */
        .menu-btn {
          min-height: 44px;
          padding: 10px 18px;
          background: #1b1535;
          border: 1.5px solid rgba(255, 217, 138, 0.25);
          border-radius: 6px;
          color: #f4f1ff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease-out;
          outline: none;
        }

        .menu-btn:hover, .menu-btn.focused, .menu-btn:focus-visible {
          background: #2b1f52;
          border-color: #ffd98a;
          color: #ffd98a;
          box-shadow: 0 0 16px rgba(255, 217, 138, 0.35);
          transform: translateX(4px);
        }

        .menu-btn.btn-danger {
          border-color: rgba(193, 18, 31, 0.4);
        }
        .menu-btn.btn-danger:hover, .menu-btn.btn-danger.focused {
          border-color: #c1121f;
          color: #ff6b35;
          box-shadow: 0 0 16px rgba(193, 18, 31, 0.4);
        }

        /* Main Menu Stack Overlay */
        #main-menu-overlay {
          position: absolute;
          left: 36px;
          top: 50%;
          transform: translateY(-50%);
          width: 270px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          pointer-events: auto;
          z-index: 102;
        }

        .main-menu-brand {
          margin-bottom: 8px;
        }

        .main-menu-title {
          font-size: 26px;
          font-weight: 800;
          color: #f4f1ff;
          letter-spacing: 2px;
          text-shadow: 0 0 16px #ffd98a;
        }

        .main-menu-sub {
          font-size: 11px;
          color: #2a9d8f;
          margin-top: 2px;
          font-style: italic;
        }

        /* Settings Tabs */
        .settings-tabs-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          border-bottom: 1px solid rgba(255, 217, 138, 0.2);
          padding-bottom: 8px;
        }

        .settings-tab-btn {
          min-height: 38px;
          padding: 6px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          color: rgba(244, 241, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .settings-tab-btn:hover, .settings-tab-btn.active {
          color: #ffd98a;
          background: rgba(255, 217, 138, 0.12);
          border-color: rgba(255, 217, 138, 0.4);
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 52vh;
          overflow-y: auto;
          padding-right: 6px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(27, 21, 53, 0.5);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .setting-label {
          font-size: 13px;
          font-weight: 500;
          color: #f4f1ff;
        }

        .setting-desc {
          font-size: 10px;
          color: rgba(244, 241, 255, 0.55);
          margin-top: 2px;
        }

        .setting-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Sliders */
        input[type="range"] {
          accent-color: #ffd98a;
          cursor: pointer;
        }

        /* Selects */
        select {
          background: #1b1535;
          border: 1px solid rgba(255, 217, 138, 0.4);
          color: #f4f1ff;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }

        /* Checkbox Switch */
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: #2a204d;
          border-radius: 24px;
          cursor: pointer;
          transition: 0.2s;
          border: 1px solid rgba(255, 217, 138, 0.3);
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background: #ffd98a;
          border-radius: 50%;
          transition: 0.2s;
        }
        input:checked + .toggle-slider {
          background: #2a9d8f;
          border-color: #ffd98a;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
          background: #ffffff;
        }

        /* Toast Notifications */
        #menu-toast-container {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
          z-index: 200;
        }

        .menu-toast {
          background: #1b1535;
          border: 1.5px solid #ffd98a;
          color: #ffd98a;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          gap: 10px;
          animation: toastIn 0.25s ease-out;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  setupListeners() {
    // Keyboard navigation in menus
    window.addEventListener('keydown', (e) => {
      if (!this.activeMenu && !this.isModalOpen()) return;

      if (e.key === 'ArrowDown' || e.key === 'KeyS') {
        this.navigateFocus(1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'KeyW') {
        this.navigateFocus(-1);
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === 'Space') {
        this.activateFocused();
        e.preventDefault();
      } else if (e.key === 'Escape') {
        this.handleBack();
        e.preventDefault();
      }
    });
  }

  showToast(message, icon = '✦') {
    let toastBox = document.getElementById('menu-toast-container');
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.id = 'menu-toast-container';
      this.container.appendChild(toastBox);
    }

    const toast = document.createElement('div');
    toast.className = 'menu-toast';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 320);
    }, 2800);
  }

  playHoverSound() {
    if (this.game && this.game.audio) this.game.audio.playUIHover();
  }

  playClickSound() {
    if (this.game && this.game.audio) this.game.audio.playUIClick();
  }

  updateFocusables() {
    if (!this.container) return;
    this.focusables = Array.from(this.container.querySelectorAll('.menu-btn, .settings-tab-btn, select, input, .menu-close-btn'))
      .filter(el => el.offsetParent !== null && !el.disabled);

    this.focusables.forEach((el, idx) => {
      el.classList.toggle('focused', idx === this.focusedIndex);
    });
  }

  navigateFocus(dir) {
    this.updateFocusables();
    if (this.focusables.length === 0) return;

    this.focusedIndex = (this.focusedIndex + dir + this.focusables.length) % this.focusables.length;
    this.focusables.forEach((el, idx) => {
      el.classList.toggle('focused', idx === this.focusedIndex);
      if (idx === this.focusedIndex) {
        el.focus();
        this.playHoverSound();
      }
    });
  }

  activateFocused() {
    this.updateFocusables();
    if (this.focusables[this.focusedIndex]) {
      this.playClickSound();
      this.focusables[this.focusedIndex].click();
    }
  }

  handleBack() {
    if (this.modalStack.length > 0) {
      this.popModal();
    } else if (this.activeMenu === 'pause') {
      this.game.resumeGame();
    }
  }

  isModalOpen() {
    return this.modalStack.length > 0;
  }

  pushModal(modalElement) {
    this.modalStack.push(modalElement);
    this.container.appendChild(modalElement);
    requestAnimationFrame(() => modalElement.classList.add('active'));
    this.focusedIndex = 0;
    this.updateFocusables();
  }

  popModal() {
    const modal = this.modalStack.pop();
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 240);
    }
    this.focusedIndex = 0;
    this.updateFocusables();
  }

  clearModals() {
    while (this.modalStack.length > 0) {
      this.popModal();
    }
  }

  hideAll() {
    this.clearModals();
    this.container.innerHTML = '';
    this.activeMenu = null;
  }

  update(dt) {
    // Poll gamepad for menu navigation
    const gp = this.game && this.game.input ? this.game.input.actions : null;
    if (this.activeMenu || this.isModalOpen()) {
      if (gp && gp.navDownJustPressed) this.navigateFocus(1);
      if (gp && gp.navUpJustPressed) this.navigateFocus(-1);
      if (gp && gp.confirmJustPressed) this.activateFocused();
      if (gp && gp.cancelJustPressed) this.handleBack();
    }
  }
}
