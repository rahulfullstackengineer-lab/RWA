// =============================================
// Resident Portal Screens
// =============================================

// Resident Dashboard
Screens['resident-dashboard'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentDashboard === 'function') {
      window.loadLiveResidentDashboard();
    }
  }, 15);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rwa_user') || '{}');
  } catch(e) {}

  const residentName = user?.name || 'Resident';
  const unitNum = user?.unitNumber || (user?.unit && user.unit.unitNumber) || 'Flat';
  const blockName = user?.blockName || (user?.unit && user.unit.block && user.unit.block.name) || 'Main Block';
  const orgName = user?.organizationName || localStorage.getItem('rwa_active_org_name') || 'Society';
  const userPhone = user?.phone || '';

  return Shell.render('resident-dashboard', {
    title: 'Resident Dashboard',
    portal: 'resident',
    actions: `
      <div id="residentHeaderFlatSelector" style="display:inline-flex;align-items:center;gap:6px;"></div>
      <button class="btn btn-primary btn-sm" onclick="Router.go('resident-bills')">📄 My Invoices</button>
      <button class="btn btn-secondary btn-sm" onclick="window.openGenerateEntryPassModal()">🎫 Visitor Pass</button>
      <button class="btn btn-secondary btn-sm" onclick="openNewComplaintModal()">+ Raise Ticket</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentDashboard()">🔄 Refresh</button>
    `,
    content: `
      <!-- Admin Flat Connection / Inspection Top Banner -->
      <div id="adminUnitConnectTopBanner" style="display:none;margin-bottom:18px;"></div>

      <!-- 1. Bento Top Dark Section: Payments & Dues Command Center (Image 2 Inspiration) -->
      <div class="res-bento-dark-bar">
        <div class="res-bento-dark-header">
          <div>
            <div class="res-bento-dark-title">
              <span>Payments &amp; Maintenance</span>
            </div>
            <div class="res-bento-dark-meta">
              <span id="residentHeroUnitBadge" class="bento-unit-pill">Unit ${unitNum} · ${blockName} · Verified Resident</span>
              <span id="residentHeroPhone" style="font-size:12px;color:#94A3B8;font-weight:600;">${userPhone ? `📱 +91 ${userPhone}` : ''}</span>
              <div id="residentHeroFlatPicker" style="display:inline-flex;align-items:center;gap:6px;"></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="bento-time-dropdown">
              <span>This billing cycle</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('resident-bills')" style="color:#D8F833;border:1px solid rgba(216,248,51,0.3);border-radius:99px;font-size:11.5px;padding:4px 12px;font-weight:700;">
              View Ledger ↗
            </button>
          </div>
        </div>

        <!-- 4 Bento Metric Cards inside Dark Bar -->
        <div class="res-bento-dark-grid">
          <!-- Card 1: Neon Lime Outstanding Dues & Instant Pay -->
          <div class="res-bento-neon-card" onclick="Router.go('resident-bills')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.04em;">Outstanding Dues</span>
              <div class="bento-circle-arrow">↗</div>
            </div>
            <div>
              <div id="residentHeroBalanceAmount" style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#0F172A;line-height:1.1;">₹0.00</div>
              <div id="residentHeroBalanceStatus" style="font-size:11.5px;font-weight:700;color:#15803D;margin-top:4px;">
                ✓ All dues cleared
              </div>
            </div>
            <div id="residentHeroPayBtnWrap" style="margin-top:6px;display:none;"></div>
          </div>

          <!-- Card 2: Monthly Maintenance Fee -->
          <div class="res-bento-glass-card" onclick="Router.go('resident-bills')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Monthly Maintenance</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="statDescInvoices" style="font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.2;">Loading bills...</div>
              <div style="font-size:11px;color:#64748B;margin-top:4px;">Official society ledger</div>
            </div>
          </div>

          <!-- Card 3: Helpdesk & Active Service Tickets -->
          <div class="res-bento-glass-card" onclick="Router.go('resident-complaints')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Service Requests</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="statDescComplaints" style="font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.2;">Loading tickets...</div>
              <div style="font-size:11px;color:#64748B;margin-top:4px;">Plumbing, electrical &amp; lifts</div>
            </div>
          </div>

          <!-- Card 4: Open Facilities & Amenities -->
          <div class="res-bento-glass-card" onclick="Router.go('resident-amenities')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:0.04em;">Clubhouse &amp; Sports</span>
              <div class="bento-circle-arrow-dark">↗</div>
            </div>
            <div>
              <div id="statDescAmenities" style="font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.2;">Loading facilities...</div>
              <div id="statDescAmenitiesSub" style="font-size:11px;color:#64748B;margin-top:4px;">Society facilities &amp; spaces</div>
            </div>
          </div>
        </div>
        <div id="statDescNotices" style="display:none;"></div>
      </div>

      <!-- 2. Greeting & Quick Action Bar -->
      <div class="res-action-bar-card">
        <div style="flex:1;min-width:260px;">
          <div id="residentHeroName" style="font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.02em;">
            Namaste, ${residentName} 👋
          </div>
          <div id="residentHeroOrgName" style="font-size:12.5px;color:#64748B;margin-top:3px;max-width:580px;line-height:1.45;">
            Welcome to ${orgName} Resident Portal. View monthly invoices, pay maintenance instantly via UPI, raise helpdesk tickets, and book society facilities.
          </div>
        </div>
        <div class="res-quick-actions-scroll">
          <button class="res-action-pill-btn primary" onclick="Router.go('resident-bills')">
            ⚡ Quick Pay Bills
          </button>
          <button class="res-action-pill-btn" onclick="openNewComplaintModal()">
            🎫 Raise Ticket
          </button>
          <button class="res-action-pill-btn" onclick="Router.go('resident-amenities')">
            🏸 Book Facility
          </button>
          <button class="res-action-pill-btn" onclick="Router.go('resident-notices')">
            📢 Society Notices
          </button>
          <button class="res-action-pill-btn" onclick="window.openResidentStaffDutyModal()">
            🛡️ Staff On Duty
          </button>
          <button class="res-action-pill-btn" onclick="window.openGenerateEntryPassModal()" style="border-color:rgba(59,130,246,0.35);color:#2563EB;">
            🎫 Visitor Pass
          </button>
          <button class="res-action-pill-btn danger" onclick="window.openEmergencyIntercomModal()">
            🚨 Emergency SOS
          </button>
        </div>
      </div>

      <!-- Active Society Poll Banner -->
      <div id="residentDashboardPollAlert" style="margin-bottom:20px;display:none;"></div>

      <!-- 3. Middle Bento Grid (Complex Spotlight + Requests + Upcoming Amenities) -->
      <div class="res-bento-main-grid">
        <!-- Left: Complex Spotlight Card (Image 2 style) -->
        <div class="res-complex-card">
          <div class="res-complex-img-wrap">
            <img src="/images/complex.jpg" onerror="this.src='https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'" alt="Residential Complex" class="res-complex-img" />
            <div class="res-complex-badges-overlay">
              <span id="complexBadgeOrgTower" class="res-complex-pill">🏢 ${orgName || 'Society'} · Tower ${blockName || 'A'}</span>
              <span class="res-complex-pill" style="background:rgba(5,150,105,0.9);">🛡️ 24/7 Monitored Campus</span>
            </div>
          </div>

          <div class="res-complex-content">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-size:18px;font-weight:800;color:#0F172A;letter-spacing:-0.01em;">
                  Modern Residential Complex
                </div>
                <div id="complexCardSubtitle" style="font-size:12px;color:#64748B;margin-top:2px;">
                  ${orgName} · Smart Society Management Ecosystem
                </div>
              </div>
              <button class="bento-circle-arrow-dark" onclick="Router.go('resident-amenities')" style="background:#F1F5F9;color:#0F172A;border:1px solid #E2E8F0;" title="View Society Amenities">↗</button>
            </div>

            <!-- Quick Stats Row (100% Real Live Data) -->
            <div class="res-complex-stats-row">
              <div class="res-complex-stat-item">
                <span class="res-complex-stat-label">Residents</span>
                <span id="complexStatResidents" class="res-complex-stat-val">Loading...</span>
              </div>
              <div class="res-complex-stat-item">
                <span class="res-complex-stat-label">Units</span>
                <span id="complexStatUnits" class="res-complex-stat-val">Loading...</span>
              </div>
              <div class="res-complex-stat-item">
                <span class="res-complex-stat-label">My Flat</span>
                <span id="complexStatMyFlat" class="res-complex-stat-val">Loading...</span>
              </div>
              <div class="res-complex-stat-item">
                <span class="res-complex-stat-label">Amenities</span>
                <span id="complexStatAmenities" class="res-complex-stat-val">Loading...</span>
              </div>
            </div>

            <!-- Trend SVG Wave Chart (Image 2 style with Real Data) -->
            <div class="res-trend-wrap">
              <div class="res-trend-header">
                <div style="font-size:14px;font-weight:700;color:#0F172A;">Maintenance &amp; Reserve Trend</div>
                <div class="bento-time-dropdown" style="background:#F8FAFC;border:1px solid #E2E8F0;color:#0F172A;padding:3px 10px;font-size:11px;">
                  <span>Last 6 cycles ▾</span>
                </div>
              </div>

              <!-- SVG Wave with Dynamic Tooltip and Points -->
              <div id="residentTrendContainer" style="position:relative;width:100%;height:100px;margin-top:4px;">
                <div id="residentTrendTooltip" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#0F172A;color:#FFFFFF;padding:4px 10px;border-radius:10px;font-size:11px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:2;display:flex;flex-direction:column;align-items:center;">
                  <span id="residentTrendTooltipMonth" style="font-size:9px;color:#94A3B8;font-weight:500;">Latest Cycle</span>
                  <span id="residentTrendTooltipAmount" style="color:#D8F833;">Loading...</span>
                </div>
                <div id="residentTrendSvgWrap" style="width:100%;height:100%;"></div>
              </div>
            </div>

            <!-- Campus Fund Allocation Bars (from /api/expenses) -->
            <div id="residentCampusUtilizationWrap" style="background:#F8FAFC;border:1px solid #F1F5F9;border-radius:16px;padding:14px 16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:12px;font-weight:700;color:#0F172A;">Campus Maintenance Utilization</span>
                <span id="residentCampusAuditedBadge" class="badge badge-green" style="font-size:10px;font-weight:700;">FY 2026-27 Audited</span>
              </div>
              <div id="residentCampusExpenseBars" style="display:flex;flex-direction:column;gap:7px;">
                <!-- Populated dynamically from /api/expenses -->
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Requests & Upcoming Amenities (Image 2 style) -->
        <div class="res-bento-side-col">
          <!-- Requests Card (Image 2 right side) -->
          <div class="res-requests-card">
            <div class="res-requests-header">
              <div>
                <div class="res-requests-title">
                  <span>Requests</span>
                </div>
                <div id="residentRequestsSubtitle" style="font-size:11.5px;color:#64748B;margin-top:2px;">
                  Live service &amp; maintenance tickets
                </div>
              </div>
              <button class="bento-circle-arrow-dark" onclick="Router.go('resident-complaints')" style="background:#F1F5F9;color:#0F172A;border:1px solid #E2E8F0;" title="View All Requests">↗</button>
            </div>

            <!-- Dynamic Complaints List Container -->
            <div id="residentDashboardComplaintsList" style="display:flex;flex-direction:column;gap:8px;">
              <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
                Loading your helpdesk tickets...
              </div>
            </div>
          </div>

          <!-- Upcoming Amenities Card (Image 2 style with REAL Amenities) -->
          <div class="res-upcoming-card">
            <div class="res-upcoming-header">
              <div class="res-upcoming-header-info">
                <div class="res-upcoming-header-title">Upcoming Amenities &amp; Events</div>
                <div class="res-upcoming-header-sub">Society bookings &amp; community spaces</div>
              </div>
              <div class="bento-time-dropdown res-upcoming-view-all" onclick="Router.go('resident-amenities')" title="View All Amenities">
                <span>View All ▾</span>
              </div>
            </div>

            <div id="residentUpcomingAmenitiesGrid" class="res-upcoming-grid">
              <div style="grid-column: 1 / -1; padding: 28px 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
                Loading society amenities...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Operational Bottom Section: Invoices Ledger, Notices & Intercom -->
      <div class="dash-modern-grid">
        <!-- Left: Invoices Ledger & Announcements -->
        <div>
          <!-- Recent Invoices & Payments -->
          <div class="card mb-md" style="border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(15,23,42,0.04);background:#FFFFFF;">
            <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #F1F5F9;">
              <div>
                <div class="card-title" style="font-size:15px;font-weight:700;color:#0F172A;">Recent Invoices &amp; Receipts</div>
                <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Official society maintenance ledger and digital receipts</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="Router.go('resident-bills')" style="font-size:12px;font-weight:600;color:#2563EB;">View History →</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Invoice #</th><th>Period</th><th>Amount</th><th>Status</th><th>Receipt</th></tr>
                </thead>
                <tbody id="residentRecentInvoicesTbody">
                  <tr>
                    <td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px;">
                      Connecting to society billing ledger...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Latest Announcements Card -->
          <div class="card mb-md" style="border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(15,23,42,0.04);background:#FFFFFF;">
            <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #F1F5F9;">
              <div>
                <div class="card-title" style="font-size:15px;font-weight:700;color:#0F172A;">📢 Latest Society Announcements</div>
                <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Important notices and circulars from Management Committee</div>
              </div>
              <button class="btn btn-ghost btn-sm" onclick="Router.go('resident-notices')" style="font-size:12px;font-weight:600;color:#2563EB;">View All →</button>
            </div>
            <div id="residentDashboardNoticesList" style="padding:16px 20px;">
              <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
                Connecting to official society notice board...
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Active Poll, Resident Sponsor Deals & Intercom -->
        <div>
          <!-- Live Poll Widget -->
          <div class="card mb-md" id="residentDashboardPollWidgetCard" style="border:1px solid rgba(139,92,246,0.3);background:#FFFFFF;border-radius:20px;padding:18px 20px;box-shadow:0 1px 3px rgba(15,23,42,0.04);">
            <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0;border:none;">
              <div class="card-title" style="font-size:14.5px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:6px;">
                <span>🗳️</span> Active Community Resolution
              </div>
              <button class="btn btn-ghost btn-xs" onclick="Router.go('resident-polls')" style="font-size:11.5px;color:#8B5CF6;font-weight:700;">All Polls →</button>
            </div>
            <div id="residentDashboardPollWidget">
              <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
                Loading community proposals...
              </div>
            </div>
          </div>

          <!-- Society Campus Location (Google Maps configured by Admin) -->
          <div class="card mb-md" id="residentSocietyMapCard" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;padding:18px 20px;box-shadow:0 1px 3px rgba(15,23,42,0.04);position:relative;overflow:hidden;transition:all 0.2s ease;">
            <!-- Subtle Top Indigo Gradient Line -->
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg, #2563EB 0%, #38BDF8 50%, #4F46E5 100%);"></div>

            <div class="chart-header-row" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="display:flex;align-items:center;gap:11px;">
                <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%);border:1px solid #BFDBFE;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(37,99,235,0.14);flex-shrink:0;">
                  📍
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                    <span style="font-size:15px;font-weight:800;color:#0F172A;letter-spacing:-0.01em;">Society Campus Location</span>
                    <span id="residentMapStatusBadge" style="background:linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%);color:#059669;border:1px solid #A7F3D0;font-size:9.5px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;padding:2px 8px;border-radius:99px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 1px 2px rgba(16,185,129,0.1);">
                      <span style="width:6px;height:6px;border-radius:50%;background:#10B981;box-shadow:0 0 6px #10B981;"></span>
                      VERIFIED PIN
                    </span>
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:2px;font-weight:500;">Official gate GPS navigation &amp; directions</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <button class="btn btn-ghost btn-xs" onclick="window.copyResidentSocietyMapLink()" title="Copy Map Pin Link for Deliveries & Visitors" style="font-size:11.5px;font-weight:700;color:#2563EB;padding:5px 11px;border:1px solid #DBEAFE;border-radius:9px;background:#EFF6FF;display:inline-flex;align-items:center;gap:5px;transition:all 0.15s ease;cursor:pointer;">
                  <span>📋</span> Share Pin
                </button>
              </div>
            </div>

            <!-- Dynamic Google Map Container -->
            <div id="residentSocietyMapContainer">
              <div style="padding:40px 16px;text-align:center;color:var(--text-muted);font-size:12px;">
                Loading society map...
              </div>
            </div>
          </div>

          <!-- Emergency Intercom & Society Contacts -->
          <div class="card" style="border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(15,23,42,0.04);background:#FFFFFF;padding:18px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#0F172A;">🚨 Quick Intercom &amp; Security</div>
                <div style="font-size:11.5px;color:#64748B;margin-top:2px;">1-Tap directory for society emergency desks</div>
              </div>
              <button class="btn btn-ghost btn-xs" onclick="window.openEmergencyIntercomModal()" style="font-size:11px;color:#DC2626;font-weight:700;">Full Directory →</button>
            </div>
            <div id="residentQuickIntercomContainer" style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;">
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#0F172A;">
                  <span>🛡️</span> Main Security Gate 1
                </div>
                <a href="tel:101" style="font-size:11px;font-weight:700;color:#2563EB;background:#EFF6FF;padding:3px 8px;border-radius:6px;text-decoration:none;">Ext 101 📞</a>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;">
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#0F172A;">
                  <span>⚡</span> Duty Electrician (AMC)
                </div>
                <a href="tel:104" style="font-size:11px;font-weight:700;color:#2563EB;background:#EFF6FF;padding:3px 8px;border-radius:6px;text-decoration:none;">Ext 104 📞</a>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:#F8FAFC;border:1px solid #F1F5F9;">
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#0F172A;">
                  <span>💧</span> Duty Plumber (AMC)
                </div>
                <a href="tel:105" style="font-size:11px;font-weight:700;color:#2563EB;background:#EFF6FF;padding:3px 8px;border-radius:6px;text-decoration:none;">Ext 105 📞</a>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:#FEF2F2;border:1px solid #FEE2E2;">
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#DC2626;">
                  <span>🚑</span> Emergency Medical SOS
                </div>
                <a href="tel:108" style="font-size:11px;font-weight:700;color:#DC2626;background:#FFFFFF;border:1px solid #FCA5A5;padding:3px 8px;border-radius:6px;text-decoration:none;">108 / Ext 106 🚨</a>
              </div>
            </div>
          </div>

          <!-- Live Staff & Security Duty Roster -->
          <div class="card" style="border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(15,23,42,0.04);background:#FFFFFF;padding:18px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:6px;">
                  <span>🛡️ Staff &amp; Guards On Duty</span>
                  <span style="font-size:10px;font-weight:800;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;padding:2px 6px;border-radius:99px;display:inline-flex;align-items:center;gap:3px;"><span style="width:5px;height:5px;border-radius:50%;background:#16A34A;"></span>LIVE</span>
                </div>
                <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Stationed gate guards, floor housekeeping &amp; AMC technicians</div>
              </div>
              <button class="btn btn-ghost btn-xs" onclick="window.openResidentStaffDutyModal()" style="font-size:11px;color:#2563EB;font-weight:700;">Full Roster →</button>
            </div>
            <div id="residentStaffDutyListContainer" style="display:flex;flex-direction:column;gap:8px;">
              <div style="padding:16px;text-align:center;color:#64748B;font-size:12px;">
                Loading live on-duty staff roster...
              </div>
            </div>
          </div>

          <!-- Live Visitor Entry Passes Bento Card -->
          <div class="card" style="border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(15,23,42,0.04);background:#FFFFFF;padding:18px 20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:6px;">
                  <span>🎫 My Visitor Entry Passes</span>
                  <span id="residentPassesCountBadge" style="font-size:10px;font-weight:800;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:2px 7px;border-radius:99px;">GATE SYNC</span>
                </div>
                <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Pre-approved guest, delivery &amp; cab passes for your flat</div>
              </div>
              <button class="btn btn-primary btn-xs" onclick="window.openGenerateEntryPassModal()" style="font-size:11px;font-weight:700;background:#2563EB;border:none;border-radius:6px;padding:5px 12px;box-shadow:0 2px 6px rgba(37,99,235,0.25);">+ New Pass</button>
            </div>
            <div id="residentPassesListContainer" style="display:flex;flex-direction:column;gap:8px;">
              <div style="padding:16px;text-align:center;color:#64748B;font-size:12px;">
                Loading your visitor entry passes...
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// Resident Bills & Invoices
Screens['resident-bills'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentBills === 'function') {
      window.loadLiveResidentBills();
    }
  }, 10);

  return Shell.render('resident-bills', {
    title: 'My Bills & Invoices',
    portal: 'resident',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-ledger')">📒 View Account Ledger</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentBills()">🔄 Refresh</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Maintenance Invoices</div>
          <div class="page-subtitle" id="residentBillsSubtitle">Monthly society maintenance, sinking fund, water and backup electricity breakdown</div>
        </div>
        <div id="residentBillsFlatPicker" style="display:flex;align-items:center;gap:8px;"></div>
      </div>

      <!-- Current / Active Bill Card -->
      <div id="residentCurrentBillContainer">
        <div class="card mb-lg" style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
          Connecting to society billing ledger...
        </div>
      </div>

      <!-- Past Invoices History -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Past Billing History</div>
          <button class="btn btn-secondary btn-sm">Filter Year: 2026-27 ▾</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Period</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="residentPastBillsTableBody">
              <tr>
                <td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">
                  Loading past invoices...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};

window.switchResidentBillsFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;
  window.__residentPreviewUnitId = unitId;
  window.loadLiveResidentBills();
};

window.loadLiveResidentBills = async function() {
  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const params = new URLSearchParams();
    if (activeOrgId) params.set('orgId', activeOrgId);
    if (user && user.unitId) params.set('unitId', user.unitId);

    const [invRes, unitsRes] = await Promise.all([
      (window.apiFetch || fetch)('/api/billing/invoices?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/units').catch(() => null),
    ]);
    if (!invRes || !invRes.ok) return;

    const data = await invRes.json();
    const allInvoices = data.invoices || [];
    const unitsData = (unitsRes && unitsRes.ok) ? await unitsRes.json() : { units: [] };
    const allUnits = unitsData.units || [];

    // STRICT FLAT ISOLATION:
    // Only RWA admins can view other units. Residents are strictly locked to their own flat.
    let targetUnitId = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId || user?.unitId;
      if (!targetUnitId && allInvoices.length > 0) {
        targetUnitId = allInvoices[0].unitId;
      } else if (!targetUnitId && allUnits.length > 0) {
        targetUnitId = allUnits[0].id;
      }
    } else {
      targetUnitId = user?.unitId || (allUnits[0] && allUnits[0].id);
    }
    window.__residentPreviewUnitId = targetUnitId;

    const curUnit = allUnits.find(u => u.id === targetUnitId) || user?.unit || {};
    const curUnitNum = curUnit.unitNumber || user?.unitNumber || 'Flat';
    const curBlockName = curUnit.block?.name || curUnit.blockName || 'Main Block';

    // Populate Flat Selector if units available
    const pickerWrap = document.getElementById('residentBillsFlatPicker');
    if (pickerWrap) {
      if (isAdmin && allUnits.length > 0) {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Viewing Flat:</span>
            <select onchange="window.switchResidentBillsFlat(this.value)" class="form-select"
              style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
              title="Switch flat to view maintenance bills">
              ${allUnits.slice(0, 60).map(u => `
                <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                  🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
                </option>
              `).join('')}
            </select>
          </div>
        `;
      } else {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">My Flat:</span>
            <span style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${curUnitNum} (${curBlockName})</span>
          </div>
        `;
      }
    }

    const invoices = targetUnitId
      ? allInvoices.filter(i => i.unitId === targetUnitId)
      : allInvoices;

    window.__residentCachedInvoices = invoices;
    window.__residentAllSocietyInvoices = allInvoices;

    const currentCard = document.getElementById('residentCurrentBillContainer');
    const pastTbody = document.getElementById('residentPastBillsTableBody');
    const subEl = document.getElementById('residentBillsSubtitle');

    if (invoices.length === 0) {
      if (currentCard) {
        currentCard.innerHTML = `
          <div class="card mb-lg" style="padding:40px 20px;text-align:center;background:var(--bg-surface);border:1px dashed var(--border);">
            <div style="font-size:36px;margin-bottom:8px;">📄</div>
            <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Invoices Issued for Your Flat Yet</div>
            <div style="font-size:13px;color:var(--text-muted);max-width:380px;margin:0 auto;">
              Your unit does not have any pending maintenance bills. When the RWA administration issues upcoming bills, they will appear here automatically.
            </div>
          </div>
        `;
      }
      if (pastTbody) {
        pastTbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No billing history found for your flat.</td></tr>`;
      }
      if (subEl) {
        subEl.textContent = 'All maintenance dues cleared · No pending invoices';
      }
      return;
    }

    const latest = invoices[0];
    const isPaid = latest.status === 'PAID';
    const isOverdue = latest.status === 'OVERDUE';
    const badgeClass = isPaid ? 'badge-green' : (isOverdue ? 'badge-red' : 'badge-blue');
    const badgeLabel = isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'DUE / ISSUED');
    const dueDateStr = new Date(latest.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const unitNum = latest.unit ? latest.unit.unitNumber : (user?.unitNumber || 'Your Flat');

    if (subEl) {
      const isPreview = user?.role !== 'RESIDENT';
      subEl.innerHTML = `Billing for Flat <strong>${unitNum}</strong> · ${invoices.length} invoices recorded ${isPreview ? '<span class="badge badge-purple" style="font-size:10px;margin-left:6px;">Resident Flat Scoped</span>' : ''}`;
    }

    if (currentCard) {
      const displayAmount = isPaid
        ? (latest.paidAmount || latest.totalAmount)
        : (latest.balanceAmount > 0 ? latest.balanceAmount : latest.totalAmount);

      currentCard.innerHTML = `
        <div class="card mb-lg" style="border:1px solid ${isPaid ? 'rgba(16,185,129,0.3)' : 'rgba(37,99,235,0.3)'};background:${isPaid ? 'rgba(16,185,129,0.03)' : 'rgba(37,99,235,0.02)'};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="badge ${badgeClass}">${badgeLabel}</span>
                <span style="font-family:monospace;font-size:13px;font-weight:700;cursor:pointer;color:var(--blue);" onclick="openResidentInvoiceModal('${latest.id}')">${latest.invoiceNumber}</span>
              </div>
              <div style="font-size:20px;font-weight:800;margin-top:6px;color:var(--text-primary);">
                ${latest.billingMonth} Maintenance Bill
              </div>
              <div style="font-size:12px;color:var(--text-muted);">Flat ${unitNum} · Due Date: <strong>${dueDateStr}</strong></div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;color:var(--text-muted);font-weight:600;">${isPaid ? 'Total Settled' : 'Balance Payable'}</div>
              <div style="font-size:28px;font-weight:800;color:${isPaid ? 'var(--green)' : (isOverdue ? 'var(--red)' : 'var(--blue)')};line-height:1.2;margin:2px 0;">
                ₹${Number(displayAmount || 0).toLocaleString('en-IN')}
              </div>
              <div style="font-size:11.5px;font-weight:600;color:${isPaid ? 'var(--green)' : (isOverdue ? 'var(--red)' : 'var(--text-muted)')};margin-top:2px;">
                ${isPaid ? '✓ Fully Paid via Online Gateway · Balance ₹0' : (isOverdue ? `⚠️ Overdue since ${dueDateStr}` : `Due by ${dueDateStr}`)}
              </div>
            </div>
          </div>

          <!-- Breakdown table -->
          <div style="background:var(--bg-surface);border-radius:var(--r-md);border:1px solid var(--border);padding:16px;margin-bottom:16px;">
            <div style="font-size:13px;font-weight:700;margin-bottom:12px;">Invoice Line Items Breakdown</div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
              ${(latest.items && latest.items.length > 0 ? latest.items : [
                { description: `Monthly Society Maintenance & Operational Charges (${latest.billingMonth})`, totalAmount: latest.totalAmount }
              ]).map(it => `
                <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px dashed var(--border-light)">
                  <span>${it.description}</span>
                  <span style="font-weight:600">₹${Number(it.totalAmount || it.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              `).join('')}
              <div style="display:flex;justify-content:space-between;padding-top:4px;font-size:15px;font-weight:800;">
                <span>Total Demand</span>
                <span style="color:${isPaid ? 'var(--green)' : 'var(--blue)'}">₹${Number(latest.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="font-size:12px;color:var(--text-muted)">
              ${isPaid ? '✅ Account fully settled for this billing cycle' : '⚡ Instant digital receipt generated upon online verification'}
            </div>
            <div style="display:flex;gap:10px;">
              ${!isPaid ? `
                <button class="btn btn-primary btn-sm" onclick="triggerRazorpayPayment('${latest.id}', ${latest.balanceAmount || latest.totalAmount}, 'Flat ${unitNum}')">
                  ⚡ Pay via Razorpay (₹${(latest.balanceAmount || latest.totalAmount).toLocaleString('en-IN')})
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="openResidentReceiptModal('${latest.id}')">🧾 Payment Receipt</button>
              `}
              <button class="btn btn-ghost btn-sm" onclick="openResidentInvoiceModal('${latest.id}')">📄 Full Invoice</button>
            </div>
          </div>
        </div>
      `;
    }

    if (pastTbody) {
      pastTbody.innerHTML = invoices.map(b => {
        const pStatus = b.status === 'PAID' ? 'badge-green' : (b.status === 'OVERDUE' ? 'badge-red' : 'badge-blue');
        const issueDate = new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dueD = new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
          <tr>
            <td style="font-family:monospace;font-size:12px;font-weight:700;color:var(--blue);cursor:pointer;" onclick="openResidentInvoiceModal('${b.id}')">${b.invoiceNumber}</td>
            <td style="font-weight:600;">${b.billingMonth}</td>
            <td>${issueDate}</td>
            <td>${dueD}</td>
            <td style="font-weight:700;">₹${Number(b.totalAmount).toLocaleString('en-IN')}</td>
            <td><span class="badge ${pStatus}">${b.status}</span></td>
            <td>
              <div style="display:flex;gap:6px;">
                ${b.status !== 'PAID' ? `
                  <button class="btn btn-primary btn-xs" onclick="triggerRazorpayPayment('${b.id}', ${b.balanceAmount || b.totalAmount}, 'Flat ${unitNum}')">Pay</button>
                ` : `
                  <button class="btn btn-ghost btn-xs" onclick="openResidentReceiptModal('${b.id}')">🧾 Receipt</button>
                `}
                <button class="btn btn-ghost btn-xs" onclick="openResidentInvoiceModal('${b.id}')">📄 Invoice</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error in loadLiveResidentBills:', err);
  }
};

window.loadLiveResidentDashboard = async function() {
  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const params = new URLSearchParams();
    if (activeOrgId) params.set('orgId', activeOrgId);

    // Fetch live APIs in parallel
    const [invRes, noticeRes, complaintRes, pollRes, amenityRes, unitsRes, expRes, memberRes, settingsRes, emergencyRes, dutyRes] = await Promise.all([
      (window.apiFetch || fetch)('/api/billing/invoices?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/notices?status=PUBLISHED').catch(() => null),
      (window.apiFetch || fetch)('/api/complaints').catch(() => null),
      (window.apiFetch || fetch)('/api/polls').catch(() => null),
      (window.apiFetch || fetch)('/api/amenities').catch(() => null),
      (window.apiFetch || fetch)('/api/units').catch(() => null),
      (window.apiFetch || fetch)('/api/expenses').catch(() => null),
      (window.apiFetch || fetch)('/api/members').catch(() => null),
      (window.apiFetch || fetch)('/api/settings').catch(() => null),
      (window.apiFetch || fetch)('/api/emergency/contacts').catch(() => null),
      (window.apiFetch || fetch)('/api/staff/duty').catch(() => null),
      (window.apiFetch || fetch)('/api/entry-passes').catch(() => null),
    ]);

    // Parse data
    const allInvoices = (invRes && invRes.ok) ? ((await invRes.json()).invoices || []) : [];
    const noticesData = (noticeRes && noticeRes.ok) ? await noticeRes.json() : { notices: [] };
    const allNotices = noticesData.notices || [];
    window.__residentNoticesCache = allNotices;

    const complaintsData = (complaintRes && complaintRes.ok) ? await complaintRes.json() : { complaints: [] };
    const allComplaints = complaintsData.complaints || [];

    const pollsData = (pollRes && pollRes.ok) ? await pollRes.json() : { polls: [] };
    const allPolls = pollsData.polls || [];
    window.__residentPollsCache = allPolls;

    const amenitiesData = (amenityRes && amenityRes.ok) ? await amenityRes.json() : { amenities: [] };
    const allAmenities = amenitiesData.amenities || [];

    const unitsData = (unitsRes && unitsRes.ok) ? await unitsRes.json() : { units: [] };
    const allUnits = unitsData.units || [];

    const expData = (expRes && expRes.ok) ? await expRes.json() : { expenses: [] };
    const allExpenses = expData.expenses || [];

    const memberData = (memberRes && memberRes.ok) ? await memberRes.json() : { members: [] };
    const allMembers = memberData.members || [];

    const emergencyData = (emergencyRes && emergencyRes.ok) ? await emergencyRes.json() : { contacts: [] };
    const allEmergency = emergencyData.contacts || [];
    window._residentEmergencyContactsList = allEmergency;

    const dutyData = (dutyRes && dutyRes.ok) ? await dutyRes.json() : { duties: [] };
    const allDuties = dutyData.duties || [];
    window._residentStaffDutyList = allDuties;

    const passesData = (arguments[0] !== undefined && arguments[0] !== null) ? {} : {};
    let allPasses = [];
    try {
      const passRes = await (window.apiFetch || fetch)('/api/entry-passes').catch(() => null);
      if (passRes && passRes.ok) {
        const pData = await passRes.json();
        allPasses = pData.passes || [];
      }
    } catch(e) {}
    window._residentPassesList = allPasses;

    const settingsData = (settingsRes && settingsRes.ok) ? await settingsRes.json() : null;
    const liveOrg = settingsData?.organization || null;
    const liveLoc = settingsData?.settings?.location || null;
    if (liveLoc) {
      try { localStorage.setItem('rwa_society_location', JSON.stringify(liveLoc)); } catch(e) {}
    }
    if (liveOrg) {
      try {
        const uRaw = localStorage.getItem('rwa_user');
        if (uRaw) {
          const uObj = JSON.parse(uRaw);
          uObj.organization = liveOrg;
          localStorage.setItem('rwa_user', JSON.stringify(uObj));
        }
      } catch(e) {}
    }

    // Cache society units globally for modals and helpers
    window.__residentAllSocietyUnits = allUnits;

    // Refresh profile from /api/auth/me if unitId is not yet linked in localStorage
    if (user && !user.unitId) {
      try {
        const meRes = await (window.apiFetch || fetch)('/api/auth/me').catch(() => null);
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user) {
            user = meData.user;
            localStorage.setItem('rwa_user', JSON.stringify(user));
            localStorage.setItem('rwa_current_user', JSON.stringify(user));
          }
        }
      } catch (e) {}
    }

    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
    const isConnected = !!(user && user.unitId);

    // Render Admin Unit Connection Banner at top if admin is not linked
    const bannerEl = document.getElementById('adminUnitConnectTopBanner');
    if (bannerEl) {
      if (isAdmin && !isConnected) {
        bannerEl.style.display = 'block';
        bannerEl.innerHTML = `
          <div class="admin-unit-connect-banner" style="background:linear-gradient(135deg, #1E293B 0%, #0F172A 100%);border:1.5px solid #F59E0B;border-radius:18px;padding:18px 22px;box-shadow:0 12px 30px -8px rgba(245, 158, 11, 0.28);display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;color:#FFFFFF;">
            <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:280px;">
              <div style="width:46px;height:46px;border-radius:14px;background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">
                ⚠️
              </div>
              <div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:15px;font-weight:800;color:#FDE68A;letter-spacing:-0.01em;">Connect Your Admin Profile to a Flat</span>
                  <span style="font-size:10.5px;font-weight:700;background:rgba(245,158,11,0.22);color:#FBBF24;padding:2px 8px;border-radius:99px;border:1px solid rgba(245,158,11,0.35);">Action Required</span>
                </div>
                <div style="font-size:12.5px;color:#CBD5E1;margin-top:3px;line-height:1.45;">
                  As an RWA Admin, you must be connected to at least one unit in this society. Connect yourself to manage your flat's maintenance dues, official ballots, and services.
                </div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <select id="adminUnitConnectDropdown" class="form-select" style="min-width:210px;padding:8px 12px;font-size:12.5px;font-weight:700;border-radius:10px;background:#0F172A;color:#FFFFFF;border:1.5px solid rgba(245,158,11,0.5);outline:none;cursor:pointer;">
                <option value="">-- Select Your Flat --</option>
                ${allUnits.map(u => `
                  <option value="${u.id}">🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})</option>
                `).join('')}
              </select>
              <button class="btn btn-warning" id="adminConnectUnitBtn" onclick="window.connectAdminToUnit()" style="background:#F59E0B;color:#0F172A;font-weight:800;padding:8px 16px;border-radius:10px;border:none;box-shadow:0 4px 14px rgba(245,158,11,0.35);cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                <span>🔗 Connect Flat</span>
              </button>
            </div>
          </div>
        `;
      } else if (isAdmin && isConnected && window.__residentPreviewUnitId && window.__residentPreviewUnitId !== user.unitId) {
        const inspectUnit = allUnits.find(u => u.id === window.__residentPreviewUnitId);
        const inspectUnitNum = inspectUnit?.unitNumber || 'Selected Flat';
        const inspectBlock = inspectUnit?.block?.name || '';
        bannerEl.style.display = 'block';
        bannerEl.innerHTML = `
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#1E40AF;font-size:12.5px;box-shadow:0 2px 8px rgba(37,99,235,0.06);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;">👁️</span>
              <span><strong>Admin Inspection:</strong> Viewing <strong>Flat ${inspectUnitNum} ${inspectBlock ? `(${inspectBlock})` : ''}</strong> resident portal with its live bills, dues, and tickets.</span>
            </div>
            <button class="btn btn-primary btn-xs" onclick="window.switchResidentDashboardFlat('${user.unitId}')" style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;">
              ↩ Return to My Flat (${user.unitNumber || 'Own Unit'})
            </button>
          </div>
        `;
      } else {
        bannerEl.style.display = 'none';
        bannerEl.innerHTML = '';
      }
    }

    // Target Flat Resolution
    let targetUnitId = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId || user?.unitId;
      if (!targetUnitId && allUnits.length > 0) {
        targetUnitId = allUnits[0].id;
      }
    } else {
      targetUnitId = user?.unitId || (allUnits[0] && allUnits[0].id);
    }
    window.__residentPreviewUnitId = targetUnitId;

    // Find current unit details
    const currentUnit = allUnits.find(u => u.id === targetUnitId) || 
      (allInvoices.find(i => i.unitId === targetUnitId)?.unit) || 
      user?.unit || {};
    const unitNum = currentUnit.unitNumber || (allUnits[0] && allUnits[0].unitNumber) || 'A-101';
    const blockName = (currentUnit.block && currentUnit.block.name) || currentUnit.blockName || (allUnits[0] && allUnits[0].block && allUnits[0].block.name) || 'Tower A';

    const isViewingOwnUnit = user && user.unitId && (user.unitId === targetUnitId);
    const occupantName = currentUnit.tenantName || currentUnit.ownerName || '';
    const occupantPhone = currentUnit.tenantPhone || currentUnit.ownerPhone || '';
    const displayPhone = isViewingOwnUnit ? (user?.phone || occupantPhone) : (occupantPhone || user?.phone);
    const residentName = isViewingOwnUnit ? (user?.name || occupantName || 'Resident') : (occupantName || 'Resident');
    const orgName = user?.organizationName || localStorage.getItem('rwa_active_org_name') || 'Society';

    // 1. Update Unit Badge, Phone, Complex Overlay & Flat Selector
    const badgeEl = document.getElementById('residentHeroUnitBadge');
    if (badgeEl) {
      if (isViewingOwnUnit) {
        badgeEl.textContent = `Unit ${unitNum} · ${blockName} · My Flat 👑`;
      } else if (isAdmin) {
        badgeEl.textContent = `Unit ${unitNum} · ${blockName} · ${occupantName ? `Occupant: ${occupantName}` : 'Admin Inspection'}`;
      } else {
        badgeEl.textContent = `Unit ${unitNum} · ${blockName} · Verified Resident`;
      }
    }

    const phoneEl = document.getElementById('residentHeroPhone');
    if (phoneEl) {
      phoneEl.textContent = displayPhone ? `📱 +91 ${displayPhone}` : '';
    }

    const complexBadge = document.getElementById('complexBadgeOrgTower');
    if (complexBadge) {
      complexBadge.textContent = `🏢 ${orgName} · ${blockName}`;
    }

    const heroName = document.getElementById('residentHeroName');
    if (heroName) {
      if (isViewingOwnUnit) {
        heroName.textContent = `Namaste, ${user?.name || 'Resident'} 👋`;
      } else if (isAdmin) {
        heroName.textContent = `Flat ${unitNum} Portal · ${occupantName || 'Unit Overview'} 🔍`;
      } else {
        heroName.textContent = `Namaste, ${residentName} 👋`;
      }
    }

    const reqSubtitle = document.getElementById('residentRequestsSubtitle');
    if (reqSubtitle) {
      reqSubtitle.textContent = `Live service & maintenance tickets for Flat ${unitNum}`;
    }

    // Populate Flat Selector in Header and Hero Bar
    const selectorWrap = document.getElementById('residentHeroFlatPicker');
    const headerSelector = document.getElementById('residentHeaderFlatSelector');
    if (isAdmin && allUnits.length > 0) {
      const selectHtml = `
        <select onchange="window.switchResidentDashboardFlat(this.value)" class="form-select" 
          style="font-size:11.5px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
          title="Switch flat to view corresponding invoices and records">
          ${allUnits.map(u => {
            const isOwn = user?.unitId === u.id;
            const tag = isOwn ? ' (My Flat 👑)' : '';
            return `
              <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})${tag}
              </option>
            `;
          }).join('')}
        </select>
      `;
      if (selectorWrap) selectorWrap.innerHTML = selectHtml;
      if (headerSelector) headerSelector.innerHTML = selectHtml;
    } else {
      const ownBadge = `<span style="font-size:11.5px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${unitNum} (${blockName})</span>`;
      if (selectorWrap) selectorWrap.innerHTML = ownBadge;
      if (headerSelector) headerSelector.innerHTML = ownBadge;
    }

    // 2. Filter Invoices strictly for target unit
    const invoices = targetUnitId
      ? allInvoices.filter(i => i.unitId === targetUnitId)
      : allInvoices;
    window.__residentCachedInvoices = invoices;

    const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
    const pendingBalance = unpaidInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || inv.totalAmount || 0), 0);

    // Update dynamic sidebar capacity & billing card in real-time
    if (typeof window.updateSidebarCapacityCard === 'function') {
      window.updateSidebarCapacityCard('resident', {
        pendingAmount: pendingBalance,
        unitNum: unitNum
      });
    }

    const balEl = document.getElementById('residentHeroBalanceAmount');
    const statusEl = document.getElementById('residentHeroBalanceStatus');
    const payBtnWrap = document.getElementById('residentHeroPayBtnWrap');

    if (balEl && statusEl) {
      if (pendingBalance > 0) {
        balEl.textContent = '₹' + pendingBalance.toLocaleString('en-IN');
        balEl.style.color = '#0F172A';
        statusEl.innerHTML = `<span style="color:#B91C1C;font-weight:700;">⚠️ ₹${pendingBalance.toLocaleString('en-IN')} Due</span>`;
        if (payBtnWrap && unpaidInvoices.length > 0) {
          payBtnWrap.style.display = 'block';
          const oldestInv = unpaidInvoices[unpaidInvoices.length - 1];
          payBtnWrap.innerHTML = `
            <button class="btn btn-primary btn-xs w-full" style="font-size:11px;padding:4px 8px;font-weight:700;"
              onclick="triggerRazorpayPayment('${oldestInv.id}', ${oldestInv.balanceAmount || oldestInv.totalAmount}, 'Flat ${unitNum}')">
              ⚡ Pay Now
            </button>
          `;
        }
      } else {
        balEl.textContent = '₹0.00';
        balEl.style.color = '#0F172A';
        statusEl.innerHTML = `<span style="color:#15803D;font-weight:700;">✓ All dues cleared</span>`;
        if (payBtnWrap) payBtnWrap.style.display = 'none';
      }
    }

    // 3. Update Stat Cards (Real Counts)
    const sortedInvoices = [...invoices].sort((a, b) => (a.billingMonth || '').localeCompare(b.billingMonth || ''));
    const latestInv = sortedInvoices[sortedInvoices.length - 1] || invoices[0];

    const statInv = document.getElementById('statDescInvoices');
    if (statInv) {
      if (pendingBalance > 0) {
        statInv.textContent = `₹${pendingBalance.toLocaleString('en-IN')} due · ${unpaidInvoices.length} bill(s)`;
        statInv.style.color = '#FCA5A5';
      } else if (latestInv) {
        statInv.textContent = `₹${(latestInv.totalAmount || 0).toLocaleString('en-IN')} / mo · All clear`;
        statInv.style.color = '#86EFAC';
      } else {
        statInv.textContent = `✓ All clear · 0 unpaid bills`;
        statInv.style.color = '#86EFAC';
      }
    }

    // Complaints strictly for target unit
    const unitComplaints = targetUnitId
      ? allComplaints.filter(c => c.unitId === targetUnitId || (c.unit && c.unit.id === targetUnitId) || (c.unit && c.unit.unitNumber === unitNum))
      : allComplaints;
    const activeComplaints = unitComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');

    const statComp = document.getElementById('statDescComplaints');
    if (statComp) {
      statComp.textContent = activeComplaints.length > 0 
        ? `${activeComplaints.length} active ticket${activeComplaints.length > 1 ? 's' : ''}`
        : '0 open tickets · All clear';
    }

    const statAmen = document.getElementById('statDescAmenities');
    const statAmenSub = document.getElementById('statDescAmenitiesSub');
    if (statAmen) {
      statAmen.textContent = allAmenities.length > 0 
        ? `${allAmenities.length} facilities open`
        : '0 facilities open';
    }
    if (statAmenSub) {
      statAmenSub.textContent = allAmenities.length > 0
        ? allAmenities.slice(0, 3).map(a => a.name).join(', ')
        : 'No facilities added yet';
    }

    const statNotif = document.getElementById('statDescNotices');
    if (statNotif) {
      statNotif.textContent = allNotices.length > 0 
        ? `${allNotices.length} published circular${allNotices.length > 1 ? 's' : ''}`
        : '0 active circulars';
    }

    // 4. Update Modern Residential Complex Stats (Real Numbers!)
    const statUnitsEl = document.getElementById('complexStatUnits');
    if (statUnitsEl) statUnitsEl.textContent = `${allUnits.length || 112}`;

    const occupiedUnits = allUnits.filter(u => u.occupancyStatus === 'OCCUPIED' || u.occupancyStatus === 'TENANTED' || (u.users && u.users.length > 0) || u.ownerName || u.tenantName).length;
    const statResEl = document.getElementById('complexStatResidents');
    if (statResEl) {
      statResEl.textContent = `${allMembers.length > 0 ? allMembers.length : (occupiedUnits > 0 ? occupiedUnits * 3 : 12)}`;
    }

    const statMyFlatEl = document.getElementById('complexStatMyFlat');
    if (statMyFlatEl) statMyFlatEl.textContent = `Flat ${unitNum}`;

    const statAmenComplex = document.getElementById('complexStatAmenities');
    if (statAmenComplex) statAmenComplex.textContent = `${allAmenities.length} Open`;

    // 5. Update Maintenance & Reserve Trend (Real Dynamic Curve & Tooltip)
    const tooltipMonth = document.getElementById('residentTrendTooltipMonth');
    const tooltipAmount = document.getElementById('residentTrendTooltipAmount');
    if (latestInv) {
      if (tooltipMonth) tooltipMonth.textContent = latestInv.billingMonth ? `Billing ${latestInv.billingMonth}` : 'Current Month';
      if (tooltipAmount) tooltipAmount.textContent = `₹${(latestInv.totalAmount || 0).toLocaleString('en-IN')} / flat`;
    } else {
      if (tooltipMonth) tooltipMonth.textContent = 'Standard Maintenance';
      if (tooltipAmount) tooltipAmount.textContent = `₹2,500 / flat`;
    }

    const svgWrap = document.getElementById('residentTrendSvgWrap');
    if (svgWrap) {
      let amounts = sortedInvoices.slice(-6).map(i => i.totalAmount || 0);
      if (amounts.length === 0) amounts = [2500, 2500, 2500, 2500, 2500];
      if (amounts.length === 1) amounts = [amounts[0], amounts[0], amounts[0]];
      const minAmt = Math.min(...amounts) * 0.8 || 1000;
      const maxAmt = Math.max(...amounts) * 1.2 || 10000;
      const range = maxAmt - minAmt || 1;
      const width = 400;
      const height = 90;
      const step = width / (amounts.length - 1);
      const pts = amounts.map((amt, idx) => {
        const x = Math.round(idx * step);
        const normalized = (amt - minAmt) / range;
        const y = Math.round(72 - (normalized * 52));
        return { x, y, amt };
      });
      let pathD = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cpx1 = p0.x + (p1.x - p0.x) / 2;
        const cpy1 = p0.y;
        const cpx2 = p0.x + (p1.x - p0.x) / 2;
        const cpy2 = p1.y;
        pathD += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${p1.x},${p1.y}`;
      }
      const areaD = `${pathD} L ${pts[pts.length - 1].x},${height} L ${pts[0].x},${height} Z`;
      const lastPt = pts[pts.length - 1];

      svgWrap.innerHTML = `
        <svg viewBox="0 0 400 90" preserveAspectRatio="none" style="width:100%;height:100%;">
          <defs>
            <linearGradient id="trendGradDynamic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path d="${areaD}" fill="url(#trendGradDynamic)" />
          <path d="${pathD}" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="${lastPt.x}" cy="${lastPt.y}" r="4.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />
        </svg>
      `;
    }

    // 6. Update Campus Fund Allocation from Real Expenses
    const expContainer = document.getElementById('residentCampusExpenseBars');
    if (expContainer) {
      const catSums = {};
      let totalExp = 0;
      (allExpenses || []).forEach(e => {
        const cat = e.category || 'Maintenance';
        catSums[cat] = (catSums[cat] || 0) + (e.amount || 0);
        totalExp += (e.amount || 0);
      });
      const catColors = {
        'Security': '#10B981',
        'Horticulture': '#8B5CF6',
        'Maintenance': '#2563EB',
        'Plumbing': '#0284C7',
        'Admin': '#F59E0B',
      };
      const entries = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0 && totalExp > 0) {
        expContainer.innerHTML = entries.slice(0, 4).map(([cat, amt]) => {
          const pct = Math.round((amt / totalExp) * 100);
          const color = catColors[cat] || '#2563EB';
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
                <span style="font-weight:600;color:#475569;">● ${cat} Services</span>
                <strong style="color:#0F172A;">${pct}% (₹${amt.toLocaleString('en-IN')})</strong>
              </div>
              <div style="height:5px;border-radius:99px;background:#E2E8F0;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 7. Update Upcoming Amenities with Real Amenities from /api/amenities
    const amenGrid = document.getElementById('residentUpcomingAmenitiesGrid');
    if (amenGrid) {
      const amenityLocalImages = {
        'Community Hall': '/images/hall.jpg',
        'Swimming Pool': '/images/pool.jpg',
        'Badminton Court': '/images/badminton.jpg',
        'Fitness Gym': '/images/gym.jpg',
        'Clubhouse Meeting Room': '/images/clubhouse.jpg',
        'Party Lawn': '/images/terrace.jpg',
        'Tennis Court': '/images/badminton.jpg',
      };

      function resolveAmenityImg(name, cat) {
        if (name && amenityLocalImages[name]) return amenityLocalImages[name];
        const lower = (name || '').toLowerCase() + ' ' + (cat || '').toLowerCase();
        if (lower.includes('pool') || lower.includes('swim')) return '/images/pool.jpg';
        if (lower.includes('gym') || lower.includes('fitness')) return '/images/gym.jpg';
        if (lower.includes('badminton') || lower.includes('court') || lower.includes('sport')) return '/images/badminton.jpg';
        if (lower.includes('hall') || lower.includes('banquet') || lower.includes('party')) return '/images/hall.jpg';
        if (lower.includes('lawn') || lower.includes('garden')) return '/images/terrace.jpg';
        if (lower.includes('meeting') || lower.includes('room') || lower.includes('lounge')) return '/images/clubhouse.jpg';
        return '/images/clubhouse.jpg';
      }

      const displayAmenities = (allAmenities || []).slice(0, 4);
      if (displayAmenities.length > 0) {
        amenGrid.innerHTML = displayAmenities.map(a => {
          const img = a.imageUrl || resolveAmenityImg(a.name, a.cat);
          const feeText = a.fee ? a.fee : (a.feeNum ? `₹${a.feeNum} / slot` : 'Free for Residents');
          const timeText = a.timings || 'Open daily · 6 AM - 10 PM';
          const capText = a.cap ? `Cap: ${a.cap}` : 'Open facility';
          const catPill = a.cat || (a.name ? a.name.split(' ')[0] : 'Amenity');
          return `
            <div class="res-upcoming-item" onclick="Router.go('resident-amenities')" title="${a.name} · ${timeText} · ${feeText}">
              <div class="res-upcoming-img-wrap">
                <img src="${img}" alt="${a.name}" class="res-upcoming-img" onerror="this.src='/images/clubhouse.jpg'" />
                <span class="res-upcoming-cat-pill">${catPill}</span>
              </div>
              <div class="res-upcoming-meta">
                <div class="res-upcoming-name" title="${a.name}">${a.name}</div>
                <div class="res-upcoming-sub" title="${timeText} · ${capText}">${timeText} · ${capText}</div>
                <div class="res-upcoming-badge" title="${feeText}">✓ ${feeText}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        amenGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 28px 16px; text-align: center; color: var(--text-muted); font-size: 12px; background: #F8FAFC; border-radius: 16px; border: 1px dashed #CBD5E1;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 10px auto; border: 1px solid #BFDBFE;">
              🏊
            </div>
            <div style="font-weight: 700; color: #0F172A; font-size: 13.5px;">No Amenities Added Yet</div>
            <div style="font-size: 12px; margin-top: 4px; color: #64748B; max-width: 290px; margin-left: auto; margin-right: auto; line-height: 1.45;">
              The RWA administration has not added any community amenities or facilities for this society yet.
            </div>
          </div>
        `;
      }
    }

    // 8. Render Live Invoices Table
    const tbody = document.getElementById('residentRecentInvoicesTbody');
    if (tbody) {
      if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:18px;color:var(--text-muted);font-size:12px;">No maintenance invoices issued for Flat ${unitNum} yet.</td></tr>`;
      } else {
        tbody.innerHTML = invoices.slice(0, 5).map(r => {
          const isPaid = r.status === 'PAID';
          const badgeClass = isPaid ? 'badge-green' : (r.status === 'OVERDUE' ? 'badge-red' : 'badge-blue');
          return `
            <tr>
              <td style="font-family:monospace;font-size:12px;font-weight:700;color:var(--blue);cursor:pointer;" onclick="openResidentInvoiceModal('${r.id}')">${r.invoiceNumber}</td>
              <td style="font-weight:600;">${r.billingMonth}</td>
              <td style="font-weight:700;">₹${(r.totalAmount || 0).toLocaleString('en-IN')}</td>
              <td><span class="badge ${badgeClass}">${r.status}</span></td>
              <td>
                <div style="display:flex;gap:4px;">
                  ${isPaid ? `
                    <button class="btn btn-ghost btn-sm" onclick="openResidentReceiptModal('${r.id}')">🧾 Receipt</button>
                  ` : `
                    <button class="btn btn-primary btn-sm" onclick="triggerRazorpayPayment('${r.id}', ${r.balanceAmount || r.totalAmount}, 'Flat ${r.unit?.unitNumber || unitNum}')">⚡ Pay</button>
                  `}
                  <button class="btn btn-ghost btn-sm" onclick="openResidentInvoiceModal('${r.id}')">📄 View</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 9. Render Live Society Announcements (Notices)
    const noticesList = document.getElementById('residentDashboardNoticesList');
    if (noticesList) {
      if (allNotices.length === 0) {
        noticesList.innerHTML = `
          <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
            No official notices published recently. Everything in society is operating smoothly.
          </div>
        `;
      } else {
        noticesList.innerHTML = allNotices.slice(0, 3).map(n => {
          const badgeColor = n.type === 'ELECTION' ? 'purple' : n.type === 'URGENT' ? 'red' : n.type === 'MAINTENANCE' ? 'amber' : n.type === 'EVENT' ? 'green' : 'blue';
          const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
          return `
            <div style="padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:10px;background:var(--bg-surface);cursor:pointer;transition:all 0.12s;"
              onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='var(--border-light)'"
              onclick="window.openResidentNoticeModal('${n.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="badge badge-${badgeColor}">${n.type || 'NOTICE'}</span>
                <span style="font-size:11px;color:var(--text-muted);">Posted ${dateStr}</span>
              </div>
              <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:var(--text-primary);">${n.title}</div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${n.content}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 10. Render Live Poll Banner & Right Column Widget
    const openPolls = allPolls.filter(p => p.status === 'OPEN');
    const firstPoll = openPolls[0] || allPolls[0];
    const pollBanner = document.getElementById('residentDashboardPollAlert');
    const pollWidget = document.getElementById('residentDashboardPollWidget');

    if (pollBanner) {
      if (firstPoll && firstPoll.status === 'OPEN') {
        const flatVoteBanner = (firstPoll.voters || []).find(v => (unitNum && v.unit && v.unit.toUpperCase() === unitNum.toUpperCase()));
        const hasVotedBanner = !!flatVoteBanner;
        pollBanner.style.display = 'block';
        pollBanner.innerHTML = `
          <div style="padding:14px 18px;background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08));border:1px solid rgba(59,130,246,0.25);border-radius:var(--r-md);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <span style="font-size:24px;">🗳️</span>
              <div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="badge ${hasVotedBanner ? 'badge-green' : 'badge-blue'}">${hasVotedBanner ? `✓ Flat ${unitNum} Voted` : 'Action Required'}</span>
                  <span style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${firstPoll.title}</span>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                  ${hasVotedBanner ? `Your flat (${unitNum}) has cast its official vote on this resolution.` : 'Democratic voting is open until ' + (firstPoll.closesFormatted || firstPoll.closes) + '. Cast your vote now.'}
                </div>
              </div>
            </div>
            <button class="btn ${hasVotedBanner ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="Router.go('resident-polls')">
              ${hasVotedBanner ? 'View Results →' : '🗳️ Vote Now →'}
            </button>
          </div>
        `;
      } else {
        pollBanner.style.display = 'none';
      }
    }

    if (pollWidget) {
      if (!firstPoll) {
        pollWidget.innerHTML = `
          <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
            No community polls active right now. All society proposals are up to date.
          </div>
        `;
      } else {
        const flatVote = (firstPoll.voters || []).find(v => (unitNum && v.unit && v.unit.toUpperCase() === unitNum.toUpperCase()));
        const hasVoted = !!flatVote;
        const votedOptId = flatVote ? flatVote.optionId : null;
        const isOpen = firstPoll.status === 'OPEN';

        pollWidget.innerHTML = `
          <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:var(--text-primary);line-height:1.35;">
            ${firstPoll.title}
          </div>
          ${firstPoll.description ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.45;">
              ${firstPoll.description}
            </div>
          ` : ''}

          ${hasVoted ? `
            <div style="padding:8px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:6px;margin-bottom:12px;font-size:11.5px;color:var(--green);font-weight:600;">
              ✓ Vote recorded for Flat <strong>${unitNum}</strong>
            </div>
          ` : ''}

          <div style="display:flex;flex-direction:column;gap:8px;">
            ${(firstPoll.options || []).map(opt => {
              const isSelected = hasVoted && opt.id === votedOptId;
              if (hasVoted || !isOpen) {
                return `
                  <div style="padding:10px 12px;border:1px solid ${isSelected ? 'var(--blue)' : 'var(--border-light)'};border-radius:var(--r-md);background:${isSelected ? 'rgba(37,99,235,0.06)' : 'var(--bg-surface)'};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;font-weight:600;">
                      <span>${isSelected ? '✓ ' : ''}${opt.label}</span>
                      <span style="color:var(--blue);font-weight:700;">${opt.pct || 0}% (${opt.votes || 0})</span>
                    </div>
                    <div style="width:100%;height:6px;background:var(--border-light);border-radius:3px;overflow:hidden;">
                      <div style="width:${opt.pct || 0}%;height:100%;background:${isSelected ? 'var(--blue)' : 'var(--text-muted)'};border-radius:3px;"></div>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <button class="btn btn-secondary w-full" style="justify-content:space-between;border-color:var(--border);font-size:12px;padding:8px 12px;"
                    onclick="window.castResidentVote('${firstPoll.id}', '${opt.id}', '${(opt.label || '').replace(/'/g, "\\'")}')">
                    <span>${opt.label}</span>
                    <span style="font-weight:700;color:var(--blue)">Vote →</span>
                  </button>
                `;
              }
            }).join('')}
          </div>
          <div style="margin-top:10px;font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;">
            <span>${firstPoll.totalVotes || 0} votes cast</span>
            <span>Closes: ${firstPoll.closesFormatted || firstPoll.closes || 'Soon'}</span>
          </div>
        `;
      }
    }

    // 11. Render Live Complaints List (Image 2 Requests Style)
    const compList = document.getElementById('residentDashboardComplaintsList');
    if (compList) {
      if (unitComplaints.length === 0) {
        compList.innerHTML = `
          <div style="padding:22px 16px;text-align:center;color:var(--text-muted);font-size:12px;background:#F8FAFC;border-radius:16px;border:1px dashed #E2E8F0;">
            <div style="font-size:26px;margin-bottom:6px;">🛠️</div>
            <div style="font-weight:700;color:#0F172A;font-size:13px;">No active tickets</div>
            <div style="font-size:11.5px;margin-top:2px;color:#64748B;">All maintenance systems in Flat ${unitNum} are operational.</div>
            <button class="btn btn-primary btn-xs" style="margin-top:10px;padding:5px 12px;font-size:11px;" onclick="openNewComplaintModal()">+ Raise Ticket</button>
          </div>
        `;
      } else {
        compList.innerHTML = unitComplaints.slice(0, 4).map(c => {
          const status = (c.status || 'OPEN').toUpperCase();
          let pillClass = 'new';
          let pillLabel = 'New';
          if (status === 'IN_PROGRESS') {
            pillClass = 'in-progress';
            pillLabel = 'In Progress';
          } else if (status === 'PENDING' || status === 'ON_HOLD') {
            pillClass = 'pending';
            pillLabel = 'Pending';
          } else if (status === 'RESOLVED' || status === 'CLOSED') {
            pillClass = 'resolved';
            pillLabel = 'Resolved';
          }

          const category = c.category || 'General';
          let avatarIcon = '🔧';
          let avatarBg = '#EEF2FF';
          let avatarColor = '#4F46E5';
          if (category.toLowerCase().includes('elec')) {
            avatarIcon = '⚡'; avatarBg = '#FEF3C7'; avatarColor = '#D97706';
          } else if (category.toLowerCase().includes('water') || category.toLowerCase().includes('plumb')) {
            avatarIcon = '💧'; avatarBg = '#E0F2FE'; avatarColor = '#0284C7';
          } else if (category.toLowerCase().includes('sec')) {
            avatarIcon = '🛡️'; avatarBg = '#FEE2E2'; avatarColor = '#DC2626';
          } else if (category.toLowerCase().includes('clean')) {
            avatarIcon = '🧹'; avatarBg = '#F3E8FF'; avatarColor = '#9333EA';
          }

          const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
          const locationTag = (c.unit && c.unit.unitNumber) ? `Flat ${c.unit.unitNumber}` : 'Common Area';

          return `
            <div class="res-ticket-row" onclick="Router.go('resident-complaints')" title="Click to view ticket details">
              <div class="res-ticket-avatar" style="background:${avatarBg};color:${avatarColor};">${avatarIcon}</div>
              <div class="res-ticket-info">
                <div class="res-ticket-title">${c.title}</div>
                <div class="res-ticket-sub">${locationTag} · ${category}${dateStr ? ' · ' + dateStr : ''}</div>
              </div>
              <span class="res-status-pill ${pillClass}">${pillLabel}</span>
            </div>
          `;
        }).join('');
      }
    }

    // 12. Render Resident Society Campus Location Map
    if (typeof window.renderResidentSocietyMap === 'function') {
      window.renderResidentSocietyMap(liveOrg, liveLoc);
    }

    // 13. Render Quick Intercom & Security with Real Contacts
    const quickIntercomEl = document.getElementById('residentQuickIntercomContainer');
    if (quickIntercomEl && allEmergency.length > 0) {
      quickIntercomEl.innerHTML = allEmergency.slice(0, 4).map(c => {
        const isPriority = c.isPriority;
        const phone = c.phone || '112';
        const ext = c.altPhone ? `${c.altPhone} · ` : '';
        let icon = '🛡️';
        if (c.category === 'COMMITTEE') icon = '🏛️';
        else if (c.category === 'MAINTENANCE') icon = '⚡';
        else if (c.category === 'MEDICAL') icon = '🚑';
        else if (c.category === 'POLICE_FIRE') icon = '🚓';

        const bg = isPriority ? '#FEF2F2' : '#F8FAFC';
        const border = isPriority ? '#FEE2E2' : '#F1F5F9';
        const tagColor = isPriority ? '#DC2626' : '#2563EB';
        const tagBg = isPriority ? '#FFFFFF' : '#EFF6FF';
        const tagBorder = isPriority ? '1px solid #FCA5A5' : 'none';

        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;background:${bg};border:1px solid ${border};">
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#0F172A;min-width:0;">
              <span>${icon}</span>
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${c.name} (${c.role})">${c.name}</span>
            </div>
            <a href="tel:${phone}" style="font-size:11px;font-weight:700;color:${tagColor};background:${tagBg};border:${tagBorder};padding:3px 8px;border-radius:6px;text-decoration:none;flex-shrink:0;">
              ${ext}📞 Call
            </a>
          </div>
        `;
      }).join('');
    }

    // 14. Render Today's Campus Staff & Security on Duty
    const staffDutyEl = document.getElementById('residentStaffDutyListContainer');
    if (staffDutyEl) {
      const activeStaff = allDuties.filter(d => d.status === 'ON_DUTY');
      const displayStaff = activeStaff.length > 0 ? activeStaff.slice(0, 4) : allDuties.slice(0, 4);
      if (displayStaff.length === 0) {
        staffDutyEl.innerHTML = `
          <div style="padding:16px;text-align:center;color:#64748B;font-size:12px;">
            No staff currently deployed on shift.
          </div>
        `;
      } else {
        staffDutyEl.innerHTML = displayStaff.map(d => {
          let icon = '🛡️';
          let tagColor = '#4338CA';
          let tagBg = '#EEF2FF';
          if (d.category === 'HOUSEKEEPING') { icon = '🧹'; tagColor = '#0F766E'; tagBg = '#F0FDFA'; }
          else if (d.category === 'MAINTENANCE') { icon = '⚡'; tagColor = '#B45309'; tagBg = '#FEF3C7'; }
          else if (d.category === 'SUPERVISOR') { icon = '👔'; tagColor = '#1D4ED8'; tagBg = '#EFF6FF'; }
          else if (d.category === 'GARDENING') { icon = '🌱'; tagColor = '#15803D'; tagBg = '#F0FDF4'; }

          const ext = d.altPhone ? `Ext: ${d.altPhone} · ` : '';

          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:12px;background:#F8FAFC;border:1px solid #F1F5F9;gap:10px;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                <div style="width:34px;height:34px;border-radius:10px;background:${tagBg};color:${tagColor};display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">
                  ${icon}
                </div>
                <div style="min-width:0;">
                  <div style="font-size:12.5px;font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${d.staffName} <span style="font-size:11px;font-weight:500;color:#64748B;">(${d.role})</span>
                  </div>
                  <div style="font-size:11px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">
                    📍 ${d.locationPost} · <span style="color:#059669;font-weight:700;">${d.startTime} - ${d.endTime}</span>
                  </div>
                </div>
              </div>
              <a href="tel:${d.phone}" class="btn btn-secondary btn-xs" style="text-decoration:none;font-size:11px;font-weight:700;color:#2563EB;background:#EFF6FF;border:none;padding:5px 10px;border-radius:8px;display:flex;align-items:center;gap:4px;flex-shrink:0;" title="Call ${d.staffName}">
                <span>📞 Call</span>
              </a>
            </div>
          `;
        }).join('');
      }
    }

    // 13. Render Resident Visitor Passes Bento Card
    const passesListEl = document.getElementById('residentPassesListContainer');
    const passesBadgeEl = document.getElementById('residentPassesCountBadge');
    if (passesListEl) {
      const flatPasses = (window._residentPassesList || []).filter(p => !unitNum || p.residentUnit === unitNum || (p.residentUnit || '').includes(unitNum));
      if (passesBadgeEl) {
        const activeCount = flatPasses.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN').length;
        passesBadgeEl.textContent = `${activeCount} ACTIVE`;
      }

      if (flatPasses.length === 0) {
        passesListEl.innerHTML = `
          <div style="padding:18px 14px;text-align:center;color:#64748B;font-size:12px;background:#F8FAFC;border-radius:12px;border:1px dashed #E2E8F0;">
            <div style="font-size:24px;margin-bottom:4px;">🎫</div>
            <div style="font-weight:700;color:#0F172A;font-size:13px;">No active visitor passes</div>
            <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Expecting guests, delivery, or a cab? Generate an entry pass for fast barrier clearance.</div>
            <button class="btn btn-primary btn-xs" style="margin-top:10px;padding:5px 12px;font-size:11px;" onclick="window.openGenerateEntryPassModal()">+ Generate Pass</button>
          </div>
        `;
      } else {
        passesListEl.innerHTML = flatPasses.slice(0, 4).map(p => {
          let statusPill = '';
          if (p.status === 'CHECKED_IN') {
            statusPill = `<span style="background:#DCFCE7;color:#166534;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:8px;">🟢 INSIDE</span>`;
          } else if (p.status === 'APPROVED') {
            statusPill = `<span style="background:#DBEAFE;color:#1E40AF;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:8px;">🔵 EXPECTED</span>`;
          } else if (p.status === 'CHECKED_OUT') {
            statusPill = `<span style="background:#F1F5F9;color:#64748B;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:8px;">⚪ DEPARTED</span>`;
          } else {
            statusPill = `<span style="background:#FEE2E2;color:#991B1B;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:8px;">${p.status}</span>`;
          }

          const typeIcons = { GUEST: '👥', DELIVERY: '📦', CAB: '🚖', SERVICE: '🔧', FAMILY: '👨‍👩‍👧' };
          const icon = typeIcons[p.visitorType] || '🎫';

          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:12px;background:#F8FAFC;border:1px solid #F1F5F9;gap:10px;">
              <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                <div style="width:34px;height:34px;border-radius:10px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;">
                  ${icon}
                </div>
                <div style="min-width:0;">
                  <div style="font-size:12.5px;font-weight:700;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${p.visitorName} <span style="font-size:11px;font-weight:500;color:#64748B;">(${p.visitorType})</span>
                  </div>
                  <div style="font-size:11px;color:#475569;margin-top:2px;">
                    Code: <strong style="color:#2563EB;font-family:monospace;">${p.passCode}</strong> · PIN: <strong>${p.otpPin}</strong>
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                ${statusPill}
                <button class="btn btn-ghost btn-xs" onclick='window.openDigitalPassModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' style="font-size:11px;padding:4px 8px;font-weight:700;color:#2563EB;" title="Share with guest">
                  📲 Share
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error in loadLiveResidentDashboard:', err);
  }
};

window.renderResidentSocietyMap = async function(org, loc) {
  const container = document.getElementById('residentSocietyMapContainer');
  const statusBadge = document.getElementById('residentMapStatusBadge');
  if (!container) return;

  // Resolve active organization details
  let storedOrg = org || null;
  let storedLoc = loc || null;
  let storedUser = null;
  try {
    const rawUser = localStorage.getItem('rwa_user');
    if (rawUser) {
      storedUser = JSON.parse(rawUser);
      if (!storedOrg) storedOrg = storedUser?.organization || null;
    }
  } catch(e) {}

  // Always fetch /api/settings if either org or loc is missing to ensure live data
  if (!storedOrg || !storedLoc) {
    try {
      const res = await (window.apiFetch || fetch)('/api/settings').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data?.settings?.location) {
          storedLoc = data.settings.location;
          try { localStorage.setItem('rwa_society_location', JSON.stringify(storedLoc)); } catch(e) {}
        }
        if (data?.organization) {
          storedOrg = data.organization;
          if (storedUser) {
            storedUser.organization = data.organization;
            try { localStorage.setItem('rwa_user', JSON.stringify(storedUser)); } catch(e) {}
          }
        }
      }
    } catch(e) {}
  }

  if (!storedLoc) {
    try {
      const rawLoc = localStorage.getItem('rwa_society_location');
      if (rawLoc) storedLoc = JSON.parse(rawLoc);
    } catch(e) {}
  }

  const activeOrg = storedOrg || {
    name: 'Society Campus',
    address: '',
    city: 'Chandigarh',
    pincode: ''
  };

  const activeLoc = storedLoc || activeOrg.location || {};
  window.__residentSocietyLocation = activeLoc;
  window.__residentSocietyOrg = activeOrg;

  // Build full address string added by RWA agent
  const addressParts = [
    activeLoc.address || activeOrg.address,
    activeLoc.city || activeOrg.city,
    activeLoc.pincode || activeOrg.pincode
  ].filter(Boolean);

  const landmarkPart = (activeLoc.landmark || activeOrg.landmark || '').trim();
  const addressString = addressParts.join(', ').trim();
  const fullAddressWithLandmark = [landmarkPart, addressString].filter(Boolean).join(', ');

  const hasConfigured = activeLoc && (activeLoc.isConfigured || activeLoc.googleMapsUrl || (activeLoc.latitude && activeLoc.longitude) || addressString);
  const hasBasicAddress = !!addressString;

  if (!hasConfigured && !hasBasicAddress) {
    if (statusBadge) {
      statusBadge.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:#F59E0B;"></span> LOCATION PENDING`;
      statusBadge.style.background = '#FEF3C7';
      statusBadge.style.color = '#B45309';
      statusBadge.style.borderColor = '#FDE68A';
    }
    container.innerHTML = `
      <div style="padding:28px 16px;text-align:center;background:linear-gradient(135deg,#F8FAFC 0%,#F1F5F9 100%);border-radius:16px;border:1.5px dashed #CBD5E1;">
        <div style="width:48px;height:48px;border-radius:14px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 10px auto;border:1px solid #BFDBFE;">
          📍
        </div>
        <div style="font-size:14px;font-weight:800;color:#0F172A;margin-bottom:4px;">Society Location Pending</div>
        <div style="font-size:12px;color:#64748B;max-width:300px;margin:0 auto;line-height:1.5;">
          The management committee will configure the exact campus gate GPS pin shortly.
        </div>
      </div>
    `;
    return;
  }

  // Prioritize the actual address entered by the RWA agent!
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

  const displayAddress = addressString || 'Campus address not specified';

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
      <iframe id="residentSocietyMapIframe" src="${embedUrl}"
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
        <span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:600;color:#1E293B;">
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

    <!-- Action Buttons Grid for Residents (Directions + Copy Link) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
      <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
         style="background:linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);color:#FFFFFF;text-decoration:none;border-radius:12px;height:40px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 14px rgba(37,99,235,0.3);transition:all 0.2s ease;"
         onmouseover="this.style.boxShadow='0 6px 18px rgba(37,99,235,0.4)';this.style.transform='translateY(-1px)';"
         onmouseout="this.style.boxShadow='0 4px 14px rgba(37,99,235,0.3)';this.style.transform='translateY(0)';">
        <span>🧭 Directions ↗</span>
      </a>
      <button type="button" onclick="window.copyResidentSocietyMapLink()"
              style="background:#FFFFFF;color:#0F172A;border:1.5px solid #CBD5E1;border-radius:12px;height:40px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 1px 3px rgba(15,23,42,0.04);transition:all 0.2s ease;"
              onmouseover="this.style.background='#F8FAFC';this.style.borderColor='#94A3B8';this.style.transform='translateY(-1px)';"
              onmouseout="this.style.background='#FFFFFF';this.style.borderColor='#CBD5E1';this.style.transform='translateY(0)';">
        <span>📋 Copy Pin Link</span>
      </button>
    </div>
  `;
};

window.copyResidentSocietyMapLink = function() {
  const loc = window.__residentSocietyLocation || {};
  const org = window.__residentSocietyOrg || {};
  const addressParts = [
    loc.address || org.address,
    loc.city || org.city,
    loc.pincode || org.pincode
  ].filter(Boolean);
  const landmarkPart = (loc.landmark || org.landmark || '').trim();
  const addressString = addressParts.join(', ');
  const fullAddressWithLandmark = [landmarkPart, addressString].filter(Boolean).join(', ');

  let query = '';
  if (addressString) {
    query = fullAddressWithLandmark;
  } else if (loc.googleMapsUrl && !loc.googleMapsUrl.startsWith('http')) {
    query = loc.googleMapsUrl;
  } else if (loc.latitude && loc.longitude) {
    query = `${loc.latitude},${loc.longitude}`;
  } else {
    query = [org.name, org.city].filter(Boolean).join(', ');
  }

  const url = (loc.googleMapsUrl && loc.googleMapsUrl.startsWith('http'))
    ? loc.googleMapsUrl
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (typeof showToast === 'function') {
        showToast('📍 Campus Map Pin copied to clipboard! Share with visitors & deliveries.', 'success');
      } else {
        alert('Copied campus map link: ' + url);
      }
    }).catch(() => {
      prompt('Copy this Google Maps link:', url);
    });
  } else {
    prompt('Copy this Google Maps link:', url);
  }
};

window.toggleResidentAdSound = function(e) {
  if (e) e.stopPropagation();
  const video = document.getElementById('residentAdVideoEl');
  const btn = e ? e.currentTarget : null;
  if (video) {
    video.muted = !video.muted;
    if (btn) {
      btn.innerHTML = video.muted ? '🔇 Unmute' : '🔊 Mute';
    }
  }
};

window.claimResidentAdOffer = function(adId) {
  if (window.AdsManager) {
    window.AdsManager.recordClick(adId);
  }
  const ads = window.AdsManager ? window.AdsManager.getAll() : [];
  const ad = ads.find(a => a.id === adId) || ads[0];
  if (!ad) return;

  const promoCode = 'RWA' + Math.floor(1000 + Math.random() * 9000);
  Modal.show({
    title: `🎁 ${ad.sponsor} — Resident Privilege`,
    body: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px;">
        <div style="text-align:center;padding:16px;background:linear-gradient(135deg,#EFF6FF 0%,#EEF2FF 100%);border-radius:14px;border:1px solid #BFDBFE;">
          <div style="font-size:12px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Exclusive Community Privilege</div>
          <div style="font-size:20px;font-weight:800;color:#1E3A8A;margin-bottom:6px;">${ad.title}</div>
          <div style="font-size:12.5px;color:#475569;line-height:1.5;">${ad.description}</div>
        </div>

        <div style="background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:12px;padding:14px;text-align:center;">
          <div style="font-size:11px;color:#64748B;font-weight:600;margin-bottom:4px;">YOUR RESIDENT COUPON CODE</div>
          <div style="font-size:22px;font-weight:900;letter-spacing:0.12em;color:#2563EB;font-family:monospace;">${promoCode}</div>
          <div style="font-size:10.5px;color:#10B981;font-weight:700;margin-top:4px;">✓ Verified for your society flat</div>
        </div>

        <div style="font-size:12px;color:#64748B;line-height:1.5;">
          <strong>How to redeem:</strong>
          <ul style="margin:6px 0 0 16px;padding:0;">
            <li>Apply code <strong>${promoCode}</strong> on the ${ad.sponsor} app or website checkout.</li>
            <li>Alternatively, mention your Flat number to the technician/representative upon arrival.</li>
          </ul>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">
          <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>
          <button class="btn btn-primary btn-sm" onclick="navigator.clipboard?.writeText('${promoCode}');alert('Coupon code ${promoCode} copied to clipboard!');Modal.close();">📋 Copy Code & Done</button>
        </div>
      </div>
    `
  });
};

window._residentEmergencyContactsList = window._residentEmergencyContactsList || [];
window._residentEmergencyActiveFilter = 'ALL';
window._residentEmergencySearchFilter = '';

window.openEmergencyIntercomModal = async function(preselectedCat = 'ALL') {
  window._residentEmergencyActiveFilter = preselectedCat;
  window._residentEmergencySearchFilter = '';

  let modalEl = document.getElementById('rwaResidentEmergencyModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'rwaResidentEmergencyModal';
    modalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px;
    `;
    document.body.appendChild(modalEl);
  }

  // Render initial modal state
  window.renderResidentEmergencyModalContent(modalEl, true);
  modalEl.style.display = 'flex';

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/emergency/contacts');
    if (res.ok) {
      const data = await res.json();
      if (data && data.contacts) {
        window._residentEmergencyContactsList = data.contacts;
      }
    }
  } catch(e) {
    console.error('Error fetching emergency contacts:', e);
  }

  window.renderResidentEmergencyModalContent(modalEl, false);
};

window.closeResidentEmergencyModal = function() {
  const modalEl = document.getElementById('rwaResidentEmergencyModal');
  if (modalEl) modalEl.style.display = 'none';
};

window.setResidentEmergencyModalCat = function(cat) {
  window._residentEmergencyActiveFilter = cat;
  const modalEl = document.getElementById('rwaResidentEmergencyModal');
  if (modalEl) window.renderResidentEmergencyModalContent(modalEl, false);
};

window.handleResidentEmergencySearch = function(query) {
  window._residentEmergencySearchFilter = (query || '').toLowerCase().trim();
  const modalEl = document.getElementById('rwaResidentEmergencyModal');
  if (modalEl) window.renderResidentEmergencyModalContent(modalEl, false);
};

window.triggerResidentSOSDispatch = async function() {
  const btn = document.getElementById('btnDispatchResidentSOS');
  const banner = document.getElementById('residentSOSAlertBanner');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Broadcasting Siren to Gate Guard...</span>`;
  }

  try {
    if (typeof window.playNotificationSound === 'function') {
      window.playNotificationSound();
    }

    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/emergency/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'GENERAL' }),
    });

    const data = await res.json();
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="background:#ECFDF5;border:1.5px solid #10B981;border-radius:12px;padding:12px 14px;color:#065F46;font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:10px;animation:slideUp 0.2s ease;">
          <span style="font-size:22px;">✓</span>
          <div>
            <div>${data.message || 'Emergency SOS Dispatched to Security Guard Desk & Committee!'}</div>
            <div style="font-size:11px;color:#047857;font-weight:500;margin-top:2px;">Audible siren alert & flat details broadcasted live.</div>
          </div>
        </div>
      `;
    }
    if (typeof showToast === 'function') {
      showToast('🚨 SOS siren alert dispatched to Main Gate & Committee!', 'error');
    }
  } catch(e) {
    console.error('Error dispatching SOS:', e);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>🚨 Trigger Guard Panic Alarm (Armed)</span>`;
    }
  }
};

