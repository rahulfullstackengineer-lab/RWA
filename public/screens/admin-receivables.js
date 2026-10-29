// =============================================
// Admin External Receivables & Commercial Leases Screen
// Complete Implementation: Leases, Billing, Payments, GST Invoices
// =============================================

window.__receivablesContracts = [];
window.__receivablesFiltered  = [];
window.__receivablesCategoryFilter = 'ALL';
window.__receivablesStatusFilter   = 'ALL';
window.__receivablesSearchQuery    = '';

var RECEIVABLE_CATEGORIES = {
  CELL_TOWER:      { icon: '📡', label: 'Cell Tower Lease',   color: 'blue' },
  COMMERCIAL_SHOP: { icon: '🏪', label: 'Commercial Shop',    color: 'purple' },
  ATM_KIOSK:       { icon: '🏧', label: 'ATM Kiosk',          color: 'teal' },
  EV_CHARGING:     { icon: '⚡', label: 'EV Charging Bay',    color: 'green' },
  EVENT_SPACE:     { icon: '🎉', label: 'Event / Banquet',    color: 'amber' },
  HOARDING:        { icon: '🪧', label: 'Billboard / Banner', color: 'orange' },
};

// Safe modal helper
function openReceivablesModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '540px';
  if (typeof window.showModal === 'function') {
    return window.showModal(title, contentHtml, submitLabel, onSubmit, maxWidth);
  }

  var overlay = document.getElementById('rwaReceivablesModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaReceivablesModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
        '<button type="button" onclick="document.getElementById(\'rwaReceivablesModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<form id="rwaReceivablesForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
        contentHtml +
        '<div style="display:flex;gap:10px;margin-top:8px;">' +
          (submitLabel
            ? '<button type="button" onclick="document.getElementById(\'rwaReceivablesModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
              '<button type="submit" id="rwaRecSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
            : '<button type="button" onclick="document.getElementById(\'rwaReceivablesModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
          ) +
        '</div>' +
      '</form>' +
    '</div>';

  overlay.style.display = 'flex';

  var form = document.getElementById('rwaReceivablesForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById('rwaRecSubBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
      try {
        await onSubmit(form);
        overlay.style.display = 'none';
      } catch (err) {
        if (typeof window.showToast === 'function') window.showToast(err.message || 'Operation failed', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = submitLabel; }
      }
    };
  }
}

