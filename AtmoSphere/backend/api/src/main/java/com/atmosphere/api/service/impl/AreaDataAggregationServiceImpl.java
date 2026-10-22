package com.atmosphere.api.service.impl;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.exception.ResourceNotFoundException;
import com.atmosphere.api.model.dto.AreaSnapshotDTO;
import com.atmosphere.api.model.entity.Area;
import com.atmosphere.api.model.entity.AreaSnapshot;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.repository.AirQualityDataRepository;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.AreaSnapshotRepository;
import com.atmosphere.api.repository.NoiseDataRepository;
import com.atmosphere.api.repository.TrafficDataRepository;
import com.atmosphere.api.service.AirService;
import com.atmosphere.api.service.AreaDataAggregationService;
import com.atmosphere.api.service.AreaStatusCalculationService;
import com.atmosphere.api.service.NoiseService;
import com.atmosphere.api.service.TrafficService;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementação do serviço de agregação de dados ambientais por área.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AreaDataAggregationServiceImpl implements AreaDataAggregationService {

    private final AreaRepository areaRepository;
    private final AreaSnapshotRepository areaSnapshotRepository;
    private final AirService airService;
    private final NoiseService noiseService;
    private final TrafficService trafficService;
    private final AreaStatusCalculationService statusCalculationService;
    private final AirQualityDataRepository airQualityDataRepository;
    private final NoiseDataRepository noiseDataRepository;
    private final TrafficDataRepository trafficDataRepository;

    @Override
    public AreaSnapshotDTO getAreaSnapshot(Long areaId) {
        validateAreaId(areaId, "obter snapshot da área");
        log.debug("Obtendo snapshot consolidado da área {}", areaId);
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Área", areaId));
        AreaSnapshot snapshot = areaSnapshotRepository.findByAreaId(areaId).orElse(null);
        return AreaSnapshotDTO.fromEntities(area, snapshot);
    }

    @Override
    public List<AreaSnapshotDTO> getAllAreaSnapshots() {
        log.debug("Obtendo snapshots consolidados de todas as áreas");

        // Carrega todas as áreas e seus snapshots em memória para evitar múltiplas consultas (n+1 queries) --- 2 queries em vez de n+1
        List<Area> areas = areaRepository.findAllByOrderByNameAsc();
        List<AreaSnapshot> snapshots = areaSnapshotRepository.findAll();

        // Mapeia snapshots por área para acesso rápido
        Map<Long, AreaSnapshot> snapshotMap = snapshots.stream()
                .collect(Collectors.toMap(
                        s -> s.getArea().getId(),
                        s -> s
                ));
        
        // Constrói a lista de DTOs combinando dados das áreas e seus snapshots
        return areas.stream()
                .map(a -> AreaSnapshotDTO.fromEntities(a, snapshotMap.get(a.getId())))
                .collect(Collectors.toList());
    }

    @Override
    public List<AreaSnapshotDTO> getHistoricalAreaSnapshots(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateHistoricalRequest(from, to, aggregation);
        log.debug("Obtendo snapshots históricos de todas as áreas entre {} e {} com agregação {}", from, to, aggregation);

        List<Area> areas = areaRepository.findAllByOrderByNameAsc();

        Map<Long, Double> airByArea = airQualityDataRepository
                .findByTimestampGreaterThanEqualAndTimestampLessThan(from, to)
                .stream()
                .filter(data -> data.getEuropeanAqi() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getArea().getId(),
                        Collectors.averagingDouble(data -> data.getEuropeanAqi().doubleValue())
                ));

        Map<Long, Double> noiseByArea = noiseDataRepository
                .findByTimestampGreaterThanEqualAndTimestampLessThan(from, to)
                .stream()
                .filter(data -> data.getLeq() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getArea().getId(),
                        Collectors.averagingDouble(NoiseData::getLeq)
                ));

        Map<Long, Double> trafficByArea = trafficDataRepository
                .findByTimestampGreaterThanEqualAndTimestampLessThan(from, to)
                .stream()
                .filter(data -> data.getDensityK() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getArea().getId(),
                        Collectors.averagingDouble(TrafficData::getDensityK)
                ));

        LocalDateTime bucketTimestamp = truncate(from, aggregation);

        return areas.stream()
                .map(area -> buildHistoricalSnapshot(area, airByArea, noiseByArea, trafficByArea, bucketTimestamp))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AreaSnapshotDTO updateAreaSnapshot(Long areaId) {
        validateAreaId(areaId, "atualizar snapshot da área");
        log.debug("Atualizando snapshot da área {}", areaId);

        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Área", areaId));

        AreaSnapshot snapshot = areaSnapshotRepository.findByAreaId(areaId).orElseGet(AreaSnapshot::new);
        snapshot.setArea(area);
        snapshot.setUpdatedAt(LocalDateTime.now());

        double airIndex     = statusCalculationService.normalizeAirQuality(airService.calculateAreaAverageAQI(areaId));
        double noiseIndex   = statusCalculationService.normalizeNoise(noiseService.calculateAreaAverageLeq(areaId));
        double trafficIndex = statusCalculationService.normalizeTraffic(trafficService.calculateAreaAverageDensity(areaId));
        double overallIndex = statusCalculationService.calculateOverallIndex(airIndex, noiseIndex, trafficIndex);

        snapshot.setAirQualityIndex(round(airIndex));
        snapshot.setNoiseIndex(round(noiseIndex));
        snapshot.setTrafficIndex(round(trafficIndex));
        snapshot.setOverallIndex(round(overallIndex));

        snapshot.setAirStatus(statusCalculationService.calculateAirQualityStatus(airIndex));
        snapshot.setNoiseStatus(statusCalculationService.calculateNoiseStatus(noiseIndex));
        snapshot.setTrafficStatus(statusCalculationService.calculateTrafficStatus(trafficIndex));
        snapshot.setOverallStatus(statusCalculationService.calculateOverallStatus(snapshot));

        AreaSnapshot saved = areaSnapshotRepository.save(snapshot);
        return AreaSnapshotDTO.fromEntities(area, saved);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private AreaSnapshotDTO buildHistoricalSnapshot(
            Area area,
            Map<Long, Double> airByArea,
            Map<Long, Double> noiseByArea,
            Map<Long, Double> trafficByArea,
            LocalDateTime bucketTimestamp) {
        Long areaId = area.getId();
        Double airIndex = airByArea.containsKey(areaId)
                ? round(statusCalculationService.normalizeAirQuality(airByArea.get(areaId)))
                : null;
        Double noiseIndex = noiseByArea.containsKey(areaId)
                ? round(statusCalculationService.normalizeNoise(noiseByArea.get(areaId)))
                : null;
        Double trafficIndex = trafficByArea.containsKey(areaId)
                ? round(statusCalculationService.normalizeTraffic(trafficByArea.get(areaId)))
                : null;
        Double overallIndex = hasAnyIndex(airIndex, noiseIndex, trafficIndex)
                ? round(statusCalculationService.calculateOverallIndex(airIndex, noiseIndex, trafficIndex))
                : null;

        return AreaSnapshotDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .geometryGeoJson(area.getGeometryGeoJson())
                .latitude(area.getLatitude())
                .longitude(area.getLongitude())
                .airQualityIndex(airIndex)
                .noiseIndex(noiseIndex)
                .trafficIndex(trafficIndex)
                .overallIndex(overallIndex)
                .airStatus(statusCalculationService.calculateAirQualityStatus(airIndex))
                .noiseStatus(statusCalculationService.calculateNoiseStatus(noiseIndex))
                .trafficStatus(statusCalculationService.calculateTrafficStatus(trafficIndex))
                .overallStatus(statusCalculationService.statusFromIndex(overallIndex))
                .updatedAt(hasAnyIndex(airIndex, noiseIndex, trafficIndex) ? bucketTimestamp : null)
                .build();
    }

    private boolean hasAnyIndex(Double airIndex, Double noiseIndex, Double trafficIndex) {
        return airIndex != null || noiseIndex != null || trafficIndex != null;
    }

    private LocalDateTime truncate(LocalDateTime timestamp, AggregationPeriod aggregation) {
        return switch (aggregation) {
            case HOURLY -> timestamp.truncatedTo(ChronoUnit.HOURS);
            case DAILY -> timestamp.truncatedTo(ChronoUnit.DAYS);
            case MONTHLY -> timestamp.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        };
    }

    private void validateAreaId(Long areaId, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
    }

    private void validateHistoricalRequest(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        if (from == null || to == null) {
            throw new InvalidOperationException("obter snapshots históricos", "datas 'from' e 'to' são obrigatórias");
        }
        if (!from.isBefore(to)) {
            throw new InvalidOperationException("obter snapshots históricos", "data 'from' deve ser anterior a 'to'");
        }
        if (aggregation == null) {
            throw new InvalidOperationException("obter snapshots históricos", "agregação é obrigatória");
        }
    }

}
