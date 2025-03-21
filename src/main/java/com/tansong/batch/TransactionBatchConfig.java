package com.tansong.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.configuration.annotation.JobBuilderFactory;
import org.springframework.batch.core.configuration.annotation.StepBuilderFactory;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.batch.item.database.JdbcCursorItemReader;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.batch.item.database.builder.JdbcCursorItemReaderBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;


import com.tansong.entity.Items;
import com.tansong.entity.Transaction;
import com.tansong.entity.TransactionStatus;
import com.tansong.entity.User;
import com.tansong.repository.ItemRepository;
import com.tansong.repository.TransactionRepository;
import com.tansong.repository.UserRepository;
import org.springframework.batch.core.step.builder.StepBuilder;

import java.util.Optional;

@Configuration
@EnableBatchProcessing
public class TransactionBatchConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;

    public TransactionBatchConfig(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        this.jobRepository = jobRepository;
        this.transactionManager = transactionManager;
    }
    //Spring Batch 설정
    @Bean
    public Job transactionJob(Step transactionStep) {
        return new JobBuilder("transactionJob", jobRepository)
                .start(transactionStep)
                .build();
    }

    //4️⃣ 데이터 읽기 (ItemReader)
    @Bean
    public JdbcCursorItemReader<Transaction> transactionItemReader(DataSource dataSource) {
        JdbcCursorItemReader<Transaction> reader = new JdbcCursorItemReader<>();
        reader.setDataSource(dataSource);
        reader.setSql("SELECT id, seller_id, buyer_id, item_id, created_at FROM transaction");
        reader.setRowMapper(new BeanPropertyRowMapper<>(Transaction.class)); // 자동 매핑

        return reader;
    }

    //5️⃣ 거래 처리 (ItemProcessor)
    @Bean
    public ItemProcessor<Transaction, Transaction> transactionProcessor(UserRepository userRepository, ItemRepository itemRepository) {
        return transaction -> {
            Optional<User> sellerOpt = userRepository.findById(transaction.getSellerId());
            Optional<User> buyerOpt = userRepository.findById(transaction.getBuyerId());
            Optional<Items> itemOpt = itemRepository.findById(transaction.getItemId());

            if (sellerOpt.isEmpty() || buyerOpt.isEmpty() || itemOpt.isEmpty()) {
                transaction.setStatus(TransactionStatus.FAILED);
                return transaction;
            }

            User seller = sellerOpt.get();
            User buyer = buyerOpt.get();
            Items items = itemOpt.get();

            // 구매자의 잔액이 충분한지 확인
            if (buyer.getBalance().compareTo(items.getPrice()) >= 0) {
                buyer.setBalance(buyer.getBalance().subtract(items.getPrice()));
                seller.setBalance(seller.getBalance().add(items.getPrice()));
                transaction.setStatus(TransactionStatus.COMPLETED);
                userRepository.save(buyer);
                userRepository.save(seller);
            } else {
                transaction.setStatus(TransactionStatus.FAILED);
            }

            return transaction;
        };
    }

        //6️⃣ 결과 저장 (ItemWriter)
        @Bean
    public ItemWriter<Transaction> transactionWriter(TransactionRepository transactionRepository) {
        return transactions -> transactionRepository.saveAll(transactions);
    }

    //7️⃣ Step 설정
    @Bean
    public Step exampleStep() {
        return new StepBuilder("exampleStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    System.out.println("Executing step...");
                    return null;
                }, transactionManager)
                .build();
    }

}