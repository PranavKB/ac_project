package com.cdac.carpooling.dto;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private String id;
    private String name;
    private String email;
    private String phone;
    private List<String> roles;
    private Instant createdAt;
    private double trustScore;
    private double reliabilityScore;
    private double comfortScore;
    private double totalCarbonSavedKg;
}
