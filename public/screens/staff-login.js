// ============================================================
// SOCIETY STAFF & SECURITY GUARD AUTH LOGIN SCREEN
// ============================================================

window.Screens = window.Screens || {};

// Slide Content for Staff & Security Cinematic Pitch
window.STAFF_PITCH_SLIDES = [
  {
    line1: 'Gate Barrier Operations.',
    line2: 'Fast Pass & PIN Verification.',
    sub: 'Verified gate access system for security guards and society staff. Manage shift duty posts, visitor verification, and transparent salary payout dates.'
  },
  {
    line1: 'Live Shift Rostering.',
    line2: 'Automated Post Handover.',
    sub: 'Track morning, evening, and night post shifts with automated handover logs, patrolling checklists, and instant supervisor reporting.'
  },
  {
    line1: 'Instant Resident Alert.',
    line2: '5-Second Gate Clearance.',
    sub: 'Direct intercom push notifications, OTP visitor confirmation, vehicle OCR scanning, and 1-tap emergency SOS broadcast across all gates.'
  }
];

Screens['staff-login'] = function() {
  const lastPhone = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_login_phone')) || '9876543210';

  return `
    <div class="cutora-auth-screen staff-mode fade-in" id="cutoraStaffContainer">
      <!-- Motion: 4s seamless upward glide loop -->
      <video
        id="staffHeroVideo"
        class="cutora-video-layer"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
      >
        <source src="/cutora-motion.mp4" type="video/mp4" />
        <source src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/197f7e27-faac-4bdc-916c-615ac962bf86.mp4" type="video/mp4" />
      </video>

      <!-- Readability: Left wash with deep security navy & emerald guard shield tone -->
      <div class="cutora-overlay" style="background:linear-gradient(90deg, rgba(6, 78, 59, 0.78) 0%, rgba(15, 23, 42, 0.72) calc(200 * var(--u)), transparent calc(500 * var(--u))), linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.3) calc(140 * var(--u)), transparent calc(300 * var(--u))), linear-gradient(0deg, rgba(6, 78, 59, 0.5) 0%, transparent calc(420 * var(--u)));"></div>

      <!-- Hero Column (Left, White Typography) -->
      <div class="cutora-hero-col">
        <!-- Top Bar -->
        <div class="cutora-topbar">
          <div class="cutora-brand" onclick="Router.go('staff-login')" style="cursor:pointer;">
            <div class="cutora-brand-tile" style="background:#064E3B;border:1px solid #34D399;box-shadow:0 0 16px rgba(52,211,153,0.35);">
              <span class="cutora-brand-glyph">👮</span>
            </div>
            <span class="cutora-brand-text">Cutora · Staff &amp; Security</span>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <a class="cutora-top-link" onclick="Router.go('auth-login')" title="Open RWA Admin Portal" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              <span>← RWA Admin</span>
            </a>
            <a class="cutora-top-link" onclick="Router.go('resident-login')" title="Open Resident Portal" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              <span>🏠 Resident Portal</span>
            </a>
          </div>
        </div>

        <!-- Pitch (Bottom-Left) -->
        <div class="cutora-pitch">
          <div class="cutora-headline-clip">
            <span id="staffHeroHeadline1" class="cutora-headline-line line-1" style="color:#F0FDF4;">
              ${window.STAFF_PITCH_SLIDES[0].line1}
            </span>
          </div>
          <div class="cutora-headline-clip">
            <span id="staffHeroHeadline2" class="cutora-headline-line line-2" style="color:#34D399;">
              ${window.STAFF_PITCH_SLIDES[0].line2}
            </span>
          </div>

          <p id="staffHeroSubline" class="cutora-subline" style="color:#D1FAE5;">
            ${window.STAFF_PITCH_SLIDES[0].sub}
          </p>

          <!-- Slider Dots (Emerald active pill + dots) -->
          <div class="cutora-slider-row" id="staffSliderDots">
            <button class="cutora-dot active" data-slide="0" onclick="window.selectStaffSlide(0)" title="Gate Passes" aria-label="Slide 1"></button>
            <button class="cutora-dot" data-slide="1" onclick="window.selectStaffSlide(1)" title="Shift Duty" aria-label="Slide 2"></button>
            <button class="cutora-dot" data-slide="2" onclick="window.selectStaffSlide(2)" title="Intercom & SOS" aria-label="Slide 3"></button>
          </div>

          <!-- Trust & Scale Metrics -->
          <div class="cutora-metrics">
            <div>
              <div class="cutora-metric-val">11<span>+</span></div>
              <div class="cutora-metric-label">Active Society Staff</div>
            </div>
            <div>
              <div class="cutora-metric-val">3</div>
              <div class="cutora-metric-label">24/7 Gate Posts</div>
            </div>
            <div>
              <div class="cutora-metric-val">&lt;5<span>s</span></div>
              <div class="cutora-metric-label">Fast Gate Clearance</div>
            </div>
            <div>
              <div class="cutora-metric-val">100<span>%</span></div>
              <div class="cutora-metric-label">On-Time Payroll</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Card Panel -->
      <div class="cutora-card-panel">
        <div class="cutora-form-wrap">
          <!-- Card Heading & Subline -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <div style="width:42px;height:42px;border-radius:12px;background:#ECFDF5;border:1px solid #A7F3D0;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 12px rgba(16,185,129,0.15);">
              👮
            </div>
            <div>
              <h1 class="cutora-card-heading" style="margin:0;font-size:calc(26 * var(--u));">Welcome on Duty!</h1>
              <p class="cutora-card-subline" style="margin:2px 0 0;">Sign in to manage gate barrier duty, visitor entry passes, and payroll.</p>
            </div>
          </div>

          <!-- Top Role Portal Switcher (3 Tabs) -->
          <div class="cutora-tab-group" style="margin:calc(12 * var(--u)) 0 calc(14 * var(--u));">
            <button class="cutora-tab-btn" onclick="Router.go('auth-login')" title="Switch to RWA Admin Portal">
              <span>🏢</span>
              <span>RWA Admin</span>
            </button>
            <button class="cutora-tab-btn" onclick="Router.go('resident-login')" title="Switch to Resident Portal">
              <span>🏠</span>
              <span>Resident</span>
            </button>
            <button class="cutora-tab-btn active" style="cursor:default;background:#064E3B;color:#34D399;border:1px solid #059669;font-weight:800;box-shadow:0 4px 14px rgba(6,78,59,0.25);">
              <span>👮</span>
              <span>Staff &amp; Guards</span>
            </button>
          </div>

          <!-- Quick 1-Click Demo Staff Login Bar -->
          <div style="margin-bottom:calc(14 * var(--u));background:#F8FAFC;border:1px solid #E2E8F0;border-radius:calc(12 * var(--u));padding:calc(10 * var(--u)) calc(12 * var(--u));">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:calc(8 * var(--u));">
              <span style="font-size:11.5px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">⚡ 1-Click Demo Staff Login:</span>
              <span style="font-size:11px;font-weight:700;color:#059669;background:#ECFDF5;padding:2px 8px;border-radius:6px;">PIN: 1234</span>
            </div>
            <div style="display:flex;gap:calc(6 * var(--u));flex-wrap:wrap;">
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543210', 'Ram Singh (Gate 1 Guard)')"
                style="flex:1;min-width:130px;background:#FFFFFF;border:1.5px solid #BBF7D0;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(8 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#166534;display:flex;align-items:center;justify-content:center;gap:calc(5 * var(--u));cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(16,185,129,0.08);"
                title="Log in as Ram Singh (Senior Head Guard Gate 1)"
              >
                <span>🛡️</span>
                <span>Ram Singh (Gate 1)</span>
              </button>
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543211', 'Dharmendra Kumar (Gate 2 Guard)')"
                style="flex:1;min-width:130px;background:#FFFFFF;border:1.5px solid #CBD5E1;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(8 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#334155;display:flex;align-items:center;justify-content:center;gap:calc(5 * var(--u));cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(0,0,0,0.04);"
                title="Log in as Dharmendra Kumar (Gate 2 Guard)"
              >
                <span>🚪</span>
                <span>Dharmendra (Gate 2)</span>
              </button>
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543215', 'Ramesh Paswan (Supervisor)')"
                style="flex:1;min-width:130px;background:#FFFFFF;border:1.5px solid #BFDBFE;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(8 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#1E40AF;display:flex;align-items:center;justify-content:center;gap:calc(5 * var(--u));cursor:pointer;transition:all 0.15s ease;box-shadow:0 2px 6px rgba(37,99,235,0.08);"
                title="Log in as Ramesh Paswan (Campus Supervisor)"
              >
                <span>👔</span>
                <span>Ramesh (Supervisor)</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Real-Time Staff Detection Status Pill -->
          <div id="staffLoginStatusPill" style="display:none;margin-bottom:calc(12 * var(--u));"></div>

          <!-- Mobile Number Field -->
          <div class="cutora-field-group">
            <label class="cutora-label" for="staffPhoneInput">Staff / Guard Mobile Number</label>
            <div class="cutora-input-box">
              <div class="cutora-country-code" style="color:#059669;font-weight:700;">🇮🇳 +91</div>
              <input
                id="staffPhoneInput"
                class="cutora-input"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value="${lastPhone}"
                maxlength="10"
                autocomplete="tel"
                oninput="window.handleStaffPhoneInputCheck(this)"
                onkeydown="if(event.key === 'Enter') { const p = document.getElementById('staffPinInput'); if(p) p.focus(); }"
              />
            </div>
          </div>

          <!-- Dynamic Form Body (Switches between Login and First-Time PIN Setup) -->
          <div id="staffCutoraFormBody">
            <!-- 4-to-6 Digit Security PIN Field -->
            <div class="cutora-field-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
                <label class="cutora-label" for="staffPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
                <a class="cutora-forgot-link" onclick="window.handleStaffResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;color:#059669;font-weight:700;">Set / Reset PIN</a>
              </div>
              <div class="cutora-input-box">
                <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
                <input
                  id="staffPinInput"
                  class="cutora-input"
                  type="password"
                  maxlength="6"
                  placeholder="Enter your 4 or 6-digit PIN"
                  value="1234"
                  autocomplete="current-password"
                  onkeydown="if(event.key === 'Enter') window.handleStaffPinLoginSubmit()"
                />
                <button
                  type="button"
                  class="cutora-eye-btn"
                  onclick="window.togglePinVisibility('staffPinInput', 'cutoraStaffPinEyeSlash')"
                  title="Toggle PIN visibility"
                  aria-label="Toggle PIN visibility"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line id="cutoraStaffPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Options Row: Remember Me Checkbox -->
            <div class="cutora-options-row">
              <label class="cutora-checkbox-label">
                <input
                  type="checkbox"
                  id="staffRememberMeCheckbox"
                  class="cutora-checkbox-input"
                  checked
                  onchange="window.handleRememberMe(this)"
                />
                <span class="cutora-custom-checkbox" style="background:#059669;border-color:#059669;">
                  <span class="cutora-checkbox-tick" style="display:block;">✓</span>
                </span>
                <span>Remember Guard ID on this device</span>
              </label>
            </div>

            <!-- Primary Sign In Button: Emerald Gradient -->
            <button
              type="button"
              id="staffLoginSubmitBtn"
              class="cutora-login-btn"
              style="background:linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%);color:#FFFFFF;border:none;box-shadow:0 calc(8 * var(--u)) calc(24 * var(--u)) rgba(5, 150, 105, 0.35);cursor:pointer;font-weight:800;"
              onclick="window.handleStaffPinLoginSubmit()"
            >
              <span>👮 Sign In to Gate Operations &amp; Roster →</span>
            </button>
          </div>

          <!-- Bottom Footer Note -->
          <div style="margin-top:calc(20 * var(--u));padding-top:calc(14 * var(--u));border-top:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;font-size:calc(12 * var(--u));color:#64748B;flex-wrap:wrap;gap:8px;">
            <div>Need help? Ask RWA Admin desk</div>
            <a onclick="Router.go('staff-dashboard')" style="color:#059669;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              🎫 Direct Gate Visitors Terminal →
            </a>
          </div>
        </div>
      </div>

      <!-- Execution hook to initialize video & slide auto-rotation immediately -->
      <img
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
        onload="window.initCutoraStaffAuth && window.initCutoraStaffAuth()"
        style="display:none;"
      />
    </div>
  `;
};

