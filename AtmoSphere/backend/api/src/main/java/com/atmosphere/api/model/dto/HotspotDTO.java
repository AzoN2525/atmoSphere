package com.atmosphere.api.model.dto;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.atmosphere.api.enums.AlertSeverity;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.entity.Alert;
import com.atmosphere.api.model.entity.Area;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotspotDTO {

    private Long areaId;
    private String areaName;
    private String geometryGeoJson;
    private Double latitude;
    private Double longitude;
    private Integer triggeredIndicatorCount;
    private Integer alertCount;
    private AlertSeverity maxSeverity;
    private LocalDateTime lastTriggeredAt;
    private List<HotspotIndicatorDTO> indicators;

    public static HotspotDTO fromAreaAndAlerts(Area area, List<Alert> alerts) {
        Map<IndicatorType, Alert> latestAlertByIndicator = alerts.stream()
                .collect(Collectors.toMap(
                        Alert::getIndicatorType,
                        alert -> alert,
                        HotspotDTO::latestAlert
                ));

        List<HotspotIndicatorDTO> indicators = latestAlertByIndicator.values().stream()
                .sorted(
                        Comparator
                                .comparingInt((Alert alert) -> severityRank(alert.getSeverity()))
                                .reversed()
                                .thenComparing(
                                        Alert::getTriggeredAt,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                )
                )
                .map(HotspotIndicatorDTO::fromAlert)
                .toList();

        LocalDateTime lastTriggeredAt = alerts.stream()
                .map(Alert::getTriggeredAt)
                .filter(triggeredAt -> triggeredAt != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        AlertSeverity maxSeverity = indicators.stream()
                .map(HotspotIndicatorDTO::getSeverity)
                .filter(Objects::nonNull)
                .max(Comparator.comparingInt(HotspotDTO::severityRank))
                .orElse(AlertSeverity.LOW);

        return HotspotDTO.builder()
                .areaId(area.getId())
                .areaName(area.getName())
                .geometryGeoJson(area.getGeometryGeoJson())
                .latitude(area.getLatitude())
                .longitude(area.getLongitude())
                .triggeredIndicatorCount(indicators.size())
                .alertCount(alerts.size())
                .maxSeverity(maxSeverity)
                .lastTriggeredAt(lastTriggeredAt)
                .indicators(indicators)
                .build();
    }

    private static Alert latestAlert(Alert left, Alert right) {
        LocalDateTime leftTriggeredAt = left.getTriggeredAt();
        LocalDateTime rightTriggeredAt = right.getTriggeredAt();

        if (leftTriggeredAt == null) return right;
        if (rightTriggeredAt == null) return left;

        return leftTriggeredAt.isAfter(rightTriggeredAt) ? left : right;
    }

    private static int severityRank(AlertSeverity severity) {
        if (severity == null) return 0;

        return switch (severity) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }
}