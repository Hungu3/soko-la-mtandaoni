(function () {
  const saved = localStorage.getItem('soko-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const label = button.querySelector('[data-theme-label]');
      const icon = button.querySelector('.theme-icon');
      if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
      if (icon) icon.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
      button.setAttribute('aria-label', theme === 'dark' ? 'Washa light mode' : 'Washa dark mode');
      button.title = theme === 'dark' ? 'Washa light mode' : 'Washa dark mode';
    });
  }

  applyTheme(initial);
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (!button) return;
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('soko-theme', next);
    applyTheme(next);
  });
}());
