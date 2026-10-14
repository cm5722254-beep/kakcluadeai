// ==========================================================================
// Claude Studio - Application Settings Component
// Profile, Appearance, Themes, Accents, Temperature Sliders, Data Wipe/Export
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.SettingsView = (function () {
  let viewEl = null;

  function render(container) {
    viewEl = container;
    update();

    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (event === 'settings:updated') {
        update();
      }
    });
  }

  function update() {
    if (!viewEl) return;
    const state = window.ClaudeStudio.Store.getState();
    const settings = state.settings;
    const user = settings.userProfile;

    viewEl.innerHTML = `
      <div class="settings-page-container">
        <div class="page-header-row">
          <div>
            <h1 class="page-main-title">Settings</h1>
            <p class="page-subtitle">Configure your Claude Studio workspace appearance, profile, and inference parameters.</p>
          </div>
        </div>

        <div class="settings-sections-list">
          <!-- 1. Profile Section -->
          <div class="settings-card">
            <h3 class="settings-section-title">User Profile</h3>
            <p class="settings-section-sub">Personalize your identity and display preferences across shared conversations.</p>

            <div class="profile-edit-row">
              <div class="profile-avatar-preview">
                ${user.avatar ? `<img src="${user.avatar}" class="avatar-img" alt="Avatar">` : `<div class="avatar-fallback">${user.name.split(' ').map(n=>n[0]).join('')}</div>`}
              </div>
              <div class="profile-fields-col">
                <div class="form-row-2">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" id="setting-user-name" class="form-input" value="${window.ClaudeStudio.Markdown.escapeHtml(user.name)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Role / Title</label>
                    <input type="text" id="setting-user-role" class="form-input" value="${window.ClaudeStudio.Markdown.escapeHtml(user.role || '')}">
                  </div>
                </div>
                <div class="form-group mt-2">
                  <label class="form-label">Email Address</label>
                  <input type="email" id="setting-user-email" class="form-input" value="${window.ClaudeStudio.Markdown.escapeHtml(user.email)}">
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Appearance Section -->
          <div class="settings-card">
            <h3 class="settings-section-title">Appearance & Aesthetics</h3>
            <p class="settings-section-sub">Choose between calibrated dark and light themes, and select your primary tactile accent.</p>

            <div class="form-group mt-3">
              <label class="form-label">Color Theme</label>
              <div class="theme-choice-row">
                <button class="theme-choice-card ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                  <div class="theme-sample sample-dark"></div>
                  <span>Obsidian Dark</span>
                </button>
                <button class="theme-choice-card ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">
                  <div class="theme-sample sample-light"></div>
                  <span>Editorial Light</span>
                </button>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Primary Color Accent</label>
              <div class="accent-choice-row">
                ${[
                  { id: 'terracotta', name: 'Terracotta', color: '#d97757' },
                  { id: 'violet', name: 'Violet', color: '#8b7cf6' },
                  { id: 'mint', name: 'Mint', color: '#5fbf9a' },
                  { id: 'amber', name: 'Amber', color: '#e0a84a' }
                ].map(a => `
                  <button class="accent-pill-btn ${settings.accent === a.id ? 'active' : ''}" data-accent="${a.id}">
                    <span class="color-dot" style="background:${a.color};"></span>
                    <span>${a.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="form-row-2 mt-3">
              <div class="form-group">
                <label class="form-label">Editor Font Size</label>
                <select id="setting-fontsize" class="form-select">
                  <option value="13px" ${settings.fontSize === '13px' ? 'selected' : ''}>13 px - Compact</option>
                  <option value="14px" ${settings.fontSize === '14px' ? 'selected' : ''}>14 px - Standard</option>
                  <option value="15px" ${settings.fontSize === '15px' ? 'selected' : ''}>15 px - Comfortable</option>
                  <option value="16px" ${settings.fontSize === '16px' ? 'selected' : ''}>16 px - Large</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Interface Density</label>
                <select id="setting-density" class="form-select">
                  <option value="comfortable" ${settings.density === 'comfortable' ? 'selected' : ''}>Comfortable</option>
                  <option value="compact" ${settings.density === 'compact' ? 'selected' : ''}>Compact</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. Model Parameters Section -->
          <div class="settings-card">
            <h3 class="settings-section-title">Model Defaults & Generation</h3>
            <p class="settings-section-sub">Configure generation temperature and maximum token budget per response.</p>

            <div class="slider-row mt-3">
              <div class="slider-label-row">
                <span class="form-label">Temperature (Creativity vs Determinism)</span>
                <span class="slider-val" id="temp-val-display">${settings.temperature}</span>
              </div>
              <input type="range" id="setting-temp" min="0" max="1" step="0.05" value="${settings.temperature}" class="form-slider">
              <div class="slider-ticks">
                <span>0.0 (Strict / Code)</span>
                <span>0.5</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            <div class="slider-row mt-4">
              <div class="slider-label-row">
                <span class="form-label">Maximum Response Tokens</span>
                <span class="slider-val" id="tokens-val-display">${settings.maxTokens}</span>
              </div>
              <input type="range" id="setting-tokens" min="1024" max="8192" step="512" value="${settings.maxTokens}" class="form-slider">
              <div class="slider-ticks">
                <span>1,024</span>
                <span>4,096</span>
                <span>8,192</span>
              </div>
            </div>
          </div>

          <!-- 4. Data Management Section -->
          <div class="settings-card">
            <h3 class="settings-section-title">Data & Storage Management</h3>
            <p class="settings-section-sub">Export your entire local workspace database or reset to default state.</p>

            <div class="data-actions-row mt-3">
              <button class="btn btn-secondary" id="btn-export-all-data">
                ${window.ClaudeStudio.Icons.svg('download', 'btn-icon', 15)}
                <span>Export All Data (JSON)</span>
              </button>
              <button class="btn btn-danger" id="btn-wipe-all-data">
                ${window.ClaudeStudio.Icons.svg('trash-2', 'btn-icon', 15)}
                <span>Clear All Workspace Data</span>
              </button>
            </div>
          </div>

          <!-- Save Bar -->
          <div class="settings-submit-bar">
            <button class="btn btn-primary btn-save-settings" id="btn-save-all-settings">Save All Settings</button>
          </div>
        </div>
      </div>
    `;

    // Bind Theme Cards
    viewEl.querySelectorAll('.theme-choice-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        window.ClaudeStudio.Store.updateSettings({ theme });
        applyThemeTokens(theme, settings.accent);
      });
    });

    // Bind Accent Pills
    viewEl.querySelectorAll('.accent-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const accent = e.currentTarget.dataset.accent;
        window.ClaudeStudio.Store.updateSettings({ accent });
        applyThemeTokens(settings.theme, accent);
      });
    });

    // Slider displays
    const tempSlider = viewEl.querySelector('#setting-temp');
    tempSlider?.addEventListener('input', (e) => {
      viewEl.querySelector('#temp-val-display').textContent = e.target.value;
    });

    const tokensSlider = viewEl.querySelector('#setting-tokens');
    tokensSlider?.addEventListener('input', (e) => {
      viewEl.querySelector('#tokens-val-display').textContent = Number(e.target.value).toLocaleString();
    });

    // Save All
    viewEl.querySelector('#btn-save-all-settings')?.addEventListener('click', () => {
      const name = viewEl.querySelector('#setting-user-name').value.trim() || 'User';
      const role = viewEl.querySelector('#setting-user-role').value.trim();
      const email = viewEl.querySelector('#setting-user-email').value.trim();
      const fontSize = viewEl.querySelector('#setting-fontsize').value;
      const density = viewEl.querySelector('#setting-density').value;
      const temperature = parseFloat(tempSlider.value);
      const maxTokens = parseInt(tokensSlider.value, 10);

      window.ClaudeStudio.Store.updateSettings({
        fontSize,
        density,
        temperature,
        maxTokens,
        userProfile: { ...user, name, role, email }
      });

      window.ClaudeStudio.Components.Toasts.success('Settings saved successfully!');
    });

    // Export All Data
    viewEl.querySelector('#btn-export-all-data')?.addEventListener('click', () => {
      const stateData = window.ClaudeStudio.Store.getState();
      const json = JSON.stringify(stateData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `claude-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.ClaudeStudio.Components.Toasts.success('Workspace backup exported!');
    });

    // Wipe All Data
    viewEl.querySelector('#btn-wipe-all-data')?.addEventListener('click', () => {
      window.ClaudeStudio.Components.Modals.confirm({
        title: 'Clear All Workspace Data',
        message: 'This will reset all conversations, projects, files, and templates to initial default states. Are you sure?',
        confirmText: 'Reset Everything',
        confirmStyle: 'danger',
        onConfirm: () => {
          window.ClaudeStudio.Store.clearAllData();
          window.ClaudeStudio.Components.Toasts.info('Workspace reset to defaults.');
          window.ClaudeStudio.Router.navigate('/chat');
        }
      });
    });
  }

  function applyThemeTokens(theme, accent) {
    document.body.classList.remove('theme-dark', 'theme-light', 'accent-terracotta', 'accent-violet', 'accent-mint', 'accent-amber');
    document.body.classList.add(`theme-${theme}`, `accent-${accent}`);
  }

  return {
    render,
    applyThemeTokens
  };
})();
