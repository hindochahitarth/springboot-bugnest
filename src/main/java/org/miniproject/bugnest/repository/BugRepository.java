package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByProject(Project project);
    List<Bug> findByProjectIn(List<Project> projects);
    long countByProject(Project project);
    long countByStatusNot(org.miniproject.bugnest.model.BugStatus status);
    long countByAssigneeIsNotNull();
    long countByStatus(org.miniproject.bugnest.model.BugStatus status);
}
