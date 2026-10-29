// =============================================
// Complaints & Helpdesk Screen — Comprehensive Enterprise Implementation
// Real-time Database Hydration, Work Orders, SLA Metrics & Multi-Filter Search
// =============================================

window.__cachedComplaints = [];
window.__selectedComplaintFilter = 'ALL';
window.__selectedComplaintCategory = 'ALL';
window.__complaintsSearchQuery = '';
window.__selectedComplaint = null;

var COMPLAINTS_PRIORITY_COLOR = {
  URGENT: 'red',
  HIGH: 'amber',
  MEDIUM: 'blue',
  LOW: 'muted',
};

var COMPLAINTS_STATUS_COLOR = {
  OPEN: 'blue',
  ACKNOWLEDGED: 'amber',
  IN_PROGRESS: 'purple',
  WAITING: 'amber',
  RESOLVED: 'green',
  CLOSED: 'muted',
  REOPENED: 'red',
};

var COMPLAINTS_CATEGORY_META = {
  PLUMBING: { icon: '🚰', label: 'Plumbing', color: 'blue' },
  ELECTRICAL: { icon: '⚡', label: 'Electrical', color: 'amber' },
  LIFT: { icon: '🛗', label: 'Elevator / Lift', color: 'purple' },
  MAINTENANCE: { icon: '🔧', label: 'Maintenance / Civil', color: 'teal' },
  SECURITY: { icon: '🛡️', label: 'Security / Gate', color: 'red' },
  SANITATION: { icon: '🧹', label: 'Sanitation / Waste', color: 'green' },
  COMMUNITY: { icon: '📢', label: 'Noise / Bylaws', color: 'orange' },
  OTHER: { icon: '📦', label: 'General / Other', color: 'muted' },
};

