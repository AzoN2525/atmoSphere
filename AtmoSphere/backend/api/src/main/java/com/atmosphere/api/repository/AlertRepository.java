package com.atmosphere.api.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.enums.AlertStatus;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.entity.Alert;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByAreaIdOrderByTriggeredAtDesc(Long areaId);

    List<Alert> findByIndicatorTypeOrderByTriggeredAtDesc(IndicatorType indicatorType);

    List<Alert> findByStatusOrderByTriggeredAtDesc(AlertStatus status);

    List<Alert> findByAreaIdAndIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(
        Long areaId,
        IndicatorType indicatorType,
        LocalDateTime from,
        LocalDateTime to
    );

    List<Alert> findByAreaIdAndTriggeredAtBetweenOrderByTriggeredAtDesc(
        Long areaId,
        LocalDateTime from,
        LocalDateTime to
    );

    List<Alert> findByIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(
        IndicatorType indicatorType,
        LocalDateTime from,
        LocalDateTime to
    );

    List<Alert> findByTriggeredAtBetweenOrderByTriggeredAtDesc(
        LocalDateTime from,
        LocalDateTime to
    );
}
