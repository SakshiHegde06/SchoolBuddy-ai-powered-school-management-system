package com.school.controller;

import com.school.dto.response.MarkResponse;
import com.school.security.CustomUserDetails;
import com.school.document.User;
import com.school.service.MarkService;
import com.school.security.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarkControllerTest {

    @Mock
    MarkService markService;

    @Mock
    AuthorizationService authorizationService;

    @Mock
    com.school.service.TeacherAssignmentService teacherAssignmentService;

    @InjectMocks
    MarkController markController;

    private CustomUserDetails principal;

    @BeforeEach
    void setUp() {
        User user = User.builder().id("u1").refId("teacher-1").role(com.school.document.Role.TEACHER).build();
        principal = new CustomUserDetails(user, List.of(new SimpleGrantedAuthority("ROLE_TEACHER")));
    }

    @Test
    void findByStudent_whenAuthorized_returnsMarks() {
        when(authorizationService.canViewStudent(principal, "teacher-1", "TEACHER", "s1")).thenReturn(true);
        when(markService.findByStudent("s1")).thenReturn(List.of(new MarkResponse()));

        List<MarkResponse> res = markController.findByStudent("s1", principal);
        assertNotNull(res);
        assertEquals(1, res.size());
    }

    @Test
    void findByStudent_whenNotAuthorized_throws() {
        when(authorizationService.canViewStudent(principal, "teacher-1", "TEACHER", "s1")).thenReturn(false);

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            markController.findByStudent("s1", principal);
        });
    }
}
