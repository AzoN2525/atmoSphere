package com.atmosphere.api.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.atmosphere.api.model.entity.Sensor;
import com.atmosphere.api.enums.SensorStatus;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {

    Optional<Sensor> findByExternalSensorId(String externalSensorId);

    List<Sensor> findByAreaId(Long areaId);

    List<Sensor> findByStatus(SensorStatus status);
}