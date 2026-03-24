package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.BugComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugCommentRepository extends JpaRepository<BugComment, Long> {
    List<BugComment> findByBugOrderByCreatedAtAsc(Bug bug);
}

