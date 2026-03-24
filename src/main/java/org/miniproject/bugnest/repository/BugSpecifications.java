package org.miniproject.bugnest.repository;

import org.miniproject.bugnest.model.Bug;
import org.miniproject.bugnest.model.BugSeverity;
import org.miniproject.bugnest.model.BugStatus;
import org.miniproject.bugnest.model.Project;
import org.miniproject.bugnest.model.User;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.List;

public final class BugSpecifications {

    private BugSpecifications() {}

    public static Specification<Bug> projectEquals(Project project) {
        return (root, query, cb) -> cb.equal(root.get("project"), project);
    }

    public static Specification<Bug> projectIn(List<Project> projects) {
        return (root, query, cb) -> root.get("project").in(projects);
    }

    public static Specification<Bug> assigneeEquals(User user) {
        return (root, query, cb) -> cb.equal(root.get("assignee"), user);
    }

    public static Specification<Bug> severityEquals(BugSeverity severity) {
        return (root, query, cb) -> cb.equal(root.get("severity"), severity);
    }

    public static Specification<Bug> overdueOnly(LocalDate today) {
        return (root, query, cb) -> cb.and(
                cb.isNotNull(root.get("dueDate")),
                cb.lessThan(root.get("dueDate"), today),
                cb.notEqual(root.get("status"), BugStatus.CLOSED)
        );
    }

    public static Specification<Bug> tagEquals(String tagLower) {
        return (root, query, cb) -> {
            if (tagLower == null || tagLower.isBlank()) {
                return cb.conjunction();
            }

            // tags stored as "a,b,c" lowercased
            var tags = cb.lower(root.get("tags"));
            String t = tagLower.trim().toLowerCase();
            return cb.or(
                    cb.equal(tags, t),
                    cb.like(tags, t + ",%"),
                    cb.like(tags, "%," + t),
                    cb.like(tags, "%," + t + ",%")
            );
        };
    }
}

