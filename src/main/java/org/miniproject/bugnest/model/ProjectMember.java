package org.miniproject.bugnest.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = true) // Nullable for unregistered users
    private User user;

    @Column(name = "invited_email")
    private String invitedEmail;

    @ManyToOne
    @JoinColumn(name = "invited_by")
    private User invitedBy;

    @Column(name = "invited_at")
    private LocalDateTime invitedAt;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectMemberStatus status;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "is_project_owner")
    private boolean isProjectOwner = false;

    @PrePersist
    protected void onCreate() {
        if (this.status == ProjectMemberStatus.ACCEPTED) {
            this.joinedAt = LocalDateTime.now();
        }
        if (this.invitedAt == null) {
            this.invitedAt = LocalDateTime.now();
        }
    }
}
