package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByProject(Project project);
    long countByProject(Project project);
}
