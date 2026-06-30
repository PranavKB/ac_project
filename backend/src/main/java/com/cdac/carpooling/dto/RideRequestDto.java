package com.cdac.carpooling.dto;

import com.cdac.carpooling.model.LocationPoint;
import lombok.Data;
import java.util.List;

@Data
public class RideRequestDto {
    private String rideId;
    private String passengerId;
    private String passengerName;
    private LocationPoint source;
    private LocationPoint destination;
    private List<String> passengerH3Segments;
}
