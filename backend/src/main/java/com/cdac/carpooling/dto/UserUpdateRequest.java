package com.cdac.carpooling.dto;

import com.cdac.carpooling.model.User;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String phone;
    private String bio;
    private User.Preferences preferences;
    private User.VehicleDetails vehicleDetails;
}
