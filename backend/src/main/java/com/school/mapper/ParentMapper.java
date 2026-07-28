package com.school.mapper;

import com.school.document.Parent;
import com.school.dto.response.ParentResponse;

public class ParentMapper {
    private ParentMapper() {}

    public static ParentResponse toResponse(Parent parent) {
        if (parent == null) return null;
        return ParentResponse.builder()
                .id(parent.getId())
                .userId(parent.getUserId())
                .name(parent.getName())
                .email(parent.getEmail())
                .phone(parent.getPhone())
                .address(parent.getAddress())
                .childrenIds(parent.getChildrenIds())
                .build();
    }
}
