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
import com.atmosphere.api.model.dto.AirQualityDTO;
import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.AirQualityDataRepository;
import com.atmosphere.api.service.AirService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementação do serviço de qualidade do ar
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AirServiceImpl implements AirService {

    private final AreaRepository areaRepository;
    private final AirQualityDataRepository airQualityDataRepository;

    @Override
    public AirQualityDTO getLatestAirQualityByArea(Long areaId) {
        validateAreaId(areaId, "obter qualidade do ar mais recente");
        log.debug("Obtendo dados mais recentes de qualidade do ar para área: {}", areaId);
        return airQualityDataRepository.findTopByAreaIdOrderByTimestampDesc(areaId)
                .map(AirQualityDTO::fromEntity)
                .orElse(null);
    }

    @Override
    public Double calculateAreaAverageAQI(Long areaId) {
        validateAreaId(areaId, "calcular AQI médio");
        log.debug("Calculando AQI médio para área: {}", areaId);
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<AirQualityData> recentData = airQualityDataRepository
                .findByAreaIdAndTimestampBetween(areaId, oneHourAgo, LocalDateTime.now());

        return recentData.stream()
                .filter(data -> data.getEuropeanAqi() != null)
                .mapToDouble(data -> data.getEuropeanAqi().doubleValue())
                .average()
                .orElse(Double.NaN);
    }

    @Override
    public List<AirQualityDTO> getAirQualityTrend(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateAreaId(areaId, "obter tendência de qualidade do ar");
        validateDateRange(from, to, "obter tendência de qualidade do ar");
        log.debug("Obtendo tendência de qualidade do ar para área {} entre {} e {}", areaId, from, to);
        return airQualityDataRepository.findByAreaIdAndTimestampBetween(areaId, from, to).stream()
                .sorted(Comparator.comparing(AirQualityData::getTimestamp).reversed())
                .map(AirQualityDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<AirQualityDTO> getAirQualityBySensor(Long sensorId) {
        validateSensorId(sensorId, "obter qualidade do ar por sensor");
        log.debug("Obtendo dados de qualidade do ar para sensor: {}", sensorId);
        return airQualityDataRepository.findBySensorIdOrderByTimestampDesc(sensorId, PageRequest.of(0, 100)).stream()
                .map(AirQualityDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AirQualityData saveAirQualityData(AirQualityData data) {
        if (data == null) {
            throw new InvalidOperationException("guardar dados de qualidade do ar", "dados não podem ser nulos");
        }
        log.debug("Salvando dados de qualidade do ar para sensor {} e área {}", data.getSensor(), data.getArea());
        if (data.getTimestamp() == null) {
            data.setTimestamp(LocalDateTime.now());
        }
        return airQualityDataRepository.save(data);
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
