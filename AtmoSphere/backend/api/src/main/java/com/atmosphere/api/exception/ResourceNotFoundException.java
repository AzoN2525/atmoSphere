package com.atmosphere.api.exception;

/**
 * Exceção customizada para recurso não encontrado
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resource;
    private final String identifier;

    public ResourceNotFoundException(String resource, String identifier) {
        super(String.format("%s com identificador '%s' não foi encontrado", resource, identifier));
        this.resource = resource;
        this.identifier = identifier;
    }

    public ResourceNotFoundException(String resource, Long id) {
        this(resource, String.valueOf(id));
    }

    public String getResource() {
        return resource;
    }

    public String getIdentifier() {
        return identifier;
    }
}
