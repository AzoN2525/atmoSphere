import random
import time
import pika
from Utils.utils import connectToRabbitMQ, ensureInfrastructure, publish_measurement, TrafficMeasurements
from areas import DISTRICT_PROFILES

ROUTING_KEY = 'atmosphere.traffic'
TRAFFIC_QUEUE = 'atmosphere.traffic'


class TrafficAgentSimulator:
    def __init__(self, sensor_id: str, area_id: str, traffic_factor: float):
        self.sensor_id = sensor_id
        self.area_id = area_id
        self.traffic_factor = traffic_factor

    def next_payload(self) -> dict:
        measurement = TrafficMeasurements.generate(
            sensor_id=self.sensor_id,
            area_id=self.area_id,
            area_factor=self.traffic_factor,
        )
        return measurement.to_dict()


def run_simulation(interval_seconds: int = 5, channel: pika.adapters.blocking_connection.BlockingChannel | None = None) -> None:
    simulators = [
        TrafficAgentSimulator(
            sensor_id=f'TRAFFIC-SENSOR-{profile.code}',
            area_id=profile.code,
            traffic_factor=profile.traffic_factor,
        )
        for profile in DISTRICT_PROFILES
    ]
    print('📡 Simulação de sensor de tráfego (Ctrl+C para parar)\n')

    try:
        while True:
            for simulator in simulators:
                payload = simulator.next_payload()
                publish_measurement(channel, payload, ROUTING_KEY)
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print('\nSimulação terminada.')


if __name__ == '__main__':
    connection = connectToRabbitMQ()
    channel = ensureInfrastructure(connection, TRAFFIC_QUEUE, ROUTING_KEY)
    run_simulation(interval_seconds=15, channel=channel)
