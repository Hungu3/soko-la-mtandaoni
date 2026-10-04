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

const firstInvalidField = document.querySelector('.input-invalid, .field-invalid');
if (firstInvalidField) {
  firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  firstInvalidField.focus?.({ preventScroll: true });
}
