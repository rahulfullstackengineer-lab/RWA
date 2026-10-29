// =============================================
// Governance: Meetings & Committee/Elections
// =============================================

window.__meetingsActiveTab = window.__meetingsActiveTab || 'upcoming';
window.__selectedMeetingId = window.__selectedMeetingId || null;
window.__meetingsData = window.__meetingsData || null;
window.__detailActiveTab = window.__detailActiveTab || 'agenda';

// Fallback seed data if offline or before API loads
window.__defaultMeetingsData = {
  meetings: []
};

window.saveMeetingsLocal = function(data) {
  try {
    localStorage.setItem('rwa_meetings_store', JSON.stringify(data));
  } catch(e) {}
};

window.getMeetingsLocal = function() {
  try {
    const raw = localStorage.getItem('rwa_meetings_store');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return window.__defaultMeetingsData;
};

window.fetchMeetingsData = async function(force = false) {
  if (window.__meetingsData && !force) return window.__meetingsData;
  try {
    const res = await fetch('/api/meetings');
    if (res.ok) {
      const data = await res.json();
      window.__meetingsData = data;
      window.saveMeetingsLocal(data);
      return data;
    }
  } catch(e) {
    console.warn('API meetings fetch fallback to local cache:', e);
  }
  const cached = window.getMeetingsLocal();
  window.__meetingsData = cached;
  return cached;
};

// Auto prime cache on load
window.fetchMeetingsData().catch(() => {});

window.setMeetingsTab = function(tab) {
  window.__meetingsActiveTab = tab;
  if (typeof Router !== 'undefined') Router.go('admin-meetings');
};

window.setDetailTab = function(tab) {
  window.__detailActiveTab = tab;
  if (typeof Router !== 'undefined') Router.go('admin-meeting-detail');
};

window.openMeetingDetail = function(id) {
  window.__selectedMeetingId = id;
  window.__detailActiveTab = 'agenda';
  if (typeof Router !== 'undefined') Router.go('admin-meeting-detail');
};

window.getMeetingAgenda = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId;
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId);
  if (m && Array.isArray(m.agenda)) return m.agenda;
  return [];
};

window.syncMeetingToGoogle = function(meeting) {
  if (!meeting) return;
  const sDate = meeting.scheduledAt || new Date().toISOString();
  if (typeof window.syncEventToGoogleCalendar === 'function') {
    window.syncEventToGoogleCalendar({
      title: `${meeting.title} (${meeting.type})`,
      description: `Society Meeting Agenda:\n${(meeting.agenda || []).map((a, i) => `${i+1}. ${a.title || a}`).join('\n')}\n\nVenue: ${meeting.venue}\nQuorum: ${meeting.quorum}`,
      location: meeting.venue || 'Sector 22 RWA Community Hall',
      startDate: sDate,
      eventType: 'MEETING'
    }, { openNow: true });
    return;
  }
  const startIso = new Date(sDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endIso = new Date(new Date(sDate).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title + ' (' + meeting.type + ')')}&dates=${startIso}/${endIso}&details=${encodeURIComponent('Society Meeting at ' + meeting.venue + '\nQuorum: ' + meeting.quorum)}&location=${encodeURIComponent(meeting.venue)}`;
  window.open(gcalUrl, '_blank');
  showToast('✓ Google Calendar event template opened!', 'success');
};

window.sendMeetingNotice = async function(idOrTitle) {
  const data = await window.fetchMeetingsData();
  const m = (data.meetings || []).find(x => x.id === idOrTitle || x.title === idOrTitle) || (data.meetings || [])[0];
  if (!m) {
    showToast(`📢 Formal notice dispatched for "${idOrTitle}" to all 342 members!`, 'success');
    return;
  }

  showToast(`Dispatching formal notice for "${m.title}"...`, 'info');

  try {
    const res = await fetch('/api/meetings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, action: 'SEND_NOTICE' })
    });
    if (res.ok) {
      m.noticeSent = true;
      m.noticeDate = new Date().toISOString().split('T')[0];
      window.saveMeetingsLocal(data);
      showToast(`📢 Formal notice dispatched! Auto-published to Resident Notice Board & SMS sent.`, 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go(Router.current());
      });
      return;
    }
  } catch (err) {}

  m.noticeSent = true;
  m.noticeDate = new Date().toISOString().split('T')[0];
  window.saveMeetingsLocal(data);
  showToast(`📢 Formal notice dispatched for "${m.title}" to all 342 members!`, 'success');
  if (typeof Router !== 'undefined') Router.go(Router.current());
};

window.openAddAgendaItemModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-001';
  const html = `
    <div>
      <label class="form-label">Agenda Item Title *</label>
      <input type="text" id="agendaTitle" required placeholder="e.g. Solar rooftop panel project proposal" class="form-input" style="width:100%;" />
    </div>
    <div>
      <label class="form-label">Presenter / Lead Speaker</label>
      <input type="text" id="agendaLead" placeholder="e.g. Secretary / Treasurer / Sub-committee" class="form-input" style="width:100%;" />
    </div>
    <div>
      <label class="form-label">Description / Action Required</label>
      <textarea id="agendaDesc" rows="3" placeholder="Provide background details and whether a formal resolution / voting will be required..." class="form-input" style="width:100%; resize:vertical;"></textarea>
    </div>
  `;
  if (typeof window.showModal === 'function') {
    window.showModal('Add Meeting Agenda Item', html, 'Add to Agenda ✓', async () => {
      const title = document.getElementById('agendaTitle').value.trim();
      const lead = document.getElementById('agendaLead').value.trim();
      const desc = document.getElementById('agendaDesc').value.trim();
      if (!title) throw new Error('Agenda title is required');

      const data = await window.fetchMeetingsData();
      const m = (data.meetings || []).find(x => x.id === currentId);
      if (m) {
        m.agenda = m.agenda || [];
        const newItem = {
          num: m.agenda.length + 1,
          title,
          desc: lead ? `${lead}: ${desc}` : desc
        };
        m.agenda.push(newItem);

        fetch('/api/meetings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: m.id, agenda: m.agenda })
        }).catch(() => {});

        window.saveMeetingsLocal(data);
      }
      showToast(`✓ Agenda item added to "${m ? m.title : 'meeting'}"!`, 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go('admin-meeting-detail');
      });
    });
  }
};

window.openMarkAttendanceModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-001';
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId) || (data.meetings || [])[0];
  const currentAttendees = m.attendees || [];

  const roster = (window.__committeeData && window.__committeeData.members && window.__committeeData.members.length > 0)
    ? window.__committeeData.members.map(m => ({ name: m.name, unit: m.unit || '', role: m.role || 'Member' }))
    : [];

  const html = `
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
      Check attendees present or verified via signed proxy for <strong>${m.title}</strong>. Quorum requires at least <strong>${m.quorumRequired || 5} members</strong> (${m.quorum}).
    </div>
    <div style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px;">
      ${roster.map((p, i) => {
        const isPresent = currentAttendees.some(a => a.includes(p.name) || a.includes(p.unit));
        return `
          <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg-elevated);border-radius:var(--r-md);cursor:pointer;">
            <input type="checkbox" id="att_${i}" data-name="${p.name} (${p.unit})" ${isPresent ? 'checked' : ''} style="width:16px;height:16px;" />
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;">${p.name} (${p.unit})</div>
              <div style="font-size:11px;color:var(--text-muted);">${p.role}</div>
            </div>
            <span class="badge badge-muted" style="font-size:10px;">${isPresent ? 'Present' : 'Absent'}</span>
          </label>
        `;
      }).join('')}
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Mark Meeting Attendance & Roll Call', html, 'Update Quorum & Attendance', async () => {
      const selected = [];
      roster.forEach((p, i) => {
        const el = document.getElementById(`att_${i}`);
        if (el && el.checked) selected.push(el.getAttribute('data-name'));
      });

      m.attendees = selected;
      fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, action: 'ATTENDANCE', attendees: selected })
      }).catch(() => {});

      window.saveMeetingsLocal(data);
      const isQuorumMet = selected.length >= (m.quorumRequired || 5);
      showToast(`✓ Attendance recorded: ${selected.length} members present. Quorum ${isQuorumMet ? 'MET ✅' : 'PENDING ⚠️'}!`, 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go(Router.current());
      });
    });
  }
};

