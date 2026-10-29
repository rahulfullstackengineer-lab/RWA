// ============================================================
// Resident Portal: Dedicated Resident Login & Flat Onboarding
// ============================================================

window.Screens = window.Screens || {};
var Screens = window.Screens;
window.__cachedSocietiesList = [];
window.__cachedSocietyStructure = null;

// Pitch slides for Resident Cutora Cinematic Experience
window.RESIDENT_PITCH_SLIDES = [
  {
    line1: 'Your Society Home.',
    line2: 'Right in Your Pocket.',
    sub: 'Pay maintenance bills via 1-click UPI, pre-approve visitor gate passes, book clubhouse amenities, and stay connected with your community.'
  },
  {
    line1: 'Instant 1-Click UPI.',
    line2: 'Zero Fee Dues Payment.',
    sub: 'Receive maintenance invoices directly on WhatsApp. Download GST-compliant receipts instantly to your phone.'
  },
  {
    line1: 'Digital Gate Passes.',
    line2: 'Pre-Approve Visitors Fast.',
    sub: 'Send instant gate passes for guests, delivery couriers, and cabs with automatic entry notification to your phone.'
  }
];

// 1. Dedicated Resident Login Screen (Cutora Cinematic Design)
Screens['resident-login'] = function() {
  const lastPhone = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_login_phone')) || '';

  return `
    <div class="cutora-auth-screen resident-mode fade-in" id="cutoraResidentContainer">
      <!-- Motion: 4s seamless upward glide loop -->
      <video
        id="resHeroVideo"
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

      <!-- Readability: 150u left wash, 140u top wash, 420u warm bottom wash with subtle emerald tone -->
      <div class="cutora-overlay" style="background:linear-gradient(90deg, rgba(6, 78, 59, 0.6) 0%, rgba(0, 0, 0, 0.35) calc(150 * var(--u)), transparent calc(450 * var(--u))), linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) calc(140 * var(--u)), transparent calc(300 * var(--u))), linear-gradient(0deg, rgba(6, 78, 59, 0.42) 0%, transparent calc(420 * var(--u)));"></div>

      <!-- Hero Column (Left, White Typography) -->
      <div class="cutora-hero-col">
        <!-- Top Bar (57u from top, 92.5u from left) -->
        <div class="cutora-topbar">
          <div class="cutora-brand" onclick="Router.go('resident-login')">
            <div class="cutora-brand-tile" style="background:#064E3B;border:1px solid rgba(52,211,153,0.3);">
              <span class="cutora-brand-glyph">🏠</span>
            </div>
            <span class="cutora-brand-text">Cutora · Resident</span>
          </div>

          <a class="cutora-top-link" onclick="Router.go('auth-login')" title="Open RWA Admin Portal">
            <span>← RWA Admin Portal</span>
          </a>
        </div>

        <!-- Pitch (Bottom-Left) -->
        <div class="cutora-pitch">
          <div class="cutora-headline-clip">
            <span id="resHeroHeadline1" class="cutora-headline-line line-1">${window.RESIDENT_PITCH_SLIDES[0].line1}</span>
          </div>
          <div class="cutora-headline-clip">
            <span id="resHeroHeadline2" class="cutora-headline-line line-2">${window.RESIDENT_PITCH_SLIDES[0].line2}</span>
          </div>

          <p id="resHeroSubline" class="cutora-subline">
            ${window.RESIDENT_PITCH_SLIDES[0].sub}
          </p>

          <!-- Slider Dots (35.5u below, emerald 34.5x9 pill + two 9u white dots) -->
          <div class="cutora-slider-row" id="resSliderDots">
            <button class="cutora-dot active" data-slide="0" onclick="window.selectResidentSlide(0)" title="Society Home" aria-label="Slide 1"></button>
            <button class="cutora-dot" data-slide="1" onclick="window.selectResidentSlide(1)" title="1-Click UPI Dues" aria-label="Slide 2"></button>
            <button class="cutora-dot" data-slide="2" onclick="window.selectResidentSlide(2)" title="Digital Gate Passes" aria-label="Slide 3"></button>
          </div>

          <!-- Verified Resident Trust Metrics -->
          <div class="cutora-metrics">
            <div>
              <div class="cutora-metric-val">1,00,000<span>+</span></div>
              <div class="cutora-metric-label">Verified Residents</div>
            </div>
            <div>
              <div class="cutora-metric-val">500<span>+</span></div>
              <div class="cutora-metric-label">Connected RWAs</div>
            </div>
            <div>
              <div class="cutora-metric-val">100<span>%</span></div>
              <div class="cutora-metric-label">Secure & Encrypted</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Card Panel (742.4u wide, 18u margin top/right, 22.5u bottom) -->
      <div class="cutora-card-panel">
        <div class="cutora-form-wrap">
          <!-- Card Heading & Subline -->
          <h1 class="cutora-card-heading">Welcome Home!</h1>
          <p class="cutora-card-subline">Sign in to access your flat and society services.</p>

          <!-- Top Role Portal Switcher -->
          <div class="cutora-tab-group" style="margin-bottom:calc(12 * var(--u));">
            <button class="cutora-tab-btn" onclick="Router.go('auth-login')">
              <span>🏢</span>
              <span>RWA Admin Portal →</span>
            </button>
            <button class="cutora-tab-btn active resident-active" style="cursor:default;">
              <span>🏠</span>
              <span>Resident Portal</span>
            </button>
          </div>

          <!-- Dynamic Real-Time Status Pill -->
          <div id="resLoginUserStatusPill" style="display:none;margin-bottom:calc(12 * var(--u));"></div>

          <!-- Mobile Number Field -->
          <div class="cutora-field-group">
            <label class="cutora-label" for="resPhoneInput">Your Registered Mobile Number</label>
            <div class="cutora-input-box">
              <div class="cutora-country-code">🇮🇳 +91</div>
              <input
                id="resPhoneInput"
                class="cutora-input"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value="${lastPhone}"
                maxlength="10"
                autocomplete="tel"
                oninput="window.handleResidentPhoneInputCheck(this)"
                onkeydown="if(event.key === 'Enter') (document.getElementById('resPinInput') || document.getElementById('resSetupPinInput') || document.getElementById('resRegNameInput'))?.focus()"
              />
            </div>
          </div>

          <!-- Dynamic Form Body (Switches between Normal Login, First-time PIN setup, and New Resident Registration) -->
          <div id="resCutoraFormBody">
            <!-- 4-to-6 Digit Security PIN Field -->
            <div class="cutora-field-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
                <label class="cutora-label" for="resPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
                <a class="cutora-forgot-link" onclick="window.handleResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;color:#059669;">Set / Reset PIN</a>
              </div>
              <div class="cutora-input-box">
                <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
                <input
                  id="resPinInput"
                  class="cutora-input"
                  type="password"
                  maxlength="6"
                  placeholder="Enter your 4 or 6-digit PIN"
                  autocomplete="current-password"
                  onkeydown="if(event.key === 'Enter') handleResidentPinLogin()"
                />
                <button
                  type="button"
                  class="cutora-eye-btn"
                  onclick="window.togglePinVisibility('resPinInput', 'resPinEyeSlash')"
                  title="Toggle PIN visibility"
                  aria-label="Toggle PIN visibility"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line id="resPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Options Row: 26u Remember Me Checkbox + Help link -->
            <div class="cutora-options-row">
              <label class="cutora-checkbox-label">
                <input
                  type="checkbox"
                  id="resRememberMe"
                  class="cutora-checkbox-input"
                  checked
                />
                <span class="cutora-custom-checkbox">
                  <span class="cutora-checkbox-tick">✓</span>
                </span>
                <span>Remember Me</span>
              </label>
            </div>

            <!-- Primary Sign In Button: Emerald Accent -->
            <button id="resPinSubmitBtn" class="cutora-login-btn" style="background:#059669;color:#FFFFFF;" onclick="window.handleResidentPinLogin()">
              <span>🔒 Sign In with Security PIN →</span>
            </button>
          </div>

          <!-- Footer Line with Link to Resident Onboarding -->
          <div class="cutora-footer-line">
            First time joining your society? <a class="link-emerald" onclick="Router.go('resident-onboard')">Find your flat here →</a>
          </div>
        </div>
      </div>

      <!-- Execution hook to initialize video & slide ticker immediately -->
      <img
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg=="
        onload="window.initCutoraResidentAuth && window.initCutoraResidentAuth()"
        style="display:none;"
      />
    </div>
  `;
};

