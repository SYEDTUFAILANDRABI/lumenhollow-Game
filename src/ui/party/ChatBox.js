// src/ui/party/ChatBox.js - In-Game Quick Chat & Event Log
import { GlobalNetEvents } from '../../net/NetworkEventBus.js';

export class ChatBox {
  constructor(game) {
    this.game = game;
    this.messages = []; // { sender, text, time, ttl }
    this.isOpen = false;
    this.inputElement = null;

    GlobalNetEvents.on('CHAT_MESSAGE', (msg) => {
      this.addMessage(msg.nickname || 'Ally', msg.text);
    });

    this.setupHtml();
  }

  setupHtml() {
    const container = document.createElement('div');
    container.className = 'game-chat-overlay';
    container.innerHTML = `
      <div class="chat-log" id="chat-log"></div>
      <input type="text" class="chat-input" id="chat-input" placeholder="Press Enter to send (Esc to cancel)..." maxlength="120" style="display: none;" />
    `;

    this.applyStyles();
    document.body.appendChild(container);

    this.inputElement = container.querySelector('#chat-input');
    const logEl = container.querySelector('#chat-log');

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!this.isOpen && this.game.state === 'PLAYING') {
          this.open();
          e.preventDefault();
        } else if (this.isOpen) {
          this.sendCurrentText();
          this.close();
          e.preventDefault();
        }
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
        e.preventDefault();
      }
    });
  }

  open() {
    this.isOpen = true;
    if (this.inputElement) {
      this.inputElement.style.display = 'block';
      this.inputElement.value = '';
      this.inputElement.focus();
    }
  }

  close() {
    this.isOpen = false;
    if (this.inputElement) {
      this.inputElement.style.display = 'none';
      this.inputElement.blur();
    }
    // Return canvas focus
    if (this.game.canvas) this.game.canvas.focus();
  }

  sendCurrentText() {
    if (!this.inputElement) return;
    const txt = this.inputElement.value.trim();
    if (!txt) return;

    if (this.game.network && this.game.network.isMultiplayer) {
      this.game.network.sendChat(txt);
    } else {
      this.addMessage('You', txt);
    }
  }

  addMessage(sender, text) {
    this.messages.push({
      sender,
      text,
      time: performance.now(),
      ttl: 7.0 // visible for 7 seconds
    });

    if (this.messages.length > 8) {
      this.messages.shift();
    }

    this.renderHtmlLog();
  }

  renderHtmlLog() {
    const logEl = document.querySelector('#chat-log');
    if (!logEl) return;

    logEl.innerHTML = this.messages.map(m => `
      <div class="chat-msg-row">
        <span class="chat-author">${m.sender}:</span>
        <span class="chat-body">${m.text}</span>
      </div>
    `).join('');
  }

  update(dt) {
    let changed = false;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      this.messages[i].ttl -= dt;
      if (this.messages[i].ttl <= 0) {
        this.messages.splice(i, 1);
        changed = true;
      }
    }
    if (changed) this.renderHtmlLog();
  }

  applyStyles() {
    if (document.getElementById('chatbox-styles')) return;
    const style = document.createElement('style');
    style.id = 'chatbox-styles';
    style.textContent = `
      .game-chat-overlay {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 9000;
        width: 320px;
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .chat-log {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 8px;
      }
      .chat-msg-row {
        background: rgba(12, 10, 24, 0.75);
        border-left: 2px solid #ffd98a;
        padding: 3px 8px;
        border-radius: 0 4px 4px 0;
        font-size: 0.78rem;
        color: #f0e6df;
        line-height: 1.3;
        backdrop-filter: blur(4px);
        animation: chatFadeIn 0.2s ease-out;
      }
      @keyframes chatFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .chat-author {
        font-weight: bold;
        color: #ffd98a;
        margin-right: 6px;
      }
      .chat-input {
        pointer-events: auto;
        width: 100%;
        background: rgba(18, 15, 34, 0.9);
        border: 1px solid rgba(255, 217, 138, 0.4);
        border-radius: 4px;
        padding: 6px 10px;
        color: #fff;
        font-size: 0.8rem;
        outline: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .chat-input:focus {
        border-color: #ffd98a;
        box-shadow: 0 0 10px rgba(255, 217, 138, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}
