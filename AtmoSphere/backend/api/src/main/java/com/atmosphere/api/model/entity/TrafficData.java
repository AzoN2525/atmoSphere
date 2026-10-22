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
 * Entidade para armazenar dados de tráfego.
 * Dados originados pelo TrafficAgent (Python).
 */
@Entity
@Table(name = "traffic_data", indexes = {
    @Index(name = "idx_traffic_data_area_ts", columnList = "area_id, timestamp"),
    @Index(name = "idx_traffic_data_sensor_ts", columnList = "sensor_id, timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficData {

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

    // Fluxo: Contagem total de veículos
    @Column(name = "flow_total_count")
    private Integer flowTotalCount;

    // Fluxo: Taxa de fluxo (veículos por hora)
    @Column(name = "flow_rate_h")
    private Integer flowRateH;

    // Fluxo: Densidade em veículos por km
    @Column(name = "density_k")
    private Double densityK;

    // Velocidade: Velocidade média (km/h)
    @Column(name = "avg_speed")
    private Double avgSpeed;

    // Velocidade: Percentil 85 (km/h)
    @Column(name = "speed_percentile_85")
    private Double speedPercentile85;

    // Ocupação: Percentagem de ocupação da pista
    @Column(name = "lane_occupancy_pct")
    private Double laneOccupancyPct;

    // Ocupação: Intervalo médio entre veículos (segundos)
    @Column(name = "avg_gap_seconds")
    private Double avgGapSeconds;

    // Classificação: Contagem de carros de passageiros
    @Column(name = "passenger_car_count")
    private Integer passengerCarCount;

    // Classificação: Contagem de camiões pesados
    @Column(name = "heavy_truck_count")
    private Integer heavyTruckCount;

    // Classificação: Contagem de motos
    @Column(name = "motorcycle_count")
    private Integer motorcycleCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
