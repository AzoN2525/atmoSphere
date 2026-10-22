package com.atmosphere.api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

import com.atmosphere.api.enums.IndicatorStatus;


@Entity
@Table(name = "area_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AreaSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "area_id", nullable= false, unique = true)
    private Area area;

    private LocalDateTime updatedAt;

    // Normalised 0-100 indices (higher = better quality)
    private Double airQualityIndex;
    private Double noiseIndex;
    private Double trafficIndex;
    private Double overallIndex;

    @Enumerated(EnumType.STRING)
    private IndicatorStatus airStatus;

    @Enumerated(EnumType.STRING)
    private IndicatorStatus noiseStatus;

    @Enumerated(EnumType.STRING)
    private IndicatorStatus trafficStatus;

    @Enumerated(EnumType.STRING)
    private IndicatorStatus overallStatus;
}
