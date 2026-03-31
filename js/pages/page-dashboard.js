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
        <div class="stat-label">日付</div>
        <div class="stat-value text-primary" style="font-size:18px">${AppState.selectedDate}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">出勤スタッフ</div>
        <div class="stat-value text-success">${onDuty}<span style="font-size:14px;color:var(--gray-500)"> / ${staff.length}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">総タスク数</div>
        <div class="stat-value">${r.tasks.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">割り当て済み</div>
        <div class="stat-value text-success">${r.assigned.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">未割り当て</div>
        <div class="stat-value ${r.unassigned.length > 0 ? 'text-danger' : 'text-success'}">${r.unassigned.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">患者数</div>
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
        <div class="card-title">スタッフ稼働状況</div>
        <div class="workload-grid">
          ${staff.map(s => {
            const l = load[s.id];
            const shift = DEMO_DATA.shifts.find(sh => sh.staffId === s.id && sh.date === AppState.selectedDate && sh.onDuty);
            if (!shift) return `<div class="workload-card off"><div class="wc-header"><span class="staff-dot" style="background:${s.color}"></span><strong>${s.name}</strong></div><div class="wc-off">本日休み</div></div>`;
            const pct = Math.min(Math.round((l.totalMin / 480) * 100), 100);
            return `<div class="workload-card">
              <div class="wc-header">
                <span class="staff-dot" style="background:${s.color}"></span>
                <strong>${s.name}</strong>
                <span style="margin-left:auto">${transportBadge(s.transport)}</span>
              </div>
              <div class="wc-row"><span>${l.count} 件</span><span>${Math.floor(l.totalMin/60)}時間${l.totalMin%60}分</span></div>
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
      const prioLabel = a.task.priority === 0 ? '特別' : a.task.priority === 1 ? '固定' : '時間帯';
      const prioClass = a.task.priority === 0 ? 'badge-red' : a.task.priority === 1 ? 'badge-blue' : 'badge-green';
      return `<tr>
        <td><strong>${a.start}</strong> – ${a.end}</td>
        <td>${a.task.patientName}</td>
        <td><span class="staff-dot" style="background:${a.staffColor}"></span>${a.staffName}</td>
        <td>${transportBadge(a.staffTransport)}</td>
        <td>${a.task.duration} 分</td>
        <td><span class="badge ${prioClass}">${prioLabel}</span></td>
      </tr>`;
    }).join('');

    const timelineEl = document.getElementById('dash-timeline');
    timelineEl.innerHTML = `
      <div class="card">
        <div class="card-title">本日のスケジュール</div>
        ${r.unassigned.length ? `<div class="alert-warn"><strong>${r.unassigned.length}</strong> 件未割り当て。 <a href="#" onclick="App.navigateTo('schedule');return false">詳細を見る</a></div>` : ''}
        <div class="table-wrap">
          <table>
            <thead><tr><th>時刻</th><th>患者</th><th>スタッフ</th><th>移動手段</th><th>所要時間</th><th>種別</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${pagerHTML(pg)}
      </div>`;

    wirePager(timelineEl, p => render(p));
  }

  return { render };
})();
