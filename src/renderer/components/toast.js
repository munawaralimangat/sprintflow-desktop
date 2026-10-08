/**
 * Toast Notification Component
 */

export function showToast(message) {
  const container = document.getElementById('toast-hub');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}
