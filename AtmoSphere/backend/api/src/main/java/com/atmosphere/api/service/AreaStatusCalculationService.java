package com.atmosphere.api.service;

import com.atmosphere.api.enums.IndicatorStatus;
import com.atmosphere.api.model.entity.AreaSnapshot;
import java.util.Map;

public interface AreaStatusCalculationService {

    // --- Normalisation (raw sensor value → 0-100, higher = better) ---

    double normalizeAirQuality(Double rawAqi);

    double normalizeNoise(Double rawLeq);

    double normalizeTraffic(Double rawDensityK);

    // --- Composite index ---

    double calculateOverallIndex(Double airIndex, Double noiseIndex, Double trafficIndex);

    // --- Status from normalised 0-100 index ---

    IndicatorStatus statusFromIndex(Double index);

    IndicatorStatus calculateOverallStatus(AreaSnapshot snapshot);

    Map<String, IndicatorStatus> calculateIndividualStatuses(Long areaId);

    // Kept for backward compatibility — now receive normalised indices
    IndicatorStatus calculateAirQualityStatus(Double airIndex);

    IndicatorStatus calculateNoiseStatus(Double noiseIndex);

    IndicatorStatus calculateTrafficStatus(Double trafficIndex);
}
