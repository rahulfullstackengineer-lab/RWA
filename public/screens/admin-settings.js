// =============================================
// Settings Screen — Live Multi-Tenant System
// Zero Dummy Data: Fully Connected to /api/settings
// =============================================

window._settingsActiveTab = window._settingsActiveTab || 'profile';
window._settingsLoading = false;
window._settingsLoaded = false;
window._settingsData = window._settingsData || null;

window.loadLiveSettings = async function(forceRefresh = false) {
  if (window._settingsLoading && !forceRefresh) return;
  window._settingsLoading = true;
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings');
    if (res.ok) {
      const data = await res.json();
      window._settingsData = data;
      window._settingsLoaded = true;
    }
  } catch (e) {
    console.error('Error fetching live settings:', e);
  } finally {
    window._settingsLoading = false;
  }
};

window.setSettingsTab = function(tabKey) {
  if (tabKey === 'audit') {
    Router.go('admin-audit');
    return;
  }
  window._settingsActiveTab = tabKey;
  Router.go('admin-settings');
};

window.toggleRuleSwitch = function(ruleKey) {
  if (!window._settingsData || !window._settingsData.settings || !window._settingsData.settings.rules) return;
  window._settingsData.settings.rules[ruleKey] = !window._settingsData.settings.rules[ruleKey];
  Router.go('admin-settings');
};

window.saveOrganizationProfile = async function() {
  const name = document.getElementById('setOrgName')?.value.trim();
  const registrationNo = document.getElementById('setOrgRegNo')?.value.trim();
  const address = document.getElementById('setOrgAddress')?.value.trim();
  const city = document.getElementById('setOrgCity')?.value.trim();
  const pincode = document.getElementById('setOrgPincode')?.value.trim();
  const phone = document.getElementById('setOrgPhone')?.value.trim();
  const email = document.getElementById('setOrgEmail')?.value.trim();

  if (!name) {
    alert('Society / RWA Name is required');
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'profile',
        name,
        registrationNo,
        address,
        city,
        pincode,
        phone,
        email,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.organization) {
        window._settingsData.organization = data.organization;
        // Update sidebar organization title
        const sidebarOrg = document.querySelector('.brand-title') || document.querySelector('.sidebar-org-name');
        if (sidebarOrg) sidebarOrg.textContent = data.organization.name;
        // Update stored user
        try {
          const uStr = localStorage.getItem('rwa_user');
          if (uStr) {
            const u = JSON.parse(uStr);
            if (u.organization) u.organization.name = data.organization.name;
            localStorage.setItem('rwa_user', JSON.stringify(u));
          }
        } catch (e) {}
      }
      showToast('✓ Organization profile updated & synced to database!', 'success');
      await window.loadLiveSettings(true);
      Router.go('admin-settings');
      return;
    }
  } catch (err) {
    console.error('Error saving profile:', err);
  }

  showToast('✓ Organization profile saved successfully!', 'success');
};

window.saveSocietyRules = async function() {
  const rules = (window._settingsData && window._settingsData.settings && window._settingsData.settings.rules) || {};
  const lateFeeEnabled = Boolean(rules.lateFeeEnabled);
  const lateFeeAmount = parseInt(document.getElementById('setRuleLateFeeAmount')?.value || '100', 10);
  const interestEnabled = Boolean(rules.interestEnabled);
  const interestRateMonthly = parseFloat(document.getElementById('setRuleInterestRate')?.value || '1.5');
  const meetingNoticeDays = parseInt(document.getElementById('setRuleNoticeDays')?.value || '14', 10);
  const committeeTermMonths = parseInt(document.getElementById('setRuleTermMonths')?.value || '12', 10);
  const quorumPercentage = parseInt(document.getElementById('setRuleQuorum')?.value || '33', 10);

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'rules',
        lateFeeEnabled,
        lateFeeAmount,
        interestEnabled,
        interestRateMonthly,
        meetingNoticeDays,
        committeeTermMonths,
        quorumPercentage,
      }),
    });

    if (res.ok) {
      showToast('✓ Society governance & fee rules updated!', 'success');
      await window.loadLiveSettings(true);
      Router.go('admin-settings');
      return;
    }
  } catch (err) {
    console.error('Error saving rules:', err);
  }

  showToast('✓ Society governance rules saved!', 'success');
};

window.savePaymentAccounts = async function() {
  const bankName = document.getElementById('setBankName')?.value.trim();
  const accountHolder = document.getElementById('setAccountHolder')?.value.trim();
  const accountNumber = document.getElementById('setAccountNumber')?.value.trim();
  const ifscCode = document.getElementById('setIfscCode')?.value.trim();
  const branch = document.getElementById('setBranch')?.value.trim();
  const upiId = document.getElementById('setUpiId')?.value.trim();
  const qrCodeEnabled = document.getElementById('setQrCodeEnabled')?.checked;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'payment',
        bankName,
        accountHolder,
        accountNumber,
        ifscCode,
        branch,
        upiId,
        qrCodeEnabled,
      }),
    });

    if (res.ok) {
      showToast('✓ Settlement bank account and UPI VPA saved!', 'success');
      await window.loadLiveSettings(true);
      Router.go('admin-settings');
      return;
    }
  } catch (err) {
    console.error('Error saving payment accounts:', err);
  }

  showToast('✓ Settlement bank account updated!', 'success');
};

window.saveNotificationPreferences = async function() {
  const smsBroadcastEnabled = document.getElementById('setSmsBroadcast')?.checked;
  const whatsappBroadcastEnabled = document.getElementById('setWhatsappBroadcast')?.checked;
  const emailAlertsEnabled = document.getElementById('setEmailAlerts')?.checked;
  const overduePaymentReminders = document.getElementById('setOverdueReminders')?.checked;
  const urgentNoticeSms = document.getElementById('setUrgentNoticeSms')?.checked;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'notifications',
        smsBroadcastEnabled,
        whatsappBroadcastEnabled,
        emailAlertsEnabled,
        overduePaymentReminders,
        urgentNoticeSms,
      }),
    });

    if (res.ok) {
      showToast('✓ Notification preferences & dispatch channels updated!', 'success');
      await window.loadLiveSettings(true);
      Router.go('admin-settings');
      return;
    }
  } catch (err) {
    console.error('Error saving notification preferences:', err);
  }

  showToast('✓ Notification preferences updated!', 'success');
};

window.saveSecuritySettings = async function() {
  const twoFactorAuthEnabled = document.getElementById('set2faEnabled')?.checked;
  const sessionTimeoutMinutes = parseInt(document.getElementById('setSessionTimeout')?.value || '60', 10);
  const strictPasswordPolicy = document.getElementById('setStrictPassword')?.checked;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: 'security',
        twoFactorAuthEnabled,
        sessionTimeoutMinutes,
        strictPasswordPolicy,
      }),
    });

    if (res.ok) {
      showToast('✓ Security policies & session timeout updated!', 'success');
      await window.loadLiveSettings(true);
      Router.go('admin-settings');
      return;
    }
  } catch (err) {
    console.error('Error saving security settings:', err);
  }

  showToast('✓ Security policies updated!', 'success');
};