// ============================================================
// Staff Cinematic Slides & Auto-Rotator
// ============================================================

window.selectStaffSlide = function(idx) {
  window._cutoraStaffCurrentSlide = idx;
  const slide = window.STAFF_PITCH_SLIDES[idx];
  if (!slide) return;

  const h1 = document.getElementById('staffHeroHeadline1');
  const h2 = document.getElementById('staffHeroHeadline2');
  const sub = document.getElementById('staffHeroSubline');

  if (h1 && h2 && sub) {
    h1.style.opacity = '0';
    h2.style.opacity = '0';
    sub.style.opacity = '0';

    setTimeout(() => {
      h1.textContent = slide.line1;
      h2.textContent = slide.line2;
      sub.textContent = slide.sub;
      h1.style.opacity = '1';
      h2.style.opacity = '1';
      sub.style.opacity = '1';
    }, 180);
  }

  const dots = document.querySelectorAll('#staffSliderDots .cutora-dot');
  dots.forEach((d, i) => {
    if (i === idx) d.classList.add('active');
    else d.classList.remove('active');
  });
};

window.initCutoraStaffAuth = function() {
  // Video playback
  requestAnimationFrame(() => {
    const vid = document.getElementById('staffHeroVideo');
    if (!vid) return;
    const markLoaded = () => {
      if (vid.currentTime > 0.05 || vid.readyState >= 2) {
        vid.classList.add('loaded');
      }
    };
    vid.addEventListener('timeupdate', markLoaded);
    vid.addEventListener('playing', () => setTimeout(markLoaded, 120));
    if (vid.currentTime > 0.05 || vid.readyState >= 3) {
      vid.classList.add('loaded');
    }
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  });

  // Slide auto-rotator (rotates every 7s if on staff-login)
  if (window._cutoraStaffTimer) {
    clearInterval(window._cutoraStaffTimer);
  }
  window._cutoraStaffCurrentSlide = 0;
  window._cutoraStaffTimer = setInterval(() => {
    if (document.getElementById('staffHeroHeadline1')) {
      const next = ((window._cutoraStaffCurrentSlide || 0) + 1) % window.STAFF_PITCH_SLIDES.length;
      window.selectStaffSlide(next);
    } else {
      clearInterval(window._cutoraStaffTimer);
    }
  }, 7000);

  // Check pre-filled phone number
  const phoneEl = document.getElementById('staffPhoneInput');
  if (phoneEl && phoneEl.value && phoneEl.value.replace(/[^0-9]/g, '').length === 10) {
    window.handleStaffPhoneInputCheck(phoneEl);
  }
};

