import { useMemo } from 'react'
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
  BookOpen,
  Palette,
  Megaphone,
  Code,
  Calculator,
} from 'lucide-react'

import LmsHeroBanner from '../../components/dashboard/LmsHeroBanner'
import PopularCoursesWidget from '../../components/dashboard/PopularCoursesWidget'
import ActivityProgressWidget from '../../components/dashboard/ActivityProgressWidget'
import BestInstructorsWidget from '../../components/dashboard/BestInstructorsWidget'
import SchoolPerformanceBarWidget from '../../components/dashboard/SchoolPerformanceBarWidget'
import OverallPassDonutWidget from '../../components/dashboard/OverallPassDonutWidget'
import ContentUsageTrendWidget from '../../components/dashboard/ContentUsageTrendWidget'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'

import { adminService } from '../../services/adminService'
import { teacherService } from '../../services/teacherService'
import { subjectService } from '../../services/subjectService'
import { holidayService } from '../../services/holidayService'
import { useFetch } from '../../hooks/useFetch'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const { data: summary, isLoading: summaryLoading } = useFetch(
    () => adminService.getDashboardSummary(),
    []
  )

  const { data: teachers } = useFetch(
    () => teacherService.list(),
    []
  )

  const { data: subjects } = useFetch(
    () => subjectService.list(),
    []
  )

  const { data: holidays } = useFetch(
    () => holidayService.list(),
    []
  )

  // Map backend teachers to BestInstructors format
  const bestInstructors = useMemo(() => {
    if (teachers && teachers.length > 0) {
      return teachers.slice(0, 4).map((t, idx) => {
        const colors = ['border-amber-400', 'border-rose-400', 'border-teal-400', 'border-blue-500']
        return {
          id: t.id,
          name: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Faculty Teacher',
          role: t.designation || t.department || 'Faculty Teacher',
          avatar: t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'T')}&background=0ea5e9&color=fff&bold=true`,
          color: colors[idx % colors.length],
        }
      })
    }
    return [
      {
        id: 1,
        name: 'Ali Haider',
        role: 'Mathematics Dept Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        color: 'border-amber-400',
      },
      {
        id: 2,
        name: 'Naeem Trump',
        role: 'Computer Science Faculty',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        color: 'border-rose-400',
      },
      {
        id: 3,
        name: 'Tyler Desk',
        role: 'Physical Sciences Head',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        color: 'border-teal-400',
      },
      {
        id: 4,
        name: 'Johan Alem',
        role: 'Languages & Arts',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        color: 'border-blue-500',
      },
    ]
  }, [teachers])

  // Map backend subjects to PopularCourses format
  const popularCourses = useMemo(() => {
    if (subjects && subjects.length > 0) {
      const styles = [
        { bgColor: 'bg-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Palette },
        { bgColor: 'bg-rose-500', tagBg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Megaphone },
        { bgColor: 'bg-teal-500', tagBg: 'bg-teal-50 text-teal-700 border-teal-200', icon: Code },
        { bgColor: 'bg-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calculator },
      ]
      return subjects.slice(0, 4).map((sub, idx) => {
        const style = styles[idx % styles.length]
        return {
          id: sub.id,
          title: sub.name || 'Subject Course',
          subtext: `${sub.code ? sub.code + ' • ' : ''}Curriculum Active`,
          tag: sub.type || 'Academic',
          ...style,
        }
      })
    }
    return [
      {
        id: 1,
        title: 'UI/UX Design',
        subtext: '24+ Lessons • Active',
        tag: 'Design',
        bgColor: 'bg-amber-400',
        tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Palette,
      },
      {
        id: 2,
        title: 'Marketing & Comm',
        subtext: '18+ Lessons • Active',
        tag: 'Marketing',
        bgColor: 'bg-rose-500',
        tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: Megaphone,
      },
      {
        id: 3,
        title: 'Web Dev & Coding',
        subtext: '35+ Lessons • Active',
        tag: 'Web Dev',
        bgColor: 'bg-teal-500',
        tagBg: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: Code,
      },
      {
        id: 4,
        title: 'Higher Mathematics',
        subtext: '42+ Lessons • Active',
        tag: 'Mathematics',
        bgColor: 'bg-blue-600',
        tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Calculator,
      },
    ]
  }, [subjects])

  const upcomingHolidays = holidays?.slice(0, 3) || []

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      {/* Top Banner & Fast Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-display">
            Institutional Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time school performance, active courses, faculty coordination, and academic trends.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('sb-open-command-palette'))}
            className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span>Spotlight Command</span>
            <kbd className="rounded border border-blue-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-blue-600 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={() => navigate('/admin/timetable')}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
          >
            <Clock size={14} className="text-indigo-600" />
            <span>Timetable</span>
          </button>

          <button
            onClick={() => navigate('/admin/announcements')}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
          >
            <Bell size={14} className="text-amber-600" />
            <span>Announcements</span>
          </button>
        </div>
      </div>

      {summaryLoading && <Spinner label="Loading institutional metrics..." />}

      {/* Row 1: Hero Banner + Action & Quick Stats */}
      <LmsHeroBanner
        greetingTitle="Learn More Effectively With Us!"
        greetingSubtitle="Empowering institutional excellence, modern classrooms, AI tutoring, and comprehensive student growth."
        badge1={{
          icon: GraduationCap,
          label: 'Students',
          value: summary?.totalStudents ? `${summary.totalStudents.toLocaleString()}` : '75,000+',
          color: 'pink',
        }}
        badge2={{
          icon: BookOpen,
          label: 'Faculty',
          value: summary?.totalTeachers ? `${summary.totalTeachers}` : '124+',
          color: 'amber',
        }}
        illustrationSrc="/assets/student_banner_illustration.jpg"
        actionTitle="Have More knowledge to share?"
        actionBtnText="+ Create New Course"
        onActionClick={() => navigate('/admin/subjects')}
        statBox1={{
          label: 'Courses in Progress',
          value: summary?.totalClasses ? `${summary.totalClasses}` : '5',
        }}
        statBox2={{
          label: 'Total Discounts',
          value: summary?.totalParents ? `${summary.totalParents}` : '25',
        }}
      />

      {/* Row 2: Popular Courses | Current Activity | Best Instructors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Popular Courses (Approx 3.5 cols) */}
        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <PopularCoursesWidget
              title="Popular Courses"
              viewAllText="All Courses"
              onViewAll={() => navigate('/admin/subjects')}
              courses={popularCourses}
              onCourseClick={() => navigate('/admin/subjects')}
            />
          </div>
        </div>

        {/* Current Activity + 2 Color Stat Cards (Approx 4.5 cols) */}
        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <ActivityProgressWidget
              title="Current Activity"
              chartSubtitle="Monthly Progress"
              stat1={{
                value: '4500+',
                label: 'Study Hours',
                bgColor: 'from-amber-400 to-amber-500',
                onClick: () => navigate('/admin/timetable'),
              }}
              stat2={{
                value: '200K+',
                label: 'Total Enrolled',
                bgColor: 'from-rose-500 to-rose-600',
                onClick: () => navigate('/admin/students'),
              }}
            />
          </div>
        </div>

        {/* Best Instructors (Approx 4 cols) */}
        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <BestInstructorsWidget
              title="Best Instructors"
              viewAllText="See All"
              onViewAll={() => navigate('/admin/teachers')}
              instructors={bestInstructors}
              onChat={(inst) => navigate('/admin/teachers')}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Top 5 School Performance | Overall Pass Percentage | Content Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        {/* Top 5 School Performance Multi-Color Bar Chart (Approx 5 cols) */}
        <div className="lg:col-span-5 flex">
          <div className="w-full">
            <SchoolPerformanceBarWidget
              title="Top 5 School Performance"
              data={[
                { name: 'Grade 10A', score: 92, color: '#0ea5e9' }, // Cyan
                { name: 'Grade 10B', score: 85, color: '#6366f1' }, // Indigo / Purple
                { name: 'Grade 9A', score: 78, color: '#14b8a6' },  // Mint / Teal
                { name: 'Grade 9B', score: 70, color: '#f43f5e' },  // Rose / Pink
                { name: 'Grade 8A', score: 62, color: '#f59e0b' },  // Amber / Yellow
              ]}
            />
          </div>
        </div>

        {/* Overall Pass Percentage Donut Chart (Approx 4 cols) */}
        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <OverallPassDonutWidget
              title="Overall Pass Percentage"
              passRate={84}
              failRate={16}
              passLabel="Pass"
              failLabel="Needs Attention"
            />
          </div>
        </div>

        {/* Content Usage Sparkline (Approx 3 cols) */}
        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <ContentUsageTrendWidget
              title="Content Usage"
              trendText="2.5% higher than last month"
            />
          </div>
        </div>
      </div>

      {/* Announcements & Scheduled Events Auxiliary Section */}
      <div className="grid gap-6 lg:grid-cols-2 pt-2">
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

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {formattedDate}
                    </span>
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