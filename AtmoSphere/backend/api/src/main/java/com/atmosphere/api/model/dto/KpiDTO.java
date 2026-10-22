package com.atmosphere.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para KPIs de sustentabilidade.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiDTO {

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Média do índice de qualidade do ar por área
    private List<AreaAirQualityKpiDTO> averageAirQualityByArea;

    // Média da densidade de tráfego por área
    private List<AreaTrafficDensityKpiDTO> averageTrafficDensityByArea;

    // Média do nível de ruído por área
    private List<AreaNoiseLevelKpiDTO> averageNoiseLevelByArea;

    // Hotspots detectados
    private List<HotspotDTO> hotspotsDetected;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AreaAirQualityKpiDTO {
        private Long areaId;
        private String areaName;
        private Double averageAqi;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AreaTrafficDensityKpiDTO {
        private Long areaId;
        private String areaName;
        private Double averageDensity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AreaNoiseLevelKpiDTO {
        private Long areaId;
        private String areaName;
        private Double averageLeq;
    }
}