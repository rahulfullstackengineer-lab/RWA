const { io } = require('socket.io-client')
const http = require('http')

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null
    const reqHeaders = {
      ...headers,
      ...(postData ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      } : {}),
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, headers: res.headers, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data })
        }
      })
    })

    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

async function runEndToEndVerification() {
  console.log('====================================================')
  console.log('🔬 E2E SOCKET & NOTIFICATIONS SYSTEM VERIFICATION')
  console.log('====================================================\n')

  let passed = 0
  let total = 0
  function test(desc, condition) {
    total++
    if (condition) {
      console.log(`✅ [PASS] ${desc}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${desc}`)
    }
  }

  // 1. AUTHENTICATE TO GET USER AND SESSION TOKEN
  console.log('[1/4] Authenticating with test admin credentials...')
  const loginRes = await makeRequest('POST', '/api/auth/login', {
    phone: '9876543210',
    pin: '123456',
  })

  test('Admin login successful (HTTP 200)', loginRes.status === 200)
  test('Received valid session token', Boolean(loginRes.data?.token))
  const token = loginRes.data?.token
  const user = loginRes.data?.user
  const orgId = user?.organizationId || 'default_org'
  console.log(`   -> Authenticated as: ${user?.name} (Role: ${user?.role}, OrgId: ${orgId})`)

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
  }

  // 2. CONNECT REAL-TIME SOCKET.IO CLIENT
  console.log('\n[2/4] Initializing WebSocket Client & Rooms...')
  const socket = io('http://localhost:3000', {
    path: '/api/socket/io',
    transports: ['websocket', 'polling'],
  })

  await new Promise((resolve) => {
    socket.on('connect', () => {
      test('WebSocket connected to /api/socket/io (Socket ID: ' + socket.id + ')', true)
      
      // Join org and user rooms
      socket.emit('join-org', orgId)
      socket.emit('join-user', user.id)
      test(`Joined rooms: org:${orgId} and user:${user.id}`, true)
      resolve()
    })

    socket.on('connect_error', (err) => {
      test(`WebSocket connection error: ${err.message}`, false)
      resolve()
    })
  })

  // 3. LISTEN FOR NOTIFICATION EVENTS VIA WEBSOCKET
  console.log('\n[3/4] Testing Real-Time Event Emission via API...')
  let receivedNoticeEvent = null
  let receivedTicketEvent = null

  socket.on('new-notice', (payload) => {
    console.log(`   ⚡ [EVENT RECEIVED] 'new-notice': "${payload.title}"`)
    receivedNoticeEvent = payload
  })

  socket.on('new-complaint-ticket', (payload) => {
    console.log(`   ⚡ [EVENT RECEIVED] 'new-complaint-ticket': #${payload.ticketNumber} "${payload.title}"`)
    receivedTicketEvent = payload
  })

  // 3a. Publish a new notice via API
  const testNoticeTitle = `Live Verification Notice ${Date.now()}`
  console.log(`   -> Creating test notice via POST /api/notices...`)
  const noticeRes = await makeRequest('POST', '/api/notices', {
    title: testNoticeTitle,
    content: 'This is an automated production verification notice confirming real-time WebSocket broadcasting.',
    type: 'GENERAL',
    status: 'PUBLISHED',
    channels: 'IN_APP',
  }, authHeaders)

  test('Notice created via API (HTTP 200)', noticeRes.status === 200)

  // 3b. Create a test complaint ticket via API
  console.log(`   -> Raising test complaint via POST /api/complaints...`)
  const complaintRes = await makeRequest('POST', '/api/complaints', {
    title: `Socket Test Issue ${Date.now()}`,
    description: 'Testing live notification delivery to society administration.',
    category: 'ELECTRICAL',
    priority: 'HIGH',
  }, authHeaders)

  test('Complaint raised via API (HTTP 200)', complaintRes.status === 200)

  // Wait 1.5 seconds for socket events to arrive
  await new Promise(r => setTimeout(r, 1500))

  test('WebSocket received live "new-notice" broadcast event', Boolean(receivedNoticeEvent && receivedNoticeEvent.title === testNoticeTitle))
  test('WebSocket received live "new-complaint-ticket" event', Boolean(receivedTicketEvent))

  // 4. TEST NOTIFICATIONS API & DATABASE PERSISTENCE
  console.log('\n[4/4] Verifying Notification In-App API (/api/notifications)...')
  const notifRes = await makeRequest('GET', '/api/notifications', null, authHeaders)
  test('GET /api/notifications succeeded (HTTP 200)', notifRes.status === 200)
  test('Notifications array returned', Array.isArray(notifRes.data?.notifications))
  test('Unread count is a valid number', typeof notifRes.data?.unreadCount === 'number')
  console.log(`   -> Total notifications in inbox: ${notifRes.data?.notifications?.length}, Unread: ${notifRes.data?.unreadCount}`)

  // 5. TEST MARK ALL AS READ
  console.log('\n[5/5] Testing PATCH /api/notifications (Mark All As Read)...')
  const patchRes = await makeRequest('PATCH', '/api/notifications', { markAll: true }, authHeaders)
  test('PATCH /api/notifications markAll succeeded (HTTP 200)', patchRes.status === 200)

  const notifAfterRes = await makeRequest('GET', '/api/notifications', null, authHeaders)
  test('Unread count successfully reduced to 0', notifAfterRes.data?.unreadCount === 0)

  socket.disconnect()

  console.log('\n====================================================')
  console.log(`FINAL RESULT: ${passed} / ${total} CHECKS PASSED`)
  console.log('====================================================')
  if (passed === total) {
    console.log('🎉 WebSockets, Real-Time Broadcasting, and In-App Notifications are 100% OPERATIONAL!')
  }
}

runEndToEndVerification().catch(console.error)
