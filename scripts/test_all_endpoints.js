const endpoints = [
  '/api/staff/portal',
  '/api/entry-passes',
  '/api/staff/duty',
  '/api/members',
  '/api/units',
  '/api/billing/invoices',
  '/api/expenses',
  '/api/complaints',
  '/api/notices',
  '/api/broadcasts',
  '/api/polls',
  '/api/amenities',
  '/api/emergency/contacts',
  '/api/vendors',
  '/api/settings',
  '/api/dashboard/stats',
];

async function testAll() {
  console.log('=== TESTING API ENDPOINTS ON http://localhost:3000 ===');
  let passCount = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:3000${ep}`);
      const text = await res.text();
      let isJson = false;
      let json = null;
      try {
        json = JSON.parse(text);
        isJson = true;
      } catch (e) {}

      if (res.status >= 200 && res.status < 300) {
        console.log(`[PASS] ${res.status} ${ep} (JSON: ${isJson})`);
        passCount++;
      } else {
        console.log(`[FAIL] ${res.status} ${ep} - ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`[ERROR] ${ep} - ${err.message}`);
    }
  }
  console.log(`\nResults: ${passCount} / ${endpoints.length} endpoints returned 200 OK.`);
}

testAll();

