import React from 'react';
import Plot from 'react-plotly.js';

const PlotlyPlot = (props) => {
  let [xData, yData, xLabel, yLabel, title] = props.props;

  if (!xData || !yData || yData.length === 0) {
    xData=[];
    yData=[]

  }

  // Check if yData is an array or an array of arrays
  const traces = Array.isArray(yData[0])
    ? yData.map((y, index) => ({
        x: xData,
        y,
        mode: 'lines',
        name: `Data ${index + 1}`, // Customize the legend label
      }))
    : [
        {
          x: xData,
          y: yData,
          mode: 'lines',
          name: 'Data 1', // Customize the legend label
        },
      ];

  return (
    <Plot
      data={traces}
      layout={{
        title: title,
        xaxis: {
          title: xLabel,
        },
        yaxis: {
          title: yLabel,
        },
      }}
    />
  );
};

export default PlotlyPlot;
