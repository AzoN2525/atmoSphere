package com.atmosphere.api.model.dto;

import com.atmosphere.api.model.entity.Area;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AreaDTO {

    private Long id;
    private String name;
    private String geometryGeoJson;
    private Double latitude;
    private Double longitude;

    public static AreaDTO fromEntity(Area area) {
        return AreaDTO.builder()
                .id(area.getId())
                .name(area.getName())
                .geometryGeoJson(area.getGeometryGeoJson())
                .latitude(area.getLatitude())
                .longitude(area.getLongitude())
                .build();
    }

}