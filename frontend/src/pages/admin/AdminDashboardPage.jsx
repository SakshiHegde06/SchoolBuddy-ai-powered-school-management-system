import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
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

        <Card title="Attendance Overview">

          <div className="flex h-56 items-center justify-center text-sm text-slate-500">
            Attendance analytics will appear here.
          </div>

        </Card>

        <Card title="Academic Performance">

          <div className="flex h-56 items-center justify-center text-sm text-slate-500">
            AI performance summary will appear here.
          </div>

        </Card>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <Card title="Recent Announcements">

          <p className="text-sm text-slate-500">
            No announcements available.
          </p>

        </Card>

        <Card title="Upcoming Events">

          <p className="text-sm text-slate-500">
            No upcoming events.
          </p>

        </Card>

      </div>

    </div>
  )
}