// Slider Interactive Switcher for Resident Pitch
window.selectResidentSlide = function(idx) {
  window._residentCurrentSlide = idx;
  const slide = window.RESIDENT_PITCH_SLIDES[idx];
  if (!slide) return;

  const h1 = document.getElementById('resHeroHeadline1');
  const h2 = document.getElementById('resHeroHeadline2');
  const sub = document.getElementById('resHeroSubline');
  const dots = document.querySelectorAll('#resSliderDots .cutora-dot');

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

// Initialization hook for Resident Video & Slide Ticker
window.initCutoraResidentAuth = function() {
  const vid = document.getElementById('resHeroVideo');
  if (vid) {
    const markLoaded = () => {
      if (vid.currentTime > 0.05 || vid.readyState >= 3) {
        vid.classList.add('loaded');
      }
    };
    vid.addEventListener('timeupdate', markLoaded);
    vid.addEventListener('playing', () => setTimeout(markLoaded, 120));
    if (vid.currentTime > 0.05) {
      vid.classList.add('loaded');
    }
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }

  if (window._resSlideTimer) {
    clearInterval(window._resSlideTimer);
  }
  window._residentCurrentSlide = 0;
  window._resSlideTimer = setInterval(() => {
    if (document.getElementById('resHeroHeadline1')) {
      const next = ((window._residentCurrentSlide || 0) + 1) % window.RESIDENT_PITCH_SLIDES.length;
      window.selectResidentSlide(next);
    } else {
      clearInterval(window._resSlideTimer);
    }
  }, 7000);

  // Auto-check pre-filled phone number
  const phoneEl = document.getElementById('resPhoneInput');
  if (phoneEl && phoneEl.value && phoneEl.value.replace(/[^0-9]/g, '').length === 10) {
    window.handleResidentPhoneInputCheck(phoneEl);
  }
};

// Direct 1-Click Resident Demo Login
window.quickResidentDemoLogin = function() {
  const demoResident = {
    id: 'resident-demo-1',
    phone: '9876543210',
    name: 'Rahul Sharma (Demo)',
    role: 'RESIDENT',
    organizationId: 'org-demo-1',
    organizationName: 'Palm Heights RWA Sector 48',
    unitId: 'unit-a-402',
    unitNumber: 'A-402',
    block: 'Tower A'
  };
  localStorage.setItem('rwa_token', 'mock_resident_token');
  localStorage.setItem('rwa_user', JSON.stringify(demoResident));
  localStorage.setItem('rwa_current_user', JSON.stringify(demoResident));
  localStorage.setItem('rwa_active_org_id', demoResident.organizationId);
  localStorage.setItem('rwa_active_org_name', demoResident.organizationName);
  document.cookie = `rwa_token=mock_resident_token; path=/; max-age=604800;`;
  document.cookie = `rwa_active_org_id=${demoResident.organizationId}; path=/; max-age=604800;`;
  if (typeof showToast === 'function') {
    showToast('Namaste, Rahul Sharma! Signed in to Flat A-402.', 'success');
  }
  Router.go('resident-dashboard');
};

// 2. Dynamic Real-Time Phone Status Checker for Residents
var _resPhoneCheckDebounce = window._resPhoneCheckDebounce || null;
window.handleResidentPhoneInputCheck = function(el) {
  clearTimeout(_resPhoneCheckDebounce);
  const raw = el.value.replace(/[^0-9]/g, '');
  el.value = raw;

  const statusPill = document.getElementById('resLoginUserStatusPill');
  if (raw.length < 10) {
    if (statusPill) statusPill.style.display = 'none';
    return;
  }

  _resPhoneCheckDebounce = setTimeout(async () => {
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
        if (data.isFirstTime || (!data.hasPin && data.exists)) {
          statusPill.innerHTML = `
            <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:calc(10 * var(--u));padding:calc(8 * var(--u)) calc(12 * var(--u));animation:cardElemRise 0.3s ease;">
              <div style="font-size:calc(12 * var(--u));font-weight:800;color:#065F46;">✨ Welcome, ${data.name}! ${data.unitNumber ? `(Flat ${data.unitNumber})` : ''}</div>
              <div style="font-size:calc(11.5 * var(--u));color:#047857;margin-top:calc(2 * var(--u));">Please set your permanent 4-digit Security PIN to activate your resident portal.</div>
            </div>
          `;
          window.switchToResidentPinSetupMode(raw, data.name || '');
        } else if (data.isNewUser || !data.exists) {
          statusPill.innerHTML = `
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:calc(10 * var(--u));padding:calc(8 * var(--u)) calc(12 * var(--u));animation:cardElemRise 0.3s ease;">
              <div style="font-size:calc(12 * var(--u));font-weight:800;color:#1E40AF;">🏠 New Resident Registration</div>
              <div style="font-size:calc(11.5 * var(--u));color:#1E3A8A;margin-top:calc(2 * var(--u));">No account found for +91 ${raw}. Register below to join your society.</div>
            </div>
          `;
          window.switchToResidentRegisterMode(raw);
        } else {
          statusPill.innerHTML = `
            <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:calc(10 * var(--u));padding:calc(6 * var(--u)) calc(12 * var(--u));display:flex;align-items:center;justify-content:space-between;animation:cardElemRise 0.3s ease;">
              <span style="font-size:calc(12 * var(--u));font-weight:700;color:#065F46;">👋 Welcome back, ${data.name}${data.unitNumber ? ` (Flat ${data.unitNumber})` : ''}</span>
              <span style="font-size:calc(11 * var(--u));background:#D1FAE5;color:#065F46;padding:calc(2 * var(--u)) calc(8 * var(--u));border-radius:calc(6 * var(--u));font-weight:700;">Verified</span>
            </div>
          `;
          window.switchToResidentNormalLoginMode();
        }
      }
    } catch (e) {
      console.warn('Resident phone check failed:', e);
    }
  }, 250);
};

