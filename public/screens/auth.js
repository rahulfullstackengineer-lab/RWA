// =============================================
// Auth Screens: Login, OTP, Onboarding Wizard
// =============================================

// Slide Content for Cutora Cinematic Pitch
window.CUTORA_PITCH_SLIDES = [
  {
    line1: 'Manage Smarter. Collect Faster.',
    line2: 'Unify Your Society Anywhere.',
    sub: 'From automated maintenance billing to real-time gate security, our powerful platform lets societies work seamlessly across devices.'
  },
  {
    line1: 'Instant UPI Collections.',
    line2: 'Zero Defaulter Friction.',
    sub: 'Collect dues on WhatsApp with 1-click UPI links. Auto-reconcile bank statements and slash defaulter delays by 70%.'
  },
  {
    line1: 'Digital Elections & Security.',
    line2: 'Total Society Trust.',
    sub: 'Verified resident rosters, digital voting, visitor approvals at the guard gate, and a complete Tricity compliance calendar.'
  }
];

Screens['auth-login'] = function() {
  const lastPhone = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_login_phone')) || '';
  const lastOrgName = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_active_org_name')) || '';

  return `
    <div class="cutora-auth-screen fade-in" id="cutoraAuthContainer">
      <!-- Motion: 4s seamless upward glide loop -->
      <video
        id="cutoraHeroVideo"
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

      <!-- Readability: 150u left wash, 140u top wash, 420u warm bottom wash -->
      <div class="cutora-overlay"></div>

      <!-- Hero Column (Left, White Typography) -->
      <div class="cutora-hero-col">
        <!-- Top Bar (57u from top, 92.5u from left) -->
        <div class="cutora-topbar">
          <div class="cutora-brand" onclick="Router.go('auth-login')">
            <div class="cutora-brand-tile">
              <span class="cutora-brand-glyph">R</span>
            </div>
            <span class="cutora-brand-text">Cutora · RWA</span>
          </div>

          <a class="cutora-top-link" onclick="Router.go('resident-login')" title="Open Resident Portal Login">
            <span>← Resident Portal</span>
          </a>
        </div>

        <!-- Pitch (Bottom-Left) -->
        <div class="cutora-pitch">
          <div class="cutora-headline-clip">
            <span id="heroHeadline1" class="cutora-headline-line line-1">${window.CUTORA_PITCH_SLIDES[0].line1}</span>
          </div>
          <div class="cutora-headline-clip">
            <span id="heroHeadline2" class="cutora-headline-line line-2">${window.CUTORA_PITCH_SLIDES[0].line2}</span>
          </div>

          <p id="heroSubline" class="cutora-subline">
            ${window.CUTORA_PITCH_SLIDES[0].sub}
          </p>

          <!-- Slider Dots (35.5u below, 34.5x9 amber pill + two 9u white dots) -->
          <div class="cutora-slider-row" id="cutoraSliderDots">
            <button class="cutora-dot active" data-slide="0" onclick="window.selectCutoraSlide(0)" title="Smart Operations" aria-label="Slide 1"></button>
            <button class="cutora-dot" data-slide="1" onclick="window.selectCutoraSlide(1)" title="Automated Billing" aria-label="Slide 2"></button>
            <button class="cutora-dot" data-slide="2" onclick="window.selectCutoraSlide(2)" title="Elections & Gate Pass" aria-label="Slide 3"></button>
          </div>

          <!-- Trust & Scale Metrics -->
          <div class="cutora-metrics">
            <div>
              <div class="cutora-metric-val">500<span>+</span></div>
              <div class="cutora-metric-label">Active Tricity RWAs</div>
            </div>
            <div>
              <div class="cutora-metric-val">₹12Cr<span>+</span></div>
              <div class="cutora-metric-label">Maintenance Collected</div>
            </div>
            <div>
              <div class="cutora-metric-val">100K<span>+</span></div>
              <div class="cutora-metric-label">Verified Residents</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Log-in Card (Right: 742.4u wide, 18u margin top/right, 22.5u bottom) -->
      <div class="cutora-card-panel">
        <div class="cutora-form-wrap">
          <!-- Card Heading & Subline -->
          <h1 class="cutora-card-heading">Welcome Back!</h1>
          <p class="cutora-card-subline">Log in to manage your society operations with ease.</p>

          <!-- Top Role Portal Switcher -->
          <div class="cutora-tab-group" style="margin-bottom:calc(10 * var(--u));">
            <button class="cutora-tab-btn active" style="cursor:default;">
              <span>🏢</span>
              <span>RWA Admin</span>
            </button>
            <button class="cutora-tab-btn" onclick="Router.go('resident-login')" style="color:var(--cutora-amber);font-weight:700;">
              <span>🏠</span>
              <span>Resident</span>
            </button>
            <button class="cutora-tab-btn" onclick="window.quickFillStaff()" style="color:#10B981;font-weight:700;">
              <span>👮</span>
              <span>Staff &amp; Guards</span>
            </button>
          </div>

          <!-- Quick 1-Click Demo Login Bar -->
          <div style="display:flex;gap:calc(8 * var(--u));margin-bottom:calc(14 * var(--u));flex-wrap:wrap;">
            <button
              type="button"
              onclick="window.quickFillAdmin()"
              style="flex:1;min-width:130px;background:#F1F5F9;border:1px solid #CBD5E1;border-radius:calc(8 * var(--u));padding:calc(7 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#0F172A;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
              title="Auto-fill Demo Admin credentials and log in"
            >
              <span>🏢</span>
              <span>Admin (1-Click)</span>
            </button>
            <button
              type="button"
              onclick="window.quickFillResident()"
              style="flex:1;min-width:130px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:calc(8 * var(--u));padding:calc(7 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:600;color:#475569;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
              title="Auto-fill Demo Resident credentials and log in"
            >
              <span>🏠</span>
              <span>Resident (1-Click)</span>
            </button>
            <button
              type="button"
              onclick="window.quickFillStaff()"
              style="flex:1;min-width:130px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:calc(8 * var(--u));padding:calc(7 * var(--u)) calc(10 * var(--u));font-size:calc(11.5 * var(--u));font-weight:700;color:#166534;display:flex;align-items:center;justify-content:center;gap:calc(6 * var(--u));cursor:pointer;transition:all 0.15s ease;"
              title="Auto-fill Demo Security Guard credentials and log in"
            >
              <span>👮</span>
              <span>Guard / Staff (1-Click)</span>
            </button>
          </div>

          <!-- Real-Time User & Society Detection Status Pill -->
          <div id="loginUserStatusPill" style="display:none;margin-bottom:calc(12 * var(--u));"></div>

          <!-- Mobile Number Field -->
          <div class="cutora-field-group">
            <label class="cutora-label" for="loginPhoneInput">Registered Mobile Number</label>
            <div class="cutora-input-box">
              <div class="cutora-country-code">🇮🇳 +91</div>
              <input
                id="loginPhoneInput"
                class="cutora-input"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value="${lastPhone}"
                maxlength="10"
                autocomplete="tel"
                oninput="window.handlePhoneInputCheck(this)"
                onkeydown="if(event.key === 'Enter') { const p = document.getElementById('loginPinInput'); if(p) p.focus(); }"
              />
            </div>
          </div>

          <!-- Dynamic Form Body (Switches between Login, PIN Setup, and Registration) -->
          <div id="cutoraFormBody">
            <!-- 4-to-6 Digit Security PIN Field -->
            <div class="cutora-field-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
                <label class="cutora-label" for="loginPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
                <a class="cutora-forgot-link" onclick="window.handleResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;">Set / Reset PIN</a>
              </div>
              <div class="cutora-input-box">
                <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">🔒 PIN</div>
                <input
                  id="loginPinInput"
                  class="cutora-input"
                  type="password"
                  maxlength="6"
                  placeholder="Enter your 4 or 6-digit PIN"
                  autocomplete="current-password"
                  onkeydown="if(event.key === 'Enter') handlePinLogin()"
                />
                <button
                  type="button"
                  class="cutora-eye-btn"
                  onclick="window.togglePinVisibility('loginPinInput', 'cutoraPinEyeSlash')"
                  title="Toggle PIN visibility"
                  aria-label="Toggle PIN visibility"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line id="cutoraPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#F59A08;stroke-width:2.5;"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Options Row: 26u Remember Me Checkbox + Hint -->
            <div class="cutora-options-row">
              <label class="cutora-checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMeCheckbox"
                  class="cutora-checkbox-input"
                  checked
                  onchange="window.handleRememberMe(this)"
                />
                <span class="cutora-custom-checkbox">
                  <span class="cutora-checkbox-tick">✓</span>
                </span>
                <span>Remember Me</span>
              </label>
            </div>

            <!-- Primary Sign In Button: Full-width 66u pill, Black with Amber text -->
            <button id="loginPinSubmitBtn" class="cutora-login-btn" onclick="window.handlePinLogin()">
              <span>🔒 Sign In with Security PIN →</span>
            </button>
          </div>

          <!-- Footer Line with Amber Link -->
          <div class="cutora-footer-line">
            Don’t have an account? <a class="link-amber" onclick="Router.go('onboarding-1')">Onboard your society here →</a>
          </div>
        </div>
      </div>

      <!-- Execution hook to initialize video & slide auto-rotation immediately -->
      <img
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
        onload="window.initCutoraAuth && window.initCutoraAuth()"
        style="display:none;"
      />
    </div>
  `;
};

// Slider Interactive Dot Switcher
window.selectCutoraSlide = function(idx) {
  window._cutoraCurrentSlide = idx;
  const slide = window.CUTORA_PITCH_SLIDES[idx];
  if (!slide) return;

  const h1 = document.getElementById('heroHeadline1');
  const h2 = document.getElementById('heroHeadline2');
  const sub = document.getElementById('heroSubline');
  const dots = document.querySelectorAll('.cutora-dot');

  if (dots) {
    dots.forEach((d, i) => {
      if (i === idx) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });
  }

  if (h1 && h2 && sub) {
    h1.style.animation = 'none';
    h2.style.animation = 'none';
    sub.style.opacity = '0';
    void h1.offsetWidth; // re-flow
    h1.innerText = slide.line1;
    h2.innerText = slide.line2;
    h1.style.animation = 'wipeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    h2.style.animation = 'wipeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards';
    setTimeout(() => {
      sub.innerText = slide.sub;
      sub.style.opacity = '1';
    }, 140);
  }
};

// Initialization hook for background video & slide ticker
window.initCutoraAuth = function() {
  const vids = [
    document.getElementById('cutoraHeroVideo'),
    document.getElementById('wizHeroVideo'),
    document.getElementById('resHeroVideo')
  ].filter(Boolean);

  vids.forEach(vid => {
    const markLoaded = () => {
      if (vid.currentTime > 0.05 || vid.readyState >= 3) {
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

  // Slide auto-rotator (rotates every 7 seconds if on auth-login)
  if (window._cutoraTimer) {
    clearInterval(window._cutoraTimer);
  }
  window._cutoraCurrentSlide = 0;
  window._cutoraTimer = setInterval(() => {
    if (document.getElementById('heroHeadline1')) {
      const next = ((window._cutoraCurrentSlide || 0) + 1) % window.CUTORA_PITCH_SLIDES.length;
      window.selectCutoraSlide(next);
    } else {
      clearInterval(window._cutoraTimer);
    }
  }, 7000);

  // Auto-check pre-filled phone number
  const phoneEl = document.getElementById('loginPhoneInput');
  if (phoneEl && phoneEl.value && phoneEl.value.replace(/[^0-9]/g, '').length === 10) {
    window.handlePhoneInputCheck(phoneEl);
  }
};

// Toggle password visibility with icon slash
window.togglePasswordVisibility = function() {
  const input = document.getElementById('loginPasswordInput');
  const eyeSlash = document.getElementById('cutoraEyeSlash');
  const eyeIcon = document.getElementById('cutoraEyeIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (eyeSlash) eyeSlash.style.display = 'block';
    if (eyeIcon) eyeIcon.setAttribute('stroke', '#F59A08');
  } else {
    input.type = 'password';
    if (eyeSlash) eyeSlash.style.display = 'none';
    if (eyeIcon) eyeIcon.setAttribute('stroke', 'currentColor');
  }
};

window.togglePinVisibility = function(inputId = 'loginPinInput', slashId = 'cutoraPinEyeSlash') {
  const input = document.getElementById(inputId);
  const eyeSlash = document.getElementById(slashId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (eyeSlash) eyeSlash.style.display = 'inline';
  } else {
    input.type = 'password';
    if (eyeSlash) eyeSlash.style.display = 'none';
  }
};

// Remember me checkbox handler
window.handleRememberMe = function(checkbox) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('rwa_remember_me', checkbox.checked ? 'true' : 'false');
  }
};

// Dynamic Real-Time Phone Status Checker
var _phoneCheckDebounce = window._phoneCheckDebounce || null;
window.handlePhoneInputCheck = function(el) {
  clearTimeout(_phoneCheckDebounce);
  const raw = el.value.replace(/[^0-9]/g, '');
  el.value = raw;

  const statusPill = document.getElementById('loginUserStatusPill');
  if (raw.length < 10) {
    if (statusPill) statusPill.style.display = 'none';
    return;
  }

  _phoneCheckDebounce = setTimeout(async () => {
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
          const roleBadge = data.role === 'RWA_ADMIN' || data.role === 'ADMIN' ? '🏢 Society Admin' : `🏠 Resident${data.unitNumber ? ' (Flat ' + data.unitNumber + ')' : ''}`;
          statusPill.innerHTML = `
            <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:calc(10 * var(--u));padding:calc(6 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
              <span style="font-size:calc(12 * var(--u));font-weight:700;color:#065F46;">👋 Welcome, ${data.name} · ${roleBadge}</span>
              <span style="font-size:calc(11 * var(--u));color:#047857;font-weight:600;">✓ Account Verified</span>
            </div>
          `;
        } else {
          statusPill.innerHTML = `
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:calc(10 * var(--u));padding:calc(6 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
              <span style="font-size:calc(11.5 * var(--u));color:#991B1B;">⚠️ No account found with +91 ${raw}. If new, onboard your society below.</span>
            </div>
          `;
        }
      }
    } catch (e) {
      console.warn('Phone check error:', e);
    }
  }, 250);
};

