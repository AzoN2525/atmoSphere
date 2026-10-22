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
public class HistoricalDataResponseDTO {
    private Long areaId;
    private String areaName;
    private String indicator;
    private AggregationPeriod aggregation;
    private LocalDateTime from;
    private LocalDateTime to;
    private String unit;
    private List<HistoricalDataPointDTO> data;
}
