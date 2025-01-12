from protocol.frames import *
from Utils.utils import *
from Utils.process_frames import *
from DatabaseManager import *
import socket
import pandas as pd
import os
import threading
from enum import Enum

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
    
    def get_dataframes(self):
        data = self.dbUser.get_dataframes(self.cfg.identifier)
        res = {}
        for i in range(len(data[0])):
            res[self.dbUser.data_column_names[i]] = [row[i] for row in data]
        return res