import React from 'react';
import ChartComponent from './../../../Plots/Chart';
import { Box, Typography, Card, CardContent, useTheme, Container } from '@mui/material';

const Islanding = ({ data }) => {
    const theme = useTheme();

    const cardStyle = {
        mb: 2,
        boxShadow: 3,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        borderRadius: 2
    };

    const datasets = data.stationnames.map((station, index) => ({
        label: station,
        data: data.freq[index],
        borderColor: `hsl(${index * 30}, 70%, 50%)`,
        backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.1)`
    }));

    return (
        <Box>
            <Container>
                <Typography variant="h6" gutterBottom>Islanding Event</Typography>

                <Card sx={cardStyle}>
                    <CardContent>
                        <ChartComponent
                            title="Frequency vs Time for all Stations"
                            labels={data.time}
                            datasets={datasets}
                        />
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Islanding;
