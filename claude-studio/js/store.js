// ==========================================================================
// Claude Studio - Central Reactive Store (Pub/Sub + LocalStorage Sync)
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

window.ClaudeStudio.Store = (function () {
  const STORAGE_KEY = 'claude_studio_state_v1';
  const listeners = new Set();

  const defaultSettings = {
    theme: 'dark', // 'dark' | 'light'
    accent: 'terracotta', // 'terracotta' | 'violet' | 'mint' | 'amber'
    fontSize: '14px',
    density: 'comfortable',
    defaultModel: 'claude-3-7-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    notifications: true,
    userProfile: {
      name: 'Alex Vance',
      role: 'Staff AI Engineer',
      email: 'alex.vance@studio.ai',
      avatar: ''
    }
  };

  // Initial State Hydration
  let state = loadInitialState();

  function loadInitialState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const projects = (parsed.projects || window.ClaudeStudio.MockData.projects).map(p => {
          const mockMatch = window.ClaudeStudio.MockData?.projects?.find(m => m.id === p.id);
          return {
            ...p,
            tasks: (p.tasks && p.tasks.length > 0) ? p.tasks : (mockMatch?.tasks ? [...mockMatch.tasks] : (p.tasks || []))
          };
        });
        return {
          conversations: parsed.conversations || window.ClaudeStudio.MockData.conversations,
          projects: projects,
          prompts: parsed.prompts || window.ClaudeStudio.MockData.prompts,
          files: parsed.files || window.ClaudeStudio.MockData.files,
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          activeChatId: parsed.activeChatId || 'chat-1',
          activeProjectId: null,
          activeArtifact: null,
          isGenerating: false,
          isSidebarCollapsed: false,
          isArtifactsOpen: false,
          searchQuery: '',
          selectedModel: parsed.settings?.defaultModel || 'claude-3-7-sonnet'
        };
      }
    } catch (e) {
      console.warn('Failed to load saved state, falling back to mock data:', e);
    }

    return {
      conversations: [...window.ClaudeStudio.MockData.conversations],
      projects: [...window.ClaudeStudio.MockData.projects],
      prompts: [...window.ClaudeStudio.MockData.prompts],
      files: [...window.ClaudeStudio.MockData.files],
      settings: { ...defaultSettings },
      activeChatId: 'chat-1',
      activeProjectId: null,
      activeArtifact: null,
      isGenerating: false,
      isSidebarCollapsed: false,
      isArtifactsOpen: false,
      searchQuery: '',
      selectedModel: 'claude-3-7-sonnet'
    };
  }

  function persist() {
    try {
      const toSave = {
        conversations: state.conversations,
        projects: state.projects,
        prompts: state.prompts,
        files: state.files,
        settings: state.settings,
        activeChatId: state.activeChatId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  function notify(event = 'state:change', payload = null) {
    persist();
    for (const listener of listeners) {
      try {
        listener(state, event, payload);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // ------------------------------------------------------------------------
    // Chat Actions
    // ------------------------------------------------------------------------
    setActiveChat(id) {
      state.activeChatId = id;
      notify('chat:selected', id);
    },

    createChat(initialPrompt = null, projectId = null) {
      const newId = 'chat-' + Date.now();
      const newChat = {
        id: newId,
        title: initialPrompt ? (initialPrompt.length > 36 ? initialPrompt.slice(0, 36) + '...' : initialPrompt) : 'New Conversation',
        projectId: projectId || null,
        isPinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };

      if (initialPrompt) {
        newChat.messages.push({
          id: 'm-' + Date.now(),
          role: 'user',
          timestamp: Date.now(),
          content: initialPrompt
        });
      }

      state.conversations.unshift(newChat);
      state.activeChatId = newId;
      notify('chat:created', newChat);
      return newChat;
    },

    renameChat(id, title) {
      const chat = state.conversations.find(c => c.id === id);
      if (chat) {
        chat.title = title.trim();
        chat.updatedAt = Date.now();
        notify('chat:renamed', chat);
      }
    },

    pinChat(id) {
      const chat = state.conversations.find(c => c.id === id);
      if (chat) {
        chat.isPinned = !chat.isPinned;
        notify('chat:pinned', chat);
      }
    },

    deleteChat(id) {
      state.conversations = state.conversations.filter(c => c.id !== id);
      if (state.activeChatId === id) {
        state.activeChatId = state.conversations[0]?.id || null;
      }
      notify('chat:deleted', id);
    },

    addMessage(chatId, message) {
      const chat = state.conversations.find(c => c.id === chatId);
      if (!chat) return null;

      const msgObj = {
        id: message.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        role: message.role || 'user',
        timestamp: Date.now(),
        content: message.content || '',
        hasArtifact: !!message.hasArtifact,
        artifact: message.artifact || null,
        rating: null // 'up' | 'down' | null
      };

      chat.messages.push(msgObj);
      chat.updatedAt = Date.now();

      // If this was the first user message, generate title
      if (chat.messages.length === 1 && message.role === 'user') {
        chat.title = message.content.length > 38 ? message.content.substring(0, 38) + '...' : message.content;
      }

      notify('message:added', { chatId, message: msgObj });
      return msgObj;
    },

    updateMessage(chatId, messageId, content) {
      const chat = state.conversations.find(c => c.id === chatId);
      if (!chat) return;
      const msg = chat.messages.find(m => m.id === messageId);
      if (msg) {
        msg.content = content;
        chat.updatedAt = Date.now();
        notify('message:updated', { chatId, messageId, content });
      }
    },

    rateMessage(chatId, messageId, rating) {
      const chat = state.conversations.find(c => c.id === chatId);
      if (!chat) return;
      const msg = chat.messages.find(m => m.id === messageId);
      if (msg) {
        msg.rating = rating;
        notify('message:rated', { chatId, messageId, rating });
      }
    },

    deleteMessage(chatId, messageId) {
      const chat = state.conversations.find(c => c.id === chatId);
      if (!chat) return;
      chat.messages = chat.messages.filter(m => m.id !== messageId);
      notify('message:deleted', { chatId, messageId });
    },

    setGenerating(bool) {
      state.isGenerating = bool;
      notify('generating:change', bool);
    },

    // ------------------------------------------------------------------------
    // Artifacts Split-Pane Actions
    // ------------------------------------------------------------------------
    openArtifact(artifact) {
      state.activeArtifact = {
        title: artifact.title || 'Generated Artifact',
        type: artifact.type || 'html',
        language: artifact.language || 'html',
        content: artifact.content || '',
        activeTab: 'preview', // 'preview' | 'code'
        version: 1,
        versions: [{ v: 1, ts: Date.now(), content: artifact.content }],
        isFullscreen: false
      };
      state.isArtifactsOpen = true;
      notify('artifact:opened', state.activeArtifact);
    },

    closeArtifact() {
      state.isArtifactsOpen = false;
      notify('artifact:closed');
    },

    setArtifactTab(tab) {
      if (state.activeArtifact) {
        state.activeArtifact.activeTab = tab;
        notify('artifact:tab_changed', tab);
      }
    },

    toggleArtifactFullscreen() {
      if (state.activeArtifact) {
        state.activeArtifact.isFullscreen = !state.activeArtifact.isFullscreen;
        notify('artifact:fullscreen', state.activeArtifact.isFullscreen);
      }
    },

    // ------------------------------------------------------------------------
    // Project Actions
    // ------------------------------------------------------------------------
    createProject(data) {
      const newProj = {
        id: 'proj-' + Date.now(),
        name: data.name.trim(),
        description: data.description.trim(),
        color: data.color || '#d97757',
        icon: data.icon || 'layers',
        instructions: data.instructions || '',
        chatsCount: 0,
        filesCount: 0,
        tasks: data.tasks || [],
        updatedAt: Date.now(),
        isPinned: false
      };
      state.projects.unshift(newProj);
      notify('project:created', newProj);
      return newProj;
    },

    updateProject(id, data) {
      const proj = state.projects.find(p => p.id === id);
      if (proj) {
        Object.assign(proj, data, { updatedAt: Date.now() });
        notify('project:updated', proj);
      }
    },

    deleteProject(id) {
      state.projects = state.projects.filter(p => p.id !== id);
      // Unlink chats
      state.conversations.forEach(c => {
        if (c.projectId === id) c.projectId = null;
      });
      notify('project:deleted', id);
    },

    // Project Task & Step Actions
    addProjectTask(projectId, taskData) {
      const proj = state.projects.find(p => p.id === projectId);
      if (!proj) return null;
      proj.tasks = proj.tasks || [];
      const title = typeof taskData === 'string' ? taskData.trim() : (taskData.title || '').trim();
      if (!title) return null;
      const task = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        priority: (taskData && taskData.priority) || 'medium',
        completed: false,
        createdAt: Date.now()
      };
      proj.tasks.push(task);
      proj.updatedAt = Date.now();
      notify('project:updated', proj);
      return task;
    },

    toggleProjectTask(projectId, taskId) {
      const proj = state.projects.find(p => p.id === projectId);
      if (!proj || !proj.tasks) return null;
      const task = proj.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : null;
        proj.updatedAt = Date.now();
        notify('project:updated', proj);
        return task;
      }
      return null;
    },

    updateProjectTask(projectId, taskId, updates) {
      const proj = state.projects.find(p => p.id === projectId);
      if (!proj || !proj.tasks) return null;
      const task = proj.tasks.find(t => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        proj.updatedAt = Date.now();
        notify('project:updated', proj);
        return task;
      }
      return null;
    },

    deleteProjectTask(projectId, taskId) {
      const proj = state.projects.find(p => p.id === projectId);
      if (!proj || !proj.tasks) return;
      proj.tasks = proj.tasks.filter(t => t.id !== taskId);
      proj.updatedAt = Date.now();
      notify('project:updated', proj);
    },

    generateProjectTasks(projectId) {
      const proj = state.projects.find(p => p.id === projectId);
      if (!proj) return [];
      proj.tasks = proj.tasks || [];
      const generated = [
        { title: `Define architectural requirements & specifications for ${proj.name}`, priority: 'high', completed: false },
        { title: `Implement core business logic & interface abstractions`, priority: 'high', completed: false },
        { title: `Write integration tests and automated edge-case validation`, priority: 'medium', completed: false },
        { title: `Setup observability telemetry, latency metrics & logging`, priority: 'medium', completed: false },
        { title: `Benchmark performance under peak throughput and stress conditions`, priority: 'low', completed: false }
      ];
      generated.forEach(g => {
        proj.tasks.push({
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          ...g,
          createdAt: Date.now()
        });
      });
      proj.updatedAt = Date.now();
      notify('project:updated', proj);
      return proj.tasks;
    },

    // ------------------------------------------------------------------------
    // Prompt Actions
    // ------------------------------------------------------------------------
    createPrompt(data) {
      const newPrompt = {
        id: 'prompt-' + Date.now(),
        title: data.title.trim(),
        category: data.category || 'General',
        description: data.description || '',
        template: data.template || '',
        variables: data.variables || [],
        isFavorite: false,
        usageCount: 0
      };
      state.prompts.unshift(newPrompt);
      notify('prompt:created', newPrompt);
      return newPrompt;
    },

    updatePrompt(id, data) {
      const prompt = state.prompts.find(p => p.id === id);
      if (prompt) {
        Object.assign(prompt, data);
        notify('prompt:updated', prompt);
      }
    },

    toggleFavoritePrompt(id) {
      const prompt = state.prompts.find(p => p.id === id);
      if (prompt) {
        prompt.isFavorite = !prompt.isFavorite;
        notify('prompt:favorite', prompt);
      }
    },

    deletePrompt(id) {
      state.prompts = state.prompts.filter(p => p.id !== id);
      notify('prompt:deleted', id);
    },

    incrementPromptUsage(id) {
      const prompt = state.prompts.find(p => p.id === id);
      if (prompt) {
        prompt.usageCount = (prompt.usageCount || 0) + 1;
        notify('prompt:used', prompt);
      }
    },

    // ------------------------------------------------------------------------
    // File Actions
    // ------------------------------------------------------------------------
    addFile(fileData) {
      const newFile = {
        id: 'file-' + Date.now(),
        name: fileData.name,
        size: fileData.size || '12 KB',
        sizeBytes: fileData.sizeBytes || 12000,
        type: fileData.type || 'text',
        projectId: fileData.projectId || null,
        uploadedAt: Date.now(),
        content: fileData.content || ''
      };
      state.files.unshift(newFile);
      notify('file:added', newFile);
      return newFile;
    },

    deleteFile(id) {
      state.files = state.files.filter(f => f.id !== id);
      notify('file:deleted', id);
    },

    // ------------------------------------------------------------------------
    // Settings & Global UI
    // ------------------------------------------------------------------------
    updateSettings(partial) {
      state.settings = { ...state.settings, ...partial };
      notify('settings:updated', state.settings);
    },

    setSelectedModel(model) {
      state.selectedModel = model;
      notify('model:changed', model);
    },

    toggleSidebar() {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
      notify('sidebar:toggle', state.isSidebarCollapsed);
    },

    clearAllData() {
      localStorage.removeItem(STORAGE_KEY);
      state = loadInitialState();
      notify('data:cleared');
    }
  };
})();
