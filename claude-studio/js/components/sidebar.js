// ==========================================================================
// Claude Studio - App Shell Sidebar Component
// Grouped History (Pinned / Today / Yesterday / Previous 7 Days), Projects, User Card
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.Sidebar = (function () {
  let sidebarEl = null;

  function render(container) {
    sidebarEl = container;
    update();

    // Re-render when store updates
    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (['chat:created', 'chat:deleted', 'chat:renamed', 'chat:pinned', 'chat:selected', 'sidebar:toggle', 'settings:updated', 'project:created', 'project:deleted'].includes(event)) {
        update();
      }
    });
  }

  function update() {
    if (!sidebarEl) return;
    const state = window.ClaudeStudio.Store.getState();
    const activeId = state.activeChatId;
    const isCollapsed = state.isSidebarCollapsed;

    sidebarEl.classList.toggle('sidebar-collapsed', isCollapsed);

    // Group conversations chronologically
    const grouped = groupConversations(state.conversations);

    sidebarEl.innerHTML = `
      <div class="sidebar-top">
        <div class="sidebar-brand-row">
          <div class="brand-identity" onclick="window.ClaudeStudio.Router.navigate('/chat')">
            <div class="brand-mark">
              ${window.ClaudeStudio.Icons.svg('sparkles', 'brand-svg', 16)}
            </div>
            <span class="brand-title">Claude Studio</span>
          </div>
          <button class="icon-btn-ghost btn-collapse-sidebar" title="Toggle Sidebar (Ctrl+B)">
            ${window.ClaudeStudio.Icons.svg('layout-sidebar', 'icon-sm', 16)}
          </button>
        </div>

        <button class="btn btn-primary btn-new-chat" id="btn-new-chat">
          ${window.ClaudeStudio.Icons.svg('plus', 'btn-icon', 16)}
          <span>New Chat</span>
          <kbd class="shortcut-tag">Ctrl+Shift+O</kbd>
        </button>

        <div class="sidebar-nav-links">
          <button class="nav-link-btn ${isActiveRoute('/projects') ? 'active' : ''}" onclick="window.ClaudeStudio.Router.navigate('/projects')">
            ${window.ClaudeStudio.Icons.svg('folder', 'nav-icon', 16)}
            <span>Projects</span>
            <span class="nav-count">${state.projects.length}</span>
          </button>
          <button class="nav-link-btn ${isActiveRoute('/prompts') ? 'active' : ''}" onclick="window.ClaudeStudio.Router.navigate('/prompts')">
            ${window.ClaudeStudio.Icons.svg('bookmark', 'nav-icon', 16)}
            <span>Prompts</span>
            <span class="nav-count">${state.prompts.length}</span>
          </button>
          <button class="nav-link-btn ${isActiveRoute('/library') ? 'active' : ''}" onclick="window.ClaudeStudio.Router.navigate('/library')">
            ${window.ClaudeStudio.Icons.svg('file-text', 'nav-icon', 16)}
            <span>Files</span>
            <span class="nav-count">${state.files.length}</span>
          </button>
        </div>
      </div>

      <div class="sidebar-history-scroll">
        ${renderChatSection('Pinned', grouped.pinned, activeId)}
        ${renderChatSection('Today', grouped.today, activeId)}
        ${renderChatSection('Yesterday', grouped.yesterday, activeId)}
        ${renderChatSection('Previous 7 Days', grouped.last7Days, activeId)}
        ${renderChatSection('Older', grouped.older, activeId)}
      </div>

      <div class="sidebar-footer">
        <div class="user-profile-card" onclick="window.ClaudeStudio.Router.navigate('/settings')">
          <div class="user-avatar">
            ${state.settings.userProfile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div class="user-meta">
            <span class="user-name">${window.ClaudeStudio.Markdown.escapeHtml(state.settings.userProfile.name)}</span>
            <span class="user-role">${window.ClaudeStudio.Markdown.escapeHtml(state.settings.userProfile.role || 'Pro Plan')}</span>
          </div>
          <button class="icon-btn-ghost btn-open-settings" title="Settings">
            ${window.ClaudeStudio.Icons.svg('settings', 'icon-sm', 16)}
          </button>
        </div>
      </div>
    `;

    // Bind event handlers
    sidebarEl.querySelector('.btn-collapse-sidebar')?.addEventListener('click', () => {
      window.ClaudeStudio.Store.toggleSidebar();
    });

    sidebarEl.querySelector('#btn-new-chat')?.addEventListener('click', () => {
      window.ClaudeStudio.Store.createChat();
      window.ClaudeStudio.Router.navigate('/chat');
    });

    // Attach chat item click and context action listeners
    sidebarEl.querySelectorAll('.chat-item-row').forEach(row => {
      const chatId = row.dataset.id;
      row.addEventListener('click', (e) => {
        if (e.target.closest('.chat-item-actions')) return;
        window.ClaudeStudio.Store.setActiveChat(chatId);
        window.ClaudeStudio.Router.navigate(`/chat/${chatId}`);
      });

      row.querySelector('.btn-pin-chat')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ClaudeStudio.Store.pinChat(chatId);
      });

      row.querySelector('.btn-rename-chat')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTitle = row.querySelector('.chat-item-title').textContent;
        const newTitle = prompt('Rename conversation:', currentTitle);
        if (newTitle) {
          window.ClaudeStudio.Store.renameChat(chatId, newTitle);
        }
      });

      row.querySelector('.btn-delete-chat')?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.ClaudeStudio.Components.Modals.confirm({
          title: 'Delete Conversation',
          message: 'Are you sure you want to delete this chat session? This cannot be undone.',
          confirmText: 'Delete',
          onConfirm: () => {
            window.ClaudeStudio.Store.deleteChat(chatId);
            window.ClaudeStudio.Components.Toasts.info('Conversation deleted.');
          }
        });
      });
    });
  }

  function isActiveRoute(path) {
    return window.location.hash.startsWith('#' + path);
  }

  function renderChatSection(title, list, activeId) {
    if (!list || list.length === 0) return '';

    const itemsHtml = list.map(c => `
      <div class="chat-item-row ${c.id === activeId ? 'active' : ''}" data-id="${c.id}">
        ${c.isPinned ? window.ClaudeStudio.Icons.svg('pin', 'chat-pin-icon', 12) : ''}
        <span class="chat-item-title">${window.ClaudeStudio.Markdown.escapeHtml(c.title)}</span>
        <div class="chat-item-actions">
          <button class="chat-action-btn btn-pin-chat" title="${c.isPinned ? 'Unpin' : 'Pin'}">
            ${window.ClaudeStudio.Icons.svg('pin', 'icon-xs', 12)}
          </button>
          <button class="chat-action-btn btn-rename-chat" title="Rename">
            ${window.ClaudeStudio.Icons.svg('edit-2', 'icon-xs', 12)}
          </button>
          <button class="chat-action-btn btn-delete-chat" title="Delete">
            ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 12)}
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div class="sidebar-section">
        <div class="sidebar-section-header">${title}</div>
        <div class="sidebar-section-list">${itemsHtml}</div>
      </div>
    `;
  }

  function groupConversations(chats) {
    const now = Date.now();
    const ONE_DAY = 24 * 3600 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - ONE_DAY;
    const startOf7Days = startOfToday - (7 * ONE_DAY);

    const pinned = [];
    const today = [];
    const yesterday = [];
    const last7Days = [];
    const older = [];

    chats.forEach(c => {
      if (c.isPinned) {
        pinned.push(c);
        return;
      }
      const t = c.updatedAt || c.createdAt;
      if (t >= startOfToday) today.push(c);
      else if (t >= startOfYesterday) yesterday.push(c);
      else if (t >= startOf7Days) last7Days.push(c);
      else older.push(c);
    });

    return { pinned, today, yesterday, last7Days, older };
  }

  return {
    render
  };
})();
