package com.atmosphere.api.model.dto;

import java.time.LocalDateTime;

import com.atmosphere.api.enums.AlertSeverity;
import com.atmosphere.api.enums.AlertStatus;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.entity.Alert;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {

    private Long id;
    private Long areaId;
    private String areaName;
    private IndicatorType indicatorType;
    private Double measuredValue;
    private Double thresholdValue;
    private String unit;
    private AlertSeverity severity;
    private AlertStatus status;
    private LocalDateTime triggeredAt;
    private LocalDateTime resolvedAt;

    public static AlertDTO fromEntity(Alert alert) {
        return AlertDTO.builder()
                .id(alert.getId())
                .areaId(alert.getArea().getId())
                .areaName(alert.getArea().getName())
                .indicatorType(alert.getIndicatorType())
                .measuredValue(alert.getMeasuredValue())
                .thresholdValue(alert.getThresholdValue())
                .unit(alert.getUnit())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
                .triggeredAt(alert.getTriggeredAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
