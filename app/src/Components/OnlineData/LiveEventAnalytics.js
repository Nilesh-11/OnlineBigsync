import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Card, CardContent, Grid, useTheme } from '@mui/material';
import fetchData from './utils/API/FetchEvents';
import { serverAddress } from './../../GLOBAL';
import Oscillatory from './utils/Events/Oscillatory';
import Loss from './utils/Events/Loss';
import Islanding from './utils/Events/Islanding';
import Impulse from './utils/Events/Impulse';
import dayjs from 'dayjs';
import PlaceIcon from '@mui/icons-material/Place';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const LiveEventAnalytics = () => {
    const [searchParams] = useSearchParams();
    const theme = useTheme();

    const eventType = searchParams.get('eventType');
    const minTime = searchParams.get('minTime');
    const maxTime = searchParams.get('maxTime');

    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        if (!eventType || !minTime || !maxTime) {
            setError(true);
            return;
        }

        const fetchDataFromAPI = async () => {
            const response = await fetchData({
                eventtype: eventType,
                mintime: minTime,
                maxtime: maxTime
            }, serverAddress + 'live-events-analytics');

            if (response && response.status === 'success') {
                const formattedData = {
                    ...response.data,
                    time: response.data.time.map(t => dayjs(t).format('MM/DD/YYYY HH:mm:ss'))
                };
                setData(formattedData);
            } else {
                setError(true);
            }
            setLoading(false);
        };

        fetchDataFromAPI();
    }, [eventType, minTime, maxTime]);

    if (loading) return <Box textAlign="center"><CircularProgress /><Typography mt={2}>Fetching event data...</Typography></Box>;
    if (error) return <Box textAlign="center"><Typography color="error">Failed to load data</Typography></Box>;

    const renderEventComponent = () => {
        switch (eventType.toLowerCase()) {
            case 'oscillatory':
                return <Oscillatory data={data} />;
            case 'impulse':
                return <Impulse data={data} />;
            case 'genloss':
            case 'loadloss':
                return <Loss data={data} />;
            case 'islanding':
                return <Islanding data={data} />;
            default:
                return <Typography>No valid plots available for this event type</Typography>;
        }
    };

    return (
        <Box padding={3} 
        sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
            minHeight: '100vh', // Ensure the container always covers the full viewport
        }}
        >
            <Typography variant="h5" fontWeight="bold" color={theme.palette.mode === 'dark' ? '#fff' : '#000'}>
                Live Event Analytics - {eventType.toUpperCase()}
            </Typography>

            <Grid container spacing={2} mt={2}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ boxShadow: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <PlaceIcon color="primary" />
                                <Typography variant="body1"><strong>Station Name:</strong></Typography>
                            </Box>
                            <Typography variant="h6" color="text.secondary">
                                {data.stationname || data.stationnames?.join(', ')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ boxShadow: 3 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                                <TrendingUpIcon color="secondary" />
                                <Typography variant="body1"><strong>Threshold Value:</strong></Typography>
                            </Box>
                            <Typography variant="h6" color="text.secondary">
                                {data.threshold}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box mt={3}>
                {renderEventComponent()}
            </Box>
        </Box>
    );
};

export default LiveEventAnalytics;