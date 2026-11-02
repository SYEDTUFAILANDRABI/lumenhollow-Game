// ControlsRebindModal.js - Full Keyboard Action Rebinding with Conflict Detection
import { I18n } from '../../core/i18n/I18n.js';
import { Settings, DEFAULT_SETTINGS } from '../../core/settingsManager/SettingsManager.js';

export class ControlsRebindModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
    this.listeningForAction = null;
    this.listeningSlot = 0; // 0 for primary, 1 for secondary
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    const actions = [
      { id: 'moveLeft', label: I18n.t('action_move_left') },
      { id: 'moveRight', label: I18n.t('action_move_right') },
      { id: 'lookUp', label: I18n.t('action_look_up') },
      { id: 'crouch', label: I18n.t('action_crouch') },
      { id: 'jump', label: I18n.t('action_jump') },
      { id: 'pulse', label: I18n.t('action_pulse') },
      { id: 'slash', label: I18n.t('action_slash') },
      { id: 'bolt', label: I18n.t('action_bolt') },
      { id: 'dash', label: I18n.t('action_dash') },
      { id: 'plunge', label: I18n.t('action_plunge') },
      { id: 'aura', label: I18n.t('action_aura') },
      { id: 'summon', label: I18n.t('action_summon') },
      { id: 'skill1', label: I18n.t('action_skill_1') },
      { id: 'skill2', label: I18n.t('action_skill_2') },
      { id: 'skill3', label: I18n.t('action_skill_3') },
      { id: 'astral', label: I18n.t('action_astral') },
      { id: 'extract', label: I18n.t('action_extract') },
      { id: 'rise', label: I18n.t('action_rise') },
      { id: 'exchange', label: I18n.t('action_exchange') },
      { id: 'reach', label: I18n.t('action_reach') },
      { id: 'ledger', label: I18n.t('action_ledger') },
      { id: 'pause', label: I18n.t('action_pause') }
    ];

    const bindings = Settings.get('keyBindings') || {};

    const rowsHTML = actions.map(act => {
      const keys = bindings[act.id] || ['None', 'None'];
      const p = keys[0] || 'None';
      const s = keys[1] || 'None';

      return `
        <div class="setting-item" style="padding: 6px 12px;">
          <div class="setting-label" style="font-size: 13px;">${act.label}</div>
          <div style="display: flex; gap: 6px;">
            <button class="menu-btn rebind-key-btn" data-action="${act.id}" data-slot="0" style="min-height: 32px; padding: 4px 10px; font-size: 12px; min-width: 70px; justify-content: center;">
              ${p.replace('Key', '').replace('Arrow', '')}
            </button>
            <button class="menu-btn rebind-key-btn" data-action="${act.id}" data-slot="1" style="min-height: 32px; padding: 4px 10px; font-size: 12px; min-width: 70px; justify-content: center; opacity: 0.85;">
              ${s.replace('Key', '').replace('Arrow', '')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 600px;">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>⌨️</span>
            <span>${I18n.t('controls_rebind_title')}</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div style="font-size: 11px; color: #ffd98a; margin-bottom: 4px;">
          ${I18n.t('controls_rebind_hint')}
        </div>

        <div id="rebind-list" style="display: flex; flex-direction: column; gap: 6px; max-height: 52vh; overflow-y: auto; padding-right: 4px;">
          ${rowsHTML}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <button id="btn-reset-keybinds" class="menu-btn" style="min-height: 36px; padding: 6px 14px; font-size: 12px;">
            ${I18n.t('reset_controls')}
          </button>
          <button class="menu-btn btn-modal-close" style="min-height: 36px; padding: 6px 18px;">
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
      this.stopListening();
      this.menuManager.playClickSound();
      this.menuManager.popModal();
    };

    this.element.querySelector('.menu-close-btn').addEventListener('click', close);
    this.element.querySelector('.btn-modal-close').addEventListener('click', close);

    const rebindBtns = this.element.querySelectorAll('.rebind-key-btn');
    rebindBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.menuManager.playClickSound();
        const action = btn.dataset.action;
        const slot = parseInt(btn.dataset.slot, 10);
        this.startListening(btn, action, slot);
      });
    });

    const resetBtn = this.element.querySelector('#btn-reset-keybinds');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm("Reset all controls to default keyboard layout?")) {
          const fresh = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.keyBindings));
          Settings.set('keyBindings', fresh);
          this.menuManager.showToast("Controls reset to defaults.");
          this.menuManager.popModal();
          this.menuManager.pushModal(new ControlsRebindModal(this.menuManager, this.game).create());
        }
      });
    }

    this.keyHandler = (e) => {
      if (!this.listeningForAction) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.code === 'Escape') {
        this.stopListening();
        return;
      }

      const bindings = { ...Settings.get('keyBindings') };
      const currentKeys = bindings[this.listeningForAction] ? [...bindings[this.listeningForAction]] : ['None', 'None'];

      // Conflict detection: check if code is already used in another action
      let conflictAction = null;
      for (const [act, keys] of Object.entries(bindings)) {
        if (act !== this.listeningForAction && keys.includes(e.code)) {
          conflictAction = act;
          break;
        }
      }

      if (conflictAction) {
        this.menuManager.showToast(`Swapped key from ${conflictAction}`);
        // Remove from conflicting action
        bindings[conflictAction] = bindings[conflictAction].map(k => k === e.code ? 'None' : k);
      }

      currentKeys[this.listeningSlot] = e.code;
      bindings[this.listeningForAction] = currentKeys;
      Settings.set('keyBindings', bindings);

      this.stopListening();
      this.menuManager.showToast(`Bound to ${e.code.replace('Key', '')}`);

      // Refresh view
      this.menuManager.popModal();
      this.menuManager.pushModal(new ControlsRebindModal(this.menuManager, this.game).create());
    };

    window.addEventListener('keydown', this.keyHandler, true);
  }

  startListening(btn, action, slot) {
    this.stopListening();
    this.listeningForAction = action;
    this.listeningSlot = slot;
    btn.textContent = 'Press Key...';
    btn.style.borderColor = '#ffd98a';
    btn.style.boxShadow = '0 0 14px #ffd98a';
  }

  stopListening() {
    this.listeningForAction = null;
  }
}
