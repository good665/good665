package com.tansong.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.*;

@Entity
@Setter
@Getter
@Table(name = "users") // 테이블 이름 설정
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private BigDecimal balance;

    // 기본 생성자
    public User() {}

}

