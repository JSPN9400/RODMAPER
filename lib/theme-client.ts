/**
 * RoadMaper — AI-powered learning roadmap platform.
 * Copyright (c) 2026 JSPN. All rights reserved.
 * @author JSPN
 * @license MIT — see LICENSE file in the project root.
 */

'use client'
import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  try {
    localStorage.setItem('rm-theme', theme)
  } catch {
    // localStorage unavailable (private browsing etc.) — theme still
    // applies for this page load via the DOM attribute above, it just
    // won't persist across reloads.
  }
}

// Hook for any component that needs to read/toggle the theme. Reads the
// current DOM state on mount (already set correctly pre-hydration by the
// blocking script in app/layout.tsx) rather than assuming a default, so it
// can't momentarily disagree with what's actually on screen.
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    setThemeState(current)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
    // Best-effort sync to the server so the preference follows the user to
    // another device; failure here shouldn't block the (already-applied)
    // local theme change.
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {})
  }, [])

  return [theme, setTheme]
}
