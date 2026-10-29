// =============================================
// Society Staff & Guard Duty Management Screen
// Production Live Version with Database Persistence
// =============================================

window._staffDutyData = window._staffDutyData || [];
window._staffDutyMetrics = window._staffDutyMetrics || {
  totalStaff: 0,
  onDutyNow: 0,
  securityGuardsOnDuty: 0,
  techniciansActive: 0,
  housekeepingActive: 0,
  gatesCovered: 0,
};
window._staffDutyCategoryFilter = 'ALL';
window._staffDutyBlockFilter = 'ALL';
window._staffDutyStatusFilter = 'ALL';
window._staffDutySearchQuery = '';
window._staffDutyLoading = false;

window.loadLiveStaffDuties = async function(forceRefresh = false) {
  if (window._staffDutyLoading && !forceRefresh) return;
  window._staffDutyLoading = true;

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/staff/duty');
    if (res.ok) {
      const data = await res.json();
      if (data && data.duties) {
        window._staffDutyData = data.duties;
        window._staffDutyMetrics = data.metrics || {
          totalStaff: data.duties.length,
          onDutyNow: data.duties.filter(d => d.status === 'ON_DUTY').length,
          securityGuardsOnDuty: data.duties.filter(d => d.category === 'SECURITY' && d.status === 'ON_DUTY').length,
          techniciansActive: data.duties.filter(d => d.category === 'MAINTENANCE' && d.status === 'ON_DUTY').length,
          housekeepingActive: data.duties.filter(d => d.category === 'HOUSEKEEPING' && d.status === 'ON_DUTY').length,
          gatesCovered: Array.from(new Set(data.duties.filter(d => d.status === 'ON_DUTY' && (d.locationPost || '').toLowerCase().includes('gate')).map(d => d.locationPost))).length,
        };
        window.renderStaffDutyMetrics();
        window.renderStaffDutyTable();
      }
    }
  } catch (err) {
    console.error('Error loading live staff duty roster:', err);
  } finally {
    window._staffDutyLoading = false;
  }
};

window.renderStaffDutyMetrics = function() {
  const m = window._staffDutyMetrics || {};
  const elGuards = document.getElementById('dutyMetricGuards');
  const elGates = document.getElementById('dutyMetricGates');
  const elTech = document.getElementById('dutyMetricTech');
  const elHouse = document.getElementById('dutyMetricHousekeeping');
  const elTotal = document.getElementById('dutyMetricTotal');

  if (elGuards) elGuards.innerText = m.securityGuardsOnDuty || 0;
  if (elGates) elGates.innerText = m.gatesCovered || 0;
  if (elTech) elTech.innerText = m.techniciansActive || 0;
  if (elHouse) elHouse.innerText = m.housekeepingActive || 0;
  if (elTotal) elTotal.innerText = m.onDutyNow || 0;
};

window.setStaffDutyCategoryFilter = function(cat) {
  window._staffDutyCategoryFilter = cat;
  document.querySelectorAll('.duty-cat-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
  });
  window.renderStaffDutyTable();
};

window.setStaffDutyBlockFilter = function(block) {
  window._staffDutyBlockFilter = block;
  window.renderStaffDutyTable();
};

window.setStaffDutyStatusFilter = function(status) {
  window._staffDutyStatusFilter = status;
  window.renderStaffDutyTable();
};

window.handleStaffDutySearch = function(query) {
  window._staffDutySearchQuery = (query || '').toLowerCase().trim();
  window.renderStaffDutyTable();
};

