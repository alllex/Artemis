package de.tum.in.www1.artemis.service;

import java.util.List;

import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.tum.in.www1.artemis.domain.*;
import de.tum.in.www1.artemis.repository.NotificationRepository;

@Service
@Transactional
public class NotificationService {

    private final SimpMessageSendingOperations messagingTemplate;

    private NotificationRepository notificationRepository;

    private SingleUserNotificationService singleUserNotificationService;

    private GroupNotificationService groupNotificationService;

    public NotificationService(SimpMessageSendingOperations messagingTemplate, NotificationRepository notificationRepository,
            SingleUserNotificationService singleUserNotificationService, GroupNotificationService groupNotificationService) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
        this.singleUserNotificationService = singleUserNotificationService;
        this.groupNotificationService = groupNotificationService;
    }

    public void sendNotification(User user, Course course, String notificationType, String targetGroup, Boolean isUserNotification, Boolean isGroupNotification) {

        // TODO convert targetObject

        if (isUserNotification) {
            messagingTemplate.convertAndSend("/topic/user/" + user.getId() + "/singleUser", targetGroup);
        }
        else if (isGroupNotification) {
            messagingTemplate.convertAndSend("/topic/course/" + course.getId() + "/" + targetGroup + "/newResults", targetGroup);
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> findAllExceptSystem(User currentUser) {
        List<Notification> groupNotifications = groupNotificationService.findAllNewNotificationsForCurrentUser(currentUser);
        List<Notification> userNotifications = singleUserNotificationService.findAllNewNotificationsForCurrentUser();
        groupNotifications.addAll(userNotifications);
        return groupNotifications;
    }

}