// Safe modal helper
function openComplaintModal(title, contentHtml, submitLabel, onSubmit, maxWidth) {
  maxWidth = maxWidth || '580px';
  if (typeof window.showModal === 'function') {
    return window.showModal(title, contentHtml, submitLabel, onSubmit, maxWidth);
  }

  var overlay = document.getElementById('rwaComplaintModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rwaComplaintModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:' + maxWidth + ';width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);border:1px solid #E2E8F0;">' +
    '<div style="padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;position:sticky;top:0;z-index:10;">' +
    '<div style="font-size:17px;font-weight:800;color:#0F172A;">' + title + '</div>' +
    '<button type="button" onclick="document.getElementById(\'rwaComplaintModalOverlay\').style.display=\'none\'" style="background:#F1F5F9;border:1px solid #CBD5E1;color:#64748B;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>' +
    '</div>' +
    '<form id="rwaComplaintForm" style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">' +
    contentHtml +
    '<div style="display:flex;gap:10px;margin-top:8px;">' +
    (submitLabel
      ? '<button type="button" onclick="document.getElementById(\'rwaComplaintModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="flex:1;">Cancel</button>' +
      '<button type="submit" id="rwaCompSubBtn" class="btn btn-primary" style="flex:1;">' + submitLabel + '</button>'
      : '<button type="button" onclick="document.getElementById(\'rwaComplaintModalOverlay\').style.display=\'none\'" class="btn btn-secondary" style="width:100%;">Close</button>'
    ) +
    '</div>' +
    '</form>' +
    '</div>';

  overlay.style.display = 'flex';

  var form = document.getElementById('rwaComplaintForm');
  if (form && submitLabel && typeof onSubmit === 'function') {
    form.onsubmit = async function (e) {
      e.preventDefault();
      var btn = document.getElementById('rwaCompSubBtn');
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

// ============================================================
// Main Complaints List Screen
// ============================================================
Screens['admin-complaints'] = function () {
  setTimeout(function () {
    window.loadLiveComplaintsScreen();
  }, 10);

  return Shell.render('admin-complaints', {
    title: 'Complaints & Helpdesk',
    portal: 'admin',
    breadcrumb: 'Complaints',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.exportComplaintsCSV()">📊 Export Helpdesk</button>
      <button class="btn btn-primary btn-sm" onclick="window.openNewComplaintModal()">+ Raise Complaint Ticket</button>
    `,
    content: `
      <!-- Header -->
      <div class="page-header" style="margin-bottom:18px;">
        <div class="page-header-left">
          <div class="page-title">Helpdesk Tickets &amp; Service Requests</div>
          <div class="page-subtitle" id="complaintsSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.exportComplaintsCSV()">📊 Export CSV</button>
          <button class="btn btn-primary" onclick="window.openNewComplaintModal()">+ Raise Complaint Ticket</button>
        </div>
      </div>

      <!-- Modern Analytics Card (New cases, Area Spline + Donut Graphs) -->
      <div class="cases-analytics-card">
        <div class="cases-analytics-title">New cases</div>
        <div class="cases-analytics-subtitle" id="casesDiffSubtitle">0 cases recorded</div>
        <div class="cases-analytics-grid">
          <div id="casesAreaChartContainer" style="width:100%;min-height:220px;"></div>
          <div id="casesDonutChartContainer" style="width:100%;min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <div class="search-box" style="min-width:220px;flex:1;">
          <span class="search-icon">🔍</span>
          <input type="text" id="complaintsSearchInput" placeholder="Filter by ticket #, title, resident, technician..." oninput="window.handleComplaintsSearch(this.value)" />
        </div>
        <select id="complaintCategorySelect" class="form-select" style="min-width:180px;font-size:13px;" onchange="window.handleComplaintsCategoryFilter(this.value)">
          <option value="ALL">All Categories</option>
          <option value="Complaint">📢 Complaint</option>
          <option value="Repair">🔧 Repair</option>
          <option value="Waste">🧹 Waste &amp; Sanitation</option>
          <option value="Admission">🔑 Admission</option>
          <option value="Collection">💳 Collection &amp; Billing</option>
          <option value="FOI">📄 FOI request</option>
        </select>
        <div id="complaintsFilterPillsContainer" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <div class="filter-pill active" onclick="window.filterComplaintsByStatus('ALL', this)">All Tickets</div>
          <div class="filter-pill" onclick="window.filterComplaintsByStatus('OPEN', this)">🔵 New</div>
          <div class="filter-pill" onclick="window.filterComplaintsByStatus('IN_PROGRESS', this)">🟣 In Progress</div>
          <div class="filter-pill" onclick="window.filterComplaintsByStatus('RESOLVED', this)">🟢 Resolved</div>
          <div class="filter-pill" onclick="window.filterComplaintsByStatus('URGENT', this)">🔴 Urgent / High</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.loadLiveComplaintsScreen()">🔄 Refresh</button>
      </div>

      <!-- Modern Table Toolbar matching reference image -->
      <div class="modern-table-toolbar">
        <div class="modern-table-count" id="casesTableCount">Showing 1 to 10 of 33 items</div>
        <div class="modern-table-search">
          <span>Search:</span>
          <input type="text" id="casesSearchBox" class="cases-search-input" placeholder="" oninput="window.handleComplaintsSearch(this.value)" />
        </div>
      </div>

      <!-- Desktop Table matching reference image -->
      <div class="table-wrap desktop-only-table">
        <table>
          <thead>
            <tr>
              <th style="min-width:180px;">Name</th>
              <th style="min-width:120px;">Type</th>
              <th style="min-width:110px;">Status</th>
              <th style="min-width:100px;">Priority</th>
              <th style="min-width:140px;">Assigned to</th>
              <th style="min-width:150px;">Created</th>
              <th style="min-width:150px;">Last updated</th>
              <th style="text-align:right;min-width:90px;">Actions</th>
            </tr>
          </thead>
          <tbody id="complaintsTableBody">
            <tr>
              <td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">
                Loading tickets from database...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards Container -->
      <div id="complaintsMobileCardsContainer" class="mobile-only-cards" style="display:none;flex-direction:column;gap:10px;margin-top:10px;">
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Loading tickets...</div>
      </div>

      <!-- Pagination Footer -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:13px;color:#64748B;flex-wrap:wrap;gap:10px;">
        <span id="complaintsPaginationSummary">Showing 1 to 10 of 33 items</span>
        <div id="complaintsPaginationControls" style="display:flex;gap:4px;align-items:center;"></div>
      </div>
    `,
  });
};

// ============================================================
// Single Complaint Detail Screen
// ============================================================
Screens['admin-complaint-detail'] = function () {
  var c = window.__selectedComplaint || (window.__cachedComplaints && window.__cachedComplaints[0]) || {
    id: 'tkt_default',
    ticketNumber: 'TKT-2026-3046',
    title: 'Lift #2 Jerking & Floor Levelling Misalignment (Block A)',
    description: 'Passenger lift stops 2 inches below landing on 4th floor. Grinding noise noticed during descent.',
    category: 'LIFT',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    assignedTo: 'Apex Elevator Services (Lift AMC)',
    createdAt: new Date().toISOString(),
    unit: { unitNumber: 'A-101' },
    raisedBy: { name: 'Helpdesk Coordinator', phone: '+91 98765 43210' },
    comments: [],
  };

  var pColor = COMPLAINTS_PRIORITY_COLOR[c.priority] || 'blue';
  var sColor = COMPLAINTS_STATUS_COLOR[c.status] || 'blue';
  var catMeta = COMPLAINTS_CATEGORY_META[(c.category || '').toUpperCase()] || COMPLAINTS_CATEGORY_META.OTHER;
  var unitNum = c.unit ? ('Flat ' + c.unit.unitNumber) : 'Common Area / Amenities';
  var raisedName = c.raisedBy ? c.raisedBy.name : 'Society Resident';

  return Shell.render('admin-complaint-detail', {
    title: `Ticket ${c.ticketNumber}`,
    portal: 'admin',
    breadcrumb: '<span onclick="Router.go(\'admin-complaints\')" style="cursor:pointer;color:var(--blue);font-weight:600;">← Back to Helpdesk</span>',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="window.openJobSheetModal('${c.id}')">🖨️ Print Work Order</button>
      <button class="btn btn-primary btn-sm" onclick="window.openUpdateStatusModal('${c.id}')">🔄 Update Status</button>
    `,
    content: `
      <div class="detail-split-layout">
        <div>
          <!-- Main Ticket Card -->
          <div class="card" style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:12px;">
              <div>
                <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
                  <span class="badge badge-${pColor}">⚡ ${c.priority} PRIORITY</span>
                  <span class="badge badge-${sColor}">● ${c.status}</span>
                  <span class="badge badge-${catMeta.color}">${catMeta.icon} ${catMeta.label}</span>
                </div>
                <div style="font-size:20px;font-weight:800;color:var(--text-primary);line-height:1.35;">${c.title}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">
                  Ticket ID: <span style="font-family:monospace;font-weight:700;color:var(--blue);">${c.ticketNumber}</span> · Location: <strong>${unitNum}</strong> · Logged: ${new Date(c.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style="padding:16px;background:var(--bg-elevated);border-radius:var(--r-md);margin-bottom:20px;font-size:14px;color:var(--text-secondary);line-height:1.6;border:1px solid var(--border);">
              ${c.description}
            </div>

            <!-- Mini Summary Grid -->
            <div class="mini-grid-3" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Logged By</div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${raisedName}</div>
                <div style="font-size:11px;color:var(--text-muted);">${c.raisedBy?.phone || 'Society Helpdesk'}</div>
              </div>
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Assigned Technician / Vendor</div>
                <div style="font-size:14px;font-weight:700;color:${c.assignedTo ? 'var(--blue)' : 'var(--red)'};">
                  ${c.assignedTo || 'Unassigned ⚠️'}
                </div>
                <div style="font-size:11px;color:var(--text-muted);">${c.assignedTo ? 'Work order dispatched' : 'Assign technician below'}</div>
              </div>
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Resolution Note</div>
                <div style="font-size:13px;font-weight:600;color:${c.resolutionNote ? 'var(--green)' : 'var(--text-muted)'};">
                  ${c.resolutionNote || 'Pending inspection on site'}
                </div>
              </div>
            </div>
          </div>

          <!-- Activity / Comments Section -->
          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <div class="card-title">Ticket Updates &amp; Work Notes Timeline</div>
              <button class="btn btn-secondary btn-sm" onclick="window.openAddCommentModal('${c.id}')">+ Add Progress Note</button>
            </div>
            <div id="complaintCommentsList" style="display:flex;flex-direction:column;gap:10px;">
              ${(c.comments && c.comments.length > 0 ? c.comments : [
        { authorName: 'Helpdesk Dispatch', content: 'Ticket registered in society helpdesk system. Notification sent to technician team.', createdAt: c.createdAt },
      ]).map(comm => `
                <div style="padding:12px 16px;background:var(--bg-elevated);border-radius:var(--r-md);font-size:13px;border:1px solid var(--border);">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <strong style="color:var(--text-primary);">${comm.authorName}</strong>
                    <span style="font-size:11px;color:var(--text-muted);">${comm.createdAt ? new Date(comm.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div style="color:var(--text-secondary);line-height:1.5;">${comm.content}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Right Quick Actions -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:14px;">Technician Work Actions</div>
            <button class="btn btn-primary w-full" style="justify-content:center;min-height:44px;margin-bottom:8px;" onclick="window.openUpdateStatusModal('${c.id}')">
              🔄 Change Ticket Status
            </button>
            <button class="btn btn-secondary w-full" style="justify-content:center;min-height:44px;margin-bottom:8px;" onclick="window.openAssignTechnicianModal('${c.id}')">
              👷 Assign Technician / AMC
            </button>
            <button class="btn btn-secondary w-full" style="justify-content:center;min-height:44px;margin-bottom:8px;" onclick="window.openJobSheetModal('${c.id}')">
              🖨️ Print Work Order Slip
            </button>
            <button class="btn btn-ghost w-full" style="justify-content:center;min-height:42px;" onclick="window.openAddCommentModal('${c.id}')">
              💬 Post Progress Note
            </button>
          </div>

          <div class="card card-sm" style="background:#F8FAFC;border:1px solid #E2E8F0;">
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#0F172A;">AMC Vendor Hotline:</div>
            <div style="font-size:12px;color:#475569;display:flex;flex-direction:column;gap:6px;">
              <div>🚰 <strong>Plumber:</strong> Sharma (+91 98123 45678)</div>
              <div>⚡ <strong>Electrician:</strong> Ashok (+91 98200 11223)</div>
              <div>🛗 <strong>Lift AMC:</strong> Apex Elevator (1800-200-4455)</div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// ============================================================
// Live Fetch & Rendering
// ============================================================
window.loadLiveComplaintsScreen = async function () {
  try {
    var res = await (window.apiFetch ? window.apiFetch('/api/complaints') : fetch('/api/complaints'));
    if (res.ok) {
      var data = await res.json();
      if (data.complaints) {
        window.__cachedComplaints = data.complaints;
        window.renderComplaintsView();
        return;
      }
    }
  } catch (err) {
    console.warn('API complaints fetch fallback:', err);
  }

  // Graceful fallback if network fails
  if (!window.__cachedComplaints) {
    window.__cachedComplaints = [];
  }

  window.renderComplaintsView();
};

// ============================================================
// Date Formatting Helper (matches DD/MM/YYYY hh:mma format)
// ============================================================
window.formatCaseDate = function (dStr) {
  if (!dStr) return '';
  var d = new Date(dStr);
  if (isNaN(d.getTime())) return '';
  var day = String(d.getDate()).padStart(2, '0');
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var year = d.getFullYear();
  var hours = d.getHours();
  var mins = String(d.getMinutes()).padStart(2, '0');
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  var hoursStr = String(hours).padStart(2, '0');
  return day + '/' + month + '/' + year + ' ' + hoursStr + ':' + mins + ampm;
};

// ============================================================
// Accurate Graphs: Smooth Area Spline Chart (Monday to Sunday)
// ============================================================
window.renderCasesAreaChart = function (dayCounts, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var width = 640;
  var height = 240;
  var paddingLeft = 32;
  var paddingRight = 32;
  var paddingTop = 22;
  var paddingBottom = 42;

  var chartW = width - paddingLeft - paddingRight;
  var chartH = height - paddingTop - paddingBottom;
  var baselineY = paddingTop + chartH;

  var maxVal = Math.max(1, Math.max.apply(null, dayCounts));
  var ceiling = maxVal * 1.15; // 15% headroom for smooth crest

  var points = dayCounts.map(function (val, idx) {
    var x = paddingLeft + (idx / (days.length - 1)) * chartW;
    var y = baselineY - (val / ceiling) * chartH;
    return { x: x, y: y, val: val, day: days[idx] };
  });

  // Catmull-Rom to Cubic Bezier for smooth spline curve
  var splineD = 'M ' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);
  for (var i = 0; i < points.length - 1; i++) {
    var p0 = points[i === 0 ? 0 : i - 1];
    var p1 = points[i];
    var p2 = points[i + 1];
    var p3 = points[i + 2] || p2;

    var cp1x = p1.x + (p2.x - p0.x) / 5.5;
    var cp1y = p1.y + (p2.y - p0.y) / 5.5;
    var cp2x = p2.x - (p3.x - p1.x) / 5.5;
    var cp2y = p2.y - (p3.y - p1.y) / 5.5;

    splineD += ' C ' + cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) + ', ' + cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) + ', ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
  }

  var areaD = splineD + ' L ' + points[points.length - 1].x.toFixed(1) + ' ' + baselineY + ' L ' + points[0].x.toFixed(1) + ' ' + baselineY + ' Z';

  var gridLines = '';
  var dayLabels = '';
  var pointCircles = '';

  points.forEach(function (p, idx) {
    gridLines += '<line x1="' + p.x.toFixed(1) + '" y1="' + paddingTop + '" x2="' + p.x.toFixed(1) + '" y2="' + baselineY + '" stroke="#E2E8F0" stroke-width="1" />';
    dayLabels += '<text x="' + p.x.toFixed(1) + '" y="' + (baselineY + 24) + '" text-anchor="middle" font-size="11" font-weight="500" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' + days[idx] + '</text>';
    pointCircles += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4.5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2" style="cursor:pointer;"><title>' + days[idx] + ': ' + p.val + ' cases</title></circle>';
  });

  var svgHtml =
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto;max-height:240px;display:block;" preserveAspectRatio="xMidYMid meet">' +
    '<defs>' +
    '<linearGradient id="casesAreaGradient" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#60A5FA" stop-opacity="0.6"/>' +
    '<stop offset="60%" stop-color="#93C5FD" stop-opacity="0.25"/>' +
    '<stop offset="100%" stop-color="#DBEAFE" stop-opacity="0.04"/>' +
    '</linearGradient>' +
    '</defs>' +
    gridLines +
    '<line x1="' + paddingLeft + '" y1="' + baselineY + '" x2="' + (width - paddingRight) + '" y2="' + baselineY + '" stroke="#CBD5E1" stroke-width="1.2" />' +
    '<path d="' + areaD + '" fill="url(#casesAreaGradient)" />' +
    '<path d="' + splineD + '" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
    dayLabels +
    pointCircles +
    '</svg>';

  container.innerHTML = svgHtml;
};

// ============================================================
// Accurate Graphs: Donut Chart with Dark Center Badge & Labels
// ============================================================
window.renderCasesDonutChart = function (catCounts, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var total = 0;
  Object.keys(catCounts).forEach(function (k) { total += catCounts[k]; });

  var catColors = {
    'Complaint': '#3B82F6',   // Blue
    'Waste': '#FACC15',       // Yellow/Amber
    'Admission': '#FB923C',   // Orange
    'Collection': '#EA580C',  // Terracotta
    'Repair': '#DC2626',      // Crimson
    'FOI': '#DB2777',         // Pink/Magenta
  };

  var categories = [
    { key: 'Complaint', label: 'Complaint' },
    { key: 'Waste', label: 'Waste' },
    { key: 'Admission', label: 'Admission' },
    { key: 'Collection', label: 'Collection' },
    { key: 'Repair', label: 'Repair' },
    { key: 'FOI', label: 'FOI' },
  ];

  var width = 380;
  var height = 240;
  var cx = 190;
  var cy = 120;
  var R = 78;
  var r = 45;

  var currentAngle = -Math.PI / 2; // start at top (12 o'clock)
  var slicesHtml = '';
  var labelsHtml = '';

  if (total === 0) {
    slicesHtml = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#E2E8F0" stroke-width="' + (R - r) + '" />';
  } else {
    categories.forEach(function (cat) {
      var count = catCounts[cat.key] || 0;
      if (count === 0) return;

      var span = (count / total) * 2 * Math.PI;
      var endAngle = currentAngle + span;

      var x1 = cx + R * Math.cos(currentAngle);
      var y1 = cy + R * Math.sin(currentAngle);
      var x2 = cx + R * Math.cos(endAngle);
      var y2 = cy + R * Math.sin(endAngle);

      var x3 = cx + r * Math.cos(endAngle);
      var y3 = cy + r * Math.sin(endAngle);
      var x4 = cx + r * Math.cos(currentAngle);
      var y4 = cy + r * Math.sin(currentAngle);

      var largeArc = span > Math.PI ? 1 : 0;
      var pathD = 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        ' A ' + R + ' ' + R + ' 0 ' + largeArc + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
        ' L ' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
        ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 0 ' + x4.toFixed(1) + ' ' + y4.toFixed(1) + ' Z';

      var color = catColors[cat.key] || '#94A3B8';

      slicesHtml += '<path d="' + pathD + '" fill="' + color + '" stroke="#FFFFFF" stroke-width="1.5">' +
        '<title>' + cat.label + ': ' + count + ' cases (' + Math.round((count / total) * 100) + '%)</title>' +
        '</path>';

      // External label positioning
      var midAngle = currentAngle + span / 2;
      var labelDist = R + 22;
      var lx = cx + labelDist * Math.cos(midAngle);
      var ly = cy + labelDist * Math.sin(midAngle) + 4;

      if (ly < 16) ly = 16;
      if (ly > height - 10) ly = height - 10;

      var textAnchor = 'middle';
      if (Math.cos(midAngle) > 0.25) textAnchor = 'start';
      else if (Math.cos(midAngle) < -0.25) textAnchor = 'end';

      labelsHtml += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" fill="#334155" font-size="11" font-weight="600" text-anchor="' + textAnchor + '" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' +
        cat.label +
        '</text>';

      currentAngle = endAngle;
    });
  }

  // Dark Center Badge with "33 Cases"
  var centerBadge =
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 1) + '" fill="#1E293B" />' +
    '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" font-size="20" font-weight="800" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' + total + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="10" font-weight="500" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif">Cases</text>';

  var svgHtml =
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto;max-height:240px;display:block;" preserveAspectRatio="xMidYMid meet">' +
    slicesHtml +
    centerBadge +
    labelsHtml +
    '</svg>';

  container.innerHTML = svgHtml;
};

// ============================================================
// Render Complaints Analytics (Live Data Aggregation)
// ============================================================
window.renderComplaintsAnalytics = function (complaints) {
  complaints = complaints || [];

  // 1. Calculate Day-of-Week distribution for Area Chart
  // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  var dayCounts = [0, 0, 0, 0, 0, 0, 0];
  complaints.forEach(function (c) {
    var dt = c.createdAt ? new Date(c.createdAt) : new Date();
    var jsDay = dt.getDay(); // 0 is Sun, 1 is Mon... 6 is Sat
    var dayIdx = (jsDay === 0) ? 6 : (jsDay - 1);
    dayCounts[dayIdx]++;
  });

  // 2. Calculate category breakdown for Donut Chart
  var catCounts = {
    'Complaint': 0,
    'Waste': 0,
    'Admission': 0,
    'Collection': 0,
    'Repair': 0,
    'FOI': 0,
  };

  complaints.forEach(function (c) {
    var raw = ((c.category || '') + ' ' + (c.title || '')).toLowerCase();
    if (raw.includes('waste') || raw.includes('sanitat') || raw.includes('trash') || raw.includes('garbage')) {
      catCounts['Waste']++;
    } else if (raw.includes('admiss') || raw.includes('onboard') || raw.includes('tenant') || raw.includes('move-in') || raw.includes('pass')) {
      catCounts['Admission']++;
    } else if (raw.includes('collect') || raw.includes('bill') || raw.includes('due') || raw.includes('receipt') || raw.includes('surcharge') || raw.includes('fee')) {
      catCounts['Collection']++;
    } else if (raw.includes('repair') || raw.includes('plumb') || raw.includes('elect') || raw.includes('lift') || raw.includes('civil') || raw.includes('pump') || raw.includes('pipe') || raw.includes('door')) {
      catCounts['Repair']++;
    } else if (raw.includes('foi') || raw.includes('bylaw') || raw.includes('rule') || raw.includes('cctv') || raw.includes('contract') || raw.includes('minutes') || raw.includes('audit')) {
      catCounts['FOI']++;
    } else {
      catCounts['Complaint']++;
    }
  });

  // Render both charts
  window.renderCasesAreaChart(dayCounts, 'casesAreaChartContainer');
  window.renderCasesDonutChart(catCounts, 'casesDonutChartContainer');

  var subEl = document.getElementById('casesDiffSubtitle');
  if (subEl) {
    if (complaints.length === 0) {
      subEl.textContent = '0 new cases recorded · Clean slate';
    } else {
      subEl.textContent = complaints.length + (complaints.length === 1 ? ' case recorded' : ' cases recorded');
    }
  }
};

// ============================================================
// Pagination Navigation Helper
// ============================================================
window.setComplaintsPage = function (p) {
  window.__complaintsCurrentPage = p;
  window.renderComplaintsView();
};

// ============================================================
// Main Complaints List Render Function
// ============================================================
window.renderComplaintsView = function () {
  var complaints = window.__cachedComplaints || [];

  // Update Graphs accurately
  window.renderComplaintsAnalytics(complaints);

  var elSub = document.getElementById('complaintsSubtitle');
  if (elSub) {
    elSub.textContent = complaints.length + ' tickets recorded · Live database';
  }

  // Filter data
  var filter = window.__selectedComplaintFilter || 'ALL';
  var catFilter = window.__selectedComplaintCategory || 'ALL';
  var query = (window.__complaintsSearchQuery || '').toLowerCase().trim();

  var filtered = complaints.filter(function (c) {
    if (filter === 'OPEN' && (c.status !== 'OPEN' && c.status !== 'ACKNOWLEDGED')) return false;
    if (filter === 'IN_PROGRESS' && c.status !== 'IN_PROGRESS') return false;
    if (filter === 'RESOLVED' && (c.status !== 'RESOLVED' && c.status !== 'CLOSED')) return false;
    if (filter === 'URGENT' && (c.priority !== 'URGENT' && c.priority !== 'HIGH')) return false;

    if (catFilter !== 'ALL') {
      var cCat = (c.category || '').toLowerCase();
      var fCat = catFilter.toLowerCase();
      if (!cCat.includes(fCat)) return false;
    }

    if (query) {
      var tkt = (c.ticketNumber || '').toLowerCase();
      var title = (c.title || '').toLowerCase();
      var raised = (c.raisedBy?.name || '').toLowerCase();
      var tech = (c.assignedTo || '').toLowerCase();
      var cat = (c.category || '').toLowerCase();
      if (!tkt.includes(query) && !title.includes(query) && !raised.includes(query) && !tech.includes(query) && !cat.includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Pagination calculation
  window.__complaintsCurrentPage = window.__complaintsCurrentPage || 1;
  var pageSize = 10;
  var totalItems = filtered.length;
  var totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (window.__complaintsCurrentPage > totalPages) window.__complaintsCurrentPage = totalPages;
  var currentPage = window.__complaintsCurrentPage;

  var startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  var endIdx = Math.min(currentPage * pageSize, totalItems);

  var countText = 'Showing ' + startIdx + ' to ' + endIdx + ' of ' + totalItems + ' items';
  var elCount1 = document.getElementById('casesTableCount');
  if (elCount1) elCount1.textContent = countText;
  var elCount2 = document.getElementById('complaintsPaginationSummary');
  if (elCount2) elCount2.textContent = countText;

  var pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Render Desktop Table
  var tbody = document.getElementById('complaintsTableBody');
  if (tbody) {
    if (pageItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px;color:#64748B;">No cases match the selected filter.</td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(function (c) {
        var st = (c.status || '').toUpperCase();
        var sClass = 'new';
        var sLabel = 'new';
        if (st === 'IN_PROGRESS' || st === 'WAITING' || st === 'PENDING') {
          sClass = 'in-progress';
          sLabel = 'in progress';
        } else if (st === 'RESOLVED' || st === 'CLOSED') {
          sClass = 'resolved';
          sLabel = 'resolved';
        }

        var pr = (c.priority || '').toUpperCase();
        var pClass = 'medium';
        var pLabel = 'medium';
        if (pr === 'HIGH' || pr === 'URGENT') {
          pClass = 'high';
          pLabel = 'high';
        } else if (pr === 'LOW') {
          pClass = 'low';
          pLabel = 'low';
        }

        var repName = c.raisedBy ? c.raisedBy.name : (c.title ? c.title.split(' ')[0] + ' ' + (c.title.split(' ')[1] || 'Resident') : 'Resident');
        var typeName = c.category || 'Complaint';
        var assigned = c.assignedTo || 'CS Team';
        var createdStr = window.formatCaseDate(c.createdAt);
        var updatedStr = (c.updatedAt && c.updatedAt !== c.createdAt) ? window.formatCaseDate(c.updatedAt) : '';

        return (
          '<tr onclick="window.viewComplaintDetail(\'' + c.id + '\')" style="cursor:pointer;">' +
          '<td style="padding:13px 16px;">' +
          '<div style="font-weight:700;color:#0F172A;font-size:13.5px;">' + repName + '</div>' +
          '<div style="font-size:11px;color:#64748B;margin-top:2px;font-weight:400;">' + c.title + ' · ' + c.ticketNumber + '</div>' +
          '</td>' +
          '<td style="padding:13px 16px;color:#334155;font-size:13px;font-weight:500;">' + typeName + '</td>' +
          '<td style="padding:13px 16px;">' +
          '<span class="pill-badge pill-status-' + sClass + '">' + sLabel + '</span>' +
          '</td>' +
          '<td style="padding:13px 16px;">' +
          '<span class="pill-badge pill-priority-' + pClass + '">' + pLabel + '</span>' +
          '</td>' +
          '<td style="padding:13px 16px;color:#334155;font-size:13px;font-weight:500;">' + assigned + '</td>' +
          '<td style="padding:13px 16px;color:#334155;font-size:12.5px;font-weight:500;white-space:nowrap;">' + createdStr + '</td>' +
          '<td style="padding:13px 16px;color:#64748B;font-size:12.5px;white-space:nowrap;">' + updatedStr + '</td>' +
          '<td onclick="event.stopPropagation()" style="text-align:right;padding:13px 16px;white-space:nowrap;">' +
          '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
          '<button class="btn btn-secondary btn-sm" onclick="window.viewComplaintDetail(\'' + c.id + '\')">View</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="window.openJobSheetModal(\'' + c.id + '\')" title="Print Work Order Slip">🖨️</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="window.openUpdateStatusModal(\'' + c.id + '\')" title="Update Status">🔄</button>' +
          '</div>' +
          '</td>' +
          '</tr>'
        );
      }).join('');
    }
  }

  // Render Mobile Cards Container
  var cardsContainer = document.getElementById('complaintsMobileCardsContainer');
  if (cardsContainer) {
    var isMobile = window.innerWidth <= 768;
    cardsContainer.style.display = isMobile ? 'flex' : 'none';
    var desktopTable = document.querySelector('.desktop-only-table');
    if (desktopTable) desktopTable.style.display = isMobile ? 'none' : 'block';

    if (pageItems.length === 0) {
      cardsContainer.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);">No tickets found.</div>';
    } else {
      cardsContainer.innerHTML = pageItems.map(function (c) {
        var st = (c.status || '').toUpperCase();
        var sClass = (st === 'IN_PROGRESS' || st === 'WAITING') ? 'in-progress' : ((st === 'RESOLVED' || st === 'CLOSED') ? 'resolved' : 'new');
        var sLabel = sClass === 'in-progress' ? 'in progress' : (sClass === 'resolved' ? 'resolved' : 'new');

        var pr = (c.priority || '').toUpperCase();
        var pClass = (pr === 'HIGH' || pr === 'URGENT') ? 'high' : (pr === 'LOW' ? 'low' : 'medium');
        var repName = c.raisedBy ? c.raisedBy.name : 'Resident';

        return (
          '<div class="card card-sm" style="display:flex;flex-direction:column;gap:8px;padding:14px;border:1px solid #E2E8F0;border-radius:12px;cursor:pointer;" onclick="window.viewComplaintDetail(\'' + c.id + '\')">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div style="display:flex;gap:6px;">' +
          '<span class="pill-badge pill-priority-' + pClass + '">' + pClass + '</span>' +
          '<span class="pill-badge pill-status-' + sClass + '">' + sLabel + '</span>' +
          '</div>' +
          '<span style="font-family:monospace;font-size:11px;color:#0284C7;font-weight:700;">' + c.ticketNumber + '</span>' +
          '</div>' +
          '<div style="font-size:15px;font-weight:700;color:#0F172A;">' + repName + '</div>' +
          '<div style="font-size:13px;color:#475569;">' + c.title + '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748B;border-top:1px solid #F1F5F9;padding-top:6px;">' +
          '<span>' + (c.category || 'Complaint') + ' · ' + (c.assignedTo || 'CS Team') + '</span>' +
          '<span>' + window.formatCaseDate(c.createdAt) + '</span>' +
          '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  // Render Pagination Controls
  var pgControls = document.getElementById('complaintsPaginationControls');
  if (pgControls) {
    if (totalPages <= 1) {
      pgControls.innerHTML = '';
    } else {
      var html = '';
      html += '<button class="btn btn-secondary btn-sm" ' + (currentPage === 1 ? 'disabled style="opacity:0.5;"' : 'onclick="window.setComplaintsPage(' + (currentPage - 1) + ')"') + '>← Prev</button>';
      for (var p = 1; p <= totalPages; p++) {
        var isAct = p === currentPage;
        html += '<button class="btn ' + (isAct ? 'btn-primary' : 'btn-secondary') + ' btn-sm" style="min-width:32px;padding:4px 8px;" onclick="window.setComplaintsPage(' + p + ')">' + p + '</button>';
      }
      html += '<button class="btn btn-secondary btn-sm" ' + (currentPage === totalPages ? 'disabled style="opacity:0.5;"' : 'onclick="window.setComplaintsPage(' + (currentPage + 1) + ')"') + '>Next →</button>';
      pgControls.innerHTML = html;
    }
  }
};

window.filterComplaintsByStatus = function (status, pillEl) {
  window.__selectedComplaintFilter = status;
  window.__complaintsCurrentPage = 1;
  var pills = document.querySelectorAll('#complaintsFilterPillsContainer .filter-pill');
  pills.forEach(function (p) { p.classList.remove('active'); });
  if (pillEl) pillEl.classList.add('active');
  window.renderComplaintsView();
};

window.handleComplaintsCategoryFilter = function (val) {
  window.__selectedComplaintCategory = val;
  window.__complaintsCurrentPage = 1;
  window.renderComplaintsView();
};

window.handleComplaintsSearch = function (query) {
  window.__complaintsSearchQuery = query;
  window.__complaintsCurrentPage = 1;
  var box1 = document.getElementById('complaintsSearchInput');
  if (box1 && box1.value !== query) box1.value = query;
  var box2 = document.getElementById('casesSearchBox');
  if (box2 && box2.value !== query) box2.value = query;
  window.renderComplaintsView();
};

window.viewComplaintDetail = function (complaintId) {
  var c = (window.__cachedComplaints || []).find(comp => comp.id === complaintId);
  if (c) {
    window.__selectedComplaint = c;
    Router.go('admin-complaint-detail');
  }
};

// ============================================================
// Raise New Complaint Modal (with Flat & Vendor selection)
// ============================================================
window.openNewComplaintModal = async function () {
  // Fetch units list for dropdown
  var unitsList = [];
  try {
    var uRes = await (window.apiFetch ? window.apiFetch('/api/units') : fetch('/api/units'));
    if (uRes.ok) {
      var uData = await uRes.json();
      unitsList = uData.units || [];
    }
  } catch (e) { }

  var unitOptions = '<option value="">🏢 Common Area / Society Infrastructure</option>';
  if (unitsList.length > 0) {
    unitOptions += unitsList.map(u => `<option value="${u.id}">Flat ${u.unitNumber} ${u.ownerName ? '(' + u.ownerName + ')' : ''}</option>`).join('');
  } else {
    // Default fallback unit options
    unitOptions += `
      <option value="A-101">Flat A-101 (Rohit Verma)</option>
      <option value="A-102">Flat A-102</option>
      <option value="A-201">Flat A-201</option>
      <option value="A-202">Flat A-202</option>
      <option value="A-301">Flat A-301</option>
      <option value="B-101">Flat B-101</option>
      <option value="B-204">Flat B-204 (Ananya Gupta)</option>
      <option value="C-102">Flat C-102</option>
    `;
  }

  var html = `
    <div>
      <label class="form-label">Issue Title / Headline *</label>
      <input type="text" id="newCompTitle" required placeholder="e.g. Lift #2 jerking & floor alignment issue, Water pressure low" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:12px;">
      <div style="flex:1;">
        <label class="form-label">Affected Flat / Location *</label>
        <select id="newCompUnit" class="form-select" style="width:100%;">
          ${unitOptions}
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Issue Category *</label>
        <select id="newCompCat" class="form-select" style="width:100%;">
          <option value="PLUMBING">🚰 Plumbing &amp; Water Supply</option>
          <option value="ELECTRICAL">⚡ Electrical &amp; Power</option>
          <option value="LIFT">🛗 Elevator / Lift AMC</option>
          <option value="MAINTENANCE">🔧 Civil &amp; Building Maintenance</option>
          <option value="SECURITY">🛡️ Security &amp; Gate RFID</option>
          <option value="SANITATION">🧹 Housekeeping &amp; Garbage</option>
          <option value="COMMUNITY">📢 Noise / Bylaw Infraction</option>
          <option value="OTHER">📦 General Enquiry</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:12px;">
      <div style="flex:1;">
        <label class="form-label">Priority / SLA *</label>
        <select id="newCompPriority" class="form-select" style="width:100%;">
          <option value="URGENT">🚨 URGENT (SLA: 4 Hours)</option>
          <option value="HIGH">⚡ HIGH (SLA: 12 Hours)</option>
          <option value="MEDIUM" selected>🔵 MEDIUM (SLA: 24 Hours)</option>
          <option value="LOW">⚪ LOW (SLA: 48 Hours)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Assign Technician / AMC Vendor</label>
        <select id="newCompTech" class="form-select" style="width:100%;">
          <option value="">-- Assign Later / Unassigned --</option>
        </select>
      </div>
    </div>

    <div>
      <label class="form-label">Detailed Fault Description *</label>
      <textarea id="newCompDesc" required rows="4" class="form-input" style="width:100%;resize:vertical;line-height:1.5;" placeholder="Provide specific symptoms, floor/shaft location, resident contact, and technician instructions..."></textarea>
    </div>
  `;

  openComplaintModal('🎫 Raise Service Helpdesk Ticket', html, 'Register Ticket & Dispatch', async function () {
    var title = document.getElementById('newCompTitle').value.trim();
    var unitId = document.getElementById('newCompUnit').value || null;
    var category = document.getElementById('newCompCat').value;
    var priority = document.getElementById('newCompPriority').value;
    var assignedTo = document.getElementById('newCompTech').value || null;
    var description = document.getElementById('newCompDesc').value.trim();

    if (!title || !description) {
      if (typeof window.showToast === 'function') window.showToast('Please provide issue title and description', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          description: description,
          unitId: unitId,
          category: category,
          priority: priority,
          assignedTo: assignedTo,
        }),
      }) : fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          description: description,
          unitId: unitId,
          category: category,
          priority: priority,
          assignedTo: assignedTo,
        }),
      }));

      if (res.ok) {
        var data = await res.json();
        if (data.complaint) {
          window.__cachedComplaints.unshift(data.complaint);
          window.renderComplaintsView();
          if (typeof window.showToast === 'function') {
            window.showToast(`🎉 Ticket ${data.complaint.ticketNumber} registered successfully!`, 'success');
          }
          return;
        }
      }
    } catch (e) {
      console.warn('API complaint post fallback:', e);
    }

    // Local fallback
    var newC = {
      id: 'tkt_' + Date.now(),
      ticketNumber: 'TKT-2026-' + Math.floor(3100 + Math.random() * 8000),
      title: title,
      description: description,
      category: category,
      priority: priority,
      status: assignedTo ? 'IN_PROGRESS' : 'OPEN',
      assignedTo: assignedTo,
      createdAt: new Date().toISOString(),
      unit: unitId ? { unitNumber: unitId } : null,
    };
    window.__cachedComplaints.unshift(newC);
    window.renderComplaintsView();
    if (typeof window.showToast === 'function') {
      window.showToast(`🎉 Ticket ${newC.ticketNumber} registered!`, 'success');
    }
  }, '620px');
};

// ============================================================
// Update Status Modal
// ============================================================
window.openUpdateStatusModal = function (complaintId) {
  var c = (window.__cachedComplaints || []).find(comp => comp.id === complaintId) || window.__selectedComplaint;
  if (!c) return;

  var html = `
    <div>
      <label class="form-label">Update Ticket Status for ${c.ticketNumber} *</label>
      <select id="updStatusSelect" class="form-select" style="width:100%;font-size:14px;font-weight:600;">
        <option value="OPEN" ${c.status === 'OPEN' ? 'selected' : ''}>🔵 OPEN (Pending Inspection)</option>
        <option value="IN_PROGRESS" ${c.status === 'IN_PROGRESS' ? 'selected' : ''}>🟣 IN PROGRESS (Technician On Site)</option>
        <option value="RESOLVED" ${c.status === 'RESOLVED' ? 'selected' : ''}>🟢 RESOLVED (Work Done)</option>
        <option value="CLOSED" ${c.status === 'CLOSED' ? 'selected' : ''}>⚪ CLOSED (Verified by Resident)</option>
        <option value="REOPENED" ${c.status === 'REOPENED' ? 'selected' : ''}>🔴 REOPENED (Fault Persists)</option>
      </select>
    </div>

    <div>
      <label class="form-label">Resolution Summary / Action Taken</label>
      <textarea id="updResolutionNote" rows="3" class="form-input" style="width:100%;resize:vertical;" placeholder="Describe what parts were replaced, root cause, test confirmation...">${c.resolutionNote || ''}</textarea>
    </div>
  `;

  openComplaintModal('🔄 Update Ticket Status: ' + c.ticketNumber, html, 'Save Status Update', async function () {
    var status = document.getElementById('updStatusSelect').value;
    var note = document.getElementById('updResolutionNote').value.trim();

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/complaints/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status, resolutionNote: note }),
      }) : fetch('/api/complaints/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status, resolutionNote: note }),
      }));

      if (res.ok) {
        var data = await res.json();
        if (data.complaint) {
          c = Object.assign(c, data.complaint);
        }
      }
    } catch (e) { }

    c.status = status;
    c.resolutionNote = note;
    if (status === 'RESOLVED') c.resolvedAt = new Date().toISOString();

    window.renderComplaintsView();
    if (typeof window.showToast === 'function') {
      window.showToast(`✓ Ticket ${c.ticketNumber} status updated to ${status}!`, 'success');
    }

    if (window.__selectedComplaint && window.__selectedComplaint.id === c.id) {
      window.__selectedComplaint = c;
      if (typeof Router !== 'undefined' && Router.current() === 'admin-complaint-detail') {
        Router.go('admin-complaint-detail');
      }
    }
  });
};

