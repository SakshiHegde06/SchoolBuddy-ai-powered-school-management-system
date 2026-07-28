// Mock data for all pages

export const mockTeachers = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@school.com', subject: 'Mathematics', joinDate: '2020-01-15' },
  { id: 2, name: 'Priya Singh', email: 'priya@school.com', subject: 'English', joinDate: '2019-06-20' },
  { id: 3, name: 'Arjun Patel', email: 'arjun@school.com', subject: 'Science', joinDate: '2021-03-10' },
  { id: 4, name: 'Deepika Nair', email: 'deepika@school.com', subject: 'Social Studies', joinDate: '2020-08-05' },
  { id: 5, name: 'Vikram Sharma', email: 'vikram@school.com', subject: 'Computer Science', joinDate: '2022-01-12' },
]

export const mockStudents = [
  { id: 1, name: 'Aarav Mehta', class: '8-B', rollNo: 15, parentName: 'Ramesh Mehta' },
  { id: 2, name: 'Diya Sharma', class: '7-A', rollNo: 8, parentName: 'Amit Sharma' },
  { id: 3, name: 'Kabir Nair', class: '9-C', rollNo: 22, parentName: 'Suresh Nair' },
  { id: 4, name: 'Riya Mehta', class: '5-A', rollNo: 12, parentName: 'Ramesh Mehta' },
  { id: 5, name: 'Ansh Gupta', class: '8-B', rollNo: 5, parentName: 'Vivek Gupta' },
  { id: 6, name: 'Zara Khan', class: '7-A', rollNo: 18, parentName: 'Rizwan Khan' },
  { id: 7, name: 'Aryan Singh', class: '9-C', rollNo: 3, parentName: 'Rajendra Singh' },
  { id: 8, name: 'Nisha Joshi', class: '6-B', rollNo: 14, parentName: 'Arun Joshi' },
]

export const mockParents = [
  { id: 1, name: 'Ramesh Mehta', email: 'ramesh@email.com', phone: '+91-9876543210', children: ['Aarav Mehta', 'Riya Mehta'] },
  { id: 2, name: 'Amit Sharma', email: 'amit@email.com', phone: '+91-9876543211', children: ['Diya Sharma'] },
  { id: 3, name: 'Suresh Nair', email: 'suresh@email.com', phone: '+91-9876543212', children: ['Kabir Nair'] },
  { id: 4, name: 'Vivek Gupta', email: 'vivek@email.com', phone: '+91-9876543213', children: ['Ansh Gupta'] },
  { id: 5, name: 'Rizwan Khan', email: 'rizwan@email.com', phone: '+91-9876543214', children: ['Zara Khan'] },
]

export const mockClasses = [
  { id: 1, name: '5-A', grade: 5, strength: 35, classTeacher: 'Deepika Nair' },
  { id: 2, name: '6-B', grade: 6, strength: 38, classTeacher: 'Priya Singh' },
  { id: 3, name: '7-A', grade: 7, strength: 40, classTeacher: 'Rajesh Kumar' },
  { id: 4, name: '8-B', grade: 8, strength: 36, classTeacher: 'Vikram Sharma' },
  { id: 5, name: '9-C', grade: 9, strength: 42, classTeacher: 'Arjun Patel' },
]

export const mockSubjects = [
  { id: 1, name: 'Mathematics', code: 'MATH101', teacher: 'Rajesh Kumar' },
  { id: 2, name: 'English', code: 'ENG101', teacher: 'Priya Singh' },
  { id: 3, name: 'Science', code: 'SCI101', teacher: 'Arjun Patel' },
  { id: 4, name: 'Social Studies', code: 'SS101', teacher: 'Deepika Nair' },
  { id: 5, name: 'Computer Science', code: 'CS101', teacher: 'Vikram Sharma' },
  { id: 6, name: 'Physical Education', code: 'PE101', teacher: 'Anand Singh' },
]

export const mockAnnouncements = [
  { id: 1, title: 'Annual Sports Day', date: '2026-08-15', content: 'Annual sports day will be held on August 15th. All students are encouraged to participate.' },
  { id: 2, title: 'Mid-term Exams Starting', date: '2026-08-01', content: 'Mid-term examinations will commence from August 1st. Please find the time table on the bulletin board.' },
  { id: 3, title: 'Parent-Teacher Meeting', date: '2026-07-25', content: 'PTM scheduled for July 25th. Please register your preferred slot on the portal.' },
  { id: 4, title: 'New Lab Equipment', date: '2026-07-20', content: 'New computer lab equipment has been installed. Lab access timings: 2 PM - 4 PM.' },
]

