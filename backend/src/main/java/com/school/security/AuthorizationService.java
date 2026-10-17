package com.school.security;

import com.school.document.Student;
import com.school.repository.ParentStudentRepository;
import com.school.repository.StudentRepository;
import com.school.repository.TeacherAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final ParentStudentRepository parentStudentRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentRepository studentRepository;
    private final com.school.repository.ParentRepository parentRepository;

    public boolean canViewStudent(org.springframework.security.core.userdetails.UserDetails principal, String principalRefId, String role, String studentId) {
        // Admin can view everything
        if (role != null && role.equals("ADMIN")) return true;

        // Student viewing their own data: User.refId is already the Student
        // document's own id (see StudentServiceImpl#user.setRefId(student.getId())),
        // and studentId here is that same Student id (the frontend passes
        // user.refId straight through as the path variable). So this is a
        // direct comparison — no need to look up the Student document or
        // touch Student.userId, which is the *reverse* link (User's own id)
        // and was never the right field to compare principalRefId against.
        if (role != null && role.equals("STUDENT")) {
            return principalRefId != null && principalRefId.equals(studentId);
        }

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return false;

        // Parent linked to student?
        if (role != null && role.equals("PARENT")) {
            if (parentStudentRepository.existsByParentIdAndStudentIdAndUnlinkedAtIsNull(principalRefId, studentId)) {
                return true;
            }
            if (principalRefId != null && parentRepository != null) {
                return parentRepository.findById(principalRefId)
                        .map(p -> p.getChildrenIds() != null && p.getChildrenIds().contains(studentId))
                        .orElse(false);
            }
            return false;
        }

        // Teacher: allow viewing students in the school
        if (role != null && role.equals("TEACHER")) {
            return true;
        }

        return false;
    }
}