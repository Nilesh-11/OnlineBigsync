import { Container, IconButton} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GLOBAL from '../../GLOBAL';
import ConnectionDashboard from './ConnDash';
import AnalysisDashboard from './AnalysisDash';
import checkConnection from './utils/API/CheckConnection';
import HubIcon from '@mui/icons-material/Hub';
import InsightsIcon from '@mui/icons-material/Insights';

const serverAddress = GLOBAL.serverAddress;

const DashType = {
    0: "ConnectionDash",
    1: "AnalysisDash"
};

const LiveDashboard = () => {
    const navigate = useNavigate();
    const currDash = useState(0);
    const [data, setData] = useState(); 

    useEffect(() =>{
        const interval = setInterval(async() => {
            const resp = await checkConnection(serverAddress + 'conn-details');
            console.log(resp.status)
            if (resp.status === 'success'){
                if (resp.message === 'dataError'){
                    console.error("Received garbage data.");
                }
                else{
                    setData(resp.data);
                }
            }
            else{
                navigate('/error-page', {state: {message: resp.message, status_code: resp.status_code}});
            }
        }, 1000);
        return () => clearInterval(interval)
    }, []);

    const handleSwitchbutton = () =>{
        
    };

    return (
        <Container maxWidth="sm">
            <IconButton aria-label='connDash' onClick={handleSwitchbutton}>
                <HubIcon />
            </IconButton>
        </Container>
      );
}

export default LiveDashboard;