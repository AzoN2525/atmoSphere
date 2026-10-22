import time
from datetime import datetime, timedelta, timezone

from Utils.utils import (
    AirMeasurements,
    NoiseMeasurements,
    TrafficMeasurements,
    connectToRabbitMQ,
    ensureInfrastructure,
    publish_measurement,
)
from areas import DISTRICT_PROFILES

INTERVAL_MINUTES = 60
DAYS_BACK        = 365
SENSOR_ID_AIR_PREFIX    = "AIR-SENSOR-"
SENSOR_ID_NOISE_PREFIX  = "NOISE-SENSOR-"
SENSOR_ID_TRAFFIC_PREFIX = "TRAFFIC-SENSOR-"

AIR_QUEUE     = "atmosphere.air"
NOISE_QUEUE   = "atmosphere.noise"
TRAFFIC_QUEUE = "atmosphere.traffic"
AIR_KEY       = "atmosphere.air"
NOISE_KEY     = "atmosphere.noise"
TRAFFIC_KEY   = "atmosphere.traffic"


def run_seed() -> None:
    connection = connectToRabbitMQ()

    for queue, key in (
        (AIR_QUEUE,     AIR_KEY),
        (NOISE_QUEUE,   NOISE_KEY),
        (TRAFFIC_QUEUE, TRAFFIC_KEY),
    ):
        channel = ensureInfrastructure(connection, queue, key)

    end   = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    start = end - timedelta(days=DAYS_BACK)

    total_steps = int((end - start).total_seconds() // (INTERVAL_MINUTES * 60))
    total_msgs = total_steps * 3 * len(DISTRICT_PROFILES)
    print(f"Seed: {total_steps} timestamps × 3 sensores = {total_msgs} mensagens")
    print(f"De {start.date()} até {end.date()} (intervalo {INTERVAL_MINUTES} min)\n")

    current = start
    step    = 0
    t0      = time.monotonic()

    while current <= end:
        for profile in DISTRICT_PROFILES:
            air = AirMeasurements.generate(
                sensor_id=f"{SENSOR_ID_AIR_PREFIX}{profile.code}",
                area_id=profile.code,
                area_factor=profile.air_factor,
                at=current,
            )
            noise = NoiseMeasurements.generate(
                sensor_id=f"{SENSOR_ID_NOISE_PREFIX}{profile.code}",
                area_id=profile.code,
                activity_factor=profile.noise_factor,
                at=current,
            )
            traffic = TrafficMeasurements.generate(
                sensor_id=f"{SENSOR_ID_TRAFFIC_PREFIX}{profile.code}",
                area_id=profile.code,
                area_factor=profile.traffic_factor,
                at=current,
            )

            publish_measurement(channel, air.to_dict(),     AIR_KEY)
            publish_measurement(channel, noise.to_dict(),   NOISE_KEY)
            publish_measurement(channel, traffic.to_dict(), TRAFFIC_KEY)

        step    += 1
        current += timedelta(minutes=INTERVAL_MINUTES)

        if step % 1000 == 0:
            elapsed = time.monotonic() - t0
            pct     = step / total_steps * 100
            eta     = elapsed / step * (total_steps - step)
            print(f"  {pct:5.1f}%  |  {step}/{total_steps}  |  {current.date()}  |  ETA {eta:.0f}s")

    elapsed = time.monotonic() - t0
    connection.close()
    print(f"\nConcluído. {step * 3} mensagens publicadas em {elapsed:.1f}s.")
    print("O consumer está a processar as mensagens em background.")


if __name__ == "__main__":
    run_seed()
