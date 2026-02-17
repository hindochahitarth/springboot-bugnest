package org.miniproject.bugnest.config;

import org.miniproject.bugnest.model.Role;
import org.miniproject.bugnest.model.Status;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            createUser("Admin User", "admin@bugnest.com", "admin123", Role.ADMIN);
            createUser("Manager User", "manager@bugnest.com", "manager123", Role.PROJECT_MANAGER);
            createUser("Developer User", "developer@bugnest.com", "developer123", Role.DEVELOPER);
            createUser("Tester User", "tester@bugnest.com", "tester123", Role.TESTER);
        }
    }

    private void createUser(String name, String email, String password, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(Status.ACTIVE);
        // createdAt is handled by @PrePersist
        userRepository.save(user);
        System.out.println("Created user: " + email);
    }
}
