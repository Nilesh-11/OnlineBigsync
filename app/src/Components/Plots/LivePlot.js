import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartComponent = ({
  yAxisData = [],
  xAxisData = [],
  title = "Live Chart",
  xAxisLabel = "Time",
  yAxisLabel = "Value",
  curveColor = 'rgba(75, 192, 192, 1)',
  yMin = 45,
  yMax = 65,
}) => {
  // console.log(xAxisData);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Adjust colors based on theme
  const textColor = isDarkMode ? '#ddd' : '#333';
  const gridColor = isDarkMode ? '#555' : '#ddd';
  const chartBackground = isDarkMode ? 'rgba(50, 50, 50, 0.2)' : 'rgba(200, 200, 200, 0.2)';

  const data = {
    labels: xAxisData.length > 0 ? xAxisData : Array.from({ length: 10 }, (_, i) => i + 1),
    datasets: [
      {
        label: title,
        data: yAxisData.length > 0 ? yAxisData : Array(10).fill((yMin + yMax) / 2), // Default value at mid-range
        borderColor: curveColor,
        backgroundColor: `${curveColor}50`, // Subtle fill color (30% opacity)
        fill: false,
        tension: 0.3, // Slightly smoother curve
        spanGaps: false,
        pointRadius: 2, // Smaller point size
        pointHoverRadius: 4, // Subtle hover effect
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: textColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          beginAtZero: false,
        },
        min: yMin,
        max: yMax,
      },
    },
    plugins: {
      title: {
        display: true,
        text: title,
        color: textColor,
      },
      tooltip: {
        backgroundColor: chartBackground,
        titleColor: textColor,
        bodyColor: textColor,
        callbacks: {
          label: (tooltipItem) => `Value: ${tooltipItem.raw}`,
        },
      },
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default ChartComponent;
