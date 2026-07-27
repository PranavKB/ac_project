package com.cdac.carpooling.service;

import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.Ride;
import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CarbonService {

    // Avg fuel consumption: 0.08 L/km per car
    private static final double FUEL_PER_KM = 0.08;
    // CO2 per liter of petrol: 2.33 kg
    private static final double CO2_PER_LITER = 2.33;

    private final UserRepository userRepository;

    /**
     * Calculate environmental offset for a completed ride.
     * Each shared passenger reduces one avoided car's fuel consumption.
     */
    public Ride.EnvironmentalOffset calculateOffset(double distanceKm, int passengerCount) {
        double avoidedFuel = distanceKm * FUEL_PER_KM * passengerCount;
        double reducedCo2 = avoidedFuel * CO2_PER_LITER;
        return new Ride.EnvironmentalOffset(Math.round(avoidedFuel * 100.0) / 100.0,
                Math.round(reducedCo2 * 100.0) / 100.0);
    }

    /**
     * Calculate individual carbon offset for a single passenger.
     */
    public double calculatePassengerOffset(double distanceKm) {
        double avoidedFuel = distanceKm * FUEL_PER_KM;
        double reducedCo2 = avoidedFuel * CO2_PER_LITER;
        return Math.round(reducedCo2 * 100.0) / 100.0;
    }

    /**
     * Add CO2 saved to a user's running total.
     */
    public void creditCarbonToUser(String userId, double co2Kg) {
        System.out.println("[CarbonService] Crediting carbon: userId=" + userId + ", co2Kg=" + co2Kg);
        userRepository.findById(userId).ifPresentOrElse(user -> {
            double oldVal = user.getTotalCarbonSavedKg();
            user.setTotalCarbonSavedKg(oldVal + co2Kg);
            User saved = userRepository.save(user);
            System.out.println("[CarbonService] Successfully updated user carbon from " + oldVal + " to " + saved.getTotalCarbonSavedKg());
        }, () -> {
            System.err.println("[CarbonService] ERROR: User not found with ID: " + userId);
        });
    }

    public void creditCarbonToDriver(String driverId, double co2Kg) {
        creditCarbonToUser(driverId, co2Kg);
    }
}
