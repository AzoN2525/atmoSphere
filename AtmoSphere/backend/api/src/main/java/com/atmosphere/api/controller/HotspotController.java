package com.atmosphere.api.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.HotspotDTO;
import com.atmosphere.api.model.dto.HotspotFrequencyResponseDTO;
import com.atmosphere.api.service.HotspotService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/hotspots")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Hotspots", description = "Endpoints para deteção de hotspots ambientais por área")
public class HotspotController {

    private final HotspotService hotspotService;

    @GetMapping
    @Operation(
        summary = "Listar hotspots ambientais",
        description = "Retorna áreas onde um ou mais indicadores excederam limites configurados. "
                + "Quando from/to não são enviados, considera a última hora como visão real-time."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de hotspots obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "400", description = "Filtros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<HotspotDTO>> getHotspots(
            @Parameter(description = "ID da área") @RequestParam(required = false) Long areaId,
            @Parameter(description = "Tipo de indicador: AIR_QUALITY, NOISE ou TRAFFIC") @RequestParam(required = false) IndicatorType indicatorType,
            @Parameter(description = "Data inicial ISO 8601") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data final ISO 8601") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        log.info("Listando hotspots: areaId={}, indicatorType={}, from={}, to={}", areaId, indicatorType, from, to);
        return ResponseEntity.ok(hotspotService.getHotspots(areaId, indicatorType, from, to));
    }

    @GetMapping("/frequency")
    @Operation(
        summary = "Obter frequência de hotspots",
        description = "Retorna a evolução temporal do número de hotspots por período de agregação."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Frequência de hotspots obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HotspotFrequencyResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<HotspotFrequencyResponseDTO> getHotspotFrequency(
            @Parameter(description = "ID da área")
            @RequestParam(required = false) Long areaId,

            @Parameter(description = "Data inicial ISO 8601 | ex: 2025-05-01T00:00:00")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,

            @Parameter(description = "Data final ISO 8601 | ex: 2026-05-01T00:00:00")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,

            @Parameter(description = "Agregação: HOURLY, DAILY ou MONTHLY")
            @RequestParam(defaultValue = "DAILY")
            AggregationPeriod aggregation
    ) {
        log.info(
                "Obtendo frequência de hotspots: areaId={}, from={}, to={}, aggregation={}",
                areaId,
                from,
                to,
                aggregation
        );

        return ResponseEntity.ok(
                hotspotService.getHotspotFrequency(areaId, from, to, aggregation)
        );
    }
}
