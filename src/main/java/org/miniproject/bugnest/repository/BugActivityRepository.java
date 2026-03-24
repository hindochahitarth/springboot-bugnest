package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.BugActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugActivityRepository extends JpaRepository<BugActivity, Long> {
    List<BugActivity> findByBugOrderByCreatedAtDesc(Bug bug);
}

