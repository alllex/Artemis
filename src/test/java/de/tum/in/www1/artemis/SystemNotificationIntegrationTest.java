package de.tum.in.www1.artemis;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZonedDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import de.tum.in.www1.artemis.domain.SystemNotification;
import de.tum.in.www1.artemis.repository.SystemNotificationRepository;
import de.tum.in.www1.artemis.util.DatabaseUtilService;
import de.tum.in.www1.artemis.util.ModelFactory;
import de.tum.in.www1.artemis.util.RequestUtilService;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase
@ActiveProfiles("artemis")
public class SystemNotificationIntegrationTest {

    @Autowired
    DatabaseUtilService database;

    @Autowired
    RequestUtilService request;

    @Autowired
    SystemNotificationRepository systemNotificationRepo;

    @AfterEach
    public void resetDatabase() {
        database.resetDatabase();
    }

    @Test
    public void getActiveSystemNotification() throws Exception {
        prepareGetActiveSystemNotification();
        // Do the actual request that is tested here.
        SystemNotification systemNotification = request.get("/api/system-notifications/active-notification", HttpStatus.OK, SystemNotification.class);

        // The returned notification must be an active notification.
        assertThat(systemNotification.getExpireDate()).as("Returned notification has not expired yet.").isAfterOrEqualTo(ZonedDateTime.now());
        assertThat(systemNotification.getNotificationDate()).as("Returned notification is active.").isBeforeOrEqualTo(ZonedDateTime.now());
    }

    private void prepareGetActiveSystemNotification() {
        // Generate a system notification that has expired.
        SystemNotification systemNotificationExpired = ModelFactory.generateSystemNotification((ZonedDateTime.now().minusDays(5)), (ZonedDateTime.now().minusDays(8)));
        systemNotificationRepo.save(systemNotificationExpired);

        // Generate a system notification whose notification date is in the future.
        SystemNotification systemNotificationFuture = ModelFactory.generateSystemNotification((ZonedDateTime.now().plusDays(8)), (ZonedDateTime.now().plusDays(5)));
        systemNotificationRepo.save(systemNotificationFuture);

        // Generate an active system notification
        SystemNotification systemNotificationActive = ModelFactory.generateSystemNotification(ZonedDateTime.now().plusDays(3), ZonedDateTime.now().minusDays(3));
        systemNotificationRepo.save(systemNotificationActive);
    }
}
