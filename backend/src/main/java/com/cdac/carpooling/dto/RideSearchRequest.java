package com.cdac.carpooling.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
public class RideSearchRequest {

    @Size(min = 2, max = 2, message = "Source coordinates must be exactly [lat, lng]")
    private List<Double> sourceCoords;

    @Size(min = 2, max = 2, message = "Destination coordinates must be exactly [lat, lng]")
    private List<Double> destinationCoords;

    private String departureDate;
}



