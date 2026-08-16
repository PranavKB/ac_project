package com.cdac.carpooling.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GeoJsonDto {
    private String type = "Point";

    @NotNull(message = "Coordinates array cannot be null")
    private List<Double> coordinates;
}
