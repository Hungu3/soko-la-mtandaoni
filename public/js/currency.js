(function () {
  const rates = { TSH: 1, USD: 1 / 2600, EUR: 1 / 2900 };
  const symbols = { TSH: 'TSH', USD: 'USD', EUR: 'EUR' };
  const originals = new WeakMap();

  function format(value, currency) {
    return `${(value * (rates[currency] || 1)).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${symbols[currency] || 'TSH'}`;
  }

  function render(currency) {
    document.querySelectorAll('[data-admin-money]').forEach(node => {
      const value = Number(node.dataset.adminMoney || 0);
      node.textContent = format(value, currency);
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      const original = originals.get(textNode) || textNode.nodeValue;
      if (!/\bTSH\b/.test(original)) return;
      originals.set(textNode, original);
      textNode.nodeValue = original.replace(/(\d[\d,]*(?:\.\d+)?)\s*TSH\b/g, (_, amount) => {
        const numeric = Number(amount.replace(/,/g, ''));
        return Number.isFinite(numeric) ? format(numeric, currency) : `${amount} TSH`;
      });
    });
  }

  const current = () => localStorage.getItem('soko-currency') || 'TSH';
  document.addEventListener('soko-currency-changed', event => render(event.detail));
  window.addEventListener('storage', event => {
    if (event.key === 'soko-currency') render(event.newValue || 'TSH');
  });
  render(current());
}());
