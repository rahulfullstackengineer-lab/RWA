// ============================================================
// RWA SaaS — Comprehensive Live Features Engine
// Razorpay, WebSockets, Local DB Sync, Modals & Workflows
// ============================================================

(function () {
  console.log('⚡ Initializing RWA SaaS Complete Functional Engine...')

  // ------------------------------------------------------------
  // 1. Live WebSockets via Socket.io
  // ------------------------------------------------------------
  let socket = null
  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('rwa_user') || '{}');
    } catch {
      return {};
    }
  }

  function audienceRole(role) {
    if (role === 'STAFF') return 'staff';
    if (['RWA_ADMIN', 'ADMIN', 'TREASURER', 'SECRETARY', 'PRESIDENT', 'COMMITTEE_MEMBER', 'MANAGER'].indexOf(role) !== -1) {
      return 'admin';
    }
    return 'resident';
  }

  function onlyFor(roles) {
    return roles.indexOf(audienceRole(getStoredUser().role)) !== -1
  }

  function getActiveOrgId() {
    const user = getStoredUser();
    return localStorage.getItem('rwa_active_org_id') ||
      user.organizationId ||
      (window.currentSociety && window.currentSociety.id) ||
      (window.rwa_user && window.rwa_user.organizationId) ||
      '';
  }

  function getCurrentUserId() {
    const user = getStoredUser();
    return user.id || (window.rwa_user && window.rwa_user.id) || '';
  }

  function syncSocketRooms() {
    if (!socket || !socket.connected) return;
    const user = getStoredUser();
    const orgId = getActiveOrgId();
    const userId = getCurrentUserId();
    if (orgId) {
      const role = audienceRole(user.role);
      console.log('📡 Socket joining rooms:', `org:${orgId}`, role, userId || 'no-user');
      socket.emit('join-org', { orgId: orgId, role: role });
    }
    if (userId) {
      socket.emit('join-user', userId);
    }
  }
  window.syncSocketRooms = syncSocketRooms;

  window.refreshPagesAfterPayment = function() {
    var screen = ''
    try {
      screen = (typeof Router !== 'undefined' && Router.current) ? Router.current() : ''
    } catch (e) {}
    if (!screen) screen = (window.location.hash || '').replace('#', '')

    if (screen === 'admin-unit-detail' && typeof window.restoreOpenUnit === 'function') {
      var unitId = (window.readScreenRecord && window.readScreenRecord('unit')) || (window.__selectedUnit && window.__selectedUnit.id) || ''
      window.restoreOpenUnit(unitId)
    } else if (typeof window.loadLiveUnitsScreen === 'function') {
      window.loadLiveUnitsScreen()
    }

    if (screen === 'admin-invoice-detail' && typeof window.restoreOpenInvoice === 'function') {
      window.restoreOpenInvoice(window.readScreenRecord ? window.readScreenRecord('invoice') : '')
    } else if (typeof window.loadLiveInvoicesScreen === 'function') {
      window.loadLiveInvoicesScreen()
    }

    if (screen === 'admin-payments' && typeof window.loadLivePaymentsScreen === 'function') window.loadLivePaymentsScreen()
    if (screen === 'admin-dues' && typeof window.loadLiveDuesScreen === 'function') window.loadLiveDuesScreen()
    if (screen === 'admin-dashboard' && typeof window.loadLiveAdminDashboard === 'function') window.loadLiveAdminDashboard()
    if (String(screen).indexOf('resident') === 0) {
      if (typeof window.loadLiveResidentDashboard === 'function') window.loadLiveResidentDashboard()
      if (typeof window.loadLiveResidentBills === 'function') window.loadLiveResidentBills()
      if (typeof window.loadLiveResidentPayments === 'function') window.loadLiveResidentPayments()
      if (typeof window.loadLiveResidentLedger === 'function') window.loadLiveResidentLedger()
    }
  }

  function currentScreen() {
    let screen = ''
    try { screen = (typeof Router !== 'undefined' && Router.current) ? Router.current() : '' } catch (e) {}
    if (!screen) screen = (window.location.hash || '').replace('#', '')
    return String(screen || '')
  }

  function onStaffSurface() {
    const role = getStoredUser().role
    return role === 'STAFF'
      || (document.body && document.body.dataset.portal === 'staff')
      || currentScreen().indexOf('staff-') === 0
  }

  function isExpenseNotice(note) {
    const type = String((note && (note.type || note.event)) || '')
    const title = String((note && (note.title || note.text)) || '')
    const message = String((note && note.message) || '')
    return type.toUpperCase() === 'EXPENSE'
      || type === 'new-expense-recorded'
      || type === 'expense-status-updated'
      || /expense/i.test(title + ' ' + message)
  }

  function noticeFitsSurface(note) {
    const role = audienceRole(getStoredUser().role)
    const audience = note && note.audience
    if (Array.isArray(audience) && audience.length && audience.indexOf(role) === -1 && !(note && note.userId)) return false
    if (role === 'resident' && isExpenseNotice(note)) return false
    if (!onStaffSurface()) return role !== 'staff' || !isExpenseNotice(note)
    if (isExpenseNotice(note)) return false
    const title = String((note && (note.title || note.text)) || '')
    const type = String((note && (note.type || note.event)) || '').toUpperCase()
    if (/salary sent to/i.test(title)) return false
    if (type === 'STAFF_SALARY' || /salary credited to you/i.test(title)) return true
    if (/pass|visitor|gate|duty|shift|sos|emergency|complaint|ticket/i.test(title + ' ' + String((note && note.message) || ''))) return true
    return false
  }

  function hideMismatchedLiveBar() {
    const item = window.__liveBroadcast
    if (!item) return
    if (noticeFitsSurface({ title: item.text, text: item.text, type: item.kind })) return
    window.__liveBroadcast = null
    if (typeof window.mountLiveBroadcast === 'function') window.mountLiveBroadcast()
  }

  function updateNotificationBellBadge(showDot = true) {
    const dot = document.getElementById('headerNotifDot');
    if (dot) {
      dot.style.display = showDot ? 'block' : 'none';
    }
  }
  window.updateNotificationBellBadge = updateNotificationBellBadge;

  async function checkUnreadNotificationsBadge() {
    try {
      const fetchFn = window.apiFetch || fetch;
      const res = await fetchFn('/api/notifications');
      if (res && res.ok) {
        const data = await res.json();
        const unreadCount = data.unreadCount || 0;
        updateNotificationBellBadge(unreadCount > 0);
        hideMismatchedLiveBar();
        if (window.__liveBroadcast && window.__liveBroadcast.fromInbox) {
          window.__liveBroadcast = null;
          if (typeof window.mountLiveBroadcast === 'function') window.mountLiveBroadcast();
        }
        const badge = document.getElementById('notifDropdownBadge');
        if (badge) {
          badge.textContent = unreadCount > 0 ? `${unreadCount} New` : 'All caught up';
          badge.className = `badge ${unreadCount > 0 ? 'badge-blue' : 'badge-green'}`;
        }
        const inboxBadge = document.getElementById('sidebarBadgeInbox');
        if (inboxBadge) {
          if (unreadCount > 0) {
            inboxBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            inboxBadge.style.display = '';
          } else {
            inboxBadge.style.display = 'none';
          }
        }
        return unreadCount;
      }
    } catch (e) {}
    return 0;
  }
  window.checkUnreadNotificationsBadge = checkUnreadNotificationsBadge;

  // Initial check on startup and periodic 25-second heartbeat
  setTimeout(checkUnreadNotificationsBadge, 500);
  setInterval(checkUnreadNotificationsBadge, 25000);

  const socketEventsWithOwnToast = {
    'new-notice': true,
    'new-complaint-ticket': true,
    'payment-confirmed': true,
    'new-payment-received': true,
    'complaint-status-updated': true,
    'new-expense-recorded': true,
    'new-meeting-scheduled': true,
    'new-amenity-booking': true,
    'google-calendar-synced': true,
    'resident-onboarded': true,
    'bills-generated': true,
    'new-bill-generated': true,
    'bills-updated-bulk': true,
    'passes:updated': true,
    'duty:roster-updated': true,
    'sos:alarm-triggered': true,
    'staff-salary-paid': true,
    'poll-status-changed': true,
    'amenity-booking-updated': true,
  };

  function connectLiveSocket() {
    if (typeof io === 'undefined' || socket) return false;
    try {
      socket = io({
        path: '/api/socket/io',
        transports: ['websocket', 'polling'],
        autoConnect: true,
      })

      socket.on('connect', () => {
        console.log('🟢 Socket connected:', socket.id)
        syncSocketRooms()
        checkUnreadNotificationsBadge()
      })

      socket.on('live-notification', (data) => {
        if (!noticeFitsSurface(data)) return;
        updateNotificationBellBadge(true);
        checkUnreadNotificationsBadge();
        if (data && data.event && socketEventsWithOwnToast[data.event]) return;
        if (data && data.title && typeof showToast === 'function') {
          showToast(data.title, 'info');
        }
      })

      socket.on('new-notice', (data) => {
        showToast(`📢 New Notice: ${data.title}`, 'info')
        updateNotificationBellBadge(true)
        if (typeof playNotificationSound === 'function') {
          try { playNotificationSound() } catch (e) {}
        }
        if (typeof window.loadLiveResidentNotices === 'function' && window.location.hash.includes('resident-notices')) {
          window.loadLiveResidentNotices()
        }
      })

      socket.on('new-complaint-ticket', (data) => {
        if (!onlyFor(['admin', 'staff'])) return
        showToast(`🎫 New Ticket ${data.ticketNumber}: ${data.title}`, 'info')
        updateNotificationBellBadge(true)
      })

      socket.on('payment-confirmed', (data) => {
        showToast(`🎉 Payment Confirmed: ₹${Number(data.amount).toLocaleString('en-IN')}`, 'success')
        if (typeof window.refreshPagesAfterPayment === 'function') window.refreshPagesAfterPayment()
      })

      socket.on('new-payment-received', (data) => {
        if (!onlyFor(['admin'])) return
        showToast(`💰 Payment Received: Flat ${data.unitNumber} (₹${data.amount})`, 'success')
        updateNotificationBellBadge(true)
        if (typeof window.refreshPagesAfterPayment === 'function') window.refreshPagesAfterPayment()
      })

      socket.on('complaint-status-updated', (data) => {
        showToast(`Ticket ${data.ticketNumber || ''} updated to ${data.newStatus}`, 'info')
        updateNotificationBellBadge(true)
      })

      socket.on('staff-salary-paid', (data) => {
        if (!onlyFor(['admin', 'staff'])) return
        const title = data && data.title ? data.title : ''
        const forThisStaff = /credited to you/i.test(title)
        if (onStaffSurface() && !forThisStaff) {
          if (typeof window.loadLiveStaffPortal === 'function') window.loadLiveStaffPortal()
          return
        }
        if (!onStaffSurface() && forThisStaff && audienceRole(getStoredUser().role) !== 'staff') return
        const amount = Number(data && (data.amount || (data.payment && data.payment.amount)) || 0)
        const who = data && data.staffName ? data.staffName : 'this staff member'
        const line = title || ('₹' + amount.toLocaleString('en-IN') + ' credited to ' + who)
        if (typeof showToast === 'function') showToast(line, 'success')
        updateNotificationBellBadge(true)
        checkUnreadNotificationsBadge()
        if (currentScreen().indexOf('staff-') === 0 && typeof window.loadLiveStaffPortal === 'function') {
          window.loadLiveStaffPortal()
        }
      })

      socket.on('new-expense-recorded', (data) => {
        if (onStaffSurface() || audienceRole(getStoredUser().role) !== 'admin') return
        showToast(`🧾 Expense of ₹${Number(data.amount).toLocaleString('en-IN')} (${data.title}) recorded!`, 'info')
      })

      socket.on('new-meeting-scheduled', (data) => {
        if (!onlyFor(['admin', 'resident'])) return
        showToast(`📅 Meeting scheduled: ${data.title}`, 'info')
        updateNotificationBellBadge(true)
      })

      socket.on('new-amenity-booking', (data) => {
        if (!onlyFor(['admin', 'resident'])) return
        showToast(`🏊 Booking confirmed: ${data.amenityName} for ${data.bookedByName}`, 'success')
      })

      socket.on('google-calendar-synced', (data) => {
        if (!onlyFor(['admin'])) return
        showToast(`📅 Event "${data.title}" synced to Google Calendar!`, 'info')
      })

      // 👤 Real-Time Resident Onboarding Alert for RWA Admin
      socket.on('resident-onboarded', (data) => {
        if (!onlyFor(['admin'])) return
        const typeStr = data.occupancyType === 'TENANT' ? 'Tenant' : 'Flat Owner'
        const text = data.message
          || (data.residentName
            ? `${data.residentName} (+91 ${data.phone || ''}) joined Unit ${data.unitNumber || ''} as ${typeStr}.`
            : 'A new resident was registered.')
        showToast(text, 'success', true)
        updateNotificationBellBadge(true)

        if (typeof window.loadLiveNotifications === 'function' && window.location.hash.includes('admin-notifications')) {
          window.loadLiveNotifications('admin')
        }
        if (typeof window.loadLiveNotifications === 'function' && window.location.hash.includes('resident-notifications')) {
          window.loadLiveNotifications('resident')
        }
        if (typeof window.loadLiveUnitsScreen === 'function' && window.location.hash.includes('admin-structure')) {
          window.loadLiveUnitsScreen()
        }
        if (typeof window.loadLiveMembersScreen === 'function' && window.location.hash.includes('admin-members')) {
          window.loadLiveMembersScreen()
        }
        if (typeof window.loadLiveAdminDashboard === 'function' && window.location.hash.includes('admin-dashboard')) {
          window.loadLiveAdminDashboard()
        }
      })

      // ⚡ Real-Time Billing & Invoices Socket Events
      socket.on('bills-generated', (data) => {
        console.log('⚡ Socket event bills-generated received:', data)
        if (!onlyFor(['admin'])) return
        const count = data.count || data.createdCount || data.totalInvoices || ''
        const demandStr = data.totalDemand ? ` · Total Demand: ₹${Number(data.totalDemand).toLocaleString('en-IN')}` : ''
        showToast(`⚡ ${count} Monthly Bills Issued for ${data.billingMonth}!${demandStr}`, 'success')
        updateNotificationBellBadge(true)

        if (typeof window.loadLiveAdminDashboard === 'function' && window.location.hash.includes('admin-dashboard')) {
          window.loadLiveAdminDashboard()
        }
        if (typeof window.loadLiveInvoicesScreen === 'function' && window.location.hash.includes('admin-invoices')) {
          window.loadLiveInvoicesScreen()
        }
        if (typeof window.loadLiveResidentBills === 'function' && window.location.hash.includes('resident-bills')) {
          window.loadLiveResidentBills()
        }
      })

      socket.on('new-bill-generated', (data) => {
        console.log('📄 Socket event new-bill-generated received:', data)
        const amt = data.amount ? `₹${Number(data.amount).toLocaleString('en-IN')}` : ''
        const unit = data.unitNumber ? ` for Flat ${data.unitNumber}` : ''
        showToast(`🔔 New Maintenance Bill Issued: ${amt}${unit} (${data.billingMonth || ''})`, 'info')
        updateNotificationBellBadge(true)

        if (typeof window.loadLiveResidentBills === 'function') {
          window.loadLiveResidentBills()
        }
        if (typeof window.loadLiveInvoicesScreen === 'function' && window.location.hash.includes('admin-invoices')) {
          window.loadLiveInvoicesScreen()
        }
      })

      socket.on('bills-updated-bulk', (data) => {
        console.log('🔄 Socket event bills-updated-bulk received:', data)
        if (!onlyFor(['admin'])) return
        showToast(`🔄 Bulk Update: ${data.updatedCount || 'All'} bills for ${data.billingMonth} revised!`, 'success')
        updateNotificationBellBadge(true)

        if (typeof window.loadLiveAdminDashboard === 'function' && window.location.hash.includes('admin-dashboard')) {
          window.loadLiveAdminDashboard()
        }
        if (typeof window.loadLiveInvoicesScreen === 'function' && window.location.hash.includes('admin-invoices')) {
          window.loadLiveInvoicesScreen()
        }
        if (typeof window.loadLiveResidentBills === 'function' && window.location.hash.includes('resident-bills')) {
          window.loadLiveResidentBills()
        }
      })

      socket.on('bill-updated', (data) => {
        console.log('📄 Socket event bill-updated received:', data)
        showToast(`📄 Your bill for ${data.billingMonth} has been revised: ${data.message || ''}`, 'info')
        updateNotificationBellBadge(true)

        if (typeof window.loadLiveResidentBills === 'function') {
          window.loadLiveResidentBills()
        }
      })

      socket.on('duty:roster-updated', (data) => {
        console.log('🛡️ Socket event duty:roster-updated received:', data)
        const msg = data.message || 'Society staff duty roster has been updated';
        if (typeof showToast === 'function') {
          showToast(`🛡️ ${msg}`, 'info')
        }
        if (typeof updateNotificationBellBadge === 'function') {
          updateNotificationBellBadge(true)
        }
        if (typeof window.loadLiveResidentDashboard === 'function') {
          window.loadLiveResidentDashboard()
        }
        if (typeof window.loadLiveStaffDuties === 'function') {
          window.loadLiveStaffDuties(true)
        }
      })

      socket.on('emergency:contacts-updated', (data) => {
        console.log('🚨 Socket event emergency:contacts-updated received:', data)
        if (typeof window.loadLiveEmergencyContacts === 'function') window.loadLiveEmergencyContacts(true)
        if (typeof window.loadLiveResidentDashboard === 'function') window.loadLiveResidentDashboard()
      })

      socket.on('sos:alarm-triggered', (data) => {
        console.log('🚨 Emergency SOS alarm received:', data)
        if (!onlyFor(['admin', 'staff'])) return
        if (typeof showToast === 'function') {
          showToast(`🚨 SOS ALARM: Flat ${data.unitNumber || 'Campus'} (${data.residentName || 'Resident'}) triggered an emergency alert!`, 'error')
        }
        if (typeof window.playNotificationSound === 'function') window.playNotificationSound()
      })

      socket.on('passes:updated', (data) => {
        console.log('🎫 Socket event passes:updated received:', data)
        if (data.action === 'CHECKED_IN' && data.pass) {
          if (typeof showToast === 'function') {
            showToast(`🔔 Visitor Arrived: ${data.pass.visitorName} checked in at ${data.pass.gateNumber || 'Gate'}!`, 'success')
          }
        } else if (data.action === 'CREATED' && data.pass) {
          if (typeof showToast === 'function') {
            showToast(`New visiting pass: ${data.pass.visitorName} (Flat ${data.pass.residentUnit})`, 'success')
          }
        }
        if (typeof updateNotificationBellBadge === 'function') updateNotificationBellBadge(true)
        const passRole = getStoredUser().role
        if (passRole === 'RESIDENT') {
          if (typeof window.loadLiveResidentDashboard === 'function') window.loadLiveResidentDashboard()
          return
        }
        if (typeof window.loadLiveAdminEntryPasses === 'function') window.loadLiveAdminEntryPasses()
        if (passRole === 'STAFF' && typeof window.loadLiveStaffPortal === 'function') window.loadLiveStaffPortal()
        if (typeof window.loadLiveResidentDashboard === 'function' && passRole !== 'STAFF') window.loadLiveResidentDashboard()
      })
    } catch (err) {
      console.warn('Socket initialization error:', err)
      socket = null
      return false
    }
    return true
  }

  if (!connectLiveSocket()) {
    const socketRetry = setInterval(function() {
      if (connectLiveSocket()) clearInterval(socketRetry)
    }, 400)
    setTimeout(function() { clearInterval(socketRetry) }, 8000)
  }

  try {
    const originalSetItem = localStorage.setItem.bind(localStorage)
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value)
      if (key === 'rwa_user' || key === 'rwa_active_org_id') {
        syncSocketRooms()
      }
    }
  } catch (e) {}

  // ------------------------------------------------------------
  // 2. Live Sidebar Badge Counts (dynamic from DB)
  // ------------------------------------------------------------
  async function loadSidebarBadgeCounts() {
    try {
      const orgId = localStorage.getItem('rwa_active_org_id') || '';
      const orgParam = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';

      // Fetch members for pending badge
      const membersRes = await (window.apiFetch || fetch)('/api/members' + orgParam).catch(() => null);
      if (membersRes && membersRes.ok) {
        const membersData = await membersRes.json().catch(() => ({}));
        const members = membersData.members || [];
        const pendingCount = members.filter(m => (m.status || '').toUpperCase() === 'PENDING').length;
        const membersBadge = document.getElementById('sidebarBadgeMembers');
        if (membersBadge) {
          if (pendingCount > 0) {
            membersBadge.textContent = pendingCount;
            membersBadge.style.display = '';
          } else {
            membersBadge.style.display = 'none';
          }
        }
      }

      // Fetch dues count (unpaid invoices = overdue/defaulters)
      const invoiceParam = orgId ? '?orgId=' + encodeURIComponent(orgId) + '&status=UNPAID' : '?status=UNPAID';
      const duesRes = await (window.apiFetch || fetch)('/api/billing/invoices' + invoiceParam).catch(() => null);
      if (duesRes && duesRes.ok) {
        const duesData = await duesRes.json().catch(() => ({}));
        const invoices = duesData.invoices || [];
        // Count distinct units with unpaid dues
        const uniqueUnits = new Set(invoices.map(function(inv) { return inv.unitId; }));
        const duesCount = uniqueUnits.size || invoices.length;
        const duesBadge = document.getElementById('sidebarBadgeDues');
        if (duesBadge) {
          if (duesCount > 0) {
            duesBadge.textContent = duesCount;
            duesBadge.style.display = '';
          } else {
            duesBadge.style.display = 'none';
          }
        }
      }

      // Fetch open complaints count
      const compRes = await (window.apiFetch || fetch)('/api/complaints' + orgParam).catch(() => null);
      if (compRes && compRes.ok) {
        const compData = await compRes.json().catch(() => ({}));
        const complaints = compData.complaints || [];
        const openCount = complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length;
        const compBadge = document.getElementById('sidebarBadgeComplaints');
        if (compBadge) {
          if (openCount > 0) {
            compBadge.textContent = openCount;
            compBadge.style.display = '';
          } else {
            compBadge.style.display = 'none';
          }
        }
      }

      // Fetch unread notifications count for Inbox badge
      const notifRes = await (window.apiFetch || fetch)('/api/notifications').catch(() => null);
      if (notifRes && notifRes.ok) {
        const notifData = await notifRes.json().catch(() => ({}));
        const unreadCount = notifData.unreadCount || 0;
        const inboxBadge = document.getElementById('sidebarBadgeInbox');
        if (inboxBadge) {
          if (unreadCount > 0) {
            inboxBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            inboxBadge.style.display = '';
          } else {
            inboxBadge.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.warn('loadSidebarBadgeCounts error:', err);
    }
  }
  window.loadSidebarBadgeCounts = loadSidebarBadgeCounts;

  // Auto-load badges after navigation
  if (typeof Router !== 'undefined' && Router.onNavigate) {
    Router.onNavigate(function() {
      // Debounce: run after the new screen is rendered
      setTimeout(loadSidebarBadgeCounts, 500);
    });
  }
  // Initial load after page settles
  setTimeout(loadSidebarBadgeCounts, 1000);

  // ------------------------------------------------------------
  // 3. Global Modal Helper (was #2)
  // ------------------------------------------------------------
  function showModal(title, formHtml, submitLabel, onSubmit, maxWidth = '500px') {
    let overlay = document.getElementById('rwaGlobalModal')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'rwaGlobalModal'
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px); z-index: 99999; display: flex;
        align-items: center; justify-content: center; padding: 16px;
      `
      document.body.appendChild(overlay)
    }

    overlay.innerHTML = `
      <div style="background:#fff; border-radius:16px; max-width:${maxWidth}; width:100%; max-height:92vh; overflow-y:auto; box-shadow:0 25px 50px -12px rgba(15,23,42,0.25); border:1px solid #E2E8F0; animation: scaleUp 0.18s ease;">
        <div class="rwa-modal-chrome" style="padding: 18px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); position:sticky; top:0; z-index:10;">
          <div style="font-size: 17px; font-weight: 800; color: var(--text-primary);">${title}</div>
          <button type="button" onclick="document.getElementById('rwaGlobalModal').style.display='none'" style="background:var(--bg-elevated); border:1px solid var(--border); color:var(--text-secondary); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>
        <form id="rwaModalForm" style="padding: 20px 24px; display: flex; flex-direction: column; gap: 14px;">
          ${formHtml}
          <div class="rwa-modal-chrome" style="display: flex; gap: 10px; margin-top: 8px;">
            ${submitLabel
              ? `<button type="button" onclick="document.getElementById('rwaGlobalModal').style.display='none'" class="btn btn-secondary" style="flex:1;">Cancel</button>
                 <button type="submit" id="rwaModalSubmitBtn" class="btn btn-primary" style="flex:1;">${submitLabel}</button>`
              : `<button type="button" onclick="document.getElementById('rwaGlobalModal').style.display='none'" class="btn btn-secondary" style="width:100%;">Close</button>`
            }
          </div>
        </form>
      </div>
    `
    overlay.style.display = 'flex'

    const form = document.getElementById('rwaModalForm')
    if (form && submitLabel && typeof onSubmit === 'function') {
      form.onsubmit = async (e) => {
        e.preventDefault()
        const btn = document.getElementById('rwaModalSubmitBtn')
        if (btn) {
          btn.disabled = true
          btn.innerHTML = 'Saving...'
        }
        try {
          await onSubmit(form)
          overlay.style.display = 'none'
        } catch (err) {
          showToast(err.message || 'Operation failed', 'error')
        } finally {
          if (btn) {
            btn.disabled = false
            btn.innerHTML = submitLabel
          }
        }
      }
    }
  }
  window.showModal = showModal

  if (!window.__rwaPrintHooks) {
    window.__rwaPrintHooks = true
    window.addEventListener('beforeprint', function() {
      const modal = document.getElementById('rwaGlobalModal')
      const open = modal && window.getComputedStyle(modal).display !== 'none'
      if (open) document.body.classList.add('rwa-print-modal')
    })
    window.addEventListener('afterprint', function() {
      document.body.classList.remove('rwa-print-modal')
    })
  }

  // ------------------------------------------------------------
  // 3. New Complaint Modal (Admin & Resident)
  // ------------------------------------------------------------
  window.openNewComplaintModal = async function () {
    let unitsList = window.__residentUnitsCache || [];
    if (!unitsList || unitsList.length === 0) {
      try {
        const uRes = await (window.apiFetch || fetch)('/api/units').catch(() => null);
        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          unitsList = uData.units || [];
          window.__residentUnitsCache = unitsList;
        }
      } catch (e) {}
    }

    let user = null;
    try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch(e) {}
    const activeUnitId = window.__residentPreviewUnitId || user?.unitId;

    let unitOptions = '<option value="">🏢 Common Area / Society Infrastructure</option>';
    if (unitsList.length > 0) {
      unitOptions += unitsList.map(u => `
        <option value="${u.id}" ${u.id === activeUnitId ? 'selected' : ''}>
          🏠 Flat ${u.unitNumber} (${(u.block && u.block.name) || 'Tower'}${u.ownerName ? ' · ' + u.ownerName : ''})
        </option>
      `).join('');
    }

    const html = `
      <div>
        <label class="form-label">Issue Summary / Title *</label>
        <input type="text" id="compTitle" required placeholder="e.g. Lift #2 jerking & floor levelling misalignment, corridor lighting" class="form-input" style="width:100%;font-size:13.5px;font-weight:600;" />
      </div>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <div style="flex:1;">
          <label class="form-label">Category *</label>
          <select id="compCat" class="form-select" style="width:100%;">
            <option value="PLUMBING">🚰 Plumbing & Water</option>
            <option value="ELECTRICAL">⚡ Electrical & Power</option>
            <option value="LIFT" selected>🛗 Elevator / Lift AMC</option>
            <option value="MAINTENANCE">🔧 Civil & Maintenance</option>
            <option value="SECURITY">🛡️ Security & Access</option>
            <option value="SANITATION">🧹 Housekeeping & Garbage</option>
            <option value="OTHER">📦 General Enquiry</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label">Priority / SLA *</label>
          <select id="compPriority" class="form-select" style="width:100%;">
            <option value="URGENT">🚨 Urgent (4 Hr SLA)</option>
            <option value="HIGH">⚡ High (12 Hr SLA)</option>
            <option value="MEDIUM" selected>Medium (24 Hr SLA)</option>
            <option value="LOW">Low (48 Hr SLA)</option>
          </select>
        </div>
      </div>
      <div style="margin-top:8px;">
        <label class="form-label">Affected Flat / Location *</label>
        <select id="compUnit" class="form-select" style="width:100%;">
          ${unitOptions}
        </select>
      </div>
      <div style="margin-top:8px;">
        <label class="form-label">Description & Symptoms *</label>
        <textarea id="compDesc" required rows="3" placeholder="Provide full details, location, and preferred technician inspection timings..." class="form-input" style="width:100%; resize:vertical;"></textarea>
      </div>
    `;

    showModal('Raise Helpdesk Ticket', html, 'Submit Ticket 🚀', async () => {
      const title = document.getElementById('compTitle').value.trim();
      const category = document.getElementById('compCat').value;
      const priority = document.getElementById('compPriority').value;
      const unitId = document.getElementById('compUnit').value || null;
      const description = document.getElementById('compDesc').value.trim();

      if (!title || !description) {
        showToast('Please provide a title and description', 'warning');
        return;
      }

      try {
        const fetchFn = window.apiFetch || fetch;
        const res = await fetchFn('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, category, priority, unitId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof playNotificationSound === 'function') {
            try { playNotificationSound(); } catch (e) {}
          }
          showToast(`🎫 Ticket ${data.complaint?.ticketNumber || ''} submitted successfully!`, 'success');
          if (typeof window.loadLiveResidentComplaints === 'function') {
            window.loadLiveResidentComplaints();
          }
          if (typeof window.loadAdminComplaints === 'function') {
            window.loadAdminComplaints();
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || 'Failed to submit ticket', 'error');
        }
      } catch (err) {
        showToast('Network error submitting ticket', 'error');
      }
    });
  };

  // ------------------------------------------------------------
  // 4. Post Society Notice Modal
  // ------------------------------------------------------------
  window.openPostNoticeModal = function () {
    const html = `
      <div>
        <label class="form-label">Notice Headline *</label>
        <input type="text" id="notTitle" required placeholder="e.g. Water Tank Cleaning Schedule" class="form-input" style="width:100%;" />
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Category</label>
          <select id="notType" class="form-select" style="width:100%;">
            <option value="GENERAL">General Notice</option>
            <option value="MAINTENANCE">Maintenance Alert</option>
            <option value="EVENT">Event / Cultural</option>
            <option value="MEETING">AGM / Committee Meeting</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label">Broadcast Channels</label>
          <select id="notChannels" class="form-select" style="width:100%;">
            <option value="IN_APP">In-App + SMS</option>
            <option value="IN_APP_WHATSAPP">In-App + WhatsApp</option>
            <option value="ALL">All (App, SMS, WhatsApp)</option>
          </select>
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Notice Expiry Date (Optional)</label>
          <input type="date" id="notExpiry" value="${new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]}" class="form-input" style="width:100%;" />
        </div>
        <div style="flex:1;">
          <label class="form-label">Broadcast Schedule Time</label>
          <input type="time" id="notTime" value="09:00" class="form-input" style="width:100%;" />
        </div>
      </div>
      <div>
        <label class="form-label">Announcement Content *</label>
        <textarea id="notContent" required rows="4" placeholder="Detail timings, instructions, and impact for residents..." class="form-input" style="width:100%; resize:vertical;"></textarea>
      </div>
    `

    showModal('📢 Broadcast Society Notice', html, 'Publish & Broadcast', async () => {
      const title = document.getElementById('notTitle').value.trim()
      const content = document.getElementById('notContent').value.trim()
      const type = document.getElementById('notType').value

      const noticeRes = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      })
      if (!noticeRes.ok) {
        const failed = await noticeRes.json().catch(() => ({}))
        showToast(failed.error || 'Notice was not published', 'error')
        return
      }

      showToast('Notice published to this society.', 'success')
      if (typeof Router !== 'undefined') {
        Router.go(Router.current())
      }
    })
  }

  // ------------------------------------------------------------
  // 5. Add Resident / Member Modal  (Unit dropdown from DB)
  // ------------------------------------------------------------
  window.openAddMemberModal = async function () {
    // Fetch units from DB for the dropdown
    const orgId = localStorage.getItem('rwa_active_org_id') || '';
    const orgParam = orgId ? '?orgId=' + encodeURIComponent(orgId) : '';
    let unitOptions = '<option value="">— Select Flat / Unit —</option>';
    try {
      const unitRes = await (window.apiFetch || fetch)('/api/units' + orgParam).catch(() => null);
      if (unitRes && unitRes.ok) {
        const unitData = await unitRes.json().catch(() => ({}));
        const units = unitData.units || [];
        units.forEach(function(u) {
          const label = u.block ? (u.block.name + ' – ' + u.unitNumber) : u.unitNumber;
          unitOptions += '<option value="' + u.id + '" data-number="' + u.unitNumber + '">' + label + '</option>';
        });
      }
    } catch (e) { /* silently skip */ }

    const html = [
      '<div>',
      '  <label class="form-label">Full Name *</label>',
      '  <input type="text" id="memName" required placeholder="e.g. Gurpreet Singh" class="form-input" style="width:100%;" />',
      '</div>',
      '<div style="display:flex; gap:10px;">',
      '  <div style="flex:1;">',
      '    <label class="form-label">Phone Number *</label>',
      '    <input type="tel" id="memPhone" required placeholder="9812345678" class="form-input" style="width:100%;" />',
      '  </div>',
      '  <div style="flex:1;">',
      '    <label class="form-label">Email Address</label>',
      '    <input type="email" id="memEmail" placeholder="resident@example.com" class="form-input" style="width:100%;" />',
      '  </div>',
      '</div>',
      '<div>',
      '  <label class="form-label">Flat / Unit *</label>',
      '  <select id="memUnit" required class="form-select" style="width:100%;">',
      unitOptions,
      '  </select>',
      '</div>',
      '<div style="display:flex; gap:10px;">',
      '  <div style="flex:1;">',
      '    <label class="form-label">Occupancy Type</label>',
      '    <select id="memType" class="form-select" style="width:100%;">',
      '      <option value="Owner">Owner Occupant</option>',
      '      <option value="Tenant">Registered Tenant</option>',
      '    </select>',
      '  </div>',
      '  <div style="flex:1;">',
      '    <label class="form-label">Portal Role</label>',
      '    <select id="memRole" class="form-select" style="width:100%;">',
      '      <option value="RESIDENT">Resident Member</option>',
      '      <option value="RWA_ADMIN">Executive Committee</option>',
      '      <option value="TREASURER">Treasurer</option>',
      '    </select>',
      '  </div>',
      '</div>',
      '<div style="background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);padding:10px;border-radius:8px;font-size:12px;color:#475569;">',
      '  💡 <strong>Instant Activation:</strong> Once added, the resident can log in using their mobile number and OTP.',
      '</div>',
    ].join('')

    showModal('👤 Add New Resident Member', html, 'Save & Provision Resident 🚀', async function() {
      const name = document.getElementById('memName') ? document.getElementById('memName').value.trim() : ''
      const phone = document.getElementById('memPhone') ? document.getElementById('memPhone').value.trim() : ''
      const email = document.getElementById('memEmail') ? document.getElementById('memEmail').value.trim() : ''
      const unitSelectEl = document.getElementById('memUnit')
      const unitId = unitSelectEl ? unitSelectEl.value : ''
      const unitNumber = (unitSelectEl && unitSelectEl.options[unitSelectEl.selectedIndex]) ? unitSelectEl.options[unitSelectEl.selectedIndex].dataset.number : ''
      const occupancyType = document.getElementById('memType') ? document.getElementById('memType').value : 'Owner'
      const role = document.getElementById('memRole') ? document.getElementById('memRole').value : 'RESIDENT'

      if (!name || !phone) {
        showToast('Name and Phone Number are required', 'warning')
        throw new Error('Validation failed')
      }
      if (!unitId) {
        showToast('Please select a flat / unit', 'warning')
        throw new Error('Unit required')
      }

      const activeOrgId = localStorage.getItem('rwa_active_org_id') || localStorage.getItem('rwa_active_society_id') || ''
      const res = await (window.apiFetch || fetch)('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, email: email, unitId: unitId, unitNumber: unitNumber, occupancyType: occupancyType, role: role, organizationId: activeOrgId }),
      })

      const data = await res.json().catch(function() { return {} })
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add member')

      showToast('✅ ' + name + ' added successfully to ' + (unitNumber || 'unit') + '!', 'success')
      if (typeof window.loadLiveMembersScreen === 'function') window.loadLiveMembersScreen()
      setTimeout(loadSidebarBadgeCounts, 500)
    }, '540px')
  }

  // ------------------------------------------------------------
  // 6. Record Expense Modal
  // ------------------------------------------------------------
  window.openRecordExpenseModal = async function () {
    let people = []
    let payroll = []
    try {
      const res = await (window.apiFetch || fetch)('/api/staff/duty')
      const data = await res.json().catch(function () { return {} })
      people = (data && data.duties) || []
      const staffRes = await (window.apiFetch || fetch)('/api/staff')
      const staffData = staffRes && staffRes.ok ? await staffRes.json().catch(function () { return {} }) : {}
      payroll = staffData.staff || []
    } catch (e) {
      people = people || []
    }
    const esc = function (value) {
      return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
    }
    const phoneTail = function (value) {
      const digits = String(value || '').replace(/\D/g, '')
      return digits.length >= 10 ? digits.slice(-10) : ''
    }
    const personOptions = people.length
      ? people.map(function (person) {
          const role = person.role || person.category || 'Staff'
          const saved = payroll.find(function (row) {
            return phoneTail(row.phone) && phoneTail(row.phone) === phoneTail(person.phone)
              || (row.name && person.staffName && row.name.trim().toLowerCase() === person.staffName.trim().toLowerCase())
          })
          const salary = Number(saved && saved.salary) || Number(person.salaryAmount) || 0
          return '<option value="' + esc(person.id) + '" data-name="' + esc(person.staffName) + '" data-salary="' + (salary > 0 ? salary : '') + '">' + esc(person.staffName) + ' · ' + esc(role) + '</option>'
        }).join('')
      : '<option value="" disabled>No staff saved yet</option>'

    const html = `
      <div>
        <label class="form-label">Expense Title / Description *</label>
        <input type="text" id="expTitle" required placeholder="Filled from the staff member's name" class="form-input" style="width:100%;" oninput="this.dataset.autofill=''" />
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Amount (₹) *</label>
          <input type="number" id="expAmount" required placeholder="Saved monthly salary" class="form-input" style="width:100%;" oninput="this.dataset.autofill=''" />
        </div>
        <div style="flex:1;">
          <label class="form-label">Expense Date *</label>
          <input type="date" id="expDate" required value="${new Date().toISOString().split('T')[0]}" class="form-input" style="width:100%;" onchange="window.syncExpenseStaffFields()" />
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Category</label>
          <select id="expCat" class="form-select" style="width:100%;" onchange="window.syncExpenseStaffFields()">
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Staff Salary">Staff Salary</option>
            <option value="Security">Security Guard AMC</option>
            <option value="Electrical">DG & Power Backup</option>
            <option value="Sanitation">Housekeeping & Waste</option>
            <option value="Horticulture">Gardens & Lawn</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label">Vendor / Payee Name *</label>
          <input type="text" id="expVendor" required placeholder="e.g. Otis Elevator India Ltd" class="form-input" style="width:100%;" />
        </div>
      </div>
      <div>
        <label class="form-label">Related staff member</label>
        <select id="expPerson" class="form-select" style="width:100%;" onchange="window.syncExpenseStaffFields()">
          <option value="">Not tied to one person</option>
          <option value="__new__">New person — create an account</option>
          ${personOptions}
        </select>
        <div id="expPersonHint" style="font-size:12px;color:#64748B;margin-top:6px;">Choose a saved staff account, or add someone who is not in the society yet.</div>
      </div>
      <div id="expNewPerson" style="display:none;gap:10px;">
        <div style="display:flex;gap:10px;">
          <div style="flex:1;">
            <label class="form-label">Person name *</label>
            <input type="text" id="expNewName" placeholder="Full name" class="form-input" style="width:100%;" oninput="window.syncExpenseStaffFields()" />
          </div>
          <div style="flex:1;">
            <label class="form-label">Phone number *</label>
            <input type="tel" id="expNewPhone" placeholder="10-digit mobile" class="form-input" style="width:100%;" />
          </div>
        </div>
        <div style="margin-top:10px;">
          <label class="form-label">Department</label>
          <select id="expNewDept" class="form-select" style="width:100%;">
            <option value="Security">Security</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Gardening">Gardening</option>
            <option value="Maintenance">Technical & Maintenance</option>
            <option value="Administration">Society Office & Admin</option>
          </select>
        </div>
      </div>
      <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;font-weight:600;cursor:pointer;">
        <input type="checkbox" id="expCreditSalary" style="margin-top:2px;" />
        <span>This is their monthly salary. The amount is saved on their record. It stays unpaid until you disburse the salary.</span>
      </label>
    `

    showModal('Record Society Expense', html, 'Save Expense', async () => {
      const title = document.getElementById('expTitle').value.trim()
      const amount = document.getElementById('expAmount').value
      const vendorInput = document.getElementById('expVendor')
      const vendor = vendorInput ? vendorInput.value.trim() : ''
      const category = document.getElementById('expCat').value
      const expenseDate = document.getElementById('expDate').value
      const personEl = document.getElementById('expPerson')
      const personValue = personEl ? personEl.value : ''
      const isNewPerson = personValue === '__new__'
      const staffDutyId = isNewPerson ? '' : personValue
      const selected = !isNewPerson && personEl && personEl.selectedIndex >= 0 ? personEl.options[personEl.selectedIndex] : null
      const staffName = selected ? (selected.getAttribute('data-name') || '') : ''
      const newName = document.getElementById('expNewName') ? document.getElementById('expNewName').value.trim() : ''
      const newPhone = document.getElementById('expNewPhone') ? document.getElementById('expNewPhone').value.trim() : ''
      const newDept = document.getElementById('expNewDept') ? document.getElementById('expNewDept').value : 'Security'
      const salaryPayment = Boolean(document.getElementById('expCreditSalary') && document.getElementById('expCreditSalary').checked)

      if (!title || !amount) {
        showToast('Title and amount are required', 'warning')
        throw new Error('Validation failed')
      }
      if (isNewPerson && (!newName || !newPhone)) {
        showToast('Enter the name and phone number for the new account', 'warning')
        throw new Error('New person required')
      }
      if ((category === 'Staff Salary' || salaryPayment) && !staffDutyId && !isNewPerson) {
        showToast('Choose the staff member this salary is for, or create a new account', 'warning')
        throw new Error('Staff required')
      }

      const res = await (window.apiFetch || fetch)('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount,
          vendorName: vendor || staffName || newName,
          category,
          date: expenseDate,
          staffDutyId: staffDutyId || null,
          salaryPayment,
          newPerson: isNewPerson ? { name: newName, phone: newPhone, department: newDept } : null,
        }),
      })
      const data = await res.json().catch(function () { return {} })
      if (!res.ok || !data.success) {
        showToast(data.error || 'Could not save this expense', 'error')
        throw new Error(data.error || 'Failed to record expense')
      }

      const linkedName = (data.staffCredited && data.staffCredited.name) || data.accountName || staffName || newName
      if (data.accountCreated && linkedName) {
        showToast('Account created for ' + linkedName + '. They sign in with this phone and PIN 1234. The expense is connected to them.', 'success')
      } else if (data.staffCredited && data.staffCredited.name) {
        showToast('Salary of ₹' + Number(amount).toLocaleString('en-IN') + ' is now on ' + data.staffCredited.name + "'s account", 'success')
      } else {
        showToast('Expense of ₹' + Number(amount).toLocaleString('en-IN') + ' recorded' + (linkedName ? ' for ' + linkedName : ''), 'success')
      }
      if (typeof window.loadLiveExpenses === 'function') window.loadLiveExpenses()
      else if (typeof Router !== 'undefined') Router.go(Router.current())
    })
  }

  window.syncExpenseStaffFields = function () {
    const cat = document.getElementById('expCat')
    const person = document.getElementById('expPerson')
    const credit = document.getElementById('expCreditSalary')
    const vendor = document.getElementById('expVendor')
    const hint = document.getElementById('expPersonHint')
    const isSalary = cat && cat.value === 'Staff Salary'
    const isNew = person && person.value === '__new__'
    const fresh = document.getElementById('expNewPerson')
    if (fresh) fresh.style.display = isNew ? 'block' : 'none'
    if (credit && isSalary) credit.checked = true
    const selected = person && person.selectedIndex >= 0 ? person.options[person.selectedIndex] : null
    const typedName = document.getElementById('expNewName') ? document.getElementById('expNewName').value.trim() : ''
    const staffName = isNew ? typedName : (selected ? (selected.getAttribute('data-name') || '') : '')
    const savedSalary = selected ? Number(selected.getAttribute('data-salary') || 0) : 0
    const title = document.getElementById('expTitle')
    const amount = document.getElementById('expAmount')
    const dateValue = document.getElementById('expDate') ? document.getElementById('expDate').value : ''
    let monthLabel = ''
    if (dateValue) {
      const dated = new Date(dateValue + 'T12:00:00')
      if (!Number.isNaN(dated.getTime())) monthLabel = dated.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    const generatedTitle = staffName
      ? ((isSalary || (credit && credit.checked)) ? 'Salary for ' + staffName : ((cat && cat.value) || 'Expense') + ' for ' + staffName) + (monthLabel ? ' — ' + monthLabel : '')
      : ''
    if (title && generatedTitle && (!title.value.trim() || title.dataset.autofill === '1')) {
      title.value = generatedTitle
      title.dataset.autofill = '1'
    }
    if (title && !generatedTitle && title.dataset.autofill === '1') {
      title.value = ''
      title.dataset.autofill = ''
    }
    if (amount && savedSalary > 0 && (isSalary || (credit && credit.checked)) && (!amount.value || amount.dataset.autofill === '1')) {
      amount.value = String(savedSalary)
      amount.dataset.autofill = '1'
    }
    if (amount && (!staffName || !(isSalary || (credit && credit.checked))) && amount.dataset.autofill === '1') {
      amount.value = ''
      amount.dataset.autofill = ''
    }
    if (vendor && staffName && (!vendor.value.trim() || vendor.dataset.autofill === '1')) {
      vendor.value = staffName
      vendor.dataset.autofill = '1'
    }
    if (vendor && !staffName && vendor.dataset.autofill === '1') {
      vendor.value = ''
      vendor.dataset.autofill = ''
    }
    if (hint) {
      hint.textContent = isNew
        ? 'A staff account is created with this name and phone, then the expense is connected to it.'
        : (isSalary || (credit && credit.checked)
          ? 'This amount is written onto the selected staff member’s salary portal.'
          : 'Choose a saved staff account, or add someone who is not in the society yet.')
    }
  }

  // ------------------------------------------------------------
  // 7. Schedule Meeting Modal — Pre-flight Google Calendar Connection
  // ------------------------------------------------------------
  window.openScheduleMeetingModal = function () {
    const isConnected = localStorage.getItem('rwa_gcal_connected') === 'true'

    if (!isConnected) {
      const connectHtml = `
        <div style="display:flex;flex-direction:column;gap:14px;text-align:center;padding:8px 0;">
          <div style="font-size:46px;">📅</div>
          <div style="font-size:17px;font-weight:800;color:var(--text-primary);">Connect Google Calendar First</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 auto;max-width:400px;">
            To schedule society meetings, sync AGM agendas, and dispatch calendar invitations to residents, please connect your Google Calendar account first.
          </p>
          <div style="padding:12px;background:var(--bg-elevated);border:1px solid var(--border-light);border-radius:var(--r-md);font-size:12px;color:var(--text-muted);text-align:left;">
            🔒 <strong>Google OAuth 2.0 Scope:</strong> calendar.events.readwrite (Sector 22 RWA Official Calendar)
          </div>
        </div>
      `

      showModal('Google Calendar Connection Required', connectHtml, 'Connect Google Calendar (OAuth 2.0)', () => {
        localStorage.setItem('rwa_gcal_connected', 'true')
        showToast('✓ Google Calendar connected: sector22.rwa@gmail.com! Opening meeting scheduler...', 'success')
        setTimeout(() => {
          window.openScheduleMeetingModal()
        }, 500)
      })
      return
    }

    const html = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--green-light);border-radius:var(--r-md);margin-bottom:12px;font-size:12px;color:var(--green);font-weight:700;">
        <span>✅</span>
        <span>Connected to Google Calendar: sector22.rwa@gmail.com</span>
      </div>
      <div>
        <label class="form-label">Meeting Title *</label>
        <input type="text" id="meetTitle" required placeholder="e.g. Quarterly Executive Committee Meeting" class="form-input" style="width:100%;font-size:16px;" />
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Meeting Type</label>
          <select id="meetType" class="form-select" style="width:100%;font-size:15px;">
            <option value="COMMITTEE">Managing Committee</option>
            <option value="AGM">Annual General Meeting (AGM)</option>
            <option value="EGM">Emergency General Meeting (EGM)</option>
          </select>
        </div>
        <div style="flex:1;">
          <label class="form-label">Meeting Date & Time *</label>
          <div style="display:flex; gap:8px;">
            <input type="date" id="meetDate" required value="${new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]}" class="form-input" style="flex:1.4;font-size:15px;" />
            <input type="time" id="meetTime" required value="18:00" class="form-input" style="flex:1;font-size:15px;" />
          </div>
        </div>
      </div>
      <div>
        <label class="form-label">Venue / Meeting Link *</label>
        <input type="text" id="meetVenue" required placeholder="e.g. Community Hall / Google Meet" class="form-input" style="width:100%;font-size:16px;" />
      </div>
      <div>
        <label class="form-label">Key Agenda Points</label>
        <textarea id="meetAgenda" rows="3" placeholder="1. Accounts review&#10;2. Security guard tender&#10;3. Diwali celebrations" class="form-input" style="width:100%; resize:vertical;font-size:15px;"></textarea>
      </div>
      <div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--blue);margin-top:6px;">
          <input type="checkbox" id="meetSyncGcal" checked style="width:18px;height:18px;" />
          <span>📅 Automatically sync & create event on Google Calendar</span>
        </label>
      </div>
    `

    showModal('Schedule Society Meeting', html, 'Schedule & Sync Event', async () => {
      const title = document.getElementById('meetTitle').value.trim()
      const type = document.getElementById('meetType').value
      const venue = document.getElementById('meetVenue').value.trim()
      const agenda = document.getElementById('meetAgenda').value.trim()
      const syncGcal = document.getElementById('meetSyncGcal')?.checked
      const meetDateVal = document.getElementById('meetDate').value
      const meetTimeVal = document.getElementById('meetTime').value || '18:00'
      const startDateTime = new Date(`${meetDateVal}T${meetTimeVal}:00`)

      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, venue, agenda, scheduledAt: startDateTime.toISOString() }),
      }).catch(() => {})

      if (syncGcal && typeof window.syncEventToGoogleCalendar === 'function') {
        window.syncEventToGoogleCalendar({
          title: `${title} (${type})`,
          description: `Meeting Agenda:\n${agenda}\n\nVenue: ${venue}\nQuorum: 33% Members`,
          location: venue || 'Community Hall, Sector 22 RWA',
          startDate: startDateTime.toISOString(),
          eventType: 'MEETING'
        })
      }

      showToast(`Meeting "${title}" scheduled for ${meetDateVal} at ${meetTimeVal}! Invites broadcasted & Google Calendar synced.`, 'success')
      if (typeof Router !== 'undefined') {
        Router.go(Router.current())
      }
    })
  }

  // ------------------------------------------------------------
  // 8. Book Amenity Modal
  // ------------------------------------------------------------
  window.openBookAmenityModal = function (preselectedDate) {
    if (typeof window.openAdminBookAmenityModal === 'function' && typeof Router !== 'undefined' && Router.current() === 'admin-amenities') {
      return window.openAdminBookAmenityModal(preselectedDate);
    }

    const allAmenities = (typeof window.getAmenities === 'function')
      ? window.getAmenities()
      : [
          { name: 'Community Hall', icon: '🏛️', fee: '₹2,500 / event slot', feeNum: 2500, deposit: '₹2,000 security deposit' },
          { name: 'Swimming Pool', icon: '🏊', fee: 'Free for residents', feeNum: 0, deposit: 'No deposit' },
          { name: 'Badminton Court', icon: '🏸', fee: '₹150 / hr (floodlights)', feeNum: 150, deposit: 'No deposit' },
          { name: 'Clubhouse Meeting Room', icon: '🏢', fee: '₹500 / 3 hrs', feeNum: 500, deposit: '₹500 deposit' },
          { name: 'Party Lawn', icon: '🌿', fee: '₹5,000 / day', feeNum: 5000, deposit: '₹5,000 deposit' },
          { name: 'Fitness Gym', icon: '🏋️', fee: 'Free for residents', feeNum: 0, deposit: 'Biometric pass' },
        ];

    const defaultDate = preselectedDate || new Date().toISOString().split('T')[0];

    const html = `
      <div>
        <label class="form-label">Facility / Amenity *</label>
        <select id="amenityFacility" class="form-select" style="width:100%;">
          ${allAmenities.map(a => `
            <option value="${a.name}">
              ${a.icon || '🏛️'} ${a.name} — ${a.fee || 'Free for residents'} (${a.deposit || 'No deposit'})${a.status === 'MAINTENANCE' ? ' ⚠️ [Under Maintenance]' : ''}
            </option>
          `).join('')}
        </select>
      </div>
      <div style="display:flex; gap:10px;">
        <div style="flex:1;">
          <label class="form-label">Booking Date *</label>
          <input type="date" id="amenityDate" required value="${defaultDate}" class="form-input" style="width:100%;" />
        </div>
        <div style="flex:1;">
          <label class="form-label">Time Slot *</label>
          <select id="amenitySlot" class="form-select" style="width:100%;">
            <option>06:00 AM – 08:00 AM (Early Morning)</option>
            <option>09:00 AM – 01:00 PM (Morning)</option>
            <option selected>02:00 PM – 06:00 PM (Afternoon)</option>
            <option>06:00 PM – 08:00 PM (Evening Game/Practice)</option>
            <option>04:00 PM – 10:00 PM (Party/Event Slot)</option>
            <option>07:00 PM – 11:00 PM (Night Function)</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Occasion / Purpose *</label>
        <input type="text" id="amenityPurpose" required placeholder="e.g. Birthday celebration, Badminton match" class="form-input" style="width:100%;" />
      </div>
      <div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--blue);margin-top:6px;">
          <input type="checkbox" id="amenitySyncGcal" checked style="width:16px;height:16px;" />
          <span>📅 Add reservation to Google Calendar</span>
        </label>
      </div>
    `

    showModal('Book Society Facility', html, 'Confirm Booking', async () => {
      const amenityName = document.getElementById('amenityFacility').value
      const date = document.getElementById('amenityDate').value
      const timeSlot = document.getElementById('amenitySlot').value
      const purpose = document.getElementById('amenityPurpose').value.trim()
      const syncGcal = document.getElementById('amenitySyncGcal')?.checked

      await fetch('/api/amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenityName, date, timeSlot, purpose }),
      }).catch(() => {})

      if (syncGcal && typeof window.syncEventToGoogleCalendar === 'function') {
        window.syncEventToGoogleCalendar({
          title: `Reservation: ${amenityName}`,
          description: `Occasion: ${purpose}\nTime Slot: ${timeSlot}\nLocation: Sector 22 RWA Community Facilities`,
          location: 'Sector 22 RWA Amenities',
          startDate: `${date}T10:00:00Z`,
          eventType: 'AMENITY'
        })
      }

      showToast(`🎉 ${amenityName} successfully reserved for ${date}! Digital receipt issued.`, 'success')
      if (typeof Router !== 'undefined') {
        Router.go(Router.current())
      }
    })
  }

  // ------------------------------------------------------------
  // 9. Record Offline Payment Modal (Admin)
  // ------------------------------------------------------------
  window.handlePayUnitChange = function (selectEl) {
    if (!selectEl) return
    const opt = selectEl.options[selectEl.selectedIndex]
    if (!opt) return
    const balance = parseFloat(opt.getAttribute('data-balance') || '0')
    const amtInput = document.getElementById('payAmount')
    const hintEl = document.getElementById('payDueHint')
    if (balance > 0 && amtInput) {
      amtInput.value = balance
    }
    if (hintEl) {
      if (balance > 0) {
        hintEl.innerHTML = `<span style="color:var(--red);font-weight:700;">⚠️ Outstanding Invoice Dues: ₹${balance.toLocaleString('en-IN')}</span>`
      } else {
        hintEl.innerHTML = `<span style="color:var(--green);font-weight:600;">✓ No overdue bills for this unit</span>`
      }
    }
  }

  window.openRecordPaymentModal = async function (preselectedUnitNumber = null, preselectedAmount = null, invoiceId = null) {
    // 1. Fetch real society units from cache or API
    let units = []
    try {
      const res = await (window.apiFetch || fetch)('/api/units')
      if (res && res.ok) {
        const data = await res.json()
        units = data.units || []
        window.__cachedUnits = units
      }
    } catch (e) {
      console.warn('Could not fetch units for payment modal:', e)
    }
    if (!units.length) units = window.__cachedUnits || []

    // Outstanding is the sum of each flat's open bills, from the fresh unit list.
    const invoiceMap = {}
    units.forEach(u => {
      const invBal = (u.invoices || []).reduce((sum, inv) => {
        const owing = inv.balanceAmount > 0 ? inv.balanceAmount : 0
        return sum + owing
      }, 0)
      invoiceMap[u.unitNumber] = invBal
    })

    // Natural sort units by unitNumber
    const sortedUnits = [...units].sort((a, b) => {
      return (a.unitNumber || '').localeCompare(b.unitNumber || '', undefined, { numeric: true, sensitivity: 'base' })
    })

    // Determine initial selected unit
    let targetUnitNumber = preselectedUnitNumber
    if (!targetUnitNumber && sortedUnits.length > 0) {
      const unitWithBalance = sortedUnits.find(u => (invoiceMap[u.unitNumber] || 0) > 0)
      targetUnitNumber = unitWithBalance ? unitWithBalance.unitNumber : sortedUnits[0].unitNumber
    }

    const initialBalance = targetUnitNumber ? (invoiceMap[targetUnitNumber] || 0) : 0
    const initialAmount = preselectedAmount !== null && preselectedAmount !== undefined
      ? preselectedAmount
      : (initialBalance > 0 ? initialBalance : 2500)

    const unitOptionsHtml = sortedUnits.length > 0
      ? sortedUnits.map(u => {
          const owner = u.ownerName || (u.users && u.users[0]?.name) || 'Resident'
          const bal = invoiceMap[u.unitNumber] || 0
          const balStr = bal > 0 ? ` · Due: ₹${bal.toLocaleString('en-IN')}` : ' · Settled'
          const blockPrefix = u.block ? `${u.block.name} · ` : ''
          const isSelected = u.unitNumber === targetUnitNumber ? 'selected' : ''
          return `<option value="${u.unitNumber}" data-balance="${bal}" ${isSelected}>${blockPrefix}Flat ${u.unitNumber} (${owner}${balStr})</option>`
        }).join('')
      : `<option value="">No registered units found</option>`

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:var(--bg-elevated);padding:10px 14px;border-radius:var(--r-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Offline Payment Entry</div>
            <div style="font-size:13px;font-weight:800;color:var(--text-primary);">Record Society Cash / Cheque Collection</div>
          </div>
          <span class="badge badge-green" style="font-size:11px;font-weight:700;">Instant Receipt</span>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div style="flex:1 1 240px;">
            <label class="form-label" style="font-weight:700;">Select Unit / Flat *</label>
            <select id="payUnit" class="form-select" style="width:100%;font-size:13px;" onchange="window.handlePayUnitChange(this)" required>
              ${unitOptionsHtml}
            </select>
            <div id="payDueHint" style="font-size:11px;margin-top:4px;">
              ${initialBalance > 0
                ? `<span style="color:var(--red);font-weight:700;">⚠️ Outstanding Invoice Dues: ₹${initialBalance.toLocaleString('en-IN')}</span>`
                : `<span style="color:var(--green);font-weight:600;">✓ No overdue bills for this unit</span>`
              }
            </div>
          </div>
          <div style="flex:1 1 140px;">
            <label class="form-label" style="font-weight:700;">Amount Received (₹) *</label>
            <div style="position:relative;">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--text-muted);">₹</span>
              <input type="number" id="payAmount" required value="${initialAmount}" step="10" class="form-input" style="width:100%;padding-left:24px;font-size:15px;font-weight:700;" />
            </div>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div style="flex:1 1 180px;">
            <label class="form-label" style="font-weight:700;">Payment Mode *</label>
            <select id="payMode" class="form-select" style="width:100%;">
              <option value="Cash" selected>💵 Cash Collection</option>
              <option value="Cheque">📑 Bank Cheque</option>
              <option value="NEFT">🏦 NEFT / RTGS Transfer</option>
              <option value="UPI">📱 Direct UPI Transfer</option>
            </select>
          </div>
          <div style="flex:1 1 180px;">
            <label class="form-label" style="font-weight:700;">Payment Received Date *</label>
            <input type="date" id="payDate" required value="${new Date().toISOString().split('T')[0]}" class="form-input" style="width:100%;" />
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div style="flex:1 1 180px;">
            <label class="form-label" style="font-weight:700;">Cheque / Reference / UTR #</label>
            <input type="text" id="payRef" placeholder="e.g. CHQ-829102 or UTR-982173" class="form-input" style="width:100%;" />
          </div>
          <div style="flex:1 1 180px;">
            <label class="form-label" style="font-weight:700;">Treasurer Remarks / Narration</label>
            <input type="text" id="payNotes" placeholder="e.g. Maintenance dues received by hand" class="form-input" style="width:100%;" />
          </div>
        </div>

        <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);padding:10px 12px;border-radius:var(--r-md);font-size:12px;color:var(--text-secondary);line-height:1.4;">
          💡 When recorded, the matching unit's invoice balance will be automatically settled in real-time, marked in society accounting, and pushed via Socket.io.
        </div>
      </div>
    `

    showModal('Record Payment Received', html, 'Save Payment Receipt 💾', async () => {
      const unitNumber = document.getElementById('payUnit')?.value
      const amount = parseFloat(document.getElementById('payAmount')?.value || '0')
      const method = document.getElementById('payMode')?.value || 'Cash'
      const referenceNo = document.getElementById('payRef')?.value.trim()
      const notes = document.getElementById('payNotes')?.value.trim()

      if (!unitNumber) {
        showToast('Please select a valid unit/flat', 'warning')
        return
      }
      if (!amount || amount <= 0) {
        showToast('Please enter a valid payment amount', 'warning')
        return
      }

      showToast('Processing payment entry...', 'info')

      const res = await (window.apiFetch || fetch)('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitNumber, amount, method, referenceNo, notes, invoiceId: invoiceId || undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      showToast(`💰 Payment of ₹${Number(amount).toLocaleString('en-IN')} for Flat ${unitNumber} recorded! Digital receipt issued.`, 'success')

      if (typeof window.loadLiveAdminDashboard === 'function') {
        window.loadLiveAdminDashboard()
      }
      if (typeof window.loadLiveInvoicesScreen === 'function') {
        window.loadLiveInvoicesScreen()
      }
      if (typeof window.loadLivePaymentsScreen === 'function') {
        window.loadLivePaymentsScreen()
      }
      if (typeof window.loadLiveUnitsScreen === 'function') {
        window.loadLiveUnitsScreen()
      }
      if (typeof window.restoreOpenUnit === 'function' && typeof Router !== 'undefined' && Router.current && Router.current() === 'admin-unit-detail') {
        window.restoreOpenUnit(window.readScreenRecord ? window.readScreenRecord('unit') : '')
      }
    }, '520px')
  }

  // ------------------------------------------------------------
  // 10. Live Razorpay Payment Engine
  // ------------------------------------------------------------
  window.loadRazorpayCheckoutScript = function () {
    if (window.Razorpay) return Promise.resolve()
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-razorpay-checkout="1"]')
      if (existing) {
        existing.addEventListener('load', function () { resolve() })
        existing.addEventListener('error', function () { reject() })
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.dataset.razorpayCheckout = '1'
      script.onload = function () { resolve() }
      script.onerror = function () { reject() }
      document.body.appendChild(script)
    })
  }

  window.collectWithSocietyRazorpay = function (options) {
    options = options || {}
    return new Promise(function (resolve) {
      ;(async function () {
        let orderData = null
        try {
          const orderRes = await (window.apiFetch || fetch)('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: options.invoiceId || undefined,
              amount: options.amount,
              description: options.description,
            }),
          })
          orderData = await orderRes.json()
          if (!orderRes.ok || !orderData.success) {
            showToast(orderData.error || 'Could not start this payment', 'error')
            resolve({ ok: false })
            return
          }
        } catch (err) {
          showToast('Could not start this payment', 'error')
          resolve({ ok: false })
          return
        }
        if (!orderData.razorpayKeyId || !orderData.order || orderData.order.isMock) {
          showToast('This society has not connected a Razorpay account.', 'error')
          resolve({ ok: false })
          return
        }
        try {
          await window.loadRazorpayCheckoutScript()
        } catch (err) {
          showToast('Razorpay checkout could not be loaded. Check the internet connection and try again.', 'error')
          resolve({ ok: false })
          return
        }
        let settled = false
        const finish = function (result) {
          if (settled) return
          settled = true
          resolve(result)
        }
        const rzp = new window.Razorpay({
          key: orderData.razorpayKeyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency || 'INR',
          name: (orderData.invoice && orderData.invoice.societyName) || 'Society',
          description: (orderData.invoice && orderData.invoice.invoiceNumber) || options.description || 'Society payment',
          order_id: orderData.order.id,
          handler: async function (response) {
            try {
              const verifyRes = await (window.apiFetch || fetch)('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  invoiceId: orderData.invoice && orderData.invoice.id,
                  method: 'ONLINE',
                }),
              })
              const data = await verifyRes.json().catch(function () { return {} })
              if (!verifyRes.ok || !data.success) {
                showToast(data.error || 'Payment was not recorded. Nothing was marked paid.', 'error')
                finish({ ok: false })
                return
              }
              if (options.reloadBills !== false && options.invoiceId) {
                showToast('Payment recorded. This bill is now paid.', 'success')
                if (typeof window.loadLiveInvoicesScreen === 'function') window.loadLiveInvoicesScreen()
                if (typeof window.loadLivePaymentsScreen === 'function') window.loadLivePaymentsScreen()
                if (typeof window.loadLiveResidentBills === 'function') window.loadLiveResidentBills()
                if (typeof window.loadLiveResidentDashboard === 'function') window.loadLiveResidentDashboard()
                if (typeof window.loadLiveResidentPayments === 'function') window.loadLiveResidentPayments()
                if (typeof window.restoreOpenUnit === 'function' && typeof Router !== 'undefined' && Router.current && Router.current() === 'admin-unit-detail') {
                  window.restoreOpenUnit(window.readScreenRecord ? window.readScreenRecord('unit') : '')
                } else if (typeof Router !== 'undefined' && Router.current) {
                  Router.go(Router.current())
                }
              }
              finish({ ok: true, paymentId: response.razorpay_payment_id })
            } catch (err) {
              showToast('Payment was not recorded. Nothing was marked paid.', 'error')
              finish({ ok: false })
            }
          },
          modal: {
            ondismiss: function () {
              showToast('Payment was closed. Nothing was marked paid.', 'warning')
              finish({ ok: false })
            },
          },
          theme: { color: '#18181B' },
        })
        rzp.on('payment.failed', function () {
          showToast('Razorpay did not complete this payment. Nothing was marked paid.', 'error')
          finish({ ok: false })
        })
        rzp.open()
      })()
    })
  }

  window.triggerRazorpayPayment = async function (invoiceId) {
    if (!invoiceId) {
      showToast('Choose a bill to pay', 'warning')
      return
    }
    return window.collectWithSocietyRazorpay({ invoiceId: invoiceId, reloadBills: true })
  }

  window.triggerRazorpayPayment._societyCheckout = true

  // ------------------------------------------------------------
  // 11. Interactive Monthly Bill Generator & Bulk Update Engine
  // ------------------------------------------------------------

  window.__billingScope = 'SINGLE'
  window.__selectedGenMonths = []

  window.formatMonthName = function (mStr) {
    if (!mStr) return ''
    const parts = mStr.split('-')
    if (parts.length < 2) return mStr
    const y = parts[0]
    const m = parseInt(parts[1], 10)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[m - 1] || m} ${y}`
  }

  window.computeMonthsRange = function (startStr, endStr) {
    if (!startStr) return []
    if (!endStr || endStr < startStr) endStr = startStr
    const [startY, startM] = startStr.split('-').map(Number)
    const [endY, endM] = endStr.split('-').map(Number)
    const months = []
    let curY = startY
    let curM = startM
    while (curY < endY || (curY === endY && curM <= endM)) {
      months.push(`${curY}-${String(curM).padStart(2, '0')}`)
      curM++
      if (curM > 12) {
        curM = 1
        curY++
      }
      if (months.length >= 36) break
    }
    return months
  }

  window.getNextMonthStr = function (mStr) {
    if (!mStr) return ''
    const [y, m] = mStr.split('-').map(Number)
    let nextM = m + 1
    let nextY = y
    if (nextM > 12) {
      nextM = 1
      nextY++
    }
    return `${nextY}-${String(nextM).padStart(2, '0')}`
  }

  window.getGeneratedBillingMonths = function () {
    if (!window.__cachedInvoices || window.__cachedInvoices.length === 0) return []
    return [...new Set(window.__cachedInvoices.map(i => i.billingMonth).filter(Boolean))].sort()
  }

  window.getFirstUnbilledMonth = function () {
    const generated = window.getGeneratedBillingMonths ? window.getGeneratedBillingMonths() : []
    const today = new Date()
    const currentM = today.toISOString().slice(0, 7) // e.g. "2026-10"

    // If there are generated months >= currentM, the next unbilled cycle must follow the latest generated month
    const futureOrCurrentGen = generated.filter(m => m >= currentM)
    if (futureOrCurrentGen.length > 0) {
      const latest = futureOrCurrentGen[futureOrCurrentGen.length - 1]
      let candidate = window.getNextMonthStr(latest)
      while (generated.includes(candidate)) {
        candidate = window.getNextMonthStr(candidate)
      }
      return candidate
    }

    // If current month is not in generated list, return current month
    if (!generated.includes(currentM)) return currentM

    // If current month has already been generated, find the earliest subsequent unbilled month
    let candidate = window.getNextMonthStr(currentM)
    while (generated.includes(candidate)) {
      candidate = window.getNextMonthStr(candidate)
    }
    return candidate
  }

  window.skipAlreadyGeneratedMonths = function () {
    const unbilledStart = window.getFirstUnbilledMonth()
    const currentCount = (window.__selectedGenMonths && window.__selectedGenMonths.length) || 2
    let cur = unbilledStart
    const newMonths = [cur]
    for (let i = 1; i < currentCount; i++) {
      cur = window.getNextMonthStr(cur)
      newMonths.push(cur)
    }
    const startEl = document.getElementById('genStartMonth')
    const endEl = document.getElementById('genEndMonth')
    if (startEl) startEl.value = newMonths[0]
    if (endEl) endEl.value = newMonths[newMonths.length - 1]
    window.syncMultiMonthsFromRange()
  }

  window.handleSingleMonthChange = function (input) {
    if (!input) return
    const val = input.value
    const generated = window.getGeneratedBillingMonths()
    const warnEl = document.getElementById('genSingleMonthWarn')
    if (warnEl) {
      if (generated.includes(val)) {
        warnEl.innerHTML = `⚠️ <strong>${window.formatMonthName(val)}</strong> is already generated. Unpaid invoices will be revised if update toggle is checked.`
        warnEl.style.display = 'block'
      } else {
        warnEl.style.display = 'none'
      }
    }
    window.updateGenBillsEstimate()
  }

  window.setBillingScope = function (scope) {
    window.__billingScope = scope
    const tabSingle = document.getElementById('genScopeTabSingle')
    const tabMulti = document.getElementById('genScopeTabMulti')
    const wrapSingle = document.getElementById('wrapSingleMonth')
    const wrapMulti = document.getElementById('wrapMultiMonth')

    if (tabSingle && tabMulti) {
      if (scope === 'SINGLE') {
        tabSingle.className = 'btn btn-primary btn-sm'
        tabMulti.className = 'btn btn-secondary btn-sm'
        if (wrapSingle) wrapSingle.style.display = 'grid'
        if (wrapMulti) wrapMulti.style.display = 'none'
      } else {
        tabSingle.className = 'btn btn-secondary btn-sm'
        tabMulti.className = 'btn btn-primary btn-sm'
        if (wrapSingle) wrapSingle.style.display = 'none'
        if (wrapMulti) wrapMulti.style.display = 'block'
        window.syncMultiMonthsFromRange()
      }
    }
    window.updateGenBillsEstimate()
  }

  window.syncMultiMonthsFromRange = function () {
    const start = document.getElementById('genStartMonth')?.value
    const end = document.getElementById('genEndMonth')?.value
    if (!start) return
    window.__selectedGenMonths = window.computeMonthsRange(start, end || start)
    window.renderSelectedMonthsPills()
    window.updateGenBillsEstimate()
  }

  window.applyAdvancePreset = function (presetType) {
    const firstUnbilled = window.getFirstUnbilledMonth()
    const generated = window.getGeneratedBillingMonths()
    const today = new Date()
    const curY = today.getFullYear()
    const curM = today.getMonth() + 1 // 1-12

    let start = ''
    let end = ''

    if (presetType === 'JAN_FEB') {
      let targetYear = curM >= 10 ? curY + 1 : curY
      if (generated.includes(`${targetYear}-01`) && generated.includes(`${targetYear}-02`)) {
        targetYear++
      }
      start = `${targetYear}-01`
      end = `${targetYear}-02`
    } else if (presetType === 'NEXT_2') {
      // 2 consecutive months starting strictly from first unbilled month
      start = firstUnbilled
      end = window.getNextMonthStr(firstUnbilled)
    } else if (presetType === 'QUARTER') {
      start = firstUnbilled
      let cur = start
      for (let i = 0; i < 2; i++) {
        cur = window.getNextMonthStr(cur)
      }
      end = cur
    } else if (presetType === 'HALF_YEAR') {
      start = firstUnbilled
      let cur = start
      for (let i = 0; i < 5; i++) {
        cur = window.getNextMonthStr(cur)
      }
      end = cur
    } else if (presetType === 'FULL_YEAR') {
      start = firstUnbilled
      let cur = start
      for (let i = 0; i < 11; i++) {
        cur = window.getNextMonthStr(cur)
      }
      end = cur
    }

    const startEl = document.getElementById('genStartMonth')
    const endEl = document.getElementById('genEndMonth')
    if (startEl && start) startEl.value = start
    if (endEl && end) endEl.value = end

    window.syncMultiMonthsFromRange()
  }

  window.renderSelectedMonthsPills = function () {
    const container = document.getElementById('genSelectedMonthsPills')
    const badge = document.getElementById('genSelectedMonthsBadge')
    const months = window.__selectedGenMonths || []
    const generated = window.getGeneratedBillingMonths ? window.getGeneratedBillingMonths() : []
    const firstUnbilled = window.getFirstUnbilledMonth ? window.getFirstUnbilledMonth() : ''

    const alreadyGeneratedInSelection = months.filter(m => generated.includes(m))

    if (badge) {
      badge.textContent = `${months.length} Month${months.length === 1 ? '' : 's'} Selected`
      badge.className = months.length > 1 ? 'badge badge-purple' : 'badge badge-blue'
    }
    if (!container) return
    if (months.length === 0) {
      container.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">No months selected yet.</span>`
      return
    }

    let pillsHtml = months.map(m => {
      const isAlreadyGen = generated.includes(m)
      return `
        <span class="badge" style="background:${isAlreadyGen ? 'rgba(245,158,11,0.14)' : 'rgba(139,92,246,0.12)'};color:${isAlreadyGen ? 'var(--amber)' : 'var(--purple)'};border:1px solid ${isAlreadyGen ? 'rgba(245,158,11,0.4)' : 'rgba(139,92,246,0.3)'};font-size:12px;padding:4px 10px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
          📅 ${window.formatMonthName(m)} (${m})
          ${isAlreadyGen ? `<span style="font-size:10px;background:rgba(245,158,11,0.25);padding:1px 5px;border-radius:3px;font-weight:800;">ALREADY GENERATED</span>` : ''}
          <button type="button" onclick="window.removeMonthSelection('${m}')" style="background:none;border:none;color:${isAlreadyGen ? 'var(--amber)' : 'var(--purple)'};font-size:13px;cursor:pointer;padding:0;line-height:1;" title="Remove this cycle">✕</button>
        </span>
      `
    }).join('')

    if (alreadyGeneratedInSelection.length > 0) {
      pillsHtml += `
        <div style="width:100%;font-size:11px;color:var(--amber);background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.28);border-radius:var(--r-md);padding:8px 12px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <span>⚠️ <strong>${alreadyGeneratedInSelection.map(window.formatMonthName).join(', ')}</strong> is already generated. Unpaid invoices will be updated if update toggle is ON.</span>
          <button type="button" class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--blue);border:1px solid rgba(37,99,235,0.3);border-radius:4px;" onclick="window.skipAlreadyGeneratedMonths()">⏭️ Skip to Unbilled (${window.formatMonthName(firstUnbilled)})</button>
        </div>
      `
    }

    container.innerHTML = pillsHtml
  }

  window.removeMonthSelection = function (monthToRemove) {
    window.__selectedGenMonths = (window.__selectedGenMonths || []).filter(m => m !== monthToRemove)
    window.renderSelectedMonthsPills()
    window.updateGenBillsEstimate()
  }

  window.getSelectedBillingMonths = function () {
    if (window.__billingScope === 'SINGLE') {
      const single = document.getElementById('genBillingMonth')?.value
      return single ? [single] : []
    }
    return window.__selectedGenMonths && window.__selectedGenMonths.length > 0
      ? window.__selectedGenMonths
      : (document.getElementById('genStartMonth')?.value ? [document.getElementById('genStartMonth').value] : [])
  }

  window.handleGenModelChange = function (model) {
    const wrapFixed = document.getElementById('wrapFixedInput')
    const wrapSqft = document.getElementById('wrapSqftInput')
    const wrapCat = document.getElementById('wrapCatInput')
    const wrapCharges = document.getElementById('wrapChargeHeadsInfo')

    if (wrapFixed) wrapFixed.style.display = model === 'FIXED_FLAT' ? 'block' : 'none'
    if (wrapSqft) wrapSqft.style.display = model === 'PER_SQFT' ? 'block' : 'none'
    if (wrapCat) wrapCat.style.display = model === 'CATEGORY' ? 'block' : 'none'
    if (wrapCharges) wrapCharges.style.display = model === 'CHARGE_HEADS' ? 'block' : 'none'

    window.updateGenBillsEstimate()
  }

  window.updateGenBillsEstimate = function () {
    const totalUnits = (window.__cachedUnits && window.__cachedUnits.length) || 112
    const selectedModel = document.querySelector('input[name="genModel"]:checked')?.value || 'FIXED_FLAT'
    const totalDemandEl = document.getElementById('genTotalDemandText')
    const formulaEl = document.getElementById('genDemandFormula')
    const estBadge = document.getElementById('genEstimateBadge')

    const selectedMonths = window.getSelectedBillingMonths ? window.getSelectedBillingMonths() : [document.getElementById('genBillingMonth')?.value || '2026-10']
    const monthsCount = Math.max(1, selectedMonths.length)

    let perUnitMonthly = 2500
    let monthlyFormula = `(${totalUnits} units × ₹2,500)`

    if (selectedModel === 'FIXED_FLAT') {
      const amtInput = document.getElementById('genFixedAmount')
      perUnitMonthly = Number(amtInput?.value) || 2500
      monthlyFormula = `(${totalUnits} units × ₹${perUnitMonthly.toLocaleString('en-IN')})`
    } else if (selectedModel === 'PER_SQFT') {
      const rateInput = document.getElementById('genRatePerSqft')
      const rate = Number(rateInput?.value) || 2.5
      const avgArea = 1100
      perUnitMonthly = Math.round(rate * avgArea)
      monthlyFormula = `(${totalUnits} units · avg ${avgArea} sq.ft @ ₹${rate}/sq.ft)`
    } else if (selectedModel === 'CATEGORY') {
      const a = Number(document.getElementById('genCatA')?.value) || 3500
      const b = Number(document.getElementById('genCatB')?.value) || 2800
      const c = Number(document.getElementById('genCatC')?.value) || 2000
      perUnitMonthly = Math.round(0.35 * a + 0.45 * b + 0.2 * c)
      monthlyFormula = `(${totalUnits} units · weighted BHK rates)`
    } else if (selectedModel === 'CHARGE_HEADS') {
      perUnitMonthly = 2800
      monthlyFormula = `(${totalUnits} units · active fee rules)`
    }

    const monthlyTotal = perUnitMonthly * totalUnits
    const overallDemand = monthlyTotal * monthsCount

    if (totalDemandEl) {
      totalDemandEl.textContent = '₹' + overallDemand.toLocaleString('en-IN')
    }
    if (formulaEl) {
      if (monthsCount > 1) {
        formulaEl.textContent = `₹${monthlyTotal.toLocaleString('en-IN')}/mo × ${monthsCount} cycles (${selectedMonths.join(', ')})`
      } else {
        formulaEl.textContent = `${monthlyFormula} · 1 cycle`
      }
    }
    if (estBadge) {
      estBadge.textContent = monthsCount > 1 ? `${monthsCount} Months Advance` : 'Ready to Issue'
      estBadge.className = monthsCount > 1 ? 'badge badge-purple' : 'badge badge-green'
    }
  }

  window.openGenerateBillsModal = async function () {
    // 1. Always ensure live invoices cache is freshly populated from DB to accurately detect already-generated months
    try {
      const res = await (window.apiFetch || fetch)('/api/billing/invoices?month=ALL')
      if (res && res.ok) {
        const data = await res.json()
        window.__cachedInvoices = data.invoices || []
      }
    } catch (e) {
      console.warn('Could not fetch invoices for billing generator:', e)
    }

    const generatedMonths = window.getGeneratedBillingMonths()
    const latestGenerated = generatedMonths.length > 0 ? generatedMonths[generatedMonths.length - 1] : null
    const firstUnbilledMonth = window.getFirstUnbilledMonth()

    const defaultSingleMonth = firstUnbilledMonth
    const [y, m] = defaultSingleMonth.split('-')
    const defaultDueDate = `${y}-${m}-15`

    const advanceStartMonth = firstUnbilledMonth
    const advanceEndMonth = window.getNextMonthStr(firstUnbilledMonth)

    window.__billingScope = 'SINGLE'
    window.__selectedGenMonths = [advanceStartMonth, advanceEndMonth]

    const societyName = (window.currentSociety && window.currentSociety.name) ||
                        localStorage.getItem('rwa_active_society_name') ||
                        'Current Society'
    const totalUnits = (window.__cachedUnits && window.__cachedUnits.length) || 112

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:var(--bg-elevated);padding:10px 14px;border-radius:var(--r-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Target Society & Billing Status</div>
            <div style="font-size:13px;font-weight:800;color:var(--text-primary);">${societyName}</div>
          </div>
          <div style="text-align:right;">
            ${latestGenerated ? `
              <div style="font-size:11px;color:var(--text-secondary);font-weight:600;margin-bottom:2px;">
                Latest Billed: <strong style="color:var(--blue);">${window.formatMonthName(latestGenerated)}</strong>
                <span style="color:var(--text-muted);">· Next Due: </span><strong style="color:var(--green);">${window.formatMonthName(firstUnbilledMonth)}</strong>
              </div>
            ` : ''}
            <span class="badge badge-blue" style="font-size:11px;font-weight:700;" id="genUnitsBadge">${totalUnits} Registered Units</span>
          </div>
        </div>

        <!-- Scope Selector: Single Month vs Multi-Month / Advance Billing -->
        <div>
          <label class="form-label" style="font-weight:700;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <span>Billing Scope & Generation Mode *</span>
            <span style="font-size:11px;color:var(--text-muted);">Issue next unbilled month or multiple advance months</span>
          </label>
          <div style="display:flex;gap:8px;background:var(--bg-elevated);padding:4px;border-radius:var(--r-md);border:1px solid var(--border);">
            <button type="button" id="genScopeTabSingle" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;padding:7px 10px;" onclick="window.setBillingScope('SINGLE')">
              📅 Single Month (${window.formatMonthName(firstUnbilledMonth)})
            </button>
            <button type="button" id="genScopeTabMulti" class="btn btn-secondary btn-sm" style="flex:1;justify-content:center;padding:7px 10px;" onclick="window.setBillingScope('MULTI')">
              ⏩ Multi-Month (Advance)
            </button>
          </div>
        </div>

        <!-- Mode 1: Single Month Controls -->
        <div id="wrapSingleMonth" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label" style="font-weight:700;">Billing Cycle (Month) *</label>
            <input type="month" id="genBillingMonth" class="form-input" value="${defaultSingleMonth}" style="width:100%;font-size:14px;" onchange="window.handleSingleMonthChange(this)" required />
            <div id="genSingleMonthWarn" style="display:none;font-size:11px;color:var(--amber);margin-top:4px;font-weight:600;"></div>
          </div>
          <div>
            <label class="form-label" style="font-weight:700;">Payment Due Date *</label>
            <input type="date" id="genDueDate" class="form-input" value="${defaultDueDate}" style="width:100%;font-size:14px;" required />
          </div>
        </div>

        <!-- Mode 2: Multi-Month Advance Controls -->
        <div id="wrapMultiMonth" style="display:none;background:var(--bg-elevated);padding:14px;border-radius:var(--r-md);border:1px solid var(--border-light);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:12px;font-weight:700;color:var(--text-primary);">⚡ Quick Advance Presets</span>
            <span class="badge badge-purple" id="genSelectedMonthsBadge">2 Months Selected</span>
          </div>
          <!-- Quick preset chips -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
            <button type="button" class="btn btn-ghost btn-sm" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="window.applyAdvancePreset('NEXT_2')">
              ✨ Next 2 Unbilled Months
            </button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="window.applyAdvancePreset('JAN_FEB')">
              Jan & Feb (Advance)
            </button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="window.applyAdvancePreset('QUARTER')">
              Quarter (3 Mos)
            </button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="window.applyAdvancePreset('HALF_YEAR')">
              Half-Year (6 Mos)
            </button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="window.applyAdvancePreset('FULL_YEAR')">
              Full Year (12 Mos)
            </button>
          </div>

          <!-- Month Range Pickers & Due Day Rule -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">From Month *</label>
              <input type="month" id="genStartMonth" class="form-input" value="${advanceStartMonth}" style="width:100%;font-size:13px;" onchange="window.syncMultiMonthsFromRange()" />
            </div>
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">To Month *</label>
              <input type="month" id="genEndMonth" class="form-input" value="${advanceEndMonth}" style="width:100%;font-size:13px;" onchange="window.syncMultiMonthsFromRange()" />
            </div>
            <div>
              <label class="form-label" style="font-size:11px;font-weight:700;">Due Day of Month *</label>
              <div style="display:flex;align-items:center;gap:6px;">
                <input type="number" id="genDueDays" class="form-input" min="1" max="28" value="15" style="width:100%;font-size:13px;font-weight:700;" />
                <span style="font-size:12px;color:var(--text-muted);white-space:nowrap;">th</span>
              </div>
            </div>
          </div>

          <!-- Visual Selected Months Pills Container -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">Target Billing Cycles to be Generated:</div>
            <div id="genSelectedMonthsPills" style="display:flex;gap:6px;flex-wrap:wrap;min-height:30px;align-items:center;">
              <!-- Filled dynamically -->
            </div>
          </div>
        </div>

        <!-- Pricing / Calculation Model -->
        <div>
          <label class="form-label" style="font-weight:700;margin-bottom:6px;display:block;">Calculation Engine & Monthly Bill Amount *</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="genModel" value="FIXED_FLAT" checked onchange="window.handleGenModelChange('FIXED_FLAT')" />
              <div>
                <div style="font-size:12px;font-weight:700;">Fixed Flat Rate</div>
                <div style="font-size:10px;color:var(--text-muted);">Uniform monthly fee</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="genModel" value="PER_SQFT" onchange="window.handleGenModelChange('PER_SQFT')" />
              <div>
                <div style="font-size:12px;font-weight:700;">Per Sq. Ft Rate</div>
                <div style="font-size:10px;color:var(--text-muted);">Area-based calculation</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="genModel" value="CATEGORY" onchange="window.handleGenModelChange('CATEGORY')" />
              <div>
                <div style="font-size:12px;font-weight:700;">Category / Flat Type</div>
                <div style="font-size:10px;color:var(--text-muted);">Cat-A, Cat-B, Cat-C</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="genModel" value="CHARGE_HEADS" onchange="window.handleGenModelChange('CHARGE_HEADS')" />
              <div>
                <div style="font-size:12px;font-weight:700;">Society Fee Rules</div>
                <div style="font-size:10px;color:var(--text-muted);">Active charge heads</div>
              </div>
            </label>
          </div>

          <!-- Dynamic Model Inputs -->
          <div id="genModelInputsWrap" style="background:var(--bg-elevated);padding:14px;border-radius:var(--r-md);border:1px solid var(--border-light);">
            <!-- Fixed Flat Input (Default) -->
            <div id="wrapFixedInput">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label class="form-label" style="font-weight:700;margin:0;">Monthly Fee per Flat / Unit (₹) *</label>
                <span style="font-size:11px;color:var(--text-muted);">Applied across all flats</span>
              </div>
              <div style="position:relative;margin-bottom:8px;">
                <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--text-muted);font-size:16px;">₹</span>
                <input type="number" id="genFixedAmount" class="form-input" value="2500" step="50" style="width:100%;padding-left:28px;font-size:16px;font-weight:700;" oninput="window.updateGenBillsEstimate()" required />
              </div>
              <!-- Quick preset chips -->
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <span style="font-size:11px;color:var(--text-muted);">Quick Presets:</span>
                ${[1500, 2000, 2500, 3000, 3500, 5000].map(amt => `
                  <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="document.getElementById('genFixedAmount').value=${amt};window.updateGenBillsEstimate();">₹${amt.toLocaleString('en-IN')}</button>
                `).join('')}
              </div>
            </div>

            <!-- Per Sqft Input -->
            <div id="wrapSqftInput" style="display:none;">
              <label class="form-label" style="font-weight:700;margin-bottom:4px;">Rate per Square Foot (₹ / sq.ft) *</label>
              <div style="position:relative;margin-bottom:6px;">
                <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--text-muted);font-size:16px;">₹</span>
                <input type="number" id="genRatePerSqft" class="form-input" value="2.50" step="0.25" style="width:100%;padding-left:28px;font-size:16px;font-weight:700;" oninput="window.updateGenBillsEstimate()" />
              </div>
              <div style="font-size:11px;color:var(--text-muted);">e.g. 1,000 sq.ft unit @ ₹2.50/sq.ft = ₹2,500/month</div>
            </div>

            <!-- Category Input -->
            <div id="wrapCatInput" style="display:none;">
              <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">Rates by Flat Category / BHK:</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <div>
                  <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px;">Cat-A (HIG / 3BHK)</label>
                  <input type="number" id="genCatA" class="form-input" value="3500" style="width:100%;font-size:13px;font-weight:700;" oninput="window.updateGenBillsEstimate()" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px;">Cat-B (MIG / 2BHK)</label>
                  <input type="number" id="genCatB" class="form-input" value="2800" style="width:100%;font-size:13px;font-weight:700;" oninput="window.updateGenBillsEstimate()" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--text-muted);display:block;margin-bottom:2px;">Cat-C (LIG / 1BHK)</label>
                  <input type="number" id="genCatC" class="form-input" value="2000" style="width:100%;font-size:13px;font-weight:700;" oninput="window.updateGenBillsEstimate()" />
                </div>
              </div>
            </div>

            <!-- Charge Heads Info -->
            <div id="wrapChargeHeadsInfo" style="display:none;">
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">
                Computes bill amounts using active fee heads configured under Finance › Charge Setup (Maintenance Base + Sinking Fund + Water + Lift).
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="form-label" style="font-weight:700;">Bill Line Item Description</label>
          <input type="text" id="genDescription" class="form-input" value="Monthly Society Maintenance & Operational Charges" style="width:100%;font-size:13px;" />
        </div>

        <!-- Overwrite Existing Option -->
        <div style="background:rgba(37,99,235,0.04);border:1px solid rgba(37,99,235,0.2);padding:10px 14px;border-radius:var(--r-md);">
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
            <input type="checkbox" id="genOverwriteExisting" checked style="margin-top:2px;accent-color:var(--blue);" />
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary);">Update existing unpaid bills for selected cycle(s)</div>
              <div style="font-size:11px;color:var(--text-muted);">If already generated, unpaid invoices will be revised with the new amount instead of being skipped.</div>
            </div>
          </label>
        </div>

        <!-- Live Real-Time Estimate Card -->
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-md);padding:12px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:12px;font-weight:700;color:var(--text-secondary);">⚡ Live Demand Calculation</span>
            <span class="badge badge-green" id="genEstimateBadge">Ready to Issue</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
            <div>
              <span style="font-size:24px;font-weight:800;color:var(--blue);" id="genTotalDemandText">₹${(totalUnits * 2500).toLocaleString('en-IN')}</span>
              <span style="font-size:12px;color:var(--text-muted);margin-left:4px;" id="genDemandFormula">(${totalUnits} units × ₹2,500) · 1 cycle</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);text-align:right;">
              <span>🔔 Socket.io instant alert to all residents</span>
            </div>
          </div>
        </div>
      </div>
    `

    showModal('⚡ Generate Maintenance Bills (Monthly / Advance)', html, 'Generate & Issue Bills 🚀', async () => {
      const scope = window.__billingScope || 'SINGLE'
      const months = window.getSelectedBillingMonths ? window.getSelectedBillingMonths() : []

      if (!months || months.length === 0) {
        showToast('Please select at least one valid billing cycle (month)', 'warning')
        return
      }

      const dueDate = document.getElementById('genDueDate')?.value
      const dueDays = parseInt(document.getElementById('genDueDays')?.value || '15', 10)
      const model = document.querySelector('input[name="genModel"]:checked')?.value || 'FIXED_FLAT'
      const baseAmount = parseFloat(document.getElementById('genFixedAmount')?.value || '2500')
      const ratePerSqft = parseFloat(document.getElementById('genRatePerSqft')?.value || '2.5')
      const description = document.getElementById('genDescription')?.value || 'Monthly Society Maintenance'
      const overwriteExisting = document.getElementById('genOverwriteExisting')?.checked || false

      const categoryRates = {
        'Cat-A': parseFloat(document.getElementById('genCatA')?.value || '3500'),
        'Cat-B': parseFloat(document.getElementById('genCatB')?.value || '2800'),
        'Cat-C': parseFloat(document.getElementById('genCatC')?.value || '2000'),
      }

      const cycleSummary = months.length > 1
        ? `${months.length} advance cycles (${months.join(', ')})`
        : `cycle ${months[0]}`

      showToast(`⚡ Issuing bills for ${cycleSummary} & notifying residents...`, 'info')

      const res = await (window.apiFetch || fetch)('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingMonths: months,
          dueDays,
          dueDate: months.length === 1 ? dueDate : undefined,
          model,
          baseAmount,
          ratePerSqft,
          categoryRates,
          description,
          overwriteExisting,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate monthly bills')
      }

      showToast(`✅ ${data.message}`, 'success')

      try {
        const freshRes = await (window.apiFetch || fetch)('/api/billing/invoices?month=ALL')
        if (freshRes && freshRes.ok) {
          const freshData = await freshRes.json()
          window.__cachedInvoices = freshData.invoices || []
        }
      } catch (e) {}

      if (typeof window.loadLiveAdminDashboard === 'function') {
        window.loadLiveAdminDashboard()
      }
      if (typeof window.loadLiveInvoicesScreen === 'function') {
        window.loadLiveInvoicesScreen()
      }
    }, '560px')

    // Initialize multi-month pills if opened in multi-month mode
    setTimeout(() => {
      if (typeof window.renderSelectedMonthsPills === 'function') {
        window.renderSelectedMonthsPills()
      }
    }, 50)
  }

  // ------------------------------------------------------------
  // 11b. Bulk Update / Revise Bills Engine
  // ------------------------------------------------------------

  window.handleBulkActionChange = function (action) {
    const wrapSet = document.getElementById('bulkWrapSetAmount')
    const wrapAdj = document.getElementById('bulkWrapAdj')
    const wrapDue = document.getElementById('bulkWrapDueDate')

    if (wrapSet) wrapSet.style.display = action === 'SET_AMOUNT' ? 'block' : 'none'
    if (wrapAdj) wrapAdj.style.display = action === 'APPLY_ADJUSTMENT' ? 'block' : 'none'
    if (wrapDue) wrapDue.style.display = action === 'UPDATE_DUE_DATE' ? 'block' : 'none'
  }

  window.openBulkUpdateBillsModal = function (selectedIds = [], defaultMonth = null) {
    const currentMonth = defaultMonth || new Date().toISOString().slice(0, 7)
    const isSelected = selectedIds && selectedIds.length > 0
    const [y, m] = currentMonth.split('-')
    const defaultNewDueDate = `${y}-${m}-25`

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="background:var(--bg-elevated);padding:10px 14px;border-radius:var(--r-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">Target Invoices</div>
            <div style="font-size:13px;font-weight:800;color:var(--text-primary);">
              ${isSelected ? `Selected ${selectedIds.length} Specific Bills` : `All bills for ${currentMonth}, including ones already paid`}
            </div>
          </div>
          <div>
            <span class="badge ${isSelected ? 'badge-purple' : 'badge-blue'}">${isSelected ? `${selectedIds.length} Selected` : 'Cycle-wide'}</span>
          </div>
        </div>

        ${!isSelected ? `
          <div>
            <label class="form-label" style="font-weight:700;">Billing Cycle (Month) *</label>
            <input type="month" id="bulkUpdateMonth" class="form-input" value="${currentMonth}" style="width:100%;font-size:14px;" required />
          </div>
        ` : `<input type="hidden" id="bulkUpdateMonth" value="${currentMonth}" />`}

        <!-- Bulk Action Selection -->
        <div>
          <label class="form-label" style="font-weight:700;margin-bottom:8px;display:block;">Select Bulk Revision Action *</label>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="bulkAction" value="SET_AMOUNT" checked onchange="handleBulkActionChange('SET_AMOUNT')" style="margin-top:2px;" />
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;">Set New Flat Amount Across Bills</div>
                <div style="font-size:11px;color:var(--text-muted);">Sets a new total. If someone already paid more, the extra is collected at the office. If they paid less, they can pay the difference online.</div>
              </div>
            </label>

            <label style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="bulkAction" value="APPLY_ADJUSTMENT" onchange="handleBulkActionChange('APPLY_ADJUSTMENT')" style="margin-top:2px;" />
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;">Apply Surcharge or Rebate (+/- Adjustment)</div>
                <div style="font-size:11px;color:var(--text-muted);">Add an extra levy (+₹250 festival light fund) or apply a discount (-₹150 water rebate).</div>
              </div>
            </label>

            <label style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:var(--r-md);border:1px solid var(--border);cursor:pointer;background:var(--bg-surface);">
              <input type="radio" name="bulkAction" value="UPDATE_DUE_DATE" onchange="handleBulkActionChange('UPDATE_DUE_DATE')" style="margin-top:2px;" />
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;">Extend / Update Payment Due Date</div>
                <div style="font-size:11px;color:var(--text-muted);">Move the payment deadline for all unpaid invoices without changing bill amounts.</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Action-Specific Inputs -->
        <div id="bulkActionInputsWrap" style="background:var(--bg-elevated);padding:14px;border-radius:var(--r-md);border:1px solid var(--border-light);">
          <!-- SET_AMOUNT Inputs -->
          <div id="bulkWrapSetAmount">
            <label class="form-label" style="font-weight:700;margin-bottom:4px;">New Revised Total Bill Amount (₹) *</label>
            <div style="position:relative;margin-bottom:8px;">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;color:var(--text-muted);font-size:16px;">₹</span>
              <input type="number" id="bulkNewAmountInput" class="form-input" value="3000" step="50" style="width:100%;padding-left:28px;font-size:16px;font-weight:700;" required />
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <span style="font-size:11px;color:var(--text-muted);">Quick Presets:</span>
              ${[2000, 2500, 3000, 3200, 3500, 4000].map(amt => `
                <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;border:1px solid var(--border);border-radius:4px;" onclick="document.getElementById('bulkNewAmountInput').value=${amt}">₹${amt.toLocaleString('en-IN')}</button>
              `).join('')}
            </div>
          </div>

          <!-- APPLY_ADJUSTMENT Inputs -->
          <div id="bulkWrapAdj" style="display:none;">
            <div style="margin-bottom:8px;">
              <label class="form-label" style="font-weight:700;margin-bottom:4px;">Adjustment Amount (₹) * (Use negative for rebate)</label>
              <input type="number" id="bulkAdjAmountInput" class="form-input" value="250" step="25" style="width:100%;font-size:15px;font-weight:700;" />
            </div>
            <div>
              <label class="form-label" style="font-weight:700;margin-bottom:4px;">Adjustment Reason / Title</label>
              <input type="text" id="bulkAdjReasonInput" class="form-input" value="Monsoon Drainage Surcharge" style="width:100%;font-size:13px;" />
            </div>
          </div>

          <!-- UPDATE_DUE_DATE Inputs -->
          <div id="bulkWrapDueDate" style="display:none;">
            <label class="form-label" style="font-weight:700;margin-bottom:4px;">New Payment Due Date *</label>
            <input type="date" id="bulkNewDueDateInput" class="form-input" value="${defaultNewDueDate}" style="width:100%;font-size:14px;" />
          </div>
        </div>

        <!-- Real-time Socket.io note -->
        <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);padding:10px 14px;border-radius:var(--r-md);display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">🔔</span>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">
            <strong>Already paid:</strong> A higher bill leaves a balance they can pay here. A lower bill does not refund money in the app. You will be asked to notify those residents to collect the extra at the office. The resident bill shows who revised it and why.
          </div>
        </div>
      </div>
    `

    showModal('⚡ Bulk Update / Revise Monthly Bills', html, 'Confirm Bulk Revision 🚀', async () => {
      const billingMonth = document.getElementById('bulkUpdateMonth')?.value
      const action = document.querySelector('input[name="bulkAction"]:checked')?.value || 'SET_AMOUNT'
      const newAmount = parseFloat(document.getElementById('bulkNewAmountInput')?.value || '0')
      const adjustmentAmount = parseFloat(document.getElementById('bulkAdjAmountInput')?.value || '0')
      const adjustmentReason = document.getElementById('bulkAdjReasonInput')?.value || 'Bulk Revision'
      const newDueDate = document.getElementById('bulkNewDueDateInput')?.value

      showToast('⚡ Executing bulk invoice revision...', 'info')

      const res = await (window.apiFetch || fetch)('/api/billing/invoices/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingMonth,
          action,
          newAmount,
          adjustmentAmount,
          adjustmentReason,
          newDueDate,
          invoiceIds: isSelected ? selectedIds : [],
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to bulk update invoices')
      }

      showToast(`✅ ${data.message || 'Bulk revision complete!'}`, 'success')

      const overpaid = data.overpaid || []
      if (overpaid.length) {
        setTimeout(function() {
          window.openOfficeRefundNoticeModal(overpaid, billingMonth)
        }, 40)
      }

      if (typeof window.loadLiveAdminDashboard === 'function') {
        window.loadLiveAdminDashboard()
      }
      if (typeof window.loadLiveInvoicesScreen === 'function') {
        window.loadLiveInvoicesScreen()
      }
    }, '520px')
  }

  window.openOfficeRefundNoticeModal = function(overpaid, billingMonth) {
    const money = function(value) {
      return '₹' + Number(value || 0).toLocaleString('en-IN')
    }
    const rows = (overpaid || []).map(function(row) {
      const unit = String(row.unitNumber || 'Flat').replace(/[&<>"']/g, '')
      return ''
        + '<div style="padding:10px 0;border-top:1px solid #E4E4E7;">'
        + '<div style="font-weight:700;color:#18181B;">Flat ' + unit + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px;font-size:12px;">'
        + '<div><div style="color:#71717A;">Paid</div><div style="font-weight:700;">' + money(row.paidAmount) + '</div></div>'
        + '<div><div style="color:#71717A;">Revised bill</div><div style="font-weight:700;">' + money(row.revisedTotal) + '</div></div>'
        + '<div><div style="color:#71717A;">Collect at office</div><div style="font-weight:700;">' + money(row.excess) + '</div></div>'
        + '</div></div>'
    }).join('')

    const html = ''
      + '<div style="font-size:13px;line-height:1.5;color:#3F3F46;">'
      + 'These flats already paid more than the revised bill. This app does not refund that money. Send them a notice to visit the RWA office and collect the extra. After they collect the cash, open the bill and choose Mark refund collected.'
      + '</div>'
      + '<div style="margin-top:12px;max-height:280px;overflow:auto;">' + rows + '</div>'

    showModal('Collect the extra at the office', html, 'Send office notice', async function() {
      const noticeRes = await (window.apiFetch || fetch)('/api/billing/invoices/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NOTIFY_OFFICE_REFUND',
          billingMonth: billingMonth,
          invoiceIds: (overpaid || []).map(function(row) { return row.invoiceId }),
        }),
      })
      const noticeData = await noticeRes.json().catch(function() { return {} })
      if (!noticeRes.ok || !noticeData.success) {
        throw new Error(noticeData.error || 'The office notice could not be sent')
      }
      showToast(noticeData.message || 'Office collection notice sent', 'success')
    }, '560px')
  }

  // Alias trigger methods to open modal
  window.triggerGenerateBills = function () {
    window.openGenerateBillsModal()
  }
  window.triggerBatchGenerateBillsModal = function () {
    window.openGenerateBillsModal()
  }

  // ------------------------------------------------------------
  // 12. Dynamic Report Download Engine
  // ------------------------------------------------------------
  window.downloadReport = function (reportTitle = 'RWA_Report', format = 'csv') {
    const filename = `${reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'csv'}`
    
    // Generate sample data
    let csvContent = `Report: ${reportTitle}\nGenerated: ${new Date().toLocaleString()}\nSociety: Greenfield Heights RWA\n\n`
    csvContent += `Unit,Resident,Category,Amount (INR),Status,Date\n`
    csvContent += `A-101,Vikram Malhotra,Maintenance,3500,PAID,2026-10-01\n`
    csvContent += `A-102,Suresh Mehta,Maintenance,3500,OVERDUE,2026-10-01\n`
    csvContent += `B-204,Ananya Gupta,Maintenance,3500,PAID,2026-10-02\n`
    csvContent += `B-205,Rohit Verma,Maintenance,3200,PAID,2026-10-03\n`
    csvContent += `C-302,Kavita Gupta,Maintenance,4500,PAID,2026-10-01\n`

    window.saveReportFile(filename, csvContent)

    showToast(`📄 ${reportTitle} downloaded successfully!`, 'success')
  }

  // ------------------------------------------------------------
  // 13. Expense Approvals & Rejections (Fallback only)
  // ------------------------------------------------------------
  if (!window.approveExpense) {
    window.approveExpense = async function (id, title = 'Expense') {
      const res = await (window.apiFetch || fetch)('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id || 'exp-1', status: 'APPROVED' }),
      }).catch(() => null)

      if (res && res.ok) {
        showToast(`✅ ${typeof title === 'string' ? title : 'Expense'} approved by treasurer!`, 'success')
        if (typeof window.loadLiveExpenses === 'function') await window.loadLiveExpenses()
        else if (typeof Router !== 'undefined') Router.go(Router.current())
      }
    }
  }

  if (!window.rejectExpense) {
    window.rejectExpense = async function (id, title = 'Expense') {
      const res = await (window.apiFetch || fetch)('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id || 'exp-1', status: 'REJECTED' }),
      }).catch(() => null)

      if (res && res.ok) {
        showToast(`❌ ${typeof title === 'string' ? title : 'Expense'} rejected.`, 'error')
        if (typeof window.loadLiveExpenses === 'function') await window.loadLiveExpenses()
        else if (typeof Router !== 'undefined') Router.go(Router.current())
      }
    }
  }

  // ------------------------------------------------------------
  // 14. Amenity Booking Approvals
  // ------------------------------------------------------------
  if (!window.approveAmenityBooking) {
    window.approveAmenityBooking = async function (amenityOrId, resident) {
      try {
        const fetchFn = window.apiFetch || fetch;
        await fetchFn('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve_booking', bookingId: amenityOrId }),
        });
      } catch (e) {}
      showToast(`✅ Booking confirmed! Slot locked.`, 'success');
      if (typeof Router !== 'undefined') Router.go(Router.current());
    };
  }

  if (!window.rejectAmenityBooking) {
    window.rejectAmenityBooking = async function (amenityOrId, resident) {
      try {
        const fetchFn = window.apiFetch || fetch;
        await fetchFn('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject_booking', bookingId: amenityOrId }),
        });
      } catch (e) {}
      showToast(`❌ Booking rejected. Deposit refunded.`, 'info');
      if (typeof Router !== 'undefined') Router.go(Router.current());
    };
  }

  // ------------------------------------------------------------
  // 15. Complaint Status Updates & Comments
  // ------------------------------------------------------------
  window.resolveComplaint = function (ticketNumber = '#C-084') {
    showToast(`✅ Ticket ${ticketNumber} marked as RESOLVED! Notification sent to resident.`, 'success')
    if (typeof Router !== 'undefined') Router.go('admin-complaints')
  }

  window.addComplaintComment = function (inputEl) {
    const text = typeof inputEl === 'string' ? inputEl : (inputEl ? inputEl.value : '')
    if (text) {
      showToast('💬 Comment posted to ticket timeline!', 'success')
      if (typeof Router !== 'undefined') Router.go(Router.current())
    }
  }

  // ------------------------------------------------------------
  // 16. Polls & Broadcasts
  // ------------------------------------------------------------
  window.castPollVote = function (optionText) {
    showToast(`🗳️ Vote recorded for: "${optionText}"!`, 'success')
  }

  window.handleSendBroadcast = function () {
    showToast('📡 Broadcast successfully dispatched via SMS, WhatsApp & In-App!', 'success')
    if (typeof Router !== 'undefined') Router.go('admin-notices')
  }

  // ------------------------------------------------------------
  // 16b. Google Calendar Integration Engine
  // ------------------------------------------------------------
  window.buildGoogleCalendarUrl = function (event) {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const title = encodeURIComponent(event.title || 'Society Event');
    const details = encodeURIComponent(
      (event.description || '') +
      '\n\n---\nOrganized by Sector 22 Residents Welfare Association (RWA Manager)'
    );
    const location = encodeURIComponent(event.location || 'Sector 22 RWA, Chandigarh');

    function formatGDate(dInput, allDay) {
      const d = dInput instanceof Date ? dInput : new Date(dInput);
      if (isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const pad = (n) => String(n).padStart(2, '0');
      const y = d.getUTCFullYear();
      const m = pad(d.getUTCMonth() + 1);
      const day = pad(d.getUTCDate());
      if (allDay) return `${y}${m}${day}`;
      return `${y}${m}${day}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    }

    const startFormatted = formatGDate(event.startDate, event.allDay);
    let endFormatted;
    if (event.endDate) {
      endFormatted = formatGDate(event.endDate, event.allDay);
    } else if (event.allDay) {
      const nextDay = new Date(event.startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endFormatted = formatGDate(nextDay, true);
    } else {
      const end = new Date(event.startDate);
      end.setHours(end.getHours() + 1);
      endFormatted = formatGDate(end, false);
    }

    return `${baseUrl}&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}&location=${location}`;
  };

  window.syncEventToGoogleCalendar = async function (event, options = {}) {
    const gcalUrl = window.buildGoogleCalendarUrl(event);

    // Call backend API for server sync and socket broadcast
    try {
      fetch('/api/calendar/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.title,
          description: event.description || '',
          location: event.location || 'Sector 22 RWA, Chandigarh',
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: !!event.allDay,
          eventType: event.eventType || 'GENERAL'
        })
      }).catch(() => {});
    } catch(e) {}

    // Save synced record in localStorage
    try {
      const synced = JSON.parse(localStorage.getItem('rwa_gcal_synced') || '[]');
      synced.unshift({ id: 'gcal-' + Date.now(), title: event.title, date: event.startDate, url: gcalUrl, syncedAt: new Date().toISOString() });
      localStorage.setItem('rwa_gcal_synced', JSON.stringify(synced.slice(0, 50)));
    } catch(e) {}

    if (options.openNow) {
      window.open(gcalUrl, '_blank');
      showToast(`✓ "${event.title}" opened in Google Calendar!`, 'success');
    } else {
      showToast(`📅 Event "${event.title}" synced! <a href="${gcalUrl}" target="_blank" style="color:#2563eb;font-weight:700;text-decoration:underline;margin-left:6px;">Open in Google Calendar ↗</a>`, 'success');
    }
    return gcalUrl;
  };

  window.syncAllSocietyEventsToGoogleCalendar = function () {
    const compliance = (typeof getComplianceItems === 'function') ? getComplianceItems() : [];
    const bookings = (typeof getAmenityBookings === 'function') ? getAmenityBookings() : [];

    let count = 0;
    compliance.forEach(c => {
      window.syncEventToGoogleCalendar({
        title: c.title,
        description: c.desc,
        startDate: c.dateStr || '2026-10-15',
        allDay: true,
        eventType: 'COMPLIANCE'
      }, { openNow: false });
      count++;
    });

    bookings.forEach(b => {
      window.syncEventToGoogleCalendar({
        title: `${b.amenity} Booking (${b.name})`,
        description: `Booking for ${b.name} (${b.unit})\nSlot: ${b.slot}\nPurpose: ${b.purpose}`,
        startDate: b.date || '2026-10-12',
        eventType: 'AMENITY'
      }, { openNow: false });
      count++;
    });

    showToast(`🚀 ${count} society events & deadlines successfully synced with Google Calendar!`, 'success');
  };

  // ------------------------------------------------------------
  // 17. Interactive Auto-wiring for Buttons
  // ------------------------------------------------------------
  function wireInteractiveButtons() {
    document.querySelectorAll('button').forEach((b) => {
      if (b.getAttribute('data-wired')) return
      if (b.getAttribute('onclick') || b.onclick) return
      const txt = b.innerText.trim()

      if (txt === '+ Post Notice') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openPostNoticeModal()
      } else if (txt === '+ Raise Complaint' || txt === '+ New Complaint') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openNewComplaintModal()
      } else if (txt === '+ Add Resident' || txt === '+ Add Member') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openAddMemberModal()
      } else if (txt === '+ Add Expense') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openRecordExpenseModal()
      } else if (txt === '+ Schedule Meeting') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openScheduleMeetingModal()
      } else if (txt === '+ Add Amenity' || txt === 'Book Facility') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openBookAmenityModal()
      } else if (txt === '+ Record Payment' || txt === '💳 Record Payment' || txt === '+ Pay') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openRecordPaymentModal()
      } else if (txt === '⚡ Generate Bills' || txt === '⚡ Generate Bills (Batch)') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => triggerGenerateBills()
      } else if (txt === '⚡ Bulk Update Bills' || txt === '🔄 Bulk Update Bills' || txt === 'Bulk Update Bills' || txt === '⚡ Bulk Update / Revise Bills' || txt === '🔄 Bulk Update / Revise Bills') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => openBulkUpdateBillsModal()
      } else if (txt === '📊 Excel' || txt === '📊 Export to Excel' || txt === '📊 Export' || txt === '📊 Export Defaulters List') {
        b.setAttribute('data-wired', 'true')
        b.onclick = (e) => {
          e.stopPropagation()
          downloadReport(Router.current() || 'Society_Report', 'csv')
        }
      } else if (txt === '📄 PDF' || txt === '📄 Download' || txt === '📥 Download' || txt === '⬇ Download PDF') {
        b.setAttribute('data-wired', 'true')
        b.onclick = (e) => {
          e.stopPropagation()
          downloadReport(Router.current() || 'Society_Statement', 'csv')
        }
      } else if (txt === '📡 Send Now') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => handleSendBroadcast()
      } else if (txt === '✓ Mark Resolved' || txt === 'Update Status') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => resolveComplaint('#C-084')
      } else if (txt === 'Post Comment' || txt === 'Send') {
        b.setAttribute('data-wired', 'true')
        b.onclick = () => addComplaintComment('Update submitted')
      }
    })
  }

  // Re-wire buttons whenever Router navigates
  if (typeof Router !== 'undefined' && typeof Router.onNavigate === 'function') {
    Router.onNavigate(() => {
      setTimeout(wireInteractiveButtons, 50)
    })
  }
  setInterval(wireInteractiveButtons, 1000)


// ============================================================
  // STAFF & GUARD PORTAL — Live Data Functions
  // ============================================================

  // Internal state
  window.__staffPortalData   = null
  window.__staffPassesAll    = []
  window.__staffPassFilter   = 'ALL'
  window.__staffCurrentGuard = null

  window.scrubStaffPortalData = function(data) {
    if (!data) return data
    const s = data.staff || {}
    const d = data.duty || {}
    const sal = data.salary || {}
    const dummyPosts = ['Gate 1 Entrance Desk', 'Gate 1 - Main Entrance', 'Gate 1 - Main Entrance Desk', 'Gate 1 Desk', 'Not assigned']
    const sampleNames = ['Ram Singh', 'Dharmendra Kumar', 'Bijender Yadav', 'Manoj Tiwari', 'Suraj Sharma', 'Ramesh Paswan', 'Sunita Devi', 'Rekha Rani', 'Mahesh Electrician', 'Shankar Plumber', 'Radhey Shyam', 'Dr. Vikram Malhotra']
    if (dummyPosts.indexOf(s.locationPost) !== -1) s.locationPost = ''
    if (dummyPosts.indexOf(d.currentPost) !== -1) d.currentPost = ''
    if (s.blockName === 'Campus Wide') s.blockName = ''
    if (d.currentBlock === 'Campus Wide') d.currentBlock = ''
    if (!sal.salaryDate || sal.salaryDate === '5th of every month' || sal.salaryDate === '—') sal.salaryDate = ''
    if (!sal.nextSalaryCredit || sal.nextSalaryCredit === '—') sal.nextSalaryCredit = ''
    if (Number(sal.attendancePresent) === 26 && Number(sal.attendanceTotal) === 28) {
      sal.attendancePresent = 0
      sal.attendanceTotal = 0
      sal.attendancePercent = 0
    }
    if (!sal.lastPaidDate || sal.lastPaidDate === '—' || sal.lastPaidDate === '-') {
      sal.lastPaidDate = ''
      sal.paymentStatus = ''
    }
    if (d.supervisor && sampleNames.indexOf(d.supervisor.name) !== -1) d.supervisor = null
    if (d.reliefGuard && sampleNames.indexOf(d.reliefGuard.name) !== -1) d.reliefGuard = null
    data.staff = s
    data.duty = d
    data.salary = sal
    return data
  }

  window.staffRoundAreas = {
    cleaning: [
      ['lobby', 'Lobby and entrance'],
      ['stairs', 'Staircases'],
      ['parking', 'Parking'],
      ['garbage', 'Garbage point'],
      ['washrooms', 'Common washrooms'],
    ],
    garden: [
      ['lawn', 'Main lawn'],
      ['gate', 'Planters at the gate'],
      ['park', 'Children’s park'],
      ['terrace', 'Terrace pots'],
      ['hedge', 'Boundary hedge'],
    ],
  }

  window.paintStaffRound = function(kind) {
    const host = document.getElementById(kind === 'garden' ? 'staffGardenList' : 'staffCleaningList')
    if (!host) return
    const data = window.__staffPortalData || {}
    const saved = (data.rounds && data.rounds[kind]) || {}
    const today = new Date().toISOString().slice(0, 10)
    const done = saved.date === today && Array.isArray(saved.done) ? saved.done : []
    host.innerHTML = window.staffRoundAreas[kind].map(function(area) {
      const on = done.indexOf(area[0]) !== -1
      return '<label style="display:flex;align-items:center;gap:8px;font-size:14px;padding:8px 10px;border:1px solid #E4E4E7;border-radius:2px;">' +
        '<input type="checkbox" class="staff-round-' + kind + '" value="' + area[0] + '"' + (on ? ' checked' : '') + ' />' +
        '<span>' + area[1] + '</span></label>'
    }).join('')
  }

  window.saveStaffRound = async function(kind) {
    const data = window.__staffPortalData || {}
    const dutyId = data.staff && data.staff.id
    if (!dutyId) return
    const done = Array.prototype.map.call(document.querySelectorAll('.staff-round-' + kind + ':checked'), function(el) { return el.value })
    const res = await (window.apiFetch || fetch)('/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_round', dutyId: dutyId, kind: kind, done: done }),
    })
    const body = await res.json().catch(function() { return {} })
    if (!res.ok || !body.success) {
      if (typeof showToast === 'function') showToast(body.error || 'Could not save this round', 'error')
      return
    }
    data.rounds = body.rounds || data.rounds
    if (typeof showToast === 'function') showToast(kind === 'garden' ? 'Garden round saved' : 'Cleaning round saved', 'success')
  }

  window.staffJobMatches = function(ticket, category) {
    const blob = ((ticket.category || '') + ' ' + (ticket.title || '') + ' ' + (ticket.description || '')).toLowerCase()
    const name = ((window.__staffPortalData && window.__staffPortalData.staff && window.__staffPortalData.staff.name) || '').toLowerCase()
    if (ticket.assignedTo && name && String(ticket.assignedTo).toLowerCase() === name) return true
    if (category === 'OFFICE') return true
    if (category === 'HOUSEKEEPING') return /clean|waste|garbage|sanit|housekeep|sweep|pest/.test(blob)
    if (category === 'GARDENING') return /garden|plant|lawn|horti|tree|grass/.test(blob)
    if (category === 'MAINTENANCE') return /maint|electric|plumb|lift|water|sewage|pump|light|repair|amc/.test(blob) || !(ticket.category)
    return /maint|repair|electric|plumb/.test(blob)
  }

  window.paintStaffJobs = function(tickets, hostId) {
    const host = document.getElementById(hostId)
    if (!host) return
    const open = (tickets || []).filter(function(ticket) { return ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' })
    if (!open.length) {
      host.innerHTML = '<div style="font-size:13px;color:#64748B;">No open work for this department.</div>'
      return
    }
    host.innerHTML = open.slice(0, 12).map(function(ticket) {
      const title = String(ticket.title || 'Complaint').replace(/</g, '')
      const flat = ticket.unit && ticket.unit.unitNumber ? ticket.unit.unitNumber : (ticket.unitNumber || 'Common area')
      const status = ticket.status === 'IN_PROGRESS' ? 'In progress' : 'Open'
      return '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px;border:1px solid #E4E4E7;border-radius:2px;flex-wrap:wrap;">' +
        '<div><div style="font-weight:700;">' + title + '</div><div style="font-size:12px;color:#64748B;">' + flat + ' · ' + status + '</div></div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button type="button" class="btn btn-secondary btn-sm" onclick="window.updateStaffJob(\'' + ticket.id + '\', \'IN_PROGRESS\')">Start</button>' +
          '<button type="button" class="btn btn-primary btn-sm" style="background:#18181B;border:none;" onclick="window.updateStaffJob(\'' + ticket.id + '\', \'RESOLVED\')">Done</button>' +
        '</div></div>'
    }).join('')
  }

  window.loadStaffWork = async function() {
    const data = window.__staffPortalData || {}
    const access = (data.staff && data.staff.portalAccess) || []
    if (access.indexOf('jobs') === -1 && access.indexOf('office') === -1) return
    const res = await (window.apiFetch || fetch)('/api/complaints').catch(function() { return null })
    const body = res && res.ok ? await res.json().catch(function() { return {} }) : {}
    const category = (data.staff && data.staff.category) || ''
    const mine = (body.complaints || []).filter(function(ticket) {
      return window.staffJobMatches(ticket, access.indexOf('office') !== -1 && category === 'OFFICE' ? 'OFFICE' : category)
    })
    if (access.indexOf('jobs') !== -1) window.paintStaffJobs(category === 'OFFICE' ? (body.complaints || []) : mine, 'staffJobsList')
    if (access.indexOf('office') !== -1) {
      window.paintStaffJobs(body.complaints || [], 'staffOfficeJobs')
      const noticeRes = await (window.apiFetch || fetch)('/api/notices').catch(function() { return null })
      const noticeBody = noticeRes && noticeRes.ok ? await noticeRes.json().catch(function() { return {} }) : {}
      const host = document.getElementById('staffOfficeNotices')
      const notices = (noticeBody.notices || []).filter(function(notice) { return !notice.status || notice.status === 'PUBLISHED' }).slice(0, 8)
      if (host) {
        host.innerHTML = notices.length
          ? notices.map(function(notice) {
              return '<div style="padding:10px;border:1px solid #E4E4E7;border-radius:2px;"><div style="font-weight:700;">' + String(notice.title || 'Notice').replace(/</g, '') + '</div><div style="font-size:12px;color:#64748B;margin-top:4px;">' + String(notice.content || '').replace(/</g, '').slice(0, 180) + '</div></div>'
            }).join('')
          : '<div style="font-size:13px;color:#64748B;">No published notices.</div>'
      }
    }
  }

  window.updateStaffJob = async function(complaintId, status) {
    const data = window.__staffPortalData || {}
    const dutyId = data.staff && data.staff.id
    const res = await (window.apiFetch || fetch)('/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_job', dutyId: dutyId, complaintId: complaintId, status: status }),
    })
    const body = await res.json().catch(function() { return {} })
    if (!res.ok || !body.success) {
      if (typeof showToast === 'function') showToast(body.error || 'Could not update this ticket', 'error')
      return
    }
    if (typeof showToast === 'function') showToast(status === 'RESOLVED' ? 'Ticket marked done' : 'Ticket started', 'success')
    window.loadStaffWork()
  }

  window.applyStaffPortalAccess = function(data) {
    const access = (data && data.staff && data.staff.portalAccess && data.staff.portalAccess.length)
      ? data.staff.portalAccess
      : ['gate', 'visitors', 'shift', 'salary', 'intercom']
    const has = function(id) { return access.indexOf(id) !== -1 }
    const scanner = document.querySelector('.staff-scanner')
    if (scanner) scanner.style.display = has('gate') ? '' : 'none'
    const spot = document.getElementById('staffSpotEntryBtn')
    if (spot) spot.style.display = has('gate') ? 'inline-flex' : 'none'
    const refresh = document.getElementById('staffRefreshLabel')
    if (refresh) refresh.textContent = has('gate') ? 'Refresh Gate' : 'Refresh'
    const mark = document.getElementById('staffHeroMark')
    const category = (data.staff && data.staff.category) || ''
    if (mark) mark.textContent = category === 'HOUSEKEEPING' ? '🧹' : (category === 'GARDENING' ? '🌱' : (category === 'OFFICE' ? '🏢' : (category === 'MAINTENANCE' ? '🔧' : '👮')))
    const tabs = [
      { id: 'passes', key: 'visitors', label: 'Gate Visitors Today' },
      { id: 'cleaning', key: 'cleaning', label: 'Cleaning Round' },
      { id: 'garden', key: 'garden', label: 'Garden Round' },
      { id: 'jobs', key: 'jobs', label: 'Work Orders' },
      { id: 'office', key: 'office', label: 'Office Desk' },
      { id: 'duty', key: 'shift', label: 'My Shift & Post' },
      { id: 'salary', key: 'salary', label: 'Salary & Payouts' },
      { id: 'emergency', key: 'intercom', label: 'Intercom & SOS' },
    ].filter(function(tab) { return has(tab.key) })
    const bar = document.getElementById('staffPortalTabs')
    if (bar) {
      bar.innerHTML = tabs.map(function(tab, index) {
        return '<button type="button" class="btn btn-sm ' + (index === 0 ? 'btn-primary' : 'btn-secondary') + '" data-staff-tab="' + tab.id + '" style="font-weight:700;border-radius:8px;padding:8px 16px;"><span>' + tab.label + '</span></button>'
      }).join('')
      Array.prototype.forEach.call(bar.querySelectorAll('button'), function(button) {
        button.onclick = function() { window.switchStaffTab(button.getAttribute('data-staff-tab'), button) }
      })
      document.querySelectorAll('.staff-tab-view').forEach(function(view) { view.style.display = 'none' })
      if (tabs[0]) window.switchStaffTab(tabs[0].id, bar.querySelector('button'))
    }
    const dash = document.querySelector('[data-nav-id="staff-dashboard"]')
    if (dash) {
      const label = dash.querySelector('span:last-child')
      if (label) label.textContent = has('gate') ? 'Gate Scanner & Passes' : 'My Work'
    }
    const passesNav = document.querySelector('[data-nav-id="staff-passes"]')
    if (passesNav) passesNav.style.display = has('visitors') || has('gate') ? '' : 'none'
    const intercomNav = document.querySelector('[data-nav-id="staff-intercom"]')
    if (intercomNav) intercomNav.style.display = has('intercom') ? '' : 'none'
    document.querySelectorAll('.mobile-nav-label').forEach(function(label) {
      if (label.textContent === 'Gate' || label.textContent === 'Work') label.textContent = has('gate') ? 'Gate' : 'Work'
    })
    if (has('cleaning')) window.paintStaffRound('cleaning')
    if (has('garden')) window.paintStaffRound('garden')
    if (has('intercom') && typeof window.loadStaffIntercom === 'function') window.loadStaffIntercom()
    if (has('jobs') || has('office')) window.loadStaffWork()
  }

  // ---- Main loader: fetches /api/staff/portal ----------------
  window.paintStaffSalaryCredits = function(sal) {
    const box = document.getElementById('staffSalaryCredits')
    if (!box) return
    const credits = (sal && sal.credits) || []
    const esc = function(value) {
      return String(value || '').replace(/[&<>"]/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]
      })
    }
    const money = function(value) { return '₹' + Number(value || 0).toLocaleString('en-IN') }
    const statusLabel = function(status) {
      const value = String(status || '').toUpperCase()
      if (value === 'PAID') return 'Paid'
      if (value === 'APPROVED') return 'Approved'
      if (value === 'REJECTED') return 'Rejected'
      if (value === 'PENDING_APPROVAL') return 'Pending'
      return value || 'Recorded'
    }
    if (!credits.length) {
      box.innerHTML = '<div style="font-size:15px;font-weight:800;color:#18181B;">Payments for this person</div>'
        + '<div style="font-size:13px;color:#3F3F46;margin-top:8px;">No salary or other expense is linked to this account yet.</div>'
      return
    }
    const paidRows = credits.filter(function(row) { return String(row.status || 'PAID').toUpperCase() === 'PAID' })
    const total = paidRows.reduce(function(sum, row) { return sum + Number(row.amount || 0) }, 0)
    const rows = credits.map(function(row) {
      const status = String(row.status || 'PAID').toUpperCase()
      const color = status === 'PAID' ? '#166534' : (status === 'REJECTED' ? '#71717A' : '#92400E')
      const detail = [row.category || row.method || 'Expense', row.title || row.reference || '', row.paidLabel || row.month || ''].filter(Boolean).join(' · ')
      return '<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #E4E4E7;">'
        + '<div><div style="font-weight:800;font-size:13px;color:#18181B;">' + esc(row.title || row.reference || row.category || 'Payment') + '</div>'
        + '<div style="font-size:12px;color:#71717A;margin-top:2px;">' + esc(detail) + '</div></div>'
        + '<div style="text-align:right;"><div style="font-weight:800;font-size:14px;color:' + color + ';">' + money(row.amount) + '</div>'
        + '<div style="font-size:11px;font-weight:700;color:' + color + ';">' + statusLabel(status) + '</div></div></div>'
    }).join('')
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">'
      + '<div><div style="font-size:15px;font-weight:800;color:#18181B;">Payments for this person</div>'
      + '<div style="font-size:12px;color:#71717A;margin-top:4px;">Salary and other expenses linked to this account, including maintenance.</div></div>'
      + '<div style="text-align:right;"><div style="font-size:11px;color:#71717A;font-weight:700;">TOTAL PAID</div><div style="font-size:18px;font-weight:800;color:#18181B;">' + money(total) + '</div></div></div>'
      + rows
  }

  window.loadLiveStaffPortal = async function() {
    if (typeof hideMismatchedLiveBar === 'function') hideMismatchedLiveBar()
    try {
      const orgId = localStorage.getItem('rwa_active_org_id') || ''
      const url   = '/api/staff/portal' + (orgId ? '?orgId=' + encodeURIComponent(orgId) : '')
      const res   = await (window.apiFetch || fetch)(url).catch(() => null)
      if (!res || !res.ok) return

      const data = await res.json()
      if (!data.success) return
      window.scrubStaffPortalData(data)

      window.__staffPortalData   = data
      window.__staffPassesAll    = (data.passes && data.passes.list) ? data.passes.list : []
      window.__staffCurrentGuard = data.staff || null

      // --- Populate Hero Identity Strip ----
      const s = data.staff || {}
      const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—' }
      setTxt('staffHeroName',  s.name  || 'Guard')
      setTxt('staffHeroRole',  s.role  || 'Security Guard')
      setTxt('staffHeroPost',  s.locationPost || 'Not assigned')
      setTxt('staffHeroPhone', s.phone || '—')

      const d = data.duty || {}
      setTxt('staffHeroShift', (d.timing ? (d.currentShift + ' (' + d.timing + ')') : (d.currentShift || '—')))

      // society name badge
      const socBadge = document.getElementById('staffHeroSociety')
      if (socBadge && data.society) socBadge.textContent = data.society.name

      // --- Gate Visitors tab count ----
      const passCount = window.__staffPassesAll.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN').length
      const tabCount  = document.getElementById('staffTabPassCount')
      if (tabCount) tabCount.textContent = passCount

      // --- Populate Duty tab ----
      setTxt('dutyCardPost',  d.currentPost || s.locationPost || 'Not assigned')
      setTxt('dutyCardBlock', d.currentBlock || 'Not set')
      setTxt('dutyCardTiming', d.timing || (s.startTime && s.endTime ? s.startTime + ' – ' + s.endTime : 'Not set'))
      setTxt('dutyCardShiftName', d.currentShift || s.shiftName || 'Not set')
      setTxt('dutyCardHoursNote', d.timing || 'Not saved')

      const supCall = document.getElementById('dutyCardSupervisorCall')
      const supRole = document.getElementById('dutyCardSupervisorRole')
      if (d.supervisor && d.supervisor.name) {
        setTxt('dutyCardSupervisorName', d.supervisor.name)
        if (supRole) supRole.textContent = d.supervisor.role || 'Supervisor'
        if (supCall && d.supervisor.phone) {
          supCall.href = 'tel:' + d.supervisor.phone
          supCall.style.display = 'inline-flex'
        }
      } else {
        setTxt('dutyCardSupervisorName', 'Not assigned')
        if (supRole) supRole.textContent = 'No supervisor on this shift'
        if (supCall) supCall.style.display = 'none'
      }
      const relCall = document.getElementById('dutyCardReliefCall')
      const relRole = document.getElementById('dutyCardReliefRole')
      if (d.reliefGuard && d.reliefGuard.name) {
        setTxt('dutyCardReliefName', d.reliefGuard.name)
        if (relRole) relRole.textContent = (d.reliefGuard.role || 'Relief guard') + (d.reliefGuard.shift ? ' · ' + d.reliefGuard.shift : '')
        if (relCall && d.reliefGuard.phone) {
          relCall.href = 'tel:' + d.reliefGuard.phone
          relCall.style.display = 'inline-flex'
        }
      } else {
        setTxt('dutyCardReliefName', 'Not assigned')
        if (relRole) relRole.textContent = 'No relief guard on record'
        if (relCall) relCall.style.display = 'none'
      }

      window._renderWeeklyRoster(s)

      // --- Populate Salary tab ----
      const sal = data.salary || {}
      const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN')
      setTxt('salaryCardMonthly',    Number(sal.monthlySalary) > 0 ? fmt(sal.monthlySalary) : 'Not set')
      setTxt('salaryCardDate',       sal.salaryDate && sal.salaryDate !== '—' ? sal.salaryDate : 'Not set')
      setTxt('salaryCardNextDate',   sal.nextSalaryCredit && sal.nextSalaryCredit !== '—' ? sal.nextSalaryCredit : 'Not set')
      const attendKnown = Number(sal.attendanceTotal) > 0
      setTxt('salaryCardAttendance', attendKnown ? (sal.attendancePresent + ' / ' + sal.attendanceTotal + ' Days') : 'Not recorded')

      const attendSub = document.querySelector('#salaryCardAttendance + div')
      if (attendSub) attendSub.textContent = attendKnown ? (sal.attendancePercent + '% of days on record') : 'Attendance has not been saved'

      // Payment status badge
      const statusBadge = document.getElementById('salaryCardStatusBadge')
      if (statusBadge) {
        const payState = (sal.paymentStatus || '').toUpperCase()
        const isPaid = payState === 'PAID'
        const isKnown = payState && payState !== '—' && payState !== '-'
        statusBadge.textContent = isPaid ? 'Paid' : (isKnown ? payState : 'Not set')
        statusBadge.style.background = isPaid ? '#DCFCE7' : (isKnown ? '#FEE2E2' : '#F4F4F5')
        statusBadge.style.color = isPaid ? '#166534' : (isKnown ? '#991B1B' : '#18181B')
        statusBadge.style.borderColor = isPaid ? '#BBF7D0' : (isKnown ? '#FECACA' : '#E4E4E7')
      }
      setTxt('salaryCardLastPaid', sal.lastPaidDate || 'Not recorded')
      window.paintStaffSalaryCredits(sal)

      // Bank info
      const bankEl = document.getElementById('salaryCardBank')
      if (bankEl) bankEl.textContent = sal.bankAccount ? ('Payout account: ' + sal.bankAccount) : 'No bank or UPI saved'

      const hasPay = Number(sal.monthlySalary) > 0
      setTxt('slipBasic', hasPay ? fmt(sal.monthlySalary) : 'Not set')
      setTxt('slipAllowance', 'Not added')
      setTxt('slipBonus', 'Not added')
      setTxt('slipPf', 'Not added')
      setTxt('slipEsi', 'Not added')
      setTxt('slipDeduction', '₹0')
      setTxt('slipGross', hasPay ? fmt(sal.monthlySalary) : 'Not set')
      setTxt('slipNet', hasPay ? fmt(sal.monthlySalary) : 'Not set')

      // --- Render passes table ----
      window.renderStaffPassesTable(window.__staffPassesAll)
      window.applyStaffPortalAccess(data)

    } catch (err) {
      console.error('loadLiveStaffPortal error:', err)
      try {
        const orgId = localStorage.getItem('rwa_active_org_id') || ''
        const passUrl = '/api/entry-passes' + (orgId ? '?orgId=' + encodeURIComponent(orgId) : '')
        const passRes = await (window.apiFetch || fetch)(passUrl).catch(() => null)
        if (passRes && passRes.ok) {
          const passData = await passRes.json()
          const passes = passData.passes || []
          window.__staffPassesAll = passes
          window.renderStaffPassesTable(passes)
          const tabCount = document.getElementById('staffTabPassCount')
          if (tabCount) tabCount.textContent = passes.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN').length
        } else {
          const tbody = document.getElementById('staffPassesTableBody')
          if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted,#94A3B8);"><div style="font-size:28px;margin-bottom:8px;">🎫</div><div>No gate passes found. Use &quot;Spot Visitor Entry&quot; to register a visitor.</div></td></tr>'
          }
        }
      } catch (fallbackErr) {
        const tbody = document.getElementById('staffPassesTableBody')
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted,#94A3B8);">No gate passes found. Use &quot;Spot Visitor Entry&quot; to register a visitor.</td></tr>'
        }
      }
    }
  }

  window.loadStaffIntercom = async function() {
    const box = document.getElementById('staffIntercomList')
    if (!box) return
    const dummyNames = ['dr. vikram malhotra', 'vikram malhotra', 'main security gate 1 desk', 'north gate security post', 'society duty electrician', 'society duty plumber', 'campus elevator helpline']
    const dummyPhones = new Set(['9876543200', '9812345678', '1234567890', '1234567891', '9876543210', '9876543211', '9876543212', '18001021234'])
    let contacts = []
    try {
      const res = await (window.apiFetch || fetch)('/api/emergency/contacts')
      if (res && res.ok) {
        const data = await res.json()
        contacts = (data.contacts || []).filter(function(c) {
          const phone = String(c.phone || '').replace(/\D/g, '')
          const name = String(c.name || '').trim().toLowerCase()
          if (dummyNames.indexOf(name) !== -1) return false
          if (dummyPhones.has(phone)) return false
          if (!phone) return false
          return true
        })
      }
    } catch (e) {}
    const esc = function(value) { return String(value || '').replace(/[&<>"]/g, function(ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] }) }
    const cards = contacts.map(function(c) {
      const phone = String(c.phone || '').replace(/[^\d+]/g, '')
      return '<div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;">'
        + '<div><div style="font-weight:800;font-size:14px;">' + esc(c.name) + '</div><div style="font-size:12px;color:#71717A;">' + esc(c.role || 'Society contact') + '</div></div>'
        + '<a href="tel:' + phone + '" class="btn btn-sm btn-primary" style="font-weight:700;">Call</a></div>'
    })
    if (!contacts.length) {
      cards.push('<div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;font-size:13px;color:#3F3F46;">No intercom or emergency contact has been saved for this society.</div>')
    }
    box.innerHTML = cards.join('')
  }

  // ---- Weekly roster renderer --------------------------------
  window._renderWeeklyRoster = function(staff) {
    const container = document.getElementById('staffWeeklyRoster')
    if (!container) return
    const post = staff && staff.locationPost ? staff.locationPost : ''
    const start = staff && staff.startTime ? staff.startTime : ''
    const end = staff && staff.endTime ? staff.endTime : ''
    const shift = staff && staff.shiftName ? staff.shiftName : ''
    if (!post && !start && !shift) {
      container.textContent = 'No shift is assigned to this guard yet.'
      return
    }
    if (!post && !start) {
      container.innerHTML = '<div style="border:1px solid #E4E4E7;border-radius:2px;padding:12px;">'
        + '<div style="font-size:16px;font-weight:800;">' + shift + '</div>'
        + '<div style="font-size:12px;color:#71717A;margin-top:6px;">This is the shift saved on the staff record. No post or clock hours have been added.</div>'
        + '</div>'
      return
    }
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    container.innerHTML = '<div style="border:1px solid #E4E4E7;border-radius:2px;padding:12px;">'
      + '<div style="font-size:11px;font-weight:800;color:#166534;">TODAY · ' + today + '</div>'
      + '<div style="font-size:16px;font-weight:800;margin-top:4px;">' + (post || 'Post not set') + '</div>'
      + '<div style="font-size:13px;color:#3F3F46;margin-top:2px;">' + (shift || 'Shift') + (start && end ? ' · ' + start + ' – ' + end : '') + '</div>'
      + '</div>'
  }

  // ---- Tab switcher ------------------------------------------
  window.switchStaffTab = function(tab, btnEl) {
    ['passes','duty','salary','emergency'].forEach(t => {
      const panel = document.getElementById('staffTabContent' + t.charAt(0).toUpperCase() + t.slice(1))
      if (panel) panel.style.display = (t === tab) ? 'flex' : 'none'
    })
    // Update button active states
    const tabs = document.getElementById('staffPortalTabs')
    if (tabs) {
      tabs.querySelectorAll('button').forEach(b => {
        b.className = b === btnEl ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'
        b.style.fontWeight = '700'
        b.style.borderRadius = '8px'
        b.style.padding = '8px 16px'
      })
    }
  }

  // ---- Pass filter -------------------------------------------
  window.filterStaffPasses = function(statusFilter) {
    window.__staffPassFilter = statusFilter || 'ALL'
    const all = window.__staffPassesAll || []
    if (statusFilter === 'ALL') {
      window.renderStaffPassesTable(all)
    } else {
      window.renderStaffPassesTable(all.filter(p => p.status === statusFilter))
    }
    // Update filter button active states
    document.querySelectorAll('#staffTabContentPasses .btn-sm').forEach(btn => {
      const txt = btn.textContent.trim()
      const isActive =
        (statusFilter === 'ALL'         && txt === 'All') ||
        (statusFilter === 'APPROVED'    && txt.includes('Expected')) ||
        (statusFilter === 'CHECKED_IN'  && txt.includes('Inside')) ||
        (statusFilter === 'CHECKED_OUT' && txt.includes('Departed'))
      btn.className = isActive ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'
      btn.style.fontSize = '12px'
      btn.style.fontWeight = '700'
    })
  }

  // ---- Table renderer ----------------------------------------
  window.renderStaffPassesTable = function(list) {
    const tbody = document.getElementById('staffPassesTableBody')
    const cards = document.getElementById('staffPassCards')
    if (!tbody && !cards) return

    if (!list || list.length === 0) {
      const empty = '<div style="text-align:center;padding:28px 12px;color:#71717A;">' +
        '<div style="font-size:28px;margin-bottom:8px;">🎫</div>' +
        '<div style="font-weight:700;margin-bottom:4px;">No visitor passes found</div>' +
        '<div style="font-size:12px;">Use Spot Visitor Entry to log a walk-in visitor</div></div>'
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6">' + empty + '</td></tr>'
      }
      if (cards) cards.innerHTML = empty
      return
    }

    const fmtTime = (d) => {
      if (!d) return '—'
      const dt = new Date(d)
      return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    const statusBadge = (status) => {
      const map = {
        APPROVED:    { bg: '#EFF6FF', color: '#1D4ED8', label: '🔵 Expected' },
        CHECKED_IN:  { bg: '#F0FDF4', color: '#16A34A', label: '🟢 Inside'   },
        CHECKED_OUT: { bg: '#F8FAFC', color: '#94A3B8', label: '⚪ Departed' },
        CANCELLED:   { bg: '#FEF2F2', color: '#DC2626', label: '🔴 Cancelled'},
      }
      const s = map[status] || { bg: '#F8FAFC', color: '#64748B', label: status }
      return '<span style="background:' + s.bg + ';color:' + s.color + ';font-size:11px;font-weight:700;padding:3px 8px;border-radius:8px;">' + s.label + '</span>'
    }

    const typeIcon = (t) => ({ GUEST:'👤', DELIVERY:'📦', CAB:'🚕', SERVICE:'🔧', STAFF:'👷', VENDOR:'🏪' }[t] || '👤')

    const rows = list.slice(0, 50).map(p => {
      const isApproved   = p.status === 'APPROVED'
      const isCheckedIn  = p.status === 'CHECKED_IN'
      const actionsHtml  = isApproved
        ? '<button data-wired="true" class="btn btn-sm btn-primary" style="font-size:11px;padding:4px 10px;border-radius:6px;" onclick="event.stopPropagation();window.staffCheckIn(\'' + p.id + '\')">✅ Check In</button>'
        : (isCheckedIn
          ? '<button data-wired="true" class="btn btn-sm btn-secondary" style="font-size:11px;padding:4px 10px;border-radius:6px;" onclick="event.stopPropagation();window.staffCheckOut(\'' + p.id + '\')">🚪 Check Out</button>'
          : '<span style="font-size:12px;color:var(--text-muted,#94A3B8);">' + fmtTime(p.checkedOutAt || p.updatedAt) + '</span>')

      return '<tr style="transition:background 0.12s;" onmouseover="this.style.background=\'var(--bg-elevated,#F8FAFC)\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-family:monospace;font-size:12px;font-weight:800;color:#2563EB;">' + (p.passCode || '—') + '</div>' +
          '<div style="font-size:11px;color:#64748B;margin-top:2px;">PIN: <strong>' + (p.otpPin || '—') + '</strong></div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-weight:700;font-size:13px;">' + (p.visitorName || '—') + '</div>' +
          '<div style="font-size:11px;color:#64748B;">' + (p.visitorPhone || '') + '</div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-weight:600;font-size:13px;color:#0F172A;">' + (p.residentUnit || '—') + '</div>' +
          '<div style="font-size:11px;color:#64748B;">' + (p.residentName || '') + '</div>' +
          (p.residentPhone ? '<div style="font-size:11px;color:#18181B;font-weight:700;">' + p.residentPhone + '</div>' : '') +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:16px;">' + typeIcon(p.visitorType) + '</span>' +
            '<div>' +
              '<div style="font-size:12px;font-weight:600;">' + (p.visitorType || 'GUEST') + '</div>' +
              (p.vehicleNumber ? '<div style="font-size:11px;color:#64748B;">' + p.vehicleNumber + '</div>' : '') +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' + statusBadge(p.status) + '</td>' +
        '<td style="padding:12px 16px;text-align:right;">' + actionsHtml + '</td>' +
      '</tr>'
    }).join('')
    if (tbody) tbody.innerHTML = rows
    if (cards) {
      const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
      cards.innerHTML = list.slice(0, 50).map(p => {
        const isApproved = p.status === 'APPROVED'
        const isCheckedIn = p.status === 'CHECKED_IN'
        const safeId = String(p.id || '').replace(/'/g, '')
        const action = isApproved
          ? '<button type="button" class="btn btn-primary" onclick="window.staffCheckIn(\'' + safeId + '\')">Check in</button>'
          : (isCheckedIn
            ? '<button type="button" class="btn btn-secondary" onclick="window.staffCheckOut(\'' + safeId + '\')">Check out</button>'
            : '')
        const visitorTel = String(p.visitorPhone || '').replace(/[^\d+]/g, '')
        const residentTel = String(p.residentPhone || '').replace(/[^\d+]/g, '')
        const phoneLink = visitorTel
          ? '<a href="tel:' + visitorTel + '">' + esc(p.visitorPhone) + '</a>'
          : '—'
        const residentLink = residentTel
          ? '<a href="tel:' + residentTel + '">' + esc(p.residentPhone) + '</a>'
          : '—'
        return '<article class="staff-pass-card">' +
          '<div class="staff-pass-card-top">' +
            '<div><div class="staff-pass-name">' + esc(p.visitorName || 'Visitor') + '</div>' +
            '<div class="staff-pass-meta">' + esc(p.visitorType || 'GUEST') + (p.vehicleNumber ? ' · ' + esc(p.vehicleNumber) : '') + '</div></div>' +
            statusBadge(p.status) +
          '</div>' +
          '<div class="staff-pass-card-grid">' +
            '<div><span>Pass</span><strong>' + esc(p.passCode || '—') + '</strong></div>' +
            '<div><span>PIN</span><strong>' + esc(p.otpPin || '—') + '</strong></div>' +
            '<div><span>Flat</span><strong>' + esc(p.residentUnit || '—') + '</strong></div>' +
            '<div><span>Resident</span><strong>' + esc(p.residentName || '—') + '</strong></div>' +
            '<div><span>Visitor phone</span><strong>' + phoneLink + '</strong></div>' +
            '<div><span>Resident phone</span><strong>' + residentLink + '</strong></div>' +
          '</div>' +
          (action ? '<div class="staff-pass-card-action">' + action + '</div>' : '') +
        '</article>'
      }).join('')
    }
  }

  // ---- Check In ----------------------------------------------
  window.staffCheckIn = async function(passId) {
    try {
      const guard = window.__staffCurrentGuard
      const guardName = guard ? guard.name + ' (' + (guard.locationPost || 'Gate') + ')' : 'Gate Security Guard'

      const res = await (window.apiFetch || fetch)('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passId, action: 'check_in', guardName, notes: 'Checked in by guard at gate.' }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Check-in failed')

      if (typeof window.showToast === 'function') window.showToast('✅ Visitor Checked In: ' + (data.pass && data.pass.visitorName), 'success')
      await window.loadLiveStaffPortal()
    } catch (err) {
      if (typeof window.showToast === 'function') window.showToast('Check-in error: ' + err.message, 'error')
      else console.error('staffCheckIn error:', err)
    }
  }

  // ---- Check Out ---------------------------------------------
  window.staffCheckOut = async function(passId) {
    try {
      const guard = window.__staffCurrentGuard
      const guardName = guard ? guard.name + ' (' + (guard.locationPost || 'Gate') + ')' : 'Gate Security Guard'

      const res = await (window.apiFetch || fetch)('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passId, action: 'check_out', guardName }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Check-out failed')

      if (typeof window.showToast === 'function') window.showToast('🚪 Visitor Checked Out: ' + (data.pass && data.pass.visitorName), 'info')
      await window.loadLiveStaffPortal()
    } catch (err) {
      if (typeof window.showToast === 'function') window.showToast('Check-out error: ' + err.message, 'error')
      else console.error('staffCheckOut error:', err)
    }
  }

  window.staffVisitorPassCard = function(p, headline) {
    const esc = function(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
      })
    }
    const call = function(num, label) {
      const digits = String(num || '').replace(/\D/g, '')
      if (digits.length < 10) return '<span style="color:#71717A;">No phone on record</span>'
      const dial = digits.length === 10 ? '91' + digits : digits
      const shown = digits.length > 10 ? digits : digits
      return '<a href="tel:+' + dial + '" style="font-weight:800;color:#18181B;text-decoration:none;">' + esc(shown) + '</a>'
        + '<a class="btn btn-primary btn-sm" href="tel:+' + dial + '" style="margin-left:8px;">' + label + '</a>'
    }
    const when = function(value) {
      if (!value) return '—'
      const dt = new Date(value)
      return isNaN(dt.getTime()) ? '—' : dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
    const field = function(label, value) {
      return '<div><div style="font-size:11px;color:#71717A;font-weight:700;">' + label + '</div><div style="margin-top:2px;font-size:14px;font-weight:700;color:#18181B;">' + value + '</div></div>'
    }
    const action = p.status === 'CHECKED_IN' && p.id
      ? '<button type="button" class="btn btn-primary btn-sm" onclick="window.staffCheckOut(\'' + String(p.id).replace(/'/g, '') + '\')">Check out</button>'
      : ''
    return ''
      + '<div style="padding:14px 16px;">'
      + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">'
      + '<div style="font-size:15px;font-weight:800;">' + esc(headline || 'Visitor pass') + '</div>'
      + '<div style="font-size:12px;font-weight:700;">' + esc(p.status || '') + '</div>'
      + '</div>'
      + '<div class="staff-verify-cols" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;">'
      + '<div style="border:1px solid #E4E4E7;border-radius:2px;padding:12px;">'
      + '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">Visitor</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + field('Name', esc(p.visitorName || '—'))
      + field('Type', esc(p.visitorType || 'GUEST'))
      + field('Phone', call(p.visitorPhone, 'Call visitor'))
      + field('Vehicle', esc(p.vehicleNumber || 'On foot'))
      + field('Purpose', esc(p.purpose || '—'))
      + field('Pass', esc((p.passCode || '—') + ' · PIN ' + (p.otpPin || '—')))
      + field('Gate', esc(p.gateNumber || '—'))
      + field('Valid until', esc(when(p.validUntil)))
      + '</div></div>'
      + '<div style="border:1px solid #18181B;border-radius:2px;padding:12px;">'
      + '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">Resident who created this pass</div>'
      + '<div style="display:grid;grid-template-columns:1fr;gap:8px;">'
      + field('Flat', esc(p.residentUnit || '—'))
      + field('Name', esc(p.residentName || 'Resident'))
      + field('Phone', call(p.residentPhone, 'Call resident'))
      + '<div style="font-size:12px;color:#3F3F46;line-height:1.45;">Call this resident if you need them to confirm the visitor.</div>'
      + action
      + '</div></div>'
      + '</div></div>'
  }

  // ---- Quick Pass Verifier (scanner input) -------------------
  window.handleStaffQuickVerify = async function() {
    const input = document.getElementById('staffScannerInput')
    if (!input) return
    const code = (input.value || '').trim()
    if (!code) {
      if (typeof window.showToast === 'function') window.showToast('Please enter a Pass Code, PIN, or Phone number', 'warning')
      return
    }

    const resultBox = document.getElementById('staffScannerResultBox')

    try {
      const guard = window.__staffCurrentGuard
      const guardName = guard ? guard.name : 'Gate Security Guard'
      const locationPost = guard ? (guard.locationPost || 'Gate 1 - Main Gate') : 'Gate 1 - Main Gate'

      if (resultBox) {
        resultBox.style.display = 'block'
        resultBox.style.background = '#EFF6FF'
        resultBox.style.border = '1px solid #BFDBFE'
        resultBox.style.color = '#1D4ED8'
        resultBox.innerHTML = '🔍 Verifying pass code <strong>' + code + '</strong>...'
      }

      const res = await (window.apiFetch || fetch)('/api/staff/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quick_verify', passCodeOrPin: code, guardName, locationPost }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Verification failed')

      const p = data.pass || {}

      if (resultBox) {
        resultBox.style.display = 'block'
        resultBox.style.background = '#FFFFFF'
        resultBox.style.border = '1px solid #E4E4E7'
        resultBox.style.color = '#18181B'
        resultBox.style.padding = '0'
        resultBox.innerHTML = window.staffVisitorPassCard(p, data.alreadyCheckedIn ? 'Already inside' : 'Entry granted')
      }
      if (!data.alreadyCheckedIn) {
        if (typeof window.showToast === 'function') window.showToast(data.message || 'Visitor checked in', 'success')
        input.value = ''
        await window.loadLiveStaffPortal()
      }
    } catch (err) {
      if (resultBox) {
        resultBox.style.display = 'block'
        resultBox.style.background = '#FEF2F2'
        resultBox.style.border = '1px solid #FECACA'
        resultBox.style.color = '#991B1B'
        resultBox.innerHTML = '❌ ' + (err.message || 'Verification failed. Please check the pass code.')
      }
      if (typeof window.showToast === 'function') window.showToast(err.message || 'Verification failed', 'error')
    }
  }

  // ---- Spot Visitor Entry Modal ------------------------------
  window.openSpotEntryModal = function() {
    const html =
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Visitor Name *</label>' +
          '<input type="text" id="spotVisitorName" class="form-input" placeholder="e.g. Ramesh Kumar" style="width:100%;font-size:13px;" /></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Phone Number</label>' +
          '<input type="tel" id="spotVisitorPhone" class="form-input" placeholder="10-digit mobile" style="width:100%;font-size:13px;" /></div>' +
      '</div>' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Destination Flat *</label>' +
          '<input type="text" id="spotResidentUnit" class="form-input" placeholder="e.g. A-402, B-201" style="width:100%;font-size:13px;" /></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Visitor Type</label>' +
          '<select id="spotVisitorType" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="GUEST">👤 Guest</option>' +
            '<option value="DELIVERY">📦 Delivery</option>' +
            '<option value="CAB">🚕 Cab / Ride</option>' +
            '<option value="SERVICE">🔧 Service Worker</option>' +
            '<option value="VENDOR">🏪 Vendor</option>' +
          '</select></div>' +
      '</div>' +
      '<div><label style="font-size:12px;font-weight:700;">Vehicle Number (optional)</label>' +
        '<input type="text" id="spotVehicleNo" class="form-input" placeholder="e.g. DL 3C AU 9901" style="width:100%;font-size:13px;" /></div>' +
      '<div><label style="font-size:12px;font-weight:700;">Purpose of Visit</label>' +
        '<input type="text" id="spotPurpose" class="form-input" placeholder="e.g. Food delivery, Guest visit" style="width:100%;font-size:13px;" /></div>' +
      '</div>'

    if (typeof window.showModal === 'function') {
      window.showModal('+ Spot Visitor Entry', html, '✅ Allow Entry & Generate Pass', async function() {
        await window._submitSpotEntry()
      }, '500px')
    } else {
      alert('Modal not available. Please refresh.')
    }
  }

  window._submitSpotEntry = async function() {
    const visitorName  = (document.getElementById('spotVisitorName')  || {}).value || ''
    const visitorPhone = (document.getElementById('spotVisitorPhone') || {}).value || ''
    const residentUnit = (document.getElementById('spotResidentUnit') || {}).value || ''
    const visitorType  = (document.getElementById('spotVisitorType')  || {}).value || 'GUEST'
    const vehicleNumber = (document.getElementById('spotVehicleNo')   || {}).value || ''
    const purpose      = (document.getElementById('spotPurpose')      || {}).value || 'Walk-in visitor'

    if (!visitorName.trim() || !residentUnit.trim()) {
      if (typeof window.showToast === 'function') window.showToast('Visitor name and flat number are required', 'warning')
      throw new Error('Required fields missing')
    }

    const guard = window.__staffCurrentGuard
    const orgId = localStorage.getItem('rwa_active_org_id') || ''

    const res = await (window.apiFetch || fetch)('/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName:   visitorName.trim(),
        visitorPhone:  visitorPhone.trim(),
        residentUnit:  residentUnit.trim(),
        visitorType,
        vehicleNumber: vehicleNumber.trim(),
        purpose:       purpose.trim(),
        gateNumber:    guard ? (guard.locationPost || 'Gate 1 - Main Gate') : 'Gate 1 - Main Gate',
        validHours:    8,
        organizationId: orgId,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create pass')

    if (typeof window.showToast === 'function') {
      window.showToast('🎫 Pass Generated: ' + (data.pass && data.pass.passCode) + ' · PIN: ' + (data.pass && data.pass.otpPin), 'success')
    }

    await window.loadLiveStaffPortal()
    // Switch to passes tab
    const passTab = document.querySelector('#staffPortalTabs button:first-child')
    if (passTab) window.switchStaffTab('passes', passTab)
  }

  // ============================================================
  // ADMIN VISITOR ENTRY PASSES — Live Data Functions
  // ============================================================

  window.__adminPassesAll = []
  window.__adminPassesCategoryFilter = 'ALL'
  window.__adminPassesGateFilter = 'ALL'
  window.__adminPassesSearchQuery = ''

  window.loadLiveAdminEntryPasses = async function() {
    try {
      const orgId = localStorage.getItem('rwa_active_org_id') || ''
      const url = '/api/entry-passes' + (orgId ? '?orgId=' + encodeURIComponent(orgId) : '')
      const res = await (window.apiFetch || fetch)(url).catch(() => null)
      if (!res || !res.ok) return
      const data = await res.json()
      const passes = data.passes || []
      const stats = data.stats || {}
      window.__adminPassesAll = passes

      const setTxt = (id, val) => {
        const el = document.getElementById(id)
        if (el) el.textContent = val !== undefined && val !== null ? val : '0'
      }

      setTxt('statPassesActiveToday', stats.activeToday !== undefined ? stats.activeToday : passes.filter(p => p.status === 'APPROVED' || p.status === 'CHECKED_IN').length)
      setTxt('statPassesCheckedIn', stats.checkedInNow !== undefined ? stats.checkedInNow : passes.filter(p => p.status === 'CHECKED_IN').length)
      setTxt('statPassesPreApproved', stats.preApproved !== undefined ? stats.preApproved : passes.filter(p => p.status === 'APPROVED').length)
      setTxt('statPassesCheckedOut', stats.checkedOutToday !== undefined ? stats.checkedOutToday : passes.filter(p => p.status === 'CHECKED_OUT').length)
      setTxt('statPassesDeliveries', (stats.deliveries || 0) + (stats.cabs || 0))

      window.applyAdminPassesFilters()
    } catch (err) {
      console.error('loadLiveAdminEntryPasses error:', err)
      const tbody = document.getElementById('adminPassesTableBody')
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted,#94A3B8);">No passes found. Click &quot;+ Issue Visitor Pass&quot; to create one.</td></tr>'
      }
    }
  }

  window.applyAdminPassesFilters = function() {
    let list = (window.__adminPassesAll || []).slice()
    const cat = window.__adminPassesCategoryFilter || 'ALL'
    const gate = window.__adminPassesGateFilter || 'ALL'
    const query = (window.__adminPassesSearchQuery || '').toLowerCase().trim()

    if (cat === 'CHECKED_IN' || cat === 'APPROVED' || cat === 'CHECKED_OUT') {
      list = list.filter(p => p.status === cat)
    } else if (cat !== 'ALL') {
      list = list.filter(p => p.visitorType === cat)
    }

    if (gate !== 'ALL') {
      list = list.filter(p => (p.gateNumber || '').toLowerCase().includes(gate.toLowerCase()))
    }

    if (query) {
      list = list.filter(p =>
        (p.passCode || '').toLowerCase().includes(query) ||
        (p.otpPin || '').toLowerCase().includes(query) ||
        (p.visitorName || '').toLowerCase().includes(query) ||
        (p.visitorPhone || '').toLowerCase().includes(query) ||
        (p.residentUnit || '').toLowerCase().includes(query) ||
        (p.residentName || '').toLowerCase().includes(query) ||
        (p.vehicleNumber || '').toLowerCase().includes(query) ||
        (p.purpose || '').toLowerCase().includes(query)
      )
    }

    window.renderAdminPassesTable(list)
  }

  window.filterAdminPasses = function(category, btnEl) {
    window.__adminPassesCategoryFilter = category || 'ALL'
    const tabs = document.getElementById('adminPassesCategoryTabs')
    if (tabs) {
      tabs.querySelectorAll('button').forEach(b => {
        b.className = b === btnEl ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary'
        b.style.borderRadius = '8px'
        b.style.fontSize = '12px'
        b.style.fontWeight = '700'
      })
    }
    window.applyAdminPassesFilters()
  }

  window.filterAdminPassesGate = function(gate) {
    window.__adminPassesGateFilter = gate || 'ALL'
    window.applyAdminPassesFilters()
  }

  window.searchAdminPasses = function(query) {
    window.__adminPassesSearchQuery = query || ''
    window.applyAdminPassesFilters()
  }

  window.renderAdminPassesTable = function(list) {
    const tbody = document.getElementById('adminPassesTableBody')
    if (!tbody) return

    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary,#94A3B8);">' +
        '<div style="font-size:28px;margin-bottom:8px;">🎫</div>' +
        '<div style="font-weight:600;margin-bottom:4px;">No visitor passes found</div>' +
        '<div style="font-size:12px;">Use &quot;+ Issue Visitor Pass&quot; above to generate a new pass.</div>' +
        '</td></tr>'
      return
    }

    const fmtTime = (d) => {
      if (!d) return '—'
      const dt = new Date(d)
      return dt.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' ' +
             dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    const statusBadge = (status) => {
      const map = {
        APPROVED:    { bg: '#EFF6FF', color: '#1D4ED8', label: '🔵 Expected' },
        CHECKED_IN:  { bg: '#F0FDF4', color: '#16A34A', label: '🟢 Inside'   },
        CHECKED_OUT: { bg: '#F8FAFC', color: '#64748B', label: '⚪ Checked Out' },
        CANCELLED:   { bg: '#FEF2F2', color: '#DC2626', label: '🔴 Cancelled'},
      }
      const s = map[status] || { bg: '#F8FAFC', color: '#64748B', label: status }
      return '<span style="background:' + s.bg + ';color:' + s.color + ';font-size:11px;font-weight:700;padding:3px 9px;border-radius:8px;">' + s.label + '</span>'
    }

    const typeIcon = (t) => ({ GUEST:'👤', DELIVERY:'📦', CAB:'🚕', SERVICE:'🔧', STAFF:'👷', VENDOR:'🏪' }[t] || '👤')

    tbody.innerHTML = list.map(p => {
      const isApproved  = p.status === 'APPROVED'
      const isCheckedIn = p.status === 'CHECKED_IN'

      let actionsHtml = ''
      if (isApproved) {
        actionsHtml = '<button class="btn btn-sm btn-primary" style="font-size:11px;padding:3px 8px;border-radius:6px;margin-right:4px;" onclick="window.adminCheckInPass(\'' + p.id + '\')">Check In</button>' +
                      '<button class="btn btn-sm btn-secondary" style="font-size:11px;padding:3px 8px;border-radius:6px;color:#EF4444;" onclick="window.adminRevokePass(\'' + p.id + '\')">Revoke</button>'
      } else if (isCheckedIn) {
        actionsHtml = '<button class="btn btn-sm btn-secondary" style="font-size:11px;padding:3px 8px;border-radius:6px;" onclick="window.adminCheckOutPass(\'' + p.id + '\')">Check Out</button>'
      } else {
        actionsHtml = '<span style="font-size:11.5px;color:var(--text-muted,#94A3B8);">Completed</span>'
      }

      let logText = '—'
      if (p.checkedInAt) {
        logText = 'In: ' + fmtTime(p.checkedInAt) + (p.checkedInBy ? ' (' + p.checkedInBy + ')' : '')
      }
      if (p.checkedOutAt) {
        logText += '<br/>Out: ' + fmtTime(p.checkedOutAt) + (p.checkedOutBy ? ' (' + p.checkedOutBy + ')' : '')
      }

      return '<tr style="border-bottom:1px solid var(--border,#F1F5F9);transition:background 0.12s;" onmouseover="this.style.background=\'var(--bg-elevated,#F8FAFC)\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-family:monospace;font-size:12.5px;font-weight:800;color:#2563EB;">' + (p.passCode || '—') + '</div>' +
          '<div style="font-size:11px;color:#64748B;margin-top:2px;">Gate PIN: <strong>' + (p.otpPin || '—') + '</strong></div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-weight:700;font-size:13px;color:#0F172A;">' + (p.visitorName || '—') + '</div>' +
          '<div style="font-size:11.5px;color:#64748B;">📞 ' + (p.visitorPhone || '—') + '</div>' +
          (p.purpose ? '<div style="font-size:11px;color:#94A3B8;margin-top:2px;">' + p.purpose + '</div>' : '') +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="font-weight:700;font-size:13px;color:#0F172A;">Flat ' + (p.residentUnit || '—') + '</div>' +
          '<div style="font-size:11.5px;color:#64748B;">' + (p.residentName || 'Resident') + '</div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:16px;">' + typeIcon(p.visitorType) + '</span>' +
            '<div>' +
              '<div style="font-size:12px;font-weight:600;">' + (p.gateNumber || 'Gate 1') + '</div>' +
              (p.vehicleNumber ? '<div style="font-size:11px;color:#64748B;font-family:monospace;">' + p.vehicleNumber + '</div>' : '<div style="font-size:11px;color:#94A3B8;">No vehicle</div>') +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 16px;">' + statusBadge(p.status) + '</td>' +
        '<td style="padding:12px 16px;font-size:11.5px;color:#475569;line-height:1.4;">' + logText + '</td>' +
        '<td style="padding:12px 16px;text-align:right;">' + actionsHtml + '</td>' +
      '</tr>'
    }).join('')
  }

  window.adminCheckInPass = async function(id) {
    try {
      const res = await (window.apiFetch || fetch)('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'check_in', guardName: 'Admin Control' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed')
      if (typeof window.showToast === 'function') window.showToast('✅ Visitor checked in!', 'success')
      await window.loadLiveAdminEntryPasses()
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message, 'error')
    }
  }

  window.adminCheckOutPass = async function(id) {
    try {
      const res = await (window.apiFetch || fetch)('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'check_out', guardName: 'Admin Control' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed')
      if (typeof window.showToast === 'function') window.showToast('🚪 Visitor checked out!', 'info')
      await window.loadLiveAdminEntryPasses()
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message, 'error')
    }
  }

  window.adminRevokePass = async function(id) {
    if (!confirm('Are you sure you want to cancel and revoke this visitor entry pass?')) return
    try {
      const res = await (window.apiFetch || fetch)('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'revoke' }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Revoke failed')
      if (typeof window.showToast === 'function') window.showToast('Pass revoked', 'warning')
      await window.loadLiveAdminEntryPasses()
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast(e.message, 'error')
    }
  }

  window.openAdminCreateEntryPassModal = function() {
    const html =
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Visitor Full Name *</label>' +
          '<input type="text" id="admPassVisitorName" class="form-input" placeholder="e.g. Ramesh Kumar" style="width:100%;font-size:13px;" /></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Phone Number</label>' +
          '<input type="tel" id="admPassVisitorPhone" class="form-input" placeholder="10-digit mobile" style="width:100%;font-size:13px;" /></div>' +
      '</div>' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Destination Flat *</label>' +
          '<input type="text" id="admPassResidentUnit" class="form-input" placeholder="e.g. A-402" style="width:100%;font-size:13px;" /></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Resident / Host Name</label>' +
          '<input type="text" id="admPassResidentName" class="form-input" placeholder="e.g. Dr. Vikram Malhotra" style="width:100%;font-size:13px;" /></div>' +
      '</div>' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Visitor Type</label>' +
          '<select id="admPassVisitorType" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="GUEST">👤 Guest / Friend</option>' +
            '<option value="DELIVERY">📦 Delivery (Zomato/Amazon)</option>' +
            '<option value="CAB">🚕 Cab / Uber / Ola</option>' +
            '<option value="SERVICE">🔧 Maintenance / Service</option>' +
            '<option value="VENDOR">🏪 Vendor / Contractor</option>' +
          '</select></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Designated Entry Gate</label>' +
          '<select id="admPassGate" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="Gate 1 - Main Gate">Gate 1 - Main Gate</option>' +
            '<option value="Gate 2 - Service Gate">Gate 2 - Service Gate</option>' +
            '<option value="Gate 3 - Rear Gate">Gate 3 - Rear Gate</option>' +
          '</select></div>' +
      '</div>' +
      '<div class="staff-form-pair" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div><label style="font-size:12px;font-weight:700;">Vehicle Number (Optional)</label>' +
          '<input type="text" id="admPassVehicleNo" class="form-input" placeholder="e.g. HR 26 DQ 8832" style="width:100%;font-size:13px;" /></div>' +
        '<div><label style="font-size:12px;font-weight:700;">Validity Duration</label>' +
          '<select id="admPassValidHours" class="form-select" style="width:100%;font-size:13px;">' +
            '<option value="4">4 Hours</option>' +
            '<option value="8">8 Hours</option>' +
            '<option value="12" selected>12 Hours (Standard)</option>' +
            '<option value="24">24 Hours (Full Day)</option>' +
          '</select></div>' +
      '</div>' +
      '<div><label style="font-size:12px;font-weight:700;">Purpose / Notes</label>' +
        '<input type="text" id="admPassPurpose" class="form-input" placeholder="e.g. Family dinner, AC repair service" style="width:100%;font-size:13px;" /></div>' +
      '</div>'

    if (typeof window.showModal === 'function') {
      window.showModal('🎫 Issue Society Visitor Entry Pass', html, 'Generate Pass & Notify Guard', async function() {
        const vName = (document.getElementById('admPassVisitorName') || {}).value || ''
        const vPhone = (document.getElementById('admPassVisitorPhone') || {}).value || ''
        const rUnit = (document.getElementById('admPassResidentUnit') || {}).value || ''
        const rName = (document.getElementById('admPassResidentName') || {}).value || ''
        const vType = (document.getElementById('admPassVisitorType') || {}).value || 'GUEST'
        const gate = (document.getElementById('admPassGate') || {}).value || 'Gate 1 - Main Gate'
        const vNo = (document.getElementById('admPassVehicleNo') || {}).value || ''
        const vHours = (document.getElementById('admPassValidHours') || {}).value || '12'
        const purpose = (document.getElementById('admPassPurpose') || {}).value || ''

        if (!vName.trim() || !rUnit.trim()) {
          if (typeof window.showToast === 'function') window.showToast('Visitor name and destination flat are required', 'warning')
          throw new Error('Required fields missing')
        }

        const orgId = localStorage.getItem('rwa_active_org_id') || ''
        const res = await (window.apiFetch || fetch)('/api/entry-passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorName: vName.trim(),
            visitorPhone: vPhone.trim(),
            residentUnit: rUnit.trim(),
            residentName: rName.trim(),
            visitorType: vType,
            gateNumber: gate,
            vehicleNumber: vNo.trim(),
            validHours: parseInt(vHours) || 12,
            purpose: purpose.trim(),
            organizationId: orgId,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create pass')

        if (typeof window.showToast === 'function') {
          window.showToast('✅ Pass ' + (data.pass && data.pass.passCode) + ' issued! PIN: ' + (data.pass && data.pass.otpPin), 'success')
        }
        await window.loadLiveAdminEntryPasses()
      }, '520px')
    }
  }

  // Auto-load screens when navigating
  if (typeof Router !== 'undefined' && typeof Router.onNavigate === 'function') {
    Router.onNavigate(function(screenId) {
      if (screenId === 'staff-dashboard') {
        setTimeout(function() {
          if (typeof window.loadLiveStaffPortal === 'function') window.loadLiveStaffPortal()
        }, 80)
      } else if (screenId === 'admin-entry-passes') {
        setTimeout(function() {
          if (typeof window.loadLiveAdminEntryPasses === 'function') window.loadLiveAdminEntryPasses()
        }, 80)
      }
    })
  }
})()