// ============================================================
// Quick Fill 1-Click Demo Login for Staff
// ============================================================

window.quickFillStaffGuard = function(phone, name) {
  if (typeof window.switchToStaffNormalLoginMode === 'function') {
    window.switchToStaffNormalLoginMode();
  }
  const phoneEl = document.getElementById('staffPhoneInput');
  const pinEl = document.getElementById('staffPinInput');
  if (phoneEl) phoneEl.value = phone;
  if (pinEl) pinEl.value = '1234';

  if (typeof showToast === 'function') {
    showToast(`👮 ${name} credentials filled! Signing in to Gate Terminal...`, 'info');
  }

  window.handleStaffPhoneInputCheck(phoneEl);
  setTimeout(() => {
    window.handleStaffPinLoginSubmit();
  }, 350);
};

// Dynamic Phone Status Checker for Staff
var _staffPhoneCheckDebounce = window._staffPhoneCheckDebounce || null;
window.handleStaffPhoneInputCheck = function(el) {
  clearTimeout(_staffPhoneCheckDebounce);
  const raw = el.value.replace(/[^0-9]/g, '');
  el.value = raw;

  const statusPill = document.getElementById('staffLoginStatusPill');
  if (raw.length < 10) {
    if (statusPill) statusPill.style.display = 'none';
    return;
  }

  _staffPhoneCheckDebounce = setTimeout(async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: raw, action: 'check_phone' })
      });
      const data = await res.json();
      if (!data.success) return;

      if (statusPill) {
        statusPill.style.display = 'block';
        if (data.exists && data.name) {
          const isStaffRole = data.isStaff || data.role === 'STAFF' || data.role === 'SECURITY';
          if (isStaffRole) {
            const postText = data.post ? ` (${data.post})` : '';
            const societyText = data.societyName ? ` · 🏢 ${data.societyName}` : '';
            statusPill.innerHTML = `
              <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:calc(10 * var(--u));padding:calc(7 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
                <span style="font-size:calc(12 * var(--u));font-weight:700;color:#065F46;">👋 Welcome, ${data.name} · 👮 Staff${postText}${societyText}</span>
                <span style="font-size:calc(11 * var(--u));color:#047857;font-weight:700;background:#D1FAE5;padding:2px 8px;border-radius:6px;">✓ Duty Verified</span>
              </div>
            `;
          } else if (data.role === 'RESIDENT') {
            statusPill.innerHTML = `
              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:calc(10 * var(--u));padding:calc(7 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
                <span style="font-size:calc(12 * var(--u));font-weight:700;color:#1E40AF;">🏠 ${data.name} is registered as a Resident.</span>
                <a onclick="Router.go('resident-login')" style="font-size:calc(11.5 * var(--u));color:#2563EB;font-weight:800;cursor:pointer;text-decoration:underline;">Switch to Resident Portal →</a>
              </div>
            `;
          } else {
            statusPill.innerHTML = `
              <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:calc(10 * var(--u));padding:calc(7 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
                <span style="font-size:calc(12 * var(--u));font-weight:700;color:#6D28D9;">🏢 ${data.name} is registered as Society Admin.</span>
                <a onclick="Router.go('auth-login')" style="font-size:calc(11.5 * var(--u));color:#7C3AED;font-weight:800;cursor:pointer;text-decoration:underline;">Switch to RWA Admin →</a>
              </div>
            `;
          }
        } else {
          statusPill.innerHTML = `
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:calc(10 * var(--u));padding:calc(7 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
              <span style="font-size:calc(11.5 * var(--u));color:#92400E;">ℹ️ Phone +91 ${raw} will be provisioned on duty sign-in with default PIN (1234).</span>
            </div>
          `;
        }
      }
    } catch (e) {
      console.warn('Phone check error:', e);
    }
  }, 220);
};

