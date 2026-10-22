package com.atmosphere.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Configuração Jackson para serialização/desserialização JSON
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        // Registrar módulo para suporte a tipos Java 8 (LocalDateTime, etc.)
        objectMapper.registerModule(new JavaTimeModule());
        return objectMapper;
    }
}