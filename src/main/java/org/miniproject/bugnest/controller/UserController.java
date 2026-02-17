package org.miniproject.bugnest.controller;

import org.miniproject.bugnest.dto.PasswordChangeRequest;
import org.miniproject.bugnest.dto.ProfileUpdateRequest;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Configure as needed
public class UserController {

    @Autowired
    private UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User updatedUser = userService.updateUserProfile(email, request);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully", "user", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            userService.changePassword(email, request);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User user = userService.getUserPixel(email);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
             return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Admin User Management ---

    @GetMapping
    public ResponseEntity<?> getUsersByRole(@RequestParam String role) {
        try {
            return ResponseEntity.ok(userService.getAllUsersByRole(org.miniproject.bugnest.model.Role.valueOf(role.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody org.miniproject.bugnest.dto.UserCreateRequest request) {
        try {
            User newUser = userService.createUser(request);
            return ResponseEntity.ok(Map.of("message", "User created successfully", "user", newUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
