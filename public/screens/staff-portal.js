// ============================================================
// SOCIETY STAFF & SECURITY GUARD PORTAL DASHBOARD
// ============================================================

window.Screens = window.Screens || {};

Screens['staff-dashboard'] = function() {
  let signedInRole = '';
  try { signedInRole = JSON.parse(localStorage.getItem('rwa_user') || '{}').role || ''; } catch (e) {}
  if (signedInRole === 'RESIDENT') {
    setTimeout(function() { if (typeof Router !== 'undefined') Router.go('resident-dashboard'); }, 0);
  }
  function tryLoadStaffPortal(attempts) {
    if (signedInRole === 'RESIDENT') return;
    attempts = attempts || 0;
    if (typeof window.loadLiveStaffPortal === 'function' && document.getElementById('staffPassesTableBody')) {
      window.loadLiveStaffPortal();
    } else if (attempts < 30) {
      setTimeout(function() { tryLoadStaffPortal(attempts + 1); }, 100);
    }
  }
  setTimeout(tryLoadStaffPortal, 50);

  let signedIn = {};
  try { signedIn = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch (e) {}
  const staffOnly = signedIn.role === 'STAFF';
  const actionsHtml = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      ${staffOnly ? '' : `
      <button class="btn btn-secondary btn-sm" onclick="Router.go('admin-dashboard')" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span>🛠️</span>
        <span>RWA Admin Portal</span>
      </button>
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-dashboard')" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span>🏠</span>
        <span>Resident Portal</span>
      </button>`}
      <button class="btn btn-primary btn-sm" onclick="window.loadLiveStaffPortal()" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:#18181B;border:none;">
        <span>🔄</span>
        <span id="staffRefreshLabel">Refresh</span>
      </button>
    </div>
  `;

  const contentHtml = `
    <div class="staff-portal" style="display:flex;flex-direction:column;gap:20px;">
      
      <!-- Top Guard Duty Identity Strip -->
      <div class="staff-hero" style="background:linear-gradient(135deg, #064E3B 0%, #0F172A 100%);color:#fff;border-radius:18px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;box-shadow:0 12px 30px -5px rgba(6,78,59,0.25);border:1px solid rgba(52,211,153,0.25);">
        <div class="staff-hero-main" style="display:flex;align-items:center;gap:18px;">
          <div id="staffHeroMark" style="width:60px;height:60px;border-radius:16px;background:rgba(52,211,153,0.18);border:2px solid #34D399;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">
            👮
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h2 id="staffHeroName" style="font-size:20px;font-weight:800;margin:0;color:#F0FDF4;">Security Guard</h2>
              <span id="staffHeroRole" style="background:rgba(52,211,153,0.2);color:#A7F3D0;border:1px solid rgba(52,211,153,0.4);font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:12px;">Gate Security</span>
              <span id="staffHeroSocietyBadge" style="background:rgba(59,130,246,0.3);color:#93C5FD;border:1px solid rgba(147,197,253,0.4);font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;">🏢 Society Campus</span>
              <span id="staffHeroStatusBadge" style="background:#10B981;color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:12px;">🟢 ON DUTY</span>
            </div>
            <div class="staff-hero-meta" style="display:flex;align-items:center;gap:16px;margin-top:6px;font-size:13px;color:#D1FAE5;flex-wrap:wrap;">
              <div>📍 <strong>Post:</strong> <span id="staffHeroPost">Not assigned</span></div>
              <div>⏰ <strong>Shift:</strong> <span id="staffHeroShift">Active Shift</span></div>
              <div>📞 <strong>Phone:</strong> <span id="staffHeroPhone">—</span></div>
            </div>
          </div>
        </div>

        <div class="staff-hero-action" style="display:flex;align-items:center;gap:12px;">
          <button id="staffSpotEntryBtn" class="btn btn-sm" onclick="window.openSpotEntryModal()" style="background:#10B981;color:#fff;border:none;border-radius:10px;font-weight:800;padding:10px 18px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
            <span>+</span>
            <span>Spot Visitor Entry</span>
          </button>
        </div>
      </div>

      <!-- Quick Fast-Pass Security Scanner / PIN Input -->
      <div class="staff-scanner" style="background:var(--bg-surface,#fff);border:2px solid #3B82F6;border-radius:16px;padding:20px 24px;box-shadow:0 8px 24px rgba(59,130,246,0.08);">
        <div class="staff-scanner-head" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            <span style="font-size:22px;">🔍</span>
            <div style="min-width:0;">
              <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Gate Fast-Verification &amp; Check-In</div>
              <div class="staff-scanner-help" style="font-size:12px;color:var(--text-secondary,#64748B);">Enter the 6-digit Pass Code (e.g. PASS-84920) or 4-digit PIN (e.g. 4821) or Visitor Phone</div>
            </div>
          </div>
          <span class="staff-scanner-chip" style="background:rgba(59,130,246,0.1);color:#2563EB;font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:8px;">Instant Resident Alert</span>
        </div>

        <div class="staff-scanner-row" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div class="staff-scanner-field" style="flex:1;min-width:240px;position:relative;">
            <input
              type="text"
              id="staffScannerInput"
              placeholder="Enter Pass Code (e.g. PASS-84920) or 4-digit PIN (e.g. 4821)..."
              onkeydown="if(event.key==='Enter')window.handleStaffQuickVerify()"
              style="width:100%;padding:12px 16px;font-size:15px;font-weight:700;border-radius:10px;border:1.5px solid #CBD5E1;color:#0F172A;letter-spacing:0.5px;background:#F8FAFC;"
            />
          </div>
          <button class="btn btn-primary" onclick="window.handleStaffQuickVerify()" style="padding:12px 24px;font-size:14px;font-weight:800;background:linear-gradient(135deg,#2563EB,#1D4ED8);border:none;border-radius:10px;display:inline-flex;align-items:center;gap:8px;">
            <span>✅ Verify &amp; Allow Entry</span>
          </button>
        </div>
        <div id="staffScannerResultBox" style="display:none;margin-top:14px;padding:12px 16px;border-radius:10px;"></div>
      </div>

      <!-- 3 Navigation Tabs: Passes at Gate, Duty & Shifts, Salary & Payouts -->
      <div class="staff-tabs" style="display:flex;gap:8px;border-bottom:2px solid var(--border,#E2E8F0);padding-bottom:10px;" id="staffPortalTabs">
        <button class="btn btn-sm btn-primary" onclick="window.switchStaffTab('passes', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>🎫 Gate Visitors Today (<span id="staffTabPassCount">--</span>)</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('duty', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>📅 My Shift &amp; Post</span>
        </button>
        <!-- Demo: salary tab hidden for now.
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('salary', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>💰 Salary, Dates &amp; Payouts</span>
        </button>
        -->
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('vehicles', this)" data-staff-tab="vehicles" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>Registered Vehicles</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('emergency', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>🚨 Intercom &amp; SOS</span>
        </button>
      </div>

      <!-- TAB 1: Passes at Gate -->
      <div id="staffTabContentPasses" class="staff-tab-view" style="display:flex;flex-direction:column;gap:16px;">
        <div class="staff-pass-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <h3 style="font-size:16px;font-weight:800;margin:0;color:var(--text-primary,#0F172A);">Expected &amp; Active Visitors</h3>
          <div class="staff-pass-filters" style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('ALL')" style="font-size:12px;font-weight:700;">All</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('APPROVED')" style="font-size:12px;font-weight:700;">🔵 Expected</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_IN')" style="font-size:12px;font-weight:700;">🟢 Inside</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_OUT')" style="font-size:12px;font-weight:700;">⚪ Departed</button>
          </div>
        </div>

        <div id="staffPassCards" class="staff-pass-cards"></div>
        <div class="staff-pass-table" style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table class="table" style="width:100%;border-collapse:collapse;margin:0;font-size:13px;">
              <thead>
                <tr style="background:#F8FAFC;border-bottom:1px solid var(--border,#E2E8F0);text-align:left;color:var(--text-secondary,#64748B);font-size:11.5px;text-transform:uppercase;">
                  <th style="padding:12px 16px;">Pass ID &amp; PIN</th>
                  <th style="padding:12px 16px;">Visitor Name &amp; Phone</th>
                  <th style="padding:12px 16px;">Destination Flat</th>
                  <th style="padding:12px 16px;">Type &amp; Vehicle</th>
                  <th style="padding:12px 16px;">Status</th>
                  <th style="padding:12px 16px;text-align:right;">Gate Action</th>
                </tr>
              </thead>
              <tbody id="staffPassesTableBody">
                <tr>
                  <td colspan="6" style="text-align:center;padding:30px;color:var(--text-secondary,#94A3B8);">
                    Loading gate entry passes...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="staffTabContentVehicles" class="staff-tab-view" style="display:none;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
          <div>
            <h3 style="font-size:16px;font-weight:800;margin:0;">Registered vehicles</h3>
            <div style="font-size:12px;color:#71717A;margin-top:4px;">Cars and bikes linked to society flats. Match the number plate at the gate.</div>
          </div>
          <input id="staffVehicleSearch" type="search" placeholder="Search plate, flat, or name" oninput="window.renderStaffVehicles()" style="min-width:220px;padding:10px 12px;border:1px solid #E4E4E7;border-radius:2px;" />
        </div>
        <div id="staffVehicleList" style="display:flex;flex-direction:column;gap:8px;">
          <div style="padding:18px;border:1px solid #E4E4E7;background:#fff;font-size:13px;color:#71717A;">Loading vehicles…</div>
        </div>
      </div>

      <!-- TAB 2: My Shift & Duty -->
      <div id="staffTabContentDuty" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div class="staff-duty-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          <!-- Duty Post Card -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <span style="font-size:24px;">📍</span>
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Assigned Duty Post</div>
                <div style="font-size:12px;color:var(--text-secondary,#64748B);">Today's deployment location</div>
              </div>
            </div>
            <div style="font-size:18px;font-weight:800;color:#2563EB;" id="dutyCardPost">Not assigned</div>
            <div style="font-size:12.5px;color:var(--text-secondary,#64748B);margin-top:4px;">Shown only when a duty post is saved for this guard</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#F1F5F9);display:flex;justify-content:space-between;font-size:12px;">
              <span>Campus Block:</span>
              <strong id="dutyCardBlock">Main Gate Perimeter</strong>
            </div>
          </div>

          <!-- Shift Timings Card -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <span style="font-size:24px;">⏰</span>
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Today's Shift Hours</div>
                <div style="font-size:12px;color:var(--text-secondary,#64748B);">Current shift duration</div>
              </div>
            </div>
            <div style="font-size:18px;font-weight:800;color:#10B981;" id="dutyCardTiming">Not set</div>
            <div style="font-size:12.5px;color:var(--text-secondary,#64748B);margin-top:4px;" id="dutyCardShiftName">Not set</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#F1F5F9);display:flex;justify-content:space-between;font-size:12px;">
              <span>Clock hours:</span>
              <strong id="dutyCardHoursNote">Not saved</strong>
            </div>
          </div>

          <!-- Supervisor & Relief Guard Card -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <span style="font-size:24px;">👥</span>
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Supervisor &amp; Handover</div>
                <div style="font-size:12px;color:var(--text-secondary,#64748B);">Relief guard on next shift</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;">
                <div>
                  <div style="font-weight:700;" id="dutyCardSupervisorName">Not assigned</div>
                  <div style="font-size:11px;color:#64748B;" id="dutyCardSupervisorRole">No supervisor on this shift</div>
                </div>
                <a id="dutyCardSupervisorCall" href="#" class="btn btn-sm btn-ghost" style="display:none;padding:4px 8px;font-size:12px;color:#18181B;">Call</a>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding-top:8px;border-top:1px dashed var(--border,#E2E8F0);">
                <div>
                  <div style="font-weight:700;" id="dutyCardReliefName">Not assigned</div>
                  <div style="font-size:11px;color:#64748B;" id="dutyCardReliefRole">No relief guard on record</div>
                </div>
                <a id="dutyCardReliefCall" href="#" class="btn btn-sm btn-ghost" style="display:none;padding:4px 8px;font-size:12px;color:#18181B;">Call</a>
              </div>
            </div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;">
          <h4 style="font-size:14px;font-weight:800;margin:0 0 12px 0;">Assigned shift</h4>
          <div id="staffWeeklyRoster" style="font-size:13px;color:#3F3F46;">Loading the shift on record…</div>
        </div>
      </div>

      <!-- TAB 3: Salary, Dates & Payouts -->
      <div id="staffTabContentSalary" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div class="staff-salary-grid metric-pair">
          <!-- Monthly Salary -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Monthly Fixed Salary</div>
            <div style="font-size:26px;font-weight:900;color:#0F172A;margin-top:6px;" id="salaryCardMonthly">—</div>
            <div style="font-size:12px;color:#71717A;font-weight:700;margin-top:4px;">Amount saved on the staff record</div>
          </div>

          <!-- Salary Payout Date -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Salary Payout Date</div>
            <div style="font-size:22px;font-weight:800;color:#18181B;margin-top:6px;" id="salaryCardDate">—</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Next credit: <strong id="salaryCardNextDate">—</strong></div>
          </div>

          <!-- Payment Status -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Current Payment Status</div>
            <div style="margin-top:6px;">
              <span id="salaryCardStatusBadge" style="background:#F4F4F5;color:#18181B;border:1px solid #E4E4E7;font-size:14px;font-weight:800;padding:4px 12px;border-radius:2px;display:inline-block;">—</span>
            </div>
            <div style="font-size:12px;color:#64748B;margin-top:6px;">Last credited on: <strong id="salaryCardLastPaid">Not recorded</strong></div>
          </div>

          <!-- Attendance This Month -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Attendance This Month</div>
            <div style="font-size:24px;font-weight:800;color:#18181B;margin-top:6px;" id="salaryCardAttendance">Not recorded</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Attendance has not been saved</div>
          </div>
        </div>

        <div id="staffSalaryCredits" style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;">
          <div style="font-size:15px;font-weight:800;color:#18181B;">Money credited</div>
          <div style="font-size:12px;color:#71717A;margin-top:4px;">Each confirmed salary disbursement appears here.</div>
        </div>

        <!-- Detailed Salary Breakdown Slip -->
        <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:22px;">
          <div class="staff-slip-head" style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border,#F1F5F9);padding-bottom:12px;margin-bottom:16px;">
            <div>
              <h4 style="font-size:15px;font-weight:800;margin:0;color:#0F172A;">Monthly Salary Slip &amp; Breakdown</h4>
              <div style="font-size:12px;color:#64748B;margin-top:2px;">Only the monthly salary entered for this guard</div>
            </div>
            <div style="font-size:12.5px;color:#3F3F46;font-weight:700;" id="salaryCardBank">
              No bank or UPI saved
            </div>
          </div>

          <div class="staff-slip-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <!-- Earnings -->
            <div>
              <div style="font-size:12px;font-weight:800;color:#10B981;text-transform:uppercase;margin-bottom:8px;">Earnings (+)</div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>Monthly salary:</span>
                  <strong id="slipBasic">Not set</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>Allowance:</span>
                  <strong id="slipAllowance">Not added</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>Bonus:</span>
                  <strong id="slipBonus">Not added</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #E2E8F0;font-weight:800;">
                  <span>Gross Earnings:</span>
                  <span id="slipGross" style="color:#18181B;">Not set</span>
                </div>
              </div>
            </div>

            <!-- Deductions -->
            <div>
              <div style="font-size:12px;font-weight:800;color:#EF4444;text-transform:uppercase;margin-bottom:8px;">Deductions (-)</div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>Provident Fund (PF):</span>
                  <strong id="slipPf">Not added</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>ESI:</span>
                  <strong id="slipEsi">Not added</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #E2E8F0;font-weight:800;">
                  <span>Total Deductions:</span>
                  <span id="slipDeduction" style="color:#18181B;">₹0</span>
                </div>
              </div>
            </div>
          </div>

          <div class="staff-slip-net" style="background:#F8FAFC;border-radius:10px;padding:14px 18px;margin-top:18px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;color:#64748B;font-weight:700;">NET TAKE-HOME PAY</div>
              <div style="font-size:22px;font-weight:900;color:#0F172A;" id="slipNet">Not set</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="if(typeof showToast==='function')showToast('Salary slip downloaded as PDF', 'success');" style="font-weight:700;">
              📥 Download Salary Slip
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 4: Intercom & Emergency SOS -->
      <div id="staffTabContentEmergency" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div id="staffIntercomList" class="staff-intercom" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
          <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;font-size:13px;color:#3F3F46;">Loading society contacts…</div>
        </div>
      </div>

      <div id="staffTabContentCleaning" class="staff-tab-view" style="display:none;flex-direction:column;gap:14px;">
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;">Cleaning round</h3>
          <div style="font-size:12px;color:#64748B;margin-bottom:12px;">Mark the areas finished on this shift. The list is saved on this staff record.</div>
          <div id="staffCleaningList" style="display:flex;flex-direction:column;gap:8px;"></div>
          <button type="button" class="btn btn-primary btn-sm" style="margin-top:12px;background:#18181B;border:none;" onclick="window.saveStaffRound('cleaning')">Save cleaning round</button>
        </div>
      </div>

      <div id="staffTabContentGarden" class="staff-tab-view" style="display:none;flex-direction:column;gap:14px;">
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;">Garden round</h3>
          <div style="font-size:12px;color:#64748B;margin-bottom:12px;">Mark the garden areas covered today.</div>
          <div id="staffGardenList" style="display:flex;flex-direction:column;gap:8px;"></div>
          <button type="button" class="btn btn-primary btn-sm" style="margin-top:12px;background:#18181B;border:none;" onclick="window.saveStaffRound('garden')">Save garden round</button>
        </div>
      </div>

      <div id="staffTabContentJobs" class="staff-tab-view" style="display:none;flex-direction:column;gap:14px;">
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;">Work orders</h3>
          <div style="font-size:12px;color:#64748B;margin-bottom:12px;">Open complaints for this department. Start a job or mark it done.</div>
          <div id="staffJobsList" style="display:flex;flex-direction:column;gap:8px;">Loading work orders…</div>
        </div>
      </div>

      <div id="staffTabContentOffice" class="staff-tab-view" style="display:none;flex-direction:column;gap:14px;">
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;">Society notices</h3>
          <div id="staffOfficeNotices" style="display:flex;flex-direction:column;gap:8px;">Loading notices…</div>
        </div>
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;">Open tickets</h3>
          <div id="staffOfficeJobs" style="display:flex;flex-direction:column;gap:8px;">Loading tickets…</div>
        </div>
      </div>

    </div>
  `;

  return Shell.render('staff-dashboard', {
    title: 'Staff & Guard Portal',
    portal: 'staff',
    breadcrumb: 'Gate Operations',
    actions: actionsHtml,
    content: contentHtml,
  });
};

// ============================================================
// STAFF PORTAL CLIENT LOGIC & PASS VERIFICATION
// ============================================================

window.__staffPortalData = null;
window.__staffPortalPassFilter = 'ALL';

// Returns the active guard's display name including their post
window.getActiveGuardName = function() {
  const data = window.__staffPortalData;
  if (data && data.staff && data.staff.name) {
    const post = (data.duty && data.duty.currentPost) ? data.duty.currentPost : '';
    return post ? `${data.staff.name} (${post})` : data.staff.name;
  }
  // Fallback to localStorage user
  try {
    const u = JSON.parse(localStorage.getItem('rwa_user') || '{}');
    if (u.name) return u.name;
  } catch(e) {}
  return 'Gate Security Guard';
};

// loadLiveStaffPortal is defined in live-features.js (loads after this file and has full UI population)

window.renderStaffPortalUI = function(data) {
  const staff = data.staff || {};
  const duty = data.duty || {};
  const salary = data.salary || {};
  const society = data.society || {};
  const passes = (data.passes && data.passes.list) || [];

  // Hero strip
  const elName = document.getElementById('staffHeroName');
  const elRole = document.getElementById('staffHeroRole');
  const elPost = document.getElementById('staffHeroPost');
  const elShift = document.getElementById('staffHeroShift');
  const elPhone = document.getElementById('staffHeroPhone');
  const elSociety = document.getElementById('staffHeroSocietyBadge');
  const elStatus = document.getElementById('staffHeroStatusBadge');

  if (elName) elName.textContent = staff.name || 'Security Guard';
  if (elRole) elRole.textContent = staff.role || 'Senior Security Guard';
  if (elPost) elPost.textContent = duty.currentPost || staff.locationPost || 'Not assigned';
  if (elShift) elShift.textContent = duty.timing ? `${duty.currentShift || 'Shift'} (${duty.timing})` : (duty.currentShift || staff.shiftName || 'Not set');
  if (elPhone) elPhone.textContent = staff.phone || '—';
  if (elSociety) elSociety.textContent = `🏢 ${society.name || 'Society Campus'}`;
  if (elStatus) {
    const s = staff.status || 'ON_DUTY';
    elStatus.textContent = s === 'ON_DUTY' ? '🟢 ON DUTY' : (s === 'UPCOMING' ? '⏳ UPCOMING' : s === 'OFF_DUTY' ? '⏸️ OFF DUTY' : '🏖️ ON LEAVE');
  }

  // Duty tab cards
  const elDPost = document.getElementById('dutyCardPost');
  const elDBlock = document.getElementById('dutyCardBlock');
  const elDTiming = document.getElementById('dutyCardTiming');
  const elDShiftName = document.getElementById('dutyCardShiftName');
  const elDSup = document.getElementById('dutyCardSupervisorName');
  const elDRelief = document.getElementById('dutyCardReliefName');

  if (elDPost) elDPost.textContent = duty.currentPost || staff.locationPost || 'Not assigned';
  if (elDBlock) elDBlock.textContent = duty.currentBlock || staff.blockName || 'Not set';
  if (elDTiming) elDTiming.textContent = duty.timing || 'Not set';
  if (elDShiftName) elDShiftName.textContent = duty.currentShift || staff.shiftName || 'Not set';
  if (elDSup) elDSup.textContent = (duty.supervisor && duty.supervisor.name) ? duty.supervisor.name : 'Not assigned';
  if (elDRelief) elDRelief.textContent = (duty.reliefGuard && duty.reliefGuard.name) ? duty.reliefGuard.name : 'Not assigned';

  // Salary tab cards
  const elSMon = document.getElementById('salaryCardMonthly');
  const elSDate = document.getElementById('salaryCardDate');
  const elSNext = document.getElementById('salaryCardNextDate');
  const elSLast = document.getElementById('salaryCardLastPaid');
  const elSAtt = document.getElementById('salaryCardAttendance');

  if (elSMon) elSMon.textContent = salary.monthlySalary ? `₹${Number(salary.monthlySalary).toLocaleString('en-IN')}` : '₹—';
  if (elSDate) elSDate.textContent = salary.salaryDate && salary.salaryDate !== '—' ? salary.salaryDate : 'Not set';
  if (elSNext) elSNext.textContent = salary.nextSalaryCredit && salary.nextSalaryCredit !== '—' ? salary.nextSalaryCredit : 'Not set';
  if (elSLast) elSLast.textContent = salary.lastPaidDate || '—';
  if (elSAtt) elSAtt.textContent = salary.attendanceTotal ? `${salary.attendancePresent || 0} / ${salary.attendanceTotal} Days (${salary.attendancePercent || 0}%)` : '—';

  const elBasic = document.getElementById('slipBasic');
  const elAllow = document.getElementById('slipAllowance');
  const elBonus = document.getElementById('slipBonus');
  const elGross = document.getElementById('slipGross');
  const elNet = document.getElementById('slipNet');

  const pay = Number(salary.monthlySalary) > 0 ? `₹${Number(salary.monthlySalary).toLocaleString('en-IN')}` : 'Not set';
  if (elBasic) elBasic.textContent = pay;
  if (elAllow) elAllow.textContent = 'Not added';
  if (elBonus) elBonus.textContent = 'Not added';
  const elPf = document.getElementById('slipPf');
  const elEsi = document.getElementById('slipEsi');
  const elDed = document.getElementById('slipDeduction');
  if (elPf) elPf.textContent = 'Not added';
  if (elEsi) elEsi.textContent = 'Not added';
  if (elDed) elDed.textContent = '₹0';
  if (elGross) elGross.textContent = pay;
  if (elNet) elNet.textContent = pay;

  // Passes Tab
  const elCount = document.getElementById('staffTabPassCount');
  if (elCount) elCount.textContent = passes.length;

  window.renderStaffPassesTable(passes);
};

window.switchStaffTab = function(tabName, btnEl) {
  const allViews = document.querySelectorAll('.staff-tab-view');
  allViews.forEach(v => v.style.display = 'none');

  const target = document.getElementById('staffTabContent' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  if (target) target.style.display = 'flex';

  const container = document.getElementById('staffPortalTabs');
  if (container) {
    const btns = container.querySelectorAll('button');
    btns.forEach(b => {
      b.classList.remove('btn-primary');
      b.classList.add('btn-secondary');
    });
  }
  if (btnEl) {
    btnEl.classList.remove('btn-secondary');
    btnEl.classList.add('btn-primary');
  }
};

window.filterStaffPasses = function(status) {
  window.__staffPortalPassFilter = status;
  const passes = (window.__staffPortalData && window.__staffPortalData.passes && window.__staffPortalData.passes.list) || [];
  let filtered = [...passes];
  if (status !== 'ALL') {
    filtered = filtered.filter(p => p.status === status);
  }
  window.renderStaffPassesTable(filtered);
};

window.renderStaffPassesTable = function(passes) {
  const tbody = document.getElementById('staffPassesTableBody');
  if (!tbody) return;

  if (!passes || passes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:35px 20px;color:#64748B;">
          <div style="font-size:28px;margin-bottom:8px;">📋</div>
          <div style="font-weight:700;font-size:14px;color:#1E293B;">No gate entry passes found</div>
          <div style="font-size:12px;color:#94A3B8;margin-top:4px;">No visitors match the current filter. Click "+ Spot Visitor Entry" to register a walk-in.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = passes.map(p => {
    let statusPill = '';
    if (p.status === 'CHECKED_IN') {
      statusPill = `<span style="background:#DCFCE7;color:#166534;font-size:11px;font-weight:800;padding:2px 8px;border-radius:10px;">🟢 INSIDE</span>`;
    } else if (p.status === 'APPROVED') {
      statusPill = `<span style="background:#DBEAFE;color:#1E40AF;font-size:11px;font-weight:800;padding:2px 8px;border-radius:10px;">🔵 EXPECTED</span>`;
    } else if (p.status === 'CHECKED_OUT') {
      statusPill = `<span style="background:#F1F5F9;color:#64748B;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">⚪ CHECKED OUT</span>`;
    } else {
      statusPill = `<span style="background:#FEE2E2;color:#991B1B;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${p.status}</span>`;
    }

    return `
      <tr style="border-bottom:1px solid #F1F5F9;">
        <td style="padding:12px 16px;">
          <div style="font-weight:800;font-family:monospace;color:#0F172A;">${p.passCode}</div>
          <div style="font-size:11px;color:#64748B;font-weight:700;">PIN: <span style="background:#F1F5F9;padding:1px 4px;border-radius:4px;color:#0F172A;">${p.otpPin}</span></div>
        </td>
        <td style="padding:12px 16px;">
          <div style="font-weight:700;color:#0F172A;">${p.visitorName}</div>
          <div style="font-size:11.5px;color:#64748B;">📞 ${p.visitorPhone || 'N/A'}</div>
        </td>
        <td style="padding:12px 16px;">
          <div style="font-weight:800;color:#2563EB;">🏠 Flat ${p.residentUnit}</div>
          <div style="font-size:11.5px;color:#64748B;">${p.residentName || 'Resident'}</div>
        </td>
        <td style="padding:12px 16px;">
          <div style="font-size:12px;font-weight:700;color:#0F172A;">${p.visitorType}</div>
          <div style="font-size:11.5px;color:#64748B;">${p.vehicleNumber ? '🚗 ' + p.vehicleNumber : '🚶 On foot'}</div>
        </td>
        <td style="padding:12px 16px;">
          ${statusPill}
        </td>
        <td style="padding:12px 16px;text-align:right;">
          ${p.status === 'APPROVED' ? `
            <button class="btn btn-sm btn-success" onclick="window.staffCheckIn('${p.id}')" style="background:#10B981;color:#fff;border:none;font-weight:800;padding:5px 12px;border-radius:6px;font-size:12px;">
              ✅ Check In
            </button>
          ` : ''}
          ${p.status === 'CHECKED_IN' ? `
            <button class="btn btn-sm btn-warning" onclick="window.staffCheckOut('${p.id}')" style="background:#F59E0B;color:#0F172A;border:none;font-weight:800;padding:5px 12px;border-radius:6px;font-size:12px;">
              🚪 Check Out
            </button>
          ` : ''}
          ${p.status === 'CHECKED_OUT' ? `
            <span style="font-size:11px;color:#94A3B8;">Completed</span>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
};

// Fast Scanner Verification Action
window.handleStaffQuickVerify = async function() {
  const input = document.getElementById('staffScannerInput');
  const code = input ? input.value.trim() : '';
  const resultBox = document.getElementById('staffScannerResultBox');

  if (!code) {
    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.style.background = '#FEF2F2';
      resultBox.style.color = '#991B1B';
      resultBox.textContent = '⚠️ Please enter a Pass Code (PASS-XXXXX) or 4-digit Security PIN';
    }
    return;
  }

  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick_verify',
        passCodeOrPin: code,
        guardName: window.getActiveGuardName(),
        locationPost: (window.__staffPortalData && window.__staffPortalData.duty && window.__staffPortalData.duty.currentPost) || 'Gate 1 - Main Entrance',
      }),
    }) : fetch('/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick_verify',
        passCodeOrPin: code,
        guardName: window.getActiveGuardName(),
        locationPost: (window.__staffPortalData && window.__staffPortalData.duty && window.__staffPortalData.duty.currentPost) || 'Gate 1 - Main Entrance',
      }),
    }));

    const data = await res.json();
    if (data.success && data.pass) {
      if (input) input.value = '';
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = '#DCFCE7';
        resultBox.style.color = '#166534';
        resultBox.innerHTML = `
          <div style="font-size:14px;font-weight:800;">🎉 ENTRY GRANTED &amp; VERIFIED!</div>
          <div style="font-size:13px;margin-top:2px;">
            <strong>${data.pass.visitorName}</strong> (${data.pass.visitorType}) verified for <strong>Flat ${data.pass.residentUnit}</strong> (Host: ${data.pass.residentName}).
            Resident has received instant arrival alert.
          </div>
        `;
      }
      if (typeof showToast === 'function') showToast(`Entry Granted for ${data.pass.visitorName}!`, 'success');
      window.loadLiveStaffPortal();
    } else {
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = '#FEF2F2';
        resultBox.style.color = '#991B1B';
        resultBox.innerHTML = `❌ ${data.error || 'Invalid Pass Code or PIN. Please verify with resident.'}`;
      }
    }
  } catch (err) {
    console.error(err);
  }
};

