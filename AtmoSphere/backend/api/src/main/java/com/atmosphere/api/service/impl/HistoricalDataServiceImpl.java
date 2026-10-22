package com.atmosphere.api.service.impl;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.model.dto.*;
import com.atmosphere.api.model.dto.ExpandedAirQualityHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedNoiseHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedTrafficHistoryDTO;
import com.atmosphere.api.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class HistoricalDataServiceImpl implements HistoricalDataService {

    private final AirService airService;
    private final NoiseService noiseService;
    private final TrafficService trafficService;
    private final AreaService areaService;

    @Override
    public HistoricalDataResponseDTO getAirQualityHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateHistoryRequest(areaId, from, to, aggregation, "obter histórico de qualidade do ar");
        log.debug("Obtendo histórico de qualidade do ar para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<AirQualityDTO> rawData = airService.getAirQualityTrend(areaId, from, to);

        List<HistoricalDataPointDTO> data = rawData.stream()
                .filter(d -> d.getEuropeanAqi() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(d -> d.getEuropeanAqi().doubleValue())
                ))
                .entrySet().stream()
                .map(e -> HistoricalDataPointDTO.builder()
                        .timestamp(e.getKey())
                        .value(round(e.getValue()))
                        .build())
                .collect(Collectors.toList());

        return HistoricalDataResponseDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .indicator("AIR_QUALITY")
                .aggregation(aggregation)
                .from(from)
                .to(to)
                .unit("AQI")
                .data(data)
                .build();
    }

    @Override
    public HistoricalDataResponseDTO getNoiseHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateHistoryRequest(areaId, from, to, aggregation, "obter histórico de ruído");
        log.debug("Obtendo histórico de ruído para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<NoiseDTO> rawData = noiseService.getNoiseTrend(areaId, from, to);

        List<HistoricalDataPointDTO> data = rawData.stream()
                .filter(d -> d.getLeq() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(NoiseDTO::getLeq)
                ))
                .entrySet().stream()
                .map(e -> HistoricalDataPointDTO.builder()
                        .timestamp(e.getKey())
                        .value(round(e.getValue()))
                        .build())
                .collect(Collectors.toList());

        return HistoricalDataResponseDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .indicator("NOISE")
                .aggregation(aggregation)
                .from(from)
                .to(to)
                .unit("dB")
                .data(data)
                .build();
    }

    @Override
    public HistoricalDataResponseDTO getTrafficHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateHistoryRequest(areaId, from, to, aggregation, "obter histórico de tráfego");
        log.debug("Obtendo histórico de tráfego para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<TrafficDTO> rawData = trafficService.getTrafficTrend(areaId, from, to);

        List<HistoricalDataPointDTO> data = rawData.stream()
                .filter(d -> d.getDensityK() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(TrafficDTO::getDensityK)
                ))
                .entrySet().stream()
                .map(e -> HistoricalDataPointDTO.builder()
                        .timestamp(e.getKey())
                        .value(round(e.getValue()))
                        .build())
                .collect(Collectors.toList());

        return HistoricalDataResponseDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .indicator("TRAFFIC")
                .aggregation(aggregation)
                .from(from)
                .to(to)
                .unit("vehicles/km")
                .data(data)
                .build();
    }

    @Override
    public CombinedHistoricalResponseDTO getCombinedHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation) {
        validateHistoryRequest(areaId, from, to, aggregation, "obter histórico combinado");
        log.debug("Obtendo histórico combinado para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);

        Map<LocalDateTime, Double> airByTime = airService.getAirQualityTrend(areaId, from, to).stream()
                .filter(d -> d.getEuropeanAqi() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(d -> d.getEuropeanAqi().doubleValue())
                ));

        Map<LocalDateTime, Double> noiseByTime = noiseService.getNoiseTrend(areaId, from, to).stream()
                .filter(d -> d.getLeq() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(NoiseDTO::getLeq)
                ));

        Map<LocalDateTime, Double> trafficByTime = trafficService.getTrafficTrend(areaId, from, to).stream()
                .filter(d -> d.getDensityK() != null)
                .collect(Collectors.groupingBy(
                        d -> truncate(d.getTimestamp(), aggregation),
                        TreeMap::new,
                        Collectors.averagingDouble(TrafficDTO::getDensityK)
                ));

        Set<LocalDateTime> allTimestamps = new TreeSet<>();
        allTimestamps.addAll(airByTime.keySet());
        allTimestamps.addAll(noiseByTime.keySet());
        allTimestamps.addAll(trafficByTime.keySet());

        List<CombinedHistoricalDataPointDTO> data = allTimestamps.stream()
                .map(ts -> CombinedHistoricalDataPointDTO.builder()
                        .timestamp(ts)
                        .airQualityIndex(airByTime.containsKey(ts) ? round(airByTime.get(ts)) : null)
                        .noiseLeq(noiseByTime.containsKey(ts) ? round(noiseByTime.get(ts)) : null)
                        .trafficDensityK(trafficByTime.containsKey(ts) ? round(trafficByTime.get(ts)) : null)
                        .build())
                .collect(Collectors.toList());

        return CombinedHistoricalResponseDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .aggregation(aggregation)
                .from(from)
                .to(to)
                .data(data)
                .build();
    }

    @Override
    public ExpandedTrafficHistoryDTO getExpandedTrafficHistory(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateExpandedRequest(areaId, from, to, "obter histórico expandido de tráfego");
        log.debug("Obtendo histórico expandido de tráfego para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<TrafficDTO> data = trafficService.getTrafficTrend(areaId, from, to);
        return ExpandedTrafficHistoryDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .from(from)
                .to(to)
                .data(data)
                .build();
    }

    @Override
    public ExpandedNoiseHistoryDTO getExpandedNoiseHistory(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateExpandedRequest(areaId, from, to, "obter histórico expandido de ruído");
        log.debug("Obtendo histórico expandido de ruído para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<NoiseDTO> data = noiseService.getNoiseTrend(areaId, from, to);
        return ExpandedNoiseHistoryDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .from(from)
                .to(to)
                .data(data)
                .build();
    }

    @Override
    public ExpandedAirQualityHistoryDTO getExpandedAirQualityHistory(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateExpandedRequest(areaId, from, to, "obter histórico expandido de qualidade do ar");
        log.debug("Obtendo histórico expandido de qualidade do ar para área {} entre {} e {}", areaId, from, to);
        AreaDTO area = areaService.getAreaById(areaId);
        List<AirQualityDTO> data = airService.getAirQualityTrend(areaId, from, to);
        return ExpandedAirQualityHistoryDTO.builder()
                .areaId(areaId)
                .areaName(area.getName())
                .from(from)
                .to(to)
                .data(data)
                .build();
    }

    private LocalDateTime truncate(LocalDateTime timestamp, AggregationPeriod aggregation) {
        return switch (aggregation) {
            case HOURLY  -> timestamp.truncatedTo(ChronoUnit.HOURS);
            case DAILY   -> timestamp.truncatedTo(ChronoUnit.DAYS);
            case MONTHLY -> timestamp.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        };
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private void validateHistoryRequest(
            Long areaId,
            LocalDateTime from,
            LocalDateTime to,
            AggregationPeriod aggregation,
            String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
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

    private void validateExpandedRequest(Long areaId, LocalDateTime from, LocalDateTime to, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
        if (from == null || to == null) {
            throw new InvalidOperationException(operation, "datas 'from' e 'to' são obrigatórias");
        }
        if (from.isAfter(to)) {
            throw new InvalidOperationException(operation, "data 'from' não pode ser posterior a 'to'");
        }
    }
}
