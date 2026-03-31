/**
 * page-patients.js - Patient list with search, pagination (10/page).
 * Source filtering is handled globally via AppState.setSystem().
 * Supports inline lat/lng editing per patient.
 */
const PagePatients = (() => {
  let patientPage = 1;
  let filterSearch = '';
  const PER_PAGE = 10;

  function _applyFilters(patients) {
    if (!filterSearch) return patients;
    const q = filterSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }

  function render(page) {
    if (page !== undefined) patientPage = page;

    const { patients, facilities, clinic } = DEMO_DATA;
    const DOW = ['日', '月', '火', '水', '木', '金', '土'];

    const filtered = _applyFilters(patients);
    const pg = paginate(filtered, patientPage, PER_PAGE);
    patientPage = pg.current;

    const rows = pg.items.map(p => {
      const fac = p.facilityId ? (facilities.find(f => f.id === p.facilityId)?.name || p.facilityId) : '–';
      const forced = p.forcedStaff ? (DEMO_DATA.staff.find(s => s.id === p.forcedStaff)?.name || p.forcedStaff) : '–';
      const ng = p.ngStaff.length ? p.ngStaff.map(id => DEMO_DATA.staff.find(s => s.id === id)?.name || id).join(', ') : '–';
      const days = p.visits.map(v => v.dayOfWeek.map(d => DOW[d]).join(', ')).join('; ');
      const dist = Scheduler.estimateDistance(clinic.lat, clinic.lng, p.lat, p.lng);
      const special = p.specialPeriod ? `${p.specialPeriod.start} – ${p.specialPeriod.end}` : '–';
      const catClass = p.category === '医療' ? 'badge-blue' : 'badge-green';
      const srcClass = p.source === 'HOMIS' ? 'badge-blue' : 'badge-purple';
      return `<tr data-pid="${p.id}">
        <td style="color:var(--gray-500)">${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge ${catClass}">${p.category}</span></td>
        <td><span class="badge ${srcClass}">${p.source || '–'}</span></td>
        <td>${fac}</td>
        <td>${forced !== '–' ? `<span style="color:var(--primary)">${forced}</span>` : '–'}</td>
        <td>${ng !== '–' ? `<span style="color:var(--danger)">${ng}</span>` : '–'}</td>
        <td>${days}</td>
        <td>${dist ? dist.toFixed(1) + ' km' : '–'}</td>
        <td class="patient-coords-cell">
          <div class="coords-view" style="display:flex;align-items:center;gap:6px;white-space:nowrap">
            <span class="coords-text" style="font-size:12px;color:var(--gray-600)">${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</span>
            <button class="btn coords-edit-btn" data-pid="${p.id}" style="font-size:11px;padding:2px 8px">編集</button>
          </div>
          <div class="coords-edit-form" style="display:none;gap:4px;flex-wrap:wrap;align-items:center">
            <input type="number" step="any" class="setting-input coords-lat" value="${p.lat}" style="width:100px;font-size:12px;padding:3px 6px">
            <input type="number" step="any" class="setting-input coords-lng" value="${p.lng}" style="width:100px;font-size:12px;padding:3px 6px">
            <button class="btn btn-primary coords-save-btn" data-pid="${p.id}" style="font-size:11px;padding:3px 9px">保存</button>
            <button class="btn btn-outline coords-cancel-btn" style="font-size:11px;padding:3px 9px">キャンセル</button>
            <a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" class="coords-map-link" style="font-size:11px;color:var(--primary);white-space:nowrap">View ↗</a>
          </div>
        </td>
        <td>${special !== '–' ? `<span class="badge badge-red">${special}</span>` : '–'}</td>
      </tr>`;
    }).join('');

    const emptyRow = filtered.length === 0
      ? `<tr><td colspan="11" style="text-align:center;color:var(--gray-400);padding:24px">患者が見つかりません</td></tr>`
      : '';

    const listEl = document.getElementById('patients-list');
    listEl.innerHTML = `
      <div class="card">
        <div class="card-title" style="flex-wrap:wrap;gap:10px">
          <span>患者一覧 (${filtered.length}${filtered.length !== patients.length ? ` / ${patients.length}` : ''})</span>
          <div style="display:flex;gap:8px;align-items:center;margin-left:auto">
            <div style="position:relative">
              <span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:14px;pointer-events:none">⌕</span>
              <input id="patient-search" type="text" value="${filterSearch}"
                placeholder="氏名 / ID で検索…"
                style="height:32px;border:1px solid var(--gray-200);border-radius:6px;padding:0 10px 0 28px;font-size:13px;width:190px;outline:none">
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>氏名</th><th>カテゴリ</th><th>ソース</th><th>施設</th>
                <th>担当固定</th><th>NG スタッフ</th><th>訪問曜日</th>
                <th>距離</th><th>座標</th><th>特別期間</th>
              </tr>
            </thead>
            <tbody>${rows || emptyRow}</tbody>
          </table>
        </div>
        ${pagerHTML(pg)}
      </div>`;

    _wireFilterEvents(listEl);
    wirePager(listEl, p => render(p));
    _wireCoordsEvents(listEl);
  }

  function _wireFilterEvents(container) {
    let debounce;
    container.querySelector('#patient-search')?.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        filterSearch = e.target.value.trim();
        patientPage = 1;
        render();
      }, 250);
    });
  }

  function _wireCoordsEvents(container) {
    container.querySelectorAll('.coords-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cell = btn.closest('.patient-coords-cell');
        cell.querySelector('.coords-view').style.display = 'none';
        const form = cell.querySelector('.coords-edit-form');
        form.style.display = 'flex';
        form.querySelector('.coords-lat').focus();
      });
    });

    container.querySelectorAll('.coords-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cell = btn.closest('.patient-coords-cell');
        cell.querySelector('.coords-view').style.display = 'flex';
        cell.querySelector('.coords-edit-form').style.display = 'none';
      });
    });

    container.querySelectorAll('.coords-save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pid;
        const cell = btn.closest('.patient-coords-cell');
        const lat = parseFloat(cell.querySelector('.coords-lat').value);
        const lng = parseFloat(cell.querySelector('.coords-lng').value);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          showToast('座標が無効です', 'error'); return;
        }
        const patient = DEMO_DATA.patients.find(p => p.id === pid);
        if (!patient) return;
        patient.lat = lat;
        patient.lng = lng;
        const mapLink = cell.querySelector('.coords-map-link');
        if (mapLink) mapLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
        cell.querySelector('.coords-text').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        cell.querySelector('.coords-view').style.display = 'flex';
        cell.querySelector('.coords-edit-form').style.display = 'none';
        AppState.refresh();
        showToast(`${patient.name} の座標を更新しました → ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
    });
  }

  return { render };
})();
