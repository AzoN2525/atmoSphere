package com.atmosphere.api.service;

import java.time.LocalDateTime;
import java.util.List;

import com.atmosphere.api.model.dto.TrafficDTO;
import com.atmosphere.api.model.entity.TrafficData;

/**
 * Serviço para gestão de dados de tráfego
 */
public interface TrafficService {

    /**
     * Obtém os dados mais recentes de tráfego para uma área
     * @param areaId ID da área
     * @return TrafficDTO com dados mais recentes
     */
    TrafficDTO getLatestTrafficByArea(Long areaId);

    /**
     * Calcula a densidade média de tráfego para uma área
     * @param areaId ID da área
     * @return Densidade média (veículos/km)
     */
    Double calculateAreaAverageDensity(Long areaId);

    /**
     * Obtém tendência histórica de tráfego para uma área
     * @param areaId ID da área
     * @param from Data inicial
     * @param to Data final
     * @return Lista de TrafficDTO ordenada por timestamp
     */
    List<TrafficDTO> getTrafficTrend(Long areaId, LocalDateTime from, LocalDateTime to);

    /**
     * Obtém dados de tráfego de um sensor específico
     * @param sensorId ID do sensor
     * @return Lista de TrafficDTO do sensor
     */
    List<TrafficDTO> getTrafficBySensor(Long sensorId);

    /**
     * Salva novos dados de tráfego
     * @param data Dados de tráfego a serem salvos
     * @return TrafficData salvo
     */
    TrafficData saveTrafficData(TrafficData data);
}