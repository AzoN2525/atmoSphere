package com.atmosphere.api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.model.entity.TrafficData;

/**
 * Repositório para dados de tráfego.
 */
@Repository
public interface TrafficDataRepository extends JpaRepository<TrafficData, Long> {

    List<TrafficData> findByAreaId(Long areaId);

    List<TrafficData> findByAreaIdAndTimestampBetween(
        Long areaId,
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    List<TrafficData> findByTimestampGreaterThanEqualAndTimestampLessThan(
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    Optional<TrafficData> findTopByAreaIdOrderByTimestampDesc(Long areaId);

    List<TrafficData> findByAreaIdOrderByTimestampDesc(Long areaId, Pageable pageable);

    List<TrafficData> findBySensorIdOrderByTimestampDesc(Long sensorId, Pageable pageable);
}
