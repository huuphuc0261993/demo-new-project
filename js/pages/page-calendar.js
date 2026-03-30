/**
 * page-calendar.js - FullCalendar view.
 */
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
      extendedProps: { staffName: a.staffName, patient: a.task.patientName, transport: a.staffTransport, duration: a.task.duration },
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
      initialView: 'timeGridDay',
      initialDate: AppState.selectedDate,
      locale: 'ja',
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
        return { html: `<div class="fc-event-inner"><strong>${info.event.title}</strong><div class="fc-event-staff">${info.event.extendedProps.staffName}</div></div>` };
      },
      eventClick(info) {
        const p = info.event.extendedProps;
        showToast(`${p.patient || info.event.title} — ${p.staffName} (${p.duration || ''}分)`);
      },
      eventDrop(info) {
        const t = info.event.start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        showToast(`${info.event.title} を ${t} に移動しました`);
      },
    });
    cal.render();
    return cal;
  },
};
