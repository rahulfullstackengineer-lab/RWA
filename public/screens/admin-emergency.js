// =============================================
// Society Emergency Contacts & SOS Management
// Production Live Version with Database Persistence
// =============================================

window._emergencyContactsData = window._emergencyContactsData || [];
window._emergencyMetrics = window._emergencyMetrics || {
  total: 0,
  committee: 0,
  security: 0,
  maintenance: 0,
  medical: 0,
  policeFire: 0,
};
window._emergencyActiveCategory = window._emergencyActiveCategory || 'ALL';
window._emergencySearchQuery = window._emergencySearchQuery || '';
window._emergencyLoading = false;

window.loadLiveEmergencyContacts = async function(forceRefresh = false) {
  if (window._emergencyLoading && !forceRefresh) return;
  window._emergencyLoading = true;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/emergency/contacts');
    if (res.ok) {
      const data = await res.json();
      if (data && data.contacts) {
        window._emergencyContactsData = data.contacts;
        window._emergencyMetrics = data.metrics || {
          total: data.contacts.length,
          committee: data.contacts.filter(c => c.category === 'COMMITTEE').length,
          security: data.contacts.filter(c => c.category === 'SECURITY').length,
          maintenance: data.contacts.filter(c => c.category === 'MAINTENANCE').length,
          medical: data.contacts.filter(c => c.category === 'MEDICAL').length,
          policeFire: data.contacts.filter(c => c.category === 'POLICE_FIRE').length,
        };
        window.renderEmergencyStatsCards();
        window.renderEmergencyContactsList();
      }
    }
  } catch (err) {
    console.error('Error loading live emergency contacts:', err);
  } finally {
    window._emergencyLoading = false;
  }
};

window.renderEmergencyStatsCards = function() {
  const m = window._emergencyMetrics || {};
  const cTotal = document.getElementById('emStatTotal');
  const cComm = document.getElementById('emStatCommittee');
  const cSec = document.getElementById('emStatSecurity');
  const c24x7 = document.getElementById('emStat24x7');

  if (cTotal) cTotal.innerText = m.total || window._emergencyContactsData.length || 0;
  if (cComm) cComm.innerText = m.committee || 0;
  if (cSec) cSec.innerText = m.security || 0;
  if (c24x7) {
    const roundClock = (window._emergencyContactsData || []).filter(c => (c.availableHours || '').toLowerCase().includes('24')).length;
    c24x7.innerText = roundClock || (m.medical + m.policeFire + m.security) || 0;
  }
};

window.setEmergencyCategoryFilter = function(cat) {
  window._emergencyActiveCategory = cat;
  document.querySelectorAll('.em-cat-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
  });
  window.renderEmergencyContactsList();
};

window.handleEmergencySearch = function(query) {
  window._emergencySearchQuery = (query || '').toLowerCase().trim();
  window.renderEmergencyContactsList();
};

