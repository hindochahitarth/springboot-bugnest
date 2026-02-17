package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreator(User creator);
    Optional<Project> findByProjectKey(String projectKey);
}
