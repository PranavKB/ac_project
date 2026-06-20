package com.cdac.carpooling.service;

import com.uber.h3core.H3Core;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.*;

@Service
public class H3Service {

    private H3Core h3;
    private static final int H3_RESOLUTION = 8; // ~460m hexagons

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
            cells.add(h3.latLngToCellAddress(coord.get(0), coord.get(1), H3_RESOLUTION));
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
        //A intersection B
        intersection.retainAll(setB);
        Set<String> union = new HashSet<>(setA);
        //A Union B
        union.addAll(setB);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

}




