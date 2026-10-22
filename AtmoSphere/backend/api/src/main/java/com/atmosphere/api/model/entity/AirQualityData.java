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
 * Entidade para armazenar dados de qualidade do ar.
 * Dados originados pelo AirAgent (Python).
 */
@Entity
@Table(name = "air_quality_data", indexes = {
    @Index(name = "idx_air_quality_data_area_ts", columnList = "area_id, timestamp"),
    @Index(name = "idx_air_quality_data_sensor_ts", columnList = "sensor_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AirQualityData {

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

    // Índice Europeu de Qualidade do Ar (1-100)
    @Column(name = "european_aqi")
    private Integer europeanAqi;

    // Particulado PM10 (µg/m³)
    @Column(name = "pm10")
    private Double pm10;

    // Particulado PM2.5 (µg/m³)
    @Column(name = "pm25")
    private Double pm25;

    // Monóxido de Carbono (ppm)
    @Column(name = "co")
    private Double co;

    // Dióxido de Nitrogénio (µg/m³)
    @Column(name = "no2")
    private Double no2;

    // Dióxido de Enxofre (µg/m³)
    @Column(name = "so2")
    private Double so2;

    // Ozônio (µg/m³)
    @Column(name = "o3")
    private Double o3;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
