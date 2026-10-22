package com.atmosphere.api.exception;

/**
 * Exceção customizada para operações inválidas ou violação de regras de negócio
 */
public class InvalidOperationException extends RuntimeException {

    private final String operationName;
    private final String reason;

    public InvalidOperationException(String operationName, String reason) {
        super(String.format("Operação inválida '%s': %s", operationName, reason));
        this.operationName = operationName;
        this.reason = reason;
    }

    public InvalidOperationException(String message) {
        super(message);
        this.operationName = null;
        this.reason = null;
    }

    public String getOperationName() {
        return operationName;
    }

    public String getReason() {
        return reason;
    }
}
