import { Button, Typography, Box } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import actionToServer from './utils/API/ServerAction';
import closeConnectionCode from './utils/_variable';
import GLOBAL from '../../GLOBAL';

const serverAddress = GLOBAL.serverAddress;
const ConnectionDashboard = () => {
    const navigate = useNavigate();
    const [isClosingConn, setIsClosingConn] = useState(false);

    const handleCloseConnection = async() => {
        setIsClosingConn(true);
        const responseData = await actionToServer([closeConnectionCode, "None"], serverAddress + 'action-server', navigate);
        setIsClosingConn(false);
        if (responseData.status === "success"){
            navigate('/live-home');
        }
        else{
            navigate('/error-page', {state : {message:responseData.message, status_code: responseData.message}});
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems:'center' }}>
            <Box mt={4} align="center">
                <Typography variant="h6" gutterBottom>
                    Close connection to the server
                </Typography>
            </Box>
            <Button 
                variant="contained" 
                color="primary"
                onClick={handleCloseConnection} 
                style={{ marginTop: '20px' }}
                disabled={isClosingConn}
            >
            {isClosingConn ? 'Closing...' : 'Close'}
            </Button>
        </div>
      );
}

export default ConnectionDashboard;