export const mockAttendance = [
  { date: '2026-07-10', present: 38, absent: 2, leave: 0 },
  { date: '2026-07-11', present: 39, absent: 1, leave: 0 },
  { date: '2026-07-12', present: 37, absent: 0, leave: 3 },
  { date: '2026-07-13', present: 40, absent: 0, leave: 0 },
  { date: '2026-07-14', present: 38, absent: 2, leave: 0 },
]

export const mockMarks = [
  { student: 'Aarav Mehta', subject: 'Mathematics', marks: 92, maxMarks: 100, grade: 'A+' },
  { student: 'Aarav Mehta', subject: 'English', marks: 88, maxMarks: 100, grade: 'A' },
  { student: 'Aarav Mehta', subject: 'Science', marks: 90, maxMarks: 100, grade: 'A+' },
  { student: 'Diya Sharma', subject: 'Mathematics', marks: 78, maxMarks: 100, grade: 'B+' },
  { student: 'Diya Sharma', subject: 'English', marks: 85, maxMarks: 100, grade: 'A' },
]

export const mockHomework = [
  { id: 1, subject: 'Mathematics', title: 'Chapter 5 - Exercises', dueDate: '2026-07-18', status: 'assigned' },
  { id: 2, subject: 'English', title: 'Essay on Independence Day', dueDate: '2026-07-20', status: 'assigned' },
  { id: 3, subject: 'Science', title: 'Biology: Photosynthesis Project', dueDate: '2026-07-22', status: 'assigned' },
]

export const mockCalendarEvents = [
  { date: '2026-08-15', title: 'Annual Sports Day', type: 'event' },
  { date: '2026-08-01', title: 'Mid-term Exams Begin', type: 'exam' },
  { date: '2026-07-25', title: 'Parent-Teacher Meeting', type: 'event' },
  { date: '2026-08-26', title: 'Independence Day Holiday', type: 'holiday' },
]

export const mockTimetable = [
  { period: 1, time: '8:00 – 8:45', monday: 'Mathematics', tuesday: 'English', wednesday: 'Science', thursday: 'Mathematics', friday: 'Hindi' },
  { period: 2, time: '8:45 – 9:30', monday: 'English', tuesday: 'Science', wednesday: 'Mathematics', thursday: 'English', friday: 'Mathematics' },
  { period: 3, time: '9:30 – 10:15', monday: 'Science', tuesday: 'Mathematics', wednesday: 'English', thursday: 'Science', friday: 'Science' },
  { period: 4, time: '10:30 – 11:15', monday: 'Hindi', tuesday: 'Hindi', wednesday: 'Hindi', thursday: 'Hindi', friday: 'Hindi' },
  { period: 5, time: '11:15 – 12:00', monday: 'Social Studies', tuesday: 'Computer Science', wednesday: 'Social Studies', thursday: 'Computer Science', friday: 'PE' },
]

export const mockStudyMaterials = [
  { id: 1, subject: 'Mathematics', title: 'Algebra Basics', type: 'PDF', uploadDate: '2026-07-10' },
  { id: 2, subject: 'English', title: 'Shakespeare Summary', type: 'PDF', uploadDate: '2026-07-12' },
  { id: 3, subject: 'Science', title: 'Periodic Table Guide', type: 'PDF', uploadDate: '2026-07-14' },
  { id: 4, subject: 'Computer Science', title: 'Python Basics Tutorial', type: 'Video', uploadDate: '2026-07-15' },
]

export const mockChildProgress = {
  studentName: 'Aarav Mehta',
  class: '8-B',
  overallGrade: 'A',
  performanceTrend: 'Improving',
  riskLevel: 'Low',
  strengths: ['Mathematics', 'Science'],
  focusAreas: ['English Composition', 'History Dates'],
  attendance: '96%',
  recentMarks: [92, 88, 90, 89, 91],
  teacherRemarks: 'Excellent performance. Keep up the good work!',
}
