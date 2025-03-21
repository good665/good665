package com.tansong.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.global.RsDate.RsData;
import com.tansong.entity.Notice;
import com.tansong.repository.NoticeRepository;
import com.tansong.service.NoticeService;
import com.tansong.service.UserService;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;


@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

    private final NoticeService noticeService;
    
    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @AllArgsConstructor
    @Getter
    public static class NoticesResponse {
        private final List<Notice> notices;
    }


    @GetMapping("")
    public RsData<NoticesResponse> getArticles(){
        List<Notice> notice = this.noticeService.getList();
        return RsData.of("S-1", "성공", new NoticesResponse(notice));
    }

    //단건의 notice
    @AllArgsConstructor
    @Getter
    public static class NoticeResponse{
        private final Notice notices;
    }

    @GetMapping("/{id}")
    public RsData<NoticeResponse> getMethodName(@PathVariable("id") long id) {
        return noticeService.getNotices(id).map(notice -> RsData.of(
            "S-1", 
            "성공", 
            new NoticeResponse(notice)
            )).orElseGet(() -> RsData.of(
                "F-1", 
                "%d 번째 게시물은 존재 하지않습니다.".formatted(id),
                null
                ));
    }
    @PostMapping
    public Notice createNotice(@RequestBody Notice notice) {
        return noticeService.createNotice(notice);
    }

    @DeleteMapping("/{id}")
    public void deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
    }
    

    // public NoticeController(NoticeRepository noticeRepository) {
    //     this.noticeRepository = noticeRepository;
    // }

    // @GetMapping
    // public List<Notice> getNotices() {
    //     return noticeRepository.findAll();
    // }

    // @PostMapping
    // public Notice createNotice(@RequestBody Notice notice) {
    //     return noticeRepository.save(notice);
    // }

    // @PutMapping("/{id}")
    // public ResponseEntity<Notice> updateNotice(@PathVariable Long id, @RequestBody Notice updatedNotice) {
    //     return noticeRepository.findById(id)
    //         .map(notice -> {
    //             notice.setTitle(updatedNotice.getTitle());
    //             notice.setContent(updatedNotice.getContent());
    //             return ResponseEntity.ok(noticeRepository.save(notice));
    //         })
    //         .orElse(ResponseEntity.notFound().build());
    // }

    // @DeleteMapping("/{id}")
    // public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
    //     if (noticeRepository.existsById(id)) {
    //         noticeRepository.deleteById(id);
    //         return ResponseEntity.noContent().build();
    //     }
    //     return ResponseEntity.notFound().build();
    // }

}
