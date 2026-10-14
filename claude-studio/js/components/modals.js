// ==========================================================================
// Claude Studio - Global Modal Manager (Focus Trap + Esc Close)
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.Modals = (function () {
  let activeModalEl = null;

  function open({ title, contentHtml, footerHtml = '', size = 'md', onClose = null }) {
    close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <div class="modal-dialog modal-${size}">
        <div class="modal-header">
          <h3 class="modal-title">${window.ClaudeStudio.Markdown.escapeHtml(title)}</h3>
          <button class="modal-close-btn" aria-label="Close modal">
            ${window.ClaudeStudio.Icons.svg('x', 'modal-close-svg', 16)}
          </button>
        </div>
        <div class="modal-body">${contentHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }

    overlay.querySelector('.modal-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', handleKeyDown);
    overlay._keyHandler = handleKeyDown;
    overlay._onClose = onClose;

    document.body.appendChild(overlay);
    activeModalEl = overlay;

    // Focus first input or close button
    setTimeout(() => {
      const focusable = overlay.querySelector('input, textarea, select, button.btn-primary, button.modal-close-btn');
      if (focusable) focusable.focus();
    }, 40);

    return overlay;
  }

  function close() {
    if (!activeModalEl) return;
    document.removeEventListener('keydown', activeModalEl._keyHandler);
    if (activeModalEl._onClose) activeModalEl._onClose();
    activeModalEl.classList.add('modal-backdrop-exit');
    const el = activeModalEl;
    activeModalEl = null;
    setTimeout(() => el.remove(), 180);
  }

  // ------------------------------------------------------------------------
  // Built-in Standard Dialogs
  // ------------------------------------------------------------------------
  function confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', confirmStyle = 'danger', onConfirm }) {
    const content = `<p class="confirm-message">${window.ClaudeStudio.Markdown.escapeHtml(message)}</p>`;
    const footer = `
      <button class="btn btn-secondary modal-btn-cancel">Cancel</button>
      <button class="btn btn-${confirmStyle} modal-btn-confirm">${confirmText}</button>
    `;

    const modal = open({ title, contentHtml: content, footerHtml: footer, size: 'sm' });
    modal.querySelector('.modal-btn-cancel').addEventListener('click', close);
    modal.querySelector('.modal-btn-confirm').addEventListener('click', () => {
      close();
      onConfirm();
    });
  }

  function promptVariables({ promptTemplate, onApply }) {
    const variables = promptTemplate.variables || [];
    let fieldsHtml = '';

    variables.forEach(v => {
      const label = v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      fieldsHtml += `
        <div class="form-group">
          <label class="form-label">${label}</label>
          <input type="text" class="form-input var-input" data-var="${v}" placeholder="Enter ${label.toLowerCase()}...">
        </div>
      `;
    });

    const footer = `
      <button class="btn btn-secondary modal-btn-cancel">Cancel</button>
      <button class="btn btn-primary modal-btn-use">Use in Chat</button>
    `;

    const modal = open({
      title: `Fill Variables: ${promptTemplate.title}`,
      contentHtml: `<div class="var-form">${fieldsHtml}</div>`,
      footerHtml: footer,
      size: 'md'
    });

    modal.querySelector('.modal-btn-cancel').addEventListener('click', close);
    modal.querySelector('.modal-btn-use').addEventListener('click', () => {
      let filled = promptTemplate.template;
      modal.querySelectorAll('.var-input').forEach(input => {
        const key = input.dataset.var;
        const val = input.value.trim() || `[${key}]`;
        const regex = new RegExp(`{{${key}}}`, 'g');
        filled = filled.replace(regex, val);
      });
      close();
      onApply(filled);
    });
  }

  function shortcutsHelp() {
    const shortcuts = [
      { key: 'Ctrl + K', desc: 'Open Command Palette' },
      { key: 'Ctrl + Shift + O', desc: 'Create New Chat' },
      { key: 'Ctrl + B', desc: 'Toggle Sidebar' },
      { key: '/', desc: 'Focus Message Composer' },
      { key: 'Up Arrow', desc: 'Edit Last Sent Message' },
      { key: 'Enter', desc: 'Send Message' },
      { key: 'Shift + Enter', desc: 'Insert Newline' },
      { key: '?', desc: 'Open Keyboard Shortcuts' },
      { key: 'Esc', desc: 'Close Modals / Overlays' }
    ];

    let rows = shortcuts.map(s => `
      <div class="shortcut-row">
        <span class="shortcut-desc">${s.desc}</span>
        <kbd class="shortcut-kbd">${s.key}</kbd>
      </div>
    `).join('');

    open({
      title: 'Keyboard Shortcuts',
      contentHtml: `<div class="shortcuts-list">${rows}</div>`,
      size: 'md'
    });
  }

  return {
    open,
    close,
    confirm,
    promptVariables,
    shortcutsHelp
  };
})();
