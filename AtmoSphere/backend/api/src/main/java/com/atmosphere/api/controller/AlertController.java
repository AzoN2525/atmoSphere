package com.atmosphere.api.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.atmosphere.api.enums.IndicatorType;
import com.atmosphere.api.model.dto.AlertDTO;
import com.atmosphere.api.model.dto.AlertThresholdDTO;
import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.service.AlertService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Alerts", description = "Endpoints para gestão de alertas ambientais e configuração de limites")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    @Operation(
        summary = "Listar alertas ambientais",
        description = "Retorna alertas filtrados por área, tipo de indicador e intervalo de datas. Por omissão devolve os últimos 7 dias."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de alertas obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AlertDTO>> getAlerts(
            @Parameter(description = "ID da área geográfica") @RequestParam(required = false) Long areaId,
            @Parameter(description = "Tipo de indicador: AIR_QUALITY, NOISE ou TRAFFIC") @RequestParam(required = false) IndicatorType indicatorType,
            @Parameter(description = "Data inicial (ISO 8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data final (ISO 8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        log.info("Listando alertas: areaId={}, indicatorType={}, from={}, to={}", areaId, indicatorType, from, to);
        return ResponseEntity.ok(alertService.getAlerts(areaId, indicatorType, from, to));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter detalhe de um alerta", description = "Retorna os dados completos de um alerta específico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alerta obtido com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AlertDTO.class))),
            @ApiResponse(responseCode = "404", description = "Alerta não encontrado",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AlertDTO> getAlertById(
            @Parameter(description = "ID do alerta") @PathVariable Long id) {
        log.info("Obtendo alerta: {}", id);
        return ResponseEntity.ok(alertService.getAlertById(id));
    }

    @GetMapping("/thresholds")
    @Operation(summary = "Listar todos os limites configurados", description = "Retorna todos os thresholds de alerta definidos para as áreas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de thresholds obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AlertThresholdDTO>> getAllThresholds() {
        log.info("Listando todos os thresholds");
        return ResponseEntity.ok(alertService.getAllThresholds());
    }

    @GetMapping("/thresholds/area/{areaId}")
    @Operation(summary = "Listar limites de uma área", description = "Retorna os thresholds de alerta configurados para uma área específica")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Thresholds da área obtidos com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AlertThresholdDTO>> getThresholdsByArea(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Listando thresholds da área: {}", areaId);
        return ResponseEntity.ok(alertService.getThresholdsByArea(areaId));
    }

    @PutMapping("/thresholds")
    @Operation(
        summary = "Criar ou actualizar um limite",
        description = "Cria ou actualiza o threshold de alerta para um par (área, tipo de indicador). Se já existir, substitui o valor."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Threshold guardado com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AlertThresholdDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AlertThresholdDTO> saveThreshold(
            @Valid @RequestBody AlertThresholdDTO dto) {
        log.info("Guardando threshold: área={}, tipo={}, valor={}", dto.getAreaId(), dto.getIndicatorType(), dto.getThresholdValue());
        return ResponseEntity.ok(alertService.saveThreshold(dto));
    }
}
