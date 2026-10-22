package com.atmosphere.api.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.AirQualityDTO;
import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.AreaSnapshotDTO;
import com.atmosphere.api.model.dto.NoiseDTO;
import com.atmosphere.api.model.dto.TrafficDTO;
import com.atmosphere.api.service.AirService;
import com.atmosphere.api.service.AreaDataAggregationService;
import com.atmosphere.api.service.NoiseService;
import com.atmosphere.api.service.TrafficService;

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
@RequestMapping("/api/v1/areas/snapshots")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Snapshots", description = "Endpoints para dados ambientais agregados das áreas")
public class AreaSnapshotsController {

    private final AreaDataAggregationService aggregationService;
    private final AirService airService;
    private final NoiseService noiseService;
    private final TrafficService trafficService;

    @GetMapping
    @Operation(summary = "Obter snapshots de todas as áreas", description = "Retorna dados ambientais agregados de todas as áreas da cidade")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de snapshots obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AreaSnapshotDTO>> getAllAreaSnapshots() {
        log.info("Obtendo snapshots de todas as áreas");
        List<AreaSnapshotDTO> snapshots = aggregationService.getAllAreaSnapshots();
        return ResponseEntity.ok(snapshots);
    }

    @GetMapping("/history")
    @Operation(summary = "Obter snapshots históricos de todas as áreas", description = "Retorna dados ambientais agregados de todas as áreas para um intervalo temporal")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de snapshots históricos obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "400", description = "Filtros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AreaSnapshotDTO>> getHistoricalAreaSnapshots(
            @Parameter(description = "Data/hora inicial, inclusive")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final, exclusive")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: HOURLY, DAILY ou MONTHLY")
            @RequestParam(defaultValue = "DAILY") AggregationPeriod aggregation) {
        log.info("Obtendo snapshots históricos de todas as áreas: from={}, to={}, aggregation={}", from, to, aggregation);
        List<AreaSnapshotDTO> snapshots = aggregationService.getHistoricalAreaSnapshots(from, to, aggregation);
        return ResponseEntity.ok(snapshots);
    }

    @GetMapping("/{areaId}")
    @Operation(summary = "Obter snapshot de uma área específica", description = "Retorna dados ambientais agregados de uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Snapshot obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AreaSnapshotDTO.class))),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AreaSnapshotDTO> getAreaSnapshot(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Obtendo snapshot da área: {}", areaId);
        AreaSnapshotDTO snapshot = aggregationService.getAreaSnapshot(areaId);
        return ResponseEntity.ok(snapshot);
    }

    @PutMapping("/{areaId}/refresh")
    @Operation(summary = "Atualizar snapshot de uma área", description = "Força a atualização dos dados ambientais de uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Snapshot atualizado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AreaSnapshotDTO.class))),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AreaSnapshotDTO> refreshAreaSnapshot(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Atualizando snapshot da área: {}", areaId);
        AreaSnapshotDTO updatedSnapshot = aggregationService.updateAreaSnapshot(areaId);
        return ResponseEntity.ok(updatedSnapshot);
    }

    @GetMapping("/{areaId}/air-quality")
    @Operation(summary = "Obter dados de qualidade do ar de uma área", description = "Retorna os dados mais recentes de qualidade do ar de uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dados de qualidade do ar obtidos com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AirQualityDTO.class))),
            @ApiResponse(responseCode = "204", description = "Sem dados de qualidade do ar disponíveis para a área"),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AirQualityDTO> getAreaAirQuality(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Obtendo dados de qualidade do ar da área: {}", areaId);
        AirQualityDTO airQuality = airService.getLatestAirQualityByArea(areaId);
        return airQuality != null ? ResponseEntity.ok(airQuality) : ResponseEntity.noContent().build();
    }

    @GetMapping("/{areaId}/noise")
    @Operation(summary = "Obter dados de ruído de uma área", description = "Retorna os dados mais recentes de ruído de uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dados de ruído obtidos com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = NoiseDTO.class))),
            @ApiResponse(responseCode = "204", description = "Sem dados de ruído disponíveis para a área"),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<NoiseDTO> getAreaNoise(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Obtendo dados de ruído da área: {}", areaId);
        NoiseDTO noise = noiseService.getLatestNoiseByArea(areaId);
        return noise != null ? ResponseEntity.ok(noise) : ResponseEntity.noContent().build();
    }

    @GetMapping("/{areaId}/traffic")
    @Operation(summary = "Obter dados de tráfego de uma área", description = "Retorna os dados mais recentes de tráfego de uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dados de tráfego obtidos com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = TrafficDTO.class))),
            @ApiResponse(responseCode = "204", description = "Sem dados de tráfego disponíveis para a área"),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<TrafficDTO> getAreaTraffic(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Obtendo dados de tráfego da área: {}", areaId);
        TrafficDTO traffic = trafficService.getLatestTrafficByArea(areaId);
        return traffic != null ? ResponseEntity.ok(traffic) : ResponseEntity.noContent().build();
    }
}
