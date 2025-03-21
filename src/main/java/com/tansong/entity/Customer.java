package com.tansong.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Customer {
    public Customer(long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    
    // Getter, Setter
}