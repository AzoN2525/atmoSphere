package com.atmosphere.api.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.exception.ResourceNotFoundException;
import com.atmosphere.api.model.dto.AreaDTO;
import com.atmosphere.api.repository.AreaRepository;
import com.atmosphere.api.service.AreaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementação do serviço de áreas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AreaServiceImpl implements AreaService {

    private final AreaRepository areaRepository;

    @Override
    public List<AreaDTO> getAllAreas() {
        return areaRepository.findAllByOrderByNameAsc().stream()
                .map(AreaDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public AreaDTO getAreaById(Long areaId) {
        validateAreaId(areaId, "obter área por id");
        return areaRepository.findById(areaId)
                .map(AreaDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Área", areaId));
    }

    @Override
    public AreaDTO getAreaByName(String name) {
        validateAreaName(name, "obter área por nome");
        return areaRepository.findByName(name)
                .map(AreaDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Área", name));
    }

    @Override
    public boolean areaExists(Long areaId) {
        validateAreaId(areaId, "validar existência de área");
        return areaRepository.existsById(areaId);
    }

    private void validateAreaId(Long areaId, String operation) {
        if (areaId == null || areaId <= 0) {
            throw new InvalidOperationException(operation, "areaId deve ser maior que 0");
        }
    }

    private void validateAreaName(String name, String operation) {
        if (name == null || name.isBlank()) {
            throw new InvalidOperationException(operation, "nome da área é obrigatório");
        }
    }
}