// ============================================================
// Staff Login Submission Handler
// ============================================================

window.handleStaffPinLoginSubmit = async function() {
  const phoneEl = document.getElementById('staffPhoneInput');
  const pinEl = document.getElementById('staffPinInput');
  const btn = document.getElementById('staffLoginSubmitBtn');
  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  if (!phone || phone.length < 10) {
    if (typeof showToast === 'function') showToast('Please enter a valid 10-digit mobile number', 'warning');
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (!pin) {
    if (typeof showToast === 'function') showToast('Please enter your 4-to-6 digit Security PIN', 'warning');
    if (pinEl) pinEl.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Signing In to Gate Terminal...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (data.needsPinSetup) {
        if (typeof showToast === 'function') showToast('First-time login: Please set your 4-digit PIN below', 'info');
        window.switchToStaffPinSetupMode(phone, data.name || '');
        return;
      }

      if (typeof showToast === 'function') {
        showToast(data.error || 'Login failed. Please check your Security PIN or use Demo PIN 1234.', 'warning');
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>👮 Sign In to Gate Operations &amp; Roster →</span>';
      }
      return;
    }

    // Save session in localStorage & cookies
    if (data.token) {
      localStorage.setItem('rwa_token', data.token);
      document.cookie = `rwa_token=${data.token}; path=/; max-age=604800;`;
    }
    if (data.user) {
      localStorage.setItem('rwa_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_login_phone', phone);
      if (data.user.organizationId) {
        localStorage.setItem('rwa_active_org_id', data.user.organizationId);
        document.cookie = `rwa_active_org_id=${data.user.organizationId}; path=/; max-age=604800;`;
      }
      if (data.user.organizationName) {
        localStorage.setItem('rwa_active_org_name', data.user.organizationName);
      }
    }

    if (typeof showToast === 'function') {
      showToast(`Welcome on duty, ${data.user?.name || 'Guard'}! Gate Terminal Ready.`, 'success');
    }

    // Direct routing to staff dashboard
    Router.go('staff-dashboard');
  } catch (err) {
    console.error('Staff login error:', err);
    if (typeof showToast === 'function') showToast('Network connection error', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>👮 Sign In to Gate Operations &amp; Roster →</span>';
    }
  }
};

