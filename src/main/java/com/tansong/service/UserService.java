package com.tansong.service;

import com.tansong.entity.User;
import com.tansong.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;

    // ✅ 생성자 주입 방식 사용
    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public User saveUser(User name) {
        return userRepository.save(name);
    }

    public Optional<User> getUserById(Long name) {
        return userRepository.findById(name);
    }

    // public Optional<User> getUserByUsername(String username) {
    //     return userRepository.findByUsername(username);
    // }
}