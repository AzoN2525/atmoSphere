package com.atmosphere.api.model.dto;

import java.time.LocalDateTime;

import com.atmosphere.api.enums.AlertSeverity;
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
public class HotspotIndicatorDTO {

    private IndicatorType indicatorType;
    private Double measuredValue;
    private Double thresholdValue;
    private Double exceedanceValue;
    private String unit;
    private AlertSeverity severity;
    private LocalDateTime triggeredAt;

    public static HotspotIndicatorDTO fromAlert(Alert alert) {
        Double exceedance = null;
        if (alert.getMeasuredValue() != null && alert.getThresholdValue() != null) {
            exceedance = alert.getMeasuredValue() - alert.getThresholdValue();
        }

        return HotspotIndicatorDTO.builder()
                .indicatorType(alert.getIndicatorType())
                .measuredValue(alert.getMeasuredValue())
                .thresholdValue(alert.getThresholdValue())
                .exceedanceValue(exceedance)
                .unit(alert.getUnit())
                .severity(alert.getSeverity())
                .triggeredAt(alert.getTriggeredAt())
                .build();
    }
}
