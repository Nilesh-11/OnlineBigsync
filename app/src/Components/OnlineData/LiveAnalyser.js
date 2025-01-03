import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const generateRandomData = (count) => {
  const randomData = [];
  const labels = [];
  for (let i = 0; i < count; i++) {
    randomData.push(Math.random() * 100); // Random values between 0 and 100
    labels.push(new Date(Date.now() - (count - i) * 1000).toLocaleTimeString());
  }
  return { randomData, labels };
};

const LiveGraph = () => {
  const initialData = generateRandomData(10);

  const [chartData, setChartData] = useState({
    labels: initialData.labels,
    datasets: [
      {
        label: 'Random Real-Time Data',
        data: initialData.randomData,
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 2,
        fill: false,
      },
    ],
  });

  const [selectedPoint, setSelectedPoint] = useState(null); // State to store the clicked point's data

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const now = new Date();
        const newLabel = now.toLocaleTimeString();
        const newValue = Math.random() * 100;

        return {
          ...prevData,
          labels: [...prevData.labels.slice(-9), newLabel], // Keep the last 10 labels
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...prevData.datasets[0].data.slice(-9), newValue], // Keep the last 10 data points
            },
          ],
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (event, elements) => {
    if (elements.length > 0) {
      const datasetIndex = elements[0].datasetIndex;
      const dataIndex = elements[0].index;
      const label = chartData.labels[dataIndex];
      const value = chartData.datasets[datasetIndex].data[dataIndex];

      setSelectedPoint({ label, value }); // Update the selected point details
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left Box for Detailed Information */}
      <div style={{ marginRight: '20px', border: '1px solid #ccc', padding: '10px', width: '200px' }}>
        <h3>Details</h3>
        {selectedPoint ? (
          <div>
            <p><strong>Time:</strong> {selectedPoint.label}</p>
            <p><strong>Value:</strong> {selectedPoint.value.toFixed(2)}</p>
          </div>
        ) : (
          <p>Click on a point to see details</p>
        )}
      </div>

      {/* Line Chart */}
      <div>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                enabled: true, // Tooltip shows when hovering
              },
            },
          }}
          onClick={(event, elements) => handleClick(event, elements)}
        />
      </div>
    </div>
  );
};

export default LiveGraph;
