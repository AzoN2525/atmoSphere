package com.atmosphere.api.service;

import java.time.LocalDateTime;
import java.util.List;

import com.atmosphere.api.model.dto.NoiseDTO;
import com.atmosphere.api.model.entity.NoiseData;

/**
 * Serviço para gestão de dados de ruído
 */
public interface NoiseService {

    /**
     * Obtém os dados mais recentes de ruído para uma área
     * @param areaId ID da área
     * @return NoiseDTO com dados mais recentes
     */
    NoiseDTO getLatestNoiseByArea(Long areaId);

    /**
     * Calcula o Leq médio para uma área baseado nos dados recentes
     * @param areaId ID da área
     * @return Valor médio do Leq (dB)
     */
    Double calculateAreaAverageLeq(Long areaId);

    /**
     * Obtém tendência histórica de ruído para uma área
     * @param areaId ID da área
     * @param from Data inicial
     * @param to Data final
     * @return Lista de NoiseDTO ordenada por timestamp
     */
    List<NoiseDTO> getNoiseTrend(Long areaId, LocalDateTime from, LocalDateTime to);

    /**
     * Obtém dados de ruído de um sensor específico
     * @param sensorId ID do sensor
     * @return Lista de NoiseDTO do sensor
     */
    List<NoiseDTO> getNoiseBySensor(Long sensorId);

    /**
     * Salva novos dados de ruído
     * @param data Dados de ruído a serem salvos
     * @return NoiseData salvo
     */
    NoiseData saveNoiseData(NoiseData data);
}