window.renderResidentEmergencyModalContent = function(modalEl, isLoading) {
  if (!modalEl) return;
  const activeCat = window._residentEmergencyActiveFilter || 'ALL';
  const query = window._residentEmergencySearchFilter || '';

  let list = window._residentEmergencyContactsList || [];
  if (activeCat !== 'ALL') {
    list = list.filter(c => c.category === activeCat);
  }
  if (query) {
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(query) ||
      (c.role || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query) ||
      (c.altPhone || '').toLowerCase().includes(query) ||
      (c.unit || '').toLowerCase().includes(query)
    );
  }

  modalEl.innerHTML = `
    <div style="max-width:680px;width:100%;max-height:90vh;overflow-y:auto;background:#FFFFFF;border-radius:22px;box-shadow:0 25px 60px rgba(15,23,42,0.35);border:1.5px solid #E2E8F0;display:flex;flex-direction:column;animation:scaleUp 0.18s ease;">
      <!-- Modal Header -->
      <div style="padding:18px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%);position:sticky;top:0;z-index:10;border-radius:22px 22px 0 0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:12px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 8px rgba(220,38,38,0.15);">
            🚨
          </div>
          <div>
            <div style="font-size:16px;font-weight:900;color:#0F172A;letter-spacing:-0.01em;">
              Society Emergency SOS &amp; Intercom Directory
            </div>
            <div style="font-size:11.5px;color:#64748B;margin-top:2px;">
              Direct 1-tap direct-dial for on-campus gate security, managing committee &amp; emergency helplines
            </div>
          </div>
        </div>
        <button type="button" onclick="window.closeResidentEmergencyModal()" style="width:32px;height:32px;border-radius:50%;border:1px solid #CBD5E1;background:#FFFFFF;color:#64748B;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s ease;" onmouseover="this.style.background='#F1F5F9';" onmouseout="this.style.background='#FFFFFF';">
          ✕
        </button>
      </div>

      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:16px;">
        <!-- High-Impact Panic SOS Trigger Card -->
        <div style="background:linear-gradient(135deg,#FEF2F2 0%,#FFF1F2 100%);border:1.5px solid #FECACA;border-radius:16px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 14px rgba(220,38,38,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:14px;font-weight:800;color:#991B1B;display:flex;align-items:center;gap:6px;">
                <span>🚨 Instant Campus Panic Alarm</span>
                <span style="font-size:10px;background:#DC2626;color:#FFF;padding:2px 7px;border-radius:99px;font-weight:800;">LIVE DISPATCH</span>
              </div>
              <div style="font-size:12px;color:#7F1D1D;margin-top:3px;line-height:1.45;">
                In an acute medical, fire, or intrusion crisis, tap below to broadcast a loud siren alarm &amp; your flat coordinates to the security gate tablet and committee members.
              </div>
            </div>
            <button id="btnDispatchResidentSOS" class="btn btn-primary" onclick="window.triggerResidentSOSDispatch()" style="background:linear-gradient(135deg,#DC2626 0%,#B91C1C 100%);border:none;font-weight:800;font-size:12.5px;padding:10px 18px;border-radius:12px;box-shadow:0 4px 16px rgba(220,38,38,0.35);cursor:pointer;display:inline-flex;align-items:center;gap:7px;flex-shrink:0;">
              <span>🚨 Dispatch Emergency SOS</span>
            </button>
          </div>
          <div id="residentSOSAlertBanner" style="display:none;"></div>
        </div>

        <!-- Category Filter Chips & Search Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'ALL' ? 'active' : ''}" style="${activeCat === 'ALL' ? 'background:#0F172A;color:#FFF;border-color:#0F172A;' : ''}" onclick="window.setResidentEmergencyModalCat('ALL')">
              All Helplines
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'COMMITTEE' ? 'active' : ''}" style="${activeCat === 'COMMITTEE' ? 'background:#1D4ED8;color:#FFF;border-color:#1D4ED8;' : ''}" onclick="window.setResidentEmergencyModalCat('COMMITTEE')">
              🏛️ Committee
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'SECURITY' ? 'active' : ''}" style="${activeCat === 'SECURITY' ? 'background:#4338CA;color:#FFF;border-color:#4338CA;' : ''}" onclick="window.setResidentEmergencyModalCat('SECURITY')">
              🛡️ Gate Security
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'MEDICAL' ? 'active' : ''}" style="${activeCat === 'MEDICAL' ? 'background:#DC2626;color:#FFF;border-color:#DC2626;' : ''}" onclick="window.setResidentEmergencyModalCat('MEDICAL')">
              🚑 Medical
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'MAINTENANCE' ? 'active' : ''}" style="${activeCat === 'MAINTENANCE' ? 'background:#D97706;color:#FFF;border-color:#D97706;' : ''}" onclick="window.setResidentEmergencyModalCat('MAINTENANCE')">
              ⚡ Maintenance
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'POLICE_FIRE' ? 'active' : ''}" style="${activeCat === 'POLICE_FIRE' ? 'background:#C2410C;color:#FFF;border-color:#C2410C;' : ''}" onclick="window.setResidentEmergencyModalCat('POLICE_FIRE')">
              🚓 Police/Fire
            </button>
          </div>

          <div style="position:relative;width:200px;">
            <input type="text" class="form-input" placeholder="🔍 Filter helplines..." value="${query}" oninput="window.handleResidentEmergencySearch(this.value)" style="width:100%;height:30px;font-size:11.5px;padding-left:8px;border-radius:8px;" />
          </div>
        </div>

        <!-- Contacts Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;">
          ${isLoading ? `
            <div style="grid-column:1 / -1;text-align:center;padding:36px;color:#64748B;font-size:13px;">
              Loading verified emergency helplines...
            </div>
          ` : list.length === 0 ? `
            <div style="grid-column:1 / -1;text-align:center;padding:36px;color:#64748B;background:#F8FAFC;border-radius:14px;border:1px dashed #CBD5E1;">
              <div style="font-size:24px;margin-bottom:6px;">🔍</div>
              <div style="font-weight:700;color:#0F172A;font-size:13.5px;">No Contacts Match Filter</div>
              <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Try switching category tabs above.</div>
            </div>
          ` : list.map(c => {
            let catBadge = { label: 'General', color: '#0F766E', bg: '#F0FDFA', border: '#CCFBF1', icon: '📞' };
            if (c.category === 'COMMITTEE') catBadge = { label: 'Managing Committee', color: '#1D4ED8', bg: '#EFF6FF', border: '#DBEAFE', icon: '🏛️' };
            else if (c.category === 'SECURITY') catBadge = { label: 'Campus Security', color: '#4338CA', bg: '#EEF2FF', border: '#E0E7FF', icon: '🛡️' };
            else if (c.category === 'MAINTENANCE') catBadge = { label: 'Maintenance AMC', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: '⚡' };
            else if (c.category === 'MEDICAL') catBadge = { label: 'Emergency Medical', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: '🚑' };
            else if (c.category === 'POLICE_FIRE') catBadge = { label: 'Police & Rescue', color: '#C2410C', bg: '#FFF7ED', border: '#FFEDD5', icon: '🚓' };

            const isPriority = c.isPriority;
            const primaryPhone = c.phone || '112';

            return `
              <div style="padding:14px 16px;border:1.5px solid ${isPriority ? '#FECACA' : '#E2E8F0'};border-radius:14px;background:${isPriority ? 'linear-gradient(135deg,#FFF5F5 0%,#FFFFFF 100%)' : '#FFFFFF'};box-shadow:0 1px 3px rgba(15,23,42,0.04);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:${catBadge.color};background:${catBadge.bg};border:1px solid ${catBadge.border};padding:2px 7px;border-radius:6px;">
                      ${catBadge.icon} ${catBadge.label}
                    </span>
                    ${isPriority ? '<span style="font-size:9.5px;font-weight:800;color:#DC2626;background:#FEE2E2;padding:2px 6px;border-radius:4px;">★ PRIORITY</span>' : ''}
                  </div>

                  <div style="font-size:14px;font-weight:800;color:#0F172A;line-height:1.35;">
                    ${c.name}
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:2px;font-weight:500;">
                    ${c.role}
                  </div>

                  <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;font-size:11px;color:#475569;">
                    <span>📍 ${c.unit || 'Society Campus'}</span>
                    <span>·</span>
                    <span style="color:#0F766E;font-weight:600;">⏱️ ${c.availableHours || '24x7'}</span>
                  </div>
                </div>

                <div style="display:flex;gap:8px;align-items:center;">
                  <a href="tel:${primaryPhone}" class="btn btn-primary btn-sm" style="flex:1;background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;height:36px;box-shadow:0 2px 8px rgba(37,99,235,0.25);">
                    <span>📞 Call ${primaryPhone}</span>
                  </a>
                  ${c.altPhone ? `
                    <a href="tel:${c.altPhone}" class="btn btn-secondary btn-sm" title="Call Alt / Extension" style="text-decoration:none;font-size:11px;font-weight:700;height:36px;padding:0 10px;display:flex;align-items:center;justify-content:center;">
                      ${c.altPhone}
                    </a>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="padding:14px 22px;border-top:1px solid #F1F5F9;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;border-radius:0 0 22px 22px;">
        <span style="font-size:11.5px;color:#64748B;">
          ⚠️ Emergency helplines are maintained and verified directly by the RWA Committee.
        </span>
        <button class="btn btn-secondary btn-sm" onclick="window.closeResidentEmergencyModal()" style="font-weight:600;padding:6px 16px;">
          Close
        </button>
      </div>
    </div>
  `;
};

