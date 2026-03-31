/**
 * page-calendar.js - FullCalendar view.
 * - Drag & drop enabled
 * - Patient name bold, staff name light in event
 * - Click event → booking info modal
 * - Click/drag empty slot → new booking modal
 */

let _calInstance = null;

// ── Booking info modal ────────────────────────────────────────────────────────

function closeStaffModal() {
  document.getElementById('staff-modal-overlay').style.display = 'none';
}

/** Show booking detail when clicking an event */
function showBookingModal(event) {
  const p = event.extendedProps;
  if (!p.staffId) return; // skip busy blocks

  const start = event.start?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '';
  const end   = event.end?.toLocaleTimeString('ja-JP',   { hour: '2-digit', minute: '2-digit' }) || '';
  const date  = event.start?.toISOString().slice(0, 10) || '';
  const staffObj = DEMO_DATA.staff.find(s => s.id === p.staffId);

  const avatar = document.getElementById('modal-staff-avatar');
  avatar.textContent    = event.title ? event.title[0] : '?';
  avatar.style.background = event.backgroundColor || '#6b7280';
  document.getElementById('modal-staff-name').textContent = event.title;
  document.getElementById('modal-staff-role').textContent = date;

  document.getElementById('modal-body').innerHTML = `
    <div class="mbi-row">
      <span class="mbi-label">スタッフ</span>
      <span>${staffObj
        ? `<span class="staff-dot" style="background:${staffObj.color}"></span>${staffObj.name}`
        : (p.staffName || '–')}</span>
    </div>
    <div class="mbi-row">
      <span class="mbi-label">時刻</span>
      <span style="font-family:monospace">${start} – ${end}</span>
    </div>
    <div class="mbi-row">
      <span class="mbi-label">所要時間</span>
      <span>${p.duration || '–'} 分</span>
    </div>
    <div class="mbi-row">
      <span class="mbi-label">移動手段</span>
      <span>${transportBadge(p.transport) || '–'}</span>
    </div>`;

  document.getElementById('staff-modal-overlay').style.display = 'flex';
}

// ── New booking modal ─────────────────────────────────────────────────────────

function closeBookingCreate() {
  document.getElementById('booking-create-overlay').style.display = 'none';
  if (_calInstance) _calInstance.unselect();
}

/** Open new booking form. date = 'YYYY-MM-DD', startTime/endTime = 'HH:MM' */
function showNewBookingModal(date, startTime, endTime) {
  document.getElementById('bc-date-label').textContent = date;
  document.getElementById('bc-start').value = startTime || '';
  document.getElementById('bc-end').value   = endTime   || '';
  document.getElementById('bc-error').textContent = '';

  // Patient options
  document.getElementById('bc-patient').innerHTML =
    `<option value="">-- 患者を選択 --</option>` +
    DEMO_DATA.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  // On-duty staff for that date
  const onDuty = DEMO_DATA.staff.filter(s =>
    DEMO_DATA.shifts.some(sh => sh.staffId === s.id && sh.date === date && sh.onDuty)
  );
  document.getElementById('bc-staff').innerHTML =
    `<option value="">-- スタッフを選択 --</option>` +
    onDuty.map(s => `<option value="${s.id}">${s.name}（${s.role}）</option>`).join('');

  document.getElementById('bc-confirm').onclick = () => _confirmNewBooking(date);
  document.getElementById('booking-create-overlay').style.display = 'flex';
}

