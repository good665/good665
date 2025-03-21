package com.tansong.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tansong.entity.Items;
import com.tansong.repository.ItemRepository;

@Service
public class ItemService {
    
    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public List<Items> getAllItems() {
        return itemRepository.findAll();
    }
    
    // 다른 서비스 메소드들...
}