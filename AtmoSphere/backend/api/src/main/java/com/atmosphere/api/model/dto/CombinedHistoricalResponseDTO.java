package com.atmosphere.api.model.dto;

import com.atmosphere.api.enums.AggregationPeriod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombinedHistoricalResponseDTO {
    private Long areaId;
    private String areaName;
    private AggregationPeriod aggregation;
    private LocalDateTime from;
    private LocalDateTime to;
    private List<CombinedHistoricalDataPointDTO> data;
}
