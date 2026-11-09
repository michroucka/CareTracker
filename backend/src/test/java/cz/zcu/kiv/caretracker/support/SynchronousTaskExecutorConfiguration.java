package cz.zcu.kiv.caretracker.support;

import org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;

/**
 * Runs background work (such as the password reset e-mail) on the calling thread, so a test sees its result
 * as soon as the request returns. The application's own executor backs off when this bean exists.
 */
@TestConfiguration(proxyBeanMethods = false)
public class SynchronousTaskExecutorConfiguration {

    @Bean(TaskExecutionAutoConfiguration.APPLICATION_TASK_EXECUTOR_BEAN_NAME)
    TaskExecutor applicationTaskExecutor() {
        return new SyncTaskExecutor();
    }
}
