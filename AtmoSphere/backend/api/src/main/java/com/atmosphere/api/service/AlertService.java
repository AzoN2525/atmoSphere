package com.atmosphere.api.service;

import java.time.LocalDateTime;
import java.util.List;

import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.dto.AlertDTO;
import com.atmosphere.api.model.dto.AlertThresholdDTO;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;

public interface AlertService {

    void checkAndCreateAirQualityAlert(AirQualityData data);

    void checkAndCreateNoiseAlert(NoiseData data);

    void checkAndCreateTrafficAlert(TrafficData data);

    List<AlertDTO> getAlerts(Long areaId, IndicatorType indicatorType, LocalDateTime from, LocalDateTime to);

    AlertDTO getAlertById(Long id);

    List<AlertThresholdDTO> getAllThresholds();

    List<AlertThresholdDTO> getThresholdsByArea(Long areaId);

    AlertThresholdDTO saveThreshold(AlertThresholdDTO dto);
}
