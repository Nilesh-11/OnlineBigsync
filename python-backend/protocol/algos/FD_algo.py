from protocol.Utils.utils import removeNan
from protocol.algos.SignalProcessing import SignalProcessing
import numpy as np

def getFault(data,time,sd_th):
    try:
        assert len(data) == len(time), f"Length of data({len(data)}) and time({len(time)}), do not match"
        
        _rocof_sd_threshold = sd_th
        time_data = time
        freq_data = removeNan(data)
    
        duration = time_data[-1] - time_data[0]
        n_samples = len(time_data)
        time_data = np.linspace(0,duration,n_samples)    

        curr_data = freq_data
        kalman_filter_output = SignalProcessing._KalmanFilter(SignalProcessing(), curr_data)
        rocof_data = kalman_filter_output[2]
        sd_rocof = np.std(rocof_data)
        if((sd_rocof)>_rocof_sd_threshold):
            return [kalman_filter_output[1],rocof_data,time_data]
        return None
    except Exception as e:
        # Handle the exception, log it, and return a generic error response
        print(f"{'error': 'An unexpected error occurred'}")