// ============================================================
// First-Time PIN Setup Mode for Staff
// ============================================================

window.switchToStaffPinSetupMode = function(phone, name) {
  const formBody = document.getElementById('staffCutoraFormBody');
  if (!formBody) return;

  formBody.innerHTML = `
    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:calc(12 * var(--u));padding:calc(14 * var(--u));margin-bottom:calc(14 * var(--u));">
      <div style="font-size:calc(13 * var(--u));font-weight:800;color:#166534;margin-bottom:4px;">
        🛡️ First-Time Security Guard Verification
      </div>
      <div style="font-size:calc(12 * var(--u));color:#15803D;">
        Welcome ${name || 'Staff Member'}! Please set a 4-to-6 digit Security PIN to secure your duty shifts and gate terminal access.
      </div>
    </div>

    <!-- New PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="staffNewPinInput">Set New 4-to-6 Digit Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="staffNewPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="e.g. 1234"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') { const c = document.getElementById('staffConfirmPinInput'); if(c) c.focus(); }"
        />
      </div>
    </div>

    <!-- Confirm PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="staffConfirmPinInput">Confirm Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="staffConfirmPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Re-enter your PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') window.submitStaffPinSetup()"
        />
      </div>
    </div>

    <!-- Submit Setup PIN Button -->
    <button
      type="button"
      id="staffSetupPinBtn"
      class="cutora-login-btn"
      style="background:linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%);color:#FFFFFF;border:none;box-shadow:0 calc(8 * var(--u)) calc(24 * var(--u)) rgba(5, 150, 105, 0.35);cursor:pointer;font-weight:800;"
      onclick="window.submitStaffPinSetup()"
    >
      <span>✓ Set PIN &amp; Enter Gate Terminal →</span>
    </button>

    <div style="text-align:center;margin-top:calc(12 * var(--u));">
      <a onclick="window.switchToStaffNormalLoginMode()" style="font-size:calc(12 * var(--u));color:#64748B;cursor:pointer;text-decoration:underline;">
        ← Back to Normal PIN Sign In
      </a>
    </div>
  `;
};

