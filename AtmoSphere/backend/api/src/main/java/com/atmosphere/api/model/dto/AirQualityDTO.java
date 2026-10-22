package com.atmosphere.api.model.dto;

import com.atmosphere.api.model.entity.AirQualityData;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para dados de qualidade do ar
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AirQualityDTO {

    private Long id;
    private Long areaId;
    private Long sensorId;
    private LocalDateTime timestamp;

    private Integer europeanAqi;
    private Double pm10;
    private Double pm25;
    private Double co;
    private Double no2;
    private Double so2;
    private Double o3;

    public static AirQualityDTO fromEntity(AirQualityData entity) {
        return AirQualityDTO.builder()
                .id(entity.getId())
                .areaId(entity.getArea().getId())
                .sensorId(entity.getSensor().getId())
                .timestamp(entity.getTimestamp())
                .europeanAqi(entity.getEuropeanAqi())
                .pm10(entity.getPm10())
                .pm25(entity.getPm25())
                .co(entity.getCo())
                .no2(entity.getNo2())
                .so2(entity.getSo2())
                .o3(entity.getO3())
                .build();
    }


}
