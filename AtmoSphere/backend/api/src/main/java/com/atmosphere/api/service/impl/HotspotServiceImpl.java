package com.atmosphere.api.service.impl;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.model.dto.HotspotDTO;
import com.atmosphere.api.model.dto.HotspotFrequencyPointDTO;
import com.atmosphere.api.model.dto.HotspotFrequencyResponseDTO;
import com.atmosphere.api.model.entity.Alert;
import com.atmosphere.api.repository.AlertRepository;
import com.atmosphere.api.service.HotspotService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class HotspotServiceImpl implements HotspotService {

    private static final int DEFAULT_REAL_TIME_WINDOW_HOURS = 1;

    private final AlertRepository alertRepository;

    @Override
    public List<HotspotDTO> getHotspots(Long areaId, IndicatorType indicatorType, LocalDateTime from, LocalDateTime to) {
        TimeWindow window = resolveTimeWindow(from, to);

        log.debug(
                "Listing hotspots: areaId={}, indicatorType={}, from={}, to={}",
                areaId,
                indicatorType,
                window.from(),
                window.to()
        );

        List<Alert> alerts = findAlerts(areaId, indicatorType, window.from(), window.to());

        Map<Long, List<Alert>> alertsByArea = alerts.stream()
                .filter(alert -> alert.getArea() != null && alert.getArea().getId() != null)
                .collect(Collectors.groupingBy(alert -> alert.getArea().getId()));

        return alertsByArea.values().stream()
                .map(areaAlerts -> HotspotDTO.fromAreaAndAlerts(areaAlerts.get(0).getArea(), areaAlerts))
                .sorted(Comparator
                        .comparing(HotspotDTO::getTriggeredIndicatorCount, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(HotspotDTO::getLastTriggeredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    public HotspotFrequencyResponseDTO getHotspotFrequency(
            Long areaId,
            LocalDateTime from,
            LocalDateTime to,
            AggregationPeriod aggregation
    ) {
        TimeWindow window = resolveTimeWindow(from, to);

        List<Alert> alerts = findAlerts(areaId, null, window.from(), window.to());

        Map<LocalDateTime, List<Alert>> alertsByBucket = alerts.stream()
                .collect(Collectors.groupingBy(
                        alert -> truncate(alert.getTriggeredAt(), aggregation),
                        TreeMap::new,
                        Collectors.toList()
                ));

        List<HotspotFrequencyPointDTO> data = buildCompleteFrequencySeries(
                alertsByBucket,
                window.from(),
                window.to(),
                aggregation
        );

        return HotspotFrequencyResponseDTO.builder()
                .areaId(areaId)
                .aggregation(aggregation)
                .from(window.from())
                .to(window.to())
                .data(data)
                .build();
    }

    private List<Alert> findAlerts(Long areaId, IndicatorType indicatorType, LocalDateTime from, LocalDateTime to) {
        if (areaId != null && indicatorType != null) {
            return alertRepository.findByAreaIdAndIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(
                    areaId,
                    indicatorType,
                    from,
                    to
            );
        }

        if (areaId != null) {
            return alertRepository.findByAreaIdAndTriggeredAtBetweenOrderByTriggeredAtDesc(areaId, from, to);
        }

        if (indicatorType != null) {
            return alertRepository.findByIndicatorTypeAndTriggeredAtBetweenOrderByTriggeredAtDesc(indicatorType, from, to);
        }

        return alertRepository.findByTriggeredAtBetweenOrderByTriggeredAtDesc(from, to);
    }

    private TimeWindow resolveTimeWindow(LocalDateTime from, LocalDateTime to) {
        LocalDateTime effectiveTo = to != null ? to : LocalDateTime.now();
        LocalDateTime effectiveFrom = from != null ? from : effectiveTo.minusHours(DEFAULT_REAL_TIME_WINDOW_HOURS);

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new InvalidOperationException("listar hotspots", "data 'from' não pode ser posterior a 'to'");
        }

        return new TimeWindow(effectiveFrom, effectiveTo);
    }


    private List<HotspotFrequencyPointDTO> buildCompleteFrequencySeries(
            Map<LocalDateTime, List<Alert>> alertsByBucket,
            LocalDateTime from,
            LocalDateTime to,
            AggregationPeriod aggregation
    ) {
        List<HotspotFrequencyPointDTO> data = new java.util.ArrayList<>();
        LocalDateTime bucket = truncate(from, aggregation);
        LocalDateTime lastBucket = truncate(to, aggregation);

        while (!bucket.isAfter(lastBucket)) {
            List<Alert> bucketAlerts = alertsByBucket.getOrDefault(bucket, List.of());
            data.add(toFrequencyPoint(bucket, bucketAlerts));
            bucket = nextBucket(bucket, aggregation);
        }

        return data;
    }

    private HotspotFrequencyPointDTO toFrequencyPoint(LocalDateTime bucket, List<Alert> bucketAlerts) {
        Set<Long> hotspotAreaIds = bucketAlerts.stream()
                .filter(alert -> alert.getArea() != null && alert.getArea().getId() != null)
                .map(alert -> alert.getArea().getId())
                .collect(Collectors.toSet());

        Set<Long> airQualityAreas = new HashSet<>();
        Set<Long> noiseAreas = new HashSet<>();
        Set<Long> trafficAreas = new HashSet<>();

        bucketAlerts.forEach(alert -> {
            if (alert.getArea() == null || alert.getArea().getId() == null) return;

            Long bucketAreaId = alert.getArea().getId();

            switch (alert.getIndicatorType()) {
                case AIR_QUALITY -> airQualityAreas.add(bucketAreaId);
                case NOISE -> noiseAreas.add(bucketAreaId);
                case TRAFFIC -> trafficAreas.add(bucketAreaId);
            }
        });

        return HotspotFrequencyPointDTO.builder()
                .timestamp(bucket)
                .hotspotCount(hotspotAreaIds.size())
                .airQualityCount(airQualityAreas.size())
                .noiseCount(noiseAreas.size())
                .trafficCount(trafficAreas.size())
                .build();
    }

    private LocalDateTime nextBucket(LocalDateTime bucket, AggregationPeriod aggregation) {
        return switch (aggregation) {
            case HOURLY -> bucket.plusHours(1);
            case DAILY -> bucket.plusDays(1);
            case MONTHLY -> bucket.plusMonths(1);
        };
    }

    private LocalDateTime truncate(LocalDateTime timestamp, AggregationPeriod aggregation) {
        return switch (aggregation) {
            case HOURLY -> timestamp.truncatedTo(ChronoUnit.HOURS);
            case DAILY -> timestamp.truncatedTo(ChronoUnit.DAYS);
            case MONTHLY -> timestamp.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        };
    }

    private record TimeWindow(LocalDateTime from, LocalDateTime to) {}
}
