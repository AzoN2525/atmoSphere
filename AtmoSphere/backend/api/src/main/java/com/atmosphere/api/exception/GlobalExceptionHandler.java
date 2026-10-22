package com.atmosphere.api.exception;

import com.atmosphere.api.model.dto.ApiErrorDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Controlador global de exceções para tratamento consistente de erros
 * Implementa padrão REST com códigos de status HTTP apropriados
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Trata exceções de recurso não encontrado (404)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorDTO> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Recurso não encontrado: {}", traceId, ex.getMessage());

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Trata exceções de operação inválida (400)
     */
    @ExceptionHandler(InvalidOperationException.class)
    public ResponseEntity<ApiErrorDTO> handleInvalidOperationException(
            InvalidOperationException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Operação inválida: {}", traceId, ex.getMessage());

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage())
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Trata exceções de validação de argumentos (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDTO> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Erro de validação de argumentos", traceId);

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message("Erro de validação nos parâmetros da requisição")
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Trata exceções de tipo incorreto em argumentos de método (400)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorDTO> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Tipo de argumento inválido: {}", traceId, ex.getMessage());

        String message = String.format(
                "Tipo inválido para o parâmetro '%s': esperado %s, recebido %s",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "desconhecido",
                ex.getValue()
        );

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(message)
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Trata exceções de endpoint não encontrado (404)
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ApiErrorDTO> handleNoHandlerFoundException(
            NoHandlerFoundException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Endpoint não encontrado: {} {}", traceId, ex.getHttpMethod(), ex.getRequestURL());

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(String.format("Endpoint '%s %s' não foi encontrado", ex.getHttpMethod(), ex.getRequestURL()))
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Trata exceções de argumento ilegal (400)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorDTO> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Argumento ilegal: {}", traceId, ex.getMessage());

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .message(ex.getMessage() != null ? ex.getMessage() : "Argumento inválido fornecido")
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * Trata exceções de estado ilegal (409)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorDTO> handleIllegalStateException(
            IllegalStateException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.warn("[{}] Estado ilegal: {}", traceId, ex.getMessage());

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Conflict")
                .message(ex.getMessage() != null ? ex.getMessage() : "Estado inválido para a operação")
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

  
    /**
     * Trata todas as outras RuntimeExceptions (500)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiErrorDTO> handleRuntimeException(
            RuntimeException ex, WebRequest request) {
        String traceId = generateTraceId();
        log.error("[{}] Erro de runtime não esperado", traceId, ex);

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Ocorreu um erro inesperado no processamento da requisição")
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Trata todas as outras exceções genéricas (500)
     * Fallback para exceções não previstas
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDTO> handleGenericException(
            Exception ex, WebRequest request) {


        String traceId = generateTraceId();
        log.error("[{}] Erro genérico não esperado", traceId, ex);

        ApiErrorDTO errorResponse = ApiErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Ocorreu um erro interno no servidor")
                .path(extractPath(request))
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Extrai o path da requisição
     */
    private String extractPath(WebRequest request) {
        String path = request.getDescription(false);
        return path.startsWith("uri=") ? path.substring(4) : path;
    }

    /**
     * Gera um ID único para rastreamento de erros
     */
    private String generateTraceId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}