package com.cdac.carpooling.dto;

import lombok.Data;
import java.util.List;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String phone;
    private String password;
    private List<String> roles;
}
