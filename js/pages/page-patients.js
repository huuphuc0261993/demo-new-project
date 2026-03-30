/**
 * page-patients.js - Patient list with distance from clinic (paginated).
 */
const PagePatients = (() => {
  let patientPage = 1;
  const PER_PAGE = 10;

  function render(page) {
    if (page !== undefined) patientPage = page;

    const { patients, facilities, clinic } = DEMO_DATA;
    const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pg = paginate(patients, patientPage, PER_PAGE);
    patientPage = pg.current;

    const rows = pg.items.map(p => {
      const fac = p.facilityId ? (facilities.find(f => f.id === p.facilityId)?.name || p.facilityId) : '–';
      const forced = p.forcedStaff ? (DEMO_DATA.staff.find(s => s.id === p.forcedStaff)?.name || p.forcedStaff) : '–';
      const ng = p.ngStaff.length ? p.ngStaff.map(id => DEMO_DATA.staff.find(s => s.id === id)?.name || id).join(', ') : '–';
      const days = p.visits.map(v => v.dayOfWeek.map(d => DOW[d]).join(', ')).join('; ');
      const dist = Scheduler.estimateDistance(clinic.lat, clinic.lng, p.lat, p.lng);
      const special = p.specialPeriod ? `${p.specialPeriod.start} – ${p.specialPeriod.end}` : '–';
      const catClass = p.category === '医療' ? 'badge-blue' : 'badge-green';
      return `<tr>
        <td style="color:var(--gray-500)">${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge ${catClass}">${p.category}</span></td>
        <td>${fac}</td>
        <td>${forced !== '–' ? `<span style="color:var(--primary)">${forced}</span>` : '–'}</td>
        <td>${ng !== '–' ? `<span style="color:var(--danger)">${ng}</span>` : '–'}</td>
        <td>${days}</td>
        <td>${dist ? dist.toFixed(1) + ' km' : '–'}</td>
        <td>${special !== '–' ? `<span class="badge badge-red">${special}</span>` : '–'}</td>
      </tr>`;
    }).join('');

    const listEl = document.getElementById('patients-list');
    listEl.innerHTML = `
      <div class="card">
        <div class="card-title">Patients (${patients.length})</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Category</th><th>Facility</th>
                <th>Forced staff</th><th>NG staff</th><th>Visit days</th>
                <th>Distance</th><th>Special period</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${pagerHTML(pg)}
      </div>`;

    wirePager(listEl, p => render(p));
  }

  return { render };
})();
