package com.atmosphere.api.controller;

import com.atmosphere.api.model.dto.ApiErrorDTO;
import com.atmosphere.api.model.dto.AmenityCountsDTO;
import com.atmosphere.api.model.dto.AreaDTO;
import com.atmosphere.api.service.AmenityService;
import com.atmosphere.api.service.AreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/areas")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Areas", description = "Endpoints para gestão de áreas geográficas")
public class AreaController {

    private final AreaService areaService;
    private final AmenityService amenityService;

    @GetMapping()
    @Operation(summary = "Listar todas as áreas",
               description = "Retorna uma lista de todas as áreas geográficas da cidade")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de áreas obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(type = "array"))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<List<AreaDTO>> getAllAreas() {
        log.info("Obtendo lista de todas as áreas");
        List<AreaDTO> areas = areaService.getAllAreas();
        return ResponseEntity.ok(areas);
    }

    @GetMapping("/amenities")
    @Operation(summary = "Obter amenities próximas",
               description = "Retorna contagens de amenities num raio de 20km das coordenadas indicadas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Amenities obtidas com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AmenityCountsDTO.class))),
            @ApiResponse(responseCode = "400", description = "Coordenadas inválidas",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AmenityCountsDTO> getAmenities(
            @Parameter(description = "Latitude") @RequestParam Double latitude,
            @Parameter(description = "Longitude") @RequestParam Double longitude) {
        log.info("Obtendo amenities próximas de latitude={}, longitude={}", latitude, longitude);
        return ResponseEntity.ok(amenityService.getAmenityCounts(latitude, longitude));
    }

    @GetMapping("/{areaId}")
    @Operation(summary = "Obter área por ID",
               description = "Retorna os detalhes de uma área específica pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Área obtida com sucesso",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AreaDTO.class))),
            @ApiResponse(responseCode = "400", description = "ID da área inválido",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "Área não encontrada",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "Erro interno do servidor",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiErrorDTO.class)))
    })
    public ResponseEntity<AreaDTO> getAreaById(
            @Parameter(description = "ID da área") @PathVariable Long areaId) {
        log.info("Obtendo área por ID: {}", areaId);
        AreaDTO area = areaService.getAreaById(areaId);
        return ResponseEntity.ok(area);
    }
}
