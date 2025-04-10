import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, zoomPlugin);

const ChartComponent = ({ title, labels, datasets }) => {
    const theme = useTheme();

    const data = {
        labels,
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: theme.palette.text.primary
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    modifierKey: 'ctrl', // Hold 'ctrl' to pan
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                    drag: {
                        enabled: true
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time',
                    color: theme.palette.text.primary
                },
                ticks: {
                    color: theme.palette.text.primary
                },
                grid: {
                    color: theme.palette.divider
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Value',
                    color: theme.palette.text.primary
                },
                ticks: {
                    color: theme.palette.text.primary
                },
                grid: {
                    color: theme.palette.divider
                }
            }
        }
    };

    return (
        <Box mb={3} display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6" fontWeight="bold" color="text.primary">{title}</Typography>
            <Box width="100%" height={400}>
                <Line id="chartCanvas" data={data} options={options} />
            </Box>
        </Box>
    );
};

export default ChartComponent;