window.staffCheckIn = async function(passId) {
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_in', guardName: window.getActiveGuardName() }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_in', guardName: window.getActiveGuardName() }),
    }));

    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Visitor marked Checked-In!', 'success');
      window.loadLiveStaffPortal();
    }
  } catch (e) {
    console.error(e);
  }
};

window.staffCheckOut = async function(passId) {
  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_out', guardName: window.getActiveGuardName() }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_out', guardName: window.getActiveGuardName() }),
    }));

    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') showToast('Visitor marked Checked-Out!', 'info');
      window.loadLiveStaffPortal();
    }
  } catch (e) {
    console.error(e);
  }
};

// Spot Visitor Entry Modal for walk-ins
window.openSpotEntryModal = function() {
  const modalHtml = `
    <form id="spotEntryForm" onsubmit="window.handleSpotEntrySubmit(event)" style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Full Name *</label>
        <input type="text" id="spotVisitorName" required class="form-control" placeholder="e.g. Subhash Chand" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Mobile *</label>
          <input type="tel" id="spotVisitorPhone" required class="form-control" placeholder="e.g. 9812345678" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visitor Type</label>
          <select id="spotVisitorType" class="form-select" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;">
            <option value="GUEST">👥 Guest</option>
            <option value="DELIVERY">📦 Delivery</option>
            <option value="CAB">🚖 Cab</option>
            <option value="SERVICE">🔧 Service</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Visiting Flat *</label>
          <input type="text" id="spotFlatNumber" required class="form-control" placeholder="e.g. A-402" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
        <div>
          <label class="form-label" style="font-weight:700;font-size:12px;">Vehicle No (Optional)</label>
          <input type="text" id="spotVehicleNo" class="form-control" placeholder="e.g. CH 01 AB 1234" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
        </div>
      </div>

      <div>
        <label class="form-label" style="font-weight:700;font-size:12px;">Purpose of Visit</label>
        <input type="text" id="spotPurpose" class="form-control" placeholder="e.g. Personal visit, parcel drop" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;" />
      </div>

      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:8px;padding:10px 12px;font-size:11.5px;color:#166534;">
        Submitting this spot entry will instantly mark the visitor as <strong>Checked-In at Gate 1</strong> and dispatch a notification to the flat resident.
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm" style="font-weight:700;background:#10B981;border:none;">
          ✅ Log &amp; Allow In
        </button>
      </div>
    </form>
  `;

  if (typeof Modal !== 'undefined' && Modal.open) {
    Modal.open({
      title: '👮 Walk-In / Spot Gate Entry',
      body: modalHtml,
    });
  }
};

