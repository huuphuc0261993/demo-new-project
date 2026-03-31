/**
 * ROUTE Demo — Scheduling Engine
 *
 * Scoring matches the original GAS source (CODE_GAS.txt):
 *   fixed slot:  score = prevTravel + nextTravel + gapBefore×0.1 + gapAfter×0.1
 *   window slot: score += delay×0.01  (+ tightness×0.05 for facility simulation)
 *
 * Facility staff selection via full-phase simulation — lowest total score wins.
 */

const Scheduler = (() => {

  // ── Transport modes ───────────────────────────────────────────────────────
  const TRANSPORTS = {
    car:        { label: '車',          speed: 25, color: '#3b82f6' },
    motorcycle: { label: 'バイク',      speed: 22, color: '#f59e0b' },
    bicycle:    { label: '自転車',      speed: 10, color: '#10b981' },
    train:      { label: '電車',        speed: 35, color: '#8b5cf6' },
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  function timeToMin(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function minToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function getDayOfWeek(dateStr) { return new Date(dateStr).getDay(); }

  /** Haversine distance in km */
  function estimateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Estimate travel time (minutes) between two coords for a given transport */
  function estimateTravel(lat1, lng1, lat2, lng2, transport) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 20;
    const dist = estimateDistance(lat1, lng1, lat2, lng2);
    const t = TRANSPORTS[transport] || TRANSPORTS.car;
    return Math.max(Math.ceil((dist * 1.3 / t.speed) * 60), 3);
  }

  // ── Task ordering (matches GAS sortTasksForPhase_ / taskSortKey_) ─────────
  function _kindRank(task) {
    return task.timeKind === 'fixed' ? 0 : task.timeKind === 'am' ? 1 : task.timeKind === 'pm' ? 2 : 3;
  }

  function sortTasksForPhase(tasks) {
    return tasks.slice().sort((a, b) => {
      const dr = _kindRank(a) - _kindRank(b);
      if (dr !== 0) return dr;
      const ta = a.fixedStart !== null ? a.fixedStart : 0;
      const tb = b.fixedStart !== null ? b.fixedStart : 0;
      return ta - tb;
    });
  }

  // ── Block helpers ─────────────────────────────────────────────────────────
  /**
   * Find the block ending just before startMin (prev) and starting just after
   * startMin (next). Mirrors GAS findPrevNextBlock_.
   */
  function findPrevNextBlock(blocks, startMin) {
    let prev = null, next = null;
    for (const b of blocks) {
      if (b.end <= startMin) {
        if (!prev || b.end > prev.end) prev = b;
      } else if (b.start >= startMin) {
        if (!next || b.start < next.start) next = b;
      }
    }
    return { prev, next };
  }

  /** Travel (min) from the end of prevBlock to (toLat, toLng). If no prevBlock → from clinic. */
  function _travelFromBlock(prevBlock, toLat, toLng, transport, clinic) {
    if (!prevBlock) return estimateTravel(clinic.lat, clinic.lng, toLat, toLng, transport);
    if (prevBlock.type === 'visit' && prevBlock.lat && prevBlock.lng) {
      return estimateTravel(prevBlock.lat, prevBlock.lng, toLat, toLng, transport);
    }
    return 20; // break / busy: no location → 20 min default (matches GAS)
  }

  /** Travel (min) from (fromLat, fromLng) to the start of nextBlock. If no nextBlock → to clinic. */
  function _travelToBlock(fromLat, fromLng, nextBlock, transport, clinic) {
    if (!nextBlock) return estimateTravel(fromLat, fromLng, clinic.lat, clinic.lng, transport);
    if (nextBlock.type === 'visit' && nextBlock.lat && nextBlock.lng) {
      return estimateTravel(fromLat, fromLng, nextBlock.lat, nextBlock.lng, transport);
    }
    return 20;
  }

  // ── Placement logic ───────────────────────────────────────────────────────
  /**
   * Check whether task can be placed at startMin on staff, and compute GAS score.
   * Mirrors GAS canPlaceAtFixed_ / diagnoseFixedPlacement_.
   * Returns { ok, score, reason, prevTravel, nextTravel }
   */
  function canPlaceAtFixed(staff, task, startMin, clinic) {
    const endMin = startMin + task.duration;

    if (startMin < staff.shiftStart || endMin > staff.shiftEnd) {
      return { ok: false, score: Infinity, reason: 'SHIFT_OUTSIDE', prevTravel: 0 };
    }

    for (const b of staff.blocks) {
      if (startMin < b.end && endMin > b.start) {
        return { ok: false, score: Infinity, reason: b.type === 'break' ? 'BREAK_OVERLAP' : 'BUSY_OVERLAP', prevTravel: 0 };
      }
    }

    const { prev, next } = findPrevNextBlock(staff.blocks, startMin);
    const prevTravel = _travelFromBlock(prev, task.lat, task.lng, staff.transport, clinic);
    const nextTravel = _travelToBlock(task.lat, task.lng, next, staff.transport, clinic);

    if (prev && prev.end + prevTravel > startMin) {
      return { ok: false, score: Infinity, reason: 'TRAVEL_BEFORE', prevTravel };
    }
    if (next && endMin + nextTravel > next.start) {
      return { ok: false, score: Infinity, reason: 'TRAVEL_AFTER', prevTravel };
    }

    const gapBefore = prev
      ? Math.max(0, startMin - prev.end)
      : Math.max(0, startMin - staff.shiftStart);
    const gapAfter = next
      ? Math.max(0, next.start - endMin)
      : Math.max(0, staff.shiftEnd - endMin);

    const score = prevTravel + nextTravel + gapBefore * 0.1 + gapAfter * 0.1;
    return { ok: true, score, reason: '', prevTravel, nextTravel };
  }

  /**
   * Find the best time slot within the task's window (am/pm/any) on staff.
   * Scans in 5-min steps. Mirrors GAS findBestSlotInWindows_.
   * Returns { start, score, prevTravel } or null.
   */
  function findBestSlotInWindows(staff, task, preferTight, clinic) {
    let windowStart, windowEnd;
    if (task.timeKind === 'am') {
      windowStart = staff.shiftStart;
      windowEnd = Math.min(720, staff.shiftEnd); // up to 12:00
    } else if (task.timeKind === 'pm') {
      windowStart = Math.max(720, staff.shiftStart); // from 12:00 (matches GAS computeTaskWindow_)
      windowEnd = staff.shiftEnd;
    } else {
      windowStart = staff.shiftStart;
      windowEnd = staff.shiftEnd;
    }

    const latestStart = windowEnd - task.duration;
    if (latestStart < windowStart) return null;

    let best = null;
    for (let t = windowStart; t <= latestStart; t += 5) {
      const res = canPlaceAtFixed(staff, task, t, clinic);
      if (!res.ok) continue;

      let score = res.score + (t - windowStart) * 0.01;
      if (preferTight) {
        const { prev, next } = findPrevNextBlock(staff.blocks, t);
        let tight = 0;
        if (prev) tight += Math.min(120, t - prev.end);
        if (next) tight += Math.min(120, next.start - t);
        score += tight * 0.05;
      }

      if (!best || score < best.score) best = { start: t, score, prevTravel: res.prevTravel };
    }
    return best;
  }

  /** Commit task to staff.blocks (sorted). Mirrors GAS placeTaskOnStaff_. */
  function placeTaskOnStaff(staff, task, startMin) {
    const endMin = startMin + task.duration;
    staff.blocks.push({
      type: 'visit', start: startMin, end: endMin,
      title: task.patientName, lat: task.lat, lng: task.lng, task,
    });
    staff.blocks.sort((a, b) => a.start - b.start);
    return { start: startMin, end: endMin };
  }

  /**
   * Simulate placing ALL facility tasks across all phases on a copy of staffState.
   * Mirrors GAS simulateFacilityAllPhases_.
   * Returns { ok, score }.
   */
  function simulateFacilityAllPhases(staffState, allFacilityTasks, clinic) {
    const simStaff = { ...staffState, blocks: staffState.blocks.map(b => ({ ...b })) };
    let totalScore = 0;

    for (const priority of [0, 1, 2]) {
      const ordered = sortTasksForPhase(allFacilityTasks.filter(t => t.priority === priority));
      for (const t of ordered) {
        if (t.timeKind === 'fixed' && t.fixedStart !== null) {
          const res = canPlaceAtFixed(simStaff, t, t.fixedStart, clinic);
          if (!res.ok) return { ok: false, score: 9e15 };
          totalScore += res.score;
          placeTaskOnStaff(simStaff, t, t.fixedStart);
        } else {
          const slot = findBestSlotInWindows(simStaff, t, true, clinic);
          if (!slot) return { ok: false, score: 9e15 };
          totalScore += slot.score;
          placeTaskOnStaff(simStaff, t, slot.start);
        }
      }
    }
    return { ok: true, score: totalScore };
  }

  // ── Task Generation ───────────────────────────────────────────────────────
  function generateTasks(date, patients) {
    const dow = getDayOfWeek(date);
    const tasks = [];

    for (const p of patients) {
      if (p.cancelPeriod && date >= p.cancelPeriod.start && date <= p.cancelPeriod.end) continue;

      const isSpecial = p.specialPeriod &&
        date >= p.specialPeriod.start && date <= p.specialPeriod.end;

      for (const v of p.visits) {
        if (!isSpecial && !v.dayOfWeek.includes(dow)) continue;

        for (let i = 0; i < v.timesPerDay; i++) {
          let preferredTime = v.preferredTimes[i] || null;
          let duration = v.durations[i] || v.durations[0] || 30;
          let timeKind = v.timeKind;

          if (!preferredTime && i === 1 && v.preferredTimes[0]) {
            const base = timeToMin(v.preferredTimes[0]);
            if (base !== null) preferredTime = minToTime(base + 180);
            timeKind = 'fixed';
          } else if (!preferredTime && i === 2) {
            const prev = v.preferredTimes[1] || v.preferredTimes[0];
            const base = timeToMin(prev);
            if (base !== null) preferredTime = minToTime(base + 120);
            timeKind = 'fixed';
          }

          const priority = isSpecial ? 0 : (timeKind === 'fixed' ? 1 : 2);

          tasks.push({
            id: `${p.id}-${date}-V${i + 1}`,
            patientId: p.id, patientName: p.name,
            date, visitIndex: i + 1,
            timeKind,
            fixedStart: (timeKind === 'fixed') ? timeToMin(preferredTime) : null,
            duration, priority,
            facilityId: p.facilityId,
            forcedStaff: p.forcedStaff,
            ngStaff: p.ngStaff || [],
            lat: p.lat, lng: p.lng,
            category: p.category,
            isSpecial,
          });
        }
      }
    }

    tasks.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Non-fixed tasks sort after fixed (9e15), matching GAS buildTasksForDate_ sort
      const ta = a.fixedStart !== null ? a.fixedStart : 9e15;
      const tb = b.fixedStart !== null ? b.fixedStart : 9e15;
      return ta - tb;
    });
    return tasks;
  }

  // ── Main allocation ───────────────────────────────────────────────────────
  function allocate(date, clinic, staffList, patients, shifts, busyBlocks) {
    const tasks = generateTasks(date, patients);
    const assigned = [];
    const unassigned = [];
    const logs = [];
    const assignmentDetails = {};

    // Prepare staff state: blocks = break + busy blocks only (visits added during allocation)
    const staffState = {};
    for (const s of staffList) {
      const shift = shifts.find(sh => sh.staffId === s.id && sh.date === date && sh.onDuty);
      if (!shift) continue;
      const blocks = [];
      if (shift.breakStart) {
        blocks.push({ type: 'break', start: timeToMin(shift.breakStart), end: timeToMin(shift.breakEnd), title: 'Break', lat: null, lng: null });
      }
      for (const b of (busyBlocks || [])) {
        if (b.staffId === s.id && b.date === date) {
          blocks.push({ type: 'busy', start: timeToMin(b.start), end: timeToMin(b.end), title: b.title, lat: null, lng: null });
        }
      }
      blocks.sort((a, b) => a.start - b.start);
      staffState[s.id] = {
        ...s,
        shiftStart: timeToMin(shift.start),
        shiftEnd: timeToMin(shift.end),
        blocks,
      };
    }

    const onDutyIds = Object.keys(staffState);
    if (!onDutyIds.length) {
      for (const t of tasks) unassigned.push({ task: t, reason: '出勤スタッフなし' });
      return { assigned, unassigned, tasks, logs, assignmentDetails };
    }

    // Split tasks: facility groups vs standalone
    const facilityGroups = new Map();
    const standalone = [];
    for (const t of tasks) {
      if (t.facilityId) {
        if (!facilityGroups.has(t.facilityId)) facilityGroups.set(t.facilityId, []);
        facilityGroups.get(t.facilityId).push(t);
      } else {
        standalone.push(t);
      }
    }

    // Reject facilities where multiple forced staff conflict
    for (const [facId, list] of facilityGroups.entries()) {
      const forced = [...new Set(list.map(x => x.forcedStaff).filter(Boolean))];
      if (forced.length > 1) {
        for (const t of list) unassigned.push({ task: t, reason: `施設 ${facId}: 担当固定の競合` });
        facilityGroups.delete(facId);
      }
    }

    // facilityAssigned: facId → chosen staffId (selected once via simulation)
    const facilityAssigned = new Map();

    // Phase loop: priority 0 (Special) → 1 (Fixed) → 2 (Window)
    const phases = [
      { name: 'Special',    priority: 0 },
      { name: 'Fixed time', priority: 1 },
      { name: 'Window',     priority: 2 },
    ];

    for (const ph of phases) {

      // ── Facility tasks for this phase ──
      const facIdsInPhase = Array.from(facilityGroups.keys())
        .filter(fid => facilityGroups.get(fid).some(t => t.priority === ph.priority));

      for (const facId of facIdsInPhase) {
        const allFacTasks = facilityGroups.get(facId);
        const phaseTasks  = allFacTasks.filter(t => t.priority === ph.priority);
        if (!phaseTasks.length) continue;

        // Select facility staff if not already chosen
        if (!facilityAssigned.has(facId)) {
          const forcedFac = [...new Set(allFacTasks.map(x => x.forcedStaff).filter(Boolean))][0] || null;
          const candidates = onDutyIds.filter(sid => {
            if (forcedFac && sid !== forcedFac) return false;
            for (const t of allFacTasks) {
              if (t.ngStaff && t.ngStaff.includes(sid)) return false;
              if (t.forcedStaff && t.forcedStaff !== sid) return false;
            }
            return true;
          });

          if (!candidates.length) {
            const msg = forcedFac
              ? `施設 ${facId}: 担当固定スタッフ (${forcedFac}) が不在`
              : `施設 ${facId}: 対象スタッフなし`;
            for (const t of allFacTasks) unassigned.push({ task: t, reason: msg });
            facilityGroups.delete(facId);
            continue;
          }

          // Simulate all phases for each candidate; pick lowest score
          let best = null;
          for (const sid of candidates) {
            const sim = simulateFacilityAllPhases(staffState[sid], allFacTasks, clinic);
            if (!sim.ok) continue;
            if (!best || sim.score < best.score) best = { staffId: sid, score: sim.score };
          }

          if (!best) {
            for (const t of allFacTasks) {
              unassigned.push({ task: t, reason: `施設 ${facId}: 全訪問を担当できるスタッフなし` });
            }
            facilityGroups.delete(facId);
            continue;
          }

          facilityAssigned.set(facId, best.staffId);
        }

        const chosenId = facilityAssigned.get(facId);
        const chosenSt = staffState[chosenId];

        // Place this phase's tasks on the chosen staff
        for (const t of sortTasksForPhase(phaseTasks)) {
          const detail = { task: t, candidates: [], feasibleCount: 0, infeasibleCount: 0, chosen: null };
          assignmentDetails[t.id] = detail;

          let startMin, score, prevTravel;

          if (t.timeKind === 'fixed' && t.fixedStart !== null) {
            const res = canPlaceAtFixed(chosenSt, t, t.fixedStart, clinic);
            if (!res.ok) {
              unassigned.push({ task: t, reason: `施設配置失敗: ${res.reason}` });
              detail.candidates.push(_infeasibleEntry(chosenId, chosenSt, res.reason));
              detail.infeasibleCount = 1;
              continue;
            }
            startMin = t.fixedStart; score = res.score; prevTravel = res.prevTravel;
          } else {
            const slot = findBestSlotInWindows(chosenSt, t, true, clinic);
            if (!slot) {
              unassigned.push({ task: t, reason: `施設 ${facId}: 空きスロットなし` });
              detail.candidates.push(_infeasibleEntry(chosenId, chosenSt, 'WINDOW_NO_SLOT'));
              detail.infeasibleCount = 1;
              continue;
            }
            startMin = slot.start; score = slot.score; prevTravel = slot.prevTravel;
          }

          placeTaskOnStaff(chosenSt, t, startMin);

          const cand = {
            staffId: chosenId, staffName: chosenSt.name, transport: chosenSt.transport,
            feasible: true, reason: null, score,
            slotStart: startMin, slotEnd: startMin + t.duration,
            travelFromPrev: prevTravel,
            scoreBreakdown: { note: 'facility-assigned' },
          };
          detail.candidates.push(cand);
          detail.chosen = cand;
          detail.feasibleCount = 1;

          assigned.push(_assignEntry(t, chosenId, chosenSt, startMin, score, prevTravel, clinic));
          logs.push(`[FAC] ${t.patientName} V${t.visitIndex} → ${chosenSt.name} | ${minToTime(startMin)}-${minToTime(startMin + t.duration)} | Score: ${Math.round(score)}`);
        }
      }

      // ── Standalone tasks for this phase ──
      for (const t of sortTasksForPhase(standalone.filter(t2 => t2.priority === ph.priority))) {
        const candidateIds = onDutyIds.filter(sid => {
          if (t.forcedStaff && sid !== t.forcedStaff) return false;
          if (t.ngStaff && t.ngStaff.includes(sid)) return false;
          return true;
        });

        const detail = { task: t, candidates: [], feasibleCount: 0, infeasibleCount: 0, chosen: null };
        assignmentDetails[t.id] = detail;

        if (!candidateIds.length) {
          const reason = t.forcedStaff
            ? `担当固定スタッフ (${t.forcedStaff}) が不在またはNG除外`
            : '全候補がNG除外';
          unassigned.push({ task: t, reason });
          continue;
        }

        // Evaluate all on-duty staff (feasible candidates + excluded display entries)
        for (const sid of onDutyIds) {
          const st = staffState[sid];
          if (!candidateIds.includes(sid)) {
            // Excluded (NG or forced mismatch)
            const reason = t.ngStaff.includes(sid) ? 'NG_STAFF' : 'FORCED_STAFF_MISMATCH';
            detail.candidates.push(_infeasibleEntry(sid, st, reason));
            detail.infeasibleCount++;
            continue;
          }

          const cand = {
            staffId: sid, staffName: st.name, transport: st.transport,
            feasible: false, reason: null, score: Infinity,
            slotStart: null, slotEnd: null, travelFromPrev: 0,
            scoreBreakdown: {},
          };

          if (t.timeKind === 'fixed' && t.fixedStart !== null) {
            const res = canPlaceAtFixed(st, t, t.fixedStart, clinic);
            if (res.ok) {
              cand.feasible = true;
              cand.score = res.score;
              cand.slotStart = t.fixedStart;
              cand.slotEnd = t.fixedStart + t.duration;
              cand.travelFromPrev = res.prevTravel;
              cand.scoreBreakdown = { prevTravel: res.prevTravel, nextTravel: res.nextTravel };
            } else {
              cand.reason = res.reason;
              detail.infeasibleCount++;
            }
          } else {
            const slot = findBestSlotInWindows(st, t, false, clinic);
            if (slot) {
              cand.feasible = true;
              cand.score = slot.score;
              cand.slotStart = slot.start;
              cand.slotEnd = slot.start + t.duration;
              cand.travelFromPrev = slot.prevTravel;
            } else {
              cand.reason = 'WINDOW_NO_SLOT';
              detail.infeasibleCount++;
            }
          }

          detail.candidates.push(cand);
          if (cand.feasible) detail.feasibleCount++;
        }

        // Sort feasible by score, pick best
        const feasible = detail.candidates.filter(e => e.feasible).sort((a, b) => a.score - b.score);

        if (feasible.length > 0) {
          const best = feasible[0];
          const st = staffState[best.staffId];

          placeTaskOnStaff(st, t, best.slotStart);
          detail.chosen = best;

          assigned.push(_assignEntry(t, best.staffId, st, best.slotStart, best.score, best.travelFromPrev, clinic));
          logs.push(`[STEP ${assigned.length}] ${t.patientName} V${t.visitIndex} → ${best.staffName} | ${minToTime(best.slotStart)}-${minToTime(best.slotEnd)} | Score: ${Math.round(best.score)}`);
          if (feasible.length > 1) logs.push(`  Alternatives: ${feasible.slice(1).map(f => `${f.staffName}(${Math.round(f.score)})`).join(', ')}`);
        } else {
          const reasons = detail.candidates.filter(e => !e.feasible && e.reason !== 'NG_STAFF' && e.reason !== 'FORCED_STAFF_MISMATCH')
            .map(f => `${f.staffName}: ${f.reason}`).join('; ');
          unassigned.push({ task: t, reason: reasons || '利用可能なスタッフなし' });
          logs.push(`[UNASSIGNED] ${t.patientName} V${t.visitIndex} | ${reasons}`);
        }
      }
    }

    // Build per-staff route optimizations
    const staffRoutes = {};
    for (const a of assigned) {
      if (!staffRoutes[a.staffId]) {
        staffRoutes[a.staffId] = { staff: staffList.find(x => x.id === a.staffId), visits: [] };
      }
      staffRoutes[a.staffId].visits.push(a);
    }

    const routeOptimizations = {};
    for (const [sid, route] of Object.entries(staffRoutes)) {
      routeOptimizations[sid] = optimizeRoute(clinic, route.visits, route.staff.transport);
    }

    return { assigned, unassigned, tasks, logs, assignmentDetails, routeOptimizations, staffRoutes };
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  function _infeasibleEntry(staffId, st, reason) {
    return { staffId, staffName: st.name, transport: st.transport, feasible: false, reason, score: Infinity, slotStart: null, slotEnd: null, travelFromPrev: 0, scoreBreakdown: {} };
  }

  function _assignEntry(task, staffId, st, startMin, score, prevTravel, clinic) {
    const distKm = estimateDistance(clinic.lat, clinic.lng, task.lat, task.lng);
    return {
      task, staffId, staffName: st.name, staffColor: st.color, staffTransport: st.transport,
      start: minToTime(startMin), end: minToTime(startMin + task.duration),
      startMin, endMin: startMin + task.duration,
      travelMin: prevTravel,
      distKm: distKm ? distKm.toFixed(1) : '?',
      score: Math.round(score),
    };
  }

  // ── TSP Route Optimizer (Nearest Neighbor + 2-opt) ────────────────────────
  function routeTotalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += estimateDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng) || 0;
    }
    return total;
  }

  function nearestNeighborOrder(depot, waypoints) {
    if (waypoints.length <= 1) return [...waypoints];
    const remaining = [...waypoints];
    const order = [];
    let current = depot;
    while (remaining.length > 0) {
      let bestIdx = 0, bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = estimateDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng) || Infinity;
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      order.push(remaining[bestIdx]);
      current = remaining[bestIdx];
      remaining.splice(bestIdx, 1);
    }
    return order;
  }

  function twoOptImprove(depot, waypoints, maxIterations) {
    if (waypoints.length < 3) return waypoints;
    let route = [...waypoints];
    let improved = true;
    let iterations = 0;
    const max = maxIterations || 100;
    while (improved && iterations < max) {
      improved = false; iterations++;
      for (let i = 0; i < route.length - 1; i++) {
        for (let j = i + 2; j < route.length; j++) {
          const before_i = i === 0 ? depot : route[i - 1];
          const after_j  = j === route.length - 1 ? depot : route[j + 1];
          const cur  = (estimateDistance(before_i.lat, before_i.lng, route[i].lat, route[i].lng) || 0)
                     + (estimateDistance(route[j].lat, route[j].lng, after_j.lat, after_j.lng) || 0);
          const swap = (estimateDistance(before_i.lat, before_i.lng, route[j].lat, route[j].lng) || 0)
                     + (estimateDistance(route[i].lat, route[i].lng, after_j.lat, after_j.lng) || 0);
          if (swap < cur - 0.001) {
            route = [...route.slice(0, i), ...route.slice(i, j + 1).reverse(), ...route.slice(j + 1)];
            improved = true;
          }
        }
      }
    }
    return route;
  }

  function optimizeRoute(clinic, visits, transport) {
    if (visits.length <= 1) {
      return { original: visits, optimized: visits, savings: { distKm: 0, timeMin: 0 } };
    }

    const depot = { lat: clinic.lat, lng: clinic.lng };
    const waypoints = visits.map(v => ({ ...v, lat: v.task ? v.task.lat : v.lat, lng: v.task ? v.task.lng : v.lng }));

    const origDist = routeTotalDistance([depot, ...waypoints, depot]);

    const fixedVisits = waypoints.filter(v => { const t = v.task || v; return t.timeKind === 'fixed' && t.fixedStart !== null; });
    const flexVisits  = waypoints.filter(v => { const t = v.task || v; return !(t.timeKind === 'fixed' && t.fixedStart !== null); });

    let optimizedFlex = nearestNeighborOrder(depot, flexVisits);
    optimizedFlex = twoOptImprove(depot, optimizedFlex, 100);

    const sortedFixed = [...fixedVisits].sort((a, b) => ((a.task||a).fixedStart||0) - ((b.task||b).fixedStart||0));

    let finalOrder;
    if (sortedFixed.length === 0) {
      finalOrder = optimizedFlex;
    } else {
      finalOrder = [];
      let currentPos = depot;
      let flexPool = [...optimizedFlex];

      for (const anchor of sortedFixed) {
        while (flexPool.length > 0) {
          let bestIdx = -1, bestDist = Infinity;
          for (let i = 0; i < flexPool.length; i++) {
            const d = estimateDistance(currentPos.lat, currentPos.lng, flexPool[i].lat, flexPool[i].lng) || Infinity;
            if (d < bestDist) { bestDist = d; bestIdx = i; }
          }
          if (bestIdx === -1) break;
          const distToAnchor = estimateDistance(currentPos.lat, currentPos.lng, anchor.lat, anchor.lng) || Infinity;
          if (bestDist > distToAnchor) break;
          finalOrder.push(flexPool[bestIdx]);
          currentPos = flexPool[bestIdx];
          flexPool.splice(bestIdx, 1);
        }
        finalOrder.push(anchor);
        currentPos = anchor;
      }
      let remaining = nearestNeighborOrder(currentPos, flexPool);
      remaining = twoOptImprove(currentPos, remaining, 50);
      finalOrder.push(...remaining);
    }

    const optDist = routeTotalDistance([depot, ...finalOrder, depot]);
    const t = TRANSPORTS[transport] || TRANSPORTS.car;
    return {
      original: visits, optimized: finalOrder,
      originalOrder: waypoints, optimizedOrder: finalOrder,
      savings: {
        distKm:  Math.round((origDist - optDist) * 10) / 10,
        timeMin: Math.round(((origDist - optDist) * 1.3 / t.speed) * 60),
        origDistKm: Math.round(origDist * 10) / 10,
        optDistKm:  Math.round(optDist * 10) / 10,
      },
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    allocate,
    generateTasks,
    estimateTravel,
    estimateDistance,
    optimizeRoute,
    routeTotalDistance,
    timeToMin,
    minToTime,
    TRANSPORTS,
  };
})();
