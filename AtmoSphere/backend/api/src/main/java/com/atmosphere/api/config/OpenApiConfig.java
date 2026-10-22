package com.atmosphere.api.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI atmosphereOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AtmoSphere API")
                        .version("1.0.0")
                        .description("""
                                API REST do sistema AtmoSphere para monitorização ambiental urbana.
                                
                                Permite consultar áreas, snapshots ambientais, histórico,
                                KPIs de sustentabilidade, hotspots, alertas e avaliações
                                orientadas a famílias.
                                """))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Ambiente local"),
                        new Server().url("http://localhost").description("Ambiente via gateway/proxy")
                ));
    }
}