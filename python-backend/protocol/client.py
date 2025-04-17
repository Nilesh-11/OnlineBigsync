from protocol.frames import *
from protocol.Utils.utils import *
from protocol.Utils.process_frames import *
from protocol.algos.FC_algo import *
from protocol.algos.FD_algo import *
from algos.event_classification import *
from bisect import bisect_left, bisect_right
import socket
import pandas as pd
import os
import math
import threading
from enum import Enum
from datetime import timedelta
from collections import defaultdict
from sqlalchemy import select, desc, func, and_, text
from protocol.Utils.dbconnection import get_db
from protocol.Utils.model import InertiaDistribution, DataFrame, ConfigurationFrame, OscillatoryEvent, IslandingEvent, GenLossEvent, LoadLossEvent, ImpulseEvent

FRAME_TYPES = {
    0: dataFrame,
    1: headerFrame,
    2: cfg1,
    3: cfg1,
    4: commandFrame,
    5: cfg1
}

class interruptType(Enum):
    CLOSE_CONN = 1
    SEND_DATA = 2

class client(object):
    
    def __init__(self, serverIP, serverPort, data_lim=2048):
        self.store_lim = 100
        self.data_lim = data_lim
        self.data = pd.DataFrame(columns=['Time', 'Frame type', 'Frame size', 'pmu index', 'Frequency', 'ROCOF'])
        self.ip = serverIP
        self.port = serverPort
        self.cfg = None
        self.interrupt_event = threading.Event()
        self.interrupt_msg = None
        self.interrupt_action = None
        self.datas = {
            "data":[],
            "type":[]
        }
        self.db_data = None
        self.db_data_len = 80 # seconds
        self.event_ptr = defaultdict(lambda: {
            "maxTime_ptr": None,
            "minTime_ptr": None,
            "currTime_ptr": None
        })
        self.event_classify_buffer = 30
        self.event_classify_step = 0.2
        self.event_detection_param = {"windowLen": 10, "rocof_sd_threshold": 0.025}
        self.threshold_values = {'stepChange': 0.1, 'oscillatoryEvent': 5.0, 'impulseEvent': 2.0, 'islandingEvent': 0.1}
        self.eventWindowLens = {'islandingEvent': 10, 'genloadLossEvent': 20, 'oscillatoryEvent':10, 'impulseEvent': 10}
        self.windowLens = {'data': 30, 'events': 3600}
        self.station_inertia_values = None
        self.IDI_window = 1
    
    def execute_interrupt(self):
        if self.interrupt_action == interruptType.SEND_DATA.value:
            raise NotImplementedError(f"Interrupt type({self.interrupt_action}) not implemented.")
        else:
            raise NotImplementedError(f"Interrupt type({self.interrupt_action}) not implemented.")
    
    def receive(self):
        db = next(get_db())
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            client.connect((self.ip, self.port))
        except socket.error as e:
            raise ConnectionError(f"Socket error : {e}")
        print("Receiving data...")
        while True:
            try:
                if self.interrupt_event.is_set():
                    if self.interrupt_action == interruptType.CLOSE_CONN.value:
                        client.close()
                        print("Closing socket...")
                        break
                    else:
                        self.execute_interrupt()
                        continue
                data = client.recv(self.data_lim)
                if len(data) == 0:
                    print("Received empty data...quitting")
                    self.interrupt_action = interruptType.CLOSE_CONN.value
                    self.interrupt_event.set()
                    client.close()
                    break
                if(data[0:1] == b'\xaa'):
                    self.update_data(data, db)
            except socket.error as e:
                print(data)
                raise ConnectionError(f"Socket errror : {e}")
            finally:
                db.close()
    
    def update_data(self, data, db):
        frame_type = get_frame_type(data[0:2])
        assert (2 <= frame_type <= 3 or frame_type == 5 or self.cfg != None), "Configuration frame not found."

        if frame_type == 0:
            frame = dataFrame(data,
                              pmuinfo = self.cfg.pmus,
                              time_base = self.cfg.time_base,
                              num_pmu = self.cfg.num_pmu)
            new_data_frame = DataFrame(
                time = frame.time,
                identifier = self.cfg.identifier,
                numberofpmu = frame.num_pmu,
                streamid = frame.stream_idcode,
                dataid = [pmu.data_idcode for pmu in self.cfg.pmus],
                frequency = [pmu.freq for pmu in frame.pmu_data],
                rocof = [pmu.rocof for pmu in frame.pmu_data],
                dataerror = [pmu.data_error for pmu in frame.pmu_data],
                timequality = [pmu.time_quality for pmu in frame.pmu_data],
                pmusync = [pmu.pmu_sync for pmu in frame.pmu_data],
                triggerreason = [pmu.trigger_reason for pmu in frame.pmu_data],
            )
            db.add(new_data_frame)
            db.commit()
        elif frame_type == 4:
            self.command = commandFrame(data)
        elif 2 <= frame_type <= 3 or frame_type == 5:
            self.cfg = cfg1(data)
            self.cfg.identifier = generate_unique_identifier(self.ip, self.port)
            new_config_frame = ConfigurationFrame(
                time = self.cfg.time,
                identifier = self.cfg.identifier,
                streamid = self.cfg.stream_idcode,
                datarate = self.cfg.data_rate,
                stationname = [pmu.stn for pmu in self.cfg.pmus],
                dataid = [pmu.data_idcode for pmu in self.cfg.pmus],
                nominalfrequency = [pmu.fnom for pmu in self.cfg.pmus]
            )
            db.add(new_config_frame)
            db.commit()
        elif frame_type == 1:
            self.header = headerFrame(data)
        else:
            raise NotImplementedError("Not a suitable frametype")
    
    def get_events(self, stationName, time_len, db):
        events = ['loadloss', 'genloss', 'impulse', 'oscillatory', 'islanding']
        tableNames = [
            LoadLossEvent.__tablename__,
            GenLossEvent.__tablename__,
            ImpulseEvent.__tablename__,
            OscillatoryEvent.__tablename__,
            IslandingEvent.__tablename__
        ]
        
        max_time = db.query(func.max(DataFrame.time)).scalar()
        if not max_time:
            return {event: None for event in events}
        
        time_window_start = max_time - timedelta(seconds=time_len)
        res = {}

        for i, tableName in enumerate(tableNames):
            if tableName == IslandingEvent.__tablename__:
                query = text(f"""
                    SELECT time[1], time[array_length(time, 1)]
                    FROM {tableName}
                    WHERE identifier = :identifier
                    AND :stationName = ANY(stationnames)
                    AND time[array_length(time, 1)] BETWEEN :start_time AND :end_time
                    LIMIT 20
                """)
            else:
                query = text(f"""
                    SELECT time[1], time[array_length(time, 1)]
                    FROM {tableName}
                    WHERE identifier = :identifier
                    AND stationname = :stationName
                    AND time[array_length(time, 1)] BETWEEN :start_time AND :end_time
                    LIMIT 20
                """)

            data = db.execute(query, {
                "identifier": self.cfg.identifier,
                "stationName": stationName,
                "start_time": time_window_start,
                "end_time": max_time
            }).fetchall()

            if data:
                res[events[i]] = {
                    "mintime": [row[0] for row in data],
                    "maxtime": [row[1] for row in data]
                }
            else:
                res[events[i]] = None

        return res
    
    def process_IDI_data(self):
        db = next(get_db())
        curr_time = None
        prev_time = None
        while True:
            if self.interrupt_event.is_set():
                if self.interrupt_action == interruptType.CLOSE_CONN.value:
                    break
                else:
                    pass
            try:
                if self.station_inertia_values == None:
                    time.sleep(1)
                    continue
                if curr_time == None:
                    curr_time = (db.query(DataFrame.time).filter(DataFrame.identifier == self.cfg.identifier)
                                .order_by(DataFrame.time.desc())
                                .limit(1)
                                .scalar())
                else:
                    next_time = (db.query(DataFrame.time)
                                 .filter(DataFrame.identifier == self.cfg.identifier, DataFrame.time > curr_time)
                                 .order_by(DataFrame.time.asc())
                                 .limit(1)
                                 .scalar())
                    if next_time:
                        curr_time = next_time
                if curr_time != prev_time:
                    rows = (db.query(DataFrame.time, DataFrame.frequency)
                              .filter(DataFrame.identifier == self.cfg.identifier, curr_time - timedelta(seconds=self.IDI_window) <= DataFrame.time,  DataFrame.time <= curr_time)
                              .all())
                    stationnames = (db.query(ConfigurationFrame.stationname)
                                    .filter(ConfigurationFrame.identifier == self.cfg.identifier)
                                    .limit(1)
                                    .scalar())
                    data = [{'stationname': station} for station in stationnames]
                    fcoi = []
                    inertia_sum = math.fsum(self.station_inertia_values.values())
                    for i, val in enumerate(rows):
                        fcoi.append(math.fsum([self.station_inertia_values[station]  * val[1][j] if "gen" in station.lower() else 0 for j, station in enumerate(stationnames)]) / inertia_sum)
                    max_dk = 1e-9
                    for i, val in enumerate(data):
                        val['d_k'] = math.fsum([(val[1][i] - fcoi[j])**2 for j, val in enumerate(rows)])
                        max_dk = max(val['d_k'], max_dk)
                    for i, val in enumerate(data):
                        val['idi'] = val['d_k'] / max_dk
                    new_idi_data = InertiaDistribution(
                        time = curr_time,
                        identifier = self.cfg.identifier,
                        numberofpmu = len(data),
                        stationnames = stationnames,
                        d_k = [val['d_k'] for val in data],
                        idi = [val['idi'] for val in data]
                    )
                    db.add(new_idi_data)
                    db.commit()
                    prev_time = curr_time
            finally:
                db.close()

    def get_IDI_data(self):
        pass
    
    def get_frequency_time(self, data_window, max_time, db):
        data_frames = (db.query(DataFrame)
                            .filter(DataFrame.time >= max_time - timedelta(seconds=data_window), DataFrame.identifier == self.cfg.identifier)
                            .order_by(DataFrame.time.asc())
                            .all())
        stationNames = (db.query(ConfigurationFrame.stationname)
                       .filter(ConfigurationFrame.identifier == self.cfg.identifier)
                       .scalar())
        res = {}
        res['pmus'] = []
        res['time'] = []
        res['num_pmu'] = data_frames[0].numberofpmu
        for j in range(res['num_pmu']):
            res['pmus'].append({
                'stationname': stationNames[j],
                'frequency': []
            })
        for i, frame in enumerate(data_frames):
            for j in range(res['num_pmu']):
                res['pmus'][j]['frequency'].append(frame.frequency[j])
            res['time'].append(frame.time)
        return res
    
    def get_data(self, stationName, data_window, events_window, db):
        max_time = db.query(func.max(DataFrame.time)).scalar()
        if max_time is None:
            return {"error": "No data available in database."}
        res = self.get_frequency_time(data_window, max_time, db)
        res['events'] = self.get_events(stationName, events_window, db)
        return res
    
    def detect_events(self):
        db = next(get_db())
        prev_max_time = None
        while True:
            try:
                if self.interrupt_event.is_set():
                    if self.interrupt_action == interruptType.CLOSE_CONN.value:
                        break
                    else:
                        pass
                assert self.event_detection_param['windowLen'] == self.eventWindowLens['islandingEvent'], "islanding event and event detection window is not same"
                max_time = db.query(func.max(DataFrame.time)).filter(DataFrame.identifier == self.cfg.identifier).scalar()
                if prev_max_time is None or max_time == prev_max_time:
                    prev_max_time = max_time
                    continue
                prev_max_time = max_time
                self.db_data = self.get_frequency_time(self.eventWindowLens['islandingEvent'], max_time, db)
                if self.db_data is None:
                    continue
                left_index = bisect_left(self.db_data['time'], max_time - timedelta(seconds=self.eventWindowLens['islandingEvent']))
                
                data = {}
                data['pmus'] = {}
                data['time'] = self.db_data['time'][left_index: ]
                for i, pmu in enumerate(self.db_data['pmus']):
                    pmuName = pmu['stationname']
                    data['pmus'][pmuName] = {
                        'freq': []
                    }
                    data['pmus'][pmuName]['freq'] = pmu['frequency'][left_index: ]
                if len(data['pmus'].keys()) > 1:
                    freq_data = []
                    time_data = data['time']
                    for pmu in data['pmus']:
                        freq_data.append(data['pmus'][pmu]['freq'])
                    classifiedData, isFault = islandingEventClassification(freq_data, time_data, self.threshold_values['islandingEvent'])
                    res = []
                    if isFault:
                        new_islandingEvent = IslandingEvent(
                            identifier = self.cfg.identifier,
                            stationscount = len(data['pmus']),
                            stationnames = [pmu for pmu in data['pmus'].keys()],
                            frequency = freq_data,
                            threshold = self.threshold_values['islandingEvent']
                        )
                        db.add(new_islandingEvent)
                        db.commit()
                
                for pmu in data['pmus']:
                    fault_data, isDetected = getFault(data['pmus'][pmu]['freq'], data['time'], self.event_detection_param['rocof_sd_threshold'])
                    if isDetected:
                        curr_minTime_ptr = max(db.query(func.min(ConfigurationFrame.time)).filter(ConfigurationFrame.identifier == self.cfg.identifier).scalar(), min(data['time']) - timedelta(seconds=int(self.event_classify_buffer)))
                        assert curr_minTime_ptr <= min(self.db_data['time']), "Time error"
                        curr_maxTime_ptr = max_time + timedelta(seconds=int(self.event_classify_buffer))
                        if not self.event_ptr[pmu]['minTime_ptr']:
                            self.event_ptr[pmu] = {
                                'minTime_ptr': curr_minTime_ptr,
                                'maxTime_ptr': curr_maxTime_ptr,
                                'currTime_ptr': curr_minTime_ptr
                            }
                        else:
                            if self.event_ptr[pmu]['maxTime_ptr'] >= curr_minTime_ptr:
                                self.event_ptr[pmu]['maxTime_ptr'] = curr_maxTime_ptr
                            else:
                                self.event_ptr[pmu] = {
                                    'minTime_ptr': curr_minTime_ptr,
                                    'maxTime_ptr': curr_maxTime_ptr,
                                    'currTime_ptr': curr_minTime_ptr
                                }
            except Exception as e:
                print(f"An error occurred in fault detection: {str(e)}")
                return {'error': 'An unexpected error occurred'}, False
            finally:
                db.close()
    
    def classify_events(self):
        print("Started detecting and classifying events...")
        db = next(get_db())
        while True:
            try:
                if self.interrupt_event.is_set():
                    if self.interrupt_action == interruptType.CLOSE_CONN.value:
                        break
                    else:
                        pass
                if self.db_data is None:
                    time.sleep(0.2)
                    continue
                
                for i, pmu in enumerate(self.db_data['pmus']):
                    pmuName = pmu['stationname']
                    if self.event_ptr[pmuName]["minTime_ptr"] is None:
                        time.sleep(0.2)
                        continue
                    if self.event_ptr[pmuName]['currTime_ptr'] > min(self.event_ptr[pmuName]['maxTime_ptr'], self.db_data['time'][-1]):
                        time.sleep(0.2)
                        continue
                    faults = defaultdict(lambda: {})
                    eventsData = defaultdict(lambda: defaultdict(lambda: {'freq': [], 'time': []}))

                    for event in self.eventWindowLens.keys():
                        assert self.event_ptr[pmuName]['currTime_ptr'] <= max(self.db_data['time']), self.event_ptr[pmuName]
                        window_len = self.eventWindowLens[event]
                        left_index = bisect_left(self.db_data['time'], self.event_ptr[pmuName]['currTime_ptr'] - timedelta(seconds=window_len))
                        right_index = bisect_right(self.db_data['time'], self.event_ptr[pmuName]['currTime_ptr'])
                        if left_index > right_index:
                            right_index = left_index
                        eventsData[event]['freq'] = self.db_data['pmus'][i]['frequency'][left_index: right_index]
                        eventsData[event]['time'] = self.db_data['time'][left_index: right_index]
                    
                    freq_data = eventsData['oscillatoryEvent']['freq']
                    time_data = eventsData['oscillatoryEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = oscillatoryEventClassification(freq_data, time_data, self.threshold_values['oscillatoryEvent'])
                        res = []
                        if isFault:
                            new_oscillatoryEvent = OscillatoryEvent(
                                identifier = self.cfg.identifier,
                                stationname = pmuName,
                                frequency = freq_data,
                                power = classifiedData[0],
                                fftfrequency = classifiedData[1],
                                time = time_data,
                                threshold = self.threshold_values['oscillatoryEvent']
                            )
                            db.add(new_oscillatoryEvent)
                            db.commit()
                        faults['oscillatory'] = isFault
                    
                    freq_data = eventsData['impulseEvent']['freq']
                    time_data = eventsData['impulseEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = impulseEventClassification(freq_data, time_data, self.threshold_values['impulseEvent'])
                        res = []
                        if isFault:
                            new_impulseEvent = ImpulseEvent(
                                identifier = self.cfg.identifier,
                                stationname = pmuName,
                                frequency = freq_data,
                                rocof = classifiedData[0],
                                time = time_data,
                                threshold = self.threshold_values['impulseEvent']
                            )
                            db.add(new_impulseEvent)
                            db.commit()
                        faults['impulse'] = isFault
                    
                    freq_data = eventsData['genloadLossEvent']['freq']
                    time_data = eventsData['genloadLossEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = gen_load_LossClassification(freq_data, time_data, self.threshold_values['stepChange'])
                        res = []
                        if isFault:
                            if classifiedData[-1] == 'gen':
                                new_genLossEvent = GenLossEvent(
                                    identifier = self.cfg.identifier,
                                    stationname = pmuName,
                                    frequency = freq_data,
                                    time = time_data,
                                    threshold = self.threshold_values['stepChange']
                                )
                                db.add(new_genLossEvent)
                                db.commit()
                            else:
                                new_loadLossEvent = LoadLossEvent(
                                    identifier = self.cfg.identifier,
                                    stationname = pmuName,
                                    frequency = freq_data,
                                    time = time_data,
                                    threshold = self.threshold_values['stepChange']
                                )
                                db.add(new_loadLossEvent)
                                db.commit()
                        faults['genloadLoss'] = isFault
                    self.event_ptr[pmuName]['currTime_ptr'] += timedelta(seconds=self.event_classify_step)
            except Exception as e:
                print(f"An error occurred in fault classification: {str(e)}")
                return {'error': 'An unexpected error occurred'}, False
            finally:
                db.close()

    def get_event_analytics(self, eventtype: str, mintime: str, maxtime: str, db):
        model_map = {
            'oscillatory': OscillatoryEvent,
            'impulse': ImpulseEvent,
            'genloss': GenLossEvent,
            'loadloss': LoadLossEvent,
            'islanding': IslandingEvent
        }

        model = model_map.get(eventtype)
        if not model:
            raise NotImplementedError(f"Event type '{eventtype}' not supported.")

        # Convert to datetime
        mintime_dt = datetime.fromisoformat(mintime)
        maxtime_dt = datetime.fromisoformat(maxtime)

        from sqlalchemy import func

        event = db.query(model).filter(
            model.time[1] == mintime_dt,
            model.time[func.array_length(model.time, 1)] == maxtime_dt
        ).first()

        if not event:
            return {}

        if eventtype == 'oscillatory':
            return {
                'stationname': event.stationname,
                'freq': event.frequency,
                'power': event.power,
                'fft': event.fftfrequency,
                'time': event.time,
                'threshold': event.threshold
            }
        elif eventtype == 'impulse':
            return {
                'stationname': event.stationname,
                'freq': event.frequency,
                'rocof': event.rocof,
                'time': event.time,
                'threshold': event.threshold
            }
        elif eventtype == 'genloss':
            return {
                'stationname': event.stationname,
                'freq': event.frequency,
                'time': event.time,
                'threshold': event.threshold
            }
        elif eventtype == 'loadloss':
            return {
                'stationname': event.stationname,
                'freq': event.frequency,
                'time': event.time,
                'threshold': event.threshold
            }
        elif eventtype == 'islanding':
            return {
                'stationnames': event.stationnames,
                'freq': event.frequency,
                'time': event.time,
                'threshold': event.threshold
            }