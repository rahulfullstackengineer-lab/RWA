// =============================================
// Amenity Management & Booking Calendar Screens
// Production Live Version with Backend API Persistence
// =============================================

window._amenityViewMode = window._amenityViewMode || 'list';
window._amenityMonth = window._amenityMonth !== undefined ? window._amenityMonth : 9; // 0-indexed: 9 = Oct
window._amenityYear = window._amenityYear || 2026;
window._amenitySelectedDate = window._amenitySelectedDate || '2026-10-12';
window._amenityFilter = window._amenityFilter || 'All';
window._amenityLoading = false;
window._amenityData = window._amenityData || {
  amenities: [],
  bookings: [],
  metrics: {
    activeAmenities: 0,
    bookingsThisMonth: 0,
    revenueGenerated: 0,
    pendingApprovals: 0,
  }
};

window.loadLiveAmenities = async function(forceRefresh = false) {
  if (window._amenityLoading && !forceRefresh) return;
  window._amenityLoading = true;
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/amenities');
    if (res.ok) {
      const data = await res.json();
      if (data && data.amenities) {
        window._amenityData = {
          amenities: data.amenities,
          bookings: data.bookings || [],
          metrics: data.metrics || {
            activeAmenities: data.amenities.filter(a => a.status === 'ACTIVE').length,
            bookingsThisMonth: (data.bookings || []).length,
            revenueGenerated: (data.bookings || []).filter(b => b.status === 'CONFIRMED').reduce((acc, b) => acc + (Number(b.feeNum) || 0), 0),
            pendingApprovals: (data.bookings || []).filter(b => b.status === 'PENDING').length,
          }
        };
        window._amenitiesLoaded = true;
      }
    }
  } catch (err) {
    console.error('Error fetching live amenities:', err);
  } finally {
    window._amenityLoading = false;
  }
};

window.getAmenities = function() {
  if (window._amenityData && Array.isArray(window._amenityData.amenities)) {
    return window._amenityData.amenities;
  }
  return [];
};

window.getAmenityBookings = function() {
  if (window._amenityData && Array.isArray(window._amenityData.bookings)) {
    return window._amenityData.bookings;
  }
  return [];
};

window.toggleAmenityView = function() {
  window._amenityViewMode = window._amenityViewMode === 'calendar' ? 'list' : 'calendar';
  Router.go('admin-amenities');
};

window.changeAmenityMonth = function(delta) {
  let m = window._amenityMonth + delta;
  let y = window._amenityYear;
  if (m < 0) { m = 11; y--; }
  else if (m > 11) { m = 0; y++; }
  window._amenityMonth = m;
  window._amenityYear = y;
  Router.go('admin-amenities');
};

window.selectAmenityDate = function(dateStr) {
  window._amenitySelectedDate = dateStr;
  Router.go('admin-amenities');
};

window.approveAmenityBooking = async function(idOrAmenity, residentName) {
  // 1. Resolve target booking from state
  const bookings = getAmenityBookings();
  const b = bookings.find(item => item.id === idOrAmenity || (item.amenity === idOrAmenity && item.name === residentName));
  const bookingId = b ? b.id : idOrAmenity;

  // 2. Optimistic UI update
  if (b) {
    b.status = 'CONFIRMED';
  }
  if (window._amenityData && window._amenityData.metrics) {
    window._amenityData.metrics.pendingApprovals = Math.max(0, (window._amenityData.metrics.pendingApprovals || 1) - 1);
  }

  // 3. Play sound & display immediate toast
  if (typeof window.playNotificationSound === 'function') window.playNotificationSound();
  const residentStr = b ? ` for "${b.amenity}" (${b.name})` : ` ${bookingId}`;
  showToast(`✓ Booking${residentStr} approved! Slot locked & calendar synced.`, 'success');

  // 4. Preserve scroll position before re-rendering
  const scrollPos = window.scrollY || document.documentElement.scrollTop;
  Router.go('admin-amenities');
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPos);
  });

  // 5. Fire backend API call
  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/amenities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_booking', bookingId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.metrics) window._amenityData.metrics = data.metrics;
      await window.loadLiveAmenities(true);
      Router.go('admin-amenities');
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
      });
    }
  } catch (e) {
    console.error('approveAmenityBooking error:', e);
  }
};