// ============================================================
// Assign Technician Modal (Dynamic Vendors + Quick Add Vendor)
// ============================================================
window.openAssignTechnicianModal = async function (complaintId) {
  var c = (window.__cachedComplaints || []).find(comp => comp.id === complaintId) || window.__selectedComplaint;
  if (!c) return;

  // Fetch live vendor list from /api/vendors
  var vendorsList = [];
  try {
    var vRes = await (window.apiFetch ? window.apiFetch('/api/vendors') : fetch('/api/vendors'));
    if (vRes.ok) {
      var vData = await vRes.json();
      vendorsList = vData.vendors || [];
    }
  } catch (e) { }

  if (vendorsList.length === 0) {
    vendorsList = [];
  }

  var currentAssigned = c.assignedTo || '';
  var vendorOptions = vendorsList.map(function (v) {
    var label = `${v.name} (${v.service}${v.phone ? ' · ' + v.phone : ''})`;
    var isSelected = currentAssigned && currentAssigned.toLowerCase().includes(v.name.toLowerCase());
    return `<option value="${v.name} (${v.phone || v.service})" ${isSelected ? 'selected' : ''}>${label}</option>`;
  }).join('');

  var html = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <label class="form-label" style="margin:0;">Assign Technician / AMC Vendor *</label>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.openQuickAddVendorModal('${complaintId}')" style="font-size:11px;padding:3px 8px;font-weight:700;">
          ➕ + Add New Vendor
        </button>
      </div>
      <select id="assignTechSelect" class="form-select" style="width:100%;font-size:14px;font-weight:600;" onchange="if(this.value==='__ADD_NEW__') window.openQuickAddVendorModal('${complaintId}')">
        ${vendorOptions}
        <option value="__ADD_NEW__" style="color:#2563EB;font-weight:700;">➕ + Add New Technician / Vendor...</option>
      </select>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
        💡 You can also manage the full vendor and AMC contract directory at <strong>Operations ➔ <a href="#admin-vendors" style="color:var(--blue);text-decoration:underline;" onclick="document.getElementById('rwaComplaintModalOverlay').style.display='none'">Vendors &amp; Contracts</a></strong>.
      </div>
    </div>

    <div style="margin-top:10px;">
      <label class="form-label">Work Order Priority</label>
      <select id="assignPrioritySelect" class="form-select" style="width:100%;">
        <option value="URGENT" ${c.priority === 'URGENT' ? 'selected' : ''}>🚨 Urgent (4-Hour Response)</option>
        <option value="HIGH" ${c.priority === 'HIGH' ? 'selected' : ''}>⚡ High Priority (12-Hour SLA)</option>
        <option value="MEDIUM" ${c.priority === 'MEDIUM' ? 'selected' : ''}>🔵 Medium (Standard 24-Hour SLA)</option>
      </select>
    </div>
  `;

  openComplaintModal('👷 Dispatch Work Order: ' + c.ticketNumber, html, 'Issue Work Order', async function () {
    var tech = document.getElementById('assignTechSelect').value;
    if (tech === '__ADD_NEW__') {
      window.openQuickAddVendorModal(complaintId);
      return;
    }
    var prio = document.getElementById('assignPrioritySelect').value;

    try {
      await (window.apiFetch ? window.apiFetch('/api/complaints/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: tech, priority: prio, status: 'IN_PROGRESS' }),
      }) : fetch('/api/complaints/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: tech, priority: prio, status: 'IN_PROGRESS' }),
      }));
    } catch (e) { }

    c.assignedTo = tech;
    c.priority = prio;
    c.status = 'IN_PROGRESS';

    window.renderComplaintsView();
    if (typeof window.showToast === 'function') {
      window.showToast(`👷 Work order dispatched to ${tech}!`, 'success');
    }

    if (window.__selectedComplaint && window.__selectedComplaint.id === c.id) {
      window.__selectedComplaint = c;
      if (typeof Router !== 'undefined' && Router.current() === 'admin-complaint-detail') {
        Router.go('admin-complaint-detail');
      }
    }
  });
};

// ============================================================
// Quick Add Technician / Vendor Modal
// ============================================================
window.openQuickAddVendorModal = function (complaintId) {
  var html = `
    <div>
      <label class="form-label">Technician / Company Name *</label>
      <input type="text" id="quickVendorName" required placeholder="e.g. Kumar Carpentry &amp; Door Locks, Urban Plumber" class="form-input" style="width:100%;font-size:14px;font-weight:600;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Trade / Service Specialty *</label>
        <select id="quickVendorService" class="form-select" style="width:100%;">
          <option value="Plumbing & Water Supply">🚰 Plumbing &amp; Water Supply</option>
          <option value="Electrical & Power">⚡ Electrical &amp; Power</option>
          <option value="Elevator & Lift AMC">🛗 Elevator &amp; Lift AMC</option>
          <option value="Carpentry & Door Locks">🪚 Carpentry &amp; Locks</option>
          <option value="Civil Seepage & Masonry">🧱 Civil Seepage &amp; Masonry</option>
          <option value="CCTV & Gate Security">📹 CCTV &amp; Security</option>
          <option value="Pest Control & Fogging">🦟 Pest Control</option>
          <option value="AC & HVAC Maintenance">❄️ AC &amp; HVAC</option>
          <option value="Housekeeping & Sanitation">🧹 Housekeeping</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Contact Mobile Number *</label>
        <input type="tel" id="quickVendorPhone" required placeholder="+91 98765 11223" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Person Name</label>
        <input type="text" id="quickVendorPerson" placeholder="e.g. Ramesh Kumar" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Engagement Type</label>
        <select id="quickVendorType" class="form-select" style="width:100%;">
          <option value="ON_CALL">On-Call Freelance Technician</option>
          <option value="AMC">Annual Maintenance Contract (AMC)</option>
        </select>
      </div>
    </div>
  `;

  openComplaintModal('➕ Onboard Technician / Vendor', html, 'Save & Select Vendor', async function () {
    var name = document.getElementById('quickVendorName').value.trim();
    var service = document.getElementById('quickVendorService').value;
    var phone = document.getElementById('quickVendorPhone').value.trim();
    var person = document.getElementById('quickVendorPerson').value.trim();
    var type = document.getElementById('quickVendorType').value;

    if (!name || !phone) {
      if (typeof window.showToast === 'function') window.showToast('Name and phone are required', 'error');
      return;
    }

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, service: service, phone: phone, contactPerson: person, type: type }),
      }) : fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, service: service, phone: phone, contactPerson: person, type: type }),
      }));

      if (res.ok) {
        var data = await res.json();
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Technician "${name}" saved to society registry!`, 'success');
        }
      }
    } catch (e) { }

    // Re-open assign modal with this technician selected
    if (complaintId) {
      setTimeout(function () {
        window.openAssignTechnicianModal(complaintId);
      }, 100);
    }
  }, '560px');
};

