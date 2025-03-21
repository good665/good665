package com.tansong.controller;

import com.tansong.entity.Transaction;
import com.tansong.entity.TransactionRequest;
import com.tansong.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        return transactionService.saveTransaction(transaction);
    }

    @PostMapping("/request")
    public ResponseEntity<String> requestTransaction(@RequestBody TransactionRequest request) {
        boolean success = transactionService.processTransaction(request);
        return success ? ResponseEntity.ok("거래 완료") : ResponseEntity.badRequest().body("거래 실패");
    }

}
