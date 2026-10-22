package com.atmosphere.api.service.impl;

import com.atmosphere.api.enums.IndicatorStatus;
import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.model.entity.AreaSnapshot;
import com.atmosphere.api.service.AirService;
import com.atmosphere.api.service.AreaStatusCalculationService;
import com.atmosphere.api.service.NoiseService;
import com.atmosphere.api.service.TrafficService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AreaStatusCalculationServiceImpl implements AreaStatusCalculationService {

    // Weights must sum to 1.0
    private static final double WEIGHT_AIR     = 0.40;
    private static final double WEIGHT_NOISE   = 0.35;
    private static final double WEIGHT_TRAFFIC = 0.25;

    // Normalisation boundaries
    private static final double NOISE_BEST_DB  = 40.0;   // ≤ 40 dB  → index 100
    private static final double NOISE_WORST_DB = 80.0;   // ≥ 80 dB  → index 0
    private static final double TRAFFIC_BEST   = 0.0;    // 0 veh/km → index 100
    private static final double TRAFFIC_WORST  = 30.0;   // ≥ 30     → index 0

    private final AirService airService;
    private final NoiseService noiseService;
    private final TrafficService trafficService;

    // -------------------------------------------------------------------------
    // Normalisation
    // -------------------------------------------------------------------------

    @Override
    public double normalizeAirQuality(Double rawAqi) {
        if (rawAqi == null || rawAqi.isNaN()) return 0.0;
        return clamp(100.0 - rawAqi);
    }

    @Override
    public double normalizeNoise(Double rawLeq) {
        if (rawLeq == null || rawLeq.isNaN()) return 0.0;
        double range = NOISE_WORST_DB - NOISE_BEST_DB;
        return clamp((NOISE_WORST_DB - rawLeq) / range * 100.0);
    }

    @Override
    public double normalizeTraffic(Double rawDensityK) {
        if (rawDensityK == null || rawDensityK.isNaN()) return 0.0;
        return clamp((TRAFFIC_WORST - rawDensityK) / TRAFFIC_WORST * 100.0);
    }

    // -------------------------------------------------------------------------
    // Composite index
    // -------------------------------------------------------------------------

    @Override
    public double calculateOverallIndex(Double airIndex, Double noiseIndex, Double trafficIndex) {
        double a = airIndex   != null ? airIndex   : 0.0;
        double n = noiseIndex != null ? noiseIndex : 0.0;
        double t = trafficIndex != null ? trafficIndex : 0.0;
        return clamp(WEIGHT_AIR * a + WEIGHT_NOISE * n + WEIGHT_TRAFFIC * t);
    }

    // -------------------------------------------------------------------------
    // Status from a normalised 0-100 index (higher = better)
    // -------------------------------------------------------------------------

    @Override
    public IndicatorStatus statusFromIndex(Double index) {
        if (index == null || index.isNaN()) return IndicatorStatus.STALE;
        if (index >= 75) return IndicatorStatus.GOOD;
        if (index >= 50) return IndicatorStatus.MODERATE;
        if (index >= 25) return IndicatorStatus.BAD;
        return IndicatorStatus.VERY_BAD;
    }

    @Override
    public IndicatorStatus calculateAirQualityStatus(Double airIndex) {
        return statusFromIndex(airIndex);
    }

    @Override
    public IndicatorStatus calculateNoiseStatus(Double noiseIndex) {
        return statusFromIndex(noiseIndex);
    }

    @Override
    public IndicatorStatus calculateTrafficStatus(Double trafficIndex) {
        return statusFromIndex(trafficIndex);
    }

    @Override
    public IndicatorStatus calculateOverallStatus(AreaSnapshot snapshot) {
        validateSnapshot(snapshot);
        return statusFromIndex(snapshot.getOverallIndex());
    }

    @Override
    public Map<String, IndicatorStatus> calculateIndividualStatuses(Long areaId) {
        validateAreaId(areaId, "calcular status individuais");
        log.debug("Calculando status individuais para área: {}", areaId);

        Map<String, IndicatorStatus> statuses = new HashMap<>();
        statuses.put("air",     statusFromIndex(normalizeAirQuality(airService.calculateAreaAverageAQI(areaId))));
        statuses.put("noise",   statusFromIndex(normalizeNoise(noiseService.calculateAreaAverageLeq(areaId))));
        statuses.put("traffic", statusFromIndex(normalizeTraffic(trafficService.calculateAreaAverageDensity(areaId))));
        return statuses;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private void validateAreaId(Long areaId, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
    }

    private void validateSnapshot(AreaSnapshot snapshot) {
        if (snapshot == null) {
            throw new InvalidOperationException("calcular status geral", "snapshot não pode ser nulo");
        }
        if (snapshot.getArea() == null || snapshot.getArea().getId() == null) {
            throw new InvalidOperationException("calcular status geral", "snapshot deve conter área com id válido");
        }
    }
}
