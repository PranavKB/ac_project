package com.cdac.carpooling.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.cdac.carpooling.model.Report;

public interface ReportRepository extends MongoRepository<Report, String> {
    List<Report> findByStatus(String status);
}
