/**
 * page-staff.js - Staff list with search, pagination, horizontal scroll, and weekly schedule editor.
 *
 * Layout:
 *   [Search bar]
 *   [← Staff cards · current page · horizontal scroll if needed →]
 *   [Pager: 1-10 of 12   ‹  1  2  ›]
 *   [Weekly schedule editor for selected staff]
 */
const PageStaff = (() => {
  let selectedStaffId = null;
  let staffPage = 1;
  let searchQuery = '';
  const PER_PAGE = 10;

  /** Filter staff by name or role. */
  function getFiltered() {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DEMO_DATA.staff;
    return DEMO_DATA.staff.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  }

  function render(page) {
    if (page !== undefined) staffPage = page;
    _initSearchBar();
    renderCards();
    renderWeeklyEditor();
  }

  /** Build the search bar once; subsequent calls preserve focus. */
  function _initSearchBar() {
    const el = document.getElementById('staff-search');
    if (el.hasChildNodes()) return;

    el.innerHTML = `
      <div class="staff-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--gray-400);flex-shrink:0">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="staff-search-input" placeholder="Search by name or role…" autocomplete="off">
        <span id="staff-search-count" class="staff-search-count"></span>
        <button id="staff-search-clear" class="staff-search-clear" style="display:none" title="Clear">✕</button>
      </div>`;

    document.getElementById('staff-search-input').addEventListener('input', e => {
      searchQuery = e.target.value;
      staffPage = 1;
      document.getElementById('staff-search-clear').style.display = searchQuery ? '' : 'none';
      renderCards();
    });

    document.getElementById('staff-search-clear').addEventListener('click', () => {
      searchQuery = '';
      staffPage = 1;
      document.getElementById('staff-search-input').value = '';
      document.getElementById('staff-search-clear').style.display = 'none';
      renderCards();
    });
  }

  /** Re-render cards for current page + update pager below. */
  function renderCards() {
    const filtered = getFiltered();
    const pg = paginate(filtered, staffPage, PER_PAGE);
    staffPage = pg.current;

    // Count badge
    const countEl = document.getElementById('staff-search-count');
    if (countEl) {
      countEl.textContent = searchQuery
        ? `${filtered.length} of ${DEMO_DATA.staff.length}`
        : `${DEMO_DATA.staff.length} staff`;
    }

    const cardsEl = document.getElementById('staff-cards');
    const pagerEl = document.getElementById('staff-pager');

    if (!filtered.length) {
      cardsEl.innerHTML = `<div class="staff-empty-msg">No staff match "<em>${searchQuery}</em>"</div>`;
      pagerEl.innerHTML = '';
      return;
    }

    const { shifts } = DEMO_DATA;
    cardsEl.innerHTML = pg.items.map(s => {
      const shift = shifts.find(sh => sh.staffId === s.id && sh.date === AppState.selectedDate && sh.onDuty);
      const assignedToday = (AppState.scheduleResult?.assigned || []).filter(a => a.staffId === s.id).length;
      const isSelected = s.id === selectedStaffId;
      return `
        <div class="staff-card ${isSelected ? 'sc-selected' : ''}" data-staff-id="${s.id}" style="border-top:4px solid ${s.color}; cursor:pointer">
          <div class="sc-header">
            <span class="staff-avatar" style="background:${s.color}">${s.name[0]}</span>
            <div style="min-width:0">
              <div class="sc-name">${s.name}</div>
              <div class="sc-role">${s.role}</div>
            </div>
            <div class="sc-today" style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
              ${shift ? '<span class="badge badge-green">On</span>' : '<span class="badge badge-gray">Off</span>'}
              ${s.source ? `<span class="badge ${s.source === 'HOMIS' ? 'badge-blue' : 'badge-purple'}" style="font-size:9px;padding:1px 5px">${s.source}</span>` : ''}
            </div>
          </div>
          <div class="sc-body">
            ${shift ? `<div class="sc-row"><span class="sc-key">Hours</span><span>${shift.start}–${shift.end}</span></div>` : ''}
            <div class="sc-row"><span class="sc-key">Visits</span><span>${assignedToday}</span></div>
            <div class="sc-row">
              <span class="sc-key">Transport</span>
              <select class="transport-select" data-staff-id="${s.id}" onclick="event.stopPropagation()">
                ${Object.entries(Scheduler.TRANSPORTS).map(([k, t]) =>
                  `<option value="${k}" ${k === s.transport ? 'selected' : ''}>${t.label}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="sc-edit-hint ${isSelected ? '' : 'muted'}">${isSelected ? 'Editing ↓' : 'Click to edit'}</div>
        </div>`;
    }).join('');

    // Pager below the scroll row
    pagerEl.innerHTML = pagerHTML(pg);
    wirePager(pagerEl, p => render(p));

    // Wire card click
    cardsEl.querySelectorAll('.staff-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedStaffId = card.dataset.staffId;
        renderCards();
        renderWeeklyEditor();
      });
    });

    // Wire transport change
    cardsEl.querySelectorAll('.transport-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const s = DEMO_DATA.staff.find(x => x.id === e.target.dataset.staffId);
        if (s) {
          s.transport = e.target.value;
          AppState.refresh();
          renderCards();
          showToast(`${s.name}: transport → ${Scheduler.TRANSPORTS[s.transport].label}`);
        }
      });
    });
  }

  function renderWeeklyEditor() {
    const container = document.getElementById('staff-shifts');

    if (!selectedStaffId) {
      container.innerHTML = `
        <div class="card" style="margin-top:8px; text-align:center; color:var(--gray-500); font-size:13px; padding:20px">
          Select a staff card above to edit their weekly schedule.
        </div>`;
      return;
    }

    const s = DEMO_DATA.staff.find(x => x.id === selectedStaffId);
    const schedule = AppState.weeklySchedules[selectedStaffId] || {};
    const DAYS = [
      { dow: 1, name: 'Mon' }, { dow: 2, name: 'Tue' }, { dow: 3, name: 'Wed' },
      { dow: 4, name: 'Thu' }, { dow: 5, name: 'Fri' }, { dow: 6, name: 'Sat' }, { dow: 0, name: 'Sun' },
    ];

    container.innerHTML = `
      <div class="card" style="margin-top:8px">
        <div class="card-title">
          <span class="staff-dot" style="background:${s.color}"></span>
          ${s.name} — Weekly Schedule
          <span style="font-size:11px;font-weight:400;color:var(--gray-500);margin-left:4px">Changes apply globally</span>
        </div>
        <div class="weekly-editor">
          ${DAYS.map(({ dow, name }) => {
            const d = schedule[dow] || { onDuty: false, start: '08:30', end: '17:30', breakStart: '12:00', breakEnd: '13:00' };
            return `
              <div class="we-day ${d.onDuty ? '' : 'we-off'}" data-dow="${dow}">
                <div class="we-day-name">${name}</div>
                <label class="toggle-switch">
                  <input type="checkbox" class="we-onduty" data-staff-id="${selectedStaffId}" data-dow="${dow}" ${d.onDuty ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <div class="we-status">${d.onDuty ? 'Working' : 'Day Off'}</div>
                <div class="we-times ${d.onDuty ? '' : 'we-hidden'}">
                  <div class="we-field">
                    <span class="we-lbl">Start</span>
                    <input type="time" class="we-time-input we-start" data-staff-id="${selectedStaffId}" data-dow="${dow}" value="${d.start}">
                  </div>
                  <div class="we-field">
                    <span class="we-lbl">End</span>
                    <input type="time" class="we-time-input we-end" data-staff-id="${selectedStaffId}" data-dow="${dow}" value="${d.end}">
                  </div>
                  <div class="we-field">
                    <span class="we-lbl">Break</span>
                    <input type="time" class="we-time-input we-break-start" data-staff-id="${selectedStaffId}" data-dow="${dow}" value="${d.breakStart}">
                    <span class="we-dash">–</span>
                    <input type="time" class="we-time-input we-break-end" data-staff-id="${selectedStaffId}" data-dow="${dow}" value="${d.breakEnd}">
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;

    container.querySelectorAll('.we-onduty').forEach(chk => {
      chk.addEventListener('change', () => {
        const sid = chk.dataset.staffId;
        const dow = +chk.dataset.dow;
        AppState.weeklySchedules[sid][dow].onDuty = chk.checked;
        AppState.refresh();
        render();
      });
    });

    container.querySelectorAll('.we-time-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const sid = inp.dataset.staffId;
        const dow = +inp.dataset.dow;
        const sched = AppState.weeklySchedules[sid][dow];
        if (inp.classList.contains('we-start'))            sched.start = inp.value;
        else if (inp.classList.contains('we-end'))         sched.end = inp.value;
        else if (inp.classList.contains('we-break-start')) sched.breakStart = inp.value;
        else if (inp.classList.contains('we-break-end'))   sched.breakEnd = inp.value;
        AppState.refresh();
        showToast(`${s.name}: schedule updated`);
      });
    });
  }

  return { render };
})();
