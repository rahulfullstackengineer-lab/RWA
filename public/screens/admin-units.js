// =============================================
// Units & Property Structure Screens — Dynamic DB Hydration
// Mobile-First Architecture & Zero Static Data
// =============================================

var STATUS_LABELS = {
  OWNER_OCCUPIED:     { label: 'Owner Occupied',    color: 'green' },
  TENANTED:           { label: 'Tenanted',          color: 'blue'  },
  VACANT:             { label: 'Vacant',            color: 'muted' },
  UNDER_CONSTRUCTION: { label: 'Under Construction',color: 'amber' },
  UNKNOWN:            { label: 'Unknown',           color: 'muted' },
};

window.__cachedUnits = [];
window.__cachedBlocks = [];
window.__selectedBlockFilter = 'ALL';
window.__selectedUnit = null;

Screens['admin-structure'] = function() {
  // Trigger dynamic DB load
  setTimeout(() => {
    if (typeof window.loadLiveUnitsScreen === 'function') {
      window.loadLiveUnitsScreen();
    }
  }, 10);

  return Shell.render('admin-structure', {
    title: 'Property Structure',
    portal: 'admin',
    breadcrumb: 'Property',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="openImportUnitsModal()">📥 Import Excel / CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openAddUnitModal()">+ Add Unit</button>
    `,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Property Structure & Flat Registry</div>
          <div class="page-subtitle" id="unitsSubtitle">Connecting to live database...</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="exportUnitsRegistry()">📊 Export CSV</button>
          <button class="btn btn-secondary" onclick="openImportUnitsModal()">📥 Import Excel / CSV</button>
          <button class="btn btn-primary" onclick="openAddUnitModal()">+ Add Unit</button>
        </div>
      </div>

      <!-- Mobile View Switcher (Tree vs Units) -->
      <div class="mobile-structure-tabs">
        <button class="mobile-tab-btn active" id="btnUnitsTab" onclick="setStructureMobileTab('units')">🚪 Units List (<span id="mobileUnitsCountBadge">...</span>)</button>
        <button class="mobile-tab-btn" id="btnTreeTab" onclick="setStructureMobileTab('tree')">🌲 Structure Tree</button>
      </div>

      <!-- Modern Analytics Card (Society Units & Occupancy, Area Spline + Donut) -->
      <div class="cases-analytics-card">
        <div class="cases-analytics-title">Society Units &amp; Occupancy</div>
        <div class="cases-analytics-subtitle" id="unitsDiffSubtitle">0% Total society occupancy</div>
        <div class="cases-analytics-grid">
          <div id="unitsAreaChartContainer" style="width:100%;min-height:220px;"></div>
          <div id="unitsDonutChartContainer" style="width:100%;min-height:220px;display:flex;align-items:center;justify-content:center;"></div>
        </div>
      </div>

      <div class="structure-split-layout">
        <!-- Tree -->
        <div class="card card-sm structure-tree-panel" id="structureTreePanel" style="height:fit-content;">
          <div class="card-title" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
            <span>Structure Tree</span>
            <span class="badge badge-blue" id="treeTotalUnitsBadge">Live DB</span>
          </div>
          <div id="structureTreeContainer" style="display:flex;flex-direction:column;gap:3px;font-size:13px;">
            <div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">Loading structure hierarchy...</div>
          </div>
        </div>

        <!-- Units Table & Cards Panel -->
        <div class="structure-units-panel" id="structureUnitsPanel">
          <!-- Modern Table Toolbar matching reference image -->
          <div class="modern-table-toolbar">
            <div class="modern-table-count" id="unitsTableCount">Showing 1 to 10 of items</div>
            <div class="modern-table-search">
              <span>Search:</span>
              <input type="text" id="unitsSearchBox" class="cases-search-input" placeholder="" oninput="handleUnitsSearch(this.value)" />
            </div>
          </div>

          <div class="filter-bar" style="flex-wrap:wrap;gap:8px;">
            <div class="search-box" style="min-width:220px;flex:1;">
              <span class="search-icon">🔍</span>
              <input type="text" id="unitsSearchInput" placeholder="Search flat, owner, phone..." oninput="handleUnitsSearch(this.value)" />
            </div>
            <div id="unitsFilterPillsContainer" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <div class="filter-pill active" onclick="filterUnitsByBlock('ALL', this)">All</div>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-left:auto;" onclick="exportUnitsRegistry()">📊 Export</button>
          </div>

          <!-- Desktop Table Wrap -->
          <div class="table-wrap desktop-only-table">
            <table>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Owner / Primary Contact</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Dues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="unitsTableBody">
                <tr>
                  <td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">
                    Loading units from database...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards Container (Visible on mobile / responsive) -->
          <div id="unitsMobileCardsContainer" class="mobile-only-cards" style="display:none;flex-direction:column;gap:10px;margin-top:10px;">
            <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Loading units...</div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:8px;">
            <span id="unitsPaginationSummary">Showing units from database</span>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-secondary btn-sm" onclick="showToast('Showing all records', 'info')">Refresh</button>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

Screens['admin-units'] = Screens['admin-structure'];

// Dynamic Unit Detail Screen
Screens['admin-unit-detail'] = function() {
  const u = window.__selectedUnit || (window.__cachedUnits && window.__cachedUnits[0]) || {
    unitNumber: 'A-101',
    block: { name: 'Main Block' },
    unitType: 'FLAT_3BHK',
    occupancyStatus: 'OWNER_OCCUPIED',
    ownerName: 'Resident',
    ownerPhone: '',
    ownerEmail: '',
    floor: 1,
    areaSqft: 1950,
  };

  const statusObj = STATUS_LABELS[u.occupancyStatus] || { label: u.occupancyStatus || 'Occupied', color: 'blue' };
  const allInvoices = u.invoices || [];
  const unpaidInvoices = allInvoices.filter(i => (i.balanceAmount || 0) > 0);
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

  return Shell.render('admin-unit-detail', {
    title: `Unit ${u.unitNumber}`,
    portal: 'admin',
    breadcrumb: '<span onclick="Router.go(\'admin-structure\')" style="cursor:pointer;color:var(--blue);">Property Structure</span>',
    actions: `
      <button class="btn btn-secondary btn-sm" onclick="openEditUnitModal('${u.id}')">✏️ Edit Unit & Contacts</button>
      <button class="btn btn-primary btn-sm" onclick="Router.go('admin-invoices')">📄 View Bills</button>
    `,
    content: `
      <div class="detail-split-layout">
        <div>
          <!-- Unit Overview Card -->
          <div class="card" style="margin-bottom:20px;">
            <div class="unit-header-flex" style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;gap:14px;align-items:flex-start;">
                <div style="width:52px;height:52px;background:var(--blue-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🏠</div>
                <div>
                  <div style="font-size:22px;font-weight:800;color:var(--text-primary);">Unit ${u.unitNumber}</div>
                  <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
                    ${u.block ? u.block.name : 'Main Block'} · Floor ${u.floor || 1}
                  </div>
                  <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                    <span class="badge badge-blue">${u.unitType ? u.unitType.replace('_', ' ') : 'Flat'}</span>
                    <span class="badge badge-${statusObj.color}">${statusObj.label}</span>
                    <span class="badge badge-green">Registered</span>
                  </div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:24px;font-weight:800;color:${totalOutstanding > 0 ? 'var(--red)' : 'var(--green)'}">
                  ${totalOutstanding > 0 ? '₹' + totalOutstanding.toLocaleString('en-IN') : '₹0'}
                </div>
                <div style="font-size:12px;color:var(--text-muted);">${totalOutstanding > 0 ? `${unpaidInvoices.length} Unpaid Bill(s)` : 'All Dues Cleared'}</div>
              </div>
            </div>

            <div class="mini-grid-4">
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Super Area</div>
                <div style="font-size:14px;font-weight:700;">${u.areaSqft || 1200} sqft</div>
              </div>
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Floor Level</div>
                <div style="font-size:14px;font-weight:700;">Floor ${u.floor || 1}</div>
              </div>
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Occupancy</div>
                <div style="font-size:14px;font-weight:700;">${statusObj.label}</div>
              </div>
              <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Unit ID</div>
                <div style="font-size:12px;font-weight:600;font-family:monospace;">${(u.id || 'N/A').substring(0, 10)}...</div>
              </div>
            </div>

            <div style="margin-top:14px;display:flex;justify-content:flex-end;">
              <button class="btn btn-secondary btn-sm" onclick="openEditUnitModal('${u.id}')">✏️ Edit Unit Specifications</button>
            </div>
          </div>

          <!-- Residents & Occupants Tab Content -->
          <div class="card" style="margin-bottom:20px;">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div class="card-title">Registered Residents & Occupants</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Primary contacts registered for this unit in the society roster</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="openEditUnitModal('${u.id}')">✏️ Edit Contacts</button>
            </div>

            ${u.ownerName ? `
              <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:8px;">
                <div class="avatar blue">${(u.ownerName || 'O').split(' ').map(n=>n[0]).join('').substring(0, 2)}</div>
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;">
                    ${u.ownerName}
                    <span class="badge badge-green" style="font-size:10px;">Owner</span>
                    <span class="badge badge-blue" style="font-size:10px;">Primary</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;font-family:monospace;">
                    📱 ${u.ownerPhone || 'No phone registered'} ${u.ownerEmail ? `· 📧 ${u.ownerEmail}` : ''}
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditUnitModal('${u.id}')" title="Edit Owner">✏️</button>
              </div>
            ` : ''}

            ${u.tenantName ? `
              <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:8px;">
                <div class="avatar amber">${(u.tenantName || 'T').split(' ').map(n=>n[0]).join('').substring(0, 2)}</div>
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;">
                    ${u.tenantName}
                    <span class="badge badge-amber" style="font-size:10px;">Tenant</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;font-family:monospace;">
                    📱 ${u.tenantPhone || 'No phone registered'}
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditUnitModal('${u.id}')" title="Edit Tenant">✏️</button>
              </div>
            ` : ''}

            ${!u.ownerName && !u.tenantName ? `
              <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
                <em>No owner or resident currently added to this unit.</em>
                <div style="margin-top:10px;">
                  <button class="btn btn-secondary btn-sm" onclick="openEditUnitModal('${u.id}')">✏️ Add / Edit Owner & Residents</button>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- All Generated Bills & Dues Breakdown Card -->
          <div class="card" style="margin-bottom:20px;">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <div class="card-title">All Generated Bills & Dues (${allInvoices.length})</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Month-by-month billing and payment status for Unit ${u.unitNumber}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="openRecordPaymentModal('${u.unitNumber}', ${totalOutstanding})">💳 Record Payment</button>
            </div>

            ${allInvoices.length > 0 ? `
              <div class="table-wrap" style="margin-top:10px;">
                <table style="width:100%;font-size:13px;">
                  <thead>
                    <tr style="border-bottom:1px solid var(--border-light);">
                      <th style="padding:8px 10px;text-align:left;">Billing Month</th>
                      <th style="padding:8px 10px;text-align:left;">Invoice #</th>
                      <th style="padding:8px 10px;text-align:right;">Billed Amount</th>
                      <th style="padding:8px 10px;text-align:right;">Paid</th>
                      <th style="padding:8px 10px;text-align:right;">Outstanding Due</th>
                      <th style="padding:8px 10px;text-align:center;">Status</th>
                      <th style="padding:8px 10px;text-align:center;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allInvoices.map(inv => {
                      const isUnpaid = (inv.balanceAmount || 0) > 0;
                      const statusColor = inv.status === 'OVERDUE' ? 'red' : inv.status === 'PAID' ? 'green' : inv.status === 'PARTIALLY_PAID' ? 'amber' : 'blue';
                      return `
                        <tr style="border-bottom:1px solid var(--border-light);">
                          <td style="padding:8px 10px;font-weight:700;color:var(--text-primary);">${inv.billingMonth}</td>
                          <td style="padding:8px 10px;font-family:monospace;font-size:12px;color:var(--text-secondary);">${inv.invoiceNumber}</td>
                          <td style="padding:8px 10px;text-align:right;font-weight:600;">₹${(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                          <td style="padding:8px 10px;text-align:right;color:var(--green);font-weight:600;">₹${(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                          <td style="padding:8px 10px;text-align:right;font-weight:800;color:${isUnpaid ? 'var(--red)' : 'var(--green)'};">
                            ₹${(inv.balanceAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style="padding:8px 10px;text-align:center;">
                            <span class="badge badge-${statusColor}" style="font-size:10px;padding:2px 6px;">${inv.status}</span>
                          </td>
                          <td style="padding:8px 10px;text-align:center;">
                            ${isUnpaid ? `
                              <button class="btn btn-secondary btn-xs" onclick="openRecordPaymentModal('${u.unitNumber}', ${inv.balanceAmount || 0})">
                                Pay Due
                              </button>
                            ` : `
                              <span style="color:var(--green);font-size:12px;font-weight:600;">✓ Cleared</span>
                            `}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">
                No bills have been generated for this unit yet.
              </div>
            `}
          </div>
        </div>

        <!-- Right Panel Quick Actions -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">Billing & Accounts</div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px;">
              <span style="color:var(--text-secondary)">Total Outstanding</span>
              <strong style="color:${totalOutstanding > 0 ? 'var(--red)' : 'var(--green)'};font-size:15px;">
                ${totalOutstanding > 0 ? '₹' + totalOutstanding.toLocaleString('en-IN') : '₹0'}
              </strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:12px;">
              <span style="color:var(--text-secondary)">Pending Bills</span>
              <span style="font-weight:700;color:${unpaidInvoices.length > 0 ? 'var(--red)' : 'var(--green)'}">
                ${unpaidInvoices.length} bill(s)
              </span>
            </div>
            <button class="btn btn-primary w-full" style="margin-top:12px;justify-content:center;min-height:46px;" onclick="Router.go('admin-invoices')">
              📄 View Society Invoices
            </button>
            <button class="btn btn-secondary w-full" style="margin-top:8px;justify-content:center;min-height:46px;" onclick="openRecordPaymentModal('${u.unitNumber}', ${totalOutstanding})">
              💳 Record Payment
            </button>
          </div>

          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">Quick Operations</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <button class="btn btn-ghost w-full" style="justify-content:flex-start;min-height:44px;" onclick="openEditUnitModal('${u.id}')">
                ✏️ Edit Unit & Occupancy
              </button>
              <button class="btn btn-ghost w-full" style="justify-content:flex-start;min-height:44px;" onclick="showToast('Gate pass issued for Unit ${u.unitNumber}', 'success')">
                🛡️ Issue Visitor Pass
              </button>
              <button class="btn btn-ghost w-full" style="justify-content:flex-start;min-height:44px;" onclick="showToast('SMS reminder sent to ${u.ownerPhone || u.tenantPhone || 'resident'}', 'info')">
                📱 Send Direct SMS
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// Live Hydration Logic: Connects to /api/units
// =============================================
window.loadLiveUnitsScreen = async function() {
  try {
    const res = await (window.apiFetch || fetch)('/api/units').catch(() => null);
    if (!res || !res.ok) {
      console.error('Failed to fetch units from DB');
      return;
    }

    const data = await res.json();
    const units = data.units || [];
    const blocks = data.blocks || [];

    window.__cachedUnits = units;
    window.__cachedBlocks = blocks;

    // Update Subtitle & Badges
    const subtitleEl = document.getElementById('unitsSubtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `${units.length} total units registered across ${blocks.length} blocks · Live database`;
    }

    const mobBadge = document.getElementById('mobileUnitsCountBadge');
    if (mobBadge) mobBadge.textContent = units.length;

    const treeBadge = document.getElementById('treeTotalUnitsBadge');
    if (treeBadge) treeBadge.textContent = `${units.length} units`;

    // Render Structure Tree
    renderStructureTree(blocks, units);

    // Render Filter Pills
    renderFilterPills(blocks);

    // Render Analytics Graphs (Area Spline + Donut)
    window.renderUnitsAnalytics(units, blocks);

    // Render Table & Mobile Cards
    renderUnitsData(units);

  } catch (err) {
    console.error('Error in loadLiveUnitsScreen:', err);
  }
};

window.renderUnitsAnalytics = function(units, blocks) {
  units = units || [];
  blocks = blocks || [];

  // 1. Area Spline distribution by Block
  var labels = blocks.length ? blocks.map(function(b) { return b.name; }) : ['Block A', 'Block B', 'Block C', 'Block D', 'Tower 1', 'Tower 2', 'Penthouse'];
  var data = labels.map(function(bName) {
    return units.filter(function(u) { return (u.block && u.block.name === bName) || u.blockId === bName; }).length;
  });

  if (typeof window.renderModernAreaSplineChart === 'function') {
    window.renderModernAreaSplineChart({
      containerId: 'unitsAreaChartContainer',
      labels: labels,
      data: data,
      strokeColor: '#3B82F6',
      gradStart: '#60A5FA',
      gradEnd: '#DBEAFE',
      tooltipUnit: 'units',
    });
  }

  // 2. Occupancy Slices for Donut Chart
  var ownerCount = units.filter(function(u) { return u.occupancyStatus === 'OWNER_OCCUPIED' || (u.ownerName && !u.tenantName); }).length;
  var tenantCount = units.filter(function(u) { return u.occupancyStatus === 'TENANTED' || u.occupancyStatus === 'TENANT_OCCUPIED' || u.tenantName; }).length;
  var vacantCount = units.filter(function(u) { return u.occupancyStatus === 'VACANT' || (!u.ownerName && !u.tenantName); }).length;
  var otherCount = Math.max(0, units.length - ownerCount - tenantCount - vacantCount);

  var slices = [
    { label: 'Owner Occupied', count: ownerCount, color: '#3B82F6' },
    { label: 'Tenant Occupied', count: tenantCount, color: '#F59E0B' },
    { label: 'Vacant', count: vacantCount, color: '#94A3B8' },
  ];
  if (otherCount > 0) {
    slices.push({ label: 'Fitout / Dev', count: otherCount, color: '#10B981' });
  }

  if (typeof window.renderModernDonutChart === 'function') {
    window.renderModernDonutChart({
      containerId: 'unitsDonutChartContainer',
      slices: slices,
      centerCount: units.length,
      centerLabel: 'Units',
    });
  }

  var countEl = document.getElementById('unitsTableCount');
  if (countEl) {
    var total = units.length;
    var showing = Math.min(10, total);
    countEl.textContent = 'Showing 1 to ' + showing + ' of ' + total + ' items';
  }

  var subEl = document.getElementById('unitsDiffSubtitle');
  if (subEl) {
    if (units.length === 0) {
      subEl.textContent = '0% Total society occupancy · 0 units registered';
    } else {
      var occ = ownerCount + tenantCount;
      var pct = Math.round((occ / units.length) * 100);
      subEl.textContent = pct + '% Total society occupancy · ' + occ + ' of ' + units.length + ' occupied';
    }
  }
};

function renderStructureTree(blocks, units) {
  const container = document.getElementById('structureTreeContainer');
  if (!container) return;

  let html = `
    <div style="display:flex;align-items:center;gap:6px;padding:8px;border-radius:var(--r-sm);cursor:pointer;background:var(--blue-light);color:var(--blue);font-weight:700;" onclick="filterUnitsByBlock('ALL')">
      <span>🏘️</span>
      <span style="flex:1;">Society Registry</span>
      <span style="font-size:11px;color:var(--blue);">${units.length} units</span>
    </div>
  `;

  blocks.forEach(b => {
    const blockUnits = units.filter(u => u.blockId === b.id || (u.block && u.block.name === b.name));
    html += `
      <div style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--r-sm);cursor:pointer;color:var(--text-secondary);transition:all 0.12s;" 
        onclick="filterUnitsByBlock('${b.name}')"
        onmouseover="this.style.background='var(--bg-elevated)'"
        onmouseout="this.style.background='transparent'">
        <span>🏠</span>
        <span style="flex:1;font-weight:500;">${b.name}</span>
        <span style="font-size:11px;color:var(--text-muted);">${blockUnits.length}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderFilterPills(blocks) {
  const container = document.getElementById('unitsFilterPillsContainer');
  if (!container) return;

  let html = `<div class="filter-pill ${window.__selectedBlockFilter === 'ALL' ? 'active' : ''}" onclick="filterUnitsByBlock('ALL', this)">All (${window.__cachedUnits.length})</div>`;

  blocks.forEach(b => {
    const blockUnits = window.__cachedUnits.filter(u => u.blockId === b.id || (u.block && u.block.name === b.name));
    const isActive = window.__selectedBlockFilter === b.name;
    html += `<div class="filter-pill ${isActive ? 'active' : ''}" onclick="filterUnitsByBlock('${b.name}', this)">${b.name} (${blockUnits.length})</div>`;
  });

  html += `<div class="filter-pill ${window.__selectedBlockFilter === 'DUES' ? 'active' : ''}" onclick="filterUnitsByBlock('DUES', this)">⚠️ Has Dues</div>`;
  container.innerHTML = html;
}

window.filterUnitsByBlock = function(blockName, pillEl) {
  window.__selectedBlockFilter = blockName;

  // Update pills UI
  const pills = document.querySelectorAll('#unitsFilterPillsContainer .filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (pillEl) {
    pillEl.classList.add('active');
  }

  let filtered = window.__cachedUnits;
  if (blockName === 'DUES') {
    filtered = filtered.filter(u => (u.invoices || []).some(inv => (inv.balanceAmount || 0) > 0));
  } else if (blockName !== 'ALL') {
    filtered = filtered.filter(u => (u.block && u.block.name === blockName) || u.blockId === blockName);
  }

  renderUnitsData(filtered);
};

window.handleUnitsSearch = function(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    window.filterUnitsByBlock(window.__selectedBlockFilter);
    return;
  }

  const filtered = window.__cachedUnits.filter(u => {
    const num = (u.unitNumber || '').toLowerCase();
    const owner = (u.ownerName || '').toLowerCase();
    const phone = (u.ownerPhone || '').toLowerCase();
    const tenant = (u.tenantName || '').toLowerCase();
    const tPhone = (u.tenantPhone || '').toLowerCase();
    const block = (u.block?.name || '').toLowerCase();
    return num.includes(q) || owner.includes(q) || phone.includes(q) || tenant.includes(q) || tPhone.includes(q) || block.includes(q);
  });

  renderUnitsData(filtered);
};

function renderUnitsData(units) {
  const tbody = document.getElementById('unitsTableBody');
  const cardsContainer = document.getElementById('unitsMobileCardsContainer');
  const summaryEl = document.getElementById('unitsPaginationSummary');
  const countEl = document.getElementById('unitsTableCount');

  if (countEl) {
    const showing = Math.min(10, units.length);
    countEl.textContent = `Showing 1 to ${showing} of ${units.length} items`;
  }

  if (summaryEl) {
    summaryEl.textContent = `Showing ${units.length} of ${window.__cachedUnits.length} total units`;
  }

  if (!units || units.length === 0) {
    const emptyMsg = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">No units match the selected criteria.</td></tr>`;
    if (tbody) tbody.innerHTML = emptyMsg;
    if (cardsContainer) cardsContainer.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">No units found.</div>`;
    return;
  }

  // 1. Render Desktop Table Rows
  if (tbody) {
    tbody.innerHTML = units.map(u => {
      const blockName = u.block ? u.block.name : '—';
      const typeDisplay = u.unitType ? u.unitType.replace('_', ' ') : 'Flat';
      const statusPill = (u.occupancyStatus === 'VACANT' || (!u.ownerName && !u.tenantName))
        ? '<span class="pill-badge pill-priority-low">vacant</span>'
        : ((u.occupancyStatus === 'TENANTED' || u.occupancyStatus === 'TENANT_OCCUPIED' || u.tenantName)
          ? '<span class="pill-badge pill-status-in-progress">tenant</span>'
          : '<span class="pill-badge pill-status-new">owner</span>');

      // 1. Owner / Primary Contact Column (Clean text with name & role, NO button)
      let residentDisplayHtml = '';
      const hasOwner = !!(u.ownerName || u.ownerPhone);
      const hasTenant = !!(u.tenantName || u.tenantPhone);
      const hasUser = !!(u.users && u.users.length > 0);

      if (hasTenant && (u.occupancyStatus === 'TENANTED' || !hasOwner)) {
        residentDisplayHtml = `
          <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            <span>${u.tenantName || 'Tenant'}</span>
            <span class="badge badge-amber" style="font-size:9px;padding:1px 5px;">Tenant</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-family:monospace;">
            📱 ${u.tenantPhone || '—'}
          </div>
        `;
      } else if (hasOwner) {
        residentDisplayHtml = `
          <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            <span>${u.ownerName || 'Owner'}</span>
            <span class="badge badge-green" style="font-size:9px;padding:1px 5px;">Owner</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-family:monospace;">
            📱 ${u.ownerPhone || '—'}
          </div>
        `;
      } else if (hasUser) {
        const usr = u.users[0];
        residentDisplayHtml = `
          <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
            <span>${usr.name}</span>
            <span class="badge badge-blue" style="font-size:9px;padding:1px 5px;">Resident</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-family:monospace;">
            📱 ${usr.phone || '—'}
          </div>
        `;
      } else {
        residentDisplayHtml = `
          <span style="color:var(--text-muted);font-size:12px;font-style:italic;">No owner / resident yet added</span>
        `;
      }

      // 2. Dues Column: Shows dues on all generated bills separately by month with status
      const allInvoices = u.invoices || [];
      const unpaidInvoices = allInvoices.filter(inv => (inv.balanceAmount || 0) > 0);
      const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

      let duesHtml = '';
      if (totalDue === 0) {
        duesHtml = `
          <div>
            <span class="badge badge-green" style="font-size:11px;padding:2px 8px;">Nil Dues (₹0)</span>
            ${allInvoices.length > 0 ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px;">All bills cleared</div>` : ''}
          </div>
        `;
      } else {
        duesHtml = `
          <div>
            <div style="font-weight:800;font-size:14px;color:var(--red);margin-bottom:3px;display:flex;align-items:baseline;gap:4px;">
              <span>₹${totalDue.toLocaleString('en-IN')}</span>
              <span style="font-size:10px;font-weight:600;color:var(--text-muted);">(${unpaidInvoices.length} ${unpaidInvoices.length === 1 ? 'bill' : 'bills'})</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              ${unpaidInvoices.map(inv => {
                const isOverdue = inv.status === 'OVERDUE';
                const isPartial = inv.status === 'PARTIALLY_PAID';
                const badgeColor = isOverdue ? 'red' : isPartial ? 'amber' : 'blue';
                return `
                  <div style="font-size:11px;display:flex;align-items:center;gap:5px;white-space:nowrap;line-height:1.2;">
                    <span style="font-weight:600;color:var(--text-secondary);">${inv.billingMonth}:</span>
                    <span style="font-weight:700;color:var(--text-primary);">₹${(inv.balanceAmount || 0).toLocaleString('en-IN')}</span>
                    <span class="badge badge-${badgeColor}" style="font-size:9px;padding:1px 4px;font-weight:700;">${inv.status}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      // 3. Action Column: Clear dedicated button to open unit detail page
      return `
        <tr onclick="viewUnitDetail('${u.id}')" style="cursor:pointer;">
          <td><strong style="color:var(--text-primary);font-size:14px;">${u.unitNumber}</strong></td>
          <td><span class="badge badge-muted">${blockName}</span></td>
          <td><span style="font-size:12px;color:var(--text-secondary);">${typeDisplay}</span></td>
          <td>${residentDisplayHtml}</td>
          <td>${u.areaSqft || 1200} sqft</td>
          <td>${statusPill}</td>
          <td>${duesHtml}</td>
          <td onclick="event.stopPropagation()">
            <button type="button" class="btn btn-secondary btn-sm" onclick="viewUnitDetail('${u.id}')" style="font-size:12px;font-weight:700;padding:6px 12px;border-radius:var(--r-md);white-space:nowrap;display:inline-flex;align-items:center;gap:6px;">
              <span>Open Details</span>
              <span style="font-size:13px;">→</span>
            </button>
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

    cardsContainer.innerHTML = units.map(u => {
      const s = STATUS_LABELS[u.occupancyStatus] || { label: u.occupancyStatus || 'Occupied', color: 'blue' };
      const blockName = u.block ? u.block.name : '—';
      const allInvoices = u.invoices || [];
      const unpaidInvoices = allInvoices.filter(inv => (inv.balanceAmount || 0) > 0);
      const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

      const residentTitle = u.tenantName ? `${u.tenantName} (Tenant)` : u.ownerName ? `${u.ownerName} (Owner)` : (u.users && u.users[0]?.name) ? `${u.users[0].name}` : 'No owner / resident yet added';
      const residentContact = u.tenantPhone || u.ownerPhone || (u.users && u.users[0]?.phone) || '';

      return `
        <div class="card card-sm" style="display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);cursor:pointer;" onclick="viewUnitDetail('${u.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;font-weight:800;color:var(--text-primary);">Unit ${u.unitNumber}</span>
              <span class="badge badge-muted" style="font-size:11px;">${blockName}</span>
            </div>
            <span class="badge badge-${s.color}">${s.label}</span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:flex-start;font-size:13px;">
            <div>
              <div style="font-weight:600;color:var(--text-primary);">${residentTitle}</div>
              ${residentContact ? `<div style="font-size:12px;color:var(--text-muted);font-family:monospace;">📱 ${residentContact}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:800;color:${totalDue > 0 ? 'var(--red)' : 'var(--green)'}">
                ${totalDue > 0 ? '₹' + totalDue.toLocaleString('en-IN') : '₹0'}
              </div>
              <div style="font-size:11px;color:var(--text-muted);">${totalDue > 0 ? `${unpaidInvoices.length} bill(s) due` : 'Cleared'}</div>
            </div>
          </div>

          <!-- Dues month-by-month breakdown on mobile if due -->
          ${unpaidInvoices.length > 0 ? `
            <div style="background:var(--bg-elevated);padding:8px 10px;border-radius:var(--r-sm);font-size:11px;display:flex;flex-direction:column;gap:3px;">
              ${unpaidInvoices.map(inv => `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:600;color:var(--text-secondary);">${inv.billingMonth}:</span>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-weight:700;color:var(--red);">₹${(inv.balanceAmount || 0).toLocaleString('en-IN')}</span>
                    <span class="badge badge-${inv.status === 'OVERDUE' ? 'red' : 'blue'}" style="font-size:8px;padding:0px 4px;">${inv.status}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;margin-top:2px;border-top:1px solid var(--border-light);padding-top:8px;" onclick="event.stopPropagation()">
            <button class="btn btn-primary btn-sm" style="flex:1;min-height:44px;justify-content:center;font-weight:700;" onclick="viewUnitDetail('${u.id}')">
              Open Unit Details →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.viewUnitDetail = function(unitId) {
  const u = window.__cachedUnits.find(unit => unit.id === unitId);
  if (u) {
    window.__selectedUnit = u;
    Router.go('admin-unit-detail');
  }
};

window.openAddUnitModal = function() {
  const blocks = window.__cachedBlocks || [];
  const blockOptions = blocks.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  const html = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label class="form-label">Unit / Flat Number *</label>
        <input type="text" id="newUnitNumber" class="form-input" placeholder="e.g. A-101, B-402, Villa 12" style="width:100%;font-size:16px;" required />
      </div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Block / Tower</label>
          <select id="newUnitBlockId" class="form-select" style="width:100%;font-size:15px;">
            ${blockOptions || '<option value="">Main Block</option>'}
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label">Unit Type</label>
          <select id="newUnitType" class="form-select" style="width:100%;font-size:15px;">
            <option value="FLAT_2BHK">2 BHK Flat</option>
            <option value="FLAT_3BHK">3 BHK Flat</option>
            <option value="FLAT_4BHK">4 BHK Flat</option>
            <option value="VILLA">Villa</option>
            <option value="PENTHOUSE">Penthouse</option>
            <option value="SHOP">Commercial Shop</option>
            <option value="PLOT">Residential Plot</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Floor</label>
          <input type="number" id="newUnitFloor" class="form-input" value="1" style="width:100%;font-size:16px;" />
        </div>
        <div style="flex:1;">
          <label class="form-label">Area (sqft)</label>
          <input type="number" id="newUnitArea" class="form-input" placeholder="1250" style="width:100%;font-size:16px;" />
        </div>
      </div>
      <div>
        <label class="form-label">Occupancy Status</label>
        <select id="newUnitOccupancy" class="form-select" style="width:100%;font-size:15px;">
          <option value="OWNER_OCCUPIED">Owner Occupied</option>
          <option value="TENANTED">Tenanted</option>
          <option value="VACANT">Vacant</option>
          <option value="UNDER_CONSTRUCTION">Under Construction</option>
        </select>
      </div>
      <div style="border-top:1px solid var(--border-light);padding-top:10px;">
        <label class="form-label">Owner Full Name</label>
        <input type="text" id="newUnitOwnerName" class="form-input" placeholder="e.g. Gurpreet Singh" style="width:100%;font-size:16px;" />
      </div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Owner Mobile</label>
          <input type="tel" id="newUnitOwnerPhone" class="form-input" placeholder="9812345678" style="width:100%;font-size:16px;" />
        </div>
        <div style="flex:1;">
          <label class="form-label">Owner Email</label>
          <input type="email" id="newUnitOwnerEmail" class="form-input" placeholder="owner@gmail.com" style="width:100%;font-size:16px;" />
        </div>
      </div>
    </div>
  `;

  showModal('Add Unit to Society Registry', html, 'Create Unit', async () => {
    const unitNumber = document.getElementById('newUnitNumber').value.trim();
    if (!unitNumber) {
      showToast('Unit number is required', 'warning');
      return;
    }

    const blockId = document.getElementById('newUnitBlockId').value;
    const unitType = document.getElementById('newUnitType').value;
    const floor = document.getElementById('newUnitFloor').value;
    const areaSqft = document.getElementById('newUnitArea').value;
    const occupancyStatus = document.getElementById('newUnitOccupancy').value;
    const ownerName = document.getElementById('newUnitOwnerName').value.trim();
    const ownerPhone = document.getElementById('newUnitOwnerPhone').value.trim();
    const ownerEmail = document.getElementById('newUnitOwnerEmail').value.trim();

    try {
      const res = await (window.apiFetch || fetch)('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitNumber,
          blockId: blockId || undefined,
          unitType,
          floor,
          areaSqft,
          occupancyStatus,
          ownerName,
          ownerPhone,
          ownerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to create unit', 'warning');
        return;
      }

      showToast(`Unit ${unitNumber} added to registry!`, 'success');
      window.loadLiveUnitsScreen();
    } catch (err) {
      console.error('Error creating unit:', err);
      showToast('Network error creating unit', 'warning');
    }
  });
};

window.openEditUnitModal = function(unitId) {
  const u = (window.__cachedUnits && window.__cachedUnits.find(unit => unit.id === unitId)) || window.__selectedUnit;
  if (!u) return;

  const blocks = window.__cachedBlocks || [];
  const currentBlockId = u.blockId || (u.block ? u.block.id : '');
  const blockOptions = blocks.length > 0 
    ? blocks.map(b => `<option value="${b.id}" ${b.id === currentBlockId ? 'selected' : ''}>${b.name}</option>`).join('')
    : (u.block ? `<option value="${u.block.id}" selected>${u.block.name}</option>` : '<option value="">Main Block</option>');

  const currentType = u.unitType || 'FLAT_2BHK';

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:72vh;overflow-y:auto;padding-right:4px;">
      <!-- Section 1: Unit Identification & Specs -->
      <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);border:1px solid var(--border-light);">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
          🏢 Unit Specifications
        </div>
        <div style="display:flex;gap:10px;margin-bottom:8px;">
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Unit / Flat Number *</label>
            <input type="text" id="editUnitNumber" class="form-input" value="${u.unitNumber || ''}" style="width:100%;font-size:15px;font-weight:700;" required />
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Block / Tower</label>
            <select id="editUnitBlockId" class="form-select" style="width:100%;font-size:14px;">
              ${blockOptions}
            </select>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:8px;">
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Unit Type</label>
            <select id="editUnitType" class="form-select" style="width:100%;font-size:14px;">
              <option value="FLAT_1BHK" ${currentType === 'FLAT_1BHK' ? 'selected' : ''}>1 BHK Flat</option>
              <option value="FLAT_2BHK" ${currentType === 'FLAT_2BHK' ? 'selected' : ''}>2 BHK Flat</option>
              <option value="FLAT_3BHK" ${currentType === 'FLAT_3BHK' ? 'selected' : ''}>3 BHK Flat</option>
              <option value="FLAT_4BHK" ${currentType === 'FLAT_4BHK' ? 'selected' : ''}>4 BHK Flat</option>
              <option value="VILLA" ${currentType === 'VILLA' ? 'selected' : ''}>Villa</option>
              <option value="PENTHOUSE" ${currentType === 'PENTHOUSE' ? 'selected' : ''}>Penthouse</option>
              <option value="SHOP" ${currentType === 'SHOP' ? 'selected' : ''}>Commercial Shop</option>
              <option value="PLOT" ${currentType === 'PLOT' ? 'selected' : ''}>Residential Plot</option>
            </select>
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Occupancy</label>
            <select id="editUnitOccupancy" class="form-select" style="width:100%;font-size:14px;">
              <option value="OWNER_OCCUPIED" ${u.occupancyStatus === 'OWNER_OCCUPIED' ? 'selected' : ''}>Owner Occupied</option>
              <option value="TENANTED" ${u.occupancyStatus === 'TENANTED' ? 'selected' : ''}>Tenanted</option>
              <option value="VACANT" ${u.occupancyStatus === 'VACANT' ? 'selected' : ''}>Vacant</option>
              <option value="UNDER_CONSTRUCTION" ${u.occupancyStatus === 'UNDER_CONSTRUCTION' ? 'selected' : ''}>Under Construction</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Floor Level</label>
            <input type="number" id="editUnitFloor" class="form-input" value="${u.floor !== null && u.floor !== undefined ? u.floor : 1}" style="width:100%;font-size:14px;" />
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Super Area (sqft)</label>
            <input type="number" id="editUnitArea" class="form-input" value="${u.areaSqft || ''}" placeholder="1250" style="width:100%;font-size:14px;" />
          </div>
        </div>
      </div>

      <!-- Section 2: Owner Details -->
      <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);border:1px solid var(--border-light);">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
          👤 Owner Information
        </div>
        <div style="margin-bottom:8px;">
          <label class="form-label" style="font-size:12px;">Owner Full Name</label>
          <input type="text" id="editUnitOwnerName" class="form-input" value="${u.ownerName || ''}" placeholder="Full name of flat owner" style="width:100%;font-size:15px;" />
        </div>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Owner Mobile</label>
            <input type="tel" id="editUnitOwnerPhone" class="form-input" value="${u.ownerPhone || ''}" placeholder="9812345678" style="width:100%;font-size:15px;" />
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Owner Email</label>
            <input type="email" id="editUnitOwnerEmail" class="form-input" value="${u.ownerEmail || ''}" placeholder="owner@gmail.com" style="width:100%;font-size:15px;" />
          </div>
        </div>
      </div>

      <!-- Section 3: Tenant Details -->
      <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);border:1px solid var(--border-light);">
        <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
          🔑 Tenant Information (If rented out)
        </div>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Tenant Full Name</label>
            <input type="text" id="editUnitTenantName" class="form-input" value="${u.tenantName || ''}" placeholder="Current occupant / tenant" style="width:100%;font-size:15px;" />
          </div>
          <div style="flex:1;">
            <label class="form-label" style="font-size:12px;">Tenant Mobile</label>
            <input type="tel" id="editUnitTenantPhone" class="form-input" value="${u.tenantPhone || ''}" placeholder="Tenant phone number" style="width:100%;font-size:15px;" />
          </div>
        </div>
      </div>
    </div>
  `;

  showModal(`Edit Unit ${u.unitNumber}`, html, 'Save All Changes', async () => {
    const unitNumber = document.getElementById('editUnitNumber').value.trim();
    if (!unitNumber) {
      showToast('Unit number cannot be empty', 'warning');
      return;
    }

    const blockId = document.getElementById('editUnitBlockId').value;
    const unitType = document.getElementById('editUnitType').value;
    const floor = document.getElementById('editUnitFloor').value;
    const areaSqft = document.getElementById('editUnitArea').value;
    const occupancyStatus = document.getElementById('editUnitOccupancy').value;
    const ownerName = document.getElementById('editUnitOwnerName').value.trim();
    const ownerPhone = document.getElementById('editUnitOwnerPhone').value.trim();
    const ownerEmail = document.getElementById('editUnitOwnerEmail').value.trim();
    const tenantName = document.getElementById('editUnitTenantName').value.trim();
    const tenantPhone = document.getElementById('editUnitTenantPhone').value.trim();

    try {
      const res = await (window.apiFetch || fetch)('/api/units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: u.id,
          unitNumber,
          blockId: blockId || undefined,
          unitType,
          floor,
          areaSqft,
          occupancyStatus,
          ownerName,
          ownerPhone,
          ownerEmail,
          tenantName,
          tenantPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to update unit', 'warning');
        return;
      }

      showToast(`Unit ${unitNumber} updated successfully!`, 'success');
      
      // Update local memory caches
      if (window.__cachedUnits) {
        const idx = window.__cachedUnits.findIndex(unit => unit.id === u.id);
        if (idx !== -1) {
          window.__cachedUnits[idx] = { ...window.__cachedUnits[idx], ...data.unit };
        }
      }
      if (window.__selectedUnit && window.__selectedUnit.id === u.id) {
        window.__selectedUnit = { ...window.__selectedUnit, ...data.unit };
        if (typeof Router !== 'undefined' && Router.current() === 'admin-unit-detail') {
          Router.go('admin-unit-detail');
        }
      }

      if (typeof window.loadLiveUnitsScreen === 'function') {
        window.loadLiveUnitsScreen();
      }
    } catch (err) {
      console.error('Error updating unit:', err);
      showToast('Network error updating unit', 'warning');
    }
  });
};

window.exportUnitsRegistry = function() {
  if (!window.__cachedUnits || window.__cachedUnits.length === 0) {
    showToast('No units to export', 'warning');
    return;
  }

  const rows = [
    ['Unit Number', 'Block', 'Type', 'Floor', 'Area Sqft', 'Status', 'Owner Name', 'Owner Phone', 'Owner Email'],
    ...window.__cachedUnits.map(u => [
      u.unitNumber,
      u.block ? u.block.name : '',
      u.unitType || '',
      u.floor || 1,
      u.areaSqft || '',
      u.occupancyStatus || '',
      u.ownerName || '',
      u.ownerPhone || '',
      u.ownerEmail || '',
    ])
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Society_Units_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Units registry exported successfully!', 'success');
};

window.setStructureMobileTab = function(tab) {
  const treePanel = document.getElementById('structureTreePanel');
  const unitsPanel = document.getElementById('structureUnitsPanel');
  const btnTree = document.getElementById('btnTreeTab');
  const btnUnits = document.getElementById('btnUnitsTab');
  if (!treePanel || !unitsPanel) return;
  if (tab === 'tree') {
    treePanel.style.display = 'block';
    unitsPanel.style.display = 'none';
    if (btnTree) btnTree.classList.add('active');
    if (btnUnits) btnUnits.classList.remove('active');
  } else {
    treePanel.style.display = 'none';
    unitsPanel.style.display = 'block';
    if (btnUnits) btnUnits.classList.add('active');
    if (btnTree) btnTree.classList.remove('active');
  }
};

// =============================================
// Excel / CSV Society Roster Import Engine
// =============================================

window.downloadUnitsImportTemplate = function() {
  const headers = [
    'Unit Number',
    'Block / Tower',
    'Floor',
    'BHK Type',
    'Area (sqft)',
    'Occupancy Status',
    'Owner Name',
    'Owner Phone',
    'Owner Email',
    'Tenant Name',
    'Tenant Phone'
  ];

  const sampleRows = [
    ['A-101', 'Tower A', '1', '3BHK', '1950', 'Owner Occupied', 'Ramesh Gupta', '9876543210', 'ramesh@example.com', '', ''],
    ['A-102', 'Tower A', '1', '3BHK', '1950', 'Tenanted', 'Vikas Sethi', '9811223344', 'vikas@example.com', 'Rohit Sharma', '9822334455'],
    ['B-201', 'Tower B', '2', '2BHK', '1250', 'Owner Occupied', 'Pooja Verma', '9833445566', 'pooja@example.com', '', ''],
    ['B-202', 'Tower B', '2', '2BHK', '1250', 'Vacant', '', '', '', '', ''],
  ];

  const csv = [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'RWA_Society_Roster_Import_Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Sample roster template downloaded', 'info');
};

window.__parsedImportUnits = [];

window.openImportUnitsModal = function() {
  window.__parsedImportUnits = [];

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- Instruction Banner -->
      <div style="background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.2);padding:12px 14px;border-radius:var(--r-md);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="font-size:12px;color:var(--text-secondary);max-width:380px;line-height:1.4;">
          <strong>Quick Onboarding:</strong> Upload your society roster sheet. Mobile numbers listed will be automatically enabled for instant resident OTP login!
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.downloadUnitsImportTemplate()" style="font-size:11px;font-weight:700;">
          📄 Download Template (.csv)
        </button>
      </div>

      <!-- File Upload Dropzone -->
      <div id="unitsDropzone" style="border:2px dashed var(--border);border-radius:var(--r-md);padding:24px 16px;text-align:center;cursor:pointer;background:var(--bg-elevated);transition:all 0.15s;" onclick="document.getElementById('unitsFileInput').click()">
        <div style="font-size:28px;margin-bottom:6px;">📊</div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">
          Choose or Drag & Drop Excel / CSV File
        </div>
        <div style="font-size:12px;color:var(--text-muted);">
          Supported formats: .csv, .txt (Comma separated spreadsheet export)
        </div>
        <input type="file" id="unitsFileInput" accept=".csv,.txt" style="display:none;" onchange="window.handleUnitsFileSelected(this)" />
      </div>

      <!-- Options -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--bg-surface);padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;cursor:pointer;">
          <input type="checkbox" id="importUpdateExisting" checked style="accent-color:var(--blue);" />
          <span>Update existing flats if flat number matches</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;cursor:pointer;">
          <input type="checkbox" id="importCreateAccounts" checked style="accent-color:var(--blue);" />
          <span>Auto-create resident accounts for phone numbers</span>
        </label>
      </div>

      <!-- Live Preview Container -->
      <div id="importUnitsPreviewWrap" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:var(--text-primary);">Previewing Parsed Records:</span>
          <span class="badge badge-green" id="importUnitsCountBadge">0 Flats Found</span>
        </div>
        <div style="max-height:160px;overflow-y:auto;border:1px solid var(--border-light);border-radius:var(--r-sm);background:var(--bg-elevated);">
          <table style="width:100%;font-size:11px;border-collapse:collapse;">
            <thead>
              <tr style="background:var(--bg-surface);text-align:left;">
                <th style="padding:6px 10px;">Unit</th>
                <th style="padding:6px 10px;">Block</th>
                <th style="padding:6px 10px;">BHK</th>
                <th style="padding:6px 10px;">Owner</th>
                <th style="padding:6px 10px;">Mobile</th>
                <th style="padding:6px 10px;">Status</th>
              </tr>
            </thead>
            <tbody id="importUnitsPreviewBody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  showModal('📥 Import Society Roster (Excel / CSV)', html, 'Start Batch Import 🚀', async () => {
    if (!window.__parsedImportUnits || window.__parsedImportUnits.length === 0) {
      showToast('Please select a valid CSV file with society flats first', 'warning');
      return;
    }

    const updateExisting = document.getElementById('importUpdateExisting')?.checked ?? true;
    const createAccounts = document.getElementById('importCreateAccounts')?.checked ?? true;

    showToast(`Importing ${window.__parsedImportUnits.length} flats to society registry...`, 'info');

    try {
      const res = await (window.apiFetch || fetch)('/api/units/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: window.__parsedImportUnits,
          updateExisting,
          createAccounts,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import roster');
      }

      showToast(`✅ ${data.message}`, 'success');
      window.loadLiveUnitsScreen();
    } catch (err) {
      console.error('Error importing roster:', err);
      showToast(err.message || 'Import failed. Check CSV format.', 'error');
    }
  }, '560px');
};

window.handleUnitsFileSelected = function(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseUnitsCsv(text);
  };
  reader.readAsText(file);
};

function parseUnitsCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    showToast('File appears to be empty or missing data rows', 'warning');
    return;
  }

  const parseCsvRow = (rowStr) => {
    const arr = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        insideQuotes = !insideQuotes;
      } else if (c === ',' && !insideQuotes) {
        arr.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += c;
      }
    }
    arr.push(entry.trim().replace(/^"|"$/g, ''));
    return arr;
  };

  const header = parseCsvRow(lines[0]).map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i]);
    if (cols.length === 0 || !cols.some(c => c)) continue;

    const rowObj = {};
    cols.forEach((val, idx) => {
      const colName = header[idx] || `col${idx}`;
      if (colName.includes('unit') || colName.includes('flat')) rowObj.unitNumber = val;
      else if (colName.includes('block') || colName.includes('tower')) rowObj.blockName = val;
      else if (colName.includes('floor')) rowObj.floor = val;
      else if (colName.includes('type') || colName.includes('bhk')) rowObj.unitType = val;
      else if (colName.includes('area') || colName.includes('sqft')) rowObj.areaSqft = val;
      else if (colName.includes('occupan') || colName.includes('status')) rowObj.occupancyStatus = val;
      else if (colName.includes('ownername') || colName.includes('owner')) rowObj.ownerName = val;
      else if (colName.includes('ownerphone') || colName.includes('phone') || colName.includes('mobile')) rowObj.ownerPhone = val;
      else if (colName.includes('owneremail') || colName.includes('email')) rowObj.ownerEmail = val;
      else if (colName.includes('tenantname') || colName.includes('tenant')) rowObj.tenantName = val;
      else if (colName.includes('tenantphone')) rowObj.tenantPhone = val;
    });

    if (rowObj.unitNumber) {
      parsed.push(rowObj);
    }
  }

  window.__parsedImportUnits = parsed;

  const previewWrap = document.getElementById('importUnitsPreviewWrap');
  const previewBody = document.getElementById('importUnitsPreviewBody');
  const countBadge = document.getElementById('importUnitsCountBadge');

  if (previewWrap) previewWrap.style.display = 'block';
  if (countBadge) countBadge.textContent = `${parsed.length} Flats Found`;

  if (previewBody) {
    previewBody.innerHTML = parsed.slice(0, 5).map(p => `
      <tr style="border-bottom:1px solid var(--border-light);">
        <td style="padding:6px 10px;font-weight:700;">${p.unitNumber}</td>
        <td style="padding:6px 10px;">${p.blockName || 'Main'}</td>
        <td style="padding:6px 10px;">${p.unitType || 'Flat'}</td>
        <td style="padding:6px 10px;">${p.ownerName || '—'}</td>
        <td style="padding:6px 10px;">${p.ownerPhone || '—'}</td>
        <td style="padding:6px 10px;"><span class="badge badge-green" style="font-size:9px;">${p.occupancyStatus || 'Owner'}</span></td>
      </tr>
    `).join('');
  }

  showToast(`Parsed ${parsed.length} units from file`, 'success');
};
