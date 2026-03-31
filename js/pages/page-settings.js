/**
 * page-settings.js - Clinic info, integrations, and transport mode CRUD.
 */
const PageSettings = {
  render() {
    const { clinic } = DEMO_DATA;
    document.getElementById('settings-content').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-title">Base Clinic</div>
          <table>
            <tr><td class="setting-key">Name</td><td>${clinic.name}</td></tr>
            <tr><td class="setting-key">Address</td><td>${clinic.address}</td></tr>
            <tr>
              <td class="setting-key">Lat / Lng</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <input class="setting-input" id="clinic-lat" type="number" step="any" value="${clinic.lat}" style="width:110px">
                  <span style="color:var(--gray-400)">,</span>
                  <input class="setting-input" id="clinic-lng" type="number" step="any" value="${clinic.lng}" style="width:110px">
                  <button class="btn btn-primary" id="clinic-coords-save" style="font-size:12px;padding:5px 12px">Save</button>
                  <a id="clinic-map-link" href="https://www.google.com/maps?q=${clinic.lat},${clinic.lng}" target="_blank" style="font-size:12px;color:var(--primary)">View on map ↗</a>
                </div>
              </td>
            </tr>
            <tr><td class="setting-key">Phone</td><td>${clinic.phone}</td></tr>
            <tr><td class="setting-key">Data source</td><td><span class="badge badge-blue">${clinic.source}</span></td></tr>
          </table>
        </div>
        <div class="card">
          <div class="card-title">Facilities</div>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Address</th><th>Coordinates</th></tr></thead>
            <tbody>
              ${DEMO_DATA.facilities.map(f => `
                <tr>
                  <td style="color:var(--gray-500)">${f.id}</td>
                  <td><strong>${f.name}</strong></td>
                  <td>${f.address}</td>
                  <td class="facility-coords-cell" data-fid="${f.id}">
                    <div class="fac-coords-view" style="display:flex;align-items:center;gap:6px">
                      <span class="fac-coords-text" style="font-size:12px;color:var(--gray-600)">${f.lat.toFixed(4)}, ${f.lng.toFixed(4)}</span>
                      <button class="btn fac-coords-edit-btn" data-fid="${f.id}" style="font-size:11px;padding:2px 8px">Edit</button>
                    </div>
                    <div class="fac-coords-form" style="display:none;gap:4px;flex-wrap:wrap;align-items:center">
                      <input type="number" step="any" class="setting-input fac-lat" value="${f.lat}" style="width:100px;font-size:12px;padding:3px 6px">
                      <input type="number" step="any" class="setting-input fac-lng" value="${f.lng}" style="width:100px;font-size:12px;padding:3px 6px">
                      <button class="btn btn-primary fac-coords-save" data-fid="${f.id}" style="font-size:11px;padding:3px 9px">Save</button>
                      <button class="btn btn-outline fac-coords-cancel" style="font-size:11px;padding:3px 9px">Cancel</button>
                      <a href="https://www.google.com/maps?q=${f.lat},${f.lng}" target="_blank" class="fac-map-link" style="font-size:11px;color:var(--primary)">View ↗</a>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Integrations</div>
        <table>
          <thead><tr><th>System</th><th>Status</th><th>Data provided</th></tr></thead>
          <tbody>
            <tr>
              <td><span class="badge badge-blue">HOMIS</span></td>
              <td><span class="badge badge-green">Connected</span></td>
              <td>Staff / Patients (EMR) / Clinic info</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">NURSEE</span></td>
              <td><span class="badge badge-green">Connected</span></td>
              <td>Staff / Shift schedules</td>
            </tr>
            <tr>
              <td><span class="badge badge-gray">Google Maps API</span></td>
              <td><span class="badge badge-yellow">Demo Mode</span></td>
              <td>Travel time / Distance / Route optimization</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Transport CRUD -->
      <div class="settings-transport-wrap">
        <!-- Transport table -->
        <div class="card" style="flex:1;min-width:0">
          <div class="card-title">
            Transport Modes
            <button class="btn btn-outline" id="tp-add-btn" style="margin-left:auto;font-size:12px;padding:5px 12px">+ Add</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:100px">Key</th>
                  <th>Label</th>
                  <th style="width:120px">Speed (km/h)</th>
                  <th style="width:140px">Color</th>
                  <th style="width:72px"></th>
                </tr>
              </thead>
              <tbody id="transport-tbody">
                ${this._transportRows()}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add form panel (hidden by default) -->
        <div class="card tp-add-panel" id="tp-add-panel" style="display:none">
          <div class="card-title">New Transport Mode</div>

          <div class="tp-form-group">
            <label class="tp-form-lbl">Key <span class="tp-form-hint">(unique ID, no spaces)</span></label>
            <input class="setting-input" id="tp-new-key" placeholder="e.g. scooter">
          </div>

          <div class="tp-form-group">
            <label class="tp-form-lbl">Display label</label>
            <input class="setting-input" id="tp-new-label" placeholder="e.g. Scooter">
          </div>

          <div class="tp-form-group">
            <label class="tp-form-lbl">Average speed (km/h)</label>
            <input class="setting-input" id="tp-new-speed" type="number" min="1" max="300" placeholder="20">
          </div>

          <div class="tp-form-group">
            <label class="tp-form-lbl">Color</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="color" id="tp-new-color" value="#6366f1" class="tp-color-input" style="width:44px;height:36px">
              <span id="tp-new-preview" class="transport-chip">Preview</span>
            </div>
          </div>

          <div id="tp-add-error" class="tp-error"></div>

          <div class="tp-form-actions">
            <button class="btn btn-primary" id="tp-add-confirm">Add transport</button>
            <button class="btn btn-outline" id="tp-add-cancel">Cancel</button>
          </div>
        </div>
      </div>`;

    this._wireTransportEvents();
    this._wireClinicCoords();
  },

  _wireClinicCoords() {
    // Clinic save
    const saveBtn = document.getElementById('clinic-coords-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const lat = parseFloat(document.getElementById('clinic-lat').value);
        const lng = parseFloat(document.getElementById('clinic-lng').value);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          showToast('Invalid coordinates', 'error'); return;
        }
        DEMO_DATA.clinic.lat = lat;
        DEMO_DATA.clinic.lng = lng;
        const link = document.getElementById('clinic-map-link');
        if (link) link.href = `https://www.google.com/maps?q=${lat},${lng}`;
        AppState.refresh();
        showToast(`Clinic coordinates updated → ${lat}, ${lng}`);
      });
    }

    // Facilities inline edit
    const content = document.getElementById('settings-content');
    content.querySelectorAll('.fac-coords-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cell = btn.closest('.facility-coords-cell');
        cell.querySelector('.fac-coords-view').style.display = 'none';
        const form = cell.querySelector('.fac-coords-form');
        form.style.display = 'flex';
        form.querySelector('.fac-lat').focus();
      });
    });

    content.querySelectorAll('.fac-coords-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const cell = btn.closest('.facility-coords-cell');
        cell.querySelector('.fac-coords-view').style.display = 'flex';
        cell.querySelector('.fac-coords-form').style.display = 'none';
      });
    });

    content.querySelectorAll('.fac-coords-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const fid = btn.dataset.fid;
        const cell = btn.closest('.facility-coords-cell');
        const lat = parseFloat(cell.querySelector('.fac-lat').value);
        const lng = parseFloat(cell.querySelector('.fac-lng').value);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          showToast('Invalid coordinates', 'error'); return;
        }
        const facility = DEMO_DATA.facilities.find(f => f.id === fid);
        if (!facility) return;
        facility.lat = lat;
        facility.lng = lng;
        const mapLink = cell.querySelector('.fac-map-link');
        if (mapLink) mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
        cell.querySelector('.fac-coords-text').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        cell.querySelector('.fac-coords-view').style.display = 'flex';
        cell.querySelector('.fac-coords-form').style.display = 'none';
        AppState.refresh();
        showToast(`${facility.name} coordinates updated → ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
    });
  },

  _transportRows() {
    return Object.entries(Scheduler.TRANSPORTS).map(([k, t]) => `
      <tr data-key="${k}">
        <td><code class="tp-key-label">${k}</code></td>
        <td><input class="setting-input tp-label" data-key="${k}" value="${t.label}" style="width:130px"></td>
        <td><input class="setting-input tp-speed" data-key="${k}" type="number" min="1" max="300" value="${t.speed}" style="width:80px"></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" class="tp-color tp-color-input" data-key="${k}" value="${t.color}">
            <span class="transport-chip" data-transport="${k}" id="tp-chip-${k}">${t.label}</span>
          </div>
        </td>
        <td>
          <button class="btn tp-delete-btn" data-key="${k}">Delete</button>
        </td>
      </tr>`).join('');
  },

  _wireTransportEvents() {
    const self = this;
    const card = document.getElementById('settings-content');

    // Label change
    card.querySelectorAll('.tp-label').forEach(inp => {
      inp.addEventListener('change', () => {
        const k = inp.dataset.key;
        Scheduler.TRANSPORTS[k].label = inp.value.trim() || k;
        const chip = document.getElementById(`tp-chip-${k}`);
        if (chip) chip.textContent = Scheduler.TRANSPORTS[k].label;
        AppState.refresh();
        showToast(`"${k}" label updated`);
      });
    });

    // Speed change
    card.querySelectorAll('.tp-speed').forEach(inp => {
      inp.addEventListener('change', () => {
        const k = inp.dataset.key;
        const v = parseInt(inp.value);
        if (v > 0) { Scheduler.TRANSPORTS[k].speed = v; AppState.refresh(); showToast(`"${k}" speed → ${v} km/h`); }
      });
    });

    // Color change (live preview + save on done)
    card.querySelectorAll('.tp-color').forEach(inp => {
      inp.addEventListener('input', () => {
        const chip = document.getElementById(`tp-chip-${inp.dataset.key}`);
        if (chip) chip.style.outline = `2px solid ${inp.value}`;
      });
      inp.addEventListener('change', () => {
        Scheduler.TRANSPORTS[inp.dataset.key].color = inp.value;
        AppState.refresh();
        showToast(`"${inp.dataset.key}" color updated`);
      });
    });

    // Delete
    card.querySelectorAll('.tp-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (Object.keys(Scheduler.TRANSPORTS).length <= 1) {
          showToast('Must keep at least one transport mode', 'error'); return;
        }
        const fallback = Object.keys(Scheduler.TRANSPORTS).find(x => x !== k);
        let affected = 0;
        for (const s of DEMO_DATA.staff) {
          if (s.transport === k) { s.transport = fallback; affected++; }
        }
        delete Scheduler.TRANSPORTS[k];
        AppState.refresh();
        document.getElementById('transport-tbody').innerHTML = self._transportRows();
        self._wireTransportEvents();
        showToast(`"${k}" deleted${affected ? ` · ${affected} staff → "${fallback}"` : ''}`);
      });
    });

    // Show add panel
    document.getElementById('tp-add-btn').addEventListener('click', () => {
      document.getElementById('tp-add-panel').style.display = '';
      document.getElementById('tp-add-btn').style.display = 'none';
      document.getElementById('tp-new-key').focus();
    });

    // Live preview in add form
    const updatePreview = () => {
      const label = document.getElementById('tp-new-label')?.value || 'Preview';
      const color = document.getElementById('tp-new-color')?.value || '#6366f1';
      const prev = document.getElementById('tp-new-preview');
      if (prev) { prev.textContent = label || 'Preview'; prev.style.outline = `2px solid ${color}`; }
    };
    document.getElementById('tp-new-label')?.addEventListener('input', updatePreview);
    document.getElementById('tp-new-color')?.addEventListener('input', updatePreview);

    // Cancel add
    document.getElementById('tp-add-cancel').addEventListener('click', () => {
      document.getElementById('tp-add-panel').style.display = 'none';
      document.getElementById('tp-add-btn').style.display = '';
      document.getElementById('tp-add-error').textContent = '';
    });

    // Confirm add
    document.getElementById('tp-add-confirm').addEventListener('click', () => {
      const key   = document.getElementById('tp-new-key').value.trim().toLowerCase().replace(/\s+/g, '_');
      const label = document.getElementById('tp-new-label').value.trim();
      const speed = parseInt(document.getElementById('tp-new-speed').value);
      const color = document.getElementById('tp-new-color').value;
      const errEl = document.getElementById('tp-add-error');

      if (!key)                       { errEl.textContent = 'Key is required.'; return; }
      if (Scheduler.TRANSPORTS[key])  { errEl.textContent = `Key "${key}" already exists.`; return; }
      if (!label)                     { errEl.textContent = 'Label is required.'; return; }
      if (!speed || speed <= 0)       { errEl.textContent = 'Speed must be a positive number.'; return; }

      Scheduler.TRANSPORTS[key] = { label, speed, color };
      AppState.refresh();

      // Reset & close form
      ['tp-new-key','tp-new-label','tp-new-speed'].forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('tp-new-color').value = '#6366f1';
      errEl.textContent = '';
      document.getElementById('tp-add-panel').style.display = 'none';
      document.getElementById('tp-add-btn').style.display = '';

      document.getElementById('transport-tbody').innerHTML = self._transportRows();
      self._wireTransportEvents();
      showToast(`Transport "${label}" added`);
    });
  },
};
