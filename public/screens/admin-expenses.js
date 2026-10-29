// =============================================
// Admin Expenses Screen — Full Live Implementation
// Approval Workflow, Category Breakdown, DB Hydration
// =============================================

window.__expensesAll          = [];
window.__expensesFiltered     = [];
window.__expensesStatusFilter = 'ALL';
window.__expensesCatFilter    = 'ALL';
window.__expensesSearchQ      = '';

var EXPENSE_CATEGORIES = [
  'Security', 'Maintenance', 'Plumbing', 'Electrical', 'Housekeeping',
  'Horticulture', 'Admin', 'Utilities', 'Lift AMC', 'CCTV & Security Tech',
  'Water Supply', 'Repairs', 'Event', 'Other',
];

var EXPENSE_STATUS_MAP = {
  PENDING_APPROVAL: { color: 'amber', label: 'Pending Approval' },
  APPROVED:         { color: 'blue',  label: 'Approved' },
  PAID:             { color: 'green', label: 'Paid' },
  REJECTED:         { color: 'red',   label: 'Rejected' },
  DRAFT:            { color: 'muted', label: 'Draft' },
};

// Safe modal helper that works with live-features.js or fallback
function openAppModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '520px';
  if (typeof window.showModal === 'function') {
    return window.showModal(title, contentHtml, submitLabel, onSubmit, maxWidth);
  }

  var overlay = document.getElementById('rwaExpenseModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaExpenseModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
        '<button type="button" onclick="document.getElementById(\'rwaExpenseModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<form id="rwaExpenseFallbackForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
        contentHtml +
        '<div style="display:flex;gap:10px;margin-top:8px;">' +
          (submitLabel
            ? '<button type="button" onclick="document.getElementById(\'rwaExpenseModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
              '<button type="submit" id="rwaExpSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
            : '<button type="button" onclick="document.getElementById(\'rwaExpenseModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
          ) +
        '</div>' +
      '</form>' +
    '</div>';
  overlay.style.display = 'flex';

  var form = document.getElementById('rwaExpenseFallbackForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById('rwaExpSubBtn');
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
Screens['admin-expenses'] = function() {
  setTimeout(function() {
    if (typeof window.loadLiveExpenses === 'function') window.loadLiveExpenses();
  }, 15);

  var catOptions = EXPENSE_CATEGORIES.map(function(c) {
    return '<option value="' + c + '">' + c + '</option>';
  }).join('');

  return Shell.render('admin-expenses', {
    title: 'Expenses',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.exportExpensesCSV()">📊 Export</button>
      <button class="btn btn-primary btn-sm" onclick="window.openGenerateRecurringExpensesModal()" style="background:#8B5CF6;border-color:#8B5CF6;">⚡ Generate Monthly</button>
      <button class="btn btn-primary btn-sm" onclick="window.openRecordExpenseModal()">+ Add Expense</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Expenses &amp; Approvals</div>
          <div class="page-subtitle" id="expensesSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.exportExpensesCSV()">📊 Export to Excel</button>
          <button class="btn btn-primary" onclick="window.openGenerateRecurringExpensesModal()" style="background:#8B5CF6;border-color:#8B5CF6;">⚡ Generate Monthly Vouchers</button>
          <button class="btn btn-primary" onclick="window.openRecordExpenseModal()">+ Add Expense</button>
        </div>
      </div>

      <!-- Pending Approval Banner -->
      <div id="expensesPendingBanner" style="display:none;padding:14px 18px;background:var(--amber-light);border:1px solid rgba(245,158,11,0.25);border-radius:var(--r-md);margin-bottom:18px;align-items:center;gap:12px;">
        <span style="font-size:20px;">⏳</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--amber);" id="expensesBannerTitle">expenses pending your approval</div>
          <div style="font-size:12px;color:var(--text-muted);" id="expensesBannerSub">awaiting review</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.filterExpensesByStatus('PENDING_APPROVAL',null)">Review Now</button>
      </div>

      <!-- KPI Summary Cards matching exact visual mockup -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card red">
          <div class="stat-icon red">🧾</div>
          <div class="stat-value" id="expStatTotal">₹0</div>
          <div class="stat-label">Total Expenses (Oct)</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">⏳</div>
          <div class="stat-value" id="expStatPending">₹0</div>
          <div class="stat-label">Pending Approval</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">✅</div>
          <div class="stat-value" id="expStatPaid">₹0</div>
          <div class="stat-label">Paid This Month</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon blue">🎯</div>
          <div class="stat-value" id="expStatBudgetRem">₹0</div>
          <div class="stat-label">Budget Remaining</div>
        </div>
      </div>

      <!-- Modern Analytics Card (Society Expenses, Area Spline + Donut) -->
      <div class="cases-analytics-card">
        <div class="cases-analytics-title">Society Expenses &amp; Outflows</div>
        <div class="cases-analytics-subtitle" id="expensesDiffSubtitle">Society expense vouchers and outflow allocation</div>
        <div class="cases-analytics-grid">
          <div id="expAreaChartContainer" style="width:100%;min-height:220px;"></div>
          <div id="expDonutChartContainer" style="width:100%;min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>

      <!-- Modern Table Toolbar matching reference image -->
      <div class="modern-table-toolbar">
        <div class="modern-table-count" id="expensesTableCount">Showing 1 to 10 of items</div>
        <div class="modern-table-search">
          <span>Search:</span>
          <input type="text" id="expensesSearchBox" class="cases-search-input" placeholder="" oninput="window.handleExpenseSearch(this.value)" />
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:14px;">
        <div class="search-box" style="min-width:200px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="expSearchInput" placeholder="Search expenses, vendor..." oninput="window.handleExpenseSearch(this.value)" />
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <div class="filter-pill active" id="expPillALL"              onclick="window.filterExpensesByStatus('ALL',this)">All</div>
          <div class="filter-pill" id="expPillPENDING_APPROVAL" onclick="window.filterExpensesByStatus('PENDING_APPROVAL',this)">⏳ Pending Approval</div>
          <div class="filter-pill" id="expPillAPPROVED"         onclick="window.filterExpensesByStatus('APPROVED',this)">Approved</div>
          <div class="filter-pill" id="expPillPAID"             onclick="window.filterExpensesByStatus('PAID',this)">Paid</div>
          <div class="filter-pill" id="expPillREJECTED"         onclick="window.filterExpensesByStatus('REJECTED',this)">Rejected</div>
          <div class="filter-pill" id="expPillRECURRING"        onclick="window.filterExpensesByStatus('RECURRING',this)">🔁 Monthly Recurring</div>
        </div>
        <select id="expCatSelect" class="form-select" style="min-width:160px;font-size:13px;padding:6px 10px;height:36px;" onchange="window.filterExpensesByCat(this.value)">
          <option value="ALL">Category ▾</option>
          ${catOptions}
        </select>
      </div>

      <!-- Desktop Table -->
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:80px;" id="expTableCard">
        <div style="overflow-x:auto;">
          <table class="table" style="min-width:860px;">
            <thead>
              <tr>
                <th style="width:110px;">ID</th>
                <th style="width:140px;">CATEGORY</th>
                <th>VENDOR</th>
                <th style="width:100px;">DATE</th>
                <th style="text-align:right;width:120px;">AMOUNT</th>
                <th style="width:150px;">STATUS</th>
                <th style="width:130px;">APPROVED BY</th>
                <th style="text-align:right;width:170px;">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="expTableBody">
              <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
                  <div style="font-size:28px;margin-bottom:8px;">🧾</div>
                  Loading expenses from database...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Cards -->
      <div id="expMobileCards" style="display:none;flex-direction:column;gap:12px;margin-top:4px;"></div>
    `,
  });
};

// =============================================
// Live Data Loader
// =============================================
window.loadLiveExpenses = async function() {
  try {
    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var url = '/api/expenses' + (activeOrgId ? '?orgId=' + encodeURIComponent(activeOrgId) : '');
    var res = await (window.apiFetch || fetch)(url).catch(function() { return null; });

    if (!res || !res.ok) throw new Error('API unavailable');

    var data = await res.json();
    var expenses = data.expenses || [];

    window.__expensesAll = expenses;
    window.updateExpenseKPIs(expenses);
    window.renderExpenseCategoryBreakdown(expenses);
    window.renderExpensesAnalytics(expenses);
    window.applyExpenseFilters();

    var sub = document.getElementById('expensesSubtitle');
    if (sub) {
      var total = expenses.reduce(function(s, e) { return s + Number(e.amount || e.totalAmount || 0); }, 0);
      sub.textContent = expenses.length + ' expense records · Total ₹' + total.toLocaleString('en-IN') + ' · Live database';
    }
  } catch (err) {
    console.error('Error loading expenses:', err);
    window.__expensesAll = window.generateDemoExpenses();
    window.updateExpenseKPIs(window.__expensesAll);
    window.renderExpenseCategoryBreakdown(window.__expensesAll);
    window.renderExpensesAnalytics(window.__expensesAll);
    window.applyExpenseFilters();
    var sub2 = document.getElementById('expensesSubtitle');
    if (sub2) sub2.innerHTML = '<span style="color:var(--amber)">⚠ Using fallback data — database connection issue</span>';
  }
};

window.renderExpensesAnalytics = function(expenses) {
  expenses = expenses || [];

  // 1. Day of week distribution for Area Spline Chart
  var dayCounts = [0, 0, 0, 0, 0, 0, 0];
  expenses.forEach(function(e) {
    var dt = e.expenseDate || e.createdAt ? new Date(e.expenseDate || e.createdAt) : new Date();
    var jsDay = dt.getDay();
    var dayIdx = (jsDay === 0) ? 6 : (jsDay - 1);
    dayCounts[dayIdx]++;
  });

  if (typeof window.renderModernAreaSplineChart === 'function') {
    window.renderModernAreaSplineChart({
      containerId: 'expAreaChartContainer',
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      data: dayCounts,
      strokeColor: '#0E7490',
      gradStart: '#06B6D4',
      gradEnd: '#CFFAFE',
      tooltipUnit: 'vouchers',
    });
  }

  // 2. Category distribution for Donut Chart
  var catCounts = {};
  expenses.forEach(function(e) {
    var cat = e.category || 'Other';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  var catColors = {
    'Security': '#3B82F6',
    'Maintenance': '#F59E0B',
    'Plumbing': '#10B981',
    'Horticulture': '#84CC16',
    'Admin': '#8B5CF6',
    'Electrical': '#06B6D4',
    'Civil': '#EC4899',
    'Other': '#64748B',
  };

  var slices = Object.keys(catCounts).map(function(cat) {
    return {
      label: cat,
      count: catCounts[cat],
      color: catColors[cat] || '#94A3B8',
    };
  });

  if (typeof window.renderModernDonutChart === 'function') {
    window.renderModernDonutChart({
      containerId: 'expDonutChartContainer',
      slices: slices,
      centerCount: expenses.length,
      centerLabel: 'Bills',
    });
  }

  var countEl = document.getElementById('expensesTableCount');
  if (countEl) {
    var total = expenses.length;
    var showing = Math.min(10, total);
    countEl.textContent = 'Showing 1 to ' + showing + ' of ' + total + ' items';
  }
};

// =============================================
// Fallback Data
// =============================================
window.generateDemoExpenses = function() {
  var today = new Date();
  var d = function(n) { var dt = new Date(today); dt.setDate(dt.getDate() - n); return dt.toISOString(); };
  return [
    { id:'EXP-001', title:'Monthly Security Guard Services',    category:'Security',    vendorName:'SkyGuard Security',  amount:42000, totalAmount:42000, status:'PAID',             approvedBy:'Rajesh K', description:'Oct 2026 security guard services',   createdAt:d(2),  expenseDate:d(2)  },
    { id:'EXP-002', title:'Electrical Panel & Maintenance',     category:'Maintenance', vendorName:'Ashok Electricals',   amount:8400,  totalAmount:8400,  status:'APPROVED',         approvedBy:'Rajesh K', description:'Annual panel inspection & repair',   createdAt:d(5),  expenseDate:d(5)  },
    { id:'EXP-003', title:'Water Pipeline Repair — B Block',    category:'Plumbing',    vendorName:'Sharma Plumbing',    amount:3200,  totalAmount:3200,  status:'PENDING_APPROVAL', approvedBy:null,       description:'Leakage fix in B-201 pipeline',      createdAt:d(7),  expenseDate:d(7)  },
    { id:'EXP-004', title:'Office Stationery & Supplies',       category:'Admin',       vendorName:'Stationary mart',    amount:1800,  totalAmount:1800,  status:'PAID',             approvedBy:'Rajesh K', description:'Ledger books, printer paper etc',    createdAt:d(13), expenseDate:d(13) },
    { id:'EXP-005', title:'Lawn Mowing & Landscaping',          category:'Horticulture',vendorName:'Green Thumb Gardens', amount:12000, totalAmount:12000, status:'PENDING_APPROVAL', approvedBy:null,       description:'Monsoon garden maintenance',         createdAt:d(15), expenseDate:d(15) },
  ];
};

// =============================================
// KPI Calculation
// =============================================
window.updateExpenseKPIs = function(expenses) {
  var total        = expenses.reduce(function(s, e) { return s + Number(e.amount || e.totalAmount || 0); }, 0);
  var pendingAmt   = expenses.filter(function(e) { return e.status === 'PENDING_APPROVAL'; }).reduce(function(s, e) { return s + Number(e.amount || e.totalAmount || 0); }, 0);
  var paidAmt      = expenses.filter(function(e) { return e.status === 'PAID'; }).reduce(function(s, e) { return s + Number(e.amount || e.totalAmount || 0); }, 0);
  var pendingCount = expenses.filter(function(e) { return e.status === 'PENDING_APPROVAL'; }).length;
  var monthlyBudget = 100000;
  var remaining    = Math.max(0, monthlyBudget - total);

  var el = function(id) { return document.getElementById(id); };
  if (el('expStatTotal'))     el('expStatTotal').textContent     = '₹' + total.toLocaleString('en-IN');
  if (el('expStatPending'))   el('expStatPending').textContent   = '₹' + pendingAmt.toLocaleString('en-IN');
  if (el('expStatPaid'))      el('expStatPaid').textContent      = '₹' + paidAmt.toLocaleString('en-IN');
  if (el('expStatBudgetRem')) el('expStatBudgetRem').textContent = '₹' + remaining.toLocaleString('en-IN');

  var banner = el('expensesPendingBanner');
  if (banner) {
    if (pendingCount > 0) {
      banner.style.display = 'flex';
      var bt = el('expensesBannerTitle'), bs = el('expensesBannerSub');
      if (bt) bt.textContent = pendingCount + ' expense' + (pendingCount > 1 ? 's' : '') + ' pending your approval';
      if (bs) bs.textContent = 'Total: ₹' + pendingAmt.toLocaleString('en-IN') + ' awaiting review';
    } else {
      banner.style.display = 'none';
    }
  }
};

// =============================================
// Category Bar Chart
// =============================================
window.renderExpenseCategoryBreakdown = function(expenses) {
  var container = document.getElementById('expCategoryBreakdown');
  if (!container) return;

  var catMap = {};
  expenses.forEach(function(e) {
    var cat = e.category || 'Other';
    var amt = Number(e.amount || e.totalAmount || 0);
    catMap[cat] = (catMap[cat] || 0) + amt;
  });

  var cats = Object.entries(catMap).sort(function(a, b) { return b[1] - a[1]; });
  if (!cats.length) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No expense categories yet</div>';
    return;
  }

  var maxAmt = cats[0][1];
  var COLORS = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#10B981','#F97316','#06B6D4','#EC4899','#84CC16','#6366F1'];
  var totalAmt = cats.reduce(function(s, p) { return s + p[1]; }, 0);

  container.innerHTML = cats.slice(0, 8).map(function(pair, i) {
    var cat = pair[0]; var amt = pair[1];
    var pct = Math.max(4, Math.round((amt / maxAmt) * 100));
    var sharePct = Math.round((amt / (totalAmt || 1)) * 100);
    var color = COLORS[i % COLORS.length];
    return '<div style="display:flex;align-items:center;gap:12px;">' +
      '<div style="min-width:130px;font-size:12px;font-weight:600;color:var(--text-secondary);">' + cat + '</div>' +
      '<div style="flex:1;background:var(--bg-elevated);border-radius:4px;height:8px;overflow:hidden;">' +
        '<div style="width:' + pct + '%;height:8px;border-radius:4px;background:' + color + ';transition:width 0.6s ease;"></div>' +
      '</div>' +
      '<div style="min-width:70px;text-align:right;font-size:12px;font-weight:700;color:var(--text-primary);">₹' + amt.toLocaleString('en-IN') + '</div>' +
      '<div style="min-width:36px;text-align:right;font-size:11px;color:var(--text-muted);">' + sharePct + '%</div>' +
    '</div>';
  }).join('');
};

// =============================================
// Filter Logic
// =============================================
window.applyExpenseFilters = function() {
  var list    = (window.__expensesAll || []).slice();
  var statusF = window.__expensesStatusFilter || 'ALL';
  var catF    = window.__expensesCatFilter    || 'ALL';
  var query   = (window.__expensesSearchQ     || '').toLowerCase().trim();

  if (statusF === 'RECURRING') {
    list = list.filter(function(e) { return Boolean(e.isRecurring); });
  } else if (statusF !== 'ALL') {
    list = list.filter(function(e) { return e.status === statusF; });
  }

  if (catF    !== 'ALL') list = list.filter(function(e) { return (e.category || '') === catF; });
  if (query) list = list.filter(function(e) {
    return (e.title       || '').toLowerCase().includes(query) ||
           (e.vendorName  || '').toLowerCase().includes(query) ||
           (e.category    || '').toLowerCase().includes(query) ||
           (e.description || '').toLowerCase().includes(query);
  });

  window.__expensesFiltered = list;
  window.renderExpensesTable(list);
};

window.filterExpensesByStatus = function(status, pillEl) {
  window.__expensesStatusFilter = status;
  ['ALL','PENDING_APPROVAL','APPROVED','PAID','REJECTED','RECURRING'].forEach(function(s) {
    var p = document.getElementById('expPill' + s);
    if (p) p.className = 'filter-pill' + (s === status ? ' active' : '');
  });
  window.applyExpenseFilters();
};

window.filterExpensesByCat = function(cat) {
  window.__expensesCatFilter = cat;
  window.applyExpenseFilters();
};

window.handleExpenseSearch = function(q) {
  window.__expensesSearchQ = q;
  window.applyExpenseFilters();
};

// =============================================
// Table + Mobile Cards Renderer
// =============================================
window.renderExpensesTable = function(list) {
  var tbody    = document.getElementById('expTableBody');
  var mobile   = document.getElementById('expMobileCards');
  var tableCard = document.getElementById('expTableCard');
  var isMob = window.innerWidth <= 768 || document.body.classList.contains('mobile-frame-view');

  var countEl = document.getElementById('expensesTableCount');
  if (countEl) {
    var showing = Math.min(10, list.length);
    countEl.textContent = 'Showing 1 to ' + showing + ' of ' + list.length + ' items';
  }

  if (!tbody) return;
  if (tableCard) tableCard.style.display = isMob ? 'none' : 'block';
  if (mobile) mobile.style.display = isMob ? 'flex' : 'none';

  var fmtDate = function(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month:'short', day:'numeric' });
  };
  var shortId = function(id) {
    if (!id) return 'EXP-001';
    if (id.startsWith('EXP-') || id.startsWith('exp-')) return id.toUpperCase();
    return 'EXP-' + id.slice(-4).toUpperCase();
  };

  if (list.length === 0) {
    var emptyHtml = '<div style="text-align:center;padding:48px;color:var(--text-muted);"><div style="font-size:32px;margin-bottom:10px;">🧾</div><div style="font-weight:600;margin-bottom:4px;">No expenses found</div><div style="font-size:12px;">Try adjusting the filters or <a href="#" onclick="window.openRecordExpenseModal();return false;" style="color:var(--blue);">add a new expense</a></div></div>';
    tbody.innerHTML = '<tr><td colspan="8">' + emptyHtml + '</td></tr>';
    if (mobile) mobile.innerHTML = emptyHtml;
    return;
  }

  tbody.innerHTML = list.map(function(e) {
    var amt = Number(e.amount || e.totalAmount || 0);
    var isPending = e.status === 'PENDING_APPROVAL';
    var isApproved = e.status === 'APPROVED';

    var statusPill = e.status === 'PAID'
      ? '<span class="pill-badge pill-status-resolved">paid</span>'
      : (e.status === 'APPROVED'
        ? '<span class="pill-badge pill-status-in-progress">approved</span>'
        : (e.status === 'PENDING_APPROVAL'
          ? '<span class="pill-badge pill-status-new">pending</span>'
          : '<span class="pill-badge pill-priority-urgent">rejected</span>'));

    return '<tr style="transition:background 0.12s;" onmouseover="this.style.background=\'var(--bg-elevated)\'" onmouseout="this.style.background=\'\'">' +
      '<td style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:600;cursor:pointer;" onclick="window.viewExpenseDetail(\'' + e.id + '\')">' + shortId(e.id) + '</td>' +
      '<td><span class="badge badge-muted" style="font-size:11px;font-weight:600;">' + (e.category || 'Other') + '</span></td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
          '<div style="font-weight:600;font-size:13px;color:var(--text-primary);">' + (e.vendorName || e.title || '—') + '</div>' +
          (e.isRecurring ? '<span class="badge badge-purple" style="font-size:9px;padding:1px 5px;" title="Recurring Monthly Commitment (Day ' + (e.recurringDay || 1) + ')">🔁 Monthly</span>' : '') +
        '</div>' +
        (e.title && e.vendorName && e.title !== e.vendorName ? '<div style="font-size:11px;color:var(--text-muted);">' + e.title + '</div>' : '') +
      '</td>' +
      '<td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">' + fmtDate(e.expenseDate || e.createdAt) + '</td>' +
      '<td style="text-align:right;font-weight:700;font-size:13px;color:var(--text-primary);">₹' + amt.toLocaleString('en-IN') + '</td>' +
      '<td>' + statusPill + '</td>' +
      '<td style="font-size:12px;color:var(--text-secondary);">' + (e.approvedBy || '—') + '</td>' +
      '<td style="text-align:right;">' +
        '<div style="display:flex;gap:5px;justify-content:flex-end;align-items:center;">' +
          (isPending
            ? '<button data-wired="true" class="btn btn-success btn-sm" style="font-size:11px;padding:4px 9px;border-radius:6px;" onclick="event.stopPropagation();window.approveExpense(\'' + e.id + '\', this)">✓ Approve</button>' +
              '<button data-wired="true" class="btn btn-danger btn-sm" style="font-size:11px;padding:4px 9px;border-radius:6px;" onclick="event.stopPropagation();window.rejectExpense(\'' + e.id + '\', this)">✕ Reject</button>'
            : (isApproved
                ? '<button data-wired="true" class="btn btn-success btn-sm" style="font-size:11px;padding:4px 9px;border-radius:6px;" onclick="event.stopPropagation();window.markExpensePaid(\'' + e.id + '\', this)">Mark Paid</button>'
                : '<button class="btn btn-ghost btn-sm" style="padding:4px 6px;color:var(--text-muted);" title="View Receipt" onclick="event.stopPropagation();window.viewExpenseDetail(\'' + e.id + '\')">📄</button>'
              ) +
              '<button class="btn btn-ghost btn-sm" style="padding:4px 6px;color:var(--text-muted);" title="Actions" onclick="event.stopPropagation();window.viewExpenseDetail(\'' + e.id + '\')">⋮</button>'
          ) +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  if (mobile) {
    mobile.innerHTML = list.map(function(e) {
      var s   = EXPENSE_STATUS_MAP[e.status] || { color:'muted', label: e.status || '—' };
      var amt = Number(e.amount || e.totalAmount || 0);
      var isPending = e.status === 'PENDING_APPROVAL';
      return '<div class="card" style="padding:16px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">' +
          '<div style="flex:1;margin-right:12px;">' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<div style="font-weight:700;font-size:14px;">' + (e.vendorName || e.title || '—') + '</div>' +
              (e.isRecurring ? '<span class="badge badge-purple" style="font-size:9px;padding:1px 5px;">🔁 Monthly</span>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + (e.category || 'Other') + (e.title ? ' · ' + e.title : '') + '</div>' +
          '</div>' +
          '<div style="font-size:17px;font-weight:900;color:var(--red);">₹' + amt.toLocaleString('en-IN') + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="badge badge-' + s.color + '">' + s.label + '</span>' +
          '<div style="display:flex;gap:6px;">' +
            (isPending
              ? '<button data-wired="true" class="btn btn-success btn-sm" onclick="event.stopPropagation();window.approveExpense(\'' + e.id + '\', this)">✓ Approve</button>' +
                '<button data-wired="true" class="btn btn-danger btn-sm" onclick="event.stopPropagation();window.rejectExpense(\'' + e.id + '\', this)">✕ Reject</button>'
              : '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.viewExpenseDetail(\'' + e.id + '\')">👁 View</button>'
            ) +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
};

// =============================================
// Approve Expense — Instant 1-Click Action
// =============================================
window.approveExpense = async function(expenseId, btnEl) {
  try {
    if (btnEl && btnEl.tagName) {
      btnEl.disabled = true;
      btnEl.textContent = 'Approving...';
    }
    var res = await (window.apiFetch || fetch)('/api/expenses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: expenseId, status: 'APPROVED' }),
    });
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to approve');
    if (typeof window.showToast === 'function') window.showToast('✅ Expense voucher approved!', 'success');
    await window.loadLiveExpenses();
  } catch (err) {
    console.error('Approve error:', err);
    if (typeof window.showToast === 'function') window.showToast('Error: ' + err.message, 'error');
    else alert('Error approving: ' + err.message);
    if (btnEl && btnEl.tagName) {
      btnEl.disabled = false;
      btnEl.textContent = '✓ Approve';
    }
  }
};

// =============================================
// Reject Expense — Clean Modal or Direct Action
// =============================================
window.rejectExpense = function(expenseId, btnElOrReason) {
  // If direct reason string provided:
  if (typeof btnElOrReason === 'string') {
    return (async function() {
      try {
        var res = await (window.apiFetch || fetch)('/api/expenses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: expenseId, status: 'REJECTED', reason: btnElOrReason }),
        });
        var data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reject');
        if (typeof window.showToast === 'function') window.showToast('Expense voucher rejected.', 'info');
        await window.loadLiveExpenses();
      } catch (err) {
        if (typeof window.showToast === 'function') window.showToast('Error: ' + err.message, 'error');
      }
    })();
  }

  var btnEl = btnElOrReason && btnElOrReason.tagName ? btnElOrReason : null;

  openAppModal(
    'Reject Expense Voucher',
    '<div>' +
      '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">Are you sure you want to reject this expense? Please provide a reason for the audit log:</p>' +
      '<div class="form-group">' +
        '<label class="form-label" style="font-size:12px;font-weight:700;">Rejection Reason</label>' +
        '<input type="text" id="rwaRejectReasonInput" class="form-control" value="Exceeds budget / Duplicate voucher" required />' +
      '</div>' +
    '</div>',
    'Confirm Rejection',
    async function() {
      var reasonInput = document.getElementById('rwaRejectReasonInput');
      var reason = (reasonInput && reasonInput.value.trim()) || 'Rejected by admin';
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = 'Rejecting...';
      }
      try {
        var res = await (window.apiFetch || fetch)('/api/expenses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: expenseId, status: 'REJECTED', reason: reason }),
        });
        var data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reject');
        if (typeof window.showToast === 'function') window.showToast('Expense voucher rejected.', 'info');
        await window.loadLiveExpenses();
      } catch (err) {
        console.error('Reject error:', err);
        if (typeof window.showToast === 'function') window.showToast('Error: ' + err.message, 'error');
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = '✕ Reject';
        }
      }
    },
    '440px'
  );
};

// =============================================
// Mark Paid
// =============================================
window.markExpensePaid = async function(expenseId, btnEl) {
  try {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Updating...';
    }
    var res = await (window.apiFetch || fetch)('/api/expenses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: expenseId, status: 'PAID' }),
    });
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update');
    if (typeof window.showToast === 'function') window.showToast('💚 Expense marked as Paid!', 'success');
    await window.loadLiveExpenses();
  } catch (err) {
    if (typeof window.showToast === 'function') window.showToast('Error: ' + err.message, 'error');
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = 'Mark Paid';
    }
  }
};

// =============================================
// View Expense Detail
// =============================================
window.viewExpenseDetail = function(expenseId) {
  var e = (window.__expensesAll || []).find(function(x) { return x.id === expenseId; });
  if (!e) { if (typeof window.showToast === 'function') window.showToast('Expense not found', 'warning'); return; }

  var s   = EXPENSE_STATUS_MAP[e.status] || { color:'muted', label: e.status || '—' };
  var amt = Number(e.amount || e.totalAmount || 0);
  var fmtDate = function(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : '—'; };

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
    '<div style="background:var(--bg-elevated);border-radius:var(--r-md);padding:16px;display:flex;align-items:center;gap:14px;">' +
      '<div style="width:52px;height:52px;border-radius:var(--r-md);background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;font-size:26px;">🧾</div>' +
      '<div style="flex:1;">' +
        '<div style="font-size:16px;font-weight:800;">' + (e.title || e.vendorName || '—') + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">• ' + (e.category || 'Other') + '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div style="font-size:22px;font-weight:900;color:var(--red);">₹' + amt.toLocaleString('en-IN') + '</div>' +
        '<span class="badge badge-' + s.color + '">' + s.label + '</span>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">' +
      '<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);"><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Vendor / Payee</div><div style="font-weight:600;">' + (e.vendorName || '—') + '</div></div>' +
      '<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);"><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Date</div><div style="font-weight:600;">' + fmtDate(e.expenseDate || e.createdAt) + '</div></div>' +
      '<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);"><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Approved By</div><div style="font-weight:600;">' + (e.approvedBy || '—') + '</div></div>' +
      '<div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);"><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Recorded By</div><div style="font-weight:600;">' + (e.createdBy || 'Admin') + '</div></div>' +
    '</div>' +
    (e.description ? '<div style="background:var(--bg-elevated);padding:14px;border-radius:var(--r-md);font-size:13px;line-height:1.6;"><div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:6px;">Notes / Description</div>' + e.description + '</div>' : '') +
    (e.status === 'PENDING_APPROVAL'
      ? '<div style="display:flex;gap:8px;margin-top:6px;">' +
          '<button type="button" class="btn btn-success" style="flex:1;" onclick="document.getElementById(\'rwaExpenseModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();window.approveExpense(\'' + e.id + '\')">✓ Approve</button>' +
          '<button type="button" class="btn btn-danger" style="flex:1;" onclick="document.getElementById(\'rwaExpenseModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();window.rejectExpense(\'' + e.id + '\')">✕ Reject</button>' +
        '</div>'
      : (e.status === 'APPROVED'
          ? '<button type="button" class="btn btn-success" style="width:100%;" onclick="document.getElementById(\'rwaExpenseModalOverlay\')?.remove();document.getElementById(\'rwaGlobalModal\')?.remove();window.markExpensePaid(\'' + e.id + '\')">💚 Mark as Paid</button>'
          : '')
    ) +
    '</div>';

  openAppModal('🧾 Expense Details', html, null, null, '520px');
};

// =============================================
// Add Expense Modal
// =============================================
window.openRecordExpenseModal = function() {
  var today = new Date().toISOString().split('T')[0];
  var catOpts = EXPENSE_CATEGORIES.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
    '<div><label class="form-label" style="font-weight:700;font-size:12px;">Expense Title *</label>' +
      '<input type="text" id="recExpTitle" class="form-input" placeholder="e.g. Monthly Security Guard Services" style="width:100%;font-size:13px;" /></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label class="form-label" style="font-weight:700;font-size:12px;">Amount (₹) *</label>' +
        '<input type="number" id="recExpAmount" class="form-input" placeholder="e.g. 42000" style="width:100%;font-size:13px;" min="1" step="0.01" /></div>' +
      '<div><label class="form-label" style="font-weight:700;font-size:12px;">Expense Date *</label>' +
        '<input type="date" id="recExpDate" class="form-input" value="' + today + '" style="width:100%;font-size:13px;" /></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label class="form-label" style="font-weight:700;font-size:12px;">Category *</label>' +
        '<select id="recExpCategory" class="form-select" style="width:100%;font-size:13px;">' + catOpts + '</select></div>' +
      '<div><label class="form-label" style="font-weight:700;font-size:12px;">Vendor / Payee *</label>' +
        '<input type="text" id="recExpVendor" class="form-input" placeholder="e.g. SkyGuard Security" style="width:100%;font-size:13px;" /></div>' +
    '</div>' +
    '<div><label class="form-label" style="font-weight:700;font-size:12px;">Bill / Voucher Reference Number</label>' +
      '<input type="text" id="recExpRef" class="form-input" placeholder="e.g. BILL-2024-089" style="width:100%;font-size:13px;" /></div>' +
    '<div><label class="form-label" style="font-weight:700;font-size:12px;">Description / Notes</label>' +
      '<textarea id="recExpDesc" class="form-input" placeholder="Brief notes about the expenditure..." style="width:100%;font-size:13px;height:72px;resize:vertical;"></textarea></div>' +
    '<div style="background:var(--bg-elevated);padding:12px 14px;border-radius:var(--r-md);border:1px solid var(--border);">' +
      '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0;">' +
        '<input type="checkbox" id="recExpIsRecurring" onchange="document.getElementById(\'recExpRecurringConfig\').style.display=this.checked?\'block\':\'none\'" />' +
        '<div>' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary);">🔁 Recurring Monthly Commitment (Salary / AMC / Utilities)</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">Saves as recurring template for automated monthly vouchers &amp; batch generation</div>' +
        '</div>' +
      '</label>' +
      '<div id="recExpRecurringConfig" style="display:none;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);">' +
        '<label class="form-label" style="font-size:11px;font-weight:700;">Payout / Due Day of Month</label>' +
        '<select id="recExpRecurringDay" class="form-select" style="font-size:12px;width:100%;">' +
          '<option value="1">1st of every month (Agencies &amp; AMCs)</option>' +
          '<option value="5">5th of every month</option>' +
          '<option value="7" selected>7th of every month (Staff Salaries)</option>' +
          '<option value="10">10th of every month</option>' +
          '<option value="15">15th of every month</option>' +
          '<option value="25">25th of every month</option>' +
          '<option value="30">Last day of month</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div style="padding:10px 14px;background:var(--amber-light);border-radius:var(--r-md);font-size:12px;color:var(--amber);font-weight:600;">⏳ Expense will be recorded as Pending Approval for committee review</div>' +
    '</div>';

  openAppModal('🧾 Record New Expense', html, 'Submit for Approval 🚀', async function() {
    var title  = (document.getElementById('recExpTitle')?.value  || '').trim();
    var amount = document.getElementById('recExpAmount')?.value;
    var date   = document.getElementById('recExpDate')?.value;
    var cat    = document.getElementById('recExpCategory')?.value;
    var vendor = (document.getElementById('recExpVendor')?.value || '').trim();
    var refNo  = (document.getElementById('recExpRef')?.value    || '').trim();
    var desc   = (document.getElementById('recExpDesc')?.value   || '').trim();
    var isRec  = Boolean(document.getElementById('recExpIsRecurring')?.checked);
    var recDay = parseInt(document.getElementById('recExpRecurringDay')?.value || '1', 10);

    if (!title)  { if (typeof window.showToast === 'function') window.showToast('Please enter an expense title', 'warning'); throw new Error('Title required'); }
    if (!amount || parseFloat(amount) <= 0) { if (typeof window.showToast === 'function') window.showToast('Please enter a valid amount', 'warning'); throw new Error('Amount required'); }
    if (!vendor) { if (typeof window.showToast === 'function') window.showToast('Please enter vendor name', 'warning'); throw new Error('Vendor required'); }

    var res = await (window.apiFetch || fetch)('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount: parseFloat(amount),
        category: cat,
        vendorName: vendor,
        description: desc || null,
        referenceNo: refNo || null,
        expenseDate: date,
        isRecurring: isRec,
        recurringDay: recDay,
      }),
    });
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record expense');
    if (typeof window.showToast === 'function') window.showToast('✅ Expense submitted for approval: ₹' + parseFloat(amount).toLocaleString('en-IN'), 'success');
    window.loadLiveExpenses();
  }, '520px');
};

// =============================================
// Generate Monthly Vouchers (Batch Recurring / Payroll)
// =============================================
window.openGenerateRecurringExpensesModal = async function() {
  var d = new Date();
  var currMonthStr = d.toISOString().slice(0, 7); // '2026-10'
  var nextMonthDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  var nextMonthStr = nextMonthDate.toISOString().slice(0, 7); // '2026-11'
  var nextNextMonthDate = new Date(d.getFullYear(), d.getMonth() + 2, 1);
  var nextNextMonthStr = nextNextMonthDate.toISOString().slice(0, 7); // '2026-12'

  var monthOptions = [
    '<option value="' + currMonthStr + '">Current Month (' + d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + ')</option>',
    '<option value="' + nextMonthStr + '" selected>Next Month (' + nextMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + ') — Recommended</option>',
    '<option value="' + nextNextMonthStr + '">' + nextNextMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + '</option>',
  ].join('');

  var initialHtml =
    '<div style="display:flex;flex-direction:column;gap:14px;" id="genRecModalBody">' +
      '<div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:var(--r-md);padding:12px 14px;display:flex;align-items:center;gap:12px;">' +
        '<span style="font-size:24px;">⚡</span>' +
        '<div>' +
          '<div style="font-weight:800;font-size:13px;color:var(--purple);">Monthly Recurring Vouchers &amp; Payroll Generator</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">Batch-create pending vouchers for Staff Salaries, Security Guard AMC, Lift &amp; DG Maintenance</div>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-weight:700;font-size:12px;">Target Billing Cycle / Month *</label>' +
        '<select id="genRecMonthSelect" class="form-select" style="width:100%;font-size:13px;" onchange="window.reloadRecurringTemplatesPreview(this.value)">' +
          monthOptions +
        '</select>' +
      '</div>' +
      '<div id="genRecTemplatesContainer" style="min-height:120px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="color:var(--text-muted);font-size:12px;">⏳ Loading recurring templates from database...</div>' +
      '</div>' +
    '</div>';

  openAppModal('⚡ Generate Monthly Vouchers', initialHtml, 'Generate Selected Vouchers ⚡', async function() {
    var month = document.getElementById('genRecMonthSelect')?.value;
    var checkboxes = document.querySelectorAll('.gen-rec-chk:checked');
    var selectedIds = Array.from(checkboxes).map(function(c) { return c.value; });

    if (!selectedIds.length) {
      if (typeof window.showToast === 'function') window.showToast('Please select at least one recurring expense voucher', 'warning');
      throw new Error('No items selected');
    }

    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var res = await (window.apiFetch || fetch)('/api/expenses/recurring/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: month, templateIds: selectedIds, orgId: activeOrgId }),
    });
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate vouchers');

    if (typeof window.showToast === 'function') {
      window.showToast('✅ Generated ' + data.count + ' recurring vouchers for ' + data.monthFormatted + '!', 'success');
    }
    await window.loadLiveExpenses();
  }, '560px');

  setTimeout(function() {
    window.reloadRecurringTemplatesPreview(nextMonthStr);
  }, 50);
};

window.reloadRecurringTemplatesPreview = async function(month) {
  var container = document.getElementById('genRecTemplatesContainer');
  if (!container) return;
  container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:20px;text-align:center;">⏳ Loading recurring templates...</div>';

  try {
    var activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    var url = '/api/expenses/recurring/generate?month=' + encodeURIComponent(month) + (activeOrgId ? '&orgId=' + encodeURIComponent(activeOrgId) : '');
    var res = await (window.apiFetch || fetch)(url);
    var data = await res.json();
    var templates = data.templates || [];

    if (!templates.length) {
      container.innerHTML =
        '<div style="text-align:center;padding:24px;background:var(--bg-elevated);border-radius:var(--r-md);">' +
          '<div style="font-size:24px;margin-bottom:6px;">ℹ️</div>' +
          '<div style="font-weight:700;font-size:13px;color:var(--text-primary);margin-bottom:4px;">No Recurring Templates Found</div>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">When adding an expense (e.g. Staff Salaries, AMCs), check "🔁 Recurring Monthly Expense" to save it as a template.</div>' +
          '<button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById(\'rwaGlobalModal\')?.remove();document.getElementById(\'rwaExpenseModalOverlay\')?.remove();window.openRecordExpenseModal();">+ Add First Recurring Template</button>' +
        '</div>';
      return;
    }

    var totalAmt = templates.reduce(function(s, t) { return s + t.amount; }, 0);
    var pendingList = templates.filter(function(t) { return !t.alreadyGenerated; });

    var itemsHtml = templates.map(function(t) {
      return '<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-md);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<input type="checkbox" class="gen-rec-chk" value="' + t.id + '" ' + (t.alreadyGenerated ? 'disabled' : 'checked') + ' style="width:16px;height:16px;cursor:pointer;" />' +
          '<div>' +
            '<div style="font-weight:700;font-size:13px;color:var(--text-primary);">' + t.title + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">' + (t.vendorName || 'General Vendor') + ' · ' + t.category + ' · Scheduled Day ' + t.recurringDay + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-weight:800;font-size:14px;color:var(--text-primary);">₹' + t.amount.toLocaleString('en-IN') + '</div>' +
          (t.alreadyGenerated
            ? '<span class="badge badge-green" style="font-size:10px;padding:2px 6px;">✓ Generated</span>'
            : '<span class="badge badge-amber" style="font-size:10px;padding:2px 6px;">Ready</span>'
          ) +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:10px;width:100%;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:0 2px;">' +
          '<div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Recurring Templates (' + templates.length + ')</div>' +
          '<div style="font-size:12px;color:var(--text-muted);">Total: <strong style="color:var(--text-primary);">₹' + totalAmt.toLocaleString('en-IN') + ' / mo</strong></div>' +
        '</div>' +
        itemsHtml +
        '<div style="font-size:11px;color:var(--text-muted);padding-top:4px;">' +
          (pendingList.length > 0
            ? '⚡ <strong>' + pendingList.length + ' vouchers</strong> ready to be generated for <strong>' + data.monthFormatted + '</strong>.'
            : '✓ All recurring vouchers for <strong>' + data.monthFormatted + '</strong> have already been generated.'
          ) +
        '</div>' +
      '</div>';
  } catch (err) {
    container.innerHTML = '<div style="color:var(--red);font-size:12px;padding:12px;text-align:center;">Failed to load templates: ' + err.message + '</div>';
  }
};

// =============================================
// Export to CSV
// =============================================
window.exportExpensesCSV = function() {
  var list = window.__expensesFiltered || window.__expensesAll || [];
  if (!list.length) { if (typeof window.showToast === 'function') window.showToast('No expenses to export', 'warning'); return; }

  var fmtDate = function(d) { return d ? new Date(d).toLocaleDateString('en-IN') : ''; };
  var headers = ['ID','Title','Category','Vendor','Date','Amount (INR)','Status','Approved By','Description'];
  var rows = list.map(function(e) {
    return [
      e.id || '',
      '"' + (e.title || '').replace(/"/g,'""') + '"',
      e.category || '',
      '"' + (e.vendorName || '').replace(/"/g,'""') + '"',
      fmtDate(e.expenseDate || e.createdAt),
      Number(e.amount || e.totalAmount || 0),
      e.status || '',
      '"' + (e.approvedBy || '').replace(/"/g,'""') + '"',
      '"' + (e.description || '').replace(/"/g,'""') + '"',
    ].join(',');
  });

  var csv  = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  var org  = (localStorage.getItem('rwa_active_org_name') || 'Society').replace(/\s+/g,'_');
  link.href = url;
  link.download = org + '_Expenses_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  URL.revokeObjectURL(url);
  if (typeof window.showToast === 'function') window.showToast('Expenses exported: ' + list.length + ' records', 'success');
};

// Socket real-time synchronization
if (typeof window !== 'undefined' && window.socket) {
  window.socket.on('new-expense-recorded', function() {
    if (typeof window.loadLiveExpenses === 'function') window.loadLiveExpenses();
  });
  window.socket.on('expense-status-updated', function() {
    if (typeof window.loadLiveExpenses === 'function') window.loadLiveExpenses();
  });
}
