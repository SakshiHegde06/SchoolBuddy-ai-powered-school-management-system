package com.school.security;

import com.school.document.Student;
import com.school.document.TeacherAssignment;
import com.school.repository.ParentStudentRepository;
import com.school.repository.StudentRepository;
import com.school.repository.TeacherAssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock
    ParentStudentRepository parentStudentRepository;

    @Mock
    TeacherAssignmentRepository teacherAssignmentRepository;

    @Mock
    StudentRepository studentRepository;

    @Mock
    com.school.repository.ParentRepository parentRepository;

    @InjectMocks
    AuthorizationService authorizationService;

    private Student student;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id("s1")
                .userId("stu-user-1")
                .classId("class-8A")
                .build();
    }

    @Test
    void adminCanViewAnyStudent() {
        boolean ok = authorizationService.canViewStudent(null, "anyRef", "ADMIN", "s1");
        assertTrue(ok);
    }

    @Test
    void parentCanViewLinkedChild() {
        when(studentRepository.findById("s1")).thenReturn(Optional.of(student));
        when(parentStudentRepository.existsByParentIdAndStudentIdAndUnlinkedAtIsNull(eq("parent-1"), eq("s1"))).thenReturn(true);

        boolean ok = authorizationService.canViewStudent(null, "parent-1", "PARENT", "s1");
        assertTrue(ok);
    }

    @Test
    void teacherCanViewIfAssignedToClass() {
        when(studentRepository.findById("s1")).thenReturn(Optional.of(student));

        TeacherAssignment ta = TeacherAssignment.builder()
                .id("ta1")
                .teacherId("t1")
                .classId("class-8A")
                .build();

        when(teacherAssignmentRepository.findActiveAssignmentsByTeacherAtDate(eq("t1"), any(LocalDate.class)))
                .thenReturn(List.of(ta));

        boolean ok = authorizationService.canViewStudent(null, "t1", "TEACHER", "s1");
        assertTrue(ok);
    }

    @Test
    void unknownStudentReturnsFalse() {
        when(studentRepository.findById("s-missing")).thenReturn(Optional.empty());
        boolean ok = authorizationService.canViewStudent(null, "any", "PARENT", "s-missing");
        assertFalse(ok);
    }
}
