package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.AuthResponse;
import org.miniproject.bugnest.dto.LoginRequest;
import org.miniproject.bugnest.repository.UserRepository;
import org.miniproject.bugnest.security.JwtUtils;
import org.miniproject.bugnest.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        // Get role from UserDetails
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(item -> item.getAuthority())
                .orElse("ROLE_USER");

        // Remove ROLE_ prefix for frontend
        if (role.startsWith("ROLE_")) {
            role = role.substring(5);
        }

        return ResponseEntity.ok(new AuthResponse(jwt, role));
    }

    @Autowired
    private org.miniproject.bugnest.service.UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody org.miniproject.bugnest.dto.RegisterRequest registerRequest) {
        try {
            org.miniproject.bugnest.model.User user = userService.registerPublicUser(registerRequest);
            return ResponseEntity.ok(java.util.Map.of("message", "User registered successfully", "user", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
