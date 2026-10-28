import { PHYSICS } from '../core/Constants.js';

export class TuningPanel {
  constructor() {
    this.visible = false;
    this.container = null;
    this.createDomElements();
  }

  toggle() {
    this.visible = !this.visible;
    if (this.container) {
      this.container.style.display = this.visible ? 'flex' : 'none';
    }
  }

  createDomElements() {
    // Check if panel already exists
    let panel = document.getElementById('debug-tuning-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'debug-tuning-panel';
      panel.style.position = 'fixed';
      panel.style.top = '12px';
      panel.style.right = '12px';
      panel.style.width = '260px';
      panel.style.background = 'rgba(18, 14, 32, 0.94)';
      panel.style.border = '1px solid #ffd98a';
      panel.style.borderRadius = '8px';
      panel.style.padding = '12px';
      panel.style.color = '#f4f1ff';
      panel.style.fontFamily = '-apple-system, sans-serif';
      panel.style.fontSize = '11px';
      panel.style.zIndex = '9999';
      panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
      panel.style.display = 'none';
      panel.style.flexDirection = 'column';
      panel.style.gap = '8px';
      panel.style.userSelect = 'none';

      // Header
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.borderBottom = '1px solid rgba(255,217,138,0.3)';
      header.style.paddingBottom = '6px';
      header.innerHTML = '<strong style="color:#ffd98a;font-size:12px;">PHYSICS TUNING (F2)</strong>';

      const closeBtn = document.createElement('button');
      closeBtn.innerText = '✕';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.color = '#ffd98a';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '12px';
      closeBtn.onclick = () => this.toggle();
      header.appendChild(closeBtn);
      panel.appendChild(header);

      const items = [
        { label: 'Jump Power', key: 'JUMP_FORCE', min: -550, max: -250, step: 5, mult: -1 },
        { label: 'Double Jump', key: 'DOUBLE_JUMP_FORCE', min: -500, max: -200, step: 5, mult: -1 },
        { label: 'Gravity Up', key: 'GRAVITY_UP', min: 250, max: 1000, step: 10 },
        { label: 'Gravity Down', key: 'GRAVITY_DOWN', min: 500, max: 1500, step: 10 },
        { label: 'Run Speed', key: 'MOVE_SPEED', min: 80, max: 240, step: 5 },
        { label: 'Glide Speed', key: 'GLIDE_FALL_SPEED', min: 30, max: 150, step: 5 },
        { label: 'Wall Slide', key: 'WALL_SLIDE_SPEED', min: 30, max: 150, step: 5 },
        { label: 'Dash Speed', key: 'DASH_SPEED', min: 200, max: 600, step: 10 },
        { label: 'Friction / Decel', key: 'DECELERATION', min: 400, max: 2000, step: 20 }
      ];

      for (const item of items) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '2px';

        const labelRow = document.createElement('div');
        labelRow.style.display = 'flex';
        labelRow.style.justifyContent = 'space-between';

        const lbl = document.createElement('span');
        lbl.innerText = item.label;
        lbl.style.color = '#a288e3';

        const val = document.createElement('span');
        val.style.fontWeight = 'bold';
        val.style.color = '#ffd98a';
        const currentVal = item.mult ? PHYSICS[item.key] * item.mult : PHYSICS[item.key];
        val.innerText = currentVal;

        labelRow.appendChild(lbl);
        labelRow.appendChild(val);
        row.appendChild(labelRow);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = item.min;
        slider.max = item.max;
        slider.step = item.step;
        slider.value = PHYSICS[item.key];
        slider.style.width = '100%';
        slider.style.cursor = 'pointer';

        slider.oninput = (e) => {
          const num = parseFloat(e.target.value);
          PHYSICS[item.key] = num;
          val.innerText = item.mult ? num * item.mult : num;
        };

        row.appendChild(slider);
        panel.appendChild(row);
      }

      document.body.appendChild(panel);
      this.container = panel;
    } else {
      this.container = panel;
    }
  }

  update(input) {
    if (input.actions.f2JustPressed) {
      this.toggle();
    }
  }
}
