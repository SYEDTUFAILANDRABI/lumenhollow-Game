import { TriMaw, AshenWyrm, HollowReaper, AbyssTitan, SkeletonLegion } from './Creatures.js';

export const SUMMON_ROSTER = [
  { id: 'tri_maw', name: 'Tri-Maw', desc: '3-Headed Hound • Fast rushing bites', cost: 20, icon: '🐺' },
  { id: 'ashen_wyrm', name: 'Ashen Wyrm', desc: 'Bone Dragon • Dark fire breath', cost: 25, icon: '🐉' },
  { id: 'hollow_reaper', name: 'Hollow Reaper', desc: 'Death Knight • Giant curved scythe', cost: 30, icon: '⚔️' },
  { id: 'abyss_titan', name: 'Abyss Titan', desc: 'Underworld Colossus • Ground craters', cost: 35, icon: '🗿' },
  { id: 'skeleton_legion', name: 'Skeleton Legion', desc: 'Squad of 5 • Swarm & stab', cost: 25, icon: '💀' }
];

export class SummonSystem {
  constructor() {
    this.activeSummons = [];
    this.maxActiveSummons = 2;
    this.summonCircles = [];
    this.wheelOpen = false;
    this.wheelSelectedIndex = 0;
  }

  openWheel() {
    this.wheelOpen = true;
  }

  closeWheel() {
    this.wheelOpen = false;
  }

  toggleWheel() {
    this.wheelOpen = !this.wheelOpen;
  }

  canSummon(index, combatSystem) {
    if (this.activeSummons.length >= this.maxActiveSummons) return false;
    const rosterItem = SUMMON_ROSTER[index];
    if (!rosterItem) return false;
    return combatSystem.soulEnergy >= rosterItem.cost;
  }

  summon(index, player, combatSystem, audio, vfx, particles, camera) {
    const rosterItem = SUMMON_ROSTER[index];
    if (!rosterItem) return false;

    // Check cost and limit
    if (combatSystem.soulEnergy < rosterItem.cost) return false;
    if (this.activeSummons.length >= this.maxActiveSummons) {
      // Remove oldest summon to make room
      this.activeSummons.shift();
    }

    combatSystem.soulEnergy -= rosterItem.cost;

    const sx = player.x + player.facing * 35;
    const sy = player.y + player.height;

    // Create glowing violet-and-crimson runic circle with chains & skeletal hands
    this.summonCircles.push({
      x: sx,
      y: sy,
      radius: 36,
      lifetime: 0.85,
      maxLife: 0.85
    });

    if (audio) {
      audio.playSummonDrum();
      audio.playSummonRoar();
    }
    if (camera) camera.shake(5, 0.22);
    if (particles) particles.emitSummonRuneEmbers(sx, sy, 35);

    let creature = null;
    switch (index) {
      case 0: creature = new TriMaw(sx, sy - 12); break;
      case 1: creature = new AshenWyrm(sx, sy - 35); break;
      case 2: creature = new HollowReaper(sx, sy - 20); break;
      case 3: creature = new AbyssTitan(sx, sy); break;
      case 4: creature = new SkeletonLegion(sx, sy); break;
    }

    if (creature) {
      this.activeSummons.push(creature);
    }
    return true;
  }

