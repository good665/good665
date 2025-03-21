package com.tansong.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tansong.entity.Transaction;
import com.tansong.repository.TransactionRepository;

@RequestMapping("/admin")
@RestController
public class AdminController {
    private final TransactionRepository transactionRepository;

    public AdminController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
    
}
