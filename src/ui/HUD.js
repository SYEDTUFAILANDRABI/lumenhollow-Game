import { GAME_WIDTH, GAME_HEIGHT, LANTERN, COLORS } from '../core/Constants.js';

export class HUD {
  constructor() {
    this.titleText = '';
    this.subtitleText = '';
    this.titleTimer = 0;
    this.titleDuration = 3.5;
  }

  showTitle(title, subtitle) {
    this.titleText = title;
    this.subtitleText = subtitle;
    this.titleTimer = this.titleDuration;
  }

  update(dt) {
    if (this.titleTimer > 0) {
      this.titleTimer -= dt;
    }
  }

  render(ctx, player, currentLevelIndex, foundShards, totalShards = 5, isMuted = false, combatSystem = null, boss = null, skillSystem = null) {
    ctx.save();

    // 1. Lantern Energy Bar (Top Left)
    const barX = 20;
    const barY = 16;
    const barWidth = 90;
    const barHeight = 8;
    const energyRatio = Math.max(0, Math.min(1, player.energy / LANTERN.MAX_ENERGY));

    // Energy icon (small lantern flame)
    ctx.fillStyle = player.isPulsing ? '#ff8fab' : '#ffd98a';
    ctx.beginPath();
    ctx.arc(barX - 7, barY + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Bar background frame
    ctx.fillStyle = 'rgba(18, 14, 32, 0.75)';
    ctx.strokeStyle = 'rgba(255, 217, 138, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Liquid energy fill
    if (energyRatio > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * energyRatio, barY);
      if (player.isPulsing) {
        fillGrad.addColorStop(0, '#ffd98a');
        fillGrad.addColorStop(1, '#ff8fab');
      } else {
        fillGrad.addColorStop(0, '#7be0ad');
        fillGrad.addColorStop(1, '#ffd98a');
      }
      ctx.fillStyle = fillGrad;
      ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * energyRatio, barHeight - 2);
    }

