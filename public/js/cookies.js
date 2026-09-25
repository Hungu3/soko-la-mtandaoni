(function () {
  const banner = document.querySelector('[data-cookie-banner]');
  const accept = document.querySelector('[data-cookie-accept]');
  if (!banner || !accept) return;
  if (localStorage.getItem('soko-cookie-consent') !== 'accepted') banner.hidden = false;
  accept.addEventListener('click', function () {
    localStorage.setItem('soko-cookie-consent', 'accepted');
    banner.hidden = true;
  });
}());
