package com.tansong.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;


@Data
@Setter
@Getter
@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long sellerId;
    private Long buyerId;
    private Long itemId;
    private LocalDateTime createdAt = LocalDateTime.now();
    

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.PENDING;

}