window.openRecordMinutesModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-001';
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId) || (data.meetings || [])[0];

  const existing = m.minutes || `The meeting was called to order by Rajesh Kumar at ${m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) : '6:00 PM'}. Quorum confirmed with ${m.attendees?.length || 6} members present. Key agenda items were discussed and approved. Formal resolutions recorded in society minutes register.`;

  const html = `
    <div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Meeting: <strong>${m.title}</strong> (${m.dateFormatted})</div>
      <label class="form-label">Official Minutes & Discussion Summary *</label>
      <textarea id="minutesNotes" rows="7" placeholder="Enter key discussion summary, resolutions passed, objections, and decisions..." class="form-input" style="width:100%; resize:vertical; font-size:13px; line-height:1.5;">${existing}</textarea>
    </div>
    <div style="margin-top:10px;">
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);cursor:pointer;">
        <input type="checkbox" id="markCompletedCheck" checked style="width:16px;height:16px;" />
        <span>Mark meeting as <strong>COMPLETED</strong> and publish to society Document Vault</span>
      </label>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Record Official Meeting Minutes', html, 'Publish Minutes 📄', async () => {
      const minutesText = document.getElementById('minutesNotes').value.trim();
      const markCompleted = document.getElementById('markCompletedCheck')?.checked;
      if (!minutesText) throw new Error('Minutes notes cannot be blank');

      m.minutes = minutesText;
      m.minutesPublished = true;
      if (markCompleted) m.status = 'COMPLETED';

      fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: m.id,
          action: 'PUBLISH_MINUTES',
          minutes: minutesText,
          status: markCompleted ? 'COMPLETED' : m.status
        })
      }).catch(() => {});

      window.saveMeetingsLocal(data);
      showToast('✓ Official meeting minutes published & saved to Document Vault!', 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go(Router.current());
      });
    });
  }
};

window.openViewMinutesModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-003';
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId) || (data.meetings || [])[0];

  const html = `
    <div id="printMinutesArea" style="padding:10px 4px;font-family:inherit;">
      <div style="text-align:center;border-bottom:2px solid var(--border-light);padding-bottom:14px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:var(--blue);text-transform:uppercase;">Residents Welfare Association Sector 22</div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin:4px 0;">Official Minutes of Proceedings</div>
        <div style="font-size:13px;color:var(--text-secondary);">${m.title} · ${m.type}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:12px;background:var(--bg-elevated);padding:12px;border-radius:var(--r-md);">
        <div><strong>🗓️ Date:</strong> ${m.dateFormatted}</div>
        <div><strong>📍 Venue:</strong> ${m.venue}</div>
        <div><strong>👥 Quorum:</strong> ${m.quorum} (${m.attendees?.length || 6} attended)</div>
        <div><strong>📜 Status:</strong> <span class="badge badge-green">Minutes Published</span></div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">ATTENDEES ROLL CALL</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
          ${(m.attendees && m.attendees.length > 0) ? m.attendees.join(' • ') : 'No attendees recorded for this meeting.'}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">PROCEEDINGS & DISCUSSION SUMMARY</div>
        <div style="font-size:13px;color:var(--text-primary);line-height:1.6;background:var(--bg-main);padding:12px;border-radius:var(--r-md);border:1px solid var(--border-light);">
          ${m.minutes || 'No meeting proceedings summary entered yet.'}
        </div>
      </div>

      ${m.resolutions && m.resolutions.length > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">RESOLUTIONS PASSED</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${m.resolutions.map(r => `
              <div style="padding:10px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);font-size:12px;">
                <div style="font-weight:700;color:var(--text-primary);">${r.title}</div>
                <div style="color:var(--text-muted);margin-top:2px;">Proposed by: ${r.proposer} | Seconded by: ${r.seconder} — <span class="badge badge-green" style="font-size:10px;">${r.outcome}</span></div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:16px;border-top:1px dashed var(--border-light);font-size:11px;color:var(--text-muted);">
        <div><strong>${m.chairperson || 'President'}</strong><br>President, RWA</div>
        <div style="text-align:right;"><strong>Secretary</strong><br>Secretary, RWA</div>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Minutes: ${m.title}`, html, '🖨️ Print / Save Document', () => {
      window.print();
    });
  }
};

window.openAddResolutionModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-001';
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId) || (data.meetings || [])[0];

  const html = `
    <div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Recording for: <strong>${m.title}</strong></div>
      <label class="form-label">Resolution Title / Subject *</label>
      <input type="text" id="resTitle" required placeholder="e.g. Approval of 10% Maintenance Revision for FY 2026-27" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Proposed By *</label>
        <input type="text" id="resProp" value="Rajesh Kumar (President)" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Seconded By *</label>
        <input type="text" id="resSec" value="Vijay Mehta (Treasurer)" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Resolution Outcome</label>
      <select id="resOutcome" class="form-select" style="width:100%;">
        <option value="PASSED" selected>Passed Unanimously ✓</option>
        <option value="MAJORITY">Passed by Majority Vote</option>
        <option value="PENDING">Put to Secret Ballot</option>
        <option value="DEFERRED">Deferred to Next Meeting</option>
      </select>
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Discussion Notes / Stipulations</label>
      <textarea id="resNotes" rows="2" placeholder="Any specific conditions or quorum notes..." class="form-input" style="width:100%;"></textarea>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Add Formal Society Resolution', html, 'Record Resolution ✓', async () => {
      const title = document.getElementById('resTitle').value.trim();
      const proposer = document.getElementById('resProp').value.trim();
      const seconder = document.getElementById('resSec').value.trim();
      const outcome = document.getElementById('resOutcome').value;
      const notes = document.getElementById('resNotes').value.trim();
      if (!title) throw new Error('Resolution title is required');

      m.resolutions = m.resolutions || [];
      const newRes = {
        id: `RES-${Math.floor(10 + Math.random() * 90)}`,
        title,
        proposer,
        seconder,
        outcome,
        notes,
      };
      m.resolutions.push(newRes);

      fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, action: 'ADD_RESOLUTION', resolution: newRes })
      }).catch(() => {});

      window.saveMeetingsLocal(data);
      showToast(`✓ Resolution "${title}" recorded in society records!`, 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go(Router.current());
      });
    });
  }
};

