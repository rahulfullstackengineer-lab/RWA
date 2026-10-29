// ============================================================
// RWA ADMIN - VISITOR ENTRY PASSES MANAGEMENT SCREEN
// ============================================================

window.Screens = window.Screens || {};

Screens['admin-entry-passes'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveAdminEntryPasses === 'function') {
      window.loadLiveAdminEntryPasses();
    }
  }, 50);

  const actionsHtml = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveAdminEntryPasses()" style="display:inline-flex;align-items:center;gap:6px;font-weight:700;">
        <span>🔄</span>
        <span>Refresh Roster</span>
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.openAdminCreateEntryPassModal()" style="display:inline-flex;align-items:center;gap:6px;font-weight:700;background:linear-gradient(135deg,#3B82F6,#1D4ED8);box-shadow:0 2px 10px rgba(59,130,246,0.3);border:none;">
        <span>+ Issue Visitor Pass</span>
      </button>
    </div>
  `;

  const contentHtml = `
    <div style="display:flex;flex-direction:column;gap:20px;">
      
      <!-- Top Banner / Summary Card -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%);color:#fff;border-radius:18px;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;box-shadow:0 10px 25px -5px rgba(15,23,42,0.18);border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:54px;height:54px;border-radius:14px;background:rgba(59,130,246,0.18);border:1px solid rgba(59,130,246,0.35);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">
            🎫
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h2 style="font-size:18px;font-weight:800;margin:0;color:#F8FAFC;">Campus Visitor &amp; Gate Entry Passes</h2>
              <span style="background:#10B981;color:#fff;font-size:11px;font-weight:800;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:0.5px;">Live Sync</span>
            </div>
            <p style="margin:4px 0 0 0;font-size:13px;color:#94A3B8;max-width:680px;line-height:1.45;">
              Centralized security gate pass registry. Passes created by residents or admin are broadcasted instantly to Security Guards at all gates and can be verified via Pass Code, QR or 4-digit PIN.
            </p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-sm" onclick="Router.go('staff-dashboard')" style="background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:10px;font-weight:700;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;">
            <span>👮</span>
            <span>Open Guard Portal →</span>
          </button>
        </div>
      </div>

      <!-- 5 Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;">
        <div class="stat-card" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary,#64748B);font-size:12px;font-weight:700;text-transform:uppercase;">
            <span>Active Today</span>
            <span style="font-size:18px;">🎫</span>
          </div>
          <div id="statPassesActiveToday" style="font-size:24px;font-weight:800;color:var(--text-primary,#0F172A);">--</div>
          <div style="font-size:11.5px;color:#10B981;font-weight:600;">Valid on campus today</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary,#64748B);font-size:12px;font-weight:700;text-transform:uppercase;">
            <span>Currently Inside</span>
            <span style="font-size:18px;">🟢</span>
          </div>
          <div id="statPassesCheckedIn" style="font-size:24px;font-weight:800;color:#10B981;">--</div>
          <div style="font-size:11.5px;color:var(--text-secondary,#64748B);font-weight:600;">Checked in through gates</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary,#64748B);font-size:12px;font-weight:700;text-transform:uppercase;">
            <span>Pre-Approved</span>
            <span style="font-size:18px;">🔵</span>
          </div>
          <div id="statPassesPreApproved" style="font-size:24px;font-weight:800;color:#3B82F6;">--</div>
          <div style="font-size:11.5px;color:var(--text-secondary,#64748B);font-weight:600;">Expected arrivals</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary,#64748B);font-size:12px;font-weight:700;text-transform:uppercase;">
            <span>Checked Out</span>
            <span style="font-size:18px;">🚪</span>
          </div>
          <div id="statPassesCheckedOut" style="font-size:24px;font-weight:800;color:#64748B;">--</div>
          <div style="font-size:11.5px;color:var(--text-secondary,#64748B);font-weight:600;">Departed society</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;color:var(--text-secondary,#64748B);font-size:12px;font-weight:700;text-transform:uppercase;">
            <span>Deliveries &amp; Cabs</span>
            <span style="font-size:18px;">🛵</span>
          </div>
          <div id="statPassesDeliveries" style="font-size:24px;font-weight:800;color:#F59E0B;">--</div>
          <div style="font-size:11.5px;color:var(--text-secondary,#64748B);font-weight:600;">Zomato, Swiggy, Uber, etc.</div>
        </div>
      </div>

      <!-- Controls: Category Filter Tabs, Gate Selector, Search -->
      <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <!-- Filter Tabs -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="adminPassesCategoryTabs">
          <button class="btn btn-sm btn-primary" onclick="window.filterAdminPasses('ALL', this)" style="border-radius:8px;font-size:12px;font-weight:700;">All Passes</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('CHECKED_IN', this)" style="border-radius:8px;font-size:12px;font-weight:700;">🟢 Inside Now</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('APPROVED', this)" style="border-radius:8px;font-size:12px;font-weight:700;">🔵 Expected</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('CHECKED_OUT', this)" style="border-radius:8px;font-size:12px;font-weight:700;">⚪ Checked Out</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('GUEST', this)" style="border-radius:8px;font-size:12px;font-weight:700;">👥 Guests</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('DELIVERY', this)" style="border-radius:8px;font-size:12px;font-weight:700;">📦 Deliveries</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterAdminPasses('SERVICE', this)" style="border-radius:8px;font-size:12px;font-weight:700;">🔧 Services</button>
        </div>

        <!-- Right Side: Gate Dropdown & Search -->
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <select id="adminPassesGateSelect" onchange="window.filterAdminPassesGate(this.value)" style="padding:7px 12px;border-radius:8px;border:1px solid var(--border,#CBD5E1);font-size:12.5px;font-weight:600;background:var(--bg-surface,#fff);color:var(--text-primary,#0F172A);">
            <option value="ALL">All Gates</option>
            <option value="Gate 1">Gate 1 - Main Gate</option>
            <option value="Gate 2">Gate 2 - Service Gate</option>
            <option value="Gate 3">Gate 3 - Rear Gate</option>
          </select>

          <div style="position:relative;width:240px;">
            <input
              type="text"
              id="adminPassesSearchInput"
              placeholder="Search code, visitor, flat..."
              oninput="window.searchAdminPasses(this.value)"
              style="width:100%;padding:7px 12px 7px 32px;border-radius:8px;border:1px solid var(--border,#CBD5E1);font-size:12.5px;background:var(--bg-surface,#fff);color:var(--text-primary,#0F172A);"
            />
            <span style="position:absolute;left:10px;top:7px;font-size:13px;color:var(--text-secondary,#94A3B8);">🔍</span>
          </div>
        </div>
      </div>

      <!-- Main Passes Table Card -->
      <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
        <div style="overflow-x:auto;">
          <table class="table" style="width:100%;border-collapse:collapse;margin:0;font-size:13px;">
            <thead>
              <tr style="background:#F8FAFC;border-bottom:1px solid var(--border,#E2E8F0);text-align:left;color:var(--text-secondary,#64748B);font-size:11.5px;text-transform:uppercase;letter-spacing:0.4px;">
                <th style="padding:12px 16px;">Pass ID &amp; PIN</th>
                <th style="padding:12px 16px;">Visitor Details</th>
                <th style="padding:12px 16px;">Host Flat &amp; Resident</th>
                <th style="padding:12px 16px;">Gate &amp; Vehicle</th>
                <th style="padding:12px 16px;">Status</th>
                <th style="padding:12px 16px;">Check-In / Out Log</th>
                <th style="padding:12px 16px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="adminPassesTableBody">
              <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary,#94A3B8);">
                  <div style="font-size:24px;margin-bottom:8px;">⏳</div>
                  <div>Loading live society entry passes...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  return Shell.render('admin-entry-passes', {
    title: 'Visitor Entry Passes',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: actionsHtml,
    content: contentHtml,
  });
};

