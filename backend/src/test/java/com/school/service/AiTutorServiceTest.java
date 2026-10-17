package com.school.service;

import com.school.document.StudyMaterial;
import com.school.dto.ai.AiTutorRequest;
import com.school.dto.ai.AiTutorResponse;
import com.school.repository.StudyMaterialRepository;
import com.school.repository.SubjectRepository;
import com.school.service.impl.AiTutorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiTutorServiceTest {

    @Mock
    StudyMaterialRepository studyMaterialRepository;

    @Mock
    SubjectRepository subjectRepository;

    @Mock
    FileStorageService fileStorageService;

    @InjectMocks
    AiTutorServiceImpl aiTutorService;

    private PdfStudyNotesGenerator pdfGenerator;

    @BeforeEach
    void setUp() {
        pdfGenerator = new PdfStudyNotesGenerator();
    }

    @Test
    void testTopicsGeneration() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("TOPICS")
                .topic("Algebra Basics & Quadratic Equations")
                .subject("Mathematics")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertTrue(response.isAcademic());
        assertNotNull(response.getKeyTopics());
        assertFalse(response.getKeyTopics().isEmpty());
        assertNotNull(response.getCoreDefinitions());
        assertNotNull(response.getKeyFormulasOrRules());
        assertNotNull(response.getExamFocusPoints());
    }

    @Test
    void testMcqGeneration() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("MCQ")
                .topic("Newtonian Mechanics")
                .subject("Physics")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertTrue(response.isAcademic());
        assertNotNull(response.getMcqs());
        assertTrue(response.getMcqs().size() >= 5, "Should generate at least 5 MCQs");

        var q1 = response.getMcqs().get(0);
        assertEquals(4, q1.getOptions().size());
        assertTrue(q1.getCorrectOptionIndex() >= 0 && q1.getCorrectOptionIndex() < 4);
        assertNotNull(q1.getExplanation());
        assertFalse(q1.getExplanation().isBlank());
    }

    @Test
    void testFiveMarkQuestionsGeneration() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("5M")
                .topic("Periodic Table & Chemical Bonding")
                .subject("Chemistry")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertTrue(response.isAcademic());
        assertNotNull(response.getFiveMarkQuestions());
        assertFalse(response.getFiveMarkQuestions().isEmpty());

        var q = response.getFiveMarkQuestions().get(0);
        assertEquals(5, q.getMarks());
        assertNotNull(q.getKeyPoints());
        assertNotNull(q.getModelAnswer());
        assertNotNull(q.getMarkingRubric());
        assertNotNull(q.getExamTip());
    }

    @Test
    void testTenMarkQuestionsGeneration() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("10M")
                .topic("Photosynthesis Mechanism")
                .subject("Biology")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertTrue(response.isAcademic());
        assertNotNull(response.getTenMarkQuestions());
        assertFalse(response.getTenMarkQuestions().isEmpty());

        var q = response.getTenMarkQuestions().get(0);
        assertEquals(10, q.getMarks());
        assertNotNull(q.getModelAnswer());
        assertNotNull(q.getMarkingRubric());
    }

    @Test
    void testAcademicGuardrailInterceptsNonAcademicQuery() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("CHAT")
                .query("can you play fortnite with me and tell me funny gaming memes")
                .topic("Mathematics")
                .subject("Mathematics")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertFalse(response.isAcademic(), "Guardrail should flag gaming query as non-academic");
        assertNotNull(response.getGuardrailNotice());
        assertTrue(response.getGuardrailNotice().contains("Guardrail Active"));
    }

    @Test
    void testAcademicGuardrailAllowsCurriculumDoubts() {
        AiTutorRequest request = AiTutorRequest.builder()
                .mode("CHAT")
                .query("Can you explain how to solve quadratic equations by completing the square?")
                .topic("Algebra")
                .subject("Mathematics")
                .build();

        AiTutorResponse response = aiTutorService.getTutorResponse(request);

        assertNotNull(response);
        assertTrue(response.isAcademic(), "Legitimate math doubt should be approved");
        assertNotNull(response.getChatAnswer());
        assertTrue(response.getChatAnswer().contains("Algebra"));
    }

    @Test
    void testPdfGeneratorProducesValidBytes() {
        StudyMaterial material = StudyMaterial.builder()
                .id("mat-test")
                .title("Algebra Basics & Quadratic Equations")
                .build();

        byte[] pdfBytes = pdfGenerator.generateStudyNotesPdf(material, "Mathematics", "Grade 10-A");

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "Generated PDF should have non-trivial size");
        // Check standard PDF magic header (%PDF-)
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }
}
