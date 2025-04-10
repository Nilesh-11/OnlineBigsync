import React from 'react';
import ChartComponent from './../../../Plots/Chart';
import { Box, Typography, Card, CardContent, useTheme, Container } from '@mui/material';

const GenLoss = ({ data }) => {
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
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: false
                                    }
                                },
                                plugins: {
                                    annotation: {
                                        annotations: {
                                            line1: {
                                                type: 'line',
                                                yMin: data.threshold,
                                                yMax: data.threshold,
                                                borderColor: 'red',
                                                borderWidth: 2,
                                                label: {
                                                    content: 'Threshold',
                                                    enabled: true,
                                                    position: 'end'
                                                }
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default GenLoss;