import React from 'react'
import { GraduationCap, BookOpen, Plus, ArrowRight, Sparkles, TrendingUp } from 'lucide-react'

export default function LmsHeroBanner({
  greetingTitle = 'Learn More Effectively With Us!',
  greetingSubtitle = 'Explore comprehensive courses, track academic progress, and empower learning.',
  badge1 = { icon: GraduationCap, label: 'Students', value: '75,000+', color: 'pink' },
  badge2 = { icon: BookOpen, label: 'Active Courses', value: '120+', color: 'amber' },
  illustrationSrc = '/assets/student_banner_illustration.jpg',
  actionTitle = 'Have More knowledge to share?',
  actionBtnText = '+ Create New Course',
  onActionClick,
  statBox1 = { label: 'Courses in Progress', value: '5' },
  statBox2 = { label: 'Total Enrolled', value: '25' },
}) {
  const Badge1Icon = badge1.icon || GraduationCap
  const Badge2Icon = badge2.icon || BookOpen

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Left Teal Banner (Approx 8 of 12 cols on desktop) */}
      <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 p-6 sm:p-8 text-white shadow-lg shadow-teal-700/10 flex flex-col justify-between min-h-[220px]">
        {/* Subtle background glow & geometric circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

        {/* Content & Illustration Container */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white tracking-wide">
              <Sparkles size={13} className="text-amber-200" />
              <span>SchoolBuddy AI Powered LMS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              {greetingTitle}
            </h1>

            <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed max-w-md">
              {greetingSubtitle}
            </p>

            {/* Pill Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Badge 1: Pink circle */}
              <div className="flex items-center gap-2.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 border border-white/25 shadow-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs">
                  <Badge1Icon size={14} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-teal-100 tracking-wider">
                    {badge1.label}
                  </p>
                  <p className="text-xs font-bold text-white leading-tight">
                    {badge1.value}
                  </p>
                </div>
              </div>

              {/* Badge 2: Amber circle */}
              <div className="flex items-center gap-2.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1.5 border border-white/25 shadow-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-xs">
                  <Badge2Icon size={14} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-teal-100 tracking-wider">
                    {badge2.label}
                  </p>
                  <p className="text-xs font-bold text-white leading-tight">
                    {badge2.value}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Vector Illustration */}
          <div className="w-full md:w-56 lg:w-72 shrink-0 flex justify-center items-center">
            <div className="relative group overflow-hidden rounded-2xl shadow-md border-2 border-white/30 bg-teal-700/30">
              <img
                src={illustrationSrc}
                alt="Students learning and celebrating"
                className="w-full h-40 sm:h-44 object-cover object-center transform transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Quick Action & Stat Card (Approx 4 of 12 cols on desktop) */}
      <div className="lg:col-span-4 rounded-3xl bg-white p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800 tracking-tight">
            {actionTitle}
          </p>

          <button
            onClick={onActionClick}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all duration-150 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{actionBtnText}</span>
          </button>
        </div>

        {/* 2-Column KPI Metric Boxes */}
        <div className="grid grid-cols-2 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50/80 p-4 text-center border border-slate-100/80 transition-colors hover:bg-blue-50/50">
            <p className="text-[11px] font-semibold text-slate-500">
              {statBox1.label}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {statBox1.value}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50/80 p-4 text-center border border-slate-100/80 transition-colors hover:bg-emerald-50/50">
            <p className="text-[11px] font-semibold text-slate-500">
              {statBox2.label}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {statBox2.value}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
