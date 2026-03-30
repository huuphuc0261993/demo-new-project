/**
 * state.js - Shared singleton. All pages read/write through AppState.
 * Manages selected date, weekly schedules, and schedule results.
 */
const AppState = {
  selectedDate: '2026-03-30',
  scheduleResult: null,

  /** staffId → { 0..6: { onDuty, start, end, breakStart, breakEnd } } */
  weeklySchedules: {},

  /** Build weekly templates from existing DEMO_DATA.shifts */
  initWeeklySchedules() {
    for (const s of DEMO_DATA.staff) {
      this.weeklySchedules[s.id] = {};
      for (let d = 0; d <= 6; d++) {
        // Default: weekdays on, weekends off
        const isWeekend = (d === 0 || d === 6);
        this.weeklySchedules[s.id][d] = {
          onDuty: !isWeekend,
          start: '08:30', end: '17:30',
          breakStart: '12:00', breakEnd: '13:00',
        };
      }
    }
    // Override defaults with actual shift data from data.js
    for (const sh of DEMO_DATA.shifts) {
      const dow = new Date(sh.date).getDay();
      if (!this.weeklySchedules[sh.staffId]) continue;
      this.weeklySchedules[sh.staffId][dow] = {
        onDuty: sh.onDuty,
        start: sh.start || '08:30',
        end: sh.end || '17:30',
        breakStart: sh.breakStart || '12:00',
        breakEnd: sh.breakEnd || '13:00',
      };
    }
  },

  /** Regenerate DEMO_DATA.shifts for the week containing selectedDate */
  generateShiftsForWeek() {
    const date = new Date(this.selectedDate);
    const dow = date.getDay();
    // Anchor to Monday of the week (handle Sunday = 0)
    const monday = new Date(date);
    monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));

    const newShifts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();

      for (const s of DEMO_DATA.staff) {
        const tpl = this.weeklySchedules[s.id]?.[dayOfWeek];
        if (!tpl) continue;
        newShifts.push({
          staffId: s.id, date: dateStr,
          onDuty: tpl.onDuty,
          start: tpl.start, end: tpl.end,
          breakStart: tpl.breakStart, breakEnd: tpl.breakEnd,
        });
      }
    }
    DEMO_DATA.shifts = newShifts;
  },

  refresh() {
    this.generateShiftsForWeek();
    const { clinic, staff, patients, shifts, busyBlocks } = DEMO_DATA;
    this.scheduleResult = Scheduler.allocate(
      this.selectedDate, clinic, staff, patients, shifts, busyBlocks
    );
    const el = document.getElementById('global-date');
    if (el && el.value !== this.selectedDate) el.value = this.selectedDate;
  },

  setDate(date) {
    this.selectedDate = date;
    this.refresh();
  },
};
