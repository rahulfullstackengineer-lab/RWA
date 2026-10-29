// =============================================
// Documents & Compliance Screens
// =============================================

// =============================================
// Document Vault State & Interactive Engine
// =============================================

window.__docsState = window.__docsState || {
  folders: [
    { id: 'fld-1', name: 'Registration & Legal', icon: '📁', count: 4 },
    { id: 'fld-2', name: 'Bylaws', icon: '📁', count: 2 },
    { id: 'fld-3', name: 'Meeting Minutes', icon: '📁', count: 3 },
    { id: 'fld-4', name: 'Audit Reports', icon: '📁', count: 3 },
    { id: 'fld-5', name: 'Vendor Contracts', icon: '📁', count: 3 },
    { id: 'fld-6', name: 'Insurance', icon: '📁', count: 2 },
    { id: 'fld-7', name: 'Financial Reports', icon: '📁', count: 2 },
    { id: 'fld-8', name: 'Election Records', icon: '📁', count: 2 },
  ],
  documents: [],
  folderCounts: {},
  counts: { total: 0, committeeOnly: 0, allResidents: 0, auditor: 0 },
  selectedFolder: 'Registration & Legal',
  searchQuery: '',
  visibilityFilter: 'all',
  activeMenuDocId: null,
  loading: false,
  initialized: false
};

function escapeDocHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.fetchDocumentsData = async function(force = false) {
  if (window.__docsState.initialized && !force && window.__docsState.documents.length > 0) {
    return window.__docsState;
  }
  window.__docsState.loading = true;
  try {
    const res = await (window.apiFetch ? window.apiFetch('/api/documents') : fetch('/api/documents'));
    if (res.ok) {
      const data = await res.json();
      window.__docsState.folders = data.folders || window.__docsState.folders;
      window.__docsState.documents = data.allDocuments || data.documents || [];
      window.__docsState.folderCounts = data.folderCounts || {};
      window.__docsState.counts = data.counts || {};
      window.__docsState.initialized = true;
    }
  } catch (err) {
    console.error('Error fetching documents:', err);
  } finally {
    window.__docsState.loading = false;
  }
  return window.__docsState;
};

window.getFilteredDocuments = function() {
  const state = window.__docsState;
  let list = [...(state.documents || [])];

  if (state.selectedFolder && state.selectedFolder !== 'all') {
    list = list.filter(d => (d.folder || '').toLowerCase() === state.selectedFolder.toLowerCase());
  }

  if (state.visibilityFilter && state.visibilityFilter !== 'all') {
    if (state.visibilityFilter === 'committee') {
      list = list.filter(d => d.visibility === 'COMMITTEE');
    } else if (state.visibilityFilter === 'residents') {
      list = list.filter(d => d.visibility === 'ALL_RESIDENTS');
    } else if (state.visibilityFilter === 'auditor') {
      list = list.filter(d => d.visibility === 'AUDITOR');
    }
  }

  if (state.searchQuery && state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q) ||
      (d.folder || '').toLowerCase().includes(q) ||
      (d.ext || '').toLowerCase().includes(q) ||
      ((d.tags || []).some(t => t.toLowerCase().includes(q)))
    );
  }

  return list;
};

window.selectDocumentFolder = function(folderName) {
  window.__docsState.selectedFolder = folderName;
  window.reRenderDocumentVault();
};

window.setDocumentVisibilityFilter = function(filter) {
  window.__docsState.visibilityFilter = filter;
  window.reRenderDocumentVault();
};

window.onDocumentSearchInput = function(val) {
  window.__docsState.searchQuery = val || '';
  window.reRenderDocumentGridOnly();
};

window.reRenderDocumentVault = function() {
  if (window.Router && window.Router.current() === 'admin-documents') {
    const el = document.getElementById('app');
    if (el) {
      el.innerHTML = Screens['admin-documents']();
      if (typeof window.bindEvents === 'function') window.bindEvents();
    }
  }
};

