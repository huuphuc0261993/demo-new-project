/**
 * page-dashboard.js - Dashboard overview page (timeline paginated).
 */
const PageDashboard = (() => {
  let timelinePage = 1;
  const PER_PAGE = 10;

  function render(page) {
    if (page !== undefined) timelinePage = page;

    const r = AppState.scheduleResult;
    const { staff, patients } = DEMO_DATA;
    const onDuty = DEMO_DATA.shifts.filter(s => s.date === AppState.selectedDate && s.onDuty).length;

    // Stats row
    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Date</div>
        <div class="stat-value text-primary" style="font-size:18px">${AppState.selectedDate}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Staff on duty</div>
        <div class="stat-value text-success">${onDuty}<span style="font-size:14px;color:var(--gray-500)"> / ${staff.length}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total tasks</div>
        <div class="stat-value">${r.tasks.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Assigned</div>
        <div class="stat-value text-success">${r.assigned.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unassigned</div>
        <div class="stat-value ${r.unassigned.length > 0 ? 'text-danger' : 'text-success'}">${r.unassigned.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Patients</div>
        <div class="stat-value">${patients.length}</div>
      </div>
    `;

    // Workload per staff (always show all — typically small)
    const load = {};
    for (const s of staff) load[s.id] = { ...s, count: 0, totalMin: 0 };
    for (const a of r.assigned) {
      if (load[a.staffId]) { load[a.staffId].count++; load[a.staffId].totalMin += (a.endMin - a.startMin); }
    }

    document.getElementById('dash-workload').innerHTML = `
      <div class="card">
        <div class="card-title">Staff Workload</div>
        <div class="workload-grid">
          ${staff.map(s => {
            const l = load[s.id];
            const shift = DEMO_DATA.shifts.find(sh => sh.staffId === s.id && sh.date === AppState.selectedDate && sh.onDuty);
            if (!shift) return `<div class="workload-card off"><div class="wc-header"><span class="staff-dot" style="background:${s.color}"></span><strong>${s.name}</strong></div><div class="wc-off">Off today</div></div>`;
            const pct = Math.min(Math.round((l.totalMin / 480) * 100), 100);
            return `<div class="workload-card">
              <div class="wc-header">
                <span class="staff-dot" style="background:${s.color}"></span>
                <strong>${s.name}</strong>
                <span style="margin-left:auto">${transportBadge(s.transport)}</span>
              </div>
              <div class="wc-row"><span>${l.count} visits</span><span>${Math.floor(l.totalMin/60)}h ${l.totalMin%60}m</span></div>
              <div class="wc-bar">
                <div class="wc-bar-fill" style="width:${pct}%;background:${pct>80?'var(--danger)':pct>50?'var(--warning)':'var(--success)'}"></div>
              </div>
              <div class="wc-shift">${shift.start} – ${shift.end}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    // Today timeline — paginated
    const sorted = [...r.assigned].sort((a, b) => a.startMin - b.startMin);
    const pg = paginate(sorted, timelinePage, PER_PAGE);
    timelinePage = pg.current;

    const rows = pg.items.map(a => {
      const prioLabel = a.task.priority === 0 ? 'Special' : a.task.priority === 1 ? 'Fixed' : 'Window';
      const prioClass = a.task.priority === 0 ? 'badge-red' : a.task.priority === 1 ? 'badge-blue' : 'badge-green';
      return `<tr>
        <td><strong>${a.start}</strong> – ${a.end}</td>
        <td>${a.task.patientName}</td>
        <td><span class="staff-dot" style="background:${a.staffColor}"></span>${a.staffName}</td>
        <td>${transportBadge(a.staffTransport)}</td>
        <td>${a.task.duration} min</td>
        <td><span class="badge ${prioClass}">${prioLabel}</span></td>
      </tr>`;
    }).join('');

    const timelineEl = document.getElementById('dash-timeline');
    timelineEl.innerHTML = `
      <div class="card">
        <div class="card-title">Today's Schedule</div>
        ${r.unassigned.length ? `<div class="alert-warn"><strong>${r.unassigned.length}</strong> visit(s) unassigned. <a href="#" onclick="App.navigateTo('schedule');return false">View details</a></div>` : ''}
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Staff</th><th>Transport</th><th>Duration</th><th>Type</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${pagerHTML(pg)}
      </div>`;

    wirePager(timelineEl, p => render(p));
  }

  return { render };
})();
