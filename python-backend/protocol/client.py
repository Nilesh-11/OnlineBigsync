from protocol.frames import *
from protocol.Utils.utils import *
from protocol.Utils.process_frames import *
from protocol.DatabaseManager import *
from protocol.algos.FC_algo import *
from protocol.algos.FD_algo import *
from algos.event_detection  import eventDetection # temporary
from algos.event_classification import *
from bisect import bisect_left, bisect_right
import socket
import pandas as pd
import os
import threading
from enum import Enum
from datetime import timedelta
from collections import defaultdict
from protocol.Utils.dbconnection import get_db
from protocol.Utils.model import DataFrame, InertiaDistribution

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
        self.dbUser = DatabaseManager(
                    host=os.environ.get('DBHOST'),
                    port=os.environ.get('DBPORT'),
                    dbname=os.environ.get('DBNAME'),
                    user=os.environ.get('DBUSERNAME'),
                    password=os.environ.get('DBPASSWORD')
                )
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
        self.IDI_window = 1
    
    def checkDbUpdates(self):
        time_stamp = self.dbUser.get_max_timestamp(frameIdentifier=self.cfg.identifier)
        return bool(time_stamp is not None)
    
    def execute_interrupt(self):
        if self.interrupt_action == interruptType.SEND_DATA.value:
            raise NotImplementedError(f"Interrupt type({self.interrupt_action}) not implemented.")
        else:
            raise NotImplementedError(f"Interrupt type({self.interrupt_action}) not implemented.")
    
    def receive(self):
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            client.connect((self.ip, self.port))
            self.dbUser.run()
        except socket.error as e:
            raise ConnectionError(f"Socket error : {e}")
        print("Receiving data...")
        while True:
            if self.interrupt_event.is_set():
                if self.interrupt_action == interruptType.CLOSE_CONN.value:
                    client.close()
                    print("Closing socket...")
                    break
                else:
                    self.execute_interrupt()
                continue
            try:
                data = client.recv(self.data_lim)
                if len(data) == 0:
                    print("Received empty data...quitting")
                    self.interrupt_action = interruptType.CLOSE_CONN.value
                    self.interrupt_event.set()
                    client.close()
                    break
                if(data[0:1] == b'\xaa'):
                    self.update_data(data)
            except socket.error as e:
                print(data)
                raise ConnectionError(f"Socket errror : {e}")
            except:
                print(data)
                raise RuntimeError("Error in receiving data.")
    
    def update_data(self, data):
        frame_type = get_frame_type(data[0:2])
        assert (2 <= frame_type <= 3 or frame_type == 5 or self.cfg != None), "Configuration frame not found."

        if frame_type == 0:
            frame = dataFrame(data,
                              pmuinfo = self.cfg.pmus,
                              time_base = self.cfg.time_base,
                              num_pmu = self.cfg.num_pmu)
            data = process_dataFrame(frame, self.cfg)
        elif frame_type == 4:
            self.command = commandFrame(data)
        elif 2 <= frame_type <= 3 or frame_type == 5:
            self.cfg = cfg1(data)
            self.cfg.identifier = generate_unique_identifier(self.ip, self.port)
            data = process_cfg1Frame(self.cfg)
        elif frame_type == 1:
            self.header = headerFrame(data)
        else:
            raise NotImplementedError("Not a suitable frametype")
        
        self.datas['data'].append(data)
        self.datas['type'].append(frame_type)

        if len(self.datas['data']) > self.store_lim:
            self.dbUser.store_frame(self.datas['data'], self.datas['type'])
            self.datas['data'] = []
            self.datas['type'] = []
    
    def get_events(self, stationName, time_len):
        events = ['loadloss', 'genloss', 'impulse', 'oscillatory', 'islanding']
        tableNames = [loadLoss_events_table_name,
                      genLoss_events_table_name,
                      impulse_events_table_name,
                      oscillatory_events_table_name]
        max_time = self.dbUser.get_max_timestamp(self.cfg.identifier)
        data = self.dbUser.get_all_events(tableNames, stationName, self.cfg.identifier, time_len, max_time, 20)
        res = {}
        for j in range(len(events)):
            event = events[j]
            res[event] = None
            if data[j]:
                res[event] = {
                    'mintime': [data[j][i][0] for i in range(len(data[j]))],
                    'maxtime': [data[j][i][1] for i in range(len(data[j]))]
                }
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
                # print(db.query(DataFrame.time).filter(DataFrame.identifier == self.cfg.identifier))
                if curr_time == None:
                    print(f"Identifier in code: {repr(self.cfg.identifier)}")
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
                # print("curr:", curr_time)
                if curr_time != prev_time:
                    data = (db.query(DataFrame.time, DataFrame.stationname, DataFrame.frequency)
                              .filter(DataFrame.identifier == self.cfg.identifier, curr_time - self.IDI_window <= DataFrame.time,  DataFrame.time <= curr_time)
                              .all())
                    print("IDI data:")
                    print(data)
                    prev_time = curr_time
            finally:
                db.close()

    def get_IDI_data(self):
        pass
    
    def get_data(self, stationName, data_time_len, events_time_len):
        max_time = self.dbUser.get_max_timestamp(self.cfg.identifier)
        res = self.get_frequency_time(data_time_len, max_time)
        res = {
            'time': res['time'],
            'num_pmu': res['num_pmu'],
            'pmus': [{'stationname': station, 'frequency': res['pmus'][station]['frequency']} for station in res['pmus']]
        }
        data = self.get_events(stationName, events_time_len)
        res['events'] = data
        return res
    
    def get_frequency_time(self, time_window, timestamp):
        if timestamp is None:
            print("Data not found")
            return None
        data = self.dbUser.get_frequency_dataframes(self.cfg.identifier, time_window, timestamp)
        num_pmu = data[0][2]
        station_names = data[0][3]
        res = {
            'time': [d[0] for d in data],
            'num_pmu': num_pmu,
            'pmus': {station_names[j] : {'frequency': [d[1][j] for d in data] } for j in range(num_pmu)}
        }
        
        return res
    
    def detect_events(self):
        prev_max_time = None
        while True:
            try:
                if self.interrupt_event.is_set():
                    if self.interrupt_action == interruptType.CLOSE_CONN.value:
                        break
                    else:
                        pass
                assert self.event_detection_param['windowLen'] == self.eventWindowLens['islandingEvent'], "islanding event and event detection window is not same"
                
                max_time = self.dbUser.get_max_timestamp(self.cfg.identifier)
                if prev_max_time is None or max_time == prev_max_time:
                    prev_max_time = max_time
                    continue
                prev_max_time = max_time
                
                self.db_data = self.get_frequency_time(self.eventWindowLens['islandingEvent'], max_time)
                
                if self.db_data is None:
                    continue
            
                left_index = bisect_left(self.db_data['time'], max_time - timedelta(self.eventWindowLens['islandingEvent']))
                
                data = {}
                data['pmus'] = {}
                data['time'] = self.db_data['time'][left_index: ]
                for pmu in self.db_data['pmus']:
                    data['pmus'][pmu] = {
                        'freq': []
                    }
                    data['pmus'][pmu]['freq'] = self.db_data['pmus'][pmu]['frequency'][left_index: ]
                
                if len(data['pmus'].keys()) > 1:
                    freq_data = []
                    time_data = data['time']
                    for pmu in data['pmus']:
                        freq_data.append(data['pmus'][pmu]['freq'])
                    classifiedData, isFault = islandingEventClassification(freq_data, time_data, self.threshold_values['islandingEvent'])
                    res = []
                    if isFault:
                        res.append(self.cfg.identifier)
                        res.append(len(data['pmus']))
                        res.append([pmu for pmu in data['pmus'].keys()])
                        res.append(freq_data)
                        res.append(time_data)
                        res.append(self.threshold_values['islandingEvent'])
                        self.dbUser.store_events(res, 'islanding')
                        
                for pmu in data['pmus']:
                    fault_data, isDetected = getFault(data['pmus'][pmu]['freq'], data['time'], self.event_detection_param['rocof_sd_threshold'])
                    if isDetected:
                        curr_minTime_ptr = max(self.dbUser.get_min_timestamp(self.cfg.identifier), min(data['time']) - timedelta(seconds=int(self.event_classify_buffer)))
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
    
    def classify_events(self):
        print("Started detecting and classifying events...")
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
                
                for pmu in self.db_data['pmus']:
                    if self.event_ptr[pmu]["minTime_ptr"] is None:
                        time.sleep(0.2)
                        continue
                    if self.event_ptr[pmu]['currTime_ptr'] > min(self.event_ptr[pmu]['maxTime_ptr'], self.db_data['time'][-1]):
                        time.sleep(0.2)
                        continue
                    faults = defaultdict(lambda: {})
                    eventsData = defaultdict(lambda: defaultdict(lambda: {'freq': [], 'time': []}))

                    for event in self.eventWindowLens.keys():
                        assert self.event_ptr[pmu]['currTime_ptr'] <= max(self.db_data['time']), self.event_ptr[pmu]
                        window_len = self.eventWindowLens[event]
                        left_index = bisect_left(self.db_data['time'], self.event_ptr[pmu]['currTime_ptr'] - timedelta(seconds=window_len))
                        right_index = bisect_right(self.db_data['time'], self.event_ptr[pmu]['currTime_ptr'])
                        if left_index > right_index:
                            right_index = left_index
                        eventsData[event]['freq'] = self.db_data['pmus'][pmu]['frequency'][left_index: right_index]
                        eventsData[event]['time'] = self.db_data['time'][left_index: right_index]
                    
                    freq_data = eventsData['oscillatoryEvent']['freq']
                    time_data = eventsData['oscillatoryEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = oscillatoryEventClassification(freq_data, time_data, self.threshold_values['oscillatoryEvent'])
                        res = []
                        if isFault:
                            res.append(self.cfg.identifier)
                            res.append(pmu)
                            res.append(freq_data)
                            res.append(classifiedData[0]) # power
                            res.append(classifiedData[1]) # fft frequency
                            res.append(time_data)
                            res.append(self.threshold_values['oscillatoryEvent'])
                            self.dbUser.store_events(res, 'oscillatory')
                        faults['oscillatory'] = isFault
                    
                    freq_data = eventsData['impulseEvent']['freq']
                    time_data = eventsData['impulseEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = impulseEventClassification(freq_data, time_data, self.threshold_values['impulseEvent'])
                        res = []
                        if isFault:
                            res.append(self.cfg.identifier)
                            res.append(pmu)
                            res.append(freq_data)
                            res.append(classifiedData[0]) # rocof
                            res.append(time_data)
                            res.append(self.threshold_values['impulseEvent'])
                            self.dbUser.store_events(res, 'impulse')
                        faults['impulse'] = isFault
                    
                    freq_data = eventsData['genloadLossEvent']['freq']
                    time_data = eventsData['genloadLossEvent']['time']
                    if len(freq_data) > 5:
                        classifiedData, isFault = gen_load_LossClassification(freq_data, time_data, self.threshold_values['stepChange'])
                        res = []
                        if isFault:
                            res.append(self.cfg.identifier)
                            res.append(pmu)
                            res.append(freq_data)
                            res.append(time_data)
                            res.append(self.threshold_values['stepChange'])
                            self.dbUser.store_events(res, 'genLoss' if classifiedData[-1] == 'gen' else 'loadLoss')
                        faults['genloadLoss'] = isFault
                    self.event_ptr[pmu]['currTime_ptr'] += timedelta(seconds=self.event_classify_step)
            except Exception as e:
                print(f"An error occurred in fault classification: {str(e)}")
                return {'error': 'An unexpected error occurred'}, False

    def get_event_analytics(self, eventtype, mintime, maxtime):
        data = None
        res = None
        if eventtype == 'oscillatory':
            data = self.dbUser.get_oscillatory_data(mintime, maxtime)
            res = {
                'stationname': data[0][0],
                'freq': data[0][1],
                'power': data[0][2],
                'fft': data[0][3],
                'time': data[0][4],
                'threshold': data[0][5]
            }
        elif eventtype == 'impulse':
            data = self.dbUser.get_impulse_data(mintime, maxtime)
            res = {
                'stationname': data[0][0],
                'freq': data[0][1],
                'rocof': data[0][2],
                'time': data[0][3],
                'threshold': data[0][4]
            }
        elif eventtype == 'genloss':
            data = self.dbUser.get_genloss_data(mintime, maxtime)
            res = {
                'stationname': data[0][0],
                'freq': data[0][1],
                'time': data[0][2],
                'threshold': data[0][3]
            }
        elif eventtype == 'loadloss':
            data = self.dbUser.get_loadloss_data(mintime, maxtime)
            res = {
                'stationname': data[0][0],
                'freq': data[0][1],
                'time': data[0][2],
                'threshold': data[0][3]
            }
        elif eventtype == 'islanding':
            data = self.dbUser.get_islanding_data(mintime, maxtime)
            res = {
                'stationnames': data[0][0],
                'freq': data[0][1],
                'time': data[0][2],
                'threshold': data[0][3]
            }
        else:
            raise NotImplementedError
        return res