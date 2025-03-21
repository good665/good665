package com.global.jpa;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.tansong.service.NoticeService;

@Configuration
@Profile({"dev", "test"})
public class Notprod {

    @Bean  //안되는 이유가 뭘까...
    CommandLineRunner initDate(NoticeService noticeService){
        return args -> {
            System.out.println("✅ CommandLineRunner 실행 중...");
            noticeService.create("제목1","내용1");
            noticeService.create("제목2","내용2");
            noticeService.create("제목3","내용3");
            noticeService.create("제목4","내용4");
            noticeService.create("제목5","내용5");
            System.out.println("✅ 데이터 삽입 완료");
        };
    }

}