window.switchToResidentPinSetupMode = function(phone, name) {
  const body = document.getElementById('resCutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- 4-Digit Security PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="resSetupPinInput">Create 4-Digit Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="resSetupPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter 4-to-6 digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') document.getElementById('resSetupConfirmPinInput').focus()"
        />
        <button
          type="button"
          class="cutora-eye-btn"
          onclick="window.togglePinVisibility('resSetupPinInput', 'resSetupPinEyeSlash')"
          title="Toggle PIN visibility"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line id="resSetupPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Confirm PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="resSetupConfirmPinInput">Confirm Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">✓ PIN</div>
        <input
          id="resSetupConfirmPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Re-enter your 4-digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') handleSaveResidentPin('${phone}')"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button id="resSetupPinBtn" class="cutora-login-btn" style="background:#059669;color:#FFFFFF;" onclick="window.handleSaveResidentPin('${phone}')">
      <span>🔒 Save PIN & Enter Portal →</span>
    </button>
  `;
};

window.switchToResidentRegisterMode = function(phone) {
  const body = document.getElementById('resCutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- Name Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="resRegNameInput">Your Full Name</label>
      <div class="cutora-input-box">
        <input
          id="resRegNameInput"
          class="cutora-input"
          type="text"
          placeholder="e.g. Ramesh Kumar"
          autocomplete="name"
          onkeydown="if(event.key === 'Enter') document.getElementById('resRegPinInput').focus()"
        />
      </div>
    </div>

    <!-- 4-Digit Security PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="resRegPinInput">Choose 4-Digit Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="resRegPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter 4-to-6 digit PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') document.getElementById('resRegConfirmPinInput').focus()"
        />
        <button
          type="button"
          class="cutora-eye-btn"
          onclick="window.togglePinVisibility('resRegPinInput', 'resRegPinEyeSlash')"
          title="Toggle PIN visibility"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line id="resRegPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Confirm PIN Field -->
    <div class="cutora-field-group">
      <label class="cutora-label" for="resRegConfirmPinInput">Confirm Security PIN</label>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">✓ PIN</div>
        <input
          id="resRegConfirmPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Re-enter your PIN"
          autocomplete="new-password"
          onkeydown="if(event.key === 'Enter') handleRegisterResident('${phone}')"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button id="resRegSubmitBtn" class="cutora-login-btn" style="background:#059669;color:#FFFFFF;" onclick="window.handleRegisterResident('${phone}')">
      <span>🚀 Create Resident Account & Enter →</span>
    </button>
  `;
};

window.switchToResidentNormalLoginMode = function() {
  const body = document.getElementById('resCutoraFormBody');
  if (!body) return;
  body.innerHTML = `
    <!-- 4-to-6 Digit Security PIN Field -->
    <div class="cutora-field-group">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:calc(6 * var(--u));">
        <label class="cutora-label" for="resPinInput" style="margin-bottom:0;">4-to-6 Digit Security PIN</label>
        <a class="cutora-forgot-link" onclick="window.handleResetPinModal()" style="font-size:calc(12.5 * var(--u));cursor:pointer;color:#059669;">Set / Reset PIN</a>
      </div>
      <div class="cutora-input-box">
        <div class="cutora-country-code" style="color:#059669;font-weight:700;">🔒 PIN</div>
        <input
          id="resPinInput"
          class="cutora-input"
          type="password"
          maxlength="6"
          placeholder="Enter your 4 or 6-digit PIN"
          autocomplete="current-password"
          onkeydown="if(event.key === 'Enter') handleResidentPinLogin()"
        />
        <button
          type="button"
          class="cutora-eye-btn"
          onclick="window.togglePinVisibility('resPinInput', 'resPinEyeSlash')"
          title="Toggle PIN visibility"
          aria-label="Toggle PIN visibility"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <line id="resPinEyeSlash" x1="2" y1="2" x2="22" y2="22" style="display:none;stroke:#059669;stroke-width:2.5;"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Options Row: 26u Remember Me Checkbox + Help link -->
    <div class="cutora-options-row">
      <label class="cutora-checkbox-label">
        <input
          type="checkbox"
          id="resRememberMe"
          class="cutora-checkbox-input"
          checked
        />
        <span class="cutora-custom-checkbox">
          <span class="cutora-checkbox-tick">✓</span>
        </span>
        <span>Remember Me</span>
      </label>
    </div>

    <!-- Primary Sign In Button: Emerald Accent -->
    <button id="resPinSubmitBtn" class="cutora-login-btn" style="background:#059669;color:#FFFFFF;" onclick="window.handleResidentPinLogin()">
      <span>🔒 Sign In with Security PIN →</span>
    </button>
  `;
};

