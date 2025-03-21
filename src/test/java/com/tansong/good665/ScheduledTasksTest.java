// package com.tansong.good665;

// import static org.awaitility.Awaitility.await;
// import static org.mockito.Mockito.*;

// import java.time.Duration;

// import org.awaitility.Durations;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.boot.test.mock.mockito.MockBean;
// import org.springframework.boot.test.mock.mockito.SpyBean;
// import org.springframework.scheduling.annotation.EnableScheduling;

// import com.example.schedulingtasks.ScheduledTasks;

// @SpringBootTest
// public class ScheduledTasksTest {

// 	@SpyBean
// 	ScheduledTasks tasks;

// 	@Test
// 	public void reportCurrentTime() {
// 		await().atMost(Durations.TEN_SECONDS).untilAsserted(() -> {
// 			verify(tasks, atLeast(2)).reportCurrentTime();
// 		});
// 	}
// }
