package com.atmosphere.api.service.impl;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.exception.ResourceNotFoundException;
import com.atmosphere.api.model.dto.TrafficDTO;
import com.atmosphere.api.model.entity.TrafficData;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.TrafficDataRepository;
import com.atmosphere.api.service.TrafficService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementação do serviço de tráfego
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TrafficServiceImpl implements TrafficService {

    private final AreaRepository areaRepository;
    private final TrafficDataRepository trafficDataRepository;

    @Override
    public TrafficDTO getLatestTrafficByArea(Long areaId) {
        validateAreaId(areaId, "obter tráfego mais recente");
        log.debug("Obtendo dados mais recentes de tráfego para área: {}", areaId);
        return trafficDataRepository.findTopByAreaIdOrderByTimestampDesc(areaId)
                .map(TrafficDTO::fromEntity)
                .orElse(null);
    }

    @Override
    public Double calculateAreaAverageDensity(Long areaId) {
        validateAreaId(areaId, "calcular densidade média de tráfego");
        log.debug("Calculando densidade média de tráfego para área: {}", areaId);
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<TrafficData> recentData = trafficDataRepository
                .findByAreaIdAndTimestampBetween(areaId, oneHourAgo, LocalDateTime.now());

        return recentData.stream()
                .filter(data -> data.getDensityK() != null)
                .mapToDouble(TrafficData::getDensityK)
                .average()
                .orElse(Double.NaN);
    }

    @Override
    public List<TrafficDTO> getTrafficTrend(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateAreaId(areaId, "obter tendência de tráfego");
        validateDateRange(from, to, "obter tendência de tráfego");
        log.debug("Obtendo tendência de tráfego para área {} entre {} e {}", areaId, from, to);
        return trafficDataRepository.findByAreaIdAndTimestampBetween(areaId, from, to).stream()
                .sorted(Comparator.comparing(TrafficData::getTimestamp).reversed())
                .map(TrafficDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<TrafficDTO> getTrafficBySensor(Long sensorId) {
        validateSensorId(sensorId, "obter tráfego por sensor");
        log.debug("Obtendo dados de tráfego para sensor: {}", sensorId);
        return trafficDataRepository.findBySensorIdOrderByTimestampDesc(sensorId, PageRequest.of(0, 100)).stream()
                .map(TrafficDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TrafficData saveTrafficData(TrafficData data) {
        if (data == null) {
            throw new InvalidOperationException("guardar dados de tráfego", "dados não podem ser nulos");
        }
        log.debug("Salvando dados de tráfego para sensor {} e área {}", data.getSensor(), data.getArea());
        if (data.getTimestamp() == null) {
            data.setTimestamp(LocalDateTime.now());
        }
        return trafficDataRepository.save(data);
    }

    private void validateAreaId(Long areaId, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
        if (!areaRepository.existsById(areaId)) {
            throw new ResourceNotFoundException("Área", areaId);
        }
    }

    private void validateSensorId(Long sensorId, String operation) {
        if (sensorId == null || sensorId <= 0) {
            throw new InvalidOperationException(operation, "sensorId deve ser maior que 0");
        }
    }

    private void validateDateRange(LocalDateTime from, LocalDateTime to, String operation) {
        if (from == null || to == null) {
            throw new InvalidOperationException(operation, "datas 'from' e 'to' são obrigatórias");
        }
        if (from.isAfter(to)) {
            throw new InvalidOperationException(operation, "data 'from' não pode ser posterior a 'to'");
        }
    }

}
