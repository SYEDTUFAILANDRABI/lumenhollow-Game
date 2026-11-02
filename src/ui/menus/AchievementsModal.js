// AchievementsModal.js - 15+ Achievements Tracking System with Toast Alerts
import { I18n } from '../../core/i18n/I18n.js';

const ACHIEVEMENTS_KEY = 'lumen_hollow_achievements_v1';

export const ACHIEVEMENTS_LIST = [
  { id: 'first_light', title: 'First Light', desc: 'Awaken the Sacred Celestial Lantern in Lumen Glade.', icon: '☼' },
  { id: 'first_shard', title: 'Shard of the Glade', desc: 'Recover your very first shattered Moon Shard.', icon: '✦' },
  { id: 'sky_ruins', title: 'Ascendant', desc: 'Scale the shimmering vertical cliffs of the Shimmering Chasm.', icon: '▲' },
  { id: 'crystal_resonator', title: 'Cavern Resonance', desc: 'Survive the deep acoustic crystalline caves.', icon: '💎' },
  { id: 'warden_down', title: 'Eclipse Vanquished', desc: 'Defeat the Eclipse Warden in the ancient shrine.', icon: '⚔️' },
  { id: 'flame_walker', title: 'Into the Fire', desc: 'Descend through the molten embers of Ember Descent.', icon: '🔥' },
  { id: 'lord_slain', title: 'Demon Lord Downfall', desc: 'Defeat Demon Lord Maldrek in single combat.', icon: '👑' },
  { id: 'bones_rest', title: 'Restless Bones', desc: 'Survive the skeleton uprisings beneath the Catacombs.', icon: '💀' },
  { id: 'sovereign_defeated', title: 'Void Purged', desc: 'Confront and conquer Nythrax, Sovereign of the Abyss.', icon: '⚡' },
  { id: 'celestial_reunion', title: 'Celestial Harmony', desc: 'Reunite all five Moon Shards upon the mountaintop altar.', icon: '🌙' },
  { id: 'combo_master', title: 'Combo Maestro', desc: 'Achieve a 25+ consecutive combat strike combo.', icon: '✨' },
  { id: 'sovereign_aura', title: 'Aura of Command', desc: 'Unleash a fully charged Sovereign Aura radial blast.', icon: '💥' },
  { id: 'shadow_army', title: 'Lord of Shadows', desc: 'Extract and command an allied army of underworld soldiers.', icon: '👥' },
  { id: 'astral_awoken', title: 'Monarch of the Cosmos', desc: 'Summon the true Astral Monarch form in battle.', icon: '🌌' },
  { id: 'flawless_parry', title: 'Reflective Aegis', desc: 'Perform a split-second counter with your Lantern Pulse.', icon: '🛡️' },
  { id: 'firefly_whisperer', title: 'Gentle Glide', desc: 'Sustain a Firefly Glide for more than 4 continuous seconds.', icon: '🦋' }
];

class AchievementsManager {
  constructor() {
    this.unlocked = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.unlocked));
    } catch (e) {}
  }

  unlock(id, menuManager = null) {
    if (this.unlocked[id]) return;
    const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
    if (!ach) return;

    this.unlocked[id] = {
      unlockedAt: new Date().toLocaleDateString()
    };
    this.save();

    if (menuManager) {
      menuManager.showToast(`Achievement Unlocked: ${ach.title}`, ach.icon);
    }
  }

  isUnlocked(id) {
    return !!this.unlocked[id];
  }
}

export const Achievements = new AchievementsManager();

export class AchievementsModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    const unlockedCount = ACHIEVEMENTS_LIST.filter(a => Achievements.isUnlocked(a.id)).length;

    const listHTML = ACHIEVEMENTS_LIST.map(a => {
      const done = Achievements.isUnlocked(a.id);
      return `
        <div class="setting-item" style="opacity: ${done ? '1' : '0.45'}; border-color: ${done ? 'rgba(255, 217, 138, 0.4)' : 'rgba(255, 255, 255, 0.05)'};">
          <div style="font-size: 24px; min-width: 36px; text-align: center;">${a.icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 14px; color: ${done ? '#ffd98a' : '#888'};">
              ${a.title} ${done ? '✓' : ''}
            </div>
            <div class="setting-desc">${a.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 540px;">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>🏆</span>
            <span>${I18n.t('menu_achievements')} (${unlockedCount}/${ACHIEVEMENTS_LIST.length})</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 55vh; overflow-y: auto; padding-right: 4px;">
          ${listHTML}
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
  }
}