window.handleSaveResidentPin = async function(phoneArg) {
  const phone = (phoneArg || document.getElementById('resPhoneInput')?.value || '').trim().replace(/\s+/g, '');
  const pin = document.getElementById('resSetupPinInput')?.value.trim();
  const confirmPin = document.getElementById('resSetupConfirmPinInput')?.value.trim();

  if (!pin || pin.length < 4) {
    showToast('PIN must be at least 4 digits', 'warning');
    return;
  }
  if (pin !== confirmPin) {
    showToast('PIN and Confirm PIN do not match', 'warning');
    return;
  }

  const btn = document.getElementById('resSetupPinBtn');
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
      if (data.isConnected || (data.user.organizationId && data.user.unitId)) {
        Router.go('resident-dashboard');
      } else {
        Router.go('resident-onboard');
      }
    }
  } catch (err) {
    console.error('Save Resident PIN error:', err);
    showToast('Network error saving PIN', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔒 Save PIN & Enter Portal →</span>';
    }
  }
};

window.handleRegisterResident = async function(phoneArg) {
  const phone = (phoneArg || document.getElementById('resPhoneInput')?.value || '').trim().replace(/\s+/g, '');
  const name = document.getElementById('resRegNameInput')?.value.trim();
  const pin = document.getElementById('resRegPinInput')?.value.trim();
  const confirmPin = document.getElementById('resRegConfirmPinInput')?.value.trim();

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

  const btn = document.getElementById('resRegSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>Creating Account...</span>';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, pin, confirmPin, action: 'register', role: 'RESIDENT' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to create account', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🚀 Create Resident Account & Enter →</span>';
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
      showToast(`Welcome, ${data.user.name}! Your resident account and PIN are ready.`, 'success');
      Router.go('resident-onboard');
    }
  } catch (err) {
    console.error('Register resident error:', err);
    showToast('Network error during registration', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🚀 Create Resident Account & Enter →</span>';
    }
  }
};

// 3. Interactive Handlers for Resident Login
window.handleResidentPinLogin = async function() {
  const phoneEl = document.getElementById('resPhoneInput');
  const pinEl = document.getElementById('resPinInput');
  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';
  const pin = pinEl ? pinEl.value.trim() : '';

  if (!phone || phone.length < 10) {
    showToast('Please enter your 10-digit registered mobile number', 'warning');
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (!pin) {
    showToast('Please enter your 4-to-6 digit Security PIN', 'warning');
    if (pinEl) pinEl.focus();
    return;
  }

  const btn = document.getElementById('resPinSubmitBtn');
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
        window.switchToResidentPinSetupMode(phone, data.name || '');
        return;
      }
      if (data.needsRegistration) {
        showToast('No account found. Please register below', 'info');
        window.switchToResidentRegisterMode(phone);
        return;
      }
      showToast(data.error || 'Incorrect Security PIN. Please check and try again, or tap Set/Reset PIN.', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🔒 Sign In with Security PIN →</span>';
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
      if (data.user.organizationName) {
        localStorage.setItem('rwa_active_org_name', data.user.organizationName);
      }
      showToast(`Welcome home, ${data.user.name}!`, 'success');
      if (data.isConnected || (data.user.organizationId && data.user.unitId)) {
        Router.go('resident-dashboard');
      } else {
        Router.go('resident-onboard');
      }
    }
  } catch (err) {
    console.error('Resident PIN login error:', err);
    showToast('Network error during login', 'warning');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔒 Sign In with Security PIN →</span>';
    }
  }
};

window.handleResidentAuthSubmit = async function(channel = 'whatsapp') {
  const otpSec = document.getElementById('resOtpSection');
  const isOtpVisible = otpSec && otpSec.style.display !== 'none';

  if (!isOtpVisible) {
    await sendResidentOtp(channel);
  } else {
    await verifyResidentOtp();
  }
};

window.sendResidentOtp = async function(channel = 'whatsapp') {
  const phoneEl = document.getElementById('resPhoneInput');
  const phone = phoneEl ? phoneEl.value.trim().replace(/\s+/g, '') : '';

  if (!phone || phone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'warning');
    return;
  }

  localStorage.setItem('rwa_login_phone', phone);
  localStorage.setItem('rwa_otp_channel', 'whatsapp');

  const waBtn = document.getElementById('resWhatsAppBtn');
  if (waBtn) {
    waBtn.disabled = true;
    waBtn.innerHTML = '<span>⏳</span><span>Sending WhatsApp OTP...</span>';
  }

  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, action: 'send', channel: 'whatsapp' }),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to send OTP', 'warning');
      if (waBtn) {
        waBtn.disabled = false;
        waBtn.innerHTML = '<span style="font-size:16px;">💬</span><span>Send OTP on WhatsApp →</span>';
      }
      return;
    }

    showToast(`💬 OTP sent via WhatsApp to +91 ${phone}`, 'success');
    if (data.devCode) {
      showToast(`🔑 Dev OTP for testing: ${data.devCode}`, 'info');
    }

    const otpSec = document.getElementById('resOtpSection');
    if (otpSec) otpSec.style.display = 'block';

    const waHelper = document.getElementById('resWaHelper');
    const waLink = document.getElementById('resWaLink');
    if (waHelper) waHelper.style.display = 'block';
    if (waLink && data.waLink) {
      waLink.href = data.waLink;
    }

    const otpInput = document.getElementById('resOtpInput');
    if (otpInput) {
      otpInput.value = data.devCode || '123456';
      otpInput.focus();
    }

    if (waBtn) {
      waBtn.disabled = false;
      waBtn.innerHTML = '<span style="font-size:16px;">💬</span><span>Send OTP on WhatsApp →</span>';
    }
  } catch (err) {
    console.error('Resident OTP error:', err);
    showToast('Network error sending OTP', 'warning');
    if (waBtn) {
      waBtn.disabled = false;
      waBtn.innerHTML = '<span style="font-size:16px;">💬</span><span>Send OTP on WhatsApp →</span>';
    }
  }
};

