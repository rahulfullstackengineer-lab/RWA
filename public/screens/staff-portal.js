// ============================================================
// SOCIETY STAFF & SECURITY GUARD PORTAL DASHBOARD
// ============================================================

window.Screens = window.Screens || {};

Screens['staff-dashboard'] = function() {
  setTimeout(() => {
    if (typeof window.loadLiveStaffPortal === 'function') {
      window.loadLiveStaffPortal();
    }
  }, 50);

  const actionsHtml = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="Router.go('admin-dashboard')" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span>🛠️</span>
        <span>RWA Admin Portal</span>
      </button>
      <button class="btn btn-secondary btn-sm" onclick="Router.go('resident-dashboard')" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
        <span>🏠</span>
        <span>Resident Portal</span>
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.loadLiveStaffPortal()" style="font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:#10B981;border:none;">
        <span>🔄</span>
        <span>Refresh Gate</span>
      </button>
    </div>
  `;

  const contentHtml = `
    <div style="display:flex;flex-direction:column;gap:20px;">
      
      <!-- Top Guard Duty Identity Strip -->
      <div style="background:linear-gradient(135deg, #064E3B 0%, #0F172A 100%);color:#fff;border-radius:18px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;box-shadow:0 12px 30px -5px rgba(6,78,59,0.25);border:1px solid rgba(52,211,153,0.25);">
        <div style="display:flex;align-items:center;gap:18px;">
          <div style="width:60px;height:60px;border-radius:16px;background:rgba(52,211,153,0.18);border:2px solid #34D399;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">
            👮
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h2 id="staffHeroName" style="font-size:20px;font-weight:800;margin:0;color:#F0FDF4;">Ram Singh</h2>
              <span id="staffHeroRole" style="background:rgba(52,211,153,0.2);color:#A7F3D0;border:1px solid rgba(52,211,153,0.4);font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:12px;">Senior Security Guard</span>
              <span style="background:#10B981;color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:12px;">🟢 ON DUTY</span>
            </div>
            <div style="display:flex;align-items:center;gap:16px;margin-top:6px;font-size:13px;color:#D1FAE5;flex-wrap:wrap;">
              <div>📍 <strong>Gate:</strong> <span id="staffHeroPost">Gate 1 - Main Entrance</span></div>
              <div>⏰ <strong>Shift:</strong> <span id="staffHeroShift">Morning Shift (06:00 AM - 02:00 PM)</span></div>
              <div>📞 <strong>Phone:</strong> <span id="staffHeroPhone">9876543210</span></div>
            </div>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:12px;">
          <button class="btn btn-sm" onclick="window.openSpotEntryModal()" style="background:#10B981;color:#fff;border:none;border-radius:10px;font-weight:800;padding:10px 18px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
            <span>+</span>
            <span>Spot Visitor Entry</span>
          </button>
        </div>
      </div>

      <!-- Quick Fast-Pass Security Scanner / PIN Input -->
      <div style="background:var(--bg-surface,#fff);border:2px solid #3B82F6;border-radius:16px;padding:20px 24px;box-shadow:0 8px 24px rgba(59,130,246,0.08);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:22px;">🔍</span>
            <div>
              <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Gate Fast-Verification &amp; Check-In</div>
              <div style="font-size:12px;color:var(--text-secondary,#64748B);">Enter the 6-digit Pass Code (e.g. PASS-84920) or 4-digit PIN (e.g. 4821) or Visitor Phone</div>
            </div>
          </div>
          <span style="background:rgba(59,130,246,0.1);color:#2563EB;font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:8px;">Instant Resident Alert</span>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;position:relative;">
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
      <div style="display:flex;gap:8px;border-bottom:2px solid var(--border,#E2E8F0);padding-bottom:10px;" id="staffPortalTabs">
        <button class="btn btn-sm btn-primary" onclick="window.switchStaffTab('passes', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>🎫 Gate Visitors Today (<span id="staffTabPassCount">--</span>)</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('duty', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>📅 My Shift &amp; Post</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('salary', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>💰 Salary, Dates &amp; Payouts</span>
        </button>
        <button class="btn btn-sm btn-secondary" onclick="window.switchStaffTab('emergency', this)" style="font-weight:700;border-radius:8px;padding:8px 16px;">
          <span>🚨 Intercom &amp; SOS</span>
        </button>
      </div>

      <!-- TAB 1: Passes at Gate -->
      <div id="staffTabContentPasses" class="staff-tab-view" style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <h3 style="font-size:16px;font-weight:800;margin:0;color:var(--text-primary,#0F172A);">Expected &amp; Active Visitors at Gate 1</h3>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('ALL')" style="font-size:12px;font-weight:700;">All</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('APPROVED')" style="font-size:12px;font-weight:700;">🔵 Expected</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_IN')" style="font-size:12px;font-weight:700;">🟢 Inside</button>
            <button class="btn btn-sm btn-secondary" onclick="window.filterStaffPasses('CHECKED_OUT')" style="font-size:12px;font-weight:700;">⚪ Departed</button>
          </div>
        </div>

        <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;overflow:hidden;">
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

      <!-- TAB 2: My Shift & Duty -->
      <div id="staffTabContentDuty" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          <!-- Duty Post Card -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <span style="font-size:24px;">📍</span>
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text-primary,#0F172A);">Assigned Duty Post</div>
                <div style="font-size:12px;color:var(--text-secondary,#64748B);">Today's deployment location</div>
              </div>
            </div>
            <div style="font-size:18px;font-weight:800;color:#2563EB;" id="dutyCardPost">Gate 1 - Main Entrance</div>
            <div style="font-size:12.5px;color:var(--text-secondary,#64748B);margin-top:4px;">Main barrier boom control, visitor verification &amp; parcel desk</div>
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
            <div style="font-size:18px;font-weight:800;color:#10B981;" id="dutyCardTiming">06:00 AM – 02:00 PM</div>
            <div style="font-size:12.5px;color:var(--text-secondary,#64748B);margin-top:4px;" id="dutyCardShiftName">Morning Shift (8 Hours Duration)</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#F1F5F9);display:flex;justify-content:space-between;font-size:12px;">
              <span>Shift Progress:</span>
              <strong style="color:#10B981;">Active on duty</strong>
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
                  <div style="font-weight:700;" id="dutyCardSupervisorName">Ramesh Paswan</div>
                  <div style="font-size:11px;color:#64748B;">Facility Supervisor</div>
                </div>
                <a id="dutyCardSupervisorCall" href="tel:9876543215" class="btn btn-sm btn-ghost" style="padding:4px 8px;font-size:12px;color:#2563EB;">📞 Call</a>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding-top:8px;border-top:1px dashed var(--border,#E2E8F0);">
                <div>
                  <div style="font-weight:700;" id="dutyCardReliefName">Dharmendra Kumar</div>
                  <div style="font-size:11px;color:#64748B;">Relief Guard (02:00 PM Handover)</div>
                </div>
                <a id="dutyCardReliefCall" href="tel:9876543211" class="btn btn-sm btn-ghost" style="padding:4px 8px;font-size:12px;color:#2563EB;">📞 Call</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Shift Roster Table -->
        <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:18px;">
          <h4 style="font-size:14px;font-weight:800;margin:0 0 12px 0;">This Week's Shift Schedule</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;">
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:800;color:#166534;">TODAY (MON)</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 1</div>
              <div style="font-size:11px;color:#15803D;">06:00 - 14:00</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748B;">TUE</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 1</div>
              <div style="font-size:11px;color:#64748B;">06:00 - 14:00</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748B;">WED</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 2</div>
              <div style="font-size:11px;color:#64748B;">14:00 - 22:00</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748B;">THU</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 1</div>
              <div style="font-size:11px;color:#64748B;">06:00 - 14:00</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748B;">FRI</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 1</div>
              <div style="font-size:11px;color:#64748B;">06:00 - 14:00</div>
            </div>
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#991B1B;">SAT (OFF)</div>
              <div style="font-size:13px;font-weight:800;color:#991B1B;margin-top:4px;">Weekly Off</div>
              <div style="font-size:11px;color:#991B1B;">Rest Day</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#64748B;">SUN</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-top:4px;">Gate 1</div>
              <div style="font-size:11px;color:#64748B;">06:00 - 14:00</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Salary, Dates & Payouts -->
      <div id="staffTabContentSalary" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">
          <!-- Monthly Salary -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Monthly Fixed Salary</div>
            <div style="font-size:26px;font-weight:900;color:#0F172A;margin-top:6px;" id="salaryCardMonthly">₹22,500</div>
            <div style="font-size:12px;color:#10B981;font-weight:700;margin-top:4px;">Base + Shift Allowance</div>
          </div>

          <!-- Salary Payout Date -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Salary Payout Date</div>
            <div style="font-size:22px;font-weight:800;color:#2563EB;margin-top:6px;" id="salaryCardDate">5th of every month</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">Next credit: <strong id="salaryCardNextDate">05 Nov 2026</strong></div>
          </div>

          <!-- Payment Status -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Current Payment Status</div>
            <div style="margin-top:6px;">
              <span id="salaryCardStatusBadge" style="background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;font-size:14px;font-weight:800;padding:4px 12px;border-radius:12px;display:inline-block;">PAID (Cleared)</span>
            </div>
            <div style="font-size:12px;color:#64748B;margin-top:6px;">Last credited on: <strong id="salaryCardLastPaid">05 Oct 2026</strong></div>
          </div>

          <!-- Attendance This Month -->
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:20px;">
            <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">Attendance This Month</div>
            <div style="font-size:24px;font-weight:800;color:#10B981;margin-top:6px;" id="salaryCardAttendance">26 / 28 Days</div>
            <div style="font-size:12px;color:#64748B;margin-top:4px;">93% punctuality rate</div>
          </div>
        </div>

        <!-- Detailed Salary Breakdown Slip -->
        <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:22px;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border,#F1F5F9);padding-bottom:12px;margin-bottom:16px;">
            <div>
              <h4 style="font-size:15px;font-weight:800;margin:0;color:#0F172A;">Monthly Salary Slip &amp; Breakdown</h4>
              <div style="font-size:12px;color:#64748B;margin-top:2px;">Disbursed via direct NEFT bank transfer</div>
            </div>
            <div style="font-size:12.5px;color:#2563EB;font-weight:700;" id="salaryCardBank">
              🏦 State Bank of India (•••• 4128)
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <!-- Earnings -->
            <div>
              <div style="font-size:12px;font-weight:800;color:#10B981;text-transform:uppercase;margin-bottom:8px;">Earnings (+)</div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>Basic Salary:</span>
                  <strong id="slipBasic">₹16,875</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>Gate Post &amp; Shift Allowance:</span>
                  <strong id="slipAllowance">₹3,375</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>Special Duty Bonus:</span>
                  <strong id="slipBonus">₹2,250</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #E2E8F0;font-weight:800;">
                  <span>Gross Earnings:</span>
                  <span id="slipGross" style="color:#10B981;">₹22,500</span>
                </div>
              </div>
            </div>

            <!-- Deductions -->
            <div>
              <div style="font-size:12px;font-weight:800;color:#EF4444;text-transform:uppercase;margin-bottom:8px;">Deductions (-)</div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>Provident Fund (PF):</span>
                  <strong>₹850</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                  <span>ESI Medical Insurance:</span>
                  <strong>₹400</strong>
                </div>
                <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid #E2E8F0;font-weight:800;">
                  <span>Total Deductions:</span>
                  <span style="color:#EF4444;">-₹1,250</span>
                </div>
              </div>
            </div>
          </div>

          <div style="background:#F8FAFC;border-radius:10px;padding:14px 18px;margin-top:18px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;color:#64748B;font-weight:700;">NET TAKE-HOME PAY</div>
              <div style="font-size:22px;font-weight:900;color:#0F172A;" id="slipNet">₹21,250</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="if(typeof showToast==='function')showToast('Salary slip downloaded as PDF', 'success');" style="font-weight:700;">
              📥 Download Salary Slip
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 4: Intercom & Emergency SOS -->
      <div id="staffTabContentEmergency" class="staff-tab-view" style="display:none;flex-direction:column;gap:18px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;">
          
          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:28px;">🏢</span>
              <div>
                <div style="font-weight:800;font-size:14px;">RWA Admin Desk</div>
                <div style="font-size:12px;color:#64748B;">Central Society Office</div>
              </div>
            </div>
            <a href="tel:9876543200" class="btn btn-sm btn-primary" style="font-weight:700;">📞 Call</a>
          </div>

          <div style="background:var(--bg-surface,#fff);border:1px solid var(--border,#E2E8F0);border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:28px;">👑</span>
              <div>
                <div style="font-weight:800;font-size:14px;">RWA President</div>
                <div style="font-size:12px;color:#64748B;">Dr. Vikram Malhotra</div>
              </div>
            </div>
            <a href="tel:9812345678" class="btn btn-sm btn-primary" style="font-weight:700;">📞 Call</a>
          </div>

          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:28px;">🚓</span>
              <div>
                <div style="font-weight:800;font-size:14px;color:#991B1B;">Police Station (Sector 48)</div>
                <div style="font-size:12px;color:#B91C1C;">Emergency PCR: 112</div>
              </div>
            </div>
            <a href="tel:112" class="btn btn-sm btn-danger" style="background:#EF4444;color:#fff;border:none;font-weight:700;">🚨 112</a>
          </div>

          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:28px;">🚑</span>
              <div>
                <div style="font-weight:800;font-size:14px;color:#991B1B;">Ambulance Dispatch</div>
                <div style="font-size:12px;color:#B91C1C;">Emergency: 108 / 102</div>
              </div>
            </div>
            <a href="tel:108" class="btn btn-sm btn-danger" style="background:#EF4444;color:#fff;border:none;font-weight:700;">🚨 108</a>
          </div>

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

window.loadLiveStaffPortal = async function() {
  try {
    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('rwa_user') : null;
    let u = null;
    try { u = userStr ? JSON.parse(userStr) : null; } catch(e) {}
    const phone = u?.phone || '9876543210';

    const res = await (typeof apiFetch === 'function' ? apiFetch(`/api/staff/portal?phone=${phone}`) : fetch(`/api/staff/portal?phone=${phone}`));
    const data = await res.json();

    if (data.success) {
      window.__staffPortalData = data;
      window.renderStaffPortalUI(data);
    }
  } catch (err) {
    console.error('Error loading staff portal data:', err);
  }
};

window.renderStaffPortalUI = function(data) {
  const staff = data.staff || {};
  const duty = data.duty || {};
  const salary = data.salary || {};
  const passes = (data.passes && data.passes.list) || [];

  // Hero strip
  const elName = document.getElementById('staffHeroName');
  const elRole = document.getElementById('staffHeroRole');
  const elPost = document.getElementById('staffHeroPost');
  const elShift = document.getElementById('staffHeroShift');
  const elPhone = document.getElementById('staffHeroPhone');

  if (elName) elName.textContent = staff.name || 'Ram Singh';
  if (elRole) elRole.textContent = staff.role || 'Senior Security Guard';
  if (elPost) elPost.textContent = duty.currentPost || 'Gate 1 - Main Entrance';
  if (elShift) elShift.textContent = `${duty.currentShift || 'Morning Shift'} (${duty.timing || '06:00 AM - 02:00 PM'})`;
  if (elPhone) elPhone.textContent = staff.phone || '9876543210';

  // Duty tab cards
  const elDPost = document.getElementById('dutyCardPost');
  const elDBlock = document.getElementById('dutyCardBlock');
  const elDTiming = document.getElementById('dutyCardTiming');
  const elDShiftName = document.getElementById('dutyCardShiftName');
  const elDSup = document.getElementById('dutyCardSupervisorName');
  const elDRelief = document.getElementById('dutyCardReliefName');

  if (elDPost) elDPost.textContent = duty.currentPost || 'Gate 1';
  if (elDBlock) elDBlock.textContent = duty.currentBlock || 'Main Gate';
  if (elDTiming) elDTiming.textContent = duty.timing || '06:00 AM - 02:00 PM';
  if (elDShiftName) elDShiftName.textContent = duty.currentShift || 'Morning Shift';
  if (elDSup && duty.supervisor) elDSup.textContent = duty.supervisor.name;
  if (elDRelief && duty.reliefGuard) elDRelief.textContent = duty.reliefGuard.name;

  // Salary tab cards
  const elSMon = document.getElementById('salaryCardMonthly');
  const elSDate = document.getElementById('salaryCardDate');
  const elSNext = document.getElementById('salaryCardNextDate');
  const elSLast = document.getElementById('salaryCardLastPaid');
  const elSAtt = document.getElementById('salaryCardAttendance');

  if (elSMon) elSMon.textContent = `₹${(salary.monthlySalary || 22500).toLocaleString('en-IN')}`;
  if (elSDate) elSDate.textContent = salary.salaryDate || '5th of every month';
  if (elSNext) elSNext.textContent = salary.nextSalaryCredit || '05 Nov 2026';
  if (elSLast) elSLast.textContent = salary.lastPaidDate || '05 Oct 2026';
  if (elSAtt) elSAtt.textContent = `${salary.attendancePresent || 26} / ${salary.attendanceTotal || 28} Days (${salary.attendancePercent || 93}%)`;

  // Salary breakdown
  const b = salary.breakdown || {};
  const elBasic = document.getElementById('slipBasic');
  const elAllow = document.getElementById('slipAllowance');
  const elBonus = document.getElementById('slipBonus');
  const elGross = document.getElementById('slipGross');
  const elNet = document.getElementById('slipNet');

  if (elBasic) elBasic.textContent = `₹${(b.basicSalary || 16875).toLocaleString('en-IN')}`;
  if (elAllow) elAllow.textContent = `₹${(b.shiftAllowance || 3375).toLocaleString('en-IN')}`;
  if (elBonus) elBonus.textContent = `₹${(b.specialDutyBonus || 2250).toLocaleString('en-IN')}`;
  if (elGross) elGross.textContent = `₹${(salary.monthlySalary || 22500).toLocaleString('en-IN')}`;
  if (elNet) elNet.textContent = `₹${(b.netSalary || 21250).toLocaleString('en-IN')}`;

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
        <td colspan="6" style="text-align:center;padding:30px;color:#94A3B8;">
          No passes found matching this filter.
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
        guardName: 'Ram Singh (Gate 1)',
        locationPost: 'Gate 1 - Main Entrance',
      }),
    }) : fetch('/api/staff/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quick_verify',
        passCodeOrPin: code,
        guardName: 'Ram Singh (Gate 1)',
        locationPost: 'Gate 1 - Main Entrance',
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
      body: JSON.stringify({ id: passId, action: 'check_in', guardName: 'Ram Singh (Gate 1)' }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_in', guardName: 'Ram Singh (Gate 1)' }),
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
      body: JSON.stringify({ id: passId, action: 'check_out', guardName: 'Ram Singh (Gate 1)' }),
    }) : fetch('/api/entry-passes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passId, action: 'check_out', guardName: 'Ram Singh (Gate 1)' }),
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
        gateNumber: 'Gate 1 - Main Entrance',
        notes: 'Walk-in spot registered by Guard Ram Singh',
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
        gateNumber: 'Gate 1 - Main Entrance',
        notes: 'Walk-in spot registered by Guard Ram Singh',
      }),
    }));

    const data = await res.json();
    if (data.success && data.pass) {
      // Auto check in
      await (typeof apiFetch === 'function' ? apiFetch('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.pass.id, action: 'check_in', guardName: 'Ram Singh (Gate 1)' }),
      }) : fetch('/api/entry-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.pass.id, action: 'check_in', guardName: 'Ram Singh (Gate 1)' }),
      }));

      if (typeof Modal !== 'undefined' && Modal.close) Modal.close();
      if (typeof showToast === 'function') showToast(`Spot entry logged for ${visitorName}!`, 'success');
      window.loadLiveStaffPortal();
    }
  } catch (err) {
    console.error(err);
  }
};
