// MoonLedger.js - Dreamy Moon-Style RPG Progression Window
import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

export class MoonLedger {
  constructor() {
    this.isOpen = false;
    this.level = 1;
    this.xp = 0;
    this.statPoints = 2; // Starting bonus points
    this.stats = {
      strength: 0,
      agility: 0,
      sense: 0,
      willpower: 0
    };

    this.objectives = [
      { id: 'warden', title: 'Defeat the Eclipse Warden (Sky Ruins)', xpReward: 100, ptReward: 1, done: false },
      { id: 'maldrek', title: 'Defeat Demon Lord Maldrek (Ember Descent)', xpReward: 200, ptReward: 2, done: false },
      { id: 'nythrax', title: 'Conquer the Abyssal Throne (Level 5)', xpReward: 400, ptReward: 3, done: false },
      { id: 'soldiers', title: 'Extract 4 Shadow Soldiers into Army', xpReward: 150, ptReward: 1, done: false }
    ];

    this.levelUpNotification = 0; // Timer for level up toast
    this.animTimer = 0;

    this.loadFromStorage();
  }

  getXpToNext() {
    return this.level * 80;
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('lumen_hollow_moon_ledger');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.level) this.level = parsed.level;
        if (parsed.xp !== undefined) this.xp = parsed.xp;
        if (parsed.statPoints !== undefined) this.statPoints = parsed.statPoints;
        if (parsed.stats) this.stats = { ...this.stats, ...parsed.stats };
        if (parsed.objectives) {
          parsed.objectives.forEach(savedObj => {
            const match = this.objectives.find(o => o.id === savedObj.id);
            if (match) match.done = savedObj.done;
          });
        }
      }
    } catch (e) {
      console.warn('Could not load Moon Ledger:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('lumen_hollow_moon_ledger', JSON.stringify({
        level: this.level,
        xp: this.xp,
        statPoints: this.statPoints,
        stats: this.stats,
        objectives: this.objectives.map(o => ({ id: o.id, done: o.done }))
      }));
    } catch (e) {
      console.warn('Could not save Moon Ledger:', e);
    }
  }

  addXP(amount, audioSystem) {
    this.xp += amount;
    const req = this.getXpToNext();
    if (this.xp >= req) {
      this.xp -= req;
      this.level++;
      this.statPoints += 2;
      this.levelUpNotification = 3.0;
      if (audioSystem && audioSystem.playShrineActivate) audioSystem.playShrineActivate();
    }
    this.saveToStorage();
  }

  completeObjective(objId, audioSystem) {
    const obj = this.objectives.find(o => o.id === objId);
    if (obj && !obj.done) {
      obj.done = true;
      this.statPoints += obj.ptReward;
      this.addXP(obj.xpReward, audioSystem);
      this.saveToStorage();
    }
  }

  spendPoint(statKey) {
    if (this.statPoints > 0 && this.stats[statKey] !== undefined) {
      this.stats[statKey]++;
      this.statPoints--;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  update(dt, input) {
    this.animTimer += dt;
    if (this.levelUpNotification > 0) {
      this.levelUpNotification -= dt;
    }

    if (input.actions.ledgerJustPressed) {
      this.isOpen = !this.isOpen;
    }

    // Keyboard allocations if open
    if (this.isOpen && this.statPoints > 0) {
      if (input.justPressed.has('Digit1')) this.spendPoint('strength');
      if (input.justPressed.has('Digit2')) this.spendPoint('agility');
      if (input.justPressed.has('Digit3')) this.spendPoint('sense');
      if (input.justPressed.has('Digit4')) this.spendPoint('willpower');
    }
  }

  render(ctx) {
    // Level Up Toast
    if (this.levelUpNotification > 0) {
      ctx.save();
      const alpha = Math.min(1, this.levelUpNotification);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(18, 12, 32, 0.88)';
      ctx.fillRect(GAME_WIDTH / 2 - 90, 48, 180, 24);
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 1;
      ctx.strokeRect(GAME_WIDTH / 2 - 90, 48, 180, 24);

      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★ LEVEL UP! LEVEL ${this.level} ★`, GAME_WIDTH / 2, 64);
      ctx.restore();
    }

    if (!this.isOpen) return;

    // Glowing dream moon window
    ctx.save();
    ctx.fillStyle = 'rgba(10, 8, 22, 0.92)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const w = 460;
    const h = 280;
    const left = cx - w / 2;
    const top = cy - h / 2;

    // Panel border with celestial gradient
    ctx.fillStyle = 'rgba(24, 18, 44, 0.95)';
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = '#7be0ad';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, top, w, h);

    // Decorative Crescent Moon header
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☾  THE MOON LEDGER  ☽', cx, top + 26);

    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = '#f4f1ff';
    ctx.fillText(`Lumi — Level ${this.level} Wanderer   •   XP: ${this.xp} / ${this.getXpToNext()}`, cx, top + 42);

    // XP Progress Bar
    const xpRatio = Math.max(0, Math.min(1, this.xp / this.getXpToNext()));
    ctx.fillStyle = '#140f28';
    ctx.fillRect(cx - 140, top + 50, 280, 6);
    ctx.fillStyle = '#7be0ad';
    ctx.fillRect(cx - 140, top + 50, 280 * xpRatio, 6);

    // Stat Points available
    ctx.fillStyle = this.statPoints > 0 ? '#ffd98a' : '#a288e3';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText(`Available Stat Points: ${this.statPoints}`, cx, top + 74);

    // 4 Core Attributes (Left Column)
    const statX = left + 28;
    const statY = top + 98;
    const statList = [
      { key: 'strength', name: '[1] Strength', desc: '+5% Attack & Skill Damage', val: this.stats.strength },
      { key: 'agility', name: '[2] Agility', desc: '+4% Speed & Dash Range', val: this.stats.agility },
      { key: 'sense', name: '[3] Sense', desc: '+3% Soul Extract & Crit Rate', val: this.stats.sense },
      { key: 'willpower', name: '[4] Willpower', desc: '+8% Aura Radius & Army Slot', val: this.stats.willpower }
    ];

    ctx.textAlign = 'left';
    statList.forEach((st, idx) => {
      const sy = statY + idx * 36;
      ctx.fillStyle = '#f4f1ff';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText(`${st.name}: ${st.val}`, statX, sy);

      ctx.fillStyle = 'rgba(244, 241, 255, 0.6)';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillText(st.desc, statX, sy + 14);

      if (this.statPoints > 0) {
        ctx.fillStyle = '#ffd98a';
        ctx.font = 'bold 10px -apple-system, sans-serif';
        ctx.fillText('[+]', statX + 175, sy);
      }
    });

    // Objectives (Right Column)
    const objX = left + 235;
    const objY = top + 98;
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText('ACTIVE PURSUITS:', objX, objY);

    this.objectives.forEach((ob, idx) => {
      const oy = objY + 22 + idx * 28;
      ctx.fillStyle = ob.done ? '#7be0ad' : '#f4f1ff';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillText(`${ob.done ? '✓ ' : '○ '} ${ob.title}`, objX, oy);

      ctx.fillStyle = 'rgba(255, 217, 138, 0.65)';
      ctx.font = '8px -apple-system, sans-serif';
      ctx.fillText(`+${ob.xpReward} XP, +${ob.ptReward} SP`, objX + 14, oy + 12);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(244, 241, 255, 0.5)';
    ctx.font = '9px -apple-system, sans-serif';
    ctx.fillText('Press [T] to Close • Number keys 1-4 to assign points', cx, top + h - 14);

    ctx.restore();
  }
}
