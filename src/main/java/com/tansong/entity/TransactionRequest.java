package com.tansong.entity;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionRequest {
    private Long buyerId;
    private Long sellerId;
    private Long itemId;
}