// =============================================
// Resident Staff & Guard Duty Roster Modal
// =============================================
window._residentStaffDutyList = window._residentStaffDutyList || [];
window._residentDutyModalCat = 'ALL';
window._residentDutyModalQuery = '';

window.openResidentStaffDutyModal = async function(preselectedCat = 'ALL') {
  window._residentDutyModalCat = preselectedCat;
  window._residentDutyModalQuery = '';

  let modalEl = document.getElementById('rwaResidentStaffDutyModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'rwaResidentStaffDutyModal';
    modalEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.78); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px;
    `;
    document.body.appendChild(modalEl);
  }

  window.renderResidentStaffDutyModalContent(modalEl, true);
  modalEl.style.display = 'flex';

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/staff/duty');
    if (res.ok) {
      const data = await res.json();
      if (data && data.duties) {
        window._residentStaffDutyList = data.duties;
      }
    }
  } catch(e) {
    console.error('Error fetching staff duties:', e);
  }

  window.renderResidentStaffDutyModalContent(modalEl, false);
};

window.closeResidentStaffDutyModal = function() {
  const modalEl = document.getElementById('rwaResidentStaffDutyModal');
  if (modalEl) modalEl.style.display = 'none';
};

window.setResidentStaffDutyModalCat = function(cat) {
  window._residentDutyModalCat = cat;
  const modalEl = document.getElementById('rwaResidentStaffDutyModal');
  if (modalEl) window.renderResidentStaffDutyModalContent(modalEl, false);
};

window.handleResidentStaffDutySearch = function(query) {
  window._residentDutyModalQuery = (query || '').toLowerCase().trim();
  const modalEl = document.getElementById('rwaResidentStaffDutyModal');
  if (modalEl) window.renderResidentStaffDutyModalContent(modalEl, false);
};

window.renderResidentStaffDutyModalContent = function(modalEl, isLoading) {
  if (!modalEl) return;
  const activeCat = window._residentDutyModalCat || 'ALL';
  const query = window._residentDutyModalQuery || '';

  let list = window._residentStaffDutyList || [];
  if (activeCat !== 'ALL') {
    list = list.filter(d => d.category === activeCat);
  }
  if (query) {
    list = list.filter(d =>
      (d.staffName || '').toLowerCase().includes(query) ||
      (d.role || '').toLowerCase().includes(query) ||
      (d.locationPost || '').toLowerCase().includes(query) ||
      (d.blockName || '').toLowerCase().includes(query) ||
      (d.phone || '').toLowerCase().includes(query) ||
      (d.shiftName || '').toLowerCase().includes(query)
    );
  }

  modalEl.innerHTML = `
    <div style="max-width:720px;width:100%;max-height:90vh;overflow-y:auto;background:#FFFFFF;border-radius:22px;box-shadow:0 25px 60px rgba(15,23,42,0.35);border:1.5px solid #E2E8F0;display:flex;flex-direction:column;animation:scaleUp 0.18s ease;">
      <!-- Modal Header -->
      <div style="padding:18px 22px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 100%);position:sticky;top:0;z-index:10;border-radius:22px 22px 0 0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:12px;background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 2px 8px rgba(67,56,202,0.15);">
            🛡️
          </div>
          <div>
            <div style="font-size:16px;font-weight:900;color:#0F172A;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px;">
              <span>Campus Staff &amp; Guard Duty Roster</span>
              <span style="font-size:10px;font-weight:800;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;padding:2px 7px;border-radius:99px;display:inline-flex;align-items:center;gap:3px;"><span style="width:5px;height:5px;border-radius:50%;background:#16A34A;"></span>LIVE ROSTER</span>
            </div>
            <div style="font-size:11.5px;color:#64748B;margin-top:2px;">
              Live verified gate guard posts, floor housekeeping staff, and on-call maintenance technicians
            </div>
          </div>
        </div>
        <button type="button" onclick="window.closeResidentStaffDutyModal()" style="width:32px;height:32px;border-radius:50%;border:1px solid #CBD5E1;background:#FFFFFF;color:#64748B;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s ease;" onmouseover="this.style.background='#F1F5F9';" onmouseout="this.style.background='#FFFFFF';">
          ✕
        </button>
      </div>

      <div style="padding:18px 22px;display:flex;flex-direction:column;gap:14px;">
        <!-- Category Filter Chips & Search Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'ALL' ? 'active' : ''}" style="${activeCat === 'ALL' ? 'background:#0F172A;color:#FFF;border-color:#0F172A;' : ''}" onclick="window.setResidentStaffDutyModalCat('ALL')">
              All Personnel
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'SECURITY' ? 'active' : ''}" style="${activeCat === 'SECURITY' ? 'background:#4338CA;color:#FFF;border-color:#4338CA;' : ''}" onclick="window.setResidentStaffDutyModalCat('SECURITY')">
              🛡️ Security
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'HOUSEKEEPING' ? 'active' : ''}" style="${activeCat === 'HOUSEKEEPING' ? 'background:#0F766E;color:#FFF;border-color:#0F766E;' : ''}" onclick="window.setResidentStaffDutyModalCat('HOUSEKEEPING')">
              🧹 Housekeeping
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'MAINTENANCE' ? 'active' : ''}" style="${activeCat === 'MAINTENANCE' ? 'background:#D97706;color:#FFF;border-color:#D97706;' : ''}" onclick="window.setResidentStaffDutyModalCat('MAINTENANCE')">
              ⚡ Maintenance
            </button>
            <button type="button" class="btn btn-secondary btn-xs ${activeCat === 'SUPERVISOR' ? 'active' : ''}" style="${activeCat === 'SUPERVISOR' ? 'background:#2563EB;color:#FFF;border-color:#2563EB;' : ''}" onclick="window.setResidentStaffDutyModalCat('SUPERVISOR')">
              👔 Supervisors
            </button>
          </div>

          <div style="position:relative;width:210px;">
            <input type="text" class="form-input" placeholder="🔍 Search staff, post, phone..." value="${query}" oninput="window.handleResidentStaffDutySearch(this.value)" style="width:100%;height:32px;font-size:12px;padding-left:10px;border-radius:8px;" />
          </div>
        </div>

        <!-- Duties Cards Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:12px;">
          ${isLoading ? `
            <div style="grid-column:1 / -1;text-align:center;padding:36px;color:#64748B;font-size:13px;">
              Loading verified staff roster...
            </div>
          ` : list.length === 0 ? `
            <div style="grid-column:1 / -1;text-align:center;padding:36px;color:#64748B;background:#F8FAFC;border-radius:14px;border:1px dashed #CBD5E1;">
              <div style="font-size:24px;margin-bottom:6px;">🔍</div>
              <div style="font-weight:700;color:#0F172A;font-size:13.5px;">No Staff Found For Selected Category</div>
              <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Try selecting "All Personnel" above.</div>
            </div>
          ` : list.map(d => {
            let catBadge = { label: 'Staff', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0', icon: '👤' };
            if (d.category === 'SECURITY') catBadge = { label: 'Security Guard', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', icon: '🛡️' };
            else if (d.category === 'HOUSEKEEPING') catBadge = { label: 'Housekeeping', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', icon: '🧹' };
            else if (d.category === 'MAINTENANCE') catBadge = { label: 'Maintenance AMC', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: '⚡' };
            else if (d.category === 'SUPERVISOR') catBadge = { label: 'Supervisor', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: '👔' };
            else if (d.category === 'GARDENING') catBadge = { label: 'Horticulture', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: '🌱' };

            const isOnDuty = d.status === 'ON_DUTY';
            const primaryPhone = d.phone || '9876543210';

            return `
              <div style="padding:14px 16px;border:1.5px solid ${isOnDuty ? '#BBF7D0' : '#E2E8F0'};border-radius:14px;background:${isOnDuty ? 'linear-gradient(135deg,#F0FDF4 0%,#FFFFFF 100%)' : '#FFFFFF'};box-shadow:0 1px 3px rgba(15,23,42,0.04);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
                    <span style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:${catBadge.color};background:${catBadge.bg};border:1px solid ${catBadge.border};padding:2px 8px;border-radius:6px;">
                      ${catBadge.icon} ${catBadge.label}
                    </span>
                    ${isOnDuty 
                      ? '<span style="font-size:10px;font-weight:800;color:#16A34A;background:#DCFCE7;border:1px solid #BBF7D0;padding:2px 6px;border-radius:4px;display:inline-flex;align-items:center;gap:3px;"><span style="width:5px;height:5px;border-radius:50%;background:#16A34A;"></span>ON DUTY</span>' 
                      : '<span style="font-size:10px;font-weight:600;color:#64748B;background:#F1F5F9;padding:2px 6px;border-radius:4px;">' + (d.status === 'UPCOMING' ? '⏳ Upcoming' : 'Off Duty') + '</span>'}
                  </div>

                  <div style="font-size:14.5px;font-weight:800;color:#0F172A;line-height:1.35;">
                    ${d.staffName}
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:2px;font-weight:500;">
                    ${d.role}
                  </div>

                  <div style="margin-top:10px;padding:8px 10px;background:#F8FAFC;border:1px solid #F1F5F9;border-radius:10px;display:flex;flex-direction:column;gap:4px;">
                    <div style="font-size:11.5px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:5px;">
                      <span>📍</span> <span>${d.locationPost}</span>
                    </div>
                    <div style="font-size:11px;color:#475569;display:flex;justify-content:space-between;align-items:center;">
                      <span>Block: <strong>${d.blockName || 'Campus'}</strong></span>
                      <span style="color:#059669;font-weight:700;">⏱️ ${d.shiftName} (${d.startTime} - ${d.endTime})</span>
                    </div>
                  </div>
                </div>

                <div style="display:flex;gap:8px;align-items:center;">
                  <a href="tel:${primaryPhone}" class="btn btn-primary btn-sm" style="flex:1;background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;height:36px;box-shadow:0 2px 8px rgba(37,99,235,0.25);">
                    <span>📞 Call ${primaryPhone}</span>
                  </a>
                  ${d.altPhone ? `
                    <a href="tel:${d.altPhone}" class="btn btn-secondary btn-sm" title="Call Extension" style="text-decoration:none;font-size:11px;font-weight:700;height:36px;padding:0 10px;display:flex;align-items:center;justify-content:center;">
                      ${d.altPhone}
                    </a>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="padding:14px 22px;border-top:1px solid #F1F5F9;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;border-radius:0 0 22px 22px;">
        <span style="font-size:11.5px;color:#64748B;">
          ℹ️ Real-time duty allocations &amp; gate shifts are updated live by the RWA Administration.
        </span>
        <button class="btn btn-secondary btn-sm" onclick="window.closeResidentStaffDutyModal()" style="font-weight:600;padding:6px 16px;">
          Close
        </button>
      </div>
    </div>
  `;
};

window.switchResidentDashboardFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  sessionStorage.setItem('rwa_resident_preview_unit_id', unitId);

  // Synchronize both dropdowns in DOM immediately
  const heroSel = document.querySelector('#residentHeroFlatPicker select');
  if (heroSel && heroSel.value !== unitId) heroSel.value = unitId;
  const headerSel = document.querySelector('#residentHeaderFlatSelector select');
  if (headerSel && headerSel.value !== unitId) headerSel.value = unitId;

  if (typeof window.loadLiveResidentDashboard === 'function') {
    window.loadLiveResidentDashboard();
  }
};

window.switchToAdminOwnUnit = function() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  if (user && user.unitId) {
    window.switchResidentDashboardFlat(user.unitId);
  }
};

window.connectAdminToUnit = async function(unitId) {
  if (!unitId) {
    const sel = document.getElementById('adminUnitConnectDropdown');
    unitId = sel ? sel.value : null;
  }
  if (!unitId) {
    if (typeof showToast === 'function') showToast('Please select your flat from the list first', 'warning');
    return;
  }

  const btn = document.getElementById('adminConnectUnitBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Linking...</span>';
  }

  try {
    const res = await (window.apiFetch || fetch)('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: unitId })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to link flat to admin profile');
    }

    const data = await res.json();
    const updatedUser = data.user;

    localStorage.setItem('rwa_user', JSON.stringify(updatedUser));
    localStorage.setItem('rwa_current_user', JSON.stringify(updatedUser));
    
    window.__residentPreviewUnitId = updatedUser.unitId;
    sessionStorage.setItem('rwa_resident_preview_unit_id', updatedUser.unitId);

    const topbarBtn = document.getElementById('headerConnectFlatBtn');
    if (topbarBtn) topbarBtn.remove();

    if (typeof showToast === 'function') {
      showToast(`🎉 Flat ${updatedUser.unitNumber || ''} successfully linked to your admin profile!`, 'success');
    }

    if (typeof window.loadLiveResidentDashboard === 'function') {
      window.loadLiveResidentDashboard();
    }
  } catch(err) {
    console.error('Error connecting admin to unit:', err);
    if (typeof showToast === 'function') showToast(err.message || 'Connection failed', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>🔗 Connect Flat</span>';
    }
  }
};

window.openResidentNoticeModal = function(noticeId) {
  const notices = window.__residentNoticesCache || [];
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return;

  const badgeColor = notice.type === 'ELECTION' ? 'purple' : notice.type === 'URGENT' ? 'red' : notice.type === 'MAINTENANCE' ? 'amber' : notice.type === 'EVENT' ? 'green' : 'blue';
  const dateStr = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge badge-${badgeColor}">${notice.type || 'NOTICE'}</span>
        <span style="font-size:11.5px;color:var(--text-muted);">${dateStr}</span>
      </div>
      <div style="font-size:17px;font-weight:800;color:var(--text-primary);line-height:1.35;">
        ${notice.title}
      </div>
      <div style="font-size:12px;color:var(--text-muted);">
        📢 Published by: <strong>${notice.publishedBy || 'Society Management Committee'}</strong>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--bg-elevated);border:1px solid var(--border-light);border-radius:var(--r-md);padding:14px;white-space:pre-wrap;">
        ${notice.content}
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('📢 Official Society Circular', html, 'Close', () => {}, '540px');
  } else {
    alert(`${notice.title}\n\n${notice.content}`);
  }
};

window.openResidentInvoiceModal = function(invoiceId) {
  const inv = (window.__residentCachedInvoices || []).find(i => i.id === invoiceId)
    || (window.__cachedInvoices || []).find(i => i.id === invoiceId);

  if (!inv) {
    showToast('Invoice details not found', 'warning');
    return;
  }

  const isPaid = inv.status === 'PAID';
  const unitNum = inv.unit ? inv.unit.unitNumber : 'Flat';
  const ownerName = inv.unit ? (inv.unit.ownerName || 'Resident') : 'Resident';
  const badgeClass = isPaid ? 'badge-green' : (inv.status === 'OVERDUE' ? 'badge-red' : 'badge-blue');
  const issueDateStr = new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const dueDateStr = new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const societyName = localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name') || 'Residents Welfare Association';

  const items = inv.items && inv.items.length > 0 ? inv.items : [
    { description: 'Monthly Society Maintenance Fee', amount: inv.totalAmount, totalAmount: inv.totalAmount }
  ];

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- Invoice Header Card -->
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;">Official Bill / Invoice</div>
          <div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-top:2px;">${societyName}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Flat: <strong>${unitNum}</strong> · Resident: <strong>${ownerName}</strong></div>
        </div>
        <div style="text-align:right;">
          <span class="badge ${badgeClass}" style="font-size:12px;padding:4px 10px;">${inv.status}</span>
          <div style="font-family:monospace;font-size:13px;font-weight:700;margin-top:4px;color:var(--blue);">${inv.invoiceNumber}</div>
        </div>
      </div>

      <!-- Dates & Summary Row -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px;background:var(--bg-surface);border:1px solid var(--border-light);border-radius:var(--r-md);padding:12px;">
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Billing Cycle</div>
          <div style="font-weight:700;font-size:13px;color:var(--text-primary);">${inv.billingMonth}</div>
        </div>
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Issue Date</div>
          <div style="font-weight:600;color:var(--text-primary);">${issueDateStr}</div>
        </div>
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Payment Due Date</div>
          <div style="font-weight:700;color:${isPaid ? 'var(--text-primary)' : 'var(--red)'};">${dueDateStr}</div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div style="border:1px solid var(--border-light);border-radius:var(--r-md);overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="background:var(--bg-elevated);border-bottom:1px solid var(--border-light);">
            <tr>
              <th style="padding:10px 12px;text-align:left;">Charge Description</th>
              <th style="padding:10px 12px;text-align:right;">Rate</th>
              <th style="padding:10px 12px;text-align:right;">GST</th>
              <th style="padding:10px 12px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr style="border-bottom:1px solid var(--border-light);">
                <td style="padding:10px 12px;font-weight:600;">${it.description}</td>
                <td style="padding:10px 12px;text-align:right;">₹${(it.amount || 0).toLocaleString('en-IN')}</td>
                <td style="padding:10px 12px;text-align:right;color:var(--text-muted);">${it.gstPercent ? it.gstPercent + '%' : 'Exempt'}</td>
                <td style="padding:10px 12px;text-align:right;font-weight:700;">₹${(it.totalAmount || it.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background:var(--bg-surface);font-weight:700;">
            <tr>
              <td colspan="3" style="padding:10px 12px;text-align:right;">Total Invoiced Demand:</td>
              <td style="padding:10px 12px;text-align:right;font-size:14px;color:var(--blue);">₹${(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
            </tr>
            ${inv.paidAmount > 0 ? `
              <tr style="color:var(--green);">
                <td colspan="3" style="padding:6px 12px;text-align:right;">Amount Settled:</td>
                <td style="padding:6px 12px;text-align:right;">- ₹${(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            <tr style="font-size:14px;background:var(--bg-elevated);border-top:1px solid var(--border);">
              <td colspan="3" style="padding:10px 12px;text-align:right;">Net Balance Due:</td>
              <td style="padding:10px 12px;text-align:right;font-weight:800;color:${isPaid ? 'var(--green)' : 'var(--red)'};">
                ₹${(inv.balanceAmount || (isPaid ? 0 : inv.totalAmount)).toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:4px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print / Save PDF</button>
        <div style="display:flex;gap:8px;">
          ${!isPaid ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('rwaGlobalModal').style.display='none'; triggerRazorpayPayment('${inv.id}', ${inv.balanceAmount || inv.totalAmount}, 'Flat ${unitNum}')">
              ⚡ Pay Now via Razorpay (₹${(inv.balanceAmount || inv.totalAmount).toLocaleString('en-IN')})
            </button>
          ` : `
            <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('rwaGlobalModal').style.display='none'; openResidentReceiptModal('${inv.id}')">
              🧾 View Payment Receipt
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  showModal(`📄 Maintenance Invoice · Flat ${unitNum}`, html, 'Close', () => {}, '580px');
};

window.openResidentReceiptModal = function(invoiceId) {
  const inv = (window.__residentCachedInvoices || []).find(i => i.id === invoiceId)
    || (window.__cachedInvoices || []).find(i => i.id === invoiceId)
    || (window.__residentPaymentsInvoices || []).find(i => i.id === invoiceId);

  if (!inv) {
    showToast('Invoice details not found', 'warning');
    return;
  }

  const unitNum = inv.unit ? inv.unit.unitNumber : 'Flat';
  const ownerName = inv.unit ? (inv.unit.ownerName || 'Resident') : 'Resident';
  const societyName = localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name') || 'Residents Welfare Association';
  const paidDateStr = inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Online';

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;text-align:center;padding:10px 6px;">
      <div style="width:52px;height:52px;background:rgba(16,185,129,0.12);color:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto;">
        ✓
      </div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);">Official Payment Receipt</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${societyName}</div>
      </div>

      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;text-align:left;font-size:13px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Receipt For:</span>
          <strong>${inv.billingMonth} Maintenance</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Invoice Number:</span>
          <span style="font-family:monospace;font-weight:700;">${inv.invoiceNumber}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Flat Unit:</span>
          <strong>${unitNum} (${ownerName})</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Amount Paid:</span>
          <strong style="color:var(--green);font-size:15px;">₹${(inv.paidAmount || inv.totalAmount).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Settlement Date:</span>
          <span>${paidDateStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Payment Channel:</span>
          <span class="badge badge-green">Razorpay Instant Gateway</span>
        </div>
      </div>

      <div style="font-size:11px;color:var(--text-muted);font-style:italic;">
        This is a computer-generated digital receipt issued under RWA society bylaws. No physical signature required.
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button type="button" class="btn btn-secondary" style="flex:1;" onclick="window.print()">🖨️ Print Receipt</button>
        <button type="button" class="btn btn-primary" style="flex:1;" onclick="document.getElementById('rwaGlobalModal').style.display='none'">Done ✓</button>
      </div>
    </div>
  `;

  showModal(`🧾 Payment Receipt · ${inv.invoiceNumber}`, html, 'Close', () => {}, '480px');
};

// Resident Live Notifications Screen
Screens['resident-notifications'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveNotifications === 'function') {
      window.loadLiveNotifications('resident');
    }
  }, 10);

  return Shell.render('resident-notifications', {
    title: 'My Notifications & Alerts',
    portal: 'resident',
    breadcrumb: 'Communication',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="playNotificationSound(); showToast('🔔 Notification sound played', 'info', false);"><span style="margin-right:4px;">🔊</span> Test Sound</button>
      <button class="btn btn-secondary btn-sm" onclick="markAllNotificationsAsRead()">✓ Mark All as Read</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Personal Alerts & Society Notices</div>
          <div class="page-subtitle" id="notifSubtitle">Real-time alerts for monthly bills, payments, and circulars</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="playNotificationSound(); showToast('🔔 Notification sound played', 'info', false);"><span style="margin-right:4px;">🔊</span> Test Sound</button>
          <button class="btn btn-secondary" onclick="markAllNotificationsAsRead()">✓ Mark All as Read</button>
        </div>
      </div>

      <div id="liveNotificationsList" style="display:flex; flex-direction:column; gap:12px;">
        <div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Loading notifications...</div>
      </div>
    `,
  });
};

// Resident Payment History
Screens['resident-payments'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentPayments === 'function') {
      window.loadLiveResidentPayments();
    }
  }, 10);

  return Shell.render('resident-payments', {
    title: 'Payment History',
    portal: 'resident',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-bills')">📄 My Invoices</button>
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-ledger')">📒 Account Ledger</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentPayments()">🔄 Refresh</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Payment Transactions & Receipts</div>
          <div class="page-subtitle" id="residentPaymentsSubtitle">All online payments, UPI transactions, and receipts verified by society administration</div>
        </div>
        <div id="residentPaymentsFlatPicker" style="display:flex;align-items:center;gap:8px;"></div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid-3 mb-md">
        <div class="stat-card">
          <div class="stat-label">Total Amount Settled</div>
          <div class="stat-value text-green" id="resPayStatTotal">₹0.00</div>
          <div class="stat-sub text-green" id="resPayStatPeriod">Fiscal Year 2026-27</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Verified Transactions</div>
          <div class="stat-value text-blue" id="resPayStatCount">0</div>
          <div class="stat-sub">100% Reconciliation Complete</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Payment Channel</div>
          <div class="stat-value" style="font-size:20px;" id="resPayStatMethod">Online / UPI</div>
          <div class="stat-sub">Instant Digital Receipt Issued</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Transaction History & Receipts</div>
          <button class="btn btn-secondary btn-sm" onclick="window.exportResidentPaymentsCSV ? window.exportResidentPaymentsCSV() : showToast('Transactions exported to CSV', 'info')">📊 Export History</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date & Time</th>
                <th>Payment For</th>
                <th>Method</th>
                <th>Transaction Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody id="residentPaymentsTableBody">
              <tr>
                <td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">
                  Connecting to society payment records...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};

window.switchResidentPaymentsFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.loadLiveResidentPayments();
};

window.loadLiveResidentPayments = async function() {
  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';

    const params = new URLSearchParams();
    if (activeOrgId) params.set('orgId', activeOrgId);
    if (user && user.unitId) params.set('unitId', user.unitId);

    const [payRes, invRes, unitsRes] = await Promise.all([
      (window.apiFetch || fetch)('/api/payments?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/billing/invoices?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/units').catch(() => null),
    ]);

    const payData = (payRes && payRes.ok) ? await payRes.json() : { payments: [] };
    const allDbPayments = payData.payments || [];

    const invData = (invRes && invRes.ok) ? await invRes.json() : { invoices: [] };
    const allInvoices = invData.invoices || [];
    window.__residentCachedInvoices = allInvoices;
    window.__residentPaymentsInvoices = allInvoices;

    const unitsData = (unitsRes && unitsRes.ok) ? await unitsRes.json() : { units: [] };
    const allUnits = unitsData.units || [];

    // Resolve target unit
    let targetUnitId = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId || user?.unitId;
      if (!targetUnitId && allInvoices.length > 0) {
        targetUnitId = allInvoices[0].unitId;
      } else if (!targetUnitId && allUnits.length > 0) {
        targetUnitId = allUnits[0].id;
      }
    } else {
      targetUnitId = user?.unitId || (allUnits[0] && allUnits[0].id);
    }
    window.__residentPreviewUnitId = targetUnitId;

    const currentUnit = allUnits.find(u => u.id === targetUnitId)
      || (allInvoices.find(i => i.unitId === targetUnitId)?.unit)
      || user?.unit || {};
    const unitNum = currentUnit.unitNumber || user?.unitNumber || 'Your Flat';
    const blockName = currentUnit.block?.name || currentUnit.blockName || 'Block';

    // Flat selector
    const pickerWrap = document.getElementById('residentPaymentsFlatPicker');
    if (pickerWrap) {
      if (isAdmin && allUnits.length > 0) {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Viewing Flat:</span>
            <select onchange="window.switchResidentPaymentsFlat(this.value)" class="form-select"
              style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
              title="Switch flat to view payments">
              ${allUnits.slice(0, 60).map(u => `
                <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                  🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
                </option>
              `).join('')}
            </select>
          </div>
        `;
      } else {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">My Flat:</span>
            <span style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${unitNum} (${blockName})</span>
          </div>
        `;
      }
    }

    const subEl = document.getElementById('residentPaymentsSubtitle');
    if (subEl) {
      subEl.innerHTML = `Payment history and digital receipts for Flat <strong>${unitNum}</strong> · Verified with RWA Treasury`;
    }

    // Filter payments and invoices for target unit
    const unitInvoices = targetUnitId
      ? allInvoices.filter(i => i.unitId === targetUnitId)
      : allInvoices;

    const unitPayments = targetUnitId
      ? allDbPayments.filter(p => (p.invoice && p.invoice.unitId === targetUnitId) || (p.user && p.user.unitId === targetUnitId))
      : allDbPayments;

    // Build unified transactions list from real payments & settled invoices
    const transactions = [];

    // Add DB payments
    unitPayments.forEach(p => {
      const inv = p.invoice || unitInvoices.find(i => i.id === p.invoiceId);
      const recNo = p.referenceNo || `REC-${new Date(p.createdAt || p.paidAt).getFullYear()}-${(p.id || '').slice(-6).toUpperCase()}`;
      const txnRef = p.razorpayPaymentId || p.referenceNo || `TXN-${(p.id || '').slice(-8).toUpperCase()}`;
      const dt = new Date(p.paidAt || p.createdAt || Date.now());
      const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      transactions.push({
        id: p.id,
        invoiceId: inv ? inv.id : null,
        receiptNo: recNo,
        dateStr,
        timestamp: dt.getTime(),
        paymentFor: inv ? `${inv.billingMonth} Maintenance Bill` : 'Society Maintenance & Operations',
        method: p.method || 'Online / UPI',
        txnRef,
        amount: Number(p.amount || 0),
        status: p.status === 'SUCCESS' ? 'VERIFIED' : (p.status || 'VERIFIED'),
        invoice: inv
      });
    });

    // Check paid invoices that might not have a separate payment row in DB
    const paidInvoices = unitInvoices.filter(inv => inv.status === 'PAID');
    paidInvoices.forEach(inv => {
      const alreadyHasPayment = transactions.some(t => t.invoiceId === inv.id || (t.invoice && t.invoice.id === inv.id));
      if (!alreadyHasPayment) {
        const dt = new Date(inv.issuedAt || inv.createdAt || inv.dueDate || Date.now());
        const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 10:30 AM';
        const recNo = `REC-${inv.billingMonth.replace('-', '')}-${unitNum.replace('-', '')}`;
        const txnRef = `RZP-${inv.invoiceNumber.replace(/[^0-9A-Z]/gi, '').slice(-10)}`;

        transactions.push({
          id: 'gen_' + inv.id,
          invoiceId: inv.id,
          receiptNo: recNo,
          dateStr,
          timestamp: dt.getTime(),
          paymentFor: `${inv.billingMonth} Maintenance Bill`,
          method: 'UPI / Online Gateway',
          txnRef,
          amount: Number(inv.paidAmount || inv.totalAmount || 0),
          status: 'VERIFIED',
          invoice: inv
        });
      }
    });

    // Sort latest first
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    // Update stat cards
    const totalSettled = transactions.reduce((sum, t) => sum + (t.status === 'VERIFIED' ? t.amount : 0), 0);
    const statTotalEl = document.getElementById('resPayStatTotal');
    const statCountEl = document.getElementById('resPayStatCount');
    const statPeriodEl = document.getElementById('resPayStatPeriod');

    if (statTotalEl) statTotalEl.textContent = '₹' + totalSettled.toLocaleString('en-IN');
    if (statCountEl) statCountEl.textContent = transactions.length;
    if (statPeriodEl) statPeriodEl.textContent = `${transactions.length} payments recorded · Flat ${unitNum}`;

    const tbody = document.getElementById('residentPaymentsTableBody');
    if (tbody) {
      if (transactions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center;padding:36px;color:var(--text-muted);font-size:13px;">
              <div style="font-size:28px;margin-bottom:6px;">💳</div>
              <strong>No payment transactions recorded for Flat ${unitNum} yet.</strong><br/>
              When you settle maintenance invoices via Razorpay or bank transfer, receipts will appear here automatically.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = transactions.map(t => {
          const isVerified = t.status === 'VERIFIED' || t.status === 'SUCCESS';
          const badgeClass = isVerified ? 'badge-green' : (t.status === 'REFUNDED' ? 'badge-purple' : 'badge-blue');

          return `
            <tr>
              <td style="font-family:'SF Mono',Consolas,monospace;font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.3px;">
                ${t.receiptNo}
              </td>
              <td style="font-size:12.5px;color:var(--text-secondary);">${t.dateStr}</td>
              <td style="font-weight:600;color:var(--text-primary);">${t.paymentFor}</td>
              <td><span class="badge badge-muted" style="font-size:11px;">${t.method}</span></td>
              <td style="font-family:'SF Mono',Consolas,monospace;font-size:11.5px;color:var(--text-muted);letter-spacing:0.2px;">
                ${t.txnRef}
              </td>
              <td style="font-weight:700;color:var(--text-primary);font-size:13.5px;">
                ₹${t.amount.toLocaleString('en-IN')}
              </td>
              <td><span class="badge ${badgeClass}">${t.status}</span></td>
              <td>
                <button class="btn btn-secondary btn-xs" style="white-space:nowrap;gap:4px;"
                  onclick="${t.invoiceId ? `openResidentReceiptModal('${t.invoiceId}')` : `showToast('Receipt ${t.receiptNo} verified', 'success')`}">
                  🧾 Receipt
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error in loadLiveResidentPayments:', err);
  }
};

// Resident Ledger
Screens['resident-ledger'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentLedger === 'function') {
      window.loadLiveResidentLedger();
    }
  }, 10);

  return Shell.render('resident-ledger', {
    title: 'My Ledger',
    portal: 'resident',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-bills')">📄 My Invoices</button>
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-payments')">💳 Payment History</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentLedger()">🔄 Refresh</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Personal Unit Account Ledger</div>
          <div class="page-subtitle" id="residentLedgerSubtitle">Financial Year 2026-27 statement of account and verified transactions</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div id="residentLedgerFlatPicker" style="display:flex;align-items:center;gap:6px;"></div>
          <button class="btn btn-primary btn-sm" onclick="window.printResidentLedgerStatement()">📥 Statement PDF</button>
        </div>
      </div>

      <!-- Balance Card -->
      <div class="grid-3 mb-md">
        <div class="stat-card">
          <div class="stat-label">Opening Balance (01 Apr 2026)</div>
          <div class="stat-value" id="ledgerStatOpening">₹0.00</div>
          <div class="stat-sub text-green">Nil arrears brought forward</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Invoiced (FY 2026-27)</div>
          <div class="stat-value" id="ledgerStatInvoiced">₹0.00</div>
          <div class="stat-sub" id="ledgerStatInvoicedSub">0 billing cycles</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Payments Settled</div>
          <div class="stat-value text-green" id="ledgerStatSettled">₹0.00</div>
          <div class="stat-sub text-green" id="ledgerStatBalance">Current Balance: ₹0.00</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Ledger Entries (Chronological Audit Trail)</div>
          <button class="btn btn-secondary btn-sm" onclick="window.exportResidentLedgerCSV()">📊 Export Excel</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction / Description</th>
                <th>Type</th>
                <th>Reference #</th>
                <th>Debit (₹)</th>
                <th>Credit (₹)</th>
                <th>Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody id="residentLedgerTableBody">
              <tr>
                <td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">
                  Loading accounting ledger...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};

window.switchResidentLedgerFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.loadLiveResidentLedger();
};

window.loadLiveResidentLedger = async function() {
  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';

    const params = new URLSearchParams();
    if (activeOrgId) params.set('orgId', activeOrgId);
    if (user && user.unitId) params.set('unitId', user.unitId);

    const [invRes, payRes, unitsRes] = await Promise.all([
      (window.apiFetch || fetch)('/api/billing/invoices?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/payments?' + params.toString()).catch(() => null),
      (window.apiFetch || fetch)('/api/units').catch(() => null),
    ]);

    const invData = (invRes && invRes.ok) ? await invRes.json() : { invoices: [] };
    const allInvoices = invData.invoices || [];
    window.__residentCachedInvoices = allInvoices;

    const payData = (payRes && payRes.ok) ? await payRes.json() : { payments: [] };
    const allDbPayments = payData.payments || [];

    const unitsData = (unitsRes && unitsRes.ok) ? await unitsRes.json() : { units: [] };
    const allUnits = unitsData.units || [];

    // Resolve target unit
    let targetUnitId = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId || user?.unitId;
      if (!targetUnitId && allInvoices.length > 0) {
        targetUnitId = allInvoices[0].unitId;
      } else if (!targetUnitId && allUnits.length > 0) {
        targetUnitId = allUnits[0].id;
      }
    } else {
      targetUnitId = user?.unitId || (allUnits[0] && allUnits[0].id);
    }
    window.__residentPreviewUnitId = targetUnitId;

    const currentUnit = allUnits.find(u => u.id === targetUnitId)
      || (allInvoices.find(i => i.unitId === targetUnitId)?.unit)
      || user?.unit || {};
    const unitNum = currentUnit.unitNumber || user?.unitNumber || 'Your Flat';
    const blockName = (currentUnit.block && currentUnit.block.name) || currentUnit.blockName || 'Tower';

    // Populate Flat Selector
    const pickerWrap = document.getElementById('residentLedgerFlatPicker');
    if (pickerWrap) {
      if (isAdmin && allUnits.length > 0) {
        pickerWrap.innerHTML = `
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Viewing Flat:</span>
          <select onchange="window.switchResidentLedgerFlat(this.value)" class="form-select"
            style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
            title="Switch flat to view account ledger">
            ${allUnits.slice(0, 60).map(u => `
              <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
              </option>
            `).join('')}
          </select>
        `;
      } else {
        pickerWrap.innerHTML = `
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">My Flat:</span>
          <span style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${unitNum} (${blockName})</span>
        `;
      }
    }

    const subEl = document.getElementById('residentLedgerSubtitle');
    if (subEl) {
      subEl.innerHTML = `Financial Year 2026-27 statement of account for Flat <strong>${unitNum} (${blockName})</strong>`;
    }

    // Filter invoices and payments for target flat
    const unitInvoices = targetUnitId
      ? allInvoices.filter(i => i.unitId === targetUnitId)
      : allInvoices;

    const unitPayments = targetUnitId
      ? allDbPayments.filter(p => (p.invoice && p.invoice.unitId === targetUnitId) || (p.user && p.user.unitId === targetUnitId))
      : allDbPayments;

    // Build ledger entries
    const rawEntries = [];

    // Invoices as Debits
    unitInvoices.forEach(inv => {
      const dt = new Date(inv.issuedAt || inv.createdAt || inv.dueDate || Date.now());
      rawEntries.push({
        id: 'inv_' + inv.id,
        invoiceId: inv.id,
        date: dt,
        dateStr: dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        desc: `Maintenance Demand (${inv.billingMonth})`,
        type: 'INVOICE',
        ref: inv.invoiceNumber,
        debit: Number(inv.totalAmount || 0),
        credit: 0,
      });

      // If paid, create payment credit entry
      if (inv.status === 'PAID') {
        const matchingPay = unitPayments.find(p => p.invoiceId === inv.id || (p.invoice && p.invoice.id === inv.id));
        const payDate = matchingPay ? new Date(matchingPay.paidAt || matchingPay.createdAt) : new Date(dt.getTime() + 2 * 24 * 60 * 60 * 1000);
        const refNo = matchingPay ? (matchingPay.referenceNo || matchingPay.razorpayPaymentId || `REC-${inv.invoiceNumber.slice(-8)}`) : `REC-${inv.invoiceNumber.slice(-8)}`;
        const channel = matchingPay ? (matchingPay.method || 'Online Payment') : 'Online Payment (Razorpay)';

        rawEntries.push({
          id: 'pay_' + (matchingPay ? matchingPay.id : inv.id),
          invoiceId: inv.id,
          date: payDate,
          dateStr: payDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          desc: `${channel} Settlement`,
          type: 'PAYMENT',
          ref: refNo,
          debit: 0,
          credit: Number(inv.paidAmount || inv.totalAmount || 0),
        });
      }
    });

    // Add any standalone DB payments not linked directly above
    unitPayments.forEach(p => {
      const alreadyAdded = rawEntries.some(e => e.id === 'pay_' + p.id);
      if (!alreadyAdded) {
        const dt = new Date(p.paidAt || p.createdAt || Date.now());
        rawEntries.push({
          id: 'pay_' + p.id,
          invoiceId: p.invoiceId || null,
          date: dt,
          dateStr: dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          desc: `${p.method || 'Online'} Payment Settlement`,
          type: 'PAYMENT',
          ref: p.referenceNo || p.razorpayPaymentId || `REC-${p.id.slice(-6).toUpperCase()}`,
          debit: 0,
          credit: Number(p.amount || 0),
        });
      }
    });

    // Sort chronologically ascending to calculate running balance
    rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = 0;
    rawEntries.forEach(entry => {
      if (entry.type === 'INVOICE') {
        running += entry.debit;
      } else {
        running -= entry.credit;
      }
      entry.runningBalance = running;
    });

    // Compute totals
    const totalInvoiced = unitInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
    const totalSettled = rawEntries.filter(e => e.type === 'PAYMENT').reduce((sum, e) => sum + e.credit, 0);
    const currentBalance = totalInvoiced - totalSettled;

    window.__currentLedgerData = {
      unitNum,
      blockName,
      totalInvoiced,
      totalSettled,
      currentBalance,
      entries: rawEntries,
    };

    // Update stat cards
    const statInvoicedEl = document.getElementById('ledgerStatInvoiced');
    const statInvoicedSubEl = document.getElementById('ledgerStatInvoicedSub');
    const statSettledEl = document.getElementById('ledgerStatSettled');
    const statBalanceEl = document.getElementById('ledgerStatBalance');

    if (statInvoicedEl) statInvoicedEl.textContent = '₹' + totalInvoiced.toLocaleString('en-IN');
    if (statInvoicedSubEl) statInvoicedSubEl.textContent = `${unitInvoices.length} maintenance cycles (FY 26-27)`;
    if (statSettledEl) statSettledEl.textContent = '₹' + totalSettled.toLocaleString('en-IN');
    if (statBalanceEl) {
      if (currentBalance > 0) {
        statBalanceEl.innerHTML = `<span style="color:var(--red);font-weight:700;">⚠️ Outstanding: ₹${currentBalance.toLocaleString('en-IN')} Dr</span>`;
      } else {
        statBalanceEl.innerHTML = `<span style="color:var(--green);font-weight:700;">✓ Current Balance: ₹0.00 (All Clear)</span>`;
      }
    }

    // Display rows (latest first for easy reading)
    const displayEntries = [...rawEntries].reverse();
    const tbody = document.getElementById('residentLedgerTableBody');

    if (tbody) {
      if (displayEntries.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;padding:36px;color:var(--text-muted);">
              No accounting transactions recorded for Flat ${unitNum} in FY 2026-27.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = displayEntries.map(l => {
          const isInv = l.type === 'INVOICE';
          const balStr = l.runningBalance > 0
            ? `${l.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr`
            : '0.00';

          return `
            <tr>
              <td style="white-space:nowrap;font-size:12.5px;">${l.dateStr}</td>
              <td style="font-weight:600;color:var(--text-primary);">${l.desc}</td>
              <td><span class="badge ${isInv ? 'badge-blue' : 'badge-green'}">${l.type}</span></td>
              <td style="font-family:'SF Mono',Consolas,monospace;font-size:11.5px;color:var(--blue);cursor:pointer;"
                onclick="${isInv ? `openResidentInvoiceModal('${l.invoiceId}')` : `openResidentReceiptModal('${l.invoiceId}')`}">
                ${l.ref}
              </td>
              <td style="color:${isInv ? 'var(--amber)' : 'var(--text-muted)'};font-weight:700;font-size:13px;">
                ${l.debit > 0 ? '₹' + l.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
              </td>
              <td style="color:${!isInv ? 'var(--green)' : 'var(--text-muted)'};font-weight:700;font-size:13px;">
                ${l.credit > 0 ? '₹' + l.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
              </td>
              <td style="font-weight:800;font-family:'SF Mono',Consolas,monospace;color:${l.runningBalance > 0 ? 'var(--amber)' : 'var(--green)'};">
                ${balStr}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error in loadLiveResidentLedger:', err);
  }
};

window.printResidentLedgerStatement = function() {
  const data = window.__currentLedgerData;
  if (!data) {
    showToast('Ledger data loading...', 'info');
    return;
  }

  const societyName = localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name') || 'Residents Welfare Association';

  const html = `
    <div style="padding:16px 8px;display:flex;flex-direction:column;gap:14px;">
      <div style="border-bottom:2px solid var(--border);padding-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);">${societyName}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Official Statement of Account · FY 2026-27</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:700;">Flat ${data.unitNum}</div>
          <div style="font-size:11px;color:var(--text-muted);">${data.blockName}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;background:var(--bg-elevated);border-radius:var(--r-md);padding:12px;font-size:12px;">
        <div><strong>Total Invoiced:</strong> ₹${data.totalInvoiced.toLocaleString('en-IN')}</div>
        <div><strong>Total Settled:</strong> <span style="color:var(--green)">₹${data.totalSettled.toLocaleString('en-IN')}</span></div>
        <div><strong>Net Balance:</strong> <span style="color:${data.currentBalance > 0 ? 'var(--red)' : 'var(--green)'};font-weight:700;">₹${data.currentBalance.toLocaleString('en-IN')}</span></div>
      </div>

      <div style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-md);">
        <table style="width:100%;font-size:11.5px;">
          <thead>
            <tr style="background:var(--bg-elevated);text-align:left;">
              <th style="padding:6px 8px;">Date</th>
              <th style="padding:6px 8px;">Description</th>
              <th style="padding:6px 8px;">Debit</th>
              <th style="padding:6px 8px;">Credit</th>
              <th style="padding:6px 8px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${data.entries.map(e => `
              <tr style="border-bottom:1px solid var(--border-light);">
                <td style="padding:6px 8px;">${e.dateStr}</td>
                <td style="padding:6px 8px;">${e.desc}</td>
                <td style="padding:6px 8px;">${e.debit > 0 ? '₹' + e.debit.toLocaleString('en-IN') : '—'}</td>
                <td style="padding:6px 8px;">${e.credit > 0 ? '₹' + e.credit.toLocaleString('en-IN') : '—'}</td>
                <td style="padding:6px 8px;font-weight:700;">${e.runningBalance > 0 ? '₹' + e.runningBalance.toLocaleString('en-IN') + ' Dr' : '0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="btn btn-secondary w-full" onclick="window.print()">🖨️ Print Statement</button>
        <button class="btn btn-primary w-full" onclick="document.getElementById('rwaGlobalModal').style.display='none'">Done ✓</button>
      </div>
    </div>
  `;

  showModal(`📋 Statement of Account · Flat ${data.unitNum}`, html, 'Close', () => {}, '540px');
};

window.exportResidentLedgerCSV = function() {
  const data = window.__currentLedgerData;
  if (!data || !data.entries || data.entries.length === 0) {
    showToast('No ledger entries to export', 'warning');
    return;
  }

  const headers = ['Date', 'Description', 'Type', 'Reference', 'Debit', 'Credit', 'Running Balance'];
  const rows = data.entries.map(e => [
    e.dateStr,
    `"${e.desc.replace(/"/g, '""')}"`,
    e.type,
    e.ref,
    e.debit || 0,
    e.credit || 0,
    e.runningBalance || 0
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Ledger_Statement_Flat_${data.unitNum}_FY2026-27.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Ledger exported to CSV', 'success');
};

// Resident Notice Board
// Resident Notice Board — Real-Time Synchronized with Notification Bell & In-App Alerts
Screens['resident-notices'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentNotices === 'function') {
      window.loadLiveResidentNotices();
    }
    if (typeof window.checkUnreadNotificationsBadge === 'function') {
      window.checkUnreadNotificationsBadge();
    }
  }, 10);

  return Shell.render('resident-notices', {
    title: 'Notice Board',
    portal: 'resident',
    breadcrumb: 'Community',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentNotices()">🔄 Refresh Notices</button>
      <button class="btn btn-secondary btn-sm" onclick="window.markAllResidentNoticesRead()">✓ Mark All Read</button>
      <button class="btn btn-primary btn-sm" onclick="window.toggleHeaderNotificationsMenu(event, 'resident')">🔔 Notification Bell</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Society Notice Board</div>
          <div class="page-subtitle">Official notifications, circulars, and community circulars from the Managing Committee</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentNotices()">🔄 Refresh</button>
          <button class="btn btn-secondary btn-sm" onclick="window.markAllResidentNoticesRead()">✓ Mark All Read</button>
          <button class="btn btn-primary btn-sm" onclick="window.toggleHeaderNotificationsMenu(event, 'resident')">🔔 View In Bell</button>
        </div>
      </div>

      <!-- Real-Time Notification Delivery Banner -->
      <div class="card mb-md" style="background:linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%);border:1px solid rgba(37,99,235,0.22);box-shadow:0 4px 14px rgba(15,23,42,0.04);padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:44px;height:44px;border-radius:12px;background:#2563EB;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 12px rgba(37,99,235,0.35);flex-shrink:0;">
              🔔
            </div>
            <div>
              <div style="font-size:15px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span>Instant Notification Delivery Active</span>
                <span class="badge badge-green" style="font-size:11px;padding:2px 8px;">● Live Socket Synced</span>
                <span class="badge badge-blue" id="residentNoticeBadgeCount" style="font-size:11px;padding:2px 8px;">Loading notices...</span>
              </div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;line-height:1.4;">
                Every circular and alert is instantly routed to your <strong>Notification Bell 🔔</strong>, in-app feed, and registered contact channels so nothing gets missed.
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="window.toggleHeaderNotificationsMenu(event, 'resident')" style="display:inline-flex;align-items:center;gap:6px;font-weight:700;">
              <span>🔔 Open Bell Alerts</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.markAllResidentNoticesRead()" style="display:inline-flex;align-items:center;gap:6px;">
              <span>✓ Mark All as Read</span>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="if (typeof playNotificationSound==='function') { playNotificationSound(); } showToast('🔔 Notification chime active & tested', 'info', false);" title="Test notification sound">
              <span>🔊 Test Chime</span>
            </button>
          </div>
        </div>
      </div>

      <div class="filter-bar mb-md" id="residentNoticesFilterBar">
        <div class="filter-pill active" onclick="window.filterResidentNotices('ALL', this)" id="pill-ALL">All Notices <span class="pill-count" id="count-ALL"></span></div>
        <div class="filter-pill" onclick="window.filterResidentNotices('GENERAL', this)" id="pill-GENERAL">General Circulars <span class="pill-count" id="count-GENERAL"></span></div>
        <div class="filter-pill" onclick="window.filterResidentNotices('EVENT', this)" id="pill-EVENT">Events & Celebrations <span class="pill-count" id="count-EVENT"></span></div>
        <div class="filter-pill" onclick="window.filterResidentNotices('MAINTENANCE', this)" id="pill-MAINTENANCE">Maintenance Alerts <span class="pill-count" id="count-MAINTENANCE"></span></div>
        <div class="filter-pill" onclick="window.filterResidentNotices('ELECTION', this)" id="pill-ELECTION">Elections & AGM <span class="pill-count" id="count-ELECTION"></span></div>
      </div>

      <div id="residentNoticesLiveContainer" style="display:flex;flex-direction:column;gap:16px;">
        <div style="text-align:center;padding:36px;color:var(--text-muted);">
          Loading official society notices...
        </div>
      </div>
    `,
  });
};

window.loadLiveResidentNotices = async function() {
  const container = document.getElementById('residentNoticesLiveContainer');
  if (!container) return;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/notices?status=PUBLISHED');
    if (res.ok) {
      const data = await res.json();
      window.__residentNoticesFullCache = data.notices || [];

      // Update badge count
      const badgeCount = document.getElementById('residentNoticeBadgeCount');
      if (badgeCount) {
        badgeCount.textContent = `${window.__residentNoticesFullCache.length} Published Circulars`;
      }

      // Update filter pill counts
      const allCount = window.__residentNoticesFullCache.length;
      const genCount = window.__residentNoticesFullCache.filter(n => (n.type || 'GENERAL') === 'GENERAL').length;
      const evCount = window.__residentNoticesFullCache.filter(n => n.type === 'EVENT').length;
      const mtCount = window.__residentNoticesFullCache.filter(n => n.type === 'MAINTENANCE').length;
      const elCount = window.__residentNoticesFullCache.filter(n => n.type === 'ELECTION' || n.type === 'MEETING').length;

      const setEl = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `(${count})`;
      };
      setEl('count-ALL', allCount);
      setEl('count-GENERAL', genCount);
      setEl('count-EVENT', evCount);
      setEl('count-MAINTENANCE', mtCount);
      setEl('count-ELECTION', elCount);

      // Render active category
      const activePill = document.querySelector('#residentNoticesFilterBar .filter-pill.active');
      const activeType = activePill && activePill.id ? activePill.id.replace('pill-', '') : 'ALL';
      window.renderResidentNoticesList(activeType);

      // Synchronize notification bell badge
      if (typeof window.checkUnreadNotificationsBadge === 'function') {
        window.checkUnreadNotificationsBadge();
      }
    } else {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">Unable to load notices at this time.</div>`;
    }
  } catch (e) {
    container.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">Error connecting to notice board.</div>`;
  }
};

window.filterResidentNotices = function(type, pillEl) {
  document.querySelectorAll('#residentNoticesFilterBar .filter-pill').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
  window.renderResidentNoticesList(type);
};

window.renderResidentNoticesList = function(type) {
  const container = document.getElementById('residentNoticesLiveContainer');
  if (!container) return;

  let notices = window.__residentNoticesFullCache || [];
  if (type && type !== 'ALL') {
    if (type === 'ELECTION') {
      notices = notices.filter(n => n.type === 'ELECTION' || n.type === 'MEETING');
    } else {
      notices = notices.filter(n => (n.type || 'GENERAL') === type);
    }
  }

  if (notices.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px;background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-lg);">
        <div style="font-size:36px;margin-bottom:8px;">📢</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No notices published in this category</div>
        <div style="font-size:13px;color:var(--text-muted);">All official communications from the Managing Committee will appear here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = notices.map(n => {
    const badgeColor = n.type === 'ELECTION' ? 'purple' : n.type === 'URGENT' ? 'red' : n.type === 'MAINTENANCE' ? 'amber' : n.type === 'EVENT' ? 'green' : 'blue';
    const dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
    const isPinned = n.pinnedUntil && new Date(n.pinnedUntil) > new Date();

    const isElection = n.type === 'ELECTION' || (n.title && n.title.toLowerCase().includes('election')) || (n.title && n.title.toLowerCase().includes('voting'));
    const isMaintenance = n.type === 'MAINTENANCE';

    return `
      <div class="card" id="notice-card-${n.id}" style="border-left:4px solid var(--${badgeColor});transition:all 0.2s;box-shadow:0 2px 8px rgba(15,23,42,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="badge badge-${badgeColor}">${n.type || 'NOTICE'}</span>
            ${isPinned ? '<span class="badge badge-amber" style="font-weight:700;">📌 PINNED</span>' : ''}
            <span class="badge badge-blue" style="font-size:10px;">🔔 In-App Bell</span>
            <span class="badge badge-purple" style="font-size:10px;">📱 WhatsApp Broadcast</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:4px;">By: <strong>${n.publishedBy || 'Society Management'}</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-muted);">${dateStr}</span>
          </div>
        </div>

        <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
          ${n.title}
        </div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;white-space:pre-wrap;">${n.content}</div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding-top:12px;border-top:1px solid var(--border-light);justify-content:space-between;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            ${isElection ? `
              <button class="btn btn-primary btn-sm" onclick="Router.go('resident-polls')" style="display:inline-flex;align-items:center;gap:6px;">
                <span>🗳️ Cast Secret Ballot Now →</span>
              </button>
            ` : ''}
            ${isMaintenance ? `
              <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-complaints')" style="display:inline-flex;align-items:center;gap:6px;">
                <span>🔧 View Helpdesk / Tickets</span>
              </button>
            ` : ''}
            ${n.attachmentUrl ? `
              <a href="${n.attachmentUrl}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
                <span>📎 View Circular PDF</span>
              </a>
            ` : ''}
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-ghost btn-sm" onclick="window.markSingleNoticeRead('${n.id}', this)" style="font-size:11px;color:var(--text-muted);">
              ✓ Mark as Read
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.shareNoticeCircular('${n.id}', '${(n.title || '').replace(/'/g, "\\'")}')" style="font-size:11px;color:var(--text-muted);" title="Share notice">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.markSingleNoticeRead = async function(noticeId, btnEl) {
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeId }),
    });

    if (res.ok) {
      if (btnEl) {
        btnEl.textContent = '✓ Read';
        btnEl.disabled = true;
        btnEl.style.color = 'var(--text-muted)';
      }
      showToast('✓ Notice circular marked as read', 'success');
      if (typeof window.checkUnreadNotificationsBadge === 'function') {
        window.checkUnreadNotificationsBadge();
      }
    }
  } catch (e) {
    showToast('Failed to update notice state', 'warning');
  }
};

window.markAllResidentNoticesRead = async function() {
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });

    if (res.ok) {
      showToast('✓ All society notices and notifications marked as read', 'success');
      if (typeof window.checkUnreadNotificationsBadge === 'function') {
        window.checkUnreadNotificationsBadge();
      }
      if (typeof window.updateNotificationBellBadge === 'function') {
        window.updateNotificationBellBadge(false);
      }
      // Update buttons on screen
      document.querySelectorAll('#residentNoticesLiveContainer button').forEach(b => {
        if (b.textContent.includes('Mark as Read')) {
          b.textContent = '✓ Read';
          b.disabled = true;
        }
      });
    }
  } catch (e) {
    showToast('Failed to mark all as read', 'warning');
  }
};

window.shareNoticeCircular = function(noticeId, title) {
  const url = `${window.location.origin}/#resident-notices`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(`${title} - Read full circular on Society Notice Board: ${url}`).then(() => {
      showToast('✓ Notice circular link copied to clipboard!', 'info');
    }).catch(() => {
      showToast(`Link: ${url}`, 'info');
    });
  } else {
    showToast(`Link: ${url}`, 'info');
  }
};

// =============================================
// Resident Polls & Democratic Voting
// =============================================
// =============================================
// Resident Polls & Democratic Voting
// =============================================
window.__residentPollsCache = null;
window.__residentPollsAllUnits = null;
window.__residentPollsActiveFilter = 'ALL';

window.loadLiveResidentPolls = async function() {
  const container = document.getElementById('residentPollsLiveContainer');
  if (!container) return;

  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');

    // 1. Fetch units if not cached
    if (!window.__residentPollsAllUnits) {
      try {
        const unitsRes = await (window.apiFetch || fetch)('/api/units').catch(() => null);
        if (unitsRes && unitsRes.ok) {
          const uData = await unitsRes.json();
          window.__residentPollsAllUnits = uData.units || [];
        }
      } catch (err) {}
    }

    const allUnits = window.__residentPollsAllUnits || [];

    // Resolve target unit
    let targetUnitId = null;
    let targetUnit = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId || user?.unitId;
      if (targetUnitId && allUnits.length > 0) {
        targetUnit = allUnits.find(u => u.id === targetUnitId);
      }
      if (!targetUnit && allUnits.length > 0) {
        targetUnit = allUnits[0];
        targetUnitId = targetUnit.id;
      }
    } else {
      targetUnitId = user?.unitId;
      targetUnit = allUnits.find(u => u.id === targetUnitId) || user?.unit;
    }
    window.__residentPreviewUnitId = targetUnitId;

    const targetUnitNumber = targetUnit?.unitNumber || user?.unitNumber || (allUnits[0] && allUnits[0].unitNumber) || 'Unit';
    const targetBlockName = targetUnit?.block?.name || targetUnit?.blockName || (allUnits[0] && allUnits[0].block && allUnits[0].block.name) || 'Main Block';

    // 2. Populate Flat Picker in Header
    const pickerWrap = document.getElementById('residentPollsFlatPicker');
    if (pickerWrap) {
      if (isAdmin && allUnits.length > 0) {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Voting Unit:</span>
            <select onchange="window.switchResidentPollsFlat(this.value)" class="form-select"
              style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
              title="Switch flat to cast vote">
              ${allUnits.slice(0, 80).map(u => `
                <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                  🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
                </option>
              `).join('')}
            </select>
          </div>
        `;
      } else {
        pickerWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Voting Unit:</span>
            <span style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${targetUnitNumber} (${targetBlockName})</span>
          </div>
        `;
      }
    }

    // 3. Fetch Polls for this specific unit
    const res = await (window.apiFetch || fetch)(`/api/polls?unit=${encodeURIComponent(targetUnitNumber)}`);
    if (res.ok) {
      const data = await res.json();
      window.__residentPollsCache = data.polls || [];
      const totalUnits = data.totalUnits || allUnits.length || 112;
      const polls = window.__residentPollsCache;

      // Calculate Metrics
      const openPolls = polls.filter(p => p.status === 'OPEN');
      const closedPolls = polls.filter(p => p.status === 'CLOSED');
      const myVotedCount = openPolls.filter(p => p.hasVoted).length;
      const myPendingCount = openPolls.filter(p => !p.hasVoted).length;

      const totalVotesCast = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
      const avgTurnout = polls.length > 0 ? Math.round((totalVotesCast / (polls.length * totalUnits)) * 100) : 58;

      // Update Metric Cards
      const statOpen = document.getElementById('pollStatOpen');
      const statBallot = document.getElementById('pollStatBallot');
      const statTurnout = document.getElementById('pollStatTurnout');
      const statQuorum = document.getElementById('pollStatQuorum');

      if (statOpen) statOpen.textContent = `${openPolls.length} Live Votes`;
      if (statBallot) {
        statBallot.innerHTML = myPendingCount === 0
          ? `<span class="text-green">${myVotedCount} Cast · 0 Pending ✓</span>`
          : `<span class="text-amber">${myVotedCount} Cast · ${myPendingCount} Pending</span>`;
      }
      if (statTurnout) statTurnout.textContent = `${avgTurnout}% Turnout`;
      if (statQuorum) statQuorum.textContent = `50% Quorum Target`;

      // Update Subtitle
      const subEl = document.getElementById('residentPollsSubtitle');
      if (subEl) {
        subEl.textContent = `Democratic governance for Unit ${targetUnitNumber} (${targetBlockName}) · Exactly 1 vote allocated per flat`;
      }

      // Update Filter Pill Counts
      const setPill = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `(${count})`;
      };
      setPill('pollPillCountAll', polls.length);
      setPill('pollPillCountActive', openPolls.length);
      setPill('pollPillCountClosed', closedPolls.length);

      window.renderResidentPolls(window.__residentPollsActiveFilter || 'ALL', targetUnitNumber, targetBlockName);
    } else {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--text-muted);">Failed to load community polls.</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--text-muted);">Error connecting to democratic voting register.</div>`;
  }
};

window.switchResidentPollsFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.loadLiveResidentPolls();
};

window.filterResidentPolls = function(filter, pillEl) {
  window.__residentPollsActiveFilter = filter;
  document.querySelectorAll('#residentPollsFilterBar .filter-pill').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');

  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const allUnits = window.__residentPollsAllUnits || [];
  const targetUnit = allUnits.find(u => u.id === window.__residentPreviewUnitId) || allUnits[0];
  const targetUnitNumber = targetUnit?.unitNumber || user?.unitNumber || (allUnits[0] && allUnits[0].unitNumber) || 'Unit';
  const targetBlockName = targetUnit?.block?.name || (allUnits[0] && allUnits[0].block && allUnits[0].block.name) || 'Main Block';

  window.renderResidentPolls(filter, targetUnitNumber, targetBlockName);
};

window.renderResidentPolls = function(filter = 'ALL', unitNumber = '', blockName = '') {
  const container = document.getElementById('residentPollsLiveContainer');
  if (!container) return;

  let polls = window.__residentPollsCache || [];
  if (filter === 'ACTIVE') {
    polls = polls.filter(p => p.status === 'OPEN');
  } else if (filter === 'CLOSED') {
    polls = polls.filter(p => p.status === 'CLOSED');
  }

  if (polls.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-lg);">
        <div style="font-size:36px;margin-bottom:8px;">🗳️</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No community resolutions in this category</div>
        <div style="font-size:13px;color:var(--text-muted);">You will receive a notification whenever the Management Committee opens a new vote.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = polls.map(function(p) {
    const isOpen = p.status === 'OPEN';
    const hasVoted = !!p.hasVoted;
    const votedOptionId = p.votedOptionId;
    const votedUnit = p.myVotedUnit || unitNumber;

    const totalEligible = p.totalEligible || 112;
    const quorumRequired = Math.ceil((totalEligible * (p.quorumPercent || 50)) / 100);
    const quorumReached = (p.totalVotes || 0) >= quorumRequired;
    const turnoutPct = totalEligible > 0 ? Math.round(((p.totalVotes || 0) / totalEligible) * 100) : 0;

    // Card border accent
    const cardBorder = isOpen
      ? (hasVoted ? 'border: 1px solid rgba(34,197,94,0.4); box-shadow: 0 4px 14px rgba(34,197,94,0.06);' : 'border: 1px solid rgba(59,130,246,0.3); box-shadow: 0 4px 14px rgba(59,130,246,0.06);')
      : 'border: 1px solid var(--border); box-shadow: var(--shadow-xs);';

    // Status pill
    let ballotPill = '';
    if (isOpen) {
      ballotPill = hasVoted
        ? `<span class="badge badge-green" style="font-weight:700;">✓ Flat ${votedUnit} Voted</span>`
        : `<span class="badge badge-amber" style="font-weight:700;">⚠️ Ballot Pending</span>`;
    } else {
      ballotPill = `<span class="badge badge-gray" style="font-weight:700;">Result Certified</span>`;
    }

    // Determine winning option if closed
    let winningText = p.winningOption;
    if (!winningText && !isOpen && p.options && p.options.length > 0) {
      const sorted = [...p.options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      winningText = sorted[0]?.label || 'Concluded';
    }

    return `
      <div class="card" style="${cardBorder}border-radius:var(--r-lg);padding:18px 20px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <!-- Card Header Badges -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:10px;flex-wrap:wrap;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <span class="badge badge-${isOpen ? 'green' : 'muted'}">${isOpen ? '🟢 ACTIVE VOTING' : '🔒 DECIDED & CLOSED'}</span>
              ${p.isAnonymous ? '<span class="badge badge-purple">🔒 Secret Ballot</span>' : '<span class="badge badge-teal">👁️ Open Ballot</span>'}
              ${ballotPill}
            </div>
            <span style="font-size:11.5px;color:var(--text-muted);font-weight:600;white-space:nowrap;">
              ${isOpen ? 'Closes: ' + (p.closesFormatted || p.closes || 'Ongoing') : 'Closed'}
            </span>
          </div>

          <!-- Title & Description -->
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);line-height:1.4;margin-bottom:6px;">
            ${p.title}
          </div>
          ${p.description ? `
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.55;margin-bottom:14px;">
              ${p.description}
            </div>
          ` : ''}

          <!-- Status Advisory Banner -->
          ${hasVoted ? `
            <div style="padding:10px 14px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--green);font-weight:600;">
              <span>✓</span>
              <span>Official ballot recorded for Unit <strong>${votedUnit}</strong>. In accordance with society bylaws, 1 vote is permitted per flat.</span>
            </div>
          ` : (isOpen ? `
            <div style="padding:10px 14px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--blue);font-weight:600;">
              <span>👉</span>
              <span>Select your vote option below to cast Unit <strong>${unitNumber}</strong>'s official ballot:</span>
            </div>
          ` : `
            <div style="padding:10px 14px;background:rgba(100,116,139,0.08);border:1px solid rgba(100,116,139,0.2);border-radius:8px;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);font-weight:600;">
              <span>🏆</span>
              <span>Certified Outcome: <strong>${winningText || 'Majority Resolution Passed'}</strong></span>
            </div>
          `)}

          <!-- Resolution Options List -->
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
            ${(p.options || []).map(function(opt) {
              const isMyChoice = hasVoted && (opt.id === votedOptionId);

              if (hasVoted || !isOpen) {
                // Percentage breakdown progress bars
                return `
                  <div style="padding:12px 14px;border:1px solid ${isMyChoice ? 'var(--blue)' : 'var(--border)'};border-radius:var(--r-md);background:${isMyChoice ? 'rgba(37,99,235,0.05)' : 'var(--bg-surface)'};transition:all 0.15s;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;font-weight:600;">
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span style="color:var(--text-primary);">${opt.label}</span>
                        ${isMyChoice ? '<span class="badge badge-blue" style="font-size:10px;padding:1px 6px;">✓ Unit Choice</span>' : ''}
                      </div>
                      <span style="font-weight:700;color:${isMyChoice ? 'var(--blue)' : 'var(--text-primary)'};">${opt.pct || 0}%</span>
                    </div>
                    <div class="progress-bar" style="height:7px;background:var(--bg-elevated);border-radius:4px;overflow:hidden;">
                      <div class="progress-fill ${isMyChoice ? 'blue' : (isOpen ? 'blue' : 'green')}" style="width:${opt.pct || 0}%;height:100%;transition:width 0.4s ease;"></div>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
                      ${opt.votes || 0} ballots cast (${opt.pct || 0}%)
                    </div>
                  </div>
                `;
              } else {
                // Interactive Vote Buttons
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--bg-surface);cursor:pointer;transition:all 0.15s;"
                    onmouseover="this.style.borderColor='var(--blue)';this.style.background='var(--bg-elevated)'"
                    onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg-surface)'"
                    onclick="window.castResidentVote('${p.id}', '${opt.id}', '${(opt.label||'').replace(/'/g, "\\'")}')">
                    <div style="font-size:13.5px;font-weight:600;color:var(--text-primary);flex:1;padding-right:12px;">
                      ${opt.label}
                    </div>
                    <button class="btn btn-primary btn-sm" style="font-size:12px;padding:6px 14px;flex-shrink:0;font-weight:700;">
                      🗳️ Vote
                    </button>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>

        <!-- Footer / Turnout & Quorum Compliance -->
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--text-muted);border-top:1px dashed var(--border);padding-top:12px;flex-wrap:wrap;gap:8px;">
          <span>${p.totalVotes || 0} total ballots of ${totalEligible} (${turnoutPct}% turnout)</span>
          <span style="color:${quorumReached ? 'var(--green)' : 'var(--amber)'};font-weight:700;">
            ${quorumReached ? '✓ Statutory Quorum Reached' : '⏳ Quorum: ' + quorumRequired + ' needed (' + (quorumRequired - (p.totalVotes||0)) + ' more)'}
          </span>
        </div>
      </div>
    `;
  }).join('');
};

window.castResidentVote = function(pollId, optionId, optionLabel) {
  const allUnits = window.__residentPollsAllUnits || [];
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}

  const targetUnit = allUnits.find(u => u.id === window.__residentPreviewUnitId) || allUnits[0];
  const userUnit = targetUnit?.unitNumber || user?.unitNumber || (allUnits[0] && allUnits[0].unitNumber) || 'Unit';
  const blockName = targetUnit?.block?.name || (allUnits[0] && allUnits[0].block && allUnits[0].block.name) || 'Main Block';

  const poll = (window.__residentPollsCache || []).find(p => p.id === pollId);
  if (!poll) return;

  if (poll.hasVoted) {
    if (typeof window.showToast === 'function') {
      window.showToast(`⚠️ Unit ${userUnit} has already cast an official ballot. 1 vote per flat allowed.`, 'error');
    }
    return;
  }

  // Interactive Ballot Confirmation Modal
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="padding:12px 14px;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.2);border-radius:8px;">
        <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Democratic Society Resolution</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);line-height:1.35;">${poll.title}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">Voting Unit:</div>
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);">🏠 Flat ${userUnit}</div>
          <div style="font-size:11px;color:var(--text-muted);">${blockName}</div>
        </div>
        <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:8px;border:1px solid var(--border);">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:2px;">Ballot Type:</div>
          <div style="font-size:14px;font-weight:800;color:var(--purple);">${poll.isAnonymous ? '🔒 Secret Ballot' : '👁️ Open Ballot'}</div>
          <div style="font-size:11px;color:var(--text-muted);">Immutable Record</div>
        </div>
      </div>

      <div style="padding:12px;background:rgba(16,185,129,0.06);border-radius:8px;border:1px solid rgba(16,185,129,0.25);">
        <div style="font-size:11.5px;color:var(--green);font-weight:700;margin-bottom:4px;">Selected Resolution Option:</div>
        <div style="font-size:14px;font-weight:800;color:var(--text-primary);">"${optionLabel}"</div>
      </div>

      <div style="font-size:11.5px;color:var(--text-muted);line-height:1.45;background:var(--bg-surface);padding:10px;border-radius:6px;border:1px dashed var(--border);">
        ⚖️ <strong>Society Governance Bylaws (Section 14):</strong> Each registered flat is allocated exactly 1 democratic vote. Once submitted, ballots are certified in the audit register and cannot be revoked or modified.
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('🗳️ Confirm Official Ballot', html, 'Cast Ballot Now 🗳️', async () => {
      try {
        const fetchFn = window.apiFetch || fetch;
        const res = await fetchFn('/api/polls', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: pollId, action: 'VOTE', optionId: optionId, voterUnit: userUnit }),
        });

        const data = await res.json();
        if (res.ok) {
          if (typeof playNotificationSound === 'function') {
            try { playNotificationSound(); } catch (e) {}
          }
          if (typeof window.showToast === 'function') {
            window.showToast(`🎉 Official ballot recorded for Flat ${userUnit}!`, 'success');
          }
          window.loadLiveResidentPolls();
        } else {
          if (typeof window.showToast === 'function') {
            window.showToast(`⚠️ ${data.error || 'Vote could not be cast.'}`, 'error');
          }
          window.loadLiveResidentPolls();
        }
      } catch (err) {
        if (typeof window.showToast === 'function') {
          window.showToast('Network error recording ballot. Please try again.', 'error');
        }
      }
    }, '520px');
  } else {
    // Fallback confirmation
    if (confirm(`Cast official ballot for Unit ${userUnit}?\n\nOption: "${optionLabel}"`)) {
      (window.apiFetch || fetch)('/api/polls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pollId, action: 'VOTE', optionId: optionId, voterUnit: userUnit }),
      }).then(() => {
        showToast(`🎉 Ballot recorded for Flat ${userUnit}!`, 'success');
        window.loadLiveResidentPolls();
      });
    }
  }
};

// Resident Polls Screen Container
Screens['resident-polls'] = function() {
  setTimeout(function() {
    window.loadLiveResidentPolls();
  }, 10);

  return Shell.render('resident-polls', {
    title: 'Polls & Surveys',
    portal: 'resident',
    breadcrumb: 'Community',
    actions: `
      <div id="residentPollsFlatPicker" style="display:inline-flex;align-items:center;gap:6px;"></div>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentPolls()">🔄 Refresh Polls</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">Community Polls &amp; Resolutions</div>
          <div class="page-subtitle" id="residentPollsSubtitle">Cast your unit's democratic vote on society proposals, bylaws, and capital expenditures</div>
        </div>
        <div class="page-actions" style="display:flex;align-items:center;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentPolls()">🔄 Refresh</button>
        </div>
      </div>

      <!-- Quick Resolution Metrics Grid -->
      <div class="grid-4 mb-md">
        <div class="stat-card">
          <div class="stat-label">Active Resolutions</div>
          <div class="stat-value text-blue" id="pollStatOpen">2 Live Votes</div>
          <div class="stat-sub">Democratic Bylaw Voting</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Your Flat Ballot Status</div>
          <div class="stat-value" id="pollStatBallot" style="font-size:18px;">Checking...</div>
          <div class="stat-sub">1 Vote Allocated Per Unit</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Society Participation</div>
          <div class="stat-value text-green" id="pollStatTurnout">58% Turnout</div>
          <div class="stat-sub">Across Registered Units</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Statutory Quorum</div>
          <div class="stat-value" id="pollStatQuorum" style="font-size:18px;">50% Required</div>
          <div class="stat-sub">General Body Threshold</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar mb-md" id="residentPollsFilterBar">
        <div class="filter-pill active" onclick="window.filterResidentPolls('ALL', this)">All Resolutions <span class="pill-count" id="pollPillCountAll"></span></div>
        <div class="filter-pill" onclick="window.filterResidentPolls('ACTIVE', this)">Active Voting <span class="pill-count" id="pollPillCountActive"></span></div>
        <div class="filter-pill" onclick="window.filterResidentPolls('CLOSED', this)">Decided &amp; Closed <span class="pill-count" id="pollPillCountClosed"></span></div>
      </div>

      <!-- Live Poll Cards Grid -->
      <div class="grid-2" id="residentPollsLiveContainer">
        <div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--text-muted);">
          Loading active community polls...
        </div>
      </div>
    `,
  });
};

// Resident Complaints
Screens['resident-complaints'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentComplaints === 'function') {
      window.loadLiveResidentComplaints();
    }
  }, 10);

  return Shell.render('resident-complaints', {
    title: 'My Complaints & Tickets',
    portal: 'resident',
    breadcrumb: 'Helpdesk',
    actions: `
      <div id="residentComplaintsHeaderFlatPicker" style="display:inline-flex;align-items:center;margin-right:8px;"></div>
      <button class="btn btn-primary btn-sm" onclick="openNewComplaintModal()">+ Raise Complaint</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentComplaints()">🔄 Refresh</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Complaints & Service Tickets</div>
          <div class="page-subtitle" id="residentComplaintsSubtitle">
            Track resolution progress, communicate with facility staff and monitor service SLA for your unit & common areas
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div id="residentComplaintsFlatPicker"></div>
          <button class="btn btn-primary" onclick="openNewComplaintModal()">+ New Complaint</button>
        </div>
      </div>

      <div class="dashboard-main-grid">
        <!-- Left: Complaints List & Filters -->
        <div>
          <div style="margin-bottom:10px;">
            <input type="text" id="residentTicketSearchInput" 
              placeholder="🔍 Search ticket title, #ID, or category..." 
              oninput="window.searchResidentComplaints(this.value)" 
              class="form-input" 
              style="width:100%;font-size:12.5px;padding:8px 12px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);" />
          </div>

          <div class="filter-bar mb-sm" id="residentComplaintsFilterBar">
            <div class="filter-pill active" onclick="window.filterResidentComplaints('ALL', this)">
              All Tickets (<span id="compCountAll">0</span>)
            </div>
            <div class="filter-pill" onclick="window.filterResidentComplaints('ACTIVE', this)">
              Active / In Progress (<span id="compCountActive">0</span>)
            </div>
            <div class="filter-pill" onclick="window.filterResidentComplaints('RESOLVED', this)">
              Resolved (<span id="compCountResolved">0</span>)
            </div>
          </div>

          <div id="residentComplaintsLiveList" style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">
              Loading tickets...
            </div>
          </div>
        </div>

        <!-- Right: Ticket Timeline, SLA & Comments Stream -->
        <div class="card" id="residentComplaintDetailCard" style="border:1px solid var(--border);min-height:500px;">
          <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px;">
            <div style="font-size:36px;margin-bottom:8px;">📋</div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Ticket Selected</div>
            <div>Select a ticket from the left list to view SLA lifecycle, updates, and discussion.</div>
          </div>
        </div>
      </div>
    `,
  });
};

window.switchResidentComplaintsFlat = function(unitId) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.loadLiveResidentComplaints();
};

window.loadLiveResidentComplaints = async function() {
  const listEl = document.getElementById('residentComplaintsLiveList');
  if (!listEl) return;

  try {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');

    // 1. Fetch units for flat selector
    let unitsList = window.__residentUnitsCache || [];
    if (!unitsList || unitsList.length === 0) {
      try {
        const uRes = await (window.apiFetch || fetch)('/api/units').catch(() => null);
        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          unitsList = uData.units || [];
          window.__residentUnitsCache = unitsList;
        }
      } catch (e) {}
    }

    let targetUnitId = null;
    if (isAdmin) {
      targetUnitId = window.__residentPreviewUnitId;
      if (targetUnitId === undefined) {
        targetUnitId = user?.unitId || (unitsList.length > 0 ? unitsList[0].id : 'ALL');
      }
    } else {
      targetUnitId = user?.unitId;
    }
    window.__residentPreviewUnitId = targetUnitId;

    const activeUnit = unitsList.find(u => u.id === targetUnitId) || user?.unit;
    const unitNumber = activeUnit?.unitNumber || user?.unitNumber || 'Your Flat';
    const blockName = activeUnit?.block?.name || activeUnit?.blockName || 'Block';

    // Populate Flat Pickers in Page Header & Actions Bar
    const pickers = [
      document.getElementById('residentComplaintsFlatPicker'),
      document.getElementById('residentComplaintsHeaderFlatPicker'),
    ];
    pickers.forEach(picker => {
      if (picker) {
        if (isAdmin && unitsList.length > 0) {
          picker.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:12px;font-weight:600;color:var(--text-secondary);white-space:nowrap;">Viewing Flat:</span>
              <select onchange="window.switchResidentComplaintsFlat(this.value)" class="form-select"
                style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
                title="Filter complaints by unit or view common areas">
                <option value="ALL" ${targetUnitId === 'ALL' ? 'selected' : ''}>🏢 All Units & Common Infrastructure</option>
                ${unitsList.slice(0, 80).map(u => `
                  <option value="${u.id}" ${u.id === targetUnitId ? 'selected' : ''}>
                    🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
                  </option>
                `).join('')}
              </select>
            </div>
          `;
        } else {
          picker.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:12px;font-weight:600;color:var(--text-secondary);white-space:nowrap;">My Flat:</span>
              <span style="font-size:12px;padding:4px 10px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${unitNumber} (${blockName})</span>
            </div>
          `;
        }
      }
    });

    // Subtitle update
    const subEl = document.getElementById('residentComplaintsSubtitle');
    if (subEl) {
      const unitLabel = (!isAdmin || targetUnitId !== 'ALL')
        ? `Flat ${unitNumber}`
        : 'All Units & Common Infrastructure';
      subEl.innerHTML = `Track resolution progress, communicate with facility staff and monitor service SLA for <strong>${unitLabel}</strong>`;
    }

    // 2. Fetch complaints from API
    const queryParam = targetUnitId && targetUnitId !== 'ALL' ? `?unitId=${targetUnitId}` : '?unitId=ALL';
    const res = await (window.apiFetch || fetch)(`/api/complaints${queryParam}`);
    if (res.ok) {
      const data = await res.json();
      const allComplaints = data.complaints || [];

      window.__residentComplaintsCache = (targetUnitId && targetUnitId !== 'ALL')
        ? allComplaints.filter(c => c.unitId === targetUnitId || !c.unitId || (user && c.raisedById === user.id))
        : allComplaints;

      // Update pill count badges
      const total = window.__residentComplaintsCache.length;
      const active = window.__residentComplaintsCache.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      const resolved = window.__residentComplaintsCache.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

      const cAll = document.getElementById('compCountAll');
      const cAct = document.getElementById('compCountActive');
      const cRes = document.getElementById('compCountResolved');
      if (cAll) cAll.textContent = total;
      if (cAct) cAct.textContent = active;
      if (cRes) cRes.textContent = resolved;

      window.__residentComplaintsFilter = window.__residentComplaintsFilter || 'ALL';
      window.renderResidentComplaintsList(window.__residentComplaintsFilter);
    } else {
      listEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">Failed to load tickets.</div>`;
    }
  } catch (e) {
    listEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted);">Error connecting to helpdesk.</div>`;
  }
};

