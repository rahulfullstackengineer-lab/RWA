// =============================================
// Vendors, Staff & Assets Screens
// =============================================

window.__cachedVendorsList = null;
window.__cachedContractsList = null;
window.__cachedVendorMetrics = null;
window._vendorTypeFilter = 'ALL';
window._contractStatusFilter = 'ALL';

// Safe modal helper for vendors
function openVendorModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '620px';
  var overlay = document.getElementById('rwaVendorModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaVendorModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
        '<button type="button" onclick="document.getElementById(\'rwaVendorModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<form id="rwaVendorForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
        contentHtml +
        '<div style="display:flex;gap:10px;margin-top:8px;">' +
          (submitLabel
            ? '<button type="button" onclick="document.getElementById(\'rwaVendorModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
              '<button type="submit" id="rwaVendorSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
            : '<button type="button" onclick="document.getElementById(\'rwaVendorModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
          ) +
        '</div>' +
      '</form>' +
    '</div>';

  overlay.style.display = 'flex';

  var form = document.getElementById('rwaVendorForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById('rwaVendorSubBtn');
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

// Add Vendor Modal
window.openAddVendorModal = function() {
  var html = `
    <div>
      <label class="form-label">Vendor / Agency / Technician Name *</label>
      <input type="text" id="vName" required placeholder="e.g. Apex Elevator Services, Sharma Plumbers" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Trade / Service Category *</label>
        <select id="vService" class="form-select" style="width:100%;">
          <option value="Plumbing & Water Supply">🚰 Plumbing &amp; Water Supply</option>
          <option value="Electrical & Power">⚡ Electrical &amp; Power</option>
          <option value="Elevator & Lift AMC">🛗 Elevator &amp; Lift AMC</option>
          <option value="Carpentry & Door Locks">🪚 Carpentry &amp; Locks</option>
          <option value="Civil Seepage & Masonry">🧱 Civil Seepage &amp; Masonry</option>
          <option value="CCTV & Gate Security">📹 CCTV &amp; Security</option>
          <option value="Housekeeping & Sanitation">🧹 Housekeeping &amp; Sanitation</option>
          <option value="Horticulture & Landscaping">🌱 Horticulture &amp; Gardening</option>
          <option value="Fire Safety & Extinguishers">🧯 Fire Safety Equipment</option>
          <option value="AC & HVAC Maintenance">❄️ AC &amp; HVAC</option>
          <option value="Pest Control & Fogging">🦟 Pest Control</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Contact Mobile Number *</label>
        <input type="tel" id="vPhone" required placeholder="+91 98765 11223" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Person / Supervisor</label>
        <input type="text" id="vPerson" placeholder="e.g. Ramesh Kumar" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Engagement Type</label>
        <select id="vType" class="form-select" style="width:100%;">
          <option value="AMC">Annual Maintenance Contract (AMC)</option>
          <option value="CONTRACT">Monthly Retainer Contract</option>
          <option value="ON_CALL">On-Call Freelance Technician</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Email Address</label>
        <input type="email" id="vEmail" placeholder="vendor@example.com" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">GSTIN / Tax ID (Optional)</label>
        <input type="text" id="vGstin" placeholder="e.g. 04AABCS1234F1Z1" class="form-input" style="width:100%;text-transform:uppercase;" />
      </div>
    </div>

    <div>
      <label class="form-label">Workshop Address / Remarks</label>
      <input type="text" id="vAddress" placeholder="e.g. SCO 42, Sector 22 Market, Chandigarh" class="form-input" style="width:100%;" />
    </div>
  `;

  openVendorModal('➕ Onboard Society Vendor / Technician', html, 'Save Vendor to Directory', async function() {
    var name = document.getElementById('vName').value.trim();
    var service = document.getElementById('vService').value;
    var phone = document.getElementById('vPhone').value.trim();
    var contactPerson = document.getElementById('vPerson').value.trim();
    var type = document.getElementById('vType').value;
    var email = document.getElementById('vEmail').value.trim();
    var gstin = document.getElementById('vGstin').value.trim();
    var address = document.getElementById('vAddress').value.trim();

    if (!name || !phone) {
      if (typeof window.showToast === 'function') window.showToast('Vendor Name and Phone are required', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_vendor', name: name, service: service, phone: phone, contactPerson: contactPerson, type: type, email: email, gstin: gstin, address: address }),
      }) : fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_vendor', name: name, service: service, phone: phone, contactPerson: contactPerson, type: type, email: email, gstin: gstin, address: address }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Vendor "${name}" onboarded successfully!`, 'success');
        }
        await window.loadLiveVendorsScreen();
      } else {
        var errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save vendor');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error onboarding vendor', 'error');
    }
  }, '620px');
};

// Edit Vendor Modal
window.openEditVendorModal = function(vendorId) {
  var vendor = (window.__cachedVendorsList || []).find(v => v.id === vendorId);
  if (!vendor) return;

  var html = `
    <div>
      <label class="form-label">Vendor / Agency / Technician Name *</label>
      <input type="text" id="evName" required value="${vendor.name || ''}" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Trade / Service Category *</label>
        <select id="evService" class="form-select" style="width:100%;">
          <option value="Plumbing & Water Supply" ${vendor.service==='Plumbing & Water Supply'?'selected':''}>🚰 Plumbing &amp; Water Supply</option>
          <option value="Electrical & Power" ${vendor.service==='Electrical & Power'||vendor.service==='Electrical & Transformers'?'selected':''}>⚡ Electrical &amp; Power</option>
          <option value="Elevator & Lift AMC" ${vendor.service==='Elevator & Lift AMC'?'selected':''}>🛗 Elevator &amp; Lift AMC</option>
          <option value="Carpentry & Door Locks" ${vendor.service==='Carpentry & Door Locks'?'selected':''}>🪚 Carpentry &amp; Locks</option>
          <option value="Civil Seepage & Masonry" ${vendor.service==='Civil Seepage & Masonry'?'selected':''}>🧱 Civil Seepage &amp; Masonry</option>
          <option value="Security & Gate Guarding" ${vendor.service==='Security & Gate Guarding'||vendor.service==='CCTV & Gate Security'?'selected':''}>🛡️ Security &amp; Gate Guarding</option>
          <option value="Housekeeping & Sanitation" ${vendor.service==='Housekeeping & Sanitation'?'selected':''}>🧹 Housekeeping &amp; Sanitation</option>
          <option value="Horticulture & Landscaping" ${vendor.service==='Horticulture & Landscaping'||vendor.service==='Horticulture & Lawn Maintenance'?'selected':''}>🌱 Horticulture &amp; Gardening</option>
          <option value="Fire Safety & Extinguishers" ${vendor.service==='Fire Safety & Extinguishers'?'selected':''}>🧯 Fire Safety Equipment</option>
          <option value="AC & HVAC Maintenance" ${vendor.service==='AC & HVAC Maintenance'?'selected':''}>❄️ AC &amp; HVAC</option>
          <option value="Pest Control & Fogging" ${vendor.service==='Pest Control & Fogging'?'selected':''}>🦟 Pest Control</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Contact Mobile Number *</label>
        <input type="tel" id="evPhone" required value="${vendor.phone || ''}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Person / Supervisor</label>
        <input type="text" id="evPerson" value="${vendor.contactPerson || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Engagement Type</label>
        <select id="evType" class="form-select" style="width:100%;">
          <option value="AMC" ${vendor.type==='AMC'?'selected':''}>Annual Maintenance Contract (AMC)</option>
          <option value="CONTRACT" ${vendor.type==='CONTRACT'?'selected':''}>Monthly Retainer Contract</option>
          <option value="ON_CALL" ${vendor.type==='ON_CALL'?'selected':''}>On-Call Freelance Technician</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Status</label>
        <select id="evStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE" ${vendor.status==='ACTIVE'?'selected':''}>Active</option>
          <option value="INACTIVE" ${vendor.status==='INACTIVE'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Vendor Rating (1.0 - 5.0)</label>
        <input type="number" id="evRating" step="0.1" min="1" max="5" value="${vendor.rating || 4.8}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Email Address</label>
        <input type="email" id="evEmail" value="${vendor.email || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">GSTIN / Tax ID</label>
        <input type="text" id="evGstin" value="${vendor.gstin || ''}" class="form-input" style="width:100%;text-transform:uppercase;" />
      </div>
    </div>

    <div>
      <label class="form-label">Workshop Address / Remarks</label>
      <input type="text" id="evAddress" value="${vendor.address || ''}" class="form-input" style="width:100%;" />
    </div>
  `;

  openVendorModal('✏️ Edit Vendor Details: ' + vendor.name, html, 'Save Changes', async function() {
    var name = document.getElementById('evName').value.trim();
    var service = document.getElementById('evService').value;
    var phone = document.getElementById('evPhone').value.trim();
    var contactPerson = document.getElementById('evPerson').value.trim();
    var type = document.getElementById('evType').value;
    var status = document.getElementById('evStatus').value;
    var rating = parseFloat(document.getElementById('evRating').value) || 5.0;
    var email = document.getElementById('evEmail').value.trim();
    var gstin = document.getElementById('evGstin').value.trim();
    var address = document.getElementById('evAddress').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_vendor', id: vendorId, name, service, phone, contactPerson, type, status, rating, email, gstin, address }),
      }) : fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_vendor', id: vendorId, name, service, phone, contactPerson, type, status, rating, email, gstin, address }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast('✅ Vendor updated successfully!', 'success');
        await window.loadLiveVendorsScreen();
      } else {
        var errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update vendor');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error updating vendor', 'error');
    }
  }, '620px');
};

// Delete Vendor
window.confirmDeleteVendor = async function(vendorId, vendorName) {
  if (!confirm(`Are you sure you want to remove "${vendorName}" from the empanelled vendors directory?`)) return;

  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/vendors?id=' + encodeURIComponent(vendorId) + '&type=vendor', {
      method: 'DELETE',
    }) : fetch('/api/vendors?id=' + encodeURIComponent(vendorId) + '&type=vendor', {
      method: 'DELETE',
    }));

    if (res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`🗑️ Vendor "${vendorName}" removed`, 'info');
      await window.loadLiveVendorsScreen();
    } else {
      var err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete vendor');
    }
  } catch (e) {
    if (typeof window.showToast === 'function') window.showToast(e.message || 'Error deleting vendor', 'error');
  }
};

