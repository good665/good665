package com.tansong.batch;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // CSRF 보호 비활성화 (개발용)(POST 요청 허용)
            //.securityMatcher("/api/**") // api 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/transactions/request").permitAll() // 이 API는 인증 없이 허용
                .requestMatchers("/", "/home", "/login").permitAll() // 허용할 경로 설정
                .requestMatchers("/api/*/articles").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN") // 특정 경로는 ADMIN만 접근 가능
                .requestMatchers("/api/*/notices").permitAll()
                .requestMatchers("/api/*/notices/*").permitAll()
                //.requestMatchers("/**").permitAll() //개발연습동안만 허용
                .anyRequest().authenticated()
                )
            .formLogin(login -> login.disable()) // 로그인 폼 비활성화
            .httpBasic(basic -> basic.disable()); // 기본 인증 비활성화 (Bearer 토큰을 사용할 경우)

        return http.build();
    }
    
}