  update(dt, player, enemies, boss, combatSystem, vfx, audio, camera, particles, input) {
    // Summon Wheel Toggle & Quick selection
    if (input.actions.summonJustPressed) {
      this.toggleWheel();
    }

    // Quick Keys 1 - 5
    if (input.actions.summonQuick1) this.summon(0, player, combatSystem, audio, vfx, particles, camera);
    if (input.actions.summonQuick2) this.summon(1, player, combatSystem, audio, vfx, particles, camera);
    if (input.actions.summonQuick3) this.summon(2, player, combatSystem, audio, vfx, particles, camera);
    if (input.actions.summonQuick4) this.summon(3, player, combatSystem, audio, vfx, particles, camera);
    if (input.actions.summonQuick5) this.summon(4, player, combatSystem, audio, vfx, particles, camera);

    // Update active summons
    for (let i = this.activeSummons.length - 1; i >= 0; i--) {
      const s = this.activeSummons[i];
      s.update(dt, enemies, boss, combatSystem, vfx, audio, camera);
      if (s.dead) {
        if (particles) particles.emitFireflyAbsorb(s.x, s.y);
        this.activeSummons.splice(i, 1);
      }
    }

    // Update runic circles
    for (let i = this.summonCircles.length - 1; i >= 0; i--) {
      const c = this.summonCircles[i];
      c.lifetime -= dt;
      if (c.lifetime <= 0) this.summonCircles.splice(i, 1);
    }
  }

  renderWorld(ctx) {
    // 1. Render runic circles, chains, reaching skeletal hands
    for (const c of this.summonCircles) {
      const p = c.lifetime / c.maxLife;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = Math.min(1, p * 1.8);

      // Outer Runic Circle
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#a288e3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, c.radius, c.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner pentagram / rune lines
      ctx.strokeStyle = '#ff2255';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2;
        const a2 = ((i + 2) % 5 / 5) * Math.PI * 2;
        ctx.moveTo(Math.cos(a1) * c.radius * 0.8, Math.sin(a1) * c.radius * 0.36);
        ctx.lineTo(Math.cos(a2) * c.radius * 0.8, Math.sin(a2) * c.radius * 0.36);
      }
      ctx.stroke();

      // Reaching skeletal hands from ground cracks
      ctx.fillStyle = '#f4f1ff';
      const handRise = (1 - p) * 16;
      [-16, 0, 16].forEach((hx, idx) => {
        ctx.beginPath();
        ctx.moveTo(hx - 2, 0);
        ctx.lineTo(hx - 2, -handRise);
        ctx.lineTo(hx, -handRise - 4);
        ctx.lineTo(hx + 2, -handRise);
        ctx.lineTo(hx + 2, 0);
        ctx.fill();
      });

      ctx.restore();
    }

    // 2. Render all active summons
    for (const s of this.activeSummons) {
      s.render(ctx);
    }
  }

  renderWheel(ctx, width, height, soulEnergy) {
    if (!this.wheelOpen) return;

    ctx.save();
    // Dim background
    ctx.fillStyle = 'rgba(9, 8, 20, 0.75)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const wheelRadius = 85;

    // Outer wheel ring
    ctx.strokeStyle = 'rgba(255, 217, 138, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, wheelRadius + 15, 0, Math.PI * 2);
    ctx.stroke();

    // Center header
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('UNDERWORLD SUMMONS', cx, cy - wheelRadius - 26);
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = '#a288e3';
    ctx.fillText('Press [1-5] or Click to Summon • [E] Close', cx, cy - wheelRadius - 12);

    // Render 5 radial slots
    const total = SUMMON_ROSTER.length;
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const slotX = cx + Math.cos(angle) * wheelRadius;
      const slotY = cy + Math.sin(angle) * wheelRadius;
      const item = SUMMON_ROSTER[i];
      const canAfford = soulEnergy >= item.cost;

      // Slot circular frame
      ctx.fillStyle = canAfford ? 'rgba(32, 20, 56, 0.9)' : 'rgba(20, 16, 30, 0.6)';
      ctx.strokeStyle = canAfford ? '#ff2255' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(slotX, slotY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Key shortcut badge
      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`[${i + 1}]`, slotX, slotY - 7);

      // Icon / Name
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText(item.icon, slotX, slotY + 5);

      // Cost badge
      ctx.font = 'bold 9px -apple-system, sans-serif';
      ctx.fillStyle = canAfford ? '#7be0ad' : '#ff8fab';
      ctx.fillText(`${item.cost} SOUL`, slotX, slotY + 16);
    }

    ctx.restore();
  }
}
