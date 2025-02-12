import React, { useState, useEffect } from 'react';
import RealTimeChart from './Plots/LivePlot';
import { Container } from '@mui/material';
import CustomSelect from './Common/Select';

const Test = () => {
  const [yAxisData, setYAxisData] = useState(Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)));
  const [xAxisData, setXAxisData] = useState(Array.from({ length: 5 }, (_, i) => i + 1));

  // For simulating live data
  useEffect(() => {
    const interval = setInterval(() => {
      setXAxisData(prevData => [...prevData, prevData.length + 1]); // adding a new x-axis value
      setYAxisData(prevData => [...prevData, Math.floor(Math.random() * 100)]); // adding a new random y-axis value
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div>
      <Container maxWidth='sm'>
        <RealTimeChart
          title="Live Data Chart"
          xAxisLabel="Time"
          yAxisLabel="Value"
          xAxisLimit={[1, 10]}
          yAxisLimit={[0, 100]}
          xAxisData={xAxisData}
          yAxisData={yAxisData}
          curveColor="rgba(255, 99, 132, 1)"
        />
      </Container>
      <CustomSelect options={['Option 1', 'Option 2', 'Option 3']} onSelect={(value) => console.log(value)} />
    </div>
  );
}

export default Test;
