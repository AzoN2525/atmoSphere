package com.atmosphere.api.model.dto;

import com.atmosphere.api.model.entity.NoiseData;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para dados de ruído
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoiseDTO {

    private Long id;
    private Long areaId;
    private Long sensorId;
    private LocalDateTime timestamp;

    private Double currentValue;
    private Double leq;
    private Double lmax;
    private Double lmin;
    private Double l10;
    private Double l90;

    public static NoiseDTO fromEntity(NoiseData entity) {
        return NoiseDTO.builder()
                .id(entity.getId())
                .areaId(entity.getArea().getId())
                .sensorId(entity.getSensor().getId())
                .timestamp(entity.getTimestamp())
                .currentValue(entity.getCurrentValue())
                .leq(entity.getLeq())
                .lmax(entity.getLmax())
                .lmin(entity.getLmin())
                .l10(entity.getL10())
                .l90(entity.getL90())
                .build();
    }

    public NoiseData toEntity() {
        NoiseData entity = new NoiseData();
        entity.setId(this.id);
        // area and sensor need to be set separately
        entity.setTimestamp(this.timestamp);
        entity.setCurrentValue(this.currentValue);
        entity.setLeq(this.leq);
        entity.setLmax(this.lmax);
        entity.setLmin(this.lmin);
        entity.setL10(this.l10);
        entity.setL90(this.l90);
        return entity;
    }
}