// ============================================================
// DATA STATE & CLIENT-SIDE LOGIC
// ============================================================

window.__adminPassesCache = [];
window.__adminPassesFiltered = [];
window.__adminPassesActiveCategory = 'ALL';
window.__adminPassesActiveGate = 'ALL';
window.__adminPassesSearchTerm = '';

window.loadLiveAdminEntryPasses = async function() {
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes') : fetch('/api/entry-passes'));
    const data = await res.json();

    if (data.success && Array.isArray(data.passes)) {
      window.__adminPassesCache = data.passes;
      
      // Update stats
      const stats = data.stats || {};
      const elActive = document.getElementById('statPassesActiveToday');
      const elIn = document.getElementById('statPassesCheckedIn');
      const elPre = document.getElementById('statPassesPreApproved');
      const elOut = document.getElementById('statPassesCheckedOut');
      const elDel = document.getElementById('statPassesDeliveries');

      if (elActive) elActive.textContent = stats.activeToday ?? 0;
      if (elIn) elIn.textContent = stats.checkedInNow ?? 0;
      if (elPre) elPre.textContent = stats.preApproved ?? 0;
      if (elOut) elOut.textContent = stats.checkedOutToday ?? 0;
      if (elDel) elDel.textContent = (stats.deliveries || 0) + (stats.cabs || 0);

      window.applyAdminPassesFilters();
    }
  } catch (err) {
    console.error('Failed to load admin entry passes:', err);
    const tbody = document.getElementById('adminPassesTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:30px;color:#EF4444;">
            ⚠️ Could not load entry passes. Please check your connection and click Refresh.
          </td>
        </tr>
      `;
    }
  }
};

window.applyAdminPassesFilters = function() {
  let list = [...(window.__adminPassesCache || [])];

  const cat = window.__adminPassesActiveCategory;
  if (cat === 'CHECKED_IN' || cat === 'APPROVED' || cat === 'CHECKED_OUT') {
    list = list.filter(p => p.status === cat);
  } else if (cat === 'GUEST' || cat === 'DELIVERY' || cat === 'SERVICE' || cat === 'CAB') {
    list = list.filter(p => p.visitorType === cat);
  }

  const gate = window.__adminPassesActiveGate;
  if (gate && gate !== 'ALL') {
    list = list.filter(p => (p.gateNumber || '').toLowerCase().includes(gate.toLowerCase()));
  }

  const search = (window.__adminPassesSearchTerm || '').trim().toLowerCase();
  if (search) {
    list = list.filter(p => 
      (p.passCode || '').toLowerCase().includes(search) ||
      (p.otpPin || '').toLowerCase().includes(search) ||
      (p.visitorName || '').toLowerCase().includes(search) ||
      (p.visitorPhone || '').toLowerCase().includes(search) ||
      (p.residentName || '').toLowerCase().includes(search) ||
      (p.residentUnit || '').toLowerCase().includes(search) ||
      (p.vehicleNumber || '').toLowerCase().includes(search)
    );
  }

  window.__adminPassesFiltered = list;
  window.renderAdminPassesTable(list);
};

window.filterAdminPasses = function(category, btnEl) {
  window.__adminPassesActiveCategory = category;
  const container = document.getElementById('adminPassesCategoryTabs');
  if (container) {
    const btns = container.querySelectorAll('button');
    btns.forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
  }
  if (btnEl) {
    btnEl.classList.remove('btn-secondary');
    btnEl.classList.add('btn-primary');
  }
  window.applyAdminPassesFilters();
};

window.filterAdminPassesGate = function(gate) {
  window.__adminPassesActiveGate = gate;
  window.applyAdminPassesFilters();
};

window.searchAdminPasses = function(term) {
  window.__adminPassesSearchTerm = term;
  window.applyAdminPassesFilters();
};

window.renderAdminPassesTable = function(passes) {
  const tbody = document.getElementById('adminPassesTableBody');
  if (!tbody) return;

  if (!passes || passes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary,#94A3B8);">
          <div style="font-size:32px;margin-bottom:8px;">🔍</div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary,#0F172A);">No visiting passes found</div>
          <div style="font-size:12px;margin-top:4px;">No passes match the selected category or search filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = passes.map(p => {
    // Visitor Type Pill
    const typeColors = {
      GUEST: 'background:rgba(59,130,246,0.12);color:#2563EB;border:1px solid rgba(59,130,246,0.25);',
      DELIVERY: 'background:rgba(245,158,11,0.12);color:#D97706;border:1px solid rgba(245,158,11,0.25);',
      CAB: 'background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.25);',
      SERVICE: 'background:rgba(139,92,246,0.12);color:#7C3AED;border:1px solid rgba(139,92,246,0.25);',
      FAMILY: 'background:rgba(236,72,153,0.12);color:#DB2777;border:1px solid rgba(236,72,153,0.25);',
    };
    const pillStyle = typeColors[p.visitorType] || typeColors.GUEST;

    // Status Badge
    let statusBadge = '';
    if (p.status === 'CHECKED_IN') {
      statusBadge = `<span style="background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.3);padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">🟢 Inside Campus</span>`;
    } else if (p.status === 'APPROVED') {
      statusBadge = `<span style="background:rgba(59,130,246,0.12);color:#2563EB;border:1px solid rgba(59,130,246,0.3);padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">🔵 Pre-Approved</span>`;
    } else if (p.status === 'CHECKED_OUT') {
      statusBadge = `<span style="background:rgba(100,116,139,0.12);color:#475569;border:1px solid rgba(100,116,139,0.25);padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">⚪ Checked Out</span>`;
    } else {
      statusBadge = `<span style="background:rgba(239,68,68,0.12);color:#DC2626;border:1px solid rgba(239,68,68,0.3);padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700;">❌ ${p.status}</span>`;
    }

    // Time log display
    let timeLog = '<span style="color:#94A3B8;font-size:11.5px;">Pending entry</span>';
    if (p.checkedInAt) {
      const inTime = new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeLog = `<div style="font-size:11.5px;color:#059669;font-weight:600;">In: ${inTime} (${p.checkedInBy || 'Gate Guard'})</div>`;
      if (p.checkedOutAt) {
        const outTime = new Date(p.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeLog += `<div style="font-size:11px;color:#64748B;">Out: ${outTime} (${p.checkedOutBy || 'Guard'})</div>`;
      }
    }

    return `
      <tr style="border-bottom:1px solid var(--border,#F1F5F9);transition:background 0.15s ease;">
        <td style="padding:14px 16px;">
          <div style="font-weight:800;color:#0F172A;font-family:monospace;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${p.passCode}</span>
          </div>
          <div style="font-size:11px;color:#64748B;margin-top:2px;font-weight:700;">
            PIN: <span style="background:#F1F5F9;padding:1px 5px;border-radius:4px;color:#0F172A;letter-spacing:1px;">${p.otpPin || '----'}</span>
          </div>
        </td>

        <td style="padding:14px 16px;">
          <div style="font-weight:700;color:var(--text-primary,#0F172A);">${p.visitorName}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:6px;${pillStyle}">${p.visitorType}</span>
            <span style="font-size:11.5px;color:#64748B;">📞 ${p.visitorPhone || 'N/A'}</span>
          </div>
          ${p.purpose ? `<div style="font-size:11px;color:#64748B;margin-top:3px;font-style:italic;">"${p.purpose}"</div>` : ''}
        </td>

        <td style="padding:14px 16px;">
          <div style="font-weight:800;color:#2563EB;">🏠 Flat ${p.residentUnit}</div>
          <div style="font-size:12px;color:var(--text-primary,#0F172A);margin-top:2px;">${p.residentName || 'Resident'}</div>
          ${p.residentPhone ? `<div style="font-size:11px;color:#64748B;">📞 ${p.residentPhone}</div>` : ''}
        </td>

        <td style="padding:14px 16px;">
          <div style="font-weight:600;font-size:12px;color:var(--text-primary,#0F172A);">🚪 ${p.gateNumber || 'Gate 1'}</div>
          <div style="font-size:11.5px;color:#64748B;margin-top:2px;">
            ${p.vehicleNumber ? `🚗 <span style="font-weight:700;">${p.vehicleNumber}</span>` : '🚶 Pedestrian'}
          </div>
        </td>

        <td style="padding:14px 16px;">
          ${statusBadge}
        </td>

        <td style="padding:14px 16px;">
          ${timeLog}
        </td>

        <td style="padding:14px 16px;text-align:right;">
          <div style="display:inline-flex;align-items:center;gap:6px;">
            <button class="btn btn-sm btn-ghost" onclick='window.openDigitalPassCardModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' title="View &amp; Share Digital Pass" style="padding:5px 9px;font-size:12px;">
              <span>👁️ Card</span>
            </button>
            ${p.status === 'APPROVED' ? `
              <button class="btn btn-sm btn-success" onclick="window.checkInPass('${p.id}')" style="padding:5px 9px;font-size:11.5px;font-weight:700;background:#10B981;color:#fff;border:none;border-radius:6px;">
                <span>✅ Check In</span>
              </button>
            ` : ''}
            ${p.status === 'CHECKED_IN' ? `
              <button class="btn btn-sm btn-warning" onclick="window.checkOutPass('${p.id}')" style="padding:5px 9px;font-size:11.5px;font-weight:700;background:#F59E0B;color:#0F172A;border:none;border-radius:6px;">
                <span>🚪 Check Out</span>
              </button>
            ` : ''}
            ${p.status !== 'CANCELLED' && p.status !== 'CHECKED_OUT' ? `
              <button class="btn btn-sm btn-ghost" onclick="window.cancelPass('${p.id}')" title="Revoke Pass" style="padding:5px 8px;font-size:12px;color:#EF4444;">
                <span>✕</span>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

// Quick action: Check in
window.checkInPass = async function(id) {
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'check_in', guardName: 'Admin Desk' }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'check_in', guardName: 'Admin Desk' }),
    }));

    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast(data.message || 'Visitor Checked In', 'success');
      window.loadLiveAdminEntryPasses();
    } else {
      if (typeof showToast === 'function') showToast(data.error || 'Failed to check in', 'error');
    }
  } catch (e) {
    console.error(e);
  }
};

// Quick action: Check out
window.checkOutPass = async function(id) {
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'check_out', guardName: 'Admin Desk' }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'check_out', guardName: 'Admin Desk' }),
    }));

    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast(data.message || 'Visitor Checked Out', 'info');
      window.loadLiveAdminEntryPasses();
    } else {
      if (typeof showToast === 'function') showToast(data.error || 'Failed to check out', 'error');
    }
  } catch (e) {
    console.error(e);
  }
};

// Quick action: Cancel pass
window.cancelPass = async function(id) {
  if (!confirm('Are you sure you want to revoke/cancel this visiting pass?')) return;
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'cancel' }),
    }));

    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Pass revoked successfully', 'warning');
      window.loadLiveAdminEntryPasses();
    }
  } catch (e) {
    console.error(e);
  }
};

// ============================================================
// DIGITAL PASS CARD MODAL & WHATSAPP SHARING
// ============================================================

window.openDigitalPassCardModal = function(p) {
  if (!p) return;

  const validUntilStr = p.validUntil ? new Date(p.validUntil).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Valid Today';
  const shareText = encodeURIComponent(
    `🎫 *CUTORA SOCIETY ENTRY PASS*\n` +
    `--------------------------------\n` +
    `Visitor: ${p.visitorName}\n` +
    `Visiting Flat: ${p.residentUnit} (${p.residentName || 'Resident'})\n` +
    `Gate Code: *${p.passCode}*\n` +
    `Security PIN: *${p.otpPin}*\n` +
    `Designated Gate: ${p.gateNumber || 'Gate 1'}\n` +
    `Validity: ${validUntilStr}\n` +
    `--------------------------------\n` +
    `Please show this pass or provide PIN ${p.otpPin} to the security guard at the gate for fast verified entry.`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      
      <!-- Pass Card Mockup -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%);color:#fff;border-radius:18px;padding:24px;border:2px solid #3B82F6;box-shadow:0 15px 35px -5px rgba(15,23,42,0.4);position:relative;overflow:hidden;">
        <!-- Watermark / Background Accent -->
        <div style="position:absolute;right:-20px;bottom:-20px;font-size:120px;opacity:0.04;pointer-events:none;">🛡️</div>

        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed rgba(255,255,255,0.2);padding-bottom:14px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">🏛️</span>
            <div>
              <div style="font-size:14px;font-weight:800;color:#F8FAFC;letter-spacing:0.5px;">CUTORA SOCIETY ENTRY PASS</div>
              <div style="font-size:11px;color:#94A3B8;">Authorized Visitor &amp; Gate Access Token</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;text-transform:uppercase;color:#94A3B8;font-weight:700;">Status</div>
            <div style="font-size:12px;font-weight:800;color:#10B981;">${p.status || 'APPROVED'}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;">
          <div>
            <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Visitor Name</div>
            <div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px;">${p.visitorName}</div>
            <div style="font-size:12px;color:#38BDF8;font-weight:600;margin-top:2px;">
              ${p.visitorType} · 📞 ${p.visitorPhone || 'N/A'}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
              <div>
                <div style="font-size:10.5px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Destination Flat</div>
                <div style="font-size:15px;font-weight:800;color:#F59E0B;margin-top:2px;">🏠 Flat ${p.residentUnit}</div>
                <div style="font-size:11px;color:#CBD5E1;">${p.residentName || 'Host Resident'}</div>
              </div>

              <div>
                <div style="font-size:10.5px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Authorized Gate</div>
                <div style="font-size:13px;font-weight:700;color:#fff;margin-top:2px;">🚪 ${p.gateNumber || 'Gate 1'}</div>
                <div style="font-size:11px;color:#CBD5E1;">${p.vehicleNumber ? '🚗 ' + p.vehicleNumber : '🚶 Pedestrian'}</div>
              </div>
            </div>
          </div>

          <!-- QR / PIN Box -->
          <div style="background:#fff;border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0F172A;min-width:120px;box-shadow:0 6px 16px rgba(0,0,0,0.2);">
            <!-- QR Pattern SVG -->
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <rect x="10" y="10" width="30" height="30" fill="#0F172A" />
              <rect x="16" y="16" width="18" height="18" fill="white" />
              <rect x="20" y="20" width="10" height="10" fill="#0F172A" />
              <rect x="60" y="10" width="30" height="30" fill="#0F172A" />
              <rect x="66" y="16" width="18" height="18" fill="white" />
              <rect x="70" y="20" width="10" height="10" fill="#0F172A" />
              <rect x="10" y="60" width="30" height="30" fill="#0F172A" />
              <rect x="16" y="66" width="18" height="18" fill="white" />
              <rect x="20" y="70" width="10" height="10" fill="#0F172A" />
              <rect x="50" y="45" width="10" height="10" fill="#0F172A" />
              <rect x="65" y="60" width="15" height="10" fill="#0F172A" />
              <rect x="80" y="75" width="10" height="15" fill="#0F172A" />
              <rect x="50" y="70" width="10" height="20" fill="#0F172A" />
            </svg>
            <div style="font-size:10px;font-weight:800;color:#64748B;margin-top:4px;text-transform:uppercase;">Security PIN</div>
            <div style="font-size:18px;font-weight:900;color:#1E293B;letter-spacing:2px;font-family:monospace;">${p.otpPin || '4821'}</div>
          </div>
        </div>

        <div style="margin-top:16px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94A3B8;">
          <div>Pass ID: <span style="font-family:monospace;font-weight:700;color:#fff;">${p.passCode}</span></div>
          <div>Valid until: <span style="color:#fff;font-weight:600;">${validUntilStr}</span></div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Close</button>
        <button class="btn btn-sm" onclick="
          navigator.clipboard.writeText('Cutora Visiting Pass for Flat ${p.residentUnit} | Code: ${p.passCode} | PIN: ${p.otpPin} | Gate: ${p.gateNumber || 'Gate 1'}');
          if (typeof showToast === 'function') showToast('Pass details copied to clipboard!', 'success');
        " style="background:#F1F5F9;color:#0F172A;font-weight:700;border:1px solid #CBD5E1;">
          📋 Copy Pass Text
        </button>
        <a href="${whatsappUrl}" target="_blank" class="btn btn-sm" style="background:#25D366;color:#fff;font-weight:700;display:inline-flex;align-items:center;gap:6px;border:none;padding:8px 16px;text-decoration:none;border-radius:var(--r-md);">
          <span>💬</span>
          <span>Share on WhatsApp</span>
        </a>
      </div>

    </div>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '🎫 Digital Visitor Entry Pass',
      body: modalHtml,
    });
  }
};

// Modal for Creating an Entry Pass
window.openAdminCreateEntryPassModal = function() {
  const modalHtml = `
    <form id="adminCreatePassForm" onsubmit="window.handleAdminCreatePassSubmit(event)" style="display:flex;flex-direction:column;gap:14px;">
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Full Name *</label>
          <input type="text" id="passVisitorName" required class="form-control" placeholder="e.g. Ramesh Chandra" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Mobile Number</label>
          <input type="tel" id="passVisitorPhone" class="form-control" placeholder="e.g. 9812345678" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Category *</label>
          <select id="passVisitorType" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="GUEST">👥 Guest / Relative</option>
            <option value="DELIVERY">📦 Delivery (Zomato/Swiggy/Amazon)</option>
            <option value="CAB">🚖 Cab / Taxi (Uber/Ola)</option>
            <option value="SERVICE">🔧 Home Service / Repair Tech</option>
            <option value="FAMILY">👨‍👩‍👧 Family Member</option>
            <option value="OTHER">📁 Other Visitor</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Vehicle Number (Optional)</label>
          <input type="text" id="passVehicleNumber" class="form-control" placeholder="e.g. CH 01 AB 1234" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Host Flat / Unit Number *</label>
          <input type="text" id="passResidentUnit" required class="form-control" placeholder="e.g. A-402" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Host Resident Name</label>
          <input type="text" id="passResidentName" class="form-control" placeholder="e.g. Dr. Vikram Malhotra" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Designated Gate *</label>
          <select id="passGateNumber" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="Gate 1 - Main Gate">Gate 1 - Main Gate</option>
            <option value="Gate 2 - Service Gate">Gate 2 - Service Gate</option>
            <option value="Gate 3 - Rear Gate">Gate 3 - Rear Gate</option>
            <option value="All Gates">All Campus Gates</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Pass Validity</label>
          <select id="passValidHours" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="4">4 Hours (Quick Visit)</option>
            <option value="8">8 Hours (Half Day)</option>
            <option value="12" selected>12 Hours (Standard)</option>
            <option value="24">24 Hours (Full Day)</option>
            <option value="72">3 Days (Extended Stay)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Purpose / Notes</label>
        <input type="text" id="passPurpose" class="form-control" placeholder="e.g. Attending birthday party, AC servicing" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
      </div>

      <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.25);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">📢</span>
        <div style="font-size:12px;color:var(--text-secondary,#64748B);">
          When issued, this pass generates a <strong>unique Pass Code &amp; 4-digit PIN</strong> and broadcasts notifications to both resident and gate security guards.
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm" style="font-weight:700;background:linear-gradient(135deg,#3B82F6,#1D4ED8);border:none;">
          🎫 Issue &amp; Generate Pass
        </button>
      </div>

    </form>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '🎫 Issue Campus Visitor Entry Pass',
      body: modalHtml,
    });
  }
};

window.handleAdminCreatePassSubmit = async function(e) {
  e.preventDefault();
  const visitorName = document.getElementById('passVisitorName')?.value;
  const visitorPhone = document.getElementById('passVisitorPhone')?.value;
  const visitorType = document.getElementById('passVisitorType')?.value;
  const vehicleNumber = document.getElementById('passVehicleNumber')?.value;
  const residentUnit = document.getElementById('passResidentUnit')?.value;
  const residentName = document.getElementById('passResidentName')?.value;
  const gateNumber = document.getElementById('passGateNumber')?.value;
  const validHours = document.getElementById('passValidHours')?.value;
  const purpose = document.getElementById('passPurpose')?.value;

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
        gateNumber,
        validHours,
        purpose,
      }),
    }));

    const data = await res.json();
    if (data.success && data.pass) {
      if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
      if (typeof showToast === 'function') showToast(`Pass ${data.pass.passCode} generated successfully!`, 'success');
      window.loadLiveAdminEntryPasses();
      setTimeout(() => {
        window.openDigitalPassCardModal(data.pass);
      }, 300);
    } else {
      alert(data.error || 'Failed to create entry pass');
    }
  } catch (err) {
    console.error('Error creating pass:', err);
    alert('Failed to connect to server');
  }
};
