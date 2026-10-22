package com.atmosphere.api.service;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.AreaSnapshotDTO;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Serviço principal para agregação de dados ambientais por área.
 * Orquestra os dados de qualidade do ar, ruído e tráfego para fornecer
 * uma visão consolidada do estado ambiental de cada zona.
 */
public interface AreaDataAggregationService {

    /**
     * Obtém o snapshot mais recente de uma área específica
     * @param areaId ID da área
     * @return AreaSnapshotDTO com dados agregados
     */
    AreaSnapshotDTO getAreaSnapshot(Long areaId);

    /**
     * Obtém snapshots de todas as áreas com dados mais recentes
     * @return Lista de AreaSnapshotDTO
     */
    List<AreaSnapshotDTO> getAllAreaSnapshots();

    /**
     * Obtém snapshots históricos de todas as áreas para um intervalo temporal.
     *
     * @return Lista de AreaSnapshotDTO com dados agregados do período
     */
    List<AreaSnapshotDTO> getHistoricalAreaSnapshots(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    /**
     * Atualiza o snapshot de uma área com dados mais recentes
     * @param areaId ID da área
     * @return AreaSnapshotDTO atualizado
     */
    AreaSnapshotDTO updateAreaSnapshot(Long areaId);
}
