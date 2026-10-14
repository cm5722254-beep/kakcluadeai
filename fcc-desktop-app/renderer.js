// ==========================================================================
// Claude Code Studio IDE - Ultimate Renderer Controller
// ==========================================================================

// Global IDE State
let currentWorkspacePath = '';
let openTabs = [];
let activeTabIndex = -1;
let monacoEditor = null;
let monacoModels = new Map(); // filePath -> monaco.editor.ITextModel
let isWordWrap = true;
let isMarkdownPreview = false;

// Server & AI State
let serverState = 'STOPPED'; // STOPPED, STARTING, RUNNING, ERROR
let serverPort = 8082;
let serverLogs = [];
let activeStreamId = null;
let attachFileContext = true;
let aiMessages = []; // { role, content }

// Terminal Multi-Session State
let terminalTabs = []; // { id, title, termInstance, ptyId }
let activeTermId = null;

// Settings State
let ideSettings = {
  theme: 'claude',
  fontSize: 13,
  wordWrap: true,
  defaultShell: 'powershell',
  language: 'en',
  port: 8082,
  defaultModel: 'nvidia_nim/nvidia/nemotron-3-super-120b-a12b'
};

// Cached files for fuzzy quick open
let allWorkspaceFiles = [];

// ==========================================================================
// Lucide SVG Icon Library
// ==========================================================================
const LucideIcons = {
  file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
  fileCode: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="10 13 8 15 10 17"></polyline><polyline points="14 13 16 15 14 17"></polyline></svg>`,
  fileText: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  fileJson: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"></path><path d="M14 12a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1 1 1 0 0 0-1 1v1a1 1 0 0 1-1 1"></path></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  folderOpen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><polygon points="3 19 8 9 23 9 18 19 3 19"></polygon></svg>`,
  chevronRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  close: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
};

function getFileIconSvg(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php'].includes(ext)) return LucideIcons.fileCode;
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return LucideIcons.fileJson;
  if (['md', 'txt', 'html', 'css', 'sql', 'bat', 'sh', 'ps1'].includes(ext)) return LucideIcons.fileText;
  return LucideIcons.file;
}

// ==========================================================================
// UI Translations (English / Khmer)
// ==========================================================================
const Translations = {
  en: {
    explorer: 'EXPLORER',
    search: 'SEARCH WORKSPACE',
    searchPlaceholder: 'Type text to search in project...',
    keys: 'KEY MANAGER',
    logs: 'SERVER LOGS',
    installer: 'AUTO INSTALLER',
    settings: 'SETTINGS',
    startServer: 'Start Server',
    stopServer: 'Stop Server',
    startingServer: 'Starting...',
    claudeTerm: 'Claude Terminal',
    save: 'Save',
    switchWorkspace: 'Switch',
    searchPrompt: 'Search files or run commands (Ctrl+P)',
    emptySearch: 'Type at least 2 characters to search across files.',
    attached: 'Attached: ',
    explainAction: 'Explain',
    debugAction: 'Debug',
    refactorAction: 'Refactor',
    testsAction: 'Tests',
    khmerAction: 'ពន្យល់ជាភាសាខ្មែរ',
    tasks: 'PROJECT TASKS & STEPS',
    tasksPlaceholder: 'Add a project step or milestone...',
    promptPlaceholder: 'Ask AI assistant about this code, request edits, or generate tests... (Ctrl+Enter to send)',
    serverStoppedNotice: 'FCC Server is stopped. Please start the server to use AI assistance.'
  },
  km: {
    explorer: 'កម្មវិធីរុករកឯកសារ',
    search: 'ស្វែងរកក្នុងគម្រោង',
    searchPlaceholder: 'វាយអក្សរដើម្បីស្វែងរកក្នុងគម្រោង...',
    tasks: 'ជំហាន & ភារកិច្ចគម្រោង',
    tasksPlaceholder: 'បញ្ចូលជំហានការងារថ្មី...',
    keys: 'គ្រប់គ្រងកូនសោ API',
    logs: 'កំណត់ហេតុម៉ាស៊ីនបម្រើ',
    installer: 'កម្មវិធីដំឡើងស្វ័យប្រវត្តិ',
    settings: 'ការកំណត់',
    startServer: 'ចាប់ផ្តើម Server',
    stopServer: 'បញ្ឈប់ Server',
    startingServer: 'កំពុងចាប់ផ្តើម...',
    claudeTerm: 'Claude Terminal',
    save: 'រក្សាទុក',
    switchWorkspace: 'ប្តូរថត',
    searchPrompt: 'ស្វែងរកឯកសារ ឬពាក្យបញ្ជា (Ctrl+P)',
    emptySearch: 'សូមវាយបញ្ចូលយ៉ាងហោច ២ អក្សរដើម្បីស្វែងរក។',
    attached: 'ភ្ជាប់ឯកសារ: ',
    explainAction: 'ពន្យល់',
    debugAction: 'រកកំហុស',
    refactorAction: 'កែលម្អកូដ',
    testsAction: 'បង្កើតតេស្ត',
    khmerAction: 'ពន្យល់ជាភាសាខ្មែរ',
    promptPlaceholder: 'សួរសំណួរទៅកាន់ AI អំពីកូដនេះ ឬស្នើសុំកែប្រែកូដ... (Ctrl+Enter ដើម្បីផ្ញើ)',
    serverStoppedNotice: 'FCC Server មិនទាន់ដំណើរការទេ។ សូមចុច "ចាប់ផ្តើម Server" ជាមុនសិន។'
  }
};

function applyTranslations(lang) {
  const t = Translations[lang] || Translations.en;
  document.body.classList.toggle('lang-km', lang === 'km');

  const setTxt = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setTxt('lbl-explorer-title', t.explorer);
  setTxt('lbl-search-title', t.search);
  setTxt('lbl-tasks-title', t.tasks);
  setTxt('lbl-installer-title', t.installer);
  setTxt('lbl-settings-title', t.settings);
  setTxt('lbl-claude-term', t.claudeTerm);
  setTxt('lbl-save-btn', t.save);
  setTxt('lbl-switch-workspace', t.switchWorkspace);
  setTxt('lbl-cmd-hint', t.searchPrompt);

  const searchInp = document.getElementById('inp-workspace-search');
  if (searchInp) searchInp.placeholder = t.searchPlaceholder;

  const taskInp = document.getElementById('inp-task-title');
  if (taskInp) taskInp.placeholder = t.tasksPlaceholder || 'Add a project step or milestone...';

  const promptInp = document.getElementById('inp-ai-prompt');
  if (promptInp) promptInp.placeholder = t.promptPlaceholder;

  updateServerButtonUI();
}

// ==========================================================================
// Toast Notifications
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ==========================================================================
// 1. Monaco Editor Initialization & Multi-Tab Engine
// ==========================================================================
async function initMonacoEditor() {
  return new Promise((resolve) => {
    window.require(['vs/editor/editor.main'], () => {
      // Register custom dark theme (Claude Terracotta & Warm Obsidian)
      window.monaco.editor.defineTheme('claude-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '8c8980', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'd97757', fontStyle: 'bold' },
          { token: 'string', foreground: '589f76' },
          { token: 'number', foreground: 'e0a359' },
          { token: 'type', foreground: 'c280d2' },
          { token: 'delimiter', foreground: 'b5b3ad' }
        ],
        colors: {
          'editor.background': '#181816',
          'editor.foreground': '#faf9f5',
          'editor.lineHighlightBackground': '#1f1e1b',
          'editorLineNumber.foreground': '#7c7a73',
          'editorLineNumber.activeForeground': '#d97757',
          'editorCursor.foreground': '#d97757',
          'editor.selectionBackground': '#d9775733',
          'editor.inactiveSelectionBackground': '#d977571a',
          'editorIndentGuide.background': '#282724',
          'editorIndentGuide.activeBackground': '#d9775755'
        }
      });

      // Register custom light theme (Claude Warm Alabaster / Parchment)
      window.monaco.editor.defineTheme('claude-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '8c8980', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'cc6847', fontStyle: 'bold' },
          { token: 'string', foreground: '3b7d55' },
          { token: 'number', foreground: 'b8782f' },
          { token: 'type', foreground: '7c4a8f' },
          { token: 'delimiter', foreground: '5f5e5a' }
        ],
        colors: {
          'editor.background': '#fbfaf7',
          'editor.foreground': '#1f1e1d',
          'editor.lineHighlightBackground': '#f3f1eb',
          'editorLineNumber.foreground': '#a3a099',
          'editorLineNumber.activeForeground': '#cc6847',
          'editorCursor.foreground': '#cc6847',
          'editor.selectionBackground': '#d9775726',
          'editor.inactiveSelectionBackground': '#d9775714',
          'editorIndentGuide.background': '#e3ded3',
          'editorIndentGuide.activeBackground': '#cc684766'
        }
      });

      const container = document.getElementById('monaco-editor-host');
      monacoEditor = window.monaco.editor.create(container, {
        theme: ideSettings.theme === 'light' ? 'claude-light' : 'claude-dark',
        fontSize: ideSettings.fontSize || 13,
        fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
        wordWrap: isWordWrap ? 'on' : 'off',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderLineHighlight: 'all',
        tabSize: 2
      });

      // Cursor position updates status bar
      monacoEditor.onDidChangeCursorPosition((e) => {
        const posEl = document.getElementById('sb-cursor-position');
        if (posEl) posEl.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
      });

      // Track dirty state
      monacoEditor.onDidChangeModelContent(() => {
        if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
          const tab = openTabs[activeTabIndex];
          if (!tab.isDirty && !tab.isWelcome) {
            tab.isDirty = true;
            renderTabs();
          }
        }
      });

      resolve(monacoEditor);
    });
  });
}

