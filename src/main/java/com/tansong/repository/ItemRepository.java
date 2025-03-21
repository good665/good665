package com.tansong.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tansong.entity.Items;

import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends JpaRepository<Items, Long> {
}
