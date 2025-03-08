import { Box, Container, Grid, Typography, Button, Drawer } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SettingsIcon from '@mui/icons-material/Settings';
import { Bolt, Waves, Warning, CloudOff, SignalCellularNoSim } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GLOBAL from '../../GLOBAL';
import checkConnection from './utils/API/CheckConnection';
import closeConnection from './utils/API/CloseConnection';
import DataFromServer from './utils/API/DataServer';
import ChartComponent from '../Plots/LivePlot';
import { styles } from './utils/styles';
import CustomSelect from '../Common/Select';
import SettingsPanel from './utils/settingsPanel';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import EventsList from './utils/EventsList';
const serverAddress = GLOBAL.serverAddress;

const eventStyles = {
    loadloss: { color: 'red', icon: <CloudOff /> },
    genloss: { color: 'gray', icon: <SignalCellularNoSim /> },
    impulse: { color: 'blue', icon: <Bolt /> },
    oscillatory: { color: 'purple', icon: <Waves /> },
    islanding: { color: 'green', icon: <Warning /> },
};

const LiveDashboard = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { threshold_values, event_WindowLens, window_lens } = location.state || {};

    const isDarkMode = theme.palette.mode === 'dark';
    const [isClosingConn, setIsClosingConn] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false); // Sidebar state
    const [windowLens, setWindowLens] = useState(window_lens);
    const [eventWindowLens, setEventWindowLens] = useState(event_WindowLens);
    const [thresholdValues, setThresholdValues] = useState(threshold_values);

    const [pmusData, setPmusData] = useState(null);
    const [pmuNames, setPmuNames] = useState(null);
    const [currPmu, setCurrPmu] = useState(null);
    const [freqData, setFreqData] = useState(null);
    const [timeData, setTimeData] = useState(null);
    const [eventsData, setEventsData] = useState(null);

    const handleDisconnect = async () => {
        setIsClosingConn(true);
        const responseData = await closeConnection(serverAddress + 'close-conn');
        setIsClosingConn(false);
        if (responseData.status === "success") {
            navigate('/live-home');
        } else {
            navigate('/error-page', { state: { message: responseData.message, status_code: responseData.message } });
        }
    };

    const updateValues = (newData) => {
        setTimeData(newData.time);
        setEventsData(newData.events);
        const pmus = {};
        const pmunames = [];

        for (let pmu of newData.pmus) {
            if (!pmus[pmu.stationname]) {
                pmus[pmu.stationname] = {};
            }
            pmunames.push(pmu.stationname);
            pmus[pmu.stationname]["frequency"] = pmu.frequency;
        }

        setPmusData(pmus);
        setPmuNames(pmunames);
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            const ConnResp = await checkConnection(serverAddress + 'conn-details');
            if (ConnResp.status !== 'success') {
                navigate('/error-page', { state: { message: ConnResp.message, status_code: ConnResp.status_code } });
            }
            const DataResp = await DataFromServer([windowLens.data, windowLens.events, currPmu], serverAddress + 'data-server');
            if (DataResp && DataResp.status === 'success') {
                updateValues(DataResp.data);
            } else {
                navigate('/error-page', { state: { message: DataResp?.message, status_code: DataResp?.status_code } });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currPmu, windowLens]);

    useEffect(() => {
        if (currPmu) {
            setFreqData(pmusData[currPmu]?.frequency);
        }
    }, [pmusData]);

    useEffect(() => {
        if (!currPmu && pmuNames) {
            setCurrPmu(pmuNames[0]);
        }
    }, [pmuNames]);
    
    const formatTimeData = (timestamps) => {
        return timestamps.map((ts) => dayjs(ts).format('HH:mm:ss.SSS'));
    };

    return (
        <Box
            sx={{
                backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                minHeight: '100vh', // Ensure the container always covers the full viewport
            }}
            >
            <Container
            sx={{
                ...styles.container,
                backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                minHeight: '100vh', // Ensure the container always covers the full viewport
            }}
            >

            <Box sx={styles.headerContainer}>
                <Grid container alignItems="center" justifyContent="space-between">
                {/* Title */}
                <Grid item>
                    <Typography variant="h4" fontWeight="bold">
                    Live Analytics Dashboard
                    </Typography>
                </Grid>

                {/* Select Button */}
                <Grid item>
                    {pmuNames && <CustomSelect options={pmuNames} onSelect={setCurrPmu} />}
                </Grid>

                {/* Buttons (Settings + Disconnect) */}
                <Grid item>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SettingsIcon />}
                        onClick={() => setSettingsOpen(true)}
                        >
                        Settings
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<PowerSettingsNewIcon />}
                        onClick={handleDisconnect}
                        >
                        Disconnect
                    </Button>
                    </Box>
                </Grid>
                </Grid>
            </Box>

            <Box
                sx={{
                    ...styles.chartContainer,
                    // You can also force a background here if needed:
                    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                }}
                >
                <Box
                sx={{
                    ...styles.chart,
                    height: '60vh', // Adjust the graph's height as needed (e.g., 60% of the viewport height)
                }}
                >
                {freqData && timeData && (
                    <ChartComponent
                    xAxisData={formatTimeData(timeData)}
                    yAxisData={freqData}
                    title="Frequency Plot"
                    xAxisLabel="Time"
                    yAxisLabel="Frequency"
                    yaxisMinLimit="50"
                    yaxisMaxLimit="60"
                    />
                )}
                </Box>
                <Box
                sx={{
                    maxWidth: '800px',
                    margin: 'auto',
                    padding: '10px',
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
                    borderRadius: '10px',
                }}
                >
                <EventsList eventsData={eventsData || {}} eventStyles={eventStyles} />
                </Box>
            </Box>

            {/* Sidebar Settings Panel */}
            <Drawer anchor="right" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
                <SettingsPanel
                thresholdValues={thresholdValues}
                eventWindowLens={eventWindowLens}
                windowLens={windowLens}
                setThresholdValues={setThresholdValues}
                setEventWindowLens={setEventWindowLens}
                onClose={() => {setSettingsOpen(false)}}
                setWindowLens={setWindowLens}
                />
            </Drawer>
                </Container>
            </Box>

    );
};

export default LiveDashboard;
