import numpy as np
from algos.Algorithms.Faults.FD_Algo import FaultDetection
import json
import math

def removeNan(arr):
    curr = 60
    for i in range(len(arr)):
        if math.isnan(arr[i]) or arr[i] == 0:
            arr[i] = curr
        else:
            curr = arr[i]
    return arr
def is_array_of_numbers(arr):
    return all(isinstance(item, (int, float)) for item in arr)

class EventClassification(FaultDetection):
    def __init__(self,data,time,thresholdValues):
        self._time_data = np.array(time)
        self._freq_data = removeNan(np.array(data)) if is_array_of_numbers(np.array(data)) else np.array(data)
        self._KalmanFilter = FaultDetection._KalmanFilter
        # Events
        self.isImpulseEvent = False
        self.isGenLossEvent = False
        self.isLoadLossEvent = False
        self.isOscillatoryEvent = False
        self.isIslandingEvent = False
        self.thresholdValues = thresholdValues

    def _impulseEvent(self):
        try:
            time_data = self._time_data
            win_size = 10
            win_size = int(len(time_data)/((time_data[-1]-time_data[0])/win_size))
            duration = time_data[-1] - time_data[0]
            n_samples = len(time_data)
            k = duration/n_samples
            time_data = np.linspace(0,duration,n_samples)    
            i = 0
            th_impulse = float(self.thresholdValues['impulseEvent'])
            while(i < len(self._freq_data)):
                curr_data = self._freq_data[i:i+win_size]
                kalman_filter_output = self._KalmanFilter(FaultDetection(),curr_data)
                rocof_data = kalman_filter_output[2]
                max_rocof = max(rocof_data)
                if((max_rocof)>th_impulse):
                    self.isImpulseEvent = True
                    return [rocof_data.tolist(),time_data[i:i+win_size].tolist()]
                i += win_size
            return []
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in _impulseEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'})

    def _stepChangeEvent(self):
        try:
            time_data = self._time_data
            win_size = 20
            win_size = int(len(time_data)/((time_data[-1]-time_data[0])/win_size))
            duration = time_data[-1] - time_data[0]
            n_samples = len(time_data)
            k = duration/n_samples
            time_data = np.linspace(0,duration,n_samples)    
            i = 0
            arr = []
            th_step = float(self.thresholdValues['stepChange'])
            while(i < len(self._freq_data)):
                
                curr_data = np.array(self._freq_data[i:i+win_size])
                curr_time_data = np.array(self._time_data[i:i+win_size])
                f_max_index = np.argmax(curr_data)
                f_max = curr_data[f_max_index]
                t_max = curr_time_data[f_max_index]
                f_min_index = np.argmin(curr_data)
                f_min = curr_data[f_min_index]
                t_min = curr_time_data[f_min_index]
                
                if(abs(t_max - t_min) > 10 and abs(f_max - f_min) > th_step):
                    slope_avg = (f_min-f_max)/(t_min-t_max)
                    if slope_avg < 0:
                        self.isGenLossEvent = True
                        return [curr_data.tolist(),time_data[i:i+win_size].tolist(),'gen']
                    else:
                        self.isLoadLossEvent = True
                        return [curr_data.tolist(),time_data[i:i+win_size].tolist(),'load']
                i += win_size
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in _stepChangeEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'})
                
            
        return [[],[]]
    def _oscillatoryEvent(self):
        try:    
            P_th = float(self.thresholdValues['oscillatoryEvent'])
            time_data = self._time_data
            fs = 1/(time_data[1] - time_data[0])
            win_size = 10
            win_size = int(len(time_data)/((time_data[-1]-time_data[0])/win_size))
            duration = time_data[-1] - time_data[0]
            n_samples = len(time_data)
            k = duration/n_samples
            time_data = np.linspace(0,duration,n_samples)    
            i = 0
            while(i < len(self._freq_data)):
                curr_data = self._freq_data[i:i+win_size]
                kalman_filter_output = self._KalmanFilter(FaultDetection(),curr_data)
                rocof_data = kalman_filter_output[2]
                fft_result = np.fft.fft(rocof_data)
                power_spectrum = np.abs(fft_result) ** 2
                power_spectrum_db = 10 * np.log10(power_spectrum)
                frequencies = np.fft.fftfreq(len(fft_result), 1 / fs)
                for j in range(len(frequencies)):
                    f = frequencies[j]
                    if f < 0.05:
                        continue
                    elif f>4:
                        break
                    else:
                        if power_spectrum_db[j] > P_th:
                            self.isOscillatoryEvent = True
                            return [power_spectrum_db.tolist(),frequencies.tolist()]
                i += win_size
            return [[],[]]
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in _oscillatoryEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'})
        
    def islandingEvent(self,data):
        try:
            f_th =float(self.thresholdValues['islandingEvent'])
            time_data = data[0]
            freqs_data = data[1]
            for i in range(len(freqs_data)):
                freqs_data[i] = removeNan(freqs_data[i])
            for x in range(len(freqs_data)):
                freqs_data[x] = freqs_data[x]
            win_size = 10
            win_size = int(len(time_data)/((time_data[-1]-time_data[0])/win_size))
            duration = time_data[-1] - time_data[0]
            n_samples = len(time_data)
            k = duration/n_samples
            time_data = np.linspace(0,duration,n_samples)    
            i = 0
            while(i < len(freqs_data[0])):
                # curr_data = self._freq_data[i:i+win_size]
                f_max_s = freqs_data[0][i]
                f_max_e = freqs_data[0][i+win_size-1]
                f_min_s = freqs_data[0][i]
                f_min_e = freqs_data[0][i+win_size-1]
                for j in range(len(freqs_data)):
                    f_max_s = max(freqs_data[j][i],f_max_s)
                    f_max_e = max(freqs_data[j][i+win_size-1],f_max_e)
                    f_min_s = min(freqs_data[j][i],f_min_s)
                    f_min_e = min(freqs_data[j][i+win_size-1],f_min_e)
                del_fs = f_max_s - f_min_s
                del_fe = f_max_e - f_min_e
                r = []
                if(del_fs < f_th and del_fe > f_th):
                    for x in range(len(freqs_data)):
                        r.append(freqs_data[x][i:i+win_size])
                    res = {"Impulse event":'NA',"Generation Loss Event":'NA',"Load Loss Event":'NA',"Oscillatory Event":'NA',"Islanding Event":True}
                    return {'data':[[[],[]],[[],[]],[[],[]],[[],[]],[r,time_data[i:i+win_size].tolist()]],'result':res}
                i += win_size
                res = {"Impulse event":'NA',"Generation Loss Event":'NA',"Load Loss Event":'NA',"Oscillatory Event":'NA',"Islanding Event":False}
                return {'data':[[[],[]],[[],[]],[[],[]],[[],[]],[[],[]]],'result':res}

            return [[],[]]
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in islandingEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'})
    
    def classifyEvents(self):
        try:
            impulse_data = self._impulseEvent()
            stepChangeData = self._stepChangeEvent()
            if stepChangeData[-1] == 'gen':
                genLossEventData = stepChangeData[:len(stepChangeData)-1]
                loadLossEventData = [[],[]]
            else:
                loadLossEventData = stepChangeData[:len(stepChangeData)-1]
                genLossEventData = [[],[]]
            oscialltoryEventData = self._oscillatoryEvent()
            islandingData = [[],[]]
            res = {"Impulse event":self.isImpulseEvent,"Generation Loss Event":self.isGenLossEvent,"Load Loss Event":self.isLoadLossEvent,"Oscillatory Event":self.isOscillatoryEvent,"Islanding Event":'NA'}
            return json.dumps({'data':[impulse_data,genLossEventData,loadLossEventData,oscialltoryEventData,islandingData],'result':res})   
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in _impulseEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'})