    // 1b. Eclipse Meter Bar (Just below Lantern Bar)
    if (combatSystem) {
      const eBarY = barY + 12;
      const eclipseRatio = Math.max(0, Math.min(1, combatSystem.eclipseMeter / combatSystem.maxEclipseMeter));
      const isReady = combatSystem.isAuraReady();
      const inEclipse = combatSystem.isEclipseForm;

      // Eclipse Icon (crescent eye)
      ctx.fillStyle = inEclipse ? '#ff2255' : (isReady ? '#ffd98a' : '#a288e3');
      ctx.beginPath();
      ctx.arc(barX - 7, eBarY + 3.5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eclipse frame
      ctx.strokeStyle = inEclipse ? '#ff2255' : (isReady ? 'rgba(255, 217, 138, 0.8)' : 'rgba(162, 136, 227, 0.3)');
      ctx.strokeRect(barX, eBarY, barWidth, 6);
      ctx.fillStyle = 'rgba(12, 9, 24, 0.8)';
      ctx.fillRect(barX, eBarY, barWidth, 6);

      // Eclipse fill
      if (inEclipse) {
        // Countdown
        const formRatio = Math.max(0, combatSystem.eclipseFormTimer / 8.0);
        ctx.fillStyle = '#ff2255';
        ctx.fillRect(barX + 1, eBarY + 1, (barWidth - 2) * formRatio, 4);
      } else if (eclipseRatio > 0) {
        const eGrad = ctx.createLinearGradient(barX, eBarY, barX + barWidth * eclipseRatio, eBarY);
        eGrad.addColorStop(0, '#662288');
        eGrad.addColorStop(1, isReady ? '#ff2255' : '#a288e3');
        ctx.fillStyle = eGrad;
        ctx.fillRect(barX + 1, eBarY + 1, (barWidth - 2) * eclipseRatio, 4);
      }

      // Ready banner or Charging Bar
      if (player.isChargingAura) {
        const cRatio = Math.min(1, player.auraChargeTimer / 0.70);
        ctx.fillStyle = '#ff2255';
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.fillText(`CHARGING AURA [${Math.round(cRatio * 100)}%]`, barX + barWidth + 6, eBarY + 6);
      } else if (isReady) {
        const pulse = Math.sin(Date.now() * 0.008) > 0;
        if (pulse) {
          ctx.font = 'bold 9px -apple-system, sans-serif';
          ctx.fillStyle = '#ffd98a';
          ctx.fillText('AURA READY [HOLD Q]', barX + barWidth + 6, eBarY + 6);
        }
      } else if (inEclipse) {
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.fillStyle = '#ff2255';
        ctx.fillText('ECLIPSE FORM', barX + barWidth + 6, eBarY + 6);
      }

      // 1c. Soul Energy Bar (Below Eclipse Meter)
      const sBarY = eBarY + 10;
      const soulRatio = Math.max(0, Math.min(1, (combatSystem.soulEnergy || 0) / (combatSystem.maxSoulEnergy || 100)));

      // Soul Icon (mini skull / flame)
      ctx.fillStyle = '#ff2255';
      ctx.beginPath();
      ctx.arc(barX - 7, sBarY + 3.5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Soul Frame
      ctx.strokeStyle = 'rgba(255, 34, 85, 0.4)';
      ctx.strokeRect(barX, sBarY, barWidth, 6);
      ctx.fillStyle = 'rgba(14, 8, 20, 0.8)';
      ctx.fillRect(barX, sBarY, barWidth, 6);

      // Soul Fill
      if (soulRatio > 0) {
        const sGrad = ctx.createLinearGradient(barX, sBarY, barX + barWidth * soulRatio, sBarY);
        sGrad.addColorStop(0, '#551133');
        sGrad.addColorStop(1, '#ff2255');
        ctx.fillStyle = sGrad;
        ctx.fillRect(barX + 1, sBarY + 1, (barWidth - 2) * soulRatio, 4);
      }

      if ((combatSystem.soulEnergy || 0) >= 20) {
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.fillStyle = '#f4f1ff';
        ctx.fillText('SUMMONS [E]', barX + barWidth + 6, sBarY + 6);
      }
    }

    // 1c. Combo Counter (Left side, below bars)
    if (combatSystem && combatSystem.comboCount >= 2) {
      ctx.save();
      const combo = combatSystem.comboCount;
      const isHigh = combo >= 10;
      const isMid = combo >= 5;

      ctx.textAlign = 'left';
      ctx.font = `italic bold ${isHigh ? 16 : (isMid ? 14 : 12)}px -apple-system, sans-serif`;

      if (isHigh) {
        ctx.fillStyle = '#ff2255';
        ctx.shadowColor = '#ff2255';
        ctx.shadowBlur = 8;
      } else if (isMid) {
        ctx.fillStyle = '#ffd98a';
        ctx.shadowColor = '#ffb347';
        ctx.shadowBlur = 5;
      } else {
        ctx.fillStyle = '#f4f1ff';
        ctx.shadowBlur = 0;
      }

      ctx.fillText(`${combo} HITS`, barX, barY + 36);
      ctx.restore();
    }

    // 1d. Boss Health Bar (Top Center)
    if (boss && boss.introDone && !boss.isDead) {
      ctx.save();
      const bWidth = 240;
      const bHeight = 10;
      const bX = (GAME_WIDTH - bWidth) / 2;
      const bY = 22;
      const hpRatio = Math.max(0, boss.hp / boss.maxHp);

      // Boss Name
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillStyle = '#ff2255';
      ctx.shadowColor = '#ff2255';
      ctx.shadowBlur = 6;
      ctx.fillText(`${boss.name} — ${boss.title}`, GAME_WIDTH / 2, bY - 6);

      // Frame
      ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
      ctx.strokeStyle = '#ffd98a';
      ctx.lineWidth = 1;
      ctx.strokeRect(bX, bY, bWidth, bHeight);
      ctx.fillRect(bX, bY, bWidth, bHeight);

      // Health fill
      const bGrad = ctx.createLinearGradient(bX, bY, bX + bWidth * hpRatio, bY);
      bGrad.addColorStop(0, '#881133');
      bGrad.addColorStop(1, '#ff2255');
      ctx.fillStyle = bGrad;
      ctx.fillRect(bX + 1, bY + 1, (bWidth - 2) * hpRatio, bHeight - 2);

      // Phase separators
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(bX + bWidth * 0.65, bY, 1, bHeight);
      ctx.fillRect(bX + bWidth * 0.30, bY, 1, bHeight);
      ctx.restore();
    }

    // 2. Moon Shards Tracker (Top Right)
    const shardSpacing = 16;
    const shardStartX = GAME_WIDTH - 20 - (totalShards * shardSpacing);
    const shardY = 20;

    for (let i = 0; i < totalShards; i++) {
      const sx = shardStartX + i * shardSpacing;
      const isCollected = foundShards[i];

      ctx.save();
      ctx.translate(sx, shardY);

      if (isCollected) {
        // Glowing filled shard
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#7be0ad';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Empty faint socket
        ctx.strokeStyle = 'rgba(244, 241, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(-3.5, 0);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Mute Status Icon (Top Right corner)
    const muteX = GAME_WIDTH - 14;
    const muteY = 19;
    ctx.fillStyle = isMuted ? '#ff8fab' : 'rgba(244, 241, 255, 0.4)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isMuted ? 'Muted (M)' : '♪ (M)', muteX, muteY);

    // 4. Level Title Card Fade-In
    if (this.titleTimer > 0) {
      const elapsed = this.titleDuration - this.titleTimer;
      let alpha = 1;
      if (elapsed < 0.6) {
        alpha = elapsed / 0.6;
      } else if (this.titleTimer < 0.8) {
        alpha = this.titleTimer / 0.8;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = 'center';

      // Title
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#f4f1ff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(this.titleText, GAME_WIDTH / 2, GAME_HEIGHT * 0.35);

      // Subtitle
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffd98a';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(this.subtitleText, GAME_WIDTH / 2, GAME_HEIGHT * 0.35 + 22);

      ctx.restore();
    }

    // 5. Swappable Skill Slots UI (Bottom Left corner)
    if (skillSystem) {
      const slotKeys = ['U', 'I', 'O'];
      const startX = 20;
      const startY = GAME_HEIGHT - 32;

      ctx.font = '9px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(162, 136, 227, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText('[TAB] SKILLS', startX, startY - 5);

      for (let s = 0; s < 3; s++) {
        const slotX = startX + s * 34;
        const skillId = skillSystem.assignedSlots[s];
        const skill = skillSystem.getSkill(skillId);
        const cd = skillSystem.cooldowns[s];
        const cdRatio = skill ? Math.min(1, cd / skill.cooldown) : 0;

        ctx.fillStyle = cd > 0 ? 'rgba(15, 10, 25, 0.7)' : 'rgba(28, 18, 48, 0.85)';
        ctx.strokeStyle = cd > 0 ? 'rgba(255, 34, 85, 0.4)' : '#ffd98a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(slotX, startY, 28, 22, 4);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.textAlign = 'center';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.fillText(skill.icon, slotX + 14, startY + 12);

        // Key label
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = cd > 0 ? '#ff8fab' : '#ffd98a';
        ctx.fillText(slotKeys[s], slotX + 14, startY + 20);

        // Cooldown sweep overlay
        if (cdRatio > 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(slotX, startY, 28, 22 * cdRatio);
        }
      }
    }

    ctx.restore();
  }
}
