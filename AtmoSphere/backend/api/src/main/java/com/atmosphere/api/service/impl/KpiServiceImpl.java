package com.atmosphere.api.service.impl;

import com.atmosphere.api.exception.ResourceNotFoundException;
import com.atmosphere.api.model.dto.HotspotDTO;
import com.atmosphere.api.model.dto.KpiDTO;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.Area;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.repository.AirQualityDataRepository;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.NoiseDataRepository;
import com.atmosphere.api.repository.TrafficDataRepository;
import com.atmosphere.api.service.HotspotService;
import com.atmosphere.api.service.KpiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementação do serviço de cálculo de KPIs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KpiServiceImpl implements KpiService {

    private final AreaRepository areaRepository;
    private final AirQualityDataRepository airQualityDataRepository;
    private final NoiseDataRepository noiseDataRepository;
    private final TrafficDataRepository trafficDataRepository;
    private final HotspotService hotspotService;

    @Override
    public KpiDTO calculateKpis(Long areaId, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Calculando KPIs para areaId={} de {} a {}", areaId, startDate, endDate);

        List<Area> areas;

        if (areaId != null) {
            Area area = areaRepository.findById(areaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Área", areaId));
            areas = List.of(area);
        } else {
            areas = areaRepository.findAll();
        }

        // Média AQI por área
        List<KpiDTO.AreaAirQualityKpiDTO> airQualityKpis = areas.stream()
                .map(area -> {
                    List<AirQualityData> data = airQualityDataRepository.findByAreaIdAndTimestampBetween(
                            area.getId(), startDate, endDate);
                    Double avgAqi = data.stream()
                            .mapToDouble(AirQualityData::getEuropeanAqi)
                            .average()
                            .orElse(0.0);
                    return KpiDTO.AreaAirQualityKpiDTO.builder()
                            .areaId(area.getId())
                            .areaName(area.getName())
                            .averageAqi(avgAqi)
                            .build();
                })
                .collect(Collectors.toList());

        // Média densidade de tráfego por área
        List<KpiDTO.AreaTrafficDensityKpiDTO> trafficDensityKpis = areas.stream()
                .map(area -> {
                    List<TrafficData> trafficData = trafficDataRepository.findByAreaIdAndTimestampBetween(
                            area.getId(), startDate, endDate);
                    Double avgDensity = trafficData.stream()
                            .mapToDouble(TrafficData::getDensityK)
                            .average()
                            .orElse(0.0);
                    return KpiDTO.AreaTrafficDensityKpiDTO.builder()
                            .areaId(area.getId())
                            .areaName(area.getName())
                            .averageDensity(avgDensity)
                            .build();
                })
                .collect(Collectors.toList());

        // Média nível de ruído por área
        List<KpiDTO.AreaNoiseLevelKpiDTO> noiseLevelKpis = areas.stream()
                .map(area -> {
                    List<NoiseData> noiseData = noiseDataRepository.findByAreaIdAndTimestampBetween(
                            area.getId(), startDate, endDate);
                    Double avgLeq = noiseData.stream()
                            .mapToDouble(NoiseData::getLeq)
                            .average()
                            .orElse(0.0);
                    return KpiDTO.AreaNoiseLevelKpiDTO.builder()
                            .areaId(area.getId())
                            .areaName(area.getName())
                            .averageLeq(avgLeq)
                            .build();
                })
                .collect(Collectors.toList());

        // Hotspots detectados - usar a lógica real da US-04
        List<HotspotDTO> hotspots = hotspotService.getHotspots(
                areaId,
                null,
                startDate,
                endDate
        );

        return KpiDTO.builder()
                .startDate(startDate)
                .endDate(endDate)
                .averageAirQualityByArea(airQualityKpis)
                .averageTrafficDensityByArea(trafficDensityKpis)
                .averageNoiseLevelByArea(noiseLevelKpis)
                .hotspotsDetected(hotspots)
                .build();
    }
}