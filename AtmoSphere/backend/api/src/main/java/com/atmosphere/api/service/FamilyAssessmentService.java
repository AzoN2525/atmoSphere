package com.atmosphere.api.service;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.FamilyAssessmentDTO;
import java.time.LocalDateTime;
import java.util.List;

public interface FamilyAssessmentService {

    FamilyAssessmentDTO getAreaFamilyAssessment(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    List<FamilyAssessmentDTO> getAllAreasFamilyAssessment(LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);
}