window.reRenderDocumentGridOnly = function() {
  const gridEl = document.getElementById('documentVaultGrid');
  if (!gridEl) {
    window.reRenderDocumentVault();
    return;
  }
  const filtered = window.getFilteredDocuments();
  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border); border-radius: var(--r-lg);">
        <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No documents found</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
          No matching records in "${escapeDocHtml(window.__docsState.selectedFolder)}" for your current search criteria.
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.__docsState.searchQuery=''; window.__docsState.visibilityFilter='all'; window.reRenderDocumentVault();">Reset Filters</button>
      </div>
    `;
    return;
  }
  gridEl.innerHTML = filtered.map(d => renderDocumentCardHtml(d)).join('');
};

function renderDocumentCardHtml(d) {
  const icon = d.ext === 'PNG' || d.ext === 'JPG' ? '🖼️' : d.ext === 'XLSX' || d.ext === 'CSV' ? '📊' : d.ext === 'DOCX' || d.ext === 'DOC' ? '📝' : '📄';
  const visBadge = d.visibility === 'ALL_RESIDENTS'
    ? `<span class="badge badge-green" style="font-size:10px;">👥 All Residents</span>`
    : d.visibility === 'COMMITTEE'
    ? `<span class="badge badge-blue" style="font-size:10px;">🔒 Committee</span>`
    : `<span class="badge badge-amber" style="font-size:10px;">⚖️ Auditor</span>`;

  return `
    <div style="padding:16px;border:1px solid var(--border);border-radius:var(--r-lg);background:var(--bg-card);
      cursor:pointer;transition:all 0.15s ease;display:flex;flex-direction:column;justify-content:space-between;position:relative;"
      onmouseover="this.style.background='var(--bg-elevated)';this.style.borderColor='var(--border-strong, var(--border))'"
      onmouseout="this.style.background='var(--bg-card)';this.style.borderColor='var(--border)'">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div style="font-size:28px;line-height:1;">${icon}</div>
          <span style="font-size:10px;font-weight:700;color:var(--text-muted);background:var(--bg-elevated);padding:2px 6px;border-radius:4px;border:1px solid var(--border);">
            v${d.version || 1}
          </span>
        </div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--text-primary);line-height:1.35;min-height:36px;" title="${escapeDocHtml(d.name)}">
          ${escapeDocHtml(d.name)}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">
          ${escapeDocHtml(d.ext)} · ${escapeDocHtml(d.size)} · ${escapeDocHtml(d.folder)}
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          ${visBadge}
          <span style="font-size:11px;color:var(--text-muted)">${escapeDocHtml(d.displayDate || 'Recent')}</span>
        </div>
        <div style="display:flex;gap:6px;position:relative;">
          <button class="btn btn-ghost btn-sm" style="flex:1;justify-content:center;font-weight:600;" onclick="event.stopPropagation();openDocumentPreviewModal('${d.id}')">
            ⬇ View
          </button>
          <button class="btn btn-ghost btn-sm btn-icon" style="position:relative;" onclick="event.stopPropagation();toggleDocActionMenu(event, '${d.id}')" title="More options">
            ⋮
          </button>
        </div>
      </div>
    </div>
  `;
}

// Dropdown Action Menu
window.toggleDocActionMenu = function(event, docId) {
  event.stopPropagation();
  const existing = document.getElementById('docActionDropdownMenu');
  if (existing) {
    existing.remove();
    if (window.__activeDocMenuId === docId) {
      window.__activeDocMenuId = null;
      return;
    }
  }

  window.__activeDocMenuId = docId;
  const doc = (window.__docsState.documents || []).find(d => d.id === docId);
  if (!doc) return;

  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.id = 'docActionDropdownMenu';
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  menu.style.background = 'var(--bg-surface, #fff)';
  menu.style.border = '1px solid var(--border)';
  menu.style.borderRadius = 'var(--r-md, 8px)';
  menu.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)';
  menu.style.zIndex = '9999';
  menu.style.minWidth = '175px';
  menu.style.overflow = 'hidden';
  menu.style.fontSize = '12px';

  menu.innerHTML = `
    <div style="padding:6px 0;">
      <div style="padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text-primary);"
        onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'"
        onclick="document.getElementById('docActionDropdownMenu').remove(); openDocumentPreviewModal('${doc.id}');">
        <span>👁️</span><span>View / Preview</span>
      </div>
      <div style="padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text-primary);"
        onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'"
        onclick="document.getElementById('docActionDropdownMenu').remove(); downloadDocumentFile('${doc.id}');">
        <span>⬇</span><span>Download File</span>
      </div>
      <div style="padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text-primary);"
        onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'"
        onclick="document.getElementById('docActionDropdownMenu').remove(); openBumpVersionModal('${doc.id}');">
        <span>🔄</span><span>Upload New Version</span>
      </div>
      <div style="padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text-primary);"
        onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'"
        onclick="document.getElementById('docActionDropdownMenu').remove(); openEditDocumentModal('${doc.id}');">
        <span>✏️</span><span>Edit Details</span>
      </div>
      <div style="height:1px;background:var(--border);margin:4px 0;"></div>
      <div style="padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--red);"
        onmouseover="this.style.background='var(--red-light, rgba(239,68,68,0.1))'" onmouseout="this.style.background='transparent'"
        onclick="document.getElementById('docActionDropdownMenu').remove(); deleteDocumentConfirm('${doc.id}', '${escapeDocHtml(doc.name)}');">
        <span>🗑️</span><span>Delete Document</span>
      </div>
    </div>
  `;

  document.body.appendChild(menu);

  const closeHandler = function(e) {
    if (!menu.contains(e.target)) {
      menu.remove();
      window.__activeDocMenuId = null;
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 10);
};

// Preview Modal
window.openDocumentPreviewModal = function(docId) {
  const doc = (window.__docsState.documents || []).find(d => d.id === docId);
  if (!doc) return;

  const visLabel = doc.visibility === 'ALL_RESIDENTS' ? '👥 All Residents (Public)' : doc.visibility === 'COMMITTEE' ? '🔒 Committee Only' : '⚖️ Auditor';
  const visColor = doc.visibility === 'ALL_RESIDENTS' ? 'green' : doc.visibility === 'COMMITTEE' ? 'blue' : 'amber';

  const historyHtml = (doc.versionHistory && doc.versionHistory.length > 0)
    ? doc.versionHistory.map(vh => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="background:var(--blue-light);color:var(--blue);font-weight:700;font-size:11px;padding:2px 8px;border-radius:12px;">
            v${vh.version}
          </div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${escapeDocHtml(vh.note || 'Version release')}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
              By ${escapeDocHtml(vh.uploadedBy || 'Admin')} · ${escapeDocHtml(vh.date)} · ${escapeDocHtml(vh.size || doc.size)}
            </div>
          </div>
        </div>
      `).join('')
    : `<div style="font-size:12px;color:var(--text-muted);">No prior version changes recorded.</div>`;

  const tagsHtml = (doc.tags && doc.tags.length > 0)
    ? doc.tags.map(t => `<span style="font-size:11px;background:var(--bg-elevated);padding:2px 8px;border-radius:12px;border:1px solid var(--border);color:var(--text-secondary);">${escapeDocHtml(t)}</span>`).join(' ')
    : '<span style="font-size:11px;color:var(--text-muted);">No tags</span>';

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- Document Banner & Visual Letterhead Preview -->
      <div style="border:1px solid var(--border);border-radius:var(--r-md);background:var(--bg-elevated);padding:18px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:10px;right:-30px;transform:rotate(25deg);background:var(--blue);color:#fff;font-size:9px;font-weight:800;letter-spacing:1px;padding:3px 35px;text-transform:uppercase;box-shadow:0 2px 4px rgba(0,0,0,0.15);">
          VERIFIED
        </div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div style="font-size:38px;">${doc.ext === 'PNG' || doc.ext === 'JPG' ? '🖼️' : doc.ext === 'XLSX' ? '📊' : '📄'}</div>
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);">${escapeDocHtml(doc.name)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Folder: <strong>${escapeDocHtml(doc.folder)}</strong> · Format: <strong>${escapeDocHtml(doc.ext)}</strong> · Size: <strong>${escapeDocHtml(doc.size)}</strong>
            </div>
          </div>
        </div>
        <div style="font-size:12px;line-height:1.5;color:var(--text-secondary);background:var(--bg-surface);padding:12px;border-radius:var(--r-sm);border:1px solid var(--border);">
          ${escapeDocHtml(doc.description || 'Official verified society record stored in encrypted vault.')}
        </div>
      </div>

      <!-- Quick Metadata Grid -->
      <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;font-size:12px;">
        <div style="background:var(--bg-surface);padding:10px 14px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Access Permissions</div>
          <div><span class="badge badge-${visColor}">${visLabel}</span></div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 14px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Current Active Version</div>
          <div style="font-weight:700;color:var(--text-primary);">Version ${doc.version || 1}.0 · ${escapeDocHtml(doc.displayDate || 'Recent')}</div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 14px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Uploaded By</div>
          <div style="font-weight:600;color:var(--text-primary);">${escapeDocHtml(doc.uploadedBy || 'Managing Committee')}</div>
        </div>
        <div style="background:var(--bg-surface);padding:10px 14px;border:1px solid var(--border);border-radius:var(--r-sm);">
          <div style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">Vault Storage Path</div>
          <div style="font-family:monospace;font-size:11px;color:var(--blue);">${escapeDocHtml(doc.fileUrl || '/documents/' + doc.id)}</div>
        </div>
      </div>

      <!-- Tags -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Tags & Categories</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${tagsHtml}</div>
      </div>

      <!-- Version Audit Trail -->
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Version History & Audit Log</div>
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:8px 14px;max-height:160px;overflow-y:auto;">
          ${historyHtml}
        </div>
      </div>

      <!-- Action Button Row -->
      <div style="display:flex;gap:8px;margin-top:6px;">
        <button type="button" class="btn btn-primary" style="flex:1;justify-content:center;" onclick="downloadDocumentFile('${doc.id}')">
          ⬇ Download (${escapeDocHtml(doc.ext)})
        </button>
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('rwaGlobalModal').style.display='none';setTimeout(() => openBumpVersionModal('${doc.id}'), 200);">
          🔄 New Version
        </button>
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('rwaGlobalModal').style.display='none';setTimeout(() => openEditDocumentModal('${doc.id}'), 200);">
          ✏️ Edit
        </button>
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Document Vault: ${doc.name}`, html, null, null, '620px');
  }
};

// Upload Document Modal
window.openUploadDocumentModal = function() {
  const folders = (window.__docsState.folders || []);
  const curFolder = window.__docsState.selectedFolder || 'Registration & Legal';

  const html = `
    <div>
      <label class="form-label">Document Title / Name *</label>
      <input type="text" id="docUploadName" required placeholder="e.g. Lift Safety Audit Certificate 2026" class="form-input" style="width:100%;" />
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Target Folder *</label>
        <select id="docUploadFolder" class="form-select" style="width:100%;">
          ${folders.map(f => `<option value="${escapeDocHtml(f.name)}" ${f.name === curFolder ? 'selected' : ''}>${f.icon || '📁'} ${escapeDocHtml(f.name)}</option>`).join('')}
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">File Format</label>
        <select id="docUploadExt" class="form-select" style="width:100%;">
          <option value="PDF">PDF Document</option>
          <option value="PNG">PNG Image / Seal</option>
          <option value="JPG">JPG / JPEG Photo</option>
          <option value="DOCX">DOCX Word Document</option>
          <option value="XLSX">XLSX Excel Spreadsheet</option>
        </select>
      </div>
    </div>

    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Access Level / Visibility *</label>
        <select id="docUploadVis" class="form-select" style="width:100%;">
          <option value="ALL_RESIDENTS">👥 All Residents (Public to members)</option>
          <option value="COMMITTEE">🔒 Committee Only (Restricted to MC)</option>
          <option value="AUDITOR">⚖️ Auditor (Restricted to Internal/Statutory)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Simulated File Size</label>
        <input type="text" id="docUploadSize" value="1.2 MB" class="form-input" style="width:100%;" />
      </div>
    </div>

    <div>
      <label class="form-label">Attach File</label>
      <div style="border:2px dashed var(--border);border-radius:var(--r-md);padding:20px;text-align:center;background:var(--bg-elevated);cursor:pointer;"
        onclick="document.getElementById('docUploadFileInput').click();">
        <input type="file" id="docUploadFileInput" style="display:none;" onchange="
          if(this.files && this.files[0]) {
            const f = this.files[0];
            document.getElementById('docFileNameDisplay').innerText = '📎 ' + f.name + ' (' + (f.size > 1048576 ? (f.size/1048576).toFixed(1) + ' MB' : (f.size/1024).toFixed(0) + ' KB') + ')';
            if(!document.getElementById('docUploadName').value) {
              document.getElementById('docUploadName').value = f.name.replace(/\\.[^/.]+$/, '');
            }
            const ext = f.name.split('.').pop().toUpperCase();
            if(['PDF','PNG','JPG','JPEG','DOCX','XLSX'].includes(ext)) {
              document.getElementById('docUploadExt').value = ext === 'JPEG' ? 'JPG' : ext;
            }
          }
        " />
        <div style="font-size:24px;margin-bottom:6px;">☁️</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);" id="docFileNameDisplay">Click to browse or drag & drop document file</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Supports PDF, PNG, JPG, DOCX, XLSX (Max 25 MB)</div>
      </div>
    </div>

    <div>
      <label class="form-label">Description / Summary</label>
      <textarea id="docUploadDesc" rows="2" placeholder="Brief note or summary of this document's contents..." class="form-input" style="width:100%;resize:vertical;"></textarea>
    </div>

    <div>
      <label class="form-label">Tags (comma-separated)</label>
      <input type="text" id="docUploadTags" placeholder="e.g. Statutory, Annual, Compliance" class="form-input" style="width:100%;" />
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Upload Society Document', html, 'Upload & Save', async () => {
      const name = (document.getElementById('docUploadName').value || '').trim();
      const folder = document.getElementById('docUploadFolder').value;
      const ext = document.getElementById('docUploadExt').value;
      const visibility = document.getElementById('docUploadVis').value;
      const size = (document.getElementById('docUploadSize').value || '1.2 MB').trim();
      const description = (document.getElementById('docUploadDesc').value || '').trim();
      const tags = (document.getElementById('docUploadTags').value || '').split(',').map(t => t.trim()).filter(Boolean);

      if (!name) {
        if (typeof showToast === 'function') showToast('Please enter document title', 'warning');
        return;
      }

      try {
        const payload = {
          action: 'UPLOAD_DOCUMENT',
          name,
          folder,
          ext,
          visibility,
          size,
          description,
          tags
        };

        const res = await (window.apiFetch
          ? window.apiFetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          : fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));

        if (res.ok) {
          const data = await res.json();
          if (data.document) {
            window.__docsState.documents.unshift(data.document);
            window.__docsState.selectedFolder = folder;
            if (window.__docsState.folderCounts[folder] !== undefined) {
              window.__docsState.folderCounts[folder]++;
            } else {
              window.__docsState.folderCounts[folder] = 1;
            }
          }
          if (typeof showToast === 'function') showToast(`🎉 Document "${name}" uploaded and indexed!`, 'success');
          await window.fetchDocumentsData(true);
          window.reRenderDocumentVault();
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to upload document', 'error');
        }
      } catch (err) {
        console.error('Error uploading document:', err);
        if (typeof showToast === 'function') showToast('Network error uploading document', 'error');
      }
    });
  }
};

