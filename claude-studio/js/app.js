// ==========================================================================
// Claude Studio - Main Application Bootstrapper
// Orchestrates Router, Store, Keyboard Shortcuts, and Component Lifecycles
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

document.addEventListener('DOMContentLoaded', () => {
  const sidebarContainer = document.getElementById('app-sidebar');
  const mainContentContainer = document.getElementById('app-main-content');
  const artifactsContainer = document.getElementById('app-artifacts-panel');

  const store = window.ClaudeStudio.Store;
  const router = window.ClaudeStudio.Router;
  const components = window.ClaudeStudio.Components;

  // 1. Initialize Theme & Accent from Store
  const initialSettings = store.getState().settings;
  document.body.className = `theme-${initialSettings.theme} accent-${initialSettings.accent}`;

  // 2. Initialize Permanent Shell Components
  components.Sidebar.render(sidebarContainer);
  components.ArtifactsPanel.render(artifactsContainer);

  // 3. Register Routes
  router.add('/chat', 'chat-index', () => {
    components.ChatView.render(mainContentContainer);
  });

  router.add('/chat/:id', 'chat-detail', (params) => {
    store.setActiveChat(params.id);
    components.ChatView.render(mainContentContainer);
  });

  router.add('/projects', 'projects-list', () => {
    components.ProjectsView.renderList(mainContentContainer);
  });

  router.add('/projects/:id', 'projects-detail', (params) => {
    components.ProjectsView.renderDetail(mainContentContainer, params.id);
  });

  router.add('/prompts', 'prompts-list', () => {
    components.PromptsView.render(mainContentContainer);
  });

  router.add('/library', 'files-list', () => {
    components.FilesView.render(mainContentContainer);
  });

  router.add('/settings', 'settings-page', () => {
    components.SettingsView.render(mainContentContainer);
  });

  // 4. Start Router
  router.init();

  // 5. Global Keyboard Shortcuts Listener
  document.addEventListener('keydown', (e) => {
    // Ctrl+K: Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      components.CommandPalette.open();
      return;
    }

    // Ctrl+Shift+O: New Chat
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      store.createChat();
      router.navigate('/chat');
      return;
    }

    // Ctrl+B: Toggle Sidebar
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      store.toggleSidebar();
      return;
    }

    // Escape: Close active modals or artifacts
    if (e.key === 'Escape') {
      components.Modals.close();
      components.CommandPalette.close();
      return;
    }

    // ?: Keyboard Shortcuts Help Modal (only when not typing in input)
    if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      components.Modals.shortcutsHelp();
      return;
    }

    // /: Focus Composer textarea (when not typing elsewhere)
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const textarea = document.getElementById('composer-textarea');
      if (textarea) textarea.focus();
      return;
    }

    // Up Arrow: Edit last sent message (when composer is focused and empty)
    if (e.key === 'ArrowUp' && document.activeElement.id === 'composer-textarea' && !document.activeElement.value) {
      e.preventDefault();
      const state = store.getState();
      const chat = state.conversations.find(c => c.id === state.activeChatId);
      if (chat) {
        const lastUserMsg = [...chat.messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
          document.activeElement.value = lastUserMsg.content;
          document.activeElement.dispatchEvent(new Event('input'));
        }
      }
    }
  });

  // Offline / Online Status Detection Banner
  window.addEventListener('offline', () => {
    components.Toasts.warning('You are currently working in offline mode. Local simulation remains active.', 'Offline Mode');
  });

  window.addEventListener('online', () => {
    components.Toasts.success('Connection restored.', 'Online');
  });
});
