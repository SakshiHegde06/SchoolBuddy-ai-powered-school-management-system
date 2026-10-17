package com.school.service.impl;

import com.school.document.Parent;
import com.school.document.ParentStudent;
import com.school.document.SchoolClass;
import com.school.document.Student;
import com.school.dto.request.ParentStudentRequest;
import com.school.dto.response.ParentStudentResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.ParentStudentMapper;
import com.school.repository.ClassRepository;
import com.school.repository.ParentRepository;
import com.school.repository.ParentStudentRepository;
import com.school.repository.StudentRepository;
import com.school.service.ParentStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParentStudentServiceImpl implements ParentStudentService {

    private final ParentStudentRepository linkRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final ClassRepository classRepository;

    @Override
    public List<ParentStudentResponse> findChildrenByParentId(String parentId) {
        return linkRepository.findByParentId(parentId)
                .stream()
                .map(this::enrichLink)
                .toList();
    }

    @Override
    public List<ParentStudentResponse> findActiveChildrenByParentId(String parentId) {
        return linkRepository.findByParentIdAndUnlinkedAtIsNull(parentId)
                .stream()
                .map(this::enrichLink)
                .toList();
    }

    @Override
    public List<ParentStudentResponse> findParentsByStudentId(String studentId) {
        return linkRepository.findByStudentId(studentId)
                .stream()
                .map(this::enrichLink)
                .toList();
    }

    @Override
    public List<ParentStudentResponse> findActiveParentsByStudentId(String studentId) {
        return linkRepository.findByStudentIdAndUnlinkedAtIsNullOrderByPrimaryDesc(studentId)
                .stream()
                .map(this::enrichLink)
                .toList();
    }

    @Override
    public ParentStudentResponse findById(String id) {
        ParentStudent link = linkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parent-Student link not found: " + id));
        return enrichLink(link);
    }

    @Override
    @Transactional
    public ParentStudentResponse create(ParentStudentRequest request) {
        // Validate parent exists
        Parent parent = parentRepository.findById(request.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found: " + request.getParentId()));

        // Validate student exists
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + request.getStudentId()));

        // Check if link already exists and is active
        if (linkRepository.existsByParentIdAndStudentIdAndUnlinkedAtIsNull(
                request.getParentId(),
                request.getStudentId())) {
            throw new IllegalArgumentException("Parent is already linked to this student");
        }

        ParentStudent link = ParentStudent.builder()
                .parentId(request.getParentId())
                .studentId(request.getStudentId())
                .guardianType(request.getGuardianType())
                .primary(request.isPrimary())
                .primaryContact(request.isPrimaryContact())
                .linkedAt(Instant.now())
                .notes(request.getNotes())
                .build();

        link = linkRepository.save(link);
        return enrichLink(link);
    }

    @Override
    @Transactional
    public ParentStudentResponse update(String id, ParentStudentRequest request) {
        ParentStudent link = linkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parent-Student link not found: " + id));

        // Update the attributes
        link.setGuardianType(request.getGuardianType());
        link.setPrimary(request.isPrimary());
        link.setPrimaryContact(request.isPrimaryContact());
        link.setNotes(request.getNotes());

        link = linkRepository.save(link);
        return enrichLink(link);
    }

    @Override
    @Transactional
    public void delete(String id) {
        ParentStudent link = linkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parent-Student link not found: " + id));

        // Soft delete: mark as unlinked at current time
        link.setUnlinkedAt(Instant.now());
        linkRepository.save(link);
    }

    @Override
    public boolean isParentLinkedToStudent(String parentId, String studentId) {
        return linkRepository.existsByParentIdAndStudentIdAndUnlinkedAtIsNull(parentId, studentId);
    }

    @Override
    public ParentStudentResponse findPrimaryContactByStudentId(String studentId) {
        ParentStudent link = linkRepository.findByStudentIdAndPrimaryContactTrue(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("No primary contact found for student: " + studentId));
        return enrichLink(link);
    }

    /**
     * Helper method to enrich link with parent, student, and class names.
     */
    private ParentStudentResponse enrichLink(ParentStudent link) {
        Parent parent = parentRepository.findById(link.getParentId()).orElse(null);
        Student student = studentRepository.findById(link.getStudentId()).orElse(null);
        SchoolClass schoolClass = student != null && student.getClassId() != null
                ? classRepository.findById(student.getClassId()).orElse(null)
                : null;

        return ParentStudentMapper.toResponse(link, parent, student, schoolClass);
    }
}
