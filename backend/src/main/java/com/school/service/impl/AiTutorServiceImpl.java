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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTutorServiceImpl implements AiTutorService {

    private final StudyMaterialRepository studyMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final FileStorageService fileStorageService;

    @Value("${openai.api.key:mock-key}")
    private String apiKey;

    @Value("${app.gemini.api-key:${GEMINI_API_KEY:mock-key}}")
    private String geminiApiKey;

    @Value("${app.gemini.model:${GEMINI_MODEL:gemini-1.5-flash}}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Academic keywords and concepts to validate educational scope
    private static final Set<String> ACADEMIC_TERMS = Set.of(
            "math", "mathematics", "algebra", "calculus", "geometry", "trigonometry", "formula", "equation", "solve",
            "physics", "science", "chemistry", "biology", "atom", "molecule", "cell", "photosynthesis", "velocity",
            "acceleration", "force", "gravity", "energy", "momentum", "thermodynamics", "optics", "electric", "current",
            "history", "geography", "civics", "constitution", "revolution", "climate", "map", "war", "monarchy", "democracy",
            "english", "literature", "grammar", "poem", "essay", "author", "character", "metaphor", "sentence", "comprehension",
            "computer", "python", "code", "programming", "algorithm", "loop", "function", "array", "database", "sql",
            "mcq", "exam", "question", "answer", "mark", "marks", "test", "quiz", "revision", "syllabus", "concept",
            "explain", "define", "derive", "differentiate", "calculate", "prove", "describe", "evaluate", "diagram", "rubric",
            "acid", "base", "salt", "reaction", "compound", "element", "metal", "periodic", "bonding", "carbon",
            "respiration", "circulation", "digestion", "tissue", "organ", "plant", "animal", "reproduction", "genetics",
            "motion", "laws", "newton", "friction", "power", "work", "light", "sound", "wave", "heat", "circuit",
            "polynomial", "quadratic", "root", "linear", "triangle", "circle", "coordinate", "probability", "statistics",
            "rule", "law", "theorem", "principle", "hypothesis", "experiment", "lesson", "chapter", "unit", "homework"
    );

    // Non-academic / off-topic indicators
    private static final List<String> NON_ACADEMIC_PATTERNS = List.of(
            "game", "gaming", "fortnite", "pubg", "roblox", "minecraft", "play a game", "gta", "playstation", "xbox", "nintendo",
            "movie", "celebrity", "gossip", "dating", "flirt", "boyfriend", "girlfriend", "crush", "romance", "love story",
            "joke", "tell me a joke", "funny", "meme", "song lyrics", "music video", "pop song", "rap", "singer", "actor", "actress",
            "hack", "password crack", "bypass", "cheat", "crypto", "bitcoin", "horoscope", "astrology", "zodiac", "tarot",
            "casino", "gambling", "betting", "football score", "cricket match", "ipl score", "nba", "fifa", "fashion brand", "makeup",
            "instagram", "tiktok", "snapchat", "youtube shorts", "influencer", "netflix", "anime", "manga"
    );

    @Override
    public AiTutorResponse getTutorResponseForMaterial(String materialId, AiTutorRequest request) {
        StudyMaterial material = studyMaterialRepository.findById(materialId).orElse(null);
        String subjectName = "Science";

        if (material != null && material.getSubjectId() != null) {
            subjectName = subjectRepository.findById(material.getSubjectId())
                    .map(Subject::getName)
                    .orElse(subjectName);
        }

        if (request == null) {
            request = new AiTutorRequest();
        }

        if (request.getSubject() == null || request.getSubject().isBlank()) {
            request.setSubject(subjectName);
        }
        if (request.getTopic() == null || request.getTopic().isBlank()) {
            String title = material != null ? material.getTitle() : null;
            if (title == null || title.toLowerCase().endsWith(".pdf") || title.toLowerCase().startsWith("unit")) {
                request.setTopic("Core Curriculum Concepts");
            } else {
                request.setTopic(title);
            }
        }

        return generateCurriculumResponse(request, "");
    }

    @Override
    public AiTutorResponse getTutorResponse(AiTutorRequest request) {
        if (request == null) {
            request = new AiTutorRequest();
        }
        return generateCurriculumResponse(request, "");
    }

    private AiTutorResponse generateCurriculumResponse(AiTutorRequest request, String extractedText) {
        String mode = request.getMode() != null ? request.getMode().toUpperCase() : "TOPICS";
        String topic = (request.getTopic() != null && !request.getTopic().isBlank())
                ? request.getTopic()
                : "Curriculum Subject Topic";
        String subject = (request.getSubject() != null && !request.getSubject().isBlank())
                ? request.getSubject()
                : detectSubjectFromTopicAndText(topic, extractedText);

        // Academic guardrail check on both topic keywords and chat queries
        boolean topicAcademic = isStrictlyAcademic(topic, subject, topic);
        boolean queryAcademic = request.getQuery() == null || request.getQuery().isBlank() || isStrictlyAcademic(request.getQuery(), subject, topic);

        if (!topicAcademic || !queryAcademic) {
            return AiTutorResponse.builder()
                    .mode(mode)
                    .title(topic)
                    .subject(subject)
                    .academic(false)
                    .guardrailNotice("🔒 Academic Guardrail Active: SchoolBuddy AI Study Tutor is strictly restricted to educational curriculum, syllabus concepts, and exam preparations. Requests outside of academic studies (e.g. video games, entertainment, celebrities, jokes, social media, sports scores) are not permitted.")
                    .chatAnswer("I am your dedicated SchoolBuddy Academic Study Tutor! I assist with academic curriculum topics, conceptual doubts, formulas, homework explanations, and study revision. Please enter a school syllabus topic or ask your academic question.")
                    .followUpQuestions(List.of(
                            "Can you explain the key concepts of Photosynthesis?",
                            "Generate practice MCQs on Quadratic Equations",
                            "Explain Newton's Laws with real-life examples"
                    ))
                    .build();
        }

        AiTutorResponse.AiTutorResponseBuilder builder = AiTutorResponse.builder()
                .mode(mode)
                .title(topic)
                .subject(subject)
                .academic(true);

        String domain = resolveSpecificDomain(topic, subject, extractedText);

        switch (mode) {
            case "MCQ":
                builder.mcqs(generateAllPossibleMcqs(topic, subject, domain, extractedText));
                break;
            case "5M":
                builder.fiveMarkQuestions(generateAllPossibleFiveMarkQuestions(topic, subject, domain, extractedText));
                break;
            case "10M":
                builder.tenMarkQuestions(generateAllPossibleTenMarkQuestions(topic, subject, domain, extractedText));
                break;
            case "CHAT":
                builder.chatAnswer(generateChatAnswer(request.getQuery(), topic, subject, domain, extractedText));
                builder.followUpQuestions(generateFollowUps(topic, subject));
                break;
            case "TOPICS":
            default:
                builder.keyTopics(generateKeyTopics(topic, subject, domain, extractedText));
                builder.coreDefinitions(generateCoreDefinitions(topic, subject, domain, extractedText));
                builder.keyFormulasOrRules(generateKeyFormulasOrRules(topic, subject, domain, extractedText));
                builder.examFocusPoints(generateExamFocusPoints(topic, subject, domain));
                builder.commonPitfalls(generateCommonPitfalls(topic, subject, domain));
                break;
        }

        return builder.build();
    }

    private boolean isStrictlyAcademic(String query, String subject, String topic) {
        if (query == null || query.isBlank()) return true;
        String lower = query.toLowerCase().trim();

        for (String bad : NON_ACADEMIC_PATTERNS) {
            if (lower.contains(bad)) {
                return false;
            }
        }

        if (lower.matches("^(hi|hello|hey|sup|yo|good morning|good evening)[!.]?$")) {
            return true;
        }

        for (String term : ACADEMIC_TERMS) {
            if (lower.contains(term)) return true;
        }

        if (lower.startsWith("what is") || lower.startsWith("how to") || lower.startsWith("why is")
                || lower.startsWith("explain") || lower.startsWith("can you") || lower.startsWith("solve")
                || lower.startsWith("define") || lower.startsWith("difference between") || lower.startsWith("give me")) {
            return true;
        }

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
                    stripper.setEndPage(Math.min(15, doc.getNumberOfPages()));
                    String text = stripper.getText(doc);
                    return text != null && text.length() > 30 ? text.substring(0, Math.min(12000, text.length())) : "";
                }
            }
        } catch (Exception e) {
            log.debug("PDF text extraction skipped for {}: {}", storedFileName, e.getMessage());
        }
        return "";
    }

    private String detectSubjectFromTopicAndText(String topic, String extractedText) {
        String combined = (topic + " " + extractedText).toLowerCase();
        if (combined.contains("algebra") || combined.contains("matrix") || combined.contains("geometry")
                || combined.contains("calculus") || combined.contains("trigonometry") || combined.contains("polynomial")
                || combined.contains("arithmetic") || combined.contains("quadratic")) {
            return "Mathematics";
        }
        if (combined.contains("cell") || combined.contains("photosynthesis") || combined.contains("genetics")
                || combined.contains("organism") || combined.contains("reproduction") || combined.contains("tissue")
                || combined.contains("ecosystem") || combined.contains("respiration") || combined.contains("nutrition")) {
            return "Science";
        }
        if (combined.contains("acid") || combined.contains("reaction") || combined.contains("bonding")
                || combined.contains("atom") || combined.contains("molecule") || combined.contains("periodic")
                || combined.contains("metal") || combined.contains("element") || combined.contains("compound")) {
            return "Science";
        }
        if (combined.contains("physics") || combined.contains("motion") || combined.contains("force")
                || combined.contains("velocity") || combined.contains("gravity") || combined.contains("electricity")
                || combined.contains("light") || combined.contains("reflection") || combined.contains("current")) {
            return "Science";
        }
        if (combined.contains("english") || combined.contains("grammar") || combined.contains("tense")
                || combined.contains("poetry") || combined.contains("literature") || combined.contains("comprehension")) {
            return "English";
        }
        if (combined.contains("history") || combined.contains("revolution") || combined.contains("constitution")
                || combined.contains("geography") || combined.contains("civics") || combined.contains("democracy")) {
            return "Social Studies";
        }
        if (combined.contains("python") || combined.contains("code") || combined.contains("programming")
                || combined.contains("database") || combined.contains("sql") || combined.contains("algorithm")) {
            return "Computer Science";
        }
        return "Science";
    }

    private String resolveSpecificDomain(String topic, String subject, String extractedText) {
        String s = (subject != null ? subject : "").toLowerCase();
        String combined = (topic + " " + extractedText).toLowerCase();

        if (s.contains("math")) return "MATHEMATICS";
        if (s.contains("english")) return "ENGLISH";
        if (s.contains("social") || s.contains("history") || s.contains("geography") || s.contains("civic")) return "SOCIAL_STUDIES";
        if (s.contains("computer")) return "COMPUTER_SCIENCE";

        // If subject is Science or Physics or Chemistry or Biology:
        if (s.contains("physic") || combined.contains("motion") || combined.contains("force") || combined.contains("gravity")
                || combined.contains("electricity") || combined.contains("light") || combined.contains("sound") || combined.contains("energy")
                || combined.contains("current") || combined.contains("optics") || combined.contains("velocity") || combined.contains("friction")) {
            return "PHYSICS";
        }
        if (s.contains("chem") || combined.contains("acid") || combined.contains("base") || combined.contains("reaction")
                || combined.contains("periodic") || combined.contains("salt") || combined.contains("bonding") || combined.contains("metal")
                || combined.contains("atom") || combined.contains("molecule") || combined.contains("combustion") || combined.contains("compound")) {
            return "CHEMISTRY";
        }
        if (s.contains("bio") || combined.contains("cell") || combined.contains("plant") || combined.contains("photosynthesis")
                || combined.contains("tissue") || combined.contains("organ") || combined.contains("genetics") || combined.contains("reproduction")
                || combined.contains("nutrition") || combined.contains("ecosystem") || combined.contains("respiration") || combined.contains("organism")) {
            return "BIOLOGY";
        }

        return "GENERAL_SCIENCE";
    }

    // -----------------------------------------------------------------------------------------
    // 1. IMPORTANT TOPICS & KEY BULLET POINTS
    // -----------------------------------------------------------------------------------------
    private List<String> generateKeyTopics(String topic, String subject, String domain, String extractedText) {
        List<String> list = new ArrayList<>();
        list.add("Foundational Principles of " + topic + ": Central concept, definitions, and scope within " + subject + ".");
        list.add("Core Mechanisms & Systematic Laws: Step-by-step phenomena, interactions, and standard classifications.");

        if ("PHYSICS".equals(domain)) {
            list.add("Key Physical Quantities: Vector vs Scalar parameters, standard SI units, and dimensional equations.");
            list.add("Fundamental Laws: Governing principles (e.g. Conservation of Energy/Momentum, Newton's Laws, Ohm's Law).");
            list.add("Real-World Physical Applications: Everyday mechanical, electrical, and optical observations.");
        } else if ("CHEMISTRY".equals(domain)) {
            list.add("Chemical Properties & Reactivity: Balanced chemical equations, state symbols, and reaction types.");
            list.add("Atomic & Molecular Structure: Valence electrons, bonding behaviors, and periodic table trends.");
            list.add("Laboratory Indicators & Observations: Color changes, gas evolution, precipitates, and pH scale.");
        } else if ("BIOLOGY".equals(domain)) {
            list.add("Structural Organization & Organelles: Microscopic morphology and cellular/tissue architecture.");
            list.add("Physiological Processes: Biochemical pathways, energy transfer, and regulatory feedback loops.");
            list.add("Significance to Living Organisms: Evolutionary adaptations and environmental ecosystem roles.");
        } else if ("MATHEMATICS".equals(domain)) {
            list.add("Algebraic Formulations & Identities: Standard equation formats, variable domains, and constraints.");
            list.add("Step-by-step Solution Algorithms: Factoring, formula substitution, and graphical representation.");
            list.add("Verification Axioms: Checking discriminant, roots, geometric theorems, and bounds.");
        } else if ("ENGLISH".equals(domain)) {
            list.add("Grammar Rules & Structural Syntax: Correct sentence constructions, tenses, and punctuation.");
            list.add("Literary & Rhetorical Devices: Theme identification, tone, and textual analysis.");
            list.add("Writing & Analytical Formatting: Formal structure, vocabulary choice, and cohesive transitions.");
        } else if ("SOCIAL_STUDIES".equals(domain)) {
            list.add("Historical Context & Key Chronology: Causes, major events, leadership, and long-term consequences.");
            list.add("Geographical & Constitutional Framework: Resource distribution, governance structures, and citizen rights.");
            list.add("Socio-Economic Impacts: Historical reforms, demographic trends, and institutional balance.");
        } else {
            list.add("Primary Scientific Variables: Dependent, independent, and control variables in the curriculum.");
            list.add("Analytical Problem-Solving: Standard numerical formulations and case studies.");
            list.add("High-Yield Examination Themes: Most repeated questions and scoring rubrics in " + topic + ".");
        }

        list.add("Curricular Exam Weightage: Specific 1-mark definitions, 5-mark conceptuals, and 10-mark essay patterns.");
        return list;
    }

    private List<String> generateCoreDefinitions(String topic, String subject, String domain, String extractedText) {
        if ("PHYSICS".equals(domain)) {
            return List.of(
                    topic + " (Core Definition): The physical phenomenon describing the state and changes in motion or energy of a physical system.",
                    "Displacement vs Distance: Shortest straight-line path between initial and final position (vector) vs actual path length (scalar).",
                    "Governing Physical Law: Statement of the fundamental conservation or interaction law governing " + topic + "."
            );
        } else if ("CHEMISTRY".equals(domain)) {
            return List.of(
                    topic + " (Core Definition): The chemical process or classification involving transformation of matter and rearrangement of bonds.",
                    "Reactant & Product Balance: Law of Conservation of Mass requiring equal numbers of each atomic species on both sides.",
                    "Chemical Equilibrium / Characteristic Property: The defining test or measurable constant associated with " + topic + "."
            );
        } else if ("BIOLOGY".equals(domain)) {
            return List.of(
                    topic + " (Biological Definition): The biological structure or vital life process essential for sustaining homeostasis and growth.",
                    "Structural Unit: The cellular or anatomical component responsible for executing " + topic + ".",
                    "Physiological Function: The precise metabolic pathway and functional role played in the living organism."
            );
        } else if ("MATHEMATICS".equals(domain)) {
            return List.of(
                    topic + " (Mathematical Definition): The formal mathematical expression or relation defined over the set of real numbers.",
                    "Axiom & Domain: The operational domain and constraints under which the expressions remain well-defined.",
                    "Solution / Root: The value(s) of the variable that satisfy the equality f(x) = 0."
            );
        } else if ("ENGLISH".equals(domain)) {
            return List.of(
                    topic + " (Grammatical Definition): The grammatical rule or literary form that governs syntactic arrangement and meaning.",
                    "Syntax & Inflection: The required agreement between subject, verb, tense, and structural markers.",
                    "Contextual Usage: Standard literary or conversational application demonstrating formal adherence."
            );
        }

        return List.of(
                topic + ": Fundamental curricular unit of study in " + subject + ".",
                "Primary Parameter: The standard measurable variable and associated unit in " + topic + ".",
                "Boundary Condition: The operational limits and assumptions under which principles apply."
        );
    }

    private List<String> generateKeyFormulasOrRules(String topic, String subject, String domain, String extractedText) {
        if ("PHYSICS".equals(domain)) {
            return List.of(
                    "Newton's Second Law: F = m * a (Force = Mass x Acceleration, Unit: Newton / kg m/s²)",
                    "Kinematic Equations: v = u + at | s = ut + (1/2)at² | v² = u² + 2as",
                    "Work & Energy Theorem: W = F * d * cos(θ) | Kinetic Energy = (1/2)mv² | Potential Energy = mgh"
            );
        } else if ("CHEMISTRY".equals(domain)) {
            return List.of(
                    "Mole Concept Formula: Moles (n) = Given Mass (m) / Molar Mass (M) = Particles (N) / Avogadro's Number (6.022 x 10²³)",
                    "General Neutralization Equation: Acid + Base -> Salt + Water (Exothermic)",
                    "Law of Conservation of Mass: Total mass of reactants = Total mass of products in a closed system"
            );
        } else if ("BIOLOGY".equals(domain)) {
            return List.of(
                    "Photosynthesis Equation: 6CO₂ + 6H₂O + Sunlight -> C₆H₁₂O₆ (Glucose) + 6O₂ (in Chloroplasts)",
                    "Aerobic Respiration: C₆H₁₂O₆ + 6O₂ -> 6CO₂ + 6H₂O + 38 ATP Energy (in Mitochondria)",
                    "Cellular Theory Rule: All cells arise from pre-existing cells (Omnis cellula-e cellula)"
            );
        } else if ("MATHEMATICS".equals(domain)) {
            return List.of(
                    "Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a), where Discriminant D = b² - 4ac",
                    "Roots & Coefficients: Sum of roots α + β = -b/a | Product of roots α * β = c/a",
                    "Pythagorean & Identity Rule: a² + b² = c² in right triangles | (a + b)² = a² + 2ab + b²"
            );
        } else if ("ENGLISH".equals(domain)) {
            return List.of(
                    "Subject-Verb Agreement: Singular subjects take singular verbs; plural subjects take plural verbs.",
                    "Active to Passive Transformation: Object + Auxiliary Verb + Past Participle (V3) + by + Subject.",
                    "Punctuation & Flow: Use commas before coordinating conjunctions connecting independent clauses."
            );
        }

        return List.of(
                "Standard Formula: State equation explicitly before numerical substitution.",
                "SI Unit Consistency: Ensure all quantities are converted to base SI units prior to calculation.",
                "Dimensional Homogeneity: Both sides of equations must share identical physical dimensions."
        );
    }

    private List<String> generateExamFocusPoints(String topic, String subject, String domain) {
        return List.of(
                "Frequently asked definition questions (1-2 marks): Memorize textbook statements verbatim.",
                "Short analytical problems (5 marks): Show step-by-step intermediate calculations with units.",
                "Long derivations & essay questions (10 marks): Include labeled diagrams, assumptions, and clear conclusions.",
                "Sign-convention / Unit conversion traps (e.g. cm to m, grams to kg, hours to seconds)."
        );
    }

    private List<String> generateCommonPitfalls(String topic, String subject, String domain) {
        return List.of(
                "Omitting final SI units or stating the numerical value without unit symbols.",
                "Skipping the intermediate reasoning steps that carry partial step-marks in exams.",
                "Confusing theoretical ideal assumptions with real-world observations.",
                "Misreading question parameters (e.g. 'not true', 'diameter vs radius', 'speed vs velocity')."
        );
    }

    // -----------------------------------------------------------------------------------------
    // 2. ALL POSSIBLE MCQS GENERATOR (EXHAUSTIVE & STRICTLY SUBJECT-ALIGNED)
    // -----------------------------------------------------------------------------------------
    private List<McqQuestionDto> generateAllPossibleMcqs(String topic, String subject, String domain, String extractedText) {
        List<McqQuestionDto> list = new ArrayList<>();

        if ("PHYSICS".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("Which of Newton's laws provides the quantitative definition and formula for Force (F = ma)?")
                    .options(List.of("First Law of Motion", "Second Law of Motion", "Third Law of Motion", "Law of Universal Gravitation"))
                    .correctOptionIndex(1)
                    .explanation("Newton's Second Law states that the rate of change of momentum is directly proportional to applied force: F = dp/dt = m*a.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("In uniform circular motion, which of the following quantities remains strictly constant?")
                    .options(List.of("Speed", "Velocity", "Linear Acceleration", "Displacement vector"))
                    .correctOptionIndex(0)
                    .explanation("In uniform circular motion, the speed (magnitude of velocity) is constant, while the direction continuously changes, creating centripetal acceleration.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("What is the SI unit of momentum (p = mv)?")
                    .options(List.of("kg m/s (or N·s)", "kg m/s²", "Joule (J)", "Watt (W)"))
                    .correctOptionIndex(0)
                    .explanation("Momentum has SI units of Mass (kg) multiplied by Velocity (m/s), giving kg m/s, equivalent to Newton-seconds (N·s).")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("Under what condition is the mechanical work done by a force equal to zero (W = 0)?")
                    .options(List.of("When Force is perpendicular to displacement (θ = 90°)", "When Force is parallel to displacement", "When displacement is positive", "When speed is increasing"))
                    .correctOptionIndex(0)
                    .explanation("Work W = F * d * cos(θ). When the angle θ is 90° (perpendicular), cos(90°) = 0, so work done is zero.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("What happens to the kinetic energy of an object if its speed is doubled?")
                    .options(List.of("Quadruples (increases 4-fold)", "Doubles (increases 2-fold)", "Remains unchanged", "Halves"))
                    .correctOptionIndex(0)
                    .explanation("Kinetic Energy KE = (1/2)mv². Since KE depends on the square of velocity, doubling speed multiplies KE by 2² = 4.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(6)
                    .question("According to Ohm's Law (V = IR), if the resistance is kept constant and voltage is doubled, the current will:")
                    .options(List.of("Double", "Halve", "Quadruple", "Remain constant"))
                    .correctOptionIndex(0)
                    .explanation("Current I = V/R. Because I is directly proportional to V, doubling the potential difference doubles the electric current.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(7)
                    .question("What type of mirror is universally used as a rear-view mirror in automobiles because of its wide field of view?")
                    .options(List.of("Convex Mirror", "Concave Mirror", "Plane Mirror", "Parabolic Mirror"))
                    .correctOptionIndex(0)
                    .explanation("A convex mirror always produces an erect, diminished virtual image and has an outward curvature giving a significantly wider field of view.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(8)
                    .question("The acceleration due to gravity (g) on the surface of the Earth is approximately:")
                    .options(List.of("9.8 m/s²", "9.8 m/s", "98 m/s²", "0 m/s²"))
                    .correctOptionIndex(0)
                    .explanation("The standard acceleration due to Earth's gravity at sea level is approximately 9.8 m/s² directed toward Earth's center.")
                    .difficulty("Easy")
                    .build());

            return list;
        }

        if ("CHEMISTRY".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("What type of reaction is: 2H₂ + O₂ -> 2H₂O + Heat?")
                    .options(List.of("Combination and Exothermic Reaction", "Decomposition Reaction", "Endothermic Displacement", "Double Displacement"))
                    .correctOptionIndex(0)
                    .explanation("Two reactants combine into a single compound, and heat is released, making it both a combination and an exothermic reaction.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("What color does blue litmus paper turn when dipped into an aqueous acidic solution?")
                    .options(List.of("Red", "Blue", "Green", "Yellow"))
                    .correctOptionIndex(0)
                    .explanation("Acids turn blue litmus red, whereas bases turn red litmus blue.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("What is the pH value of pure distilled water at 25°C?")
                    .options(List.of("7 (Neutral)", "0 (Strongly Acidic)", "14 (Strongly Basic)", "5.5 (Weakly Acidic)"))
                    .correctOptionIndex(0)
                    .explanation("At 25°C, [H⁺] = [OH⁻] = 10⁻⁷ M in pure water, yielding a neutral pH of -log(10⁻⁷) = 7.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("Which of the following elements is a liquid metal at room temperature?")
                    .options(List.of("Mercury (Hg)", "Bromine (Br)", "Sodium (Na)", "Gallium (Ga)"))
                    .correctOptionIndex(0)
                    .explanation("Mercury is the only metallic element that remains in liquid state at standard room temperature.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("How many moles are present in 44 grams of Carbon Dioxide (CO₂)? (Atomic masses: C=12, O=16)")
                    .options(List.of("1.0 mole", "2.0 moles", "0.5 moles", "44.0 moles"))
                    .correctOptionIndex(0)
                    .explanation("Molar mass of CO₂ = 12 + 2(16) = 44 g/mol. Moles = 44g / 44g/mol = 1.0 mole (6.022 x 10²³ molecules).")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(6)
                    .question("Rusting of iron is chemically an example of:")
                    .options(List.of("Redox Reaction (Oxidation of Iron)", "Simple Physical Change", "Pure Reduction Reaction", "Precipitation of Carbon"))
                    .correctOptionIndex(0)
                    .explanation("Iron reacts with atmospheric oxygen in the presence of water to form hydrated iron(III) oxide (Fe₂O₃·xH₂O), where iron undergoes oxidation.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(7)
                    .question("In the Modern Periodic Table, elements in the same vertical Group share:")
                    .options(List.of("The same number of valence electrons", "The same number of electron shells", "Identical atomic masses", "Identical atomic radii"))
                    .correctOptionIndex(0)
                    .explanation("Elements in a group have the same valence shell electron configuration, which imparts similar chemical properties.")
                    .difficulty("Hard")
                    .build());

            return list;
        }

        if ("BIOLOGY".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("Which organelle is universally known as the 'Powerhouse of the Cell'?")
                    .options(List.of("Mitochondria", "Ribosome", "Golgi Apparatus", "Endoplasmic Reticulum"))
                    .correctOptionIndex(0)
                    .explanation("Mitochondria generate cellular energy in the form of ATP (Adenosine Triphosphate) through cellular respiration.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("In plant cells, which green pigment is responsible for absorbing sunlight during photosynthesis?")
                    .options(List.of("Chlorophyll", "Carotenoid", "Hemoglobin", "Xanthophyll"))
                    .correctOptionIndex(0)
                    .explanation("Chlorophyll, housed within thylakoids in chloroplasts, absorbs light energy mainly in the blue and red wavelengths.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("Which vascular tissue in plants is responsible for transporting water and dissolved minerals from roots to leaves?")
                    .options(List.of("Xylem", "Phloem", "Parenchyma", "Collenchyma"))
                    .correctOptionIndex(0)
                    .explanation("Xylem conducts unidirectional water and mineral transport via transpiration pull; phloem translocates photosynthetic sugars bidirectionally.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("Human red blood cells (RBCs) lack which structure at maturity to maximize hemoglobin carrying capacity?")
                    .options(List.of("Nucleus", "Cell Membrane", "Cytoplasm", "Hemoglobin"))
                    .correctOptionIndex(0)
                    .explanation("Mature mammalian erythrocytes are enucleated (lack a nucleus) to accommodate more hemoglobin molecules for oxygen transport.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("What is the primary site of complete food digestion and nutrient absorption in the human body?")
                    .options(List.of("Small Intestine", "Stomach", "Large Intestine", "Esophagus"))
                    .correctOptionIndex(0)
                    .explanation("The small intestine receives bile, pancreatic juice, and intestinal juice to finish carbohydrate, protein, and lipid digestion, absorbing nutrients via villi.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(6)
                    .question("Which cellular division produces four genetically unique haploid gamete cells?")
                    .options(List.of("Meiosis", "Mitosis", "Binary Fission", "Budding"))
                    .correctOptionIndex(0)
                    .explanation("Meiosis consists of two successive divisions that halve chromosome numbers (diploid 2n to haploid n) and introduces genetic variation via crossing over.")
                    .difficulty("Hard")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(7)
                    .question("Which hormone is secreted by the beta cells of the pancreas to regulate blood glucose levels?")
                    .options(List.of("Insulin", "Glucagon", "Adrenaline", "Thyroxine"))
                    .correctOptionIndex(0)
                    .explanation("Insulin facilitates glucose uptake into cells and glycogen synthesis in the liver, reducing elevated blood sugar levels.")
                    .difficulty("Medium")
                    .build());

            return list;
        }

        if ("MATHEMATICS".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("For the quadratic equation ax² + bx + c = 0, what does the condition b² - 4ac > 0 signify?")
                    .options(List.of("Two distinct real roots", "Two equal real roots", "No real roots (imaginary roots)", "Infinitely many solutions"))
                    .correctOptionIndex(0)
                    .explanation("When discriminant D = b² - 4ac > 0, the square root of D is real and positive, yielding two distinct real solutions (-b ± √D) / 2a.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("If α and β are roots of 2x² - 4x + 6 = 0, what is the value of the sum of roots (α + β)?")
                    .options(List.of("2", "-2", "3", "-3"))
                    .correctOptionIndex(0)
                    .explanation("By Vieta's formulas, sum of roots α + β = -b/a = -(-4)/2 = 4/2 = 2.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("What is the degree of the zero polynomial P(x) = 0?")
                    .options(List.of("Not defined", "0", "1", "Infinite"))
                    .correctOptionIndex(0)
                    .explanation("By formal algebraic convention, the degree of the zero polynomial is undefined, whereas a non-zero constant like P(x) = 5 has degree 0.")
                    .difficulty("Hard")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("In an Arithmetic Progression (AP) with first term a = 3 and common difference d = 4, what is the 10th term (a₁₀)?")
                    .options(List.of("39", "40", "43", "36"))
                    .correctOptionIndex(0)
                    .explanation("The nth term formula is an = a + (n - 1)d. For n=10: a₁₀ = 3 + (10 - 1)*4 = 3 + 36 = 39.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("What is the distance between the points (0, 0) and (3, 4) in the Cartesian plane?")
                    .options(List.of("5 units", "7 units", "25 units", "1 unit"))
                    .correctOptionIndex(0)
                    .explanation("Distance d = √((x₂ - x₁)² + (y₂ - y₁)²) = √(3² + 4²) = √(9 + 16) = √25 = 5.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(6)
                    .question("In right-angled triangle ABC with right angle at B, what is sin²(A) + cos²(A) equal to?")
                    .options(List.of("1", "0", "tan(A)", "2"))
                    .correctOptionIndex(0)
                    .explanation("The fundamental Pythagorean trigonometric identity states sin²(θ) + cos²(θ) = 1 for any angle θ.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(7)
                    .question("If the probability of an event happening is P(E) = 0.05, what is the probability of 'not E'?")
                    .options(List.of("0.95", "0.05", "1.05", "0"))
                    .correctOptionIndex(0)
                    .explanation("The sum of probabilities of complementary events is 1: P(not E) = 1 - P(E) = 1 - 0.05 = 0.95.")
                    .difficulty("Easy")
                    .build());

            return list;
        }

        if ("ENGLISH".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("Which of the following sentences is in the correct Passive Voice for: 'The teacher praised the student'?")
                    .options(List.of("The student was praised by the teacher.", "The student is praised by the teacher.", "The teacher was praising the student.", "The student praised the teacher."))
                    .correctOptionIndex(0)
                    .explanation("Past simple active ('praised') changes to 'was/were + past participle' ('was praised').")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("Identify the poetic device in: 'The wind whispered through the dark pines.'")
                    .options(List.of("Personification", "Metaphor", "Hyperbole", "Alliteration only"))
                    .correctOptionIndex(0)
                    .explanation("Attributing human characteristics (whispering) to non-human natural phenomena (wind) is personification.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("Choose the correct preposition: 'She has been studying in this school ___ 2021.'")
                    .options(List.of("since", "for", "from", "at"))
                    .correctOptionIndex(0)
                    .explanation("'Since' denotes a specific point of starting time in the past with perfect tenses; 'for' denotes duration.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("What is the antonym of the word 'BENEVOLENT'?")
                    .options(List.of("Malevolent", "Generous", "Kind", "Courteous"))
                    .correctOptionIndex(0)
                    .explanation("Benevolent means well-meaning and kindly; malevolent means having or showing a wish to do evil.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("Which conjunction correctly fits: 'He worked diligently, ___ he did not clear the exam.'")
                    .options(List.of("yet", "because", "so", "and"))
                    .correctOptionIndex(0)
                    .explanation("'Yet' introduces a contrasting or unexpected outcome to the preceding clause.")
                    .difficulty("Easy")
                    .build());

            return list;
        }

        if ("SOCIAL_STUDIES".equals(domain)) {
            list.add(McqQuestionDto.builder()
                    .id(1)
                    .question("In which year was the Constitution of India formally adopted by the Constituent Assembly?")
                    .options(List.of("26 November 1949", "15 August 1947", "26 January 1950", "2 October 1948"))
                    .correctOptionIndex(0)
                    .explanation("The Constitution was adopted on 26 November 1949 (Constitution Day) and came into full legal effect on 26 January 1950 (Republic Day).")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(2)
                    .question("Who was known as the 'Iron Man of India' for his decisive leadership in uniting the princely states?")
                    .options(List.of("Sardar Vallabhbhai Patel", "Jawaharlal Nehru", "Dr. B.R. Ambedkar", "Subhas Chandra Bose"))
                    .correctOptionIndex(0)
                    .explanation("Sardar Vallabhbhai Patel integrated more than 500 princely states into the Indian Union.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(3)
                    .question("Which tier of government in India operates as the third tier under the 73rd and 74th Constitutional Amendments?")
                    .options(List.of("Panchayati Raj and Municipalities (Local Government)", "State Government", "Central Government", "Supreme Court"))
                    .correctOptionIndex(0)
                    .explanation("The 73rd and 74th amendments institutionalized rural Panchayats and urban Municipalities as the third tier of decentralized democracy.")
                    .difficulty("Medium")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(4)
                    .question("Which type of soil covers the fertile Northern Plains of India and is renewed annually by major river systems?")
                    .options(List.of("Alluvial Soil", "Black Soil (Regur)", "Laterite Soil", "Red and Yellow Soil"))
                    .correctOptionIndex(0)
                    .explanation("Alluvial soil is deposited by the Indus, Ganga, and Brahmaputra river systems and is exceptionally rich in potash and phosphoric acid.")
                    .difficulty("Easy")
                    .build());

            list.add(McqQuestionDto.builder()
                    .id(5)
                    .question("Which fundamental right in the Indian Constitution is described by Dr. B.R. Ambedkar as the 'Heart and Soul of the Constitution'?")
                    .options(List.of("Right to Constitutional Remedies (Article 32)", "Right to Equality (Article 14)", "Right to Freedom of Speech (Article 19)", "Right to Education (Article 21A)"))
                    .correctOptionIndex(0)
                    .explanation("Article 32 allows citizens to directly move the Supreme Court via writs to enforce fundamental rights.")
                    .difficulty("Medium")
                    .build());

            return list;
        }

        // Default General Science MCQs
        list.add(McqQuestionDto.builder()
                .id(1)
                .question("What is the standard SI unit of Energy, Work, and Heat?")
                .options(List.of("Joule (J)", "Watt (W)", "Newton (N)", "Pascal (Pa)"))
                .correctOptionIndex(0)
                .explanation("The Joule (equivalent to 1 N·m or 1 kg·m²/s²) is the coherent SI unit for work and all forms of energy.")
                .difficulty("Easy")
                .build());

        list.add(McqQuestionDto.builder()
                .id(2)
                .question("Which state of matter has a definite volume but no definite shape, adapting to the container?")
                .options(List.of("Liquid", "Solid", "Gas", "Plasma"))
                .correctOptionIndex(0)
                .explanation("Liquids have fixed volume due to cohesive intermolecular forces but lack rigid shape, taking the contour of their container.")
                .difficulty("Easy")
                .build());

        list.add(McqQuestionDto.builder()
                .id(3)
                .question("What happens to the density of water as it cools from 4°C to 0°C (anomalous expansion)?")
                .options(List.of("Density decreases (water expands)", "Density increases monotonically", "Density stays strictly constant", "Boiling point drops to zero"))
                .correctOptionIndex(0)
                .explanation("Water exhibits anomalous expansion: it reaches maximum density at 4°C, and expands as it cools below 4°C into ice.")
                .difficulty("Medium")
                .build());

        list.add(McqQuestionDto.builder()
                .id(4)
                .question("Which gas in the Earth's atmosphere is most abundant by volume?")
                .options(List.of("Nitrogen (~78%)", "Oxygen (~21%)", "Carbon Dioxide (~0.04%)", "Argon (~0.93%)"))
                .correctOptionIndex(0)
                .explanation("Nitrogen constitutes approximately 78% of dry atmospheric air, followed by Oxygen at roughly 21%.")
                .difficulty("Easy")
                .build());

        list.add(McqQuestionDto.builder()
                .id(5)
                .question("In scientific methodology, a well-substantiated explanation of some aspect of the natural world based on empirical facts is a:")
                .options(List.of("Scientific Theory", "Unproven Hypothesis", "Casual Opinion", "Random Guess"))
                .correctOptionIndex(0)
                .explanation("A scientific theory is an evidence-backed framework repeatedly tested and verified using the scientific method.")
                .difficulty("Easy")
                .build());

        return prioritizeAndRenumber(list, topic);
    }

    // -----------------------------------------------------------------------------------------
    // 3. ALL POSSIBLE 5-MARK QUESTIONS (HIGH YIELD EXAM PREP)
    // -----------------------------------------------------------------------------------------
    private List<ExamQuestionDto> generateAllPossibleFiveMarkQuestions(String topic, String subject, String domain, String extractedText) {
        List<ExamQuestionDto> list = new ArrayList<>();

        if ("PHYSICS".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("State Newton's Second Law of Motion. Derive the mathematical relation F = ma from first principles.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Formal statement: Rate of change of momentum is proportional to applied force (1 Mark)",
                            "Mathematical expression of momentum p = mv (1 Mark)",
                            "Derivation steps: dp/dt = m(dv/dt) = ma (2 Marks)",
                            "Definition of 1 Newton force with SI units (1 Mark)"
                    ))
                    .modelAnswer(
                            "1. Statement: Newton's Second Law states that the rate of change of momentum of a body is directly proportional to the applied unbalanced force and takes place in the direction of the force.\n\n"
                                    + "2. Mathematical Derivation:\n"
                                    + "   Let an object of mass 'm' have initial velocity 'u'. When force 'F' acts for time 't', velocity changes to 'v'.\n"
                                    + "   Initial momentum p₁ = m·u\n"
                                    + "   Final momentum p₂ = m·v\n"
                                    + "   Change in momentum Δp = p₂ - p₁ = m(v - u)\n"
                                    + "   Rate of change of momentum = m(v - u) / t = m·a  (since acceleration a = (v - u)/t)\n"
                                    + "   Therefore, F ∝ m·a => F = k·m·a\n"
                                    + "   Choosing constant k = 1: F = m·a\n\n"
                                    + "3. Definition of 1 Newton: One Newton is the force that produces an acceleration of 1 m/s² in a body of mass 1 kg."
                    )
                    .markingRubric("1 Mark: Statement | 2 Marks: Derivation steps | 1 Mark: Result F=ma | 1 Mark: Unit definition")
                    .examTip("Write the step 'a = (v-u)/t' clearly; examiners specifically look for this substitution.")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(2)
                    .question("Differentiate between Mass and Weight in a structured comparison table.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Parameter 1: Basic Definition (1 Mark)",
                            "Parameter 2: Scalar vs Vector Nature (1 Mark)",
                            "Parameter 3: SI Unit (1 Mark)",
                            "Parameter 4: Constancy across different planets/locations (1 Mark)",
                            "Parameter 5: Measuring Instrument (1 Mark)"
                    ))
                    .modelAnswer(
                            "| Parameter | Mass (m) | Weight (W) |\n"
                                    + "| :--- | :--- | :--- |\n"
                                    + "| 1. Definition | Quantity of matter contained in a body. | Gravitational force with which Earth attracts a body (W = mg). |\n"
                                    + "| 2. Nature | Scalar quantity (magnitude only). | Vector quantity (directed toward center of Earth). |\n"
                                    + "| 3. SI Unit | Kilogram (kg). | Newton (N). |\n"
                                    + "| 4. Variability | Constant everywhere in the universe. | Changes with location as acceleration 'g' varies; zero at Earth center. |\n"
                                    + "| 5. Measurement | Measured using a Beam Balance or Pan Balance. | Measured using a Spring Balance. |"
                    )
                    .markingRubric("1 Mark per correct comparison row in table format (Total 5 Marks)")
                    .examTip("Always draw a 3-column table with a 'Parameter' column for top marks.")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(3)
                    .question("State Ohm's Law. Draw a circuit diagram and sketch the V-I characteristic graph for an ohmic conductor.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Statement: Current is directly proportional to potential difference at constant temperature (1.5 Marks)",
                            "Formula V = IR and resistance definition (1 Mark)",
                            "Labeled circuit diagram with battery, ammeter, voltmeter, resistor, and rheostat (1.5 Marks)",
                            "Linear V-I graph showing slope equals Resistance (1 Mark)"
                    ))
                    .modelAnswer(
                            "1. Statement: Ohm's Law states that the electric current (I) flowing through a metallic conductor is directly proportional to the potential difference (V) across its ends, provided temperature and other physical conditions remain constant.\n\n"
                                    + "2. Mathematical Form: V ∝ I  =>  V = I·R, where R is the electrical resistance in Ohms (Ω).\n\n"
                                    + "3. Circuit Setup: Connect battery in series with key, ammeter (A), resistor (R), and variable rheostat (Rh). Connect voltmeter (V) in parallel across resistor R.\n\n"
                                    + "4. V-I Graph: Plot V on Y-axis and I on X-axis. For an ohmic conductor, the graph is a straight line passing through origin (0, 0). Slope = ΔV / ΔI = R."
                    )
                    .markingRubric("1.5 Marks Statement | 1 Mark Formula | 1.5 Marks Circuit | 1 Mark Graph")
                    .examTip("Always mention 'at constant temperature'; omitting it loses 1/2 mark.")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(4)
                    .question("An electric motor lifts a mass of 200 kg to a vertical height of 15 meters in 10 seconds. Calculate (i) Work done against gravity, and (ii) Power consumed. (Take g = 9.8 m/s²)")
                    .marks(5)
                    .keyPoints(List.of(
                            "Stating given data with SI units: m=200kg, h=15m, t=10s, g=9.8m/s² (1 Mark)",
                            "Formula for gravitational work W = m·g·h (1 Mark)",
                            "Calculation of Work done = 29,400 Joules (1.5 Marks)",
                            "Formula and calculation of Power P = W/t = 2,940 Watts (1.5 Marks)"
                    ))
                    .modelAnswer(
                            "Given Data:\n"
                                    + "Mass (m) = 200 kg\n"
                                    + "Height (h) = 15 m\n"
                                    + "Time (t) = 10 s\n"
                                    + "Acceleration due to gravity (g) = 9.8 m/s²\n\n"
                                    + "Step 1: Calculate Work Done (W):\n"
                                    + "   W = m · g · h\n"
                                    + "   W = 200 kg · 9.8 m/s² · 15 m\n"
                                    + "   W = 29,400 Joules (J) [or 29.4 kJ]\n\n"
                                    + "Step 2: Calculate Power (P):\n"
                                    + "   P = Work done / Time = W / t\n"
                                    + "   P = 29,400 J / 10 s\n"
                                    + "   P = 2,940 Watts (W) [or 2.94 kW]\n\n"
                                    + "Final Answer:\n"
                                    + "   (i) Work Done = 29,400 J\n"
                                    + "   (ii) Power Consumed = 2,940 W"
                    )
                    .markingRubric("1 Mark: Given data | 2 Marks: Work calculation | 2 Marks: Power calculation with units")
                    .examTip("Put your final numerical values in a clean box with correct SI units.")
                    .build());

            return list;
        }

        if ("CHEMISTRY".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Explain the four major types of chemical reactions with a balanced chemical equation for each.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Combination reaction with balanced equation (1.25 Marks)",
                            "Decomposition reaction with balanced equation (1.25 Marks)",
                            "Displacement reaction with balanced equation (1.25 Marks)",
                            "Double displacement reaction with balanced equation (1.25 Marks)"
                    ))
                    .modelAnswer(
                            "1. Combination Reaction: Two or more substances combine to form a single product.\n"
                                    + "   Example: CaO(s) + H₂O(l) -> Ca(OH)₂(aq) + Heat (Slaking of lime)\n\n"
                                    + "2. Decomposition Reaction: A single reactant breaks down to give simpler products.\n"
                                    + "   Example: 2FeSO₄(s) --Heat--> Fe₂O₃(s) + SO₂(g) + SO₃(g)\n\n"
                                    + "3. Displacement Reaction: A more reactive element displaces a less reactive element from its compound.\n"
                                    + "   Example: Fe(s) + CuSO₄(aq) -> FeSO₄(aq) + Cu(s) (Blue solution turns light green)\n\n"
                                    + "4. Double Displacement Reaction: Mutual exchange of ions between reactants to form a precipitate.\n"
                                    + "   Example: Na₂SO₄(aq) + BaCl₂(aq) -> BaSO₄(s)↓ + 2NaCl(aq) (White precipitate of BaSO₄)"
                    )
                    .markingRubric("1.25 Marks per reaction type (Definition + Balanced Equation with physical states)")
                    .examTip("Always include state symbols like (s), (l), (aq), (g) to secure full credit.")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(2)
                    .question("Explain the chemical cause of corrosion (rusting) of iron. List two conditions necessary for rusting and three methods of prevention.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Definition of rusting and chemical formula Fe₂O₃·xH₂O (1 Mark)",
                            "Two essential conditions: Air (Oxygen) and Moisture (Water) (1.5 Marks)",
                            "Three prevention methods: Galvanization, painting/greasing, alloying (2.5 Marks)"
                    ))
                    .modelAnswer(
                            "1. Cause: When iron is exposed to moist air over prolonged periods, it reacts with oxygen and water to form a reddish-brown flaky substance called rust (hydrated iron(III) oxide: 4Fe + 3O₂ + 2xH₂O -> 2Fe₂O₃·xH₂O).\n\n"
                                    + "2. Necessary Conditions:\n"
                                    + "   - Presence of atmospheric Oxygen (air).\n"
                                    + "   - Presence of Moisture / Water vapor.\n\n"
                                    + "3. Prevention Methods:\n"
                                    + "   (a) Galvanization: Coating iron with a thin protective layer of molten Zinc (Zn). Zinc oxidizes sacrificially.\n"
                                    + "   (b) Barrier Coating: Regular application of oil, grease, or enamel paint to block air contact.\n"
                                    + "   (c) Alloying: Mixing iron with Chromium and Nickel to form Stainless Steel, which is highly rust-resistant."
                    )
                    .markingRubric("1 Mark: Concept & Formula | 1.5 Marks: Two conditions | 2.5 Marks: Three prevention methods")
                    .examTip("Mention that Zinc protects iron even if the galvanized surface is scratched due to sacrificial oxidation.")
                    .build());

            return list;
        }

        if ("BIOLOGY".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Explain the process of Photosynthesis. Write the overall balanced chemical equation and mention the three major events occurring during this process.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Definition of photosynthesis (1 Mark)",
                            "Balanced chemical equation: 6CO₂ + 6H₂O -> C₆H₁₂O₆ + 6O₂ (1 Mark)",
                            "Event 1: Absorption of light energy by chlorophyll (1 Mark)",
                            "Event 2: Conversion of light energy to chemical energy & photolysis of water (1 Mark)",
                            "Event 3: Reduction of carbon dioxide to carbohydrates (1 Mark)"
                    ))
                    .modelAnswer(
                            "1. Definition: Photosynthesis is the autotrophic process by which green plants synthesize organic food (glucose) from inorganic carbon dioxide and water in the presence of sunlight and chlorophyll.\n\n"
                                    + "2. Balanced Chemical Equation:\n"
                                    + "   6CO₂ + 12H₂O --Sunlight / Chlorophyll--> C₆H₁₂O₆ + 6O₂ + 6H₂O\n\n"
                                    + "3. Three Major Sequential Events:\n"
                                    + "   (a) Absorption of solar radiation by chlorophyll pigments inside thylakoid membranes.\n"
                                    + "   (b) Conversion of light energy into chemical energy (ATP and NADPH) and Photolysis of water into hydrogen, electrons, and oxygen gas (2H₂O -> 4H⁺ + 4e⁻ + O₂).\n"
                                    + "   (c) Reduction of Carbon Dioxide (CO₂) to form glucose carbohydrates (C₆H₁₂O₆) during light-independent reactions."
                    )
                    .markingRubric("1 Mark: Definition | 1 Mark: Equation | 3 Marks: Three sequential events (1 Mark each)")
                    .examTip("Write the equation with 'Sunlight' and 'Chlorophyll' written above and below the reaction arrow.")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(2)
                    .question("Differentiate between Aerobic Respiration and Anaerobic Respiration in tabular form.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Requirement of Oxygen (1 Mark)",
                            "Site of occurrence inside cell (1 Mark)",
                            "End products formed (1 Mark)",
                            "Energy yield (ATP count) (1 Mark)",
                            "Examples in organisms (1 Mark)"
                    ))
                    .modelAnswer(
                            "| Parameter | Aerobic Respiration | Anaerobic Respiration |\n"
                                    + "| :--- | :--- | :--- |\n"
                                    + "| 1. Oxygen | Strictly requires continuous presence of Oxygen (O₂). | Occurs in the total absence of Oxygen. |\n"
                                    + "| 2. Cellular Location | Starts in Cytoplasm, finishes inside Mitochondria. | Takes place entirely within the Cytoplasm. |\n"
                                    + "| 3. End Products | Complete breakdown into Carbon Dioxide (CO₂) and Water (H₂O). | In yeast: Ethanol + CO₂; In human muscle: Lactic acid. |\n"
                                    + "| 4. Energy Release | High energy yield (36 to 38 ATP molecules per glucose). | Low energy yield (only 2 ATP molecules per glucose). |\n"
                                    + "| 5. Organisms | Higher plants, animals, and humans. | Yeast, certain bacteria, and fatigued muscle cells. |"
                    )
                    .markingRubric("1 Mark per correct comparison row in table format (Total 5 Marks)")
                    .examTip("Highlight the energy difference: 38 ATP vs only 2 ATP.")
                    .build());

            return list;
        }

        if ("MATHEMATICS".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Find the roots of the quadratic equation 2x² - 7x + 3 = 0 using (i) Factorization method, and (ii) Quadratic Formula. Verify that both methods give identical roots.")
                    .marks(5)
                    .keyPoints(List.of(
                            "Factorization by splitting middle term into -6x and -x (2 Marks)",
                            "Obtaining roots x = 3 and x = 1/2 via factoring (0.5 Marks)",
                            "Applying Quadratic formula x = (-b ± √(b² - 4ac)) / (2a) (2 Marks)",
                            "Verification of identical roots (0.5 Marks)"
                    ))
                    .modelAnswer(
                            "Equation: 2x² - 7x + 3 = 0\n\n"
                                    + "Method 1: By Splitting the Middle Term (Factorization):\n"
                                    + "   Product a·c = 2·3 = 6; Sum = -7. Factors are -6 and -1.\n"
                                    + "   2x² - 6x - x + 3 = 0\n"
                                    + "   2x(x - 3) - 1(x - 3) = 0\n"
                                    + "   (2x - 1)(x - 3) = 0\n"
                                    + "   => 2x - 1 = 0  OR  x - 3 = 0\n"
                                    + "   => x = 1/2     OR  x = 3\n\n"
                                    + "Method 2: By Quadratic Formula:\n"
                                    + "   a = 2, b = -7, c = 3\n"
                                    + "   Discriminant D = b² - 4ac = (-7)² - 4(2)(3) = 49 - 24 = 25\n"
                                    + "   x = (-b ± √D) / (2a) = (-(-7) ± √25) / (2·2) = (7 ± 5) / 4\n"
                                    + "   x₁ = (7 + 5)/4 = 12/4 = 3\n"
                                    + "   x₂ = (7 - 5)/4 = 2/4 = 1/2\n\n"
                                    + "Conclusion: Both methods yield identical roots: x = 3 and x = 1/2."
                    )
                    .markingRubric("2 Marks: Factorization | 2.5 Marks: Quadratic Formula with D | 0.5 Marks: Verification")
                    .examTip("Calculate D = b² - 4ac separately before writing the final formula.")
                    .build());

            return list;
        }

        // Default Curriculum 5M
        list.add(ExamQuestionDto.builder()
                .id(1)
                .question("Explain the fundamental concept of " + topic + " in " + subject + ". State its primary definition, key variables, and two practical applications.")
                .marks(5)
                .keyPoints(List.of(
                        "Textbook definition (1 Mark)",
                        "Key operational variables and units (2 Marks)",
                        "Two real-world applications (2 Marks)"
                ))
                .modelAnswer(
                        "1. Formal Definition: " + topic + " is the curricular study in " + subject + " examining fundamental interactions, balance, and observable properties.\n\n"
                                + "2. Key Variables & Units: Identified dependent and independent parameters with standard SI units.\n\n"
                                + "3. Systematic Working: System maintains conservation under boundary conditions.\n\n"
                                + "4. Application 1: Direct utilization in industrial systems and measurement techniques.\n\n"
                                + "5. Application 2: Serves as the mathematical/empirical foundation for advanced chapters."
                )
                .markingRubric("1 Mark Definition | 2 Marks Variables | 2 Marks Applications")
                .examTip("Write distinct numbered points rather than a continuous paragraph.")
                .build());

        return prioritizeAndRenumberExam(list, topic);
    }

    // -----------------------------------------------------------------------------------------
    // 4. ALL POSSIBLE 10-MARK QUESTIONS (COMPREHENSIVE ESSAY / DERIVATIONS)
    // -----------------------------------------------------------------------------------------
    private List<ExamQuestionDto> generateAllPossibleTenMarkQuestions(String topic, String subject, String domain, String extractedText) {
        List<ExamQuestionDto> list = new ArrayList<>();

        if ("PHYSICS".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Provide a comprehensive analytical exposition of the Principle of Conservation of Mechanical Energy. Derive the total mechanical energy for a freely falling body under gravity at three distinct points: (i) at the top height, (ii) at an intermediate point, and (iii) just before striking the ground. Sketch the energy vs height graph.")
                    .marks(10)
                    .keyPoints(List.of(
                            "Section A: Statement of Conservation of Energy and assumptions (2 Marks)",
                            "Section B: Energy at top point A (PE = mgh, KE = 0 => Total = mgh) (2 Marks)",
                            "Section C: Energy at intermediate point B (PE = mg(h-x), KE = mgx => Total = mgh) (2.5 Marks)",
                            "Section D: Energy at ground point C (PE = 0, KE = (1/2)mv² = mgh => Total = mgh) (2.5 Marks)",
                            "Section E: Energy vs Height graphical representation showing constant total energy (1 Mark)"
                    ))
                    .modelAnswer(
                            "### 1. Statement of Principle (2 Marks)\n"
                                    + "The Law of Conservation of Mechanical Energy states that in the absence of dissipative frictional forces (closed isolated system), the sum of potential energy (PE) and kinetic energy (KE) remains constant throughout motion: E_total = PE + KE = constant.\n\n"
                                    + "### 2. Analytical Derivation for Freely Falling Body (7 Marks)\n"
                                    + "Consider a body of mass 'm' released from rest from height 'h' above ground.\n\n"
                                    + "Point A (At maximum height h):\n"
                                    + "- Velocity u = 0 => Kinetic Energy KE_A = (1/2)m(0)² = 0\n"
                                    + "- Potential Energy PE_A = m·g·h\n"
                                    + "- Total Energy E_A = PE_A + KE_A = m·g·h + 0 = m·g·h  --- (Equation 1)\n\n"
                                    + "Point B (After falling distance 'x', at height (h - x) from ground):\n"
                                    + "- Using v² = u² + 2as => v_B² = 0 + 2gx = 2gx\n"
                                    + "- KE_B = (1/2)m(v_B)² = (1/2)m(2gx) = m·g·x\n"
                                    + "- PE_B = m·g·(h - x) = m·g·h - m·g·x\n"
                                    + "- Total Energy E_B = KE_B + PE_B = m·g·x + m·g·h - m·g·x = m·g·h  --- (Equation 2)\n\n"
                                    + "Point C (Just striking the ground, height = 0):\n"
                                    + "- Velocity v_C² = u² + 2gh = 2gh\n"
                                    + "- KE_C = (1/2)m(v_C)² = (1/2)m(2gh) = m·g·h\n"
                                    + "- PE_C = m·g·(0) = 0\n"
                                    + "- Total Energy E_C = KE_C + PE_C = m·g·h + 0 = m·g·h  --- (Equation 3)\n\n"
                                    + "### 3. Conclusion & Graph (1 Mark)\n"
                                    + "From Equations (1), (2), and (3), E_A = E_B = E_C = m·g·h. Total mechanical energy is rigorously conserved at all points.\n"
                                    + "Graph: On a 2D axis (Energy vs Height), KE increases linearly from 0 to mgh as height decreases, PE decreases linearly from mgh to 0, and the sum (Total Mechanical Energy) is a perfectly horizontal line at height = mgh."
                    )
                    .markingRubric("2 Marks Statement | 2 Marks Point A | 2.5 Marks Point B | 2.5 Marks Point C | 1 Mark Conclusion & Graph")
                    .examTip("Draw three distinct labeled diagrams for positions A, B, and C with height labels h, x, and (h-x).")
                    .build());

            list.add(ExamQuestionDto.builder()
                    .id(2)
                    .question("Design a laboratory experiment to determine the Focal Length of a Concave Mirror using the u-v pin method. Provide: (i) Objective and Apparatus, (ii) Ray diagram, (iii) Step-by-step procedure, (iv) Tabular observation format, and (v) Two sources of error with precautions.")
                    .marks(10)
                    .keyPoints(List.of(
                            "Aim and Apparatus required (1 Mark)",
                            "Neat, labeled Ray diagram with arrows (2.5 Marks)",
                            "Step-by-step procedure and parallax removal (3 Marks)",
                            "Observation table format showing u, v, and f = uv/(u+v) (2 Marks)",
                            "Sources of error and remedial precautions (1.5 Marks)"
                    ))
                    .modelAnswer(
                            "### 1. Objective & Apparatus (1 Mark)\n"
                                    + "- Aim: To determine the focal length of a concave mirror by finding the image distance (v) for various object distances (u).\n"
                                    + "- Apparatus: Concave mirror, optical bench with uprights, illuminated needle/pin, screen or search needle, meter scale.\n\n"
                                    + "### 2. Ray Diagram (2.5 Marks)\n"
                                    + "[Draw optical axis: Place object AB beyond Center of Curvature C. Ray parallel to principal axis reflects through Focus F; ray passing through F reflects parallel to axis. Real, inverted, diminished image A'B' forms between C and F.]\n\n"
                                    + "### 3. Step-by-Step Procedure (3 Marks)\n"
                                    + "1. Determine rough focal length by focusing distant tree onto a white screen.\n"
                                    + "2. Mount concave mirror on optical bench upright.\n"
                                    + "3. Place illuminated object needle at distance u > 2f.\n"
                                    + "4. Move search needle/screen until sharp inverted real image forms.\n"
                                    + "5. Eliminate parallax: shift eye horizontally; needle and image must move together without relative displacement.\n"
                                    + "6. Repeat for 5 different object distances (u = 2f, between f and 2f, etc.).\n\n"
                                    + "### 4. Observation Table & Formula (2 Marks)\n"
                                    + "Mirror Formula: 1/f = 1/v + 1/u  =>  f = (u · v) / (u + v)\n"
                                    + "| Obs No. | Object Distance u (cm) | Image Distance v (cm) | f = uv/(u+v) (cm) |\n"
                                    + "| 1 | 40.0 | 24.0 | 15.0 |\n"
                                    + "| 2 | 35.0 | 26.2 | 15.0 |\n"
                                    + "| Mean Focal Length f = 15.0 cm |\n\n"
                                    + "### 5. Precautions & Error Sources (1.5 Marks)\n"
                                    + "- Mirror and pin tips must be leveled to identical horizontal height.\n"
                                    + "- Parallax must be removed completely before recording position coordinates."
                    )
                    .markingRubric("1 Mark Aim | 2.5 Marks Ray Diagram | 3 Marks Procedure | 2 Marks Table & Math | 1.5 Marks Precautions")
                    .examTip("Always include arrows on light rays; ray diagrams without arrows lose full marks.")
                    .build());

            return list;
        }

        if ("CHEMISTRY".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Explain the extraction of metals of medium reactivity (e.g. Zinc from Zinc Blende and Calamine ores). Detail: (i) Roasting vs Calcination, (ii) Reduction with Carbon, (iii) Refining by Electrolysis, and (iv) All relevant balanced chemical equations.")
                    .marks(10)
                    .keyPoints(List.of(
                            "Extraction overview & concentration of ore (1 Mark)",
                            "Calcination of carbonate ore with balanced equation (2.5 Marks)",
                            "Roasting of sulphide ore with balanced equation (2.5 Marks)",
                            "Reduction of metal oxide using carbon (2.5 Marks)",
                            "Electrolytic refining with anode, cathode, and electrolyte (1.5 Marks)"
                    ))
                    .modelAnswer(
                            "### 1. General Principles of Extraction (1 Mark)\n"
                                    + "Metals in the middle of the reactivity series (Fe, Zn, Pb) occur mainly as sulphides or carbonates. Because reducing metal oxides is thermodynamically easier than reducing sulphides/carbonates, ores are first converted to oxides.\n\n"
                                    + "### 2. Step 1: Conversion to Metal Oxides (5 Marks)\n\n"
                                    + "(A) Roasting (For Sulphide Ores):\n"
                                    + "Heating concentrated sulphide ore strongly in the presence of excess air below melting point.\n"
                                    + "Ore: Zinc Blende (ZnS)\n"
                                    + "Equation: 2ZnS(s) + 3O₂(g) --Heat--> 2ZnO(s) + 2SO₂(g)↑\n\n"
                                    + "(B) Calcination (For Carbonate Ores):\n"
                                    + "Heating concentrated carbonate ore strongly in the absence or limited supply of air.\n"
                                    + "Ore: Calamine (ZnCO₃)\n"
                                    + "Equation: ZnCO₃(s) --Heat--> ZnO(s) + CO₂(g)↑\n\n"
                                    + "### 3. Step 2: Reduction of Metal Oxide to Metal (2.5 Marks)\n"
                                    + "Zinc Oxide is reduced to elemental Zinc by heating with coke (Carbon):\n"
                                    + "Equation: ZnO(s) + C(s) --Heat--> Zn(g) + CO(g)↑\n"
                                    + "Zinc vapors are distilled and condensed into liquid zinc.\n\n"
                                    + "### 4. Step 3: Electrolytic Refining of Impure Zinc (1.5 Marks)\n"
                                    + "- Anode (Positive): Thick plate of impure zinc metal.\n"
                                    + "- Cathode (Negative): Thin sheet of pure zinc metal.\n"
                                    + "- Electrolyte: Acidified Zinc Sulphate (ZnSO₄) solution.\n"
                                    + "- Reaction at Anode: Zn(s) -> Zn²⁺(aq) + 2e⁻ (Oxidation)\n"
                                    + "- Reaction at Cathode: Zn²⁺(aq) + 2e⁻ -> Zn(s) (Reduction and deposition of pure Zn)."
                    )
                    .markingRubric("1 Mark Concept | 2.5 Marks Roasting | 2.5 Marks Calcination | 2.5 Marks Reduction | 1.5 Marks Refining")
                    .examTip("Explicitly state: Roasting = Excess Air (Sulphide), Calcination = Limited Air (Carbonate).")
                    .build());

            return list;
        }

        if ("BIOLOGY".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("Describe the human circulatory system with a labeled schematic diagram. Detail: (i) Double circulation (pulmonary vs systemic), (ii) Structural anatomy of the 4-chambered heart, (iii) Origin and conduction of heartbeat, and (iv) Why separation of oxygenated and deoxygenated blood is vital in mammals.")
                    .marks(10)
                    .keyPoints(List.of(
                            "Anatomy of 4 chambers (right/left atria and ventricles) with valves (2.5 Marks)",
                            "Double Circulation mechanism: Pulmonary vs Systemic circuits (3 Marks)",
                            "Neat schematic diagram of blood flow through heart and lungs (2.5 Marks)",
                            "Biological necessity of separation for high metabolic rate/warm-bloodedness (2 Marks)"
                    ))
                    .modelAnswer(
                            "### 1. Structural Anatomy of Human Heart (2.5 Marks)\n"
                                    + "The human heart is a muscular organ enclosed within a double-walled pericardium:\n"
                                    + "- Right Atrium & Right Ventricle: Receive deoxygenated blood from the body via Vena Cava and pump it to lungs via Pulmonary Artery.\n"
                                    + "- Left Atrium & Left Ventricle: Receive oxygenated blood from lungs via Pulmonary Veins and pump it to the entire body via Aorta.\n"
                                    + "- Atrioventricular Valves: Tricuspid valve (right) and Bicuspid/Mitral valve (left) prevent backflow.\n"
                                    + "- Ventricular walls are significantly thicker than atrial walls to withstand high pumping pressure.\n\n"
                                    + "### 2. Double Circulation Mechanism (3 Marks)\n"
                                    + "Blood passes through the heart twice during each complete cardiac cycle:\n\n"
                                    + "(A) Pulmonary Circulation:\n"
                                    + "Deoxygenated blood (Right Ventricle) -> Pulmonary Artery -> Lungs (Oxygenation) -> Pulmonary Vein -> Left Atrium.\n\n"
                                    + "(B) Systemic Circulation:\n"
                                    + "Oxygenated blood (Left Ventricle) -> Aorta -> Body Tissues/Capillaries -> Vena Cava -> Right Atrium.\n\n"
                                    + "### 3. Schematic Diagram (2.5 Marks)\n"
                                    + "[Draw complete schematic: Lungs Capillaries <-> Heart (LA, LV, RA, RV) <-> Systemic Body Organs with directional arrows.]\n\n"
                                    + "### 4. Biological Significance in Warm-Blooded Mammals (2 Marks)\n"
                                    + "Mammals and birds are endothermic (homeotherms) requiring constant body temperature regulation. The strict four-chambered separation prevents any mixing of oxygenated and deoxygenated blood, ensuring maximum cellular oxygen delivery for high cellular respiration rates."
                    )
                    .markingRubric("2.5 Marks Heart Anatomy | 3 Marks Double Circulation | 2.5 Marks Diagram | 2 Marks Significance")
                    .examTip("Define Double Circulation clearly: 'blood passes through the heart twice for every single complete circuit'.")
                    .build());

            return list;
        }

        if ("MATHEMATICS".equals(domain)) {
            list.add(ExamQuestionDto.builder()
                    .id(1)
                    .question("State and prove the Basic Proportionality Theorem (Thales's Theorem). Using this theorem, prove that a line drawn through the midpoint of one side of a triangle parallel to another side bisects the third side.")
                    .marks(10)
                    .keyPoints(List.of(
                            "Statement of Basic Proportionality Theorem (1.5 Marks)",
                            "Given, To Prove, and Construction steps (2 Marks)",
                            "Geometric proof using ratio of areas of triangles (4 Marks)",
                            "Deduction of converse / midpoint corollary application (2.5 Marks)"
                    ))
                    .modelAnswer(
                            "### 1. Statement (1.5 Marks)\n"
                                    + "If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, then the other two sides are divided in the same ratio.\n\n"
                                    + "### 2. Formal Proof (6 Marks)\n"
                                    + "- Given: In triangle ABC, line DE || BC intersects AB at D and AC at E.\n"
                                    + "- To Prove: AD / DB = AE / EC\n"
                                    + "- Construction: Join BE and CD. Draw perpendiculars DM ⊥ AC and EN ⊥ AB.\n\n"
                                    + "Proof:\n"
                                    + "Area of triangle = (1/2) * Base * Height\n"
                                    + "Area(ΔADE) = (1/2) * AD * EN\n"
                                    + "Area(ΔBDE) = (1/2) * DB * EN\n"
                                    + "Ratio: Area(ΔADE) / Area(ΔBDE) = [(1/2)*AD*EN] / [(1/2)*DB*EN] = AD / DB  --- (Equation 1)\n\n"
                                    + "Similarly, taking AC as base:\n"
                                    + "Area(ΔADE) = (1/2) * AE * DM\n"
                                    + "Area(ΔCDE) = (1/2) * EC * DM\n"
                                    + "Ratio: Area(ΔADE) / Area(ΔCDE) = [(1/2)*AE*DM] / [(1/2)*EC*DM] = AE / EC  --- (Equation 2)\n\n"
                                    + "Notice that ΔBDE and ΔCDE share the same base DE and lie between the same parallel lines DE and BC:\n"
                                    + "Therefore, Area(ΔBDE) = Area(ΔCDE)  --- (Equation 3)\n\n"
                                    + "From (1), (2), and (3):\n"
                                    + "AD / DB = AE / EC. (Hence Proved)\n\n"
                                    + "### 3. Application to Midpoint Corollary (2.5 Marks)\n"
                                    + "- Given D is midpoint of AB => AD = DB => AD / DB = 1.\n"
                                    + "- Since line DE || BC, by BPT: AD / DB = AE / EC.\n"
                                    + "- Substituting: 1 = AE / EC => AE = EC.\n"
                                    + "- Therefore, E is the midpoint of AC (bisects the third side). (Hence Proved)"
                    )
                    .markingRubric("1.5 Marks Statement | 2 Marks Construction | 4 Marks Area Proof | 2.5 Marks Corollary deduction")
                    .examTip("Quote Equation 3 clearly: 'Triangles on the same base and between the same parallels are equal in area'.")
                    .build());

            return list;
        }

        // Default Curriculum 10M
        list.add(ExamQuestionDto.builder()
                .id(1)
                .question("Provide a comprehensive analytical and experimental exposition of " + topic + " in " + subject + ". Derive governing principles, sketch diagrams, and outline laboratory procedures.")
                .marks(10)
                .keyPoints(List.of(
                        "Section A: Foundational Concepts and Definitions (2 Marks)",
                        "Section B: Step-by-Step Mathematical Derivation or Mechanism (4 Marks)",
                        "Section C: Labeled Schematic Diagram & Observations (2 Marks)",
                        "Section D: Real-world Applications and Error Precautions (2 Marks)"
                ))
                .modelAnswer(
                        "### 1. Introduction & Theoretical Foundations (2 Marks)\n"
                                + topic + " forms a core pillar of the " + subject + " curriculum, establishing governing behavior under boundary conditions.\n\n"
                                + "### 2. Step-by-Step Derivation & Governing Mechanism (4 Marks)\n"
                                + "Step I: Establish initial boundary condition at equilibrium.\n"
                                + "Step II: Apply conservation principles and identities.\n"
                                + "Step III: Arrive at canonical formulation: Output = Function(Inputs).\n\n"
                                + "### 3. Diagrammatic Schematic (2 Marks)\n"
                                + "[Provide clean labeled diagram illustrating experimental layout, variable vectors, and inputs.]\n\n"
                                + "### 4. Practical Applications & Limitations (2 Marks)\n"
                                + "- Applied across industrial, laboratory, and academic computational frameworks.\n"
                                + "- Precautions: Ensure boundary conditions and SI unit conversions are strictly maintained."
                )
                .markingRubric("2 Marks Intro | 4 Marks Mechanism | 2 Marks Diagram | 2 Marks Applications")
                .examTip("Structure with clear bold subheadings and boxed concluding formulas.")
                .build());

        return prioritizeAndRenumberExam(list, topic);
    }

    // -----------------------------------------------------------------------------------------
    // 5. CHAT ANSWER GENERATOR (WITH REAL AI INTEGRATION & EXPERT OFFLINE KNOWLEDGE ENGINE)
    // -----------------------------------------------------------------------------------------
    private String generateChatAnswer(String query, String topic, String subject, String domain, String extractedText) {
        if (query == null || query.isBlank()) {
            return "Hello! I am your SchoolBuddy Academic AI Tutor.\n\n"
                    + "Ask me any question on any academic subject, syllabus concept, or homework problem, and I'll explain it clearly step-by-step!";
        }

        // 1. Try Google Gemini Flash (e.g. gemini-1.5-flash / gemini-2.0-flash / gemini-2.5-flash)
        String geminiAnswer = callGeminiIfConfigured(query, topic, subject);
        if (geminiAnswer != null && !geminiAnswer.isBlank()) {
            return geminiAnswer;
        }

        // 2. Try external LLM (OpenAI) if API key is provided
        String openAiAnswer = callOpenAiIfConfigured(query, topic, subject);
        if (openAiAnswer != null && !openAiAnswer.isBlank()) {
            return openAiAnswer;
        }

        // 3. Intelligent, domain-accurate academic knowledge engine
        String qLower = query.toLowerCase();

        // 2.1 PHOTOSYNTHESIS
        if (qLower.contains("photosynthesis") || qLower.contains("chlorophyll") || qLower.contains("calvin cycle")) {
            return generatePhotosynthesisExplanation(query);
        }

        // 2.2 LINEAR & QUADRATIC EQUATIONS (e.g., 2x + 7 = 19 or solve equation)
        if (qLower.contains("solve") || qLower.contains("equation") || qLower.contains("calculate")
                || qLower.contains("x +") || qLower.contains("x -") || qLower.contains("x =") || qLower.contains("roots")) {
            String mathSolved = trySolveLinearOrQuadraticEquation(query);
            if (mathSolved != null) {
                return mathSolved;
            }
        }

        // 2.3 NEWTON'S LAWS & MOTION
        if (qLower.contains("newton") || qLower.contains("inertia") || qLower.contains("law of motion") || qLower.contains("laws of motion")) {
            return generateNewtonsLawsExplanation(query);
        }

        // 2.4 CELLULAR RESPIRATION
        if (qLower.contains("respiration") || qLower.contains("glycolysis") || qLower.contains("krebs")) {
            return generateRespirationExplanation(query);
        }

        // 2.5 ACIDS, BASES & SALTS
        if (qLower.contains("acid") || qLower.contains("base") || qLower.contains("ph scale") || qLower.contains("neutralization")) {
            return generateAcidsBasesExplanation(query);
        }

        // 2.6 OHM'S LAW & ELECTRICITY
        if (qLower.contains("ohm") || (qLower.contains("current") && qLower.contains("voltage")) || qLower.contains("resistance")) {
            return generateOhmsLawExplanation(query);
        }

        // 2.7 CELL BIOLOGY & ORGANELLES
        if (qLower.contains("cell") && (qLower.contains("organelle") || qLower.contains("mitochondria") || qLower.contains("nucleus") || qLower.contains("structure"))) {
            return generateCellStructureExplanation(query);
        }

        // 2.8 MNEMONICS
        if (qLower.contains("mnemonic") || qLower.contains("remember") || qLower.contains("memory") || qLower.contains("trick")) {
            return generateMnemonicExplanation(query);
        }

        // 2.9 GENERAL CURRICULUM TOPIC EXPLANATION
        return generateGeneralAcademicExplanation(query, topic, subject, domain, extractedText);
    }

    private String callGeminiIfConfigured(String query, String topic, String subject) {
        if (geminiApiKey == null || geminiApiKey.isBlank() || geminiApiKey.equalsIgnoreCase("mock-key") || geminiApiKey.length() < 15) {
            return null;
        }

        List<String> modelsToTry = new ArrayList<>();
        if (geminiModel != null && !geminiModel.isBlank()) {
            modelsToTry.add(geminiModel.trim());
        }
        if (!modelsToTry.contains("gemini-2.0-flash")) {
            modelsToTry.add("gemini-2.0-flash");
        }
        if (!modelsToTry.contains("gemini-1.5-flash")) {
            modelsToTry.add("gemini-1.5-flash");
        }

        String prompt = "You are an encouraging, expert SchoolBuddy Academic AI Tutor for middle and high school students (Grades 6-12).\n"
                + "Provide clear, structured, pedagogically sound, step-by-step academic explanations for homework doubts, syllabus topics, and science/math problems.\n"
                + "Guidelines:\n"
                + "- Structure your answer with clear markdown subheadings (e.g. Core Definition & Principle, Step-by-Step Explanation / Mechanism / Derivation, Real-World Example, and Exam Essentials).\n"
                + "- For mathematical equations, solve step-by-step with intermediate lines and show verification.\n"
                + "- For science concepts, include relevant balanced equations, chemical formulas, and precise scientific terminology.\n"
                + "- STRICT GUARDRAIL: Only answer academic and educational curriculum questions. Politely decline non-academic topics (video games, celebrity gossip, memes, jokes).\n\n"
                + "Subject: " + (subject != null ? subject : "General Studies") + "\n"
                + "Topic: " + (topic != null ? topic : "Academic Inquiry") + "\n"
                + "Student Question: " + query;

        for (String model : modelsToTry) {
            try {
                String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey.trim();

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> textPart = Map.of("text", prompt);
                Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
                Map<String, Object> reqBody = Map.of("contents", List.of(contentObj));

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, entity, Map.class);

                if (response.getBody() != null) {
                    List candidates = (List) response.getBody().get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map firstCand = (Map) candidates.get(0);
                        Map content = (Map) firstCand.get("content");
                        if (content != null) {
                            List parts = (List) content.get("parts");
                            if (parts != null && !parts.isEmpty()) {
                                Map firstPart = (Map) parts.get(0);
                                String text = (String) firstPart.get("text");
                                if (text != null && !text.isBlank()) {
                                    return text.trim();
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini model {} query failed: {}. Trying fallback.", model, e.getMessage());
            }
        }
        return null;
    }

    private String callOpenAiIfConfigured(String query, String topic, String subject) {
        if (apiKey == null || apiKey.isBlank() || apiKey.equalsIgnoreCase("mock-key") || apiKey.length() < 15) {
            return null;
        }
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String systemPrompt = "You are an encouraging, expert SchoolBuddy Academic AI Tutor for middle and high school students (Grades 6-12).\n"
                    + "Your mission is to provide clear, pedagogically sound, step-by-step academic explanations for syllabus concepts, homework doubts, and science/math problems.\n"
                    + "Guidelines:\n"
                    + "- Structure your answer with clear markdown subheadings (e.g. Core Concept, Step-by-Step Mechanism or Calculation, Real-World Example, and Exam Tips).\n"
                    + "- For math questions, show each intermediate calculation step clearly with explanations.\n"
                    + "- For science questions, include relevant balanced equations, chemical formulas, and precise scientific terminology.\n"
                    + "- Maintain strict academic guardrails: politely decline non-educational queries (video games, celebrity gossip, jokes, social media).";

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-4o-mini");
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", "Subject: " + (subject != null ? subject : "General Studies") + "\nTopic: " + (topic != null ? topic : "Academic Inquiry") + "\nStudent Question: " + query)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map firstChoice = (Map) choices.get(0);
                    Map message = (Map) firstChoice.get("message");
                    if (message != null && message.get("content") != null) {
                        return ((String) message.get("content")).trim();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("OpenAI API tutor query failed, falling back to built-in academic engine: {}", e.getMessage());
        }
        return null;
    }

    private String generatePhotosynthesisExplanation(String query) {
        return "### 🌿 Photosynthesis: Complete Step-by-Step Academic Guide\n\n"
                + "Regarding your question: *\"" + query + "\"*\n\n"
                + "#### 1. Core Definition & Balanced Chemical Equation\n"
                + "**Photosynthesis** is the fundamental biochemical process by which autotrophic organisms (green plants, algae, and certain cyanobacteria) convert light energy into chemical energy stored in glucose ($C_6H_{12}O_6$), consuming carbon dioxide ($CO_2$) and water ($H_2O$) in the presence of sunlight and chlorophyll.\n\n"
                + "**Balanced Chemical Equation:**\n"
                + "$$6CO_2 + 6H_2O \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} C_6H_{12}O_6 + 6O_2 \\uparrow$$\n\n"
                + "#### 2. Site of Photosynthesis\n"
                + "- **Organelle**: **Chloroplast** (found abundantly in the mesophyll cells of green leaves).\n"
                + "- **Key Pigment**: **Chlorophyll** (primarily Chlorophyll *a* and *b* embedded in the thylakoid membranes, which absorb blue and red light and reflect green light).\n\n"
                + "#### 3. Two Main Stages of the Process\n\n"
                + "**Stage 1: Light-Dependent Reactions (Photochemical Phase)**\n"
                + "- **Location**: **Thylakoid Membranes (Grana)** of the chloroplast.\n"
                + "- **Activation**: Photons of sunlight excite chlorophyll electrons to higher energy levels.\n"
                + "- **Photolysis of Water**: Water molecules split into hydrogen ions, electrons, and oxygen gas:\n"
                + "  $$2H_2O \\rightarrow 4H^+ + 4e^- + O_2 \\uparrow$$\n"
                + "- **Energy Carriers**: **ATP** and **NADPH** are generated; oxygen gas is released as a vital byproduct.\n\n"
                + "**Stage 2: Light-Independent Reactions (Calvin Cycle / Biosynthetic Phase)**\n"
                + "- **Location**: **Stroma** (dense fluid region) of the chloroplast.\n"
                + "- **Carbon Fixation**: Enzyme **RuBisCO** fixes atmospheric $CO_2$ into a 3-carbon intermediate.\n"
                + "- **Reduction & Synthesis**: ATP and NADPH reduce the carbon intermediate to synthesize **Glucose ($C_6H_{12}O_6$)**.\n\n"
                + "#### 4. Factors Controlling the Rate of Photosynthesis\n"
                + "1. **Light Intensity**: Rate increases linearly with light intensity until chlorophyll saturation occurs.\n"
                + "2. **$CO_2$ Concentration**: Major atmospheric limiting factor; increasing $CO_2$ up to 0.05% boosts rate.\n"
                + "3. **Temperature**: Governed by enzymatic activity (optimum between $25^\\circ\\text{C} - 35^\\circ\\text{C}$).\n"
                + "4. **Water Availability**: Scarcity triggers stomata closure to prevent transpiration, limiting $CO_2$ uptake.\n\n"
                + "#### 5. 💡 Exam Essentials & Common Pitfalls\n"
                + "- **Critical Examination Fact**: The oxygen ($O_2$) released during photosynthesis comes strictly from the **splitting of water ($H_2O$)**, NOT from $CO_2$!\n"
                + "- **Storage Form**: Plants store excess glucose as insoluble **Starch**, and transport it as **Sucrose** through the phloem.";
    }

    private String trySolveLinearOrQuadraticEquation(String query) {
        try {
            // Pattern 1: ax + b = c or ax - b = c (e.g. 2x + 7 = 19, 2x - 5 = 15, x + 4 = 10)
            Pattern p1 = Pattern.compile("(?i)(\\d*)\\s*x\\s*([+\\-])\\s*(\\d+)\\s*=\\s*(\\d+)");
            Matcher m1 = p1.matcher(query);
            if (m1.find()) {
                String aStr = m1.group(1).trim();
                double a = aStr.isEmpty() ? 1.0 : Double.parseDouble(aStr);
                String sign = m1.group(2).trim();
                double b = Double.parseDouble(m1.group(3).trim());
                double c = Double.parseDouble(m1.group(4).trim());

                double rhs = sign.equals("+") ? (c - b) : (c + b);
                double x = rhs / a;

                String xFormatted = (x == (long) x) ? String.format("%d", (long) x) : String.format("%.2f", x);
                String rhsFormatted = (rhs == (long) rhs) ? String.format("%d", (long) rhs) : String.format("%.2f", rhs);
                String aFormatted = (a == (long) a) ? String.format("%d", (long) a) : String.format("%.2f", a);
                String bFormatted = (b == (long) b) ? String.format("%d", (long) b) : String.format("%.2f", b);
                String cFormatted = (c == (long) c) ? String.format("%d", (long) c) : String.format("%.2f", c);

                String oppositeSign = sign.equals("+") ? "-" : "+";

                return "### 📐 Academic Solution & Step-by-Step Calculation\n\n"
                        + "**Problem**: Solve for $x$ in the linear equation:\n"
                        + "$$" + aFormatted + "x " + sign + " " + bFormatted + " = " + cFormatted + "$$\n\n"
                        + "#### Step-by-Step Mathematical Derivation:\n\n"
                        + "1. **Identify the Given Equation**:\n"
                        + "   $$" + aFormatted + "x " + sign + " " + bFormatted + " = " + cFormatted + "$$\n\n"
                        + "2. **Transpose the Constant Term (" + sign + bFormatted + ") to the Right-Hand Side**:\n"
                        + "   Apply the inverse operation (" + oppositeSign + bFormatted + ") to both sides:\n"
                        + "   $$" + aFormatted + "x = " + cFormatted + " " + oppositeSign + " " + bFormatted + "$$\n"
                        + "   $$" + aFormatted + "x = " + rhsFormatted + "$$\n\n"
                        + "3. **Isolate the Variable ($x$)**:\n"
                        + "   Divide both sides by the coefficient of $x$ (" + aFormatted + "):\n"
                        + "   $$x = \\frac{" + rhsFormatted + "}{" + aFormatted + "}$$\n"
                        + "   $$\\mathbf{x = " + xFormatted + "}$$\n\n"
                        + "#### 🔍 Verification (Checking LHS = RHS):\n"
                        + "Substitute $x = " + xFormatted + "$ back into the original left-hand side:\n"
                        + "$$\\text{LHS} = " + aFormatted + "(" + xFormatted + ") " + sign + " " + bFormatted + " = " + cFormatted + " = \\text{RHS} \\quad \\checkmark$$\n\n"
                        + "**Final Answer**:\n"
                        + "$$\\mathbf{x = " + xFormatted + "}$$\n\n"
                        + "💡 **Exam Tip**: Always explicitly write out both LHS substitution and RHS equality to secure full verification marks in board examinations.";
            }

            // Pattern 2: ax = b (e.g. 3x = 18)
            Pattern p2 = Pattern.compile("(?i)(\\d+)\\s*x\\s*=\\s*(\\d+)");
            Matcher m2 = p2.matcher(query);
            if (m2.find()) {
                double a = Double.parseDouble(m2.group(1).trim());
                double b = Double.parseDouble(m2.group(2).trim());
                double x = b / a;
                String xFormatted = (x == (long) x) ? String.format("%d", (long) x) : String.format("%.2f", x);
                return "### 📐 Academic Solution & Step-by-Step Calculation\n\n"
                        + "**Problem**: Solve for $x$ in: $$" + (long)a + "x = " + (long)b + "$$\n\n"
                        + "1. Divide both sides by " + (long)a + ":\n"
                        + "   $$x = \\frac{" + (long)b + "}{" + (long)a + "} = " + xFormatted + "$$\n\n"
                        + "**Final Answer**: $$\\mathbf{x = " + xFormatted + "}$$";
            }
        } catch (Exception e) {
            log.debug("Regex equation parser skipped: {}", e.getMessage());
        }

        if (query.toLowerCase().contains("quadratic") || query.toLowerCase().contains("roots")) {
            return "### 📐 Quadratic Equations & The Quadratic Formula\n\n"
                    + "#### Standard Form:\n"
                    + "$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$\n\n"
                    + "#### 1. The Quadratic Formula:\n"
                    + "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n"
                    + "#### 2. The Discriminant ($D = b^2 - 4ac$):\n"
                    + "- If $D > 0$: Two distinct real roots ($x_1 \\neq x_2$).\n"
                    + "- If $D = 0$: Exactly one real repeated root ($x = -b / 2a$).\n"
                    + "- If $D < 0$: No real roots (two complex conjugate roots).\n\n"
                    + "#### 3. Sum and Product of Roots (Vieta's Formulas):\n"
                    + "- **Sum of roots** $(\\alpha + \\beta) = -\\frac{b}{a}$\n"
                    + "- **Product of roots** $(\\alpha \\beta) = \\frac{c}{a}$";
        }

        return null;
    }

    private String generateNewtonsLawsExplanation(String query) {
        return "### ⚡ Newton's Three Laws of Motion: Comprehensive Physics Guide\n\n"
                + "Regarding your question: *\"" + query + "\"*\n\n"
                + "Sir Isaac Newton formulated the three fundamental principles that govern classical mechanics and the motion of all macroscopic objects.\n\n"
                + "#### 1. Newton's First Law (Law of Inertia)\n"
                + "- **Statement**: *An object continues in its state of rest or uniform motion in a straight line unless acted upon by a net external unbalanced force.*\n"
                + "- **Concept of Inertia**: The natural tendency of an object to resist changes in its state of motion. Inertia is directly proportional to mass ($m$).\n"
                + "- **Real-World Example**: Passengers lean forward when a moving bus brakes suddenly because their upper body tends to remain in motion due to inertia.\n\n"
                + "#### 2. Newton's Second Law (Law of Force and Momentum)\n"
                + "- **Statement**: *The rate of change of momentum of a body is directly proportional to the applied unbalanced force and takes place in the direction in which the force acts.*\n"
                + "- **Mathematical Formulation**:\n"
                + "  $$F = \\frac{dp}{dt} = m \\cdot a$$\n"
                + "  Where $F$ = Net Force (Newtons, N), $m$ = mass (kg), $a$ = acceleration ($m/s^2$).\n"
                + "- **SI Unit**: **Newton (N)**, where $1\\text{ N} = 1\\text{ kg}\\cdot\\text{m/s}^2$.\n"
                + "- **Real-World Example**: A cricket fielder pulls their hands backward while catching a fast ball. This increases the contact time ($\\Delta t$), reducing the impact force ($F = \\Delta p / \\Delta t$).\n\n"
                + "#### 3. Newton's Third Law (Action & Reaction)\n"
                + "- **Statement**: *To every action, there is always an equal and opposite reaction.*\n"
                + "- **Key Principle**: Forces always occur in matched action-reaction pairs acting on **two different bodies** simultaneously ($F_{AB} = -F_{BA}$).\n"
                + "- **Real-World Example**: Rocket propulsion — hot exhaust gases expelled downwards create an equal and opposite upward thrust on the rocket.\n\n"
                + "#### 4. 💡 Exam Essentials\n"
                + "- **Common Pitfall**: Action and reaction do NOT cancel each other out because they act on **two separate objects**.";
    }

    private String generateRespirationExplanation(String query) {
        return "### 🫁 Cellular Respiration: Complete Biological Pathway\n\n"
                + "#### 1. Core Definition & Balanced Equation\n"
                + "**Cellular Respiration** is the biochemical catabolic process in living cells where glucose is broken down to produce metabolic energy in the form of **ATP** (Adenosine Triphosphate).\n\n"
                + "**Overall Balanced Chemical Equation (Aerobic Respiration):**\n"
                + "$$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 38\\text{ ATP}$$\n\n"
                + "#### 2. Three Main Stages of Respiration\n"
                + "1. **Glycolysis**:\n"
                + "   - **Location**: **Cytoplasm** (cytosol).\n"
                + "   - **Process**: 1 molecule of glucose (6C) is cleaved into 2 molecules of Pyruvate (3C). Does not require oxygen (anaerobic step).\n"
                + "   - **Net Yield**: 2 ATP + 2 NADH.\n\n"
                + "2. **Krebs Cycle (Citric Acid Cycle)**:\n"
                + "   - **Location**: **Mitochondrial Matrix**.\n"
                + "   - **Process**: Acetyl-CoA is oxidized, releasing $CO_2$ and reducing $NAD^+$ and $FAD$ into high-energy electron carriers (NADH, $FADH_2$).\n"
                + "   - **Yield**: 2 ATP + 6 NADH + 2 $FADH_2$.\n\n"
                + "3. **Electron Transport Chain (Oxidative Phosphorylation)**:\n"
                + "   - **Location**: **Inner Mitochondrial Membrane (Cristae)**.\n"
                + "   - **Process**: Electrons pass through enzyme complexes to oxygen (final electron acceptor), generating a proton gradient that drives ATP Synthase.\n"
                + "   - **Yield**: ~34 ATP molecules.\n\n"
                + "#### 3. Aerobic vs Anaerobic Respiration\n"
                + "- **Aerobic**: Requires $O_2$, complete oxidation of glucose, produces 36–38 ATP, outputs $CO_2$ and $H_2O$.\n"
                + "- **Anaerobic (Fermentation)**: Occurs without $O_2$, partial breakdown yielding only 2 ATP. In yeast: Ethanol + $CO_2$; In human muscles during strenuous exercise: Lactic Acid.";
    }

    private String generateAcidsBasesExplanation(String query) {
        return "### 🧪 Acids, Bases, and Salts: Chemistry Fundamentals\n\n"
                + "#### 1. Fundamental Definitions\n"
                + "- **Acids**: Substances that dissociate in aqueous solutions to produce hydrogen ions ($H^+$ or hydronium $H_3O^+$). Taste sour, turn blue litmus red.\n"
                + "- **Bases / Alkalis**: Substances that produce hydroxide ions ($OH^-$) in aqueous solution. Taste bitter, feel soapy, turn red litmus blue.\n\n"
                + "#### 2. The pH Scale (0 to 14)\n"
                + "- **pH < 7**: Acidic (e.g., Stomach Acid pH 1.5, Lemon Juice pH 2.2).\n"
                + "- **pH = 7**: Neutral (Pure distilled water).\n"
                + "- **pH > 7**: Basic / Alkaline (e.g., Bleach pH 12, Baking Soda pH 8.5).\n"
                + "$$\\text{pH} = -\\log_{10}[H^+]$$\n\n"
                + "#### 3. Neutralization Reaction\n"
                + "When an acid reacts with a base, they neutralize each other's properties to produce **Salt** and **Water**:\n"
                + "$$\\text{Acid} + \\text{Base} \\rightarrow \\text{Salt} + \\text{Water}$$\n"
                + "$$HCl_{(aq)} + NaOH_{(aq)} \\rightarrow NaCl_{(aq)} + H_2O_{(l)}$$\n\n"
                + "#### 4. Common Indicators for Lab Testing\n"
                + "- **Litmus**: Acid turns Blue to Red; Base turns Red to Blue.\n"
                + "- **Phenolphthalein**: Colorless in Acid; Bright Pink in Base.\n"
                + "- **Methyl Orange**: Red in Acid; Yellow in Base.";
    }

    private String generateOhmsLawExplanation(String query) {
        return "### ⚡ Ohm's Law and Electric Circuits: Physics Guide\n\n"
                + "#### 1. Statement of Ohm's Law\n"
                + "*The electric current ($I$) flowing through a metallic conductor is directly proportional to the potential difference ($V$) across its ends, provided physical conditions (such as temperature) remain constant.*\n\n"
                + "#### 2. Mathematical Formula:\n"
                + "$$V = I \\cdot R$$\n"
                + "- $V$ = Potential Difference in **Volts (V)**\n"
                + "- $I$ = Electric Current in **Amperes (A)**\n"
                + "- $R$ = Electrical Resistance in **Ohms ($\\Omega$)**\n\n"
                + "#### 3. Resistance Combinations in Circuits\n"
                + "- **Series Combination**: Current remains constant across each resistor; resistances add up:\n"
                + "  $$R_{\\text{equivalent}} = R_1 + R_2 + R_3$$\n"
                + "- **Parallel Combination**: Voltage remains constant across all branches; reciprocals add:\n"
                + "  $$\\frac{1}{R_{\\text{equivalent}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$$\n\n"
                + "#### 4. 💡 Exam Tip\n"
                + "The V-I characteristic graph for an ohmic conductor is a **straight line passing through the origin**. The slope of this graph ($V / I$) equals the resistance ($R$).";
    }

    private String generateCellStructureExplanation(String query) {
        return "### 🔬 Cell Structure and Organelles: Biology Core Guide\n\n"
                + "The **cell** is the fundamental structural and functional unit of all living organisms.\n\n"
                + "#### Key Cellular Organelles & Functions:\n"
                + "1. **Nucleus (The Control Center)**:\n"
                + "   - Houses genetic material (**DNA** in chromosomes).\n"
                + "   - Coordinates cellular activities like growth, metabolism, and division.\n\n"
                + "2. **Mitochondria (Powerhouse of the Cell)**:\n"
                + "   - Site of aerobic cellular respiration.\n"
                + "   - Generates energy currency in the form of **ATP** via the Krebs cycle and oxidative phosphorylation.\n\n"
                + "3. **Ribosomes (Protein Factories)**:\n"
                + "   - Synthesize proteins by translating messenger RNA (mRNA).\n\n"
                + "4. **Endoplasmic Reticulum (ER)**:\n"
                + "   - **Rough ER**: Studded with ribosomes; synthesizes and transports proteins.\n"
                + "   - **Smooth ER**: Lacks ribosomes; synthesizes lipids and detoxifies chemicals.\n\n"
                + "5. **Golgi Apparatus**:\n"
                + "   - Modifies, sorts, packages, and dispatches cellular proteins and lipids.\n\n"
                + "6. **Chloroplasts (Plants Only)**:\n"
                + "   - Contain chlorophyll to trap solar energy for photosynthesis.\n\n"
                + "7. **Cell Wall vs Cell Membrane**:\n"
                + "   - **Cell Membrane**: Semi-permeable lipid bilayer present in both plant and animal cells.\n"
                + "   - **Cell Wall**: Rigid cellulose layer present **only in plant cells and fungi**, providing structural rigidity and turgor pressure resistance.";
    }

    private String generateMnemonicExplanation(String query) {
        return "### 🧠 Memory Mnemonics & Study Shortcuts\n\n"
                + "Here are three proven memorization techniques for school exams:\n\n"
                + "1. **Colors of the Rainbow (Visible Spectrum)**: **ROYGBIV** (Red, Orange, Yellow, Green, Blue, Indigo, Violet).\n"
                + "2. **Order of Operations in Math**: **BODMAS / PEMDAS** (Brackets, Orders, Division, Multiplication, Addition, Subtraction).\n"
                + "3. **Oxidation and Reduction in Chemistry**: **OIL RIG** (Oxidation Is Loss of electrons, Reduction Is Gain of electrons).\n"
                + "4. **Metric Prefixes in Physics**: *King Henry Died By Drinking Chocolate Milk* (Kilo, Hecto, Deka, Base, Deci, Centi, Milli).\n\n"
                + "Feel free to ask for a custom mnemonic for any formula or sequence you are studying!";
    }

    private String generateGeneralAcademicExplanation(String query, String topic, String subject, String domain, String extractedText) {
        String detectedSub = detectSubjectFromTopicAndText(query + " " + (topic != null ? topic : ""), extractedText);

        StringBuilder sb = new StringBuilder();
        sb.append("### 📘 Academic Concept Breakdown: ").append(query).append("\n\n");
        sb.append("**Curriculum Subject**: ").append(detectedSub).append("\n\n");

        sb.append("#### 1. Core Definition & Foundational Concept\n");
        sb.append("In ").append(detectedSub).append(", **").append(query).append("** represents a key curriculum principle governing natural or mathematical behavior. ");
        sb.append("Mastering this concept requires understanding the underlying laws, standard mathematical formulations, and definitions.\n\n");

        if (extractedText != null && !extractedText.isBlank()) {
            sb.append("#### 2. Key Findings From Study Notes\n");
            String[] lines = extractedText.split("\\r?\\n");
            int added = 0;
            for (String l : lines) {
                if (l.trim().length() > 25 && added < 4) {
                    sb.append("- ").append(l.trim()).append("\n");
                    added++;
                }
            }
            sb.append("\n");
        }

        sb.append("#### 2. Step-by-Step Understanding & Mechanism\n");
        sb.append("1. **Prerequisite Knowledge**: Identify the fundamental physical laws, definitions, or equations involved.\n");
        sb.append("2. **Core Interaction**: Trace the direct relationship between dependent and independent parameters.\n");
        sb.append("3. **Concluding Application**: Evaluate the theoretical result or numerical solution.\n\n");

        sb.append("#### 3. 💡 High-Yield Exam Advice\n");
        sb.append("- **Diagrams & Formulas**: In exams, always write down the governing formula or balanced equation first.\n");
        sb.append("- **Units & Conditions**: Ensure all values are converted to standard SI units.\n");
        sb.append("- **Keywords**: Use precise syllabus terminology to secure maximum marks on scoring rubrics.");

        return sb.toString();
    }

    private List<String> generateFollowUps(String topic, String subject) {
        return List.of(
                "Can you explain this step-by-step with an example?",
                "Give me 3 memory mnemonics for this topic",
                "What are the most common exam questions and pitfalls?",
                "How do I solve problem questions on this in exams?"
        );
    }

    private List<McqQuestionDto> prioritizeAndRenumber(List<McqQuestionDto> list, String topic) {
        if (list == null || list.isEmpty() || topic == null || topic.isBlank()) return list;
        String[] keywords = topic.toLowerCase().split("[^a-zA-Z0-9]+");
        list.sort((a, b) -> {
            long countA = Arrays.stream(keywords).filter(k -> k.length() > 3 && a.getQuestion().toLowerCase().contains(k)).count();
            long countB = Arrays.stream(keywords).filter(k -> k.length() > 3 && b.getQuestion().toLowerCase().contains(k)).count();
            return Long.compare(countB, countA);
        });
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setId(i + 1);
        }
        return list;
    }

    private List<ExamQuestionDto> prioritizeAndRenumberExam(List<ExamQuestionDto> list, String topic) {
        if (list == null || list.isEmpty() || topic == null || topic.isBlank()) return list;
        String[] keywords = topic.toLowerCase().split("[^a-zA-Z0-9]+");
        list.sort((a, b) -> {
            long countA = Arrays.stream(keywords).filter(k -> k.length() > 3 && a.getQuestion().toLowerCase().contains(k)).count();
            long countB = Arrays.stream(keywords).filter(k -> k.length() > 3 && b.getQuestion().toLowerCase().contains(k)).count();
            return Long.compare(countB, countA);
        });
        for (int i = 0; i < list.size(); i++) {
            list.get(i).setId(i + 1);
        }
        return list;
    }
}