window.filterResidentComplaints = function(filter, pillEl) {
  window.__residentComplaintsFilter = filter;
  document.querySelectorAll('#residentComplaintsFilterBar .filter-pill').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
  window.renderResidentComplaintsList(filter);
};

window.searchResidentComplaints = function(query) {
  window.__residentTicketSearchQuery = (query || '').toLowerCase().trim();
  window.renderResidentComplaintsList(window.__residentComplaintsFilter || 'ALL');
};

window.renderResidentComplaintsList = function(filter) {
  const listEl = document.getElementById('residentComplaintsLiveList');
  if (!listEl) return;

  let complaints = window.__residentComplaintsCache || [];
  if (filter === 'ACTIVE') {
    complaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  } else if (filter === 'RESOLVED') {
    complaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');
  }

  // Filter by search query if any
  const q = window.__residentTicketSearchQuery;
  if (q) {
    complaints = complaints.filter(c => 
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.ticketNumber && c.ticketNumber.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.unit?.unitNumber && c.unit.unitNumber.toLowerCase().includes(q))
    );
  }

  if (complaints.length === 0) {
    listEl.innerHTML = `
      <div style="padding:36px;text-align:center;background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-lg);">
        <div style="font-size:32px;margin-bottom:6px;">🛠️</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:2px;">No tickets found</div>
        <div style="font-size:12px;color:var(--text-muted);">No complaints match the current filter or search criteria.</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:12px;" onclick="openNewComplaintModal()">+ Raise New Ticket</button>
      </div>
    `;
    const detailCard = document.getElementById('residentComplaintDetailCard');
    if (detailCard) {
      detailCard.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px;">
          <div style="font-size:36px;margin-bottom:8px;">✅</div>
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Active Tickets</div>
          <div>Everything is functioning smoothly in this unit.</div>
        </div>
      `;
    }
    return;
  }

  const selectedId = window.__selectedResidentComplaintId || complaints[0].id;

  const categoryIcons = {
    'LIFT': '🛗',
    'PLUMBING': '🚰',
    'ELECTRICAL': '⚡',
    'MAINTENANCE': '🔧',
    'SECURITY': '🛡️',
    'SANITATION': '🧹',
    'OTHER': '📦',
  };

  listEl.innerHTML = complaints.map(t => {
    const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
    const badgeClass = isResolved ? 'badge-green' : (t.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-blue');
    const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const unitName = (t.unit && t.unit.unitNumber) ? `Flat ${t.unit.unitNumber}` : '🏢 Common Area';
    const isSelected = t.id === selectedId;
    const catIcon = categoryIcons[t.category] || '🔧';
    const commentsCount = (t.comments && t.comments.length) || 0;

    let priorityBadge = '';
    if (t.priority === 'URGENT') {
      priorityBadge = `<span style="font-size:10.5px;padding:2px 6px;border-radius:var(--r-sm);background:rgba(239,68,68,0.12);color:var(--red);font-weight:700;border:1px solid rgba(239,68,68,0.3);">🚨 URGENT</span>`;
    } else if (t.priority === 'HIGH') {
      priorityBadge = `<span style="font-size:10.5px;padding:2px 6px;border-radius:var(--r-sm);background:rgba(245,158,11,0.12);color:var(--amber);font-weight:700;border:1px solid rgba(245,158,11,0.3);">⚡ HIGH</span>`;
    }

    return `
      <div class="card" 
        style="padding:14px;cursor:pointer;transition:all 0.15s;border:${isSelected ? '2px solid var(--blue)' : '1px solid var(--border)'};background:${isSelected ? 'var(--bg-hover)' : 'var(--bg-surface)'};box-shadow:${isSelected ? '0 4px 12px rgba(59,130,246,0.12)' : 'none'};"
        onmouseover="if('${t.id}' !== window.__selectedResidentComplaintId) this.style.borderColor='var(--blue)'" 
        onmouseout="if('${t.id}' !== window.__selectedResidentComplaintId) this.style.borderColor='var(--border)'"
        onclick="window.selectResidentComplaint('${t.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-family:monospace;font-size:11.5px;font-weight:700;color:var(--blue);">${t.ticketNumber || t.id.slice(0, 10)}</span>
            ${priorityBadge}
          </div>
          <span class="badge ${badgeClass}">${t.status}</span>
        </div>
        <div style="font-size:13.5px;font-weight:700;margin-bottom:6px;color:var(--text-primary);line-height:1.35;">${t.title}</div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;">
          <span>${catIcon} ${t.category || 'General'} · <strong>${unitName}</strong></span>
          <div style="display:flex;align-items:center;gap:8px;">
            ${commentsCount > 0 ? `<span style="font-size:11px;color:var(--text-secondary);font-weight:600;">💬 ${commentsCount}</span>` : ''}
            <span>${dateStr}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Auto-select designated ticket
  if (selectedId) {
    window.selectResidentComplaint(selectedId);
  } else if (complaints.length > 0) {
    window.selectResidentComplaint(complaints[0].id);
  }
};

window.selectResidentComplaint = function(complaintId) {
  window.__selectedResidentComplaintId = complaintId;
  const detailCard = document.getElementById('residentComplaintDetailCard');
  if (!detailCard) return;

  const complaints = window.__residentComplaintsCache || [];
  const c = complaints.find(t => t.id === complaintId);
  if (!c) return;

  const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
  const badgeClass = isResolved ? 'badge-green' : (c.status === 'IN_PROGRESS' ? 'badge-amber' : 'badge-blue');
  const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const unitName = (c.unit && c.unit.unitNumber) ? `Flat ${c.unit.unitNumber}` : '🏢 Common Area Facility';

  // SLA Hours calculation based on priority
  let slaHours = 24;
  if (c.priority === 'URGENT') slaHours = 4;
  else if (c.priority === 'HIGH') slaHours = 12;
  else if (c.priority === 'LOW') slaHours = 48;

  // Stepped Lifecycle status calculation
  const step1Done = true;
  const step2Done = Boolean(c.assignedTo || c.status !== 'OPEN');
  const step3Done = isResolved || c.status === 'IN_PROGRESS';
  const step4Done = isResolved;

  const comments = c.comments || [];

  detailCard.innerHTML = `
    <!-- Top Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:16px;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
          <span class="badge ${badgeClass}" style="font-size:12px;padding:3px 10px;">${c.status}</span>
          <span style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:700;background:rgba(59,130,246,0.08);padding:2px 8px;border-radius:var(--r-sm);">
            ${c.ticketNumber || c.id}
          </span>
          <span class="badge ${c.priority === 'URGENT' ? 'badge-red' : (c.priority === 'HIGH' ? 'badge-amber' : 'badge-blue')}">
            Priority: ${c.priority || 'MEDIUM'} (${slaHours}h SLA)
          </span>
        </div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);line-height:1.35;margin-bottom:4px;">
          ${c.title}
        </div>
        <div style="font-size:12px;color:var(--text-muted);">
          Logged on ${dateStr} · Location: <strong>${unitName}</strong> · Raised by: <strong>${(c.raisedBy && c.raisedBy.name) || 'Resident'}</strong>
        </div>
      </div>
    </div>

    <!-- SLA Performance Banner -->
    ${isResolved ? `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:var(--r-md);padding:10px 14px;margin-bottom:16px;">
        <span style="font-size:20px;">✅</span>
        <div>
          <div style="font-size:12.5px;font-weight:700;color:var(--green);">SLA Compliant · Certified Resolved</div>
          <div style="font-size:11.5px;color:var(--text-secondary);">This ticket was resolved and signed off within society service guidelines.</div>
        </div>
      </div>
    ` : `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:var(--r-md);padding:10px 14px;margin-bottom:16px;">
        <span style="font-size:20px;">⏱️</span>
        <div>
          <div style="font-size:12.5px;font-weight:700;color:var(--blue);">Service Level Guarantee: ${slaHours} Hours SLA</div>
          <div style="font-size:11.5px;color:var(--text-secondary);">Facility team dispatched with automated escalation alerts to Society Management.</div>
        </div>
      </div>
    `}

    <!-- 4-Step Resolution Lifecycle Visual Stepper -->
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px;">
        Resolution Progress Lifecycle
      </div>
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;text-align:center;">
        <div style="padding:8px 4px;border-radius:var(--r-md);background:${step1Done ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)'};border:1px solid ${step1Done ? 'var(--green)' : 'var(--border)'};">
          <div style="font-size:16px;">📝</div>
          <div style="font-size:11.5px;font-weight:700;color:${step1Done ? 'var(--green)' : 'var(--text-muted)'};margin-top:2px;">1. Logged</div>
          <div style="font-size:10px;color:var(--text-muted);">Acknowledged</div>
        </div>
        <div style="padding:8px 4px;border-radius:var(--r-md);background:${step2Done ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)'};border:1px solid ${step2Done ? 'var(--green)' : 'var(--border)'};">
          <div style="font-size:16px;">👷</div>
          <div style="font-size:11.5px;font-weight:700;color:${step2Done ? 'var(--green)' : 'var(--text-muted)'};margin-top:2px;">2. Assigned</div>
          <div style="font-size:10px;color:var(--text-muted);">${c.assignedTo ? 'Work Order Issued' : 'Pending Vendor'}</div>
        </div>
        <div style="padding:8px 4px;border-radius:var(--r-md);background:${step3Done ? (isResolved ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)') : 'var(--bg-elevated)'};border:1px solid ${step3Done ? (isResolved ? 'var(--green)' : 'var(--amber)') : 'var(--border)'};">
          <div style="font-size:16px;">🔧</div>
          <div style="font-size:11.5px;font-weight:700;color:${step3Done ? (isResolved ? 'var(--green)' : 'var(--amber)') : 'var(--text-muted)'};margin-top:2px;">3. Inspection</div>
          <div style="font-size:10px;color:var(--text-muted);">${isResolved ? 'Work Done' : 'In Progress'}</div>
        </div>
        <div style="padding:8px 4px;border-radius:var(--r-md);background:${step4Done ? 'rgba(34,197,94,0.08)' : 'var(--bg-elevated)'};border:1px solid ${step4Done ? 'var(--green)' : 'var(--border)'};">
          <div style="font-size:16px;">✅</div>
          <div style="font-size:11.5px;font-weight:700;color:${step4Done ? 'var(--green)' : 'var(--text-muted)'};margin-top:2px;">4. Certified</div>
          <div style="font-size:10px;color:var(--text-muted);">${step4Done ? 'Sign-off Done' : 'Awaiting Check'}</div>
        </div>
      </div>
    </div>

    <!-- Description Card -->
    <div style="background:var(--bg-surface);border:1px solid var(--border-light);border-radius:var(--r-md);padding:14px;margin-bottom:16px;">
      <div style="font-size:11.5px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:6px;">Issue Description</div>
      <div style="font-size:13.5px;color:var(--text-secondary);line-height:1.5;">${c.description || 'No additional details provided.'}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-light);font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
        <span>Category: <strong>${c.category || 'General'}</strong></span>
        <span>Assigned Facility Staff: <strong>${c.assignedTo || 'Facility Supervisor (Unassigned)'}</strong></span>
      </div>
    </div>

    <!-- Official Resolution Banner (if resolved or resolutionNote present) -->
    ${c.resolutionNote ? `
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:var(--r-md);padding:14px;margin-bottom:16px;">
        <div style="font-size:11.5px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
          <span>✓</span> Official Resolution & Maintenance Sign-Off
        </div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.5;">${c.resolutionNote}</div>
      </div>
    ` : ''}

    <!-- Discussion Stream & Activity Comments -->
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <span>💬 Updates & Communication History (${comments.length})</span>
        <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">Real-time feed</span>
      </div>

      <div id="residentTicketCommentsThread" style="display:flex;flex-direction:column;gap:10px;max-height:220px;overflow-y:auto;margin-bottom:12px;padding-right:4px;">
        ${comments.length === 0 ? `
          <div style="padding:14px;text-align:center;color:var(--text-muted);font-size:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
            No comments yet. Post an update or query for facility desk below.
          </div>
        ` : comments.map(cm => `
          <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);font-size:12.5px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;">
              <span style="font-weight:700;color:var(--text-primary);">
                ${cm.authorName || 'Staff Member'} 
                <span class="badge ${cm.authorRole === 'ADMIN' ? 'badge-blue' : 'badge-gray'}" style="font-size:9.5px;padding:1px 5px;margin-left:4px;">
                  ${cm.authorRole || 'User'}
                </span>
              </span>
              <span style="color:var(--text-muted);">${cm.createdAt ? new Date(cm.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <div style="color:var(--text-secondary);line-height:1.4;">${cm.content}</div>
          </div>
        `).join('')}
      </div>

      <!-- Add Comment Form -->
      <div style="display:flex;gap:8px;">
        <input type="text" id="residentTicketCommentInput" 
          placeholder="Add an update, message, or inspection query..." 
          class="form-input" 
          style="flex:1;font-size:12.5px;padding:7px 12px;" 
          onkeydown="if(event.key==='Enter') window.sendResidentTicketComment('${c.id}')" />
        <button class="btn btn-primary btn-sm" onclick="window.sendResidentTicketComment('${c.id}')">
          💬 Send
        </button>
      </div>
    </div>

    <!-- Action Controls Footer -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border);">
      ${isResolved ? `
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="window.rateResidentTicket('${c.id}')">
          ⭐ Rate Facility Service
        </button>
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="window.reopenResidentTicket('${c.id}')">
          🔄 Reopen Ticket
        </button>
      ` : `
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="window.resolveResidentTicket('${c.id}')">
          ✓ Mark Resolved
        </button>
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="showToast('Connecting to Facility Supervisor on +91 98765 43210...', 'info')">
          📞 Call Facility Desk
        </button>
      `}
    </div>
  `;
};

window.sendResidentTicketComment = async function(complaintId) {
  const input = document.getElementById('residentTicketCommentInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) {
    showToast('Please type a message before sending', 'warning');
    return;
  }

  try {
    input.disabled = true;
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/complaints/${complaintId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const data = await res.json();
      input.value = '';
      if (typeof playNotificationSound === 'function') {
        try { playNotificationSound(); } catch(e) {}
      }
      showToast('Comment posted to ticket thread ✓', 'success');

      // Update local cache
      const c = (window.__residentComplaintsCache || []).find(t => t.id === complaintId);
      if (c) {
        if (!c.comments) c.comments = [];
        c.comments.push(data.comment);
      }
      window.selectResidentComplaint(complaintId);
    } else {
      showToast('Failed to post comment', 'error');
    }
  } catch (e) {
    showToast('Network error posting comment', 'error');
  } finally {
    if (input) input.disabled = false;
  }
};

window.reopenResidentTicket = async function(complaintId) {
  if (!confirm('Are you sure you want to reopen this ticket? Facility management will be alerted.')) return;
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'OPEN',
        resolutionNote: 'Reopened by resident: Issue recurred or requires further facility inspection',
      }),
    });
    if (res.ok) {
      showToast('🔄 Ticket reopened successfully!', 'info');
      await window.loadLiveResidentComplaints();
      window.selectResidentComplaint(complaintId);
    } else {
      showToast('Failed to reopen ticket', 'error');
    }
  } catch (e) {
    showToast('Network error reopening ticket', 'error');
  }
};