// Create Folder Modal
window.openNewFolderModal = function() {
  const html = `
    <div>
      <label class="form-label">Folder Name *</label>
      <input type="text" id="newFolderName" required placeholder="e.g. Environmental Clearances" class="form-input" style="width:100%;" />
    </div>
    <div>
      <label class="form-label">Folder Icon</label>
      <select id="newFolderIcon" class="form-select" style="width:100%;">
        <option value="📁">📁 Standard Folder</option>
        <option value="📂">📂 Open Folder</option>
        <option value="🗂️">🗂️ Card Index Folder</option>
        <option value="📜">📜 Legal Parchment / Deeds</option>
        <option value="📑">📑 Tabbed Documents</option>
        <option value="⚖️">⚖️ Statutory / Governance</option>
        <option value="🛡️">🛡️ Insurance & Security</option>
        <option value="💰">💰 Finance & Accounts</option>
      </select>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
      This folder will be added to the vault tree and available for categorized document storage.
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Create Document Folder', html, 'Create Folder', async () => {
      const name = (document.getElementById('newFolderName').value || '').trim();
      const icon = document.getElementById('newFolderIcon').value || '📁';

      if (!name) {
        if (typeof showToast === 'function') showToast('Folder name is required', 'warning');
        return;
      }

      try {
        const res = await (window.apiFetch
          ? window.apiFetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'CREATE_FOLDER', name, icon }) })
          : fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'CREATE_FOLDER', name, icon }) }));

        if (res.ok) {
          const data = await res.json();
          if (data.folder) {
            window.__docsState.folders.push(data.folder);
            window.__docsState.folderCounts[data.folder.name] = 0;
            window.__docsState.selectedFolder = data.folder.name;
          }
          if (typeof showToast === 'function') showToast(`📁 Folder "${name}" created!`, 'success');
          await window.fetchDocumentsData(true);
          window.reRenderDocumentVault();
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to create folder', 'error');
        }
      } catch (err) {
        console.error('Error creating folder:', err);
        if (typeof showToast === 'function') showToast('Network error creating folder', 'error');
      }
    });
  }
};

// Bump Version Modal
window.openBumpVersionModal = function(docId) {
  const doc = (window.__docsState.documents || []).find(d => d.id === docId);
  if (!doc) return;

  const nextVer = (doc.version || 1) + 1;

  const html = `
    <div style="background:var(--bg-elevated);padding:12px;border-radius:var(--r-sm);border:1px solid var(--border);margin-bottom:12px;">
      <div style="font-size:12px;color:var(--text-muted);">Current Active Version</div>
      <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-top:2px;">
        ${escapeDocHtml(doc.name)} — <span style="color:var(--blue);">v${doc.version || 1} ➔ v${nextVer}</span>
      </div>
    </div>
    <div>
      <label class="form-label">Revision Changelog / Note *</label>
      <input type="text" id="bumpVerNote" required placeholder="e.g. Revised after Oct 2026 General Body Meeting" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Updated File Size</label>
        <input type="text" id="bumpVerSize" value="${escapeDocHtml(doc.size || '1.2 MB')}" class="form-input" style="width:100%;" />
      </div>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Upload New Version (v${nextVer})`, html, 'Save Version', async () => {
      const note = (document.getElementById('bumpVerNote').value || '').trim();
      const newSize = (document.getElementById('bumpVerSize').value || doc.size).trim();

      if (!note) {
        if (typeof showToast === 'function') showToast('Please enter revision note', 'warning');
        return;
      }

      try {
        const res = await (window.apiFetch
          ? window.apiFetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, action: 'BUMP_VERSION', note, newSize }) })
          : fetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, action: 'BUMP_VERSION', note, newSize }) }));

        if (res.ok) {
          if (typeof showToast === 'function') showToast(`🎉 "${doc.name}" updated to v${nextVer}!`, 'success');
          await window.fetchDocumentsData(true);
          window.reRenderDocumentVault();
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to bump version', 'error');
        }
      } catch (err) {
        console.error('Error bumping version:', err);
        if (typeof showToast === 'function') showToast('Network error updating version', 'error');
      }
    });
  }
};

// Edit Document Modal
window.openEditDocumentModal = function(docId) {
  const doc = (window.__docsState.documents || []).find(d => d.id === docId);
  if (!doc) return;
  const folders = (window.__docsState.folders || []);

  const html = `
    <div>
      <label class="form-label">Document Title *</label>
      <input type="text" id="editDocName" value="${escapeDocHtml(doc.name)}" required class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Folder</label>
        <select id="editDocFolder" class="form-select" style="width:100%;">
          ${folders.map(f => `<option value="${escapeDocHtml(f.name)}" ${f.name === doc.folder ? 'selected' : ''}>${f.icon || '📁'} ${escapeDocHtml(f.name)}</option>`).join('')}
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Visibility</label>
        <select id="editDocVis" class="form-select" style="width:100%;">
          <option value="ALL_RESIDENTS" ${doc.visibility === 'ALL_RESIDENTS' ? 'selected' : ''}>👥 All Residents</option>
          <option value="COMMITTEE" ${doc.visibility === 'COMMITTEE' ? 'selected' : ''}>🔒 Committee Only</option>
          <option value="AUDITOR" ${doc.visibility === 'AUDITOR' ? 'selected' : ''}>⚖️ Auditor</option>
        </select>
      </div>
    </div>
    <div>
      <label class="form-label">Description</label>
      <textarea id="editDocDesc" rows="2" class="form-input" style="width:100%;resize:vertical;">${escapeDocHtml(doc.description || '')}</textarea>
    </div>
    <div>
      <label class="form-label">Tags (comma-separated)</label>
      <input type="text" id="editDocTags" value="${escapeDocHtml((doc.tags || []).join(', '))}" class="form-input" style="width:100%;" />
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal(`Edit Document Details`, html, 'Save Changes', async () => {
      const name = (document.getElementById('editDocName').value || '').trim();
      const folder = document.getElementById('editDocFolder').value;
      const visibility = document.getElementById('editDocVis').value;
      const description = (document.getElementById('editDocDesc').value || '').trim();
      const tags = (document.getElementById('editDocTags').value || '').split(',').map(t => t.trim()).filter(Boolean);

      if (!name) {
        if (typeof showToast === 'function') showToast('Document name cannot be blank', 'warning');
        return;
      }

      try {
        const res = await (window.apiFetch
          ? window.apiFetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, action: 'UPDATE_DOCUMENT', name, folder, visibility, description, tags }) })
          : fetch('/api/documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id, action: 'UPDATE_DOCUMENT', name, folder, visibility, description, tags }) }));

        if (res.ok) {
          if (typeof showToast === 'function') showToast(`Document "${name}" updated!`, 'success');
          await window.fetchDocumentsData(true);
          window.reRenderDocumentVault();
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to update document', 'error');
        }
      } catch (err) {
        console.error('Error updating document:', err);
        if (typeof showToast === 'function') showToast('Network error updating document', 'error');
      }
    });
  }
};

