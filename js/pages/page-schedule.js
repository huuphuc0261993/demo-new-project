/**
 * page-schedule.js - Assignment results page.
 * Layout: stats bar → tasks grouped by staff → unassigned panel with manual/force assignment.
 *
 * Force assign: only available for auto-unassigned tasks, bypasses time/conflict constraints.
 * Displayed with a distinct 強制 badge to distinguish from normal assignments.
 */
const PageSchedule = (() => {
  // Track pending staff selections: taskId → staffId
  const _pending = {};

  function render() {
    const r = AppState.scheduleResult;
    const { staff, shifts } = DEMO_DATA;
    const date = AppState.selectedDate;
    const totalTasks = Object.keys(r.assignmentDetails || {}).length;

    // ── Stats bar ─────────────────────────────────────────────────────────
    const statsHtml = `
      <div class="sc-page-header">
        <div class="sc-stats-row">
          <span class="sc-stat ok">✓ 割り当て済み <strong>${r.assigned.length}</strong></span>
          ${r.unassigned.length ? `<span class="sc-stat ng">✗ 未割り当て <strong>${r.unassigned.length}</strong></span>` : ''}
          <span class="sc-stat neutral">${totalTasks} 件合計</span>
        </div>
      </div>`;

    // ── Group assigned tasks by staffId ───────────────────────────────────
    const byStaff = {};
    for (const a of r.assigned) {
      if (!byStaff[a.staffId]) byStaff[a.staffId] = [];
      byStaff[a.staffId].push(a);
    }

    const assignedGroups = staff
      .filter(s => byStaff[s.id]?.length)
      .map(s => {
        const visits = [...byStaff[s.id]].sort((a, b) => a.startMin - b.startMin);
        const shift = shifts.find(sh => sh.staffId === s.id && sh.date === date && sh.onDuty);
        return `
          <div class="sc-staff-group">
            <div class="sc-sg-header">
              <span class="staff-avatar sc-sg-avatar" style="background:${s.color}">${s.name[0]}</span>
              <div class="sc-sg-name-wrap">
                <span class="sc-sg-name">${s.name}</span>
                <span class="sc-sg-role">${s.role}</span>
              </div>
              ${transportBadge(s.transport)}
              ${shift ? `<span class="sc-sg-shift">🕐 ${shift.start}–${shift.end}</span>` : ''}
              <span class="badge badge-blue sc-sg-count">${visits.length} 件</span>
            </div>
            <div class="sc-sg-visits">
              ${visits.map((a, i) => {
                const prioLabel = a.task.priority === 0 ? '特別' : a.task.priority === 1 ? '固定' : '時間帯';
                const prioClass = a.task.priority === 0 ? 'badge-red' : a.task.priority === 1 ? 'badge-blue' : 'badge-green';
                return `
                  <div class="sc-vr ${a.forceAssigned ? 'sc-vr-forced' : ''}">
                    <span class="sc-vr-num" style="background:${s.color}">${i + 1}</span>
                    <span class="sc-vr-time">${a.start} – ${a.end}</span>
                    <span class="sc-vr-name">${a.task.patientName}</span>
                    ${a.task.visitIndex > 1 ? `<span class="visit-index">V${a.task.visitIndex}</span>` : ''}
                    <span class="badge ${prioClass}">${prioLabel}</span>
                    ${a.forceAssigned ? `<span class="badge sc-force-badge">強制</span>` : ''}
                    <span class="sc-vr-dur">${a.task.duration}分</span>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('');

    document.getElementById('schedule-steps').innerHTML =
      statsHtml + (assignedGroups || `<div class="sc-empty">割り当て済みのタスクはありません</div>`);

    // ── Unassigned panel ──────────────────────────────────────────────────
    if (!r.unassigned.length) {
      document.getElementById('schedule-unassigned').innerHTML =
        `<div class="success-msg">すべてのタスクが割り当て済みです。</div>`;
      return;
    }

    // Only on-duty staff as options
    const onDutyStaff = staff.filter(s =>
      shifts.some(sh => sh.staffId === s.id && sh.date === date && sh.onDuty)
    );
    const staffOptions = onDutyStaff
      .map(s => `<option value="${s.id}">${s.name}（${s.role}）</option>`)
      .join('');

    document.getElementById('schedule-unassigned').innerHTML = `
      <div class="sc-ua-panel">
        <div class="sc-ua-title">未割り当て (${r.unassigned.length})</div>
        ${r.unassigned.map(u => {
          const t = u.task;
          const prioLabel = t.priority === 0 ? '特別' : t.priority === 1 ? '固定' : '時間帯';
          const prioClass = t.priority === 0 ? 'badge-red' : t.priority === 1 ? 'badge-blue' : 'badge-green';
          const timeInfo = t.timeKind === 'fixed' && t.fixedStart !== null
            ? `${Scheduler.minToTime(t.fixedStart)} 固定`
            : t.timeKind.toUpperCase();
          return `
            <div class="sc-ua-item">
              <div class="sc-ua-info">
                <strong>${t.patientName}</strong>
                ${t.visitIndex > 1 ? `<span class="visit-index">V${t.visitIndex}</span>` : ''}
                <span class="badge ${prioClass}">${prioLabel}</span>
                <span class="sc-ua-meta">${timeInfo} · ${t.duration}分</span>
              </div>
              <div class="sc-ua-reason">⚠ ${u.reason}</div>
              <div class="sc-ua-assign-row">
                <select class="sc-ua-staff-select setting-input" data-task-id="${t.id}">
                  <option value="">-- スタッフを選択 --</option>
                  ${staffOptions}
                </select>
                <span class="sc-ua-validation" data-task-id="${t.id}"></span>
                <button class="btn btn-primary sc-ua-assign-btn" data-task-id="${t.id}" disabled>割り当て</button>
                <button class="btn sc-ua-force-btn" data-task-id="${t.id}" style="display:none">⚡ 強制割り当て</button>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    _wireManualAssign(r);
  }

  /** Wire live validation on select change, assign + force-assign on button click */
  function _wireManualAssign(r) {
    document.querySelectorAll('.sc-ua-staff-select').forEach(sel => {
      const saved = _pending[sel.dataset.taskId];
      if (saved) sel.value = saved;

      sel.addEventListener('change', () => {
        const taskId  = sel.dataset.taskId;
        const staffId = sel.value;
        const validEl  = document.querySelector(`.sc-ua-validation[data-task-id="${taskId}"]`);
        const assignBtn = document.querySelector(`.sc-ua-assign-btn[data-task-id="${taskId}"]`);
        const forceBtn  = document.querySelector(`.sc-ua-force-btn[data-task-id="${taskId}"]`);
        _pending[taskId] = staffId;

        // Reset buttons
        assignBtn.disabled = true;
        forceBtn.style.display = 'none';
        validEl.innerHTML = '';

        if (!staffId) return;

        const u = r.unassigned.find(x => x.task.id === taskId);
        if (!u) return;

        const result = _validateManualAssign(u.task, staffId, r);

        if (result.ok) {
          const slotStr = `${Scheduler.minToTime(result.slot.start)} – ${Scheduler.minToTime(result.slot.end)}`;
          validEl.innerHTML = `<span class="sc-va-ok">✓ ${slotStr} に配置可能</span>`;
          assignBtn.disabled = false;
          assignBtn.dataset.slotStart = result.slot.start;
          assignBtn.dataset.slotEnd   = result.slot.end;
        } else {
          validEl.innerHTML = `<span class="sc-va-ng">✗ ${result.reason}</span>`;
          assignBtn.disabled = true;

          // Show force assign only if staff is on duty (can't force if not working)
          if (result.canForce) {
            const fSlot = _forceSlot(u.task, staffId);
            if (fSlot) {
              forceBtn.style.display = '';
              forceBtn.dataset.slotStart = fSlot.start;
              forceBtn.dataset.slotEnd   = fSlot.end;
            }
          }
        }
      });
    });

    // Normal assign
    document.querySelectorAll('.sc-ua-assign-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId  = btn.dataset.taskId;
        const staffId = document.querySelector(`.sc-ua-staff-select[data-task-id="${taskId}"]`).value;
        const slot    = { start: +btn.dataset.slotStart, end: +btn.dataset.slotEnd };
        const u = r.unassigned.find(x => x.task.id === taskId);
        if (!u || !staffId) return;
        _doAssign(u.task, staffId, slot, false, r);
      });
    });

    // Force assign
    document.querySelectorAll('.sc-ua-force-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId  = btn.dataset.taskId;
        const staffId = document.querySelector(`.sc-ua-staff-select[data-task-id="${taskId}"]`).value;
        const slot    = { start: +btn.dataset.slotStart, end: +btn.dataset.slotEnd };
        const u = r.unassigned.find(x => x.task.id === taskId);
        if (!u || !staffId) return;

        if (!confirm(`⚡ 強制割り当て\n${u.task.patientName} → ${DEMO_DATA.staff.find(s=>s.id===staffId)?.name}\n${Scheduler.minToTime(slot.start)} – ${Scheduler.minToTime(slot.end)}\n\n制約を無視して割り当てますか？`)) return;
        _doAssign(u.task, staffId, slot, true, r);
      });
    });
  }

  /**
   * Validate manual assignment.
   * Returns { ok, reason, slot?, canForce }
   * canForce=true means staff is on duty but time constraints failed → force assign is allowed.
   */
  function _validateManualAssign(task, staffId, r) {
    const { shifts, staff } = DEMO_DATA;
    const date = AppState.selectedDate;

    const staffObj = staff.find(s => s.id === staffId);
    if (!staffObj) return { ok: false, reason: 'スタッフが見つかりません', canForce: false };

    // Hard constraints — force assign not allowed
    if (task.ngStaff?.includes(staffId))
      return { ok: false, reason: 'NGスタッフ制約（強制割り当て不可）', canForce: false };
    if (task.forcedStaff && task.forcedStaff !== staffId)
      return { ok: false, reason: '担当固定スタッフと一致しません（強制割り当て不可）', canForce: false };

    const shift = shifts.find(sh => sh.staffId === staffId && sh.date === date && sh.onDuty);
    if (!shift)
      return { ok: false, reason: 'この日は出勤していません（強制割り当て不可）', canForce: false };

    // From here, canForce = true (staff is on duty, soft constraints may fail)
    const shiftStart = Scheduler.timeToMin(shift.start);
    const shiftEnd   = Scheduler.timeToMin(shift.end);
    const brkStart   = shift.breakStart ? Scheduler.timeToMin(shift.breakStart) : null;
    const brkEnd     = shift.breakStart ? Scheduler.timeToMin(shift.breakEnd)   : null;

    const existing = r.assigned
      .filter(a => a.staffId === staffId && a.task.date === date)
      .sort((a, b) => a.startMin - b.startMin);

    const isFree = (s, e) => {
      if (s < shiftStart || e > shiftEnd) return false;
      if (brkStart !== null && s < brkEnd && e > brkStart) return false;
      return !existing.some(a => s < a.endMin && e > a.startMin);
    };

    if (task.timeKind === 'fixed' && task.fixedStart !== null) {
      const start = task.fixedStart, end = start + task.duration;
      if (start < shiftStart || end > shiftEnd)
        return { ok: false, reason: `シフト時間外 (${shift.start}–${shift.end})`, canForce: true };
      if (brkStart !== null && start < brkEnd && end > brkStart)
        return { ok: false, reason: '休憩時間と重複', canForce: true };
      const conflict = existing.find(a => start < a.endMin && end > a.startMin);
      if (conflict)
        return { ok: false, reason: `${conflict.task.patientName} (${conflict.start}–${conflict.end}) と重複`, canForce: true };
      return { ok: true, slot: { start, end }, reason: '' };
    }

    // Window — scan for free slot
    let wStart = shiftStart, wEnd = shiftEnd;
    if (task.timeKind === 'am') wEnd   = Math.min(720, shiftEnd);
    if (task.timeKind === 'pm') wStart = Math.max(720, shiftStart);

    for (let t = wStart; t <= wEnd - task.duration; t += 5) {
      if (isFree(t, t + task.duration)) return { ok: true, slot: { start: t, end: t + task.duration }, reason: '' };
    }
    return { ok: false, reason: '空きスロットがありません', canForce: true };
  }

  /**
   * Compute a force-assign time slot (ignores conflicts, respects shift boundaries when possible).
   * Fixed tasks use fixedStart; window tasks use window start.
   */
  function _forceSlot(task, staffId) {
    const { shifts } = DEMO_DATA;
    const shift = shifts.find(sh => sh.staffId === staffId && sh.date === AppState.selectedDate && sh.onDuty);
    if (!shift) return null;
    const shiftStart = Scheduler.timeToMin(shift.start);
    const shiftEnd   = Scheduler.timeToMin(shift.end);

    if (task.timeKind === 'fixed' && task.fixedStart !== null) {
      return { start: task.fixedStart, end: task.fixedStart + task.duration };
    }
    let wStart = shiftStart;
    if (task.timeKind === 'pm') wStart = Math.max(720, shiftStart);
    // Clamp to shift
    const end = Math.min(wStart + task.duration, shiftEnd);
    return { start: wStart, end };
  }

  /** Commit assignment (normal or force) to scheduleResult and re-render */
  function _doAssign(task, staffId, slot, forceAssigned, r) {
    const staffObj = DEMO_DATA.staff.find(s => s.id === staffId);
    r.assigned.push({
      task, staffId,
      staffName: staffObj.name,
      staffColor: staffObj.color,
      staffTransport: staffObj.transport,
      start: Scheduler.minToTime(slot.start),
      end:   Scheduler.minToTime(slot.end),
      startMin: slot.start,
      endMin:   slot.end,
      travelMin: 0, distKm: '?', score: 0,
      forceAssigned,  // ← flag for display
    });
    r.unassigned = r.unassigned.filter(u => u.task.id !== task.id);
    if (r.assignmentDetails?.[task.id]) {
      r.assignmentDetails[task.id].chosen = {
        staffId, staffName: staffObj.name, transport: staffObj.transport,
        feasible: true, score: 0, slotStart: slot.start, slotEnd: slot.end, travelFromPrev: 0,
      };
    }
    delete _pending[task.id];
    render();
    showToast(forceAssigned
      ? `⚡ ${task.patientName} → ${staffObj.name} に強制割り当て完了`
      : `${task.patientName} → ${staffObj.name} に割り当て完了`
    );
  }

  return { render };
})();