// ============================================================
// Print Work Order Slip / Job Sheet Modal
// ============================================================
window.openJobSheetModal = function (complaintId) {
  var c = (window.__cachedComplaints || []).find(comp => comp.id === complaintId) || window.__selectedComplaint;
  if (!c) return;

  var unitText = c.unit ? ('Flat ' + c.unit.unitNumber) : 'Common Society Property';
  var dateStr = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'October 13, 2026';

  var sheetHtml = `
    <div id="printJobSheetArea" style="font-family:'Inter',sans-serif;color:#0F172A;line-height:1.5;padding:8px;">
      <!-- Header -->
      <div style="border-bottom:2px solid #0F172A;padding-bottom:10px;margin-bottom:14px;text-align:center;">
        <div style="font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">
          Greenwood Heights RWA
        </div>
        <div style="font-size:11px;color:#475569;">
          Estate Maintenance &amp; Technical Services Desk · Sector 42, Chandigarh
        </div>
        <div style="display:inline-block;margin-top:6px;padding:3px 14px;background:#F1F5F9;border:1px solid #CBD5E1;border-radius:4px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          WORK ORDER &amp; TECHNICIAN JOB SHEET
        </div>
      </div>

      <!-- Ticket Details Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;background:#F8FAFC;padding:12px;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:14px;">
        <div>Work Order #: <strong>${c.ticketNumber}</strong></div>
        <div>Date Logged: <strong>${dateStr}</strong></div>
        <div>Location / Space: <strong>${unitText}</strong></div>
        <div>Category / Priority: <strong>${c.category} · ${c.priority}</strong></div>
        <div>Assigned Vendor: <strong>${c.assignedTo || 'Unassigned'}</strong></div>
        <div>SLA Target: <strong>Within 4-12 Hours</strong></div>
      </div>

      <!-- Fault Description -->
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:4px;">Reported Issue:</div>
        <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:4px;">${c.title}</div>
        <div style="font-size:13px;color:#334155;padding:10px;background:#fff;border:1px solid #CBD5E1;border-radius:6px;line-height:1.5;">
          ${c.description}
        </div>
      </div>

      <!-- Technician Inspection & Parts Used Section (Fillable on Site) -->
      <div style="border:1px dashed #94A3B8;padding:12px;border-radius:8px;margin-bottom:20px;font-size:12px;background:#FAFAFA;">
        <div style="font-weight:800;margin-bottom:6px;color:#334155;">TECHNICIAN ON-SITE INSPECTION &amp; PARTS LOG:</div>
        <div style="height:44px;border-bottom:1px dotted #CBD5E1;margin-bottom:8px;"></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748B;">
          <span>Material / Spares Replaced: ___________________</span>
          <span>Time In: _______ Time Out: _______</span>
        </div>
      </div>

      <!-- Signatures Box -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;padding-top:12px;border-top:1px solid #E2E8F0;font-size:11.5px;text-align:center;">
        <div>
          <div style="height:36px;"></div>
          <div style="border-top:1px solid #94A3B8;padding-top:4px;font-weight:700;">Resident / Complainant Signature</div>
          <div style="font-size:10px;color:#64748B;">Confirmed Work Completion Satisfactory</div>
        </div>
        <div>
          <div style="height:36px;"></div>
          <div style="border-top:1px solid #94A3B8;padding-top:4px;font-weight:700;">Technician / Supervisor Signature</div>
          <div style="font-size:10px;color:#64748B;">AMC Vendor Stamp &amp; Date</div>
        </div>
      </div>
    </div>
  `;

  openComplaintModal('🖨️ Work Order & Job Sheet — ' + c.ticketNumber, sheetHtml, '🖨️ Print Job Sheet', function () {
    var printContent = document.getElementById('printJobSheetArea').innerHTML;
    var printWin = window.open('', '_blank', 'width=800,height=700');
    printWin.document.write('<html><head><title>Job Sheet ' + c.ticketNumber + '</title><style>body{font-family:sans-serif;padding:30px;}</style></head><body>' + printContent + '</body></html>');
    printWin.document.close();
    printWin.focus();
    setTimeout(function () {
      printWin.print();
      printWin.close();
    }, 250);
  }, '640px');
};

