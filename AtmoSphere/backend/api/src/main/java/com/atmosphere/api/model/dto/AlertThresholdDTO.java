package com.atmosphere.api.model.dto;

import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.entity.AlertThreshold;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertThresholdDTO {

    private Long id;

    @NotNull
    private Long areaId;

    private String areaName;

    @NotNull
    private IndicatorType indicatorType;

    @NotNull
    @Positive
    private Double thresholdValue;

    private String unit;

    public static AlertThresholdDTO fromEntity(AlertThreshold threshold) {
        return AlertThresholdDTO.builder()
                .id(threshold.getId())
                .areaId(threshold.getArea().getId())
                .areaName(threshold.getArea().getName())
                .indicatorType(threshold.getIndicatorType())
                .thresholdValue(threshold.getThresholdValue())
                .unit(threshold.getUnit())
                .build();
    }
}
