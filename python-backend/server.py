from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel
from fastapi import HTTPException
import numpy as np 
from typing import List, Dict, Optional

import json
from algos.event_detection import eventDetection
from algos.event_classification import eventClassification
from algos.event_classification_islanding import classifyIslandingEvent
from algos.baselining import findStats
from algos.Algorithms.EWT.EWT_Main import EWTmainFunction
from typing import List
from algos.Algorithms.window_selection import windowSelection
from algos.Algorithms.Prony.prony3 import pronyAnalysis
from algos.Algorithms.OSLP.main import oslp_main
from protocol.client import *
import asyncio
import threading
import random
from dotenv import load_dotenv
load_dotenv()

user=None
serverData_thread = None
events_thread = None
fetch_events = False

app = FastAPI()

# Allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class EventDetectionSettings(BaseModel):
    time : List[float]
    windowSize: float = None
    sd_th: float = None
    data: List[float]

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

class TestSettings(BaseModel):
    stationName: str
    time_len: int

class EventAnalyticsSettings(BaseModel):
    mintime: str
    maxtime: str
    eventtype: str

@app.post('/test')
def test(event_settings: TestSettings):
    if not event_settings.stationName or not event_settings.time_len:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user

    res = user.get_data(event_settings.stationName, event_settings.time_len)

    return {'status': 200,
            'data': res}

@app.get("/")
def index():
    return {"message": "Welcome to the API"}

@app.post("/connect-server")
async def connect_to_server(event_settings: ServerInfoSettings):
    global user
    global serverData_thread
    global events_thread
    
    if not event_settings.ip or not event_settings.port:
        raise HTTPException(status_code=400, detail="Bad request from the client")

    user = client(event_settings.ip, event_settings.port)
    serverData_thread = threading.Thread(target=user.receive)
    events_thread = threading.Thread(target=user.classify_events)
    
    try:
        serverData_thread.start()
        sessionID = generate_unique_identifier(event_settings.ip, event_settings.port)
        defaultData = {
            "threshold_values": user.threshold_values,
            "event_WindowLens": user.eventWindowLens,
            "window_lens": user.windowLens
        }
        await asyncio.sleep(2)
        while not user.checkDbUpdates():
            await asyncio.sleep(1)
        events_thread.start()
        res = {
            "status": "success",
            "status_code": 200,
            "sessionID": sessionID,
            "message": f"Connected to {event_settings.ip}:{event_settings.port}",
            "data": defaultData
        }
    except Exception as e:
        print(f"Error: failed to connect{e}")
        res = {
                "status": "failed",
                "status_code": 500,
                "message": "Failed to connect"
            }
    except:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "An error occured"
        }
    return res

@app.post("/live-events-analytics")
async def event_analytics(event_settings: EventAnalyticsSettings):
    if not event_settings.mintime or not event_settings.maxtime or not event_settings.eventtype:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user

    data = user.get_event_analytics(event_settings.eventtype, event_settings.mintime, event_settings.maxtime)
    
    try:
        res = {
            "status": "success",
            "status_code": 200,
            "data": data
        }
    except Exception as e:
        print(f"Error: failed to connect{e}")
        res = {
                "status": "failed",
                "status_code": 500,
                "message": "Failed to classify events"
            }
    except:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "An error occured"
        }
    return res

@app.get("/conn-details")
async def connection_details():
    global serverData_thread
    global events_thread

    time_stamp = user.dbUser.get_max_timestamp(frameIdentifier=user.cfg.identifier)
    dbok = time_stamp is not None
    socketok = serverData_thread.is_alive()
    eventsok = events_thread.is_alive()
    
    if socketok and dbok:
        res = {
            "status": "success",
            "status_code": 200,
            "message": "connection is successfully established " + "and classifying events" if eventsok else "",
        }
    else:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "An unexpected error occurred.",
        }
    return res

@app.post('/set-parameters-threshold')
async def set_threshold_parameters(event_settings: parameterThresholdSettings):
    if not event_settings.stepChange or not event_settings.oscillatoryEvent or not event_settings.islandingEvent or not event_settings.islandingEvent:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    global user
    
    user.threshold_values['stepChange'] = event_settings.stepChange
    user.threshold_values['islandingEvent'] = event_settings.islandingEvent
    user.threshold_values['oscillatoryEvent'] = event_settings.oscillatoryEvent
    user.threshold_values['impulseEvent'] = event_settings.impulseEvent
    
    return {
        "status": "success",
        "status_code": 200,
        "message": "Threshold values updated",
        "data": user.threshold_values
    }

@app.post('/set-parameters-windowLens')
async def set_windowLens_parameters(event_settings: parameterWindowLensSettings):
    if not event_settings.events or not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    global user
    
    user.windowLens['events'] = event_settings.events
    user.windowLens['data'] = event_settings.data
    
    return {
        "status": "success",
        "status_code": 200,
        "message": "Threshold values updated",
        "data": user.windowLens
    }

@app.post('/set-parameters-eventLens')
async def set_eventLens_parameters(event_settings: parameterEventLenSettings):
    if not event_settings.islandingEvent or not event_settings.genloadLossEvent or not event_settings.impulseEvent or not event_settings.oscillatoryEvent:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user
    
    user.eventWindowLens['islandingEvent'] = event_settings.islandingEvent
    user.eventWindowLens['genloadLossEvent'] = event_settings.genloadLossEvent
    user.eventWindowLens['impulseEvent'] = event_settings.impulseEvent
    user.eventWindowLens['oscillatoryEvent'] = event_settings.oscillatoryEvent
    
    return {
        "status": "success",
        "status_code": 200,
        "message": "Threshold values updated",
        "data": user.eventWindowLens
    }