function detectMonacoLanguage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', json: 'json', html: 'html', css: 'css', md: 'markdown',
    sh: 'shell', bat: 'bat', ps1: 'powershell', sql: 'sql', yaml: 'yaml', yml: 'yaml'
  };
  return map[ext] || 'plaintext';
}

function openTab(tabInfo) {
  const existingIdx = openTabs.findIndex(t => t.path === tabInfo.path);
  if (existingIdx !== -1) {
    switchToTab(existingIdx);
    return;
  }

  // Create or retrieve Monaco model
  let model = monacoModels.get(tabInfo.path);
  if (!model && window.monaco) {
    const lang = detectMonacoLanguage(tabInfo.name);
    model = window.monaco.editor.createModel(tabInfo.content || '', lang);
    monacoModels.set(tabInfo.path, model);
  }

  openTabs.push({
    path: tabInfo.path,
    name: tabInfo.name,
    isDirty: false,
    isWelcome: Boolean(tabInfo.isWelcome),
    model
  });

  switchToTab(openTabs.length - 1);
}

function switchToTab(index) {
  if (index < 0 || index >= openTabs.length) return;
  activeTabIndex = index;
  const tab = openTabs[activeTabIndex];

  if (monacoEditor && tab.model) {
    monacoEditor.setModel(tab.model);
  }

  renderTabs();
  updateEditorBreadcrumbs(tab.name);
  updateActiveFileTags(tab.name);

  // If Markdown file, handle preview mode
  const isMd = tab.name.toLowerCase().endsWith('.md');
  const btnPrev = document.getElementById('btn-editor-preview');
  if (btnPrev) btnPrev.style.display = isMd ? 'inline-flex' : 'none';

  if (isMd && isMarkdownPreview) {
    renderMarkdownPreview(tab.model ? tab.model.getValue() : '');
  } else {
    toggleMarkdownPreviewDisplay(false);
  }
}

function closeTab(index) {
  const tab = openTabs[index];
  if (!tab) return;

  if (tab.isDirty) {
    const confirmClose = confirm(`File "${tab.name}" has unsaved changes. Discard changes?`);
    if (!confirmClose) return;
  }

  openTabs.splice(index, 1);

  if (openTabs.length === 0) {
    openWelcomeTab();
  } else {
    if (activeTabIndex >= openTabs.length) {
      activeTabIndex = openTabs.length - 1;
    }
    switchToTab(activeTabIndex);
  }
}

function renderTabs() {
  const container = document.getElementById('editor-tabs-container');
  if (!container) return;
  container.innerHTML = '';

  openTabs.forEach((tab, idx) => {
    const tabEl = document.createElement('div');
    tabEl.className = `editor-tab ${idx === activeTabIndex ? 'active' : ''}`;
    tabEl.innerHTML = `
      <span>${getFileIconSvg(tab.name)}</span>
      <span>${escapeHtml(tab.name)}</span>
      ${tab.isDirty ? '<span class="tab-dirty-dot">●</span>' : ''}
      <span class="tab-close-btn" title="Close Tab">${LucideIcons.close}</span>
    `;

    tabEl.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-close-btn')) {
        switchToTab(idx);
      }
    });

    tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(idx);
    });

    container.appendChild(tabEl);
  });
}

function updateEditorBreadcrumbs(filename) {
  const rootEl = document.getElementById('bc-workspace-root');
  const fileEl = document.getElementById('bc-current-file');
  if (rootEl) rootEl.textContent = currentWorkspacePath.split('\\').pop() || 'Workspace';
  if (fileEl) fileEl.textContent = filename;
}

function updateActiveFileTags(filename) {
  const sbFile = document.getElementById('sb-txt-file');
  const sbLang = document.getElementById('sb-language-tag');
  const aiFilename = document.getElementById('ai-attached-filename');

  if (sbFile) sbFile.textContent = filename;
  if (sbLang) sbLang.textContent = detectMonacoLanguage(filename);
  if (aiFilename) {
    const t = Translations[ideSettings.language] || Translations.en;
    aiFilename.textContent = `${t.attached}${filename}`;
  }
}

async function saveActiveFile() {
  if (activeTabIndex < 0 || !openTabs[activeTabIndex]) return;
  const tab = openTabs[activeTabIndex];
  if (tab.isWelcome) {
    showToast('The Welcome guide is read-only.', 'warn');
    return;
  }

  const content = tab.model ? tab.model.getValue() : '';
  const res = await window.electronAPI.writeFile(tab.path, content);
  if (res.success) {
    tab.isDirty = false;
    renderTabs();
    showToast(`Saved "${tab.name}" successfully`, 'success');
  } else {
    showToast(`Save failed: ${res.error}`, 'error');
  }
}

// ==========================================================================
// 2. Welcome Page (Rendered in Preview Mode by Default)
// ==========================================================================
function openWelcomeTab() {
  const welcomeContent = `# Claude Code Studio IDE

A pro-grade Windows AI code editor powered by Free Claude Code server and Claude Code CLI.

### Quick Start
1. **Start server**: Click **Start server** in the top bar to launch the local proxy.
2. **Claude Terminal**: Click **Claude Terminal** or open the terminal panel below to interact directly with Claude Code CLI.
3. **Open project**: Click the workspace pill at the top or press **Ctrl+O** to select any project folder.
4. **AI Assistant**: Use the panel on the right (**Ctrl+B**) to explain, debug, or refactor code in English or Khmer.

### Keyboard Shortcuts
- **Ctrl+P**: Open files or run commands
- **Ctrl+S**: Save active file
- **Ctrl+\`**: Toggle terminal panel
- **Ctrl+B**: Toggle AI Assistant
- **Ctrl+Shift+F**: Search across workspace
- **Ctrl+Enter**: Send AI message

### Free Local AI Stack
- **Proxy Port**: 8082 (OpenAI and Anthropic compatible)
- **Supported Models**: NVIDIA Nemotron 120B (Free), Llama 3.3 70B, Claude 3.7
- **Admin Dashboard**: Click **Admin UI** to manage keys and rate limits
`;

  isMarkdownPreview = true;
  const btnPrev = document.getElementById('btn-editor-preview');
  if (btnPrev) btnPrev.classList.add('active');

  openTab({
    path: 'welcome',
    name: 'Welcome.md',
    content: welcomeContent,
    isWelcome: true
  });
}

function renderMarkdownPreview(markdownText) {
  const container = document.getElementById('md-preview-content');
  if (!container) return;

  container.innerHTML = parseMarkdownToHtml(markdownText);
  toggleMarkdownPreviewDisplay(true);
}

function toggleMarkdownPreviewDisplay(showPreview) {
  const previewHost = document.getElementById('markdown-preview-host');
  const monacoHost = document.getElementById('monaco-editor-host');
  if (!previewHost || !monacoHost) return;

  if (showPreview) {
    previewHost.classList.add('active');
    monacoHost.style.display = 'none';
  } else {
    previewHost.classList.remove('active');
    monacoHost.style.display = 'block';
  }
}

function parseMarkdownToHtml(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\s*\n\*/gm, '<ul>\n*')
    .replace(/^(\*.+)$/gim, '<li>$1</li>')
    .replace(/^\s*\n\d\./gm, '<ol>\n1.')
    .replace(/^(\d\..+)$/gim, '<li>$1</li>');

  // Code blocks with syntax highlight formatting
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
    return `
      <div class="ai-code-wrapper">
        <div class="ai-code-header">
          <span>${lang || 'code'}</span>
          <button class="ai-code-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(code)}')); showToast('Copied code to clipboard', 'success');">
            ${LucideIcons.copy} Copy
          </button>
        </div>
        <pre class="ai-code-pre"><code>${escapeHtml(code)}</code></pre>
      </div>
    `;
  });

  return `<div class="md-body">${html.replace(/\n/g, '<br>')}</div>`;
}

