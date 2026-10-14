// ==========================================================================
// Claude Studio - Projects Directory & Detail View Component
// Grid of 8 Project Cards, Custom Instructions, Knowledge Files, and Step Tasks
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};
window.ClaudeStudio.Components = window.ClaudeStudio.Components || {};

window.ClaudeStudio.Components.ProjectsView = (function () {
  let viewEl = null;
  let activeFilter = 'all'; // 'all' | 'pending' | 'completed'

  function renderList(container) {
    viewEl = container;
    const state = window.ClaudeStudio.Store.getState();

    viewEl.innerHTML = `
      <div class="projects-page-container">
        <div class="page-header-row">
          <div>
            <h1 class="page-main-title">Projects</h1>
            <p class="page-subtitle">Group conversations, custom instructions, contextual knowledge files, and step tasks into workspaces.</p>
          </div>
          <button class="btn btn-primary" id="btn-create-proj">
            ${window.ClaudeStudio.Icons.svg('plus', 'btn-icon', 16)}
            <span>New Project</span>
          </button>
        </div>

        <div class="projects-grid">
          ${state.projects.map(p => {
            const tasks = p.tasks || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.completed).length;
            const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const isAllDone = totalTasks > 0 && completedTasks === totalTasks;

            return `
            <div class="project-card" data-id="${p.id}">
              <div class="proj-card-top">
                <div class="proj-icon-badge" style="background:${p.color}20; color:${p.color}; border:1px solid ${p.color}40;">
                  ${window.ClaudeStudio.Icons.svg(p.icon || 'layers', 'p-svg', 18)}
                </div>
                <div class="proj-actions">
                  <button class="icon-btn-ghost btn-proj-edit" data-id="${p.id}" title="Edit Project">
                    ${window.ClaudeStudio.Icons.svg('edit-2', 'icon-xs', 14)}
                  </button>
                  <button class="icon-btn-ghost btn-proj-delete" data-id="${p.id}" title="Delete Project">
                    ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 14)}
                  </button>
                </div>
              </div>

              <h3 class="proj-name">${window.ClaudeStudio.Markdown.escapeHtml(p.name)}</h3>
              <p class="proj-desc">${window.ClaudeStudio.Markdown.escapeHtml(p.description)}</p>

              <div class="proj-card-footer">
                <span class="proj-stat">
                  ${window.ClaudeStudio.Icons.svg('message-square', 'stat-icon', 13)}
                  ${p.chatsCount} chats
                </span>
                <span class="proj-stat">
                  ${window.ClaudeStudio.Icons.svg('file-text', 'stat-icon', 13)}
                  ${p.filesCount} files
                </span>
                <span class="proj-stat proj-stat-tasks ${isAllDone ? 'tasks-complete' : ''}" title="${completedTasks} of ${totalTasks} steps completed">
                  ${window.ClaudeStudio.Icons.svg(isAllDone ? 'check-circle' : 'check-square', 'stat-icon', 13)}
                  ${completedTasks}/${totalTasks} steps
                </span>
              </div>

              ${totalTasks > 0 ? `
                <div class="proj-card-progress" title="${pct}% steps completed">
                  <div class="proj-card-progress-bar" style="width: ${pct}%; background: ${p.color};"></div>
                </div>
              ` : ''}
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // New project modal trigger
    viewEl.querySelector('#btn-create-proj')?.addEventListener('click', () => {
      openProjectModal();
    });

    // Card navigation & actions
    viewEl.querySelectorAll('.project-card').forEach(card => {
      const projId = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.proj-actions')) return;
        window.ClaudeStudio.Router.navigate(`/projects/${projId}`);
      });
    });

    viewEl.querySelectorAll('.btn-proj-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = state.projects.find(x => x.id === btn.dataset.id);
        if (p) openProjectModal(p);
      });
    });

    viewEl.querySelectorAll('.btn-proj-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        window.ClaudeStudio.Components.Modals.confirm({
          title: 'Delete Project',
          message: 'Delete this project workspace? The conversations will remain in your global history.',
          confirmText: 'Delete',
          onConfirm: () => {
            window.ClaudeStudio.Store.deleteProject(id);
            window.ClaudeStudio.Components.Toasts.info('Project workspace deleted.');
            renderList(viewEl);
          }
        });
      });
    });
  }

  function renderDetail(container, projectId) {
    viewEl = container;
    activeFilter = 'all';
    drawDetail(projectId);
  }

  function drawDetail(projectId) {
    const state = window.ClaudeStudio.Store.getState();
    const proj = state.projects.find(p => p.id === projectId);

    if (!proj) {
      window.ClaudeStudio.Router.navigate('/projects');
      return;
    }

    const tasks = proj.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed);
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const isAllDone = totalTasks > 0 && completedTasks === totalTasks;

    const projectChats = state.conversations.filter(c => c.projectId === projectId);
    const projectFiles = state.files.filter(f => f.projectId === projectId);

    // Apply active filter
    let visibleTasks = tasks;
    if (activeFilter === 'pending') {
      visibleTasks = pendingTasks;
    } else if (activeFilter === 'completed') {
      visibleTasks = tasks.filter(t => t.completed);
    }

    viewEl.innerHTML = `
      <div class="project-detail-container">
        <div class="project-detail-header">
          <button class="btn btn-secondary btn-back-proj" id="btn-back-proj">
            ${window.ClaudeStudio.Icons.svg('chevron-left', 'btn-icon', 14)} Back to Projects
          </button>
          <div class="project-meta-hero">
            <div class="proj-icon-large" style="background:${proj.color}25; color:${proj.color}; border:1px solid ${proj.color}50;">
              ${window.ClaudeStudio.Icons.svg(proj.icon || 'layers', 'p-svg-lg', 24)}
            </div>
            <div>
              <h1 class="project-detail-title">${window.ClaudeStudio.Markdown.escapeHtml(proj.name)}</h1>
              <p class="project-detail-sub">${window.ClaudeStudio.Markdown.escapeHtml(proj.description)}</p>
            </div>
          </div>
        </div>

        <div class="project-detail-columns">
          <!-- Left Column: Tasks & Step Roadmap + Custom Instructions -->
          <div class="project-detail-col">
            <!-- Tasks Roadmap Box -->
            <div class="tasks-roadmap-box">
              <div class="tasks-roadmap-header">
                <div class="tasks-header-title-wrap">
                  ${window.ClaudeStudio.Icons.svg('check-square', 'btn-icon', 18)}
                  <h3>Tasks & Step Roadmap</h3>
                  <span class="task-completion-badge ${isAllDone ? 'complete' : ''}">
                    ${completedTasks}/${totalTasks} Done (${pct}%)
                  </span>
                </div>
                <div class="tasks-header-actions">
                  <button class="btn btn-secondary btn-sm" id="btn-ai-plan-tasks" title="Generate task steps with Claude">
                    ${window.ClaudeStudio.Icons.svg('sparkles', 'btn-icon', 13)}
                    <span>AI Auto-Plan</span>
                  </button>
                  <button class="btn btn-secondary btn-sm" id="btn-focus-add-step" title="Add a new step">
                    ${window.ClaudeStudio.Icons.svg('plus', 'btn-icon', 13)}
                    <span>Add Step</span>
                  </button>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="tasks-progress-wrap">
                <div class="tasks-progress-track">
                  <div class="tasks-progress-fill" style="width: ${pct}%; background: ${proj.color};"></div>
                </div>
              </div>

              <!-- Toolbar: Filters -->
              <div class="tasks-toolbar">
                <div class="tasks-filter-pills">
                  <button class="task-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
                    All (${totalTasks})
                  </button>
                  <button class="task-filter-btn ${activeFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                    To Do (${pendingTasks.length})
                  </button>
                  <button class="task-filter-btn ${activeFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                    Completed (${completedTasks})
                  </button>
                </div>
              </div>

              <!-- Add Step Bar -->
              <form class="task-add-bar" id="form-add-step">
                <input
                  type="text"
                  id="input-step-title"
                  class="task-add-input"
                  placeholder="Add a milestone step for ${window.ClaudeStudio.Markdown.escapeHtml(proj.name)}..."
                  autocomplete="off"
                />
                <select id="select-step-priority" class="task-priority-select" title="Priority">
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-step">
                  ${window.ClaudeStudio.Icons.svg('plus', 'btn-icon', 12)}
                  <span>Add</span>
                </button>
              </form>

              <!-- Task Items List -->
              <div class="tasks-items-list" id="tasks-items-list">
                ${visibleTasks.length === 0 ? `
                  <div class="empty-state-sm text-center" style="padding: 24px 12px; color: var(--text-muted);">
                    ${tasks.length === 0 ? `
                      <p>No task steps added yet.</p>
                      <button class="btn btn-secondary btn-sm mt-2" id="btn-empty-auto-plan">
                        ${window.ClaudeStudio.Icons.svg('sparkles', 'btn-icon', 13)}
                        <span>AI Auto-Plan 5 Steps</span>
                      </button>
                    ` : `
                      <p>No tasks match the "<strong>${activeFilter}</strong>" filter.</p>
                    `}
                  </div>
                ` : visibleTasks.map(t => `
                  <div class="task-item-card ${t.completed ? 'is-completed' : ''}" data-task-id="${t.id}">
                    <button class="task-checkbox-btn ${t.completed ? 'checked' : ''}" data-task-id="${t.id}" title="${t.completed ? 'Mark pending' : 'Mark complete'}">
                      ${window.ClaudeStudio.Icons.svg(t.completed ? 'check-circle' : 'square', 'task-check-icon', 18)}
                    </button>
                    <div class="task-content-col">
                      <span class="task-title ${t.completed ? 'completed' : ''}">${window.ClaudeStudio.Markdown.escapeHtml(t.title)}</span>
                      <span class="task-priority-tag task-priority-${t.priority}">${t.priority}</span>
                    </div>
                    <div class="task-actions-group">
                      <button class="btn-task-chat" data-task-id="${t.id}" title="Chat about this step with Claude">
                        ${window.ClaudeStudio.Icons.svg('message-square', 'btn-icon', 12)}
                        <span>Chat</span>
                      </button>
                      <button class="icon-btn-ghost btn-task-edit" data-task-id="${t.id}" title="Edit Step">
                        ${window.ClaudeStudio.Icons.svg('edit-2', 'icon-xs', 13)}
                      </button>
                      <button class="icon-btn-ghost btn-task-delete" data-task-id="${t.id}" title="Delete Step">
                        ${window.ClaudeStudio.Icons.svg('trash-2', 'icon-xs', 13)}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Custom Instructions Box -->
            <div class="detail-box">
              <div class="detail-box-header">
                <h3>Custom System Instructions</h3>
                <button class="btn-text" id="btn-save-instructions">Save</button>
              </div>
              <p class="text-sm-muted">Provide instructions for Claude when interacting within this project workspace.</p>
              <textarea id="proj-instructions-input" class="form-textarea mt-2" rows="5" placeholder="e.g. Always generate Go code with zero allocations and strict p99 latency...">${window.ClaudeStudio.Markdown.escapeHtml(proj.instructions || '')}</textarea>
            </div>
          </div>

          <!-- Right Column: Chats in this Project & Knowledge Files -->
          <div class="project-detail-col">
            <!-- Project Conversations Box -->
            <div class="detail-box">
              <div class="detail-box-header">
                <h3>Project Conversations (${projectChats.length})</h3>
                <button class="btn btn-primary btn-sm" id="btn-new-proj-chat">+ New Chat</button>
              </div>
              <div class="proj-chats-list">
                ${projectChats.length === 0 ? '<div class="empty-state-sm">No chats in this project yet. Start one!</div>' : ''}
                ${projectChats.map(c => `
                  <div class="proj-chat-card" data-id="${c.id}">
                    <div class="proj-chat-title">${window.ClaudeStudio.Markdown.escapeHtml(c.title)}</div>
                    <div class="proj-chat-meta">${c.messages.length} messages • Updated recently</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Attached Files Box -->
            <div class="detail-box mt-3">
              <div class="detail-box-header">
                <h3>Knowledge Files (${projectFiles.length})</h3>
                <button class="btn-text" id="btn-add-file-proj">+ Add File</button>
              </div>
              <div class="proj-files-list">
                ${projectFiles.length === 0 ? '<div class="empty-state-sm">No files linked to this project yet.</div>' : ''}
                ${projectFiles.map(f => `
                  <div class="file-item-pill">
                    ${window.ClaudeStudio.Icons.svg('file-text', 'file-icon', 14)}
                    <span class="file-name">${window.ClaudeStudio.Markdown.escapeHtml(f.name)}</span>
                    <span class="file-size">${f.size}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ------------------------------------------------------------------------
    // Event Handlers
    // ------------------------------------------------------------------------

    // Back button
    viewEl.querySelector('#btn-back-proj')?.addEventListener('click', () => {
      window.ClaudeStudio.Router.navigate('/projects');
    });

    // Save instructions
    viewEl.querySelector('#btn-save-instructions')?.addEventListener('click', () => {
      const val = viewEl.querySelector('#proj-instructions-input').value.trim();
      window.ClaudeStudio.Store.updateProject(projectId, { instructions: val });
      window.ClaudeStudio.Components.Toasts.success('Project system instructions saved!');
    });

    // New project chat
    viewEl.querySelector('#btn-new-proj-chat')?.addEventListener('click', () => {
      const chat = window.ClaudeStudio.Store.createChat(null, projectId);
      window.ClaudeStudio.Router.navigate(`/chat/${chat.id}`);
    });

    // Chat card navigation
    viewEl.querySelectorAll('.proj-chat-card').forEach(card => {
      card.addEventListener('click', () => {
        const cId = card.dataset.id;
        window.ClaudeStudio.Store.setActiveChat(cId);
        window.ClaudeStudio.Router.navigate(`/chat/${cId}`);
      });
    });

    // Add file
    viewEl.querySelector('#btn-add-file-proj')?.addEventListener('click', () => {
      const fname = prompt('Enter filename to create in project:');
      if (fname) {
        window.ClaudeStudio.Store.addFile({
          name: fname,
          size: '8.4 KB',
          projectId
        });
        window.ClaudeStudio.Components.Toasts.success(`File "${fname}" linked to project!`);
        drawDetail(projectId);
      }
    });

    // Focus Add Step input
    viewEl.querySelector('#btn-focus-add-step')?.addEventListener('click', () => {
      const input = viewEl.querySelector('#input-step-title');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Filter Buttons
    viewEl.querySelectorAll('.task-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;
        drawDetail(projectId);
      });
    });

    // Add Step Form Submit
    const addForm = viewEl.querySelector('#form-add-step');
    addForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = viewEl.querySelector('#input-step-title');
      const prioSelect = viewEl.querySelector('#select-step-priority');
      const title = titleInput ? titleInput.value.trim() : '';
      const priority = prioSelect ? prioSelect.value : 'medium';

      if (!title) {
        window.ClaudeStudio.Components.Toasts.warning('Please enter a step title.');
        return;
      }

      window.ClaudeStudio.Store.addProjectTask(projectId, { title, priority });
      window.ClaudeStudio.Components.Toasts.success(`Step added: "${title}"`);
      titleInput.value = '';
      drawDetail(projectId);
    });

    // AI Auto-Plan Steps
    const handleAutoPlan = () => {
      window.ClaudeStudio.Store.generateProjectTasks(projectId);
      window.ClaudeStudio.Components.Toasts.success(`Generated 5 milestone steps for "${proj.name}"!`);
      drawDetail(projectId);
    };

    viewEl.querySelector('#btn-ai-plan-tasks')?.addEventListener('click', handleAutoPlan);
    viewEl.querySelector('#btn-empty-auto-plan')?.addEventListener('click', handleAutoPlan);

    // Toggle Task Checkbox
    viewEl.querySelectorAll('.task-checkbox-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const updated = window.ClaudeStudio.Store.toggleProjectTask(projectId, taskId);
        if (updated) {
          if (updated.completed) {
            window.ClaudeStudio.Components.Toasts.success(`Completed: "${updated.title}"`);
          }
          drawDetail(projectId);
        }
      });
    });

    // Chat About This Step
    viewEl.querySelectorAll('.btn-task-chat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const task = (proj.tasks || []).find(t => t.id === taskId);
        if (!task) return;

        // Create a new chat linked to this project
        const chatTitle = `${task.title.slice(0, 32)}...`;
        const newChat = window.ClaudeStudio.Store.createChat(chatTitle, projectId);
        window.ClaudeStudio.Router.navigate(`/chat/${newChat.id}`);

        // Pre-fill prompt in Composer
        setTimeout(() => {
          const prompt = `Let's work on this task step for project "${proj.name}":\n\n**Task:** ${task.title}\n**Priority:** ${task.priority.toUpperCase()}\n\nPlease provide a step-by-step implementation plan, production code, and edge-case validation for this milestone.`;
          const textarea = document.getElementById('composer-textarea');
          if (textarea) {
            textarea.value = prompt;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.focus();
          }
        }, 150);
      });
    });

    // Edit Step
    viewEl.querySelectorAll('.btn-task-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const task = (proj.tasks || []).find(t => t.id === taskId);
        if (!task) return;

        const newTitle = prompt('Edit step title:', task.title);
        if (newTitle && newTitle.trim()) {
          window.ClaudeStudio.Store.updateProjectTask(projectId, taskId, { title: newTitle.trim() });
          window.ClaudeStudio.Components.Toasts.info('Step updated.');
          drawDetail(projectId);
        }
      });
    });

    // Delete Step
    viewEl.querySelectorAll('.btn-task-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        window.ClaudeStudio.Store.deleteProjectTask(projectId, taskId);
        window.ClaudeStudio.Components.Toasts.info('Step removed.');
        drawDetail(projectId);
      });
    });
  }

  function openProjectModal(existingProj = null) {
    const isEdit = !!existingProj;
    const content = `
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input type="text" id="modal-proj-name" class="form-input" value="${existingProj ? window.ClaudeStudio.Markdown.escapeHtml(existingProj.name) : ''}" placeholder="e.g. NeuralSearch RAG">
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Description</label>
        <input type="text" id="modal-proj-desc" class="form-input" value="${existingProj ? window.ClaudeStudio.Markdown.escapeHtml(existingProj.description) : ''}" placeholder="Brief overview of project goals...">
      </div>
      ${!isEdit ? `
        <div class="form-group mt-2">
          <label class="form-label">Initial Task / Step (Optional)</label>
          <input type="text" id="modal-proj-first-task" class="form-input" placeholder="e.g. Draft initial architecture and system requirements">
        </div>
      ` : ''}
      <div class="form-group mt-2">
        <label class="form-label">Accent Color</label>
        <div class="color-picker-row">
          ${['#d97757', '#8b7cf6', '#5fbf9a', '#e0a84a', '#e5636b', '#38bdf8', '#a855f7'].map(c => `
            <button class="color-pill-btn ${(existingProj?.color === c || (!existingProj && c === '#d97757')) ? 'active' : ''}" data-color="${c}" style="background:${c};"></button>
          `).join('')}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
      <button class="btn btn-primary modal-save-btn">${isEdit ? 'Save Changes' : 'Create Project'}</button>
    `;

    const modal = window.ClaudeStudio.Components.Modals.open({
      title: isEdit ? 'Edit Project Workspace' : 'Create New Project',
      contentHtml: content,
      footerHtml: footer,
      size: 'md'
    });

    let selectedColor = existingProj?.color || '#d97757';
    modal.querySelectorAll('.color-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.color-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
      });
    });

    modal.querySelector('.modal-cancel-btn').addEventListener('click', () => {
      window.ClaudeStudio.Components.Modals.close();
    });

    modal.querySelector('.modal-save-btn').addEventListener('click', () => {
      const name = modal.querySelector('#modal-proj-name').value.trim();
      const desc = modal.querySelector('#modal-proj-desc').value.trim();
      if (!name) {
        alert('Please enter a project name.');
        return;
      }

      if (isEdit) {
        window.ClaudeStudio.Store.updateProject(existingProj.id, { name, description: desc, color: selectedColor });
        window.ClaudeStudio.Components.Toasts.success('Project updated.');
      } else {
        const firstTask = modal.querySelector('#modal-proj-first-task')?.value.trim();
        const initialTasks = firstTask ? [{
          id: 'task-' + Date.now(),
          title: firstTask,
          priority: 'high',
          completed: false,
          createdAt: Date.now()
        }] : [];

        window.ClaudeStudio.Store.createProject({
          name,
          description: desc,
          color: selectedColor,
          tasks: initialTasks
        });
        window.ClaudeStudio.Components.Toasts.success('New project created!');
      }

      window.ClaudeStudio.Components.Modals.close();
      if (viewEl) renderList(viewEl);
    });
  }

  return {
    renderList,
    renderDetail
  };
})();
