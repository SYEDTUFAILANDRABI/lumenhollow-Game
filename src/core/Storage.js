// Safe local storage persistence for mute settings and player progress

const STORAGE_KEY = 'lumen_hollow_save_v1';

export class Storage {
  static defaultData = {
    muted: false,
    currentLevel: 1,
    shardsCollected: 0,
    foundShards: [false, false, false, false, false],
    completed: false,
    shakeEnabled: true,
    flashIntensity: 1.0,
    hitStopEnabled: true,
    damageNumbers: true,
    highQuality: true
  };

  static load() {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (!item) return { ...this.defaultData };
      const parsed = JSON.parse(item);
      return { ...this.defaultData, ...parsed };
    } catch (e) {
      console.warn('Storage read failed:', e);
      return { ...this.defaultData };
    }
  }

  static save(data) {
    try {
      const current = this.load();
      const updated = { ...current, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Storage write failed:', e);
      return null;
    }
  }

  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Storage reset failed:', e);
    }
  }
}
