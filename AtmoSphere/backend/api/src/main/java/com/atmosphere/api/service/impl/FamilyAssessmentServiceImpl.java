package com.atmosphere.api.service.impl;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.model.dto.AreaDTO;
import com.atmosphere.api.model.dto.CombinedHistoricalDataPointDTO;
import com.atmosphere.api.model.dto.CombinedHistoricalResponseDTO;
import com.atmosphere.api.model.dto.FamilyAssessmentDTO;
import com.atmosphere.api.model.dto.FamilyIndicatorBreakdownDTO;
import com.atmosphere.api.service.AreaService;
import com.atmosphere.api.service.AreaStatusCalculationService;
import com.atmosphere.api.service.FamilyAssessmentService;
import com.atmosphere.api.service.HistoricalDataService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FamilyAssessmentServiceImpl implements FamilyAssessmentService {

    private static final double SUITABLE_MIN_AVERAGE = 80.0;
    private static final double SUITABLE_PERIOD_THRESHOLD = 75.0;
    private static final double SUITABLE_MIN_PERIOD_PERCENTAGE = 70.0;
    private static final double MODERATE_MIN_AVERAGE = 55.0;

    private static final String SUITABLE = "Suitable";
    private static final String MODERATE = "Moderate";
    private static final String NOT_RECOMMENDED = "Not Recommended";

    private final HistoricalDataService historicalDataService;
    private final AreaService areaService;
    private final AreaStatusCalculationService statusCalculationService;

    @Override
    public FamilyAssessmentDTO getAreaFamilyAssessment(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateAreaId(areaId, "obter avaliação family-friendly");
        validateWindow(from, to, aggregation, "obter avaliação family-friendly");
        log.debug("Calculando avaliação family-friendly da área {} entre {} e {}", areaId, from, to);

        // Guarantees 404 when area does not exist
        areaService.getAreaById(areaId);
        CombinedHistoricalResponseDTO history = historicalDataService.getCombinedHistory(areaId, from, to, aggregation);
        return buildAssessment(history, from, to, aggregation);
    }

    @Override
    public List<FamilyAssessmentDTO> getAllAreasFamilyAssessment(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateWindow(from, to, aggregation, "obter avaliação family-friendly global");
        log.debug("Calculando avaliação family-friendly de todas as áreas entre {} e {}", from, to);

        List<AreaDTO> areas = areaService.getAllAreas();
        return areas.stream()
                .map(area -> historicalDataService.getCombinedHistory(area.getId(), from, to, aggregation))
                .map(history -> buildAssessment(history, from, to, aggregation))
                .toList();
    }

    private FamilyAssessmentDTO buildAssessment(
            CombinedHistoricalResponseDTO history,
            LocalDateTime from,
            LocalDateTime to,
            AggregationPeriod aggregation) {
        List<CombinedHistoricalDataPointDTO> points = history.getData();
        int periods = points != null ? points.size() : 0;

        if (periods == 0) {
            return FamilyAssessmentDTO.builder()
                    .areaId(history.getAreaId())
                    .areaName(history.getAreaName())
                    .assessment(NOT_RECOMMENDED)
                    .overallIndex(0.0)
                    .suitablePeriodsPercentage(0.0)
                    .evaluatedPeriods(0)
                    .aggregation(aggregation)
                    .from(from)
                    .to(to)
                    .indicatorBreakdown(FamilyIndicatorBreakdownDTO.builder()
                            .airIndex(0.0)
                            .noiseIndex(0.0)
                            .trafficIndex(0.0)
                            .build())
                    .build();
        }

        double avgAir = points.stream()
                .mapToDouble(p -> statusCalculationService.normalizeAirQuality(p.getAirQualityIndex()))
                .average()
                .orElse(0.0);
        double avgNoise = points.stream()
                .mapToDouble(p -> statusCalculationService.normalizeNoise(p.getNoiseLeq()))
                .average()
                .orElse(0.0);
        double avgTraffic = points.stream()
                .mapToDouble(p -> statusCalculationService.normalizeTraffic(p.getTrafficDensityK()))
                .average()
                .orElse(0.0);

        double averageOverall = statusCalculationService.calculateOverallIndex(avgAir, avgNoise, avgTraffic);

        long suitablePeriodsCount = points.stream()
                .mapToDouble(p -> statusCalculationService.calculateOverallIndex(
                        statusCalculationService.normalizeAirQuality(p.getAirQualityIndex()),
                        statusCalculationService.normalizeNoise(p.getNoiseLeq()),
                        statusCalculationService.normalizeTraffic(p.getTrafficDensityK())))
                .filter(index -> index >= SUITABLE_PERIOD_THRESHOLD)
                .count();

        double suitablePercentage = periods > 0 ? (suitablePeriodsCount * 100.0) / periods : 0.0;

        return FamilyAssessmentDTO.builder()
                .areaId(history.getAreaId())
                .areaName(history.getAreaName())
                .assessment(resolveAssessment(averageOverall, suitablePercentage))
                .overallIndex(round(averageOverall))
                .suitablePeriodsPercentage(round(suitablePercentage))
                .evaluatedPeriods(periods)
                .aggregation(aggregation)
                .from(from)
                .to(to)
                .indicatorBreakdown(FamilyIndicatorBreakdownDTO.builder()
                        .airIndex(round(avgAir))
                        .noiseIndex(round(avgNoise))
                        .trafficIndex(round(avgTraffic))
                        .build())
                .build();
    }

    private String resolveAssessment(double averageOverall, double suitablePercentage) {
        if (averageOverall >= SUITABLE_MIN_AVERAGE && suitablePercentage >= SUITABLE_MIN_PERIOD_PERCENTAGE) {
            return SUITABLE;
        }
        if (averageOverall >= MODERATE_MIN_AVERAGE) {
            return MODERATE;
        }
        return NOT_RECOMMENDED;
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private void validateAreaId(Long areaId, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
    }

    private void validateWindow(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation, String operation) {
        if (from == null || to == null) {
            throw new InvalidOperationException(operation, "datas 'from' e 'to' são obrigatórias");
        }
        if (from.isAfter(to)) {
            throw new InvalidOperationException(operation, "data 'from' não pode ser posterior a 'to'");
        }
        if (aggregation == null) {
            throw new InvalidOperationException(operation, "agregação é obrigatória");
        }
    }
}
