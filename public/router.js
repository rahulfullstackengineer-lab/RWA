// =============================================
// Global Screens Registry & Router
// =============================================
window.Screens = window.Screens || {};
var Screens = window.Screens;

var Router = (() => {
  let _current = null;
  let _params  = {};
  const _listeners = [];

  function isPlatformSuperAdmin() {
    try {
      const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('rwa_user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const phone = user?.phone || (typeof localStorage !== 'undefined' ? localStorage.getItem('rwa_login_phone') : '') || '';
      return (user && user.role === 'PLATFORM_ADMIN') || phone === '8219587657';
    } catch (e) {
      return false;
    }
  }

  function go(screen, params = {}) {
    // Normalization / Aliases
    if (screen === 'admin-communication') {
      screen = 'admin-notices';
    }

    // Security Guard: Platform Super-Admin is strictly restricted to 8219587657
    if (screen && screen.startsWith('platform-')) {
      if (!isPlatformSuperAdmin()) {
        if (typeof showToast === 'function') {
          showToast('🚫 Access Denied: Platform Super-Admin is restricted to 8219587657 only.', 'warning');
        }
        const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('rwa_user') : null;
        let u = null;
        try { u = userStr ? JSON.parse(userStr) : null; } catch (e) {}
        screen = u?.role === 'RESIDENT' ? 'resident-dashboard' : (u ? 'admin-dashboard' : 'auth-login');
      }
    }

    _current = screen;
    _params  = params;
    _listeners.forEach(fn => fn(screen, params));
  }

  function refresh() {
    if (_current) {
      go(_current, _params);
    }
  }

  function onNavigate(fn) { _listeners.push(fn); }
  function current()  { return _current; }
  function params()   { return _params; }

  return { go, refresh, onNavigate, current, params, isPlatformSuperAdmin };
})();
window.Router = Router;

// Authenticated fetch wrapper for API communication
window.apiFetch = function(url, options = {}) {
  const token = localStorage.getItem('rwa_token');
  const orgId = localStorage.getItem('rwa_active_org_id');
  const headers = Object.assign({}, options.headers || {});
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  if (orgId && !headers['x-active-org-id']) {
    headers['x-active-org-id'] = orgId;
  }
  return fetch(url, Object.assign({}, options, { headers }));
};

// =============================================
// Shared shell builder & SVG Icon Library
// =============================================
function getSidebarIcon(iconName) {
  const icons = {
    home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    orders: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    docs: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    map: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    stats: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
    inbox: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    finance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
    payments: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="6" cy="15" r="1.5"/></svg>`,
    dues: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    ledger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    expenses: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    notices: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    broadcasts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>`,
    polls: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    tickets: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`,
    meetings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    committee: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 22 7 12 2"/><line x1="2" y1="22" x2="22" y2="22"/><line x1="5" y1="18" x2="5" y2="7"/><line x1="19" y1="18" x2="19" y2="7"/><line x1="10" y1="18" x2="10" y2="7"/><line x1="14" y1="18" x2="14" y2="7"/></svg>`,
    compliance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    vendors: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    staff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
    assets: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    amenities: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1"/><path d="M2 16c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 5 1"/><path d="M6 12a4 4 0 1 1 8 0v4"/></svg>`,
    vehicles: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    audit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    help: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    link: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    diamond: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>`,
    building: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/></svg>`,
    mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    phone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
  };
  return icons[iconName] || icons.home;
}
window.getSidebarIcon = getSidebarIcon;

var Shell = (() => {

  function adminNav(active) {
    const sections = [
      {
        label: 'Overview',
        items: [
          { id: 'admin-dashboard', icon: 'home', label: 'Dashboard' },
          { id: 'admin-audit', icon: 'audit', label: 'Audit Trail' },
        ]
      },
      {
        label: 'Property',
        items: [
          { id: 'admin-units', icon: 'building', label: 'Units' },
        ]
      },
      {
        label: 'People',
        items: [
          { id: 'admin-members', icon: 'users', label: 'Committee & Members', badge: '…', badgeId: 'sidebarBadgeMembers' },
          { id: 'admin-vehicles', icon: 'vehicles', label: 'Vehicles' },
        ]
      },
      {
        label: 'Finance',
        items: [
          { id: 'admin-charges', icon: 'settings', label: 'Charge Setup' },
          { id: 'admin-invoices', icon: 'finance', label: 'Invoices & Bills' },
          { id: 'admin-payments', icon: 'payments', label: 'Payments' },
          { id: 'admin-dues', icon: 'dues', label: 'Dues & Defaulters', badge: '…', badgeId: 'sidebarBadgeDues', badgeColor: 'red' },
          { id: 'admin-ledger', icon: 'ledger', label: 'Ledger' },
          { id: 'admin-expenses', icon: 'expenses', label: 'Expenses' },
          { id: 'admin-reports', icon: 'stats', label: 'Reports' },
          { id: 'admin-receivables', icon: 'finance', label: 'External Receivables' },
        ]
      },
      {
        label: 'Communication',
        items: [
          { id: 'admin-notifications', icon: 'inbox', label: 'Inbox', badge: '0', badgeId: 'sidebarBadgeInbox', hasDot: true },
          { id: 'admin-notices', icon: 'notices', label: 'Notices' },
          { id: 'admin-broadcasts', icon: 'broadcasts', label: 'Broadcasts' },
          { id: 'admin-polls', icon: 'polls', label: 'Polls' },
        ]
      },
      {
        label: 'Complaints',
        items: [
          { id: 'admin-complaints', icon: 'tickets', label: 'Complaints', badge: '…', badgeId: 'sidebarBadgeComplaints', badgeColor: 'red' },
        ]
      },
      {
        label: 'Governance',
        items: [
          { id: 'admin-meetings', icon: 'meetings', label: 'Meetings' },
          { id: 'admin-committee', icon: 'committee', label: 'Committee & Elections' },
        ]
      },
      {
        label: 'Documents',
        items: [
          { id: 'admin-compliance', icon: 'compliance', label: 'Compliance Calendar' },
        ]
      },
      {
        label: 'Operations',
        items: [
          { id: 'admin-entry-passes', icon: 'shield', label: 'Visitor Passes', badge: 'GATE', badgeColor: 'blue' },
          { id: 'admin-duty', icon: 'calendar', label: 'Duty Management', badge: 'LIVE', badgeColor: 'green' },
          { id: 'admin-emergency', icon: 'shield', label: 'Emergency Contacts', badge: 'SOS', badgeColor: 'red' },
          { id: 'admin-vendors', icon: 'vendors', label: 'Vendors & Contracts' },
          { id: 'admin-staff', icon: 'staff', label: 'Staff' },
          { id: 'admin-assets', icon: 'assets', label: 'Assets' },
          { id: 'admin-amenities', icon: 'amenities', label: 'Amenities' },
        ]
      },
      {
        label: 'Settings',
        items: [
          { id: 'admin-settings', icon: 'settings', label: 'Settings' },
          { id: 'admin-subscription', icon: 'diamond', label: 'Subscription' },
        ]
      }
    ];

    return sections.map(s => `
      <div class="nav-section-wrap">
        <div class="nav-section-label">${s.label}</div>
        ${s.items.map(i => `
          <div class="nav-item ${active === i.id ? 'active' : ''}" onclick="Router.go('${i.id}')" data-nav-id="${i.id}">
            <span class="nav-icon">
              ${getSidebarIcon(i.icon)}
              ${i.hasDot ? `<span class="nav-icon-dot"></span>` : ''}
            </span>
            <span>${i.label}</span>
            ${i.badge ? `<span class="nav-badge ${i.badgeColor || ''}" ${i.badgeId ? `id="${i.badgeId}"` : ''}>${i.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function residentNav(active) {
    const sections = [
      {
        label: 'Main',
        items: [
          { id: 'resident-dashboard', icon: 'home', label: 'Home' },
          { id: 'resident-bills', icon: 'orders', label: 'Orders & Bills' },
          { id: 'resident-amenities', icon: 'map', label: 'Map & Amenities' },
          { id: 'resident-ledger', icon: 'stats', label: 'Statistics & Ledger' },
        ]
      },
      {
        label: 'Communication',
        items: [
          { id: 'resident-notices', icon: 'inbox', label: 'Inbox', badge: '9+', hasDot: true },
          { id: 'resident-complaints', icon: 'tickets', label: 'Tickets & Complaints' },
          { id: 'resident-polls', icon: 'polls', label: 'Community Polls' },
          { id: 'resident-meetings', icon: 'meetings', label: 'Society Meetings' },
          { id: 'resident-payments', icon: 'payments', label: 'Payment Receipts' },
        ]
      }
    ];

    return sections.map(s => `
      <div class="nav-section-wrap">
        <div class="nav-section-label">${s.label}</div>
        ${s.items.map(i => `
          <div class="nav-item ${active === i.id ? 'active' : ''}" onclick="Router.go('${i.id}')" data-nav-id="${i.id}">
            <span class="nav-icon">
              ${getSidebarIcon(i.icon)}
              ${i.hasDot ? `<span class="nav-icon-dot"></span>` : ''}
            </span>
            <span>${i.label}</span>
            ${i.badge ? `<span class="nav-badge ${i.badgeColor || ''}">${i.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function platformNav(active) {
    const sections = [
      {
        label: 'Main',
        items: [
          { id: 'platform-dashboard', icon: 'home', label: 'Home' },
          { id: 'platform-orgs', icon: 'orders', label: 'Organizations' },
          { id: 'platform-subscriptions', icon: 'diamond', label: 'Documentation & Plans' },
          { id: 'platform-audit', icon: 'stats', label: 'Statistics & Logs' },
        ]
      },
      {
        label: 'Communication',
        items: [
          { id: 'platform-data-requests', icon: 'inbox', label: 'Inbox Requests', hasDot: true },
          { id: 'platform-users', icon: 'users', label: 'Platform Users' },
          { id: 'platform-webhooks', icon: 'link', label: 'Webhooks' },
        ]
      }
    ];

    return sections.map(s => `
      <div class="nav-section-wrap">
        <div class="nav-section-label">${s.label}</div>
        ${s.items.map(i => `
          <div class="nav-item ${active === i.id ? 'active' : ''}" onclick="Router.go('${i.id}')" data-nav-id="${i.id}">
            <span class="nav-icon">
              ${getSidebarIcon(i.icon)}
              ${i.hasDot ? `<span class="nav-icon-dot"></span>` : ''}
            </span>
            <span>${i.label}</span>
            ${i.badge ? `<span class="nav-badge ${i.badgeColor || ''}">${i.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function staffNav(active) {
    const sections = [
      {
        label: 'Gate Security',
        items: [
          { id: 'staff-dashboard', icon: 'shield', label: 'Gate Scanner & Passes', badge: 'LIVE', badgeColor: 'green' },
          { id: 'admin-entry-passes', icon: 'orders', label: 'All Society Passes' },
        ]
      },
      {
        label: 'Staff Employment',
        items: [
          { id: 'admin-duty', icon: 'calendar', label: 'Campus Duty Roster' },
          { id: 'admin-emergency', icon: 'phone', label: 'Emergency Intercom' },
        ]
      }
    ];

    return sections.map(s => `
      <div class="nav-section-wrap">
        <div class="nav-section-label">${s.label}</div>
        ${s.items.map(i => `
          <div class="nav-item ${active === i.id ? 'active' : ''}" onclick="Router.go('${i.id}')" data-nav-id="${i.id}">
            <span class="nav-icon">${getSidebarIcon(i.icon)}</span>
            <span>${i.label}</span>
            ${i.badge ? `<span class="nav-badge ${i.badgeColor || ''}">${i.badge}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function mobileBottomNav(portal, active) {
    let tabs = [];
    if (portal === 'resident') {
      tabs = [
        { id: 'resident-dashboard',  icon: '🏠', label: 'Home' },
        { id: 'resident-bills',      icon: '📄', label: 'Bills' },
        { id: 'resident-complaints', icon: '🎫', label: 'Tickets' },
        { id: 'resident-notices',    icon: '📢', label: 'Notices' },
        { id: 'menu',                icon: '☰', label: 'Menu', isMenu: true },
      ];
    } else if (portal === 'staff') {
      tabs = [
        { id: 'staff-dashboard',     icon: '👮', label: 'Gate' },
        { id: 'admin-entry-passes',  icon: '🎫', label: 'Passes' },
        { id: 'admin-duty',          icon: '📅', label: 'Roster' },
        { id: 'menu',                icon: '☰', label: 'Menu', isMenu: true },
      ];
    } else if (portal === 'platform') {
      tabs = [
        { id: 'platform-dashboard',     icon: '🏠', label: 'Overview' },
        { id: 'platform-orgs',          icon: '🏢', label: 'Societies' },
        { id: 'platform-subscriptions', icon: '💎', label: 'Plans' },
        { id: 'platform-audit',         icon: '🔍', label: 'Logs' },
        { id: 'menu',                   icon: '☰', label: 'Menu', isMenu: true },
      ];
    } else {
      tabs = [
        { id: 'admin-dashboard',   icon: '🏠', label: 'Home' },
        { id: 'admin-units',       icon: '🚪', label: 'Units' },
        { id: 'admin-members',     icon: '👥', label: 'Members' },
        { id: 'admin-invoices',    icon: '💳', label: 'Finance' },
        { id: 'menu',              icon: '☰', label: 'Menu', isMenu: true },
      ];
    }

    return `
      <nav class="mobile-bottom-nav">
        ${tabs.map(t => `
          <div class="mobile-nav-tab ${active === t.id ? 'active' : ''}"
               onclick="${t.isMenu ? 'toggleSidebar(true)' : `Router.go('${t.id}')`}">
            <div class="mobile-nav-icon">${t.icon}</div>
            <div class="mobile-nav-label">${t.label}</div>
          </div>
        `).join('')}
      </nav>
    `;
  }

  function render(screen, { title, portal = 'admin', content, breadcrumb, actions = '' }) {
    const navFn = portal === 'resident' ? residentNav :
                  portal === 'platform' ? platformNav :
                  portal === 'staff'    ? staffNav : adminNav;

    const portalLabel = portal === 'admin'    ? 'RWA Admin'    :
                        portal === 'resident' ? 'Resident'     :
                        portal === 'staff'    ? 'Staff & Guard' : 'Platform';

    const storedUser = typeof window.getLoggedInUser === 'function' ? window.getLoggedInUser() : {};

    const orgName = (portal === 'platform' ? 'Platform Admin' :
                    (storedUser?.organization?.name || localStorage.getItem('rwa_active_org_name') || (portal === 'resident' ? 'Resident Portal' : portal === 'staff' ? 'Guard Portal' : 'RWA Society'))).replace(/\s+/g, ' ');

    const userName = (portal === 'platform' ? 'Super Admin' :
                     portal === 'staff'    ? (storedUser?.name || 'Ram Singh') :
                     (storedUser?.name || 'Full name')).replace(/\s+/g, ' ');

    const userInitial = userName.split(/\s+/).filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
    const userRole = portal === 'platform' ? 'Platform Admin' :
                     portal === 'staff'    ? 'Senior Security Guard' :
                     (storedUser?.designation || (storedUser?.role === 'RWA_ADMIN' ? 'RWA Admin' : (portal === 'resident' ? 'Flat Resident' : 'Administrator')));
    const avatarColor = portal === 'resident' ? 'green' : portal === 'platform' ? 'purple' : portal === 'staff' ? 'green' : 'blue';
    const userEmail = storedUser?.email || (storedUser?.phone ? storedUser.phone : 'johndoe@gmail.com');

    const isAdminUser = storedUser && (
      storedUser.role === 'RWA_ADMIN' || 
      storedUser.role === 'TREASURER' || 
      storedUser.role === 'SECRETARY' || 
      storedUser.role === 'COMMITTEE_MEMBER' ||
      storedUser.role === 'PRESIDENT'
    );

    const isCardDismissed = false;
    const isSidebarCollapsed = typeof localStorage !== 'undefined' && localStorage.getItem('rwa_sidebar_collapsed') === 'true';

    // Compute dynamic sidebar capacity / billing card info for Resident vs Admin
    let cardTitle = 'Society Units Quota';
    let cardDesc = '48 of 50 units registered in society tier.';
    let cardBtnText = 'Manage Units →';
    let cardBtnAction = "Router.go('admin-units')";
    let cardBtnStyle = 'background:linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);box-shadow:0 4px 12px rgba(79,70,229,0.28);';
    let gaugePercent = 96;
    let gaugeText = '96%';
    let gaugeBgStroke = '#E0E7FF';
    let gaugeFgStroke = '#4F46E5';
    let gaugeTextColor = '#4338CA';

    if (portal === 'resident') {
      let residentDue = null;
      try {
        const rawDue = localStorage.getItem('rwa_resident_due_summary');
        if (rawDue) residentDue = JSON.parse(rawDue);
      } catch(e) {}

      const unitNum = residentDue?.unitNumber || (storedUser?.unit?.unitNumber) || 'Your Flat';
      const pendingAmt = typeof residentDue?.pendingAmount === 'number' ? residentDue.pendingAmount : 2500;
      const isPaid = pendingAmt <= 0;

      if (!isPaid) {
        cardTitle = 'Maintenance Due';
        cardDesc = `Flat ${unitNum} has ₹${pendingAmt.toLocaleString('en-IN')} pending for this cycle.`;
        cardBtnText = `Pay Maintenance (₹${pendingAmt.toLocaleString('en-IN')})`;
        cardBtnAction = "Router.go('resident-bills')";
        cardBtnStyle = 'background:linear-gradient(135deg, #EF4444 0%, #DC2626 100%);box-shadow:0 4px 12px rgba(239,68,68,0.28);';
        gaugePercent = 65;
        gaugeText = 'DUE';
        gaugeBgStroke = '#FEE2E2';
        gaugeFgStroke = '#EF4444';
        gaugeTextColor = '#DC2626';
      } else {
        cardTitle = 'Maintenance Paid ✓';
        cardDesc = `All dues cleared for Flat ${unitNum}. Thank you!`;
        cardBtnText = 'View Invoices →';
        cardBtnAction = "Router.go('resident-bills')";
        cardBtnStyle = 'background:linear-gradient(135deg, #10B981 0%, #059669 100%);box-shadow:0 4px 12px rgba(16,185,129,0.28);';
        gaugePercent = 100;
        gaugeText = '100%';
        gaugeBgStroke = '#D1FAE5';
        gaugeFgStroke = '#10B981';
        gaugeTextColor = '#059669';
      }
    } else if (portal === 'admin') {
      let adminStats = null;
      try {
        const rawStats = localStorage.getItem('rwa_stats_cache');
        if (rawStats) adminStats = JSON.parse(rawStats);
      } catch(e) {}

      const totalUnits = adminStats?.totalUnits || 48;
      const planQuota = adminStats?.planQuota || 50;
      const occRate = adminStats?.occupancyRate || 100;
      gaugePercent = Math.min(100, Math.round((totalUnits / planQuota) * 100));

      cardTitle = 'Society Units Quota';
      cardDesc = `${totalUnits} of ${planQuota} units registered in society tier (${occRate}% occupied).`;
      cardBtnText = 'Manage Units →';
      cardBtnAction = "Router.go('admin-units')";
      cardBtnStyle = 'background:linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);box-shadow:0 4px 12px rgba(79,70,229,0.28);';
      gaugeText = `${gaugePercent}%`;
      gaugeBgStroke = '#E0E7FF';
      gaugeFgStroke = '#4F46E5';
      gaugeTextColor = '#4338CA';
    } else {
      cardTitle = 'Platform Health';
      cardDesc = 'All society database clusters operating normally.';
      cardBtnText = 'System Metrics →';
      cardBtnAction = "Router.go('platform-dashboard')";
      gaugePercent = 99;
      gaugeText = '99%';
      gaugeBgStroke = '#EDE9FE';
      gaugeFgStroke = '#8B5CF6';
      gaugeTextColor = '#7C3AED';
    }

    const strokeDashOffset = (106.8 - (106.8 * (gaugePercent / 100))).toFixed(1);

    return `
      <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="toggleSidebar(false)"></div>

      <div class="sidebar ${isSidebarCollapsed ? 'collapsed' : ''}" id="appSidebar">
        <!-- 1. Top macOS Window Control Dots + Collapse Toggle -->
        <div class="sidebar-top-bar">
          <div class="mac-traffic-dots">
            <span class="mac-dot dot-red"></span>
            <span class="mac-dot dot-yellow"></span>
            <span class="mac-dot dot-green"></span>
          </div>
          <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" onclick="toggleSidebarCollapse()" title="${isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}" aria-label="Toggle sidebar collapse">
            ${isSidebarCollapsed 
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`}
          </button>
        </div>

        <!-- 2. Storeify Brand Logo Header -->
        <div class="sidebar-brand-header">
          <div class="sidebar-brand-logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M7 11C7 8.23858 9.23858 6 12 6H20C22.7614 6 25 8.23858 25 11V12C25 14.7614 22.7614 17 20 17H11C8.23858 17 6 19.2386 6 22V22C6 24.7614 8.23858 27 11 27H20C22.7614 27 25 24.7614 25 22" stroke="url(#storeifyGrad)" stroke-width="3.6" stroke-linecap="round"/>
              <defs>
                <linearGradient id="storeifyGrad" x1="6" y1="6" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#7C3AED"/>
                  <stop offset="0.5" stop-color="#6366F1"/>
                  <stop offset="1" stop-color="#4F46E5"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="sidebar-brand-text">
            <div class="brand-name">Storeify</div>
            <div class="brand-sub" id="sidebarOrgName" title="${orgName}">${orgName}</div>
          </div>
        </div>

        <!-- 3. Search Box with Instant Live Filtering -->
        <div class="sidebar-search-box">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="sidebarSearchInput" placeholder="Search for anything..." oninput="window.filterSidebarNav(this.value)" autocomplete="off" />
          <button id="sidebarSearchClear" class="search-clear-btn" style="display:none;" onclick="window.clearSidebarSearch()" aria-label="Clear search">✕</button>
        </div>

        <!-- 4. Portal Switcher Pill -->
        ${isAdminUser && portal !== 'platform' ? `
          <div class="sidebar-portal-pill" onclick="window.togglePortalView('${portal}')">
            <div class="portal-pill-left">
              <span class="portal-status-dot ${portal==='resident' ? 'dot-resident' : 'dot-admin'}"></span>
              <span class="portal-pill-text">${portal==='admin' ? 'RWA Admin View' : 'Resident View'}</span>
            </div>
            <span class="portal-pill-switch" title="Switch view">⇄ ${portal==='admin' ? 'Resident' : 'Admin'}</span>
          </div>
        ` : ''}

        <!-- 5. Navigation Items Scroll Area -->
        <div id="appSidebarNav" class="sidebar-nav-scroll" onscroll="window._sidebarNavScroll = this.scrollTop" onclick="if(window.innerWidth<=840||document.body.classList.contains('mobile-frame-view'))toggleSidebar(false)">
          ${navFn(screen)}

          <!-- 6. Capacity Promotion Card -->
          <div class="sidebar-capacity-card" id="sidebarCapacityCard" style="${isCardDismissed ? 'display:none;' : ''}">
            <button class="capacity-close-btn" onclick="window.dismissCapacityCard(event)" title="Dismiss card">✕</button>
            <div class="capacity-gauge-wrap">
              <svg width="44" height="44" viewBox="0 0 44 44" id="sidebarCapacityGaugeSvg">
                <circle cx="22" cy="22" r="17" fill="none" stroke="${gaugeBgStroke}" stroke-width="3.6" />
                <circle id="sidebarCapacityGaugeCircle" cx="22" cy="22" r="17" fill="none" stroke="${gaugeFgStroke}" stroke-width="3.6" stroke-dasharray="106.8" stroke-dashoffset="${strokeDashOffset}" stroke-linecap="round" transform="rotate(-90 22 22)" />
                <text id="sidebarCapacityGaugeText" x="22" y="26" text-anchor="middle" font-size="10" font-weight="800" fill="${gaugeTextColor}">${gaugeText}</text>
              </svg>
            </div>
            <div class="capacity-title" id="sidebarCapacityTitle">${cardTitle}</div>
            <div class="capacity-desc" id="sidebarCapacityDesc">${cardDesc}</div>
            <button class="capacity-btn" id="sidebarCapacityBtn" onclick="${cardBtnAction}" style="${cardBtnStyle}">
              ${cardBtnText}
            </button>
          </div>

          <!-- 7. Bottom Utilities (Settings & Help) -->
          <div class="nav-section-wrap sidebar-utilities-wrap">
            <div class="nav-item ${screen === (portal === 'resident' ? 'resident-profile' : portal === 'platform' ? 'platform-profile' : 'admin-settings') ? 'active' : ''}" 
                 onclick="Router.go('${portal === 'resident' ? 'resident-profile' : portal === 'platform' ? 'platform-profile' : 'admin-settings'}')">
              <span class="nav-icon">${getSidebarIcon('settings')}</span>
              <span>Settings</span>
            </div>
            <div class="nav-item" onclick="window.openHelpModal()">
              <span class="nav-icon">${getSidebarIcon('help')}</span>
              <span>Help</span>
            </div>
          </div>
        </div>

        <!-- 8. User Profile Footer Strip -->
        <div class="sidebar-user-footer">
          <div class="sidebar-user-meta" onclick="window.toggleUserAccountMenu(event, '${portal}')" title="Logged in as ${userName}">
            <div class="sidebar-user-avatar">
              ${storedUser?.avatar ? `<img src="${storedUser.avatar}" alt="${userName}" class="user-avatar-img" />` : `
                <div class="user-avatar-circle ${avatarColor}">${userInitial}</div>
              `}
            </div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${userName}</div>
              <div class="sidebar-user-email" title="${userEmail}">${userEmail}</div>
            </div>
          </div>
          <button class="sidebar-user-logout" onclick="window.handleSignOut()" title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="main fade-in">
        <div class="topbar">
          <button class="mobile-menu-btn" onclick="toggleSidebar(true)" aria-label="Open navigation menu">☰</button>
          <div class="topbar-title-wrap">
            <div class="topbar-title">${title}</div>
            ${breadcrumb ? `<div class="topbar-breadcrumb">${breadcrumb} <span class="sep">›</span> <span>${title}</span></div>` : ''}
          </div>
          <div class="topbar-actions">
            ${isAdminUser && portal !== 'platform' ? `
              <button class="btn btn-sm ${portal==='admin' ? 'btn-secondary' : 'btn-primary'}" 
                      style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:var(--r-md);"
                      onclick="window.togglePortalView('${portal}')">
                <span>${portal==='admin' ? '🏠 My Resident View' : '🛠️ Admin Portal'}</span>
              </button>
            ` : ''}
            ${isAdminUser && portal === 'resident' && !storedUser?.unitId ? `
              <button class="btn btn-sm" id="headerConnectFlatBtn"
                      style="font-size:11.5px;font-weight:700;background:#F59E0B;color:#0F172A;border:none;border-radius:var(--r-md);padding:6px 11px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 8px rgba(245,158,11,0.25);cursor:pointer;"
                      onclick="window.openAdminUnitConnectModal ? window.openAdminUnitConnectModal() : (window.loadLiveResidentDashboard && window.loadLiveResidentDashboard())">
                <span>⚠️ Connect My Flat</span>
              </button>
            ` : ''}
            ${actions}
            <div style="position:relative;display:inline-flex;align-items:center;">
              <button class="icon-btn" id="headerNotifBtn" data-tip="Notifications" onclick="toggleHeaderNotificationsMenu(event, '${portal}')" aria-label="Notifications & Alerts">
                🔔<div class="notif-dot" id="headerNotifDot"></div>
              </button>
              <div id="headerNotifDropdown" class="header-dropdown-menu notif-dropdown" style="display:none;position:absolute;top:calc(100% + 10px);right:0;width:400px;max-width:92vw;background:var(--bg-surface,#ffffff);border:1px solid var(--border,#E2E8F0);border-radius:16px;box-shadow:0 20px 40px -8px rgba(15,23,42,0.22);z-index:10000;overflow:hidden;" onclick="event.stopPropagation()"></div>
            </div>
            <div style="position:relative;display:inline-flex;align-items:center;">
              <div class="avatar ${avatarColor}" id="headerUserAvatar" style="cursor:pointer" onclick="toggleUserAccountMenu(event, '${portal}')" title="Logged in as ${userName} · Account Options">${userInitial}</div>
              <div id="headerAccountDropdown" class="header-dropdown-menu account-dropdown" style="display:none;position:absolute;top:calc(100% + 10px);right:0;width:320px;background:var(--bg-surface,#ffffff);border:1px solid var(--border,#E2E8F0);border-radius:16px;box-shadow:0 20px 40px -8px rgba(15,23,42,0.22);z-index:10000;overflow:hidden;" onclick="event.stopPropagation()"></div>
            </div>
          </div>
        </div>
        <div class="content">
          ${content}
        </div>
        ${mobileBottomNav(portal, screen)}
      </div>
    `;
  }

  return { render, adminNav, residentNav, platformNav };
})();
window.Shell = Shell;
Shell.admin = function(opts = {}) {
  return Shell.render(opts.activeNav || opts.id || 'admin-dashboard', {
    title: opts.title || 'Admin Operations',
    portal: 'admin',
    breadcrumb: opts.breadcrumb || 'Operations',
    actions: opts.actions || '',
    content: opts.content || '',
    ...opts
  });
};

// =============================================
// Header Dropdowns (Account & Alerts Management)
// =============================================

window.closeHeaderDropdowns = function() {
  const acc = document.getElementById('headerAccountDropdown');
  const notif = document.getElementById('headerNotifDropdown');
  if (acc) acc.style.display = 'none';
  if (notif) notif.style.display = 'none';
};

// Global click-outside listener to auto-close topbar dropdowns
document.addEventListener('click', function(e) {
  const isInsideAcc = e.target.closest('#headerAccountDropdown') || e.target.closest('#headerUserAvatar') || e.target.closest('.user-card');
  const isInsideNotif = e.target.closest('#headerNotifDropdown') || e.target.closest('#headerNotifBtn');
  if (!isInsideAcc && !isInsideNotif) {
    window.closeHeaderDropdowns();
  }
});

// Global helper to get sanitized logged-in user
window.getLoggedInUser = function() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('rwa_user') || localStorage.getItem('rwa_current_user') || 'null');
  } catch(e) {}
  if (!user && typeof Auth !== 'undefined' && typeof Auth.currentUser === 'function') {
    try { user = Auth.currentUser(); } catch(e) {}
  }
  return user || {};
};

// Toggle User Account Menu (Stays in current portal, DOES NOT force redirect to resident view!)
window.toggleUserAccountMenu = function(event, portal) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('headerAccountDropdown');
  if (!dropdown) return;

  const notifDropdown = document.getElementById('headerNotifDropdown');
  if (notifDropdown) notifDropdown.style.display = 'none';

  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    return;
  }

  const user = window.getLoggedInUser();
  const userName = (user.name || (portal === 'platform' ? 'Platform Administrator' : (portal === 'resident' ? 'Flat Resident' : 'Society Administrator'))).replace(/\s+/g, ' ');
  const userPhone = user.phone ? (user.phone.startsWith('+') ? user.phone : `+91 ${user.phone}`) : '+91 98000 00000';
  const rawRole = (user.role || (portal === 'resident' ? 'RESIDENT' : 'RWA_ADMIN'));
  const userRole = rawRole === 'PLATFORM_ADMIN' ? 'Platform Super Admin' :
                   rawRole === 'RWA_ADMIN' ? 'RWA Admin' :
                   rawRole === 'TREASURER' ? 'Treasurer' :
                   rawRole === 'SECRETARY' ? 'Secretary' :
                   rawRole === 'PRESIDENT' ? 'President' :
                   rawRole === 'COMMITTEE_MEMBER' ? 'Committee Member' :
                   rawRole === 'RESIDENT' ? 'Resident Member' :
                   rawRole.replace(/_/g, ' ');
  const orgName = ((user.organization && user.organization.name) || localStorage.getItem('rwa_active_org_name') || 'Greenwood Heights RWA').replace(/\s+/g, ' ');
  const isAdmin = user.role !== 'RESIDENT';
  const userInitial = userName.split(/\s+/).filter(Boolean).map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'AD';
  const avatarColor = portal === 'resident' ? 'green' : portal === 'platform' ? 'purple' : 'blue';
  const unitDisplay = user.unitNumber || (user.unit && user.unit.unitNumber) || window.__residentPreviewUnitNumber || null;

  dropdown.innerHTML = `
    <div class="dropdown-header" style="padding:14px 16px;background:var(--bg-elevated);border-bottom:1px solid var(--border-light);">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="avatar avatar-${avatarColor}" style="width:42px;height:42px;font-size:15px;flex-shrink:0;font-weight:800;">${userInitial}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${userName}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;font-family:monospace;">${userPhone}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">
            <span class="badge ${portal==='resident'?'badge-green':portal==='platform'?'badge-purple':'badge-blue'}" style="font-size:10px;font-weight:700;">${userRole}</span>
            ${unitDisplay ? `<span class="badge badge-amber" style="font-size:10px;font-weight:700;">Flat ${unitDisplay}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="margin-top:10px;padding:7px 10px;background:var(--bg-surface);border-radius:var(--r-md);border:1px solid var(--border-light);font-size:11.5px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
        <span>🏛️</span>
        <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${orgName}</span>
      </div>
    </div>

    <div style="padding:6px 0;">
      <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); window.openUserProfileModal('${portal}');">
        <span>👤</span> <span>Profile & Security Settings</span>
      </div>
      ${portal === 'admin' ? `
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('admin-settings');">
          <span>⚙️</span> <span>Organization Settings</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('admin-subscription');">
          <span>💳</span> <span>Subscription & Billing</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('admin-audit');">
          <span>📋</span> <span>Audit Trail</span>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); window.navigateToResidentView();" style="color:var(--blue);font-weight:600;">
          <span>🏠</span> <span>Switch to Resident View</span>
        </div>
      ` : (portal === 'resident' ? `
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('resident-profile');">
          <span>🏠</span> <span>My Flat & Directory Profile</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('resident-bills');">
          <span>📄</span> <span>My Maintenance Invoices</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('resident-amenities');">
          <span>🏸</span> <span>Amenity Bookings</span>
        </div>
        ${isAdmin ? `
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('admin-dashboard');" style="color:var(--blue);font-weight:600;">
            <span>🛠️</span> <span>Return to Admin Portal</span>
          </div>
        ` : ''}
      ` : `
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('platform-profile');">
          <span>👤</span> <span>Super Admin Profile</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('platform-orgs');">
          <span>🏢</span> <span>Tenant Societies</span>
        </div>
        <div class="dropdown-item" onclick="window.closeHeaderDropdowns(); Router.go('platform-subscriptions');">
          <span>💳</span> <span>Unit-Wise Pricing & Plans</span>
        </div>
      `)}
      <div class="dropdown-divider"></div>
      <div class="dropdown-item danger" onclick="window.closeHeaderDropdowns(); handleSignOut();">
        <span>🚪</span> <span>Sign Out</span>
      </div>
    </div>
  `;

  dropdown.style.display = 'block';
};

// Global Portal Navigation & Unit Connection Helpers
window.togglePortalView = function(currentPortal) {
  if (currentPortal === 'admin') {
    window.navigateToResidentView();
  } else {
    Router.go('admin-dashboard');
  }
};

window.navigateToResidentView = function() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}

  if (user && user.unitId) {
    // If admin is connected to a unit, always default to their own unit
    window.__residentPreviewUnitId = user.unitId;
    sessionStorage.setItem('rwa_resident_preview_unit_id', user.unitId);
  } else {
    // If admin is not connected to any unit yet, reset preview so connect prompt appears
    window.__residentPreviewUnitId = null;
    sessionStorage.removeItem('rwa_resident_preview_unit_id');
  }

  Router.go('resident-dashboard');
};

window.openAdminUnitConnectModal = function() {
  const allUnits = window.__residentAllSocietyUnits || window.__societyUnitsCache || [];
  let user = null;
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}

  const currentUnitId = user?.unitId;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:center;gap:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:12px 14px;">
        <span style="font-size:24px;">🏢</span>
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.45;">
          ${currentUnitId 
            ? 'Your admin profile is currently connected to <strong>Flat ' + (user?.unitNumber || '') + '</strong>. You can switch your primary residential flat below.' 
            : 'As an RWA Admin, you must be connected to at least one unit in this society. Your Resident View will open this unit by default.'}
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12.5px;margin-bottom:6px;display:block;">Select Your Flat *</label>
        <select id="modalAdminUnitConnectSelect" class="form-select w-full" style="padding:10px 12px;font-size:13px;font-weight:700;border-radius:10px;border:1.5px solid var(--border);">
          <option value="">-- Choose Flat --</option>
          ${allUnits.map(u => `
            <option value="${u.id}" ${u.id === currentUnitId ? 'selected' : ''}>
              🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Block'})${u.id === currentUnitId ? ' - (Currently Connected 👑)' : ''}
            </option>
          `).join('')}
        </select>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">
        <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-warning btn-sm" style="font-weight:800;background:#F59E0B;color:#0F172A;border:none;" onclick="
          const val = document.getElementById('modalAdminUnitConnectSelect').value;
          if (!val) {
            if (typeof showToast === 'function') showToast('Please select a flat first', 'warning');
            return;
          }
          Modal.close();
          if (typeof window.connectAdminToUnit === 'function') {
            window.connectAdminToUnit(val);
          }
        ">🔗 Link &amp; Save Flat</button>
      </div>
    </div>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '🔗 Connect Admin Profile to Flat',
      body: modalHtml
    });
  }
};

// Modal for viewing and updating user profile & security credentials
window.openUserProfileModal = function(portal) {
  const existing = document.getElementById('userProfileModal');
  if (existing) existing.remove();

  const user = window.getLoggedInUser();
  const userName = (user.name || (portal === 'platform' ? 'Platform Administrator' : (portal === 'resident' ? 'Flat Resident' : 'Society Administrator'))).replace(/\s+/g, ' ');
  const userPhone = user.phone || '1234567890';
  const userEmail = user.email || '';
  const rawRole = (user.role || (portal === 'resident' ? 'RESIDENT' : 'RWA_ADMIN'));
  const userRole = rawRole === 'PLATFORM_ADMIN' ? 'Platform Super Admin' :
                   rawRole === 'RWA_ADMIN' ? 'RWA Admin' :
                   rawRole === 'TREASURER' ? 'Treasurer' :
                   rawRole === 'SECRETARY' ? 'Secretary' :
                   rawRole === 'PRESIDENT' ? 'President' :
                   rawRole === 'COMMITTEE_MEMBER' ? 'Committee Member' :
                   rawRole === 'RESIDENT' ? 'Resident Member' :
                   rawRole.replace(/_/g, ' ');
  const orgName = ((user.organization && user.organization.name) || localStorage.getItem('rwa_active_org_name') || 'Greenwood Heights RWA').replace(/\s+/g, ' ');
  const userInitial = userName.split(/\s+/).filter(Boolean).map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'AD';
  const avatarColor = portal === 'resident' ? 'green' : portal === 'platform' ? 'purple' : 'blue';
  const modalTitle = portal === 'platform' ? 'Platform Super Admin Profile' :
                     portal === 'resident' ? 'Resident Profile & Security Settings' :
                     'Administrator Profile & Security Settings';

  const modal = document.createElement('div');
  modal.id = 'userProfileModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-xl);max-width:500px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;animation:fadeIn 0.2s ease;">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg-elevated);">
        <div style="font-size:16px;font-weight:800;color:var(--text-primary);">👤 ${modalTitle}</div>
        <button onclick="document.getElementById('userProfileModal').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted);line-height:1;" aria-label="Close modal">&times;</button>
      </div>
      <div style="padding:22px;display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;">
        <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);">
          <div class="avatar avatar-${avatarColor}" style="width:48px;height:48px;font-size:18px;flex-shrink:0;font-weight:800;">${userInitial}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${userName}</div>
            <div style="font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${orgName}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:4px;">
              <span class="badge ${portal==='resident'?'badge-green':portal==='platform'?'badge-purple':'badge-blue'}" style="font-size:10px;">${userRole}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" id="profileModalName" value="${userName}" placeholder="Your full name" />
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Phone Number (Login ID)</label>
            <input class="form-input" value="${userPhone.startsWith('+') ? userPhone : `+91 ${userPhone}`}" disabled style="background:var(--bg-elevated);cursor:not-allowed;" title="Registered login phone number" />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-input" id="profileModalEmail" value="${userEmail}" type="email" placeholder="name@example.com" />
          </div>
        </div>

        <div style="border-top:1px solid var(--border-light);padding-top:14px;margin-top:6px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-primary);">Update Password / Security PIN</div>
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">New Password / PIN</label>
              <input class="form-input" id="profileModalNewPass" type="password" placeholder="Leave blank to keep current" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input class="form-input" id="profileModalConfirmPass" type="password" placeholder="Repeat new password" />
            </div>
          </div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid var(--border);background:var(--bg-elevated);display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('userProfileModal').remove()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="window.saveUserProfileModal()">💾 Save Profile Changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.saveUserProfileModal = async function() {
  const name = document.getElementById('profileModalName')?.value.trim();
  const email = document.getElementById('profileModalEmail')?.value.trim();
  const pass = document.getElementById('profileModalNewPass')?.value;
  const confirm = document.getElementById('profileModalConfirmPass')?.value;

  if (!name) {
    showToast('Name is required', 'warning');
    return;
  }
  if (pass && pass.length < 6) {
    showToast('Password must be at least 6 characters', 'warning');
    return;
  }
  if (pass && pass !== confirm) {
    showToast('Passwords do not match', 'warning');
    return;
  }

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass || undefined }),
    });

    if (res && res.ok) {
      const data = await res.json();
      const updatedUser = data.user;
      if (updatedUser) {
        try {
          const uStr = localStorage.getItem('rwa_user');
          const u = uStr ? JSON.parse(uStr) : {};
          Object.assign(u, updatedUser);
          localStorage.setItem('rwa_user', JSON.stringify(u));
          localStorage.setItem('rwa_current_user', JSON.stringify(u));
        } catch (e) {}
      }
      
      if (typeof playNotificationSound === 'function') {
        try { playNotificationSound(); } catch(e) {}
      }
      showToast('🎉 Profile updated successfully!', 'success');
      document.getElementById('userProfileModal')?.remove();
      
      if (typeof Router !== 'undefined' && typeof Router.refresh === 'function') {
        Router.refresh();
      } else if (typeof Router !== 'undefined' && Router.current()) {
        Router.go(Router.current(), Router.params());
      }
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || 'Failed to update profile', 'error');
    }
  } catch (e) {
    showToast('Error updating profile', 'error');
  }
};

// Toggle Header Alerts & Notifications Flyout Menu
window.toggleHeaderNotificationsMenu = async function(event, portal) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('headerNotifDropdown');
  if (!dropdown) return;

  const accDropdown = document.getElementById('headerAccountDropdown');
  if (accDropdown) accDropdown.style.display = 'none';

  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
    return;
  }

  dropdown.innerHTML = `
    <div class="dropdown-header" style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:15px;font-weight:800;color:var(--text-primary);">🔔 Alerts & Feed</span>
        <span id="notifDropdownBadge" class="badge badge-purple" style="font-size:10px;">Loading...</span>
      </div>
      <button class="btn btn-ghost btn-xs" onclick="window.markAllNotificationsAsReadFromDropdown(event)" style="font-size:11px;color:var(--text-muted);padding:2px 6px;">
        ✓ Mark read
      </button>
    </div>
    <div id="notifDropdownList" style="max-height:360px;overflow-y:auto;padding:4px 0;">
      <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:12px;">Loading alerts...</div>
    </div>
    <div style="padding:10px 14px;border-top:1px solid var(--border-light);background:var(--bg-elevated);text-align:center;">
      <button class="btn btn-ghost btn-sm w-full" style="justify-content:center;font-size:12px;font-weight:700;color:var(--blue);"
        onclick="window.closeHeaderDropdowns(); Router.go('${portal==='resident' ? 'resident-notifications' : 'admin-notifications'}');">
        View All Society Notifications →
      </button>
    </div>
  `;

  dropdown.style.display = 'block';

  // Load live notifications
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      const notifs = data.notifications || [];
      const unreadCount = data.unreadCount || 0;

      const badge = document.getElementById('notifDropdownBadge');
      if (badge) {
        badge.textContent = unreadCount > 0 ? `${unreadCount} New` : 'All caught up';
        badge.className = `badge ${unreadCount > 0 ? 'badge-blue' : 'badge-green'}`;
      }

      if (typeof window.updateNotificationBellBadge === 'function') {
        window.updateNotificationBellBadge(unreadCount > 0);
      }

      const list = document.getElementById('notifDropdownList');
      if (list) {
        if (notifs.length === 0) {
          list.innerHTML = `
            <div style="padding:32px 16px;text-align:center;color:var(--text-muted);">
              <div style="font-size:24px;margin-bottom:6px;">🔔</div>
              <div style="font-size:13px;font-weight:600;">No Notifications Yet</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">All society circulars, dues, and alerts will appear here.</div>
            </div>
          `;
        } else {
          list.innerHTML = notifs.slice(0, 10).map(n => {
            const isUnread = !n.isRead;
            const icon = n.type === 'BILL' ? '📄' : n.type === 'PAYMENT' ? '💰' : n.type === 'COMPLAINT' ? '🎫' : n.type === 'NOTICE' ? '📢' : n.type === 'RESIDENT_ONBOARDED' ? '👤' : n.type === 'POLL' ? '🗳️' : '🔔';
            const iconBg = n.type === 'PAYMENT' ? '#F0FDF4' : n.type === 'BILL' ? '#EFF6FF' : n.type === 'COMPLAINT' ? '#FFFBEB' : '#F3E8FF';
            const timeStr = new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            return `
              <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border-light);cursor:pointer;background:${isUnread ? 'rgba(37,99,235,0.03)' : 'transparent'};transition:background 0.12s;"
                onmouseover="this.style.background='var(--bg-elevated)'"
                onmouseout="this.style.background='${isUnread ? 'rgba(37,99,235,0.03)' : 'transparent'}'"
                onclick="window.handleNotificationItemClick('${n.id}', '${n.type}', '${portal}')">
                <div style="width:32px;height:32px;border-radius:8px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">
                  ${icon}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
                    <div style="font-size:12px;font-weight:${isUnread ? '700' : '600'};color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n.title}</div>
                    ${isUnread ? '<div style="width:6px;height:6px;background:var(--blue);border-radius:50%;flex-shrink:0;"></div>' : ''}
                  </div>
                  <div style="font-size:11px;color:var(--text-secondary);line-height:1.35;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                    ${n.message}
                  </div>
                  <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">${timeStr}</div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }
  } catch (err) {
    console.error('Error fetching dropdown notifications:', err);
  }
};

window.handleNotificationItemClick = async function(notifId, type, portal) {
  try {
    const fetchFn = window.apiFetch || fetch;
    await fetchFn('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: notifId }),
    });
  } catch (e) {}

  window.closeHeaderDropdowns();

  if (type === 'BILL') {
    Router.go(portal === 'admin' ? 'admin-invoices' : 'resident-bills');
  } else if (type === 'RESIDENT_ONBOARDED') {
    Router.go(portal === 'admin' ? 'admin-members' : 'resident-profile');
  } else if (type === 'COMPLAINT') {
    Router.go(portal === 'admin' ? 'admin-complaints' : 'resident-complaints');
  } else if (type === 'NOTICE') {
    Router.go(portal === 'admin' ? 'admin-notices' : 'resident-notices');
  } else {
    Router.go(portal === 'admin' ? 'admin-notifications' : 'resident-notifications');
  }
};

window.markAllNotificationsAsReadFromDropdown = async function(e) {
  if (e) e.stopPropagation();
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      showToast('✓ All notifications marked as read', 'success');
      const badge = document.getElementById('notifDropdownBadge');
      if (badge) {
        badge.textContent = 'All caught up';
        badge.className = 'badge badge-green';
      }
      if (typeof window.updateNotificationBellBadge === 'function') {
        window.updateNotificationBellBadge(false);
      }
      const list = document.getElementById('notifDropdownList');
      if (list) {
        list.querySelectorAll('[style*="rgba(37,99,235,0.03)"]').forEach(el => {
          el.style.background = 'transparent';
        });
      }
    }
  } catch (err) {
    showToast('Failed to mark all as read', 'warning');
  }
};


// Mobile off-canvas toggle helper
window.toggleSidebar = function(open) {
  const sidebar  = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;
  if (open === undefined) {
    sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('open');
  } else if (open) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }
};

// Desktop Sidebar Collapse Toggle
window.toggleSidebarCollapse = function() {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;
  if (window.innerWidth <= 840 || document.body.classList.contains('mobile-frame-view')) {
    window.toggleSidebar(false);
    return;
  }
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('rwa_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  const btn = document.getElementById('sidebarCollapseBtn');
  if (btn) {
    btn.innerHTML = isCollapsed 
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    btn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
  }
};

// Instant Sidebar Navigation Search Filter
window.filterSidebarNav = function(query) {
  const q = (query || '').toLowerCase().trim();
  const navScroll = document.getElementById('appSidebarNav');
  const clearBtn = document.getElementById('sidebarSearchClear');
  if (clearBtn) clearBtn.style.display = q ? 'inline-block' : 'none';
  if (!navScroll) return;

  const items = navScroll.querySelectorAll('.nav-item');
  items.forEach(item => {
    const text = (item.textContent || '').toLowerCase();
    if (!q || text.includes(q)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });

  const sections = navScroll.querySelectorAll('.nav-section-wrap');
  sections.forEach(sec => {
    const visibleItems = sec.querySelectorAll('.nav-item:not([style*="display: none"])');
    sec.style.display = visibleItems.length === 0 ? 'none' : '';
  });
};

window.clearSidebarSearch = function() {
  const input = document.getElementById('sidebarSearchInput');
  if (input) {
    input.value = '';
    window.filterSidebarNav('');
    input.focus();
  }
};

window.dismissCapacityCard = function(e) {
  if (e) e.stopPropagation();
  const card = document.getElementById('sidebarCapacityCard');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => { card.style.display = 'none'; }, 200);
  }
};

window.updateSidebarCapacityCard = function(portalType, data) {
  const card = document.getElementById('sidebarCapacityCard');
  if (!card) return;
  card.style.display = 'block';
  card.style.opacity = '1';
  card.style.transform = 'none';

  const titleEl = document.getElementById('sidebarCapacityTitle');
  const descEl = document.getElementById('sidebarCapacityDesc');
  const btnEl = document.getElementById('sidebarCapacityBtn');
  const circleEl = document.getElementById('sidebarCapacityGaugeCircle');
  const textEl = document.getElementById('sidebarCapacityGaugeText');

  if (portalType === 'resident') {
    const pendingAmt = typeof data?.pendingAmount === 'number' ? data.pendingAmount : 0;
    const unitNum = data?.unitNum || 'Your Flat';
    const isPaid = pendingAmt <= 0;

    try {
      localStorage.setItem('rwa_resident_due_summary', JSON.stringify({
        pendingAmount: pendingAmt,
        unitNumber: unitNum,
        updatedAt: Date.now()
      }));
    } catch(e) {}

    if (titleEl) titleEl.textContent = isPaid ? 'Maintenance Paid ✓' : 'Maintenance Due';
    if (descEl) descEl.textContent = isPaid 
      ? `All dues cleared for Flat ${unitNum}. Thank you!`
      : `Flat ${unitNum} has ₹${pendingAmt.toLocaleString('en-IN')} pending for this cycle.`;
    
    if (btnEl) {
      btnEl.textContent = isPaid ? 'View Invoices →' : `Pay Maintenance (₹${pendingAmt.toLocaleString('en-IN')})`;
      btnEl.setAttribute('onclick', "Router.go('resident-bills')");
      btnEl.style.cssText = isPaid
        ? 'width:100%;background:linear-gradient(135deg, #10B981 0%, #059669 100%);color:#fff;border:none;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.28);'
        : 'width:100%;background:linear-gradient(135deg, #EF4444 0%, #DC2626 100%);color:#fff;border:none;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.28);';
    }

    if (circleEl) {
      circleEl.setAttribute('stroke', isPaid ? '#10B981' : '#EF4444');
      circleEl.setAttribute('stroke-dashoffset', isPaid ? '0' : '37.4');
    }
    if (textEl) {
      textEl.textContent = isPaid ? '100%' : 'DUE';
      textEl.setAttribute('fill', isPaid ? '#059669' : '#DC2626');
    }
  } else if (portalType === 'admin') {
    const totalUnits = data?.totalUnits || 48;
    const planQuota = data?.planQuota || 50;
    const occRate = data?.occupancyRate || 100;
    const pct = Math.min(100, Math.round((totalUnits / planQuota) * 100));

    try {
      localStorage.setItem('rwa_stats_cache', JSON.stringify({
        totalUnits,
        planQuota,
        occupancyRate: occRate,
        updatedAt: Date.now()
      }));
    } catch(e) {}

    if (titleEl) titleEl.textContent = 'Society Units Quota';
    if (descEl) descEl.textContent = `${totalUnits} of ${planQuota} units registered in society tier (${occRate}% occupied).`;
    if (btnEl) {
      btnEl.textContent = 'Manage Units →';
      btnEl.setAttribute('onclick', "Router.go('admin-units')");
      btnEl.style.cssText = 'width:100%;background:linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);color:#fff;border:none;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,0.28);';
    }
    if (circleEl) {
      circleEl.setAttribute('stroke', '#4F46E5');
      const offset = (106.8 - (106.8 * (pct / 100))).toFixed(1);
      circleEl.setAttribute('stroke-dashoffset', offset);
    }
    if (textEl) {
      textEl.textContent = `${pct}%`;
      textEl.setAttribute('fill', '#4338CA');
    }
  }
};

window.openHelpModal = function() {
  const existing = document.getElementById('rwaHelpModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'rwaHelpModal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(5px); z-index: 99999; display: flex;
    align-items: center; justify-content: center; padding: 16px;
  `;
  modal.onclick = function(e) {
    if (e.target === modal) modal.remove();
  };
  modal.innerHTML = `
    <div class="modal" style="background:#FFFFFF;max-width:500px;width:100%;padding:24px;border-radius:20px;box-shadow:0 25px 50px -12px rgba(15,23,42,0.3);border:1px solid #E2E8F0;animation:scaleUp 0.18s ease;" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#EEF2FF;color:#4F46E5;display:flex;align-items:center;justify-content:center;font-size:18px;">❓</div>
          <div>
            <h3 style="margin:0;font-size:17px;font-weight:700;color:#0F172A;">Help & Support Center</h3>
            <p style="margin:0;font-size:12px;color:#64748B;">Assistance, FAQs, and Emergency Contacts</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('rwaHelpModal').remove()" style="font-size:18px;line-height:1;padding:4px 8px;">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="if(typeof showToast==='function')showToast('Opening documentation & guides...', 'info')">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">📖</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:#0F172A;">User Guide & FAQs</div>
              <div style="font-size:11px;color:#64748B;">Learn how to navigate billing, complaints & amenity bookings</div>
            </div>
          </div>
          <span style="color:#64748B;font-size:13px;">›</span>
        </div>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;" onclick="if(typeof showToast==='function')showToast('Society Desk: +91 98000 12345 · desk@society.in', 'info')">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">📞</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:#0F172A;">Society Management Office</div>
              <div style="font-size:11px;color:#64748B;">Mon-Sat 9:00 AM - 6:00 PM · +91 98000 12345</div>
            </div>
          </div>
          <span style="color:#64748B;font-size:13px;">›</span>
        </div>

        <div style="background:#FEF2F2;border:1px solid #FEE2E2;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🚨</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:#DC2626;">Emergency Gate & Security</div>
            <div style="font-size:11px;color:#991B1B;">Main Gate Intercom: 101 | Patrol Mobile: +91 99999 11111</div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('rwaHelpModal').remove()">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Interactive Device Switcher Helper (Phone vs Desktop)
window.setDeviceMode = function(mode) {
  if (mode === 'mobile') {
    document.body.classList.add('mobile-frame-view');
  } else {
    document.body.classList.remove('mobile-frame-view');
  }
  localStorage.setItem('rwa_preview_mode', mode);
  updateDeviceSwitcherUI();
};

window.updateDeviceSwitcherUI = function() {
  const isMobile = document.body.classList.contains('mobile-frame-view');
  const mobileBtn = document.getElementById('devBtnMobile');
  const desktopBtn = document.getElementById('devBtnDesktop');
  if (mobileBtn && desktopBtn) {
    if (isMobile) {
      mobileBtn.classList.add('active');
      desktopBtn.classList.remove('active');
    } else {
      desktopBtn.classList.add('active');
      mobileBtn.classList.remove('active');
    }
  }
};

window.handleSignOut = function() {
  localStorage.removeItem('rwa_token');
  localStorage.removeItem('rwa_user');
  localStorage.removeItem('rwa_current_user');
  localStorage.removeItem('rwa_active_org_id');
  localStorage.removeItem('rwa_active_org_name');
  document.cookie = "rwa_token=; path=/; max-age=0;";
  document.cookie = "rwa_active_org_id=; path=/; max-age=0;";
  if (typeof showToast === 'function') {
    showToast('Signed out. Please sign in to continue.', 'info');
  }
  Router.go('auth-login');
};

function showPortalSwitcher() {
  window.handleSignOut();
}

function closeOverlay() {
  if (window._currentOverlay) {
    window._currentOverlay.remove();
    window._currentOverlay = null;
  }
}

// =============================================
// Universal Accurate Analytics Charts
// (Area Spline & Donut with Dark Center Badge)
// =============================================
window.renderModernAreaSplineChart = function (opts) {
  var container = document.getElementById(opts.containerId);
  if (!container) return;

  var labels = opts.labels || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var data = (opts.data && opts.data.length) ? opts.data : [0, 0, 0, 0, 0, 0, 0];
  var strokeColor = opts.strokeColor || '#3B82F6';
  var gradientId = opts.gradientId || ('grad_' + Math.random().toString(36).substr(2, 7));
  var gradStart = opts.gradientStart || '#60A5FA';
  var gradEnd = opts.gradientEnd || '#DBEAFE';
  var tooltipUnit = opts.tooltipUnit || '';

  var width = 640;
  var height = 240;
  var paddingLeft = 32;
  var paddingRight = 32;
  var paddingTop = 24;
  var paddingBottom = 42;

  var chartW = width - paddingLeft - paddingRight;
  var chartH = height - paddingTop - paddingBottom;
  var baselineY = paddingTop + chartH;

  var maxVal = Math.max(1, Math.max.apply(null, data));
  var ceiling = maxVal * 1.15; // 15% headroom

  var points = data.map(function (val, idx) {
    var x = paddingLeft + (idx / Math.max(1, labels.length - 1)) * chartW;
    var y = baselineY - (val / ceiling) * chartH;
    return { x: x, y: y, val: val, label: labels[idx] };
  });

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
  var labelTexts = '';
  var pointCircles = '';

  points.forEach(function (p) {
    gridLines += '<line x1="' + p.x.toFixed(1) + '" y1="' + paddingTop + '" x2="' + p.x.toFixed(1) + '" y2="' + baselineY + '" stroke="#E2E8F0" stroke-width="1" />';
    labelTexts += '<text x="' + p.x.toFixed(1) + '" y="' + (baselineY + 24) + '" text-anchor="middle" font-size="11" font-weight="500" fill="#64748B" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' + p.label + '</text>';
    pointCircles += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4.5" fill="' + strokeColor + '" stroke="#FFFFFF" stroke-width="2" style="cursor:pointer;"><title>' + p.label + ': ' + p.val + (tooltipUnit ? (' ' + tooltipUnit) : '') + '</title></circle>';
  });

  var svgHtml =
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto;max-height:240px;display:block;" preserveAspectRatio="xMidYMid meet">' +
    '<defs>' +
    '<linearGradient id="' + gradientId + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="' + gradStart + '" stop-opacity="0.6"/>' +
    '<stop offset="60%" stop-color="' + gradStart + '" stop-opacity="0.25"/>' +
    '<stop offset="100%" stop-color="' + gradEnd + '" stop-opacity="0.04"/>' +
    '</linearGradient>' +
    '</defs>' +
    gridLines +
    '<line x1="' + paddingLeft + '" y1="' + baselineY + '" x2="' + (width - paddingRight) + '" y2="' + baselineY + '" stroke="#CBD5E1" stroke-width="1.2" />' +
    '<path d="' + areaD + '" fill="url(#' + gradientId + ')" />' +
    '<path d="' + splineD + '" fill="none" stroke="' + strokeColor + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
    labelTexts +
    pointCircles +
    '</svg>';

  container.innerHTML = svgHtml;
};

window.renderModernDonutChart = function (opts) {
  var container = document.getElementById(opts.containerId);
  if (!container) return;

  var slices = opts.slices || [];
  var total = 0;
  slices.forEach(function (s) { total += (s.count || 0); });

  var centerCount = (opts.centerCount !== undefined) ? opts.centerCount : total;
  var centerLabel = opts.centerLabel || 'Total';

  var width = 380;
  var height = 240;
  var cx = 190;
  var cy = 120;
  var R = 78;
  var r = 45;

  var currentAngle = -Math.PI / 2;
  var slicesHtml = '';
  var labelsHtml = '';

  if (total === 0) {
    slicesHtml = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#E2E8F0" stroke-width="' + (R - r) + '" />';
  } else {
    slices.forEach(function (slice) {
      var count = slice.count || 0;
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

      var color = slice.color || '#94A3B8';

      slicesHtml += '<path d="' + pathD + '" fill="' + color + '" stroke="#FFFFFF" stroke-width="1.5">' +
        '<title>' + slice.label + ': ' + count + ' (' + Math.round((count / total) * 100) + '%)</title>' +
        '</path>';

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
        slice.label +
        '</text>';

      currentAngle = endAngle;
    });
  }

  // Dark Center Badge with Total
  var centerBadge =
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 1) + '" fill="#1E293B" />' +
    '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" font-size="20" font-weight="800" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' + centerCount + '</text>' +
    '<text x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="10" font-weight="500" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, sans-serif">' + centerLabel + '</text>';

  var svgHtml =
    '<svg viewBox="0 0 ' + width + ' ' + height + '" style="width:100%;height:auto;max-height:240px;display:block;" preserveAspectRatio="xMidYMid meet">' +
    slicesHtml +
    centerBadge +
    labelsHtml +
    '</svg>';

  container.innerHTML = svgHtml;
};