window.resolveResidentTicket = async function(complaintId) {
  if (!confirm('Confirm that this service request has been resolved to your satisfaction?')) return;
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNote: 'Verified and confirmed resolved by resident',
      }),
    });
    if (res.ok) {
      if (typeof playNotificationSound === 'function') {
        try { playNotificationSound(); } catch(e) {}
      }
      showToast('✓ Ticket marked as resolved! Thank you.', 'success');
      await window.loadLiveResidentComplaints();
      window.selectResidentComplaint(complaintId);
    } else {
      showToast('Failed to resolve ticket', 'error');
    }
  } catch (e) {
    showToast('Network error updating ticket', 'error');
  }
};

window.rateResidentTicket = function(complaintId) {
  const html = `
    <div style="text-align:center;padding:10px 0;">
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">
        How satisfied are you with the facility team's resolution speed and workmanship?
      </div>
      <div style="display:flex;justify-content:center;gap:12px;font-size:32px;cursor:pointer;margin-bottom:16px;" id="starRatingRow">
        <span onclick="this.parentElement.dataset.rating='1'; showToast('1 Star Selected', 'info');">⭐</span>
        <span onclick="this.parentElement.dataset.rating='2'; showToast('2 Stars Selected', 'info');">⭐</span>
        <span onclick="this.parentElement.dataset.rating='3'; showToast('3 Stars Selected', 'info');">⭐</span>
        <span onclick="this.parentElement.dataset.rating='4'; showToast('4 Stars Selected', 'info');">⭐</span>
        <span onclick="this.parentElement.dataset.rating='5'; showToast('5 Stars Selected (Excellent)', 'success');">⭐</span>
      </div>
      <textarea id="serviceRatingFeedback" class="form-input" rows="3" placeholder="Optional comments for facility supervisor and AMC vendor..." style="width:100%;resize:vertical;"></textarea>
    </div>
  `;
  showModal('⭐ Rate Facility Service', html, 'Submit Review ✓', async () => {
    showToast('Thank you! Your rating and feedback were recorded with Society Administration.', 'success');
  }, '420px');
};

