import json
import math
import os
import random
import time
from abc import ABC, abstractmethod
from collections import deque
from datetime import datetime, timezone

import pika
from pika.exceptions import AMQPConnectionError

EXCHANGE_NAME = 'atmosphere.exchange'
QUEUE_ARGUMENTS = {'x-queue-type': 'quorum'}

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'admin')
RABBITMQ_VHOST = os.getenv('RABBITMQ_VHOST', '/')
RABBITMQ_MAX_RETRIES = int(os.getenv('RABBITMQ_MAX_RETRIES', '30'))
RABBITMQ_RETRY_DELAY_SECONDS = float(os.getenv('RABBITMQ_RETRY_DELAY_SECONDS', '2'))


class SensorMeasurement(ABC):
   def __init__(
      self,
      sensor_id: str,
      area_id: str,
      sensor_type: str,
      measurements: dict,
      metadata: dict | None = None,
      timestamp: datetime | None = None,
   ) -> None:
      self.header = {
         "sensor_id": sensor_id,
         "area_id": area_id,
         "sensor_type": sensor_type,
         "timestamp": (timestamp if timestamp is not None else datetime.now(timezone.utc)).isoformat(),
         "version": "1.0",
      }
      if metadata:
         self.header.update(metadata)
      self.measurements = measurements

   def to_dict(self) -> dict:
      return {
         "header": self.header,
         "measurements": self.measurements,
      }

   @classmethod
   @abstractmethod
   def generate(cls, *args, **kwargs) -> "SensorMeasurement":
      raise NotImplementedError()


class AirMeasurements(SensorMeasurement):
   EUROPEAN_AQI = "european_aqi"
   PM10 = "pm10"
   PM2_5 = "pm2_5"
   CO = "co"
   NO2 = "no2"
   SO2 = "so2"
   O3 = "o3"

   @classmethod
   def generate(
      cls,
      sensor_id: str = "AIR-SENSOR-001",
      area_id: str = "AREA-01",
      metadata: dict | None = None,
      overrides: dict | None = None,
      at: datetime | None = None,
      area_factor: float = 1.0,
   ) -> "AirMeasurements":
      factor = time_factor(at)
      measurements = {
         cls.EUROPEAN_AQI: max(1, int(random.randint(1, 100) * factor * area_factor)),
         cls.PM10: round(random.uniform(5.0, 70.0) * factor * area_factor, 2),
         cls.PM2_5: round(random.uniform(3.0, 40.0) * factor * area_factor, 2),
         cls.CO: round(random.uniform(0.1, 1.5) * factor * area_factor, 3),
         cls.NO2: round(random.uniform(5.0, 120.0) * factor * area_factor, 2),
         cls.SO2: round(random.uniform(1.0, 80.0) * factor * area_factor, 2),
         cls.O3: round(random.uniform(10.0, 180.0) * factor * area_factor, 2),
      }
      if overrides:
         measurements.update(overrides)
      return cls(sensor_id, area_id, "air", measurements, metadata=metadata, timestamp=at)


class NoiseMeasurements(SensorMeasurement):
   def __init__(
      self,
      sensor_id: str = "NOISE-SENSOR-001",
      area_id: str = "AREA-01",
      metadata: dict | None = None,
      window_size: int = 30,
      timestamp: datetime | None = None,
   ) -> None:
      self.window = deque(maxlen=window_size)
      super().__init__(sensor_id, area_id, "noise", {}, metadata=metadata, timestamp=timestamp)

   def _generate_value(self, factor: float = 1.0) -> float:
      # factor shifts base from ~50 dB (quiet) up to ~65 dB (peak hours)
      base_noise = random.gauss(50 + factor * 15, 8)
      if random.random() < 0.15:
         spike = random.uniform(15, 30)
         return base_noise + spike
      return base_noise

   def add_measurement(self, value: float) -> None:
      self.window.append(value)

   def leq(self) -> float:
      if not self.window:
         return 0.0
      linear = [10 ** (v / 10) for v in self.window]
      return 10 * math.log10(sum(linear) / len(linear)) if linear else 0.0

   def lmax(self) -> float:
      return max(self.window) if self.window else 0.0

   def lmin(self) -> float:
      return min(self.window) if self.window else 0.0

   def percentile(self, p: float) -> float:
      if not self.window:
         return 0.0
      sorted_vals = sorted(self.window, reverse=True)
      index = int(len(sorted_vals) * (p / 100.0))
      return sorted_vals[min(index, len(sorted_vals) - 1)]

   def stats(self) -> dict:
      return {
         "leq": round(self.leq(), 2),
         "lmax": round(self.lmax(), 2),
         "lmin": round(self.lmin(), 2),
         "l10": round(self.percentile(10), 2),
         "l90": round(self.percentile(90), 2),
      }

   @classmethod
   def generate(
      cls,
      sensor_id: str = "NOISE-SENSOR-001",
      area_id: str = "AREA-01",
      metadata: dict | None = None,
      window_size: int = 30,
      activity_factor: float = 1.0,
      at: datetime | None = None,
   ) -> "NoiseMeasurements":
      instance = cls(sensor_id=sensor_id, area_id=area_id, metadata=metadata, window_size=window_size, timestamp=at)
      factor = time_factor(at)
      for _ in range(window_size):
         value = instance._generate_value(factor * activity_factor)
         instance.add_measurement(value)
      instance.measurements = {
         "instant": round(instance.window[-1], 2),
         **instance.stats(),
         "samples": len(instance.window),
      }
      return instance


