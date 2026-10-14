// ==========================================================================
// Claude Studio - Split-Pane Artifacts Panel (Code / Live Sandboxed Preview)
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.ArtifactsPanel = (function () {
  let panelEl = null;

  function render(container) {
    panelEl = container;
    update();

    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (['artifact:opened', 'artifact:closed', 'artifact:tab_changed', 'artifact:fullscreen'].includes(event)) {
        update();
      }
    });
  }

  function update() {
    if (!panelEl) return;
    const state = window.ClaudeStudio.Store.getState();
    const artifact = state.activeArtifact;
    const isOpen = state.isArtifactsOpen && artifact;

    panelEl.classList.toggle('hidden', !isOpen);
    if (!isOpen) {
      panelEl.innerHTML = '';
      return;
    }

    panelEl.classList.toggle('artifacts-fullscreen', !!artifact.isFullscreen);
    const activeTab = artifact.activeTab || 'preview';

    panelEl.innerHTML = `
      <div class="artifacts-header">
        <div class="artifacts-title-area">
          <span class="artifacts-badge">ARTIFACT</span>
          <h4 class="artifacts-title">${window.ClaudeStudio.Markdown.escapeHtml(artifact.title)}</h4>
        </div>

        <div class="artifacts-tab-switch">
          <button class="artifact-tab-btn ${activeTab === 'preview' ? 'active' : ''}" data-tab="preview">
            ${window.ClaudeStudio.Icons.svg('eye', 'tab-icon', 14)} Preview
          </button>
          <button class="artifact-tab-btn ${activeTab === 'code' ? 'active' : ''}" data-tab="code">
            ${window.ClaudeStudio.Icons.svg('code', 'tab-icon', 14)} Code
          </button>
        </div>

        <div class="artifacts-actions">
          <button class="icon-btn-ghost btn-copy-artifact" title="Copy code">
            ${window.ClaudeStudio.Icons.svg('copy', 'act-icon', 15)}
          </button>
          <button class="icon-btn-ghost btn-download-artifact" title="Download file">
            ${window.ClaudeStudio.Icons.svg('download', 'act-icon', 15)}
          </button>
          <button class="icon-btn-ghost btn-fullscreen-artifact" title="Toggle Fullscreen">
            ${window.ClaudeStudio.Icons.svg(artifact.isFullscreen ? 'minimize-2' : 'maximize-2', 'act-icon', 15)}
          </button>
          <button class="icon-btn-ghost btn-close-artifact" title="Close Artifact">
            ${window.ClaudeStudio.Icons.svg('x', 'act-icon', 15)}
          </button>
        </div>
      </div>

      <div class="artifacts-content">
        <div class="artifacts-view-pane ${activeTab === 'preview' ? '' : 'hidden'}" id="pane-preview">
          <iframe id="artifact-iframe" class="artifact-sandboxed-frame" sandbox="allow-scripts allow-modals"></iframe>
        </div>
        <div class="artifacts-view-pane ${activeTab === 'code' ? '' : 'hidden'}" id="pane-code">
          <pre class="artifacts-code-pre"><code class="artifacts-code-content">${window.ClaudeStudio.Markdown.escapeHtml(artifact.content)}</code></pre>
        </div>
      </div>
    `;

    // Populate sandboxed iframe safely with Blob URL
    if (activeTab === 'preview') {
      const iframe = panelEl.querySelector('#artifact-iframe');
      if (iframe) {
        const blob = new Blob([artifact.content], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
      }
    }

    // Bind event listeners
    panelEl.querySelectorAll('.artifact-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        window.ClaudeStudio.Store.setArtifactTab(tab);
      });
    });

    panelEl.querySelector('.btn-copy-artifact')?.addEventListener('click', () => {
      navigator.clipboard.writeText(artifact.content);
      window.ClaudeStudio.Components.Toasts.success('Artifact code copied to clipboard!');
    });

    panelEl.querySelector('.btn-download-artifact')?.addEventListener('click', () => {
      const blob = new Blob([artifact.content], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
      a.click();
      window.ClaudeStudio.Components.Toasts.info('Downloading artifact HTML file...');
    });

    panelEl.querySelector('.btn-fullscreen-artifact')?.addEventListener('click', () => {
      window.ClaudeStudio.Store.toggleArtifactFullscreen();
    });

    panelEl.querySelector('.btn-close-artifact')?.addEventListener('click', () => {
      window.ClaudeStudio.Store.closeArtifact();
    });
  }

  return {
    render
  };
})();
