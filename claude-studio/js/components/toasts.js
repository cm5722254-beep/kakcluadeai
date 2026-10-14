// ==========================================================================
// Claude Studio - Toast Notification Stack with Progress & Undo
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.Toasts = (function () {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-stack';
      container.className = 'toast-stack';
      document.body.appendChild(container);
    }
  }

  function show({ title, message, type = 'info', duration = 3800, onUndo = null }) {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-circle';
    if (type === 'danger') iconName = 'alert-circle';

    toast.innerHTML = `
      <div class="toast-icon-wrap">
        ${window.ClaudeStudio.Icons.svg(iconName, 'toast-svg', 16)}
      </div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${window.ClaudeStudio.Markdown.escapeHtml(title)}</div>` : ''}
        <div class="toast-msg">${window.ClaudeStudio.Markdown.escapeHtml(message || '')}</div>
      </div>
      ${onUndo ? `<button class="toast-undo-btn">Undo</button>` : ''}
      <button class="toast-close-btn" aria-label="Close notification">
        ${window.ClaudeStudio.Icons.svg('x', 'toast-close-svg', 13)}
      </button>
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
    `;

    if (onUndo) {
      toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        onUndo();
        dismiss(toast);
      });
    }

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      dismiss(toast);
    });

    container.appendChild(toast);

    const timer = setTimeout(() => {
      dismiss(toast);
    }, duration);

    toast._timer = timer;
    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast._isDismissing) return;
    toast._isDismissing = true;
    clearTimeout(toast._timer);
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 240);
  }

  return {
    show,
    success(msg, title) { return show({ message: msg, title, type: 'success' }); },
    error(msg, title) { return show({ message: msg, title, type: 'danger', duration: 5000 }); },
    warning(msg, title) { return show({ message: msg, title, type: 'warning' }); },
    info(msg, title) { return show({ message: msg, title, type: 'info' }); }
  };
})();
