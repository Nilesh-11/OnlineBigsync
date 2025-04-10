import React from 'react';
import ChartComponent from './../../../Plots/Chart';
import { Box, Typography, Card, CardContent, useTheme, Container } from '@mui/material';

const Impulse = ({ data }) => {
    const theme = useTheme();

    const cardStyle = {
        mb: 2,
        boxShadow: 3,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        borderRadius: 2
    };

    return (
        <Box>
            <Container>
                <Card sx={cardStyle}>
                    <CardContent>
                        <ChartComponent
                            title="Frequency vs Time"
                            labels={data.time}
                            datasets={[{
                                label: 'Frequency',
                                data: data.freq,
                                borderColor: 'blue',
                                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                                tension: 0.4
                            }]}
                        />
                    </CardContent>
                </Card>

                <Card sx={cardStyle}>
                    <CardContent>
                        <ChartComponent
                            title="Rate of Change of Frequency (ROCOF)"
                            labels={data.time}
                            datasets={[{
                                label: 'ROCOF',
                                data: data.rocof,
                                borderColor: 'red',
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                tension: 0.4
                            }]}
                        />
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Impulse;