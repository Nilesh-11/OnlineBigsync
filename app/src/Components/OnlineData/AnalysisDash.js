import React from 'react';
import RealTimeChart from './../Plots/LivePlot';
import { Container} from '@mui/material';

const AnalysisDashboard = () => {
  return (
    <div>
        <Container maxWidth='sm'>
            <RealTimeChart></RealTimeChart>
        </Container>
    </div>
  );
}

export default AnalysisDashboard;