package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.model.User;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<Bug, Long>, JpaSpecificationExecutor<Bug> {
    List<Bug> findByProjectOrderByUpdatedAtDesc(Project project);
    List<Bug> findByProjectInOrderByUpdatedAtDesc(List<Project> projects);
    List<Bug> findByAssigneeOrderByUpdatedAtDesc(User assignee);
    long countByProject(Project project);
    long countByStatusNot(org.miniproject.bugnest.model.BugStatus status);
    long countByAssigneeIsNotNull();
    long countByStatus(org.miniproject.bugnest.model.BugStatus status);
}
