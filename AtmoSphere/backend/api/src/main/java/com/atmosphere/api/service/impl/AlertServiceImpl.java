package com.atmosphere.api.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atmosphere.api.enums.AlertSeverity;
import com.atmosphere.api.enums.AlertStatus;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.exception.ResourceNotFoundException;
import com.atmosphere.api.model.dto.AlertDTO;
import com.atmosphere.api.model.dto.AlertThresholdDTO;
import com.atmosphere.api.model.entity.Alert;
import com.atmosphere.api.model.entity.AlertThreshold;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.Area;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.repository.AlertRepository;
import com.atmosphere.api.repository.AlertThresholdRepository;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.service.AlertService;
import com.atmosphere.api.messaging.SseService;
import com.atmosphere.api.model.dto.AlertDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    // Default thresholds used when no DB entry exists for an area
    private static final double DEFAULT_AIR_QUALITY_THRESHOLD = 75.0;  // European AQI (1-100, higher = worse)
    private static final double DEFAULT_NOISE_THRESHOLD        = 65.0;  // Leq in dB
    private static final double DEFAULT_TRAFFIC_THRESHOLD      = 40.0;  // Lane occupancy %

    private final AlertRepository alertRepository;
    private final AlertThresholdRepository thresholdRepository;
    private final AreaRepository areaRepository;
    private final SseService sseService;

    // -------------------------------------------------------------------------
    // Alert detection
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public void checkAndCreateAirQualityAlert(AirQualityData data) {
        if (data.getEuropeanAqi() == null) return;

        double value = data.getEuropeanAqi().doubleValue();
        double threshold = resolveThreshold(data.getArea().getId(), IndicatorType.AIR_QUALITY, DEFAULT_AIR_QUALITY_THRESHOLD);

        if (value > threshold) {
            Alert alert = Alert.builder()
                    .area(data.getArea())
                    .indicatorType(IndicatorType.AIR_QUALITY)
                    .measuredValue(value)
                    .thresholdValue(threshold)
                    .unit("AQI")
                    .severity(computeSeverity(value, threshold))
                    .status(AlertStatus.ACTIVE)
                    .triggeredAt(data.getTimestamp())
                    .build();
            alertRepository.save(alert);
            try {
                sseService.sendMessage("alert.created", AlertDTO.fromEntity(alert));
            } catch (Exception ex) {
                log.warn("Falha ao enviar SSE de alerta criado: {}", ex.getMessage());
            }
            //log.info("Alerta de qualidade do ar criado para área {}: AQI={} (limite={})", data.getArea().getId(), value, threshold);
        }
    }

    @Override
    @Transactional
    public void checkAndCreateNoiseAlert(NoiseData data) {
        if (data.getLeq() == null) return;

        double value = data.getLeq();
        double threshold = resolveThreshold(data.getArea().getId(), IndicatorType.NOISE, DEFAULT_NOISE_THRESHOLD);

        if (value > threshold) {
            Alert alert = Alert.builder()
                    .area(data.getArea())
                    .indicatorType(IndicatorType.NOISE)
                    .measuredValue(value)
                    .thresholdValue(threshold)
                    .unit("dB")
                    .severity(computeSeverity(value, threshold))
                    .status(AlertStatus.ACTIVE)
                    .triggeredAt(data.getTimestamp())
                    .build();
            alertRepository.save(alert);
            try {
                sseService.sendMessage("alert.created", AlertDTO.fromEntity(alert));
            } catch (Exception ex) {
                log.warn("Falha ao enviar SSE de alerta criado: {}", ex.getMessage());
            }
            //log.info("Alerta de ruído criado para área {}: Leq={}dB (limite={}dB)", data.getArea().getId(), value, threshold);
        }
    }

    @Override
    @Transactional
    public void checkAndCreateTrafficAlert(TrafficData data) {
        if (data.getLaneOccupancyPct() == null) return;

        double value = data.getLaneOccupancyPct();
        double threshold = resolveThreshold(data.getArea().getId(), IndicatorType.TRAFFIC, DEFAULT_TRAFFIC_THRESHOLD);

        if (value > threshold) {
            Alert alert = Alert.builder()
                    .area(data.getArea())
                    .indicatorType(IndicatorType.TRAFFIC)
                    .measuredValue(value)
                    .thresholdValue(threshold)
                    .unit("%")
                    .severity(computeSeverity(value, threshold))
                    .status(AlertStatus.ACTIVE)
                    .triggeredAt(data.getTimestamp())
                    .build();
            alertRepository.save(alert);
            try {
                sseService.sendMessage("alert.created", AlertDTO.fromEntity(alert));
            } catch (Exception ex) {
                log.warn("Falha ao enviar SSE de alerta criado: {}", ex.getMessage());
            }
            //log.info("Alerta de tráfego criado para área {}: ocupação={}% (limite={}%)", data.getArea().getId(), value, threshold);
        }
    }

    // -------------------------------------------------------------------------
    // REST queries
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<AlertDTO> getAlerts(Long areaId, IndicatorType indicatorType, LocalDateTime from, LocalDateTime to) {
        LocalDateTime effectiveFrom = from != null ? from : LocalDateTime.now().minusDays(7);
        LocalDateTime effectiveTo   = to   != null ? to   : LocalDateTime.now();

        List<Alert> alerts;
        if (areaId != null && indicatorType != null) {
            alerts = alertRepository.findByAreaIdAndIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(
                    areaId, indicatorType, effectiveFrom, effectiveTo);
        } else if (areaId != null) {
            alerts = alertRepository.findByAreaIdAndTriggeredAtBetweenOrderByTriggeredAtDesc(
                    areaId, effectiveFrom, effectiveTo);
        } else if (indicatorType != null) {
            alerts = alertRepository.findByIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(
                    indicatorType, effectiveFrom, effectiveTo);
        } else {
            alerts = alertRepository.findByTriggeredAtBetweenOrderByTriggeredAtDesc(effectiveFrom, effectiveTo);
        }

        return alerts.stream().map(AlertDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AlertDTO getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", id));
        return AlertDTO.fromEntity(alert);
    }

    // -------------------------------------------------------------------------
    // Threshold management
    // -------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<AlertThresholdDTO> getAllThresholds() {
        return thresholdRepository.findAll().stream()
                .map(AlertThresholdDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertThresholdDTO> getThresholdsByArea(Long areaId) {
        return thresholdRepository.findByAreaId(areaId).stream()
                .map(AlertThresholdDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public AlertThresholdDTO saveThreshold(AlertThresholdDTO dto) {
        Area area = areaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Area", dto.getAreaId()));

        AlertThreshold threshold = thresholdRepository
                .findByAreaIdAndIndicatorType(dto.getAreaId(), dto.getIndicatorType())
                .orElse(AlertThreshold.builder().area(area).indicatorType(dto.getIndicatorType()).build());

        threshold.setThresholdValue(dto.getThresholdValue());
        threshold.setUnit(resolveUnit(dto.getIndicatorType(), dto.getUnit()));

        AlertThreshold saved = thresholdRepository.save(threshold);
       // log.info("Threshold {} atualizado para área {}: {}", dto.getIndicatorType(), dto.getAreaId(), dto.getThresholdValue());
        return AlertThresholdDTO.fromEntity(saved);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private double resolveThreshold(Long areaId, IndicatorType type, double defaultValue) {
        return thresholdRepository.findByAreaIdAndIndicatorType(areaId, type)
                .map(AlertThreshold::getThresholdValue)
                .orElse(defaultValue);
    }

    private AlertSeverity computeSeverity(double value, double threshold) {
        double ratio = value / threshold;
        if (ratio >= 1.5) return AlertSeverity.HIGH;
        if (ratio >= 1.2) return AlertSeverity.MEDIUM;
        return AlertSeverity.LOW;
    }

    private String resolveUnit(IndicatorType type, String provided) {
        if (provided != null && !provided.isBlank()) return provided;
        return switch (type) {
            case AIR_QUALITY -> "AQI";
            case NOISE       -> "dB";
            case TRAFFIC     -> "%";
        };
    }
}
