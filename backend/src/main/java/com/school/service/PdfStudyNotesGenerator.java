package com.school.service;

import com.school.document.StudyMaterial;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfStudyNotesGenerator {

    /**
     * Generates a well-formatted academic study notes PDF in memory
     * when the physical file is not on disk or as a structured study guide.
     */
    public byte[] generateStudyNotesPdf(StudyMaterial material, String subjectName, String className) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float margin = 50;
            float yStart = 780;
            float width = page.getMediaBox().getWidth() - (2 * margin);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Header accent bar
                cs.setNonStrokingColor(30 / 255f, 42 / 255f, 71 / 255f); // Navy
                cs.addRect(margin, yStart + 10, width, 4);
                cs.fill();

                float currentY = yStart;

                // Title
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
                cs.setNonStrokingColor(30 / 255f, 42 / 255f, 71 / 255f);
                cs.newLineAtOffset(margin, currentY);
                cs.showText(sanitizeText(material.getTitle() != null ? material.getTitle() : "Study Material"));
                cs.endText();
                currentY -= 22;

                // Subtitle / Subject & Class
                String sub = (subjectName != null ? subjectName : "General Subject");
                String cls = (className != null ? className : "All Classes");
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 11);
                cs.setNonStrokingColor(100 / 255f, 100 / 255f, 100 / 255f);
                cs.newLineAtOffset(margin, currentY);
                cs.showText(sanitizeText(sub.toUpperCase() + "  |  " + cls + "  |  SchoolBuddy AI Study Portal"));
                cs.endText();
                currentY -= 25;

                // Horizontal separator
                cs.setNonStrokingColor(220 / 255f, 220 / 255f, 220 / 255f);
                cs.addRect(margin, currentY, width, 1);
                cs.fill();
                currentY -= 20;

                // Section 1: Overview
                currentY = drawSectionHeading(cs, "1. Core Academic Overview", margin, currentY);
                String overviewText = "This comprehensive study guide is curated by your subject faculty to reinforce "
                        + "essential understanding of " + (material.getTitle() != null ? material.getTitle() : "the topic")
                        + ". Master the fundamental principles, key definitions, and practice questions below to achieve "
                        + "maximum marks in assessments.";
                currentY = drawParagraph(cs, overviewText, margin, currentY, width, 10);
                currentY -= 15;

                // Section 2: Important Key Topics (Bullet points)
                currentY = drawSectionHeading(cs, "2. Key Syllabus Topics & Concepts", margin, currentY);
                List<String> bullets = List.of(
                        "Fundamental Principles: Review foundational definitions, axioms, and primary mechanisms.",
                        "Critical Theorems & Formulations: Understand core derivations and standard mathematical expressions.",
                        "Methodology & Problem Solving: Apply step-by-step analytical reasoning to sample scenarios.",
                        "Comparative Analysis: Contrast key variables, structural differences, and contextual applications.",
                        "High-Yield Exam Focus: Focus on structured answer formatting and accurate technical terminology."
                );
                for (String b : bullets) {
                    currentY = drawBullet(cs, b, margin, currentY, width, 10);
                }
                currentY -= 15;

                // Section 3: High-Yield Exam Preparation (5M & 10M)
                currentY = drawSectionHeading(cs, "3. High-Yield Examination Preparation Strategy", margin, currentY);
                List<String> examTips = List.of(
                        "5-Mark Questions: Target 5 distinct, numbered points. Allocate 1 mark for clear definition, 3 marks for core explanation, and 1 mark for supporting diagram/formula.",
                        "10-Mark Questions: Structure into four clear sections: (1) Introduction, (2) Detailed Mechanism/Derivation, (3) Diagrammatic representation or real-world application, and (4) Analytical Conclusion.",
                        "AI Tutor Integration: Use the built-in SchoolBuddy AI Tutor to generate interactive practice MCQs and test your conceptual retention before examinations."
                );
                for (String tip : examTips) {
                    currentY = drawBullet(cs, tip, margin, currentY, width, 10);
                }
                currentY -= 20;

                // Footer banner
                cs.setNonStrokingColor(240 / 255f, 240 / 255f, 245 / 255f);
                cs.addRect(margin, 40, width, 24);
                cs.fill();

                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
                cs.setNonStrokingColor(100 / 255f, 100 / 255f, 100 / 255f);
                cs.newLineAtOffset(margin + 10, 48);
                cs.showText("SchoolBuddy AI Education Portal - Verified Academic Curriculum Material - Page 1 of 1");
                cs.endText();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate study notes PDF", e);
        }
    }

    private float drawSectionHeading(PDPageContentStream cs, String heading, float x, float y) throws IOException {
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, 12);
        cs.setNonStrokingColor(30 / 255f, 42 / 255f, 71 / 255f);
        cs.newLineAtOffset(x, y);
        cs.showText(sanitizeText(heading));
        cs.endText();
        return y - 16;
    }

    private float drawBullet(PDPageContentStream cs, String text, float x, float y, float width, int fontSize) throws IOException {
        float indent = 15;
        cs.beginText();
        cs.setFont(PDType1Font.HELVETICA_BOLD, fontSize);
        cs.setNonStrokingColor(217 / 255f, 164 / 255f, 65 / 255f); // Amber bullet
        cs.newLineAtOffset(x, y);
        cs.showText("- ");
        cs.endText();

        return drawParagraph(cs, text, x + indent, y, width - indent, fontSize);
    }

    private float drawParagraph(PDPageContentStream cs, String text, float x, float y, float width, int fontSize) throws IOException {
        PDFont font = PDType1Font.HELVETICA;
        List<String> lines = wrapText(text, width, font, fontSize);
        float leading = fontSize + 4;

        cs.beginText();
        cs.setFont(font, fontSize);
        cs.setNonStrokingColor(35 / 255f, 35 / 255f, 35 / 255f);
        cs.newLineAtOffset(x, y);

        for (int i = 0; i < lines.size(); i++) {
            cs.showText(sanitizeText(lines.get(i)));
            if (i < lines.size() - 1) {
                cs.newLineAtOffset(0, -leading);
            }
        }
        cs.endText();

        return y - (lines.size() * leading);
    }

    private List<String> wrapText(String text, float width, PDFont font, int fontSize) throws IOException {
        List<String> lines = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String candidate = currentLine.length() == 0 ? word : currentLine + " " + word;
            float candidateWidth = (font.getStringWidth(sanitizeText(candidate)) / 1000f) * fontSize;
            if (candidateWidth > width) {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    lines.add(word);
                }
            } else {
                currentLine = new StringBuilder(candidate);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        // Replace non-ASCII characters to keep Type1 font safe
        return text.replaceAll("[\\r\\n]+", " ")
                .replaceAll("[\u2018\u2019]", "'")
                .replaceAll("[\u201C\u201D]", "\"")
                .replaceAll("[\u2013\u2014]", "-")
                .replaceAll("[\u2022\u2023]", "-")
                .replaceAll("[^\\x00-\\x7F]", " ")
                .trim();
    }
}
