// ==========================================================================
// Claude Studio - Smart Message Composer
// Auto-growing Textarea, Slash Commands, File Attachments, Speech API, Token Counter
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.Composer = (function () {
  let attachedFiles = [];
  let isVoiceRecording = false;
  let recognitionInstance = null;

  const slashCommands = [
    { cmd: '/summarize', desc: 'Synthesize and summarize active conversation or file' },
    { cmd: '/translate', desc: 'Translate text between English and Khmer / other languages' },
    { cmd: '/code', desc: 'Generate zero-placeholder production code implementation' },
    { cmd: '/explain', desc: 'Break down complex logic, architecture, and tradeoffs' }
  ];

  function render(container, onSend) {
    container.innerHTML = `
      <div class="composer-card">
        <!-- Attached Files Chips Bar -->
        <div class="composer-attachments-bar hidden" id="composer-attachments"></div>

        <!-- Slash Commands Autocomplete Popup -->
        <div class="slash-commands-popup hidden" id="slash-popup"></div>

        <!-- Textarea Row -->
        <div class="composer-input-row">
          <textarea
            id="composer-textarea"
            class="composer-textarea"
            rows="1"
            placeholder="Reply to Claude... (Type '/' for commands, Shift+Enter for newline)"
          ></textarea>
        </div>

        <!-- Bottom Controls Bar -->
        <div class="composer-controls-row">
          <div class="composer-left-tools">
            <button class="tool-btn btn-attach-file" id="btn-attach" title="Attach Files">
              ${window.ClaudeStudio.Icons.svg('paperclip', 'tool-svg', 16)}
              <input type="file" id="file-input-hidden" multiple style="display:none;">
            </button>
            <button class="tool-btn btn-voice-input" id="btn-voice" title="Dictate with Voice">
              ${window.ClaudeStudio.Icons.svg('mic', 'tool-svg', 16)}
            </button>
            
            <div class="composer-model-pill">
              <select id="composer-model-select" class="composer-select">
                <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                <option value="nemotron-120b">Nemotron 120B (Free)</option>
              </select>
            </div>
          </div>

          <div class="composer-right-tools">
            <span class="token-counter" id="token-counter">0 chars (~0 tokens)</span>
            
            <button class="btn-send-message" id="btn-send-msg" title="Send (Enter)">
              ${window.ClaudeStudio.Icons.svg('send', 'send-svg', 15)}
            </button>

            <button class="btn-stop-generating hidden" id="btn-stop-msg" title="Stop generating">
              ${window.ClaudeStudio.Icons.svg('square', 'stop-svg', 13)}
              <span>Stop</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const textarea = container.querySelector('#composer-textarea');
    const attachmentsBar = container.querySelector('#composer-attachments');
    const slashPopup = container.querySelector('#slash-popup');
    const fileInput = container.querySelector('#file-input-hidden');
    const btnAttach = container.querySelector('#btn-attach');
    const btnVoice = container.querySelector('#btn-voice');
    const btnSend = container.querySelector('#btn-send-msg');
    const btnStop = container.querySelector('#btn-stop-msg');
    const tokenCounter = container.querySelector('#token-counter');
    const modelSelect = container.querySelector('#composer-model-select');

    // Auto-grow textarea
    function autoGrow() {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 220);
      textarea.style.height = newHeight + 'px';

      // Update token counter
      const len = textarea.value.length;
      const tokens = Math.ceil(len / 4);
      tokenCounter.textContent = `${len} chars (~${tokens} tokens)`;

      // Slash command check
      checkSlashCommand();
    }

    textarea.addEventListener('input', autoGrow);

    // Key handling (Enter to send, Shift+Enter for newline)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (!slashPopup.classList.contains('hidden')) {
          // If slash popup is open, choose first command
          const firstCmd = slashPopup.querySelector('.slash-item');
          if (firstCmd) {
            e.preventDefault();
            firstCmd.click();
            return;
          }
        }

        e.preventDefault();
        submitMessage();
      } else if (e.key === 'Escape') {
        slashPopup.classList.add('hidden');
      }
    });

    // Send action
    function submitMessage() {
      const text = textarea.value.trim();
      if (!text && attachedFiles.length === 0) return;

      const state = window.ClaudeStudio.Store.getState();
      if (state.isGenerating) return;

      const payload = {
        text,
        files: [...attachedFiles],
        model: modelSelect.value
      };

      // Reset composer
      textarea.value = '';
      textarea.style.height = 'auto';
      attachedFiles = [];
      renderAttachments();
      tokenCounter.textContent = '0 chars (~0 tokens)';
      slashPopup.classList.add('hidden');

      onSend(payload);
    }

    btnSend.addEventListener('click', submitMessage);

    // Stop generation
    btnStop.addEventListener('click', () => {
      window.ClaudeStudio.AIService.stopGeneration();
    });

    // Attach Files
    btnAttach.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(f => {
        attachedFiles.push({
          name: f.name,
          size: `${(f.size / 1024).toFixed(1)} KB`,
          type: f.type || 'text/plain'
        });
      });
      renderAttachments();
      fileInput.value = '';
    });

    function renderAttachments() {
      if (attachedFiles.length === 0) {
        attachmentsBar.classList.add('hidden');
        attachmentsBar.innerHTML = '';
        return;
      }

      attachmentsBar.classList.remove('hidden');
      attachmentsBar.innerHTML = attachedFiles.map((f, i) => `
        <div class="attachment-chip">
          ${window.ClaudeStudio.Icons.svg('paperclip', 'chip-icon', 12)}
          <span class="chip-name">${window.ClaudeStudio.Markdown.escapeHtml(f.name)}</span>
          <span class="chip-size">(${f.size})</span>
          <button class="chip-remove-btn" data-index="${i}">
            ${window.ClaudeStudio.Icons.svg('x', 'chip-x', 11)}
          </button>
        </div>
      `).join('');

      attachmentsBar.querySelectorAll('.chip-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10);
          attachedFiles.splice(idx, 1);
          renderAttachments();
        });
      });
    }

    // Slash Commands Handling
    function checkSlashCommand() {
      const val = textarea.value;
      if (val.startsWith('/')) {
        const query = val.toLowerCase();
        const matches = slashCommands.filter(c => c.cmd.startsWith(query));

        if (matches.length > 0) {
          slashPopup.innerHTML = matches.map(c => `
            <div class="slash-item" data-cmd="${c.cmd}">
              <span class="slash-cmd">${c.cmd}</span>
              <span class="slash-desc">${c.desc}</span>
            </div>
          `).join('');

          slashPopup.classList.remove('hidden');

          slashPopup.querySelectorAll('.slash-item').forEach(item => {
            item.addEventListener('click', () => {
              textarea.value = item.dataset.cmd + ' ';
              textarea.focus();
              slashPopup.classList.add('hidden');
            });
          });
        } else {
          slashPopup.classList.add('hidden');
        }
      } else {
        slashPopup.classList.add('hidden');
      }
    }

    // Voice Input via Web Speech API with fallback toast
    btnVoice.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        window.ClaudeStudio.Components.Toasts.warning(
          'Web Speech API is not supported in this browser. Please use Chrome/Edge or type manually.',
          'Voice Input'
        );
        return;
      }

      if (isVoiceRecording) {
        if (recognitionInstance) recognitionInstance.stop();
        isVoiceRecording = false;
        btnVoice.classList.remove('recording');
        window.ClaudeStudio.Components.Toasts.info('Voice input stopped.');
        return;
      }

      try {
        recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;

        recognitionInstance.onstart = () => {
          isVoiceRecording = true;
          btnVoice.classList.add('recording');
          window.ClaudeStudio.Components.Toasts.info('Listening... Speak now.', 'Voice Dictation');
        };

        recognitionInstance.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          textarea.value = (textarea.value + ' ' + transcript).trim();
          autoGrow();
        };

        recognitionInstance.onerror = (e) => {
          isVoiceRecording = false;
          btnVoice.classList.remove('recording');
          window.ClaudeStudio.Components.Toasts.error(`Microphone error: ${e.error}`);
        };

        recognitionInstance.onend = () => {
          isVoiceRecording = false;
          btnVoice.classList.remove('recording');
        };

        recognitionInstance.start();
      } catch (err) {
        window.ClaudeStudio.Components.Toasts.error('Could not start microphone: ' + err.message);
      }
    });

    // Sync generating state
    window.ClaudeStudio.Store.subscribe((state, event) => {
      if (event === 'generating:change') {
        btnSend.classList.toggle('hidden', state.isGenerating);
        btnStop.classList.toggle('hidden', !state.isGenerating);
      }
    });
  }

  return {
    render
  };
})();
