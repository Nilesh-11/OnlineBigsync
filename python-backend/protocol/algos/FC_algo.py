
from protocol.algos.SignalProcessing import SignalProcessing
from protocol.Utils.utils import removeNan, is_2d_array
import numpy as np

def impulseEventClassification(freq_data, time_data, th_impulse):
    try:
        duration = (time_data[-1] - time_data[0]).total_seconds()
        n_samples = len(time_data)
        time_data = np.linspace(0,duration,n_samples)    
        curr_data = freq_data
        kalman_filter_output = SignalProcessing._KalmanFilter(SignalProcessing(), curr_data)
        rocof_data = kalman_filter_output[2]
        max_rocof = max(rocof_data)
        
        if((max_rocof)>th_impulse):
            return [rocof_data.tolist(), time_data], True
        
        return None, False
    except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"An error occurred in _impulseEvent: {str(e)}")
            return ({'error': 'An unexpected error occurred'}), False

def stepChangeEvent(freq_data, time_data, th_step):
    try:
        f_max_index = np.argmax(freq_data)
        f_max = freq_data[f_max_index]
        t_max = time_data[f_max_index]
        
        f_min_index = np.argmin(freq_data)
        f_min = freq_data[f_min_index]
        t_min = time_data[f_min_index]

        if abs((t_max - t_min).total_seconds()) > 10 and abs(f_max - f_min) > th_step:
            slope_avg = (f_min - f_max) / (t_min - t_max).total_seconds()
            if slope_avg < 0:
                return ['gen']
            else:
                return ['load']
    except Exception as e:
        print(f"An error occurred in _stepChangeEvent: {str(e)}")
        return {'error': 'An unexpected error occurred'}

def gen_load_LossClassification(data, time, threshold):
    stepChangeData = stepChangeEvent(data, time, threshold)
    if stepChangeData is not None:
        loadLossData = None
        genLossData = None
        if stepChangeData[-1] == 'gen':
            genLossData = data
            lossType = 'gen'
        else:
            loadLossData = data
            lossType = 'load'
        return [genLossData, loadLossData, lossType], True
    else:
        return None, False

def islandingEventClassification(freqs_data, time_data, f_th):
    try:
        for i in range(len(freqs_data)):
            freqs_data[i] = removeNan(freqs_data[i])

        f_max_s = max(freqs_data[j][0] for j in range(len(freqs_data)))
        f_max_e = max(freqs_data[j][-1] for j in range(len(freqs_data)))
        f_min_s = min(freqs_data[j][0] for j in range(len(freqs_data)))
        f_min_e = min(freqs_data[j][-1] for j in range(len(freqs_data)))

        # Frequency deviation calculation
        del_fs = f_max_s - f_min_s
        del_fe = f_max_e - f_min_e

        if del_fs < f_th and del_fe > f_th:
            return [freqs_data, time_data], True
        
        return None, False

    except Exception as e:
        print(f"An error occurred in islandingEvent: {str(e)}")
        return {'error': 'An unexpected error occurred'}, False

def oscillatoryEventClassification(freq_data, time_data, P_th):
    try:
        fs = 1 / (time_data[1] - time_data[0]).total_seconds()
        kalman_filter_output = SignalProcessing._KalmanFilter(SignalProcessing(), freq_data)
        rocof_data = kalman_filter_output[2]

        fft_result = np.fft.fft(rocof_data)
        power_spectrum = np.abs(fft_result) ** 2
        power_spectrum_db = 10 * np.log10(power_spectrum)
        frequencies = np.fft.fftfreq(len(fft_result), 1 / fs)

        for j, f in enumerate(frequencies):
            if 0.05 <= f <= 4 and power_spectrum_db[j] > P_th:
                return [power_spectrum_db.tolist(), frequencies.tolist()], True

        return [[], []], False

    except Exception as e:
        print(f"An error occurred in oscillatoryEvent: {str(e)}")
        return {'error': 'An unexpected error occurred'}, False

    