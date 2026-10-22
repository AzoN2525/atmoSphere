package com.atmosphere.api.controller;

import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.KpiDTO;
import com.atmosphere.api.service.KpiService;
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
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "KPIs", description = "Endpoints para KPIs de sustentabilidade")
public class KpiController {

    private final KpiService kpiService;

    @GetMapping
    @Operation(summary = "Obter KPIs de sustentabilidade",
               description = "Retorna os KPIs calculados para o período especificado")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "KPIs obtidos com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = KpiDTO.class))),
            @ApiResponse(responseCode = "400", description = "Parâmetros inválidos (data inválida ou data inicial após data final)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<KpiDTO> getKpis(
            @Parameter(description = "ID da área")
            @RequestParam(required = false)
            Long areaId,

            @Parameter(description = "Data de início (formato: 2025-05-01T00:00:00)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @Parameter(description = "Data de fim (formato: 2026-05-01T00:00:00)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate) {

        // Valores padrão: últimas 24 horas
        if (startDate == null) {
            startDate = LocalDateTime.now().minusDays(1);
        }
        if (endDate == null) {
            endDate = LocalDateTime.now();
        }

        // Validação: data inicial não pode ser após data final
        if (startDate.isAfter(endDate)) {
            log.warn("Datas inválidas: startDate {} é após endDate {}", startDate, endDate);
            throw new IllegalArgumentException("A data de início não pode ser posterior à data de fim");
        }

        log.info("Obtendo KPIs para areaId={} de {} a {}", areaId, startDate, endDate);
        KpiDTO kpis = kpiService.calculateKpis(areaId, startDate, endDate);
        return ResponseEntity.ok(kpis);
    }
}