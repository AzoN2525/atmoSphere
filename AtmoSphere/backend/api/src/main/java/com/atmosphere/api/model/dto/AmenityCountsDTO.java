package com.atmosphere.api.model.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AmenityCountsDTO {

    private Integer schools;
    private Integer museums;
    private Integer hospitals;
    private Integer parks;
}