window.verifyResidentOtp = async function() {
  const phone = (localStorage.getItem('rwa_login_phone') || '').replace(/\s+/g, '');
  const otpInput = document.getElementById('resOtpInput');
  const code = otpInput ? otpInput.value.trim() : '123456';

  if (!code || code.length < 4) {
    showToast('Please enter the 6-digit OTP code', 'warning');
    return;
  }

  const btn = document.getElementById('resSubmitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Verifying...';
  }

  try {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, action: 'verify' }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Invalid OTP. Please try again.', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verify OTP & Continue →';
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
      if (data.user.organizationId) {
        localStorage.setItem('rwa_active_org_id', data.user.organizationId);
        document.cookie = `rwa_active_org_id=${data.user.organizationId}; path=/; max-age=604800;`;
      }
      if (data.user.organizationName) {
        localStorage.setItem('rwa_active_org_name', data.user.organizationName);
      }
    }

    // Check if resident is already connected with a flat in a society
    if (data.isConnected && data.user.organizationId && data.user.unitId) {
      showToast(`Welcome back, ${data.user.name}! Connected to Flat ${data.user.unitNumber || ''}.`, 'success');
      Router.go('resident-dashboard');
    } else {
      showToast('Mobile verified! Please select your society and flat.', 'info');
      Router.go('resident-onboard');
    }
  } catch (err) {
    console.error('Verify resident OTP error:', err);
    showToast('Verification failed. Please try again.', 'warning');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Verify OTP & Continue →';
    }
  }
};