window.handleSpotEntrySubmit = async function(e) {
  e.preventDefault();
  const visitorName = document.getElementById('spotVisitorName')?.value;
  const visitorPhone = document.getElementById('spotVisitorPhone')?.value;
  const visitorType = document.getElementById('spotVisitorType')?.value;
  const residentUnit = document.getElementById('spotFlatNumber')?.value;
  const vehicleNumber = document.getElementById('spotVehicleNo')?.value;
  const purpose = document.getElementById('spotPurpose')?.value;
  const guardName = window.getActiveGuardName();
  const gatePost = (window.__staffPortalData && window.__staffPortalData.duty && window.__staffPortalData.duty.currentPost) || 'Gate 1 - Main Entrance';

  try {
    const res = await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName,
        visitorPhone,
        visitorType,
        residentUnit,
        vehicleNumber,
        purpose,
        gateNumber: gatePost,
        notes: `Walk-in spot registered by ${guardName}`,
      }),
    }) : fetch('/api/entry-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName,
        visitorPhone,
        visitorType,
        residentUnit,
        vehicleNumber,
        purpose,
        gateNumber: gatePost,
        notes: `Walk-in spot registered by ${guardName}`,
      }),
    }));

    const data = await res.json();
    if (data.success && data.pass) {
      // Auto check in
      await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.pass.id, action: 'check_in', guardName }),
      }) : fetch('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.pass.id, action: 'check_in', guardName }),
      }));

      if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
      if (typeof showToast === 'function') showToast(`Spot entry logged for ${visitorName}!`, 'success');
      window.loadLiveStaffPortal();
    }
  } catch (err) {
    console.error(err);
  }
};

