import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartComponent = ({
  yAxisData = [],               // Default: empty array
  xAxisData = [],               // Default: empty array
  title = "Live Chart",         // Default title
  xAxisLabel = "Time",          // Default X-axis label
  yAxisLabel = "Value",         // Default Y-axis label
  curveColor = 'rgba(75, 192, 192, 1)', // Default curve color
}) => {
  const data = {
    labels: xAxisData.length > 0 ? xAxisData : Array.from({ length: 10 }, (_, i) => i + 1), // Default X labels
    datasets: [
      {
        label: title,
        data: yAxisData.length > 0 ? yAxisData : Array(10).fill(50), // Default Y values
        borderColor: curveColor,
        backgroundColor: `${curveColor}80`,
        fill: false,
        tension: 0,
        spanGaps: false,
        pointRadius: 3,
        pointHoverRadius: 5,
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
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
        },
        ticks: {
          beginAtZero: true, // Ensure Y-axis starts from 0
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `Value: ${tooltipItem.raw}`, // Show value on hover
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default ChartComponent;