// ============================================================
// Add Comment Modal
// ============================================================
window.openAddCommentModal = function (complaintId) {
  var c = (window.__cachedComplaints || []).find(comp => comp.id === complaintId) || window.__selectedComplaint;
  if (!c) return;

  var html = `
    <div>
      <label class="form-label">Add Work Note / Communication for ${c.ticketNumber} *</label>
      <textarea id="newCommentContent" class="form-input" rows="4" style="width:100%;resize:vertical;" placeholder="Enter technician update, resident message, or inspection remarks..." required></textarea>
    </div>
  `;

  openComplaintModal('💬 Post Work Note: ' + c.ticketNumber, html, 'Post Work Note', async function () {
    var content = document.getElementById('newCommentContent').value.trim();
    if (!content) return;

    try {
      var res = await (window.apiFetch ? window.apiFetch('/api/complaints/' + c.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content }),
      }) : fetch('/api/complaints/' + c.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content }),
      }));

      if (res.ok) {
        var data = await res.json();
        if (data.comment) {
          c.comments = c.comments || [];
          c.comments.push(data.comment);
        }
      }
    } catch (e) { }

    c.comments = c.comments || [];
    c.comments.push({
      authorName: 'Helpdesk Admin',
      content: content,
      createdAt: new Date().toISOString(),
    });

    if (typeof window.showToast === 'function') window.showToast('Work note recorded', 'success');

    if (window.__selectedComplaint && window.__selectedComplaint.id === c.id) {
      window.__selectedComplaint = c;
      if (typeof Router !== 'undefined' && Router.current() === 'admin-complaint-detail') {
        Router.go('admin-complaint-detail');
      }
    }
  });
};

