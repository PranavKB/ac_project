package com.cdac.carpooling.security;

import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    // Generating signing key from base64 encoded secret
    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getUrlDecoder().decode(jwtSecret);
        if (keyBytes.length < 64) {
            throw new IllegalArgumentException("JWT secret key must be at least 64 bytes for HS512");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Generating token from email
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // Generating token from Authentication object
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateToken(userPrincipal.getUsername());
    }

    // Extracting all claims from token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Extracting any claim using a resolver function
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extracting subject (username or email)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extracting "email" from a custom claim if separately stored
    public String extractEmailFromToken(String token) {
        return extractClaim(token, claims -> claims.get(SecurityConstants.EMAIL_STRING, String.class));
    }

    // Extracting username/email from Authorization header
    public String extractUsernameFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(SecurityConstants.AUTH_HEADER);

        if (authHeader != null && authHeader.startsWith(SecurityConstants.BEARER_PREFIX)) {
            String token = authHeader.substring(7);
            return extractUsername(token);
        }

        return null;
    }

    // Extracting custom email claim from Authorization header
    public String extractEmailFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(SecurityConstants.AUTH_HEADER);

        if (authHeader != null && authHeader.startsWith(SecurityConstants.BEARER_PREFIX)) {
            String token = authHeader.substring(7);
            return extractEmailFromToken(token);
        }

        return null;
    }

    // Validate token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username != null && username.equals(userDetails.getUsername()));
    }

    // Temporary registration token valid for 30 minutes
    public String generateRegistrationToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (30 * 60 * 1000));

        return Jwts.builder()
                .setSubject(email)
                .claim("type", "REGISTRATION")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // Validating registration token and return email if valid
    public String validateRegistrationToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String type = claims.get("type", String.class);
            if (!"REGISTRATION".equals(type)) {
                throw new IllegalArgumentException("Invalid token type");
            }
            if (claims.getExpiration().before(new Date())) {
                throw new IllegalArgumentException("Token has expired");
            }
            return claims.getSubject();
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired registration token: " + e.getMessage());
        }
    }
}
