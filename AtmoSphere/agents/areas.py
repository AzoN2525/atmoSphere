from dataclasses import dataclass
from typing import Literal

DistrictCode = Literal[
    'LISBOA', 'PORTO', 'COIMBRA', 'BRAGA', 'AVEIRO', 'SETUBAL', 'SANTAREM',
    'LEIRIA', 'VISEU', 'VIANADOCASTELO', 'VILAREAL', 'BRAGANCA', 'CASTELOBRANCO',
    'GUARDA', 'PORTALEGRE', 'EVORA', 'BEJA', 'FARO'
]

@dataclass(frozen=True)
class DistrictProfile:
    code: DistrictCode
    name: str
    latitude: float
    longitude: float
    air_factor: float
    traffic_factor: float
    noise_factor: float

DISTRICT_PROFILES: list[DistrictProfile] = [
    DistrictProfile('LISBOA', 'Lisboa', 38.7223, -9.1393, air_factor=1.15, traffic_factor=1.20, noise_factor=1.15),
    DistrictProfile('PORTO', 'Porto', 41.1579, -8.6291, air_factor=1.05, traffic_factor=1.10, noise_factor=1.05),
    DistrictProfile('COIMBRA', 'Coimbra', 40.2033, -8.4103, air_factor=0.95, traffic_factor=0.95, noise_factor=0.95),
    DistrictProfile('BRAGA', 'Braga', 41.5454, -8.4265, air_factor=0.92, traffic_factor=0.90, noise_factor=0.92),
    DistrictProfile('AVEIRO', 'Aveiro', 40.6405, -8.6538, air_factor=0.90, traffic_factor=0.88, noise_factor=0.90),
    DistrictProfile('SETUBAL', 'Setúbal', 38.5244, -8.8882, air_factor=1.00, traffic_factor=1.00, noise_factor=1.00),
    DistrictProfile('SANTAREM', 'Santarém', 39.2363, -8.6810, air_factor=0.88, traffic_factor=0.85, noise_factor=0.88),
    DistrictProfile('LEIRIA', 'Leiria', 39.7436, -8.8070, air_factor=0.87, traffic_factor=0.84, noise_factor=0.87),
    DistrictProfile('VISEU', 'Viseu', 40.6610, -7.9097, air_factor=0.80, traffic_factor=0.75, noise_factor=0.82),
    DistrictProfile('VIANADOCASTELO', 'Viana do Castelo', 41.6930, -8.8320, air_factor=0.78, traffic_factor=0.72, noise_factor=0.80),
    DistrictProfile('VILAREAL', 'Vila Real', 41.2995, -7.7430, air_factor=0.75, traffic_factor=0.70, noise_factor=0.78),
    DistrictProfile('BRAGANCA', 'Bragança', 41.8076, -6.7573, air_factor=0.70, traffic_factor=0.65, noise_factor=0.75),
    DistrictProfile('CASTELOBRANCO', 'Castelo Branco', 39.8225, -7.4901, air_factor=0.72, traffic_factor=0.68, noise_factor=0.76),
    DistrictProfile('GUARDA', 'Guarda', 40.5378, -7.2650, air_factor=0.72, traffic_factor=0.68, noise_factor=0.76),
    DistrictProfile('PORTALEGRE', 'Portalegre', 39.2920, -7.4287, air_factor=0.65, traffic_factor=0.60, noise_factor=0.70),
    DistrictProfile('EVORA', 'Évora', 38.5713, -7.9139, air_factor=0.74, traffic_factor=0.70, noise_factor=0.78),
    DistrictProfile('BEJA', 'Beja', 38.0151, -7.8638, air_factor=0.70, traffic_factor=0.65, noise_factor=0.75),
    DistrictProfile('FARO', 'Faro', 37.0194, -7.9304, air_factor=0.85, traffic_factor=0.90, noise_factor=0.88),
]

DEFAULT_DISTRICTS = DISTRICT_PROFILES
