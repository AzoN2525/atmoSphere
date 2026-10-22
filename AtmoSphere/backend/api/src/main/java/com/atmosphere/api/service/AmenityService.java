package com.atmosphere.api.service;

import com.atmosphere.api.model.dto.AmenityCountsDTO;

public interface AmenityService {

    AmenityCountsDTO getAmenityCounts(Double latitude, Double longitude);
}