// =============================================
// Screen Registration
// =============================================
Screens['admin-receivables'] = function() {
  setTimeout(function() {
    if (typeof window.loadLiveReceivables === 'function') {
      window.loadLiveReceivables();
    }
  }, 20);

  return Shell.render('admin-receivables', {
    title: 'External Receivables',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.exportReceivablesCSV()">📊 Export Registry</button>
      <button class="btn btn-primary btn-sm" onclick="window.openAddCommercialLeaseModal()">+ Add Commercial Lease</button>
    `,
    content: `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">External Receivables &amp; Commercial Leases</div>
          <div class="page-subtitle" id="receivablesSubtitle">Commercial rentals, cell tower leases, ATM kiosks, EV stations &amp; non-member bookings</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.exportReceivablesCSV()">📊 Export to Excel</button>
          <button class="btn btn-primary" onclick="window.openAddCommercialLeaseModal()">+ Add Commercial Lease</button>
        </div>
      </div>

      <!-- Executive KPI Summary Cards -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card green">
          <div class="stat-icon green">💰</div>
          <div class="stat-value" id="recStatMonthly">₹0</div>
          <div class="stat-label">Monthly Commercial Inflow</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;" id="recStatAnnual">Annual: ₹0 / yr</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon blue">🏢</div>
          <div class="stat-value" id="recStatActiveCount">0</div>
          <div class="stat-label">Active Commercial Leases</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;" id="recStatBreakdown">Towers, Retail &amp; Kiosks</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">🛡️</div>
          <div class="stat-value" id="recStatDeposits">₹0</div>
          <div class="stat-label">Security Deposits Held</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Safeguarded in Bank FD</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">⏳</div>
          <div class="stat-value" id="recStatOverdue">₹0</div>
          <div class="stat-label">Overdue / Pending Dues</div>
          <div style="font-size:11px;color:var(--red);font-weight:700;margin-top:4px;" id="recStatOverdueCount">0 accounts pending</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div class="search-box" style="min-width:220px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="recSearchInput" placeholder="Search tenant, asset, agreement #, contact..." oninput="window.handleReceivablesSearch(this.value)" />
        </div>
        <select id="recCategoryFilter" class="form-select" style="min-width:180px;font-size:13px;" onchange="window.handleReceivablesCategoryFilter(this.value)">
          <option value="ALL">All Categories</option>
          <option value="CELL_TOWER">📡 Cell Tower Leases</option>
          <option value="COMMERCIAL_SHOP">🏪 Commercial Retail Shops</option>
          <option value="ATM_KIOSK">🏧 ATM Kiosks</option>
          <option value="EV_CHARGING">⚡ EV Charging Stations</option>
          <option value="EVENT_SPACE">🎉 Event &amp; Banquet Spaces</option>
        </select>
        <select id="recStatusFilter" class="form-select" style="min-width:150px;font-size:13px;" onchange="window.handleReceivablesStatusFilter(this.value)">
          <option value="ALL">All Statuses</option>
          <option value="PAID">✓ Paid (Current)</option>
          <option value="OVERDUE">⚠️ Overdue Only</option>
          <option value="PENDING">⏳ Pending Payment</option>
        </select>
        <button class="btn btn-secondary btn-sm" onclick="window.resetReceivablesFilters()">x Clear</button>
      </div>

      <!-- Quick Filter Pills -->
      <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;" id="recFilterPillsContainer">
        <div class="filter-pill active" onclick="window.setReceivablesCategoryPill('ALL', this)">All Commercial (7)</div>
        <div class="filter-pill" onclick="window.setReceivablesCategoryPill('CELL_TOWER', this)">📡 Cell Towers (2)</div>
        <div class="filter-pill" onclick="window.setReceivablesCategoryPill('COMMERCIAL_SHOP', this)">🏪 Retail Shops (2)</div>
        <div class="filter-pill" onclick="window.setReceivablesCategoryPill('ATM_KIOSK', this)">🏧 ATM Kiosks (1)</div>
        <div class="filter-pill" onclick="window.setReceivablesCategoryPill('EV_CHARGING', this)">⚡ EV Stations (1)</div>
        <div class="filter-pill" onclick="window.setReceivablesCategoryPill('EVENT_SPACE', this)">🎉 Event Spaces (1)</div>
        <div class="filter-pill" style="border-color:rgba(239,68,68,0.3);color:var(--red);" onclick="window.setReceivablesStatusPill('OVERDUE', this)">⚠️ Overdue Dues (1)</div>
      </div>

      <!-- Main Contracts Table Card -->
      <div class="card" style="padding:0;overflow:hidden;">
        <div style="overflow-x:auto;">
          <table class="table" style="min-width:1050px;margin:0;">
            <thead>
              <tr>
                <th style="min-width:260px;">Asset &amp; Commercial Lessee</th>
                <th style="min-width:160px;">Location / Space</th>
                <th style="min-width:180px;">Agreement &amp; Validity</th>
                <th style="min-width:160px;text-align:right;">Rent &amp; Billing Cycle</th>
                <th style="min-width:130px;text-align:center;">Payment Status</th>
                <th style="min-width:160px;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="receivablesTableBody">
              <tr>
                <td colspan="6" style="text-align:center;padding:48px;color:var(--text-muted);">
                  <div style="font-size:32px;margin-bottom:8px;">🏢</div>
                  <div style="font-weight:600;">Connecting to Commercial Registry...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};

// =============================================
// Live Data Fetcher
// =============================================
window.loadLiveReceivables = async function() {
  try {
    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var url = '/api/receivables' + (activeOrgId ? '?orgId=' + encodeURIComponent(activeOrgId) : '');

    var res = await (window.apiFetch || fetch)(url);
    if (!res.ok) throw new Error('API returned ' + res.status);
    var data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch commercial receivables');

    window.__receivablesContracts = data.contracts || [];
    window.updateReceivablesKPICards(data.metrics || {});
    window.applyReceivablesFilters();

    var sub = document.getElementById('receivablesSubtitle');
    if (sub) {
      sub.textContent = 'Active commercial contracts: ' + (data.totalCount || window.__receivablesContracts.length) + ' · ₹' + (data.metrics?.totalMonthlyRevenue || 0).toLocaleString('en-IN') + '/mo non-dues revenue';
    }
  } catch (err) {
    console.warn('Receivables load failed:', err);
    window.__receivablesContracts = [];
    window.updateReceivablesKPICards({
      totalMonthlyRevenue: 0,
      totalAnnualRevenue: 0,
      totalDepositsHeld: 0,
      overdueReceivables: 0,
      activeContractsCount: 0,
      overdueCount: 0,
    });
    window.applyReceivablesFilters();
  }
};

// =============================================
// Update KPI Cards
// =============================================
window.updateReceivablesKPICards = function(m) {
  var elMo = document.getElementById('recStatMonthly');
  var elAn = document.getElementById('recStatAnnual');
  var elCt = document.getElementById('recStatActiveCount');
  var elDp = document.getElementById('recStatDeposits');
  var elOv = document.getElementById('recStatOverdue');
  var elOc = document.getElementById('recStatOverdueCount');

  if (elMo) elMo.textContent = '₹' + Number(m.totalMonthlyRevenue || 0).toLocaleString('en-IN');
  if (elAn) elAn.textContent = 'Annual: ₹' + Number(m.totalAnnualRevenue || 0).toLocaleString('en-IN') + ' / yr';
  if (elCt) elCt.textContent = (m.activeContractsCount || 0) + ' Active';
  if (elDp) elDp.textContent = '₹' + Number(m.totalDepositsHeld || 0).toLocaleString('en-IN');
  if (elOv) {
    var ovAmt = (m.overdueReceivables || 0) + (m.pendingReceivables || 0);
    elOv.textContent = '₹' + ovAmt.toLocaleString('en-IN');
    elOv.style.color = ovAmt > 0 ? 'var(--red)' : 'var(--green)';
  }
  if (elOc) {
    var ovCount = (m.overdueCount || 0) + (m.pendingCount || 0);
    elOc.textContent = ovCount > 0 ? (ovCount + ' accounts pending payout') : '✓ All accounts cleared';
    elOc.style.color = ovCount > 0 ? 'var(--red)' : 'var(--green)';
  }
};

// =============================================
// Filter Application
// =============================================
window.applyReceivablesFilters = function() {
  var list = (window.__receivablesContracts || []).slice();
  var catF = window.__receivablesCategoryFilter || 'ALL';
  var staF = window.__receivablesStatusFilter   || 'ALL';
  var q    = (window.__receivablesSearchQuery   || '').toLowerCase().trim();

  if (catF !== 'ALL') {
    list = list.filter(function(c) { return c.category === catF; });
  }

  if (staF !== 'ALL') {
    list = list.filter(function(c) { return c.paymentStatus === staF; });
  }

  if (q) {
    list = list.filter(function(c) {
      return (c.title           || '').toLowerCase().includes(q) ||
             (c.lesseeName      || '').toLowerCase().includes(q) ||
             (c.contactPerson   || '').toLowerCase().includes(q) ||
             (c.contactPhone    || '').toLowerCase().includes(q) ||
             (c.agreementNumber || '').toLowerCase().includes(q) ||
             (c.unitOrLocation  || '').toLowerCase().includes(q) ||
             (c.gstin           || '').toLowerCase().includes(q);
    });
  }

  window.__receivablesFiltered = list;
  window.renderReceivablesTable(list);
};

// =============================================
// Table Renderer
// =============================================
window.renderReceivablesTable = function(list) {
  var tbody = document.getElementById('receivablesTableBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--text-muted);">' +
        '<div style="font-size:32px;margin-bottom:8px;">🏢</div>' +
        '<div style="font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:4px;">No Commercial Contracts Found</div>' +
        '<div style="font-size:12px;margin-bottom:14px;">Try clearing filters or add your first commercial lease / rooftop antenna.</div>' +
        '<button class="btn btn-primary btn-sm" onclick="window.openAddCommercialLeaseModal()">+ Add Commercial Lease</button>' +
      '</td></tr>';
    return;
  }

  var rowsHtml = list.map(function(c) {
    var catMeta = RECEIVABLE_CATEGORIES[c.category] || { icon: '🏢', label: c.category, color: 'blue' };

    var statusBadge = '';
    if (c.paymentStatus === 'PAID') {
      statusBadge = '<span class="badge badge-green" style="font-size:11px;padding:3px 9px;">✓ Paid (' + (c.lastBilledMonth || 'Current') + ')</span>';
    } else if (c.paymentStatus === 'OVERDUE') {
      statusBadge = '<span class="badge badge-red" style="font-size:11px;padding:3px 9px;animation:pulse 2s infinite;">⚠️ Overdue</span>';
    } else {
      statusBadge = '<span class="badge badge-amber" style="font-size:11px;padding:3px 9px;">⏳ Pending</span>';
    }

    var rentCycleText = c.billingCycle === 'QUARTERLY'
      ? 'Quarterly'
      : (c.billingCycle === 'ANNUAL' ? 'Annual' : (c.billingCycle === 'ONE_TIME' ? 'One-time' : 'Monthly'));

    var validityStr = c.startDate + ' – ' + c.endDate;

    return '<tr style="transition:background 0.12s;" onmouseover="this.style.background=\'var(--bg-elevated)\'" onmouseout="this.style.background=\'\'">' +
      '<td>' +
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<div style="width:38px;height:38px;border-radius:var(--r-md);background:var(--bg-elevated);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">' +
            catMeta.icon +
          '</div>' +
          '<div>' +
            '<div style="font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:2px;">' + c.title + '</div>' +
            '<div style="font-size:12px;color:var(--text-secondary);font-weight:600;">' + c.lesseeName + '</div>' +
            (c.gstin ? '<div style="font-size:10px;font-family:monospace;color:var(--text-muted);margin-top:2px;">GST: ' + c.gstin + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-primary);">' + c.unitOrLocation + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + (c.contactPerson ? c.contactPerson + ' (' + c.contactPhone + ')' : 'Contact on file') + '</div>' +
      '</td>' +
      '<td>' +
        '<div style="font-size:12px;font-family:monospace;color:var(--text-primary);font-weight:700;">' + c.agreementNumber + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + validityStr + '</div>' +
      '</td>' +
      '<td style="text-align:right;">' +
        '<div style="font-weight:800;font-size:14px;color:var(--text-primary);">₹' + c.monthlyRent.toLocaleString('en-IN') + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + rentCycleText + ' · Dep: ₹' + (c.securityDeposit || 0).toLocaleString('en-IN') + '</div>' +
      '</td>' +
      '<td style="text-align:center;">' +
        statusBadge +
        (c.lastPaidDate ? '<div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Recd: ' + c.lastPaidDate + '</div>' : '') +
      '</td>' +
      '<td style="text-align:right;">' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          (c.paymentStatus !== 'PAID'
            ? '<button class="btn btn-success btn-sm" style="font-size:11px;padding:4px 8px;" onclick="window.openRecordCommercialPaymentModal(\'' + c.id + '\')">💳 Pay</button>'
            : '<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px;" onclick="window.printCommercialInvoice(\'' + c.id + '\')">Receipt 🧾</button>'
          ) +
          '<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px;" onclick="window.openCommercialContractDetailsModal(\'' + c.id + '\')" title="View Details">📄</button>' +
          '<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px;" onclick="window.printCommercialInvoice(\'' + c.id + '\')" title="Print GST Invoice">🖨️</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  tbody.innerHTML = rowsHtml;
};

// =============================================
// Filters Handlers
// =============================================
window.handleReceivablesSearch = function(q) {
  window.__receivablesSearchQuery = q;
  window.applyReceivablesFilters();
};

window.handleReceivablesCategoryFilter = function(cat) {
  window.__receivablesCategoryFilter = cat;
  window.applyReceivablesFilters();
};

window.handleReceivablesStatusFilter = function(status) {
  window.__receivablesStatusFilter = status;
  window.applyReceivablesFilters();
};

window.setReceivablesCategoryPill = function(cat, el) {
  window.__receivablesCategoryFilter = cat;
  window.__receivablesStatusFilter   = 'ALL';
  var selCat = document.getElementById('recCategoryFilter'); if (selCat) selCat.value = cat;
  var selSta = document.getElementById('recStatusFilter');   if (selSta) selSta.value = 'ALL';

  document.querySelectorAll('#recFilterPillsContainer .filter-pill').forEach(function(p) {
    p.classList.remove('active');
  });
  if (el) el.classList.add('active');
  window.applyReceivablesFilters();
};

window.setReceivablesStatusPill = function(status, el) {
  window.__receivablesStatusFilter = status;
  var selSta = document.getElementById('recStatusFilter'); if (selSta) selSta.value = status;

  document.querySelectorAll('#recFilterPillsContainer .filter-pill').forEach(function(p) {
    p.classList.remove('active');
  });
  if (el) el.classList.add('active');
  window.applyReceivablesFilters();
};

window.resetReceivablesFilters = function() {
  window.__receivablesSearchQuery    = '';
  window.__receivablesCategoryFilter = 'ALL';
  window.__receivablesStatusFilter   = 'ALL';

  var si = document.getElementById('recSearchInput');      if (si) si.value = '';
  var sc = document.getElementById('recCategoryFilter');  if (sc) sc.value = 'ALL';
  var ss = document.getElementById('recStatusFilter');    if (ss) ss.value = 'ALL';

  document.querySelectorAll('#recFilterPillsContainer .filter-pill').forEach(function(p, i) {
    p.classList.toggle('active', i === 0);
  });

  window.applyReceivablesFilters();
};

// =============================================
// Modal 1: Record Commercial Payment
// =============================================
window.openRecordCommercialPaymentModal = function(contractId) {
  var c = (window.__receivablesContracts || []).find(function(x) { return x.id === contractId; });
  if (!c) return;

  var today = new Date().toISOString().split('T')[0];
  var defaultAmt = c.monthlyRent;

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div>' +
          '<div style="font-weight:700;font-size:14px;color:var(--text-primary);">' + c.title + '</div>' +
          '<div style="font-size:12px;color:var(--text-secondary);">' + c.lesseeName + ' · ' + c.agreementNumber + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Scheduled Rent</div>' +
          '<div style="font-size:16px;font-weight:800;color:var(--green);">₹' + c.monthlyRent.toLocaleString('en-IN') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Amount Received (INR) *</label>' +
          '<input type="number" id="recPayAmount" class="form-input" required value="' + defaultAmt + '" style="width:100%;font-size:14px;font-weight:700;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Payment Date *</label>' +
          '<input type="date" id="recPayDate" class="form-input" required value="' + today + '" style="width:100%;font-size:13px;" />' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Payment Mode *</label>' +
          '<select id="recPayMode" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="NEFT/RTGS" selected>NEFT / RTGS Bank Transfer</option>' +
            '<option value="IMPS/UPI">UPI / Net Banking</option>' +
            '<option value="CHEQUE">Cheque / Demand Draft</option>' +
            '<option value="CASH">Cash Deposit</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Bank Ref / UTR / Cheque # *</label>' +
          '<input type="text" id="recPayRef" class="form-input" required placeholder="e.g. UTR-998201248" value="CMS-NEFT-' + Math.floor(100000 + Math.random() * 900000) + '" style="width:100%;font-size:13px;font-family:monospace;" />' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-weight:700;font-size:12px;">TDS Deducted by Tenant</label>' +
        '<select id="recPayTds" class="form-select" style="width:100%;font-size:13px;">' +
          '<option value="0">0% (Nil TDS)</option>' +
          '<option value="10" selected>10% TDS (Sec 194I — Plant / Commercial Rent)</option>' +
          '<option value="2">2% TDS (Sec 194C — Contractual / Advertisement)</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-weight:700;font-size:12px;">Notes / Remarks</label>' +
        '<input type="text" id="recPayNotes" class="form-input" placeholder="e.g. Cleared for October 2026. Credit confirmed in SBI Society A/c" style="width:100%;font-size:12px;" />' +
      '</div>' +
    '</div>';

  openReceivablesModal('💳 Record Commercial Payment', html, 'Confirm Payment Entry 💳', async function() {
    var amt = parseFloat(document.getElementById('recPayAmount').value);
    var date = document.getElementById('recPayDate').value;
    var ref = document.getElementById('recPayRef').value;
    var notes = document.getElementById('recPayNotes').value;

    if (!amt || isNaN(amt) || amt <= 0) throw new Error('Please enter a valid payment amount');

    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var res = await (window.apiFetch || fetch)('/api/receivables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: c.id,
        paymentStatus: 'PAID',
        lastPaidAmount: amt,
        bankReference: ref,
        notes: notes,
        orgId: activeOrgId,
      }),
    });

    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update payment');

    if (typeof showToast === 'function') {
      showToast('✅ Payment of ₹' + amt.toLocaleString('en-IN') + ' recorded for ' + c.title + '!', 'success');
    }

    await window.loadLiveReceivables();
  }, '520px');
};

// =============================================
// Modal 2: Add New Commercial Lease
// =============================================
window.openAddCommercialLeaseModal = function() {
  var today = new Date().toISOString().split('T')[0];
  var nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 3);
  var nextYear = nextYearDate.toISOString().split('T')[0];

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Asset / Lease Title *</label>' +
          '<input type="text" id="addRecTitle" class="form-input" required placeholder="e.g. Jio 5G Rooftop Antenna" style="width:100%;font-size:13px;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Asset Category *</label>' +
          '<select id="addRecCategory" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="CELL_TOWER">📡 Cell Tower Lease</option>' +
            '<option value="COMMERCIAL_SHOP">🏪 Commercial Retail Shop</option>' +
            '<option value="ATM_KIOSK">🏧 ATM Kiosk</option>' +
            '<option value="EV_CHARGING">⚡ EV Charging Bay</option>' +
            '<option value="EVENT_SPACE">🎉 Event / Banquet Booking</option>' +
            '<option value="HOARDING">🪧 Hoarding / Billboard Advertising</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Lessee Company / Tenant Name *</label>' +
          '<input type="text" id="addRecLessee" class="form-input" required placeholder="e.g. Reliance Jio Infocomm Ltd" style="width:100%;font-size:13px;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Lessee GSTIN (Tax ID)</label>' +
          '<input type="text" id="addRecGstin" class="form-input" placeholder="e.g. 07AAACR1234F1Z1" style="width:100%;font-size:13px;font-family:monospace;" />' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Monthly Rent (INR) *</label>' +
          '<input type="number" id="addRecRent" class="form-input" required placeholder="e.g. 40000" style="width:100%;font-size:14px;font-weight:700;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Security Deposit (INR)</label>' +
          '<input type="number" id="addRecDeposit" class="form-input" placeholder="e.g. 120000" style="width:100%;font-size:14px;" />' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Billing Cycle</label>' +
          '<select id="addRecCycle" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="MONTHLY">Monthly</option>' +
            '<option value="QUARTERLY" selected>Quarterly</option>' +
            '<option value="ANNUAL">Annual</option>' +
            '<option value="ONE_TIME">One-time</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Start Date</label>' +
          '<input type="date" id="addRecStart" class="form-input" value="' + today + '" style="width:100%;font-size:12px;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">End Date</label>' +
          '<input type="date" id="addRecEnd" class="form-input" value="' + nextYear + '" style="width:100%;font-size:12px;" />' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-weight:700;font-size:12px;">Unit / Designated Space Location *</label>' +
        '<input type="text" id="addRecLocation" class="form-input" required placeholder="e.g. Tower B Rooftop / Commercial Shop #3" style="width:100%;font-size:13px;" />' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Contact Person</label>' +
          '<input type="text" id="addRecContact" class="form-input" placeholder="e.g. Rajat Verma" style="width:100%;font-size:13px;" />' +
        '</div>' +
        '<div>' +
          '<label class="form-label" style="font-weight:700;font-size:12px;">Contact Phone / Email</label>' +
          '<input type="text" id="addRecPhone" class="form-input" placeholder="e.g. +91 98110 99887" style="width:100%;font-size:13px;" />' +
        '</div>' +
      '</div>' +
    '</div>';

  openReceivablesModal('+ Register New Commercial Lease', html, 'Save Agreement 📄', async function() {
    var title = document.getElementById('addRecTitle').value;
    var cat = document.getElementById('addRecCategory').value;
    var lessee = document.getElementById('addRecLessee').value;
    var gstin = document.getElementById('addRecGstin').value;
    var rent = parseFloat(document.getElementById('addRecRent').value);
    var deposit = parseFloat(document.getElementById('addRecDeposit').value) || 0;
    var cycle = document.getElementById('addRecCycle').value;
    var start = document.getElementById('addRecStart').value;
    var end = document.getElementById('addRecEnd').value;
    var location = document.getElementById('addRecLocation').value;
    var contact = document.getElementById('addRecContact').value;
    var phone = document.getElementById('addRecPhone').value;

    if (!title || !lessee || isNaN(rent) || rent <= 0) {
      throw new Error('Please fill all required fields with a valid rent amount.');
    }

    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var res = await (window.apiFetch || fetch)('/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        category: cat,
        lesseeName: lessee,
        gstin: gstin,
        monthlyRent: rent,
        securityDeposit: deposit,
        billingCycle: cycle,
        startDate: start,
        endDate: end,
        unitOrLocation: location,
        contactPerson: contact,
        contactPhone: phone,
        orgId: activeOrgId,
      }),
    });

    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save agreement');

    if (typeof showToast === 'function') {
      showToast('✅ Commercial Lease for ' + lessee + ' registered successfully!', 'success');
    }

    await window.loadLiveReceivables();
  }, '560px');
};