// Add AMC Agreement Modal
window.openAddAgreementModal = function(preselectedVendorId) {
  var vendors = window.__cachedVendorsList || [];
  if (vendors.length === 0) {
    if (typeof window.showToast === 'function') window.showToast('Please onboard at least one vendor first.', 'warning');
    return;
  }

  var vendorOptions = vendors.map(v => 
    `<option value="${v.id}" ${v.id === preselectedVendorId ? 'selected' : ''}>${v.name} (${v.service})</option>`
  ).join('');

  var todayStr = '2026-10-13';
  var nextYearStr = '2027-10-12';

  var html = `
    <div>
      <label class="form-label">Agreement / Contract Title *</label>
      <input type="text" id="cTitle" required placeholder="e.g. OTIS Passenger Lifts AMC (Blocks A & B)" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Empanelled Contractor / Vendor *</label>
        <select id="cVendorId" class="form-select" style="width:100%;">
          ${vendorOptions}
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Category *</label>
        <select id="cCategory" class="form-select" style="width:100%;">
          <option value="Elevator & Lift AMC">🛗 Elevator &amp; Lift AMC</option>
          <option value="Security & Gate Guarding">🛡️ Security &amp; Gate Guarding</option>
          <option value="Housekeeping & Sanitation">🧹 Housekeeping &amp; Sanitation</option>
          <option value="Electrical & Transformers">⚡ Electrical &amp; Transformers</option>
          <option value="Plumbing & Water Supply">🚰 Plumbing &amp; Water Supply</option>
          <option value="Fire Safety Equipment">🧯 Fire Safety Equipment</option>
          <option value="CCTV & Intercom AMC">📹 CCTV &amp; Intercom AMC</option>
          <option value="General Facility Maintenance">🛠️ General Facility Maintenance</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Monthly Payout Amount (₹) *</label>
        <input type="number" id="cMonthlyAmount" required placeholder="e.g. 8500" min="0" class="form-input" style="width:100%;font-weight:700;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Billing Cycle</label>
        <select id="cBillingFreq" class="form-select" style="width:100%;">
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="ANNUAL">Annual Lump-sum</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Start Date *</label>
        <input type="date" id="cStartDate" required value="${todayStr}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Expiry / End Date *</label>
        <input type="date" id="cEndDate" required value="${nextYearStr}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div>
      <label class="form-label">SLA Scope of Work &amp; Breakdown Response Time</label>
      <textarea id="cSla" rows="2" placeholder="e.g. Monthly routine service on 1st Saturday, 24x7 emergency response within 30 minutes, parts replacement covered under warranty" class="form-input" style="width:100%;font-size:12.5px;"></textarea>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Vendor Supervisor / Contact Person</label>
        <input type="text" id="cPerson" placeholder="e.g. Karan Mehra" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Emergency Hotline</label>
        <input type="tel" id="cPhone" placeholder="1800-200-4455" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
      <input type="checkbox" id="cAutoRenew" style="cursor:pointer;" />
      <label for="cAutoRenew" style="font-size:13px;font-weight:600;color:#334155;cursor:pointer;margin:0;">Enable Auto-Renewal Reminder 45 days prior to expiration</label>
    </div>
  `;

  openVendorModal('📋 Register New AMC / Retainer Agreement', html, 'Save Agreement', async function() {
    var title = document.getElementById('cTitle').value.trim();
    var vendorId = document.getElementById('cVendorId').value;
    var category = document.getElementById('cCategory').value;
    var monthlyAmount = parseFloat(document.getElementById('cMonthlyAmount').value) || 0;
    var billingFrequency = document.getElementById('cBillingFreq').value;
    var startDate = document.getElementById('cStartDate').value;
    var endDate = document.getElementById('cEndDate').value;
    var slaDetails = document.getElementById('cSla').value.trim();
    var contactPerson = document.getElementById('cPerson').value.trim();
    var contactPhone = document.getElementById('cPhone').value.trim();
    var autoRenew = document.getElementById('cAutoRenew').checked;

    if (!title || !vendorId || !monthlyAmount || !startDate || !endDate) {
      if (typeof window.showToast === 'function') window.showToast('Please fill all required agreement fields', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_contract',
          title,
          vendorId,
          category,
          monthlyAmount,
          billingFrequency,
          startDate,
          endDate,
          slaDetails,
          contactPerson,
          contactPhone,
          autoRenew,
        }),
      }) : fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_contract',
          title,
          vendorId,
          category,
          monthlyAmount,
          billingFrequency,
          startDate,
          endDate,
          slaDetails,
          contactPerson,
          contactPhone,
          autoRenew,
        }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`🎉 AMC Agreement "${title}" registered!`, 'success');
        await window.loadLiveVendorsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save agreement');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error creating agreement', 'error');
    }
  }, '650px');
};

// Renew Contract Modal
window.openRenewAgreementModal = function(contractId) {
  var contract = (window.__cachedContractsList || []).find(c => c.id === contractId);
  if (!contract) return;

  var currentEnd = new Date(contract.endDate);
  var nextEnd = new Date(currentEnd);
  nextEnd.setFullYear(nextEnd.getFullYear() + 1);
  var nextEndStr = nextEnd.toISOString().split('T')[0];

  var html = `
    <div style="padding:12px;background:#F1F5F9;border-radius:10px;margin-bottom:8px;font-size:13px;">
      <div style="font-weight:700;color:#0F172A;font-size:14.5px;">${contract.title}</div>
      <div style="color:#64748B;margin-top:2px;">Contractor: <strong>${contract.vendorName}</strong></div>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:12.5px;">
        <div>Current Expiry: <strong style="color:#B45309;">${contract.endDate}</strong></div>
        <div>Current Payout: <strong>₹${contract.monthlyAmount.toLocaleString('en-IN')}/mo</strong></div>
      </div>
    </div>

    <div>
      <label class="form-label">Extended Expiry Date *</label>
      <input type="date" id="renewEndDate" required value="${nextEndStr}" class="form-input" style="width:100%;font-weight:600;" />
      <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Defaults to 1-year annual extension</div>
    </div>

    <div>
      <label class="form-label">Revised Monthly Payout (₹)</label>
      <input type="number" id="renewAmount" value="${contract.monthlyAmount}" class="form-input" style="width:100%;font-weight:700;" />
      <div style="font-size:11.5px;color:#64748B;margin-top:2px;">Leave unchanged if renewal is at current rates</div>
    </div>

    <div>
      <label class="form-label">Renewal Committee Notes / Resolution Ref</label>
      <textarea id="renewNotes" rows="2" placeholder="e.g. Approved in MC meeting dated Oct 2026. Rate revised by 5% as per escalator clause." class="form-input" style="width:100%;font-size:12.5px;"></textarea>
    </div>
  `;

  openVendorModal('🔄 Renew Maintenance Agreement', html, 'Confirm & Renew Contract', async function() {
    var newEndDate = document.getElementById('renewEndDate').value;
    var revisedAmount = parseFloat(document.getElementById('renewAmount').value) || contract.monthlyAmount;
    var notes = document.getElementById('renewNotes').value.trim();

    if (!newEndDate) {
      if (typeof window.showToast === 'function') window.showToast('Please select a new expiry date', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew_contract',
          contractId,
          newEndDate,
          revisedAmount,
          notes,
        }),
      }) : fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew_contract',
          contractId,
          newEndDate,
          revisedAmount,
          notes,
        }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`🎉 Contract "${contract.title}" renewed through ${newEndDate}!`, 'success');
        await window.loadLiveVendorsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to renew contract');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error renewing contract', 'error');
    }
  }, '560px');
};

// Edit Contract Modal
window.openEditAgreementModal = function(contractId) {
  var contract = (window.__cachedContractsList || []).find(c => c.id === contractId);
  if (!contract) return;

  var html = `
    <div>
      <label class="form-label">Agreement Title *</label>
      <input type="text" id="ecTitle" required value="${contract.title}" class="form-input" style="width:100%;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Monthly Payout (₹) *</label>
        <input type="number" id="ecAmount" required value="${contract.monthlyAmount}" class="form-input" style="width:100%;font-weight:700;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Status</label>
        <select id="ecStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE" ${contract.status==='ACTIVE'?'selected':''}>Active</option>
          <option value="EXPIRING" ${contract.status==='EXPIRING'?'selected':''}>Expiring Soon</option>
          <option value="EXPIRED" ${contract.status==='EXPIRED'?'selected':''}>Expired</option>
          <option value="TERMINATED" ${contract.status==='TERMINATED'?'selected':''}>Terminated</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Start Date</label>
        <input type="date" id="ecStartDate" value="${contract.startDate}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">End Date</label>
        <input type="date" id="ecEndDate" value="${contract.endDate}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div>
      <label class="form-label">SLA Scope Details</label>
      <textarea id="ecSla" rows="2" class="form-input" style="width:100%;font-size:12.5px;">${contract.slaDetails || ''}</textarea>
    </div>
  `;

  openVendorModal('✏️ Edit Agreement: ' + contract.title, html, 'Save Changes', async function() {
    var title = document.getElementById('ecTitle').value.trim();
    var monthlyAmount = parseFloat(document.getElementById('ecAmount').value) || 0;
    var status = document.getElementById('ecStatus').value;
    var startDate = document.getElementById('ecStartDate').value;
    var endDate = document.getElementById('ecEndDate').value;
    var slaDetails = document.getElementById('ecSla').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_contract',
          id: contractId,
          title,
          monthlyAmount,
          status,
          startDate,
          endDate,
          slaDetails,
        }),
      }) : fetch('/api/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_contract',
          id: contractId,
          title,
          monthlyAmount,
          status,
          startDate,
          endDate,
          slaDetails,
        }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast('✅ Agreement updated successfully!', 'success');
        await window.loadLiveVendorsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update contract');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error updating agreement', 'error');
    }
  }, '580px');
};

// Delete Contract
window.confirmDeleteContract = async function(contractId, contractTitle) {
  if (!confirm(`Are you sure you want to terminate & remove AMC Agreement "${contractTitle}"?`)) return;

  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/vendors?id=' + encodeURIComponent(contractId) + '&type=contract', {
      method: 'DELETE',
    }) : fetch('/api/vendors?id=' + encodeURIComponent(contractId) + '&type=contract', {
      method: 'DELETE',
    }));

    if (res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`🗑️ Agreement "${contractTitle}" deleted`, 'info');
      await window.loadLiveVendorsScreen();
    } else {
      var err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete agreement');
    }
  } catch (e) {
    if (typeof window.showToast === 'function') window.showToast(e.message || 'Error deleting agreement', 'error');
  }
};

// Filter Functions
window.filterVendorsByType = function(type) {
  window._vendorTypeFilter = type;
  document.querySelectorAll('.vtype-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-type') === type);
  });
  window.renderVendorsCards();
};

window.filterContractsByStatus = function(status) {
  window._contractStatusFilter = status;
  document.querySelectorAll('.cstatus-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === status);
  });
  window.renderContractsCards();
};

window.reviewExpiringRenewals = function() {
  window.filterContractsByStatus('EXPIRING');
  var section = document.getElementById('contractsContainerCard');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
};