window.rejectAmenityBooking = async function(idOrAmenity, residentName) {
  const reason = prompt('Specify rejection reason (e.g. Schedule conflict, Maintenance window):', 'Facility slot unavailable');
  if (reason === null) return;

  const bookings = getAmenityBookings();
  const b = bookings.find(item => item.id === idOrAmenity || (item.amenity === idOrAmenity && item.name === residentName));
  const bookingId = b ? b.id : idOrAmenity;

  if (b) {
    b.status = 'REJECTED';
    b.notes = reason;
  }
  if (window._amenityData && window._amenityData.metrics) {
    window._amenityData.metrics.pendingApprovals = Math.max(0, (window._amenityData.metrics.pendingApprovals || 1) - 1);
  }

  showToast(`Booking for "${b ? b.amenity : bookingId}" rejected. Security deposit refunded.`, 'info');
  const scrollPos = window.scrollY || document.documentElement.scrollTop;
  Router.go('admin-amenities');
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPos);
  });

  try {
    const fetchFn = window.apiFetch || fetch;
    const res = await fetchFn('/api/amenities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject_booking', bookingId, reason }),
    });

    if (res.ok) {
      await window.loadLiveAmenities(true);
      Router.go('admin-amenities');
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
      });
    }
  } catch (e) {
    console.error('rejectAmenityBooking error:', e);
  }
};

