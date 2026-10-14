// ==========================================================================
// Claude Studio - Core Chat View Component
// Streaming Typing Effect, Markdown Parsing, Welcome Cards, Message Actions & Export
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.ChatView = (function () {
  let viewEl = null;
  let messagesListEl = null;

  function render(container) {
    viewEl = container;
    update();

    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (['chat:selected', 'chat:created', 'chat:renamed', 'chat:deleted', 'message:added', 'message:updated', 'message:rated', 'message:deleted'].includes(event)) {
        update();
      }
    });
  }

  function update() {
    if (!viewEl) return;
    const state = window.ClaudeStudio.Store.getState();
    const chat = state.conversations.find(c => c.id === state.activeChatId);

    if (!chat) {
      renderWelcomeState();
      return;
    }

    viewEl.innerHTML = `
      <div class="chat-view-container">
        <!-- Chat Top Bar -->
        <header class="chat-header-bar">
          <div class="chat-header-left">
            <button class="icon-btn-ghost mobile-menu-toggle" id="btn-mobile-sidebar" title="Menu">
              ${window.ClaudeStudio.Icons.svg('layout-sidebar', 'icon-sm', 16)}
            </button>
            <h2 class="chat-current-title" id="chat-title-heading" title="Click to rename">${window.ClaudeStudio.Markdown.escapeHtml(chat.title)}</h2>
            ${chat.isPinned ? window.ClaudeStudio.Icons.svg('pin', 'header-pin-icon', 13) : ''}
          </div>

          <div class="chat-header-actions">
            <button class="header-action-btn" id="btn-export-chat" title="Export Conversation">
              ${window.ClaudeStudio.Icons.svg('download', 'act-svg', 14)}
              <span>Export</span>
            </button>
            <button class="header-action-btn" id="btn-share-chat" title="Share Conversation">
              ${window.ClaudeStudio.Icons.svg('share-2', 'act-svg', 14)}
              <span>Share</span>
            </button>
            <button class="icon-btn-ghost" id="btn-toggle-artifacts" title="Artifacts Panel">
              ${window.ClaudeStudio.Icons.svg('panel-right-open', 'act-svg', 16)}
            </button>
          </div>
        </header>

        <!-- Messages Stream Container -->
        <div class="messages-scroll-area" id="messages-scroll-area">
          ${chat.messages.length === 0 ? renderPromptCards() : renderMessagesList(chat.messages)}
        </div>

        <!-- Sticky Bottom Composer Area -->
        <div class="chat-composer-dock" id="chat-composer-dock"></div>
      </div>
    `;

    messagesListEl = viewEl.querySelector('#messages-scroll-area');

    // Attach Composer inside dock
    const composerDock = viewEl.querySelector('#chat-composer-dock');
    window.ClaudeStudio.Components.Composer.render(composerDock, handleSendMessage);

    // Bind Top Bar Actions
    viewEl.querySelector('#btn-mobile-sidebar')?.addEventListener('click', () => {
      window.ClaudeStudio.Store.toggleSidebar();
    });

    viewEl.querySelector('#chat-title-heading')?.addEventListener('click', () => {
      const newTitle = prompt('Rename this chat:', chat.title);
      if (newTitle) {
        window.ClaudeStudio.Store.renameChat(chat.id, newTitle);
      }
    });

    viewEl.querySelector('#btn-toggle-artifacts')?.addEventListener('click', () => {
      const cur = window.ClaudeStudio.Store.getState();
      if (cur.isArtifactsOpen) {
        window.ClaudeStudio.Store.closeArtifact();
      } else {
        const lastArtifactMsg = [...chat.messages].reverse().find(m => m.hasArtifact && m.artifact);
        if (lastArtifactMsg) {
          window.ClaudeStudio.Store.openArtifact(lastArtifactMsg.artifact);
        } else {
          window.ClaudeStudio.Components.Toasts.info('No code artifacts in this chat yet.');
        }
      }
    });

    viewEl.querySelector('#btn-export-chat')?.addEventListener('click', () => {
      exportConversation(chat);
    });

    viewEl.querySelector('#btn-share-chat')?.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      window.ClaudeStudio.Components.Toasts.success('Shareable link copied to clipboard!');
    });

    // Bind Welcome Prompt Cards click
    viewEl.querySelectorAll('.welcome-prompt-card').forEach(card => {
      card.addEventListener('click', () => {
        const promptText = card.dataset.prompt;
        const textarea = document.getElementById('composer-textarea');
        if (textarea) {
          textarea.value = promptText;
          textarea.dispatchEvent(new Event('input'));
          textarea.focus();
        }
      });
    });

    // Attach message action listeners
    attachMessageEventListeners(chat);

    // Scroll to bottom
    scrollToBottom();
  }

  function renderWelcomeState() {
    viewEl.innerHTML = `
      <div class="chat-view-container">
        <div class="messages-scroll-area">
          ${renderPromptCards()}
        </div>
        <div class="chat-composer-dock" id="chat-composer-dock"></div>
      </div>
    `;
    const composerDock = viewEl.querySelector('#chat-composer-dock');
    window.ClaudeStudio.Components.Composer.render(composerDock, handleSendMessage);
  }

  function renderPromptCards() {
    const user = window.ClaudeStudio.Store.getState().settings.userProfile;
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `
      <div class="welcome-container">
        <div class="welcome-hero">
          <div class="welcome-sparkle-badge">
            ${window.ClaudeStudio.Icons.svg('sparkles', 'w-sparkle', 16)}
            <span>Claude Studio Pro</span>
          </div>
          <h1 class="welcome-title">${greeting}, ${window.ClaudeStudio.Markdown.escapeHtml(user.name.split(' ')[0])}.</h1>
          <p class="welcome-subtitle">What would you like to explore or architect today?</p>
        </div>

        <div class="welcome-cards-grid">
          <div class="welcome-prompt-card" data-prompt="Design an interactive pure SVG chart component in vanilla JS with glowing gradients and zero external libraries.">
            <div class="card-icon-wrap" style="color:#d97757;">
              ${window.ClaudeStudio.Icons.svg('compass', 'w-card-icon', 20)}
            </div>
            <div class="card-title">Interactive SVG Chart Component</div>
            <div class="card-desc">Sub-pixel Bezier curve area chart with hover crosshairs and reactive data telemetry.</div>
          </div>

          <div class="welcome-prompt-card" data-prompt="Review our ClickHouse partitioning and sorting key strategies for 80M daily event ingestion without small-part merge amplification.">
            <div class="card-icon-wrap" style="color:#8b7cf6;">
              ${window.ClaudeStudio.Icons.svg('cpu', 'w-card-icon', 20)}
            </div>
            <div class="card-title">ClickHouse Partitioning Strategy</div>
            <div class="card-desc">Architect table schemas to prevent part mutations and achieve sub-second aggregation queries.</div>
          </div>

          <div class="welcome-prompt-card" data-prompt="Build a clean, accessible Dialog modal primitive with keyboard focus trap in vanilla JS without NPM packages.">
            <div class="card-icon-wrap" style="color:#5fbf9a;">
              ${window.ClaudeStudio.Icons.svg('layers', 'w-card-icon', 20)}
            </div>
            <div class="card-title">Accessible Dialog Modal</div>
            <div class="card-desc">Strict WCAG AAA modal with Escape key handling, focus trap, and smooth backdrop transition.</div>
          </div>

          <div class="welcome-prompt-card" data-prompt="សូមពន្យល់ពីរបៀបកាត់ព្យាង្គភាសាខ្មែរ (Khmer Syllable Segmentation) ក្នុង JavaScript ឱ្យបានក្បោះក្បាយ។">
            <div class="card-icon-wrap" style="color:#e0a84a;">
              ${window.ClaudeStudio.Icons.svg('book-open', 'w-card-icon', 20)}
            </div>
            <div class="card-title">Khmer Syllable Segmenter</div>
            <div class="card-desc">សរសេរកូដកាត់ព្យាង្គភាសាខ្មែរដោយផ្អែកលើ Unicode ranges [U+1780-U+17D2] យ៉ាងត្រឹមត្រូវ។</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMessagesList(messages) {
    return messages.map(m => {
      const isUser = m.role === 'user';
      const renderedContent = isUser ? window.ClaudeStudio.Markdown.escapeHtml(m.content) : window.ClaudeStudio.Markdown.render(m.content);

      return `
        <div class="message-row ${isUser ? 'user-row' : 'assistant-row'}" data-msg-id="${m.id}">
          <div class="msg-avatar-col">
            <div class="avatar-badge ${isUser ? 'user-avatar-badge' : 'assistant-avatar-badge'}">
              ${isUser ? window.ClaudeStudio.Icons.svg('message-square', 'av-icon', 13) : window.ClaudeStudio.Icons.svg('sparkles', 'av-icon', 14)}
            </div>
          </div>

          <div class="msg-content-col">
            <div class="msg-meta-row">
              <span class="msg-author-name">${isUser ? 'You' : 'Claude Studio'}</span>
              <span class="msg-timestamp">${formatTime(m.timestamp)}</span>
            </div>

            <div class="msg-body ${isUser ? 'msg-body-user' : 'msg-body-assistant'}">
              ${renderedContent}
            </div>

            ${m.hasArtifact && m.artifact ? `
              <div class="artifact-card-banner" data-msg-id="${m.id}">
                <div class="artifact-banner-left">
                  <div class="artifact-icon-box">
                    ${window.ClaudeStudio.Icons.svg('code', 'art-svg', 16)}
                  </div>
                  <div>
                    <div class="artifact-banner-title">${window.ClaudeStudio.Markdown.escapeHtml(m.artifact.title)}</div>
                    <div class="artifact-banner-sub">Click to inspect and test live in split-pane preview</div>
                  </div>
                </div>
                <button class="btn btn-secondary btn-view-artifact">Open Artifact →</button>
              </div>
            ` : ''}

            <div class="msg-actions-row">
              <button class="msg-action-btn btn-copy-msg" title="Copy message">
                ${window.ClaudeStudio.Icons.svg('copy', 'icon-xs', 13)}
              </button>
              ${!isUser ? `
                <button class="msg-action-btn btn-regen-msg" title="Regenerate response">
                  ${window.ClaudeStudio.Icons.svg('refresh-cw', 'icon-xs', 13)}
                </button>
                <button class="msg-action-btn btn-rate-up ${m.rating === 'up' ? 'rated' : ''}" title="Helpful response">
                  ${window.ClaudeStudio.Icons.svg('thumbs-up', 'icon-xs', 13)}
                </button>
                <button class="msg-action-btn btn-rate-down ${m.rating === 'down' ? 'rated' : ''}" title="Unhelpful response">
                  ${window.ClaudeStudio.Icons.svg('thumbs-down', 'icon-xs', 13)}
                </button>
              ` : `
                <button class="msg-action-btn btn-edit-msg" title="Edit message">
                  ${window.ClaudeStudio.Icons.svg('edit-2', 'icon-xs', 13)}
                </button>
              `}
              <button class="msg-action-btn btn-delete-msg" title="Delete message">
                ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 13)}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function attachMessageEventListeners(chat) {
    viewEl.querySelectorAll('.message-row').forEach(row => {
      const msgId = row.dataset.msgId;
      const msg = chat.messages.find(m => m.id === msgId);
      if (!msg) return;

      // Copy message
      row.querySelector('.btn-copy-msg')?.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.content);
        window.ClaudeStudio.Components.Toasts.success('Message content copied!');
      });

      // Regenerate message
      row.querySelector('.btn-regen-msg')?.addEventListener('click', () => {
        const lastUserMsg = [...chat.messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
          handleSendMessage({ text: lastUserMsg.content, isRegen: true });
        }
      });

      // Thumbs up / down
      row.querySelector('.btn-rate-up')?.addEventListener('click', () => {
        window.ClaudeStudio.Store.rateMessage(chat.id, msgId, 'up');
        window.ClaudeStudio.Components.Toasts.success('Feedback recorded!');
      });

      row.querySelector('.btn-rate-down')?.addEventListener('click', () => {
        window.ClaudeStudio.Store.rateMessage(chat.id, msgId, 'down');
        window.ClaudeStudio.Components.Toasts.info('Feedback recorded.');
      });

      // Edit user message
      row.querySelector('.btn-edit-msg')?.addEventListener('click', () => {
        const newText = prompt('Edit your message:', msg.content);
        if (newText && newText !== msg.content) {
          window.ClaudeStudio.Store.updateMessage(chat.id, msgId, newText);
          handleSendMessage({ text: newText, isRegen: true });
        }
      });

      // Delete message
      row.querySelector('.btn-delete-msg')?.addEventListener('click', () => {
        window.ClaudeStudio.Store.deleteMessage(chat.id, msgId);
        window.ClaudeStudio.Components.Toasts.info('Message deleted.');
      });

      // Open Artifact Banner
      row.querySelector('.artifact-card-banner')?.addEventListener('click', () => {
        if (msg.artifact) {
          window.ClaudeStudio.Store.openArtifact(msg.artifact);
        }
      });
    });

    // Bind Code Block copy & wrap buttons
    viewEl.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = decodeURIComponent(e.currentTarget.dataset.code);
        navigator.clipboard.writeText(code);
        const span = e.currentTarget.querySelector('span');
        if (span) {
          span.textContent = 'Copied!';
          setTimeout(() => { span.textContent = 'Copy'; }, 2000);
        }
        window.ClaudeStudio.Components.Toasts.success('Code copied to clipboard!');
      });
    });

    viewEl.querySelectorAll('.btn-wrap-code').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const container = e.currentTarget.closest('.code-block-container');
        container.classList.toggle('code-wrap-enabled');
      });
    });
  }

  async function handleSendMessage({ text, files = [], isRegen = false }) {
    const state = window.ClaudeStudio.Store.getState();
    let chat = state.conversations.find(c => c.id === state.activeChatId);

    if (!chat) {
      chat = window.ClaudeStudio.Store.createChat(text);
    } else if (!isRegen) {
      window.ClaudeStudio.Store.addMessage(chat.id, {
        role: 'user',
        content: text
      });
    }

    // Set generating state
    window.ClaudeStudio.Store.setGenerating(true);

    // Create placeholder assistant message for streaming
    const assistantMsg = window.ClaudeStudio.Store.addMessage(chat.id, {
      role: 'assistant',
      content: ''
    });

    scrollToBottom();

    // Query AI model with typewriter streaming
    window.ClaudeStudio.AIService.sendToModel({
      messages: chat.messages,
      model: state.selectedModel,
      onChunk: (accumulated) => {
        // Find DOM element and stream update live
        const activeRow = viewEl.querySelector(`[data-msg-id="${assistantMsg.id}"]`);
        if (activeRow) {
          const bodyEl = activeRow.querySelector('.msg-body');
          if (bodyEl) {
            bodyEl.innerHTML = window.ClaudeStudio.Markdown.render(accumulated) + '<span class="typing-cursor"></span>';
          }
        }
        scrollToBottom();
      },
      onDone: ({ text: finalText, artifact }) => {
        window.ClaudeStudio.Store.setGenerating(false);
        assistantMsg.content = finalText;
        if (artifact) {
          assistantMsg.hasArtifact = true;
          assistantMsg.artifact = artifact;
          window.ClaudeStudio.Store.openArtifact(artifact);
        }
        update();
      },
      onError: (err) => {
        window.ClaudeStudio.Store.setGenerating(false);
        assistantMsg.content = `⚠️ An error occurred while streaming response: ${err.message}`;
        update();
      }
    });
  }

  function exportConversation(chat) {
    const md = `# ${chat.title}\nExported from Claude Studio: ${new Date().toISOString()}\n\n---\n\n` +
      chat.messages.map(m => `### ${m.role === 'user' ? 'User' : 'Claude'}\n\n${m.content}\n\n`).join('---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${chat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    window.ClaudeStudio.Components.Toasts.success('Conversation exported as Markdown file!');
  }

  function scrollToBottom() {
    if (messagesListEl) {
      messagesListEl.scrollTop = messagesListEl.scrollHeight;
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return {
    render
  };
})();
