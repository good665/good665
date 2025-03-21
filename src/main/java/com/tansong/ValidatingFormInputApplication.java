package com.tansong;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


@SpringBootApplication
@EntityScan(basePackages = "com.tansong.entity") // ✅ 엔티티 패키지 설정@EnableJpaRepositories(basePackages = "com.tansong.repository") // ✅ JPA Repository 등록
@ComponentScan(basePackages = "com.tansong")// ✅ 패키지 스캔 확인
@EnableJpaRepositories // (basePackages = "com.tansong.repository") // ✅ JPA Repository 등록
@EnableJpaAuditing //jpa를 사용하려면 필수로 넣어줘야한다
public class ValidatingFormInputApplication {

	public static void main(String[] args) throws Exception {
		SpringApplication.run(ValidatingFormInputApplication.class, args);
	}

}