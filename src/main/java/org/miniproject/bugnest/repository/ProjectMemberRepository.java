package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.model.ProjectMember;
import org.miniproject.bugnest.model.ProjectMemberStatus;
import org.miniproject.bugnest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByUserAndStatus(User user, ProjectMemberStatus status);
    List<ProjectMember> findByProject(Project project);
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    
    // Check if user is an accepted member
    boolean existsByProjectAndUserAndStatus(Project project, User user, ProjectMemberStatus status);
}
