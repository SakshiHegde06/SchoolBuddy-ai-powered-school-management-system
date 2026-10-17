package com.school.repository;

import com.school.document.Holiday;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface HolidayRepository extends MongoRepository<Holiday, String> {
    List<Holiday> findByDateBetweenOrderByDateAsc(LocalDate start, LocalDate end);
    List<Holiday> findAllByOrderByDateAsc();
}
