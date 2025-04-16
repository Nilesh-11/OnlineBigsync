from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi import HTTPException
import numpy as np

import json
from algos.event_detection import eventDetection
from algos.event_classification import eventClassification
from algos.event_classification_islanding import classifyIslandingEvent
from algos.baselining import findStats
from algos.Algorithms.EWT.EWT_Main import EWTmainFunction
from algos.Algorithms.window_selection import windowSelection
from algos.Algorithms.Prony.prony3 import pronyAnalysis
from algos.Algorithms.OSLP.main import oslp_main
from protocol.client import *
import asyncio
import threading
from schemas.request import *
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from dotenv import load_dotenv
from protocol.Utils.dbconnection import Base, engine
from protocol.Utils.model import InertiaDistribution, DataFrame, ConfigurationFrame
from dotenv import load_dotenv

load_dotenv()

# Creates all tables that don't already exist
Base.metadata.create_all(bind=engine)

user=None
serverData_thread = None
classify_events_thread = None
IDI_thread = None
detect_events_thread = None
fetch_events = False

app = FastAPI()

# Allow requests from all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/test')
def test(event_settings: TestSettings):
    if not event_settings.data_freq or not event_settings.data_time or not event_settings.threshold:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user
    
    res, isDetected = getFault(event_settings.data_freq, event_settings.data_time, event_settings.threshold)
    if isDetected == False:
        return {
            "status": 200,
            'data': res
        }
    return {'status': 200,
            'data1': res[0],
            'data2': res[1],
            'data3': res[2],
            'fault': isDetected}

@app.get("/")
def index():
    return {"message": "Welcome to the API"}

@app.get("/health-check")
def health_check():
    global user, serverData_thread, classify_events_thread, detect_events_thread, fetch_events
    
    time_stamp = user.dbUser.get_max_timestamp(frameIdentifier=user.cfg.identifier)
    dbok = time_stamp is not None
    socketok = serverData_thread.is_alive()
    classify_eventsok = classify_events_thread.is_alive()
    detect_eventsok = detect_events_thread.is_alive()

    return {
        "status": "success",
        "database": dbok,
        "pmuConnection": socketok,
        "classifyingEvents": classify_eventsok,
        "detectingEvents": detect_eventsok
    }

@app.post("/connect-server")
async def connect_to_server(event_settings: ServerInfoSettings):
    global user, serverData_thread, classify_events_thread, detect_events_thread, IDI_thread
    
    if not event_settings.ip or not event_settings.port:
        raise HTTPException(status_code=400, detail="Bad request from the client")

    user = client(event_settings.ip, event_settings.port)
    serverData_thread = threading.Thread(target=user.receive)
    classify_events_thread = threading.Thread(target=user.classify_events)
    detect_events_thread = threading.Thread(target=user.detect_events)
    IDI_thread = threading.Thread(target=user.process_IDI_data)
    
    try:
        serverData_thread.start()
        print("done")
        sessionID = generate_unique_identifier(event_settings.ip, event_settings.port)
        defaultData = {
            "threshold_values": user.threshold_values,
            "event_WindowLens": user.eventWindowLens,
            "window_lens": user.windowLens
        }
        await asyncio.sleep(2)
        detect_events_thread.start()
        IDI_thread.start()
        classify_events_thread.start()
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
async def event_analytics(event_settings: EventAnalyticsSettings, db: Session = Depends(get_db) ):
    if not event_settings.mintime or not event_settings.maxtime or not event_settings.eventtype:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    
    global user

    data = user.get_event_analytics(event_settings.eventtype, event_settings.mintime, event_settings.maxtime, db)
    
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
async def connection_details(db: Session = Depends(get_db)):
    global serverData_thread
    global classify_events_thread, detect_events_thread, IDI_thread

    time_stamp = db.query(func.max(DataFrame.time)).scalar()
    dbok = time_stamp is not None
    socketok = serverData_thread.is_alive()
    classify_eventsok = classify_events_thread.is_alive()
    detect_eventsok = detect_events_thread.is_alive()
    IDI_ok = IDI_thread.is_alive()
    all_threads_ok = socketok and classify_eventsok and detect_eventsok and IDI_ok

    if socketok and dbok:
        message_parts = ["Connection to database and socket is healthy."]
        if classify_eventsok:
            message_parts.append("Event classification is running.")
        else:
            message_parts.append("Event classification is NOT running.")

        if detect_eventsok:
            message_parts.append("Event detection is running.")
        else:
            message_parts.append("Event detection is NOT running.")

        if IDI_ok:
            message_parts.append("IDI computation is active.")
        else:
            message_parts.append("IDI computation is NOT active.")

        return {
            "status": "success",
            "status_code": 200,
            "message": " ".join(message_parts),
            "components": {
                "database": dbok,
                "socket": socketok,
                "event_classification": classify_eventsok,
                "event_detection": detect_eventsok,
                "idi_thread": IDI_ok
            }
        }

    return {
        "status": "failed",
        "status_code": 500,
        "message": "Connection failed. Either socket or database is not reachable.",
        "components": {
            "database": dbok,
            "socket": socketok,
            "event_classification": classify_eventsok,
            "event_detection": detect_eventsok,
            "idi_thread": IDI_ok
        }
    }


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
async def send_data(event_settings: DataServerSettings, db: Session = Depends(get_db)):
    if not event_settings.data_time_len or not event_settings.events_time_len:
        raise HTTPException(status_code=400, detail="Bad request from the client")
    data = user.get_data(event_settings.stationName, event_settings.data_time_len, event_settings.events_time_len, db)
    res = {
        "status": "success",
        "status_code": 200,
        "message": "Data received successfully.",
        "data": data
    }
    return res

