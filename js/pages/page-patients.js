/**
 * page-patients.js - Patient list with add / edit / disable.
 * Disabled patients are excluded from new schedule runs but existing bookings are preserved.
 */
const PagePatients = (() => {
  let patientPage = 1;
  let filterSearch = '';
  let showDisabled = false;
  const PER_PAGE = 10;

  // ── Filter ────────────────────────────────────────────────────────────────
  function _applyFilters(patients) {
    let list = showDisabled ? patients : patients.filter(p => !p.disabled);
    if (!filterSearch) return list;
    const q = filterSearch.toLowerCase();
    return list.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render(page) {
    if (page !== undefined) patientPage = page;

    const { patients, facilities, clinic } = DEMO_DATA;
    const DOW = ['日', '月', '火', '水', '木', '金', '土'];

    const filtered = _applyFilters(patients);
    const pg = paginate(filtered, patientPage, PER_PAGE);
    patientPage = pg.current;

    const totalActive   = patients.filter(p => !p.disabled).length;
    const totalDisabled = patients.filter(p =>  p.disabled).length;

    const rows = pg.items.map(p => {
      const fac    = p.facilityId ? (facilities.find(f => f.id === p.facilityId)?.name || p.facilityId) : '–';
      const forced = p.forcedStaff ? (DEMO_DATA.staff.find(s => s.id === p.forcedStaff)?.name || p.forcedStaff) : '–';
      const ng     = p.ngStaff.length ? p.ngStaff.map(id => DEMO_DATA.staff.find(s => s.id === id)?.name || id).join(', ') : '–';
      const days   = p.visits.map(v => v.dayOfWeek.map(d => DOW[d]).join(', ')).join('; ');
      const dist   = Scheduler.estimateDistance(clinic.lat, clinic.lng, p.lat, p.lng);
      const catClass = p.category === '医療' ? 'badge-blue' : 'badge-green';
      const displaySrc = AppState.activeSystem === 'ROUTE' ? 'ROUTE' : (p.source || '–');
      const srcClass   = AppState.activeSystem === 'ROUTE' ? 'badge-yellow'
                       : p.source === 'HOMIS' ? 'badge-blue' : 'badge-purple';
      const disabledClass = p.disabled ? ' patient-row-disabled' : '';
      const disabledBadge = p.disabled ? ' <span class="badge badge-gray">無効</span>' : '';
      return `<tr data-pid="${p.id}" class="${disabledClass}">
        <td style="color:var(--gray-500)">${p.id}</td>
        <td><strong>${p.name}</strong>${disabledBadge}</td>
        <td><span class="badge ${catClass}">${p.category}</span></td>
        <td><span class="badge ${srcClass}">${displaySrc}</span></td>
        <td>${fac}</td>
        <td>${forced !== '–' ? `<span style="color:var(--primary)">${forced}</span>` : '–'}</td>
        <td>${ng !== '–' ? `<span style="color:var(--danger)">${ng}</span>` : '–'}</td>
        <td>${days}</td>
        <td>${dist ? dist.toFixed(1) + ' km' : '–'}</td>
        <td style="white-space:nowrap">
          <button class="btn pt-action-btn pt-edit-btn" data-pid="${p.id}" style="font-size:11px;padding:2px 8px;margin-right:4px">編集</button>
          <button class="btn pt-action-btn pt-disable-btn ${p.disabled ? 'btn-outline-danger' : 'btn-outline'}" data-pid="${p.id}" style="font-size:11px;padding:2px 8px">
            ${p.disabled ? '有効化' : '無効化'}
          </button>
        </td>
      </tr>`;
    }).join('');

    const emptyRow = filtered.length === 0
      ? `<tr><td colspan="10" style="text-align:center;color:var(--gray-400);padding:24px">患者が見つかりません</td></tr>`
      : '';

    const listEl = document.getElementById('patients-list');
    listEl.innerHTML = `
      <div class="card">
        <div class="card-title" style="flex-wrap:wrap;gap:10px">
          <span>患者一覧 <span style="font-size:13px;color:var(--gray-500);font-weight:400">(有効 ${totalActive}名${totalDisabled ? ` / 無効 ${totalDisabled}名` : ''})</span></span>
          <div style="display:flex;gap:8px;align-items:center;margin-left:auto;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;white-space:nowrap">
              <input type="checkbox" id="show-disabled-toggle" ${showDisabled ? 'checked' : ''} style="cursor:pointer">
              無効患者を表示
            </label>
            <div style="position:relative">
              <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:14px;pointer-events:none">⌕</span>
              <input id="patient-search" type="text" value="${filterSearch}"
                placeholder="氏名 / ID で検索…"
                style="height:32px;border:1px solid var(--gray-200);border-radius:6px;padding:0 10px 0 28px;font-size:13px;width:190px;outline:none">
            </div>
            <button class="btn btn-primary" id="btn-add-patient" style="font-size:13px;padding:6px 14px;white-space:nowrap">＋ 新規患者</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>氏名</th><th>カテゴリ</th><th>ソース</th><th>施設</th>
                <th>担当固定</th><th>NG スタッフ</th><th>訪問曜日</th>
                <th>距離</th><th>操作</th>
              </tr>
            </thead>
            <tbody>${rows || emptyRow}</tbody>
          </table>
        </div>
        ${pagerHTML(pg)}
      </div>`;

    _wireEvents(listEl);
    wirePager(listEl, p => render(p));
  }

  function _wireEvents(container) {
    // Search
    let debounce;
    container.querySelector('#patient-search')?.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        filterSearch = e.target.value.trim();
        patientPage = 1;
        render();
      }, 250);
    });

    // Show disabled toggle
    container.querySelector('#show-disabled-toggle')?.addEventListener('change', e => {
      showDisabled = e.target.checked;
      patientPage = 1;
      render();
    });

    // Add patient
    container.querySelector('#btn-add-patient')?.addEventListener('click', () => openPatientModal(null));

    // Edit
    container.querySelectorAll('.pt-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = DEMO_DATA.patients.find(x => x.id === btn.dataset.pid);
        if (p) openPatientModal(p);
      });
    });

    // Disable / Enable
    container.querySelectorAll('.pt-disable-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = DEMO_DATA.patients.find(x => x.id === btn.dataset.pid);
        if (!p) return;
        // Also update _allPatients so the flag persists across system switches
        const allP = AppState._allPatients?.find(x => x.id === p.id);
        const next = !p.disabled;
        p.disabled = next;
        if (allP) allP.disabled = next;
        AppState.refresh();
        showToast(next ? `${p.name} を無効化しました` : `${p.name} を有効化しました`);
        render();
      });
    });
  }

  // ── Patient modal ─────────────────────────────────────────────────────────
  let _editingPatientId = null;

  function openPatientModal(patient) {
    _editingPatientId = patient ? patient.id : null;
    const isNew = !patient;

    const allStaff = AppState._allStaff || DEMO_DATA.staff;
    const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

    // Default visit values
    const v = patient?.visits?.[0] || { dayOfWeek: [1, 3, 5], timesPerDay: 1, preferredTimes: ['09:00'], durations: [60], timeKind: 'fixed' };

    const staffOptions = allStaff.map(s =>
      `<option value="${s.id}">${s.name}（${s.role}）</option>`
    ).join('');

    const dowChecks = [0,1,2,3,4,5,6].map(d =>
      `<label style="display:flex;align-items:center;gap:3px;cursor:pointer">
        <input type="checkbox" name="dow" value="${d}" ${v.dayOfWeek.includes(d) ? 'checked' : ''}>
        ${DOW_LABELS[d]}
      </label>`
    ).join('');

    const ngChecks = allStaff.map(s =>
      `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap">
        <input type="checkbox" name="ng-staff" value="${s.id}" ${(patient?.ngStaff || []).includes(s.id) ? 'checked' : ''}>
        ${s.name}
      </label>`
    ).join('');

    document.getElementById('pm-title').textContent  = isNew ? '新規患者登録' : '患者情報の編集';
    document.getElementById('pm-id-label').textContent = isNew ? '（新規）' : `ID: ${patient.id}`;

    document.getElementById('pm-body').innerHTML = `
      <div class="bc-field">
        <label class="bc-lbl">氏名 <span style="color:var(--danger)">*</span></label>
        <input id="pm-name" type="text" class="setting-input" style="width:100%" value="${patient?.name || ''}" placeholder="例: 山田 太郎">
      </div>
      <div style="display:flex;gap:12px">
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">カテゴリ</label>
          <select id="pm-category" class="setting-input" style="width:100%">
            <option value="医療" ${(patient?.category || '医療') === '医療' ? 'selected' : ''}>医療</option>
            <option value="介護" ${patient?.category === '介護' ? 'selected' : ''}>介護</option>
          </select>
        </div>
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">ソース</label>
          <select id="pm-source" class="setting-input" style="width:100%">
            <option value="HOMIS" ${(patient?.source || 'HOMIS') === 'HOMIS' ? 'selected' : ''}>HOMIS</option>
            <option value="NURSEE" ${patient?.source === 'NURSEE' ? 'selected' : ''}>NURSEE</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:12px">
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">緯度 (lat) <span style="color:var(--danger)">*</span></label>
          <input id="pm-lat" type="number" step="any" class="setting-input" style="width:100%" value="${patient?.lat || ''}" placeholder="35.9513">
        </div>
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">経度 (lng) <span style="color:var(--danger)">*</span></label>
          <input id="pm-lng" type="number" step="any" class="setting-input" style="width:100%" value="${patient?.lng || ''}" placeholder="139.9756">
        </div>
      </div>
      <div class="bc-field">
        <label class="bc-lbl">担当固定スタッフ</label>
        <select id="pm-forced" class="setting-input" style="width:100%">
          <option value="">なし</option>
          ${staffOptions}
        </select>
      </div>
      <div class="bc-field">
        <label class="bc-lbl">NG スタッフ</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;border:1px solid var(--gray-200);border-radius:6px;padding:8px 10px">
          ${ngChecks}
        </div>
      </div>
      <div class="bc-field">
        <label class="bc-lbl">訪問曜日</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px 10px">
          ${dowChecks}
        </div>
      </div>
      <div style="display:flex;gap:12px">
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">時間帯</label>
          <select id="pm-timekind" class="setting-input" style="width:100%" onchange="document.getElementById('pm-fixedtime-row').style.display=this.value==='fixed'?'':'none'">
            <option value="fixed" ${v.timeKind === 'fixed' ? 'selected' : ''}>時刻固定</option>
            <option value="am"    ${v.timeKind === 'am'    ? 'selected' : ''}>午前</option>
            <option value="pm"    ${v.timeKind === 'pm'    ? 'selected' : ''}>午後</option>
            <option value="any"   ${v.timeKind === 'any'   ? 'selected' : ''}>任意</option>
          </select>
        </div>
        <div class="bc-field" style="flex:1">
          <label class="bc-lbl">所要時間（分）</label>
          <input id="pm-duration" type="number" min="5" max="240" class="setting-input" style="width:100%" value="${v.durations?.[0] || 60}">
        </div>
      </div>
      <div id="pm-fixedtime-row" class="bc-field" style="${v.timeKind !== 'fixed' ? 'display:none' : ''}">
        <label class="bc-lbl">希望時刻</label>
        <input id="pm-preferred-time" type="time" class="setting-input" value="${v.preferredTimes?.[0] || '09:00'}">
      </div>
      <div id="pm-error" style="color:var(--danger);font-size:12px;margin-top:4px;min-height:18px"></div>
      <div class="bc-actions">
        <button class="btn btn-primary" id="pm-save">保存</button>
        <button class="btn btn-outline" onclick="closePatientModal()">キャンセル</button>
      </div>`;

    // Set forced staff selection
    const forcedEl = document.getElementById('pm-forced');
    if (forcedEl && patient?.forcedStaff) forcedEl.value = patient.forcedStaff;

    document.getElementById('pm-save').onclick = _savePatient;
    document.getElementById('patient-modal-overlay').style.display = 'flex';
  }

  function closePatientModal() {
    document.getElementById('patient-modal-overlay').style.display = 'none';
    _editingPatientId = null;
  }

  function _savePatient() {
    const name     = document.getElementById('pm-name').value.trim();
    const category = document.getElementById('pm-category').value;
    const source   = document.getElementById('pm-source').value;
    const lat      = parseFloat(document.getElementById('pm-lat').value);
    const lng      = parseFloat(document.getElementById('pm-lng').value);
    const forced   = document.getElementById('pm-forced').value || null;
    const timeKind = document.getElementById('pm-timekind').value;
    const duration = parseInt(document.getElementById('pm-duration').value, 10) || 60;
    const prefTime = document.getElementById('pm-preferred-time')?.value || '09:00';
    const errEl    = document.getElementById('pm-error');

    const ngStaff = [...document.querySelectorAll('input[name="ng-staff"]:checked')].map(el => el.value);
    const dayOfWeek = [...document.querySelectorAll('input[name="dow"]:checked')].map(el => parseInt(el.value, 10));

    if (!name)                                     { errEl.textContent = '氏名を入力してください'; return; }
    if (isNaN(lat) || lat < -90 || lat > 90)       { errEl.textContent = '有効な緯度を入力してください'; return; }
    if (isNaN(lng) || lng < -180 || lng > 180)     { errEl.textContent = '有効な経度を入力してください'; return; }
    if (dayOfWeek.length === 0)                    { errEl.textContent = '訪問曜日を1日以上選択してください'; return; }
    if (duration < 5 || duration > 240)            { errEl.textContent = '所要時間は5〜240分で入力してください'; return; }

    const visit = {
      dayOfWeek, timesPerDay: 1,
      preferredTimes: [timeKind === 'fixed' ? prefTime : null],
      durations: [duration],
      timeKind,
    };

    if (_editingPatientId) {
      // Edit existing
      const p = DEMO_DATA.patients.find(x => x.id === _editingPatientId);
      const allP = AppState._allPatients?.find(x => x.id === _editingPatientId);
      if (!p) return;
      const fields = { name, category, source, lat, lng, forcedStaff: forced, ngStaff, visits: [visit] };
      Object.assign(p, fields);
      if (allP) Object.assign(allP, fields);
      showToast(`${name} の情報を更新しました`);
    } else {
      // New patient — generate unique ID
      const allIds = (AppState._allPatients || DEMO_DATA.patients).map(x => x.id);
      let newId;
      let counter = (AppState._allPatients || DEMO_DATA.patients).length + 1;
      do { newId = `P${String(counter).padStart(3, '0')}`; counter++; } while (allIds.includes(newId));

      const newPatient = {
        id: newId, name, category, source,
        address: '', lat, lng,
        facilityId: null, forcedStaff: forced, ngStaff,
        visits: [visit],
        cancelPeriod: null, specialPeriod: null,
        disabled: false,
      };
      DEMO_DATA.patients.push(newPatient);
      if (AppState._allPatients) AppState._allPatients.push(newPatient);
      showToast(`${name} を追加しました（ID: ${newId}）`);
    }

    AppState.refresh();
    closePatientModal();
    render();
  }

  // Expose close function globally for inline onclick
  window.closePatientModal = closePatientModal;

  return { render };
})();
