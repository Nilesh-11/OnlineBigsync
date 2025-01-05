// Import necessary libraries
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const RealTimeChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Dataset 1',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  });

  const addDataset = () => {
    setChartData((prevData) => {
      const newDataset = {
        label: `Dataset ${prevData.datasets.length + 1}`,
        data: [],
        borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
          Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 1)`,
        backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
          Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 0.2)`,
        borderWidth: 2,
        tension: 0.4,
      };
      return {
        ...prevData,
        datasets: [...prevData.datasets, newDataset],
      };
    });
  };

  const removeDataset = () => {
    setChartData((prevData) => {
      if (prevData.datasets.length > 1) {
        return {
          ...prevData,
          datasets: prevData.datasets.slice(0, -1),
        };
      }
      return prevData;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prevData) => {
        const now = new Date().toLocaleTimeString();
        const updatedDatasets = prevData.datasets.map((dataset) => {
          const newValue = Math.floor(Math.random() * 100);
          let updatedData = [...dataset.data, newValue];
          if (updatedData.length > 20) {
            updatedData.shift();
          }
          return {
            ...dataset,
            data: updatedData,
          };
        });

        let updatedLabels = [...prevData.labels, now];
        if (updatedLabels.length > 20) {
          updatedLabels.shift();
        }

        return {
          labels: updatedLabels,
          datasets: updatedDatasets,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Real-Time Chart</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={addDataset} style={{ marginRight: '10px' }}>Add Dataset</button>
        <button onClick={removeDataset}>Remove Dataset</button>
      </div>
      <Line
        data={chartData}
        options={{
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Value',
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default RealTimeChart;
