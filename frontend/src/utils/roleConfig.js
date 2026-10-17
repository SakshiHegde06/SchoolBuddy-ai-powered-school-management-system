import { ROLES } from './constants'

// Central place that maps each role to its nav links and landing route.
// Sidebar/DashboardLayout reads from here so adding a role-specific page
// only means editing this file, not touching layout components.
export const roleNavConfig = {
  [ROLES.ADMIN]: {
    landing: '/admin',
    links: [
      { label: 'Dashboard', to: '/admin', icon: 'layout-dashboard' },
      { label: 'Teachers', to: '/admin/teachers', icon: 'user' },
      { label: 'Students', to: '/admin/students', icon: 'users' },
      { label: 'Parents', to: '/admin/parents', icon: 'user-heart' },
      { label: 'Classes', to: '/admin/classes', icon: 'school' },
      { label: 'Subjects', to: '/admin/subjects', icon: 'book' },
      { label: 'Timetable management', to: '/admin/timetable', icon: 'calendar-time' },
      { label: 'Teacher assignments', to: '/admin/teacher-assignments', icon: 'list-checks' },
      { label: 'Exams', to: '/admin/exams', icon: 'clipboard-list' },
      { label: 'Academic years', to: '/admin/academic-years', icon: 'graduation-cap' },
      { label: 'Announcements', to: '/admin/announcements', icon: 'speakerphone' },
      { label: 'Holidays', to: '/admin/holidays', icon: 'calendar-days' },
      { label: 'Import users', to: '/admin/import', icon: 'upload' },
      { label: 'Calendar', to: '/calendar', icon: 'calendar' },
    ],
  },
  [ROLES.TEACHER]: {
    landing: '/teacher',
    links: [
      { label: 'Dashboard', to: '/teacher', icon: 'layout-dashboard' },
      { label: 'Attendance', to: '/teacher/attendance', icon: 'clipboard-check' },
      { label: 'Marks', to: '/teacher/marks', icon: 'pencil' },
      { label: 'Homework', to: '/teacher/homework', icon: 'notebook' },
      { label: 'Study materials', to: '/teacher/materials', icon: 'files' },
      { label: 'Calendar', to: '/calendar', icon: 'calendar' },
    ],
  },
  [ROLES.PARENT]: {
    landing: '/parent',
    links: [
      { label: 'Dashboard', to: '/parent', icon: 'layout-dashboard' },
      { label: "Child's progress", to: '/parent/progress', icon: 'trending-up' },
      { label: 'Calendar', to: '/calendar', icon: 'calendar' },
    ],
  },
  [ROLES.STUDENT]: {
    landing: '/student',
    links: [
      { label: 'Dashboard', to: '/student', icon: 'layout-dashboard' },
      { label: 'Study materials', to: '/student/materials', icon: 'files' },
      { label: 'Calendar', to: '/calendar', icon: 'calendar' },
    ],
  },
}