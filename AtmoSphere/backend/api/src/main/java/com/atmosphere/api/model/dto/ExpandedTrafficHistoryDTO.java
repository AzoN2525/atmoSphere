package com.atmosphere.api.model.dto;

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
public class ExpandedTrafficHistoryDTO {
    private Long areaId;
    private String areaName;
    private LocalDateTime from;
    private LocalDateTime to;
    private List<TrafficDTO> data;
}
