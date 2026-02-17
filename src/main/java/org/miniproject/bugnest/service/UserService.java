package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.PasswordChangeRequest;
import org.miniproject.bugnest.dto.ProfileUpdateRequest;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.repository.UserRepository;
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

    public java.util.List<User> getAllUsersByRole(org.miniproject.bugnest.model.Role role) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .collect(java.util.stream.Collectors.toList());
    }

    @Autowired
    private EmailService emailService;

    public User createUser(org.miniproject.bugnest.dto.UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        user.setRole(org.miniproject.bugnest.model.Role.valueOf(request.getRole().toUpperCase()));
        user.setStatus(org.miniproject.bugnest.model.Status.ACTIVE);

        // Set default password: (name-lowercase-nospaces)123
        String defaultPassword = request.getName().toLowerCase().replaceAll("\\s+", "") + "123";
        user.setPassword(passwordEncoder.encode(defaultPassword));

        return userRepository.save(user);
    }
}
