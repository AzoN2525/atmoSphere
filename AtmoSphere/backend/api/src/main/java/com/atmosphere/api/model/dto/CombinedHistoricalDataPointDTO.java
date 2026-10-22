package com.atmosphere.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombinedHistoricalDataPointDTO {
    private LocalDateTime timestamp;
    private Double airQualityIndex;
    private Double noiseLeq;
    private Double trafficDensityK;
}
