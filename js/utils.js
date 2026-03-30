/**
 * utils.js - Shared UI helpers used by all page modules.
 */

const REASON_LABELS = {
  NG_STAFF:              'NG staff constraint',
  FORCED_STAFF_MISMATCH: 'Forced staff mismatch',
  SHIFT_OUTSIDE:         'Outside shift hours',
  BREAK_OVERLAP:         'Conflicts with break',
  BUSY_OVERLAP:          'Conflicts with busy block',
  WINDOW_NO_SLOT:        'No available slot',
  TRAVEL_BEFORE:         'Insufficient travel time (before)',
  TRAVEL_AFTER:          'Insufficient travel time (after)',
  MISSING_GEO:           'Missing coordinates',
};

/** Render a transport badge HTML */
function transportBadge(transport) {
  const t = Scheduler.TRANSPORTS[transport];
  if (!t) return '';
  const icons = { car: '◈', motorcycle: '◉', bicycle: '◍', train: '◎' };
  return `<span class="transport-chip" data-transport="${transport}">${icons[transport] || '•'} ${t.label}</span>`;
}

/** Render a staff avatar chip */
function staffChip(staffId) {
  const s = DEMO_DATA.staff.find(x => x.id === staffId);
  if (!s) return '';
  return `<span class="staff-chip"><span class="staff-dot" style="background:${s.color}"></span>${s.name}</span>`;
}

/** Simple toast notification */
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show${type === 'error' ? ' toast-error' : ''}`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

/**
 * Slice an array to a single page and return pagination metadata.
 * @param {any[]} items   Full list
 * @param {number} page   1-indexed current page
 * @param {number} perPage
 * @returns {{ items, start, current, totalPages, total, perPage }}
 */
function paginate(items, page, perPage) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.max(1, Math.min(page, totalPages));
  const start = (current - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    start,
    current,
    totalPages,
    total,
    perPage,
  };
}

/**
 * Generate page number list with ellipsis gaps.
 * e.g. [1, '...', 4, 5, 6, '...', 12]
 */
function _pageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

/**
 * Render pager controls HTML. Wire up buttons via wirePager().
 * @param {{ current, totalPages, start, total, perPage }} pg  Result from paginate()
 */
function pagerHTML(pg) {
  if (pg.totalPages <= 1) return '';
  const { current, totalPages, start, total, perPage } = pg;
  const end = Math.min(start + perPage, total);

  const nums = _pageNums(current, totalPages);
  const btnCls = (p) => `pager-btn${p === current ? ' active' : ''}`;

  return `
    <div class="pager">
      <span class="pager-info">${start + 1}–${end} of ${total}</span>
      <div class="pager-btns">
        <button class="pager-btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>‹</button>
        ${nums.map(p => p === '...'
          ? `<span class="pager-ellipsis">…</span>`
          : `<button class="${btnCls(p)}" data-page="${p}">${p}</button>`
        ).join('')}
        <button class="pager-btn" data-page="${current + 1}" ${current >= totalPages ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
}

/**
 * Wire pager button clicks inside a container element.
 * @param {HTMLElement} container  The element that contains .pager buttons
 * @param {function(number): void} onPage  Called with the new page number
 */
function wirePager(container, onPage) {
  container.querySelectorAll('.pager-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPage(+btn.dataset.page));
  });
}

// ---------------------------------------------------------------------------

/** Build the route flow HTML for a staff's ordered visits */
function buildRouteFlow(visits, transport, clinic) {
  if (!visits || !visits.length) return '<p class="empty-msg">No visits assigned.</p>';

  let html = '<div class="route-flow">';
  html += `<div class="rf-node rf-clinic"><div class="rf-dot" style="background:#ef4444"></div><div class="rf-label">Base</div><div class="rf-sub">Depart</div></div>`;

  let prevLat = clinic.lat;
  let prevLng = clinic.lng;

  visits.forEach((v, i) => {
    const lat = v.task.lat;
    const lng = v.task.lng;
    const travel = Scheduler.estimateTravel(prevLat, prevLng, lat, lng, transport);
    prevLat = lat; prevLng = lng;

    html += `
      <div class="rf-leg">
        <div class="rf-arrow"></div>
        <div class="rf-travel">${travel} min</div>
      </div>
      <div class="rf-node rf-patient">
        <div class="rf-num">${i + 1}</div>
        <div class="rf-label">${v.task.patientName}</div>
        <div class="rf-sub">${v.start}–${v.end}</div>
        <div class="rf-dur">${v.task.duration} min</div>
      </div>`;
  });

  const retTravel = Scheduler.estimateTravel(prevLat, prevLng, clinic.lat, clinic.lng, transport);
  html += `
    <div class="rf-leg">
      <div class="rf-arrow"></div>
      <div class="rf-travel">${retTravel} min</div>
    </div>
    <div class="rf-node rf-clinic"><div class="rf-dot" style="background:#ef4444"></div><div class="rf-label">Base</div><div class="rf-sub">Return</div></div>
  </div>`;

  return html;
}
