package com.school.service;

import com.school.dto.request.AdminRequest;
import com.school.dto.response.DashboardSummaryResponse;
import com.school.dto.response.UserResponse;

import java.util.List;

public interface AdminService {
    DashboardSummaryResponse getDashboardSummary();
    List<UserResponse> listAdmins();
    UserResponse createAdmin(AdminRequest request);
    void deleteAdmin(String userId, String requestingUserId);
}