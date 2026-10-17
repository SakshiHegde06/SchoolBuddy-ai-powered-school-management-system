package com.school.mapper;

import com.school.document.User;
import com.school.dto.response.UserResponse;

public class UserMapper {
    private UserMapper() {}

    public static UserResponse toResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .refId(user.getRefId())
                .build();
    }
}