// Delete Document Confirm
window.deleteDocumentConfirm = async function(docId, docName) {
  if (!confirm(`Are you sure you want to permanently delete "${docName}" from the society document vault? This action is recorded in the immutable audit log.`)) {
    return;
  }

  try {
    const res = await (window.apiFetch
      ? window.apiFetch(`/api/documents?id=${encodeURIComponent(docId)}`, { method: 'DELETE' })
      : fetch(`/api/documents?id=${encodeURIComponent(docId)}`, { method: 'DELETE' }));

    if (res.ok) {
      if (typeof showToast === 'function') showToast(`🗑️ Document "${docName}" deleted`, 'info');
      await window.fetchDocumentsData(true);
      window.reRenderDocumentVault();
    } else {
      const errData = await res.json().catch(() => ({}));
      if (typeof showToast === 'function') showToast(errData.error || 'Failed to delete document', 'error');
    }
  } catch (err) {
    console.error('Error deleting document:', err);
    if (typeof showToast === 'function') showToast('Network error deleting document', 'error');
  }
};

// Download Simulated File
window.downloadDocumentFile = function(docId) {
  const doc = (window.__docsState.documents || []).find(d => d.id === docId);
  if (!doc) return;

  if (typeof showToast === 'function') {
    showToast(`⬇ Downloading ${doc.name}.${(doc.ext || 'pdf').toLowerCase()}...`, 'success');
  }

  // Create simulated text/pdf file blob
  const textContent = `========================================================\n` +
    `RESIDENTS WELFARE ASSOCIATION - OFFICIAL DOCUMENT VAULT\n` +
    `========================================================\n\n` +
    `Document Name:   ${doc.name}\n` +
    `Document ID:     ${doc.id}\n` +
    `Folder:          ${doc.folder}\n` +
    `Format:          ${doc.ext}\n` +
    `File Size:       ${doc.size}\n` +
    `Active Version:  v${doc.version || 1}\n` +
    `Visibility:      ${doc.visibility}\n` +
    `Uploaded By:     ${doc.uploadedBy}\n` +
    `Release Date:    ${doc.displayDate}\n` +
    `Description:     ${doc.description || 'Verified society record'}\n\n` +
    `--------------------------------------------------------\n` +
    `SECURITY & COMPLIANCE VERIFICATION\n` +
    `Digital Signature: SHA256-RWA-SECURE-${doc.id}-VERIFIED\n` +
    `Certified by Managing Committee Secretariat\n` +
    `========================================================\n`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${doc.name.replace(/[^a-zA-Z0-9_\\-]/g, '_')}.${(doc.ext || 'pdf').toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }, 500);
};

// =============================================
// Document Vault Screen Main Renderer
// =============================================

Screens['admin-documents'] = function() {
  const state = window.__docsState;

  // Background fetch if first time or not initialized
  if (!state.initialized) {
    window.fetchDocumentsData().then(() => {
      window.reRenderDocumentVault();
    });
  }

  const folders = state.folders || [];
  const filtered = window.getFilteredDocuments();

  return Shell.render('admin-documents', {
    title: 'Document Vault',
    portal: 'admin',
    breadcrumb: 'Documents',
    actions: `<button class="btn btn-primary btn-sm" onclick="openUploadDocumentModal()">⬆ Upload Document</button>`,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Document Vault</div>
          <div class="page-subtitle">Store and manage all society documents securely</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="openNewFolderModal()">📁 New Folder</button>
          <button class="btn btn-primary" onclick="openUploadDocumentModal()">⬆ Upload Document</button>
        </div>
      </div>

      <div class="structure-split-layout">
        <!-- Folder Tree Sidebar -->
        <div class="card card-sm" style="min-width:240px;height:fit-content;">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:10px;letter-spacing:0.04em;text-transform:uppercase;">Folders</div>
          ${folders.map(f => {
            const isActive = (state.selectedFolder || '').toLowerCase() === f.name.toLowerCase();
            const count = state.folderCounts && state.folderCounts[f.name] !== undefined
              ? state.folderCounts[f.name]
              : (state.documents || []).filter(d => d.folder === f.name).length;

            return `
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r-sm);
                cursor:pointer;margin-bottom:2px;transition:background 0.12s ease;
                background:${isActive ? 'var(--blue-light)' : 'transparent'};
                color:${isActive ? 'var(--blue)' : 'var(--text-secondary)'};"
                onclick="selectDocumentFolder('${escapeDocHtml(f.name)}')"
                onmouseover="if(!${isActive})this.style.background='var(--bg-elevated)'"
                onmouseout="if(!${isActive})this.style.background='transparent'">
                <span style="font-size:14px;">${f.icon || '📁'}</span>
                <span style="flex:1;font-size:12px;font-weight:${isActive ? '600' : '400'}">${escapeDocHtml(f.name)}</span>
                <span style="font-size:11px;font-weight:${isActive ? '700' : '400'};color:${isActive ? 'var(--blue)' : 'var(--text-muted)'};background:${isActive ? 'rgba(37,99,235,0.1)' : 'transparent'};padding:1px 6px;border-radius:10px;">
                  ${count}
                </span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Document List & Cards -->
        <div style="flex:1;min-width:0;">
          <div class="filter-bar" style="margin-bottom:16px;">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="docVaultSearchInput" placeholder="Search documents..." value="${escapeDocHtml(state.searchQuery)}" oninput="onDocumentSearchInput(this.value)" />
            </div>
            <div class="filter-pill ${state.visibilityFilter === 'all' ? 'active' : ''}" onclick="setDocumentVisibilityFilter('all')">
              All
            </div>
            <div class="filter-pill ${state.visibilityFilter === 'committee' ? 'active' : ''}" onclick="setDocumentVisibilityFilter('committee')">
              Committee Only
            </div>
            <div class="filter-pill ${state.visibilityFilter === 'residents' ? 'active' : ''}" onclick="setDocumentVisibilityFilter('residents')">
              All Residents
            </div>
            <div class="filter-pill ${state.visibilityFilter === 'auditor' ? 'active' : ''}" onclick="setDocumentVisibilityFilter('auditor')">
              Auditor
            </div>
          </div>

          <!-- Document Grid Container -->
          <div class="mini-grid-3" id="documentVaultGrid">
            ${filtered.length > 0 ? filtered.map(d => renderDocumentCardHtml(d)).join('') : `
              <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border); border-radius: var(--r-lg);">
                <div style="font-size: 36px; margin-bottom: 10px;">📂</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">No documents in "${escapeDocHtml(state.selectedFolder)}"</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
                  This folder is currently empty. Upload the first document to make it available to members or committee.
                </div>
                <button class="btn btn-primary btn-sm" onclick="openUploadDocumentModal()">⬆ Upload Document</button>
              </div>
            `}
          </div>
        </div>
      </div>
    `,
  });
};

// =============================================
// Interactive Compliance Calendar Engine & Store
// =============================================

window._complianceState = window._complianceState || {
  items: [],
  stats: { total: 0, dueCount: 0, upcomingCount: 0, completedCount: 0, overdueCount: 0 },
  categoryFilter: 'All',
  statusTab: 'All',
  searchQuery: '',
  loading: false,
  initialized: false
};

window._complianceViewMode = window._complianceViewMode || 'list';
window._complianceMonth = window._complianceMonth !== undefined ? window._complianceMonth : 9; // 0-indexed: 9 = Oct
window._complianceYear = window._complianceYear || 2026;
window._complianceSelectedDate = window._complianceSelectedDate || '2026-10-15';

window.fetchComplianceData = async function(force = false) {
  if (window._complianceState.initialized && !force) {
    return window._complianceState;
  }
  window._complianceState.loading = true;
  try {
    const res = await (window.apiFetch ? window.apiFetch('/api/compliance') : fetch('/api/compliance'));
    if (res.ok) {
      const data = await res.json();
      window._complianceState.items = Array.isArray(data.items) ? data.items : (Array.isArray(data.allItems) ? data.allItems : []);
      window._complianceState.stats = data.stats || { total: 0, dueCount: 0, upcomingCount: 0, completedCount: 0, overdueCount: 0 };
      window._complianceState.initialized = true;
      try {
        localStorage.removeItem('rwa_compliance_data');
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to fetch compliance deadlines:', err);
  } finally {
    window._complianceState.loading = false;
  }
  return window._complianceState;
};

window.getComplianceItems = function() {
  if (window._complianceState.initialized && Array.isArray(window._complianceState.items)) {
    return window._complianceState.items;
  }
  if (Array.isArray(window._complianceState.items) && window._complianceState.items.length > 0) {
    return window._complianceState.items;
  }
  return [];
};

window.saveComplianceItems = function(items) {
  window._complianceState.items = items;
};

window.toggleComplianceView = function() {
  window._complianceViewMode = window._complianceViewMode === 'calendar' ? 'list' : 'calendar';
  Router.go('admin-compliance');
};

window.setComplianceTab = function(tab) {
  window._complianceState.statusTab = tab;
  Router.go('admin-compliance');
};

window.setComplianceCategoryFilter = function(cat) {
  window._complianceState.categoryFilter = cat;
  Router.go('admin-compliance');
};

window.onComplianceSearch = function(query) {
  window._complianceState.searchQuery = query || '';
  Router.go('admin-compliance');
};

window.changeComplianceMonth = function(delta) {
  let m = window._complianceMonth + delta;
  let y = window._complianceYear;
  if (m < 0) { m = 11; y--; }
  else if (m > 11) { m = 0; y++; }
  window._complianceMonth = m;
  window._complianceYear = y;
  Router.go('admin-compliance');
};

window.selectComplianceDate = function(dateStr) {
  window._complianceSelectedDate = dateStr;
  Router.go('admin-compliance');
};

window.markComplianceDone = async function(id) {
  const items = getComplianceItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  try {
    const res = await (window.apiFetch
      ? window.apiFetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'MARK_DONE' }) })
      : fetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'MARK_DONE' }) }));

    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        item.status = 'COMPLETED';
        item.completedAt = data.item.completedAt;
      }
      if (typeof showToast === 'function') showToast(`✓ Marked "${item.title}" as COMPLETED!`, 'success');
      await window.fetchComplianceData(true);
      Router.go('admin-compliance');
    } else {
      item.status = 'COMPLETED';
      item.completedAt = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
      saveComplianceItems(items);
      if (typeof showToast === 'function') showToast(`✓ Marked "${item.title}" as COMPLETED!`, 'success');
      Router.go('admin-compliance');
    }
  } catch (e) {
    item.status = 'COMPLETED';
    item.completedAt = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    saveComplianceItems(items);
    if (typeof showToast === 'function') showToast(`✓ Marked "${item.title}" as COMPLETED!`, 'success');
    Router.go('admin-compliance');
  }
};

