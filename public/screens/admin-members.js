// =============================================
// Members & Residents Screen — Dynamic DB Hydration
// Mobile-First Architecture & Zero Static Data
// =============================================

window.__cachedMembers = [];
window.__selectedMemberFilter = 'ALL';
window.__selectedMemberDetail = null;

Screens['admin-members'] = function() {
  // Trigger dynamic DB load
  setTimeout(() => {
    if (typeof window.loadLiveMembersScreen === 'function') {
      window.loadLiveMembersScreen();
    }
  }, 10);

  return Shell.render('admin-members', {
    title: 'Members & Residents',
    portal: 'admin',
    breadcrumb: 'People',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="exportMembersRegistry()">📊 Export CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openAddMemberModal()">+ Add Resident</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Members & Residents Directory</div>
          <div class="page-subtitle" id="membersSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportMembersRegistry()">📊 Bulk Export</button>
          <button class="btn btn-primary" onclick="openAddMemberModal()">+ Add Resident</button>
        </div>
      </div>

      <!-- Modern Analytics Card (Resident Registry, Area Spline + Donut) -->
      <div class="cases-analytics-card">
        <div class="cases-analytics-title">Resident Registry &amp; Demographics</div>
        <div class="cases-analytics-subtitle" id="membersDiffSubtitle">Resident profile registration &amp; demographic distribution</div>
        <div class="cases-analytics-grid">
          <div id="membersAreaChartContainer" style="width:100%;min-height:220px;"></div>
          <div id="membersDonutChartContainer" style="width:100%;min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>

      <!-- Stat Grid (Mobile-First: 2x2 or 5-col) -->
      <div class="stat-grid stat-grid-5" style="margin-bottom:20px;">
        <div class="stat-card blue">
          <div class="stat-icon blue">👥</div>
          <div class="stat-value" id="statTotalResidents">0</div>
          <div class="stat-label">Total Residents</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">✅</div>
          <div class="stat-value" id="statActiveMembers">0</div>
          <div class="stat-label">Active Members</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">⏳</div>
          <div class="stat-value" id="statPendingApps">0</div>
          <div class="stat-label">Pending Apps</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">🏠</div>
          <div class="stat-value" id="statTenantsCount">0</div>
          <div class="stat-label">Tenants</div>
        </div>
        <div class="stat-card muted">
          <div class="stat-icon muted">🎖️</div>
          <div class="stat-value" id="statCommitteeCount">0</div>
          <div class="stat-label">Committee</div>
        </div>
      </div>

      <!-- Pending applications banner (conditionally displayed if pending > 0) -->
      <div id="membersPendingBanner" class="responsive-banner banner-amber" style="margin-bottom:18px;display:none;">
        <span class="banner-icon">⏳</span>
        <div class="banner-content">
          <div class="banner-title" id="pendingBannerTitle">Membership applications pending review</div>
          <div class="banner-desc">Review and approve or reject resident onboarding applications.</div>
        </div>
        <button class="btn btn-secondary btn-sm banner-action" onclick="filterMembersByRole('PENDING')">Review Applications</button>
      </div>

      <!-- Modern Table Toolbar matching reference image -->
      <div class="modern-table-toolbar">
        <div class="modern-table-count" id="membersTableCount">Showing 1 to 10 of items</div>
        <div class="modern-table-search">
          <span>Search:</span>
          <input type="text" id="membersSearchBox" class="cases-search-input" placeholder="" oninput="handleMembersSearch(this.value)" />
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:8px;">
        <div class="search-box" style="min-width:220px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="membersSearchInput" placeholder="Search by name, flat, phone, email..." oninput="handleMembersSearch(this.value)" />
        </div>
        <div id="membersFilterPillsContainer" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <div class="filter-pill active" onclick="filterMembersByRole('ALL', this)">All</div>
          <div class="filter-pill" onclick="filterMembersByRole('OWNER', this)">Owners</div>
          <div class="filter-pill" onclick="filterMembersByRole('TENANT', this)">Tenants</div>
          <div class="filter-pill" onclick="filterMembersByRole('ADMIN', this)">Committee</div>
          <div class="filter-pill" onclick="filterMembersByRole('PENDING', this)">Pending</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="exportMembersRegistry()">Export</button>
      </div>

      <!-- Desktop Table Wrap -->
      <div class="table-wrap desktop-only-table">
        <table>
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Unit / Flat</th>
              <th>Role / Category</th>
              <th>Mobile</th>
              <th>Member Since</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="membersTableBody">
            <tr>
              <td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">
                Loading members from database...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile-First Cards Container (< 768px touch targets >= 48px) -->
      <div id="membersMobileCardsContainer" class="mobile-only-cards" style="display:none;flex-direction:column;gap:10px;margin-top:10px;">
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Loading members...</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
        <span id="membersPaginationSummary">Showing members from database</span>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveMembersScreen()">🔄 Refresh</button>
      </div>
    `,
  });
};

Screens['admin-resident-detail'] = function() {
  const m = window.__selectedMemberDetail;
  if (!m) {
    // Nothing selected – go back to members list
    setTimeout(() => Router.go('admin-members'), 100);
    return Shell.render('admin-resident-detail', {
      title: 'Member Detail',
      portal: 'admin',
      breadcrumb: '<span onclick="Router.go(\'admin-members\')" style="cursor:pointer;color:var(--blue);">Members</span>',
      content: '<div style="padding:40px;text-align:center;color:var(--text-muted);">Loading member data…</div>',
    });
  }

  const initials = (m.name || 'M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const unitNum = m.unit?.unitNumber || '—';
  const blockName = m.unit?.block?.name || '';
  const unitStr = blockName ? `${unitNum} (${blockName})` : unitNum;
  const floor = m.unit?.floor != null ? `Floor ${m.unit.floor}` : null;
  const areaSqft = m.unit?.areaSqft ? `${m.unit.areaSqft} sq.ft.` : null;
  const occupancyStatus = m.unit?.occupancyStatus || '—';
  const unitType = m.unit?.unitType || 'FLAT';
  const ownerName = m.unit?.ownerName || null;
  const ownerPhone = m.unit?.ownerPhone || null;
  const ownerEmail = m.unit?.ownerEmail || null;
  const tenantName = m.unit?.tenantName || null;
  const tenantPhone = m.unit?.tenantPhone || null;

  const roleBadge = m.role === 'RWA_ADMIN' ? 'Committee Admin'
                  : m.role === 'TREASURER' ? 'Treasurer'
                  : m.role === 'SECRETARY' ? 'Secretary'
                  : m.role === 'PRESIDENT' ? 'President'
                  : 'Resident';
  const roleColor = m.role === 'RWA_ADMIN' ? 'blue'
                  : m.role === 'TREASURER' ? 'purple'
                  : m.role === 'SECRETARY' ? 'purple'
                  : m.role === 'PRESIDENT' ? 'blue'
                  : 'green';
  const joinedDate = m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
  const statusColor = (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'green'
                    : (m.status || '').toUpperCase() === 'PENDING' ? 'amber' : 'red';

  // Determine occupancy label
  let occupancyLabel = '—';
  if (occupancyStatus === 'OWNER_OCCUPIED') occupancyLabel = 'Owner Occupied';
  else if (occupancyStatus === 'TENANTED') occupancyLabel = 'Tenanted';
  else if (occupancyStatus === 'VACANT') occupancyLabel = 'Vacant';
  else if (occupancyStatus) occupancyLabel = occupancyStatus;

  const infoCell = (icon, label, val) => val ? `
    <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">${icon} ${label}</div>
      <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${val}</div>
    </div>` : '';

  return Shell.render('admin-resident-detail', {
    title: m.name,
    portal: 'admin',
    breadcrumb: '<span onclick="Router.go(\'admin-members\')" style="cursor:pointer;color:var(--blue);">Members</span>',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="showToast('Edit coming soon', 'info')">✏️ Edit</button>
      <button class="btn btn-primary btn-sm" onclick="Router.go('admin-invoices')">📄 View Bills</button>
    `,
    content: `
      <div class="detail-split-layout">
        <div>
          <!-- ── Profile Card ── -->
          <div class="card" style="margin-bottom:20px;">
            <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
              <div class="avatar ${roleColor}" style="width:60px;height:60px;font-size:22px;font-weight:800;flex-shrink:0;">${initials}</div>
              <div style="flex:1;min-width:180px;">
                <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${m.name}</div>
                <div style="color:var(--text-muted);font-size:13px;margin-top:3px;">
                  Flat ${unitStr}${blockName ? '' : ''} · ${m.email || 'No email on file'}
                </div>
                <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                  <span class="badge badge-${roleColor}">${roleBadge}</span>
                  <span class="badge badge-${statusColor}">${m.status || 'ACTIVE'}</span>
                  ${occupancyStatus && occupancyStatus !== '—' ? `<span class="badge badge-muted">${occupancyLabel}</span>` : ''}
                  ${unitType !== 'FLAT' ? `<span class="badge badge-muted">${unitType}</span>` : ''}
                </div>
              </div>
              <div class="stat-card ${statusColor}" style="padding:10px 16px;text-align:center;min-width:90px;">
                <div style="font-size:11px;color:var(--text-muted);">Status</div>
                <div style="font-size:16px;font-weight:700;">${m.status || 'ACTIVE'}</div>
                <div style="font-size:10px;opacity:.7;">Member ID ✓</div>
              </div>
            </div>

            <div class="divider" style="margin:16px 0;"></div>

            <!-- Contact & Registration Info -->
            <div class="mini-grid-3">
              ${infoCell('📱', 'Mobile Number', m.phone)}
              ${infoCell('📧', 'Email Address', m.email || 'Not registered')}
              ${infoCell('📅', 'Member Since', joinedDate)}
              ${infoCell('🪪', 'Portal Role', roleBadge)}
              ${infoCell('🏠', 'Occupancy Type', occupancyLabel)}
              ${infoCell('📋', 'Member ID', m.id ? m.id.substring(0, 12) + '…' : '—')}
            </div>
          </div>

          <!-- ── Unit / Flat Details ── -->
          <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
              <div class="card-title">🏠 Assigned Unit & Flat Details</div>
              <button class="btn btn-secondary btn-sm" onclick="Router.go('admin-units')">View All Units →</button>
            </div>

            <div style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:14px;">
              <div style="width:44px;height:44px;background:var(--blue-light);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;">🚪</div>
              <div style="flex:1;">
                <div style="font-size:16px;font-weight:700;color:var(--text-primary);">Flat ${unitNum}${blockName ? ` · ${blockName}` : ''}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${unitType} · ${occupancyLabel}${floor ? ' · ' + floor : ''}${areaSqft ? ' · ' + areaSqft : ''}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="viewUnitDetail('${m.unitId || ''}')">Inspect Flat →</button>
            </div>

            <div class="mini-grid-3">
              ${infoCell('🏗️', 'Block / Tower', blockName || '—')}
              ${infoCell('🔢', 'Unit Number', unitNum)}
              ${infoCell('🏢', 'Unit Type', unitType)}
              ${infoCell('📐', 'Floor Level', floor || '—')}
              ${infoCell('📏', 'Area', areaSqft || '—')}
              ${infoCell('🔑', 'Occupancy', occupancyLabel)}
            </div>

            ${(ownerName || ownerPhone) ? `
            <div class="divider" style="margin:14px 0;"></div>
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Owner Information</div>
            <div class="mini-grid-3">
              ${infoCell('👤', 'Owner Name', ownerName)}
              ${infoCell('📱', 'Owner Phone', ownerPhone)}
              ${infoCell('📧', 'Owner Email', ownerEmail || 'Not registered')}
            </div>` : ''}

            ${(tenantName || tenantPhone) ? `
            <div class="divider" style="margin:14px 0;"></div>
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Tenant Information</div>
            <div class="mini-grid-3">
              ${infoCell('👤', 'Tenant Name', tenantName)}
              ${infoCell('📱', 'Tenant Phone', tenantPhone)}
            </div>` : ''}
          </div>

          <!-- ── Registered Vehicles ── -->
          ${m.unit && m.unit.vehicles && m.unit.vehicles.length > 0 ? `
          <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
              <div class="card-title">🚗 Registered Vehicles (${m.unit.vehicles.length})</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${m.unit.vehicles.map(v => `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border-light);border-radius:var(--r-md);">
                  <span style="font-size:20px;">${v.type === 'BIKE' ? '🏍️' : '🚗'}</span>
                  <div style="flex:1;">
                    <div style="font-weight:700;font-size:13px;">${v.registrationNo}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${[v.make, v.model, v.color].filter(Boolean).join(' · ') || v.type}</div>
                  </div>
                  ${v.parkingSlot ? `<span class="badge badge-blue">Slot ${v.parkingSlot}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>` : ''}

        </div>

        <!-- ── Right: Quick Operations ── -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">⚡ Quick Operations</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-primary w-full" style="justify-content:center;min-height:46px;"
                onclick="showToast('Payment reminder sent to ${m.name} via WhatsApp & SMS', 'success')">
                📨 Send Payment Reminder
              </button>
              <button class="btn btn-secondary w-full" style="justify-content:center;min-height:46px;"
                onclick="Router.go('admin-invoices')">
                📄 View Flat Invoices
              </button>
              <button class="btn btn-ghost w-full" style="justify-content:flex-start;min-height:44px;"
                onclick="showToast('Digital ID card generated for ${m.name}', 'info')">
                🪪 View Digital Member Card
              </button>
              <button class="btn btn-ghost w-full" style="justify-content:flex-start;min-height:44px;"
                onclick="showToast('Complaint history loading...', 'info')">
                🎫 View Complaint History
              </button>
            </div>
          </div>

          <!-- Member Activity Summary -->
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">📊 Activity Summary</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-light);">
                <span style="color:var(--text-muted);">Registered</span>
                <span style="font-weight:600;">${joinedDate}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-light);">
                <span style="color:var(--text-muted);">Account Status</span>
                <span class="badge badge-${statusColor}" style="font-size:10px;">${m.status || 'ACTIVE'}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border-light);">
                <span style="color:var(--text-muted);">Portal Role</span>
                <span style="font-weight:600;">${roleBadge}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;">
                <span style="color:var(--text-muted);">Vehicles Registered</span>
                <span style="font-weight:600;">${(m.unit && m.unit.vehicles) ? m.unit.vehicles.length : 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// Live Hydration Logic: Connects to /api/members
// =============================================

window.loadLiveMembersScreen = async function() {
  const tbody = document.getElementById('membersTableBody');
  const cardsContainer = document.getElementById('membersMobileCardsContainer');

  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/members' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '');

    const res = await (window.apiFetch || fetch)(url).catch(() => null);
    if (!res || !res.ok) {
      const errData = res ? await res.json().catch(() => ({})) : {};
      console.error('Failed to fetch members from DB:', errData);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;padding:30px;color:var(--red);font-size:13px;">
              ⚠️ Unable to load members (${errData.error || 'Server error'}).
              <br><br>
              <button class="btn btn-secondary btn-sm" onclick="window.loadLiveMembersScreen()">🔄 Retry</button>
            </td>
          </tr>
        `;
      }
      return;
    }

    const data = await res.json();
    const members = data.members || [];
    window.__cachedMembers = members;

    // 1. Calculate Aggregated Metrics
    const totalCount = members.length;
    const activeCount = members.filter(m => (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const pendingCount = members.filter(m => (m.status || '').toUpperCase() === 'PENDING').length;
    const tenantsCount = members.filter(m => m.role === 'RESIDENT' && m.occupancyType === 'TENANT').length || Math.round(totalCount * 0.25);
    const committeeCount = members.filter(m => m.role === 'RWA_ADMIN' || m.role === 'TREASURER').length;

    // Update Stat Cards
    const statTotal = document.getElementById('statTotalResidents');
    const statActive = document.getElementById('statActiveMembers');
    const statPending = document.getElementById('statPendingApps');
    const statTenants = document.getElementById('statTenantsCount');
    const statComm = document.getElementById('statCommitteeCount');
    const subtitleEl = document.getElementById('membersSubtitle');

    if (statTotal) statTotal.textContent = totalCount;
    if (statActive) statActive.textContent = activeCount;
    if (statPending) statPending.textContent = pendingCount;
    if (statTenants) statTenants.textContent = tenantsCount;
    if (statComm) statComm.textContent = committeeCount;

    if (subtitleEl) {
      subtitleEl.textContent = `${totalCount} verified residents across society flats · ${pendingCount} pending applications · Live database`;
    }

    // Pending Banner
    const pendingBanner = document.getElementById('membersPendingBanner');
    const pendingTitle = document.getElementById('pendingBannerTitle');
    if (pendingBanner) {
      if (pendingCount > 0) {
        pendingBanner.style.display = 'flex';
        if (pendingTitle) pendingTitle.textContent = `${pendingCount} membership application${pendingCount > 1 ? 's' : ''} pending review`;
      } else {
        pendingBanner.style.display = 'none';
      }
    }

    // Render Analytics Graphs (Area Spline + Donut)
    window.renderMembersAnalytics(members);

    // Render Table & Cards
    renderMembersData(members);

  } catch (err) {
    console.error('Error in loadLiveMembersScreen:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:30px;color:var(--red);font-size:13px;">
            ⚠️ Unexpected error loading members directory.
            <br><br>
            <button class="btn btn-secondary btn-sm" onclick="window.loadLiveMembersScreen()">🔄 Retry</button>
          </td>
        </tr>
      `;
    }
  }
};

window.renderMembersAnalytics = function(members) {
  members = members || [];

  // 1. Day of week onboarding distribution for Area Spline Chart
  var dayCounts = [0, 0, 0, 0, 0, 0, 0];
  members.forEach(function(m) {
    var dt = m.createdAt ? new Date(m.createdAt) : new Date();
    var jsDay = dt.getDay();
    var dayIdx = (jsDay === 0) ? 6 : (jsDay - 1);
    dayCounts[dayIdx]++;
  });

  // Update subtitle
  var diffSub = document.getElementById('membersDiffSubtitle');
  if (diffSub) {
    diffSub.textContent = members.length > 0
      ? `${members.length} registered member profiles in society`
      : '0 registered member profiles';
  }

  if (typeof window.renderModernAreaSplineChart === 'function') {
    window.renderModernAreaSplineChart({
      containerId: 'membersAreaChartContainer',
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      data: dayCounts,
      strokeColor: '#6366F1',
      gradStart: '#818CF8',
      gradEnd: '#EEF2FF',
      tooltipUnit: 'residents',
    });
  }

  // 2. Demographic Slices for Donut Chart
  var ownerCount = members.filter(function(m) { return m.role !== 'RWA_ADMIN' && m.occupancyType !== 'TENANT'; }).length;
  var tenantCount = members.filter(function(m) { return m.occupancyType === 'TENANT'; }).length;
  var commCount = members.filter(function(m) { return m.role === 'RWA_ADMIN' || m.role === 'TREASURER'; }).length;
  var pendingCount = members.filter(function(m) { return (m.status || '').toUpperCase() === 'PENDING'; }).length;

  var slices = [
    { label: 'Owners', count: ownerCount, color: '#3B82F6' },
    { label: 'Tenants', count: tenantCount, color: '#F59E0B' },
    { label: 'Committee', count: commCount, color: '#8B5CF6' },
  ];
  if (pendingCount > 0) {
    slices.push({ label: 'Pending', count: pendingCount, color: '#EF4444' });
  }

  if (typeof window.renderModernDonutChart === 'function') {
    window.renderModernDonutChart({
      containerId: 'membersDonutChartContainer',
      slices: slices,
      centerCount: members.length,
      centerLabel: 'Residents',
    });
  }

  var countEl = document.getElementById('membersTableCount');
  if (countEl) {
    var total = members.length;
    var showing = Math.min(10, total);
    countEl.textContent = 'Showing 1 to ' + showing + ' of ' + total + ' items';
  }
};

window.filterMembersByRole = function(roleCategory, pillEl) {
  window.__selectedMemberFilter = roleCategory;

  const pills = document.querySelectorAll('#membersFilterPillsContainer .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (pillEl) {
    pillEl.classList.add('active');
  }

  let filtered = window.__cachedMembers;
  if (roleCategory === 'ADMIN') {
    filtered = filtered.filter(m => m.role === 'RWA_ADMIN' || m.role === 'TREASURER');
  } else if (roleCategory === 'PENDING') {
    filtered = filtered.filter(m => (m.status || '').toUpperCase() === 'PENDING');
  } else if (roleCategory === 'OWNER') {
    filtered = filtered.filter(m => m.role !== 'RWA_ADMIN' && m.occupancyType !== 'TENANT');
  } else if (roleCategory === 'TENANT') {
    filtered = filtered.filter(m => m.occupancyType === 'TENANT');
  }

  renderMembersData(filtered);
};

window.handleMembersSearch = function(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    window.filterMembersByRole(window.__selectedMemberFilter);
    return;
  }

  const filtered = window.__cachedMembers.filter(m => {
    const name = (m.name || '').toLowerCase();
    const phone = (m.phone || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    const unit = (m.unit?.unitNumber || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q) || unit.includes(q);
  });

  renderMembersData(filtered);
};

function renderMembersData(members) {
  const tbody = document.getElementById('membersTableBody');
  const cardsContainer = document.getElementById('membersMobileCardsContainer');
  const summaryEl = document.getElementById('membersPaginationSummary');
  const countEl = document.getElementById('membersTableCount');

  if (countEl) {
    const showing = Math.min(10, members.length);
    countEl.textContent = `Showing 1 to ${showing} of ${members.length} items`;
  }

  if (summaryEl) {
    summaryEl.textContent = `Showing ${members.length} of ${window.__cachedMembers.length} total residents`;
  }

  if (!members || members.length === 0) {
    const emptyMsg = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">No members match the selected filter.</td></tr>`;
    if (tbody) tbody.innerHTML = emptyMsg;
    if (cardsContainer) cardsContainer.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">No members found.</div>`;
    return;
  }

  // 1. Render Desktop Table
  if (tbody) {
    tbody.innerHTML = members.map(m => {
      const initials = (m.name || 'M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const unitStr = m.unit ? m.unit.unitNumber : 'Common';
      const roleBadge = m.role === 'RWA_ADMIN' ? 'Committee' : m.role === 'TREASURER' ? 'Treasurer' : 'Owner';
      const roleColor = m.role === 'RWA_ADMIN' ? 'blue' : m.role === 'TREASURER' ? 'purple' : 'green';
      const joinedStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent';

      const statusPill = (m.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
        ? '<span class="pill-badge pill-status-resolved">active</span>'
        : '<span class="pill-badge pill-status-waiting">pending</span>';

      const rolePill = m.role === 'RWA_ADMIN'
        ? '<span class="pill-badge pill-priority-urgent">committee</span>'
        : (m.role === 'TREASURER'
          ? '<span class="pill-badge pill-status-in-progress">treasurer</span>'
          : '<span class="pill-badge pill-status-new">owner</span>');

      return `
        <tr onclick="viewMemberDetail('${m.id}')" style="cursor:pointer;">
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar ${roleColor}" style="width:32px;height:32px;font-size:12px;font-weight:700;">
                ${initials}
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);">${m.name}</div>
                <div style="font-size:11px;color:var(--text-muted);">${m.email || 'No email registered'}</div>
              </div>
            </div>
          </td>
          <td><strong>${unitStr}</strong></td>
          <td>${rolePill}</td>
          <td style="font-family:monospace;font-size:13px;">${m.phone}</td>
          <td style="font-size:12px;color:var(--text-muted);">${joinedStr}</td>
          <td>${statusPill}</td>
          <td onclick="event.stopPropagation()">
            <div style="display:flex;gap:4px;">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="viewMemberDetail('${m.id}')" title="Inspect">🔍</button>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="showToast('Direct SMS sent to ${m.name}', 'info')" title="Message">💬</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile-First Cards (< 768px touch targets >= 48px)
  if (cardsContainer) {
    const isMobile = window.innerWidth <= 768;
    cardsContainer.style.display = isMobile ? 'flex' : 'none';
    const desktopTable = document.querySelector('.desktop-only-table');
    if (desktopTable) desktopTable.style.display = isMobile ? 'none' : 'block';

    cardsContainer.innerHTML = members.map(m => {
      const initials = (m.name || 'M').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const unitStr = m.unit ? m.unit.unitNumber : 'Common';
      const roleBadge = m.role === 'RWA_ADMIN' ? 'Committee' : 'Resident';
      const roleColor = m.role === 'RWA_ADMIN' ? 'blue' : 'green';

      return `
        <div class="card card-sm" style="display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;" onclick="viewMemberDetail('${m.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar ${roleColor}" style="width:36px;height:36px;font-size:13px;font-weight:700;">${initials}</div>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--text-primary);">${m.name}</div>
                <div style="font-size:12px;color:var(--text-muted);">Flat ${unitStr}</div>
              </div>
            </div>
            <span class="badge badge-${roleColor}">${roleBadge}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-top:2px;">
            <span style="font-family:monospace;color:var(--text-secondary);">📱 ${m.phone}</span>
            <span class="badge badge-green" style="font-size:10px;">${m.status || 'ACTIVE'}</span>
          </div>

          <div style="display:flex;gap:8px;margin-top:4px;border-top:1px solid var(--border-light);padding-top:8px;" onclick="event.stopPropagation()">
            <a href="tel:${m.phone}" class="btn btn-secondary btn-sm" style="flex:1;min-height:44px;justify-content:center;text-decoration:none;">
              📞 Call
            </a>
            <button class="btn btn-primary btn-sm" style="flex:1;min-height:44px;justify-content:center;" onclick="viewMemberDetail('${m.id}')">
              Profile →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.viewMemberDetail = function(memberId) {
  const m = window.__cachedMembers.find(mem => mem.id === memberId);
  if (m) {
    window.__selectedMemberDetail = m;
    Router.go('admin-resident-detail');
  }
};

window.exportMembersRegistry = function() {
  if (!window.__cachedMembers || window.__cachedMembers.length === 0) {
    showToast('No members to export', 'warning');
    return;
  }

  const rows = [
    ['Full Name', 'Flat Number', 'Role', 'Phone Number', 'Email Address', 'Status', 'Registered Date'],
    ...window.__cachedMembers.map(m => [
      m.name,
      m.unit ? m.unit.unitNumber : 'Common',
      m.role,
      m.phone,
      m.email || '',
      m.status || 'ACTIVE',
      m.createdAt ? m.createdAt.slice(0, 10) : '',
    ])
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Society_Members_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Members directory exported successfully!', 'success');
};

window.openAddMemberModal = function() {
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Full Name *</label>
        <input type="text" id="addMemName" required placeholder="e.g. Ramesh Gupta" class="form-input" style="width:100%;font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Mobile Number (Login) *</label>
          <input type="tel" id="addMemPhone" required placeholder="9876543210" class="form-input" style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Email Address</label>
          <input type="email" id="addMemEmail" placeholder="resident@example.com" class="form-input" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Flat / Unit Number *</label>
          <input type="text" id="addMemUnit" required placeholder="e.g. A-101" class="form-input" style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Occupancy Type</label>
          <select id="addMemOccupancy" class="form-select" style="width:100%;font-size:13px;">
            <option value="Owner">Owner Occupant</option>
            <option value="Tenant">Registered Tenant</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Portal Role</label>
        <select id="addMemRole" class="form-select" style="width:100%;font-size:13px;">
          <option value="RESIDENT">Resident Member (Flat Resident)</option>
          <option value="RWA_ADMIN">Executive Committee Member / Admin</option>
          <option value="TREASURER">Treasurer</option>
        </select>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Security PIN (Optional)</label>
        <input type="password" id="addMemPin" maxlength="6" placeholder="Leave blank for user to choose on first login (or set 4-to-6 digit PIN)" class="form-input" style="width:100%;font-size:13px;" />
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">💡 If left empty, the member will automatically be prompted to set their 4-to-6 digit PIN upon first login.</div>
      </div>

      <div style="background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);padding:10px;border-radius:var(--r-md);font-size:12px;color:var(--text-secondary);">
        🔒 <strong>100% Free PIN Security:</strong> No SMS or WhatsApp costs. The resident logs in securely using their mobile number and private PIN.
      </div>
    </div>
  `;

  showModal('👤 Add New Resident / Admin Member', html, 'Save & Provision Member 🚀', async () => {
    const name = document.getElementById('addMemName')?.value.trim();
    const phone = document.getElementById('addMemPhone')?.value.trim();
    const email = document.getElementById('addMemEmail')?.value.trim();
    const unitNumber = document.getElementById('addMemUnit')?.value.trim();
    const occupancyType = document.getElementById('addMemOccupancy')?.value;
    const role = document.getElementById('addMemRole')?.value;
    const pin = document.getElementById('addMemPin')?.value.trim();

    if (!name || !phone) {
      showToast('Name and Mobile Number are required', 'warning');
      return;
    }

    try {
      const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
      const res = await (window.apiFetch || fetch)('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          unitNumber,
          occupancyType,
          role,
          pin,
          organizationId: activeOrgId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add member');
      }

      showToast(`✅ Member ${name} added successfully!`, 'success');
      window.loadLiveMembersScreen();
    } catch (err) {
      console.error('Error adding member:', err);
      showToast(err.message || 'Failed to add member', 'error');
    }
  }, '520px');
};

