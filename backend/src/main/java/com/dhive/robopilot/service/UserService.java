package com.dhive.robopilot.service;

import com.dhive.robopilot.model.User;
import com.dhive.robopilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(String id, User updatedUser) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Update only non-null fields from the request
        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }
        if (updatedUser.getEmail() != null) {
            existingUser.setEmail(updatedUser.getEmail());
        }
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existingUser.setPassword(updatedUser.getPassword());
        }
        if (updatedUser.getRole() != null) {
            existingUser.setRole(updatedUser.getRole());
        }
        if (updatedUser.getCompanyId() != null) {
            existingUser.setCompanyId(updatedUser.getCompanyId());
        }
        if (updatedUser.getCompanyName() != null) {
            existingUser.setCompanyName(updatedUser.getCompanyName());
        }
        if (updatedUser.getStatus() != null) {
            existingUser.setStatus(updatedUser.getStatus());
        }
        // Update siteIds (can be empty list for non-operators)
        if (updatedUser.getSiteIds() != null) {
            existingUser.setSiteIds(updatedUser.getSiteIds());
        }

        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public List<User> getUsersByCompanyId(String companyId) {
        return userRepository.findByCompanyId(companyId);
    }
}