window.deleteComplianceItem = async function(id) {
  const items = getComplianceItems();
  const item = items.find(i => i.id === id);
  if (!confirm(`Are you sure you want to remove the compliance task "${item ? item.title : id}"? This action is recorded in the society audit trail.`)) {
    return;
  }

  try {
    const res = await (window.apiFetch
      ? window.apiFetch(`/api/compliance?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      : fetch(`/api/compliance?id=${encodeURIComponent(id)}`, { method: 'DELETE' }));

    if (res.ok) {
      if (typeof showToast === 'function') showToast(`Task "${item ? item.title : id}" deleted`, 'info');
      await window.fetchComplianceData(true);
      Router.go('admin-compliance');
    } else {
      const remaining = items.filter(i => i.id !== id);
      saveComplianceItems(remaining);
      if (typeof showToast === 'function') showToast(`Task "${item ? item.title : id}" deleted`, 'info');
      Router.go('admin-compliance');
    }
  } catch (e) {
    const remaining = items.filter(i => i.id !== id);
    saveComplianceItems(remaining);
    if (typeof showToast === 'function') showToast(`Task "${item ? item.title : id}" deleted`, 'info');
    Router.go('admin-compliance');
  }
};

window.autoSeedStatutoryDeadlines = async function() {
  if (!confirm('Would you like to auto-populate standard annual statutory deadlines (Registrar Annual Returns, Fire NOC, Elevator Inspection, GST, Water Tank Disinfection, and AGM)?')) {
    return;
  }

  try {
    const res = await (window.apiFetch
      ? window.apiFetch('/api/compliance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'RESET_DEFAULTS' }) })
      : fetch('/api/compliance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'RESET_DEFAULTS' }) }));

    if (res.ok) {
      if (typeof showToast === 'function') showToast('🏛️ Standard statutory compliance deadlines loaded!', 'success');
      await window.fetchComplianceData(true);
      Router.go('admin-compliance');
    }
  } catch (e) {
    console.error('Error seeding statutory compliance items:', e);
  }
};

window.openAddComplianceModal = function(prefillDate) {
  const defaultDate = prefillDate || window._complianceSelectedDate || '2026-10-15';
  const docs = (window.__docsState && window.__docsState.documents) ? window.__docsState.documents : [];

  const html = `
    <div>
      <label class="form-label">Compliance / Task Title *</label>
      <input type="text" id="cmpTitle" required placeholder="e.g. Lift Safety Inspection Certificate" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Due Date *</label>
        <input type="date" id="cmpDate" required value="${defaultDate}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Category *</label>
        <select id="cmpCat" class="form-select" style="width:100%;">
          <option value="Governance">Governance (AGM/Elections)</option>
          <option value="Finance">Finance & Tax (GST/Audit)</option>
          <option value="Safety">Safety & NOC (Fire/Lifts)</option>
          <option value="Legal">Legal & Regulatory (Registrar)</option>
          <option value="Operations">Operations & Infrastructure</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Regulatory Authority</label>
        <input type="text" id="cmpAuthority" placeholder="e.g. Registrar of Societies, Fire Dept, Municipal Corp" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Initial Status</label>
        <select id="cmpStatus" class="form-select" style="width:100%;">
          <option value="DUE">DUE (Action required now)</option>
          <option value="UPCOMING" selected>UPCOMING</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Recurrence</label>
        <select id="cmpRecurFreq" class="form-select" style="width:100%;">
          <option value="NONE">One-time Task</option>
          <option value="YEARLY" selected>Yearly Recurring 🔄</option>
          <option value="QUARTERLY">Quarterly Recurring 🔄</option>
          <option value="MONTHLY">Monthly Recurring 🔄</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Responsible Role</label>
        <input type="text" id="cmpRole" placeholder="e.g. Secretary, Treasurer, Estate Manager" value="Managing Committee" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div>
      <label class="form-label">Penalty / Legal Risk on Non-compliance</label>
      <input type="text" id="cmpPenalty" placeholder="e.g. Statutory fine of ₹500/day + Show cause notice" class="form-input" style="width:100%;" />
    </div>
    ${docs.length > 0 ? `
      <div>
        <label class="form-label">Link Existing Vault Document (Optional)</label>
        <select id="cmpLinkedDoc" class="form-select" style="width:100%;">
          <option value="">-- None --</option>
          ${docs.map(d => `<option value="${d.id}">${d.name} (${d.folder} - v${d.version || 1})</option>`).join('')}
        </select>
      </div>
    ` : ''}
    <div>
      <label class="form-label">Description & Statutory Reference</label>
      <textarea id="cmpDesc" rows="2" placeholder="e.g. Mandatory statutory filing per Section 14 of Society Registration Act..." class="form-input" style="width:100%; resize:vertical;"></textarea>
    </div>
    <div>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--blue);margin-top:6px;">
        <input type="checkbox" id="cmpSyncGcal" checked style="width:16px;height:16px;" />
        <span>📅 Automatically sync & create event on Google Calendar</span>
      </label>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Schedule Compliance Deadline', html, 'Add to Calendar 📅', async () => {
      const title = (document.getElementById('cmpTitle').value || '').trim();
      const dateVal = document.getElementById('cmpDate').value;
      const category = document.getElementById('cmpCat').value;
      const authority = (document.getElementById('cmpAuthority').value || 'Statutory Authority').trim();
      const status = document.getElementById('cmpStatus').value;
      const recurFreq = document.getElementById('cmpRecurFreq').value;
      const recurring = recurFreq !== 'NONE';
      const responsibleRole = (document.getElementById('cmpRole').value || 'Managing Committee').trim();
      const penaltyRisk = (document.getElementById('cmpPenalty').value || '').trim();
      const linkedDocId = document.getElementById('cmpLinkedDoc') ? document.getElementById('cmpLinkedDoc').value : null;
      const desc = (document.getElementById('cmpDesc').value || '').trim() || 'Mandatory society compliance item.';
      const syncGcal = document.getElementById('cmpSyncGcal')?.checked;

      if (!title || !dateVal) {
        if (typeof showToast === 'function') showToast('Title and Due Date are required', 'warning');
        return;
      }

      try {
        const payload = {
          action: 'CREATE',
          title,
          dateVal,
          category,
          authority,
          status,
          recurring,
          recurrenceFreq: recurFreq,
          responsibleRole,
          penaltyRisk,
          linkedDocId,
          desc
        };

        const res = await (window.apiFetch
          ? window.apiFetch('/api/compliance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          : fetch('/api/compliance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));

        if (res.ok) {
          if (syncGcal && typeof window.syncEventToGoogleCalendar === 'function') {
            window.syncEventToGoogleCalendar({
              title: `Compliance: ${title} (${category})`,
              description: `Society Compliance Deadline:\n${desc}\n\nAuthority: ${authority}\nPenalty Risk: ${penaltyRisk}\nStatus: ${status}`,
              location: 'Sector 22 RWA Office, Chandigarh',
              startDate: dateVal,
              allDay: true,
              eventType: 'COMPLIANCE'
            });
          }

          if (typeof showToast === 'function') showToast(`✓ "${title}" added to Compliance Calendar!`, 'success');
          await window.fetchComplianceData(true);
          Router.go('admin-compliance');
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to save compliance task', 'error');
        }
      } catch (err) {
        console.error('Error adding compliance item:', err);
        if (typeof showToast === 'function') showToast('Network error saving compliance task', 'error');
      }
    });
  }
};

