package com.cdac.carpooling.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cdac.carpooling.dto.ApiResponse;
import com.cdac.carpooling.service.RoutingService;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    private final RoutingService routingService;

    public RouteController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getRoute(
            @RequestParam double srcLat,
            @RequestParam double srcLng,
            @RequestParam double destLat,
            @RequestParam double destLng) {
        try {
            List<List<Double>> routeCoordinates = routingService.getRouteCoordinates(srcLat, srcLng, destLat, destLng);
            return ApiResponse.success(routeCoordinates, "Route fetched successfully");
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch route data: " + e.getMessage());
        }
    }
}
