// SettingsModal.js - 7-Tab Reactive Settings Menu with Instant Application
import { I18n } from '../../core/i18n/I18n.js';
import { Settings } from '../../core/settingsManager/SettingsManager.js';
import { Saves } from '../../core/saveManager/SaveManager.js';

export class SettingsModal {
  constructor(menuManager, game) {
    this.menuManager = menuManager;
    this.game = game;
    this.activeTab = 'gameplay';
    this.element = null;
  }

  create() {
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-modal-backdrop';

    backdrop.innerHTML = `
      <div class="menu-window" style="max-width: 620px;">
        <div class="menu-title-row">
          <div class="menu-title-text">
            <span>⚙️</span>
            <span>${I18n.t('settings_title')}</span>
          </div>
          <button class="menu-close-btn" aria-label="Close">✕</button>
        </div>

        <div class="settings-tabs-row">
          <button class="settings-tab-btn ${this.activeTab === 'gameplay' ? 'active' : ''}" data-tab="gameplay">${I18n.t('tab_gameplay')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'video' ? 'active' : ''}" data-tab="video">${I18n.t('tab_video')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'audio' ? 'active' : ''}" data-tab="audio">${I18n.t('tab_audio')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'controls' ? 'active' : ''}" data-tab="controls">${I18n.t('tab_controls')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'accessibility' ? 'active' : ''}" data-tab="accessibility">${I18n.t('tab_accessibility')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'language' ? 'active' : ''}" data-tab="language">${I18n.t('tab_language')}</button>
          <button class="settings-tab-btn ${this.activeTab === 'data' ? 'active' : ''}" data-tab="data">${I18n.t('tab_data')}</button>
        </div>

        <div id="settings-tab-content" class="settings-group">
          <!-- Rendered dynamically -->
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
          <button class="menu-btn btn-modal-close" style="min-height: 38px; padding: 8px 18px;">
            ${I18n.t('btn_close')}
          </button>
        </div>
      </div>
    `;

    this.element = backdrop;
    this.renderTab(this.activeTab);
    this.bindEvents();
    return backdrop;
  }

