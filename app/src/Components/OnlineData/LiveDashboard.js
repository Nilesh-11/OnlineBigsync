import { Box } from '@mui/material';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import GLOBAL from '../../GLOBAL';
import { useTheme } from '@mui/material/styles';
import EventDetection from './EventDetection';
import TopNavbar from './utils/topnav';
import StationForm from './InertiaDistribution';

const serverAddress = GLOBAL.serverAddress;

const LiveDashboard = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const location = useLocation();
    const { threshold_values, event_WindowLens, window_lens } = location.state || {};
    const [currMenu, setCurrMenu] = useState("Inertia Distribution");
    const menuItems = [
        { label: 'Inertia Distribution'},
        { label: 'Events Detection'},
    ];

    const handleMenuClick = (label) => {
        setCurrMenu(label);
    }

    return (
        <Box>
            <Box>
                <TopNavbar isDarkMode={isDarkMode} drawerItems={menuItems} handleMenuClick={handleMenuClick}></TopNavbar>
            </Box>
            <Box>
                {currMenu == "Events Detection" && (<EventDetection event_WindowLens={event_WindowLens} threshold_values={threshold_values} window_lens={window_lens}></EventDetection>)}
                {currMenu == "Inertia Distribution" && (<StationForm />)}
            </Box>
        </Box>
    );
};

export default LiveDashboard;
