package com.cdac.carpooling.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.cdac.carpooling.model.User;
import com.cdac.carpooling.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository repo;

    public CustomUserDetailsService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(java.util.stream.Collectors.toList());
                
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), authorities);
    }
}