// 3. Resident Onboarding Screen: Select Society & Flat from Property Structure
Screens['resident-onboard'] = function() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rwa_user') || '{}');
  } catch (e) {}

  const userPhone = user?.phone || localStorage.getItem('rwa_login_phone') || '';
  const currentName = user?.name && !user.name.startsWith('Resident ') ? user.name : '';
  const isAlreadyConnected = Boolean(user?.organizationId && user?.unitId);
  const currentUnitStr = user?.unitNumber ? `Unit ${user.unitNumber}` : '';
  const currentOrgStr = user?.organizationName || '';

  setTimeout(() => {
    window.loadOnboardSocieties();
  }, 50);

  return `
    <style>
      .resident-onboard-screen {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background-color: #140A00;
        background-image: url('/cutora-plate.jpg'), url('https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e781b542-a83d-4cf2-a66a-44085485865d.jpg');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 500;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }
      .resident-onboard-screen::-webkit-scrollbar {
        width: 5px;
      }
      .resident-onboard-screen::-webkit-scrollbar-track {
        background: transparent;
      }
      .resident-onboard-screen::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.4);
        border-radius: 4px;
      }
      body.mobile-frame-view .resident-onboard-screen {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 36px !important;
        z-index: 100 !important;
      }
      .resident-onboard-header {
        background: var(--bg-surface);
        border-bottom: 1px solid var(--border);
        padding: 14px 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 20;
        box-shadow: var(--shadow-xs);
      }
      .header-main-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 10px;
      }
      .header-meta-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 8px;
      }
      body.mobile-frame-view .resident-onboard-header {
        padding: 44px 14px 10px !important;
        gap: 6px !important;
      }
      @media (max-width: 768px) {
        .resident-onboard-header {
          padding: 12px 14px 8px !important;
          gap: 6px !important;
        }
      }
      .resident-onboard-main {
        flex: 1;
        max-width: 1080px;
        width: 100%;
        margin: 22px auto 70px;
        padding: 0 20px;
        box-sizing: border-box;
      }
      .resident-onboard-grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 24px;
        align-items: start;
      }
      .resident-onboard-sidebar {
        position: sticky;
        top: 84px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .resident-onboard-form-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-xl);
        padding: 28px;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .step-body-content {
        margin-left: 36px;
      }
      .form-fields-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .occupancy-radio-card {
        border: 1.5px solid var(--border);
        border-radius: var(--r-md);
        padding: 13px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        background: var(--bg-surface);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .occupancy-radio-card:hover {
        border-color: var(--green);
        background: var(--bg-hover);
      }
      .occupancy-radio-card.active {
        border-color: var(--green);
        background: var(--green-light);
        box-shadow: 0 0 0 1px var(--green);
      }

      @media (max-width: 860px) {
        .resident-onboard-grid {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
        }
        .resident-onboard-sidebar {
          position: static !important;
          width: 100% !important;
        }
        .resident-onboard-main {
          margin: 12px auto 50px !important;
          padding: 0 12px !important;
        }
        .resident-onboard-form-card {
          padding: 18px 14px !important;
          gap: 16px !important;
          border-radius: var(--r-lg) !important;
        }
        .step-body-content {
          margin-left: 0 !important;
          margin-top: 10px !important;
        }
        .form-fields-2col {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        .digital-card-inner {
          padding: 16px 14px !important;
        }
        .digital-unit-text {
          font-size: 20px !important;
        }
      }

      body.mobile-frame-view .resident-onboard-grid {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
      }
      body.mobile-frame-view .resident-onboard-sidebar {
        position: static !important;
        width: 100% !important;
      }
      body.mobile-frame-view .resident-onboard-main {
        margin: 8px auto 40px !important;
        padding: 0 10px !important;
      }
      body.mobile-frame-view .resident-onboard-form-card {
        padding: 16px 12px !important;
        gap: 14px !important;
        border-radius: var(--r-lg) !important;
      }
      body.mobile-frame-view .step-body-content {
        margin-left: 0 !important;
        margin-top: 10px !important;
      }
      body.mobile-frame-view .form-fields-2col {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      body.mobile-frame-view .digital-card-inner {
        padding: 14px 12px !important;
      }
      body.mobile-frame-view .digital-unit-text {
        font-size: 19px !important;
      }
    </style>

    <div class="resident-onboard-screen fade-in">
      
      <!-- Top Navigation Bar -->
      <header class="resident-onboard-header">
        <div class="header-main-bar">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <div style="width:34px;height:34px;background:#10B981;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;color:#fff;box-shadow:0 4px 12px rgba(16,185,129,0.3);flex-shrink:0;">
              🏠
            </div>
            <div style="min-width:0;">
              <div style="font-size:14px;font-weight:800;color:var(--text-primary);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                RWA Resident Portal
              </div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${isAlreadyConnected ? 'Change Society Flat' : 'Flat Onboarding'}
              </div>
            </div>
          </div>

          <div style="flex-shrink:0;">
            ${isAlreadyConnected ? `
              <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-dashboard')" style="font-size:11px;font-weight:600;padding:5px 10px;">
                ← Back
              </button>
            ` : `
              <button class="btn btn-ghost btn-sm" onclick="Router.go('resident-login')" style="font-size:11px;font-weight:600;padding:5px 10px;">
                ← Back
              </button>
            `}
          </div>
        </div>

        <div class="header-meta-bar">
          <span class="badge badge-green" style="font-size:10px;padding:3px 8px;">
            ${isAlreadyConnected ? '🔄 Switch Flat' : '✨ First-Time Setup'}
          </span>

          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-full);padding:3px 10px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;">
            <span style="color:var(--green);font-size:11px;">●</span>
            <span style="color:var(--text-muted)">Verified:</span>
            <strong style="color:var(--text-primary)">+91 ${userPhone || '—'}</strong>
          </div>
        </div>
      </header>

      <!-- Main Centered Content Container -->
      <main class="resident-onboard-main">
        
        ${isAlreadyConnected ? `
          <!-- Notice for changing flat -->
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%);border:1px solid rgba(16,185,129,0.25);border-radius:var(--r-lg);padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <span style="font-size:20px;flex-shrink:0;">ℹ️</span>
              <div style="min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  Currently linked: ${currentUnitStr} · ${currentOrgStr}
                </div>
                <div style="font-size:11px;color:var(--text-secondary);">
                  Select a new society and flat below if you wish to change registered flat.
                </div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-dashboard')" style="flex-shrink:0;font-size:11px;padding:5px 10px;">
              Keep Current Flat
            </button>
          </div>
        ` : ''}

        <div class="resident-onboard-grid">
          
          <!-- LEFT COLUMN: Live Connection Preview & Benefits -->
          <div class="resident-onboard-sidebar">
            
            <!-- Digital Flat Card -->
            <div class="digital-card-inner" style="background:linear-gradient(145deg, #064E3B 0%, #065F46 50%, #047857 100%);border-radius:var(--r-xl);padding:20px 18px;color:#FFFFFF;box-shadow:0 10px 28px -4px rgba(6,95,70,0.35);position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.12);">
              <div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(52,211,153,0.25);border-radius:50%;filter:blur(30px);pointer-events:none;"></div>

              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                  <div style="width:30px;height:30px;background:rgba(255,255,255,0.18);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">
                    🏢
                  </div>
                  <div style="min-width:0;">
                    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#A7F3D0;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      Digital Flat Card
                    </div>
                    <div style="font-size:10px;color:#D1FAE5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      Real-Time Roster Preview
                    </div>
                  </div>
                </div>
                <span class="badge badge-green" id="summaryRoleBadge" style="font-size:10px;padding:3px 8px;background:rgba(255,255,255,0.2);color:#FFFFFF;border:1px solid rgba(255,255,255,0.3);flex-shrink:0;">
                  🏡 Flat Owner
                </span>
              </div>

              <!-- Big Unit Display -->
              <div style="background:rgba(0,0,0,0.22);border-radius:var(--r-md);padding:12px 14px;border:1px solid rgba(255,255,255,0.12);margin-bottom:12px;">
                <div style="font-size:10px;color:#A7F3D0;font-weight:600;margin-bottom:2px;">Registered Residence</div>
                <div id="summaryUnitDisplay" class="digital-unit-text" style="font-size:22px;font-weight:800;color:#34D399;letter-spacing:-0.02em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  Select Your Flat
                </div>
                <div id="summaryBlockName" style="font-size:12px;color:#D1FAE5;margin-top:2px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  All Towers / Blocks
                </div>
              </div>

              <!-- Society & Contact Meta -->
              <div style="display:flex;flex-direction:column;gap:6px;font-size:11px;border-top:1px solid rgba(255,255,255,0.15);padding-top:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <span style="color:#A7F3D0;flex-shrink:0;">Society:</span>
                  <strong id="summarySocietyName" style="color:#FFFFFF;max-width:170px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Choose Society...</strong>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <span style="color:#A7F3D0;flex-shrink:0;">Verified Phone:</span>
                  <strong style="color:#FFFFFF;white-space:nowrap;">+91 ${userPhone || '—'}</strong>
                </div>
              </div>
            </div>

            <!-- Verification & Safety Badges -->
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow-xs);">
              <div style="display:flex;align-items:flex-start;gap:8px;">
                <span style="font-size:16px;flex-shrink:0;">🛡️</span>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.4;">
                  <strong style="color:var(--text-primary);display:block;margin-bottom:1px;">Verified Roster Sync</strong>
                  Your mobile number will be mapped directly to this flat in the society master database.
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px;">
                <span style="font-size:16px;flex-shrink:0;">🔔</span>
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.4;">
                  <strong style="color:var(--text-primary);display:block;margin-bottom:1px;">Instant Admin Alert</strong>
                  The RWA Committee receives a live notification when you connect.
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: 3-Step Flat Connection Form -->
          <div class="resident-onboard-form-card">
            
            <!-- Step 1: Select Society -->
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                <span style="width:26px;height:26px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">1</span>
                <label class="form-label" style="font-size:14px;font-weight:700;margin-bottom:0;color:var(--text-primary);">
                  Select Your Society / Apartment Complex *
                </label>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">
                Choose the registered RWA society where you reside or own an apartment.
              </div>
              <div class="step-body-content">
                <select id="onboardSocietySelect" class="form-select" style="width:100%;font-size:14px;padding:11px 12px;border-radius:var(--r-md);font-weight:600;" onchange="handleOnboardSocietySelect(this.value)">
                  <option value="">Loading registered societies...</option>
                </select>
              </div>
            </div>

            <!-- Step 2: Property Structure Flat Selection -->
            <div id="propertyStructureSection" style="display:none;background:var(--bg-elevated);padding:18px 16px;border-radius:var(--r-lg);border:1px solid var(--border-light);flex-direction:column;gap:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:26px;height:26px;border-radius:50%;background:var(--green-light);color:var(--green);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">2</span>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">
                  Flat Location in Society (Property Structure)
                </div>
              </div>

              <div class="step-body-content" style="display:flex;flex-direction:column;gap:14px;">
                <div class="form-fields-2col">
                  <div>
                    <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:4px;">Tower / Block</label>
                    <select id="onboardBlockSelect" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;" onchange="handleOnboardBlockSelect(this.value)">
                      <option value="">All Towers / Blocks</option>
                    </select>
                  </div>

                  <div>
                    <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:4px;">Flat / Unit Number *</label>
                    <select id="onboardUnitSelect" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;font-weight:700;" onchange="handleOnboardUnitSelect(this.value)">
                      <option value="">-- Select Your Flat --</option>
                    </select>
                  </div>
                </div>

                <!-- Living Status segmented radio cards -->
                <div>
                  <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:6px;">I am residing in this flat as:</label>
                  <div class="form-fields-2col">
                    <label class="occupancy-radio-card active" id="labelOccupancyOwner" style="padding:10px 12px;">
                      <input type="radio" name="onboardOccupancy" value="OWNER" checked onchange="handleOccupancyChange('OWNER')" style="accent-color:var(--green);width:16px;height:16px;" />
                      <div>
                        <div style="font-size:13px;font-weight:700;color:var(--text-primary);">🏡 Flat Owner</div>
                        <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">I own this apartment</div>
                      </div>
                    </label>

                    <label class="occupancy-radio-card" id="labelOccupancyTenant" style="padding:10px 12px;">
                      <input type="radio" name="onboardOccupancy" value="TENANT" onchange="handleOccupancyChange('TENANT')" style="accent-color:var(--green);width:16px;height:16px;" />
                      <div>
                        <div style="font-size:13px;font-weight:700;color:var(--text-primary);">🔑 Tenant</div>
                        <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">I live here on rent</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: Resident Details -->
            <div id="residentDetailsSection" style="display:none;background:var(--bg-elevated);padding:18px 16px;border-radius:var(--r-lg);border:1px solid var(--border-light);flex-direction:column;gap:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:26px;height:26px;border-radius:50%;background:var(--amber-light);color:var(--amber);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">3</span>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">
                  Resident Contact Information
                </div>
              </div>

              <div class="step-body-content" style="display:flex;flex-direction:column;gap:12px;">
                <div>
                  <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:4px;">Full Name *</label>
                  <input type="text" id="onboardResidentName" class="form-input" value="${currentName}" placeholder="e.g. Gurpreet Singh" style="width:100%;font-size:14px;padding:9px 12px;" required />
                </div>

                <div class="form-fields-2col">
                  <div>
                    <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:4px;">Verified Mobile Number</label>
                    <input type="tel" id="onboardResidentPhone" class="form-input" value="${userPhone ? `+91 ${userPhone}` : ''}" placeholder="10-digit mobile number" ${userPhone ? 'disabled' : 'required'} style="width:100%;font-size:13px;padding:9px 12px;background:var(--bg-surface);color:${userPhone ? 'var(--text-muted)' : 'var(--text-primary)'};font-weight:600;" />
                  </div>
                  <div>
                    <label class="form-label" style="font-size:11px;font-weight:700;margin-bottom:4px;">Email Address (Optional)</label>
                    <input type="email" id="onboardResidentEmail" class="form-input" placeholder="resident@gmail.com" style="width:100%;font-size:13px;padding:9px 12px;" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Section -->
            <div id="submitSection" style="display:none;margin-top:6px;">
              <button id="btnConnectFlatSubmit" class="btn btn-primary w-full" style="justify-content:center;padding:14px 16px;font-size:15px;font-weight:800;background:var(--green);border-color:var(--green);box-shadow:0 6px 20px rgba(16,185,129,0.35);border-radius:var(--r-md);transition:all 0.2s;" onclick="submitResidentFlatConnection()">
                🚀 Connect to Flat & Enter Society Portal →
              </button>
              
              <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:12px;flex-wrap:wrap;text-align:center;">
                <span style="font-size:11px;color:var(--text-muted);">
                  🔔 Society administration will receive an instant verification notification.
                </span>
                ${isAlreadyConnected ? `
                  <button class="btn btn-ghost btn-sm" onclick="Router.go('resident-dashboard')" style="font-size:11px;color:var(--text-secondary);">
                    Cancel & Return
                  </button>
                ` : ''}
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  `;
};

