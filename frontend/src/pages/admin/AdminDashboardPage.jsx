import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'

import { adminService } from '../../services/adminService'
import { useFetch } from '../../hooks/useFetch'

export default function AdminDashboardPage() {

  const { data: summary, isLoading, error } = useFetch(
    () => adminService.getDashboardSummary(),
    []
  )

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage students, teachers, classes and school operations from one place.
        </p>
      </div>

      {isLoading && (
        <Spinner label="Loading dashboard..." />
      )}

      {error && (
        <Card>
          <p className="text-sm text-red-600">
            Unable to load dashboard statistics.
          </p>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">

          <StatCard
            label="Students"
            value={summary.totalStudents}
          />

          <StatCard
            label="Teachers"
            value={summary.totalTeachers}
          />

          <StatCard
            label="Parents"
            value={summary.totalParents}
          />

          <StatCard
            label="Classes"
            value={summary.totalClasses}
          />

        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">

        <AnnouncementsWidget limit={3} title="Recent Announcements" />

        <Card title="Upcoming Events">

          <p className="text-sm text-slate-500">
            Calendar/events aren't wired up on the backend yet — this card is
            still a placeholder until that feature is built.
          </p>

        </Card>

      </div>
    </div>
  )
}