// ==========================================================================
// 3. Integrated Terminal Multi-Session (xterm.js + node-pty)
// ==========================================================================
let activeTerminalSession = null;

async function createTerminalTab(shellPref) {
  const tabId = `term-${Date.now()}`;
  const termContainer = document.getElementById('terminal-viewport-mount');

  // Spawn node-pty session on backend
  const spawnRes = await window.electronAPI.createTerminal({
    id: tabId,
    cwd: currentWorkspacePath,
    shell: shellPref || ideSettings.defaultShell
  });

  if (!spawnRes.success) {
    showToast(`Failed starting terminal: ${spawnRes.error}`, 'error');
    return;
  }

  // Create xterm.js instance
  // Create xterm.js instance with Claude palette
  const isLight = ideSettings.theme === 'light';
  const xterm = new window.Terminal({
    cursorBlink: true,
    fontSize: ideSettings.fontSize || 13,
    fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
    theme: {
      background: isLight ? '#fbfaf7' : '#141412',
      foreground: isLight ? '#1f1e1d' : '#faf9f5',
      cursor: isLight ? '#cc6847' : '#d97757',
      selectionBackground: isLight ? 'rgba(217, 119, 87, 0.25)' : 'rgba(217, 119, 87, 0.35)',
      black: '#141412',
      red: '#d85a5a',
      green: '#589f76',
      yellow: '#e0a359',
      blue: '#6889b8',
      magenta: '#c280d2',
      cyan: '#d97757',
      white: '#faf9f5'
    },
    convertEol: true
  });

  const termEl = document.createElement('div');
  termEl.style.width = '100%';
  termEl.style.height = '100%';
  termEl.style.display = 'none';
  termContainer.appendChild(termEl);

  xterm.open(termEl);

  // Send input to pty
  xterm.onData((data) => {
    window.electronAPI.writeTerminalSession(tabId, data);
  });

  const tabObj = {
    id: tabId,
    title: `PowerShell ${terminalTabs.length + 1}`,
    xterm,
    element: termEl
  };

  terminalTabs.push(tabObj);
  switchTerminalTab(tabId);
  renderTerminalTabs();
  fitActiveTerminal();
}

function switchTerminalTab(tabId) {
  activeTermId = tabId;
  terminalTabs.forEach(t => {
    if (t.id === tabId) {
      t.element.style.display = 'block';
      activeTerminalSession = t;
      t.xterm.focus();
    } else {
      t.element.style.display = 'none';
    }
  });
  renderTerminalTabs();
  fitActiveTerminal();
}

function renderTerminalTabs() {
  const container = document.getElementById('term-tabs-container');
  if (!container) return;
  container.innerHTML = '';

  terminalTabs.forEach((tab) => {
    const tabEl = document.createElement('div');
    tabEl.className = `term-tab ${tab.id === activeTermId ? 'active' : ''}`;
    tabEl.innerHTML = `
      <span>${tab.title}</span>
      <span class="tab-close-btn" style="margin-left:4px;">${LucideIcons.close}</span>
    `;

    tabEl.addEventListener('click', (e) => {
      if (!e.target.closest('.tab-close-btn')) {
        switchTerminalTab(tab.id);
      }
    });

    tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTerminalTab(tab.id);
    });

    container.appendChild(tabEl);
  });
}

async function closeTerminalTab(tabId) {
  const idx = terminalTabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  const tab = terminalTabs[idx];
  await window.electronAPI.killTerminalSession(tabId);
  tab.xterm.dispose();
  tab.element.remove();
  terminalTabs.splice(idx, 1);

  if (terminalTabs.length === 0) {
    await createTerminalTab();
  } else {
    switchTerminalTab(terminalTabs[0].id);
  }
}

function fitActiveTerminal() {
  if (!activeTerminalSession) return;
  const mount = document.getElementById('terminal-viewport-mount');
  if (!mount || !mount.clientWidth || !mount.clientHeight) return;

  const cols = Math.max(20, Math.floor((mount.clientWidth - 16) / 8.5));
  const rows = Math.max(5, Math.floor((mount.clientHeight - 8) / 18));
  try {
    activeTerminalSession.xterm.resize(cols, rows);
    window.electronAPI.resizeTerminalSession(activeTerminalSession.id, cols, rows);
  } catch (e) {}
}

function sendCommandToActiveTerminal(cmd) {
  if (activeTerminalSession) {
    window.electronAPI.writeTerminalSession(activeTerminalSession.id, `${cmd}\r`);
    showToast(`Ran "${cmd}" in terminal`, 'info');
  }
}

// Setup Backend Listeners for Terminal Output
function setupTerminalListeners() {
  window.electronAPI.onTermData(({ id, data }) => {
    const tab = terminalTabs.find(t => t.id === id);
    if (tab) {
      tab.xterm.write(data);
    }
  });

  window.electronAPI.onTermExit(({ id }) => {
    const tab = terminalTabs.find(t => t.id === id);
    if (tab) {
      tab.xterm.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n');
    }
  });
}

// ==========================================================================
// 4. Server Manager & State Controls
// ==========================================================================
async function refreshServerStatus() {
  const info = await window.electronAPI.getServerStatus();
  serverState = info.status;
  serverPort = info.port;
  updateServerButtonUI();
  updateServerStatusBarUI();
}

function updateServerButtonUI() {
  const btn = document.getElementById('btn-server-state');
  const txt = document.getElementById('txt-server-btn');
  if (!btn || !txt) return;

  const t = Translations[ideSettings.language] || Translations.en;
  btn.className = `tb-btn tb-btn-server ${serverState.toLowerCase()}`;

  if (serverState === 'RUNNING') {
    txt.textContent = t.stopServer;
  } else if (serverState === 'STARTING') {
    txt.textContent = t.startingServer;
  } else if (serverState === 'ERROR') {
    txt.textContent = 'Retry Server';
  } else {
    txt.textContent = t.startServer;
  }
}

function updateServerStatusBarUI() {
  const pill = document.getElementById('sb-server-pill');
  const txt = document.getElementById('sb-txt-server');
  if (!pill || !txt) return;

  pill.className = `sb-item ${serverState.toLowerCase()}`;
  txt.textContent = `Server: ${serverState} (${serverPort})`;
}

async function toggleServerState() {
  const btn = document.getElementById('btn-server-state');
  btn.disabled = true;

  if (serverState === 'RUNNING') {
    await window.electronAPI.stopServer();
    showToast('FCC Server stopped', 'info');
  } else {
    await window.electronAPI.startServer();
    showToast('Starting FCC Server on port ' + serverPort, 'info');
  }

  await refreshServerStatus();
  btn.disabled = false;
}

function appendServerLogEntry(entry) {
  serverLogs.push(entry);
  const viewport = document.getElementById('server-logs-viewport');
  if (!viewport) return;

  const row = document.createElement('div');
  row.className = 'log-line';
  row.innerHTML = `
    <span class="log-ts">[${escapeHtml(entry.timestamp)}]</span>
    <span class="log-text log-${entry.type}">${escapeHtml(entry.message)}</span>
  `;
  viewport.appendChild(row);
  viewport.scrollTop = viewport.scrollHeight;
}

