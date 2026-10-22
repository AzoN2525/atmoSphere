package com.atmosphere.api.model.dto;

import com.atmosphere.api.enums.AggregationPeriod;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyAssessmentDTO {
    private Long areaId;
    private String areaName;
    private String assessment;
    private Double overallIndex;
    private Double suitablePeriodsPercentage;
    private Integer evaluatedPeriods;
    private AggregationPeriod aggregation;
    private LocalDateTime from;
    private LocalDateTime to;
    private FamilyIndicatorBreakdownDTO indicatorBreakdown;
}
