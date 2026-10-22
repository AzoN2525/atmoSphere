package com.atmosphere.api.service;

import com.atmosphere.api.model.dto.AreaDTO;
import java.util.List;

/**
 * Serviço para operações CRUD e consultas de áreas
 */
public interface AreaService {

    /**
     * Obtém todas as áreas ordenadas por nome
     * @return Lista de AreaDTO
     */
    List<AreaDTO> getAllAreas();

    /**
     * Obtém uma área pelo ID
     * @param areaId ID da área
     * @return AreaDTO
     */
    AreaDTO getAreaById(Long areaId);

    /**
     * Obtém uma área pelo nome
     * @param name Nome da área
     * @return AreaDTO
     */
    AreaDTO getAreaByName(String name);

    /**
     * Verifica se uma área existe
     * @param areaId ID da área
     * @return true se existir
     */
    boolean areaExists(Long areaId);
}