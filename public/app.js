// =============================================
// App Bootstrap & Global Event Handling
// =============================================

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
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const color = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--blue)';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    toast.style.cssText = `
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-left: 4px solid ${color};
      border-radius: var(--r-md);
      padding: 12px 18px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideUp 0.2s ease;
      pointer-events: auto;
      min-width: 260px;
    `;
    toast.innerHTML = `<span style="color:${color};font-weight:800;font-size:15px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  // Global Modal Helper for legacy callers
  window.Modal = window.Modal || {
    show: function(opts) {
      if (typeof window.showModal === 'function') {
        window.showModal(opts.title || 'Notification', opts.body || '', null, null, opts.maxWidth || '560px');
      }
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
    s.startsWith('resident-onboard');

  if (initialHash && Screens[initialHash] && !['landing', 'product', 'solutions', 'pricing', 'company'].includes(initialHash)) {
    startScreen = initialHash;
  } else {
    // Root "/" entry point: directly open auth-login screen
    startScreen = 'auth-login';
  }

  Router.go(startScreen);
})();