window.openEditComplianceModal = function(id) {
  const items = getComplianceItems();
  const item = items.find(i => i.id === id);
  if (!item) return;

  const docs = (window.__docsState && window.__docsState.documents) ? window.__docsState.documents : [];

  const html = `
    <div>
      <label class="form-label">Compliance / Task Title *</label>
      <input type="text" id="cmpEditTitle" required value="${item.title}" class="form-input" style="width:100%;" />
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Due Date *</label>
        <input type="date" id="cmpEditDate" required value="${item.dateStr || '2026-10-15'}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Category</label>
        <select id="cmpEditCat" class="form-select" style="width:100%;">
          ${['Governance', 'Finance', 'Safety', 'Legal', 'Operations'].map(c => `
            <option value="${c}" ${(item.category || item.cat) === c ? 'selected' : ''}>${c}</option>
          `).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Regulatory Authority</label>
        <input type="text" id="cmpEditAuthority" value="${item.authority || 'Statutory Authority'}" class="form-input" style="width:100%;" />
      </div>
      <div style="flex:1;">
        <label class="form-label">Status</label>
        <select id="cmpEditStatus" class="form-select" style="width:100%;">
          <option value="DUE" ${item.status === 'DUE' ? 'selected' : ''}>DUE (Priority action)</option>
          <option value="UPCOMING" ${item.status === 'UPCOMING' ? 'selected' : ''}>UPCOMING</option>
          <option value="OVERDUE" ${item.status === 'OVERDUE' ? 'selected' : ''}>OVERDUE</option>
          <option value="COMPLETED" ${item.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
        </select>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <div style="flex:1;">
        <label class="form-label">Recurrence</label>
        <select id="cmpEditRecurFreq" class="form-select" style="width:100%;">
          <option value="NONE" ${!item.recurring ? 'selected' : ''}>One-time Task</option>
          <option value="YEARLY" ${item.recurring && (item.recurrenceFreq === 'YEARLY' || !item.recurrenceFreq) ? 'selected' : ''}>Yearly Recurring 🔄</option>
          <option value="QUARTERLY" ${item.recurrenceFreq === 'QUARTERLY' ? 'selected' : ''}>Quarterly Recurring 🔄</option>
          <option value="MONTHLY" ${item.recurrenceFreq === 'MONTHLY' ? 'selected' : ''}>Monthly Recurring 🔄</option>
        </select>
      </div>
      <div style="flex:1;">
        <label class="form-label">Responsible Role</label>
        <input type="text" id="cmpEditRole" value="${item.responsibleRole || 'Managing Committee'}" class="form-input" style="width:100%;" />
      </div>
    </div>
    <div>
      <label class="form-label">Penalty / Legal Risk on Non-compliance</label>
      <input type="text" id="cmpEditPenalty" value="${item.penaltyRisk || ''}" placeholder="e.g. Late fee of ₹500/day" class="form-input" style="width:100%;" />
    </div>
    ${docs.length > 0 ? `
      <div>
        <label class="form-label">Linked Vault Document</label>
        <select id="cmpEditLinkedDoc" class="form-select" style="width:100%;">
          <option value="">-- None --</option>
          ${docs.map(d => `<option value="${d.id}" ${item.linkedDocId === d.id ? 'selected' : ''}>${d.name} (${d.folder})</option>`).join('')}
        </select>
      </div>
    ` : ''}
    <div>
      <label class="form-label">Description & Legal Authority</label>
      <textarea id="cmpEditDesc" rows="2" class="form-input" style="width:100%; resize:vertical;">${item.desc || ''}</textarea>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:6px;">
      <button type="button" class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="deleteComplianceItem('${item.id}')">🗑️ Delete Task</button>
    </div>
  `;

  if (typeof window.showModal === 'function') {
    window.showModal('Edit Compliance Task', html, 'Save Changes ✓', async () => {
      const title = (document.getElementById('cmpEditTitle').value || '').trim();
      const dateVal = document.getElementById('cmpEditDate').value;
      const category = document.getElementById('cmpEditCat').value;
      const authority = (document.getElementById('cmpEditAuthority').value || '').trim();
      const status = document.getElementById('cmpEditStatus').value;
      const recurFreq = document.getElementById('cmpEditRecurFreq').value;
      const recurring = recurFreq !== 'NONE';
      const responsibleRole = (document.getElementById('cmpEditRole').value || '').trim();
      const penaltyRisk = (document.getElementById('cmpEditPenalty').value || '').trim();
      const linkedDocId = document.getElementById('cmpEditLinkedDoc') ? document.getElementById('cmpEditLinkedDoc').value : null;
      const desc = (document.getElementById('cmpEditDesc').value || '').trim();

      if (!title || !dateVal) {
        if (typeof showToast === 'function') showToast('Title and Due Date are required', 'warning');
        return;
      }

      try {
        const payload = {
          id: item.id,
          action: 'UPDATE',
          title,
          dateVal,
          category,
          authority,
          status,
          recurring,
          recurrenceFreq: recurFreq,
          responsibleRole,
          penaltyRisk,
          linkedDocId,
          desc
        };

        const res = await (window.apiFetch
          ? window.apiFetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          : fetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));

        if (res.ok) {
          if (typeof showToast === 'function') showToast(`✓ Updated "${title}" successfully!`, 'success');
          await window.fetchComplianceData(true);
          Router.go('admin-compliance');
        } else {
          const errData = await res.json().catch(() => ({}));
          if (typeof showToast === 'function') showToast(errData.error || 'Failed to update compliance task', 'error');
        }
      } catch (err) {
        console.error('Error updating compliance task:', err);
        if (typeof showToast === 'function') showToast('Network error updating compliance task', 'error');
      }
    });
  }
};

