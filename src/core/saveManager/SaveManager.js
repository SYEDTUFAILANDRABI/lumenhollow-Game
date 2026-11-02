// SaveManager.js - Versioned Multi-Slot Save System with Thumbnails & Migration
// Supports 3 save slots, auto-saving at checkpoints, playtime tracking, and JSON export/import.

const STORAGE_KEY_SLOTS = 'lumen_hollow_slots_v2';
const ACTIVE_SLOT_KEY = 'lumen_hollow_active_slot';
const LEGACY_KEY = 'lumen_hollow_save_v1';

export class SaveManager {
  constructor() {
    this.slots = this.loadSlots();
    this.activeSlotId = this.loadActiveSlotId();
    this.sessionStartTime = Date.now();
  }

  createDefaultSlot(id) {
    return {
      id,
      isEmpty: true,
      currentLevel: 0,
      levelReached: 0,
      shardsCollected: 0,
      foundShards: [false, false, false, false, false],
      completed: false,
      playtime: 0,
      lastPlayedDate: null,
      thumbnailData: null,
      stats: {
        enemiesDefeated: 0,
        deaths: 0,
        bestCombo: 0,
        stageTimes: [0, 0, 0, 0, 0, 0],
        stageRanks: ['-', '-', '-', '-', '-', '-']
      },
      skills: ['bolt', 'plunge', 'crescent'],
      unlockedSkills: ['bolt', 'plunge', 'crescent']
    };
  }

  loadSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.slots && Array.isArray(parsed.slots)) {
          return parsed.slots;
        }
      }
    } catch (e) {
      console.warn('Failed to parse slots data:', e);
    }

    // Migrate from legacy single-slot save if available
    return this.migrateFromLegacy();
  }

  migrateFromLegacy() {
    const slots = [
      this.createDefaultSlot(1),
      this.createDefaultSlot(2),
      this.createDefaultSlot(3)
    ];

    try {
      const legacyRaw = localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const leg = JSON.parse(legacyRaw);
        const s1 = slots[0];
        s1.isEmpty = false;
        s1.currentLevel = typeof leg.currentLevel === 'number' ? leg.currentLevel : 0;
        s1.levelReached = Math.max(0, s1.currentLevel);
        s1.foundShards = Array.isArray(leg.foundShards) ? leg.foundShards : [false, false, false, false, false];
        s1.shardsCollected = s1.foundShards.filter(Boolean).length;
        s1.completed = !!leg.completed;
        s1.playtime = 180; // Estimated migrated playtime
        s1.lastPlayedDate = new Date().toLocaleDateString();
        console.log('Successfully migrated legacy save into Slot 1');
      }
    } catch (e) {
      console.warn('Legacy save migration check failed:', e);
    }

    this.saveSlotsDirect(slots);
    return slots;
  }

  saveSlotsDirect(slots) {
    try {
      localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify({ version: 2, slots }));
    } catch (e) {
      console.warn('Failed to persist save slots:', e);
    }
  }

  loadActiveSlotId() {
    try {
      const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (raw) {
        const val = parseInt(raw, 10);
        if (val >= 1 && val <= 3) return val;
      }
    } catch (e) {}
    return 1;
  }

  setActiveSlot(id) {
    if (id >= 1 && id <= 3) {
      this.activeSlotId = id;
      try {
        localStorage.setItem(ACTIVE_SLOT_KEY, id.toString());
      } catch (e) {}
    }
  }

  getActiveSlot() {
    return this.getSlot(this.activeSlotId);
  }

  getSlot(id) {
    const s = this.slots.find(x => x.id === id);
    return s || this.slots[0];
  }

  hasAnySave() {
    return this.slots.some(s => !s.isEmpty);
  }

  saveGame(game, isCheckpoint = false) {
    const slot = this.getActiveSlot();
    const now = Date.now();
    const deltaSeconds = Math.round((now - this.sessionStartTime) / 1000);
    this.sessionStartTime = now;

    slot.isEmpty = false;
    slot.playtime = (slot.playtime || 0) + deltaSeconds;
    slot.lastPlayedDate = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (game) {
      slot.currentLevel = game.currentLevelIndex || 0;
      slot.levelReached = Math.max(slot.levelReached || 0, slot.currentLevel);
      slot.foundShards = game.foundShards ? [...game.foundShards] : slot.foundShards;
      slot.shardsCollected = slot.foundShards.filter(Boolean).length;

      // Capture lightweight thumbnail from canvas
      if (game.canvas) {
        slot.thumbnailData = this.captureThumbnail(game.canvas);
      }

      if (game.skills && game.skills.assigned) {
        slot.skills = [...game.skills.assigned];
      }
    }

    this.saveSlotsDirect(this.slots);
    return slot;
  }

  captureThumbnail(canvas) {
    try {
      // Downscale to 80x45 for small footprint and instant storage
      const thumb = document.createElement('canvas');
      thumb.width = 80;
      thumb.height = 45;
      const ctx = thumb.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 80, 45);
      return thumb.toDataURL('image/jpeg', 0.65);
    } catch (e) {
      return null;
    }
  }

  copySlot(fromId, toId) {
    const src = this.getSlot(fromId);
    if (!src || src.isEmpty) return false;

    const destIndex = this.slots.findIndex(s => s.id === toId);
    if (destIndex === -1) return false;

    const copy = JSON.parse(JSON.stringify(src));
    copy.id = toId;
    this.slots[destIndex] = copy;
    this.saveSlotsDirect(this.slots);
    return true;
  }

  deleteSlot(id) {
    const idx = this.slots.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.slots[idx] = this.createDefaultSlot(id);
      this.saveSlotsDirect(this.slots);
      return true;
    }
    return false;
  }

  exportJSON() {
    return JSON.stringify({
      version: 2,
      exportDate: new Date().toISOString(),
      activeSlotId: this.activeSlotId,
      slots: this.slots
    }, null, 2);
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && data.slots && Array.isArray(data.slots) && data.slots.length === 3) {
        this.slots = data.slots;
        if (data.activeSlotId) this.setActiveSlot(data.activeSlotId);
        this.saveSlotsDirect(this.slots);
        return true;
      }
    } catch (e) {
      console.warn('Import failed:', e);
    }
    return false;
  }

  clearAll() {
    this.slots = [
      this.createDefaultSlot(1),
      this.createDefaultSlot(2),
      this.createDefaultSlot(3)
    ];
    this.activeSlotId = 1;
    this.saveSlotsDirect(this.slots);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) {}
  }
}

export const Saves = new SaveManager();
