// CollectionModal.js - Bestiary and Shards Collection Lore
import { I18n } from '../../core/i18n/I18n.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class CollectionModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    const activeSlot = Saves.getActiveSlot();
    const shards = activeSlot ? activeSlot.foundShards : [false, false, false, false, false];

    const bestiary = [
      { name: "Shadow Wisp", tier: "MINION", desc: "Drifting abyssal remnant that disperses into soul motes when bathed in lantern light.", icon: "🟣" },
      { name: "Hollow Knight", tier: "SOLDIER", desc: "Armored vanguard corrupted by dusk void, striking with relentless polearms.", icon: "🛡️" },
      { name: "Crow Wraith", tier: "MINION", desc: "Winged harbinger that dives from upper cavern stalactites.", icon: "🦅" },
      { name: "Skeleton Warrior", tier: "SOLDIER", desc: "Restless ossuary swordsman equipped with bone buckler and slash counter.", icon: "💀" },
      { name: "Skeleton Archer", tier: "ELITE", desc: "Marksman that looses piercing bone arrows from distance.", icon: "🏹" },
      { name: "Bone Knight", tier: "CHAMPION", desc: "Heavy juggernaut of reinforced bone who can reassemble upon first defeat.", icon: "⚔️" },
      { name: "Fire Imp", tier: "MINION", desc: "Agile molten fiend that lobs fire spheres across fiery chasms.", icon: "🔥" },
      { name: "Horned Brute", tier: "ELITE", desc: "Massive demonic juggernaut whose shockwave slams sunder the earth.", icon: "👹" },
      { name: "Hell Caster", tier: "CHAMPION", desc: "Infernal warlock conjuring ground volcanic fissures.", icon: "✨" },
      { name: "Eclipse Warden", tier: "BOSS", desc: "Ancient sky ruin vanguard wielding void warhammer and shock slams.", icon: "👑" },
      { name: "Demon Lord Maldrek", tier: "BOSS", desc: "Lord of the molten descent commanding brimstone swords and flame surges.", icon: "🔥" },
      { name: "Nythrax, Sovereign of the Abyss", tier: "FINAL BOSS", desc: "The supreme Void Sorcerer whose dark astral shield can only be pierced by Astral Monarch.", icon: "🌌" }
    ];

    const shardsHTML = [
      { id: 1, name: "Shard of Awakening", level: "Lumen Glade", color: "#ffd98a" },
      { id: 2, name: "Shard of Heights", level: "Shimmering Chasm", color: "#7be0ad" },
      { id: 3, name: "Shard of Resonance", level: "Crystal Caverns", color: "#ff8fab" },
      { id: 4, name: "Shard of Ember", level: "Ember Descent", color: "#ff6b35" },
      { id: 5, name: "Shard of Eternity", level: "Catacombs of Uprising", color: "#bb44ff" }
    ].map((sh, idx) => {
      const found = shards[idx];
      return `
        <div style="flex: 1; min-width: 90px; background: rgba(27,21,53,0.6); padding: 8px; border-radius: 6px; border: 1px solid ${found ? sh.color : 'rgba(255,255,255,0.06)'}; text-align: center;">
          <div style="font-size: 22px; color: ${found ? sh.color : '#444'};">${found ? '✦' : '✧'}</div>
          <div style="font-weight: 700; font-size: 11px; color: ${found ? '#f4f1ff' : '#666'}; margin-top: 4px;">${sh.name}</div>
          <div style="font-size: 9px; color: ${found ? '#2a9d8f' : '#555'};">${sh.level}</div>
        </div>
      `;
    }).join('');

    const bestiaryHTML = bestiary.map(b => {
      return `
        <div class="setting-item" style="padding: 8px 12px; gap: 10px;">
          <div style="font-size: 24px;">${b.icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 13px; color: #ffd98a;">${b.name}</span>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 3px; background: rgba(42,157,143,0.25); color: #7be0ad;">${b.tier}</span>
            </div>
            <div class="setting-desc">${b.desc}</div>
          </div>
        </div>
      `;
    }).join('');

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 580px;">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>📖</span>
            <span>${I18n.t('menu_collection')}</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div>
          <div style="font-size: 13px; font-weight: 700; color: #ffd98a; margin-bottom: 6px;">Celestial Moon Shards</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${shardsHTML}
          </div>
        </div>

        <div>
          <div style="font-size: 13px; font-weight: 700; color: #ffd98a; margin: 12px 0 6px 0;">Creature Bestiary</div>
          <div style="display: flex; flex-direction: column; gap: 6px; max-height: 38vh; overflow-y: auto; padding-right: 4px;">
            ${bestiaryHTML}
          </div>
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