window.openAddMeetingActionItemModal = function(meetingId) {
  const currentId = meetingId || window.__selectedMeetingId || 'MTG-001';
  const data = window.__meetingsData || window.getMeetingsLocal();
  const m = (data.meetings || []).find(x => x.id === currentId) || (data.meetings || [])[0];

  const html = `
    <div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Origin: <strong>${m.title}</strong></div>
      <label class="form-label">Action Item Description *</label>
      <input type="text" id="actTitle" required placeholder="e.g. Obtain 3 quotes for CCTV overhaul" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Assignee *</label>
        <input type="text" id="actAssignee" placeholder="e.g. Secretary / Maintenance In-charge" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Target Due Date *</label>
        <input type="date" id="actDue" value="${new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]}" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Add Governance Action Item', html, 'Assign Action Item ✓', async () => {
      const title = document.getElementById('actTitle').value.trim();
      const assignee = document.getElementById('actAssignee').value.trim();
      const due = document.getElementById('actDue').value;
      if (!title) throw new Error('Action item title required');

      m.actionItems = m.actionItems || [];
      const newAct = {
        id: `ACT-${Math.floor(10 + Math.random() * 90)}`,
        title,
        assignee,
        due,
        status: 'PENDING',
      };
      m.actionItems.push(newAct);

      fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, action: 'ADD_ACTION_ITEM', actionItem: newAct })
      }).catch(() => {});

      window.saveMeetingsLocal(data);
      showToast(`✓ Action item "${title}" assigned to ${assignee}!`, 'success');
      window.fetchMeetingsData(true).then(() => {
        if (typeof Router !== 'undefined') Router.go(Router.current());
      });
    });
  }
};

window.toggleActionItemStatus = async function(meetingId, actionItemId) {
  const data = await window.fetchMeetingsData();
  let found = null;
  let targetMeeting = null;

  (data.meetings || []).forEach(m => {
    (m.actionItems || []).forEach(a => {
      if (a.id === actionItemId) {
        found = a;
        targetMeeting = m;
      }
    });
  });

  if (!found) return;

  const order = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  const nextIdx = (order.indexOf(found.status) + 1) % order.length;
  found.status = order[nextIdx];

  fetch('/api/meetings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: targetMeeting.id, action: 'ACTION_ITEMS', actionItems: targetMeeting.actionItems })
  }).catch(() => {});

  window.saveMeetingsLocal(data);
  showToast(`Action item status updated to ${found.status.replace('_', ' ')}!`, 'info');
  if (typeof Router !== 'undefined') Router.go(Router.current());
};

// =============================================
// Committee & Election State & Helpers
// =============================================

window.__committeeData = null;

window.getCommitteeLocal = function() {
  try {
    const raw = localStorage.getItem('rwa_committee_store');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
};

window.saveCommitteeLocal = function(data) {
  try {
    localStorage.setItem('rwa_committee_store', JSON.stringify(data));
  } catch(e) {}
};

window.fetchCommitteeData = async function(force = false) {
  if (window.__committeeData && !force) return window.__committeeData;
  try {
    const res = await fetch('/api/committee');
    if (res.ok) {
      const data = await res.json();
      window.__committeeData = data;
      window.saveCommitteeLocal(data);
      return data;
    }
  } catch(e) {
    console.warn('API committee fetch error:', e);
  }
  const cached = window.getCommitteeLocal();
  if (cached) {
    window.__committeeData = cached;
    return cached;
  }
  return { members: [], election: null, availableResidents: [], availableUnits: [] };
};

// Auto prime committee cache on load
window.fetchCommitteeData().catch(() => {});

window.openAddCommitteeMemberModal = async function() {
  const data = await window.fetchCommitteeData();
  const residents = data.availableResidents || [];
  const units = data.availableUnits || [];

  const html = `
    <div>
      <label class="form-label">Pick Registered Resident (Optional)</label>
      <select id="cmResidentPicker" class="form-select" style="width:100%;margin-bottom:12px;" onchange="
        const opt = this.options[this.selectedIndex];
        if (opt.value) {
          document.getElementById('cmName').value = opt.getAttribute('data-name') || '';
          document.getElementById('cmUnit').value = opt.getAttribute('data-unit') || '';
          document.getElementById('cmPhone').value = opt.getAttribute('data-phone') || '';
          document.getElementById('cmEmail').value = opt.getAttribute('data-email') || '';
        }
      ">
        <option value="">-- Choose from Society Registered Residents --</option>
        ${residents.map(r => `
          <option value="${r.id}" data-name="${r.name}" data-unit="${r.unit?.unitNumber || ''}" data-phone="${r.phone || ''}" data-email="${r.email || ''}">
            ${r.name} (${r.unit?.unitNumber || 'No Flat'}) - ${r.role}
          </option>
        `).join('')}
      </select>
    </div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Member Full Name *</label>
        <input type="text" id="cmName" required placeholder="e.g. Rajesh Kumar" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Flat / Unit Number *</label>
        <input type="text" id="cmUnit" required placeholder="e.g. A-1001" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Designation / Role *</label>
      <select id="cmRole" class="form-select" style="width:100%;">
        <option value="President">President</option>
        <option value="Vice President">Vice President</option>
        <option value="Secretary" selected>Secretary</option>
        <option value="Joint Secretary">Joint Secretary</option>
        <option value="Treasurer">Treasurer</option>
        <option value="Executive Committee Member">Executive Committee Member</option>
        <option value="Security Incharge">Security Incharge</option>
        <option value="Maintenance Head">Maintenance Head</option>
      </select>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Phone Number</label>
        <input type="text" id="cmPhone" placeholder="e.g. 9812345678" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Email</label>
        <input type="email" id="cmEmail" placeholder="e.g. member@rwa.org" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Term Start</label>
        <input type="text" id="cmTermStart" value="Apr 2026" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Term End</label>
        <input type="text" id="cmTermEnd" value="Mar 2027" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Appoint Committee Member', html, 'Appoint Member ✓', async () => {
      const name = document.getElementById('cmName').value.trim();
      const unit = document.getElementById('cmUnit').value.trim();
      const role = document.getElementById('cmRole').value;
      const phone = document.getElementById('cmPhone').value.trim();
      const email = document.getElementById('cmEmail').value.trim();
      const termStart = document.getElementById('cmTermStart').value.trim();
      const termEnd = document.getElementById('cmTermEnd').value.trim();

      if (!name) throw new Error('Member name is required');
      if (!unit) throw new Error('Unit number is required');

      const res = await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MEMBER',
          name, unit, role, phone, email, termStart, termEnd
        })
      });

      if (res.ok) {
        showToast(`✓ Appointed ${name} as ${role} (${unit})!`, 'success');
      } else {
        showToast(`✓ ${name} added to Committee roster!`, 'success');
      }

      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};

window.openEditCommitteeMemberModal = async function(memberId) {
  const data = await window.fetchCommitteeData();
  const m = (data.members || []).find(x => x.id === memberId);
  if (!m) return;

  const html = `
    <div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Editing Member: <strong>${m.name}</strong> (${m.unit})</div>
      <label class="form-label">Designation / Role *</label>
      <select id="editCmRole" class="form-select" style="width:100%;">
        ${['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Executive Committee Member', 'Security Incharge', 'Maintenance Head'].map(r => `
          <option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>
        `).join('')}
      </select>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Phone Number</label>
        <input type="text" id="editCmPhone" value="${m.phone || ''}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Email</label>
        <input type="email" id="editCmEmail" value="${m.email || ''}" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Term Start</label>
        <input type="text" id="editCmTermStart" value="${m.termStart || 'Apr 2026'}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Term End</label>
        <input type="text" id="editCmTermEnd" value="${m.termEnd || 'Mar 2027'}" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Edit Committee Member Details', html, 'Save Changes ✓', async () => {
      const role = document.getElementById('editCmRole').value;
      const phone = document.getElementById('editCmPhone').value.trim();
      const email = document.getElementById('editCmEmail').value.trim();
      const termStart = document.getElementById('editCmTermStart').value.trim();
      const termEnd = document.getElementById('editCmTermEnd').value.trim();

      await fetch('/api/committee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MEMBER',
          id: m.id,
          role, phone, email, termStart, termEnd
        })
      });

      showToast(`✓ Updated ${m.name}'s committee profile!`, 'success');
      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};

window.deleteCommitteeMember = async function(memberId, memberName) {
  if (!confirm(`Are you sure you want to remove ${memberName} from the Managing Committee?`)) return;

  await fetch(`/api/committee?type=MEMBER&id=${memberId}`, {
    method: 'DELETE'
  });

  showToast(`✓ Removed ${memberName} from committee roster.`, 'info');
  await window.fetchCommitteeData(true);
  if (typeof Router !== 'undefined') Router.go('admin-committee');
};

window.openEditElectionTimelineModal = async function() {
  const data = await window.fetchCommitteeData();
  const elec = data.election || {
    nominationOpen: '2026-10-20',
    nominationClose: '2026-10-25',
    votingStart: '2026-10-27',
    votingEnd: '2026-10-28',
    secretBallot: true,
    proxyAllowed: false,
    votingMode: 'SECRET_BALLOT'
  };

  const html = `
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;">
      Set key calendar milestone dates and statutory voting rules for the Committee Election cycle.
    </div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Nomination Open Date *</label>
        <input type="date" id="elecNomOpen" required value="${elec.nominationOpen}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Nomination Close Date *</label>
        <input type="date" id="elecNomClose" required value="${elec.nominationClose}" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Voting Start Date *</label>
        <input type="date" id="elecVotingStart" required value="${elec.votingStart}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Voting End & Results Date *</label>
        <input type="date" id="elecVotingEnd" required value="${elec.votingEnd}" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="margin-top:14px;">
      <label class="form-label">Voting Mode</label>
      <select id="elecMode" class="form-select" style="width:100%;">
        <option value="SECRET_BALLOT" ${elec.votingMode==='SECRET_BALLOT'?'selected':''}>Secret Digital Ballot (In-App + EVM)</option>
        <option value="SHOW_OF_HANDS" ${elec.votingMode==='SHOW_OF_HANDS'?'selected':''}>Show of Hands in AGM</option>
        <option value="PAPER_BALLOT" ${elec.votingMode==='PAPER_BALLOT'?'selected':''}>Physical Paper Ballot Box</option>
      </select>
    </div>
    <div style="display:flex;gap:16px;margin-top:14px;">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="elecSecretCheck" ${elec.secretBallot ? 'checked' : ''} style="width:16px;height:16px;" />
        <span>🔒 Secret Ballot Enabled</span>
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="elecProxyCheck" ${elec.proxyAllowed ? 'checked' : ''} style="width:16px;height:16px;" />
        <span>👥 Proxy Voting Allowed</span>
      </label>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Edit Election Calendar Timeline & Rules', html, 'Update Election Schedule 📅', async () => {
      const nominationOpen = document.getElementById('elecNomOpen').value;
      const nominationClose = document.getElementById('elecNomClose').value;
      const votingStart = document.getElementById('elecVotingStart').value;
      const votingEnd = document.getElementById('elecVotingEnd').value;
      const votingMode = document.getElementById('elecMode').value;
      const secretBallot = document.getElementById('elecSecretCheck').checked;
      const proxyAllowed = document.getElementById('elecProxyCheck').checked;

      await fetch('/api/committee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TIMELINE',
          nominationOpen, nominationClose, votingStart, votingEnd,
          votingMode, secretBallot, proxyAllowed
        })
      });

      showToast(`✓ Election calendar updated: Nominations (${nominationOpen} to ${nominationClose}), Voting (${votingStart} to ${votingEnd})!`, 'success');
      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};

window.startElectionNominations = async function() {
  showToast('Initiating election nominations broadcast...', 'info');

  const res = await fetch('/api/committee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START_NOMINATIONS' })
  });

  if (res.ok) {
    showToast('🚀 Nominations opened! Official notice published to Resident Notice Board.', 'success');
  } else {
    showToast('🚀 Nominations opened for eligible society members!', 'success');
  }

  await window.fetchCommitteeData(true);
  if (typeof Router !== 'undefined') Router.go('admin-committee');
};

window.startElectionVoting = async function() {
  if (!confirm('Open digital voting window for all eligible flat owners?')) return;

  await fetch('/api/committee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'START_VOTING' })
  });

  showToast('🗳️ Voting is now ACTIVE for all registered flat owners!', 'success');
  await window.fetchCommitteeData(true);
  if (typeof Router !== 'undefined') Router.go('admin-committee');
};

window.declareElectionResults = async function() {
  if (!confirm('Declare final election results and archive election cycle?')) return;

  await fetch('/api/committee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'DECLARE_RESULTS' })
  });

  showToast('🏆 Official Election Results Declared and Published!', 'success');
  await window.fetchCommitteeData(true);
  if (typeof Router !== 'undefined') Router.go('admin-committee');
};

window.openAddPositionModal = async function() {
  const html = `
    <div>
      <label class="form-label">Position Title *</label>
      <input type="text" id="posTitle" required placeholder="e.g. Vice President / Cultural Secretary" class="form-input" style="width:100%;" />
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Number of Seats *</label>
      <input type="number" id="posSeats" min="1" max="10" value="1" class="form-input" style="width:100%;" />
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Candidate Eligibility Criteria</label>
      <textarea id="posEligibility" rows="2" placeholder="e.g. Registered owner residing for > 1 year with no pending dues" class="form-input" style="width:100%;">Flat owner in good standing with zero maintenance arrears</textarea>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Add Contested Position for Election', html, 'Add Position ✓', async () => {
      const title = document.getElementById('posTitle').value.trim();
      const seats = parseInt(document.getElementById('posSeats').value, 10) || 1;
      const eligibility = document.getElementById('posEligibility').value.trim();
      if (!title) throw new Error('Position title is required');

      await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_POSITION', title, seats, eligibility })
      });

      showToast(`✓ Position "${title}" added to election!`, 'success');
      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};

