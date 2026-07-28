package com.school.service;

import com.school.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

// Local-disk storage for uploaded study material PDFs. Swap this out for an
// S3/GCS-backed implementation later without touching the service layer —
// StudyMaterialService only depends on store()/loadAsResource()/delete().
@Service
public class FileStorageService {

    private final Path rootLocation;

    public FileStorageService(@Value("${app.upload-dir:uploads/materials}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not initialize upload directory: " + rootLocation, e);
        }
    }

    public String store(MultipartFile file) {
        String original = file.getOriginalFilename();
        String extension = "";
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf('.'));
        }
        String storedFileName = UUID.randomUUID() + extension;
        Path destination = resolveSafely(storedFileName);

        try (var in = file.getInputStream()) {
            Files.copy(in, destination);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file " + storedFileName, e);
        }
        return storedFileName;
    }

    public Resource loadAsResource(String storedFileName) {
        Path file = resolveSafely(storedFileName);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found: " + storedFileName);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found: " + storedFileName);
        }
    }

    public void delete(String storedFileName) {
        try {
            Files.deleteIfExists(resolveSafely(storedFileName));
        } catch (IOException ignored) {
            // Best-effort cleanup; a leftover orphan file on disk isn't worth failing the request over.
        }
    }

    // Guards against path traversal (e.g. a filename like "../../etc/passwd").
    private Path resolveSafely(String storedFileName) {
        Path resolved = rootLocation.resolve(storedFileName).normalize();
        if (!resolved.getParent().equals(rootLocation)) {
            throw new SecurityException("Invalid file path: " + storedFileName);
        }
        return resolved;
    }
}