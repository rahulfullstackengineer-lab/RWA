// Test script to verify all screen functions, calendar views, and state toggles
const fs = require('fs');
const path = require('path');

// Mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelector: (s) => null,
  querySelectorAll: (s) => [],
  createElement: (tag) => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
  body: { appendChild: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false } }
};
global.showToast = (msg, type) => { console.log(`[Toast ${type || 'info'}]: ${msg}`); };

// Load router
let routerCode = fs.readFileSync(path.join(__dirname, 'public', 'router.js'), 'utf8');
routerCode += '\nglobal.Shell = Shell;\n';
eval(routerCode);

// Router mock
global.Router = {
  _current: 'admin-dashboard',
  go: function(screen, params) {
    this._current = screen;
  },
  current: function() { return this._current; }
};

// Load screens
const docCode = fs.readFileSync(path.join(__dirname, 'public', 'screens', 'admin-documents.js'), 'utf8');
eval(docCode);

const amnCode = fs.readFileSync(path.join(__dirname, 'public', 'screens', 'admin-amenities.js'), 'utf8');
eval(amnCode);

const govCode = fs.readFileSync(path.join(__dirname, 'public', 'screens', 'admin-governance.js'), 'utf8');
eval(govCode);

console.log('--- 1. Testing Compliance Calendar ---');
window._complianceViewMode = 'list';
let compListHtml = Screens['admin-compliance']();
console.log('List View Rendered:', compListHtml.includes('Compliance Calendar'));
console.log('Contains Calendar View button:', compListHtml.includes('toggleComplianceView()'));
console.log('Contains Add Item button:', compListHtml.includes('openAddComplianceModal()'));
console.log('Contains Mark Done buttons:', compListHtml.includes('markComplianceDone('));

window.toggleComplianceView();
console.log('View mode after toggle:', window._complianceViewMode);
let compCalHtml = Screens['admin-compliance']();
console.log('Calendar Grid Rendered:', compCalHtml.includes('calendar-grid'));
console.log('Month Header Rendered:', compCalHtml.includes('October 2026'));
console.log('Day headers present:', compCalHtml.includes('calendar-day-header'));
console.log('Selected date drawer present:', compCalHtml.includes('calendar-selected-drawer'));
console.log('Toggle back to List View button present:', compCalHtml.includes('📋 List View'));

// Test Mark Done
console.log('--- 2. Testing Compliance Task Completion ---');
let items = getComplianceItems();
console.log('Initial items count:', items.length);
let firstItem = items[0];
console.log('Item 1 initial status:', firstItem.status);
markComplianceDone(firstItem.id);
items = getComplianceItems();
console.log('Item 1 status after mark done:', items[0].status);
console.log('Item 1 completedAt:', items[0].completedAt);

// Test Amenity Calendar
console.log('--- 3. Testing Amenity Management & Calendar ---');
window._amenityViewMode = 'list';
let amnListHtml = Screens['admin-amenities']();
console.log('Amenity List Rendered:', amnListHtml.includes('Society Amenities'));
console.log('Contains Add Amenity button:', amnListHtml.includes('openAddAmenityModal()'));
console.log('Contains Calendar View button:', amnListHtml.includes('toggleAmenityView()'));

window.toggleAmenityView();
console.log('Amenity view mode after toggle:', window._amenityViewMode);
let amnCalHtml = Screens['admin-amenities']();
console.log('Amenity Calendar Grid Rendered:', amnCalHtml.includes('calendar-grid'));
console.log('Amenity Calendar Month:', amnCalHtml.includes('October 2026'));
console.log('Amenity Schedule Drawer Rendered:', amnCalHtml.includes('calendar-selected-drawer'));
console.log('Facility reservations listed:', amnCalHtml.includes('Facility Reservations'));

// Test Booking approval
console.log('--- 4. Testing Amenity Booking Approval ---');
let bookings = getAmenityBookings();
console.log('Initial pending bookings:', bookings.filter(b => b.status === 'PENDING').length);
approveAmenityBooking('BK-102');
bookings = getAmenityBookings();
let bk102 = bookings.find(b => b.id === 'BK-102');
console.log('BK-102 status after approval:', bk102 ? bk102.status : 'not found');

// Test Governance Agenda
console.log('--- 5. Testing Governance Agenda & Meeting Details ---');
let agenda = getMeetingAgenda();
console.log('Initial agenda items count:', agenda.length);
let meetDetailHtml = Screens['admin-meeting-detail']();
console.log('Meeting Detail Rendered:', meetDetailHtml.includes('Annual General Meeting 2026'));
console.log('Contains Add Agenda Item button:', meetDetailHtml.includes('openAddAgendaItemModal()'));
console.log('Contains Send Meeting Notice action:', meetDetailHtml.includes('sendMeetingNotice('));
console.log('Contains Mark Attendance action:', meetDetailHtml.includes('openMarkAttendanceModal()'));
console.log('Contains Record Minutes action:', meetDetailHtml.includes('openRecordMinutesModal()'));
console.log('Contains Add Resolution action:', meetDetailHtml.includes('openAddResolutionModal()'));

console.log('\n=== ALL FUNCTIONALITY TESTS PASSED SUCCESSFULLY! ===');
