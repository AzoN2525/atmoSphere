# Database Schema

## `areas`
Stores the monitored city areas or zones.

| Field | Type | Description |
|---|---|---|
| `id` | PK | Unique identifier of the area |
| `name` | string, not null | Area name |
| `code` | string, unique, not null | Short unique code for the area |
| `geometry` | text, not null | GeoJSON geometry of the area (Polygon / MultiPolygon) |
| `latitude` | decimal | Area centroid latitude |
| `longitude` | decimal | Area centroid longitude |
| `created_at` | datetime, not null | Record creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## `sensors`
Stores the sensors deployed in each monitored area.

| Field | Type | Description |
|---|---|---|
| `id` | PK | Unique identifier of the sensor |
| `unlock_code` | string, unique, not null | Code used to unlock/register the sensor |
| `name` | string, not null | Sensor name |
| `code` | string, unique, not null | Unique sensor code |
| `type` | enum, not null | Sensor indicator type (`AIR_QUALITY`, `TRAFFIC_DENSITY`, `NOISE_LEVEL`, etc.) |
| `status` | enum, not null | Current sensor status (`ACTIVE`, `INACTIVE`, `MAINTENANCE`, etc.) |
| `area_id` | FK -> `areas.id` | Area where the sensor is installed |
| `latitude` | decimal, not null | Sensor latitude |
| `longitude` | decimal, not null | Sensor longitude |
| `created_at` | datetime, not null | Record creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## `measurements`
Stores raw sensor measurements collected over time.

| Field | Type | Description |
|---|---|---|
| `id` | PK | Unique identifier of the measurement |
| `sensor_id` | FK -> `sensors.id` | Sensor that produced the measurement |
| `indicator_type` | enum, not null | Indicator measured (`AIR_QUALITY`, `TRAFFIC_DENSITY`, `NOISE_LEVEL`, etc.) |
| `value` | decimal, not null | Recorded measurement value |
| `unit` | enum | Measurement unit |
| `recorded_at` | datetime, not null | Time when the measurement was captured |

---

## `alerts`
Stores alerts generated when a measurement exceeds a configured threshold.

| Field | Type | Description |
|---|---|---|
| `id` | PK | Unique identifier of the alert |
| `sensor_id` | FK -> `sensors.id`, not null | Sensor associated with the alert |
| `measurement_id` | FK -> `measurements.id`, not null | Measurement that triggered the alert |
| `indicator_type` | enum, not null | Indicator type associated with the alert |
| `severity` | enum, not null | Alert severity |
| `message` | string, not null | Alert description/message |
| `triggered_value` | decimal, not null | Measurement value that triggered the alert |
| `threshold_value` | decimal, not null | Threshold that was exceeded |
| `status` | enum, not null | Current alert status (`ACTIVE`, `RESOLVED`, etc.) |
| `created_at` | datetime, not null | Timestamp when the alert was created |
| `resolved_at` | datetime | Timestamp when the alert was resolved |

---

# Relationships Summary

- One **area** can have many **sensors**
- One **sensor** belongs to one **area**
- One **sensor** can have many **measurements**
- One **measurement** belongs to one **sensor**
- One **sensor** can have many **alerts**
- One **alert** belongs to one **sensor**
- One **measurement** can originate zero or many **alerts**
- One **alert** is associated with one **measurement**