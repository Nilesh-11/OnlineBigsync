import { Button, Typography, Container, Box } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import actionToServer from '../../utils/liveServerAction';
import closeConnectionCode from './utils/_variable'
import GLOBAL from '../../GLOBAL';

const serverAddress = GLOBAL.serverAddress;

const imageStyles = {
    width: '200px',
    height: 'auto',
    transition: 'transform 0.5s ease', // Add a smooth transition
};

const LiveDashboard = () => {
    const navigate = useNavigate();

    const handleCloseConnection = async() => {
        const responseData = await actionToServer([closeConnectionCode, "None"], serverAddress + 'action-server', navigate);
        if (responseData.status == "success"){
            setTimeout(() =>{
                navigate('/live-home')
            }, 500)
        }
        else{
            setTimeout(() => {
                navigate('/error-page');
            }, 500);
        }
    };

    return (
        <Container maxWidth="sm">
            
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
            >
                Close
            </Button>
            </div>
        </Container>
      );
}

export default LiveDashboard;