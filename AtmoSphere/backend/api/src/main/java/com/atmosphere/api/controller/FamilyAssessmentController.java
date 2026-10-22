package com.atmosphere.api.controller;

import com.atmosphere.api.enums.AggregationPeriod;
import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.FamilyAssessmentDTO;
import com.atmosphere.api.service.FamilyAssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/areas")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Family Assessment", description = "Endpoints para avaliação ambiental orientada a famílias")
public class FamilyAssessmentController {

    private final FamilyAssessmentService familyAssessmentService;

    @GetMapping("/{areaId}/family-assessment")
    @Operation(
            summary = "Avaliar uma área para famílias",
            description = "Calcula a classificação family-friendly de uma área para um intervalo temporal. " +
                    "Se 'from'/'to' forem omitidos, o padrão é os últimos 6 meses.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação family-friendly obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = FamilyAssessmentDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<FamilyAssessmentDTO> getAreaAssessment(
            @Parameter(description = "ID da área") @PathVariable Long areaId,
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-05-30T23:59:59")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: MONTHLY, DAILY ou HOURLY")
            @RequestParam(defaultValue = "MONTHLY") AggregationPeriod aggregation) {
        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Avaliação family-friendly da área {} entre {} e {} ({})", areaId, resolved[0], resolved[1], aggregation);
        FamilyAssessmentDTO assessment = familyAssessmentService.getAreaFamilyAssessment(
                areaId, resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(assessment);
    }

    @GetMapping("/family-assessment")
    @Operation(
            summary = "Avaliar todas as áreas para famílias",
            description = "Calcula a classificação family-friendly de todas as áreas para um intervalo temporal. " +
                    "Se 'from'/'to' forem omitidos, o padrão é os últimos 6 meses.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Avaliação global family-friendly obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<FamilyAssessmentDTO>> getAllAreasAssessment(
            @Parameter(description = "Data/hora inicial (ISO 8601), ex: 2025-05-01T00:00:00")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Data/hora final (ISO 8601), ex: 2026-06-30T23:59:59")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @Parameter(description = "Agregação: MONTHLY, DAILY ou HOURLY")
            @RequestParam(defaultValue = "MONTHLY") AggregationPeriod aggregation) {
        LocalDateTime[] resolved = resolveTimeRange(from, to);
        log.info("Avaliação family-friendly de todas as áreas entre {} e {} ({})", resolved[0], resolved[1], aggregation);
        List<FamilyAssessmentDTO> assessments = familyAssessmentService.getAllAreasFamilyAssessment(
                resolved[0], resolved[1], aggregation);
        return ResponseEntity.ok(assessments);
    }

    private LocalDateTime[] resolveTimeRange(LocalDateTime from, LocalDateTime to) {
        LocalDateTime resolvedTo = to != null ? to : LocalDateTime.now();
        LocalDateTime resolvedFrom = from != null ? from : resolvedTo.minusMonths(6);
        return new LocalDateTime[] { resolvedFrom, resolvedTo };
    }
}