window.switchToStaffNormalLoginMode = function() {
  const formBody = document.getElementById('staffCutoraFormBody');
  if (!formBody) return;

  formBody.innerHTML = `
    <!-- 4-to-6 Digit Security PIN Field -->
    <div class="cutora-field-group">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
        <label class="cutora-label" for="staffPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
        <a class="cutora-forgot-link" onclick="window.handleStaffResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;color:#059669;font-weight:700;">Set / Reset PIN</a>
      </div>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="staffPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter your 4 or 6-digit PIN"
          value="1234"
          autocomplete="current-password"
          onkeydown="if(event.key === 'Enter') window.handleStaffPinLoginSubmit()"
        />
        <button
          type="button"
          class="cutora-eye-btn"
          onclick="window.togglePinVisibility('staffPinInput', 'cutoraStaffPinEyeSlash')"
          title="Toggle PIN visibility"
          aria-label="Toggle PIN visibility"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line id="cutoraStaffPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Options Row: Remember Me Checkbox -->
    <div class="cutora-options-row">
      <label class="cutora-checkbox-label">
        <input
          type="checkbox"
          id="staffRememberMeCheckbox"
          class="cutora-checkbox-input"
          checked
          onchange="window.handleRememberMe(this)"
        />
        <span class="cutora-custom-checkbox" style="background:#059669;border-color:#059669;">
          <span class="cutora-checkbox-tick" style="display:block;">✓</span>
        </span>
        <span>Remember Guard ID on this device</span>
      </label>
    </div>

    <!-- Primary Sign In Button: Emerald Gradient -->
    <button
      type="button"
      id="staffLoginSubmitBtn"
      class="cutora-login-btn"
      style="background:linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%);color:#FFFFFF;border:none;box-shadow:0 calc(8 * var(--u)) calc(24 * var(--u)) rgba(5, 150, 105, 0.35);cursor:pointer;font-weight:800;"
      onclick="window.handleStaffPinLoginSubmit()"
    >
      <span>👮 Sign In to Gate Operations &amp; Roster →</span>
    </button>
  `;
};

