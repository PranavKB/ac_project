package com.cdac.carpooling.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReportRequest {
    @NotBlank
    private String rideId;

    @NotBlank
    private String reporterId;

    private String reportedUserId;

    @NotBlank
    private String reason;

    private String details;
}
