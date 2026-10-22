package com.atmosphere.api.model.dto;

import com.atmosphere.api.enums.AggregationPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para resposta de frequência de hotspots.
 * Contém a evolução temporal do número de hotspots e alertas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotspotFrequencyResponseDTO {

    private Long areaId;
    private AggregationPeriod aggregation;
    private LocalDateTime from;
    private LocalDateTime to;
    private List<HotspotFrequencyPointDTO> data;
}
