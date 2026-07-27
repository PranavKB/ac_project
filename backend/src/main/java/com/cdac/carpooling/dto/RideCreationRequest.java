package com.cdac.carpooling.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RideCreationRequest {

    @NotBlank(message = "Driver ID is required")
    private String driverId;

    @NotBlank(message = "Driver name is required")
    private String driverName;

    @NotNull(message = "Total seats configuration is required")
    @Min(value = 1, message = "A ride must offer at least 1 seat")
    private Integer totalSeats;

    private String departureTime;

    private int estimatedDurationMinutes;

    private Double pricePerSeat;

    @NotNull(message = "Source location is required")
    @Valid
    private LocationDto source;

    @NotNull(message = "Destination location is required")
    @Valid 
    private LocationDto destination;

}
