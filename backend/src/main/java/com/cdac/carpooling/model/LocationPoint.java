package com.cdac.carpooling.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationPoint {
    private String name;
    private GeoJsonPoint location;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeoJsonPoint {
        private String type = "Point";
         // [longitude, latitude]
        private double[] coordinates;
    }
}
