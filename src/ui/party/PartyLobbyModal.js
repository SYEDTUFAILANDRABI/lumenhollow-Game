// src/ui/party/PartyLobbyModal.js - Co-Op Party Lobby & Matchmaking Modal
import { PLAYER_PALETTES } from '../../../shared/protocol.js';

export class PartyLobbyModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.net = game.network;
    this.isMatchmaking = false;
  }

  create() {
    const el = document.createElement('div');
    el.className = 'party-lobby-modal';
    el.innerHTML = `
      <div class="party-modal-backdrop"></div>
      <div class="party-modal-panel">
        <div class="party-header">
          <div class="party-title">
            <span class="party-icon">👥</span>
            <h2>CELESTIAL EXPEDITION</h2>
          </div>
          <button class="party-close-btn" id="party-close" aria-label="Close">✕</button>
        </div>

        <div class="party-body">
          <!-- Room Status Banner -->
          <div class="party-room-bar" id="party-room-bar">
            <div class="room-info">
              <span class="room-label">ROOM CODE:</span>
              <span class="room-code-badge" id="party-code-val">${this.net && this.net.roomCode ? this.net.roomCode : 'OFFLINE'}</span>
              <button class="copy-link-btn" id="party-copy-link" title="Copy Invite Link">📋 Copy Link</button>
            </div>
            <div class="room-mode-tag" id="party-mode-tag">
              ${this.net && this.net.roomData ? (this.net.roomData.mode.toUpperCase() + ' (' + (this.net.roomData.mode === 'squad' ? '4P' : '2P') + ')') : 'DUO (2P)'}
            </div>
          </div>

          <!-- Player Slots (1 to 4) -->
          <div class="party-slots-grid" id="party-slots-container">
            <!-- Dynamically populated -->
          </div>

          <!-- Quick Connect / Join Controls -->
          <div class="party-join-bar">
            <div class="join-input-group">
              <input type="text" id="party-join-code-input" placeholder="ENTER 6-CHAR CODE" maxlength="6" autocomplete="off" />
              <button class="menu-btn secondary-btn" id="party-join-btn">JOIN ROOM</button>
            </div>
            <div class="join-divider">OR</div>
            <button class="menu-btn secondary-btn" id="party-quickplay-btn">⚡ QUICK MATCH</button>
            <button class="menu-btn secondary-btn" id="party-create-btn">➕ NEW ROOM</button>
          </div>
        </div>

        <div class="party-footer">
          <button class="menu-btn back-btn" id="party-leave-btn">LEAVE PARTY</button>
          <div class="footer-spacer"></div>
          <button class="menu-btn toggle-ready-btn" id="party-ready-btn">TOGGLE READY</button>
          <button class="menu-btn start-expedition-btn" id="party-start-btn" disabled>START EXPEDITION</button>
        </div>
      </div>
    `;

    this.applyStyles();
    this.bindEvents(el);
    this.refreshSlots(el);

    // Subscribe to network room updates
    if (this.net) {
      this.net.onRoomUpdate = () => {
        this.refreshSlots(el);
      };
      this.net.onGameStart = () => {
        this.menuManager.clearModals();
        this.game.startSlotGame(this.game.saves ? this.game.saves.getActiveSlot() : null);
      };
    }

    return el;
  }

  refreshSlots(rootEl) {
    const container = rootEl.querySelector('#party-slots-container');
    const codeVal = rootEl.querySelector('#party-code-val');
    const startBtn = rootEl.querySelector('#party-start-btn');
    const readyBtn = rootEl.querySelector('#party-ready-btn');

    if (!container) return;
    container.innerHTML = '';

    const members = (this.net && this.net.roomData && this.net.roomData.members)
      ? this.net.roomData.members
      : [{
          id: this.net ? this.net.playerId : 'local',
          nickname: this.net ? this.net.nickname : 'Lumi',
          paletteId: this.net ? this.net.paletteId : 0,
          isHost: true,
          ready: true
        }];

    if (codeVal) {
      codeVal.textContent = (this.net && this.net.roomCode) ? this.net.roomCode : 'STANDALONE';
    }

    const maxSlots = (this.net && this.net.roomData && this.net.roomData.mode === 'squad') ? 4 : 2;
    let allReady = members.length > 0;

    for (let slot = 0; slot < maxSlots; slot++) {
      const member = members[slot];
      const slotCard = document.createElement('div');
      slotCard.className = `party-slot-card ${member ? 'occupied' : 'empty'}`;

      if (member) {
        if (!member.ready) allReady = false;
        const pal = PLAYER_PALETTES[(member.paletteId || 0) % PLAYER_PALETTES.length];
        const isSelf = this.net && member.id === this.net.playerId;

        slotCard.innerHTML = `
          <div class="slot-avatar-wrap">
            <div class="slot-avatar" style="border-color: ${pal.cloak}; box-shadow: 0 0 14px ${pal.glow};">
              <span class="avatar-lantern" style="color: ${pal.lantern};">🕯️</span>
            </div>
            ${member.isHost ? '<span class="host-crown" title="Host">👑</span>' : ''}
          </div>
          <div class="slot-info">
            <div class="slot-name">
              ${isSelf ? `<input type="text" class="slot-name-input" value="${member.nickname}" maxlength="14" />` : `<span>${member.nickname}</span>`}
            </div>
            <div class="slot-palette-label" style="color: ${pal.cloak};">${pal.name} Cloak</div>
            <div class="slot-status-badge ${member.ready ? 'ready' : 'waiting'}">
              ${member.ready ? '✓ READY' : 'WAITING...'}
            </div>
          </div>
          ${isSelf ? `
            <div class="palette-picker-row">
              ${PLAYER_PALETTES.map((p, pIdx) => `
                <button class="palette-dot ${pIdx === member.paletteId ? 'active' : ''}" 
                        style="background: ${p.cloak};" 
                        title="${p.name}" 
                        data-palette="${pIdx}"></button>
              `).join('')}
            </div>
          ` : ''}
        `;

        if (isSelf) {
          const nameInput = slotCard.querySelector('.slot-name-input');
          if (nameInput) {
            nameInput.addEventListener('change', (e) => {
              this.net.nickname = e.target.value.trim().substring(0, 14) || 'Lumi';
              localStorage.setItem('lumen_net_nickname', this.net.nickname);
            });
          }

          slotCard.querySelectorAll('.palette-dot').forEach(dot => {
            dot.addEventListener('click', () => {
              const pId = parseInt(dot.getAttribute('data-palette'), 10);
              this.net.paletteId = pId;
              localStorage.setItem('lumen_net_palette', pId.toString());
              this.refreshSlots(rootEl);
            });
          });
        }
      } else {
        slotCard.innerHTML = `
          <div class="slot-empty-content">
            <span class="empty-icon">➕</span>
            <span class="empty-text">OPEN SLOT</span>
          </div>
        `;
      }

      container.appendChild(slotCard);
    }

    if (startBtn) {
      const isHost = this.net ? this.net.isHost : true;
      startBtn.style.display = isHost ? 'inline-block' : 'none';
      startBtn.disabled = !allReady || (this.net && this.net.isMultiplayer && members.length < 2);
    }

    if (readyBtn && this.net) {
      const myInfo = members.find(m => m.id === this.net.playerId);
      readyBtn.textContent = (myInfo && myInfo.ready) ? 'CANCEL READY' : 'READY UP';
      readyBtn.className = `menu-btn toggle-ready-btn ${(myInfo && myInfo.ready) ? 'is-ready' : ''}`;
    }
  }

  bindEvents(rootEl) {
    const closeBtn = rootEl.querySelector('#party-close');
    const leaveBtn = rootEl.querySelector('#party-leave-btn');
    const startBtn = rootEl.querySelector('#party-start-btn');
    const readyBtn = rootEl.querySelector('#party-ready-btn');
    const copyLinkBtn = rootEl.querySelector('#party-copy-link');
    const quickMatchBtn = rootEl.querySelector('#party-quickplay-btn');
    const createBtn = rootEl.querySelector('#party-create-btn');
    const joinBtn = rootEl.querySelector('#party-join-btn');
    const joinInput = rootEl.querySelector('#party-join-code-input');

    closeBtn?.addEventListener('click', () => this.menuManager.clearModals());
    leaveBtn?.addEventListener('click', () => {
      if (this.net) this.net.setOffline();
      this.menuManager.clearModals();
    });

    copyLinkBtn?.addEventListener('click', () => {
      const code = this.net && this.net.roomCode ? this.net.roomCode : '';
      if (!code) return;
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard?.writeText(url).then(() => {
        this.menuManager.showToast('Invite link copied!', '📋');
      });
    });

    createBtn?.addEventListener('click', () => {
      if (!this.net) return;
      this.net.connectToServer();
      setTimeout(() => {
        this.net.createRoom('duo', false);
      }, 250);
    });

    joinBtn?.addEventListener('click', () => {
      const code = joinInput?.value.trim().toUpperCase();
      if (!code || code.length < 4) {
        this.menuManager.showToast('Please enter a valid room code', '⚠️');
        return;
      }
      if (!this.net) return;
      this.net.connectToServer();
      setTimeout(() => {
        this.net.joinRoom(code);
      }, 250);
    });

    quickMatchBtn?.addEventListener('click', () => {
      if (!this.net) return;
      this.menuManager.showToast('Searching for celestial allies...', '⚡');
      this.net.connectToServer();
      setTimeout(() => {
        this.net.matchmake('duo');
      }, 250);
    });

    readyBtn?.addEventListener('click', () => {
      if (!this.net) return;
      const members = this.net.roomData?.members || [];
      const myInfo = members.find(m => m.id === this.net.playerId);
      const isReady = myInfo ? !myInfo.ready : true;
      this.net.setReady(isReady);
    });

    startBtn?.addEventListener('click', () => {
      if (!this.net) return;
      if (this.net.isMultiplayer) {
        this.net.startGame();
      } else {
        this.menuManager.clearModals();
        this.game.startSlotGame(this.game.saves ? this.game.saves.getActiveSlot() : null);
      }
    });
  }

  applyStyles() {
    if (document.getElementById('party-lobby-styles')) return;
    const style = document.createElement('style');
    style.id = 'party-lobby-styles';
    style.textContent = `
      .party-lobby-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .party-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(9, 8, 20, 0.88);
        backdrop-filter: blur(8px);
      }
      .party-modal-panel {
        position: relative;
        width: 680px;
        max-width: 92vw;
        background: linear-gradient(180deg, #18152c 0%, #0d0b1a 100%);
        border: 1px solid rgba(255, 217, 138, 0.35);
        border-radius: 12px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(126, 184, 218, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #f0e6df;
      }
      .party-header {
        padding: 18px 24px;
        background: rgba(255, 217, 138, 0.05);
        border-bottom: 1px solid rgba(255, 217, 138, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .party-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .party-title h2 {
        margin: 0;
        font-size: 1.15rem;
        letter-spacing: 2px;
        color: #ffd98a;
      }
      .party-close-btn {
        background: none;
        border: none;
        color: #a097a8;
        font-size: 1.2rem;
        cursor: pointer;
        transition: color 0.2s;
      }
      .party-close-btn:hover { color: #ffd98a; }
      .party-body {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .party-room-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 0, 0, 0.35);
        padding: 10px 16px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .room-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .room-label {
        font-size: 0.75rem;
        letter-spacing: 1.5px;
        color: #9c92a6;
      }
      .room-code-badge {
        font-size: 1.15rem;
        font-weight: bold;
        letter-spacing: 3px;
        color: #7eb8da;
        background: rgba(126, 184, 218, 0.15);
        padding: 2px 10px;
        border-radius: 4px;
      }
      .copy-link-btn {
        background: rgba(255, 217, 138, 0.1);
        border: 1px solid rgba(255, 217, 138, 0.3);
        color: #ffd98a;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .copy-link-btn:hover {
        background: rgba(255, 217, 138, 0.25);
      }
      .room-mode-tag {
        font-size: 0.75rem;
        color: #ffd98a;
        font-weight: 600;
        letter-spacing: 1px;
      }
      .party-slots-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }
      .party-slot-card {
        background: rgba(20, 18, 36, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 14px;
        display: flex;
        gap: 14px;
        align-items: center;
        position: relative;
        min-height: 80px;
      }
      .party-slot-card.empty {
        border-style: dashed;
        border-color: rgba(255, 255, 255, 0.08);
        justify-content: center;
      }
      .slot-avatar-wrap {
        position: relative;
      }
      .slot-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #110f22;
        border: 2px solid #ffd98a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
      }
      .host-crown {
        position: absolute;
        top: -8px;
        right: -6px;
        font-size: 0.9rem;
      }
      .slot-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .slot-name {
        font-weight: bold;
        font-size: 0.95rem;
        color: #fff;
      }
      .slot-name-input {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 217, 138, 0.3);
        color: #ffd98a;
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 0.9rem;
        width: 120px;
      }
      .slot-palette-label {
        font-size: 0.72rem;
        font-weight: 500;
      }
      .slot-status-badge {
        font-size: 0.68rem;
        letter-spacing: 1px;
        padding: 2px 6px;
        border-radius: 3px;
        width: fit-content;
      }
      .slot-status-badge.ready {
        background: rgba(82, 196, 26, 0.2);
        color: #73d13d;
        border: 1px solid rgba(82, 196, 26, 0.4);
      }
      .slot-status-badge.waiting {
        background: rgba(250, 173, 20, 0.2);
        color: #ffc069;
        border: 1px solid rgba(250, 173, 20, 0.4);
      }
      .palette-picker-row {
        position: absolute;
        bottom: 8px;
        right: 10px;
        display: flex;
        gap: 6px;
      }
      .palette-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.4);
        cursor: pointer;
        transition: transform 0.15s;
      }
      .palette-dot.active {
        transform: scale(1.3);
        border-color: #ffd98a;
        box-shadow: 0 0 6px #ffd98a;
      }
      .slot-empty-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: #6d647a;
      }
      .party-join-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }
      .join-input-group {
        display: flex;
        gap: 6px;
        flex: 1;
      }
      .join-input-group input {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        letter-spacing: 1.5px;
        width: 140px;
      }
      .join-divider {
        font-size: 0.7rem;
        color: #7d738a;
        font-weight: bold;
      }
      .party-footer {
        padding: 14px 24px;
        background: rgba(0, 0, 0, 0.25);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .footer-spacer { flex: 1; }
      .menu-btn {
        background: rgba(255, 217, 138, 0.12);
        border: 1px solid rgba(255, 217, 138, 0.35);
        color: #ffd98a;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.82rem;
        letter-spacing: 1px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .menu-btn:hover:not(:disabled) {
        background: rgba(255, 217, 138, 0.25);
        border-color: #ffd98a;
        box-shadow: 0 0 10px rgba(255, 217, 138, 0.3);
      }
      .menu-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .secondary-btn {
        padding: 6px 12px;
        font-size: 0.75rem;
      }
      .toggle-ready-btn.is-ready {
        background: rgba(82, 196, 26, 0.25);
        border-color: #73d13d;
        color: #73d13d;
      }
      .start-expedition-btn {
        background: linear-gradient(135deg, #ffd98a 0%, #e59866 100%);
        color: #120e24;
        border: none;
        font-weight: bold;
      }
      .start-expedition-btn:hover:not(:disabled) {
        box-shadow: 0 0 18px rgba(255, 217, 138, 0.6);
      }
    `;
    document.head.appendChild(style);
  }
}