// =============================================
// Screens['admin-compliance']
// =============================================

Screens['admin-compliance'] = function() {
  const state = window._complianceState;

  // Background fetch on initial load
  if (!state.initialized) {
    window.fetchComplianceData().then(() => {
      if (window.Router && window.Router.current() === 'admin-compliance') {
        const el = document.getElementById('app');
        if (el) {
          el.innerHTML = Screens['admin-compliance']();
          if (typeof window.bindEvents === 'function') window.bindEvents();
        }
      }
    });
  }

  const items = getComplianceItems();
  const dueCount = items.filter(i => i.status === 'DUE').length;
  const upcomingCount = items.filter(i => i.status === 'UPCOMING').length;
  const completedCount = items.filter(i => i.status === 'COMPLETED').length;
  const overdueCount = items.filter(i => i.status === 'OVERDUE').length;

  const currentTab = state.statusTab || 'All';
  const categoryFilter = state.categoryFilter || 'All';
  const searchQuery = (state.searchQuery || '').toLowerCase().trim();
  const viewMode = window._complianceViewMode || 'list';

  let filteredItems = [...items];

  // Apply Status Tab
  if (currentTab === 'Overdue') {
    filteredItems = filteredItems.filter(i => i.status === 'OVERDUE');
  } else if (currentTab === 'Due (30d)') {
    filteredItems = filteredItems.filter(i => i.status === 'DUE' || i.status === 'UPCOMING');
  } else if (currentTab === 'Completed') {
    filteredItems = filteredItems.filter(i => i.status === 'COMPLETED');
  }

  // Apply Category Filter
  if (categoryFilter !== 'All') {
    filteredItems = filteredItems.filter(i => (i.category || i.cat || '').toLowerCase() === categoryFilter.toLowerCase());
  }

  // Apply Search Query
  if (searchQuery) {
    filteredItems = filteredItems.filter(i =>
      i.title.toLowerCase().includes(searchQuery) ||
      (i.desc && i.desc.toLowerCase().includes(searchQuery)) ||
      (i.authority && i.authority.toLowerCase().includes(searchQuery)) ||
      (i.penaltyRisk && i.penaltyRisk.toLowerCase().includes(searchQuery))
    );
  }

  // Calendar calculations
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthShorts = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const curMonth = window._complianceMonth !== undefined ? window._complianceMonth : 9; // Oct
  const curYear = window._complianceYear || 2026;
  const curMonthName = monthNames[curMonth];
  const curMonthShort = monthShorts[curMonth];

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(curYear, curMonth, 1).getDay(); // 0 is Sun
  const daysInPrevMonth = new Date(curYear, curMonth, 0).getDate();

  const selectedDateStr = window._complianceSelectedDate || `${curYear}-${String(curMonth+1).padStart(2,'0')}-15`;
  const selectedDayItems = items.filter(i => {
    return i.dateStr === selectedDateStr || (i.day === String(parseInt(selectedDateStr.split('-')[2])) && i.month === curMonthShort && (i.year ? i.year === curYear : true));
  });

  return Shell.render('admin-compliance', {
    title: 'Compliance Calendar',
    portal: 'admin',
    breadcrumb: 'Documents',
    actions: `<button class="btn btn-primary btn-sm" onclick="openAddComplianceModal()">+ Add Deadline</button>`,
    content: `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title">Compliance Calendar</div>
          <div class="page-subtitle">Track all statutory, regulatory, and society governance deadlines</div>
        </div>
        <div class="page-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="autoSeedStatutoryDeadlines()" title="Preload standard statutory deadlines per Societies Act">
            🏛️ Seed Statutory Deadlines
          </button>
          <button class="btn btn-secondary btn-sm" onclick="toggleComplianceView()">
            ${viewMode === 'calendar' ? '📋 List View' : '📅 Calendar View'}
          </button>
          <button class="btn btn-primary btn-sm" onclick="openAddComplianceModal()">+ Add Deadline</button>
        </div>
      </div>

      <!-- Live Reactive Metrics -->
      <div class="stat-grid stat-grid-4" style="margin-bottom:20px;">
        <div class="stat-card red" style="cursor:pointer;border:${currentTab === 'Due (30d)' ? '2px solid var(--red)' : '1px solid var(--border)'};" onclick="setComplianceTab('Due (30d)')">
          <div class="stat-icon red">🔴</div>
          <div class="stat-value">${dueCount}</div>
          <div class="stat-label">Due This Month</div>
        </div>
        <div class="stat-card amber" style="cursor:pointer;border:${currentTab === 'Due (30d)' ? '2px solid var(--amber)' : '1px solid var(--border)'};" onclick="setComplianceTab('Due (30d)')">
          <div class="stat-icon amber">⏰</div>
          <div class="stat-value">${upcomingCount}</div>
          <div class="stat-label">Upcoming (30d)</div>
        </div>
        <div class="stat-card green" style="cursor:pointer;border:${currentTab === 'Completed' ? '2px solid var(--green)' : '1px solid var(--border)'};" onclick="setComplianceTab('Completed')">
          <div class="stat-icon green">✅</div>
          <div class="stat-value">${completedCount}</div>
          <div class="stat-label">Completed YTD</div>
        </div>
        <div class="stat-card red" style="cursor:pointer;border:${currentTab === 'Overdue' ? '2px solid var(--red)' : '1px solid var(--border)'};" onclick="setComplianceTab('Overdue')">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-value">${overdueCount}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>

      ${viewMode === 'calendar' ? `
        <!-- Full Interactive Calendar Grid View -->
        <div class="calendar-card">
          <div class="calendar-top-bar">
            <div class="calendar-month-nav">
              <button class="btn btn-secondary btn-sm" onclick="changeComplianceMonth(-1)">◀ Prev</button>
              <div class="calendar-month-title">${curMonthName} ${curYear}</div>
              <button class="btn btn-secondary btn-sm" onclick="changeComplianceMonth(1)">Next ▶</button>
              <button class="btn btn-ghost btn-sm" onclick="window._complianceMonth=9;window._complianceYear=2026;Router.go('admin-compliance');" style="font-size:11px;">Today</button>
            </div>
            <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap;">
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--red);"></span> Overdue</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--amber);"></span> Due</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--blue);"></span> Upcoming</span>
              <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:var(--green);"></span> Completed</span>
              <button class="btn btn-primary btn-sm" onclick="openAddComplianceModal('${selectedDateStr}')">+ Add Task</button>
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

              const dayTasks = items.filter(it => {
                return it.dateStr === dateStr || (it.day === String(dayNum) && it.month === curMonthShort && (it.year ? it.year === curYear : true));
              });

              return `
                <div class="calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectComplianceDate('${dateStr}')">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div class="calendar-day-num">${dayNum}</div>
                    ${dayTasks.length ? `<span style="font-size:10px;font-weight:700;color:var(--blue);">${dayTasks.length}</span>` : ''}
                  </div>
                  <div class="calendar-events-wrap">
                    ${dayTasks.slice(0, 2).map(t => {
                      const badgeClass = t.status === 'OVERDUE' ? 'overdue' : t.status === 'DUE' ? 'due' : t.status === 'COMPLETED' ? 'completed' : 'upcoming';
                      return `
                        <div class="calendar-event-pill ${badgeClass}" title="${escapeDocHtml(t.title)} (${t.status})">
                          <span>${t.status === 'COMPLETED' ? '✓' : '•'}</span>
                          <span>${escapeDocHtml(t.title)}</span>
                        </div>
                      `;
                    }).join('')}
                    ${dayTasks.length > 2 ? `
                      <div style="font-size:9px;color:var(--text-muted);font-weight:700;">+${dayTasks.length - 2} more</div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Selected Date Drawer -->
        <div class="calendar-selected-drawer">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:16px;font-weight:800;color:var(--text-primary);">
                📅 Scheduled Deadlines for ${new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${selectedDayItems.length} compliance item${selectedDayItems.length !== 1 ? 's' : ''} scheduled
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openAddComplianceModal('${selectedDateStr}')">+ Add Task on this Day</button>
          </div>

          ${selectedDayItems.length ? `
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${selectedDayItems.map(c => `
                <div style="display:flex;gap:14px;align-items:flex-start;padding:14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-lg);">
                  <div style="flex:1;">
                    <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;flex-wrap:wrap;">
                      <span class="badge badge-${c.status === 'OVERDUE' ? 'red' : c.status === 'DUE' ? 'amber' : c.status === 'COMPLETED' ? 'green' : 'blue'}">${c.status}</span>
                      <span class="badge badge-muted">${escapeDocHtml(c.category || c.cat)}</span>
                      ${c.authority ? `<span class="badge badge-purple">🏛️ ${escapeDocHtml(c.authority)}</span>` : ''}
                      ${c.recurring ? '<span class="badge badge-blue">🔄 Recurring</span>' : ''}
                      ${c.penaltyRisk ? `<span class="badge badge-red" style="font-size:10px;">⚠️ ${escapeDocHtml(c.penaltyRisk)}</span>` : ''}
                    </div>
                    <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">${escapeDocHtml(c.title)}</div>
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${escapeDocHtml(c.desc)}</div>
                    ${c.completedAt ? `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px;">✓ Completed on ${escapeDocHtml(c.completedAt)}</div>` : ''}
                    ${c.linkedDocId ? `
                      <div style="margin-top:6px;">
                        <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--blue);" onclick="openDocumentPreviewModal('${c.linkedDocId}')">
                          📄 View Linked Vault Document
                        </button>
                      </div>
                    ` : ''}
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;min-width:120px;">
                    ${c.status !== 'COMPLETED' ? `<button class="btn btn-primary btn-sm" onclick="markComplianceDone('${c.id}')">✅ Mark Done</button>` : `<span class="badge badge-green" style="text-align:center;">Done ✓</span>`}
                    <button class="btn btn-secondary btn-sm" onclick="openEditComplianceModal('${c.id}')">✏️ Edit</button>
                    <button class="btn btn-ghost btn-sm" style="font-size:11px;justify-content:center;" onclick="syncEventToGoogleCalendar({ title: 'Compliance: ${escapeDocHtml(c.title).replace(/'/g, "\\'")}', description: '${escapeDocHtml(c.desc||'').replace(/'/g, "\\'")}', startDate: '${c.dateStr}', allDay: true, eventType: 'COMPLIANCE' }, { openNow: true })">📅 Google Cal</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding:28px 16px;text-align:center;background:var(--bg-elevated);border-radius:var(--r-md);color:var(--text-muted);font-size:13px;">
              No compliance tasks scheduled for this day. Click <strong>+ Add Task on this Day</strong> to schedule a deadline.
            </div>
          `}
        </div>
      ` : `
        <!-- Filter Bar with Search and Categories -->
        <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
          <div class="search-box" style="flex:1;min-width:240px;">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search compliance deadlines, authority, laws..." value="${escapeDocHtml(searchQuery)}" oninput="onComplianceSearch(this.value)" />
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${['All', 'Governance', 'Finance', 'Safety', 'Legal', 'Operations'].map(cat => `
              <div class="filter-pill ${categoryFilter.toLowerCase() === cat.toLowerCase() ? 'active' : ''}" onclick="setComplianceCategoryFilter('${cat}')" style="cursor:pointer;font-size:12px;">
                ${cat}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="tabs" style="margin-bottom:16px;">
          ${['All', 'Overdue', 'Due (30d)', 'Completed'].map(t => {
            const count = t === 'All' ? items.length : t === 'Overdue' ? overdueCount : t === 'Due (30d)' ? (dueCount + upcomingCount) : completedCount;
            return `
              <div class="tab ${currentTab === t ? 'active' : ''}" onclick="setComplianceTab('${t}')" style="cursor:pointer;">
                ${t} (${count})
              </div>
            `;
          }).join('')}
        </div>

        <!-- Filtered List Cards -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${filteredItems.length ? filteredItems.map(c => `
            <div style="display:flex;gap:14px;align-items:flex-start;padding:16px;
              background:var(--bg-surface);border:1px solid ${c.status === 'OVERDUE' ? 'rgba(239,68,68,0.3)' : c.status === 'DUE' ? 'rgba(245,158,11,0.3)' : c.status === 'COMPLETED' ? 'rgba(16,185,129,0.3)' : 'var(--border)'};
              border-radius:var(--r-lg);box-shadow:var(--shadow-xs);transition:all 0.12s ease;"
              onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='var(--bg-surface)'">
              
              <!-- Date Callout Box -->
              <div style="text-align:center;min-width:58px;padding:10px 8px;
                background:${c.status === 'OVERDUE' ? 'var(--red-light)' : c.status === 'DUE' ? 'var(--amber-light)' : c.status === 'COMPLETED' ? 'var(--green-light)' : 'var(--bg-elevated)'};
                border-radius:var(--r-md);border:1px solid var(--border);">
                <div style="font-size:22px;font-weight:800;color:${c.status === 'OVERDUE' ? 'var(--red)' : c.status === 'DUE' ? 'var(--amber)' : c.status === 'COMPLETED' ? 'var(--green)' : 'var(--text-primary)'}">
                  ${c.day || '15'}
                </div>
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted)">${c.month || 'Oct'}</div>
              </div>

              <!-- Main Content -->
              <div style="flex:1;min-width:0;">
                <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;flex-wrap:wrap;">
                  <span class="badge badge-${c.status === 'OVERDUE' ? 'red' : c.status === 'DUE' ? 'amber' : c.status === 'COMPLETED' ? 'green' : 'muted'}">
                    ${c.status}
                  </span>
                  <span class="badge badge-muted">${escapeDocHtml(c.category || c.cat)}</span>
                  ${c.authority ? `<span class="badge badge-purple">🏛️ ${escapeDocHtml(c.authority)}</span>` : ''}
                  ${c.recurring ? '<span class="badge badge-blue">🔄 Recurring</span>' : ''}
                  ${c.penaltyRisk ? `<span class="badge badge-red" style="font-size:10px;">⚠️ Penalty: ${escapeDocHtml(c.penaltyRisk)}</span>` : ''}
                </div>
                <div style="font-size:15px;font-weight:700;margin-bottom:4px;color:var(--text-primary);">${escapeDocHtml(c.title)}</div>
                <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">${escapeDocHtml(c.desc)}</div>
                ${c.completedAt ? `<div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px;">✓ Completed on ${escapeDocHtml(c.completedAt)}</div>` : ''}
                ${c.linkedDocId ? `
                  <div style="margin-top:6px;">
                    <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--blue);" onclick="openDocumentPreviewModal('${c.linkedDocId}')">
                      📄 View Linked Vault Document (${escapeDocHtml(c.linkedDocId)})
                    </button>
                  </div>
                ` : ''}
              </div>

              <!-- Action Buttons -->
              <div style="display:flex;flex-direction:column;gap:6px;min-width:125px;">
                ${c.status !== 'COMPLETED' ? `
                  <button class="btn btn-primary btn-sm" style="justify-content:center;font-weight:600;" onclick="markComplianceDone('${c.id}')">✅ Mark Done</button>
                ` : `
                  <span class="badge badge-green" style="padding:6px 10px;justify-content:center;font-weight:700;">Completed ✓</span>
                `}
                <button class="btn btn-secondary btn-sm" style="justify-content:center;" onclick="openEditComplianceModal('${c.id}')">✏️ Edit</button>
                <button class="btn btn-ghost btn-sm" style="font-size:11px;justify-content:center;" onclick="syncEventToGoogleCalendar({ title: 'Compliance: ${escapeDocHtml(c.title).replace(/'/g, "\\'")}', description: '${escapeDocHtml(c.desc||'').replace(/'/g, "\\'")}', startDate: '${c.dateStr}', allDay: true, eventType: 'COMPLIANCE' }, { openNow: true })">📅 Google Cal</button>
                <button class="btn btn-ghost btn-sm" style="font-size:11px;justify-content:center;color:var(--red);" onclick="deleteComplianceItem('${c.id}')">🗑️ Delete</button>
              </div>
            </div>
          `).join('') : `
            <div class="card" style="text-align:center;padding:40px 20px;">
              <div style="font-size:32px;margin-bottom:8px;">✅</div>
              <div style="font-size:16px;font-weight:700;">No items found</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">No compliance deadlines match your current search and filter settings.</div>
              <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
                <button class="btn btn-secondary btn-sm" onclick="setComplianceTab('All'); setComplianceCategoryFilter('All'); onComplianceSearch('');">Reset Filters</button>
                <button class="btn btn-primary btn-sm" onclick="openAddComplianceModal()">+ Add New Deadline</button>
              </div>
            </div>
          `}
        </div>
      `}
    `,
  });
};

