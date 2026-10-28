import { SKILL_POOL, ActiveGravityWell, ActiveShadowClone, ActiveSpiritLance } from './SkillAbilities.js';
import { Projectile } from '../combat/Projectile.js';

export class SkillSystem {
  constructor() {
    this.menuOpen = false;
    this.assignedSlots = ['bolt', 'plunge', 'crescent']; // Slots U, I, O
    this.cooldowns = [0, 0, 0];
    this.selectedPreset = 0;

    this.presets = [
      ['bolt', 'plunge', 'crescent'],
      ['chain', 'gravity', 'crescent'],
      ['clone', 'lance', 'plunge']
    ];

    this.gravityWells = [];
    this.clones = [];
    this.lances = [];

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('lumen_hollow_skill_presets');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.presets) this.presets = parsed.presets;
        if (parsed.assignedSlots) this.assignedSlots = parsed.assignedSlots;
        if (parsed.selectedPreset !== undefined) this.selectedPreset = parsed.selectedPreset;
      }
    } catch (e) {
      console.warn('Could not load skill presets from localStorage:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('lumen_hollow_skill_presets', JSON.stringify({
        presets: this.presets,
        assignedSlots: this.assignedSlots,
        selectedPreset: this.selectedPreset
      }));
    } catch (e) {
      console.warn('Could not save skill presets to localStorage:', e);
    }
  }

  selectPreset(index) {
    if (index >= 0 && index < this.presets.length) {
      this.selectedPreset = index;
      this.assignedSlots = [...this.presets[index]];
      this.saveToStorage();
    }
  }

  assignSkillToSlot(skillId, slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.assignedSlots[slotIndex] = skillId;
      this.presets[this.selectedPreset] = [...this.assignedSlots];
      this.saveToStorage();
    }
  }

  getSkill(id) {
    return SKILL_POOL.find(s => s.id === id) || SKILL_POOL[0];
  }

  useSlot(slotIndex, player, combatSystem, enemies, boss, vfx, audio, camera, particles) {
    if (slotIndex < 0 || slotIndex >= 3) return false;
    if (this.cooldowns[slotIndex] > 0) return false;

    const skillId = this.assignedSlots[slotIndex];
    const skill = this.getSkill(skillId);
    if (!skill) return false;

    // Check lantern energy cost
    if (player.energy < skill.cost) return false;
    player.energy -= skill.cost;
    this.cooldowns[slotIndex] = skill.cooldown;

    const lPos = player.getLanternWorldPos();

    switch (skillId) {
      case 'bolt': {
        // Umbral Bolt
        if (player.initiateBolt) {
          player.initiateBolt(combatSystem, vfx, audio, particles, {});
        }
        break;
      }
      case 'plunge': {
        // Void Plunge
        if (!player.isGrounded && !player.isPlunging) {
          player.initiatePlunge(audio);
        } else {
          // If grounded, small upward hop then plunge
          player.vy = -200;
          setTimeout(() => { if (!player.isGrounded) player.initiatePlunge(audio); }, 80);
        }
        break;
      }
      case 'crescent': {
        // Crescent Wave: wide piercing slash wave
        if (audio) audio.playCrescentWave();
        if (vfx) vfx.addSlashArc(lPos.x, lPos.y, player.facing, 2, player.isEclipseForm);
        if (combatSystem) {
          combatSystem.projectiles.push(new Projectile(lPos.x, lPos.y, player.facing * 380, 0, {
            damage: 32,
            isEnemy: false,
            pierce: true,
            color: '#ff2255',
            coreColor: '#ffd98a'
          }));
        }
        break;
      }
      case 'chain': {
        // Soul Chain: pulls nearest enemy toward Lumi
        if (audio) audio.playSoulChain();
        const targets = [...enemies];
        if (boss && !boss.isDead) targets.push(boss);
        const alive = targets.filter(t => !t.isDead);

        let nearest = null;
        let minDist = 220;
        for (const t of alive) {
          const d = Math.hypot(t.x - player.x, t.y - player.y);
          if (d < minDist) {
            minDist = d;
            nearest = t;
          }
        }

        if (nearest) {
          const pullAngle = Math.atan2(player.y - nearest.y, player.x - nearest.x);
          nearest.vx = Math.cos(pullAngle) * 220;
          nearest.vy = Math.sin(pullAngle) * 120 - 40;
          nearest.applyStun(1.0);
          nearest.takeDamage(18, nearest.x, nearest.y, combatSystem, vfx, audio, camera);
          if (vfx) {
            vfx.addLightningBurst(player.x, player.y + 10, 4, minDist);
          }
        }
        break;
      }
      case 'gravity': {
        // Gravity Well: spawns pull vortex
        if (audio) audio.playGravityWell();
        const spawnX = player.x + player.facing * 60;
        const spawnY = player.y + 10;
        this.gravityWells.push(new ActiveGravityWell(spawnX, spawnY));
        if (camera) camera.shake(4, 0.2);
        break;
      }
      case 'clone': {
        // Shadow Clone decoy
        if (audio) audio.playShadowClone();
        this.clones.push(new ActiveShadowClone(player.x, player.y + player.height, player.facing));
        // Push Lumi slightly back
        player.vx = -player.facing * 180;
        break;
      }
      case 'lance': {
        // Spirit Lance piercing beam
        if (audio) audio.playSpiritLance();
        this.lances.push(new ActiveSpiritLance(player.x, player.y + 8, player.facing));
        if (camera) camera.shake(5, 0.18);
        const all = [...enemies];
        if (boss && !boss.isDead) all.push(boss);
        for (const t of all) {
          if (t.isDead) continue;
          const dx = (t.x - player.x) * player.facing;
          const dy = Math.abs(t.y - (player.y + 8));
          if (dx > 0 && dx < 360 && dy < 24) {
            t.takeDamage(38, t.x, t.y, combatSystem, vfx, audio, camera);
          }
        }
        break;
      }
    }

    return true;
  }

  update(dt, input, player, combatSystem, enemies, boss, vfx, audio, camera, particles) {
    // Menu toggle on Tab
    if (input.actions.skillsJustPressed) {
      this.menuOpen = !this.menuOpen;
    }

    // Cooldown countdowns
    for (let i = 0; i < 3; i++) {
      if (this.cooldowns[i] > 0) {
        this.cooldowns[i] -= dt;
      }
    }

    // Swappable Skill Keys: U, I, O
    if (input.actions.skillSlot1) this.useSlot(0, player, combatSystem, enemies, boss, vfx, audio, camera, particles);
    if (input.actions.skillSlot2) this.useSlot(1, player, combatSystem, enemies, boss, vfx, audio, camera, particles);
    if (input.actions.skillSlot3) this.useSlot(2, player, combatSystem, enemies, boss, vfx, audio, camera, particles);

    // Active sub-effects
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const gw = this.gravityWells[i];
      gw.update(dt, enemies, boss);
      if (gw.dead) this.gravityWells.splice(i, 1);
    }

    for (let i = this.clones.length - 1; i >= 0; i--) {
      const cl = this.clones[i];
      cl.update(dt);
      if (cl.dead) this.clones.splice(i, 1);
    }

    for (let i = this.lances.length - 1; i >= 0; i--) {
      const ln = this.lances[i];
      ln.update(dt);
      if (ln.dead) this.lances.splice(i, 1);
    }
  }

  renderWorld(ctx) {
    for (const gw of this.gravityWells) gw.render(ctx);
    for (const cl of this.clones) cl.render(ctx);
    for (const ln of this.lances) ln.render(ctx);
  }

  renderMenu(ctx, width, height) {
    if (!this.menuOpen) return;

    ctx.save();
    // Modal background
    ctx.fillStyle = 'rgba(9, 8, 20, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const topY = 24;

    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.fillStyle = '#ffd98a';
    ctx.fillText('SKILL SWAP & LOADOUT PRESETS', cx, topY);
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = '#a288e3';
    ctx.fillText('Assign abilities to slots [U], [I], [O] • Press [Tab] to Close', cx, topY + 14);

    // Presets Row
    const presetY = topY + 34;
    for (let p = 0; p < 3; p++) {
      const px = cx - 110 + p * 110;
      const isSelected = this.selectedPreset === p;

      ctx.fillStyle = isSelected ? '#ff2255' : 'rgba(32, 20, 56, 0.8)';
      ctx.strokeStyle = isSelected ? '#ffd98a' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(px - 45, presetY, 90, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f4f1ff';
      ctx.font = isSelected ? 'bold 10px -apple-system, sans-serif' : '10px -apple-system, sans-serif';
      ctx.fillText(`Preset ${p + 1}`, px, presetY + 14);
    }

    // Active 3 Slots Display (U, I, O)
    const slotKeys = ['U', 'I', 'O'];
    const slotY = presetY + 32;
    for (let s = 0; s < 3; s++) {
      const sx = cx - 120 + s * 120;
      const skillId = this.assignedSlots[s];
      const skill = this.getSkill(skillId);

      ctx.fillStyle = 'rgba(24, 16, 42, 0.9)';
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(sx - 52, slotY, 104, 38, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd98a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SLOT [${slotKeys[s]}]`, sx - 44, slotY + 14);

      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${skill.icon} ${skill.name}`, sx - 44, slotY + 28);
    }

    // Skills Pool List
    const poolY = slotY + 48;
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillStyle = '#a288e3';
    ctx.fillText('— AVAILABLE ABILITIES POOL —', cx, poolY);

    ctx.textAlign = 'left';
    for (let i = 0; i < SKILL_POOL.length; i++) {
      const item = SKILL_POOL[i];
      const rowY = poolY + 12 + i * 22;

      // Row background
      ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 20, 50, 0.5)' : 'rgba(18, 12, 32, 0.5)';
      ctx.fillRect(cx - 210, rowY, 420, 20);

      // Icon & Name
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = '#ffd98a';
      ctx.fillText(`${item.icon} ${item.name}`, cx - 200, rowY + 14);

      // Cost & Cooldown
      ctx.font = '9px monospace';
      ctx.fillStyle = '#7be0ad';
      ctx.fillText(`${item.cost} EN | ${item.cooldown}s CD`, cx - 60, rowY + 14);

      // Description
      ctx.fillStyle = '#c7bde8';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillText(item.desc, cx + 45, rowY + 14);
    }

    ctx.restore();
  }
}
