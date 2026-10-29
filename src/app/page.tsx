'use client'

import React, { useEffect, useState } from 'react'

export default function Home() {
  const [, setScriptsLoaded] = useState(false)

  useEffect(() => {
    const scripts = [
      '/router.js',
      '/screens/auth.js',
      '/screens/admin-dashboard.js',
      '/screens/admin-units.js',
      '/screens/admin-members.js',
      '/screens/admin-finance.js',
      '/screens/admin-ledger.js',
      '/screens/admin-reports.js',
      '/screens/admin-receivables.js',
      '/screens/admin-expenses.js',
      '/screens/admin-communication.js',
      '/screens/admin-complaints.js',
      '/screens/admin-governance.js',
      '/screens/admin-documents.js',
      '/screens/admin-vendors.js',
      '/screens/admin-amenities.js',
      '/screens/admin-settings.js',
      '/screens/admin-emergency.js',
      '/screens/admin-duty.js',
      '/screens/admin-entry-passes.js',
      '/screens/staff-portal.js',
      '/screens/resident-portal.js',
      '/screens/resident-onboard.js',
      '/screens/platform-admin.js',
      '/socket.io.min.js',
      '/live-features.js',
      '/app.js',
    ]

    async function loadAll() {
      const timestamp = Date.now()
      for (const rawSrc of scripts) {
        await new Promise<void>((resolve) => {
          const s = document.createElement('script')
          s.src = `${rawSrc}?v=${timestamp}`
          s.async = false // preserve strict execution order
          s.onload = () => resolve()
          s.onerror = (e) => {
            console.error('Failed to load script:', rawSrc, e)
            resolve()
          }
          document.body.appendChild(s)
        })
      }
      setScriptsLoaded(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any
      if (win.Router && win.Screens) {
        const hash = window.location.hash.slice(1)
        let targetScreen = 'auth-login'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let user: any = null
        try {
          const userStr = localStorage.getItem('rwa_user')
          user = userStr ? JSON.parse(userStr) : null
        } catch {
          user = null
        }

        const isPublicScreen = (s: string) =>
          s.startsWith('auth-') ||
          s.startsWith('onboarding-') ||
          s.startsWith('resident-login') ||
          s.startsWith('resident-onboard')

        if (hash && win.Screens[hash] && !['landing', 'product', 'solutions', 'pricing', 'company'].includes(hash)) {
          targetScreen = hash
        } else {
          // Root "/" path: directly open auth-login screen
          targetScreen = 'auth-login'
        }

        win.Router.go(targetScreen)
      }
    }

    loadAll()
  }, [])

  return <div id="app"></div>
}
