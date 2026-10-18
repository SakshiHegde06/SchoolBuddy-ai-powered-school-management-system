import React from 'react'
import { MoreVertical, ChevronRight, Layers, Palette, Megaphone, Code, Calculator, BookOpen, Compass } from 'lucide-react'

const DEFAULT_COURSES = [
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
    title: 'Digital Marketing',
    subtext: '18+ Lessons • Active',
    tag: 'Marketing',
    bgColor: 'bg-rose-500',
    tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Megaphone,
  },
  {
    id: 3,
    title: 'Web Development',
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

export default function PopularCoursesWidget({
  title = 'Popular Courses',
  viewAllText = 'All Courses',
  onViewAll,
  courses = DEFAULT_COURSES,
  onCourseClick,
}) {
  const displayCourses = courses && courses.length > 0 ? courses : DEFAULT_COURSES

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onViewAll}
            className="group flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <span>{viewAllText}</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Course Items List */}
        <div className="divide-y divide-slate-100 mt-2">
          {displayCourses.map((course, idx) => {
            const Icon = course.icon || BookOpen
            return (
              <div
                key={course.id || idx}
                onClick={() => onCourseClick?.(course)}
                className="group flex items-center justify-between py-3.5 first:pt-2 last:pb-1 cursor-pointer hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      course.bgColor || 'bg-blue-600'
                    } text-white shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {course.subtext}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold border ${
                      course.tagBg || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {course.tag}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCourseClick?.(course)
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
