package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "parents")
public class Parent {

    @Id
    private String id;

    private String userId;

    private String name;

    private String email;

    private String phone;

    private String address;

    @Builder.Default
    private List<String> childrenIds = List.of();
}