package com.cdac.carpooling.dto;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    // Can hold a single error message or a list of validation errors
    private Object errors;
    private long timestamp;

    // Success Response. Defaults to 200 OK
    public static <T> ResponseEntity<ApiResponse<T>> success(T data, String message) {
        return success(data, message, HttpStatus.OK); 
    }

    // Success Response. Custom Status.
    public static <T> ResponseEntity<ApiResponse<T>> success(T data, String message, HttpStatus status) {
        return createResponse(status, true, message, data, null);
    }

    // Error Response. Defaults to 500 Internal Server Error
    public static <T> ResponseEntity<ApiResponse<T>> error(String message) {
        return error(message, HttpStatus.INTERNAL_SERVER_ERROR); 
    }

    //Error Reponse. Custom Status
    public static <T> ResponseEntity<ApiResponse<T>> error(String message, HttpStatus status) {
        return error(message, null, status);
    }

    // Error Response.Custom Status with Error Validations
    public static <T> ResponseEntity<ApiResponse<T>> error(String message, Object errors, HttpStatus status) {
        return createResponse(status, false, message, null, errors);
    }

    private static <T> ResponseEntity<ApiResponse<T>> createResponse(HttpStatus status, boolean success, String message, T data, Object errors) {
        ApiResponse<T> body = ApiResponse.<T>builder()
                .success(success)
                .message(message)
                .data(data)
                .errors(errors)
                .timestamp(Instant.now().toEpochMilli())
                .build();
        return new ResponseEntity<>(body, status);
    }
}