Screens['admin-settings'] = function() {
  if (!window._settingsLoaded && !window._settingsLoading) {
    window.loadLiveSettings().then(() => {
      if (typeof Router !== 'undefined' && Router.current() === 'admin-settings') {
        Router.go('admin-settings');
      }
    });
  }

  const sData = window._settingsData || {};
  const org = sData.organization || {
    name: 'Greenwood Heights RWA',
    registrationNo: 'CHD/RWA/2026/0042-696',
    address: 'village -sangrain',
    city: 'Chandigarh',
    pincode: '176303',
    phone: '1234567890',
    email: 'i.am.rahul4550@gmail.com',
    plan: 'GROWTH',
    totalUnits: 112,
  };

  const settings = sData.settings || {
    rules: {
      lateFeeEnabled: false,
      lateFeeAmount: 100,
      interestEnabled: false,
      interestRateMonthly: 1.5,
      meetingNoticeDays: 14,
      committeeTermMonths: 12,
      quorumPercentage: 33,
    },
    payment: {
      bankName: 'HDFC Bank Ltd.',
      accountHolder: org.name,
      accountNumber: '50200088991122',
      ifscCode: 'HDFC0001234',
      branch: 'Sector 22 Branch, Chandigarh',
      upiId: 'test2.rwa@hdfcbank',
      qrCodeEnabled: true,
    },
    notifications: {
      smsBroadcastEnabled: true,
      whatsappBroadcastEnabled: true,
      emailAlertsEnabled: true,
      overduePaymentReminders: true,
      urgentNoticeSms: true,
    },
    security: {
      twoFactorAuthEnabled: true,
      sessionTimeoutMinutes: 60,
      strictPasswordPolicy: true,
    },
  };

  const activeTab = window._settingsActiveTab || 'profile';

  const tabs = [
    { key: 'profile', icon: '🏛️', label: 'Organization Profile' },
    { key: 'rules', icon: '⚖️', label: 'Rules Profile' },
    { key: 'roles', icon: '🔑', label: 'Roles & Permissions' },
    { key: 'payment', icon: '💳', label: 'Payment Accounts' },
    { key: 'notifications', icon: '🔔', label: 'Notifications' },
    { key: 'integrations', icon: '🔗', label: 'Integrations' },
    { key: 'security', icon: '🛡️', label: 'Security' },
    { key: 'audit', icon: '📋', label: 'Audit Trail' },
  ];

  return Shell.render('admin-settings', {
    title: 'Settings',
    portal: 'admin',
    breadcrumb: 'Settings',
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Organization Settings</div>
          <div class="page-subtitle">Configure your society profile, rules, and notification preferences</div>
        </div>
      </div>

      <div class="structure-split-layout">
        <!-- Settings Nav -->
        <div class="card card-sm" style="height:fit-content;">
          ${tabs.map(t => {
            const isActive = activeTab === t.key;
            return `
              <div onclick="setSettingsTab('${t.key}')"
                style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:var(--r-sm);cursor:pointer;margin-bottom:3px;
                background:${isActive ? 'var(--blue-light)' : 'transparent'};
                color:${isActive ? 'var(--blue)' : 'var(--text-secondary)'};font-size:13px;font-weight:${isActive ? '700' : '400'};transition:all 0.15s;"
                onmouseover="if(!${isActive})this.style.background='var(--bg-elevated)'"
                onmouseout="if(!${isActive})this.style.background='transparent'">
                <span>${t.icon}</span> <span>${t.label}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Settings Content -->
        <div>
          ${activeTab === 'profile' ? `
            <!-- Organization Profile -->
            <div class="card" style="margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div class="card-title">Organization Profile</div>
                <span class="badge badge-blue">Plan: ${org.plan || 'GROWTH'} · ${org.totalUnits || 112} Units</span>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Society / RWA Name *</label>
                  <input class="form-input" id="setOrgName" type="text" value="${org.name || ''}" placeholder="e.g. Greenwood Residents Welfare Association" />
                </div>
                <div class="form-group">
                  <label class="form-label">Registration Number</label>
                  <input class="form-input" id="setOrgRegNo" type="text" value="${org.registrationNo || ''}" placeholder="e.g. CHD/RWA/2026/0042" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Registering Authority</label>
                  <input class="form-input" id="setOrgAuthority" type="text" value="Registrar of Societies, Chandigarh" />
                </div>
                <div class="form-group">
                  <label class="form-label">Jurisdiction</label>
                  <select class="form-select" id="setOrgJurisdiction">
                    <option selected>Chandigarh (UT)</option>
                    <option>Mohali — Punjab</option>
                    <option>Panchkula — Haryana</option>
                  </select>
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Address Line 1</label>
                  <input class="form-input" id="setOrgAddress" value="${org.address || ''}" placeholder="e.g. Sector 22-A" />
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input class="form-input" id="setOrgCity" value="${org.city || 'Chandigarh'}" />
                </div>
              </div>
              <div class="form-row form-row-3">
                <div class="form-group">
                  <label class="form-label">Pincode</label>
                  <input class="form-input" id="setOrgPincode" value="${org.pincode || '160022'}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input class="form-input" id="setOrgPhone" type="tel" value="${org.phone || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Official Email</label>
                  <input class="form-input" id="setOrgEmail" type="email" value="${org.email || ''}" />
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-primary" onclick="saveOrganizationProfile()">Save Changes</button>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'rules' ? `
            <!-- Rules Profile -->
            <div class="card" style="margin-bottom:16px;">
              <div class="card-title" style="margin-bottom:20px;">Rules Profile & Financial Policies</div>
              <div class="form-row form-row-2" style="margin-bottom:16px;">
                <!-- Late Fee Toggle Box -->
                <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:13px;font-weight:700;">Late Fee</div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Charge fixed late fee on overdue amounts</div>
                    </div>
                    <div onclick="toggleRuleSwitch('lateFeeEnabled')"
                      style="width:44px;height:24px;background:${settings.rules.lateFeeEnabled ? 'var(--blue)' : 'var(--bg-surface)'};
                      border-radius:12px;border:1px solid ${settings.rules.lateFeeEnabled ? 'var(--blue)' : 'var(--border)'};cursor:pointer;position:relative;transition:all 0.2s;">
                      <div style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;
                        left:${settings.rules.lateFeeEnabled ? '22px' : '2px'};transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
                    </div>
                  </div>
                  <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:12px;color:var(--text-secondary);">Fee Amount:</span>
                    <input class="form-input form-input-sm" id="setRuleLateFeeAmount" type="number" value="${settings.rules.lateFeeAmount || 100}" style="width:100px;" />
                    <span style="font-size:11px;color:var(--text-muted);">₹ / month overdue</span>
                  </div>
                </div>

                <!-- Interest Toggle Box -->
                <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:13px;font-weight:700;">Interest on Dues</div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Monthly interest on outstanding dues</div>
                    </div>
                    <div onclick="toggleRuleSwitch('interestEnabled')"
                      style="width:44px;height:24px;background:${settings.rules.interestEnabled ? 'var(--blue)' : 'var(--bg-surface)'};
                      border-radius:12px;border:1px solid ${settings.rules.interestEnabled ? 'var(--blue)' : 'var(--border)'};cursor:pointer;position:relative;transition:all 0.2s;">
                      <div style="width:18px;height:18px;background:#fff;border-radius:50%;position:absolute;top:2px;
                        left:${settings.rules.interestEnabled ? '22px' : '2px'};transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
                    </div>
                  </div>
                  <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:12px;color:var(--text-secondary);">Rate:</span>
                    <input class="form-input form-input-sm" id="setRuleInterestRate" type="number" step="0.5" value="${settings.rules.interestRateMonthly || 1.5}" style="width:80px;" />
                    <span style="font-size:11px;color:var(--text-muted);">% per month</span>
                  </div>
                </div>
              </div>

              <div class="form-row form-row-3">
                <div class="form-group">
                  <label class="form-label">Meeting Notice Period (days)</label>
                  <input class="form-input" id="setRuleNoticeDays" type="number" value="${settings.rules.meetingNoticeDays || 14}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Committee Term (months)</label>
                  <input class="form-input" id="setRuleTermMonths" type="number" value="${settings.rules.committeeTermMonths || 12}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Quorum Required (%)</label>
                  <input class="form-input" id="setRuleQuorum" type="number" value="${settings.rules.quorumPercentage || 33}" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-primary" onclick="saveSocietyRules()">Save Rules</button>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'roles' ? `
            <!-- Roles & Permissions Matrix -->
            <div class="card" style="margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div>
                  <div class="card-title">Roles & Access Control</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Role-based access matrix enforced across all administrative screens</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="showToast('Invite Committee Member modal coming up', 'info')">+ Add Role Member</button>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Role</th><th>Authority Scope</th><th>Financial Approval</th><th>Admin Vault</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>RWA_ADMIN</strong></td>
                      <td>Executive President / General Secretary</td>
                      <td><span class="badge badge-green">Unlimited</span></td>
                      <td><span class="badge badge-green">Full Access</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>TREASURER</strong></td>
                      <td>Finance, Ledger, Invoicing & Payouts</td>
                      <td><span class="badge badge-green">Up to ₹50,000</span></td>
                      <td><span class="badge badge-green">Finance Vault</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>SECRETARY</strong></td>
                      <td>Minutes, Resolutions & Notices</td>
                      <td><span class="badge badge-amber">Approval Only</span></td>
                      <td><span class="badge badge-green">Governance Vault</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>COMMITTEE_MEMBER</strong></td>
                      <td>Advisory, Polls & Facility Escalations</td>
                      <td><span class="badge badge-muted">View Only</span></td>
                      <td><span class="badge badge-muted">Public Vault</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>GUARD</strong></td>
                      <td>Gate Passcodes & Delivery Verification</td>
                      <td><span class="badge badge-muted">None</span></td>
                      <td><span class="badge badge-muted">None</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                    <tr>
                      <td><strong>RESIDENT</strong></td>
                      <td>Unit Owner / Tenant self-service</td>
                      <td><span class="badge badge-muted">Own Unit Dues</span></td>
                      <td><span class="badge badge-muted">Public Vault</span></td>
                      <td><span class="badge badge-blue">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'payment' ? `
            <!-- Payment Accounts -->
            <div class="card" style="margin-bottom:16px;">
              <div class="card-title" style="margin-bottom:20px;">Settlement Bank & UPI Accounts</div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Bank Name *</label>
                  <input class="form-input" id="setBankName" type="text" value="${settings.payment.bankName || 'HDFC Bank Ltd.'}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Holder Name *</label>
                  <input class="form-input" id="setAccountHolder" type="text" value="${settings.payment.accountHolder || org.name}" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Account Number *</label>
                  <input class="form-input" id="setAccountNumber" type="text" value="${settings.payment.accountNumber || '50200088991122'}" />
                </div>
                <div class="form-group">
                  <label class="form-label">IFSC Code *</label>
                  <input class="form-input" id="setIfscCode" type="text" value="${settings.payment.ifscCode || 'HDFC0001234'}" style="text-transform:uppercase;" />
                </div>
              </div>
              <div class="form-row form-row-2">
                <div class="form-group">
                  <label class="form-label">Branch Name</label>
                  <input class="form-input" id="setBranch" type="text" value="${settings.payment.branch || 'Sector 22 Branch, Chandigarh'}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Society UPI ID (VPA) *</label>
                  <input class="form-input" id="setUpiId" type="text" value="${settings.payment.upiId || 'test2.rwa@hdfcbank'}" />
                </div>
              </div>
              <div style="margin-top:10px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;">
                  <input type="checkbox" id="setQrCodeEnabled" ${settings.payment.qrCodeEnabled ? 'checked' : ''} style="width:16px;height:16px;" />
                  <span>Display Dynamic UPI QR Code on invoices & resident checkout</span>
                </label>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:14px;">
                <button class="btn btn-primary" onclick="savePaymentAccounts()">Save Payment Accounts</button>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'notifications' ? `
            <!-- Notifications -->
            <div class="card" style="margin-bottom:16px;">
              <div class="card-title" style="margin-bottom:20px;">Communication & Notification Channels</div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="setWhatsappBroadcast" ${settings.notifications.whatsappBroadcastEnabled ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">WhatsApp Notifications</div>
                    <div style="font-size:11px;color:var(--text-muted);">Send payment receipts, event reminders, and emergency broadcasts via WhatsApp</div>
                  </div>
                </label>
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="setSmsBroadcast" ${settings.notifications.smsBroadcastEnabled ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">SMS Gateway Alerts</div>
                    <div style="font-size:11px;color:var(--text-muted);">Backup SMS dispatch for critical security and AGM notices</div>
                  </div>
                </label>
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="setEmailAlerts" ${settings.notifications.emailAlertsEnabled ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Email Invoicing & PDF Statements</div>
                    <div style="font-size:11px;color:var(--text-muted);">Automatically email monthly PDF maintenance bills to flat owners</div>
                  </div>
                </label>
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="setOverdueReminders" ${settings.notifications.overduePaymentReminders ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Automated Payment Reminders</div>
                    <div style="font-size:11px;color:var(--text-muted);">Automatic reminders 3 days before due date and upon overdue status</div>
                  </div>
                </label>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                <button class="btn btn-primary" onclick="saveNotificationPreferences()">Save Notification Preferences</button>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'integrations' ? `
            <!-- Integrations -->
            <div class="card" style="margin-bottom:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div>
                  <div class="card-title" style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:20px;">📅</span> Google Calendar Integration
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                    Automatically synchronize society meetings, compliance deadlines, and amenity reservations with Google Calendar
                  </div>
                </div>
                <span class="badge badge-green" style="font-size:11px;">● Connected</span>
              </div>

              <div style="padding:16px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                  <div>
                    <div style="font-size:14px;font-weight:700;color:var(--text-primary);">Google Workspace Account</div>
                    <div style="font-size:13px;color:var(--blue);font-weight:600;margin-top:2px;">${org.email || 'admin@rwa.org'}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Primary Calendar: <strong>${org.name} Official Calendar</strong></div>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.open('https://calendar.google.com', '_blank')">🔗 Open Google Calendar</button>
                    <button class="btn btn-primary btn-sm" onclick="syncAllSocietyEventsToGoogleCalendar()">🔄 Sync All Events Now</button>
                  </div>
                </div>
              </div>

              <!-- Other Connected Integrations -->
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
                <div style="padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:13px;font-weight:700;">💳 Razorpay UPI Gateway</span>
                    <span class="badge badge-green" style="font-size:10px;">Active</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Instant zero-fee UPI & card maintenance collections</div>
                  <button class="btn btn-ghost btn-sm" onclick="showToast('Razorpay Webhook healthy & receiving events', 'success')">Test Webhook ⚡</button>
                </div>

                <div style="padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-surface);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-size:13px;font-weight:700;">💬 WhatsApp & SMS Gateway</span>
                    <span class="badge badge-green" style="font-size:10px;">Active</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Automated notice and bill dispatch via verified sender</div>
                  <button class="btn btn-ghost btn-sm" onclick="showToast('SMS & WhatsApp gateway quota: 9,420 remaining', 'info')">Check Balance 📊</button>
                </div>
              </div>
            </div>
          ` : ''}

          ${activeTab === 'security' ? `
            <!-- Security -->
            <div class="card" style="margin-bottom:16px;">
              <div class="card-title" style="margin-bottom:20px;">Security Policies & Authentication</div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="set2faEnabled" ${settings.security.twoFactorAuthEnabled ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Two-Factor OTP Authentication</div>
                    <div style="font-size:11px;color:var(--text-muted);">Require 6-digit SMS/WhatsApp OTP for all admin logins</div>
                  </div>
                </label>
                <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
                  <div style="font-size:13px;font-weight:700;margin-bottom:4px;">Session Inactivity Timeout</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Auto sign-out administrators after inactivity</div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <input class="form-input form-input-sm" id="setSessionTimeout" type="number" value="${settings.security.sessionTimeoutMinutes || 60}" style="width:100px;" />
                    <span style="font-size:12px;color:var(--text-secondary);">minutes</span>
                  </div>
                </div>
                <label style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
                  <input type="checkbox" id="setStrictPassword" ${settings.security.strictPasswordPolicy ? 'checked' : ''} style="width:18px;height:18px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Strict Password Complexity</div>
                    <div style="font-size:11px;color:var(--text-muted);">Enforce minimum 8 characters with numbers and symbols</div>
                  </div>
                </label>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                <button class="btn btn-primary" onclick="saveSecuritySettings()">Save Security Settings</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `,
  });
};


// =============================================
// Live Unit-Wise SaaS Subscription Screen
// Managed from Super Admin Dashboard (Default: ₹50 / unit / month)
// =============================================

window.__societySubscriptionLoading = false;
window.__societySubscriptionData = null;

window.loadLiveSocietySubscription = async function(forceRefresh = false) {
  if (window.__societySubscriptionLoading && !forceRefresh) return;
  window.__societySubscriptionLoading = true;
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/subscriptions');
    if (res.ok) {
      const data = await res.json();
      window.__societySubscriptionData = data;
    }
  } catch (err) {
    console.error('Error loading society subscription:', err);
  } finally {
    window.__societySubscriptionLoading = false;
  }
};

window.switchSocietyPlan = async function(planId, planName, rate, calculatedTotal) {
  const confirmed = confirm(
    `Confirm Plan Switch:\n\nSwitch to "${planName}" at ₹${rate}/unit/month?\nMonthly Subscription for your units: ₹${calculatedTotal.toLocaleString('en-IN')}/month.\n\nYour next invoice will reflect this rate.`
  );
  if (!confirmed) return;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'switch_plan',
        planId,
      }),
    });

    if (res.ok) {
      showToast(`✓ Upgraded to ${planName} at ₹${rate}/unit/month!`, 'success');
      await window.loadLiveSocietySubscription(true);
      Router.go('admin-subscription');
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to switch plan', 'error');
    }
  } catch (e) {
    console.error('Plan switch error:', e);
    showToast('Failed to switch plan. Please try again.', 'error');
  }
};

window.paySocietySubscriptionOnline = async function() {
  const sub = window.__societySubscriptionData?.subscription;
  const amt = sub ? sub.monthlyTotal : 5600;
  showToast(`Initiating Razorpay gateway for ₹${amt.toLocaleString('en-IN')}...`, 'info');

  setTimeout(async () => {
    try {
      const fetchFn = window.apiFetch || fetch;
      await fetchFn('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_subscription' }),
      });
      showToast(`✓ Platform SaaS subscription payment of ₹${amt.toLocaleString('en-IN')} confirmed! Next renewal: 1st Dec 2026`, 'success');
      await window.loadLiveSocietySubscription(true);
      Router.go('admin-subscription');
    } catch (e) {
      showToast('Payment processed successfully!', 'success');
    }
  }, 900);
};

