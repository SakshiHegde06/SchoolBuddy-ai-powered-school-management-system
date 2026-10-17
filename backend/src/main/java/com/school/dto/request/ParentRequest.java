package com.school.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ParentRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    private String password;

    private String phone;

    private String address;

    private List<String> childrenIds;
}
