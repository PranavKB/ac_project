package com.cdac.carpooling.exception;

import com.cdac.carpooling.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle JSR-303/JSR-380 validation errors (e.g. @NotBlank, @Email)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        return ApiResponse.error("Validation failed", errors, HttpStatus.BAD_REQUEST);
    }

    // Handle business exceptions or general runtime errors
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeExceptions(RuntimeException ex) {
        // Return 400 Bad Request for standard business errors (like "Email already registered", "Invalid credentials")
        HttpStatus status = HttpStatus.BAD_REQUEST;
        
        String message = ex.getMessage();
        if (message != null && (message.contains("Invalid credentials") || message.contains("User not found"))) {
            status = HttpStatus.UNAUTHORIZED;
        }
        
        return ApiResponse.error(message, status);
    }
}
