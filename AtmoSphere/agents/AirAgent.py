import time
import pika
from Utils.utils import connectToRabbitMQ, ensureInfrastructure, publish_measurement, AirMeasurements
from areas import DISTRICT_PROFILES

ROUTING_KEY = 'atmosphere.air'
AIR_QUEUE = 'atmosphere.air'

def run_generation_loop(interval_seconds: int = 5, channel: pika.adapters.blocking_connection.BlockingChannel | None = None) -> None:
   """Generate air-quality payloads forever at a fixed interval."""
   while True:
      for profile in DISTRICT_PROFILES:
         sensor_id = f"AIR-SENSOR-{profile.code}"
         measurement = AirMeasurements.generate(
            sensor_id=sensor_id,
            area_id=profile.code,
            area_factor=profile.air_factor,
         )
         publish_measurement(channel, measurement.to_dict(), ROUTING_KEY)
      time.sleep(interval_seconds)


if __name__ == "__main__":
   connection = connectToRabbitMQ()
   channel = ensureInfrastructure(connection, AIR_QUEUE, ROUTING_KEY)
   run_generation_loop(15, channel)