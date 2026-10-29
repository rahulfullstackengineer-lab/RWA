// =============================================
// Admin Ledger Screen
// Society Cash Book — Chronological DR/CR Register
// Unit-wise Ledger, Fund-head Breakdown, Export
// =============================================

window.__ledgerEntries       = [];
window.__ledgerFiltered      = [];
window.__ledgerUnitFilter    = 'ALL';
window.__ledgerTypeFilter    = 'ALL';
window.__ledgerSearchQuery   = '';
window.__ledgerDateFrom      = '';
window.__ledgerDateTo        = '';
window.__ledgerSortOrder     = 'asc';       // 'asc' | 'desc'
window.__ledgerViewMode      = 'cashbook';  // 'cashbook' | 'unitwise' | 'fundwise'

// =============================================
// Screen Definition
// =============================================
Screens['admin-ledger'] = function() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = function(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  window.__ledgerDateFrom = fmt(firstOfMonth);
  window.__ledgerDateTo   = fmt(today);

  setTimeout(() => {
    if (typeof window.loadLiveLedger === 'function') {
      window.loadLiveLedger();
    }
  }, 20);

  return Shell.render('admin-ledger', {
    title: 'Society Ledger',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.exportLedgerCSV()">📊 Export CSV</button>
      <button class="btn btn-secondary btn-sm" onclick="window.printLedger()">🖨️ Print</button>
    `,
    content: `
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Society Ledger & Cash Book</div>
          <div class="page-subtitle" id="ledgerSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.exportLedgerCSV()">📊 Export to Excel</button>
          <button class="btn btn-secondary" onclick="window.printLedger()">🖨️ Print Ledger</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card green">
          <div class="stat-icon green">💰</div>
          <div class="stat-value" id="ledgerStatTotalCredits">₹0</div>
          <div class="stat-label">Total Credits (Income)</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon red">💸</div>
          <div class="stat-value" id="ledgerStatTotalDebits">₹0</div>
          <div class="stat-label">Total Debits (Expense)</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon blue">⚖️</div>
          <div class="stat-value" id="ledgerStatNetBalance">₹0</div>
          <div class="stat-label">Net Balance</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">📑</div>
          <div class="stat-value" id="ledgerStatEntryCount">0</div>
          <div class="stat-label">Total Transactions</div>
        </div>
      </div>

      <!-- View Mode Tabs -->
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
        <button id="ledgerTabCashbook" class="btn btn-primary btn-sm" onclick="window.switchLedgerView('cashbook')">📒 Cash Book</button>
        <button id="ledgerTabUnitwise" class="btn btn-secondary btn-sm" onclick="window.switchLedgerView('unitwise')">🚪 Unit-wise Ledger</button>
        <button id="ledgerTabFundwise" class="btn btn-secondary btn-sm" onclick="window.switchLedgerView('fundwise')">🏦 Fund-head Breakdown</button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:8px;margin-bottom:16px;" id="ledgerFilterBar">
        <div class="search-box" style="min-width:200px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="ledgerSearchInput" placeholder="Search flat, narration, ref#..." oninput="window.handleLedgerSearch(this.value)" />
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:12px;color:var(--text-muted);font-weight:600;">From:</label>
          <input type="date" id="ledgerDateFrom" class="form-input" style="padding:6px 10px;height:36px;font-size:13px;min-width:140px;" value="${fmt(firstOfMonth)}" onchange="window.handleLedgerDateChange()" />
          <label style="font-size:12px;color:var(--text-muted);font-weight:600;">To:</label>
          <input type="date" id="ledgerDateTo" class="form-input" style="padding:6px 10px;height:36px;font-size:13px;min-width:140px;" value="${fmt(today)}" onchange="window.handleLedgerDateChange()" />
        </div>
        <select id="ledgerTypeFilter" class="form-select" style="min-width:150px;font-size:13px;padding:6px 10px;height:36px;" onchange="window.handleLedgerTypeFilter(this.value)">
          <option value="ALL">All Types</option>
          <option value="CR">Credits Only</option>
          <option value="DR">Debits Only</option>
          <option value="PAYMENT">Payments Received</option>
          <option value="INVOICE">Invoices Raised</option>
          <option value="EXPENSE">Expenses</option>
        </select>
        <select id="ledgerUnitFilter" class="form-select" style="min-width:150px;font-size:13px;padding:6px 10px;height:36px;" onchange="window.handleLedgerUnitFilter(this.value)">
          <option value="ALL">All Flats</option>
        </select>
        <button id="ledgerSortBtn" class="btn btn-secondary btn-sm" onclick="window.toggleLedgerSortOrder()" title="Toggle chronological order">⬇️ Oldest First</button>
        <button class="btn btn-secondary btn-sm" onclick="window.resetLedgerFilters()">x Clear</button>
      </div>

      <!-- CASHBOOK VIEW -->
      <div id="ledgerCashbookView">
        <div class="card" style="padding:0;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table class="table" style="min-width:900px;">
              <thead>
                <tr>
                  <th style="width:110px;">Date</th>
                  <th style="width:90px;">Type</th>
                  <th>Narration / Description</th>
                  <th>Flat / Unit</th>
                  <th style="width:90px;">Ref #</th>
                  <th style="text-align:right;width:110px;">Debit (DR)</th>
                  <th style="text-align:right;width:110px;">Credit (CR)</th>
                  <th style="text-align:right;width:120px;">Running Balance</th>
                </tr>
              </thead>
              <tbody id="ledgerTableBody">
                <tr>
                  <td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
                    <div style="font-size:28px;margin-bottom:8px;">📒</div>
                    Loading ledger entries from database...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary Footer -->
        <div id="ledgerSummaryFooter" style="display:none;margin-top:16px;">
          <div class="card" style="padding:16px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
              <div style="text-align:center;">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Opening Balance</div>
                <div style="font-size:18px;font-weight:800;color:var(--blue);" id="ledgerOpeningBal">RS 0</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Total Receipts</div>
                <div style="font-size:18px;font-weight:800;color:var(--green);" id="ledgerTotalReceipts">RS 0</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Total Payments</div>
                <div style="font-size:18px;font-weight:800;color:var(--red);" id="ledgerTotalPayments">RS 0</div>
              </div>
              <div style="text-align:center;border-left:2px solid var(--border-light);padding-left:16px;">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Closing Balance</div>
                <div style="font-size:22px;font-weight:900;color:var(--blue);" id="ledgerClosingBal">RS 0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- UNIT-WISE LEDGER VIEW (hidden by default) -->
      <div id="ledgerUnitwiseView" style="display:none;">
        <div id="ledgerUnitwiseContainer" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>

      <!-- FUND-HEAD BREAKDOWN VIEW (hidden by default) -->
      <div id="ledgerFundwiseView" style="display:none;">
        <div id="ledgerFundwiseContainer"></div>
      </div>
    `,
  });
};

// =============================================
// View Mode Switcher
// =============================================
window.switchLedgerView = function(mode) {
  window.__ledgerViewMode = mode;

  document.getElementById('ledgerCashbookView').style.display  = mode === 'cashbook'  ? 'block' : 'none';
  document.getElementById('ledgerUnitwiseView').style.display  = mode === 'unitwise'  ? 'block' : 'none';
  document.getElementById('ledgerFundwiseView').style.display  = mode === 'fundwise'  ? 'block' : 'none';

  ['cashbook', 'unitwise', 'fundwise'].forEach(v => {
    const btn = document.getElementById('ledgerTab' + v.charAt(0).toUpperCase() + v.slice(1));
    if (btn) {
      btn.className = v === mode ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
    }
  });

  window.renderLedgerCurrentView();
};

// =============================================
// Primary Data Loader
// =============================================
window.loadLiveLedger = async function() {
  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const orgQ = activeOrgId ? '?orgId=' + encodeURIComponent(activeOrgId) : '';

    const [paymentsRes, invoicesRes, expensesRes] = await Promise.all([
      (window.apiFetch || fetch)('/api/payments' + orgQ).catch(() => null),
      (window.apiFetch || fetch)('/api/billing/invoices' + orgQ).catch(() => null),
      (window.apiFetch || fetch)('/api/expenses' + orgQ).catch(() => null),
    ]);

    let payments = [], invoices = [], expenses = [];

    if (paymentsRes && paymentsRes.ok) {
      const d = await paymentsRes.json();
      payments = d.payments || d.data || [];
    }
    if (invoicesRes && invoicesRes.ok) {
      const d = await invoicesRes.json();
      invoices = d.invoices || d.data || [];
    }
    if (expensesRes && expensesRes.ok) {
      const d = await expensesRes.json();
      expenses = d.expenses || d.data || [];
    }

    const entries = [];

    // Payments -> CREDIT
    payments.forEach(function(p) {
      if (!p || p.status === 'FAILED' || p.status === 'PENDING') return;
      var unit = (p.invoice && p.invoice.unit) || p.unit || {};
      var unitNum = unit.unitNumber || p.unitNumber || 'Common';
      var unitId  = unit.id || p.unitId || '';
      entries.push({
        id:         p.id,
        date:       p.paidAt || p.createdAt,
        type:       'PAYMENT',
        drCr:       'CR',
        narration:  'Maintenance received — ' + (p.method || 'Online') + (p.referenceNo ? ' (Ref: ' + p.referenceNo + ')' : ''),
        unitNumber: unitNum,
        unitId:     unitId,
        ownerName:  unit.ownerName || p.residentName || '',
        refNumber:  p.razorpayPaymentId || p.referenceNo || ('PAY-' + (p.id || '').slice(-6).toUpperCase()),
        amount:     Number(p.amount || 0),
        debit:      0,
        credit:     Number(p.amount || 0),
        fundHead:   'Maintenance Fund',
        chargeHead: 'Maintenance Collection',
        invoiceRef: (p.invoice && p.invoice.invoiceNumber) || '',
      });
    });

    // Invoices -> DEBIT
    invoices.forEach(function(inv) {
      if (!inv) return;
      var unit = inv.unit || {};
      var unitNum = unit.unitNumber || inv.unitNumber || 'Common';
      var unitId  = unit.id || inv.unitId || '';
      entries.push({
        id:         inv.id,
        date:       inv.issueDate || inv.createdAt,
        type:       'INVOICE',
        drCr:       'DR',
        narration:  'Invoice raised — ' + (inv.billingMonth || inv.invoiceNumber || ''),
        unitNumber: unitNum,
        unitId:     unitId,
        ownerName:  unit.ownerName || '',
        refNumber:  inv.invoiceNumber || ('INV-' + (inv.id || '').slice(-6).toUpperCase()),
        amount:     Number(inv.totalAmount || 0),
        debit:      Number(inv.totalAmount || 0),
        credit:     0,
        fundHead:   'Maintenance Fund',
        chargeHead: 'Invoice Raised',
        invoiceRef: inv.invoiceNumber || '',
      });
    });

    // Expenses -> DEBIT
    expenses.forEach(function(exp) {
      if (!exp) return;
      // Do not include rejected expenses in the financial ledger / cash book
      if (exp.status === 'REJECTED') return;

      // Effective date for cash flow:
      // If paid, the transaction date is paidDate; otherwise fallback to billDate or createdAt
      var txDate = (exp.status === 'PAID' && exp.paidDate)
        ? exp.paidDate
        : (exp.paidDate || exp.billDate || exp.expenseDate || exp.date || exp.createdAt);

      var amt = Number(exp.totalAmount || exp.amount || 0);
      if (amt <= 0) return;

      var narrationTitle = exp.title || exp.description || exp.category || 'Society Expense';
      var vendorSuffix = exp.vendorName ? ' (' + exp.vendorName + ')' : '';
      var statusBadge = (exp.status && exp.status !== 'PAID') ? ' [' + exp.status + ']' : '';

      entries.push({
        id:         exp.id,
        date:       txDate,
        type:       'EXPENSE',
        status:     exp.status || 'PAID',
        drCr:       'DR',
        narration:  'Expense: ' + narrationTitle + vendorSuffix + statusBadge,
        unitNumber: 'Common',
        unitId:     '',
        ownerName:  exp.vendorName || '',
        refNumber:  exp.billNumber || exp.referenceNo || ('EXP-' + (exp.id || '').slice(-6).toUpperCase()),
        amount:     amt,
        debit:      amt,
        credit:     0,
        fundHead:   exp.fundHead || exp.category || 'General Fund',
        chargeHead: exp.category || 'Expense',
        invoiceRef: '',
      });
    });

    // Sort chronologically (oldest to newest) to establish cumulative running balances
    entries.sort(function(a, b) {
      var da = a.date ? new Date(a.date).getTime() : 0;
      var db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    var cumulativeBal = 0;
    entries.forEach(function(e) {
      cumulativeBal += (e.credit - e.debit);
      e.runningBalance = cumulativeBal;
    });

    window.__ledgerEntries = entries;

    // Populate unit dropdown
    var unitDropdown = document.getElementById('ledgerUnitFilter');
    if (unitDropdown) {
      var seen = {};
      var units = [];
      entries.forEach(function(e) {
        if (e.unitNumber && e.unitNumber !== 'Common' && e.unitId && !seen[e.unitId]) {
          seen[e.unitId] = true;
          units.push({ id: e.unitId, number: e.unitNumber, owner: e.ownerName });
        }
      });
      units.sort(function(a, b) { return a.number.localeCompare(b.number, undefined, { numeric: true }); });
      unitDropdown.innerHTML = '<option value="ALL">All Flats</option>' +
        units.map(function(u) { return '<option value="' + u.id + '">' + u.number + (u.owner ? ' — ' + u.owner : '') + '</option>'; }).join('');
    }

    var sub = document.getElementById('ledgerSubtitle');
    if (sub) {
      var totalCR = entries.filter(function(e) { return e.drCr === 'CR'; }).reduce(function(s, e) { return s + e.credit; }, 0);
      var totalDR = entries.filter(function(e) { return e.drCr === 'DR'; }).reduce(function(s, e) { return s + e.debit; }, 0);
      sub.textContent = entries.length + ' ledger entries · RS ' + totalCR.toLocaleString('en-IN') + ' credits · RS ' + totalDR.toLocaleString('en-IN') + ' debits · Live database';
    }

    window.applyLedgerFilters();

  } catch (err) {
    console.error('Error loading ledger:', err);
    var sub = document.getElementById('ledgerSubtitle');
    if (sub) sub.innerHTML = '<span style="color:var(--red)">Failed to load ledger. Showing demo data.</span>';
    window.__ledgerEntries = window.generateDemoLedgerEntries();
    window.applyLedgerFilters();
  }
};

// =============================================
// Demo Data Fallback
// =============================================
window.generateDemoLedgerEntries = function() {
  var today = new Date();
  var fmt = function(d) { return d.toISOString(); };
  var days = function(n) { var d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

  return [
    { id:'d1',  date:days(28), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Sep 2026',   unitNumber:'A-101', unitId:'u1', ownerName:'Rajesh Kumar',  refNumber:'INV-240901', amount:5500,  debit:5500,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-240901' },
    { id:'d2',  date:days(27), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Sep 2026',   unitNumber:'A-102', unitId:'u2', ownerName:'Priya Sharma',   refNumber:'INV-240902', amount:5500,  debit:5500,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-240902' },
    { id:'d3',  date:days(26), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Sep 2026',   unitNumber:'B-201', unitId:'u3', ownerName:'Arun Patel',     refNumber:'INV-240903', amount:6200,  debit:6200,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-240903' },
    { id:'d4',  date:days(25), type:'PAYMENT', drCr:'CR', narration:'Maintenance received — Online (Ref: pay_Qx901)', unitNumber:'A-101', unitId:'u1', ownerName:'Rajesh Kumar',  refNumber:'pay_Qx901', amount:5500,  debit:0,     credit:5500,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-240901' },
    { id:'d5',  date:days(22), type:'EXPENSE', drCr:'DR', narration:'Expense: Security Agency (ShieldGuard Services)', unitNumber:'Common', unitId:'', ownerName:'ShieldGuard Services', refNumber:'EXP-0094', amount:42000, debit:42000, credit:0,     fundHead:'Security Fund',    chargeHead:'Security Charges',       invoiceRef:'' },
    { id:'d6',  date:days(20), type:'PAYMENT', drCr:'CR', narration:'Maintenance received — Cash (Ref: CHQ-201)',      unitNumber:'A-102', unitId:'u2', ownerName:'Priya Sharma',   refNumber:'CHQ-201',   amount:5500,  debit:0,     credit:5500,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-240902' },
    { id:'d7',  date:days(18), type:'PAYMENT', drCr:'CR', narration:'Maintenance received — NEFT (Ref: UTR-88921)',    unitNumber:'B-201', unitId:'u3', ownerName:'Arun Patel',     refNumber:'UTR-88921', amount:6200,  debit:0,     credit:6200,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-240903' },
    { id:'d8',  date:days(14), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Oct 2026',   unitNumber:'A-101', unitId:'u1', ownerName:'Rajesh Kumar',  refNumber:'INV-241001', amount:5500,  debit:5500,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-241001' },
    { id:'d9',  date:days(14), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Oct 2026',   unitNumber:'A-102', unitId:'u2', ownerName:'Priya Sharma',   refNumber:'INV-241002', amount:5500,  debit:5500,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-241002' },
    { id:'d10', date:days(13), type:'INVOICE', drCr:'DR', narration:'Invoice raised — Oct 2026',   unitNumber:'B-201', unitId:'u3', ownerName:'Arun Patel',     refNumber:'INV-241003', amount:6200,  debit:6200,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Invoice Raised',         invoiceRef:'INV-241003' },
    { id:'d11', date:days(12), type:'EXPENSE', drCr:'DR', narration:'Expense: Electricity — BESCOM Common Area',       unitNumber:'Common', unitId:'', ownerName:'BESCOM',           refNumber:'EXP-0095', amount:8500,  debit:8500,  credit:0,     fundHead:'Utilities Fund',   chargeHead:'Electricity',            invoiceRef:'' },
    { id:'d12', date:days(10), type:'PAYMENT', drCr:'CR', narration:'Maintenance received — Online (Ref: pay_Ry512)', unitNumber:'A-101', unitId:'u1', ownerName:'Rajesh Kumar',  refNumber:'pay_Ry512', amount:5500,  debit:0,     credit:5500,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-241001' },
    { id:'d13', date:days(8),  type:'EXPENSE', drCr:'DR', narration:'Expense: Garden & Landscaping (GreenThumb)',     unitNumber:'Common', unitId:'', ownerName:'GreenThumb',       refNumber:'EXP-0096', amount:6200,  debit:6200,  credit:0,     fundHead:'Maintenance Fund', chargeHead:'Landscaping',            invoiceRef:'' },
    { id:'d14', date:days(5),  type:'EXPENSE', drCr:'DR', narration:'Expense: Water Supply (BWSSB)',                  unitNumber:'Common', unitId:'', ownerName:'BWSSB',            refNumber:'EXP-0097', amount:4800,  debit:4800,  credit:0,     fundHead:'Utilities Fund',   chargeHead:'Water Charges',          invoiceRef:'' },
    { id:'d15', date:days(3),  type:'PAYMENT', drCr:'CR', narration:'Maintenance received — UPI (Ref: GPay-7721)',    unitNumber:'A-102', unitId:'u2', ownerName:'Priya Sharma',   refNumber:'GPay-7721', amount:5500,  debit:0,     credit:5500,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-241002' },
    { id:'d16', date:days(1),  type:'PAYMENT', drCr:'CR', narration:'Maintenance received — NEFT (Ref: UTR-99210)',   unitNumber:'B-201', unitId:'u3', ownerName:'Arun Patel',     refNumber:'UTR-99210', amount:6200,  debit:0,     credit:6200,  fundHead:'Maintenance Fund', chargeHead:'Maintenance Collection', invoiceRef:'INV-241003' },
  ];
};

// =============================================
// Filter Application
// =============================================
window.applyLedgerFilters = function() {
  var list = (window.__ledgerEntries || []).slice();

  var fromStr = window.__ledgerDateFrom || '';
  var toStr   = window.__ledgerDateTo   || '';
  var typeF   = window.__ledgerTypeFilter  || 'ALL';
  var unitF   = window.__ledgerUnitFilter  || 'ALL';
  var query   = (window.__ledgerSearchQuery || '').toLowerCase().trim();

  // Helper to extract YYYY-MM-DD in local time
  var toLocalDateStr = function(dVal) {
    if (!dVal) return '';
    var d = new Date(dVal);
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  if (fromStr) {
    list = list.filter(function(e) {
      var dStr = toLocalDateStr(e.date);
      return !dStr || dStr >= fromStr;
    });
  }

  if (toStr) {
    list = list.filter(function(e) {
      var dStr = toLocalDateStr(e.date);
      return !dStr || dStr <= toStr;
    });
  }

  if (typeF !== 'ALL') {
    if (typeF === 'CR')      list = list.filter(function(e) { return e.drCr === 'CR'; });
    else if (typeF === 'DR') list = list.filter(function(e) { return e.drCr === 'DR'; });
    else                     list = list.filter(function(e) { return e.type === typeF; });
  }

  if (unitF !== 'ALL') list = list.filter(function(e) { return e.unitId === unitF; });

  if (query) {
    list = list.filter(function(e) {
      return (e.unitNumber || '').toLowerCase().includes(query) ||
             (e.narration  || '').toLowerCase().includes(query) ||
             (e.ownerName  || '').toLowerCase().includes(query) ||
             (e.refNumber  || '').toLowerCase().includes(query) ||
             (e.fundHead   || '').toLowerCase().includes(query) ||
             (e.invoiceRef || '').toLowerCase().includes(query);
    });
  }

  // Apply sorting order
  if (window.__ledgerSortOrder === 'desc') {
    list.sort(function(a, b) {
      return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    });
  } else {
    list.sort(function(a, b) {
      return (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0);
    });
  }

  window.__ledgerFiltered = list;
  window.updateLedgerKPICards(list);
  window.renderLedgerCurrentView();
};

// =============================================
// KPI Cards Update
// =============================================
window.updateLedgerKPICards = function(list) {
  var totalCR = list.filter(function(e) { return e.drCr === 'CR'; }).reduce(function(s, e) { return s + e.credit; }, 0);
  var totalDR = list.filter(function(e) { return e.drCr === 'DR'; }).reduce(function(s, e) { return s + e.debit;  }, 0);
  var net     = totalCR - totalDR;

  var fmtAmt = function(v) { return (v < 0 ? '-' : '') + 'RS ' + Math.abs(v).toLocaleString('en-IN'); };

  var elCR  = document.getElementById('ledgerStatTotalCredits');
  var elDR  = document.getElementById('ledgerStatTotalDebits');
  var elNet = document.getElementById('ledgerStatNetBalance');
  var elCnt = document.getElementById('ledgerStatEntryCount');

  if (elCR)  elCR.textContent  = fmtAmt(totalCR);
  if (elDR)  elDR.textContent  = fmtAmt(totalDR);
  if (elNet) { elNet.textContent = fmtAmt(net); elNet.style.color = net >= 0 ? 'var(--green)' : 'var(--red)'; }
  if (elCnt) elCnt.textContent = list.length;
};

// =============================================
// Route to correct view renderer
// =============================================
window.renderLedgerCurrentView = function() {
  var mode = window.__ledgerViewMode || 'cashbook';
  if (mode === 'cashbook')      window.renderLedgerCashbook();
  else if (mode === 'unitwise') window.renderLedgerUnitwise();
  else if (mode === 'fundwise') window.renderLedgerFundwise();
};

// =============================================
// CASHBOOK RENDERER — with Running Balance
// =============================================
window.renderLedgerCashbook = function() {
  var tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;

  var list = window.__ledgerFiltered || [];

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--text-muted);"><div style="font-size:32px;margin-bottom:10px;">📒</div><div style="font-weight:600;margin-bottom:4px;">No ledger entries found</div><div style="font-size:12px;">Try adjusting the date range or filters above</div></td></tr>';
    return;
  }

  var fmtDate = function(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  var TYPE_BADGE = {
    PAYMENT: { label:'Payment', bg:'rgba(16,185,129,0.12)', color:'var(--green)', icon:'💳' },
    INVOICE: { label:'Invoice', bg:'rgba(37,99,235,0.1)',   color:'var(--blue)',  icon:'📄' },
    EXPENSE: { label:'Expense', bg:'rgba(239,68,68,0.1)',   color:'var(--red)',   icon:'🧾' },
  };

  var runningBal = 0;
  var totalCR = 0;
  var totalDR = 0;

  var rows = list.map(function(e) {
    var tb = TYPE_BADGE[e.type] || { label: e.type, bg:'var(--bg-elevated)', color:'var(--text-secondary)', icon:'📋' };
    runningBal += e.credit - e.debit;
    totalCR += e.credit;
    totalDR += e.debit;
    var balVal = (typeof e.runningBalance === 'number') ? e.runningBalance : runningBal;
    var balColor = balVal >= 0 ? 'var(--green)' : 'var(--red)';
    var balSign  = balVal >= 0 ? '+' : '-';

    return '<tr style="transition:background 0.12s;" onmouseover="this.style.background=\'var(--bg-elevated)\'" onmouseout="this.style.background=\'\'">' +
      '<td style="font-size:12px;color:var(--text-secondary);white-space:nowrap;">' + fmtDate(e.date) + '</td>' +
      '<td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:var(--r-full);font-size:11px;font-weight:700;background:' + tb.bg + ';color:' + tb.color + ';">' + tb.icon + ' ' + tb.label + '</span></td>' +
      '<td style="font-size:13px;max-width:280px;"><div style="font-weight:500;">' + (e.narration || '') + '</div>' + (e.invoiceRef ? '<div style="font-size:11px;color:var(--text-muted);">' + e.invoiceRef + '</div>' : '') + '</td>' +
      '<td style="font-size:12px;">' + (e.unitNumber !== 'Common' ? '<span style="font-weight:600;">' + e.unitNumber + '</span>' + (e.ownerName ? '<div style="font-size:11px;color:var(--text-muted);">' + e.ownerName + '</div>' : '') : '<span style="color:var(--text-muted);font-size:12px;">Common Area</span>') + '</td>' +
      '<td style="font-size:11px;font-family:monospace;color:var(--text-secondary);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (e.refNumber || '') + '">' + (e.refNumber || '—') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:var(--red);font-size:13px;">' + (e.debit > 0 ? 'RS ' + e.debit.toLocaleString('en-IN') : '<span style="color:var(--border);">—</span>') + '</td>' +
      '<td style="text-align:right;font-weight:600;color:var(--green);font-size:13px;">' + (e.credit > 0 ? 'RS ' + e.credit.toLocaleString('en-IN') : '<span style="color:var(--border);">—</span>') + '</td>' +
      '<td style="text-align:right;font-weight:700;color:' + balColor + ';font-size:13px;white-space:nowrap;">' + balSign + 'RS ' + Math.abs(balVal).toLocaleString('en-IN') + '</td>' +
    '</tr>';
  }).join('');

  var totRow = '<tr style="background:var(--bg-elevated);border-top:2px solid var(--border);font-weight:800;">' +
    '<td colspan="5" style="font-size:13px;color:var(--text-secondary);padding-top:12px;padding-bottom:12px;">PERIOD TOTALS (' + list.length + ' entries)</td>' +
    '<td style="text-align:right;font-size:14px;color:var(--red);">RS ' + totalDR.toLocaleString('en-IN') + '</td>' +
    '<td style="text-align:right;font-size:14px;color:var(--green);">RS ' + totalCR.toLocaleString('en-IN') + '</td>' +
    '<td style="text-align:right;font-size:15px;color:' + (runningBal >= 0 ? 'var(--green)' : 'var(--red)') + ';">' + (runningBal >= 0 ? '+' : '-') + 'RS ' + Math.abs(runningBal).toLocaleString('en-IN') + '</td>' +
  '</tr>';

  tbody.innerHTML = rows + totRow;

  // Update footer summary
  var footer = document.getElementById('ledgerSummaryFooter');
  if (footer) {
    footer.style.display = 'block';
    var elOR = document.getElementById('ledgerOpeningBal');
    var elTR = document.getElementById('ledgerTotalReceipts');
    var elTP = document.getElementById('ledgerTotalPayments');
    var elCB = document.getElementById('ledgerClosingBal');
    if (elOR) elOR.textContent = 'RS 0';
    if (elTR) elTR.textContent = 'RS ' + totalCR.toLocaleString('en-IN');
    if (elTP) elTP.textContent = 'RS ' + totalDR.toLocaleString('en-IN');
    if (elCB) {
      elCB.textContent = (runningBal >= 0 ? '+' : '-') + 'RS ' + Math.abs(runningBal).toLocaleString('en-IN');
      elCB.style.color = runningBal >= 0 ? 'var(--green)' : 'var(--red)';
    }
  }
};

// =============================================
// UNIT-WISE LEDGER RENDERER
// =============================================
window.renderLedgerUnitwise = function() {
  var container = document.getElementById('ledgerUnitwiseContainer');
  if (!container) return;

  var list = window.__ledgerFiltered || [];

  var unitMap = {};
  list.forEach(function(e) {
    var key = e.unitId || e.unitNumber || 'common';
    if (!unitMap[key]) {
      unitMap[key] = { unitId: e.unitId, unitNumber: e.unitNumber || 'Common', ownerName: e.ownerName || '', entries: [], totalDR: 0, totalCR: 0 };
    }
    unitMap[key].entries.push(e);
    unitMap[key].totalDR += e.debit;
    unitMap[key].totalCR += e.credit;
  });

  var units = Object.values(unitMap).sort(function(a, b) {
    return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
  });

  if (units.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);"><div style="font-size:32px;margin-bottom:10px;">🚪</div><div style="font-weight:600;">No unit transactions found for selected filters</div></div>';
    return;
  }

  var fmtDate = function(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  container.innerHTML = units.map(function(u, idx) {
    var net = u.totalCR - u.totalDR;
    var netColor = net >= 0 ? 'var(--green)' : 'var(--red)';

    var rows = u.entries.map(function(e) {
      return '<tr onmouseover="this.style.background=\'var(--bg-elevated)\'" onmouseout="this.style.background=\'\'">' +
        '<td style="font-size:12px;color:var(--text-secondary);">' + fmtDate(e.date) + '</td>' +
        '<td style="font-size:12px;font-weight:500;">' + (e.narration || '') + '</td>' +
        '<td style="font-size:11px;font-family:monospace;color:var(--text-muted);">' + (e.refNumber || '—') + '</td>' +
        '<td style="text-align:right;font-weight:600;color:var(--red);font-size:13px;">' + (e.debit > 0 ? 'RS ' + e.debit.toLocaleString('en-IN') : '—') + '</td>' +
        '<td style="text-align:right;font-weight:600;color:var(--green);font-size:13px;">' + (e.credit > 0 ? 'RS ' + e.credit.toLocaleString('en-IN') : '—') + '</td>' +
      '</tr>';
    }).join('');

    return '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--bg-elevated);border-bottom:1px solid var(--border-light);cursor:pointer;" onclick="window.toggleUnitLedgerAccordion(\'ulAcc' + idx + '\')">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:40px;height:40px;border-radius:var(--r-md);background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;">' + (u.unitNumber === 'Common' ? '🏢' : '🚪') + '</div>' +
          '<div><div style="font-weight:700;font-size:15px;">' + u.unitNumber + '</div>' + (u.ownerName ? '<div style="font-size:12px;color:var(--text-muted);">' + u.ownerName + '</div>' : '') + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:24px;">' +
          '<div style="text-align:right;"><div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Net Balance</div><div style="font-size:16px;font-weight:800;color:' + netColor + ';">' + (net >= 0 ? '+' : '-') + 'RS ' + Math.abs(net).toLocaleString('en-IN') + '</div></div>' +
          '<div style="display:flex;gap:12px;font-size:12px;"><div style="text-align:center;"><div style="color:var(--text-muted);font-size:10px;text-transform:uppercase;">DR</div><div style="font-weight:700;color:var(--red);">RS ' + u.totalDR.toLocaleString('en-IN') + '</div></div><div style="text-align:center;"><div style="color:var(--text-muted);font-size:10px;text-transform:uppercase;">CR</div><div style="font-weight:700;color:var(--green);">RS ' + u.totalCR.toLocaleString('en-IN') + '</div></div></div>' +
          '<span style="font-size:18px;color:var(--text-muted);" id="ulAcc' + idx + 'Arrow">▼</span>' +
        '</div>' +
      '</div>' +
      '<div id="ulAcc' + idx + '" style="overflow:hidden;max-height:0;transition:max-height 0.3s ease;">' +
        '<table class="table" style="margin:0;"><thead><tr><th style="width:100px;">Date</th><th>Narration</th><th style="width:120px;">Ref #</th><th style="text-align:right;width:110px;">Debit (DR)</th><th style="text-align:right;width:110px;">Credit (CR)</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '<tfoot><tr style="background:var(--bg-elevated);font-weight:800;border-top:2px solid var(--border);"><td colspan="3" style="font-size:12px;color:var(--text-secondary);">TOTALS (' + u.entries.length + ' entries)</td><td style="text-align:right;color:var(--red);">RS ' + u.totalDR.toLocaleString('en-IN') + '</td><td style="text-align:right;color:var(--green);">RS ' + u.totalCR.toLocaleString('en-IN') + '</td></tr></tfoot>' +
        '</table>' +
      '</div>' +
    '</div>';
  }).join('');
};

window.toggleUnitLedgerAccordion = function(id) {
  var el    = document.getElementById(id);
  var arrow = document.getElementById(id + 'Arrow');
  if (!el) return;
  var isOpen = el.style.maxHeight && el.style.maxHeight !== '0px';
  el.style.maxHeight = isOpen ? '0px' : '2000px';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
};

// =============================================
// FUND-HEAD BREAKDOWN RENDERER
// =============================================
window.renderLedgerFundwise = function() {
  var container = document.getElementById('ledgerFundwiseContainer');
  if (!container) return;

  var list = window.__ledgerFiltered || [];

  var fundMap = {};
  list.forEach(function(e) {
    var key = e.fundHead || 'General Fund';
    if (!fundMap[key]) fundMap[key] = { name: key, entries: [], totalDR: 0, totalCR: 0 };
    fundMap[key].entries.push(e);
    fundMap[key].totalDR += e.debit;
    fundMap[key].totalCR += e.credit;
  });

  var funds = Object.values(fundMap).sort(function(a, b) { return (b.totalCR + b.totalDR) - (a.totalCR + a.totalDR); });

  if (funds.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);"><div style="font-size:32px;margin-bottom:10px;">🏦</div><div style="font-weight:600;">No entries found for selected filters</div></div>';
    return;
  }

  var maxTotal = Math.max.apply(null, funds.map(function(f) { return f.totalCR + f.totalDR; }).concat([1]));
  var COLORS = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#84CC16','#F97316','#6366F1'];

  var cards = funds.map(function(f, i) {
    var net = f.totalCR - f.totalDR;
    var pct = Math.round(((f.totalCR + f.totalDR) / maxTotal) * 100);
    var color = COLORS[i % COLORS.length];
    return '<div class="card" style="padding:18px;border-left:4px solid ' + color + ';">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">' +
        '<div><div style="font-size:15px;font-weight:700;">' + f.name + '</div><div style="font-size:12px;color:var(--text-muted);">' + f.entries.length + ' transactions</div></div>' +
        '<div style="text-align:right;"><div style="font-size:18px;font-weight:800;color:' + (net >= 0 ? 'var(--green)' : 'var(--red)') + ';">' + (net >= 0 ? '+' : '-') + 'RS ' + Math.abs(net).toLocaleString('en-IN') + '</div><div style="font-size:11px;color:var(--text-muted);">Net</div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">' +
        '<div style="background:rgba(239,68,68,0.06);border-radius:var(--r-md);padding:10px 14px;"><div style="font-size:10px;color:var(--red);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Total Debits</div><div style="font-size:16px;font-weight:800;color:var(--red);">RS ' + f.totalDR.toLocaleString('en-IN') + '</div></div>' +
        '<div style="background:rgba(16,185,129,0.06);border-radius:var(--r-md);padding:10px 14px;"><div style="font-size:10px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:4px;">Total Credits</div><div style="font-size:16px;font-weight:800;color:var(--green);">RS ' + f.totalCR.toLocaleString('en-IN') + '</div></div>' +
      '</div>' +
      '<div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px;"><span>Volume share</span><span>' + pct + '%</span></div>' +
        '<div class="progress-bar"><div style="width:' + pct + '%;height:6px;border-radius:3px;background:' + color + ';transition:width 0.6s ease;"></div></div></div>' +
    '</div>';
  }).join('');

  container.innerHTML = '<div class="mini-grid-4" style="gap:16px;">' + cards + '</div>';
};

// =============================================
// Filter Event Handlers
// =============================================
window.handleLedgerSearch = function(q) {
  window.__ledgerSearchQuery = q;
  window.applyLedgerFilters();
};

window.handleLedgerDateChange = function() {
  window.__ledgerDateFrom = (document.getElementById('ledgerDateFrom') || {}).value || '';
  window.__ledgerDateTo   = (document.getElementById('ledgerDateTo')   || {}).value || '';
  window.applyLedgerFilters();
};

window.handleLedgerTypeFilter = function(val) {
  window.__ledgerTypeFilter = val;
  window.applyLedgerFilters();
};

window.handleLedgerUnitFilter = function(val) {
  window.__ledgerUnitFilter = val;
  window.applyLedgerFilters();
};

window.toggleLedgerSortOrder = function() {
  window.__ledgerSortOrder = window.__ledgerSortOrder === 'desc' ? 'asc' : 'desc';
  var btn = document.getElementById('ledgerSortBtn');
  if (btn) {
    btn.textContent = window.__ledgerSortOrder === 'desc' ? '⬆️ Newest First' : '⬇️ Oldest First';
  }
  window.applyLedgerFilters();
};

window.resetLedgerFilters = function() {
  var today = new Date();
  var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  var fmt = function(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  };

  window.__ledgerSearchQuery = '';
  window.__ledgerDateFrom    = fmt(firstOfMonth);
  window.__ledgerDateTo      = fmt(today);
  window.__ledgerTypeFilter  = 'ALL';
  window.__ledgerUnitFilter  = 'ALL';
  window.__ledgerSortOrder   = 'asc';

  var si = document.getElementById('ledgerSearchInput');  if (si)  si.value  = '';
  var df = document.getElementById('ledgerDateFrom');     if (df)  df.value  = fmt(firstOfMonth);
  var dt = document.getElementById('ledgerDateTo');       if (dt)  dt.value  = fmt(today);
  var tf = document.getElementById('ledgerTypeFilter');   if (tf)  tf.value  = 'ALL';
  var uf = document.getElementById('ledgerUnitFilter');   if (uf)  uf.value  = 'ALL';
  var sb = document.getElementById('ledgerSortBtn');      if (sb)  sb.textContent = '⬇️ Oldest First';

  window.applyLedgerFilters();
};

// =============================================
// Export to CSV
// =============================================
window.exportLedgerCSV = function() {
  var list = window.__ledgerFiltered || window.__ledgerEntries || [];
  if (!list.length) {
    if (typeof showToast === 'function') showToast('No entries to export', 'warning');
    return;
  }

  var fmtDate = function(d) { return d ? new Date(d).toLocaleDateString('en-IN') : ''; };
  var headers = ['Date','Type','DR/CR','Narration','Unit','Owner','Reference #','Debit (INR)','Credit (INR)','Fund Head'];
  var rows = list.map(function(e) {
    return [
      fmtDate(e.date), e.type, e.drCr,
      '"' + (e.narration || '').replace(/"/g,'""') + '"',
      e.unitNumber || '',
      '"' + (e.ownerName || '').replace(/"/g,'""') + '"',
      e.refNumber || '',
      e.debit || 0, e.credit || 0,
      '"' + (e.fundHead || '').replace(/"/g,'""') + '"',
    ].join(',');
  });

  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var link = document.createElement('a');
  var orgName = (localStorage.getItem('rwa_active_org_name') || 'Society').replace(/\s+/g,'_');
  var today   = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = orgName + '_Ledger_' + today + '.csv';
  link.click();
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Ledger exported: ' + list.length + ' entries', 'success');
};

// =============================================
// Print Ledger
// =============================================
window.printLedger = function() {
  var list = window.__ledgerFiltered || window.__ledgerEntries || [];
  var orgName  = localStorage.getItem('rwa_active_org_name') || 'Residents Welfare Association';
  var fromDate = window.__ledgerDateFrom || 'All';
  var toDate   = window.__ledgerDateTo   || 'Date';

  var totalCR = list.filter(function(e) { return e.drCr === 'CR'; }).reduce(function(s, e) { return s + e.credit; }, 0);
  var totalDR = list.filter(function(e) { return e.drCr === 'DR'; }).reduce(function(s, e) { return s + e.debit;  }, 0);
  var net = totalCR - totalDR;

  var fmtDate = function(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; };

  var runBal = 0;
  var rows = list.map(function(e) {
    runBal += e.credit - e.debit;
    return '<tr><td>' + fmtDate(e.date) + '</td><td>' + e.type + '</td><td>' + (e.narration || '') + '</td><td>' + (e.unitNumber || '') + '</td><td>' + (e.refNumber || '') + '</td><td style="text-align:right;color:#dc2626;">' + (e.debit > 0 ? 'RS ' + e.debit.toLocaleString('en-IN') : '—') + '</td><td style="text-align:right;color:#16a34a;">' + (e.credit > 0 ? 'RS ' + e.credit.toLocaleString('en-IN') : '—') + '</td><td style="text-align:right;font-weight:700;color:' + (runBal >= 0 ? '#16a34a' : '#dc2626') + ';">' + (runBal >= 0 ? '+' : '-') + 'RS ' + Math.abs(runBal).toLocaleString('en-IN') + '</td></tr>';
  }).join('');

  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><title>' + orgName + ' - Ledger</title><style>body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:24px;}h1{font-size:20px;margin:0 0 4px;}.sub{color:#666;font-size:12px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;margin-top:12px;}th{background:#1e40af;color:#fff;padding:8px 10px;text-align:left;font-size:11px;}td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;}tr:nth-child(even) td{background:#f9fafb;}.summary{margin-top:16px;display:flex;gap:40px;}.summary-label{font-size:10px;text-transform:uppercase;color:#666;}.summary-val{font-size:18px;font-weight:900;}</style></head><body><h1>' + orgName + '</h1><div class="sub">Society Ledger  Period: ' + fromDate + ' to ' + toDate + '  Printed: ' + new Date().toLocaleDateString('en-IN') + '</div><table><thead><tr><th>Date</th><th>Type</th><th>Narration</th><th>Unit</th><th>Ref #</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead><tbody>' + rows + '</tbody></table><div class="summary"><div class="summary-item"><div class="summary-label">Total Credits</div><div class="summary-val" style="color:#16a34a;">RS ' + totalCR.toLocaleString('en-IN') + '</div></div><div class="summary-item"><div class="summary-label">Total Debits</div><div class="summary-val" style="color:#dc2626;">RS ' + totalDR.toLocaleString('en-IN') + '</div></div><div class="summary-item"><div class="summary-label">Net Balance</div><div class="summary-val" style="color:' + (net >= 0 ? '#16a34a' : '#dc2626') + ';">' + (net >= 0 ? '+' : '-') + 'RS ' + Math.abs(net).toLocaleString('en-IN') + '</div></div></div></body></html>');
  win.document.close();
  setTimeout(function() { win.print(); }, 400);
};

// =============================================
// Real-time WebSocket Synchronization
// =============================================
if (typeof window !== 'undefined' && window.socket) {
  window.socket.on('expense-status-updated', function() {
    if (typeof window.loadLiveLedger === 'function') window.loadLiveLedger();
  });
  window.socket.on('new-expense-recorded', function() {
    if (typeof window.loadLiveLedger === 'function') window.loadLiveLedger();
  });
  window.socket.on('payment-recorded', function() {
    if (typeof window.loadLiveLedger === 'function') window.loadLiveLedger();
  });
  window.socket.on('payment-success', function() {
    if (typeof window.loadLiveLedger === 'function') window.loadLiveLedger();
  });
  window.socket.on('invoice-generated', function() {
    if (typeof window.loadLiveLedger === 'function') window.loadLiveLedger();
  });
}

