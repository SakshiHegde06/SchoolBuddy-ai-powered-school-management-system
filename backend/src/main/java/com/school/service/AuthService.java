package com.school.service;

import com.school.document.User;
import com.school.dto.request.LoginRequest;
import com.school.dto.response.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    User getCurrentUser(String email);
}