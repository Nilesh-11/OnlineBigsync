from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel
from fastapi import HTTPException
import numpy as np 
from typing import List, Dict

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
user_thread = None
app = FastAPI()

# Allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000"],
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
    time_window: int
    
class SetParameterSettings(BaseModel):
    SCThreshold: int
    OCThreshold: int
    IEThreshold: int
    IsEThreshold: int

@app.post('/test')
def test():
    user.classify_events()
    return {'status': 200}

@app.get("/")
def index():
    return {"message": "Welcome to the API"}

@app.post("/connect-server")
async def connect_to_server(event_settings: ServerInfoSettings):
    global user_thread
    global user
    if not event_settings.ip or not event_settings.port:
        raise HTTPException(status_code=400, detail="Bad request from the client")

    user = client(event_settings.ip, event_settings.port)
    user_thread = threading.Thread(target=user.receive)
    
    try:
        user_thread.start()
        sessionID = generate_unique_identifier(event_settings.ip, event_settings.port)
        defaultData = {
            "threshold_values": user.threshold_values,
            "window_lens": user.window_lens
        }
        await asyncio.sleep(2)
        while not user.checkDbUpdates():
            await asyncio.sleep(1)
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

@app.get("/conn-details")
async def connection_details():
    time_stamp = user.dbUser.get_max_timestamp(frameIdentifier=user.cfg.identifier)

    if time_stamp is not None:
        res = {
            "status": "success",
            "status_code": 200,
            "message": "connection is successfully established",
        }
    else:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "An unexpected error occurred.",
        }
    return res

@app.post('/set-parameters')
async def set_parameters(event_settings: SetParameterSettings):
    if not event_settings.IEThreshold or not event_settings.IsEThreshold or not event_settings.SCThreshold or not event_settings.OCThreshold:
        raise HTTPException(status_code=400, detail="Bad request from the client")

@app.post('/data-server')
async def send_data(event_settings: DataServerSettings):
    if not event_settings.time_window:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    data = user.get_frequency_time(event_settings.time_window)
    
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
    global user_thread
    try:
        user.interrupt_action = interruptType.CLOSE_CONN.value
        user.interrupt_event.set()
        user_thread.join()
        res =  {
            "status":"success",
            "status_code": 200,
            "message": "Connection is closed successfully"
        }
    except:
        res = {
            "status": "failed",
            "status_code": 500,
            "message": "Close connection request failed"
        }
    return res
    
@app.post("/action-server")
async def action_to_server(event_settings: ServerInterruptSettings):
    if not event_settings.action or not event_settings.msg:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user
    global user_thread
    
    try:
        user.interrupt_action = event_settings.action
        user.interrupt_msg = event_settings.msg
        user.interrupt_event.set()
        if user.interrupt_action == interruptType.CLOSE_CONN.value:
            user_thread.join()
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
    # print("data:", event_settings.data)
    # print("time:", event_settings.time)
    # print("threshold_values", event_settings.thresholdValues)
    res = eventClassification(
        event_settings.data, event_settings.time,
        event_settings.thresholdValues,
    )
    return res

@app.post("/v2/detect-event")
async def detect_event(event_settings: EventDetectionSettings):
    if not event_settings.time or not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    # print(event_settings)
    # print("data", event_settings.data)
    # print("time", event_settings.time)
    # print("windowSize", event_settings.windowSize)
    # print("sd_th", event_settings.sd_th)
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
    # print(event_settings)
    # print("data:", event_settings.data)
    # print("time:", event_settings.time)
    # print("threshold_values", event_settings.thresholdValues)
    res = classifyIslandingEvent(
        event_settings.data, event_settings.time,
        event_settings.thresholdValues,
    )
    return res

@app.post("/v2/find-statistics")
async def detect_islanding_event(event_settings: StatisticsSettings):
    if not event_settings.data:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    # print(event_settings)
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