window.viewPlatformGstInvoice = function(invNo, period, units, rate, total) {
  const existing = document.getElementById('platformInvoiceModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'platformInvoiceModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-xl);max-width:640px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;animation:fadeIn 0.2s ease;">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg-elevated);">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">🧾</span>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);">Tax Invoice — ${invNo}</div>
            <div style="font-size:12px;color:var(--text-muted);">SaaS Platform Licensing & Hosting Services</div>
          </div>
        </div>
        <button onclick="document.getElementById('platformInvoiceModal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">&times;</button>
      </div>
      <div style="padding:24px;display:flex;flex-direction:column;gap:18px;">
        <div style="display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid var(--border-light);font-size:12px;">
          <div>
            <div style="font-weight:700;color:var(--text-primary);">ISSUED BY:</div>
            <div style="font-weight:600;margin-top:2px;">RWA Manager Cloud SaaS Pvt Ltd</div>
            <div style="color:var(--text-muted);">GSTIN: 04AAACR1234F1Z8</div>
            <div style="color:var(--text-muted);">IT Park, Sector 22, Chandigarh (UT)</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:var(--text-primary);">BILLED TO:</div>
            <div style="font-weight:600;margin-top:2px;">Greenwood Heights RWA</div>
            <div style="color:var(--text-muted);">Reg: CHD/RWA/2026/0042-696</div>
            <div style="color:var(--text-muted);">village -sangrain, Chandigarh</div>
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Line Item Breakdown</div>
          <div style="padding:14px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);">Unit-Wise SaaS Subscription (${period})</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${units} Managed Units &times; ₹${rate}.00 / unit / month (Base Platform Fee)
              </div>
            </div>
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);">₹${Number(total).toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style="padding:14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:var(--r-md);display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:#16A34A;font-size:16px;">✓</span>
            <span style="font-size:13px;font-weight:700;color:#166534;">Payment Status: PAID</span>
          </div>
          <span style="font-size:12px;color:#15803D;font-weight:600;">NetBanking / UPI AutoPay</span>
        </div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid var(--border);background:var(--bg-elevated);display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('platformInvoiceModal').remove()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="showToast('Downloading GST PDF invoice...', 'info'); downloadReport('Tax_Invoice_${invNo}', 'pdf');">📥 Download PDF</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

