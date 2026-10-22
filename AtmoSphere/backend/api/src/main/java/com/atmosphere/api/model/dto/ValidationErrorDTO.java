package com.atmosphere.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para erros de validação específicos de campos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidationErrorDTO {

    /**
     * Nome do campo com erro
     */
    private String field;

    /**
     * Mensagem descritiva do erro
     */
    private String message;

    /**
     * Valor rejeitado (opcional)
     */
    private Object rejectedValue;
}
