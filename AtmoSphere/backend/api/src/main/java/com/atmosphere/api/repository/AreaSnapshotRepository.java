package com.atmosphere.api.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.model.entity.AreaSnapshot;

@Repository
public interface AreaSnapshotRepository extends JpaRepository<AreaSnapshot, Long> {

    Optional<AreaSnapshot> findByAreaId(Long areaId);

    List<AreaSnapshot> findAllByOrderByUpdatedAtDesc();
}