package com.school.service.impl;

import com.school.document.MaterialType;
import com.school.document.StudyMaterial;
import com.school.document.Subject;
import com.school.dto.ai.AiTutorRequest;
import com.school.dto.ai.AiTutorResponse;
import com.school.dto.ai.ExamQuestionDto;
import com.school.dto.ai.McqQuestionDto;
import com.school.repository.StudyMaterialRepository;
import com.school.repository.SubjectRepository;
import com.school.service.AiTutorService;
import com.school.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTutorServiceImpl implements AiTutorService {

    private final StudyMaterialRepository studyMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final FileStorageService fileStorageService;

    // Academic keywords and concepts to validate educational scope
    private static final Set<String> ACADEMIC_TERMS = Set.of(
            "math", "mathematics", "algebra", "calculus", "geometry", "trigonometry", "formula", "equation", "solve",
            "physics", "science", "chemistry", "biology", "atom", "molecule", "cell", "photosynthesis", "velocity",
            "acceleration", "force", "gravity", "energy", "momentum", "thermodynamics", "optics", "electric", "current",
            "history", "geography", "civics", "constitution", "revolution", "climate", "map", "war", "monarchy", "democracy",
            "english", "literature", "grammar", "poem", "essay", "author", "character", "metaphor", "sentence", "comprehension",
            "computer", "python", "code", "programming", "algorithm", "loop", "function", "array", "database", "sql",
            "mcq", "exam", "question", "answer", "mark", "marks", "test", "quiz", "revision", "syllabus", "concept",
            "explain", "define", "derive", "differentiate", "calculate", "prove", "describe", "evaluate", "diagram", "rubric"
    );

    // Non-academic / off-topic indicators
    private static final List<String> NON_ACADEMIC_PATTERNS = List.of(
            "game", "gaming", "fortnite", "pubg", "roblox", "minecraft", "play a game",
            "movie", "celebrity", "gossip", "dating", "flirt", "boyfriend", "girlfriend",
            "joke", "tell me a joke", "funny", "meme", "song lyrics", "music video",
            "hack", "password crack", "bypass", "cheat", "crypto", "bitcoin", "horoscope"
    );

    @Override
    public AiTutorResponse getTutorResponseForMaterial(String materialId, AiTutorRequest request) {
        StudyMaterial material = studyMaterialRepository.findById(materialId).orElse(null);
        String subjectName = "General Studies";
        String extractedText = "";

        if (material != null) {
            if (material.getSubjectId() != null) {
                subjectName = subjectRepository.findById(material.getSubjectId())
                        .map(Subject::getName)
                        .orElse(subjectName);
            }
            // Attempt to extract text from PDF file if stored locally
            if (material.getType() == MaterialType.PDF && material.getFileName() != null) {
                extractedText = extractPdfTextSafely(material.getFileName());
            }
        }

        // Fill in subject / topic from material if not passed
        if (request.getSubject() == null || request.getSubject().isBlank()) {
            request.setSubject(subjectName);
        }
        if (request.getTopic() == null || request.getTopic().isBlank()) {
            request.setTopic(material != null && material.getTitle() != null ? material.getTitle() : "Academic Concepts");
        }

        return generateCurriculumResponse(request, extractedText);
    }

    @Override
    public AiTutorResponse getTutorResponse(AiTutorRequest request) {
        return generateCurriculumResponse(request, "");
    }

    private AiTutorResponse generateCurriculumResponse(AiTutorRequest request, String extractedText) {
        String mode = request.getMode() != null ? request.getMode().toUpperCase() : "TOPICS";
        String topic = (request.getTopic() != null && !request.getTopic().isBlank())
                ? request.getTopic()
                : "Curriculum Subject Topic";
        String subject = (request.getSubject() != null && !request.getSubject().isBlank())
                ? request.getSubject()
                : detectSubjectFromTopic(topic);

        // Strict academic guardrail check for chat or custom queries
        if (request.getQuery() != null && !request.getQuery().isBlank()) {
            if (!isStrictlyAcademic(request.getQuery(), subject, topic)) {
                return AiTutorResponse.builder()
                        .mode(mode)
                        .title(topic)
                        .subject(subject)
                        .academic(false)
                        .guardrailNotice("🔒 Academic Guardrail Active: SchoolBuddy AI Study Tutor is strictly restricted to educational topics, school curriculum, syllabus concepts, and exam preparations. Please ask questions related to your subjects or study materials.")
                        .chatAnswer("I am your dedicated SchoolBuddy Academic Study Tutor! I can only assist with academic questions, curriculum topics, conceptual doubts, and exam prep (such as MCQs, 5M, and 10M questions). Feel free to ask any doubt about " + subject + " or your study materials!")
                        .followUpQuestions(List.of(
                                "Can you explain the key concepts of " + topic + "?",
                                "Generate 5 practice MCQs on " + topic,
                                "What are the common 5-mark questions from this chapter?"
                        ))
                        .build();
            }
        }

        AiTutorResponse.AiTutorResponseBuilder builder = AiTutorResponse.builder()
                .mode(mode)
                .title(topic)
                .subject(subject)
                .academic(true);

        switch (mode) {
            case "MCQ":
                builder.mcqs(generateMcqs(topic, subject, extractedText));
                break;
            case "5M":
                builder.fiveMarkQuestions(generateFiveMarkQuestions(topic, subject, extractedText));
                break;
            case "10M":
                builder.tenMarkQuestions(generateTenMarkQuestions(topic, subject, extractedText));
                break;
            case "CHAT":
                builder.chatAnswer(generateChatAnswer(request.getQuery(), topic, subject, extractedText));
                builder.followUpQuestions(generateFollowUps(topic, subject));
                break;
            case "TOPICS":
            default:
                builder.keyTopics(generateKeyTopics(topic, subject));
                builder.coreDefinitions(generateCoreDefinitions(topic, subject));
                builder.keyFormulasOrRules(generateKeyFormulasOrRules(topic, subject));
                builder.examFocusPoints(generateExamFocusPoints(topic, subject));
                builder.commonPitfalls(generateCommonPitfalls(topic, subject));
                break;
        }

        return builder.build();
    }

    /**
     * Guardrail checker: verifies that a query has legitimate academic intent
     */
    private boolean isStrictlyAcademic(String query, String subject, String topic) {
        if (query == null || query.isBlank()) return true;
        String lower = query.toLowerCase().trim();

        // Check for non-academic patterns
        for (String bad : NON_ACADEMIC_PATTERNS) {
            if (lower.contains(bad)) {
                return false;
            }
        }

        // Single casual greeting check
        if (lower.matches("^(hi|hello|hey|sup|yo|good morning|good evening)[!.]?$")) {
            return true; // allow friendly greeting
        }

        // If context matches subject or academic terms, allow
        for (String term : ACADEMIC_TERMS) {
            if (lower.contains(term)) return true;
        }

        // Allow question words when studying
        if (lower.startsWith("what is") || lower.startsWith("how to") || lower.startsWith("why is")
                || lower.startsWith("explain") || lower.startsWith("can you") || lower.startsWith("solve")
                || lower.startsWith("define") || lower.startsWith("difference between")) {
            return true;
        }

        // Default: If short and contains no academic signal, flag guardrail
        return lower.length() >= 5 && (lower.contains(subject.toLowerCase()) || lower.contains(topic.toLowerCase()));
    }

    private String extractPdfTextSafely(String storedFileName) {
        try {
            Resource resource = fileStorageService.loadAsResource(storedFileName);
            if (resource.exists() && resource.isReadable()) {
                try (InputStream in = resource.getInputStream();
                     PDDocument doc = PDDocument.load(in)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    stripper.setStartPage(1);
                    stripper.setEndPage(Math.min(5, doc.getNumberOfPages()));
                    String text = stripper.getText(doc);
                    return text != null && text.length() > 50 ? text.substring(0, Math.min(3000, text.length())) : "";
                }
            }
        } catch (Exception e) {
            log.debug("PDF text extraction skipped for {}: {}", storedFileName, e.getMessage());
        }
        return "";
    }

    private String detectSubjectFromTopic(String topic) {
        String lower = topic.toLowerCase();
        if (lower.contains("algebra") || lower.contains("matrix") || lower.contains("geometry")
                || lower.contains("calculus") || lower.contains("trigonometry") || lower.contains("polynomial")) {
            return "Mathematics";
        }
        if (lower.contains("physics") || lower.contains("motion") || lower.contains("force")
                || lower.contains("velocity") || lower.contains("gravity") || lower.contains("thermodynamics") || lower.contains("optics")) {
            return "Physics";
        }
        if (lower.contains("periodic") || lower.contains("chemistry") || lower.contains("acid")
                || lower.contains("reaction") || lower.contains("bonding") || lower.contains("element")) {
            return "Chemistry";
        }
        if (lower.contains("bio") || lower.contains("cell") || lower.contains("photosynthesis")
                || lower.contains("genetics") || lower.contains("organism") || lower.contains("reproduction")) {
            return "Biology";
        }
        if (lower.contains("shakespeare") || lower.contains("grammar") || lower.contains("poetry")
                || lower.contains("english") || lower.contains("essay")) {
            return "English";
        }
        if (lower.contains("python") || lower.contains("algorithm") || lower.contains("data structure")
                || lower.contains("program") || lower.contains("sql") || lower.contains("computer")) {
            return "Computer Science";
        }
        if (lower.contains("history") || lower.contains("revolution") || lower.contains("war")
                || lower.contains("constitution") || lower.contains("geography")) {
            return "Social Studies";
        }
        return "Science & General Academics";
    }

    // ----------------------------------------------------
    // TOPICS GENERATOR
    // ----------------------------------------------------
    private List<String> generateKeyTopics(String topic, String subject) {
        return List.of(
                "Core Concept & Axioms: Foundational principles and terminology underlying " + topic + ".",
                "Analytical Framework: Systematic classification and theoretical modeling in " + subject + ".",
                "Primary Mechanisms & Laws: Standard governing laws, scientific behaviors, or mathematical identities.",
                "Comparative Relationships: How " + topic + " interacts with related concepts in the curriculum.",
                "Practical Problem-Solving: Applied derivations, standard numerical formulations, and case analysis.",
                "High-Yield Examination Themes: Repeated examiner questions and marking rubric requirements."
        );
    }

    private List<String> generateCoreDefinitions(String topic, String subject) {
        return List.of(
                "Primary Entity: The rigorous definition of " + topic + " according to board/curriculum standards.",
                "Operational Variables: Identification of dependent vs. independent factors and standard units of measurement.",
                "Boundary Conditions: Constraints, valid domain ranges, and circumstances under which standard formulas apply."
        );
    }

    private List<String> generateKeyFormulasOrRules(String topic, String subject) {
        if ("Mathematics".equalsIgnoreCase(subject)) {
            return List.of(
                    "Standard Representation Form: f(x) = a x^2 + b x + c (ensure a != 0)",
                    "Discriminant & Roots Formula: D = b^2 - 4ac; Roots = (-b +/- sqrt(D)) / (2a)",
                    "Sum & Product of Roots: alpha + beta = -b/a; alpha * beta = c/a"
            );
        }
        if ("Physics".equalsIgnoreCase(subject)) {
            return List.of(
                    "Primary Equation of Motion: v = u + a*t ; s = u*t + (1/2)*a*t^2 ; v^2 = u^2 + 2*a*s",
                    "Conservation Principle: Total initial energy/momentum equals total final energy/momentum in closed system",
                    "Dimensional Homogeneity: Both sides of physical equations must share equivalent SI dimensions [M^a L^b T^c]"
            );
        }
        if ("Chemistry".equalsIgnoreCase(subject)) {
            return List.of(
                    "Stoichiometric Conservation: Number of Moles (n) = Mass (m) / Molar Mass (M)",
                    "Equilibrium Expression: K_eq = [Products]^p / [Reactants]^r at constant temperature",
                    "Periodic Law: Physical and chemical properties are periodic functions of atomic numbers (Z)"
            );
        }
        return List.of(
                "Rule 1 (Precision): State exact definition before beginning steps or proof.",
                "Rule 2 (Notation): Define all variables, symbols, and standard units explicitly.",
                "Rule 3 (Verification): Verify dimensional correctness and perform sanity boundary checks."
        );
    }

    private List<String> generateExamFocusPoints(String topic, String subject) {
        return List.of(
                "Frequently asked definition questions (1-2 marks): Memorize verbatim standard statements.",
                "Short analytical problems (5 marks): Show clear step-by-step intermediate calculations with units.",
                "Long derivations & essay questions (10 marks): Include labeled diagrams, assumptions, and clear conclusions.",
                "Sign-convention / Common Unit conversion pitfalls (e.g., cm to m, grams to kg, radians to degrees)."
        );
    }

    private List<String> generateCommonPitfalls(String topic, String subject) {
        return List.of(
                "Omitting final SI units or stating answer without required significant figures.",
                "Confusing theoretical assumptions with real-world non-ideal states.",
                "Skipping the intermediate reasoning steps that carry partial credit in board examinations.",
                "Misreading question parameters (e.g., 'not true', 'radius vs diameter', 'speed vs velocity')."
        );
    }

    // ----------------------------------------------------
    // MCQ GENERATOR
    // ----------------------------------------------------
    private List<McqQuestionDto> generateMcqs(String topic, String subject, String extractedText) {
        List<McqQuestionDto> list = new ArrayList<>();

        if ("Mathematics".equalsIgnoreCase(subject)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("In quadratic equation ax^2 + bx + c = 0, what does the condition b^2 - 4ac > 0 signify?")
                    .options(List.of("Two distinct real roots", "Two equal real roots", "No real roots (complex roots)", "Infinitely many solutions"))
                    .correctOptionIndex(0)
                    .explanation("When discriminant D = b^2 - 4ac > 0, the square root of D is a positive real number, yielding two distinct real solutions (-b + sqrt(D))/(2a) and (-b - sqrt(D))/(2a).")
                    .difficulty("Easy")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("If alpha and beta are roots of 2x^2 - 4x + 6 = 0, what is the value of alpha + beta?")
                    .options(List.of("2", "-2", "3", "6"))
                    .correctOptionIndex(0)
                    .explanation("By Vieta's formulas, sum of roots is -b/a = -(-4)/2 = 4/2 = 2.")
                    .difficulty("Medium")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("Which of the following functions exhibits a vertex at (0, 0)?")
                    .options(List.of("f(x) = x^2", "f(x) = (x-2)^2", "f(x) = x^2 + 3", "f(x) = x^2 - 5x"))
                    .correctOptionIndex(0)
                    .explanation("The standard parabola f(x) = x^2 has its minimum turning point exactly at the origin (0, 0).")
                    .difficulty("Easy")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("What is the degree of the zero polynomial?")
                    .options(List.of("Not defined", "0", "1", "Infinite"))
                    .correctOptionIndex(0)
                    .explanation("By formal algebraic convention, the degree of the zero polynomial P(x) = 0 is undefined, whereas a non-zero constant polynomial like P(x) = 5 has degree 0.")
                    .difficulty("Hard")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("Which method is guaranteed to solve any arbitrary quadratic equation over real or complex fields?")
                    .options(List.of("Quadratic Formula", "Simple Factorization", "Guess and Check", "Synthetic Division by 1"))
                    .correctOptionIndex(0)
                    .explanation("The quadratic formula derived by completing the square works universally for all coefficients, unlike simple integer factoring.")
                    .difficulty("Medium")
                    .build());
            return list;
        }

        if ("Physics".equalsIgnoreCase(subject)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("Which of Newton's laws provides the quantitative definition of Force (F = ma)?")
                    .options(List.of("First Law", "Second Law", "Third Law", "Law of Universal Gravitation"))
                    .correctOptionIndex(1)
                    .explanation("Newton's Second Law states that the rate of change of momentum is directly proportional to applied force: F = dp/dt = m*a.")
                    .difficulty("Easy")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("When a body undergoes uniform circular motion, which quantity remains strictly constant?")
                    .options(List.of("Speed", "Velocity", "Acceleration", "Displacement"))
                    .correctOptionIndex(0)
                    .explanation("In uniform circular motion, magnitude of velocity (speed) is constant, while the direction continuously changes, generating centripetal acceleration.")
                    .difficulty("Medium")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("What is the SI unit of momentum?")
                    .options(List.of("kg m/s", "kg m/s^2", "Joule", "Watt"))
                    .correctOptionIndex(0)
                    .explanation("Momentum p = m * v has SI dimensions of Mass (kg) multiplied by Velocity (m/s), giving kg m/s (equivalent to Newton-seconds N*s).")
                    .difficulty("Easy")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("Under what condition is the mechanical work done by a force equal to zero?")
                    .options(List.of("Force is perpendicular to displacement", "Force is parallel to displacement", "Displacement is non-zero in force direction", "Mass is constant"))
                    .correctOptionIndex(0)
                    .explanation("Work W = F * d * cos(theta). When force is perpendicular to displacement (theta = 90 deg), cos(90) = 0, so work done is zero.")
                    .difficulty("Hard")
                    .build());
            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("What happens to the kinetic energy of an object if its velocity is doubled?")
                    .options(List.of("Quadruples (4x)", "Doubles (2x)", "Halves (1/2x)", "Remains unchanged"))
                    .correctOptionIndex(0)
                    .explanation("Kinetic Energy KE = (1/2)*m*v^2. Because KE is proportional to the square of velocity, doubling v multiplies KE by 2^2 = 4.")
                    .difficulty("Medium")
                    .build());
            return list;
        }

        // Default high-yield pedagogical MCQs
        list.add(McqQuestionDto.builder()
                .id(1)
                .question("What is the primary governing principle of " + topic + "?")
                .options(List.of(
                        "Conservation of energy and structural balance",
                        "Random uncontrolled fluctuation without constraints",
                        "Inverse linear degradation over time",
                        "Exclusive application only in laboratory conditions"
                ))
                .correctOptionIndex(0)
                .explanation("In standard curriculum analysis, " + topic + " relies on fundamental conservation laws and predictable analytical principles.")
                .difficulty("Easy")
                .build());

        list.add(McqQuestionDto.builder()
                .id(2)
                .question("Which variable acts as the primary controlling parameter in " + topic + "?")
                .options(List.of(
                        "The independent boundary condition",
                        "Unmeasurable subjective estimates",
                        "Constant zero irrespective of input",
                        "Opposite of observed empirical evidence"
                ))
                .correctOptionIndex(0)
                .explanation("Standard experimental and analytical protocol requires identifying and isolating the independent boundary parameter.")
                .difficulty("Medium")
                .build());

        list.add(McqQuestionDto.builder()
                .id(3)
                .question("When evaluating " + topic + " in examinations, what is the most common reason for mark deduction?")
                .options(List.of(
                        "Omitting standard technical terms and units",
                        "Writing clear headings and bullet points",
                        "Stating correct foundational definitions",
                        "Using standardized SI notation"
                ))
                .correctOptionIndex(0)
                .explanation("Examiners deduct marks primarily when students fail to state standard technical keywords, boundary conditions, or proper units.")
                .difficulty("Medium")
                .build());

        list.add(McqQuestionDto.builder()
                .id(4)
                .question("How does " + topic + " behave under extreme or boundary conditions?")
                .options(List.of(
                        "Follows asymptotic limits predicted by governing formulas",
                        "Violates all physical and logical laws",
                        "Becomes entirely indeterminate without pattern",
                        "Inverts signs randomly without mathematical basis"
                ))
                .correctOptionIndex(0)
                .explanation("Under extreme parameter bounds, the mathematical and theoretical models converge toward well-defined asymptotic limits.")
                .difficulty("Hard")
                .build());

        list.add(McqQuestionDto.builder()
                .id(5)
                .question("Which analytical approach provides the most reliable verification of " + topic + "?")
                .options(List.of(
                        "Step-by-step mathematical proof or empirical measurement",
                        "Single arbitrary trial without repetition",
                        "Intuitive assumption without written calculations",
                        "Ignoring contradictory experimental data"
                ))
                .correctOptionIndex(0)
                .explanation("Rigorous verification requires repeatable empirical data or formal deductive derivation from established axioms.")
                .difficulty("Easy")
                .build());

        return list;
    }

    // ----------------------------------------------------
    // 5-MARK QUESTIONS GENERATOR
    // ----------------------------------------------------
    private List<ExamQuestionDto> generateFiveMarkQuestions(String topic, String subject, String extractedText) {
        List<ExamQuestionDto> list = new ArrayList<>();

        list.add(ExamQuestionDto.builder()
                .id(1)
                .question("Define " + topic + " and explain its core mechanism with a clear labeled diagram/formula representation.")
                .marks(5)
                .keyPoints(List.of(
                        "Formal definition adhering to standard textbook/board curriculum (1 Mark)",
                        "Identification of key variables and parameters (1 Mark)",
                        "Core operational mechanism or mathematical expression (2 Marks)",
                        "Relevant diagram, formula layout, or real-world application (1 Mark)"
                ))
                .modelAnswer(
                        "1. Definition: " + topic + " is defined as the fundamental process/principle in " + subject + " wherein standard inputs undergo governed transformation under established conditions.\n\n"
                                + "2. Mathematical / Formal Model: The phenomenon is governed by the standard formulation F = f(x, t), demonstrating direct proportionality to driving parameters.\n\n"
                                + "3. Core Working Mechanism: Under initial conditions, system equilibrium is established. As parameters vary, reactive responses maintain conservation laws.\n\n"
                                + "4. Diagram / Schematic Representation: Draw a clean box diagram showing Input Parameters -> Core Transformation Module (" + topic + ") -> Output Observable Data.\n\n"
                                + "5. Practical Application: Widely utilized in engineering systems, scientific modeling, and curriculum assessment standards."
                )
                .markingRubric("1 Mark: Accurate Definition | 2 Marks: Mechanism & Working | 1 Mark: Diagram/Equation | 1 Mark: Application & Units")
                .examTip("Write exactly 5 numbered points. Never combine definition and equation into one dense paragraph.")
                .build());

        list.add(ExamQuestionDto.builder()
                .id(2)
                .question("Differentiate between the primary types/states associated with " + topic + " in " + subject + ".")
                .marks(5)
                .keyPoints(List.of(
                        "Comparison parameter 1: Theoretical definition and origin (1 Mark)",
                        "Comparison parameter 2: Operational behavior and characteristics (1 Mark)",
                        "Comparison parameter 3: Mathematical formulation or governing laws (1 Mark)",
                        "Comparison parameter 4: Sensitivity to environmental/external changes (1 Mark)",
                        "Comparison parameter 5: Distinct real-world examples of each type (1 Mark)"
                ))
                .modelAnswer(
                        "Draw a clear 3-column table: [Parameter | Type A | Type B]\n"
                                + "1. Nature: Type A represents baseline or ideal behavior, whereas Type B accounts for real-world non-ideal perturbations.\n"
                                + "2. Governing Law: Type A follows simplified linear relationships; Type B involves higher-order coupling parameters.\n"
                                + "3. Reversibility: Type A systems are generally reversible under frictionless conditions; Type B systems incur dissipative losses.\n"
                                + "4. Sensitivity: Type A exhibits deterministic predictability; Type B shows threshold non-linear transitions.\n"
                                + "5. Representative Example: State standard curriculum examples for each state with appropriate SI units."
                )
                .markingRubric("5 points = 5 Marks (1 Mark per distinct, non-overlapping comparison row in tabular format)")
                .examTip("Always present comparative questions in a structured table. It ensures maximum marks and fast grading by examiners.")
                .build());

        list.add(ExamQuestionDto.builder()
                .id(3)
                .question("Explain the significance and practical limitations of " + topic + " in modern " + subject + ".")
                .marks(5)
                .keyPoints(List.of(
                        "Major scientific/academic importance (1 Mark)",
                        "Industrial or technological application (1 Mark)",
                        "Primary constraint or idealization assumption (1 Mark)",
                        "Sources of error or deviation in practical scenarios (1 Mark)",
                        "Modern corrections or advanced extensions applied (1 Mark)"
                ))
                .modelAnswer(
                        "1. Importance: " + topic + " serves as a cornerstone for analytical predictions and standardized curricular problem-solving.\n"
                                + "2. Practical Application: Powers crucial calculations in modern engineering, laboratory synthesis, and computational algorithms.\n"
                                + "3. Foundational Assumption: Assumes idealized parameters (e.g., zero friction, constant temperature, or linear elasticity).\n"
                                + "4. Key Limitations: Real systems experience external turbulence, thermodynamic dissipation, and non-linear boundary effects.\n"
                                + "5. Curricular Remediation: Advanced higher-order correction factors are incorporated to model realistic system behavior."
                )
                .markingRubric("1 Mark per numbered insight with supporting terminology")
                .examTip("Mention both the theoretical strength and the exact real-world constraint that limits the idealized model.")
                .build());

        list.add(ExamQuestionDto.builder()
                .id(4)
                .question("Solve/analyze a standard multi-step analytical problem based on " + topic + ".")
                .marks(5)
                .keyPoints(List.of(
                        "Given data stated clearly with standard SI units (1 Mark)",
                        "Stating governing formula/axiom before substituting values (1 Mark)",
                        "Step-by-step intermediate calculations without arithmetic jumps (2 Marks)",
                        "Final numerical answer highlighted in a box with correct units (1 Mark)"
                ))
                .modelAnswer(
                        "Step 1: Given Parameters: Parameter 1 = X units, Parameter 2 = Y units. Target: Calculate resultant Z.\n"
                                + "Step 2: Governing Formula: State the standard formula Z = f(X, Y) explicitly.\n"
                                + "Step 3: Substitution: Substitute known quantities while maintaining consistent SI dimension conversions.\n"
                                + "Step 4: Intermediate Simplification: Simplify algebraically to prevent arithmetic calculation errors.\n"
                                + "Step 5: Final Result: Box your final value Z with exact units and appropriate significant figures."
                )
                .markingRubric("1 Mark: Given Data | 1 Mark: Formula | 2 Marks: Steps | 1 Mark: Final Answer with Box & Units")
                .examTip("Examiners award step-marks even if your final arithmetic has a small slip, so never skip writing the formula!")
                .build());

        return list;
    }

    // ----------------------------------------------------
    // 10-MARK QUESTIONS GENERATOR
    // ----------------------------------------------------
    private List<ExamQuestionDto> generateTenMarkQuestions(String topic, String subject, String extractedText) {
        List<ExamQuestionDto> list = new ArrayList<>();

        list.add(ExamQuestionDto.builder()
                .id(1)
                .question("Provide a comprehensive analytical exposition of " + topic + ". Derive the governing expressions, discuss underlying assumptions, and evaluate its curriculum importance.")
                .marks(10)
                .keyPoints(List.of(
                        "Section A: Formal Definition, Historical / Theoretical Context (2 Marks)",
                        "Section B: Step-by-step Derivation and Mathematical Formulation (4 Marks)",
                        "Section C: Labeled Schematic Diagram & Physical Interpretation (2 Marks)",
                        "Section D: Real-world Applications, Edge Cases, and Conclusion (2 Marks)"
                ))
                .modelAnswer(
                        "### 1. Introduction & Foundational Concepts (2 Marks)\n"
                                + topic + " represents a foundational pillar within " + subject + ". It establishes the rigorous quantitative relationship governing state variables under defined boundary conditions.\n\n"
                                + "### 2. Theoretical Assumptions (1 Mark)\n"
                                + "- The system is isolated or governed by specified external fields.\n"
                                + "- Material/environmental properties remain isotropic and homogeneous.\n"
                                + "- Losses due to parasitic damping are negligible unless explicitly modeled.\n\n"
                                + "### 3. Step-by-Step Derivation / Core Mechanism (4 Marks)\n"
                                + "Step I: Establish initial boundary condition at t = 0 or equilibrium.\n"
                                + "Step II: Apply conservation principles (Mass / Momentum / Energy / Algebraic Identity).\n"
                                + "Step III: Integrate/differentiate across spatial or state variables.\n"
                                + "Step IV: Arrive at the standard canonical formulation: Result = Function(Parameters).\n\n"
                                + "### 4. Diagrammatic Representation (1 Mark)\n"
                                + "[Provide a fully labeled diagram showing axis labels, coordinate system, active forces/vectors, and direction of energy flow.]\n\n"
                                + "### 5. Practical Applications & Limitations (2 Marks)\n"
                                + "- Engineering & Technology: Direct integration in modern sensor arrays and computational models.\n"
                                + "- Academic Significance: Fundamental requirement for subsequent advanced topics in " + subject + ".\n"
                                + "- Boundary Limitations: Breaks down at relativistic speeds, zero absolute limits, or extreme non-linear domains."
                )
                .markingRubric("2 Marks Intro & Terms | 4 Marks Derivation/Core | 2 Marks Diagram & Labels | 2 Marks Applications & Conclusion")
                .examTip("Use clear markdown-style bold subheadings for each section. Underline final equations and ensure your diagram occupies at least 1/3 of a page with crisp labels.")
                .build());

        list.add(ExamQuestionDto.builder()
                .id(2)
                .question("Critically analyze " + topic + " through experimental / empirical methodology. Design a standard laboratory investigation, outline procedures, data analysis, and error minimization.")
                .marks(10)
                .keyPoints(List.of(
                        "Aim, Apparatus, and Principle of Experiment (2 Marks)",
                        "Step-by-step Procedure & Precautionary Measures (3 Marks)",
                        "Data Observation Table and Graph Plotting Guidelines (3 Marks)",
                        "Sources of Error and Standard Remedial Precautions (2 Marks)"
                ))
                .modelAnswer(
                        "### 1. Objective & Scientific Principle (2 Marks)\n"
                                + "Aim: To experimentally verify the theoretical predictions of " + topic + " and determine the characteristic constant.\n"
                                + "Principle: State the mathematical equation connecting dependent and independent observables.\n\n"
                                + "### 2. Apparatus Required (1 Mark)\n"
                                + "Calibrated measurement sensors, standardized specimen, mounting bench, digital timer, and logging interface.\n\n"
                                + "### 3. Experimental Procedure (3 Marks)\n"
                                + "1. Align apparatus horizontally using a spirit level to eliminate gravitational parallax.\n"
                                + "2. Record zero-error on measuring instruments before taking observations.\n"
                                + "3. Take 5 independent trials by varying the independent variable in equal increments.\n"
                                + "4. Tabulate readings: [Serial No. | Independent (X) | Trial 1 | Trial 2 | Mean (Y)].\n\n"
                                + "### 4. Graphical Analysis & Calculation (2 Marks)\n"
                                + "Plot Y versus X on linear millimeter graph paper. Measure slope m = Delta Y / Delta X. Equate slope to theoretical constant to compute final coefficient.\n\n"
                                + "### 5. Sources of Error & Precautions (2 Marks)\n"
                                + "- Parallax error when reading analog scales.\n"
                                + "- Environmental temperature fluctuations causing expansion.\n"
                                + "- Always compute percentage error: |Experimental - Theoretical| / Theoretical * 100%."
                )
                .markingRubric("2 Marks Aim & Principle | 3 Marks Procedure | 3 Marks Table & Graph | 2 Marks Precautions & Error")
                .examTip("Always include the observation table format and show how slope is extracted from the graph to earn full 10 marks.")
                .build());

        list.add(ExamQuestionDto.builder()
                .id(3)
                .question("Compare and contrast " + topic + " with other core paradigms in " + subject + ". Illustrate with comprehensive case studies and analytical problem scenarios.")
                .marks(10)
                .keyPoints(List.of(
                        "Comparative framework and classification matrix (3 Marks)",
                        "Detailed case scenario 1: Standard classroom application (2.5 Marks)",
                        "Detailed case scenario 2: Complex interdisciplinary application (2.5 Marks)",
                        "Synthesis, evaluation, and future curricular perspective (2 Marks)"
                ))
                .modelAnswer(
                        "### 1. Comparative Structural Matrix (3 Marks)\n"
                                + "Construct an exhaustive comparative grid covering: Formal Definition, Mathematical Complexity, Domain of Applicability, Experimental Verification, and Typical Failure Modes.\n\n"
                                + "### 2. Comprehensive Case Scenario 1 (2.5 Marks)\n"
                                + "Analyze standard scenario where " + topic + " operates under standard conditions. Detail the inputs, the mathematical propagation of variables, and verify with conservation laws.\n\n"
                                + "### 3. Comprehensive Case Scenario 2 (2.5 Marks)\n"
                                + "Examine a coupled non-ideal system where external disturbances interfere. Demonstrate how the primary model adapts through corrective scaling factors.\n\n"
                                + "### 4. Synthesis & Examination Rubric Summary (2 Marks)\n"
                                + "Conclude with an overarching evaluation summarizing why " + topic + " is essential for secondary and higher secondary curriculum mastery."
                )
                .markingRubric("3 Marks Comparative Grid | 5 Marks Two Case Studies (2.5 each) | 2 Marks Synthesis & Conclusion")
                .examTip("Structure your answer with numbered paragraphs and conclude with a crisp summary sentence.")
                .build());

        return list;
    }

    // ----------------------------------------------------
    // CHAT ANSWER GENERATOR (WITH STRICT GUARDRAIL)
    // ----------------------------------------------------
    private String generateChatAnswer(String query, String topic, String subject, String extractedText) {
        if (query == null || query.isBlank()) {
            return "Hello! I am your SchoolBuddy AI Study Tutor. Ask me any conceptual question or doubt about "
                    + topic + " in " + subject + ", and I'll break it down step-by-step with formulas and examples!";
        }

        String qLower = query.toLowerCase();

        // Conceptual explanation
        if (qLower.contains("explain") || qLower.contains("what is") || qLower.contains("concept") || qLower.contains("understand")) {
            return "### 📘 Conceptual Breakdown: " + topic + " (" + subject + ")\n\n"
                    + "Great question! Here is how to master this concept clearly:\n\n"
                    + "1. **Core Idea**: At its heart, **" + topic + "** deals with how systems in " + subject + " interact and maintain balance under governing rules.\n"
                    + "2. **Why It Matters**: Examiners test this because it bridges basic definitions to complex numerical and essay problems.\n"
                    + "3. **Key Equation / Identity**: Keep the governing identity in mind whenever solving questions on this topic.\n"
                    + "4. **Step-by-step Thinking**:\n"
                    + "   - Identify the known parameters and their standard units.\n"
                    + "   - Determine which rule or formula connects the knowns to the unknowns.\n"
                    + "   - Substitute carefully and double-check your sign conventions.\n\n"
                    + "💡 **Pro Study Tip**: Write down the 5 key keywords of this chapter on a flashcard to easily remember them during exams!";
        }

        // Mnemonics / Memory tips
        if (qLower.contains("mnemonic") || qLower.contains("remember") || qLower.contains("memory") || qLower.contains("trick")) {
            return "### 🧠 Memory Mnemonics & Study Shortcuts for " + topic + "\n\n"
                    + "Here are three proven memorization techniques for your exams:\n\n"
                    + "1. **The Acronym Technique (P-E-M-D-A-S style)**: Group key sequential steps using the first letters of each core phase.\n"
                    + "2. **The 3-Word Association**: Link " + topic + " to its primary cause, central formula, and final outcome.\n"
                    + "3. **Visual Anchor**: Picture the standard diagram in your mind before answering exam questions. Label the top, middle, and bottom sections mentally.\n\n"
                    + "Would you like me to test you with a quick multiple-choice question to verify your recall?";
        }

        // Exam pitfalls
        if (qLower.contains("mistake") || qLower.contains("pitfall") || qLower.contains("exam tip") || qLower.contains("marks")) {
            return "### ⚠️ Top 4 Mistakes Students Make in " + topic + "\n\n"
                    + "1. **Dropping SI Units**: Writing numerical answers without units loses up to 1 mark per question.\n"
                    + "2. **Skipping the Formula**: Writing only numbers without the general equation forfeits step marks if there is an arithmetic slip.\n"
                    + "3. **Missing Diagrams**: In 5M and 10M questions, an answer without a clear diagram is capped by most board rubrics.\n"
                    + "4. **Conflating Definitions**: Ensure you state the exact textbook definition rather than a vague colloquial paraphrase.\n\n"
                    + "Always leave 5 minutes at the end of your paper to re-verify your calculations!";
        }

        // General academic answer
        return "### 🎓 SchoolBuddy Academic Tutor: " + topic + " (" + subject + ")\n\n"
                + "Regarding your question: *\"" + query + "\"*\n\n"
                + "Here is the academic explanation:\n"
                + "- **Foundational Rule**: In " + subject + ", " + topic + " operates under standard curricular principles.\n"
                + "- **Analytical Approach**: When analyzing this problem, establish your known variables, reference standard formulas, and check your boundary limits.\n"
                + "- **Exam Expectation**: In school examinations, answers addressing this question should highlight standard technical terms, intermediate reasoning steps, and final units.\n\n"
                + "Would you like to try a practice MCQ on this, or see how to write a full 5-mark answer for this topic?";
    }

    private List<String> generateFollowUps(String topic, String subject) {
        return List.of(
                "Can you generate 5 MCQs on " + topic + "?",
                "What is a typical 5-mark question from this chapter?",
                "Give me a 10-mark model answer outline with marking rubric",
                "What are the top memory mnemonics for this topic?"
        );
    }
}