// 4. API Loading and Logic for Onboarding
window.loadOnboardSocieties = async function() {
  const select = document.getElementById('onboardSocietySelect');
  if (!select) return;

  try {
    const res = await fetch('/api/public/societies');
    const data = await res.json();

    if (!res.ok || !data.societies || data.societies.length === 0) {
      select.innerHTML = '<option value="">No registered societies found</option>';
      return;
    }

    window.__cachedSocietiesList = data.societies;

    select.innerHTML = `
      <option value="">-- Choose your Society / Apartment Complex --</option>
      ${data.societies.map(s => `
        <option value="${s.id}">${s.name} (${s.city || 'Chandigarh'}) · ${s.totalUnits || 0} Flats</option>
      `).join('')}
    `;

    // Auto-select society if user already belongs to one or if only one exists
    let userOrgId = null;
    try {
      const u = JSON.parse(localStorage.getItem('rwa_user') || '{}');
      userOrgId = u?.organizationId || localStorage.getItem('rwa_active_org_id');
    } catch (e) {}

    const targetOrgId = userOrgId && data.societies.some(s => s.id === userOrgId)
      ? userOrgId
      : (data.societies.length === 1 ? data.societies[0].id : null);

    if (targetOrgId) {
      select.value = targetOrgId;
      window.handleOnboardSocietySelect(targetOrgId);
    }
  } catch (err) {
    console.error('Error loading societies for onboarding:', err);
    select.innerHTML = '<option value="">Failed to load societies</option>';
  }
};

