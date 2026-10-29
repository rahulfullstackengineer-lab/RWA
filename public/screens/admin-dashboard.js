// =============================================
// Admin Dashboard Screen — Storeify / Sales Report Style
// High-End Modern Analytics, Line & Donut Graphs, Mobile-First
// =============================================

function formatDashDate(d = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[d.getDay()];
  const monthName = months[d.getMonth()];
  const dateNum = d.getDate();
  const s = ['th', 'st', 'nd', 'rd'];
  const v = dateNum % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return `${dayName}, ${monthName} ${dateNum}${suffix} ${d.getFullYear()}`;
}

window.__dashChartType = 'donut';
window.__dashSelectedPeriod = 'year';
window.__dashTrendData = null;
window.__dashActiveMonthIdx = 3; // Default active tooltip index (Apr)
window.__activeAdIndex = 0;
window.__adAutoRotateTimer = null;

// =============================================
// Sponsored Advertisements, Banners & Video Manager
// Persisted locally, customizable by Super Admin
// =============================================
window.AdsManager = {
  STORAGE_KEY: 'rwa_sponsored_ads',

  getDefaultAds: function() {
    return [
      {
        id: 'ad-tata-ev',
        title: 'Tata Power EZ Charge Fast EV Stations',
        sponsor: 'Tata Power EV Infrastructure',
        tag: 'SPONSORED VIDEO',
        type: 'video',
        badge: '⚡ 25% Off Installation',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80',
        description: 'Deploy dual-gun smart fast EV chargers in your society basement with zero upfront CAPEX. 24/7 smart billing & RFID access for residents.',
        ctaText: 'Book Society Demo',
        ctaLink: 'tel:+918000552233',
        views: 412,
        clicks: 68,
        active: true,
        createdAt: '2026-10-14'
      },
      {
        id: 'ad-apollo-health',
        title: 'Doorstep Full Body Checkup in 30 Mins',
        sponsor: 'Apollo Diagnostics & 24|7',
        tag: 'EXCLUSIVE RESIDENT OFFER',
        type: 'banner',
        badge: 'Flat 40% OFF · Code RWA40',
        bannerUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
        description: 'Certified phlebotomist at your flat in 30 minutes. 72 vital blood tests reported same day on WhatsApp. Doctor tele-consultation included.',
        ctaText: 'Book Health Package',
        ctaLink: 'https://www.apollo247.com',
        views: 689,
        clicks: 124,
        active: true,
        createdAt: '2026-10-15'
      },
      {
        id: 'ad-urban-cleaning',
        title: 'Festival Deep Cleaning & AC Servicing',
        sponsor: 'Urban Company Verified Pros',
        tag: 'VERIFIED PARTNER',
        type: 'banner',
        badge: '₹500 Instant Society Cashback',
        bannerUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        description: 'Society bulk discount: Book 3 flats together and get 30% flat discount + complimentary kitchen sanitization. Background verified pros.',
        ctaText: 'Claim Resident Offer',
        ctaLink: 'tel:18001021234',
        views: 530,
        clicks: 95,
        active: true,
        createdAt: '2026-10-16'
      },
      {
        id: 'ad-airtel-fiber',
        title: '1 Gbps Ultra-Fast Fiber for Society Towers',
        sponsor: 'Airtel Xstream Society Connect',
        tag: 'SPECIAL OFFER',
        type: 'banner',
        badge: 'Free Router + 30 Days Free',
        bannerUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
        description: 'Dedicated optical fiber backbone for Tower A, B & C with 99.9% uptime SLA and 24/7 dedicated society resident care engineer.',
        ctaText: 'Get Connection',
        ctaLink: 'tel:18001030111',
        views: 720,
        clicks: 143,
        active: true,
        createdAt: '2026-10-17'
      }
    ];
  },

  getAll: function() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaults = this.getDefaultAds();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  },

  getActive: function() {
    return this.getAll().filter(a => a.active !== false);
  },

  save: function(adData) {
    const list = this.getAll();
    if (adData.id) {
      const idx = list.findIndex(a => a.id === adData.id);
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], adData);
      } else {
        list.push(adData);
      }
    } else {
      adData.id = 'ad-' + Date.now();
      adData.views = 0;
      adData.clicks = 0;
      adData.createdAt = new Date().toISOString().slice(0, 10);
      adData.active = true;
      list.unshift(adData);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rwa-ads-updated'));
    return adData;
  },

  delete: function(id) {
    let list = this.getAll();
    list = list.filter(a => a.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rwa-ads-updated'));
  },

  toggle: function(id) {
    const list = this.getAll();
    const ad = list.find(a => a.id === id);
    if (ad) {
      ad.active = !ad.active;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('rwa-ads-updated'));
    }
  },

  recordClick: function(id) {
    const list = this.getAll();
    const ad = list.find(a => a.id === id);
    if (ad) {
      ad.clicks = (ad.clicks || 0) + 1;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    }
  },

  recordView: function(id) {
    const list = this.getAll();
    const ad = list.find(a => a.id === id);
    if (ad) {
      ad.views = (ad.views || 0) + 1;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    }
  }
};

