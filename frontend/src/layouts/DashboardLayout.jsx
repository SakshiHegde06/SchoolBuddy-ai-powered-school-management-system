import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function DashboardLayout({ links }) {
  return (
    <div className="flex">
      <Sidebar links={links} />
      <div className="flex-1">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] bg-paper-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}