@app.post('/data-server')
async def send_data(event_settings: DataServerSettings):
    if not event_settings.data_time_len or not event_settings.events_time_len:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    data = user.get_data(event_settings.stationName, event_settings.data_time_len, event_settings.events_time_len)
    res = {
        "status": "success",
        "status_code": 200,
        "message": "Data received successfully.",
        "data": data
    }
    return res

@app.post("/close-conn")
async def close_connection():
    global user
    global serverData_thread
    global events_thread

    res = {
        "status": "failed",
        "status_code": 500,
        "message": "Close connection request failed"
    }
    
    try:
        user.interrupt_action = interruptType.CLOSE_CONN.value
        user.interrupt_event.set()
        if serverData_thread.is_alive():
            serverData_thread.join()
            print("Stopped receiving data")
        if events_thread.is_alive():
            events_thread.join()
            print("Stopped classifying events")
        res =  {
            "status":"success",
            "status_code": 200,
            "message": "Connection is closed successfully"
        }
    except Exception as e:
        print("Error occurred: ", e)
    except:
        print("An error occurred.")
    return res
    
@app.post("/action-server")
async def action_to_server(event_settings: ServerInterruptSettings):
    if not event_settings.action or not event_settings.msg:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user
    global serverData_thread
    
    try:
        user.interrupt_action = event_settings.action
        user.interrupt_msg = event_settings.msg
        user.interrupt_event.set()
        if user.interrupt_action == interruptType.CLOSE_CONN.value:
            serverData_thread.join()
        res =  {
            "status":"success",
            "status_code": 200,
            "message": "Interrupt was succesfully executed."
        }
    except:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "Failed to execute."
        }
    
    return res

@app.post("/v2/classify-event")
async def classify_event_data(event_settings: EventClassificationSettings):
    if not event_settings.time or not event_settings.data or not event_settings.thresholdValues:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    res = eventClassification(
        event_settings.data, event_settings.time,
        event_settings.thresholdValues,
    )
    return res

@app.post("/v2/detect-event")
async def detect_event(event_settings: EventDetectionSettings):
    if not event_settings.time or not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    res = eventDetection(
        event_settings.data, event_settings.time,
        float(event_settings.windowSize),
        float(event_settings.sd_th),
    )
    if res and res["fault"]:
        return res
    return {"fault": False}

@app.post("/v2/detect-islanding-event")
async def detect_islanding_event(event_settings: IslandingEventClassificationSettings):
    if not event_settings.time or not event_settings.data or not event_settings.thresholdValues:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    res = classifyIslandingEvent(
        event_settings.data, event_settings.time,
        event_settings.thresholdValues,
    )
    return res

@app.post("/v2/find-statistics")
async def detect_islanding_event(event_settings: StatisticsSettings):
    if not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    res = findStats(
        event_settings.data
    )
    return res

@app.post("/v3/modes-analysis")
async def mode_analysis(event_settings: ModeAnalysisSettings):
    if not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    modes_data =  EWTmainFunction(event_settings.data)
    ewt_data = modes_data["ewt"]
    prony_data = []
    for i in range(len(modes_data["Amp"])):
        selected_window = windowSelection(ewt_data[i], modes_data["InstEner"][i], modes_data["InstFreq"][i])
        if len(selected_window) > 0:
            x = pronyAnalysis(selected_window)
            prony_data.append(x+[modes_data["PerEner"][i]])
        else:
            prony_data.append(None)
    filtered_modes_data = {
    "ewt": [],
    "Amp": [],
    "InstEner": [],
    "InstFreq": []
    }

    for i, item in enumerate(prony_data):
        if item is not None:
            filtered_modes_data["ewt"].append(modes_data["ewt"][i])
            filtered_modes_data["Amp"].append(modes_data["Amp"][i])
            filtered_modes_data["InstEner"].append(modes_data["InstEner"][i])
            filtered_modes_data["InstFreq"].append(modes_data["InstFreq"][i])
    filtered_modes_data["ewt"] = np.array(filtered_modes_data["ewt"])
    filtered_modes_data["Amp"] = np.array(filtered_modes_data["Amp"])
    filtered_modes_data["InstEner"] = np.array(filtered_modes_data["InstEner"])
    filtered_modes_data["InstFreq"] = np.array(filtered_modes_data["InstFreq"])
    prony_data = [x for x in prony_data if x is not None]
    
    return json.dumps({'Mode':filtered_modes_data["ewt"].tolist(),'Amp':filtered_modes_data["Amp"].tolist(),'InstEner':filtered_modes_data["InstEner"].tolist(),'InstFreq':filtered_modes_data["InstFreq"].tolist(), 'Prony_data':prony_data })

@app.post("/v2/oslp")
async def oslp_analysis(event_settings: OSLPSettings):
    if not event_settings.data or not event_settings.points:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    res = oslp_main(event_settings.time,event_settings.data, event_settings.points[0], event_settings.points[1])
    # res = findStats(
    #     event_settings.data
    # )
    return res

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return {"error": "An unexpected error occurred"}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return {"error": "Validation error"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
