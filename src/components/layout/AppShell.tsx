import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/store/appStore'

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const theme = useAppStore(s => s.theme)

  // Aplica la clase de tema al <html> para que todo el DOM la reciba
  useEffect(() => {
    const html = document.documentElement
    if (theme === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
    } else {
      html.classList.remove('light')
      html.classList.add('dark')
    }
  }, [theme])

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--surface-app)' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 min-w-0 overflow-y-auto" style={{ color: 'var(--text-base)' }}>
        <Outlet />
      </main>
    </div>
  )
}
