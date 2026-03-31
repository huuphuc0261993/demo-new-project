/**
 * page-map.js - Route Map with staff select dropdown,
 * route flow timeline, and transport comparison.
 */
const PageMap = (() => {
  let mapInst = null;
  let activeStaffId = null;

  function render(prevMap) {
    if (prevMap) { prevMap.remove(); mapInst = null; }

    const r = AppState.scheduleResult;
    const { clinic, staff } = DEMO_DATA;
    const opts = r.routeOptimizations || {};
    const sRoutes = r.staffRoutes || {};

    const staffWithVisits = Object.keys(sRoutes);
    if (!activeStaffId || !sRoutes[activeStaffId]) {
      activeStaffId = staffWithVisits[0] || null;
    }

    document.getElementById('map-page-content').innerHTML = `
      <div class="map-page-wrap">
        <div class="map-staff-selector">
          <label class="mss-label">スタッフ</label>
          <select id="map-staff-select">
            ${staffWithVisits.map(sid => {
              const s = staff.find(x => x.id === sid);
              const count = sRoutes[sid]?.visits?.length || 0;
              return `<option value="${sid}" ${sid === activeStaffId ? 'selected' : ''}>${s.name} — ${count} 件 · ${transportBadge(s.transport).replace(/<[^>]+>/g, '')}</option>`;
            }).join('')}
          </select>
          ${activeStaffId && sRoutes[activeStaffId] ? (() => {
            const s = sRoutes[activeStaffId].staff;
            return `<span style="font-size:12px;color:var(--gray-500)">${s.role}</span>`;
          })() : ''}
        </div>
        <div id="map-container"></div>
        <div class="map-legend" id="map-legend"></div>
        <div id="map-route-detail"></div>
      </div>`;

    // Build map
    mapInst = L.map('map-container').setView([clinic.lat, clinic.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInst);

    L.marker([clinic.lat, clinic.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div class="map-clinic-marker">拠点</div>`,
        iconSize: [52, 24], iconAnchor: [26, 12],
      }),
    }).bindPopup(`<strong>${clinic.name}</strong><br>${clinic.address}`).addTo(mapInst);

    const routeLayers = {};
    for (const [sid, route] of Object.entries(sRoutes)) {
      const color = route.staff.color;
      const opt = opts[sid];
      const visits = opt?.optimizedOrder || route.visits;

      const points = [
        [clinic.lat, clinic.lng],
        ...visits.map(v => [v.task ? v.task.lat : v.lat, v.task ? v.task.lng : v.lng]),
        [clinic.lat, clinic.lng],
      ];

      const polyline = L.polyline(points, { color, weight: 4, opacity: 0.9 }).addTo(mapInst);
      const markers = [];

      visits.forEach((v, i) => {
        const lat = v.task ? v.task.lat : v.lat;
        const lng = v.task ? v.task.lng : v.lng;
        const name = v.task ? v.task.patientName : v.patientName;
        const start = v.start || '';
        const end = v.end || '';
        const m = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="map-stop-marker" style="background:${color}">${i + 1}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14],
          }),
        }).bindPopup(`
          <div class="map-popup">
            <div class="mp-name">${name}</div>
            <div class="mp-row"><span>スタッフ</span><span>${route.staff.name}</span></div>
            <div class="mp-row"><span>時刻</span><span>${start} – ${end}</span></div>
            <div class="mp-row"><span>移動手段</span><span>${Scheduler.TRANSPORTS[route.staff.transport]?.label || route.staff.transport}</span></div>
          </div>`).addTo(mapInst);
        markers.push(m);
      });

      routeLayers[sid] = { polyline, markers };
    }

    // Legend
    document.getElementById('map-legend').innerHTML = staffWithVisits.map(sid => {
      const s = staff.find(x => x.id === sid);
      return `<div class="map-legend-item"><div style="width:16px;height:4px;background:${s.color};border-radius:2px"></div>${s.name} ${transportBadge(s.transport)}</div>`;
    }).join('');

    highlightStaff(routeLayers, sRoutes);
    renderRouteDetail(sRoutes, opts, clinic);

    document.getElementById('map-staff-select').addEventListener('change', e => {
      activeStaffId = e.target.value;
      highlightStaff(routeLayers, sRoutes);
      renderRouteDetail(sRoutes, opts, clinic);
    });

    setTimeout(() => mapInst?.invalidateSize(), 120);
    return mapInst;
  }

  function highlightStaff(routeLayers, sRoutes) {
    for (const [sid, layer] of Object.entries(routeLayers)) {
      const isActive = sid === activeStaffId;
      layer.polyline.setStyle({ opacity: isActive ? 1 : 0.15, weight: isActive ? 5 : 2 });
      layer.markers.forEach(m => {
        const el = m.getElement();
        if (el) el.style.opacity = isActive ? '1' : '0.2';
      });
    }
  }

  function renderRouteDetail(sRoutes, opts, clinic) {
    const detailEl = document.getElementById('map-route-detail');
    if (!activeStaffId || !sRoutes[activeStaffId]) {
      detailEl.innerHTML = '<div class="no-route-msg">上のリストからスタッフを選択してください。</div>';
      return;
    }

    const route = sRoutes[activeStaffId];
    const s = route.staff;
    const opt = opts[activeStaffId];
    const visits = route.visits;
    const optVisits = opt?.optimizedOrder || visits;

    const origTimes = calcRouteTimes(visits, s.transport, clinic);
    const optTimes = calcRouteTimes(optVisits, s.transport, clinic);
    const timeSaved = origTimes.total - optTimes.total;

    detailEl.innerHTML = `
      <div class="route-detail-panel">
        <div class="rdp-header">
          <span class="staff-avatar" style="background:${s.color}">${s.name[0]}</span>
          <div>
            <div class="rdp-name">${s.name}</div>
            <div class="rdp-role">${s.role}</div>
          </div>
          <div style="margin-left:auto">
            <select class="transport-select-inline" data-staff-id="${s.id}">
              ${Object.entries(Scheduler.TRANSPORTS).map(([k, t]) =>
                `<option value="${k}" ${k === s.transport ? 'selected' : ''}>${t.label} (${t.speed} km/h)</option>`
              ).join('')}
            </select>
          </div>
        </div>

        ${timeSaved > 0 ? `
          <div class="savings-banner">
            <span class="sb-icon">&#9651;</span>
            ルート最適化で <strong>${timeSaved} 分</strong> 短縮できます
          </div>` : `
          <div class="savings-banner optimal">
            <span class="sb-icon">&#10003;</span>
            このルートはすでに最適です
          </div>`}

        <div class="route-compare">
          <div class="rc-col">
            <div class="rc-label">現在の順序 <span class="rc-total">${origTimes.total} 分</span></div>
            ${buildRouteFlowCompact(visits, origTimes.legs, s.color, false)}
          </div>
          ${timeSaved > 0 ? `
          <div class="rc-col">
            <div class="rc-label optimized">最適化後の順序 <span class="rc-total saved">${optTimes.total} 分</span></div>
            ${buildRouteFlowCompact(optVisits, optTimes.legs, s.color, true)}
          </div>` : ''}
        </div>

        <div class="rdp-section-title">移動手段別の所要時間</div>
        <div class="transport-compare">
          ${Object.entries(Scheduler.TRANSPORTS).map(([k, t]) => {
            const total = calcRouteTimes(optVisits, k, clinic).total;
            const isCurrent = k === s.transport;
            return `<div class="tc-row ${isCurrent ? 'current' : ''}">
              <div class="tc-transport">${transportBadge(k)}</div>
              <div class="tc-bar-wrap">
                <div class="tc-bar" style="width:${Math.min(Math.round((total / 120) * 100), 100)}%;background:${t.color}"></div>
              </div>
              <div class="tc-time">${total} 分</div>
              ${isCurrent ? '<div class="tc-tag">使用中</div>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;

    detailEl.querySelector('.transport-select-inline')?.addEventListener('change', e => {
      const staffObj = DEMO_DATA.staff.find(x => x.id === e.target.dataset.staffId);
      if (staffObj) {
        staffObj.transport = e.target.value;
        AppState.refresh();
        mapInst = render(mapInst);
      }
    });
  }

  function calcRouteTimes(visits, transport, clinic) {
    const legs = [];
    let prev = { lat: clinic.lat, lng: clinic.lng };
    let total = 0;
    for (const v of visits) {
      const lat = v.task ? v.task.lat : v.lat;
      const lng = v.task ? v.task.lng : v.lng;
      const t = Scheduler.estimateTravel(prev.lat, prev.lng, lat, lng, transport);
      legs.push(t);
      total += t;
      prev = { lat, lng };
    }
    const ret = Scheduler.estimateTravel(prev.lat, prev.lng, clinic.lat, clinic.lng, transport);
    legs.push(ret);
    total += ret;
    return { legs, total };
  }

  function buildRouteFlowCompact(visits, legs, color, isOptimized) {
    if (!visits.length) return '<div class="empty-msg">訪問先が割り当てられていません。</div>';
    let html = '<div class="route-flow-v">';
    html += `<div class="rfv-node clinic"><div class="rfv-dot" style="background:#ef4444"></div><span>拠点</span></div>`;
    visits.forEach((v, i) => {
      const name = v.task ? v.task.patientName : v.patientName;
      const start = v.start || '–';
      const end = v.end || '–';
      html += `
        <div class="rfv-leg"><span class="rfv-travel">${legs[i]} 分</span></div>
        <div class="rfv-node patient ${isOptimized ? 'opt' : ''}">
          <div class="rfv-num" style="background:${color}">${i + 1}</div>
          <div class="rfv-info">
            <div class="rfv-name">${name}</div>
            <div class="rfv-time">${start} – ${end}</div>
          </div>
        </div>`;
    });
    html += `
      <div class="rfv-leg"><span class="rfv-travel">${legs[visits.length]} 分</span></div>
      <div class="rfv-node clinic"><div class="rfv-dot" style="background:#ef4444"></div><span>Base</span></div>
    </div>`;
    return html;
  }

  return { render };
})();
