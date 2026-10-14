// ==========================================================================
// Claude Studio - Markdown & Syntax Highlight Renderer
// Full support for Headings, Tables, Lists, Quotes, Code Blocks with Copy & Wrap
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

window.ClaudeStudio.Markdown = (function () {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightSyntax(code, lang) {
    let escaped = escapeHtml(code);
    lang = (lang || '').toLowerCase();

    // Keywords highlighting
    const keywords = [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'switch', 'case', 'break', 'class', 'extends', 'import', 'export', 'default',
      'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'typeof',
      'interface', 'type', 'def', 'print', 'select', 'where', 'from', 'create', 'table'
    ];
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    escaped = escaped.replace(kwRegex, '<span class="tok-kw">$1</span>');

    // Strings
    escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="tok-str">$1$2$1</span>');

    // Numbers
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-num">$1</span>');

    // Comments
    escaped = escaped.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tok-com">$1</span>');

    return escaped;
  }

  function render(text) {
    if (!text) return '';

    // Extract code blocks first to protect them from inline markdown rules
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: lang.trim() || 'code', code });
      return id;
    });

    const lines = text.split('\n');
    let out = [];
    let inList = false;
    let inTable = false;
    let tableRows = [];

    function closeList() {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
    }

    function closeTable() {
      if (inTable) {
        let tableHtml = '<div class="table-wrap"><table class="md-table">';
        tableRows.forEach((row, i) => {
          tableHtml += '<tr>';
          const tag = (i === 0) ? 'th' : 'td';
          row.forEach(cell => {
            tableHtml += `<${tag}>${formatInline(cell.trim())}</${tag}>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</table></div>';
        out.push(tableHtml);
        inTable = false;
        tableRows = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Table row
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        closeList();
        inTable = true;
        const cells = line.trim().slice(1, -1).split('|');
        // Check if it's separator row (|---|---|)
        if (cells.every(c => /^[\s\-:]+$/.test(c))) {
          continue; // skip separator
        }
        tableRows.push(cells);
        continue;
      } else {
        closeTable();
      }

      // Headings
      if (/^### (.*$)/.test(line)) {
        closeList();
        out.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      } else if (/^## (.*$)/.test(line)) {
        closeList();
        out.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      } else if (/^# (.*$)/.test(line)) {
        closeList();
        out.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      }
      // Blockquote
      else if (/^> (.*$)/.test(line)) {
        closeList();
        out.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      }
      // Bullet list
      else if (/^[\*\-] (.*$)/.test(line)) {
        if (!inList) {
          out.push('<ul>');
          inList = true;
        }
        out.push(`<li>${formatInline(line.slice(2))}</li>`);
      }
      // Blank line
      else if (!line.trim()) {
        closeList();
        out.push('<div class="md-gap"></div>');
      }
      // Standard paragraph
      else {
        closeList();
        out.push(`<p>${formatInline(line)}</p>`);
      }
    }

    closeList();
    closeTable();

    let result = out.join('');

    // Restore Code Blocks with rich interactive headers & actions
    result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => {
      const item = codeBlocks[parseInt(idx, 10)];
      const highlighted = highlightSyntax(item.code, item.lang);
      const encodedRaw = encodeURIComponent(item.code);

      return `
        <div class="code-block-container" data-lang="${escapeHtml(item.lang)}">
          <div class="code-block-header">
            <span class="code-block-lang">${escapeHtml(item.lang.toUpperCase())}</span>
            <div class="code-block-actions">
              <button class="code-btn btn-wrap-code" title="Toggle Line Wrap">
                ${window.ClaudeStudio.Icons.svg('list', 'btn-icon', 13)} Wrap
              </button>
              <button class="code-btn btn-copy-code" data-code="${encodedRaw}" title="Copy code">
                ${window.ClaudeStudio.Icons.svg('copy', 'btn-icon', 13)} <span>Copy</span>
              </button>
            </div>
          </div>
          <pre class="code-pre"><code class="code-content">${highlighted}</code></pre>
        </div>
      `;
    });

    return result;
  }

  function formatInline(str) {
    let s = escapeHtml(str);
    // Bold
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
    return s;
  }

  return {
    render,
    escapeHtml
  };
})();
