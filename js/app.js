/**
 * app.js - Navigation controller. Boots the app and wires up nav links.
 */
const App = (() => {
  let calendarInstance = null;
  let mapInstance = null;

  const PAGE_TITLES = {
    dashboard: 'ダッシュボード',
    schedule:  'スケジュール詳細',
    calendar:  'カレンダー',
    map:       'ルートマップ',
    staff:     'スタッフ',
    patients:  '患者一覧',
    settings:  '設定',
  };

  function init() {
    // Wire sidebar nav
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(link.dataset.page);
      });
    });

    // Global date picker
    document.getElementById('global-date').addEventListener('change', e => {
      AppState.setDate(e.target.value);
      const page = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (page) renderPage(page);
    });

    // Run Schedule button
    document.getElementById('btn-run-schedule').addEventListener('click', () => {
      AppState.setDate(document.getElementById('global-date').value);
      const page = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (page) renderPage(page);
      showToast(`スケジュール実行完了: ${AppState.scheduleResult.assigned.length} 件割り当て済み / ${AppState.scheduleResult.unassigned.length} 件未割り当て`);
    });

    // System selector — switches data source for ALL pages
    document.getElementById('system-select').addEventListener('change', e => {
      AppState.setSystem(e.target.value);
      const page = document.querySelector('.page.active')?.id?.replace('page-', '');
      if (page) renderPage(page);
    });

    // Init state: default to HOMIS
    AppState.initWeeklySchedules();
    AppState.setSystem('HOMIS');
    navigateTo('dashboard');
  }

  function navigateTo(page) {
    // Update nav highlights
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`)?.classList.add('active');

    // Show target page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');

    // Update header title
    document.getElementById('header-title').textContent = PAGE_TITLES[page] || page;

    renderPage(page);
  }

  function renderPage(page) {
    switch (page) {
      case 'dashboard': PageDashboard.render(); break;
      case 'schedule':  PageSchedule.render(); break;
      case 'calendar':  calendarInstance = PageCalendar.render(calendarInstance); break;
      case 'map':       mapInstance = PageMap.render(mapInstance); break;
      case 'staff':     PageStaff.render(); break;
      case 'patients':  PagePatients.render(); break;
      case 'settings':  PageSettings.render(); break;
    }
  }

  return { init, navigateTo };
})();

document.addEventListener('DOMContentLoaded', App.init);