window.getCategoryBadgeInfo = function(cat) {
  switch (cat) {
    case 'COMMITTEE':
      return { label: 'Managing Committee', color: '#1D4ED8', bg: '#EFF6FF', border: '#DBEAFE', icon: '🏛️' };
    case 'SECURITY':
      return { label: 'Campus Security', color: '#4338CA', bg: '#EEF2FF', border: '#E0E7FF', icon: '🛡️' };
    case 'MAINTENANCE':
      return { label: 'Maintenance AMC', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: '⚡' };
    case 'MEDICAL':
      return { label: 'Medical Ambulance', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', icon: '🚑' };
    case 'POLICE_FIRE':
      return { label: 'Police & Fire Rescue', color: '#C2410C', bg: '#FFF7ED', border: '#FFEDD5', icon: '🚓' };
    default:
      return { label: 'Essential Services', color: '#0F766E', bg: '#F0FDFA', border: '#CCFBF1', icon: '📞' };
  }
};

window.renderEmergencyContactsList = function() {
  const container = document.getElementById('emergencyContactsTbody');
  if (!container) return;

  let list = window._emergencyContactsData || [];
  const activeCat = window._emergencyActiveCategory || 'ALL';
  const query = window._emergencySearchQuery || '';

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

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:48px 16px;color:#64748B;">
          <div style="font-size:32px;margin-bottom:8px;">🚨</div>
          <div style="font-weight:700;font-size:15px;color:#0F172A;">No Emergency Contacts Found</div>
          <div style="font-size:12.5px;color:#64748B;margin-top:4px;max-width:320px;margin-left:auto;margin-right:auto;">
            ${query ? 'No contacts match your search query.' : 'Click "+ Add Emergency Contact" or "Sync Committee Members" to initialize.'}
          </div>
          ${!query ? `
            <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;">
              <button class="btn btn-primary btn-sm" onclick="window.openAddEmergencyContactModal()">+ Add Contact</button>
              <button class="btn btn-secondary btn-sm" onclick="window.syncCommitteeEmergencyContacts()">🔄 Sync Committee Roster</button>
            </div>
          ` : ''}
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = list.map((c, idx) => {
    const badge = window.getCategoryBadgeInfo(c.category);
    const isPriority = c.isPriority;

    return `
      <tr style="${isPriority ? 'background:rgba(254,242,242,0.4);' : ''}">
        <td style="width:40px;text-align:center;font-weight:700;color:#64748B;">
          ${isPriority ? '<span title="Urgent High Priority Contact" style="color:#DC2626;font-size:15px;">★</span>' : (idx + 1)}
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:10px;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
              ${badge.icon}
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0F172A;display:flex;align-items:center;gap:6px;">
                <span>${c.name}</span>
                ${isPriority ? '<span style="font-size:10px;background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;padding:1px 6px;border-radius:4px;font-weight:700;">PRIORITY</span>' : ''}
              </div>
              <div style="font-size:11.5px;color:#64748B;margin-top:1px;font-weight:500;">
                ${c.role}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${badge.color};background:${badge.bg};border:1px solid ${badge.border};padding:3px 9px;border-radius:7px;">
            ${badge.icon} ${badge.label}
          </span>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <a href="tel:${c.phone}" style="font-size:13px;font-weight:700;color:#2563EB;text-decoration:none;display:inline-flex;align-items:center;gap:5px;">
              <span>📞</span> ${c.phone}
            </a>
            ${c.altPhone ? `
              <span style="font-size:11px;color:#64748B;font-family:monospace;font-weight:600;">
                Alt: ${c.altPhone}
              </span>
            ` : ''}
          </div>
        </td>
        <td>
          <div style="font-size:12px;font-weight:600;color:#334155;">
            📍 ${c.unit || 'Society Campus'}
          </div>
          ${c.email ? `<div style="font-size:10.5px;color:#64748B;">✉️ ${c.email}</div>` : ''}
        </td>
        <td>
          <span style="font-size:11px;font-weight:600;color:#0F766E;background:#F0FDFA;border:1px solid #CCFBF1;padding:2px 8px;border-radius:6px;display:inline-block;">
            ⏱️ ${c.availableHours || '24x7'}
          </span>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex;gap:6px;align-items:center;">
            <a href="tel:${c.phone}" class="btn btn-secondary btn-xs" style="padding:4px 8px;font-size:11px;" title="Test Call">
              📞 Call
            </a>
            <button class="btn btn-secondary btn-xs" style="padding:4px 8px;font-size:11px;" onclick="window.openEditEmergencyContactModal('${c.id}')" title="Edit Contact Details">
              ✏️ Edit
            </button>
            <button class="btn btn-ghost btn-xs" style="padding:4px 8px;font-size:11px;color:#DC2626;" onclick="window.deleteEmergencyContact('${c.id}', '${(c.name || '').replace(/'/g, "\\'")}')" title="Delete Contact">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.openAddEmergencyContactModal = function() {
  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Contact Name / Entity *</label>
        <input type="text" id="emInputName" class="form-input" placeholder="e.g. Rajesh Kumar (President) or Main Gate Desk" required style="width:100%;font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Role / Designation *</label>
          <input type="text" id="emInputRole" class="form-input" placeholder="e.g. RWA President or Head Guard" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Category *</label>
          <select id="emInputCategory" class="form-select" style="width:100%;font-size:13px;">
            <option value="COMMITTEE">🏛️ Managing Committee</option>
            <option value="SECURITY">🛡️ Campus Security & Gates</option>
            <option value="MAINTENANCE">⚡ Maintenance & Technicians</option>
            <option value="MEDICAL">🚑 Medical & Hospital</option>
            <option value="POLICE_FIRE">🚓 Police & Fire Rescue</option>
            <option value="SERVICES">📞 Essential Services</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Primary Phone Number *</label>
          <input type="tel" id="emInputPhone" class="form-input" placeholder="e.g. 9876543210 or 108" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Intercom / Extension</label>
          <input type="text" id="emInputAltPhone" class="form-input" placeholder="e.g. Ext 101" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Unit / Campus Post</label>
          <input type="text" id="emInputUnit" class="form-input" placeholder="e.g. Flat A-1001 or Main Gate" style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Operating Hours</label>
          <input type="text" id="emInputHours" class="form-input" value="24x7" placeholder="e.g. 24x7 or 8 AM - 10 PM" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Official Email (Optional)</label>
        <input type="email" id="emInputEmail" class="form-input" placeholder="e.g. security@rwa.org" style="width:100%;font-size:13px;" />
      </div>

      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
        <input type="checkbox" id="emInputPriority" style="width:16px;height:16px;accent-color:#DC2626;cursor:pointer;" />
        <label for="emInputPriority" style="font-size:12.5px;font-weight:600;color:#0F172A;cursor:pointer;">
          High Priority (Pin to top with Urgent Badge for Residents)
        </label>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('🚨 Add Society Emergency Contact', formHtml, 'Save & Publish to Residents ✓', async () => {
      const name = document.getElementById('emInputName')?.value;
      const role = document.getElementById('emInputRole')?.value;
      const category = document.getElementById('emInputCategory')?.value;
      const phone = document.getElementById('emInputPhone')?.value;
      const altPhone = document.getElementById('emInputAltPhone')?.value;
      const unit = document.getElementById('emInputUnit')?.value;
      const availableHours = document.getElementById('emInputHours')?.value;
      const email = document.getElementById('emInputEmail')?.value;
      const isPriority = document.getElementById('emInputPriority')?.checked;

      if (!name || !role || !phone) {
        throw new Error('Please fill all mandatory fields (Name, Role, and Phone Number).');
      }

      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/emergency/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, role, category, phone, altPhone, unit, availableHours, email, isPriority
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save emergency contact');
      }

      if (typeof showToast === 'function') {
        showToast('✓ Emergency contact created and published to all residents!', 'success');
      }
      await window.loadLiveEmergencyContacts(true);
    }, '520px');
  }
};

window.openEditEmergencyContactModal = function(contactId) {
  const contact = (window._emergencyContactsData || []).find(c => c.id === contactId);
  if (!contact) return;

  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Contact Name / Entity *</label>
        <input type="text" id="emEditName" class="form-input" value="${contact.name || ''}" required style="width:100%;font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Role / Designation *</label>
          <input type="text" id="emEditRole" class="form-input" value="${contact.role || ''}" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Category *</label>
          <select id="emEditCategory" class="form-select" style="width:100%;font-size:13px;">
            <option value="COMMITTEE" ${contact.category === 'COMMITTEE' ? 'selected' : ''}>🏛️ Managing Committee</option>
            <option value="SECURITY" ${contact.category === 'SECURITY' ? 'selected' : ''}>🛡️ Campus Security & Gates</option>
            <option value="MAINTENANCE" ${contact.category === 'MAINTENANCE' ? 'selected' : ''}>⚡ Maintenance & Technicians</option>
            <option value="MEDICAL" ${contact.category === 'MEDICAL' ? 'selected' : ''}>🚑 Medical & Hospital</option>
            <option value="POLICE_FIRE" ${contact.category === 'POLICE_FIRE' ? 'selected' : ''}>🚓 Police & Fire Rescue</option>
            <option value="SERVICES" ${contact.category === 'SERVICES' ? 'selected' : ''}>📞 Essential Services</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Primary Phone Number *</label>
          <input type="tel" id="emEditPhone" class="form-input" value="${contact.phone || ''}" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Intercom / Extension</label>
          <input type="text" id="emEditAltPhone" class="form-input" value="${contact.altPhone || ''}" placeholder="e.g. Ext 101" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Unit / Campus Post</label>
          <input type="text" id="emEditUnit" class="form-input" value="${contact.unit || ''}" style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Operating Hours</label>
          <input type="text" id="emEditHours" class="form-input" value="${contact.availableHours || '24x7'}" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Official Email (Optional)</label>
        <input type="email" id="emEditEmail" class="form-input" value="${contact.email || ''}" style="width:100%;font-size:13px;" />
      </div>

      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
        <input type="checkbox" id="emEditPriority" ${contact.isPriority ? 'checked' : ''} style="width:16px;height:16px;accent-color:#DC2626;cursor:pointer;" />
        <label for="emEditPriority" style="font-size:12.5px;font-weight:600;color:#0F172A;cursor:pointer;">
          High Priority (Pin to top with Urgent Badge for Residents)
        </label>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('✏️ Edit Emergency Contact Details', formHtml, 'Save Changes ✓', async () => {
      const name = document.getElementById('emEditName')?.value;
      const role = document.getElementById('emEditRole')?.value;
      const category = document.getElementById('emEditCategory')?.value;
      const phone = document.getElementById('emEditPhone')?.value;
      const altPhone = document.getElementById('emEditAltPhone')?.value;
      const unit = document.getElementById('emEditUnit')?.value;
      const availableHours = document.getElementById('emEditHours')?.value;
      const email = document.getElementById('emEditEmail')?.value;
      const isPriority = document.getElementById('emEditPriority')?.checked;

      if (!name || !role || !phone) {
        throw new Error('Name, Role, and Phone are mandatory.');
      }

      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/emergency/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contactId, name, role, category, phone, altPhone, unit, availableHours, email, isPriority
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update contact');
      }

      if (typeof showToast === 'function') {
        showToast('✓ Emergency contact updated successfully', 'success');
      }
      await window.loadLiveEmergencyContacts(true);
    }, '520px');
  }
};

window.deleteEmergencyContact = async function(id, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from the society emergency directory?`)) {
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/emergency/contacts?id=${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to delete emergency contact');
      return;
    }

    if (typeof showToast === 'function') {
      showToast('✓ Contact removed from emergency directory', 'info');
    }
    await window.loadLiveEmergencyContacts(true);
  } catch (err) {
    console.error('Delete contact error:', err);
  }
};

window.syncCommitteeEmergencyContacts = async function() {
  if (!confirm('This will refresh the emergency directory with current Committee Members and default emergency services. Continue?')) {
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/emergency/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_DEFAULTS' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to sync roster');
      return;
    }

    if (typeof showToast === 'function') {
      showToast('✓ Committee members synchronized into emergency contacts!', 'success');
    }
    await window.loadLiveEmergencyContacts(true);
  } catch (err) {
    console.error('Sync committee error:', err);
  }
};

