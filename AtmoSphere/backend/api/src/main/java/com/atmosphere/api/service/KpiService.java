package com.atmosphere.api.service;

import com.atmosphere.api.model.dto.KpiDTO;

import java.time.LocalDateTime;

/**
 * Serviço para cálculo de KPIs de sustentabilidade.
 */
public interface KpiService {

    /**
     * Calcula os KPIs para o período especificado.
     * @param areaId ID da área (opcional, se null calcula para todas as áreas)
     * @param startDate Data de início (opcional, padrão: 24h atrás)
     * @param endDate Data de fim (opcional, padrão: agora)
     * @return KpiDTO com os valores calculados
     */
    KpiDTO calculateKpis(Long areaId, LocalDateTime startDate, LocalDateTime endDate);
}