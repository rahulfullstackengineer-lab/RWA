// =============================================
// App Bootstrap & Global Event Handling
// =============================================

// Saves a real file. Data-URL downloads are blocked by current browsers,
// and a blob link has to stay in the page until the download starts.
window.saveReportFile = function(filename, content, mime) {
  let text = content == null ? '' : String(content);
  if (text.indexOf('data:') === 0) {
    const comma = text.indexOf(',');
    const payload = text.slice(comma + 1);
    try { text = decodeURIComponent(payload); } catch (e) { text = payload; }
  }
  const blob = new Blob(['\uFEFF', text], { type: mime || 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'report.csv';
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2500);
};

(function() {
  const appContainer = document.getElementById('app');

  // Render current screen
  function renderScreen(screenId, params = {}) {
    const screenFn = Screens[screenId];
    if (typeof screenFn === 'function') {
      // Preserve sidebar scroll position so clicking an item does not jump back to top
      const prevNavEl = document.getElementById('appSidebarNav') || document.querySelector('#appSidebar [style*="overflow-y"]');
      const savedSidebarScroll = (prevNavEl && prevNavEl.scrollTop > 0) ? prevNavEl.scrollTop : (window._sidebarNavScroll || 0);

      appContainer.innerHTML = screenFn(params);

      // Restore sidebar scroll position instantly
      const newNavEl = document.getElementById('appSidebarNav') || document.querySelector('#appSidebar [style*="overflow-y"]');
      if (newNavEl && savedSidebarScroll > 0) {
        newNavEl.scrollTop = savedSidebarScroll;
        requestAnimationFrame(() => {
          if (newNavEl) newNavEl.scrollTop = savedSidebarScroll;
        });
      }

      // Scroll main content to top
      const contentEl = document.querySelector('.content');
      if (contentEl) contentEl.scrollTop = 0;
      window.scrollTo(0, 0);
    } else {
      console.warn(`Screen "${screenId}" not found in Screens registry.`);
      appContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;width:100vw;background:var(--bg-base);color:var(--text-primary);gap:16px;">
          <div style="font-size:48px;">🔍</div>
          <div style="font-size:22px;font-weight:700;">Screen "${screenId}" is being finalized</div>
          <div style="font-size:14px;color:var(--text-muted);max-width:400px;text-align:center;">
            This screen module is currently under development. You can jump back to the dashboard or select another screen.
          </div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            <button class="btn btn-primary" onclick="Router.go('admin-dashboard')">Go to Admin Dashboard</button>
            <button class="btn btn-secondary" onclick="Router.go('resident-dashboard')">Go to Resident Portal</button>
          </div>
        </div>
      `;
    }
  }

  // Subscribe to Router changes
  Router.onNavigate((screenId, params) => {
    // Synchronize URL hash
    if (window.location.hash.slice(1) !== screenId) {
      window.location.hash = screenId;
    }

    renderScreen(screenId, params);
    if (typeof window.mountLiveBroadcast === 'function') window.mountLiveBroadcast();
    if (typeof window.checkUnreadNotificationsBadge === 'function') {
      window.checkUnreadNotificationsBadge();
    }
  });

  // Listen to browser hash navigation (Back/Forward buttons)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && hash !== Router.current()) {
      Router.go(hash);
    }
  });

  // ------------------------------------------------------------
  // Notification Sound Engine (universfield-new-notification-040-493469.mp3)
  // ------------------------------------------------------------
  let notifAudio = null;
  function getNotificationAudio() {
    if (!notifAudio) {
      notifAudio = new Audio('/notification.mp3');
      notifAudio.preload = 'auto';
      notifAudio.volume = 0.85;
    }
    return notifAudio;
  }

  window.playNotificationSound = function() {
    try {
      const audio = getNotificationAudio();
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Autoplay policy deferred until first user interaction
          console.debug('Notification audio playback deferred by browser policy:', err);
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  // Pre-unlock audio context on user interaction
  const unlockAudio = () => {
    try {
      const audio = getNotificationAudio();
      audio.load();
    } catch (e) {}
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  };
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  // Global Toast Notification Helper
  window.showToast = function(message, type = 'success', playSound = true) {
    if (playSound && typeof window.playNotificationSound === 'function') {
      window.playNotificationSound();
    }

    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    } else if (container.parentElement !== document.body) {
      document.body.appendChild(container);
    }
    container.className = 'toast-stack';

    const kind = type === 'success' || type === 'error' || type === 'warning' ? type : 'info';
    const label = kind === 'success' ? 'Done' : kind === 'error' ? 'Error' : kind === 'warning' ? 'Check' : 'Note';
    const text = String(message == null ? '' : message)
      .replace(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D\s]+)+/u, '')
      .trim() || String(message == null ? '' : message);

    const toast = document.createElement('div');
    toast.className = 'app-toast app-toast-' + kind;
    toast.innerHTML = `<span class="app-toast-label">${label}</span><span class="app-toast-text"></span>`;
    toast.querySelector('.app-toast-text').textContent = text;
    container.prepend(toast);

    if (typeof window.pinLiveBroadcast === 'function' && !/^(processing|executing|loading|saving|connecting)\b/i.test(text)) {
      window.pinLiveBroadcast({ text: text, kind: kind });
    }

    setTimeout(() => {
      toast.classList.add('app-toast-out');
      setTimeout(() => toast.remove(), 220);
    }, 3400);
  };

  window.pinLiveBroadcast = function(item) {
    const text = String((item && item.text) || '').trim();
    if (!text) return;
    const id = String((item && item.id) || ('live:' + text));
    let dismissed = '';
    try { dismissed = sessionStorage.getItem('rwa_live_dismissed') || ''; } catch (e) {}
    if (dismissed === id) return;
    let hold = 0;
    try { hold = Number(sessionStorage.getItem('rwa_live_hold') || 0); } catch (e) {}
    const createdAt = item && item.createdAt ? new Date(item.createdAt).getTime() : 0;
    if (item && item.fromInbox && hold && createdAt && createdAt <= hold) return;
    if (item && item.fromInbox && window.__liveBroadcast && !window.__liveBroadcast.fromInbox) return;
    window.__liveBroadcast = { id: id, text: text, kind: (item && item.kind) || 'info', fromInbox: !!(item && item.fromInbox) };
    window.mountLiveBroadcast();
  };

  window.mountLiveBroadcast = function() {
    const item = window.__liveBroadcast;
    const content = document.querySelector('.content');
    const existing = document.getElementById('liveBroadcastBar');
    if (!item) {
      if (existing) existing.remove();
      return;
    }
    if (!content) return;
    let bar = existing;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'liveBroadcastBar';
      bar.className = 'live-broadcast';
      bar.innerHTML = '<span class="live-broadcast-tag">Live</span><span class="live-broadcast-text"></span><button type="button" class="live-broadcast-open">Open</button><button type="button" class="live-broadcast-close" aria-label="Dismiss">✕</button>';
      content.insertBefore(bar, content.firstChild);
      bar.querySelector('.live-broadcast-close').onclick = function() {
        try {
          sessionStorage.setItem('rwa_live_dismissed', window.__liveBroadcast && window.__liveBroadcast.id);
          sessionStorage.setItem('rwa_live_hold', String(Date.now()));
        } catch (e) {}
        window.__liveBroadcast = null;
        bar.remove();
      };
      bar.querySelector('.live-broadcast-open').onclick = function() {
        let role = '';
        try { role = JSON.parse(localStorage.getItem('rwa_user') || '{}').role || ''; } catch (e) {}
        const screen = role === 'RESIDENT' ? 'resident-notifications' : (role === 'STAFF' ? 'staff-dashboard' : 'admin-notifications');
        if (typeof Router !== 'undefined') Router.go(screen);
      };
    } else if (bar.parentElement !== content) {
      content.insertBefore(bar, content.firstChild);
    }
    bar.className = 'live-broadcast live-broadcast-' + (item.kind || 'info');
    bar.querySelector('.live-broadcast-text').textContent = item.text;
  };

  // Global Modal Helper for legacy callers
  window.Modal = window.Modal || {
    show: function(opts) {
      window.Modal.open(opts);
    },
    open: function(opts) {
      opts = opts || {};
      let overlay = document.getElementById('rwaGlobalModal');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'rwaGlobalModal';
        document.body.appendChild(overlay);
      }
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(24,24,27,0.45);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
      const width = opts.maxWidth || '560px';
      overlay.innerHTML = ''
        + '<div style="background:#fff;border-radius:2px;max-width:' + width + ';width:100%;max-height:92vh;overflow-y:auto;border:1px solid #E4E4E7;">'
        + '<div class="rwa-modal-chrome" style="padding:16px 18px;border-bottom:1px solid #E4E4E7;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#fff;">'
        + '<div style="font-size:16px;font-weight:700;color:#18181B;">' + (opts.title || '') + '</div>'
        + '<button type="button" aria-label="Close" onclick="document.getElementById(\'rwaGlobalModal\').style.display=\'none\'" style="background:#F4F4F5;border:1px solid #E4E4E7;color:#18181B;width:28px;height:28px;border-radius:2px;cursor:pointer;">✕</button>'
        + '</div>'
        + '<div style="padding:16px 18px;">' + (opts.body || '') + '</div>'
        + '</div>';
      overlay.style.display = 'flex';
      overlay.onclick = function(e) {
        if (e.target === overlay) overlay.style.display = 'none';
      };
    },
    close: function() {
      const m = document.getElementById('rwaGlobalModal');
      if (m) m.style.display = 'none';
      const em = document.getElementById('rwaResidentEmergencyModal');
      if (em) em.style.display = 'none';
    }
  };

  // Keyboard escape handler for overlays
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window._currentOverlay) {
      closeOverlay();
    }
  });

  // Initial startup
  document.body.classList.remove('mobile-frame-view');
  localStorage.removeItem('rwa_preview_mode');

  const initialHash = window.location.hash.slice(1);
  let user = null;
  try {
    const userStr = localStorage.getItem('rwa_user');
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {}

  let startScreen = 'auth-login';

  const isPublicScreen = (s) =>
    s.startsWith('auth-') ||
    s.startsWith('onboarding-') ||
    s.startsWith('resident-login') ||
    s.startsWith('resident-onboard') ||
    s.startsWith('staff-login');

  if (initialHash && Screens[initialHash] && !['landing', 'product', 'solutions', 'pricing', 'company'].includes(initialHash)) {
    startScreen = initialHash;
  } else {
    // Root "/" entry point: directly open auth-login screen
    startScreen = 'auth-login';
  }

  Router.go(startScreen);
})();
