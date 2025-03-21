package com.tansong.service;

import com.tansong.entity.Items;
import com.tansong.entity.Transaction;
import com.tansong.entity.TransactionRequest;
import com.tansong.entity.TransactionStatus;
import com.tansong.entity.User;
import com.tansong.repository.ItemRepository;
import com.tansong.repository.TransactionRepository;
import com.tansong.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class TransactionService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final TransactionRepository transactionRepository;
    
    public TransactionService(UserRepository userRepository, ItemRepository itemRepository,
        TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public boolean processTransaction(TransactionRequest request) {
        Optional<User> sellerOpt = userRepository.findById(request.getSellerId());
        Optional<User> buyerOpt = userRepository.findById(request.getBuyerId());
        Optional<Items> itemOpt = itemRepository.findById(request.getItemId());

        if (sellerOpt.isEmpty() || buyerOpt.isEmpty() || itemOpt.isEmpty()) {
            return false; // 거래 실패
        }

        User seller = sellerOpt.get();
        User buyer = buyerOpt.get();
        Items items = itemOpt.get();

        if (buyer.getBalance().compareTo(items.getPrice()) < 0) {
            return false; // 잔액 부족
        }
        
        log.info("거래 성공: {} -> {} (아이템 ID: {})", buyer.getId(), seller.getId(), items.getId());
        
        // 거래 처리 (잔액 변경)
        buyer.setBalance(buyer.getBalance().subtract(items.getPrice()));
        seller.setBalance(seller.getBalance().add(items.getPrice()));

        // 거래 내역 저장
        Transaction transaction = new Transaction();
        transaction.setSellerId(seller.getId());
        transaction.setBuyerId(buyer.getId());
        transaction.setItemId(items.getId());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transactionRepository.save(transaction);

        // 잔액 저장
        userRepository.save(buyer);
        userRepository.save(seller);

        return true;
    }
    // @Autowired
    // public TransactionService(TransactionRepository transactionRepository) {
    //     this.transactionRepository = transactionRepository;
    // }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public Transaction saveTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    //✅ 3️⃣ 거래 실패 시 로그 기록 (로깅 추가)

}