Screens['admin-dashboard'] = function() {
  // Schedule live DB hydration immediately after DOM injection
  setTimeout(() => {
    if (typeof window.renderDashChart === 'function') {
      window.renderDashChart(null, 'donut');
    }
    if (typeof window.loadLiveAdminDashboard === 'function') {
      window.loadLiveAdminDashboard();
    }
  }, 10);

  const formattedDate = formatDashDate();

  return Shell.render('admin-dashboard', {
    title: 'Dashboard',
    portal: 'admin',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="showToast('Active billing cycle: ' + (window.__activeBillingMonth || 'Current Month'), 'info')">📅 <span id="dashBillingCycleBtn">Live Cycle</span></button>
      <button class="btn btn-secondary btn-sm" onclick="openBulkUpdateBillsModal()">🔄 Bulk Update</button>
      <button class="btn btn-primary btn-sm" onclick="openGenerateBillsModal()">⚡ Generate Bills</button>
    `,
    content: `
      <!-- 1. Bento Top Dark Section: Payments & Dues Command Center (Resident Bento Architecture) -->
      <div class="res-bento-dark-bar">
        <div class="res-bento-dark-header">
          <div>
            <div class="res-bento-dark-title">
              <span>Payments &amp; Society Ledger</span>
            </div>
            <div class="res-bento-dark-meta">
              <span class="bento-unit-pill">RWA Executive Desk · Financial Overview</span>
              <span style="font-size:12px;color:#94A3B8;font-weight:600;">🛡️ Verified RWA Administration</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="bento-time-dropdown" onclick="showToast('Active billing cycle: ' + (window.__activeBillingMonth || 'Current Month'), 'info')">
              <span>📅 <span id="dashBillingCycleBtn">Live Cycle</span></span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('admin-payments')" style="color:#D8F833;border:1px solid rgba(216,248,51,0.3);border-radius:99px;font-size:11.5px;padding:4px 12px;font-weight:700;">
              View Ledger ↗
            </button>
          </div>
        </div>

        <!-- 4 Bento Metric Cards inside Dark Bar -->
        <div class="res-bento-dark-grid">
          <!-- Card 1: Neon Lime Total Collections & Instant Record Payment -->
          <div class="res-bento-neon-card" onclick="Router.go('admin-payments')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.04em;">Total Collections</span>
              <div class="bento-circle-arrow">↗</div>
            </div>
            <div>
              <div id="dashCollectionsVal" style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#0F172A;line-height:1.1;">₹0</div>
              <div id="dashCollectionsChange" style="font-size:11.5px;font-weight:700;color:#15803D;margin-top:4px;">
                0% collection this month
              </div>
            </div>
            <div style="margin-top:6px;">
              <button class="btn btn-primary btn-xs w-full" style="font-size:11px;padding:4px 8px;font-weight:700;background:#0F172A;color:#FFFFFF;border:none;border-radius:8px;" onclick="event.stopPropagation();openRecordPaymentModal()">
                💵 Record Payment
              </button>
            </div>
          </div>

          <!-- Card 2: Pending Dues -->
          <div class="res-bento-glass-card" onclick="Router.go('admin-invoices')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Pending Dues</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="dashPendingDuesVal" style="font-size:20px;font-weight:800;color:#FFFFFF;line-height:1.2;">₹0</div>
              <div id="dashPendingDuesSubtext" style="font-size:11px;color:#94A3B8;margin-top:4px;">All accounts settled</div>
            </div>
            <div style="font-size:10.5px;color:#FCA5A5;font-weight:600;">Official society overdue ledger</div>
          </div>

          <!-- Card 3: Active Occupancy -->
          <div class="res-bento-glass-card" onclick="Router.go('admin-units')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Active Occupancy</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="dashActiveMembersVal" style="font-size:20px;font-weight:800;color:#FFFFFF;line-height:1.2;">0 / 0</div>
              <div id="dashUnitsOccupancySubtext" style="font-size:11px;color:#94A3B8;margin-top:4px;">0 of 0 Units Occupied</div>
            </div>
            <div id="dashOccupancyRateBadge" style="font-size:10.5px;color:#86EFAC;font-weight:600;">0% Occupied</div>
          </div>

          <!-- Card 4: Complaint Resolution -->
          <div class="res-bento-glass-card" onclick="Router.go('admin-complaints')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Complaint Resolution</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="dashOpenComplaintsVal" style="font-size:20px;font-weight:800;color:#FFFFFF;line-height:1.2;">0%</div>
              <div id="dashUrgentComplaintsSubtext" style="font-size:11px;color:#94A3B8;margin-top:4px;">0 open · 0 resolved</div>
            </div>
            <div style="font-size:10.5px;color:#93C5FD;font-weight:600;">24/7 SLA Facility Monitoring</div>
          </div>
        </div>
      </div>

      <!-- 2. Greeting & Quick Action Bar (Resident Portal Style) -->
      <div class="res-action-bar-card">
        <div style="flex:1;min-width:260px;">
          <div id="dashGreeting" style="font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.02em;">
            Society Overview 👋
          </div>
          <div id="dashDateSubtitle" style="font-size:12.5px;color:#64748B;margin-top:3px;max-width:580px;line-height:1.45;">
            ${formattedDate} · Smart Society Management Ecosystem
          </div>
        </div>
        <div class="res-quick-actions-scroll">
          <button class="res-action-pill-btn primary" onclick="openGenerateBillsModal()">
            ⚡ Generate Bills
          </button>
          <button class="res-action-pill-btn" onclick="openRecordPaymentModal()">
            💵 Record Payment
          </button>
          <button class="res-action-pill-btn" onclick="openPostNoticeModal()">
            📢 Post Notice
          </button>
          <button class="res-action-pill-btn" onclick="openAddMemberModal()">
            👤 Add Member
          </button>
          <button class="res-action-pill-btn" onclick="openBulkUpdateBillsModal()">
            🔄 Bulk Update
          </button>
        </div>
      </div>

      <!-- 3. Main 2-Column Responsive Grid -->
      <div class="dash-modern-grid">

        <!-- Left Column: Large Interactive Graph + Complex Spotlight -->
        <div class="dash-col-left">

          <!-- Large Graph Card: Customer Habits & Financial Trends + DONUT Chart -->
          <div class="dash-chart-card" style="box-sizing: border-box !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; overflow: hidden !important; margin-bottom: 20px;">
            <div class="chart-header-row">
              <div class="chart-title-box">
                <div class="chart-card-title">Customer Habits &amp; Financial Flow</div>
                <div class="chart-card-subtitle">Track collections, billings, member payment habits &amp; fund allocations</div>
              </div>
              <div class="chart-controls-box">
                <div class="chart-type-toggle">
                  <button class="chart-type-btn" id="btnChartBar" onclick="window.switchDashChartType('bar')">📊 Bar</button>
                  <button class="chart-type-btn" id="btnChartLine" onclick="window.switchDashChartType('line')">📈 Line</button>
                  <button class="chart-type-btn active" id="btnChartDonut" onclick="window.switchDashChartType('donut')">🍩 Donut</button>
                </div>
                <select class="dash-select-pill" id="dashChartPeriod" onchange="window.switchDashPeriod(this.value)">
                  <option value="year" selected>This year</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div class="chart-legend-row" id="dashChartLegendRow" style="display:none;">
              <div class="legend-item">
                <span class="legend-dot grey"></span>
                <span>Demand / Billed</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot blue"></span>
                <span>Collections</span>
              </div>
            </div>

            <div class="chart-svg-container" id="dashChartCanvasWrap" style="width: 100% !important; max-width: 100% !important; min-width: 0 !important; overflow: hidden !important; position: relative !important;">
              <div style="height:210px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px;">
                Loading interactive financial chart...
              </div>
            </div>
            <div id="chartTooltip" class="chart-hover-tooltip" style="opacity:0;display:none;"></div>
          </div>

          <!-- Complex Spotlight Card (Resident Bento Architecture) -->
          <div class="res-complex-card" style="margin-bottom: 0;">
            <div class="res-complex-img-wrap">
              <img src="/images/complex.jpg" onerror="this.src='https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'" alt="Residential Complex" class="res-complex-img" />
              <div class="res-complex-badges-overlay">
                <span class="res-complex-pill">🏢 Society Campus · Multi-Block Estate</span>
                <span class="res-complex-pill" style="background:rgba(5,150,105,0.9);">🛡️ 24/7 Security Monitored</span>
              </div>
            </div>

            <div class="res-complex-content">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-size:18px;font-weight:800;color:#0F172A;letter-spacing:-0.01em;">
                    Modern Residential Estate Infrastructure
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:2px;">
                    Smart Society Management &amp; AMC Operations Ecosystem
                  </div>
                </div>
                <button class="bento-circle-arrow-dark" onclick="Router.go('admin-compliance')" style="background:#F1F5F9;color:#0F172A;border:1px solid #E2E8F0;" title="View Complex Compliance">↗</button>
              </div>

              <!-- Quick Stats Row (100% Real Live Data) -->
              <div class="res-complex-stats-row">
                <div class="res-complex-stat-item">
                  <span class="res-complex-stat-label">Total Units</span>
                  <span class="res-complex-stat-val" id="dashComplexUnitsVal">0 Units</span>
                </div>
                <div class="res-complex-stat-item">
                  <span class="res-complex-stat-label">Occupancy</span>
                  <span class="res-complex-stat-val" id="dashComplexOccVal">0%</span>
                </div>
                <div class="res-complex-stat-item">
                  <span class="res-complex-stat-label">Standard Dues</span>
                  <span class="res-complex-stat-val" id="dashComplexDuesVal">₹0 / mo</span>
                </div>
                <div class="res-complex-stat-item">
                  <span class="res-complex-stat-label">Facilities</span>
                  <span class="res-complex-stat-val" id="dashComplexFacilitiesVal">0 Active</span>
                </div>
              </div>

              <!-- Campus Maintenance Utilization Bars (from /api/expenses or allocations) -->
              <div style="background:#F8FAFC;border:1px solid #F1F5F9;border-radius:16px;padding:14px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <span style="font-size:12px;font-weight:700;color:#0F172A;">Campus Maintenance &amp; Fund Utilization</span>
                  <span class="badge badge-green" style="font-size:10px;font-weight:700;">FY 2026-27</span>
                </div>
                <div id="dashCampusMaintBars" style="display:flex;flex-direction:column;gap:7px;">
                  <div style="text-align:center;padding:12px;color:#64748B;font-size:12px;">No campus expenditures recorded for this financial year.</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Society Location Google Map & Admin Broadcasts -->
        <div class="dash-col-right">

          <!-- Card 1: Society Location & Interactive Google Map -->
          <div class="dash-society-map-card" style="background:#FFFFFF;border:1.5px solid #F1F5F9;border-radius:20px;padding:20px 22px;box-shadow:0 10px 25px -5px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.06);margin-bottom:20px;position:relative;overflow:hidden;transition:all 0.25s ease;">
            <!-- Top vibrant accent bar -->
            <div style="position:absolute;top:0;left:0;right:0;height:3.5px;background:linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #10B981 100%);"></div>

            <div class="chart-header-row" style="margin-bottom:15px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="display:flex;align-items:center;gap:11px;">
                <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #BFDBFE;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(37,99,235,0.14);flex-shrink:0;">
                  📍
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                    <span style="font-size:15px;font-weight:800;color:#0F172A;letter-spacing:-0.01em;">Society Campus Location</span>
                    <span id="dashMapStatusBadge" style="background:linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%);color:#059669;border:1px solid #A7F3D0;font-size:9.5px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:2px 8px;border-radius:99px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 1px 2px rgba(16,185,129,0.1);">
                      <span style="width:6px;height:6px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981;"></span>
                      VERIFIED PIN
                    </span>
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:2px;font-weight:500;">Interactive GPS navigation &amp; campus entrance</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;" id="dashMapHeaderActions">
                <button class="btn btn-ghost btn-xs" id="btnUpdateSocietyMap" onclick="window.openSocietyLocationModal()" title="Update Society Location on Maps" style="font-size:11.5px;font-weight:700;color:#334155;padding:5px 11px;border:1px solid #E2E8F0;border-radius:9px;background:#F8FAFC;display:inline-flex;align-items:center;gap:5px;transition:all 0.15s ease;cursor:pointer;">
                  <span>⚙️</span> Edit Pin
                </button>
              </div>
            </div>

            <!-- Dynamic Society Google Map Container -->
            <div id="dashSocietyMapContainer">
              <div style="padding:40px 16px;text-align:center;color:var(--text-muted);font-size:12px;">
                Loading society map...
              </div>
            </div>
          </div>

          <!-- Card 2: Admin Inbox & Society Broadcasts -->
          <div class="dash-inbox-card" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:18px;padding:18px 20px;box-shadow:0 1px 3px rgba(15,23,42,0.04);transition:all 0.2s ease;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div>
                <div style="font-size:15px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:6px;">
                  <span>📬 Admin Inbox &amp; Notices</span>
                  <span class="ad-pill-badge" style="background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;font-size:9.5px;padding:2px 7px;">BROADCASTS</span>
                </div>
                <div style="font-size:12px;color:#64748B;margin-top:2px;">Society circulars &amp; executive updates</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <button class="btn btn-primary btn-xs" onclick="openPostNoticeModal()" style="font-size:11px;padding:4px 9px;border-radius:8px;">
                  + Post
                </button>
                <button class="btn btn-ghost btn-xs" onclick="Router.go('admin-notices')" style="font-size:11px;padding:4px 8px;border-radius:8px;color:#475569;">
                  View all →
                </button>
              </div>
            </div>

            <!-- Dynamic Notice List -->
            <div id="dashAdminInboxList" style="display:flex;flex-direction:column;gap:10px;">
              <div style="padding:20px 16px;text-align:center;color:var(--text-muted);font-size:12px;">
                Loading admin notifications...
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- 3. Bottom Operational Section: Recent Payments & Compliance -->
      <div class="dashboard-bottom-grid" style="margin-bottom:24px;">
        <!-- Recent Payments Container -->
        <div class="card" style="display:flex;flex-direction:column;min-height:350px;">
          <div class="card-header">
            <div class="card-title">Recent Payments</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('admin-payments')">View all →</button>
          </div>
          <div class="timeline dash-bottom-card-scroll" id="dashRecentPaymentsList" style="flex:1;overflow-y:auto;max-height:280px;">
            <div style="padding:28px 16px;text-align:center;color:var(--text-muted);font-size:13px;">
              No recent payments recorded this cycle.
            </div>
          </div>
        </div>

        <!-- Upcoming Compliance Calendar -->
        <div class="card" style="display:flex;flex-direction:column;min-height:350px;">
          <div class="card-header">
            <div class="card-title">Compliance Deadlines</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('admin-compliance')">View all →</button>
          </div>
          <div id="dashComplianceList" class="dash-bottom-card-scroll" style="flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:280px;">
            <div style="padding:28px 16px;text-align:center;color:var(--text-muted);font-size:13px;">
              No compliance deadlines scheduled.
            </div>
          </div>
        </div>

        <!-- Open Complaints Summary -->
        <div class="card" style="display:flex;flex-direction:column;min-height:350px;">
          <div class="card-header">
            <div class="card-title">Open Complaints & SLA</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('admin-complaints')">View all →</button>
          </div>

          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <div style="flex:1;text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--r-md);">
              <div id="dashUrgentPriorityCount" style="font-size:18px;font-weight:800;color:var(--red);">0</div>
              <div style="font-size:10px;color:var(--text-muted);font-weight:700;">Urgent</div>
            </div>
            <div style="flex:1;text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--r-md);">
              <div id="dashHighPriorityCount" style="font-size:18px;font-weight:800;color:var(--amber);">0</div>
              <div style="font-size:10px;color:var(--text-muted);font-weight:700;">High</div>
            </div>
            <div style="flex:1;text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--r-md);">
              <div id="dashMediumPriorityCount" style="font-size:18px;font-weight:800;color:var(--blue);">0</div>
              <div style="font-size:10px;color:var(--text-muted);font-weight:700;">Medium</div>
            </div>
            <div style="flex:1;text-align:center;padding:8px;background:var(--bg-elevated);border-radius:var(--r-md);">
              <div id="dashResolvedCount" style="font-size:18px;font-weight:800;color:var(--green);">0</div>
              <div style="font-size:10px;color:var(--text-muted);font-weight:700;">Resolved</div>
            </div>
          </div>

          <div id="dashRecentComplaintsList" class="dash-bottom-card-scroll" style="flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:220px;">
            <div style="padding:20px 16px;text-align:center;color:var(--text-muted);font-size:13px;">
              No open complaints reported.
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// Interactive Chart Rendering Helpers
// =============================================

window.switchDashChartType = function(type) {
  window.__dashChartType = type;
  const btnBar = document.getElementById('btnChartBar');
  const btnLine = document.getElementById('btnChartLine');
  const btnDonut = document.getElementById('btnChartDonut');
  const legendRow = document.getElementById('dashChartLegendRow') || document.querySelector('.dash-chart-card .chart-legend-row');

  if (btnBar) btnBar.classList.toggle('active', type === 'bar');
  if (btnLine) btnLine.classList.toggle('active', type === 'line');
  if (btnDonut) btnDonut.classList.toggle('active', type === 'donut');

  if (legendRow) {
    legendRow.style.display = (type === 'donut') ? 'none' : 'flex';
  }

  window.renderDashChart(null, type);
};

window.switchDashPeriod = function(period) {
  window.__dashSelectedPeriod = period;
  window.renderDashChart(null, window.__dashChartType || 'donut');
};

window.showDashTooltip = function(event, billed, collected, label, elem) {
  const tooltip = document.getElementById('chartTooltip');
  const wrap = document.getElementById('dashChartCanvasWrap');
  if (!tooltip || !wrap) return;

  const rect = elem.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  let leftPos = rect.left - wrapRect.left + (rect.width / 2);
  const topPos = rect.top - wrapRect.top;

  // Clamp within container boundaries to prevent horizontal overflow on mobile
  const minClamp = Math.min(75, wrapRect.width / 2);
  const maxClamp = Math.max(minClamp, wrapRect.width - 75);
  leftPos = Math.max(minClamp, Math.min(maxClamp, leftPos));

  tooltip.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <span style="width:7px;height:7px;border-radius:50%;background:#94A3B8;display:inline-block;"></span>
      <span>₹${Number(billed).toLocaleString('en-IN')} Billed</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:7px;height:7px;border-radius:50%;background:#3B82F6;display:inline-block;"></span>
      <span>₹${Number(collected).toLocaleString('en-IN')} Collected</span>
    </div>
  `;
  tooltip.style.left = `${leftPos}px`;
  tooltip.style.top = `${topPos}px`;
  tooltip.style.display = 'block';
  tooltip.style.opacity = '1';
};

window.hideDashTooltip = function() {
  const tooltip = document.getElementById('chartTooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
    setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 150);
  }
};

window.renderDashChart = function(data, type) {
  const wrap = document.getElementById('dashChartCanvasWrap');
  if (!wrap) return;

  type = type || window.__dashChartType || 'donut';
  const period = window.__dashSelectedPeriod || (document.getElementById('dashChartPeriod')?.value) || 'year';

  if (type === 'donut') {
    // -------------------------------------------------------------
    // REAL DONUT CHART: Society Expenses & Fund Breakdown
    // -------------------------------------------------------------
    const allExpenses = window.__dashExpenses || [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    // Filter expenses according to selected period
    let filteredExpenses = allExpenses;
    let periodLabel = 'This Year';
    if (period === 'month') {
      periodLabel = 'This Month';
      filteredExpenses = allExpenses.filter(e => {
        const d = new Date(e.createdAt || e.date || now);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      });
    } else if (period === '6m') {
      periodLabel = 'Last 6 Months';
      const sixMonthsAgo = new Date(curYear, curMonth - 5, 1);
      filteredExpenses = allExpenses.filter(e => {
        const d = new Date(e.createdAt || e.date || now);
        return d >= sixMonthsAgo;
      });
    } else {
      periodLabel = 'This Year';
      filteredExpenses = allExpenses.filter(e => {
        const d = new Date(e.createdAt || e.date || now);
        return d.getFullYear() === curYear;
      });
    }

    const categoryColorMap = {
      'Security': '#3B82F6',
      'Maintenance': '#8B5CF6',
      'Plumbing': '#06B6D4',
      'Horticulture': '#10B981',
      'Admin': '#F59E0B',
      'Electrical': '#6366F1',
      'Housekeeping': '#EC4899',
      'Utilities': '#0EA5E9',
      'Lift AMC': '#A855F7',
      'Repairs': '#F97316',
      'Other': '#64748B'
    };

    const categoryLabelMap = {
      'Security': 'Security & Surveillance',
      'Maintenance': 'Facilities & Lifts AMC',
      'Plumbing': 'Water Supply & Plumbing',
      'Horticulture': 'Horticulture & Greenery',
      'Admin': 'Office Administration & Legal',
      'Electrical': 'Power Backup & DG',
      'Housekeeping': 'Campus Sanitation & Hygiene',
      'Utilities': 'STP Pumping & Utilities',
      'Lift AMC': 'Elevator Safety & AMC',
      'Repairs': 'Estate Repairs & Reserve',
      'Other': 'General Operations'
    };

    const catSums = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Maintenance';
      const amt = Number(e.totalAmount || e.amount || 0);
      catSums[cat] = (catSums[cat] || 0) + amt;
    });

    let donutSlices = [];
    let totalAmount = 0;

    const entries = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      totalAmount = entries.reduce((s, [, a]) => s + a, 0);
      let runningPct = 0;
      donutSlices = entries.map(([cat, amt], idx) => {
        const isLast = idx === entries.length - 1;
        const pct = isLast ? Math.max(1, 100 - runningPct) : Math.max(1, Math.round((amt / totalAmount) * 100));
        runningPct += pct;
        return {
          id: cat.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          category: categoryLabelMap[cat] || `${cat} Services`,
          amount: amt,
          pct: pct,
          color: categoryColorMap[cat] || '#3B82F6'
        };
      });
    } else {
      totalAmount = 0;
      donutSlices = [];
    }

    if (donutSlices.length === 0) {
      wrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;flex-direction:column;min-height:220px;text-align:center;padding:24px;color:#64748B;">
          <div style="font-size:36px;margin-bottom:8px;">🍩</div>
          <div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:4px;">No Expense Records Recorded</div>
          <div style="font-size:12px;color:#64748B;max-width:320px;">Expense fund breakdown will populate automatically as society vouchers are entered.</div>
        </div>
      `;
      window.__dashDefaultDonutTotal = '₹0';
      window.__dashDefaultDonutPeriod = periodLabel;
      return;
    }

    // SVG Geometry Calculation
    const radius = 68;
    const circ = 2 * Math.PI * radius; // ~427.256
    let cumulative = 0;
    let circlesSvg = '';

    donutSlices.forEach((slice) => {
      const sliceLen = (slice.pct / 100) * circ;
      const offset = -cumulative;
      cumulative += sliceLen;

      circlesSvg += `
        <circle id="dashDonutSlice_${slice.id}"
                cx="140" cy="115" r="${radius}"
                fill="transparent"
                stroke="${slice.color}"
                stroke-width="28"
                stroke-dasharray="${sliceLen} ${circ - sliceLen}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                transform="rotate(-90 140 115)"
                style="cursor:pointer;transition:stroke-width 0.2s ease, filter 0.2s ease;"
                onmouseenter="window.highlightDashDonutSlice('${slice.id}', '${slice.category}', ${slice.pct}, ${slice.amount})"
                onmouseleave="window.resetDashDonutSlice()"
                onclick="window.highlightDashDonutSlice('${slice.id}', '${slice.category}', ${slice.pct}, ${slice.amount})">
        </circle>
      `;
    });

    const formattedTotal = totalAmount >= 100000
      ? `₹${(totalAmount / 100000).toFixed(2)}L`
      : `₹${Number(totalAmount).toLocaleString('en-IN')}`;

    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:16px;padding:4px 0;">
        <!-- Left: Donut SVG with Interactive Center Hole -->
        <div style="position:relative;width:280px;height:230px;flex-shrink:0;margin:0 auto;">
          <svg viewBox="0 0 280 230" style="width:100%;height:100%;overflow:visible;">
            <circle cx="140" cy="115" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="28" />
            ${circlesSvg}
            <!-- Center Hole White Background -->
            <circle cx="140" cy="115" r="${radius - 17}" fill="#FFFFFF" />
          </svg>
          <div id="dashDonutCenterText" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);text-align:center;pointer-events:none;width:120px;">
            <div id="dashDonutCenterCat" style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;line-height:1.2;">SOCIETY EXPENSES</div>
            <div id="dashDonutCenterAmt" style="font-size:19px;font-weight:800;color:#0F172A;line-height:1.2;margin:2px 0;">${formattedTotal}</div>
            <div id="dashDonutCenterPct" style="font-size:10.5px;font-weight:700;color:#3B82F6;">${periodLabel} · 100%</div>
          </div>
        </div>

        <!-- Right: Rich Interactive Legend Grid -->
        <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <span style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">
              Fund Breakdown &amp; Maintenance Allocation
            </span>
            <span style="font-size:10.5px;font-weight:700;color:#3B82F6;background:#EFF6FF;padding:2px 8px;border-radius:6px;border:1px solid #DBEAFE;">
              ${periodLabel}
            </span>
          </div>
          ${donutSlices.map(s => {
            const displayAmt = s.amount >= 100000 
              ? `₹${(s.amount / 100000).toFixed(2)}L` 
              : s.amount >= 1000 
                ? `₹${(s.amount / 1000).toFixed(0)}k` 
                : `₹${s.amount.toLocaleString('en-IN')}`;
            return `
              <div class="dash-donut-legend-item" id="dashDonutLegend_${s.id}"
                   style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;cursor:pointer;transition:all 0.15s ease;"
                   onmouseenter="window.highlightDashDonutSlice('${s.id}', '${s.category}', ${s.pct}, ${s.amount})"
                   onmouseleave="window.resetDashDonutSlice()"
                   onclick="window.highlightDashDonutSlice('${s.id}', '${s.category}', ${s.pct}, ${s.amount})">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0;"></span>
                  <span style="font-size:12px;font-weight:600;color:#1E293B;">${s.category}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:11px;font-weight:700;color:#64748B;">${displayAmt}</span>
                  <span style="font-size:11px;font-weight:800;color:${s.color};background:#FFFFFF;border:1px solid #E2E8F0;padding:1px 6px;border-radius:6px;">${s.pct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Save default state for reset
    window.__dashDefaultDonutTotal = formattedTotal;
    window.__dashDefaultDonutPeriod = periodLabel;

    return;
  }

  // -------------------------------------------------------------
  // BAR OR LINE GRAPH: Dynamic scaling, period filtering, real data
  // -------------------------------------------------------------
  let months = [];
  if (window.__dashTrendTrends) {
    if (period === 'month') {
      months = window.__dashTrendTrends.month || [];
    } else if (period === '6m') {
      months = window.__dashTrendTrends['6m'] || [];
    } else {
      months = window.__dashTrendTrends.year || [];
    }
  } else if (data && data.length > 0) {
    months = data;
  } else if (window.__dashTrendData && window.__dashTrendData.length > 0) {
    months = window.__dashTrendData;
  } else {
    months = [
      { label: 'Jan', demand: 0, collected: 0 },
      { label: 'Feb', demand: 0, collected: 0 },
      { label: 'Mar', demand: 0, collected: 0 },
      { label: 'Apr', demand: 0, collected: 0 },
      { label: 'May', demand: 0, collected: 0 },
      { label: 'Jun', demand: 0, collected: 0 },
      { label: 'Jul', demand: 0, collected: 0 },
      { label: 'Aug', demand: 0, collected: 0 },
      { label: 'Sep', demand: 0, collected: 0 },
      { label: 'Oct', demand: 0, collected: 0 },
      { label: 'Nov', demand: 0, collected: 0 },
      { label: 'Dec', demand: 0, collected: 0 }
    ];
  }

  // Dynamic maximum calculation
  const rawMax = Math.max(...months.map(m => Math.max(m.demand || 0, m.collected || 0)), 10000);
  const maxVal = Math.ceil(rawMax / 20000) * 20000 || 60000;

  const width = 640;
  const height = 230;
  const chartTop = 25;
  const chartBottom = 190;
  const chartH = chartBottom - chartTop;

  function fmtK(val) {
    if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
    if (val >= 1000) return Math.round(val / 1000) + 'K';
    return String(val);
  }

  // Dynamic Y-axis scale based on real max value
  const yScales = [
    { label: fmtK(maxVal), y: chartTop },
    { label: fmtK(maxVal * 0.75), y: chartTop + (chartH * 0.25) },
    { label: fmtK(maxVal * 0.50), y: chartTop + (chartH * 0.50) },
    { label: fmtK(maxVal * 0.25), y: chartTop + (chartH * 0.75) },
    { label: '0', y: chartBottom },
  ];

  const colWidth = (width - 60) / Math.max(months.length, 1);

  if (type === 'bar') {
    let barsSvg = '';
    const barWidth = Math.max(6, Math.min(14, (colWidth / 3) - 2));

    months.forEach((m, i) => {
      const cx = 50 + (i * colWidth) + (colWidth / 2);
      const demRatio = Math.min((m.demand || 0) / maxVal, 1);
      const colRatio = Math.min((m.collected || 0) / maxVal, 1);

      const demBarH = m.demand > 0 ? Math.max(demRatio * chartH, 6) : 2;
      const colBarH = m.collected > 0 ? Math.max(colRatio * chartH, 6) : 2;

      const demBarY = chartBottom - demBarH;
      const colBarY = chartBottom - colBarH;

      const isCurrentActive = m.active || (new Date().getMonth() === i && months.length === 12);

      barsSvg += `
        <g class="chart-month-bar" 
           onmouseenter="window.showDashTooltip(event, ${m.demand}, ${m.collected}, '${m.label}', this)"
           onmouseleave="window.hideDashTooltip()"
           onclick="window.showDashTooltip(event, ${m.demand}, ${m.collected}, '${m.label}', this)"
           style="cursor:pointer;">
          
          <!-- Invisible touch trigger column -->
          <rect x="${cx - (colWidth / 2)}" y="${chartTop}" width="${colWidth}" height="${chartH}" fill="transparent" />

          <!-- Grey Demand Bar (Rounded pill) -->
          <rect x="${cx - barWidth - 1}" y="${demBarY}" width="${barWidth}" height="${demBarH}" rx="${barWidth / 2}" ry="${barWidth / 2}" fill="#E2E8F0" />

          <!-- Blue Collected Bar (Rounded pill) -->
          <rect x="${cx + 1}" y="${colBarY}" width="${barWidth}" height="${colBarH}" rx="${barWidth / 2}" ry="${barWidth / 2}" fill="#3B82F6" />

          <!-- Active dot indicator -->
          ${isCurrentActive ? `
            <circle cx="${cx}" cy="${chartTop - 6}" r="3" fill="#0F172A" />
          ` : ''}

          <!-- Month Label -->
          <text x="${cx}" y="212" font-size="${months.length > 7 ? '10' : '11.5'}" font-weight="${isCurrentActive ? '700' : '500'}" 
                fill="${isCurrentActive ? '#0F172A' : '#94A3B8'}" text-anchor="middle">
            ${m.label}
          </text>
        </g>
      `;
    });

    wrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100% !important; max-width: 100% !important; height: auto !important; max-height: 220px !important; display: block !important;">
        <!-- Horizontal Grid Lines -->
        ${yScales.map(s => `
          <line x1="40" y1="${s.y}" x2="${width - 15}" y2="${s.y}" stroke="#F1F5F9" stroke-width="1.2" stroke-dasharray="3 3" />
          <text x="32" y="${s.y + 4}" font-size="10.5" font-weight="500" fill="#94A3B8" text-anchor="end">${s.label}</text>
        `).join('')}

        <!-- Dynamic Bars -->
        ${barsSvg}
      </svg>
    `;

  } else if (type === 'line') {
    const pointsCollected = [];
    const pointsDemand = [];

    months.forEach((m, i) => {
      const cx = 50 + (i * colWidth) + (colWidth / 2);
      const colRatio = Math.min((m.collected || 0) / maxVal, 1);
      const demRatio = Math.min((m.demand || 0) / maxVal, 1);
      pointsCollected.push({ x: cx, y: chartBottom - (colRatio * chartH), demand: m.demand, collected: m.collected, label: m.label });
      pointsDemand.push({ x: cx, y: chartBottom - (demRatio * chartH) });
    });

    function buildSmoothPath(pts) {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpX = (p0.x + p1.x) / 2;
        d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return d;
    }

    const colPathD = buildSmoothPath(pointsCollected);
    const demPathD = buildSmoothPath(pointsDemand);
    const lastPt = pointsCollected[pointsCollected.length - 1] || { x: width - 20, y: chartBottom };
    const firstPt = pointsCollected[0] || { x: 50, y: chartBottom };
    const areaPathD = `${colPathD} L ${lastPt.x} ${chartBottom} L ${firstPt.x} ${chartBottom} Z`;

    wrap.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100% !important; max-width: 100% !important; height: auto !important; max-height: 220px !important; display: block !important;">
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        ${yScales.map(s => `
          <line x1="40" y1="${s.y}" x2="${width - 15}" y2="${s.y}" stroke="#F1F5F9" stroke-width="1.2" stroke-dasharray="3 3" />
          <text x="32" y="${s.y + 4}" font-size="10.5" font-weight="500" fill="#94A3B8" text-anchor="end">${s.label}</text>
        `).join('')}

        <!-- Gradient Area Fill -->
        <path d="${areaPathD}" fill="url(#chartAreaGradient)" />

        <!-- Demand Line (Grey Dashed) -->
        <path d="${demPathD}" fill="none" stroke="#CBD5E1" stroke-width="2.5" stroke-dasharray="4 4" stroke-linecap="round" />

        <!-- Collections Line (Smooth Vibrant Blue) -->
        <path d="${colPathD}" fill="none" stroke="#3B82F6" stroke-width="3.5" stroke-linecap="round" />

        <!-- Interactive Points -->
        ${pointsCollected.map((p) => `
          <g class="chart-point-group" 
             onmouseenter="window.showDashTooltip(event, ${p.demand}, ${p.collected}, '${p.label}', this)"
             onmouseleave="window.hideDashTooltip()"
             onclick="window.showDashTooltip(event, ${p.demand}, ${p.collected}, '${p.label}', this)"
             style="cursor:pointer;">
            <circle cx="${p.x}" cy="${p.y}" r="12" fill="transparent" />
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="#FFFFFF" stroke="#3B82F6" stroke-width="3" />
            <text x="${p.x}" y="212" font-size="${pointsCollected.length > 7 ? '10' : '11.5'}" font-weight="500" fill="#94A3B8" text-anchor="middle">
              ${p.label}
            </text>
          </g>
        `).join('')}
      </svg>
    `;
  }
};

window.highlightDashDonutSlice = function(id, cat, pct, amount) {
  document.querySelectorAll('[id^="dashDonutSlice_"]').forEach(el => {
    el.setAttribute('stroke-width', '28');
    el.style.filter = 'none';
  });
  const slice = document.getElementById('dashDonutSlice_' + id);
  if (slice) {
    slice.setAttribute('stroke-width', '35');
    slice.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.22))';
  }
  document.querySelectorAll('[id^="dashDonutLegend_"]').forEach(el => {
    el.style.background = '#F8FAFC';
    el.style.borderColor = '#F1F5F9';
  });
  const legend = document.getElementById('dashDonutLegend_' + id);
  if (legend) {
    legend.style.background = '#EFF6FF';
    legend.style.borderColor = '#BFDBFE';
  }
  const centerCat = document.getElementById('dashDonutCenterCat');
  const centerAmt = document.getElementById('dashDonutCenterAmt');
  const centerPct = document.getElementById('dashDonutCenterPct');
  if (centerCat) centerCat.textContent = cat;
  if (centerAmt) {
    centerAmt.textContent = amount >= 100000 
      ? `₹${(amount / 100000).toFixed(2)}L` 
      : `₹${Number(amount).toLocaleString('en-IN')}`;
  }
  if (centerPct) centerPct.textContent = `${pct}% of Total`;
};

window.resetDashDonutSlice = function() {
  document.querySelectorAll('[id^="dashDonutSlice_"]').forEach(el => {
    el.setAttribute('stroke-width', '28');
    el.style.filter = 'none';
  });
  document.querySelectorAll('[id^="dashDonutLegend_"]').forEach(el => {
    el.style.background = '#F8FAFC';
    el.style.borderColor = '#F1F5F9';
  });
  const centerCat = document.getElementById('dashDonutCenterCat');
  const centerAmt = document.getElementById('dashDonutCenterAmt');
  const centerPct = document.getElementById('dashDonutCenterPct');
  if (centerCat) centerCat.textContent = 'SOCIETY EXPENSES';
  if (centerAmt) centerAmt.textContent = window.__dashDefaultDonutTotal || '₹0';
  if (centerPct) centerPct.textContent = (window.__dashDefaultDonutPeriod || 'This Year') + ' · 100%';
};

// =============================================
// Society Google Maps & Campus Location Manager
// =============================================

window.renderSocietyMap = function(org, loc) {
  const container = document.getElementById('dashSocietyMapContainer');
  const statusBadge = document.getElementById('dashMapStatusBadge');
  if (!container) return;

  // Resolve active organization details
  let storedOrg = null;
  try {
    const rawUser = localStorage.getItem('rwa_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      storedOrg = u?.organization || null;
    }
  } catch(e) {}

  let localLoc = null;
  try {
    const rawLoc = localStorage.getItem('rwa_society_location');
    if (rawLoc) localLoc = JSON.parse(rawLoc);
  } catch(e) {}

  const activeOrg = org || storedOrg || {
    name: 'Greenwood Heights RWA',
    address: 'Sector 22, Phase 1',
    city: 'Chandigarh',
    pincode: '160022'
  };

  const activeLoc = loc || activeOrg.location || localLoc || {};
  window.__activeSocietyLocation = activeLoc;
  window.__activeSocietyOrg = activeOrg;

  const hasConfigured = activeLoc && (activeLoc.isConfigured || activeLoc.googleMapsUrl || activeLoc.mapEmbedUrl || (activeLoc.latitude && activeLoc.longitude));
  const hasBasicAddress = !!(activeOrg.address || activeOrg.city);

  if (!hasConfigured && !hasBasicAddress) {
    // Unset state: Display clean prompt card to add Google Map location
    if (statusBadge) {
      statusBadge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#EF4444;"></span> LOCATION NOT SET`;
      statusBadge.style.background = '#FEF2F2';
      statusBadge.style.color = '#DC2626';
      statusBadge.style.borderColor = '#FECACA';
    }
    container.innerHTML = `
      <div style="padding:32px 18px;text-align:center;background:linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 100%);border-radius:16px;border:1.5px dashed #CBD5E1;">
        <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 12px auto;border:1px solid #BFDBFE;box-shadow:0 4px 12px rgba(37,99,235,0.15);">
          📍
        </div>
        <div style="font-size:14.5px;font-weight:800;color:#0F172A;margin-bottom:4px;">Google Maps Location Not Set</div>
        <div style="font-size:12px;color:#64748B;max-width:320px;margin:0 auto 16px auto;line-height:1.5;">
          Pinpoint your society's campus on Google Maps so delivery partners, visitors, and residents can navigate with ease.
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.openSocietyLocationModal()" style="font-size:12px;padding:8px 18px;border-radius:10px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);box-shadow:0 4px 14px rgba(37,99,235,0.28);">
          <span>📍 Add Location on Google Maps</span>
        </button>
      </div>
    `;
    return;
  }

  // Build query for Google Map - prioritize address added by RWA admin!
  const addressParts = [
    activeLoc.address || activeOrg.address,
    activeLoc.city || activeOrg.city,
    activeLoc.pincode || activeOrg.pincode
  ].filter(Boolean);

  const landmarkPart = (activeLoc.landmark || activeOrg.landmark || '').trim();
  const addressString = addressParts.join(', ').trim();
  const fullAddressWithLandmark = [landmarkPart, addressString].filter(Boolean).join(', ');

  let query = '';
  const isCustomHttpUrl = activeLoc.googleMapsUrl && activeLoc.googleMapsUrl.startsWith('http');
  const isCoordsOnly = activeLoc.googleMapsUrl && /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(activeLoc.googleMapsUrl);

  if (addressString) {
    query = fullAddressWithLandmark;
  } else if (activeLoc.googleMapsUrl && !isCustomHttpUrl && !isCoordsOnly) {
    query = activeLoc.googleMapsUrl;
  } else if (activeLoc.latitude && activeLoc.longitude) {
    query = `${activeLoc.latitude},${activeLoc.longitude}`;
  } else if (activeLoc.googleMapsUrl && !isCustomHttpUrl) {
    query = activeLoc.googleMapsUrl;
  } else {
    query = [activeOrg.name, activeOrg.city].filter(Boolean).join(', ') || 'Chandigarh, India';
  }

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = isCustomHttpUrl
    ? activeLoc.googleMapsUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const displayAddress = addressString || 'Address not specified';

  const areaPill = (activeLoc.city || activeOrg.city) ? `
    <span style="display:inline-flex;align-items:center;gap:5px;background:#EFF6FF;border:1px solid #DBEAFE;color:#1D4ED8;font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:7px;">
      <span>📍</span> ${activeLoc.city || activeOrg.city}
    </span>
  ` : '';

  const landmarkPill = landmarkPart ? `
    <span style="display:inline-flex;align-items:center;gap:5px;background:#FEF3C7;border:1px solid #FDE68A;color:#B45309;font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:7px;">
      <span>🚩</span> ${landmarkPart}
    </span>
  ` : '';

  const pinTypePill = `
    <span style="display:inline-flex;align-items:center;gap:5px;background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D;font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:7px;">
      <span>✓</span> Verified Campus Pin
    </span>
  `;

  if (statusBadge) {
    const isConfig = !!(activeLoc.isConfigured || addressString);
    statusBadge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${isConfig ? '#10B981' : '#3B82F6'};box-shadow:0 0 6px ${isConfig ? '#10B981' : '#3B82F6'};"></span> ${isConfig ? 'VERIFIED PIN' : 'AUTO DETECTED'}`;
    statusBadge.style.background = isConfig ? 'linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%)' : 'linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%)';
    statusBadge.style.color = isConfig ? '#059669' : '#1D4ED8';
    statusBadge.style.borderColor = isConfig ? '#A7F3D0' : '#BFDBFE';
  }

  container.innerHTML = `
    <!-- Google Map Embed Viewport with Frosted Glass Chips -->
    <div style="position:relative;width:100%;height:210px;border-radius:16px;overflow:hidden;border:1.5px solid #E2E8F0;box-shadow:0 4px 16px -2px rgba(15,23,42,0.08);background:#0F172A;">
      <iframe id="dashSocietyMapIframe" src="${embedUrl}"
              width="100%" height="210" style="border:0;display:block;filter:contrast(1.02);"
              allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      
      <!-- Top-Left Frosted Glass Badge -->
      <div style="position:absolute;top:10px;left:10px;background:rgba(15,23,42,0.80);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#F8FAFC;border:1px solid rgba(255,255,255,0.18);font-size:10px;font-weight:700;padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.25);pointer-events:none;z-index:2;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38BDF8;box-shadow:0 0 8px #38BDF8;"></span>
        <span>🛰️ Live Satellite / Map</span>
      </div>

      <!-- Top-Right Frosted Glass 'Open in Maps' Button -->
      <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
         title="Open in Google Maps in a new tab"
         style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#0F172A;font-size:11px;font-weight:700;padding:5px 12px;border-radius:99px;border:1px solid rgba(226,232,240,0.9);text-decoration:none;display:inline-flex;align-items:center;gap:5px;box-shadow:0 4px 14px rgba(15,23,42,0.12);transition:all 0.15s ease;z-index:2;"
         onmouseover="this.style.transform='translateY(-1px) scale(1.02)';"
         onmouseout="this.style.transform='translateY(0) scale(1)';">
        <span>🧭 Open in Maps ↗</span>
      </a>

      <!-- Bottom-Left Gate Pin Glass Chip -->
      <div style="position:absolute;bottom:10px;left:10px;background:rgba(15,23,42,0.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#E2E8F0;font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid rgba(56,189,248,0.3);display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;z-index:2;">
        <span style="color:#38BDF8;">📍</span>
        <span>Main Campus Gate</span>
      </div>
    </div>

    <!-- Elevated Campus Info Plate -->
    <div style="margin-top:14px;background:linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 100%);border:1.5px solid #E2E8F0;border-radius:15px;padding:14px 16px;display:flex;flex-direction:column;gap:9px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="display:flex;align-items:center;gap:6px;min-width:0;">
          <span style="font-size:14px;font-weight:800;color:#0F172A;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${activeOrg.name || 'Society Campus'}
          </span>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;background:#059669;color:#FFFFFF;font-size:10px;font-weight:800;flex-shrink:0;" title="Verified Society Coordinates">✓</span>
        </div>
        <span style="font-size:10px;font-weight:800;color:#0284C7;background:#E0F2FE;border:1px solid #BAE6FD;padding:3px 9px;border-radius:6px;text-transform:uppercase;letter-spacing:0.04em;flex-shrink:0;">
          🏢 RWA Campus
        </span>
      </div>

      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#475569;line-height:1.45;">
        <span style="font-size:13px;color:#64748B;flex-shrink:0;margin-top:1px;">📌</span>
        <span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${displayAddress}
        </span>
      </div>

      <!-- Verified Campus & Landmark Chips -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${pinTypePill}
        ${areaPill}
        ${landmarkPill}
      </div>
    </div>

    <!-- Aesthetic Action Buttons Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
      <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
         style="background:linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);color:#FFFFFF;text-decoration:none;border-radius:12px;height:40px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 14px rgba(37,99,235,0.3);transition:all 0.2s ease;"
         onmouseover="this.style.boxShadow='0 6px 18px rgba(37,99,235,0.4)';this.style.transform='translateY(-1px)';"
         onmouseout="this.style.boxShadow='0 4px 14px rgba(37,99,235,0.3)';this.style.transform='translateY(0)';">
        <span>🧭 Directions ↗</span>
      </a>
      <button type="button" onclick="window.openSocietyLocationModal()"
              style="background:#FFFFFF;color:#0F172A;border:1.5px solid #CBD5E1;border-radius:12px;height:40px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 1px 3px rgba(15,23,42,0.04);transition:all 0.2s ease;"
              onmouseover="this.style.background='#F8FAFC';this.style.borderColor='#94A3B8';this.style.transform='translateY(-1px)';"
              onmouseout="this.style.background='#FFFFFF';this.style.borderColor='#CBD5E1';this.style.transform='translateY(0)';">
        <span>📍 Edit Map Pin</span>
      </button>
    </div>
  `;
};

window.openSocietyLocationModal = function() {
  const existing = document.getElementById('rwaSocietyLocationModal');
  if (existing) existing.remove();

  const org = window.__activeSocietyOrg || {};
  const loc = window.__activeSocietyLocation || {};

  const currentMapInput = loc.googleMapsUrl || (loc.latitude ? `${loc.latitude},${loc.longitude}` : (org.address ? `${org.address}, ${org.city || ''}` : ''));
  const currentAddress = org.address || '';
  const currentCity = org.city || '';
  const currentPincode = org.pincode || '';
  const currentLandmark = loc.landmark || '';

  const modal = document.createElement('div');
  modal.id = 'rwaSocietyLocationModal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(5px); z-index: 99999; display: flex;
    align-items: center; justify-content: center; padding: 16px;
  `;
  modal.onclick = function(e) {
    if (e.target === modal) modal.remove();
  };

  const previewQuery = currentMapInput || [currentAddress, currentCity].filter(Boolean).join(', ') || 'India';

  modal.innerHTML = `
    <div style="background:#FFFFFF;max-width:540px;width:100%;max-height:92vh;overflow-y:auto;border-radius:20px;box-shadow:0 25px 50px -12px rgba(15,23,42,0.3);border:1px solid #E2E8F0;" onclick="event.stopPropagation()">
      <div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;border-radius:20px 20px 0 0;">
        <div>
          <div style="font-size:16px;font-weight:800;color:#0F172A;display:flex;align-items:center;gap:8px;">
            <span>📍 Society Google Maps Location</span>
            <span class="badge badge-blue" style="font-size:10px;">Campus Pin</span>
          </div>
          <div style="font-size:12px;color:#64748B;">Pinpoint the society on Google Maps for visitors, cabs, and delivery partners</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('rwaSocietyLocationModal').remove()" style="font-size:18px;line-height:1;padding:4px 8px;">✕</button>
      </div>

      <div style="padding:22px 24px;">
        <form id="societyLocationForm" onsubmit="window.saveSocietyLocation(event)" style="display:flex;flex-direction:column;gap:14px;">
          <!-- Field 1: Google Maps Link or Query -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label class="form-label" style="font-weight:700;margin:0;">Google Maps Link or Pinpoint *</label>
              <button type="button" class="btn btn-ghost btn-xs" onclick="window.detectCurrentGpsLocation()" style="font-size:11px;color:#2563EB;padding:2px 8px;border:1px solid #BFDBFE;border-radius:6px;background:#EFF6FF;">
                🎯 Auto-Detect GPS
              </button>
            </div>
            <input type="text" id="mapInputLocation" class="form-input" required
                   placeholder="Paste Google Maps URL or enter society name & area"
                   value="${currentMapInput}"
                   oninput="window.previewSocietyMapLocation(this.value)" />
            <div style="font-size:11px;color:#64748B;margin-top:4px;display:flex;align-items:center;gap:4px;">
              <span>💡 You can paste Google Maps URLs (maps.app.goo.gl/...), coordinates (lat,lng), or full address.</span>
            </div>
          </div>

          <!-- Society Address & Landmark Row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="form-label" style="font-weight:700;">Society / Street Address</label>
              <input type="text" id="mapInputAddress" class="form-input" placeholder="e.g. Sector 22, Phase 1" value="${currentAddress}" />
            </div>
            <div>
              <label class="form-label" style="font-weight:700;">Prominent Landmark</label>
              <input type="text" id="mapInputLandmark" class="form-input" placeholder="e.g. Near Gate 2 / Metro Pillar 42" value="${currentLandmark}" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label class="form-label" style="font-weight:700;">City</label>
              <input type="text" id="mapInputCity" class="form-input" placeholder="e.g. Chandigarh" value="${currentCity}" />
            </div>
            <div>
              <label class="form-label" style="font-weight:700;">PIN / Postal Code</label>
              <input type="text" id="mapInputPincode" class="form-input" placeholder="e.g. 160022" value="${currentPincode}" />
            </div>
          </div>

          <!-- Hidden GPS Coordinates -->
          <input type="hidden" id="mapInputLat" value="${loc.latitude || ''}" />
          <input type="hidden" id="mapInputLng" value="${loc.longitude || ''}" />

          <!-- Live Map Preview Frame -->
          <div>
            <label class="form-label" style="font-weight:700;display:flex;align-items:center;justify-content:space-between;">
              <span>Live Map Preview</span>
              <span id="mapPreviewStatus" style="font-size:11px;color:#059669;font-weight:600;">● Interactive Preview</span>
            </label>
            <div style="width:100%;height:180px;border-radius:12px;overflow:hidden;border:1px solid #CBD5E1;background:#E2E8F0;position:relative;">
              <iframe id="societyMapPreviewIframe"
                      src="https://maps.google.com/maps?q=${encodeURIComponent(previewQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      width="100%" height="180" style="border:0;display:block;"
                      allowfullscreen="" loading="lazy"></iframe>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:10px;padding-top:14px;border-top:1px solid #E2E8F0;">
            <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('rwaSocietyLocationModal').remove()">Cancel</button>
            <button type="submit" id="btnSaveSocietyLocation" class="btn btn-primary btn-sm" style="font-weight:700;padding:7px 18px;border-radius:8px;">
              💾 Save Society Location
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
};

window.detectCurrentGpsLocation = function() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }
  showToast('Detecting campus GPS coordinates...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const latEl = document.getElementById('mapInputLat');
      const lngEl = document.getElementById('mapInputLng');
      const locInput = document.getElementById('mapInputLocation');
      if (latEl) latEl.value = lat;
      if (lngEl) lngEl.value = lng;
      if (locInput) {
        locInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        window.previewSocietyMapLocation(locInput.value);
      }
      showToast(`Detected GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} 📍`, 'success');
    },
    (err) => {
      console.warn('Geolocation error:', err);
      showToast('Could not access GPS. Please type the address or Google Maps URL.', 'warning');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
};

window.previewSocietyMapLocation = function(val) {
  clearTimeout(window.__mapPreviewDebounce);
  window.__mapPreviewDebounce = setTimeout(() => {
    const iframe = document.getElementById('societyMapPreviewIframe');
    if (!iframe) return;
    const query = val && val.trim() ? val.trim() : 'India';
    iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }, 400);
};

window.saveSocietyLocation = async function(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('btnSaveSocietyLocation');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving Location...';
  }

  const mapLocation = document.getElementById('mapInputLocation')?.value?.trim() || '';
  const address = document.getElementById('mapInputAddress')?.value?.trim() || '';
  const landmark = document.getElementById('mapInputLandmark')?.value?.trim() || '';
  const city = document.getElementById('mapInputCity')?.value?.trim() || '';
  const pincode = document.getElementById('mapInputPincode')?.value?.trim() || '';
  const lat = document.getElementById('mapInputLat')?.value?.trim() || '';
  const lng = document.getElementById('mapInputLng')?.value?.trim() || '';

  const locationPayload = {
    googleMapsUrl: mapLocation,
    address,
    landmark,
    city,
    pincode,
    latitude: lat ? parseFloat(lat) : undefined,
    longitude: lng ? parseFloat(lng) : undefined,
    isConfigured: true
  };

  try {
    const res = await window.apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'location',
        location: locationPayload
      })
    });

    if (res && res.ok) {
      const data = await res.json();
      const updatedLoc = data.settings?.location || locationPayload;
      localStorage.setItem('rwa_society_location', JSON.stringify(updatedLoc));

      try {
        const rawUser = localStorage.getItem('rwa_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.organization) {
            if (address) u.organization.address = address;
            if (city) u.organization.city = city;
            if (pincode) u.organization.pincode = pincode;
            u.organization.location = updatedLoc;
            localStorage.setItem('rwa_user', JSON.stringify(u));
          }
        }
      } catch(e) {}

      showToast('Society location updated successfully! 📍', 'success');
      const modal = document.getElementById('rwaSocietyLocationModal');
      if (modal) modal.remove();

      window.renderSocietyMap(
        { ...window.__activeSocietyOrg, address, city, pincode, location: updatedLoc },
        updatedLoc
      );
    } else {
      localStorage.setItem('rwa_society_location', JSON.stringify(locationPayload));
      showToast('Society location saved locally! 📍', 'success');
      const modal = document.getElementById('rwaSocietyLocationModal');
      if (modal) modal.remove();
      window.renderSocietyMap(
        { ...window.__activeSocietyOrg, address, city, pincode, location: locationPayload },
        locationPayload
      );
    }
  } catch (err) {
    console.warn('API save error, saving locally:', err);
    localStorage.setItem('rwa_society_location', JSON.stringify(locationPayload));
    showToast('Society location saved locally! 📍', 'success');
    const modal = document.getElementById('rwaSocietyLocationModal');
    if (modal) modal.remove();
    window.renderSocietyMap(
      { ...window.__activeSocietyOrg, address, city, pincode, location: locationPayload },
      locationPayload
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Save Society Location';
    }
  }
};

