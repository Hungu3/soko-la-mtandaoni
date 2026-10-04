document.querySelectorAll('[data-password-toggle]').forEach((button) => {
  const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
  if (!input) return;

  button.addEventListener('click', () => {
    const showing = input.type === 'password';
    input.type = showing ? 'text' : 'password';
    button.textContent = showing ? 'Ficha' : 'Onyesha';
    button.setAttribute('aria-label', showing ? 'Ficha password' : 'Onyesha password');
  });
});

document.querySelectorAll('[data-google-map-input]').forEach((input) => {
  const link = input.closest('.field').querySelector('[data-google-map-link]');
  if (!link) return;

  const updateMapLink = () => {
    const location = input.value.trim();
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    link.hidden = !location;
  };

  input.addEventListener('input', updateMapLink);
  updateMapLink();
});

const firstInvalidField = document.querySelector('.input-invalid, .field-invalid');
if (firstInvalidField) {
  firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  firstInvalidField.focus?.({ preventScroll: true });
}
