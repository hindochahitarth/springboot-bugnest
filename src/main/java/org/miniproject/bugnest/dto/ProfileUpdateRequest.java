package org.miniproject.bugnest.dto;

public class ProfileUpdateRequest {
    private String fullName;
    private String email;
    // Add other fields if needed, e.g., avatarUrl, timezone

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
