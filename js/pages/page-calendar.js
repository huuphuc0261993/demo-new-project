/**
 * page-calendar.js - FullCalendar view.
 */

/** Module-level calendar reference — updated on each render so showStaffModal can query live events */
let _calInstance = null;

/** Close staff schedule modal */
function closeStaffModal() {
  document.getElementById('staff-modal-overlay').style.display = 'none';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeStaffModal(); });

/** Show modal with all visits of a staff on a given date.
 *  Uses live FullCalendar events (reflects drag-and-drop) instead of raw schedule data. */
function showStaffModal(staffId, date) {
  const staffObj = DEMO_DATA.staff.find(s => s.id === staffId);
  if (!staffObj) return;

  // Query live events from calendar so dragged events use their new date
  const calEvents = _calInstance ? _calInstance.getEvents() : [];
  const visits = calEvents
    .filter(ev => {
      const p = ev.extendedProps;
      if (!p.staffId || p.staffId !== staffId) return false;
      const evDate = ev.start?.toISOString().slice(0, 10);
      return evDate === date;
    })
    .map(ev => {
      const start = ev.start?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '';
      const end   = ev.end?.toLocaleTimeString('ja-JP',   { hour: '2-digit', minute: '2-digit' }) || '';
      return { ...ev.extendedProps, start, end, startMs: ev.start?.getTime() || 0 };
    })
    .sort((a, b) => a.startMs - b.startMs);

  const shift = DEMO_DATA.shifts.find(sh => sh.staffId === staffId && sh.date === date && sh.onDuty);

  // Header
  const avatar = document.getElementById('modal-staff-avatar');
  avatar.textContent = staffObj.name[0];
  avatar.style.background = staffObj.color;
  document.getElementById('modal-staff-name').textContent = staffObj.name;
  document.getElementById('modal-staff-role').textContent = staffObj.role;

  // Body
  const shiftBar = shift
    ? `<div class="modal-shift-bar">🕐 シフト: ${shift.start} – ${shift.end}　|　${transportBadge(staffObj.transport)}</div>`
    : `<div class="modal-shift-bar">本日休み</div>`;

  const rows = visits.length
    ? visits.map((v, i) => `
          <div class="modal-visit-row">
            <div class="modal-visit-num" style="background:${staffObj.color}">${i + 1}</div>
            <div class="modal-visit-info">
              <div class="modal-visit-name">${v.patient}</div>
              <div class="modal-visit-time">${v.start} – ${v.end}　(${v.duration}分)</div>
            </div>
          </div>`).join('')
    : `<div class="modal-empty">この日の訪問はありません</div>`;

  document.getElementById('modal-body').innerHTML =
    `<div class="modal-date">📅 ${date}</div>${shiftBar}${rows}`;

  document.getElementById('staff-modal-overlay').style.display = 'flex';
}

const PageCalendar = {
  render(instance) {
    const r = AppState.scheduleResult;
    if (instance) instance.destroy();

    const events = r.assigned.map(a => ({
      title: `${a.task.patientName}`,
      start: `${a.task.date}T${a.start}`,
      end: `${a.task.date}T${a.end}`,
      backgroundColor: a.staffColor,
      borderColor: a.staffColor,
      extendedProps: { staffId: a.staffId, staffName: a.staffName, patient: a.task.patientName, transport: a.staffTransport, duration: a.task.duration, date: a.task.date },
    }));

    // Busy blocks shown as gray events
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
      buttonText: {
        today: '今日',
        month: '月',
        week: '週',
        day: '日',
      },
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth',
      },
      slotMinTime: '08:00:00', slotMaxTime: '19:00:00',
      allDaySlot: false,
      slotDuration: '00:30:00',
      events,
      height: 'auto',
      editable: true,
      eventContent(info) {
        const p = info.event.extendedProps;
        const start = info.event.start?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '';
        const end   = info.event.end?.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) || '';
        return { html: `
          <div class="fc-event-inner">
            <div class="fc-event-time-range">${start} – ${end}</div>
            <strong class="fc-event-staff-name">${p.staffName}</strong>
            <div class="fc-event-patient">${info.event.title}</div>
          </div>` };
      },
      eventClick(info) {
        const p = info.event.extendedProps;
        // Use actual event date (reflects drag-and-drop), not stored extendedProps.date
        const actualDate = info.event.start?.toISOString().slice(0, 10);
        if (p.staffId) showStaffModal(p.staffId, actualDate || p.date);
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
