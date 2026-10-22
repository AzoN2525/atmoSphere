package com.atmosphere.api.service.impl;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.atmosphere.api.exception.InvalidOperationException;
import com.atmosphere.api.model.dto.AmenityCountsDTO;
import com.atmosphere.api.service.AmenityService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AmenityServiceImpl implements AmenityService {

    private static final String[] OVERPASS_API_URLS = {
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.openstreetmap.ru/api/interpreter"
    };
    private static final int SEARCH_RADIUS_METERS = 1_000;
    private static final int MAX_ATTEMPTS = 3;
    private static final Duration CACHE_TTL = Duration.ofHours(12);

    private final ObjectMapper objectMapper;
    private final ConcurrentMap<String, CachedAmenityCounts> cache = new ConcurrentHashMap<>();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public AmenityCountsDTO getAmenityCounts(Double latitude, Double longitude) {
        validateCoordinates(latitude, longitude);
        String cacheKey = buildCacheKey(latitude, longitude);
        CachedAmenityCounts cachedCounts = cache.get(cacheKey);

        if (cachedCounts != null && !cachedCounts.isExpired()) {
            return cachedCounts.counts();
        }

        try {
            JsonNode elements = fetchOverpassCounts(latitude, longitude).path("elements");
            AmenityCounter counter = countAmenities(elements, latitude, longitude);

            AmenityCountsDTO counts = AmenityCountsDTO.builder()
                    .schools(counter.schools)
                    .museums(counter.museums)
                    .hospitals(counter.hospitals)
                    .parks(counter.parks)
                    .build();
            cache.put(cacheKey, new CachedAmenityCounts(counts, System.currentTimeMillis()));

            return counts;
        } catch (IOException exception) {
            log.warn("Erro ao processar resposta da Overpass API", exception);
            return getStaleCacheOrThrow(cachedCounts);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return getStaleCacheOrThrow(cachedCounts);
        } catch (IllegalStateException exception) {
            log.warn("Erro ao obter amenities da Overpass API", exception);
            return getStaleCacheOrThrow(cachedCounts);
        }
    }

    private JsonNode fetchOverpassCounts(Double latitude, Double longitude) throws IOException, InterruptedException {
        String requestBody = "data=" + URLEncoder.encode(buildOverpassQuery(latitude, longitude), StandardCharsets.UTF_8);

        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            String apiUrl = OVERPASS_API_URLS[attempt % OVERPASS_API_URLS.length];
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .timeout(Duration.ofSeconds(20))
                        .header("Content-Type", "application/x-www-form-urlencoded")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    return objectMapper.readTree(response.body());
                }

                log.warn("Overpass API {} devolveu status {} na tentativa {}: {}",
                        apiUrl, response.statusCode(), attempt + 1, response.body());
            } catch (IOException exception) {
                if (attempt == MAX_ATTEMPTS - 1) {
                    throw exception;
                }
                log.warn("Falha ao chamar Overpass API na tentativa {}", attempt + 1, exception);
            }

            Thread.sleep(300L * (attempt + 1));
        }

        throw new IllegalStateException("Não foi possível carregar as amenities");
    }

    private String buildOverpassQuery(Double latitude, Double longitude) {
        return """
                [out:json][timeout:25];
                (
                  node["amenity"="school"](around:%d,%f,%f);
                  way["amenity"="school"](around:%d,%f,%f);
                  relation["amenity"="school"](around:%d,%f,%f);
                  node["tourism"="museum"](around:%d,%f,%f);
                  way["tourism"="museum"](around:%d,%f,%f);
                  relation["tourism"="museum"](around:%d,%f,%f);
                  node["amenity"~"^(hospital|clinic|doctors)$"](around:%d,%f,%f);
                  way["amenity"~"^(hospital|clinic|doctors)$"](around:%d,%f,%f);
                  relation["amenity"~"^(hospital|clinic|doctors)$"](around:%d,%f,%f);
                  node["leisure"~"^(park|garden)$"](around:%d,%f,%f);
                  way["leisure"~"^(park|garden)$"](around:%d,%f,%f);
                  relation["leisure"~"^(park|garden)$"](around:%d,%f,%f);
                  node["landuse"="recreation_ground"](around:%d,%f,%f);
                  way["landuse"="recreation_ground"](around:%d,%f,%f);
                  relation["landuse"="recreation_ground"](around:%d,%f,%f);
                );
                out tags center;
                """.formatted(
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude,
                SEARCH_RADIUS_METERS, latitude, longitude
        );
    }

    private AmenityCounter countAmenities(JsonNode elements, Double latitude, Double longitude) {
        AmenityCounter counter = new AmenityCounter();
        Set<String> countedAmenities = new HashSet<>();

        for (JsonNode element : elements) {
            Coordinates coordinates = readCoordinates(element);
            if (coordinates == null || distanceInMeters(latitude, longitude, coordinates.latitude, coordinates.longitude) > SEARCH_RADIUS_METERS) {
                continue;
            }

            JsonNode tags = element.path("tags");
            AmenityCategory category = getAmenityCategory(tags);
            if (category == null) {
                continue;
            }

            String countKey = buildCountKey(category, element, tags);
            if (!countedAmenities.add(countKey)) {
                continue;
            }

            counter.increment(category);
        }

        return counter;
    }

    private Coordinates readCoordinates(JsonNode element) {
        if (element.hasNonNull("lat") && element.hasNonNull("lon")) {
            return new Coordinates(element.path("lat").asDouble(), element.path("lon").asDouble());
        }

        JsonNode center = element.path("center");
        if (center.hasNonNull("lat") && center.hasNonNull("lon")) {
            return new Coordinates(center.path("lat").asDouble(), center.path("lon").asDouble());
        }

        return null;
    }

    private AmenityCategory getAmenityCategory(JsonNode tags) {
        String amenity = tags.path("amenity").asText("");
        String tourism = tags.path("tourism").asText("");
        String leisure = tags.path("leisure").asText("");
        String landuse = tags.path("landuse").asText("");

        if ("school".equals(amenity)) {
            return AmenityCategory.SCHOOLS;
        }
        if ("museum".equals(tourism)) {
            return AmenityCategory.MUSEUMS;
        }
        if ("hospital".equals(amenity) || "clinic".equals(amenity) || "doctors".equals(amenity)) {
            return AmenityCategory.HOSPITALS;
        }
        if ("park".equals(leisure) || "garden".equals(leisure) || "recreation_ground".equals(landuse)) {
            return AmenityCategory.PARKS;
        }

        return null;
    }

    private String buildCountKey(AmenityCategory category, JsonNode element, JsonNode tags) {
        String name = tags.path("name").asText("").trim().toLowerCase();
        if (!name.isBlank()) {
            return category.name() + ":name:" + name;
        }

        return category.name() + ":osm:" + element.path("type").asText("") + ":" + element.path("id").asText("");
    }

    private double distanceInMeters(double fromLatitude, double fromLongitude, double toLatitude, double toLongitude) {
        double earthRadiusMeters = 6_371_000;
        double fromLatRadians = Math.toRadians(fromLatitude);
        double toLatRadians = Math.toRadians(toLatitude);
        double latDelta = Math.toRadians(toLatitude - fromLatitude);
        double lonDelta = Math.toRadians(toLongitude - fromLongitude);

        double haversine = Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
                + Math.cos(fromLatRadians) * Math.cos(toLatRadians)
                * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

        return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }

    private String buildCacheKey(Double latitude, Double longitude) {
        return "%.5f:%.5f:%d".formatted(latitude, longitude, SEARCH_RADIUS_METERS);
    }

    private AmenityCountsDTO getStaleCacheOrThrow(CachedAmenityCounts cachedCounts) {
        if (cachedCounts != null) {
            return cachedCounts.counts();
        }

        throw new IllegalStateException("Não foi possível carregar as amenities");
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new InvalidOperationException("obter amenities", "latitude e longitude são obrigatórias");
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new InvalidOperationException("obter amenities", "coordenadas inválidas");
        }
    }

    private enum AmenityCategory {
        SCHOOLS,
        MUSEUMS,
        HOSPITALS,
        PARKS
    }

    private record Coordinates(double latitude, double longitude) {
    }

    private record CachedAmenityCounts(AmenityCountsDTO counts, long storedAtMillis) {

        private boolean isExpired() {
            return System.currentTimeMillis() - storedAtMillis > CACHE_TTL.toMillis();
        }
    }

    private static class AmenityCounter {

        private int schools;
        private int museums;
        private int hospitals;
        private int parks;

        private void increment(AmenityCategory category) {
            switch (category) {
                case SCHOOLS -> schools++;
                case MUSEUMS -> museums++;
                case HOSPITALS -> hospitals++;
                case PARKS -> parks++;
            }
        }
    }
}
