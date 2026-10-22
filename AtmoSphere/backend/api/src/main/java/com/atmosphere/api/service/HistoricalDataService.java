package com.atmosphere.api.service;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.CombinedHistoricalResponseDTO;
import com.atmosphere.api.model.dto.ExpandedAirQualityHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedNoiseHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedTrafficHistoryDTO;
import com.atmosphere.api.model.dto.HistoricalDataResponseDTO;

import java.time.LocalDateTime;

public interface HistoricalDataService {

    HistoricalDataResponseDTO getAirQualityHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    HistoricalDataResponseDTO getNoiseHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    HistoricalDataResponseDTO getTrafficHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    CombinedHistoricalResponseDTO getCombinedHistory(Long areaId, LocalDateTime from, LocalDateTime to, AggregationPeriod aggregation);

    ExpandedTrafficHistoryDTO getExpandedTrafficHistory(Long areaId, LocalDateTime from, LocalDateTime to);

    ExpandedNoiseHistoryDTO getExpandedNoiseHistory(Long areaId, LocalDateTime from, LocalDateTime to);

    ExpandedAirQualityHistoryDTO getExpandedAirQualityHistory(Long areaId, LocalDateTime from, LocalDateTime to);
}
