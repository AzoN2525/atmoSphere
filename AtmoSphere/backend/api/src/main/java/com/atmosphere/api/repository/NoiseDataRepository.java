package com.atmosphere.api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.model.entity.NoiseData;

/**
 * Repositório para dados de ruído.
 */
@Repository
public interface NoiseDataRepository extends JpaRepository<NoiseData, Long> {

    List<NoiseData> findByAreaId(Long areaId);

    List<NoiseData> findByAreaIdAndTimestampBetween(
        Long areaId,
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    List<NoiseData> findByTimestampGreaterThanEqualAndTimestampLessThan(
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    Optional<NoiseData> findTopByAreaIdOrderByTimestampDesc(Long areaId);

    List<NoiseData> findByAreaIdOrderByTimestampDesc(Long areaId, Pageable pageable);

    List<NoiseData> findBySensorIdOrderByTimestampDesc(Long sensorId, Pageable pageable);
}