// =============================================
// Modal 3: View Contract Details
// =============================================
window.openCommercialContractDetailsModal = function(contractId) {
  var c = (window.__receivablesContracts || []).find(function(x) { return x.id === contractId; });
  if (!c) return;

  var catMeta = RECEIVABLE_CATEGORIES[c.category] || { icon: '🏢', label: c.category };

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;display:flex;gap:14px;align-items:center;">' +
        '<div style="font-size:32px;">' + catMeta.icon + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:16px;font-weight:800;color:var(--text-primary);">' + c.title + '</div>' +
          '<div style="font-size:12px;color:var(--text-secondary);">' + c.lesseeName + ' · ' + (c.gstin ? 'GSTIN: ' + c.gstin : 'Unregistered') + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:18px;font-weight:900;color:var(--green);">₹' + c.monthlyRent.toLocaleString('en-IN') + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">' + c.billingCycle + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">' +
        '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:10px 14px;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;">Agreement Number</div>' +
          '<div style="font-weight:700;font-family:monospace;">' + c.agreementNumber + '</div>' +
        '</div>' +
        '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:10px 14px;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;">Designated Location</div>' +
          '<div style="font-weight:700;">' + c.unitOrLocation + '</div>' +
        '</div>' +
        '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:10px 14px;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;">Agreement Duration</div>' +
          '<div style="font-weight:700;">' + c.startDate + ' to ' + c.endDate + '</div>' +
        '</div>' +
        '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:10px 14px;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;">Security Deposit Held</div>' +
          '<div style="font-weight:800;color:var(--purple);">₹' + (c.securityDeposit || 0).toLocaleString('en-IN') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:12px 14px;">' +
        '<div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Tenant Contact Information</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-primary);">' + (c.contactPerson || 'Authorized Representative') + '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);">' + (c.contactPhone || '—') + ' · ' + (c.contactEmail || '—') + '</div>' +
      '</div>' +
      (c.notes ? '<div style="font-size:12px;color:var(--text-muted);background:rgba(0,0,0,0.02);padding:10px;border-radius:var(--r-md);"><strong>Notes:</strong> ' + c.notes + '</div>' : '') +
      '<div style="display:flex;gap:8px;margin-top:6px;">' +
        '<button type="button" class="btn btn-secondary" style="flex:1;" onclick="document.getElementById(\'rwaReceivablesModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();window.printCommercialInvoice(\'' + c.id + '\')">🖨️ Print Tax Invoice</button>' +
        (c.paymentStatus !== 'PAID'
          ? '<button type="button" class="btn btn-success" style="flex:1;" onclick="document.getElementById(\'rwaReceivablesModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();window.openRecordCommercialPaymentModal(\'' + c.id + '\')">💳 Record Payment</button>'
          : '<button type="button" class="btn btn-secondary" style="flex:1;" onclick="document.getElementById(\'rwaReceivablesModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();">Close</button>'
        ) +
      '</div>' +
    '</div>';

  openReceivablesModal('📄 Agreement Dossier: ' + c.agreementNumber, html, null, null, '560px');
};

