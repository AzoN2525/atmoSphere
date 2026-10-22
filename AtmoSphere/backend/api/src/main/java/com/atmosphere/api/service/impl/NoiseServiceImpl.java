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
import com.atmosphere.api.model.dto.NoiseDTO;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.repository.NoiseDataRepository;
import com.atmosphere.api.service.NoiseService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementação do serviço de ruído
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NoiseServiceImpl implements NoiseService {

    private final AreaRepository areaRepository;
    private final NoiseDataRepository noiseDataRepository;

    @Override
    public NoiseDTO getLatestNoiseByArea(Long areaId) {
        validateAreaId(areaId, "obter ruído mais recente");
        log.debug("Obtendo dados mais recentes de ruído para área: {}", areaId);
        return noiseDataRepository.findTopByAreaIdOrderByTimestampDesc(areaId)
                .map(NoiseDTO::fromEntity)
                .orElse(null);
    }

    @Override
    public Double calculateAreaAverageLeq(Long areaId) {
        validateAreaId(areaId, "calcular Leq médio");
        log.debug("Calculando Leq médio para área: {}", areaId);
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<NoiseData> recentData = noiseDataRepository
                .findByAreaIdAndTimestampBetween(areaId, oneHourAgo, LocalDateTime.now());

        return recentData.stream()
                .filter(data -> data.getLeq() != null)
                .mapToDouble(NoiseData::getLeq)
                .average()
                .orElse(Double.NaN);
    }

    @Override
    public List<NoiseDTO> getNoiseTrend(Long areaId, LocalDateTime from, LocalDateTime to) {
        validateAreaId(areaId, "obter tendência de ruído");
        validateDateRange(from, to, "obter tendência de ruído");
        log.debug("Obtendo tendência de ruído para área {} entre {} e {}", areaId, from, to);
        return noiseDataRepository.findByAreaIdAndTimestampBetween(areaId, from, to).stream()
                .sorted(Comparator.comparing(NoiseData::getTimestamp).reversed())
                .map(NoiseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<NoiseDTO> getNoiseBySensor(Long sensorId) {
        validateSensorId(sensorId, "obter ruído por sensor");
        log.debug("Obtendo dados de ruído para sensor: {}", sensorId);
        return noiseDataRepository.findBySensorIdOrderByTimestampDesc(sensorId, PageRequest.of(0, 100)).stream()
                .map(NoiseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NoiseData saveNoiseData(NoiseData data) {
        if (data == null) {
            throw new InvalidOperationException("guardar dados de ruído", "dados não podem ser nulos");
        }
        log.debug("Salvando dados de ruído para sensor {} e área {}", data.getSensor(), data.getArea());
        if (data.getTimestamp() == null) {
            data.setTimestamp(LocalDateTime.now());
        }
        return noiseDataRepository.save(data);
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
