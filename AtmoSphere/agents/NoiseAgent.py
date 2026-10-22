import random
import time
import pika
from Utils.utils import connectToRabbitMQ, ensureInfrastructure, publish_measurement, NoiseMeasurements, time_factor
from areas import DISTRICT_PROFILES

ROUTING_KEY = 'atmosphere.noise'
NOISE_QUEUE = 'atmosphere.noise'


class NoiseAgentSimulator:
    def __init__(self, sensor_id: str, area_id: str, activity_factor: float, window_size: int = 30):
        self.sensor = NoiseMeasurements(
            sensor_id=sensor_id,
            area_id=area_id,
            window_size=window_size,
        )
        self.activity_factor = activity_factor

    def next_payload(self) -> dict:
        value = self.sensor._generate_value(time_factor() * self.activity_factor)
        self.sensor.add_measurement(value)
        self.sensor.measurements = {
            'instant': round(value, 2),
            **self.sensor.stats(),
            'samples': len(self.sensor.window),
        }
        return self.sensor.to_dict()


def run_simulation(interval_seconds: int = 5, channel: pika.adapters.blocking_connection.BlockingChannel | None = None) -> None:
    sensors = [
        NoiseAgentSimulator(
            sensor_id=f'NOISE-SENSOR-{profile.code}',
            area_id=profile.code,
            activity_factor=profile.noise_factor,
        )
        for profile in DISTRICT_PROFILES
    ]
    print('📡 Simulação de sensor de ruído (Ctrl+C para parar)\n')

    try:
        while True:
            for sensor in sensors:
                payload = sensor.next_payload()
                publish_measurement(channel, payload, ROUTING_KEY)
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print('\nSimulação terminada.')


if __name__ == '__main__':
    connection = connectToRabbitMQ()
    channel = ensureInfrastructure(connection, NOISE_QUEUE, ROUTING_KEY)
    run_simulation(interval_seconds=15, channel=channel)
