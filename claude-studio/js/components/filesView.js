// ==========================================================================
// Claude Studio - Knowledge Files Repository Component
// Grid/List View Toggle, Drag & Drop Upload, File Preview Drawer, Sorting
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.FilesView = (function () {
  let viewEl = null;
  let viewMode = 'grid'; // 'grid' | 'list'
  let activePreviewFile = null;

  function render(container) {
    viewEl = container;
    update();

    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (['file:added', 'file:deleted'].includes(event)) {
        update();
      }
    });
  }

  function update() {
    if (!viewEl) return;
    const state = window.ClaudeStudio.Store.getState();

    viewEl.innerHTML = `
      <div class="files-page-container">
        <div class="page-header-row">
          <div>
            <h1 class="page-main-title">Knowledge Files</h1>
            <p class="page-subtitle">Repository of context files, schemas, and specifications available across all workspaces.</p>
          </div>

          <div class="header-action-group">
            <div class="view-mode-toggle">
              <button class="view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}" id="btn-view-grid" title="Grid View">
                ${window.ClaudeStudio.Icons.svg('grid', 'icon-sm', 15)}
              </button>
              <button class="view-toggle-btn ${viewMode === 'list' ? 'active' : ''}" id="btn-view-list" title="List View">
                ${window.ClaudeStudio.Icons.svg('list', 'icon-sm', 15)}
              </button>
            </div>

            <button class="btn btn-primary" id="btn-upload-file">
              ${window.ClaudeStudio.Icons.svg('upload-cloud', 'btn-icon', 16)}
              <span>Upload Files</span>
              <input type="file" id="library-file-input" multiple style="display:none;">
            </button>
          </div>
        </div>

        <!-- Drag & Drop Upload Zone -->
        <div class="drag-drop-zone" id="drag-drop-zone">
          <div class="drop-icon">
            ${window.ClaudeStudio.Icons.svg('upload-cloud', 'drop-svg', 28)}
          </div>
          <div class="drop-title">Drop documents, code files, or schemas here to upload</div>
          <div class="drop-sub">Supported formats: Markdown, JSON, TypeScript, Python, CSV, PDF, YAML (up to 50MB)</div>
        </div>

        <!-- Files Display Area -->
        <div class="files-display-wrapper">
          <div class="files-content-pane">
            ${viewMode === 'grid' ? renderGrid(state.files) : renderList(state.files)}
          </div>

          <!-- File Preview Drawer -->
          <div class="file-preview-drawer ${activePreviewFile ? '' : 'hidden'}" id="file-preview-drawer">
            ${activePreviewFile ? renderPreviewDrawer(activePreviewFile) : ''}
          </div>
        </div>
      </div>
    `;

    // View toggle listeners
    viewEl.querySelector('#btn-view-grid')?.addEventListener('click', () => {
      viewMode = 'grid';
      update();
    });

    viewEl.querySelector('#btn-view-list')?.addEventListener('click', () => {
      viewMode = 'list';
      update();
    });

    // Upload Trigger
    const fileInput = viewEl.querySelector('#library-file-input');
    viewEl.querySelector('#btn-upload-file')?.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      handleFilesUpload(Array.from(e.target.files));
      fileInput.value = '';
    });

    // Drag & Drop handlers
    const dropZone = viewEl.querySelector('#drag-drop-zone');
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files) {
        handleFilesUpload(Array.from(e.dataTransfer.files));
      }
    });

    // File item click (Select for preview)
    viewEl.querySelectorAll('.file-selectable-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.file-delete-btn')) return;
        const fileId = item.dataset.id;
        activePreviewFile = state.files.find(f => f.id === fileId);
        update();
      });
    });

    // Delete file buttons
    viewEl.querySelectorAll('.file-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fileId = btn.dataset.id;
        window.ClaudeStudio.Components.Modals.confirm({
          title: 'Delete Knowledge File',
          message: 'Are you sure you want to remove this file from the knowledge repository?',
          confirmText: 'Delete',
          onConfirm: () => {
            window.ClaudeStudio.Store.deleteFile(fileId);
            if (activePreviewFile?.id === fileId) activePreviewFile = null;
            window.ClaudeStudio.Components.Toasts.info('File removed from library.');
          }
        });
      });
    });

    // Close preview drawer
    viewEl.querySelector('.btn-close-preview')?.addEventListener('click', () => {
      activePreviewFile = null;
      update();
    });
  }

  function renderGrid(files) {
    if (files.length === 0) return '<div class="empty-state">No files uploaded yet. Drop files above to get started.</div>';

    return `
      <div class="files-grid">
        ${files.map(f => `
          <div class="file-card file-selectable-item ${activePreviewFile?.id === f.id ? 'active' : ''}" data-id="${f.id}">
            <div class="file-card-header">
              <div class="file-ext-badge ${f.type}">
                ${getFileTypeLabel(f.name)}
              </div>
              <button class="icon-btn-ghost file-delete-btn" data-id="${f.id}" title="Delete file">
                ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 14)}
              </button>
            </div>
            <div class="file-card-name" title="${window.ClaudeStudio.Markdown.escapeHtml(f.name)}">
              ${window.ClaudeStudio.Markdown.escapeHtml(f.name)}
            </div>
            <div class="file-card-meta">
              <span>${f.size}</span>
              <span>•</span>
              <span>${formatDate(f.uploadedAt)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderList(files) {
    if (files.length === 0) return '<div class="empty-state">No files in repository.</div>';

    return `
      <div class="files-table-container">
        <table class="files-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${files.map(f => `
              <tr class="file-selectable-item ${activePreviewFile?.id === f.id ? 'active' : ''}" data-id="${f.id}">
                <td class="file-td-name">
                  ${window.ClaudeStudio.Icons.svg('file-text', 'file-td-icon', 15)}
                  <span>${window.ClaudeStudio.Markdown.escapeHtml(f.name)}</span>
                </td>
                <td><span class="type-pill">${getFileTypeLabel(f.name)}</span></td>
                <td>${f.size}</td>
                <td>${formatDate(f.uploadedAt)}</td>
                <td>
                  <button class="icon-btn-ghost file-delete-btn" data-id="${f.id}" title="Delete file">
                    ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 14)}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderPreviewDrawer(f) {
    return `
      <div class="drawer-header">
        <div class="drawer-file-title">
          ${window.ClaudeStudio.Icons.svg('file-text', 'drawer-icon', 16)}
          <span>${window.ClaudeStudio.Markdown.escapeHtml(f.name)}</span>
        </div>
        <button class="icon-btn-ghost btn-close-preview" title="Close Preview">
          ${window.ClaudeStudio.Icons.svg('x', 'icon-sm', 15)}
        </button>
      </div>

      <div class="drawer-meta-list">
        <div class="drawer-meta-item"><span>File Size:</span> <strong>${f.size}</strong></div>
        <div class="drawer-meta-item"><span>Format:</span> <strong>${getFileTypeLabel(f.name)}</strong></div>
        <div class="drawer-meta-item"><span>Uploaded:</span> <strong>${new Date(f.uploadedAt).toLocaleString()}</strong></div>
      </div>

      <div class="drawer-content-preview">
        <div class="drawer-preview-label">File Contents Preview</div>
        <pre class="drawer-pre"><code>${window.ClaudeStudio.Markdown.escapeHtml(f.content || 'Binary or unreadable text content.')}</code></pre>
      </div>
    `;
  }

  function handleFilesUpload(filesList) {
    filesList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        window.ClaudeStudio.Store.addFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          sizeBytes: file.size,
          type: file.name.split('.').pop() || 'txt',
          content: e.target.result
        });
        window.ClaudeStudio.Components.Toasts.success(`Uploaded "${file.name}"!`);
      };
      reader.readAsText(file);
    });
  }

  function getFileTypeLabel(name) {
    const ext = name.split('.').pop().toUpperCase();
    return ext.length <= 4 ? ext : 'DOC';
  }

  function formatDate(ts) {
    if (!ts) return 'Recent';
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return {
    render
  };
})();
