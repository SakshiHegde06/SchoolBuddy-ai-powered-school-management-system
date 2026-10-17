import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import CommandPaletteModal from '../components/common/CommandPaletteModal'

export default function DashboardLayout({ links }) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    function handleOpen() {
      setIsCommandPaletteOpen(true)
    }
    window.addEventListener('sb-open-command-palette', handleOpen)
    return () => window.removeEventListener('sb-open-command-palette', handleOpen)
  }, [])

  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1 min-w-0">
        <Topbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        <main className="min-h-[calc(100vh-5rem)] bg-slate-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  )
}