@app.get('/live/IDI/stations')
async def all_stations(db: Session = Depends(get_db)):
    global user
    try:
        stationnames = (db.query(ConfigurationFrame.stationname)
                    .filter(ConfigurationFrame.identifier == user.cfg.identifier)
                    .limit(1)
                    .scalar())
        return { 'status': "success", 'stations': stationnames}
    except Exception as e:
        print("An error occurred in fething fetching all the stationnames:", e)
        return { 'status': "success", 'details': "An error occurred"}

@app.post('/live/IDI/stations')
async def set_stations_inertia(request: SetStationInertiaRequest, db: Session = Depends(get_db)):
    global user
    user.station_inertia_values = request.stations
    return {'status': "success"}

@app.post('/live/IDI/data')
async def inertia_distribution_data(request: DataIDIRequest, db: Session = Depends(get_db)):
    global user
    time_window = request.window
    try:
        max_time = db.query(func.max(InertiaDistribution.time))\
                    .filter(InertiaDistribution.identifier == user.cfg.identifier)\
                    .scalar()
        if max_time:
            data = db.query(InertiaDistribution)\
                .filter(
                    InertiaDistribution.identifier == user.cfg.identifier,
                    InertiaDistribution.time >= max_time - timedelta(seconds=time_window),
                    InertiaDistribution.time <= max_time
                ).all()
            stations = [record.stationnames for record in data]
            times = [record.time for record in data]
            d_k = [record.d_k for record in data]
            idi = [record.idi for record in data]
        else:
            return {'status': "error", 'details': "No data"}
        return {'status':"success", 'data': {'time': times, 'stations': stations, 'd_k': d_k, 'idi': idi}}
    except Exception as e:
        print("Error occurred with idi data:", e)
        return {'status': "error", 'details': "an error occurred"}

@app.post("/close-conn")
async def close_connection():
    global user
    global serverData_thread, classify_events_thread, detect_events_thread, IDI_thread

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
        if detect_events_thread.is_alive():
            detect_events_thread.join()
            print("Stopped detecting events")
        if classify_events_thread.is_alive():
            classify_events_thread.join()
            print("Stopped classifying events")
        if IDI_thread.is_alive():
            IDI_thread.join()
            print("Stopped IDI processing")
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