// ==========================================================================
// 5. AI Assistant & Real-Time Streaming
// ==========================================================================
function setupAIChat() {
  const sendBtn = document.getElementById('btn-send-ai-chat');
  const stopBtn = document.getElementById('btn-stop-ai-stream');
  const clearBtn = document.getElementById('btn-clear-ai-history');
  const promptInput = document.getElementById('inp-ai-prompt');
  const modelSelect = document.getElementById('sel-ai-model');

  // Attach context toggle
  const attachBtn = document.getElementById('btn-toggle-attach-context');
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      attachFileContext = !attachFileContext;
      const chip = document.getElementById('ai-attached-file-info');
      if (chip) chip.style.opacity = attachFileContext ? '1' : '0.4';
      showToast(`File context: ${attachFileContext ? 'Attached' : 'Detached'}`, 'info');
    });
  }

  // Model selection persistence
  if (modelSelect) {
    modelSelect.value = ideSettings.defaultModel;
    modelSelect.addEventListener('change', async () => {
      ideSettings.defaultModel = modelSelect.value;
      const modelTag = document.getElementById('sb-active-model-tag');
      if (modelTag) modelTag.textContent = modelSelect.options[modelSelect.selectedIndex].text;
      await window.electronAPI.saveSettings({ defaultModel: ideSettings.defaultModel });
      showToast(`Model set to: ${modelSelect.options[modelSelect.selectedIndex].text}`, 'info');
    });
  }

  // Clear chat
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      aiMessages = [];
      const flow = document.getElementById('ai-messages-flow');
      if (flow) flow.innerHTML = '';
      showToast('Chat history cleared', 'info');
    });
  }

  // Send message
  if (sendBtn) {
    sendBtn.addEventListener('click', () => handleSendAIMessage());
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSendAIMessage();
      }
    });
  }

  // Stop button
  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      if (activeStreamId) {
        await window.electronAPI.cancelAIStream(activeStreamId);
        activeStreamId = null;
        stopBtn.style.display = 'none';
        showToast('Stream cancelled', 'warn');
      }
    });
  }

  // Quick prompt chips
  document.querySelectorAll('.ai-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const action = chip.dataset.action;
      executeQuickAIAction(action);
    });
  });

  // Listen to streaming chunks
  window.electronAPI.onAIChunk(({ id, chunk }) => {
    if (id === activeStreamId) {
      appendStreamChunkToLastMessage(chunk);
    }
  });

  window.electronAPI.onAIEnd(({ id, fullText }) => {
    if (id === activeStreamId) {
      finalizeStreamMessage(fullText);
      activeStreamId = null;
      document.getElementById('btn-stop-ai-stream').style.display = 'none';
    }
  });

  window.electronAPI.onAIError(({ id, error }) => {
    if (id === activeStreamId) {
      renderAIErrorMessage(error);
      activeStreamId = null;
      document.getElementById('btn-stop-ai-stream').style.display = 'none';
    }
  });
}

async function handleSendAIMessage(customPrompt = '') {
  const promptInput = document.getElementById('inp-ai-prompt');
  const text = customPrompt || (promptInput ? promptInput.value.trim() : '');
  if (!text) return;

  if (promptInput) promptInput.value = '';

  // Check server status
  if (serverState !== 'RUNNING') {
    renderServerOfflineNotice();
    return;
  }

  // Append user message
  aiMessages.push({ role: 'user', content: text });
  renderUserMessage(text);

  // Prepare context
  let fileContext = null;
  if (attachFileContext && activeTabIndex >= 0 && openTabs[activeTabIndex]) {
    const tab = openTabs[activeTabIndex];
    fileContext = {
      name: tab.name,
      path: tab.path,
      content: tab.model ? tab.model.getValue() : ''
    };
  }

  // Start assistant message container
  const streamId = `stream-${Date.now()}`;
  activeStreamId = streamId;
  document.getElementById('btn-stop-ai-stream').style.display = 'inline-flex';
  startAssistantStreamMessage();

  await window.electronAPI.startAIStream({
    id: streamId,
    messages: aiMessages,
    model: ideSettings.defaultModel,
    fileContext
  });
}

function executeQuickAIAction(action) {
  let codeSnippet = '';
  if (monacoEditor) {
    const selection = monacoEditor.getSelection();
    codeSnippet = monacoEditor.getModel().getValueInRange(selection);
    if (!codeSnippet) {
      codeSnippet = monacoEditor.getValue();
    }
  }

  const prompts = {
    explain: 'Please explain the architecture, functions, and logic of this code in detail.',
    debug: 'Analyze this code for potential runtime errors, edge cases, race conditions, or memory leaks and provide fixes.',
    refactor: 'Refactor this code to follow clean code principles, optimal readability, and performance.',
    tests: 'Write comprehensive automated unit tests covering all functions and edge cases for this code.',
    khmer: 'សូមពន្យល់កូដនេះជាភាសាខ្មែរឱ្យបានក្បោះក្បាយ ច្បាស់លាស់ និងងាយយល់ រួមទាំងរបៀបដំណើរការរបស់វា។'
  };

  const promptText = prompts[action] || 'Please review this code.';
  handleSendAIMessage(promptText);
}

function renderUserMessage(text) {
  const flow = document.getElementById('ai-messages-flow');
  if (!flow) return;

  const msg = document.createElement('div');
  msg.className = 'ai-msg user';
  msg.textContent = text;
  flow.appendChild(msg);
  flow.scrollTop = flow.scrollHeight;
}

let activeAssistantMsgEl = null;
let currentStreamText = '';

function startAssistantStreamMessage() {
  const flow = document.getElementById('ai-messages-flow');
  if (!flow) return;

  currentStreamText = '';
  activeAssistantMsgEl = document.createElement('div');
  activeAssistantMsgEl.className = 'ai-msg assistant';
  activeAssistantMsgEl.innerHTML = `<span style="color:var(--text-dim);">Thinking...</span>`;
  flow.appendChild(activeAssistantMsgEl);
  flow.scrollTop = flow.scrollHeight;
}

function appendStreamChunkToLastMessage(chunk) {
  if (!activeAssistantMsgEl) return;
  currentStreamText += chunk;
  activeAssistantMsgEl.innerHTML = formatAssistantMarkdown(currentStreamText);
  const flow = document.getElementById('ai-messages-flow');
  if (flow) flow.scrollTop = flow.scrollHeight;
}

function finalizeStreamMessage(fullText) {
  if (activeAssistantMsgEl) {
    currentStreamText = fullText || currentStreamText;
    activeAssistantMsgEl.innerHTML = formatAssistantMarkdown(currentStreamText);
    aiMessages.push({ role: 'assistant', content: currentStreamText });
    wireCodeBlockActions(activeAssistantMsgEl);
  }
}

function renderAIErrorMessage(errorText) {
  if (activeAssistantMsgEl) {
    activeAssistantMsgEl.innerHTML = `
      <div style="color:var(--color-danger); display:flex; flex-direction:column; gap:4px;">
        <strong>AI Assistant Error:</strong>
        <span>${escapeHtml(errorText)}</span>
      </div>
    `;
  }
}

function renderServerOfflineNotice() {
  const flow = document.getElementById('ai-messages-flow');
  if (!flow) return;

  const notice = document.createElement('div');
  notice.className = 'ai-msg-offline-notice';
  notice.innerHTML = `
    <div style="font-weight:600; color:var(--color-danger);">FCC Proxy Server is Stopped</div>
    <div style="font-size:11.5px; color:var(--text-muted);">The AI assistant requires the local Free Claude Server to be running.</div>
    <button class="tb-btn" style="background:var(--accent-bg); color:var(--accent); border-color:rgba(34,211,238,0.4);" onclick="toggleServerState()">
      Start Server Now
    </button>
  `;
  flow.appendChild(notice);
  flow.scrollTop = flow.scrollHeight;
}

function formatAssistantMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h3 style="font-size:13.5px; margin:8px 0 4px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size:15px; margin:10px 0 4px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size:16px; margin:12px 0 6px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Format code blocks with Copy & Apply buttons
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
    const encoded = encodeURIComponent(code.trim());
    return `
      <div class="ai-code-wrapper">
        <div class="ai-code-header">
          <span>${lang || 'code'}</span>
          <div class="ai-code-btns">
            <button class="ai-code-btn btn-copy-code" data-code="${encoded}">
              ${LucideIcons.copy} Copy
            </button>
            <button class="ai-code-btn btn-apply-code" data-code="${encoded}" style="color:var(--accent); border-color:rgba(34,211,238,0.3);">
              ${LucideIcons.check} Apply to file
            </button>
          </div>
        </div>
        <pre class="ai-code-pre"><code>${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
  });

  return html.replace(/\n/g, '<br>');
}

function wireCodeBlockActions(containerEl) {
  containerEl.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = decodeURIComponent(btn.dataset.code);
      navigator.clipboard.writeText(code);
      showToast('Copied code snippet to clipboard', 'success');
    });
  });

  containerEl.querySelectorAll('.btn-apply-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = decodeURIComponent(btn.dataset.code);
      openDiffModal(code);
    });
  });
}

// Diff & Apply to File Modal
function openDiffModal(proposedCode) {
  const modal = document.getElementById('modal-diff-view');
  const origPre = document.getElementById('diff-original-content');
  const propPre = document.getElementById('diff-proposed-content');
  if (!modal || !origPre || !propPre) return;

  const currentContent = monacoEditor ? monacoEditor.getValue() : '';
  origPre.textContent = currentContent;
  propPre.textContent = proposedCode;

  modal.classList.remove('hidden');

  const confirmBtn = document.getElementById('btn-confirm-apply-diff');
  confirmBtn.onclick = () => {
    if (monacoEditor) {
      monacoEditor.setValue(proposedCode);
      if (activeTabIndex >= 0 && openTabs[activeTabIndex]) {
        openTabs[activeTabIndex].isDirty = true;
        renderTabs();
      }
      showToast('Applied AI code to active file', 'success');
    }
    modal.classList.add('hidden');
  };
}

// ==========================================================================
// 6. Workspace File Tree & Explorer
// ==========================================================================
async function loadWorkspace(dirPath) {
  currentWorkspacePath = dirPath;
  const pillName = document.getElementById('txt-workspace-name');
  const sbWs = document.getElementById('sb-txt-workspace');
  const folderName = dirPath.split('\\').pop() || dirPath;

  if (pillName) pillName.textContent = folderName;
  if (sbWs) sbWs.textContent = folderName;

  const treeContainer = document.getElementById('file-tree-container');
  if (treeContainer) treeContainer.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-dim);">Loading files...</div>';

  const res = await window.electronAPI.readDir(dirPath);
  allWorkspaceFiles = [];
  renderFileTreeNodes(treeContainer, res.items, 0);

  // Watch workspace for changes
  window.electronAPI.watchWorkspace(dirPath);

  // Reload tasks for this workspace
  if (typeof loadProjectTasks === 'function') {
    loadProjectTasks();
    refreshTasksView();
  }
}

function renderFileTreeNodes(parentEl, items, depth = 0) {
  if (!parentEl) return;
  parentEl.innerHTML = '';

  if (!items || items.length === 0) {
    parentEl.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-dim);">Empty folder</div>';
    return;
  }

  items.forEach(item => {
    if (!item.isDir) {
      allWorkspaceFiles.push(item);
    }

    const row = document.createElement('div');
    row.className = 'tree-node';
    row.style.paddingLeft = `${depth * 14 + 10}px`;

    if (item.isDir) {
      row.innerHTML = `
        <span class="tree-arrow">${LucideIcons.chevronRight}</span>
        <span class="tree-icon">${LucideIcons.folder}</span>
        <span class="tree-label">${escapeHtml(item.name)}</span>
      `;

      const childContainer = document.createElement('div');
      childContainer.style.display = 'none';

      row.addEventListener('click', () => {
        const arrow = row.querySelector('.tree-arrow');
        const icon = row.querySelector('.tree-icon');
        const isExpanded = childContainer.style.display === 'block';

        if (isExpanded) {
          childContainer.style.display = 'none';
          arrow.classList.remove('expanded');
          icon.innerHTML = LucideIcons.folder;
        } else {
          childContainer.style.display = 'block';
          arrow.classList.add('expanded');
          icon.innerHTML = LucideIcons.folderOpen;
          if (item.children && childContainer.children.length === 0) {
            renderFileTreeNodes(childContainer, item.children, depth + 1);
          }
        }
      });

      parentEl.appendChild(row);
      parentEl.appendChild(childContainer);
    } else {
      row.innerHTML = `
        <span class="tree-arrow" style="visibility:hidden;"></span>
        <span class="tree-icon">${getFileIconSvg(item.name)}</span>
        <span class="tree-label">${escapeHtml(item.name)}</span>
      `;

      row.addEventListener('click', async () => {
        document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('selected'));
        row.classList.add('selected');
        await openFileByPath(item.path);
      });

      parentEl.appendChild(row);
    }
  });
}

async function openFileByPath(filePath) {
  const existingIdx = openTabs.findIndex(t => t.path === filePath);
  if (existingIdx !== -1) {
    switchToTab(existingIdx);
    return;
  }

  const res = await window.electronAPI.readFile(filePath);
  if (res.success) {
    openTab({
      path: res.path,
      name: res.name,
      content: res.content
    });
  } else {
    showToast(`Failed reading file: ${res.error}`, 'error');
  }
}

// ==========================================================================
// 7. Auto Installer & Dependency Health Checks
// ==========================================================================
async function refreshInstallerCheck() {
  const diag = await window.electronAPI.checkInstaller();

  const updateRow = (id, ok, ver, path) => {
    const badge = document.getElementById(`dep-${id}-badge`);
    const sub = document.getElementById(`dep-${id}-sub`);
    if (badge && sub) {
      if (ok) {
        badge.className = 'dep-badge pass';
        badge.textContent = 'Pass';
        sub.textContent = `${ver} (${path})`;
      } else {
        badge.className = 'dep-badge fail';
        badge.textContent = 'Missing';
        sub.textContent = 'Not installed or broken';
      }
    }
  };

  updateRow('node', diag.node.ok, diag.node.version, diag.node.path);
  updateRow('claude', diag.claude.ok, diag.claude.version, diag.claude.path);
  updateRow('uv', diag.uv.ok, diag.uv.version, diag.uv.path);
  updateRow('fcc', diag.fcc.ok, diag.fcc.version, diag.fcc.path);
}

function setupInstallerEvents() {
  const runBtn = document.getElementById('btn-run-auto-installer');
  const cancelBtn = document.getElementById('btn-cancel-installer');
  const retryBtn = document.getElementById('btn-retry-installer');
  const progressBox = document.getElementById('setup-progress-box');
  const stepLabel = document.getElementById('setup-step-label');
  const barFill = document.getElementById('setup-bar-fill');
  const logLine = document.getElementById('setup-log-line');
  const errRow = document.getElementById('setup-error-retry-row');
  const failingCmd = document.getElementById('setup-failing-cmd');

  const executeSetup = async () => {
    runBtn.disabled = true;
    progressBox.style.display = 'flex';
    errRow.style.display = 'none';
    barFill.style.width = '10%';
    stepLabel.textContent = 'Checking environment dependencies...';

    const res = await window.electronAPI.runInstaller();
    runBtn.disabled = false;
    await refreshInstallerCheck();

    if (res.success) {
      barFill.style.width = '100%';
      stepLabel.textContent = 'Setup Completed! All tools installed.';
      showToast('1-Click Auto Setup succeeded', 'success');
    } else {
      errRow.style.display = 'flex';
      failingCmd.textContent = `Command failed: ${res.failingCommand || res.error}`;
      showToast(`Setup error: ${res.error}`, 'error');
    }
  };

  if (runBtn) runBtn.addEventListener('click', executeSetup);
  if (retryBtn) retryBtn.addEventListener('click', executeSetup);

  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      await window.electronAPI.cancelInstaller();
      showToast('Setup cancelled', 'warn');
      progressBox.style.display = 'none';
      runBtn.disabled = false;
    });
  }

  const refreshBtn = document.getElementById('btn-refresh-installer');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showToast('Rechecking system tools...', 'info');
      await refreshInstallerCheck();
    });
  }

  window.electronAPI.onInstallerProgress((p) => {
    if (stepLabel) stepLabel.textContent = p.step;
    if (barFill) barFill.style.width = `${p.percent}%`;
    if (logLine && p.log) logLine.textContent = p.log;
  });
}

// ==========================================================================
// 8. Key Manager
// ==========================================================================
async function refreshKeysList() {
  const container = document.getElementById('keys-list-container');
  if (!container) return;

  const keys = await window.electronAPI.listKeys();
  container.innerHTML = '';

  if (!keys || keys.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:var(--text-dim); padding:8px 0;">No API keys configured yet. Generate a free local proxy key above.</div>';
    return;
  }

  keys.forEach(k => {
    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-card-header">
        <span class="key-name">${escapeHtml(k.name)}</span>
        <span class="key-provider-tag">${escapeHtml(k.provider)}</span>
      </div>
      <div class="key-masked-str">${escapeHtml(k.maskedKey)}</div>
      <div class="key-card-actions">
        <button class="tb-btn btn-copy-k" style="height:24px; font-size:11px;">
          ${LucideIcons.copy} Copy
        </button>
        <button class="tb-btn btn-revoke-k" style="height:24px; font-size:11px; color:var(--color-danger); border-color:rgba(248,113,113,0.3);">
          ${LucideIcons.trash} Revoke
        </button>
      </div>
    `;

    card.querySelector('.btn-copy-k').addEventListener('click', async () => {
      const res = await window.electronAPI.getPlainKey(k.id);
      if (res.success) {
        navigator.clipboard.writeText(res.key);
        showToast('API Key copied to clipboard', 'success');
      }
    });

    card.querySelector('.btn-revoke-k').addEventListener('click', async () => {
      if (confirm(`Revoke key "${k.name}"?`)) {
        await window.electronAPI.revokeKey(k.id);
        await refreshKeysList();
        showToast('API Key revoked', 'info');
      }
    });

    container.appendChild(card);
  });
}

function setupKeyEvents() {
  const genBtn = document.getElementById('btn-generate-key');
  if (genBtn) {
    genBtn.addEventListener('click', async () => {
      const provider = document.getElementById('sel-key-provider').value;
      const name = document.getElementById('inp-key-name').value.trim() || `Key-${Date.now().toString().slice(-4)}`;

      await window.electronAPI.generateKey({ name, provider });
      document.getElementById('inp-key-name').value = '';
      await refreshKeysList();
      showToast('Encrypted API key generated', 'success');
    });
  }
}

