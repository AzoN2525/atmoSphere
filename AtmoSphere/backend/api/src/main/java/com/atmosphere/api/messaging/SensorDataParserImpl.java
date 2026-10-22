package com.atmosphere.api.messaging;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.atmosphere.api.enums.SensorStatus;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.Area;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.Sensor;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.SensorRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SensorDataParserImpl implements SensorDataParser {

    private final ObjectMapper objectMapper;
    private final SensorRepository sensorRepository;
    private final AreaRepository areaRepository;

    @Override
    public AirQualityData parseAirQuality(String payload) {
        JsonNode root = parseJson(payload);
        JsonNode header = root.path("header");
        JsonNode measurements = root.path("measurements");

        String areaIdText = header.path("area_id").asText();
        AirQualityData data = AirQualityData.builder()
            .sensor(resolveSensor(header.path("sensor_id").asText(), areaIdText))
            .area(resolveArea(areaIdText))
                .timestamp(parseTimestamp(header.path("timestamp").asText()))
                .europeanAqi(asInteger(measurements, "european_aqi"))
                .pm10(asDouble(measurements, "pm10"))
                .pm25(asDouble(measurements, "pm2_5"))
                .co(asDouble(measurements, "co"))
                .no2(asDouble(measurements, "no2"))
                .so2(asDouble(measurements, "so2"))
                .o3(asDouble(measurements, "o3"))
                .build();

        return data;
    }

    @Override
    public NoiseData parseNoiseData(String payload) {
        JsonNode root = parseJson(payload);
        JsonNode header = root.path("header");
        JsonNode measurements = root.path("measurements");

        String areaIdText = header.path("area_id").asText();
        NoiseData data = NoiseData.builder()
            .sensor(resolveSensor(header.path("sensor_id").asText(), areaIdText))
            .area(resolveArea(areaIdText))
                .timestamp(parseTimestamp(header.path("timestamp").asText()))
                .currentValue(asDouble(measurements, "instant"))
                .leq(asDouble(measurements, "leq"))
                .lmax(asDouble(measurements, "lmax"))
                .lmin(asDouble(measurements, "lmin"))
                .l10(asDouble(measurements, "l10"))
                .l90(asDouble(measurements, "l90"))
                .build();

        return data;
    }

    @Override
    public TrafficData parseTrafficData(String payload) {
        JsonNode root = parseJson(payload);
        JsonNode header = root.path("header");
        JsonNode measurements = root.path("measurements");
        JsonNode flow = measurements.path("flow");
        JsonNode velocity = measurements.path("velocity");
        JsonNode occupancy = measurements.path("occupancy");
        JsonNode classification = measurements.path("classification");

        String areaIdText = header.path("area_id").asText();
        TrafficData data = TrafficData.builder()
            .sensor(resolveSensor(header.path("sensor_id").asText(), areaIdText))
            .area(resolveArea(areaIdText))
                .timestamp(parseTimestamp(header.path("timestamp").asText()))
                .flowTotalCount(asInteger(flow, "total_count"))
                .flowRateH(asInteger(flow, "flow_rate_h"))
                .densityK(asDouble(flow, "density_k"))
                .avgSpeed(asDouble(velocity, "avg_speed"))
                .speedPercentile85(asDouble(velocity, "speed_percentile_85"))
                .laneOccupancyPct(asDouble(occupancy, "lane_occupancy_pct"))
                .avgGapSeconds(asDouble(occupancy, "avg_gap_seconds"))
                .passengerCarCount(getClassificationCount(classification, "passenger_car"))
                .heavyTruckCount(getClassificationCount(classification, "heavy_truck"))
                .motorcycleCount(getClassificationCount(classification, "motorcycle"))
                .build();

        return data;
    }

    private JsonNode parseJson(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (IOException e) {
            throw new IllegalArgumentException("Erro a desserializar payload JSON", e);
        }
    }

    private Sensor resolveSensor(String externalSensorId, String areaName) {
        return sensorRepository.findByExternalSensorId(externalSensorId)
                .orElseGet(() -> createSensor(externalSensorId, areaName));
    }

    private Area resolveArea(String areaName) {
        return areaRepository.findByName(areaName)
                .orElseGet(() -> createArea(areaName));
    }

    private Sensor createSensor(String externalSensorId, String areaName) {
        // Extrair tipo do sensor do ID (AIR-SENSOR-001 -> air, NOISE-SENSOR-001 -> noise, etc.)
        String resolvedAreaName = areaName != null && !areaName.isBlank() ? areaName : "AREA-01";

        Area area = resolveArea(resolvedAreaName);

        Sensor sensor = Sensor.builder()
                .externalSensorId(externalSensorId)
                .area(area)
                .status(SensorStatus.ACTIVE)
                .build();

        return sensorRepository.save(sensor);
    }

    private Area createArea(String areaName) {
        // Definir coordenadas específicas para cada distrito de Portugal
        double latitude;
        double longitude;

        switch (areaName.toUpperCase()) {
            case "LISBOA" -> {
                latitude = 38.7223;
                longitude = -9.1393;
            }
            case "PORTO" -> {
                latitude = 41.1579;
                longitude = -8.6291;
            }
            case "COIMBRA" -> {
                latitude = 40.2033;
                longitude = -8.4103;
            }
            case "BRAGA" -> {
                latitude = 41.5454;
                longitude = -8.4265;
            }
            case "AVEIRO" -> {
                latitude = 40.6405;
                longitude = -8.6538;
            }
            case "SETUBAL" -> {
                latitude = 38.5244;
                longitude = -8.8882;
            }
            case "SANTAREM" -> {
                latitude = 39.2363;
                longitude = -8.6810;
            }
            case "LEIRIA" -> {
                latitude = 39.7436;
                longitude = -8.8070;
            }
            case "VISEU" -> {
                latitude = 40.6610;
                longitude = -7.9097;
            }
            case "VIANADOCASTELO" -> {
                latitude = 41.6930;
                longitude = -8.8320;
            }
            case "VILAREAL" -> {
                latitude = 41.2995;
                longitude = -7.7430;
            }
            case "BRAGANCA" -> {
                latitude = 41.8076;
                longitude = -6.7573;
            }
            case "CASTELOBRANCO" -> {
                latitude = 39.8225;
                longitude = -7.4901;
            }
            case "GUARDA" -> {
                latitude = 40.5378;
                longitude = -7.2650;
            }
            case "PORTALEGRE" -> {
                latitude = 39.2920;
                longitude = -7.4287;
            }
            case "EVORA" -> {
                latitude = 38.5713;
                longitude = -7.9139;
            }
            case "BEJA" -> {
                latitude = 38.0151;
                longitude = -7.8638;
            }
            case "FARO" -> {
                latitude = 37.0194;
                longitude = -7.9304;
            }
            default -> {
                // Coordenadas de Lisboa para áreas desconhecidas
                latitude = 38.7223;
                longitude = -9.1393;
            }
        }

        Area area = Area.builder()
                .name(areaName)
                .latitude(latitude)
                .longitude(longitude)
                .build();

        return areaRepository.save(area);
    }

    private LocalDateTime parseTimestamp(String timestamp) {
        if (timestamp == null || timestamp.isBlank()) {
            return LocalDateTime.now(ZoneOffset.UTC);
        }
        return OffsetDateTime.parse(timestamp).atZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private Integer asInteger(JsonNode node, String fieldName) {
        return node.hasNonNull(fieldName) ? node.get(fieldName).asInt() : null;
    }

    private Double asDouble(JsonNode node, String fieldName) {
        return node.hasNonNull(fieldName) ? node.get(fieldName).asDouble() : null;
    }

    private Integer getClassificationCount(JsonNode classification, String className) {
        if (!classification.isArray()) {
            return null;
        }
        for (JsonNode item : classification) {
            if (className.equals(item.path("class").asText())) {
                return item.path("count").asInt();
            }
        }
        return null;
    }
}