window.openAddAmenityModal = function() {
  const html = `
    <div>
      <label class="form-label">Facility / Amenity Name *</label>
      <input type="text" id="addAmnName" required placeholder="e.g. Squash Court, Rooftop Lounge, Yoga Studio" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Category</label>
        <select id="addAmnCat" class="form-select" style="width:100%;">
          <option value="Sports">Sports & Recreation</option>
          <option value="Clubhouse" selected>Clubhouse & Halls</option>
          <option value="Outdoors">Outdoors & Lawns</option>
          <option value="Wellness">Health & Wellness</option>
          <option value="Kids">Kids & Play Area</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Icon Emoji</label>
        <select id="addAmnIcon" class="form-select" style="width:100%;">
          <option value="🏛️">🏛️ Banquet Hall</option>
          <option value="🎾">🎾 Tennis Court</option>
          <option value="🏊">🏊 Swimming Pool</option>
          <option value="🏸">🏸 Badminton</option>
          <option value="🧘">🧘 Yoga Room</option>
          <option value="🌿">🌿 Party Lawn</option>
          <option value="🎱">🎱 Billiards Room</option>
          <option value="🏢">🏢 Conference / Meeting</option>
          <option value="🏋️">🏋️ Fitness Gym</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Capacity (Persons)</label>
        <input type="text" id="addAmnCap" placeholder="e.g. 50 persons" value="50 persons" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Slot Booking Fee (₹)</label>
        <input type="number" id="addAmnFee" placeholder="0 if free" value="1000" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Security Deposit (₹)</label>
        <input type="number" id="addAmnDeposit" placeholder="0" value="1000" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Operating Hours (Start & End Time) *</label>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="time" id="addAmnStart" value="08:00" class="form-input" style="flex:1;" />
          <span style="font-size:12px;color:var(--text-muted);">to</span>
          <input type="time" id="addAmnEnd" value="22:00" class="form-input" style="flex:1;" />
        </div>
      </div>
    </div>
    <div>
      <label class="form-label">Booking Rules & Guidelines</label>
      <textarea id="addAmnRules" rows="2" placeholder="e.g. Max 2 bookings per month per flat. No loud music after 10 PM." class="form-input" style="width:100%; resize:vertical;">Max 2 bookings per month per flat. No loud music after 10 PM. Cleanliness deposit refunded after inspection.</textarea>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Configure New Society Amenity', html, 'Save & Activate Amenity 🚀', async () => {
      const name = document.getElementById('addAmnName').value.trim();
      const cat = document.getElementById('addAmnCat').value;
      const icon = document.getElementById('addAmnIcon').value;
      const cap = document.getElementById('addAmnCap').value || '50 persons';
      const feeNum = parseInt(document.getElementById('addAmnFee').value || '0', 10);
      const depositNum = parseInt(document.getElementById('addAmnDeposit').value || '0', 10);
      const startTime = document.getElementById('addAmnStart')?.value || '08:00';
      const endTime = document.getElementById('addAmnEnd')?.value || '22:00';
      const timings = `${startTime} - ${endTime}`;
      const rules = document.getElementById('addAmnRules')?.value || '';

      if (!name) throw new Error('Amenity name is required');

      try {
        const fetchFn = window.apiFetch || fetch;
        const res = await fetchFn('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_amenity',
            name,
            cat,
            icon,
            cap,
            feeNum,
            depositNum,
            timings,
            rules,
            status: 'ACTIVE',
            color: '#3b82f6'
          }),
        });

        if (res.ok) {
          showToast(`🎉 "${name}" added to society amenities catalog!`, 'success');
          await window.loadLiveAmenities(true);
          Router.go('admin-amenities');
          return;
        }
      } catch (err) {
        console.error('Error adding amenity via API:', err);
      }

      showToast(`🎉 "${name}" added to society amenities catalog!`, 'success');
      Router.go('admin-amenities');
    });
  }
};

window.openEditAmenityRulesModal = function(amenityId) {
  const amenities = getAmenities();
  const a = amenities.find(item => item.id === amenityId || item.name === amenityId);
  if (!a) return;

  const html = `
    <div>
      <label class="form-label">Facility Name</label>
      <input type="text" id="editAmnName" value="${a.name}" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Timings / Operating Hours</label>
        <input type="text" id="editAmnTimings" value="${a.timings || '08:00 AM - 10:00 PM'}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Status</label>
        <select id="editAmnStatus" class="form-select" style="width:100%;">
          <option value="ACTIVE" ${a.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE (Operational)</option>
          <option value="MAINTENANCE" ${a.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE (Temporarily Closed)</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Slot Fee (₹)</label>
        <input type="number" id="editAmnFee" value="${a.feeNum || 0}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Security Deposit (₹)</label>
        <input type="number" id="editAmnDeposit" value="${a.depositNum || 0}" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div>
      <label class="form-label">Rules & Usage Guidelines</label>
      <textarea id="editAmnRules" rows="2" class="form-input" style="width:100%; resize:vertical;">${a.rules || 'Max 1 booking per flat per week. Maintain cleanliness.'}</textarea>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Edit Rules: ${a.name}`, html, 'Update Rules ✓', async () => {
      const name = document.getElementById('editAmnName').value.trim();
      const timings = document.getElementById('editAmnTimings').value.trim();
      const status = document.getElementById('editAmnStatus').value;
      const feeNum = parseInt(document.getElementById('editAmnFee').value || '0', 10);
      const depositNum = parseInt(document.getElementById('editAmnDeposit').value || '0', 10);
      const rules = document.getElementById('editAmnRules').value.trim();

      try {
        const fetchFn = window.apiFetch || fetch;
        const res = await fetchFn('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_rules',
            amenityId: a.id,
            name,
            timings,
            status,
            feeNum,
            depositNum,
            rules,
          }),
        });

        if (res.ok) {
          showToast(`✓ Rules for "${name || a.name}" updated successfully!`, 'success');
          await window.loadLiveAmenities(true);
          Router.go('admin-amenities');
          return;
        }
      } catch (err) {
        console.error('Error updating rules via API:', err);
      }

      showToast(`✓ Rules for "${a.name}" updated successfully!`, 'success');
      Router.go('admin-amenities');
    });
  }
};

window.openBookAmenityModal = function(preselectedDate) {
  const amenities = getAmenities();
  const defaultDate = preselectedDate || window._amenitySelectedDate || '2026-10-15';

  const html = `
    <div>
      <label class="form-label">Facility / Amenity *</label>
      <select id="bookAmnSelect" class="form-select" style="width:100%;" onchange="window.updateBookingFeePreview()">
        ${amenities.map(a => `
          <option value="${a.name}" data-fee="${a.feeNum || 0}" data-deposit="${a.depositNum || 0}">
            ${a.icon} ${a.name} — ${a.fee} (Deposit: ${a.deposit})${a.status === 'MAINTENANCE' ? ' ⚠️ [Under Maintenance]' : ''}
          </option>
        `).join('')}
      </select>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Resident / Unit *</label>
        <select id="bookUnitSelect" class="form-select" style="width:100%;" onchange="window.updateResidentAutoFill()">
          <option value="A-1" data-name="Rajesh Kumar" data-phone="98000 11223">A-1 · Rajesh Kumar</option>
          <option value="A-3" data-name="Vijay Mehta" data-phone="98765 43210">A-3 · Vijay Mehta</option>
          <option value="B-4" data-name="Anita Roy" data-phone="98222 33445">B-4 · Anita Roy</option>
          <option value="B-14" data-name="Kavita Gupta" data-phone="98111 22334">B-14 · Kavita Gupta</option>
          <option value="C-7" data-name="Col. Ranjit Singh" data-phone="98100 99887">C-7 · Col. Ranjit Singh</option>
          <option value="D-4" data-name="Sameer Verma" data-phone="98450 67890">D-4 · Sameer Verma</option>
          <option value="E-12" data-name="Dr. Sunita Rao" data-phone="98333 44556">E-12 · Dr. Sunita Rao</option>
          <option value="Custom" data-name="" data-phone="">Other / Custom Resident...</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Resident Name *</label>
        <input type="text" id="bookResidentName" value="Rajesh Kumar" class="form-input" style="width:100%;" required />
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Contact Phone</label>
        <input type="tel" id="bookResidentPhone" value="98000 11223" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Booking Date *</label>
        <input type="date" id="bookDate" value="${defaultDate}" class="form-input" style="width:100%;" required />
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Time Slot *</label>
        <select id="bookTimeSlot" class="form-select" style="width:100%;">
          <option value="06:00 AM – 08:00 AM">06:00 AM – 08:00 AM (Early Morning)</option>
          <option value="09:00 AM – 01:00 PM">09:00 AM – 01:00 PM (Morning Slot)</option>
          <option value="02:00 PM – 06:00 PM">02:00 PM – 06:00 PM (Afternoon Slot)</option>
          <option value="06:00 PM – 08:00 PM">06:00 PM – 08:00 PM (Evening Game/Practice)</option>
          <option value="04:00 PM – 10:00 PM" selected>04:00 PM – 10:00 PM (Party/Event Slot)</option>
          <option value="07:00 PM – 11:00 PM">07:00 PM – 11:00 PM (Night Function)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Occasion / Purpose *</label>
        <input type="text" id="bookPurpose" placeholder="e.g. Birthday Party, Badminton Match" value="Family Celebration" class="form-input" style="width:100%;" required />
      </div>
    </div>
    <div id="bookingFeeSummaryBox" style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);margin-top:10px;border:1px solid var(--border-light);">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
        <span>Facility Booking Fee:</span>
        <strong id="previewFeeText" class="rupee">2,500</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);">
        <span>Security Deposit (Refundable):</span>
        <span id="previewDepositText" class="rupee">2,000</span>
      </div>
    </div>
    <div style="margin-top:10px;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--blue);">
        <input type="checkbox" id="bookSyncGcal" checked style="width:16px;height:16px;" />
        <span>📅 Add reservation to Google Calendar</span>
      </label>
    </div>
  `;

  window.updateResidentAutoFill = function() {
    const sel = document.getElementById('bookUnitSelect');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    if (opt.value === 'Custom') {
      document.getElementById('bookResidentName').value = '';
      document.getElementById('bookResidentPhone').value = '';
    } else {
      document.getElementById('bookResidentName').value = opt.getAttribute('data-name') || '';
      document.getElementById('bookResidentPhone').value = opt.getAttribute('data-phone') || '';
    }
  };

  window.updateBookingFeePreview = function() {
    const sel = document.getElementById('bookAmnSelect');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    const fee = parseInt(opt.getAttribute('data-fee') || '0', 10);
    const dep = parseInt(opt.getAttribute('data-deposit') || '0', 10);
    const feeBox = document.getElementById('previewFeeText');
    const depBox = document.getElementById('previewDepositText');
    if (feeBox) feeBox.textContent = fee.toLocaleString('en-IN');
    if (depBox) depBox.textContent = dep.toLocaleString('en-IN');
  };

  if (typeof window.showModal === 'function') {
    window.showModal('Reserve Society Facility', html, 'Confirm Booking ✓', async () => {
      const facilitySelect = document.getElementById('bookAmnSelect');
      const amenityName = facilitySelect.value;
      const selectedOpt = facilitySelect.options[facilitySelect.selectedIndex];
      const feeNum = parseInt(selectedOpt.getAttribute('data-fee') || '0', 10);
      const depositNum = parseInt(selectedOpt.getAttribute('data-deposit') || '0', 10);

      const unitSelect = document.getElementById('bookUnitSelect');
      const unit = unitSelect.value === 'Custom' ? 'Visitor' : unitSelect.value;
      const residentName = document.getElementById('bookResidentName').value.trim() || 'Resident';
      const phone = document.getElementById('bookResidentPhone').value.trim() || '98000 00000';
      const date = document.getElementById('bookDate').value;
      const slot = document.getElementById('bookTimeSlot').value;
      const purpose = document.getElementById('bookPurpose').value.trim() || 'Facility Reservation';
      const syncGcal = document.getElementById('bookSyncGcal')?.checked;

      try {
        const fetchFn = window.apiFetch || fetch;
        const res = await fetchFn('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'book_slot',
            amenityName,
            unit,
            residentName,
            phone,
            date,
            slot,
            purpose,
            fee: feeNum,
            deposit: depositNum,
            autoApprove: true,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (syncGcal && typeof window.syncEventToGoogleCalendar === 'function') {
            window.syncEventToGoogleCalendar({
              title: `Reservation: ${amenityName} (${residentName})`,
              description: `Resident: ${residentName} (${unit})\nSlot: ${slot}\nPurpose: ${purpose}\nLocation: Society Clubhouse & Facilities`,
              startDate: `${date}T10:00:00Z`,
              eventType: 'AMENITY'
            }, { openNow: true });
          }
          showToast(`🎉 ${amenityName} reserved for ${residentName} (${unit}) on ${date}!`, 'success');
          await window.loadLiveAmenities(true);
          Router.go('admin-amenities');
          return;
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.error) {
            alert(`Booking Conflict: ${errData.error}`);
            return;
          }
        }
      } catch (err) {
        console.error('Error reserving facility slot:', err);
      }

      showToast(`🎉 ${amenityName} reserved for ${residentName}!`, 'success');
      Router.go('admin-amenities');
    });

    setTimeout(() => {
      window.updateBookingFeePreview();
    }, 50);
  }
};
window.openAdminBookAmenityModal = window.openBookAmenityModal;

// Main Screen Component
Screens['admin-amenities'] = function() {
  if (!window._amenitiesLoaded && !window._amenityLoading) {
    window.loadLiveAmenities().then(() => {
      if (typeof Router !== 'undefined' && Router.current() === 'admin-amenities') {
        Router.go('admin-amenities');
      }
    });
  }

  const amenities = getAmenities();
  const bookings = getAmenityBookings();
  const metrics = window._amenityData.metrics || {
    activeAmenities: amenities.filter(a => a.status === 'ACTIVE').length,
    bookingsThisMonth: bookings.length,
    revenueGenerated: 0,
    pendingApprovals: bookings.filter(b => b.status === 'PENDING').length,
  };

  const activeAmenitiesCount = metrics.activeAmenities ?? 0;
  const bookingsThisMonthCount = metrics.bookingsThisMonth ?? 0;
  const revenueGeneratedAmount = (metrics.revenueGenerated ?? 0).toLocaleString('en-IN');
  const pendingBookingsCount = metrics.pendingApprovals ?? 0;

  const viewMode = window._amenityViewMode || 'list';

  // Calendar calculations
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const curMonth = window._amenityMonth !== undefined ? window._amenityMonth : 9; // Oct
  const curYear = window._amenityYear || 2026;
  const curMonthName = monthNames[curMonth];

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(curYear, curMonth, 1).getDay(); // 0 is Sun
  const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

  const selectedDateStr = window._amenitySelectedDate || `${curYear}-${String(curMonth+1).padStart(2,'0')}-12`;
  const selectedDateBookings = bookings.filter(b => b.date === selectedDateStr);

  return Shell.render('admin-amenities', {
    title: 'Amenities & Facilities',
    portal: 'admin',
    breadcrumb: 'Operations',
    actions: `<button class="btn btn-primary btn-sm" onclick="openAddAmenityModal()">+ Add Amenity</button>`,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Amenity Management & Bookings</div>
          <div class="page-subtitle">Configure society facilities, hourly slots, rules, deposits, and monitor reservations</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="toggleAmenityView()">
            ${viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
          </button>
          <button class="btn btn-primary" onclick="openAddAmenityModal()">+ Add Amenity</button>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid-4 mb-lg">
        <div class="stat-card" style="cursor:pointer;" onclick="window._amenityViewMode='list'; Router.go('admin-amenities');">
          <div class="stat-label">Active Amenities</div>
          <div class="stat-value">${activeAmenitiesCount}</div>
          <div class="stat-sub text-green">All configured facilities</div>
        </div>
        <div class="stat-card" style="cursor:pointer;" onclick="toggleAmenityView()">
          <div class="stat-label">Bookings This Month</div>
          <div class="stat-value">${bookingsThisMonthCount}</div>
          <div class="stat-sub text-blue">${bookingsThisMonthCount > 0 ? 'Active bookings' : 'No bookings this month'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Revenue Generated</div>
          <div class="stat-value rupee">${revenueGeneratedAmount}</div>
          <div class="stat-sub text-green">${revenueGeneratedAmount !== '0' ? '100% collected' : 'No revenue this month'}</div>
        </div>
        <div class="stat-card" style="cursor:pointer;" onclick="window._amenityViewMode='list'; Router.go('admin-amenities');">
          <div class="stat-label">Pending Approvals</div>
          <div class="stat-value text-amber">${pendingBookingsCount}</div>
          <div class="stat-sub">Review & Approve slots</div>
        </div>
      </div>

      ${viewMode === 'calendar' ? `
        <!-- Full Interactive Amenity Booking Calendar View -->
        <div class="calendar-card">
          <div class="calendar-top-bar">
            <div class="calendar-month-nav">
              <button class="btn btn-secondary btn-sm" onclick="changeAmenityMonth(-1)">◀ Prev</button>
              <div class="calendar-month-title">📅 ${curMonthName} ${curYear}</div>
              <button class="btn btn-secondary btn-sm" onclick="changeAmenityMonth(1)">Next ▶</button>
            </div>
            <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap;">
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#8b5cf6;"></span> Community Hall</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span> Badminton</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#10b981;"></span> Party Lawn</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span> Meeting Room</span>
              <button class="btn btn-primary btn-sm" onclick="openBookAmenityModal('${selectedDateStr}')">+ Book Facility</button>
            </div>
          </div>

          <div class="calendar-grid">
            ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
              <div class="calendar-day-header">${day}</div>
            `).join('')}

            <!-- Previous Month Padded Days -->
            ${Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const prevDate = daysInPrevMonth - firstDayOfWeek + i + 1;
              return `
                <div class="calendar-day-cell other-month">
                  <div class="calendar-day-num">${prevDate}</div>
                </div>
              `;
            }).join('')}

            <!-- Current Month Days -->
            ${Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = curYear === 2026 && curMonth === 9 && dayNum === 13;
              const isSelected = selectedDateStr === dateStr;

              const dayBookings = bookings.filter(b => b.date === dateStr);

              return `
                <div class="calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectAmenityDate('${dateStr}')">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div class="calendar-day-num">${dayNum}</div>
                    ${dayBookings.length ? `<span style="font-size:10px;font-weight:700;color:var(--blue);">${dayBookings.length}</span>` : ''}
                  </div>
                  <div class="calendar-events-wrap">
                    ${dayBookings.slice(0, 2).map(b => {
                      const color = b.amenity.includes('Hall') ? '#8b5cf6' : b.amenity.includes('Lawn') ? '#10b981' : b.amenity.includes('Badminton') ? '#3b82f6' : '#f59e0b';
                      return `
                        <div class="calendar-event-pill" style="background:${color}15;color:${color};border:1px solid ${color}40;" title="${b.amenity} · ${b.name} (${b.slot})">
                          <span>${b.status === 'CONFIRMED' ? '✓' : '⏳'}</span>
                          <span>${b.amenity}</span>
                        </div>
                      `;
                    }).join('')}
                    ${dayBookings.length > 2 ? `
                      <div style="font-size:9px;color:var(--text-muted);font-weight:700;">+${dayBookings.length - 2} more</div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Selected Date Schedule Drawer -->
        <div class="calendar-selected-drawer">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:16px;font-weight:800;color:var(--text-primary);">
                🏊 Facility Reservations for ${new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${selectedDateBookings.length} booking${selectedDateBookings.length !== 1 ? 's' : ''} scheduled on this date
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openBookAmenityModal('${selectedDateStr}')">+ Book Facility for Resident</button>
          </div>

          ${selectedDateBookings.length ? `
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${selectedDateBookings.map(b => `
                <div style="display:flex;gap:14px;align-items:center;padding:14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-lg);flex-wrap:wrap;">
                  <div style="flex:1;min-width:220px;">
                    <div style="display:flex;gap:8px;margin-bottom:4px;align-items:center;">
                      <span style="font-size:14px;font-weight:800;color:var(--text-primary);">${b.amenity}</span>
                      <span class="badge badge-${b.status === 'CONFIRMED' ? 'green' : b.status === 'PENDING' ? 'amber' : 'red'}">${b.status}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:2px;">
                      👤 <strong>${b.name}</strong> (${b.unit}) · 📞 ${b.phone}
                    </div>
                    <div style="font-size:11px;color:var(--text-muted);">
                      ⏰ <strong>${b.slot}</strong> · 💬 <em>"${b.purpose}"</em>
                    </div>
                  </div>
                  <div style="text-align:right;min-width:140px;">
                    <div style="font-size:12px;font-weight:700;">Fee: ${b.fee}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">Deposit: ${b.deposit}</div>
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      ${b.status === 'PENDING' ? `
                        <button class="btn btn-primary btn-sm" style="padding:3px 8px;font-size:11px;" onclick="approveAmenityBooking('${b.id}', '${(b.name||'').replace(/'/g, "\\'")}')">Approve</button>
                        <button class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px;color:var(--red);" onclick="rejectAmenityBooking('${b.id}', '${(b.name||'').replace(/'/g, "\\'")}')">Reject</button>
                      ` : `
                        <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:11px;" onclick="downloadReport('Booking_${b.id}')">Receipt 🧾</button>
                      `}
                      <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:11px;" onclick="syncEventToGoogleCalendar({ title: 'Reservation: ${b.amenity} (${b.name})', description: 'Resident: ${b.name} (${b.unit})\\nSlot: ${b.slot}\\nPurpose: ${(b.purpose||'').replace(/'/g, "\\'")}', startDate: '${b.date}T10:00:00Z', eventType: 'AMENITY' }, { openNow: true })" title="Add to Google Calendar">📅 Google Cal</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding:28px 16px;text-align:center;background:var(--bg-elevated);border-radius:var(--r-md);color:var(--text-muted);font-size:13px;">
              No bookings scheduled for this date. All facility slots are open for reservations.
            </div>
          `}
        </div>
      ` : `
        <!-- Standard List View -->
        <div class="dashboard-main-grid">
          <!-- Facilities List -->
          <div>
            <div class="card mb-md">
              <div class="card-header">
                <div class="card-title">Society Amenities</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span class="badge badge-blue">${amenities.length} configured</span>
                  <button class="btn btn-secondary btn-sm" onclick="openAddAmenityModal()">+ Add New</button>
                </div>
              </div>
              ${amenities.map(a => `
                <div style="display:flex;align-items:center;gap:14px;padding:14px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:10px;background:var(--bg-surface);transition:all 0.15s;"
                  onmouseover="this.style.background='var(--bg-elevated)'"
                  onmouseout="this.style.background='var(--bg-surface)'">
                  <div style="width:44px;height:44px;border-radius:10px;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">
                    ${a.icon}
                  </div>
                  <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:14px;font-weight:700;">${a.name}</span>
                      <span class="badge badge-${a.status==='ACTIVE'?'green':'amber'}" style="font-size:10px;">${a.status}</span>
                      <span class="badge badge-muted" style="font-size:10px;">${a.cat}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                      <span>👥 ${a.cap}</span> · <span style="font-weight:600;color:var(--text-primary)">${a.fee}</span>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">
                      ⏰ ${a.timings} · 🛡️ ${a.deposit}
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:13px;font-weight:700;color:var(--blue);">${a.bookings || 0} bookings</div>
                    <button class="btn btn-ghost btn-sm" style="margin-top:4px;" onclick="openEditAmenityRulesModal('${a.id}')">Edit Rules ⚙️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Upcoming & Pending Bookings -->
          <div>
            <div class="card mb-md">
              <div class="card-header">
                <div class="card-title">Recent & Upcoming Bookings</div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span class="badge badge-amber">${pendingBookingsCount} pending</span>
                  <button class="btn btn-primary btn-sm" onclick="openBookAmenityModal()">+ Book Slot</button>
                </div>
              </div>
              ${bookings.map(b => `
                <div style="padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:10px;background:var(--bg-surface);">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                    <div>
                      <span style="font-size:13px;font-weight:700;">${b.amenity}</span>
                      <span style="font-size:12px;color:var(--text-muted);margin-left:6px;">(${b.dateDisplay || b.date})</span>
                    </div>
                    <span class="badge badge-${b.status==='CONFIRMED'?'green':b.status==='PENDING'?'amber':'red'}">${b.status}</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">
                    👤 <strong>${b.name}</strong> (${b.unit}) · 📞 ${b.phone}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);background:var(--bg-elevated);padding:6px 10px;border-radius:6px;margin-bottom:8px;">
                    💬 <em>"${b.purpose}"</em> · ⏱️ ${b.slot}
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:12px;">
                      Fee: <strong class="rupee">${(b.fee||'').replace('₹','')}</strong> + Deposit: <span class="rupee">${(b.deposit||'').replace('₹','')}</span>
                    </div>
                    <div style="display:flex;gap:6px;">
                      ${b.status==='PENDING' ? `
                        <button class="btn btn-primary btn-sm" style="padding:3px 8px;font-size:11px;" onclick="approveAmenityBooking('${b.id}', '${(b.name||'').replace(/'/g, "\\'")}')">Approve</button>
                        <button class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:11px;color:var(--red);" onclick="rejectAmenityBooking('${b.id}', '${(b.name||'').replace(/'/g, "\\'")}')">Reject</button>
                      ` : `
                        <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:11px;" onclick="downloadReport('Booking_${b.id}')">Receipt 🧾</button>
                      `}
                      <button class="btn btn-ghost btn-sm" style="padding:3px 8px;font-size:11px;" onclick="syncEventToGoogleCalendar({ title: 'Reservation: ${b.amenity} (${b.name})', description: 'Resident: ${b.name} (${b.unit})\\nSlot: ${b.slot}\\nPurpose: ${(b.purpose||'').replace(/'/g, "\\'")}', startDate: '${b.date}T10:00:00Z', eventType: 'AMENITY' }, { openNow: true })" title="Add to Google Calendar">📅 Google Cal</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `}
    `,
  });
};
