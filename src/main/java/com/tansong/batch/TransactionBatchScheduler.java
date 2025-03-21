package com.tansong.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TransactionBatchScheduler {
    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private Job transactionJob;

    @Scheduled(cron = "0 0/5 * * * ?") // 5분마다 실행
    public void runJob() throws Exception {
        JobParameters params = new JobParametersBuilder()
                .addLong("time", System.currentTimeMillis())
                .toJobParameters();
        jobLauncher.run(transactionJob, params);
    }
}