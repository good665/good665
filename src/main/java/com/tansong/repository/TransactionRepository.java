package com.tansong.repository;

import com.tansong.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // 추가적인 쿼리 메소드 정의 가능
}