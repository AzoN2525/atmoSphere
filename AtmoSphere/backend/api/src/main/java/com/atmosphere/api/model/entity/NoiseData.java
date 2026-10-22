package com.atmosphere.api.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidade para armazenar dados de ruído.
 * Dados originados pelo NoiseAgent (Python).
 */
@Entity
@Table(name = "noise_data", indexes = {
    @Index(name = "idx_noise_data_area_ts", columnList = "area_id, timestamp"),
    @Index(name = "idx_noise_data_sensor_ts", columnList = "sensor_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoiseData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Valor instantâneo do som (dB)
    @Column(name = "current_value")
    private Double currentValue;

    // Média energética do ruído ao longo do tempo (principal indicador)
    @Column(name = "leq")
    private Double leq;

    // Valor máximo registado (pico mais alto)
    @Column(name = "lmax")
    private Double lmax;

    // Valor mínimo registado (momento mais silencioso)
    @Column(name = "lmin")
    private Double lmin;

    // Nível ultrapassado em 10% do tempo (representa picos/ruídos altos)
    @Column(name = "l10")
    private Double l10;

    // Nível ultrapassado em 90% do tempo (ruído de fundo/base)
    @Column(name = "l90")
    private Double l90;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