function _confirmNewBooking(date) {
  const patientId = document.getElementById('bc-patient').value;
  const staffId   = document.getElementById('bc-staff').value;
  const startVal  = document.getElementById('bc-start').value;
  const endVal    = document.getElementById('bc-end').value;
  const errEl     = document.getElementById('bc-error');

  if (!patientId) { errEl.textContent = '患者を選択してください'; return; }
  if (!staffId)   { errEl.textContent = 'スタッフを選択してください'; return; }
  if (!startVal)  { errEl.textContent = '開始時刻を入力してください'; return; }
  if (!endVal)    { errEl.textContent = '終了時刻を入力してください'; return; }

  const startMin = Scheduler.timeToMin(startVal);
  const endMin   = Scheduler.timeToMin(endVal);
  if (endMin <= startMin) { errEl.textContent = '終了は開始より後にしてください'; return; }

  const patient  = DEMO_DATA.patients.find(p => p.id === patientId);
  const staffObj = DEMO_DATA.staff.find(s => s.id === staffId);
  if (!patient || !staffObj) return;

  // Add to schedule result so other pages reflect the new booking
  const fakeTask = {
    id: `manual-${Date.now()}`,
    patientId, patientName: patient.name,
    date, visitIndex: 1,
    timeKind: 'fixed', fixedStart: startMin,
    duration: endMin - startMin,
    priority: 1, facilityId: null,
    forcedStaff: null, ngStaff: [],
    lat: patient.lat, lng: patient.lng,
    category: patient.category, isSpecial: false,
  };
  AppState.scheduleResult.assigned.push({
    task: fakeTask, staffId,
    staffName: staffObj.name, staffColor: staffObj.color, staffTransport: staffObj.transport,
    start: startVal, end: endVal, startMin, endMin,
    travelMin: 0, distKm: '?', score: 0, manuallyCreated: true,
  });

  // Add event directly to calendar (no full re-render needed)
  if (_calInstance) {
    _calInstance.addEvent({
      title: patient.name,
      start: `${date}T${startVal}`, end: `${date}T${endVal}`,
      backgroundColor: staffObj.color, borderColor: staffObj.color,
      extendedProps: {
        staffId, staffName: staffObj.name,
        patient: patient.name, transport: staffObj.transport,
        duration: endMin - startMin, date,
      },
    });
  }

  closeBookingCreate();
  showToast(`${patient.name} のブッキングを追加しました`);
}

// Close modals on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeStaffModal(); closeBookingCreate(); if (typeof closePatientModal === 'function') closePatientModal(); }
});

// ── Calendar ──────────────────────────────────────────────────────────────────

const PageCalendar = {
  render(instance) {
    const r = AppState.scheduleResult;
    if (instance) instance.destroy();

    const events = r.assigned.map(a => ({
      title: a.task.patientName,
      start: `${a.task.date}T${a.start}`,
      end:   `${a.task.date}T${a.end}`,
      backgroundColor: a.staffColor, borderColor: a.staffColor,
      extendedProps: {
        staffId: a.staffId, staffName: a.staffName,
        patient: a.task.patientName, transport: a.staffTransport,
        duration: a.task.duration, date: a.task.date,
      },
    }));

    for (const b of DEMO_DATA.busyBlocks) {
      const staff = DEMO_DATA.staff.find(s => s.id === b.staffId);
      events.push({
        title: `[予定] ${b.title}`,
        start: `${b.date}T${b.start}`, end: `${b.date}T${b.end}`,
        backgroundColor: '#cbd5e1', borderColor: '#94a3b8', textColor: '#475569',
        extendedProps: { staffName: staff?.name || '' },
      });
    }

    const calEl = document.getElementById('calendar-container');
    const cal = new FullCalendar.Calendar(calEl, {
      initialView: 'timeGridWeek',
      initialDate: AppState.selectedDate,
      locale: 'ja',
      buttonText: { today: '今日', month: '月', week: '週', day: '日' },
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek,dayGridMonth' },
      slotMinTime: '08:00:00', slotMaxTime: '19:00:00',
      allDaySlot: false, slotDuration: '00:30:00',
      events, height: 'auto',
      // ROUTE: full edit allowed. Other systems (HOMIS/NURSEE): read-only
      editable: AppState.activeSystem === 'ROUTE',
      selectable: AppState.activeSystem === 'ROUTE',
      selectMirror: AppState.activeSystem === 'ROUTE',

      eventContent(info) {
        const p = info.event.extendedProps;
        const start = info.event.start?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '';
        const end   = info.event.end?.toLocaleTimeString('ja-JP',   { hour: '2-digit', minute: '2-digit' }) || '';
        return { html: `
          <div class="fc-event-inner">
            <div class="fc-event-time-range">${start} – ${end}</div>
            <strong class="fc-event-patient-name">${info.event.title}</strong>
            <div class="fc-event-staff-light">${p.staffName || ''}</div>
          </div>` };
      },

      // Click on event → booking info
      eventClick(info) {
        if (info.event.extendedProps.staffId) showBookingModal(info.event);
      },

      // Click or drag on empty slot → new booking
      select(info) {
        const date      = info.start.toISOString().slice(0, 10);
        const startTime = info.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime   = info.end.toLocaleTimeString('ja-JP',   { hour: '2-digit', minute: '2-digit', hour12: false });
        showNewBookingModal(date, startTime, endTime);
      },

      eventDrop(info) {
        const t = info.event.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        showToast(`${info.event.title} を ${t} に移動しました`);
      },
    });

    cal.render();
    _calInstance = cal;
    return cal;
  },
};
