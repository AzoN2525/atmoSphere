package com.atmosphere.api.model.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO padronizado para respostas de erro da API
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorDTO {

    /**
     * Timestamp do erro
     */
    private LocalDateTime timestamp;

    /**
     * Código HTTP de status
     */
    private Integer status;

    /**
     * Tipo de erro (ex: "Bad Request", "Not Found", "Internal Server Error")
     */
    private String error;

    /**
     * Mensagem de erro amigável ao utilizador
     */
    private String message;

    /**
     * Path do endpoint que gerou o erro
     */
    private String path;

    /**
     * Detalhes adicionais (ex: validações de campos)
     */
    private Map<String, Object> details;

    /**
     * Lista de erros de validação específicos
     */
    private List<ValidationErrorDTO> validationErrors;

    /**
     * ID de rastreamento para debug/logs
     */
    private String traceId;
}
