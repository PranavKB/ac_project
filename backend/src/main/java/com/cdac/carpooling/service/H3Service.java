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
     * Ordered H3 Cell Similarity Algorithm:
     * Compares the stored sequence of H3 cells between Driver (segmentsA) and Passenger (segmentsB).
     * Enforces that matching H3 cells MUST follow the same forward order along the driver's route.
     * Reverse or backward order searches immediately evaluate to 0.0.
     */
    public double calculateSimilarity(List<String> segmentsA, List<String> segmentsB) {
        if (segmentsA == null || segmentsB == null || segmentsA.isEmpty() || segmentsB.isEmpty()) {
            return 0.0;
        }

        // Map driver H3 cells to their index positions in driver's route
        Map<String, Integer> driverIndexMap = new HashMap<>();
        for (int i = 0; i < segmentsA.size(); i++) {
            driverIndexMap.putIfAbsent(segmentsA.get(i), i);
        }

        // Collect matching driver cell indices for passenger's ordered H3 cells
        List<Integer> matchedIndices = new ArrayList<>();
        for (String pCell : segmentsB) {
            if (driverIndexMap.containsKey(pCell)) {
                matchedIndices.add(driverIndexMap.get(pCell));
            }
        }

        if (matchedIndices.size() < 2) {
            return 0.0;
        }

        // Evaluate forward vs backward cell sequence ordering
        int maxForwardSequence = 1;
        int maxBackwardSequence = 1;
        int currentForward = 1;
        int currentBackward = 1;

        for (int k = 1; k < matchedIndices.size(); k++) {
            if (matchedIndices.get(k) > matchedIndices.get(k - 1)) {
                currentForward++;
                maxForwardSequence = Math.max(maxForwardSequence, currentForward);
            } else {
                currentForward = 1;
            }

            if (matchedIndices.get(k) < matchedIndices.get(k - 1)) {
                currentBackward++;
                maxBackwardSequence = Math.max(maxBackwardSequence, currentBackward);
            } else {
                currentBackward = 1;
            }
        }

        // If cells appear in reverse/backward order, return 0.0 (Reverse Search)
        if (maxBackwardSequence >= maxForwardSequence || matchedIndices.get(0) >= matchedIndices.get(matchedIndices.size() - 1)) {
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
