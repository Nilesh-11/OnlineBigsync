import React from 'react';
import Plot from 'react-plotly.js';

function MyBarChart({ values, xData,title }) {
  // Create a trace for the bar chart
  let v = []
  values.forEach((i)=>{
    v.push(Math.abs(i))
  })
  const trace = {
    x: xData,
    y: v,
    type: 'bar',
  };

  // Create a layout for the chart
  const layout = {
    width: 500,
    height: 300,
    title: title,
    xaxis: {
    },
    yaxis: {
    },
  };

  return (
    <Plot
      data={[trace]}
      layout={layout}
    />
  );
}

export default MyBarChart;
