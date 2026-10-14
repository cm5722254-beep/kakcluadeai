// ==========================================================================
// Claude Studio - Prompt Templates Library Component
// Search, Filter by Category, Variables Fill-in Modal, Favorites, and Direct Usage
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.PromptsView = (function () {
  let viewEl = null;
  let activeCategory = 'All';
  let searchQuery = '';

  function render(container) {
    viewEl = container;
    update();

    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (['prompt:created', 'prompt:updated', 'prompt:deleted', 'prompt:favorite', 'prompt:used'].includes(event)) {
        update();
      }
    });
  }

  function update() {
    if (!viewEl) return;
    const state = window.ClaudeStudio.Store.getState();

    const categories = ['All', ...new Set(state.prompts.map(p => p.category))];

    const filtered = state.prompts.filter(p => {
      const matchCat = (activeCategory === 'All') || (p.category === activeCategory);
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.template.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });

    viewEl.innerHTML = `
      <div class="prompts-page-container">
        <div class="page-header-row">
          <div>
            <h1 class="page-main-title">Prompt Templates</h1>
            <p class="page-subtitle">Production-grade system instructions with dynamic parameterized variables.</p>
          </div>
          <button class="btn btn-primary" id="btn-create-prompt">
            ${window.ClaudeStudio.Icons.svg('plus', 'btn-icon', 16)}
            <span>New Template</span>
          </button>
        </div>

        <!-- Filters Bar -->
        <div class="prompts-filter-bar">
          <div class="search-input-pill">
            ${window.ClaudeStudio.Icons.svg('search', 'search-icon', 15)}
            <input type="text" id="prompts-search-input" value="${window.ClaudeStudio.Markdown.escapeHtml(searchQuery)}" placeholder="Search 15+ prompt templates...">
          </div>

          <div class="category-tabs-scroll">
            ${categories.map(c => `
              <button class="cat-pill-btn ${activeCategory === c ? 'active' : ''}" data-cat="${c}">${c}</button>
            `).join('')}
          </div>
        </div>

        <!-- Prompts Grid -->
        <div class="prompts-grid">
          ${filtered.length === 0 ? '<div class="empty-state">No prompt templates match your search.</div>' : ''}
          ${filtered.map(p => `
            <div class="prompt-card" data-id="${p.id}">
              <div class="prompt-card-top">
                <span class="prompt-category-badge">${window.ClaudeStudio.Markdown.escapeHtml(p.category)}</span>
                <div class="prompt-card-actions">
                  <button class="icon-btn-ghost btn-fav-prompt ${p.isFavorite ? 'favorite' : ''}" data-id="${p.id}" title="Favorite">
                    ${window.ClaudeStudio.Icons.svg(p.isFavorite ? 'bookmark-check' : 'bookmark', 'icon-xs', 14)}
                  </button>
                  <button class="icon-btn-ghost btn-edit-prompt" data-id="${p.id}" title="Edit">
                    ${window.ClaudeStudio.Icons.svg('edit-2', 'icon-xs', 14)}
                  </button>
                  <button class="icon-btn-ghost btn-del-prompt" data-id="${p.id}" title="Delete">
                    ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 14)}
                  </button>
                </div>
              </div>

              <h3 class="prompt-title">${window.ClaudeStudio.Markdown.escapeHtml(p.title)}</h3>
              <p class="prompt-desc">${window.ClaudeStudio.Markdown.escapeHtml(p.description)}</p>

              <!-- Variables Badges -->
              ${p.variables && p.variables.length > 0 ? `
                <div class="prompt-vars-row">
                  ${p.variables.map(v => `<span class="var-badge">{{${v}}}</span>`).join('')}
                </div>
              ` : ''}

              <div class="prompt-card-footer">
                <span class="prompt-usage-tag">${p.usageCount || 0} uses</span>
                <button class="btn btn-primary btn-sm btn-use-prompt" data-id="${p.id}">
                  Use in Chat →
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind Search Input
    const searchInput = viewEl.querySelector('#prompts-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      update();
      // Keep focus on input after re-render
      setTimeout(() => {
        const inp = viewEl.querySelector('#prompts-search-input');
        if (inp) {
          inp.focus();
          inp.setSelectionRange(inp.value.length, inp.value.length);
        }
      }, 10);
    });

    // Bind Category filter tabs
    viewEl.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeCategory = e.currentTarget.dataset.cat;
        update();
      });
    });

    // Create prompt modal
    viewEl.querySelector('#btn-create-prompt')?.addEventListener('click', () => {
      openPromptEditorModal();
    });

    // Actions on individual prompt cards
    viewEl.querySelectorAll('.btn-use-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const p = state.prompts.find(x => x.id === id);
        if (!p) return;

        window.ClaudeStudio.Store.incrementPromptUsage(id);

        if (p.variables && p.variables.length > 0) {
          window.ClaudeStudio.Components.Modals.promptVariables({
            promptTemplate: p,
            onApply: (filled) => {
              window.ClaudeStudio.Store.createChat(filled);
              window.ClaudeStudio.Router.navigate('/chat');
            }
          });
        } else {
          window.ClaudeStudio.Store.createChat(p.template);
          window.ClaudeStudio.Router.navigate('/chat');
        }
      });
    });

    viewEl.querySelectorAll('.btn-fav-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.ClaudeStudio.Store.toggleFavoritePrompt(id);
      });
    });

    viewEl.querySelectorAll('.btn-edit-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const p = state.prompts.find(x => x.id === id);
        if (p) openPromptEditorModal(p);
      });
    });

    viewEl.querySelectorAll('.btn-del-prompt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.ClaudeStudio.Components.Modals.confirm({
          title: 'Delete Prompt Template',
          message: 'Are you sure you want to permanently delete this prompt template?',
          confirmText: 'Delete',
          onConfirm: () => {
            window.ClaudeStudio.Store.deletePrompt(id);
            window.ClaudeStudio.Components.Toasts.info('Prompt template removed.');
          }
        });
      });
    });
  }

  function openPromptEditorModal(existing = null) {
    const isEdit = !!existing;
    const content = `
      <div class="form-group">
        <label class="form-label">Template Title *</label>
        <input type="text" id="modal-pr-title" class="form-input" value="${existing ? window.ClaudeStudio.Markdown.escapeHtml(existing.title) : ''}" placeholder="e.g. Real Production UI Component">
      </div>
      <div class="form-row-2 mt-2">
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" id="modal-pr-cat" class="form-input" value="${existing ? window.ClaudeStudio.Markdown.escapeHtml(existing.category) : 'Frontend'}" placeholder="e.g. Architecture">
        </div>
        <div class="form-group">
          <label class="form-label">Variables (comma separated)</label>
          <input type="text" id="modal-pr-vars" class="form-input" value="${existing ? window.ClaudeStudio.Markdown.escapeHtml(existing.variables?.join(', ') || '') : ''}" placeholder="e.g. component_name, framework">
        </div>
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Short Description</label>
        <input type="text" id="modal-pr-desc" class="form-input" value="${existing ? window.ClaudeStudio.Markdown.escapeHtml(existing.description) : ''}" placeholder="Brief summary of what this prompt achieves...">
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Prompt Template Body *</label>
        <textarea id="modal-pr-body" class="form-textarea" rows="7" placeholder="Use {{variable_name}} syntax for dynamic insertions...">${existing ? window.ClaudeStudio.Markdown.escapeHtml(existing.template) : ''}</textarea>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
      <button class="btn btn-primary modal-save-btn">${isEdit ? 'Save Changes' : 'Create Template'}</button>
    `;

    const modal = window.ClaudeStudio.Components.Modals.open({
      title: isEdit ? 'Edit Prompt Template' : 'New Prompt Template',
      contentHtml: content,
      footerHtml: footer,
      size: 'lg'
    });

    modal.querySelector('.modal-cancel-btn').addEventListener('click', () => {
      window.ClaudeStudio.Components.Modals.close();
    });

    modal.querySelector('.modal-save-btn').addEventListener('click', () => {
      const title = modal.querySelector('#modal-pr-title').value.trim();
      const cat = modal.querySelector('#modal-pr-cat').value.trim() || 'General';
      const desc = modal.querySelector('#modal-pr-desc').value.trim();
      const template = modal.querySelector('#modal-pr-body').value.trim();
      const varsRaw = modal.querySelector('#modal-pr-vars').value.trim();
      const variables = varsRaw ? varsRaw.split(',').map(s => s.trim().replace(/[{}]/g, '')).filter(Boolean) : [];

      if (!title || !template) {
        alert('Please fill in both Title and Template Body.');
        return;
      }

      if (isEdit) {
        window.ClaudeStudio.Store.updatePrompt(existing.id, { title, category: cat, description: desc, template, variables });
        window.ClaudeStudio.Components.Toasts.success('Prompt template updated!');
      } else {
        window.ClaudeStudio.Store.createPrompt({ title, category: cat, description: desc, template, variables });
        window.ClaudeStudio.Components.Toasts.success('New prompt template created!');
      }

      window.ClaudeStudio.Components.Modals.close();
    });
  }

  return {
    render
  };
})();