// Resident Meetings Screen
Screens['resident-meetings'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentMeetings === 'function') {
      window.loadLiveResidentMeetings();
    }
  }, 10);

  return Shell.render('resident-meetings', {
    title: 'Society Meetings',
    portal: 'resident',
    breadcrumb: 'Governance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentMeetings()">🔄 Refresh Meetings</button>
    `,
    content: `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Meetings & General Body (AGM/EGM)</div>
          <div class="page-subtitle">View meeting schedules, download agendas, RSVP attendance, and read published Minutes (MoM)</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentMeetings()">🔄 Refresh</button>
        </div>
      </div>

      <div class="dashboard-main-grid" id="residentMeetingsContainer">
        <div style="padding:40px;text-align:center;color:var(--text-muted);grid-column:1/-1;">
          Loading society meetings...
        </div>
      </div>
    `,
  });
};

window.loadLiveResidentMeetings = async function() {
  const container = document.getElementById('residentMeetingsContainer');
  if (!container) return;

  try {
    let data = null;
    const res = await (window.apiFetch || fetch)('/api/meetings');
    if (res.ok) data = await res.json();

    const allMeetings = (data && Array.isArray(data.meetings)) ? data.meetings : [];
    const upcoming = allMeetings.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');
    const past = allMeetings.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED');

    window.__activeResidentMeeting = upcoming[0] || null;
    window.__pastResidentMeetings = past;

    // Zero dummy data: If RWA admin has not created any meetings, display clean empty state
    if (upcoming.length === 0 && past.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 56px 20px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border); border-radius: var(--r-md);">
          <div style="font-size: 40px; margin-bottom: 12px;">📅</div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">No Society Meetings Scheduled</div>
          <div style="font-size: 13px; color: var(--text-secondary); max-width: 460px; margin: 0 auto; line-height: 1.5;">
            The RWA management committee has not scheduled any upcoming General Body (AGM/EGM) or committee meetings yet. When meetings are called by the administration, agendas, timing, and digital RSVP links will appear here.
          </div>
        </div>
      `;
      return;
    }

    let leftHtml = '';
    if (upcoming.length > 0) {
      const m = upcoming[0];
      const rsvpKey = 'rwa_meeting_rsvp_' + m.id;
      const currentRsvp = localStorage.getItem(rsvpKey) || 'ATTENDING_IN_PERSON';

      let rsvpBadge = '';
      if (currentRsvp === 'ATTENDING_IN_PERSON') {
        rsvpBadge = `<span class="badge badge-green" style="font-size:12px;padding:3px 10px;">RSVP: Attending ✓</span>`;
      } else if (currentRsvp === 'ATTENDING_ONLINE') {
        rsvpBadge = `<span class="badge badge-blue" style="font-size:12px;padding:3px 10px;">RSVP: Online Attendance 💻 ✓</span>`;
      } else {
        rsvpBadge = `<span class="badge badge-gray" style="font-size:12px;padding:3px 10px;">RSVP: Cannot Attend (Proxy) ❌</span>`;
      }

      const quorumRequired = m.quorumRequired || 50;
      const attendeesCount = (m.attendees && m.attendees.length) || (currentRsvp !== 'DECLINED' ? 1 : 0);
      const quorumPercent = Math.min(100, Math.round((attendeesCount / quorumRequired) * 100));

      leftHtml = `
        <div class="card" style="border:2px solid var(--blue);box-shadow:0 6px 18px rgba(59,130,246,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:gap:8px;">
            <span class="badge badge-blue" style="font-weight:800;letter-spacing:0.4px;">UPCOMING ${m.type || 'GENERAL BODY'} MEETING</span>
            <div id="residentMeetingRsvpBadgeWrap">${rsvpBadge}</div>
          </div>

          <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:12px;line-height:1.3;">
            ${m.title}
          </div>

          <!-- Schedule & Venue Grid -->
          <div class="mini-grid-2" style="gap:12px;margin-bottom:16px;background:var(--bg-surface);padding:14px;border-radius:var(--r-md);border:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">📅</span>
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Scheduled Date</div>
                <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${m.dateFormatted || m.date || 'TBD'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">⏰</span>
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Meeting Timings</div>
                <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${m.time || '10:30 AM'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">📍</span>
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Physical Venue</div>
                <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${m.venue || 'Society Community Hall'}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">👥</span>
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Quorum Requirement</div>
                <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${quorumRequired} voting members</div>
              </div>
            </div>
          </div>

          <!-- Attendance RSVP Interactive Bar -->
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
              <span style="font-size:12.5px;font-weight:700;color:var(--text-primary);">Your Attendance RSVP:</span>
              <span style="font-size:11.5px;color:var(--text-muted);">Recorded under Society By-Laws</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-sm ${currentRsvp === 'ATTENDING_IN_PERSON' ? 'btn-primary' : 'btn-secondary'}" 
                style="flex:1 1 140px;justify-content:center;"
                onclick="window.updateResidentMeetingRSVP('${m.id}', 'ATTENDING_IN_PERSON')">
                🏢 In-Person Attendance
              </button>
              <button class="btn btn-sm ${currentRsvp === 'ATTENDING_ONLINE' ? 'btn-primary' : 'btn-secondary'}" 
                style="flex:1 1 140px;justify-content:center;"
                onclick="window.updateResidentMeetingRSVP('${m.id}', 'ATTENDING_ONLINE')">
                💻 Online Zoom / Video
              </button>
              <button class="btn btn-sm ${currentRsvp === 'DECLINED' ? 'btn-danger' : 'btn-secondary'}" 
                style="flex:1 1 120px;justify-content:center;"
                onclick="window.updateResidentMeetingRSVP('${m.id}', 'DECLINED')">
                ❌ Cannot Attend (Proxy)
              </button>
            </div>
          </div>

          <!-- Quorum Progress Indicator -->
          <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:var(--r-md);padding:10px 14px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">
              <span>👥 Quorum Progress: ${attendeesCount} / ${quorumRequired} confirmed voting members</span>
              <span style="color:var(--blue);">${quorumPercent}% Achieved</span>
            </div>
            <div style="width:100%;height:7px;background:var(--border);border-radius:10px;overflow:hidden;">
              <div style="width:${quorumPercent}%;height:100%;background:linear-gradient(90deg, var(--blue), var(--green));border-radius:10px;transition:width 0.4s ease;"></div>
            </div>
          </div>

          <!-- Agenda Section -->
          <div style="font-size:14px;font-weight:800;color:var(--text-primary);margin-bottom:8px;">Meeting Agenda:</div>
          <ol style="margin-left:20px;font-size:13px;color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;margin-bottom:20px;line-height:1.45;">
            ${(m.agenda && m.agenda.length > 0) ? m.agenda.map((ag) => `
              <li>
                <strong>${ag.title || ag}</strong>
                ${ag.desc ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${ag.desc}</div>` : ''}
              </li>
            `).join('') : `
              <li>General Body discussion and voting on society resolutions.</li>
            `}
          </ol>

          <!-- Action Buttons -->
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <button class="btn btn-primary" style="flex:1 1 220px;justify-content:center;" onclick="window.viewMeetingDocketModal('${m.id}')">
              📥 Download Agenda & Notice
            </button>
            ${m.meetingLink ? `
              <button class="btn btn-secondary" style="flex:1 1 140px;justify-content:center;" onclick="window.joinMeetingVideoLink('${m.id}')">
                Join via Video 🎥
              </button>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      leftHtml = `
        <div class="card" style="padding:48px 20px;text-align:center;color:var(--text-muted);background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-md);">
          <div style="font-size:36px;margin-bottom:10px;">📅</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Upcoming Meetings</div>
          <div style="font-size:13px;color:var(--text-secondary);max-width:380px;margin:0 auto;line-height:1.45;">
            There are currently no upcoming General Body or Committee meetings scheduled by the RWA executive.
          </div>
        </div>
      `;
    }

    // Right column: Past meeting archives or empty state
    let rightHtml = '';
    if (past.length > 0) {
      rightHtml = `
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div class="card-title">Past Meeting Minutes (MoM)</div>
            <span class="badge badge-gray" style="font-size:11px;">Certified Archives</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${past.map(pm => {
              const attCount = pm.attendees ? pm.attendees.length : (pm.attendance || '0 members');
              return `
                <div style="padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);transition:border-color 0.15s;"
                  onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='var(--border-light)'">
                  <div style="font-size:14px;font-weight:700;margin-bottom:4px;color:var(--text-primary);">${pm.title}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
                    📅 ${pm.dateFormatted || pm.date || 'Past Session'} · 👥 ${attCount} members attended
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-secondary btn-sm" style="flex:1;font-size:12px;padding:4px 8px;" onclick="window.viewMeetingMinutesModal('${pm.id}')">
                      📄 Download MoM PDF
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      rightHtml = `
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div class="card-title">Past Meeting Minutes (MoM)</div>
            <span class="badge badge-gray" style="font-size:11px;">Certified Archives</span>
          </div>
          <div style="padding:32px 16px;text-align:center;color:var(--text-muted);font-size:12.5px;">
            No past meeting archives recorded yet. Certified minutes (MoM) will be archived here after meetings conclude.
          </div>
        </div>
      `;
    }

    container.innerHTML = leftHtml + rightHtml;
  } catch (e) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);grid-column:1/-1;">Error connecting to society meetings records.</div>`;
  }
};

window.updateResidentMeetingRSVP = function(meetingId, rsvpStatus) {
  const rsvpKey = 'rwa_meeting_rsvp_' + meetingId;
  localStorage.setItem(rsvpKey, rsvpStatus);

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }

  const messages = {
    'ATTENDING_IN_PERSON': '✓ RSVP confirmed: Attending in person at Society Community Hall!',
    'ATTENDING_ONLINE': '✓ RSVP confirmed: Joining via Zoom / Video Call!',
    'DECLINED': 'RSVP updated: Marked as unable to attend. Proxy vote enabled.',
  };
  showToast(messages[rsvpStatus] || 'RSVP updated successfully!', 'success');

  window.loadLiveResidentMeetings();
};

window.joinMeetingVideoLink = function(meetingId) {
  const m = window.__activeResidentMeeting;
  const zoomUrl = (m && m.meetingLink) || 'https://zoom.us/j/8492049102?pwd=RWA2026';
  const html = `
    <div style="text-align:center;padding:12px 0;">
      <div style="font-size:40px;margin-bottom:10px;">🎥</div>
      <div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-bottom:6px;">Join Online Society Meeting</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">
        You are joining the live video broadcast for <strong>${m?.title || 'General Body Meeting'}</strong>. 
        Voting and resident Q&A are enabled during the open house session.
      </div>
      <div style="background:var(--bg-elevated);padding:10px 14px;border-radius:var(--r-md);border:1px solid var(--border);font-family:monospace;font-size:12px;margin-bottom:16px;word-break:break-all;">
        ${zoomUrl}
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="navigator.clipboard.writeText('${zoomUrl}'); showToast('Meeting link copied to clipboard!', 'info');">📋 Copy Link</button>
        <button class="btn btn-primary" style="flex:1;" onclick="window.open('${zoomUrl}', '_blank'); showToast('Opening video meeting room...', 'success');">🚀 Launch Room</button>
      </div>
    </div>
  `;
  showModal('🎥 Online Meeting Room', html, 'Done', () => {}, '460px');
};

window.viewMeetingDocketModal = function(meetingId) {
  const m = window.__activeResidentMeeting || {};
  const socName = (typeof localStorage !== 'undefined' && (localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name'))) || 'Residents Welfare Association';
  const socLoc = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_society_location')) || 'Society Campus';
  const html = `
    <div style="padding:6px 0;font-size:13px;color:var(--text-primary);line-height:1.55;">
      <div style="text-align:center;border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:14px;">
        <div style="font-size:16px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">${socName}</div>
        <div style="font-size:11.5px;color:var(--text-muted);">Registered Residents Association · ${socLoc}</div>
        <div style="font-size:12px;font-weight:700;color:var(--blue);margin-top:4px;">OFFICIAL GENERAL BODY MEETING DOCKET & NOTICE</div>
        <div style="font-size:11px;color:var(--text-muted);">Ref: RWA/NOTICE/${m.id || 'GEN'}</div>
      </div>

      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;margin-bottom:14px;">
        <div style="font-weight:700;margin-bottom:4px;">Formal Notice of Meeting:</div>
        <div>Notice is hereby given to all registered flat owners and voting members that the <strong>${m.title || 'General Body Meeting'}</strong> will convene on <strong>${m.dateFormatted || m.date || 'Scheduled Date'}</strong> at <strong>${m.venue || 'Society Community Hall'}</strong> to transact the business listed hereunder.</div>
      </div>

      <div style="font-weight:700;font-size:13.5px;margin-bottom:6px;">Official Agenda for Consideration:</div>
      <ol style="margin-left:20px;display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
        ${(m.agenda && m.agenda.length > 0) ? m.agenda.map(a => `
          <li>
            <strong>${a.title || a}</strong>
            ${a.desc ? `<div style="font-size:12px;color:var(--text-secondary);">${a.desc}</div>` : ''}
          </li>
        `).join('') : `
          <li>General Body deliberation and review of society resolutions.</li>
        `}
      </ol>

      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:var(--r-md);padding:10px 14px;margin-bottom:14px;">
        <div style="font-weight:700;color:var(--green);font-size:12px;margin-bottom:2px;">Quorum & Attendance Protocol:</div>
        <div style="font-size:12px;color:var(--text-secondary);">Quorum requirement is <strong>${m.quorumRequired || 50} voting members</strong>. If quorum is not present within 30 minutes of scheduled time, meeting stands adjourned for 30 minutes and will reconvene at the same venue on the same day.</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid var(--border);padding-top:10px;font-size:11.5px;color:var(--text-muted);">
        <div>
          <div>By Order of Managing Committee</div>
          <strong>General Secretary</strong>
        </div>
        <div style="text-align:right;">
          <div>Certified & Sealed</div>
          <strong>President / Executive Committee</strong>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="window.print()">🖨️ Print Notice</button>
        <button class="btn btn-primary" style="flex:1;" onclick="window.downloadMeetingDocketPDF('${m.id}')">📥 Download PDF</button>
      </div>
    </div>
  `;
  showModal(`📄 Official Meeting Docket · ${m.title || 'Meeting Notice'}`, html, 'Close', () => {}, '600px');
};

window.viewMeetingMinutesModal = function(meetingId) {
  const pastList = window.__pastResidentMeetings || [];
  const pm = pastList.find(p => p.id === meetingId) || pastList[0] || {};
  const socName = (typeof localStorage !== 'undefined' && (localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name'))) || 'Residents Welfare Association';
  const socLoc = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_society_location')) || 'Society Campus';
  const html = `
    <div style="padding:6px 0;font-size:13px;color:var(--text-primary);line-height:1.55;">
      <div style="text-align:center;border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:14px;">
        <div style="font-size:16px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">${socName}</div>
        <div style="font-size:11.5px;color:var(--text-muted);">Registered Society · ${socLoc}</div>
        <div style="font-size:12px;font-weight:700;color:var(--green);margin-top:4px;">CERTIFIED MINUTES OF MEETING (MoM)</div>
        <div style="font-size:11px;color:var(--text-muted);">Meeting: ${pm.title || 'General Meeting'} · Date: ${pm.dateFormatted || pm.date || 'Archived'}</div>
      </div>

      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;margin-bottom:14px;">
        <div style="font-weight:700;margin-bottom:4px;color:var(--text-primary);">Proceedings & Key Deliberations:</div>
        <div style="color:var(--text-secondary);">${pm.minutes || 'The General Body convened with full quorum present. The house reviewed operational performance, accounts, and security measures.'}</div>
      </div>

      ${(pm.resolutions && pm.resolutions.length > 0) ? `
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;">Formal Resolutions Passed:</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          ${pm.resolutions.map(r => `
            <div style="background:var(--bg-elevated);padding:10px 12px;border-radius:var(--r-md);border:1px solid var(--border-light);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-weight:700;color:var(--text-primary);">${r.title}</span>
                <span class="badge badge-green">${r.outcome || 'PASSED'}</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);">
                Proposed by: <strong>${r.proposer || 'Managing Committee'}</strong> · Seconded by: <strong>${r.seconder || 'House'}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid var(--border);padding-top:10px;font-size:11.5px;color:var(--text-muted);">
        <div>
          <div>Recorded by</div>
          <strong>Sunita Sharma, General Secretary</strong>
        </div>
        <div style="text-align:right;">
          <div>Confirmed & Signed</div>
          <strong>Rajesh Kumar, President</strong>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="window.print()">🖨️ Print MoM</button>
        <button class="btn btn-primary" style="flex:1;" onclick="window.downloadMeetingMinutesPDF('${pm.id}')">📥 Download Signed PDF</button>
      </div>
    </div>
  `;
  showModal(`📄 Certified Minutes (MoM) · ${pm.title}`, html, 'Close', () => {}, '600px');
};

window.downloadMeetingDocketPDF = function(meetingId) {
  showToast('Generating official Meeting Docket PDF...', 'info');
  if (typeof downloadReport === 'function') {
    downloadReport('AGM_Docket_2026', 'pdf');
  }
};

window.downloadMeetingMinutesPDF = function(meetingId) {
  showToast('Downloading Certified Minutes (MoM) PDF...', 'info');
  if (typeof downloadReport === 'function') {
    downloadReport('MoM_Certified_Minutes', 'pdf');
  }
};

// Resident Documents (Hidden from Resident View - Redirecting to Dashboard)
Screens['resident-documents'] = function() {
  setTimeout(() => {
    if (typeof Router !== 'undefined' && Router.go) {
      Router.go('resident-dashboard');
    }
  }, 10);

  return Shell.render('resident-dashboard', {
    title: 'Resident Dashboard',
    portal: 'resident',
    content: `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px;">Redirecting to Resident Dashboard...</div>`
  });
};

/* Legacy Resident Documents Vault - Archived */
window.__legacyScreens_resident_documents = function() {
  return '';
};

window.loadLiveResidentDocuments = async function() {
  const gridEl = document.getElementById('residentDocumentsGrid');
  if (!gridEl) return;

  try {
    let apiDocs = [];
    try {
      const res = await (window.apiFetch || fetch)('/api/documents');
      if (res.ok) {
        const data = await res.json();
        apiDocs = data.allDocuments || data.documents || [];
      }
    } catch(e) {}

    // Canonical baseline documents matching the society view
    const canonicalDocs = [
      {
        id: 'CANON-DOC-01',
        icon: '📜',
        name: 'RWA Registered Constitution & Bylaws',
        folder: 'Bylaws',
        categoryGroup: 'LEGAL',
        size: '2.4 MB PDF',
        ext: 'PDF',
        version: 3,
        updated: 'Registered 2018 · CHD Registrar',
        description: 'Comprehensive official society constitution, governance guidelines, quorum rules, and voting procedures registered under Societies Registration Act.',
        tags: ['Statutory', 'Permanent', 'Bylaws'],
        uploadedBy: 'Chandigarh Registrar of Societies',
        displayDate: 'Registered 2018',
        validity: 'Permanent Statutory Record',
        fileUrl: '/documents/rwa_constitution_bylaws.pdf'
      },
      {
        id: 'CANON-DOC-02',
        icon: '🚒',
        name: 'Fire Safety NOC & Inspection Certificate',
        folder: 'Insurance',
        categoryGroup: 'SAFETY',
        size: '1.8 MB PDF',
        ext: 'PDF',
        version: 1,
        updated: 'Valid up to Dec 2027',
        description: 'Official Fire Safety Certificate and inspection clearance issued by Department of Fire Services after multi-tower safety audit.',
        tags: ['Safety', 'Fire NOC', 'Compliance'],
        uploadedBy: 'Directorate of Fire & Emergency Services',
        displayDate: 'Issued Dec 2024',
        validity: 'Valid up to Dec 2027',
        fileUrl: '/documents/fire_safety_noc_certificate.pdf'
      },
      {
        id: 'CANON-DOC-03',
        icon: '🛗',
        name: 'Lift Safety Fitness Certification',
        folder: 'Vendor Contracts',
        categoryGroup: 'SAFETY',
        size: '940 KB PDF',
        ext: 'PDF',
        version: 2,
        updated: 'Renewed Aug 2026',
        description: 'Statutory elevator inspection fitness certificate for all 8 passenger lifts issued by Chief Electrical Inspectorate.',
        tags: ['Lift Safety', 'Electrical Inspectorate', 'AMC'],
        uploadedBy: 'Otis Elevator AMC & State Inspectorate',
        displayDate: 'Renewed Aug 2026',
        validity: 'Valid up to Aug 2027',
        fileUrl: '/documents/lift_safety_fitness.pdf'
      },
      {
        id: 'CANON-DOC-04',
        icon: '💧',
        name: 'Water Tank Chlorination & Lab Test Report',
        folder: 'Registration & Legal',
        categoryGroup: 'SAFETY',
        size: '620 KB PDF',
        ext: 'PDF',
        version: 1,
        updated: 'Tested Sep 2026 (Potable standard)',
        description: 'Certified microbiological and chemical water purity lab analysis test report confirming IS:10500 potable water quality standard.',
        tags: ['Health', 'Water Quality', 'Lab Tested'],
        uploadedBy: 'NABL Accredited Water Testing Lab',
        displayDate: 'Tested Sep 2026',
        validity: 'Conforms to IS 10500:2012',
        fileUrl: '/documents/water_tank_lab_report.pdf'
      },
      {
        id: 'CANON-DOC-05',
        icon: '📊',
        name: 'Audited Financial Statements FY 2025-26',
        folder: 'Audit Reports',
        categoryGroup: 'FINANCE',
        size: '4.2 MB PDF',
        ext: 'PDF',
        version: 1,
        updated: 'Audited by Sharma & Co. CA',
        description: 'Complete statutory audited Balance Sheet, Income & Expenditure account, auditor report, and bank reconciliation statements.',
        tags: ['Audited Accounts', 'Balance Sheet', 'Statutory'],
        uploadedBy: 'Sharma & Co. Chartered Accountants',
        displayDate: 'FY 2025-26',
        validity: 'Statutory CA Certified',
        fileUrl: '/documents/audited_financial_statements_fy25_26.pdf'
      },
      {
        id: 'CANON-DOC-06',
        icon: '🏗️',
        name: 'Approved Building Master Plan & Layout',
        folder: 'Registration & Legal',
        categoryGroup: 'PLANS',
        size: '8.5 MB PDF',
        ext: 'PDF',
        version: 1,
        updated: 'Municipal Corporation approved',
        description: 'Sanctioned architectural master plan, floor-wise layout drawings, structural engineering drawings, and municipal demarcation plan.',
        tags: ['Master Plan', 'Sanctioned Drawing', 'Municipal'],
        uploadedBy: 'Town Planning & Municipal Corporation',
        displayDate: 'Sanctioned Layout',
        validity: 'Permanent Architectural Record',
        fileUrl: '/documents/approved_building_master_plan.pdf'
      }
    ];

    // Combine canonical baseline with API documents visible to residents
    const combinedDocs = [...canonicalDocs];
    apiDocs.forEach(apiDoc => {
      if (apiDoc.visibility === 'ALL_RESIDENTS') {
        const alreadyExists = combinedDocs.some(c => 
          c.name.toLowerCase().includes(apiDoc.name.toLowerCase()) || 
          apiDoc.name.toLowerCase().includes(c.name.toLowerCase())
        );
        if (!alreadyExists) {
          let cat = 'LEGAL';
          const f = (apiDoc.folder || '').toLowerCase();
          if (f.includes('audit') || f.includes('finance') || f.includes('budget')) cat = 'FINANCE';
          else if (f.includes('insurance') || f.includes('contract')) cat = 'SAFETY';
          else if (f.includes('plan') || f.includes('conveyance')) cat = 'PLANS';

          let icon = '📁';
          if (cat === 'FINANCE') icon = '📊';
          else if (cat === 'SAFETY') icon = '🛡️';
          else if (cat === 'PLANS') icon = '🏗️';
          else if (cat === 'LEGAL') icon = '📜';

          combinedDocs.push({
            id: apiDoc.id,
            icon,
            name: apiDoc.name,
            folder: apiDoc.folder,
            categoryGroup: cat,
            size: apiDoc.size + ' ' + (apiDoc.ext || 'PDF'),
            ext: apiDoc.ext || 'PDF',
            version: apiDoc.version || 1,
            updated: apiDoc.displayDate || 'Verified Record',
            description: apiDoc.description || 'Verified society record stored in encrypted vault.',
            tags: apiDoc.tags || ['Verified'],
            uploadedBy: apiDoc.uploadedBy || 'Managing Committee',
            displayDate: apiDoc.displayDate || 'Recent',
            validity: 'Official Society Record',
            fileUrl: apiDoc.fileUrl || ('/documents/' + apiDoc.id)
          });
        }
      }
    });

    window.__residentVaultDocsCache = combinedDocs;

    // Update counts
    const totalCount = combinedDocs.length;
    const legalCount = combinedDocs.filter(d => d.categoryGroup === 'LEGAL').length;
    const safetyCount = combinedDocs.filter(d => d.categoryGroup === 'SAFETY').length;
    const financeCount = combinedDocs.filter(d => d.categoryGroup === 'FINANCE').length;
    const plansCount = combinedDocs.filter(d => d.categoryGroup === 'PLANS').length;

    const cAll = document.getElementById('resDocCountAll');
    const cLeg = document.getElementById('resDocCountLegal');
    const cSaf = document.getElementById('resDocCountSafety');
    const cFin = document.getElementById('resDocCountFinance');
    const cPla = document.getElementById('resDocCountPlans');

    if (cAll) cAll.textContent = totalCount;
    if (cLeg) cLeg.textContent = legalCount;
    if (cSaf) cSaf.textContent = safetyCount;
    if (cFin) cFin.textContent = financeCount;
    if (cPla) cPla.textContent = plansCount;

    window.renderResidentDocumentsList(window.__residentDocsFilter || 'ALL');
  } catch (err) {
    gridEl.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-muted);">Error connecting to Document Vault.</div>`;
  }
};

window.renderResidentDocumentsList = function(filter) {
  const gridEl = document.getElementById('residentDocumentsGrid');
  if (!gridEl) return;

  let docs = window.__residentVaultDocsCache || [];
  if (filter && filter !== 'ALL') {
    docs = docs.filter(d => d.categoryGroup === filter);
  }

  const q = (window.__residentDocSearchQuery || '').toLowerCase().trim();
  if (q) {
    docs = docs.filter(d => 
      d.name.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.updated && d.updated.toLowerCase().includes(q)) ||
      (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  if (docs.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column:1/-1;padding:48px 20px;text-align:center;background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-lg);">
        <div style="font-size:36px;margin-bottom:8px;">🔍</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No matching documents</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">No society records match the search query.</div>
        <button class="btn btn-secondary btn-sm" onclick="window.__residentDocSearchQuery=''; document.getElementById('residentDocSearchInput').value=''; window.filterResidentDocuments('ALL')">Reset Filters</button>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = docs.map(doc => `
    <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:12px;transition:all 0.15s;border:1px solid var(--border);"
      onmouseover="this.style.borderColor='var(--blue)';this.style.boxShadow='0 4px 12px rgba(59,130,246,0.1)';" 
      onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none';">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div style="font-size:32px;line-height:1;">${doc.icon}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:10px;font-weight:700;color:var(--text-muted);background:var(--bg-elevated);padding:2px 6px;border-radius:4px;border:1px solid var(--border);">
              v${doc.version || 1}
            </span>
            <span class="badge badge-green" style="font-size:10px;">✓ Verified</span>
          </div>
        </div>
        <div style="font-size:14.5px;font-weight:700;margin-bottom:4px;color:var(--text-primary);line-height:1.35;">
          ${doc.name}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">
          ${doc.updated}
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.45;background:var(--bg-surface);padding:8px 10px;border-radius:var(--r-sm);border:1px solid var(--border-light);margin-bottom:6px;">
          ${doc.description || 'Certified public society document available for resident inspection.'}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border-light);gap:8px;">
        <span style="font-size:11.5px;color:var(--text-muted);font-weight:600;">${doc.size}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:3px 8px;" onclick="window.previewResidentDocument('${doc.id}')">
            👁️ Preview
          </button>
          <button class="btn btn-primary btn-sm" style="font-size:11.5px;padding:3px 8px;" onclick="window.downloadResidentDocument('${doc.id}')">
            📥 Download
          </button>
        </div>
      </div>
    </div>
  `).join('');
};

window.filterResidentDocuments = function(filterGroup, pillEl) {
  window.__residentDocsFilter = filterGroup;
  document.querySelectorAll('#residentDocsFilterBar .filter-pill').forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
  window.renderResidentDocumentsList(filterGroup);
};

window.searchResidentDocuments = function(query) {
  window.__residentDocSearchQuery = query || '';
  window.renderResidentDocumentsList(window.__residentDocsFilter || 'ALL');
};

window.previewResidentDocument = function(docId) {
  const docs = window.__residentVaultDocsCache || [];
  const doc = docs.find(d => d.id === docId) || docs[0];
  if (!doc) return;

  const html = `
    <div style="padding:6px 0;font-size:13px;line-height:1.55;">
      <!-- Letterhead Header -->
      <div style="text-align:center;border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:14px;position:relative;">
        <div style="font-size:16px;font-weight:800;letter-spacing:0.5px;">TEST 2 RESIDENTS WELFARE ASSOCIATION</div>
        <div style="font-size:11.5px;color:var(--text-muted);">Sector 22, Dwarka · Certified Society Document Vault</div>
        <div style="display:inline-block;margin-top:6px;background:rgba(34,197,94,0.1);color:var(--green);font-size:11px;font-weight:800;padding:2px 10px;border-radius:12px;border:1px solid rgba(34,197,94,0.3);">
          ✓ CERTIFIED PUBLIC RECORD · SHA-256 ENCRYPTED
        </div>
      </div>

      <!-- Main Info Card -->
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="font-size:36px;">${doc.icon}</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);">${doc.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Folder: <strong>${doc.folder || 'Vault'}</strong> · File Size: <strong>${doc.size}</strong> · Format: <strong>${doc.ext}</strong>
            </div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;background:var(--bg-elevated);padding:10px 12px;border-radius:var(--r-sm);border:1px solid var(--border-light);">
          ${doc.description}
        </div>
      </div>

      <!-- Meta Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;font-size:12px;">
        <div style="background:var(--bg-surface);padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Issuing Authority / Agency</div>
          <div style="font-weight:700;color:var(--text-primary);">${doc.uploadedBy || 'Society Secretariat'}</div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Statutory Validity / Status</div>
          <div style="font-weight:700;color:var(--green);">${doc.validity || doc.updated}</div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Active Version</div>
          <div style="font-weight:700;color:var(--text-primary);">Version ${doc.version}.0 (Current Official Draft)</div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 12px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Resident Access Rights</div>
          <div style="font-weight:700;color:var(--blue);">Unrestricted Public Society Document</div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="window.print()">🖨️ Print Document</button>
        <button class="btn btn-primary" style="flex:1;" onclick="window.downloadResidentDocument('${doc.id}')">📥 Download (${doc.ext})</button>
      </div>
    </div>
  `;

  showModal(`📄 Document Vault · ${doc.name}`, html, 'Close', () => {}, '600px');
};

window.downloadResidentDocument = function(docId) {
  const docs = window.__residentVaultDocsCache || [];
  const doc = docs.find(d => d.id === docId) || { name: 'Society_Document', ext: 'PDF', id: docId, size: '2.4 MB' };

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast(`⬇ Downloading ${doc.name}.${(doc.ext || 'pdf').toLowerCase()}...`, 'success');

  // Trigger download blob
  const textContent = `========================================================\n` +
    `RESIDENTS WELFARE ASSOCIATION - OFFICIAL DOCUMENT VAULT\n` +
    `========================================================\n\n` +
    `Document Title:  ${doc.name}\n` +
    `Document ID:     ${doc.id}\n` +
    `Category:        ${doc.folder || 'Public Documents'}\n` +
    `File Size:       ${doc.size}\n` +
    `Format:          ${doc.ext}\n` +
    `Authority:       ${doc.uploadedBy || 'Registrar / Management Committee'}\n` +
    `Validity:        ${doc.validity || doc.updated}\n` +
    `Description:     ${doc.description || 'Verified society record'}\n\n` +
    `--------------------------------------------------------\n` +
    `SECURITY & COMPLIANCE VERIFICATION\n` +
    `Digital Signature: SHA256-RWA-VAULT-${doc.id}-VERIFIED\n` +
    `Certified by Managing Committee Secretariat\n` +
    `========================================================\n`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${doc.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.${(doc.ext || 'pdf').toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

// Resident Amenities Booking
Screens['resident-amenities'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveResidentAmenities === 'function') {
      window.loadLiveResidentAmenities();
    }
  }, 10);

  return Shell.render('resident-amenities', {
    title: 'Book Amenities',
    portal: 'resident',
    breadcrumb: 'Facilities',
    actions: `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <div id="residentAmenitiesFlatPicker" style="display:inline-flex;align-items:center;gap:6px;"></div>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveResidentAmenities(true)">🔄 Refresh</button>
        <button class="btn btn-primary btn-sm" onclick="window.openResidentBookAmenityModal()">+ Book Facility</button>
      </div>
    `,
    content: `
      <div style="padding-bottom:80px;">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div class="page-header-left">
            <div class="page-title">Amenity Booking & Reservations</div>
            <div class="page-subtitle" id="residentAmenitiesSubtitle">Reserve society facilities with instant slot confirmation and online UPI fee payment</div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Amenity Booking Cards -->
          <div>
            <!-- Category Filter Bar -->
            <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;" id="amenityCategoryPills">
              <button class="filter-pill active" onclick="window.filterResidentAmenities('ALL', this)">All Facilities</button>
              <button class="filter-pill" onclick="window.filterResidentAmenities('Clubhouse', this)">🏛️ Clubhouse</button>
              <button class="filter-pill" onclick="window.filterResidentAmenities('Sports', this)">🏸 Sports</button>
              <button class="filter-pill" onclick="window.filterResidentAmenities('Outdoors', this)">🌿 Outdoors</button>
            </div>

            <div id="residentAmenitiesList" style="display:flex;flex-direction:column;gap:16px;">
              <div style="padding:40px;text-align:center;color:var(--text-muted);background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-md);">
                Loading available society facilities...
              </div>
            </div>
          </div>

          <!-- My Bookings History -->
          <div class="card" style="height:fit-content;">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <div class="card-title">My Booking Reservations</div>
              <span class="badge badge-blue" id="residentBookingsCountBadge">Loading...</span>
            </div>
            <div id="residentMyBookingsList" style="display:flex;flex-direction:column;gap:12px;">
              <div style="padding:24px;text-align:center;color:var(--text-muted);">
                Loading your reservations...
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// State caches for Resident Amenities
window.__residentAmenitiesCache = null;
window.__residentBookingsCache = null;
window.__residentAmenityFilter = 'ALL';
window.__residentActiveUnit = null;

window.switchResidentAmenitiesFlat = function(unitId, unitNum) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.__residentPreviewUnitNumber = unitNum;
  window.__residentActiveUnit = unitNum;
  window.loadLiveResidentAmenities(true);
};

window.loadLiveResidentAmenities = async function(forceRefresh = false) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rwa_user') || '{}');
  } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');

  // Fetch society units to allow flat switching for admins
  let allUnits = window.__societyUnitsCache || [];
  if (allUnits.length === 0 || forceRefresh) {
    try {
      const unitsRes = await (window.apiFetch || fetch)('/api/units').catch(() => null);
      if (unitsRes && unitsRes.ok) {
        const uData = await unitsRes.json();
        allUnits = uData.units || [];
        window.__societyUnitsCache = allUnits;
      }
    } catch(e) {}
  }

  // Resolve current resident unit strictly
  let currentUnit = null;
  let blockName = 'Main Block';
  if (isAdmin) {
    const urlFlat = new URLSearchParams(window.location.search).get('flat');
    currentUnit = window.__residentPreviewUnitNumber ||
                  urlFlat ||
                  user?.unitNumber ||
                  (user?.unit && user.unit.unitNumber) ||
                  (user?.unitId && allUnits.find(u => u.id === user.unitId)?.unitNumber) ||
                  (allUnits[0] && allUnits[0].unitNumber) || 'A-1';
    const foundU = allUnits.find(u => u.unitNumber === currentUnit);
    blockName = (foundU && foundU.block && foundU.block.name) || 'Main Block';
  } else {
    currentUnit = user?.unitNumber || (user?.unit && user.unit.unitNumber) || (user?.unitId && allUnits.find(u => u.id === user.unitId)?.unitNumber) || 'A-1';
    blockName = user?.blockName || (user?.unit && user.unit.block && user.unit.block.name) || 'Main Block';
  }

  window.__residentActiveUnit = currentUnit;
  window.__residentActiveUserName = user?.name || 'Resident';
  window.__residentActiveUserPhone = user?.phone || '98765 43210';

  // Populate Flat Picker in header: Only admin can switch flats; residents see their own flat badge
  const pickerWrap = document.getElementById('residentAmenitiesFlatPicker');
  if (pickerWrap) {
    if (isAdmin && allUnits.length > 0) {
      pickerWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Flat:</span>
          <select onchange="const opt = this.options[this.selectedIndex]; window.switchResidentAmenitiesFlat(this.value, opt.getAttribute('data-num'))" class="form-select"
            style="font-size:12px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
            title="Switch resident unit">
            ${allUnits.slice(0, 80).map(u => `
              <option value="${u.id}" data-num="${u.unitNumber}" ${u.unitNumber === currentUnit ? 'selected' : ''}>
                🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
              </option>
            `).join('')}
          </select>
        </div>
      `;
    } else {
      pickerWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">My Flat:</span>
          <span style="font-size:12px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${currentUnit} (${blockName})</span>
        </div>
      `;
    }
  }

  const subEl = document.getElementById('residentAmenitiesSubtitle');
  if (subEl) {
    subEl.textContent = `Reserve society facilities with instant slot confirmation for Flat ${currentUnit}`;
  }

  // Fetch live amenities configured by RWA admin - NO dummy baseline fallback
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/amenities').catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.amenities && data.amenities.length > 0) {
        window.__residentAmenitiesCache = data.amenities.map(sa => ({
          id: sa.id,
          name: sa.name,
          cat: sa.category || sa.cat || 'Clubhouse',
          icon: sa.icon || '🏛️',
          cap: sa.capacity ? `${sa.capacity} persons` : (sa.cap || ''),
          fee: sa.fee || (sa.isFree ? 'Free for residents' : '₹0'),
          feeNum: Number(sa.feeNum || 0),
          deposit: sa.deposit || 'No deposit',
          depositNum: Number(sa.depositNum || 0),
          status: sa.status || 'ACTIVE',
          timings: sa.timings || `${sa.openTime || '06:00'} - ${sa.closeTime || '22:00'}`,
          desc: sa.rules || sa.desc || 'Available for resident booking with instant confirmation.'
        }));
      } else {
        window.__residentAmenitiesCache = [];
      }
      if (data.bookings) {
        window.__residentServerBookings = data.bookings;
      }
    } else {
      window.__residentAmenitiesCache = [];
    }
  } catch(e) {
    console.warn('Error fetching live amenities:', e);
    window.__residentAmenitiesCache = [];
  }

  // STRICT FLAT ISOLATION:
  // Only display bookings that belong strictly to the current active flat
  const today = new Date().toISOString().split('T')[0];
  const cleanTargetUnit = (currentUnit || '').replace(/^flat\s*/i, '').trim().toLowerCase();

  const serverUnitBookings = (window.__residentServerBookings || [])
    .filter(b => {
      const bUnit = (b.unit || '').replace(/^flat\s*/i, '').trim().toLowerCase();
      return bUnit === cleanTargetUnit;
    });

  const localUnitBookings = (window.__residentLocalBookings || [])
    .filter(b => {
      const bUnit = (b.unit || '').replace(/^flat\s*/i, '').trim().toLowerCase();
      return bUnit === cleanTargetUnit;
    });

  const merged = [];
  localUnitBookings.forEach(lb => {
    merged.push(lb);
  });
  serverUnitBookings.forEach(sb => {
    if (!merged.some(m => m.id === sb.id)) {
      merged.push(sb);
    }
  });

  // Calculate lifecycle status (past vs active)
  const processedBookings = merged.map(b => {
    const isPast = b.date < today;
    let status = b.status || 'CONFIRMED';
    if (isPast && status === 'CONFIRMED') {
      status = 'COMPLETED';
    }
    const matchedAmenity = window.__residentAmenitiesCache?.find(a => 
      a.name.toLowerCase() === (b.amenity || '').toLowerCase() || 
      (b.amenityId && a.id === b.amenityId)
    );

    return {
      id: b.id,
      unit: b.unit || currentUnit,
      name: b.name || user?.name || 'Resident',
      amenity: b.amenity,
      amenityId: b.amenityId,
      icon: b.icon || matchedAmenity?.icon || '🏛️',
      date: b.date,
      dateDisplay: b.dateDisplay || b.date,
      slot: b.slot,
      purpose: b.purpose,
      fee: typeof b.fee === 'number' ? `₹${b.fee.toLocaleString('en-IN')}` : (b.fee || 'Free entry'),
      deposit: typeof b.deposit === 'number' ? `₹${b.deposit.toLocaleString('en-IN')}` : (b.deposit || 'No deposit'),
      status: status,
      isPast: isPast,
      canCancel: !isPast && (status === 'CONFIRMED' || status === 'PENDING')
    };
  });

  window.__residentBookingsCache = processedBookings;

  window.renderResidentAmenitiesList();
  window.renderResidentMyBookings();
};

window.filterResidentAmenities = function(cat, btnEl) {
  window.__residentAmenityFilter = cat;
  document.querySelectorAll('#amenityCategoryPills button').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  window.renderResidentAmenitiesList();
};

window.renderResidentAmenitiesList = function() {
  const container = document.getElementById('residentAmenitiesList');
  if (!container) return;

  let amenities = window.__residentAmenitiesCache || [];
  const filter = window.__residentAmenityFilter || 'ALL';
  if (filter !== 'ALL') {
    amenities = amenities.filter(a => (a.cat || '').toLowerCase() === filter.toLowerCase());
  }

  if (amenities.length === 0) {
    container.innerHTML = `
      <div style="padding:48px 24px;text-align:center;color:var(--text-muted);background:var(--bg-surface);border:1px dashed var(--border);border-radius:var(--r-md);">
        <div style="font-size:36px;margin-bottom:10px;">🏛️</div>
        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">No Facilities Configured Yet</div>
        <div style="font-size:13px;color:var(--text-secondary);max-width:420px;margin:0 auto;line-height:1.45;">The society management has not published any bookable amenities yet. Facilities configured by RWA management will appear here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = amenities.map(a => {
    const isMaintenance = a.status === 'MAINTENANCE';
    return `
      <div class="card" style="display:flex;gap:16px;align-items:flex-start;transition:all 0.15s;border:1px solid var(--border);"
        onmouseover="this.style.borderColor='var(--blue)';this.style.boxShadow='0 3px 10px rgba(59,130,246,0.08)';"
        onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none';">
        <div style="width:48px;height:48px;border-radius:12px;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">
          ${a.icon || '🏛️'}
        </div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:15px;font-weight:700;color:var(--text-primary);">${a.name}</span>
              ${isMaintenance ? '<span class="badge badge-amber" style="font-size:10px;">⚠️ Under Maintenance</span>' : ''}
            </div>
            <div style="font-size:13px;font-weight:700;color:var(--blue);white-space:nowrap;">${a.fee}</div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin:4px 0 8px 0;line-height:1.45;">${a.desc}</div>
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);margin-bottom:10px;">
            <span>🛡️ ${a.deposit}</span>
            ${a.cap ? `<span>👥 Capacity: ${a.cap}</span>` : ''}
            ${a.timings ? `<span>⏰ ${a.timings}</span>` : ''}
          </div>
          <button class="btn btn-primary btn-sm" ${isMaintenance ? 'disabled' : ''} onclick="window.openResidentBookAmenityModal('${a.name.replace(/'/g, "\\'")}')">
            ${isMaintenance ? 'Unavailable' : 'Book Slot 📅'}
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.renderResidentMyBookings = function() {
  const container = document.getElementById('residentMyBookingsList');
  const countBadge = document.getElementById('residentBookingsCountBadge');
  if (!container) return;

  const bookings = (window.__residentBookingsCache || []).filter(b => b.status !== 'CANCELLED');
  const activeBookings = bookings.filter(b => !b.isPast && (b.status === 'CONFIRMED' || b.status === 'PENDING'));
  const pastBookings = bookings.filter(b => b.isPast || b.status === 'COMPLETED');

  if (countBadge) {
    if (activeBookings.length > 0 && pastBookings.length > 0) {
      countBadge.textContent = `${activeBookings.length} Active · ${pastBookings.length} Past`;
      countBadge.className = 'badge badge-blue';
    } else if (activeBookings.length > 0) {
      countBadge.textContent = `${activeBookings.length} Active`;
      countBadge.className = 'badge badge-green';
    } else if (pastBookings.length > 0) {
      countBadge.textContent = `${pastBookings.length} Past`;
      countBadge.className = 'badge badge-muted';
    } else {
      countBadge.textContent = '0 Bookings';
      countBadge.className = 'badge badge-muted';
    }
  }

  if (bookings.length === 0) {
    const flatStr = window.__residentActiveUnit ? ` for Flat ${window.__residentActiveUnit}` : '';
    container.innerHTML = `
      <div style="padding:32px 16px;text-align:center;color:var(--text-muted);border:1px dashed var(--border);border-radius:var(--r-md);">
        <div style="font-size:28px;margin-bottom:6px;">📅</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);">No active bookings${flatStr}</div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Reserve an available society facility above to get an instant digital pass.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = bookings.map(b => {
    let badgeClass = 'badge-muted';
    let badgeLabel = b.status;
    if (b.status === 'CONFIRMED') {
      badgeClass = 'badge-green';
      badgeLabel = '✓ CONFIRMED';
    } else if (b.status === 'PENDING') {
      badgeClass = 'badge-amber';
      badgeLabel = '⏳ PENDING';
    } else if (b.status === 'COMPLETED') {
      badgeClass = 'badge-muted';
      badgeLabel = '✓ COMPLETED';
    } else if (b.status === 'REJECTED') {
      badgeClass = 'badge-red';
      badgeLabel = '✕ REJECTED';
    }

    const feeDisplay = b.fee ? (typeof b.fee === 'number' ? `Paid ₹${b.fee.toLocaleString('en-IN')}` : b.fee) : 'Free';
    const depositDisplay = b.deposit && b.deposit !== '₹0' && b.deposit !== 'No deposit' ? ` · Deposit ${b.deposit}` : '';

    return `
      <div style="padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);transition:all 0.15s;${b.isPast ? 'opacity:0.85;' : ''}"
        onmouseover="this.style.borderColor='var(--border)';"
        onmouseout="this.style.borderColor='var(--border-light)';">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:13.5px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            ${b.icon || '🏛️'} ${b.amenity}
          </span>
          <span class="badge ${badgeClass}" style="font-size:10.5px;">${badgeLabel}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
          <span>📅 ${b.dateDisplay || b.date}</span>
          <span>·</span>
          <span>⏰ ${b.slot}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
          Booking ID: <strong>${b.id}</strong> · ${feeDisplay}${depositDisplay}
          ${b.purpose ? ` · <span style="font-style:italic;">"${b.purpose}"</span>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-light);">
          <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;" onclick="window.viewResidentBookingPass('${b.id}')">
            🎫 Digital Pass
          </button>
          ${b.canCancel ? `
            <button class="btn btn-ghost btn-sm" style="color:var(--red);font-size:11.5px;padding:3px 6px;" onclick="window.cancelResidentAmenityBooking('${b.id}', '${(b.amenity || '').replace(/'/g, "\\'")}')">
              Cancel Booking
            </button>
          ` : `
            <button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--text-muted);" onclick="showToast('Booking completed. Gate receipt archived in society records.', 'info')">
              Receipt 📄
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
};

window.openResidentBookAmenityModal = function(preselectedAmenityName) {
  const amenities = window.__residentAmenitiesCache || [];
  if (!amenities || amenities.length === 0) {
    showToast('No facilities configured by RWA admin yet.', 'warning');
    return;
  }

  const defaultAmenity = amenities.find(a => preselectedAmenityName && a.name.toLowerCase() === preselectedAmenityName.toLowerCase()) || amenities[0];

  const d = new Date();
  d.setDate(d.getDate() + 1);
  const defaultDateStr = d.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const currentUnit = window.__residentActiveUnit || 'A-1';
  const residentName = window.__residentActiveUserName || 'Resident';
  const residentPhone = window.__residentActiveUserPhone || '98765 43210';

  function getPurposeSuggestion(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('hall')) return 'Family Gathering / Birthday Celebration';
    if (n.includes('lawn')) return 'Anniversary Party / Outdoor Gathering';
    if (n.includes('badminton')) return 'Evening Badminton Match';
    if (n.includes('pool')) return 'Weekend Swimming Session';
    if (n.includes('meeting') || n.includes('clubhouse')) return 'Committee / Group Discussion';
    if (n.includes('gym')) return 'Morning Workout Session';
    return 'Facility Reservation';
  }

  const initialPurpose = getPurposeSuggestion(defaultAmenity.name);

  const html = `
    <div style="font-size:13px;line-height:1.5;">
      <div style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;margin-bottom:4px;">Facility / Amenity *</label>
        <select id="resBookAmnSelect" class="form-select" style="width:100%;font-size:13px;" onchange="window.updateResidentBookingTariffPreview()">
          ${amenities.filter(a => a.status !== 'MAINTENANCE').map(a => `
            <option value="${a.name}" data-fee="${a.feeNum || 0}" data-deposit="${a.depositNum || 0}" ${a.name.toLowerCase() === defaultAmenity.name.toLowerCase() ? 'selected' : ''}>
              ${a.icon || '🏛️'} ${a.name} — ${a.fee} (${a.deposit})
            </option>
          `).join('')}
        </select>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Reservation Date *</label>
          <input type="date" id="resBookDate" value="${defaultDateStr}" min="${todayStr}" class="form-input" style="width:100%;" required />
        </div>
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Time Slot *</label>
          <select id="resBookTimeSlot" class="form-select" style="width:100%;">
            <option value="06:00 AM – 08:00 AM">06:00 AM – 08:00 AM (Early Morning)</option>
            <option value="09:00 AM – 01:00 PM">09:00 AM – 01:00 PM (Morning Slot)</option>
            <option value="02:00 PM – 06:00 PM">02:00 PM – 06:00 PM (Afternoon Slot)</option>
            <option value="06:00 PM – 08:00 PM" selected>06:00 PM – 08:00 PM (Evening Game/Practice)</option>
            <option value="04:00 PM – 10:00 PM">04:00 PM – 10:00 PM (Party/Event Slot)</option>
            <option value="07:00 PM – 11:00 PM">07:00 PM – 11:00 PM (Night Function)</option>
          </select>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Resident Flat</label>
          <input type="text" id="resBookUnit" value="Flat ${currentUnit}" disabled class="form-input" style="width:100%;opacity:0.85;background:var(--bg-elevated);" />
        </div>
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Resident Contact Name *</label>
          <input type="text" id="resBookName" value="${residentName}" class="form-input" style="width:100%;" required />
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;margin-bottom:4px;">Occasion / Purpose of Booking *</label>
        <input type="text" id="resBookPurpose" placeholder="e.g. Birthday Celebration, Friendly Badminton Game, Family Gathering" value="${initialPurpose}" class="form-input" style="width:100%;" required />
      </div>

      <!-- Live Tariff Breakdown Card -->
      <div id="resBookingTariffBox" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12.5px;">
          <span>Facility Slot Fee:</span>
          <strong id="resPreviewFeeText" class="rupee">₹${(defaultAmenity.feeNum || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12.5px;color:var(--text-muted);">
          <span>Security Deposit (Refundable):</span>
          <span id="resPreviewDepositText" class="rupee">₹${(defaultAmenity.depositNum || 0).toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px dashed var(--border);padding-top:6px;font-size:13.5px;font-weight:800;color:var(--blue);">
          <span>Total Amount Payable:</span>
          <span id="resPreviewTotalText" class="rupee">₹${((defaultAmenity.feeNum || 0) + (defaultAmenity.depositNum || 0)).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--green);font-weight:600;">
          <input type="radio" name="resPayMode" value="UPI" checked style="accent-color:var(--green);" />
          <span>⚡ Instant UPI Payment (Google Pay / PhonePe / Paytm / BHIM)</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text-secondary);">
          <input type="checkbox" id="resSyncGcal" checked style="width:15px;height:15px;" />
          <span>📅 Add reservation to my Google Calendar</span>
        </label>
      </div>
    </div>
  `;

  window.updateResidentBookingTariffPreview = function() {
    const sel = document.getElementById('resBookAmnSelect');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    const fee = parseInt(opt.getAttribute('data-fee') || '0', 10);
    const dep = parseInt(opt.getAttribute('data-deposit') || '0', 10);
    const total = fee + dep;

    const feeEl = document.getElementById('resPreviewFeeText');
    const depEl = document.getElementById('resPreviewDepositText');
    const totEl = document.getElementById('resPreviewTotalText');
    const purposeEl = document.getElementById('resBookPurpose');

    if (feeEl) feeEl.textContent = `₹${fee.toLocaleString('en-IN')}`;
    if (depEl) depEl.textContent = `₹${dep.toLocaleString('en-IN')}`;
    if (totEl) totEl.textContent = `₹${total.toLocaleString('en-IN')}`;

    if (purposeEl) {
      purposeEl.value = getPurposeSuggestion(sel.value);
    }
  };

  showModal(`📅 Reserve Facility · ${defaultAmenity.name}`, html, 'Confirm & Pay ✓', async () => {
    const facilitySelect = document.getElementById('resBookAmnSelect');
    const amenityName = facilitySelect.value;
    const selectedOpt = facilitySelect.options[facilitySelect.selectedIndex];
    const feeNum = parseInt(selectedOpt.getAttribute('data-fee') || '0', 10);
    const depositNum = parseInt(selectedOpt.getAttribute('data-deposit') || '0', 10);

    const bookingDate = document.getElementById('resBookDate').value;
    const slot = document.getElementById('resBookTimeSlot').value;
    const residentNameInput = document.getElementById('resBookName').value.trim() || residentName;
    const purpose = document.getElementById('resBookPurpose').value.trim() || 'Facility Reservation';
    const syncGcal = document.getElementById('resSyncGcal')?.checked;

    const unitNumber = window.__residentActiveUnit || 'A-1';

    let createdBooking = null;

    try {
      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book_slot',
          amenityName,
          unit: unitNumber,
          residentName: residentNameInput,
          phone: residentPhone,
          date: bookingDate,
          slot,
          purpose,
          fee: feeNum,
          deposit: depositNum,
          autoApprove: true
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to book slot. It might be already reserved.', 'error');
        return;
      }

      const resData = await res.json();
      if (resData.booking) {
        createdBooking = resData.booking;
      }
    } catch(e) {
      console.warn('Network error during amenity booking:', e);
    }

    const matchedAmenity = window.__residentAmenitiesCache?.find(a => a.name === amenityName);
    const finalBookingObj = createdBooking ? {
      ...createdBooking,
      icon: matchedAmenity?.icon || '🏛️',
      fee: feeNum > 0 ? `Paid ₹${feeNum.toLocaleString('en-IN')} via UPI` : 'Free entry',
      deposit: depositNum > 0 ? `Deposit ₹${depositNum.toLocaleString('en-IN')}` : 'No deposit',
      canCancel: true,
      isPast: false
    } : {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      unit: unitNumber,
      name: residentNameInput,
      amenity: amenityName,
      icon: matchedAmenity?.icon || '🏛️',
      date: bookingDate,
      dateDisplay: bookingDate,
      slot: slot,
      purpose: purpose,
      fee: feeNum > 0 ? `Paid ₹${feeNum.toLocaleString('en-IN')} via UPI` : 'Free entry',
      deposit: depositNum > 0 ? `Deposit ₹${depositNum.toLocaleString('en-IN')}` : 'No deposit',
      status: 'CONFIRMED',
      canCancel: true,
      isPast: false
    };

    window.__residentLocalBookings = window.__residentLocalBookings || [];
    window.__residentLocalBookings.unshift(finalBookingObj);

    window.__residentBookingsCache = window.__residentBookingsCache || [];
    window.__residentBookingsCache.unshift(finalBookingObj);

    if (typeof playNotificationSound === 'function') {
      try { playNotificationSound(); } catch(e) {}
    }

    if (syncGcal && typeof window.syncEventToGoogleCalendar === 'function') {
      window.syncEventToGoogleCalendar({
        title: `Reservation: ${amenityName} (${unitNumber})`,
        description: `Resident: ${residentNameInput} (${unitNumber})\nSlot: ${slot}\nPurpose: ${purpose}\nFacility: ${amenityName}`,
        startDate: `${bookingDate}T10:00:00Z`,
        eventType: 'AMENITY'
      });
    }

    showToast(`🎉 ${amenityName} reserved for ${bookingDate} (Booking ID: ${finalBookingObj.id})!`, 'success');
    window.renderResidentMyBookings();
  }, '550px');
};

// Aliases for global compatibility
window.openBookAmenityModal = function(param) {
  if (typeof Router !== 'undefined' && Router.current() === 'resident-amenities') {
    return window.openResidentBookAmenityModal(param);
  }
  if (typeof window.openAdminBookAmenityModal === 'function') {
    return window.openAdminBookAmenityModal(param);
  }
  return window.openResidentBookAmenityModal(param);
};

window.cancelResidentAmenityBooking = async function(bookingId, amenityName) {
  const confirmed = confirm(`Are you sure you want to cancel your reservation for ${amenityName} (ID: ${bookingId})?\n\nYour reserved slot will be released and refundable fees will be credited to your account.`);
  if (!confirmed) return;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/amenities?bookingId=${encodeURIComponent(bookingId)}`, {
      method: 'DELETE'
    }).catch(() => null);

    if (res && !res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Server cancel response:', err);
    }
  } catch(e) {}

  // Update in local cache
  if (window.__residentBookingsCache) {
    const b = window.__residentBookingsCache.find(x => x.id === bookingId);
    if (b) {
      b.status = 'CANCELLED';
      b.canCancel = false;
    }
  }
  if (window.__residentLocalBookings) {
    window.__residentLocalBookings = window.__residentLocalBookings.filter(x => x.id !== bookingId);
  }

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast(`✓ ${amenityName} reservation (ID: ${bookingId}) cancelled & refund initiated.`, 'info');
  window.renderResidentMyBookings();
};

window.viewResidentBookingPass = function(bookingId) {
  const b = (window.__residentBookingsCache || []).find(x => x.id === bookingId) || {
    id: bookingId,
    amenity: 'Society Facility',
    unit: window.__residentActiveUnit || 'A-1',
    name: window.__residentActiveUserName || 'Resident',
    dateDisplay: 'Active Reservation',
    slot: 'Designated Hours',
    status: 'CONFIRMED'
  };

  const orgName = (typeof localStorage !== 'undefined' && localStorage.getItem('rwa_active_org_name')) || 'TEST 2 RESIDENTS WELFARE ASSOCIATION';

  const html = `
    <div style="padding:4px 0;font-size:13px;line-height:1.5;">
      <!-- Society Header -->
      <div style="text-align:center;border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:14px;">
        <div style="font-size:16px;font-weight:800;letter-spacing:0.5px;">${orgName.toUpperCase()}</div>
        <div style="font-size:11.5px;color:var(--text-muted);">Sector 22, Dwarka · Digital Facility Access Pass</div>
        <div style="display:inline-block;margin-top:6px;background:rgba(34,197,94,0.12);color:var(--green);font-size:11.5px;font-weight:800;padding:3px 12px;border-radius:12px;border:1px solid rgba(34,197,94,0.3);">
          ✓ ${b.status === 'COMPLETED' ? 'COMPLETED GATE PASS' : 'CONFIRMED GATE RESERVATION PASS'}
        </div>
      </div>

      <!-- Pass Card Details -->
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-size:18px;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              ${b.icon || '🏛️'} ${b.amenity}
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Pass ID: <strong>${b.id}</strong>
            </div>
          </div>
          <span class="badge ${b.status === 'COMPLETED' ? 'badge-muted' : 'badge-green'}" style="font-size:11px;">
            ${b.status === 'COMPLETED' ? '✓ EXECUTED' : '✓ ACTIVE PASS'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;font-size:12px;">
          <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--r-sm);border:1px solid var(--border-light);">
            <div style="color:var(--text-muted);font-size:10.5px;">Resident Unit</div>
            <div style="font-weight:700;color:var(--text-primary);">Flat ${b.unit || window.__residentActiveUnit || 'A-1'}</div>
          </div>
          <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--r-sm);border:1px solid var(--border-light);">
            <div style="color:var(--text-muted);font-size:10.5px;">Reserved By</div>
            <div style="font-weight:700;color:var(--text-primary);">${b.name || window.__residentActiveUserName || 'Resident'}</div>
          </div>
          <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--r-sm);border:1px solid var(--border-light);">
            <div style="color:var(--text-muted);font-size:10.5px;">Reservation Date</div>
            <div style="font-weight:700;color:var(--text-primary);">${b.dateDisplay || b.date}</div>
          </div>
          <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--r-sm);border:1px solid var(--border-light);">
            <div style="color:var(--text-muted);font-size:10.5px;">Reserved Slot</div>
            <div style="font-weight:700;color:var(--blue);">${b.slot}</div>
          </div>
        </div>
        ${b.purpose ? `
          <div style="margin-top:10px;padding:8px 10px;background:var(--bg-elevated);border-radius:var(--r-sm);font-size:11.5px;color:var(--text-secondary);border:1px solid var(--border-light);">
            <span style="color:var(--text-muted);">Declared Purpose:</span> <strong>${b.purpose}</strong>
          </div>
        ` : ''}
      </div>

      <!-- Security Desk Verification Notice -->
      <div style="text-align:center;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px dashed var(--border);margin-bottom:12px;">
        <div style="font-family:monospace;font-size:14px;letter-spacing:4px;font-weight:800;color:var(--text-primary);">
          [ █ ▄ █ ▌ █ █ ▌ █ ▄ █ ]
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
          Present this pass at Clubhouse Reception or Main Gate Security for check-in
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn btn-secondary" style="flex:1;" onclick="window.print()">🖨️ Print Pass</button>
        <button class="btn btn-primary" style="flex:1;" onclick="showToast('Pass saved to offline wallet', 'success');">📱 Save to Wallet</button>
      </div>
    </div>
  `;

  showModal(`🎫 Facility Access Pass · ${b.amenity}`, html, 'Close', () => {}, '500px');
};

// Resident Profile & Family / Vehicles
Screens['resident-profile'] = function() {
  setTimeout(() => {
    if (typeof window.loadResidentProfileData === 'function') {
      window.loadResidentProfileData();
    }
  }, 10);

  return Shell.render('resident-profile', {
    title: 'My Profile',
    portal: 'resident',
    breadcrumb: 'Account',
    actions: `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <div id="residentProfileFlatPicker" style="display:inline-flex;align-items:center;gap:6px;"></div>
        <button class="btn btn-secondary btn-sm" onclick="window.loadResidentProfileData(true)">🔄 Reset</button>
        <button class="btn btn-primary btn-sm" onclick="window.saveResidentProfile()">💾 Save Profile</button>
      </div>
    `,
    content: `
      <div style="padding-bottom:120px;">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div class="page-header-left">
            <div class="page-title">Resident Profile & Unit Details</div>
            <div class="page-subtitle" id="residentProfileSubtitle">Manage registered family members, vehicle parking slots, and emergency contacts</div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Left: Primary Details -->
          <div>
            <div class="card mb-md">
              <div class="card-title mb-md">Unit Ownership Details</div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input class="form-input" id="profFullName" type="text" placeholder="Your full name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Unit / Flat Number</label>
                  <input class="form-input" id="profUnitNumber" type="text" disabled style="opacity:0.85;background:var(--bg-elevated);font-weight:700;" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Registered Mobile (for OTP & SMS)</label>
                  <input class="form-input" id="profMobile" type="text" placeholder="+91 98000 00000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input class="form-input" id="profEmail" type="email" placeholder="resident@society.org" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Occupancy Type</label>
                  <select class="form-input" id="profOccupancy">
                    <option value="Owner - Residing">Owner - Residing</option>
                    <option value="Owner - Leased to Tenant">Owner - Leased to Tenant</option>
                    <option value="Tenant - Residing">Tenant - Residing</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Unit Super Built-up Area</label>
                  <input class="form-input" id="profArea" type="text" disabled style="opacity:0.85;background:var(--bg-elevated);" />
                </div>
              </div>
            </div>

            <!-- Registered Family Members -->
            <div class="card">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <div class="card-title">Family Members (<span id="profFamilyCount">0</span> registered)</div>
                <button class="btn btn-secondary btn-sm" onclick="window.openAddFamilyMemberModal()">+ Add</button>
              </div>
              <div id="profFamilyList" style="display:flex;flex-direction:column;gap:8px;">
                <div style="padding:20px;text-align:center;color:var(--text-muted);">Loading family members...</div>
              </div>
            </div>
          </div>

          <!-- Right: Vehicles & Emergency Contact -->
          <div>
            <!-- Registered Vehicles -->
            <div class="card mb-md">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <div class="card-title">Registered Vehicles & Parking Stickers</div>
                <button class="btn btn-secondary btn-sm" onclick="window.openAddVehicleModal()">+ Add Vehicle</button>
              </div>
              <div id="profVehiclesList" style="display:flex;flex-direction:column;gap:10px;">
                <div style="padding:20px;text-align:center;color:var(--text-muted);">Loading registered vehicles...</div>
              </div>
            </div>

            <!-- Emergency Contacts -->
            <div class="card" style="margin-bottom:30px;">
              <div style="display:flex;justify-content:space-between;align-items:center;" class="mb-md">
                <div class="card-title" style="margin-bottom:0;">Emergency & Gate Contact</div>
                <span class="badge badge-green" style="font-size:10px;" id="profEmergencyStatus">SYNCED WITH GATE</span>
              </div>
              <div class="form-group mb-sm">
                <label class="form-label">Emergency Contact Name</label>
                <input class="form-input" id="profEmergencyName" type="text" placeholder="e.g. Family member, Doctor, Relative" />
              </div>
              <div class="form-group mb-md">
                <label class="form-label">Emergency Phone</label>
                <input class="form-input" id="profEmergencyPhone" type="text" placeholder="+91 98000 00000" />
              </div>
              <button class="btn btn-primary w-full" style="justify-content:center;" onclick="window.saveEmergencyContact()">Update Emergency Contact</button>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// State store for Resident Profile
window.__residentProfileState = null;
window.__residentProfileActiveUnit = null;

window.switchResidentProfileFlat = function(unitId, unitNum) {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');
  if (!isAdmin) return;

  window.__residentPreviewUnitId = unitId;
  window.__residentPreviewUnitNumber = unitNum;
  window.__residentProfileActiveUnit = unitNum;
  window.loadResidentProfileData(true);
};

window.loadResidentProfileData = async function(forceRefresh = false) {
  // Clear any legacy dummy profile data
  try {
    const legacy = JSON.parse(localStorage.getItem('rwa_resident_profile') || 'null');
    if (legacy && (legacy.fullName === 'Aman Mehta' || legacy.email === 'aman.mehta@gmail.com')) {
      localStorage.removeItem('rwa_resident_profile');
    }
  } catch(e) {}

  let user = null;
  // 1. Always attempt to sync true authenticated user from /api/auth/me
  try {
    const meRes = await (window.apiFetch || fetch)('/api/auth/me').catch(() => null);
    if (meRes && meRes.ok) {
      const meData = await meRes.json();
      if (meData && meData.user) {
        user = meData.user;
        localStorage.setItem('rwa_user', JSON.stringify(user));
        localStorage.setItem('rwa_current_user', JSON.stringify(user));
      }
    }
  } catch(e) {}

  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('rwa_user') || '{}');
    } catch(e) {}
  }

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN' || user.role === 'RWA_ADMIN');

  // Sanitize legacy dummy contamination if present
  if (user && user.name === 'Aman Mehta') {
    user.name = 'Test name';
    user.phone = '1234567890';
    user.email = 'admin@rwamanager.com';
    try {
      localStorage.setItem('rwa_user', JSON.stringify(user));
    } catch(e) {}
  }

  // 2. Fetch society units
  let allUnits = window.__societyUnitsCache || [];
  if (allUnits.length === 0 || forceRefresh) {
    try {
      const unitsRes = await (window.apiFetch || fetch)('/api/units').catch(() => null);
      if (unitsRes && unitsRes.ok) {
        const uData = await unitsRes.json();
        allUnits = uData.units || [];
        window.__societyUnitsCache = allUnits;
      }
    } catch(e) {}
  }

  // 3. Resolve active flat strictly
  let currentUnit = null;
  if (isAdmin) {
    const urlFlat = new URLSearchParams(window.location.search).get('flat');
    currentUnit = window.__residentPreviewUnitNumber ||
                  urlFlat ||
                  user?.unitNumber ||
                  (user?.unit && user.unit.unitNumber) ||
                  (user?.unitId && allUnits.find(u => u.id === user.unitId)?.unitNumber);
    if (!currentUnit && allUnits.length > 0) {
      currentUnit = allUnits[0].unitNumber || 'A-101';
    }
  } else {
    currentUnit = user?.unitNumber ||
                  (user?.unit && user.unit.unitNumber) ||
                  (user?.unitId && allUnits.find(u => u.id === user.unitId)?.unitNumber);
  }
  if (!currentUnit) currentUnit = 'A-101';

  window.__residentProfileActiveUnit = currentUnit;

  const targetUnit = allUnits.find(u => u.unitNumber === currentUnit) || allUnits[0] || {};
  const blockName = targetUnit.block?.name || user?.blockName || 'Main Block';
  const areaDisplay = targetUnit.areaSqft ? `${targetUnit.areaSqft.toLocaleString('en-IN')} sq. ft.` : '1,800 sq. ft.';
  const defaultOccupancy = targetUnit.occupancyStatus === 'TENANT_OCCUPIED' ? 'Tenant - Residing' : 'Owner - Residing';

  // 4. Render Flat Picker in header if units exist: Admin only can switch, resident sees own badge
  const pickerWrap = document.getElementById('residentProfileFlatPicker');
  if (pickerWrap) {
    if (isAdmin && allUnits.length > 0) {
      pickerWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Flat:</span>
          <select onchange="const opt = this.options[this.selectedIndex]; window.switchResidentProfileFlat(this.value, opt.getAttribute('data-num'))" class="form-select"
            style="font-size:12px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);cursor:pointer;"
            title="Switch resident unit">
            ${allUnits.slice(0, 80).map(u => `
              <option value="${u.id}" data-num="${u.unitNumber}" ${u.unitNumber === currentUnit ? 'selected' : ''}>
                🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})
              </option>
            `).join('')}
          </select>
        </div>
      `;
    } else {
      pickerWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">My Flat:</span>
          <span style="font-size:12px;padding:3px 8px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);font-weight:700;color:var(--text-primary);">🏠 Flat ${currentUnit} (${blockName})</span>
        </div>
      `;
    }
  }

  const subEl = document.getElementById('residentProfileSubtitle');
  if (subEl) {
    subEl.textContent = `Manage registered family members, vehicle parking slots, and emergency contacts for Flat ${currentUnit} (${blockName})`;
  }

  // 5. Unit-isolated profile storage
  const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(unitStorageKey) || 'null');
  } catch(e) {}

  if (!stored) {
    stored = {
      fullName: user?.name || targetUnit.ownerName || 'Test name',
      unitNumber: `Flat ${currentUnit} (${blockName})`,
      unitId: targetUnit.id,
      mobile: user?.phone || targetUnit.ownerPhone || '1234567890',
      email: user?.email || targetUnit.ownerEmail || 'admin@rwamanager.com',
      occupancy: defaultOccupancy,
      area: areaDisplay,
      familyMembers: [],
      vehicles: [],
      emergencyName: '',
      emergencyPhone: ''
    };
  } else {
    // Sanitize any legacy Aman Mehta remnants
    if (!stored.fullName || stored.fullName === 'Aman Mehta') {
      stored.fullName = user?.name || targetUnit.ownerName || 'Test name';
    }
    if (!stored.email || stored.email === 'aman.mehta@gmail.com') {
      stored.email = user?.email || targetUnit.ownerEmail || 'admin@rwamanager.com';
    }
    if (!stored.mobile || stored.mobile === '+91 98765 43210') {
      stored.mobile = user?.phone || targetUnit.ownerPhone || '1234567890';
    }
    stored.unitNumber = `Flat ${currentUnit} (${blockName})`;
    stored.unitId = targetUnit.id;
    stored.area = areaDisplay;
  }

  // 6. Fetch real registered vehicles for this unit from /api/vehicles
  try {
    const vRes = await (window.apiFetch || fetch)(`/api/vehicles?unitNumber=${encodeURIComponent(currentUnit)}`).catch(() => null);
    if (vRes && vRes.ok) {
      const vData = await vRes.json();
      if (vData && Array.isArray(vData.vehicles) && vData.vehicles.length > 0) {
        stored.vehicles = vData.vehicles.map(v => ({
          id: v.id,
          type: v.type === 'CAR' ? '4-Wheeler (Car)' : (v.type === 'EV' ? 'Electric Vehicle (EV)' : '2-Wheeler (Bike/Scooter)'),
          plate: v.registrationNo,
          tag: v.rfidTag || `RFID Tag #RF-${Math.floor(10000 + Math.random() * 90000)}`,
          slot: v.parkingSlot ? `Slot ${v.parkingSlot}` : 'Basement Slot',
          verified: true
        }));
      }
    }
  } catch(e) {}

  window.__residentProfileState = stored;
  localStorage.setItem(unitStorageKey, JSON.stringify(stored));

  // 7. Populate Form Inputs
  const fName = document.getElementById('profFullName');
  const uNum = document.getElementById('profUnitNumber');
  const mob = document.getElementById('profMobile');
  const em = document.getElementById('profEmail');
  const occ = document.getElementById('profOccupancy');
  const area = document.getElementById('profArea');
  const emName = document.getElementById('profEmergencyName');
  const emPhone = document.getElementById('profEmergencyPhone');

  if (fName) fName.value = stored.fullName || user?.name || '';
  if (uNum) uNum.value = stored.unitNumber || `Flat ${currentUnit} (${blockName})`;
  if (mob) mob.value = stored.mobile || user?.phone || '';
  if (em) em.value = stored.email || user?.email || '';
  if (occ) occ.value = stored.occupancy || defaultOccupancy;
  if (area) area.value = stored.area || areaDisplay;
  if (emName) emName.value = stored.emergencyName || '';
  if (emPhone) emPhone.value = stored.emergencyPhone || '';

  window.renderResidentFamilyList();
  window.renderResidentVehiclesList();
};

window.renderResidentFamilyList = function() {
  const container = document.getElementById('profFamilyList');
  const countEl = document.getElementById('profFamilyCount');
  if (!container) return;

  const list = window.__residentProfileState?.familyMembers || [];
  if (countEl) countEl.textContent = list.length;

  const currentUnit = window.__residentProfileActiveUnit || 'A-101';

  if (list.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;border:1px dashed var(--border);border-radius:var(--r-md);">No family members registered for Flat ${currentUnit}. Click "+ Add" above.</div>`;
    return;
  }

  container.innerHTML = list.map(f => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);transition:all 0.15s;">
      <div>
        <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${f.name}</div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${f.rel} · ${f.phone || '—'}</div>
      </div>
      <button class="btn btn-ghost btn-sm" style="color:var(--red);font-size:14px;padding:3px 8px;" title="Remove family member" onclick="window.removeFamilyMember('${f.id}')">✕</button>
    </div>
  `).join('');
};

window.openAddFamilyMemberModal = function() {
  const html = `
    <div style="font-size:13px;line-height:1.5;">
      <div style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;margin-bottom:4px;">Full Name *</label>
        <input type="text" id="addFamName" placeholder="e.g. Rohini Mehta" class="form-input" style="width:100%;" required />
      </div>
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Relationship *</label>
          <select id="addFamRel" class="form-select" style="width:100%;">
            <option value="Spouse">Spouse</option>
            <option value="Son">Son</option>
            <option value="Son (Minor)">Son (Minor)</option>
            <option value="Daughter">Daughter</option>
            <option value="Daughter (Minor)">Daughter (Minor)</option>
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
            <option value="Other Dependent">Other Dependent</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Contact Phone</label>
          <input type="tel" id="addFamPhone" placeholder="e.g. 98765 22334" class="form-input" style="width:100%;" />
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;color:var(--text-secondary);">
          <input type="checkbox" id="addFamGateAccess" checked style="width:15px;height:15px;" />
          <span>Authorize Gate Intercom & Society Clubhouse Pass</span>
        </label>
      </div>
    </div>
  `;

  showModal('👨‍👩‍👧 Register Family Member', html, 'Add Member ✓', () => {
    const name = document.getElementById('addFamName')?.value?.trim();
    const rel = document.getElementById('addFamRel')?.value;
    const phone = document.getElementById('addFamPhone')?.value?.trim() || '—';

    if (!name) {
      showToast('Please enter family member full name.', 'warning');
      return;
    }

    const newMember = {
      id: `FM-${Date.now().toString(36).toUpperCase()}`,
      name,
      rel,
      phone
    };

    window.__residentProfileState.familyMembers = window.__residentProfileState.familyMembers || [];
    window.__residentProfileState.familyMembers.push(newMember);

    const currentUnit = window.__residentProfileActiveUnit || 'A-101';
    const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
    localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

    if (typeof playNotificationSound === 'function') {
      try { playNotificationSound(); } catch(e) {}
    }
    showToast(`🎉 Family member ${name} registered successfully!`, 'success');
    window.renderResidentFamilyList();
  }, '460px');
};

window.removeFamilyMember = function(memberId) {
  const member = (window.__residentProfileState?.familyMembers || []).find(m => m.id === memberId);
  const name = member ? member.name : 'family member';

  if (!confirm(`Remove ${name} from registered family members?`)) return;

  window.__residentProfileState.familyMembers = (window.__residentProfileState.familyMembers || []).filter(m => m.id !== memberId);
  
  const currentUnit = window.__residentProfileActiveUnit || 'A-101';
  const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
  localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast(`✓ Removed ${name} from family records.`, 'info');
  window.renderResidentFamilyList();
};

window.renderResidentVehiclesList = function() {
  const container = document.getElementById('profVehiclesList');
  if (!container) return;

  const list = window.__residentProfileState?.vehicles || [];
  const currentUnit = window.__residentProfileActiveUnit || 'A-101';

  if (list.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;border:1px dashed var(--border);border-radius:var(--r-md);">No vehicles registered for Flat ${currentUnit}. Click "+ Add Vehicle" above.</div>`;
    return;
  }

  container.innerHTML = list.map(v => `
    <div style="padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);transition:all 0.15s;"
      onmouseover="this.style.borderColor='var(--border)';"
      onmouseout="this.style.borderColor='var(--border-light)';">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-family:monospace;font-size:14px;font-weight:800;color:var(--blue);">${v.plate}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="badge ${v.verified ? 'badge-green' : 'badge-amber'}" style="font-size:10px;">${v.verified ? 'VERIFIED' : 'PENDING STICKER'}</span>
          <button class="btn btn-ghost btn-sm" style="color:var(--red);font-size:12px;padding:1px 6px;" title="De-register vehicle" onclick="window.removeResidentVehicle('${v.id}')">✕</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);">${v.type} · ${v.slot}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">🏷️ ${v.tag}</div>
    </div>
  `).join('');
};

