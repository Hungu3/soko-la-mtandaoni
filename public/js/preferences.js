(function () {
  const translations = {
    sw: { home: 'Nyumbani', search: 'Tafuta Bidhaa', levels: 'Viwango', about: 'Kuhusu', login: 'Ingia', open: 'Fungua Duka' },
    en: { home: 'Home', search: 'Search Products', levels: 'Plans', about: 'About', login: 'Login', open: 'Open a Shop' }
  };
  const language = localStorage.getItem('soko-language') || 'sw';
  const currency = localStorage.getItem('soko-currency') || 'TSH';
  const langSelect = document.querySelector('[data-language]');
  const currencySelect = document.querySelector('[data-currency]');
  if (langSelect) langSelect.value = language;
  if (currencySelect) currencySelect.value = currency;
  document.documentElement.lang = language;

  function applyLanguage(value) {
    const t = translations[value] || translations.sw;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.dataset.i18n;
      if (t[key]) node.textContent = t[key];
    });
    localStorage.setItem('soko-language', value);
    document.documentElement.lang = value;
  }
  if (langSelect) langSelect.addEventListener('change', event => applyLanguage(event.target.value));
  if (currencySelect) currencySelect.addEventListener('change', event => {
    localStorage.setItem('soko-currency', event.target.value);
    document.dispatchEvent(new CustomEvent('soko-currency-changed', { detail: event.target.value }));
  });
  applyLanguage(language);
}());