window.handleOnboardSocietySelect = async function(orgId) {
  const propSec = document.getElementById('propertyStructureSection');
  const resSec = document.getElementById('residentDetailsSection');
  const subSec = document.getElementById('submitSection');
  const blockSelect = document.getElementById('onboardBlockSelect');
  const unitSelect = document.getElementById('onboardUnitSelect');

  if (!orgId) {
    if (propSec) propSec.style.display = 'none';
    if (resSec) resSec.style.display = 'none';
    if (subSec) subSec.style.display = 'none';
    updateLiveSummary();
    return;
  }

  if (blockSelect) blockSelect.innerHTML = '<option value="">Loading blocks...</option>';
  if (unitSelect) unitSelect.innerHTML = '<option value="">Loading flats...</option>';
  if (propSec) propSec.style.display = 'flex';

  try {
    const res = await fetch(`/api/public/societies?orgId=${orgId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to load property structure', 'warning');
      return;
    }

    window.__cachedSocietyStructure = data;

    // Populate Blocks dropdown
    if (blockSelect) {
      blockSelect.innerHTML = `
        <option value="">All Towers / Blocks (${data.blocks.length})</option>
        ${data.blocks.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
      `;
    }

    // Populate Units dropdown
    renderOnboardUnitsList(data.units);

    if (resSec) resSec.style.display = 'flex';
    if (subSec) subSec.style.display = 'block';

    updateLiveSummary();
  } catch (err) {
    console.error('Error loading society structure:', err);
    showToast('Failed to load society flats', 'warning');
  }
};

function renderOnboardUnitsList(units) {
  const unitSelect = document.getElementById('onboardUnitSelect');
  if (!unitSelect) return;

  if (!units || units.length === 0) {
    unitSelect.innerHTML = '<option value="">No flats registered in this block</option>';
    return;
  }

  unitSelect.innerHTML = `
    <option value="">-- Select Your Flat Number --</option>
    ${units.map(u => {
      const typeStr = u.unitType ? u.unitType.replace('_', ' ') : 'Flat';
      const occupiedStr = u.hasOwner ? ' (Owner Listed)' : u.hasTenant ? ' (Tenant Listed)' : '';
      return `<option value="${u.id}">Unit ${u.unitNumber} (${typeStr})${occupiedStr}</option>`;
    }).join('')}
  `;

  // If user already has a unitId, auto-select it
  try {
    const u = JSON.parse(localStorage.getItem('rwa_user') || '{}');
    if (u?.unitId && units.some(unit => unit.id === u.unitId)) {
      unitSelect.value = u.unitId;
    }
  } catch (e) {}

  updateLiveSummary();
}

window.handleOnboardBlockSelect = function(blockId) {
  if (!window.__cachedSocietyStructure) return;
  const allUnits = window.__cachedSocietyStructure.units || [];
  const filtered = blockId ? allUnits.filter(u => u.blockId === blockId) : allUnits;
  renderOnboardUnitsList(filtered);
  updateLiveSummary();
};

window.handleOnboardUnitSelect = function(unitId) {
  updateLiveSummary();
};

window.handleOccupancyChange = function(type) {
  const lblOwner = document.getElementById('labelOccupancyOwner');
  const lblTenant = document.getElementById('labelOccupancyTenant');

  if (type === 'OWNER') {
    if (lblOwner) {
      lblOwner.classList.add('active');
    }
    if (lblTenant) {
      lblTenant.classList.remove('active');
    }
  } else {
    if (lblTenant) {
      lblTenant.classList.add('active');
    }
    if (lblOwner) {
      lblOwner.classList.remove('active');
    }
  }
  updateLiveSummary();
};

function updateLiveSummary() {
  const socSelect = document.getElementById('onboardSocietySelect');
  const socText = socSelect && socSelect.selectedIndex > 0 ? socSelect.options[socSelect.selectedIndex].text.split('(')[0].trim() : 'Choose Society...';
  const blockSelect = document.getElementById('onboardBlockSelect');
  const blockText = blockSelect && blockSelect.selectedIndex > 0 ? blockSelect.options[blockSelect.selectedIndex].text : 'All Towers / Blocks';
  const unitSelect = document.getElementById('onboardUnitSelect');
  const unitText = unitSelect && unitSelect.selectedIndex > 0 ? unitSelect.options[unitSelect.selectedIndex].text.split('(')[0].trim() : '';
  const role = document.querySelector('input[name="onboardOccupancy"]:checked')?.value || 'OWNER';

  const sumSoc = document.getElementById('summarySocietyName');
  if (sumSoc) sumSoc.textContent = socText;
  const sumBlock = document.getElementById('summaryBlockName');
  if (sumBlock) sumBlock.textContent = blockText;
  
  const sumUnitDisplay = document.getElementById('summaryUnitDisplay');
  if (sumUnitDisplay) {
    sumUnitDisplay.textContent = unitText ? unitText : 'Select Your Flat';
    sumUnitDisplay.style.color = unitText ? '#FFFFFF' : '#34D399';
  }
  
  const sumRole = document.getElementById('summaryRoleBadge');
  if (sumRole) {
    sumRole.textContent = role === 'OWNER' ? '🏡 Flat Owner' : '🔑 Tenant';
  }
}

window.submitResidentFlatConnection = async function() {
  const orgId = document.getElementById('onboardSocietySelect')?.value;
  const unitId = document.getElementById('onboardUnitSelect')?.value;
  const name = document.getElementById('onboardResidentName')?.value.trim();
  const email = document.getElementById('onboardResidentEmail')?.value.trim();
  const occupancyType = document.querySelector('input[name="onboardOccupancy"]:checked')?.value || 'OWNER';

  if (!orgId) {
    showToast('Please select your society', 'warning');
    return;
  }
  if (!unitId) {
    showToast('Please select your flat / unit number', 'warning');
    return;
  }
  if (!name) {
    showToast('Please enter your full name', 'warning');
    return;
  }

  const btn = document.getElementById('btnConnectFlatSubmit');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = 'Connecting Flat to Your Account...';
  }

  try {
    const res = await (window.apiFetch || fetch)('/api/resident/connect-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: orgId,
        unitId,
        occupancyType,
        name,
        email,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Failed to connect flat', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🚀 Connect to Flat & Enter Society Portal →';
      }
      return;
    }

    // Success! Update local storage with full resident user information
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
    }

    if (typeof window.playNotificationSound === 'function') {
      window.playNotificationSound();
    }

    showToast(`🎉 Connected! Welcome to ${data.organization?.name || 'Society'}, Flat ${data.unit?.unitNumber || ''}!`, 'success', true);

    // Sync socket rooms so resident gets instant notifications
    if (typeof window.syncSocketRooms === 'function') {
      window.syncSocketRooms();
    }

    // Navigate to Resident Dashboard
    setTimeout(() => {
      Router.go('resident-dashboard');
    }, 600);
  } catch (err) {
    console.error('Error connecting resident flat:', err);
    showToast('Network error connecting flat', 'warning');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '🚀 Connect to Flat & Enter Society Portal →';
    }
  }
};
