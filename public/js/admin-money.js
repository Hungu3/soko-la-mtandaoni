(function () {
  const rates = { TSH: 1, USD: 1 / 2600, EUR: 1 / 2900 };
  const select = document.querySelector('[data-admin-currency]');
  if (!select) return;
  const render = () => {
    const currency = select.value;
    document.querySelectorAll('[data-admin-money]').forEach((node) => {
      const value = Number(node.dataset.adminMoney || 0) * rates[currency];
      node.textContent = `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
    });
  };
  select.addEventListener('change', () => {
    localStorage.setItem('soko-currency', select.value);
    document.dispatchEvent(new CustomEvent('soko-currency-changed', { detail: select.value }));
    render();
  });
  document.addEventListener('soko-currency-changed', event => {
    select.value = event.detail;
    render();
  });
  render();
}());
