package com.tansong.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tansong.entity.Notice;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
}