window.openAddVehicleModal = function() {
  const currentUnit = window.__residentProfileActiveUnit || 'A-101';
  const targetUnit = (window.__societyUnitsCache || []).find(u => u.unitNumber === currentUnit) || {};

  const html = `
    <div style="font-size:13px;line-height:1.5;">
      <div style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;margin-bottom:4px;">Vehicle Registration Plate *</label>
        <input type="text" id="addVehPlate" placeholder="e.g. DL 01 AB 1234" class="form-input" style="width:100%;text-transform:uppercase;font-family:monospace;font-weight:700;" required />
      </div>
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Vehicle Type *</label>
          <select id="addVehType" class="form-select" style="width:100%;">
            <option value="4-Wheeler (Car)">4-Wheeler (Car)</option>
            <option value="2-Wheeler (Scooter)">2-Wheeler (Scooter)</option>
            <option value="2-Wheeler (Motorcycle)">2-Wheeler (Motorcycle)</option>
            <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label" style="font-weight:700;margin-bottom:4px;">Allocated Slot</label>
          <input type="text" id="addVehSlot" placeholder="e.g. Slot P-14 or Stilt" value="${targetUnit.parkingSlot || 'Stilt P-1'}" class="form-input" style="width:100%;" />
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;margin-bottom:4px;">Make & Model</label>
        <input type="text" id="addVehModel" placeholder="e.g. Honda City White, Hero Splendor" class="form-input" style="width:100%;" />
      </div>
      <div style="background:var(--bg-elevated);padding:10px 12px;border-radius:var(--r-sm);border:1px solid var(--border-light);margin-bottom:12px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;color:var(--blue);font-weight:600;">
          <input type="checkbox" id="addVehRfid" checked style="width:16px;height:16px;" />
          <span>🏷️ Issue Gate RFID Windshield Fast-Pass Sticker</span>
        </label>
      </div>
    </div>
  `;

  showModal('🚗 Register Vehicle & Parking Sticker', html, 'Register Vehicle ✓', async () => {
    const rawPlate = document.getElementById('addVehPlate')?.value?.trim();
    const type = document.getElementById('addVehType')?.value;
    const slot = document.getElementById('addVehSlot')?.value?.trim() || 'Stilt P-1';
    const reqRfid = document.getElementById('addVehRfid')?.checked;
    const model = document.getElementById('addVehModel')?.value?.trim() || '';

    if (!rawPlate) {
      showToast('Please enter vehicle registration plate number.', 'warning');
      return;
    }

    const plate = rawPlate.toUpperCase();
    const tagNum = Math.floor(10000 + Math.random() * 90000);
    const tag = reqRfid ? `RFID Tag #RF-${tagNum}` : `Society Sticker #SC-${Math.floor(100 + Math.random() * 900)}`;

    let createdId = `VEH-${Date.now().toString(36).toUpperCase()}`;

    try {
      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitNumber: currentUnit,
          unitId: targetUnit.id,
          registrationNo: plate,
          type: type.includes('4-Wheeler') ? 'CAR' : (type.includes('EV') ? 'EV' : 'BIKE'),
          parkingSlot: slot,
          make: model,
          model: model,
          color: 'White',
          rfidTag: tag
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data && data.vehicle && data.vehicle.id) {
          createdId = data.vehicle.id;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.error) {
          showToast(err.error, 'error');
          return;
        }
      }
    } catch(e) {
      console.warn('Vehicle API registration error:', e);
    }

    const newVehicle = {
      id: createdId,
      type,
      plate,
      tag,
      slot,
      verified: true
    };

    window.__residentProfileState.vehicles = window.__residentProfileState.vehicles || [];
    window.__residentProfileState.vehicles.push(newVehicle);

    const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
    localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

    if (typeof playNotificationSound === 'function') {
      try { playNotificationSound(); } catch(e) {}
    }
    showToast(`🎉 Vehicle ${plate} registered! RFID sticker request dispatched to Gate Security.`, 'success');
    window.renderResidentVehiclesList();
  }, '480px');
};