// Main Data Fetcher
window.loadLiveVendorsScreen = async function() {
  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/vendors') : fetch('/api/vendors'));
    if (res.ok) {
      var data = await res.json();
      window.__cachedVendorsList = data.vendors || [];
      window.__cachedContractsList = data.contracts || [];
      window.__cachedVendorMetrics = data.metrics || {};
    }
  } catch (e) {
    console.error('Failed to fetch vendors:', e);
  }

  // Update DOM Metrics
  var metrics = window.__cachedVendorMetrics || {};
  var vendors = window.__cachedVendorsList || [];
  var contracts = window.__cachedContractsList || [];

  var elVendorsTotal = document.getElementById('vendorsMetricTotal');
  if (elVendorsTotal) elVendorsTotal.textContent = (metrics.activeVendors !== undefined ? metrics.activeVendors : vendors.length) + ' Active';

  var elContractsTotal = document.getElementById('contractsMetricTotal');
  if (elContractsTotal) elContractsTotal.textContent = (metrics.activeContracts !== undefined ? metrics.activeContracts : contracts.length) + ' Contracts';

  var elContractsExpiring = document.getElementById('contractsMetricExpiring');
  if (elContractsExpiring) elContractsExpiring.textContent = (metrics.expiringContracts || 0) + ' Expiring Soon';

  var elContractsPayout = document.getElementById('contractsMetricPayout');
  if (elContractsPayout) elContractsPayout.textContent = '₹' + (metrics.monthlyPayout || 0).toLocaleString('en-IN');

  // Update Expiring Banner
  var bannerContainer = document.getElementById('expiringContractsAlertBanner');
  if (bannerContainer) {
    if (metrics.expiringContracts > 0) {
      var expiringNames = (metrics.expiringList || []).map(e => e.title).join(' and ');
      bannerContainer.style.display = 'flex';
      bannerContainer.innerHTML = `
        <span style="font-size:22px;">⚠️</span>
        <div style="flex:1;">
          <div style="font-size:13.5px;font-weight:700;color:var(--amber);">${metrics.expiringContracts} contract${metrics.expiringContracts>1?'s':''} expiring in the next 45 days</div>
          <div style="font-size:12px;color:var(--text-muted);">${expiringNames ? expiringNames + ' are due for annual renewal.' : 'Annual AMC renewals are approaching.'}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.reviewExpiringRenewals()" style="font-weight:600;">Review Renewals (${metrics.expiringContracts})</button>
      `;
    } else {
      bannerContainer.style.display = 'flex';
      bannerContainer.style.background = '#F0FDF4';
      bannerContainer.style.borderColor = '#BBF7D0';
      bannerContainer.innerHTML = `
        <span style="font-size:20px;">✅</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#16A34A;">All AMC Agreements in Active Term</div>
          <div style="font-size:12px;color:var(--text-muted);">Zero agreements expiring within the next 45 days. Complete SLA compliance.</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.openAddAgreementModal()">+ Add New AMC</button>
      `;
    }
  }

  window.renderVendorsCards();
  window.renderContractsCards();
};

// Render Vendors Cards
window.renderVendorsCards = function() {
  var container = document.getElementById('vendorsCardsList');
  if (!container) return;

  var vendors = window.__cachedVendorsList || [];
  var filterText = (document.getElementById('vendorSearchInput')?.value || '').toLowerCase().trim();
  var typeFilter = window._vendorTypeFilter || 'ALL';

  if (typeFilter !== 'ALL') {
    vendors = vendors.filter(v => v.type === typeFilter);
  }

  if (filterText) {
    vendors = vendors.filter(v => 
      (v.name && v.name.toLowerCase().includes(filterText)) ||
      (v.service && v.service.toLowerCase().includes(filterText)) ||
      (v.phone && v.phone.includes(filterText)) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(filterText))
    );
  }

  var countBadge = document.getElementById('vendorsCountBadge');
  if (countBadge) countBadge.textContent = vendors.length + ' registered';

  if (vendors.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:36px;color:var(--text-muted);">
        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
        <div style="font-weight:600;">No vendors match your search criteria.</div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="window.openAddVendorModal()">+ Add New Vendor</button>
      </div>
    `;
    return;
  }

  container.innerHTML = vendors.map(function(v) {
    var typeBadge = v.type === 'AMC' ? '<span class="badge badge-blue">AMC</span>' : (v.type === 'CONTRACT' ? '<span class="badge badge-purple">Monthly Retainer</span>' : '<span class="badge badge-muted">On-Call</span>');
    var icon = v.service?.includes('Plumb') ? '🚰' : (v.service?.includes('Elev') || v.service?.includes('Lift') ? '🛗' : (v.service?.includes('Elect') ? '⚡' : (v.service?.includes('Secur') ? '🛡️' : (v.service?.includes('Clean') || v.service?.includes('House') ? '🧹' : (v.service?.includes('Hort') || v.service?.includes('Garden') ? '🌱' : '🏪')))));
    var statusBadge = v.status === 'ACTIVE' 
      ? '<span class="badge badge-green" style="font-size:11px;">Active</span>' 
      : '<span class="badge badge-muted" style="font-size:11px;">Inactive</span>';

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:8px;background:var(--bg-surface);transition:all 0.15s;" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='var(--bg-surface)'">
        <div style="width:40px;height:40px;background:var(--bg-elevated);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:1px solid var(--border-light);">
          ${icon}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${v.name}</div>
            ${typeBadge}
            ${v.rating ? `<span style="font-size:11px;font-weight:700;color:#F59E0B;">⭐ ${v.rating}</span>` : ''}
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
            <strong>${v.service}</strong> ${v.contactPerson ? '· Contact: ' + v.contactPerson : ''}
          </div>
          <div style="font-size:11.5px;color:var(--blue);margin-top:2px;font-weight:500;">
            📞 <a href="tel:${v.phone}" style="color:var(--blue);text-decoration:none;">${v.phone}</a>
            ${v.email ? ' · ✉️ ' + v.email : ''}
            ${v.gstin ? ' · <span style="color:var(--text-muted);font-family:monospace;">GST: ' + v.gstin + '</span>' : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            ${statusBadge}
          </div>
          <div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap;">
            <a href="tel:${v.phone}" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px;font-weight:600;">📞 Call</a>
            <button class="btn btn-ghost btn-sm" onclick="Router.go('admin-complaints')" style="padding:3px 8px;font-size:11px;" title="Issue work order on helpdesk">🎫 Ticket</button>
            <button class="btn btn-ghost btn-sm" onclick="window.openAddAgreementModal('${v.id}')" style="padding:3px 8px;font-size:11px;" title="New AMC contract">+ AMC</button>
            <button class="btn btn-ghost btn-sm" onclick="window.openEditVendorModal('${v.id}')" style="padding:3px 8px;font-size:11px;" title="Edit details">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="window.confirmDeleteVendor('${v.id}', '${v.name.replace(/'/g, "\\'")}')" style="padding:3px 6px;font-size:11px;color:#EF4444;" title="Delete vendor">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// Render Contracts Cards
window.renderContractsCards = function() {
  var container = document.getElementById('contractsCardsList');
  if (!container) return;

  var contracts = window.__cachedContractsList || [];
  var filterText = (document.getElementById('contractSearchInput')?.value || '').toLowerCase().trim();
  var statusFilter = window._contractStatusFilter || 'ALL';

  if (statusFilter !== 'ALL') {
    contracts = contracts.filter(c => c.status === statusFilter);
  }

  if (filterText) {
    contracts = contracts.filter(c => 
      (c.title && c.title.toLowerCase().includes(filterText)) ||
      (c.vendorName && c.vendorName.toLowerCase().includes(filterText)) ||
      (c.category && c.category.toLowerCase().includes(filterText))
    );
  }

  var countBadge = document.getElementById('contractsCountBadge');
  if (countBadge) countBadge.textContent = contracts.length + ' contracts';

  if (contracts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:36px;color:var(--text-muted);">
        <div style="font-size:32px;margin-bottom:8px;">📄</div>
        <div style="font-weight:600;">No maintenance contracts found.</div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="window.openAddAgreementModal()">+ Create New AMC Agreement</button>
      </div>
    `;
    return;
  }

  var today = new Date('2026-10-13T00:00:00.000Z');

  container.innerHTML = contracts.map(function(c) {
    var end = new Date(c.endDate + 'T23:59:59.999Z');
    var diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    var statusBadge = '';
    var validityWarning = '';
    if (c.status === 'EXPIRING' || (diffDays >= 0 && diffDays <= 45)) {
      statusBadge = '<span class="badge badge-amber" style="font-weight:700;">⚠️ EXPIRING</span>';
      validityWarning = `<span style="font-size:11px;font-weight:700;color:#D97706;background:#FEF3C7;padding:2px 6px;border-radius:4px;">Expires in ${diffDays} days</span>`;
    } else if (c.status === 'EXPIRED' || diffDays < 0) {
      statusBadge = '<span class="badge badge-red">EXPIRED</span>';
      validityWarning = `<span style="font-size:11px;font-weight:700;color:#DC2626;background:#FEE2E2;padding:2px 6px;border-radius:4px;">Expired ${Math.abs(diffDays)}d ago</span>`;
    } else {
      statusBadge = '<span class="badge badge-green">ACTIVE</span>';
      validityWarning = `<span style="font-size:11px;color:#16A34A;">Valid for ${diffDays} days</span>`;
    }

    var isExpiring = c.status === 'EXPIRING' || (diffDays >= 0 && diffDays <= 45);

    return `
      <div style="padding:14px;border:1px solid ${isExpiring ? 'rgba(245,158,11,0.45)' : 'var(--border-light)'};
        border-radius:var(--r-md);margin-bottom:10px;
        background:${isExpiring ? 'rgba(245,158,11,0.03)' : 'var(--bg-surface)'};transition:all 0.15s;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;gap:8px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${c.title}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              🏪 <strong>${c.vendorName}</strong> · <span style="color:#64748B;">${c.category || 'Maintenance'}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${statusBadge}
          </div>
        </div>

        ${c.slaDetails ? `
          <div style="font-size:11.5px;color:var(--text-secondary);background:var(--bg-elevated);padding:6px 10px;border-radius:6px;margin:8px 0;line-height:1.4;">
            📋 <strong>SLA:</strong> ${c.slaDetails}
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px dashed var(--border-light);padding-top:8px;margin-top:8px;">
          <div>
            <span style="color:var(--text-muted);">Term: ${c.startDate} → ${c.endDate}</span>
            <div style="margin-top:2px;">${validityWarning}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:800;color:var(--text-primary);">₹${Number(c.monthlyAmount).toLocaleString('en-IN')}<span style="font-size:11px;font-weight:500;color:var(--text-muted);">/mo</span></div>
            <div style="font-size:11px;color:var(--text-muted);">${c.billingFrequency || 'Monthly'}</div>
          </div>
        </div>

        <div style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end;">
          <button class="btn btn-secondary btn-sm" style="flex:1;justify-content:center;font-weight:700;background:${isExpiring?'#FEF3C7':'#F8FAFC'};border-color:${isExpiring?'#F59E0B':'#CBD5E1'};color:${isExpiring?'#92400E':'#334155'};" onclick="window.openRenewAgreementModal('${c.id}')">🔄 Renew Agreement</button>
          <button class="btn btn-ghost btn-sm" onclick="window.openEditAgreementModal('${c.id}')" title="Edit agreement">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="window.confirmDeleteContract('${c.id}', '${c.title.replace(/'/g, "\\'")}')" style="color:#EF4444;" title="Delete agreement">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
};

