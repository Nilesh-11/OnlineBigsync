import { IconButton, Box, Container } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import actionToServer from './utils/API/ServerAction';
import closeConnectionCode from './utils/_variable';
import GLOBAL from '../../GLOBAL';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
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
        <Container>
            <Box display="flex" justifyContent="center" alignItems="center" mt={4}>
                <IconButton 
                    onClick={handleCloseConnection} 
                    color="primary"
                    style={{
                        width: '60px', // Width and height of the circular button
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#1976d2', // Primary blue color (can adjust based on theme)
                    }}
                    disabled={isClosingConn}
                >
                    <PowerSettingsNewIcon fontSize="large" style={{ color: 'white' }} />
                </IconButton>
            </Box>
        </Container>
    );
}

export default ConnectionDashboard;
