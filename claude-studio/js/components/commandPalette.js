// ==========================================================================
// Claude Studio - Command Palette (Ctrl+K)
// Fuzzy search across Conversations, Projects, Prompts, and Core Actions
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.CommandPalette = (function () {
  let paletteOverlay = null;
  let selectedIndex = 0;
  let currentItems = [];

  function open() {
    close();

    paletteOverlay = document.createElement('div');
    paletteOverlay.className = 'palette-backdrop';

    paletteOverlay.innerHTML = `
      <div class="palette-modal">
        <div class="palette-input-wrap">
          ${window.ClaudeStudio.Icons.svg('search', 'palette-search-icon', 18)}
          <input type="text" class="palette-input" placeholder="Search chats, projects, prompts, actions... (Esc to close)" autocomplete="off">
          <kbd class="palette-esc-badge">ESC</kbd>
        </div>
        <div class="palette-results" id="palette-results"></div>
        <div class="palette-footer">
          <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span>Press <kbd>↵</kbd> to select</span>
        </div>
      </div>
    `;

    const input = paletteOverlay.querySelector('.palette-input');
    const resultsContainer = paletteOverlay.querySelector('#palette-results');

    paletteOverlay.addEventListener('click', (e) => {
      if (e.target === paletteOverlay) close();
    });

    input.addEventListener('input', () => {
      renderResults(input.value.trim(), resultsContainer);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % Math.max(1, currentItems.length);
        updateActiveItem(resultsContainer);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + currentItems.length) % Math.max(1, currentItems.length);
        updateActiveItem(resultsContainer);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentItems[selectedIndex]) {
          executeItem(currentItems[selectedIndex]);
        }
      }
    });

    document.body.appendChild(paletteOverlay);
    renderResults('', resultsContainer);

    setTimeout(() => input.focus(), 30);
  }

  function close() {
    if (!paletteOverlay) return;
    paletteOverlay.remove();
    paletteOverlay = null;
  }

  function buildAllItems() {
    const state = window.ClaudeStudio.Store.getState();
    const items = [];

    // Global Actions
    items.push({
      type: 'action',
      title: 'New Conversation',
      subtitle: 'Create a fresh chat session',
      icon: 'plus',
      action: () => {
        window.ClaudeStudio.Store.createChat();
        window.ClaudeStudio.Router.navigate('/chat');
      }
    });
    items.push({
      type: 'action',
      title: 'View Projects',
      subtitle: 'Open workspace projects directory',
      icon: 'folder',
      action: () => window.ClaudeStudio.Router.navigate('/projects')
    });
    items.push({
      type: 'action',
      title: 'Prompt Templates Library',
      subtitle: 'Browse 15+ production prompt patterns',
      icon: 'bookmark',
      action: () => window.ClaudeStudio.Router.navigate('/prompts')
    });
    items.push({
      type: 'action',
      title: 'Knowledge Files Repository',
      subtitle: 'Manage uploaded context files',
      icon: 'file-text',
      action: () => window.ClaudeStudio.Router.navigate('/library')
    });
    items.push({
      type: 'action',
      title: 'Toggle Color Theme (Dark / Light)',
      subtitle: 'Switch application color mode',
      icon: 'sun',
      action: () => {
        const cur = state.settings.theme;
        window.ClaudeStudio.Store.updateSettings({ theme: cur === 'dark' ? 'light' : 'dark' });
      }
    });
    items.push({
      type: 'action',
      title: 'Keyboard Shortcuts Reference',
      subtitle: 'View all shortcut keybindings',
      icon: 'help-circle',
      action: () => window.ClaudeStudio.Components.Modals.shortcutsHelp()
    });

    // Conversations
    state.conversations.forEach(c => {
      items.push({
        type: 'chat',
        title: c.title,
        subtitle: `${c.messages.length} messages`,
        icon: 'message-square',
        action: () => {
          window.ClaudeStudio.Store.setActiveChat(c.id);
          window.ClaudeStudio.Router.navigate(`/chat/${c.id}`);
        }
      });
    });

    // Projects
    state.projects.forEach(p => {
      items.push({
        type: 'project',
        title: p.name,
        subtitle: p.description,
        icon: p.icon || 'layers',
        action: () => {
          window.ClaudeStudio.Router.navigate(`/projects/${p.id}`);
        }
      });

      // Project Tasks & Steps
      (p.tasks || []).forEach(t => {
        items.push({
          type: 'step',
          title: t.title,
          subtitle: `${p.name} • ${t.priority.toUpperCase()} priority • ${t.completed ? 'Completed' : 'To Do'}`,
          icon: t.completed ? 'check-circle' : 'check-square',
          action: () => {
            window.ClaudeStudio.Router.navigate(`/projects/${p.id}`);
          }
        });
      });
    });

    // Prompts
    state.prompts.forEach(pr => {
      items.push({
        type: 'prompt',
        title: pr.title,
        subtitle: `[${pr.category}] ${pr.description}`,
        icon: 'sparkles',
        action: () => {
          window.ClaudeStudio.Components.Modals.promptVariables({
            promptTemplate: pr,
            onApply: (filled) => {
              window.ClaudeStudio.Store.createChat(filled);
              window.ClaudeStudio.Router.navigate('/chat');
            }
          });
        }
      });
    });

    return items;
  }

  function renderResults(query, container) {
    const all = buildAllItems();
    const q = query.toLowerCase();

    currentItems = all.filter(item => {
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q));
    }).slice(0, 16);

    selectedIndex = 0;
    container.innerHTML = '';

    if (currentItems.length === 0) {
      container.innerHTML = '<div class="palette-empty">No results found matching your query.</div>';
      return;
    }

    currentItems.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = `palette-item ${idx === 0 ? 'active' : ''}`;
      el.innerHTML = `
        <div class="palette-item-icon">
          ${window.ClaudeStudio.Icons.svg(item.icon, 'p-icon', 16)}
        </div>
        <div class="palette-item-text">
          <div class="p-title">${window.ClaudeStudio.Markdown.escapeHtml(item.title)}</div>
          <div class="p-sub">${window.ClaudeStudio.Markdown.escapeHtml(item.subtitle || '')}</div>
        </div>
        <span class="p-badge">${item.type.toUpperCase()}</span>
      `;

      el.addEventListener('click', () => {
        executeItem(item);
      });

      container.appendChild(el);
    });
  }

  function updateActiveItem(container) {
    const items = container.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('active', idx === selectedIndex);
      if (idx === selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function executeItem(item) {
    close();
    if (item && item.action) {
      item.action();
    }
  }

  return {
    open,
    close
  };
})();