Screens['admin-vendors'] = function() {
  setTimeout(function() {
    window.loadLiveVendorsScreen();
  }, 10);

  return Shell.render('admin-vendors', {
    title: 'Vendors & Contracts',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="window.openAddAgreementModal()">📋 + New AMC Agreement</button>
        <button class="btn btn-primary btn-sm" onclick="window.openAddVendorModal()">➕ + Add Vendor / Technician</button>
      </div>
    `,
    content: `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">Vendors, Technicians &amp; AMC Contracts</div>
          <div class="page-subtitle">Directory of empanelled contractors, freelance technicians, and maintenance agreements</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="Router.go('admin-complaints')">🎫 Helpdesk Work Orders</button>
          <button class="btn btn-secondary btn-sm" onclick="window.openAddAgreementModal()">📋 + New Agreement</button>
          <button class="btn btn-primary btn-sm" onclick="window.openAddVendorModal()">➕ + Add Vendor / Technician</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;">
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--blue);cursor:pointer;" onclick="window.filterVendorsByType('ALL')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Empanelled Providers</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="vendorsMetricTotal">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Plumbing, Lift, Electrical &amp; Security</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--green);cursor:pointer;" onclick="window.filterContractsByStatus('ALL')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Active AMC Agreements</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="contractsMetricTotal">Loading...</div>
          <div style="font-size:11.5px;color:var(--green);margin-top:2px;">100% SLA Covered</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--amber);cursor:pointer;" onclick="window.reviewExpiringRenewals()">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Upcoming Renewals</div>
          <div style="font-size:22px;font-weight:800;color:var(--amber);margin-top:4px;" id="contractsMetricExpiring">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Within next 45 days</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid #8B5CF6;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Monthly AMC Payout</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="contractsMetricPayout">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Automatic ledger tracking</div>
        </div>
      </div>

      <!-- Expiring Contracts Alert Banner -->
      <div id="expiringContractsAlertBanner" style="padding:14px 18px;background:var(--amber-light);border:1px solid rgba(245,158,11,0.25);
        border-radius:var(--r-md);margin-bottom:18px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:20px;">⏳</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--amber);">Checking maintenance contract renewal dates...</div>
          <div style="font-size:12px;color:var(--text-muted);">Syncing live AMC validity with society ledger.</div>
        </div>
      </div>

      <div class="grid-2" id="vendorsLiveContainer" style="align-items:start;">
        <!-- Left: Vendors Directory -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="card-title" style="display:flex;align-items:center;gap:6px;">
                <span>Registered Technicians &amp; Vendors</span>
                <span class="badge badge-green" id="vendorsCountBadge">Loading...</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.openAddVendorModal()">➕ + Add</button>
          </div>

          <!-- Type filter tabs -->
          <div style="display:flex;gap:6px;padding:8px 14px 0 14px;flex-wrap:wrap;">
            <button class="btn btn-sm vtype-pill active" data-type="ALL" onclick="window.filterVendorsByType('ALL')" style="font-size:11px;padding:3px 10px;">All Types</button>
            <button class="btn btn-sm vtype-pill" data-type="AMC" onclick="window.filterVendorsByType('AMC')" style="font-size:11px;padding:3px 10px;">AMC</button>
            <button class="btn btn-sm vtype-pill" data-type="CONTRACT" onclick="window.filterVendorsByType('CONTRACT')" style="font-size:11px;padding:3px 10px;">Retainer</button>
            <button class="btn btn-sm vtype-pill" data-type="ON_CALL" onclick="window.filterVendorsByType('ON_CALL')" style="font-size:11px;padding:3px 10px;">On-Call</button>
          </div>

          <!-- Search box -->
          <div style="padding:10px 14px 0 14px;">
            <input type="text" id="vendorSearchInput" placeholder="🔍 Search technician by trade, name, phone..." class="form-input" style="width:100%;font-size:13px;" oninput="window.renderVendorsCards()" />
          </div>

          <div style="padding:14px;" id="vendorsCardsList">
            <div style="text-align:center;padding:24px;color:var(--text-muted);">Loading live vendors...</div>
          </div>
        </div>

        <!-- Right: Contracts Register -->
        <div class="card" id="contractsContainerCard">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="card-title" style="display:flex;align-items:center;gap:6px;">
                <span>Active AMC &amp; Retainer Agreements</span>
                <span class="badge badge-blue" id="contractsCountBadge">Loading...</span>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.openAddAgreementModal()">+ New Agreement</button>
          </div>

          <!-- Status filter tabs -->
          <div style="display:flex;gap:6px;padding:8px 14px 0 14px;flex-wrap:wrap;">
            <button class="btn btn-sm cstatus-pill active" data-status="ALL" onclick="window.filterContractsByStatus('ALL')" style="font-size:11px;padding:3px 10px;">All Contracts</button>
            <button class="btn btn-sm cstatus-pill" data-status="EXPIRING" onclick="window.filterContractsByStatus('EXPIRING')" style="font-size:11px;padding:3px 10px;color:#D97706;">⚠️ Expiring Soon</button>
            <button class="btn btn-sm cstatus-pill" data-status="ACTIVE" onclick="window.filterContractsByStatus('ACTIVE')" style="font-size:11px;padding:3px 10px;">Active</button>
            <button class="btn btn-sm cstatus-pill" data-status="EXPIRED" onclick="window.filterContractsByStatus('EXPIRED')" style="font-size:11px;padding:3px 10px;">Expired</button>
          </div>

          <!-- Search box -->
          <div style="padding:10px 14px 0 14px;">
            <input type="text" id="contractSearchInput" placeholder="🔍 Filter contracts by title, vendor, category..." class="form-input" style="width:100%;font-size:13px;" oninput="window.renderContractsCards()" />
          </div>

          <div style="padding:14px;" id="contractsCardsList">
            <div style="text-align:center;padding:24px;color:var(--text-muted);">Loading maintenance agreements...</div>
          </div>
        </div>
      </div>
    `,
  });
};


// =============================================
// Staff & Payroll Management
// =============================================

window.__cachedStaffList = null;
window.__cachedStaffPayments = null;
window.__cachedStaffMetrics = null;
window._staffDeptFilter = 'ALL';
window._staffPaymentStatusFilter = 'ALL';

function openStaffModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '620px';
  var overlay = document.getElementById('rwaStaffModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaStaffModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
        '<button type="button" onclick="document.getElementById(\'rwaStaffModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<form id="rwaStaffForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
        contentHtml +
        '<div style="display:flex;gap:10px;margin-top:8px;">' +
          (submitLabel
            ? '<button type="button" onclick="document.getElementById(\'rwaStaffModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
              '<button type="submit" id="rwaStaffSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
            : '<button type="button" onclick="document.getElementById(\'rwaStaffModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
          ) +
        '</div>' +
      '</form>' +
    '</div>';

  overlay.style.display = 'flex';

  var form = document.getElementById('rwaStaffForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById('rwaStaffSubBtn');
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

// Add Staff Modal
window.openAddStaffModal = function() {
  var html = `
    <div>
      <label class="form-label">Full Name *</label>
      <input type="text" id="stfName" required placeholder="e.g. Vikramaditya Singh" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Designation / Role *</label>
        <input type="text" id="stfRole" required placeholder="e.g. Security Guard (Day), Electrician Assistant" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Department *</label>
        <select id="stfDept" class="form-select" style="width:100%;">
          <option value="Security">🛡️ Security</option>
          <option value="Housekeeping">🧹 Housekeeping &amp; Sanitation</option>
          <option value="Gardening">🌱 Gardening &amp; Horticulture</option>
          <option value="Maintenance">⚡ Technical &amp; Maintenance</option>
          <option value="Administration">🏢 Society Office &amp; Admin</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Phone Number *</label>
        <input type="tel" id="stfPhone" required placeholder="+91 94000 12345" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Monthly Salary (₹) *</label>
        <input type="number" id="stfSalary" required placeholder="e.g. 12000" min="0" class="form-input" style="width:100%;font-weight:700;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Shift Timing</label>
        <select id="stfShift" class="form-select" style="width:100%;">
          <option value="DAY">☀️ Day Shift (8:00 AM - 4:00 PM)</option>
          <option value="NIGHT">🌙 Night Shift (8:00 PM - 8:00 AM)</option>
          <option value="ROTATIONAL">🔄 Rotational Shifts</option>
          <option value="GENERAL">🕒 General Shift (9:00 AM - 6:00 PM)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Joining Date</label>
        <input type="date" id="stfJoinDate" value="2026-10-01" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">UPI ID (For Instant Salary Transfer)</label>
        <input type="text" id="stfUpi" placeholder="e.g. ramesh@okhdfcbank" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Aadhaar Last 4 Digits</label>
        <input type="text" id="stfAadhaar" placeholder="e.g. XXXX-XXXX-4589" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Bank Account Number (Optional)</label>
        <input type="text" id="stfAccount" placeholder="Account Number" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Bank IFSC Code</label>
        <input type="text" id="stfIfsc" placeholder="e.g. SBIN0001234" class="form-input" style="width:100%;text-transform:uppercase;" />
      </div>
    </div>
  `;

  openStaffModal('➕ Onboard Society Staff Member', html, 'Save Staff Member', async function() {
    var name = document.getElementById('stfName').value.trim();
    var role = document.getElementById('stfRole').value.trim();
    var department = document.getElementById('stfDept').value;
    var phone = document.getElementById('stfPhone').value.trim();
    var salary = parseFloat(document.getElementById('stfSalary').value) || 0;
    var shift = document.getElementById('stfShift').value;
    var joiningDate = document.getElementById('stfJoinDate').value;
    var upiId = document.getElementById('stfUpi').value.trim();
    var aadhaarNumber = document.getElementById('stfAadhaar').value.trim();
    var accountNumber = document.getElementById('stfAccount').value.trim();
    var ifscCode = document.getElementById('stfIfsc').value.trim();

    if (!name || !role || !phone || !salary) {
      if (typeof window.showToast === 'function') window.showToast('Please fill all required staff fields', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_staff', name, role, department, phone, salary, shift, joiningDate, upiId, aadhaarNumber, accountNumber, ifscCode }),
      }) : fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_staff', name, role, department, phone, salary, shift, joiningDate, upiId, aadhaarNumber, accountNumber, ifscCode }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`🎉 Staff member "${name}" registered successfully!`, 'success');
        await window.loadLiveStaffScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to onboard staff');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error creating staff', 'error');
    }
  }, '640px');
};

// Pay Salary Modal
window.openPaySalaryModal = function(staffId) {
  var staff = (window.__cachedStaffList || []).find(s => s.id === staffId);
  if (!staff) return;

  var currentMonth = 'Oct 2026';
  var isAlreadyPaid = staff.lastPaidMonth === currentMonth;

  var html = `
    <div style="padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:15px;font-weight:800;color:#0F172A;">${staff.name}</div>
          <div style="font-size:12.5px;color:#64748B;margin-top:2px;">${staff.role} · <strong>${staff.department}</strong></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:800;color:#16A34A;">₹${Number(staff.salary).toLocaleString('en-IN')}<span style="font-size:11px;font-weight:500;color:#64748B;">/mo</span></div>
          <div style="font-size:11px;color:#64748B;">Monthly Rate</div>
        </div>
      </div>
      ${staff.upiId ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #CBD5E1;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <span>Registered UPI: <strong style="font-family:monospace;color:#2563EB;">${staff.upiId}</strong></span>
          <span style="font-size:11px;color:#16A34A;font-weight:600;">✓ Verified Payee</span>
        </div>
      ` : ''}
    </div>

    ${isAlreadyPaid ? `
      <div style="padding:8px 12px;background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;font-size:12px;color:#92400E;display:flex;align-items:center;gap:6px;">
        <span>ℹ️</span>
        <div>This staff member was already marked <strong>Paid for ${currentMonth}</strong>. Submitting will record an additional disbursement or advance.</div>
      </div>
    ` : ''}

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Salary Month *</label>
        <select id="payMonth" class="form-select" style="width:100%;font-weight:600;">
          <option value="Oct 2026" selected>October 2026 (Current Month)</option>
          <option value="Nov 2026">November 2026 (Advance)</option>
          <option value="Sep 2026">September 2026 (Arrears)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Disbursement Amount (₹) *</label>
        <input type="number" id="payAmount" required value="${staff.salary}" class="form-input" style="width:100%;font-weight:800;font-size:15px;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Payment Mode *</label>
        <select id="payMethod" class="form-select" style="width:100%;">
          <option value="UPI">📱 Instant UPI / Net Banking</option>
          <option value="BANK_TRANSFER">🏦 NEFT / RTGS Bank Transfer</option>
          <option value="CASH">💵 Cash Voucher</option>
          <option value="CHEQUE">📝 Society Cheque</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Transaction Reference / UTR</label>
        <input type="text" id="payTxnRef" placeholder="e.g. UTR-98234812" value="TXN-${Date.now().toString().slice(-6)}" class="form-input" style="width:100%;font-family:monospace;" />
      </div>
    </div>

    <div>
      <label class="form-label">Salary Voucher Remarks</label>
      <input type="text" id="payNotes" value="Regular monthly salary disbursement" class="form-input" style="width:100%;" />
    </div>
  `;

  openStaffModal('💳 Disburse Salary Payment', html, 'Confirm & Disburse Salary', async function() {
    var month = document.getElementById('payMonth').value;
    var amount = parseFloat(document.getElementById('payAmount').value) || staff.salary;
    var paymentMethod = document.getElementById('payMethod').value;
    var transactionRef = document.getElementById('payTxnRef').value.trim();
    var notes = document.getElementById('payNotes').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disburse_salary',
          staffId: staff.id,
          month,
          amount,
          paymentMethod,
          transactionRef,
          notes,
        }),
      }) : fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disburse_salary',
          staffId: staff.id,
          month,
          amount,
          paymentMethod,
          transactionRef,
          notes,
        }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`🎉 Salary of ₹${amount.toLocaleString('en-IN')} successfully disbursed to ${staff.name}!`, 'success');
        await window.loadLiveStaffScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to disburse salary');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error processing salary', 'error');
    }
  }, '580px');
};