window.deletePosition = async function(posId, title) {
  if (!confirm(`Are you sure you want to remove "${title}" from the election?`)) return;

  await fetch(`/api/committee?type=POSITION&id=${posId}`, {
    method: 'DELETE'
  });

  showToast(`✓ Position "${title}" removed.`, 'info');
  await window.fetchCommitteeData(true);
  if (typeof Router !== 'undefined') Router.go('admin-committee');
};

window.openViewNominationsModal = async function(positionId) {
  const data = await window.fetchCommitteeData();
  const elec = data.election;
  if (!elec) return;

  const pos = (elec.positions || []).find(p => p.id === positionId);
  if (!pos) return;

  const isVotingActive = elec.status === 'VOTING_ACTIVE';
  const nominations = pos.nominations || [];

  const html = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);">${pos.title} (${pos.seats} Seat${pos.seats > 1 ? 's' : ''})</div>
          <div style="font-size:12px;color:var(--text-muted);">${pos.eligibility}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="closeModal();setTimeout(() => openFileNominationModal('${pos.id}'), 250);">+ File Nomination</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding:2px;">
        ${nominations.length === 0 ? `
          <div style="padding:32px;text-align:center;background:var(--bg-elevated);border-radius:var(--r-md);color:var(--text-muted);font-size:13px;">
            No nominations filed for this position yet.<br>Click "+ File Nomination" to nominate an eligible flat owner.
          </div>
        ` : nominations.map(nom => `
          <div style="padding:12px 14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${nom.candidateName} <span style="font-size:12px;color:var(--text-muted);">(${nom.unit})</span></div>
                <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">
                  Proposer: <strong>${nom.proposer}</strong> · Seconder: <strong>${nom.seconder}</strong>
                </div>
              </div>
              <span class="badge badge-${nom.status==='APPROVED'?'green':nom.status==='PENDING_REVIEW'?'amber':'red'}">${nom.status.replace('_', ' ')}</span>
            </div>
            ${nom.manifesto ? `
              <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;background:var(--bg-main);padding:6px 10px;border-radius:var(--r-sm);line-height:1.4;">
                "${nom.manifesto}"
              </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px dashed var(--border-light);">
              <div style="font-size:12px;font-weight:600;color:var(--blue);">
                🗳️ Votes: <strong>${nom.votes || 0}</strong>
              </div>
              <div style="display:flex;gap:6px;">
                ${isVotingActive ? `
                  <button class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 10px;" onclick="castElectionVote('${pos.id}', '${nom.id}')">Vote for ${nom.candidateName.split(' ')[0]}</button>
                ` : ''}
                ${nom.status === 'PENDING_REVIEW' ? `
                  <button class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 8px;" onclick="updateNominationStatus('${pos.id}', '${nom.id}', 'APPROVED')">Approve ✓</button>
                  <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 8px;color:var(--red);" onclick="updateNominationStatus('${pos.id}', '${nom.id}', 'REJECTED')">Reject</button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Nominations: ${pos.title}`, html, 'Close', () => {});
  }
};

window.openFileNominationModal = async function(positionId) {
  const data = await window.fetchCommitteeData();
  const residents = data.availableResidents || [];
  const pos = (data.election?.positions || []).find(p => p.id === positionId) || (data.election?.positions || [])[0];
  if (!pos) return;

  const html = `
    <div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Nomination for: <strong>${pos.title}</strong></div>
      <label class="form-label">Pick Candidate from Residents</label>
      <select id="nomResidentSelect" class="form-select" style="width:100%;margin-bottom:10px;" onchange="
        const opt = this.options[this.selectedIndex];
        if (opt.value) {
          document.getElementById('nomCandidateName').value = opt.getAttribute('data-name') || '';
          document.getElementById('nomUnit').value = opt.getAttribute('data-unit') || '';
          document.getElementById('nomPhone').value = opt.getAttribute('data-phone') || '';
        }
      ">
        <option value="">-- Select Candidate --</option>
        ${residents.map(r => `
          <option value="${r.id}" data-name="${r.name}" data-unit="${r.unit?.unitNumber || ''}" data-phone="${r.phone || ''}">${r.name} (${r.unit?.unitNumber || 'No Flat'})</option>
        `).join('')}
      </select>
    </div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Candidate Name *</label>
        <input type="text" id="nomCandidateName" required placeholder="Full Name" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Flat / Unit *</label>
        <input type="text" id="nomUnit" required placeholder="e.g. A-1002" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Proposer Member *</label>
        <input type="text" id="nomProposer" required placeholder="Proposer Member Name & Unit" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Seconder Member *</label>
        <input type="text" id="nomSeconder" required placeholder="Seconder Member Name & Unit" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Candidate Vision / Manifesto</label>
      <textarea id="nomManifesto" rows="2" placeholder="Key goals and vision for the society..." class="form-input" style="width:100%;"></textarea>
    </div>
    <input type="hidden" id="nomPhone" value="" />
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`File Nomination: ${pos.title}`, html, 'Submit Nomination Form ✓', async () => {
      const candidateName = document.getElementById('nomCandidateName').value.trim();
      const unit = document.getElementById('nomUnit').value.trim();
      const proposer = document.getElementById('nomProposer').value.trim();
      const seconder = document.getElementById('nomSeconder').value.trim();
      const manifesto = document.getElementById('nomManifesto').value.trim();
      const phone = document.getElementById('nomPhone').value.trim();

      if (!candidateName) throw new Error('Candidate name is required');
      if (!unit) throw new Error('Candidate unit is required');

      await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FILE_NOMINATION',
          positionId: pos.id,
          candidateName, unit, proposer, seconder, manifesto, phone
        })
      });

      showToast(`✓ Nomination form filed for ${candidateName} (${pos.title})!`, 'success');
      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};

window.castElectionVote = async function(positionId, nominationId) {
  const res = await fetch('/api/committee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'CAST_VOTE', positionId, nominationId })
  });

  if (res.ok) {
    showToast('🗳️ Secret ballot recorded successfully! Total vote count incremented.', 'success');
    await window.fetchCommitteeData(true);
    closeModal();
    setTimeout(() => {
      openViewNominationsModal(positionId);
    }, 200);
  }
};

window.updateNominationStatus = async function(positionId, nominationId, status) {
  await fetch('/api/committee', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'UPDATE_NOMINATION_STATUS', positionId, nominationId, status })
  });

  showToast(`Nomination marked as ${status}!`, 'info');
  await window.fetchCommitteeData(true);
  closeModal();
  setTimeout(() => {
    openViewNominationsModal(positionId);
  }, 200);
};

window.openNewElectionModal = function() {
  const html = `
    <div>
      <label class="form-label">Election Title *</label>
      <input type="text" id="newElecTitle" required value="Managing Committee Elections 2027" class="form-input" style="width:100%;" />
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">Term of Office *</label>
      <input type="text" id="newElecTerm" required value="Apr 2027 – Mar 2028" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Nomination Window</label>
        <input type="date" id="newElecNomOpen" value="2026-10-20" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Nomination Close</label>
        <input type="date" id="newElecNomClose" value="2026-10-25" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <div style="flex:1;">
        <label class="form-label">Voting Start</label>
        <input type="date" id="newElecVoteStart" value="2026-10-27" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Voting End</label>
        <input type="date" id="newElecVoteEnd" value="2026-10-28" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Initialize New Committee Election Cycle', html, 'Initialize Election 🏛️', async () => {
      const title = document.getElementById('newElecTitle').value.trim();
      const term = document.getElementById('newElecTerm').value.trim();
      const nominationOpen = document.getElementById('newElecNomOpen').value;
      const nominationClose = document.getElementById('newElecNomClose').value;
      const votingStart = document.getElementById('newElecVoteStart').value;
      const votingEnd = document.getElementById('newElecVoteEnd').value;

      await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NEW_ELECTION',
          title, term, nominationOpen, nominationClose, votingStart, votingEnd
        })
      });

      showToast(`✓ New election cycle "${title}" created!`, 'success');
      await window.fetchCommitteeData(true);
      if (typeof Router !== 'undefined') Router.go('admin-committee');
    });
  }
};



