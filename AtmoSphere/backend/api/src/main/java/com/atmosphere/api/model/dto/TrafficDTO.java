package com.atmosphere.api.model.dto;

import com.atmosphere.api.model.entity.TrafficData;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para dados de tráfego
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficDTO {

    private Long id;
    private Long areaId;
    private Long sensorId;
    private LocalDateTime timestamp;

    private Integer flowTotalCount;
    private Integer flowRateH;
    private Double densityK;
    private Double avgSpeed;
    private Double speedPercentile85;
    private Double laneOccupancyPct;
    private Double avgGapSeconds;
    private Integer passengerCarCount;
    private Integer heavyTruckCount;
    private Integer motorcycleCount;

    public static TrafficDTO fromEntity(TrafficData entity) {
        return TrafficDTO.builder()
                .id(entity.getId())
                .areaId(entity.getArea().getId())
                .sensorId(entity.getSensor().getId())
                .timestamp(entity.getTimestamp())
                .flowTotalCount(entity.getFlowTotalCount())
                .flowRateH(entity.getFlowRateH())
                .densityK(entity.getDensityK())
                .avgSpeed(entity.getAvgSpeed())
                .speedPercentile85(entity.getSpeedPercentile85())
                .laneOccupancyPct(entity.getLaneOccupancyPct())
                .avgGapSeconds(entity.getAvgGapSeconds())
                .passengerCarCount(entity.getPassengerCarCount())
                .heavyTruckCount(entity.getHeavyTruckCount())
                .motorcycleCount(entity.getMotorcycleCount())
                .build();
    }

    public TrafficData toEntity() {
        TrafficData entity = new TrafficData();
        entity.setId(this.id);
        // area and sensor need to be set separately
        entity.setTimestamp(this.timestamp);
        entity.setFlowTotalCount(this.flowTotalCount);
        entity.setFlowRateH(this.flowRateH);
        entity.setDensityK(this.densityK);
        entity.setAvgSpeed(this.avgSpeed);
        entity.setSpeedPercentile85(this.speedPercentile85);
        entity.setLaneOccupancyPct(this.laneOccupancyPct);
        entity.setAvgGapSeconds(this.avgGapSeconds);
        entity.setPassengerCarCount(this.passengerCarCount);
        entity.setHeavyTruckCount(this.heavyTruckCount);
        entity.setMotorcycleCount(this.motorcycleCount);
        return entity;
    }
}