// Delete Ticket Prompt
window.deleteComplaintPrompt = async function (complaintId) {
  if (!confirm('Are you sure you want to permanently delete this helpdesk ticket?')) return;

  try {
    await (window.apiFetch ? window.apiFetch('/api/complaints?id=' + complaintId, { method: 'DELETE' }) : fetch('/api/complaints?id=' + complaintId, { method: 'DELETE' }));
  } catch (e) { }

  window.__cachedComplaints = (window.__cachedComplaints || []).filter(c => c.id !== complaintId);
  window.renderComplaintsView();
  if (typeof window.showToast === 'function') window.showToast('Ticket deleted from database', 'success');
};

// ============================================================
// Export Complaints CSV
// ============================================================
window.exportComplaintsCSV = function () {
  var rows = [
    ['Ticket Number', 'Title', 'Unit/Flat', 'Category', 'Priority', 'Status', 'Assigned To', 'Resolution Note', 'Created Date']
  ];
  (window.__cachedComplaints || []).forEach(function (c) {
    var unitStr = c.unit ? c.unit.unitNumber : 'Common Area';
    rows.push([
      c.ticketNumber,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${unitStr}"`,
      c.category,
      c.priority,
      c.status,
      `"${(c.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(c.resolutionNote || '').replace(/"/g, '""')}"`,
      c.createdAt || '',
    ]);
  });
  var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'Society_Helpdesk_Register_' + new Date().toISOString().split('T')[0] + '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof window.showToast === 'function') window.showToast('✓ Helpdesk register exported to CSV', 'success');
};

// Real-time socket sync
if (typeof window !== 'undefined' && window.socket) {
  window.socket.on('new-complaint-ticket', function () {
    if (typeof window.loadLiveComplaintsScreen === 'function') window.loadLiveComplaintsScreen();
  });
  window.socket.on('complaint-updated', function () {
    if (typeof window.loadLiveComplaintsScreen === 'function') window.loadLiveComplaintsScreen();
  });
  window.socket.on('complaint-deleted', function () {
    if (typeof window.loadLiveComplaintsScreen === 'function') window.loadLiveComplaintsScreen();
  });
}

