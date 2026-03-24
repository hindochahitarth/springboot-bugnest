package org.miniproject.bugnest.service;

import org.miniproject.bugnest.dto.NotificationResponse;
import org.miniproject.bugnest.model.Notification;
import org.miniproject.bugnest.model.User;
import org.miniproject.bugnest.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationResponse> getNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long id, User user) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void create(User target, String type, String message, String link) {
        if (target == null) return;
        Notification n = new Notification();
        n.setUser(target);
        n.setType(type);
        n.setMessage(message);
        n.setLink(link);
        n.setRead(false);
        notificationRepository.save(n);
    }

    private NotificationResponse map(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

