package com.atmosphere.api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.model.entity.AirQualityData;

/**
 * Repositório para dados de qualidade do ar.
 */
@Repository
public interface AirQualityDataRepository extends JpaRepository<AirQualityData, Long> {

    List<AirQualityData> findByAreaId(Long areaId);

    List<AirQualityData> findByAreaIdAndTimestampBetween(
        Long areaId,
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    List<AirQualityData> findByTimestampGreaterThanEqualAndTimestampLessThan(
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    Optional<AirQualityData> findTopByAreaIdOrderByTimestampDesc(Long areaId);

    List<AirQualityData> findByAreaIdOrderByTimestampDesc(Long areaId, Pageable pageable);

    List<AirQualityData> findBySensorIdOrderByTimestampDesc(Long sensorId, Pageable pageable);
}
