package com.atmosphere.api.model.dto;

import com.atmosphere.api.enums.IndicatorStatus;
import com.atmosphere.api.model.entity.Area;
import com.atmosphere.api.model.entity.AreaSnapshot;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AreaSnapshotDTO {

    private Long areaId;
    private String areaName;
    private String geometryGeoJson;
    private Double latitude;
    private Double longitude;

    // Normalised 0-100 indices (higher = better quality)
    private Double airQualityIndex;
    private Double noiseIndex;
    private Double trafficIndex;
    private Double overallIndex;

    private IndicatorStatus airStatus;
    private IndicatorStatus noiseStatus;
    private IndicatorStatus trafficStatus;
    private IndicatorStatus overallStatus;

    private LocalDateTime updatedAt;

    public static AreaSnapshotDTO fromEntities(Area area, AreaSnapshot snapshot) {
        AreaSnapshotDTO.AreaSnapshotDTOBuilder builder = AreaSnapshotDTO.builder()
                .areaId(area.getId())
                .areaName(area.getName())
                .geometryGeoJson(area.getGeometryGeoJson())
                .latitude(area.getLatitude())
                .longitude(area.getLongitude());

        if (snapshot != null) {
            builder.airQualityIndex(snapshot.getAirQualityIndex())
                    .noiseIndex(snapshot.getNoiseIndex())
                    .trafficIndex(snapshot.getTrafficIndex())
                    .overallIndex(snapshot.getOverallIndex())
                    .airStatus(snapshot.getAirStatus())
                    .noiseStatus(snapshot.getNoiseStatus())
                    .trafficStatus(snapshot.getTrafficStatus())
                    .overallStatus(snapshot.getOverallStatus())
                    .updatedAt(snapshot.getUpdatedAt());
        }

        return builder.build();
    }
}
