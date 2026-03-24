package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.BugAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugAttachmentRepository extends JpaRepository<BugAttachment, Long> {
    List<BugAttachment> findByBugOrderByCreatedAtAsc(Bug bug);
}

