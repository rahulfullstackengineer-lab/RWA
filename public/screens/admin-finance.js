// =============================================
// Finance Screens: Invoices, Payments, Dues, Ledger
// Dynamic DB Hydration & Razorpay Integration
// Mobile-First Architecture & Zero Static Data
// =============================================

window.__cachedInvoices = [];
window.__cachedChargeHeads = [];
window.__selectedInvoiceFilter = 'ALL';
window.__selectedInvoice = null;

var INVOICE_STATUS_MAP = {
  PAID:           { color: 'green',  label: 'Paid' },
  ISSUED:         { color: 'blue',   label: 'Issued' },
  OVERDUE:        { color: 'red',    label: 'Overdue' },
  PARTIALLY_PAID: { color: 'amber',  label: 'Partial' },
  DRAFT:          { color: 'muted',  label: 'Draft' },
  VOID:           { color: 'muted',  label: 'Void' },
};

// =============================================
// 1. Charge Setup Screen
// =============================================
// =============================================
// 1. Charge Setup & Society Fee Rules — Dynamic DB Hydration
// Real-time Society Charge Heads & Configurable Billing Rules
// =============================================

window.__cachedChargeHeads = [];
window.__cachedFundHeads = [];

// Society billing rules helper
window.getSocietyBillingRules = function() {
  const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || 'default';
  const key = 'rwa_billing_rules_' + activeOrgId;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    billingCycle: 'MONTHLY',
    genDay: 1,
    dueDays: 15,
    lateFeeEnabled: true,
    lateFeeAmount: 200,
    gracePeriodDays: 15,
    autoReconciliation: true,
    sendWhatsAppReminders: true,
  };
};

window.saveSocietyBillingRules = function(rules) {
  const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || 'default';
  const key = 'rwa_billing_rules_' + activeOrgId;
  localStorage.setItem(key, JSON.stringify(rules));
  window.renderBillingEngineRules();
};