  renderTab(tabName) {
    this.activeTab = tabName;
    const content = this.element.querySelector('#settings-tab-content');
    if (!content) return;

    // Update active tab buttons
    this.element.querySelectorAll('.settings-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });

    switch (tabName) {
      case 'gameplay':
        content.innerHTML = this.renderGameplayTab();
        break;
      case 'video':
        content.innerHTML = this.renderVideoTab();
        break;
      case 'audio':
        content.innerHTML = this.renderAudioTab();
        break;
      case 'controls':
        content.innerHTML = this.renderControlsTab();
        break;
      case 'accessibility':
        content.innerHTML = this.renderAccessibilityTab();
        break;
      case 'language':
        content.innerHTML = this.renderLanguageTab();
        break;
      case 'data':
        content.innerHTML = this.renderDataTab();
        break;
    }

    this.bindTabInputs(content);
    this.menuManager.updateFocusables();
  }

  renderGameplayTab() {
    const diff = Settings.get('difficulty') || 'Normal';
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('difficulty_label')}</div>
          <div class="setting-desc">Adjust enemy health, aggression and damage</div>
        </div>
        <select id="set-difficulty">
          <option value="Gentle" ${diff === 'Gentle' ? 'selected' : ''}>Gentle</option>
          <option value="Normal" ${diff === 'Normal' ? 'selected' : ''}>Normal</option>
          <option value="Hard" ${diff === 'Hard' ? 'selected' : ''}>Hard</option>
          <option value="Nightmare" ${diff === 'Nightmare' ? 'selected' : ''}>Nightmare</option>
        </select>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('aim_assist')}</div>
          <div class="setting-desc">Subtly magnetize projectiles towards nearby foes</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-aimAssist" ${Settings.get('aimAssist') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('auto_save')}</div>
          <div class="setting-desc">Automatically persist progress when touching Shrines</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-autoSave" ${Settings.get('autoSave') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('camera_lookahead')}</div>
          <div class="setting-desc">Offset view ahead in the direction of travel</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-cameraLookahead" ${Settings.get('cameraLookahead') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('damage_numbers')}</div>
          <div class="setting-desc">Display floating critical and hit numbers in combat</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-damageNumbers" ${Settings.get('damageNumbers') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('screen_shake')}</div>
          <div class="setting-desc">Intensity of impact shakes (${Math.round(Settings.get('screenShake') * 100)}%)</div>
        </div>
        <input type="range" id="set-screenShake" min="0" max="1.5" step="0.1" value="${Settings.get('screenShake')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('hit_stop')}</div>
          <div class="setting-desc">Micro-freeze duration on heavy strikes (${Math.round(Settings.get('hitStop') * 100)}%)</div>
        </div>
        <input type="range" id="set-hitStop" min="0" max="1.5" step="0.1" value="${Settings.get('hitStop')}" />
      </div>
    `;
  }

  renderVideoTab() {
    const q = Settings.get('qualityPreset') || 'High';
    const fps = Settings.get('fpsCap') || 60;
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('quality_preset')}</div>
          <div class="setting-desc">One-click visual fidelity profile</div>
        </div>
        <select id="set-qualityPreset">
          <option value="Low" ${q === 'Low' ? 'selected' : ''}>Low</option>
          <option value="Medium" ${q === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="High" ${q === 'High' ? 'selected' : ''}>High</option>
          <option value="Ultra" ${q === 'Ultra' ? 'selected' : ''}>Ultra</option>
        </select>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('fullscreen')}</div>
          <div class="setting-desc">Toggle browser window fullscreen mode</div>
        </div>
        <button id="btn-toggle-fullscreen" class="menu-btn" style="min-height: 32px; padding: 4px 12px; font-size: 12px;">Toggle</button>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('fps_cap')}</div>
          <div class="setting-desc">Limit refresh loop rate</div>
        </div>
        <select id="set-fpsCap">
          <option value="30" ${fps === 30 ? 'selected' : ''}>30 FPS</option>
          <option value="60" ${fps === 60 ? 'selected' : ''}>60 FPS</option>
          <option value="120" ${fps === 120 ? 'selected' : ''}>120 FPS</option>
          <option value="0" ${fps === 0 ? 'selected' : ''}>Unlimited</option>
        </select>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('show_fps')}</div>
          <div class="setting-desc">Display live performance meter in HUD</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-showFps" ${Settings.get('showFps') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('brightness')}</div>
          <div class="setting-desc">Canvas lumina adjustment (${Math.round(Settings.get('brightness') * 100)}%)</div>
        </div>
        <input type="range" id="set-brightness" min="0.7" max="1.3" step="0.05" value="${Settings.get('brightness')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('bloom_glow')}</div>
          <div class="setting-desc">Soft radial illumination on lanterns & shrines</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-bloom" ${Settings.get('bloom') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('film_grain')}</div>
          <div class="setting-desc">Atmospheric subtle dusk noise</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-filmGrain" ${Settings.get('filmGrain') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('vignette')}</div>
          <div class="setting-desc">Shadow border around screen edges</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-vignette" ${Settings.get('vignette') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  renderAudioTab() {
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('mute_all')}</div>
          <div class="setting-desc">Silence all game sound output</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-muted" ${Settings.get('muted') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('mute_on_blur')}</div>
          <div class="setting-desc">Auto-mute when browser tab loses focus</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-muteOnBlur" ${Settings.get('muteOnBlur') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('master_vol')}</div>
          <div class="setting-desc">${Math.round(Settings.get('masterVolume') * 100)}%</div>
        </div>
        <input type="range" id="set-masterVolume" min="0" max="1" step="0.05" value="${Settings.get('masterVolume')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('music_vol')}</div>
          <div class="setting-desc">${Math.round(Settings.get('musicVolume') * 100)}%</div>
        </div>
        <input type="range" id="set-musicVolume" min="0" max="1" step="0.05" value="${Settings.get('musicVolume')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('sfx_vol')}</div>
          <div class="setting-desc">${Math.round(Settings.get('sfxVolume') * 100)}%</div>
        </div>
        <input type="range" id="set-sfxVolume" min="0" max="1" step="0.05" value="${Settings.get('sfxVolume')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('ui_vol')}</div>
          <div class="setting-desc">${Math.round(Settings.get('uiVolume') * 100)}%</div>
        </div>
        <input type="range" id="set-uiVolume" min="0" max="1" step="0.05" value="${Settings.get('uiVolume')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('test_audio')}</div>
          <div class="setting-desc">Play sample chime to test levels</div>
        </div>
        <button id="btn-test-audio" class="menu-btn" style="min-height: 32px; padding: 4px 14px; font-size: 12px;">Chime 🔔</button>
      </div>
    `;
  }

  renderControlsTab() {
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('controls_rebind_title')}</div>
          <div class="setting-desc">Customize keyboard action bindings</div>
        </div>
        <button id="btn-open-rebind" class="menu-btn" style="min-height: 34px; padding: 6px 14px; font-size: 13px;">Rebind Keys ⌨️</button>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('controls_deadzone')}</div>
          <div class="setting-desc">Gamepad analog stick threshold (${Math.round(Settings.get('gamepadDeadzone') * 100)}%)</div>
        </div>
        <input type="range" id="set-gamepadDeadzone" min="0.05" max="0.4" step="0.02" value="${Settings.get('gamepadDeadzone')}" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('controls_vibration')}</div>
          <div class="setting-desc">Controller rumble on combat impacts</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-gamepadVibration" ${Settings.get('gamepadVibration') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('controls_touch_size')}</div>
          <div class="setting-desc">Mobile on-screen button scale</div>
        </div>
        <select id="set-touchSize">
          <option value="small" ${Settings.get('touchSize') === 'small' ? 'selected' : ''}>Small</option>
          <option value="medium" ${Settings.get('touchSize') === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="large" ${Settings.get('touchSize') === 'large' ? 'selected' : ''}>Large</option>
        </select>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('controls_touch_opacity')}</div>
          <div class="setting-desc">Mobile controls transparency (${Math.round(Settings.get('touchOpacity') * 100)}%)</div>
        </div>
        <input type="range" id="set-touchOpacity" min="0.2" max="1" step="0.05" value="${Settings.get('touchOpacity')}" />
      </div>
    `;
  }

  renderAccessibilityTab() {
    const cb = Settings.get('colorblindMode') || 'none';
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('colorblind_mode')}</div>
          <div class="setting-desc">Color palette tuning for vision variations</div>
        </div>
        <select id="set-colorblindMode">
          <option value="none" ${cb === 'none' ? 'selected' : ''}>None</option>
          <option value="protanopia" ${cb === 'protanopia' ? 'selected' : ''}>Protanopia</option>
          <option value="deuteranopia" ${cb === 'deuteranopia' ? 'selected' : ''}>Deuteranopia</option>
          <option value="tritanopia" ${cb === 'tritanopia' ? 'selected' : ''}>Tritanopia</option>
        </select>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('toggle_pulse')}</div>
          <div class="setting-desc">Press key once to toggle lantern pulse on/off</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-togglePulse" ${Settings.get('togglePulse') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('toggle_aura')}</div>
          <div class="setting-desc">Tap once to begin Sovereign's Aura charge</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-toggleAura" ${Settings.get('toggleAura') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('reduced_flashing')}</div>
          <div class="setting-desc">Cap light strobe frequency below 3 Hz</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-reducedFlashing" ${Settings.get('reducedFlashing') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('reduce_motion')}</div>
          <div class="setting-desc">Dampen parallax and background sway animations</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="set-reduceMotion" ${Settings.get('reduceMotion') ? 'checked' : ''} />
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  renderLanguageTab() {
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">Language / Idioma / Langue</div>
          <div class="setting-desc">Select game display text</div>
        </div>
        <select id="set-language">
          <option value="en" selected>English</option>
        </select>
      </div>
    `;
  }

  renderDataTab() {
    return `
      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('export_save')}</div>
          <div class="setting-desc">Download save slots as a JSON file</div>
        </div>
        <button id="btn-export-save" class="menu-btn" style="min-height: 32px; padding: 4px 14px; font-size: 12px;">Export 💾</button>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('import_save')}</div>
          <div class="setting-desc">Upload and restore saved data</div>
        </div>
        <button id="btn-import-save" class="menu-btn" style="min-height: 32px; padding: 4px 14px; font-size: 12px;">Import 📂</button>
        <input type="file" id="file-import-save" accept=".json" style="display: none;" />
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('reset_settings')}</div>
          <div class="setting-desc">Revert all preferences to default values</div>
        </div>
        <button id="btn-reset-settings" class="menu-btn" style="min-height: 32px; padding: 4px 14px; font-size: 12px;">Reset</button>
      </div>

      <div class="setting-item">
        <div>
          <div class="setting-label">${I18n.t('reset_progress')}</div>
          <div class="setting-desc">Erase all 3 save slots</div>
        </div>
        <button id="btn-reset-progress" class="menu-btn btn-danger" style="min-height: 32px; padding: 4px 14px; font-size: 12px;">Clear Saves</button>
      </div>
    `;
  }

  bindTabInputs(container) {
    // Selects
    container.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', () => {
        const key = sel.id.replace('set-', '');
        let val = sel.value;
        if (key === 'fpsCap') val = parseInt(val, 10);
        Settings.set(key, val);
        this.menuManager.showToast(`Updated ${key}`);
      });
    });

    // Checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.id.replace('set-', '');
        Settings.set(key, chk.checked);
      });
    });

    // Range Sliders
    container.querySelectorAll('input[type="range"]').forEach(rng => {
      rng.addEventListener('input', () => {
        const key = rng.id.replace('set-', '');
        Settings.set(key, parseFloat(rng.value));
      });
    });

    // Fullscreen button
    const fsBtn = container.querySelector('#btn-toggle-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Audio test
    const testAudioBtn = container.querySelector('#btn-test-audio');
    if (testAudioBtn && this.game && this.game.audio) {
      testAudioBtn.addEventListener('click', () => {
        this.game.audio.playAudioTest();
      });
    }

    // Open rebind modal
    const rebindBtn = container.querySelector('#btn-open-rebind');
    if (rebindBtn) {
      rebindBtn.addEventListener('click', () => {
        this.game.openControlsRebindModal();
      });
    }

    // Quality Preset change
    const presetSel = container.querySelector('#set-qualityPreset');
    if (presetSel) {
      presetSel.addEventListener('change', () => {
        Settings.applyPreset(presetSel.value);
        this.renderTab('video');
      });
    }

    // Export save
    const expBtn = container.querySelector('#btn-export-save');
    if (expBtn) {
      expBtn.addEventListener('click', () => {
        const json = Saves.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lumen_hollow_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.menuManager.showToast("Save file exported!");
      });
    }

    // Import save
    const impBtn = container.querySelector('#btn-import-save');
    const impFile = container.querySelector('#file-import-save');
    if (impBtn && impFile) {
      impBtn.addEventListener('click', () => impFile.click());
      impFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (Saves.importJSON(evt.target.result)) {
            this.menuManager.showToast("Save data restored successfully!");
          } else {
            alert("Invalid save file format.");
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset settings
    const resetSetBtn = container.querySelector('#btn-reset-settings');
    if (resetSetBtn) {
      resetSetBtn.addEventListener('click', () => {
        if (confirm("Reset all settings to default values?")) {
          Settings.resetToDefaults();
          this.renderTab(this.activeTab);
          this.menuManager.showToast("Settings reset to default.");
        }
      });
    }

    // Reset progress
    const resetProgBtn = container.querySelector('#btn-reset-progress');
    if (resetProgBtn) {
      resetProgBtn.addEventListener('click', () => {
        if (confirm(I18n.t('confirm_reset_progress'))) {
          Saves.clearAll();
          this.menuManager.showToast("All progress cleared.");
        }
      });
    }
  }

  bindEvents() {
    const close = () => {
      this.menuManager.playClickSound();
      this.menuManager.popModal();
    };

    this.element.querySelector('.menu-close-btn').addEventListener('click', close);
    this.element.querySelector('.btn-modal-close').addEventListener('click', close);

    this.element.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.menuManager.playClickSound();
        this.renderTab(btn.dataset.tab);
      });
    });
  }
}
