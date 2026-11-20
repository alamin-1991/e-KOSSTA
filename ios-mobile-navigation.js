/* e-KOSSTA iPhone-only sidebar drawer.
   Sidebar remains closed by default; Android and other devices do not use this handler. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('ios-device')) return;

  var button = document.getElementById('iosSidebarToggle');
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('iosSidebarBackdrop');
  if (!button || !sidebar || !backdrop) return;

  function openSidebar() {
    root.classList.add('ios-sidebar-open');
    backdrop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Tutup menu navigasi');
    document.body.classList.add('ios-sidebar-lock');
  }

  function closeSidebar() {
    root.classList.remove('ios-sidebar-open');
    backdrop.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Buka menu navigasi');
    document.body.classList.remove('ios-sidebar-lock');
  }

  button.addEventListener('click', function () {
    if (root.classList.contains('ios-sidebar-open')) closeSidebar();
    else openSidebar();
  });

  backdrop.addEventListener('click', closeSidebar);

  sidebar.addEventListener('click', function (event) {
    if (event.target.closest('button[data-page], button[data-analysis-route], button[data-main-group]')) {
      closeSidebar();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeSidebar();
  });

  window.addEventListener('orientationchange', closeSidebar);
})();
