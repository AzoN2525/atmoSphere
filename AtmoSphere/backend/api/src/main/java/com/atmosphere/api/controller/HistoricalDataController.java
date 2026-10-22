package com.atmosphere.api.controller;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.CombinedHistoricalResponseDTO;
import com.atmosphere.api.model.dto.ExpandedAirQualityHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedNoiseHistoryDTO;
import com.atmosphere.api.model.dto.ExpandedTrafficHistoryDTO;
import com.atmosphere.api.model.dto.HistoricalDataResponseDTO;
import com.atmosphere.api.service.HistoricalDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/areas/{areaId}/history")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Historical Data", description = "Endpoints para dados históricos ambientais agregados por área")
public class HistoricalDataController {

    private final HistoricalDataService historicalDataService;

    @GetMapping
    @Operation(
        summary = "Histórico combinado",
        description = "Retorna dados históricos de AQI, ruído (Leq) e tráfego (vehicles/km) consolidados por timestamp, " +
                      "para uma área, agregados por hora ou dia. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico combinado obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CombinedHistoricalResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<CombinedHistoricalResponseDTO> getCombinedHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: HOURLY ou DAILY") @RequestParam(defaultValue = "HOURLY") AggregationPeriod aggregation) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico combinado: área={}, from={}, to={}, aggregation={}", areaId, resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(historicalDataService.getCombinedHistory(areaId, resolved[0], resolved[1], aggregation));
    }

    @GetMapping("/air-quality")
    @Operation(
        summary = "Histórico de qualidade do ar",
        description = "Retorna dados históricos de AQI para uma área, agregados por hora ou dia. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de qualidade do ar obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HistoricalDataResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<HistoricalDataResponseDTO> getAirQualityHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: HOURLY ou DAILY") @RequestParam(defaultValue = "HOURLY") AggregationPeriod aggregation) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico ar: área={}, from={}, to={}, aggregation={}", areaId, resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(historicalDataService.getAirQualityHistory(areaId, resolved[0], resolved[1], aggregation));
    }

    @GetMapping("/noise")
    @Operation(
        summary = "Histórico de ruído",
        description = "Retorna dados históricos de Leq (dB) para uma área, agregados por hora ou dia. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de ruído obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HistoricalDataResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<HistoricalDataResponseDTO> getNoiseHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: HOURLY ou DAILY") @RequestParam(defaultValue = "HOURLY") AggregationPeriod aggregation) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico ruído: área={}, from={}, to={}, aggregation={}", areaId, resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(historicalDataService.getNoiseHistory(areaId, resolved[0], resolved[1], aggregation));
    }

    @GetMapping("/traffic")
    @Operation(
        summary = "Histórico de tráfego",
        description = "Retorna dados históricos de densidade de tráfego (veículos/km) para uma área, agregados por hora ou dia. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico de tráfego obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HistoricalDataResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<HistoricalDataResponseDTO> getTrafficHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: HOURLY ou DAILY") @RequestParam(defaultValue = "HOURLY") AggregationPeriod aggregation) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico tráfego: área={}, from={}, to={}, aggregation={}", areaId, resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(historicalDataService.getTrafficHistory(areaId, resolved[0], resolved[1], aggregation));
    }

    @GetMapping("/traffic/expanded")
    @Operation(
        summary = "Histórico expandido de tráfego",
        description = "Retorna todos os campos discriminados de tráfego (velocidade, densidade, contagens por tipo de veículo, etc.) " +
                      "para uma área num intervalo de tempo. Sem agregação — cada registo corresponde a uma leitura real do sensor. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico expandido de tráfego obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ExpandedTrafficHistoryDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<ExpandedTrafficHistoryDTO> getExpandedTrafficHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico expandido tráfego: área={}, from={}, to={}", areaId, resolved[0], resolved[1]);
        return ResponseEntity.ok(historicalDataService.getExpandedTrafficHistory(areaId, resolved[0], resolved[1]));
    }

    @GetMapping("/noise/expanded")
    @Operation(
        summary = "Histórico expandido de ruído",
        description = "Retorna todos os campos discriminados de ruído (Leq, Lmax, Lmin, L10, L90, etc.) " +
                      "para uma área num intervalo de tempo. Sem agregação — cada registo corresponde a uma leitura real do sensor. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico expandido de ruído obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ExpandedNoiseHistoryDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<ExpandedNoiseHistoryDTO> getExpandedNoiseHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico expandido ruído: área={}, from={}, to={}", areaId, resolved[0], resolved[1]);
        return ResponseEntity.ok(historicalDataService.getExpandedNoiseHistory(areaId, resolved[0], resolved[1]));
    }

    @GetMapping("/air-quality/expanded")
    @Operation(
        summary = "Histórico expandido de qualidade do ar",
        description = "Retorna todos os campos discriminados de qualidade do ar (AQI europeu, PM10, PM2.5, CO, NO2, SO2, O3) " +
                      "para uma área num intervalo de tempo. Sem agregação — cada registo corresponde a uma leitura real do sensor. " +
                      "Se 'from'/'to' forem omitidos, o padrão é os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Histórico expandido de qualidade do ar obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ExpandedAirQualityHistoryDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<ExpandedAirQualityHistoryDTO> getExpandedAirQualityHistory(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-01T00:00:00") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Histórico expandido qualidade do ar: área={}, from={}, to={}", areaId, resolved[0], resolved[1]);
        return ResponseEntity.ok(historicalDataService.getExpandedAirQualityHistory(areaId, resolved[0], resolved[1]));
    }

    private LocalDateTime[] resolveTimeRange(LocalDateTime from, LocalDateTime to) {
        LocalDateTime resolvedTo   = (to   != null) ? to   : LocalDateTime.now();
        LocalDateTime resolvedFrom = (from  != null) ? from : resolvedTo.minusDays(7);
        return new LocalDateTime[]{resolvedFrom, resolvedTo};
    }
}
