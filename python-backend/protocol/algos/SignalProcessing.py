import numpy as np

class SignalProcessing:
    def __init__(self):
        self._T = 0.02
        self._Q = np.array([[0.001, 0], [0, 1]])
        self._R = 0.01
        self._Xcap_ = np.array([[50, 0]]).T 
        self._Pk_ = np.array([[10, 0], [0, 10]])
        self._Ad = np.array([[1,self._T], [0, 1]])
        self._Cd = np.array([[1, 0]])
        self._Bd = np.array([[0, 0]])
    
    def _KalmanFilter(self,Vo):
        try:
            N = len(Vo)
            m =int(1/self._T)
            k1 = np.arange(0, N)
            y = np.arange(0, N)
            xestimate = np.zeros((N, 2))
            for k in range(N):
                Yk = Vo[k]
                Xcap = (self._Ad @ self._Xcap_) #2x2 x 2x1 = 2x1
                Pk = (self._Ad @ self._Pk_ @ self._Ad.T) + self._Q
                K_ = (Pk @ self._Cd.T) / (self._Cd @ Pk @ self._Cd.T + self._R)
                self._Xcap_ = Xcap + K_*(Yk-(self._Cd@Xcap))
                self._Pk_ = Pk - (K_@self._Cd)@Pk
                xestimate[k, 0] = self._Xcap_[0]
                xestimate[k, 1] = self._Xcap_[1]
                k1[k] = k
                y[k] = Yk
            f_est = xestimate[:, 0]
            dfbydt_est = xestimate[:, 1]
            Mvar_dfbydt = self._movingvar(dfbydt_est,m)
            return [k1,f_est,dfbydt_est,Mvar_dfbydt]
        except Exception as e:
            # Handle the exception, log it, and return a generic error response
            print(f"{'error': 'An unexpected error occurred'}")
    
    def _movingvar(self,x, m):
        try:
            n = x.shape[0]
            f = np.zeros(m)+  1/ m
            if len(x) == 0:
                return []
            v = np.convolve(x**2, f, mode='valid') - np.convolve(x, f, mode='valid')**2
            m2 = m // 2
            n2 = (m // 2) - 1
            start_idx = m2 + 1
            end_idx = n - n2
            v = v[start_idx:end_idx]
            return v
        except Exception as e:
            print(f"{'error': 'An unexpected error occurred'}")