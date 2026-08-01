package com.school.service.impl;

import com.school.document.Parent;
import com.school.document.Role;
import com.school.document.Student;
import com.school.document.User;
import com.school.dto.response.BulkImportResponse;
import com.school.dto.response.ImportResultItem;
import com.school.exception.DuplicateResourceException;
import com.school.mapper.ParentMapper;
import com.school.mapper.StudentMapper;
import com.school.repository.ParentRepository;
import com.school.repository.StudentRepository;
import com.school.repository.UserRepository;
import com.school.service.BulkImportService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BulkImportServiceImpl implements BulkImportService {

    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public BulkImportResponse importParentsAndStudents(MultipartFile file) {
        List<ImportResultItem> details = new ArrayList<>();
        int createdParents = 0;
        int createdStudents = 0;

        try (InputStream in = file.getInputStream(); Workbook workbook = new XSSFWorkbook(in)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new IllegalArgumentException("Uploaded file must contain at least one sheet.");
            }

            Map<String, String> parentEmailToId = new HashMap<>();
            List<ParsedRow> rows = parseRows(sheet, details);

            for (ParsedRow row : rows) {
                if (row.errors.size() > 0) {
                    details.add(buildResult(row.rowNumber, "skipped", String.join("; ", row.errors)));
                    continue;
                }

                try {
                    String parentEmailKey = row.parentEmail.toLowerCase();
                    String parentId = parentEmailToId.get(parentEmailKey);
                    if (parentId == null) {
                        try {
                            Parent parent = createParent(row);
                            createdParents++;
                            parentId = parent.getId();
                        } catch (DuplicateResourceException ex) {
                            parentId = parentRepository.findByEmailIgnoreCase(parentEmailKey)
                                    .map(Parent::getId)
                                    .orElse(null);
                        }
                        if (parentId != null) {
                            parentEmailToId.put(parentEmailKey, parentId);
                        }
                    }

                    if (parentId == null) {
                        details.add(buildResult(row.rowNumber, "skipped", "Parent creation failed due to duplicate email."));
                        continue;
                    }

                    if (studentRepository.existsByEmailIgnoreCase(row.studentEmail)) {
                        details.add(buildResult(row.rowNumber, "skipped", "Student email already exists."));
                        continue;
                    }

                    Student student = createStudent(row, parentId);
                    createdStudents++;
                    details.add(buildResult(row.rowNumber, "created", "Student and parent linked successfully."));
                } catch (Exception ex) {
                    details.add(buildResult(row.rowNumber, "skipped", ex.getMessage()));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file.", e);
        }

        BulkImportResponse response = new BulkImportResponse();
        response.setCreatedParents(createdParents);
        response.setCreatedStudents(createdStudents);
        response.setSkippedRows((int) details.stream().filter(d -> d.getStatus().equals("skipped")).count());
        response.setDetails(details);
        return response;
    }

    private List<ParsedRow> parseRows(Sheet sheet, List<ImportResultItem> details) {
        Map<String, Integer> headerIndex = buildHeaderIndex(sheet);
        List<ParsedRow> rows = new ArrayList<>();
        for (int rowNum = 1; rowNum <= sheet.getLastRowNum(); rowNum++) {
            Row row = sheet.getRow(rowNum);
            if (row == null) continue;

            ParsedRow parsed = new ParsedRow();
            parsed.rowNumber = String.valueOf(rowNum + 1);
            parsed.parentName = getString(row, headerIndex.getOrDefault("parentName", -1));
            parsed.studentName = getString(row, headerIndex.getOrDefault("studentName", -1));
            parsed.parentEmail = getString(row, headerIndex.getOrDefault("parentEmail", -1));
            parsed.studentEmail = getString(row, headerIndex.getOrDefault("studentEmail", -1));
            parsed.parentPassword = getString(row, headerIndex.getOrDefault("parentPassword", -1));
            parsed.studentPassword = getString(row, headerIndex.getOrDefault("studentPassword", -1));
            parsed.phone = getString(row, headerIndex.getOrDefault("phone", -1));
            parsed.address = getString(row, headerIndex.getOrDefault("address", -1));
            parsed.schoolClass = getString(row, headerIndex.getOrDefault("schoolClass", -1));

            if (parsed.parentName.isBlank()) parsed.errors.add("Parent name is required");
            if (parsed.studentName.isBlank()) parsed.errors.add("Student name is required");
            if (parsed.parentEmail.isBlank()) parsed.errors.add("Parent email is required");
            if (parsed.studentEmail.isBlank()) parsed.errors.add("Student email is required");
            if (parsed.parentPassword.isBlank()) parsed.errors.add("Parent password is required");
            if (parsed.studentPassword.isBlank()) parsed.errors.add("Student password is required");
            if (parsed.schoolClass.isBlank()) parsed.errors.add("Class is required");

            rows.add(parsed);
        }
        return rows;
    }

    private Map<String, Integer> buildHeaderIndex(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        Map<String, Integer> indexMap = new HashMap<>();
        if (headerRow == null) {
            return indexMap;
        }

        int studentEmailIndex = -1;
        int parentEmailIndex = -1;
        List<Integer> genericPasswordIndexes = new ArrayList<>();
        List<Integer> genericPhoneIndexes = new ArrayList<>();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String header = getString(headerRow, i).toLowerCase().replaceAll("\\s+", " ").trim();
            switch (header) {
                case "parent name", "parent" -> indexMap.put("parentName", i);
                case "student name", "student" -> indexMap.put("studentName", i);
                case "parent email", "parent mail", "parentemail", "parentmail" -> {
                    indexMap.put("parentEmail", i);
                    parentEmailIndex = i;
                }
                case "student email", "student mail", "studentemail", "studentmail" -> {
                    indexMap.put("studentEmail", i);
                    studentEmailIndex = i;
                }
                case "parent password", "parentpassword" -> indexMap.put("parentPassword", i);
                case "student password", "studentpassword" -> indexMap.put("studentPassword", i);
                case "password", "pass", "pwd" -> genericPasswordIndexes.add(i);
                case "class", "school class", "classname" -> indexMap.put("schoolClass", i);
                case "phone", "mobile", "mobile no", "mobile number" -> genericPhoneIndexes.add(i);
                case "student phone", "studentphone", "phone (student)" -> {
                    if (!indexMap.containsKey("phone")) {
                        genericPhoneIndexes.add(i);
                    }
                }
                case "parent phone", "parentphone", "phone (parent)" -> {
                    if (!indexMap.containsKey("phone")) {
                        genericPhoneIndexes.add(i);
                    }
                }
                case "address", "residence", "parent address", "student address" -> indexMap.put("address", i);
            }
        }

        for (int idx : genericPasswordIndexes) {
            if (!indexMap.containsKey("studentPassword") && studentEmailIndex >= 0 && idx > studentEmailIndex && (parentEmailIndex < 0 || idx < parentEmailIndex)) {
                indexMap.put("studentPassword", idx);
                continue;
            }
            if (!indexMap.containsKey("parentPassword") && parentEmailIndex >= 0 && idx > parentEmailIndex) {
                indexMap.put("parentPassword", idx);
            }
        }
        if (!indexMap.containsKey("studentPassword") && !genericPasswordIndexes.isEmpty()) {
            indexMap.put("studentPassword", genericPasswordIndexes.get(0));
        }
        if (!indexMap.containsKey("parentPassword") && genericPasswordIndexes.size() > 1) {
            indexMap.put("parentPassword", genericPasswordIndexes.get(1));
        }

        if (!indexMap.containsKey("phone") && !genericPhoneIndexes.isEmpty()) {
            if (parentEmailIndex >= 0) {
                for (int idx : genericPhoneIndexes) {
                    if (idx > parentEmailIndex) {
                        indexMap.put("phone", idx);
                        break;
                    }
                }
            }
            if (!indexMap.containsKey("phone")) {
                indexMap.put("phone", genericPhoneIndexes.get(0));
            }
        }

        return indexMap;
    }

    private Parent createParent(ParsedRow row) {
        if (userRepository.existsByEmail(row.parentEmail)) {
            throw new DuplicateResourceException("Parent email already exists: " + row.parentEmail);
        }
        User user = User.builder()
                .name(row.parentName)
                .email(row.parentEmail.toLowerCase())
                .password(passwordEncoder.encode(row.parentPassword))
                .role(Role.PARENT)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        Parent parent = Parent.builder()
                .userId(user.getId())
                .name(row.parentName)
                .email(row.parentEmail.toLowerCase())
                .phone(row.phone)
                .address(row.address)
                .childrenIds(List.of())
                .build();
        parent = parentRepository.save(parent);

        user.setRefId(parent.getId());
        userRepository.save(user);
        return parent;
    }

    private Student createStudent(ParsedRow row, String parentId) {
        if (userRepository.existsByEmail(row.studentEmail)) {
            throw new DuplicateResourceException("Student email already exists: " + row.studentEmail);
        }
        User user = User.builder()
                .name(row.studentName)
                .email(row.studentEmail.toLowerCase())
                .password(passwordEncoder.encode(row.studentPassword))
                .role(Role.STUDENT)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .userId(user.getId())
                .name(row.studentName)
                .email(row.studentEmail.toLowerCase())
                .classId(row.schoolClass)
                .section("")
                .parentIds(new java.util.ArrayList<>(List.of(parentId)))
                .build();
        Student savedStudent = studentRepository.save(student);

        user.setRefId(savedStudent.getId());
        userRepository.save(user);

        parentRepository.findById(parentId).ifPresent(parent -> {
            if (parent.getChildrenIds().isEmpty()) {
                parent.setChildrenIds(new java.util.ArrayList<>());
            }
            parent.getChildrenIds().add(savedStudent.getId());
            parentRepository.save(parent);
        });

        return savedStudent;
    }

    private ImportResultItem buildResult(String row, String status, String message) {
        ImportResultItem item = new ImportResultItem();
        item.setRow(row);
        item.setStatus(status);
        item.setMessage(message);
        return item;
    }

    private String getString(Row row, int index) {
        var cell = row.getCell(index);
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }

    private static class ParsedRow {
        String rowNumber;
        String parentName = "";
        String studentName = "";
        String parentEmail = "";
        String studentEmail = "";
        String parentPassword = "";
        String studentPassword = "";
        String phone = "";
        String address = "";
        String schoolClass = "";
        List<String> errors = new ArrayList<>();
    }
}