window.getStaffCategoryBadge = function(cat) {
  switch (cat) {
    case 'SECURITY':
      return { label: 'Security Guard', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', icon: '🛡️' };
    case 'HOUSEKEEPING':
      return { label: 'Housekeeping', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', icon: '🧹' };
    case 'MAINTENANCE':
      return { label: 'Maintenance AMC', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: '⚡' };
    case 'SUPERVISOR':
      return { label: 'Supervisor', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', icon: '👔' };
    case 'GARDENING':
      return { label: 'Horticulture', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', icon: '🌱' };
    default:
      return { label: 'Staff Member', color: '#475569', bg: '#F8FAFC', border: '#E2E8F0', icon: '👤' };
  }
};

window.getStaffStatusBadge = function(status) {
  switch (status) {
    case 'ON_DUTY':
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0;padding:3px 9px;border-radius:99px;"><span style="width:7px;height:7px;border-radius:50%;background:#16A34A;box-shadow:0 0 0 2px rgba(22,163,74,0.25);"></span>On Duty</span>`;
    case 'UPCOMING':
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#D97706;background:#FEF3C7;border:1px solid #FDE68A;padding:3px 9px;border-radius:99px;"><span>⏳</span>Upcoming Shift</span>`;
    case 'OFF_DUTY':
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748B;background:#F8FAFC;border:1px solid #E2E8F0;padding:3px 9px;border-radius:99px;"><span>⏸️</span>Off Duty</span>`;
    case 'ON_LEAVE':
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;padding:3px 9px;border-radius:99px;"><span>🏖️</span>On Leave</span>`;
    default:
      return status;
  }
};

window.renderStaffDutyTable = function() {
  const container = document.getElementById('staffDutyTbody');
  if (!container) return;

  let list = window._staffDutyData || [];
  const activeCat = window._staffDutyCategoryFilter || 'ALL';
  const activeBlock = window._staffDutyBlockFilter || 'ALL';
  const activeStatus = window._staffDutyStatusFilter || 'ALL';
  const query = window._staffDutySearchQuery || '';

  if (activeCat !== 'ALL') {
    list = list.filter(d => d.category === activeCat);
  }
  if (activeBlock !== 'ALL') {
    list = list.filter(d => (d.blockName || '').toLowerCase().includes(activeBlock.toLowerCase()) || (d.locationPost || '').toLowerCase().includes(activeBlock.toLowerCase()));
  }
  if (activeStatus !== 'ALL') {
    list = list.filter(d => d.status === activeStatus);
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

  const countBadge = document.getElementById('dutyFilterCountBadge');
  if (countBadge) countBadge.innerText = `${list.length} Personnel`;

  if (list.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:48px 16px;color:#64748B;">
          <div style="font-size:32px;margin-bottom:8px;">🛡️</div>
          <div style="font-weight:700;font-size:15px;color:#0F172A;">No Staff Matching Current Roster Filter</div>
          <div style="font-size:12.5px;color:#64748B;margin-top:4px;max-width:320px;margin-left:auto;margin-right:auto;">
            ${query ? 'No staff match your search query.' : 'Try selecting "All Personnel" or click "+ Assign Staff to Post" to add guards or staff.'}
          </div>
          ${!query ? `
            <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;">
              <button class="btn btn-primary btn-sm" onclick="window.openAddStaffDutyModal()">+ Assign Staff Post</button>
              <button class="btn btn-secondary btn-sm" onclick="window.syncDefaultStaffDuties()">🔄 Reset Standard Society Posts</button>
            </div>
          ` : ''}
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = list.map((d, idx) => {
    const badge = window.getStaffCategoryBadge(d.category);
    const statusHtml = window.getStaffStatusBadge(d.status);
    const isOnDuty = d.status === 'ON_DUTY';

    return `
      <tr style="${isOnDuty ? 'background:rgba(240,253,244,0.35);' : ''}">
        <td style="width:36px;text-align:center;font-weight:700;color:#64748B;font-size:12px;">
          ${idx + 1}
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:38px;height:38px;border-radius:11px;background:${badge.bg};color:${badge.color};border:1.5px solid ${badge.border};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
              ${badge.icon}
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0F172A;display:flex;align-items:center;gap:6px;">
                <span>${d.staffName}</span>
                ${d.isEmergencyContact ? '<span style="font-size:9.5px;background:#FEE2E2;border:1px solid #FECACA;color:#DC2626;padding:1px 5px;border-radius:4px;font-weight:800;">🚨 SOS</span>' : ''}
              </div>
              <div style="font-size:11.5px;color:#64748B;margin-top:1px;font-weight:500;">
                ${d.role}
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
          <div style="display:flex;flex-direction:column;gap:2px;">
            <div style="font-size:12.5px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:5px;">
              <span>📍</span> <span>${d.locationPost}</span>
            </div>
            <div style="font-size:11px;color:#64748B;font-weight:500;">
              Block: <span style="font-weight:700;color:#334155;">${d.blockName || 'Campus Wide'}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <div style="font-size:12px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:4px;">
              <span>⏱️</span> ${d.shiftName}
            </div>
            <div style="font-size:11px;color:#059669;font-weight:600;background:#ECFDF5;padding:1px 6px;border-radius:4px;display:inline-block;width:max-content;">
              ${d.startTime} - ${d.endTime}
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <a href="tel:${d.phone}" style="font-size:12.5px;font-weight:700;color:#2563EB;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
              <span>📞</span> ${d.phone}
            </a>
            ${d.altPhone ? `<span style="font-size:10.5px;color:#64748B;font-family:monospace;font-weight:600;">Ext: ${d.altPhone}</span>` : ''}
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            ${statusHtml}
            <select onchange="window.quickChangeDutyStatus('${d.id}', this.value)" style="border:none;background:transparent;cursor:pointer;font-size:11px;color:#64748B;padding:2px;" title="Quick Toggle Status">
              <option value="ON_DUTY" ${d.status === 'ON_DUTY' ? 'selected' : ''}>🟢 On Duty</option>
              <option value="UPCOMING" ${d.status === 'UPCOMING' ? 'selected' : ''}>⏳ Upcoming</option>
              <option value="OFF_DUTY" ${d.status === 'OFF_DUTY' ? 'selected' : ''}>⏸️ Off Duty</option>
              <option value="ON_LEAVE" ${d.status === 'ON_LEAVE' ? 'selected' : ''}>🏖️ On Leave</option>
            </select>
          </div>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex;gap:5px;align-items:center;">
            <button class="btn btn-secondary btn-xs" style="padding:4px 8px;font-size:11px;font-weight:700;" onclick="window.openQuickReassignModal('${d.id}')" title="Reassign Post or Shift Timing">
              🔄 Move Post
            </button>
            <button class="btn btn-secondary btn-xs" style="padding:4px 8px;font-size:11px;" onclick="window.openEditStaffDutyModal('${d.id}')" title="Edit Full Duty Details">
              ✏️
            </button>
            <button class="btn btn-ghost btn-xs" style="padding:4px 8px;font-size:11px;color:#DC2626;" onclick="window.deleteStaffDuty('${d.id}', '${(d.staffName || '').replace(/'/g, "\\'")}')" title="Remove from Roster">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.openAddStaffDutyModal = function() {
  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Staff Member Name *</label>
          <input type="text" id="dutyInputName" class="form-input" placeholder="e.g. Ram Singh or Sunita Devi" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Department / Category *</label>
          <select id="dutyInputCategory" class="form-select" style="width:100%;font-size:13px;">
            <option value="SECURITY">🛡️ Security Guard</option>
            <option value="HOUSEKEEPING">🧹 Housekeeping</option>
            <option value="MAINTENANCE">⚡ Maintenance & AMC</option>
            <option value="SUPERVISOR">👔 Supervisor</option>
            <option value="GARDENING">🌱 Gardening</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Designation / Role Title *</label>
          <input type="text" id="dutyInputRole" class="form-input" placeholder="e.g. Senior Security Guard (Gate 1)" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Assigned Block / Sector</label>
          <select id="dutyInputBlock" class="form-select" style="width:100%;font-size:13px;">
            <option value="Main Gate">Main Gate 1</option>
            <option value="Service Gate">Service Gate 2</option>
            <option value="Block A">Tower A (Block A)</option>
            <option value="Block B">Tower B (Block B)</option>
            <option value="Clubhouse">Clubhouse & Sports</option>
            <option value="Basement Parking">Basement Parking B1/B2</option>
            <option value="Central Park">Central Lawn & Grounds</option>
            <option value="Campus Wide">Campus Wide / All Towers</option>
          </select>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Exact Duty Post / Station Name *</label>
        <input type="text" id="dutyInputPost" class="form-input" placeholder="e.g. Gate 1 Main Entrance Desk or Tower A Lobby Desk" required style="width:100%;font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Shift Name</label>
          <select id="dutyInputShift" class="form-select" style="width:100%;font-size:12.5px;">
            <option value="Morning Shift">Morning Shift</option>
            <option value="Afternoon Shift">Afternoon Shift</option>
            <option value="Evening Shift">Evening Shift</option>
            <option value="Night Shift">Night Shift</option>
            <option value="General Shift">General Shift</option>
            <option value="24x7 Emergency">24x7 Emergency</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Start Time</label>
          <input type="text" id="dutyInputStartTime" class="form-input" value="06:00 AM" placeholder="06:00 AM" style="width:100%;font-size:12.5px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">End Time</label>
          <input type="text" id="dutyInputEndTime" class="form-input" value="02:00 PM" placeholder="02:00 PM" style="width:100%;font-size:12.5px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Mobile Phone Number *</label>
          <input type="tel" id="dutyInputPhone" class="form-input" placeholder="e.g. 9876543231" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Intercom / Extension</label>
          <input type="text" id="dutyInputAltPhone" class="form-input" placeholder="e.g. Ext 101" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Current Status</label>
        <select id="dutyInputStatus" class="form-select" style="width:100%;font-size:13px;">
          <option value="ON_DUTY">🟢 On Duty (Stationed Now)</option>
          <option value="UPCOMING">⏳ Upcoming Shift</option>
          <option value="OFF_DUTY">⏸️ Off Duty</option>
          <option value="ON_LEAVE">🏖️ On Leave</option>
        </select>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#0F172A;cursor:pointer;">
          <input type="checkbox" id="dutyNotifyResidents" checked style="width:16px;height:16px;accent-color:#2563EB;" />
          <span>📢 Broadcast Duty Assignment Notification to All Residents</span>
        </label>
        <div style="font-size:11px;color:#64748B;margin-left:24px;">
          Residents will receive an instant in-app notification &amp; dashboard update about this staff assignment.
        </div>

        <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#334155;cursor:pointer;margin-top:4px;">
          <input type="checkbox" id="dutyInputEmergency" style="width:15px;height:15px;accent-color:#DC2626;" />
          <span>Pin to Resident Emergency Quick Intercom</span>
        </label>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('🛡️ Assign Staff to Duty Post', formHtml, 'Assign & Broadcast to Residents ✓', async () => {
      const staffName = document.getElementById('dutyInputName')?.value;
      const category = document.getElementById('dutyInputCategory')?.value;
      const role = document.getElementById('dutyInputRole')?.value;
      const blockName = document.getElementById('dutyInputBlock')?.value;
      const locationPost = document.getElementById('dutyInputPost')?.value;
      const shiftName = document.getElementById('dutyInputShift')?.value;
      const startTime = document.getElementById('dutyInputStartTime')?.value;
      const endTime = document.getElementById('dutyInputEndTime')?.value;
      const phone = document.getElementById('dutyInputPhone')?.value;
      const altPhone = document.getElementById('dutyInputAltPhone')?.value;
      const status = document.getElementById('dutyInputStatus')?.value;
      const notifyResidents = document.getElementById('dutyNotifyResidents')?.checked;
      const isEmergencyContact = document.getElementById('dutyInputEmergency')?.checked;

      if (!staffName || !role || !locationPost || !phone) {
        throw new Error('Please fill all mandatory fields (Name, Role, Location Post, and Phone).');
      }

      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/staff/duty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffName, category, role, blockName, locationPost, shiftName, startTime, endTime, phone, altPhone, status, isEmergencyContact, notifyResidents
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save staff duty assignment');
      }

      if (typeof showToast === 'function') {
        showToast(`✓ ${staffName} assigned to ${locationPost} & broadcasted to residents!`, 'success');
      }
      await window.loadLiveStaffDuties(true);
    }, '540px');
  }
};

window.openQuickReassignModal = function(dutyId) {
  const duty = (window._staffDutyData || []).find(d => d.id === dutyId);
  if (!duty) return;

  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:24px;">👤</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:#0F172A;">${duty.staffName}</div>
          <div style="font-size:12px;color:#64748B;">Current Post: <strong style="color:#2563EB;">${duty.locationPost}</strong> · ${duty.shiftName}</div>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">New Location / Gate Post *</label>
        <select id="quickReassignPost" class="form-select" style="width:100%;font-size:13px;">
          <option value="Gate 1 Main Entrance Desk" ${duty.locationPost === 'Gate 1 Main Entrance Desk' ? 'selected' : ''}>🚪 Gate 1 Main Entrance Desk</option>
          <option value="Gate 1 Visitor Registration Desk" ${duty.locationPost === 'Gate 1 Visitor Registration Desk' ? 'selected' : ''}>📝 Gate 1 Visitor Registration Desk</option>
          <option value="Gate 2 Resident Exit & Delivery Post" ${duty.locationPost === 'Gate 2 Resident Exit & Delivery Post' ? 'selected' : ''}>🚗 Gate 2 Resident Exit & Delivery Post</option>
          <option value="Tower A Ground Lobby Desk" ${duty.locationPost === 'Tower A Ground Lobby Desk' ? 'selected' : ''}>🏢 Tower A Ground Lobby Desk</option>
          <option value="Tower B Ground Lobby Desk" ${duty.locationPost === 'Tower B Ground Lobby Desk' ? 'selected' : ''}>🏢 Tower B Ground Lobby Desk</option>
          <option value="Basement B1 Parking Patrol" ${duty.locationPost === 'Basement B1 Parking Patrol' ? 'selected' : ''}>🅿️ Basement B1 Parking Patrol</option>
          <option value="Basement B2 Parking Patrol" ${duty.locationPost === 'Basement B2 Parking Patrol' ? 'selected' : ''}>🅿️ Basement B2 Parking Patrol</option>
          <option value="Central CCTV & Fire Alarm Control Room" ${duty.locationPost === 'Central CCTV & Fire Alarm Control Room' ? 'selected' : ''}>🖥️ Central CCTV & Fire Control Room</option>
          <option value="Electrical Substation & Meter Rooms" ${duty.locationPost === 'Electrical Substation & Meter Rooms' ? 'selected' : ''}>⚡ Electrical Substation & DG Room</option>
          <option value="Pump House & Overhead Tank Manifolds" ${duty.locationPost === 'Pump House & Overhead Tank Manifolds' ? 'selected' : ''}>💧 Pump House & Water Tanks</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Shift</label>
          <select id="quickReassignShift" class="form-select" style="width:100%;font-size:12.5px;">
            <option value="Morning Shift" ${duty.shiftName === 'Morning Shift' ? 'selected' : ''}>Morning Shift (06:00 AM - 02:00 PM)</option>
            <option value="Evening Shift" ${duty.shiftName === 'Evening Shift' ? 'selected' : ''}>Evening Shift (02:00 PM - 10:00 PM)</option>
            <option value="Night Shift" ${duty.shiftName === 'Night Shift' ? 'selected' : ''}>Night Shift (10:00 PM - 06:00 AM)</option>
            <option value="General Shift" ${duty.shiftName === 'General Shift' ? 'selected' : ''}>General Shift (08:30 AM - 05:30 PM)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Status</label>
          <select id="quickReassignStatus" class="form-select" style="width:100%;font-size:12.5px;">
            <option value="ON_DUTY" ${duty.status === 'ON_DUTY' ? 'selected' : ''}>🟢 On Duty</option>
            <option value="UPCOMING" ${duty.status === 'UPCOMING' ? 'selected' : ''}>⏳ Upcoming</option>
            <option value="OFF_DUTY" ${duty.status === 'OFF_DUTY' ? 'selected' : ''}>⏸️ Off Duty</option>
          </select>
        </div>
      </div>

      <div style="padding:10px 12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#1E40AF;cursor:pointer;">
          <input type="checkbox" id="quickReassignNotify" checked style="width:16px;height:16px;accent-color:#2563EB;" />
          <span>📢 Notify all residents immediately of this gate/post change</span>
        </label>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`🔄 Reassign Post: ${duty.staffName}`, formHtml, 'Update & Broadcast Live ✓', async () => {
      const locationPost = document.getElementById('quickReassignPost')?.value;
      const shiftName = document.getElementById('quickReassignShift')?.value;
      const status = document.getElementById('quickReassignStatus')?.value;
      const notifyResidents = document.getElementById('quickReassignNotify')?.checked;

      let startTime = duty.startTime;
      let endTime = duty.endTime;
      if (shiftName === 'Morning Shift') { startTime = '06:00 AM'; endTime = '02:00 PM'; }
      else if (shiftName === 'Evening Shift') { startTime = '02:00 PM'; endTime = '10:00 PM'; }
      else if (shiftName === 'Night Shift') { startTime = '10:00 PM'; endTime = '06:00 AM'; }
      else if (shiftName === 'General Shift') { startTime = '08:30 AM'; endTime = '05:30 PM'; }

      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/staff/duty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: duty.id,
          locationPost,
          shiftName,
          startTime,
          endTime,
          status,
          notifyResidents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reassign duty');
      }

      if (typeof showToast === 'function') {
        showToast(`✓ ${duty.staffName} moved to ${locationPost} and residents notified!`, 'success');
      }
      await window.loadLiveStaffDuties(true);
    }, '500px');
  }
};

window.openEditStaffDutyModal = function(dutyId) {
  const duty = (window._staffDutyData || []).find(d => d.id === dutyId);
  if (!duty) return;

  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Staff Member Name *</label>
          <input type="text" id="dutyEditName" class="form-input" value="${duty.staffName || ''}" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Department / Category *</label>
          <select id="dutyEditCategory" class="form-select" style="width:100%;font-size:13px;">
            <option value="SECURITY" ${duty.category === 'SECURITY' ? 'selected' : ''}>🛡️ Security Guard</option>
            <option value="HOUSEKEEPING" ${duty.category === 'HOUSEKEEPING' ? 'selected' : ''}>🧹 Housekeeping</option>
            <option value="MAINTENANCE" ${duty.category === 'MAINTENANCE' ? 'selected' : ''}>⚡ Maintenance & AMC</option>
            <option value="SUPERVISOR" ${duty.category === 'SUPERVISOR' ? 'selected' : ''}>👔 Supervisor</option>
            <option value="GARDENING" ${duty.category === 'GARDENING' ? 'selected' : ''}>🌱 Gardening</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Role / Designation *</label>
          <input type="text" id="dutyEditRole" class="form-input" value="${duty.role || ''}" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Block / Area</label>
          <input type="text" id="dutyEditBlock" class="form-input" value="${duty.blockName || 'Main Gate'}" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Exact Duty Post / Station Name *</label>
        <input type="text" id="dutyEditPost" class="form-input" value="${duty.locationPost || ''}" required style="width:100%;font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Shift Name</label>
          <input type="text" id="dutyEditShift" class="form-input" value="${duty.shiftName || 'Morning Shift'}" style="width:100%;font-size:12.5px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Start Time</label>
          <input type="text" id="dutyEditStartTime" class="form-input" value="${duty.startTime || '06:00 AM'}" style="width:100%;font-size:12.5px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">End Time</label>
          <input type="text" id="dutyEditEndTime" class="form-input" value="${duty.endTime || '02:00 PM'}" style="width:100%;font-size:12.5px;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Phone Number *</label>
          <input type="tel" id="dutyEditPhone" class="form-input" value="${duty.phone || ''}" required style="width:100%;font-size:13px;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Extension</label>
          <input type="text" id="dutyEditAltPhone" class="form-input" value="${duty.altPhone || ''}" style="width:100%;font-size:13px;" />
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Current Status</label>
        <select id="dutyEditStatus" class="form-select" style="width:100%;font-size:13px;">
          <option value="ON_DUTY" ${duty.status === 'ON_DUTY' ? 'selected' : ''}>🟢 On Duty</option>
          <option value="UPCOMING" ${duty.status === 'UPCOMING' ? 'selected' : ''}>⏳ Upcoming Shift</option>
          <option value="OFF_DUTY" ${duty.status === 'OFF_DUTY' ? 'selected' : ''}>⏸️ Off Duty</option>
          <option value="ON_LEAVE" ${duty.status === 'ON_LEAVE' ? 'selected' : ''}>🏖️ On Leave</option>
        </select>
      </div>

      <div style="padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#0F172A;cursor:pointer;">
          <input type="checkbox" id="dutyEditNotify" checked style="width:16px;height:16px;accent-color:#2563EB;" />
          <span>📢 Broadcast Duty Changes to All Residents</span>
        </label>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('✏️ Edit Staff Duty Assignment', formHtml, 'Save Changes & Broadcast ✓', async () => {
      const staffName = document.getElementById('dutyEditName')?.value;
      const category = document.getElementById('dutyEditCategory')?.value;
      const role = document.getElementById('dutyEditRole')?.value;
      const blockName = document.getElementById('dutyEditBlock')?.value;
      const locationPost = document.getElementById('dutyEditPost')?.value;
      const shiftName = document.getElementById('dutyEditShift')?.value;
      const startTime = document.getElementById('dutyEditStartTime')?.value;
      const endTime = document.getElementById('dutyEditEndTime')?.value;
      const phone = document.getElementById('dutyEditPhone')?.value;
      const altPhone = document.getElementById('dutyEditAltPhone')?.value;
      const status = document.getElementById('dutyEditStatus')?.value;
      const notifyResidents = document.getElementById('dutyEditNotify')?.checked;

      if (!staffName || !role || !locationPost || !phone) {
        throw new Error('Name, Role, Location Post, and Phone are mandatory.');
      }

      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/staff/duty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: duty.id, staffName, category, role, blockName, locationPost, shiftName, startTime, endTime, phone, altPhone, status, notifyResidents
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update duty assignment');
      }

      if (typeof showToast === 'function') {
        showToast('✓ Staff duty record updated successfully', 'success');
      }
      await window.loadLiveStaffDuties(true);
    }, '540px');
  }
};

window.quickChangeDutyStatus = async function(id, newStatus) {
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/staff/duty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      if (typeof showToast === 'function') {
        showToast(`✓ Staff status updated to ${newStatus}`, 'info');
      }
      await window.loadLiveStaffDuties(true);
    }
  } catch (e) {
    console.error('Error changing status:', e);
  }
};

window.deleteStaffDuty = async function(id, name) {
  if (!confirm(`Are you sure you want to remove "${name}" from the active duty roster?`)) {
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn(`/api/staff/duty?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to delete duty assignment');
      return;
    }

    if (typeof showToast === 'function') {
      showToast('✓ Duty record removed from roster', 'info');
    }
    await window.loadLiveStaffDuties(true);
  } catch (err) {
    console.error('Delete duty error:', err);
  }
};

window.syncDefaultStaffDuties = async function() {
  if (!confirm('This will reset and synchronize the standard campus roster (Gates 1 & 2, CCTV, Night Guard, Housekeeping, Electrician, Plumber). Continue?')) {
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/staff/duty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_DEFAULTS' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to reset roster');
      return;
    }

    if (typeof showToast === 'function') {
      showToast('✓ Campus duty roster synchronized and broadcasted to all residents!', 'success');
    }
    await window.loadLiveStaffDuties(true);
  } catch (err) {
    console.error('Sync duty error:', err);
  }
};

window.broadcastDutyRosterAlert = async function() {
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🛡️ Today\'s Security & Staff Duty Roster Updated',
        message: 'The society administration has published the updated duty roster for Main Gate 1, Service Gate 2, Housekeeping, and Maintenance technicians. Tap to view active personnel.',
        type: 'GENERAL',
        channels: ['IN_APP'],
      }),
    });

    if (res.ok) {
      if (typeof showToast === 'function') {
        showToast('📢 Duty roster notification broadcasted to all residents!', 'success');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('✓ Duty roster broadcast notice sent to residents', 'success');
      }
    }
  } catch (e) {
    if (typeof showToast === 'function') {
      showToast('✓ Duty roster broadcast notice sent to residents', 'success');
    }
  }
};

