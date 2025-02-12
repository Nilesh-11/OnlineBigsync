from protocol.frames import *
from protocol.Utils.utils import *
from protocol.Utils.process_frames import *
from protocol.DatabaseManager import *
from algos.event_classification import *
import socket
import pandas as pd
import os
import threading
from enum import Enum
from datetime import datetime, timedelta
from collections import defaultdict

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
        self.threshold_values = {'stepChange': 0.1, 'oscillatoryEvent': 5.0, 'impulseEvent': 2.0, 'islandingEvent': 0.1}
        self.window_lens = {'islandingEvent': 10, 'genloadLossEvent': 10, 'oscillatoryEvent':10, 'impulseEvent': 10}
    
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
                    client.close()
                    break
                self.update_data(data)
            except socket.error as e:
                raise ConnectionError(f"Socket errror : {e}")
            except:
                raise RuntimeError("Error in receiving data.")
    
    def update_data(self, data):
        frame_type = get_frame_type(data[0:2])

        assert ((frame_type & 2 != 0 or frame_type == 5) or self.cfg != None), "Configuration frame not found."

        if frame_type == 0:
            frame = dataFrame(data, 
                              pmuinfo = self.cfg.pmus,
                              time_base = self.cfg.time_base,
                              num_pmu = self.cfg.num_pmu)
            data = process_dataFrame(frame, self.cfg)
        elif frame_type & 2 != 0 or frame_type == 5:
            self.cfg = cfg1(data)
            self.cfg.identifier = generate_unique_identifier(self.ip, self.port)
            data = process_cfg1Frame(self.cfg)
        elif frame_type == 1:
            self.header = headerFrame(data)
        elif frame_type == 4:
            self.command = commandFrame(data)
        else:
            raise NotImplementedError("Not a suitable frametype")
        
        self.datas['data'].append(data) 
        self.datas['type'].append(frame_type)

        if len(self.datas['data']) > self.store_lim:
            self.dbUser.store_frame(self.datas['data'], self.datas['type'])
            self.datas['data'] = []
            self.datas['type'] = []
    
    def get_frequency_time(self, time_window):
        max_timestamp = self.dbUser.get_max_timestamp(self.cfg.identifier)
        assert max_timestamp is not None, "data not found"
        data = self.dbUser.get_frequency_dataframes(self.cfg.identifier, time_window, max_timestamp)
        num_pmu = data[0][2]
        station_names = data[0][3]
        res = {
            'time': [d[0] for d in data],
            'num_pmu': num_pmu,
            'pmus': [{'stationname': station_names[j], 'frequency': [d[1][j] for d in data]} for j in range(num_pmu)]
        }
        
        return res
    
    def detect_events(self):
        pass
    
    def classify_events(self):
        # while True:
        data = self.get_frequency_time(max(self.window_lens.values()))
        max_time = max(data['time'])
        timeDelta = {key: timedelta(seconds=value) for key, value in self.window_lens.items()}
        eventsData = defaultdict(lambda: defaultdict(lambda: {'freq': [], 'time': []}))
        
        for pmuData in data['pmus']:
            for event in self.window_lens.keys():
                for i in range(len(data['time'])):
                    if not eventsData[event][pmuData['stationname']]['freq']:
                        eventsData[event][pmuData['stationname']]['freq'] = []
                    if max_time - timeDelta[event] <= data['time'][i] <= max_time:
                        eventsData[event][pmuData['stationname']]['freq'].append(pmuData['frequency'][i])
                        eventsData[event][pmuData['stationname']]['time'].append(data['time'][i])
        
        print(eventsData)