// ==========================================================================
// 9. Command Palette (Ctrl+P)
// ==========================================================================
function setupCommandPalette() {
  const modal = document.getElementById('modal-cmd-palette');
  const input = document.getElementById('inp-cmd-palette');
  const resultsContainer = document.getElementById('cmd-palette-results');
  const triggerBtn = document.getElementById('btn-open-palette');

  const openPalette = () => {
    modal.classList.remove('hidden');
    input.value = '';
    renderPaletteItems('');
    input.focus();
  };

  const closePalette = () => {
    modal.classList.add('hidden');
  };

  if (triggerBtn) triggerBtn.addEventListener('click', openPalette);

  input.addEventListener('input', () => {
    renderPaletteItems(input.value.trim());
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePalette();
    if (e.key === 'Enter') {
      const active = resultsContainer.querySelector('.cmd-item.active') || resultsContainer.querySelector('.cmd-item');
      if (active) active.click();
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePalette();
  });
}

function renderPaletteItems(query) {
  const container = document.getElementById('cmd-palette-results');
  if (!container) return;
  container.innerHTML = '';

  if (query.startsWith('>')) {
    // Commands mode
    const cmdQuery = query.slice(1).trim().toLowerCase();
    const commands = [
      { name: 'Start Server', action: () => toggleServerState(), sub: 'server:start' },
      { name: 'Stop Server', action: () => toggleServerState(), sub: 'server:stop' },
      { name: 'Open Terminal', action: () => createTerminalTab(), sub: 'term:create' },
      { name: 'Launch Claude Code CLI', action: () => sendCommandToActiveTerminal('fcc-claude'), sub: 'claude:launch' },
      { name: 'Toggle Word Wrap', action: () => toggleWordWrap(), sub: 'editor:wrap' },
      { name: 'Toggle Markdown Preview', action: () => toggleMarkdownPreview(), sub: 'editor:preview' },
      { name: 'Run 1-Click Auto Setup', action: () => document.getElementById('act-setup').click(), sub: 'installer:run' },
      { name: 'Switch Project Folder', action: () => chooseProjectFolder(), sub: 'dialog:openFolder' },
      { name: 'Switch Theme: Claude Terracotta (Obsidian)', action: () => applyTheme('claude'), sub: 'theme:claude' },
      { name: 'Switch Theme: Claude Warm Alabaster (Light)', action: () => applyTheme('light'), sub: 'theme:light' },
      { name: 'Switch Theme: Claude Desert Amber', action: () => applyTheme('amber'), sub: 'theme:amber' },
      { name: 'Switch Theme: Claude Deep Charcoal', action: () => applyTheme('charcoal'), sub: 'theme:charcoal' },
      { name: 'Save Active File', action: () => saveActiveFile(), sub: 'fs:writeFile' }
    ];

    const filtered = commands.filter(c => c.name.toLowerCase().includes(cmdQuery));
    filtered.forEach((cmd, idx) => {
      const el = document.createElement('div');
      el.className = `cmd-item ${idx === 0 ? 'active' : ''}`;
      el.innerHTML = `<span>${escapeHtml(cmd.name)}</span><span class="cmd-item-sub">${cmd.sub}</span>`;
      el.addEventListener('click', () => {
        document.getElementById('modal-cmd-palette').classList.add('hidden');
        cmd.action();
      });
      container.appendChild(el);
    });
  } else {
    // File search mode
    const lower = query.toLowerCase();
    const matched = allWorkspaceFiles.filter(f => f.name.toLowerCase().includes(lower)).slice(0, 20);

    matched.forEach((file, idx) => {
      const el = document.createElement('div');
      el.className = `cmd-item ${idx === 0 ? 'active' : ''}`;
      el.innerHTML = `
        <span>${getFileIconSvg(file.name)}</span>
        <span>${escapeHtml(file.name)}</span>
        <span class="cmd-item-sub">${escapeHtml(file.path)}</span>
      `;
      el.addEventListener('click', () => {
        document.getElementById('modal-cmd-palette').classList.add('hidden');
        openFileByPath(file.path);
      });
      container.appendChild(el);
    });
  }
}

// ==========================================================================
// 10. Workspace Search View
// ==========================================================================
function setupWorkspaceSearch() {
  const input = document.getElementById('inp-workspace-search');
  const resultsBox = document.getElementById('search-results-container');
  let searchTimeout = null;

  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = input.value.trim();
    if (query.length < 2) {
      resultsBox.innerHTML = '<div style="font-size:12px; color:var(--text-dim); padding:8px 0;">Type at least 2 characters to search across files.</div>';
      return;
    }

    resultsBox.innerHTML = '<div style="font-size:12px; color:var(--text-dim); padding:8px 0;">Searching...</div>';

    searchTimeout = setTimeout(async () => {
      const results = await window.electronAPI.searchWorkspace(query);
      resultsBox.innerHTML = '';

      if (!results || results.length === 0) {
        resultsBox.innerHTML = `<div style="font-size:12px; color:var(--text-dim); padding:8px 0;">No matching occurrences found for "${escapeHtml(query)}"</div>`;
        return;
      }

      results.forEach(item => {
        const row = document.createElement('div');
        row.className = 'search-item';
        row.innerHTML = `
          <div class="search-item-title">
            <span>${escapeHtml(item.name)}</span>
            <span class="search-line-badge">Ln ${item.line}</span>
          </div>
          <div class="search-preview">${escapeHtml(item.preview)}</div>
        `;
        row.addEventListener('click', async () => {
          await openFileByPath(item.path);
          if (monacoEditor && item.line) {
            monacoEditor.revealLineInCenter(item.line);
            monacoEditor.setPosition({ lineNumber: item.line, column: 1 });
          }
        });
        resultsBox.appendChild(row);
      });
    }, 280);
  });
}

// ==========================================================================
// 11. Settings, Themes & Preferences
// ==========================================================================
function applyTheme(themeName) {
  const validThemes = ['claude', 'light', 'amber', 'charcoal'];
  const active = validThemes.includes(themeName) ? themeName : 'claude';
  document.body.className = `theme-${active}`;
  ideSettings.theme = active;
  if (monacoEditor) {
    monacoEditor.updateOptions({
      theme: active === 'light' ? 'claude-light' : 'claude-dark'
    });
  }
  const isLight = active === 'light';
  terminalTabs.forEach(t => {
    if (t.xterm) {
      t.xterm.options.theme = {
        background: isLight ? '#fbfaf7' : '#141412',
        foreground: isLight ? '#1f1e1d' : '#faf9f5',
        cursor: isLight ? '#cc6847' : '#d97757',
        selectionBackground: isLight ? 'rgba(217, 119, 87, 0.25)' : 'rgba(217, 119, 87, 0.35)',
        black: '#141412',
        red: '#d85a5a',
        green: '#589f76',
        yellow: '#e0a359',
        blue: '#6889b8',
        magenta: '#c280d2',
        cyan: '#d97757',
        white: '#faf9f5'
      };
    }
  });
}

function toggleWordWrap() {
  isWordWrap = !isWordWrap;
  if (monacoEditor) {
    monacoEditor.updateOptions({ wordWrap: isWordWrap ? 'on' : 'off' });
  }
  const btnWrap = document.getElementById('btn-editor-wrap');
  if (btnWrap) btnWrap.classList.toggle('active', isWordWrap);
  showToast(`Word wrap: ${isWordWrap ? 'Enabled' : 'Disabled'}`, 'info');
}

function toggleMarkdownPreview() {
  if (activeTabIndex < 0 || !openTabs[activeTabIndex]) return;
  const tab = openTabs[activeTabIndex];
  if (!tab.name.toLowerCase().endsWith('.md')) {
    showToast('Markdown preview is only available for .md files', 'info');
    return;
  }

  isMarkdownPreview = !isMarkdownPreview;
  const btnPrev = document.getElementById('btn-editor-preview');
  if (btnPrev) btnPrev.classList.toggle('active', isMarkdownPreview);

  if (isMarkdownPreview) {
    renderMarkdownPreview(tab.model ? tab.model.getValue() : '');
  } else {
    toggleMarkdownPreviewDisplay(false);
  }
}

async function chooseProjectFolder() {
  const chosen = await window.electronAPI.openFolderDialog(currentWorkspacePath);
  if (chosen) {
    await loadWorkspace(chosen);
    showToast(`Switched workspace to: ${chosen.split('\\').pop()}`, 'success');
  }
}