window.submitStaffPinSetup = async function() {
  const phoneEl = document.getElementById('staffPhoneInput');
  const newPinEl = document.getElementById('staffNewPinInput');
  const confirmPinEl = document.getElementById('staffConfirmPinInput');
  const btn = document.getElementById('staffSetupPinBtn');

  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
  const pin = newPinEl ? newPinEl.value.trim() : '';
  const confirmPin = confirmPinEl ? confirmPinEl.value.trim() : '';

  if (!pin || pin.length < 4) {
    if (typeof showToast === 'function') showToast('Security PIN must be at least 4 digits', 'warning');
    if (newPinEl) newPinEl.focus();
    return;
  }
  if (pin !== confirmPin) {
    if (typeof showToast === 'function') showToast('PIN and Confirm PIN do not match', 'warning');
    if (confirmPinEl) confirmPinEl.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Saving PIN &amp; Signing In...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        pin,
        confirmPin,
        action: 'setup_pin'
      })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (typeof showToast === 'function') showToast(data.error || 'Failed to set Security PIN', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✓ Set PIN &amp; Enter Gate Terminal →</span>';
      }
      return;
    }

    if (data.token) {
      localStorage.setItem('rwa_token', data.token);
      document.cookie = `rwa_token=${data.token}; path=/; max-age=604800;`;
    }
    if (data.user) {
      localStorage.setItem('rwa_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_login_phone', phone);
      if (data.user.organizationId) {
        localStorage.setItem('rwa_active_org_id', data.user.organizationId);
        document.cookie = `rwa_active_org_id=${data.user.organizationId}; path=/; max-age=604800;`;
      }
    }

    if (typeof showToast === 'function') {
      showToast('Security PIN configured successfully! Welcome on duty.', 'success');
    }
    Router.go('staff-dashboard');
  } catch (e) {
    console.error('Setup PIN error:', e);
    if (typeof showToast === 'function') showToast('Network connection error', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>✓ Set PIN &amp; Enter Gate Terminal →</span>';
    }
  }
};

// ============================================================
// Staff PIN Reset Modal Handler
// ============================================================