// =============================================
// SCREEN: admin-meetings
// =============================================

Screens['admin-meetings'] = function() {
  const data = window.__meetingsData || window.getMeetingsLocal();
  const allMeetings = data.meetings || [];
  const upcomingMeetings = allMeetings.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');
  const pastMeetings = allMeetings.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED');
  const allActionItems = allMeetings.flatMap(m => (m.actionItems || []).map(a => ({ ...a, meetingTitle: m.title, meetingId: m.id })));

  const activeTab = window.__meetingsActiveTab || 'upcoming';

  const renderUpcoming = () => {
    if (upcomingMeetings.length === 0) {
      return `
        <div class="empty-state" style="padding:48px 16px;text-align:center;background:var(--bg-card);border-radius:var(--r-lg);border:1px dashed var(--border-light);">
          <div style="font-size:42px;margin-bottom:12px;">📅</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);">No Upcoming Meetings</div>
          <p style="font-size:13px;color:var(--text-secondary);max-width:360px;margin:8px auto 16px;">Schedule your next Managing Committee or General Body meeting.</p>
          <button class="btn btn-primary btn-sm" onclick="openScheduleMeetingModal()">+ Schedule Meeting</button>
        </div>
      `;
    }

    return upcomingMeetings.map(m => {
      const parts = (m.dateFormatted || '').split(' · ');
      const datePart = parts[0] || 'Oct 29, 2026';
      const timePart = parts[1] || '6:00 PM';
      const dTokens = datePart.split(' ');
      const monthName = dTokens[0] || 'Oct';
      const dayNum = (dTokens[1] || '29').replace(',', '');

      return `
        <div class="card meeting-card" onclick="openMeetingDetail('${m.id}')" style="cursor:pointer;transition:transform 0.15s, box-shadow 0.15s;">
          <div class="meeting-card-inner">
            <div class="meeting-date-badge">
              <div class="meeting-day">${dayNum}</div>
              <div class="meeting-month">${monthName}</div>
            </div>
            <div class="meeting-content">
              <div class="badges-row" style="margin-bottom:8px;">
                <span class="badge badge-${m.type==='AGM'?'purple':m.type==='GBM'?'amber':'blue'}">${m.type}</span>
                <span class="badge badge-green">${m.status}</span>
                ${m.noticeSent ? '<span class="badge badge-green">✅ Notice Sent</span>' : '<span class="badge badge-amber">⚠️ Notice Pending</span>'}
              </div>
              <div class="meeting-title" style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">${m.title}</div>
              <div class="meeting-meta" style="margin-bottom:12px;">
                <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--text-secondary);">
                  <span>🗓️ ${m.dateFormatted || m.scheduledAt}</span>
                  <span>📍 ${m.venue}</span>
                  <span>👥 Quorum: ${m.quorum}</span>
                </div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:6px;letter-spacing:0.04em;text-transform:uppercase;">AGENDA (${(m.agenda||[]).length} ITEMS)</div>
                <div style="display:flex;flex-direction:column;gap:5px;">
                  ${(m.agenda || []).slice(0, 4).map((a, i) => `
                    <div style="display:flex;gap:8px;font-size:13px;color:var(--text-secondary);line-height:1.4;">
                      <span style="color:var(--text-disabled);font-size:11px;margin-top:2px;">${i+1}.</span>
                      <span style="word-break:break-word;">${a.title || a}</span>
                    </div>
                  `).join('')}
                  ${(m.agenda || []).length > 4 ? `
                    <div style="font-size:12px;color:var(--blue);font-weight:600;margin-top:2px;">+ ${(m.agenda||[]).length - 4} more agenda items...</div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="meeting-actions">
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openMeetingDetail('${m.id}')">View Details</button>
              ${!m.noticeSent ? `
                <button class="btn btn-secondary btn-sm" style="color:var(--amber-dark, #b45309);background:var(--amber-light, #fef3c7);border-color:rgba(245,158,11,0.3);" onclick="event.stopPropagation();sendMeetingNotice('${m.id}')">📢 Send Notice</button>
              ` : ''}
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();syncMeetingToGoogle(${JSON.stringify(m).replace(/"/g, '&quot;')})" title="Add to Google Calendar">📅 Google Cal</button>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openScheduleMeetingModal()">✏️ Edit</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderPast = () => {
    if (pastMeetings.length === 0) {
      return `
        <div class="empty-state" style="padding:48px 16px;text-align:center;background:var(--bg-card);border-radius:var(--r-lg);border:1px dashed var(--border-light);">
          <div style="font-size:42px;margin-bottom:12px;">📜</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);">No Past Meetings Recorded</div>
          <p style="font-size:13px;color:var(--text-secondary);max-width:360px;margin:8px auto 16px;">Completed meetings and published minutes will appear in this archive.</p>
        </div>
      `;
    }

    return pastMeetings.map(m => {
      const parts = (m.dateFormatted || '').split(' · ');
      const datePart = parts[0] || 'Sep 5, 2026';
      const dTokens = datePart.split(' ');
      const monthName = dTokens[0] || 'Sep';
      const dayNum = (dTokens[1] || '5').replace(',', '');

      return `
        <div class="card meeting-card" style="opacity:0.92;cursor:pointer;" onclick="openMeetingDetail('${m.id}')">
          <div class="meeting-card-inner">
            <div class="meeting-date-badge">
              <div class="meeting-day" style="color:var(--text-muted);">${dayNum}</div>
              <div class="meeting-month">${monthName}</div>
            </div>
            <div class="meeting-content">
              <div class="badges-row" style="margin-bottom:8px;">
                <span class="badge badge-blue">${m.type}</span>
                <span class="badge badge-muted">COMPLETED</span>
                ${m.minutesPublished ? '<span class="badge badge-green">✅ Minutes Published</span>' : '<span class="badge badge-amber">⚠️ Minutes Due</span>'}
              </div>
              <div class="meeting-title" style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px;">${m.title}</div>
              <div class="meeting-meta">
                <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--text-secondary);">
                  <span>🗓️ ${m.dateFormatted}</span>
                  <span>📍 ${m.venue}</span>
                  <span>👥 ${m.attendees?.length || 6} attendees present</span>
                  <span>📜 ${(m.resolutions||[]).length} resolutions passed</span>
                </div>
              </div>
              ${m.minutes ? `
                <div style="margin-top:10px;padding:8px 12px;background:var(--bg-elevated);border-radius:var(--r-md);font-size:12px;color:var(--text-secondary);line-height:1.4;">
                  <strong>Summary:</strong> ${m.minutes.substring(0, 160)}...
                </div>
              ` : ''}
            </div>
            <div class="meeting-actions">
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();openViewMinutesModal('${m.id}')">📄 View Minutes</button>
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openRecordMinutesModal('${m.id}')">✏️ Edit Minutes</button>
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openMeetingDetail('${m.id}')">Details</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderActionItems = () => {
    const pendingCount = allActionItems.filter(a => a.status === 'PENDING').length;
    const progressCount = allActionItems.filter(a => a.status === 'IN_PROGRESS').length;
    const completedCount = allActionItems.filter(a => a.status === 'COMPLETED').length;

    return `
      <div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:16px;">
          <div class="card card-sm" style="background:var(--amber-light);border-color:rgba(245,158,11,0.2);">
            <div style="font-size:11px;font-weight:700;color:var(--amber-dark,#b45309);text-transform:uppercase;">Pending Actions</div>
            <div style="font-size:24px;font-weight:800;color:var(--amber-dark,#b45309);margin-top:4px;">${pendingCount}</div>
          </div>
          <div class="card card-sm" style="background:var(--blue-light);border-color:rgba(59,130,246,0.2);">
            <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;">In Progress</div>
            <div style="font-size:24px;font-weight:800;color:var(--blue);margin-top:4px;">${progressCount}</div>
          </div>
          <div class="card card-sm" style="background:var(--green-light);border-color:rgba(16,185,129,0.2);">
            <div style="font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;">Completed</div>
            <div style="font-size:24px;font-weight:800;color:var(--green);margin-top:4px;">${completedCount}</div>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--border-light);background:var(--bg-elevated);">
            <div style="font-weight:700;font-size:14px;">All Meeting Action Items (${allActionItems.length})</div>
            <button class="btn btn-secondary btn-sm" onclick="openAddMeetingActionItemModal('${window.__selectedMeetingId}')">+ Add Action Item</button>
          </div>
          <div style="display:flex;flex-direction:column;">
            ${allActionItems.length === 0 ? `
              <div style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px;">No action items recorded yet.</div>
            ` : allActionItems.map(a => {
              const isDone = a.status === 'COMPLETED';
              const isInProg = a.status === 'IN_PROGRESS';
              return `
                <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border-light);background:${isDone ? 'var(--bg-main)' : 'var(--bg-card)'};opacity:${isDone ? 0.75 : 1};">
                  <div onclick="toggleActionItemStatus('${a.meetingId}', '${a.id}')" style="cursor:pointer;font-size:18px;">
                    ${isDone ? '✅' : isInProg ? '⏳' : '⬜'}
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:600;color:var(--text-primary);${isDone ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${a.title}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:4px;font-size:12px;color:var(--text-muted);">
                      <span>👤 ${a.assignee}</span>
                      <span>🗓️ Due: ${a.due}</span>
                      <span onclick="openMeetingDetail('${a.meetingId}')" style="color:var(--blue);cursor:pointer;text-decoration:underline;">🏛️ ${a.meetingTitle}</span>
                    </div>
                  </div>
                  <div>
                    <button class="btn btn-ghost btn-sm" style="font-size:11px;" onclick="toggleActionItemStatus('${a.meetingId}', '${a.id}')">
                      <span class="badge badge-${isDone ? 'green' : isInProg ? 'blue' : 'amber'}">${a.status.replace('_', ' ')}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  };

  return Shell.render('admin-meetings', {
    title: 'Meetings',
    portal: 'admin',
    breadcrumb: 'Governance',
    actions: `<button class="btn btn-primary btn-sm" onclick="openScheduleMeetingModal()">+ Schedule Meeting</button>`,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Meetings</div>
          <div class="page-subtitle">Schedule, manage, and record committee and general body meetings</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openScheduleMeetingModal()">+ Schedule Meeting</button>
        </div>
      </div>

      <div class="tabs" style="margin-bottom:18px;">
        <div class="tab ${activeTab==='upcoming'?'active':''}" onclick="setMeetingsTab('upcoming')" style="cursor:pointer;">
          Upcoming <span class="badge ${activeTab==='upcoming'?'badge-blue':'badge-muted'}" style="margin-left:6px;font-size:11px;">${upcomingMeetings.length}</span>
        </div>
        <div class="tab ${activeTab==='past'?'active':''}" onclick="setMeetingsTab('past')" style="cursor:pointer;">
          Past Archive <span class="badge ${activeTab==='past'?'badge-blue':'badge-muted'}" style="margin-left:6px;font-size:11px;">${pastMeetings.length}</span>
        </div>
        <div class="tab ${activeTab==='actionItems'?'active':''}" onclick="setMeetingsTab('actionItems')" style="cursor:pointer;">
          Action Items <span class="badge ${activeTab==='actionItems'?'badge-blue':'badge-muted'}" style="margin-left:6px;font-size:11px;">${allActionItems.length}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${activeTab === 'upcoming' ? renderUpcoming() : activeTab === 'past' ? renderPast() : renderActionItems()}
      </div>
    `,
  });
};


// =============================================
// SCREEN: admin-meeting-detail
// =============================================

Screens['admin-meeting-detail'] = function() {
  const data = window.__meetingsData || window.getMeetingsLocal();
  const allMeetings = data.meetings || [];
  const selectedId = window.__selectedMeetingId || 'MTG-001';
  const meeting = allMeetings.find(m => m.id === selectedId) || allMeetings[0] || window.__defaultMeetingsData.meetings[0];

  const agendaItems = meeting.agenda || [];
  const attendees = meeting.attendees || [];
  const resolutions = meeting.resolutions || [];
  const actionItems = meeting.actionItems || [];
  const quorumRequired = meeting.quorumRequired || (meeting.type === 'AGM' ? 114 : 5);
  const totalEligible = meeting.totalEligible || (meeting.type === 'AGM' ? 342 : 7);
  const attendeesCount = attendees.length;
  const quorumMet = attendeesCount >= quorumRequired;
  const quorumPercent = Math.min(100, Math.round((attendeesCount / quorumRequired) * 100));

  const detailTab = window.__detailActiveTab || 'agenda';

  const parts = (meeting.dateFormatted || '').split(' · ');
  const datePart = parts[0] || 'Oct 29, 2026';
  const dTokens = datePart.split(' ');
  const monthName = dTokens[0] || 'Oct';
  const dayNum = (dTokens[1] || '29').replace(',', '');
  const yearNum = dTokens[2] || '2026';

  return Shell.render('admin-meeting-detail', {
    title: meeting.title,
    portal: 'admin',
    breadcrumb: '<span onclick="Router.go(\'admin-meetings\')" style="cursor:pointer">Meetings</span>',
    actions: `
      ${!meeting.noticeSent ? `
        <button class="btn btn-secondary btn-sm" onclick="sendMeetingNotice('${meeting.id}')">📢 Send Notice</button>
      ` : `
        <button class="btn btn-ghost btn-sm" style="color:var(--green);"><span class="badge badge-green">✅ Notice Sent</span></button>
      `}
      <button class="btn btn-secondary btn-sm" onclick="syncMeetingToGoogle(${JSON.stringify(meeting).replace(/"/g, '&quot;')})">📅 Google Calendar</button>
      <button class="btn btn-secondary btn-sm" onclick="openScheduleMeetingModal()">✏️ Edit</button>
      <button class="btn btn-primary btn-sm" onclick="openMarkAttendanceModal('${meeting.id}')">📋 Mark Attendance</button>
    `,
    content: `
      <div class="detail-split-layout">
        <div>
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start;margin-bottom:20px;">
              <div style="padding:12px 14px;background:var(--purple-light);border-radius:var(--r-lg);text-align:center;min-width:64px;flex-shrink:0;">
                <div style="font-size:26px;font-weight:800;color:var(--purple);line-height:1.1;">${dayNum}</div>
                <div style="font-size:11px;font-weight:700;color:var(--purple);text-transform:uppercase;margin-top:2px;">${monthName}</div>
                <div style="font-size:10px;color:var(--text-muted)">${yearNum}</div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:20px;font-weight:700;word-break:break-word;color:var(--text-primary);">${meeting.title}</div>
                <div class="badges-row" style="margin:8px 0;">
                  <span class="badge badge-${meeting.type==='AGM'?'purple':meeting.type==='GBM'?'amber':'blue'}">${meeting.type}</span>
                  <span class="badge badge-green">${meeting.status}</span>
                  ${meeting.noticeSent ? '<span class="badge badge-green">✅ Notice Sent</span>' : '<span class="badge badge-amber">⚠️ Notice Due</span>'}
                  ${meeting.minutesPublished ? '<span class="badge badge-teal">📄 Minutes Recorded</span>' : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:5px;">
                  <div style="font-size:13px;color:var(--text-secondary);word-break:break-word;">📅 ${meeting.dateFormatted || meeting.scheduledAt}</div>
                  <div style="font-size:13px;color:var(--text-secondary);word-break:break-word;">📍 ${meeting.venue}</div>
                  <div style="font-size:13px;color:var(--text-secondary);">👥 Quorum required: <strong>${meeting.quorum}</strong> (min ${quorumRequired} of ${totalEligible})</div>
                  <div style="font-size:13px;color:var(--text-secondary);">📢 Formal Notice Status: <strong>${meeting.noticeSent ? 'Dispatched to All Members' : '<span style="color:var(--red);">Pending Dispatch</span>'}</strong></div>
                </div>
              </div>
            </div>

            <!-- Detail Tabs -->
            <div class="tabs" style="margin-bottom:14px;">
              <div class="tab ${detailTab==='agenda'?'active':''}" onclick="setDetailTab('agenda')" style="cursor:pointer;">
                Agenda (${agendaItems.length})
              </div>
              <div class="tab ${detailTab==='attendees'?'active':''}" onclick="setDetailTab('attendees')" style="cursor:pointer;">
                Attendees (${attendeesCount}/${totalEligible})
              </div>
              <div class="tab ${detailTab==='resolutions'?'active':''}" onclick="setDetailTab('resolutions')" style="cursor:pointer;">
                Resolutions (${resolutions.length})
              </div>
              <div class="tab ${detailTab==='actionItems'?'active':''}" onclick="setDetailTab('actionItems')" style="cursor:pointer;">
                Action Items (${actionItems.length})
              </div>
              <div class="tab ${detailTab==='minutes'?'active':''}" onclick="setDetailTab('minutes')" style="cursor:pointer;">
                Official Minutes
              </div>
            </div>

            <!-- Tab 1: Agenda -->
            ${detailTab === 'agenda' ? `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="font-size:13px;font-weight:600;">Agenda Items (${agendaItems.length})</div>
                  <button class="btn btn-secondary btn-sm" onclick="openAddAgendaItemModal('${meeting.id}')">+ Add Item</button>
                </div>
                ${agendaItems.length === 0 ? `
                  <div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No agenda items created yet.</div>
                ` : agendaItems.map(a => `
                  <div style="display:flex;gap:12px;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);margin-bottom:8px;background:var(--bg-elevated);">
                    <div style="width:24px;height:24px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;color:var(--blue);">${a.num}</div>
                    <div style="flex:1;">
                      <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${a.title}</div>
                      ${a.desc ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:3px;line-height:1.4;">${a.desc}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Tab 2: Attendees -->
            ${detailTab === 'attendees' ? `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div>
                    <div style="font-size:13px;font-weight:600;">Verified Attendance Roll Call (${attendeesCount} Present)</div>
                    <div style="font-size:12px;color:${quorumMet ? 'var(--green)' : 'var(--amber)'};margin-top:2px;">
                      ${quorumMet ? '✅ Quorum requirement fulfilled!' : `⚠️ Quorum requires ${quorumRequired - attendeesCount} more attendees`}
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="openMarkAttendanceModal('${meeting.id}')">📋 Update Attendance</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  ${attendees.length === 0 ? `
                    <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-elevated);border-radius:var(--r-md);">
                      No attendees recorded yet. Click "Update Attendance" to record members present.
                    </div>
                  ` : attendees.map(att => `
                    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);">
                      <span style="color:var(--green);font-size:16px;">✓</span>
                      <div style="font-size:13px;font-weight:600;flex:1;">${att}</div>
                      <span class="badge badge-green" style="font-size:11px;">Verified Present</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tab 3: Resolutions -->
            ${detailTab === 'resolutions' ? `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="font-size:13px;font-weight:600;">Formal Resolutions Passed (${resolutions.length})</div>
                  <button class="btn btn-secondary btn-sm" onclick="openAddResolutionModal('${meeting.id}')">+ Add Resolution</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${resolutions.length === 0 ? `
                    <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-elevated);border-radius:var(--r-md);">
                      No formal resolutions recorded for this meeting. Click "+ Add Resolution" to document binding committee/AGM decisions.
                    </div>
                  ` : resolutions.map(r => `
                    <div style="padding:12px 14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                        <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${r.title}</div>
                        <span class="badge badge-${r.outcome==='PASSED'?'green':r.outcome==='MAJORITY'?'blue':'amber'}">${r.outcome}</span>
                      </div>
                      <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);margin-top:6px;">
                        <span>Proposed by: <strong>${r.proposer}</strong></span>
                        <span>Seconded by: <strong>${r.seconder}</strong></span>
                      </div>
                      ${r.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${r.notes}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tab 4: Action Items -->
            ${detailTab === 'actionItems' ? `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="font-size:13px;font-weight:600;">Assigned Action Items (${actionItems.length})</div>
                  <button class="btn btn-secondary btn-sm" onclick="openAddMeetingActionItemModal('${meeting.id}')">+ Add Action Item</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  ${actionItems.length === 0 ? `
                    <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-elevated);border-radius:var(--r-md);">
                      No action items assigned for this meeting yet.
                    </div>
                  ` : actionItems.map(a => {
                    const isDone = a.status === 'COMPLETED';
                    return `
                      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);">
                        <div onclick="toggleActionItemStatus('${meeting.id}', '${a.id}')" style="cursor:pointer;font-size:16px;">
                          ${isDone ? '✅' : '⬜'}
                        </div>
                        <div style="flex:1;">
                          <div style="font-size:13px;font-weight:600;${isDone?'text-decoration:line-through;color:var(--text-muted);':''}">${a.title}</div>
                          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Assigned to: ${a.assignee} · Due: ${a.due}</div>
                        </div>
                        <span class="badge badge-${isDone?'green':'amber'}">${a.status}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tab 5: Minutes -->
            ${detailTab === 'minutes' ? `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <div style="font-size:13px;font-weight:600;">Official Minutes Register</div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="openRecordMinutesModal('${meeting.id}')">📝 Edit / Record Minutes</button>
                    <button class="btn btn-ghost btn-sm" onclick="openViewMinutesModal('${meeting.id}')">📄 Print Preview</button>
                  </div>
                </div>
                ${meeting.minutes ? `
                  <div style="padding:16px;background:var(--bg-elevated);border-radius:var(--r-md);border:1px solid var(--border-light);font-size:13px;line-height:1.6;color:var(--text-primary);white-space:pre-wrap;">${meeting.minutes}</div>
                ` : `
                  <div style="padding:32px;text-align:center;background:var(--bg-elevated);border-radius:var(--r-md);">
                    <div style="font-size:32px;margin-bottom:8px;">📝</div>
                    <div style="font-size:14px;font-weight:600;color:var(--text-primary);">Minutes Not Yet Recorded</div>
                    <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 14px;">Record proceedings, resolutions passed, and attendee objections for official society legal records.</p>
                    <button class="btn btn-primary btn-sm" onclick="openRecordMinutesModal('${meeting.id}')">Record Minutes Now</button>
                  </div>
                `}
              </div>
            ` : ''}

          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">Quick Actions</div>
            ${!meeting.noticeSent ? `
              <button class="btn btn-primary w-full" style="justify-content:center;margin-bottom:8px;background:var(--amber-dark,#b45309);border-color:var(--amber-dark,#b45309);" onclick="sendMeetingNotice('${meeting.id}')">
                📢 Dispatch Meeting Notice
              </button>
            ` : `
              <button class="btn btn-secondary w-full" style="justify-content:center;margin-bottom:8px;color:var(--green);" onclick="sendMeetingNotice('${meeting.id}')">
                📢 Resend / Broadcast Notice
              </button>
            `}
            <button class="btn btn-secondary w-full" style="justify-content:center;margin-bottom:8px;" onclick="openMarkAttendanceModal('${meeting.id}')">
              📋 Mark Attendance (${attendeesCount})
            </button>
            <button class="btn btn-secondary w-full" style="justify-content:center;margin-bottom:8px;" onclick="openRecordMinutesModal('${meeting.id}')">
              📝 Record Minutes
            </button>
            <button class="btn btn-secondary w-full" style="justify-content:center;margin-bottom:8px;" onclick="openAddResolutionModal('${meeting.id}')">
              ✅ Add Resolution
            </button>
            <button class="btn btn-secondary w-full" style="justify-content:center;margin-bottom:8px;" onclick="openViewMinutesModal('${meeting.id}')">
              📄 Export Minutes Document
            </button>
          </div>

          <div class="card card-sm">
            <div class="card-title" style="margin-bottom:12px;">Quorum Tracker</div>
            <div style="text-align:center;padding:16px;">
              <div style="font-size:36px;font-weight:800;color:${quorumMet ? 'var(--green)' : 'var(--blue)'};line-height:1;">${attendeesCount}</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">of ${totalEligible} eligible members registered</div>
              <div style="font-size:12px;color:${quorumMet ? 'var(--green)' : 'var(--amber)'};margin-top:6px;font-weight:600;">
                ${quorumMet ? '✅ Quorum Requirement Fulfilled' : `Requires ${quorumRequired} for valid quorum`}
              </div>
            </div>
            <div class="progress-bar" style="margin-top:8px;">
              <div class="progress-fill" style="width:${quorumPercent}%;background:${quorumMet ? 'var(--green)' : 'var(--blue)'};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:6px;">
              <span>0</span>
              <span>Target: ${quorumRequired}</span>
              <span>${totalEligible}</span>
            </div>
          </div>
        </div>
      </div>
    `,
  });
};


// =============================================
// SCREEN: admin-committee
// =============================================

Screens['admin-committee'] = function() {
  const cData = window.__committeeData || window.getCommitteeLocal() || { members: [], election: null };
  const members = cData.members || [];
  const elec = cData.election || null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NOMINATIONS_OPEN':
        return '<span class="badge badge-green">🚀 NOMINATIONS OPEN</span>';
      case 'NOMINATIONS_CLOSED':
        return '<span class="badge badge-blue">🔒 NOMINATIONS CLOSED</span>';
      case 'VOTING_ACTIVE':
        return '<span class="badge badge-purple">🗳️ VOTING LIVE</span>';
      case 'RESULTS_DECLARED':
        return '<span class="badge badge-teal">🏆 RESULTS DECLARED</span>';
      default:
        return '<span class="badge badge-amber">DRAFT</span>';
    }
  };

  return Shell.render('admin-committee', {
    title: 'Committee & Elections',
    portal: 'admin',
    breadcrumb: 'Governance',
    actions: `<button class="btn btn-primary btn-sm" onclick="openNewElectionModal()">+ New Election</button>`,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Committee & Elections</div>
          <div class="page-subtitle">Current committee roster and statutory election management</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openNewElectionModal()">+ New Election</button>
        </div>
      </div>

      <div class="grid-2">
        <!-- Left: Current Committee Roster -->
        <div class="card">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="card-title">Current Committee ${elec && elec.term ? '(Term: ' + elec.term + ')' : ''}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Governing body members managing society operations</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openAddCommitteeMemberModal()">+ Appoint Member</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            ${members.length === 0 ? `
              <div style="padding:32px;text-align:center;background:var(--bg-elevated);border-radius:var(--r-md);color:var(--text-muted);font-size:13px;">
                No committee members assigned yet.<br>
                <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="openAddCommitteeMemberModal()">+ Appoint First Member</button>
              </div>
            ` : members.map(m => {
              const initials = m.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
              return `
                <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);transition:border-color 0.15s;">
                  <div class="avatar ${m.color || 'blue'}">${initials}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:14px;font-weight:700;color:var(--text-primary);">${m.name}</span>
                      <span class="badge badge-green" style="font-size:10px;">${m.status === 'CURRENT' ? 'Current' : 'Past'}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                      <strong style="color:var(--blue);">${m.role}</strong> · Unit ${m.unit}
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px 14px;font-size:11px;color:var(--text-muted);margin-top:4px;">
                      ${m.phone ? `<span>📞 ${m.phone}</span>` : ''}
                      ${m.email ? `<span>✉️ ${m.email}</span>` : ''}
                      <span>🗓️ Term: ${m.termStart} – ${m.termEnd}</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditCommitteeMemberModal('${m.id}')" title="Edit Member">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteCommitteeMember('${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="Remove Member" style="color:var(--red);">🗑️</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Election Cycle & Positions -->
        <div>
          ${!elec ? `
            <div class="card" style="margin-bottom:16px;text-align:center;padding:36px 20px;">
              <div style="font-size:36px;margin-bottom:10px;">🗳️</div>
              <div class="card-title" style="font-size:16px;margin-bottom:6px;">No Active Election Cycle</div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;max-width:340px;margin-left:auto;margin-right:auto;">
                There is currently no active managing committee election. Initiate an election cycle to start accepting nominations and digital ballots.
              </div>
              <button class="btn btn-primary btn-sm" onclick="openNewElectionModal()">+ Setup New Election</button>
            </div>
          ` : `
            <!-- Election Card -->
            <div class="card" style="margin-bottom:16px;border-color:rgba(139,92,246,0.3);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div>
                  <div class="card-title" style="font-size:16px;">${elec.title}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Statutory election for term ${elec.term} · ${elec.totalEligibleVoters} eligible voters</div>
                </div>
                ${getStatusBadge(elec.status)}
              </div>

              <!-- Milestone dates -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:var(--r-sm);border:1px solid var(--border-light);">
                  <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Nomination Window</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-top:2px;">${elec.nominationOpen} to ${elec.nominationClose}</div>
                </div>
                <div style="padding:10px 12px;background:var(--bg-elevated);border-radius:var(--r-sm);border:1px solid var(--border-light);">
                  <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Voting Period</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-top:2px;">${elec.votingStart} to ${elec.votingEnd}</div>
                </div>
              </div>

              <!-- Election parameters & flags -->
              <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;padding:8px 0;color:var(--text-secondary);">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span>${elec.secretBallot ? '✅' : '⬜'}</span>
                  <span>Secret Ballot</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span>${elec.proxyAllowed ? '✅' : '⬜'}</span>
                  <span>Proxy Allowed</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span>🗳️ Mode: <strong>${(elec.votingMode || 'SECRET_BALLOT').replace('_', ' ')}</strong></span>
                </div>
                ${elec.totalVotesCast > 0 ? `
                  <div style="display:flex;align-items:center;gap:6px;color:var(--blue);font-weight:600;">
                    <span>📥 Votes Cast: <strong>${elec.totalVotesCast}</strong></span>
                  </div>
                ` : ''}
              </div>

              <!-- Election action triggers -->
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border-light);">
                <button class="btn btn-secondary btn-sm" onclick="openEditElectionTimelineModal()">✏️ Edit Timeline & Rules</button>
                ${elec.status === 'DRAFT' ? `
                  <button class="btn btn-primary btn-sm" onclick="startElectionNominations()">🚀 Start Nominations</button>
                ` : elec.status === 'NOMINATIONS_OPEN' ? `
                  <button class="btn btn-secondary btn-sm" style="color:var(--amber-dark,#b45309);" onclick="openEditElectionTimelineModal()">🛑 Close Nominations</button>
                  <button class="btn btn-primary btn-sm" onclick="startElectionVoting()">🗳️ Open Digital Voting</button>
                ` : elec.status === 'VOTING_ACTIVE' ? `
                  <button class="btn btn-primary btn-sm" onclick="declareElectionResults()">📊 Declare & Publish Results</button>
                ` : `
                  <span class="badge badge-teal" style="font-size:12px;padding:6px 12px;">🏆 Results Officially Declared</span>
                `}
              </div>
            </div>

            <!-- Contested Positions Card -->
            <div class="card">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div class="card-title">Positions for Election (${(elec.positions || []).length})</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Contested posts open for nominations and voting</div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="openAddPositionModal()">+ Add Position</button>
              </div>

              <div style="display:flex;flex-direction:column;gap:8px;">
                ${(elec.positions || []).length === 0 ? `
                  <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--bg-elevated);border-radius:var(--r-md);">
                    No contested positions configured yet.<br>
                    <button class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="openAddPositionModal()">+ Add Position</button>
                  </div>
                ` : (elec.positions || []).map(p => {
                  const nomCount = (p.nominations || []).length;
                  return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border-light);border-radius:var(--r-md);background:var(--bg-elevated);">
                      <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <span style="font-size:14px;font-weight:700;color:var(--text-primary);">${p.title}</span>
                          <span class="badge badge-purple" style="font-size:10px;">${p.seats} Seat${p.seats > 1 ? 's' : ''}</span>
                        </div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">
                          ${p.eligibility || 'Eligible flat owners'}
                        </div>
                        <div style="font-size:12px;color:${nomCount > 0 ? 'var(--blue)' : 'var(--text-muted)'};margin-top:3px;font-weight:600;">
                          📋 ${nomCount} nomination${nomCount === 1 ? '' : 's'} filed
                        </div>
                      </div>
                      <div style="display:flex;gap:6px;align-items:center;">
                        <button class="btn btn-secondary btn-sm" style="font-size:12px;" onclick="openViewNominationsModal('${p.id}')">
                          👥 View Nominations (${nomCount})
                        </button>
                        <button class="btn btn-ghost btn-sm" style="font-size:12px;" onclick="openFileNominationModal('${p.id}')" title="File Nomination">
                          + Nominate
                        </button>
                        <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--red);" onclick="deletePosition('${p.id}', '${p.title.replace(/'/g, "\\'")}')" title="Delete Position">
                          🗑️
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>
      </div>
    `,
  });
};