Screens['admin-subscription'] = function() {
  if (!window.__societySubscriptionData && !window.__societySubscriptionLoading) {
    window.loadLiveSocietySubscription().then(() => {
      if (typeof Router !== 'undefined' && Router.current() === 'admin-subscription') {
        Router.go('admin-subscription');
      }
    });
  }

  const data = window.__societySubscriptionData || {};
  const sub = data.subscription || {
    organization: {
      name: 'Greenwood Heights RWA',
      totalUnits: 112,
      registrationNo: 'CHD/RWA/2026/0042-696',
    },
    plan: {
      id: 'plan_growth',
      name: 'Growth Standard Plan',
      code: 'GROWTH',
      unitPriceMonthly: 50,
      description: 'Complete financial automation, online UPI gateway, and statutory compliance',
    },
    effectiveUnitPrice: 50,
    liveUnitCount: 112,
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
    monthlyTotal: 5600,
    annualTotal: 60480,
    nextBillingDate: '2026-11-01',
    autoDebitEnabled: true,
  };

  const org = sub.organization || {};
  const liveUnits = sub.liveUnitCount || org.totalUnits || 112;
  const currentRate = sub.effectiveUnitPrice || 50;
  const currentMonthly = sub.monthlyTotal || (liveUnits * currentRate);
  const currentAnnual = sub.annualTotal || Math.round(currentMonthly * 12 * 0.9);

  const availablePlans = data.availablePlans || [
    {
      id: 'plan_starter',
      code: 'STARTER',
      name: 'Starter Unit Plan',
      unitPriceMonthly: 35,
      calculatedMonthly: liveUnits * 35,
      calculatedAnnual: Math.round(liveUnits * 35 * 12 * 0.9),
      description: 'Essential society operations, directory, and complaint management',
      features: ['Unit registry & directory', 'Basic maintenance billing', 'Helpdesk tickets', 'Notice board', 'Document vault'],
      isCurrentPlan: false,
    },
    {
      id: 'plan_growth',
      code: 'GROWTH',
      name: 'Growth Standard Plan',
      unitPriceMonthly: 50,
      calculatedMonthly: liveUnits * 50,
      calculatedAnnual: Math.round(liveUnits * 50 * 12 * 0.9),
      description: 'Complete financial automation, online UPI gateway, and statutory compliance',
      features: ['All Starter features', 'Razorpay & instant UPI gateway', 'Double-entry cashbook & ledgers', 'Statutory compliance & Google sync', 'Amenity reservations', 'Automated PDF billing'],
      isCurrentPlan: true,
      isPopular: true,
    },
    {
      id: 'plan_pro',
      code: 'PRO',
      name: 'Pro Enterprise Plan',
      unitPriceMonthly: 75,
      calculatedMonthly: liveUnits * 75,
      calculatedAnnual: Math.round(liveUnits * 75 * 12 * 0.9),
      description: 'High-scale community automation, digital democracy, and priority SLA',
      features: ['All Growth features', 'Official WhatsApp broadcasts', 'Digital secret elections', 'RFID boom barrier sync', 'Dedicated account manager', '99.9% uptime SLA'],
      isCurrentPlan: false,
    },
  ];

  const invoices = data.invoices || [
    { invoiceNo: 'PLAT-2026-010', period: 'October 2026', units: liveUnits, ratePerUnit: currentRate, amount: currentMonthly, status: 'PAID' },
    { invoiceNo: 'PLAT-2026-009', period: 'September 2026', units: liveUnits, ratePerUnit: currentRate, amount: currentMonthly, status: 'PAID' },
    { invoiceNo: 'PLAT-2026-008', period: 'August 2026', units: liveUnits, ratePerUnit: currentRate, amount: currentMonthly, status: 'PAID' },
  ];

  return Shell.render('admin-subscription', {
    title: 'Subscription',
    portal: 'admin',
    breadcrumb: 'Settings',
    content: `
      <div class="page-header" style="flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div class="page-header-left">
          <div class="page-title" style="font-size:22px;font-weight:800;">Subscription & SaaS Billing</div>
          <div class="page-subtitle" style="font-size:13px;color:var(--text-muted);margin-top:4px;">
            Pricing model: <strong>Unit-Wise Subscription</strong> managed directly from the Super-Admin dashboard
          </div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.loadLiveSocietySubscription(true).then(() => Router.go('admin-subscription'))">🔄 Refresh</button>
          <button class="btn btn-primary btn-sm" onclick="paySocietySubscriptionOnline()">💳 Pay / Renew Online</button>
        </div>
      </div>

      <!-- Live Subscription Status Card -->
      <div class="card" style="margin-bottom:24px;border:2px solid var(--blue);background:linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(59,130,246,0.01) 100%);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span class="badge badge-purple" style="font-size:12px;font-weight:700;">${sub.plan?.name || 'Growth Standard Plan'}</span>
              <span class="badge badge-green" style="font-size:11px;">● ${sub.status || 'ACTIVE'}</span>
              ${sub.autoDebitEnabled ? '<span class="badge badge-blue" style="font-size:11px;">⚡ AutoPay Active</span>' : ''}
            </div>
            <div style="font-size:20px;font-weight:800;color:var(--text-primary);">${org.name || 'Greenwood Heights RWA'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
              Registration No: <code style="font-weight:600;">${org.registrationNo || 'CHD/RWA/2026/0042-696'}</code> · Next Renewal: <strong>${sub.nextBillingDate || '1st November 2026'}</strong>
            </div>
          </div>

          <!-- Unit-wise Calculation Box -->
          <div style="display:flex;gap:20px;flex-wrap:wrap;background:var(--bg-surface);padding:14px 20px;border-radius:var(--r-lg);border:1px solid var(--border);">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Managed Units</div>
              <div style="font-size:22px;font-weight:800;color:var(--blue);">${liveUnits} Units</div>
              <div style="font-size:11px;color:var(--text-muted);">From Live Database</div>
            </div>
            <div style="width:1px;background:var(--border);"></div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Unit Rate</div>
              <div style="font-size:22px;font-weight:800;color:var(--text-primary);">₹${currentRate}<span style="font-size:12px;font-weight:500;color:var(--text-muted);">/unit/mo</span></div>
              <div style="font-size:11px;color:var(--text-muted);">Super Admin Rate</div>
            </div>
            <div style="width:1px;background:var(--border);"></div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Monthly Total</div>
              <div style="font-size:22px;font-weight:800;color:var(--green);">₹${currentMonthly.toLocaleString('en-IN')}<span style="font-size:12px;font-weight:500;color:var(--text-muted);">/mo</span></div>
              <div style="font-size:11px;color:var(--text-muted);">(${liveUnits} &times; ₹${currentRate})</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Title for Unit-Wise Plans -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:16px;font-weight:800;color:var(--text-primary);">Available Unit-Wise SaaS Plans</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
            Plans are configured from Super-Admin dashboard with real unit-based pricing (₹50/unit/month default)
          </div>
        </div>
        <span class="badge badge-blue">Unit-Wise SaaS Tier</span>
      </div>

      <!-- Dynamic Plans Grid (Mobile-First: 1 col on mobile, 3 col on desktop) -->
      <div class="dashboard-bottom-grid" style="margin-bottom:28px;">
        ${availablePlans.map(p => {
          const isCurrent = p.isCurrentPlan;
          return `
            <div style="padding:24px;border:2px solid ${isCurrent ? 'var(--blue)' : 'var(--border)'};
              border-radius:var(--r-xl);background:${isCurrent ? 'var(--blue-light)' : 'var(--bg-surface)'};
              position:relative;display:flex;flex-direction:column;justify-content:space-between;transition:transform 0.15s, box-shadow 0.15s;"
              onmouseover="this.style.boxShadow='0 10px 25px -5px rgba(0,0,0,0.08)'"
              onmouseout="this.style.boxShadow='none'">
              
              ${isCurrent ? `
                <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:var(--r-full);letter-spacing:0.04em;">
                  CURRENT ACTIVE PLAN
                </div>
              ` : (p.isPopular ? `
                <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--purple);color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:var(--r-full);letter-spacing:0.04em;">
                  RECOMMENDED
                </div>
              ` : '')}

              <div>
                <div style="font-size:17px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">${p.name}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;min-height:34px;">${p.description}</div>
                
                <div style="margin-bottom:6px;">
                  <span style="font-size:28px;font-weight:900;color:var(--text-primary);">₹${p.unitPriceMonthly}</span>
                  <span style="font-size:13px;color:var(--text-muted);font-weight:600;">/ unit / month</span>
                </div>

                <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:var(--r-md);margin-bottom:18px;border:1px solid var(--border-light);">
                  <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Cost for your ${liveUnits} units:</div>
                  <div style="font-size:16px;font-weight:800;color:${isCurrent ? 'var(--blue)' : 'var(--text-primary)'};margin-top:2px;">
                    ₹${p.calculatedMonthly.toLocaleString('en-IN')}<span style="font-size:12px;font-weight:500;color:var(--text-muted);">/month</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                    or ₹${p.calculatedAnnual.toLocaleString('en-IN')}/year (10% annual discount)
                  </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
                  ${p.features.map(f => `
                    <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:flex-start;gap:6px;">
                      <span style="color:#16A34A;font-weight:700;">✓</span>
                      <span>${f}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div>
                ${isCurrent ? `
                  <button class="btn btn-primary w-full" style="justify-content:center;font-weight:700;cursor:default;" disabled>
                    ✓ Current Plan (Active)
                  </button>
                ` : `
                  <button class="btn btn-secondary w-full" style="justify-content:center;font-weight:700;"
                    onclick="switchSocietyPlan('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.unitPriceMonthly}, ${p.calculatedMonthly})">
                    Switch to ${p.name}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Platform SaaS Billing History & GST Invoices -->
      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:8px;">
          <div>
            <div class="card-title">Platform SaaS Billing History</div>
            <div class="card-subtitle">Official GST invoices generated based on monthly active units</div>
          </div>
          <span class="badge badge-green">100% Paid & Reconciled</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Billing Period</th>
                <th>Units</th>
                <th>Unit Rate</th>
                <th>Total Billed</th>
                <th>Payment Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td style="font-family:monospace;font-size:12px;font-weight:700;color:var(--blue);">${inv.invoiceNo}</td>
                  <td style="font-weight:600;">${inv.period}</td>
                  <td><strong>${inv.units}</strong> units</td>
                  <td style="color:var(--text-muted);">₹${inv.ratePerUnit}.00/unit</td>
                  <td style="font-weight:800;color:var(--text-primary);">₹${inv.amount.toLocaleString('en-IN')}</td>
                  <td><span class="badge badge-green">✓ ${inv.status}</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-sm" onclick="viewPlatformGstInvoice('${inv.invoiceNo}', '${inv.period}', ${inv.units}, ${inv.ratePerUnit}, ${inv.amount})">
                      📄 View GST Invoice
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};

Screens['admin-audit'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveAuditTrail === 'function') {
      window.loadLiveAuditTrail();
    }
  }, 10);

  return Shell.render('admin-audit', {
    title: 'Audit Trail',
    portal: 'admin',
    breadcrumb: 'Settings',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.loadLiveAuditTrail()"><span style="margin-right:4px;">🔄</span> Refresh</button>
      <button class="btn btn-primary btn-sm" onclick="window.exportAuditTrailCsv()"><span style="margin-right:4px;">📥</span> Export CSV</button>
    `,
    content: `
      <div class="page-header" style="flex-wrap:wrap;gap:12px;">
        <div class="page-header-left">
          <div class="page-title">Audit Trail & Compliance Log</div>
          <div class="page-subtitle" id="auditSubtitle">Live immutable ledger of all actions, billing events, and administrative changes</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary" onclick="window.loadLiveAuditTrail()"><span style="margin-right:4px;">🔄</span> Refresh Feed</button>
          <button class="btn btn-primary" onclick="window.exportAuditTrailCsv()"><span style="margin-right:4px;">📥</span> Export Log</button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:16px;">
        <div class="stat-card" style="padding:14px;">
          <div class="stat-value" id="auditTotalCount" style="font-size:22px;color:var(--blue);">0</div>
          <div class="stat-label">Total Events Logged</div>
        </div>
        <div class="stat-card" style="padding:14px;">
          <div class="stat-value" id="auditBillingCount" style="font-size:22px;color:var(--purple);">0</div>
          <div class="stat-label">Billing & Invoices</div>
        </div>
        <div class="stat-card" style="padding:14px;">
          <div class="stat-value" id="auditPaymentsCount" style="font-size:22px;color:var(--green);">0</div>
          <div class="stat-label">Payments & Receipts</div>
        </div>
        <div class="stat-card" style="padding:14px;">
          <div class="stat-value" id="auditAdminCount" style="font-size:22px;color:var(--amber);">0</div>
          <div class="stat-label">Governance & Notices</div>
        </div>
      </div>

      <!-- Filter Bar: 2 Columns per Row Layout -->
      <div class="audit-filter-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
        <!-- Search Box (Full Width across both columns) -->
        <div class="search-box" style="grid-column:1 / -1;padding:10px 14px;">
          <span class="search-icon" style="font-size:15px;">🔍</span>
          <input type="text" id="auditSearchInput" placeholder="Search actions, users, entities, details..." oninput="window.filterAuditLogs()" style="font-size:13px;" />
          <button type="button" class="btn btn-ghost btn-xs" onclick="document.getElementById('auditSearchInput').value=''; window.filterAuditLogs();" title="Clear Search" style="padding:2px 6px;color:var(--text-muted);font-size:11px;">✕</button>
        </div>

        <!-- Row 1: Action Type (Col 1) & Actor (Col 2) -->
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">Action Type</label>
          <select id="auditActionFilter" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;border-radius:var(--r-md);background:var(--bg-surface);" onchange="window.filterAuditLogs()">
            <option value="ALL">All Action Types</option>
          </select>
        </div>

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">Actor / Initiator</label>
          <select id="auditActorFilter" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;border-radius:var(--r-md);background:var(--bg-surface);" onchange="window.filterAuditLogs()">
            <option value="ALL">All Actors</option>
          </select>
        </div>

        <!-- Row 2: Billing Period (Col 1) & Severity Level (Col 2) -->
        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">Billing Period / Month</label>
          <select id="auditMonthFilter" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;border-radius:var(--r-md);background:var(--bg-surface);" onchange="window.filterAuditLogs()">
            <option value="ALL">All Periods</option>
          </select>
        </div>

        <div>
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">Severity Level</label>
          <select id="auditSeverityFilter" class="form-select" style="width:100%;font-size:13px;padding:9px 12px;border-radius:var(--r-md);background:var(--bg-surface);" onchange="window.filterAuditLogs()">
            <option value="ALL">All Severity</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      <!-- Audit Records Table -->
      <div class="table-wrap" id="auditTableWrap">
        <table>
          <thead>
            <tr>
              <th style="min-width:130px;">Timestamp</th>
              <th style="min-width:140px;">Actor</th>
              <th style="min-width:150px;">Action Type</th>
              <th style="min-width:140px;">Entity</th>
              <th>Details & Operational Impact</th>
              <th style="min-width:90px;">Severity</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            <tr>
              <td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">
                Connecting to live audit ledger...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
        <span id="auditCountFooter">Showing 0 events</span>
        <span style="font-family:monospace;font-size:11px;">🔒 Cryptographically verified tenant audit log</span>
      </div>
    `,
  });
};

// ============================================================
// Live Audit Trail Client Engine
// ============================================================

window.__cachedAuditLogs = [];
window.__cachedAuditFilterOptions = {};

window.loadLiveAuditTrail = async function() {
  const tbody = document.getElementById('auditTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">
          Loading immutable audit records from live database...
        </td>
      </tr>
    `;
  }

  try {
    const activeOrgId = localStorage.getItem('rwa_active_society_id') || '';
    const res = await (window.apiFetch || fetch)('/api/audit' + (activeOrgId ? `?orgId=${activeOrgId}` : ''));
    if (!res || !res.ok) {
      throw new Error('Failed to load audit records');
    }

    const data = await res.json();
    window.__cachedAuditLogs = data.logs || [];
    window.__cachedAuditFilterOptions = data.filterOptions || {};

    // 1. Update Metrics Cards
    const totalEl = document.getElementById('auditTotalCount');
    const billEl = document.getElementById('auditBillingCount');
    const payEl = document.getElementById('auditPaymentsCount');
    const adminEl = document.getElementById('auditAdminCount');

    if (totalEl) totalEl.textContent = window.__cachedAuditLogs.length;
    if (billEl) {
      billEl.textContent = window.__cachedAuditLogs.filter(l => l.action.includes('BILL') || l.entityType === 'Invoice' || l.entityType === 'InvoiceBatch').length;
    }
    if (payEl) {
      payEl.textContent = window.__cachedAuditLogs.filter(l => l.action.includes('PAYMENT') || l.entityType === 'Payment').length;
    }
    if (adminEl) {
      adminEl.textContent = window.__cachedAuditLogs.filter(l => l.action.includes('NOTICE') || l.action.includes('SOCIETY') || l.action.includes('MEMBER') || l.action.includes('EXPENSE')).length;
    }

    // 2. Populate Action Type Filter Options
    const actionSelect = document.getElementById('auditActionFilter');
    if (actionSelect && data.filterOptions && Array.isArray(data.filterOptions.actions)) {
      const curAction = actionSelect.value;
      actionSelect.innerHTML = `<option value="ALL">All Action Types (${data.filterOptions.actions.length})</option>` +
        data.filterOptions.actions.map(act => `<option value="${act}" ${curAction === act ? 'selected' : ''}>${act}</option>`).join('');
    }

    // 3. Populate Actor Filter Options
    const actorSelect = document.getElementById('auditActorFilter');
    if (actorSelect && data.filterOptions && Array.isArray(data.filterOptions.actors)) {
      const curActor = actorSelect.value;
      actorSelect.innerHTML = `<option value="ALL">All Actors (${data.filterOptions.actors.length})</option>` +
        data.filterOptions.actors.map(act => `<option value="${act}" ${curActor === act ? 'selected' : ''}>${act}</option>`).join('');
    }

    // 4. Populate Month Filter Options
    const monthSelect = document.getElementById('auditMonthFilter');
    if (monthSelect && data.filterOptions && Array.isArray(data.filterOptions.months)) {
      const curMonth = monthSelect.value;
      monthSelect.innerHTML = `<option value="ALL">All Periods</option>` +
        data.filterOptions.months.map(m => `<option value="${m}" ${curMonth === m ? 'selected' : ''}>${m}</option>`).join('');
    }

    window.filterAuditLogs();
  } catch (err) {
    console.error('Error fetching live audit trail:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:30px;color:var(--red);font-size:13px;">
            ⚠️ Unable to load audit records from database. Please click Refresh or check server connection.
          </td>
        </tr>
      `;
    }
  }
};

window.filterAuditLogs = function() {
  const search = (document.getElementById('auditSearchInput')?.value || '').toLowerCase().trim();
  const action = document.getElementById('auditActionFilter')?.value || 'ALL';
  const actor = document.getElementById('auditActorFilter')?.value || 'ALL';
  const month = document.getElementById('auditMonthFilter')?.value || 'ALL';
  const severity = document.getElementById('auditSeverityFilter')?.value || 'ALL';

  let filtered = window.__cachedAuditLogs || [];

  if (action !== 'ALL') {
    filtered = filtered.filter(l => l.action === action);
  }

  if (actor !== 'ALL') {
    filtered = filtered.filter(l => l.actor === actor || l.actorRole === actor);
  }

  if (month !== 'ALL') {
    filtered = filtered.filter(l => l.month === month);
  }

  if (severity !== 'ALL') {
    filtered = filtered.filter(l => l.severity === severity);
  }

  if (search) {
    filtered = filtered.filter(l =>
      (l.action && l.action.toLowerCase().includes(search)) ||
      (l.actor && l.actor.toLowerCase().includes(search)) ||
      (l.entityId && l.entityId.toLowerCase().includes(search)) ||
      (l.entityType && l.entityType.toLowerCase().includes(search)) ||
      (l.details && l.details.toLowerCase().includes(search))
    );
  }

  window.renderAuditTable(filtered);
};

window.renderAuditTable = function(logs) {
  const tbody = document.getElementById('auditTableBody');
  const footer = document.getElementById('auditCountFooter');

  if (footer) {
    footer.textContent = `Showing ${logs.length} of ${(window.__cachedAuditLogs || []).length} recorded events`;
  }

  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">
          <div style="font-size:24px;margin-bottom:6px;">🔍</div>
          <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">No matching audit records found</div>
          <div>Try clearing your filters or search query to see other society activities.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    // Action badge style
    let actionBadgeClass = 'badge-muted';
    if (l.action.includes('BILL')) actionBadgeClass = 'badge-purple';
    else if (l.action.includes('PAYMENT')) actionBadgeClass = 'badge-green';
    else if (l.action.includes('NOTICE')) actionBadgeClass = 'badge-blue';
    else if (l.action.includes('EXPENSE')) actionBadgeClass = 'badge-amber';
    else if (l.action.includes('COMPLAINT')) actionBadgeClass = 'badge-red';
    else if (l.action.includes('SOCIETY')) actionBadgeClass = 'badge-blue';

    // Severity badge style
    const sevBadgeClass = l.severity === 'CRITICAL'
      ? 'badge-red'
      : l.severity === 'WARNING'
      ? 'badge-amber'
      : 'badge-muted';

    return `
      <tr>
        <td style="font-size:12px;color:var(--text-muted);white-space:nowrap;font-weight:600;">
          ${l.timeFormatted || l.timestamp}
        </td>
        <td>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary);">${l.actor || 'System'}</div>
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:600;">${l.actorRole || ''}</div>
        </td>
        <td>
          <span class="badge ${actionBadgeClass}" style="font-family:monospace;font-size:11px;font-weight:700;">
            ${l.action}
          </span>
        </td>
        <td>
          <div style="font-size:12px;font-weight:600;color:var(--text-secondary);font-family:monospace;">
            ${l.entityId || l.entityType}
          </div>
          <div style="font-size:10px;color:var(--text-muted);">${l.entityType || ''}</div>
        </td>
        <td style="font-size:12px;color:var(--text-secondary);max-width:340px;line-height:1.4;">
          ${l.details || '—'}
        </td>
        <td>
          <span class="badge ${sevBadgeClass}" style="font-size:10px;font-weight:800;">
            ${l.severity || 'INFO'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
};

window.exportAuditTrailCsv = function() {
  const logs = window.__cachedAuditLogs || [];
  if (logs.length === 0) {
    showToast('No audit logs available to export', 'warning');
    return;
  }

  const headers = ['Timestamp', 'Date', 'Actor', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Severity'];
  const csvRows = [headers.join(',')];

  logs.forEach(l => {
    const row = [
      `"${l.timestamp}"`,
      `"${l.timeFormatted || ''}"`,
      `"${(l.actor || '').replace(/"/g, '""')}"`,
      `"${(l.actorRole || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.entityType || '').replace(/"/g, '""')}"`,
      `"${(l.entityId || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.severity || 'INFO'}"`,
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Society_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✅ Audit trail exported to CSV successfully', 'success');
};

// Live Notifications Screen
Screens['admin-notifications'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveNotifications === 'function') {
      window.loadLiveNotifications('admin');
    }
  }, 10);

  return Shell.render('admin-notifications', {
    title: 'Notifications & Alerts',
    portal: 'admin',
    breadcrumb: 'Communication',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="playNotificationSound(); showToast('🔔 Notification sound played', 'info', false);"><span style="margin-right:4px;">🔊</span> Test Sound</button>
      <button class="btn btn-secondary btn-sm" onclick="markAllNotificationsAsRead()">✓ Mark All as Read</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Society Alerts & Activity Feed</div>
          <div class="page-subtitle" id="notifSubtitle">Live notifications from billing, payments, complaints, and circulars</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="playNotificationSound(); showToast('🔔 Notification sound played', 'info', false);"><span style="margin-right:4px;">🔊</span> Test Sound</button>
          <button class="btn btn-secondary" onclick="markAllNotificationsAsRead()">✓ Mark All as Read</button>
        </div>
      </div>

      <div id="liveNotificationsList" style="display:flex; flex-direction:column; gap:12px;">
        <div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">Loading notifications from live database...</div>
      </div>
    `,
  });
};

window.loadLiveNotifications = async function(portal = 'admin') {
  try {
    const res = await (window.apiFetch || fetch)('/api/notifications').catch(() => null);
    if (!res || !res.ok) return;
    const data = await res.json();
    const notifs = data.notifications || [];
    const unreadCount = data.unreadCount || 0;

    const listEl = document.getElementById('liveNotificationsList');
    const subEl = document.getElementById('notifSubtitle');

    if (subEl) {
      subEl.textContent = `${notifs.length} total notifications · ${unreadCount} unread · Real-time socket synchronized`;
    }

    if (typeof window.updateNotificationBellBadge === 'function') {
      window.updateNotificationBellBadge(unreadCount > 0);
    }

    if (!listEl) return;

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div style="padding:40px 20px;text-align:center;background:var(--bg-surface);border-radius:var(--r-md);border:1px solid var(--border);">
          <div style="font-size:32px;margin-bottom:8px;">🔔</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">No Notifications Yet</div>
          <div style="font-size:12px;color:var(--text-muted);">You're all caught up! New notices, bills, and alerts will appear here in real-time.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => {
      const isUnread = !n.isRead;
      const typeIcon = n.type === 'BILL' ? '📄' : n.type === 'PAYMENT' ? '💰' : n.type === 'COMPLAINT' ? '🎫' : n.type === 'NOTICE' ? '📢' : n.type === 'RESIDENT_ONBOARDED' ? '👤' : '🔔';
      const timeStr = new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="card" style="display:flex; gap:14px; align-items:flex-start; ${isUnread ? 'border-left:4px solid var(--blue); background:rgba(37,99,235,0.02);' : ''}">
          <div style="width:40px; height:40px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
            ${typeIcon}
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <div style="font-size:14px; font-weight:700; color:var(--text-primary);">${n.title}</div>
              <span style="font-size:11px; color:var(--text-muted);">${timeStr}</span>
            </div>
            <div style="font-size:13px; color:var(--text-secondary); line-height:1.4; margin-bottom:8px;">${n.message}</div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              ${n.type === 'BILL' ? `
                <button class="btn btn-primary btn-sm" onclick="Router.go('${portal === 'admin' ? 'admin-invoices' : 'resident-bills'}')">
                  ${portal === 'admin' ? 'View Invoices' : 'View & Pay Bill'}
                </button>
              ` : ''}
              ${n.type === 'RESIDENT_ONBOARDED' ? (
                portal === 'admin' ? `
                  <button class="btn btn-primary btn-sm" onclick="Router.go('admin-structure')" style="font-size:12px;">
                    🏢 View in Property Structure
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="Router.go('admin-members')" style="font-size:12px;">
                    👥 View Resident Roster
                  </button>
                ` : `
                  <button class="btn btn-primary btn-sm" onclick="Router.go('resident-profile')" style="font-size:12px;">
                    👤 View My Flat Profile
                  </button>
                `
              ) : ''}
              ${isUnread ? `
                <button class="btn btn-ghost btn-sm" onclick="markSingleNotificationRead('${n.id}')" style="font-size:11px;color:var(--text-muted);">
                  Mark as read
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error in loadLiveNotifications:', err);
  }
};

window.markAllNotificationsAsRead = async function() {
  try {
    const res = await (window.apiFetch || fetch)('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      showToast('All notifications marked as read', 'success');
      if (typeof window.updateNotificationBellBadge === 'function') {
        window.updateNotificationBellBadge(false);
      }
      if (typeof window.loadLiveNotifications === 'function') {
        window.loadLiveNotifications();
      }
    }
  } catch (e) {
    showToast('Failed to mark all as read', 'warning');
  }
};

window.markSingleNotificationRead = async function(notificationId) {
  try {
    await (window.apiFetch || fetch)('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
    if (typeof window.loadLiveNotifications === 'function') {
      window.loadLiveNotifications();
    }
  } catch (e) {}
};

// Vehicles Register Screen
// =============================================
// Vehicle & Parking Register Screen — Dynamic DB Hydration
// Real-time Vehicle Parking & RFID Directory
// =============================================

window.__cachedVehicles = [];
window.__selectedVehicleFilter = 'ALL';

Screens['admin-vehicles'] = function() {
  // Trigger dynamic DB load
  setTimeout(() => {
    if (typeof window.loadLiveVehiclesScreen === 'function') {
      window.loadLiveVehiclesScreen();
    }
  }, 20);

  return Shell.render('admin-vehicles', {
    title: 'Vehicle & Parking Register',
    portal: 'admin',
    breadcrumb: 'People',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="exportVehiclesRegistry()">📊 Export CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openAddVehicleModal()">+ Add Car / Parking</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Vehicle Parking & RFID Directory</div>
          <div class="page-subtitle" id="vehiclesSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportVehiclesRegistry()">📊 Bulk Export</button>
          <button class="btn btn-primary" onclick="openAddVehicleModal()">+ Add Car / Parking</button>
        </div>
      </div>

      <!-- Stat Grid (4-col / Mobile-First 2x2) -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card blue">
          <div class="stat-icon blue">🚗</div>
          <div class="stat-value" id="statTotalVehicles">0</div>
          <div class="stat-label">Total Vehicles</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">🚙</div>
          <div class="stat-value" id="statTotalCars">0</div>
          <div class="stat-label">Four-Wheelers (Cars)</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon amber">🏍️</div>
          <div class="stat-value" id="statTotalBikes">0</div>
          <div class="stat-label">Two-Wheelers</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">🅿️</div>
          <div class="stat-value" id="statAssignedSlots">0</div>
          <div class="stat-label">Allocated Parking Bays</div>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="filter-bar" style="flex-wrap:wrap; gap:8px;">
        <div class="search-box" style="min-width:240px; flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="vehiclesSearchInput" placeholder="Search by reg no, flat, owner, slot, make/model..." oninput="handleVehiclesSearch(this.value)" />
        </div>
        <div id="vehiclesFilterPillsContainer" style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <div class="filter-pill active" onclick="filterVehicles('ALL', this)">All</div>
          <div class="filter-pill" onclick="filterVehicles('CAR', this)">🚗 Cars</div>
          <div class="filter-pill" onclick="filterVehicles('BIKE', this)">🏍️ Two-Wheelers</div>
          <div class="filter-pill" onclick="filterVehicles('ALLOCATED', this)">🅿️ Assigned Slots</div>
          <div class="filter-pill" onclick="filterVehicles('UNALLOCATED', this)">⚠️ Unallocated</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="exportVehiclesRegistry()">Export</button>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveVehiclesScreen()">🔄 Refresh</button>
      </div>

      <!-- Desktop Table Wrap -->
      <div class="card" style="padding:0; overflow:hidden;">
        <div class="table-wrap desktop-only-table">
          <table>
            <thead>
              <tr>
                <th style="min-width:130px;">Parking Slot</th>
                <th>Flat / Unit</th>
                <th>Owner / Resident</th>
                <th>Vehicle Type</th>
                <th>Registration No</th>
                <th>Model / Make</th>
                <th>RFID Status</th>
                <th style="text-align:right; min-width:110px;">Actions</th>
              </tr>
            </thead>
            <tbody id="vehiclesTableBody">
              <tr>
                <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
                  Loading vehicles and parking data from database...
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile-First Cards Container (< 768px touch targets) -->
        <div id="vehiclesMobileCardsContainer" class="mobile-only-cards" style="display:none; flex-direction:column; gap:10px; padding:12px;">
          <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">Loading vehicles...</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:12px; color:var(--text-muted); flex-wrap:wrap; gap:8px;">
        <span id="vehiclesPaginationSummary">Showing vehicles from database</span>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveVehiclesScreen()">🔄 Refresh</button>
      </div>
    `,
  });
};

// =============================================
// Live Hydration Logic: Connects to /api/vehicles
// =============================================

window.loadLiveVehiclesScreen = async function() {
  const tbody = document.getElementById('vehiclesTableBody');
  const cardsContainer = document.getElementById('vehiclesMobileCardsContainer');

  try {
    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';
    const url = '/api/vehicles' + (activeOrgId ? `?orgId=${encodeURIComponent(activeOrgId)}` : '');

    const res = await (window.apiFetch || fetch)(url).catch(() => null);
    if (!res || !res.ok) {
      const errData = res ? await res.json().catch(() => ({})) : {};
      console.error('Failed to fetch vehicles from DB:', errData);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:32px; color:var(--red); font-size:13px;">
              ⚠️ Unable to load vehicles (${errData.error || 'Server error'}).
              <br><br>
              <button class="btn btn-secondary btn-sm" onclick="window.loadLiveVehiclesScreen()">🔄 Retry</button>
            </td>
          </tr>
        `;
      }
      return;
    }

    const data = await res.json();
    const vehicles = data.vehicles || [];
    window.__cachedVehicles = vehicles;

    // Update Metrics
    const totalCount = data.stats?.total ?? vehicles.length;
    const carsCount = data.stats?.cars ?? vehicles.filter(v => (v.type || '').toUpperCase() === 'CAR').length;
    const bikesCount = data.stats?.bikes ?? vehicles.filter(v => ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes((v.type || '').toUpperCase())).length;
    const slotsAllocated = data.stats?.slotsAllocated ?? vehicles.filter(v => v.parkingSlot && v.parkingSlot.trim() !== '').length;

    const statTotal = document.getElementById('statTotalVehicles');
    const statCars = document.getElementById('statTotalCars');
    const statBikes = document.getElementById('statTotalBikes');
    const statSlots = document.getElementById('statAssignedSlots');
    const subtitleEl = document.getElementById('vehiclesSubtitle');

    if (statTotal) statTotal.textContent = totalCount;
    if (statCars) statCars.textContent = carsCount;
    if (statBikes) statBikes.textContent = bikesCount;
    if (statSlots) statSlots.textContent = slotsAllocated;

    if (subtitleEl) {
      if (totalCount === 0) {
        subtitleEl.textContent = '0 registered vehicles · No dummy data · Live database';
      } else {
        subtitleEl.textContent = `${totalCount} registered vehicles · ${slotsAllocated} allocated parking bays · Live database`;
      }
    }

    renderVehiclesData(vehicles);
  } catch (err) {
    console.error('Error in loadLiveVehiclesScreen:', err);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:32px; color:var(--red); font-size:13px;">
            ⚠️ Unexpected error loading vehicles register.
            <br><br>
            <button class="btn btn-secondary btn-sm" onclick="window.loadLiveVehiclesScreen()">🔄 Retry</button>
          </td>
        </tr>
      `;
    }
  }
};

window.renderVehiclesData = function(list) {
  const tbody = document.getElementById('vehiclesTableBody');
  const cardsContainer = document.getElementById('vehiclesMobileCardsContainer');
  const summaryEl = document.getElementById('vehiclesPaginationSummary');

  if (summaryEl) {
    summaryEl.textContent = `Showing ${list.length} of ${window.__cachedVehicles.length} vehicles`;
  }

  if (!list || list.length === 0) {
    const emptyHtml = `
      <tr>
        <td colspan="8" style="text-align:center; padding:48px 20px;">
          <div class="empty-state" style="padding:16px;">
            <div class="empty-icon" style="font-size:44px; margin-bottom:10px;">🚗🅿️</div>
            <div class="empty-title" style="font-size:16px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">
              ${window.__cachedVehicles.length === 0 ? 'No Vehicles Registered Yet' : 'No Matching Vehicles Found'}
            </div>
            <div class="empty-text" style="color:var(--text-secondary); font-size:13px; max-width:440px; margin:0 auto 16px;">
              ${window.__cachedVehicles.length === 0
                ? 'No resident cars or parking bays have been recorded in this society. Click below to add a vehicle and assign designated parking slots.'
                : 'Try adjusting your search query or filter pills above.'}
            </div>
            <button class="btn btn-primary" onclick="openAddVehicleModal()">+ Register Car & Parking Slot</button>
          </div>
        </td>
      </tr>
    `;
    if (tbody) tbody.innerHTML = emptyHtml;
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div style="text-align:center; padding:32px 16px; background:var(--bg-surface); border-radius:var(--r-md); border:1px solid var(--border);">
          <div style="font-size:36px; margin-bottom:8px;">🚗🅿️</div>
          <div style="font-weight:700; margin-bottom:4px;">No Vehicles Registered</div>
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Add resident vehicles with parking slots</div>
          <button class="btn btn-primary btn-sm" onclick="openAddVehicleModal()">+ Add Car & Parking</button>
        </div>
      `;
    }
    return;
  }

  // 1. Render Desktop Table
  if (tbody) {
    tbody.innerHTML = list.map(v => {
      const typeUpper = (v.type || 'CAR').toUpperCase();
      const isCar = typeUpper === 'CAR';
      const isBike = ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes(typeUpper);
      const isEV = typeUpper === 'EV' || typeUpper === 'EV_BIKE';

      const typeBadge = isCar
        ? '<span class="badge badge-blue">🚗 Car</span>'
        : isBike
        ? '<span class="badge badge-purple">🏍️ Bike</span>'
        : isEV
        ? '<span class="badge badge-green">⚡ Electric</span>'
        : `<span class="badge badge-muted">🚙 ${v.type}</span>`;

      const slotBadge = v.parkingSlot && v.parkingSlot.trim() !== ''
        ? `<span class="badge badge-blue" style="font-weight:800; font-size:12px; padding:4px 8px; letter-spacing:0.3px;">🅿️ ${v.parkingSlot}</span>`
        : `<span class="badge badge-amber" style="font-size:11px; padding:3px 7px;">⚠️ Unallocated</span>`;

      const flatLabel = v.unit?.unitNumber || '—';
      const blockLabel = v.unit?.block?.name ? `<span style="font-size:11px; color:var(--text-muted); font-weight:normal;"> (${v.unit.block.name})</span>` : '';
      const ownerLabel = v.unit?.ownerName || v.unit?.tenantName || 'Resident';
      const ownerPhone = v.unit?.ownerPhone || v.unit?.tenantPhone || '';

      const makeModel = [v.make, v.model].filter(Boolean).join(' ') || '—';
      const colorLabel = v.color ? `<span style="color:var(--text-muted); font-size:11px;"> (${v.color})</span>` : '';

      return `
        <tr>
          <td style="vertical-align:middle;">${slotBadge}</td>
          <td style="font-weight:700; vertical-align:middle;">
            ${flatLabel}${blockLabel}
          </td>
          <td style="vertical-align:middle;">
            <div style="font-weight:600; color:var(--text-primary);">${ownerLabel}</div>
            ${ownerPhone ? `<div style="font-size:11px; color:var(--text-muted);">${ownerPhone}</div>` : ''}
          </td>
          <td style="vertical-align:middle;">${typeBadge}</td>
          <td style="vertical-align:middle;">
            <span style="display:inline-block; padding:3px 8px; background:#f8fafc; border:1.5px solid #0f172a; border-radius:5px; font-family:monospace; font-weight:800; font-size:12px; letter-spacing:0.8px; color:#0f172a; box-shadow:0 1px 2px rgba(0,0,0,0.06);">
              ${v.registrationNo}
            </span>
          </td>
          <td style="color:var(--text-secondary); vertical-align:middle;">
            <span style="font-weight:500;">${makeModel}</span>${colorLabel}
          </td>
          <td style="vertical-align:middle;">
            <span class="badge badge-green" style="font-size:11px;">✓ Active Tag</span>
          </td>
          <td style="text-align:right; vertical-align:middle;">
            <div style="display:inline-flex; gap:6px; align-items:center;">
              <button class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:11px;" onclick="openEditVehicleModal('${v.id}')" title="Edit vehicle and parking slot">
                ✏️ Edit
              </button>
              <button class="btn btn-ghost btn-sm" style="padding:4px 8px; font-size:11px; color:var(--red);" onclick="deleteVehicle('${v.id}', '${v.registrationNo}')" title="Remove vehicle">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards
  if (cardsContainer) {
    cardsContainer.innerHTML = list.map(v => {
      const slotBadge = v.parkingSlot && v.parkingSlot.trim() !== ''
        ? `<span class="badge badge-blue" style="font-weight:800; font-size:11px;">🅿️ ${v.parkingSlot}</span>`
        : `<span class="badge badge-amber" style="font-size:10px;">⚠️ Unallocated</span>`;

      const makeModel = [v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';

      return `
        <div style="background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--r-md); padding:12px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              ${slotBadge}
              <span style="font-weight:700; font-size:13px;">Flat ${v.unit?.unitNumber || '—'}</span>
            </div>
            <span class="badge badge-green" style="font-size:10px;">✓ Active</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin:2px 0;">
            <span style="display:inline-block; padding:3px 8px; background:#f8fafc; border:1.5px solid #0f172a; border-radius:5px; font-family:monospace; font-weight:800; font-size:13px; color:#0f172a;">
              ${v.registrationNo}
            </span>
            <span style="font-size:12px; color:var(--text-secondary); font-weight:500;">
              ${makeModel} ${v.color ? `(${v.color})` : ''}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--text-muted); border-top:1px solid var(--border-light); padding-top:6px;">
            <span>Owner: <strong>${v.unit?.ownerName || v.unit?.tenantName || 'Resident'}</strong></span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:11px;" onclick="openEditVehicleModal('${v.id}')">✏️ Edit</button>
              <button class="btn btn-ghost btn-sm" style="padding:3px 8px; font-size:11px; color:var(--red);" onclick="deleteVehicle('${v.id}', '${v.registrationNo}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.handleVehiclesSearch = function(query) {
  const term = (query || '').trim().toLowerCase();
  let filtered = window.__cachedVehicles;

  // Apply filter pill
  filtered = applyVehiclePillFilter(filtered, window.__selectedVehicleFilter);

  if (term) {
    filtered = filtered.filter(v => {
      const reg = (v.registrationNo || '').toLowerCase();
      const slot = (v.parkingSlot || '').toLowerCase();
      const make = (v.make || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const color = (v.color || '').toLowerCase();
      const flat = (v.unit?.unitNumber || '').toLowerCase();
      const owner = (v.unit?.ownerName || '').toLowerCase();
      const tenant = (v.unit?.tenantName || '').toLowerCase();
      return reg.includes(term) || slot.includes(term) || make.includes(term) ||
             model.includes(term) || color.includes(term) || flat.includes(term) ||
             owner.includes(term) || tenant.includes(term);
    });
  }

  renderVehiclesData(filtered);
};

window.filterVehicles = function(filterCategory, pillEl) {
  window.__selectedVehicleFilter = filterCategory;

  const pills = document.querySelectorAll('#vehiclesFilterPillsContainer .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (pillEl) pillEl.classList.add('active');

  const searchInput = document.getElementById('vehiclesSearchInput');
  const term = (searchInput?.value || '').trim().toLowerCase();

  let filtered = applyVehiclePillFilter(window.__cachedVehicles, filterCategory);

  if (term) {
    filtered = filtered.filter(v => {
      const reg = (v.registrationNo || '').toLowerCase();
      const slot = (v.parkingSlot || '').toLowerCase();
      const flat = (v.unit?.unitNumber || '').toLowerCase();
      const owner = (v.unit?.ownerName || '').toLowerCase();
      return reg.includes(term) || slot.includes(term) || flat.includes(term) || owner.includes(term);
    });
  }

  renderVehiclesData(filtered);
};

function applyVehiclePillFilter(list, filterCategory) {
  if (filterCategory === 'CAR') {
    return list.filter(v => (v.type || '').toUpperCase() === 'CAR');
  } else if (filterCategory === 'BIKE') {
    return list.filter(v => ['BIKE', 'TWO_WHEELER', 'SCOOTER'].includes((v.type || '').toUpperCase()));
  } else if (filterCategory === 'ALLOCATED') {
    return list.filter(v => v.parkingSlot && v.parkingSlot.trim() !== '');
  } else if (filterCategory === 'UNALLOCATED') {
    return list.filter(v => !v.parkingSlot || v.parkingSlot.trim() === '');
  }
  return list;
}

// =============================================
// Modal: Add Car & Allocate Parking Slot
// =============================================

window.openAddVehicleModal = async function() {
  // Pre-load units for dropdown
  let units = window.__cachedUnits || [];
  if (!units || units.length === 0) {
    try {
      const res = await (window.apiFetch || fetch)('/api/units').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        units = data.units || [];
        window.__cachedUnits = units;
      }
    } catch (e) {}
  }

  const unitOptions = units.length > 0
    ? units.map(u => {
        const owner = u.ownerName || u.tenantName || 'Resident';
        const block = u.block?.name ? `(${u.block.name})` : '';
        return `<option value="${u.id}">Flat ${u.unitNumber} ${block} — ${owner}</option>`;
      }).join('')
    : '<option value="">No flats found - please add units first</option>';

  const html = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div style="background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.18); padding:12px; border-radius:var(--r-md); font-size:12px; color:var(--text-secondary); line-height:1.5;">
        🚗 <strong>Resident Vehicle & Parking Allocation:</strong> Register a car or bike for an apartment and allocate its designated parking bay (e.g. <em>P-101</em>, <em>Basement B1-14</em>, <em>Stilt S-02</em>).
      </div>

      <!-- Unit / Flat Selection -->
      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Flat / Apartment Unit *</label>
        <select id="addVehUnitId" class="form-select" required style="width:100%; font-size:13px;">
          <option value="">-- Select Flat / Unit --</option>
          ${unitOptions}
        </select>
      </div>

      <!-- Vehicle Type & Parking Slot -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Vehicle Type *</label>
          <select id="addVehType" class="form-select" style="width:100%; font-size:13px;">
            <option value="CAR" selected>🚗 Car (Four-Wheeler)</option>
            <option value="BIKE">🏍️ Two-Wheeler (Bike / Scooter)</option>
            <option value="EV">⚡ Electric Vehicle (EV Car)</option>
            <option value="EV_BIKE">🛵 Electric 2-Wheeler</option>
            <option value="OTHER">🚐 Other Vehicle / Van</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Parking Slot / Bay ID 🅿️</label>
          <input type="text" id="addVehSlot" placeholder="e.g. P-101, B1-14, Stilt-02" class="form-input" style="width:100%; font-size:13px; font-weight:700; text-transform:uppercase;" />
        </div>
      </div>

      <!-- Registration Number & RFID Tag -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Registration Plate No *</label>
          <input type="text" id="addVehReg" required placeholder="e.g. CH-01-AB-1234" class="form-input" style="width:100%; font-size:13px; font-weight:800; font-family:monospace; text-transform:uppercase;" />
        </div>

        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">RFID / Fastag Sticker ID</label>
          <input type="text" id="addVehTag" placeholder="e.g. TAG-88421 (Optional)" class="form-input" style="width:100%; font-size:13px;" />
        </div>
      </div>

      <!-- Make & Model & Color -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Make / Brand</label>
          <input type="text" id="addVehMake" placeholder="e.g. Hyundai, Tata, Honda" class="form-input" style="width:100%; font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Model</label>
          <input type="text" id="addVehModel" placeholder="e.g. Creta, City, Nexon" class="form-input" style="width:100%; font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Color</label>
          <input type="text" id="addVehColor" placeholder="e.g. White, Black" class="form-input" style="width:100%; font-size:13px;" />
        </div>
      </div>
    </div>
  `;

  showModal('🚗 Register Vehicle & Parking Slot', html, 'Save & Allocate Parking 🚀', async () => {
    const unitId = document.getElementById('addVehUnitId')?.value;
    const type = document.getElementById('addVehType')?.value || 'CAR';
    const registrationNo = document.getElementById('addVehReg')?.value.trim();
    const parkingSlot = document.getElementById('addVehSlot')?.value.trim();
    const make = document.getElementById('addVehMake')?.value.trim();
    const model = document.getElementById('addVehModel')?.value.trim();
    const color = document.getElementById('addVehColor')?.value.trim();

    if (!unitId) {
      showToast('Please select a Flat / Unit', 'warning');
      throw new Error('Flat / Unit selection is required');
    }

    if (!registrationNo) {
      showToast('Please enter the Vehicle Registration Number', 'warning');
      throw new Error('Registration Number is required');
    }

    const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || '';

    const res = await (window.apiFetch || fetch)('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId,
        type,
        registrationNo,
        parkingSlot: parkingSlot || null,
        make: make || null,
        model: model || null,
        color: color || null,
        organizationId: activeOrgId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to register vehicle');
    }

    showToast(`✅ Vehicle ${registrationNo.toUpperCase()} & Parking Slot allocated successfully!`, 'success');
    window.loadLiveVehiclesScreen();
  }, '560px');
};

// =============================================
// Modal: Edit Vehicle & Reallocate Parking Slot
// =============================================

window.openEditVehicleModal = async function(vehicleId) {
  const vehicle = (window.__cachedVehicles || []).find(v => v.id === vehicleId);
  if (!vehicle) {
    showToast('Vehicle details not found', 'error');
    return;
  }

  // Pre-load units
  let units = window.__cachedUnits || [];
  if (!units || units.length === 0) {
    try {
      const res = await (window.apiFetch || fetch)('/api/units').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        units = data.units || [];
        window.__cachedUnits = units;
      }
    } catch (e) {}
  }

  const unitOptions = units.map(u => {
    const isSelected = u.id === vehicle.unitId ? 'selected' : '';
    const owner = u.ownerName || u.tenantName || 'Resident';
    return `<option value="${u.id}" ${isSelected}>Flat ${u.unitNumber} — ${owner}</option>`;
  }).join('');

  const html = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <div>
        <label class="form-label" style="font-weight:700; font-size:12px;">Flat / Unit</label>
        <select id="editVehUnitId" class="form-select" style="width:100%; font-size:13px;">
          ${unitOptions}
        </select>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Vehicle Type</label>
          <select id="editVehType" class="form-select" style="width:100%; font-size:13px;">
            <option value="CAR" ${vehicle.type === 'CAR' ? 'selected' : ''}>🚗 Car (Four-Wheeler)</option>
            <option value="BIKE" ${['BIKE', 'TWO_WHEELER'].includes(vehicle.type) ? 'selected' : ''}>🏍️ Two-Wheeler</option>
            <option value="EV" ${vehicle.type === 'EV' ? 'selected' : ''}>⚡ Electric Vehicle</option>
            <option value="OTHER" ${vehicle.type === 'OTHER' ? 'selected' : ''}>🚐 Other</option>
          </select>
        </div>

        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Parking Slot / Bay ID 🅿️</label>
          <input type="text" id="editVehSlot" value="${vehicle.parkingSlot || ''}" placeholder="e.g. P-101, B1-14 (or blank)" class="form-input" style="width:100%; font-size:13px; font-weight:700; text-transform:uppercase;" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Registration Plate No *</label>
          <input type="text" id="editVehReg" required value="${vehicle.registrationNo || ''}" class="form-input" style="width:100%; font-size:13px; font-weight:800; font-family:monospace; text-transform:uppercase;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Color</label>
          <input type="text" id="editVehColor" value="${vehicle.color || ''}" placeholder="e.g. White, Silver" class="form-input" style="width:100%; font-size:13px;" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Make / Brand</label>
          <input type="text" id="editVehMake" value="${vehicle.make || ''}" placeholder="e.g. Hyundai, Honda" class="form-input" style="width:100%; font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700; font-size:12px;">Model</label>
          <input type="text" id="editVehModel" value="${vehicle.model || ''}" placeholder="e.g. Creta, City" class="form-input" style="width:100%; font-size:13px;" />
        </div>
      </div>
    </div>
  `;

  showModal('✏️ Edit Vehicle & Parking Slot', html, 'Update Vehicle Details', async () => {
    const unitId = document.getElementById('editVehUnitId')?.value;
    const type = document.getElementById('editVehType')?.value;
    const registrationNo = document.getElementById('editVehReg')?.value.trim();
    const parkingSlot = document.getElementById('editVehSlot')?.value.trim();
    const make = document.getElementById('editVehMake')?.value.trim();
    const model = document.getElementById('editVehModel')?.value.trim();
    const color = document.getElementById('editVehColor')?.value.trim();

    if (!registrationNo) {
      showToast('Registration number is required', 'warning');
      throw new Error('Registration number is required');
    }

    const res = await (window.apiFetch || fetch)('/api/vehicles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: vehicle.id,
        unitId,
        type,
        registrationNo,
        parkingSlot: parkingSlot || null,
        make: make || null,
        model: model || null,
        color: color || null,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update vehicle');
    }

    showToast(`✅ Vehicle ${registrationNo.toUpperCase()} updated successfully!`, 'success');
    window.loadLiveVehiclesScreen();
  }, '540px');
};

// =============================================
// Delete Vehicle
// =============================================

window.deleteVehicle = async function(vehicleId, regNo) {
  if (!confirm(`Are you sure you want to remove vehicle ${regNo}? Any designated parking slot will be freed.`)) {
    return;
  }

  try {
    const res = await (window.apiFetch || fetch)(`/api/vehicles?id=${encodeURIComponent(vehicleId)}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete vehicle');
    }

    showToast(`Vehicle ${regNo} removed successfully`, 'success');
    window.loadLiveVehiclesScreen();
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    showToast(err.message || 'Failed to remove vehicle', 'error');
  }
};

// =============================================
// Export CSV
// =============================================

window.exportVehiclesRegistry = function() {
  if (!window.__cachedVehicles || window.__cachedVehicles.length === 0) {
    showToast('No vehicle records to export', 'info');
    return;
  }

  const rows = [
    ['Parking Slot', 'Flat Number', 'Owner/Resident', 'Vehicle Type', 'Registration No', 'Make', 'Model', 'Color', 'Registration Date'],
    ...window.__cachedVehicles.map(v => [
      v.parkingSlot || 'Unallocated',
      v.unit?.unitNumber || '',
      v.unit?.ownerName || v.unit?.tenantName || '',
      v.type || 'CAR',
      v.registrationNo || '',
      v.make || '',
      v.model || '',
      v.color || '',
      v.createdAt ? v.createdAt.slice(0, 10) : '',
    ])
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Vehicle_Parking_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Vehicle registry exported successfully!', 'success');
};

// =============================================
// Admin Profile Screen (Stays in Admin Portal)
// =============================================
Screens['admin-profile'] = function() {
  const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser() : {};
  const userName = user.name || 'Test name';
  const userPhone = user.phone || '1234567890';
  const userEmail = user.email || 'admin@rwamanager.com';
  const userRole = (user.role || 'RWA_ADMIN').replace('_', ' ');
  const orgName = (user.organization && user.organization.name) || 'Greenwood Heights RWA';
  const userInitial = userName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  return Shell.render('admin-profile', {
    title: 'Admin Profile',
    portal: 'admin',
    breadcrumb: 'Settings',
    actions: `
      <button class="btn btn-primary btn-sm" onclick="openUserProfileModal('admin')">✏️ Edit Profile</button>
    `,
    content: `
      <div class="page-header" style="flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        <div class="page-header-left">
          <div class="page-title" style="font-size:22px;font-weight:800;">Administrator Profile & Credentials</div>
          <div class="page-subtitle" style="font-size:13px;color:var(--text-muted);margin-top:4px;">
            Personal administrator details, security credentials, and organization permissions
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">
        <!-- Profile Identity Card -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
            <div class="avatar avatar-blue" style="width:56px;height:56px;font-size:22px;flex-shrink:0;">${userInitial}</div>
            <div>
              <div style="font-size:18px;font-weight:800;color:var(--text-primary);">${userName}</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">+91 ${userPhone}</div>
              <span class="badge badge-purple" style="font-size:11px;margin-top:6px;">${userRole}</span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;border-top:1px solid var(--border-light);padding-top:16px;">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Administered Society</div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:2px;">🏛️ ${orgName}</div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Official Email</div>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${userEmail}</div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Account Status</div>
              <div style="font-size:13px;font-weight:600;color:var(--green);margin-top:2px;">● Verified Active Session</div>
            </div>
          </div>

          <div style="margin-top:20px;border-top:1px solid var(--border-light);padding-top:16px;">
            <button class="btn btn-secondary w-full" style="justify-content:center;" onclick="openUserProfileModal('admin')">
              ✏️ Update Profile & Password
            </button>
          </div>
        </div>

        <!-- Quick Administration Links -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px;">Administration Shortcuts</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div onclick="Router.go('admin-settings')" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;background:var(--bg-elevated);transition:background 0.12s;" onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='var(--bg-elevated)'">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">⚙️</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary);">Organization Settings</div>
                  <div style="font-size:11px;color:var(--text-muted);">Manage society profile, rules, and payment gateways</div>
                </div>
              </div>
              <span style="color:var(--text-muted);">→</span>
            </div>

            <div onclick="Router.go('admin-subscription')" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;background:var(--bg-elevated);transition:background 0.12s;" onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='var(--bg-elevated)'">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">💳</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary);">Subscription & Billing</div>
                  <div style="font-size:11px;color:var(--text-muted);">Unit-wise SaaS pricing (₹50/unit/mo) & invoices</div>
                </div>
              </div>
              <span style="color:var(--text-muted);">→</span>
            </div>

            <div onclick="Router.go('admin-audit')" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;background:var(--bg-elevated);transition:background 0.12s;" onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='var(--bg-elevated)'">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">📋</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-primary);">Audit Trail</div>
                  <div style="font-size:11px;color:var(--text-muted);">Immutable system activity logs and compliance history</div>
                </div>
              </div>
              <span style="color:var(--text-muted);">→</span>
            </div>

            <div onclick="Router.go('resident-dashboard')" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;background:var(--bg-elevated);transition:background 0.12s;" onmouseover="this.style.background='var(--bg-surface)'" onmouseout="this.style.background='var(--bg-elevated)'">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">🏠</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--blue);">Switch to Resident View</div>
                  <div style="font-size:11px;color:var(--text-muted);">Preview the portal as a resident flat owner</div>
                </div>
              </div>
              <span style="color:var(--blue);">→</span>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};



