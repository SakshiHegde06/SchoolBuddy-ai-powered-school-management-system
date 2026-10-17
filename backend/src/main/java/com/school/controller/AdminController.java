package com.school.controller;

import com.school.dto.request.AdminRequest;
import com.school.dto.response.DashboardSummaryResponse;
import com.school.dto.response.UserResponse;
import com.school.security.CustomUserDetails;
import com.school.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Everything here is admin-only. The dashboard-summary endpoint backs the
// stat cards on AdminDashboardPage; the rest manages other Admin accounts.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard-summary")
    public DashboardSummaryResponse dashboardSummary() {
        return adminService.getDashboardSummary();
    }

    @GetMapping
    public List<UserResponse> listAdmins() {
        return adminService.listAdmins();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createAdmin(@Valid @RequestBody AdminRequest request) {
        return adminService.createAdmin(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAdmin(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails principal) {
        adminService.deleteAdmin(id, principal.getUser().getId());
    }
}