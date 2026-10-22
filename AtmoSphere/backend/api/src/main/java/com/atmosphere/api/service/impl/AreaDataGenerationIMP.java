package com.atmosphere.api.service.impl;

import org.springframework.stereotype.Service;

import com.atmosphere.api.messaging.SensorDataParser;
import com.atmosphere.api.messaging.SseService;
import com.atmosphere.api.messaging.config.RabbitMQConfig;
import com.atmosphere.api.model.dto.AreaSnapshotDTO;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.service.AirService;
import com.atmosphere.api.service.AlertService;
import com.atmosphere.api.service.AreaDataAggregationService;
import com.atmosphere.api.service.AreaDataGeneration;
import com.atmosphere.api.service.NoiseService;
import com.atmosphere.api.service.TrafficService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class AreaDataGenerationIMP implements AreaDataGeneration {

    private final SensorDataParser parser;
    private final AirService airService;
    private final NoiseService noiseService;
    private final TrafficService trafficService;
    private final AreaDataAggregationService aggregationService;
    private final AlertService alertService;
    private final SseService sseService;

    @Override
    @Transactional
    public void processData(String queue, String message) {
        Long areaId = null;
        switch (queue) {
            case RabbitMQConfig.AirQueue:
                AirQualityData air = parser.parseAirQuality(message);
                airService.saveAirQualityData(air);
                areaId = air.getArea().getId();
                alertService.checkAndCreateAirQualityAlert(air);
                break;
            case RabbitMQConfig.NoiseQueue:
                NoiseData noise = parser.parseNoiseData(message);
                noiseService.saveNoiseData(noise);
                areaId = noise.getArea().getId();
                alertService.checkAndCreateNoiseAlert(noise);
                break;
            case RabbitMQConfig.TrafficQueue:
                TrafficData traffic = parser.parseTrafficData(message);
                trafficService.saveTrafficData(traffic);
                areaId = traffic.getArea().getId();
                alertService.checkAndCreateTrafficAlert(traffic);
                break;
            default:
                log.warn("Queue desconhecida: {}", queue);
        }
        if (areaId != null) {
            AreaSnapshotDTO lastAreaSnapshot = aggregationService.getAreaSnapshot(areaId);
            AreaSnapshotDTO UpdatedSnapshot = aggregationService.updateAreaSnapshot(areaId);

            if(
                    !Objects.equals(lastAreaSnapshot.getAirQualityIndex(), UpdatedSnapshot.getAirQualityIndex())
                    || !Objects.equals(lastAreaSnapshot.getNoiseIndex(), UpdatedSnapshot.getNoiseIndex())
                    || !Objects.equals(lastAreaSnapshot.getTrafficIndex(), UpdatedSnapshot.getTrafficIndex())
                    || !Objects.equals(lastAreaSnapshot.getOverallIndex(), UpdatedSnapshot.getOverallIndex())
                    || !Objects.equals(lastAreaSnapshot.getAirStatus(), UpdatedSnapshot.getAirStatus())
                    || !Objects.equals(lastAreaSnapshot.getNoiseStatus(), UpdatedSnapshot.getNoiseStatus())
                    || !Objects.equals(lastAreaSnapshot.getTrafficStatus(), UpdatedSnapshot.getTrafficStatus())
                    || !Objects.equals(lastAreaSnapshot.getOverallStatus(), UpdatedSnapshot.getOverallStatus())
            ){
                // mandar o snapshot ao sse so se a leitura for nova (diferente do que esta na base de dados )
                sseService.sendMessage("snapshot-update", UpdatedSnapshot);
            }


        }
    }
}
