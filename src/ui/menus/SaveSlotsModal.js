// SaveSlotsModal.js - 3-Slot Interactive Save System Modal
import { I18n } from '../../core/i18n/I18n.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class SaveSlotsModal {
  constructor(menuManager, game, mode = 'load') {
    this.menuManager = menuManager;
    this.game = game;
    this.mode = mode; // 'load' or 'new'
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    const formatPlaytime = (sec = 0) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    };

    const levelNames = [
      "Lumen Glade",
      "Shimmering Chasm",
      "Crystal Caverns",
      "Ember Descent",
      "Catacombs of Uprising",
      "Moon Shrine"
    ];

    const slotsHTML = Saves.slots.map(s => {
      const lvlName = levelNames[s.currentLevel] || `Level ${s.currentLevel + 1}`;
      const thumbHTML = s.thumbnailData
        ? `<img src="${s.thumbnailData}" alt="Thumbnail" style="width: 80px; height: 45px; border-radius: 4px; border: 1px solid rgba(255, 217, 138, 0.4); object-fit: cover;" />`
        : `<div style="width: 80px; height: 45px; border-radius: 4px; background: rgba(255,255,255,0.06); border: 1px dashed rgba(255,217,138,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; color: #ffd98a;">NO DATA</div>`;

      return `
        <div class="setting-item" style="gap: 12px; align-items: stretch;">
          ${thumbHTML}
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: 700; font-size: 14px; color: #ffd98a;">
              Slot ${s.id} ${s.isEmpty ? `(${I18n.t('slot_empty')})` : `• ${lvlName}`}
            </div>
            ${!s.isEmpty ? `
              <div class="setting-desc">Shards: ${s.shardsCollected || 0}/5 • Playtime: ${formatPlaytime(s.playtime)}</div>
              <div class="setting-desc">Last played: ${s.lastPlayedDate || 'Recently'}</div>
            ` : `
              <div class="setting-desc">Ready for a new adventure</div>
            `}
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="menu-btn slot-action-play" data-slot="${s.id}" style="min-height: 36px; padding: 6px 14px;">
              ${s.isEmpty ? I18n.t('slot_new') : I18n.t('slot_load')}
            </button>
            ${!s.isEmpty ? `
              <button class="menu-btn slot-action-copy" data-slot="${s.id}" style="min-height: 36px; padding: 6px 10px;" title="Copy to another slot">📋</button>
              <button class="menu-btn btn-danger slot-action-delete" data-slot="${s.id}" style="min-height: 36px; padding: 6px 10px;" title="Delete slot">🗑️</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="menu-window">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>📁</span>
            <span>${I18n.t('saves_title')}</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${slotsHTML}
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

    // Play / Load Action
    this.element.querySelectorAll('.slot-action-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotId = parseInt(btn.dataset.slot, 10);
        this.menuManager.playClickSound();
        Saves.setActiveSlot(slotId);
        const slot = Saves.getSlot(slotId);
        this.menuManager.clearModals();
        this.game.startSlotGame(slot);
      });
    });

    // Copy Action
    this.element.querySelectorAll('.slot-action-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotId = parseInt(btn.dataset.slot, 10);
        const targetSlot = slotId === 1 ? 2 : (slotId === 2 ? 3 : 1);
        if (confirm(`Copy Save Slot ${slotId} into Save Slot ${targetSlot}?`)) {
          Saves.copySlot(slotId, targetSlot);
          this.menuManager.showToast(`Copied Slot ${slotId} to Slot ${targetSlot}`);
          this.menuManager.popModal();
          this.menuManager.pushModal(new SaveSlotsModal(this.menuManager, this.game, this.mode).create());
        }
      });
    });

    // Delete Action
    this.element.querySelectorAll('.slot-action-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotId = parseInt(btn.dataset.slot, 10);
        if (confirm(I18n.t('slot_confirm_delete', { slot: slotId }))) {
          Saves.deleteSlot(slotId);
          this.menuManager.showToast(`Deleted Save Slot ${slotId}`);
          this.menuManager.popModal();
          this.menuManager.pushModal(new SaveSlotsModal(this.menuManager, this.game, this.mode).create());
        }
      });
    });
  }
}
