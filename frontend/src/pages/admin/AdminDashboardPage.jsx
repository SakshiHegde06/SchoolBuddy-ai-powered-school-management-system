import { useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  HeartHandshake,
  School,
  Clock,
  UserPlus,
  Bell,
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import StatCard from '../../components/common/StatCard'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import { adminService } from '../../services/adminService'
import { holidayService } from '../../services/holidayService'
import { useFetch } from '../../hooks/useFetch'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const { data: summary, isLoading, error } = useFetch(
    () => adminService.getDashboardSummary(),
    []
  )

  const { data: holidays } = useFetch(
    () => holidayService.list(),
    []
  )

  const upcomingHolidays = holidays?.slice(0, 4) || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner & Quick Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of students, faculty, classes, and institution operations.
          </p>
        </div>

        {/* Spotlight & Fast Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('sb-open-command-palette'))}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-xs"
            title="Open Command Palette"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span>Spotlight Command</span>
            <kbd className="rounded border border-blue-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-600 shadow-xs">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => navigate('/admin/timetable')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs"
          >
            <Clock size={14} className="text-indigo-600" />
            <span>Timetable</span>
          </button>

          <button
            onClick={() => navigate('/admin/announcements')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs"
          >
            <Bell size={14} className="text-amber-600" />
            <span>Announcement</span>
          </button>
        </div>
      </div>

      {isLoading && <Spinner label="Loading dashboard metrics..." />}

      {error && (
        <Card>
          <p className="text-sm text-red-600">
            Unable to load dashboard statistics. Check your server connection.
          </p>
        </Card>
      )}

      {/* Modern SaaS Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={summary.totalStudents}
            sublabel="Enrolled learners"
            icon={Users}
            color="blue"
            trend="+12% this year"
            trendType="up"
            onClick={() => navigate('/admin/students')}
          />

          <StatCard
            label="Faculty Members"
            value={summary.totalTeachers}
            sublabel="Active teaching staff"
            icon={GraduationCap}
            color="emerald"
            trend="Staff active"
            trendType="neutral"
            onClick={() => navigate('/admin/teachers')}
          />

          <StatCard
            label="Registered Parents"
            value={summary.totalParents}
            sublabel="Guardian accounts"
            icon={HeartHandshake}
            color="purple"
            trend="Verified"
            trendType="up"
            onClick={() => navigate('/admin/parents')}
          />

          <StatCard
            label="Active Classes"
            value={summary.totalClasses}
            sublabel="Sections & grades"
            icon={School}
            color="amber"
            trend="In session"
            trendType="neutral"
            onClick={() => navigate('/admin/classes')}
          />
        </div>
      )}

      {/* Grid: Announcements & Upcoming School Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnnouncementsWidget limit={3} title="Recent Announcements" />

        <Card
          title="Upcoming School Events & Holidays"
          action={
            <button
              onClick={() => navigate('/admin/holidays')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              Manage all
            </button>
          }
        >
          {upcomingHolidays.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {upcomingHolidays.map((holiday) => {
                const dateObj = holiday.date ? new Date(holiday.date) : null
                const formattedDate = dateObj
                  ? dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Upcoming'

                return (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {holiday.title}
                        </p>
                        {holiday.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-600">No scheduled holidays or events found.</p>
              <button
                onClick={() => navigate('/admin/holidays')}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                + Add institutional holiday
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}