// Edit Staff Modal
window.openEditStaffModal = function(staffId) {
  var staff = (window.__cachedStaffList || []).find(s => s.id === staffId);
  if (!staff) return;

  var html = `
    <div>
      <label class="form-label">Full Name *</label>
      <input type="text" id="estfName" required value="${staff.name || ''}" class="form-input" style="width:100%;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Designation / Role *</label>
        <input type="text" id="estfRole" required value="${staff.role || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Department *</label>
        <select id="estfDept" class="form-select" style="width:100%;">
          <option value="Security" ${staff.department==='Security'?'selected':''}>🛡️ Security</option>
          <option value="Housekeeping" ${staff.department==='Housekeeping'?'selected':''}>🧹 Housekeeping</option>
          <option value="Gardening" ${staff.department==='Gardening'?'selected':''}>🌱 Gardening</option>
          <option value="Maintenance" ${staff.department==='Maintenance'?'selected':''}>⚡ Maintenance</option>
          <option value="Administration" ${staff.department==='Administration'?'selected':''}>🏢 Admin</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Phone Number *</label>
        <input type="tel" id="estfPhone" required value="${staff.phone || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Monthly Salary (₹) *</label>
        <input type="number" id="estfSalary" required value="${staff.salary || 0}" class="form-input" style="width:100%;font-weight:700;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Employment Status</label>
        <select id="estfStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE" ${staff.status==='ACTIVE'?'selected':''}>Active</option>
          <option value="ON_LEAVE" ${staff.status==='ON_LEAVE'?'selected':''}>On Leave</option>
          <option value="INACTIVE" ${staff.status==='INACTIVE'?'selected':''}>Inactive / Resigned</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Shift Timing</label>
        <select id="estfShift" class="form-select" style="width:100%;">
          <option value="DAY" ${staff.shift==='DAY'?'selected':''}>☀️ Day Shift</option>
          <option value="NIGHT" ${staff.shift==='NIGHT'?'selected':''}>🌙 Night Shift</option>
          <option value="ROTATIONAL" ${staff.shift==='ROTATIONAL'?'selected':''}>🔄 Rotational</option>
          <option value="GENERAL" ${staff.shift==='GENERAL'?'selected':''}>🕒 General Shift</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Registered UPI ID</label>
        <input type="text" id="estfUpi" value="${staff.upiId || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Aadhaar Number</label>
        <input type="text" id="estfAadhaar" value="${staff.aadhaarNumber || ''}" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  openStaffModal('✏️ Edit Staff Details: ' + staff.name, html, 'Save Changes', async function() {
    var name = document.getElementById('estfName').value.trim();
    var role = document.getElementById('estfRole').value.trim();
    var department = document.getElementById('estfDept').value;
    var phone = document.getElementById('estfPhone').value.trim();
    var salary = parseFloat(document.getElementById('estfSalary').value) || 0;
    var status = document.getElementById('estfStatus').value;
    var shift = document.getElementById('estfShift').value;
    var upiId = document.getElementById('estfUpi').value.trim();
    var aadhaarNumber = document.getElementById('estfAadhaar').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId, name, role, department, phone, salary, status, shift, upiId, aadhaarNumber }),
      }) : fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId, name, role, department, phone, salary, status, shift, upiId, aadhaarNumber }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast('✅ Staff member details updated!', 'success');
        await window.loadLiveStaffScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update staff');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error updating staff', 'error');
    }
  }, '600px');
};

// Delete Staff
window.confirmDeleteStaff = async function(staffId, staffName) {
  if (!confirm(`Are you sure you want to remove "${staffName}" from the society staff directory?`)) return;

  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/staff?id=' + encodeURIComponent(staffId), {
      method: 'DELETE',
    }) : fetch('/api/staff?id=' + encodeURIComponent(staffId), {
      method: 'DELETE',
    }));

    if (res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`🗑️ Staff member "${staffName}" removed`, 'info');
      await window.loadLiveStaffScreen();
    } else {
      var err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete staff member');
    }
  } catch (e) {
    if (typeof window.showToast === 'function') window.showToast(e.message || 'Error deleting staff', 'error');
  }
};

// Payroll History Modal
window.openStaffPayrollHistoryModal = function() {
  var payments = window.__cachedStaffPayments || [];
  var html = `
    <div style="font-size:13px;color:#64748B;margin-bottom:12px;">Recent salary disbursements and ledger entries:</div>
    <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
      ${payments.length === 0 ? '<div style="text-align:center;padding:24px;color:#94A3B8;">No disbursements recorded yet.</div>' : ''}
      ${payments.map(p => `
        <div style="padding:12px;border:1px solid #E2E8F0;border-radius:10px;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:700;color:#0F172A;font-size:13.5px;">${p.staffName} · <span style="font-weight:500;color:#64748B;">${p.role}</span></div>
            <div style="font-size:11.5px;color:#64748B;margin-top:2px;">
              <span>🗓️ ${p.month}</span> · <span>Mode: <strong>${p.paymentMethod}</strong></span> ${p.transactionRef ? '· <span style="font-family:monospace;">' + p.transactionRef + '</span>' : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:800;color:#16A34A;">₹${Number(p.amount).toLocaleString('en-IN')}</div>
            <div style="font-size:10.5px;color:#94A3B8;">${new Date(p.paidAt).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  openStaffModal('📑 Society Payroll Disbursement History', html, null, null, '650px');
};

// Filter Staff
window.filterStaffByDept = function(dept) {
  window._staffDeptFilter = dept;
  document.querySelectorAll('.sdept-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-dept') === dept);
  });
  window.renderStaffTable();
};

window.filterStaffByPaymentStatus = function(status) {
  window._staffPaymentStatusFilter = status;
  document.querySelectorAll('.spay-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pay') === status);
  });
  window.renderStaffTable();
};

// Load Live Staff Data
window.loadLiveStaffScreen = async function() {
  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/staff') : fetch('/api/staff'));
    if (res.ok) {
      var data = await res.json();
      window.__cachedStaffList = data.staff || [];
      window.__cachedStaffPayments = data.payments || [];
      window.__cachedStaffMetrics = data.metrics || {};
    }
  } catch (e) {
    console.error('Failed to load staff:', e);
  }

  var metrics = window.__cachedStaffMetrics || {};
  var staff = window.__cachedStaffList || [];

  var elTotal = document.getElementById('staffMetricTotal');
  if (elTotal) elTotal.textContent = (metrics.activeStaff !== undefined ? metrics.activeStaff : staff.length) + ' Employed';

  var elPayroll = document.getElementById('staffMetricPayroll');
  if (elPayroll) elPayroll.textContent = '₹' + (metrics.monthlyPayroll || 0).toLocaleString('en-IN') + '/mo';

  var elPaid = document.getElementById('staffMetricPaid');
  if (elPaid) elPaid.textContent = (metrics.paidThisMonthCount || 0) + ' of ' + (metrics.activeStaff || staff.length) + ' Paid';

  var elPending = document.getElementById('staffMetricPending');
  if (elPending) elPending.textContent = (metrics.pendingDisbursementCount || 0) + ' Due (₹' + (metrics.pendingDisbursementAmount || 0).toLocaleString('en-IN') + ')';

  window.renderStaffTable();
};

// Render Staff Table Rows
window.renderStaffTable = function() {
  var tbody = document.getElementById('staffTableBody');
  if (!tbody) return;

  var staff = window.__cachedStaffList || [];
  var filterText = (document.getElementById('staffSearchInput')?.value || '').toLowerCase().trim();
  var deptFilter = window._staffDeptFilter || 'ALL';
  var payFilter = window._staffPaymentStatusFilter || 'ALL';

  if (deptFilter !== 'ALL') {
    staff = staff.filter(s => s.department === deptFilter || (deptFilter === 'Security' && s.role.includes('Security')));
  }

  if (payFilter === 'PAID_OCT') {
    staff = staff.filter(s => s.lastPaidMonth === 'Oct 2026');
  } else if (payFilter === 'PENDING_OCT') {
    staff = staff.filter(s => s.lastPaidMonth !== 'Oct 2026');
  } else if (payFilter === 'ON_LEAVE') {
    staff = staff.filter(s => s.status === 'ON_LEAVE');
  }

  if (filterText) {
    staff = staff.filter(s =>
      (s.name && s.name.toLowerCase().includes(filterText)) ||
      (s.role && s.role.toLowerCase().includes(filterText)) ||
      (s.phone && s.phone.includes(filterText)) ||
      (s.department && s.department.toLowerCase().includes(filterText)) ||
      (s.id && s.id.toLowerCase().includes(filterText))
    );
  }

  var countBadge = document.getElementById('staffCountBadge');
  if (countBadge) countBadge.textContent = staff.length + ' staff members';

  if (staff.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:36px;color:var(--text-muted);">
          <div style="font-size:32px;margin-bottom:8px;">🔍</div>
          <div style="font-weight:600;">No staff members match the selected filters.</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="window.openAddStaffModal()">+ Onboard Staff Member</button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = staff.map(function(s) {
    var isPaidOct = s.lastPaidMonth === 'Oct 2026';
    var payStatusBadge = isPaidOct
      ? '<span class="badge badge-green" style="font-size:11px;font-weight:700;">✅ Paid Oct 2026</span>'
      : '<span class="badge badge-amber" style="font-size:11px;font-weight:700;">⏳ Due Oct 2026</span>';

    var shiftLabel = s.shift === 'NIGHT' ? '🌙 Night' : (s.shift === 'ROTATIONAL' ? '🔄 Rotational' : '☀️ Day');
    var statusBadge = s.status === 'ACTIVE' 
      ? '<span class="badge badge-green">Active</span>' 
      : (s.status === 'ON_LEAVE' ? '<span class="badge badge-amber">On Leave</span>' : '<span class="badge badge-muted">Inactive</span>');

    return `
      <tr style="transition:background 0.15s;">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="avatar amber" style="width:34px;height:34px;font-size:12px;font-weight:700;flex-shrink:0;">
              ${s.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-primary);font-size:13.5px;">${s.name}</div>
              <div style="font-size:11px;color:var(--text-muted);display:flex;gap:6px;align-items:center;margin-top:1px;">
                <span style="font-family:monospace;background:#F1F5F9;padding:1px 4px;border-radius:4px;">${s.id}</span>
                ${s.aadhaarNumber ? `<span>· ID: ${s.aadhaarNumber}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size:12.5px;font-weight:600;color:var(--text-primary);">${s.role}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:1px;">
            ${s.department} · <span style="color:#64748B;">${shiftLabel}</span>
          </div>
        </td>
        <td style="font-family:monospace;font-size:12.5px;">
          <a href="tel:${s.phone}" style="color:var(--blue);text-decoration:none;font-weight:500;">📞 ${s.phone}</a>
        </td>
        <td style="font-weight:700;font-size:13.5px;color:var(--text-primary);">
          ₹${Number(s.salary).toLocaleString('en-IN')}<span style="font-size:10.5px;font-weight:400;color:var(--text-muted);">/mo</span>
        </td>
        <td style="font-size:12px;color:var(--text-muted);">${s.joiningDate || '—'}</td>
        <td>${statusBadge}</td>
        <td>${payStatusBadge}</td>
        <td style="text-align:right;">
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="window.openPaySalaryModal('${s.id}')" style="padding:4px 10px;font-size:11.5px;font-weight:700;background:${isPaidOct?'#F8FAFC':'#FEF3C7'};border-color:${isPaidOct?'#CBD5E1':'#F59E0B'};color:${isPaidOct?'#334155':'#92400E'};">
              💳 ${isPaidOct ? 'Pay More' : 'Pay'}
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.openEditStaffModal('${s.id}')" title="Edit Staff" style="padding:4px 8px;font-size:12px;">✏️</button>
            <button class="btn btn-ghost btn-sm" onclick="window.confirmDeleteStaff('${s.id}', '${s.name.replace(/'/g, "\\'")}')" title="Delete Staff" style="padding:4px 8px;font-size:12px;color:#EF4444;">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

Screens['admin-staff'] = function() {
  setTimeout(function() {
    window.loadLiveStaffScreen();
  }, 10);

  return Shell.render('admin-staff', {
    title: 'Staff',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="window.openStaffPayrollHistoryModal()">📑 Payroll History</button>
        <button class="btn btn-primary btn-sm" onclick="window.openAddStaffModal()">➕ + Add Staff</button>
      </div>
    `,
    content: `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">Staff Management</div>
          <div class="page-subtitle">Track society staff, attendance, and salary payments</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.openStaffPayrollHistoryModal()">📑 Payroll History</button>
          <button class="btn btn-primary btn-sm" onclick="window.openAddStaffModal()">➕ + Add Staff</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;">
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--blue);cursor:pointer;" onclick="window.filterStaffByPaymentStatus('ALL')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Total Society Staff</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="staffMetricTotal">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Security, Housekeeping &amp; Gardening</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid #8B5CF6;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Monthly Payroll Liability</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="staffMetricPayroll">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Total monthly staff wage commitment</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--green);cursor:pointer;" onclick="window.filterStaffByPaymentStatus('PAID_OCT')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Salary Paid (Oct 2026)</div>
          <div style="font-size:22px;font-weight:800;color:var(--green);margin-top:4px;" id="staffMetricPaid">Loading...</div>
          <div style="font-size:11.5px;color:var(--green);margin-top:2px;">Disbursed for current calendar month</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--amber);cursor:pointer;" onclick="window.filterStaffByPaymentStatus('PENDING_OCT')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Pending Payout (Oct 2026)</div>
          <div style="font-size:22px;font-weight:800;color:var(--amber);margin-top:4px;" id="staffMetricPending">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Staff due for monthly disbursement</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="card-title">Society Staff Register</div>
            <span class="badge badge-green" id="staffCountBadge">Loading...</span>
          </div>

          <!-- Department filter pills -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm sdept-pill active" data-dept="ALL" onclick="window.filterStaffByDept('ALL')" style="font-size:11.5px;padding:3px 10px;">All Departments</button>
            <button class="btn btn-sm sdept-pill" data-dept="Security" onclick="window.filterStaffByDept('Security')" style="font-size:11.5px;padding:3px 10px;">🛡️ Security</button>
            <button class="btn btn-sm sdept-pill" data-dept="Housekeeping" onclick="window.filterStaffByDept('Housekeeping')" style="font-size:11.5px;padding:3px 10px;">🧹 Housekeeping</button>
            <button class="btn btn-sm sdept-pill" data-dept="Gardening" onclick="window.filterStaffByDept('Gardening')" style="font-size:11.5px;padding:3px 10px;">🌱 Gardening</button>
          </div>
        </div>

        <!-- Controls toolbar: Search & Status Pills -->
        <div style="padding:12px 16px;background:var(--bg-elevated);border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <input type="text" id="staffSearchInput" placeholder="🔍 Search staff by name, role, phone, or ID..." class="form-input" style="width:100%;font-size:13px;" oninput="window.renderStaffTable()" />
          </div>

          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <span style="font-size:12px;color:var(--text-muted);margin-right:2px;">Disbursement Status:</span>
            <button class="btn btn-sm spay-pill active" data-pay="ALL" onclick="window.filterStaffByPaymentStatus('ALL')" style="font-size:11px;padding:3px 8px;">All</button>
            <button class="btn btn-sm spay-pill" data-pay="PENDING_OCT" onclick="window.filterStaffByPaymentStatus('PENDING_OCT')" style="font-size:11px;padding:3px 8px;color:#D97706;font-weight:700;">⏳ Due Oct 2026</button>
            <button class="btn btn-sm spay-pill" data-pay="PAID_OCT" onclick="window.filterStaffByPaymentStatus('PAID_OCT')" style="font-size:11px;padding:3px 8px;color:#16A34A;font-weight:700;">✅ Paid Oct 2026</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name &amp; ID</th>
                <th>Role &amp; Shift</th>
                <th>Phone</th>
                <th>Monthly Salary</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Salary Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="staffTableBody">
              <tr>
                <td colspan="8" style="text-align:center;padding:28px;color:var(--text-muted);">
                  Loading live staff registry...
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
// Assets & Equipment Register
// =============================================

window.__cachedAssetsList = null;
window.__cachedAssetMetrics = null;
window._assetCategoryFilter = 'ALL';
window._assetStatusFilter = 'ALL';

function openAssetModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '640px';
  var overlay = document.getElementById('rwaAssetModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaAssetModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
      '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
        '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
        '<button type="button" onclick="document.getElementById(\'rwaAssetModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<form id="rwaAssetForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
        contentHtml +
        '<div style="display:flex;gap:10px;margin-top:8px;">' +
          (submitLabel
            ? '<button type="button" onclick="document.getElementById(\'rwaAssetModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
              '<button type="submit" id="rwaAssetSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
            : '<button type="button" onclick="document.getElementById(\'rwaAssetModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
          ) +
        '</div>' +
      '</form>' +
    '</div>';

  overlay.style.display = 'flex';

  var form = document.getElementById('rwaAssetForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function(e) {
      e.preventDefault();
      var btn = document.getElementById('rwaAssetSubBtn');
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

// Add Asset Modal
window.openAddAssetModal = function() {
  var html = `
    <div>
      <label class="form-label">Asset / Equipment Name *</label>
      <input type="text" id="astName" required placeholder="e.g. DG Set (125 KVA Second Phase)" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Category *</label>
        <select id="astCategory" class="form-select" style="width:100%;">
          <option value="Lift">🛗 Lift / Elevator</option>
          <option value="Generator">⚡ Generator / DG Set</option>
          <option value="Security">📹 CCTV / Security System</option>
          <option value="Plumbing">🚰 Water Pump / STP / RO</option>
          <option value="Safety">🧯 Fire Fighting &amp; Safety</option>
          <option value="Electrical">🔌 Transformer &amp; HT Panel</option>
          <option value="General">🛠️ General Equipment</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Serial / Asset Tag Number *</label>
        <input type="text" id="astSerial" required placeholder="e.g. LFT-C-001 or GEN-2026" class="form-input" style="width:100%;font-family:monospace;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Society Location / Wing *</label>
        <input type="text" id="astLocation" required placeholder="e.g. Block C Core, DG Room Basement" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Capital Purchase Value (₹) *</label>
        <input type="number" id="astValue" required placeholder="e.g. 450000" min="0" class="form-input" style="width:100%;font-weight:700;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Purchase / Commissioning Date</label>
        <input type="date" id="astPurchaseDate" value="2026-01-15" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Next Scheduled Service Date</label>
        <input type="date" id="astNextService" value="2026-11-15" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Operational Status</label>
        <select id="astStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE">Active &amp; Operational</option>
          <option value="UNDER_REPAIR">Under Maintenance / Repair</option>
          <option value="STANDBY">Standby / Backup</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">AMC Contractor / Agency</label>
        <input type="text" id="astVendor" placeholder="e.g. Apex Elevator Services" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
      <input type="checkbox" id="astAmcCovered" checked style="cursor:pointer;" />
      <label for="astAmcCovered" style="font-size:13px;font-weight:600;color:#334155;cursor:pointer;margin:0;">Active AMC Coverage contract exists for this asset</label>
    </div>
  `;

  openAssetModal('➕ Register Common Society Asset', html, 'Save Asset to Register', async function() {
    var name = document.getElementById('astName').value.trim();
    var category = document.getElementById('astCategory').value;
    var serialNumber = document.getElementById('astSerial').value.trim();
    var location = document.getElementById('astLocation').value.trim();
    var purchaseValue = parseFloat(document.getElementById('astValue').value) || 0;
    var purchaseDate = document.getElementById('astPurchaseDate').value;
    var nextServiceDate = document.getElementById('astNextService').value;
    var status = document.getElementById('astStatus').value;
    var vendorName = document.getElementById('astVendor').value.trim();
    var amcCovered = document.getElementById('astAmcCovered').checked;

    if (!name || !serialNumber || !location) {
      if (typeof window.showToast === 'function') window.showToast('Please fill all required asset details', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_asset', name, category, serialNumber, location, purchaseValue, purchaseDate, nextServiceDate, status, vendorName, amcCovered }),
      }) : fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_asset', name, category, serialNumber, location, purchaseValue, purchaseDate, nextServiceDate, status, vendorName, amcCovered }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`🎉 Asset "${name}" registered successfully!`, 'success');
        await window.loadLiveAssetsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create asset');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error creating asset', 'error');
    }
  }, '640px');
};

// Log Service / Maintenance Modal
window.openLogServiceModal = function(assetId) {
  var asset = (window.__cachedAssetsList || []).find(a => a.id === assetId);
  if (!asset) return;

  var todayStr = '2026-10-13';
  var nextDate = new Date('2026-10-13');
  nextDate.setMonth(nextDate.getMonth() + 2);
  var nextDateStr = nextDate.toISOString().split('T')[0];

  var html = `
    <div style="padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:15px;font-weight:800;color:#0F172A;">${asset.name}</div>
          <div style="font-size:12px;color:#64748B;margin-top:2px;">
            <span>Tag: <strong style="font-family:monospace;">${asset.serialNumber}</strong></span> · <span>📍 ${asset.location}</span>
          </div>
        </div>
        <div>
          <span class="badge badge-${asset.status==='ACTIVE'?'green':'red'}">${asset.status}</span>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Service Date *</label>
        <input type="date" id="svcDate" required value="${todayStr}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Service Category *</label>
        <select id="svcType" class="form-select" style="width:100%;">
          <option value="ROUTINE">Routine Maintenance / Lubrication</option>
          <option value="REPAIR">Mechanical / Electrical Repair</option>
          <option value="BREAKDOWN">Emergency Breakdown Restoration</option>
          <option value="INSPECTION">Statutory Safety Audit</option>
          <option value="OVERHAUL">Full System Overhaul</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Service Contractor / Engineer *</label>
        <input type="text" id="svcBy" required value="${asset.vendorName || ''}" placeholder="e.g. Apex Elevator Services" class="form-input" style="width:100%;font-weight:600;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Service Cost (₹)</label>
        <input type="number" id="svcCost" value="${asset.amcCovered ? 0 : 2500}" min="0" class="form-input" style="width:100%;font-weight:700;" />
      </div>
    </div>

    <div>
      <label class="form-label">Engineering Notes / Diagnosis / Work Done *</label>
      <textarea id="svcNotes" required rows="2" placeholder="e.g. Replaced leveling optical sensor, greased guide rails, calibrated door interlocks, all load tests normal." class="form-input" style="width:100%;font-size:13px;"></textarea>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Spare Parts Replaced</label>
        <input type="text" id="svcParts" placeholder="e.g. Door motor belt, relay coil" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Next Scheduled Service Date</label>
        <input type="date" id="svcNextDate" value="${nextDateStr}" class="form-input" style="width:100%;font-weight:600;" />
      </div>
    </div>
  `;

  openAssetModal('🔧 Log Service & Maintenance: ' + asset.name, html, 'Save Service Record', async function() {
    var serviceDate = document.getElementById('svcDate').value;
    var serviceType = document.getElementById('svcType').value;
    var performedBy = document.getElementById('svcBy').value.trim();
    var cost = parseFloat(document.getElementById('svcCost').value) || 0;
    var notes = document.getElementById('svcNotes').value.trim();
    var partsReplaced = document.getElementById('svcParts').value.trim();
    var nextServiceDate = document.getElementById('svcNextDate').value;

    if (!serviceDate || !performedBy || !notes) {
      if (typeof window.showToast === 'function') window.showToast('Please fill all required service log fields', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_service',
          assetId,
          serviceDate,
          serviceType,
          performedBy,
          cost,
          notes,
          partsReplaced,
          nextServiceDate,
        }),
      }) : fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_service',
          assetId,
          serviceDate,
          serviceType,
          performedBy,
          cost,
          notes,
          partsReplaced,
          nextServiceDate,
        }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast(`✅ Service recorded! "${asset.name}" restored to Active.`, 'success');
        await window.loadLiveAssetsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to log service');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error recording service', 'error');
    }
  }, '640px');
};

// View Service History Modal
window.openAssetHistoryModal = function(assetId) {
  var asset = (window.__cachedAssetsList || []).find(a => a.id === assetId);
  if (!asset) return;

  var logs = asset.serviceLogs || [];

  var html = `
    <div style="padding:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:15px;font-weight:800;color:#0F172A;">${asset.name}</div>
        <div style="font-size:12px;color:#64748B;margin-top:2px;">
          <span>Tag: <strong style="font-family:monospace;">${asset.serialNumber}</strong></span> · <span>📍 ${asset.location}</span>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('rwaAssetModalOverlay').style.display='none';window.openLogServiceModal('${asset.id}')">
          🔧 + Log New Service
        </button>
      </div>
    </div>

    <div style="max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;">
      ${logs.length === 0 ? `
        <div style="text-align:center;padding:36px;color:#94A3B8;">
          <div style="font-size:32px;margin-bottom:6px;">📋</div>
          <div>No maintenance service logs recorded yet.</div>
        </div>
      ` : ''}

      ${logs.map(l => `
        <div style="padding:14px;border:1px solid #E2E8F0;border-radius:10px;background:#FFFFFF;box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="badge badge-${l.serviceType==='BREAKDOWN'?'red':(l.serviceType==='REPAIR'?'amber':'blue')}" style="font-size:11px;font-weight:700;">
                ${l.serviceType}
              </span>
              <span style="font-size:13px;font-weight:700;color:#0F172A;">${l.performedBy}</span>
            </div>
            <div style="font-size:12px;font-weight:700;color:${l.cost>0?'#0F172A':'#16A34A'};">
              ${l.cost > 0 ? '₹' + Number(l.cost).toLocaleString('en-IN') : 'Covered under AMC (₹0)'}
            </div>
          </div>

          <div style="font-size:12.5px;color:#334155;line-height:1.45;margin-bottom:6px;">
            ${l.notes}
          </div>

          ${l.partsReplaced ? `
            <div style="font-size:11.5px;color:#64748B;background:#F1F5F9;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:6px;">
              🔩 <strong>Replaced:</strong> ${l.partsReplaced}
            </div>
          ` : ''}

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94A3B8;border-top:1px dashed #E2E8F0;padding-top:6px;margin-top:4px;">
            <span>📅 Service Date: ${l.serviceDate}</span>
            <span>Recorded by ${l.loggedBy}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  openAssetModal('📋 Maintenance & Service History: ' + asset.name, html, null, null, '680px');
};

// Edit Asset Modal
window.openEditAssetModal = function(assetId) {
  var asset = (window.__cachedAssetsList || []).find(a => a.id === assetId);
  if (!asset) return;

  var html = `
    <div>
      <label class="form-label">Asset Name *</label>
      <input type="text" id="eastName" required value="${asset.name}" class="form-input" style="width:100%;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Category</label>
        <select id="eastCategory" class="form-select" style="width:100%;">
          <option value="Lift" ${asset.category==='Lift'?'selected':''}>🛗 Lift / Elevator</option>
          <option value="Generator" ${asset.category==='Generator'?'selected':''}>⚡ Generator / DG Set</option>
          <option value="Security" ${asset.category==='Security'?'selected':''}>📹 CCTV / Security</option>
          <option value="Plumbing" ${asset.category==='Plumbing'?'selected':''}>🚰 Water Pump / STP</option>
          <option value="Safety" ${asset.category==='Safety'?'selected':''}>🧯 Fire Safety</option>
          <option value="Electrical" ${asset.category==='Electrical'?'selected':''}>🔌 Electrical</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Operational Status</label>
        <select id="eastStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE" ${asset.status==='ACTIVE'?'selected':''}>Active &amp; Operational</option>
          <option value="UNDER_REPAIR" ${asset.status==='UNDER_REPAIR'?'selected':''}>Under Maintenance / Repair</option>
          <option value="STANDBY" ${asset.status==='STANDBY'?'selected':''}>Standby / Backup</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Serial Tag / ID</label>
        <input type="text" id="eastSerial" value="${asset.serialNumber || ''}" class="form-input" style="width:100%;font-family:monospace;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Location in Society</label>
        <input type="text" id="eastLocation" value="${asset.location || ''}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Capital Value (₹)</label>
        <input type="number" id="eastValue" value="${asset.purchaseValue || 0}" class="form-input" style="width:100%;font-weight:700;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Next Service Date</label>
        <input type="date" id="eastNextService" value="${asset.nextServiceDate || ''}" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div>
      <label class="form-label">AMC Contractor Name</label>
      <input type="text" id="eastVendor" value="${asset.vendorName || ''}" class="form-input" style="width:100%;" />
    </div>
  `;

  openAssetModal('✏️ Edit Asset Details: ' + asset.name, html, 'Save Changes', async function() {
    var name = document.getElementById('eastName').value.trim();
    var category = document.getElementById('eastCategory').value;
    var status = document.getElementById('eastStatus').value;
    var serialNumber = document.getElementById('eastSerial').value.trim();
    var location = document.getElementById('eastLocation').value.trim();
    var purchaseValue = parseFloat(document.getElementById('eastValue').value) || 0;
    var nextServiceDate = document.getElementById('eastNextService').value;
    var vendorName = document.getElementById('eastVendor').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assetId, name, category, status, serialNumber, location, purchaseValue, nextServiceDate, vendorName }),
      }) : fetch('/api/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assetId, name, category, status, serialNumber, location, purchaseValue, nextServiceDate, vendorName }),
      }));

      if (res.ok) {
        if (typeof window.showToast === 'function') window.showToast('✅ Asset details updated successfully!', 'success');
        await window.loadLiveAssetsScreen();
      } else {
        var err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update asset');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message || 'Error updating asset', 'error');
    }
  }, '600px');
};

// Delete Asset
window.confirmDeleteAsset = async function(assetId, assetName) {
  if (!confirm(`Are you sure you want to decommission and remove "${assetName}" from the asset register?`)) return;

  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/assets?id=' + encodeURIComponent(assetId), {
      method: 'DELETE',
    }) : fetch('/api/assets?id=' + encodeURIComponent(assetId), {
      method: 'DELETE',
    }));

    if (res.ok) {
      if (typeof window.showToast === 'function') window.showToast(`🗑️ Asset "${assetName}" removed`, 'info');
      await window.loadLiveAssetsScreen();
    } else {
      var err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete asset');
    }
  } catch (e) {
    if (typeof window.showToast === 'function') window.showToast(e.message || 'Error deleting asset', 'error');
  }
};

// Filter Assets
window.filterAssetsByCategory = function(category) {
  window._assetCategoryFilter = category;
  document.querySelectorAll('.acat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === category);
  });
  window.renderAssetsGrid();
};

window.filterAssetsByStatus = function(status) {
  window._assetStatusFilter = status;
  document.querySelectorAll('.astat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-stat') === status);
  });
  window.renderAssetsGrid();
};

// Main Data Fetcher
window.loadLiveAssetsScreen = async function() {
  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/assets') : fetch('/api/assets'));
    if (res.ok) {
      var data = await res.json();
      window.__cachedAssetsList = data.assets || [];
      window.__cachedAssetMetrics = data.metrics || {};
    }
  } catch (e) {
    console.error('Failed to load assets:', e);
  }

  var metrics = window.__cachedAssetMetrics || {};
  var assets = window.__cachedAssetsList || [];

  var elTotal = document.getElementById('assetMetricTotal');
  if (elTotal) elTotal.textContent = (metrics.totalAssets || assets.length) + ' Tracked';

  var elValue = document.getElementById('assetMetricValue');
  if (elValue) {
    var lakhVal = ((metrics.totalCapitalValue || 0) / 100000).toFixed(2);
    elValue.textContent = '₹' + lakhVal + ' Lakhs';
  }

  var elActive = document.getElementById('assetMetricActive');
  if (elActive) {
    var pct = metrics.totalAssets ? Math.round((metrics.activeCount / metrics.totalAssets) * 100) : 100;
    elActive.textContent = (metrics.activeCount || 0) + ' Active (' + pct + '%)';
  }

  var elDue = document.getElementById('assetMetricDue');
  if (elDue) elDue.textContent = (metrics.serviceDueSoonCount || 0) + ' Due Soon';

  window.renderAssetsGrid();
};

// Render Assets Cards Grid
window.renderAssetsGrid = function() {
  var container = document.getElementById('assetsGridContainer');
  if (!container) return;

  var assets = window.__cachedAssetsList || [];
  var filterText = (document.getElementById('assetSearchInput')?.value || '').toLowerCase().trim();
  var catFilter = window._assetCategoryFilter || 'ALL';
  var statFilter = window._assetStatusFilter || 'ALL';

  if (catFilter !== 'ALL') {
    assets = assets.filter(a => a.category === catFilter);
  }

  if (statFilter !== 'ALL') {
    assets = assets.filter(a => a.status === statFilter);
  }

  if (filterText) {
    assets = assets.filter(a =>
      (a.name && a.name.toLowerCase().includes(filterText)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(filterText)) ||
      (a.location && a.location.toLowerCase().includes(filterText)) ||
      (a.category && a.category.toLowerCase().includes(filterText)) ||
      (a.vendorName && a.vendorName.toLowerCase().includes(filterText))
    );
  }

  var countBadge = document.getElementById('assetsCountBadge');
  if (countBadge) countBadge.textContent = assets.length + ' assets';

  if (assets.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text-muted);">
        <div style="font-size:36px;margin-bottom:8px;">🔍</div>
        <div style="font-weight:600;font-size:15px;">No assets match the selected filter criteria.</div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="window.openAddAssetModal()">+ Register New Asset</button>
      </div>
    `;
    return;
  }

  var today = new Date('2026-10-13T00:00:00.000Z');

  container.innerHTML = assets.map(function(a) {
    var isUnderRepair = a.status === 'UNDER_REPAIR';
    var nextDate = a.nextServiceDate ? new Date(a.nextServiceDate) : null;
    var daysToService = nextDate ? Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    var isDueSoon = daysToService <= 30;

    var lakhVal = (a.purchaseValue / 100000).toFixed(1);
    var valueStr = a.purchaseValue >= 100000 ? `₹${lakhVal}L (₹${Number(a.purchaseValue).toLocaleString('en-IN')})` : `₹${Number(a.purchaseValue).toLocaleString('en-IN')}`;

    var catIcon = a.category === 'Lift' ? '🛗' : (a.category === 'Generator' ? '⚡' : (a.category === 'Security' ? '📹' : (a.category === 'Plumbing' ? '🚰' : (a.category === 'Safety' ? '🧯' : '🔌'))));

    var logCount = (a.serviceLogs || []).length;

    return `
      <div style="padding:16px;border:1px solid ${isUnderRepair ? 'rgba(239,68,68,0.45)' : (isDueSoon ? 'rgba(245,158,11,0.45)' : 'var(--border)')};
        border-radius:var(--r-lg);transition:all 0.15s;
        background:${isUnderRepair ? 'rgba(239,68,68,0.03)' : (isDueSoon ? 'rgba(245,158,11,0.02)' : 'var(--bg-surface)')};"
        onmouseover="this.style.background='var(--bg-elevated)'"
        onmouseout="this.style.background='${isUnderRepair ? 'rgba(239,68,68,0.03)' : (isDueSoon ? 'rgba(245,158,11,0.02)' : 'var(--bg-surface)')}'">
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <span class="badge badge-muted" style="font-weight:600;">${catIcon} ${a.category}</span>
          <div style="display:flex;gap:4px;align-items:center;">
            <span class="badge badge-${isUnderRepair ? 'red' : 'green'}" style="font-weight:700;">
              ${a.status}
            </span>
          </div>
        </div>

        <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:2px;">
          ${a.name}
        </div>

        <div style="font-size:11.5px;color:var(--text-muted);display:flex;gap:6px;align-items:center;margin-bottom:10px;">
          <span style="font-family:monospace;background:#F1F5F9;padding:1px 5px;border-radius:4px;">${a.serialNumber}</span>
          <span>· 📍 ${a.location}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--text-secondary);background:var(--bg-elevated);padding:10px;border-radius:8px;margin-bottom:12px;">
          <div>💰 <strong>Book Value:</strong> ${valueStr}</div>
          <div>📅 <strong>Purchased:</strong> ${a.purchaseDate || '—'}</div>
          ${a.vendorName ? `<div>🛡️ <strong>AMC:</strong> ${a.vendorName}</div>` : ''}
          <div style="color:${isUnderRepair ? 'var(--red)' : (isDueSoon ? 'var(--amber)' : 'var(--text-muted)')};font-weight:600;">
            🔧 <strong>Next Service:</strong> ${a.nextServiceDate || 'Not scheduled'}
            ${isDueSoon && !isUnderRepair ? ` <span style="font-size:11px;background:#FEF3C7;color:#B45309;padding:1px 5px;border-radius:4px;">In ${daysToService}d</span>` : ''}
          </div>
        </div>

        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" style="flex:1;justify-content:center;font-weight:600;" onclick="window.openAssetHistoryModal('${a.id}')">
            📋 History (${logCount})
          </button>
          <button class="btn btn-primary btn-sm" style="justify-content:center;padding:4px 10px;font-weight:600;" onclick="window.openLogServiceModal('${a.id}')">
            🔧 Service
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.openEditAssetModal('${a.id}')" title="Edit Asset" style="padding:4px 8px;">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="window.confirmDeleteAsset('${a.id}', '${a.name.replace(/'/g, "\\'")}')" title="Delete Asset" style="padding:4px 8px;color:#EF4444;">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
};

Screens['admin-assets'] = function() {
  setTimeout(function() {
    window.loadLiveAssetsScreen();
  }, 10);

  return Shell.render('admin-assets', {
    title: 'Assets',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `<button class="btn btn-primary btn-sm" onclick="window.openAddAssetModal()">➕ + Add Asset</button>`,
    content: `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">Asset Register</div>
          <div class="page-subtitle">Track common assets, service history, and maintenance schedules</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="window.openAddAssetModal()">➕ + Add Asset</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px;">
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--blue);cursor:pointer;" onclick="window.filterAssetsByStatus('ALL')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Total Capital Assets</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="assetMetricTotal">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Tracked under society asset ledger</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid #8B5CF6;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Total Asset Valuation</div>
          <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-top:4px;" id="assetMetricValue">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Cumulative original purchase value</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--green);cursor:pointer;" onclick="window.filterAssetsByStatus('ACTIVE')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Operational Health</div>
          <div style="font-size:22px;font-weight:800;color:var(--green);margin-top:4px;" id="assetMetricActive">Loading...</div>
          <div style="font-size:11.5px;color:var(--green);margin-top:2px;">Assets active and in normal service</div>
        </div>
        <div class="card card-sm" style="padding:14px;border-left:4px solid var(--amber);cursor:pointer;" onclick="window.filterAssetsByStatus('UNDER_REPAIR')">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Maintenance Due (30d)</div>
          <div style="font-size:22px;font-weight:800;color:var(--amber);margin-top:4px;" id="assetMetricDue">Loading...</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">Scheduled routine inspection required</div>
        </div>
      </div>

      <!-- Controls Toolbar -->
      <div class="card" style="margin-bottom:16px;">
        <div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <input type="text" id="assetSearchInput" placeholder="🔍 Search asset by name, tag, location, category..." class="form-input" style="width:100%;font-size:13px;" oninput="window.renderAssetsGrid()" />
          </div>

          <!-- Category filter pills -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-sm acat-pill active" data-cat="ALL" onclick="window.filterAssetsByCategory('ALL')" style="font-size:11.5px;padding:3px 10px;">All</button>
            <button class="btn btn-sm acat-pill" data-cat="Lift" onclick="window.filterAssetsByCategory('Lift')" style="font-size:11.5px;padding:3px 10px;">🛗 Lifts</button>
            <button class="btn btn-sm acat-pill" data-cat="Generator" onclick="window.filterAssetsByCategory('Generator')" style="font-size:11.5px;padding:3px 10px;">⚡ Generator</button>
            <button class="btn btn-sm acat-pill" data-cat="Security" onclick="window.filterAssetsByCategory('Security')" style="font-size:11.5px;padding:3px 10px;">📹 Security</button>
            <button class="btn btn-sm acat-pill" data-cat="Plumbing" onclick="window.filterAssetsByCategory('Plumbing')" style="font-size:11.5px;padding:3px 10px;">🚰 Pumps</button>
            <button class="btn btn-sm acat-pill" data-cat="Safety" onclick="window.filterAssetsByCategory('Safety')" style="font-size:11.5px;padding:3px 10px;">🧯 Fire</button>
          </div>
        </div>

        <div style="padding:8px 16px;background:var(--bg-elevated);border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;font-size:12px;">
          <div>
            <span id="assetsCountBadge" class="badge badge-blue">Loading...</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="color:var(--text-muted);">Status:</span>
            <button class="btn btn-sm astat-pill active" data-stat="ALL" onclick="window.filterAssetsByStatus('ALL')" style="font-size:11px;padding:2px 8px;">All</button>
            <button class="btn btn-sm astat-pill" data-stat="ACTIVE" onclick="window.filterAssetsByStatus('ACTIVE')" style="font-size:11px;padding:2px 8px;color:#16A34A;font-weight:700;">Active</button>
            <button class="btn btn-sm astat-pill" data-stat="UNDER_REPAIR" onclick="window.filterAssetsByStatus('UNDER_REPAIR')" style="font-size:11px;padding:2px 8px;color:#DC2626;font-weight:700;">Under Repair</button>
          </div>
        </div>
      </div>

      <!-- Assets Grid -->
      <div class="mini-grid-3" id="assetsGridContainer">
        <div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--text-muted);">
          Loading live asset registry...
        </div>
      </div>
    `,
  });
};

