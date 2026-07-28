package com.cdac.carpooling.controller;

import java.time.Instant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.dto.ReportRequest;
import com.cdac.carpooling.model.Report;
import com.cdac.carpooling.repository.ReportRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Report>> submitReport(@Valid @RequestBody ReportRequest request) {
        Report report = new Report();
        report.setRideId(request.getRideId());
        report.setReporterId(request.getReporterId());
        report.setReportedUserId(request.getReportedUserId());
        report.setReason(request.getReason());
        report.setDetails(request.getDetails());
        report.setStatus("PENDING");
        report.setCreatedAt(Instant.now());

        Report saved = reportRepository.save(report);
        return ApiResponse.success(saved, "Report submitted successfully");
    }
}
