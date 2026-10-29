// ============================================================
// SOCIETY STAFF & SECURITY GUARD LOGIN SCREEN
// ============================================================

window.Screens = window.Screens || {};

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

      <!-- Readability: Left wash with deep security navy & emerald accent -->
      <div class="cutora-overlay" style="background:linear-gradient(90deg, rgba(6, 78, 59, 0.72) 0%, rgba(15, 23, 42, 0.65) calc(200 * var(--u)), transparent calc(500 * var(--u))), linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.3) calc(140 * var(--u)), transparent calc(300 * var(--u))), linear-gradient(0deg, rgba(6, 78, 59, 0.5) 0%, transparent calc(420 * var(--u)));"></div>

      <!-- Hero Column (Left, White Typography) -->
      <div class="cutora-hero-col">
        <!-- Top Bar -->
        <div class="cutora-topbar">
          <div class="cutora-brand" onclick="Router.go('staff-login')">
            <div class="cutora-brand-tile" style="background:#064E3B;border:1px solid #34D399;">
              <span class="cutora-brand-glyph">👮</span>
            </div>
            <span class="cutora-brand-text">Cutora · Staff &amp; Security</span>
          </div>

          <div style="display:flex;align-items:center;gap:12px;">
            <a class="cutora-top-link" onclick="Router.go('auth-login')" title="Open RWA Admin Portal">
              <span>← RWA Admin</span>
            </a>
            <a class="cutora-top-link" onclick="Router.go('resident-login')" title="Open Resident Portal">
              <span>🏠 Resident Portal</span>
            </a>
          </div>
        </div>

        <!-- Pitch (Bottom-Left) -->
        <div class="cutora-pitch">
          <div class="cutora-headline-clip">
            <span class="cutora-headline-line line-1" style="color:#F0FDF4;">Gate Barrier Operations</span>
          </div>
          <div class="cutora-headline-clip">
            <span class="cutora-headline-line line-2" style="color:#34D399;">Fast Pass &amp; PIN Verification</span>
          </div>

          <p class="cutora-subline" style="color:#D1FAE5;">
            Verified gate access system for security guards and society staff. Manage shift duty posts, visitor verification, and transparent salary payout dates.
          </p>

          <!-- Metrics -->
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
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:28px;">👮</span>
            <h1 class="cutora-card-heading" style="margin:0;">Staff &amp; Security Portal</h1>
          </div>
          <p class="cutora-card-subline">Sign in with your registered phone number &amp; PIN to manage barrier duty, gate passes, and salary.</p>

          <!-- Top Role Portal Switcher (3 Tabs) -->
          <div class="cutora-tab-group" style="margin-bottom:calc(12 * var(--u));">
            <button class="cutora-tab-btn" onclick="Router.go('auth-login')">
              <span>🏢</span>
              <span>RWA Admin</span>
            </button>
            <button class="cutora-tab-btn" onclick="Router.go('resident-login')">
              <span>🏠</span>
              <span>Resident</span>
            </button>
            <button class="cutora-tab-btn active" style="cursor:default;background:#064E3B;color:#34D399;border:1px solid #059669;font-weight:800;">
              <span>👮</span>
              <span>Staff &amp; Guards</span>
            </button>
          </div>

          <!-- Quick 1-Click Guard Demo Accounts -->
          <div style="margin-bottom:calc(14 * var(--u));">
            <div style="font-size:11.5px;font-weight:700;color:#64748B;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">1-Click Demo Staff Login:</div>
            <div style="display:flex;gap:calc(6 * var(--u));flex-wrap:wrap;">
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543210', 'Ram Singh - Gate 1')"
                style="flex:1;min-width:140px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#166534;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
                title="Log in as Ram Singh (Gate 1 Guard)"
              >
                <span>🛡️</span>
                <span>Ram Singh (Gate 1)</span>
              </button>
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543211', 'Dharmendra - Gate 2')"
                style="flex:1;min-width:140px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#334155;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
                title="Log in as Dharmendra Kumar (Gate 2 Guard)"
              >
                <span>🚪</span>
                <span>Dharmendra (Gate 2)</span>
              </button>
              <button
                type="button"
                onclick="window.quickFillStaffGuard('9876543215', 'Ramesh - Supervisor')"
                style="flex:1;min-width:140px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:calc(8 * var(--u));padding:calc(8 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#1E40AF;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
                title="Log in as Ramesh Paswan (Supervisor)"
              >
                <span>👔</span>
                <span>Supervisor (Campus)</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Status Pill -->
          <div id="staffLoginStatusPill" style="display:none;margin-bottom:calc(12 * var(--u));"></div>

          <!-- Mobile Number Field -->
          <div class="cutora-field-group">
            <label class="cutora-label" for="staffPhoneInput">Staff Mobile Number</label>
            <div class="cutora-input-box">
              <div class="cutora-country-code">🇮🇳 +91</div>
              <input
                id="staffPhoneInput"
                class="cutora-input"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value="${lastPhone}"
                maxlength="10"
                autocomplete="tel"
                oninput="window.handleStaffPhoneInput(this.value)"
              />
            </div>
          </div>

          <!-- Security PIN Field -->
          <div class="cutora-field-group">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <label class="cutora-label" for="staffPinInput">Security PIN</label>
              <span style="font-size:11px;color:#059669;font-weight:700;">Demo PIN: 1234</span>
            </div>
            <div class="cutora-input-box">
              <input
                id="staffPinInput"
                class="cutora-input"
                type="password"
                placeholder="Enter 4-digit PIN"
                value="1234"
                maxlength="6"
                autocomplete="current-password"
                onkeydown="if(event.key==='Enter')window.handleStaffPinLoginSubmit()"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="button"
            id="staffLoginSubmitBtn"
            class="cutora-submit-btn"
            style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#fff;font-weight:800;border:none;box-shadow:0 6px 20px rgba(5,150,105,0.35);cursor:pointer;"
            onclick="window.handleStaffPinLoginSubmit()"
          >
            <span>👮 Sign In to Gate Operations &amp; Roster →</span>
          </button>

          <!-- Bottom Footer Note -->
          <div style="margin-top:calc(20 * var(--u));padding-top:calc(14 * var(--u));border-top:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between;font-size:calc(11.5 * var(--u));color:#64748B;">
            <div>Need help? Ask RWA Admin desk</div>
            <a onclick="Router.go('guest-pass')" style="color:#2563EB;font-weight:700;cursor:pointer;">
              🎫 Open Guest Pass Screen →
            </a>
          </div>

        </div>
      </div>
    </div>
  `;
};

// Quick fill helper for staff
window.quickFillStaffGuard = function(phone, name) {
  const phoneEl = document.getElementById('staffPhoneInput');
  const pinEl = document.getElementById('staffPinInput');
  if (phoneEl) phoneEl.value = phone;
  if (pinEl) pinEl.value = '1234';

  if (typeof showToast === 'function') {
    showToast(`👮 ${name} credentials filled! Signing in...`, 'info');
  }
  window.handleStaffPinLoginSubmit();
};

window.handleStaffPhoneInput = function(phone) {
  // Optional dynamic detection
};

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
    if (typeof showToast === 'function') showToast('Please enter your 4-digit Security PIN', 'warning');
    if (pinEl) pinEl.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Signing in to Gate Operations...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (typeof showToast === 'function') {
        showToast(data.error || 'Login failed. Please check your credentials.', 'warning');
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>👮 Sign In to Gate Operations &amp; Roster →</span>';
      }
      return;
    }

    // Save session in localStorage
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
      showToast(`Welcome on duty, ${data.user?.name || 'Guard'}!`, 'success');
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
