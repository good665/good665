package com.tansong.batch;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class ProfileChecker {

    private final Environment environment;

    public ProfileChecker(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void checkActiveProfiles() {
        System.out.println("🔹 Active Profiles: " + String.join(", ", environment.getActiveProfiles()));
    }
}
