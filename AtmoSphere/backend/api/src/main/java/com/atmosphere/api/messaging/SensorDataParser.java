package com.atmosphere.api.messaging;

import com.atmosphere.api.model.entity.AirQualityData;
import com.atmosphere.api.model.entity.NoiseData;
import com.atmosphere.api.model.entity.TrafficData;

public interface SensorDataParser {
    AirQualityData parseAirQuality(String payload);
    NoiseData parseNoiseData(String payload);
    TrafficData parseTrafficData(String payload);
}