// =============================================
// Screen Declaration: admin-emergency
// =============================================

Screens['admin-emergency'] = function() {
  setTimeout(() => {
    window.loadLiveEmergencyContacts(true);
  }, 10);

  return Shell.render('admin-emergency', {
    title: 'Emergency Contacts & SOS Hotline',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="window.syncCommitteeEmergencyContacts()">🔄 Sync Committee</button>
        <button class="btn btn-primary btn-sm" onclick="window.openAddEmergencyContactModal()">+ Add Contact</button>
      </div>
    `,
    content: `
      <!-- Page Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:22px;font-weight:900;color:#0F172A;letter-spacing:-0.02em;">
              🚨 Society Emergency Contacts &amp; SOS Directory
            </div>
            <span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;letter-spacing:0.04em;">
              BROADCAST LIVE TO RESIDENTS
            </span>
          </div>
          <div style="font-size:13px;color:#64748B;margin-top:4px;line-height:1.5;">
            Manage official emergency hotlines, campus gate guard intercoms, maintenance technicians, and committee contacts visible to all society residents.
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;">
          <button class="btn btn-secondary btn-sm" onclick="window.syncCommitteeEmergencyContacts()" title="Sync Committee members from user database">
            <span>🔄 Sync Committee</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.openAddEmergencyContactModal()" style="background:linear-gradient(135deg,#DC2626 0%,#B91C1C 100%);border-color:#DC2626;box-shadow:0 4px 14px rgba(220,38,38,0.3);">
            <span>+ Add Emergency Contact</span>
          </button>
        </div>
      </div>

      <!-- Live Stat Counter Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:14px;margin-bottom:20px;">
        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:20px;">
            📞
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Total Active Helplines</div>
            <div id="emStatTotal" style="font-size:20px;font-weight:900;color:#0F172A;">9</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#F0FDF4;color:#16A34A;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🏛️
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Committee Numbers</div>
            <div id="emStatCommittee" style="font-size:20px;font-weight:900;color:#16A34A;">1</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EEF2FF;color:#4F46E5;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🛡️
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Security Gate Posts</div>
            <div id="emStatSecurity" style="font-size:20px;font-weight:900;color:#4F46E5;">2</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🚨
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">24x7 SOS Dispatch</div>
            <div id="emStat24x7" style="font-size:20px;font-weight:900;color:#DC2626;">5</div>
          </div>
        </div>
      </div>

      <!-- Main Directory Card with Category Tabs & Search -->
      <div class="card" style="border-radius:20px;border:1px solid #E2E8F0;background:#FFFFFF;box-shadow:0 1px 3px rgba(15,23,42,0.04);overflow:hidden;">
        <!-- Card Header Toolbar -->
        <div style="padding:16px 20px;border-bottom:1px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <!-- Filter Tabs -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-xs em-cat-tab-btn active" data-cat="ALL" onclick="window.setEmergencyCategoryFilter('ALL')">
              All Contacts
            </button>
            <button class="btn btn-secondary btn-xs em-cat-tab-btn" data-cat="COMMITTEE" onclick="window.setEmergencyCategoryFilter('COMMITTEE')">
              🏛️ Committee
            </button>
            <button class="btn btn-secondary btn-xs em-cat-tab-btn" data-cat="SECURITY" onclick="window.setEmergencyCategoryFilter('SECURITY')">
              🛡️ Security Gates
            </button>
            <button class="btn btn-secondary btn-xs em-cat-tab-btn" data-cat="MAINTENANCE" onclick="window.setEmergencyCategoryFilter('MAINTENANCE')">
              ⚡ Maintenance AMC
            </button>
            <button class="btn btn-secondary btn-xs em-cat-tab-btn" data-cat="MEDICAL" onclick="window.setEmergencyCategoryFilter('MEDICAL')">
              🚑 Medical
            </button>
            <button class="btn btn-secondary btn-xs em-cat-tab-btn" data-cat="POLICE_FIRE" onclick="window.setEmergencyCategoryFilter('POLICE_FIRE')">
              🚓 Police &amp; Fire
            </button>
          </div>

          <!-- Real-Time Search Box -->
          <div style="position:relative;width:240px;">
            <input type="text" class="form-input" placeholder="🔍 Search contacts..." oninput="window.handleEmergencySearch(this.value)" style="width:100%;height:32px;font-size:12px;padding-left:10px;border-radius:8px;" />
          </div>
        </div>

        <!-- Table Viewport -->
        <div class="table-wrap" style="border:none;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
                <th style="width:40px;text-align:center;">#</th>
                <th>Contact &amp; Role</th>
                <th>Category</th>
                <th>Phone Number</th>
                <th>Location / Unit</th>
                <th>Hours</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="emergencyContactsTbody">
              <tr>
                <td colspan="7" style="text-align:center;padding:32px;color:#64748B;font-size:13px;">
                  Loading official emergency directory...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  });
};
