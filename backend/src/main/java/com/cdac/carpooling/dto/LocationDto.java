package com.cdac.carpooling.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocationDto {
    @NotBlank(message = "Location name is required")
    private String name;

    @NotNull(message = "Geo coordinates object wrapper is required")
    @Valid
    private GeoJsonDto location;
}
