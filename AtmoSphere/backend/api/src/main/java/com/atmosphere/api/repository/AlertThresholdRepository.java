package com.atmosphere.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.entity.AlertThreshold;

@Repository
public interface AlertThresholdRepository extends JpaRepository<AlertThreshold, Long> {

    Optional<AlertThreshold> findByAreaIdAndIndicatorType(Long areaId, IndicatorType indicatorType);

    List<AlertThreshold> findByAreaId(Long areaId);
}
