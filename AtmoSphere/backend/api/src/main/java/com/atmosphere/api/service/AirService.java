package com.atmosphere.api.service;

import java.time.LocalDateTime;
import java.util.List;

import com.atmosphere.api.model.dto.AirQualityDTO;
import com.atmosphere.api.model.entity.AirQualityData;

/**
 * Serviço para gestão de dados de qualidade do ar
 */
public interface AirService {

    /**
     * Obtém os dados mais recentes de qualidade do ar para uma área
     * @param areaId ID da área
     * @return AirQualityDTO com dados mais recentes
     */
    AirQualityDTO getLatestAirQualityByArea(Long areaId);

    /**
     * Calcula o AQI médio para uma área baseado nos dados recentes
     * @param areaId ID da área
     * @return Valor médio do AQI
     */
    Double calculateAreaAverageAQI(Long areaId);

    /**
     * Obtém tendência histórica de qualidade do ar para uma área
     * @param areaId ID da área
     * @param from Data inicial
     * @param to Data final
     * @return Lista de AirQualityDTO ordenada por timestamp
     */
    List<AirQualityDTO> getAirQualityTrend(Long areaId, LocalDateTime from, LocalDateTime to);

    /**
     * Obtém dados de qualidade do ar de um sensor específico
     * @param sensorId ID do sensor
     * @return Lista de AirQualityDTO do sensor
     */
    List<AirQualityDTO> getAirQualityBySensor(Long sensorId);

    /**
     * Salva novos dados de qualidade do ar
     * @param data Dados de qualidade do ar a serem salvos
     * @return AirQualityData salvo
     */
    AirQualityData saveAirQualityData(AirQualityData data);
}