// =============================================
// Print Commercial Tax Invoice / Rent Receipt
// =============================================
window.printCommercialInvoice = function(contractId) {
  var c = (window.__receivablesContracts || []).find(function(x) { return x.id === contractId; });
  if (!c) return;

  var orgName = localStorage.getItem('rwa_active_org_name') || 'Greenwood Heights RWA';
  var dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  var invoiceNo = 'COMM-INV-' + (c.agreementNumber ? c.agreementNumber.replace(/[^A-Za-z0-9]/g, '') : '2026') + '-' + new Date().toISOString().slice(2, 7).replace('-', '');

  var rentAmt = c.monthlyRent;
  var cgst = Math.round(rentAmt * 0.09);
  var sgst = Math.round(rentAmt * 0.09);
  var totalBilled = rentAmt + cgst + sgst;

  var win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${orgName} - Commercial Tax Invoice ${invoiceNo}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; font-size: 13px; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .org-name { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .inv-title { font-size: 16px; font-weight: 700; color: #2563eb; }
        .meta { font-size: 12px; color: #64748b; }
        .box-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .info-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-weight: 700; color: #334155; }
        td { border: 1px solid #e2e8f0; padding: 9px 12px; }
        .text-right { text-align: right; }
        .total-row { background: #f8fafc; font-weight: 800; font-size: 13px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 800; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .bank-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 20px 0; }
        .signatures { margin-top: 48px; display: flex; justify-content: space-between; padding-top: 32px; border-top: 1px dashed #cbd5e1; }
        .sig-block { text-align: center; width: 220px; }
        .sig-line { border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 6px; font-weight: 700; font-size: 11px; }
        @media print { body { margin: 15mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="org-name">${orgName}</div>
          <div class="inv-title">COMMERCIAL TAX INVOICE &amp; RENT RECEIPT</div>
          <div class="meta">Society PAN: AABTR9912E · GSTIN: 07AABTR9912E1Z5</div>
          <div class="meta">Designated Commercial Asset Management Registry</div>
        </div>
        <div class="text-right">
          <div style="font-size:14px;font-weight:800;font-family:monospace;color:#0f172a;">${invoiceNo}</div>
          <div class="meta">Invoice Date: ${dateStr}</div>
          <div style="margin-top:6px;">
            ${c.paymentStatus === 'PAID'
              ? '<span class="status-badge">✓ PAYMENT RECEIVED</span>'
              : '<span class="status-badge" style="background:#fef2f2;color:#991b1b;border-color:#fecaca;">⚠️ PAYMENT OVERDUE</span>'
            }
          </div>
        </div>
      </div>

      <div class="box-grid">
        <div class="info-box">
          <div class="info-title">Billed To (Commercial Lessee)</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;">${c.lesseeName}</div>
          <div class="meta">Attn: ${c.contactPerson || 'Account Officer'}</div>
          <div class="meta">Phone: ${c.contactPhone || '—'} · Email: ${c.contactEmail || '—'}</div>
          <div style="font-family:monospace;font-size:11px;margin-top:4px;color:#334155;">GSTIN: ${c.gstin || 'Unregistered Commercial Tenant'}</div>
        </div>
        <div class="info-box">
          <div class="info-title">Commercial Agreement Details</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;">${c.title}</div>
          <div class="meta">Designated Site: ${c.unitOrLocation}</div>
          <div class="meta">Agreement Ref: ${c.agreementNumber}</div>
          <div class="meta">Agreement Term: ${c.startDate} to ${c.endDate}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:50px;">#</th>
            <th>Description of Commercial Service / Lease</th>
            <th style="width:100px;">SAC Code</th>
            <th class="text-right" style="width:140px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>Commercial Lease Rent — ${c.unitOrLocation}</strong>
              <div class="meta">Period: ${c.lastBilledMonth || 'Current Billing Cycle'} (${c.billingCycle})</div>
            </td>
            <td>997212</td>
            <td class="text-right">₹${rentAmt.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>2</td>
            <td>CGST on Commercial Lease (9.0%)</td>
            <td>—</td>
            <td class="text-right">₹${cgst.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td>3</td>
            <td>SGST on Commercial Lease (9.0%)</td>
            <td>—</td>
            <td class="text-right">₹${sgst.toLocaleString('en-IN')}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">Total Commercial Invoice Amount</td>
            <td class="text-right" style="color:#2563eb;font-size:15px;">₹${totalBilled.toLocaleString('en-IN')}</td>
          </tr>
          ${c.lastPaidDate ? `
            <tr style="background:#f0fdf4;font-weight:700;">
              <td colspan="3" style="color:#065f46;">Amount Received (${c.bankReference || 'Bank Transfer'}) on ${c.lastPaidDate}</td>
              <td class="text-right" style="color:#065f46;">₹${(c.lastPaidAmount || rentAmt).toLocaleString('en-IN')}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>

      <div class="bank-box">
        <div style="font-weight:800;font-size:12px;color:#166534;margin-bottom:4px;">NEFT / RTGS REMITTANCE INSTRUCTIONS</div>
        <div style="font-size:12px;color:#166534;display:flex;gap:24px;">
          <div><strong>Beneficiary:</strong> ${orgName}</div>
          <div><strong>Bank:</strong> State Bank of India (Main Branch)</div>
          <div><strong>A/C No:</strong> 40991823401</div>
          <div><strong>IFSC:</strong> SBIN0001824</div>
        </div>
      </div>

      <div class="signatures">
        <div class="sig-block"><div class="sig-line">Estate Manager / Secretary</div></div>
        <div class="sig-block"><div class="sig-line">Treasurer / Signatory</div></div>
        <div class="sig-block"><div class="sig-line">Lessee Acknowledgement</div></div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(function() { win.print(); }, 400);
};

// =============================================
// Export CSV
// =============================================
window.exportReceivablesCSV = function() {
  var list = window.__receivablesFiltered || window.__receivablesContracts || [];
  if (!list.length) {
    if (typeof showToast === 'function') showToast('No commercial contracts to export', 'warning');
    return;
  }

  var headers = ['ID','Title','Category','Lessee Name','GSTIN','Monthly Rent (INR)','Cycle','Security Deposit','Agreement #','Location','Status','Last Paid Date','Bank Ref'];
  var rows = list.map(function(c) {
    return [
      c.id,
      '"' + (c.title || '').replace(/"/g, '""') + '"',
      c.category,
      '"' + (c.lesseeName || '').replace(/"/g, '""') + '"',
      c.gstin || '',
      c.monthlyRent,
      c.billingCycle,
      c.securityDeposit || 0,
      c.agreementNumber,
      '"' + (c.unitOrLocation || '').replace(/"/g, '""') + '"',
      c.paymentStatus,
      c.lastPaidDate || '',
      c.bankReference || '',
    ].join(',');
  });

  var csvContent = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  var orgName = (localStorage.getItem('rwa_active_org_name') || 'Society').replace(/\s+/g, '_');
  var today   = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = orgName + '_Commercial_Receivables_' + today + '.csv';
  link.click();
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') {
    showToast('Commercial Receivables registry exported: ' + list.length + ' records', 'success');
  }
};

// =============================================
// Fallback Dataset
// =============================================
window.getFallbackContracts = function() {
  return [];
};

// Socket real-time synchronization
if (typeof window !== 'undefined' && window.socket) {
  window.socket.on('commercial-payment-updated', function() {
    if (typeof window.loadLiveReceivables === 'function') window.loadLiveReceivables();
  });
  window.socket.on('new-commercial-lease', function() {
    if (typeof window.loadLiveReceivables === 'function') window.loadLiveReceivables();
  });
}