function setupSettingsEvents() {
  const saveBtn = document.getElementById('btn-save-settings');
  const resetBtn = document.getElementById('btn-reset-settings');
  const themeSel = document.getElementById('sel-setting-theme');
  const langSel = document.getElementById('sel-setting-language');
  const fontSel = document.getElementById('sel-setting-fontsize');
  const shellSel = document.getElementById('sel-setting-shell');
  const portInp = document.getElementById('inp-setting-port');

  if (themeSel) {
    themeSel.value = ideSettings.theme;
    themeSel.addEventListener('change', () => applyTheme(themeSel.value));
  }

  if (langSel) {
    langSel.value = ideSettings.language;
    langSel.addEventListener('change', () => {
      ideSettings.language = langSel.value;
      applyTranslations(langSel.value);
    });
  }

  if (fontSel) {
    fontSel.value = String(ideSettings.fontSize || 13);
    fontSel.addEventListener('change', () => {
      const size = parseInt(fontSel.value, 10);
      ideSettings.fontSize = size;
      if (monacoEditor) monacoEditor.updateOptions({ fontSize: size });
      terminalTabs.forEach(t => t.xterm.options.fontSize = size);
      fitActiveTerminal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      ideSettings.port = parseInt(portInp.value, 10) || 8082;
      ideSettings.defaultShell = shellSel.value;
      await window.electronAPI.saveSettings(ideSettings);
      showToast('Settings saved successfully', 'success');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      ideSettings = {
        theme: 'claude',
        fontSize: 13,
        wordWrap: true,
        defaultShell: 'powershell',
        language: 'en',
        port: 8082,
        defaultModel: 'nvidia_nim/nvidia/nemotron-3-super-120b-a12b'
      };
      applyTheme('claude');
      applyTranslations('en');
      await window.electronAPI.saveSettings(ideSettings);
      showToast('Settings reset to default', 'info');
    });
  }
}

// ==========================================================================
// 12. Resizable Splitters
// ==========================================================================
function setupResizableSplitters() {
  const makeDraggable = (resizerId, targetId, prop, isVertical, min, max) => {
    const resizer = document.getElementById(resizerId);
    const target = document.getElementById(targetId);
    if (!resizer || !target) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('resizing');
      document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      let newSize;
      if (isVertical) {
        newSize = window.innerHeight - e.clientY;
      } else if (resizerId === 'resizer-ai') {
        newSize = window.innerWidth - e.clientX;
      } else {
        newSize = e.clientX - 48; // Activity bar width
      }

      if (newSize >= min && newSize <= max) {
        target.style[prop] = `${newSize}px`;
        if (isVertical) fitActiveTerminal();
      }
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = 'default';
        if (monacoEditor) monacoEditor.layout();
        fitActiveTerminal();
      }
    });
  };

  makeDraggable('resizer-sidebar', 'sidebar-panel', 'width', false, 160, 480);
  makeDraggable('resizer-terminal', 'terminal-dock', 'height', true, 100, 600);
  makeDraggable('resizer-ai', 'ai-assistant-panel', 'width', false, 240, 600);
}

// ==========================================================================
// 13. Window Controls & Global Keyboard Shortcuts
// ==========================================================================
function setupWindowControls() {
  const minBtn = document.getElementById('btn-win-min');
  const maxBtn = document.getElementById('btn-win-max');
  const closeBtn = document.getElementById('btn-win-close');

  if (minBtn) minBtn.addEventListener('click', () => window.electronAPI.minimizeWindow());
  if (maxBtn) maxBtn.addEventListener('click', () => window.electronAPI.maximizeWindow());
  if (closeBtn) closeBtn.addEventListener('click', () => window.electronAPI.closeWindow());
}

function setupGlobalShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ctrl+S: Save file
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveActiveFile();
    }
    // Ctrl+P: Command palette
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      document.getElementById('btn-open-palette').click();
    }
    // Ctrl+O: Open folder
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      chooseProjectFolder();
    }
    // Ctrl+`: Toggle terminal
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      const dock = document.getElementById('terminal-dock');
      if (dock) {
        dock.classList.toggle('hidden');
        fitActiveTerminal();
      }
    }
    // Ctrl+B: Toggle AI assistant
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const aiPanel = document.getElementById('ai-assistant-panel');
      if (aiPanel) aiPanel.classList.toggle('hidden');
    }
    // Ctrl+Shift+F: Search workspace
    if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      document.getElementById('act-search').click();
      const inp = document.getElementById('inp-workspace-search');
      if (inp) inp.focus();
    }
    // Esc: Close any active modal
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    if (monacoEditor) monacoEditor.layout();
    fitActiveTerminal();
  });
}

// Helper: HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// Project Tasks & Step Roadmap Module
// ==========================================================================
let projectTasks = [];
let currentTaskFilter = 'all'; // 'all' | 'pending' | 'completed'

function getTasksStorageKey() {
  return 'fcc_tasks_' + encodeURIComponent(currentWorkspacePath || 'default');
}

function loadProjectTasks() {
  try {
    const raw = localStorage.getItem(getTasksStorageKey());
    if (raw) {
      projectTasks = JSON.parse(raw);
      return;
    }
  } catch (e) {
    console.warn('Failed to parse saved tasks:', e);
  }

  // Initial seed tasks for fresh project workspace
  projectTasks = [
    { id: 't-1', title: 'Initialize Free Claude Code Server backend', priority: 'high', completed: true, createdAt: Date.now() - 3600000 },
    { id: 't-2', title: 'Configure Monaco Editor models & multi-session terminal', priority: 'high', completed: true, createdAt: Date.now() - 1800000 },
    { id: 't-3', title: 'Implement Project Tasks & Steps Roadmap Tracker', priority: 'medium', completed: true, createdAt: Date.now() - 600000 },
    { id: 't-4', title: 'Build standalone desktop release package for Windows x64', priority: 'medium', completed: false, createdAt: Date.now() }
  ];
  saveProjectTasks();
}

function saveProjectTasks() {
  try {
    localStorage.setItem(getTasksStorageKey(), JSON.stringify(projectTasks));
  } catch (e) {
    console.warn('Failed to persist tasks:', e);
  }
}

function refreshTasksView() {
  const container = document.getElementById('tasks-list-container');
  if (!container) return;

  const total = projectTasks.length;
  const completed = projectTasks.filter(t => t.completed).length;
  const pending = total - completed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const elProgress = document.getElementById('lbl-tasks-progress');
  if (elProgress) elProgress.textContent = `${completed} of ${total} completed (${pct}%)`;

  const barProgress = document.getElementById('bar-tasks-progress');
  if (barProgress) barProgress.style.width = `${pct}%`;

  const cntAll = document.getElementById('cnt-filter-all');
  if (cntAll) cntAll.textContent = total;
  const cntPending = document.getElementById('cnt-filter-pending');
  if (cntPending) cntPending.textContent = pending;
  const cntCompleted = document.getElementById('cnt-filter-completed');
  if (cntCompleted) cntCompleted.textContent = completed;

  let filtered = projectTasks;
  if (currentTaskFilter === 'pending') filtered = projectTasks.filter(t => !t.completed);
  if (currentTaskFilter === 'completed') filtered = projectTasks.filter(t => t.completed);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px 8px; text-align: center; color: var(--text-dim); font-size: 11.5px;">
        ${total === 0 ? 'No tasks yet. Click "AI Auto-Plan" or enter a step above.' : 'No tasks match this filter.'}
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="task-item ${t.completed ? 'is-done' : ''}" data-id="${t.id}">
      <button class="task-check-btn ${t.completed ? 'checked' : ''}" data-id="${t.id}" title="${t.completed ? 'Mark incomplete' : 'Mark complete'}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${t.completed 
            ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            : '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>'}
        </svg>
      </button>
      <div class="task-info">
        <span class="task-name ${t.completed ? 'done' : ''}">${escapeHtml(t.title)}</span>
        <span class="task-tag task-tag-${t.priority}">${t.priority}</span>
      </div>
      <div class="task-actions">
        <button class="task-action-btn send-term" data-id="${t.id}" title="Send step to Claude Code CLI Terminal">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </button>
        <button class="task-action-btn edit-task" data-id="${t.id}" title="Edit step">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
          </svg>
        </button>
        <button class="task-action-btn del-task" data-id="${t.id}" title="Delete step">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.task-check-btn').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const t = projectTasks.find(x => x.id === id);
      if (t) {
        t.completed = !t.completed;
        saveProjectTasks();
        refreshTasksView();
        showToast(t.completed ? `Completed: "${t.title}"` : `Reopened: "${t.title}"`, 'success');
      }
    });
  });

  container.querySelectorAll('.send-term').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const t = projectTasks.find(x => x.id === id);
      if (t) {
        const dock = document.getElementById('terminal-dock');
        if (dock) dock.classList.remove('hidden');
        sendCommandToActiveTerminal(`fcc-claude "Implement step: ${t.title}"`);
        showToast('Sent step to Claude Terminal!', 'success');
      }
    });
  });

  container.querySelectorAll('.edit-task').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      const t = projectTasks.find(x => x.id === id);
      if (t) {
        const updated = prompt('Edit task step title:', t.title);
        if (updated && updated.trim()) {
          t.title = updated.trim();
          saveProjectTasks();
          refreshTasksView();
          showToast('Task updated.', 'success');
        }
      }
    });
  });

  container.querySelectorAll('.del-task').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      projectTasks = projectTasks.filter(x => x.id !== id);
      saveProjectTasks();
      refreshTasksView();
      showToast('Task removed.', 'warn');
    });
  });
}