window.handleStaffResetPinModal = function() {
  const currentPhone = (document.getElementById('staffPhoneInput')?.value || '').trim();

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:12px;padding:14px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">🛡️</span>
        <div style="font-size:12.5px;color:#065F46;line-height:1.45;">
          Enter your registered Staff Mobile Number and create a new 4-digit Security PIN. For emergency shift login, demo PIN <strong>1234</strong> is available.
        </div>
      </div>

      <div class="form-group" style="margin:0;">
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">Staff Mobile Number</label>
        <div style="display:flex;border:1.5px solid #CBD5E1;border-radius:10px;overflow:hidden;">
          <span style="background:#F8FAFC;padding:10px 12px;font-size:13px;font-weight:700;color:#059669;border-right:1px solid #E2E8F0;">+91</span>
          <input
            type="tel"
            id="modalStaffResetPhone"
            value="${currentPhone}"
            placeholder="10-digit mobile number"
            maxlength="10"
            style="flex:1;border:none;padding:10px 12px;font-size:14px;font-weight:600;outline:none;"
          />
        </div>
      </div>

      <div class="form-group" style="margin:0;">
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">New 4-to-6 Digit PIN</label>
        <input
          type="password"
          id="modalStaffResetNewPin"
          placeholder="Enter new 4-digit PIN"
          maxlength="6"
          style="width:100%;border:1.5px solid #CBD5E1;border-radius:10px;padding:10px 12px;font-size:14px;font-weight:600;outline:none;"
        />
      </div>

      <div class="form-group" style="margin:0;">
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">Confirm New PIN</label>
        <input
          type="password"
          id="modalStaffResetConfirmPin"
          placeholder="Re-enter new PIN"
          maxlength="6"
          style="width:100%;border:1.5px solid #CBD5E1;border-radius:10px;padding:10px 12px;font-size:14px;font-weight:600;outline:none;"
        />
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
        <button
          class="btn btn-secondary"
          onclick="Modal.close()"
          style="font-weight:600;padding:8px 16px;border-radius:8px;"
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick="window.executeStaffPinReset()"
          style="background:#059669;border:none;font-weight:800;padding:8px 20px;border-radius:8px;"
        >
          <span>✓ Update Security PIN</span>
        </button>
      </div>
    </div>
  `;

  if (typeof Modal !== 'undefined' && Modal.show) {
    Modal.show({
      title: '👮 Staff & Guard PIN Reset',
      body: modalHtml,
      maxWidth: '460px',
    });
  } else if (typeof showModal === 'function') {
    showModal('👮 Staff & Guard PIN Reset', modalHtml, null, null, '460px');
  }
};

window.executeStaffPinReset = async function() {
  const phoneEl = document.getElementById('modalStaffResetPhone');
  const newPinEl = document.getElementById('modalStaffResetNewPin');
  const confirmPinEl = document.getElementById('modalStaffResetConfirmPin');

  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
  const pin = newPinEl ? newPinEl.value.trim() : '';
  const confirmPin = confirmPinEl ? confirmPinEl.value.trim() : '';

  if (!phone || phone.length < 10) {
    if (typeof showToast === 'function') showToast('Please enter a valid 10-digit mobile number', 'warning');
    return;
  }
  if (!pin || pin.length < 4) {
    if (typeof showToast === 'function') showToast('Security PIN must be at least 4 digits', 'warning');
    return;
  }
  if (pin !== confirmPin) {
    if (typeof showToast === 'function') showToast('New PIN and Confirm PIN do not match', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        pin,
        confirmPin,
        action: 'reset_pin'
      })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (typeof showToast === 'function') showToast(data.error || 'Failed to reset PIN', 'warning');
      return;
    }

    if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
    if (typeof showToast === 'function') {
      showToast('Security PIN reset successfully! Signing in...', 'success');
    }

    const mainPhoneEl = document.getElementById('staffPhoneInput');
    const mainPinEl = document.getElementById('staffPinInput');
    if (mainPhoneEl) mainPhoneEl.value = phone;
    if (mainPinEl) mainPinEl.value = pin;

    window.handleStaffPinLoginSubmit();
  } catch (err) {
    console.error('Reset PIN error:', err);
    if (typeof showToast === 'function') showToast('Network connection error', 'error');
  }
};
