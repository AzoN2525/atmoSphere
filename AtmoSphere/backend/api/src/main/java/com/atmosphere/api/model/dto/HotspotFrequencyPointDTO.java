package com.atmosphere.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para um ponto de frequência de hotspots.
 * Representa a contagem de diferentes tipos de alertas num período de tempo específico.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotspotFrequencyPointDTO {

    private LocalDateTime timestamp;
    private Integer hotspotCount;
    private Integer airQualityCount;
    private Integer noiseCount;
    private Integer trafficCount;
}
