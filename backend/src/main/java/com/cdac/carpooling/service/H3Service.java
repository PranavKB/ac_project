package com.cdac.carpooling.service;

import com.uber.h3core.H3Core;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.*;

@Service
public class H3Service {

    private H3Core h3;
    private static final int H3_RESOLUTION = 9; // ~100m hexagons

    @PostConstruct
    public void init() throws IOException {
        h3 = H3Core.newInstance();
    }

    /**
     * Convert a list of [lat, lng] coordinate pairs into unique H3 cell addresses.
     */
    public List<String> pathToH3Segments(List<List<Double>> coords) {
        LinkedHashSet<String> cells = new LinkedHashSet<>();
        for (List<Double> coord : coords) {
            // rounding cordinates to 6 decimals
            double lat = Math.round(coord.get(0) * 1e6) / 1e6;
            double lng = Math.round(coord.get(1) * 1e6) / 1e6;
            cells.add(h3.latLngToCellAddress(lat, lng, H3_RESOLUTION));
        }
        return new ArrayList<>(cells);
    }

    /**
     * Route Similarity = |intersection| / |union|
     */
    public double calculateSimilarity(List<String> segmentsA, List<String> segmentsB) {
        if (segmentsA == null || segmentsB == null || segmentsA.isEmpty() || segmentsB.isEmpty()) {
            return 0.0;
        }
        Set<String> setA = new HashSet<>(segmentsA);
        Set<String> setB = new HashSet<>(segmentsB);
        Set<String> intersection = new HashSet<>(setA);
        // A intersection B
        intersection.retainAll(setB);
        Set<String> union = new HashSet<>(setA);
        // A Union B
        union.addAll(setB);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    /**
     * Haversine distance between two [lat, lng] points in km.
     */
    public double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

}