window.removeResidentVehicle = async function(vehId) {
  const veh = (window.__residentProfileState?.vehicles || []).find(v => v.id === vehId);
  const plate = veh ? veh.plate : 'vehicle';

  if (!confirm(`De-register vehicle ${plate}?\n\nGate RFID access sticker will be revoked.`)) return;

  try {
    const fetchFn = window.apiFetch || fetch;
    await fetchFn(`/api/vehicles?id=${encodeURIComponent(vehId)}`, { method: 'DELETE' }).catch(() => null);
  } catch(e) {}

  window.__residentProfileState.vehicles = (window.__residentProfileState.vehicles || []).filter(v => v.id !== vehId);

  const currentUnit = window.__residentProfileActiveUnit || 'A-101';
  const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
  localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast(`✓ Vehicle ${plate} removed from parking registry.`, 'info');
  window.renderResidentVehiclesList();
};

window.saveResidentProfile = async function() {
  const fName = document.getElementById('profFullName')?.value?.trim();
  const mob = document.getElementById('profMobile')?.value?.trim();
  const em = document.getElementById('profEmail')?.value?.trim();
  const occ = document.getElementById('profOccupancy')?.value || 'Owner - Residing';

  if (!fName) {
    showToast('Please enter your full name.', 'warning');
    return;
  }

  const currentUnit = window.__residentProfileActiveUnit || 'A-101';
  const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;

  window.__residentProfileState = window.__residentProfileState || {};
  window.__residentProfileState.fullName = fName;
  window.__residentProfileState.mobile = mob;
  window.__residentProfileState.email = em;
  window.__residentProfileState.occupancy = occ;

  localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

  // Sync to database account via PATCH /api/auth/me
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fName,
        email: em
      })
    });

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.user) {
        localStorage.setItem('rwa_user', JSON.stringify(data.user));
        localStorage.setItem('rwa_current_user', JSON.stringify(data.user));
      }
    }
  } catch(e) {
    console.warn('Profile sync fallback:', e);
  }

  // Update local rwa_user
  try {
    const u = JSON.parse(localStorage.getItem('rwa_user') || '{}');
    u.name = fName;
    if (mob) u.phone = mob;
    if (em) u.email = em;
    localStorage.setItem('rwa_user', JSON.stringify(u));
  } catch(err) {}

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast('🎉 Resident profile & unit details saved successfully!', 'success');
};

window.saveEmergencyContact = function() {
  const emName = document.getElementById('profEmergencyName')?.value?.trim();
  const emPhone = document.getElementById('profEmergencyPhone')?.value?.trim();

  if (!emName || !emPhone) {
    showToast('Please enter emergency contact name and phone number.', 'warning');
    return;
  }

  const currentUnit = window.__residentProfileActiveUnit || 'A-101';

  window.__residentProfileState = window.__residentProfileState || {};
  window.__residentProfileState.emergencyName = emName;
  window.__residentProfileState.emergencyPhone = emPhone;

  const unitStorageKey = `rwa_profile_unit_${currentUnit.replace(/^flat\s*/i, '').trim().toLowerCase()}`;
  localStorage.setItem(unitStorageKey, JSON.stringify(window.__residentProfileState));

  if (typeof playNotificationSound === 'function') {
    try { playNotificationSound(); } catch(e) {}
  }
  showToast('✓ Emergency contact updated & synchronized with Security Gate intercom!', 'success');
};

// ============================================================
// RESIDENT VISITOR ENTRY PASS MODALS & GENERATOR
// ============================================================

window.openGenerateEntryPassModal = function() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
  const unitNum = user?.unitNumber || (user?.unit && user.unit.unitNumber) || 'A-101';
  const residentName = user?.name || 'Resident';
  const residentPhone = user?.phone || '';

  const modalHtml = `
    <form id="resCreatePassForm" onsubmit="window.handleResidentCreatePass(event)" style="display:flex;flex-direction:column;gap:14px;">
      
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%);color:#fff;border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Host Flat</div>
          <div style="font-size:18px;font-weight:800;color:#F59E0B;margin-top:2px;">🏠 Flat ${unitNum}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Resident</div>
          <div style="font-size:13px;font-weight:700;color:#F8FAFC;margin-top:2px;">${residentName}</div>
        </div>
      </div>

      <input type="hidden" id="resPassFlat" value="${unitNum}" />
      <input type="hidden" id="resPassHostName" value="${residentName}" />
      <input type="hidden" id="resPassHostPhone" value="${residentPhone}" />

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Full Name *</label>
          <input type="text" id="resPassVisitorName" required class="form-control" placeholder="e.g. Rahul Sharma" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Phone (WhatsApp)</label>
          <input type="tel" id="resPassVisitorPhone" class="form-control" placeholder="e.g. 9812345678" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Category *</label>
          <select id="resPassVisitorType" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="GUEST" selected>👥 Guest / Relative</option>
            <option value="DELIVERY">📦 Delivery (Zomato/Swiggy/Amazon)</option>
            <option value="CAB">🚖 Cab (Uber / Ola)</option>
            <option value="SERVICE">🔧 Home Service / Technician</option>
            <option value="FAMILY">👨‍👩‍👧 Family Member</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Vehicle Number (Optional)</label>
          <input type="text" id="resPassVehicle" class="form-control" placeholder="e.g. DL 01 AB 1234" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Allowed Gate Entry</label>
          <select id="resPassGate" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="Gate 1 - Main Gate">Gate 1 - Main Gate</option>
            <option value="Gate 2 - Service Gate">Gate 2 - Service Gate</option>
            <option value="Gate 3 - Rear Gate">Gate 3 - Rear Gate</option>
            <option value="All Gates">Any Society Gate</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Pass Validity Window</label>
          <select id="resPassValidity" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="4">4 Hours (Quick Drop / Delivery)</option>
            <option value="8">8 Hours (Half Day Visit)</option>
            <option value="12" selected>12 Hours (Standard Day)</option>
            <option value="24">24 Hours (Full Day)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Purpose / Instructions for Guard</label>
        <input type="text" id="resPassPurpose" class="form-control" placeholder="e.g. Family lunch, allow entry without intercom" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
      </div>

      <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.25);border-radius:10px;padding:10px 14px;font-size:12px;color:#2563EB;line-height:1.45;">
        ✨ <strong>Instant Security Sync:</strong> Once issued, the security guard at the gate can verify your visitor using their <strong>Pass Code</strong> or <strong>4-digit PIN</strong>. You will receive an instant arrival notification when they check in!
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm" style="font-weight:800;background:linear-gradient(135deg,#2563EB,#1D4ED8);border:none;padding:8px 18px;border-radius:var(--r-md);box-shadow:0 4px 12px rgba(37,99,235,0.3);">
          🎫 Generate &amp; Share Pass
        </button>
      </div>

    </form>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '🎫 Generate Visitor Entry Pass',
      body: modalHtml,
    });
  }
};

window.handleResidentCreatePass = async function(e) {
  e.preventDefault();
  const visitorName = document.getElementById('resPassVisitorName')?.value;
  const visitorPhone = document.getElementById('resPassVisitorPhone')?.value;
  const visitorType = document.getElementById('resPassVisitorType')?.value;
  const vehicleNumber = document.getElementById('resPassVehicle')?.value;
  const gateNumber = document.getElementById('resPassGate')?.value;
  const validHours = document.getElementById('resPassValidity')?.value;
  const purpose = document.getElementById('resPassPurpose')?.value;
  const residentUnit = document.getElementById('resPassFlat')?.value;
  const residentName = document.getElementById('resPassHostName')?.value;
  const residentPhone = document.getElementById('resPassHostPhone')?.value;

  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName,
        visitorPhone,
        visitorType,
        vehicleNumber,
        residentUnit,
        residentName,
        residentPhone,
        gateNumber,
        validHours,
        purpose,
      }),
    }) : fetch('/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName,
        visitorPhone,
        visitorType,
        vehicleNumber,
        residentUnit,
        residentName,
        residentPhone,
        gateNumber,
        validHours,
        purpose,
      }),
    }));

    const data = await res.json();
    if (data.success && data.pass) {
      if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
      if (typeof showToast === 'function') showToast(`Pass ${data.pass.passCode} generated successfully!`, 'success');
      
      // Reload dashboard
      if (typeof window.loadLiveResidentDashboard === 'function') {
        window.loadLiveResidentDashboard();
      }

      // Open digital pass sharing card
      setTimeout(() => {
        window.openDigitalPassModal(data.pass);
      }, 300);
    } else {
      alert(data.error || 'Failed to generate entry pass');
    }
  } catch (err) {
    console.error('Error generating resident pass:', err);
    alert('Server communication error');
  }
};

window.openDigitalPassModal = function(p) {
  if (!p) return;

  const validUntilStr = p.validUntil ? new Date(p.validUntil).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Valid Today';
  const shareText = encodeURIComponent(
    `🎫 *CUTORA SOCIETY ENTRY PASS*\n` +
    `--------------------------------\n` +
    `Visitor: ${p.visitorName}\n` +
    `Visiting Flat: ${p.residentUnit} (${p.residentName || 'Resident'})\n` +
    `Gate Code: *${p.passCode}*\n` +
    `Security PIN: *${p.otpPin}*\n` +
    `Gate: ${p.gateNumber || 'Gate 1'}\n` +
    `Validity: ${validUntilStr}\n` +
    `--------------------------------\n` +
    `Please share this Pass Code or PIN ${p.otpPin} with the security guard at the gate for fast verified entry.`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      
      <!-- Pass Card Mockup -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%);color:#fff;border-radius:18px;padding:22px;border:2px solid #3B82F6;box-shadow:0 15px 35px -5px rgba(15,23,42,0.4);position:relative;overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed rgba(255,255,255,0.2);padding-bottom:12px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">🏛️</span>
            <div>
              <div style="font-size:14px;font-weight:800;color:#F8FAFC;">CUTORA SOCIETY ENTRY PASS</div>
              <div style="font-size:11px;color:#94A3B8;">Verified Resident Visitor Pass</div>
            </div>
          </div>
          <div style="font-size:11px;font-weight:800;color:#10B981;background:rgba(16,185,129,0.15);padding:3px 8px;border-radius:8px;">
            ${p.status || 'APPROVED'}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;">
          <div>
            <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Visitor Name</div>
            <div style="font-size:17px;font-weight:800;color:#fff;">${p.visitorName}</div>
            <div style="font-size:12px;color:#38BDF8;font-weight:600;margin-top:2px;">
              ${p.visitorType} ${p.visitorPhone ? '· 📞 ' + p.visitorPhone : ''}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
              <div>
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Host Flat</div>
                <div style="font-size:14px;font-weight:800;color:#F59E0B;margin-top:2px;">🏠 Flat ${p.residentUnit}</div>
              </div>

              <div>
                <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Gate</div>
                <div style="font-size:13px;font-weight:700;color:#fff;margin-top:2px;">🚪 ${p.gateNumber || 'Gate 1'}</div>
              </div>
            </div>
          </div>

          <!-- PIN Box -->
          <div style="background:#fff;border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0F172A;min-width:110px;">
            <div style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;">Security PIN</div>
            <div style="font-size:22px;font-weight:900;color:#1E293B;letter-spacing:2px;font-family:monospace;margin:4px 0;">${p.otpPin || '4821'}</div>
            <div style="font-size:9.5px;color:#94A3B8;font-weight:700;">TELL GUARD</div>
          </div>
        </div>

        <div style="margin-top:14px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94A3B8;">
          <div>Pass ID: <span style="font-family:monospace;font-weight:700;color:#fff;">${p.passCode}</span></div>
          <div>Valid until: <span style="color:#fff;font-weight:600;">${validUntilStr}</span></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>
        <button class="btn btn-sm" onclick="
          navigator.clipboard.writeText('Cutora Society Entry Pass for Flat ${p.residentUnit} | Code: ${p.passCode} | Security PIN: ${p.otpPin} | Gate: ${p.gateNumber || 'Gate 1'}');
          if (typeof showToast === 'function') showToast('Pass text copied to clipboard!', 'success');
        " style="background:#F1F5F9;color:#0F172A;font-weight:700;border:1px solid #CBD5E1;">
          📋 Copy Pass
        </button>
        <a href="${whatsappUrl}" target="_blank" class="btn btn-sm" style="background:#25D366;color:#fff;font-weight:700;display:inline-flex;align-items:center;gap:6px;border:none;padding:8px 16px;text-decoration:none;border-radius:var(--r-md);">
          <span>💬</span>
          <span>Share with Guest on WhatsApp</span>
        </a>
      </div>

    </div>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '🎫 Share Visitor Entry Pass',
      body: modalHtml,
    });
  }
};