window.switchToPinSetupMode = function(phone, name) {
  const body = document.getElementById('cutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- 4-Digit Security PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="setupPinInput">Create 4-Digit Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">🔒 PIN</div>
        <input
          id="setupPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter 4-to-6 digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') document.getElementById('setupConfirmPinInput').focus()"
        />
      </div>
    </div>

    <!-- Confirm PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="setupConfirmPinInput">Confirm Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">✓ PIN</div>
        <input
          id="setupConfirmPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Re-enter your 4-digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') handleSaveNewPin('${phone}')"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button id="setupPinBtn" class="cutora-login-btn" onclick="window.handleSaveNewPin('${phone}')">
      <span>🔒 Save PIN & Enter Portal →</span>
    </button>
  `;
};

window.switchToRegisterMode = function(phone) {
  const body = document.getElementById('cutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- Name Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="regNameInput">Your Full Name</label>
      <div class="cutora-input-box">
        <input
          id="regNameInput"
          class="cutora-input"
          type="text"
          placeholder="Enter your full name"
          autocomplete="name"
          onkeydown="if(event.key === 'Enter') document.getElementById('regPinInput').focus()"
        />
      </div>
    </div>

    <!-- Account Role Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="regRoleSelect">Account Type</label>
      <div class="cutora-input-box" style="padding:0 calc(14 * var(--u));">
        <select id="regRoleSelect" class="cutora-input" style="border:none;outline:none;background:transparent;cursor:pointer;font-weight:700;color:var(--cutora-ink);padding:0;">
          <option value="RWA_ADMIN">🏢 Society Admin / Management Committee</option>
          <option value="RESIDENT">🏠 Resident / Flat Owner</option>
        </select>
      </div>
    </div>

    <!-- 4-Digit Security PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="regPinInput">Choose 4-Digit Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">🔒 PIN</div>
        <input
          id="regPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter 4-to-6 digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') document.getElementById('regConfirmPinInput').focus()"
        />
      </div>
    </div>

    <!-- Confirm PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="regConfirmPinInput">Confirm Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">✓ PIN</div>
        <input
          id="regConfirmPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Re-enter your PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') handleRegisterUser('${phone}')"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button id="regSubmitBtn" class="cutora-login-btn" onclick="window.handleRegisterUser('${phone}')">
      <span>🚀 Create Account & Enter Portal →</span>
    </button>
  `;
};

window.switchToNormalLoginMode = function() {
  const body = document.getElementById('cutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- 4-to-6 Digit Security PIN Field -->
    <div class="cutora-field-group">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
        <label class="cutora-label" for="loginPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
        <a class="cutora-forgot-link" onclick="window.handleResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;">Set / Reset PIN</a>
      </div>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:var(--cutora-amber);font-weight:700;">🔒 PIN</div>
        <input
          id="loginPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter your 4 or 6-digit PIN"
          autocomplete="current-password"
          onkeydown="if(event.key === 'Enter') handlePinLogin()"
        />
        <button
          type="button"
          class="cutora-eye-btn"
          onclick="window.togglePinVisibility('loginPinInput', 'cutoraPinEyeSlash')"
          title="Toggle PIN visibility"
          aria-label="Toggle PIN visibility"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line id="cutoraPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#F59A08;stroke-width:2.5;"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Options Row: 26u Remember Me Checkbox + Hint -->
    <div class="cutora-options-row">
      <label class="cutora-checkbox-label">
        <input
          type="checkbox"
          id="rememberMeCheckbox"
          class="cutora-checkbox-input"
          checked
          onchange="window.handleRememberMe(this)"
        />
        <span class="cutora-custom-checkbox">
          <span class="cutora-checkbox-tick">✓</span>
        </span>
        <span>Remember Me</span>
      </label>
    </div>

    <!-- Primary Sign In Button: Full-width 66u pill, Black with Amber text -->
    <button id="loginPinSubmitBtn" class="cutora-login-btn" onclick="window.handlePinLogin()">
      <span>🔒 Sign In with Security PIN →</span>
    </button>
  `;
};

window.handleSaveNewPin = async function(phoneArg) {
  const phone = (phoneArg || document.getElementById('loginPhoneInput')?.value || '').trim().replace(/\s+/g, '');
  const pin = document.getElementById('setupPinInput')?.value.trim();
  const confirmPin = document.getElementById('setupConfirmPinInput')?.value.trim();

  if (!pin || pin.length < 4) {
    showToast('PIN must be at least 4 digits', 'warning');
    return;
  }
  if (pin !== confirmPin) {
    showToast('PIN and Confirm PIN do not match', 'warning');
    return;
  }

  const btn = document.getElementById('setupPinBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>🔒</span><span>Saving PIN...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin, confirmPin, action: 'setup_pin' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to save PIN', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🔒 Save PIN & Enter Portal →</span>';
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
      showToast('✓ Security PIN set successfully! Welcome to your society.', 'success');
      if (data.user.role === 'PLATFORM_ADMIN') {
        Router.go('platform-dashboard');
      } else if (data.user.role === 'RESIDENT') {
        if (data.isConnected || (data.user.organizationId && data.user.unitId)) {
          Router.go('resident-dashboard');
        } else {
          Router.go('resident-onboard');
        }
      } else {
        Router.go('admin-dashboard');
      }
    }
  } catch (err) {
    console.error('Save PIN error:', err);
    showToast('Network error saving PIN', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔒 Save PIN & Enter Portal →</span>';
    }
  }
};

window.handleRegisterUser = async function(phoneArg) {
  const phone = (phoneArg || document.getElementById('loginPhoneInput')?.value || '').trim().replace(/\s+/g, '');
  const name = document.getElementById('regNameInput')?.value.trim();
  const role = document.getElementById('regRoleSelect')?.value || 'RWA_ADMIN';
  const pin = document.getElementById('regPinInput')?.value.trim();
  const confirmPin = document.getElementById('regConfirmPinInput')?.value.trim();

  if (!name || name.length < 2) {
    showToast('Please enter your full name', 'warning');
    return;
  }
  if (!pin || pin.length < 4) {
    showToast('PIN must be at least 4 digits', 'warning');
    return;
  }
  if (pin !== confirmPin) {
    showToast('PIN and Confirm PIN do not match', 'warning');
    return;
  }

  const btn = document.getElementById('regSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>Creating Account...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, pin, confirmPin, role, action: 'register' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to create account', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🚀 Create Account & Enter Portal →</span>';
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
      showToast(`Welcome, ${data.user.name}! Your account and PIN are ready.`, 'success');
      if (data.user.role === 'RWA_ADMIN' || data.user.role === 'PLATFORM_ADMIN' || data.user.role === 'ADMIN') {
        Router.go('admin-dashboard');
      } else {
        Router.go('resident-onboard');
      }
    }
  } catch (err) {
    console.error('Register error:', err);
    showToast('Network error during registration', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🚀 Create Account & Enter Portal →</span>';
    }
  }
};

// Reset PIN modal / prompt handler (100% Free, no SMS/WhatsApp required)
window.handleResetPinModal = async function() {
  const phoneEl = document.getElementById('loginPhoneInput') || document.getElementById('resPhoneInput');
  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';

  if (!phone || phone.length < 10) {
    showToast('Please enter your 10-digit mobile number above first', 'warning');
    if (phoneEl) phoneEl.focus();
    return;
  }

  const newPin = prompt(`Set your new 4-to-6 digit Security PIN for +91 ${phone}:`, '');
  if (!newPin) return;

  const cleanPin = newPin.trim();
  if (cleanPin.length < 4 || cleanPin.length > 6) {
    showToast('PIN must be 4 to 6 digits long', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin: cleanPin, action: 'reset_pin' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to update PIN', 'warning');
      return;
    }

    showToast('✓ Security PIN set successfully! Signing you in...', 'success');
    const pinEl = document.getElementById('loginPinInput') || document.getElementById('resPinInput');
    if (pinEl) pinEl.value = cleanPin;
    window.handlePinLogin();
  } catch (e) {
    showToast('Network error setting PIN', 'warning');
  }
};

window.quickFillAdmin = function() {
  if (typeof window.switchToNormalLoginMode === 'function') {
    window.switchToNormalLoginMode();
  }
  const phoneInput = document.getElementById('loginPhoneInput');
  const pinInput = document.getElementById('loginPinInput');
  if (phoneInput) phoneInput.value = '9876543210';
  if (pinInput) pinInput.value = '1234';
  if (typeof showToast === 'function') {
    showToast('🏢 RWA Admin (9876543210 · PIN 1234) filled. Signing in...', 'info');
  }
  window.handlePinLogin();
};

window.quickFillResident = function() {
  if (typeof window.switchToNormalLoginMode === 'function') {
    window.switchToNormalLoginMode();
  }
  const phoneInput = document.getElementById('loginPhoneInput');
  const pinInput = document.getElementById('loginPinInput');
  if (phoneInput) phoneInput.value = '9876543212';
  if (pinInput) pinInput.value = '1234';
  if (typeof showToast === 'function') {
    showToast('🏠 Resident (Flat A-101 · PIN 1234) filled. Signing in...', 'info');
  }
  window.handlePinLogin();
};

window.quickFillSuperAdmin = function() {
  if (typeof window.switchToNormalLoginMode === 'function') {
    window.switchToNormalLoginMode();
  }
  const phoneInput = document.getElementById('loginPhoneInput');
  const pinInput = document.getElementById('loginPinInput');
  if (phoneInput) phoneInput.value = '8219587657';
  if (pinInput) pinInput.value = '1234';
  if (typeof showToast === 'function') {
    showToast('Super Admin (8219587657) & PIN filled. Signing in...', 'info');
  }
  window.handlePinLogin();
};

window.quickFillStaff = function() {
  if (typeof window.switchToNormalLoginMode === 'function') {
    window.switchToNormalLoginMode();
  }
  const phoneInput = document.getElementById('loginPhoneInput') || document.getElementById('resPhoneInput');
  const pinInput = document.getElementById('loginPinInput') || document.getElementById('resPinInput');
  if (phoneInput) phoneInput.value = '9876543210';
  if (pinInput) pinInput.value = '1234';
  if (typeof showToast === 'function') {
    showToast('👮 Security Guard Ram Singh (Gate 1 · PIN 1234) filled. Signing in...', 'info');
  }
  window.handlePinLogin();
};

window.handlePinLogin = async function() {
  const phoneEl = document.getElementById('loginPhoneInput') || document.getElementById('resPhoneInput');
  const pinEl = document.getElementById('loginPinInput') || document.getElementById('resPinInput');
  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  if (!phone || phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'warning');
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (!pin) {
    showToast('Please enter your 4-to-6 digit Security PIN', 'warning');
    if (pinEl) pinEl.focus();
    return;
  }
  if (pin.length < 4) {
    showToast('Security PIN must be at least 4 digits', 'warning');
    if (pinEl) pinEl.focus();
    return;
  }

  const btn = document.getElementById('loginPinSubmitBtn') || document.getElementById('resPinSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>🔒</span><span>Signing In...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (data.needsPinSetup) {
        showToast('First-time login: Please set your 4-digit PIN below', 'info');
        window.switchToPinSetupMode(phone, data.name || '');
        return;
      }
      if (data.needsRegistration) {
        showToast('No account found for +91 ' + phone + '. If you are an RWA Admin, please check your number or onboard your society below.', 'warning');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔒 Sign In with Security PIN →</span>';
        }
        return;
      }
      showToast(data.error || 'Incorrect Security PIN. Please check and try again, or reset your PIN.', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🔒 Sign In with Security PIN →</span>';
      }
      return;
    }

    // Save session in localStorage and cookies
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
      showToast(`Welcome back, ${data.user.name}! Signed in successfully.`, 'success');

      if (data.user.role === 'PLATFORM_ADMIN' || data.user.phone === '8219587657') {
        Router.go('platform-dashboard');
      } else if (data.user.role === 'STAFF' || data.user.role === 'SECURITY' || data.isStaff) {
        Router.go('staff-dashboard');
      } else if (data.user.role === 'RESIDENT') {
        if (data.isConnected || (data.user.organizationId && data.user.unitId)) {
          Router.go('resident-dashboard');
        } else {
          Router.go('resident-onboard');
        }
      } else {
        Router.go('admin-dashboard');
      }
    }
  } catch (e) {
    console.error('PIN login error:', e);
    showToast('Login failed. Please check network connection.', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔒 Sign In with Security PIN →</span>';
    }
  }
};



// Interactive OTP handlers
window.handleOtpInput = function(el, index) {
  el.value = el.value.replace(/[^0-9]/g, '');
  if (el.value.length >= 1) {
    el.value = el.value.slice(-1);
    el.classList.add('filled');
    const next = document.getElementById(`otp-input-${index + 1}`);
    if (next) {
      next.focus();
      next.select();
    }
  } else {
    el.classList.remove('filled');
  }
};

window.handleOtpKey = function(e, index) {
  if (e.key === 'Backspace') {
    const el = document.getElementById(`otp-input-${index}`);
    if (el && !el.value) {
      const prev = document.getElementById(`otp-input-${index - 1}`);
      if (prev) {
        prev.focus();
        prev.value = '';
        prev.classList.remove('filled');
      }
    }
  } else if (e.key === 'ArrowLeft') {
    const prev = document.getElementById(`otp-input-${index - 1}`);
    if (prev) prev.focus();
  } else if (e.key === 'ArrowRight') {
    const next = document.getElementById(`otp-input-${index + 1}`);
    if (next) next.focus();
  } else if (e.key === 'Enter') {
    handleVerifyOtpClick();
  }
};

window.handleSendOtpClick = async function(channel = 'whatsapp') {
  const el = document.getElementById('loginPhoneInput');
  const phone = el ? el.value.trim().replace(/\s+/g, '') : '';
  if (!phone || phone.length < 10) {
    showToast('Please enter your 10-digit registered mobile number', 'warning');
    return;
  }
  localStorage.setItem('rwa_login_phone', phone);
  localStorage.setItem('rwa_otp_channel', 'whatsapp');

  const btnWa = document.getElementById('loginWhatsAppBtn');
  if (btnWa) {
    btnWa.disabled = true;
    btnWa.innerHTML = 'Sending on WhatsApp...';
  }

  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, action: 'send', channel: 'whatsapp' })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to send OTP', 'warning');
      return;
    }

    if (data.waLink) {
      localStorage.setItem('rwa_otp_walink', data.waLink);
    }

    if (data.devCode) {
      showToast(`💬 WhatsApp OTP for +91 ${phone} is: ${data.devCode}`, 'success');
    } else {
      showToast(`💬 Verification OTP sent to your WhatsApp at +91 ${phone}`, 'success');
    }
    Router.go('auth-otp');
  } catch (e) {
    showToast(`💬 OTP dispatched to WhatsApp: +91 ${phone}`, 'success');
    Router.go('auth-otp');
  } finally {
    if (btnWa) {
      btnWa.disabled = false;
      btnWa.innerHTML = '<span style="font-size:16px;">💬</span> <span>Send OTP on WhatsApp →</span>';
    }
  }
};

window.handleVerifyOtpClick = async function() {
  const digits = [0, 1, 2, 3, 4, 5].map(i => {
    const inp = document.getElementById(`otp-input-${i}`);
    return inp ? inp.value : '';
  }).join('');
  const code = digits || '123456';
  const phone = (localStorage.getItem('rwa_login_phone') || '').replace(/\s+/g, '');

  if (!phone) {
    showToast('Please enter your mobile number first', 'warning');
    Router.go('auth-login');
    return;
  }

  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, action: 'verify' })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Invalid OTP code. Please try again.', 'warning');
      return;
    }

    if (data.token) {
      localStorage.setItem('rwa_token', data.token);
      document.cookie = `rwa_token=${data.token}; path=/; max-age=604800;`;
    }
    if (data.user) {
      localStorage.setItem('rwa_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
      if (data.user.organizationId) {
        localStorage.setItem('rwa_active_org_id', data.user.organizationId);
        document.cookie = `rwa_active_org_id=${data.user.organizationId}; path=/; max-age=604800;`;
      }
      if (data.user.organizationName) {
        localStorage.setItem('rwa_active_org_name', data.user.organizationName);
      }
      showToast(`Namaste, ${data.user.name}! Signed in successfully.`, 'success');
      if (data.user.role === 'PLATFORM_ADMIN' || data.user.phone === '8219587657') {
        Router.go('platform-dashboard');
      } else if (data.user.role === 'RESIDENT') {
        if (data.isConnected || (data.user.organizationId && data.user.unitId)) {
          Router.go('resident-dashboard');
        } else {
          Router.go('resident-onboard');
        }
      } else {
        Router.go('admin-dashboard');
      }
      return;
    }
  } catch (e) {
    console.error('OTP verify error:', e);
    showToast('Failed to verify OTP. Please try again.', 'warning');
  }
};

window.handleOtpPaste = function(e) {
  e.preventDefault();
  const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
  const digits = pasteData.replace(/[^0-9]/g, '').slice(0, 6);
  if (!digits) return;
  for (let i = 0; i < 6; i++) {
    const input = document.getElementById(`otp-input-${i}`);
    if (input) {
      input.value = digits[i] || '';
      if (digits[i]) {
        input.classList.add('filled');
      } else {
        input.classList.remove('filled');
      }
    }
  }
  const targetIndex = Math.min(digits.length, 5);
  const targetInput = document.getElementById(`otp-input-${targetIndex}`);
  if (targetInput) targetInput.focus();
};

window.resendOtp = async function(btn, channel = 'whatsapp') {
  if (btn && btn.dataset && btn.dataset.disabled === 'true') return;
  const phone = (localStorage.getItem('rwa_login_phone') || '').replace(/\s+/g, '');
  if (!phone) {
    showToast('Please enter your mobile number first', 'warning');
    Router.go('auth-login');
    return;
  }

  const prevText = btn.innerHTML;
  btn.innerHTML = 'Sending...';
  btn.dataset.disabled = 'true';

  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, action: 'send', channel: 'whatsapp' })
    });
    const data = await res.json();
    localStorage.setItem('rwa_otp_channel', 'whatsapp');
    if (data.waLink) {
      localStorage.setItem('rwa_otp_walink', data.waLink);
    }

    if (data.devCode) {
      showToast(`💬 New WhatsApp OTP is: ${data.devCode}`, 'success');
    } else {
      showToast(`✓ OTP code resent via WhatsApp to +91 ${phone}`, 'success');
    }

    // Update screen icon and subtitle dynamically
    const chIcon = document.getElementById('otpChannelIcon');
    if (chIcon) chIcon.innerHTML = '💬';
    const chSub = document.getElementById('otpChannelText');
    if (chSub) chSub.innerHTML = `We sent a code via <strong style="color:#16A34A;">WhatsApp</strong> to <strong style="color:var(--text-primary);font-weight:700;">+91 ${phone}</strong>`;

    btn.innerHTML = `✓ Code resent via WhatsApp`;
    btn.style.color = '#16A34A';

    setTimeout(() => {
      let sec = 59;
      btn.style.color = 'var(--text-muted)';
      btn.style.cursor = 'default';
      const interval = setInterval(() => {
        sec--;
        if (sec <= 0) {
          clearInterval(interval);
          btn.innerHTML = '💬 Resend on WhatsApp';
          btn.dataset.disabled = 'false';
          btn.style.cursor = 'pointer';
          btn.style.color = '#16A34A';
        } else {
          btn.innerHTML = `Resend in <strong style="color:var(--text-primary)">0:${sec < 10 ? '0' + sec : sec}</strong>`;
        }
      }, 1000);
    }, 1500);
  } catch (e) {
    btn.innerHTML = prevText;
    btn.dataset.disabled = 'false';
    showToast(`Failed to resend OTP`, 'warning');
  }
};

Screens['auth-otp'] = function() {
  const initialDigits = ['', '', '', '', '', ''];
  const phone = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_login_phone')) || 'your number';
  const orgName = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_active_org_name')) || '';
  const channel = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_otp_channel')) || 'whatsapp';
  const isWhatsApp = channel === 'whatsapp';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const tenDigit = cleanPhone.slice(-10);
  const waLink = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_otp_walink')) || `https://wa.me/91${tenDigit}`;

  return `
    <div class="auth-screen fade-in">
      <div class="auth-left">
        <div style="max-width:400px;width:100%;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:#EFF6FF;border-radius:var(--r-full);border:1px solid #BFDBFE;margin-bottom:28px;">
            <span style="font-size:14px;">🛡️</span>
            <span style="font-size:12px;font-weight:700;color:var(--blue);letter-spacing:0.5px;text-transform:uppercase;">Two-Factor Security</span>
          </div>

          <h2 style="font-size:30px;font-weight:800;color:var(--text-primary);line-height:1.25;margin-bottom:12px;">
            Verify your phone to access your society
          </h2>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.65;margin-bottom:28px;">
            Enter the 6-digit one-time code sent to your registered mobile number for instant secure verification.
          </p>

          <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 20px;box-shadow:var(--shadow-sm);margin-bottom:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Society Status</span>
              <span class="badge badge-green" style="font-size:11px;">Active Society</span>
            </div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${orgName || 'RWA Management Portal'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Live Database · Encrypted Session</div>
            <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid #F1F5F9;font-size:12px;color:var(--text-secondary);">
              <span style="color:var(--green);font-weight:bold;">✓</span>
              <span>Target Phone: <strong style="color:var(--text-primary)">+91 ${phone}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <button class="btn btn-ghost btn-sm" onclick="Router.go('auth-login')" style="padding:6px 12px;font-size:12px;font-weight:600;gap:4px;">
              ← Back to Login
            </button>
            <span style="font-size:12px;color:var(--blue);cursor:pointer;font-weight:600;" onclick="Router.go('auth-login')">
              Change Number
            </span>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <div id="otpChannelIcon" style="width:48px;height:48px;background:rgba(37,211,102,0.12);border:1px solid #86EFAC;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 14px;">
              💬
            </div>
            <h2 style="font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:6px;">Enter 6-Digit OTP</h2>
            <p id="otpChannelText" class="auth-sub" style="margin-bottom:6px;font-size:13px;color:var(--text-secondary);line-height:1.5;">
              We sent a code via <strong style="color:#16A34A;">WhatsApp</strong> to <strong style="color:var(--text-primary);font-weight:700;">+91 ${phone}</strong>
            </p>
            <div style="font-size:11px;color:var(--text-muted);background:var(--bg-elevated);display:inline-block;padding:2px 8px;border-radius:4px;">
              💡 Testing hint: Use OTP <strong>123456</strong>
            </div>
          </div>

          ${isWhatsApp ? `
          <!-- Direct WhatsApp Verification Helper -->
          <div style="margin-bottom:20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--r-md);padding:10px 14px;font-size:12px;color:#166534;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span>💬</span>
              <span>Check your WhatsApp messages</span>
            </div>
            <a href="${waLink}" target="_blank" style="font-weight:700;color:#15803D;text-decoration:underline;">Open WhatsApp Web / App →</a>
          </div>
          ` : ''}

          <div class="otp-boxes" onpaste="handleOtpPaste(event)">
            ${[0, 1, 2, 3, 4, 5].map(i => `
              <input 
                id="otp-input-${i}"
                class="otp-box" 
                type="tel" 
                inputmode="numeric" 
                pattern="[0-9]*"
                maxlength="1" 
                autocomplete="${i === 0 ? 'one-time-code' : 'off'}"
                value=""
                oninput="handleOtpInput(this, ${i})"
                onkeydown="handleOtpKey(event, ${i})"
                aria-label="OTP digit ${i + 1}"
              />
            `).join('')}
          </div>

          <div style="margin-bottom:24px;text-align:center;display:flex;align-items:center;justify-content:center;gap:12px;font-size:12px;">
            <span id="resend-wa-btn" style="color:#16A34A;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:4px;" onclick="resendOtp(this, 'whatsapp')">
              💬 Resend Code on WhatsApp
            </span>
          </div>

          <button class="btn btn-primary w-full" style="justify-content:center;padding:13px;font-size:14px;font-weight:700;border-radius:var(--r-md);box-shadow:var(--shadow-blue);gap:8px;" onclick="handleVerifyOtpClick()">
            <span>Verify & Sign In</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  `;
};

// =============================================
// SOCIETY ONBOARDING & ADMIN SETUP ENGINE
// =============================================

var WIZARD_STEPS = [
  'Admin & Society',
  'Property Structure',
  'Import Members',
  'Bylaws & Rules',
  'Review & Launch'
];

window.getOnboardingState = function() {
  const saved = localStorage.getItem('rwa_onboarding_draft');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Discard legacy mock seeds
      if (parsed?.society?.name === 'Sector 22 Residents Welfare Association' || parsed?.admin?.name === 'Rajesh Kumar') {
        localStorage.removeItem('rwa_onboarding_draft');
      } else if (parsed && parsed.admin && parsed.society && parsed.structure) {
        // If user selected Cooperative Group Housing (CGHS), but blocks are still old default "Tower A" (10 floors), auto-adapt to CGHS
        if (parsed.society.housingType === 'Cooperative Group Housing (CGHS)' && 
            parsed.structure.blocks && 
            parsed.structure.blocks.length > 0 && 
            parsed.structure.blocks[0].name.toLowerCase().includes('tower')) {
          parsed.structure.blocks = [
            { id: 'b1', name: 'Block A', floors: 4, unitsPerFloor: 2, unitPrefix: 'A-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
            { id: 'b2', name: 'Block B', floors: 4, unitsPerFloor: 2, unitPrefix: 'B-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
            { id: 'b3', name: 'Block C', floors: 4, unitsPerFloor: 2, unitPrefix: 'C-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 },
            { id: 'b4', name: 'Block D', floors: 4, unitsPerFloor: 2, unitPrefix: 'D-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 }
          ];
          parsed.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
          parsed.structure.generateShareCert = true;
          parsed.structure.shareCertPrefix = 'SC-';
          window.recomputeStructureUnits(parsed);
          window.saveOnboardingState(parsed);
        }
        return parsed;
      }
    } catch (e) {}
  }

  const defaultState = {
    admin: {
      name: '',
      phone: '',
      email: '',
      pin: '',
      password: '',
      designation: 'President & Admin'
    },
    society: {
      name: '',
      registrationNo: '',
      authority: '',
      housingType: 'Cooperative Group Housing (CGHS)',
      address: '',
      city: 'Chandigarh',
      state: 'Chandigarh (UT)',
      pincode: ''
    },
    structure: {
      mode: 'blocks',
      numberingStyle: 'BLOCK_FLOOR_UNIT',
      generateShareCert: true,
      shareCertPrefix: 'SC-',
      blocks: [
        { id: 'b1', name: 'Block A', floors: 4, unitsPerFloor: 2, unitPrefix: 'A-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
        { id: 'b2', name: 'Block B', floors: 4, unitsPerFloor: 2, unitPrefix: 'B-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
        { id: 'b3', name: 'Block C', floors: 4, unitsPerFloor: 2, unitPrefix: 'C-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 },
        { id: 'b4', name: 'Block D', floors: 4, unitsPerFloor: 2, unitPrefix: 'D-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 }
      ],
      generatedUnits: []
    },
    members: {
      importedRows: [],
      fileName: '',
      stats: { total: 0, owners: 0, tenants: 0, mapped: 0 }
    },
    rules: {
      maintenanceModel: 'FLAT_RATE',
      baseAmount: 3000,
      ratePerSqft: 2.5,
      billingCycle: 'MONTHLY',
      dueDay: 15,
      lateFeeEnabled: true,
      lateFeeAmount: 200,
      noticePeriodDays: 14,
      quorumPercent: 33,
      committeeTermMonths: 12
    }
  };

  window.recomputeStructureUnits(defaultState);
  return defaultState;
};

window.saveOnboardingState = function(state) {
  try {
    localStorage.setItem('rwa_onboarding_draft', JSON.stringify(state));
  } catch (e) {}
};

window.updateWizField = function(section, key, val) {
  const state = window.getOnboardingState();
  if (state[section]) {
    state[section][key] = val;
    window.saveOnboardingState(state);
  }
  // Live map preview update
  if (section === 'society' && key === 'mapLocation') {
    window.refreshWizMapPreview(val);
  }
};

window.refreshWizMapPreview = function(rawVal) {
  const iframe = document.getElementById('wizMapIframe');
  const label  = document.getElementById('wizMapPinLabel');
  if (!iframe) return;

  let lat = null, lng = null;

  // Try plain "lat, lng" format
  const coordMatch = String(rawVal || '').match(/(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  }

  // Try extracting from Google Maps URLs  e.g. @28.6139,77.2090 or ?q=28.6139,77.2090
  if (!lat) {
    const atMatch = String(rawVal || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) { lat = parseFloat(atMatch[1]); lng = parseFloat(atMatch[2]); }
  }
  if (!lat) {
    const qMatch = String(rawVal || '').match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) { lat = parseFloat(qMatch[1]); lng = parseFloat(qMatch[2]); }
  }

  if (lat && lng) {
    const delta = 0.018;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    if (label) label.textContent = `\ud83d\udccd Location pinned \u00b7 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } else {
    // Default Chandigarh region view
    iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=76.5,30.5,77.1,31.0&layer=mapnik';
    if (label) label.textContent = '\ud83d\udccd Default view \u00b7 Enter coordinates or paste a Maps link';
  }
};

// Adapt structure to specific housing layout
window.adaptStructureForHousingType = function(housingType) {
  const state = window.getOnboardingState();
  state.society.housingType = housingType;
  
  if (housingType === 'Cooperative Group Housing (CGHS)') {
    state.structure.blocks = [
      { id: 'b1', name: 'Block A', floors: 4, unitsPerFloor: 2, unitPrefix: 'A-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
      { id: 'b2', name: 'Block B', floors: 4, unitsPerFloor: 2, unitPrefix: 'B-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
      { id: 'b3', name: 'Block C', floors: 4, unitsPerFloor: 2, unitPrefix: 'C-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 },
      { id: 'b4', name: 'Block D', floors: 4, unitsPerFloor: 2, unitPrefix: 'D-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = true;
    state.structure.shareCertPrefix = 'SC-';
  } else if (housingType === 'Plotted / Villa Colony') {
    state.structure.blocks = [
      { id: 'b1', name: 'Phase 1 - North', floors: 1, unitsPerFloor: 20, unitPrefix: 'Plot-', defaultType: 'Villa', areaSqft: 2500 },
      { id: 'b2', name: 'Phase 2 - South', floors: 1, unitsPerFloor: 15, unitPrefix: 'Villa-', defaultType: 'Villa', areaSqft: 3200 }
    ];
    state.structure.numberingStyle = 'BLOCK_SERIAL';
    state.structure.generateShareCert = false;
  } else if (housingType === 'CHB Housing Complex') {
    state.structure.blocks = [
      { id: 'b1', name: 'Pocket A (Cat-I)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P1-', defaultType: 'Category I', areaSqft: 1450 },
      { id: 'b2', name: 'Pocket B (Cat-II)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P2-', defaultType: 'Category II', areaSqft: 1100 },
      { id: 'b3', name: 'Pocket C (Cat-III)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P3-', defaultType: 'Category III', areaSqft: 850 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = false;
  } else {
    // Multi-Tower High-Rise
    state.structure.blocks = [
      { id: 'b1', name: 'Tower A', floors: 10, unitsPerFloor: 4, unitPrefix: 'A-', defaultType: '3BHK', areaSqft: 1950 },
      { id: 'b2', name: 'Tower B', floors: 10, unitsPerFloor: 4, unitPrefix: 'B-', defaultType: '3BHK', areaSqft: 1950 },
      { id: 'b3', name: 'Tower C', floors: 8, unitsPerFloor: 4, unitPrefix: 'C-', defaultType: '2BHK', areaSqft: 1450 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = false;
  }
  
  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
};

// Recompute units based on blocks, floors, numbering convention and share certs
window.recomputeStructureUnits = function(state) {
  const units = [];
  const isCGHS = (state.society.housingType || '').includes('Cooperative') || (state.society.housingType || '').includes('CGHS');
  const numberingStyle = state.structure.numberingStyle || 'BLOCK_FLOOR_UNIT';
  const generateShareCert = state.structure.generateShareCert !== false;
  const sharePrefix = state.structure.shareCertPrefix || 'SC-';

  let globalSerial = 1;

  (state.structure.blocks || []).forEach(b => {
    const floors = parseInt(b.floors) || 1;
    const perFloor = parseInt(b.unitsPerFloor) || 1;
    const prefix = b.unitPrefix !== undefined ? b.unitPrefix : `${b.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}-`;
    const startFromGround = b.startFromGround || false;

    let blockSerial = 1;
    for (let f = 1; f <= floors; f++) {
      for (let u = 1; u <= perFloor; u++) {
        let uNum = '';
        if (numberingStyle === 'FLOOR_UNIT') {
          if (startFromGround && f === 1) {
            uNum = `G-${u < 10 ? '0' + u : u}`;
          } else {
            const actualFloor = startFromGround ? f - 1 : f;
            uNum = `${actualFloor}${u < 10 ? '0' + u : u}`;
          }
        } else if (numberingStyle === 'GROUND_BASED') {
          if (f === 1) {
            uNum = `${prefix}G${u < 10 ? '0' + u : u}`;
          } else {
            uNum = `${prefix}${f - 1}${u < 10 ? '0' + u : u}`;
          }
        } else if (numberingStyle === 'BLOCK_SERIAL') {
          uNum = `${prefix}${blockSerial}`;
        } else if (numberingStyle === 'SEQUENTIAL') {
          uNum = `Flat ${globalSerial}`;
        } else {
          // Default: BLOCK_FLOOR_UNIT (e.g. A-101, A-102...)
          uNum = `${prefix}${f}${u < 10 ? '0' + u : u}`;
        }

        const unitObj = {
          unitNumber: uNum,
          blockName: b.name,
          floor: f,
          floorLabel: (startFromGround && f === 1) ? 'Ground' : `Floor ${startFromGround ? f - 1 : f}`,
          unitType: b.defaultType || (isCGHS ? 'Category A (3 BHK)' : '2BHK'),
          areaSqft: b.areaSqft || 1450,
          serial: globalSerial
        };

        if (isCGHS && generateShareCert) {
          unitObj.shareCertificateNo = `${sharePrefix}${String(globalSerial).padStart(3, '0')}`;
        }

        units.push(unitObj);
        blockSerial++;
        globalSerial++;
      }
    }
  });

  state.structure.generatedUnits = units;
  return units;
};

// Add block or wing
window.addStructureBlock = function() {
  const state = window.getOnboardingState();
  const isCGHS = (state.society.housingType || '').includes('CGHS') || (state.society.housingType || '').includes('Cooperative');
  const nextLetter = String.fromCharCode(65 + state.structure.blocks.length);

  const newBlock = {
    id: 'b_' + Date.now(),
    name: isCGHS ? `Block ${nextLetter}` : `Tower ${nextLetter}`,
    floors: isCGHS ? 4 : 6,
    unitsPerFloor: isCGHS ? 2 : 4,
    unitPrefix: `${nextLetter}-`,
    defaultType: isCGHS ? 'Category A (3 BHK)' : '2BHK',
    areaSqft: isCGHS ? 1850 : 1450
  };

  state.structure.blocks.push(newBlock);
  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
  showToast(`Added ${newBlock.name}!`, 'info');
  Router.go('onboarding-2');
};

window.removeStructureBlock = function(idx) {
  const state = window.getOnboardingState();
  if (state.structure.blocks.length <= 1) {
    showToast('Society must have at least 1 block / wing', 'error');
    return;
  }
  const removed = state.structure.blocks.splice(idx, 1);
  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
  showToast(`Removed ${removed[0]?.name}`, 'info');
  Router.go('onboarding-2');
};

window.updateBlockField = function(idx, field, val) {
  const state = window.getOnboardingState();
  if (state.structure.blocks[idx]) {
    state.structure.blocks[idx][field] = val;
    window.recomputeStructureUnits(state);
    window.saveOnboardingState(state);
  }
};

window.applyStructurePreset = function(preset, doNavigate = true) {
  const state = window.getOnboardingState();

  if (preset === 'cghs-lowrise') {
    state.society.housingType = 'Cooperative Group Housing (CGHS)';
    state.structure.blocks = [
      { id: 'b1', name: 'Block A', floors: 4, unitsPerFloor: 2, unitPrefix: 'A-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
      { id: 'b2', name: 'Block B', floors: 4, unitsPerFloor: 2, unitPrefix: 'B-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
      { id: 'b3', name: 'Block C', floors: 4, unitsPerFloor: 2, unitPrefix: 'C-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 },
      { id: 'b4', name: 'Block D', floors: 4, unitsPerFloor: 2, unitPrefix: 'D-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = true;
    state.structure.shareCertPrefix = 'SC-';
  } else if (preset === 'cghs-midrise') {
    state.society.housingType = 'Cooperative Group Housing (CGHS)';
    state.structure.blocks = [
      { id: 'b1', name: 'Tower 1', floors: 8, unitsPerFloor: 4, unitPrefix: 'T1-', defaultType: 'Category A (3 BHK)', areaSqft: 1750 },
      { id: 'b2', name: 'Tower 2', floors: 8, unitsPerFloor: 4, unitPrefix: 'T2-', defaultType: 'Category A (3 BHK)', areaSqft: 1750 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = true;
    state.structure.shareCertPrefix = 'SC-';
  } else if (preset === 'cghs-categories') {
    state.society.housingType = 'Cooperative Group Housing (CGHS)';
    state.structure.blocks = [
      { id: 'b1', name: 'Wing A (HIG)', floors: 6, unitsPerFloor: 4, unitPrefix: 'HIG-', defaultType: 'Category A (3 BHK)', areaSqft: 1950 },
      { id: 'b2', name: 'Wing B (MIG)', floors: 6, unitsPerFloor: 4, unitPrefix: 'MIG-', defaultType: 'Category B (2 BHK)', areaSqft: 1450 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = true;
    state.structure.shareCertPrefix = 'SC-';
  } else if (preset === 'cghs-compact') {
    state.society.housingType = 'Cooperative Group Housing (CGHS)';
    state.structure.blocks = [
      { id: 'b1', name: 'Wing 1', floors: 4, unitsPerFloor: 2, unitPrefix: 'W1-', defaultType: 'Category A (3 BHK)', areaSqft: 1850 },
      { id: 'b2', name: 'Wing 2', floors: 4, unitsPerFloor: 2, unitPrefix: 'W2-', defaultType: 'Category B (2 BHK)', areaSqft: 1350 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = true;
    state.structure.shareCertPrefix = 'SC-';
  } else if (preset === 'high-rise') {
    state.structure.blocks = [
      { id: 'b1', name: 'Tower A', floors: 10, unitsPerFloor: 4, unitPrefix: 'A-', defaultType: '3BHK', areaSqft: 1950 },
      { id: 'b2', name: 'Tower B', floors: 10, unitsPerFloor: 4, unitPrefix: 'B-', defaultType: '3BHK', areaSqft: 1950 },
      { id: 'b3', name: 'Tower C', floors: 8, unitsPerFloor: 4, unitPrefix: 'C-', defaultType: '2BHK', areaSqft: 1450 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = false;
  } else if (preset === 'mid-rise') {
    state.structure.blocks = [
      { id: 'b1', name: 'Wing 1', floors: 4, unitsPerFloor: 4, unitPrefix: 'W1-', defaultType: '2BHK', areaSqft: 1350 },
      { id: 'b2', name: 'Wing 2', floors: 4, unitsPerFloor: 4, unitPrefix: 'W2-', defaultType: '2BHK', areaSqft: 1350 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = false;
  } else if (preset === 'plots') {
    state.structure.blocks = [
      { id: 'b1', name: 'Phase 1 - North', floors: 1, unitsPerFloor: 20, unitPrefix: 'Plot-', defaultType: 'Villa', areaSqft: 2500 },
      { id: 'b2', name: 'Phase 2 - South', floors: 1, unitsPerFloor: 15, unitPrefix: 'Villa-', defaultType: 'Villa', areaSqft: 3200 }
    ];
    state.structure.numberingStyle = 'BLOCK_SERIAL';
    state.structure.generateShareCert = false;
  } else if (preset === 'chb-pockets') {
    state.structure.blocks = [
      { id: 'b1', name: 'Pocket A (Cat-I)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P1-', defaultType: 'Category I', areaSqft: 1450 },
      { id: 'b2', name: 'Pocket B (Cat-II)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P2-', defaultType: 'Category II', areaSqft: 1100 },
      { id: 'b3', name: 'Pocket C (Cat-III)', floors: 4, unitsPerFloor: 4, unitPrefix: 'P3-', defaultType: 'Category III', areaSqft: 850 }
    ];
    state.structure.numberingStyle = 'BLOCK_FLOOR_UNIT';
    state.structure.generateShareCert = false;
  }

  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
  
  if (doNavigate) {
    showToast(`Preset "${preset}" applied!`, 'success');
    Router.go('onboarding-2');
  }
};

// Dropdown with Custom Input Handlers
window.handleHousingTypeSelect = function(val) {
  const wrap = document.getElementById('customHousingTypeWrap');
  const input = document.getElementById('wizCustomHousingType');
  const helper = document.getElementById('housingTypeHelper');

  if (val === '__custom__') {
    if (wrap) wrap.style.display = 'block';
    if (input) {
      input.focus();
      if (input.value.trim()) {
        window.updateWizField('society', 'housingType', input.value.trim());
      }
    }
  } else {
    if (wrap) wrap.style.display = 'none';
    window.updateWizField('society', 'housingType', val);
    
    // Automatically adapt structure layout draft if switching housing type
    window.adaptStructureForHousingType(val);
  }

  // Update dynamic helper callout card in Step 1
  if (helper) {
    if (val === 'Cooperative Group Housing (CGHS)') {
      helper.style.display = 'block';
      helper.innerHTML = `
        <div style="font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:6px;">
          <span>🏛️</span>
          <span>Cooperative Group Housing (CGHS) Configured</span>
        </div>
        <div style="line-height:1.5;color:#15803D;">Property structure in Step 2 will automatically configure multi-block wings (Block A, B, C, D), cooperative flat categories (Cat-A HIG, Cat-B MIG), floor distributions, and share certificate folios.</div>
      `;
    } else if (val === 'Plotted / Villa Colony') {
      helper.style.display = 'block';
      helper.innerHTML = `
        <div style="font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:6px;">
          <span>🏘️</span>
          <span>Plotted / Villa Colony Configured</span>
        </div>
        <div style="line-height:1.5;color:#15803D;">Property structure in Step 2 will configure plotted phases, sectors, and individual plot numbers with yardage.</div>
      `;
    } else {
      helper.style.display = 'none';
    }
  }
};

window.handleCustomHousingTypeInput = function(val) {
  window.updateWizField('society', 'housingType', val.trim() || 'Custom Layout');
};

window.cancelCustomHousingType = function() {
  const select = document.getElementById('wizHousingType');
  const wrap = document.getElementById('customHousingTypeWrap');
  if (select) select.value = 'Cooperative Group Housing (CGHS)';
  if (wrap) wrap.style.display = 'none';
  window.updateWizField('society', 'housingType', 'Cooperative Group Housing (CGHS)');
  window.adaptStructureForHousingType('Cooperative Group Housing (CGHS)');
};

window.handleCitySelect = function(val) {
  const wrap = document.getElementById('customCityWrap');
  const input = document.getElementById('wizCustomCity');
  if (val === '__custom__') {
    if (wrap) wrap.style.display = 'block';
    if (input) {
      input.focus();
      if (input.value.trim()) {
        window.updateWizField('society', 'city', input.value.trim());
      }
    }
  } else {
    if (wrap) wrap.style.display = 'none';
    window.updateWizField('society', 'city', val);
  }
};

window.handleCustomCityInput = function(val) {
  window.updateWizField('society', 'city', val.trim() || 'Custom City');
};

window.cancelCustomCity = function() {
  const select = document.getElementById('wizCity');
  const wrap = document.getElementById('customCityWrap');
  if (select) select.value = 'Chandigarh';
  if (wrap) wrap.style.display = 'none';
  window.updateWizField('society', 'city', 'Chandigarh');
};

window.handleAdminRoleSelect = function(val) {
  const wrap = document.getElementById('customAdminRoleWrap');
  const input = document.getElementById('wizCustomAdminRole');
  if (val === '__custom__') {
    if (wrap) wrap.style.display = 'block';
    if (input) {
      input.focus();
      if (input.value.trim()) {
        window.updateWizField('admin', 'designation', input.value.trim());
      }
    }
  } else {
    if (wrap) wrap.style.display = 'none';
    window.updateWizField('admin', 'designation', val);
  }
};

window.handleCustomAdminRoleInput = function(val) {
  window.updateWizField('admin', 'designation', val.trim() || 'Custom Admin Role');
};

window.cancelCustomAdminRole = function() {
  const select = document.getElementById('wizAdminRole');
  const wrap = document.getElementById('customAdminRoleWrap');
  if (select) select.value = 'President & Admin';
  if (wrap) wrap.style.display = 'none';
  window.updateWizField('admin', 'designation', 'President & Admin');
};

window.handleUnitTypeSelect = function(idx, val) {
  if (val === '__custom__') {
    const custom = prompt('Enter custom unit type (e.g. Category A+, Penthouse, Duplex, Studio, SCO, Commercial):', 'Category A');
    if (custom && custom.trim()) {
      window.updateBlockField(idx, 'defaultType', custom.trim());
      Router.go('onboarding-2');
    } else {
      Router.go('onboarding-2');
    }
  } else {
    window.updateBlockField(idx, 'defaultType', val);
  }
};

// Excel Member Importer & Manual Entry helpers
window.downloadSampleMemberTemplate = function() {
  const state = window.getOnboardingState();
  const units = state.structure.generatedUnits || [];
  let csv = 'Unit_Number,Member_Name,Mobile_Number,Email,Ownership_Type,Floor,Area_Sqft,Share_Certificate_No\n';
  
  if (units.length > 0) {
    // Generate clean pre-mapped template with user's actual configured society units
    const samplePeople = [
      { name: 'Vikram Sharma', phone: '9814012345', email: 'vikram.s@gmail.com', type: 'Owner' },
      { name: 'Sunita Mehra', phone: '9872054321', email: 'sunita.mehra@yahoo.co.in', type: 'Owner' },
      { name: 'Harpreet Singh', phone: '9888019283', email: 'h.singh@chd.in', type: 'Tenant' },
    ];
    units.forEach((u, i) => {
      if (i < 3) {
        const s = samplePeople[i];
        csv += `${u.unitNumber},"${s.name}","${s.phone}","${s.email}","${s.type}",${u.floor},${u.areaSqft},"${u.shareCertificateNo || 'SC-' + String(i+1).padStart(3, '0')}"\n`;
      } else {
        csv += `${u.unitNumber},"","","","Owner",${u.floor},${u.areaSqft},"${u.shareCertificateNo || ''}"\n`;
      }
    });
  } else {
    csv += 'A-101,"Vikram Sharma","9814012345","vikram.s@gmail.com","Owner",1,1850,"SC-001"\n';
    csv += 'A-102,"Sunita Mehra","9872054321","sunita.m@yahoo.co.in","Owner",1,1850,"SC-002"\n';
    csv += 'B-101,"Harpreet Singh","9888019283","h.singh@chd.in","Tenant",1,1350,"SC-003"\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RWA_Member_Directory_Template_${(state.society.name || 'Society').replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 Clean Excel/CSV template downloaded with your configured units!', 'success');
};

// Switch between Upload Spreadsheet and Add Member Manually tabs
window._memberInputTab = window._memberInputTab || 'upload';
window.setMemberInputTab = function(tab) {
  window._memberInputTab = tab;
  Router.go('onboarding-3');
};

// Manual Member Addition
window.addManualMember = function() {
  const unitEl = document.getElementById('manualMemberUnit');
  const customUnitEl = document.getElementById('manualMemberCustomUnit');
  const nameEl = document.getElementById('manualMemberName');
  const phoneEl = document.getElementById('manualMemberPhone');
  const emailEl = document.getElementById('manualMemberEmail');
  const typeEl = document.getElementById('manualMemberType');
  const shareCertEl = document.getElementById('manualMemberShareCert');

  let unit = unitEl ? unitEl.value.trim() : '';
  if (unit === '__custom__' && customUnitEl) {
    unit = customUnitEl.value.trim();
  }
  const name = nameEl ? nameEl.value.trim() : '';
  let phone = phoneEl ? phoneEl.value.trim().replace(/\D/g, '') : '';
  const email = emailEl ? emailEl.value.trim() : '';
  const type = typeEl ? typeEl.value : 'OWNER';
  const shareCert = shareCertEl ? shareCertEl.value.trim() : '';

  if (!unit) {
    showToast('Please select or specify a Flat / Unit #', 'warning');
    if (unitEl) unitEl.focus();
    return;
  }
  if (!name || name.length < 2) {
    showToast('Please enter Member Full Name', 'warning');
    if (nameEl) nameEl.focus();
    return;
  }
  if (phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'warning');
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (phone.length === 12 && phone.startsWith('91')) {
    phone = phone.slice(2);
  }

  const state = window.getOnboardingState();
  if (!state.members.importedRows) state.members.importedRows = [];

  // Check if member already assigned to this unit
  const existingIndex = state.members.importedRows.findIndex(
    m => m.unit.toLowerCase() === unit.toLowerCase() && m.type === type
  );
  if (existingIndex >= 0) {
    if (!confirm(`Unit ${unit} already has an assigned ${type === 'OWNER' ? 'owner' : 'tenant'} (${state.members.importedRows[existingIndex].name}). Add as additional resident?`)) {
      return;
    }
  }

  state.members.importedRows.push({
    unit,
    name,
    phone,
    email: email || '',
    type,
    shareCertificateNo: shareCert || '',
    status: 'VALID',
    source: 'MANUAL'
  });

  state.members.stats = {
    total: state.members.importedRows.length,
    owners: state.members.importedRows.filter(r => r.type === 'OWNER').length,
    tenants: state.members.importedRows.filter(r => r.type === 'TENANT').length,
    mapped: state.members.importedRows.length
  };

  window.saveOnboardingState(state);
  showToast(`✓ Added ${name} (${unit}) to society roster!`, 'success');

  // Clear inputs for next entry
  if (nameEl) nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
  if (emailEl) emailEl.value = '';
  if (shareCertEl) shareCertEl.value = '';

  Router.go('onboarding-3');
};

window.handleManualMemberUnitChange = function(val) {
  const customWrap = document.getElementById('manualMemberCustomUnitWrap');
  if (customWrap) {
    customWrap.style.display = val === '__custom__' ? 'block' : 'none';
  }
  const state = window.getOnboardingState();
  const unitObj = (state.structure.generatedUnits || []).find(u => u.unitNumber === val);
  const shareEl = document.getElementById('manualMemberShareCert');
  if (unitObj && shareEl && unitObj.shareCertificateNo) {
    shareEl.value = unitObj.shareCertificateNo;
  }
};

window.clearImportedMembers = function() {
  if (confirm('Are you sure you want to remove all members from the roster preview?')) {
    const state = window.getOnboardingState();
    state.members.importedRows = [];
    state.members.fileName = '';
    state.members.stats = { total: 0, owners: 0, tenants: 0, mapped: 0 };
    window.saveOnboardingState(state);
    showToast('Member roster cleared', 'info');
    Router.go('onboarding-3');
  }
};

window.handleNumberingStyleChange = function(val) {
  const state = window.getOnboardingState();
  state.structure.numberingStyle = val;
  window.saveOnboardingState(state);
  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
  Router.go('onboarding-2');
};

window.handleShareCertToggle = function(checked) {
  const state = window.getOnboardingState();
  state.structure.generateShareCert = checked;
  window.saveOnboardingState(state);
  window.recomputeStructureUnits(state);
  window.saveOnboardingState(state);
  Router.go('onboarding-2');
};

window.handleMaintenanceBaseRateChange = function(val) {
  const state = window.getOnboardingState();
  const field = state.rules.maintenanceModel === 'PER_SQFT' ? 'ratePerSqft' : 'baseAmount';
  window.updateWizField('rules', field, parseFloat(val) || 0);
};

window.handleMemberFileSelect = function(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      showToast('⚠️ File appears empty or missing rows', 'error');
      return;
    }

    const headers = lines[0].split(/,|\t/).map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    let uIdx = headers.findIndex(h => h.includes('unit') || h.includes('flat') || h.includes('house'));
    let nIdx = headers.findIndex(h => h.includes('name') || h.includes('member') || h.includes('resident') || h.includes('owner'));
    let pIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
    let eIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    let tIdx = headers.findIndex(h => h.includes('type') || h.includes('ownership') || h.includes('occupan'));

    if (uIdx === -1) uIdx = 0;
    if (nIdx === -1) nIdx = 1;
    if (pIdx === -1) pIdx = 2;
    if (eIdx === -1) eIdx = 3;
    if (tIdx === -1) tIdx = 4;

    const state = window.getOnboardingState();
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2 && (parts[uIdx] || parts[nIdx])) {
        const uVal = parts[uIdx] || `Unit-${i}`;
        const nVal = parts[nIdx] || `Resident ${i}`;
        const pVal = parts[pIdx] || '';
        const eVal = parts[eIdx] || '';
        const typeRaw = (parts[tIdx] || 'OWNER').toUpperCase();
        const isTenant = typeRaw.includes('TENANT') || typeRaw.includes('RENT');
        rows.push({
          unit: uVal,
          name: nVal,
          phone: pVal,
          email: eVal,
          type: isTenant ? 'TENANT' : 'OWNER',
          status: 'VALID'
        });
      }
    }

    state.members.importedRows = rows;
    state.members.fileName = file.name;
    state.members.stats = {
      total: rows.length,
      owners: rows.filter(r => r.type === 'OWNER').length,
      tenants: rows.filter(r => r.type === 'TENANT').length,
      mapped: rows.length
    };
    window.saveOnboardingState(state);
    showToast(`✓ Successfully imported ${rows.length} members from "${file.name}"!`, 'success');
    Router.go('onboarding-3');
  };
  reader.readAsText(file);
};

window.removeImportedMember = function(idx) {
  const state = window.getOnboardingState();
  if (state.members.importedRows && state.members.importedRows[idx]) {
    state.members.importedRows.splice(idx, 1);
    state.members.stats.total = state.members.importedRows.length;
    state.members.stats.owners = state.members.importedRows.filter(r => r.type === 'OWNER').length;
    state.members.stats.tenants = state.members.importedRows.filter(r => r.type === 'TENANT').length;
    window.saveOnboardingState(state);
    Router.go('onboarding-3');
  }
};

window.detectOnboardingGps = function(e) {
  if (e) e.preventDefault();
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'warning');
    return;
  }
  const btn = e?.currentTarget;
  if (btn) btn.textContent = '⏳ Detecting...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const mapInput = document.getElementById('wizMapLocation');
      if (mapInput) {
        mapInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
        if (window.updateWizField) {
          window.updateWizField('society', 'mapLocation', mapInput.value);
        }
        if (window.refreshWizMapPreview) {
          window.refreshWizMapPreview(`${lat},${lng}`);
        }
      }
      if (btn) btn.textContent = '✓ GPS Set';
      showToast(`🎯 GPS Location detected: ${lat}, ${lng}`, 'success');
    },
    (err) => {
      if (btn) btn.textContent = '🎯 Detect GPS';
      showToast('Could not access GPS. You can enter or paste Google Maps link manually.', 'warning');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
};

window.submitSocietyOnboarding = async function() {
  const state = window.getOnboardingState();

  if (!state.society.name || !state.admin.name || !state.admin.phone) {
    showToast('Please complete Society Name, Admin Full Name, and Admin Mobile on Step 1.', 'warning');
    Router.go('onboarding-1');
    return;
  }

  const btn1 = document.getElementById('launchCardBtn');
  const btn2 = document.getElementById('launchFooterBtn');
  const btn3 = document.getElementById('launchBtn');
  [btn1, btn2, btn3].forEach(b => {
    if (b) {
      b.disabled = true;
      b.innerHTML = `<span class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span> Launching Society in Database...`;
    }
  });

  try {
    const res = await fetch('/api/auth/register-society', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin: state.admin,
        society: state.society,
        structure: state.structure,
        members: state.members,
        rules: state.rules
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to register society in database', 'warning');
      [btn1, btn2, btn3].forEach(b => {
        if (b) {
          b.disabled = false;
          b.innerHTML = `🚀 Launch Society & Go to Admin Dashboard`;
        }
      });
      return;
    }

    // Save actual DB session token and active organization context
    if (data.token) {
      localStorage.setItem('rwa_token', data.token);
      document.cookie = `rwa_token=${data.token}; path=/; max-age=604800;`;
    }
    if (data.organization) {
      localStorage.setItem('rwa_active_org_id', data.organization.id);
      localStorage.setItem('rwa_active_org_name', data.organization.name);
      document.cookie = `rwa_active_org_id=${data.organization.id}; path=/; max-age=604800;`;
    }
    if (data.user) {
      localStorage.setItem('rwa_user', JSON.stringify(data.user));
      localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
    }

    localStorage.removeItem('rwa_onboarding_draft');

    showToast(`🎉 Congratulations! ${state.society.name} has been launched successfully in the database!`, 'success');
    setTimeout(() => {
      Router.go('admin-dashboard');
    }, 600);
  } catch(e) {
    console.error('Registration backend call error:', e);
    showToast('Failed to register society. Please check database connection.', 'warning');
    [btn1, btn2, btn3].forEach(b => {
      if (b) {
        b.disabled = false;
        b.innerHTML = `🚀 Launch Society & Go to Admin Dashboard`;
      }
    });
  }
};

// Wizard Step Progression with Validation
window.wizardNextStep = function(currentStep) {
  const state = window.getOnboardingState();
  if (currentStep === 1) {
    if (!state.society.name || !state.society.name.trim()) {
      showToast('Please enter the Society / RWA Name', 'warning');
      const el = document.getElementById('wizSocName');
      if (el) el.focus();
      return;
    }
    if (!state.admin.name || !state.admin.name.trim()) {
      showToast('Please enter Admin Full Name', 'warning');
      const el = document.getElementById('wizAdminName');
      if (el) el.focus();
      return;
    }
    const phone = (state.admin.phone || '').replace(/\D/g, '');
    if (phone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number for Admin Sign-In', 'warning');
      const el = document.getElementById('wizAdminPhone');
      if (el) el.focus();
      return;
    }
    const pin = (state.admin.pin || '').trim();
    if (!pin || pin.length < 4) {
      showToast('Please choose a 4-to-6 digit Security PIN', 'warning');
      const el = document.getElementById('wizAdminPin');
      if (el) el.focus();
      return;
    }
    const confirmPinEl = document.getElementById('wizAdminConfirmPin');
    const confirmPin = confirmPinEl ? confirmPinEl.value.trim() : pin;
    if (confirmPin && pin !== confirmPin) {
      showToast('Security PIN and Confirm PIN do not match', 'warning');
      if (confirmPinEl) confirmPinEl.focus();
      return;
    }
  } else if (currentStep === 2) {
    if (!state.structure.blocks || state.structure.blocks.length === 0 || !state.structure.generatedUnits || state.structure.generatedUnits.length === 0) {
      showToast('Please configure at least 1 block/wing with units', 'warning');
      return;
    }
  }
  Router.go('onboarding-' + (currentStep + 1));
};

window.resetOnboardingDraft = function() {
  if (confirm('Start fresh with a clean society registration form?')) {
    localStorage.removeItem('rwa_onboarding_draft');
    showToast('Onboarding form reset to blank', 'info');
    Router.go('onboarding-1');
  }
};

// Wizard Master Layout
function wizardLayout(step, content) {
  const steps = WIZARD_STEPS;
  const progressPercent = Math.round((step / steps.length) * 100);
  const stepIcons = ['🏛️', '🏢', '👥', '⚖️', '🚀'];

  return `
    <div class="wizard-screen fade-in" id="cutoraWizardContainer">
      <!-- Motion: 4s seamless upward glide video loop like Auth page -->
      <video
        id="wizHeroVideo"
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

      <!-- Warm Cinematic Overlay matching Auth page -->
      <div class="cutora-overlay" style="z-index: 2; pointer-events: none; background: radial-gradient(circle at 50% 30%, rgba(20, 10, 0, 0.42) 0%, rgba(10, 5, 0, 0.72) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, transparent 220px, rgba(20, 10, 0, 0.52) 100%);"></div>

      <div class="wizard-header">
        <div class="wizard-header-main">
          <div class="wizard-brand">
            <div class="wizard-brand-icon">🏛️</div>
            <div>
              <div class="wizard-brand-title">
                <span>Cutora</span>
                <span class="wizard-brand-badge">Launch Studio</span>
              </div>
              <div class="wizard-brand-sub">
                <span>Society Onboarding</span>
                <span>·</span>
                <span style="color:#B45309;font-weight:700;">${progressPercent}% Complete</span>
              </div>
            </div>
          </div>

          <div class="wizard-steps">
            ${steps.map((s, i) => {
              const num = i + 1;
              const done   = num < step;
              const active = num === step;
              return `
                <div class="wizard-step ${done?'done':''} ${active?'active':''}" onclick="if(${done} || ${active}){ Router.go('onboarding-${num}'); } else { window.wizardNextStep(${step}); }" title="Go to Step ${num}: ${s}">
                  <div class="wizard-step-dot">${done ? '✓' : stepIcons[i]}</div>
                  <div class="wizard-step-label">${s}</div>
                </div>
                ${i < steps.length - 1 ? `<div class="wizard-step-line ${done?'done':''}"></div>` : ''}
              `;
            }).join('')}
          </div>

          <div class="wizard-header-actions">
            <button class="btn btn-ghost btn-sm wiz-header-btn" onclick="resetOnboardingDraft()" title="Clear form & start over">
              <span class="wiz-btn-icon">🔄</span>
              <span class="wiz-btn-label">Reset</span>
            </button>
            <button class="btn btn-ghost btn-sm wiz-header-btn" onclick="Router.go('auth-login')" title="Exit onboarding">
              <span class="wiz-btn-icon">✕</span>
              <span class="wiz-btn-label">Exit</span>
            </button>
          </div>
        </div>

        <!-- Mobile Step Subbar -->
        <div class="wizard-mobile-subbar">
          <div class="wizard-mobile-step-pill">
            <span style="font-size:13px;">${stepIcons[step-1]}</span>
            <span>Step ${step}/5: <strong>${steps[step-1]}</strong></span>
          </div>
          <div class="wizard-mobile-progress-badge">${progressPercent}%</div>
        </div>
      </div>

      <div class="wizard-progress-bar-mobile">
        <div class="wizard-progress-fill" style="width:${progressPercent}%;"></div>
      </div>

      <div class="wizard-body">
        <div class="wizard-card slide-up">${content}</div>
      </div>

      <div class="wizard-footer">
        <div class="wizard-footer-step-text" style="display:flex;align-items:center;gap:8px;">
          <span class="badge" style="background:rgba(245,154,8,0.12);color:#B45309;border:1px solid rgba(245,154,8,0.3);font-size:11px;font-weight:700;">Step ${step} of ${steps.length}</span>
          <span style="font-weight:700;color:var(--text-primary);">${steps[step-1]}</span>
        </div>
        <div class="wizard-footer-actions">
          ${step > 1 ? `<button class="btn btn-secondary" onclick="Router.go('onboarding-${step-1}')" style="padding:10px 18px;font-weight:600;">← Back</button>` : '<div></div>'}
          ${step < steps.length ? `
            <button class="btn btn-primary" onclick="window.wizardNextStep(${step})" style="padding:10px 24px;font-weight:700;gap:8px;background:linear-gradient(135deg, #111827 0%, #1F2937 100%);color:#F59A08;border:1px solid rgba(245,154,8,0.4);box-shadow:0 4px 14px rgba(0,0,0,0.15);">
              <span>Continue to Step ${step+1}</span>
              <span>→</span>
            </button>
          ` : `
            <button id="launchFooterBtn" class="btn btn-primary" onclick="submitSocietyOnboarding()" style="font-weight:800;padding:11px 26px;gap:8px;background:linear-gradient(135deg, #111827 0%, #1F2937 100%);color:#F59A08;border:1px solid rgba(245,154,8,0.45);box-shadow:0 6px 18px rgba(0,0,0,0.18);">
              <span class="btn-text-desktop">🚀 Launch Society & Go to Admin Dashboard</span>
              <span class="btn-text-mobile">🚀 Launch Society</span>
            </button>
          `}
        </div>
      </div>
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" style="display:none;" onload="window.initCutoraAuth && window.initCutoraAuth()" />
    </div>
  `;
}

// -----------------------------------------------------------------
// Step 1: Admin & Society Registration
// -----------------------------------------------------------------
Screens['onboarding-1'] = function() {
  const state = window.getOnboardingState();

  const standardHousingTypes = [
    'Cooperative Group Housing (CGHS)',
    'Multi-Tower Apartments',
    'Plotted / Villa Colony',
    'CHB Housing Complex',
    'Builder Floors',
    'Commercial / Mixed-Use Complex'
  ];
  const isCustomHousing = state.society.housingType && !standardHousingTypes.includes(state.society.housingType);

  const standardCities = [
    'Chandigarh',
    'Mohali',
    'Panchkula',
    'New Delhi',
    'Zirakpur',
    'Kharar'
  ];
  const isCustomCity = state.society.city && !standardCities.includes(state.society.city);

  const standardRoles = [
    'President & Admin',
    'General Secretary',
    'Treasurer',
    'Vice President',
    'Joint Secretary',
    'Managing Director',
    'Executive Committee Member'
  ];
  const isCustomRole = state.admin.designation && !standardRoles.includes(state.admin.designation);
  const isCGHS = (state.society.housingType || '').includes('CGHS') || (state.society.housingType || '').includes('Cooperative');

  return wizardLayout(1, `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="margin-bottom:4px;">Society & Admin Profile</h2>
        <p class="wiz-desc" style="margin-bottom:0;">Register your official RWA society details and configure the primary administrator account with bank-grade PIN security.</p>
      </div>
      <div class="badge" style="background:rgba(245,154,8,0.12);color:#B45309;border:1px solid rgba(245,154,8,0.3);font-size:12px;padding:6px 12px;font-weight:800;">✨ Step 1 of 5 · Society & Security Setup</div>
    </div>

    <div class="onboarding-grid-2" style="margin-top:16px;">
      <!-- Society Information Column -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;">
          <div style="width:34px;height:34px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">🏛️</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">Society Information</div>
            <div style="font-size:11px;color:var(--text-muted);">Legal registration and jurisdiction</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Society / RWA Name *</label>
          <input class="form-input" type="text" id="wizSocName" value="${state.society.name}" 
            placeholder="e.g. Greenwood Heights Residents Welfare Association" 
            oninput="updateWizField('society', 'name', this.value)"
            onchange="updateWizField('society', 'name', this.value)" style="width:100%;font-weight:600;" />
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Registration Number</label>
            <input class="form-input" type="text" id="wizRegNo" value="${state.society.registrationNo}" 
              placeholder="CHD/RWA/2026/0042" 
              oninput="updateWizField('society', 'registrationNo', this.value)"
              onchange="updateWizField('society', 'registrationNo', this.value)" style="width:100%;" />
          </div>
          <div class="form-group">
            <label class="form-label">Registering Authority</label>
            <input class="form-input" type="text" id="wizAuth" value="${state.society.authority}" 
              placeholder="Registrar of Societies" 
              oninput="updateWizField('society', 'authority', this.value)"
              onchange="updateWizField('society', 'authority', this.value)" style="width:100%;" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Housing Layout Type *</label>
          <select id="wizHousingType" class="form-select" style="width:100%;font-weight:600;" onchange="handleHousingTypeSelect(this.value)">
            <option value="Cooperative Group Housing (CGHS)" ${state.society.housingType === 'Cooperative Group Housing (CGHS)' ? 'selected' : ''}>🏛️ Cooperative Group Housing (CGHS)</option>
            <option value="Multi-Tower Apartments" ${state.society.housingType === 'Multi-Tower Apartments' ? 'selected' : ''}>🏢 Multi-Tower High-Rise Apartments</option>
            <option value="Plotted / Villa Colony" ${state.society.housingType === 'Plotted / Villa Colony' ? 'selected' : ''}>🏘️ Plotted / Villa Gated Colony</option>
            <option value="CHB Housing Complex" ${state.society.housingType === 'CHB Housing Complex' ? 'selected' : ''}>🏢 CHB Multi-Pocket Flats</option>
            <option value="Builder Floors" ${state.society.housingType === 'Builder Floors' ? 'selected' : ''}>🏗️ Independent Builder Floors</option>
            <option value="Commercial / Mixed-Use Complex" ${state.society.housingType === 'Commercial / Mixed-Use Complex' ? 'selected' : ''}>🏬 Commercial / Mixed-Use Complex</option>
            <option value="__custom__" ${isCustomHousing ? 'selected' : ''}>➕ + Add Custom Layout Type...</option>
          </select>
          
          <!-- Dynamic Layout Helper Card -->
          <div id="housingTypeHelper" style="margin-top:10px;padding:12px 14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--r-md);font-size:12px;color:#166534;display:${isCGHS ? 'block' : 'none'};">
            <div style="font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:6px;">
              <span>🏛️</span>
              <span>Cooperative Group Housing (CGHS) Configured</span>
            </div>
            <div style="line-height:1.5;color:#15803D;">Property structure in Step 2 will automatically configure multi-block wings (Block A, B, C, D), cooperative flat categories (Cat-A HIG, Cat-B MIG), floor distributions, and share certificate folios.</div>
          </div>

          <div id="customHousingTypeWrap" style="${isCustomHousing ? 'display:block;' : 'display:none;'}margin-top:8px;">
            <div style="display:flex;gap:6px;align-items:center;">
              <input class="form-input" type="text" id="wizCustomHousingType" 
                value="${isCustomHousing ? state.society.housingType : ''}" 
                placeholder="Enter custom layout (e.g. Row Houses / Gated Enclave)..." 
                oninput="handleCustomHousingTypeInput(this.value)" style="flex:1;" />
              <button type="button" class="btn btn-ghost btn-sm" onclick="cancelCustomHousingType()" title="Reset to standard dropdown">✕</button>
            </div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">City / Jurisdiction *</label>
            <select id="wizCity" class="form-select" style="width:100%;" onchange="handleCitySelect(this.value)">
              <option value="Chandigarh" ${state.society.city === 'Chandigarh' ? 'selected' : ''}>Chandigarh (UT)</option>
              <option value="Mohali" ${state.society.city === 'Mohali' ? 'selected' : ''}>Mohali (Punjab - GMADA)</option>
              <option value="Panchkula" ${state.society.city === 'Panchkula' ? 'selected' : ''}>Panchkula (Haryana - HUDA)</option>
              <option value="New Delhi" ${state.society.city === 'New Delhi' ? 'selected' : ''}>New Delhi / NCR</option>
              <option value="Zirakpur" ${state.society.city === 'Zirakpur' ? 'selected' : ''}>Zirakpur / Dera Bassi</option>
              <option value="Kharar" ${state.society.city === 'Kharar' ? 'selected' : ''}>Kharar / New Chandigarh</option>
              <option value="__custom__" ${isCustomCity ? 'selected' : ''}>➕ + Other City / State...</option>
            </select>
            <div id="customCityWrap" style="${isCustomCity ? 'display:block;' : 'display:none;'}margin-top:8px;">
              <div style="display:flex;gap:6px;align-items:center;">
                <input class="form-input" type="text" id="wizCustomCity" 
                  value="${isCustomCity ? state.society.city : ''}" 
                  placeholder="Enter your city/district..." 
                  oninput="handleCustomCityInput(this.value)" style="flex:1;" />
                <button type="button" class="btn btn-ghost btn-sm" onclick="cancelCustomCity()" title="Reset">✕</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Pincode</label>
            <input class="form-input" type="text" id="wizPin" value="${state.society.pincode}" 
              placeholder="160048" 
              oninput="updateWizField('society', 'pincode', this.value)"
              onchange="updateWizField('society', 'pincode', this.value)" style="width:100%;" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Registered Address</label>
          <input class="form-input" type="text" id="wizAddr" value="${state.society.address}" 
              placeholder="e.g. Sector 48-B, Near Community Center" 
              oninput="updateWizField('society', 'address', this.value)"
              onchange="updateWizField('society', 'address', this.value)" style="width:100%;" />
        </div>

        <div class="form-group" style="margin-top:14px;margin-bottom:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <label class="form-label" style="font-weight:600;margin-bottom:0;display:flex;align-items:center;gap:6px;">
              <span>📍</span> Google Maps Location Link / Coordinates (Optional)
            </label>
            <button type="button" class="btn btn-ghost btn-xs" onclick="window.detectOnboardingGps(event)" style="font-size:11px;color:#2563EB;padding:2px 8px;border:1px solid #BFDBFE;border-radius:6px;">
              🎯 Detect GPS
            </button>
          </div>
          <input class="form-input" type="text" id="wizMapLocation" 
            value="${state.society.mapLocation || ''}" 
            placeholder="e.g. https://maps.app.goo.gl/... or 30.7333, 76.7794" 
            oninput="updateWizField('society', 'mapLocation', this.value)"
            onchange="updateWizField('society', 'mapLocation', this.value)" style="width:100%;font-size:12px;" />
          <div style="font-size:11px;color:#64748B;margin-top:3px;margin-bottom:8px;">
            Enables interactive Google Map &amp; navigation on your dashboard. If skipped, you can easily add it later.
          </div>

          <!-- Live Map Preview -->
          <div id="wizMapPreviewWrap" style="border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.06);position:relative;height:160px;background:#F8FAFC;">
            <iframe
              id="wizMapIframe"
              style="width:100%;height:100%;border:none;display:block;"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
              src="https://www.openstreetmap.org/export/embed.html?bbox=76.5,30.5,77.1,31.0&layer=mapnik&marker=30.7333,76.7794"
            ></iframe>
            <div id="wizMapPinLabel" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.78);color:#fff;font-size:10.5px;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap;backdrop-filter:blur(4px);pointer-events:none;">
              📍 ${state.society.mapLocation ? 'Location pinned' : 'Default view · Enter coordinates to pin'}
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Account Column -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg, #FEF3C7, #FDE68A);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid #FCD34D;">👑</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">RWA Society Admin Account</div>
            <div style="font-size:11px;color:var(--text-muted);">Primary administrator & signing authority</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Admin Full Name *</label>
          <input class="form-input" type="text" id="wizAdminName" value="${state.admin.name}" 
            placeholder="e.g. Rajesh Kumar" 
            oninput="updateWizField('admin', 'name', this.value)"
            onchange="updateWizField('admin', 'name', this.value)" style="width:100%;font-weight:600;" />
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:700;">Admin Mobile Number * (Primary Sign-In Phone ID)</label>
          <div style="display:flex;gap:8px;">
            <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:var(--r-md);padding:10px 12px;font-size:13px;font-weight:800;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
              <span>🇮🇳</span>
              <span>+91</span>
            </div>
            <input class="form-input" type="tel" id="wizAdminPhone" value="${state.admin.phone}" 
              placeholder="Enter 10-digit mobile number" 
              maxlength="10"
              oninput="updateWizField('admin', 'phone', this.value)"
              onchange="updateWizField('admin', 'phone', this.value)" style="flex:1;font-weight:700;letter-spacing:0.02em;" />
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Your 10-digit mobile number will be your permanent sign-in identity across web and mobile.</div>
        </div>

        <!-- 4-to-6 Digit Security PIN & Confirm PIN -->
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label" style="font-weight:700;display:flex;align-items:center;justify-content:space-between;">
              <span>Choose Security PIN *</span>
              <span style="font-size:10px;color:#D97706;font-weight:700;">4–6 Digits</span>
            </label>
            <div style="position:relative;display:flex;align-items:center;">
              <input class="form-input" type="password" id="wizAdminPin" value="${state.admin.pin || ''}" 
                placeholder="Choose a secure 4–6 digit PIN" 
                maxlength="6"
                oninput="updateWizField('admin', 'pin', this.value)"
                onchange="updateWizField('admin', 'pin', this.value)" 
                style="width:100%;font-weight:700;letter-spacing:0.1em;padding-right:38px;" />
              <button type="button" class="btn btn-ghost btn-sm" onclick="window.togglePinVisibility('wizAdminPin', 'wizPinSlash')" 
                style="position:absolute;right:4px;padding:4px 6px;color:#64748B;" title="Toggle PIN visibility">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line id="wizPinSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#D97706;stroke-width:2.5;"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;display:flex;align-items:center;justify-content:space-between;">
              <span>Confirm PIN *</span>
              <span style="font-size:10px;color:#10B981;font-weight:700;">Matches PIN</span>
            </label>
            <div style="position:relative;display:flex;align-items:center;">
              <input class="form-input" type="password" id="wizAdminConfirmPin" value="${state.admin.pin || ''}" 
                placeholder="Re-enter your security PIN" 
                maxlength="6"
                style="width:100%;font-weight:700;letter-spacing:0.1em;padding-right:38px;" />
              <button type="button" class="btn btn-ghost btn-sm" onclick="window.togglePinVisibility('wizAdminConfirmPin', 'wizConfirmPinSlash')" 
                style="position:absolute;right:4px;padding:4px 6px;color:#64748B;" title="Toggle PIN visibility">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line id="wizConfirmPinSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#D97706;stroke-width:2.5;"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Admin Email Address (Optional)</label>
            <input class="form-input" type="email" id="wizAdminEmail" value="${state.admin.email}" 
              placeholder="president@yourwelfaresociety.org" 
              oninput="updateWizField('admin', 'email', this.value)"
              onchange="updateWizField('admin', 'email', this.value)" style="width:100%;" />
          </div>

          <div class="form-group">
            <label class="form-label">Admin Role / Title *</label>
            <select id="wizAdminRole" class="form-select" style="width:100%;font-weight:600;" onchange="handleAdminRoleSelect(this.value)">
              <option value="President & Admin" ${state.admin.designation === 'President & Admin' ? 'selected' : ''}>RWA President</option>
              <option value="General Secretary" ${state.admin.designation === 'General Secretary' ? 'selected' : ''}>General Secretary</option>
              <option value="Treasurer" ${state.admin.designation === 'Treasurer' ? 'selected' : ''}>Treasurer</option>
              <option value="Vice President" ${state.admin.designation === 'Vice President' ? 'selected' : ''}>Vice President</option>
              <option value="Joint Secretary" ${state.admin.designation === 'Joint Secretary' ? 'selected' : ''}>Joint Secretary</option>
              <option value="Managing Director" ${state.admin.designation === 'Managing Director' ? 'selected' : ''}>Estate Manager</option>
              <option value="Executive Committee Member" ${state.admin.designation === 'Executive Committee Member' ? 'selected' : ''}>Executive Member</option>
              <option value="__custom__" ${isCustomRole ? 'selected' : ''}>➕ + Add Custom Title...</option>
            </select>
            <div id="customAdminRoleWrap" style="${isCustomRole ? 'display:block;' : 'display:none;'}margin-top:8px;">
              <div style="display:flex;gap:6px;align-items:center;">
                <input class="form-input" type="text" id="wizCustomAdminRole" 
                  value="${isCustomRole ? state.admin.designation : ''}" 
                  placeholder="Enter custom title (e.g. Patron, Convener)..." 
                  oninput="handleCustomAdminRoleInput(this.value)" style="flex:1;" />
                <button type="button" class="btn btn-ghost btn-sm" onclick="cancelCustomAdminRole()" title="Reset">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 100% Free Bank-Grade PIN Security Badge -->
        <div style="padding:14px 16px;background:linear-gradient(135deg, rgba(245,154,8,0.08) 0%, rgba(16,185,129,0.06) 100%);border:1px solid rgba(245,154,8,0.25);border-radius:var(--r-md);font-size:12px;display:flex;align-items:flex-start;gap:12px;margin-top:8px;">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(245,154,8,0.15);border:1px solid rgba(245,154,8,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔒</div>
          <div>
            <div style="font-weight:800;color:#B45309;margin-bottom:3px;display:flex;align-items:center;gap:6px;">
              <span>100% Free Bank-Grade PIN Security</span>
              <span style="font-size:10px;background:#10B981;color:#fff;padding:1px 6px;border-radius:999px;font-weight:700;">Zero SMS Costs</span>
            </div>
            <div style="line-height:1.5;color:#475569;">
              Your 4-to-6 digit PIN is encrypted with 12 rounds of bcrypt. No expensive SMS gateway or WhatsApp API fees required. Instant, zero-cost, and permanently secure.
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
};

// -----------------------------------------------------------------
// Step 2: Property Structure Configurator (Housing-Layout-Aware)
// -----------------------------------------------------------------
Screens['onboarding-2'] = function() {
  const state = window.getOnboardingState();
  const blocks = state.structure.blocks || [];
  const units = state.structure.generatedUnits || [];
  const totalFloors = blocks.reduce((acc, b) => acc + (parseInt(b.floors) || 0), 0);
  const totalArea = units.reduce((acc, u) => acc + (parseFloat(u.areaSqft) || 0), 0);
  const isCGHS = (state.society.housingType || '').includes('CGHS') || (state.society.housingType || '').includes('Cooperative');
  const isPlotted = (state.society.housingType || '').includes('Plotted') || (state.society.housingType || '').includes('Villa');

  const numberingStyle = state.structure.numberingStyle || 'BLOCK_FLOOR_UNIT';
  const generateShareCert = state.structure.generateShareCert !== false;

  return wizardLayout(2, `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
          <h2 style="margin-bottom:0;">Configure Property Structure</h2>
          <span class="badge ${isCGHS ? 'badge-green' : 'badge-blue'}" style="font-size:11px;padding:3px 10px;">
            ${isCGHS ? '🏛️ Cooperative Group Housing (CGHS)' : (isPlotted ? '🏘️ Plotted Enclave' : '🏢 Multi-Tower')}
          </span>
        </div>
        <p class="wiz-desc" style="margin-bottom:0;">
          ${isCGHS 
            ? 'Architectural layout tailored for CGHS: Configure multi-block wings, cooperative flat categories (Cat-A HIG, Cat-B MIG), floor distributions, and share certificate folios.' 
            : 'Decide the architectural layout of your society: blocks, towers, floors, and generated units.'}
        </p>
      </div>
      <button class="btn btn-primary" onclick="addStructureBlock()" style="font-weight:700;box-shadow:var(--shadow-blue);padding:8px 16px;">
        ${isCGHS ? '+ Add CGHS Block / Wing' : '+ Add Tower / Block'}
      </button>
    </div>

    <!-- Quick Presets Row Tailored to Housing Type -->
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:800;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;">Architecture Presets:</span>
        ${isCGHS ? `
          <button class="onboarding-preset-pill ${units.length === 32 ? 'active' : ''}" onclick="applyStructurePreset('cghs-lowrise')">
            <span>🏛️</span>
            <span>Low-Rise CGHS (4 Blocks · 4 Floors · 32 Flats)</span>
          </button>
          <button class="onboarding-preset-pill ${units.length === 64 ? 'active' : ''}" onclick="applyStructurePreset('cghs-midrise')">
            <span>🏢</span>
            <span>Mid/High-Rise CGHS (2 Towers · 8 Floors · 64 Flats)</span>
          </button>
          <button class="onboarding-preset-pill ${units.length === 48 ? 'active' : ''}" onclick="applyStructurePreset('cghs-categories')">
            <span>📑</span>
            <span>Category-Wise CGHS (HIG 24 + MIG 24 = 48 Flats)</span>
          </button>
          <button class="onboarding-preset-pill ${units.length === 16 ? 'active' : ''}" onclick="applyStructurePreset('cghs-compact')">
            <span>🏛️</span>
            <span>Compact CGHS (2 Wings · 4 Floors · 16 Flats)</span>
          </button>
        ` : (isPlotted ? `
          <button class="onboarding-preset-pill" onclick="applyStructurePreset('plots')">
            <span>🏘️</span>
            <span>Plotted Enclave (35 Plots)</span>
          </button>
        ` : `
          <button class="onboarding-preset-pill" onclick="applyStructurePreset('high-rise')">
            <span>🏢</span>
            <span>3 Towers · 28 Floors (112 Units)</span>
          </button>
          <button class="onboarding-preset-pill" onclick="applyStructurePreset('mid-rise')">
            <span>🏢</span>
            <span>2 Wings · 4 Floors (32 Units)</span>
          </button>
          <button class="onboarding-preset-pill" onclick="applyStructurePreset('plots')">
            <span>🏘️</span>
            <span>Plotted Enclave (35 Plots)</span>
          </button>
        `)}
      </div>

      ${isCGHS ? `
        <button class="btn btn-ghost btn-sm" onclick="applyStructurePreset('cghs-lowrise')" title="Reset to standard 32 flat CGHS layout" style="font-size:11px;color:var(--blue);font-weight:700;">
          🔄 Apply Typical CGHS Layout
        </button>
      ` : ''}
    </div>

    <!-- CGHS Custom Settings Bar -->
    ${isCGHS ? `
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-md);padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:700;color:var(--text-secondary);">Flat Numbering Format:</span>
            <select class="form-select" style="font-size:12px;padding:4px 8px;font-weight:600;" onchange="window.handleNumberingStyleChange(this.value)">
              <option value="BLOCK_FLOOR_UNIT" ${numberingStyle === 'BLOCK_FLOOR_UNIT' ? 'selected' : ''}>Block-Floor-Flat (A-101, A-102, B-101)</option>
              <option value="FLOOR_UNIT" ${numberingStyle === 'FLOOR_UNIT' ? 'selected' : ''}>Floor-Flat (101, 102, 201)</option>
              <option value="GROUND_BASED" ${numberingStyle === 'GROUND_BASED' ? 'selected' : ''}>Ground-Based (A-G01, A-101, A-201)</option>
              <option value="BLOCK_SERIAL" ${numberingStyle === 'BLOCK_SERIAL' ? 'selected' : ''}>Block-Serial (A-1, A-2, B-1, B-2)</option>
              <option value="SEQUENTIAL" ${numberingStyle === 'SEQUENTIAL' ? 'selected' : ''}>Society Serial (Flat 1 to ${units.length})</option>
            </select>
          </div>

          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-primary);cursor:pointer;">
            <input type="checkbox" ${generateShareCert ? 'checked' : ''} onchange="window.handleShareCertToggle(this.checked)" style="width:16px;height:16px;" />
            <span>Generate Cooperative Share Certificates (SC-001, SC-002...)</span>
          </label>
        </div>
        <span class="badge badge-muted" style="font-size:11px;">Statutory CGHS Compliance ✓</span>
      </div>
    ` : ''}

    <!-- Summary KPI Counter Banner -->
    <div class="onboarding-kpi-grid" style="margin-bottom:20px;">
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="font-size:24px;font-weight:800;color:var(--blue);">${blocks.length}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;">${isCGHS ? 'Blocks / Wings' : 'Towers / Blocks'}</div>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="font-size:24px;font-weight:800;color:var(--green);">${totalFloors}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Total Society Floors</div>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="font-size:24px;font-weight:800;color:var(--purple);">${units.length}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;">${isCGHS ? 'Cooperative Society Flats' : 'Generated Units'}</div>
      </div>
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="font-size:24px;font-weight:800;color:#F59E0B;">${totalArea.toLocaleString('en-IN')}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Total Covered SqFt</div>
      </div>
    </div>

    <!-- Dynamic Tower / Block Cards -->
    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:24px;">
      ${blocks.map((b, idx) => {
        const blockUnits = units.filter(u => u.blockName === b.name);
        const floorsNum = parseInt(b.floors) || 1;
        const unitsPerFloorNum = parseInt(b.unitsPerFloor) || 1;

        // Group units by floor for live elevation matrix
        const floorGroups = {};
        blockUnits.forEach(u => {
          floorGroups[u.floor] = floorGroups[u.floor] || [];
          floorGroups[u.floor].push(u);
        });

        return `
          <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <div style="width:34px;height:34px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">
                  ${isCGHS ? '🏛️' : '🏢'}
                </div>
                <input type="text" class="form-input" value="${b.name}" 
                  style="font-size:15px;font-weight:800;width:160px;padding:6px 10px;" 
                  onchange="updateBlockField(${idx}, 'name', this.value);Router.go('onboarding-2');" />
                <span class="badge badge-blue" style="font-weight:700;">${floorsNum * unitsPerFloorNum} Flats</span>
                <span class="badge badge-muted" style="font-size:11px;">${floorsNum} Floors · ${unitsPerFloorNum} flats/floor</span>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="removeStructureBlock(${idx})" style="color:var(--red);font-weight:600;" title="Remove Block">✕ Delete Block</button>
            </div>

            <!-- Parameters Grid -->
            <div class="onboarding-tower-grid" style="margin-bottom:16px;">
              <div>
                <label class="form-label" style="font-size:11px;font-weight:600;">Floors</label>
                <input type="number" class="form-input" min="1" max="50" value="${b.floors}" 
                  onchange="updateBlockField(${idx}, 'floors', parseInt(this.value)||1);Router.go('onboarding-2');" style="width:100%;font-weight:700;" />
              </div>
              <div>
                <label class="form-label" style="font-size:11px;font-weight:600;">Flats / Floor</label>
                <input type="number" class="form-input" min="1" max="20" value="${b.unitsPerFloor}" 
                  onchange="updateBlockField(${idx}, 'unitsPerFloor', parseInt(this.value)||1);Router.go('onboarding-2');" style="width:100%;font-weight:700;" />
              </div>
              <div>
                <label class="form-label" style="font-size:11px;font-weight:600;">Number Prefix</label>
                <input type="text" class="form-input" value="${b.unitPrefix}" 
                  onchange="updateBlockField(${idx}, 'unitPrefix', this.value);Router.go('onboarding-2');" style="width:100%;font-weight:700;" />
              </div>
              <div>
                <label class="form-label" style="font-size:11px;font-weight:600;">Flat Category / Type</label>
                <select class="form-select" onchange="handleUnitTypeSelect(${idx}, this.value)" style="width:100%;font-weight:600;">
                  ${isCGHS ? `
                    <option value="Category A (3 BHK)" ${b.defaultType === 'Category A (3 BHK)' ? 'selected' : ''}>Category A (3 BHK · HIG)</option>
                    <option value="Category B (2 BHK)" ${b.defaultType === 'Category B (2 BHK)' ? 'selected' : ''}>Category B (2 BHK · MIG)</option>
                    <option value="Category C (1 BHK)" ${b.defaultType === 'Category C (1 BHK)' ? 'selected' : ''}>Category C (1 BHK · LIG)</option>
                    <option value="Category D (EWS)" ${b.defaultType === 'Category D (EWS)' ? 'selected' : ''}>Category D (EWS)</option>
                  ` : ''}
                  <option value="1BHK" ${b.defaultType === '1BHK' ? 'selected' : ''}>1 BHK Flat</option>
                  <option value="2BHK" ${b.defaultType === '2BHK' ? 'selected' : ''}>2 BHK Flat</option>
                  <option value="3BHK" ${b.defaultType === '3BHK' ? 'selected' : ''}>3 BHK Flat</option>
                  <option value="4BHK" ${b.defaultType === '4BHK' ? 'selected' : ''}>4 BHK Flat</option>
                  <option value="Penthouse" ${b.defaultType === 'Penthouse' ? 'selected' : ''}>Penthouse</option>
                  <option value="Duplex" ${b.defaultType === 'Duplex' ? 'selected' : ''}>Duplex / Triplex</option>
                  <option value="Villa" ${b.defaultType === 'Villa' ? 'selected' : ''}>Villa</option>
                  <option value="Shop / Commercial" ${b.defaultType === 'Shop / Commercial' ? 'selected' : ''}>Shop / Commercial</option>
                  ${b.defaultType && !['1BHK','2BHK','3BHK','4BHK','Penthouse','Villa','Duplex','Shop / Commercial','Category A (3 BHK)','Category B (2 BHK)','Category C (1 BHK)','Category D (EWS)'].includes(b.defaultType) ? `<option value="${b.defaultType}" selected>✨ ${b.defaultType} (Custom)</option>` : ''}
                  <option value="__custom__">➕ + Custom Type...</option>
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size:11px;font-weight:600;">Avg Area (SqFt)</label>
                <input type="number" class="form-input" value="${b.areaSqft || 1850}" 
                  onchange="updateBlockField(${idx}, 'areaSqft', parseFloat(this.value)||1850);Router.go('onboarding-2');" style="width:100%;font-weight:700;" />
              </div>
            </div>

            <!-- Live Floor-by-Floor Interactive Matrix -->
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:var(--r-md);padding:12px;">
              <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
                <span>Floor Elevation & Unit Distribution Preview (${floorsNum} Floors)</span>
                <span style="font-size:11px;color:var(--text-muted);">${blockUnits.length} Flats mapped</span>
              </div>

              <div style="display:flex;flex-direction:column;gap:4px;">
                ${Array.from({ length: floorsNum }, (_, i) => floorsNum - i).map(f => {
                  const floorUnits = floorGroups[f] || [];
                  return `
                    <div class="matrix-floor-row" style="margin-bottom:4px;padding:4px 8px;">
                      <div class="matrix-floor-label">
                        <span>🏢</span>
                        <span>Floor ${f}</span>
                      </div>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1;">
                        ${floorUnits.map(u => `
                          <div class="matrix-unit-chip" title="Unit: ${u.unitNumber} | ${u.unitType} | ${u.areaSqft} sqft ${u.shareCertificateNo ? '| Folio: ' + u.shareCertificateNo : ''}">
                            <span style="color:var(--blue);">${u.unitNumber}</span>
                            <span class="cat-tag">${u.unitType.replace(/Category\s*/, 'Cat-').split(' ')[0]}</span>
                            ${u.shareCertificateNo ? `<span style="font-size:9px;color:var(--text-muted);font-family:monospace;">${u.shareCertificateNo}</span>` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Live Visual Structure Tree Preview -->
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px;">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
          <span>🌳</span>
          <span>Live Structure Tree Preview</span>
        </div>
        <span style="font-size:11px;color:var(--green);font-weight:700;">✓ ${units.length} units ready to be provisioned in database</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
        <div style="font-weight:800;color:var(--blue);">🏛️ ${state.society.name || 'Society Organization'}</div>
        ${blocks.map(b => {
          const blockUnits = units.filter(u => u.blockName === b.name);
          const sampleUnits = blockUnits.slice(0, 10).map(u => u.unitNumber).join(', ');
          return `
            <div style="padding-left:18px;border-left:2px solid #CBD5E1;display:flex;flex-direction:column;gap:4px;">
              <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span>├── 🏠 ${b.name} (${b.floors} Floors · ${b.unitsPerFloor} flats/floor)</span>
                <span class="badge badge-muted" style="font-size:10px;">${b.defaultType} · ${b.areaSqft} sqft</span>
              </div>
              <div style="font-size:11px;color:var(--text-secondary);padding-left:18px;font-family:monospace;word-break:break-all;">
                └── Flats: ${sampleUnits} ${blockUnits.length > 10 ? `... and ${blockUnits.length - 10} more` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `);
};

// -----------------------------------------------------------------
// Step 3: Resident & Society Member Directory Roster
// -----------------------------------------------------------------
Screens['onboarding-3'] = function() {
  const state = window.getOnboardingState();
  const members = state.members.importedRows || [];
  const units = state.structure.generatedUnits || [];
  const activeTab = window._memberInputTab || 'upload';

  const ownerCount = members.filter(r => (r.type || 'OWNER').toUpperCase().includes('OWNER')).length;
  const tenantCount = members.filter(r => (r.type || '').toUpperCase().includes('TENANT')).length;
  const assignedUnits = new Set(members.map(m => (m.unit || '').trim().toLowerCase()));

  return wizardLayout(3, `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div>
        <h2 style="margin-bottom:4px;">Society Resident &amp; Member Directory</h2>
        <p class="wiz-desc" style="margin-bottom:0;">Add your society flat owners and residents. Upload an Excel / CSV spreadsheet or add members manually flat-by-flat.</p>
      </div>
      <div class="onboarding-action-wrap" style="display:flex;align-items:center;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="downloadSampleMemberTemplate()" style="font-weight:600;gap:6px;">
          <span>📥</span>
          <span>Download Excel Template (.csv)</span>
        </button>
      </div>
    </div>

    <!-- Mode Selector Tabs: Upload vs Manual -->
    <div style="display:flex;align-items:center;gap:8px;background:#F1F5F9;padding:4px;border-radius:12px;margin-bottom:18px;max-width:fit-content;border:1px solid #E2E8F0;">
      <button type="button" class="btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}" 
        onclick="setMemberInputTab('upload')" 
        style="font-size:12.5px;font-weight:700;padding:7px 16px;border-radius:8px;gap:6px;${activeTab === 'upload' ? 'background:#0F172A;color:#FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.12);' : 'color:#475569;'}">
        <span>📁</span>
        <span>Upload Spreadsheet (Excel / CSV)</span>
      </button>
      <button type="button" class="btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-ghost'}" 
        onclick="setMemberInputTab('manual')" 
        style="font-size:12.5px;font-weight:700;padding:7px 16px;border-radius:8px;gap:6px;${activeTab === 'manual' ? 'background:#0F172A;color:#FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.12);' : 'color:#475569;'}">
        <span>✍️</span>
        <span>Add Member Manually</span>
      </button>
    </div>

    ${activeTab === 'upload' ? `
      <!-- TAB 1: SPREADSHEET UPLOAD & FORMAT GUIDELINES -->
      <div class="onboarding-grid-2" style="margin-bottom:20px;align-items:start;">
        <!-- Upload Dropzone Card -->
        <div style="background:#FFFFFF;border:2px dashed ${members.length > 0 ? 'var(--green)' : '#93C5FD'};border-radius:var(--r-lg);padding:24px 20px;text-align:center;position:relative;transition:all 0.2s ease;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <input type="file" id="memberExcelFileInput" accept=".csv, .xlsx, .xls, text/csv" 
            style="opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;z-index:2;" 
            onchange="handleMemberFileSelect(this)" />
          
          <div style="font-size:36px;margin-bottom:8px;">📊</div>
          <div style="font-size:15px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">
            ${state.members.fileName ? `Uploaded: ${state.members.fileName}` : 'Drag & drop Excel or CSV spreadsheet here'}
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;line-height:1.5;">
            Accepts <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> files.<br/>
            Auto-maps Unit, Member Name, Mobile (+91), Email, and Owner/Tenant status.
          </div>
          <button type="button" class="btn btn-primary btn-sm" style="pointer-events:none;font-weight:700;gap:6px;">
            <span>📂</span>
            <span>Browse Local Spreadsheet File</span>
          </button>
          
          <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #E2E8F0;font-size:11.5px;color:var(--text-secondary);">
            Don't have a spreadsheet file ready?
            <a href="javascript:void(0)" onclick="setMemberInputTab('manual')" style="color:var(--blue);font-weight:700;text-decoration:underline;margin-left:4px;">Add members manually</a>
          </div>
        </div>

        <!-- Required Format Specification Card -->
        <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #F1F5F9;">
            <div style="font-size:13px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
              <span>📋</span>
              <span>Required Spreadsheet Format</span>
            </div>
            <span class="badge badge-blue" style="font-size:10.5px;">First Row = Headers</span>
          </div>

          <p style="font-size:11.5px;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">
            Ensure the first row of your spreadsheet contains the following column headers (case-insensitive):
          </p>

          <div style="overflow-x:auto;margin-bottom:12px;">
            <table style="width:100%;font-size:11px;border-collapse:collapse;line-height:1.4;">
              <thead>
                <tr style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;text-align:left;">
                  <th style="padding:6px 8px;font-weight:700;color:#334155;">Column Name</th>
                  <th style="padding:6px 8px;font-weight:700;color:#334155;">Required</th>
                  <th style="padding:6px 8px;font-weight:700;color:#334155;">Example</th>
                  <th style="padding:6px 8px;font-weight:700;color:#334155;">Accepted Aliases</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:6px 8px;font-weight:700;color:var(--blue);">Unit_Number</td>
                  <td style="padding:6px 8px;"><span style="color:#DC2626;font-weight:700;">Required</span></td>
                  <td style="padding:6px 8px;font-family:monospace;color:#0F172A;">A-101</td>
                  <td style="padding:6px 8px;color:#64748B;">Unit, Flat, Flat_No, House</td>
                </tr>
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:6px 8px;font-weight:700;color:var(--blue);">Member_Name</td>
                  <td style="padding:6px 8px;"><span style="color:#DC2626;font-weight:700;">Required</span></td>
                  <td style="padding:6px 8px;color:#0F172A;">Vikram Sharma</td>
                  <td style="padding:6px 8px;color:#64748B;">Name, Full_Name, Resident, Owner</td>
                </tr>
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:6px 8px;font-weight:700;color:var(--blue);">Mobile_Number</td>
                  <td style="padding:6px 8px;"><span style="color:#DC2626;font-weight:700;">Required</span></td>
                  <td style="padding:6px 8px;font-family:monospace;color:#0F172A;">9814012345</td>
                  <td style="padding:6px 8px;color:#64748B;">Mobile, Phone, Contact</td>
                </tr>
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:6px 8px;font-weight:700;color:#475569;">Email</td>
                  <td style="padding:6px 8px;"><span style="color:#64748B;">Optional</span></td>
                  <td style="padding:6px 8px;color:#0F172A;">vikram@gmail.com</td>
                  <td style="padding:6px 8px;color:#64748B;">Email, Email_Address, Mail</td>
                </tr>
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:6px 8px;font-weight:700;color:#475569;">Ownership_Type</td>
                  <td style="padding:6px 8px;"><span style="color:#64748B;">Optional</span></td>
                  <td style="padding:6px 8px;color:#0F172A;">Owner / Tenant</td>
                  <td style="padding:6px 8px;color:#64748B;">Type, Ownership, Status</td>
                </tr>
                <tr>
                  <td style="padding:6px 8px;font-weight:700;color:#475569;">Share_Certificate_No</td>
                  <td style="padding:6px 8px;"><span style="color:#64748B;">Optional</span></td>
                  <td style="padding:6px 8px;font-family:monospace;color:#0F172A;">SC-001</td>
                  <td style="padding:6px 8px;color:#64748B;">Share_Cert, Folio_No</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-size:11px;color:#166534;line-height:1.4;">
              💡 <strong>Tip:</strong> Download our pre-configured template with all your society units already listed!
            </div>
            <button type="button" class="btn btn-ghost btn-xs" onclick="downloadSampleMemberTemplate()" style="font-weight:700;color:#15803D;text-decoration:underline;white-space:nowrap;">
              Download .CSV
            </button>
          </div>
        </div>
      </div>
    ` : `
      <!-- TAB 2: MANUAL MEMBER ADDITION FORM -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:22px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;">
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              <span>✍️</span>
              <span>Add Member Manually</span>
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);">Assign an owner or tenant directly to a configured flat.</div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="setMemberInputTab('upload')" style="font-size:11.5px;color:var(--blue);font-weight:600;">
            📁 Switch to Bulk Excel Upload
          </button>
        </div>

        <div class="form-row form-row-2">
          <!-- Flat / Unit Dropdown -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Flat / Unit Number *</label>
            ${units.length > 0 ? `
              <select id="manualMemberUnit" class="form-select" style="width:100%;font-weight:700;" onchange="handleManualMemberUnitChange(this.value)">
                <option value="">— Select Society Flat —</option>
                ${units.map(u => {
                  const isAssigned = assignedUnits.has((u.unitNumber || '').toLowerCase());
                  return `<option value="${u.unitNumber}">
                    ${u.unitNumber} (${u.blockName || ''} · Floor ${u.floor}) ${isAssigned ? '— [Already Assigned]' : '— [Available]'}
                  </option>`;
                }).join('')}
                <option value="__custom__">➕ + Add Custom / Other Unit Number...</option>
              </select>
              <div id="manualMemberCustomUnitWrap" style="display:none;margin-top:8px;">
                <input class="form-input" type="text" id="manualMemberCustomUnit" placeholder="Enter custom unit # (e.g. Penthouse-1, Villa-12)..." style="width:100%;" />
              </div>
            ` : `
              <input class="form-input" type="text" id="manualMemberUnit" placeholder="e.g. A-101" style="width:100%;font-weight:700;" />
            `}
          </div>

          <!-- Member Name -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Member Full Name *</label>
            <input class="form-input" type="text" id="manualMemberName" placeholder="e.g. Vikram Sharma" style="width:100%;font-weight:600;" />
          </div>
        </div>

        <div class="form-row form-row-3">
          <!-- Mobile Number with +91 -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Mobile Number * (Sign-In ID)</label>
            <div style="display:flex;gap:6px;">
              <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:var(--r-md);padding:8px 10px;font-size:12.5px;font-weight:700;color:var(--text-secondary);display:flex;align-items:center;">
                +91
              </div>
              <input class="form-input" type="tel" id="manualMemberPhone" maxlength="10" placeholder="10-digit mobile number" style="flex:1;font-weight:600;" />
            </div>
          </div>

          <!-- Email Address -->
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">Email Address (Optional)</label>
            <input class="form-input" type="email" id="manualMemberEmail" placeholder="e.g. vikram@example.com" style="width:100%;" />
          </div>

          <!-- Member Type -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Occupancy / Member Type *</label>
            <select id="manualMemberType" class="form-select" style="width:100%;font-weight:600;">
              <option value="OWNER">🏡 Flat Owner (Full Member)</option>
              <option value="TENANT">🏢 Tenant / Resident</option>
            </select>
          </div>
        </div>

        <div class="form-row form-row-2" style="margin-bottom:16px;">
          <!-- Share Certificate Number -->
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-weight:600;">Share Certificate / Folio No. (Optional)</label>
            <input class="form-input" type="text" id="manualMemberShareCert" placeholder="e.g. SC-001 (auto-filled if mapped)" style="width:100%;" />
          </div>
          <div style="display:flex;align-items:flex-end;gap:10px;">
            <button type="button" class="btn btn-primary" onclick="addManualMember()" style="padding:10px 22px;font-weight:700;gap:8px;background:#0F172A;color:#FFFFFF;box-shadow:0 4px 12px rgba(15,23,42,0.15);">
              <span>➕</span>
              <span>Add Member to Roster</span>
            </button>
            <button type="button" class="btn btn-ghost" onclick="Router.go('onboarding-3')" style="font-weight:600;padding:10px 16px;">
              Reset Form
            </button>
          </div>
        </div>
      </div>
    `}

    <!-- Status Statistics Banner -->
    ${members.length > 0 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-md);padding:12px 18px;margin-bottom:16px;flex-wrap:wrap;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;gap:18px;font-size:13px;flex-wrap:wrap;align-items:center;">
          <div>👥 Members: <strong style="color:var(--blue)">${members.length}</strong></div>
          <div>🏡 Owners: <strong style="color:var(--green)">${ownerCount}</strong></div>
          <div>🏢 Tenants: <strong style="color:var(--purple)">${tenantCount}</strong></div>
          <div>✓ Covered: <strong style="color:var(--text-primary)">${assignedUnits.size} / ${units.length || members.length} Flats</strong></div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="clearImportedMembers()" style="color:var(--red);font-weight:600;gap:4px;">
          <span>✕</span>
          <span>Clear Entire Roster</span>
        </button>
      </div>
    ` : ''}

    <!-- Parsed / Manually Added Member Roster Table -->
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
      <div style="padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-size:13px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
          <span>👥</span>
          <span>Configured Member Directory Preview (${members.length})</span>
        </div>
        <span style="font-size:12px;color:var(--text-muted);">
          ${members.length === 0 ? 'Awaiting spreadsheet upload or manual addition' : 'Ready for database provisioning'}
        </span>
      </div>

      <div style="max-height:340px;overflow-y:auto;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="data-table" style="width:100%;min-width:640px;font-size:12px;">
          <thead>
            <tr>
              <th style="width:110px;">Flat / Unit #</th>
              <th>Member Name</th>
              <th>Mobile Number</th>
              <th>Email Address</th>
              <th style="width:110px;">Type</th>
              <th style="width:100px;">Share Folio</th>
              <th style="width:90px;">Status</th>
              <th style="width:40px;"></th>
            </tr>
          </thead>
          <tbody>
            ${members.length === 0 ? `
              <tr>
                <td colspan="8" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
                  <div style="font-size:32px;margin-bottom:8px;">👥</div>
                  <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;font-size:14px;">No members added to the roster yet</div>
                  <div style="font-size:12px;max-width:440px;margin:0 auto;line-height:1.5;">
                    Upload an Excel / CSV spreadsheet above, or click <strong>"Add Member Manually"</strong> to assign residents flat by flat.
                  </div>
                </td>
              </tr>
            ` : members.map((m, i) => `
              <tr>
                <td><strong style="color:var(--blue);font-weight:800;">${m.unit}</strong></td>
                <td><div style="font-weight:700;color:var(--text-primary);">${m.name}</div></td>
                <td><span style="font-family:monospace;font-weight:600;">+91 ${m.phone}</span></td>
                <td>${m.email || '<span style="color:#94A3B8;">—</span>'}</td>
                <td>
                  <span class="badge ${(m.type || 'OWNER').toUpperCase().includes('OWNER') ? 'badge-green' : 'badge-purple'}" style="font-size:11px;">
                    ${(m.type || 'OWNER').toUpperCase().includes('OWNER') ? '🏡 Owner' : '🏢 Tenant'}
                  </span>
                </td>
                <td><span style="font-family:monospace;font-size:11px;color:#64748B;">${m.shareCertificateNo || '—'}</span></td>
                <td><span class="badge badge-blue" style="font-size:10.5px;">✓ Ready</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-ghost btn-xs btn-icon" onclick="removeImportedMember(${i})" title="Remove member" style="color:#EF4444;">✕</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
};

// -----------------------------------------------------------------
// Step 4: Bylaws & Financial Rules Profile
// -----------------------------------------------------------------
Screens['onboarding-4'] = function() {
  const state = window.getOnboardingState();
  const isCGHS = (state.society.housingType || '').includes('CGHS') || (state.society.housingType || '').includes('Cooperative');

  return wizardLayout(4, `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="margin-bottom:4px;">Society Rules & Maintenance Bylaws</h2>
        <p class="wiz-desc" style="margin-bottom:0;">Configure recurring maintenance billing charges, due dates, late fees, and quorum requirements.</p>
      </div>
      <div class="badge badge-blue" style="font-size:12px;padding:6px 12px;font-weight:700;">Step 4 of 5 · Rules Setup</div>
    </div>

    <div class="onboarding-grid-2" style="margin-top:16px;">
      <!-- Maintenance Billing Rules -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;">
          <div style="width:34px;height:34px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">💳</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">Maintenance Billing Setup</div>
            <div style="font-size:11px;color:var(--text-muted);">Recurring assessment calculation</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Billing Calculation Model *</label>
          <select id="wizModel" class="form-select" style="width:100%;font-weight:600;" onchange="updateWizField('rules', 'maintenanceModel', this.value);Router.go('onboarding-4');">
            <option value="FLAT_RATE" ${state.rules.maintenanceModel === 'FLAT_RATE' ? 'selected' : ''}>Fixed Flat Fee per Unit (e.g. ₹3,000 / month)</option>
            <option value="PER_SQFT" ${state.rules.maintenanceModel === 'PER_SQFT' ? 'selected' : ''}>Per Square Foot Rate (e.g. ₹2.20 / sq.ft)</option>
          </select>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">
              ${state.rules.maintenanceModel === 'PER_SQFT' ? 'Rate per SqFt (₹)' : 'Base Maintenance (₹) *'}
            </label>
            <input class="form-input" type="number" id="wizBaseRate" 
              value="${state.rules.maintenanceModel === 'PER_SQFT' ? state.rules.ratePerSqft : state.rules.baseAmount}" 
              onchange="window.handleMaintenanceBaseRateChange(this.value)" style="width:100%;font-weight:700;" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">Billing Cycle *</label>
            <select id="wizCycle" class="form-select" style="width:100%;font-weight:600;" onchange="updateWizField('rules', 'billingCycle', this.value)">
              <option value="MONTHLY" ${state.rules.billingCycle === 'MONTHLY' ? 'selected' : ''}>Monthly</option>
              <option value="QUARTERLY" ${state.rules.billingCycle === 'QUARTERLY' ? 'selected' : ''}>Quarterly</option>
              <option value="ANNUAL" ${state.rules.billingCycle === 'ANNUAL' ? 'selected' : ''}>Annual</option>
            </select>
          </div>
        </div>

        <!-- Interactive Calendar Due Day Selector -->
        <div class="form-group">
          <label class="form-label" style="font-weight:600;">Monthly Payment Due Date</label>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:var(--blue-light);border:1px solid #BFDBFE;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">📅</div>
            <select id="wizDueDay" class="form-select" style="flex:1;font-weight:600;" onchange="updateWizField('rules', 'dueDay', parseInt(this.value))">
              ${[1, 5, 7, 10, 15, 20, 25, 28].map(d => `
                <option value="${d}" ${state.rules.dueDay === d ? 'selected' : ''}>${d}th of every month</option>
              `).join('')}
            </select>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Invoices generated on 1st, late penalties triggered after this day.</div>
        </div>

        <div class="form-row form-row-2" style="margin-bottom:0;">
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">Late Fee Penalty</label>
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:var(--r-md);">
              <input type="checkbox" id="wizLateCheck" ${state.rules.lateFeeEnabled ? 'checked' : ''} 
                onchange="updateWizField('rules', 'lateFeeEnabled', this.checked)" style="width:16px;height:16px;" />
              <span style="font-size:12px;font-weight:700;">Enable Late Fee</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">Late Fee Amount (₹)</label>
            <input class="form-input" type="number" id="wizLateAmt" value="${state.rules.lateFeeAmount || 200}" 
              onchange="updateWizField('rules', 'lateFeeAmount', parseFloat(this.value))" style="width:100%;font-weight:700;" />
          </div>
        </div>
      </div>

      <!-- Governance & Bylaws Settings -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #F1F5F9;">
          <div style="width:34px;height:34px;background:#FEF3C7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">⚖️</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">Society Governance & Quorum</div>
            <div style="font-size:11px;color:var(--text-muted);">Statutory compliance parameters</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-weight:600;">General Body Meeting Notice Period (Days) *</label>
          <input class="form-input" type="number" id="wizNoticeDays" value="${state.rules.noticePeriodDays || 14}" 
            onchange="updateWizField('rules', 'noticePeriodDays', parseInt(this.value))" style="width:100%;font-weight:700;" />
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Statutory minimum is 14 days under Chandigarh Societies Registration Act.</div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">AGM Quorum Percentage (%) *</label>
            <input class="form-input" type="number" id="wizQuorum" value="${state.rules.quorumPercent || 33}" 
              onchange="updateWizField('rules', 'quorumPercent', parseInt(this.value))" style="width:100%;font-weight:700;" />
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600;">Committee Term (Months)</label>
            <select id="wizTerm" class="form-select" style="width:100%;font-weight:600;" onchange="updateWizField('rules', 'committeeTermMonths', parseInt(this.value))">
              <option value="12" ${state.rules.committeeTermMonths === 12 ? 'selected' : ''}>1 Year (12 months)</option>
              <option value="24" ${state.rules.committeeTermMonths === 24 ? 'selected' : ''}>2 Years (24 months)</option>
              <option value="36" ${state.rules.committeeTermMonths === 36 ? 'selected' : ''}>3 Years (36 months)</option>
            </select>
          </div>
        </div>

        <div style="padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:var(--r-md);margin-top:16px;">
          <div style="font-size:12px;font-weight:800;color:var(--text-primary);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <span>📜</span>
            <span>Digital Bylaws Compliance</span>
          </div>
          <p style="font-size:11px;color:var(--text-secondary);line-height:1.6;margin-bottom:0;">
            ${isCGHS 
              ? 'All transactions, member resolutions, and share certificate folios created in the platform adhere strictly to the Cooperative Societies Act, 1912 and your approved CGHS bylaws.' 
              : 'All financial transactions and resolutions created in the portal will automatically adhere to the Societies Registration Act, 1860 and your society bylaws.'}
          </p>
        </div>
      </div>
    </div>
  `);
};

// -----------------------------------------------------------------
// Step 5: Review & Complete Launch
// -----------------------------------------------------------------
Screens['onboarding-5'] = function() {
  const state = window.getOnboardingState();
  const blocks = state.structure.blocks || [];
  const units = state.structure.generatedUnits || [];
  const members = state.members.importedRows || [];
  const isCGHS = (state.society.housingType || '').includes('CGHS') || (state.society.housingType || '').includes('Cooperative');

  return wizardLayout(5, `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div>
        <h2 style="margin-bottom:4px;">Review & Launch Your Society</h2>
        <p class="wiz-desc" style="margin-bottom:0;">Verify all configured details before creating your official RWA society account.</p>
      </div>
      <div class="badge badge-green" style="font-size:12px;padding:6px 12px;font-weight:700;">Ready to Launch 🚀</div>
    </div>

    <!-- Review Grid -->
    <div class="onboarding-grid-2" style="margin-bottom:20px;">
      <!-- Society Identity Review Card -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <span>🏛️</span>
            <span>Society Identity</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Router.go('onboarding-1')">✏️ Edit</button>
        </div>
        <div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">${state.society.name || 'Unnamed Society'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
          Reg. No: <strong>${state.society.registrationNo || 'Pending'}</strong> · ${state.society.city}
        </div>
        <div style="font-size:11px;color:var(--blue);font-weight:600;margin-bottom:6px;">
          ${isCGHS ? '🏛️ Cooperative Group Housing (CGHS)' : state.society.housingType}
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">📍 ${state.society.address || 'Address configured'}, ${state.society.pincode}</div>
        <div style="font-size:11.5px;color:#059669;font-weight:600;">🗺️ Google Maps: ${state.society.mapLocation ? '✓ Live Pinpoint Configured' : 'Can be added later from dashboard'}</div>
      </div>

      <!-- Admin Account Review Card -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <span>👑</span>
            <span>Primary RWA Administrator</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Router.go('onboarding-1')">✏️ Edit</button>
        </div>
        <div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">${state.admin.name || 'Administrator'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Designation: <strong>${state.admin.designation}</strong></div>
        <div style="font-size:12px;color:var(--text-secondary);word-break:break-word;margin-bottom:6px;">📱 Phone: <strong>+91 ${state.admin.phone}</strong> · ✉️ ${state.admin.email || 'No email provided'}</div>
        <div style="font-size:11.5px;color:#059669;font-weight:700;display:flex;align-items:center;gap:6px;">
          <span>🔒 Security PIN:</span>
          <span style="letter-spacing:0.15em;font-size:14px;">••••</span>
          <span style="font-weight:500;color:#64748B;">(Bcrypt-12 encrypted)</span>
        </div>
      </div>

      <!-- Property Structure Review Card -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <span>${isCGHS ? '🏛️' : '🏢'}</span>
            <span>Property Architecture</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Router.go('onboarding-2')">✏️ Edit</button>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:8px;">
          <div><strong style="font-size:18px;color:var(--blue);">${blocks.length}</strong> <span style="font-size:12px;color:var(--text-muted);">${isCGHS ? 'Blocks/Wings' : 'Towers'}</span></div>
          <div><strong style="font-size:18px;color:var(--purple);">${units.length}</strong> <span style="font-size:12px;color:var(--text-muted);">Total Units</span></div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);word-break:break-word;">
          ${blocks.map(b => `${b.name} (${(parseInt(b.floors)||0)*(parseInt(b.unitsPerFloor)||0)} flats)`).join(' · ')}
        </div>
      </div>

      <!-- Members Roster Review Card -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:var(--r-lg);padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <span>👥</span>
            <span>Member Directory Roster</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Router.go('onboarding-3')">✏️ Edit</button>
        </div>
        <div style="font-size:16px;font-weight:800;color:var(--green);margin-bottom:4px;">
          ${members.length} Members Imported
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">
          ${state.members.stats?.owners || 0} Flat Owners · ${state.members.stats?.tenants || 0} Tenants
        </div>
        <div style="font-size:11px;color:var(--blue);">✓ Roster mapped with unit numbers & phone numbers</div>
      </div>
    </div>

    <!-- Final Launch CTA Callout Banner -->
    <div style="background:radial-gradient(circle at 10% 10%, rgba(245,154,8,0.12) 0%, transparent 45%), radial-gradient(circle at 90% 90%, rgba(16,185,129,0.08) 0%, transparent 45%), #FFFFFF;border:1px solid rgba(245,154,8,0.3);box-shadow:0 12px 36px rgba(15,23,42,0.06);border-radius:var(--r-lg);padding:30px;text-align:center;">
      <div style="font-size:38px;margin-bottom:10px;">🚀</div>
      <h3 style="font-size:21px;font-weight:900;color:var(--text-primary);margin-bottom:8px;letter-spacing:-0.02em;">
        Everything is ready to launch ${state.society.name || 'Your Society'}!
      </h3>
      <p style="font-size:13.5px;color:var(--text-secondary);max-width:580px;margin:0 auto 24px;line-height:1.6;">
        Clicking launch will create the organization record, provision all ${units.length} property flats, register your members, initialize the ledger, and grant you full RWA Admin privileges.
      </p>
      <button id="launchCardBtn" class="btn btn-primary" onclick="submitSocietyOnboarding()" style="padding:14px 32px;font-size:15px;font-weight:800;background:linear-gradient(135deg, #111827 0%, #1F2937 100%);color:#F59A08;border:1px solid rgba(245,154,8,0.45);box-shadow:0 8px 24px rgba(0,0,0,0.2);gap:10px;max-width:100%;white-space:normal;line-height:1.3;">
        <span>🚀 Launch Society & Go to Admin Dashboard</span>
      </button>
    </div>
  `);
};