function staffSectionShell(screen, title, content) {
  return Shell.render(screen, {
    title: title,
    portal: 'staff',
    breadcrumb: 'Staff & Guard',
    content: content,
  });
}

Screens['staff-passes'] = function() {
  setTimeout(function() {
    if (typeof window.loadLiveStaffPortal === 'function') window.loadLiveStaffPortal();
  }, 50);
  return staffSectionShell('staff-passes', 'All Society Passes', `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="font-size:16px;font-weight:800;margin:0;">Visitor passes for this society</h3>
          <div style="font-size:12px;color:#71717A;margin-top:4px;">Check a visitor in or out. Creating and editing society rules stays with the office.</div>
        </div>
        <div class="staff-pass-filters" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('ALL')">All</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('APPROVED')">Expected</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_IN')">Inside</button>
          <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_OUT')">Departed</button>
        </div>
      </div>
      <div id="staffPassCards" class="staff-pass-cards"></div>
      <div class="staff-pass-table" style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;overflow:auto;">
        <table class="table" style="width:100%;border-collapse:collapse;margin:0;font-size:13px;">
          <thead>
            <tr style="background:#F4F4F5;text-align:left;color:#71717A;font-size:11px;text-transform:uppercase;">
              <th style="padding:12px 16px;">Pass</th>
              <th style="padding:12px 16px;">Visitor</th>
              <th style="padding:12px 16px;">Flat</th>
              <th style="padding:12px 16px;">Type</th>
              <th style="padding:12px 16px;">Status</th>
              <th style="padding:12px 16px;text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody id="staffPassesTableBody">
            <tr><td colspan="6" style="padding:24px;text-align:center;color:#71717A;">Loading passes…</td></tr>
          </tbody>
        </table>
      </div>
      <span id="staffTabPassCount" style="display:none;">0</span>
    </div>
  `);
};

