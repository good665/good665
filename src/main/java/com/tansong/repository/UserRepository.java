package com.tansong.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tansong.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String name); // 사용자명으로 조회
    //Optional<User> findByEmail(String email); // 이메일로 조회
    
}