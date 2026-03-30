/**
 * page-schedule.js - Assignment results page.
 * Each task card shows: assignment result prominently, feasible alternatives
 * as compact chips, and rejected candidates summarised by reason.
 */
const PageSchedule = (() => {
  let schedulePage = 1;
  const PER_PAGE = 10;

  function render(page) {
    if (page !== undefined) schedulePage = page;

    const r = AppState.scheduleResult;
    const allDetails = Object.values(r.assignmentDetails || {});
    const pg = paginate(allDetails, schedulePage, PER_PAGE);
    schedulePage = pg.current;

    let stepsHtml = '';
    pg.items.forEach((detail, i) => {
      const stepNum = pg.start + i + 1;
      const t = detail.task;
      const isAssigned = detail.chosen !== null;

      const prioLabel = t.priority === 0 ? 'Special' : t.priority === 1 ? 'Fixed' : 'Window';
      const prioClass = t.priority === 0 ? 'badge-red' : t.priority === 1 ? 'badge-blue' : 'badge-green';
      const facName = t.facilityId
        ? (DEMO_DATA.facilities.find(f => f.id === t.facilityId)?.name || t.facilityId)
        : null;

      // Time info
      const timeInfo = (t.timeKind === 'fixed' && t.fixedStart !== null)
        ? `<strong>${Scheduler.minToTime(t.fixedStart)}</strong> fixed`
        : `<span style="text-transform:uppercase;font-size:11px">${t.timeKind}</span>`;

      // ── Assignment result bar ──────────────────────────────────────────
      let resultHtml;
      if (isAssigned) {
        const c = detail.chosen;
        const staffObj = DEMO_DATA.staff.find(s => s.id === c.staffId);
        resultHtml = `
          <div class="sc-result sc-result-ok">
            <span class="sc-result-icon">✓</span>
            <span class="staff-dot" style="background:${staffObj?.color||'#ccc'}"></span>
            <span class="sc-winner-name">${c.staffName}</span>
            ${transportBadge(c.transport)}
            <span class="sc-divider">|</span>
            <span class="sc-time">${Scheduler.minToTime(c.slotStart)} – ${Scheduler.minToTime(c.slotEnd)}</span>
            <span class="sc-divider">|</span>
            <span class="sc-travel">Travel ${c.travelFromPrev} min</span>
            <span class="sc-divider">|</span>
            <span class="sc-score">Score <strong>${Math.round(c.score)}</strong></span>
          </div>`;
      } else {
        // Find why it was unassigned
        const unassignedEntry = r.unassigned.find(u => u.task.id === t.id);
        resultHtml = `
          <div class="sc-result sc-result-ng">
            <span class="sc-result-icon">✗</span>
            <span class="sc-unassigned-reason">${unassignedEntry?.reason || 'No available staff'}</span>
          </div>`;
      }

      // ── Candidates summary ─────────────────────────────────────────────
      const feasible = detail.candidates.filter(c => c.feasible).sort((a, b) => a.score - b.score);
      const alternatives = isAssigned ? feasible.slice(1) : feasible; // exclude chosen
      const rejected = detail.candidates.filter(c => !c.feasible);

      // Group rejected by reason
      const rejectGroups = {};
      for (const c of rejected) {
        const label = REASON_LABELS[c.reason] || c.reason || 'Unknown';
        rejectGroups[label] = (rejectGroups[label] || 0) + 1;
      }
      const rejectSummary = Object.entries(rejectGroups)
        .map(([label, n]) => `${n}× ${label}`)
        .join('  ·  ');

      const altHtml = alternatives.length ? `
        <div class="sc-alternatives">
          <span class="sc-alt-label">Also feasible:</span>
          ${alternatives.map(c => {
            const staffObj = DEMO_DATA.staff.find(s => s.id === c.staffId);
            return `<span class="sc-alt-chip">
              <span class="staff-dot sm" style="background:${staffObj?.color||'#ccc'}"></span>
              ${c.staffName}
              <span class="sc-alt-score">${Math.round(c.score)}</span>
            </span>`;
          }).join('')}
        </div>` : '';

      const rejectHtml = rejectSummary ? `
        <div class="sc-reject-tally">
          <span class="sc-reject-label">Not feasible (${rejected.length}):</span>
          ${rejectSummary}
        </div>` : '';

      stepsHtml += `
        <div class="sc-card ${isAssigned ? 'sc-assigned' : 'sc-unassigned'}">
          <div class="sc-card-header">
            <span class="sc-step ${isAssigned ? 'ok' : 'ng'}">${stepNum}</span>
            <div class="sc-task-info">
              <strong>${t.patientName}</strong>
              ${t.visitIndex > 1 ? `<span class="visit-index">V${t.visitIndex}</span>` : ''}
              <span class="badge ${prioClass}">${prioLabel}</span>
              ${facName ? `<span class="sc-facility">⊞ ${facName}</span>` : ''}
            </div>
            <div class="sc-task-meta">
              ${timeInfo}&nbsp; ${t.duration} min
            </div>
          </div>
          ${resultHtml}
          ${altHtml || rejectHtml ? `<div class="sc-candidates-summary">${altHtml}${rejectHtml}</div>` : ''}
        </div>`;
    });

    const stepsEl = document.getElementById('schedule-steps');
    stepsEl.innerHTML = `
      <div class="sc-page-header">
        <div class="sc-stats-row">
          <span class="sc-stat ok">✓ Assigned <strong>${r.assigned.length}</strong></span>
          ${r.unassigned.length ? `<span class="sc-stat ng">✗ Unassigned <strong>${r.unassigned.length}</strong></span>` : ''}
          <span class="sc-stat neutral">${allDetails.length} tasks total</span>
        </div>
        <div class="sc-formula-hint">Score = prevTravel + nextTravel + gapBefore×0.1 + gapAfter×0.1</div>
      </div>
      ${stepsHtml}
      ${pagerHTML(pg)}`;

    wirePager(stepsEl, p => render(p));

    // Unassigned panel
    document.getElementById('schedule-unassigned').innerHTML = r.unassigned.length ? `
      <div class="unassigned-panel">
        <div class="title">Unassigned (${r.unassigned.length})</div>
        ${r.unassigned.map(u => `
          <div class="unassigned-item">
            <strong>${u.task.patientName}</strong>
            <span class="visit-index">V${u.task.visitIndex}</span>
            <div class="reason">${u.reason}</div>
          </div>`).join('')}
      </div>` : `<div class="success-msg">All tasks assigned successfully.</div>`;
  }

  return { render };
})();
