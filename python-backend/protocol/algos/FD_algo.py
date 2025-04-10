from protocol.Utils.utils import removeNan
from protocol.algos.SignalProcessing import SignalProcessing
import numpy as np

def getFault(freq_data, time_data, _rocof_sd_threshold):
    try:
        assert len(freq_data) == len(time_data), f"Length of data({len(freq_data)}) and time({len(time_data)}), do not match"
        
        freq_data = removeNan(freq_data)

        curr_data = freq_data
        kalman_filter_output = SignalProcessing._KalmanFilter(SignalProcessing(), curr_data)
        rocof_data = kalman_filter_output[2]
        sd_rocof = np.std(rocof_data)
        # print((sd_rocof) > _rocof_sd_threshold)
        if((sd_rocof)>_rocof_sd_threshold):
            return [kalman_filter_output[1].tolist(), rocof_data.tolist(), time_data], True
        return None, False
    
    except Exception as e:
        # Handle the exception, log it, and return a generic error response
        print(f"An error occurred in Fault detection: {str(e)}")
        return {'error': 'An unexpected error occurred in Fault detection algorithm'}, False