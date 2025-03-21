package com.tansong.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tansong.entity.Notice;
import com.tansong.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    public List<Notice> getList() {
        return noticeRepository.findAll();
    }

    public Optional<Notice> getNotices(long id) {
        return noticeRepository.findById(id);
        
    }

    public Notice createNotice(Notice notice) {
        return noticeRepository.save(notice);
    }

    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }

    @Transactional //➡ @Transactional이 없으면 데이터가 롤백되어 MySQL에 저장되지 않을 수 있습니다.
    public void create(String subject, String content) {
        Notice notice = Notice.builder()
                        .subject(subject)
                        .content(content)
                        .build();

        this.noticeRepository.save(notice);
    }





}