class TrafficMeasurements(SensorMeasurement):
   @classmethod
   def generate(
      cls,
      sensor_id: str = "TRAFFIC-SENSOR-001",
      area_id: str = "AREA-01",
      metadata: dict | None = None,
      overrides: dict | None = None,
      area_factor: float = 1.0,
      at: datetime | None = None,
   ) -> "TrafficMeasurements":
      factor = time_factor(at)
      # Peak hours: more vehicles, lower speed (congestion); off-peak: fewer vehicles, faster
      count = random.randint(0, max(1, int(100 * factor * area_factor)))
      avg_speed = random.uniform(40.0, 110.0 - factor * 30 / area_factor)
      flow_rate_h = count * 12
      density_k = round(flow_rate_h / avg_speed, 1)
      occupancy_pct = min(round(density_k * 1.8, 1), 100.0)
      measurements = {
         "flow": {
            "total_count": count,
            "flow_rate_h": flow_rate_h,
            "density_k": density_k,
         },
         "velocity": {
            "avg_speed": round(avg_speed, 1),
            "unit": "km/h",
            "speed_percentile_85": round(avg_speed * 1.12, 1),
         },
         "occupancy": {
            "lane_occupancy_pct": occupancy_pct,
            "avg_gap_seconds": round(3600 / flow_rate_h, 1) if flow_rate_h > 0 else 0.0,
         },
         "classification": [
            {"class": "passenger_car", "count": int(count * 0.85)},
            {"class": "heavy_truck", "count": int(count * 0.10)},
            {"class": "motorcycle", "count": int(count * 0.05)},
         ],
      }
      if overrides:
         measurements.update(overrides)
      return cls(sensor_id, area_id, "traffic", measurements, metadata=metadata, timestamp=at)


def time_factor(dt: datetime | None = None) -> float:
   """Activity multiplier in [0.3, 1.0] with peaks at 9h, 13h, and 17h."""
   ref = dt if dt is not None else datetime.now()
   hour = ref.hour + ref.minute / 60.0
   peaks = [9.0, 13.0, 17.0]
   sigma = 1.5
   raw = max(math.exp(-0.5 * ((hour - p) / sigma) ** 2) for p in peaks)
   return 0.3 + 0.7 * raw


def connectToRabbitMQ():
   credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
   params = pika.ConnectionParameters(
      host=RABBITMQ_HOST,
      port=RABBITMQ_PORT,
      virtual_host=RABBITMQ_VHOST,
      credentials=credentials,
      heartbeat=30,
      blocked_connection_timeout=30,
   )

   for attempt in range(1, RABBITMQ_MAX_RETRIES + 1):
      try:
         connection = pika.BlockingConnection(params)
         print(f"Connected to RabbitMQ at {RABBITMQ_HOST}:{RABBITMQ_PORT}")
         return connection
      except AMQPConnectionError as exc:
         if attempt == RABBITMQ_MAX_RETRIES:
            raise
         print(
            f"RabbitMQ not ready yet ({exc}). "
            f"Retry {attempt}/{RABBITMQ_MAX_RETRIES} in {RABBITMQ_RETRY_DELAY_SECONDS}s..."
         )
         time.sleep(RABBITMQ_RETRY_DELAY_SECONDS)


def ensureInfrastructure(connection: pika.BlockingConnection, QUEUE_NAME: str, ROUTING_KEY: str):
   channel = connection.channel()
   channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)
   channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments=QUEUE_ARGUMENTS)
   channel.queue_bind(queue=QUEUE_NAME, exchange=EXCHANGE_NAME, routing_key=ROUTING_KEY)
   return channel


def publish_measurement(channel: pika.adapters.blocking_connection.BlockingChannel, measurement: dict, routing_key: str) -> None:
   channel.basic_publish(
      exchange=EXCHANGE_NAME,
      routing_key=routing_key,
      body=json.dumps(measurement),
      properties=pika.BasicProperties(content_type='application/json', delivery_mode=2),
   )