// Safe backward-compatibility stubs for advertisements
window.renderDashboardAds = function() {};
window.startAdAutoRotate = function() {};
window.pauseAdAutoRotate = function() {};
window.openAdManagerModal = function() { window.openSocietyLocationModal(); };

// =============================================
// Live Hydration Logic: Connects to PostgreSQL / Prisma
// =============================================
window.loadLiveAdminDashboard = async function() {
  try {
    // 1. Fetch Authenticated User & Society Profile
    const meRes = await window.apiFetch('/api/auth/me').catch(() => null);
    if (meRes && meRes.ok) {
      const meData = await meRes.json();
      if (meData?.user) {
        localStorage.setItem('rwa_user', JSON.stringify(meData.user));
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const greetingEl = document.getElementById('dashGreeting');
        
        if (greetingEl) {
          greetingEl.textContent = `${timeOfDay}, ${meData.user.name || 'Admin'} 👋`;
        }
        const sideOrg = document.getElementById('sidebarOrgName');
        if (sideOrg && meData.user.organization) {
          sideOrg.textContent = meData.user.organization.name;
        }
      }
    }

    // 2. Fetch Live Dashboard Aggregation Stats from DB
    const statsRes = await window.apiFetch('/api/dashboard/stats').catch(() => null);
    if (statsRes && statsRes.ok) {
      const { stats, monthlyTrend, trends, expenses, complianceItems, recentNotices, recentComplaints, organization } = await statsRes.json();
      window.__dashTrendData = monthlyTrend;
      window.__dashTrendTrends = trends;
      window.__dashExpenses = expenses || [];

      // Update KPI Cards
      const colEl = document.getElementById('dashCollectionsVal');
      const duesEl = document.getElementById('dashPendingDuesVal');
      const membersEl = document.getElementById('dashActiveMembersVal');
      const compEl = document.getElementById('dashOpenComplaintsVal');
      const unitsOccEl = document.getElementById('dashUnitsOccupancySubtext');
      const colSub = document.getElementById('dashCollectionsChange');
      const duesSub = document.getElementById('dashPendingDuesSubtext');
      const compSub = document.getElementById('dashUrgentComplaintsSubtext');
      const demandValEl = document.getElementById('dashTotalDemandVal');
      const colRateBadge = document.getElementById('dashColRateBadge');

      if (colEl) {
        const amt = Number(stats.collectedAmount || 0);
        colEl.textContent = amt >= 100000 ? `₹${(amt / 100000).toFixed(2)}L` : `₹${amt.toLocaleString('en-IN')}`;
      }
      if (duesEl) {
        const pending = Number(stats.pendingAmount || 0);
        duesEl.textContent = pending >= 100000 ? `₹${(pending / 100000).toFixed(2)}L` : `₹${pending.toLocaleString('en-IN')}`;
      }
      if (membersEl) {
        membersEl.textContent = `${stats.occupiedUnits || 0} / ${stats.totalUnits || 0}`;
      }
      if (compEl) {
        const totalC = (stats.openComplaints || 0) + (stats.resolvedComplaints || 0);
        const resolvedPct = totalC > 0 ? Math.round((stats.resolvedComplaints / totalC) * 100) : 0;
        compEl.textContent = `${resolvedPct}%`;
      }
      if (unitsOccEl) {
        unitsOccEl.textContent = `${stats.occupiedUnits || 0} of ${stats.totalUnits || 0} Units Occupied`;
      }
      if (colSub) {
        colSub.textContent = stats.billedAmount > 0 
          ? `vs last month · ${stats.collectionRate || 0}% collection`
          : '0% collection this month';
      }
      if (duesSub) {
        duesSub.textContent = stats.pendingAmount > 0 ? 'vs last month · Active ledger' : 'All accounts settled';
      }
      if (compSub) {
        compSub.textContent = `${stats.openComplaints || 0} open · ${stats.resolvedComplaints || 0} resolved`;
      }
      const occBadge = document.getElementById('dashOccupancyRateBadge');
      if (occBadge) {
        const occPct = stats.occupancyRate ?? (stats.totalUnits > 0 ? Math.round(((stats.occupiedUnits || 0) / stats.totalUnits) * 100) : 0);
        occBadge.textContent = `${occPct}% Occupied`;
      }
      if (demandValEl) {
        const bAmt = Number(stats.billedAmount || 0);
        demandValEl.textContent = bAmt >= 100000 ? `₹${(bAmt / 100000).toFixed(2)}L` : `₹${bAmt.toLocaleString('en-IN')}`;
      }
      if (colRateBadge) {
        colRateBadge.textContent = `${stats.collectionRate || 0}%`;
      }

      // Update Complex Spotlight Card
      const cUnitsEl = document.getElementById('dashComplexUnitsVal');
      const cOccEl = document.getElementById('dashComplexOccVal');
      const cDuesEl = document.getElementById('dashComplexDuesVal');
      const cFacEl = document.getElementById('dashComplexFacilitiesVal');
      if (cUnitsEl) cUnitsEl.textContent = `${stats.totalUnits || 0} Units`;
      if (cOccEl) cOccEl.textContent = `${stats.occupancyRate || 0}%`;
      if (cDuesEl) cDuesEl.textContent = stats.standardDues ? `₹${Number(stats.standardDues).toLocaleString('en-IN')} / mo` : '₹0 / mo';
      if (cFacEl) cFacEl.textContent = `${stats.facilitiesCount || 0} Active`;

      // Update Campus Maintenance Utilization Bars
      const maintBarsEl = document.getElementById('dashCampusMaintBars');
      if (maintBarsEl) {
        const paidExp = (expenses || []).filter(e => e.status === 'PAID');
        if (paidExp.length > 0) {
          const totalPaid = paidExp.reduce((s, e) => s + Number(e.totalAmount || e.amount || 0), 0) || 1;
          const catTotals = {};
          paidExp.forEach(e => {
            const cat = e.category || 'Maintenance';
            catTotals[cat] = (catTotals[cat] || 0) + Number(e.totalAmount || e.amount || 0);
          });
          maintBarsEl.innerHTML = Object.entries(catTotals).slice(0, 4).map(([cat, amt]) => {
            const pct = Math.round((amt / totalPaid) * 100);
            return `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
                  <span style="font-weight:600;color:#475569;">● ${cat}</span>
                  <strong style="color:#0F172A;">${pct}% (₹${Number(amt).toLocaleString('en-IN')})</strong>
                </div>
                <div style="height:5px;border-radius:99px;background:#E2E8F0;overflow:hidden;">
                  <div style="width:${pct}%;height:100%;background:#3B82F6;border-radius:99px;"></div>
                </div>
              </div>
            `;
          }).join('');
        } else {
          maintBarsEl.innerHTML = `<div style="text-align:center;padding:12px;color:#64748B;font-size:12px;">No campus expenditures recorded for this financial year.</div>`;
        }
      }

      // Update dynamic sidebar capacity card with live units quota & occupancy
      if (typeof window.updateSidebarCapacityCard === 'function') {
        const totalU = stats.totalUnits || 0;
        const occU = stats.occupiedUnits || 0;
        const occPct = stats.occupancyRate || (totalU > 0 ? Math.round((occU / totalU) * 100) : 0);
        window.updateSidebarCapacityCard('admin', {
          totalUnits: totalU,
          occupiedUnits: occU,
          planQuota: 50,
          occupancyRate: occPct
        });
      }

      // Cache society location for seamless cross-portal access (Resident & Admin)
      if (organization?.location) {
        try {
          localStorage.setItem('rwa_society_location', JSON.stringify(organization.location));
        } catch(e) {}
      }

      // Render Charts & Society Location Map
      window.renderDashChart(null, window.__dashChartType || 'donut');
      window.renderSocietyMap(organization, organization?.location);

      // Update Priority Counts
      const urgentCountEl = document.getElementById('dashUrgentPriorityCount');
      const highCountEl = document.getElementById('dashHighPriorityCount');
      const resolvedEl = document.getElementById('dashResolvedCount');
      const urgentCount = (recentComplaints || []).filter(c => c.priority === 'URGENT' && c.status !== 'RESOLVED').length;
      const highCount = (recentComplaints || []).filter(c => c.priority === 'HIGH' && c.status !== 'RESOLVED').length;
      if (urgentCountEl) urgentCountEl.textContent = urgentCount;
      if (highCountEl) highCountEl.textContent = highCount;
      if (resolvedEl) resolvedEl.textContent = stats.resolvedComplaints || '0';

      // Hydrate Compliance Deadlines
      const compListEl = document.getElementById('dashComplianceList');
      if (compListEl) {
        if (complianceItems && complianceItems.length > 0) {
          compListEl.innerHTML = complianceItems.map(c => `
            <div class="compliance-item" onclick="Router.go('admin-compliance')" style="min-height:48px;">
              <div class="compliance-date" style="border-left:3px solid var(--blue);">
                <div class="compliance-day">${c.day}</div>
                <div class="compliance-month">${c.month}</div>
              </div>
              <div class="compliance-info">
                <div class="compliance-title">${c.title}</div>
                <div class="compliance-desc">${c.desc}</div>
              </div>
              <div class="compliance-arrow">→</div>
            </div>
          `).join('');
        } else {
          compListEl.innerHTML = `
            <div style="padding:20px;text-align:center;color:#64748B;font-size:12px;background:#F8FAFC;border:1px dashed #E2E8F0;border-radius:12px;">
              No compliance deadlines scheduled.
            </div>
          `;
        }
      }

      // Hydrate Recent Complaints List
      const compListCardEl = document.getElementById('dashRecentComplaintsList');
      if (compListCardEl) {
        if (recentComplaints && recentComplaints.length > 0) {
          compListCardEl.innerHTML = recentComplaints.map(c => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;min-height:48px;
              background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;
              border-left:3px solid ${c.priority === 'URGENT' ? 'var(--red)' : c.priority === 'HIGH' ? 'var(--amber)' : 'var(--blue)'};"
              onclick="Router.go('admin-complaints')">
              <div style="flex:1;">
                <div style="font-size:12px;font-weight:700;color:var(--text-primary);">${c.title}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Ticket #${c.id.slice(-6).toUpperCase()} · ${c.category || 'General'}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                <span class="badge badge-${c.priority === 'URGENT' ? 'red' : c.priority === 'HIGH' ? 'amber' : 'blue'}" style="font-size:10px;">${c.priority || 'NORMAL'}</span>
                <span style="font-size:10px;color:var(--text-muted);">${new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          `).join('');
        } else {
          compListCardEl.innerHTML = `
            <div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-elevated);border-radius:var(--r-md);">
              🎉 All complaints resolved! Zero open tickets pending.
            </div>
          `;
        }
      }
      // Hydrate Admin Inbox & Notices
      const inboxListEl = document.getElementById('dashAdminInboxList');
      if (inboxListEl) {
        const notices = recentNotices || [];
        if (notices.length > 0) {
          inboxListEl.innerHTML = notices.slice(0, 3).map(n => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:12px;cursor:pointer;transition:all 0.15s ease;"
                 onclick="Router.go('admin-notices')">
              <div style="width:32px;height:32px;border-radius:9px;background:${n.priority === 'URGENT' ? '#FEE2E2' : '#EEF2FF'};color:${n.priority === 'URGENT' ? '#DC2626' : '#4F46E5'};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">
                ${n.priority === 'URGENT' ? '🚨' : '📢'}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:2px;">
                  <div style="font-size:12px;font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title}</div>
                  <span style="font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:6px;background:${n.priority === 'URGENT' ? '#FEF2F2' : '#F0FDF4'};color:${n.priority === 'URGENT' ? '#DC2626' : '#16A34A'};border:1px solid ${n.priority === 'URGENT' ? '#FECACA' : '#BBF7D0'};flex-shrink:0;">
                    ${n.priority || 'NOTICE'}
                  </span>
                </div>
                <div style="font-size:11px;color:#64748B;line-height:1.35;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">
                  ${n.body || n.description || 'Society broadcast announcement to all members.'}
                </div>
              </div>
            </div>
          `).join('');
        } else {
          inboxListEl.innerHTML = `
            <div style="padding:24px 16px;text-align:center;color:#64748B;font-size:12px;background:#F8FAFC;border:1px dashed #E2E8F0;border-radius:12px;">
              No broadcasts or notices posted yet.
            </div>
          `;
        }
      }

    } else {
      // Fallback initial render
      window.renderDashChart(null, window.__dashChartType || 'donut');
      window.renderSocietyMap(null, null);
    }

    // 3. Hydrate Recent Payments from Invoices API
    const invRes = await window.apiFetch('/api/billing/invoices').catch(() => null);
    if (invRes && invRes.ok) {
      const invData = await invRes.json();
      const paymentsListEl = document.getElementById('dashRecentPaymentsList');
      if (paymentsListEl) {
        const invoices = Array.isArray(invData) ? invData : (invData.invoices || []);
        const paidInvoices = invoices.filter(i => i.status === 'PAID').slice(0, 4);

        if (paidInvoices.length > 0) {
          paymentsListEl.innerHTML = paidInvoices.map(p => `
            <div class="timeline-item" style="min-height:48px;">
              <div class="timeline-dot green" style="background:var(--green-light);color:var(--green);font-size:11px;font-weight:800;">₹</div>
              <div class="timeline-content">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div class="timeline-title">${p.user?.name || 'Resident'} · <span style="color:var(--text-muted);font-weight:600;">Unit ${p.unit?.unitNumber || ''}</span></div>
                  <div style="font-size:13px;font-weight:800;color:var(--green)">₹${Number(p.paidAmount || p.totalAmount).toLocaleString('en-IN')}</div>
                </div>
                <div class="timeline-meta">Paid via Online / Razorpay · ${new Date(p.updatedAt || p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          `).join('');
        } else {
          paymentsListEl.innerHTML = `
            <div style="padding:14px;text-align:center;color:var(--text-muted);font-size:13px;">
              No recent payments recorded this cycle.
            </div>
          `;
        }
      }
    }
  } catch (err) {
    console.error('Error hydrating live admin dashboard:', err);
    window.renderDashChart(null, window.__dashChartType || 'donut');
    window.renderSocietyMap(null, null);
  }
};

// Auto-wire Socket.io real-time refresh listener
if (typeof window !== 'undefined' && !window.__dashSocketListenerAttached) {
  window.__dashSocketListenerAttached = true;
  window.addEventListener('DOMContentLoaded', () => {
    if (window.socket) {
      window.socket.on('dashboard:stats-refresh', () => {
        if (Router && Router.current() === 'admin-dashboard') {
          window.loadLiveAdminDashboard();
        }
      });
      window.socket.on('new-payment-received', () => {
        if (Router && Router.current() === 'admin-dashboard') {
          window.loadLiveAdminDashboard();
        }
      });
    }
  });
}
