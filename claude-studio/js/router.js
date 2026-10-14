// ==========================================================================
// Claude Studio - Client-Side Hash Router
// Supports: #/chat/:id, #/projects, #/projects/:id, #/prompts, #/library, #/settings
// ==========================================================================

window.ClaudeStudio = window.ClaudeStudio || {};

window.ClaudeStudio.Router = (function () {
  const routes = [];
  let current = null;
  const subscribers = new Set();

  function parseHash() {
    let hash = window.location.hash.slice(1);
    if (!hash || hash === '/') {
      hash = '/chat';
    }
    return hash;
  }

  function matchRoute(path) {
    for (const r of routes) {
      const match = path.match(r.regex);
      if (match) {
        const params = {};
        r.paramNames.forEach((name, idx) => {
          params[name] = match[idx + 1];
        });
        return { name: r.name, path, params, handler: r.handler };
      }
    }
    return { name: '404', path, params: {}, handler: null };
  }

  function handleRoute() {
    const path = parseHash();
    const matched = matchRoute(path);
    current = matched;

    for (const sub of subscribers) {
      try {
        sub(matched);
      } catch (err) {
        console.error('Router subscriber error:', err);
      }
    }

    if (matched.handler) {
      matched.handler(matched.params);
    }
  }

  return {
    add(pattern, name, handler) {
      const paramNames = [];
      const regexStr = '^' + pattern
        .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
          paramNames.push(name);
          return '([a-zA-Z0-9_-]+)';
        })
        .replace(/\//g, '\\/') + '$';

      routes.push({
        pattern,
        name,
        paramNames,
        regex: new RegExp(regexStr),
        handler
      });
    },

    navigate(path) {
      window.location.hash = path.startsWith('/') ? path : '/' + path;
    },

    getCurrent() {
      return current;
    },

    subscribe(callback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    init() {
      window.addEventListener('hashchange', handleRoute);
      handleRoute();
    }
  };
})();