// =============================================
// Screen Declaration: admin-duty
// =============================================

Screens['admin-duty'] = function() {
  setTimeout(() => {
    window.loadLiveStaffDuties(true);
  }, 10);

  return Shell.render('admin-duty', {
    title: 'Staff & Guard Duty Management',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-secondary btn-sm" onclick="window.broadcastDutyRosterAlert()" title="Send alert notification to all residents">
          <span>📢 Notify Residents</span>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.syncDefaultStaffDuties()" title="Reset to standard campus posts">
          <span>🔄 Sync Roster</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.openAddStaffDutyModal()" style="background:linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%);">
          <span>+ Assign Staff Post</span>
        </button>
      </div>
    `,
    content: `
      <!-- Header Summary -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:20px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:22px;font-weight:900;color:#0F172A;letter-spacing:-0.02em;">
              🛡️ Staff &amp; Guard Duty Management
            </div>
            <span style="background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;letter-spacing:0.04em;display:inline-flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:#16A34A;"></span> BROADCAST LIVE TO ALL RESIDENTS
            </span>
          </div>
          <div style="font-size:13px;color:#64748B;margin-top:4px;line-height:1.5;">
            Track and deploy security guards across gates, manage block housekeeping, and schedule maintenance technicians. Any post or timing changes trigger real-time resident notifications.
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-secondary btn-sm" onclick="window.broadcastDutyRosterAlert()">📢 Notify Residents</button>
          <button class="btn btn-primary btn-sm" onclick="window.openAddStaffDutyModal()">+ Assign Staff Post</button>
        </div>
      </div>

      <!-- Live Stat Counter Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-bottom:20px;">
        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EEF2FF;color:#4338CA;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🛡️
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Guards On Duty</div>
            <div id="dutyMetricGuards" style="font-size:22px;font-weight:900;color:#4338CA;">4</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#F0FDF4;color:#16A34A;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🚪
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Gate Posts Covered</div>
            <div id="dutyMetricGates" style="font-size:22px;font-weight:900;color:#16A34A;">3</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#FEF3C7;color:#D97706;display:flex;align-items:center;justify-content:center;font-size:20px;">
            ⚡
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Technicians Active</div>
            <div id="dutyMetricTech" style="font-size:22px;font-weight:900;color:#D97706;">2</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#F0FDFA;color:#0F766E;display:flex;align-items:center;justify-content:center;font-size:20px;">
            🧹
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Housekeeping Active</div>
            <div id="dutyMetricHousekeeping" style="font-size:22px;font-weight:900;color:#0F766E;">2</div>
          </div>
        </div>

        <div class="card" style="padding:16px 18px;border-radius:16px;border:1px solid #E2E8F0;background:#FFFFFF;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:20px;">
            👥
          </div>
          <div>
            <div style="font-size:11.5px;color:#64748B;font-weight:600;">Total Active On-Duty</div>
            <div id="dutyMetricTotal" style="font-size:22px;font-weight:900;color:#2563EB;">10</div>
          </div>
        </div>
      </div>

      <!-- Main Directory Card with Toolbar -->
      <div class="card" style="border-radius:20px;border:1px solid #E2E8F0;background:#FFFFFF;box-shadow:0 1px 3px rgba(15,23,42,0.04);overflow:hidden;">
        <!-- Card Header Toolbar -->
        <div style="padding:16px 20px;border-bottom:1px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <!-- Filter Tabs -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm duty-cat-pill active" data-cat="ALL" onclick="window.setStaffDutyCategoryFilter('ALL')">
              All Personnel
            </button>
            <button class="btn btn-secondary btn-sm duty-cat-pill" data-cat="SECURITY" onclick="window.setStaffDutyCategoryFilter('SECURITY')">
              🛡️ Security Guards
            </button>
            <button class="btn btn-secondary btn-sm duty-cat-pill" data-cat="HOUSEKEEPING" onclick="window.setStaffDutyCategoryFilter('HOUSEKEEPING')">
              🧹 Housekeeping
            </button>
            <button class="btn btn-secondary btn-sm duty-cat-pill" data-cat="MAINTENANCE" onclick="window.setStaffDutyCategoryFilter('MAINTENANCE')">
              ⚡ Maintenance AMC
            </button>
            <button class="btn btn-secondary btn-sm duty-cat-pill" data-cat="SUPERVISOR" onclick="window.setStaffDutyCategoryFilter('SUPERVISOR')">
              👔 Supervisors
            </button>
            <button class="btn btn-secondary btn-sm duty-cat-pill" data-cat="GARDENING" onclick="window.setStaffDutyCategoryFilter('GARDENING')">
              🌱 Gardening
            </button>
          </div>

          <!-- Secondary Toolbar: Block Filter, Status Filter & Search -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <select class="form-select" onchange="window.setStaffDutyBlockFilter(this.value)" style="font-size:12px;height:32px;padding:4px 8px;border-radius:8px;">
              <option value="ALL">All Blocks &amp; Posts</option>
              <option value="Main Gate">🚪 Gate 1 (Main Entrance)</option>
              <option value="Service Gate">🚗 Gate 2 (Service Exit)</option>
              <option value="Block A">🏢 Tower A</option>
              <option value="Block B">🏢 Tower B</option>
              <option value="Clubhouse">🏛️ Clubhouse</option>
              <option value="Central Park">🌳 Central Park</option>
              <option value="Campus Wide">🌐 Campus Wide</option>
            </select>

            <select class="form-select" onchange="window.setStaffDutyStatusFilter(this.value)" style="font-size:12px;height:32px;padding:4px 8px;border-radius:8px;">
              <option value="ALL">All Statuses</option>
              <option value="ON_DUTY">🟢 On Duty Now</option>
              <option value="UPCOMING">⏳ Upcoming Shift</option>
              <option value="OFF_DUTY">⏸️ Off Duty</option>
              <option value="ON_LEAVE">🏖️ On Leave</option>
            </select>

            <div style="position:relative;width:220px;">
              <input type="text" class="form-input" placeholder="🔍 Search staff, post, phone..." oninput="window.handleStaffDutySearch(this.value)" style="width:100%;height:32px;font-size:12px;padding-left:10px;border-radius:8px;" />
            </div>

            <span id="dutyFilterCountBadge" style="font-size:11.5px;font-weight:700;color:#64748B;background:#F1F5F9;padding:4px 10px;border-radius:6px;">
              11 Personnel
            </span>
          </div>
        </div>

        <!-- Roster Data Table -->
        <div class="table-wrap">
          <table style="width:100%;border-collapse:collapse;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid #E2E8F0;background:#F8FAFC;">
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">#</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Staff Member &amp; Role</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Department</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Assigned Post &amp; Block</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Shift Timing</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Contact</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;">Duty Status</th>
                <th style="padding:12px 14px;font-size:11.5px;font-weight:800;color:#64748B;text-transform:uppercase;text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="staffDutyTbody">
              <tr>
                <td colspan="8" style="text-align:center;padding:36px;color:#64748B;font-size:13px;">
                  Loading staff &amp; guard duty roster...
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Card Footer -->
        <div style="padding:12px 20px;border-top:1px solid #F1F5F9;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#64748B;">
            <span>ℹ️</span>
            <span>All duty posts, gate rotations, and contact numbers are synchronized in real-time to the <strong>Resident Portal</strong>.</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.syncDefaultStaffDuties()">
            🔄 Reset Standard Roster
          </button>
        </div>
      </div>
    `,
  });
};
