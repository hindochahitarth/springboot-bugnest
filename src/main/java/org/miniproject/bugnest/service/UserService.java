package org.miniproject.BugNest.service;

import org.miniproject.BugNest.dto.PasswordChangeRequest;
import org.miniproject.BugNest.dto.ProfileUpdateRequest;
import org.miniproject.BugNest.model.User;
import org.miniproject.BugNest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User updateUserProfile(String email, ProfileUpdateRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (request.getFullName() != null && !request.getFullName().isEmpty()) {
                user.setName(request.getFullName());
            }
            // Add other field updates here
            return userRepository.save(user);
        }
        throw new RuntimeException("User not found");
    }

    public void changePassword(String email, PasswordChangeRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Invalid current password");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
        } else {
            throw new RuntimeException("User not found");
        }
    }
    
    public User getUserPixel(String email) {
         return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    // --- User Management (Admin) ---

    public java.util.List<User> getAllUsersByRole(org.miniproject.BugNest.model.Role role) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .collect(java.util.stream.Collectors.toList());
    }

    @Autowired
    private EmailService emailService;

    public User createUser(org.miniproject.BugNest.dto.UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        // Mobile number handling would go here if User entity had it, for now skipping or adding to logic
        
        user.setRole(org.miniproject.BugNest.model.Role.valueOf(request.getRole().toUpperCase()));
        user.setStatus(org.miniproject.BugNest.model.Status.ACTIVE);

        // Auto-generate password
        String tempPassword = generateRandomPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));

        User savedUser = userRepository.save(user);

        // Send Email Notification
        String subject = "Welcome to BugNest - Your Account Details";
        String body = "Hello " + user.getName() + ",\n\n" +
                "Your account has been created successfully.\n" +
                "Here are your login details:\n\n" +
                "Email: " + user.getEmail() + "\n" +
                "Temporary Password: " + tempPassword + "\n\n" +
                "Please log in at: http://localhost:5173/login\n" +
                "We recommend changing your password after logging in.\n\n" +
                "Best regards,\n" +
                "The BugNest Team";
        
        emailService.sendEmail(user.getEmail(), subject, body);

        return savedUser;
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