Screens['staff-roster'] = function() {
  setTimeout(function() {
    if (typeof window.loadStaffRoster === 'function') window.loadStaffRoster();
  }, 50);
  return staffSectionShell('staff-roster', 'Campus Duty Roster', `
    <div id="staffRosterList" style="font-size:13px;color:#3F3F46;">Loading the roster on record…</div>
  `);
};

window.loadStaffRoster = async function() {
  const box = document.getElementById('staffRosterList');
  if (!box) return;
  const esc = function(value) {
    return String(value || '').replace(/[&<>"]/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch];
    });
  };
  try {
    const res = await (window.apiFetch || fetch)('/api/staff/duty');
    const data = res && res.ok ? await res.json() : {};
    const duties = data.duties || [];
    if (!duties.length) {
      box.textContent = 'No duty roster has been saved for this society yet.';
      return;
    }
    box.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">' + duties.map(function(d) {
      const hours = d.startTime && d.endTime ? (d.startTime + ' – ' + d.endTime) : 'Hours not set';
      const post = d.locationPost && d.locationPost !== 'Not assigned' ? d.locationPost : 'Post not set';
      return '<div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">'
        + '<div style="font-weight:800;">' + esc(d.staffName) + '</div>'
        + '<div style="font-size:12px;color:#71717A;margin-top:2px;">' + esc(d.role || d.category || 'Staff') + '</div>'
        + '<div style="margin-top:10px;font-size:13px;">' + esc(post) + '</div>'
        + '<div style="font-size:13px;color:#3F3F46;">' + esc(d.shiftName || 'Shift not set') + ' · ' + esc(hours) + '</div>'
        + '<div style="margin-top:8px;font-size:12px;font-weight:700;">' + esc(d.status || '') + '</div>'
        + (d.phone ? '<a href="tel:' + String(d.phone).replace(/[^\d+]/g, '') + '" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#18181B;">Call</a>' : '')
        + '</div>';
    }).join('') + '</div>';
  } catch (err) {
    box.textContent = 'The roster could not be loaded.';
  }
};

