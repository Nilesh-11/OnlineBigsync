from typing import List, Dict, Optional
from pydantic import BaseModel

class EventDetectionSettings(BaseModel):
    time : List[float]
    windowSize: float = None
    sd_th: float = None
    data: List[float]

class DataIDIRequest(BaseModel):
    window:int

class EventClassificationSettings(BaseModel):
    time: List[float]
    data: List[float]
    thresholdValues: Dict[str, float]

class IslandingEventClassificationSettings(BaseModel):
    time: List[float]
    data: List[List[float]]
    thresholdValues: dict

class StatisticsSettings(BaseModel):
    data: List[float]

class ModeAnalysisSettings(BaseModel):
    data: List[float]

class OSLPSettings(BaseModel):
    time : List[float]
    data: Dict[str, Dict[str, List[float]]] = {
    "Sub1-l1": {
            'F': [0.0] * 5000,
            'V': [0.0] * 5000,
            'VA': [0.0] * 5000,
            'I': [0.0] * 5000,
            'IA': [0.0] * 5000
        }
    }
    points:List[float]

class ServerInfoSettings(BaseModel):
    ip: str
    port: int

class ServerInterruptSettings(BaseModel):
    action: int
    msg: str

class DataServerSettings(BaseModel):
    stationName: Optional[str]
    data_time_len: int
    events_time_len: int

class parameterWindowLensSettings(BaseModel):
    events: int
    data: int

class parameterEventLenSettings(BaseModel):
    islandingEvent: int
    genloadLossEvent: int
    oscillatoryEvent: int
    impulseEvent: int

class parameterThresholdSettings(BaseModel):
    stepChange: float
    islandingEvent: float
    oscillatoryEvent: float
    impulseEvent: float

class EventAnalyticsSettings(BaseModel):
    mintime: str
    maxtime: str
    eventtype: str

class TestSettings(BaseModel):
    data_freq: List[float]
    data_time: List[float]
    threshold: float

class AllStationsRequest(BaseModel):
    pass

class SetStationInertiaRequest(BaseModel):
    stations: Dict[str, float]