function initProjectTasks() {
  loadProjectTasks();

  const form = document.getElementById('form-add-task');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.getElementById('inp-task-title');
      const sel = document.getElementById('sel-task-priority');
      const title = inp ? inp.value.trim() : '';
      const priority = sel ? sel.value : 'medium';
      if (!title) return;

      projectTasks.unshift({
        id: 't-' + Date.now(),
        title,
        priority,
        completed: false,
        createdAt: Date.now()
      });

      saveProjectTasks();
      if (inp) inp.value = '';
      refreshTasksView();
      showToast(`Added step: "${title}"`, 'success');
    });
  }

  ['all', 'pending', 'completed'].forEach(f => {
    const btn = document.getElementById('btn-filter-' + f);
    if (btn) {
      btn.addEventListener('click', () => {
        currentTaskFilter = f;
        document.querySelectorAll('.tasks-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        refreshTasksView();
      });
    }
  });

  const btnAi = document.getElementById('btn-tasks-ai-plan');
  if (btnAi) {
    btnAi.addEventListener('click', () => {
      const workspaceName = currentWorkspacePath ? currentWorkspacePath.split(/[\\/]/).pop() : 'Current Workspace';
      const planned = [
        { id: 't-' + Date.now() + '-1', title: `Define specifications and architecture for ${workspaceName}`, priority: 'high', completed: false, createdAt: Date.now() },
        { id: 't-' + Date.now() + '-2', title: `Implement core application logic and data interfaces`, priority: 'high', completed: false, createdAt: Date.now() },
        { id: 't-' + Date.now() + '-3', title: `Run automated tests and validate edge-cases`, priority: 'medium', completed: false, createdAt: Date.now() },
        { id: 't-' + Date.now() + '-4', title: `Verify build artifacts and deployment release`, priority: 'medium', completed: false, createdAt: Date.now() }
      ];
      projectTasks.push(...planned);
      saveProjectTasks();
      refreshTasksView();
      showToast(`AI Auto-Planned 4 steps for ${workspaceName}!`, 'success');
    });
  }

  const btnClear = document.getElementById('btn-tasks-clear-completed');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      const prevCount = projectTasks.length;
      projectTasks = projectTasks.filter(t => !t.completed);
      saveProjectTasks();
      refreshTasksView();
      showToast(`Cleared ${prevCount - projectTasks.length} completed tasks.`, 'info');
    });
  }

  const btnRefresh = document.getElementById('btn-tasks-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadProjectTasks();
      refreshTasksView();
      showToast('Tasks reloaded.', 'info');
    });
  }

  refreshTasksView();
}

// ==========================================================================
// Initialization Sequence
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  try {
    const s = await window.electronAPI.getSettings();
    if (s) ideSettings = { ...ideSettings, ...s };
  } catch (e) {}

  applyTheme(ideSettings.theme);
  applyTranslations(ideSettings.language);

  // Initialize Monaco Editor
  await initMonacoEditor();

  // Initialize Terminal Multi-Session
  setupTerminalListeners();
  await createTerminalTab();

  // Activity Bar Navigation
  document.querySelectorAll('.act-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (!targetView) return;

      const sidebar = document.getElementById('sidebar-panel');
      const isAlreadyActive = btn.classList.contains('active') && !sidebar.classList.contains('hidden');

      if (isAlreadyActive) {
        sidebar.classList.toggle('hidden');
      } else {
        sidebar.classList.remove('hidden');
        document.querySelectorAll('.act-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sidebar-view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        const view = document.getElementById(targetView);
        if (view) view.classList.add('active');
        if (targetView === 'view-setup') refreshInstallerCheck();
        if (targetView === 'view-keys') refreshKeysList();
        if (targetView === 'view-tasks') refreshTasksView();
      }
      if (monacoEditor) monacoEditor.layout();
    });
  });

  // Initialize Project Tasks & Steps
  initProjectTasks();

  // Top Bar Event Wiring
  document.getElementById('btn-workspace-pill').addEventListener('click', chooseProjectFolder);
  document.getElementById('btn-server-state').addEventListener('click', toggleServerState);
  document.getElementById('btn-save-active-file').addEventListener('click', saveActiveFile);
  document.getElementById('btn-editor-wrap').addEventListener('click', toggleWordWrap);
  document.getElementById('btn-editor-preview').addEventListener('click', toggleMarkdownPreview);
  document.getElementById('btn-launch-claude-cli').addEventListener('click', () => {
    const dock = document.getElementById('terminal-dock');
    if (dock) dock.classList.remove('hidden');
    sendCommandToActiveTerminal('fcc-claude');
  });
  document.getElementById('btn-open-admin-web').addEventListener('click', () => {
    window.electronAPI.openExternal(`http://localhost:${serverPort}`);
  });
  document.getElementById('btn-toggle-terminal').addEventListener('click', () => {
    const dock = document.getElementById('terminal-dock');
    if (dock) {
      dock.classList.toggle('hidden');
      fitActiveTerminal();
    }
  });
  document.getElementById('btn-toggle-ai-chat').addEventListener('click', () => {
    const panel = document.getElementById('ai-assistant-panel');
    if (panel) panel.classList.toggle('hidden');
  });

  // Terminal Controls
  document.getElementById('btn-term-new-tab').addEventListener('click', () => createTerminalTab());
  document.getElementById('btn-term-clear').addEventListener('click', () => {
    if (activeTerminalSession) activeTerminalSession.xterm.clear();
  });
  document.getElementById('btn-term-restart').addEventListener('click', () => {
    if (activeTerminalSession) {
      window.electronAPI.restartTerminal();
      showToast('Restarting terminal session...', 'info');
    }
  });
  document.getElementById('btn-term-max').addEventListener('click', () => {
    const dock = document.getElementById('terminal-dock');
    if (dock) {
      dock.classList.toggle('maximized');
      fitActiveTerminal();
    }
  });
  document.getElementById('btn-term-close').addEventListener('click', () => {
    const dock = document.getElementById('terminal-dock');
    if (dock) dock.classList.add('hidden');
  });

  // Quick Chips in Terminal
  document.querySelectorAll('.term-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendCommandToActiveTerminal(chip.dataset.cmd);
    });
  });

  // Server Logs Events
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    serverLogs = [];
    const vp = document.getElementById('server-logs-viewport');
    if (vp) vp.innerHTML = '';
  });
  document.getElementById('btn-copy-server-url').addEventListener('click', () => {
    navigator.clipboard.writeText(`http://127.0.0.1:${serverPort}`);
    showToast('Copied Server URL to clipboard', 'success');
  });

  // Backend Server Status & Log Listeners
  window.electronAPI.onServerStatus(({ status, port }) => {
    serverState = status;
    serverPort = port;
    updateServerButtonUI();
    updateServerStatusBarUI();
  });

  window.electronAPI.onServerLog((entry) => {
    appendServerLogEntry(entry);
  });

  // Watcher file change listener
  window.electronAPI.onFileChange(() => {
    if (currentWorkspacePath) {
      loadWorkspace(currentWorkspacePath);
    }
  });

  // Setup Subsystems
  setupAIChat();
  setupWorkspaceSearch();
  setupKeyEvents();
  setupInstallerEvents();
  setupSettingsEvents();
  setupCommandPalette();
  setupResizableSplitters();
  setupWindowControls();
  setupGlobalShortcuts();

  // Load Initial Workspace
  currentWorkspacePath = await window.electronAPI.getWorkspacePath();
  await loadWorkspace(currentWorkspacePath);

  // Initial Checks & Status
  await refreshServerStatus();
  await refreshInstallerCheck();
  await refreshKeysList();

  // Open Welcome Page in Preview Mode by Default
  openWelcomeTab();
});
