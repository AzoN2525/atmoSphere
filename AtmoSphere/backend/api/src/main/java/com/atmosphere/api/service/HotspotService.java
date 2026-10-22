package com.atmosphere.api.service;

import java.time.LocalDateTime;
import java.util.List;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.dto.HotspotDTO;
import com.atmosphere.api.model.dto.HotspotFrequencyResponseDTO;

public interface HotspotService {

    /**
     * Returns environmental hotspots grouped by area.
     * Default aggregation window is the last hour when from/to are omitted.
     */
    List<HotspotDTO> getHotspots(Long areaId, IndicatorType indicatorType, LocalDateTime from, LocalDateTime to);

    /**
     * Retorna a frequência de hotspots ao longo do tempo.
     * @param areaId ID da área (opcional)
     * @param from Data inicial (opcional)
     * @param to Data final (opcional)
     * @param aggregation Período de agregação (HOURLY, DAILY ou MONTHLY)
     * @return Resposta com a evolução temporal de hotspots e alertas
     */
    HotspotFrequencyResponseDTO getHotspotFrequency(
            Long areaId,
            LocalDateTime from,
            LocalDateTime to,
            AggregationPeriod aggregation
    );
}