Screens['staff-intercom'] = function() {
  setTimeout(function() {
    if (typeof window.loadStaffIntercom === 'function') window.loadStaffIntercom();
  }, 50);
  return staffSectionShell('staff-intercom', 'Emergency Intercom', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:13px;color:#3F3F46;">Society contacts saved by the office, plus the national emergency numbers.</div>
      <div id="staffIntercomList" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
        <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:18px;">Loading contacts…</div>
      </div>
    </div>
  `);
};

Screens['staff-settings'] = function() {
  let user = {};
  try { user = JSON.parse(localStorage.getItem('rwa_user') || '{}'); } catch (e) {}
  const name = user.name || 'Guard';
  const phone = user.phone || 'Not on record';
  const society = (user.organization && user.organization.name) || localStorage.getItem('rwa_active_org_name') || 'This society';
  const esc = function(value) {
    return String(value || '').replace(/[&<>"]/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch];
    });
  };
  return staffSectionShell('staff-settings', 'Settings', `
    <div class="metric-pair" style="max-width:760px;">
      <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
        <div style="font-size:12px;color:#71717A;font-weight:700;">Name</div>
        <div style="font-size:16px;font-weight:800;margin-top:4px;">${esc(name)}</div>
      </div>
      <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
        <div style="font-size:12px;color:#71717A;font-weight:700;">Phone</div>
        <div style="font-size:16px;font-weight:800;margin-top:4px;">${esc(phone)}</div>
      </div>
      <div style="background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;">
        <div style="font-size:12px;color:#71717A;font-weight:700;">Society</div>
        <div style="font-size:16px;font-weight:800;margin-top:4px;">${esc(society)}</div>
      </div>
    </div>
    <div style="margin-top:14px;background:#fff;border:1px solid #E4E4E7;border-radius:2px;padding:16px;max-width:760px;font-size:13px;color:#3F3F46;">
      Your login PIN and shift are changed by the society office from Staff Management. This page does not open the admin settings.
    </div>
    <button class="btn btn-primary" style="margin-top:14px;background:#18181B;border:none;" onclick="window.handleSignOut()">Sign out</button>
  `);
};