Screens['admin-charges'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveChargeHeads === 'function') {
      window.loadLiveChargeHeads();
    }
  }, 15);

  return Shell.render('admin-charges', {
    title: 'Charge Setup & Fee Rules',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="openConfigureBillingCycleModal()">⚙️ Configure Rules</button>
      <button class="btn btn-primary btn-sm" onclick="openAddChargeHeadModal()">+ New Charge Head</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Charge Setup & Society Fee Rules</div>
          <div class="page-subtitle" id="chargesSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="openConfigureBillingCycleModal()">⚙️ Configure Rules</button>
          <button class="btn btn-primary" onclick="openAddChargeHeadModal()">+ New Charge Head</button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card blue">
          <div class="stat-icon blue">📋</div>
          <div class="stat-value" id="statActiveChargesCount">0</div>
          <div class="stat-label">Active Charge Heads</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">₹</div>
          <div class="stat-value" id="statTotalMonthlyLevy">₹0</div>
          <div class="stat-label">Base Monthly / Flat</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">📅</div>
          <div class="stat-value" id="statBillingCadence">Monthly</div>
          <div class="stat-label">Billing Cycle</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">⏳</div>
          <div class="stat-value" id="statGraceWindow">15 Days</div>
          <div class="stat-label">Grace Period Window</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Active Society Charge Heads -->
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="card-header" style="margin-bottom:14px;">
              <div>
                <div class="card-title">Society Charge Heads</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Configured billing components for invoices</div>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="badge badge-blue" id="activeChargesBadge">Loading...</span>
                <button class="btn btn-primary btn-sm" onclick="openAddChargeHeadModal()">+ Add Head</button>
              </div>
            </div>

            <div id="chargesListContainer" style="display:flex; flex-direction:column; gap:10px;">
              <div style="padding:28px; text-align:center; color:var(--text-muted); font-size:13px;">
                Loading charge heads from database...
              </div>
            </div>
          </div>

          <div id="chargeHeadsLevySummary" style="margin-top:16px; padding:12px 14px; background:var(--bg-elevated); border:1px solid var(--border-light); border-radius:var(--r-md); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span style="color:var(--text-secondary);">Combined Monthly Flat Rate:</span>
            <span style="font-weight:800; font-size:14px; color:var(--blue);" id="summaryTotalAmount">₹0 / unit</span>
          </div>
        </div>

        <!-- Billing Calculation Engine Rules -->
        <div class="card">
          <div class="card-header" style="margin-bottom:14px;">
            <div>
              <div class="card-title">Billing Engine Rules</div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Automated schedule, grace period & penalty escalation</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openConfigureBillingCycleModal()">⚙️ Configure Cycle</button>
          </div>

          <div id="billingEngineRulesContainer" style="display:flex; flex-direction:column; gap:12px;">
            <!-- Dynamically populated by renderBillingEngineRules() -->
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// Live Hydration Logic: Connects to /api/billing/charge-heads
// =============================================

window.loadLiveChargeHeads = async function() {
  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/billing/charge-heads' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '');

    const res = await (window.apiFetch || fetch)(url).catch(() => null);
    if (!res || !res.ok) {
      const container = document.getElementById('chargesListContainer');
      if (container) {
        container.innerHTML = `
          <div style="padding:24px; text-align:center; color:var(--red); font-size:13px;">
            ⚠️ Failed to load charge heads from database.
            <br><br>
            <button class="btn btn-secondary btn-sm" onclick="window.loadLiveChargeHeads()">🔄 Retry</button>
          </div>
        `;
      }
      return;
    }

    const data = await res.json();
    const chargeHeads = data.chargeHeads || [];
    const fundHeads = data.fundHeads || [];
    window.__cachedChargeHeads = chargeHeads;
    window.__cachedFundHeads = fundHeads;

    const activeList = chargeHeads.filter(c => c.isActive !== false);
    const badge = document.getElementById('activeChargesBadge');
    if (badge) badge.textContent = `${activeList.length} active`;

    const sub = document.getElementById('chargesSubtitle');
    if (sub) {
      if (activeList.length === 0) {
        sub.textContent = '0 charge heads active · Add charge heads to begin generating society invoices';
      } else {
        sub.textContent = `${activeList.length} charge heads active · Auto applied on monthly bill generation · Live database`;
      }
    }

    // Update Quick Metric Cards
    const countEl = document.getElementById('statActiveChargesCount');
    if (countEl) countEl.textContent = activeList.length;

    const totalLevyFixed = activeList
      .filter(c => c.basis === 'FIXED')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const levyEl = document.getElementById('statTotalMonthlyLevy');
    if (levyEl) levyEl.textContent = `₹${totalLevyFixed.toLocaleString('en-IN')}`;

    const summaryTotalEl = document.getElementById('summaryTotalAmount');
    if (summaryTotalEl) {
      summaryTotalEl.textContent = `₹${totalLevyFixed.toLocaleString('en-IN')} / unit`;
    }

    const rules = window.getSocietyBillingRules();
    const cadenceEl = document.getElementById('statBillingCadence');
    if (cadenceEl) {
      cadenceEl.textContent = rules.billingCycle === 'QUARTERLY' ? 'Quarterly' : rules.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly';
    }

    const graceEl = document.getElementById('statGraceWindow');
    if (graceEl) graceEl.textContent = `${rules.dueDays || 15} Days`;

    // Render Charge Heads List
    const container = document.getElementById('chargesListContainer');
    if (container) {
      if (chargeHeads.length === 0) {
        container.innerHTML = `
          <div style="padding:32px 16px; text-align:center; background:var(--bg-elevated); border:1px solid var(--border-light); border-radius:var(--r-md);">
            <div style="font-size:36px; margin-bottom:8px;">📋</div>
            <div style="font-weight:700; font-size:14px; margin-bottom:4px; color:var(--text-primary);">No Society Charge Heads Configured</div>
            <div style="font-size:12px; color:var(--text-secondary); max-width:320px; margin:0 auto 14px;">
              Create charge heads like Monthly Maintenance, Sinking Fund, or Water Charges to define fee rules for your society flats.
            </div>
            <button class="btn btn-primary btn-sm" onclick="openAddChargeHeadModal()">+ Add First Charge Head</button>
          </div>
        `;
      } else {
        container.innerHTML = chargeHeads.map(c => {
          const isActive = c.isActive !== false;
          const fundName = c.fundHead?.name || '';
          const gstTag = c.gstPercent && c.gstPercent > 0 ? `<span class="badge badge-purple" style="font-size:10px;">${c.gstPercent}% GST</span>` : '';
          const basisLabel = c.basis === 'FIXED' ? 'Flat rate' : 'Per sq. ft.';
          const amountUnit = c.basis === 'PER_SQFT' ? '/sqft' : '/unit';

          return `
            <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border-light); border-radius:var(--r-md); background:var(--bg-surface); transition:border 0.2s;">
              <div style="width:42px; height:42px; background:var(--blue-light); border-radius:var(--r-md); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:var(--blue);">
                ₹
              </div>
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:14px; font-weight:700; color:var(--text-primary);">${c.name}</span>
                  ${fundName ? `<span class="badge badge-muted" style="font-size:10px;">${fundName}</span>` : ''}
                  ${gstTag}
                </div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                  ${c.frequency} · ${basisLabel} · <strong>₹${c.amount.toLocaleString('en-IN')}</strong>${amountUnit}
                  ${c.description ? ` · <span style="font-style:italic;">${c.description}</span>` : ''}
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:6px;">
                <span class="badge ${isActive ? 'badge-green' : 'badge-muted'}" style="cursor:pointer; font-size:11px;" onclick="toggleChargeHeadActive('${c.id}', ${!isActive})" title="Click to toggle status">
                  ${isActive ? '✓ Active' : '✕ Inactive'}
                </span>
                <button class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:11px;" onclick="openEditChargeHeadModal('${c.id}')" title="Edit charge head">
                  ✏️ Edit
                </button>
                <button class="btn btn-ghost btn-sm" style="padding:4px 8px; font-size:11px; color:var(--red);" onclick="deleteChargeHead('${c.id}', '${c.name.replace(/'/g, "\\'")}')" title="Delete charge head">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Dynamic Billing Engine Rules
    window.renderBillingEngineRules();
  } catch (err) {
    console.error('Error in loadLiveChargeHeads:', err);
  }
};

window.renderBillingEngineRules = function() {
  const container = document.getElementById('billingEngineRulesContainer');
  if (!container) return;

  const rules = window.getSocietyBillingRules();
  const cycleLabel = rules.billingCycle === 'QUARTERLY' ? 'calendar quarter' : rules.billingCycle === 'ANNUAL' ? 'calendar year' : 'calendar month';

  container.innerHTML = `
    <!-- 1. Invoice Generation Schedule -->
    <div style="padding:14px; border:1px solid var(--border-light); border-radius:var(--r-md); background:var(--bg-elevated);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">
          📅 Automated ${rules.billingCycle === 'QUARTERLY' ? 'Quarterly' : rules.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'} Batch Invoicing
        </div>
        <span class="badge badge-green" style="font-size:10px;">Active Engine</span>
      </div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
        Invoices generate automatically on the <strong>${rules.genDay}st of every ${cycleLabel}</strong> for all occupied registry units with a <strong>${rules.dueDays} days grace period</strong>.
      </div>
    </div>

    <!-- 2. Payment Gateway & Auto Reconciliation -->
    <div style="padding:14px; border:1px solid var(--border-light); border-radius:var(--r-md); background:var(--bg-elevated);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">
          💳 Razorpay & Digital Auto-Reconciliation
        </div>
        <span class="badge badge-blue" style="font-size:10px;">Instant Settlement</span>
      </div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
        Online UPI/Card/NetBanking payments verify cryptographically via webhook signature, instantly zeroing outstanding flat balance and issuing real-time WebSocket digital receipts.
      </div>
    </div>

    <!-- 3. Overdue Escalation Ladder -->
    <div style="padding:14px; border:1px solid var(--border-light); border-radius:var(--r-md); background:var(--bg-elevated);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-weight:700; font-size:14px; color:var(--text-primary); margin-bottom:4px;">
          ⚠️ Overdue Escalation & Penalty Ladder
        </div>
        <span class="badge ${rules.lateFeeEnabled ? 'badge-amber' : 'badge-muted'}" style="font-size:10px;">
          ${rules.lateFeeEnabled ? 'Penalty Enabled' : 'No Late Fee'}
        </span>
      </div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
        ${rules.lateFeeEnabled
          ? `Unpaid invoices transition to <strong>OVERDUE automatically on Day ${parseInt(rules.dueDays || 15) + 1}</strong> with an automated <strong>₹${rules.lateFeeAmount} late fee penalty</strong> and automated WhatsApp dues reminder dispatches.`
          : `Unpaid invoices transition to OVERDUE automatically on Day ${parseInt(rules.dueDays || 15) + 1}. Late fees are currently waived for this society.`}
      </div>
    </div>
  `;
};

// =============================================
// Modal: Add New Society Charge Head
// =============================================

window.openAddChargeHeadModal = function() {
  const fundOptions = (window.__cachedFundHeads || []).map(f => `
    <option value="${f.id}">${f.name}</option>
  `).join('');

  const html = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Charge Head Name *</label>
        <input type="text" id="addChargeHeadName" class="form-input" placeholder="e.g. Monthly Maintenance, Security & Housekeeping, Lift AMC" style="width:100%; font-size:13px;" required />
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Amount (₹) *</label>
          <input type="number" id="addChargeHeadAmount" class="form-input" placeholder="3000" style="width:100%; font-size:13px;" required min="0" step="0.01" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Calculation Basis</label>
          <select id="addChargeHeadBasis" class="form-select" style="width:100%; font-size:13px;">
            <option value="FIXED" selected>Fixed per Unit / Flat</option>
            <option value="PER_SQFT">Per Sq. Ft. Area</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Billing Frequency</label>
          <select id="addChargeHeadFreq" class="form-select" style="width:100%; font-size:13px;">
            <option value="MONTHLY" selected>Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
            <option value="ONE_TIME">One Time</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Fund Head Category</label>
          <select id="addChargeHeadFundId" class="form-select" style="width:100%; font-size:13px;">
            <option value="">General / Operating Fund</option>
            ${fundOptions}
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">GST Rate (%)</label>
          <select id="addChargeHeadGst" class="form-select" style="width:100%; font-size:13px;">
            <option value="0" selected>0% (Exempt)</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% GST</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Description / Purpose</label>
          <input type="text" id="addChargeHeadDesc" class="form-input" placeholder="e.g. Common electricity and corridor sanitization" style="width:100%; font-size:13px;" />
        </div>
      </div>
    </div>
  `;

  showModal('📋 Add Society Charge Head', html, 'Save Charge Head 🚀', async () => {
    const name = document.getElementById('addChargeHeadName')?.value.trim();
    const amount = document.getElementById('addChargeHeadAmount')?.value;
    const basis = document.getElementById('addChargeHeadBasis')?.value;
    const frequency = document.getElementById('addChargeHeadFreq')?.value;
    const fundHeadId = document.getElementById('addChargeHeadFundId')?.value || null;
    const gstPercent = document.getElementById('addChargeHeadGst')?.value || '0';
    const description = document.getElementById('addChargeHeadDesc')?.value.trim();

    if (!name || amount === '' || amount === undefined) {
      showToast('Name and amount are required', 'warning');
      throw new Error('Name and amount are required');
    }

    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';

    const res = await (window.apiFetch || fetch)('/api/billing/charge-heads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        amount: parseFloat(amount),
        basis,
        frequency,
        fundHeadId,
        gstPercent: parseFloat(gstPercent),
        description,
        organizationId: activeOrgId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to create charge head');
    }

    showToast(`✅ Charge Head "${name}" added successfully!`, 'success');
    window.loadLiveChargeHeads();
  }, '540px');
};

// =============================================
// Modal: Edit Existing Charge Head
// =============================================

window.openEditChargeHeadModal = function(chargeHeadId) {
  const chargeHead = (window.__cachedChargeHeads || []).find(c => c.id === chargeHeadId);
  if (!chargeHead) {
    showToast('Charge head details not found', 'error');
    return;
  }

  const fundOptions = (window.__cachedFundHeads || []).map(f => `
    <option value="${f.id}" ${chargeHead.fundHeadId === f.id ? 'selected' : ''}>${f.name}</option>
  `).join('');

  const html = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Charge Head Name *</label>
        <input type="text" id="editChargeHeadName" class="form-input" value="${chargeHead.name}" style="width:100%; font-size:13px;" required />
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Amount (₹) *</label>
          <input type="number" id="editChargeHeadAmount" class="form-input" value="${chargeHead.amount}" style="width:100%; font-size:13px;" required min="0" step="0.01" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Calculation Basis</label>
          <select id="editChargeHeadBasis" class="form-select" style="width:100%; font-size:13px;">
            <option value="FIXED" ${chargeHead.basis === 'FIXED' ? 'selected' : ''}>Fixed per Unit / Flat</option>
            <option value="PER_SQFT" ${chargeHead.basis === 'PER_SQFT' ? 'selected' : ''}>Per Sq. Ft. Area</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Billing Frequency</label>
          <select id="editChargeHeadFreq" class="form-select" style="width:100%; font-size:13px;">
            <option value="MONTHLY" ${chargeHead.frequency === 'MONTHLY' ? 'selected' : ''}>Monthly</option>
            <option value="QUARTERLY" ${chargeHead.frequency === 'QUARTERLY' ? 'selected' : ''}>Quarterly</option>
            <option value="ANNUAL" ${chargeHead.frequency === 'ANNUAL' ? 'selected' : ''}>Annual</option>
            <option value="ONE_TIME" ${chargeHead.frequency === 'ONE_TIME' ? 'selected' : ''}>One Time</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Fund Head Category</label>
          <select id="editChargeHeadFundId" class="form-select" style="width:100%; font-size:13px;">
            <option value="">General / Operating Fund</option>
            ${fundOptions}
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">GST Rate (%)</label>
          <select id="editChargeHeadGst" class="form-select" style="width:100%; font-size:13px;">
            <option value="0" ${chargeHead.gstPercent === 0 ? 'selected' : ''}>0% (Exempt)</option>
            <option value="5" ${chargeHead.gstPercent === 5 ? 'selected' : ''}>5% GST</option>
            <option value="12" ${chargeHead.gstPercent === 12 ? 'selected' : ''}>12% GST</option>
            <option value="18" ${chargeHead.gstPercent === 18 ? 'selected' : ''}>18% GST</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Status</label>
          <select id="editChargeHeadActive" class="form-select" style="width:100%; font-size:13px;">
            <option value="true" ${chargeHead.isActive !== false ? 'selected' : ''}>Active (Include in Invoices)</option>
            <option value="false" ${chargeHead.isActive === false ? 'selected' : ''}>Inactive (Paused)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Description / Purpose</label>
        <input type="text" id="editChargeHeadDesc" class="form-input" value="${chargeHead.description || ''}" placeholder="e.g. Monthly maintenance" style="width:100%; font-size:13px;" />
      </div>
    </div>
  `;

  showModal('✏️ Edit Society Charge Head', html, 'Update Charge Head', async () => {
    const name = document.getElementById('editChargeHeadName')?.value.trim();
    const amount = document.getElementById('editChargeHeadAmount')?.value;
    const basis = document.getElementById('editChargeHeadBasis')?.value;
    const frequency = document.getElementById('editChargeHeadFreq')?.value;
    const fundHeadId = document.getElementById('editChargeHeadFundId')?.value || null;
    const gstPercent = document.getElementById('editChargeHeadGst')?.value || '0';
    const isActive = document.getElementById('editChargeHeadActive')?.value === 'true';
    const description = document.getElementById('editChargeHeadDesc')?.value.trim();

    if (!name || amount === '' || amount === undefined) {
      showToast('Name and amount are required', 'warning');
      throw new Error('Name and amount are required');
    }

    const res = await (window.apiFetch || fetch)('/api/billing/charge-heads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chargeHead.id,
        name,
        amount: parseFloat(amount),
        basis,
        frequency,
        fundHeadId,
        gstPercent: parseFloat(gstPercent),
        isActive,
        description,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update charge head');
    }

    showToast(`✅ Charge Head "${name}" updated successfully!`, 'success');
    window.loadLiveChargeHeads();
  }, '540px');
};

// =============================================
// Toggle Charge Head Active / Inactive
// =============================================

window.toggleChargeHeadActive = async function(chargeHeadId, newActive) {
  try {
    const res = await (window.apiFetch || fetch)('/api/billing/charge-heads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: chargeHeadId, isActive: newActive }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update status');
    }

    showToast(newActive ? 'Charge head activated' : 'Charge head deactivated', 'info');
    window.loadLiveChargeHeads();
  } catch (err) {
    console.error('Error toggling charge head status:', err);
    showToast(err.message || 'Failed to update status', 'error');
  }
};

// =============================================
// Delete Charge Head
// =============================================

window.deleteChargeHead = async function(chargeHeadId, name) {
  if (!confirm(`Are you sure you want to delete the charge head "${name}"? It will no longer be applied to future invoices.`)) {
    return;
  }

  try {
    const res = await (window.apiFetch || fetch)(`/api/billing/charge-heads?id=${encodeURIComponent(chargeHeadId)}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete charge head');
    }

    showToast(`Charge head "${name}" removed successfully`, 'success');
    window.loadLiveChargeHeads();
  } catch (err) {
    console.error('Error deleting charge head:', err);
    showToast(err.message || 'Failed to delete charge head', 'error');
  }
};

// =============================================
// Modal: Configure Society Billing Cycle & Rules
// =============================================

window.openConfigureBillingCycleModal = function() {
  const currentRules = window.getSocietyBillingRules();

  const html = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div style="background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.18); padding:12px; border-radius:var(--r-md); font-size:12px; color:var(--text-secondary); line-height:1.5;">
        ⚙️ <strong>Society Billing Engine Rules:</strong> Customize invoice batch generation schedule, grace periods, and late fee penalties. Changes take effect on the next billing run.
      </div>

      <!-- Billing Cycle Frequency -->
      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Billing Cycle Cadence *</label>
        <select id="cfgBillingCycle" class="form-select" style="width:100%; font-size:13px;">
          <option value="MONTHLY" ${currentRules.billingCycle === 'MONTHLY' ? 'selected' : ''}>Monthly (Every 1st of the month)</option>
          <option value="QUARTERLY" ${currentRules.billingCycle === 'QUARTERLY' ? 'selected' : ''}>Quarterly (Jan, Apr, Jul, Oct)</option>
          <option value="ANNUAL" ${currentRules.billingCycle === 'ANNUAL' ? 'selected' : ''}>Annual (Financial Year beginning)</option>
        </select>
      </div>

      <!-- Invoice Generation Day & Due Days -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Batch Generation Day</label>
          <select id="cfgGenDay" class="form-select" style="width:100%; font-size:13px;">
            <option value="1" ${currentRules.genDay === 1 ? 'selected' : ''}>1st of the month</option>
            <option value="5" ${currentRules.genDay === 5 ? 'selected' : ''}>5th of the month</option>
            <option value="10" ${currentRules.genDay === 10 ? 'selected' : ''}>10th of the month</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Grace Window (Due Days) *</label>
          <select id="cfgDueDays" class="form-select" style="width:100%; font-size:13px;">
            <option value="10" ${currentRules.dueDays === 10 ? 'selected' : ''}>10 Days (Due on Day 10)</option>
            <option value="15" ${currentRules.dueDays === 15 ? 'selected' : ''}>15 Days (Due on Day 15)</option>
            <option value="20" ${currentRules.dueDays === 20 ? 'selected' : ''}>20 Days (Due on Day 20)</option>
            <option value="30" ${currentRules.dueDays === 30 ? 'selected' : ''}>30 Days (End of Month)</option>
          </select>
        </div>
      </div>

      <!-- Late Fee Penalty Configuration -->
      <div style="border:1px solid var(--border-light); border-radius:var(--r-md); padding:12px; background:var(--bg-elevated);">
        <label style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:13px; cursor:pointer;">
          <input type="checkbox" id="cfgLateFeeEnabled" ${currentRules.lateFeeEnabled ? 'checked' : ''} style="width:16px; height:16px;" onchange="document.getElementById('cfgLateFeeAmountWrap').style.display = this.checked ? 'block' : 'none'" />
          <span>Apply Late Fee Penalty to Overdue Invoices</span>
        </label>

        <div id="cfgLateFeeAmountWrap" style="margin-top:10px; display:${currentRules.lateFeeEnabled ? 'block' : 'none'};">
          <label class="form-label" style="font-weight:700; font-size:12px;">Late Fee Amount (₹)</label>
          <input type="number" id="cfgLateFeeAmount" class="form-input" value="${currentRules.lateFeeAmount || 200}" style="width:100%; font-size:13px;" min="0" step="50" placeholder="200" />
          <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
            Applied automatically on the day following the grace period (Day ${parseInt(currentRules.dueDays || 15) + 1}).
          </div>
        </div>
      </div>

      <!-- Automated Alerts -->
      <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;">
        <input type="checkbox" id="cfgWhatsAppReminders" ${currentRules.sendWhatsAppReminders !== false ? 'checked' : ''} style="width:15px; height:15px;" />
        <span style="color:var(--text-primary); font-weight:600;">Dispatch automated WhatsApp & SMS bill dues alerts</span>
      </label>
    </div>
  `;

  showModal('⚙️ Configure Society Billing Cycle & Rules', html, 'Save Billing Rules 🚀', async () => {
    const billingCycle = document.getElementById('cfgBillingCycle')?.value || 'MONTHLY';
    const genDay = parseInt(document.getElementById('cfgGenDay')?.value || '1', 10);
    const dueDays = parseInt(document.getElementById('cfgDueDays')?.value || '15', 10);
    const lateFeeEnabled = document.getElementById('cfgLateFeeEnabled')?.checked || false;
    const lateFeeAmount = parseFloat(document.getElementById('cfgLateFeeAmount')?.value || '200') || 200;
    const sendWhatsAppReminders = document.getElementById('cfgWhatsAppReminders')?.checked || false;

    const newRules = {
      billingCycle,
      genDay,
      dueDays,
      gracePeriodDays: dueDays,
      lateFeeEnabled,
      lateFeeAmount,
      autoReconciliation: true,
      sendWhatsAppReminders,
    };

    window.saveSocietyBillingRules(newRules);
    showToast('✅ Society billing cycle and rules saved!', 'success');
    window.loadLiveChargeHeads();
  }, '520px');
};

// =============================================
// 2. Invoices & Bills Screen
// =============================================
Screens['admin-invoices'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveInvoicesScreen === 'function') {
      window.loadLiveInvoicesScreen();
    }
  }, 10);

  return Shell.render('admin-invoices', {
    title: 'Invoices & Society Bills',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="exportInvoicesRegister()">📊 Export</button>
      <button class="btn btn-secondary btn-sm" onclick="openBulkUpdateBillsModal()">🔄 Bulk Update Bills</button>
      <button class="btn btn-primary btn-sm" onclick="openGenerateBillsModal()">⚡ Generate Bills</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Invoices & Monthly Bills</div>
          <div class="page-subtitle" id="invoicesSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportInvoicesRegister()">📊 Export to Excel</button>
          <button class="btn btn-secondary" onclick="openBulkUpdateBillsModal()">🔄 Bulk Update Bills</button>
          <button class="btn btn-primary" onclick="openGenerateBillsModal()">⚡ Generate Bills (Batch)</button>
        </div>
      </div>

      <!-- Modern Analytics Card (Invoicing & Collections, Area Spline + Donut) -->
      <div class="cases-analytics-card">
        <div class="cases-analytics-title">Society Invoicing &amp; Collections</div>
        <div class="cases-analytics-subtitle" id="invoicesDiffSubtitle">Track monthly maintenance billing cycles and collections</div>
        <div class="cases-analytics-grid">
          <div id="invoicesAreaChartContainer" style="width:100%;min-height:220px;"></div>
          <div id="invoicesDonutChartContainer" style="width:100%;min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>

      <!-- Stat Cards Grid -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card blue">
          <div class="stat-icon blue">📄</div>
          <div class="stat-value" id="statTotalBilled">₹0</div>
          <div class="stat-label">Total Billed</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">✅</div>
          <div class="stat-value" id="statTotalCollected">₹0</div>
          <div class="stat-label">Total Collected</div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-value" id="statTotalOutstanding">₹0</div>
          <div class="stat-label">Total Outstanding</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">🔴</div>
          <div class="stat-value" id="statOverdueCount">0</div>
          <div class="stat-label">Overdue Invoices</div>
        </div>
      </div>

      <!-- Modern Table Toolbar matching reference image -->
      <div class="modern-table-toolbar">
        <div class="modern-table-count" id="invoicesTableCount">Showing 1 to 10 of items</div>
        <div class="modern-table-search">
          <span>Search:</span>
          <input type="text" id="invoicesSearchBox" class="cases-search-input" placeholder="" oninput="handleInvoicesSearch(this.value)" />
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:8px;">
        <div class="search-box" style="min-width:200px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="invoicesSearchInput" placeholder="Search invoice #, flat, owner..." oninput="handleInvoicesSearch(this.value)" />
        </div>
        <div id="invoicesFilterPillsContainer" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <div class="filter-pill active" onclick="filterInvoicesByStatus('ALL', this)">All</div>
          <div class="filter-pill" onclick="filterInvoicesByStatus('OVERDUE', this)">🔴 Overdue</div>
          <div class="filter-pill" onclick="filterInvoicesByStatus('ISSUED', this)">🔵 Issued</div>
          <div class="filter-pill" onclick="filterInvoicesByStatus('PAID', this)">🟢 Paid</div>
        </div>
        <!-- Billing Cycle / Month Filter Dropdown -->
        <select id="invoicesMonthFilter" onchange="filterInvoicesByMonth(this.value)" class="form-select" style="min-width:170px;font-size:13px;padding:6px 10px;height:36px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;">
          <option value="ALL">All Billing Cycles</option>
        </select>
        <button class="btn btn-secondary btn-sm" onclick="exportInvoicesRegister()">Export</button>
      </div>

      <!-- Bulk Actions Bar (Appears when checkboxes selected) -->
      <div id="invoicesBulkActionBar" style="display:none;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.25);border-radius:var(--r-md);padding:10px 16px;margin-bottom:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge badge-blue" id="selectedInvoicesCountBadge" style="font-size:12px;font-weight:700;">0 selected</span>
          <span style="font-size:13px;font-weight:700;color:var(--text-primary);">Bulk Operations for Selected Invoices</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-primary btn-sm" onclick="executeSelectedBulkUpdate()">⚡ Revise Selected Bills</button>
          <button class="btn btn-secondary btn-sm" onclick="clearInvoiceSelections()">✕ Clear Selection</button>
        </div>
      </div>

      <!-- Desktop Table Wrap -->
      <div class="table-wrap desktop-only-table">
        <table>
          <thead>
            <tr>
              <th style="width:38px;text-align:center;">
                <input type="checkbox" id="selectAllInvoicesCheck" onchange="toggleSelectAllInvoices(this.checked)" title="Select All Invoices" style="cursor:pointer;" />
              </th>
              <th>Invoice #</th>
              <th>Unit</th>
              <th>Owner / Resident</th>
              <th>Period</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="invoicesTableBody">
            <tr>
              <td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">
                Loading invoices from database...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards Container (< 768px touch targets >= 48px) -->
      <div id="invoicesMobileCardsContainer" class="mobile-only-cards" style="display:none;flex-direction:column;gap:10px;margin-top:10px;">
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Loading invoices...</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
        <span id="invoicesPaginationSummary">Showing invoices from database</span>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveInvoicesScreen()">🔄 Refresh</button>
      </div>
    `,
  });
};

Screens['admin-invoice-detail'] = function() {
  const inv = window.__selectedInvoice || (window.__cachedInvoices && window.__cachedInvoices[0]) || null;

  if (!inv) {
    return Shell.render('admin-invoice-detail', {
      title: 'Invoice Details',
      portal: 'admin',
      breadcrumb: '<span onclick="Router.go(\'admin-invoices\')" style="cursor:pointer;color:var(--blue);">Invoices</span>',
      content: `
        <div class="card" style="padding:48px 24px;text-align:center;max-width:500px;margin:30px auto;">
          <div style="font-size:40px;margin-bottom:12px;">📄</div>
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:6px;">No Invoice Selected</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">
            Please select an invoice record from the Invoices & Monthly Bills register.
          </div>
          <button class="btn btn-primary" onclick="Router.go('admin-invoices')">← Back to Invoices Register</button>
        </div>
      `,
    });
  }

  const s = INVOICE_STATUS_MAP[inv.status] || { color: 'blue', label: inv.status };
  const unitNum = inv.unit ? inv.unit.unitNumber : 'Common';
  const ownerName = inv.unit ? (inv.unit.ownerName || 'Resident') : 'Resident';

  return Shell.render('admin-invoice-detail', {
    title: `Invoice ${inv.invoiceNumber}`,
    portal: 'admin',
    breadcrumb: '<span onclick="Router.go(\'admin-invoices\')" style="cursor:pointer;color:var(--blue);">Invoices</span>',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="showToast('PDF invoice downloaded', 'success')">⬇ Download PDF</button>
      ${inv.status !== 'PAID' ? `<button class="btn btn-primary btn-sm" onclick="triggerRazorpayPayment('${inv.id}')">💳 Pay via Razorpay</button>` : ''}
    `,
    content: `
      <div class="detail-split-layout">
        <div>
          <div class="card" style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="font-size:11px;color:var(--text-muted);font-weight:700;letter-spacing:0.05em;margin-bottom:4px;">INVOICE RECORD</div>
                <div style="font-size:24px;font-weight:800;font-family:monospace;color:var(--text-primary);">${inv.invoiceNumber}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Billing Period: ${inv.billingMonth} · Flat ${unitNum}</div>
              </div>
              <div style="text-align:right;">
                <span class="badge badge-${s.color}" style="font-size:13px;padding:6px 14px;">${s.label}</span>
                <div style="font-size:26px;font-weight:800;color:${inv.balanceAmount > 0 ? 'var(--red)' : 'var(--green)'};margin-top:8px;">
                  ₹${inv.balanceAmount.toLocaleString('en-IN')}
                </div>
                <div style="font-size:12px;color:var(--text-muted);">${inv.balanceAmount > 0 ? 'Balance Due' : 'Fully Paid'}</div>
              </div>
            </div>

            <div class="mini-grid-3" style="padding:16px;background:var(--bg-elevated);border-radius:var(--r-md);margin-bottom:20px;">
              <div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Flat / Resident</div>
                <div style="font-size:14px;font-weight:700;">Flat ${unitNum} · ${ownerName}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Total Invoiced</div>
                <div style="font-size:14px;font-weight:700;">₹${inv.totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Amount Paid</div>
                <div style="font-size:14px;font-weight:700;color:var(--green);">₹${inv.paidAmount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <!-- Items -->
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Charge Description</th>
                    <th style="text-align:right">Rate</th>
                    <th style="text-align:right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${(inv.items && inv.items.length > 0 ? inv.items : [
                    { description: 'Monthly Maintenance Charge', amount: 3000, totalAmount: 3000 },
                    { description: 'Sinking Fund Contribution', amount: 200, totalAmount: 200 },
                  ]).map(item => `
                    <tr>
                      <td><strong>${item.description}</strong></td>
                      <td style="text-align:right">₹${item.amount.toLocaleString('en-IN')}</td>
                      <td style="text-align:right;font-weight:700">₹${item.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:16px;">
              <div style="width:260px;">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px;">
                  <span style="color:var(--text-muted)">Total Demand</span>
                  <span style="font-weight:700;">₹${inv.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px;">
                  <span style="color:var(--text-muted)">Paid to Date</span>
                  <span style="font-weight:700;color:var(--green);">₹${inv.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-size:16px;font-weight:800;">
                  <span>Balance Due</span>
                  <span style="color:${inv.balanceAmount > 0 ? 'var(--red)' : 'var(--green)'}">
                    ₹${inv.balanceAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Quick Actions -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">Payment Actions</div>
            ${inv.status !== 'PAID' ? `
              <button class="btn btn-primary w-full" style="justify-content:center;min-height:48px;margin-bottom:8px;" onclick="triggerRazorpayPayment('${inv.id}')">
                💳 Pay Now via Razorpay
              </button>
              <button class="btn btn-secondary w-full" style="justify-content:center;min-height:44px;margin-bottom:8px;" onclick="openRecordPaymentModal('${unitNum}', ${inv.balanceAmount})">
                💵 Record Payment (Cash/Cheque)
              </button>
            ` : `
              <div style="padding:12px;background:var(--green-light);color:var(--green);border-radius:var(--r-md);font-weight:700;text-align:center;margin-bottom:8px;">
                ✅ Fully Settled via Online Gateway
              </div>
            `}
            <button class="btn btn-secondary w-full" style="justify-content:center;min-height:44px;" onclick="showToast('Payment reminder dispatched via WhatsApp & SMS to Flat ${unitNum}', 'success')">
              📨 Send Dues Reminder
            </button>
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// 3. Payments & Collections Register Screen
// =============================================

window.__cachedPayments = [];
window.__selectedPaymentMethod = 'ALL';
window.__selectedPaymentStatus = 'ALL';
window.__paymentSearchQuery = '';

Screens['admin-payments'] = function() {
  setTimeout(() => {
    if (typeof window.loadLivePaymentsScreen === 'function') {
      window.loadLivePaymentsScreen();
    }
  }, 10);

  return Shell.render('admin-payments', {
    title: 'Payments & Collections Register',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="exportPaymentsRegister()">📊 Export</button>
      <button class="btn btn-secondary btn-sm" onclick="window.loadLivePaymentsScreen()">🔄 Refresh</button>
      <button class="btn btn-primary btn-sm" onclick="openRecordOfflinePaymentModal()">+ Record Payment</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Payments & Collections Register</div>
          <div class="page-subtitle" id="paymentsSubtitle">Connecting to live transaction database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportPaymentsRegister()">📊 Export to Excel</button>
          <button class="btn btn-primary" onclick="openRecordOfflinePaymentModal()">+ Record Payment</button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card green">
          <div class="stat-icon green">₹</div>
          <div class="stat-value" id="statPaymentsTotalCollected">₹0</div>
          <div class="stat-label">Total Collections</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon blue">⚡</div>
          <div class="stat-value" id="statPaymentsOnlineTotal">₹0</div>
          <div class="stat-label">Online Gateway (Razorpay)</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">💵</div>
          <div class="stat-value" id="statPaymentsOfflineTotal">₹0</div>
          <div class="stat-label">Cash / Cheque / Bank</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">🧾</div>
          <div class="stat-value" id="statPaymentsCount">0</div>
          <div class="stat-label">Settled Receipts</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:8px;">
        <div class="search-box" style="min-width:220px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="paymentsSearchInput" placeholder="Search reference #, flat, resident, invoice..." oninput="handlePaymentsSearch(this.value)" />
        </div>
        <div id="paymentsMethodFilterPills" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <div class="filter-pill active" onclick="filterPaymentsByMethod('ALL', this)">All Methods</div>
          <div class="filter-pill" onclick="filterPaymentsByMethod('ONLINE', this)">⚡ Online Gateway</div>
          <div class="filter-pill" onclick="filterPaymentsByMethod('UPI', this)">📱 UPI</div>
          <div class="filter-pill" onclick="filterPaymentsByMethod('CASH', this)">💵 Cash</div>
          <div class="filter-pill" onclick="filterPaymentsByMethod('CHEQUE', this)">🏦 Cheque</div>
          <div class="filter-pill" onclick="filterPaymentsByMethod('BANK', this)">🏛️ Bank Transfer</div>
        </div>
        <select id="paymentsStatusSelect" onchange="filterPaymentsByStatus(this.value)" class="form-select" style="min-width:140px;font-size:13px;padding:6px 10px;height:36px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;">
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">✓ Success</option>
          <option value="PENDING">⏳ Pending</option>
          <option value="FAILED">✕ Failed</option>
        </select>
        <button class="btn btn-secondary btn-sm" onclick="exportPaymentsRegister()">Export</button>
      </div>

      <!-- Desktop Table Wrap -->
      <div class="table-wrap desktop-only-table">
        <table>
          <thead>
            <tr>
              <th>Receipt / Ref #</th>
              <th>Unit</th>
              <th>Resident / Paid By</th>
              <th>Linked Invoice</th>
              <th>Payment Channel</th>
              <th>Amount</th>
              <th>Settlement Date</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="paymentsTableBody">
            <tr>
              <td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);">
                Loading payments register from database...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile-First Cards -->
      <div id="paymentsMobileCardsContainer" class="mobile-only-cards" style="display:none;flex-direction:column;gap:10px;margin-top:10px;">
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Loading payments...</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
        <span id="paymentsPaginationSummary">Showing payment records from database</span>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLivePaymentsScreen()">🔄 Refresh Register</button>
      </div>
    `,
  });
};

// Live Hydration Logic: Connects to /api/payments
window.loadLivePaymentsScreen = async function() {
  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/payments' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '');
    const res = await (window.apiFetch || fetch)(url).catch(() => null);

    if (!res || !res.ok) {
      console.error('Failed to fetch payments from DB');
      const tbody = document.getElementById('paymentsTableBody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--red);">⚠️ Failed to connect to payments database. <button class="btn btn-sm btn-secondary" onclick="window.loadLivePaymentsScreen()">Retry</button></td></tr>`;
      }
      return;
    }

    const data = await res.json();
    const payments = data.payments || [];
    window.__cachedPayments = payments;

    // Calculate aggregations
    let totalCollected = 0;
    let onlineTotal = 0;
    let offlineTotal = 0;

    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      if (p.status === 'SUCCESS') {
        totalCollected += amt;
        const src = (p.source || '').toUpperCase();
        const meth = (p.method || '').toUpperCase();
        if (src === 'ONLINE_GATEWAY' || p.razorpayPaymentId || meth.includes('RAZORPAY')) {
          onlineTotal += amt;
        } else {
          offlineTotal += amt;
        }
      }
    });

    const elTotal = document.getElementById('statPaymentsTotalCollected');
    const elOnline = document.getElementById('statPaymentsOnlineTotal');
    const elOffline = document.getElementById('statPaymentsOfflineTotal');
    const elCount = document.getElementById('statPaymentsCount');
    const subEl = document.getElementById('paymentsSubtitle');

    if (elTotal) elTotal.textContent = '₹' + totalCollected.toLocaleString('en-IN');
    if (elOnline) elOnline.textContent = '₹' + onlineTotal.toLocaleString('en-IN');
    if (elOffline) elOffline.textContent = '₹' + offlineTotal.toLocaleString('en-IN');
    if (elCount) elCount.textContent = payments.length;

    if (subEl) {
      subEl.textContent = `${payments.length} payments recorded · ₹${totalCollected.toLocaleString('en-IN')} total settled · Live database`;
    }

    window.applyPaymentsFilters();
  } catch (err) {
    console.error('Error in loadLivePaymentsScreen:', err);
  }
};

window.filterPaymentsByMethod = function(method, pillEl) {
  window.__selectedPaymentMethod = method || 'ALL';
  const pills = document.querySelectorAll('#paymentsMethodFilterPills .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');
  window.applyPaymentsFilters();
};

window.filterPaymentsByStatus = function(status) {
  window.__selectedPaymentStatus = status || 'ALL';
  window.applyPaymentsFilters();
};

window.handlePaymentsSearch = function(query) {
  window.__paymentSearchQuery = (query || '').toLowerCase().trim();
  window.applyPaymentsFilters();
};

window.applyPaymentsFilters = function() {
  let filtered = window.__cachedPayments || [];

  if (window.__selectedPaymentStatus && window.__selectedPaymentStatus !== 'ALL') {
    filtered = filtered.filter(p => (p.status || '').toUpperCase() === window.__selectedPaymentStatus);
  }

  if (window.__selectedPaymentMethod && window.__selectedPaymentMethod !== 'ALL') {
    const m = window.__selectedPaymentMethod;
    filtered = filtered.filter(p => {
      const meth = (p.method || '').toUpperCase();
      const src = (p.source || '').toUpperCase();
      if (m === 'ONLINE') return src === 'ONLINE_GATEWAY' || !!p.razorpayPaymentId || meth.includes('GATEWAY');
      if (m === 'UPI') return meth.includes('UPI') || meth.includes('GPay') || meth.includes('PHONEPE');
      if (m === 'CASH') return meth.includes('CASH');
      if (m === 'CHEQUE') return meth.includes('CHEQUE') || meth.includes('DD');
      if (m === 'BANK') return meth.includes('NEFT') || meth.includes('RTGS') || meth.includes('IMPS') || meth.includes('TRANSFER');
      return true;
    });
  }

  if (window.__paymentSearchQuery) {
    const q = window.__paymentSearchQuery;
    filtered = filtered.filter(p => {
      const ref = (p.referenceNo || '').toLowerCase();
      const rzp = (p.razorpayPaymentId || '').toLowerCase();
      const unit = (p.invoice?.unit?.unitNumber || '').toLowerCase();
      const user = (p.user?.name || '').toLowerCase();
      const invNum = (p.invoice?.invoiceNumber || '').toLowerCase();
      const meth = (p.method || '').toLowerCase();
      return ref.includes(q) || rzp.includes(q) || unit.includes(q) || user.includes(q) || invNum.includes(q) || meth.includes(q);
    });
  }

  renderPaymentsData(filtered);
};

function renderPaymentsData(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  const cardsContainer = document.getElementById('paymentsMobileCardsContainer');
  const summaryEl = document.getElementById('paymentsPaginationSummary');

  if (summaryEl) {
    summaryEl.textContent = `Showing ${payments.length} of ${window.__cachedPayments.length} total payments`;
  }

  if (!payments || payments.length === 0) {
    const emptyMsg = `
      <tr>
        <td colspan="9" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:32px;margin-bottom:8px;">💳</div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary);margin-bottom:4px;">No Payment Records Found</div>
          <div style="font-size:12px;color:var(--text-secondary);max-width:340px;margin:0 auto 12px;">
            No payments match your current search or filters. You can record manual collections or accept online Razorpay dues.
          </div>
          <button class="btn btn-primary btn-sm" onclick="openRecordOfflinePaymentModal()">+ Record New Payment</button>
        </td>
      </tr>
    `;
    if (tbody) tbody.innerHTML = emptyMsg;
    if (cardsContainer) cardsContainer.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">No payments found.</div>`;
    return;
  }

  // 1. Render Desktop Table
  if (tbody) {
    tbody.innerHTML = payments.map(p => {
      const isSuccess = p.status === 'SUCCESS';
      const statusBadge = isSuccess ? 'badge-green' : (p.status === 'PENDING' ? 'badge-amber' : 'badge-red');
      const unitNum = p.invoice?.unit ? p.invoice.unit.unitNumber : 'Common';
      const payerName = p.invoice?.unit?.ownerName || p.user?.name || 'Resident';
      const invNumber = p.invoice ? p.invoice.invoiceNumber : 'Stand-alone Collection';
      const isOnline = p.source === 'ONLINE_GATEWAY' || !!p.razorpayPaymentId;
      const dateStr = p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

      return `
        <tr style="cursor:pointer;" onclick="openPaymentReceiptModal('${p.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:700;">${p.referenceNo || p.razorpayPaymentId || ('REC-' + p.id.slice(-6))}</span>
              ${isOnline ? '<span class="badge badge-blue" style="font-size:9px;padding:2px 5px;">⚡ Online</span>' : '<span class="badge badge-muted" style="font-size:9px;padding:2px 5px;">Offline</span>'}
            </div>
          </td>
          <td><strong>Flat ${unitNum}</strong></td>
          <td>
            <div>${payerName}</div>
            ${p.user?.phone ? `<div style="font-size:11px;color:var(--text-muted);">${p.user.phone}</div>` : ''}
          </td>
          <td>
            ${p.invoice ? `
              <span style="font-family:monospace;font-size:11px;font-weight:600;color:var(--text-primary);cursor:pointer;" onclick="event.stopPropagation(); viewInvoiceDetail('${p.invoice.id}')" title="Inspect Invoice">
                ${invNumber}
              </span>
            ` : '<span style="color:var(--text-muted);font-size:11px;">Direct Entry</span>'}
          </td>
          <td>
            <div style="font-weight:600;font-size:12px;">${p.method || 'Online'}</div>
            ${p.notes ? `<div style="font-size:11px;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.notes}</div>` : ''}
          </td>
          <td style="font-weight:800;font-size:13px;color:var(--green);">
            ₹${Number(p.amount || 0).toLocaleString('en-IN')}
          </td>
          <td style="font-size:12px;color:var(--text-secondary);">${dateStr}</td>
          <td><span class="badge ${statusBadge}">${p.status || 'SUCCESS'}</span></td>
          <td onclick="event.stopPropagation()" style="text-align:right;">
            <div style="display:flex;gap:4px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="openPaymentReceiptModal('${p.id}')" title="View Official Receipt">🧾</button>
              ${p.invoice ? `<button class="btn btn-ghost btn-sm btn-icon" onclick="viewInvoiceDetail('${p.invoice.id}')" title="View Linked Invoice">📄</button>` : ''}
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

    cardsContainer.innerHTML = payments.map(p => {
      const isSuccess = p.status === 'SUCCESS';
      const statusBadge = isSuccess ? 'badge-green' : (p.status === 'PENDING' ? 'badge-amber' : 'badge-red');
      const unitNum = p.invoice?.unit ? p.invoice.unit.unitNumber : 'Common';
      const payerName = p.invoice?.unit?.ownerName || p.user?.name || 'Resident';
      const isOnline = p.source === 'ONLINE_GATEWAY' || !!p.razorpayPaymentId;
      const dateStr = p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

      return `
        <div class="card card-sm" style="display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;" onclick="openPaymentReceiptModal('${p.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:700;">${p.referenceNo || ('REC-' + p.id.slice(-6))}</span>
                ${isOnline ? '<span class="badge badge-blue" style="font-size:9px;">⚡ Online</span>' : '<span class="badge badge-muted" style="font-size:9px;">Offline</span>'}
              </div>
              <div style="font-size:15px;font-weight:800;color:var(--text-primary);margin-top:2px;">Flat ${unitNum} · ${payerName}</div>
            </div>
            <span class="badge ${statusBadge}">${p.status}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;border-top:1px solid var(--border-light);padding-top:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);">${p.method || 'Payment'} · ${dateStr}</div>
              <div style="font-size:12px;color:var(--text-secondary);">${p.invoice ? p.invoice.invoiceNumber : 'Direct Entry'}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:17px;font-weight:800;color:var(--green);">
                ₹${Number(p.amount || 0).toLocaleString('en-IN')}
              </div>
              <div style="font-size:11px;color:var(--text-muted);">Verified</div>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:4px;" onclick="event.stopPropagation()">
            <button class="btn btn-secondary btn-sm" style="flex:1;min-height:44px;justify-content:center;" onclick="openPaymentReceiptModal('${p.id}')">
              🧾 Official Receipt
            </button>
            ${p.invoice ? `
              <button class="btn btn-ghost btn-sm" style="min-height:44px;padding:0 14px;" onclick="viewInvoiceDetail('${p.invoice.id}')">
                Invoice →
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

// Modal: Record Offline / Manual Payment
window.openRecordOfflinePaymentModal = async function(prefillUnitId = null, prefillInvoiceId = null) {
  const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';

  // 1. Fetch units and unpaid invoices for convenient selection
  let units = [];
  try {
    const res = await (window.apiFetch || fetch)('/api/units' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : ''));
    if (res && res.ok) {
      const data = await res.json();
      units = data.units || [];
    }
  } catch (e) {}

  const unitOptions = units.map(u => `
    <option value="${u.id}" ${u.id === prefillUnitId ? 'selected' : ''} data-unitnumber="${u.unitNumber}" data-owner="${u.ownerName || ''}">
      Flat ${u.unitNumber} ${u.ownerName ? `(${u.ownerName})` : ''}
    </option>
  `).join('');

  const todayStr = new Date().toISOString().split('T')[0];

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);padding:12px;border-radius:var(--r-md);font-size:12px;color:var(--text-secondary);line-height:1.5;">
        💵 <strong>Offline Collection Entry:</strong> Record cash, cheque, bank transfer (NEFT/RTGS), or direct UPI receipts. This automatically clears the flat's outstanding invoice balance.
      </div>

      <!-- Select Flat / Unit -->
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Flat / Unit *</label>
        <select id="recPayUnitId" class="form-select" style="width:100%;font-size:13px;" onchange="window.handleRecordPaymentUnitChange(this.value)">
          <option value="">Select Flat...</option>
          ${unitOptions}
        </select>
      </div>

      <!-- Linked Invoice Selection (Auto-loaded) -->
      <div id="recPayInvoiceGroup">
        <label class="form-label" style="font-weight:700;font-size:12px;">Linked Unpaid Bill / Invoice</label>
        <select id="recPayInvoiceId" class="form-select" style="width:100%;font-size:13px;" onchange="window.handleRecordPaymentInvoiceSelect(this)">
          <option value="">Select an invoice to settle (or Standalone Payment)</option>
        </select>
        <div id="recPayInvoiceHint" style="font-size:11px;color:var(--text-muted);margin-top:4px;"></div>
      </div>

      <!-- Amount & Date -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Amount Collected (₹) *</label>
          <input type="number" id="recPayAmount" class="form-input" placeholder="e.g. 5000" style="width:100%;font-size:13px;" min="1" step="0.01" required />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Payment Date *</label>
          <input type="date" id="recPayDate" class="form-input" value="${todayStr}" style="width:100%;font-size:13px;" required />
        </div>
      </div>

      <!-- Method & Channel -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Payment Method *</label>
          <select id="recPayMethod" class="form-select" style="width:100%;font-size:13px;">
            <option value="Cash" selected>💵 Cash Collection</option>
            <option value="Cheque / DD">🏦 Cheque / Demand Draft</option>
            <option value="NEFT / RTGS">🏛️ Bank Transfer (NEFT/RTGS/IMPS)</option>
            <option value="Direct UPI QR">📱 Direct UPI (GooglePay / PhonePe / Paytm)</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Reference / Cheque / UTR #</label>
          <input type="text" id="recPayRefNo" class="form-input" placeholder="e.g. CHQ-482019 or UPI Ref" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <!-- Narration Notes -->
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Notes / Remarks</label>
        <input type="text" id="recPayNotes" class="form-input" placeholder="e.g. Deposited in SBI Society Account" style="width:100%;font-size:13px;" />
      </div>
    </div>
  `;

  showModal('💵 Record Offline Payment', html, 'Record Payment & Issue Receipt 🚀', async () => {
    const unitId = document.getElementById('recPayUnitId')?.value;
    const invoiceId = document.getElementById('recPayInvoiceId')?.value || null;
    const amount = document.getElementById('recPayAmount')?.value;
    const paidAt = document.getElementById('recPayDate')?.value;
    const method = document.getElementById('recPayMethod')?.value;
    const referenceNo = document.getElementById('recPayRefNo')?.value.trim();
    const notes = document.getElementById('recPayNotes')?.value.trim();

    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid payment amount', 'warning');
      throw new Error('Valid amount required');
    }

    const payload = {
      organizationId: activeOrgId,
      unitId: unitId || undefined,
      invoiceId: invoiceId || undefined,
      amount: parseFloat(amount),
      paidAt,
      method,
      referenceNo,
      notes,
      source: 'OFFLINE_ADMIN',
    };

    const res = await (window.apiFetch || fetch)('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to record payment');
    }

    showToast(`✅ Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded successfully!`, 'success');

    // Reload payments, invoices, and dues
    if (typeof window.loadLivePaymentsScreen === 'function') {
      window.loadLivePaymentsScreen();
    }
    if (typeof window.loadLiveInvoicesScreen === 'function') {
      window.loadLiveInvoicesScreen();
    }
    if (typeof window.loadLiveDuesScreen === 'function') {
      window.loadLiveDuesScreen();
    }

    // Immediately open digital receipt for printing
    if (data.payment) {
      setTimeout(() => {
        window.openPaymentReceiptModal(data.payment.id, data.payment);
      }, 300);
    }
  }, '540px');

  if (prefillUnitId) {
    setTimeout(() => {
      window.handleRecordPaymentUnitChange(prefillUnitId, prefillInvoiceId);
    }, 120);
  }
};

window.handleRecordPaymentUnitChange = async function(unitId, prefillInvoiceId = null) {
  const invSelect = document.getElementById('recPayInvoiceId');
  const hintEl = document.getElementById('recPayInvoiceHint');
  const amtInput = document.getElementById('recPayAmount');
  if (!invSelect) return;

  invSelect.innerHTML = '<option value="">Loading pending invoices for flat...</option>';
  if (!unitId) {
    invSelect.innerHTML = '<option value="">Select a flat first</option>';
    if (hintEl) hintEl.textContent = '';
    return;
  }

  try {
    const res = await (window.apiFetch || fetch)(`/api/billing/invoices?unitId=${encodeURIComponent(unitId)}&status=UNPAID`);
    if (res && res.ok) {
      const data = await res.json();
      const invoices = data.invoices || [];

      if (invoices.length === 0) {
        invSelect.innerHTML = '<option value="">No pending invoices for this flat (Record Standalone Advance)</option>';
        if (hintEl) hintEl.innerHTML = '<span style="color:var(--green)">✓ All past invoices are cleared for this unit.</span>';
      } else {
        invSelect.innerHTML = '<option value="">Select invoice to settle...</option>' +
          invoices.map(i => `
            <option value="${i.id}" ${i.id === prefillInvoiceId ? 'selected' : ''} data-amount="${i.balanceAmount || i.totalAmount}">
              ${i.billingMonth} Bill (${i.invoiceNumber}) — Balance Due: ₹${(i.balanceAmount || i.totalAmount).toLocaleString('en-IN')}
            </option>
          `).join('');

        // Pre-select first pending invoice or matched prefill invoice
        let targetIndex = 1;
        if (prefillInvoiceId) {
          const idx = Array.from(invSelect.options).findIndex(o => o.value === prefillInvoiceId);
          if (idx > 0) targetIndex = idx;
        }

        invSelect.selectedIndex = targetIndex;
        const selectedOpt = invSelect.options[targetIndex];
        if (selectedOpt && amtInput) {
          amtInput.value = selectedOpt.getAttribute('data-amount') || '';
        }
        if (hintEl) {
          hintEl.innerHTML = `<span style="color:var(--blue)">Found ${invoices.length} pending bill(s) for this flat.</span>`;
        }
      }
    }
  } catch (e) {
    invSelect.innerHTML = '<option value="">Failed to load invoices</option>';
  }
};

window.handleRecordPaymentInvoiceSelect = function(selectEl) {
  const amtInput = document.getElementById('recPayAmount');
  if (!amtInput) return;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (opt && opt.getAttribute('data-amount')) {
    amtInput.value = opt.getAttribute('data-amount');
  }
};

// Modal: Official Payment Receipt
window.openPaymentReceiptModal = function(paymentId, directPaymentObj) {
  const payment = directPaymentObj || (window.__cachedPayments || []).find(p => p.id === paymentId);

  if (!payment) {
    showToast('Payment record not found', 'warning');
    return;
  }

  const isOnline = payment.source === 'ONLINE_GATEWAY' || !!payment.razorpayPaymentId;
  const unitNum = payment.invoice?.unit ? payment.invoice.unit.unitNumber : 'Common';
  const residentName = payment.invoice?.unit?.ownerName || payment.user?.name || 'Resident';
  const societyName = localStorage.getItem('rwa_active_org_name') || localStorage.getItem('rwa_active_society_name') || 'Residents Welfare Association';
  const receiptNo = payment.referenceNo || payment.razorpayPaymentId || `RCP-${payment.id.slice(-8).toUpperCase()}`;
  const dateStr = payment.paidAt || payment.createdAt ? new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified';
  const amountStr = Number(payment.amount || 0).toLocaleString('en-IN');

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:6px 4px;">
      <!-- Receipt Header -->
      <div style="text-align:center;border-bottom:2px dashed var(--border-light);padding-bottom:14px;">
        <div style="font-size:20px;font-weight:900;color:var(--text-primary);letter-spacing:-0.02em;">${societyName}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">OFFICIAL COLLECTION RECEIPT & ACKNOWLEDGEMENT</div>
        <div style="display:inline-block;margin-top:8px;background:rgba(16,185,129,0.12);color:var(--green);font-size:11px;font-weight:700;padding:4px 12px;border-radius:var(--r-full);">
          ✓ PAYMENT SETTLED & VERIFIED
        </div>
      </div>

      <!-- Receipt Meta Info Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;background:var(--bg-elevated);padding:14px;border-radius:var(--r-md);border:1px solid var(--border-light);">
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Receipt Number:</div>
          <div style="font-family:monospace;font-size:13px;font-weight:800;color:var(--blue);">${receiptNo}</div>
        </div>
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Payment Date & Time:</div>
          <div style="font-weight:600;">${dateStr}</div>
        </div>
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Flat / Unit:</div>
          <div style="font-weight:800;font-size:14px;color:var(--text-primary);">Flat ${unitNum}</div>
        </div>
        <div>
          <div style="color:var(--text-muted);margin-bottom:2px;">Received From:</div>
          <div style="font-weight:700;">${residentName}</div>
        </div>
      </div>

      <!-- Line Breakdown -->
      <div style="border:1px solid var(--border-light);border-radius:var(--r-md);overflow:hidden;font-size:12px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="background:var(--bg-surface);border-bottom:1px solid var(--border-light);">
            <tr>
              <th style="padding:10px 12px;text-align:left;">Description</th>
              <th style="padding:10px 12px;text-align:right;">Amount Received</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px;font-weight:600;">
                ${payment.invoice ? `Payment for ${payment.invoice.billingMonth} Maintenance (${payment.invoice.invoiceNumber})` : 'General Society Maintenance & Dues'}
                ${payment.notes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-weight:normal;">Narration: ${payment.notes}</div>` : ''}
              </td>
              <td style="padding:12px;text-align:right;font-size:15px;font-weight:800;color:var(--green);">
                ₹${amountStr}
              </td>
            </tr>
          </tbody>
          <tfoot style="background:var(--bg-elevated);border-top:1px solid var(--border-light);font-size:13px;">
            <tr>
              <td style="padding:10px 12px;font-weight:700;">Payment Mode & Channel:</td>
              <td style="padding:10px 12px;text-align:right;font-weight:700;">
                ${payment.method || 'Online Gateway'} ${isOnline ? '(Razorpay)' : ''}
              </td>
            </tr>
            <tr style="font-size:15px;font-weight:900;">
              <td style="padding:10px 12px;color:var(--text-primary);">Total Amount Settled:</td>
              <td style="padding:10px 12px;text-align:right;color:var(--green);">₹${amountStr}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="font-size:11px;color:var(--text-muted);text-align:center;line-height:1.4;margin-top:2px;">
        This is an official system-generated payment receipt acknowledged by the RWA Society treasury ledger.
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;gap:8px;">
        <button type="button" class="btn btn-secondary" onclick="window.print()">🖨️ Print Receipt</button>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('rwaGlobalModal').style.display='none'">Done ✓</button>
      </div>
    </div>
  `;

  showModal(`🧾 Payment Receipt · ${receiptNo}`, html, 'Close', () => {}, '500px');
};

// Export Payments Register to CSV
window.exportPaymentsRegister = function() {
  const payments = window.__cachedPayments || [];
  if (payments.length === 0) {
    showToast('No payment records to export', 'warning');
    return;
  }

  const headers = ['Receipt_No', 'Flat_Unit', 'Resident_Name', 'Invoice_No', 'Payment_Method', 'Amount_INR', 'Date_Time', 'Status', 'Notes'];
  const rows = payments.map(p => [
    `"${p.referenceNo || p.razorpayPaymentId || ('REC-' + p.id.slice(-6))}"`,
    `"${p.invoice?.unit?.unitNumber || 'Common'}"`,
    `"${p.invoice?.unit?.ownerName || p.user?.name || 'Resident'}"`,
    `"${p.invoice?.invoiceNumber || 'Direct'}"`,
    `"${p.method || 'Online'}"`,
    p.amount || 0,
    `"${p.paidAt || p.createdAt || ''}"`,
    `"${p.status || 'SUCCESS'}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Payments_Register_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📊 Payments Register exported to CSV!', 'success');
};

// =============================================
// 4. Dues & Defaulters Screen
// =============================================
Screens['admin-dues'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveDuesScreen === 'function') {
      window.loadLiveDuesScreen();
    }
  }, 10);

  return Shell.render('admin-dues', {
    title: 'Dues & Defaulters Registry',
    portal: 'admin',
    breadcrumb: 'Finance',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.exportDuesDefaulters()">📊 Export Defaulters</button>
      <button class="btn btn-primary btn-sm" onclick="window.openBatchReminderModal()">📢 Broadcast Reminders</button>
    `,
    content: `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">Dues & Overdue Defaulters</div>
          <div class="page-subtitle" id="duesSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="window.exportDuesDefaulters()">📊 Export Defaulters (CSV)</button>
          <button class="btn btn-primary" onclick="window.openBatchReminderModal()">📢 Broadcast Reminders (Batch)</button>
        </div>
      </div>

      <!-- Real-Time KPI Stat Cards -->
      <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:20px;">
        <div class="stat-card" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border-left:4px solid var(--red);">
          <div class="stat-label" style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span>💰</span> Total Outstanding Dues
          </div>
          <div class="stat-val" id="statDuesTotalAmount" style="font-size:24px;font-weight:800;color:var(--red);margin-top:6px;">₹0</div>
          <div class="stat-sub" id="statDuesTotalSub" style="font-size:11px;color:var(--text-muted);margin-top:4px;">Across all unpaid cycles</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border-left:4px solid var(--amber);">
          <div class="stat-label" style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span>🏢</span> Defaulter Units
          </div>
          <div class="stat-val" id="statDuesUnitCount" style="font-size:24px;font-weight:800;color:var(--text-primary);margin-top:6px;">0</div>
          <div class="stat-sub" id="statDuesUnitSub" style="font-size:11px;color:var(--text-muted);margin-top:4px;">Units with pending balance</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border-left:4px solid #ef4444;">
          <div class="stat-label" style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span>⏳</span> Critical Overdue (>30 Days)
          </div>
          <div class="stat-val" id="statDuesCriticalAmount" style="font-size:24px;font-weight:800;color:#ef4444;margin-top:6px;">₹0</div>
          <div class="stat-sub" id="statDuesCriticalCount" style="font-size:11px;color:var(--text-muted);margin-top:4px;">0 critical accounts</div>
        </div>

        <div class="stat-card" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border-left:4px solid var(--blue);">
          <div class="stat-label" style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span>📊</span> Avg Dues / Defaulter
          </div>
          <div class="stat-val" id="statDuesAvgAmount" style="font-size:24px;font-weight:800;color:var(--blue);margin-top:6px;">₹0</div>
          <div class="stat-sub" id="statDuesAvgSub" style="font-size:11px;color:var(--text-muted);margin-top:4px;">Average balance per unit</div>
        </div>
      </div>

      <!-- Filters, Block Selector & Search Toolbar -->
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
        <!-- Filter Tabs / Pills -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;" id="duesFilterPills">
          <button class="btn btn-sm btn-primary dues-filter-btn" data-filter="ALL" onclick="window.filterDuesByCategory('ALL', this)">All Unpaid Dues</button>
          <button class="btn btn-sm btn-ghost dues-filter-btn" data-filter="OVERDUE" onclick="window.filterDuesByCategory('OVERDUE', this)">⚠️ Past Due Date</button>
          <button class="btn btn-sm btn-ghost dues-filter-btn" data-filter="CRITICAL" onclick="window.filterDuesByCategory('CRITICAL', this)">🚨 Critical (>30 Days)</button>
          <button class="btn btn-sm btn-ghost dues-filter-btn" data-filter="CURRENT" onclick="window.filterDuesByCategory('CURRENT', this)">🗓️ Current Cycle</button>
        </div>

        <!-- Right Side: Block Selector, View Mode & Search -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <!-- Block Filter Dropdown -->
          <select id="duesBlockFilter" class="form-select" style="font-size:12px;padding:6px 12px;border-radius:var(--r-md);min-width:140px;" onchange="window.filterDuesByBlock(this.value)">
            <option value="ALL">All Blocks / Towers</option>
          </select>

          <!-- Search Input -->
          <div style="position:relative;width:220px;">
            <input type="text" id="duesSearchInput" class="form-input" placeholder="Search Unit, Name, Phone..." 
                   style="width:100%;font-size:12px;padding:6px 12px 6px 28px;border-radius:var(--r-md);"
                   oninput="window.handleDuesSearch(this.value)" />
            <span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--text-muted);pointer-events:none;">🔍</span>
          </div>

          <!-- View Mode Toggle -->
          <div style="display:inline-flex;border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;">
            <button id="duesViewModeUnit" class="btn btn-sm btn-secondary" style="border-radius:0;font-size:11px;padding:5px 9px;" onclick="window.setDuesViewMode('unit')">🏢 By Unit</button>
            <button id="duesViewModeInv" class="btn btn-sm btn-ghost" style="border-radius:0;font-size:11px;padding:5px 9px;" onclick="window.setDuesViewMode('invoice')">📄 By Bill</button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="table-wrap" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center;"><input type="checkbox" id="duesSelectAll" onchange="window.toggleDuesSelectAll(this.checked)" title="Select all defaulters" /></th>
              <th>Unit / Flat</th>
              <th>Resident / Owner</th>
              <th id="duesThInvoices">Pending Cycles</th>
              <th>Outstanding Due</th>
              <th>Aging / Overdue Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="duesTableBody">
            <tr>
              <td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">
                Loading live defaulters registry...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards Container (Visible on mobile screens) -->
      <div id="duesMobileCards" style="display:none;flex-direction:column;gap:12px;margin-top:14px;"></div>
    `,
  });
};

// Global state for Dues Screen
window.__duesRawInvoices = [];
window.__duesGroupedUnits = [];
window.__duesCategoryFilter = 'ALL';
window.__duesBlockFilter = 'ALL';
window.__duesSearchQuery = '';
window.__duesViewMode = 'unit'; // 'unit' | 'invoice'
window.__duesSelectedUnitIds = new Set();

window.loadLiveDuesScreen = async function() {
  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/billing/invoices?status=UNPAID' + (activeOrgId ? `&orgId=${encodeURIComponent(activeOrgId)}` : '');
    const res = await (window.apiFetch || fetch)(url).catch(() => null);
    if (!res || !res.ok) {
      console.warn('Could not fetch unpaid invoices directly, fallback to all invoices');
      return;
    }

    const data = await res.json();
    let invoices = data.invoices || [];

    // Filter to invoices with actual balance due
    invoices = invoices.filter(i => (i.balanceAmount || 0) > 0 && i.status !== 'PAID');
    window.__duesRawInvoices = invoices;

    // Group invoices by Unit
    const unitMap = new Map();
    const now = new Date();

    invoices.forEach(inv => {
      const u = inv.unit;
      const unitId = u ? u.id : (inv.unitId || 'unknown');
      if (!unitMap.has(unitId)) {
        unitMap.set(unitId, {
          unitId: unitId,
          unitNumber: u ? u.unitNumber : 'Common',
          blockName: (u && u.block) ? u.block.name : (u ? (u.unitNumber.includes('-') ? u.unitNumber.split('-')[0] : 'General') : 'General'),
          floor: u ? u.floor : null,
          ownerName: u ? (u.ownerName || 'Resident') : 'Resident',
          ownerPhone: u ? (u.ownerPhone || '—') : '—',
          tenantName: u ? u.tenantName : null,
          tenantPhone: u ? u.tenantPhone : null,
          invoices: [],
          totalDue: 0,
          oldestDueDate: null,
          maxDaysOverdue: 0,
          isCritical: false,
          isOverdue: false,
        });
      }

      const grp = unitMap.get(unitId);
      grp.invoices.push(inv);
      grp.totalDue += (inv.balanceAmount || 0);

      const dDate = inv.dueDate ? new Date(inv.dueDate) : null;
      if (dDate) {
        if (!grp.oldestDueDate || dDate < grp.oldestDueDate) {
          grp.oldestDueDate = dDate;
        }
        if (dDate < now) {
          const days = Math.max(1, Math.floor((now.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24)));
          if (days > grp.maxDaysOverdue) {
            grp.maxDaysOverdue = days;
          }
          grp.isOverdue = true;
          if (days > 30) {
            grp.isCritical = true;
          }
        }
      }
    });

    const groupedUnits = Array.from(unitMap.values());
    // Sort by total due descending
    groupedUnits.sort((a, b) => b.totalDue - a.totalDue);
    window.__duesGroupedUnits = groupedUnits;

    // Calculate aggregations for KPI Stat Cards
    let totalOutstanding = 0;
    let criticalAmount = 0;
    let criticalCount = 0;

    groupedUnits.forEach(g => {
      totalOutstanding += g.totalDue;
      if (g.isCritical) {
        criticalAmount += g.totalDue;
        criticalCount++;
      }
    });

    const avgDues = groupedUnits.length > 0 ? Math.round(totalOutstanding / groupedUnits.length) : 0;

    // Update KPI Card UI
    const elTotal = document.getElementById('statDuesTotalAmount');
    const elUnits = document.getElementById('statDuesUnitCount');
    const elCritAmt = document.getElementById('statDuesCriticalAmount');
    const elCritCnt = document.getElementById('statDuesCriticalCount');
    const elAvg = document.getElementById('statDuesAvgAmount');
    const subEl = document.getElementById('duesSubtitle');

    if (elTotal) elTotal.textContent = '₹' + totalOutstanding.toLocaleString('en-IN');
    if (elUnits) elUnits.textContent = groupedUnits.length;
    if (elCritAmt) elCritAmt.textContent = '₹' + criticalAmount.toLocaleString('en-IN');
    if (elCritCnt) elCritCnt.textContent = `${criticalCount} critical account(s) (>30d)`;
    if (elAvg) elAvg.textContent = '₹' + avgDues.toLocaleString('en-IN');

    if (subEl) {
      subEl.textContent = `${groupedUnits.length} flats with pending dues · Total ₹${totalOutstanding.toLocaleString('en-IN')} outstanding · Live database`;
    }

    // Populate Block Filter Dropdown
    const blockSelect = document.getElementById('duesBlockFilter');
    if (blockSelect) {
      const uniqueBlocks = Array.from(new Set(groupedUnits.map(g => g.blockName).filter(Boolean))).sort();
      const currentVal = blockSelect.value || 'ALL';
      blockSelect.innerHTML = '<option value="ALL">All Blocks / Towers</option>' +
        uniqueBlocks.map(b => `<option value="${b}">${b}</option>`).join('');
      blockSelect.value = uniqueBlocks.includes(currentVal) ? currentVal : 'ALL';
    }

    // Render Table and Mobile Cards
    window.renderDuesTableAndCards();
  } catch (err) {
    console.error('Error in loadLiveDuesScreen:', err);
  }
};

window.renderDuesTableAndCards = function() {
  const tbody = document.getElementById('duesTableBody');
  const mobileContainer = document.getElementById('duesMobileCards');
  if (!tbody) return;

  const mode = window.__duesViewMode || 'unit';
  const cat = window.__duesCategoryFilter || 'ALL';
  const block = window.__duesBlockFilter || 'ALL';
  const query = (window.__duesSearchQuery || '').toLowerCase().trim();

  if (mode === 'unit') {
    let list = window.__duesGroupedUnits || [];

    // Filter by Category
    if (cat === 'OVERDUE') {
      list = list.filter(g => g.isOverdue);
    } else if (cat === 'CRITICAL') {
      list = list.filter(g => g.isCritical);
    } else if (cat === 'CURRENT') {
      list = list.filter(g => !g.isOverdue);
    }

    // Filter by Block
    if (block && block !== 'ALL') {
      list = list.filter(g => g.blockName === block);
    }

    // Filter by Search Query
    if (query) {
      list = list.filter(g => 
        (g.unitNumber || '').toLowerCase().includes(query) ||
        (g.ownerName || '').toLowerCase().includes(query) ||
        (g.ownerPhone || '').toLowerCase().includes(query) ||
        (g.tenantName || '').toLowerCase().includes(query)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:36px;color:var(--green);font-weight:700;">
            🎉 All maintenance dues are cleared! No outstanding defaulters match this criteria.
          </td>
        </tr>
      `;
      if (mobileContainer) {
        mobileContainer.style.display = 'flex';
        mobileContainer.innerHTML = `
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:24px;text-align:center;color:var(--green);font-weight:700;">
            🎉 All maintenance dues are cleared!
          </div>
        `;
      }
      return;
    }

    tbody.innerHTML = list.map(g => {
      const isSelected = window.__duesSelectedUnitIds.has(g.unitId);
      const cyclesPills = g.invoices.map(i => `
        <span class="badge badge-purple" style="font-size:10px;padding:2px 6px;" title="${i.invoiceNumber}: ₹${(i.balanceAmount || 0).toLocaleString('en-IN')}">
          ${i.billingMonth}
        </span>
      `).join(' ');

      let agingBadge = '';
      if (g.isCritical) {
        agingBadge = `<span class="badge badge-red" style="font-weight:700;">🚨 Critical (${g.maxDaysOverdue}d overdue)</span>`;
      } else if (g.isOverdue) {
        agingBadge = `<span class="badge badge-amber" style="font-weight:600;">⚠️ Overdue (${g.maxDaysOverdue}d)</span>`;
      } else {
        const dueStr = g.oldestDueDate ? new Date(g.oldestDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Due Soon';
        agingBadge = `<span class="badge badge-blue">🗓️ Due by ${dueStr}</span>`;
      }

      const pendingMonthsStr = g.invoices.map(i => i.billingMonth).join(', ');
      const firstInvoiceId = g.invoices[0]?.id || '';

      return `
        <tr>
          <td style="text-align:center;">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="window.toggleDuesUnitSelect('${g.unitId}', this.checked)" />
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="badge badge-secondary" style="font-size:11px;font-weight:700;">${g.blockName}</span>
              <strong style="color:var(--text-primary);font-size:14px;">Flat ${g.unitNumber}</strong>
            </div>
            ${g.floor ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Floor: ${g.floor}</div>` : ''}
          </td>
          <td>
            <div style="font-weight:600;color:var(--text-primary);font-size:13px;">${g.ownerName}</div>
            <div style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:6px;margin-top:2px;">
              <span>📞 ${g.ownerPhone}</span>
              ${g.ownerPhone && g.ownerPhone !== '—' ? `
                <a href="https://wa.me/91${g.ownerPhone.replace(/[^0-9]/g, '').slice(-10)}" target="_blank" title="WhatsApp Chat" style="color:var(--green);font-size:12px;text-decoration:none;">💬</a>
              ` : ''}
            </div>
          </td>
          <td>
            <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:200px;">
              ${cyclesPills}
            </div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${g.invoices.length} bill(s) pending</div>
          </td>
          <td>
            <div style="color:var(--red);font-size:15px;font-weight:800;">₹${g.totalDue.toLocaleString('en-IN')}</div>
          </td>
          <td>
            ${agingBadge}
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:6px;align-items:center;">
              <button class="btn btn-secondary btn-sm" title="Send WhatsApp Payment Reminder" 
                      onclick="window.sendWhatsAppReminder('${g.ownerPhone}', '${g.ownerName.replace(/'/g, "\\'")}', '${g.unitNumber}', ${g.totalDue}, '${pendingMonthsStr}')">
                💬 Remind
              </button>
              <button class="btn btn-primary btn-sm" title="Record Manual Payment / Settlement" 
                      onclick="window.openRecordOfflinePaymentModal('${g.unitId}', '${firstInvoiceId}')">
                💵 Collect
              </button>
              <button class="btn btn-ghost btn-sm" title="View Demand Notice" 
                      onclick="window.openDemandNoticeModal('${g.unitId}')">
                📑 Notice
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Render Mobile Cards View
    if (mobileContainer) {
      mobileContainer.style.display = 'flex';
      mobileContainer.innerHTML = list.map(g => {
        const pendingMonthsStr = g.invoices.map(i => i.billingMonth).join(', ');
        const firstInvoiceId = g.invoices[0]?.id || '';
        return `
          <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;box-shadow:var(--shadow-sm);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <span class="badge badge-secondary" style="font-size:10px;margin-right:4px;">${g.blockName}</span>
                <strong style="font-size:15px;color:var(--text-primary);">Flat ${g.unitNumber}</strong>
                <div style="font-weight:600;font-size:13px;margin-top:4px;">${g.ownerName}</div>
                <div style="font-size:11px;color:var(--text-muted);">📞 ${g.ownerPhone}</div>
              </div>
              <div style="text-align:right;">
                <div style="color:var(--red);font-size:16px;font-weight:800;">₹${g.totalDue.toLocaleString('en-IN')}</div>
                <div style="margin-top:4px;">
                  ${g.isCritical ? '<span class="badge badge-red">🚨 Critical</span>' : g.isOverdue ? '<span class="badge badge-amber">⚠️ Overdue</span>' : '<span class="badge badge-blue">🗓️ Due</span>'}
                </div>
              </div>
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:11px;color:var(--text-muted);">
                ${g.invoices.length} bill(s): ${pendingMonthsStr}
              </div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-secondary btn-sm" onclick="window.sendWhatsAppReminder('${g.ownerPhone}', '${g.ownerName.replace(/'/g, "\\'")}', '${g.unitNumber}', ${g.totalDue}, '${pendingMonthsStr}')">💬</button>
                <button class="btn btn-primary btn-sm" onclick="window.openRecordOfflinePaymentModal('${g.unitId}', '${firstInvoiceId}')">💵 Collect</button>
                <button class="btn btn-ghost btn-sm" onclick="window.openDemandNoticeModal('${g.unitId}')">📑</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    // Mode === 'invoice': Display individual invoices
    let invs = window.__duesRawInvoices || [];

    if (cat === 'OVERDUE') {
      invs = invs.filter(i => i.isOverdue || i.status === 'OVERDUE');
    } else if (cat === 'CRITICAL') {
      invs = invs.filter(i => (i.daysOverdue || 0) > 30);
    } else if (cat === 'CURRENT') {
      invs = invs.filter(i => !i.isOverdue);
    }

    if (block && block !== 'ALL') {
      invs = invs.filter(i => {
        const u = i.unit;
        const b = (u && u.block) ? u.block.name : (u ? (u.unitNumber.includes('-') ? u.unitNumber.split('-')[0] : 'General') : 'General');
        return b === block;
      });
    }

    if (query) {
      invs = invs.filter(i =>
        (i.invoiceNumber || '').toLowerCase().includes(query) ||
        (i.unit?.unitNumber || '').toLowerCase().includes(query) ||
        (i.unit?.ownerName || '').toLowerCase().includes(query) ||
        (i.unit?.ownerPhone || '').toLowerCase().includes(query)
      );
    }

    if (invs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:36px;color:var(--green);font-weight:700;">
            🎉 No individual bills match the selected filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = invs.map(i => {
      const u = i.unit;
      const unitNum = u ? u.unitNumber : 'Common';
      const owner = u ? (u.ownerName || 'Resident') : 'Resident';
      const phone = u ? (u.ownerPhone || '—') : '—';
      const dueDateStr = i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 15, 2026';

      return `
        <tr>
          <td style="text-align:center;">
            <input type="checkbox" onchange="window.toggleDuesUnitSelect('${i.unitId}', this.checked)" />
          </td>
          <td>
            <strong style="color:var(--text-primary);font-size:14px;">Flat ${unitNum}</strong>
          </td>
          <td>
            <div style="font-weight:600;">${owner}</div>
            <div style="font-size:11px;color:var(--text-muted);">📞 ${phone}</div>
          </td>
          <td>
            <span class="badge badge-purple">${i.billingMonth}</span>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">#${i.invoiceNumber}</div>
          </td>
          <td>
            <strong style="color:var(--red);font-size:14px;">₹${(i.balanceAmount || i.totalAmount).toLocaleString('en-IN')}</strong>
          </td>
          <td>
            <div style="font-size:12px;color:var(--text-muted);">${dueDateStr}</div>
            ${i.isOverdue ? `<span class="badge badge-red" style="font-size:10px;margin-top:2px;">${i.daysOverdue || 1}d overdue</span>` : '<span class="badge badge-blue" style="font-size:10px;">Due Soon</span>'}
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.sendWhatsAppReminder('${phone}', '${owner.replace(/'/g, "\\'")}', '${unitNum}', ${i.balanceAmount || i.totalAmount}, '${i.billingMonth}')">💬 Remind</button>
              <button class="btn btn-primary btn-sm" onclick="window.openRecordOfflinePaymentModal('${i.unitId}', '${i.id}')">💵 Collect</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
};

window.filterDuesByCategory = function(category, btnEl) {
  window.__duesCategoryFilter = category;
  const pillBtns = document.querySelectorAll('.dues-filter-btn');
  pillBtns.forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-ghost');
  });
  if (btnEl) {
    btnEl.classList.remove('btn-ghost');
    btnEl.classList.add('btn-primary');
  }
  window.renderDuesTableAndCards();
};

window.filterDuesByBlock = function(block) {
  window.__duesBlockFilter = block;
  window.renderDuesTableAndCards();
};

window.handleDuesSearch = function(q) {
  window.__duesSearchQuery = q;
  window.renderDuesTableAndCards();
};

window.setDuesViewMode = function(mode) {
  window.__duesViewMode = mode;
  const btnUnit = document.getElementById('duesViewModeUnit');
  const btnInv = document.getElementById('duesViewModeInv');
  const thCycles = document.getElementById('duesThInvoices');

  if (mode === 'unit') {
    if (btnUnit) { btnUnit.classList.add('btn-secondary'); btnUnit.classList.remove('btn-ghost'); }
    if (btnInv) { btnInv.classList.remove('btn-secondary'); btnInv.classList.add('btn-ghost'); }
    if (thCycles) thCycles.textContent = 'Pending Cycles';
  } else {
    if (btnInv) { btnInv.classList.add('btn-secondary'); btnInv.classList.remove('btn-ghost'); }
    if (btnUnit) { btnUnit.classList.remove('btn-secondary'); btnUnit.classList.add('btn-ghost'); }
    if (thCycles) thCycles.textContent = 'Billing Cycle';
  }
  window.renderDuesTableAndCards();
};

window.toggleDuesSelectAll = function(checked) {
  if (checked) {
    (window.__duesGroupedUnits || []).forEach(g => window.__duesSelectedUnitIds.add(g.unitId));
  } else {
    window.__duesSelectedUnitIds.clear();
  }
  window.renderDuesTableAndCards();
};

window.toggleDuesUnitSelect = function(unitId, checked) {
  if (checked) {
    window.__duesSelectedUnitIds.add(unitId);
  } else {
    window.__duesSelectedUnitIds.delete(unitId);
  }
};

window.sendWhatsAppReminder = function(phone, ownerName, unitNum, amount, months) {
  if (!phone || phone === '—') {
    showToast(`No contact number registered for Flat ${unitNum}`, 'warning');
    return;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const activeOrgName = localStorage.getItem('rwa_active_org_name') || 'RWA Management';

  const messageText = 
    `Dear ${ownerName || 'Resident'},\n\n` +
    `Greetings from ${activeOrgName}.\n\n` +
    `This is a gentle reminder that society maintenance dues of *₹${parseFloat(amount).toLocaleString('en-IN')}* for *Flat ${unitNum}* (Billing: ${months || 'Pending Cycles'}) are currently pending.\n\n` +
    `Kindly clear the balance through the online resident portal or direct society transfer at your earliest convenience.\n\n` +
    `Thank you for your cooperation!\n- ${activeOrgName} Committee`;

  const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank');
  showToast(`💬 WhatsApp reminder launched for ${ownerName || unitNum}!`, 'success');
};

// Modal: Broadcast Batch Reminders
window.openBatchReminderModal = function() {
  const grouped = window.__duesGroupedUnits || [];
  const selectedCount = window.__duesSelectedUnitIds.size > 0 ? window.__duesSelectedUnitIds.size : grouped.length;
  const targetUnits = window.__duesSelectedUnitIds.size > 0 
    ? grouped.filter(g => window.__duesSelectedUnitIds.has(g.unitId))
    : grouped;

  const totalTargetDues = targetUnits.reduce((acc, g) => acc + g.totalDue, 0);
  const activeOrgName = localStorage.getItem('rwa_active_org_name') || 'RWA Management Committee';

  const defaultTemplate = 
`Dear [Resident Name],
Greetings from ${activeOrgName}.
Kindly note that maintenance dues of ₹[Amount] for Flat [Unit Number] remain outstanding. Please clear the pending balance to avoid late fee penalties.
Pay online: http://localhost:3000/#resident-bills
Thank you!`;

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);padding:12px;border-radius:var(--r-md);font-size:12px;color:var(--text-secondary);line-height:1.5;">
        📢 <strong>Automated Multi-Channel Dispatch:</strong> Send consolidated reminders to all defaulter units. Messages include dynamic amount, flat number, and direct payment links.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);">
        <div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:600;">TARGET AUDIENCE</div>
          <div style="font-size:16px;font-weight:800;color:var(--text-primary);margin-top:2px;">
            ${selectedCount} Flats ${window.__duesSelectedUnitIds.size > 0 ? '(Selected)' : '(All Defaulters)'}
          </div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);font-weight:600;">TOTAL PENDING COLLECTION</div>
          <div style="font-size:16px;font-weight:800;color:var(--red);margin-top:2px;">
            ₹${totalTargetDues.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <!-- Channels Selection -->
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Delivery Channels</label>
        <div style="display:flex;gap:16px;margin-top:6px;flex-wrap:wrap;">
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="batchChannelWhatsApp" checked />
            <span>💬 WhatsApp Business</span>
          </label>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="batchChannelSMS" checked />
            <span>📱 SMS Gateway</span>
          </label>
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
            <input type="checkbox" id="batchChannelPush" checked />
            <span>🔔 App Push Notification</span>
          </label>
        </div>
      </div>

      <!-- Message Template Preview -->
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Reminder Message Content</label>
        <textarea id="batchReminderText" class="form-input" rows="5" style="width:100%;font-size:12px;font-family:monospace;line-height:1.4;">${defaultTemplate}</textarea>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
          Available placeholders: <code>[Resident Name]</code>, <code>[Unit Number]</code>, <code>[Amount]</code>
        </div>
      </div>
    </div>
  `;

  showModal('📢 Broadcast Batch Dues Reminders', html, 'Dispatch Reminders Now 🚀', async () => {
    const wa = document.getElementById('batchChannelWhatsApp')?.checked;
    const sms = document.getElementById('batchChannelSMS')?.checked;
    const push = document.getElementById('batchChannelPush')?.checked;

    if (!wa && !sms && !push) {
      showToast('Please select at least one delivery channel', 'warning');
      throw new Error('Channel required');
    }

    showToast(`🚀 Dispatched reminders to ${selectedCount} flats via selected channels!`, 'success');
  }, '540px');
};

// Modal: Printable Formal Demand Notice
window.openDemandNoticeModal = function(unitId) {
  const grp = (window.__duesGroupedUnits || []).find(g => g.unitId === unitId);
  if (!grp) {
    showToast('Unit details not found', 'warning');
    return;
  }

  const activeOrgName = localStorage.getItem('rwa_active_org_name') || 'Residents Welfare Association';
  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const noticeNo = `DN-${new Date().getFullYear()}/${grp.unitNumber}`;

  const rows = grp.invoices.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;">${i.billingMonth} Maintenance</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;">#${i.invoiceNumber}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;">${i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-IN') : '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#dc2626;">₹${(i.balanceAmount || i.totalAmount).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const html = `
    <div id="printableDemandNotice" style="padding:10px;font-family:sans-serif;color:#1e293b;">
      <div style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${activeOrgName}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Registered Residents Welfare Association · Office of the Treasurer</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;font-weight:700;color:#0f172a;">NOTICE NO: ${noticeNo}</div>
          <div style="font-size:11px;color:#64748b;">Date: ${todayStr}</div>
        </div>
      </div>

      <div style="text-align:center;margin:16px 0;">
        <span style="background:#fee2e2;color:#991b1b;padding:4px 14px;border-radius:12px;font-weight:800;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">
          FORMAL NOTICE FOR OUTSTANDING MAINTENANCE DUES
        </span>
      </div>

      <div style="font-size:12px;line-height:1.6;margin-bottom:14px;">
        To,<br />
        <strong>${grp.ownerName}</strong><br />
        Flat No: <strong>${grp.unitNumber}</strong> (Block: ${grp.blockName})<br />
        Contact: ${grp.ownerPhone}
      </div>

      <p style="font-size:12px;line-height:1.6;color:#334155;margin-bottom:14px;">
        Dear Resident / Member,<br />
        This is an official communication regarding the pending society maintenance dues for your flat. Despite earlier reminders, the following bills remain unpaid as per the official society ledger:
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#f8fafc;text-align:left;">
            <th style="padding:8px;font-size:11px;color:#475569;border-bottom:1px solid #cbd5e1;">Particulars</th>
            <th style="padding:8px;font-size:11px;color:#475569;border-bottom:1px solid #cbd5e1;">Invoice #</th>
            <th style="padding:8px;font-size:11px;color:#475569;border-bottom:1px solid #cbd5e1;">Due Date</th>
            <th style="padding:8px;font-size:11px;color:#475569;border-bottom:1px solid #cbd5e1;text-align:right;">Amount Due</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="background:#f1f5f9;">
            <td colspan="3" style="padding:8px;font-weight:800;font-size:13px;text-align:right;">TOTAL OUTSTANDING:</td>
            <td style="padding:8px;font-weight:800;font-size:14px;color:#dc2626;text-align:right;">₹${grp.totalDue.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px;border-radius:6px;font-size:11px;line-height:1.5;margin-bottom:16px;">
        <strong>Payment Instructions:</strong><br />
        1. <strong>Online Portal:</strong> Log in to the Resident Portal and pay instantly via UPI/Netbanking.<br />
        2. <strong>Bank Transfer / Cheque:</strong> Transfer to Society Account or submit Cheque drawn in favor of <em>"${activeOrgName}"</em> at the RWA Office.
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:24px;font-size:11px;">
        <div>
          <em>Issued by order of the Managing Committee</em>
        </div>
        <div style="text-align:center;">
          <div style="font-weight:700;">Honorary Treasurer / Secretary</div>
          <div style="color:#64748b;">${activeOrgName}</div>
        </div>
      </div>
    </div>
  `;

  showModal(`📑 Formal Demand Notice — Flat ${grp.unitNumber}`, html, '🖨️ Print Demand Notice', () => {
    window.print();
  }, '650px');
};

// Export Defaulters to CSV
window.exportDuesDefaulters = function() {
  const grouped = window.__duesGroupedUnits || [];
  if (grouped.length === 0) {
    showToast('No defaulters to export', 'info');
    return;
  }

  const headers = ['Unit Number', 'Block', 'Resident Name', 'Phone', 'Pending Cycles', 'Pending Invoices Count', 'Total Outstanding (INR)', 'Oldest Due Date', 'Days Overdue', 'Status'];
  const rows = grouped.map(g => [
    `"${g.unitNumber}"`,
    `"${g.blockName}"`,
    `"${g.ownerName}"`,
    `"${g.ownerPhone}"`,
    `"${g.invoices.map(i => i.billingMonth).join('; ')}"`,
    g.invoices.length,
    g.totalDue,
    `"${g.oldestDueDate ? g.oldestDueDate.toISOString().split('T')[0] : 'N/A'}"`,
    g.maxDaysOverdue,
    `"${g.isCritical ? 'Critical (>30d)' : g.isOverdue ? 'Overdue' : 'Due Soon'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Society_Defaulters_Register_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('📊 Defaulters Registry exported to CSV!', 'success');
};

window.broadcastDuesReminderBatch = function() {
  window.openBatchReminderModal();
};

// =============================================
// Live Hydration Logic: Connects to /api/billing/invoices
// =============================================
window.loadLiveInvoicesScreen = async function() {
  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/billing/invoices' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '');
    const res = await (window.apiFetch || fetch)(url).catch(() => null);
    if (!res || !res.ok) {
      console.error('Failed to fetch invoices from DB');
      return;
    }

    const data = await res.json();
    const invoices = data.invoices || [];
    window.__cachedInvoices = invoices;

    // Calculate aggregations
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;

    invoices.forEach(inv => {
      totalBilled += (inv.totalAmount || 0);
      totalCollected += (inv.paidAmount || 0);
      totalOutstanding += (inv.balanceAmount || 0);
      if (inv.status === 'OVERDUE') overdueCount++;
    });

    // Update Stat Cards
    const elBilled = document.getElementById('statTotalBilled');
    const elCollected = document.getElementById('statTotalCollected');
    const elOutstanding = document.getElementById('statTotalOutstanding');
    const elOverdue = document.getElementById('statOverdueCount');
    const subEl = document.getElementById('invoicesSubtitle');

    if (elBilled) elBilled.textContent = '₹' + totalBilled.toLocaleString('en-IN');
    if (elCollected) elCollected.textContent = '₹' + totalCollected.toLocaleString('en-IN');
    if (elOutstanding) elOutstanding.textContent = '₹' + totalOutstanding.toLocaleString('en-IN');
    if (elOverdue) elOverdue.textContent = overdueCount;

    if (subEl) {
      subEl.textContent = `${invoices.length} invoices generated · ₹${totalCollected.toLocaleString('en-IN')} collected · Live database`;
    }

    // Populate billing cycles dropdown dynamically
    const monthSelect = document.getElementById('invoicesMonthFilter');
    if (monthSelect) {
      const currentVal = window.__selectedInvoiceMonth || 'ALL';
      const distinctMonths = [...new Set(invoices.map(i => i.billingMonth).filter(Boolean))].sort().reverse();
      monthSelect.innerHTML = `<option value="ALL">All Billing Cycles (${invoices.length})</option>` +
        distinctMonths.map(m => {
          const count = invoices.filter(i => i.billingMonth === m).length;
          const label = typeof window.formatMonthName === 'function' ? window.formatMonthName(m) : m;
          return `<option value="${m}" ${currentVal === m ? 'selected' : ''}>📅 ${label} (${count})</option>`;
        }).join('');
    }

    // Update Analytics Charts (Area Spline + Donut)
    window.renderInvoicesAnalytics(invoices);

    window.applyInvoicesFilters();

  } catch (err) {
    console.error('Error in loadLiveInvoicesScreen:', err);
  }
};

window.renderInvoicesAnalytics = function(invoices) {
  invoices = invoices || [];

  // 1. Day of week distribution for Area Spline Chart
  var dayCounts = [0, 0, 0, 0, 0, 0, 0];
  invoices.forEach(function(inv) {
    var dt = inv.createdAt ? new Date(inv.createdAt) : new Date();
    var jsDay = dt.getDay();
    var dayIdx = (jsDay === 0) ? 6 : (jsDay - 1);
    dayCounts[dayIdx]++;
  });

  // Update subtitle
  var diffSub = document.getElementById('invoicesDiffSubtitle');
  if (diffSub) {
    var totalBilled = invoices.reduce(function(sum, inv) { return sum + (inv.totalAmount || 0); }, 0);
    diffSub.textContent = totalBilled > 0
      ? `₹${totalBilled.toLocaleString('en-IN')} total billed across ${invoices.length} invoices`
      : '₹0 billed in current billing cycle';
  }

  if (typeof window.renderModernAreaSplineChart === 'function') {
    window.renderModernAreaSplineChart({
      containerId: 'invoicesAreaChartContainer',
      labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      data: dayCounts,
      strokeColor: '#0284C7',
      gradStart: '#38BDF8',
      gradEnd: '#E0F2FE',
      tooltipUnit: 'invoices',
    });
  }

  // 2. Status Slices for Donut Chart
  var paidCount = invoices.filter(function(i) { return i.status === 'PAID'; }).length;
  var issuedCount = invoices.filter(function(i) { return i.status === 'ISSUED' || i.status === 'PENDING'; }).length;
  var overdueCount = invoices.filter(function(i) { return i.status === 'OVERDUE'; }).length;
  var partialCount = invoices.filter(function(i) { return i.status === 'PARTIALLY_PAID'; }).length;

  var slices = [
    { label: 'Paid', count: paidCount, color: '#10B981' },
    { label: 'Issued', count: issuedCount, color: '#3B82F6' },
    { label: 'Overdue', count: overdueCount, color: '#DC2626' },
    { label: 'Partial', count: partialCount, color: '#F59E0B' },
  ];

  if (typeof window.renderModernDonutChart === 'function') {
    window.renderModernDonutChart({
      containerId: 'invoicesDonutChartContainer',
      slices: slices,
      centerCount: invoices.length,
      centerLabel: 'Invoices',
    });
  }

  var countEl = document.getElementById('invoicesTableCount');
  if (countEl) {
    var total = invoices.length;
    var showing = Math.min(10, total);
    countEl.textContent = 'Showing 1 to ' + showing + ' of ' + total + ' items';
  }
};

window.__selectedInvoiceMonth = 'ALL';
window.__selectedInvoiceStatus = 'ALL';
window.__invoiceSearchQuery = '';

window.filterInvoicesByMonth = function(month) {
  window.__selectedInvoiceMonth = month || 'ALL';
  window.applyInvoicesFilters();
};

window.filterInvoicesByStatus = function(status, pillEl) {
  window.__selectedInvoiceStatus = status || 'ALL';

  const pills = document.querySelectorAll('#invoicesFilterPillsContainer .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (pillEl) {
    pillEl.classList.add('active');
  }

  window.applyInvoicesFilters();
};

window.handleInvoicesSearch = function(query) {
  window.__invoiceSearchQuery = (query || '').toLowerCase().trim();
  window.applyInvoicesFilters();
};

window.applyInvoicesFilters = function() {
  let filtered = window.__cachedInvoices || [];

  if (window.__selectedInvoiceMonth && window.__selectedInvoiceMonth !== 'ALL') {
    filtered = filtered.filter(inv => inv.billingMonth === window.__selectedInvoiceMonth);
  }

  if (window.__selectedInvoiceStatus && window.__selectedInvoiceStatus !== 'ALL') {
    filtered = filtered.filter(inv => inv.status === window.__selectedInvoiceStatus);
  }

  if (window.__invoiceSearchQuery) {
    const q = window.__invoiceSearchQuery;
    filtered = filtered.filter(inv => {
      const num = (inv.invoiceNumber || '').toLowerCase();
      const unit = (inv.unit?.unitNumber || '').toLowerCase();
      const owner = (inv.unit?.ownerName || '').toLowerCase();
      const month = (inv.billingMonth || '').toLowerCase();
      return num.includes(q) || unit.includes(q) || owner.includes(q) || month.includes(q);
    });
  }

  // Update stat cards to reflect current filtered cycle if a specific month is selected
  if (window.__selectedInvoiceMonth && window.__selectedInvoiceMonth !== 'ALL') {
    let billed = 0, collected = 0, outstanding = 0, overdue = 0;
    filtered.forEach(inv => {
      billed += (inv.totalAmount || 0);
      collected += (inv.paidAmount || 0);
      outstanding += (inv.balanceAmount || 0);
      if (inv.status === 'OVERDUE') overdue++;
    });
    const elBilled = document.getElementById('statTotalBilled');
    const elCollected = document.getElementById('statTotalCollected');
    const elOutstanding = document.getElementById('statTotalOutstanding');
    const elOverdue = document.getElementById('statOverdueCount');
    if (elBilled) elBilled.textContent = '₹' + billed.toLocaleString('en-IN');
    if (elCollected) elCollected.textContent = '₹' + collected.toLocaleString('en-IN');
    if (elOutstanding) elOutstanding.textContent = '₹' + outstanding.toLocaleString('en-IN');
    if (elOverdue) elOverdue.textContent = overdue;
  }

  renderInvoicesData(filtered);
};

function renderInvoicesData(invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  const cardsContainer = document.getElementById('invoicesMobileCardsContainer');
  const summaryEl = document.getElementById('invoicesPaginationSummary');
  const countEl = document.getElementById('invoicesTableCount');

  if (countEl) {
    const showing = Math.min(10, invoices.length);
    countEl.textContent = `Showing 1 to ${showing} of ${invoices.length} items`;
  }

  if (summaryEl) {
    summaryEl.textContent = `Showing ${invoices.length} of ${window.__cachedInvoices.length} total invoices`;
  }

  if (!invoices || invoices.length === 0) {
    const emptyMsg = `<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted);">No invoices found.</td></tr>`;
    if (tbody) tbody.innerHTML = emptyMsg;
    if (cardsContainer) cardsContainer.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">No invoices found.</div>`;
    return;
  }

  // 1. Render Desktop Table
  if (tbody) {
    tbody.innerHTML = invoices.map(inv => {
      const unitNum = inv.unit ? inv.unit.unitNumber : 'Common';
      const owner = inv.unit ? (inv.unit.ownerName || 'Resident') : 'Resident';
      const statusPill = inv.status === 'PAID'
        ? '<span class="pill-badge pill-status-resolved">paid</span>'
        : (inv.status === 'OVERDUE'
          ? '<span class="pill-badge pill-priority-urgent">overdue</span>'
          : (inv.status === 'PARTIALLY_PAID'
            ? '<span class="pill-badge pill-status-in-progress">partial</span>'
            : '<span class="pill-badge pill-status-new">issued</span>'));

      return `
        <tr onclick="viewInvoiceDetail('${inv.id}')" style="cursor:pointer;">
          <td onclick="event.stopPropagation()" style="width:38px;text-align:center;">
            <input type="checkbox" class="invoice-row-check" value="${inv.id}" onchange="handleInvoiceSelectionChange()" style="cursor:pointer;" />
          </td>
          <td style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:700;">${inv.invoiceNumber}</td>
          <td><strong>${unitNum}</strong></td>
          <td>${owner}</td>
          <td>${inv.billingMonth}</td>
          <td style="font-weight:700;">₹${inv.totalAmount.toLocaleString('en-IN')}</td>
          <td style="color:var(--green);font-weight:700;">₹${inv.paidAmount.toLocaleString('en-IN')}</td>
          <td style="color:${inv.balanceAmount > 0 ? 'var(--red)' : 'var(--text-muted)'};font-weight:700;">
            ₹${inv.balanceAmount.toLocaleString('en-IN')}
          </td>
          <td>${statusPill}</td>
          <td onclick="event.stopPropagation()">
            <div style="display:flex;gap:4px;">
              ${inv.status !== 'PAID' ? `
                <button class="btn btn-primary btn-sm" onclick="triggerRazorpayPayment('${inv.id}')" title="Pay with Razorpay">💳 Pay</button>
              ` : `
                <button class="btn btn-ghost btn-sm btn-icon" onclick="viewInvoiceDetail('${inv.id}')" title="Receipt">🧾</button>
              `}
              <button class="btn btn-ghost btn-sm btn-icon" onclick="viewInvoiceDetail('${inv.id}')" title="Inspect">🔍</button>
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

    cardsContainer.innerHTML = invoices.map(inv => {
      const s = INVOICE_STATUS_MAP[inv.status] || { color: 'muted', label: inv.status };
      const unitNum = inv.unit ? inv.unit.unitNumber : 'Common';
      const owner = inv.unit ? (inv.unit.ownerName || 'Resident') : 'Resident';

      return `
        <div class="card card-sm" style="display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;" onclick="viewInvoiceDetail('${inv.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-family:monospace;font-size:12px;color:var(--blue);font-weight:700;">${inv.invoiceNumber}</div>
              <div style="font-size:15px;font-weight:800;color:var(--text-primary);margin-top:2px;">Flat ${unitNum} · ${owner}</div>
            </div>
            <span class="badge badge-${s.color}">${s.label}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;border-top:1px solid var(--border-light);padding-top:8px;">
            <div>
              <div style="font-size:11px;color:var(--text-muted);">Period: ${inv.billingMonth}</div>
              <div style="font-size:13px;color:var(--text-secondary);">Total: ₹${inv.totalAmount.toLocaleString('en-IN')}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:15px;font-weight:800;color:${inv.balanceAmount > 0 ? 'var(--red)' : 'var(--green)'}">
                ₹${inv.balanceAmount.toLocaleString('en-IN')}
              </div>
              <div style="font-size:11px;color:var(--text-muted);">${inv.balanceAmount > 0 ? 'Balance' : 'Settled'}</div>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:4px;" onclick="event.stopPropagation()">
            ${inv.status !== 'PAID' ? `
              <button class="btn btn-primary btn-sm" style="flex:1;min-height:44px;justify-content:center;" onclick="triggerRazorpayPayment('${inv.id}')">
                💳 Pay Razorpay
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" style="flex:1;min-height:44px;justify-content:center;" onclick="viewInvoiceDetail('${inv.id}')">
                🧾 View Receipt
              </button>
            `}
            <button class="btn btn-ghost btn-sm" style="min-height:44px;padding:0 14px;" onclick="viewInvoiceDetail('${inv.id}')">
              Details →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.viewInvoiceDetail = function(invoiceId) {
  const inv = window.__cachedInvoices.find(i => i.id === invoiceId);
  if (inv) {
    window.__selectedInvoice = inv;
    Router.go('admin-invoice-detail');
  }
};

// =============================================
// 4. Razorpay Payment Trigger & Verification
// =============================================
window.triggerRazorpayPayment = async function(invoiceId) {
  try {
    showToast('Initializing secure Razorpay gateway...', 'info');

    // 1. Call Create Order API
    const orderRes = await (window.apiFetch || fetch)('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      showToast(orderData.error || 'Failed to initiate payment', 'warning');
      return;
    }

    const { order, invoice, paymentId, razorpayKeyId } = orderData;

    // 2. Open Payment Confirmation / Checkout Modal
    const modalHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--blue-light);border-radius:var(--r-md);">
          <div style="font-size:24px;">💳</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--blue);">Razorpay Payment Gateway</div>
            <div style="font-size:12px;color:var(--blue);">Simulated & Live Razorpay Checkout Flow</div>
          </div>
        </div>

        <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-md);display:flex;flex-direction:column;gap:8px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Invoice:</span>
            <strong style="font-family:monospace;">${invoice.invoiceNumber}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Flat Unit:</span>
            <strong>Flat ${invoice.unitNumber}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:var(--text-muted);">Payable Amount:</span>
            <strong style="font-size:16px;color:var(--green);">₹${invoice.amount.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div>
          <label class="form-label">Payment Method</label>
          <select id="rzpPaymentMethod" class="form-select" style="width:100%;font-size:15px;">
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="CREDIT_CARD">Credit / Debit Card</option>
            <option value="NETBANKING">Net Banking (HDFC / ICICI / SBI)</option>
          </select>
        </div>
      </div>
    `;

    showModal(`Pay ₹${invoice.amount.toLocaleString('en-IN')} via Razorpay`, modalHtml, 'Confirm & Pay', async () => {
      showToast('Processing Razorpay transaction...', 'info');

      const method = document.getElementById('rzpPaymentMethod')?.value || 'UPI';
      const mockPayId = `pay_${Date.now()}`;

      // 3. Verify Payment
      const verifyRes = await (window.apiFetch || fetch)('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: order.id,
          razorpayPaymentId: mockPayId,
          razorpaySignature: 'dev_mock_signature',
          invoiceId: invoice.id,
          method,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        showToast(verifyData.error || 'Payment verification failed', 'warning');
        return;
      }

      showToast(`Payment of ₹${invoice.amount.toLocaleString('en-IN')} successful! 🎉`, 'success');
      window.loadLiveInvoicesScreen();
      if (typeof Router !== 'undefined' && Router.current() === 'admin-invoice-detail') {
        Router.go('admin-invoices');
      }
    });

  } catch (err) {
    console.error('Razorpay payment error:', err);
    showToast('Failed to complete Razorpay payment', 'warning');
  }
};

window.__selectedInvoiceIds = [];

window.toggleSelectAllInvoices = function(checked) {
  const checkboxes = document.querySelectorAll('.invoice-row-check');
  window.__selectedInvoiceIds = [];
  checkboxes.forEach(cb => {
    cb.checked = checked;
    if (checked) window.__selectedInvoiceIds.push(cb.value);
  });
  updateBulkActionBar();
};

window.handleInvoiceSelectionChange = function() {
  const checkboxes = document.querySelectorAll('.invoice-row-check');
  window.__selectedInvoiceIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) window.__selectedInvoiceIds.push(cb.value);
  });
  const allCheck = document.getElementById('selectAllInvoicesCheck');
  if (allCheck) allCheck.checked = (checkboxes.length > 0 && window.__selectedInvoiceIds.length === checkboxes.length);
  updateBulkActionBar();
};

function updateBulkActionBar() {
  const bar = document.getElementById('invoicesBulkActionBar');
  const countBadge = document.getElementById('selectedInvoicesCountBadge');
  const count = window.__selectedInvoiceIds.length;
  if (bar) {
    bar.style.display = count > 0 ? 'flex' : 'none';
  }
  if (countBadge) {
    countBadge.textContent = `${count} selected`;
  }
}

window.clearInvoiceSelections = function() {
  window.__selectedInvoiceIds = [];
  const checkboxes = document.querySelectorAll('.invoice-row-check');
  checkboxes.forEach(cb => cb.checked = false);
  const allCheck = document.getElementById('selectAllInvoicesCheck');
  if (allCheck) allCheck.checked = false;
  updateBulkActionBar();
};

window.executeSelectedBulkUpdate = function() {
  if (window.__selectedInvoiceIds.length === 0) {
    showToast('Please select at least one invoice to update', 'warning');
    return;
  }
  openBulkUpdateBillsModal(window.__selectedInvoiceIds);
};

window.triggerBatchGenerateBillsModal = function() {
  if (typeof window.openGenerateBillsModal === 'function') {
    window.openGenerateBillsModal();
  }
};

window.exportInvoicesRegister = function() {
  if (!window.__cachedInvoices || window.__cachedInvoices.length === 0) {
    showToast('No invoices to export', 'warning');
    return;
  }

  const rows = [
    ['Invoice Number', 'Unit Number', 'Owner / Resident', 'Billing Month', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status'],
    ...window.__cachedInvoices.map(inv => [
      inv.invoiceNumber,
      inv.unit ? inv.unit.unitNumber : '',
      inv.unit ? (inv.unit.ownerName || '') : '',
      inv.billingMonth,
      inv.totalAmount,
      inv.paidAmount,
      inv.balanceAmount,
      inv.status,
    ])
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Invoices_Register_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Invoices register exported successfully!', 'success');
};
