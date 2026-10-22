package com.atmosphere.api.repository;

import com.atmosphere.api.model.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Long> {
    
    /**
     * Encontra uma área pelo nome
     */
    Optional<Area> findByName(String name);

    List<Area> findAllByOrderByNameAsc();
}